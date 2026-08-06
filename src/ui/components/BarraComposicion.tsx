import { StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

type Props = {
  icono: string;
  nombre: string;
  detalle: string;
  /** 0..1 */
  valor: number;
  tono?: 'accent' | 'warning' | 'danger';
};

/**
 * Una fila de la composición del día.
 *
 * Se mide en RACIONES, no en gramos ni en calorías: son las únicas unidades que
 * se pueden estimar con la mano y sin báscula, y por tanto las únicas que se
 * mantienen a los seis meses.
 */
export function BarraComposicion({ icono, nombre, detalle, valor, tono = 'accent' }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <View style={styles.fila}>
        <Text variant="small" tone="muted">
          {`${icono} ${nombre}`}
        </Text>
        <Text variant="small" weight="bold">
          {detalle}
        </Text>
      </View>
      <ProgressBar value={valor} tone={tono} />
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.xs },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  }),
);
