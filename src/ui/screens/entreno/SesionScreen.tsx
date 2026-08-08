import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  TIPOS_EJERCICIO,
  type Ejercicio,
  type Rutina,
  type Serie,
  type Sesion,
} from '../../../domain/models/entreno';
import { estimar1RM, volumenSerie } from '../../../domain/rules/volumen';
import type { DatosNuevaSerie } from '../../../application/entreno/sesion';
import {
  Aviso,
  Button,
  Card,
  Chip,
  ChipRow,
  Cronometro,
  ListItem,
  NumberField,
  ProgressBar,
  Screen,
  Text,
} from '../../components';
import { aNumero, entero, kg } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  sesion: Sesion;
  rutina: Rutina | null;
  ejercicios: readonly Ejercicio[];
  onAnotar: (ejercicio: Ejercicio, datos: DatosNuevaSerie) => void;
  onQuitarSerie: (serieId: string) => void;
  onTerminar: () => void;
  onDescartar: () => void;
  onSalir: () => void;
};

/**
 * Pantallas 16 y 17 · Sesión activa.
 *
 * UNA SOLA pantalla para los cinco tipos de ejercicio. Lo que cambia son las
 * columnas de la tabla, y eso lo declara el propio tipo: una dominada no tiene
 * casilla de peso, un L-sit no tiene casilla de repeticiones.
 *
 * Es la pantalla que más se usa de pie, con prisa y a veces con las manos
 * sudadas: por eso los campos son pocos y grandes, y anotar una serie es un
 * solo botón.
 */
export function SesionScreen({
  sesion,
  rutina,
  ejercicios,
  onAnotar,
  onQuitarSerie,
  onTerminar,
  onDescartar,
  onSalir,
}: Props) {
  const styles = useStyles();

  // Ejercicios disponibles: los de la rutina primero, y si es sesión libre,
  // toda la biblioteca.
  const delPlan = useMemo(() => {
    if (!rutina) return [];
    return rutina.ejercicios
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((r) => ejercicios.find((e) => e.id === r.ejercicioId))
      .filter((e): e is Ejercicio => e != null);
  }, [rutina, ejercicios]);

  const disponibles = delPlan.length > 0 ? delPlan : ejercicios;

  const [activoId, setActivoId] = useState<string | null>(disponibles[0]?.id ?? null);
  const [verTodos, setVerTodos] = useState(false);

  const activo = ejercicios.find((e) => e.id === activoId) ?? null;
  const def = activo ? TIPOS_EJERCICIO.find((t) => t.clave === activo.tipo)! : null;

  const [reps, setReps] = useState('');
  const [peso, setPeso] = useState('');
  const [lastre, setLastre] = useState('');
  const [segundos, setSegundos] = useState('');
  const [rir, setRir] = useState('');

  // Al cambiar de ejercicio se limpian los campos que no aplican, pero se
  // conserva el peso: casi siempre repites carga entre series.
  useEffect(() => {
    setSegundos('');
    setRir('');
  }, [activoId]);

  const objetivo = rutina?.ejercicios.find((r) => r.ejercicioId === activoId) ?? null;
  const seriesDeEste = sesion.series.filter((s) => s.ejercicioId === activoId);

  const datos: DatosNuevaSerie | null = activo
    ? {
        ejercicioId: activo.id,
        reps: def?.campos.reps ? aNumero(reps) : null,
        pesoKg: def?.campos.peso ? aNumero(peso) : null,
        lastreKg: def?.campos.lastre ? aNumero(lastre) : null,
        segundos: def?.campos.segundos ? aNumero(segundos) : null,
        rir: aNumero(rir),
      }
    : null;

  const puedeAnotar =
    datos != null &&
    ((def?.campos.reps && (datos.reps ?? 0) > 0) || (def?.campos.segundos && (datos.segundos ?? 0) > 0));

  const previsualizacion =
    activo && datos && puedeAnotar
      ? volumenSerie(datos, activo.tipo, activo.factorApalancamiento, sesion.pesoCorporalKg)
      : 0;

  const unaRM =
    activo?.tipo === 'externo' && datos?.pesoKg && datos.reps
      ? estimar1RM(datos.pesoKg, datos.reps)
      : null;

  function anotar() {
    if (!activo || !datos) return;
    onAnotar(activo, datos);
    setReps('');
    setSegundos('');
    setRir('');
  }

  const seriesPlan = rutina?.ejercicios.reduce((acc, r) => acc + r.seriesObj, 0) ?? 0;
  const progreso = seriesPlan > 0 ? sesion.series.length / seriesPlan : 0;

  return (
    <Screen
      header={
        <View style={styles.cabecera}>
          <View style={styles.barra}>
            <Pressable accessibilityRole="button" accessibilityLabel="Salir sin terminar" onPress={onSalir} hitSlop={12}>
              <Text variant="title" tone="accent">
                ←
              </Text>
            </Pressable>
            <View style={styles.titulo}>
              <Text variant="body" weight="bold" numberOfLines={1}>
                {sesion.nombre}
              </Text>
              <Text variant="small" tone="accent">
                {`${entero(sesion.series.length)} series${seriesPlan > 0 ? ` de ${entero(seriesPlan)}` : ''} · desde las ${sesion.horaInicio}`}
              </Text>
            </View>
          </View>
          {seriesPlan > 0 ? (
            <View style={styles.progreso}>
              <ProgressBar value={progreso} tone="xp" />
            </View>
          ) : null}
        </View>
      }
      footer={
        <Button
          label={
            sesion.series.length === 0
              ? 'Anota al menos una serie'
              : `Terminar sesión · ${entero(sesion.series.length)} series`
          }
          onPress={onTerminar}
          disabled={sesion.series.length === 0}
        />
      }
    >
      <ChipRow>
        {(verTodos ? ejercicios : disponibles).map((e) => {
          const hechas = sesion.series.filter((s) => s.ejercicioId === e.id).length;
          return (
            <Chip
              key={e.id}
              label={hechas > 0 ? `${e.nombre} · ${hechas}` : e.nombre}
              selected={activoId === e.id}
              onPress={() => setActivoId(e.id)}
            />
          );
        })}
        {delPlan.length > 0 && !verTodos ? (
          <Chip label="＋ otro" selected={false} onPress={() => setVerTodos(true)} />
        ) : null}
      </ChipRow>

      {!activo ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            No hay ejercicios en tu biblioteca. Añade alguno para poder registrar
            series.
          </Text>
        </Card>
      ) : (
        <Card variant="accent">
          <View style={styles.filaTitulo}>
            <Text variant="label" style={styles.nombre}>
              {activo.nombre}
            </Text>
            <Text variant="small" tone="muted">
              {def?.nombre}
            </Text>
          </View>

          {objetivo ? (
            <Text variant="small" tone="faint">
              {`Objetivo: ${entero(objetivo.seriesObj)} × ${
                objetivo.repsObj != null ? `${entero(objetivo.repsObj)} reps` : `${entero(objetivo.segundosObj ?? 0)} s`
              }${objetivo.rirObj != null ? ` · RIR ${entero(objetivo.rirObj)}` : ''}`}
            </Text>
          ) : null}

          {seriesDeEste.length > 0 ? (
            <View style={styles.tabla}>
              {seriesDeEste.map((s) => (
                <FilaSerie
                  key={s.id}
                  serie={s}
                  mostrarPeso={def?.campos.peso ?? false}
                  mostrarLastre={def?.campos.lastre ?? false}
                  mostrarSegundos={def?.campos.segundos ?? false}
                  onQuitar={() => onQuitarSerie(s.id)}
                />
              ))}
            </View>
          ) : null}

          {/* Los isométricos se miden con cronómetro, no escribiendo el número. */}
          {activo.tipo === 'isometrico' ? (
            <Cronometro
              onParar={(s) => {
                if (s > 0) {
                  onAnotar(activo, {
                    ejercicioId: activo.id,
                    reps: null,
                    pesoKg: null,
                    lastreKg: aNumero(lastre),
                    segundos: s,
                    rir: aNumero(rir),
                  });
                }
              }}
            />
          ) : (
            <>
              <View style={styles.campos}>
                {def?.campos.reps ? (
                  <View style={styles.campo}>
                    <NumberField
                      label="Reps"
                      value={reps}
                      onChangeText={setReps}
                      unidad=""
                      allowDecimal={false}
                      maxLength={3}
                    />
                  </View>
                ) : null}
                {def?.campos.peso ? (
                  <View style={styles.campo}>
                    <NumberField label="Peso" value={peso} onChangeText={setPeso} unidad="kg" maxLength={5} />
                  </View>
                ) : null}
                {def?.campos.lastre ? (
                  <View style={styles.campo}>
                    <NumberField label="Lastre" value={lastre} onChangeText={setLastre} unidad="kg" maxLength={5} />
                  </View>
                ) : null}
                {/* Solo llega aquí el cardio: los isométricos usan cronómetro. */}
                {def?.campos.segundos ? (
                  <View style={styles.campo}>
                    <NumberField
                      label="Duración"
                      value={segundos}
                      onChangeText={setSegundos}
                      unidad="s"
                      allowDecimal={false}
                      maxLength={4}
                    />
                  </View>
                ) : null}
              </View>

              <Button label="Anotar serie" onPress={anotar} disabled={!puedeAnotar} />
            </>
          )}

          {previsualizacion > 0 ? (
            <Text variant="small" tone="faint">
              {`Volumen de esta serie: ${kg(previsualizacion, 0)} kg`}
            </Text>
          ) : null}
        </Card>
      )}

      {unaRM ? (
        <Aviso icono="📊" titulo={`1RM estimado: ${kg(unaRM.kg)} kg`}>
          {unaRM.pocoFiable
            ? 'Por encima de 8 repeticiones la fórmula pierde fiabilidad: tómalo como una orientación muy gruesa.'
            : 'Estimado con la fórmula de Epley a partir de esta serie. Es una estimación, no un máximo probado.'}
        </Aviso>
      ) : null}

      {activo && (activo.tipo === 'corporal' || activo.tipo === 'corporal_lastre') ? (
        <Aviso icono="⚖️" titulo="Cómo se calcula tu volumen">
          {`Con ${kg(sesion.pesoCorporalKg)} kg de peso corporal y un factor de ${activo.factorApalancamiento.toFixed(2).replace('.', ',')}, cada repetición cuenta como ${kg(sesion.pesoCorporalKg * activo.factorApalancamiento, 0)} kg movidos.`}
        </Aviso>
      ) : null}

      <Card variant="dashed">
        <ListItem
          icono="🗑️"
          titulo="Descartar esta sesión"
          subtitulo="Se borra entera, sin guardar nada ni dar XP"
          onPress={onDescartar}
          derecha={
            <Text variant="small" tone="danger" weight="bold">
              Descartar
            </Text>
          }
        />
      </Card>
    </Screen>
  );
}

function FilaSerie({
  serie,
  mostrarPeso,
  mostrarLastre,
  mostrarSegundos,
  onQuitar,
}: {
  serie: Serie;
  mostrarPeso: boolean;
  mostrarLastre: boolean;
  mostrarSegundos: boolean;
  onQuitar: () => void;
}) {
  const styles = useStyles();

  const partes = [
    serie.reps != null ? `${entero(serie.reps)} reps` : null,
    mostrarPeso && serie.pesoKg != null ? `${kg(serie.pesoKg)} kg` : null,
    mostrarLastre && serie.lastreKg ? `+${kg(serie.lastreKg)} kg` : null,
    mostrarSegundos && serie.segundos != null ? `${entero(serie.segundos)} s` : null,
    serie.rir != null ? `RIR ${entero(serie.rir)}` : null,
  ].filter(Boolean);

  return (
    <View style={styles.fila}>
      <Text variant="small" tone="faint" style={styles.numero}>
        {entero(serie.numero)}
      </Text>
      <Text variant="caption" weight="bold" style={styles.detalle}>
        {partes.join(' · ')}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Quitar serie" onPress={onQuitar} hitSlop={8}>
        <Text variant="small" tone="faint">
          ✕
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    cabecera: { gap: t.spacing.sm },
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.sm,
    },
    titulo: { flex: 1, gap: 1 },
    progreso: { paddingHorizontal: t.spacing.xl, paddingBottom: t.spacing.sm },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    nombre: { flex: 1 },
    tabla: { gap: 1, marginVertical: t.spacing.xs },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
    },
    numero: { width: 18 },
    detalle: { flex: 1 },
    campos: { flexDirection: 'row', gap: t.spacing.md },
    campo: { flex: 1 },
  }),
);
