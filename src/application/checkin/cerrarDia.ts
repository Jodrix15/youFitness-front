import type { Checkin, NuevoCheckin } from '../../domain/models/checkin';
import type { Uuid } from '../../domain/models/comunes';
import { penalizacion, recompensa } from '../../domain/rules/eventosXp';
import { horaLocal } from '../../domain/rules/fechas';
import { calcularRacha } from '../../domain/rules/racha';
import { esTrasnoche } from '../../domain/rules/sueno';
import { XP } from '../../domain/rules/xp';
import type { Repositorios } from '../../data/repositories';

export type ResultadoCerrarDia = {
  registro: Checkin;
  xpGanado: number;
  /** Negativo. Solo se aplica con modo estricto activado. */
  xpPenalizado: number;
  eraNuevo: boolean;
};

/**
 * CASO DE USO: cerrar el día.
 *
 * REGLA INVIOLABLE (§5): registrar nunca resta. Cerrar el día siempre suma 30.
 * Si además te acostaste pasadas las 2:00 y tienes el modo estricto activado, se
 * escribe un evento APARTE de −15.
 *
 * Son dos eventos y no uno neto a propósito: así el desglose puede decirte «te
 * dieron 30 por cerrar el día y te quitaron 15 por trasnochar», en vez de un
 * +15 que no explica nada. Y si algún día quitas el modo estricto, recalcular
 * es descartar los eventos de penalización.
 */
export async function cerrarDia(
  repos: Repositorios,
  usuarioId: Uuid,
  datos: NuevoCheckin,
  ahora: Date = new Date(),
): Promise<ResultadoCerrarDia> {
  const { registro, eraNuevo } = await repos.checkins.guardar(usuarioId, datos);

  if (!eraNuevo) {
    return { registro, xpGanado: 0, xpPenalizado: 0, eraNuevo };
  }

  const hora = horaLocal(ahora);
  const fechasPrevias = await repos.xp.fechasConActividad(usuarioId);
  const racha = calcularRacha(fechasPrevias, datos.fecha);

  const evento = await repos.xp.registrar(
    usuarioId,
    recompensa({
      tipo: 'dia_cerrado',
      xpBase: XP.cerrarDia,
      contexto: { fecha: datos.fecha, hora, diasDeRacha: racha.actual },
      origenTabla: 'checkin',
      origenId: registro.id,
    }),
  );

  let xpPenalizado = 0;
  const perfil = await repos.perfil.obtener();

  if (perfil?.modoEstricto && datos.horaAcostarse && esTrasnoche(datos.horaAcostarse)) {
    const castigo = await repos.xp.registrar(
      usuarioId,
      penalizacion({
        tipo: 'ajuste_manual',
        xpBase: 15,
        fecha: datos.fecha,
        hora,
        origenTabla: 'checkin',
        origenId: registro.id,
        nota: 'Acostarse después de las 2:00',
      }),
    );
    xpPenalizado = castigo.xpFinal;
  }

  return { registro, xpGanado: evento.xpFinal, xpPenalizado, eraNuevo };
}
