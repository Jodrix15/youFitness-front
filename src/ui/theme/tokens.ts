/**
 * Tokens de diseño — ÚNICA fuente de verdad visual de la app.
 *
 * Valores extraídos de las variables CSS de los mockups v2.
 *
 * REGLA: ningún componente ni pantalla escribe un color, un tamaño de fuente
 * o un espaciado literal. Todo sale de aquí. Cambiar el aspecto de la app
 * entera debe ser editar este fichero y nada más.
 */

export const palette = {
  bg: '#080b12',
  bg2: '#0d111b',

  panel: '#131926',
  panel2: '#1a2132',
  panel3: '#212a3f',

  line: '#28324a',
  line2: '#354160',

  txt: '#eaeff9',
  dim: '#8b95af',
  dim2: '#5f6884',

  acc: '#2ee6c8',
  acc2: '#12b8a0',
  accInk: '#04121a',

  xp: '#8b5cf6',
  xp2: '#a78bfa',

  gold: '#fbbf24',
  rose: '#f4506e',
  rose2: '#ff8fa3',
  green: '#4ade80',
  blue: '#60a5fa',
  orange: '#fb923c',

  transparent: 'transparent',
} as const;

/** Colores con alfa. RN no soporta `color-mix`, así que se declaran explícitos. */
export const alpha = {
  accSoft: 'rgba(46,230,200,0.10)',
  accSoft2: 'rgba(46,230,200,0.15)',
  accBorder: 'rgba(46,230,200,0.35)',
  accBorderStrong: 'rgba(46,230,200,0.45)',

  xpSoft: 'rgba(139,92,246,0.14)',
  xpBorder: 'rgba(139,92,246,0.45)',

  goldSoft: 'rgba(251,191,36,0.10)',
  goldBorder: 'rgba(251,191,36,0.40)',

  roseSoft: 'rgba(244,80,110,0.10)',
  roseBorder: 'rgba(244,80,110,0.40)',

  shadow: 'rgba(0,0,0,0.55)',
  overlay: 'rgba(4,6,12,0.72)',
} as const;

/**
 * Degradados de los mockups.
 *
 * Se declaran como tokens y no dentro de los componentes porque son identidad
 * de marca: el icono, el botón principal y la barra de XP comparten la misma
 * pareja de colores, y tienen que seguir compartiéndola si mañana cambia.
 */
export const gradients = {
  /** Icono de marca. `linear-gradient(150deg, xp, acc)` en el mockup. */
  marca: {
    colors: [palette.xp, palette.acc] as const,
    start: { x: 0.1, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  /** Botón principal. `linear-gradient(135deg, acc, acc2)`. */
  accion: {
    colors: [palette.acc, palette.acc2] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /** Relleno de la barra de XP. `linear-gradient(90deg, xp, acc)`. */
  xp: {
    colors: [palette.xp, palette.acc] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  /**
   * Botón central de registro rápido. `linear-gradient(135deg, acc, xp)`.
   *
   * Va al revés que `marca` a propósito: el icono de la app empieza en morado y
   * el botón de acción empieza en turquesa. Es lo que hace que el botón se lea
   * como acción y no como logotipo.
   */
  fab: {
    colors: [palette.acc, palette.xp] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

/** Fondo de la barra de navegación. Más oscuro que cualquier panel. */
export const barraNavegacion = 'rgba(10,14,22,0.96)';

/** Resplandor turquesa del botón central. */
export const brilloAccion = 'rgba(46,230,200,0.35)';

/** Fondo de las barras de progreso. Más oscuro que cualquier panel. */
export const pista = '#0a0f1a';

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 7,
  md: 10,
  lg: 13,
  xl: 16,
  xxl: 22,
  xxxl: 30,
} as const;

export const radius = {
  sm: 6,
  md: 9,
  lg: 12,
  xl: 14,
  pill: 999,
} as const;

export const fontSize = {
  micro: 10.5,
  tiny: 11,
  small: 11.5,
  caption: 12,
  body: 12.5,
  bodyLg: 13,
  label: 15.5,
  title: 17,
  display: 22,
  /** Nombre de la marca en la pantalla de bienvenida. */
  brand: 26,
  displayLg: 29,
  hero: 34,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const letterSpacing = {
  hero: -0.8,
  display: -1.2,
  title: -0.3,
  normal: 0,
  wide: 1.3,
  wider: 2.2,
} as const;

/** Alturas de control, para que todos los toques tengan el mismo tamaño. */
export const control = {
  buttonHeight: 44,
  buttonHeightSm: 36,
  inputHeight: 46,
  iconSize: 30,
  barHeight: 6,
  xpBarHeight: 9,
} as const;

/** Puntos de corte. Los mockups son la columna de 316 px; el resto se deriva. */
export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1180,
} as const;

/** Ancho máximo de la columna de contenido. Mantiene la app legible en un monitor. */
export const layout = {
  phoneColumnWidth: 420,
  tabletColumnWidth: 560,
  contentMaxWidth: 1120,
} as const;

export const duration = {
  fast: 120,
  normal: 180,
  slow: 320,
} as const;
