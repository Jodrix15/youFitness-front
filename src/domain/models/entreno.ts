import type { Entidad, FechaISO, Uuid } from './comunes';

/**
 * Los cinco tipos de ejercicio. Especificación §4.
 *
 * No son una taxonomía decorativa: cada uno calcula el volumen de una forma
 * distinta y admite campos distintos. Una dominada no tiene `pesoKg`, un L-sit
 * no tiene `reps`.
 */
export type TipoEjercicio = 'externo' | 'corporal' | 'corporal_lastre' | 'isometrico' | 'cardio';

export type DefinicionTipo = {
  clave: TipoEjercicio;
  nombre: string;
  descripcion: string;
  icono: string;
  /** Qué columnas tiene la tabla de series de este tipo. */
  campos: {
    reps: boolean;
    peso: boolean;
    lastre: boolean;
    segundos: boolean;
  };
  /** El factor de apalancamiento solo significa algo si mueves tu propio peso. */
  usaFactor: boolean;
};

export const TIPOS_EJERCICIO: readonly DefinicionTipo[] = [
  {
    clave: 'externo',
    nombre: 'Peso externo',
    descripcion: 'Barra, mancuernas, máquina',
    icono: '🏋️',
    campos: { reps: true, peso: true, lastre: false, segundos: false },
    usaFactor: false,
  },
  {
    clave: 'corporal',
    nombre: 'Peso corporal',
    descripcion: 'Dominadas, flexiones, fondos',
    icono: '🤸',
    campos: { reps: true, peso: false, lastre: false, segundos: false },
    usaFactor: true,
  },
  {
    clave: 'corporal_lastre',
    nombre: 'Corporal con lastre',
    descripcion: 'Lo mismo, con cinturón o chaleco',
    icono: '⛓️',
    campos: { reps: true, peso: false, lastre: true, segundos: false },
    usaFactor: true,
  },
  {
    clave: 'isometrico',
    nombre: 'Isométrico',
    descripcion: 'Plancha, L-sit, hollow body',
    icono: '⏱️',
    campos: { reps: false, peso: false, lastre: true, segundos: true },
    usaFactor: true,
  },
  {
    clave: 'cardio',
    nombre: 'Cardio',
    descripcion: 'Carrera, bici, remo',
    icono: '🏃',
    campos: { reps: false, peso: false, lastre: false, segundos: true },
    usaFactor: false,
  },
] as const;

export type GrupoMuscular =
  | 'pecho'
  | 'espalda'
  | 'hombro'
  | 'biceps'
  | 'triceps'
  | 'pierna'
  | 'gluteo'
  | 'core'
  | 'cuerpo_entero'
  | 'cardio';

export const GRUPOS_MUSCULARES: readonly { valor: GrupoMuscular; etiqueta: string }[] = [
  { valor: 'pecho', etiqueta: 'Pecho' },
  { valor: 'espalda', etiqueta: 'Espalda' },
  { valor: 'hombro', etiqueta: 'Hombro' },
  { valor: 'biceps', etiqueta: 'Bíceps' },
  { valor: 'triceps', etiqueta: 'Tríceps' },
  { valor: 'pierna', etiqueta: 'Pierna' },
  { valor: 'gluteo', etiqueta: 'Glúteo' },
  { valor: 'core', etiqueta: 'Core' },
  { valor: 'cuerpo_entero', etiqueta: 'Cuerpo entero' },
  { valor: 'cardio', etiqueta: 'Cardio' },
];

/**
 * Un ejercicio del catálogo.
 *
 * El catálogo empieza VACÍO. No se incluye una lista precargada: nadie hace
 * cuarenta ejercicios, y una biblioteca llena de cosas que no haces convierte
 * buscar el tuyo en un problema.
 */
export type Ejercicio = Entidad & {
  nombre: string;
  tipo: TipoEjercicio;
  grupoMuscular: GrupoMuscular;
  /**
   * Fracción del peso corporal que mueve el ejercicio. Solo aplica a los tipos
   * que usan el propio cuerpo.
   *
   * Son estimaciones de biomecánica, editables, y solo pretenden hacer el
   * volumen comparable CONTIGO MISMO. Comparar el volumen de dos personas con
   * estos números no significa nada.
   */
  factorApalancamiento: number;
  notas: string | null;
};

export type NuevoEjercicio = Omit<Ejercicio, keyof Entidad>;

/** Referencias orientativas de la especificación, para ayudar al dar de alta. */
export const FACTORES_DE_REFERENCIA: readonly { nombre: string; factor: number }[] = [
  { nombre: 'Dominada', factor: 1.0 },
  { nombre: 'Fondo en paralelas', factor: 0.95 },
  { nombre: 'Sentadilla a una pierna', factor: 0.85 },
  { nombre: 'Flexión', factor: 0.65 },
  { nombre: 'Remo invertido', factor: 0.55 },
];

// ────────────────────────────────────────────────────────────────────────────
// Rutinas
// ────────────────────────────────────────────────────────────────────────────

export type RutinaEjercicio = {
  id: Uuid;
  ejercicioId: Uuid;
  orden: number;
  seriesObj: number;
  repsObj: number | null;
  pesoObj: number | null;
  segundosObj: number | null;
  rirObj: number | null;
};

export type Rutina = Entidad & {
  nombre: string;
  icono: string;
  notas: string | null;
  ejercicios: RutinaEjercicio[];
  vecesUsada: number;
  /**
   * Días de la semana en los que toca esta rutina. 1 = lunes … 7 = domingo.
   *
   * Vacío significa «cuando me apetezca», y entonces la app NUNCA la cuenta
   * como entreno saltado. Es lo que permite distinguir un día de descanso
   * planificado de un día en el que fallaste.
   */
  diasSemana: number[];
};

export type NuevaRutina = Omit<Rutina, keyof Entidad | 'vecesUsada'> & {
  vecesUsada?: number;
};

export const ICONOS_RUTINA = ['🏋️', '🪝', '🦵', '🤸', '🏃', '🧘', '💪', '🔥'] as const;

/** 1 = lunes … 7 = domingo, para que coincida con la semana natural española. */
export const DIAS_SEMANA: readonly { valor: number; etiqueta: string }[] = [
  { valor: 1, etiqueta: 'L' },
  { valor: 2, etiqueta: 'M' },
  { valor: 3, etiqueta: 'X' },
  { valor: 4, etiqueta: 'J' },
  { valor: 5, etiqueta: 'V' },
  { valor: 6, etiqueta: 'S' },
  { valor: 7, etiqueta: 'D' },
];

// ────────────────────────────────────────────────────────────────────────────
// Sesiones y series
// ────────────────────────────────────────────────────────────────────────────

/**
 * Una serie registrada.
 *
 * Las columnas son anulables porque los cinco tipos no comparten forma. La
 * alternativa —una tabla por tipo— multiplicaría por cinco las consultas del
 * historial sin ganar nada.
 */
export type Serie = {
  id: Uuid;
  ejercicioId: Uuid;
  numero: number;
  reps: number | null;
  pesoKg: number | null;
  lastreKg: number | null;
  segundos: number | null;
  /** Repeticiones en recámara. Cuántas más podrías haber hecho. */
  rir: number | null;
  esPr: boolean;
  /** Ya calculado al guardar, para no depender del peso corporal de hoy. */
  volumen: number;
};

export type Sesion = Entidad & {
  rutinaId: Uuid | null;
  nombre: string;
  fecha: FechaISO;
  horaInicio: string;
  horaFin: string | null;
  /** 1..10. Escala RPE simplificada. */
  esfuerzoPercibido: number | null;
  nota: string | null;
  volumenTotal: number;
  /** Segundos de isométrico. Van aparte: no se suman al volumen en kg. */
  segundosIsometricos: number;
  /** Peso corporal usado en los cálculos, congelado al registrar. */
  pesoCorporalKg: number;
  series: Serie[];
  terminada: boolean;
};

export type NuevaSesion = Omit<Sesion, keyof Entidad>;
