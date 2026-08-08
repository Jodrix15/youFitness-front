import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

import { PERFIL_POR_DEFECTO } from '../domain/models/perfil';
import { almacenEnMemoria } from '../platform/almacen';
import { crearRepositoriosLocales } from './adapters/local/repositoriosLocales';
import { exportar, importar, nombreDeFichero, VERSION_COPIA } from './copia';

const IDS = { nuevoId: () => randomUUID() };

async function conDatos() {
  const almacen = almacenEnMemoria();
  const repos = crearRepositoriosLocales(almacen, IDS);

  const perfil = await repos.perfil.crear({
    nombre: 'Jordi',
    fechaNacimiento: null,
    edad: 34,
    alturaCm: 178,
    sexo: 'hombre',
    pesoInicialKg: 82.4,
    cinturaCm: 88,
    ...PERFIL_POR_DEFECTO,
  });

  await repos.peso.guardar(perfil.usuarioId, { fecha: '2026-08-06', pesoKg: 82.4 });
  await repos.peso.guardar(perfil.usuarioId, { fecha: '2026-08-05', pesoKg: 82.8 });
  await repos.ajustes.marcarOnboardingCompletado();

  return { almacen, repos, perfil };
}

test('la copia se identifica y lleva versión y fecha', async () => {
  const { almacen } = await conDatos();
  const copia = await exportar(almacen);

  assert.equal(copia.aplicacion, 'YouFitness');
  assert.equal(copia.version, VERSION_COPIA);
  assert.ok(copia.exportadoEn.endsWith('Z'));
});

test('exportar e importar devuelve exactamente los mismos datos', async () => {
  const original = await conDatos();
  const copia = await exportar(original.almacen);

  // Un dispositivo nuevo y vacío.
  const nuevo = almacenEnMemoria();
  const repos = crearRepositoriosLocales(nuevo, IDS);

  const resultado = await importar(nuevo, JSON.parse(JSON.stringify(copia)));
  assert.equal(resultado.ok, true);

  const perfil = await repos.perfil.obtener();
  assert.equal(perfil?.nombre, 'Jordi');
  assert.equal(perfil?.id, original.perfil.id, 'mismo id, no uno nuevo');

  const pesajes = await repos.peso.listar(perfil!.usuarioId);
  assert.equal(pesajes.length, 2);
  assert.equal(pesajes[1]?.pesoKg, 82.4);

  assert.equal(await repos.ajustes.onboardingCompletado(), true);
});

test('restaurar sustituye, no fusiona', async () => {
  const original = await conDatos();
  const copia = await exportar(original.almacen);

  // Otro dispositivo con datos distintos.
  const otro = almacenEnMemoria();
  const repos = crearRepositoriosLocales(otro, IDS);
  const perfilAjeno = await repos.perfil.crear({
    nombre: 'Otro',
    fechaNacimiento: null,
    edad: 50,
    alturaCm: 160,
    sexo: 'mujer',
    pesoInicialKg: 60,
    cinturaCm: null,
    ...PERFIL_POR_DEFECTO,
  });
  await repos.peso.guardar(perfilAjeno.usuarioId, { fecha: '2026-01-01', pesoKg: 60 });

  await importar(otro, JSON.parse(JSON.stringify(copia)));

  const perfil = await repos.perfil.obtener();
  assert.equal(perfil?.nombre, 'Jordi');

  const pesajes = await repos.peso.listar(perfil!.usuarioId);
  assert.equal(pesajes.length, 2, 'los pesajes del perfil anterior no se quedan mezclados');
});

test('un fichero que no es una copia de YouFitness se rechaza', async () => {
  const almacen = almacenEnMemoria();
  const r = await importar(almacen, { aplicacion: 'OtraApp', version: 1, datos: {} });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.motivo, /no es una copia/);
});

test('una copia de una versión futura se rechaza en lugar de romper los datos', async () => {
  const almacen = almacenEnMemoria();
  const r = await importar(almacen, {
    aplicacion: 'YouFitness',
    version: VERSION_COPIA + 1,
    datos: {},
  });
  assert.equal(r.ok, false);
});

test('un fichero corrupto no deja la app a medio restaurar', async () => {
  const { almacen, repos } = await conDatos();

  const r = await importar(almacen, 'esto no es un objeto');
  assert.equal(r.ok, false);

  const perfil = await repos.perfil.obtener();
  assert.equal(perfil?.nombre, 'Jordi', 'los datos originales siguen intactos');
});

test('el nombre del fichero lleva la fecha para no sobrescribir copias', () => {
  assert.equal(nombreDeFichero(new Date(2026, 7, 6)), 'youfitness-2026-08-06.json');
});
