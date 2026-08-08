import { Pressable, StyleSheet, View } from 'react-native';

import { XP } from '../../domain/rules/xp';
import { Card, Screen, Text } from '../components';
import { entero } from '../format';
import { makeStyles } from '../theme';

export type AccionRapida = {
  clave: string;
  icono: string;
  etiqueta: string;
  xp: number;
  ruta: string | null;
};

/**
 * Seis acciones ordenadas por frecuencia real de uso, no por importancia
 * conceptual: se registra mucho más una comida que un check-in nocturno.
 *
 * Las que aún no existen se muestran apagadas en lugar de llevar a una pantalla
 * vacía. Prometer un destino que no está es peor que no ofrecerlo.
 */
export const ACCIONES: readonly AccionRapida[] = [
  { clave: 'comida', icono: '🍽️', etiqueta: 'Comida', xp: XP.registrarComida, ruta: '/comida-nueva' },
  { clave: 'peso', icono: '⚖️', etiqueta: 'Peso', xp: XP.registrarPeso, ruta: '/peso' },
  { clave: 'entreno', icono: '🏋️', etiqueta: 'Entreno', xp: XP.completarEntreno, ruta: '/entreno' },
  { clave: 'desliz', icono: '🍩', etiqueta: 'Desliz', xp: XP.registrarDesliz, ruta: '/desliz' },
  { clave: 'checkin', icono: '🧠', etiqueta: 'Check-in', xp: XP.cerrarDia, ruta: '/checkin' },
];

type Props = {
  onCerrar: () => void;
  onElegir: (ruta: string) => void;
};

/** Pantalla 08 · Registro rápido. La hoja que abre el botón central. */
export function RegistroRapidoScreen({ onCerrar, onElegir }: Props) {
  const styles = useStyles();

  return (
    <Screen
      header={
        <View style={styles.cabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={onCerrar}
            hitSlop={12}
          >
            <Text variant="title" tone="accent">
              ←
            </Text>
          </Pressable>
          <Text variant="label" style={styles.titulo}>
            ¿Qué quieres registrar?
          </Text>
        </View>
      }
    >
      <View style={styles.rejilla}>
        {ACCIONES.map((a) => {
          const disponible = a.ruta != null;
          return (
            <Pressable
              key={a.clave}
              accessibilityRole="button"
              accessibilityState={{ disabled: !disponible }}
              disabled={!disponible}
              onPress={() => a.ruta && onElegir(a.ruta)}
              style={({ pressed }) => [styles.celda, pressed && disponible ? styles.pulsada : null]}
            >
              <Card variant="flat" style={StyleSheet.flatten([styles.tarjeta, !disponible && styles.apagada])}>
                <Text style={styles.icono}>{a.icono}</Text>
                <Text variant="caption" weight="bold">
                  {a.etiqueta}
                </Text>
                <Text variant="small" tone={disponible ? 'accent' : 'faint'}>
                  {disponible ? `+${entero(a.xp)} XP` : 'próximamente'}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.lg,
      paddingBottom: t.spacing.md,
    },
    titulo: { flex: 1 },
    rejilla: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing.md,
    },
    celda: {
      width: '47%',
      flexGrow: 1,
    },
    pulsada: { opacity: 0.8 },
    tarjeta: {
      alignItems: 'center',
      paddingVertical: t.spacing.xl,
      gap: t.spacing.xs,
    },
    apagada: { opacity: 0.4 },
    icono: { fontSize: 26, lineHeight: 32 },
  }),
);
