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
  xpMinimo: number;
  rango: Rango;
  icono: string;
};

export const NIVELES: readonly DefinicionNivel[] = [
  { nivel: 1, xpMinimo: 0, rango: 'Iniciado', icono: '🌱' },
  { nivel: 2, xpMinimo: 300, rango: 'Iniciado', icono: '🌱' },
  { nivel: 3, xpMinimo: 800, rango: 'Aprendiz', icono: '🥉' },
  { nivel: 4, xpMinimo: 1500, rango: 'Aprendiz', icono: '🥉' },
  { nivel: 5, xpMinimo: 2800, rango: 'Constante', icono: '🥈' },
  { nivel: 6, xpMinimo: 5000, rango: 'Constante', icono: '🥈' },
  { nivel: 7, xpMinimo: 10000, rango: 'Guerrero de Hierro', icono: '🛡️' },
  { nivel: 8, xpMinimo: 13000, rango: 'Guerrero de Hierro', icono: '🛡️' },
  { nivel: 9, xpMinimo: 18000, rango: 'Veterano', icono: '⚔️' },
  { nivel: 10, xpMinimo: 23000, rango: 'Veterano', icono: '⚔️' },
  { nivel: 11, xpMinimo: 27000, rango: 'Veterano', icono: '⚔️' },
  { nivel: 12, xpMinimo: 32000, rango: 'Élite', icono: '🏅' },
  { nivel: 13, xpMinimo: 39000, rango: 'Élite', icono: '🏅' },
  { nivel: 14, xpMinimo: 46000, rango: 'Élite', icono: '🏅' },
  { nivel: 15, xpMinimo: 53000, rango: 'Élite', icono: '🏅' },
  { nivel: 16, xpMinimo: 60000, rango: 'Leyenda', icono: '👑' },
] as const;

export type EstadoNivel = {
  nivel: number;
  rango: Rango;
  icono: string;
  xpTotal: number;
  xpNivelActual: number;
  xpSiguienteNivel: number | null;
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

  const progreso =
    techo == null ? 1 : Math.max(0, Math.min(1, (xp - base) / Math.max(1, techo - base)));

  return {
    nivel: actual.nivel,
    rango: actual.rango,
    icono: actual.icono,
    xpTotal: xp,
    xpNivelActual: base,
    xpSiguienteNivel: techo,
    progreso,
    xpRestante: techo == null ? null : Math.max(0, techo - xp),
  };
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
