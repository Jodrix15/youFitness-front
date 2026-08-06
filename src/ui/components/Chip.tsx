import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

export type ChipTone = 'neutral' | 'accent' | 'xp' | 'warning' | 'danger';

type Props = {
  label: string;
  selected?: boolean;
  tone?: ChipTone;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({ label, selected = false, tone = 'accent', onPress, style }: Props) {
  const styles = useStyles();
  const theme = useTheme();

  const active: ViewStyle =
    tone === 'xp'
      ? { backgroundColor: theme.colors.xpSurface, borderColor: theme.colors.xpBorder }
      : tone === 'warning'
        ? { backgroundColor: theme.colors.warningSurface, borderColor: theme.colors.warningBorder }
        : tone === 'danger'
          ? { backgroundColor: theme.colors.dangerSurface, borderColor: theme.colors.dangerBorder }
          : { backgroundColor: theme.colors.accentSurface, borderColor: theme.colors.accentBorder };

  const textTone =
    tone === 'xp' ? 'xp' : tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : 'accent';

  const content = (
    <View style={[styles.base, selected ? active : null, style]}>
      <Text variant="small" weight="semibold" tone={selected ? textTone : 'muted'}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
    >
      {content}
    </Pressable>
  );
}

/** Fila de chips que envuelve. Equivale a `.chips` en los mockups. */
export function ChipRow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const styles = useStyles();
  return <View style={[styles.row, style]}>{children}</View>;
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    base: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceAlt,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing.sm,
    },
  }),
);
