/**
 * Tipos transversales del dominio.
 *
 * Reglas de la especificación §4 aplicadas a TODAS las entidades:
 *  - clave primaria UUID v4, nunca autoincremental,
 *  - `creadoEn` / `actualizadoEn` en UTC,
 *  - borrado lógico con `borradoEn`, nunca DELETE,
 *  - `usuarioId` presente desde el día uno.
 *
 * Hoy no hay cuentas ni servidor. `usuarioId` existe igualmente porque cuesta
 * lo mismo ahora y evita una migración dolorosa el día que haya sincronización
 * o un segundo dispositivo.
 */

/** UUID v4 en formato canónico. */
export type Uuid = string;

/** Fecha civil `YYYY-MM-DD`. Es un día del calendario, no un instante. */
export type FechaISO = string;

/** Instante en UTC, formato ISO 8601 completo. */
export type InstanteISO = string;

export type Entidad = {
  id: Uuid;
  usuarioId: Uuid;
  creadoEn: InstanteISO;
  actualizadoEn: InstanteISO;
  borradoEn: InstanteISO | null;
};

/**
 * Resultado explícito, para que el dominio no lance excepciones.
 *
 * Las reglas de negocio devuelven `Resultado`, no `throw`. Un peso inválido no
 * es un fallo del programa, es una respuesta que la UI tiene que saber pintar.
 */
export type Resultado<T, E = string> =
  | { ok: true; valor: T }
  | { ok: false; error: E };

export function ok<T>(valor: T): Resultado<T, never> {
  return { ok: true, valor };
}

export function fallo<E>(error: E): Resultado<never, E> {
  return { ok: false, error };
}
