import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Copia } from '../../data/copia';
import { antiguedad, mereceSubirse, tocaSubir } from './cuandoSubir';

function copia(datos: Record<string, unknown>): Copia {
  return { aplicacion: 'YouFitness', version: 1, exportadoEn: AHORA.toISOString(), datos };
}

const AHORA = new Date('2026-08-15T12:00:00.000Z');
const haceHoras = (h: number) => new Date(AHORA.getTime() - h * 3_600_000).toISOString();

test('sin ninguna copia previa siempre toca subir', () => {
  assert.equal(tocaSubir(null, AHORA), true);
});

test('una copia reciente no se vuelve a subir', () => {
  assert.equal(tocaSubir(haceHoras(1), AHORA), false);
  assert.equal(tocaSubir(haceHoras(11), AHORA), false);
});

test('pasadas doce horas toca de nuevo', () => {
  assert.equal(tocaSubir(haceHoras(12), AHORA), true);
  assert.equal(tocaSubir(haceHoras(40), AHORA), true);
});

test('una fecha corrupta no deja la copia congelada para siempre', () => {
  assert.equal(tocaSubir('no soy una fecha', AHORA), true);
});

test('un reloj que va hacia atrás tampoco la congela', () => {
  // Cambio de hora o fecha mal puesta: la última copia parece del futuro.
  const futuro = new Date(AHORA.getTime() + 5 * 3_600_000).toISOString();
  assert.equal(tocaSubir(futuro, AHORA), true);
});

test('la antigüedad se cuenta en unidades que se entienden de un vistazo', () => {
  assert.equal(antiguedad(haceHoras(0), AHORA), 'hace un momento');
  assert.equal(antiguedad(haceHoras(0.5), AHORA), 'hace 30 minutos');
  assert.equal(antiguedad(haceHoras(1), AHORA), 'hace una hora');
  assert.equal(antiguedad(haceHoras(5), AHORA), 'hace 5 horas');
  assert.equal(antiguedad(haceHoras(24), AHORA), 'ayer');
  assert.equal(antiguedad(haceHoras(72), AHORA), 'hace 3 días');
});

test('una instalación recién estrenada NO pisa la copia buena de la nube', () => {
  // El escenario que arruina el respaldo: móvil nuevo, entras para restaurar, y
  // la copia automática sube el vacío encima antes de que te dé tiempo.
  assert.equal(mereceSubirse(copia({})), false);
  assert.equal(mereceSubirse(copia({ 'ajustes:onboarding_completado': false })), false);
  assert.equal(mereceSubirse(copia({ perfil: null })), false);
});

test('con perfil, la copia sí se sube', () => {
  assert.equal(mereceSubirse(copia({ perfil: { id: 'p1', nombre: 'Jordi' } })), true);
});
