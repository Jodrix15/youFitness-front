import { Pressable, StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

type Props = {
  valor: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
  etiquetaMin: string;
  etiquetaMax: string;
  tono?: 'accent' | 'warning' | 'danger';
  etiquetaAccesible: string;
};

/**
 * Escala de 1 a 10 con barra.
 *
 * Se toca directamente sobre los diez segmentos en lugar de arrastrar un
 * deslizador: en móvil, arrastrar con precisión dentro de una lista que hace
 * scroll es incómodo, y aquí no hace falta más resolución que un entero.
 */
export function EscalaNumerica({
  valor,
  onChange,
  min = 1,
  max = 10,
  etiquetaMin,
  etiquetaMax,
  tono = 'accent',
  etiquetaAccesible,
}: Props) {
  const styles = useStyles();
  const pasos = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.wrap}>
      <View style={styles.fila}>
        <Text variant="caption" tone="muted">
          {etiquetaMin}
        </Text>
        <Text variant="body" weight="black" tone={tono === 'accent' ? 'accent' : tono}>
          {`${valor}/${max}`}
        </Text>
        <Text variant="caption" tone="muted">
          {etiquetaMax}
        </Text>
      </View>

      <ProgressBar value={(valor - min + 1) / (max - min + 1)} tone={tono} />

      <View
        style={styles.toques}
        accessibilityRole="adjustable"
        accessibilityLabel={etiquetaAccesible}
        accessibilityValue={{ now: valor, min, max }}
      >
        {pasos.map((n) => (
          <Pressable
            key={n}
            accessibilityLabel={`${n}`}
            onPress={() => onChange(n)}
            style={styles.toque}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.sm },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toques: {
      flexDirection: 'row',
      marginTop: -t.spacing.md,
      height: 26,
    },
    toque: { flex: 1 },
  }),
);
