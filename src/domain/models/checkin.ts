import type { Entidad, FechaISO } from './comunes';

/**
 * Check-in nocturno. Especificación §4, pantalla 10.
 *
 * Treinta segundos antes de dormir. Una fila por día: cerrar el día dos veces
 * corrige, no acumula.
 *
 * El SUEÑO SE APUNTA A MANO. No se lee del sistema (§10): sin wearable no hay
 * fuente de la que leerlo, y el sueño autoinformado además correlaciona mejor
 * con el ánimo que el que estima un teléfono en la mesilla.
 */
export type Checkin = Entidad & {
  fecha: FechaISO;
  /** 1..5, de 😣 a 🤩. */
  animo: number;
  /** 1..10. */
  energia: number;
  /** 1..10. Aquí más alto es peor. */
  estres: number;
  suenoHoras: number | null;
  /** 1..5 estrellas. */
  suenoCalidad: number | null;
  /** Hora local `HH:MM` a la que se acostó. */
  horaAcostarse: string | null;
  nota: string | null;
  actividades: ClaveActividad[];
};

export type NuevoCheckin = Omit<Checkin, keyof Entidad>;

export type ClaveActividad =
  | 'meditar'
  | 'luz_solar'
  | 'sin_pantallas'
  | 'ver_gente'
  | 'leer'
  | 'gratitud';

export type DefinicionActividad = {
  clave: ClaveActividad;
  etiqueta: string;
  icono: string;
};

/**
 * Actividades que se marcan como hechas.
 *
 * No dan XP por sí solas: forman parte del check-in, que ya paga 30. Cobrar por
 * cada casilla convertiría la pantalla en una lista de la compra.
 */
export const ACTIVIDADES: readonly DefinicionActividad[] = [
  { clave: 'meditar', etiqueta: 'Meditar 10 min', icono: '🧘' },
  { clave: 'luz_solar', etiqueta: 'Salir a la luz', icono: '☀️' },
  { clave: 'sin_pantallas', etiqueta: 'Sin pantallas 1 h antes', icono: '📵' },
  { clave: 'ver_gente', etiqueta: 'Ver a alguien', icono: '👥' },
  { clave: 'leer', etiqueta: 'Leer', icono: '📖' },
  { clave: 'gratitud', etiqueta: 'Gratitud', icono: '🙏' },
] as const;

export const CARAS_ANIMO = ['😣', '😕', '😐', '🙂', '🤩'] as const;
