/**
 * Semáforo por temas: comidas y entrenos.
 *
 * Un día se pinta según CUÁNTOS de los dos temas tuvieron un desliz:
 *
 *   verde     ninguno de los dos
 *   amarillo  exactamente uno
 *   rojo      los dos
 *
 * DOS DECISIONES QUE IMPORTAN, y que evitan que el color mienta:
 *
 * 1. **Un día sin datos no es verde, es neutro.** Verde significa «comprobado y
 *    limpio». No haber registrado nada no es estar limpio: es no saberlo. Pintar
 *    de verde los días en blanco convertiría el olvido en una recompensa, que es
 *    justo lo contrario de lo que la app quiere.
 *
 * 2. **Un día de descanso planificado no es un entreno fallado.** Solo cuenta
 *    como desliz de entreno si ese día tocaba una rutina y no la registraste.
 *    Sin esto, todos tus días de descanso saldrían en amarillo, y el descanso es
 *    parte del plan.
 */

import type { Comida } from '../models/comida';
import type { FechaISO } from '../models/comunes';
import type { Rutina, Sesion } from '../models/entreno';
import { desdeFechaISO } from './fechas';

export type Tema = 'comidas' | 'entrenos';

export type Semaforo = 'verde' | 'amarillo' | 'rojo' | 'sin_datos';

export type EstadoTema =
  /** No aplica: ese día no tocaba entreno, o no hay nada registrado. */
  | { estado: 'no_aplica' }
  | { estado: 'limpio' }
  | { estado: 'desliz'; motivo: string };

export type EstadoDelDia = {
  fecha: FechaISO;
  comidas: EstadoTema;
  entrenos: EstadoTema;
  semaforo: Semaforo;
  /** Cuántos de los dos temas tuvieron desliz: 0, 1 o 2. */
  temasConDesliz: number;
};

/** 1 = lunes … 7 = domingo, igual que en las rutinas. */
export function diaDeLaSemana(fecha: FechaISO): number {
  const d = desdeFechaISO(fecha).getDay();
  return d === 0 ? 7 : d;
}

/**
 * Estado del tema de comidas.
 *
 * Hay desliz si ese día registraste alguna comida marcada como desliz. Si no
 * registraste nada de comer, el tema no aplica: no se puede afirmar que comieras
 * bien un día del que no hay datos.
 */
export function estadoComidas(comidas: readonly Comida[], fecha: FechaISO): EstadoTema {
  const delDia = comidas.filter((c) => c.fecha === fecha && c.borradoEn == null);
  if (delDia.length === 0) return { estado: 'no_aplica' };

  const deslices = delDia.filter((c) => c.esDesliz);
  if (deslices.length === 0) return { estado: 'limpio' };

  return {
    estado: 'desliz',
    motivo:
      deslices.length === 1
        ? `1 desliz: ${deslices[0]!.descripcion}`
        : `${deslices.length} deslices`,
  };
}

/**
 * Estado del tema de entrenos.
 *
 * Hay desliz si ese día tocaba al menos una rutina y no registraste ninguna
 * sesión. Si no tocaba nada, el tema no aplica — descansar no es fallar.
 */
export function estadoEntrenos(
  sesiones: readonly Sesion[],
  rutinas: readonly Rutina[],
  fecha: FechaISO,
): EstadoTema {
  const hechas = sesiones.filter((s) => s.fecha === fecha && s.terminada && s.borradoEn == null);
  if (hechas.length > 0) return { estado: 'limpio' };

  const dia = diaDeLaSemana(fecha);
  const tocaban = rutinas.filter((r) => r.borradoEn == null && r.diasSemana.includes(dia));

  if (tocaban.length === 0) return { estado: 'no_aplica' };

  return {
    estado: 'desliz',
    motivo:
      tocaban.length === 1
        ? `Tocaba «${tocaban[0]!.nombre}» y no se registró`
        : `Tocaban ${tocaban.length} rutinas y no se registró ninguna`,
  };
}

export function estadoDelDia(
  fuentes: { comidas: readonly Comida[]; sesiones: readonly Sesion[]; rutinas: readonly Rutina[] },
  fecha: FechaISO,
): EstadoDelDia {
  const comidas = estadoComidas(fuentes.comidas, fecha);
  const entrenos = estadoEntrenos(fuentes.sesiones, fuentes.rutinas, fecha);

  const temasConDesliz =
    (comidas.estado === 'desliz' ? 1 : 0) + (entrenos.estado === 'desliz' ? 1 : 0);

  const hayAlgoQueJuzgar = comidas.estado !== 'no_aplica' || entrenos.estado !== 'no_aplica';

  const semaforo: Semaforo = !hayAlgoQueJuzgar
    ? 'sin_datos'
    : temasConDesliz === 0
      ? 'verde'
      : temasConDesliz === 1
        ? 'amarillo'
        : 'rojo';

  return { fecha, comidas, entrenos, semaforo, temasConDesliz };
}

/**
 * Semáforo de un solo tema, para cuando el historial se filtra.
 *
 * Con un tema no hay «amarillo»: o está limpio o tiene desliz. El amarillo
 * significa exactamente «uno de los dos», así que con un solo tema no existe.
 */
export function semaforoDeTema(estado: EstadoDelDia, tema: Tema): Semaforo {
  const t = tema === 'comidas' ? estado.comidas : estado.entrenos;
  if (t.estado === 'no_aplica') return 'sin_datos';
  return t.estado === 'limpio' ? 'verde' : 'rojo';
}

export const ETIQUETA_SEMAFORO: Record<Semaforo, string> = {
  verde: 'Sin deslices',
  amarillo: 'Un tema con desliz',
  rojo: 'Los dos temas con desliz',
  sin_datos: 'Sin datos',
};
