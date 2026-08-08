import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { DiaDelMes } from '../../domain/rules/historial';
import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  dias: readonly DiaDelMes[];
  onDia?: (fecha: string) => void;
  /**
   * Color por día. Si se pasa, sustituye a la escala de intensidad.
   *
   * Se usa para el semáforo por temas: ahí el color significa «con desliz o
   * sin él», no «cuántas cosas registraste».
   */
  colorDe?: (fecha: string) => string | undefined;
  /** Texto de la leyenda cuando se colorea por semáforo. */
  leyenda?: readonly { color: string; etiqueta: string }[];
};

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/**
 * Mapa de calor de un año entero: 365 días en columnas de siete.
 *
 * La intensidad va de 0 a 4 y cuenta CATEGORÍAS registradas ese día —pesaje,
 * comida, entreno, check-in—, no cantidad de registros. Así un día completo se
 * ve completo, y quince comidas no disfrazan un día en el que no hiciste nada
 * más.
 */
export function MapaCalor({ dias, onDia, colorDe, leyenda }: Props) {
  const styles = useStyles();
  const theme = useTheme();

  // Se agrupa en semanas de siete empezando por el primer día del año, que es
  // lo que da la rejilla vertical típica de este tipo de mapa.
  const semanas: (DiaDelMes | null)[][] = [];
  let semana: (DiaDelMes | null)[] = [];

  const primero = dias[0];
  if (primero) {
    const [a, m, d] = primero.fecha.split('-').map(Number);
    const diaSemana = (new Date(a ?? 2026, (m ?? 1) - 1, d ?? 1).getDay() + 6) % 7;
    for (let i = 0; i < diaSemana; i++) semana.push(null);
  }

  for (const dia of dias) {
    semana.push(dia);
    if (semana.length === 7) {
      semanas.push(semana);
      semana = [];
    }
  }
  if (semana.length > 0) semanas.push(semana);

  const colorDeDia = (dia: DiaDelMes): string =>
    colorDe?.(dia.fecha) ?? color(dia.intensidad);

  const color = (intensidad: number): string => {
    if (intensidad <= 0) return theme.colors.surfaceHigh;
    // Cuatro pasos de opacidad sobre el turquesa. Se declaran explícitos porque
    // React Native no admite `color-mix`.
    return ['rgba(46,230,200,0.25)', 'rgba(46,230,200,0.5)', 'rgba(46,230,200,0.75)', '#2ee6c8'][
      Math.min(3, intensidad - 1)
    ]!;
  };

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.mesesFila}>
            {MESES.map((m, i) => (
              <Text key={`${m}-${i}`} variant="small" tone="faint" style={styles.mes}>
                {m}
              </Text>
            ))}
          </View>

          <View style={styles.rejilla}>
            {semanas.map((s, i) => (
              <View key={i} style={styles.columna}>
                {s.map((dia, j) =>
                  dia ? (
                    <Pressable
                      key={dia.fecha}
                      accessibilityRole="button"
                      accessibilityLabel={`${dia.fecha}, ${dia.intensidad} de 4 registros`}
                      disabled={!onDia}
                      onPress={() => onDia?.(dia.fecha)}
                      style={[styles.celda, { backgroundColor: colorDeDia(dia) }]}
                    />
                  ) : (
                    <View key={`hueco-${i}-${j}`} style={styles.celda} />
                  ),
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {leyenda ? (
        <View style={styles.leyendaSemaforo}>
          {leyenda.map((l) => (
            <View key={l.etiqueta} style={styles.leyenda}>
              <View style={[styles.celda, { backgroundColor: l.color }]} />
              <Text variant="small" tone="faint">
                {l.etiqueta}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.leyenda}>
          <Text variant="small" tone="faint">
            menos
          </Text>
          {[0, 1, 2, 3, 4].map((n) => (
            <View key={n} style={[styles.celda, { backgroundColor: color(n) }]} />
          ))}
          <Text variant="small" tone="faint">
            más
          </Text>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.sm },
    mesesFila: { flexDirection: 'row', marginBottom: 3 },
    mes: { width: 30, textAlign: 'left' },
    rejilla: { flexDirection: 'row', gap: 2 },
    columna: { gap: 2 },
    celda: {
      width: 9,
      height: 9,
      borderRadius: 2,
      backgroundColor: 'transparent',
    },
    leyenda: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    leyendaSemaforo: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
  }),
);
