import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Ejercicio, Serie } from '../models/entreno';
import { detectarRecord, estimar1RM, totalizarSesion, volumenSerie } from './volumen';

const PESO_CORPORAL = 80;

function serie(datos: Partial<Serie> & { ejercicioId: string }): Serie {
  return {
    id: `s-${Math.random()}`,
    numero: 1,
    reps: null,
    pesoKg: null,
    lastreKg: null,
    segundos: null,
    rir: null,
    esPr: false,
    volumen: 0,
    ...datos,
  };
}

function ejercicio(id: string, tipo: Ejercicio['tipo'], factor = 1): Ejercicio {
  return {
    id,
    usuarioId: 'u1',
    nombre: id,
    tipo,
    grupoMuscular: 'pecho',
    factorApalancamiento: factor,
    notas: null,
    creadoEn: '2026-08-06T10:00:00.000Z',
    actualizadoEn: '2026-08-06T10:00:00.000Z',
    borradoEn: null,
  };
}

// ── Las cinco fórmulas de volumen ──────────────────────────────────────────

test('peso externo: repeticiones por kilos de la barra', () => {
  const v = volumenSerie({ reps: 5, pesoKg: 80, lastreKg: null, segundos: null }, 'externo', 1, PESO_CORPORAL);
  assert.equal(v, 400);
});

test('peso corporal: repeticiones por tu peso por el factor', () => {
  // Una dominada mueve casi todo tu peso: factor 1,00.
  const dominada = volumenSerie({ reps: 10, pesoKg: null, lastreKg: null, segundos: null }, 'corporal', 1, PESO_CORPORAL);
  assert.equal(dominada, 800);

  // Una flexión mueve bastante menos: factor 0,65.
  const flexion = volumenSerie({ reps: 10, pesoKg: null, lastreKg: null, segundos: null }, 'corporal', 0.65, PESO_CORPORAL);
  assert.equal(flexion, 520);
});

test('corporal con lastre: el lastre se suma a lo que ya movías', () => {
  const v = volumenSerie({ reps: 5, pesoKg: null, lastreKg: 20, segundos: null }, 'corporal_lastre', 1, PESO_CORPORAL);
  assert.equal(v, 500, '5 × (80 × 1 + 20)');
});

test('isométrico: segundos en lugar de repeticiones', () => {
  const v = volumenSerie({ reps: null, pesoKg: null, lastreKg: null, segundos: 45 }, 'isometrico', 0.6, PESO_CORPORAL);
  assert.equal(v, 2160, '45 × 80 × 0,6');
});

test('el cardio no genera volumen', () => {
  const v = volumenSerie({ reps: null, pesoKg: null, lastreKg: null, segundos: 1800 }, 'cardio', 1, PESO_CORPORAL);
  assert.equal(v, 0);
});

test('el volumen del isométrico no se suma al de kilos: es otra unidad', () => {
  const ejercicios = new Map([
    ['banca', ejercicio('banca', 'externo')],
    ['plancha', ejercicio('plancha', 'isometrico', 0.6)],
    ['correr', ejercicio('correr', 'cardio')],
  ]);

  const totales = totalizarSesion(
    [
      serie({ ejercicioId: 'banca', reps: 5, pesoKg: 80, volumen: 400 }),
      serie({ ejercicioId: 'plancha', segundos: 60, volumen: 2880 }),
      serie({ ejercicioId: 'correr', segundos: 1200, volumen: 0 }),
    ],
    ejercicios,
  );

  assert.equal(totales.volumenKg, 400, 'solo la banca');
  assert.equal(totales.segundosIsometricos, 60);
  assert.equal(totales.minutosCardio, 20);
  assert.equal(totales.seriesTotales, 3);
});

// ── 1RM ────────────────────────────────────────────────────────────────────

test('el 1RM sigue la fórmula de Epley', () => {
  assert.equal(estimar1RM(100, 1)?.kg, 103.3, '100 × (1 + 1/30)');
  assert.equal(estimar1RM(80, 5)?.kg, 93.3);
});

test('por encima de 8 repeticiones el 1RM se marca como poco fiable', () => {
  assert.equal(estimar1RM(60, 8)?.pocoFiable, false);
  assert.equal(estimar1RM(60, 12)?.pocoFiable, true);
});

test('sin peso o sin reps no hay estimación', () => {
  assert.equal(estimar1RM(0, 5), null);
  assert.equal(estimar1RM(80, 0), null);
});

// ── Récords ────────────────────────────────────────────────────────────────

test('la primera vez que haces un ejercicio no es un récord', () => {
  const r = detectarRecord({ reps: 10, pesoKg: 80, lastreKg: null, segundos: null, volumen: 800 }, 'externo', 'banca', []);
  assert.equal(r, null, 'sin historial no has superado nada');
});

test('en peso externo el récord es levantar más kilos', () => {
  const historico = [serie({ ejercicioId: 'banca', reps: 5, pesoKg: 77.5, volumen: 387.5 })];

  const mejor = detectarRecord(
    { reps: 5, pesoKg: 80, lastreKg: null, segundos: null, volumen: 400 },
    'externo',
    'banca',
    historico,
  );
  assert.equal(mejor?.clase, 'peso');
  assert.equal(mejor?.valor, 80);
  assert.equal(mejor?.mejora, 2.5);

  const peor = detectarRecord(
    { reps: 12, pesoKg: 70, lastreKg: null, segundos: null, volumen: 840 },
    'externo',
    'banca',
    historico,
  );
  assert.equal(peor, null, 'más volumen pero menos peso no es récord de fuerza');
});

test('en peso corporal el récord son más repeticiones', () => {
  const historico = [serie({ ejercicioId: 'dominada', reps: 10, volumen: 800 })];
  const r = detectarRecord(
    { reps: 12, pesoKg: null, lastreKg: null, segundos: null, volumen: 960 },
    'corporal',
    'dominada',
    historico,
  );
  assert.equal(r?.clase, 'reps');
  assert.equal(r?.mejora, 2);
});

test('en isométrico el récord son más segundos', () => {
  const historico = [serie({ ejercicioId: 'plancha', segundos: 60, volumen: 2880 })];
  const r = detectarRecord(
    { reps: null, pesoKg: null, lastreKg: null, segundos: 75, volumen: 3600 },
    'isometrico',
    'plancha',
    historico,
  );
  assert.equal(r?.clase, 'segundos');
  assert.equal(r?.valor, 75);
});

test('el cardio nunca genera récords', () => {
  const historico = [serie({ ejercicioId: 'correr', segundos: 600, volumen: 0 })];
  const r = detectarRecord(
    { reps: null, pesoKg: null, lastreKg: null, segundos: 3600, volumen: 0 },
    'cardio',
    'correr',
    historico,
  );
  assert.equal(r, null, 'alargar la sesión no es mejorar');
});

test('el récord se compara solo contra el mismo ejercicio', () => {
  const historico = [serie({ ejercicioId: 'sentadilla', reps: 5, pesoKg: 120, volumen: 600 })];
  const r = detectarRecord(
    { reps: 5, pesoKg: 80, lastreKg: null, segundos: null, volumen: 400 },
    'externo',
    'banca',
    historico,
  );
  assert.equal(r, null, 'la sentadilla no cuenta como historial de la banca');
});
