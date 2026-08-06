import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { almacenAsyncStorage, type Almacen } from '../platform/almacen';
import { idsDelDispositivo } from '../platform/id';
import { crearRepositoriosLocales } from './adapters/local/repositoriosLocales';
import type { Repositorios } from './repositories';

/**
 * Contenedor de dependencias.
 *
 * ÚNICO punto de la app donde se decide qué implementación de datos se usa.
 * Cambiar de almacenamiento local a una API es cambiar la línea marcada abajo.
 *
 * Los tests montan el árbol con un almacén en memoria y no tocan disco.
 */

const RepositoriosContext = createContext<Repositorios | null>(null);

export function RepositoriosProvider({
  children,
  almacen = almacenAsyncStorage,
  repositorios,
}: {
  children: ReactNode;
  almacen?: Almacen;
  /** Inyección directa, para tests. */
  repositorios?: Repositorios;
}) {
  const valor = useMemo(
    // ← La línea que cambiaría el día que exista backend.
    () => repositorios ?? crearRepositoriosLocales(almacen, idsDelDispositivo),
    [almacen, repositorios],
  );

  return <RepositoriosContext.Provider value={valor}>{children}</RepositoriosContext.Provider>;
}

export function useRepositorios(): Repositorios {
  const ctx = useContext(RepositoriosContext);
  if (!ctx) {
    throw new Error('useRepositorios debe usarse dentro de <RepositoriosProvider>');
  }
  return ctx;
}
