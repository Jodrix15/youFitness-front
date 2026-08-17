import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  Comida,
  DeslizDetalle,
  NuevaComida,
  NuevaReceta,
  NuevoDeslizDetalle,
  Receta,
  TipoComida,
} from '../../domain/models/comida';
import type { Uuid } from '../../domain/models/comunes';
import { componerDia, rachaDiasCompletos, type ComposicionDia } from '../../domain/rules/composicionDia';
import {
  analizarDeslices,
  presupuestoDeLaSemana,
  type AnalisisDeslices,
  type EstadoPresupuesto,
} from '../../domain/rules/deslices';
import { hoy } from '../../domain/rules/fechas';
import { useRepositorios } from '../../data/contenedor';
import { registrarComida, registrarDesliz, type ResultadoComida } from './registrarComida';

export type DatosDesliz = {
  descripcion: string;
  tipo: TipoComida;
  /** Día en el que se guarda. Sin él, hoy. */
  fecha?: string;
  detalle: Omit<NuevoDeslizDetalle, 'comidaId'>;
};

export type EstadoComidas = {
  cargando: boolean;
  fecha: string;
  irADia: (fecha: string) => void;
  todas: Comida[];
  dia: ComposicionDia;
  rachaCompletos: number;
  presupuesto: EstadoPresupuesto;
  analisis: AnalisisDeslices;
  detalles: DeslizDetalle[];
  recetas: Receta[];
  guardarComida: (
    datos: Omit<NuevaComida, 'fecha' | 'hora' | 'esDesliz' | 'editadoEn'>,
    fecha?: string,
  ) => Promise<ResultadoComida | null>;
  editarComida: (
    id: Uuid,
    cambios: Partial<NuevaComida>,
  ) => Promise<void>;
  buscarComida: (id: Uuid) => Comida | null;
  guardarDesliz: (datos: DatosDesliz) => Promise<ResultadoComida | null>;
  /**
   * Corregir un desliz NO toca el XP, igual que corregir una comida: los 15
   * puntos se pagaron por anotarlo, y arreglar la categoría no es un registro
   * nuevo. Si se cambia de día, el evento de XP se queda donde se ganó — el log
   * es inmutable, y reescribir el pasado para que cuadre con una corrección de
   * hoy es justo lo que ese principio existe para impedir.
   */
  editarDesliz: (comidaId: Uuid, datos: DatosDesliz) => Promise<void>;
  buscarDetalleDesliz: (comidaId: Uuid) => DeslizDetalle | null;
  borrarComida: (id: Uuid) => Promise<void>;
  crearReceta: (datos: NuevaReceta) => Promise<Receta | null>;
  borrarReceta: (id: Uuid) => Promise<void>;
  recargar: () => Promise<void>;
};

export function useComidas(usuarioId: Uuid | null): EstadoComidas {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [todas, setTodas] = useState<Comida[]>([]);
  const [detalles, setDetalles] = useState<DeslizDetalle[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [fecha, setFecha] = useState(hoy());

  const recargar = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }
    const [c, d, r] = await Promise.all([
      repos.comidas.listar(usuarioId),
      repos.comidas.listarDetallesDesliz(usuarioId),
      repos.recetas.listar(usuarioId),
    ]);
    setTodas(c);
    setDetalles(d);
    setRecetas(r);
    setCargando(false);
  }, [repos, usuarioId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const guardarComida = useCallback(
    async (datos: Omit<NuevaComida, 'fecha' | 'hora' | 'esDesliz' | 'editadoEn'>, cuando?: string) => {
      if (!usuarioId) return null;
      const r = await registrarComida(repos, usuarioId, { ...datos, fecha: cuando });
      await recargar();
      return r;
    },
    [repos, usuarioId, recargar],
  );

  /**
   * Corregir una comida NO toca el XP.
   *
   * Los 20 puntos se pagaron por registrarla, y arreglar una errata no es un
   * registro nuevo. Devolverlos y volver a darlos tampoco valdría: haría que el
   * log de XP tuviera tres eventos donde solo hubo una comida.
   */
  const editarComida = useCallback(
    async (id: Uuid, cambios: Partial<NuevaComida>) => {
      if (!usuarioId) return;
      await repos.comidas.actualizar(usuarioId, id, cambios);
      await recargar();
    },
    [repos, usuarioId, recargar],
  );

  const guardarDesliz = useCallback(
    async (datos: DatosDesliz) => {
      if (!usuarioId) return null;
      const r = await registrarDesliz(repos, usuarioId, datos);
      await recargar();
      return r;
    },
    [repos, usuarioId, recargar],
  );

  const editarDesliz = useCallback(
    async (comidaId: Uuid, datos: DatosDesliz) => {
      if (!usuarioId) return;
      await repos.comidas.actualizar(usuarioId, comidaId, {
        descripcion: datos.descripcion,
        tipo: datos.tipo,
        ...(datos.fecha ? { fecha: datos.fecha } : {}),
        nota: datos.detalle.nota,
      });
      await repos.comidas.guardarDetalleDesliz(usuarioId, { ...datos.detalle, comidaId });
      await recargar();
    },
    [repos, usuarioId, recargar],
  );

  const borrarComida = useCallback(
    async (id: Uuid) => {
      if (!usuarioId) return;
      await repos.comidas.borrar(usuarioId, id);
      await recargar();
    },
    [repos, usuarioId, recargar],
  );

  const crearReceta = useCallback(
    async (datos: NuevaReceta) => {
      if (!usuarioId) return null;
      const r = await repos.recetas.crear(usuarioId, datos);
      await recargar();
      return r;
    },
    [repos, usuarioId, recargar],
  );

  const borrarReceta = useCallback(
    async (id: Uuid) => {
      if (!usuarioId) return;
      await repos.recetas.borrar(usuarioId, id);
      await recargar();
    },
    [repos, usuarioId, recargar],
  );

  return {
    cargando,
    fecha,
    irADia: setFecha,
    todas,
    dia: useMemo(() => componerDia(todas, fecha), [todas, fecha]),
    rachaCompletos: useMemo(() => rachaDiasCompletos(todas, hoy()), [todas]),
    presupuesto: useMemo(() => presupuestoDeLaSemana(todas, fecha), [todas, fecha]),
    analisis: useMemo(() => analizarDeslices(todas, detalles), [todas, detalles]),
    detalles,
    recetas,
    guardarComida,
    editarComida,
    buscarComida: (id: Uuid) => todas.find((c) => c.id === id) ?? null,
    guardarDesliz,
    editarDesliz,
    buscarDetalleDesliz: (id: Uuid) => detalles.find((d) => d.comidaId === id) ?? null,
    borrarComida,
    crearReceta,
    borrarReceta,
    recargar,
  };
}
