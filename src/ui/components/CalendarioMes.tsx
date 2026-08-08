import { Pressable, StyleSheet, View } from 'react-native';

import { aFechaISO, desdeFechaISO } from '../../domain/rules/fechas';
import type { FechaISO } from '../../domain/models/comunes';
import { makeStyles } from '../theme';
import { Text } from './Text';

type Props = {
  /** Día seleccionado. Define también el mes que se muestra al abrir. */
  seleccionada: FechaISO;
  hoy: FechaISO;
  /** Días con algún registro. Se marcan con un punto. */
  conDatos: ReadonlySet<FechaISO>;
  onSeleccionar: (fecha: FechaISO) => void;
  /** Mes visible, controlado desde fuera para poder navegar sin perder la selección. */
  mesVisible: FechaISO;
  onCambiarMes: (nuevoMes: FechaISO) => void;
  /**
   * Color de fondo de cada día. Devolver `undefined` deja el día neutro.
   *
   * Se pasa como función de color y no como estado del dominio para que el
   * calendario siga sin saber nada de deslices ni de semáforos.
   */
  colorDe?: (fecha: FechaISO) => string | undefined;
};

const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Rejilla de un mes.
 *
 * Se escribe a mano en lugar de usar una librería de calendario porque hace
 * falta muy poco —marcar días con datos y bloquear el futuro— y porque esta
 * misma rejilla es la base de la vista de mes del historial (pantalla 32).
 *
 * La semana empieza en lunes, como el resto de la app.
 */
export function CalendarioMes({
  seleccionada,
  hoy,
  conDatos,
  onSeleccionar,
  mesVisible,
  onCambiarMes,
  colorDe,
}: Props) {
  const styles = useStyles();

  const base = desdeFechaISO(mesVisible);
  const anio = base.getFullYear();
  const mes = base.getMonth();

  const primero = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  // getDay(): 0 = domingo. Se convierte a columna con lunes primero.
  const huecoInicial = (primero.getDay() + 6) % 7;

  const celdas: (FechaISO | null)[] = [
    ...Array.from({ length: huecoInicial }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => aFechaISO(new Date(anio, mes, i + 1))),
  ];

  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
    primero,
  );

  const mesSiguiente = aFechaISO(new Date(anio, mes + 1, 1));
  // Si el día 1 del mes siguiente todavía no ha llegado, ese mes es futuro entero.
  const puedeAvanzar = mesSiguiente <= hoy;

  return (
    <View style={styles.wrap}>
      <View style={styles.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={() => onCambiarMes(aFechaISO(new Date(anio, mes - 1, 1)))}
          hitSlop={10}
          style={styles.flecha}
        >
          <Text variant="label" tone="accent">
            ‹
          </Text>
        </Pressable>

        <Text variant="caption" weight="bold" style={styles.nombreMes}>
          {nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          onPress={() => puedeAvanzar && onCambiarMes(mesSiguiente)}
          disabled={!puedeAvanzar}
          hitSlop={10}
          style={[styles.flecha, !puedeAvanzar && styles.apagada]}
        >
          <Text variant="label" tone="accent">
            ›
          </Text>
        </Pressable>
      </View>

      <View style={styles.semana}>
        {INICIALES.map((i, n) => (
          <Text key={`${i}-${n}`} variant="small" tone="faint" style={styles.inicial}>
            {i}
          </Text>
        ))}
      </View>

      <View style={styles.rejilla}>
        {celdas.map((fecha, i) => {
          if (!fecha) return <View key={`hueco-${i}`} style={styles.celda} />;

          const esFuturo = fecha > hoy;
          const esSeleccionada = fecha === seleccionada;
          const esHoy = fecha === hoy;
          const tieneDatos = conDatos.has(fecha);

          return (
            <Pressable
              key={fecha}
              accessibilityRole="button"
              accessibilityLabel={fecha}
              accessibilityState={{ selected: esSeleccionada, disabled: esFuturo }}
              disabled={esFuturo}
              onPress={() => onSeleccionar(fecha)}
              style={styles.celda}
            >
              <View
                style={[
                  styles.dia,
                  colorDe?.(fecha) ? { backgroundColor: colorDe(fecha) } : null,
                  esHoy && styles.hoy,
                  esSeleccionada && styles.seleccionado,
                  esFuturo && styles.futuro,
                ]}
              >
                <Text
                  variant="small"
                  weight={esSeleccionada || esHoy ? 'bold' : 'regular'}
                  tone={esSeleccionada ? 'ink' : esFuturo ? 'faint' : 'default'}
                >
                  {Number(fecha.slice(8))}
                </Text>
              </View>
              <View
                style={[
                  styles.punto,
                  tieneDatos && !esSeleccionada ? styles.puntoVisible : null,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: t.spacing.md },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    flecha: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center' },
    apagada: { opacity: 0.3 },
    nombreMes: { flex: 1, textAlign: 'center' },
    semana: { flexDirection: 'row' },
    inicial: { flex: 1, textAlign: 'center' },
    rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
    celda: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      paddingVertical: 3,
      gap: 2,
    },
    dia: {
      width: 32,
      height: 32,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    hoy: { borderColor: t.colors.accentBorder },
    seleccionado: {
      backgroundColor: t.colors.accent,
      borderColor: t.colors.accent,
    },
    futuro: { opacity: 0.3 },
    punto: {
      width: 4,
      height: 4,
      borderRadius: 4,
      backgroundColor: 'transparent',
    },
    puntoVisible: { backgroundColor: t.colors.accent },
  }),
);
