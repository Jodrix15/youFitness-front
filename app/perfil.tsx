import { router } from 'expo-router';

import { usePerfilCompleto } from '../src/application/perfil/usePerfilCompleto';
import { Screen, Text } from '../src/ui/components';
import { PerfilScreen } from '../src/ui/screens/perfil/PerfilScreen';

export default function PerfilRoute() {
  const estado = usePerfilCompleto();

  if (estado.cargando || !estado.perfil) {
    return (
      <Screen center>
        <Text tone="muted" center>
          Cargando…
        </Text>
      </Screen>
    );
  }

  return (
    <PerfilScreen
      estado={estado}
      onAjustes={() => router.push('/ajustes')}
      onHistorial={() => router.push('/progreso')}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
    />
  );
}
