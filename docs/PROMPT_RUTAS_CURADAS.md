# PROMPT — Rutas curadas de Roma (versión probada con el barrido)

> **Por qué:** los días curados funcionaban en 2 días, pero a partir del tercero fallaban: horas muertas, 4 basílicas seguidas, días repetidos o vacíos. He rehecho los días que fallaban y los he pasado por el motor v3 de verdad (copia local con los parches de la Parte B).
> **Cómo lo he comprobado:** un barrido de **768 viajes**: 2, 3, 4 y 5 días, completo y tranquilo, con y sin Free Tour, sin experiencias o con Arte, Naturaleza o Barrios, los 12 meses del año y cada viaje empezando en un día distinto de la semana. Se pasó del 67 % de viajes limpios al 94 % (ni un hueco de más de 90 min en completo o de 120 en tranquilo, ningún imprescindible perdido, ningún mirador de noche fuera de invierno).
> **Archivos:**
> - `docs/roma_rutas_curadas.json`: los días nuevos o cambiados, la noche `panteon`, `fuentes` con `maximo_tranquilo` y la tabla `curated_routes`.
> - `docs/sweep.mjs`: el barrido. Muévelo a `scripts/destino/`.
> **Cómo:** en orden, commit por parte y **sin push**. Si algo no está claro, apúntalo como pregunta y sigue.
> **Reglas de siempre:** todo general, reglas nuevas en INVARIANTES, textos de tú a tú y ningún precio en ningún sitio.
> **El prompt de bloques (`PROMPT_AJUSTES_BLOQUES.md`) ya no hace falta.**

---

## Parte A — Importar los días

Sustituye en `roma.json` los días con el mismo id (D1, D2, D3, D1-FT, D4, D5, D6 y D7) y añade D4M y D5C, `curated_routes` y las noches `panteon` y `fuentes`.

**Qué días lleva cada viaje** (días de ruta, sin contar el de vuelta):

| Días | Sin Free Tour | Con Free Tour |
|---|---|---|
| 2 | D1 · D2 | D3 · D1-FT |
| 3 | D1 · D2 · D4M (D4 si hay Galería por pool o Arte) | D3 · D1-FT · D5C (D4 si hay Galería) |
| 4 | D1 · D2 · **excursión** · D4 | D3 · D1-FT · **excursión** · D4 |
| 5 | D1 · D2 · D4 · excursión · D5 | D3 · D1-FT · D4 · excursión · D5 |
| 6-7 | lo de 5 días + D6 (Ostia por la mañana) + D7 (Tívoli por la mañana) | igual |

- **4 días lleva excursión el día 3** (decisión del usuario): el viajero decide luego si la quiere o regenera el día. El día 4 es D4 con la Galería, que es el museo de pago que toca desde 4 días.
- **6 y 7 días:** el usuario no quiere curarlos más. Si ves que el motor rellena mejor escogiendo las franjas con menos lugares repetidos, puedes hacerlo así.

**Qué cambia en cada día:**
- **D1:** el Altar de la Patria pasa a visita, por dentro y la terraza. Es un monumento, nunca va "de paso". En completo va de 13:00 a 14:00, justo después del Campidoglio, y se come en el Ghetto a las 14:00 (Parte B.5). En tranquilo va después de comer, 30 min, y los sábados a última hora. El tranquilo acaba con aperitivo en Campo de' Fiori.
- **D2:**
  - **Miércoles (audiencia papal):** los Museos a las 08:00, un paseo por el Borgo y comida a las 12:00. La Plaza y la Basílica van a partir de las 13:15.
  - **Invierno:** se sube primero al Janículo solo si el sol se pone antes de las 18:20 (`atardecer_antes_de`). Santa Maria in Trastevere va antes de callejear.
  - **Tranquilo en invierno:** sin Janículo; Trastevere de noche hasta la cena.
- **D3:** en completo, la Fontana de Trevi a las 08:00 sin gente y un desayuno romano antes del Free Tour. La nota dice por qué.
- **D1-FT:** el Campidoglio y el Altar al salir del Foro, comida en el Ghetto, y por la tarde Trastevere hasta el Janículo.
- **D4:**
  - **La Galería:** va desde 4 días.
  - **El parque:** son 30 min, cruzándolo hasta el Pincio, y se estira si sobra tiempo.
  - **Invierno:** Santa Maria del Popolo por la tarde (16:00-18:00), antes del Pincio.
  - **Domingo:** Santa Maria del Popolo, antes del parque.
  - **Con Free Tour:** el desayuno a las 09:00; luego Bernini en Santa Maria della Vittoria, el Popolo, la Galería (a las 13:00 en invierno y a las 15:00 el resto del año) y el Pincio.
- **D4M (nuevo, 3 días sin Galería):** por la mañana, Trevi sin gente y el Tridente hasta el Pincio de día. Por la tarde, el parque, Bernini, Santa María la Mayor, el Moisés, Monti, los Foros al atardecer y el Coliseo iluminado.
- **D5:** el Aventino y Testaccio por la mañana; por la tarde, bus 118 a las catacumbas y la Via Appia, y el atardecer en el Campidoglio. En invierno, el Campidoglio de noche y la terraza del Altar. La variante `pool_san_clemente` se aplica si hay San Clemente en el pool y el viaje no lleva D6.
- **D5C (nuevo, 3 días con Free Tour):** el Aventino y Testaccio por la mañana; por la tarde, las basílicas y Monti; de noche, el Coliseo.
- **D6:** Ostia por la mañana; basílicas, Monti y los Foros por la tarde.
- **D7:** Tívoli por la mañana; Navona, Campo de' Fiori, el Castillo y el atardecer sobre San Pedro desde el puente.

---

## Parte B — Cambios en el motor (generales)

Los he probado todos en la copia local; el barrido de la Parte D sale con ellos.

1. **Tabla de rutas (`curated_routes.por_dias_ciudad`)**, antes de "Lo del pool que activa un día…" en `planCuratedTrip`:
   ```js
   const routeTable = destData.curated_routes?.por_dias_ciudad
   if (routeTable) {
     const keys = Object.keys(routeTable).map(Number).sort((a, b) => a - b)
     const key = keys.filter((k) => k <= cityDays.length).at(-1)
     const row = key != null ? routeTable[String(key)]?.[hasFreeTour ? 'con_free_tour' : 'sin_free_tour'] : null
     if (row) { list.length = 0; for (const item of row) list.push(typeof item === 'string' ? item : sinGaleria && contentDays < 4 ? item.sin_galeria : item.con_galeria) }
   }
   ```
2. **Fallo real: la cena con atardeceres de 20:00 a 20:14.** Con esos atardeceres (por ejemplo, el 13 de agosto) la cena no pasaba a las 21:00. No cabía antes de las 20:30 y **el motor tiraba la tarde entera del Vaticano y Trastevere**. Arreglo: `LATE_SUNSET_MINUTES` pasa de 20:15 a **20:00**. Para comprobarlo: 2 días, completo, sin experiencias, desde el 2027-08-12, día 2.
3. **Invierno para los días curados:** `WINTER_SUNSET_BEFORE` pasa de 18:00 a **18:30**. Así, a mediados de marzo y en la segunda quincena de octubre ya se usan las variantes de invierno. Además, `variantes.invierno.atardecer_antes_de` permite que una variante de invierno solo se aplique si el sol se pone antes de esa hora. D2 lo usa con 18:20. `tranquilo_invierno` sigue la misma condición.
4. **Noches en tranquilo:** `const max = tranquilo ? walk.maximo_tranquilo ?? 1 : walk.maximo ?? 2`. "La Roma de las fuentes" lleva `maximo_tranquilo: 2` (Trevi y la Plaza de España están a 10 min). Antes, en 2 días tranquilo, la Plaza de España no salía nunca.
5. **La comida flexible, solo para un imprescindible** (decisión del usuario):
   - En orden curado, una visita de **nivel 1** puede alargar la mañana hasta las 14:00. En `scheduleDay`, el límite de una visita nueva antes de comer es `lunchClose + 30` si `place.level === 1`.
   - Si la comida empieza a las 14:00 o más tarde, dura 1 h más el paseo: el bloque es `mealMinutes + 15`, no 90.
   - Para nada más: no se usa para meter paradas de relleno.
6. **Fallo de las paradas repetidas en la tarde:** "la tarde no repite lo que ya va por la mañana" compara los nombres **antes** de aplicar `solo`. Si una parada de la mañana no va ese día, la de la tarde con el mismo nombre también se cae. Hay que comparar con la mañana ya filtrada. No lo he tocado.
7. **`traslado_min`:** el tramo en bus (comida → catacumbas) sale con 0 min en la hora de llegada. Los 25 min del bus 118 tienen que contar.

---

## Parte B2 — Cómo se enseñan las horas y lo "de paso" (decisión del usuario)

1. **Horas redondas.** Todas las horas que se enseñan van en **:00, :15, :30 o :45**.
   - El motor calcula por dentro con los minutos exactos y enseña el cuarto de hora más cercano, ajustando el tiempo de visita para que cuadre.
   - **No redondees siempre hacia arriba parada a parada:** lo he probado y el día acaba con más de una hora de retraso.
2. **"De paso" se enseña como "Por el camino: …"**, entre dos paradas, con su foto pequeña y su ficha al tocar. Solo para calles, plazas, fuentes y ruinas que se ven desde la acera.
3. **Un monumento nunca va "por el camino".**
   - Si ese día no se entra (el Castillo desde el puente), sale como **"Por fuera"** y dice por qué: "hoy no toca entrar", "cerrado por…", "a esta hora ya ha cerrado".
   - He comprobado que ningún día curado pone el Altar de paso. La única excepción es la variante de Navidad, y ahí hay que confirmar si el Vittoriano abre el 25 de diciembre y el 1 de enero.

---

## Parte B3 — Dos reglas nuevas (decisión del usuario, 2026-09-27)

1. **Invierno: paseo y aperitivo de hasta 2 h después del atardecer.** Si el sol se pone antes de las 18:00, el rato entre la última parada y la cena puede llegar a 120 min sin ser rojo. Sale con nombre y sugerencias abiertas a esa hora, por ejemplo: "Paseo por Via del Corso y Via Condotti iluminadas y aperitivo". En el semáforo y en `sweep.mjs`, eso es amarillo como mucho. Más de 120 min sigue siendo rojo.
2. **El transporte público está permitido.** Si la ruta sigue siendo natural y la que haría un local (el bus 118 a la Via Appia, el metro B a San Clemente, el 115 al Janículo), no es un fallo. Solo cuenta como fallo un salto de más de 25 min andando sin su aviso de transporte. Regla general para todos los destinos.

---

## Parte C — Lo que queda (no lo arregles sin preguntar)

1. **Invierno, aperitivo de más de 2 h:** en unos pocos días de noviembre a enero (sobre todo D4) queda entre 2 h y 2 h 30. Si lo ves, alarga Santa Maria del Popolo o la bajada por la escalinata, nunca con relleno.
2. **Tranquilo con Free Tour, D3:** sale el aviso "la comida es más corta para ver la Basílica" (192 casos, todos iguales). Es correcto, pero quizá sea mejor 1 h de comida sin aviso ese día. Pregúntale.
3. **D4 en domingo de octubre:** el parque no cabe entre la Galería y Santa Maria del Popolo. Se cruza igual andando.
4. **Ferragosto (14-15 de agosto):** los Museos Vaticanos cierran. Un viaje de 2 días en esas fechas no los ve y lo avisa, que es correcto.

---

## Parte D — Comprobación

1. `node scripts/destino/sweep.mjs dias=2,3,4,5` (acepta `ritmo=`, `ft=`, `exp=` y `meses=`). Para ir rápido, lánzalo por días y ritmos en paralelo. Tiene que salir lo mismo que a mí: **723 de 768 viajes (94 %) sin ningún aviso**. De los 45 restantes, 43 son miradores que en noviembre o marzo llegan ya de noche (salen como "vistas de Roma iluminada") y 2 son viajes del 14-15 de agosto con el Vaticano cerrado, que es correcto. No cuento como fallo el aperitivo de invierno (pendiente, Parte C.1), el aviso de comida corta (C.2) ni lugares de nivel 2-3 que un día no caben (el parque en domingo de octubre, C.3).
2. Genera `docs/REVISION_12_RUTAS.md` con los 12 viajes de siempre (2 a 7 días, con y sin Free Tour).
3. Vuelve a pasar `revisionV2.mjs` y dime qué cambia frente a la V2 actual.
4. Commit y **sin push**: lo reviso primero.
