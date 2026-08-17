/**
 * Cuándo toca subir la copia. Regla pura, para poder probarla sin red.
 *
 * La cadencia no es «cada vez que cambia algo»: eso sería subir el fichero
 * entero veinte veces al día para ganar veinte minutos de frescura, gastando
 * batería y cuota. Con una copia cada doce horas, lo máximo que se pierde si el
 * móvil desaparece es medio día de registros.
 */

import type { Copia } from '../../data/copia';

export const HORAS_ENTRE_COPIAS = 12;

/** A partir de aquí la copia se considera vieja y la interfaz lo dice. */
export const DIAS_COPIA_VIEJA = 7;

export function tocaSubir(
  ultimaSubida: string | null,
  ahora: Date = new Date(),
  cadaHoras: number = HORAS_ENTRE_COPIAS,
): boolean {
  if (!ultimaSubida) return true;

  const anterior = new Date(ultimaSubida).getTime();
  if (!Number.isFinite(anterior)) return true;

  const transcurridas = (ahora.getTime() - anterior) / 3_600_000;

  // Un reloj que va hacia atrás (cambio de hora, fecha mal puesta) no debe
  // dejar la copia congelada para siempre: ante la duda, se sube.
  if (transcurridas < 0) return true;

  return transcurridas >= cadaHoras;
}

/** «hace 3 horas», «hace 2 días». Para decirlo sin que parezca un log. */
export function antiguedad(fecha: string, ahora: Date = new Date()): string {
  const cuando = new Date(fecha).getTime();
  if (!Number.isFinite(cuando)) return 'en un momento indeterminado';

  const minutos = Math.max(0, Math.round((ahora.getTime() - cuando) / 60_000));
  if (minutos < 2) return 'hace un momento';
  if (minutos < 60) return `hace ${String(minutos)} minutos`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return horas === 1 ? 'hace una hora' : `hace ${String(horas)} horas`;

  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${String(dias)} días`;
}

/**
 * ¿Merece esta copia sustituir a la que ya hay en la nube?
 *
 * LA SALVAGUARDA MÁS IMPORTANTE DEL FICHERO, y protege del peor escenario
 * posible: instalas la app en un móvil nuevo, entras con tu cuenta para
 * restaurar, y antes de que te dé tiempo la copia automática sube el móvil
 * vacío encima de tu respaldo bueno. Se habrían perdido los datos usando
 * exactamente la función que existe para no perderlos.
 *
 * El criterio es haber pasado por el onboarding: sin perfil no hay nada que un
 * respaldo pueda contener. Y como subir SUSTITUYE, ante la duda no se sube:
 * quedarse con una copia de ayer siempre es mejor que quedarse sin ninguna.
 */
export function mereceSubirse(copia: Copia): boolean {
  const perfil = copia.datos['perfil'];
  return typeof perfil === 'object' && perfil != null;
}
