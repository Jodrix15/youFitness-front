import type { FechaISO } from '../models/comunes';

/**
 * Utilidades de fecha civil.
 *
 * IMPORTANTE: la app trabaja con **días del calendario local**, no con
 * instantes. Un pesaje pertenece al día en que te subiste a la báscula, no al
 * instante UTC. Por eso `hoy()` usa la hora local y no `toISOString()`, que
 * cambiaría de día a las 02:00 en España durante el horario de verano.
 */

export function aFechaISO(fecha: Date): FechaISO {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

export function desdeFechaISO(fecha: FechaISO): Date {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(a ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function hoy(ahora: Date = new Date()): FechaISO {
  return aFechaISO(ahora);
}

export function horaLocal(ahora: Date = new Date()): string {
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const d = desdeFechaISO(fecha);
  d.setDate(d.getDate() + dias);
  return aFechaISO(d);
}

/** Días completos entre dos fechas civiles. Positivo si `b` es posterior. */
export function diasEntre(a: FechaISO, b: FechaISO): number {
  const ms = desdeFechaISO(b).getTime() - desdeFechaISO(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Ordena de más antigua a más reciente. Las fechas ISO se ordenan como texto. */
export function ordenarPorFecha<T extends { fecha: FechaISO }>(items: readonly T[]): T[] {
  return [...items].sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : 0));
}
