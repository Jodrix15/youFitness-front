import { router } from 'expo-router';

import { useAjustes } from '../src/application/ajustes/useAjustes';
import { useRepositorios } from '../src/data/contenedor';
import { Screen, Text } from '../src/ui/components';
import { AjustesScreen } from '../src/ui/screens/ajustes/AjustesScreen';

export default function AjustesRoute() {
  const repos = useRepositorios();
  const estado = useAjustes();

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
    <AjustesScreen
      estado={estado}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))}
      onReiniciar={() => {
        void (async () => {
          await repos.ajustes.reiniciarTodo();
          router.replace('/bienvenida');
        })();
      }}
    />
  );
}
