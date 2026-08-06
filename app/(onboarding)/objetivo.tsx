import { router } from 'expo-router';

import { ObjetivoScreen } from '../../src/ui/screens/onboarding/ObjetivoScreen';

export default function ObjetivoRoute() {
  return (
    <ObjetivoScreen onContinuar={() => router.push('/permisos')} onAtras={() => router.back()} />
  );
}
