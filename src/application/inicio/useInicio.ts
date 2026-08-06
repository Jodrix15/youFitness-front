import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Uuid } from '../../domain/models/comunes';
import type { Comida } from '../../domain/models/comida';
import type { Objetivo } from '../../domain/models/objetivo';
import type { XpEvento } from '../../domain/models/xp';
import { totalXp, xpDelDia } from '../../domain/rules/eventosXp';
import { hoy } from '../../domain/rules/fechas';
import { componerDia, type ComposicionDia } from '../../domain/rules/composicionDia';
import { misionesDelDia, type Mision } from '../../domain/rules/misiones';
import { calcularRacha, semanaDeRacha, type Racha } from '../../domain/rules/racha';
import {
  estadoNivel,
  proximoRango,
  type EstadoNivel,
  type ProximoRango,
} from '../../domain/rules/xp';
import { useRepositorios } from '../../data/contenedor';

export type EstadoInicio = {
  cargando: boolean;
  nivel: EstadoNivel;
  proximoRango: ProximoRango | null;
  racha: Racha;
  semana: ReturnType<typeof semanaDeRacha>;
  xpHoy: number;
  eventos: XpEvento[];
  misiones: Mision[];
  /** Composición real del día. Alimenta el anillo de comidas y sus barras. */
  comidasDeHoy: ComposicionDia;
  pesajeRegistradoHoy: boolean;
  checkinCerradoHoy: boolean;
  /** Sin ningún registro todavía: la app enseña el estado de día 1. */
  esDiaUno: boolean;
  recargar: () => Promise<void>;
};

/**
 * Estado de la pantalla de Inicio.
 *
 * Nivel, rango y racha son SIEMPRE derivados del log de eventos. No hay ningún
 * contador guardado que pueda quedar desincronizado con la realidad.
 */
export function useInicio(usuarioId: Uuid | null): EstadoInicio {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [eventos, setEventos] = useState<XpEvento[]>([]);
  const [fechas, setFechas] = useState<string[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [pesajeHoy, setPesajeHoy] = useState(false);
  const [checkinHoy, setCheckinHoy] = useState(false);
  const [comidas, setComidas] = useState<Comida[]>([]);

  const recargar = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }
    const fecha = hoy();
    const [e, f, o, p, c, m] = await Promise.all([
      repos.xp.listar(usuarioId),
      repos.xp.fechasConActividad(usuarioId),
      repos.objetivos.listarActivos(usuarioId),
      repos.peso.obtenerPorFecha(usuarioId, fecha),
      repos.checkins.obtenerPorFecha(usuarioId, fecha),
      repos.comidas.listarPorFecha(usuarioId, fecha),
    ]);
    setEventos(e);
    setFechas(f);
    setObjetivos(o);
    setPesajeHoy(p != null);
    setCheckinHoy(c != null);
    setComidas(m);
    setCargando(false);
  }, [repos, usuarioId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const fechaHoy = hoy();
  const xpTotal = useMemo(() => totalXp(eventos), [eventos]);

  return {
    cargando,
    nivel: useMemo(() => estadoNivel(xpTotal), [xpTotal]),
    proximoRango: useMemo(() => proximoRango(xpTotal), [xpTotal]),
    racha: useMemo(() => calcularRacha(fechas, fechaHoy), [fechas, fechaHoy]),
    semana: useMemo(() => semanaDeRacha(fechas, fechaHoy), [fechas, fechaHoy]),
    xpHoy: useMemo(() => xpDelDia(eventos, fechaHoy), [eventos, fechaHoy]),
    eventos,
    misiones: useMemo(
      () =>
        misionesDelDia(objetivos, {
          pesajeRegistrado: pesajeHoy,
          checkinCerrado: checkinHoy,
        }),
      [objetivos, pesajeHoy, checkinHoy],
    ),
    comidasDeHoy: useMemo(() => componerDia(comidas, fechaHoy), [comidas, fechaHoy]),
    pesajeRegistradoHoy: pesajeHoy,
    checkinCerradoHoy: checkinHoy,
    esDiaUno: eventos.length === 0,
    recargar,
  };
}
