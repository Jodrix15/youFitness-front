# Copia automática en la nube — puesta en marcha

Diez minutos, una sola vez. Mientras no lo hagas, la app funciona exactamente
igual que siempre y la sección de nube sale apagada con el motivo a la vista.

**Qué es esto y qué no es.** Sube a Supabase el mismo JSON que ya genera el botón
de *Exportar*, cada 12 horas, solo. Es un **respaldo**, no sincronización: el
móvil y el navegador siguen siendo instalaciones independientes. Para Supabase el
fichero es opaco —no hay tablas ni consultas—, y por eso esto no puede corromper
nada: subir es sustituir un fichero, y no existen conflictos que resolver.

---

## 1 · Crear el proyecto

En [supabase.com](https://supabase.com), cuenta gratuita y **New project**. La
región más cercana. Anota la contraseña de la base de datos aunque no la vayas a
usar aquí.

## 2 · Copiar las dos claves

**Project Settings → API**:

| Qué copiar | Dónde va |
|---|---|
| *Project URL* (`https://xxxx.supabase.co`) | `url` |
| *anon* / *public* | `anonKey` |

Y se pegan en `app.json`:

```json
"extra": {
  "supabase": {
    "url": "https://xxxx.supabase.co",
    "anonKey": "eyJhbGciOi...",
    "bucket": "copias"
  }
}
```

La clave `anon` **está diseñada para viajar dentro del cliente** y puede estar en
el repositorio: por sí sola no da acceso a nada. Quien decide qué puede leer cada
usuario son las políticas del paso 4. La que NO debe salir nunca de Supabase es
la `service_role`, que aquí no se usa para nada.

## 3 · Crear el bucket

**Storage → New bucket**, nombre `copias`, y **Private** (desmarcado «Public
bucket»). Si lo dejas público, cualquiera con la URL se descarga tu historial.

## 4 · Cerrar la puerta con RLS

**SQL Editor → New query**, pegar y ejecutar. Sin esto, cualquier usuario
registrado podría leer las carpetas de los demás:

```sql
create policy "copias: leer lo propio"
on storage.objects for select to authenticated
using (
  bucket_id = 'copias'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "copias: crear lo propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'copias'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "copias: sustituir lo propio"
on storage.objects for update to authenticated
using (
  bucket_id = 'copias'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

La app escribe en `{tu_id_de_usuario}/ultima.json`, así que la carpeta no es una
convención de nombres: es la frontera de seguridad que comprueban las políticas.

## 5 · Quitar la confirmación por correo

**Authentication → Sign In / Providers → Email**, y desactivar **Confirm email**.

No es pereza: el servicio de correo que Supabase da en el plan gratuito está
limitado a unos pocos envíos por hora y no está pensado para producción. Con la
confirmación activada, crear la cuenta se queda a medias esperando un correo que
puede no llegar. Para una app de un solo usuario, correo y contraseña bastan.

## 6 · Entrar, una vez

En la app: **Ajustes → Copia en la nube → Crear cuenta**. A partir de ahí no hay
nada más que hacer nunca.

---

## Lo que conviene saber

**Los proyectos gratuitos se pausan tras una semana sin actividad** y hay que
despertarlos a mano desde el panel de Supabase. Usando la app a diario no pasa
nunca; volviendo de dos semanas de vacaciones, sí. La app no se rompe por ello:
sigue guardando en el móvil y la copia se reanuda cuando el proyecto vuelve.

**El plan gratuito sobra por mucho.** Son 500 MB de base de datos y 1 GB de
almacenamiento; una copia de esta app son unos cientos de KB al año.

**Prueba a restaurar antes de necesitarlo.** Una copia que no has restaurado
nunca no es una copia, es una suposición.

**Si pierdes la contraseña, pierdes la copia.** No hay recuperación desde la app.
Guárdala donde guardes las demás.

## Dónde está cada cosa

| Fichero | Qué hace |
|---|---|
| `config.ts` | Valida la configuración. Puro, con pruebas |
| `configEnApp.ts` | La lee de `app.json`. Aparte porque importa Expo |
| `nube.ts` | Las cinco llamadas HTTP: entrar, renovar, subir, bajar, listar |
| `../../../application/nube/cuandoSubir.ts` | Cada cuánto toca, y la guarda anti-copia-vacía |
| `../../../application/nube/useNube.ts` | El estado y las acciones de la pantalla |

**Sin SDK a propósito.** `@supabase/supabase-js` arrastra polyfills y una capa de
tiempo real que esta app no usa, para ahorrar cinco `fetch`. Menos dependencias
es menos que se rompe en la próxima subida de versión de Expo.
