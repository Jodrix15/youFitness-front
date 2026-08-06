import type { FechaISO, Uuid } from '../../domain/models/comunes';
import type { PesoRegistro } from '../../domain/models/peso';
import { eventoPesoRegistrado } from '../../domain/rules/eventosXp';
import { horaLocal, hoy } from '../../domain/rules/fechas';
import { calcularRacha } from '../../domain/rules/racha';
import type { Repositorios } from '../../data/repositories';

export type ResultadoRegistroPeso = {
  registro: PesoRegistro;
  /** XP concedido. Cero si el pesaje del día ya estaba registrado. */
  xpGanado: number;
  eraNuevo: boolean;
};

/**
 * CASO DE USO: registrar el peso del día.
 *
 * Dos reglas que conviene tener claras:
 *
 *  1. **Un pesaje por día.** Corregir el peso de hoy sustituye el anterior.
 *  2. **El XP se concede una sola vez por día.** Si no, corregir el peso tres
 *     veces daría 75 XP, y la economía dejaría de significar nada.
 *
 * El evento de XP se escribe DESPUÉS del pesaje: si algo fallara por el camino,
 * prefiero un pesaje sin puntos a unos puntos sin pesaje.
 */
export async function registrarPeso(
  repos: Repositorios,
  usuarioId: Uuid,
  datos: { pesoKg: number; fecha?: FechaISO; nota?: string | null },
  ahora: Date = new Date(),
): Promise<ResultadoRegistroPeso> {
  const fecha = datos.fecha ?? hoy(ahora);

  const { registro, eraNuevo } = await repos.peso.guardar(usuarioId, {
    fecha,
    pesoKg: datos.pesoKg,
    hora: horaLocal(ahora),
    nota: datos.nota ?? null,
  });

  if (!eraNuevo) {
    return { registro, xpGanado: 0, eraNuevo };
  }

  // La racha se calcula ANTES de escribir el evento de hoy: el multiplicador
  // premia los días anteriores, no el que se está registrando ahora mismo.
  const fechasPrevias = await repos.xp.fechasConActividad(usuarioId);
  const racha = calcularRacha(fechasPrevias, fecha);

  const evento = await repos.xp.registrar(
    usuarioId,
    eventoPesoRegistrado({ pesajeId: registro.id, contexto: { fecha, hora: horaLocal(ahora), diasDeRacha: racha.actual } }),
  );

  return { registro, xpGanado: evento.xpFinal, eraNuevo };
}
