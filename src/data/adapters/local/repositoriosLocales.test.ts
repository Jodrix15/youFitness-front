import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

import { completarOnboarding } from '../../../application/onboarding/completarOnboarding';
import type { EstadoOnboarding } from '../../../application/onboarding/onboardingStore';
import { almacenEnMemoria } from '../../../platform/almacen';
import { crearRepositoriosLocales } from './repositoriosLocales';

const BORRADOR: EstadoOnboarding = {
  nombre: '  Jordi  ',
  pesoKg: 82.4,
  alturaCm: 178,
  edad: 34,
  sexo: 'hombre',
  cinturaCm: 88,
  modulos: ['grasa', 'fuerza', 'comer'],
  pesoObjetivoKg: 76,
  sesionesPorSemana: 4,
  permisoPasos: true,
  permisoNotificaciones: false,
};

function montar() {
  // El adaptador recibe la fuente de IDs, así que el test corre en Node sin
  // arrastrar `expo-crypto` ni ningún otro módulo nativo.
  return crearRepositoriosLocales(almacenEnMemoria(), { nuevoId: () => randomUUID() });
}

test('al arrancar por primera vez no hay perfil ni onboarding completado', async () => {
  const repos = montar();
  assert.equal(await repos.perfil.obtener(), null);
  assert.equal(await repos.ajustes.onboardingCompletado(), false);
});

test('completar el onboarding guarda perfil, módulos y objetivos', async () => {
  const repos = montar();
  const perfil = await completarOnboarding(repos, BORRADOR);

  assert.equal(perfil.nombre, 'Jordi');
  assert.equal(perfil.pesoInicialKg, 82.4);
  assert.equal(perfil.cinturaCm, 88);
  assert.equal(perfil.presupuestoDeslicesSemana, 2);
  assert.equal(perfil.modoEstricto, false);

  const guardado = await repos.perfil.obtener();
  assert.equal(guardado?.id, perfil.id);
  assert.equal(await repos.ajustes.onboardingCompletado(), true);

  const modulos = await repos.modulos.listar(perfil.usuarioId);
  assert.equal(modulos.length, 5, 'se materializan los cinco módulos');
  assert.equal(modulos.filter((m) => m.activo).length, 3);

  const objetivos = await repos.objetivos.listarActivos(perfil.usuarioId);
  assert.equal(objetivos.length, 3);
});

test('toda entidad nace con UUID, usuarioId y marcas de tiempo', async () => {
  const repos = montar();
  const perfil = await completarOnboarding(repos, BORRADOR);
  const objetivos = await repos.objetivos.listarActivos(perfil.usuarioId);

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const o of objetivos) {
    assert.match(o.id, uuid);
    assert.equal(o.usuarioId, perfil.usuarioId);
    assert.equal(o.borradoEn, null);
    assert.ok(o.creadoEn.endsWith('Z'), 'las marcas de tiempo van en UTC');
  }
});

test('el onboarding falla antes de escribir nada si faltan datos obligatorios', async () => {
  const repos = montar();
  await assert.rejects(() => completarOnboarding(repos, { ...BORRADOR, pesoKg: null }));
  assert.equal(await repos.perfil.obtener(), null);
  assert.equal(await repos.ajustes.onboardingCompletado(), false);
});

test('cambiar los módulos activos no duplica filas', async () => {
  const repos = montar();
  const perfil = await completarOnboarding(repos, BORRADOR);

  await repos.modulos.establecerActivos(perfil.usuarioId, ['grasa', 'mental']);
  const modulos = await repos.modulos.listar(perfil.usuarioId);

  assert.equal(modulos.length, 5);
  assert.deepEqual(
    modulos.filter((m) => m.activo).map((m) => m.clave).sort(),
    ['grasa', 'mental'],
  );
});

test('actualizar el perfil conserva el id y mueve actualizadoEn', async () => {
  const repos = montar();
  const perfil = await completarOnboarding(repos, BORRADOR);

  const nuevo = await repos.perfil.actualizar(perfil.id, { cinturaCm: 85 });
  assert.equal(nuevo.id, perfil.id);
  assert.equal(nuevo.cinturaCm, 85);
  assert.equal(nuevo.creadoEn, perfil.creadoEn);
  assert.ok(nuevo.actualizadoEn >= perfil.actualizadoEn);
});

test('repetir el onboarding conserva el usuarioId y no huerfaniza los datos', async () => {
  const repos = montar();
  const primero = await completarOnboarding(repos, BORRADOR);

  // Se registra algo asociado a ese usuario.
  await repos.peso.guardar(primero.usuarioId, { fecha: '2026-08-06', pesoKg: 82.4 });

  const segundo = await completarOnboarding(repos, { ...BORRADOR, nombre: 'Jordi B' });

  assert.equal(segundo.id, primero.id, 'es el mismo perfil, no uno nuevo');
  assert.equal(segundo.usuarioId, primero.usuarioId);
  assert.equal(segundo.nombre, 'Jordi B');

  const pesajes = await repos.peso.listar(segundo.usuarioId);
  assert.equal(pesajes.length, 1, 'los pesajes siguen siendo accesibles');
});

test('reiniciar deja la app como recién instalada', async () => {
  const repos = montar();
  const perfil = await completarOnboarding(repos, BORRADOR);

  await repos.ajustes.reiniciarTodo();

  assert.equal(await repos.perfil.obtener(), null);
  assert.equal(await repos.ajustes.onboardingCompletado(), false);
  assert.deepEqual(await repos.objetivos.listarActivos(perfil.usuarioId), []);
});
