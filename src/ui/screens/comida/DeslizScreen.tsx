import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CANTIDADES_DESLIZ,
  CARAS_EMOCION,
  CATEGORIAS_DESLIZ,
  DISPARADORES,
  type CantidadDesliz,
  type CategoriaDesliz,
  type Disparador,
} from '../../../domain/models/comida';
import type { AnalisisDeslices, EstadoPresupuesto } from '../../../domain/rules/deslices';
import { UMBRAL_PATRONES } from '../../../domain/rules/deslices';
import { XP } from '../../../domain/rules/xp';
import {
  Aviso,
  AvisoUmbral,
  Button,
  Card,
  Chip,
  ChipRow,
  EscalaEmoji,
  Screen,
  SegmentedControl,
  Text,
  TextField,
  type Segment,
} from '../../components';
import { entero } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  presupuesto: EstadoPresupuesto;
  analisis: AnalisisDeslices;
  modoEstricto: boolean;
  guardando: boolean;
  mensaje: string | null;
  onGuardar: (datos: {
    descripcion: string;
    categoria: CategoriaDesliz;
    cantidad: CantidadDesliz;
    sustituyoComida: boolean;
    disparador: Disparador | null;
    emocionDespues: number | null;
    lugar: string | null;
    nota: string | null;
  }) => void;
  onCancelar: () => void;
};

const CANTIDADES: readonly Segment<CantidadDesliz>[] = CANTIDADES_DESLIZ.map((c) => ({
  value: c.valor,
  label: c.etiqueta,
}));

const SUSTITUCION: readonly Segment<'sustituyo' | 'anadido'>[] = [
  { value: 'sustituyo', label: 'Sustituyó una comida' },
  { value: 'anadido', label: 'Fue añadido' },
];

/**
 * Pantalla 14 · Registrar un desliz.
 *
 * Nunca pretendió contar calorías: captura CONTEXTO. Qué lo disparó, dónde,
 * cómo te sentiste después. Eso es lo que permite anticiparse la próxima vez;
 * la cifra de calorías del donut no permite hacer nada.
 *
 * El texto de arriba dice explícitamente que no resta ni rompe rachas, porque
 * es lo que la gente teme al pulsar el botón, y ese miedo es lo que hace que
 * dejen de registrar.
 */
export function DeslizScreen({
  presupuesto,
  analisis,
  modoEstricto,
  guardando,
  mensaje,
  onGuardar,
  onCancelar,
}: Props) {
  const styles = useStyles();

  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDesliz>('dulce');
  const [cantidad, setCantidad] = useState<CantidadDesliz>('racion');
  const [sustitucion, setSustitucion] = useState<'sustituyo' | 'anadido'>('anadido');
  const [disparador, setDisparador] = useState<Disparador | null>(null);
  const [emocion, setEmocion] = useState<number | null>(null);
  const [lugar, setLugar] = useState('');
  const [nota, setNota] = useState('');

  const penalizara = modoEstricto && presupuesto.usados >= presupuesto.presupuesto;

  return (
    <Screen
      header={
        <View style={styles.barra}>
          {/* Volver descarta lo escrito: nada se guarda hasta pulsar Guardar. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver sin guardar"
            onPress={onCancelar}
            hitSlop={12}
          >
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
          <Text variant="title" style={styles.tituloBarra}>
            Anotar desliz
          </Text>
        </View>
      }
      footer={
        <>
          {mensaje ? (
            <Text variant="small" tone="accent" center>
              {mensaje}
            </Text>
          ) : null}
          <Button
            label={`Guardar · +${entero(XP.registrarDesliz)} XP por registrarlo`}
            onPress={() =>
              onGuardar({
                descripcion: descripcion.trim() || 'Desliz',
                categoria,
                cantidad,
                sustituyoComida: sustitucion === 'sustituyo',
                disparador,
                emocionDespues: emocion,
                lugar: lugar.trim() || null,
                nota: nota.trim() || null,
              })
            }
            loading={guardando}
          />
          <Text variant="small" tone="faint" center>
            {`Llevas ${entero(presupuesto.usados)} de ${entero(presupuesto.presupuesto)} deslices de tu presupuesto semanal.`}
          </Text>
        </>
      }
    >
      <Card variant="accent">
        <Text variant="caption" tone="muted">
          Esto <Text weight="bold">no resta XP ni rompe ninguna racha</Text>. Sirve
          para encontrar patrones y anticiparte la próxima vez.
        </Text>
      </Card>

      <Card>
        <TextField
          label="¿Qué has comido?"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Donut de chocolate"
          maxLength={80}
        />
        <ChipRow>
          {CATEGORIAS_DESLIZ.map((c) => (
            <Chip
              key={c.valor}
              label={c.etiqueta}
              selected={categoria === c.valor}
              onPress={() => setCategoria(c.valor)}
            />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          ¿Cuánto?
        </Text>
        <SegmentedControl segments={CANTIDADES} value={cantidad} onChange={setCantidad} />
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          ¿Fue en lugar de una comida?
        </Text>
        <SegmentedControl segments={SUSTITUCION} value={sustitucion} onChange={setSustitucion} />
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          ¿Qué lo disparó?
        </Text>
        <ChipRow>
          {DISPARADORES.map((d) => (
            <Chip
              key={d.valor}
              label={d.etiqueta}
              selected={disparador === d.valor}
              onPress={() => setDisparador(disparador === d.valor ? null : d.valor)}
            />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Text variant="overline" tone="faint">
          ¿Cómo te sientes ahora?
        </Text>
        <EscalaEmoji
          opciones={CARAS_EMOCION}
          valor={emocion}
          onChange={setEmocion}
          etiquetaAccesible="Cómo te sientes"
        />
      </Card>

      <Card>
        <TextField
          label="¿Dónde?"
          value={lugar}
          onChangeText={setLugar}
          placeholder="En la oficina"
          maxLength={40}
        />
        <TextField
          label="Nota"
          value={nota}
          onChangeText={setNota}
          placeholder="Llevaba 3 h sin levantarme…"
          maxLength={140}
        />
      </Card>

      {analisis.estado === 'listo' && analisis.patrones.length > 0 ? (
        <Aviso
          icono="💡"
          titulo={`Patrón, con ${entero(analisis.total)} deslices registrados`}
          puntos={analisis.patrones.map((p) => p.texto)}
        >
          Son relaciones observadas, no causas demostradas.
        </Aviso>
      ) : analisis.estado === 'bloqueado' ? (
        <AvisoUmbral
          titulo="Patrones"
          faltan={analisis.faltan}
          unidad={['desliz registrado', 'deslices registrados']}
          para="poder buscar patrones"
          motivo={`Con menos de ${entero(UMBRAL_PATRONES)}, cualquier patrón sería casualidad.`}
        />
      ) : null}

      {penalizara ? (
        <Aviso icono="⚠️" tono="danger">
          Este supera tu presupuesto semanal y, con el modo estricto activado,
          restará 25 XP aparte. Los 15 por registrarlo los ganas igual: el
          castigo es por el tercer desliz, nunca por contarlo.
        </Aviso>
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
  }),
);
