import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  icono?: string;
  titulo: string;
  subtitulo?: string;
  derecha?: ReactNode;
  seleccionado?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

/** Fila de lista con icono, dos líneas y contenido a la derecha. */
export function ListItem({
  icono,
  titulo,
  subtitulo,
  derecha,
  seleccionado = false,
  onPress,
  style,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();

  const contenido = (
    <View style={[styles.row, style]}>
      {icono ? (
        <View
          style={[
            styles.icono,
            seleccionado && {
              backgroundColor: theme.colors.accentSurface,
              borderColor: theme.colors.accentBorder,
            },
          ]}
        >
          <Text variant="body">{icono}</Text>
        </View>
      ) : null}
      <View style={styles.centro}>
        <Text variant="body" weight="bold">
          {titulo}
        </Text>
        {subtitulo ? (
          <Text variant="small" tone="faint">
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {derecha}
    </View>
  );

  if (!onPress) return contenido;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
    >
      {contenido}
    </Pressable>
  );
}

/** Marca de verificación circular. */
export function Tick({ activo }: { activo: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.tick, activo && styles.tickOn]}>
      {activo ? (
        <Text variant="small" weight="black" tone="ink">
          ✓
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingVertical: t.spacing.xs,
    },
    icono: {
      width: 34,
      height: 34,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centro: {
      flex: 1,
      gap: 2,
    },
    tick: {
      width: 22,
      height: 22,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickOn: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
    },
  }),
);
