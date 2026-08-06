import { Pressable, StyleSheet } from 'react-native';

import { makeStyles } from '../theme';
import { Text } from './Text';

type Props = {
  icono: string;
  etiqueta: string;
  onPress?: () => void;
  activo?: boolean;
};

/** Botón cuadrado de cabecera. Equivale a `.ic` en los mockups. */
export function BotonIcono({ icono, etiqueta, onPress, activo = false }: Props) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo, disabled: !onPress }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.caja,
        activo && styles.activo,
        !onPress && styles.apagado,
        pressed && onPress ? styles.pulsado : null,
      ]}
    >
      <Text variant="caption">{icono}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    caja: {
      width: t.control.iconSize,
      height: t.control.iconSize,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activo: {
      backgroundColor: t.colors.accentSurface,
      borderColor: t.colors.accentBorder,
    },
    apagado: { opacity: 0.45 },
    pulsado: { backgroundColor: t.colors.surfaceHigh },
  }),
);
