/**
 * Reglas sobre el sueño declarado en el check-in.
 *
 * Todo se calcula sobre lo que el usuario apunta. La app no estima el sueño ni
 * lo lee de ningún sensor (§10): sin wearable no hay fuente fiable.
 */

import type { Checkin } from '../models/checkin';

/** Check-ins necesarios antes de enseñar correlaciones. Especificación §6. */
export const UMBRAL_CORRELACIONES = 14;

/** A partir de esta hora, acostarse penaliza en modo estricto (§5). */
export const HORA_LIMITE_TRASNOCHE = 2 * 60;

/**
 * Convierte `HH:MM` a minutos desde medianoche, en una escala nocturna.
 *
 * Las horas de madrugada se tratan como continuación de la noche anterior:
 * las 00:40 son «más tarde» que las 23:50, no dieciséis horas antes. Sin esto,
 * cualquier media de hora de acostarse sale sin sentido.
 */
export function minutosNocturnos(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!m) return null;

  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;

  const total = h * 60 + min;
  // Antes de las 12:00 se considera madrugada del día anterior.
  return h < 12 ? total + 24 * 60 : total;
}

export function formatearMinutosNocturnos(minutos: number): string {
  const normalizado = ((minutos % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalizado / 60);
  const m = Math.round(normalizado % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Hora habitual de acostarse: la mediana de los últimos check-ins.
 *
 * Mediana y no media, porque una noche de fiesta hasta las 5 desplazaría la
 * media varias horas y dejaría de describir tu costumbre.
 */
export function horaHabitualAcostarse(
  checkins: readonly Checkin[],
  ultimos = 30,
): number | null {
  const minutos = checkins
    .slice(-ultimos)
    .map((c) => (c.horaAcostarse ? minutosNocturnos(c.horaAcostarse) : null))
    .filter((m): m is number => m != null)
    .sort((a, b) => a - b);

  if (minutos.length < 3) return null;

  const medio = Math.floor(minutos.length / 2);
  return minutos.length % 2 === 0
    ? Math.round(((minutos[medio - 1] ?? 0) + (minutos[medio] ?? 0)) / 2)
    : (minutos[medio] ?? null);
}

export type ComparacionSueno = {
  habitual: string;
  diferenciaMinutos: number;
  texto: string;
};

/** Compara la hora de anoche con la costumbre, para el mensaje del check-in. */
export function compararConHabitual(
  horaAnoche: string,
  habitualMinutos: number,
): ComparacionSueno | null {
  const anoche = minutosNocturnos(horaAnoche);
  if (anoche == null) return null;

  const diferencia = anoche - habitualMinutos;
  const abs = Math.abs(diferencia);
  const habitual = formatearMinutosNocturnos(habitualMinutos);

  if (abs < 15) {
    return { habitual, diferenciaMinutos: diferencia, texto: `Tu hora habitual son las ${habitual}. Anoche fuiste puntual.` };
  }

  const cuanto = abs >= 60 ? `${Math.floor(abs / 60)} h ${abs % 60} min` : `${abs} min`;
  return {
    habitual,
    diferenciaMinutos: diferencia,
    texto:
      diferencia > 0
        ? `Tu hora habitual son las ${habitual}. Anoche te acostaste ${cuanto} más tarde.`
        : `Tu hora habitual son las ${habitual}. Anoche te acostaste ${cuanto} antes.`,
  };
}

/** ¿Se acostó pasada la hora límite? Solo importa con modo estricto. */
export function esTrasnoche(horaAcostarse: string): boolean {
  const m = minutosNocturnos(horaAcostarse);
  if (m == null) return false;
  return m >= 24 * 60 + HORA_LIMITE_TRASNOCHE;
}
