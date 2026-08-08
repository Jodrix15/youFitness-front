import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Comida } from '../models/comida';
import type { Rutina, Sesion } from '../models/entreno';
import { diaDeLaSemana, estadoDelDia, semaforoDeTema } from './temas';

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

const comida = (fecha: string, esDesliz = false): Comida => ({
  ...meta(),
  fecha,
  tipo: esDesliz ? 'snack' : 'comida',
  hora: '14:00',
  descripcion: esDesliz ? 'Donut' : 'Pollo con arroz',
  recetaId: null,
  protPorciones: esDesliz ? 0 : 1,
  verdPorciones: 0,
  hidrPorciones: 0,
  grasPorciones: 0,
  saciedad: null,
  nota: null,
  esDesliz,
  editadoEn: null,
});

const sesion = (fecha: string, terminada = true): Sesion => ({
  ...meta(),
  rutinaId: null,
  nombre: 'Empuje',
  fecha,
  horaInicio: '18:00',
  horaFin: '19:00',
  esfuerzoPercibido: 7,
  nota: null,
  volumenTotal: 1000,
  segundosIsometricos: 0,
  pesoCorporalKg: 80,
  series: [],
  terminada,
});

const rutina = (diasSemana: number[]): Rutina => ({
  ...meta(),
  nombre: 'Empuje A',
  icono: '🏋️',
  notas: null,
  ejercicios: [],
  vecesUsada: 0,
  diasSemana,
});

/** 2026-08-06 es jueves → día 4. */
const JUEVES = '2026-08-06';
const VIERNES = '2026-08-07';

test('los días de la semana van de 1 (lunes) a 7 (domingo)', () => {
  assert.equal(diaDeLaSemana('2026-08-03'), 1, 'lunes');
  assert.equal(diaDeLaSemana(JUEVES), 4, 'jueves');
  assert.equal(diaDeLaSemana('2026-08-09'), 7, 'domingo');
});

// ── Verde ──────────────────────────────────────────────────────────────────

test('comida limpia y entreno hecho es verde', () => {
  const e = estadoDelDia(
    { comidas: [comida(JUEVES)], sesiones: [sesion(JUEVES)], rutinas: [rutina([4])] },
    JUEVES,
  );
  assert.equal(e.semaforo, 'verde');
  assert.equal(e.temasConDesliz, 0);
});

test('un día de descanso con comida limpia sigue siendo verde', () => {
  // El jueves no toca rutina: descansar no es fallar.
  const e = estadoDelDia(
    { comidas: [comida(JUEVES)], sesiones: [], rutinas: [rutina([1, 3, 5])] },
    JUEVES,
  );
  assert.equal(e.entrenos.estado, 'no_aplica');
  assert.equal(e.semaforo, 'verde');
});

test('sin rutinas con días marcados nunca hay desliz de entreno', () => {
  const e = estadoDelDia({ comidas: [comida(JUEVES)], sesiones: [], rutinas: [rutina([])] }, JUEVES);
  assert.equal(e.entrenos.estado, 'no_aplica');
  assert.equal(e.semaforo, 'verde');
});

// ── Amarillo ───────────────────────────────────────────────────────────────

test('un desliz de comida con el entreno hecho es amarillo', () => {
  const e = estadoDelDia(
    {
      comidas: [comida(JUEVES), comida(JUEVES, true)],
      sesiones: [sesion(JUEVES)],
      rutinas: [rutina([4])],
    },
    JUEVES,
  );
  assert.equal(e.temasConDesliz, 1);
  assert.equal(e.semaforo, 'amarillo');
});

test('entreno saltado con la comida limpia también es amarillo', () => {
  const e = estadoDelDia(
    { comidas: [comida(JUEVES)], sesiones: [], rutinas: [rutina([4])] },
    JUEVES,
  );
  assert.equal(e.entrenos.estado, 'desliz');
  assert.equal(e.semaforo, 'amarillo');
  if (e.entrenos.estado !== 'desliz') return;
  assert.match(e.entrenos.motivo, /Empuje A/);
});

// ── Rojo ───────────────────────────────────────────────────────────────────

test('desliz de comida y entreno saltado es rojo', () => {
  const e = estadoDelDia(
    { comidas: [comida(JUEVES, true)], sesiones: [], rutinas: [rutina([4])] },
    JUEVES,
  );
  assert.equal(e.temasConDesliz, 2);
  assert.equal(e.semaforo, 'rojo');
});

test('varios deslices el mismo día siguen contando como un tema', () => {
  const e = estadoDelDia(
    {
      comidas: [comida(JUEVES, true), comida(JUEVES, true)],
      sesiones: [sesion(JUEVES)],
      rutinas: [rutina([4])],
    },
    JUEVES,
  );
  assert.equal(e.temasConDesliz, 1, 'el color mide temas, no cantidad');
  assert.equal(e.semaforo, 'amarillo');
  if (e.comidas.estado !== 'desliz') return;
  assert.match(e.comidas.motivo, /2 deslices/);
});

// ── Sin datos ──────────────────────────────────────────────────────────────

test('un día sin nada registrado NO es verde', () => {
  const e = estadoDelDia({ comidas: [], sesiones: [], rutinas: [] }, JUEVES);
  assert.equal(e.semaforo, 'sin_datos');
});

test('sin comidas registradas, ese tema no se juzga', () => {
  // Solo hay entreno hecho: el tema de comidas queda sin datos, no limpio.
  const e = estadoDelDia(
    { comidas: [], sesiones: [sesion(JUEVES)], rutinas: [rutina([4])] },
    JUEVES,
  );
  assert.equal(e.comidas.estado, 'no_aplica');
  assert.equal(e.semaforo, 'verde', 'lo que sí se puede juzgar está limpio');
});

test('una sesión sin terminar no cuenta como entreno hecho', () => {
  const e = estadoDelDia(
    { comidas: [comida(JUEVES)], sesiones: [sesion(JUEVES, false)], rutinas: [rutina([4])] },
    JUEVES,
  );
  assert.equal(e.entrenos.estado, 'desliz');
});

test('el entreno de otro día no salva el de hoy', () => {
  const e = estadoDelDia(
    { comidas: [comida(JUEVES)], sesiones: [sesion(VIERNES)], rutinas: [rutina([4])] },
    JUEVES,
  );
  assert.equal(e.entrenos.estado, 'desliz');
});

// ── Filtrado por un solo tema ──────────────────────────────────────────────

test('con un solo tema no existe el amarillo', () => {
  const e = estadoDelDia(
    { comidas: [comida(JUEVES, true)], sesiones: [sesion(JUEVES)], rutinas: [rutina([4])] },
    JUEVES,
  );

  assert.equal(e.semaforo, 'amarillo', 'juntos: un tema con desliz');
  assert.equal(semaforoDeTema(e, 'comidas'), 'rojo', 'mirando solo comidas: con desliz');
  assert.equal(semaforoDeTema(e, 'entrenos'), 'verde', 'mirando solo entrenos: limpio');
});

test('un tema sin datos sale sin datos aunque el otro esté limpio', () => {
  const e = estadoDelDia(
    { comidas: [], sesiones: [sesion(JUEVES)], rutinas: [rutina([4])] },
    JUEVES,
  );
  assert.equal(semaforoDeTema(e, 'comidas'), 'sin_datos');
  assert.equal(semaforoDeTema(e, 'entrenos'), 'verde');
});
