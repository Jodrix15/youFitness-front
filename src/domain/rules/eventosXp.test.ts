import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { XpEvento } from '../models/xp';
import { penalizacion, recompensa, totalXp, xpDelDia, xpPorTipo } from './eventosXp';

const CONTEXTO = { fecha: '2026-08-06', hora: '10:00', diasDeRacha: 0 };

let n = 0;
function evento(tipo: XpEvento['tipo'], xpFinal: number, fecha = '2026-08-06'): XpEvento {
  n++;
  return {
    id: `e${n}`,
    usuarioId: 'u1',
    fecha,
    hora: '10:00',
    tipo,
    origenTabla: null,
    origenId: null,
    xpBase: xpFinal,
    multiplicador: 1,
    xpFinal,
    nota: null,
    creadoEn: '2026-08-06T10:00:00.000Z',
    actualizadoEn: '2026-08-06T10:00:00.000Z',
    borradoEn: null,
  };
}

test('una recompensa aplica el multiplicador de racha', () => {
  const e = recompensa({
    tipo: 'peso_registrado',
    xpBase: 25,
    contexto: { ...CONTEXTO, diasDeRacha: 7 },
  });
  assert.equal(e.multiplicador, 1.2);
  assert.equal(e.xpFinal, 30);
});

test('una penalización nunca lleva multiplicador', () => {
  const e = penalizacion({ tipo: 'ajuste_manual', xpBase: 25, fecha: '2026-08-06', hora: '10:00' });
  assert.equal(e.multiplicador, 1);
  assert.equal(e.xpFinal, -25, 'el signo se fuerza negativo');
  assert.equal(e.xpBase, -25);
});

test('la penalización se guarda negativa aunque se pase positiva', () => {
  const a = penalizacion({ tipo: 'ajuste_manual', xpBase: 15, fecha: '2026-08-06', hora: '10:00' });
  const b = penalizacion({ tipo: 'ajuste_manual', xpBase: -15, fecha: '2026-08-06', hora: '10:00' });
  assert.equal(a.xpFinal, b.xpFinal);
});

test('el total suma sumas y restas', () => {
  const eventos = [
    evento('peso_registrado', 25),
    evento('comida_registrada', 20),
    evento('desliz_sobre_presupuesto', -25),
  ];
  assert.equal(totalXp(eventos), 20);
});

test('el desglose agrupa por tipo', () => {
  const mapa = xpPorTipo([
    evento('comida_registrada', 20),
    evento('comida_registrada', 20),
    evento('peso_registrado', 25),
  ]);
  assert.equal(mapa.get('comida_registrada'), 40);
  assert.equal(mapa.get('peso_registrado'), 25);
});

test('el desglose conserva los tipos de funciones retiradas', () => {
  // Una copia de seguridad antigua contiene eventos de hábitos: el total y el
  // desglose tienen que seguir contándolos.
  const mapa = xpPorTipo([evento('habito_bueno', 5), evento('habito_bueno', 5)]);
  assert.equal(mapa.get('habito_bueno'), 10);
});

test('el XP del día solo cuenta esa fecha', () => {
  const eventos = [
    evento('peso_registrado', 25, '2026-08-05'),
    evento('peso_registrado', 25, '2026-08-06'),
    evento('comida_registrada', 20, '2026-08-06'),
  ];
  assert.equal(xpDelDia(eventos, '2026-08-06'), 45);
});
