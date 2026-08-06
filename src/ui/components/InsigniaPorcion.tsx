import { StyleSheet, View } from 'react-native';

import type { Comida } from '../../domain/models/comida';
import { GRUPOS } from '../../domain/models/comida';
import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  comida: Pick<Comida, 'protPorciones' | 'verdPorciones' | 'hidrPorciones' | 'grasPorciones'>;
};

const COLOR_GRUPO = {
  proteina: 'info',
  verdura: 'success',
  hidratos: 'warning',
  grasa: 'accent',
} as const;

/** Insignias de composición de un plato: ✋1 ✊2 🤲1 👍1 */
export function InsigniasPorciones({ comida }: Props) {
  const styles = useStyles();
  const theme = useTheme();

  const presentes = GRUPOS.filter((g) => comida[g.campo] > 0);
  if (presentes.length === 0) return null;

  const color = {
    info: theme.colors.info,
    success: theme.colors.success,
    warning: theme.colors.warning,
    accent: theme.colors.accent,
  };

  return (
    <View style={styles.fila}>
      {presentes.map((g) => {
        const tono = color[COLOR_GRUPO[g.clave]];
        return (
          <View key={g.clave} style={[styles.insignia, { borderColor: tono }]}>
            <Text variant="small" weight="bold" style={{ color: tono }}>
              {`${g.icono} ${comida[g.campo]}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
    insignia: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 2,
      borderRadius: t.radius.sm,
      borderWidth: 1,
      backgroundColor: t.colors.surfaceAlt,
    },
  }),
);
