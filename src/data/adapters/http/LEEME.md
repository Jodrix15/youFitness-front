# Adaptador HTTP — reservado

Esta carpeta está vacía a propósito. Documenta la ruta de salida, no una promesa.

## Qué iría aquí

Una implementación de las mismas interfaces de `src/data/repositories/index.ts`,
hablando con una API en lugar de con el almacenamiento del dispositivo:

```ts
export function crearRepositoriosHttp(cliente: ClienteApi): Repositorios { ... }
```

## Qué habría que cambiar en el resto de la app

Una línea, en `src/data/contenedor.ts`:

```ts
-const repos = crearRepositoriosLocales(almacenAsyncStorage);
+const repos = crearRepositoriosHttp(cliente);
```

Ni una pantalla. Ni una regla de dominio. Ese es el objetivo de toda la
separación en capas: que la decisión de "¿backend o no?" no esté repartida por
cuarenta ficheros.

## Lo que ya está preparado para ese día

- **UUID v4** como clave primaria en todas las entidades. Dos dispositivos
  pueden crear registros sin colisionar y sin pedir permiso al servidor.
- **`usuarioId` en todas las tablas**, aunque hoy no haya cuentas.
- **`actualizadoEn` en UTC**, que es lo que permite resolver conflictos por
  "gana el más reciente".
- **Borrado lógico con `borradoEn`**. Un `DELETE` de verdad no se puede
  sincronizar: el otro dispositivo no tiene forma de saber que la fila existió.

## Lo que faltaría escribir

- Cola de operaciones pendientes, persistida, para poder registrar sin conexión.
- Reconciliación al reconectar y política de conflictos.
- Autenticación y renovación de credenciales.

## Nota sobre el alojamiento

El plan gratuito de Render apaga el servicio tras unos minutos sin tráfico, y
Spring Boot arranca lento porque tiene que levantar la JVM. Eso son los uno o
dos minutos de espera que motivaron volver a local-first.

Con esta arquitectura ese problema desaparece aunque se añada backend: la app
escribe siempre en local y responde al instante, y la sincronización va en
segundo plano. Nunca se espera al servidor. Si aun así se busca algo sin cold
start, Supabase da Postgres y autenticación en plan gratuito.
