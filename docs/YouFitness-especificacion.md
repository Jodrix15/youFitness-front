# YouFitness · Especificación funcional y técnica

**Versión** 2.0 · 5 de agosto de 2026
**Autor** Jordi
**Estado** Diseño cerrado, listo para implementar

---

## 1. Qué es

App móvil personal de registro de salud con gamificación. Cubre peso, alimentación, entrenamiento (gimnasio y calistenia), hábitos y estado mental. Todo el registro alimenta una única barra de experiencia con rangos que suben.

Funciona **entera sin conexión y sin servidor**. Un solo usuario, sin cuentas.

### Principios de diseño

Estos cinco principios explican casi todas las decisiones del documento. Cuando algo no encaje, el principio manda.

**1 · Registrar nunca se castiga.** Anotar un desliz o un mal hábito siempre suma XP y mantiene la racha. El castigo es por el comportamiento, y sale de lo que la app puede verificar sola. Si confesar costara puntos, dejarías de confesar, y se perdería el dato más valioso que produce la app.

**2 · No se muestra lo que no se puede medir.** Fuera calorías, macros en gramos y porcentaje de grasa por bioimpedancia: todos tenían un margen de error mayor que la señal que buscaban. La media de 7 días del peso dice si comes la cantidad correcta.

**3 · Los rangos suben por constancia, no por kilos.** El XP viene de registrar y de cumplir objetivos, no de perder peso. Así el progreso avanza durante las semanas en las que la báscula no se mueve, que son la mayoría.

**4 · Nada se archiva.** Sin límite de antigüedad, sin compresión de datos viejos, sin "últimos N días". Cuatro niveles de zoom hasta el día concreto de hace tres años.

**5 · Sin red, nunca.** Ninguna pantalla depende de conexión. El registro de comida es texto y cuatro contadores; la biblioteca de ejercicios es local; el historial se calcula con SQL en el móvil.

---

## 2. Stack

| Capa | Elección |
|---|---|
| UI | React Native + Expo, `expo-router` |
| Lenguaje | TypeScript en modo `strict` |
| Datos | `expo-sqlite` + Drizzle ORM (migraciones versionadas) |
| Estado | Zustand |
| Animación | `react-native-reanimated` + `moti` |
| Gráficas | `victory-native` (Skia) |
| Salud | `react-native-health` (iOS) / `react-native-health-connect` (Android) |
| Avisos | `expo-notifications` |
| Build | EAS dev build (obligatorio por los módulos nativos de salud) |
| Backend | **Ninguno.** Ver §8. |

### Integración con datos de salud

Solo se leen **pasos**. Ni pulso en reposo ni sueño automático: no hay wearable, y el móvil por sí solo no los mide. El sueño se introduce a mano en el check-in nocturno.

Se define una interfaz `HealthProvider` con dos implementaciones, una por plataforma:

```ts
interface HealthProvider {
  requestPermissions(): Promise<boolean>
  getSteps(from: Date, to: Date): Promise<DailySteps[]>
}
```

Notas de implementación:

- En iOS **no se puede distinguir "permiso denegado" de "sin datos"**: ambos devuelven lista vacía. La UI debe decir "sin datos" con enlace a Ajustes, nunca "permiso denegado".
- La lectura es *pull*. Sincronizar los últimos 7 días cada vez que la app pasa a primer plano. La entrega en segundo plano se deja para más adelante.
- Health Connect exige declarar los permisos en el manifest.

---

## 3. Mapa de pantallas (37)

### Entrada y onboarding (5)

| # | Pantalla | Propósito |
|---|---|---|
| 01 | Bienvenida | Nombre + avatar + barra de XP de nivel 1. **Se ve una sola vez**; después la app abre en Inicio |
| 02 | Perfil | Peso, altura, edad, sexo, cintura → rango de peso saludable |
| 03 | Bloques | Qué se quiere seguir. Controla tarjetas de Inicio y fuentes de XP, **no oculta pestañas** |
| 04 | Primer objetivo | Peso objetivo dentro del rango sano + sesiones/semana → genera 4 objetivos |
| 05 | Permisos | Pasos y notificaciones, explicados antes de lanzar el diálogo del sistema. Backup activado |

### Núcleo diario (5)

| # | Pantalla | Propósito |
|---|---|---|
| 06 | Inicio | XP, racha, 3 anillos (comidas/pasos/hábitos), composición del día, misiones |
| 07 | Inicio · día 1 | Estado vacío. Un solo camino y qué se desbloquea con más datos |
| 08 | Registro rápido | Hoja del botón central, 6 acciones con su XP |
| 09 | Peso | Media de 7 días como número protagonista, teclado numérico, cintura, foto |
| 10 | Check-in nocturno | Ánimo, energía, estrés, sueño, hora de acostarse, actividades, nota |

### Alimentación (4)

| # | Pantalla | Propósito |
|---|---|---|
| 11 | Diario de comidas | Composición del día en raciones, timeline, racha de días completos |
| 12 | Añadir comida | 4 contadores de porciones de mano + saciedad. Sin base de datos de alimentos |
| 13 | Mis recetas | Combinaciones con nombre, registrables de un toque. Lotes cocinados |
| 14 | Registrar desliz | Contexto: disparador, cantidad, emoción, lugar. Presupuesto semanal |

### Entrenamiento (7)

| # | Pantalla | Propósito |
|---|---|---|
| 15 | Entrenamientos | Semana, sesión de hoy, rutinas, récords recientes |
| 16 | Sesión · peso externo | Tabla de series, calculadora de discos, comparación con la última vez |
| 17 | Sesión · calistenia | Reps sin peso, lastre opcional, isométricos con cronómetro |
| 18 | Resumen de sesión | Desglose del XP, récords, volumen, esfuerzo percibido |
| 19 | Progresión · peso externo | 1RM estimado (con aviso), volumen, historial, récords |
| 20 | Progresión · calistenia | Escalera de variantes con criterio de desbloqueo explícito |
| 21 | Biblioteca de ejercicios | Cada ejercicio declara su tipo y su factor de apalancamiento |

### Progreso y gamificación (9)

| # | Pantalla | Propósito |
|---|---|---|
| 22 | Progreso | XP del mes, adherencia por día de la semana, relaciones observadas |
| 23 | Objetivos · lista | Activos y cumplidos, con progreso y plantillas |
| 24 | Crear objetivo | Constructor genérico: métrica + condición + valor + periodo + XP |
| 25 | Cómo funciona el XP | Tabla completa de sumas y restas, multiplicador, modo estricto |
| 26 | Rangos y niveles | Rango actual, camino completo, origen del XP |
| 27 | Subida de nivel | Pantalla completa de celebración con recompensa concreta |
| 28 | Logros | Constancia, fuerza, alimentación, mente. Bloqueados visibles |
| 29 | Retos personales | Contra uno mismo, con comodines. Sin capa social |
| 30 | Hábitos | Buenos (suman) y malos (restan), con rejilla de 28 días |

### Historial completo (5)

| # | Pantalla | Propósito |
|---|---|---|
| 31 | Día | Todo lo registrado en una jornada concreta. Editable, con marca de editado |
| 32 | Mes | Calendario navegable hacia atrás sin límite |
| 33 | Año | 365 días en mapa de calor + desglose por meses + año contra año |
| 34 | Todo | Un mes por celda, totales de por vida, hitos |
| 35 | Peso · histórico | Multi-año con anotaciones (lesiones, vacaciones, cambios de rutina) |

### Cuenta (2)

| # | Pantalla | Propósito |
|---|---|---|
| 36 | Perfil | Rango, estadísticas de por vida, accesos, insignias |
| 37 | Ajustes | Intensidad de gamificación, modo estricto, backup, recordatorios, privacidad |

---

## 4. Modelo de datos

Reglas transversales, aplicadas a **todas** las tablas:

- **Clave primaria UUID v4**, no autoincremental. Cuesta lo mismo hoy y evita una migración dolorosa el día que haya un segundo dispositivo.
- **`created_at` y `updated_at`** en UTC.
- **Borrado lógico** con `deleted_at`. Nunca `DELETE`.
- **Índice por fecha** en toda tabla con columna de fecha. Es lo que hace instantáneo el historial.

### Perfil y configuración

```sql
profile (
  id, nombre, fecha_nacimiento, altura_cm, sexo,
  primer_dia_semana, modo_estricto, intensidad_gamificacion,
  presupuesto_deslices_semana DEFAULT 2, created_at, updated_at
)
modulo (id, clave, activo)          -- grasa | fuerza | comer | mental | sueno
```

### Peso y medidas

```sql
peso_registro (id, fecha UNIQUE, peso_kg, hora, nota, ...)
medida        (id, fecha, tipo, valor_cm)          -- cintura, cuello…
foto_progreso (id, fecha, ruta_local, nota)
anotacion     (id, fecha, texto, tipo)             -- lesión, vacaciones, cambio de rutina
```

La **media móvil de 7 días** no se almacena: se calcula con una función ventana en SQL. Así nunca queda desincronizada si editas un pesaje del pasado.

```sql
SELECT fecha, peso_kg,
       AVG(peso_kg) OVER (ORDER BY fecha ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS media7
FROM peso_registro WHERE deleted_at IS NULL ORDER BY fecha;
```

### Alimentación

```sql
comida (
  id, fecha, tipo, hora, descripcion, receta_id NULL,
  prot_porciones, verd_porciones, hidr_porciones, gras_porciones,  -- 0..3
  saciedad,                                                        -- 1..5
  foto_ruta, nota, es_desliz, editado_en NULL
)

desliz_detalle (                    -- 1:1 con comida donde es_desliz = true
  comida_id, categoria, cantidad, sustituyo_comida,
  disparador, emocion_despues, lugar, nota
)
```

**Decisión:** el desliz no es una tabla paralela, es una comida con `es_desliz = true` más una fila de detalle. Aparece en el mismo timeline, cuenta en las mismas consultas, y no hay que unir dos historiales distintos.

```sql
receta             (id, nombre, raciones, notas, icono, veces_usada)
receta_ingrediente (id, receta_id, nombre, cantidad_texto)
receta_lote        (id, receta_id, fecha_cocinado, raciones_total, raciones_restantes, caduca)
```

Los ingredientes son **texto libre**, sin macros. No hay tabla de alimentos ni catálogo externo.

### Entrenamiento

```sql
ejercicio (
  id, nombre, tipo, factor_apalancamiento, grupo_muscular,
  escalera_id NULL, es_personalizado
)
-- tipo: externo | corporal | corporal_lastre | isometrico | cardio
```

```sql
escalera          (id, nombre)                     -- "Dominada"
escalon           (id, escalera_id, orden, nombre, criterio_texto,
                   criterio_series, criterio_reps, criterio_rir)
progreso_escalera (id, escalera_id, escalon_actual, fecha_desbloqueo)

rutina            (id, nombre, xp_base, notas)
rutina_ejercicio  (id, rutina_id, ejercicio_id, orden,
                   series_obj, reps_obj, peso_obj, segundos_obj, rir_obj)

sesion (id, rutina_id NULL, fecha, hora_inicio, hora_fin,
        esfuerzo_percibido, nota, volumen_total)

serie  (id, sesion_id, ejercicio_id, numero,
        reps NULL, peso_kg NULL, lastre_kg NULL, segundos NULL, rir NULL,
        es_pr, volumen)
```

`serie` tiene columnas anulables porque los cinco tipos de ejercicio no comparten forma: una dominada no tiene `peso_kg`, un L-sit no tiene `reps`. La alternativa (una tabla por tipo) multiplica las consultas del historial por cinco sin ganar nada.

**Cálculo del volumen**, según el tipo:

| Tipo | Volumen de la serie |
|---|---|
| externo | `reps × peso_kg` |
| corporal | `reps × peso_corporal × factor` |
| corporal_lastre | `reps × (peso_corporal × factor + lastre_kg)` |
| isometrico | `segundos × peso_corporal × factor` (unidad aparte, no se suma) |
| cardio | no aplica |

Factores de apalancamiento aproximados: dominada 1,00 · fondo 0,95 · sentadilla a una pierna 0,85 · flexión 0,65 · remo invertido 0,55. Son estimaciones de biomecánica, editables por el usuario, y solo pretenden hacer el volumen comparable **contigo mismo**.

El **1RM estimado** usa Epley (`peso × (1 + reps/30)`) y solo se muestra en ejercicios de tipo `externo`, con aviso de que pierde fiabilidad por encima de 8-10 repeticiones. En peso corporal no se muestra: no significa nada.

### Hábitos, check-in y objetivos

```sql
habito          (id, nombre, tipo, xp, objetivo_valor, unidad, automatico, activo, orden)
                -- tipo: bueno | malo ; xp con signo
habito_registro (id, habito_id, fecha, valor, cumplido)

checkin (id, fecha UNIQUE, animo, energia, estres,
         sueno_horas, sueno_calidad, hora_acostarse, nota)
checkin_actividad (checkin_id, actividad)

objetivo (
  id, nombre, metrica, operador, valor, unidad, periodo,
  xp, recordatorio, mostrar_inicio, activo, creado_en, cumplido_en
)
-- operador: gte | lte | eq
-- periodo:  comida | dia | semana | mes | hito

objetivo_periodo (id, objetivo_id, periodo_inicio, periodo_fin,
                  valor_alcanzado, cumplido, xp_aplicado)
```

El objetivo es **puramente declarativo**: `métrica + operador + valor + periodo`. Un evaluador único recorre los objetivos activos al cerrar cada periodo, resuelve la métrica con una consulta y escribe en `objetivo_periodo`. Añadir una métrica nueva es añadir un caso al resolvedor, no una pantalla.

### XP — el registro inmutable

```sql
xp_evento (
  id, fecha, hora, tipo, origen_tabla, origen_id,
  xp_base, multiplicador, xp_final,     -- xp_final con signo
  nota
)
```

**Esta es la decisión más importante del modelo.** El XP no es un contador en `profile`: es un log inmutable de eventos. Consecuencias:

- El nivel y el rango son **derivados**: `SELECT SUM(xp_final) FROM xp_evento`.
- Si cambias las reglas de gamificación, **recalculas el pasado** en lugar de arrastrar una cifra incoherente.
- Puedes explicar cualquier punto: "estos 245 XP vienen de esta sesión".
- El desglose de "de dónde sale tu XP" es un `GROUP BY tipo`, no un contador extra que mantener.

Las **rachas tampoco se almacenan**. Se calculan sobre los días con al menos un registro. Con años de datos sigue siendo instantáneo.

---

## 5. Economía de XP

### Suma

| Acción | XP |
|---|---|
| Registrar el peso | +25 |
| Registrar una comida | +20 |
| Registrar un desliz | +15 |
| Marcar un mal hábito | +2 |
| Cada hábito bueno | +5 |
| Cerrar el día (check-in) | +30 |
| Completar un entreno | +80 |
| Cada serie registrada | +2,5 |
| Récord personal | +120 |
| Subir de escalón | +200 |
| Objetivo cumplido | +15 a +60 |
| Objetivo de hito cumplido | +300 a +750 |

### Resta — solo con **modo estricto** activado

| Evento | XP | Lo verifica la app |
|---|---|---|
| Día sin registrar nada | −20 | Sí |
| Entreno programado saltado | −30 | Sí |
| Objetivo incumplido al cerrar periodo | −10 | Sí |
| Desliz por encima del presupuesto semanal | −25 | Sí (cuenta los registrados) |
| Cada mal hábito marcado | −10 a −30 | Lo marca el usuario |
| Acostarse después de las 2:00 | −15 | Del check-in |

**Regla inviolable:** ningún acto de registro resta XP. El desliz siempre da +15; solo el tercero de la semana en adelante añade además −25. Registrarlo sigue siendo mejor que esconderlo.

### Multiplicador de racha

| Días seguidos con algún registro | Multiplicador |
|---|---|
| 3 | ×1,1 |
| 7 | ×1,2 |
| 14 | ×1,3 |
| 30 | ×1,5 (máximo) |

Solo afecta a lo que suma, nunca a lo que resta. Al fallar un día baja un escalón, no vuelve a cero.

### Niveles y rangos

| Nivel | XP acumulada | Rango |
|---|---|---|
| 1 | 0 | 🌱 Iniciado |
| 2 | 300 | 🌱 Iniciado |
| 3 | 800 | 🥉 Aprendiz |
| 4 | 1.500 | 🥉 Aprendiz |
| 5 | 2.800 | 🥈 Constante |
| 6 | 5.000 | 🥈 Constante |
| 7 | 10.000 | 🛡️ Guerrero de Hierro |
| 8 | 13.000 | 🛡️ Guerrero de Hierro |
| 9 | 18.000 | ⚔️ Veterano |
| 10 | 23.000 | ⚔️ Veterano |
| 11 | 27.000 | ⚔️ Veterano |
| 12 | 32.000 | 🏅 Élite |
| 13-15 | 39.000 / 46.000 / 53.000 | 🏅 Élite |
| 16 | 60.000 | 👑 Leyenda |

**El nivel puede bajar.** Si el XP acumulado cae por debajo del umbral, se pierde el nivel y el rango. Es lo que hace que subir signifique algo.

---

## 6. Reglas de negocio

### Umbrales de datos mínimos

La app **no inventa análisis con datos insuficientes**. Cada vista analítica declara su umbral y hasta alcanzarlo muestra el estado "se desbloqueará con N registros más".

| Vista | Umbral |
|---|---|
| Tendencia de peso (media 7 días) | 7 pesajes |
| Patrón de deslices | 5 deslices |
| Correlaciones del check-in | 14 check-ins |
| Adherencia por día de la semana | 4 semanas |
| Comparativa año contra año | 2 años con datos |

### Peso saludable

Rango de IMC 18,5–24,9 aplicado a la altura. Se acompaña **siempre** de dos avisos: que el IMC no distingue músculo de grasa (relevante haciendo calistenia), y que el mejor indicador disponible es **cintura/altura por debajo de 0,50**.

Al fijar el objetivo se avisa si queda por debajo del rango, o si el ritmo implícito supera el **1 % del peso corporal por semana**.

### Presupuesto de deslices

Dos por semana natural (según `primer_dia_semana`). Los dos primeros no penalizan. No existe racha de "días limpios": romperla castigaría indirectamente el registro honesto, que es lo único que la app pide.

### Desbloqueo de escalón

Cada escalón declara su criterio de forma explícita (`3 series × 10 reps con RIR ≥ 2`). El evaluador comprueba el criterio después de cada sesión y, si se cumple, ofrece el ascenso. **Nunca lo aplica solo:** el usuario confirma. Bajar de repeticiones al subir de escalón es normal y la gráfica lo marca para que no parezca un retroceso.

---

## 7. Copias de seguridad y migraciones

Los datos viven solo en el móvil. Estas reglas no son opcionales.

### Ubicación

La base de datos va en `Application Support` (iOS) o el directorio de datos de la app (Android). **Nunca en `Caches`**: el sistema puede vaciarlo y el backup del sistema no lo cubre.

### Exportación

- **Automática semanal** a iCloud Drive / Google Drive.
- **En cada arranque tras un cambio de versión**, antes de migrar.
- Formato **legible sin la app**: un JSON con todas las tablas, más el `.sqlite` en crudo. Si el proyecto se abandona, los datos siguen siendo recuperables.
- Tamaño esperado: unos cientos de KB por año. Se puede enviar por email.

### Restauración

- Botón de restaurar desde fichero.
- **Probar la restauración una vez al principio**: borrar la app, reinstalar, importar. Un backup que no se ha restaurado nunca no es un backup, es una suposición.

### Migraciones

1. Copiar el fichero de base de datos antes de migrar.
2. Crear la tabla nueva en paralelo, copiar, verificar.
3. Solo entonces retirar la vieja. **Nunca un `DROP` optimista.**
4. Cada migración va versionada en Drizzle y es reversible.

El fallo más probable de pérdida de datos no es el hardware: es una migración mal hecha.

---

## 8. Sobre no tener backend

La persistencia no necesita servidor. En una app web el backend existe porque el navegador no es un lugar donde guardar nada y varios usuarios comparten un dataset. Aquí no ocurre ninguna de las dos cosas: el móvil tiene disco propio, SQLite es transaccional, y el único usuario es uno.

Lo que un backend aportaría, y si aplica:

| Función del backend | ¿Aplica? |
|---|---|
| Estado compartido entre usuarios | No, un usuario |
| Lugar de confianza para aplicar reglas | No, nadie a quien impedir hacer trampas |
| Cómputo que el cliente no puede hacer | No, miles de filas se resuelven en milisegundos |
| Guardar secretos | No hay |
| Acceso multi-dispositivo | No hoy |
| **Durabilidad** | **Sí — y se resuelve con §7, no con un servidor** |

El modelo de datos (UUID, `updated_at`, borrado lógico) deja la puerta abierta a sincronizar más adelante sin migración.

---

## 9. Fases

### Fase 1 — que yo la use

Registro de peso, comidas cualitativas, sesiones (los cinco tipos de ejercicio), hábitos, check-in. Barra de XP, racha, niveles y rangos. Historial en los cuatro niveles de zoom. Objetivos con el constructor genérico. Backup y exportación.

Criterio de éxito: **seguir abriéndola el día 30.**

### Fase 2 — que enseñe algo

Correlaciones con sus umbrales de datos. Logros. Retos personales con comodines. Escaleras de progresión completas. Subida de nivel animada. Informe mensual exportable. Anotaciones sobre las gráficas.

### Fase 3 — la que justifica un backend

Sincronización entre dispositivos y capa social: ligas, duelos, retos compartidos. **Aquí entra Spring Boot + PostgreSQL**, con unos pocos endpoints de sincronización y autenticación. No antes: hasta que exista una función que de verdad lo exija, un servidor solo añade coste y superficie de fallo.

Como relato de portfolio esta frontera es limpia: *local-first primero, backend cuando una función lo obliga.*

---

## 10. Descartado, y por qué

Documentar lo que se decidió no hacer suele valer más que la lista de funciones.

| Descartado | Motivo |
|---|---|
| Contar calorías y macros | Etiquetas con ±20 % de tolerancia, bases de datos colaborativas sucias, y subestimación del 20-50 % en autorregistro. Sumar cifras inventadas no da una cifra buena. Y es la causa número uno de abandono |
| Base de datos de alimentos | Gigas en local o una API con red. Con 15 recetas propias se cubre casi todo lo que se come |
| Estimar calorías por foto con IA | Necesita servidor, y el error es mayor que el de la estimación humana |
| Nota de "calidad" de la comida | Número inventado que moraliza sobre la comida, en la misma app que dedica una pantalla entera a no hacerlo |
| % de grasa por bioimpedancia | ±5-8 % según hidratación. Invita a obsesionarse con ruido |
| Racha de "días limpios" | Romperla castiga indirectamente el registro honesto. Sustituida por presupuesto semanal |
| Restar XP por confesar un desliz | Hace que esconder información sea la jugada óptima |
| Pulso en reposo y sueño automático | Sin wearable no hay fuente. El sueño autoinformado además correlaciona mejor con el ánimo |
| Zonas de pulso en el cardio | Sin pulsómetro no se pueden verificar. Sustituidas por duración y esfuerzo percibido |
| Báscula Bluetooth | No se tiene. Mantenerlo en la interfaz es prometer lo que no hay |
| Liga y duelos con amigos | Requieren servidor, cuentas e identidad. Aplazado a fase 3 |
| Pasos de receta, fotos y temporizadores | Eso es un recetario, otra app. Un campo de notas cubre casi todo el valor |
| Importar recetas de internet | Red, parseo de HTML y falla la mitad de las veces |
| Login social (Apple/Google) | No hay cuentas ni servidor. Prometía algo que la app no cumple |
| Ocultar pestañas según los bloques activos | 32 combinaciones de navegación que probar, y el usuario que activa un bloque después no encuentra dónde apareció |
| Nivel de actividad en el onboarding | Solo servía para estimar el gasto calórico, que ya no se calcula |

---

## Anexo · Aviso

Los rangos de peso, los ritmos de pérdida y las referencias de cintura de este documento son valores de referencia general, no consejo médico personalizado. Antes de fijar objetivos agresivos de peso conviene contrastarlos con un profesional sanitario, especialmente si hay alguna condición médica de por medio.
