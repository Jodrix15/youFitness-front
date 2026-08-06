import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

import type { NuevoCheckin } from '../../domain/models/checkin';
import { PERFIL_POR_DEFECTO } from '../../domain/models/perfil';
import { totalXp } from '../../domain/rules/eventosXp';
import { crearRepositoriosLocales } from '../../data/adapters/local/repositoriosLocales';
import type { Repositorios } from '../../data/repositories';
import { almacenEnMemoria } from '../../platform/almacen';
import { cerrarDia } from './cerrarDia';

const NOCHE = new Date(2026, 7, 6, 23, 40);

const BASE: NuevoCheckin = {
  fecha: '2026-08-06',
  animo: 4,
  energia: 7,
  estres: 4,
  suenoHoras: 6.5,
  suenoCalidad: 3,
  horaAcostarse: '23:50',
  nota: null,
  actividades: ['meditar'],
};

async function montar(modoEstricto: boolean): Promise<{ repos: Repositorios; usuarioId: string }> {
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

test('cerrar el día guarda el check-in y da 30 XP', async () => {
  const { repos, usuarioId } = await montar(false);
  const r = await cerrarDia(repos, usuarioId, BASE, NOCHE);

  assert.equal(r.eraNuevo, true);
  assert.equal(r.xpGanado, 30);
  assert.equal(r.xpPenalizado, 0);
  assert.deepEqual(r.registro.actividades, ['meditar']);
});

test('cerrar el día dos veces corrige y no vuelve a pagar', async () => {
  const { repos, usuarioId } = await montar(false);
  await cerrarDia(repos, usuarioId, BASE, NOCHE);
  const segunda = await cerrarDia(repos, usuarioId, { ...BASE, animo: 2 }, NOCHE);

  assert.equal(segunda.xpGanado, 0);
  assert.equal(segunda.registro.animo, 2);

  const checkins = await repos.checkins.listar(usuarioId);
  assert.equal(checkins.length, 1);
  assert.equal(totalXp(await repos.xp.listar(usuarioId)), 30);
});

test('sin modo estricto, trasnochar no penaliza', async () => {
  const { repos, usuarioId } = await montar(false);
  const r = await cerrarDia(repos, usuarioId, { ...BASE, horaAcostarse: '03:30' }, NOCHE);

  assert.equal(r.xpGanado, 30);
  assert.equal(r.xpPenalizado, 0);
});

test('con modo estricto, trasnochar resta 15 aparte', async () => {
  const { repos, usuarioId } = await montar(true);
  const r = await cerrarDia(repos, usuarioId, { ...BASE, horaAcostarse: '03:30' }, NOCHE);

  assert.equal(r.xpGanado, 30, 'registrar nunca resta');
  assert.equal(r.xpPenalizado, -15);
  assert.equal(totalXp(await repos.xp.listar(usuarioId)), 15);
});

test('la penalización es un evento aparte, para poder explicarla', async () => {
  const { repos, usuarioId } = await montar(true);
  await cerrarDia(repos, usuarioId, { ...BASE, horaAcostarse: '03:30' }, NOCHE);

  const eventos = await repos.xp.listar(usuarioId);
  assert.equal(eventos.length, 2, 'no se guarda un neto de +15');

  const suma = eventos.find((e) => e.xpFinal > 0);
  const resta = eventos.find((e) => e.xpFinal < 0);
  assert.equal(suma?.tipo, 'dia_cerrado');
  assert.equal(resta?.nota, 'Acostarse después de las 2:00');
  assert.equal(resta?.multiplicador, 1, 'las restas nunca llevan multiplicador');
});

test('acostarse a la 1:59 con modo estricto todavía no penaliza', async () => {
  const { repos, usuarioId } = await montar(true);
  const r = await cerrarDia(repos, usuarioId, { ...BASE, horaAcostarse: '01:59' }, NOCHE);
  assert.equal(r.xpPenalizado, 0);
});

test('el check-in queda ligado al evento de XP que generó', async () => {
  const { repos, usuarioId } = await montar(false);
  const r = await cerrarDia(repos, usuarioId, BASE, NOCHE);
  const [evento] = await repos.xp.listar(usuarioId);

  assert.equal(evento?.origenTabla, 'checkin');
  assert.equal(evento?.origenId, r.registro.id);
});
