/**
 * Racha de días con al menos un registro.
 *
 * NO SE ALMACENA (especificación §4): se calcula sobre las fechas con actividad.
 * Guardar un contador obliga a mantenerlo sincronizado y a decidir qué pasa si
 * editas el pasado; calcularlo no tiene ese problema.
 */

import type { FechaISO } from '../models/comunes';
import { diasEntre } from './fechas';

export type Racha = {
  /** Días consecutivos hasta hoy (o hasta ayer, si hoy aún no hay registro). */
  actual: number;
  /** La racha más larga alcanzada nunca. */
  mejor: number;
  /** Si hoy ya cuenta. Cuando es falso, la racha está en riesgo. */
  incluyeHoy: boolean;
};

/**
 * @param fechasConRegistro fechas en las que hubo actividad. Se admiten
 *        duplicados y desorden.
 * @param fechaHoy el día de hoy, por parámetro para poder testear.
 */
export function calcularRacha(
  fechasConRegistro: readonly FechaISO[],
  fechaHoy: FechaISO,
): Racha {
  const dias = [...new Set(fechasConRegistro)].sort();
  if (dias.length === 0) return { actual: 0, mejor: 0, incluyeHoy: false };

  // Mejor racha histórica.
  let mejor = 1;
  let corrida = 1;
  for (let i = 1; i < dias.length; i++) {
    corrida = diasEntre(dias[i - 1]!, dias[i]!) === 1 ? corrida + 1 : 1;
    if (corrida > mejor) mejor = corrida;
  }

  // Racha actual: se cuenta hacia atrás desde hoy, o desde ayer.
  const ultimo = dias[dias.length - 1]!;
  const distancia = diasEntre(ultimo, fechaHoy);

  // Si el último registro tiene más de un día, la racha está rota.
  if (distancia > 1) return { actual: 0, mejor, incluyeHoy: false };

  let actual = 1;
  for (let i = dias.length - 1; i > 0; i--) {
    if (diasEntre(dias[i - 1]!, dias[i]!) === 1) actual++;
    else break;
  }

  return { actual, mejor, incluyeHoy: distancia === 0 };
}

/** Los siete días de la semana actual, para la tira de la pantalla de Inicio. */
export function semanaDeRacha(
  fechasConRegistro: readonly FechaISO[],
  fechaHoy: FechaISO,
  primerDia: 'lunes' | 'domingo' = 'lunes',
): { fecha: FechaISO; inicial: string; activo: boolean; esHoy: boolean; futuro: boolean }[] {
  const conjunto = new Set(fechasConRegistro);
  const iniciales =
    primerDia === 'lunes'
      ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
      : ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  const [a, m, d] = fechaHoy.split('-').map(Number);
  const hoy = new Date(a ?? 1970, (m ?? 1) - 1, d ?? 1);

  // getDay(): 0 = domingo. Se convierte al índice de la primera columna.
  const diaSemana = hoy.getDay();
  const desplazamiento = primerDia === 'lunes' ? (diaSemana + 6) % 7 : diaSemana;

  return iniciales.map((inicial, i) => {
    const fecha = new Date(hoy.getTime());
    fecha.setDate(fecha.getDate() - desplazamiento + i);
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
      fecha.getDate(),
    ).padStart(2, '0')}`;

    return {
      fecha: iso,
      inicial,
      activo: conjunto.has(iso),
      esHoy: iso === fechaHoy,
      futuro: iso > fechaHoy,
    };
  });
}
