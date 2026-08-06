import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calcularRacha, semanaDeRacha } from './racha';

test('sin registros no hay racha', () => {
  const r = calcularRacha([], '2026-08-06');
  assert.deepEqual(r, { actual: 0, mejor: 0, incluyeHoy: false });
});

test('días consecutivos hasta hoy cuentan como racha viva', () => {
  const r = calcularRacha(['2026-08-04', '2026-08-05', '2026-08-06'], '2026-08-06');
  assert.equal(r.actual, 3);
  assert.equal(r.incluyeHoy, true);
});

test('si hoy aún no hay registro la racha sigue viva pero en riesgo', () => {
  const r = calcularRacha(['2026-08-04', '2026-08-05'], '2026-08-06');
  assert.equal(r.actual, 2);
  assert.equal(r.incluyeHoy, false, 'hoy todavía no cuenta');
});

test('faltar dos días rompe la racha', () => {
  const r = calcularRacha(['2026-08-01', '2026-08-02'], '2026-08-06');
  assert.equal(r.actual, 0);
  assert.equal(r.mejor, 2, 'pero la mejor histórica se conserva');
});

test('la mejor racha sobrevive a los cortes', () => {
  const r = calcularRacha(
    ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-08-05', '2026-08-06'],
    '2026-08-06',
  );
  assert.equal(r.actual, 2);
  assert.equal(r.mejor, 4);
});

test('las fechas duplicadas o desordenadas no inflan la racha', () => {
  const r = calcularRacha(
    ['2026-08-06', '2026-08-04', '2026-08-05', '2026-08-05', '2026-08-06'],
    '2026-08-06',
  );
  assert.equal(r.actual, 3);
});

test('la tira de la semana marca los días con registro y los futuros', () => {
  // 2026-08-06 es jueves.
  const dias = semanaDeRacha(['2026-08-04', '2026-08-06'], '2026-08-06');
  assert.equal(dias.length, 7);
  assert.deepEqual(
    dias.map((d) => d.inicial),
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  );
  assert.equal(dias[1]?.activo, true, 'martes 4 tiene registro');
  assert.equal(dias[2]?.activo, false, 'miércoles 5 no');
  assert.equal(dias[3]?.esHoy, true, 'jueves 6 es hoy');
  assert.equal(dias[4]?.futuro, true, 'viernes todavía no ha llegado');
});
