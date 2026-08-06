import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import type { PuntoTendencia } from '../../domain/rules/tendenciaPeso';
import { makeStyles, useTheme } from '../theme';
import { kg } from '../format';
import { Text } from './Text';

type Props = {
  serie: readonly PuntoTendencia[];
  objetivoKg: number | null;
  alto?: number;
};

const ANCHO = 250;
const MARGEN = { arriba: 12, abajo: 14, izquierda: 22, derecha: 8 };

/**
 * Evolución del peso: los pesajes como puntos apagados y la media de 7 días
 * como línea destacada.
 *
 * La jerarquía visual es deliberada y es la tesis de la app: la línea es la
 * señal, los puntos son el ruido. El peso diario oscila uno o dos kilos por
 * agua y tránsito; mirar los puntos sueltos lleva a conclusiones falsas.
 *
 * Componente puramente presentacional: recibe la serie ya calculada.
 */
export function GraficaPeso({ serie, objetivoKg, alto = 130 }: Props) {
  const styles = useStyles();
  const theme = useTheme();

  if (serie.length < 2) {
    return (
      <View style={styles.vacio}>
        <Text variant="caption" tone="faint" center>
          La gráfica aparece con dos pesajes.
        </Text>
      </View>
    );
  }

  const valores = serie.flatMap((p) => [p.pesoKg, p.media7]);
  if (objetivoKg != null) valores.push(objetivoKg);

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // Un margen del 8 % evita que la línea toque los bordes y que un rango casi
  // plano se dibuje como una montaña rusa.
  const holgura = Math.max(0.5, (max - min) * 0.08);
  const suelo = min - holgura;
  const techo = max + holgura;

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = alto - MARGEN.arriba - MARGEN.abajo;

  const x = (i: number) =>
    MARGEN.izquierda + (serie.length === 1 ? anchoUtil / 2 : (i / (serie.length - 1)) * anchoUtil);
  const y = (v: number) => MARGEN.arriba + altoUtil - ((v - suelo) / (techo - suelo)) * altoUtil;

  const linea = serie.map((p, i) => `${x(i)},${y(p.media7)}`).join(' ');
  const ultimo = serie[serie.length - 1]!;

  return (
    <View>
      <Svg viewBox={`0 0 ${ANCHO} ${alto}`} width="100%" height={alto}>
        {[techo, (techo + suelo) / 2, suelo].map((v) => (
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

        {objetivoKg != null && objetivoKg >= suelo && objetivoKg <= techo ? (
          <>
            <Line
              x1={MARGEN.izquierda}
              y1={y(objetivoKg)}
              x2={ANCHO - MARGEN.derecha}
              y2={y(objetivoKg)}
              stroke={theme.colors.danger}
              strokeWidth={0.9}
              strokeDasharray="5 4"
              opacity={0.7}
            />
            <SvgText
              x={ANCHO - MARGEN.derecha}
              y={y(objetivoKg) - 3}
              fontSize={6.5}
              fill={theme.colors.danger}
              textAnchor="end"
            >
              {`meta ${kg(objetivoKg)} kg`}
            </SvgText>
          </>
        ) : null}

        {serie.map((p, i) => (
          <Circle key={p.fecha} cx={x(i)} cy={y(p.pesoKg)} r={1.7} fill={theme.colors.borderStrong} />
        ))}

        <Polyline
          points={linea}
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={x(serie.length - 1)}
          cy={y(ultimo.media7)}
          r={3.4}
          fill={theme.colors.accent}
        />
      </Svg>

      <View style={styles.leyenda}>
        <Text variant="small" tone="faint">
          ● pesajes
        </Text>
        <Text variant="small" tone="accent">
          — media 7 días
        </Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    vacio: {
      height: 90,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leyenda: {
      flexDirection: 'row',
      gap: t.spacing.lg,
      marginTop: t.spacing.xs,
    },
  }),
);
