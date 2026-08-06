import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSesion } from '../src/application/session/useSesion';
import { useTheme } from '../src/ui/theme';

/**
 * Punto de entrada. Decide si la app abre en el onboarding o en Inicio.
 *
 * La pantalla de Bienvenida se ve UNA SOLA VEZ (especificación §3): a partir de
 * ahí, quien ya completó el onboarding entra directo.
 */
export default function Index() {
  const { cargando, onboardingCompletado } = useSesion();
  const theme = useTheme();

  if (cargando) {
    return (
      <View style={[styles.centro, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return <Redirect href={onboardingCompletado ? '/inicio' : '/bienvenida'} />;
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
