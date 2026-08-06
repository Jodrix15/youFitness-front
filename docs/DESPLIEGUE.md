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
   | Build Command | `npx expo export --platform web` |
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

No es una app de tienda: es una web que se añade a la pantalla de inicio.

- **iOS** — abrir en Safari (no Chrome), Compartir → *Añadir a pantalla de
  inicio*.
- **Android** — abrir en Chrome, menú → *Instalar aplicación*.

Una vez añadida se abre a pantalla completa, sin barra del navegador.

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
