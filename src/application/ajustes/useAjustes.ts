import { useCallback, useEffect, useState } from 'react';

import type { Perfil } from '../../domain/models/perfil';
import { diasEntre, hoy } from '../../domain/rules/fechas';
import { exportar, importar, nombreDeFichero, tamanoKb } from '../../data/copia';
import { useRepositorios } from '../../data/contenedor';
import { almacenAsyncStorage } from '../../platform/almacen';
import { descargarJson, leerJson, soportaFicheros } from '../../platform/ficheros';

/** Días sin copia a partir de los cuales el aviso pasa a ser insistente. */
export const DIAS_AVISO_COPIA = 14;

const CLAVE_ULTIMA = 'ajustes:ultima_copia';
const CLAVE_INSTANTANEA = 'copia:instantanea';

export type EstadoCopia = {
  ultimaCopia: string | null;
  diasSinCopia: number | null;
  urgente: boolean;
  tamanoKb: number | null;
  instantaneaEn: string | null;
};

export type EstadoAjustes = {
  cargando: boolean;
  perfil: Perfil | null;
  copia: EstadoCopia;
  mensaje: string | null;
  trabajando: boolean;
  soportaFicheros: boolean;
  cambiarPerfil: (cambios: Partial<Perfil>) => Promise<void>;
  exportarCopia: () => Promise<void>;
  restaurarCopia: () => Promise<void>;
  recargar: () => Promise<void>;
};

export function useAjustes(): EstadoAjustes {
  const repos = useRepositorios();
  const almacen = almacenAsyncStorage;

  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [copia, setCopia] = useState<EstadoCopia>({
    ultimaCopia: null,
    diasSinCopia: null,
    urgente: false,
    tamanoKb: null,
    instantaneaEn: null,
  });
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const recargar = useCallback(async () => {
    const [p, ultima, instantanea] = await Promise.all([
      repos.perfil.obtener(),
      almacen.leer<string>(CLAVE_ULTIMA),
      almacen.leer<{ creadaEn: string }>(CLAVE_INSTANTANEA),
    ]);

    const dias = ultima ? diasEntre(ultima.slice(0, 10), hoy()) : null;

    setPerfil(p);
    setCopia({
      ultimaCopia: ultima ?? null,
      diasSinCopia: dias,
      urgente: dias == null || dias >= DIAS_AVISO_COPIA,
      tamanoKb: null,
      instantaneaEn: instantanea?.creadaEn ?? null,
    });
    setCargando(false);
  }, [repos, almacen]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  /**
   * Instantánea automática dentro del propio dispositivo.
   *
   * Protege de un fallo de la app o de un borrado accidental desde dentro. NO
   * protege de perder el móvil ni de que el navegador limpie su almacenamiento,
   * porque vive en el mismo sitio que los datos originales. Por eso no sustituye
   * a exportar el fichero, y la interfaz lo dice con esas palabras.
   */
  useEffect(() => {
    if (cargando) return;
    // Se puede desactivar desde Ajustes.
    if (perfil && !perfil.copiaAutomatica) return;

    void (async () => {
      const previa = await almacen.leer<{ creadaEn: string }>(CLAVE_INSTANTANEA);
      const dias = previa ? diasEntre(previa.creadaEn.slice(0, 10), hoy()) : null;
      if (dias != null && dias < 7) return;

      const datos = await exportar(almacen);
      await almacen.escribir(CLAVE_INSTANTANEA, { creadaEn: new Date().toISOString(), datos });
      setCopia((c) => ({ ...c, instantaneaEn: new Date().toISOString() }));
    })();
  }, [cargando, almacen, perfil]);

  return {
    cargando,
    perfil,
    copia,
    mensaje,
    trabajando,
    soportaFicheros,

    cambiarPerfil: async (cambios) => {
      if (!perfil) return;
      await repos.perfil.actualizar(perfil.id, cambios);
      await recargar();
    },

    exportarCopia: async () => {
      setTrabajando(true);
      setMensaje(null);
      try {
        const datos = await exportar(almacen);
        const resultado = await descargarJson(nombreDeFichero(), JSON.stringify(datos, null, 2));

        if (!resultado.ok) {
          setMensaje(resultado.motivo);
          return;
        }

        await almacen.escribir(CLAVE_ULTIMA, new Date().toISOString());
        setMensaje(`Copia descargada · ${tamanoKb(datos)} KB. Guárdala fuera del móvil.`);
        await recargar();
      } finally {
        setTrabajando(false);
      }
    },

    restaurarCopia: async () => {
      setTrabajando(true);
      setMensaje(null);
      try {
        const fichero = await leerJson();
        if (!fichero.ok) {
          setMensaje(fichero.motivo);
          return;
        }

        let crudo: unknown;
        try {
          crudo = JSON.parse(fichero.contenido);
        } catch {
          setMensaje('El fichero no es un JSON válido.');
          return;
        }

        const resultado = await importar(almacen, crudo);
        setMensaje(
          resultado.ok
            ? `Restaurado desde ${fichero.nombre}. Cierra y vuelve a abrir la app.`
            : resultado.motivo,
        );
        await recargar();
      } finally {
        setTrabajando(false);
      }
    },

    recargar,
  };
}
