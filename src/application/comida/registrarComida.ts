import type {
  Comida,
  NuevaComida,
  NuevoDeslizDetalle,
  TipoComida,
} from '../../domain/models/comida';
import type { Uuid } from '../../domain/models/comunes';
import { presupuestoDeLaSemana, superaPresupuesto } from '../../domain/rules/deslices';
import { penalizacion, recompensa } from '../../domain/rules/eventosXp';
import { horaLocal, hoy } from '../../domain/rules/fechas';
import { calcularRacha } from '../../domain/rules/racha';
import { XP } from '../../domain/rules/xp';
import type { Repositorios } from '../../data/repositories';

export type ResultadoComida = {
  comida: Comida;
  xpGanado: number;
  /** Negativo. Solo si se supera el presupuesto Y está el modo estricto. */
  xpPenalizado: number;
};

/**
 * CASO DE USO: registrar una comida.
 *
 * A diferencia del peso, aquí NO hay límite por día: se come varias veces. Cada
 * comida registrada paga sus 20 XP.
 */
export async function registrarComida(
  repos: Repositorios,
  usuarioId: Uuid,
  datos: Omit<NuevaComida, 'fecha' | 'hora' | 'esDesliz' | 'editadoEn'> & { fecha?: string },
  ahora: Date = new Date(),
): Promise<ResultadoComida> {
  const fecha = datos.fecha ?? hoy(ahora);
  const hora = horaLocal(ahora);

  const comida = await repos.comidas.crear(usuarioId, {
    ...datos,
    fecha,
    hora,
    esDesliz: false,
    editadoEn: null,
  });

  const fechasPrevias = await repos.xp.fechasConActividad(usuarioId);
  const racha = calcularRacha(fechasPrevias, fecha);

  const evento = await repos.xp.registrar(
    usuarioId,
    recompensa({
      tipo: 'comida_registrada',
      xpBase: XP.registrarComida,
      contexto: { fecha, hora, diasDeRacha: racha.actual },
      origenTabla: 'comida',
      origenId: comida.id,
    }),
  );

  if (comida.recetaId) {
    await repos.recetas.registrarUso(usuarioId, comida.recetaId);
  }

  return { comida, xpGanado: evento.xpFinal, xpPenalizado: 0 };
}

/**
 * CASO DE USO: registrar un desliz.
 *
 * REGLA INVIOLABLE (§5): registrarlo SIEMPRE da +15 XP y mantiene la racha.
 * Solo el tercero de la semana en adelante añade además −25, y únicamente con
 * modo estricto activado.
 *
 * Los dos eventos van separados a propósito. Si el castigo se descontara del
 * premio, confesar saldría a cuenta negativa y esconder el desliz pasaría a ser
 * la jugada óptima — que es exactamente lo que la app no puede permitirse.
 *
 * Un desliz NO es necesariamente un extra: el donut puede ser el desayuno y la
 * pizza, la cena. Por eso lleva su propio `tipo`, como cualquier otra comida.
 * Tratarlos todos como snack repartía mal el día —decía que faltaba la cena que
 * acabas de anotar— y borraba el patrón más útil que hay aquí: en qué comida se
 * te escapan las cosas.
 */
export async function registrarDesliz(
  repos: Repositorios,
  usuarioId: Uuid,
  datos: {
    descripcion: string;
    /** Desayuno, comida, cena o snack. Por defecto, extra. */
    tipo?: TipoComida;
    detalle: Omit<NuevoDeslizDetalle, 'comidaId'>;
    fecha?: string;
  },
  ahora: Date = new Date(),
): Promise<ResultadoComida> {
  const fecha = datos.fecha ?? hoy(ahora);
  const hora = horaLocal(ahora);

  const perfil = await repos.perfil.obtener();
  const previas = await repos.comidas.listar(usuarioId);
  const presupuesto = presupuestoDeLaSemana(
    previas,
    fecha,
    perfil?.presupuestoDeslicesSemana,
    perfil?.primerDiaSemana,
  );

  const comida = await repos.comidas.crear(usuarioId, {
    fecha,
    hora,
    tipo: datos.tipo ?? 'snack',
    descripcion: datos.descripcion,
    recetaId: null,
    saciedad: null,
    nota: datos.detalle.nota,
    esDesliz: true,
    editadoEn: null,
  });

  await repos.comidas.guardarDetalleDesliz(usuarioId, { ...datos.detalle, comidaId: comida.id });

  const fechasPrevias = await repos.xp.fechasConActividad(usuarioId);
  const racha = calcularRacha(fechasPrevias, fecha);

  const evento = await repos.xp.registrar(
    usuarioId,
    recompensa({
      tipo: 'desliz_registrado',
      xpBase: XP.registrarDesliz,
      contexto: { fecha, hora, diasDeRacha: racha.actual },
      origenTabla: 'comida',
      origenId: comida.id,
    }),
  );

  let xpPenalizado = 0;
  if (perfil?.modoEstricto && superaPresupuesto(presupuesto.usados, presupuesto.presupuesto)) {
    const castigo = await repos.xp.registrar(
      usuarioId,
      penalizacion({
        tipo: 'desliz_sobre_presupuesto',
        xpBase: 25,
        fecha,
        hora,
        origenTabla: 'comida',
        origenId: comida.id,
        nota: `Desliz ${presupuesto.usados + 1} de la semana, presupuesto ${presupuesto.presupuesto}`,
      }),
    );
    xpPenalizado = castigo.xpFinal;
  }

  return { comida, xpGanado: evento.xpFinal, xpPenalizado };
}
