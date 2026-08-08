import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { makeStyles, useTheme } from '../theme';
import { kg } from '../format';
import { Text } from './Text';

export type PuntoGrafica = {
  clave: string;
  valor: number;
  /** Marca visible: un cambio de escalón, una lesión, un hito. */
  hito?: boolean;
};

type Props = {
  puntos: readonly PuntoGrafica[];
  unidad: string;
  alto?: number;
  vacio?: string;
};

const ANCHO = 250;
const MARGEN = { arriba: 12, abajo: 10, izquierda: 26, derecha: 8 };

/**
 * Gráfica de línea genérica para series temporales.
 *
 * A diferencia de la de peso, aquí no hay media móvil: en entrenamiento el dato
 * bruto ya es la señal. Un peso levantado es un peso levantado; no oscila por
 * retención de líquidos.
 *
 * Los puntos marcados como hito se pintan distintos. Sirven sobre todo para los
 * cambios de escalón, donde la línea CAE a propósito y sin marca parecería un
 * retroceso.
 */
export function GraficaEvolucion({ puntos, unidad, alto = 130, vacio }: Props) {
  const styles = useStyles();
  const theme = useTheme();

  if (puntos.length < 2) {
    return (
      <View style={styles.vacio}>
        <Text variant="caption" tone="faint" center>
          {vacio ?? 'La gráfica aparece con dos registros.'}
        </Text>
      </View>
    );
  }

  const valores = puntos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const holgura = Math.max(0.5, (max - min) * 0.1);
  const suelo = Math.max(0, min - holgura);
  const techo = max + holgura;

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = alto - MARGEN.arriba - MARGEN.abajo;

  const x = (i: number) => MARGEN.izquierda + (i / (puntos.length - 1)) * anchoUtil;
  const y = (v: number) => MARGEN.arriba + altoUtil - ((v - suelo) / (techo - suelo)) * altoUtil;

  const linea = puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ');

  return (
    <View>
      <Svg viewBox={`0 0 ${ANCHO} ${alto}`} width="100%" height={alto}>
        {[techo, suelo].map((v) => (
          <Line
            key={v}
            x1={MARGEN.izquierda}
            y1={y(v)}
            x2={ANCHO - MARGEN.derecha}
            y2={y(v)}
            stroke={theme.colors.border}
            strokeWidth={0.7}
            strokeDasharray="3 4"
          />
        ))}

        <SvgText x={2} y={y(techo) + 3} fontSize={6.5} fill={theme.colors.textFaint}>
          {kg(techo, 0)}
        </SvgText>
        <SvgText x={2} y={y(suelo) + 3} fontSize={6.5} fill={theme.colors.textFaint}>
          {kg(suelo, 0)}
        </SvgText>

        <Polyline
          points={linea}
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {puntos.map((p, i) => (
          <Circle
            key={p.clave}
            cx={x(i)}
            cy={y(p.valor)}
            r={p.hito ? 3.6 : 2}
            fill={p.hito ? theme.colors.warning : theme.colors.accent}
          />
        ))}
      </Svg>

      <View style={styles.pie}>
        <Text variant="small" tone="faint">
          {puntos[0]?.clave}
        </Text>
        <Text variant="small" tone="accent" weight="bold">
          {`${kg(puntos[puntos.length - 1]?.valor ?? 0, 1)} ${unidad}`}
        </Text>
        <Text variant="small" tone="faint">
          {puntos[puntos.length - 1]?.clave}
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    vacio: { height: 80, alignItems: 'center', justifyContent: 'center' },
    pie: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  }),
);
