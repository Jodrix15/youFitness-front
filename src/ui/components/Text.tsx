import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme, type Theme } from '../theme';

export type TextVariant =
  | 'hero'
  | 'brand'
  | 'display'
  | 'displaySm'
  | 'title'
  | 'label'
  | 'body'
  | 'caption'
  | 'small'
  | 'overline';

export type TextTone = 'default' | 'muted' | 'faint' | 'accent' | 'xp' | 'warning' | 'danger' | 'success' | 'ink';

type Props = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
  center?: boolean;
};

/**
 * Todo el texto de la app pasa por aquí.
 *
 * Ninguna pantalla escribe `fontSize` ni `color` a mano: elige una variante y un
 * tono. Cambiar la tipografía de la app entera es editar esta tabla.
 */
export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  center = false,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const base = variantStyle(theme, variant);

  return (
    <RNText
      {...rest}
      style={[
        base,
        { color: toneColor(theme, tone) },
        weight ? { fontWeight: theme.fontWeight[weight] as TextStyle['fontWeight'] } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}

function toneColor(t: Theme, tone: TextTone): string {
  switch (tone) {
    case 'muted':
      return t.colors.textMuted;
    case 'faint':
      return t.colors.textFaint;
    case 'accent':
      return t.colors.accent;
    case 'xp':
      return t.colors.xpLight;
    case 'warning':
      return t.colors.warning;
    case 'danger':
      return t.colors.dangerLight;
    case 'success':
      return t.colors.success;
    case 'ink':
      return t.colors.accentInk;
    default:
      return t.colors.text;
  }
}

function variantStyle(t: Theme, variant: TextVariant): TextStyle {
  switch (variant) {
    case 'hero':
      return {
        fontSize: t.fontSize.hero,
        fontWeight: t.fontWeight.black as TextStyle['fontWeight'],
        letterSpacing: t.letterSpacing.hero,
      };
    case 'brand':
      return {
        fontSize: t.fontSize.brand,
        fontWeight: t.fontWeight.black as TextStyle['fontWeight'],
        letterSpacing: t.letterSpacing.hero,
      };
    case 'display':
      return {
        fontSize: t.fontSize.displayLg,
        fontWeight: t.fontWeight.black as TextStyle['fontWeight'],
        letterSpacing: t.letterSpacing.display,
      };
    case 'displaySm':
      return {
        fontSize: t.fontSize.display,
        fontWeight: t.fontWeight.black as TextStyle['fontWeight'],
        letterSpacing: -0.6,
      };
    case 'title':
      return {
        fontSize: t.fontSize.title,
        fontWeight: t.fontWeight.black as TextStyle['fontWeight'],
        letterSpacing: t.letterSpacing.title,
      };
    case 'label':
      return {
        fontSize: t.fontSize.label,
        fontWeight: t.fontWeight.bold as TextStyle['fontWeight'],
        letterSpacing: -0.2,
      };
    case 'caption':
      return { fontSize: t.fontSize.caption, lineHeight: t.fontSize.caption * t.lineHeight.normal };
    case 'small':
      return { fontSize: t.fontSize.tiny, lineHeight: t.fontSize.tiny * t.lineHeight.normal };
    case 'overline':
      return {
        fontSize: t.fontSize.micro,
        fontWeight: t.fontWeight.black as TextStyle['fontWeight'],
        letterSpacing: t.letterSpacing.wide,
        textTransform: 'uppercase',
      };
    default:
      return { fontSize: t.fontSize.bodyLg, lineHeight: t.fontSize.bodyLg * t.lineHeight.normal };
  }
}
