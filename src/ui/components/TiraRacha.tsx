import { Pressable, StyleSheet, View } from 'react-native';

import type { semanaDeRacha } from '../../domain/rules/racha';
import { makeStyles } from '../theme';
import { Text } from './Text';

type Props = {
  dias: ReturnType<typeof semanaDeRacha>;
  /** Abre ese día en el historial. Los días futuros no se pueden tocar. */
  onDia?: (fecha: string) => void;
};

/** Los siete días de la semana, marcados los que tienen registro. */
export function TiraRacha({ dias, onDia }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.fila}>
      {dias.map((d) => {
        const contenido = (
          <View
            style={[
              styles.dia,
              d.activo && styles.activo,
              d.esHoy && styles.hoy,
              d.futuro && styles.futuro,
            ]}
          >
            <Text variant="small" weight="bold" tone={d.activo ? 'ink' : 'faint'}>
              {d.inicial}
            </Text>
          </View>
        );

        if (!onDia || d.futuro) {
          return (
            <View
              key={d.fecha}
              accessibilityLabel={`${d.fecha}${d.activo ? ', con registro' : ', sin registro'}`}
              style={styles.celda}
            >
              {contenido}
            </View>
          );
        }

        return (
          <Pressable
            key={d.fecha}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${d.fecha} en el historial`}
            onPress={() => onDia(d.fecha)}
            style={({ pressed }) => [styles.celda, pressed && { opacity: 0.7 }]}
          >
            {contenido}
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
    celda: { flex: 1 },
    dia: {
      height: 30,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activo: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
    },
    hoy: {
      borderColor: t.colors.accent,
      borderWidth: 2,
    },
    futuro: {
      opacity: 0.35,
    },
  }),
);
