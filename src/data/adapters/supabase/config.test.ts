import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BUCKET_POR_DEFECTO, leerConfigNube } from './config';

const VALIDA = {
  supabase: {
    url: 'https://abcdefghijkl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo',
  },
};

test('sin bloque de supabase no hay nube', () => {
  assert.equal(leerConfigNube(undefined), null);
  assert.equal(leerConfigNube({}), null);
  assert.equal(leerConfigNube({ supabase: null }), null);
});

test('los huecos sin rellenar no cuentan como configuración', () => {
  // Es el caso que de verdad pasa: se copia el ejemplo y no se pega nada.
  assert.equal(leerConfigNube({ supabase: { url: 'PEGA_AQUI', anonKey: 'PEGA_AQUI' } }), null);
  assert.equal(leerConfigNube({ supabase: { url: '', anonKey: '' } }), null);
});

test('una url que no es https se rechaza', () => {
  assert.equal(
    leerConfigNube({ supabase: { ...VALIDA.supabase, url: 'http://abc.supabase.co' } }),
    null,
  );
});

test('con url y clave válidas se obtiene la configuración', () => {
  const c = leerConfigNube(VALIDA);
  assert.equal(c?.url, 'https://abcdefghijkl.supabase.co');
  assert.equal(c?.bucket, BUCKET_POR_DEFECTO);
});

test('la barra final de la url se quita, para no generar rutas con doble barra', () => {
  const c = leerConfigNube({ supabase: { ...VALIDA.supabase, url: 'https://abc.supabase.co//' } });
  assert.equal(c?.url, 'https://abc.supabase.co');
});

test('el bucket se puede cambiar', () => {
  const c = leerConfigNube({ supabase: { ...VALIDA.supabase, bucket: 'respaldos' } });
  assert.equal(c?.bucket, 'respaldos');
});
