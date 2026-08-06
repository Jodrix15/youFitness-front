import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  /** 0..1 */
  valor: number;
  etiqueta: string;
  /** Texto grande dentro del anillo, p. ej. «2/3». */
  centro: string;
  /** Segunda línea dentro del anillo, más pequeña. */
  centroSecundario?: string;
  color?: string;
  size?: number;
  /** Marca visualmente que el dato no es real todavía. */
  ejemplo?: boolean;
};

const RADIO = 15.5;
const PERIMETRO = 2 * Math.PI * RADIO;

/**
 * Anillo de progreso.
 *
 * Los anillos de Inicio miden cosas CONTABLES: comidas registradas, pasos,
 * hábitos cumplidos. Nada de porcentajes de cumplimiento inventados sobre
 * métricas que la app no puede verificar.
 */
export function Anillo({
  valor,
  etiqueta,
  centro,
  centroSecundario,
  color,
  size = 74,
  ejemplo = false,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, Number.isFinite(valor) ? valor : 0));
  const trazo = color ?? theme.colors.accent;

  return (
    <View style={[styles.wrap, ejemplo && styles.ejemplo]}>
      <View style={{ width: size, height: size }}>
        <Svg viewBox="0 0 36 36" width={size} height={size}>
          <Circle cx="18" cy="18" r={RADIO} fill="none" stroke={theme.colors.track} strokeWidth={4} />
          <Circle
            cx="18"
            cy="18"
            r={RADIO}
            fill="none"
            stroke={trazo}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={PERIMETRO}
            strokeDashoffset={PERIMETRO * (1 - pct)}
            transform="rotate(-90 18 18)"
          />
        </Svg>
        <View style={styles.centro} pointerEvents="none">
          <Text variant="caption" weight="black" numberOfLines={1}>
            {centro}
          </Text>
          {centroSecundario ? (
            <Text variant="small" tone="faint" numberOfLines={1} style={styles.secundario}>
              {centroSecundario}
            </Text>
          ) : null}
        </View>
      </View>
      <Text variant="small" tone="faint">
        {etiqueta}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', gap: t.spacing.xs },
    ejemplo: { opacity: 0.45 },
    centro: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secundario: { fontSize: 8.5, lineHeight: 11 },
  }),
);
