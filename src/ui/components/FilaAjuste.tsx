import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  icono?: string;
  titulo: string;
  descripcion?: string;
  /** Interruptor a la derecha. Omitir para una fila informativa. */
  valor?: boolean;
  onCambiar?: (valor: boolean) => void;
  /** Contenido a la derecha cuando no hay interruptor: un valor, una flecha… */
  derecha?: ReactNode;
  onPress?: () => void;
  /** Apagada y no interactiva, con el motivo debajo. */
  pendiente?: string;
};

/**
 * Fila de Ajustes.
 *
 * Un solo componente para los tres casos del mockup: interruptor, valor a la
 * derecha y fila pulsable. Sin él, cada sección acabaría con su propio
 * maquetado y las alturas dejarían de coincidir entre bloques.
 */
export function FilaAjuste({
  icono,
  titulo,
  descripcion,
  valor,
  onCambiar,
  derecha,
  onPress,
  pendiente,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const inactiva = pendiente != null;

  const contenido = (
    <View style={[styles.fila, inactiva && styles.apagada]}>
      {icono ? <Text style={styles.icono}>{icono}</Text> : null}

      <View style={styles.textos}>
        <Text variant="caption" weight="bold">
          {titulo}
        </Text>
        {descripcion ? (
          <Text variant="small" tone="faint">
            {descripcion}
          </Text>
        ) : null}
        {pendiente ? (
          <Text variant="small" tone="warning">
            {pendiente}
          </Text>
        ) : null}
      </View>

      {valor != null ? (
        <Switch
          value={valor}
          onValueChange={onCambiar}
          disabled={inactiva || !onCambiar}
          trackColor={{ true: theme.colors.accentDeep, false: theme.colors.surfaceHigh }}
          thumbColor={valor ? theme.colors.accent : theme.colors.textFaint}
        />
      ) : (
        derecha
      )}
    </View>
  );

  if (!onPress || inactiva) return contenido;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
    >
      {contenido}
    </Pressable>
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
    apagada: { opacity: 0.5 },
    icono: { fontSize: 17, lineHeight: 22, width: 22 },
    textos: { flex: 1, gap: 2 },
  }),
);
