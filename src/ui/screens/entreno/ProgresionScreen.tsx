import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TIPOS_EJERCICIO, type Ejercicio, type Sesion } from '../../../domain/models/entreno';
import { construirProgresion, ejerciciosMasUsados } from '../../../domain/rules/progresion';
import { REPS_FIABLES_1RM } from '../../../domain/rules/volumen';
import {
  Aviso,
  Card,
  GraficaEvolucion,
  ListItem,
  Screen,
  SegmentedControl,
  Text,
  type Segment,
} from '../../components';
import { conSigno, entero, kg } from '../../format';
import { makeStyles } from '../../theme';

type Vista = 'mejor' | 'volumen';

const VISTAS: readonly Segment<Vista>[] = [
  { value: 'mejor', label: 'Mejor serie' },
  { value: 'volumen', label: 'Volumen' },
];

type Props = {
  ejercicios: readonly Ejercicio[];
  sesiones: readonly Sesion[];
  onAtras: () => void;
};

/**
 * Pantalla 19 · Progresión de un ejercicio.
 *
 * Todo lo que se ve aquí se deriva de las series registradas. No hay tabla de
 * mejores marcas que mantener: si editas o borras una sesión, la progresión se
 * recalcula sola y no queda ningún récord fantasma.
 */
export function ProgresionScreen({ ejercicios, sesiones, onAtras }: Props) {
  const styles = useStyles();
  const usados = ejerciciosMasUsados(ejercicios, sesiones);

  const [elegidoId, setElegidoId] = useState<string | null>(usados[0]?.ejercicio.id ?? null);
  const [vista, setVista] = useState<Vista>('mejor');

  const elegido = ejercicios.find((e) => e.id === elegidoId) ?? null;
  const progresion = elegido ? construirProgresion(elegido, sesiones) : null;
  const def = elegido ? TIPOS_EJERCICIO.find((t) => t.clave === elegido.tipo) : null;

  const ultimo = progresion?.puntos[progresion.puntos.length - 1] ?? null;

  return (
    <Screen
      header={
        <View style={styles.barra}>
          <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={onAtras} hitSlop={12}>
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
          <Text variant="title" style={styles.tituloBarra}>
            Progresión
          </Text>
        </View>
      }
    >
      {usados.length === 0 ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            Todavía no has registrado ninguna serie. La progresión aparece en
            cuanto entrenes.
          </Text>
        </Card>
      ) : null}

      {usados.length > 0 ? (
        <Card variant="flat">
          <Text variant="overline" tone="faint">
            Tus ejercicios
          </Text>
          {usados.map(({ ejercicio, series }) => (
            <ListItem
              key={ejercicio.id}
              icono={TIPOS_EJERCICIO.find((t) => t.clave === ejercicio.tipo)?.icono}
              titulo={ejercicio.nombre}
              subtitulo={`${entero(series)} series registradas`}
              seleccionado={elegidoId === ejercicio.id}
              onPress={() => setElegidoId(ejercicio.id)}
              derecha={
                elegidoId === ejercicio.id ? (
                  <Text variant="small" tone="accent" weight="bold">
                    viendo
                  </Text>
                ) : undefined
              }
            />
          ))}
        </Card>
      ) : null}

      {progresion && elegido ? (
        <>
          <Card variant="accent">
            <Text variant="overline" tone="faint">
              {`${elegido.nombre} · mejor histórico`}
            </Text>
            <View style={styles.filaNumero}>
              <Text variant="display" tone="accent">
                {kg(progresion.mejorHistorico, progresion.unidad === 'kg' ? 1 : 0)}
              </Text>
              <Text variant="caption" tone="muted" weight="semibold">
                {progresion.unidad}
              </Text>
            </View>
            {progresion.mejoraDesdeElInicio != null ? (
              <Text
                variant="small"
                weight="bold"
                tone={progresion.mejoraDesdeElInicio >= 0 ? 'success' : 'muted'}
              >
                {`${conSigno(progresion.mejoraDesdeElInicio, progresion.unidad === 'kg' ? 1 : 0)} ${progresion.unidad} desde tu primera sesión`}
              </Text>
            ) : null}
            <Text variant="small" tone="faint">
              {`${entero(progresion.totalSesiones)} sesiones · ${entero(progresion.totalSeries)} series · ${def?.nombre}`}
            </Text>
          </Card>

          <Card>
            <SegmentedControl segments={VISTAS} value={vista} onChange={setVista} />
            <GraficaEvolucion
              puntos={progresion.puntos.map((p) => ({
                clave: p.fecha.slice(5),
                valor: vista === 'mejor' ? p.mejor : p.volumen,
              }))}
              unidad={vista === 'mejor' ? progresion.unidad : 'kg'}
              vacio="Con dos sesiones de este ejercicio verás la evolución."
            />
            <Text variant="small" tone="faint">
              {vista === 'mejor'
                ? 'La mejor serie de cada día. Las demás series no se dibujan: con cuarenta puntos al mes no se ve nada.'
                : 'Volumen total del ejercicio en cada sesión.'}
            </Text>
          </Card>

          {elegido.tipo === 'externo' && ultimo?.unaRM ? (
            <Aviso icono="📊" titulo={`1RM estimado: ${kg(ultimo.unaRM.kg)} kg`}>
              {ultimo.unaRM.pocoFiable
                ? `Calculado a partir de una serie de más de ${entero(REPS_FIABLES_1RM)} repeticiones, así que tómalo como una orientación gruesa. Y es una estimación, no un máximo probado.`
                : 'Estimado con la fórmula de Epley sobre tu mejor serie. Es una estimación, no un máximo probado: no lo uses para decidir a ciegas cuánto cargar.'}
            </Aviso>
          ) : null}

          {elegido.tipo !== 'externo' ? (
            <Aviso icono="ℹ️" titulo="Aquí no verás 1RM">
              Solo tiene sentido cuando puedes cambiar la carga. Si el peso que
              mueves es siempre el tuyo, tu «máximo a una repetición» no dice
              nada útil.
            </Aviso>
          ) : null}

          <Text variant="overline" tone="faint">
            Historial
          </Text>
          <Card variant="flat">
            {progresion.puntos
              .slice()
              .reverse()
              .slice(0, 10)
              .map((p) => (
                <ListItem
                  key={p.fecha}
                  titulo={p.fecha}
                  subtitulo={`${entero(p.series)} series · ${kg(p.volumen, 0)} kg de volumen`}
                  derecha={
                    <Text variant="caption" weight="bold">
                      {`${kg(p.mejor, progresion.unidad === 'kg' ? 1 : 0)} ${progresion.unidad}`}
                    </Text>
                  }
                />
              ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.md,
    },
    tituloBarra: { flex: 1 },
    filaNumero: { flexDirection: 'row', alignItems: 'baseline', gap: t.spacing.xs },
  }),
);
