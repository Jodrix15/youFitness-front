/**
 * Configuración de la copia en la nube.
 *
 * Vive en `app.json`, bajo `expo.extra.supabase`. La clave `anon` de Supabase
 * está DISEÑADA para viajar dentro del cliente: no da acceso a nada por sí sola,
 * porque quien decide qué puede leer cada usuario son las políticas RLS del
 * servidor. Por eso puede estar en el repositorio sin problema.
 *
 * Si falta la configuración, la app funciona exactamente igual que siempre y la
 * sección de nube ni aparece. Es la diferencia entre una función opcional y una
 * app que se rompe si no la configuras.
 */
export type ConfigNube = {
  url: string;
  anonKey: string;
  bucket: string;
};

export const BUCKET_POR_DEFECTO = 'copias';

/**
 * Lee y valida la configuración. Devuelve `null` si no está puesta.
 *
 * Se le pasa el objeto en lugar de leerlo dentro para poder probarla sin montar
 * Expo entero.
 */
export function leerConfigNube(extra: unknown): ConfigNube | null {
  if (typeof extra !== 'object' || extra == null) return null;

  const bloque = (extra as { supabase?: unknown }).supabase;
  if (typeof bloque !== 'object' || bloque == null) return null;

  const { url, anonKey, bucket } = bloque as Record<string, unknown>;

  const urlLimpia = typeof url === 'string' ? url.trim().replace(/\/+$/, '') : '';
  const clave = typeof anonKey === 'string' ? anonKey.trim() : '';

  // Los huecos del ejemplo («PEGA_AQUI_TU_URL») no cuentan como configuración.
  if (!urlLimpia.startsWith('https://') || clave.length < 20) return null;

  return {
    url: urlLimpia,
    anonKey: clave,
    bucket: typeof bucket === 'string' && bucket.trim() ? bucket.trim() : BUCKET_POR_DEFECTO,
  };
}
