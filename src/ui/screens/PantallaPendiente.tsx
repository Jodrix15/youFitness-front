import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '../components';
import { makeStyles } from '../theme';

type Props = {
  titulo: string;
  bloque: string;
  descripcion: string;
  contenido: readonly string[];
};

/**
 * Estado «aún no construido» para las pestañas de bloques posteriores.
 *
 * Existe para que la navegación esté completa desde ya sin fingir que la
 * pantalla funciona. Dice qué irá aquí y en qué bloque, en vez de dejar un
 * hueco en blanco que parece un fallo.
 */
export function PantallaPendiente({ titulo, bloque, descripcion, contenido }: Props) {
  const styles = useStyles();

  return (
    <Screen>
      <View style={styles.intro}>
        <Text variant="displaySm">{titulo}</Text>
        <Text variant="caption" tone="muted">
          {descripcion}
        </Text>
      </View>

      <Card variant="dashed">
        <Text variant="overline" tone="faint">
          {bloque}
        </Text>
        <Text variant="caption" tone="muted">
          Todavía no está construido. Aquí irá:
        </Text>
        <View style={styles.lista}>
          {contenido.map((linea) => (
            <Text key={linea} variant="caption" tone="muted">
              {`·  ${linea}`}
            </Text>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    intro: { gap: t.spacing.xs },
    lista: { gap: t.spacing.xs, marginTop: t.spacing.xs },
  }),
);
