import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Perfil } from '../../../domain/models/perfil';
import { pesoValido, cinturaValida, ratioCinturaAltura } from '../../../domain/rules/composicion';
import { UMBRAL_TENDENCIA } from '../../../domain/rules/tendenciaPeso';
import { XP } from '../../../domain/rules/xp';
import type { EstadoPeso } from '../../../application/peso/usePeso';
import {
  Aviso,
  AvisoUmbral,
  Button,
  Card,
  DiaDeRegistro,
  NumberField,
  Screen,
  SegmentedControl,
  Text,
  type Segment,
} from '../../components';
import { GraficaPeso } from '../../components/GraficaPeso';
import { hoy } from '../../../domain/rules/fechas';
import { aNumero, conSigno, decimal, entero, kg } from '../../format';
import { makeStyles } from '../../theme';

type Rango = '1M' | '6M' | '1A' | 'todo';

const RANGOS: readonly Segment<Rango>[] = [
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: '1A', label: '1A' },
  { value: 'todo', label: 'Todo' },
];

const DIAS_POR_RANGO: Record<Rango, number | null> = { '1M': 30, '6M': 182, '1A': 365, todo: null };

type Props = {
  perfil: Perfil;
  estado: EstadoPeso;
  onAtras: () => void;
};

/**
 * Pantalla 09 · Peso.
 *
 * La media de 7 días es el número protagonista; el pesaje de hoy queda debajo,
 * en pequeño. Es el pesaje suelto el que miente: oscila uno o dos kilos por agua
 * y tránsito intestinal, y mirarlo a diario lleva a conclusiones falsas.
 *
 * Con menos de 7 pesajes no se muestra tendencia (§6): la app dice cuántos
 * faltan en vez de inventar un análisis con datos insuficientes.
 */
export function PesoScreen({ perfil, estado, onAtras }: Props) {
  const styles = useStyles();
  const { tendencia, resumen, pesajeDeHoy, cintura } = estado;

  const [entrada, setEntrada] = useState(
    pesajeDeHoy ? pesajeDeHoy.pesoKg.toFixed(1).replace('.', ',') : '',
  );
  const [rango, setRango] = useState<Rango>('6M');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editandoCintura, setEditandoCintura] = useState(false);
  const [entradaCintura, setEntradaCintura] = useState(
    cintura ? String(Math.round(cintura.valorCm)) : '',
  );

  const pesoNum = aNumero(entrada);
  const valido = pesoNum != null && pesoValido(pesoNum);

  const serieVisible = useMemo(() => {
    if (tendencia.estado !== 'lista') return [];
    const dias = DIAS_POR_RANGO[rango];
    if (dias == null) return tendencia.serie;
    const corte = new Date();
    corte.setDate(corte.getDate() - dias);
    const limite = corte.toISOString().slice(0, 10);
    return tendencia.serie.filter((p) => p.fecha >= limite);
  }, [tendencia, rango]);

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const xp = await estado.guardar(pesoNum);
      setMensaje(
        xp > 0
          ? `Guardado. +${entero(xp)} XP`
          : 'Actualizado. El XP de hoy ya estaba concedido.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCintura() {
    const cm = aNumero(entradaCintura);
    if (cm == null || !cinturaValida(cm)) return;
    await estado.guardarCintura(cm);
    setEditandoCintura(false);
  }

  return (
    <Screen
      header={
        <View style={styles.barra}>
          <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={onAtras} hitSlop={12}>
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
          {/* Un pesaje es de hoy y solo de hoy: pesarse dos veces corrige. */}
          <View style={styles.tituloBarra}>
            <Text variant="title">Peso</Text>
            <DiaDeRegistro fecha={hoy()} hoy={hoy()} />
          </View>
        </View>
      }
    >
      {tendencia.estado === 'lista' ? (
        <Card variant="accent">
          <Text variant="overline" tone="faint">
            Tendencia · media de 7 días
          </Text>
          <View style={styles.filaTendencia}>
            <View style={styles.numeroGrande}>
              <Text variant="display" tone="accent">
                {kg(tendencia.media7)}
              </Text>
              <Text variant="caption" tone="muted" weight="semibold">
                kg
              </Text>
            </View>
            <View style={styles.derecha}>
              {tendencia.cambioSemanalKg != null ? (
                <Text
                  variant="small"
                  weight="bold"
                  tone={tendencia.cambioSemanalKg <= 0 ? 'success' : 'danger'}
                >
                  {`${conSigno(tendencia.cambioSemanalKg, 2)} kg esta semana`}
                </Text>
              ) : (
                <Text variant="small" tone="faint">
                  Comparativa semanal en unos días
                </Text>
              )}
              {/*
                Con modo compasivo se oculta el pesaje suelto y queda solo la
                media, que además es la que dice la verdad. No se pierde señal.
              */}
              {!perfil.modoCompasivo ? (
                <Text variant="small" tone="faint">
                  {`último pesaje ${kg(tendencia.ultimoPeso)} kg`}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>
      ) : tendencia.estado === 'bloqueada' ? (
        <AvisoUmbral
          titulo="Tendencia"
          faltan={tendencia.faltan}
          unidad={['pesaje', 'pesajes']}
          para="calcular tu media de 7 días"
          motivo="Con menos datos, la media diría más sobre lo que cenaste ayer que sobre tu tendencia real."
          contador={{ hechos: tendencia.registrados, total: UMBRAL_TENDENCIA }}
        />
      ) : (
        <Aviso icono="⚖️" titulo="Tendencia">
          {`Aún no has registrado ningún pesaje. El primero te da ${entero(XP.registrarPeso)} XP.`}
        </Aviso>
      )}

      <Card>
        <View style={styles.filaTitulo}>
          <Text variant="overline" tone="faint">
            {pesajeDeHoy ? 'Corregir el peso de hoy' : 'Registrar'}
          </Text>
          {pesajeDeHoy?.hora ? (
            <Text variant="small" tone="faint">{`registrado a las ${pesajeDeHoy.hora}`}</Text>
          ) : null}
        </View>

        <NumberField
          label="Peso"
          value={entrada}
          onChangeText={setEntrada}
          unidad="kg"
          destacado={!perfil.modoCompasivo}
          ayuda={
            perfil.modoCompasivo
              ? 'Con el modo compasivo el número solo aparece aquí, al anotarlo. En el resto de la app queda la tendencia.'
              : undefined
          }
        />

        <Button
          label={pesajeDeHoy ? 'Actualizar' : `Guardar · +${entero(XP.registrarPeso)} XP`}
          onPress={() => void guardar()}
          disabled={!valido}
          loading={guardando}
        />

        {mensaje ? (
          <Text variant="small" tone="accent" center>
            {mensaje}
          </Text>
        ) : null}
      </Card>

      {tendencia.estado === 'lista' ? (
        <Card>
          <View style={styles.filaTitulo}>
            <Text variant="overline" tone="faint">
              Evolución
            </Text>
          </View>
          <SegmentedControl segments={RANGOS} value={rango} onChange={setRango} />
          <GraficaPeso serie={serieVisible} objetivoKg={resumen?.objetivoKg ?? null} />
        </Card>
      ) : null}

      {resumen && !perfil.modoCompasivo ? (
        <View style={styles.tresColumnas}>
          <Card variant="flat" style={styles.columna}>
            <Text variant="overline" tone="faint">
              Inicio
            </Text>
            <Text variant="body" weight="black">
              {kg(resumen.inicialKg)}
            </Text>
          </Card>
          <Card variant="flat" style={styles.columna}>
            <Text variant="overline" tone="faint">
              {resumen.perdidoKg >= 0 ? 'Perdido' : 'Ganado'}
            </Text>
            <Text variant="body" weight="black" tone={resumen.perdidoKg >= 0 ? 'accent' : 'default'}>
              {conSigno(-resumen.perdidoKg)}
            </Text>
          </Card>
          <Card variant="flat" style={styles.columna}>
            <Text variant="overline" tone="faint">
              Restante
            </Text>
            <Text variant="body" weight="black">
              {resumen.restanteKg == null ? '—' : kg(Math.abs(resumen.restanteKg))}
            </Text>
          </Card>
        </View>
      ) : null}

      <Aviso icono="💡">
        Pésate al levantarte, después del baño y antes de desayunar. Si cambias
        las condiciones, el número deja de ser comparable y la tendencia se
        ensucia.
      </Aviso>

      <Card>
        <View style={styles.filaTitulo}>
          <Text variant="overline" tone="faint">
            Cintura
          </Text>
          <Text variant="small" tone="faint">
            una vez por semana
          </Text>
        </View>

        {editandoCintura ? (
          <>
            <NumberField
              label="Perímetro"
              value={entradaCintura}
              onChangeText={setEntradaCintura}
              unidad="cm"
              allowDecimal={false}
              maxLength={3}
              autoFocus
            />
            <Button label="Guardar" size="sm" onPress={() => void guardarCintura()} />
          </>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setEditandoCintura(true)}>
            <View style={styles.filaTendencia}>
              <View style={styles.numeroGrande}>
                <Text variant="displaySm">{cintura ? entero(cintura.valorCm) : '—'}</Text>
                <Text variant="caption" tone="muted" weight="semibold">
                  cm
                </Text>
              </View>
              <Text variant="small" tone="accent" weight="bold">
                {cintura ? 'Actualizar' : 'Añadir'}
              </Text>
            </View>
            {cintura ? (
              <Text variant="small" tone="faint">
                {`Cintura / altura: ${decimal(ratioCinturaAltura(cintura.valorCm, perfil.alturaCm), 2)} · la referencia es mantenerlo por debajo de 0,50`}
              </Text>
            ) : (
              <Text variant="small" tone="faint">
                Mejor señal de grasa visceral que el peso, y no la afecta el
                músculo que ganes.
              </Text>
            )}
          </Pressable>
        )}
      </Card>
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
    tituloBarra: { flex: 1, gap: 2 },
    filaTendencia: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.md,
    },
    numeroGrande: { flexDirection: 'row', alignItems: 'baseline', gap: t.spacing.xs },
    derecha: { alignItems: 'flex-end', gap: t.spacing.xs, flexShrink: 1 },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tresColumnas: { flexDirection: 'row', gap: t.spacing.md },
    columna: { flex: 1, alignItems: 'center' },
  }),
);
