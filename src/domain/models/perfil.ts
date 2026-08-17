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
  /**
   * Oculta el número del peso y deja solo la tendencia.
   *
   * Para quien la cifra diaria le hace más daño que bien: la media de 7 días
   * sigue estando, que además es la que dice la verdad. La app no pierde nada,
   * porque el número suelto nunca fue la señal.
   */
  modoCompasivo: boolean;
  /** Instantánea semanal automática dentro del propio dispositivo. */
  copiaAutomatica: boolean;
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
  modoCompasivo: false,
  copiaAutomatica: true,
} as const;

export const INTENSIDADES: readonly { valor: IntensidadGamificacion; etiqueta: string }[] = [
  { valor: 'discreta', etiqueta: 'Suave' },
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'alta', etiqueta: 'Modo bestia' },
];

/** Límites de cordura. No son consejo médico: descartan datos imposibles. */
export const LIMITES = {
  pesoKg: { min: 30, max: 300 },
  alturaCm: { min: 120, max: 230 },
  edad: { min: 14, max: 100 },
  cinturaCm: { min: 40, max: 200 },
} as const;
