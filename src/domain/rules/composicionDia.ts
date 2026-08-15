/**
 * Composición del día en raciones.
 *
 * Sustituye a los anillos de calorías y a las barras de macros en gramos. No
 * hay «nota de calidad» ni puntuación: sería un número inventado que moraliza
 * sobre la comida, en la misma app que dedica una pantalla entera a no hacerlo.
 */

import { COMIDAS_PRINCIPALES, type Comida, type TipoComida } from '../models/comida';
import type { FechaISO } from '../models/comunes';

/** Objetivos de referencia diarios. Orientativos, no prescripción. */
export const OBJETIVO_DIARIO = {
  /** Comidas principales con al menos una ración de proteína. */
  comidasConProteina: 3,
  verduraRaciones: 4,
  hidratosRaciones: 4,
} as const;

export type ResumenGrupo = {
  raciones: number;
  objetivo: number;
  /** 0..1, recortado. */
  progreso: number;
  detalle: string;
};

export type ComposicionDia = {
  fecha: FechaISO;
  comidas: Comida[];
  /**
   * Comidas principales cubiertas hoy, de 0 a 3. Los snacks no cuentan; un
   * desliz anotado como desayuno, comida o cena SÍ.
   */
  principalesRegistradas: number;
  /** Qué comidas principales faltan por registrar. */
  faltan: TipoComida[];
  /** Un día está completo con las tres principales registradas. */
  completo: boolean;
  proteina: ResumenGrupo;
  verdura: ResumenGrupo;
  hidratos: ResumenGrupo;
  grasa: ResumenGrupo;
  deslices: number;
};

export function componerDia(
  comidas: readonly Comida[],
  fecha: FechaISO,
  /** Objetivo de verdura configurable desde Ajustes. */
  objetivoVerdura: number = OBJETIVO_DIARIO.verduraRaciones,
): ComposicionDia {
  const delDia = comidas.filter((c) => c.fecha === fecha && c.borradoEn == null);
  const normales = delDia.filter((c) => !c.esDesliz);

  /**
   * UN DESLIZ TAMBIÉN OCUPA SU COMIDA.
   *
   * Si cenaste pizza y la anotaste como cena, la cena está registrada: seguir
   * diciendo «te falta la cena» sería la app ignorando lo que le acabas de
   * contar, y el castigo por haber sido honesto. Lo que el desliz no hace es
   * sumar raciones —la composición se calcula solo con `normales`— ni pintar el
   * día de verde: el semáforo del historial lo marca en rojo igual.
   */
  const principales = delDia.filter((c) => COMIDAS_PRINCIPALES.includes(c.tipo));
  const tiposRegistrados = new Set(principales.map((c) => c.tipo));
  const faltan = COMIDAS_PRINCIPALES.filter((t) => !tiposRegistrados.has(t));

  const suma = (campo: keyof Comida) =>
    normales.reduce((acc, c) => acc + (typeof c[campo] === 'number' ? (c[campo] as number) : 0), 0);

  // La proteína se mide en COMIDAS que la llevan, no en raciones totales:
  // repartirla a lo largo del día importa más que el total acumulado.
  const conProteina = principales.filter((c) => !c.esDesliz && c.protPorciones > 0).length;

  return {
    fecha,
    comidas: delDia,
    // Los tipos cubiertos, no las filas: dos cenas siguen siendo una cena.
    principalesRegistradas: tiposRegistrados.size,
    faltan,
    completo: faltan.length === 0,
    proteina: {
      raciones: conProteina,
      objetivo: OBJETIVO_DIARIO.comidasConProteina,
      progreso: recortar(conProteina / OBJETIVO_DIARIO.comidasConProteina),
      detalle: `${conProteina} de ${OBJETIVO_DIARIO.comidasConProteina} comidas`,
    },
    verdura: grupo(suma('verdPorciones'), objetivoVerdura),
    hidratos: grupo(suma('hidrPorciones'), OBJETIVO_DIARIO.hidratosRaciones),
    grasa: grupo(suma('grasPorciones'), 3),
    deslices: delDia.filter((c) => c.esDesliz).length,
  };
}

function grupo(raciones: number, objetivo: number): ResumenGrupo {
  return {
    raciones,
    objetivo,
    progreso: recortar(raciones / objetivo),
    detalle: raciones === 1 ? '1 ración' : `${raciones} raciones`,
  };
}

function recortar(v: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

/**
 * Racha de días COMPLETOS: los que tienen las tres comidas principales.
 *
 * Es distinta de la racha general de la app, que solo pide un registro
 * cualquiera. Aquí se mide constancia en el registro de comida.
 */
export function rachaDiasCompletos(comidas: readonly Comida[], fechaHoy: FechaISO): number {
  const completos = new Set<FechaISO>();
  const porFecha = new Map<FechaISO, Set<TipoComida>>();

  for (const c of comidas) {
    if (c.borradoEn != null) continue;
    // Igual que en `componerDia`: un desliz anotado como cena cubre la cena.
    if (!COMIDAS_PRINCIPALES.includes(c.tipo)) continue;
    const set = porFecha.get(c.fecha) ?? new Set<TipoComida>();
    set.add(c.tipo);
    porFecha.set(c.fecha, set);
  }

  for (const [fecha, tipos] of porFecha) {
    if (tipos.size === COMIDAS_PRINCIPALES.length) completos.add(fecha);
  }

  // Se cuenta hacia atrás desde hoy. Si hoy aún no está completo se empieza por
  // ayer: el día no ha terminado, y romper la racha a mediodía no tendría
  // sentido.
  let racha = 0;
  const cursor = new Date(fechaHoy);
  if (!completos.has(fechaHoy)) cursor.setDate(cursor.getDate() - 1);

  for (;;) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
      cursor.getDate(),
    ).padStart(2, '0')}`;
    if (!completos.has(iso)) break;
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}
