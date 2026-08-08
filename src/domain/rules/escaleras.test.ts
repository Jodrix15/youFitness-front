import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Serie, Sesion } from '../models/entreno';
import type { Escalera, Escalon } from '../models/escalera';
import { descripcionCriterio, estadoDeEscalera, evaluarEscalon } from './escaleras';

const EJ = 'dominada';

function escalon(extra: Partial<Escalon> = {}): Escalon {
  return {
    id: 'e1',
    orden: 0,
    nombre: 'Dominada',
    ejercicioId: EJ,
    criterioTexto: null,
    criterioSeries: 3,
    criterioReps: 10,
    criterioSegundos: null,
    criterioRir: 2,
    ...extra,
  };
}

let n = 0;
function serie(datos: Partial<Serie>): Serie {
  n++;
  return {
    id: `s${n}`,
    ejercicioId: EJ,
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

function sesion(fecha: string, series: Serie[], terminada = true): Sesion {
  return {
    id: `ses-${fecha}`,
    usuarioId: 'u1',
    rutinaId: null,
    nombre: 'Tirón',
    fecha,
    horaInicio: '18:00',
    horaFin: '19:00',
    esfuerzoPercibido: 7,
    nota: null,
    volumenTotal: 0,
    segundosIsometricos: 0,
    pesoCorporalKg: 80,
    series,
    terminada,
    creadoEn: '2026-08-06T18:00:00.000Z',
    actualizadoEn: '2026-08-06T19:00:00.000Z',
    borradoEn: null,
  };
}

test('sin sesiones el escalón no tiene datos', () => {
  assert.equal(evaluarEscalon(escalon(), []).estado, 'sin_datos');
});

test('el criterio se cumple con las series exigidas en una misma sesión', () => {
  const s = sesion('2026-08-06', [
    serie({ reps: 10, rir: 2 }),
    serie({ reps: 10, rir: 3 }),
    serie({ reps: 11, rir: 2 }),
  ]);

  const r = evaluarEscalon(escalon(), [s]);
  assert.equal(r.estado, 'cumplido');
  if (r.estado !== 'cumplido') return;
  assert.equal(r.seriesValidas, 3);
  assert.equal(r.enSesion, '2026-08-06');
});

test('sumar series buenas de días distintos NO cumple el criterio', () => {
  const sesiones = [
    sesion('2026-08-04', [serie({ reps: 10, rir: 2 })]),
    sesion('2026-08-05', [serie({ reps: 10, rir: 2 })]),
    sesion('2026-08-06', [serie({ reps: 10, rir: 2 })]),
  ];

  const r = evaluarEscalon(escalon(), sesiones);
  assert.equal(r.estado, 'en_progreso');
  if (r.estado !== 'en_progreso') return;
  assert.equal(r.seriesValidas, 1, 'cuenta la mejor sesión, no el total');
});

test('quedarse corto de repeticiones invalida la serie', () => {
  const s = sesion('2026-08-06', [
    serie({ reps: 10, rir: 2 }),
    serie({ reps: 9, rir: 2 }),
    serie({ reps: 8, rir: 2 }),
  ]);

  const r = evaluarEscalon(escalon(), [s]);
  assert.equal(r.estado, 'en_progreso');
  if (r.estado !== 'en_progreso') return;
  assert.equal(r.seriesValidas, 1);
});

test('el RIR exigido descarta las series hechas al fallo', () => {
  const s = sesion('2026-08-06', [
    serie({ reps: 12, rir: 0 }),
    serie({ reps: 11, rir: 1 }),
    serie({ reps: 10, rir: 2 }),
  ]);

  const r = evaluarEscalon(escalon(), [s]);
  assert.equal(r.estado, 'en_progreso');
  if (r.estado !== 'en_progreso') return;
  assert.equal(r.seriesValidas, 1, 'solo la que tuvo margen');
});

test('sin RIR anotado la serie no vale si el criterio lo exige', () => {
  const s = sesion('2026-08-06', [serie({ reps: 15 }), serie({ reps: 15 }), serie({ reps: 15 })]);
  const r = evaluarEscalon(escalon(), [s]);
  assert.equal(r.estado, 'en_progreso');
});

test('un escalón sin RIR exigido acepta cualquier margen', () => {
  const s = sesion('2026-08-06', [
    serie({ reps: 10 }),
    serie({ reps: 10 }),
    serie({ reps: 10 }),
  ]);
  assert.equal(evaluarEscalon(escalon({ criterioRir: null }), [s]).estado, 'cumplido');
});

test('las sesiones sin terminar no cuentan', () => {
  const s = sesion(
    '2026-08-06',
    [serie({ reps: 10, rir: 2 }), serie({ reps: 10, rir: 2 }), serie({ reps: 10, rir: 2 })],
    false,
  );
  assert.equal(evaluarEscalon(escalon(), [s]).estado, 'sin_datos');
});

test('los isométricos se evalúan por segundos', () => {
  const criterio = escalon({ criterioReps: null, criterioSegundos: 30, criterioSeries: 2 });
  const s = sesion('2026-08-06', [
    serie({ segundos: 35, rir: 2 }),
    serie({ segundos: 31, rir: 2 }),
    serie({ segundos: 20, rir: 3 }),
  ]);
  assert.equal(evaluarEscalon(criterio, [s]).estado, 'cumplido');
});

test('el criterio se describe de forma legible', () => {
  assert.equal(descripcionCriterio(escalon()), '3 series × 10 reps con RIR ≥ 2');
  assert.equal(
    descripcionCriterio(escalon({ criterioTexto: 'Hasta que salga limpia' })),
    'Hasta que salga limpia',
  );
});

test('el ascenso se ofrece pero la escalera no sube sola', () => {
  const escalera: Escalera = {
    id: 'esc1',
    usuarioId: 'u1',
    nombre: 'Dominada',
    icono: '🪜',
    escalonActual: 0,
    fechaUltimoAscenso: null,
    escalones: [escalon({ id: 'a', orden: 0 }), escalon({ id: 'b', orden: 1, nombre: 'Lastrada' })],
    creadoEn: '2026-08-01T10:00:00.000Z',
    actualizadoEn: '2026-08-01T10:00:00.000Z',
    borradoEn: null,
  };

  const s = sesion('2026-08-06', [
    serie({ reps: 10, rir: 2 }),
    serie({ reps: 10, rir: 2 }),
    serie({ reps: 10, rir: 2 }),
  ]);

  const estado = estadoDeEscalera(escalera, [s]);
  assert.equal(estado.puedeAscender, true);
  assert.equal(estado.siguiente?.nombre, 'Lastrada');
  assert.equal(estado.escalera.escalonActual, 0, 'sigue en el mismo escalón hasta que confirmes');
});

test('en el último escalón cumplido la escalera está completada', () => {
  const escalera: Escalera = {
    id: 'esc1',
    usuarioId: 'u1',
    nombre: 'Dominada',
    icono: '🪜',
    escalonActual: 1,
    fechaUltimoAscenso: '2026-08-01',
    escalones: [escalon({ id: 'a', orden: 0 }), escalon({ id: 'b', orden: 1 })],
    creadoEn: '2026-08-01T10:00:00.000Z',
    actualizadoEn: '2026-08-01T10:00:00.000Z',
    borradoEn: null,
  };

  const s = sesion('2026-08-06', [
    serie({ reps: 10, rir: 2 }),
    serie({ reps: 10, rir: 2 }),
    serie({ reps: 10, rir: 2 }),
  ]);

  const estado = estadoDeEscalera(escalera, [s]);
  assert.equal(estado.completada, true);
  assert.equal(estado.puedeAscender, false);
});
