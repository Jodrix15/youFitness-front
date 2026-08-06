import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles } from '../theme';
import { Gradient } from './Gradient';
import { Text } from './Text';

export type DestinoTab = {
  nombre: string;
  etiqueta: string;
  icono: string;
};

/**
 * Barra inferior con el botón central de registro rápido.
 *
 * Las cuatro pestañas están SIEMPRE disponibles, independientemente de los
 * bloques activos (§10): ocultarlas daría 32 combinaciones de navegación que
 * probar, y quien activa un bloque después no encontraría dónde ha aparecido.
 *
 * El botón central no es una pestaña: es una acción. Por eso se pinta distinto
 * y abre una hoja en lugar de cambiar de sección.
 */
export function TabBar({ state, navigation, onRegistroRapido }: BottomTabBarProps & {
  onRegistroRapido: () => void;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  const izquierda = state.routes.slice(0, 2);
  const derecha = state.routes.slice(2);

  function pintar(rutas: typeof state.routes) {
    return rutas.map((ruta) => {
      const indice = state.routes.findIndex((r) => r.key === ruta.key);
      const activa = state.index === indice;
      const opciones = state.routes[indice];
      const meta = META[ruta.name] ?? { etiqueta: ruta.name, icono: '•' };

      return (
        <Pressable
          key={opciones?.key ?? ruta.name}
          accessibilityRole="tab"
          accessibilityState={{ selected: activa }}
          accessibilityLabel={meta.etiqueta}
          onPress={() => {
            if (!activa) navigation.navigate(ruta.name);
          }}
          style={styles.tab}
        >
          <Text variant="body" style={activa ? undefined : styles.apagado}>
            {meta.icono}
          </Text>
          <Text variant="small" weight={activa ? 'bold' : 'regular'} tone={activa ? 'accent' : 'faint'}>
            {meta.etiqueta}
          </Text>
        </Pressable>
      );
    });
  }

  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {pintar(izquierda)}

      <View style={styles.huecoFab}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Registro rápido"
          onPress={onRegistroRapido}
          style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <Gradient nombre="fab" style={styles.fabRelleno}>
            <Text tone="ink" style={styles.mas}>
              +
            </Text>
          </Gradient>
        </Pressable>
      </View>

      {pintar(derecha)}
    </View>
  );
}

const META: Record<string, { etiqueta: string; icono: string }> = {
  inicio: { etiqueta: 'Inicio', icono: '◈' },
  comida: { etiqueta: 'Comida', icono: '🍽' },
  entreno: { etiqueta: 'Entreno', icono: '🏋' },
  progreso: { etiqueta: 'Progreso', icono: '📈' },
};

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    barra: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: t.colors.navSurface,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      paddingTop: t.spacing.md,
      paddingHorizontal: t.spacing.sm,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingVertical: t.spacing.xxs,
    },
    apagado: { opacity: 0.45 },
    huecoFab: {
      width: 64,
      alignItems: 'center',
    },
    fab: {
      width: 44,
      height: 44,
      borderRadius: 15,
      marginTop: -14,
      overflow: 'hidden',
      // Resplandor turquesa, no sombra negra: el botón tiene que parecer que
      // emite luz sobre la barra, no que flota por encima de ella.
      shadowColor: t.colors.accent,
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    fabRelleno: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mas: {
      fontSize: 21,
      lineHeight: 26,
      fontWeight: '700',
    },
  }),
);
