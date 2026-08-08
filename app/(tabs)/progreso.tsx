import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { useHistorial } from '../../src/application/historial/useHistorial';
import { useSesion } from '../../src/application/session/useSesion';
import { Screen, Text } from '../../src/ui/components';
import { HistorialScreen } from '../../src/ui/screens/historial/HistorialScreen';

/**
 * La pestaña de Progreso aloja el historial.
 *
 * Las pantallas de gamificación (22 a 29: objetivos, rangos, logros, retos) irán
 * aquí también cuando existan. El historial va primero porque es lo que da
 * sentido a haber registrado durante meses.
 */
export default function ProgresoRoute() {
  const { fecha } = useLocalSearchParams<{ fecha?: string }>();
  const { perfil, cargando } = useSesion();
  const estado = useHistorial(perfil?.usuarioId ?? null);
  const { recargar, verDia } = estado;

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  // Al llegar desde la tira de racha de Inicio, se abre directamente ese día.
  useEffect(() => {
    if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) verDia(fecha);
  }, [fecha, verDia]);

  if (cargando || estado.cargando || !perfil) {
    return (
      <Screen center>
        <Text tone="muted" center>
          Cargando…
        </Text>
      </Screen>
    );
  }

  return <HistorialScreen estado={estado} />;
}
