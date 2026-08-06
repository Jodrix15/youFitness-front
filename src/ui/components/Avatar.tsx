import { StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { Gradient } from './Gradient';
import { Text } from './Text';

type Props = {
  emoji: string;
  size?: number;
  /** Insignia con el nivel actual, abajo a la derecha. */
  nivel?: number;
};

/**
 * Icono de marca y avatar del usuario. Cuadrado con esquinas muy redondeadas y
 * degradado morado → turquesa, igual que en los mockups.
 *
 * El radio se calcula a partir del tamaño (30 %) para que la forma se mantenga
 * al escalar: en el mockup son 12 px sobre 38, y 28 sobre 92.
 */
export function Avatar({ emoji, size = 92, nivel }: Props) {
  const styles = useStyles();

  return (
    <View style={{ width: size, height: size }}>
      <Gradient
        nombre="marca"
        style={[styles.caja, { width: size, height: size, borderRadius: Math.round(size * 0.3) }]}
      >
        <Text style={{ fontSize: Math.round(size * 0.42), lineHeight: Math.round(size * 0.52) }}>
          {emoji}
        </Text>
      </Gradient>

      {nivel != null ? (
        <View style={styles.insignia}>
          <Text variant="small" weight="black" tone="warning" style={styles.insigniaTexto}>
            {nivel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    caja: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    insignia: {
      position: 'absolute',
      bottom: -6,
      right: -6,
      minWidth: 20,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.background,
      borderWidth: 1.5,
      borderColor: t.colors.warning,
      alignItems: 'center',
      justifyContent: 'center',
    },
    insigniaTexto: {
      fontSize: 9.5,
      lineHeight: 13,
    },
  }),
);
