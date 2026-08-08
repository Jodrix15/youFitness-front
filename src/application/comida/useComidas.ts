import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  Comida,
  DeslizDetalle,
  NuevaComida,
  NuevaReceta,
  NuevoDeslizDetalle,
  Receta,
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
  guardarDesliz: (
    descripcion: string,
    detalle: Omit<NuevoDeslizDetalle, 'comidaId'>,
  ) => Promise<ResultadoComida | null>;
  borrarComida: (id: Uuid) => Promise<void>;
  crearReceta: (datos: NuevaReceta) => Promise<Receta | null>;
  borrarReceta: (id: Uuid) => Promise<void>;
  recargar: () => Promise<void>;
};

export function useComidas(
  usuarioId: Uuid | null,
  /** Objetivo de verdura del perfil. Configurable desde Ajustes. */
  objetivoVerdura?: number,
): EstadoComidas {
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
    async (descripcion: string, detalle: Omit<NuevoDeslizDetalle, 'comidaId'>) => {
      if (!usuarioId) return null;
      const r = await registrarDesliz(repos, usuarioId, { descripcion, detalle });
      await recargar();
      return r;
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
    dia: useMemo(
      () => componerDia(todas, fecha, objetivoVerdura),
      [todas, fecha, objetivoVerdura],
    ),
    rachaCompletos: useMemo(() => rachaDiasCompletos(todas, hoy()), [todas]),
    presupuesto: useMemo(() => presupuestoDeLaSemana(todas, fecha), [todas, fecha]),
    analisis: useMemo(() => analizarDeslices(todas, detalles), [todas, detalles]),
    detalles,
    recetas,
    guardarComida,
    editarComida,
    buscarComida: (id: Uuid) => todas.find((c) => c.id === id) ?? null,
    guardarDesliz,
    borrarComida,
    crearReceta,
    borrarReceta,
    recargar,
  };
}
