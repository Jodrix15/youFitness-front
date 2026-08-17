/**
 * Copia en la nube sobre Supabase. Adaptador, no dominio.
 *
 * SIN SDK, a propósito. Todo lo que hace falta son cinco llamadas HTTP, y
 * `@supabase/supabase-js` arrastra polyfills y una capa de tiempo real que esta
 * app no usa. `fetch` funciona igual en iOS, Android y web, que es la misma
 * razón por la que el almacén es AsyncStorage.
 *
 * QUÉ SE SUBE: exactamente el mismo JSON que genera `data/copia.ts` y que ya
 * puedes descargarte a mano. Para Supabase es un fichero opaco: no hay tablas,
 * ni columnas, ni consultas. Eso hace que esto NO sea sincronización —dos
 * dispositivos no comparten datos— y por eso mismo no puede corromper nada:
 * subir es sustituir un fichero, y no hay conflictos que resolver.
 */

import type { Copia } from '../../copia';
import type { ConfigNube } from './config';

export type SesionNube = {
  usuarioId: string;
  correo: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch en milisegundos. */
  expiraEn: number;
};

export type Resultado<T> = { ok: true; valor: T } | { ok: false; motivo: string };

export type InfoCopiaNube = {
  subidaEn: string;
  tamanoKb: number;
};

/** Se renueva el token un minuto antes de que caduque, no justo al caducar. */
const MARGEN_RENOVACION_MS = 60_000;

const NOMBRE_FICHERO = 'ultima.json';

// ────────────────────────────────────────────────────────────────────────────
// Cocina HTTP
// ────────────────────────────────────────────────────────────────────────────

/**
 * Traduce el error al idioma de una persona.
 *
 * Un «Invalid login credentials» en medio de la pantalla de Ajustes no ayuda a
 * nadie. Y un fallo de red tiene que decir que es de red: si no, se interpreta
 * como que la app ha perdido los datos, que es justo el miedo que esto viene a
 * quitar.
 */
function motivoLegible(estado: number, cuerpo: unknown): string {
  const texto =
    typeof cuerpo === 'object' && cuerpo != null
      ? String(
          (cuerpo as Record<string, unknown>).error_description ??
            (cuerpo as Record<string, unknown>).msg ??
            (cuerpo as Record<string, unknown>).message ??
            (cuerpo as Record<string, unknown>).error ??
            '',
        )
      : '';

  if (estado === 400 && /invalid login/i.test(texto)) {
    return 'Correo o contraseña incorrectos.';
  }
  if (estado === 400 && /already registered|already been registered/i.test(texto)) {
    return 'Ese correo ya tiene cuenta. Entra en vez de crearla.';
  }
  if (estado === 401 || estado === 403) {
    return 'La sesión ya no vale. Vuelve a entrar con tu correo.';
  }
  if (estado === 404) {
    return 'Todavía no hay ninguna copia en la nube.';
  }
  if (estado === 422 && /password/i.test(texto)) {
    return 'La contraseña es demasiado corta: mínimo seis caracteres.';
  }
  if (estado === 429) {
    return 'Demasiados intentos seguidos. Espera un minuto.';
  }
  if (estado >= 500) {
    return 'Supabase no responde ahora mismo. Tus datos siguen en el móvil; se reintentará solo.';
  }
  return texto || `Error ${String(estado)} al hablar con la nube.`;
}

async function pedir(
  url: string,
  opciones: { metodo: string; cabeceras: Record<string, string>; cuerpo?: string },
): Promise<Resultado<{ estado: number; texto: string }>> {
  try {
    const respuesta = await fetch(url, {
      method: opciones.metodo,
      headers: opciones.cabeceras,
      body: opciones.cuerpo,
    });

    const texto = await respuesta.text();

    if (!respuesta.ok) {
      let cuerpo: unknown = null;
      try {
        cuerpo = JSON.parse(texto);
      } catch {
        cuerpo = null;
      }
      return { ok: false, motivo: motivoLegible(respuesta.status, cuerpo) };
    }

    return { ok: true, valor: { estado: respuesta.status, texto } };
  } catch {
    // Sin conexión NO es un error del que haya que enterarse con un susto: la
    // app es local-first y ya tiene los datos. Se reintenta al siguiente arranque.
    return { ok: false, motivo: 'Sin conexión. Se reintentará cuando vuelvas a abrir la app.' };
  }
}

function sesionDesde(crudo: unknown, correoPedido: string): Resultado<SesionNube> {
  if (typeof crudo !== 'object' || crudo == null) {
    return { ok: false, motivo: 'Respuesta inesperada de la nube.' };
  }
  const r = crudo as Record<string, unknown>;
  const usuario = (r.user ?? {}) as Record<string, unknown>;

  const accessToken = typeof r.access_token === 'string' ? r.access_token : '';
  const refreshToken = typeof r.refresh_token === 'string' ? r.refresh_token : '';
  const usuarioId = typeof usuario.id === 'string' ? usuario.id : '';

  if (!accessToken || !refreshToken || !usuarioId) {
    // Pasa cuando el proyecto exige confirmar el correo: hay usuario, no sesión.
    return {
      ok: false,
      motivo:
        'La cuenta se ha creado pero el proyecto pide confirmar el correo. Desactiva «Confirm email» en Supabase → Authentication → Sign In / Providers.',
    };
  }

  const duracion = typeof r.expires_in === 'number' ? r.expires_in : 3600;

  return {
    ok: true,
    valor: {
      usuarioId,
      correo: typeof usuario.email === 'string' ? usuario.email : correoPedido,
      accessToken,
      refreshToken,
      expiraEn: Date.now() + duracion * 1000,
    },
  };
}

function cabecerasAuth(config: ConfigNube): Record<string, string> {
  return { apikey: config.anonKey, 'Content-Type': 'application/json' };
}

// ────────────────────────────────────────────────────────────────────────────
// Cuenta
// ────────────────────────────────────────────────────────────────────────────

export async function crearCuenta(
  config: ConfigNube,
  correo: string,
  contrasena: string,
): Promise<Resultado<SesionNube>> {
  const r = await pedir(`${config.url}/auth/v1/signup`, {
    metodo: 'POST',
    cabeceras: cabecerasAuth(config),
    cuerpo: JSON.stringify({ email: correo, password: contrasena }),
  });
  if (!r.ok) return r;
  return sesionDesde(JSON.parse(r.valor.texto), correo);
}

export async function entrar(
  config: ConfigNube,
  correo: string,
  contrasena: string,
): Promise<Resultado<SesionNube>> {
  const r = await pedir(`${config.url}/auth/v1/token?grant_type=password`, {
    metodo: 'POST',
    cabeceras: cabecerasAuth(config),
    cuerpo: JSON.stringify({ email: correo, password: contrasena }),
  });
  if (!r.ok) return r;
  return sesionDesde(JSON.parse(r.valor.texto), correo);
}

async function renovar(config: ConfigNube, sesion: SesionNube): Promise<Resultado<SesionNube>> {
  const r = await pedir(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    metodo: 'POST',
    cabeceras: cabecerasAuth(config),
    cuerpo: JSON.stringify({ refresh_token: sesion.refreshToken }),
  });
  if (!r.ok) return r;
  return sesionDesde(JSON.parse(r.valor.texto), sesion.correo);
}

/**
 * Devuelve una sesión utilizable, renovándola si hace falta.
 *
 * Quien llama recibe SIEMPRE la sesión que ha de guardar: si se renovó, la
 * nueva. Olvidarse de persistirla haría que la app renovara en cada arranque y
 * que un token caducado echara al usuario sin motivo.
 */
export async function sesionValida(
  config: ConfigNube,
  sesion: SesionNube,
): Promise<Resultado<SesionNube>> {
  if (Date.now() < sesion.expiraEn - MARGEN_RENOVACION_MS) return { ok: true, valor: sesion };
  return renovar(config, sesion);
}

// ────────────────────────────────────────────────────────────────────────────
// La copia
// ────────────────────────────────────────────────────────────────────────────

/**
 * Cada usuario escribe dentro de una carpeta con su propio identificador. Es lo
 * que la política RLS del bucket comprueba, así que no es una convención de
 * nombres: es la frontera de seguridad.
 */
function rutaDe(sesion: SesionNube): string {
  return `${sesion.usuarioId}/${NOMBRE_FICHERO}`;
}

export async function subirCopia(
  config: ConfigNube,
  sesion: SesionNube,
  copia: Copia,
): Promise<Resultado<SesionNube>> {
  const valida = await sesionValida(config, sesion);
  if (!valida.ok) return valida;

  const contenido = JSON.stringify(copia, null, 2);

  const r = await pedir(`${config.url}/storage/v1/object/${config.bucket}/${rutaDe(valida.valor)}`, {
    metodo: 'POST',
    cabeceras: {
      apikey: config.anonKey,
      Authorization: `Bearer ${valida.valor.accessToken}`,
      'Content-Type': 'application/json',
      // Sustituir en vez de acumular: una copia por cuenta, siempre la última.
      // Guardar el histórico llenaría el plan gratuito con versiones que nunca
      // se van a mirar, y la que importa es la de hoy.
      'x-upsert': 'true',
    },
    cuerpo: contenido,
  });

  if (!r.ok) return r;
  return { ok: true, valor: valida.valor };
}

export async function descargarCopia(
  config: ConfigNube,
  sesion: SesionNube,
): Promise<Resultado<{ crudo: unknown; sesion: SesionNube }>> {
  const valida = await sesionValida(config, sesion);
  if (!valida.ok) return valida;

  const r = await pedir(`${config.url}/storage/v1/object/${config.bucket}/${rutaDe(valida.valor)}`, {
    metodo: 'GET',
    cabeceras: {
      apikey: config.anonKey,
      Authorization: `Bearer ${valida.valor.accessToken}`,
    },
  });
  if (!r.ok) return r;

  try {
    return { ok: true, valor: { crudo: JSON.parse(r.valor.texto), sesion: valida.valor } };
  } catch {
    return { ok: false, motivo: 'La copia de la nube está corrupta y no se puede leer.' };
  }
}

/** Cuándo se subió la última y cuánto ocupa. `null` si aún no hay ninguna. */
export async function infoCopia(
  config: ConfigNube,
  sesion: SesionNube,
): Promise<Resultado<{ info: InfoCopiaNube | null; sesion: SesionNube }>> {
  const valida = await sesionValida(config, sesion);
  if (!valida.ok) return valida;

  const r = await pedir(`${config.url}/storage/v1/object/list/${config.bucket}`, {
    metodo: 'POST',
    cabeceras: {
      apikey: config.anonKey,
      Authorization: `Bearer ${valida.valor.accessToken}`,
      'Content-Type': 'application/json',
    },
    cuerpo: JSON.stringify({ prefix: valida.valor.usuarioId, limit: 20 }),
  });
  if (!r.ok) return r;

  const lista: unknown = JSON.parse(r.valor.texto);
  if (!Array.isArray(lista)) return { ok: true, valor: { info: null, sesion: valida.valor } };

  const fichero = lista.find(
    (o) => typeof o === 'object' && o != null && (o as { name?: unknown }).name === NOMBRE_FICHERO,
  ) as Record<string, unknown> | undefined;

  if (!fichero) return { ok: true, valor: { info: null, sesion: valida.valor } };

  const metadatos = (fichero.metadata ?? {}) as Record<string, unknown>;
  const bytes = typeof metadatos.size === 'number' ? metadatos.size : 0;

  return {
    ok: true,
    valor: {
      info: {
        subidaEn: String(fichero.updated_at ?? fichero.created_at ?? ''),
        tamanoKb: Math.max(1, Math.round(bytes / 1024)),
      },
      sesion: valida.valor,
    },
  };
}
