import { StyleSheet, View } from 'react-native';

import { useOnboardingStore } from '../../../application/onboarding/onboardingStore';
import { estadoNivel, XP } from '../../../domain/rules/xp';
import { Avatar, Button, Screen, Text, TextField, XpBar } from '../../components';
import { makeStyles } from '../../theme';

type Props = {
  onContinuar: () => void;
};

/**
 * Pantalla 01 · Bienvenida.
 *
 * Se ve UNA SOLA VEZ. Después la app abre siempre en Inicio (especificación §3).
 *
 * Sin login con Apple ni Google, y sin "explorar sin cuenta": no hay cuentas.
 * La primera interacción es escribir el nombre y ver la barra de XP a cero.
 *
 * Composición calcada del mockup: cinco bloques con la misma separación, el
 * icono en degradado de marca y el botón como única acción posible.
 */
export function BienvenidaScreen({ onContinuar }: Props) {
  const styles = useStyles();
  const nombre = useOnboardingStore((s) => s.nombre);
  const setNombre = useOnboardingStore((s) => s.setNombre);

  const nivel = estadoNivel(0);
  const puedeSeguir = nombre.trim().length >= 2;

  return (
    <Screen center contentStyle={styles.contenido}>
      <View style={styles.centrado}>
        <Avatar emoji="🦾" size={92} />
      </View>

      <View style={styles.marca}>
        <Text variant="brand" center>
          YouFitness
        </Text>
        <Text variant="body" tone="muted" center style={styles.lema}>
          {'Sube de nivel tu salud.\nRegistra, gana XP, escala rangos.'}
        </Text>
      </View>

      <TextField
        label="¿Cómo te llamas?"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Tu nombre"
        maxLength={24}
      />

      <XpBar estado={nivel} pie={`Tu primer registro te dará ${XP.registrarPeso} XP`} />

      <Button label="Empezar" onPress={onContinuar} disabled={!puedeSeguir} style={styles.boton} />
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    contenido: {
      gap: t.spacing.xl,
      paddingHorizontal: t.spacing.md,
    },
    centrado: { alignItems: 'center' },
    marca: {
      gap: t.spacing.sm,
      alignItems: 'center',
    },
    lema: {
      lineHeight: t.fontSize.bodyLg * t.lineHeight.relaxed,
    },
    boton: { width: '100%', marginTop: t.spacing.xs },
  }),
);
