# YouFitness

App personal de registro de salud con gamificación. Peso, alimentación,
entrenamiento, hábitos y estado mental, todo alimentando una única barra de XP.

Funciona **sin conexión y sin servidor**. Los datos viven en el dispositivo.
Opcionalmente puede subir sola una copia de seguridad a Supabase, para no tener
que acordarse de exportarla: [`src/data/adapters/supabase/LEEME.md`](src/data/adapters/supabase/LEEME.md).

**Plataforma objetivo: móvil.** La versión web sigue compilando y se usa como
vista previa rápida durante el desarrollo, pero no es un objetivo del proyecto:
sin servidor no hay sincronización, así que cada instalación es independiente.

- Especificación funcional: [`docs/YouFitness-especificacion.md`](docs/YouFitness-especificacion.md)
- Decisiones técnicas: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- Desplegar en Vercel: [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)
- Guion de pruebas en el móvil: [`docs/PRUEBAS.md`](docs/PRUEBAS.md)
- Mockups: [`mockups/`](mockups/)

---

## Arrancar

```bash
npm install
npx expo install --fix   # ajusta versiones a las del SDK instalado
npm start
```

Y desde ahí:

| Tecla | Dónde abre |
|---|---|
| `w` | Navegador (también sirve para probar el tamaño iPad y escritorio) |
| `i` | Simulador de iOS |
| `a` | Emulador de Android |

Para el móvil sin simulador, instalar **Expo Go** y escanear el QR.

## Comprobar que nada se ha roto

```bash
npm run typecheck   # TypeScript en modo strict
npm test            # 218 pruebas de dominio y de la capa de datos
```

---

## Estado

**Bloque 1 · Entrada y onboarding — implementado.**

| # | Pantalla | Estado |
|---|---|---|
| 01 | Bienvenida | ✅ |
| 02 | Perfil | ✅ sin calorías ni nivel de actividad, con cintura |
| 03 | Bloques | ✅ |
| 04 | Primer objetivo | ✅ con avisos de rango y ritmo |
| 05 | Permisos | ✅ sin diálogos nativos todavía |

**Bloque 2 · Núcleo diario — implementado.**

| # | Pantalla | Estado |
|---|---|---|
| — | Navegación de 4 pestañas + botón central | ✅ |
| 06 | Inicio | ✅ anillo de comidas real; el de pasos, de ejemplo |
| 07 | Inicio · día 1 | ✅ estado vacío con un solo camino |
| 08 | Registro rápido | ✅ las acciones de bloques futuros salen apagadas |
| 09 | Peso | ✅ media de 7 días, gráfica, resumen y cintura |
| 10 | Check-in nocturno | ✅ ánimo, energía, estrés, sueño y actividades |

Registrar el peso o cerrar el día escribe un evento en el log de XP; el nivel,
el rango y la racha se derivan de ahí. Nada de eso se guarda como contador.

**La barra de XP funciona como en Pokémon.** Se vacía en cada subida de nivel y
el siguiente cuesta bastante más: los saltos van de 300 a 27.000 XP y nunca
decrecen. Es lo que hace que el estancamiento se vea solo — repetir el mismo mes
mueve la barra cada vez menos, y para seguir subiendo hay que subir el listón.

**Borrar los datos es una sola puerta:** Ajustes → Eliminar mi cuenta, con
confirmación. Antes había atajos de «repetir onboarding» y «borrar todo» en la
pantalla de Inicio, que es la que más se abre.

Queda de ejemplo el anillo de pasos, pintado apagado y con la etiqueta a la
vista. Vive en `src/ui/screens/inicio/datosDeEjemplo.ts` y **ese fichero se
borra** cuando exista la lectura real de pasos, que necesita build nativa.

**Bloque 3 · Alimentación — implementado.**

| # | Pantalla | Estado |
|---|---|---|
| 11 | Diario de comidas | ✅ navegable por días, con edición y borrado |
| 12 | Añadir comida | ✅ qué has comido, desde receta si quieres, y saciedad |
| 13 | Mis recetas | ✅ sin lotes cocinados, se pueden añadir después |
| 14 | Registrar desliz | ✅ fechado, editable, en qué comida fue, contexto y patrones |

Sin calorías ni macros en gramos, y **sin desglosar el plato**. Hubo una época en
que se registraba su forma en raciones medidas con la mano —proteína, verdura,
hidratos y grasa—; se retiró por decisión de producto. Lo que queda es qué
comiste, cuándo y cómo te dejó, que es con lo que de verdad se hace algo.

Los campos de raciones **siguen en el modelo, opcionales**, por el mismo motivo
que los eventos `habito_*`: las comidas ya registradas los tienen dentro y una
copia de seguridad anterior también. Nada nuevo los escribe, pero quitarlos del
tipo haría imposible leerlos el día que se quiera volver atrás.

**Toda pantalla de registro dice en qué día guarda**, en una línea bajo el
título: apagada si es hoy, en color y con la flecha si no. Es la misma que la
cabecera del diario, y es una línea y no un recuadro porque los trescientos días
al año en que la fecha es la obvia también se ve. El día se elige una sola vez,
en el calendario del diario de Comida, y lo heredan añadir comida y anotar
desliz; ellas solo lo muestran. Repetir el selector en cada pantalla daría dos
sitios donde cambiar lo mismo. Antes el desliz caía siempre en hoy aunque
estuvieras mirando un martes de hace tres semanas: no fallaba nada, el dato
simplemente aterrizaba en el día que no era y no te enterabas hasta mucho
después. Un desliz corregido se abre en **su** pantalla, con categoría y
disparador, no en el editor de comidas. Y desde un día del historial hay un
atajo para abrirlo en Comida y tocarlo.

**Un desliz no es siempre un extra.** El donut puede ser el desayuno y la pizza,
la cena, así que se elige en qué comida fue. Si es una de las tres principales,
esa comida queda cubierta —la app no te dirá que falta la cena que acabas de
anotar— pero no suma raciones ni pinta el día de verde en el semáforo.

**Bloque 4 · Entrenamiento — implementado.**

| # | Pantalla | Estado |
|---|---|---|
| 21 | Biblioteca de ejercicios | ✅ empieza vacía, tú das de alta lo que haces |
| — | Constructor de rutinas | ✅ ejercicios, series y objetivos |
| 15 | Entrenamientos | ✅ semana, rutinas, récords y últimas sesiones |
| 16 y 17 | Sesión activa | ✅ una pantalla para los cinco tipos |
| 18 | Resumen de sesión | ✅ desglose de XP y récords |
| 19 | Progresión por ejercicio | ✅ mejor serie, volumen, 1RM e historial |
| 20 | Escaleras de progresión | ✅ criterio explícito, ascenso que confirmas tú |

Cada tipo de ejercicio calcula el volumen a su manera, y el peso corporal queda
**congelado** en la sesión: adelgazar el año que viene no reescribe el volumen
de las dominadas de hoy.

**Bloque 5 · Historial y cuenta — en curso.**

| # | Pantalla | Estado |
|---|---|---|
| 36 | Perfil | ✅ rango, camino, de dónde sale tu XP y totales de por vida |
| 37 | Ajustes | ✅ modo estricto, presupuesto, copias y eliminar la cuenta |
| 31 | Historial · un día | ✅ |
| 32 | Historial · mes | ✅ calendario navegable sin límite |
| 33 | Historial · año | ✅ mapa de calor de 365 días |
| 34 | Historial · todo | ✅ totales de por vida |
| 22 a 24 | Progreso, objetivos y su constructor | ⬜ |
| 25 a 29 | Tabla de XP, subida de nivel, logros y retos | ⬜ fase 2 |
| 35 | Peso · histórico multiaño | ⬜ |

El historial vive en la pestaña de Progreso. Nada se archiva ni se comprime: un
día de hace tres años se ve con el mismo detalle que el de ayer.

**Semáforo por temas.** El historial se puede filtrar por comidas, entrenos o los
dos juntos, y cada día se pinta según cuántos temas tuvieron desliz: verde
ninguno, amarillo uno, rojo los dos. Dos reglas que evitan que el color mienta:

- **Un día sin datos no es verde, es neutro.** Verde significa «comprobado y
  limpio»; no haber registrado nada es no saberlo. Pintarlo de verde convertiría
  el olvido en recompensa.
- **Un día de descanso planificado no es un entreno fallado.** Solo cuenta como
  desliz si ese día tocaba una rutina —las rutinas llevan días asignados— y no
  registraste sesión. Una rutina sin días marcados nunca penaliza.

**La copia de seguridad ya funciona.** Exporta un JSON legible sin la app y
puede restaurarse. Hay además una copia automática semanal dentro del propio
dispositivo, que protege de un fallo de la app pero **no** de perder el móvil.

**Y ya no hace falta acordarse.** Con Supabase configurado, la app sube esa misma
copia sola cada 12 horas al arrancar. Entras una vez con un correo y no vuelves a
tocar nada. Sigue siendo un respaldo, **no** sincronización: dos dispositivos no
comparten datos, y por eso mismo no hay conflictos que puedan corromper nada. La
sección de Ajustes sale apagada, con el motivo a la vista, mientras no se
configure; sin configurar, no hay servidor ni cuenta y nada sale del móvil.

Dos salvaguardas que hacen que el respaldo sea un respaldo:

- **Una instalación vacía nunca pisa la copia buena.** Si no hay perfil, no se
  sube. Sin esto, instalar en un móvil nuevo para restaurar podría destruir el
  respaldo antes de que te diera tiempo a usarlo.
- **Eliminar la cuenta cierra antes la sesión de la nube**, para que el móvil
  recién vaciado no se suba encima de la copia que existe para volver atrás.

**La función de hábitos se retiró** por decisión de producto. Los tipos de evento
`habito_*` siguen en el modelo de XP a propósito: una copia de seguridad anterior
los contiene, y al restaurarla el total tiene que seguir sumándolos bien.

---

## Estructura

```
app/          Rutas (expo-router). Solo cableado
src/domain/   Reglas puras: IMC, ritmo de pérdida, niveles de XP. Sin React
src/application/  Casos de uso y estado de sesión
src/data/     Interfaces de repositorio + adaptador local intercambiable
src/platform/ Puertos al dispositivo: almacenamiento, IDs
src/ui/       Tema, componentes presentacionales y pantallas
```

Dos reglas que sostienen el resto:

1. **Nadie fuera de `src/data/adapters/` sabe dónde se guardan los datos.**
2. **Nadie fuera de `src/ui/theme/` escribe un color o un tamaño de fuente.**

La primera hace que añadir backend sea cambiar un fichero. La segunda hace que
rediseñar la app no pueda romper la lógica.

---

## Siguiente paso

Lo que queda del bloque 5:

- **Progreso y objetivos** (22 a 24): XP del mes, adherencia por día de la
  semana y el constructor genérico de objetivos.
- **Peso histórico multiaño** (35), con anotaciones sobre la gráfica.
- **Fase 2** (25 a 29): tabla completa de XP, subida de nivel animada, logros y
  retos. Necesitan meses de datos para no estar vacíos.

Y cuando quieras salir del navegador: **build nativa con EAS**, que es lo que
desbloquea la lectura de pasos y las notificaciones fiables.

## Aviso

Los rangos de peso, los ritmos de pérdida y las referencias de cintura son
valores de referencia general, no consejo médico personalizado.
