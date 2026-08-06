import { router } from 'expo-router';

import { BloquesScreen } from '../../src/ui/screens/onboarding/BloquesScreen';

export default function BloquesRoute() {
  return (
    <BloquesScreen onContinuar={() => router.push('/objetivo')} onAtras={() => router.back()} />
  );
}
