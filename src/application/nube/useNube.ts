import { useCallback, useEffect, useState } from 'react';

import { configNube } from '../../data/adapters/supabase/configEnApp';
import {
  crearCuenta as crearCuentaEnNube,
  descargarCopia,
  entrar as entrarEnNube,
  infoCopia,
  subirCopia,
  type InfoCopiaNube,
  type SesionNube,
} from '../../data/adapters/supabase/nube';
import { exportar, importar, tamanoKb } from '../../data/copia';
import { almacenAsyncStorage, type Almacen } from '../../platform/almacen';
import { mereceSubirse, tocaSubir } from './cuandoSubir';

export const CLAVE_SESION = 'nube:sesion';
export const CLAVE_ULTIMA_SUBIDA = 'nube:ultima_subida';

export type EstadoNube = {
  /** Hay configuración de Supabase en `app.json`. Si no, la sección ni sale. */
  disponible: boolean;
  cargando: boolean;
  sesion: SesionNube | null;
  ultimaSubida: string | null;
  info: InfoCopiaNube | null;
  mensaje: string | null;
  /** Error de la última operación, para pintarlo distinto de un mensaje normal. */
  error: string | null;
  trabajando: boolean;
  entrar: (correo: string, contrasena: string) => Promise<void>;
  crearCuenta: (correo: string, contrasena: string) => Promise<void>;
  salir: () => Promise<void>;
  subirAhora: () => Promise<void>;
  restaurar: () => Promise<void>;
};

/**
 * Copia automática en la nube.
 *
 * LA PROMESA: una vez has entrado con tu correo, no vuelves a hacer nada. La app
 * sube sola una copia cada doce horas al arrancar, y si no hay conexión no pasa
 * nada porque los datos ya están en el móvil — se reintenta la próxima vez.
 *
 * Sigue siendo local-first de principio a fin. Nada de lo que hace esta función
 * está en el camino de registrar un peso o cerrar el día: si la nube falla,
 * tarda o no está configurada, la app se comporta exactamente igual que antes de
 * que existiera. Esa es la diferencia entre una copia y una sincronización.
 */
export function useNube(opciones: { automatico?: boolean; almacen?: Almacen } = {}): EstadoNube {
  const { automatico = false, almacen = almacenAsyncStorage } = opciones;
  const config = configNube();

  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<SesionNube | null>(null);
  const [ultimaSubida, setUltimaSubida] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoCopiaNube | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const guardarSesion = useCallback(
    async (nueva: SesionNube | null) => {
      if (nueva) await almacen.escribir(CLAVE_SESION, nueva);
      else await almacen.borrar(CLAVE_SESION);
      setSesion(nueva);
    },
    [almacen],
  );

  useEffect(() => {
    void (async () => {
      const [s, u] = await Promise.all([
        almacen.leer<SesionNube>(CLAVE_SESION),
        almacen.leer<string>(CLAVE_ULTIMA_SUBIDA),
      ]);
      setSesion(s);
      setUltimaSubida(u);
      setCargando(false);
    })();
  }, [almacen]);

  /** Sube la copia y deja constancia de cuándo. Devuelve el motivo si falla. */
  const subir = useCallback(
    async (actual: SesionNube): Promise<string | null> => {
      if (!config) return 'La nube no está configurada.';

      const copia = await exportar(almacen);

      // Subir SUSTITUYE. Antes de pisar el respaldo, hay que estar seguro de que
      // lo que va encima vale más que lo que había.
      if (!mereceSubirse(copia)) {
        return 'Todavía no hay nada que copiar: termina el onboarding primero.';
      }

      const r = await subirCopia(config, actual, copia);

      if (!r.ok) return r.motivo;

      await guardarSesion(r.valor);
      const cuando = new Date().toISOString();
      await almacen.escribir(CLAVE_ULTIMA_SUBIDA, cuando);
      setUltimaSubida(cuando);
      setInfo({ subidaEn: cuando, tamanoKb: tamanoKb(copia) });
      return null;
    },
    [config, almacen, guardarSesion],
  );

  /**
   * Copia automática al arrancar.
   *
   * Silenciosa por diseño: si falla no se enseña nada. Un aviso rojo al abrir la
   * app porque el wifi del bar va mal entrena a ignorar los avisos, y el día que
   * uno importe de verdad tampoco se leerá. Lo que sí se ve, en Ajustes, es
   * cuándo fue la última copia: eso es un hecho, no una alarma.
   */
  useEffect(() => {
    if (!automatico || cargando || !config || !sesion) return;
    if (!tocaSubir(ultimaSubida)) return;

    void subir(sesion);
    // `ultimaSubida` cambia al subir, lo que cierra el ciclo: no vuelve a entrar.
  }, [automatico, cargando, config, sesion, ultimaSubida, subir]);

  /** Al entrar, se mira qué hay en la nube para poder ofrecer restaurar. */
  const refrescarInfo = useCallback(
    async (actual: SesionNube) => {
      if (!config) return;
      const r = await infoCopia(config, actual);
      if (!r.ok) return;
      await guardarSesion(r.valor.sesion);
      setInfo(r.valor.info);
    },
    [config, guardarSesion],
  );

  const conAcceso = useCallback(
    async (
      accion: () => Promise<{ ok: true; valor: SesionNube } | { ok: false; motivo: string }>,
      exito: string,
    ) => {
      setTrabajando(true);
      setMensaje(null);
      setError(null);
      try {
        const r = await accion();
        if (!r.ok) {
          setError(r.motivo);
          return;
        }
        await guardarSesion(r.valor);
        await refrescarInfo(r.valor);
        setMensaje(exito);
      } finally {
        setTrabajando(false);
      }
    },
    [guardarSesion, refrescarInfo],
  );

  return {
    disponible: config != null,
    cargando,
    sesion,
    ultimaSubida,
    info,
    mensaje,
    error,
    trabajando,

    entrar: async (correo, contrasena) => {
      if (!config) return;
      await conAcceso(
        () => entrarEnNube(config, correo.trim(), contrasena),
        'Listo. A partir de ahora la copia se hace sola.',
      );
    },

    crearCuenta: async (correo, contrasena) => {
      if (!config) return;
      await conAcceso(
        () => crearCuentaEnNube(config, correo.trim(), contrasena),
        'Cuenta creada. La primera copia se sube en un momento.',
      );
    },

    /**
     * Salir NO borra la copia de la nube.
     *
     * Es justo lo contrario de lo que hay que hacer: si alguien sale por error y
     * eso se llevara por delante su respaldo, el respaldo no sería tal. Se borra
     * desde el panel de Supabase, a mano y a propósito.
     */
    salir: async () => {
      await guardarSesion(null);
      await almacen.borrar(CLAVE_ULTIMA_SUBIDA);
      setUltimaSubida(null);
      setInfo(null);
      setMensaje('Sesión cerrada. Tu copia sigue guardada en la nube.');
      setError(null);
    },

    subirAhora: async () => {
      if (!sesion) return;
      setTrabajando(true);
      setMensaje(null);
      setError(null);
      try {
        const motivo = await subir(sesion);
        if (motivo) setError(motivo);
        else setMensaje('Copia subida.');
      } finally {
        setTrabajando(false);
      }
    },

    /**
     * Restaurar SUSTITUYE lo que haya en el móvil, igual que restaurar un
     * fichero. No se fusiona: mezclar dos historiales sin criterio produce
     * duplicados silenciosos, que es peor que perder datos porque no te enteras
     * hasta meses después.
     */
    restaurar: async () => {
      if (!config || !sesion) return;
      setTrabajando(true);
      setMensaje(null);
      setError(null);
      try {
        const r = await descargarCopia(config, sesion);
        if (!r.ok) {
          setError(r.motivo);
          return;
        }
        await guardarSesion(r.valor.sesion);

        const resultado = await importar(almacen, r.valor.crudo);
        if (resultado.ok) setMensaje('Restaurado. Cierra la app y vuelve a abrirla.');
        else setError(resultado.motivo);
      } finally {
        setTrabajando(false);
      }
    },
  };
}
