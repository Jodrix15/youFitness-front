/**
 * Tendencia de peso. El corazón analítico de la app.
 *
 * PRINCIPIO (§2 de la especificación): la media móvil de 7 días es el número
 * protagonista, y el pesaje de hoy queda en segundo plano. El peso diario oscila
 * uno o dos kilos por agua, sal, glucógeno y tránsito intestinal; la media
 * absorbe ese ruido y deja ver la señal.
 *
 * La media NO SE ALMACENA: se calcula siempre desde los pesajes. Así nunca queda
 * desincronizada si editas un pesaje del pasado.
 */

import type { FechaISO } from '../models/comunes';
import type { PesoRegistro } from '../models/peso';
import { redondear } from './composicion';
import { diasEntre, ordenarPorFecha } from './fechas';

/** Pesajes necesarios antes de enseñar tendencia. Especificación §6. */
export const UMBRAL_TENDENCIA = 7;

export const VENTANA_MEDIA = 7;

export type PuntoTendencia = {
  fecha: FechaISO;
  pesoKg: number;
  /** Media de los últimos 7 días con dato, incluido el actual. */
  media7: number;
};

/**
 * Calcula la media móvil sobre los pesajes ordenados.
 *
 * La ventana es de los **7 últimos registros**, no de los 7 últimos días
 * naturales. Si te saltas dos días, la media sigue usando siete pesajes reales
 * en vez de diluirse con huecos.
 */
export function serieConMedia(pesajes: readonly PesoRegistro[]): PuntoTendencia[] {
  const orden = ordenarPorFecha(pesajes);

  return orden.map((p, i) => {
    const desde = Math.max(0, i - (VENTANA_MEDIA - 1));
    const ventana = orden.slice(desde, i + 1);
    const suma = ventana.reduce((acc, x) => acc + x.pesoKg, 0);
    return {
      fecha: p.fecha,
      pesoKg: p.pesoKg,
      media7: redondear(suma / ventana.length, 2),
    };
  });
}

export type Tendencia =
  | { estado: 'sin_datos' }
  | { estado: 'bloqueada'; registrados: number; faltan: number }
  | {
      estado: 'lista';
      media7: number;
      ultimoPeso: number;
      ultimaFecha: FechaISO;
      /** Diferencia de la media respecto a la de hace 7 días. Negativa si baja. */
      cambioSemanalKg: number | null;
      serie: PuntoTendencia[];
    };

/**
 * Resuelve el estado de la tendencia.
 *
 * Con menos de 7 pesajes NO se muestra análisis (§6): la app no inventa
 * conclusiones con datos insuficientes, dice cuántos registros faltan.
 */
export function calcularTendencia(pesajes: readonly PesoRegistro[]): Tendencia {
  if (pesajes.length === 0) return { estado: 'sin_datos' };

  if (pesajes.length < UMBRAL_TENDENCIA) {
    return {
      estado: 'bloqueada',
      registrados: pesajes.length,
      faltan: UMBRAL_TENDENCIA - pesajes.length,
    };
  }

  const serie = serieConMedia(pesajes);
  const ultimo = serie[serie.length - 1]!;

  return {
    estado: 'lista',
    media7: ultimo.media7,
    ultimoPeso: ultimo.pesoKg,
    ultimaFecha: ultimo.fecha,
    cambioSemanalKg: cambioRespectoAHaceUnaSemana(serie),
    serie,
  };
}

/**
 * Cambio de la media respecto a la de hace siete días naturales.
 *
 * Se compara media contra media, nunca peso contra peso: comparar dos pesajes
 * sueltos mide sobre todo la diferencia de retención de agua entre dos mañanas.
 */
function cambioRespectoAHaceUnaSemana(serie: readonly PuntoTendencia[]): number | null {
  const ultimo = serie[serie.length - 1];
  if (!ultimo) return null;

  // El punto más reciente que esté al menos a 7 días de distancia.
  let referencia: PuntoTendencia | null = null;
  for (let i = serie.length - 2; i >= 0; i--) {
    const p = serie[i]!;
    if (diasEntre(p.fecha, ultimo.fecha) >= 7) {
      referencia = p;
      break;
    }
  }

  if (!referencia) return null;
  return redondear(ultimo.media7 - referencia.media7, 2);
}

export type ResumenPeso = {
  inicialKg: number;
  actualKg: number;
  /** Positivo cuando se ha perdido peso. */
  perdidoKg: number;
  objetivoKg: number | null;
  restanteKg: number | null;
  /** 0..1 del camino recorrido hacia el objetivo. */
  progreso: number | null;
};

/**
 * Resumen de inicio / perdido / restante.
 *
 * Usa la media cuando hay suficientes datos, y el último pesaje si no. Nunca
 * mezcla los dos criterios dentro del mismo resumen.
 */
export function resumirProgreso(params: {
  pesajes: readonly PesoRegistro[];
  pesoInicialKg: number;
  objetivoKg: number | null;
}): ResumenPeso | null {
  const { pesajes, pesoInicialKg, objetivoKg } = params;
  if (pesajes.length === 0) return null;

  const serie = serieConMedia(pesajes);
  const ultimo = serie[serie.length - 1]!;
  const actualKg = pesajes.length >= UMBRAL_TENDENCIA ? ultimo.media7 : ultimo.pesoKg;

  const perdidoKg = redondear(pesoInicialKg - actualKg, 1);

  if (objetivoKg == null) {
    return {
      inicialKg: pesoInicialKg,
      actualKg: redondear(actualKg, 1),
      perdidoKg,
      objetivoKg: null,
      restanteKg: null,
      progreso: null,
    };
  }

  const total = pesoInicialKg - objetivoKg;
  const restanteKg = redondear(actualKg - objetivoKg, 1);
  const progreso = total === 0 ? 1 : Math.max(0, Math.min(1, (pesoInicialKg - actualKg) / total));

  return {
    inicialKg: pesoInicialKg,
    actualKg: redondear(actualKg, 1),
    perdidoKg,
    objetivoKg,
    restanteKg,
    progreso,
  };
}
