import { Pressable, StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

type Props = {
  paso: number;
  total: number;
  onBack?: () => void;
};

/** Cabecera de los pasos del onboarding: flecha, "Paso N de M" y barra. */
export function StepHeader({ paso, total, onBack }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <View style={styles.fila}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atrás"
            onPress={onBack}
            hitSlop={12}
          >
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
        ) : (
          <View style={styles.hueco} />
        )}
        <Text variant="body" weight="bold">{`Paso ${paso} de ${total}`}</Text>
      </View>
      <ProgressBar value={paso / total} />
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.md,
      gap: t.spacing.md,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.lg,
    },
    hueco: { width: 16 },
  }),
);
