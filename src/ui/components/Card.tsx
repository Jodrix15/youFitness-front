import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme, type Theme } from '../theme';

export type CardVariant = 'default' | 'accent' | 'xp' | 'warning' | 'danger' | 'flat' | 'dashed';

type Props = {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
};

/** Panel base. Equivale a `.p` y sus modificadores en los mockups. */
export function Card({ children, variant = 'default', style }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  return <View style={[styles.base, variantStyle(theme, variant), style]}>{children}</View>;
}

function variantStyle(t: Theme, variant: CardVariant): ViewStyle {
  switch (variant) {
    case 'accent':
      return { borderColor: t.colors.accentBorder, backgroundColor: t.colors.accentSurface };
    case 'xp':
      return { borderColor: t.colors.xpBorder, backgroundColor: t.colors.xpSurface };
    case 'warning':
      return { borderColor: t.colors.warningBorder, backgroundColor: t.colors.warningSurface };
    case 'danger':
      return { borderColor: t.colors.dangerBorder, backgroundColor: t.colors.dangerSurface };
    case 'flat':
      return { backgroundColor: t.colors.surfaceAlt };
    case 'dashed':
      return {
        borderStyle: 'dashed',
        borderColor: t.colors.borderStrong,
        backgroundColor: 'transparent',
      };
    default:
      return {};
  }
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    base: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.xl,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
    },
  }),
);
