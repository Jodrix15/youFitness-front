import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useInicio } from '../../src/application/inicio/useInicio';
import { useSesion } from '../../src/application/session/useSesion';
import { Button, Screen, Text } from '../../src/ui/components';
import { DiaUnoScreen } from '../../src/ui/screens/inicio/DiaUnoScreen';
import { InicioScreen } from '../../src/ui/screens/inicio/InicioScreen';

/**
 * Pantallas 06 y 07 · Inicio.
 *
 * La misma ruta sirve las dos: sin ningún registro se muestra el estado de día
 * 1, que ofrece un solo camino. En cuanto hay algo que contar, se pasa a la
 * pantalla completa. Son dos estados de la misma pantalla, no dos secciones.
 *
 * Aquí NO hay atajos de «repetir onboarding» ni «borrar todo». Los había
 * mientras no existía Ajustes, y eran una mina a un toque de la pantalla que más
 * se abre. Borrar los datos es ahora una sola puerta, con confirmación, dentro
 * de Ajustes → Eliminar mi cuenta.
 */
export default function InicioRoute() {
  const { perfil, cargando: cargandoSesion } = useSesion();
  const estado = useInicio(perfil?.usuarioId ?? null, perfil?.objetivoVerduraRaciones);
  const { recargar } = estado;

  // Al volver de registrar algo, el XP y las misiones tienen que estar al día.
  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  if (cargandoSesion || estado.cargando) {
    return (
      <Screen center>
        <Text tone="muted" center>
          Cargando…
        </Text>
      </Screen>
    );
  }

  if (!perfil) {
    return (
      <Screen center>
        <Text variant="displaySm" center>
          Aún no hay perfil
        </Text>
        <Button label="Hacer el onboarding" onPress={() => router.replace('/bienvenida')} />
      </Screen>
    );
  }

  const irAPeso = () => router.push('/peso');
  const irACheckin = () => router.push('/checkin');

  return estado.esDiaUno ? (
    <DiaUnoScreen
      nombre={perfil.nombre}
      nivel={estado.nivel}
      onPeso={irAPeso}
      onCheckin={irACheckin}
      onPerfil={() => router.push('/perfil')}
    />
  ) : (
    <InicioScreen
      nombre={perfil.nombre}
      estado={estado}
      onPeso={irAPeso}
      onCheckin={irACheckin}
      onComida={() => router.push('/comida')}
      onPerfil={() => router.push('/perfil')}
      onDia={(fecha) => router.push(`/progreso?fecha=${fecha}`)}
    />
  );
}
