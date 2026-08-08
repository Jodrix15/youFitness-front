import type { Entidad, FechaISO, Uuid } from './comunes';

/**
 * Escalera de progresión. Especificación §4 y §6.
 *
 * Una escalera es una secuencia de variantes del mismo movimiento, de más fácil
 * a más difícil: remo invertido → dominada negativa → dominada → dominada
 * lastrada. Es la forma de progresar en calistenia, donde no puedes añadir dos
 * kilos y medio a la barra.
 *
 * Cada escalón declara su criterio de forma EXPLÍCITA («3 series × 10 reps con
 * RIR ≥ 2»). Sin criterio escrito, subir de escalón se convierte en una
 * corazonada, y las corazonadas llevan a saltar antes de tiempo.
 */
export type Escalon = {
  id: Uuid;
  orden: number;
  nombre: string;
  /** Ejercicio de la biblioteca que representa este escalón, si existe. */
  ejercicioId: Uuid | null;
  /** Texto libre, por si el criterio no cabe en los tres números. */
  criterioTexto: string | null;
  criterioSeries: number;
  criterioReps: number | null;
  criterioSegundos: number | null;
  /** RIR mínimo exigido: hacerlo con margen, no al fallo. */
  criterioRir: number | null;
};

export type Escalera = Entidad & {
  nombre: string;
  icono: string;
  escalones: Escalon[];
  /** Índice del escalón en el que estás, empezando en 0. */
  escalonActual: number;
  fechaUltimoAscenso: FechaISO | null;
};

export type NuevaEscalera = Omit<Escalera, keyof Entidad>;
