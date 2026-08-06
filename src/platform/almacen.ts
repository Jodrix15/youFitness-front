/**
 * Puerto de almacenamiento clave-valor.
 *
 * Es deliberadamente mínimo. Los repositorios se construyen encima de esto, así
 * que sustituir el motor (AsyncStorage hoy, SQLite cuando lleguen los datos de
 * historial) es implementar cuatro métodos.
 *
 * AsyncStorage funciona igual en iOS, Android y web, que es lo que permite tener
 * las tres plataformas desde el día uno sin ramificar la lógica.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Almacen {
  leer<T>(clave: string): Promise<T | null>;
  escribir<T>(clave: string, valor: T): Promise<void>;
  borrar(clave: string): Promise<void>;
  clavesCon(prefijo: string): Promise<string[]>;
}

export const PREFIJO = 'youfitness:';

export const almacenAsyncStorage: Almacen = {
  async leer<T>(clave: string): Promise<T | null> {
    const crudo = await AsyncStorage.getItem(PREFIJO + clave);
    if (crudo == null) return null;
    try {
      return JSON.parse(crudo) as T;
    } catch {
      // Dato corrupto. Se devuelve null en lugar de reventar la app: el usuario
      // puede seguir usándola y restaurar desde su copia si hace falta.
      return null;
    }
  },

  async escribir<T>(clave: string, valor: T): Promise<void> {
    await AsyncStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  },

  async borrar(clave: string): Promise<void> {
    await AsyncStorage.removeItem(PREFIJO + clave);
  },

  async clavesCon(prefijo: string): Promise<string[]> {
    const todas = await AsyncStorage.getAllKeys();
    const completo = PREFIJO + prefijo;
    return todas.filter((k) => k.startsWith(completo)).map((k) => k.slice(PREFIJO.length));
  },
};

/** Implementación en memoria. Sirve para tests y para el modo demo. */
export function almacenEnMemoria(inicial: Record<string, unknown> = {}): Almacen {
  const mapa = new Map<string, string>(
    Object.entries(inicial).map(([k, v]) => [k, JSON.stringify(v)]),
  );
  return {
    async leer<T>(clave: string) {
      const crudo = mapa.get(clave);
      return crudo == null ? null : (JSON.parse(crudo) as T);
    },
    async escribir<T>(clave: string, valor: T) {
      mapa.set(clave, JSON.stringify(valor));
    },
    async borrar(clave: string) {
      mapa.delete(clave);
    },
    async clavesCon(prefijo: string) {
      return [...mapa.keys()].filter((k) => k.startsWith(prefijo));
    },
  };
}
