import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Checkin } from '../models/checkin';
import {
  compararConHabitual,
  esTrasnoche,
  formatearMinutosNocturnos,
  horaHabitualAcostarse,
  minutosNocturnos,
} from './sueno';

function checkins(...horas: (string | null)[]): Checkin[] {
  return horas.map((horaAcostarse, i) => ({
    id: `c${i}`,
    usuarioId: 'u1',
    fecha: `2026-08-${String(i + 1).padStart(2, '0')}`,
    animo: 4,
    energia: 7,
    estres: 4,
    suenoHoras: 7,
    suenoCalidad: 3,
    horaAcostarse,
    nota: null,
    actividades: [],
    creadoEn: '2026-08-01T22:00:00.000Z',
    actualizadoEn: '2026-08-01T22:00:00.000Z',
    borradoEn: null,
  }));
}

test('la madrugada cuenta como continuación de la noche anterior', () => {
  // Si 00:40 valiera 40 minutos, saldría "antes" que las 23:50 del mismo tramo.
  assert.ok(minutosNocturnos('00:40')! > minutosNocturnos('23:50')!);
});

test('una hora inválida no revienta, devuelve null', () => {
  assert.equal(minutosNocturnos('25:00'), null);
  assert.equal(minutosNocturnos('23:70'), null);
  assert.equal(minutosNocturnos('tarde'), null);
});

test('los minutos nocturnos vuelven a leerse como hora', () => {
  assert.equal(formatearMinutosNocturnos(minutosNocturnos('23:50')!), '23:50');
  assert.equal(formatearMinutosNocturnos(minutosNocturnos('00:40')!), '00:40');
});

test('con menos de tres noches no se afirma una hora habitual', () => {
  assert.equal(horaHabitualAcostarse(checkins('23:30', '23:45')), null);
});

test('la hora habitual es la mediana, para que una noche de fiesta no la mueva', () => {
  const habitual = horaHabitualAcostarse(checkins('23:40', '23:50', '00:00', '05:00', '23:45'));
  assert.equal(formatearMinutosNocturnos(habitual!), '23:50');
});

test('las noches sin hora apuntada se ignoran', () => {
  const habitual = horaHabitualAcostarse(checkins('23:40', null, '23:50', null, '00:00'));
  assert.equal(formatearMinutosNocturnos(habitual!), '23:50');
});

test('la comparación dice cuánto te has desviado de tu costumbre', () => {
  const habitual = minutosNocturnos('23:50')!;
  const c = compararConHabitual('00:40', habitual);
  assert.equal(c?.diferenciaMinutos, 50);
  assert.match(c!.texto, /50 min más tarde/);
});

test('acostarse antes de lo habitual también se reconoce', () => {
  const c = compararConHabitual('23:00', minutosNocturnos('23:50')!);
  assert.match(c!.texto, /antes/);
});

test('una desviación menor de quince minutos cuenta como puntual', () => {
  const c = compararConHabitual('23:55', minutosNocturnos('23:50')!);
  assert.match(c!.texto, /puntual/);
});

test('el trasnoche empieza a las 2:00, no antes', () => {
  assert.equal(esTrasnoche('23:50'), false);
  assert.equal(esTrasnoche('01:59'), false);
  assert.equal(esTrasnoche('02:00'), true);
  assert.equal(esTrasnoche('03:30'), true);
});
