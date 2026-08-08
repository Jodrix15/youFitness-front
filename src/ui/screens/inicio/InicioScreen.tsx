import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EstadoInicio } from '../../../application/inicio/useInicio';
import { XP } from '../../../domain/rules/xp';
import {
  Anillo,
  BarraComposicion,
  CabeceraInicio,
  Card,
  ListItem,
  Screen,
  Text,
  Tick,
  TiraRacha,
  XpBar,
} from '../../components';
import { diaSemana, entero } from '../../format';
import { makeStyles, useTheme } from '../../theme';
import { PASOS_EJEMPLO } from './datosDeEjemplo';

type Props = {
  nombre: string;
  estado: EstadoInicio;
  onPeso: () => void;
  onCheckin: () => void;
  onComida: () => void;
  onPerfil: () => void;
  /** Abre un día concreto en el historial. */
  onDia: (fecha: string) => void;
  /** Bloque extra al final. Hoy solo lo usan los atajos de desarrollo. */
  pie?: ReactNode;
};

/**
 * Pantalla 06 · Inicio.
 *
 * Los anillos miden cosas contables: comidas registradas, pasos y hábitos
 * cumplidos. De momento son de ejemplo y se marcan como tales — apagados y con
 * una etiqueta que dice de qué bloque dependen. Un dato inventado sin avisar
 * rompería el principio de que lo que se ve siempre es real.
 */
export function InicioScreen({
  nombre,
  estado,
  onPeso,
  onCheckin,
  onComida,
  onPerfil,
  onDia,
  pie,
}: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const {
    nivel,
    proximoRango,
    racha,
    semana,
    xpHoy,
    misiones,
    comidasDeHoy: comidas,
  } = estado;

  return (
    <Screen>
      <CabeceraInicio
        nombre={nombre}
        nivel={nivel.nivel}
        diasDeRacha={racha.actual}
        onPerfil={onPerfil}
        subtitulo={
          racha.actual > 0
            ? `${diaSemana(new Date())} · día ${entero(racha.actual)} de racha`
            : `${diaSemana(new Date())} · registra algo y empieza la racha`
        }
      />

      <XpBar estado={nivel} proximoRango={proximoRango} />

      <View style={styles.bloqueRacha}>
        <TiraRacha dias={semana} onDia={onDia} />
        {!racha.incluyeHoy && racha.actual > 0 ? (
          <Text variant="small" tone="warning">
            Hoy aún no has registrado nada. Tu racha de {entero(racha.actual)} días
            está en juego.
          </Text>
        ) : null}
      </View>

      <Card>
        <View style={styles.filaTitulo}>
          <Text variant="overline" tone="faint">
            Hoy
          </Text>
          <Text variant="small" weight="bold" tone={xpHoy > 0 ? 'accent' : 'faint'}>
            {`${xpHoy > 0 ? '+' : ''}${entero(xpHoy)} XP`}
          </Text>
        </View>

        <View style={styles.anillos}>
          <Anillo
            valor={comidas.principalesRegistradas / 3}
            etiqueta="comidas"
            centro={`${comidas.principalesRegistradas}/3`}
            color={theme.colors.accent}
          />
          <Anillo
            valor={PASOS_EJEMPLO.valor}
            etiqueta={PASOS_EJEMPLO.etiqueta}
            centro={PASOS_EJEMPLO.centro}
            centroSecundario={PASOS_EJEMPLO.centroSecundario}
            color={theme.colors.info}
            ejemplo
          />
        </View>

        <Text variant="small" tone="faint" center>
          Los pasos siguen siendo de ejemplo: leerlos de verdad necesita una
          build nativa.
        </Text>
      </Card>

      <Card>
        <View style={styles.filaTitulo}>
          <Text variant="overline" tone="faint">
            Composición de hoy
          </Text>
          <Text variant="small" tone="faint">
            {comidas.faltan.length === 0 ? 'día completo' : `faltan ${comidas.faltan.length}`}
          </Text>
        </View>
        <View style={styles.composicion}>
          <BarraComposicion
            icono="✋"
            nombre="Proteína"
            detalle={comidas.proteina.detalle}
            valor={comidas.proteina.progreso}
          />
          <BarraComposicion
            icono="✊"
            nombre="Verdura"
            detalle={comidas.verdura.detalle}
            valor={comidas.verdura.progreso}
          />
          <BarraComposicion
            icono="🤲"
            nombre="Hidratos"
            detalle={comidas.hidratos.detalle}
            valor={comidas.hidratos.progreso}
            tono="warning"
          />
        </View>
      </Card>

      {misiones.length > 0 ? (
        <>
          <Text variant="overline" tone="faint">
            Misiones de hoy
          </Text>
          <Card>
            {misiones.map((m) => (
              <ListItem
                key={m.objetivoId}
                titulo={m.nombre}
                subtitulo={m.detalle}
                derecha={
                  <View style={styles.derechaMision}>
                    <Text
                      variant="small"
                      weight="bold"
                      tone={m.estado === 'cumplida' ? 'accent' : 'faint'}
                    >
                      {`+${entero(m.xp)} XP`}
                    </Text>
                    <Tick activo={m.estado === 'cumplida'} />
                  </View>
                }
                style={m.estado === 'no_medible' ? styles.ejemplo : undefined}
              />
            ))}
          </Card>
        </>
      ) : null}

      <Card variant="dashed">
        <Text variant="overline" tone="faint">
          Registrar
        </Text>
        <ListItem
          icono="🍽️"
          titulo="Comida"
          subtitulo={
            comidas.faltan.length === 0
              ? 'Las tres comidas registradas'
              : `Falta registrar ${comidas.faltan.length}`
          }
          onPress={onComida}
          derecha={<Tick activo={comidas.faltan.length === 0} />}
        />
        <ListItem
          icono="⚖️"
          titulo="Peso"
          subtitulo={estado.pesajeRegistradoHoy ? 'Ya registrado hoy' : 'Aún no lo has hecho hoy'}
          onPress={onPeso}
          derecha={<Tick activo={estado.pesajeRegistradoHoy} />}
        />
        <ListItem
          icono="🧠"
          titulo="Cerrar el día"
          subtitulo={
            estado.checkinCerradoHoy
              ? 'Ya cerrado hoy'
              : `Ánimo, energía y sueño · +${entero(XP.cerrarDia)} XP`
          }
          onPress={onCheckin}
          derecha={<Tick activo={estado.checkinCerradoHoy} />}
        />
      </Card>

      {/* Rosa, no dorado: el dorado es para avisos, el rosa para deslices. */}
      <Card variant="danger">
        <ListItem
          icono="🍩"
          titulo="¿Se te ha escapado algo?"
          subtitulo="Registrarlo también da XP. Sin culpa, solo datos."
          onPress={onComida}
          derecha={
            <Text variant="small" weight="bold" tone="danger">
              Anotar →
            </Text>
          }
        />
      </Card>

      {pie}
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    bloqueRacha: { gap: t.spacing.sm },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    anillos: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      marginTop: t.spacing.sm,
    },
    composicion: { gap: t.spacing.md, marginTop: t.spacing.xs },
    ejemplo: { opacity: 0.5 },
    derechaMision: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    filaDesliz: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' },
    iconoDesliz: { fontSize: 20, lineHeight: 26 },
    textoDesliz: { flex: 1, gap: 2 },
  }),
);
