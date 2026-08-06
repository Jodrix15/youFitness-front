/*
 * Service worker de YouFitness.
 *
 * Hace dos cosas:
 *
 *  1. Permite que Android ofrezca «Instalar aplicación». Chrome no muestra ese
 *     aviso si el sitio no tiene un service worker con manejador de `fetch`.
 *  2. Deja la app usable sin conexión, que en una app local-first es lo lógico:
 *     los datos ya están en el dispositivo, sería absurdo que la interfaz
 *     necesitara red para abrirse.
 *
 * ESTRATEGIA, y el motivo de cada elección:
 *
 *  - Ficheros de `/_expo/static/`: primero la caché. Llevan un hash en el
 *    nombre, así que un fichero con ese nombre nunca cambia de contenido.
 *  - Navegaciones: primero la red, con la caché como red de seguridad. Al revés
 *    te quedarías con una versión vieja de la app hasta vaciar la caché a mano,
 *    que es la forma clásica de que una PWA se quede congelada.
 */

const VERSION = 'youfitness-v1';
const ESENCIALES = ['/', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(VERSION)
      // `addAll` falla entero si un solo recurso falla; se toleran los fallos
      // para no dejar el service worker sin instalar por un icono.
      .then((cache) => Promise.allSettled(ESENCIALES.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  // Solo lecturas del propio dominio. Nada de interceptar terceros.
  if (peticion.method !== 'GET') return;
  if (new URL(peticion.url).origin !== self.location.origin) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put('/', copia));
          return respuesta;
        })
        .catch(() => caches.match('/').then((r) => r ?? Response.error())),
    );
    return;
  }

  evento.respondWith(
    caches.match(peticion).then((enCache) => {
      if (enCache) return enCache;
      return fetch(peticion).then((respuesta) => {
        if (respuesta.ok && respuesta.type === 'basic') {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      });
    }),
  );
});
