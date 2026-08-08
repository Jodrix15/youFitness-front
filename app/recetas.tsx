import { router } from 'expo-router';

import { useComidas } from '../src/application/comida/useComidas';
import { useSesion } from '../src/application/session/useSesion';
import { Screen, Text } from '../src/ui/components';
import { RecetasScreen } from '../src/ui/screens/comida/RecetasScreen';

export default function RecetasRoute() {
  const { perfil, cargando } = useSesion();
  const estado = useComidas(perfil?.usuarioId ?? null, perfil?.objetivoVerduraRaciones);

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
            protPorciones: receta.protPorciones,
            verdPorciones: receta.verdPorciones,
            hidrPorciones: receta.hidrPorciones,
            grasPorciones: receta.grasPorciones,
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
          protPorciones: datos.porciones.prot,
          verdPorciones: datos.porciones.verd,
          hidrPorciones: datos.porciones.hidr,
          grasPorciones: datos.porciones.gras,
        });
      }}
      onBorrar={(id) => void estado.borrarReceta(id)}
    />
  );
}
