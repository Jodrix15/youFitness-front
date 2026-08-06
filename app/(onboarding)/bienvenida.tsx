import { router } from 'expo-router';

import { BienvenidaScreen } from '../../src/ui/screens/onboarding/BienvenidaScreen';

/**
 * La ruta solo conecta navegación con pantalla.
 *
 * Toda la lógica está en la pantalla y, por debajo, en el dominio. Cambiar de
 * expo-router a otra cosa sería reescribir estos ficheros de cuatro líneas y
 * nada más.
 */
export default function BienvenidaRoute() {
  return <BienvenidaScreen onContinuar={() => router.push('/perfil')} />;
}
