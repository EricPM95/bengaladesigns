# PROMPT — Estaciones: horarios por fecha, sol y noche, disponibilidad

> **Cuándo:** después del Paso 7 de PROMPT_REVISION_RUTAS_ROMA.md, con el push hecho y la app probada.
> **Cómo:** una parte cada vez, commit al acabar cada parte. **No hagas push** hasta que te lo diga.
> **Reglas de siempre:**
> - Toda regla es general, nunca solo para Roma. Añade a INVARIANTES_MOTOR.md cada regla nueva.
> - Ningún precio (ni "gratis") fuera de la pestaña Tickets.
> - Textos en tono cercano, de tú a tú.
> - Al motor solo entran **dos datos de temporada**: horarios y disponibilidad. Más la hora de la puesta de sol, que no es un dato del JSON: se calcula.

---

## Qué cambia y por qué

Hoy el viajero elige una temporada y el motor usa el horario de esa temporada. Se queda corto: el otoño va de septiembre (Coliseo hasta las 19:15, puesta de sol ~19:30) a noviembre (Coliseo hasta las 16:30, puesta de sol ~16:45). Para no fallar nunca se cogió el horario más corto de cada temporada, y quien viaja en abril, mayo, septiembre u octubre recibe una ruta peor de lo que podría ser.

A partir de ahora **el motor siempre conoce la fecha o, como mínimo, el mes**.

---

## Parte 1 — Lo que recibe el motor

1. El motor recibe **una de estas dos cosas**:
   - **Fechas exactas** (inicio y fin), o
   - **número de días + mes** (0-11).
2. Ya no existe la entrada "solo temporada". La temporada se **deduce** del mes y solo se usa para mostrarla y como reserva (`by_season`) en destinos que aún no tengan horarios por periodo.
3. **Día de referencia:**
   - con fechas, cada día de la ruta usa su fecha real (y su día de la semana);
   - con solo el mes, todos los días usan **el día 15 de ese mes** para horarios y puesta de sol. Sin día de la semana: se sigue aplicando lo que ya hacemos (horario de laborables + aviso de excepciones en la parada).
4. **Formulario actual: cambio mínimo.** Cambia los botones de temporada por **12 botones de mes**, agrupados en 4 filas por temporada:
   - Invierno: Dic · Ene · Feb
   - Primavera: Mar · Abr · May
   - Verano: Jun · Jul · Ago
   - Otoño: Sep · Oct · Nov

   Si hay fechas, el mes sale de las fechas y no se pregunta. El mes es obligatorio cuando no hay fechas.
5. **Guardado:** donde hoy se guarda la temporada del viaje, pasa a guardarse el mes. Si hace falta migración de Supabase, pásame el SQL y la aplico yo. Los viajes antiguos que solo tengan temporada: se les asigna el mes central (primavera → abril, verano → julio, otoño → octubre, invierno → enero).

**Formulario final (referencia, NO implementar todavía):** el rediseño irá con el diseño de Claude Design. Lo que afecta a esta parte:
- Primero, calendario ("¿Cuándo llegas a {destino}?").
- Botón "Aún no sé mis fechas" → hoja con "¿Cuántos días?" y "¿Qué mes?" (meses en filas por temporada; el mes es obligatorio).
- La temporada no se pregunta: se deduce y cambia el fondo de la pantalla.

Deja el contrato del motor preparado para ese formulario; no construyas la pantalla nueva.

---

## Parte 2 — Horarios por periodo (`by_period`)

1. **Campo nuevo, opcional**, en cada lugar: `by_period`, una lista de periodos que cubre el año entero:
   ```json
   "by_period": [
     { "from": "10-25", "to": "02-29", "windows": ["08:30-16:30"], "last_entry": "15:30" },
     { "from": "03-29", "to": "09-30", "windows": ["08:30-19:15"], "last_entry": "18:15" }
   ]
   ```
   - `from`/`to` en formato MM-DD, ambos incluidos. Un periodo puede cruzar el año (10-25 → 02-29).
   - `last_entry` puede ser null.
2. **Orden de prioridad para saber el horario de un lugar un día concreto:**
   1. cierres (`closed_on` por día de la semana, y `closed_dates` MM-DD, que es nuevo y solo se aplica con fechas);
   2. `by_period` (con la fecha real o el día 15 del mes);
   3. `by_season` (reserva, solo si no hay `by_period`);
   4. `windows` (reserva final).

   `by_day` (horario distinto según el día de la semana) se sigue aplicando igual que ahora cuando hay fechas.
3. **Palabra `sunset` en `windows`:** `"07:00-sunset"` significa "abre a las 07:00 y cierra al anochecer". El motor la cambia por la hora de la puesta de sol de ese día (Parte 3). Sirve para parques que cierran al anochecer, en cualquier destino.
4. **Importa `roma_horarios_por_periodo.json`** (te lo paso con este prompt):
   - añade `by_period` (y `closed_dates` donde venga) a los lugares que trae;
   - no borres su `by_season`, se queda de reserva;
   - Santa Maria in Trastevere viene sin `by_period` (no se pudo verificar): no la toques.
   - Los campos `confianza`, `fuente` y `_nota` guárdalos como en la auditoría anterior, para que se vean en el export de horarios.
5. **Validador (`validar.mjs`):**
   - avisa si los periodos de un lugar dejan días sin cubrir o se solapan (debe cubrir 366 días, contando el 29 de febrero);
   - avisa si la fecha de auditoría es de un año anterior al del viaje: los cambios de finales de marzo y octubre siguen el cambio de hora y hay que revisarlos cada año.

---

## Parte 3 — El sol decide qué es tarde y qué es noche

1. **Puesta de sol:** ya pedida en el Paso 7 (fórmula astronómica con coordenadas y zona horaria del destino, sin API). Aquí solo cambia una cosa: con solo el mes, se calcula para **el día 15**. `sunset_by_season` queda como reserva solo si un destino no tiene coordenadas.
2. **Empieza la noche 30 minutos después de la puesta de sol.** A partir de esa hora, una experiencia nocturna ya se ve de noche.
3. **Nocturnas antes o después de cenar:** si la noche empieza antes de la cena (invierno), la nocturna puede ir **antes de cenar**, de camino al barrio de la cena. Si empieza después (verano), va después de cenar, como ahora. No es una regla de "invierno": sale sola de la hora de la puesta de sol.
4. **Lugares que cierran antes de que sea de noche no pueden ser nocturnas ese día.** Ejemplo: el Jardín de los Naranjos cierra a las 18:00 de octubre a febrero; esos meses no puede salir como nocturna. Lo mismo con cualquier lugar cuyo horario termine en `sunset`.
5. **Miradores al atardecer:** la regla ya pedida en el Paso 7 (llegada entre 60 min antes y 15 min después, lo ideal de 45 a 30 min antes, y la parada dura como mínimo hasta la puesta de sol). No la cambies; solo comprueba que usa la puesta de sol de esta parte.
6. La cena **no cambia**: sigue en su franja de siempre.

---

## Parte 4 — Disponibilidad por fechas (`available`)

1. **Campo nuevo, opcional**, en lugares, experiencias, nocturnas y excursiones:
   ```json
   "available": { "from": "12-01", "to": "01-06" }
   ```
   Fuera de esa ventana, no entra en la ruta.
2. **Con fechas:** se aplica directamente, sin preguntar.
3. **Con solo el mes:**
   - el mes cae entero dentro de la ventana → entra;
   - el mes cae entero fuera → no entra, y en el formulario la experiencia **no se ofrece** (ej. "Mercadillos navideños" no aparece si viajas en junio);
   - **mes frontera** (solo una parte del mes está dentro): si el viajero eligió esa experiencia, se pregunta: *"En {destino}, los mercadillos navideños suelen estar del {inicio} al {fin}. ¿Viajas en esas fechas?"* Sí → entra. No → se quita de su selección y se le avisa en una línea.
4. **Lugares de temporada que el viajero no eligió:** no entran solos en un mes frontera. Siguen en "Añadir parada" con una nota de cuándo abren.
5. **No inventes fechas de ningún evento.** Deja el campo preparado y funcionando; los datos de temporada de Roma (mercadillo de Navidad, etc.) los curo yo aparte y te los paso.

---

## Parte 5 — Semáforo por meses

1. Añade el mes al semáforo. Pásalo con 4 meses de referencia: **15 de enero, 15 de abril, 15 de julio y 15 de octubre**.
2. Y con fechas en los dos cambios de horario, para ver que el cambio se nota: **28 y 30 de marzo**, **24 y 26 de octubre**.
3. Pásame el resumen y, sobre todo, **qué rutas cambian entre meses** (ej. Coliseo por dentro en 1 día con Free Tour: enero sí/no, abril sí/no…). Esperado: en abril y octubre las rutas deberían mejorar respecto a hoy.

---

## Parte 6 — Kit de nuevo destino

Añade al kit lo necesario para que cualquier destino nuevo nazca con esto:
- plantilla de auditoría de horarios con `by_period`, `closed_dates`, `confianza` y `fuente`;
- la puesta de sol sale de las coordenadas del destino (no hay que curar nada);
- `available` en la plantilla de lugares y experiencias.

---

## Fuera de este prompt

- Vuelos (van después y se apoyan en esto).
- Datos de temporada de Roma (mercadillos, eventos): los curo yo.
- Rediseño del formulario (pantallas nuevas, "Compañía", nombres de experiencias).

## Al acabar cada parte

- Commit.
- Resumen corto: qué ha cambiado y un ejemplo de ruta donde se note.
- Si hay migraciones de Supabase pendientes, el SQL para aplicarlas yo.
