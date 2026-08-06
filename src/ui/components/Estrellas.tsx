import { Pressable, StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { Text } from './Text';

type Props = {
  valor: number | null;
  onChange: (valor: number) => void;
  total?: number;
  etiquetaAccesible: string;
};

export function Estrellas({ valor, onChange, total = 5, etiquetaAccesible }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.fila} accessibilityRole="radiogroup" accessibilityLabel={etiquetaAccesible}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <Pressable
          key={n}
          accessibilityRole="radio"
          accessibilityState={{ selected: valor === n }}
          accessibilityLabel={`${n} de ${total}`}
          onPress={() => onChange(n)}
          hitSlop={4}
        >
          <Text style={[styles.estrella, valor != null && n <= valor ? styles.llena : styles.vacia]}>
            {valor != null && n <= valor ? '★' : '☆'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', gap: t.spacing.xs },
    estrella: { fontSize: 20, lineHeight: 26 },
    llena: { color: t.colors.warning },
    vacia: { color: t.colors.textFaint },
  }),
);
