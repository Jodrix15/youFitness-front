import { router } from 'expo-router';
import { useState } from 'react';

import { useEntreno } from '../src/application/entreno/useEntreno';
import { useSesion } from '../src/application/session/useSesion';
import type { ResultadoSesion } from '../src/application/entreno/sesion';
import { Button, Screen, Text } from '../src/ui/components';
import { ResumenSesionScreen } from '../src/ui/screens/entreno/ResumenSesionScreen';
import { SesionScreen } from '../src/ui/screens/entreno/SesionScreen';

/**
 * Sesión activa y, al terminar, su resumen.
 *
 * Las dos viven en la misma ruta porque son un solo flujo: terminar no te lleva
 * a otro sitio, te enseña lo que acabas de hacer. Volver atrás desde el resumen
 * a la sesión ya cerrada no tendría sentido.
 */
export default function SesionRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useEntreno(perfil?.usuarioId ?? null);
  const [resultado, setResultado] = useState<ResultadoSesion | null>(null);

  if (cargando || estado.cargando || !perfil) {
    return (
      <Screen center>
        <Text tone="muted" center>
          Cargando…
        </Text>
      </Screen>
    );
  }

  const volver = () => router.replace('/entreno');

  if (resultado) {
    return (
      <ResumenSesionScreen
        sesion={resultado.sesion}
        desglose={resultado.desglose}
        xpGanado={resultado.xpGanado}
        multiplicador={resultado.multiplicador}
        ejercicios={estado.porId}
        onSalir={volver}
        onGuardarCierre={(esfuerzo, nota) => {
          void estado.terminar(resultado.sesion, { esfuerzoPercibido: esfuerzo, nota });
        }}
      />
    );
  }

  const enCurso = estado.enCurso;

  if (!enCurso) {
    return (
      <Screen center>
        <Text variant="displaySm" center>
          No hay ninguna sesión abierta
        </Text>
        <Button label="Volver a Entreno" onPress={volver} />
      </Screen>
    );
  }

  const rutina = enCurso.rutinaId
    ? (estado.rutinas.find((r) => r.id === enCurso.rutinaId) ?? null)
    : null;

  return (
    <SesionScreen
      sesion={enCurso}
      rutina={rutina}
      ejercicios={estado.ejercicios}
      onSalir={volver}
      onAnotar={(ejercicio, datos) => void estado.anotar(enCurso, ejercicio, datos)}
      onQuitarSerie={(serieId) => void estado.quitarSerie(enCurso, serieId)}
      onDescartar={() => {
        void (async () => {
          await estado.descartar(enCurso.id);
          volver();
        })();
      }}
      onTerminar={() => {
        void (async () => {
          const r = await estado.terminar(enCurso, { esfuerzoPercibido: null, nota: null });
          if (r) setResultado(r);
        })();
      }}
    />
  );
}
