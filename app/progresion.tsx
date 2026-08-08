import { router } from 'expo-router';

import { useEntreno } from '../src/application/entreno/useEntreno';
import { useSesion } from '../src/application/session/useSesion';
import { Screen, Text } from '../src/ui/components';
import { ProgresionScreen } from '../src/ui/screens/entreno/ProgresionScreen';

export default function ProgresionRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useEntreno(perfil?.usuarioId ?? null);

  if (cargando || estado.cargando || !perfil) {
    return (
      <Screen center>
        <Text tone="muted" center>
          Cargando…
        </Text>
      </Screen>
    );
  }

  return (
    <ProgresionScreen
      ejercicios={estado.ejercicios}
      sesiones={estado.sesiones}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/entreno'))}
    />
  );
}
