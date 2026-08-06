import { Pressable, StyleSheet, View } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { entero } from '../format';
import { Avatar } from './Avatar';
import { Text } from './Text';

type Props = {
  nombre: string;
  /** Línea secundaria: día de la semana y estado de la racha. */
  subtitulo: string;
  nivel: number;
  diasDeRacha: number;
  onPerfil?: () => void;
};

/**
 * Cabecera de Inicio: avatar con la insignia de nivel, saludo, contador de
 * racha y campana.
 *
 * La campana está apagada a propósito. Los recordatorios se configuran en
 * Ajustes, que aún no existe; dejarla pulsable llevaría a ningún sitio.
 */
export function CabeceraInicio({ nombre, subtitulo, nivel, diasDeRacha, onPerfil }: Props) {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <View style={styles.fila}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tu perfil"
        onPress={onPerfil}
        disabled={!onPerfil}
      >
        <Avatar emoji="🦾" size={38} nivel={nivel} />
      </Pressable>

      <View style={styles.centro}>
        <Text variant="body" weight="bold" numberOfLines={1}>
          {`Hola, ${nombre}`}
        </Text>
        <Text variant="small" tone="faint" numberOfLines={1}>
          {subtitulo}
        </Text>
      </View>

      {diasDeRacha > 0 ? (
        <View style={styles.racha}>
          <Text variant="small" weight="bold" tone="warning">
            {`🔥 ${entero(diasDeRacha)}`}
          </Text>
        </View>
      ) : null}

      <View
        accessibilityRole="button"
        accessibilityLabel="Avisos, aún no disponible"
        accessibilityState={{ disabled: true }}
        style={[styles.icono, { opacity: 0.45 }]}
      >
        <Text variant="caption" tone="muted">
          🔔
        </Text>
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
      paddingRight: t.spacing.xxs,
    },
    centro: { flex: 1, gap: 1 },
    racha: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.warningSurface,
      borderWidth: 1,
      borderColor: t.colors.warningBorder,
    },
    icono: {
      width: t.control.iconSize,
      height: t.control.iconSize,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
);
