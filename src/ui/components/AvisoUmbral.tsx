import { StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { entero } from '../format';
import { Card } from './Card';
import { Text } from './Text';

type Props = {
  titulo: string;
  /** Cuántos registros faltan para desbloquear la vista. */
  faltan: number;
  /** Singular y plural de lo que falta: ['pesaje', 'pesajes']. */
  unidad: [string, string];
  /** Para qué sirve lo que se desbloquea. */
  para: string;
  /** Por qué no se enseña antes. Siempre hay un motivo, y se dice. */
  motivo: string;
  /** Progreso «2 de 7», para cuando esta caja sustituye a la vista principal. */
  contador?: { hechos: number; total: number };
};

/**
 * Estado «se desbloqueará con N registros más».
 *
 * ÚNICO componente para todos los umbrales de la app: tendencia de peso,
 * correlaciones del check-in, patrones de deslices. Antes cada pantalla lo
 * pintaba a su manera y acabaron siendo tres cajas distintas.
 *
 * Va en dorado como el resto de avisos, y no en gris apagado: no es contenido
 * de segunda, es la app explicando por qué todavía no te enseña algo.
 *
 * REGLA (§6): la app no inventa análisis con datos insuficientes. Cada vista
 * declara su umbral, dice cuánto falta y por qué.
 */
export function AvisoUmbral({ titulo, faltan, unidad, para, motivo, contador }: Props) {
  const styles = useStyles();
  const [singular, plural] = unidad;

  return (
    <Card variant="warning">
      <View style={styles.fila}>
        <Text style={styles.icono}>🔒</Text>
        <Text variant="overline" tone="warning">
          {titulo}
        </Text>
      </View>

      {contador ? (
        <Text variant="displaySm">{`${entero(contador.hechos)} de ${entero(contador.total)}`}</Text>
      ) : null}

      <Text variant="small" style={styles.texto}>
        {faltan === 1
          ? `Falta ${entero(faltan)} ${singular} para ${para}.`
          : `Faltan ${entero(faltan)} ${plural} para ${para}.`}
      </Text>

      <Text variant="small" tone="faint" style={styles.texto}>
        {motivo}
      </Text>
    </Card>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    icono: { fontSize: 13, lineHeight: 18 },
    texto: { lineHeight: t.fontSize.tiny * t.lineHeight.relaxed },
  }),
);
