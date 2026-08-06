import { Pressable, StyleSheet, View } from 'react-native';

import { MAX_PORCIONES } from '../../domain/models/comida';
import { makeStyles } from '../theme';
import { Text } from './Text';

type Props = {
  icono: string;
  nombre: string;
  medida: string;
  valor: number;
  onChange: (valor: number) => void;
};

/**
 * Contador de raciones de 0 a 3, con la medida de la mano como referencia.
 *
 * Tocar el punto ya seleccionado lo desmarca: sin eso, poner un 1 por error
 * obligaría a subir hasta 3 y dar la vuelta.
 *
 * El tope de 3 no es arbitrario. Con más resolución la gente empieza a debatir
 * consigo misma si fueron 4 o 5 raciones, que es justo la precisión falsa que
 * la app evita.
 */
export function ContadorPorciones({ icono, nombre, medida, valor, onChange }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.fila}>
      <Text style={styles.icono}>{icono}</Text>

      <View style={styles.textos}>
        <Text variant="caption" weight="bold">
          {nombre}
        </Text>
        <Text variant="small" tone="faint">
          {medida}
        </Text>
      </View>

      <View style={styles.puntos} accessibilityRole="adjustable" accessibilityLabel={nombre}>
        {Array.from({ length: MAX_PORCIONES }, (_, i) => i + 1).map((n) => {
          const activo = valor >= n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${nombre}: ${n} ${n === 1 ? 'ración' : 'raciones'}`}
              accessibilityState={{ selected: activo }}
              onPress={() => onChange(valor === n ? n - 1 : n)}
              style={[styles.punto, activo && styles.puntoActivo]}
            >
              <Text variant="small" weight="bold" tone={activo ? 'ink' : 'faint'}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingVertical: t.spacing.sm,
    },
    icono: { fontSize: 20, lineHeight: 26 },
    textos: { flex: 1, gap: 1 },
    puntos: { flexDirection: 'row', gap: t.spacing.xs },
    punto: {
      width: 30,
      height: 30,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    puntoActivo: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
    },
  }),
);
