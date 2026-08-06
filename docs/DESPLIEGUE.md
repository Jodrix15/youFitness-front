# Desplegar en Vercel

La configuración vive en `vercel.json`, así que no hay que tocar nada en el
panel: Vercel la lee del repositorio.

## Pasos

1. Entra en [vercel.com/new](https://vercel.com/new) e importa el repositorio de
   GitHub.
2. En **Framework Preset** deja `Other`. El resto de campos ya vienen de
   `vercel.json`:

   | Ajuste | Valor |
   |---|---|
   | Build Command | `npm run build:web` |
   | Output Directory | `dist` |
   | Install Command | `npm install` (el que trae por defecto) |

3. Pulsa **Deploy**. El primer despliegue tarda un par de minutos, casi todo
   instalando dependencias.

A partir de ahí, cada `git push` a la rama principal despliega solo.

## Qué hace `vercel.json`

**El rewrite.** La app es una SPA: `expo-router` resuelve las rutas en el
navegador, no en el servidor. Sin esa regla, entrar directamente en
`tudominio.vercel.app/peso` daría 404, porque en el disco no existe ningún
fichero `peso.html`. La regla manda todas las rutas a `index.html` y deja que
sea la app quien decida qué pintar.

No rompe los ficheros estáticos: Vercel busca primero en el disco y solo aplica
el rewrite si no encuentra nada.

**Las cabeceras de caché.** Todo lo que hay bajo `/_expo/static/` lleva un hash
en el nombre, así que se puede cachear un año sin riesgo: si el contenido
cambia, cambia el nombre del fichero.

## Instalarla en el móvil

Es una PWA: se instala desde el navegador, sin tienda.

- **Android** — Chrome ofrece solo un aviso de *Instalar aplicación* al entrar.
  Si no sale, está en el menú de tres puntos → *Instalar aplicación*.
- **iOS** — Safari (no Chrome), Compartir → *Añadir a pantalla de inicio*. Apple
  no muestra aviso automático; hay que hacerlo a mano.

En los dos casos se abre a pantalla completa, con su icono y sin barra del
navegador.

## Cómo se construye la PWA

| Fichero | Para qué |
|---|---|
| `public/manifest.webmanifest` | Nombre, iconos, `display: standalone` y accesos directos |
| `public/sw.js` | Service worker. Sin él Android no ofrece instalar |
| `public/icons/` | Iconos 192, 512, maskable y el de iOS |
| `scripts/pwa.mjs` | Inyecta las etiquetas en `index.html` tras exportar |

Todo lo que hay en `public/` se copia tal cual a `dist/`.

**Por qué un script y no `app/+html.tsx`.** Ese fichero solo lo lee Expo con
renderizado estático, y ahí el export falla al resolver `react-dom/server.node`.
Además obligaría a que toda la app se pudiera ejecutar en Node, cosa que no
aporta nada a una app que vive entera en el cliente. El script es idempotente y
falla ruidosamente si Expo cambia el formato de salida.

**El icono maskable.** Android recorta el icono a la forma que tenga el sistema
—círculo, cuadrado redondeado, gota—, así que ese lleva un 14 % de margen para
que no se coma la mancuerna.

**El service worker cachea al revés según el recurso.** Los ficheros de
`/_expo/static/` van primero por caché, porque llevan hash en el nombre y ese
contenido nunca cambia. Las navegaciones van primero por red, con la caché como
red de seguridad: al revés te quedarías con una versión vieja de la app hasta
vaciarla a mano, que es la forma clásica de que una PWA se quede congelada.

## Lo que hay que tener claro antes de compartirla

**Cada instalación es una isla.** No hay servidor, así que los datos viven en el
almacenamiento del navegador de cada dispositivo. La versión del móvil y la del
portátil no se ven entre ellas, ni siquiera siendo la misma persona.

**Los datos se pueden perder.** «Borrar datos de navegación» se lleva por
delante todo el historial. En iOS hay un riesgo añadido: si el sitio **no** está
añadido a la pantalla de inicio, Safari puede eliminar el almacenamiento tras
siete días sin visitarlo. Añadirla a la pantalla de inicio lo evita.

Por eso la exportación a fichero de la pantalla de Ajustes deja de ser una
comodidad y pasa a ser obligatoria. Está pendiente.

**No confundir con la app nativa.** Cuando llegue el momento de leer los pasos
de Salud o Health Connect, eso solo funciona en una build nativa con EAS. La
versión de Vercel nunca tendrá contador de pasos ni notificaciones fiables.

## Comprobar la build antes de subirla

```bash
npx expo export --platform web
npx serve dist
```

Si funciona ahí, funcionará en Vercel: es exactamente el mismo directorio.
