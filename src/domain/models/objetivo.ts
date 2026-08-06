import type { Entidad, InstanteISO } from './comunes';

/**
 * Objetivo declarativo. Especificación §4.
 *
 * Un objetivo es `métrica + operador + valor + periodo`. Nada más. Un único
 * evaluador recorre los objetivos activos al cerrar cada periodo, resuelve la
 * métrica con una consulta y escribe el resultado. Añadir una métrica nueva es
 * añadir un caso al resolvedor, no una pantalla.
 */
export type Metrica =
  | 'peso_kg'
  | 'sesiones'
  | 'pesajes'
  | 'comidas_registradas'
  | 'deslices'
  | 'pasos'
  | 'checkins'
  | 'habitos_cumplidos';

export type Operador = 'gte' | 'lte' | 'eq';

export type Periodo = 'comida' | 'dia' | 'semana' | 'mes' | 'hito';

export type Objetivo = Entidad & {
  nombre: string;
  metrica: Metrica;
  operador: Operador;
  valor: number;
  unidad: string;
  periodo: Periodo;
  xp: number;
  recordatorio: boolean;
  mostrarInicio: boolean;
  activo: boolean;
  cumplidoEn: InstanteISO | null;
};

/** Datos suficientes para crear un objetivo. El repositorio pone id y fechas. */
export type NuevoObjetivo = Omit<Objetivo, keyof Entidad | 'cumplidoEn'> & {
  cumplidoEn?: InstanteISO | null;
};

export const ETIQUETA_PERIODO: Record<Periodo, string> = {
  comida: 'En cada comida',
  dia: 'Cada día',
  semana: 'Se reinicia cada semana',
  mes: 'Cada mes',
  hito: 'Sin fecha límite',
};
