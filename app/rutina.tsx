import { router } from 'expo-router';
import { useState } from 'react';

import { useEntreno } from '../src/application/entreno/useEntreno';
import { useSesion } from '../src/application/session/useSesion';
import { idsDelDispositivo } from '../src/platform/id';
import { Screen, Text } from '../src/ui/components';
import { RutinaEditorScreen } from '../src/ui/screens/entreno/RutinaEditorScreen';

export default function RutinaRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useEntreno(perfil?.usuarioId ?? null);
  const [guardando, setGuardando] = useState(false);

  if (cargando || estado.cargando || !perfil) {
    return (
      <Screen center>
        <Text tone="muted" center>
          Cargando…
        </Text>
      </Screen>
    );
  }

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/entreno'));

  return (
    <RutinaEditorScreen
      ejercicios={estado.ejercicios}
      guardando={guardando}
      nuevoId={idsDelDispositivo.nuevoId}
      onAtras={volver}
      onBiblioteca={() => router.push('/ejercicios')}
      onGuardar={(datos) => {
        void (async () => {
          setGuardando(true);
          try {
            await estado.crearRutina(datos);
            volver();
          } finally {
            setGuardando(false);
          }
        })();
      }}
    />
  );
}
