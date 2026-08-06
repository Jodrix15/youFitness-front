import * as Crypto from 'expo-crypto';

import type { Uuid } from '../domain/models/comunes';
import type { FuenteDeIds } from './reloj';

/**
 * Implementación de `FuenteDeIds` para el dispositivo.
 *
 * UUID v4 criptográfico. Especificación §4: nunca claves autoincrementales.
 * `expo-crypto` usa la fuente de aleatoriedad del sistema en las tres
 * plataformas, así que dos dispositivos no colisionarán el día que haya
 * sincronización.
 *
 * Este fichero solo lo importa el contenedor de dependencias. Nadie más.
 */
export const idsDelDispositivo: FuenteDeIds = {
  nuevoId(): Uuid {
    return Crypto.randomUUID();
  },
};
