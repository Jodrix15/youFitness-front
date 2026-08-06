import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generarObjetivosIniciales } from './objetivosIniciales';

const BASE = {
  pesoActualKg: 82.4,
  pesoObjetivoKg: 76,
  sesionesPorSemana: 4,
  modulosActivos: ['grasa', 'fuerza', 'comer'] as const,
};

test('genera los tres objetivos de arranque', () => {
  const o = generarObjetivosIniciales(BASE);
  assert.equal(o.length, 3);
  assert.deepEqual(
    o.map((x) => x.nombre),
    ['Llegar a 76 kg', '4 entrenos por semana', 'Pesarme cada día'],
  );
});

test('el objetivo de peso es un hito con operador lte al bajar', () => {
  const [peso] = generarObjetivosIniciales(BASE);
  assert.equal(peso?.metrica, 'peso_kg');
  assert.equal(peso?.operador, 'lte');
  assert.equal(peso?.periodo, 'hito');
});

test('al subir de peso el operador se invierte', () => {
  const [peso] = generarObjetivosIniciales({ ...BASE, pesoObjetivoKg: 90 });
  assert.equal(peso?.operador, 'gte');
});

test('sin el bloque de grasa no se crea objetivo de peso', () => {
  const o = generarObjetivosIniciales({ ...BASE, modulosActivos: ['fuerza'] });
  assert.ok(!o.some((x) => x.metrica === 'peso_kg'));
});

test('sin el bloque de fuerza no se crea objetivo de entrenos', () => {
  const o = generarObjetivosIniciales({ ...BASE, modulosActivos: ['grasa'] });
  assert.ok(!o.some((x) => x.metrica === 'sesiones'));
});

test('el objetivo de pesarse cada día se crea siempre', () => {
  const o = generarObjetivosIniciales({ ...BASE, modulosActivos: ['mental'] });
  assert.equal(o.length, 1);
  assert.equal(o[0]?.metrica, 'pesajes');
});

test('si el peso objetivo coincide con el actual no hay hito', () => {
  const o = generarObjetivosIniciales({ ...BASE, pesoObjetivoKg: 82.4 });
  assert.ok(!o.some((x) => x.metrica === 'peso_kg'));
});
