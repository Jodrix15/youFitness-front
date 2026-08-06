/**
 * Misiones de hoy: los objetivos activos, resueltos contra lo registrado.
 *
 * Solo se evalúan las métricas que la app puede medir HOY. Una métrica cuyo
 * bloque aún no existe no se marca como incumplida —sería mentir— sino como
 * pendiente de ese bloque.
 */

import type { Metrica, Objetivo } from '../models/objetivo';

export type EstadoMision = 'cumplida' | 'pendiente' | 'no_medible';

export type Mision = {
  objetivoId: string;
  nombre: string;
  detalle: string;
  xp: number;
  estado: EstadoMision;
};

/** Hechos verificables del día, que resuelve la capa de datos. */
export type HechosDelDia = {
  pesajeRegistrado: boolean;
  checkinCerrado: boolean;
};

/** Métricas que hoy se pueden resolver. El resto espera a su bloque. */
const MEDIBLES: ReadonlySet<Metrica> = new Set<Metrica>(['pesajes', 'checkins']);

const BLOQUE_DE: Partial<Record<Metrica, string>> = {
  comidas_registradas: 'Bloque 3',
  deslices: 'Bloque 3',
  sesiones: 'Bloque 4',
  habitos_cumplidos: 'Bloque 4',
  pasos: 'build nativa',
  peso_kg: 'objetivo de largo plazo',
};

export function misionesDelDia(
  objetivos: readonly Objetivo[],
  hechos: HechosDelDia,
): Mision[] {
  return objetivos
    .filter((o) => o.activo && o.mostrarInicio && o.periodo !== 'hito')
    .map((o) => {
      if (!MEDIBLES.has(o.metrica)) {
        return {
          objetivoId: o.id,
          nombre: o.nombre,
          detalle: `Se podrá medir con ${BLOQUE_DE[o.metrica] ?? 'su bloque'}`,
          xp: o.xp,
          estado: 'no_medible' as const,
        };
      }

      const cumplida =
        o.metrica === 'pesajes' ? hechos.pesajeRegistrado : hechos.checkinCerrado;

      return {
        objetivoId: o.id,
        nombre: o.nombre,
        detalle: cumplida ? 'Hecho hoy' : 'Todavía no',
        xp: o.xp,
        estado: cumplida ? ('cumplida' as const) : ('pendiente' as const),
      };
    });
}
