import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

import type { Ejercicio } from '../../domain/models/entreno';
import { PERFIL_POR_DEFECTO } from '../../domain/models/perfil';
import { totalXp } from '../../domain/rules/eventosXp';
import { crearRepositoriosLocales } from '../../data/adapters/local/repositoriosLocales';
import type { Repositorios } from '../../data/repositories';
import { almacenEnMemoria } from '../../platform/almacen';
import { anotarCierre, anotarSerie, iniciarSesion, terminarSesion } from './sesion';

const DIA = (n: number, h = 18) => new Date(2026, 7, n, h, 0);

async function montar() {
  const repos = crearRepositoriosLocales(almacenEnMemoria(), { nuevoId: () => randomUUID() });
  const perfil = await repos.perfil.crear({
    nombre: 'Jordi',
    fechaNacimiento: null,
    edad: 34,
    alturaCm: 178,
    sexo: 'hombre',
    pesoInicialKg: 80,
    cinturaCm: null,
    ...PERFIL_POR_DEFECTO,
  });

  const banca = await repos.ejercicios.crear(perfil.usuarioId, {
    nombre: 'Press banca',
    tipo: 'externo',
    grupoMuscular: 'pecho',
    factorApalancamiento: 1,
    notas: null,
  });

  const dominada = await repos.ejercicios.crear(perfil.usuarioId, {
    nombre: 'Dominada',
    tipo: 'corporal',
    grupoMuscular: 'espalda',
    factorApalancamiento: 1,
    notas: null,
  });

  return { repos, usuarioId: perfil.usuarioId, banca, dominada };
}

async function anotar(
  repos: Repositorios,
  usuarioId: string,
  sesionId: string,
  ejercicio: Ejercicio,
  datos: { reps?: number; pesoKg?: number },
) {
  const sesion = (await repos.sesiones.obtener(usuarioId, sesionId))!;
  return anotarSerie(
    repos,
    usuarioId,
    sesion,
    ejercicio,
    {
      ejercicioId: ejercicio.id,
      reps: datos.reps ?? null,
      pesoKg: datos.pesoKg ?? null,
      lastreKg: null,
      segundos: null,
      rir: null,
    },
    () => randomUUID(),
  );
}

test('empezar una sesión congela el peso corporal del día', async () => {
  const { repos, usuarioId } = await montar();
  await repos.peso.guardar(usuarioId, { fecha: '2026-08-06', pesoKg: 82.4 });

  const s = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  assert.equal(s.pesoCorporalKg, 82.4);
  assert.equal(s.terminada, false);
});

test('no se abren dos sesiones a la vez', async () => {
  const { repos, usuarioId } = await montar();
  const primera = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  const segunda = await iniciarSesion(repos, usuarioId, {}, DIA(6, 19));

  assert.equal(segunda.id, primera.id, 'devuelve la que ya estaba abierta');
  assert.equal((await repos.sesiones.listar(usuarioId)).length, 1);
});

test('el volumen se calcula al anotar, con el peso corporal congelado', async () => {
  const { repos, usuarioId, dominada } = await montar();
  await repos.peso.guardar(usuarioId, { fecha: '2026-08-06', pesoKg: 80 });

  const s = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  const conSerie = await anotar(repos, usuarioId, s.id, dominada, { reps: 10 });

  assert.equal(conSerie.series[0]?.volumen, 800);

  // Adelgazar después no reescribe el volumen del entreno de aquel día.
  await repos.peso.guardar(usuarioId, { fecha: '2026-08-20', pesoKg: 70 });
  const releida = await repos.sesiones.obtener(usuarioId, s.id);
  assert.equal(releida?.series[0]?.volumen, 800);
});

test('una sesión sin series no cuenta como entreno', async () => {
  const { repos, usuarioId } = await montar();
  const s = await iniciarSesion(repos, usuarioId, {}, DIA(6));

  const r = await terminarSesion(repos, usuarioId, s, { esfuerzoPercibido: null, nota: null }, DIA(6, 19));
  assert.equal(r, null);
  assert.equal(totalXp(await repos.xp.listar(usuarioId)), 0);
});

test('terminar paga base más series de una sola vez', async () => {
  const { repos, usuarioId, banca } = await montar();
  const s = await iniciarSesion(repos, usuarioId, {}, DIA(6));

  for (let i = 0; i < 4; i++) {
    await anotar(repos, usuarioId, s.id, banca, { reps: 5, pesoKg: 80 });
  }

  const actual = (await repos.sesiones.obtener(usuarioId, s.id))!;
  const r = await terminarSesion(repos, usuarioId, actual, { esfuerzoPercibido: 7, nota: null }, DIA(6, 19));

  assert.ok(r);
  assert.equal(r.desglose.base, 80);
  assert.equal(r.desglose.porSeries, 10, '4 series × 2,5');
  assert.equal(r.xpGanado, 90, 'sin racha previa no hay multiplicador');
  assert.equal(r.sesion.terminada, true);
  assert.equal(r.sesion.volumenTotal, 1600);
});

test('cerrar dos veces la misma sesión NO paga el entreno dos veces', async () => {
  const { repos, usuarioId, banca } = await montar();
  const s = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  await anotar(repos, usuarioId, s.id, banca, { reps: 5, pesoKg: 80 });

  const actual = (await repos.sesiones.obtener(usuarioId, s.id))!;
  const primera = await terminarSesion(repos, usuarioId, actual, { esfuerzoPercibido: 7, nota: null }, DIA(6, 19));
  assert.ok(primera);

  const yaCerrada = (await repos.sesiones.obtener(usuarioId, s.id))!;
  const segunda = await terminarSesion(
    repos,
    usuarioId,
    yaCerrada,
    { esfuerzoPercibido: 9, nota: 'otra' },
    DIA(6, 20),
  );

  assert.equal(segunda, null, 'una sesión ya terminada no se vuelve a cerrar');
  // 80 de base + una serie a 2,5, redondeado al final = 83.
  assert.equal(totalXp(await repos.xp.listar(usuarioId)), 83, 'un solo pago');
});

test('el esfuerzo y la nota se pueden editar después sin tocar el XP', async () => {
  const { repos, usuarioId, banca } = await montar();
  const s = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  await anotar(repos, usuarioId, s.id, banca, { reps: 5, pesoKg: 80 });

  const actual = (await repos.sesiones.obtener(usuarioId, s.id))!;
  await terminarSesion(repos, usuarioId, actual, { esfuerzoPercibido: null, nota: null }, DIA(6, 19));

  const xpAntes = totalXp(await repos.xp.listar(usuarioId));
  await anotarCierre(repos, usuarioId, s.id, { esfuerzoPercibido: 8, nota: 'Buen día' });

  const guardada = await repos.sesiones.obtener(usuarioId, s.id);
  assert.equal(guardada?.esfuerzoPercibido, 8);
  assert.equal(guardada?.nota, 'Buen día');
  assert.equal(guardada?.terminada, true);
  assert.equal(totalXp(await repos.xp.listar(usuarioId)), xpAntes, 'el XP no se mueve');
});

test('el primer entreno de un ejercicio no genera récords', async () => {
  const { repos, usuarioId, banca } = await montar();
  const s = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  await anotar(repos, usuarioId, s.id, banca, { reps: 5, pesoKg: 80 });

  const actual = (await repos.sesiones.obtener(usuarioId, s.id))!;
  const r = await terminarSesion(repos, usuarioId, actual, { esfuerzoPercibido: null, nota: null }, DIA(6, 19));

  assert.equal(r?.desglose.records.length, 0);
});

test('superar el peso de otro día sí es récord y paga 120', async () => {
  const { repos, usuarioId, banca } = await montar();

  const primera = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  await anotar(repos, usuarioId, primera.id, banca, { reps: 5, pesoKg: 80 });
  await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, primera.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(6, 19),
  );

  const segunda = await iniciarSesion(repos, usuarioId, {}, DIA(20));
  await anotar(repos, usuarioId, segunda.id, banca, { reps: 5, pesoKg: 85 });
  const r = await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, segunda.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(20, 19),
  );

  assert.equal(r?.desglose.records.length, 1);
  assert.equal(r?.desglose.records[0]?.mejora, 5);
  assert.equal(r?.desglose.porRecords, 120);
});

test('varias series por encima del récord anterior cuentan como un solo récord', async () => {
  const { repos, usuarioId, banca } = await montar();

  const primera = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  await anotar(repos, usuarioId, primera.id, banca, { reps: 5, pesoKg: 70 });
  await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, primera.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(6, 19),
  );

  const segunda = await iniciarSesion(repos, usuarioId, {}, DIA(20));
  await anotar(repos, usuarioId, segunda.id, banca, { reps: 5, pesoKg: 75 });
  await anotar(repos, usuarioId, segunda.id, banca, { reps: 5, pesoKg: 80 });
  await anotar(repos, usuarioId, segunda.id, banca, { reps: 5, pesoKg: 82.5 });

  const r = await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, segunda.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(20, 19),
  );

  assert.equal(r?.desglose.records.length, 1, 'tres series buenas son una buena sesión, no tres récords');
  assert.equal(r?.desglose.records[0]?.valor, 82.5, 'y se queda con la mejor');
});

test('el récord marca la serie que lo consiguió', async () => {
  const { repos, usuarioId, banca } = await montar();

  const primera = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  await anotar(repos, usuarioId, primera.id, banca, { reps: 5, pesoKg: 70 });
  await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, primera.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(6, 19),
  );

  const segunda = await iniciarSesion(repos, usuarioId, {}, DIA(20));
  await anotar(repos, usuarioId, segunda.id, banca, { reps: 5, pesoKg: 60 });
  await anotar(repos, usuarioId, segunda.id, banca, { reps: 5, pesoKg: 80 });

  const r = await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, segunda.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(20, 19),
  );

  const conPr = r?.sesion.series.filter((s) => s.esPr) ?? [];
  assert.equal(conPr.length, 1);
  assert.equal(conPr[0]?.pesoKg, 80);
});

test('el récord y el entreno quedan como eventos separados y explicables', async () => {
  const { repos, usuarioId, banca } = await montar();

  const primera = await iniciarSesion(repos, usuarioId, {}, DIA(6));
  await anotar(repos, usuarioId, primera.id, banca, { reps: 5, pesoKg: 70 });
  await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, primera.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(6, 19),
  );

  const segunda = await iniciarSesion(repos, usuarioId, {}, DIA(20));
  await anotar(repos, usuarioId, segunda.id, banca, { reps: 5, pesoKg: 80 });
  await terminarSesion(
    repos,
    usuarioId,
    (await repos.sesiones.obtener(usuarioId, segunda.id))!,
    { esfuerzoPercibido: null, nota: null },
    DIA(20, 19),
  );

  const eventos = await repos.xp.listar(usuarioId);
  assert.equal(eventos.filter((e) => e.tipo === 'entreno_completado').length, 2);
  assert.equal(eventos.filter((e) => e.tipo === 'record_personal').length, 1);
  assert.ok(eventos.every((e) => e.origenTabla === 'sesion'));
});
