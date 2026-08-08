import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Ejercicio, Sesion } from '../../../domain/models/entreno';
import type { Escalera, Escalon, NuevaEscalera } from '../../../domain/models/escalera';
import {
  AVISO_ASCENSO,
  descripcionCriterio,
  estadoDeEscalera,
} from '../../../domain/rules/escaleras';
import { XP } from '../../../domain/rules/xp';
import {
  Aviso,
  Button,
  Card,
  Chip,
  ChipRow,
  ListItem,
  NumberField,
  ProgressBar,
  Screen,
  Text,
  TextField,
  Tick,
} from '../../components';
import { aNumero, entero } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  escaleras: readonly Escalera[];
  ejercicios: readonly Ejercicio[];
  sesiones: readonly Sesion[];
  onCrear: (datos: NuevaEscalera) => void;
  onAscender: (escalera: Escalera) => void;
  onBorrar: (id: string) => void;
  onAtras: () => void;
  nuevoId: () => string;
};

/**
 * Pantalla 20 · Escaleras de progresión.
 *
 * En calistenia no puedes añadir dos kilos y medio a la barra: progresas
 * cambiando a una variante más difícil. La escalera hace explícito CUÁNDO toca
 * ese cambio, con un criterio escrito en lugar de una corazonada.
 *
 * El ascenso se OFRECE, nunca se aplica solo. La app ve series, repeticiones y
 * el RIR que declaraste; no ve si la técnica se rompió en la última repetición.
 */
export function EscalerasScreen({
  escaleras,
  ejercicios,
  sesiones,
  onCrear,
  onAscender,
  onBorrar,
  onAtras,
  nuevoId,
}: Props) {
  const styles = useStyles();
  const [creando, setCreando] = useState(false);

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
            Escaleras
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nueva escalera"
            onPress={() => setCreando((v) => !v)}
            hitSlop={12}
          >
            <Text variant="title" tone="accent">
              {creando ? '×' : '＋'}
            </Text>
          </Pressable>
        </View>
      }
    >
      {creando ? (
        <EditorEscalera
          ejercicios={ejercicios}
          nuevoId={nuevoId}
          onGuardar={(datos) => {
            onCrear(datos);
            setCreando(false);
          }}
        />
      ) : null}

      {escaleras.length === 0 && !creando ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            Todavía no tienes escaleras. Una escalera es la secuencia de
            variantes de un movimiento, de la más fácil a la más difícil.
          </Text>
          <Text variant="small" tone="faint">
            Por ejemplo, para la dominada: remo invertido → negativas → dominada
            completa → dominada lastrada.
          </Text>
          <Button label="Crear la primera" size="sm" onPress={() => setCreando(true)} />
        </Card>
      ) : null}

      {escaleras.map((escalera) => {
        const estado = estadoDeEscalera(escalera, sesiones);
        const orden = [...escalera.escalones].sort((a, b) => a.orden - b.orden);

        return (
          <Card key={escalera.id}>
            <View style={styles.filaTitulo}>
              <Text variant="label" style={styles.nombre}>
                {`${escalera.icono} ${escalera.nombre}`}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => onBorrar(escalera.id)} hitSlop={8}>
                <Text variant="small" tone="danger">
                  Borrar
                </Text>
              </Pressable>
            </View>

            <ProgressBar value={(escalera.escalonActual + 1) / Math.max(1, orden.length)} />
            <Text variant="small" tone="faint">
              {`Escalón ${entero(escalera.escalonActual + 1)} de ${entero(orden.length)}`}
            </Text>

            <View style={styles.escalones}>
              {orden.map((e, i) => {
                const superado = i < escalera.escalonActual;
                const actual = i === escalera.escalonActual;

                return (
                  <View key={e.id} style={[styles.escalon, !superado && !actual && styles.futuro]}>
                    <Tick activo={superado} />
                    <View style={styles.textoEscalon}>
                      <Text variant="caption" weight={actual ? 'bold' : 'regular'} tone={actual ? 'accent' : 'default'}>
                        {e.nombre}
                      </Text>
                      <Text variant="small" tone="faint">
                        {descripcionCriterio(e)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {estado.evaluacion?.estado === 'en_progreso' ? (
              <Card variant="flat">
                <Text variant="small" tone="muted">
                  {`Llevas ${entero(estado.evaluacion.seriesValidas)} de ${entero(estado.evaluacion.requeridas)} series válidas en una misma sesión.`}
                </Text>
                <Text variant="small" tone="faint">
                  Tienen que salir el mismo día: sumar series buenas de días
                  distintos no demuestra que domines el movimiento.
                </Text>
              </Card>
            ) : null}

            {estado.puedeAscender ? (
              <>
                <Aviso icono="🪜" titulo={`Criterio cumplido el ${estado.evaluacion?.estado === 'cumplido' ? estado.evaluacion.enSesion : ''}`}>
                  {AVISO_ASCENSO}
                </Aviso>
                <Button
                  label={`Subir a «${estado.siguiente?.nombre}» · +${entero(XP.subirEscalon)} XP`}
                  onPress={() => onAscender(escalera)}
                />
              </>
            ) : null}

            {estado.completada ? (
              <Aviso icono="🏆" titulo="Escalera completada" tono="accent">
                Has llegado al último escalón. A partir de aquí se progresa
                añadiendo lastre o alargando el recorrido.
              </Aviso>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

function EditorEscalera({
  ejercicios,
  nuevoId,
  onGuardar,
}: {
  ejercicios: readonly Ejercicio[];
  nuevoId: () => string;
  onGuardar: (datos: NuevaEscalera) => void;
}) {
  const styles = useStyles();
  const [nombre, setNombre] = useState('');
  const [escalones, setEscalones] = useState<Escalon[]>([]);

  function anadirEscalon(ejercicio: Ejercicio) {
    setEscalones((prev) => [
      ...prev,
      {
        id: nuevoId(),
        orden: prev.length,
        nombre: ejercicio.nombre,
        ejercicioId: ejercicio.id,
        criterioTexto: null,
        criterioSeries: 3,
        criterioReps: ejercicio.tipo === 'isometrico' ? null : 10,
        criterioSegundos: ejercicio.tipo === 'isometrico' ? 30 : null,
        criterioRir: 2,
      },
    ]);
  }

  function cambiar(id: string, cambios: Partial<Escalon>) {
    setEscalones((prev) => prev.map((e) => (e.id === id ? { ...e, ...cambios } : e)));
  }

  return (
    <Card variant="accent">
      <Text variant="overline" tone="faint">
        Nueva escalera
      </Text>

      <TextField
        label="Movimiento"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Dominada"
        maxLength={40}
        autoFocus
      />

      {ejercicios.length === 0 ? (
        <Text variant="small" tone="faint">
          Necesitas ejercicios en tu biblioteca para montar los escalones.
        </Text>
      ) : (
        <>
          <Text variant="overline" tone="faint">
            Añadir escalón, de más fácil a más difícil
          </Text>
          <ChipRow>
            {ejercicios.map((e) => (
              <Chip key={e.id} label={e.nombre} selected={false} onPress={() => anadirEscalon(e)} />
            ))}
          </ChipRow>
        </>
      )}

      {escalones.map((e, i) => (
        <Card key={e.id} variant="flat">
          <Text variant="caption" weight="bold">
            {`${entero(i + 1)}. ${e.nombre}`}
          </Text>
          <View style={styles.campos}>
            <View style={styles.campo}>
              <NumberField
                label="Series"
                value={String(e.criterioSeries)}
                onChangeText={(v) => cambiar(e.id, { criterioSeries: aNumero(v) ?? 1 })}
                unidad=""
                allowDecimal={false}
                maxLength={2}
              />
            </View>
            <View style={styles.campo}>
              <NumberField
                label={e.criterioSegundos != null ? 'Segundos' : 'Reps'}
                value={String(e.criterioSegundos ?? e.criterioReps ?? 0)}
                onChangeText={(v) =>
                  cambiar(
                    e.id,
                    e.criterioSegundos != null
                      ? { criterioSegundos: aNumero(v) }
                      : { criterioReps: aNumero(v) },
                  )
                }
                unidad=""
                allowDecimal={false}
                maxLength={3}
              />
            </View>
            <View style={styles.campo}>
              <NumberField
                label="RIR mín."
                value={e.criterioRir == null ? '' : String(e.criterioRir)}
                onChangeText={(v) => cambiar(e.id, { criterioRir: aNumero(v) })}
                unidad=""
                allowDecimal={false}
                maxLength={1}
              />
            </View>
          </View>
        </Card>
      ))}

      {escalones.length > 0 ? (
        <Aviso icono="🎯" titulo="Por qué se exige RIR">
          El RIR es el margen que te sobra al acabar la serie. Pedir un mínimo
          obliga a dominar el escalón con holgura antes de subir, en vez de
          superarlo arañando la última repetición un día bueno.
        </Aviso>
      ) : null}

      <Button
        label="Guardar escalera"
        onPress={() =>
          onGuardar({
            nombre: nombre.trim(),
            icono: '🪜',
            escalones,
            escalonActual: 0,
            fechaUltimoAscenso: null,
          })
        }
        disabled={nombre.trim().length === 0 || escalones.length < 2}
      />
      {escalones.length === 1 ? (
        <Text variant="small" tone="faint" center>
          Una escalera necesita al menos dos escalones.
        </Text>
      ) : null}
    </Card>
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
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    nombre: { flex: 1 },
    escalones: { gap: t.spacing.sm, marginTop: t.spacing.xs },
    escalon: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    futuro: { opacity: 0.45 },
    textoEscalon: { flex: 1, gap: 1 },
    campos: { flexDirection: 'row', gap: t.spacing.sm },
    campo: { flex: 1 },
  }),
);
