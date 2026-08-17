import { useNube } from './useNube';

/**
 * Componente sin interfaz. Se monta en la raíz y solo existe para que la copia
 * automática arranque una vez por sesión de app, esté donde esté el usuario.
 *
 * Podría ser una llamada suelta al hook dentro del layout, pero entonces la raíz
 * dejaría de ser «solo proveedores» y habría que leerse el fichero entero para
 * descubrir que hay una subida de fondo. Así se ve en la lista de hijos.
 */
export function CopiaNubeAutomatica() {
  useNube({ automatico: true });
  return null;
}
