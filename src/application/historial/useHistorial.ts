import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Uuid } from '../../domain/models/comunes';
import { hoy } from '../../domain/rules/fechas';
import {
  resumirAnio,
  resumirDia,
  resumirMes,
  resumirTodo,
  type FuentesHistorial,
} from '../../domain/rules/historial';
import {
  estadoDelDia,
  semaforoDeTema,
  type EstadoDelDia,
  type Semaforo,
} from '../../domain/rules/temas';
import type { Rutina } from '../../domain/models/entreno';
import { useRepositorios } from '../../data/contenedor';

export type NivelZoom = 'dia' | 'mes' | 'anio' | 'todo';

/** Qué se está mirando: los dos temas juntos, o uno solo. */
export type FiltroTema = 'ambos' | 'comidas' | 'entrenos';

export type EstadoHistorial = {
  cargando: boolean;
  nivel: NivelZoom;
  irA: (nivel: NivelZoom) => void;
  /** Día seleccionado, y mes y año que se derivan de él. */
  fecha: string;
  verDia: (fecha: string) => void;
  cambiarMes: (anio: number, mes: number) => void;
  cambiarAnio: (anio: number) => void;

  tema: FiltroTema;
  cambiarTema: (tema: FiltroTema) => void;
  /** Semáforo del día según el tema elegido. */
  semaforoDe: (fecha: string) => Semaforo;
  /** Estado completo de los dos temas, para la vista de día. */
  temasDelDia: EstadoDelDia;
  /** Cuántos días de un rango caen en cada color. */
  contarColores: (fechas: readonly string[]) => Record<Semaforo, number>;

  dia: ReturnType<typeof resumirDia>;
  mes: ReturnType<typeof resumirMes>;
  anio: ReturnType<typeof resumirAnio>;
  todo: ReturnType<typeof resumirTodo>;
  /** Fechas con algún registro, para marcar el calendario. */
  fechasConDatos: Set<string>;
  recargar: () => Promise<void>;
};

/**
 * Carga TODO el historial de una vez.
 *
 * Suena caro y no lo es: incluso con años de uso son unos miles de filas, y en
 * memoria eso son unos pocos megas. Cargarlo entero permite que moverse entre
 * día, mes y año sea instantáneo, sin una consulta por cada gesto.
 *
 * Si algún día esto se nota, el sitio donde arreglarlo es el adaptador de datos
 * —con consultas por rango— y no las pantallas.
 */
export function useHistorial(usuarioId: Uuid | null): EstadoHistorial {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [nivel, setNivel] = useState<NivelZoom>('mes');
  const [fecha, setFecha] = useState(hoy());
  const [tema, setTema] = useState<FiltroTema>('ambos');
  const [rutinas, setRutinas] = useState<Rutina[]>([]);

  const [fuentes, setFuentes] = useState<FuentesHistorial>({
    pesajes: [],
    comidas: [],
    sesiones: [],
    checkins: [],
    eventos: [],
  });

  const recargar = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }
    const [pesajes, comidas, sesiones, checkins, eventos, rutinasCargadas] = await Promise.all([
      repos.peso.listar(usuarioId),
      repos.comidas.listar(usuarioId),
      repos.sesiones.listar(usuarioId),
      repos.checkins.listar(usuarioId),
      repos.xp.listar(usuarioId),
      repos.rutinas.listar(usuarioId),
    ]);
    setFuentes({ pesajes, comidas, sesiones, checkins, eventos });
    setRutinas(rutinasCargadas);
    setCargando(false);
  }, [repos, usuarioId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const [anio, mes] = useMemo(() => {
    const [a, m] = fecha.split('-').map(Number);
    return [a ?? 2026, m ?? 1] as const;
  }, [fecha]);

  /**
   * Semáforo de un día. Se recalcula en cada llamada en lugar de precalcular un
   * mapa: son tres filtros sobre listas ya en memoria, y así cambiar de tema no
   * obliga a reconstruir nada.
   */
  const semaforoDe = useCallback(
    (f: string): Semaforo => {
      const estado = estadoDelDia({ comidas: fuentes.comidas, sesiones: fuentes.sesiones, rutinas }, f);
      return tema === 'ambos' ? estado.semaforo : semaforoDeTema(estado, tema);
    },
    [fuentes.comidas, fuentes.sesiones, rutinas, tema],
  );

  return {
    cargando,
    nivel,
    irA: setNivel,
    fecha,
    tema,
    cambiarTema: setTema,
    semaforoDe,

    temasDelDia: useMemo(
      () => estadoDelDia({ comidas: fuentes.comidas, sesiones: fuentes.sesiones, rutinas }, fecha),
      [fuentes.comidas, fuentes.sesiones, rutinas, fecha],
    ),

    contarColores: useCallback(
      (fechas: readonly string[]) => {
        const cuenta: Record<Semaforo, number> = { verde: 0, amarillo: 0, rojo: 0, sin_datos: 0 };
        for (const f of fechas) cuenta[semaforoDe(f)]++;
        return cuenta;
      },
      [semaforoDe],
    ),

    verDia: (f) => {
      setFecha(f);
      setNivel('dia');
    },
    cambiarMes: (a, m) => {
      setFecha(`${a}-${String(m).padStart(2, '0')}-01`);
      setNivel('mes');
    },
    cambiarAnio: (a) => {
      setFecha(`${a}-01-01`);
      setNivel('anio');
    },

    dia: useMemo(() => resumirDia(fuentes, fecha), [fuentes, fecha]),
    mes: useMemo(() => resumirMes(fuentes, anio, mes), [fuentes, anio, mes]),
    anio: useMemo(() => resumirAnio(fuentes, anio), [fuentes, anio]),
    todo: useMemo(() => resumirTodo(fuentes), [fuentes]),

    fechasConDatos: useMemo(() => {
      const s = new Set<string>();
      for (const p of fuentes.pesajes) s.add(p.fecha);
      for (const c of fuentes.comidas) s.add(c.fecha);
      for (const x of fuentes.sesiones) if (x.terminada) s.add(x.fecha);
      for (const c of fuentes.checkins) s.add(c.fecha);
      return s;
    }, [fuentes]),

    recargar,
  };
}
