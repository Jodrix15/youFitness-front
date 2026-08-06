# YouFitness

App personal de registro de salud con gamificación. Peso, alimentación,
entrenamiento, hábitos y estado mental, todo alimentando una única barra de XP.

Funciona **sin conexión y sin servidor**. Los datos viven en el dispositivo.

**Plataforma objetivo: móvil.** La versión web sigue compilando y se usa como
vista previa rápida durante el desarrollo, pero no es un objetivo del proyecto:
sin servidor no hay sincronización, así que cada instalación es independiente.

- Especificación funcional: [`docs/YouFitness-especificacion.md`](docs/YouFitness-especificacion.md)
- Decisiones técnicas: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
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
npm test            # 30 pruebas de dominio y de la capa de datos
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
| 06 | Inicio | ✅ anillos de ejemplo hasta que existan sus bloques |
| 07 | Inicio · día 1 | ✅ estado vacío con un solo camino |
| 08 | Registro rápido | ✅ las acciones de bloques futuros salen apagadas |
| 09 | Peso | ✅ media de 7 días, gráfica, resumen y cintura |
| 10 | Check-in nocturno | ✅ ánimo, energía, estrés, sueño y actividades |

Registrar el peso o cerrar el día escribe un evento en el log de XP; el nivel,
el rango y la racha se derivan de ahí. Nada de eso se guarda como contador.

Quedan de ejemplo los anillos de pasos y hábitos, pintados apagados y con la
etiqueta a la vista. Viven en `src/ui/screens/inicio/datosDeEjemplo.ts` y **ese
fichero se borra** cuando existan la build nativa y el Bloque 4.

**Bloque 3 · Alimentación — implementado.**

| # | Pantalla | Estado |
|---|---|---|
| 11 | Diario de comidas | ✅ navegable por días, con edición y borrado |
| 12 | Añadir comida | ✅ cuatro contadores de raciones y saciedad |
| 13 | Mis recetas | ✅ sin lotes cocinados, se pueden añadir después |
| 14 | Registrar desliz | ✅ contexto, presupuesto semanal y patrones |

Sin calorías ni macros en gramos. Se registra la **forma del plato** en raciones
medidas con la mano, que es la única unidad que se sostiene a los seis meses.

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

Bloque 2 · Núcleo diario: Inicio de verdad, registro rápido, peso y check-in
nocturno. Ahí entran el registro de eventos de XP y la media móvil de 7 días,
que es cuando toca añadir el adaptador SQLite.

## Aviso

Los rangos de peso, los ritmos de pérdida y las referencias de cintura son
valores de referencia general, no consejo médico personalizado.
# youFitness-front
