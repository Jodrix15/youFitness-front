import type { Entidad, FechaISO, Uuid } from './comunes';

/**
 * Una comida. Especificación §4.
 *
 * NO HAY CALORÍAS NI MACROS EN GRAMOS (§10). Las etiquetas tienen un ±20 % de
 * tolerancia legal, las bases de datos colaborativas están sucias y el
 * autorregistro subestima entre un 20 y un 50 %. Sumar cifras inventadas no da
 * una cifra buena, y contar es la causa número uno de abandono.
 *
 * TAMPOCO SE REGISTRA YA LA COMPOSICIÓN DEL PLATO (proteína, verdura, hidratos
 * y grasa en raciones): retirada por decisión de producto. Lo que queda es qué
 * comiste, cuándo, y cómo te dejó — que es con lo que de verdad se hace algo.
 */
export type TipoComida = 'desayuno' | 'comida' | 'cena' | 'snack';

export type Comida = Entidad & {
  fecha: FechaISO;
  tipo: TipoComida;
  hora: string | null;
  descripcion: string;
  recetaId: Uuid | null;
  /**
   * Raciones por grupo, de la época en que se registraba la forma del plato.
   *
   * Se quedan como opcionales por el mismo motivo que los eventos `habito_*`
   * siguen en el modelo de XP: las comidas ya registradas los tienen dentro, y
   * una copia de seguridad anterior también. Quitarlos del tipo no borraría esos
   * números —seguirían en el almacén—, solo haría que dejaran de poder leerse el
   * día que se quiera volver atrás. Nada nuevo los escribe.
   */
  protPorciones?: number;
  verdPorciones?: number;
  hidrPorciones?: number;
  grasPorciones?: number;
  /** 1..5, de «con hambre» a «demasiado». */
  saciedad: number | null;
  nota: string | null;
  /**
   * Un desliz NO es una tabla paralela: es una comida con esta marca más una
   * fila de detalle. Así aparece en el mismo timeline, cuenta en las mismas
   * consultas, y no hay que unir dos historiales distintos.
   */
  esDesliz: boolean;
  editadoEn: string | null;
};

export type NuevaComida = Omit<Comida, keyof Entidad>;

export const TIPOS_COMIDA: readonly { valor: TipoComida; etiqueta: string; icono: string }[] = [
  { valor: 'desayuno', etiqueta: 'Desayuno', icono: '🌅' },
  { valor: 'comida', etiqueta: 'Comida', icono: '🍽️' },
  { valor: 'cena', etiqueta: 'Cena', icono: '🌙' },
  { valor: 'snack', etiqueta: 'Snack', icono: '🥨' },
];

/** Las tres comidas que cuentan para «día completo». El snack es extra. */
export const COMIDAS_PRINCIPALES: readonly TipoComida[] = ['desayuno', 'comida', 'cena'];

export const CARAS_SACIEDAD = ['😖', '🙁', '🙂', '😌', '🥴'] as const;

// ────────────────────────────────────────────────────────────────────────────
// Desliz
// ────────────────────────────────────────────────────────────────────────────

export type CategoriaDesliz = 'dulce' | 'bolleria' | 'ultraprocesado' | 'alcohol' | 'refresco';
export type CantidadDesliz = 'bocado' | 'racion' | 'mas_de_una';
export type Disparador =
  | 'estres'
  | 'aburrimiento'
  | 'poco_sueno'
  | 'hambre_real'
  | 'evento_social'
  | 'bajon'
  | 'estaba_a_mano';

/** Detalle 1:1 con la comida marcada como desliz. */
export type DeslizDetalle = Entidad & {
  comidaId: Uuid;
  categoria: CategoriaDesliz;
  cantidad: CantidadDesliz;
  sustituyoComida: boolean;
  disparador: Disparador | null;
  /** 1..5, cómo se siente después. */
  emocionDespues: number | null;
  lugar: string | null;
  nota: string | null;
};

export type NuevoDeslizDetalle = Omit<DeslizDetalle, keyof Entidad>;

export const CATEGORIAS_DESLIZ: readonly { valor: CategoriaDesliz; etiqueta: string }[] = [
  { valor: 'dulce', etiqueta: '🍫 Dulce' },
  { valor: 'bolleria', etiqueta: '🍩 Bollería' },
  { valor: 'ultraprocesado', etiqueta: '🍟 Ultraprocesado' },
  { valor: 'alcohol', etiqueta: '🍺 Alcohol' },
  { valor: 'refresco', etiqueta: '🥤 Refresco' },
];

export const CANTIDADES_DESLIZ: readonly { valor: CantidadDesliz; etiqueta: string }[] = [
  { valor: 'bocado', etiqueta: 'Un bocado' },
  { valor: 'racion', etiqueta: 'Una ración' },
  { valor: 'mas_de_una', etiqueta: 'Más de una' },
];

export const DISPARADORES: readonly { valor: Disparador; etiqueta: string }[] = [
  { valor: 'estres', etiqueta: '😰 Estrés' },
  { valor: 'aburrimiento', etiqueta: '🥱 Aburrimiento' },
  { valor: 'poco_sueno', etiqueta: '😴 Poco sueño' },
  { valor: 'hambre_real', etiqueta: '🍽️ Hambre real' },
  { valor: 'evento_social', etiqueta: '🎉 Evento social' },
  { valor: 'bajon', etiqueta: '😔 Bajón' },
  { valor: 'estaba_a_mano', etiqueta: '🏠 Estaba a mano' },
];

export const CARAS_EMOCION = ['😞', '😕', '😐', '🙂', '😄'] as const;

// ────────────────────────────────────────────────────────────────────────────
// Recetas
// ────────────────────────────────────────────────────────────────────────────

/**
 * Una receta es una combinación con nombre que se registra de un toque.
 *
 * Los ingredientes son TEXTO LIBRE, sin macros ni cantidades estructuradas. No
 * hay tabla de alimentos ni catálogo externo (§10): serían gigas en local o una
 * API con red, y con quince recetas propias se cubre casi todo lo que se come.
 *
 * Tampoco hay pasos, fotos ni temporizadores: eso es un recetario, que es otra
 * app. Un campo de notas cubre casi todo el valor.
 */
export type Receta = Entidad & {
  nombre: string;
  icono: string;
  raciones: number;
  ingredientes: string;
  notas: string | null;
  /** Igual que en `Comida`: histórico, ya no se escribe. */
  protPorciones?: number;
  verdPorciones?: number;
  hidrPorciones?: number;
  grasPorciones?: number;
  vecesUsada: number;
};

export type NuevaReceta = Omit<Receta, keyof Entidad | 'vecesUsada'> & {
  vecesUsada?: number;
};

export const ICONOS_RECETA = ['🍳', '🥗', '🍝', '🍲', '🐟', '🥚', '🍚', '🥙', '🍛', '🥘'] as const;
