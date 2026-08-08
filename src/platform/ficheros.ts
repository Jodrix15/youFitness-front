import { Platform } from 'react-native';

/**
 * Puerto de ficheros: descargar una copia y leer una que el usuario elija.
 *
 * En web se resuelve con las APIs del navegador. En nativo haría falta
 * `expo-file-system` y `expo-document-picker`, que exigen build de desarrollo;
 * de momento se devuelve un error explícito en lugar de fingir que funciona.
 */

export type ResultadoDescarga = { ok: true } | { ok: false; motivo: string };

export async function descargarJson(nombre: string, contenido: string): Promise<ResultadoDescarga> {
  if (Platform.OS !== 'web') {
    return {
      ok: false,
      motivo:
        'Guardar el fichero en el móvil necesita la build nativa. Desde la app instalada en el navegador sí funciona.',
    };
  }

  try {
    const blob = new Blob([contenido], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // Sin esto el blob se queda en memoria hasta recargar la página.
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : 'No se pudo descargar' };
  }
}

export type ResultadoLectura =
  | { ok: true; contenido: string; nombre: string }
  | { ok: false; motivo: string };

/** Abre el selector de ficheros del sistema y devuelve el contenido en texto. */
export async function leerJson(): Promise<ResultadoLectura> {
  if (Platform.OS !== 'web') {
    return { ok: false, motivo: 'Restaurar desde fichero necesita la build nativa.' };
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = () => {
      const fichero = input.files?.[0];
      if (!fichero) {
        resolve({ ok: false, motivo: 'No se eligió ningún fichero.' });
        return;
      }

      const lector = new FileReader();
      lector.onload = () =>
        resolve({ ok: true, contenido: String(lector.result ?? ''), nombre: fichero.name });
      lector.onerror = () => resolve({ ok: false, motivo: 'No se pudo leer el fichero.' });
      lector.readAsText(fichero);
    };

    // Si el usuario cancela, `onchange` no se dispara nunca y la promesa
    // quedaría colgada. El foco vuelve a la ventana al cerrar el diálogo.
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!input.files?.length) resolve({ ok: false, motivo: 'Cancelado.' });
        }, 500);
      },
      { once: true },
    );

    input.click();
  });
}

export const soportaFicheros = Platform.OS === 'web';
