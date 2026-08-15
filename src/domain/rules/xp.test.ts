import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  aplicarMultiplicador,
  estadoNivel,
  fraccionDeNivel,
  multiplicadorRacha,
  NIVELES,
} from './xp';

test('sin XP se empieza en nivel 1, rango Iniciado', () => {
  const e = estadoNivel(0);
  assert.equal(e.nivel, 1);
  assert.equal(e.rango, 'Iniciado');
  assert.equal(e.xpSiguienteNivel, 300);
  assert.equal(e.xpParaSubir, 300);
  assert.equal(e.xpEnNivel, 0);
  assert.equal(e.progreso, 0);
});

test('el nivel sube al cruzar el umbral', () => {
  assert.equal(estadoNivel(299).nivel, 1);
  assert.equal(estadoNivel(300).nivel, 2);
  assert.equal(estadoNivel(1200).rango, 'Aprendiz');
});

test('el progreso es la fracción recorrida hacia el nivel siguiente', () => {
  const e = estadoNivel(750);
  assert.equal(e.nivel, 2);
  assert.equal(e.xpNivelActual, 300);
  assert.equal(e.xpSiguienteNivel, 1200);
  assert.equal(e.xpEnNivel, 450);
  assert.equal(e.xpParaSubir, 900);
  assert.equal(e.progreso, 0.5);
});

test('al subir de nivel el XP dentro del nivel vuelve a cero', () => {
  const antes = estadoNivel(1199);
  const despues = estadoNivel(1200);

  assert.equal(antes.nivel, 2);
  assert.equal(antes.xpEnNivel, 899, 'a un punto de llenar la barra');

  assert.equal(despues.nivel, 3);
  assert.equal(despues.xpEnNivel, 0, 'la barra se vacía');
  assert.equal(despues.progreso, 0);
  assert.equal(despues.xpTotal, 1200, 'el XP de por vida no se pierde: sigue acumulado');
});

test('cada nivel cuesta más que el anterior', () => {
  const costes = NIVELES.slice(1).map((n, i) => n.xpMinimo - NIVELES[i]!.xpMinimo);

  for (let i = 1; i < costes.length; i++) {
    assert.ok(
      costes[i]! > costes[i - 1]!,
      `el nivel ${i + 2} cuesta ${costes[i]} y el anterior ${costes[i - 1]}`,
    );
  }
});

test('el mismo esfuerzo mueve mucho menos la barra en niveles altos', () => {
  const doscientos = 200;
  const bajo = fraccionDeNivel(doscientos, estadoNivel(0));
  const alto = fraccionDeNivel(doscientos, estadoNivel(132800));

  assert.ok(bajo > 0.6, 'en el nivel 1, 200 XP llenan más de medio nivel');
  assert.ok(alto < 0.01, 'en el nivel 15, los mismos 200 XP apenas se notan');
});

test('el nivel puede bajar si el XP cae', () => {
  assert.equal(estadoNivel(3000).nivel, 4);
  assert.equal(estadoNivel(2999).nivel, 3);
});

test('en el nivel máximo no hay siguiente umbral', () => {
  const e = estadoNivel(999999);
  assert.equal(e.nivel, 16);
  assert.equal(e.rango, 'Leyenda');
  assert.equal(e.xpSiguienteNivel, null);
  assert.equal(e.xpParaSubir, null);
  assert.equal(e.progreso, 1);
  assert.equal(fraccionDeNivel(200, e), 0, 'sin nivel siguiente no hay fracción que llenar');
});

test('el multiplicador de racha sigue la tabla y topa en 1,5', () => {
  assert.equal(multiplicadorRacha(0), 1);
  assert.equal(multiplicadorRacha(3), 1.1);
  assert.equal(multiplicadorRacha(7), 1.2);
  assert.equal(multiplicadorRacha(14), 1.3);
  assert.equal(multiplicadorRacha(30), 1.5);
  assert.equal(multiplicadorRacha(400), 1.5);
});

test('el multiplicador nunca amplifica una resta', () => {
  assert.equal(aplicarMultiplicador(100, 30), 150);
  assert.equal(aplicarMultiplicador(-30, 30), -30);
});
