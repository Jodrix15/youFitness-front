import { StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { Card, type CardVariant } from './Card';
import { Text } from './Text';

export type TonoAviso = Extract<CardVariant, 'warning' | 'accent' | 'danger' | 'flat'>;

type Props = {
  icono?: string;
  /** Primera frase, destacada en el color del aviso. */
  titulo?: string;
  children: string;
  tono?: TonoAviso;
  /** Líneas sueltas bajo el texto, cada una con su viñeta. */
  puntos?: readonly string[];
};

/**
 * Caja de aviso con icono. Calcada del `.p.gold` de los mockups.
 *
 * El cuerpo va en color de texto normal, NO atenuado: un aviso que se lee peor
 * que el resto de la pantalla no cumple su función. Lo que se tiñe del color del
 * aviso es el título, no el párrafo entero.
 *
 * La app avisa mucho a propósito: que el IMC no distingue músculo de grasa, que
 * el ritmo es orientativo, que iOS no diferencia permiso denegado de falta de
 * datos. Todo eso son advertencias necesarias, no adornos.
 */
export function Aviso({ icono = '💡', titulo, children, tono = 'warning', puntos }: Props) {
  const styles = useStyles();

  const tonoTexto =
    tono === 'danger' ? 'danger' : tono === 'accent' ? 'accent' : tono === 'flat' ? 'muted' : 'warning';

  return (
    <Card variant={tono}>
      <View style={styles.fila}>
        <Text style={styles.icono}>{icono}</Text>

        <View style={styles.cuerpo}>
          {titulo ? (
            <Text variant="small" weight="bold" tone={tonoTexto}>
              {titulo}
            </Text>
          ) : null}

          <Text variant="small" style={styles.texto}>
            {children}
          </Text>

          {puntos?.map((p) => (
            <Text key={p} variant="small" style={styles.texto}>
              {`·  ${p}`}
            </Text>
          ))}
        </View>
      </View>
    </Card>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      gap: t.spacing.md,
      alignItems: 'flex-start',
    },
    icono: { fontSize: 15, lineHeight: 20 },
    cuerpo: { flex: 1, gap: t.spacing.xs },
    texto: {
      // Color de texto normal, no atenuado. Ver comentario del componente.
      lineHeight: t.fontSize.tiny * t.lineHeight.relaxed,
    },
  }),
);
