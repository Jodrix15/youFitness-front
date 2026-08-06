import { Tabs, router } from 'expo-router';

import { TabBar } from '../../src/ui/components/TabBar';

/**
 * Las cuatro pestañas y el botón central.
 *
 * El orden es el del mockup: Inicio y Comida a la izquierda, Entreno y Progreso
 * a la derecha, con el botón de registro rápido en medio.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} onRegistroRapido={() => router.push('/registro')} />}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="comida" options={{ title: 'Comida' }} />
      <Tabs.Screen name="entreno" options={{ title: 'Entreno' }} />
      <Tabs.Screen name="progreso" options={{ title: 'Progreso' }} />
    </Tabs>
  );
}
