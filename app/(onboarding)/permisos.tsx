import { router } from 'expo-router';
import { useState } from 'react';

import { completarOnboarding } from '../../src/application/onboarding/completarOnboarding';
import { useOnboardingStore } from '../../src/application/onboarding/onboardingStore';
import { useRepositorios } from '../../src/data/contenedor';
import { PermisosScreen } from '../../src/ui/screens/onboarding/PermisosScreen';

export default function PermisosRoute() {
  const repos = useRepositorios();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function terminar() {
    setGuardando(true);
    setError(null);
    try {
      const borrador = useOnboardingStore.getState();
      await completarOnboarding(repos, borrador);
      useOnboardingStore.getState().reiniciar();
      router.replace('/inicio');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido guardar tu perfil');
      setGuardando(false);
    }
  }

  return (
    <PermisosScreen
      onTerminar={() => void terminar()}
      onAtras={() => router.back()}
      guardando={guardando}
      error={error}
    />
  );
}
