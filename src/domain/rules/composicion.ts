/**
 * Reglas de peso y composición corporal.
 *
 * Funciones puras: sin React, sin acceso a datos, sin fechas del sistema salvo
 * las que se pasan por parámetro. Todo lo de aquí es testable con `node --test`.
 *
 * AVISO (anexo de la especificación): son valores de referencia general, no
 * consejo médico. La app los acompaña siempre de sus dos advertencias.
 */

import { LIMITES } from '../models/perfil';

export const IMC_SANO = { min: 18.5, max: 24.9 } as const;

/** Umbral de referencia de cintura/altura. Por debajo de 0,50. */
export const RATIO_CINTURA_ALTURA_OBJETIVO = 0.5;

/** Ritmo máximo prudente de pérdida: 1 % del peso corporal por semana. */
export const RITMO_MAXIMO_SEMANAL = 0.01;

/** Ritmo por defecto que propone la app: 0,5 % semanal. */
export const RITMO_SUGERIDO_SEMANAL = 0.005;

export type RangoPeso = { minKg: number; maxKg: number };

export function calcularImc(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return pesoKg / (m * m);
}

/** Rango de peso correspondiente a un IMC de 18,5 a 24,9 para esa altura. */
export function rangoPesoSaludable(alturaCm: number): RangoPeso {
  const m = alturaCm / 100;
  return {
    minKg: redondear(IMC_SANO.min * m * m, 1),
    maxKg: redondear(IMC_SANO.max * m * m, 1),
  };
}

export function ratioCinturaAltura(cinturaCm: number, alturaCm: number): number {
  return redondear(cinturaCm / alturaCm, 3);
}

export type LecturaCintura = 'bajo_umbral' | 'sobre_umbral';

export function interpretarCintura(cinturaCm: number, alturaCm: number): LecturaCintura {
  return ratioCinturaAltura(cinturaCm, alturaCm) < RATIO_CINTURA_ALTURA_OBJETIVO
    ? 'bajo_umbral'
    : 'sobre_umbral';
}

export type AvisoObjetivoPeso =
  | { tipo: 'ninguno' }
  | { tipo: 'por_debajo_del_rango'; minKg: number }
  | { tipo: 'por_encima_del_rango'; maxKg: number }
  | { tipo: 'ritmo_excesivo'; maxSemanalKg: number };

/**
 * Comprueba un objetivo de peso contra las dos reglas de §6:
 * que caiga dentro del rango sano, y que el ritmo implícito no supere el 1 %
 * del peso corporal por semana.
 *
 * @param semanas número de semanas en las que se pretende llegar. `null` si no
 *                hay plazo, en cuyo caso el ritmo no se comprueba.
 */
export function revisarObjetivoPeso(params: {
  pesoActualKg: number;
  pesoObjetivoKg: number;
  alturaCm: number;
  semanas?: number | null;
}): AvisoObjetivoPeso {
  const { pesoActualKg, pesoObjetivoKg, alturaCm, semanas = null } = params;
  const rango = rangoPesoSaludable(alturaCm);

  if (pesoObjetivoKg < rango.minKg) {
    return { tipo: 'por_debajo_del_rango', minKg: rango.minKg };
  }
  if (pesoObjetivoKg > rango.maxKg) {
    return { tipo: 'por_encima_del_rango', maxKg: rango.maxKg };
  }
  if (semanas != null && semanas > 0) {
    const ritmo = Math.abs(pesoActualKg - pesoObjetivoKg) / semanas;
    const maximo = pesoActualKg * RITMO_MAXIMO_SEMANAL;
    if (ritmo > maximo) {
      return { tipo: 'ritmo_excesivo', maxSemanalKg: redondear(maximo, 2) };
    }
  }
  return { tipo: 'ninguno' };
}

export type Previsión = {
  /** Kilos que separan el peso actual del objetivo. Positivo si hay que bajar. */
  diferenciaKg: number;
  ritmoSemanalKg: number;
  semanas: number;
  fechaEstimada: Date;
};

/**
 * Estima cuándo se alcanzaría el objetivo al ritmo sugerido.
 *
 * `hoy` se pasa por parámetro a propósito: una función que lee el reloj del
 * sistema no se puede testear.
 */
export function estimarLlegada(params: {
  pesoActualKg: number;
  pesoObjetivoKg: number;
  hoy: Date;
  ritmoSemanal?: number;
}): Previsión | null {
  const { pesoActualKg, pesoObjetivoKg, hoy, ritmoSemanal = RITMO_SUGERIDO_SEMANAL } = params;
  const diferenciaKg = redondear(pesoActualKg - pesoObjetivoKg, 1);

  if (Math.abs(diferenciaKg) < 0.1) return null;

  const ritmoSemanalKg = redondear(pesoActualKg * ritmoSemanal, 2);
  if (ritmoSemanalKg <= 0) return null;

  const semanas = Math.ceil(Math.abs(diferenciaKg) / ritmoSemanalKg);
  const fechaEstimada = new Date(hoy.getTime());
  fechaEstimada.setDate(fechaEstimada.getDate() + semanas * 7);

  return { diferenciaKg, ritmoSemanalKg, semanas, fechaEstimada };
}

export function pesoValido(kg: number): boolean {
  return Number.isFinite(kg) && kg >= LIMITES.pesoKg.min && kg <= LIMITES.pesoKg.max;
}

export function alturaValida(cm: number): boolean {
  return Number.isFinite(cm) && cm >= LIMITES.alturaCm.min && cm <= LIMITES.alturaCm.max;
}

export function edadValida(anios: number): boolean {
  return Number.isInteger(anios) && anios >= LIMITES.edad.min && anios <= LIMITES.edad.max;
}

export function cinturaValida(cm: number): boolean {
  return Number.isFinite(cm) && cm >= LIMITES.cinturaCm.min && cm <= LIMITES.cinturaCm.max;
}

export function redondear(n: number, decimales: number): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}
