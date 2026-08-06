import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useOnboardingStore } from '../../../application/onboarding/onboardingStore';
import { ETIQUETA_PERIODO } from '../../../domain/models/objetivo';
import {
  estimarLlegada,
  rangoPesoSaludable,
  revisarObjetivoPeso,
} from '../../../domain/rules/composicion';
import { generarObjetivosIniciales } from '../../../domain/rules/objetivosIniciales';
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
  StepHeader,
  Text,
} from '../../components';
import { aNumero, conSigno, entero, fechaLarga, kg } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  onContinuar: () => void;
  onAtras: () => void;
};

/**
 * Entrenos por semana ofrecidos.
 *
 * El mockup empezaba en 2. Empieza en 1 porque un objetivo que no puedes
 * cumplir no motiva, desmoraliza: quien arranca de cero, o vuelve de una lesión,
 * necesita poder marcarse una sesión y cumplirla.
 */
const SESIONES = [1, 2, 3, 4, 5, 6] as const;

/**
 * Pantalla 04 · Primer objetivo.
 *
 * Dos números, y la app genera sola los objetivos. El usuario entra a Inicio con
 * la barra de XP ya en movimiento en lugar de con una pantalla vacía.
 *
 * La previsualización de objetivos NO se calcula aquí: se llama a la misma
 * función de dominio que se ejecutará al guardar. Así lo que se enseña y lo que
 * se crea no pueden divergir nunca.
 */
export function ObjetivoScreen({ onContinuar, onAtras }: Props) {
  const styles = useStyles();
  const store = useOnboardingStore();

  const pesoActual = store.pesoKg ?? 0;
  const altura = store.alturaCm ?? 0;
  const rango = altura > 0 ? rangoPesoSaludable(altura) : null;

  const sugerido = useMemo(() => {
    if (!rango) return pesoActual;
    return Math.min(Math.max(pesoActual - 6, rango.minKg), rango.maxKg);
  }, [pesoActual, rango]);

  const [objetivo, setObjetivo] = useState(
    (store.pesoObjetivoKg ?? Math.round(sugerido * 10) / 10).toFixed(1).replace('.', ','),
  );

  const objetivoNum = aNumero(objetivo);

  const prevision = useMemo(
    () =>
      objetivoNum == null
        ? null
        : estimarLlegada({ pesoActualKg: pesoActual, pesoObjetivoKg: objetivoNum, hoy: new Date() }),
    [objetivoNum, pesoActual],
  );

  const aviso = useMemo(
    () =>
      objetivoNum == null || altura === 0
        ? { tipo: 'ninguno' as const }
        : revisarObjetivoPeso({
            pesoActualKg: pesoActual,
            pesoObjetivoKg: objetivoNum,
            alturaCm: altura,
          }),
    [objetivoNum, pesoActual, altura],
  );

  const previsualizacion = useMemo(
    () =>
      objetivoNum == null
        ? []
        : generarObjetivosIniciales({
            pesoActualKg: pesoActual,
            pesoObjetivoKg: objetivoNum,
            sesionesPorSemana: store.sesionesPorSemana,
            modulosActivos: store.modulos,
          }),
    [objetivoNum, pesoActual, store.sesionesPorSemana, store.modulos],
  );

  const bloqueado = aviso.tipo === 'por_debajo_del_rango';

  function continuar() {
    store.setPesoObjetivo(objetivoNum);
    onContinuar();
  }

  return (
    <Screen
      header={<StepHeader paso={3} total={4} onBack={onAtras} />}
      footer={
        <Button label="Crear y continuar" onPress={continuar} disabled={objetivoNum == null || bloqueado} />
      }
    >
      <View style={styles.intro}>
        <Text variant="displaySm">Tu primer objetivo</Text>
        <Text variant="caption" tone="muted">
          Solo dos números. Luego podrás crear los que quieras.
        </Text>
      </View>

      <NumberField
        label="¿A qué peso quieres llegar?"
        value={objetivo}
        onChangeText={setObjetivo}
        unidad="kg"
        destacado
      />

      {prevision ? (
        <Card>
          <ProgressBar value={1} />
          <View style={styles.fila}>
            <Text variant="small" tone="faint">{`actual ${kg(pesoActual)} kg`}</Text>
            <Text variant="small" tone="faint">{`${conSigno(-prevision.diferenciaKg)} kg`}</Text>
          </View>
        </Card>
      ) : null}

      <Card>
        <Text variant="overline" tone="faint">
          ¿Cuántos entrenos por semana?
        </Text>
        <ChipRow>
          {SESIONES.map((n) => (
            <Chip
              key={n}
              label={String(n)}
              selected={store.sesionesPorSemana === n}
              onPress={() => store.setSesionesPorSemana(n)}
            />
          ))}
        </ChipRow>
      </Card>

      {aviso.tipo === 'por_debajo_del_rango' ? (
        <Aviso icono="⛔" tono="danger">
          {`Ese peso queda por debajo de tu rango saludable, que empieza en ${kg(aviso.minKg)} kg. Elige un objetivo dentro del rango para continuar.`}
        </Aviso>
      ) : null}

      {aviso.tipo === 'por_encima_del_rango' ? (
        <Aviso icono="ℹ️">
          {`Ese peso queda por encima del rango de referencia, que llega hasta ${kg(aviso.maxKg)} kg. Puedes continuar igualmente.`}
        </Aviso>
      ) : null}

      {prevision && !bloqueado ? (
        <Aviso icono="📅">
          {`A un ritmo prudente de ${kg(prevision.ritmoSemanalKg, 2)} kg por semana llegarías alrededor del ${fechaLarga(prevision.fechaEstimada)}, unas ${entero(prevision.semanas)} semanas. Más rápido que un 1 % de tu peso por semana y empiezas a perder músculo, no grasa.`}
        </Aviso>
      ) : null}

      {previsualizacion.length > 0 ? (
        <>
          <Text variant="overline" tone="faint">
            Te voy a crear estos objetivos
          </Text>
          <Card variant="flat">
            {previsualizacion.map((o) => (
              <ListItem
                key={o.nombre}
                icono={iconoObjetivo(o.metrica)}
                titulo={o.nombre}
                subtitulo={ETIQUETA_PERIODO[o.periodo]}
                derecha={
                  <Text variant="small" weight="bold" tone="accent">
                    {`+${entero(o.xp)} XP`}
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

function iconoObjetivo(metrica: string): string {
  if (metrica === 'peso_kg') return '🎯';
  if (metrica === 'sesiones') return '🏋️';
  if (metrica === 'pesajes') return '⚖️';
  return '📌';
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    intro: { gap: t.spacing.xs },
    fila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  }),
);
