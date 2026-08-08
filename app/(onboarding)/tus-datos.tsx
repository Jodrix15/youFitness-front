import { router } from 'expo-router';

import { PerfilScreen } from '../../src/ui/screens/onboarding/PerfilScreen';

export default function PerfilRoute() {
  return <PerfilScreen onContinuar={() => router.push('/bloques')} onAtras={() => router.back()} />;
}
