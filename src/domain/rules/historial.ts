/**
 * Historial: los cuatro niveles de zoom. Especificación §3, pantallas 31 a 34.
 *
 * PRINCIPIO 4 de la especificación: **nada se archiva**. Sin límite de
 * antigüedad, sin comprimir los datos viejos, sin «últimos N días». Desde el
 * resumen de toda tu vida hasta el día concreto de hace tres años.
 *
 * Todo se agrega aquí, sobre las mismas listas que ya usan las demás pantallas.
 * No hay tablas de resumen precalculadas: si editas un pesaje de hace un año, el
 * mes, el año y los totales de por vida cambian solos.
 */

import type { Checkin } from '../models/checkin';
import type { Comida } from '../models/comida';
import type { FechaISO } from '../models/comunes';
import type { Sesion } from '../models/entreno';
import type { PesoRegistro } from '../models/peso';
import type { XpEvento } from '../models/xp';
import { componerDia, type ComposicionDia } from './composicionDia';
import { redondear } from './composicion';
import { aFechaISO, desdeFechaISO } from './fechas';

export type FuentesHistorial = {
  pesajes: readonly PesoRegistro[];
  comidas: readonly Comida[];
  sesiones: readonly Sesion[];
  checkins: readonly Checkin[];
  eventos: readonly XpEvento[];
};

// ── Nivel 1: un día ────────────────────────────────────────────────────────

export type ResumenDia = {
  fecha: FechaISO;
  pesaje: PesoRegistro | null;
  comidas: ComposicionDia;
  sesiones: Sesion[];
  checkin: Checkin | null;
  xp: number;
  /** Si hubo algún registro. Lo que decide si el día se pinta como activo. */
  tieneAlgo: boolean;
  /** Alguna fila se editó después de crearla. El historial lo marca. */
  editado: boolean;
};

export function resumirDia(fuentes: FuentesHistorial, fecha: FechaISO): ResumenDia {
  const comidas = componerDia(fuentes.comidas, fecha);
  const sesiones = fuentes.sesiones.filter((s) => s.fecha === fecha && s.terminada);
  const pesaje = fuentes.pesajes.find((p) => p.fecha === fecha) ?? null;
  const checkin = fuentes.checkins.find((c) => c.fecha === fecha) ?? null;
  const xp = fuentes.eventos.filter((e) => e.fecha === fecha).reduce((a, e) => a + e.xpFinal, 0);

  return {
    fecha,
    pesaje,
    comidas,
    sesiones,
    checkin,
    xp,
    tieneAlgo:
      pesaje != null || checkin != null || sesiones.length > 0 || comidas.comidas.length > 0,
    editado: comidas.comidas.some((c) => c.editadoEn != null),
  };
}

// ── Nivel 2: un mes ────────────────────────────────────────────────────────

export type DiaDelMes = {
  fecha: FechaISO;
  dia: number;
  /** 0 = nada, 1..4 = cuánta actividad hubo. Alimenta el mapa de calor. */
  intensidad: number;
  xp: number;
};

export type ResumenMes = {
  anio: number;
  /** 1..12 */
  mes: number;
  dias: DiaDelMes[];
  diasConRegistro: number;
  diasDelMes: number;
  xpTotal: number;
  pesajes: number;
  comidas: number;
  sesiones: number;
  checkins: number;
  /** Media de los pesajes del mes, si hubo alguno. */
  pesoMedio: number | null;
  volumenKg: number;
};

/**
 * Intensidad de un día, de 0 a 4.
 *
 * Cuenta CATEGORÍAS distintas, no registros: un día con pesaje, comida, entreno
 * y check-in es un día completo. Contar registros haría que quince comidas
 * parecieran mejor día que un entreno más un check-in, que es al revés.
 */
function intensidadDe(dia: ResumenDia): number {
  let n = 0;
  if (dia.pesaje) n++;
  if (dia.comidas.comidas.length > 0) n++;
  if (dia.sesiones.length > 0) n++;
  if (dia.checkin) n++;
  return n;
}

export function resumirMes(fuentes: FuentesHistorial, anio: number, mes: number): ResumenMes {
  const diasDelMes = new Date(anio, mes, 0).getDate();

  const dias: DiaDelMes[] = [];
  let xpTotal = 0;
  let pesajes = 0;
  let comidas = 0;
  let sesiones = 0;
  let checkins = 0;
  let volumenKg = 0;
  const pesos: number[] = [];

  for (let d = 1; d <= diasDelMes; d++) {
    const fecha = aFechaISO(new Date(anio, mes - 1, d));
    const resumen = resumirDia(fuentes, fecha);

    dias.push({ fecha, dia: d, intensidad: intensidadDe(resumen), xp: resumen.xp });

    xpTotal += resumen.xp;
    if (resumen.pesaje) {
      pesajes++;
      pesos.push(resumen.pesaje.pesoKg);
    }
    comidas += resumen.comidas.comidas.length;
    sesiones += resumen.sesiones.length;
    volumenKg += resumen.sesiones.reduce((a, s) => a + s.volumenTotal, 0);
    if (resumen.checkin) checkins++;
  }

  return {
    anio,
    mes,
    dias,
    diasConRegistro: dias.filter((d) => d.intensidad > 0).length,
    diasDelMes,
    xpTotal,
    pesajes,
    comidas,
    sesiones,
    checkins,
    pesoMedio: pesos.length > 0 ? redondear(pesos.reduce((a, b) => a + b, 0) / pesos.length, 1) : null,
    volumenKg: redondear(volumenKg, 0),
  };
}

// ── Nivel 3: un año ────────────────────────────────────────────────────────

export type ResumenAnio = {
  anio: number;
  meses: ResumenMes[];
  diasConRegistro: number;
  xpTotal: number;
  sesiones: number;
  pesajes: number;
  /** Todos los días del año, para el mapa de calor. */
  dias: DiaDelMes[];
};

export function resumirAnio(fuentes: FuentesHistorial, anio: number): ResumenAnio {
  const meses = Array.from({ length: 12 }, (_, i) => resumirMes(fuentes, anio, i + 1));
  const dias = meses.flatMap((m) => m.dias);

  return {
    anio,
    meses,
    dias,
    diasConRegistro: dias.filter((d) => d.intensidad > 0).length,
    xpTotal: meses.reduce((a, m) => a + m.xpTotal, 0),
    sesiones: meses.reduce((a, m) => a + m.sesiones, 0),
    pesajes: meses.reduce((a, m) => a + m.pesajes, 0),
  };
}

// ── Nivel 4: todo ──────────────────────────────────────────────────────────

export type ResumenTotal = {
  /** Años con algún registro, de más reciente a más antiguo. */
  anios: number[];
  primerRegistro: FechaISO | null;
  ultimoRegistro: FechaISO | null
  diasRegistrados: number;
  /** Cuántas cosas has anotado en total: pesajes, comidas, entrenos y cierres. */
  registrosTotales: number;
  xpTotal: number;
  pesajes: number;
  comidas: number;
  deslices: number;
  sesiones: number;
  checkins: number;
  seriesTotales: number;
  volumenKg: number;
  /** Diferencia entre el primer y el último pesaje. Negativa si has bajado. */
  cambioDePesoKg: number | null;
};

export function resumirTodo(fuentes: FuentesHistorial): ResumenTotal {
  const fechas = new Set<FechaISO>();
  for (const p of fuentes.pesajes) fechas.add(p.fecha);
  for (const c of fuentes.comidas) fechas.add(c.fecha);
  for (const s of fuentes.sesiones) if (s.terminada) fechas.add(s.fecha);
  for (const c of fuentes.checkins) fechas.add(c.fecha);

  const ordenadas = [...fechas].sort();
  const anios = [...new Set(ordenadas.map((f) => desdeFechaISO(f).getFullYear()))].sort(
    (a, b) => b - a,
  );

  const terminadas = fuentes.sesiones.filter((s) => s.terminada);
  const primerPeso = fuentes.pesajes[0];
  const ultimoPeso = fuentes.pesajes[fuentes.pesajes.length - 1];

  return {
    anios,
    primerRegistro: ordenadas[0] ?? null,
    ultimoRegistro: ordenadas[ordenadas.length - 1] ?? null,
    diasRegistrados: ordenadas.length,
    registrosTotales:
      fuentes.pesajes.length + fuentes.comidas.length + terminadas.length + fuentes.checkins.length,
    xpTotal: fuentes.eventos.reduce((a, e) => a + e.xpFinal, 0),
    pesajes: fuentes.pesajes.length,
    comidas: fuentes.comidas.filter((c) => !c.esDesliz).length,
    deslices: fuentes.comidas.filter((c) => c.esDesliz).length,
    sesiones: terminadas.length,
    checkins: fuentes.checkins.length,
    seriesTotales: terminadas.reduce((a, s) => a + s.series.length, 0),
    volumenKg: redondear(
      terminadas.reduce((a, s) => a + s.volumenTotal, 0),
      0,
    ),
    cambioDePesoKg:
      primerPeso && ultimoPeso && fuentes.pesajes.length > 1
        ? redondear(ultimoPeso.pesoKg - primerPeso.pesoKg, 1)
        : null,
  };
}
