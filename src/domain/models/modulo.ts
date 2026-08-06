import type { Entidad } from './comunes';

/**
 * Bloques que el usuario elige seguir. Especificación §3, pantalla 03.
 *
 * REGLA: los bloques controlan las tarjetas de Inicio y las fuentes de XP.
 * NO ocultan pestañas. §10 lo descarta explícitamente: serían 32 combinaciones
 * de navegación que probar, y quien activa un bloque después no encuentra dónde
 * ha aparecido.
 */
export type ClaveModulo = 'grasa' | 'fuerza' | 'comer' | 'mental' | 'sueno';

export type Modulo = Entidad & {
  clave: ClaveModulo;
  activo: boolean;
};

export type DefinicionModulo = {
  clave: ClaveModulo;
  nombre: string;
  descripcion: string;
  icono: string;
  /** Los tres primeros vienen marcados: sin bloques la app no sabe qué mostrar. */
  activoPorDefecto: boolean;
};

export const MODULOS: readonly DefinicionModulo[] = [
  {
    clave: 'grasa',
    nombre: 'Bajar grasa',
    descripcion: 'Peso · cintura · tendencia',
    icono: '⚖️',
    activoPorDefecto: true,
  },
  {
    clave: 'fuerza',
    nombre: 'Ganar fuerza',
    descripcion: 'Series · reps · carga · progresión',
    icono: '💪',
    activoPorDefecto: true,
  },
  {
    clave: 'comer',
    nombre: 'Comer mejor',
    descripcion: 'Comidas · deslices · saciedad',
    icono: '🍎',
    activoPorDefecto: true,
  },
  {
    clave: 'mental',
    nombre: 'Salud mental',
    descripcion: 'Ánimo · estrés · energía',
    icono: '🧠',
    activoPorDefecto: false,
  },
  {
    clave: 'sueno',
    nombre: 'Dormir mejor',
    descripcion: 'Horas · calidad · regularidad',
    icono: '😴',
    activoPorDefecto: false,
  },
] as const;
