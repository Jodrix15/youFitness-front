import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

import { PERFIL_POR_DEFECTO } from '../../domain/models/perfil';
import { totalXp } from '../../domain/rules/eventosXp';
import { crearRepositoriosLocales } from '../../data/adapters/local/repositoriosLocales';
import type { Repositorios } from '../../data/repositories';
import { almacenEnMemoria } from '../../platform/almacen';
import { registrarComida, registrarDesliz } from './registrarComida';

const COMIDA_BASE = {
  tipo: 'comida' as const,
  descripcion: 'Pollo con arroz',
  recetaId: null,
  protPorciones: 1,
  verdPorciones: 2,
  hidrPorciones: 1,
  grasPorciones: 1,
  saciedad: 3,
  nota: null,
};

const DETALLE = {
  categoria: 'bolleria' as const,
  cantidad: 'racion' as const,
  sustituyoComida: false,
  disparador: 'aburrimiento' as const,
  emocionDespues: 3,
  lugar: 'Oficina',
  nota: null,
};

/** 2026-08-06 es jueves; la semana empieza el lunes 3. */
const DIA = (n: number, h = 14) => new Date(2026, 7, n, h, 20);

async function montar(modoEstricto = false): Promise<{ repos: Repositorios; usuarioId: string }> {
  const repos = crearRepositoriosLocales(almacenEnMemoria(), { nuevoId: () => randomUUID() });
  const perfil = await repos.perfil.crear({
    nombre: 'Jordi',
    fechaNacimiento: null,
    edad: 34,
    alturaCm: 178,
    sexo: 'hombre',
    pesoInicialKg: 82.4,
    cinturaCm: null,
    ...PERFIL_POR_DEFECTO,
    modoEstricto,
  });
  return { repos, usuarioId: perfil.usuarioId };
}

test('registrar una comida da 20 XP', async () => {
  const { repos, usuarioId } = await montar();
  const r = await registrarComida(repos, usuarioId, COMIDA_BASE, DIA(6));

  assert.equal(r.xpGanado, 20);
  assert.equal(r.comida.esDesliz, false);
  assert.equal(r.comida.hora, '14:20');
});

test('varias comidas el mismo día pagan cada una', async () => {
  const { repos, usuarioId } = await montar();
  await registrarComida(repos, usuarioId, { ...COMIDA_BASE, tipo: 'desayuno' }, DIA(6, 8));
  await registrarComida(repos, usuarioId, COMIDA_BASE, DIA(6, 14));
  await registrarComida(repos, usuarioId, { ...COMIDA_BASE, tipo: 'cena' }, DIA(6, 21));

  const comidas = await repos.comidas.listar(usuarioId);
  assert.equal(comidas.length, 3, 'a diferencia del peso, aquí no hay tope diario');
  assert.equal(totalXp(await repos.xp.listar(usuarioId)), 60);
});

test('registrar desde una receta suma su contador de usos', async () => {
  const { repos, usuarioId } = await montar();
  const receta = await repos.recetas.crear(usuarioId, {
    nombre: 'Lentejas',
    icono: '🍲',
    raciones: 4,
    ingredientes: 'Lentejas, zanahoria',
    notas: null,
    protPorciones: 1,
    verdPorciones: 2,
    hidrPorciones: 1,
    grasPorciones: 0,
  });

  await registrarComida(repos, usuarioId, { ...COMIDA_BASE, recetaId: receta.id }, DIA(6));
  await registrarComida(repos, usuarioId, { ...COMIDA_BASE, recetaId: receta.id }, DIA(7));

  const [actualizada] = await repos.recetas.listar(usuarioId);
  assert.equal(actualizada?.vecesUsada, 2);
});

test('registrar un desliz siempre da 15 XP', async () => {
  const { repos, usuarioId } = await montar();
  const r = await registrarDesliz(repos, usuarioId, { descripcion: 'Donut', detalle: DETALLE }, DIA(6, 17));

  assert.equal(r.xpGanado, 15);
  assert.equal(r.xpPenalizado, 0);
  assert.equal(r.comida.esDesliz, true);
});

test('el desliz es una comida marcada, no una tabla paralela', async () => {
  const { repos, usuarioId } = await montar();
  await registrarComida(repos, usuarioId, COMIDA_BASE, DIA(6, 14));
  await registrarDesliz(repos, usuarioId, { descripcion: 'Donut', detalle: DETALLE }, DIA(6, 17));

  const delDia = await repos.comidas.listarPorFecha(usuarioId, '2026-08-06');
  assert.equal(delDia.length, 2, 'los dos salen en el mismo timeline');

  const detalles = await repos.comidas.listarDetallesDesliz(usuarioId);
  assert.equal(detalles.length, 1);
  assert.equal(detalles[0]?.disparador, 'aburrimiento');
});

test('sin modo estricto, pasarse del presupuesto no penaliza', async () => {
  const { repos, usuarioId } = await montar(false);
  for (const dia of [3, 4, 5]) {
    await registrarDesliz(repos, usuarioId, { descripcion: 'Donut', detalle: DETALLE }, DIA(dia));
  }
  const cuarto = await registrarDesliz(
    repos,
    usuarioId,
    { descripcion: 'Donut', detalle: DETALLE },
    DIA(6),
  );
  assert.equal(cuarto.xpPenalizado, 0);
});

test('con modo estricto, el tercero de la semana resta 25 aparte', async () => {
  const { repos, usuarioId } = await montar(true);

  const primero = await registrarDesliz(repos, usuarioId, { descripcion: 'D', detalle: DETALLE }, DIA(3));
  const segundo = await registrarDesliz(repos, usuarioId, { descripcion: 'D', detalle: DETALLE }, DIA(4));
  const tercero = await registrarDesliz(repos, usuarioId, { descripcion: 'D', detalle: DETALLE }, DIA(5));

  assert.equal(primero.xpPenalizado, 0);
  assert.equal(segundo.xpPenalizado, 0);
  assert.equal(tercero.xpPenalizado, -25);
  assert.equal(tercero.xpGanado, 15, 'registrarlo sigue pagando: confesar nunca sale a pérdidas');
});

test('se puede registrar una comida en un día pasado', async () => {
  const { repos, usuarioId } = await montar();
  await registrarComida(repos, usuarioId, { ...COMIDA_BASE, fecha: '2026-08-01' }, DIA(6));

  const delDia = await repos.comidas.listarPorFecha(usuarioId, '2026-08-01');
  assert.equal(delDia.length, 1, 'se guarda en la fecha indicada, no en hoy');

  const [evento] = await repos.xp.listar(usuarioId);
  assert.equal(evento?.fecha, '2026-08-01', 'y el XP cuenta para ese día');
});

test('corregir una comida no paga XP otra vez y deja marca de editado', async () => {
  const { repos, usuarioId } = await montar();
  const r = await registrarComida(repos, usuarioId, COMIDA_BASE, DIA(6));

  await repos.comidas.actualizar(usuarioId, r.comida.id, { descripcion: 'Pollo con quinoa' });

  const comidas = await repos.comidas.listar(usuarioId);
  assert.equal(comidas.length, 1);
  assert.equal(comidas[0]?.descripcion, 'Pollo con quinoa');
  assert.ok(comidas[0]?.editadoEn, 'queda constancia de que se tocó');

  assert.equal(totalXp(await repos.xp.listar(usuarioId)), 20, 'sigue habiendo un solo pago');
});

test('borrar una comida la saca del diario pero no devuelve el XP', async () => {
  const { repos, usuarioId } = await montar();
  const r = await registrarComida(repos, usuarioId, COMIDA_BASE, DIA(6));

  await repos.comidas.borrar(usuarioId, r.comida.id);

  const comidas = await repos.comidas.listar(usuarioId);
  assert.equal(comidas.length, 0, 'desaparece de las consultas');
  assert.equal(
    totalXp(await repos.xp.listar(usuarioId)),
    20,
    'el log de XP es inmutable: no se reescribe el pasado',
  );
});

test('el presupuesto se reinicia con la semana natural', async () => {
  const { repos, usuarioId } = await montar(true);
  // Lunes 3, martes 4 y miércoles 5: se agota el presupuesto.
  for (const dia of [3, 4]) {
    await registrarDesliz(repos, usuarioId, { descripcion: 'D', detalle: DETALLE }, DIA(dia));
  }
  // El lunes siguiente es día 10: semana nueva, contador a cero.
  const nuevaSemana = await registrarDesliz(
    repos,
    usuarioId,
    { descripcion: 'D', detalle: DETALLE },
    DIA(10),
  );
  assert.equal(nuevaSemana.xpPenalizado, 0);
});
