import type { Entidad, FechaISO } from './comunes';

/**
 * Un pesaje. Especificación §4.
 *
 * `fecha` es única por usuario: pesarse dos veces el mismo día sobrescribe, no
 * acumula. Dos pesajes de un mismo día se diferencian más por la hora y la
 * hidratación que por cambio real, y meter los dos ensucia la media.
 */
export type PesoRegistro = Entidad & {
  fecha: FechaISO;
  pesoKg: number;
  /** Hora local `HH:MM`, informativa. */
  hora: string | null;
  nota: string | null;
};

export type TipoMedida = 'cintura' | 'cuello' | 'cadera' | 'pecho' | 'brazo' | 'muslo';

export type Medida = Entidad & {
  fecha: FechaISO;
  tipo: TipoMedida;
  valorCm: number;
};

export const ETIQUETA_MEDIDA: Record<TipoMedida, string> = {
  cintura: 'Cintura',
  cuello: 'Cuello',
  cadera: 'Cadera',
  pecho: 'Pecho',
  brazo: 'Brazo',
  muslo: 'Muslo',
};
