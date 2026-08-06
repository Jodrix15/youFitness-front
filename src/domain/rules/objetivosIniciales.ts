/**
 * Generación de los objetivos con los que arranca la app (pantalla 04).
 *
 * Dos preguntas — peso deseado y entrenos por semana — y la app crea sola tres
 * objetivos. El usuario entra a Inicio con la barra de XP ya en movimiento en
 * lugar de con una pantalla vacía.
 *
 * Función pura: recibe datos, devuelve objetivos. No toca la base de datos.
 */

import type { NuevoObjetivo } from '../models/objetivo';
import type { ClaveModulo } from '../models/modulo';
import { redondear } from './composicion';

export type EntradaObjetivosIniciales = {
  pesoActualKg: number;
  pesoObjetivoKg: number;
  sesionesPorSemana: number;
  modulosActivos: readonly ClaveModulo[];
};

/** XP de los objetivos de hito: de 300 a 750 según §5. */
const XP_HITO_PESO = 500;
const XP_SESIONES_SEMANA = 60;
const XP_PESARSE_CADA_DIA = 25;

export function generarObjetivosIniciales(
  entrada: EntradaObjetivosIniciales,
): NuevoObjetivo[] {
  const { pesoActualKg, pesoObjetivoKg, sesionesPorSemana, modulosActivos } = entrada;
  const objetivos: NuevoObjetivo[] = [];

  const quiereGrasa = modulosActivos.includes('grasa');
  const quiereFuerza = modulosActivos.includes('fuerza');

  if (quiereGrasa && Math.abs(pesoActualKg - pesoObjetivoKg) >= 0.1) {
    const bajando = pesoObjetivoKg < pesoActualKg;
    objetivos.push({
      nombre: `Llegar a ${formatearKg(pesoObjetivoKg)} kg`,
      metrica: 'peso_kg',
      operador: bajando ? 'lte' : 'gte',
      valor: redondear(pesoObjetivoKg, 1),
      unidad: 'kg',
      periodo: 'hito',
      xp: XP_HITO_PESO,
      recordatorio: false,
      mostrarInicio: true,
      activo: true,
    });
  }

  if (quiereFuerza && sesionesPorSemana > 0) {
    objetivos.push({
      nombre: `${sesionesPorSemana} entrenos por semana`,
      metrica: 'sesiones',
      operador: 'gte',
      valor: sesionesPorSemana,
      unidad: 'sesiones',
      periodo: 'semana',
      xp: XP_SESIONES_SEMANA,
      recordatorio: true,
      mostrarInicio: true,
      activo: true,
    });
  }

  // El hábito que sostiene todo lo demás. Se crea siempre: sin pesajes no hay
  // media de 7 días, y sin media de 7 días no hay tendencia que enseñar.
  objetivos.push({
    nombre: 'Pesarme cada día',
    metrica: 'pesajes',
    operador: 'gte',
    valor: 1,
    unidad: 'pesaje',
    periodo: 'dia',
    xp: XP_PESARSE_CADA_DIA,
    recordatorio: true,
    mostrarInicio: true,
    activo: true,
  });

  return objetivos;
}

function formatearKg(kg: number): string {
  return redondear(kg, 1).toString().replace('.', ',');
}
