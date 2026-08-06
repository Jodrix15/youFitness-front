/**
 * Presupuesto semanal de deslices y detección de patrones.
 *
 * PRINCIPIO NÚMERO UNO (§2): registrar nunca se castiga. Anotar un desliz
 * siempre da +15 XP y mantiene la racha. El castigo es por el comportamiento, y
 * solo a partir del tercero de la semana, con modo estricto activado.
 *
 * Si confesar costara puntos, dejarías de confesar, y se perdería el dato más
 * valioso que produce la app.
 *
 * Por el mismo motivo NO existe racha de «días limpios» (§10): romperla
 * castigaría indirectamente el registro honesto.
 */

import type { Comida, DeslizDetalle, Disparador } from '../models/comida';
import type { FechaISO } from '../models/comunes';
import { desdeFechaISO, aFechaISO } from './fechas';

/** Deslices por semana natural que no penalizan. */
export const PRESUPUESTO_SEMANAL = 2;

/** Deslices necesarios antes de afirmar un patrón. Especificación §6. */
export const UMBRAL_PATRONES = 5;

export type PrimerDia = 'lunes' | 'domingo';

/** Primer día de la semana natural que contiene esa fecha. */
export function inicioDeSemana(fecha: FechaISO, primerDia: PrimerDia = 'lunes'): FechaISO {
  const d = desdeFechaISO(fecha);
  const diaSemana = d.getDay(); // 0 = domingo
  const desplazamiento = primerDia === 'lunes' ? (diaSemana + 6) % 7 : diaSemana;
  d.setDate(d.getDate() - desplazamiento);
  return aFechaISO(d);
}

export type EstadoPresupuesto = {
  usados: number;
  presupuesto: number;
  restantes: number;
  /** A partir de aquí, cada desliz penaliza con modo estricto. */
  sobrePresupuesto: boolean;
};

export function presupuestoDeLaSemana(
  comidas: readonly Comida[],
  fecha: FechaISO,
  presupuesto = PRESUPUESTO_SEMANAL,
  primerDia: PrimerDia = 'lunes',
): EstadoPresupuesto {
  const desde = inicioDeSemana(fecha, primerDia);
  const usados = comidas.filter(
    (c) => c.esDesliz && c.borradoEn == null && c.fecha >= desde && c.fecha <= fecha,
  ).length;

  return {
    usados,
    presupuesto,
    restantes: Math.max(0, presupuesto - usados),
    sobrePresupuesto: usados > presupuesto,
  };
}

/**
 * ¿El desliz que se está registrando ahora supera el presupuesto?
 *
 * Se pregunta ANTES de guardarlo: `usados` son los que ya había. El primero y el
 * segundo de la semana no penalizan; del tercero en adelante, sí.
 */
export function superaPresupuesto(usadosAntes: number, presupuesto = PRESUPUESTO_SEMANAL): boolean {
  return usadosAntes >= presupuesto;
}

export type Patron = {
  texto: string;
  peso: number;
};

export type AnalisisDeslices =
  | { estado: 'bloqueado'; registrados: number; faltan: number }
  | { estado: 'listo'; total: number; patrones: Patron[] };

/**
 * Busca patrones en los deslices registrados.
 *
 * Con menos de cinco no se afirma nada (§6): cualquier «patrón» sobre tres
 * datos es casualidad, y enseñarlo entrenaría a desconfiar de la app.
 *
 * Lo que devuelve son OBSERVACIONES, no causas. El texto nunca dice «porque».
 */
export function analizarDeslices(
  comidas: readonly Comida[],
  detalles: readonly DeslizDetalle[],
): AnalisisDeslices {
  const deslices = comidas.filter((c) => c.esDesliz && c.borradoEn == null);

  if (deslices.length < UMBRAL_PATRONES) {
    return {
      estado: 'bloqueado',
      registrados: deslices.length,
      faltan: UMBRAL_PATRONES - deslices.length,
    };
  }

  const patrones: Patron[] = [];

  // Franja horaria dominante.
  const franjas = new Map<string, number>();
  for (const d of deslices) {
    if (!d.hora) continue;
    const h = Number(d.hora.slice(0, 2));
    if (!Number.isFinite(h)) continue;
    const franja = etiquetaFranja(h);
    franjas.set(franja, (franjas.get(franja) ?? 0) + 1);
  }
  const franjaTop = mayor(franjas);
  if (franjaTop && franjaTop[1] >= 3) {
    patrones.push({
      texto: `${franjaTop[1]} de tus ${deslices.length} deslices caen ${franjaTop[0]}.`,
      peso: franjaTop[1],
    });
  }

  // Disparador dominante.
  const ids = new Set(deslices.map((d) => d.id));
  const disparadores = new Map<Disparador, number>();
  for (const d of detalles) {
    if (!ids.has(d.comidaId) || !d.disparador) continue;
    disparadores.set(d.disparador, (disparadores.get(d.disparador) ?? 0) + 1);
  }
  const dispTop = mayor(disparadores);
  if (dispTop && dispTop[1] >= 3) {
    patrones.push({
      texto: `El disparador que más se repite es «${etiquetaDisparador(dispTop[0] as Disparador)}», en ${dispTop[1]} ocasiones.`,
      peso: dispTop[1],
    });
  }

  // Día de la semana dominante.
  const dias = new Map<string, number>();
  for (const d of deslices) {
    const nombre = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(
      desdeFechaISO(d.fecha),
    );
    dias.set(nombre, (dias.get(nombre) ?? 0) + 1);
  }
  const diaTop = mayor(dias);
  if (diaTop && diaTop[1] >= 3) {
    patrones.push({ texto: `Los ${diaTop[0]} concentran ${diaTop[1]} de ellos.`, peso: diaTop[1] });
  }

  return {
    estado: 'listo',
    total: deslices.length,
    patrones: patrones.sort((a, b) => b.peso - a.peso),
  };
}

function etiquetaFranja(hora: number): string {
  if (hora < 6) return 'de madrugada';
  if (hora < 12) return 'por la mañana';
  if (hora < 17) return 'a mediodía';
  if (hora < 21) return 'entre las 17:00 y las 21:00';
  return 'por la noche';
}

function etiquetaDisparador(d: Disparador): string {
  const mapa: Record<Disparador, string> = {
    estres: 'estrés',
    aburrimiento: 'aburrimiento',
    poco_sueno: 'poco sueño',
    hambre_real: 'hambre real',
    evento_social: 'evento social',
    bajon: 'bajón',
    estaba_a_mano: 'estaba a mano',
  };
  return mapa[d];
}

function mayor<K>(mapa: Map<K, number>): [K, number] | null {
  let top: [K, number] | null = null;
  for (const entrada of mapa) {
    if (!top || entrada[1] > top[1]) top = entrada;
  }
  return top;
}
