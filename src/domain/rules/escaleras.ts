/**
 * Evaluación de escalones. Especificación §6.
 *
 * REGLA CENTRAL: el evaluador comprueba el criterio después de cada sesión y,
 * si se cumple, OFRECE el ascenso. Nunca lo aplica solo.
 *
 * El motivo no es cortesía: el criterio mide lo que la app puede ver —series,
 * repeticiones, RIR declarado—, y no ve si la técnica se rompió en la última
 * repetición. Quien decide si de verdad domina el escalón eres tú.
 */

import type { Escalera, Escalon } from '../models/escalera';
import type { Serie, Sesion } from '../models/entreno';

export type EvaluacionEscalon =
  | { estado: 'sin_datos'; faltan: string }
  | { estado: 'en_progreso'; seriesValidas: number; requeridas: number; faltan: string }
  | { estado: 'cumplido'; seriesValidas: number; enSesion: string };

/**
 * ¿Se cumple el criterio del escalón en alguna sesión?
 *
 * El criterio tiene que cumplirse en UNA MISMA sesión. Sumar series buenas de
 * días distintos no demuestra que domines el movimiento: demuestra que un día
 * bueno te salieron tres.
 */
export function evaluarEscalon(
  escalon: Escalon,
  sesiones: readonly Sesion[],
): EvaluacionEscalon {
  if (!escalon.ejercicioId) {
    return { estado: 'sin_datos', faltan: 'Este escalón no tiene ejercicio asociado' };
  }

  const cumpleSerie = (s: Serie): boolean => {
    if (s.ejercicioId !== escalon.ejercicioId) return false;

    if (escalon.criterioReps != null && (s.reps ?? 0) < escalon.criterioReps) return false;
    if (escalon.criterioSegundos != null && (s.segundos ?? 0) < escalon.criterioSegundos) return false;

    // El RIR es el margen que te sobró. Se exige un mínimo para que el escalón
    // se supere con holgura, no arañando la última repetición.
    if (escalon.criterioRir != null) {
      if (s.rir == null || s.rir < escalon.criterioRir) return false;
    }

    return true;
  };

  const terminadas = sesiones.filter((s) => s.terminada);
  if (terminadas.length === 0) {
    return { estado: 'sin_datos', faltan: descripcionCriterio(escalon) };
  }

  let mejor = 0;
  let mejorSesion: Sesion | null = null;

  for (const sesion of terminadas) {
    const validas = sesion.series.filter(cumpleSerie).length;
    if (validas > mejor) {
      mejor = validas;
      mejorSesion = sesion;
    }
  }

  if (mejor >= escalon.criterioSeries && mejorSesion) {
    return { estado: 'cumplido', seriesValidas: mejor, enSesion: mejorSesion.fecha };
  }

  return {
    estado: 'en_progreso',
    seriesValidas: mejor,
    requeridas: escalon.criterioSeries,
    faltan: descripcionCriterio(escalon),
  };
}

export function descripcionCriterio(escalon: Escalon): string {
  if (escalon.criterioTexto) return escalon.criterioTexto;

  const partes: string[] = [`${escalon.criterioSeries} series`];
  if (escalon.criterioReps != null) partes.push(`× ${escalon.criterioReps} reps`);
  if (escalon.criterioSegundos != null) partes.push(`× ${escalon.criterioSegundos} s`);
  if (escalon.criterioRir != null) partes.push(`con RIR ≥ ${escalon.criterioRir}`);

  return partes.join(' ');
}

export type EstadoEscalera = {
  escalera: Escalera;
  actual: Escalon | null;
  siguiente: Escalon | null;
  evaluacion: EvaluacionEscalon | null;
  /** true cuando se puede ofrecer el ascenso. */
  puedeAscender: boolean;
  completada: boolean;
};

export function estadoDeEscalera(
  escalera: Escalera,
  sesiones: readonly Sesion[],
): EstadoEscalera {
  const orden = [...escalera.escalones].sort((a, b) => a.orden - b.orden);
  const actual = orden[escalera.escalonActual] ?? null;
  const siguiente = orden[escalera.escalonActual + 1] ?? null;

  const evaluacion = actual ? evaluarEscalon(actual, sesiones) : null;

  return {
    escalera,
    actual,
    siguiente,
    evaluacion,
    puedeAscender: evaluacion?.estado === 'cumplido' && siguiente != null,
    completada: actual != null && siguiente == null && evaluacion?.estado === 'cumplido',
  };
}

/**
 * Aviso que acompaña al ascenso.
 *
 * Bajar de repeticiones al subir de escalón es NORMAL y hay que decirlo: si
 * pasas de doce dominadas negativas a tres completas, la gráfica cae en picado
 * y sin explicación parece un retroceso. Es justo lo contrario.
 */
export const AVISO_ASCENSO =
  'Al cambiar de escalón vas a hacer menos repeticiones que antes, y es lo esperado: el movimiento nuevo es más difícil. La gráfica marcará el cambio para que no parezca un retroceso.';
