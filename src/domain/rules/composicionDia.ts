/**
 * Qué comidas tiene cubiertas un día.
 *
 * Antes esto calculaba además la composición del plato en raciones —proteína,
 * verdura, hidratos y grasa— con sus barras y sus objetivos. Se retiró: la app
 * ya no pregunta de qué está hecho lo que comes. Lo que queda es la pregunta que
 * de verdad se responde de un vistazo: ¿me falta alguna comida por registrar?
 *
 * Nunca hubo «nota de calidad» ni puntuación, y sigue sin haberla: sería un
 * número inventado que moraliza sobre la comida.
 */

import { COMIDAS_PRINCIPALES, type Comida, type TipoComida } from '../models/comida';
import type { FechaISO } from '../models/comunes';

export type ComposicionDia = {
  fecha: FechaISO;
  comidas: Comida[];
  /**
   * Comidas principales cubiertas hoy, de 0 a 3. Los snacks no cuentan; un
   * desliz anotado como desayuno, comida o cena SÍ.
   */
  principalesRegistradas: number;
  /** Qué comidas principales faltan por registrar. */
  faltan: TipoComida[];
  /** Un día está completo con las tres principales registradas. */
  completo: boolean;
  deslices: number;
};

export function componerDia(comidas: readonly Comida[], fecha: FechaISO): ComposicionDia {
  const delDia = comidas.filter((c) => c.fecha === fecha && c.borradoEn == null);

  /**
   * UN DESLIZ TAMBIÉN OCUPA SU COMIDA.
   *
   * Si cenaste pizza y la anotaste como cena, la cena está registrada: seguir
   * diciendo «te falta la cena» sería la app ignorando lo que le acabas de
   * contar, y el castigo por haber sido honesto. Lo que el desliz no hace es
   * pintar el día de verde: el semáforo del historial lo marca en rojo igual.
   */
  const principales = delDia.filter((c) => COMIDAS_PRINCIPALES.includes(c.tipo));
  const tiposRegistrados = new Set(principales.map((c) => c.tipo));
  const faltan = COMIDAS_PRINCIPALES.filter((t) => !tiposRegistrados.has(t));

  return {
    fecha,
    comidas: delDia,
    // Los tipos cubiertos, no las filas: dos cenas siguen siendo una cena.
    principalesRegistradas: tiposRegistrados.size,
    faltan,
    completo: faltan.length === 0,
    deslices: delDia.filter((c) => c.esDesliz).length,
  };
}

/**
 * Racha de días COMPLETOS: los que tienen las tres comidas principales.
 *
 * Es distinta de la racha general de la app, que solo pide un registro
 * cualquiera. Aquí se mide constancia en el registro de comida.
 */
export function rachaDiasCompletos(comidas: readonly Comida[], fechaHoy: FechaISO): number {
  const completos = new Set<FechaISO>();
  const porFecha = new Map<FechaISO, Set<TipoComida>>();

  for (const c of comidas) {
    if (c.borradoEn != null) continue;
    // Igual que en `componerDia`: un desliz anotado como cena cubre la cena.
    if (!COMIDAS_PRINCIPALES.includes(c.tipo)) continue;
    const set = porFecha.get(c.fecha) ?? new Set<TipoComida>();
    set.add(c.tipo);
    porFecha.set(c.fecha, set);
  }

  for (const [fecha, tipos] of porFecha) {
    if (tipos.size === COMIDAS_PRINCIPALES.length) completos.add(fecha);
  }

  // Se cuenta hacia atrás desde hoy. Si hoy aún no está completo se empieza por
  // ayer: el día no ha terminado, y romper la racha a mediodía no tendría
  // sentido.
  let racha = 0;
  const cursor = new Date(fechaHoy);
  if (!completos.has(fechaHoy)) cursor.setDate(cursor.getDate() - 1);

  for (;;) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
      cursor.getDate(),
    ).padStart(2, '0')}`;
    if (!completos.has(iso)) break;
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
}
