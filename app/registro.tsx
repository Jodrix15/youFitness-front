import { router } from 'expo-router';

import { RegistroRapidoScreen } from '../src/ui/screens/RegistroRapidoScreen';

export default function RegistroRapidoRoute() {
  return (
    <RegistroRapidoScreen
      onCerrar={() => router.back()}
      onElegir={(ruta) =>
        router.replace(ruta as '/peso' | '/checkin' | '/comida-nueva' | '/desliz' | '/entreno')
      }
    />
  );
}
