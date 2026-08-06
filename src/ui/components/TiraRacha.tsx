import { StyleSheet, View } from 'react-native';

import type { semanaDeRacha } from '../../domain/rules/racha';
import { makeStyles } from '../theme';
import { Text } from './Text';

type Props = {
  dias: ReturnType<typeof semanaDeRacha>;
};

/** Los siete días de la semana, marcados los que tienen registro. */
export function TiraRacha({ dias }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.fila}>
      {dias.map((d) => (
        <View
          key={d.fecha}
          accessibilityLabel={`${d.fecha}${d.activo ? ', con registro' : ', sin registro'}`}
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
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      gap: t.spacing.sm,
    },
    dia: {
      flex: 1,
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
