import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CANTIDADES_DESLIZ,
  CARAS_EMOCION,
  CATEGORIAS_DESLIZ,
  COMIDAS_PRINCIPALES,
  DISPARADORES,
  TIPOS_COMIDA,
  type CantidadDesliz,
  type CategoriaDesliz,
  type Comida,
  type DeslizDetalle,
  type Disparador,
  type TipoComida,
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
  DiaDeRegistro,
  EscalaEmoji,
  ListItem,
  Screen,
  SegmentedControl,
  Text,
  TextField,
  type Segment,
} from '../../components';
import { entero } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  /** Día en el que se va a guardar. Lo hereda del diario, no es siempre hoy. */
  fecha: string;
  hoy: string;
  /** Desliz que se está corrigiendo, con su detalle. `null` para uno nuevo. */
  edicion?: { comida: Comida; detalle: DeslizDetalle | null } | null;
  presupuesto: EstadoPresupuesto;
  analisis: AnalisisDeslices;
  modoEstricto: boolean;
  guardando: boolean;
  mensaje: string | null;
  onBorrar?: () => void;
  onGuardar: (datos: {
    descripcion: string;
    tipo: TipoComida;
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

/** El snack se llama «Extra» aquí: describe mejor lo que es fuera de horario. */
const ETIQUETA_TIPO: Record<TipoComida, string> = {
  desayuno: '🌅 Desayuno',
  comida: '🍽️ Comida',
  cena: '🌙 Cena',
  snack: '🥨 Extra',
};

/**
 * Pantalla 14 · Registrar un desliz.
 *
 * Nunca pretendió contar calorías: captura CONTEXTO. Qué lo disparó, dónde,
 * cómo te sentiste después. Eso es lo que permite anticiparse la próxima vez;
 * la cifra de calorías del donut no permite hacer nada.
 *
 * Lo primero que se pregunta es EN QUÉ COMIDA fue. Un desliz no es siempre un
 * extra entre horas: el donut puede ser el desayuno y la pizza, la cena. Darlo
 * todo por snack hacía que la app te dijera que faltaba la cena que acabas de
 * anotar, y escondía el dato más accionable de todos — si se te escapan por la
 * mañana, el arreglo es el desayuno; si es de noche, el arreglo es otro.
 *
 * El texto de arriba dice explícitamente que no resta ni rompe rachas, porque
 * es lo que la gente teme al pulsar el botón, y ese miedo es lo que hace que
 * dejen de registrar.
 */
export function DeslizScreen({
  fecha,
  hoy,
  edicion = null,
  presupuesto,
  analisis,
  modoEstricto,
  guardando,
  mensaje,
  onBorrar,
  onGuardar,
  onCancelar,
}: Props) {
  const styles = useStyles();
  const d = edicion?.detalle ?? null;

  const [descripcion, setDescripcion] = useState(edicion?.comida.descripcion ?? '');
  const [tipo, setTipo] = useState<TipoComida>(edicion?.comida.tipo ?? 'snack');
  const [categoria, setCategoria] = useState<CategoriaDesliz>(d?.categoria ?? 'dulce');
  const [cantidad, setCantidad] = useState<CantidadDesliz>(d?.cantidad ?? 'racion');
  const [sustitucion, setSustitucion] = useState<'sustituyo' | 'anadido'>(
    d?.sustituyoComida ? 'sustituyo' : 'anadido',
  );
  const [disparador, setDisparador] = useState<Disparador | null>(d?.disparador ?? null);
  const [emocion, setEmocion] = useState<number | null>(d?.emocionDespues ?? null);
  const [lugar, setLugar] = useState(d?.lugar ?? '');
  const [nota, setNota] = useState(d?.nota ?? '');

  const penalizara = modoEstricto && presupuesto.usados >= presupuesto.presupuesto;

  // Si el desliz ES la comida, la pregunta de «¿sustituyó a una comida?» ya está
  // contestada. Preguntarlo dos veces solo invita a contestarse a uno mismo.
  const esPrincipal = COMIDAS_PRINCIPALES.includes(tipo);

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
          <View style={styles.tituloBarra}>
            <Text variant="title">{edicion ? 'Corregir desliz' : 'Anotar desliz'}</Text>
            <DiaDeRegistro fecha={fecha} hoy={hoy} />
          </View>
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
            label={
              edicion
                ? 'Guardar cambios'
                : `Guardar · +${entero(XP.registrarDesliz)} XP por registrarlo`
            }
            onPress={() =>
              onGuardar({
                descripcion: descripcion.trim() || 'Desliz',
                tipo,
                categoria,
                cantidad,
                sustituyoComida: esPrincipal ? true : sustitucion === 'sustituyo',
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
      {edicion ? null : (
        <Card variant="accent">
          <Text variant="caption" tone="muted">
            Esto <Text weight="bold">no resta XP ni rompe ninguna racha</Text>. Sirve
            para encontrar patrones y anticiparte la próxima vez.
          </Text>
        </Card>
      )}

      <Card>
        <Text variant="overline" tone="faint">
          ¿Qué comida ha sido?
        </Text>
        <ChipRow>
          {TIPOS_COMIDA.map((t) => (
            <Chip
              key={t.valor}
              label={ETIQUETA_TIPO[t.valor]}
              selected={tipo === t.valor}
              onPress={() => setTipo(t.valor)}
            />
          ))}
        </ChipRow>
        <Text variant="small" tone="faint">
          {esPrincipal
            ? 'Cuenta como esa comida del día: no te va a decir que falta. Las raciones se quedan a cero, que es lo que pasó.'
            : 'Un extra fuera de las tres comidas. No ocupa el sitio de ninguna.'}
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

      {!esPrincipal ? (
        <Card>
          <Text variant="overline" tone="faint">
            ¿Fue en lugar de una comida?
          </Text>
          <SegmentedControl segments={SUSTITUCION} value={sustitucion} onChange={setSustitucion} />
        </Card>
      ) : null}

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

      {edicion && onBorrar ? (
        <Card variant="dashed">
          <ListItem
            icono="🗑️"
            titulo="Eliminar este desliz"
            subtitulo="Desaparece del diario. El XP que dio se queda: no se devuelve."
            onPress={onBorrar}
            derecha={
              <Text variant="small" tone="danger" weight="bold">
                Borrar
              </Text>
            }
          />
        </Card>
      ) : null}

      {!edicion && penalizara ? (
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
    tituloBarra: { flex: 1, gap: 2 },
  }),
);
