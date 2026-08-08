import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { makeStyles } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  /** Se llama al parar, con los segundos contados. */
  onParar: (segundos: number) => void;
};

/**
 * Cronómetro para isométricos.
 *
 * Cuenta hacia arriba en lugar de hacia atrás: en una plancha aguantas lo que
 * aguantas, y poner una cuenta atrás obligaría a decidir de antemano un número
 * que es justo el que estás midiendo.
 */
export function Cronometro({ onParar }: Props) {
  const styles = useStyles();
  const [corriendo, setCorriendo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const inicio = useRef<number | null>(null);

  useEffect(() => {
    if (!corriendo) return;

    // Se calcula por diferencia de reloj, no sumando 1 cada segundo: los
    // temporizadores de JavaScript se retrasan cuando la pantalla se apaga o
    // el navegador ralentiza la pestaña.
    inicio.current = Date.now() - segundos * 1000;
    const id = setInterval(() => {
      if (inicio.current != null) {
        setSegundos(Math.floor((Date.now() - inicio.current) / 1000));
      }
    }, 200);

    return () => clearInterval(id);
    // `segundos` queda fuera a propósito: solo se reajusta al arrancar o parar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);

  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;

  return (
    <View style={styles.wrap}>
      <Text variant="display" tone={corriendo ? 'accent' : 'default'} center>
        {`${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`}
      </Text>

      <View style={styles.botones}>
        {corriendo ? (
          <Button
            label="Parar y anotar"
            style={styles.crecer}
            onPress={() => {
              setCorriendo(false);
              onParar(segundos);
              setSegundos(0);
            }}
          />
        ) : (
          <Button label="Empezar" style={styles.crecer} onPress={() => setCorriendo(true)} />
        )}
        {segundos > 0 ? (
          <Button
            label="Reiniciar"
            variant="secondary"
            onPress={() => {
              setCorriendo(false);
              setSegundos(0);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.md },
    botones: { flexDirection: 'row', gap: t.spacing.md },
    crecer: { flex: 1 },
  }),
);
