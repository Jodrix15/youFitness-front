import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { useComidas } from '../src/application/comida/useComidas';
import { useSesion } from '../src/application/session/useSesion';
import { hoy as hoyISO } from '../src/domain/rules/fechas';
import { Screen, Text } from '../src/ui/components';
import { DeslizScreen } from '../src/ui/screens/comida/DeslizScreen';

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sirve para anotar y para corregir.
 *
 * El día NO es siempre hoy: llega en `?fecha=` desde el diario, que puede estar
 * mirando un martes de hace tres semanas. Anotar ahí un desliz que aterrizara en
 * hoy sería un error silencioso —no falla nada, el dato queda en el día que no
 * era— y de los que no se descubren hasta mucho después.
 */
export default function DeslizRoute() {
  const { fecha, id } = useLocalSearchParams<{ fecha?: string; id?: string }>();
  const { perfil, cargando } = useSesion();
  const estado = useComidas(perfil?.usuarioId ?? null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const hoy = hoyISO();
  const edicion = id ? estado.buscarComida(id) : null;

  const dia =
    edicion?.fecha ?? (fecha && ES_FECHA.test(fecha) ? fecha : hoy);

  // El presupuesto semanal es el de la semana del día que se está anotando, no
  // el de esta semana: son deslices de semanas distintas.
  const { irADia } = estado;
  useEffect(() => {
    irADia(dia);
  }, [irADia, dia]);

  if (cargando || estado.cargando || !perfil) {
    return (
      <Screen center>
        <Text tone="muted" center>
          Cargando…
        </Text>
      </Screen>
    );
  }

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/comida'));

  return (
    <DeslizScreen
      fecha={dia}
      hoy={hoy}
      edicion={edicion ? { comida: edicion, detalle: estado.buscarDetalleDesliz(edicion.id) } : null}
      presupuesto={estado.presupuesto}
      analisis={estado.analisis}
      modoEstricto={perfil.modoEstricto}
      guardando={guardando}
      mensaje={mensaje}
      onCancelar={volver}
      onBorrar={
        edicion
          ? () => {
              void (async () => {
                await estado.borrarComida(edicion.id);
                volver();
              })();
            }
          : undefined
      }
      onGuardar={(datos) => {
        void (async () => {
          setGuardando(true);
          setMensaje(null);
          try {
            const detalle = {
              categoria: datos.categoria,
              cantidad: datos.cantidad,
              sustituyoComida: datos.sustituyoComida,
              disparador: datos.disparador,
              emocionDespues: datos.emocionDespues,
              lugar: datos.lugar,
              nota: datos.nota,
            };

            if (edicion) {
              await estado.editarDesliz(edicion.id, {
                descripcion: datos.descripcion,
                tipo: datos.tipo,
                detalle,
              });
              volver();
              return;
            }

            const r = await estado.guardarDesliz({
              descripcion: datos.descripcion,
              tipo: datos.tipo,
              fecha: dia,
              detalle,
            });
            if (r) volver();
          } finally {
            setGuardando(false);
          }
        })();
      }}
    />
  );
}
