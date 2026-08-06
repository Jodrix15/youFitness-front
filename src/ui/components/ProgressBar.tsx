import { StyleSheet, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Gradient } from './Gradient';

type Props = {
  /** 0..1. Se recorta al rango automáticamente. */
  value: number;
  tone?: 'accent' | 'xp' | 'warning' | 'danger';
  height?: number;
  /** Barra de XP: relleno en degradado, borde y resplandor, como el mockup. */
  destacada?: boolean;
  style?: ViewStyle;
};

export function ProgressBar({ value, tone = 'accent', height, destacada = false, style }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

  const relleno =
    tone === 'xp'
      ? theme.colors.xp
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'danger'
          ? theme.colors.danger
          : theme.colors.accent;

  const alto = height ?? (destacada ? theme.control.xpBarHeight : theme.control.barHeight);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(pct * 100), min: 0, max: 100 }}
      style={[
        styles.pista,
        { height: alto, borderRadius: alto },
        destacada && styles.pistaDestacada,
        style,
      ]}
    >
      {destacada ? (
        <Gradient
          nombre="xp"
          style={[styles.relleno, { width: `${pct * 100}%`, borderRadius: alto } as ViewStyle]}
        />
      ) : (
        <View
          style={[styles.relleno, { width: `${pct * 100}%`, backgroundColor: relleno, borderRadius: alto }]}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    pista: {
      backgroundColor: t.colors.track,
      overflow: 'hidden',
      width: '100%',
    },
    pistaDestacada: {
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    relleno: {
      height: '100%',
    },
  }),
);
