# Estaciones — notas de trabajo

Resumen de cada parte de `PROMPT_ESTACIONES.md` al acabarla, y las preguntas que no he decidido yo.
Sin push hasta que lo revises.

## Preguntas abiertas

1. **Dónde guardar `confianza`, `fuente` y `_nota`** (Parte 2). El prompt dice "como en la auditoría
   anterior", pero la anterior no los guardó en `roma.json` (solo salían en el informe de
   `importarHorarios.mjs`), y no he encontrado ningún "export de horarios". Los he guardado en un campo
   nuevo por lugar, `hours_audit: { confianza, fuente, nota, fecha }`. Si tenías otro sitio en mente,
   es cambiar el importador y volver a pasarlo.
2. **Terraza del Pincio de noche** (de la nota de Villa Borghese en tu JSON): el parque cierra al
   anochecer; el Pincio sigue como abierto 24 h y su nocturna sigue saliendo. No lo he tocado: ¿se
   confirma que se sube desde la Piazza del Popolo de noche?
3. **Museos Vaticanos sin `closed_dates`**: un viaje que empieza el 25 de diciembre pone el Vaticano ese
   día (los Museos cierran el 25 y el 26, y el resto de festivos religiosos). Es dato: ¿lo añades en la
   próxima auditoría o lo pongo yo con una fuente?
4. **Viajes de 1 día (`shortTrip`)**: no miran `closed_on` ni `closed_dates` (ya pasaba antes con el día
   de la semana). ¿Quieres que el bloque del día cambie si su imprescindible cierra esa fecha?
5. **Dónde va el `available` de una experiencia** (Parte 4). Las experiencias no tienen objeto propio en
   el JSON del destino (viven en el banco del formulario), y la ventana cambia por destino. La he puesto
   en `destination_config.experience_availability: { mercadillos_navidenos: { from, to } }`. Si
   prefieres otra forma, es mover la lectura (`experiencesInSeason` y `/api/destination-seasonal`).
6. **"Mercadillos Navideños" y el motor v3**: esa experiencia no tiene lugares propios en el motor v3
   (antes solo existía en el camino de Claude, con `season === 'winter'`). Cuando cures los mercadillos,
   ¿van como lugares con `available` y tags que casen con esa experiencia, o como otra cosa?
7. **Lugar de temporada en mes frontera "elegido"**: lo tomo como "está en su pool" (Elige lugares). Si
   también debe entrar cuando es de una experiencia que el viajero eligió y confirmó, es una línea.

## Parte 1 — Lo que recibe el motor

**Qué ha cambiado**
- Nuevo `shared/routeEngine/tripCalendar.js`: el motor recibe fechas exactas **o** días + mes (0-11).
  Sin fechas, todos los días usan el 15 del mes (la próxima vez que llega ese mes) para horarios y
  puesta de sol. La temporada se deduce del mes.
- `planTrip` y `planShortTrip` aceptan `month`; `buildDayBlockV3` recibe `options.month`; el servidor
  lo lee de `answers.month`. Cada día lleva `hours.dateIso` (lo usará `by_period` en la Parte 2).
- Viajes antiguos con solo temporada → mes central (en el motor y al cargar un viaje guardado).
  **Sin migración**: `answers` va dentro del jsonb `route`.
- Formulario: los 4 botones de temporada (opcionales) pasan a 12 meses en 4 filas por temporada;
  obligatorio sin fechas (no se puede continuar sin él). Con fechas, el mes sale de ellas.
- `medirDias.mjs --mes 10` (1-12) para medir por mes; `--temporada` sigue como compatibilidad.
- INVARIANTES 103. Prueba nueva: `verifyTripCalendar.mjs`.

**Dónde se nota** — Ruta A (3 días, Arte + Free Tour), día 3:
- Octubre: … Castillo 16:20 → **Mirador del Janículo 18:15** → Acqua Paola → Trastevere.
- Noviembre (puesta de sol 16:50; octubre, 18:29): … Castillo 16:20 → Acqua Paola 18:15 → Trastevere → Santa Maria
  in Trastevere. El Janículo al atardecer ya no cabe después del Castillo.

## Parte 2 — Horarios por periodo (`by_period`)

**Qué ha cambiado**
- `openingHours.js`: `by_period` (con la fecha real o el 15 del mes), su `last_entry`, la palabra
  `sunset` en las franjas (puesta de sol de ese día) y `closedOnDate`. Orden: cierres → `by_day` con
  fechas → `by_period` → `by_season` → laborables → `windows`.
- `closed_dates` en el reparto (solo con fechas): la unidad no entra ese día y el día curado se cambia
  con otro, igual que con `closed_on`.
- `scripts/destino/importarPeriodos.mjs` (kit) e importado `roma_horarios_por_periodo.json`: 9 lugares
  (Santa Maria in Trastevere sin tocar). `by_season` se queda de reserva.
- `validar.mjs`: cobertura de 366 días sin huecos ni solapes, y aviso si la auditoría es de un año
  anterior al del viaje (`--anio 2027`).
- INVARIANTES 104. Prueba nueva: `verifyPeriods.mjs`.

**Dónde se nota**
- Viaje que empieza el 25 de diciembre (3 días): el día de la Roma Antigua pasa al 26 (el Coliseo y el
  Foro cierran el 25) y el Vaticano va el 25 (ver pregunta 3).
- Viaje de 1 día con Free Tour: en marzo (Coliseo hasta las 17:00) va Coliseo 14:50 y el Panteón a las
  17:15; en abril (hasta las 19:15) el Panteón va justo después del tour (14:30) y el Coliseo a las 15:50.

## Parte 3 — El sol decide qué es tarde y qué es noche

**Qué ha cambiado**
- La puesta de sol ya salía de la fórmula astronómica; ahora con solo el mes se calcula el día 15
  (Parte 1) y entra en los horarios de cada día (`hours.sunset`).
- `nightWalk.js`: la noche empieza 30 min después de la puesta de sol (`nightStartsAt`). `nightTiming`
  decide: si es de noche antes de la cena y el paseo cabe entre la última visita y la cena, va antes
  de cenar, recorrido hacia el barrio de la cena (con su "por qué": "Ya es de noche y te pilla de
  camino a la cena…"); si no, después de cenar, desde las 21:30.
- Un exterior con horario que cierra antes de la noche no es nocturna ese día (lo que cierra en
  `sunset`, nunca). Hoy ninguna nocturna de Roma está en ese caso (el Jardín de los Naranjos no tiene
  nocturna); la regla está probada con datos de prueba.
- Miradores al atardecer: sin cambios, ya usan esta puesta de sol. La cena no cambia.
- INVARIANTES 105. Prueba nueva: `verifyNight.mjs`. Semáforo de enero (`--mes 1`) en verde.

**Dónde se nota** — Imprescindibles + Free Tour, 3 días:
- Enero (puesta de sol ~17:05): día 1 … Campidoglio 17:15 → Columna de Trajano 17:45 → **Coliseo de
  noche 18:30**, antes de cenar en Monti.
- Julio (~20:45): el Coliseo de noche va a las 21:30, después de cenar, como hasta ahora.

## Parte 4 — Disponibilidad por fechas (`available`)

**Qué ha cambiado**
- `shared/routeEngine/availability.js`: ventana `{ from, to }` (MM-DD, cruza el año), estado del mes
  (`in` / `out` / `border`) y si entra en el viaje.
- Motor: un lugar fuera de temporada no entra ese día (con fechas) o ese mes (el mes frontera, solo si
  está en su pool); si lo eligió y no cabe nunca, sale en "no incluido" con "Solo del X al Y".
  Nocturnas y excursiones fuera de temporada no se ofrecen (mes frontera tampoco: no las elige él).
- Experiencias: su ventana en `destination_config.experience_availability[id]`. El servidor quita de la
  selección la que no toca (`experiencesInSeason`). El formulario pide las ventanas a
  `/api/destination-seasonal`: fuera → la tarjeta no sale; mes frontera → pregunta "¿Viajas en esas
  fechas?" (Sí → `answers.seasonalConfirmed`; No → se quita y se avisa en una línea). Sin ventana,
  sigue la regla de siempre (`winterOnly`).
- "Añadir parada": un lugar de temporada lleva "De temporada: solo del X al Y." delante del horario.
- **Sin datos de Roma**: no he inventado ninguna fecha. Todo probado con datos de prueba en
  `verifyAvailability.mjs` (lugar, experiencia) y en el navegador (selector con una ventana simulada).
- INVARIANTES 106.

**Dónde se nota** (con datos de prueba: un mercadillo del 1 de diciembre al 6 de enero)
- Junio: la tarjeta "Mercadillos Navideños" no sale; un mercadillo elegido en el pool sale en "no
  incluido: Solo del 1 de diciembre al 6 de enero".
- Enero (frontera): pregunta "En Roma, los mercadillos navideños suelen estar del 1 de diciembre al 6 de
  enero. ¿Viajas en esas fechas?"; con "No", "Hemos quitado Mercadillos Navideños: en Roma solo están
  del 1 de diciembre al 6 de enero."
- Con fechas del 8 de enero: no entra aunque esté elegido.
