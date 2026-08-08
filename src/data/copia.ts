/**
 * Copias de seguridad. Especificación §7.
 *
 * Sin servidor, esto es lo único que hay entre tus datos y perderlos. Por eso
 * el formato es JSON plano y AUTOEXPLICATIVO: si el proyecto se abandona o la
 * app deja de arrancar, el fichero sigue siendo legible con cualquier editor de
 * texto y los datos siguen ahí.
 *
 * Nada de formatos binarios, nada de comprimir. Unos cientos de KB al año caben
 * en un correo.
 */

import type { Almacen } from '../platform/almacen';
import { PREFIJO } from '../platform/almacen';

export const VERSION_COPIA = 1;

export type Copia = {
  aplicacion: 'YouFitness';
  version: number;
  exportadoEn: string;
  /** Clave → contenido, tal cual está guardado. */
  datos: Record<string, unknown>;
};

/** Claves que NO se exportan porque describen el estado de las propias copias. */
const NO_EXPORTABLES = ['ajustes:ultima_copia'];

export async function exportar(almacen: Almacen): Promise<Copia> {
  const claves = (await almacen.clavesCon('')).filter((c) => !NO_EXPORTABLES.includes(c));

  const datos: Record<string, unknown> = {};
  for (const clave of claves) {
    datos[clave] = await almacen.leer(clave);
  }

  return {
    aplicacion: 'YouFitness',
    version: VERSION_COPIA,
    exportadoEn: new Date().toISOString(),
    datos,
  };
}

export type ResultadoImportacion =
  | { ok: true; claves: number }
  | { ok: false; motivo: string };

/**
 * Restaura una copia.
 *
 * SUSTITUYE todo lo que haya. No intenta fusionar: mezclar dos historiales sin
 * un criterio claro produce duplicados silenciosos, que es peor que perder los
 * datos porque no te enteras hasta meses después.
 *
 * Se valida antes de tocar nada. Un fichero corrupto no debe dejar la app a
 * medio restaurar.
 */
export async function importar(almacen: Almacen, crudo: unknown): Promise<ResultadoImportacion> {
  if (typeof crudo !== 'object' || crudo == null) {
    return { ok: false, motivo: 'El fichero no contiene un objeto JSON válido.' };
  }

  const copia = crudo as Partial<Copia>;

  if (copia.aplicacion !== 'YouFitness') {
    return { ok: false, motivo: 'Este fichero no es una copia de YouFitness.' };
  }

  if (typeof copia.version !== 'number' || copia.version > VERSION_COPIA) {
    return {
      ok: false,
      motivo: `La copia es de una versión más nueva (${String(copia.version)}). Actualiza la app antes de restaurarla.`,
    };
  }

  if (typeof copia.datos !== 'object' || copia.datos == null) {
    return { ok: false, motivo: 'La copia no contiene datos.' };
  }

  const entradas = Object.entries(copia.datos);

  // Se limpia lo que hay antes de escribir, para que restaurar una copia sin
  // comidas no deje las comidas viejas mezcladas con el resto.
  const actuales = await almacen.clavesCon('');
  for (const clave of actuales) {
    if (!NO_EXPORTABLES.includes(clave)) await almacen.borrar(clave);
  }

  for (const [clave, valor] of entradas) {
    if (valor != null) await almacen.escribir(clave, valor);
  }

  return { ok: true, claves: entradas.length };
}

/** Nombre de fichero con la fecha, para no sobrescribir copias anteriores. */
export function nombreDeFichero(fecha = new Date()): string {
  const f = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
    fecha.getDate(),
  ).padStart(2, '0')}`;
  return `youfitness-${f}.json`;
}

/** Tamaño aproximado en KB, para poder decírselo al usuario. */
export function tamanoKb(copia: Copia): number {
  return Math.round(JSON.stringify(copia).length / 1024);
}

export { PREFIJO };
