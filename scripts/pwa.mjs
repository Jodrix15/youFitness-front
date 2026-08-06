/**
 * Convierte el export web en una PWA instalable.
 *
 * POR QUÉ UN SCRIPT Y NO `app/+html.tsx`:
 * ese fichero solo lo lee Expo con renderizado estático (`web.output: "static"`),
 * y ahí el export falla al resolver `react-dom/server.node`. Además el prerender
 * obligaría a que toda la app se pueda ejecutar en Node, cosa que no aporta nada
 * a una app que vive entera en el cliente.
 *
 * Así que se mantiene `output: "single"` —una SPA, que es lo que esta app es— y
 * se inyectan las etiquetas después de exportar.
 *
 * Es idempotente: si las etiquetas ya están, no las duplica.
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const INDEX = join(DIST, 'index.html');
const MARCA = '<!-- pwa:youfitness -->';

const CABECERA = `${MARCA}
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#080b12" />
    <link rel="icon" href="/favicon.png" type="image/png" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="YouFitness" />
    <meta name="description" content="Registro personal de salud con gamificación. Peso, comida, entreno y hábitos, todo en una barra de XP." />
    <style>
      body { background-color: #080b12; }
      html, body, #root { overscroll-behavior: none; }
    </style>
    <script>
      // En localhost no se registra: durante el desarrollo una caché de por
      // medio hace que veas cambios que ya no existen.
      if ('serviceWorker' in navigator &&
          location.hostname !== 'localhost' &&
          location.hostname !== '127.0.0.1') {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function (e) {
            console.warn('No se pudo registrar el service worker:', e);
          });
        });
      }
    </script>`;

/**
 * `viewport-fit=cover` deja pintar bajo la barra de estado y el gesto de inicio;
 * los márgenes los pone `SafeAreaProvider`. Sin `user-scalable=no`, el doble
 * toque hace zoom al pulsar botones en una app a pantalla completa.
 */
const VIEWPORT =
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />';

async function main() {
  try {
    await access(INDEX);
  } catch {
    console.error(`✗ No existe ${INDEX}. ¿Se ha ejecutado antes "expo export --platform web"?`);
    process.exit(1);
  }

  let html = await readFile(INDEX, 'utf8');

  if (html.includes(MARCA)) {
    console.log('· El index.html ya tenía las etiquetas de PWA. Sin cambios.');
    return;
  }

  html = html.replace(/<meta name="viewport"[^>]*>/, VIEWPORT);
  html = html.replace('<html lang="en">', '<html lang="es">');

  if (!html.includes('</head>')) {
    console.error('✗ El index.html no tiene </head>. Expo ha cambiado el formato de salida.');
    process.exit(1);
  }

  html = html.replace('</head>', `    ${CABECERA}\n  </head>`);

  await writeFile(INDEX, html, 'utf8');
  console.log('✓ index.html preparado como PWA (manifiesto, iconos y service worker).');
}

await main();
