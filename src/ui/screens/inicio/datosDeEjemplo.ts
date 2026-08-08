/**
 * DATO DE EJEMPLO — este número no es real.
 *
 * Solo queda el anillo de pasos. Los de comidas y hábitos ya usan datos reales
 * desde los bloques 3 y 4.
 *
 * Los pasos necesitan leer Salud o Health Connect, y eso exige una build nativa
 * con EAS: en la versión web no existe la fuente. Se pinta apagado y con la
 * etiqueta a la vista mientras tanto.
 *
 * ESTE FICHERO SE BORRA en cuanto exista la lectura real de pasos. Si sigue
 * aquí y ya la hay, es un descuido, no una decisión.
 */

export const PASOS_EJEMPLO = {
  clave: 'pasos',
  etiqueta: 'pasos',
  centro: '5.410',
  centroSecundario: '/8.000',
  valor: 5410 / 8000,
} as const;
