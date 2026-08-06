import type { InstanteISO, Uuid } from '../domain/models/comunes';

/**
 * Puerto de generación de identificadores.
 *
 * El adaptador de datos NO importa `expo-crypto` directamente: recibe esta
 * fuente por parámetro. Dos motivos:
 *
 *  1. Coherencia con el resto de la arquitectura. `expo-crypto` es un detalle
 *     del dispositivo, y los detalles del dispositivo se inyectan.
 *  2. Sin esto, los tests del adaptador no pueden ejecutarse fuera de la app:
 *     `expo-crypto` arrastra módulos nativos que Node no sabe cargar.
 */
export type FuenteDeIds = {
  nuevoId(): Uuid;
};

/**
 * Instante actual en UTC. Todas las marcas de tiempo de la app pasan por aquí.
 *
 * Vive fuera de `id.ts` a propósito: solo usa `Date`, así que funciona en
 * cualquier entorno y no obliga a arrastrar dependencias nativas.
 */
export function ahora(): InstanteISO {
  return new Date().toISOString();
}
