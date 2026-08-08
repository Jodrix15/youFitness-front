import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Comida } from '../models/comida';
import { componerDia, OBJETIVO_DIARIO } from './composicionDia';

const HOY = '2026-08-06';

function comida(verdPorciones: number): Comida {
  return {
    id: `c${verdPorciones}-${Math.random()}`,
    usuarioId: 'u1',
    fecha: HOY,
    tipo: 'comida',
    hora: '14:00',
    descripcion: 'Ensalada',
    recetaId: null,
    protPorciones: 1,
    verdPorciones,
    hidrPorciones: 0,
    grasPorciones: 0,
    saciedad: 3,
    nota: null,
    esDesliz: false,
    editadoEn: null,
    creadoEn: '2026-08-06T14:00:00.000Z',
    actualizadoEn: '2026-08-06T14:00:00.000Z',
    borradoEn: null,
  };
}

test('sin configurar nada se usa el objetivo de referencia', () => {
  const d = componerDia([comida(2)], HOY);
  assert.equal(d.verdura.objetivo, OBJETIVO_DIARIO.verduraRaciones);
  assert.equal(d.verdura.progreso, 0.5, '2 de 4');
});

test('el objetivo de verdura se puede subir desde Ajustes', () => {
  const d = componerDia([comida(3)], HOY, 6);
  assert.equal(d.verdura.objetivo, 6);
  assert.equal(d.verdura.progreso, 0.5, '3 de 6');
});

test('bajar el objetivo hace que las mismas raciones lo completen', () => {
  const d = componerDia([comida(3)], HOY, 3);
  assert.equal(d.verdura.progreso, 1);
});

test('el objetivo no cambia las raciones registradas, solo el listón', () => {
  const flojo = componerDia([comida(3)], HOY, 3);
  const exigente = componerDia([comida(3)], HOY, 6);
  assert.equal(flojo.verdura.raciones, exigente.verdura.raciones);
});
