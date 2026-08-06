/**
 * DATOS DE EJEMPLO — ninguno de estos números es real.
 *
 * Existen para poder ver la pantalla de Inicio completa antes de que existan los
 * bloques de alimentación (3) y hábitos (4). Se pintan siempre con la marca
 * «ejemplo» a la vista y en opacidad reducida: la app no debe hacer pasar por
 * real algo que no ha medido.
 *
 * ESTE FICHERO SE BORRA cuando esos bloques estén construidos. Si sigue aquí y
 * los bloques ya existen, es un descuido, no una decisión.
 */

export type AnilloEjemplo = {
  clave: string;
  etiqueta: string;
  centro: string;
  centroSecundario?: string;
  valor: number;
  color: 'accent' | 'info' | 'success';
  bloque: string;
};

/**
 * El anillo de comidas ya NO está aquí: desde el Bloque 3 usa datos reales.
 * Quedan los dos que aún no tienen fuente.
 */
export const ANILLOS_EJEMPLO: readonly AnilloEjemplo[] = [
  {
    clave: 'pasos',
    etiqueta: 'pasos',
    centro: '5.410',
    centroSecundario: '/8.000',
    valor: 5410 / 8000,
    color: 'info',
    bloque: 'build nativa',
  },
  {
    clave: 'habitos',
    etiqueta: 'hábitos',
    centro: '5/8',
    valor: 5 / 8,
    color: 'success',
    bloque: 'Bloque 4',
  },
];

// La composición del día también salió de aquí con el Bloque 3: ahora se
// calcula con `componerDia` sobre las comidas registradas.
