import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { PesoRegistro } from '../models/peso';
import {
  UMBRAL_TENDENCIA,
  calcularTendencia,
  resumirProgreso,
  serieConMedia,
} from './tendenciaPeso';

/** Construye pesajes consecutivos desde el 2026-08-01. */
function pesajes(...kilos: number[]): PesoRegistro[] {
  return kilos.map((pesoKg, i) => ({
    id: `id-${i}`,
    usuarioId: 'u1',
    fecha: `2026-08-${String(i + 1).padStart(2, '0')}`,
    pesoKg,
    hora: '07:12',
    nota: null,
    creadoEn: '2026-08-01T05:12:00.000Z',
    actualizadoEn: '2026-08-01T05:12:00.000Z',
    borradoEn: null,
  }));
}

test('sin pesajes la tendencia no existe', () => {
  assert.equal(calcularTendencia([]).estado, 'sin_datos');
});

test('con menos de 7 pesajes la tendencia está bloqueada y dice cuántos faltan', () => {
  const t = calcularTendencia(pesajes(82, 81.8, 81.9));
  assert.equal(t.estado, 'bloqueada');
  if (t.estado !== 'bloqueada') return;
  assert.equal(t.registrados, 3);
  assert.equal(t.faltan, UMBRAL_TENDENCIA - 3);
});

test('la media de los primeros días usa solo los datos que hay', () => {
  const s = serieConMedia(pesajes(80, 82));
  assert.equal(s[0]?.media7, 80);
  assert.equal(s[1]?.media7, 81);
});

test('la ventana no pasa de siete registros', () => {
  const s = serieConMedia(pesajes(10, 10, 10, 10, 10, 10, 10, 80));
  // El octavo punto promedia los siete últimos: seis dieces y un ochenta.
  assert.equal(s[7]?.media7, 20);
});

test('la media absorbe el ruido de un pesaje disparado', () => {
  const s = serieConMedia(pesajes(80, 80, 80, 80, 80, 80, 84));
  const ultimo = s[6];
  assert.equal(ultimo?.pesoKg, 84, 'el pesaje suelto sí refleja el pico');
  assert.equal(ultimo?.media7, 80.57, 'la media apenas se mueve');
});

test('con 7 pesajes la tendencia se desbloquea', () => {
  const t = calcularTendencia(pesajes(82, 81.9, 81.7, 81.8, 81.5, 81.4, 81.3));
  assert.equal(t.estado, 'lista');
  if (t.estado !== 'lista') return;
  assert.equal(t.ultimoPeso, 81.3);
  assert.equal(t.serie.length, 7);
});

test('el cambio semanal compara media contra media, nunca pesaje contra pesaje', () => {
  const t = calcularTendencia(pesajes(82, 82, 82, 82, 82, 82, 82, 81, 81));
  assert.equal(t.estado, 'lista');
  if (t.estado !== 'lista') return;
  // El día 9 compara con el día 1 o 2, que valían 82 de media.
  assert.ok(t.cambioSemanalKg != null && t.cambioSemanalKg < 0);
});

test('sin siete días de historia no hay comparativa semanal', () => {
  const t = calcularTendencia(pesajes(82, 82, 82, 82, 82, 82, 81));
  assert.equal(t.estado, 'lista');
  if (t.estado !== 'lista') return;
  assert.equal(t.cambioSemanalKg, null);
});

test('el resumen usa el último pesaje mientras la media está bloqueada', () => {
  const r = resumirProgreso({
    pesajes: pesajes(88, 87),
    pesoInicialKg: 88,
    objetivoKg: 76,
  });
  assert.equal(r?.actualKg, 87);
  assert.equal(r?.perdidoKg, 1);
  assert.equal(r?.restanteKg, 11);
});

test('el resumen pasa a usar la media en cuanto hay siete pesajes', () => {
  const r = resumirProgreso({
    pesajes: pesajes(88, 88, 88, 88, 88, 88, 80),
    pesoInicialKg: 88,
    objetivoKg: 76,
  });
  // Con la media (86,86) y no con el pesaje suelto de 80.
  assert.equal(r?.actualKg, 86.9);
});

test('el progreso hacia el objetivo se recorta entre 0 y 1', () => {
  const r = resumirProgreso({ pesajes: pesajes(95), pesoInicialKg: 88, objetivoKg: 76 });
  assert.equal(r?.progreso, 0, 'ganar peso no da progreso negativo');
});

test('sin objetivo hay resumen pero no restante', () => {
  const r = resumirProgreso({ pesajes: pesajes(88, 87), pesoInicialKg: 88, objetivoKg: null });
  assert.equal(r?.restanteKg, null);
  assert.equal(r?.progreso, null);
});
