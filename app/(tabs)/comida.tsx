import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useComidas } from '../../src/application/comida/useComidas';
import { usePeso } from '../../src/application/peso/usePeso';
import { useSesion } from '../../src/application/session/useSesion';
import { Screen, Text } from '../../src/ui/components';
import { DiarioScreen } from '../../src/ui/screens/comida/DiarioScreen';

export default function ComidaRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useComidas(perfil?.usuarioId ?? null);
  const { tendencia } = usePeso(perfil?.usuarioId ?? null, perfil?.pesoInicialKg ?? null);
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
    <DiarioScreen
      estado={estado}
      tendencia={tendencia}
      onAnadir={(tipo) => {
        const params = new URLSearchParams({ fecha: estado.fecha });
        if (tipo) params.set('tipo', tipo);
        router.push(`/comida-nueva?${params.toString()}`);
      }}
      onEditar={(id) => router.push(`/comida-nueva?id=${id}`)}
      onDesliz={() => router.push('/desliz')}
      onRecetas={() => router.push('/recetas')}
    />
  );
}
