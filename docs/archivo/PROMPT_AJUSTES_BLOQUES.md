# PROMPT — Ajustes a los bloques (respuestas a tus preguntas + lo que ha salido en la revisión)

> **Archivos:** `docs/roma_mananas_tardes_tipo.json` (actualizado: vuelve a importarlo) y `docs/roma_restaurantes_prati.json` (nuevo).
> **Cómo:** en orden, commit al acabar cada parte, **sin push** hasta que lo revise. Si algo no está claro, apúntalo como pregunta y sigue.
> **Reglas de siempre:** todo general (nada solo para Roma), reglas nuevas en INVARIANTES, textos de tú a tú, **ningún precio en ningún sitio** (ni en Tickets) hasta que estén las APIs.

---

## Parte A — Tus preguntas

1. **vaticano_trastevere (Castillo → Janículo 32 min).** El bloque estaba mal ordenado; lo he rehecho en el JSON:
   Conciliazione (de paso) → Borgo Pio (de paso) → Puente Sant'Angelo (Castillo por fuera) → Trastevere (ancla) → Santa Maria in Trastevere → Tempietto → Acqua Paola → Janículo (atardecer) → cena en Trastevere.
   - Del puente a Trastevere son ~20 min junto al Tíber: es un paseo, no un salto. Excepción al máximo de 20 min: la parada lleva `paseo: true` (explicado en `_formato`) y `validar.mjs` no la marca en rojo.
   - Rol nuevo `antes_del_atardecer`: Trastevere y Santa Maria van antes de subir. En invierno, si no da tiempo, se saltan y se sube directo al Janículo.
2. **Mañanas de Caracalla-Aventino y de Trastevere sin tarde.** Resuelto en el JSON:
   - `centro_barroco` y `campidoglio_ghetto` son ahora `reversible: true` (se pueden hacer al revés si se entra por el otro extremo) y encajan también después de `aventino` y `trastevere`.
   - `trastevere_a_fondo` encaja también después de `aventino`.
   - `monti_basilicas` solo encaja después de `roma_antigua` (se quita Santa Maria della Vittoria, que quedaba lejos).
3. **Restaurantes en Testaccio y Vaticano/Borgo.**
   - Testaccio **sí tiene** en `roma.json`: Felice a Testaccio, Da Remo, Mordi e Vai y Osteria Fernanda. Si el motor no los ve, el fallo está en el mapeo de `meal_zones` (el barrio del bloque no coincide con el del restaurante). Revísalo y corrígelo en general: que el barrio del bloque y el de los restaurantes usen el mismo nombre, y que `validar.mjs` avise si un `comida`/`cena` de un bloque no tiene ningún restaurante.
   - Prati/Vaticano: importa `docs/roma_restaurantes_prati.json` (Dal Toscano, L'Arcangelo, Osteria dell'Angelo) y cambia Il Sorpasso a `meal: "ambos"`. Revisa los campos `_verificar` que trae.
4. **Castillo de Sant'Angelo por dentro el día del Vaticano:** gana la regla. Una visita grande al día: el Castillo va **por fuera** (el puente), salvo que esté en el pool.
5. **trastevere_a_fondo no se elige si ya va vaticano_trastevere:** correcto, déjalo así.
6. **El repartidor antiguo:** no lo arregles. Márcalo como legacy, quita sus tests del verde obligatorio y se retira cuando todos los destinos tengan bloques. Los 4 fallos de `verifyPlanTrip` que vengan de ahí, anótalos y sigue.

---

## Parte B — Lo que ha salido en la revisión de los 16

1. **Nunca se reordena un bloque para rellenar tiempo.** El orden del bloque es sagrado. Si sobra tiempo antes del atardecer, va un "Tiempo libre" o "Aperitivo y paseo" justo antes del mirador; no se mueven paradas.
   - Visto en `vaticano_trastevere` (Acqua Paola antes que Trastevere) y en `villa_borghese_pincio` (Popolo antes que el Pincio y el parque estirado a 90 min).
   - Tranquilo tampoco estira: el parque dura lo que dice el bloque.
2. **Lo que sobra de la mañana no arrastra la tarde.** Si una parada de la mañana no cabe, se salta o va a otro día; la tarde empieza donde dice su bloque. Nunca una tarde que empiece a más de 20 min de donde acaba la mañana (salvo tras la comida en su barrio). Visto: `monti_basilicas` después de `borghese` (38 min andando).
3. **La experiencia elegida pesa más al elegir la tarde.** En los viajes 8 y 11 (Naturaleza) sale `campidoglio_ghetto` en vez de `aventino_testaccio`. Al puntuar tardes, cada coincidencia con una experiencia elegida vale más que la cercanía de un imprescindible suelto. El Altar puede ir **de paso** en otro bloque; no debe arrastrar la elección.
4. **El orden del pool manda también en los días.** Lo primero del pool va en los primeros días. Visto: viaje 13, la Borghese la primera del pool y sale el día 5.
5. **Los imprescindibles por fuera nunca se quedan fuera.** Plaza de España y el Altar de la Patria (y cualquier imprescindible que se ve desde la calle): si ningún bloque del viaje los tiene, entran **de paso** (15 min) en el bloque que pase más cerca. Visto: viaje 5.
6. **1 día con Arte (viaje 2) y tardes libres en 1 día (viaje 3).** `short_trips` sigue, pero:
   - con Arte, en lugar de Capitolinos: arte gratis (Caravaggio en San Luigi dei Francesi) + Piazza del Popolo + Santa Maria del Popolo + Pincio al atardecer;
   - la tarde libre de 1 día se rellena con ese mismo tramo (Popolo → Santa Maria del Popolo → Pincio al atardecer) si no está ya en el día.
7. **"Aperitivo y paseo por {barrio}".** El tiempo libre de 90 min o menos antes de cenar, en un barrio con vida, se llama así (no "Tarde libre (90 min)"). Con 2-3 sugerencias abiertas de camino.
8. **Semáforo:** un "medio día sin tipo" sigue en amarillo; un hueco de más de 90 min en mitad del viaje, en rojo (ya lo tienes). Añade en rojo: bloque reordenado respecto al JSON.

---

## Parte C — Prueba concreta

- **2 días, tranquilo, Free Tour, diciembre (15-dic y fechas 16-17 dic).** Comprueba que entra la Basílica de San Pedro con el Vaticano por la tarde (`vaticano_por_la_tarde`). Si no cabe, se acorta la comida (mínimo 60 min), nunca se quita la joya.
- Miércoles con fechas: la Basílica cierra hasta las 12:30; que el bloque del Vaticano no la ponga por la mañana ese día.

---

## Parte D — Comprobación

1. Vuelve a generar `docs/REVISION_RUTAS_ROMA_16.md` con los mismos 16 viajes y el resumen de bloques arriba.
2. Añade al resumen: bloques reordenados (tiene que ser 0), medios días sin tipo, huecos rojos, imprescindibles por fuera que faltan.
3. Semáforo por meses en verde.
4. Commit y **sin push**: lo reviso primero.
