import { router } from 'expo-router';

import { useEntreno } from '../src/application/entreno/useEntreno';
import { useSesion } from '../src/application/session/useSesion';
import { idsDelDispositivo } from '../src/platform/id';
import { Screen, Text } from '../src/ui/components';
import { EscalerasScreen } from '../src/ui/screens/entreno/EscalerasScreen';

export default function EscalerasRoute() {
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
    <EscalerasScreen
      escaleras={estado.escaleras}
      ejercicios={estado.ejercicios}
      sesiones={estado.sesiones}
      nuevoId={idsDelDispositivo.nuevoId}
      onCrear={(datos) => void estado.crearEscalera(datos)}
      onAscender={(escalera) => void estado.ascender(escalera)}
      onBorrar={(id) => void estado.borrarEscalera(id)}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/entreno'))}
    />
  );
}
