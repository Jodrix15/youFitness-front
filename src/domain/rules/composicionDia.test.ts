import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Comida, TipoComida } from '../models/comida';
import { componerDia, rachaDiasCompletos } from './composicionDia';

let contador = 0;

function comida(
  fecha: string,
  tipo: TipoComida,
  porciones: Partial<Pick<Comida, 'protPorciones' | 'verdPorciones' | 'hidrPorciones' | 'grasPorciones'>> = {},
  esDesliz = false,
): Comida {
  contador++;
  return {
    id: `c${contador}`,
    usuarioId: 'u1',
    fecha,
    tipo,
    hora: '13:00',
    descripcion: 'Algo',
    recetaId: null,
    protPorciones: 0,
    verdPorciones: 0,
    hidrPorciones: 0,
    grasPorciones: 0,
    ...porciones,
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

test('las raciones se suman entre comidas', () => {
  const d = componerDia(
    [
      comida(HOY, 'desayuno', { verdPorciones: 1, hidrPorciones: 1 }),
      comida(HOY, 'comida', { verdPorciones: 2, hidrPorciones: 1 }),
    ],
    HOY,
  );
  assert.equal(d.verdura.raciones, 3);
  assert.equal(d.hidratos.raciones, 2);
});

test('la proteína se mide en comidas que la llevan, no en raciones totales', () => {
  // Tres raciones en una sola comida no equivalen a repartirla en tres.
  const concentrada = componerDia([comida(HOY, 'comida', { protPorciones: 3 })], HOY);
  assert.equal(concentrada.proteina.raciones, 1, 'una sola comida con proteína');

  const repartida = componerDia(
    [
      comida(HOY, 'desayuno', { protPorciones: 1 }),
      comida(HOY, 'comida', { protPorciones: 1 }),
      comida(HOY, 'cena', { protPorciones: 1 }),
    ],
    HOY,
  );
  assert.equal(repartida.proteina.raciones, 3);
  assert.equal(repartida.proteina.progreso, 1);
});

test('el snack no cuenta como comida principal', () => {
  const d = componerDia(
    [
      comida(HOY, 'desayuno'),
      comida(HOY, 'comida'),
      comida(HOY, 'snack'),
    ],
    HOY,
  );
  assert.equal(d.principalesRegistradas, 2);
  assert.deepEqual(d.faltan, ['cena']);
});

test('el desliz aparece en el día pero no cuenta como comida ni suma raciones', () => {
  const d = componerDia(
    [comida(HOY, 'comida', { verdPorciones: 2 }), comida(HOY, 'snack', { hidrPorciones: 3 }, true)],
    HOY,
  );
  assert.equal(d.comidas.length, 2, 'sale en el mismo timeline');
  assert.equal(d.deslices, 1);
  assert.equal(d.hidratos.raciones, 0, 'el desliz no contamina la composición');
});

test('las comidas de otros días no se cuelan', () => {
  const d = componerDia([comida('2026-08-05', 'desayuno'), comida(HOY, 'comida')], HOY);
  assert.equal(d.comidas.length, 1);
});

test('el progreso nunca pasa de 1 aunque comas de más', () => {
  const d = componerDia([comida(HOY, 'comida', { verdPorciones: 3 }), comida(HOY, 'cena', { verdPorciones: 3 })], HOY);
  assert.equal(d.verdura.raciones, 6);
  assert.equal(d.verdura.progreso, 1);
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

test('un desliz anotado como cena cubre la cena del día', () => {
  const d = componerDia(
    [
      comida(HOY, 'desayuno', { protPorciones: 1 }),
      comida(HOY, 'comida', { protPorciones: 1, verdPorciones: 2 }),
      comida(HOY, 'cena', {}, true),
    ],
    HOY,
  );

  assert.equal(d.principalesRegistradas, 3, 'la pizza de cena es la cena');
  assert.deepEqual(d.faltan, []);
  assert.equal(d.completo, true);
  assert.equal(d.deslices, 1);
});

test('cubrir la comida con un desliz no regala raciones ni proteína', () => {
  const d = componerDia([comida(HOY, 'cena', { hidrPorciones: 3, protPorciones: 2 }, true)], HOY);

  assert.equal(d.principalesRegistradas, 1, 'la cena está registrada');
  assert.equal(d.hidratos.raciones, 0, 'pero no suma a la composición');
  assert.equal(d.verdura.raciones, 0);
  assert.equal(d.proteina.raciones, 0, 'un desliz nunca cuenta como comida con proteína');
});

test('un desliz de tipo snack sigue sin ocupar ninguna comida principal', () => {
  const d = componerDia([comida(HOY, 'desayuno'), comida(HOY, 'snack', {}, true)], HOY);
  assert.equal(d.principalesRegistradas, 1);
  assert.deepEqual(d.faltan, ['comida', 'cena']);
});

test('repetir una comida no infla el contador', () => {
  const d = componerDia([comida(HOY, 'cena'), comida(HOY, 'cena')], HOY);
  assert.equal(d.principalesRegistradas, 1, 'dos cenas siguen siendo una cena');
});

test('un desliz como cena mantiene viva la racha de días completos', () => {
  const comidas = [
    comida('2026-08-05', 'desayuno'),
    comida('2026-08-05', 'comida'),
    comida('2026-08-05', 'cena'),
    comida(HOY, 'desayuno'),
    comida(HOY, 'comida'),
    comida(HOY, 'cena', {}, true),
  ];
  assert.equal(rachaDiasCompletos(comidas, HOY), 2);
});
