/**
 * Construcción de eventos de XP.
 *
 * Un único sitio donde se decide cuánto vale cada acción y cómo se aplica el
 * multiplicador. Las pantallas no calculan XP: piden el evento a estas funciones
 * y lo guardan.
 */

import type { FechaISO, Uuid } from '../models/comunes';
import type { NuevoXpEvento, TipoXpEvento, XpEvento } from '../models/xp';
import { multiplicadorRacha, XP } from './xp';

type Contexto = {
  fecha: FechaISO;
  hora: string;
  diasDeRacha: number;
};

/**
 * Crea un evento que SUMA, aplicando el multiplicador de racha.
 *
 * El multiplicador solo toca lo que suma. Ver `penalizacion` para lo contrario.
 */
export function recompensa(params: {
  tipo: TipoXpEvento;
  xpBase: number;
  contexto: Contexto;
  origenTabla?: string;
  origenId?: Uuid;
  nota?: string;
}): NuevoXpEvento {
  const { tipo, xpBase, contexto, origenTabla, origenId, nota } = params;
  const multiplicador = multiplicadorRacha(contexto.diasDeRacha);

  return {
    fecha: contexto.fecha,
    hora: contexto.hora,
    tipo,
    origenTabla: origenTabla ?? null,
    origenId: origenId ?? null,
    xpBase,
    multiplicador,
    xpFinal: Math.round(xpBase * multiplicador),
    nota: nota ?? null,
  };
}

/**
 * Crea un evento que RESTA.
 *
 * Nunca lleva multiplicador: venir de buena racha no puede hacer que un fallo
 * duela más. Y solo se emite con modo estricto activado (§5).
 */
export function penalizacion(params: {
  tipo: TipoXpEvento;
  xpBase: number;
  fecha: FechaISO;
  hora: string;
  origenTabla?: string;
  origenId?: Uuid;
  nota?: string;
}): NuevoXpEvento {
  const { tipo, xpBase, fecha, hora, origenTabla, origenId, nota } = params;
  const magnitud = -Math.abs(xpBase);

  return {
    fecha,
    hora,
    tipo,
    origenTabla: origenTabla ?? null,
    origenId: origenId ?? null,
    xpBase: magnitud,
    multiplicador: 1,
    xpFinal: magnitud,
    nota: nota ?? null,
  };
}

/** Evento de haber registrado el peso. +25 XP, por el multiplicador de racha. */
export function eventoPesoRegistrado(params: {
  pesajeId: Uuid;
  contexto: Contexto;
}): NuevoXpEvento {
  return recompensa({
    tipo: 'peso_registrado',
    xpBase: XP.registrarPeso,
    contexto: params.contexto,
    origenTabla: 'peso_registro',
    origenId: params.pesajeId,
  });
}

/** Total de XP. El nivel y el rango salen de aquí, nunca de un contador. */
export function totalXp(eventos: readonly XpEvento[]): number {
  return eventos.reduce((acc, e) => acc + e.xpFinal, 0);
}

/** Desglose por tipo, para la pantalla «de dónde sale tu XP». */
export function xpPorTipo(eventos: readonly XpEvento[]): Map<TipoXpEvento, number> {
  const mapa = new Map<TipoXpEvento, number>();
  for (const e of eventos) {
    mapa.set(e.tipo, (mapa.get(e.tipo) ?? 0) + e.xpFinal);
  }
  return mapa;
}

/** XP conseguido en un día concreto. */
export function xpDelDia(eventos: readonly XpEvento[], fecha: FechaISO): number {
  return eventos.filter((e) => e.fecha === fecha).reduce((acc, e) => acc + e.xpFinal, 0);
}
