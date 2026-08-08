import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useEntreno } from '../../src/application/entreno/useEntreno';
import { useSesion } from '../../src/application/session/useSesion';
import { Screen, Text } from '../../src/ui/components';
import { EntrenoScreen } from '../../src/ui/screens/entreno/EntrenoScreen';

export default function EntrenoRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useEntreno(perfil?.usuarioId ?? null);
  const { recargar } = estado;

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

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
    <EntrenoScreen
      estado={estado}
      onBiblioteca={() => router.push('/ejercicios')}
      onNuevaRutina={() => router.push('/rutina')}
      onProgresion={() => router.push('/progresion')}
      onEscaleras={() => router.push('/escaleras')}
      onContinuar={() => router.push('/sesion')}
      onEmpezar={(rutina) => {
        void (async () => {
          await estado.empezar(rutina);
          router.push('/sesion');
        })();
      }}
    />
  );
}
