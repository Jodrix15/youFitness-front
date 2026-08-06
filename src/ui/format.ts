/**
 * Formato de presentación en español.
 *
 * Vive en la capa de UI, no en el dominio: el dominio trabaja con números, y
 * cómo se pintan esos números es una decisión de interfaz. Si algún día la app
 * se traduce, se cambia aquí y el dominio ni se entera.
 */

const LOCALE = 'es-ES';

export function kg(valor: number, decimales = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export function entero(valor: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(valor);
}

export function decimal(valor: number, decimales = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export function conSigno(valor: number, decimales = 1): string {
  const signo = valor > 0 ? '+' : valor < 0 ? '−' : '';
  return `${signo}${kg(Math.abs(valor), decimales)}`;
}

/** Día de la semana con inicial mayúscula: «Jueves». */
export function diaSemana(fecha: Date): string {
  const texto = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function mesYAnio(fecha: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(fecha);
}

export function fechaLarga(fecha: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/**
 * Convierte lo tecleado en el teclado numérico a número.
 * Acepta coma o punto como separador decimal.
 */
export function aNumero(texto: string): number | null {
  if (!texto.trim()) return null;
  const n = Number(texto.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
