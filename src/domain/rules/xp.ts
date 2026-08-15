/**
 * Niveles, rangos y multiplicador de racha. Especificación §5.
 *
 * DECISIÓN CLAVE del modelo: el XP no es un contador guardado en el perfil, es
 * la suma de un log inmutable de eventos. Todo lo de este fichero es derivado.
 * Consecuencia práctica: si mañana cambias la economía de XP, recalculas el
 * pasado en vez de arrastrar una cifra incoherente.
 */

export type Rango =
  | 'Iniciado'
  | 'Aprendiz'
  | 'Constante'
  | 'Guerrero de Hierro'
  | 'Veterano'
  | 'Élite'
  | 'Leyenda';

export type DefinicionNivel = {
  nivel: number;
  /** XP acumulado a partir del cual se tiene este nivel. */
  xpMinimo: number;
  rango: Rango;
  icono: string;
};

/**
 * LA CURVA. Cada nivel cuesta bastante más que el anterior, como en Pokémon.
 *
 * Los saltos son 300, 900, 1.800, 2.800, 4.000, 5.400, 7.000, 8.800, 10.800,
 * 13.000, 15.400, 18.000, 20.800, 23.800 y 27.000. Nunca decrecen: antes sí lo
 * hacían —del 6 al 7 pedía 5.000 y del 7 al 8 solo 3.000—, y eso hacía que la
 * barra fuera más fácil justo cuando debía costar más.
 *
 * POR QUÉ IMPORTA que crezca así: con un coste plano, un mes flojo y un mes
 * bueno se parecen en la barra. Con coste creciente, mantener el mismo ritmo de
 * siempre hace que la barra avance cada vez menos, y eso es exactamente la
 * señal que se busca: el estancamiento se ve solo. Para seguir subiendo hay que
 * subir el listón —más peso, más series, más días cerrados—, no repetir.
 *
 * Los rangos agrupan varios niveles y no cambian: Leyenda sigue siendo el 16.
 */
export const NIVELES: readonly DefinicionNivel[] = [
  { nivel: 1, xpMinimo: 0, rango: 'Iniciado', icono: '🌱' },
  { nivel: 2, xpMinimo: 300, rango: 'Iniciado', icono: '🌱' },
  { nivel: 3, xpMinimo: 1200, rango: 'Aprendiz', icono: '🥉' },
  { nivel: 4, xpMinimo: 3000, rango: 'Aprendiz', icono: '🥉' },
  { nivel: 5, xpMinimo: 5800, rango: 'Constante', icono: '🥈' },
  { nivel: 6, xpMinimo: 9800, rango: 'Constante', icono: '🥈' },
  { nivel: 7, xpMinimo: 15200, rango: 'Guerrero de Hierro', icono: '🛡️' },
  { nivel: 8, xpMinimo: 22200, rango: 'Guerrero de Hierro', icono: '🛡️' },
  { nivel: 9, xpMinimo: 31000, rango: 'Veterano', icono: '⚔️' },
  { nivel: 10, xpMinimo: 41800, rango: 'Veterano', icono: '⚔️' },
  { nivel: 11, xpMinimo: 54800, rango: 'Veterano', icono: '⚔️' },
  { nivel: 12, xpMinimo: 70200, rango: 'Élite', icono: '🏅' },
  { nivel: 13, xpMinimo: 88200, rango: 'Élite', icono: '🏅' },
  { nivel: 14, xpMinimo: 109000, rango: 'Élite', icono: '🏅' },
  { nivel: 15, xpMinimo: 132800, rango: 'Élite', icono: '🏅' },
  { nivel: 16, xpMinimo: 159800, rango: 'Leyenda', icono: '👑' },
] as const;

export const NIVEL_MAXIMO = NIVELES[NIVELES.length - 1]!.nivel;

export type EstadoNivel = {
  nivel: number;
  rango: Rango;
  icono: string;
  /** XP de por vida. Es lo que se acumula de verdad. */
  xpTotal: number;
  /** Umbral en el que empezó este nivel. */
  xpNivelActual: number;
  /** Umbral del siguiente nivel. `null` en el máximo. */
  xpSiguienteNivel: number | null;
  /**
   * XP DENTRO DEL NIVEL ACTUAL. Vuelve a cero en cada subida: es el número que
   * pinta la barra, y el que hace que subir de nivel se note.
   */
  xpEnNivel: number;
  /** Lo que cuesta ENTERO este nivel. `null` en el máximo. */
  xpParaSubir: number | null;
  /** 0..1. Vale 1 cuando ya no hay nivel superior. */
  progreso: number;
  xpRestante: number | null;
};

/**
 * Resuelve nivel y rango a partir del XP acumulado.
 *
 * El nivel PUEDE BAJAR: si el XP cae por debajo del umbral, se pierde el nivel.
 * Es lo que hace que subir signifique algo (§5).
 */
export function estadoNivel(xpTotal: number): EstadoNivel {
  const xp = Math.max(0, Math.round(xpTotal));

  let actual: DefinicionNivel = NIVELES[0]!;
  for (const n of NIVELES) {
    if (xp >= n.xpMinimo) actual = n;
    else break;
  }

  const siguiente = NIVELES.find((n) => n.nivel === actual.nivel + 1) ?? null;
  const base = actual.xpMinimo;
  const techo = siguiente?.xpMinimo ?? null;

  const xpParaSubir = techo == null ? null : techo - base;
  const xpEnNivel = techo == null ? xp - base : Math.min(xp - base, xpParaSubir!);

  const progreso = xpParaSubir == null ? 1 : Math.max(0, Math.min(1, xpEnNivel / xpParaSubir));

  return {
    nivel: actual.nivel,
    rango: actual.rango,
    icono: actual.icono,
    xpTotal: xp,
    xpNivelActual: base,
    xpSiguienteNivel: techo,
    xpEnNivel,
    xpParaSubir,
    progreso,
    xpRestante: techo == null ? null : Math.max(0, techo - xp),
  };
}

/**
 * Qué fracción (0..1) del nivel actual vale una cantidad de XP.
 *
 * Es la lectura de «¿esto se ha notado?». Los mismos 200 XP llenan dos tercios
 * del nivel 2 y un céntimo del 16. Sirve para enseñar en Inicio cuánto ha movido
 * la barra el día de hoy, sin tener que hacer la división a ojo.
 */
export function fraccionDeNivel(xp: number, estado: EstadoNivel): number {
  if (estado.xpParaSubir == null || estado.xpParaSubir <= 0) return 0;
  return Math.max(0, xp) / estado.xpParaSubir;
}

export type ProximoRango = {
  rango: Rango;
  icono: string;
  nivel: number;
  xpRestante: number;
};

/**
 * Siguiente RANGO, que no es lo mismo que el siguiente nivel.
 *
 * Los rangos agrupan varios niveles: del 9 al 11 eres Veterano. Subir de nivel
 * pasa a menudo; cambiar de rango es el hito que de verdad se celebra, y por eso
 * la pantalla de Inicio cuenta cuánto falta para el próximo.
 */
export function proximoRango(xpTotal: number): ProximoRango | null {
  const xp = Math.max(0, Math.round(xpTotal));
  const actual = estadoNivel(xp);

  const siguiente = NIVELES.find((n) => n.xpMinimo > xp && n.rango !== actual.rango);
  if (!siguiente) return null;

  return {
    rango: siguiente.rango,
    icono: siguiente.icono,
    nivel: siguiente.nivel,
    xpRestante: siguiente.xpMinimo - xp,
  };
}

/** XP base de cada acción registrable. Especificación §5. */
export const XP = {
  registrarPeso: 25,
  registrarComida: 20,
  registrarDesliz: 15,
  /**
   * Los hábitos se retiraron de la app, pero su XP se queda documentado: una
   * copia de seguridad anterior a la retirada contiene eventos de este tipo, y
   * el total tiene que seguir sumándolos bien al restaurarla.
   */
  marcarMalHabito: 2,
  habitoBueno: 5,
  cerrarDia: 30,
  completarEntreno: 80,
  serieRegistrada: 2.5,
  recordPersonal: 120,
  subirEscalon: 200,
} as const;

/** Multiplicador por días seguidos con algún registro. Solo afecta a lo que suma. */
export function multiplicadorRacha(diasSeguidos: number): number {
  if (diasSeguidos >= 30) return 1.5;
  if (diasSeguidos >= 14) return 1.3;
  if (diasSeguidos >= 7) return 1.2;
  if (diasSeguidos >= 3) return 1.1;
  return 1;
}

/**
 * Aplica el multiplicador de racha.
 *
 * REGLA INVIOLABLE: el multiplicador nunca amplifica una resta. Un mal día no
 * se castiga más por venir de buena racha.
 */
export function aplicarMultiplicador(xpBase: number, diasSeguidos: number): number {
  if (xpBase <= 0) return Math.round(xpBase);
  return Math.round(xpBase * multiplicadorRacha(diasSeguidos));
}
