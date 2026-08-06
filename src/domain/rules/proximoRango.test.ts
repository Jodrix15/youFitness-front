import assert from 'node:assert/strict';
import { test } from 'node:test';

import { estadoNivel, proximoRango } from './xp';

test('desde el nivel 1 el siguiente rango es Aprendiz, no el nivel 2', () => {
  const p = proximoRango(0);
  assert.equal(p?.rango, 'Aprendiz');
  assert.equal(p?.nivel, 3, 'el rango cambia en el nivel 3, no en el 2');
  assert.equal(p?.xpRestante, 800);
});

test('subir de nivel dentro del mismo rango no cambia el objetivo de rango', () => {
  // Niveles 1 y 2 son los dos Iniciado.
  assert.equal(estadoNivel(0).rango, 'Iniciado');
  assert.equal(estadoNivel(300).rango, 'Iniciado');
  assert.equal(proximoRango(300)?.rango, 'Aprendiz');
  assert.equal(proximoRango(300)?.xpRestante, 500);
});

test('el XP restante hasta el siguiente rango se descuenta según avanzas', () => {
  assert.equal(proximoRango(0)?.xpRestante, 800);
  assert.equal(proximoRango(799)?.xpRestante, 1);
});

test('los rangos de varios niveles se saltan enteros', () => {
  // Veterano ocupa los niveles 9, 10 y 11; el siguiente rango es Élite (32.000).
  const p = proximoRango(18000);
  assert.equal(estadoNivel(18000).rango, 'Veterano');
  assert.equal(p?.rango, 'Élite');
  assert.equal(p?.xpRestante, 14000);
});

test('en Leyenda ya no hay siguiente rango', () => {
  assert.equal(estadoNivel(60000).rango, 'Leyenda');
  assert.equal(proximoRango(60000), null);
  assert.equal(proximoRango(999999), null);
});
