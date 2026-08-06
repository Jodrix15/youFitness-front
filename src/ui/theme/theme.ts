/**
 * El tema es la capa que traduce tokens crudos a roles semánticos.
 *
 * Los componentes consumen ROLES (`colors.surface`, `colors.textMuted`), nunca
 * tokens crudos (`palette.panel2`). Así se puede crear un tema claro, o cambiar
 * la paleta entera, sin tocar un solo componente.
 */

import {
  alpha,
  barraNavegacion,
  brilloAccion,
  control,
  duration,
  fontSize,
  fontWeight,
  gradients,
  layout,
  letterSpacing,
  lineHeight,
  palette,
  pista,
  radius,
  spacing,
} from './tokens';

export type ThemeColors = {
  background: string;
  backgroundElevated: string;

  surface: string;
  surfaceAlt: string;
  surfaceHigh: string;

  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textFaint: string;

  accent: string;
  accentDeep: string;
  accentInk: string;
  accentSurface: string;
  accentBorder: string;

  xp: string;
  xpLight: string;
  xpSurface: string;
  xpBorder: string;

  warning: string;
  warningSurface: string;
  warningBorder: string;

  danger: string;
  dangerLight: string;
  dangerSurface: string;
  dangerBorder: string;

  success: string;
  info: string;

  /** Fondo de barras de progreso. */
  track: string;
  /** Fondo de la barra de navegación inferior. */
  navSurface: string;
  /** Resplandor del botón central. */
  accentGlow: string;

  shadow: string;
  overlay: string;
};

export type Theme = {
  name: string;
  dark: boolean;
  colors: ThemeColors;
  gradients: typeof gradients;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  letterSpacing: typeof letterSpacing;
  control: typeof control;
  layout: typeof layout;
  duration: typeof duration;
};

export const darkTheme: Theme = {
  name: 'dark',
  dark: true,
  colors: {
    background: palette.bg,
    backgroundElevated: palette.bg2,

    surface: palette.panel,
    surfaceAlt: palette.panel2,
    surfaceHigh: palette.panel3,

    border: palette.line,
    borderStrong: palette.line2,

    text: palette.txt,
    textMuted: palette.dim,
    textFaint: palette.dim2,

    accent: palette.acc,
    accentDeep: palette.acc2,
    accentInk: palette.accInk,
    accentSurface: alpha.accSoft,
    accentBorder: alpha.accBorder,

    xp: palette.xp,
    xpLight: palette.xp2,
    xpSurface: alpha.xpSoft,
    xpBorder: alpha.xpBorder,

    warning: palette.gold,
    warningSurface: alpha.goldSoft,
    warningBorder: alpha.goldBorder,

    danger: palette.rose,
    dangerLight: palette.rose2,
    dangerSurface: alpha.roseSoft,
    dangerBorder: alpha.roseBorder,

    success: palette.green,
    info: palette.blue,

    track: pista,
    navSurface: barraNavegacion,
    accentGlow: brilloAccion,

    shadow: alpha.shadow,
    overlay: alpha.overlay,
  },
  gradients,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  control,
  layout,
  duration,
};

/** Tema por defecto. El día que exista uno claro, se añade aquí y se elige en el provider. */
export const defaultTheme = darkTheme;
