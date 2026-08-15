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
      /**
       * Eliminar la cuenta es la ÚNICA puerta que borra datos, y por eso también
       * es la única forma de repetir el onboarding: sin perfil no hay nada que
       * enseñar, así que la app arranca por Bienvenida como el primer día.
       */
      onEliminarCuenta={() => {
        void (async () => {
          await repos.ajustes.reiniciarTodo();
          router.replace('/bienvenida');
        })();
      }}
    />
  );
}
