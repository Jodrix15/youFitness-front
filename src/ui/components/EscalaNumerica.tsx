import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  valor: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
  etiquetaMin: string;
  etiquetaMax: string;
  tono?: 'accent' | 'warning' | 'danger';
  etiquetaAccesible: string;
};

const ALTO_PISTA = 10;
const DIAMETRO_TIRADOR = 26;

/**
 * Escala de 1 a 10, deslizable.
 *
 * Se arrastra con el dedo y también se puede tocar directamente un punto. Debajo
 * van los números, para saber qué valor vas a dejar antes de soltar: sin esa
 * referencia hay que adivinar dónde cae cada valor.
 *
 * DETALLE IMPORTANTE del gesto: solo se captura el arrastre cuando el movimiento
 * es más horizontal que vertical. Si se capturara siempre, deslizar el dedo por
 * encima de la escala impediría hacer scroll en la pantalla, que es justo lo que
 * uno intenta hacer al recorrer un formulario largo.
 */
export function EscalaNumerica({
  valor,
  onChange,
  min = 1,
  max = 10,
  etiquetaMin,
  etiquetaMax,
  tono = 'accent',
  etiquetaAccesible,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const [ancho, setAncho] = useState(0);

  // El responder se crea una sola vez; lee el ancho y el callback por
  // referencia para no reconstruirse en cada render y perder el gesto a medias.
  const anchoRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pasos = max - min;

  const valorDesdeX = (x: number): number => {
    const w = anchoRef.current;
    if (w <= 0) return min;
    const pct = Math.max(0, Math.min(1, x / w));
    return min + Math.round(pct * pasos);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Un toque simple actúa de inmediato.
        onStartShouldSetPanResponder: () => true,
        // El arrastre solo se captura si es claramente horizontal.
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: (e) => {
          onChangeRef.current(valorDesdeX(e.nativeEvent.locationX));
        },
        onPanResponderMove: (e) => {
          onChangeRef.current(valorDesdeX(e.nativeEvent.locationX));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function medir(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    anchoRef.current = w;
    setAncho(w);
  }

  const color =
    tono === 'warning'
      ? theme.colors.warning
      : tono === 'danger'
        ? theme.colors.danger
        : theme.colors.accent;

  const fraccion = pasos === 0 ? 0 : (valor - min) / pasos;
  const numeros = Array.from({ length: pasos + 1 }, (_, i) => min + i);

  return (
    <View style={styles.wrap}>
      <View style={styles.fila}>
        <Text variant="caption" tone="muted">
          {etiquetaMin}
        </Text>
        <Text variant="body" weight="black" style={{ color }}>
          {`${valor}/${max}`}
        </Text>
        <Text variant="caption" tone="muted">
          {etiquetaMax}
        </Text>
      </View>

      {/* La zona sensible es más alta que la barra: el dedo no es preciso. */}
      <View
        style={styles.zona}
        accessibilityRole="adjustable"
        accessibilityLabel={etiquetaAccesible}
        accessibilityValue={{ now: valor, min, max }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, valor + 1));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, valor - 1));
        }}
        onLayout={medir}
        {...responder.panHandlers}
      >
        <View style={styles.pista}>
          <View style={[styles.relleno, { width: `${fraccion * 100}%`, backgroundColor: color }]} />
        </View>

        {/* Marcas de los valores intermedios, bajo la barra. */}
        <View style={styles.marcas} pointerEvents="none">
          {numeros.map((n) => (
            <View
              key={n}
              style={[styles.marca, n <= valor && { backgroundColor: color, opacity: 0.9 }]}
            />
          ))}
        </View>

        {ancho > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.tirador,
              {
                borderColor: color,
                left: fraccion * ancho - DIAMETRO_TIRADOR / 2,
              },
            ]}
          >
            <Text variant="small" weight="black" style={{ color }}>
              {valor}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.numeros} pointerEvents="none">
        {numeros.map((n) => (
          <Text
            key={n}
            variant="small"
            weight={n === valor ? 'bold' : 'regular'}
            tone={n === valor ? 'default' : 'faint'}
            style={styles.numero}
          >
            {n}
          </Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.sm },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    zona: {
      height: DIAMETRO_TIRADOR + 8,
      justifyContent: 'center',
    },
    pista: {
      height: ALTO_PISTA,
      borderRadius: ALTO_PISTA,
      backgroundColor: t.colors.track,
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden',
    },
    relleno: { height: '100%', borderRadius: ALTO_PISTA },
    marcas: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 3,
    },
    marca: {
      width: 2,
      height: 4,
      borderRadius: 1,
      backgroundColor: t.colors.borderStrong,
    },
    tirador: {
      position: 'absolute',
      width: DIAMETRO_TIRADOR,
      height: DIAMETRO_TIRADOR,
      borderRadius: DIAMETRO_TIRADOR / 2,
      backgroundColor: t.colors.surface,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numeros: { flexDirection: 'row', justifyContent: 'space-between' },
    numero: { textAlign: 'center', width: 14 },
  }),
);
