import Constants from 'expo-constants';

import { leerConfigNube, type ConfigNube } from './config';

/**
 * La configuración real de esta instalación, leída de `app.json`.
 *
 * Vive separada de `config.ts` para que la validación se pueda probar con
 * `node --test`: en cuanto un fichero importa `expo-constants` arrastra medio
 * React Native detrás y deja de poder ejecutarse fuera de la app.
 */
export function configNube(): ConfigNube | null {
  return leerConfigNube(Constants.expoConfig?.extra);
}
