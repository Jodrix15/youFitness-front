import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { useComidas } from '../src/application/comida/useComidas';
import { useSesion } from '../src/application/session/useSesion';
import type { TipoComida } from '../src/domain/models/comida';
import { hoy as hoyISO } from '../src/domain/rules/fechas';
import { Screen, Text } from '../src/ui/components';
import { AnadirComidaScreen } from '../src/ui/screens/comida/AnadirComidaScreen';

const TIPOS_VALIDOS: readonly string[] = ['desayuno', 'comida', 'cena', 'snack'];
const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sirve para crear y para corregir.
 *
 * Con `?id=` carga la comida y guarda cambios; sin él, crea una nueva en la
 * fecha que venga en `?fecha=` o, si no viene, en hoy. Es la misma pantalla
 * porque son los mismos campos: duplicarla solo garantizaría que las dos
 * versiones se separen.
 */
export default function ComidaNuevaRoute() {
  const { tipo, fecha, id } = useLocalSearchParams<{
    tipo?: string;
    fecha?: string;
    id?: string;
  }>();
  const { perfil, cargando } = useSesion();
  const estado = useComidas(perfil?.usuarioId ?? null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const hoy = hoyISO();
  const edicion = id ? estado.buscarComida(id) : null;
  const dia = edicion?.fecha ?? (fecha && ES_FECHA.test(fecha) ? fecha : hoy);

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

  const tipoInicial = tipo && TIPOS_VALIDOS.includes(tipo) ? (tipo as TipoComida) : undefined;
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/comida'));

  return (
    <AnadirComidaScreen
      fecha={dia}
      hoy={hoy}
      tipoInicial={tipoInicial}
      edicion={edicion}
      recetas={estado.recetas}
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
            const campos = {
              tipo: datos.tipo,
              descripcion: datos.descripcion,
              recetaId: datos.recetaId,
              saciedad: datos.saciedad,
              nota: null,
            };

            if (edicion) {
              await estado.editarComida(edicion.id, campos);
            } else {
              await estado.guardarComida(campos, dia);
            }
            volver();
          } finally {
            setGuardando(false);
          }
        })();
      }}
      onGuardarComoReceta={(datos) => {
        void (async () => {
          await estado.crearReceta({
            nombre: datos.nombre,
            icono: '🍽️',
            raciones: 1,
            ingredientes: '',
            notas: null,
          });
          setMensaje('Guardada como receta. La próxima vez, un toque.');
        })();
      }}
    />
  );
}
