import { router } from 'expo-router';

import { useComidas } from '../src/application/comida/useComidas';
import { useSesion } from '../src/application/session/useSesion';
import { Screen, Text } from '../src/ui/components';
import { RecetasScreen } from '../src/ui/screens/comida/RecetasScreen';

export default function RecetasRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useComidas(perfil?.usuarioId ?? null);

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
    <RecetasScreen
      recetas={estado.recetas}
      onAtras={() => (router.canGoBack() ? router.back() : router.replace('/comida'))}
      onUsar={(receta) => {
        void (async () => {
          await estado.guardarComida({
            tipo: 'comida',
            descripcion: receta.nombre,
            recetaId: receta.id,
            saciedad: null,
            nota: null,
          });
          router.replace('/comida');
        })();
      }}
      onCrear={(datos) => {
        void estado.crearReceta({
          nombre: datos.nombre,
          icono: datos.icono,
          raciones: 1,
          ingredientes: datos.ingredientes,
          notas: datos.notas,
        });
      }}
      onBorrar={(id) => void estado.borrarReceta(id)}
    />
  );
}
