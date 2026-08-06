import { router } from 'expo-router';

import { useCheckin } from '../src/application/checkin/useCheckin';
import { useSesion } from '../src/application/session/useSesion';
import { Screen, Text } from '../src/ui/components';
import { CheckinScreen } from '../src/ui/screens/checkin/CheckinScreen';

export default function CheckinRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useCheckin(perfil?.usuarioId ?? null);

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
    <CheckinScreen
      estado={estado}
      modoEstricto={perfil.modoEstricto}
      onCerrado={() => undefined}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
    />
  );
}
