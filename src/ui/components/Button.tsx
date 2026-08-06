import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Gradient } from './Gradient';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

/**
 * El botón principal es un degradado (`acc → acc2`), como en los mockups.
 * Las demás variantes son planas: solo puede haber una acción principal a la
 * vista, y el degradado es lo que la distingue.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const inactive = disabled || loading;
  const esPrimario = variant === 'primary';

  const superficie: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }
      : variant === 'danger'
        ? { backgroundColor: theme.colors.dangerSurface, borderColor: theme.colors.dangerBorder }
        : { backgroundColor: 'transparent', borderColor: 'transparent' };

  const tono =
    esPrimario ? 'ink' : variant === 'danger' ? 'danger' : variant === 'ghost' ? 'muted' : 'default';

  const contenido = loading ? (
    <ActivityIndicator size="small" color={esPrimario ? theme.colors.accentInk : theme.colors.accent} />
  ) : (
    <Text variant="body" weight="bold" tone={tono}>
      {label}
    </Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.contenedor,
        size === 'sm' && styles.contenedorSm,
        pressed && !inactive ? styles.pulsado : null,
        inactive ? styles.inactivo : null,
        style,
      ]}
    >
      {esPrimario ? (
        <Gradient nombre="accion" style={[styles.relleno, size === 'sm' && styles.rellenoSm]}>
          {contenido}
        </Gradient>
      ) : (
        <View style={[styles.relleno, styles.plano, size === 'sm' && styles.rellenoSm, superficie]}>
          {contenido}
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    contenedor: {
      height: t.control.buttonHeight,
      borderRadius: t.radius.lg,
      overflow: 'hidden',
    },
    contenedorSm: {
      height: t.control.buttonHeightSm,
      borderRadius: t.radius.md,
    },
    relleno: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.sm,
      paddingHorizontal: t.spacing.xl,
      borderRadius: t.radius.lg,
    },
    rellenoSm: {
      borderRadius: t.radius.md,
    },
    plano: {
      borderWidth: 1,
    },
    pulsado: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    inactivo: {
      opacity: 0.4,
    },
  }),
);
