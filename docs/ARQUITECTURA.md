# YouFitness · Arquitectura

**Versión** 1.0 · 6 de agosto de 2026
**Estado** Bloque 1 implementado

Este documento explica *por qué* el código está repartido así. La especificación
funcional está en `YouFitness-especificacion.md`; aquí solo hay decisiones
técnicas.

---

## 1. Las tres decisiones que lo condicionan todo

### 1.1 Local-first, sin cuentas y sin servidor

Los datos viven en el dispositivo. La app nunca espera a la red para responder.

Se llegó aquí después de descartar dos alternativas:

| Alternativa | Por qué se descartó |
|---|---|
| Spring Boot + MySQL en Render (plan gratuito) | El servicio se apaga tras unos minutos sin tráfico, y arrancar la JVM encima añade más espera. Uno o dos minutos hasta la primera pantalla, en una app que se abre varias veces al día para anotar cosas |
| Conectar la app directamente a MySQL | Obligaría a meter las credenciales de la base de datos dentro del binario. Cualquiera puede extraerlas y leer o borrar los datos de todos |

**SQLite y MySQL no son dos opciones del mismo tipo.** SQLite es una librería
embebida: la base de datos es un fichero dentro de la app, sin proceso servidor
ni red. MySQL es cliente-servidor y no puede vivir dentro de un móvil. Elegir
MySQL no es elegir un motor: es elegir tener backend.

### 1.2 La lógica no sabe dónde se guardan los datos

Todo lo que hay por encima de `src/data/adapters/` habla con **interfaces**
(`PerfilRepository`, `ObjetivoRepository`…), nunca con AsyncStorage, SQLite o
`fetch`.

Consecuencia: cambiar de almacenamiento local a una API es sustituir un fichero
y una línea del contenedor. Ni una pantalla ni una regla de negocio se enteran.

### 1.3 El diseño no sabe qué significan los datos

Los componentes de `src/ui/components/` reciben props ya calculadas y no
importan nada del dominio ni de los datos. Rediseñar la app no puede romper la
lógica porque no hay lógica dentro del diseño.

---

## 2. Las capas

```
app/                    Rutas de expo-router. Cableado, cuatro líneas por fichero
└── src/
    ├── domain/         Modelos y reglas puras. Sin React, sin IO, sin fechas del sistema
    ├── application/    Casos de uso y estado de sesión. Orquesta dominio + datos
    ├── data/           Repositorios (interfaces) y adaptadores (implementaciones)
    ├── platform/       Puertos al dispositivo: almacenamiento, IDs, más adelante salud
    └── ui/             Tema, componentes presentacionales y pantallas
```

**La regla de dependencia va hacia dentro.** `ui` puede importar de `application`
y `domain`; `domain` no importa de nadie. Si algún día `domain` necesita
importar de `ui`, algo se ha colocado en la capa equivocada.

### 2.1 `domain` — reglas puras

Funciones sin efectos. `estimarLlegada` recibe la fecha de hoy por parámetro en
lugar de leer el reloj, precisamente para poder testearla.

Aquí viven el rango de peso saludable, el ratio cintura/altura, el límite de
1 %/semana, la tabla de niveles y el multiplicador de racha.

Se ejecutan con `npm test` sin arrancar la app.

### 2.2 `application` — casos de uso

`completarOnboarding(repos, borrador)` orquesta: valida, crea el perfil, fija
los módulos, genera los objetivos y marca el onboarding como terminado —**en ese
orden**. La marca va la última a propósito: si algo falla por el camino, el
onboarding se repite en lugar de dejar la app a medio configurar.

No sabe nada de React. Se podría llamar desde un script.

### 2.3 `data` — la frontera

```
data/
├── repositories/index.ts        Los contratos. Lo único que ve el resto de la app
├── adapters/local/              Implementación actual
├── adapters/http/               Vacío a propósito. Ver su LEEME.md
└── contenedor.tsx               Único punto donde se elige la implementación
```

### 2.4 `ui` — tema, componentes, pantallas

```
ui/
├── theme/tokens.ts        Colores, espaciados y tipografías crudos
├── theme/theme.ts         Traducción a roles: surface, textMuted, accent…
├── components/            Presentacionales. Sin lógica de negocio
├── layout/useResponsive   Única fuente de verdad sobre el tamaño de pantalla
└── screens/               Componen componentes y llaman a casos de uso
```

Los componentes consumen **roles** (`colors.surface`), no tokens crudos
(`palette.panel2`). Por eso añadir un tema claro es escribir un objeto nuevo en
`theme.ts`, sin tocar ningún componente.

Los degradados son tokens (`gradients.marca`, `.accion`, `.xp`) y se piden por
nombre a través del componente `Gradient`. Ningún otro componente importa
`expo-linear-gradient` ni escribe una lista de colores: el icono, el botón
principal y la barra de XP comparten identidad y tienen que seguir
compartiéndola si mañana cambia.

**Ninguna pantalla escribe un color, un tamaño de fuente o un espaciado
literal.** Si aparece un `#2ee6c8` o un `fontSize: 14` fuera de `theme/`, es un
error de revisión.

---

## 3. Móvil, iPad y web con el mismo código

Los mockups son la columna de teléfono. El resto se deriva de ahí:

| Pantalla | Comportamiento |
|---|---|
| Teléfono | Ancho completo, como los mockups |
| Tablet / iPad | Columna centrada de 560 px sobre el fondo oscuro |
| Escritorio | Columna centrada de 420 px |

Lo resuelve `Screen`, un contenedor por el que pasan todas las pantallas. Ninguna
pantalla consulta `Platform.OS` ni `Dimensions` por su cuenta.

El teclado numérico es propio, no el del sistema: los mockups lo muestran dentro
de la tarjeta, y en iPad y web el teclado nativo no aparece.

---

## 4. Modelo de datos

Reglas aplicadas a todas las entidades, desde el primer día:

| Regla | Por qué |
|---|---|
| **UUID v4** como clave | Dos dispositivos pueden crear registros sin coordinarse. Cuesta lo mismo hoy |
| **`usuarioId` en todo** | Aunque no haya cuentas. Añadirlo después obliga a migrar todas las tablas |
| **`creadoEn` / `actualizadoEn` UTC** | Es lo que permite resolver conflictos por "gana el más reciente" |
| **Borrado lógico** | Un `DELETE` no se puede sincronizar: el otro dispositivo no sabe que la fila existió |

Nada de esto se usa hoy. Todo es barato ahora y caro después.

---

## 5. Sobre el motor de almacenamiento

Hoy el adaptador local usa un almacén clave-valor sobre AsyncStorage, que
funciona igual en iOS, Android y web.

Para el Bloque 1 es más que suficiente: un perfil, cinco módulos y tres
objetivos. Cuando lleguen el historial y sus consultas por rango de fechas —la
media móvil de 7 días, el mapa de calor anual—, se añade un adaptador SQLite que
implemente **las mismas interfaces**. Las pantallas no cambian.

La especificación apoya la media de 7 días en una función ventana de SQL. Esa
consulta necesita SQLite; el perfil del onboarding, no. Meter SQLite ahora sería
pagar la complejidad antes de necesitarla.

---

## 6. Copias de seguridad

**SQLite no es una copia de seguridad.** Es dónde viven los datos. Una copia,
por definición, está en otro sitio.

Sin servidor, si el dispositivo se pierde o alguien borra los datos del
navegador, no hay nada que recuperar. Por eso la exportación del §7 de la
especificación deja de ser buena práctica y pasa a ser obligatoria, con aviso
periódico que insista si hace tiempo que no se hace copia.

Pendiente para la pantalla de Ajustes:

- Exportar todo a JSON legible sin la app.
- Recordatorio si han pasado N días sin copia.
- **Probar la restauración una vez**: borrar, reinstalar, importar. Un backup que
  no se ha restaurado nunca es una suposición, no un backup.

---

## 7. Qué haría falta el día que se quiera sincronizar

1. Escribir `crearRepositoriosHttp` implementando las mismas interfaces.
2. Cambiar una línea en `contenedor.tsx`.
3. Añadir cola de operaciones pendientes y política de conflictos.
4. Autenticación.

Los puntos 1 y 2 son el trabajo fácil, y es justo el que suele ser imposible
cuando el acceso a datos está repartido por cuarenta ficheros.

**El cold start dejaría de importar**: la app escribe en local y responde al
instante, y la sincronización va en segundo plano. Nunca se espera al servidor.
Si aun así se busca algo sin arranque en frío, Supabase da Postgres y
autenticación gestionadas.

---

## 8. Desviaciones respecto a los mockups

| Mockup | Qué se hizo | Por qué |
|---|---|---|
| 02 · nivel de actividad y estimación de 2.150 kcal/día | Eliminados | §10 los descarta: solo servían para estimar el gasto calórico, que la app ya no calcula. El mockup se quedó desactualizado |
| 02 · sin campo de cintura | Añadido | §6 lo señala como el mejor indicador disponible junto a la altura |
| 01 · login con Apple/Google | No existe | No hay cuentas |
| 05 · diálogos de permisos del sistema | Se registra la intención, sin diálogo nativo | Los módulos nativos de salud necesitan build de desarrollo. Pendiente |
| 01 · nota «todo se guarda en tu móvil» | Eliminada | Decisión de producto: sobra en la primera pantalla. El aviso sobre copias de seguridad sigue en la pantalla 05 |

---

## 9. Verificación

`npm test` compila las capas sin dependencias de React y ejecuta 30 pruebas:

- **Composición corporal** (9): rango saludable, ratio cintura/altura, aviso por
  objetivo bajo mínimos, aviso por ritmo superior al 1 %/semana, estimación de
  llegada.
- **XP** (7): umbrales de nivel, progreso, que el nivel puede bajar, tope del
  multiplicador y que **nunca amplifica una resta**.
- **Objetivos iniciales** (7): qué objetivos se generan según los bloques activos.
- **Adaptador local** (7): que el onboarding persiste, que toda entidad nace con
  UUID y marcas UTC, que un onboarding incompleto no escribe nada, y que
  reiniciar deja la app como recién instalada.

`npm run typecheck` pasa en modo `strict` con `noUncheckedIndexedAccess`.
