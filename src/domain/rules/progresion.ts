/**
 * Progresión de un ejercicio a lo largo del tiempo.
 *
 * Todo se deriva de las series ya registradas. No hay tabla de «mejores marcas»
 * que mantener: si editas o borras una sesión, la progresión se recalcula sola.
 */

import type { FechaISO } from '../models/comunes';
import type { Ejercicio, Serie, Sesion } from '../models/entreno';
import { redondear } from './composicion';
import { estimar1RM, type Estimacion1RM } from './volumen';

export type PuntoProgresion = {
  fecha: FechaISO;
  /** Mejor serie del día, en la magnitud que importa según el tipo. */
  mejor: number;
  volumen: number;
  series: number;
  reps: number;
  /** Solo en peso externo. */
  unaRM: Estimacion1RM | null;
};

export type Progresion = {
  ejercicio: Ejercicio;
  puntos: PuntoProgresion[];
  /** Qué mide `mejor`, para poder etiquetarlo en la interfaz. */
  magnitud: 'peso' | 'reps' | 'segundos' | 'volumen';
  unidad: string;
  totalSeries: number;
  totalSesiones: number;
  mejorHistorico: number;
  /** Diferencia entre el mejor de la última sesión y el de la primera. */
  mejoraDesdeElInicio: number | null;
};

const MAGNITUD_POR_TIPO = {
  externo: { magnitud: 'peso', unidad: 'kg' },
  corporal: { magnitud: 'reps', unidad: 'reps' },
  corporal_lastre: { magnitud: 'volumen', unidad: 'kg' },
  isometrico: { magnitud: 'segundos', unidad: 's' },
  cardio: { magnitud: 'segundos', unidad: 's' },
} as const;

function valorDe(serie: Serie, magnitud: Progresion['magnitud']): number {
  switch (magnitud) {
    case 'peso':
      return serie.pesoKg ?? 0;
    case 'reps':
      return serie.reps ?? 0;
    case 'segundos':
      return serie.segundos ?? 0;
    case 'volumen':
      return serie.volumen;
  }
}

/**
 * Construye la progresión de un ejercicio a partir de las sesiones terminadas.
 *
 * Se agrupa POR DÍA y se guarda la mejor serie de cada uno, no todas. Una
 * gráfica con las cuarenta series de un mes es ruido; lo que dice si mejoras es
 * la mejor serie de cada sesión.
 */
export function construirProgresion(
  ejercicio: Ejercicio,
  sesiones: readonly Sesion[],
): Progresion {
  const { magnitud, unidad } = MAGNITUD_POR_TIPO[ejercicio.tipo];

  const porFecha = new Map<FechaISO, PuntoProgresion>();

  for (const sesion of sesiones) {
    if (!sesion.terminada) continue;

    const suyas = sesion.series.filter((s) => s.ejercicioId === ejercicio.id);
    if (suyas.length === 0) continue;

    const mejorSerie = suyas.reduce((a, b) =>
      valorDe(b, magnitud) > valorDe(a, magnitud) ? b : a,
    );

    const punto: PuntoProgresion = {
      fecha: sesion.fecha,
      mejor: valorDe(mejorSerie, magnitud),
      volumen: redondear(
        suyas.reduce((acc, s) => acc + s.volumen, 0),
        1,
      ),
      series: suyas.length,
      reps: suyas.reduce((acc, s) => acc + (s.reps ?? 0), 0),
      unaRM:
        ejercicio.tipo === 'externo' && mejorSerie.pesoKg && mejorSerie.reps
          ? estimar1RM(mejorSerie.pesoKg, mejorSerie.reps)
          : null,
    };

    // Dos sesiones el mismo día se combinan: cuenta el día, no la sesión.
    const previo = porFecha.get(sesion.fecha);
    porFecha.set(
      sesion.fecha,
      previo
        ? {
            ...punto,
            mejor: Math.max(previo.mejor, punto.mejor),
            volumen: redondear(previo.volumen + punto.volumen, 1),
            series: previo.series + punto.series,
            reps: previo.reps + punto.reps,
            unaRM: (previo.unaRM?.kg ?? 0) > (punto.unaRM?.kg ?? 0) ? previo.unaRM : punto.unaRM,
          }
        : punto,
    );
  }

  const puntos = [...porFecha.values()].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];

  return {
    ejercicio,
    puntos,
    magnitud,
    unidad,
    totalSeries: puntos.reduce((acc, p) => acc + p.series, 0),
    totalSesiones: puntos.length,
    mejorHistorico: puntos.reduce((acc, p) => Math.max(acc, p.mejor), 0),
    mejoraDesdeElInicio:
      primero && ultimo && puntos.length > 1 ? redondear(ultimo.mejor - primero.mejor, 1) : null,
  };
}

/** Ejercicios ordenados por uso, para la lista de progresión. */
export function ejerciciosMasUsados(
  ejercicios: readonly Ejercicio[],
  sesiones: readonly Sesion[],
): { ejercicio: Ejercicio; series: number }[] {
  const cuenta = new Map<string, number>();

  for (const s of sesiones) {
    if (!s.terminada) continue;
    for (const serie of s.series) {
      cuenta.set(serie.ejercicioId, (cuenta.get(serie.ejercicioId) ?? 0) + 1);
    }
  }

  return ejercicios
    .map((e) => ({ ejercicio: e, series: cuenta.get(e.id) ?? 0 }))
    .filter((x) => x.series > 0)
    .sort((a, b) => b.series - a.series);
}
