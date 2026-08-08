import type { Semaforo } from '../../../domain/rules/temas';
import type { Theme } from '../../theme';

/**
 * Traducción del semáforo a colores.
 *
 * Vive en la capa de UI, no en el dominio: el dominio decide si un día tiene
 * deslices, y esta tabla decide de qué color se pinta eso. Cambiar la paleta no
 * puede tocar las reglas.
 *
 * Se usan versiones translúcidas para que el número del día siga leyéndose
 * encima. Un verde opaco haría ilegible el texto.
 */
export function colorSemaforo(semaforo: Semaforo): string | undefined {
  switch (semaforo) {
    case 'verde':
      return 'rgba(74,222,128,0.35)';
    case 'amarillo':
      return 'rgba(251,191,36,0.4)';
    case 'rojo':
      return 'rgba(244,80,110,0.4)';
    default:
      // Sin datos NO es verde: es neutro. Ver el comentario de `rules/temas.ts`.
      return undefined;
  }
}

/** Versión opaca, para leyendas y cuadritos pequeños del mapa de calor. */
export function colorSemaforoSolido(semaforo: Semaforo, t: Theme): string {
  switch (semaforo) {
    case 'verde':
      return t.colors.success;
    case 'amarillo':
      return t.colors.warning;
    case 'rojo':
      return t.colors.danger;
    case 'sin_datos':
      return t.colors.surfaceHigh;
  }
}
