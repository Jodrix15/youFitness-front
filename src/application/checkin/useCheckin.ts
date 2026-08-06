import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Checkin, NuevoCheckin } from '../../domain/models/checkin';
import type { Uuid } from '../../domain/models/comunes';
import { hoy } from '../../domain/rules/fechas';
import { horaHabitualAcostarse, UMBRAL_CORRELACIONES } from '../../domain/rules/sueno';
import { useRepositorios } from '../../data/contenedor';
import { cerrarDia, type ResultadoCerrarDia } from './cerrarDia';

export type EstadoCheckin = {
  cargando: boolean;
  checkins: Checkin[];
  checkinDeHoy: Checkin | null;
  /** Mediana de la hora de acostarse, en minutos nocturnos. */
  habitualMinutos: number | null;
  /** Cuántos check-ins faltan para desbloquear correlaciones. */
  faltanParaCorrelaciones: number;
  guardar: (datos: Omit<NuevoCheckin, 'fecha'>) => Promise<ResultadoCerrarDia | null>;
};

export function useCheckin(usuarioId: Uuid | null): EstadoCheckin {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  const recargar = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }
    setCheckins(await repos.checkins.listar(usuarioId));
    setCargando(false);
  }, [repos, usuarioId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const fecha = hoy();

  const guardar = useCallback(
    async (datos: Omit<NuevoCheckin, 'fecha'>) => {
      if (!usuarioId) return null;
      const r = await cerrarDia(repos, usuarioId, { ...datos, fecha });
      await recargar();
      return r;
    },
    [repos, usuarioId, fecha, recargar],
  );

  return {
    cargando,
    checkins,
    checkinDeHoy: useMemo(() => checkins.find((c) => c.fecha === fecha) ?? null, [checkins, fecha]),
    habitualMinutos: useMemo(() => horaHabitualAcostarse(checkins), [checkins]),
    faltanParaCorrelaciones: Math.max(0, UMBRAL_CORRELACIONES - checkins.length),
    guardar,
  };
}
