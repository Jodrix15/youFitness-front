import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Uuid } from '../../domain/models/comunes';
import type { Medida, PesoRegistro } from '../../domain/models/peso';
import type { Objetivo } from '../../domain/models/objetivo';
import { hoy } from '../../domain/rules/fechas';
import {
  calcularTendencia,
  resumirProgreso,
  type ResumenPeso,
  type Tendencia,
} from '../../domain/rules/tendenciaPeso';
import { useRepositorios } from '../../data/contenedor';
import { registrarPeso } from './registrarPeso';

export type EstadoPeso = {
  cargando: boolean;
  pesajes: PesoRegistro[];
  pesajeDeHoy: PesoRegistro | null;
  tendencia: Tendencia;
  resumen: ResumenPeso | null;
  cintura: Medida | null;
  guardar: (pesoKg: number) => Promise<number>;
  guardarCintura: (cm: number) => Promise<void>;
};

/**
 * Estado de la pantalla de Peso.
 *
 * El hook solo coordina: leer, llamar al caso de uso, releer. Los cálculos son
 * de `domain/rules/tendenciaPeso`, que no sabe que React existe.
 */
export function usePeso(usuarioId: Uuid | null, pesoInicialKg: number | null): EstadoPeso {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [pesajes, setPesajes] = useState<PesoRegistro[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [cintura, setCintura] = useState<Medida | null>(null);

  const recargar = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }
    const [p, o, c] = await Promise.all([
      repos.peso.listar(usuarioId),
      repos.objetivos.listarActivos(usuarioId),
      repos.medidas.ultima(usuarioId, 'cintura'),
    ]);
    setPesajes(p);
    setObjetivos(o);
    setCintura(c);
    setCargando(false);
  }, [repos, usuarioId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const objetivoPeso = useMemo(
    () => objetivos.find((o) => o.metrica === 'peso_kg')?.valor ?? null,
    [objetivos],
  );

  const tendencia = useMemo(() => calcularTendencia(pesajes), [pesajes]);

  const resumen = useMemo(
    () =>
      pesoInicialKg == null
        ? null
        : resumirProgreso({ pesajes, pesoInicialKg, objetivoKg: objetivoPeso }),
    [pesajes, pesoInicialKg, objetivoPeso],
  );

  const pesajeDeHoy = useMemo(() => {
    const f = hoy();
    return pesajes.find((p) => p.fecha === f) ?? null;
  }, [pesajes]);

  const guardar = useCallback(
    async (pesoKg: number) => {
      if (!usuarioId) return 0;
      const r = await registrarPeso(repos, usuarioId, { pesoKg });
      await recargar();
      return r.xpGanado;
    },
    [repos, usuarioId, recargar],
  );

  const guardarCintura = useCallback(
    async (cm: number) => {
      if (!usuarioId) return;
      await repos.medidas.guardar(usuarioId, { fecha: hoy(), tipo: 'cintura', valorCm: cm });
      await recargar();
    },
    [repos, usuarioId, recargar],
  );

  return {
    cargando,
    pesajes,
    pesajeDeHoy,
    tendencia,
    resumen,
    cintura,
    guardar,
    guardarCintura,
  };
}
