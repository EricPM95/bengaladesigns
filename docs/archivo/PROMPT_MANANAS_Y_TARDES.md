# PROMPT — Mañanas y tardes tipo: rutas que haría un local

> **Por qué:** en la revisión de los 16 viajes, lo que falla casi siempre es lo que el motor improvisa (tardes con cinco rellenos, horas muertas, idas y vueltas). Lo que funciona es lo curado (bloques de 1 día, la tarde del Vaticano). A partir de ahora **todos los destinos se curan en bloques de medio día**: mañanas y tardes tipo, como las haría alguien que vive en la ciudad. El motor elige, ordena y calcula; solo improvisa si ningún bloque encaja.
> **Archivo:** `docs/roma_mananas_tardes_tipo.json` (8 mañanas + 11 tardes de Roma, redundancias y principios). Sustituye a `docs/roma_tardes_tipo.json` y a `docs/PROMPT_TARDES_TIPO.md`, que ya no se usan.
> **Antes:** termina las 12 correcciones que ya te pasé. Esto va después.
> **Cómo:** partes en orden, commit al acabar cada una, **sin push** hasta que lo revise. Si algo no está claro, apúntalo como pregunta y sigue.
> **Reglas de siempre:** todo general (nada solo para Roma), reglas nuevas en INVARIANTES, sin precios fuera de Tickets, textos de tú a tú.

---

## Parte A — Cómo planifica un local (reglas generales)

Están también en el JSON (`principios_local`):

1. **Una visita grande al día.** Como máximo una visita de más de 90 min por día. Otra por dentro, solo si es corta (45 min o menos: una iglesia, el Panteón). Excepción: el pool del viajero.
2. **Viajes de 2-3 días: un museo de pago es suficiente (`museos_de_pago`).** Aparte de joyas e imprescindibles (Coliseo y Foro, Panteón, Vaticanos…), en viajes de hasta 3 días no entra ningún otro museo de pago salvo que el viajero lo ponga en su pool. Con 4 días, uno más; con 5-6, dos; con 7 o más, tres. En viajes cortos, "Arte y Museos" se cumple con arte gratis (Caravaggio en San Luigi y Santa Maria del Popolo, Bernini en Santa Maria della Vittoria, el Moisés en San Pietro in Vincoli). **Esto corrige la regla 2 de las 12:** la Galería Borghese no tiene que salir en viajes de 3 días; sí en viajes largos con Arte.
3. **Museos parecidos (`redundancias`).** Si el principal está en el viaje, el otro no entra, salvo que esté en el pool o el viaje sea de 5 días o más con la experiencia que lo pide. En Roma: con los Museos Vaticanos en el viaje, los Capitolinos no entran; el Campidoglio es parada propia (15-20 min: la plaza de Miguel Ángel y, por detrás, el Foro desde otra perspectiva) y de ahí se sube directo al Altar.
4. **Las calles no son paradas.** Via Condotti, Via del Corso y Via della Conciliazione salen como "Pasas por…", sin parada numerada. (Excepción: "Foro Romano visto desde Via dei Fori Imperiali", que es un lugar para mirar.)
5. **Miradores:** al atardecer cuando el día tiene tiempo libre (el tiempo va antes, no después). Si no, un mirador que pilla de camino a otra hora también vale.
6. **Un lugar bonito de camino puede entrar aunque no sea de la experiencia elegida** (ej. la Boca de la Verdad con Naturaleza), pero no cuenta para su mínimo-máximo ni lleva "Elegido según tus gustos: …": lleva el texto de "te pilla de camino".
7. **Nada de horas muertas en mitad del viaje.** Un hueco de más de 90 min que no sea al final del viaje significa que falta un bloque: el semáforo lo marca en **rojo**. (La tarde libre del último día sigue siendo amarillo.)
8. **En verano se cena después del atardecer.** Si el día tiene una parada `atardecer` y el sol se pone a las 20:15 o más tarde, la cena pasa a las 21:00.

---

## Parte B — Mañanas y tardes tipo

Importa el JSON a `roma.json`: `morning_flows`, `afternoon_flows` (sustituye al `afternoon_flow` actual; el del Vaticano ya está dentro), `redundancias` y `principios_local`. El formato está explicado en `_formato`.

**Cómo las usa el motor:**
1. **Cada día es una mañana tipo + una tarde tipo.**
2. **Mañanas:** por `prioridad` (1 primero), respetando pool, experiencias, cierres del día, `minimo_dias_viaje`, `evitar` y lo ya visto en el viaje. El Free Tour es una mañana más (sustituye a `centro_temprano`).
3. **Tardes:** la que mejor encaja con:
   - dónde acaba la mañana (`encaja_despues_de` = `acaba_en` de la mañana);
   - las experiencias elegidas (más coincidencias, mejor);
   - que no se haya usado ya ni la excluya otro bloque (`excluye`, `excluye_tardes_mismo_dia`, `excluye_tardes_mismo_viaje`);
   - si el pool pide un lugar, se prefiere el bloque que lo contiene;
   - `vaticano_por_la_tarde` solo cuando el Vaticano no cabe en ninguna mañana (ej. 2 días con Free Tour).
4. **Dentro de cada bloque:**
   - se respeta el orden;
   - `ancla` tiene que caber, o se elige otro bloque;
   - `solo_con`, solo con esa experiencia (o si está en el pool); si no, se salta sin romper el orden;
   - lo cerrado a esa hora se salta, o va `de_paso` si se ve por fuera;
   - `de_paso` sale como "Pasas por…";
   - `atardecer` va a su hora, con el tiempo sobrante antes;
   - comida en el barrio de `comida` de la mañana, cena en el de `cena` de la tarde, nocturna de su lista y a 15 min o menos.
5. **Si ningún bloque encaja**, el motor hace ese medio día como hoy (reserva) y el semáforo lo marca en amarillo: "medio día sin tipo".
6. **Viajes de 1 y 1,5 días:** a partir de ahora salen de estos mismos bloques (la mañana `roma_antigua` es el bloque A, `vaticano` es el C, y la tarde del centro, el B). Pásalos al sistema nuevo y comprueba que el resultado es igual o mejor que los bloques curados actuales; si en algún caso sale peor, mantén el antiguo y dímelo.
7. **Transporte:** `appia` es el único bloque de Roma que necesita bus (118) o taxi. Si todavía no hay saltos de transporte, trátalo como excursión de medio día.

**Datos a comprobar (anótalos con fuente):**
- Basílica de San Pedro los miércoles por la mañana (audiencia papal): ¿cierra hasta mediodía?
- Mercado de Testaccio: horario de cierre por la tarde.
- Catacumbas de San Calixto: cierre de los miércoles y horario.

**Kit de nuevo destino:** cada destino se cura en bloques. Mínimos según tamaño: grande (Roma, París, Londres, Estambul) 8 mañanas y 10 tardes; mediano (Lisboa, Praga, Florencia, Viena) 6 y 7; pequeño (Brujas, Salzburgo, Dubrovnik) 4 y 4. `validar.mjs` en rojo si faltan, si un nombre no existe o si entre dos paradas seguidas hay más de 20 min andando.

---

## Parte C — Comprobación

1. Vuelve a generar `docs/REVISION_RUTAS_ROMA_16.md` con los mismos 16 viajes.
2. Arriba, un resumen: qué mañana y qué tarde tipo usa cada día de cada viaje, y cuántos "medios días sin tipo" quedan.
3. Semáforo por meses en verde (con la nueva regla de huecos en rojo).
4. Commit y **sin push**: lo reviso primero.
