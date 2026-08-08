import type { Uuid } from '../../domain/models/comunes';
import type { Ejercicio, Rutina, Serie, Sesion } from '../../domain/models/entreno';
import { recompensa } from '../../domain/rules/eventosXp';
import { horaLocal, hoy } from '../../domain/rules/fechas';
import { calcularRacha } from '../../domain/rules/racha';
import { desglosarXpSesion, recordsDeLaSesion, type DesgloseXpSesion } from '../../domain/rules/sesionXp';
import { totalizarSesion, volumenSerie } from '../../domain/rules/volumen';
import { XP } from '../../domain/rules/xp';
import type { Repositorios } from '../../data/repositories';

/**
 * Peso corporal para los cálculos de volumen.
 *
 * Se toma el último pesaje, y si no hay ninguno, el del onboarding. Queda
 * CONGELADO en la sesión al crearla: si dentro de un año pesas ocho kilos
 * menos, el volumen de las dominadas de hoy no puede cambiar retroactivamente.
 */
async function pesoCorporalActual(repos: Repositorios, usuarioId: Uuid): Promise<number> {
  const pesajes = await repos.peso.listar(usuarioId);
  const ultimo = pesajes[pesajes.length - 1];
  if (ultimo) return ultimo.pesoKg;

  const perfil = await repos.perfil.obtener();
  return perfil?.pesoInicialKg ?? 70;
}

/**
 * CASO DE USO: empezar una sesión.
 *
 * Si ya hay una sin terminar, se devuelve esa en lugar de crear otra. Dos
 * sesiones abiertas a la vez no significan nada y ensucian el historial.
 */
export async function iniciarSesion(
  repos: Repositorios,
  usuarioId: Uuid,
  opciones: { rutina?: Rutina | null; nombre?: string } = {},
  ahora: Date = new Date(),
): Promise<Sesion> {
  const abierta = await repos.sesiones.enCurso(usuarioId);
  if (abierta) return abierta;

  const sesion = await repos.sesiones.crear(usuarioId, {
    rutinaId: opciones.rutina?.id ?? null,
    nombre: opciones.nombre ?? opciones.rutina?.nombre ?? 'Sesión libre',
    fecha: hoy(ahora),
    horaInicio: horaLocal(ahora),
    horaFin: null,
    esfuerzoPercibido: null,
    nota: null,
    volumenTotal: 0,
    segundosIsometricos: 0,
    pesoCorporalKg: await pesoCorporalActual(repos, usuarioId),
    series: [],
    terminada: false,
  });

  if (opciones.rutina) {
    await repos.rutinas.registrarUso(usuarioId, opciones.rutina.id);
  }

  return sesion;
}

export type DatosNuevaSerie = {
  ejercicioId: Uuid;
  reps: number | null;
  pesoKg: number | null;
  lastreKg: number | null;
  segundos: number | null;
  rir: number | null;
};

/**
 * CASO DE USO: anotar una serie.
 *
 * El volumen se calcula y se guarda AQUÍ, no al leer. Así queda ligado al peso
 * corporal que tenías el día de la sesión, y editar el historial de peso no
 * reescribe el volumen de entrenos pasados.
 *
 * No concede XP: eso se paga entero al terminar. Ver `terminarSesion`.
 */
export async function anotarSerie(
  repos: Repositorios,
  usuarioId: Uuid,
  sesion: Sesion,
  ejercicio: Ejercicio,
  datos: DatosNuevaSerie,
  nuevoId: () => Uuid,
): Promise<Sesion> {
  const volumen = volumenSerie(datos, ejercicio.tipo, ejercicio.factorApalancamiento, sesion.pesoCorporalKg);

  const numero = sesion.series.filter((s) => s.ejercicioId === datos.ejercicioId).length + 1;

  const serie: Serie = {
    id: nuevoId(),
    ejercicioId: datos.ejercicioId,
    numero,
    reps: datos.reps,
    pesoKg: datos.pesoKg,
    lastreKg: datos.lastreKg,
    segundos: datos.segundos,
    rir: datos.rir,
    // El récord no se decide aquí: se resuelve al cerrar la sesión, contra el
    // histórico anterior y no contra las series del propio día.
    esPr: false,
    volumen,
  };

  return repos.sesiones.actualizar(usuarioId, sesion.id, {
    series: [...sesion.series, serie],
  });
}

export async function borrarSerie(
  repos: Repositorios,
  usuarioId: Uuid,
  sesion: Sesion,
  serieId: Uuid,
): Promise<Sesion> {
  return repos.sesiones.actualizar(usuarioId, sesion.id, {
    series: sesion.series.filter((s) => s.id !== serieId),
  });
}

export type ResultadoSesion = {
  sesion: Sesion;
  desglose: DesgloseXpSesion;
  xpGanado: number;
  multiplicador: number;
};

/**
 * CASO DE USO: terminar la sesión.
 *
 * Aquí se paga todo el XP de golpe: base + series + récords, con el
 * multiplicador de racha aplicado al conjunto.
 *
 * Una sesión sin series no cuenta como entreno. Abrir la app en el gimnasio y
 * arrepentirse no son 80 XP.
 */
export async function terminarSesion(
  repos: Repositorios,
  usuarioId: Uuid,
  sesion: Sesion,
  cierre: { esfuerzoPercibido: number | null; nota: string | null },
  ahora: Date = new Date(),
): Promise<ResultadoSesion | null> {
  if (sesion.series.length === 0) return null;

  // Cerrar dos veces la misma sesión pagaría el entreno dos veces. Para editar
  // el esfuerzo o la nota después está `anotarCierre`.
  if (sesion.terminada) return null;

  const listaEjercicios = await repos.ejercicios.listar(usuarioId);
  const porId = new Map(listaEjercicios.map((e) => [e.id, e]));

  const historico = await repos.sesiones.seriesHistoricas(usuarioId);
  const records = recordsDeLaSesion(sesion.series, historico, porId);
  const idsConRecord = new Set(records.map((r) => r.ejercicioId));

  const totales = totalizarSesion(sesion.series, porId);
  const desglose = desglosarXpSesion({ series: sesion.series, records });

  const terminada = await repos.sesiones.actualizar(usuarioId, sesion.id, {
    horaFin: horaLocal(ahora),
    esfuerzoPercibido: cierre.esfuerzoPercibido,
    nota: cierre.nota,
    volumenTotal: totales.volumenKg,
    segundosIsometricos: totales.segundosIsometricos,
    terminada: true,
    // Se marca la mejor serie de cada ejercicio con récord.
    series: sesion.series.map((s) => ({
      ...s,
      esPr:
        idsConRecord.has(s.ejercicioId) &&
        records.some((r) => r.ejercicioId === s.ejercicioId && magnitudDe(s, r.clase) === r.valor),
    })),
  });

  const fechasPrevias = await repos.xp.fechasConActividad(usuarioId);
  const racha = calcularRacha(fechasPrevias, sesion.fecha);
  const hora = horaLocal(ahora);
  const contexto = { fecha: sesion.fecha, hora, diasDeRacha: racha.actual };

  const evento = await repos.xp.registrar(
    usuarioId,
    recompensa({
      tipo: 'entreno_completado',
      xpBase: desglose.base + desglose.porSeries,
      contexto,
      origenTabla: 'sesion',
      origenId: sesion.id,
      nota: `${sesion.series.length} series`,
    }),
  );

  let xpRecords = 0;
  for (const r of records) {
    const e = await repos.xp.registrar(
      usuarioId,
      recompensa({
        tipo: 'record_personal',
        xpBase: XP.recordPersonal,
        contexto,
        origenTabla: 'sesion',
        origenId: sesion.id,
        nota: `${porId.get(r.ejercicioId)?.nombre ?? 'Ejercicio'}: ${r.valor}`,
      }),
    );
    xpRecords += e.xpFinal;
  }

  return {
    sesion: terminada,
    desglose,
    xpGanado: evento.xpFinal + xpRecords,
    multiplicador: evento.multiplicador,
  };
}

function magnitudDe(s: Serie, clase: 'peso' | 'reps' | 'segundos' | 'volumen'): number {
  switch (clase) {
    case 'peso':
      return s.pesoKg ?? 0;
    case 'reps':
      return s.reps ?? 0;
    case 'segundos':
      return s.segundos ?? 0;
    case 'volumen':
      return s.volumen;
  }
}

/**
 * Anota el esfuerzo percibido y la nota de una sesión YA terminada.
 *
 * Va aparte de `terminarSesion` a propósito: el resumen se rellena después de
 * cerrar, y si esa pantalla llamara a terminar otra vez se escribiría un segundo
 * evento de XP por el mismo entreno.
 */
export async function anotarCierre(
  repos: Repositorios,
  usuarioId: Uuid,
  sesionId: Uuid,
  cierre: { esfuerzoPercibido: number | null; nota: string | null },
): Promise<void> {
  await repos.sesiones.actualizar(usuarioId, sesionId, cierre);
}

/** Descarta una sesión abierta sin registrar nada. */
export async function descartarSesion(
  repos: Repositorios,
  usuarioId: Uuid,
  sesionId: Uuid,
): Promise<void> {
  await repos.sesiones.borrar(usuarioId, sesionId);
}
