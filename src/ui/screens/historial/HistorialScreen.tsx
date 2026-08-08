import { Pressable, StyleSheet, View } from 'react-native';

import { CARAS_ANIMO } from '../../../domain/models/checkin';
import { TIPOS_COMIDA } from '../../../domain/models/comida';
import type {
  EstadoHistorial,
  FiltroTema,
  NivelZoom,
} from '../../../application/historial/useHistorial';
import { ETIQUETA_SEMAFORO, type EstadoTema } from '../../../domain/rules/temas';
import { colorSemaforo, colorSemaforoSolido } from './semaforo';
import {
  BarraComposicion,
  CalendarioMes,
  Card,
  InsigniasPorciones,
  ListItem,
  MapaCalor,
  Screen,
  SegmentedControl,
  Text,
  type Segment,
} from '../../components';
import { conSigno, entero, fechaLarga, kg, mesYAnio } from '../../format';
import { makeStyles, useTheme } from '../../theme';

const NIVELES: readonly Segment<NivelZoom>[] = [
  { value: 'dia', label: 'Día' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
  { value: 'todo', label: 'Todo' },
];

const TEMAS: readonly Segment<FiltroTema>[] = [
  { value: 'ambos', label: 'Ambos' },
  { value: 'comidas', label: 'Comidas' },
  { value: 'entrenos', label: 'Entrenos' },
];

type Props = {
  estado: EstadoHistorial;
};

/**
 * Pantallas 31 a 34 · Historial.
 *
 * Cuatro niveles de zoom sobre lo mismo, y se puede bajar de uno a otro: del
 * resumen de tu vida a un martes de hace tres años.
 *
 * NADA SE ARCHIVA (principio 4): no hay «últimos N días» ni datos comprimidos
 * por antigüedad. Un día de 2024 se ve con el mismo detalle que el de ayer.
 */
export function HistorialScreen({ estado }: Props) {
  const styles = useStyles();

  return (
    <Screen>
      <View style={styles.cabecera}>
        <Text variant="displaySm">Historial</Text>
      </View>

      <SegmentedControl segments={NIVELES} value={estado.nivel} onChange={estado.irA} />

      {estado.nivel !== 'todo' ? (
        <View style={styles.filtro}>
          <SegmentedControl segments={TEMAS} value={estado.tema} onChange={estado.cambiarTema} />
          <Leyenda tema={estado.tema} />
        </View>
      ) : null}

      {estado.nivel === 'dia' ? <VistaDia estado={estado} /> : null}
      {estado.nivel === 'mes' ? <VistaMes estado={estado} /> : null}
      {estado.nivel === 'anio' ? <VistaAnio estado={estado} /> : null}
      {estado.nivel === 'todo' ? <VistaTodo estado={estado} /> : null}
    </Screen>
  );
}

/**
 * Leyenda del semáforo.
 *
 * Con un solo tema no existe el amarillo: el amarillo significa «uno de los dos
 * temas», así que filtrando solo puede estar limpio o con desliz.
 */
function Leyenda({ tema }: { tema: FiltroTema }) {
  const styles = useStyles();
  const theme = useTheme();

  const entradas =
    tema === 'ambos'
      ? ([
          ['verde', 'sin deslices'],
          ['amarillo', 'un tema'],
          ['rojo', 'los dos'],
        ] as const)
      : ([
          ['verde', 'limpio'],
          ['rojo', 'con desliz'],
        ] as const);

  return (
    <View style={styles.leyenda}>
      {entradas.map(([clave, etiqueta]) => (
        <View key={clave} style={styles.leyendaItem}>
          <View style={[styles.punto, { backgroundColor: colorSemaforoSolido(clave, theme) }]} />
          <Text variant="small" tone="faint">
            {etiqueta}
          </Text>
        </View>
      ))}
      <View style={styles.leyendaItem}>
        <View style={[styles.punto, { backgroundColor: theme.colors.surfaceHigh }]} />
        <Text variant="small" tone="faint">
          sin datos
        </Text>
      </View>
    </View>
  );
}

/** Fila con el estado de un tema en la vista de día. */
function FilaTema({ nombre, icono, estado }: { nombre: string; icono: string; estado: EstadoTema }) {
  const theme = useTheme();

  const color =
    estado.estado === 'limpio'
      ? theme.colors.success
      : estado.estado === 'desliz'
        ? theme.colors.danger
        : theme.colors.textFaint;

  return (
    <ListItem
      icono={icono}
      titulo={nombre}
      subtitulo={
        estado.estado === 'limpio'
          ? 'Sin deslices'
          : estado.estado === 'desliz'
            ? estado.motivo
            : 'Sin datos ese día'
      }
      derecha={
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      }
    />
  );
}

// ── Día ────────────────────────────────────────────────────────────────────

function VistaDia({ estado }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const { dia, temasDelDia } = estado;

  return (
    <>
      <View style={styles.filaTitulo}>
        <Text variant="label">{fechaLarga(new Date(dia.fecha))}</Text>
        {dia.editado ? (
          <Text variant="small" tone="faint">
            editado
          </Text>
        ) : null}
      </View>

      <Card style={{ borderColor: colorSemaforoSolido(temasDelDia.semaforo, theme) }}>
        <Text variant="overline" tone="faint">
          {ETIQUETA_SEMAFORO[temasDelDia.semaforo]}
        </Text>
        <FilaTema nombre="Comidas" icono="🍽️" estado={temasDelDia.comidas} />
        <FilaTema nombre="Entrenos" icono="🏋️" estado={temasDelDia.entrenos} />
      </Card>

      {!dia.tieneAlgo ? (
        <Card variant="dashed">
          <Text variant="caption" tone="muted">
            Ese día no registraste nada.
          </Text>
          <Text variant="small" tone="faint">
            No pasa nada: la app no borra rachas por un día suelto ni te lo va a
            recordar cada vez que abras el historial.
          </Text>
        </Card>
      ) : (
        <Card variant="xp">
          <Text variant="overline" tone="faint">
            XP del día
          </Text>
          <Text variant="display" tone="xp">
            {`${dia.xp > 0 ? '+' : ''}${entero(dia.xp)}`}
          </Text>
        </Card>
      )}

      {dia.pesaje ? (
        <Card>
          <Text variant="overline" tone="faint">
            Peso
          </Text>
          <Text variant="displaySm">{`${kg(dia.pesaje.pesoKg)} kg`}</Text>
          {dia.pesaje.hora ? (
            <Text variant="small" tone="faint">
              {`a las ${dia.pesaje.hora}`}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {dia.comidas.comidas.length > 0 ? (
        <Card>
          <View style={styles.filaTitulo}>
            <Text variant="overline" tone="faint">
              Comida
            </Text>
            <Text variant="small" tone="faint">
              {`${entero(dia.comidas.principalesRegistradas)} de 3`}
            </Text>
          </View>

          <BarraComposicion
            icono="✋"
            nombre="Proteína"
            detalle={dia.comidas.proteina.detalle}
            valor={dia.comidas.proteina.progreso}
          />
          <BarraComposicion
            icono="✊"
            nombre="Verdura"
            detalle={dia.comidas.verdura.detalle}
            valor={dia.comidas.verdura.progreso}
          />

          <View style={styles.separador} />

          {dia.comidas.comidas.map((c) => (
            <View key={c.id} style={styles.comida}>
              <Text variant="small" tone={c.esDesliz ? 'danger' : 'muted'}>
                {`${TIPOS_COMIDA.find((t) => t.valor === c.tipo)?.etiqueta ?? c.tipo}${c.hora ? ` · ${c.hora}` : ''}${c.esDesliz ? ' · desliz' : ''}`}
              </Text>
              <Text variant="caption" weight="bold">
                {c.descripcion}
              </Text>
              <InsigniasPorciones comida={c} />
            </View>
          ))}
        </Card>
      ) : null}

      {dia.sesiones.map((s) => (
        <Card key={s.id}>
          <Text variant="overline" tone="faint">
            Entreno
          </Text>
          <Text variant="caption" weight="bold">
            {s.nombre}
          </Text>
          <Text variant="small" tone="faint">
            {`${entero(s.series.length)} series · ${kg(s.volumenTotal, 0)} kg${s.esfuerzoPercibido ? ` · esfuerzo ${entero(s.esfuerzoPercibido)}/10` : ''}`}
          </Text>
          {s.series.some((x) => x.esPr) ? (
            <Text variant="small" weight="bold" tone="warning">
              {`🏆 ${entero(s.series.filter((x) => x.esPr).length)} récord${s.series.filter((x) => x.esPr).length === 1 ? '' : 's'}`}
            </Text>
          ) : null}
        </Card>
      ))}

      {dia.checkin ? (
        <Card>
          <Text variant="overline" tone="faint">
            Cierre del día
          </Text>
          <Text variant="caption">
            {`${CARAS_ANIMO[dia.checkin.animo - 1] ?? ''}  energía ${entero(dia.checkin.energia)}/10 · estrés ${entero(dia.checkin.estres)}/10`}
          </Text>
          {dia.checkin.suenoHoras != null ? (
            <Text variant="small" tone="faint">
              {`Durmió ${kg(dia.checkin.suenoHoras, 1)} h${dia.checkin.horaAcostarse ? ` · se acostó a las ${dia.checkin.horaAcostarse}` : ''}`}
            </Text>
          ) : null}
          {dia.checkin.nota ? (
            <Text variant="small" tone="muted">
              {`«${dia.checkin.nota}»`}
            </Text>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}

// ── Mes ────────────────────────────────────────────────────────────────────

function VistaMes({ estado }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const { mes } = estado;
  const primerDia = `${mes.anio}-${String(mes.mes).padStart(2, '0')}-01`;
  const colores = estado.contarColores(mes.dias.map((d) => d.fecha));

  return (
    <>
      <Text variant="label">
        {mesYAnio(new Date(mes.anio, mes.mes - 1, 1)).replace(/^./, (c) => c.toUpperCase())}
      </Text>

      <Card>
        <CalendarioMes
          seleccionada={estado.fecha}
          hoy={new Date().toISOString().slice(0, 10)}
          conDatos={estado.fechasConDatos}
          mesVisible={primerDia}
          onCambiarMes={(f) => {
            const [a, m] = f.split('-').map(Number);
            estado.cambiarMes(a ?? mes.anio, m ?? mes.mes);
          }}
          onSeleccionar={estado.verDia}
          colorDe={(f) => colorSemaforo(estado.semaforoDe(f))}
        />
        <Text variant="small" tone="faint">
          Toca un día para verlo entero. Hacia atrás no hay límite.
        </Text>
      </Card>

      <View style={styles.tresColumnas}>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="success">
            Limpios
          </Text>
          <Text variant="body" weight="black" tone="success">
            {entero(colores.verde)}
          </Text>
        </Card>
        {estado.tema === 'ambos' ? (
          <Card variant="flat" style={styles.columna}>
            <Text variant="overline" tone="warning">
              Un tema
            </Text>
            <Text variant="body" weight="black" tone="warning">
              {entero(colores.amarillo)}
            </Text>
          </Card>
        ) : null}
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="danger">
            {estado.tema === 'ambos' ? 'Los dos' : 'Con desliz'}
          </Text>
          <Text variant="body" weight="black" tone="danger">
            {entero(colores.rojo)}
          </Text>
        </Card>
      </View>

      <View style={styles.tresColumnas}>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            Días
          </Text>
          <Text variant="body" weight="black">
            {`${entero(mes.diasConRegistro)}/${entero(mes.diasDelMes)}`}
          </Text>
        </Card>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            XP
          </Text>
          <Text variant="body" weight="black" tone="xp">
            {entero(mes.xpTotal)}
          </Text>
        </Card>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            Entrenos
          </Text>
          <Text variant="body" weight="black">
            {entero(mes.sesiones)}
          </Text>
        </Card>
      </View>

      <Card variant="flat">
        <ListItem titulo="Pesajes" derecha={<Text weight="bold">{entero(mes.pesajes)}</Text>} />
        {mes.pesoMedio != null ? (
          <ListItem
            titulo="Peso medio del mes"
            derecha={<Text weight="bold">{`${kg(mes.pesoMedio)} kg`}</Text>}
          />
        ) : null}
        <ListItem titulo="Comidas" derecha={<Text weight="bold">{entero(mes.comidas)}</Text>} />
        <ListItem titulo="Check-ins" derecha={<Text weight="bold">{entero(mes.checkins)}</Text>} />
        {mes.volumenKg > 0 ? (
          <ListItem
            titulo="Volumen levantado"
            derecha={<Text weight="bold">{`${kg(mes.volumenKg, 0)} kg`}</Text>}
          />
        ) : null}
      </Card>
    </>
  );
}

// ── Año ────────────────────────────────────────────────────────────────────

function VistaAnio({ estado }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const { anio } = estado;
  const colores = estado.contarColores(anio.dias.map((d) => d.fecha));

  return (
    <>
      <View style={styles.filaTitulo}>
        <Pressable accessibilityRole="button" onPress={() => estado.cambiarAnio(anio.anio - 1)} hitSlop={10}>
          <Text variant="label" tone="accent">
            ‹
          </Text>
        </Pressable>
        <Text variant="label">{entero(anio.anio)}</Text>
        <Pressable accessibilityRole="button" onPress={() => estado.cambiarAnio(anio.anio + 1)} hitSlop={10}>
          <Text variant="label" tone="accent">
            ›
          </Text>
        </Pressable>
      </View>

      <Card>
        <Text variant="overline" tone="faint">
          {`${entero(anio.diasConRegistro)} días con registro`}
        </Text>
        <MapaCalor
          dias={anio.dias}
          onDia={estado.verDia}
          colorDe={(f) => {
            const s = estado.semaforoDe(f);
            return s === 'sin_datos' ? undefined : colorSemaforoSolido(s, theme);
          }}
          leyenda={
            estado.tema === 'ambos'
              ? [
                  { color: colorSemaforoSolido('verde', theme), etiqueta: 'limpio' },
                  { color: colorSemaforoSolido('amarillo', theme), etiqueta: 'un tema' },
                  { color: colorSemaforoSolido('rojo', theme), etiqueta: 'los dos' },
                  { color: theme.colors.surfaceHigh, etiqueta: 'sin datos' },
                ]
              : [
                  { color: colorSemaforoSolido('verde', theme), etiqueta: 'limpio' },
                  { color: colorSemaforoSolido('rojo', theme), etiqueta: 'con desliz' },
                  { color: theme.colors.surfaceHigh, etiqueta: 'sin datos' },
                ]
          }
        />
        <Text variant="small" tone="faint">
          {`${entero(colores.verde)} días limpios${estado.tema === 'ambos' ? `, ${entero(colores.amarillo)} con un tema` : ''} y ${entero(colores.rojo)} ${estado.tema === 'ambos' ? 'con los dos' : 'con desliz'}. Toca un día para verlo.`}
        </Text>
      </Card>

      <View style={styles.tresColumnas}>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            XP
          </Text>
          <Text variant="body" weight="black" tone="xp">
            {entero(anio.xpTotal)}
          </Text>
        </Card>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            Entrenos
          </Text>
          <Text variant="body" weight="black">
            {entero(anio.sesiones)}
          </Text>
        </Card>
        <Card variant="flat" style={styles.columna}>
          <Text variant="overline" tone="faint">
            Pesajes
          </Text>
          <Text variant="body" weight="black">
            {entero(anio.pesajes)}
          </Text>
        </Card>
      </View>

      <Text variant="overline" tone="faint">
        Mes a mes
      </Text>
      <Card variant="flat">
        {anio.meses.map((m) => (
          <ListItem
            key={m.mes}
            titulo={mesYAnio(new Date(m.anio, m.mes - 1, 1)).split(' ')[0] ?? ''}
            subtitulo={
              m.diasConRegistro > 0
                ? `${entero(m.diasConRegistro)} días · ${entero(m.sesiones)} entrenos`
                : 'sin registros'
            }
            onPress={m.diasConRegistro > 0 ? () => estado.cambiarMes(m.anio, m.mes) : undefined}
            derecha={
              <Text variant="small" weight="bold" tone={m.xpTotal > 0 ? 'xp' : 'faint'}>
                {`${entero(m.xpTotal)} XP`}
              </Text>
            }
          />
        ))}
      </Card>
    </>
  );
}

// ── Todo ───────────────────────────────────────────────────────────────────

function VistaTodo({ estado }: Props) {
  const styles = useStyles();
  const { todo } = estado;

  if (todo.diasRegistrados === 0) {
    return (
      <Card variant="dashed">
        <Text variant="caption" tone="muted">
          Aún no hay historial. En cuanto registres algo, esto se llena solo.
        </Text>
      </Card>
    );
  }

  return (
    <>
      <Card variant="accent">
        <Text variant="overline" tone="faint">
          Desde el principio
        </Text>
        <Text variant="display" tone="accent">
          {entero(todo.diasRegistrados)}
        </Text>
        <Text variant="caption" tone="muted">
          {`días con algún registro, desde el ${todo.primerRegistro ? fechaLarga(new Date(todo.primerRegistro)) : ''}`}
        </Text>
      </Card>

      <Card variant="flat">
        <ListItem
          titulo="XP acumulado"
          derecha={<Text weight="bold">{`${entero(todo.xpTotal)} XP`}</Text>}
        />
        <ListItem titulo="Pesajes" derecha={<Text weight="bold">{entero(todo.pesajes)}</Text>} />
        {todo.cambioDePesoKg != null ? (
          <ListItem
            titulo="Cambio de peso"
            subtitulo="Entre el primer pesaje y el último"
            derecha={
              <Text weight="bold" tone={todo.cambioDePesoKg <= 0 ? 'success' : 'default'}>
                {`${conSigno(todo.cambioDePesoKg)} kg`}
              </Text>
            }
          />
        ) : null}
        <ListItem titulo="Comidas" derecha={<Text weight="bold">{entero(todo.comidas)}</Text>} />
        <ListItem
          titulo="Deslices registrados"
          subtitulo="Cada uno sumó XP por anotarlo"
          derecha={<Text weight="bold">{entero(todo.deslices)}</Text>}
        />
        <ListItem titulo="Entrenos" derecha={<Text weight="bold">{entero(todo.sesiones)}</Text>} />
        <ListItem titulo="Series" derecha={<Text weight="bold">{entero(todo.seriesTotales)}</Text>} />
        {todo.volumenKg > 0 ? (
          <ListItem
            titulo="Kilos movidos"
            derecha={<Text weight="bold">{`${kg(todo.volumenKg, 0)} kg`}</Text>}
          />
        ) : null}
        <ListItem titulo="Días cerrados" derecha={<Text weight="bold">{entero(todo.checkins)}</Text>} />
      </Card>

      <Text variant="overline" tone="faint">
        Por años
      </Text>
      <Card variant="flat">
        {todo.anios.map((a) => (
          <ListItem
            key={a}
            titulo={entero(a)}
            onPress={() => estado.cambiarAnio(a)}
            derecha={
              <Text variant="small" tone="accent" weight="bold">
                Ver →
              </Text>
            }
          />
        ))}
      </Card>

      <Card variant="flat">
        <Text variant="small" tone="faint">
          Nada de esto se archiva ni se comprime con el tiempo. Un día de hace
          tres años se ve con el mismo detalle que el de ayer.
        </Text>
      </Card>
    </>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    cabecera: { gap: t.spacing.xs },
    filtro: { gap: t.spacing.sm },
    leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
    leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
    punto: { width: 8, height: 8, borderRadius: 4 },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    separador: { height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.xs },
    comida: { gap: 2, paddingVertical: t.spacing.xs },
    tresColumnas: { flexDirection: 'row', gap: t.spacing.md },
    columna: { flex: 1, alignItems: 'center' },
  }),
);
