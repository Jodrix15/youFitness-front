import { router } from 'expo-router';

import { usePeso } from '../src/application/peso/usePeso';
import { useSesion } from '../src/application/session/useSesion';
import { Screen, Text } from '../src/ui/components';
import { PesoScreen } from '../src/ui/screens/peso/PesoScreen';

export default function PesoRoute() {
  const { perfil, cargando } = useSesion();
  const estado = usePeso(perfil?.usuarioId ?? null, perfil?.pesoInicialKg ?? null);

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
    <PesoScreen
      perfil={perfil}
      estado={estado}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
    />
  );
}
