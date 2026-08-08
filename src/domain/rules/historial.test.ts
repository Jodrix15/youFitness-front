import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Checkin } from '../models/checkin';
import type { Comida } from '../models/comida';
import type { Sesion } from '../models/entreno';
import type { PesoRegistro } from '../models/peso';
import type { XpEvento } from '../models/xp';
import { resumirAnio, resumirDia, resumirMes, resumirTodo, type FuentesHistorial } from './historial';

const VACIO: FuentesHistorial = {
  pesajes: [],
  comidas: [],
  sesiones: [],
  checkins: [],
  eventos: [],
};

let n = 0;
const meta = () => {
  n++;
  return {
    id: `x${n}`,
    usuarioId: 'u1',
    creadoEn: '2026-08-06T10:00:00.000Z',
    actualizadoEn: '2026-08-06T10:00:00.000Z',
    borradoEn: null,
  };
};

const pesaje = (fecha: string, pesoKg: number): PesoRegistro => ({
  ...meta(),
  fecha,
  pesoKg,
  hora: '07:12',
  nota: null,
});

const comida = (fecha: string, esDesliz = false, editado = false): Comida => ({
  ...meta(),
  fecha,
  tipo: 'comida',
  hora: '14:00',
  descripcion: 'Algo',
  recetaId: null,
  protPorciones: 1,
  verdPorciones: 2,
  hidrPorciones: 1,
  grasPorciones: 0,
  saciedad: 3,
  nota: null,
  esDesliz,
  editadoEn: editado ? '2026-08-06T15:00:00.000Z' : null,
});

const sesion = (fecha: string, volumen = 1000, terminada = true): Sesion => ({
  ...meta(),
  rutinaId: null,
  nombre: 'Empuje',
  fecha,
  horaInicio: '18:00',
  horaFin: '19:00',
  esfuerzoPercibido: 7,
  nota: null,
  volumenTotal: volumen,
  segundosIsometricos: 0,
  pesoCorporalKg: 80,
  series: [],
  terminada,
});

const checkin = (fecha: string): Checkin => ({
  ...meta(),
  fecha,
  animo: 4,
  energia: 7,
  estres: 3,
  suenoHoras: 7,
  suenoCalidad: 4,
  horaAcostarse: '23:50',
  nota: null,
  actividades: [],
});

const evento = (fecha: string, xp: number): XpEvento => ({
  ...meta(),
  fecha,
  hora: '10:00',
  tipo: 'peso_registrado',
  origenTabla: null,
  origenId: null,
  xpBase: xp,
  multiplicador: 1,
  xpFinal: xp,
  nota: null,
});

// ── Día ────────────────────────────────────────────────────────────────────

test('un día sin nada registrado se marca como vacío', () => {
  const d = resumirDia(VACIO, '2026-08-06');
  assert.equal(d.tieneAlgo, false);
  assert.equal(d.xp, 0);
});

test('el día reúne todo lo registrado en esa fecha', () => {
  const fuentes: FuentesHistorial = {
    pesajes: [pesaje('2026-08-06', 82.4)],
    comidas: [comida('2026-08-06')],
    sesiones: [sesion('2026-08-06')],
    checkins: [checkin('2026-08-06')],
    eventos: [evento('2026-08-06', 25), evento('2026-08-06', 20)],
  };

  const d = resumirDia(fuentes, '2026-08-06');
  assert.equal(d.tieneAlgo, true);
  assert.equal(d.pesaje?.pesoKg, 82.4);
  assert.equal(d.sesiones.length, 1);
  assert.ok(d.checkin);
  assert.equal(d.xp, 45);
});

test('lo de otros días no se cuela', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    pesajes: [pesaje('2026-08-05', 82.8)],
    eventos: [evento('2026-08-05', 25)],
  };
  const d = resumirDia(fuentes, '2026-08-06');
  assert.equal(d.pesaje, null);
  assert.equal(d.xp, 0);
});

test('las sesiones sin terminar no aparecen en el historial', () => {
  const fuentes: FuentesHistorial = { ...VACIO, sesiones: [sesion('2026-08-06', 500, false)] };
  const d = resumirDia(fuentes, '2026-08-06');
  assert.equal(d.sesiones.length, 0);
  assert.equal(d.tieneAlgo, false);
});

test('el día marca si algo se editó después', () => {
  const fuentes: FuentesHistorial = { ...VACIO, comidas: [comida('2026-08-06', false, true)] };
  assert.equal(resumirDia(fuentes, '2026-08-06').editado, true);
});

// ── Mes ────────────────────────────────────────────────────────────────────

test('el mes tiene tantos días como el calendario, no 30 fijos', () => {
  assert.equal(resumirMes(VACIO, 2026, 2).diasDelMes, 28, 'febrero de 2026');
  assert.equal(resumirMes(VACIO, 2024, 2).diasDelMes, 29, 'febrero bisiesto');
  assert.equal(resumirMes(VACIO, 2026, 8).diasDelMes, 31);
});

test('la intensidad cuenta categorías, no cantidad de registros', () => {
  const muchasComidas: FuentesHistorial = {
    ...VACIO,
    comidas: [comida('2026-08-06'), comida('2026-08-06'), comida('2026-08-06')],
  };
  const variado: FuentesHistorial = {
    ...VACIO,
    comidas: [comida('2026-08-06')],
    pesajes: [pesaje('2026-08-06', 82)],
    checkins: [checkin('2026-08-06')],
  };

  const soloComidas = resumirMes(muchasComidas, 2026, 8).dias[5]!;
  const conVariedad = resumirMes(variado, 2026, 8).dias[5]!;

  assert.equal(soloComidas.intensidad, 1, 'tres comidas siguen siendo una categoría');
  assert.equal(conVariedad.intensidad, 3);
});

test('el mes suma XP, cuenta días activos y promedia el peso', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    pesajes: [pesaje('2026-08-01', 83), pesaje('2026-08-02', 82)],
    sesiones: [sesion('2026-08-03', 1500)],
    eventos: [evento('2026-08-01', 25), evento('2026-08-03', 90)],
  };

  const m = resumirMes(fuentes, 2026, 8);
  assert.equal(m.diasConRegistro, 3);
  assert.equal(m.xpTotal, 115);
  assert.equal(m.pesajes, 2);
  assert.equal(m.pesoMedio, 82.5);
  assert.equal(m.volumenKg, 1500);
});

test('un mes sin pesajes no inventa una media', () => {
  assert.equal(resumirMes(VACIO, 2026, 8).pesoMedio, null);
});

// ── Año ────────────────────────────────────────────────────────────────────

test('el año tiene doce meses y suma sus totales', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    sesiones: [sesion('2026-01-15'), sesion('2026-08-06')],
    eventos: [evento('2026-01-15', 90), evento('2026-08-06', 90)],
  };

  const a = resumirAnio(fuentes, 2026);
  assert.equal(a.meses.length, 12);
  assert.equal(a.sesiones, 2);
  assert.equal(a.xpTotal, 180);
  assert.equal(a.diasConRegistro, 2);
  assert.equal(a.dias.length, 365, '2026 no es bisiesto');
});

test('el año bisiesto tiene 366 celdas', () => {
  assert.equal(resumirAnio(VACIO, 2024).dias.length, 366);
});

// ── Todo ───────────────────────────────────────────────────────────────────

test('sin datos, el resumen total está vacío pero no revienta', () => {
  const t = resumirTodo(VACIO);
  assert.equal(t.diasRegistrados, 0);
  assert.equal(t.primerRegistro, null);
  assert.equal(t.cambioDePesoKg, null);
  assert.deepEqual(t.anios, []);
});

test('el total cuenta días únicos, no registros', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    comidas: [comida('2026-08-06'), comida('2026-08-06'), comida('2026-08-07')],
    pesajes: [pesaje('2026-08-06', 82)],
  };

  const t = resumirTodo(fuentes);
  assert.equal(t.diasRegistrados, 2);
  assert.equal(t.comidas, 3);
});

test('los deslices se cuentan aparte de las comidas', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    comidas: [comida('2026-08-06'), comida('2026-08-06', true)],
  };
  const t = resumirTodo(fuentes);
  assert.equal(t.comidas, 1);
  assert.equal(t.deslices, 1);
});

test('el cambio de peso va del primer pesaje al último', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    pesajes: [pesaje('2026-01-01', 88), pesaje('2026-04-01', 84), pesaje('2026-08-06', 80.5)],
  };
  assert.equal(resumirTodo(fuentes).cambioDePesoKg, -7.5);
});

test('con un solo pesaje no hay cambio que calcular', () => {
  const fuentes: FuentesHistorial = { ...VACIO, pesajes: [pesaje('2026-08-06', 82)] };
  assert.equal(resumirTodo(fuentes).cambioDePesoKg, null);
});

test('los años se listan de más reciente a más antiguo', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    comidas: [comida('2024-05-01'), comida('2026-08-06'), comida('2025-01-01')],
  };
  assert.deepEqual(resumirTodo(fuentes).anios, [2026, 2025, 2024]);
});

test('el primer y el último registro salen de cualquier tipo de dato', () => {
  const fuentes: FuentesHistorial = {
    ...VACIO,
    checkins: [checkin('2025-12-31')],
    sesiones: [sesion('2026-08-06')],
  };
  const t = resumirTodo(fuentes);
  assert.equal(t.primerRegistro, '2025-12-31');
  assert.equal(t.ultimoRegistro, '2026-08-06');
});
