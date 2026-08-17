import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  INTENSIDADES,
  type IntensidadGamificacion,
  type PrimerDiaSemana,
} from '../../../domain/models/perfil';
import { rangoPesoSaludable } from '../../../domain/rules/composicion';
import { PRESUPUESTO_SEMANAL } from '../../../domain/rules/deslices';
import type { EstadoAjustes } from '../../../application/ajustes/useAjustes';
import { DIAS_AVISO_COPIA } from '../../../application/ajustes/useAjustes';
import {
  antiguedad,
  DIAS_COPIA_VIEJA,
  HORAS_ENTRE_COPIAS,
} from '../../../application/nube/cuandoSubir';
import type { EstadoNube } from '../../../application/nube/useNube';
import {
  Aviso,
  Button,
  Card,
  Chip,
  ChipRow,
  FilaAjuste,
  Screen,
  SegmentedControl,
  Text,
  TextField,
  type Segment,
} from '../../components';
import { entero, kg } from '../../format';
import { makeStyles } from '../../theme';

type Props = {
  estado: EstadoAjustes;
  nube: EstadoNube;
  onAtras: () => void;
  /** Borra todos los datos y devuelve al onboarding. */
  onEliminarCuenta: () => void;
};

const DIAS: readonly Segment<PrimerDiaSemana>[] = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'domingo', label: 'Domingo' },
];

const NIVELES_INTENSIDAD: readonly Segment<IntensidadGamificacion>[] = INTENSIDADES.map((i) => ({
  value: i.valor,
  label: i.etiqueta,
}));

/**
 * Pantalla 37 · Ajustes. Cinco secciones, como el mockup.
 *
 * Las opciones que HOY no pueden funcionar se muestran igualmente, apagadas y
 * con el motivo a la vista. Esconderlas daría la impresión de que la app está
 * incompleta por descuido; enseñarlas activas y que no hicieran nada sería
 * peor todavía.
 *
 * Todo lo que aquí se guarda vive en el perfil, así que entra en la copia de
 * seguridad como cualquier otro dato.
 */
export function AjustesScreen({ estado, nube, onAtras, onEliminarCuenta }: Props) {
  const styles = useStyles();
  const { perfil, copia } = estado;

  /**
   * Confirmación en dos pasos, dentro de la propia pantalla.
   *
   * No se usa un diálogo del sistema porque en web no es fiable y porque un
   * `confirm()` se despacha con un clic reflejo. Obligar a leer un segundo
   * bloque, con el botón de cancelar primero, es lo que separa «lo he pulsado
   * sin querer» de «lo quiero hacer».
   */
  const [confirmando, setConfirmando] = useState(false);

  if (!perfil) return null;

  const rango = rangoPesoSaludable(perfil.alturaCm);

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
            Ajustes
          </Text>
        </View>
      }
    >
      {/* ── Gamificación ──────────────────────────────────────────────── */}

      <Text variant="overline" tone="faint">
        Gamificación
      </Text>

      <Card>
        <View style={styles.bloque}>
          <Text variant="caption" weight="bold">
            Intensidad
          </Text>
          <Text variant="small" tone="faint">
            Cuánto insiste la app
          </Text>
          <SegmentedControl
            segments={NIVELES_INTENSIDAD}
            value={perfil.intensidadGamificacion}
            onChange={(v) => void estado.cambiarPerfil({ intensidadGamificacion: v })}
          />
        </View>

        <FilaAjuste
          titulo="Modo estricto"
          descripcion="Activa las restas de XP: días sin registrar, trasnochar y pasarte del presupuesto"
          valor={perfil.modoEstricto}
          onCambiar={(v) => void estado.cambiarPerfil({ modoEstricto: v })}
        />

        <FilaAjuste
          titulo="Modo compasivo"
          descripcion="Oculta el número del peso y deja solo la tendencia"
          valor={perfil.modoCompasivo}
          onCambiar={(v) => void estado.cambiarPerfil({ modoCompasivo: v })}
        />

        <FilaAjuste
          titulo="Animación de subida de nivel"
          valor={false}
          pendiente="Llega en la fase 2"
        />

        <FilaAjuste
          titulo="Comodines automáticos"
          descripcion="Para que un mal día no rompa la racha"
          valor={false}
          pendiente="Llega con los retos, en la fase 2"
        />
      </Card>

      {perfil.modoEstricto ? (
        <Aviso icono="🤝" titulo="Registrar nunca resta">
          Aunque lo actives, anotar algo siempre suma. Confesar un desliz da sus
          15 XP igual. El castigo va en un evento aparte y es por el
          comportamiento, nunca por contarlo.
        </Aviso>
      ) : null}

      {/* ── Copia de seguridad ────────────────────────────────────────── */}

      <Text variant="overline" tone="faint">
        Copia de seguridad
      </Text>

      <Card variant={copia.urgente ? 'danger' : 'accent'}>
        <View style={styles.filaTitulo}>
          <View style={styles.textos}>
            <Text variant="caption" weight="bold">
              Última copia
            </Text>
            <Text variant="small" tone="faint">
              {copia.ultimaCopia
                ? `Hace ${entero(copia.diasSinCopia ?? 0)} días · descargada a tu dispositivo`
                : 'Nunca has descargado una'}
            </Text>
          </View>
          <Chip
            label={copia.urgente ? 'Pendiente' : 'OK'}
            selected
            tone={copia.urgente ? 'danger' : 'accent'}
          />
        </View>

        <View style={styles.separador} />

        <FilaAjuste
          titulo="Copia automática semanal"
          descripcion="Dentro del propio dispositivo"
          valor={perfil.copiaAutomatica}
          onCambiar={(v) => void estado.cambiarPerfil({ copiaAutomatica: v })}
        />

        <View style={styles.botones}>
          <Button
            label="Exportar ahora"
            variant="secondary"
            size="sm"
            style={styles.crecer}
            onPress={() => void estado.exportarCopia()}
            loading={estado.trabajando}
          />
          <Button
            label="Restaurar"
            variant="secondary"
            size="sm"
            style={styles.crecer}
            onPress={() => void estado.restaurarCopia()}
            disabled={estado.trabajando}
          />
        </View>

        {estado.mensaje ? (
          <Text variant="small" tone="accent">
            {estado.mensaje}
          </Text>
        ) : null}

        <Aviso icono="🧪" titulo="Prueba la restauración">
          {`Un backup que no has restaurado nunca no es un backup, es una suposición. Y ojo: la copia automática vive en este mismo dispositivo, así que te salva de un fallo de la app pero no de perder el móvil. Vuelve a exportar cada ${entero(DIAS_AVISO_COPIA)} días.`}
        </Aviso>
      </Card>

      {/* ── Copia en la nube ──────────────────────────────────────────── */}

      <Text variant="overline" tone="faint">
        Copia en la nube
      </Text>

      <SeccionNube nube={nube} />

      {/* ── Recordatorios ─────────────────────────────────────────────── */}

      <Text variant="overline" tone="faint">
        Recordatorios
      </Text>

      <Card>
        <FilaAjuste
          icono="⚖️"
          titulo="Pesarme"
          descripcion="Cada día por la mañana"
          valor={false}
          pendiente="Necesita notificaciones nativas"
        />
        <FilaAjuste
          icono="🍽️"
          titulo="Registrar comidas"
          valor={false}
          pendiente="Necesita notificaciones nativas"
        />
        <FilaAjuste
          icono="🥜"
          titulo="Snack anti-desliz"
          descripcion="A tu hora de riesgo, según tus patrones"
          valor={false}
          pendiente="Necesita notificaciones nativas"
        />
        <FilaAjuste
          icono="🧠"
          titulo="Cerrar el día"
          valor={false}
          pendiente="Necesita notificaciones nativas"
        />
        <Text variant="small" tone="faint">
          Los avisos programados solo funcionan en la app instalada con build
          nativa. Desde el navegador no son fiables: el sistema los descarta
          cuando quiere, y un recordatorio que a veces no llega es peor que no
          tenerlo.
        </Text>
      </Card>

      {/* ── Unidades y objetivos ──────────────────────────────────────── */}

      <Text variant="overline" tone="faint">
        Unidades y objetivos
      </Text>

      <Card>
        <FilaAjuste
          titulo="Peso"
          derecha={
            <Text variant="caption" weight="bold" tone="muted">
              kg
            </Text>
          }
        />
        <FilaAjuste
          titulo="Rango de peso saludable"
          descripcion="Calculado con tu altura"
          derecha={
            <Text variant="caption" weight="bold">
              {`${kg(rango.minKg, 0)}–${kg(rango.maxKg, 0)} kg`}
            </Text>
          }
        />

        <View style={styles.bloque}>
          <Text variant="caption" weight="bold">
            Presupuesto de deslices
          </Text>
          <Text variant="small" tone="faint">
            {`Por semana. La referencia son ${entero(PRESUPUESTO_SEMANAL)}.`}
          </Text>
          <ChipRow>
            {[1, 2, 3, 4].map((n) => (
              <Chip
                key={n}
                label={entero(n)}
                selected={perfil.presupuestoDeslicesSemana === n}
                onPress={() => void estado.cambiarPerfil({ presupuestoDeslicesSemana: n })}
              />
            ))}
          </ChipRow>
        </View>

        <View style={styles.bloque}>
          <Text variant="caption" weight="bold">
            Primer día de la semana
          </Text>
          <SegmentedControl
            segments={DIAS}
            value={perfil.primerDiaSemana}
            onChange={(v) => void estado.cambiarPerfil({ primerDiaSemana: v })}
          />
        </View>
      </Card>

      {/* ── Datos y privacidad ────────────────────────────────────────── */}

      <Text variant="overline" tone="faint">
        Datos y privacidad
      </Text>

      <Card>
        {/*
          * Este texto tiene que decir la verdad SIEMPRE. Mientras no actives la
          * nube, no hay servidor ni cuenta y así se dice. En cuanto entras con
          * tu correo deja de ser cierto, y dejarlo puesto convertiría la
          * pantalla de privacidad en el sitio donde la app miente.
          */}
        {nube.sesion ? (
          <FilaAjuste
            icono="☁️"
            titulo="En el móvil y en tu cuenta de la nube"
            descripcion={`Los registros viven en el móvil. Cada ${entero(HORAS_ENTRE_COPIAS)} h se sube una copia a tu proyecto de Supabase, por HTTPS y solo accesible con tu cuenta.`}
          />
        ) : (
          <FilaAjuste
            icono="📱"
            titulo="Todo en el dispositivo"
            descripcion="No hay servidor ni cuenta. Nada sale de aquí."
            derecha={
              <Text variant="caption" weight="bold" tone="success">
                ✓
              </Text>
            }
          />
        )}
        <FilaAjuste
          icono="🚶"
          titulo="Pasos"
          descripcion="Desde Salud o Health Connect"
          valor={false}
          pendiente="Necesita build nativa"
        />
        <FilaAjuste
          icono="⤓"
          titulo="Exportar mis datos"
          descripcion="JSON legible sin la app"
          onPress={() => void estado.exportarCopia()}
          derecha={
            <Text variant="caption" tone="accent">
              ›
            </Text>
          }
        />
        <FilaAjuste
          icono="🗑️"
          titulo="Eliminar mi cuenta"
          descripcion="Borra el perfil y todos los registros. Volverás a empezar por el onboarding."
          onPress={() => setConfirmando((v) => !v)}
          derecha={
            <Text variant="caption" tone="danger">
              {confirmando ? '⌄' : '›'}
            </Text>
          }
        />
      </Card>

      {confirmando ? (
        <Card variant="danger">
          <Text variant="caption" weight="bold">
            ¿Seguro que quieres eliminar la cuenta?
          </Text>
          <Text variant="small" tone="muted">
            Se borra todo: perfil, peso, comidas, entrenos, check-ins y el log de
            XP entero. No hay servidor del que recuperarlo, así que esto no se
            puede deshacer. Si quieres conservar el historial, exporta una copia
            antes: podrás restaurarla en la cuenta nueva.
          </Text>
          <View style={styles.botones}>
            <Button
              label="Cancelar"
              variant="secondary"
              size="sm"
              style={styles.crecer}
              onPress={() => setConfirmando(false)}
            />
            <Button
              label="Sí, eliminar"
              variant="danger"
              size="sm"
              style={styles.crecer}
              onPress={onEliminarCuenta}
            />
          </View>
        </Card>
      ) : null}

      <Text variant="small" tone="faint" center style={styles.version}>
        YouFitness · versión 0.1
      </Text>
    </Screen>
  );
}

/**
 * Sección de copia en la nube.
 *
 * TRES ESTADOS, y cada uno enseña exactamente una cosa que hacer: sin
 * configurar, sin cuenta, y funcionando. La versión con cuenta no pide nada al
 * usuario porque no hay nada que pedirle — solo cuenta cuándo fue la última
 * copia, que es el único dato con el que se puede decidir si preocuparse.
 */
function SeccionNube({ nube }: { nube: EstadoNube }) {
  const styles = useStyles();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmandoRestaurar, setConfirmandoRestaurar] = useState(false);

  const avisos = (
    <>
      {nube.mensaje ? (
        <Text variant="small" tone="accent">
          {nube.mensaje}
        </Text>
      ) : null}
      {nube.error ? (
        <Text variant="small" tone="danger">
          {nube.error}
        </Text>
      ) : null}
    </>
  );

  if (!nube.disponible) {
    return (
      <Card>
        <FilaAjuste
          icono="☁️"
          titulo="Copia automática en la nube"
          descripcion={`Subiría una copia sola cada ${entero(HORAS_ENTRE_COPIAS)} h. No tendrías que acordarte de exportar nunca más.`}
          valor={false}
          pendiente="Falta pegar las dos claves de Supabase en app.json · instrucciones en src/data/adapters/supabase/LEEME.md"
        />
      </Card>
    );
  }

  if (nube.cargando) {
    return (
      <Card>
        <Text variant="small" tone="faint">
          Comprobando…
        </Text>
      </Card>
    );
  }

  if (!nube.sesion) {
    const puede = correo.trim().includes('@') && contrasena.length >= 6;

    return (
      <Card variant="accent">
        <Text variant="caption" tone="muted">
          Entra <Text weight="bold">una vez</Text> con un correo y una contraseña.
          A partir de ahí la copia se hace sola y no vuelves a tocar nada. El
          correo no se usa para escribirte: es lo único que permite reconocerte el
          día que instales la app en un móvil nuevo.
        </Text>

        <TextField
          label="Correo"
          value={correo}
          onChangeText={setCorreo}
          placeholder="tu@correo.com"
          tipo="correo"
          maxLength={120}
        />
        <TextField
          label="Contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          placeholder="Mínimo 6 caracteres"
          secreto
          maxLength={72}
          ayuda="Apúntala donde guardes las demás. Sin ella no hay forma de recuperar la copia."
        />

        <View style={styles.botones}>
          <Button
            label="Crear cuenta"
            variant="secondary"
            size="sm"
            style={styles.crecer}
            onPress={() => void nube.crearCuenta(correo, contrasena)}
            disabled={!puede || nube.trabajando}
          />
          <Button
            label="Entrar"
            size="sm"
            style={styles.crecer}
            onPress={() => void nube.entrar(correo, contrasena)}
            disabled={!puede}
            loading={nube.trabajando}
          />
        </View>

        {avisos}
      </Card>
    );
  }

  const dias =
    nube.ultimaSubida != null
      ? (Date.now() - new Date(nube.ultimaSubida).getTime()) / 86_400_000
      : null;
  const vieja = dias == null || dias >= DIAS_COPIA_VIEJA;

  return (
    <Card variant={vieja ? 'danger' : 'accent'}>
      <View style={styles.filaTitulo}>
        <View style={styles.textos}>
          <Text variant="caption" weight="bold">
            Última copia en la nube
          </Text>
          <Text variant="small" tone="faint">
            {nube.ultimaSubida
              ? `${antiguedad(nube.ultimaSubida)}${nube.info ? ` · ${entero(nube.info.tamanoKb)} KB` : ''}`
              : 'Se subirá sola en cuanto haya conexión'}
          </Text>
        </View>
        <Chip
          label={vieja ? 'Pendiente' : 'Al día'}
          selected
          tone={vieja ? 'danger' : 'accent'}
        />
      </View>

      <View style={styles.separador} />

      <FilaAjuste
        icono="👤"
        titulo={nube.sesion.correo}
        descripcion={`Automática cada ${entero(HORAS_ENTRE_COPIAS)} h, al abrir la app`}
      />

      <View style={styles.botones}>
        <Button
          label="Subir ahora"
          variant="secondary"
          size="sm"
          style={styles.crecer}
          onPress={() => void nube.subirAhora()}
          loading={nube.trabajando}
        />
        <Button
          label="Restaurar"
          variant="secondary"
          size="sm"
          style={styles.crecer}
          onPress={() => setConfirmandoRestaurar((v) => !v)}
          disabled={nube.trabajando}
        />
      </View>

      {/* Restaurar es destructivo: sustituye lo del móvil. Se confirma. */}
      {confirmandoRestaurar ? (
        <>
          <Text variant="small" tone="muted">
            Restaurar sustituye lo que hay en este móvil por la copia de la nube.
            Lo que hayas registrado después de esa copia se pierde. No se
            fusionan: mezclar dos historiales produce duplicados que no verías
            hasta meses después.
          </Text>
          <View style={styles.botones}>
            <Button
              label="Cancelar"
              variant="secondary"
              size="sm"
              style={styles.crecer}
              onPress={() => setConfirmandoRestaurar(false)}
            />
            <Button
              label="Sí, restaurar"
              variant="danger"
              size="sm"
              style={styles.crecer}
              onPress={() => void nube.restaurar()}
              loading={nube.trabajando}
            />
          </View>
        </>
      ) : null}

      {avisos}

      <FilaAjuste
        titulo="Cerrar sesión"
        descripcion="La copia se queda guardada en la nube"
        onPress={() => void nube.salir()}
        derecha={
          <Text variant="caption" tone="accent">
            ›
          </Text>
        }
      />
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
    bloque: { gap: t.spacing.sm, paddingVertical: t.spacing.sm },
    filaTitulo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.md,
    },
    textos: { flex: 1, gap: 2 },
    separador: { height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.xs },
    botones: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.xs },
    crecer: { flex: 1 },
    version: { paddingVertical: t.spacing.lg },
  }),
);
