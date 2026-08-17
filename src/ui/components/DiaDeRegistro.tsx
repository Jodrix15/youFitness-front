import type { FechaISO } from '../../domain/models/comunes';
import { desdeFechaISO } from '../../domain/rules/fechas';
import { fechaLarga } from '../format';
import { Text } from './Text';

type Props = {
  fecha: FechaISO;
  hoy: FechaISO;
};

/**
 * En qué día se va a guardar esto. Una línea bajo el título, en TODA pantalla
 * de registro.
 *
 * Parece redundante cuando estás anotando la cena de esta noche, y no lo es: en
 * cuanto existe la posibilidad de moverse a otro día, un registro que aterriza
 * en la fecha equivocada es invisible. No falla nada, no salta ningún aviso —
 * simplemente el dato está en el sitio que no era, y te enteras semanas después
 * mirando el historial, cuando ya no recuerdas qué pasó.
 *
 * Es EXACTAMENTE la misma línea que la cabecera del diario de Comida: apagada
 * si es hoy, en color y con la flecha si no. Un aviso enmarcado a todo lo ancho
 * gritaría lo mismo ocupando media pantalla, y lo haría también los trescientos
 * días al año en que la fecha es la obvia.
 *
 * SOLO INFORMA. El día se elige una vez, en el calendario del diario, y de ahí
 * lo heredan las pantallas de registro. Repetir el selector en cada una daría
 * dos sitios donde cambiar lo mismo.
 */
export function DiaDeRegistro({ fecha, hoy }: Props) {
  const esHoy = fecha === hoy;
  const texto = fechaLarga(desdeFechaISO(fecha));

  return (
    <Text variant="small" tone={esHoy ? 'faint' : 'accent'}>
      {esHoy ? texto : `↩ ${texto}`}
    </Text>
  );
}
