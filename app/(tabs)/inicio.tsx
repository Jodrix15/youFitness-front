import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useInicio } from '../../src/application/inicio/useInicio';
import { useSesion } from '../../src/application/session/useSesion';
import { useRepositorios } from '../../src/data/contenedor';
import { Button, Card, Screen, Text } from '../../src/ui/components';
import { DiaUnoScreen } from '../../src/ui/screens/inicio/DiaUnoScreen';
import { InicioScreen } from '../../src/ui/screens/inicio/InicioScreen';

/**
 * Pantallas 06 y 07 · Inicio.
 *
 * La misma ruta sirve las dos: sin ningún registro se muestra el estado de día
 * 1, que ofrece un solo camino. En cuanto hay algo que contar, se pasa a la
 * pantalla completa. Son dos estados de la misma pantalla, no dos secciones.
 */
export default function InicioRoute() {
  const repos = useRepositorios();
  const { perfil, cargando: cargandoSesion, recargar: recargarSesion } = useSesion();
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

  // Atajos temporales. Desaparecen cuando exista la pantalla de Ajustes.
  const atajosDesarrollo = (
    <Card variant="dashed">
      <Text variant="overline" tone="faint">
        Solo para desarrollo
      </Text>
      <Button
        label="Repetir el onboarding"
        variant="secondary"
        size="sm"
        onPress={() => router.push('/bienvenida')}
      />
      <Button
        label="Borrar todo y empezar de cero"
        variant="danger"
        size="sm"
        onPress={() => {
          void (async () => {
            await repos.ajustes.reiniciarTodo();
            await recargarSesion();
            await recargar();
            router.replace('/bienvenida');
          })();
        }}
      />
    </Card>
  );

  return estado.esDiaUno ? (
    <DiaUnoScreen
      nombre={perfil.nombre}
      nivel={estado.nivel}
      onPeso={irAPeso}
      onCheckin={irACheckin}
      onPerfil={() => router.push('/perfil')}
      pie={atajosDesarrollo}
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
      pie={atajosDesarrollo}
    />
  );
}
