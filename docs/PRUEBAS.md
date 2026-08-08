# Guion de pruebas

Lo que las pruebas automáticas **no** pueden comprobar: que la app se use bien en
un móvil de verdad. Esto son unos veinte minutos, en orden, y cubre todos los
caminos importantes.

Antes de empezar: **exporta una copia** desde Ajustes si ya tienes datos que no
quieres perder. El paso 1 los borra.

---

## 1 · Onboarding

1. Inicio → abajo del todo → **Borrar todo y empezar de cero**.
2. Escribe tu nombre. El botón *Empezar* debe seguir apagado con una sola letra.
3. Peso, altura, edad y sexo. Al poner la altura debe aparecer tu **rango de peso
   saludable**; al poner la cintura, el ratio cintura/altura.
4. Bloques: quita los tres marcados. *Continuar* debe bloquearse.
5. Objetivo: pon un peso **por debajo** de tu rango sano. Debe salir un aviso
   rojo y el botón bloquearse. Vuelve a uno válido y comprueba la fecha estimada.
6. Permisos → *Entrar a YouFitness*.

**Esperado:** Inicio en estado día 1, con un solo camino: «Empieza por pesarte».

---

## 2 · Peso y XP

1. Registra tu peso. Debe decir **+25 XP** y la barra de nivel moverse.
2. Vuelve a Peso y **corrígelo**. Debe decir «el XP de hoy ya estaba concedido».
   → *Si vuelve a sumar 25, es un fallo.*
3. Mira la tendencia: con menos de 7 pesajes tiene que salir la caja dorada de
   «faltan N pesajes», nunca una media inventada.
4. Añade la cintura y comprueba el ratio.

---

## 3 · Comidas

1. Botón central → Comida. Escribe algo, marca raciones y guarda. **+20 XP**.
2. Repite con desayuno y cena. El anillo de comidas de Inicio debe ir a 3/3.
3. Toca una comida del diario → corrígela. En el diario debe aparecer
   **«editado»**, y el XP **no** debe cambiar.
4. Guarda una comida **como receta**, y luego regístrala desde Recetas de un
   toque.
5. Anota un **desliz**. Debe dar **+15 XP** igualmente y aparecer en rosa dentro
   del mismo timeline.
6. Icono 📅 → elige un día pasado → añade una comida. Debe guardarse **en esa
   fecha**, no en hoy.

---

## 4 · Entreno

1. Entreno → *Ejercicios* → crea uno de **peso externo** (ej. Press banca) y otro
   de **peso corporal** (ej. Dominada, factor 1,00).
2. Crea una rutina con los dos y **marca los días** que tocan.
3. Empieza la sesión. Anota series de cada uno. En la dominada debe verse el
   aviso de cómo se calcula el volumen con tu peso corporal.
4. Termina. En el resumen: desglose de XP, y **sin récords** (es tu primera vez).
5. Pon el esfuerzo percibido y guarda. → *El XP total no debe cambiar al
   guardarlo.*
6. Repite otro día con **más peso** en la banca. Ahora sí debe salir **récord** y
   +120 XP.
7. Progresión: elige la banca. Con dos sesiones debe dibujarse la gráfica y
   aparecer el 1RM estimado. En la dominada **no** debe haber 1RM.

---

## 5 · Check-in

1. Botón central → Check-in. Rellena ánimo, energía, estrés y sueño.
2. Cierra el día: **+30 XP**.
3. Vuelve a entrar y cambia algo. Debe decir que el XP ya estaba concedido.
4. Con tres noches apuntadas debe empezar a decirte tu **hora habitual**.

---

## 6 · Historial y semáforo

1. Pestaña **Progreso**. Prueba los cuatro niveles: día, mes, año y todo.
2. Con el filtro en **Ambos**, un día con comida limpia y entreno hecho debe ser
   **verde**; con un desliz, **amarillo**; con desliz y entreno saltado, **rojo**.
3. Un día de descanso (sin rutina ese día) **no** debe salir amarillo.
4. Un día en blanco **no** debe salir verde: debe quedar neutro.
5. En Inicio, toca un día de la tira de racha: debe abrir ese día del historial.

---

## 7 · Copias de seguridad

Este es el paso que más importa.

1. Perfil (avatar de Inicio) → ⚙️ → **Descargar copia**. Comprueba que el fichero
   se guarda y ábrelo: debe ser JSON legible.
2. **Borrar todo y empezar de cero.**
3. Ajustes → **Restaurar desde fichero** → elige la copia.
4. Cierra y reabre la app.

**Esperado:** todo vuelve — perfil, pesajes, comidas, entrenos y XP.

> Un backup que no has restaurado nunca no es un backup, es una suposición.
> Haz esta prueba **una vez**, ahora, y no tendrás que volver a dudar.

---

## 8 · Como app instalada

1. Instálala desde Chrome (menú → *Instalar aplicación*).
2. Ábrela desde el icono: sin barra del navegador.
3. Comprueba los márgenes arriba y abajo: el contenido no debe pegarse al reloj
   ni a la barra de gestos.
4. Ponla en modo avión y ábrela. Debe funcionar igual: es local-first.

---

## Qué NO va a funcionar, y es esperado

- Los **pasos** salen apagados y con datos de ejemplo.
- Los **recordatorios** de Ajustes están desactivados.
- **Logros, retos y objetivos** aparecen como fase 2.

Los tres necesitan build nativa o están fuera del alcance actual. Ver
[`DESPLIEGUE.md`](DESPLIEGUE.md).

---

## Si encuentras algo raro

Anota **qué hiciste, qué esperabas y qué pasó**. Con eso se reproduce; con «no
va» no.
