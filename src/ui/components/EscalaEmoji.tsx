import { Pressable, StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { Text } from './Text';

type Props = {
  opciones: readonly string[];
  /** 1..opciones.length. `null` si aún no se ha elegido. */
  valor: number | null;
  onChange: (valor: number) => void;
  etiquetaAccesible: string;
};

/** Escala de caras. Se usa para el ánimo del check-in. */
export function EscalaEmoji({ opciones, valor, onChange, etiquetaAccesible }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.fila} accessibilityRole="radiogroup" accessibilityLabel={etiquetaAccesible}>
      {opciones.map((emoji, i) => {
        const n = i + 1;
        const activo = valor === n;
        return (
          <Pressable
            key={emoji}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`${etiquetaAccesible} ${n} de ${opciones.length}`}
            onPress={() => onChange(n)}
            style={[styles.celda, activo && styles.activa]}
          >
            <Text style={[styles.emoji, !activo && styles.apagado]}>{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      gap: t.spacing.sm,
    },
    celda: {
      flex: 1,
      height: 48,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activa: {
      backgroundColor: t.colors.accentSurface,
      borderColor: t.colors.accentBorder,
    },
    emoji: { fontSize: 22, lineHeight: 28 },
    // Las caras no elegidas se apagan en vez de desaparecer: hay que poder
    // comparar la escala entera de un vistazo.
    apagado: { opacity: 0.4 },
  }),
);
