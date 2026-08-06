import type { Entidad, FechaISO } from './comunes';

export type Sexo = 'hombre' | 'mujer';

export type PrimerDiaSemana = 'lunes' | 'domingo';

export type IntensidadGamificacion = 'discreta' | 'normal' | 'alta';

/**
 * Perfil del usuario. Especificación §4.
 *
 * No hay `nivelActividad` ni objetivo de calorías: §10 los descarta porque solo
 * servían para estimar el gasto calórico, que la app ya no calcula. El mockup 02
 * todavía los mostraba; manda la especificación.
 */
export type Perfil = Entidad & {
  nombre: string;
  fechaNacimiento: FechaISO | null;
  edad: number | null;
  alturaCm: number;
  sexo: Sexo;
  /** Peso de partida en kg. Los pesajes posteriores viven en `peso_registro`. */
  pesoInicialKg: number;
  /** Perímetro de cintura en cm. Mejor indicador disponible junto a la altura. */
  cinturaCm: number | null;
  primerDiaSemana: PrimerDiaSemana;
  modoEstricto: boolean;
  intensidadGamificacion: IntensidadGamificacion;
  presupuestoDeslicesSemana: number;
};

export type BorradorPerfil = {
  nombre: string;
  alturaCm: number | null;
  edad: number | null;
  sexo: Sexo | null;
  pesoInicialKg: number | null;
  cinturaCm: number | null;
};

export const PERFIL_POR_DEFECTO = {
  primerDiaSemana: 'lunes' as PrimerDiaSemana,
  modoEstricto: false,
  intensidadGamificacion: 'normal' as IntensidadGamificacion,
  presupuestoDeslicesSemana: 2,
} as const;

/** Límites de cordura. No son consejo médico: descartan datos imposibles. */
export const LIMITES = {
  pesoKg: { min: 30, max: 300 },
  alturaCm: { min: 120, max: 230 },
  edad: { min: 14, max: 100 },
  cinturaCm: { min: 40, max: 200 },
} as const;
