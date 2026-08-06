import type { Entidad, FechaISO, Uuid } from './comunes';

/**
 * Una comida. Especificación §4.
 *
 * NO HAY CALORÍAS NI MACROS EN GRAMOS (§10). Las etiquetas tienen un ±20 % de
 * tolerancia legal, las bases de datos colaborativas están sucias y el
 * autorregistro subestima entre un 20 y un 50 %. Sumar cifras inventadas no da
 * una cifra buena, y contar es la causa número uno de abandono.
 *
 * Lo que sí se registra es la FORMA del plato, en raciones medidas con la mano.
 * Tu mano escala con tu cuerpo, así que la medida se ajusta sola: no es exacta,
 * pero es consistente contigo, y eso es lo único que hace falta para ver
 * cambios.
 */
export type TipoComida = 'desayuno' | 'comida' | 'cena' | 'snack';

export type Comida = Entidad & {
  fecha: FechaISO;
  tipo: TipoComida;
  hora: string | null;
  descripcion: string;
  recetaId: Uuid | null;
  /** 0..3 raciones de cada grupo. */
  protPorciones: number;
  verdPorciones: number;
  hidrPorciones: number;
  grasPorciones: number;
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

export type GrupoAlimento = 'proteina' | 'verdura' | 'hidratos' | 'grasa';

export type DefinicionGrupo = {
  clave: GrupoAlimento;
  nombre: string;
  icono: string;
  medida: string;
  ejemplos: string;
  campo: 'protPorciones' | 'verdPorciones' | 'hidrPorciones' | 'grasPorciones';
};

export const GRUPOS: readonly DefinicionGrupo[] = [
  {
    clave: 'proteina',
    nombre: 'Proteína',
    icono: '✋',
    medida: '1 palma ≈ 1 ración',
    ejemplos: 'La palma sin dedos: pollo, pescado, huevos, legumbre',
    campo: 'protPorciones',
  },
  {
    clave: 'verdura',
    nombre: 'Verdura',
    icono: '✊',
    medida: '1 puño ≈ 1 ración',
    ejemplos: 'El puño cerrado: cualquier verdura o ensalada',
    campo: 'verdPorciones',
  },
  {
    clave: 'hidratos',
    nombre: 'Hidratos',
    icono: '🤲',
    medida: '1 mano ahuecada',
    ejemplos: 'La mano ahuecada: arroz, pasta, pan, patata',
    campo: 'hidrPorciones',
  },
  {
    clave: 'grasa',
    nombre: 'Grasa añadida',
    icono: '👍',
    medida: '1 pulgar ≈ 1 cda',
    ejemplos: 'El pulgar: aceite, mantequilla, frutos secos',
    campo: 'grasPorciones',
  },
] as const;

export const MAX_PORCIONES = 3;

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
  protPorciones: number;
  verdPorciones: number;
  hidrPorciones: number;
  grasPorciones: number;
  vecesUsada: number;
};

export type NuevaReceta = Omit<Receta, keyof Entidad | 'vecesUsada'> & {
  vecesUsada?: number;
};

export const ICONOS_RECETA = ['🍳', '🥗', '🍝', '🍲', '🐟', '🥚', '🍚', '🥙', '🍛', '🥘'] as const;
