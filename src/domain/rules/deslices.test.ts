import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Comida, DeslizDetalle } from '../models/comida';
import {
  analizarDeslices,
  inicioDeSemana,
  presupuestoDeLaSemana,
  superaPresupuesto,
  UMBRAL_PATRONES,
} from './deslices';

let contador = 0;

function desliz(fecha: string, hora = '17:30'): Comida {
  contador++;
  return {
    id: `d${contador}`,
    usuarioId: 'u1',
    fecha,
    tipo: 'snack',
    hora,
    descripcion: 'Donut',
    recetaId: null,
    protPorciones: 0,
    verdPorciones: 0,
    hidrPorciones: 0,
    grasPorciones: 0,
    saciedad: null,
    nota: null,
    esDesliz: true,
    editadoEn: null,
    creadoEn: '2026-08-06T17:30:00.000Z',
    actualizadoEn: '2026-08-06T17:30:00.000Z',
    borradoEn: null,
  };
}

function detalle(comidaId: string, disparador: DeslizDetalle['disparador']): DeslizDetalle {
  return {
    id: `det-${comidaId}`,
    usuarioId: 'u1',
    comidaId,
    categoria: 'bolleria',
    cantidad: 'racion',
    sustituyoComida: false,
    disparador,
    emocionDespues: 3,
    lugar: 'Oficina',
    nota: null,
    creadoEn: '2026-08-06T17:30:00.000Z',
    actualizadoEn: '2026-08-06T17:30:00.000Z',
    borradoEn: null,
  };
}

test('la semana natural empieza en lunes por defecto', () => {
  // 2026-08-06 es jueves.
  assert.equal(inicioDeSemana('2026-08-06'), '2026-08-03');
  assert.equal(inicioDeSemana('2026-08-03'), '2026-08-03', 'el lunes es su propio inicio');
});

test('el presupuesto solo cuenta los deslices de esta semana', () => {
  const p = presupuestoDeLaSemana(
    [desliz('2026-08-02'), desliz('2026-08-04'), desliz('2026-08-06')],
    '2026-08-06',
  );
  assert.equal(p.usados, 2, 'el del domingo 2 es de la semana anterior');
  assert.equal(p.restantes, 0);
});

test('los dos primeros deslices de la semana no penalizan', () => {
  assert.equal(superaPresupuesto(0), false);
  assert.equal(superaPresupuesto(1), false);
  assert.equal(superaPresupuesto(2), true, 'el tercero sí');
});

test('con menos de cinco deslices no se afirma ningún patrón', () => {
  const a = analizarDeslices([desliz('2026-08-03'), desliz('2026-08-04')], []);
  assert.equal(a.estado, 'bloqueado');
  if (a.estado !== 'bloqueado') return;
  assert.equal(a.faltan, UMBRAL_PATRONES - 2);
});

test('con cinco o más aparece la franja horaria dominante', () => {
  const deslices = [
    desliz('2026-08-01', '17:10'),
    desliz('2026-08-02', '18:00'),
    desliz('2026-08-03', '17:45'),
    desliz('2026-08-04', '09:00'),
    desliz('2026-08-05', '13:00'),
  ];
  const a = analizarDeslices(deslices, []);
  assert.equal(a.estado, 'listo');
  if (a.estado !== 'listo') return;
  assert.equal(a.total, 5);
  assert.ok(a.patrones.some((p) => p.texto.includes('17:00')));
});

test('el disparador que más se repite se señala como observación', () => {
  const deslices = [
    desliz('2026-08-01'),
    desliz('2026-08-02'),
    desliz('2026-08-03'),
    desliz('2026-08-04'),
    desliz('2026-08-05'),
  ];
  const detalles = deslices.map((d, i) =>
    detalle(d.id, i < 3 ? 'aburrimiento' : 'estres'),
  );

  const a = analizarDeslices(deslices, detalles);
  assert.equal(a.estado, 'listo');
  if (a.estado !== 'listo') return;
  assert.ok(a.patrones.some((p) => p.texto.includes('aburrimiento')));
});

test('un disparador que aparece dos veces no llega a patrón', () => {
  const deslices = Array.from({ length: 5 }, (_, i) => desliz(`2026-08-0${i + 1}`, '09:00'));
  const detalles = deslices.map((d, i) => detalle(d.id, i < 2 ? 'estres' : null));

  const a = analizarDeslices(deslices, detalles);
  assert.equal(a.estado, 'listo');
  if (a.estado !== 'listo') return;
  assert.ok(!a.patrones.some((p) => p.texto.includes('estrés')));
});

test('las comidas normales no cuentan como deslices', () => {
  const normal = { ...desliz('2026-08-06'), esDesliz: false };
  const p = presupuestoDeLaSemana([normal], '2026-08-06');
  assert.equal(p.usados, 0);
});
