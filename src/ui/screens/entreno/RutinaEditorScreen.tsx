import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  DIAS_SEMANA,
  ICONOS_RUTINA,
  TIPOS_EJERCICIO,
  type Ejercicio,
  type NuevaRutina,
  type RutinaEjercicio,
} from '../../../domain/models/entreno';
import { XP } from '../../../domain/rules/xp';
import {
  Aviso,
  Button,
  Card,
  Chip,
  ChipRow,
  ListItem,
  NumberField,
  Screen,
  Text,
  TextField,
} from '../../components';
import { aNumero, entero } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  ejercicios: readonly Ejercicio[];
  guardando: boolean;
  onGuardar: (datos: NuevaRutina) => void;
  onAtras: () => void;
  onBiblioteca: () => void;
  nuevoId: () => string;
};

/**
 * Constructor de rutinas.
 *
 * Una rutina es una lista ordenada de ejercicios con sus objetivos. Los
 * objetivos son ORIENTATIVOS: durante la sesión puedes anotar lo que quieras.
 * Sirven para no tener que recordar con cuánto peso te quedaste, no para
 * juzgarte si no llegas.
 */
export function RutinaEditorScreen({
  ejercicios,
  guardando,
  onGuardar,
  onAtras,
  onBiblioteca,
  nuevoId,
}: Props) {
  const styles = useStyles();

  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState<string>(ICONOS_RUTINA[0]);
  const [notas, setNotas] = useState('');
  const [seleccionados, setSeleccionados] = useState<RutinaEjercicio[]>([]);
  const [anadiendo, setAnadiendo] = useState(false);
  const [dias, setDias] = useState<number[]>([]);

  function anadir(e: Ejercicio) {
    const def = TIPOS_EJERCICIO.find((t) => t.clave === e.tipo)!;
    setSeleccionados((prev) => [
      ...prev,
      {
        id: nuevoId(),
        ejercicioId: e.id,
        orden: prev.length,
        seriesObj: 4,
        repsObj: def.campos.reps ? 8 : null,
        pesoObj: null,
        segundosObj: def.campos.segundos ? 30 : null,
        rirObj: 2,
      },
    ]);
    setAnadiendo(false);
  }

  function cambiar(id: string, cambios: Partial<RutinaEjercicio>) {
    setSeleccionados((prev) => prev.map((r) => (r.id === id ? { ...r, ...cambios } : r)));
  }

  function quitar(id: string) {
    setSeleccionados((prev) => prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, orden: i })));
  }

  const seriesTotales = seleccionados.reduce((acc, r) => acc + r.seriesObj, 0);
  const xpEstimado = XP.completarEntreno + Math.round(seriesTotales * XP.serieRegistrada);
  const puedeGuardar = nombre.trim().length > 0 && seleccionados.length > 0;

  return (
    <Screen
      header={
        <View style={styles.barra}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver sin guardar" onPress={onAtras} hitSlop={12}>
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
          <Text variant="title" style={styles.tituloBarra}>
            Nueva rutina
          </Text>
        </View>
      }
      footer={
        <Button
          label={`Guardar rutina · ~${entero(xpEstimado)} XP por sesión`}
          onPress={() =>
            onGuardar({
              nombre: nombre.trim(),
              icono,
              notas: notas.trim() || null,
              ejercicios: seleccionados,
              diasSemana: dias.sort((a, b) => a - b),
            })
          }
          disabled={!puedeGuardar}
          loading={guardando}
        />
      }
    >
      {ejercicios.length === 0 ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            Antes de crear una rutina necesitas ejercicios en tu biblioteca.
          </Text>
          <Button label="Ir a la biblioteca" size="sm" onPress={onBiblioteca} />
        </Card>
      ) : null}

      <Card>
        <TextField
          label="Nombre"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Empuje A"
          maxLength={40}
        />
        <Text variant="overline" tone="faint">
          Icono
        </Text>
        <ChipRow>
          {ICONOS_RUTINA.map((i) => (
            <Chip key={i} label={i} selected={icono === i} onPress={() => setIcono(i)} />
          ))}
        </ChipRow>

        <Text variant="overline" tone="faint">
          ¿Qué días toca?
        </Text>
        <ChipRow>
          {DIAS_SEMANA.map((d) => (
            <Chip
              key={d.valor}
              label={d.etiqueta}
              selected={dias.includes(d.valor)}
              onPress={() =>
                setDias((prev) =>
                  prev.includes(d.valor) ? prev.filter((x) => x !== d.valor) : [...prev, d.valor],
                )
              }
            />
          ))}
        </ChipRow>
        <Text variant="small" tone="faint">
          {dias.length === 0
            ? 'Sin días marcados es una rutina «cuando me apetezca»: no contará como entreno saltado si no la haces.'
            : 'Los días marcados y sin entreno registrado contarán como entreno saltado en el historial.'}
        </Text>
      </Card>

      <View style={styles.filaTitulo}>
        <Text variant="overline" tone="faint">
          {`Ejercicios · ${entero(seleccionados.length)}`}
        </Text>
        {ejercicios.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setAnadiendo((v) => !v)}>
            <Text variant="small" tone="accent" weight="bold">
              {anadiendo ? 'Cerrar' : '＋ Añadir'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {anadiendo ? (
        <Card variant="flat">
          {ejercicios.map((e) => (
            <ListItem
              key={e.id}
              icono={TIPOS_EJERCICIO.find((t) => t.clave === e.tipo)?.icono}
              titulo={e.nombre}
              subtitulo={TIPOS_EJERCICIO.find((t) => t.clave === e.tipo)?.nombre}
              onPress={() => anadir(e)}
              derecha={
                <Text variant="small" tone="accent" weight="bold">
                  Añadir
                </Text>
              }
            />
          ))}
        </Card>
      ) : null}

      {seleccionados.map((r, i) => {
        const e = ejercicios.find((x) => x.id === r.ejercicioId);
        if (!e) return null;
        const def = TIPOS_EJERCICIO.find((t) => t.clave === e.tipo)!;

        return (
          <Card key={r.id}>
            <View style={styles.filaTitulo}>
              <Text variant="caption" weight="bold" style={styles.nombre}>
                {`${entero(i + 1)}. ${e.nombre}`}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => quitar(r.id)} hitSlop={8}>
                <Text variant="small" tone="danger">
                  Quitar
                </Text>
              </Pressable>
            </View>

            <View style={styles.campos}>
              <View style={styles.campo}>
                <NumberField
                  label="Series"
                  value={String(r.seriesObj)}
                  onChangeText={(v) => cambiar(r.id, { seriesObj: aNumero(v) ?? 0 })}
                  unidad=""
                  allowDecimal={false}
                  maxLength={2}
                />
              </View>

              {def.campos.reps ? (
                <View style={styles.campo}>
                  <NumberField
                    label="Reps"
                    value={r.repsObj == null ? '' : String(r.repsObj)}
                    onChangeText={(v) => cambiar(r.id, { repsObj: aNumero(v) })}
                    unidad=""
                    allowDecimal={false}
                    maxLength={3}
                  />
                </View>
              ) : null}

              {def.campos.segundos ? (
                <View style={styles.campo}>
                  <NumberField
                    label="Segundos"
                    value={r.segundosObj == null ? '' : String(r.segundosObj)}
                    onChangeText={(v) => cambiar(r.id, { segundosObj: aNumero(v) })}
                    unidad="s"
                    allowDecimal={false}
                    maxLength={3}
                  />
                </View>
              ) : null}
            </View>
          </Card>
        );
      })}

      {seleccionados.length > 0 ? (
        <Aviso icono="🎯" titulo="Los objetivos son una referencia">
          Durante la sesión puedes anotar lo que hagas de verdad, por encima o
          por debajo. Sirven para recordar con cuánto te quedaste la última vez,
          no para juzgarte.
        </Aviso>
      ) : null}

      <TextField
        label="Notas"
        value={notas}
        onChangeText={setNotas}
        placeholder="Calentar con barra vacía"
        maxLength={140}
      />
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
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    nombre: { flex: 1 },
    campos: { flexDirection: 'row', gap: t.spacing.md },
    campo: { flex: 1 },
  }),
);
