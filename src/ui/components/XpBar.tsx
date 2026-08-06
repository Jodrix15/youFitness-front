import { StyleSheet, View } from 'react-native';

import type { EstadoNivel, ProximoRango } from '../../domain/rules/xp';
import { makeStyles } from '../theme';
import { entero } from '../format';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

type Props = {
  /**
   * `EstadoNivel` es un objeto de valor ya calculado, sin comportamiento: la
   * tarjeta solo lo pinta. Todo el cálculo vive en `domain/rules/xp.ts`.
   */
  estado: EstadoNivel;
  proximoRango?: ProximoRango | null;
  /** Línea extra bajo la barra, para pantallas sin siguiente rango que mostrar. */
  pie?: string;
};

/**
 * Tarjeta de nivel y XP. Calcada del mockup:
 *
 *   🛡️ NIVEL 7 · GUERRERO DE HIERRO                      78%
 *   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░
 *   2.340 / 3.000 XP                     660 XP → Veterano
 *
 * A la derecha va el siguiente RANGO, no el siguiente nivel: subir de nivel pasa
 * a menudo, cambiar de rango es el hito que se celebra.
 */
export function XpBar({ estado, proximoRango, pie }: Props) {
  const styles = useStyles();

  return (
    <Card variant="xp">
      <View style={styles.fila}>
        <View style={styles.titulo}>
          <Text style={styles.icono}>{estado.icono}</Text>
          <Text variant="caption" weight="black" tone="xp" style={styles.rango} numberOfLines={1}>
            {`NIVEL ${estado.nivel} · ${estado.rango.toUpperCase()}`}
          </Text>
        </View>
        <Text variant="small" tone="muted">
          {`${Math.round(estado.progreso * 100)}%`}
        </Text>
      </View>

      <ProgressBar value={estado.progreso} tone="xp" destacada />

      <View style={styles.fila}>
        <Text variant="small" tone="faint">
          {estado.xpSiguienteNivel == null
            ? `${entero(estado.xpTotal)} XP`
            : `${entero(estado.xpTotal)} / ${entero(estado.xpSiguienteNivel)} XP`}
        </Text>
        {proximoRango ? (
          <Text variant="small" weight="bold" tone="warning">
            {`${entero(proximoRango.xpRestante)} XP → ${proximoRango.rango}`}
          </Text>
        ) : null}
      </View>

      {pie ? (
        <Text variant="small" tone="faint">
          {pie}
        </Text>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.md,
    },
    titulo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      flexShrink: 1,
    },
    icono: { fontSize: 15, lineHeight: 20 },
    rango: {
      letterSpacing: 0.6,
      flexShrink: 1,
    },
  }),
);
