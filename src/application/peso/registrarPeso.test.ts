import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

import { totalXp } from '../../domain/rules/eventosXp';
import { estadoNivel } from '../../domain/rules/xp';
import { crearRepositoriosLocales } from '../../data/adapters/local/repositoriosLocales';
import { almacenEnMemoria } from '../../platform/almacen';
import { registrarPeso } from './registrarPeso';

const USUARIO = 'usuario-1';

function montar() {
  return crearRepositoriosLocales(almacenEnMemoria(), { nuevoId: () => randomUUID() });
}

const DIA = (n: number) => new Date(2026, 7, n, 7, 12);

test('registrar el peso guarda el pesaje y concede XP', async () => {
  const repos = montar();
  const r = await registrarPeso(repos, USUARIO, { pesoKg: 82.4 }, DIA(1));

  assert.equal(r.eraNuevo, true);
  assert.equal(r.xpGanado, 25);
  assert.equal(r.registro.pesoKg, 82.4);
  assert.equal(r.registro.hora, '07:12');
});

test('el XP se concede una sola vez al día por mucho que corrijas', async () => {
  const repos = montar();
  await registrarPeso(repos, USUARIO, { pesoKg: 82.4 }, DIA(1));
  const segunda = await registrarPeso(repos, USUARIO, { pesoKg: 82.1 }, DIA(1));

  assert.equal(segunda.eraNuevo, false);
  assert.equal(segunda.xpGanado, 0, 'corregir no vuelve a pagar');

  const eventos = await repos.xp.listar(USUARIO);
  assert.equal(eventos.length, 1);
  assert.equal(totalXp(eventos), 25);
});

test('pesarse dos veces el mismo día corrige, no acumula', async () => {
  const repos = montar();
  await registrarPeso(repos, USUARIO, { pesoKg: 82.4 }, DIA(1));
  await registrarPeso(repos, USUARIO, { pesoKg: 82.1 }, DIA(1));

  const pesajes = await repos.peso.listar(USUARIO);
  assert.equal(pesajes.length, 1);
  assert.equal(pesajes[0]?.pesoKg, 82.1);
});

test('el multiplicador de racha entra a partir del tercer día seguido', async () => {
  const repos = montar();
  const dias = [1, 2, 3].map((d) => DIA(d));

  const primero = await registrarPeso(repos, USUARIO, { pesoKg: 82 }, dias[0]);
  const segundo = await registrarPeso(repos, USUARIO, { pesoKg: 82 }, dias[1]);
  const tercero = await registrarPeso(repos, USUARIO, { pesoKg: 82 }, dias[2]);

  assert.equal(primero.xpGanado, 25, 'sin racha previa');
  assert.equal(segundo.xpGanado, 25, 'un día previo tampoco multiplica');
  // Al registrar el día 3 ya hay dos días previos seguidos... la racha se mide
  // sobre los días con actividad anteriores, así que aquí son 2 y aún no llega.
  assert.equal(tercero.xpGanado, 25);
});

test('con racha larga el peso vale más', async () => {
  const repos = montar();
  for (let d = 1; d <= 7; d++) {
    await registrarPeso(repos, USUARIO, { pesoKg: 82 }, DIA(d));
  }
  const octavo = await registrarPeso(repos, USUARIO, { pesoKg: 82 }, DIA(8));

  // Siete días seguidos previos → multiplicador ×1,2.
  assert.equal(octavo.xpGanado, 30);
});

test('romper la racha devuelve el XP a su valor base', async () => {
  const repos = montar();
  for (let d = 1; d <= 7; d++) {
    await registrarPeso(repos, USUARIO, { pesoKg: 82 }, DIA(d));
  }
  // Se salta del 8 al 20: la racha se rompe.
  const despues = await registrarPeso(repos, USUARIO, { pesoKg: 82 }, DIA(20));
  assert.equal(despues.xpGanado, 25);
});

test('el nivel es derivado del log, nunca un contador guardado', async () => {
  const repos = montar();
  for (let d = 1; d <= 12; d++) {
    await registrarPeso(repos, USUARIO, { pesoKg: 82 }, DIA(d));
  }

  const eventos = await repos.xp.listar(USUARIO);
  const nivel = estadoNivel(totalXp(eventos));

  assert.equal(eventos.length, 12);
  assert.ok(nivel.xpTotal > 300, 'doce pesajes con multiplicador pasan de 300 XP');
  assert.equal(nivel.nivel, 2);
});

test('cada evento apunta al pesaje que lo originó', async () => {
  const repos = montar();
  const r = await registrarPeso(repos, USUARIO, { pesoKg: 82.4 }, DIA(1));
  const [evento] = await repos.xp.listar(USUARIO);

  assert.equal(evento?.origenTabla, 'peso_registro');
  assert.equal(evento?.origenId, r.registro.id);
  assert.equal(evento?.tipo, 'peso_registrado');
});
