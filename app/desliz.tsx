import { router } from 'expo-router';
import { useState } from 'react';

import { useComidas } from '../src/application/comida/useComidas';
import { useSesion } from '../src/application/session/useSesion';
import { Screen, Text } from '../src/ui/components';
import { DeslizScreen } from '../src/ui/screens/comida/DeslizScreen';

export default function DeslizRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useComidas(perfil?.usuarioId ?? null, perfil?.objetivoVerduraRaciones);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
    <DeslizScreen
      presupuesto={estado.presupuesto}
      analisis={estado.analisis}
      modoEstricto={perfil.modoEstricto}
      guardando={guardando}
      mensaje={mensaje}
      onCancelar={() => (router.canGoBack() ? router.back() : router.replace('/comida'))}
      onGuardar={(datos) => {
        void (async () => {
          setGuardando(true);
          setMensaje(null);
          try {
            const r = await estado.guardarDesliz(datos.descripcion, {
              categoria: datos.categoria,
              cantidad: datos.cantidad,
              sustituyoComida: datos.sustituyoComida,
              disparador: datos.disparador,
              emocionDespues: datos.emocionDespues,
              lugar: datos.lugar,
              nota: datos.nota,
            });
            if (r) router.replace('/comida');
          } finally {
            setGuardando(false);
          }
        })();
      }}
    />
  );
}
