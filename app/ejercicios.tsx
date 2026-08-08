import { router } from 'expo-router';

import { useEntreno } from '../src/application/entreno/useEntreno';
import { useSesion } from '../src/application/session/useSesion';
import { Screen, Text } from '../src/ui/components';
import { BibliotecaScreen } from '../src/ui/screens/entreno/BibliotecaScreen';

export default function EjerciciosRoute() {
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
    <BibliotecaScreen
      ejercicios={estado.ejercicios}
      onCrear={(datos) => void estado.crearEjercicio(datos)}
      onBorrar={(id) => void estado.borrarEjercicio(id)}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/entreno'))}
    />
  );
}
