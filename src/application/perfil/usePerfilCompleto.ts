import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Uuid } from '../../domain/models/comunes';
import type { Perfil } from '../../domain/models/perfil';
import type { TipoXpEvento, XpEvento } from '../../domain/models/xp';
import { totalXp, xpPorTipo } from '../../domain/rules/eventosXp';
import { hoy } from '../../domain/rules/fechas';
import { resumirTodo, type FuentesHistorial, type ResumenTotal } from '../../domain/rules/historial';
import { calcularRacha, type Racha } from '../../domain/rules/racha';
import {
  estadoNivel,
  multiplicadorRacha,
  proximoRango,
  type EstadoNivel,
  type ProximoRango,
} from '../../domain/rules/xp';
import { useRepositorios } from '../../data/contenedor';
import { almacenAsyncStorage } from '../../platform/almacen';

export type OrigenXp = { tipo: TipoXpEvento; xp: number; porcentaje: number };

export type EstadoPerfil = {
  cargando: boolean;
  perfil: Perfil | null;
  nivel: EstadoNivel;
  proximoRango: ProximoRango | null;
  racha: Racha;
  totales: ResumenTotal;
  /** De dónde sale tu XP, de mayor a menor. Solo lo que suma. */
  origenes: OrigenXp[];
  /** XP perdido por penalizaciones, si hay modo estricto. */
  xpPerdido: number;
  /** Multiplicador de racha vigente, para la chapa de la cabecera. */
  multiplicador: number;
  /** Cuándo se hizo la última copia de seguridad descargada. */
  ultimaCopia: string | null;
  eventos: XpEvento[];
  recargar: () => Promise<void>;
};

/**
 * Estado de la pantalla de Perfil.
 *
 * Todo es derivado: rango, racha, totales de por vida y desglose de XP salen de
 * los mismos datos que el resto de la app. No hay ninguna cifra guardada aparte
 * que pueda contradecir a las demás pantallas.
 */
export function usePerfilCompleto(): EstadoPerfil {
  const repos = useRepositorios();
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [eventos, setEventos] = useState<XpEvento[]>([]);
  const [fechas, setFechas] = useState<string[]>([]);
  const [ultimaCopia, setUltimaCopia] = useState<string | null>(null);
  const [fuentes, setFuentes] = useState<FuentesHistorial>({
    pesajes: [],
    comidas: [],
    sesiones: [],
    checkins: [],
    eventos: [],
  });

  const recargar = useCallback(async () => {
    const p = await repos.perfil.obtener();
    setPerfil(p);
    setUltimaCopia(await almacenAsyncStorage.leer<string>('ajustes:ultima_copia'));

    if (!p) {
      setCargando(false);
      return;
    }

    const id: Uuid = p.usuarioId;
    const [ev, f, pesajes, comidas, sesiones, checkins] = await Promise.all([
      repos.xp.listar(id),
      repos.xp.fechasConActividad(id),
      repos.peso.listar(id),
      repos.comidas.listar(id),
      repos.sesiones.listar(id),
      repos.checkins.listar(id),
    ]);

    setEventos(ev);
    setFechas(f);
    setFuentes({ pesajes, comidas, sesiones, checkins, eventos: ev });
    setCargando(false);
  }, [repos]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const xpTotal = useMemo(() => totalXp(eventos), [eventos]);
  const racha = useMemo(() => calcularRacha(fechas, hoy()), [fechas]);

  return {
    cargando,
    perfil,
    ultimaCopia,
    nivel: useMemo(() => estadoNivel(xpTotal), [xpTotal]),
    proximoRango: useMemo(() => proximoRango(xpTotal), [xpTotal]),
    racha,
    multiplicador: multiplicadorRacha(racha.actual),
    totales: useMemo(() => resumirTodo(fuentes), [fuentes]),

    /**
     * Solo se listan los orígenes que SUMAN. Las penalizaciones van aparte, en
     * su propia cifra: mezclarlas en la misma lista haría que un tipo apareciera
     * con signo negativo entre los demás y se leería como si registrar restara.
     */
    origenes: useMemo(() => {
      const mapa = xpPorTipo(eventos);
      const positivos = [...mapa.entries()].filter(([, xp]) => xp > 0);
      const suma = positivos.reduce((a, [, xp]) => a + xp, 0);

      return positivos
        .map(([tipo, xp]) => ({
          tipo,
          xp,
          porcentaje: suma === 0 ? 0 : xp / suma,
        }))
        .sort((a, b) => b.xp - a.xp);
    }, [eventos]),

    xpPerdido: useMemo(
      () => eventos.filter((e) => e.xpFinal < 0).reduce((a, e) => a + e.xpFinal, 0),
      [eventos],
    ),

    eventos,
    recargar,
  };
}
