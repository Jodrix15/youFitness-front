/**
 * XP de una sesión de entrenamiento. Especificación §5.
 *
 *   completar el entreno    +80
 *   cada serie registrada   +2,5
 *   récord personal        +120
 *
 * Se calcula al TERMINAR, no serie a serie: si se pagara sobre la marcha,
 * abandonar una sesión a medias dejaría XP concedido por un entreno que no
 * existió, y habría que compensarlo con eventos negativos.
 */

import type { Ejercicio, Serie } from '../models/entreno';
import type { FechaISO } from '../models/comunes';
import { detectarRecord, type Record } from './volumen';
import { XP } from './xp';

export type DesgloseXpSesion = {
  base: number;
  porSeries: number;
  porRecords: number;
  /** Suma antes de aplicar el multiplicador de racha. */
  total: number;
  records: Record[];
};

export function desglosarXpSesion(params: {
  series: readonly Serie[];
  records: readonly Record[];
}): DesgloseXpSesion {
  const { series, records } = params;

  const base = XP.completarEntreno;
  const porSeries = Math.round(series.length * XP.serieRegistrada);
  const porRecords = records.length * XP.recordPersonal;

  return {
    base,
    porSeries,
    porRecords,
    total: base + porSeries + porRecords,
    records: [...records],
  };
}

/**
 * Busca todos los récords de una sesión contra el histórico anterior.
 *
 * Importante: se compara contra las series de sesiones ANTERIORES, no contra
 * las de la propia sesión. Si no, la cuarta serie de un ejercicio competiría
 * con la primera del mismo día y saldrían récords en cadena.
 */
export function recordsDeLaSesion(
  series: readonly Serie[],
  historicoPrevio: readonly Serie[],
  ejercicios: ReadonlyMap<string, Ejercicio>,
): Record[] {
  const mejores = new Map<string, Record>();

  for (const s of series) {
    const ejercicio = ejercicios.get(s.ejercicioId);
    if (!ejercicio) continue;

    const record = detectarRecord(s, ejercicio.tipo, s.ejercicioId, historicoPrevio);
    if (!record) continue;

    // Un récord por ejercicio y sesión, el mejor. Tres series por encima del
    // anterior son una buena sesión, no tres récords.
    const previo = mejores.get(s.ejercicioId);
    if (!previo || record.valor > previo.valor) mejores.set(s.ejercicioId, record);
  }

  return [...mejores.values()];
}

/** Sesiones de la semana natural que contiene `fecha`. */
export function sesionesDeLaSemana(
  fechas: readonly FechaISO[],
  inicioSemana: FechaISO,
  fecha: FechaISO,
): number {
  return fechas.filter((f) => f >= inicioSemana && f <= fecha).length;
}
