/**
 * Volumen de entrenamiento y récords.
 *
 * El volumen es la única cifra que permite comparar dos sesiones distintas. Y
 * como los cinco tipos de ejercicio mueven cargas distintas, cada uno tiene su
 * fórmula. Especificación §4.
 *
 * AVISO IMPORTANTE: estos números solo sirven para compararte CONTIGO MISMO.
 * Los factores de apalancamiento son estimaciones de biomecánica; comparar el
 * volumen de dos personas con ellos no significa nada.
 */

import type { Ejercicio, Serie, TipoEjercicio } from '../models/entreno';
import { redondear } from './composicion';

export type DatosSerie = {
  reps: number | null;
  pesoKg: number | null;
  lastreKg: number | null;
  segundos: number | null;
};

/**
 * Volumen de una serie, en kilos movidos.
 *
 * | Tipo             | Fórmula                                      |
 * |------------------|----------------------------------------------|
 * | externo          | reps × peso                                  |
 * | corporal         | reps × peso corporal × factor                |
 * | corporal_lastre  | reps × (peso corporal × factor + lastre)     |
 * | isometrico       | segundos × peso corporal × factor            |
 * | cardio           | no aplica                                    |
 *
 * El isométrico devuelve una cifra en una unidad distinta (kg·segundo), así que
 * NO se suma al volumen en kilos. Se acumula aparte.
 */
export function volumenSerie(
  serie: DatosSerie,
  tipo: TipoEjercicio,
  factorApalancamiento: number,
  pesoCorporalKg: number,
): number {
  const reps = serie.reps ?? 0;
  const peso = serie.pesoKg ?? 0;
  const lastre = serie.lastreKg ?? 0;
  const segundos = serie.segundos ?? 0;

  switch (tipo) {
    case 'externo':
      return redondear(reps * peso, 1);
    case 'corporal':
      return redondear(reps * pesoCorporalKg * factorApalancamiento, 1);
    case 'corporal_lastre':
      return redondear(reps * (pesoCorporalKg * factorApalancamiento + lastre), 1);
    case 'isometrico':
      return redondear(segundos * pesoCorporalKg * factorApalancamiento, 1);
    case 'cardio':
      return 0;
  }
}

export type TotalesSesion = {
  /** Kilos movidos. No incluye isométricos ni cardio. */
  volumenKg: number;
  /** Segundos de isométrico acumulados. Unidad aparte. */
  segundosIsometricos: number;
  /** Minutos de cardio. */
  minutosCardio: number;
  seriesTotales: number;
  repsTotales: number;
};

export function totalizarSesion(
  series: readonly Serie[],
  ejercicios: ReadonlyMap<string, Ejercicio>,
): TotalesSesion {
  let volumenKg = 0;
  let segundosIsometricos = 0;
  let segundosCardio = 0;
  let repsTotales = 0;

  for (const s of series) {
    const tipo = ejercicios.get(s.ejercicioId)?.tipo;
    repsTotales += s.reps ?? 0;

    if (tipo === 'isometrico') segundosIsometricos += s.segundos ?? 0;
    else if (tipo === 'cardio') segundosCardio += s.segundos ?? 0;
    else volumenKg += s.volumen;
  }

  return {
    volumenKg: redondear(volumenKg, 1),
    segundosIsometricos,
    minutosCardio: Math.round(segundosCardio / 60),
    seriesTotales: series.length,
    repsTotales,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 1RM estimado
// ────────────────────────────────────────────────────────────────────────────

/** Por encima de estas repeticiones, la fórmula de Epley pierde fiabilidad. */
export const REPS_FIABLES_1RM = 8;

export type Estimacion1RM = {
  kg: number;
  /** true cuando la estimación viene de una serie larga y hay que advertirlo. */
  pocoFiable: boolean;
};

/**
 * 1RM estimado por Epley: `peso × (1 + reps/30)`.
 *
 * SOLO tiene sentido en ejercicios de peso externo. En peso corporal no se
 * muestra: tu «máximo a una repetición» de dominadas no significa nada si el
 * peso que mueves es siempre el mismo.
 */
export function estimar1RM(pesoKg: number, reps: number): Estimacion1RM | null {
  if (pesoKg <= 0 || reps <= 0) return null;
  return {
    kg: redondear(pesoKg * (1 + reps / 30), 1),
    pocoFiable: reps > REPS_FIABLES_1RM,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Récords
// ────────────────────────────────────────────────────────────────────────────

export type Record = {
  ejercicioId: string;
  /** Qué se superó. Depende del tipo de ejercicio. */
  clase: 'peso' | 'reps' | 'segundos' | 'volumen';
  valor: number;
  anterior: number;
  mejora: number;
};

/**
 * ¿Esta serie es un récord personal?
 *
 * Se compara contra el mejor histórico del MISMO ejercicio, y en la magnitud
 * que de verdad importa según el tipo:
 *
 *  - peso externo → más kilos en una serie
 *  - peso corporal → más repeticiones
 *  - con lastre → más volumen, que combina lastre y repeticiones
 *  - isométrico → más segundos
 *
 * El cardio no genera récords: sin pulsómetro no hay nada verificable que
 * comparar más allá de la duración, y premiar «más minutos» empuja a alargar
 * sesiones en lugar de mejorarlas.
 */
export function detectarRecord(
  serie: DatosSerie & { volumen: number },
  tipo: TipoEjercicio,
  ejercicioId: string,
  historico: readonly Serie[],
): Record | null {
  if (tipo === 'cardio') return null;

  const previas = historico.filter((s) => s.ejercicioId === ejercicioId);

  const clase: Record['clase'] =
    tipo === 'externo'
      ? 'peso'
      : tipo === 'corporal'
        ? 'reps'
        : tipo === 'isometrico'
          ? 'segundos'
          : 'volumen';

  const magnitud = (s: DatosSerie & { volumen: number }): number => {
    switch (clase) {
      case 'peso':
        return s.pesoKg ?? 0;
      case 'reps':
        return s.reps ?? 0;
      case 'segundos':
        return s.segundos ?? 0;
      case 'volumen':
        return s.volumen;
    }
  };

  const valor = magnitud(serie);
  if (valor <= 0) return null;

  // Sin historial no hay récord: la primera vez que haces algo no has superado
  // nada. Marcarlo como PR devaluaría la insignia desde el primer día.
  if (previas.length === 0) return null;

  const anterior = Math.max(...previas.map(magnitud));
  if (valor <= anterior) return null;

  return {
    ejercicioId,
    clase,
    valor,
    anterior,
    mejora: redondear(valor - anterior, 1),
  };
}

export const ETIQUETA_RECORD: Record_ClaseEtiqueta = {
  peso: 'kg',
  reps: 'reps',
  segundos: 's',
  volumen: 'kg de volumen',
};

type Record_ClaseEtiqueta = { [K in Record['clase']]: string };
