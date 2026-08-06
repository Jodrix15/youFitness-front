import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RepositoriosProvider } from '../src/data/contenedor';
import { ThemeProvider, defaultTheme } from '../src/ui/theme';

/**
 * Raíz de la app. Solo monta proveedores: tema, datos y área segura.
 *
 * No hay lógica aquí a propósito. Las rutas son cableado, no negocio.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RepositoriosProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: defaultTheme.colors.background },
              animation: 'slide_from_right',
            }}
          />
        </RepositoriosProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
