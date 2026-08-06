import type { Entidad, FechaISO, Uuid } from './comunes';

/**
 * Evento de XP. LA DECISIÓN MÁS IMPORTANTE DEL MODELO (especificación §4).
 *
 * El XP no es un contador guardado en el perfil: es un log inmutable. El nivel
 * y el rango son derivados, `SUM(xpFinal)`. Consecuencias:
 *
 *  - Si cambias las reglas de gamificación, recalculas el pasado en lugar de
 *    arrastrar una cifra incoherente.
 *  - Puedes explicar cualquier punto: «estos 245 XP vienen de esta sesión».
 *  - El desglose de «de dónde sale tu XP» es una agrupación, no un contador
 *    extra que mantener sincronizado.
 *
 * Un evento NUNCA se edita. Si un registro se deshace, se escribe un evento
 * compensatorio con signo contrario.
 */
export type TipoXpEvento =
  | 'peso_registrado'
  | 'comida_registrada'
  | 'desliz_registrado'
  | 'habito_bueno'
  | 'habito_malo_marcado'
  | 'dia_cerrado'
  | 'entreno_completado'
  | 'serie_registrada'
  | 'record_personal'
  | 'escalon_subido'
  | 'objetivo_cumplido'
  | 'objetivo_incumplido'
  | 'dia_sin_registrar'
  | 'entreno_saltado'
  | 'desliz_sobre_presupuesto'
  | 'ajuste_manual';

export type XpEvento = Entidad & {
  fecha: FechaISO;
  hora: string;
  tipo: TipoXpEvento;
  /** Tabla y fila que originaron el evento, para poder explicarlo. */
  origenTabla: string | null;
  origenId: Uuid | null;
  xpBase: number;
  multiplicador: number;
  /** Con signo. Es la única columna que se suma. */
  xpFinal: number;
  nota: string | null;
};

export type NuevoXpEvento = Omit<XpEvento, keyof Entidad>;

export const ETIQUETA_XP: Record<TipoXpEvento, string> = {
  peso_registrado: 'Peso registrado',
  comida_registrada: 'Comida registrada',
  desliz_registrado: 'Desliz registrado',
  habito_bueno: 'Hábito cumplido',
  habito_malo_marcado: 'Mal hábito anotado',
  dia_cerrado: 'Día cerrado',
  entreno_completado: 'Entreno completado',
  serie_registrada: 'Serie registrada',
  record_personal: 'Récord personal',
  escalon_subido: 'Escalón superado',
  objetivo_cumplido: 'Objetivo cumplido',
  objetivo_incumplido: 'Objetivo incumplido',
  dia_sin_registrar: 'Día sin registrar',
  entreno_saltado: 'Entreno saltado',
  desliz_sobre_presupuesto: 'Desliz sobre el presupuesto',
  ajuste_manual: 'Ajuste manual',
};
