import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Uuid } from '../../domain/models/comunes';
import type {
  Ejercicio,
  NuevaRutina,
  NuevoEjercicio,
  Rutina,
  Sesion,
} from '../../domain/models/entreno';
import type { Escalera, NuevaEscalera } from '../../domain/models/escalera';
import { recompensa } from '../../domain/rules/eventosXp';
import { horaLocal, hoy } from '../../domain/rules/fechas';
import { calcularRacha } from '../../domain/rules/racha';
import { XP } from '../../domain/rules/xp';
import { inicioDeSemana } from '../../domain/rules/deslices';
import { totalizarSesion, type TotalesSesion } from '../../domain/rules/volumen';
import { useRepositorios } from '../../data/contenedor';
import { idsDelDispositivo } from '../../platform/id';
import {
  anotarCierre,
  anotarSerie,
  borrarSerie,
  descartarSesion,
  iniciarSesion,
  terminarSesion,
  type DatosNuevaSerie,
  type ResultadoSesion,
} from './sesion';

export type EstadoEntreno = {
  cargando: boolean;
  ejercicios: Ejercicio[];
  porId: Map<string, Ejercicio>;
  rutinas: Rutina[];
  sesiones: Sesion[];
  enCurso: Sesion | null;
  /** Sesiones terminadas esta semana natural. */
  sesionesEstaSemana: number;
  totalesUltimaSemana: TotalesSesion;

  crearEjercicio: (datos: NuevoEjercicio) => Promise<Ejercicio | null>;
  actualizarEjercicio: (id: Uuid, cambios: Partial<NuevoEjercicio>) => Promise<void>;
  borrarEjercicio: (id: Uuid) => Promise<void>;

  escaleras: Escalera[];
  crearEscalera: (datos: NuevaEscalera) => Promise<void>;
  borrarEscalera: (id: Uuid) => Promise<void>;
  /** Sube un escalón y escribe el evento de XP. Lo confirma el usuario. */
  ascender: (escalera: Escalera) => Promise<void>;

  crearRutina: (datos: NuevaRutina) => Promise<Rutina | null>;
  actualizarRutina: (id: Uuid, cambios: Partial<NuevaRutina>) => Promise<void>;
  borrarRutina: (id: Uuid) => Promise<void>;

  empezar: (rutina?: Rutina | null, nombre?: string) => Promise<Sesion | null>;
  anotar: (sesion: Sesion, ejercicio: Ejercicio, datos: DatosNuevaSerie) => Promise<Sesion | null>;
  quitarSerie: (sesion: Sesion, serieId: Uuid) => Promise<Sesion | null>;
  terminar: (
    sesion: Sesion,
    cierre: { esfuerzoPercibido: number | null; nota: string | null },
  ) => Promise<ResultadoSesion | null>;
  /** Guarda esfuerzo y nota de una sesión ya cerrada, sin volver a pagar XP. */
  guardarCierre: (
    sesionId: Uuid,
    cierre: { esfuerzoPercibido: number | null; nota: string | null },
  ) => Promise<void>;
  descartar: (sesionId: Uuid) => Promise<void>;

  recargar: () => Promise<void>;
};

export function useEntreno(usuarioId: Uuid | null): EstadoEntreno {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [escaleras, setEscaleras] = useState<Escalera[]>([]);

  const recargar = useCallback(async () => {
    if (!usuarioId) {
      setCargando(false);
      return;
    }
    const [e, r, s, esc] = await Promise.all([
      repos.ejercicios.listar(usuarioId),
      repos.rutinas.listar(usuarioId),
      repos.sesiones.listar(usuarioId),
      repos.escaleras.listar(usuarioId),
    ]);
    setEjercicios(e);
    setRutinas(r);
    setSesiones(s);
    setEscaleras(esc);
    setCargando(false);
  }, [repos, usuarioId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const porId = useMemo(() => new Map(ejercicios.map((e) => [e.id, e])), [ejercicios]);
  const terminadas = useMemo(() => sesiones.filter((s) => s.terminada), [sesiones]);

  const conUsuario = <T,>(fn: (id: Uuid) => Promise<T>) => async (): Promise<T | null> =>
    usuarioId ? fn(usuarioId) : null;

  return {
    cargando,
    ejercicios,
    porId,
    rutinas,
    sesiones: terminadas,
    enCurso: useMemo(() => sesiones.find((s) => !s.terminada) ?? null, [sesiones]),

    sesionesEstaSemana: useMemo(() => {
      const desde = inicioDeSemana(hoy());
      return terminadas.filter((s) => s.fecha >= desde).length;
    }, [terminadas]),

    totalesUltimaSemana: useMemo(() => {
      const desde = inicioDeSemana(hoy());
      const series = terminadas.filter((s) => s.fecha >= desde).flatMap((s) => s.series);
      return totalizarSesion(series, porId);
    }, [terminadas, porId]),

    crearEjercicio: async (datos) => {
      if (!usuarioId) return null;
      const e = await repos.ejercicios.crear(usuarioId, datos);
      await recargar();
      return e;
    },
    actualizarEjercicio: async (id, cambios) => {
      if (!usuarioId) return;
      await repos.ejercicios.actualizar(usuarioId, id, cambios);
      await recargar();
    },
    borrarEjercicio: async (id) => {
      if (!usuarioId) return;
      await repos.ejercicios.borrar(usuarioId, id);
      await recargar();
    },

    escaleras,

    crearEscalera: async (datos) => {
      if (!usuarioId) return;
      await repos.escaleras.crear(usuarioId, datos);
      await recargar();
    },
    borrarEscalera: async (id) => {
      if (!usuarioId) return;
      await repos.escaleras.borrar(usuarioId, id);
      await recargar();
    },

    /**
     * Subir de escalón lo confirma el usuario, y solo entonces se paga.
     * El evaluador ofrece; nunca decide.
     */
    ascender: async (escalera) => {
      if (!usuarioId) return;
      const fecha = hoy();

      // Se relee del almacén antes de escribir: dos toques seguidos llegarían
      // aquí con el mismo objeto en memoria y pagarían el ascenso dos veces.
      const actuales = await repos.escaleras.listar(usuarioId);
      const vigente = actuales.find((e) => e.id === escalera.id);
      if (!vigente || vigente.escalonActual !== escalera.escalonActual) return;

      await repos.escaleras.actualizar(usuarioId, escalera.id, {
        escalonActual: escalera.escalonActual + 1,
        fechaUltimoAscenso: fecha,
      });

      const fechasPrevias = await repos.xp.fechasConActividad(usuarioId);
      const racha = calcularRacha(fechasPrevias, fecha);

      await repos.xp.registrar(
        usuarioId,
        recompensa({
          tipo: 'escalon_subido',
          xpBase: XP.subirEscalon,
          contexto: { fecha, hora: horaLocal(), diasDeRacha: racha.actual },
          origenTabla: 'escalera',
          origenId: escalera.id,
          nota: escalera.nombre,
        }),
      );

      await recargar();
    },

    crearRutina: async (datos) => {
      if (!usuarioId) return null;
      const r = await repos.rutinas.crear(usuarioId, datos);
      await recargar();
      return r;
    },
    actualizarRutina: async (id, cambios) => {
      if (!usuarioId) return;
      await repos.rutinas.actualizar(usuarioId, id, cambios);
      await recargar();
    },
    borrarRutina: async (id) => {
      if (!usuarioId) return;
      await repos.rutinas.borrar(usuarioId, id);
      await recargar();
    },

    empezar: async (rutina, nombre) => {
      if (!usuarioId) return null;
      const s = await iniciarSesion(repos, usuarioId, { rutina, nombre });
      await recargar();
      return s;
    },
    anotar: async (sesion, ejercicio, datos) => {
      if (!usuarioId) return null;
      const s = await anotarSerie(repos, usuarioId, sesion, ejercicio, datos, idsDelDispositivo.nuevoId);
      await recargar();
      return s;
    },
    quitarSerie: async (sesion, serieId) => {
      if (!usuarioId) return null;
      const s = await borrarSerie(repos, usuarioId, sesion, serieId);
      await recargar();
      return s;
    },
    terminar: async (sesion, cierre) => {
      if (!usuarioId) return null;
      const r = await terminarSesion(repos, usuarioId, sesion, cierre);
      await recargar();
      return r;
    },
    guardarCierre: async (sesionId, cierre) => {
      if (!usuarioId) return;
      await anotarCierre(repos, usuarioId, sesionId, cierre);
      await recargar();
    },
    descartar: async (sesionId) => {
      await conUsuario((id) => descartarSesion(repos, id, sesionId))();
      await recargar();
    },

    recargar,
  };
}
