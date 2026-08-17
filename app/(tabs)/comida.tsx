import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useComidas } from '../../src/application/comida/useComidas';
import { usePeso } from '../../src/application/peso/usePeso';
import { useSesion } from '../../src/application/session/useSesion';
import { Screen, Text } from '../../src/ui/components';
import { DiarioScreen } from '../../src/ui/screens/comida/DiarioScreen';

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export default function ComidaRoute() {
  const { fecha } = useLocalSearchParams<{ fecha?: string }>();
  const { perfil, cargando } = useSesion();
  const estado = useComidas(perfil?.usuarioId ?? null);
  const { tendencia } = usePeso(perfil?.usuarioId ?? null, perfil?.pesoInicialKg ?? null);
  const { recargar } = estado;

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  /**
   * Se puede llegar con `?fecha=` desde el historial, para editar ese día.
   *
   * El parámetro se consume una sola vez: si se releyera en cada render, no
   * habría forma de moverse a otro día con el calendario — la pantalla volvería
   * de un salto a la fecha de la URL.
   */
  const { irADia } = estado;
  const aplicada = useRef<string | null>(null);
  useEffect(() => {
    if (!fecha || !ES_FECHA.test(fecha) || aplicada.current === fecha) return;
    aplicada.current = fecha;
    irADia(fecha);
  }, [fecha, irADia]);

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
      onEditar={(id) => {
        // Un desliz se corrige en SU pantalla: el editor de comidas no sabe nada
        // de categorías ni disparadores, y abrirlo ahí perdería todo eso.
        const comida = estado.buscarComida(id);
        router.push(comida?.esDesliz ? `/desliz?id=${id}` : `/comida-nueva?id=${id}`);
      }}
      onDesliz={() => router.push(`/desliz?fecha=${estado.fecha}`)}
      onRecetas={() => router.push('/recetas')}
    />
  );
}
