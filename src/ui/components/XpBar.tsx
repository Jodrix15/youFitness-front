import { StyleSheet, View } from 'react-native';

import type { EstadoNivel, ProximoRango } from '../../domain/rules/xp';
import { fraccionDeNivel } from '../../domain/rules/xp';
import { makeStyles } from '../theme';
import { decimal, entero } from '../format';
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
  /** XP ganado hoy, para decir cuánto ha movido la barra. */
  xpHoy?: number;
  /** Línea extra bajo la barra, para pantallas sin siguiente rango que mostrar. */
  pie?: string;
};

/**
 * Tarjeta de nivel y XP. Calcada del mockup:
 *
 *   🛡️ NIVEL 7 · GUERRERO DE HIERRO                      78%
 *   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░
 *   5.460 / 7.000 XP                   1.540 XP → Veterano
 *
 * Los números de la izquierda son EL XP DENTRO DEL NIVEL, no el de por vida: al
 * subir vuelven a cero y la barra empieza de nuevo. El total acumulado no se
 * pierde —vive en el log de eventos y se ve en Perfil—, pero enseñarlo aquí
 * haría que la barra pareciera avanzar cuando en realidad estás estancado.
 *
 * A la derecha va el siguiente RANGO, no el siguiente nivel: subir de nivel pasa
 * a menudo, cambiar de rango es el hito que se celebra.
 */
export function XpBar({ estado, proximoRango, xpHoy, pie }: Props) {
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
          {estado.xpParaSubir == null
            ? `${entero(estado.xpTotal)} XP · nivel máximo`
            : `${entero(estado.xpEnNivel)} / ${entero(estado.xpParaSubir)} XP`}
        </Text>
        {proximoRango ? (
          <Text variant="small" weight="bold" tone="warning">
            {`${entero(proximoRango.xpRestante)} XP → ${proximoRango.rango}`}
          </Text>
        ) : null}
      </View>

      {xpHoy != null && xpHoy > 0 && estado.xpParaSubir != null ? (
        <Text variant="small" tone="faint">
          {`Hoy has llenado ${porcentaje(fraccionDeNivel(xpHoy, estado))} de este nivel.`}
        </Text>
      ) : null}

      {pie ? (
        <Text variant="small" tone="faint">
          {pie}
        </Text>
      ) : null}
    </Card>
  );
}

/**
 * Porcentaje honesto en la parte baja de la escala.
 *
 * Redondear a entero convertiría un 0,4 % en «0 %», que parece un error de la
 * app en vez de lo que es: un día que casi no ha movido una barra que ya cuesta
 * mucho. Por debajo del 1 % se enseña un decimal.
 */
function porcentaje(fraccion: number): string {
  const pct = fraccion * 100;
  if (pct >= 10) return `un ${entero(pct)} %`;
  if (pct >= 1) return `un ${decimal(pct, 1)} %`;
  return `un ${decimal(pct, 2)} %`;
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
