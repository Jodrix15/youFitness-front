import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Comida, TipoComida } from '../models/comida';
import { componerDia, rachaDiasCompletos } from './composicionDia';

let contador = 0;

function comida(fecha: string, tipo: TipoComida, esDesliz = false): Comida {
  contador++;
  return {
    id: `c${contador}`,
    usuarioId: 'u1',
    fecha,
    tipo,
    hora: '13:00',
    descripcion: 'Algo',
    recetaId: null,
    saciedad: 3,
    nota: null,
    esDesliz,
    editadoEn: null,
    creadoEn: '2026-08-06T12:00:00.000Z',
    actualizadoEn: '2026-08-06T12:00:00.000Z',
    borradoEn: null,
  };
}

const HOY = '2026-08-06';

test('sin comidas el día está vacío y faltan las tres principales', () => {
  const d = componerDia([], HOY);
  assert.equal(d.principalesRegistradas, 0);
  assert.deepEqual(d.faltan, ['desayuno', 'comida', 'cena']);
  assert.equal(d.completo, false);
});

test('el snack no cuenta como comida principal', () => {
  const d = componerDia(
    [comida(HOY, 'desayuno'), comida(HOY, 'comida'), comida(HOY, 'snack')],
    HOY,
  );
  assert.equal(d.principalesRegistradas, 2);
  assert.deepEqual(d.faltan, ['cena']);
});

test('con las tres principales el día está completo', () => {
  const d = componerDia(
    [comida(HOY, 'desayuno'), comida(HOY, 'comida'), comida(HOY, 'cena')],
    HOY,
  );
  assert.equal(d.principalesRegistradas, 3);
  assert.deepEqual(d.faltan, []);
  assert.equal(d.completo, true);
});

test('el desliz aparece en el mismo timeline y se cuenta aparte', () => {
  const d = componerDia([comida(HOY, 'comida'), comida(HOY, 'snack', true)], HOY);
  assert.equal(d.comidas.length, 2, 'sale en el mismo timeline');
  assert.equal(d.deslices, 1);
});

test('las comidas de otros días no se cuelan', () => {
  const d = componerDia([comida('2026-08-05', 'desayuno'), comida(HOY, 'comida')], HOY);
  assert.equal(d.comidas.length, 1);
});

test('un desliz anotado como cena cubre la cena del día', () => {
  const d = componerDia(
    [comida(HOY, 'desayuno'), comida(HOY, 'comida'), comida(HOY, 'cena', true)],
    HOY,
  );

  assert.equal(d.principalesRegistradas, 3, 'la pizza de cena es la cena');
  assert.deepEqual(d.faltan, []);
  assert.equal(d.completo, true);
  assert.equal(d.deslices, 1);
});

test('un desliz de tipo snack sigue sin ocupar ninguna comida principal', () => {
  const d = componerDia([comida(HOY, 'desayuno'), comida(HOY, 'snack', true)], HOY);
  assert.equal(d.principalesRegistradas, 1);
  assert.deepEqual(d.faltan, ['comida', 'cena']);
});

test('repetir una comida no infla el contador', () => {
  const d = componerDia([comida(HOY, 'cena'), comida(HOY, 'cena')], HOY);
  assert.equal(d.principalesRegistradas, 1, 'dos cenas siguen siendo una cena');
});

test('la racha de días completos cuenta los que tienen las tres principales', () => {
  const dias = ['2026-08-04', '2026-08-05', '2026-08-06'];
  const comidas = dias.flatMap((f) => [
    comida(f, 'desayuno'),
    comida(f, 'comida'),
    comida(f, 'cena'),
  ]);
  assert.equal(rachaDiasCompletos(comidas, HOY), 3);
});

test('un día incompleto rompe la racha', () => {
  const comidas = [
    comida('2026-08-04', 'desayuno'),
    comida('2026-08-04', 'comida'),
    comida('2026-08-04', 'cena'),
    comida('2026-08-05', 'desayuno'),
    comida(HOY, 'desayuno'),
    comida(HOY, 'comida'),
    comida(HOY, 'cena'),
  ];
  assert.equal(rachaDiasCompletos(comidas, HOY), 1, 'solo hoy');
});

test('si hoy aún no está completo, la racha se cuenta desde ayer', () => {
  const comidas = [
    comida('2026-08-04', 'desayuno'),
    comida('2026-08-04', 'comida'),
    comida('2026-08-04', 'cena'),
    comida('2026-08-05', 'desayuno'),
    comida('2026-08-05', 'comida'),
    comida('2026-08-05', 'cena'),
    comida(HOY, 'desayuno'),
  ];
  // El día no ha terminado: sería absurdo romper la racha a mediodía.
  assert.equal(rachaDiasCompletos(comidas, HOY), 2);
});

test('un desliz como cena mantiene viva la racha de días completos', () => {
  const comidas = [
    comida('2026-08-05', 'desayuno'),
    comida('2026-08-05', 'comida'),
    comida('2026-08-05', 'cena'),
    comida(HOY, 'desayuno'),
    comida(HOY, 'comida'),
    comida(HOY, 'cena', true),
  ];
  assert.equal(rachaDiasCompletos(comidas, HOY), 2);
});
