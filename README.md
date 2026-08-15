# YouFitness

App personal de registro de salud con gamificación. Peso, alimentación,
entrenamiento, hábitos y estado mental, todo alimentando una única barra de XP.

Funciona **sin conexión y sin servidor**. Los datos viven en el dispositivo.

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
npm test            # 207 pruebas de dominio y de la capa de datos
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
| 12 | Añadir comida | ✅ cuatro contadores de raciones y saciedad |
| 13 | Mis recetas | ✅ sin lotes cocinados, se pueden añadir después |
| 14 | Registrar desliz | ✅ en qué comida fue, contexto, presupuesto y patrones |

Sin calorías ni macros en gramos. Se registra la **forma del plato** en raciones
medidas con la mano, que es la única unidad que se sostiene a los seis meses.

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
dispositivo, que protege de un fallo de la app pero **no** de perder el móvil:
para eso hay que descargar el fichero y guardarlo en otro sitio.

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
