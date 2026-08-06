import { useCallback, useEffect, useState } from 'react';

import type { Perfil } from '../../domain/models/perfil';
import { useRepositorios } from '../../data/contenedor';

export type Sesion = {
  cargando: boolean;
  perfil: Perfil | null;
  onboardingCompletado: boolean;
  recargar: () => Promise<void>;
};

/**
 * Estado de arranque de la app: ¿hay perfil?, ¿se completó el onboarding?
 *
 * Es lo que decide si la app abre en Bienvenida o en Inicio. La pantalla 01
 * se ve UNA SOLA VEZ (especificación §3).
 */
export function useSesion(): Sesion {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [completado, setCompletado] = useState(false);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      const [p, hecho] = await Promise.all([
        repos.perfil.obtener(),
        repos.ajustes.onboardingCompletado(),
      ]);
      setPerfil(p);
      setCompletado(hecho);
    } finally {
      setCargando(false);
    }
  }, [repos]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { cargando, perfil, onboardingCompletado: completado, recargar };
}
