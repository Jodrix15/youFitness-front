import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  calcularImc,
  estimarLlegada,
  interpretarCintura,
  rangoPesoSaludable,
  ratioCinturaAltura,
  revisarObjetivoPeso,
} from './composicion';

test('el IMC sale de peso y altura', () => {
  assert.equal(Math.round(calcularImc(82.4, 178) * 10) / 10, 26);
});

test('el rango saludable corresponde a un IMC de 18,5 a 24,9', () => {
  const r = rangoPesoSaludable(178);
  assert.equal(r.minKg, 58.6);
  assert.equal(r.maxKg, 78.9);
});

test('cintura entre altura por debajo de 0,50 queda bajo el umbral', () => {
  assert.equal(ratioCinturaAltura(85, 178), 0.478);
  assert.equal(interpretarCintura(85, 178), 'bajo_umbral');
  assert.equal(interpretarCintura(95, 178), 'sobre_umbral');
});

test('avisa si el objetivo cae por debajo del rango saludable', () => {
  const aviso = revisarObjetivoPeso({ pesoActualKg: 82.4, pesoObjetivoKg: 55, alturaCm: 178 });
  assert.equal(aviso.tipo, 'por_debajo_del_rango');
});

test('acepta un objetivo dentro del rango', () => {
  const aviso = revisarObjetivoPeso({ pesoActualKg: 82.4, pesoObjetivoKg: 76, alturaCm: 178 });
  assert.equal(aviso.tipo, 'ninguno');
});

test('avisa si el ritmo implícito supera el 1 % del peso por semana', () => {
  // 6,4 kg en 4 semanas son 1,6 kg/semana; el máximo para 82,4 kg es 0,824.
  const aviso = revisarObjetivoPeso({
    pesoActualKg: 82.4,
    pesoObjetivoKg: 76,
    alturaCm: 178,
    semanas: 4,
  });
  assert.equal(aviso.tipo, 'ritmo_excesivo');
});

test('no avisa de ritmo si el plazo es holgado', () => {
  const aviso = revisarObjetivoPeso({
    pesoActualKg: 82.4,
    pesoObjetivoKg: 76,
    alturaCm: 178,
    semanas: 16,
  });
  assert.equal(aviso.tipo, 'ninguno');
});

test('la estimación de llegada usa el ritmo sugerido del 0,5 % semanal', () => {
  const p = estimarLlegada({
    pesoActualKg: 82.4,
    pesoObjetivoKg: 76,
    hoy: new Date('2026-08-06T00:00:00Z'),
  });
  assert.ok(p);
  assert.equal(p.diferenciaKg, 6.4);
  assert.equal(p.ritmoSemanalKg, 0.41);
  assert.equal(p.semanas, 16);
});

test('sin diferencia de peso no hay estimación', () => {
  const p = estimarLlegada({
    pesoActualKg: 76,
    pesoObjetivoKg: 76,
    hoy: new Date('2026-08-06T00:00:00Z'),
  });
  assert.equal(p, null);
});
