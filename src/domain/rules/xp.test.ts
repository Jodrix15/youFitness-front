import assert from 'node:assert/strict';
import { test } from 'node:test';

import { aplicarMultiplicador, estadoNivel, multiplicadorRacha } from './xp';

test('sin XP se empieza en nivel 1, rango Iniciado', () => {
  const e = estadoNivel(0);
  assert.equal(e.nivel, 1);
  assert.equal(e.rango, 'Iniciado');
  assert.equal(e.xpSiguienteNivel, 300);
  assert.equal(e.progreso, 0);
});

test('el nivel sube al cruzar el umbral', () => {
  assert.equal(estadoNivel(299).nivel, 1);
  assert.equal(estadoNivel(300).nivel, 2);
  assert.equal(estadoNivel(800).rango, 'Aprendiz');
});

test('el progreso es la fracción recorrida hacia el nivel siguiente', () => {
  const e = estadoNivel(550);
  assert.equal(e.nivel, 2);
  assert.equal(e.xpNivelActual, 300);
  assert.equal(e.xpSiguienteNivel, 800);
  assert.equal(e.progreso, 0.5);
});

test('el nivel puede bajar si el XP cae', () => {
  assert.equal(estadoNivel(1500).nivel, 4);
  assert.equal(estadoNivel(1499).nivel, 3);
});

test('en el nivel máximo no hay siguiente umbral', () => {
  const e = estadoNivel(99999);
  assert.equal(e.nivel, 16);
  assert.equal(e.rango, 'Leyenda');
  assert.equal(e.xpSiguienteNivel, null);
  assert.equal(e.progreso, 1);
});

test('el multiplicador de racha sigue la tabla y topa en 1,5', () => {
  assert.equal(multiplicadorRacha(0), 1);
  assert.equal(multiplicadorRacha(3), 1.1);
  assert.equal(multiplicadorRacha(7), 1.2);
  assert.equal(multiplicadorRacha(14), 1.3);
  assert.equal(multiplicadorRacha(30), 1.5);
  assert.equal(multiplicadorRacha(400), 1.5);
});

test('el multiplicador nunca amplifica una resta', () => {
  assert.equal(aplicarMultiplicador(100, 30), 150);
  assert.equal(aplicarMultiplicador(-30, 30), -30);
});
