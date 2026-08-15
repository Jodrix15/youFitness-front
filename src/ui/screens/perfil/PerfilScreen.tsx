import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ETIQUETA_XP } from '../../../domain/models/xp';
import type { EstadoPerfil } from '../../../application/perfil/usePerfilCompleto';
import { NIVELES, XP } from '../../../domain/rules/xp';
import {
  Avatar,
  BotonIcono,
  Card,
  ListItem,
  ProgressBar,
  Screen,
  Text,
  Tick,
} from '../../components';
import { conSigno, entero, kg } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  estado: EstadoPerfil;
  /** El engranaje de la cabecera. Ajustes solo se abre desde aquí. */
  onAjustes: () => void;
  onHistorial: () => void;
  onAtras: () => void;
};

/**
 * Pantalla 36 · Perfil. La pantalla trofeo.
 *
 * Estructura calcada del mockup: tarjeta de rango centrada, cuatro cifras de por
 * vida, y una lista de accesos. Ajustes se abre desde el engranaje de la
 * cabecera, no desde Inicio.
 *
 * Todo es DERIVADO: rango, racha, totales y desglose de XP salen de los mismos
 * datos que el resto de la app, así que ninguna cifra puede contradecir a otra
 * pantalla.
 *
 * Las filas de funciones que no existen se muestran apagadas y con el motivo, en
 * lugar de llevar a una pantalla vacía.
 */
export function PerfilScreen({ estado, onAjustes, onHistorial, onAtras }: Props) {
  const styles = useStyles();
  const { perfil, nivel, proximoRango, racha, totales, origenes, xpPerdido, multiplicador } = estado;

  // Las dos secciones que el mockup pone como pantallas aparte se despliegan
  // aquí: así se conserva la lista sin crear enlaces que no llevan a nada.
  const [verRangos, setVerRangos] = useState(false);
  const [verXp, setVerXp] = useState(false);

  if (!perfil) return null;

  const rangos = NIVELES.filter((n, i) => i === 0 || NIVELES[i - 1]!.rango !== n.rango);

  const pesoMovido =
    totales.volumenKg >= 1000
      ? `${kg(totales.volumenKg / 1000, 1)} t`
      : `${kg(totales.volumenKg, 0)} kg`;

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
            Perfil
          </Text>
          <BotonIcono icono="⚙️" etiqueta="Ajustes" onPress={onAjustes} />
        </View>
      }
    >
      {/* ── Tarjeta de rango ──────────────────────────────────────────── */}

      <Card variant="xp" style={styles.trofeo}>
        <Avatar emoji="🦾" size={78} nivel={nivel.nivel} />

        <Text variant="title" center>
          {perfil.nombre}
        </Text>
        <Text variant="small" weight="bold" tone="xp" center>
          {`${nivel.icono} ${nivel.rango}`}
        </Text>

        <ProgressBar value={nivel.progreso} tone="xp" destacada style={styles.barra100} />

        {/* Dentro del nivel, no de por vida: la barra de arriba mide esto. */}
        <Text variant="small" tone="faint" center>
          {nivel.xpParaSubir == null
            ? `${entero(nivel.xpTotal)} XP · nivel máximo`
            : `${entero(nivel.xpEnNivel)} / ${entero(nivel.xpParaSubir)} XP para el nivel ${nivel.nivel + 1}`}
        </Text>

        <Text variant="small" tone="faint" center>
          {proximoRango
            ? `${entero(proximoRango.xpRestante)} XP más para ${proximoRango.rango} · ${entero(nivel.xpTotal)} XP de por vida`
            : `${entero(nivel.xpTotal)} XP de por vida · rango máximo`}
        </Text>

        <View style={styles.chapas}>
          {racha.actual > 0 ? (
            <View style={[styles.chapa, styles.chapaOro]}>
              <Text variant="small" weight="bold" tone="warning">
                {`🔥 ${entero(racha.actual)} días`}
              </Text>
            </View>
          ) : null}
          <View style={[styles.chapa, styles.chapaXp]}>
            <Text variant="small" weight="bold" tone="xp">
              {`⚡ ×${multiplicador.toFixed(1).replace('.', ',')}`}
            </Text>
          </View>
          <View style={[styles.chapa, styles.chapaAcc]}>
            <Text variant="small" weight="bold" tone="accent">
              {`🗓️ ${entero(totales.diasRegistrados)} días`}
            </Text>
          </View>
        </View>
      </Card>

      {/* ── Cuatro cifras ─────────────────────────────────────────────── */}

      <View style={styles.rejilla}>
        <Cifra titulo="Días activo" valor={entero(totales.diasRegistrados)} />
        <Cifra titulo="Registros" valor={entero(totales.registrosTotales)} />
        <Cifra titulo="Entrenos" valor={entero(totales.sesiones)} />
        <Cifra titulo="Peso movido" valor={pesoMovido} />
      </View>

      {/* ── Accesos ───────────────────────────────────────────────────── */}

      <Card>
        <ListItem
          icono={nivel.icono}
          titulo="Rangos y niveles"
          subtitulo="Ver el camino completo"
          onPress={() => setVerRangos((v) => !v)}
          derecha={
            <Text variant="caption" tone="accent">
              {verRangos ? '⌄' : '›'}
            </Text>
          }
        />

        {verRangos ? (
          <View style={styles.desplegable}>
            {rangos.map((r) => {
              const alcanzado = nivel.xpTotal >= r.xpMinimo;
              const esActual = r.rango === nivel.rango;
              return (
                <ListItem
                  key={r.rango}
                  icono={r.icono}
                  titulo={r.rango}
                  subtitulo={
                    esActual ? 'Estás aquí' : alcanzado ? 'Superado' : `a partir de ${entero(r.xpMinimo)} XP`
                  }
                  style={alcanzado ? undefined : styles.apagado}
                  derecha={<Tick activo={alcanzado} />}
                />
              );
            })}
            <Text variant="small" tone="faint">
              El nivel puede bajar: si el XP cae por debajo del umbral, se pierde
              el rango. Es lo que hace que subir signifique algo.
            </Text>
          </View>
        ) : null}

        <ListItem
          icono="⚡"
          titulo="Cómo funciona el XP"
          subtitulo="De dónde sale el tuyo, y cuánto vale cada cosa"
          onPress={() => setVerXp((v) => !v)}
          derecha={
            <Text variant="caption" tone="accent">
              {verXp ? '⌄' : '›'}
            </Text>
          }
        />

        {verXp ? (
          <View style={styles.desplegable}>
            {origenes.length === 0 ? (
              <Text variant="small" tone="faint">
                Todavía no has ganado XP. En cuanto registres algo, aquí verás de
                dónde sale cada punto.
              </Text>
            ) : (
              origenes.map((o) => (
                <View key={o.tipo} style={styles.origen}>
                  <View style={styles.filaTitulo}>
                    <Text variant="small">{ETIQUETA_XP[o.tipo]}</Text>
                    <Text variant="small" weight="bold" tone="xp">
                      {`${entero(o.xp)} XP`}
                    </Text>
                  </View>
                  <ProgressBar value={o.porcentaje} tone="xp" />
                </View>
              ))
            )}

            {xpPerdido < 0 ? (
              <ListItem
                titulo="Perdido por penalizaciones"
                subtitulo="Solo con el modo estricto activado"
                derecha={
                  <Text variant="small" weight="bold" tone="danger">
                    {`${entero(xpPerdido)} XP`}
                  </Text>
                }
              />
            ) : null}

            <View style={styles.tarifa}>
              <Text variant="overline" tone="faint">
                Lo que vale cada acción
              </Text>
              {[
                ['Registrar el peso', XP.registrarPeso],
                ['Registrar una comida', XP.registrarComida],
                ['Registrar un desliz', XP.registrarDesliz],
                ['Cerrar el día', XP.cerrarDia],
                ['Completar un entreno', XP.completarEntreno],
                ['Cada serie', XP.serieRegistrada],
                ['Récord personal', XP.recordPersonal],
                ['Subir de escalón', XP.subirEscalon],
              ].map(([nombre, valor]) => (
                <View key={String(nombre)} style={styles.filaTitulo}>
                  <Text variant="small" tone="muted">
                    {nombre}
                  </Text>
                  <Text variant="small" weight="bold">
                    {`+${kg(Number(valor), Number(valor) % 1 === 0 ? 0 : 1)}`}
                  </Text>
                </View>
              ))}
              <Text variant="small" tone="faint">
                La racha multiplica lo que suma —hasta ×1,5 a los 30 días— y nunca
                lo que resta. Y ningún acto de registrar resta XP jamás.
              </Text>
            </View>
          </View>
        ) : null}

        <ListItem
          icono="🗓️"
          titulo="Toda mi historia"
          subtitulo={
            totales.primerRegistro
              ? `desde el ${totales.primerRegistro} · ${entero(totales.registrosTotales)} registros`
              : 'sin registros todavía'
          }
          onPress={onHistorial}
          derecha={
            <Text variant="caption" tone="accent">
              ›
            </Text>
          }
        />

        <ListItem
          icono="☁️"
          titulo="Copia de seguridad"
          subtitulo={
            estado.ultimaCopia
              ? `Última: ${estado.ultimaCopia.slice(0, 10)}`
              : 'Nunca has hecho una'
          }
          onPress={onAjustes}
          derecha={
            <Text variant="small" weight="bold" tone={estado.ultimaCopia ? 'success' : 'danger'}>
              {estado.ultimaCopia ? 'OK' : 'Pendiente'}
            </Text>
          }
        />
      </Card>

      {/* ── Pendiente ─────────────────────────────────────────────────── */}

      <Card variant="dashed">
        <Text variant="overline" tone="faint">
          Llega en la fase 2
        </Text>
        <View style={styles.apagado}>
          <ListItem icono="🏆" titulo="Logros e insignias" subtitulo="64 por desbloquear" />
          <ListItem icono="⚔️" titulo="Retos personales" subtitulo="Contra ti mismo, con comodines" />
          <ListItem icono="🎯" titulo="Objetivos" subtitulo="Lista y constructor genérico" />
        </View>
        <Text variant="small" tone="faint">
          Con pocas semanas de datos estarían casi todos bloqueados, y una
          pantalla de candados no motiva a nadie.
        </Text>
      </Card>

      {/* ── Tu historia ───────────────────────────────────────────────── */}

      {totales.diasRegistrados > 0 ? (
        <Card variant="flat">
          <View style={styles.filaHistoria}>
            <Text style={styles.iconoHistoria}>📖</Text>
            <Text variant="small" tone="muted" style={styles.textoHistoria}>
              {construirHistoria(totales)}
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

/**
 * Frase resumen, construida solo con lo que de verdad hay.
 *
 * Se omite cada parte que no tenga dato en lugar de rellenarla con un cero: «0
 * entrenos» leído en tu propia pantalla trofeo desanima, y no aporta nada que no
 * sepas.
 */
function construirHistoria(t: EstadoPerfil['totales']): string {
  const partes: string[] = [`${t.diasRegistrados} días registrando`];

  if (t.cambioDePesoKg != null && Math.abs(t.cambioDePesoKg) >= 0.1) {
    partes.push(`${conSigno(t.cambioDePesoKg)} kg`);
  }
  if (t.sesiones > 0) partes.push(`${t.sesiones} entrenos`);
  if (t.volumenKg > 0) partes.push(`${Math.round(t.volumenKg).toLocaleString('es-ES')} kg movidos`);
  if (t.deslices > 0) partes.push(`${t.deslices} deslices anotados con total honestidad`);

  return `Tu historia: ${partes.join(', ')}.`;
}

function Cifra({ titulo, valor }: { titulo: string; valor: string }) {
  const styles = useStyles();
  return (
    <Card style={styles.cifra}>
      <Text variant="overline" tone="faint">
        {titulo}
      </Text>
      <Text variant="displaySm">{valor}</Text>
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

    trofeo: { alignItems: 'center', paddingVertical: t.spacing.xxl, gap: t.spacing.sm },
    barra100: { marginTop: t.spacing.xs },
    chapas: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, justifyContent: 'center' },
    chapa: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radius.pill,
      borderWidth: 1,
    },
    chapaOro: { backgroundColor: t.colors.warningSurface, borderColor: t.colors.warningBorder },
    chapaXp: { backgroundColor: t.colors.xpSurface, borderColor: t.colors.xpBorder },
    chapaAcc: { backgroundColor: t.colors.accentSurface, borderColor: t.colors.accentBorder },

    rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
    cifra: { width: '47%', flexGrow: 1, gap: t.spacing.xs },

    desplegable: {
      gap: t.spacing.xs,
      paddingLeft: t.spacing.md,
      borderLeftWidth: 2,
      borderLeftColor: t.colors.border,
      marginBottom: t.spacing.sm,
    },
    origen: { gap: t.spacing.xs, paddingVertical: 2 },
    tarifa: { gap: t.spacing.xs, marginTop: t.spacing.sm },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.sm,
    },
    apagado: { opacity: 0.45 },

    filaHistoria: { flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' },
    iconoHistoria: { fontSize: 15, lineHeight: 20 },
    textoHistoria: { flex: 1, lineHeight: t.fontSize.tiny * t.lineHeight.relaxed },
  }),
);
