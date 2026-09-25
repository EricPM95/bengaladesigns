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
8. **Zigzag del 28-30 de marzo** (semáforo en rojo, ya pasaba antes de Estaciones). Viaje de 7 días,
   completo, Barrios + Free Tour, día del Vaticano: Conciliazione → Campo de' Fiori → Barrio Judío →
   vuelta al Borgo Pio → Janículo (puesta de sol 19:26). Causa: al ordenar la tarde, el motor evita
   antes que nada las esperas de más de 30 min, y cuenta la espera al mirador del atardecer. Prefiere
   cruzar el río dos veces a esperar. Probé a no contar esa espera, como ya se hace con el Free Tour:
   el zigzag desaparece, pero el Janículo acaba el último (19:30, después de Acqua Paola y Trastevere),
   contra el orden fijado del recorrido. **Lo he deshecho**. ¿Cómo lo quieres? Opciones: (a) no contar
   la espera al atardecer y además obligar a que el mirador vaya en su sitio del recorrido; (b) dejar
   que espere y que el bloque "Tiempo libre" cubra el hueco; (c) otra.
9. **Octubre, 1 día con Free Tour**: ahora cabe el Foro por dentro, pero se pierden el Panteón por dentro,
   Plaza Venecia y el Altar (7 paradas → 4 y tarde libre). ¿Prefieres el Foro por dentro, o el Foro por
   fuera + Panteón + Altar como en el resto del año?

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

## Parte 5 — Semáforo por meses

**Semáforo** (`medirDias.mjs --motor v3 --semaforo`, 112 viajes cada uno):

| Escenario | Resultado |
|---|---|
| `--mes 1` (15 ene) | verde (solo el amarillo de siempre, "tarde libre") |
| `--mes 4` (15 abr) | verde |
| `--mes 7` (15 jul) | verde |
| `--mes 10` (15 oct) | verde |
| `--fecha 2027-03-28` | **rojo `zigzag`**: 7 días, completo, Barrios + Free Tour (ver pregunta 8) |
| `--fecha 2027-03-30` | **rojo `zigzag`**: el mismo viaje |
| `--fecha 2026-10-24` | verde |
| `--fecha 2026-10-26` | verde |

El rojo de marzo **ya estaba antes de Estaciones** (lo he pasado con el motor del commit cbf19cd:
sale igual). Nunca se había medido con esa fecha.

**Qué rutas cambian entre meses** — "antes" = el motor de cbf19cd con la temporada (horario más
corto de la temporada y puesta de sol de tabla); "ahora" = el mes (día 15). Completo, sin fechas.

### 1d Imprescindibles+FT

| | antes ene | ahora ene | antes abr | ahora abr | antes jul | ahora jul | antes oct | ahora oct |
|---|---|---|---|---|---|---|---|---|
| Coliseo por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Foro por dentro | por fuera | por fuera | por fuera | por fuera | por fuera | por fuera | por fuera | sí |
| Panteón por dentro | sí | sí | sí | sí | sí | sí | sí | no |
| Janículo al atardecer | no | no | no | no | no | no | no | no |
| Nocturnas antes de cenar | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| Nocturnas en total | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 |
| Tardes libres | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| Paradas (sin noche) | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 4 |

### 2d Imprescindibles+FT

| | antes ene | ahora ene | antes abr | ahora abr | antes jul | ahora jul | antes oct | ahora oct |
|---|---|---|---|---|---|---|---|---|
| Coliseo por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Foro por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Panteón por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Janículo al atardecer | no | no | no | no | no | no | no | no |
| Nocturnas antes de cenar | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| Nocturnas en total | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Tardes libres | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Paradas (sin noche) | 17 | 17 | 17 | 17 | 17 | 17 | 17 | 17 |

### 3d Ruta A (Arte+FT)

| | antes ene | ahora ene | antes abr | ahora abr | antes jul | ahora jul | antes oct | ahora oct |
|---|---|---|---|---|---|---|---|---|
| Coliseo por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Foro por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Panteón por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Janículo al atardecer | no | no | sí | sí | no | no | sí | sí |
| Nocturnas antes de cenar | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nocturnas en total | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| Tardes libres | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Paradas (sin noche) | 26 | 26 | 26 | 26 | 26 | 26 | 26 | 26 |

### 3d Ruta B (FT+Barrios)

| | antes ene | ahora ene | antes abr | ahora abr | antes jul | ahora jul | antes oct | ahora oct |
|---|---|---|---|---|---|---|---|---|
| Coliseo por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Foro por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Panteón por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Janículo al atardecer | sí | sí | sí | sí | no | no | sí | sí |
| Nocturnas antes de cenar | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| Nocturnas en total | 4 | 3 | 4 | 4 | 4 | 4 | 4 | 3 |
| Tardes libres | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Paradas (sin noche) | 29 | 29 | 29 | 30 | 29 | 29 | 30 | 30 |

### 4d Imprescindibles+Naturaleza

| | antes ene | ahora ene | antes abr | ahora abr | antes jul | ahora jul | antes oct | ahora oct |
|---|---|---|---|---|---|---|---|---|
| Coliseo por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Foro por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Panteón por dentro | sí | sí | sí | sí | sí | sí | sí | sí |
| Janículo al atardecer | sí | sí | sí | sí | no | no | sí | sí |
| Nocturnas antes de cenar | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nocturnas en total | 2 | 2 | 2 | 2 | 3 | 3 | 1 | 1 |
| Tardes libres | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Paradas (sin noche) | 34 | 34 | 33 | 34 | 34 | 34 | 35 | 35 |

Lo que se ve:
- **Coliseo por dentro en 1 día con Free Tour: sí en todos los meses** (antes y ahora).
- **Octubre, 1 día con Free Tour**: el Foro ya cabe por dentro (del 1 al 24 de octubre cierra a las
  18:30; antes se usaba el horario de noviembre, 16:30). Pero a cambio se pierden el Panteón por dentro
  y Plaza Venecia + Altar (de 7 paradas a 4) y queda tarde libre, con el Foro desde el Campidoglio a las
  19:00 antes de cenar. No sé si eso es mejor (pregunta 9).
- **Abril, 1 día**: el Panteón va justo después del tour y el Coliseo pasa a las 15:50 (cierra a las
  19:15, no a las 17:00).
- **Abril y octubre, 3 días Ruta B**: una parada más que antes (30 frente a 29) y en abril desaparece
  una tarde libre.
- **Enero y octubre**: nocturnas antes de cenar (Coliseo de noche o Foro desde el Campidoglio a las
  18:30-19:00), y a veces una nocturna menos (la cadena después de cenar tenía dos).
- **Julio**: igual que antes.

**Arreglado aquí**: la hora de la nocturna antes de cenar salía sin redondear (18:59); ahora en punto o
y media, como el resto.

## Parte 6 — Kit de nuevo destino

**Qué ha cambiado**
- `docs/kit/plantilla_horarios_por_periodo.json`: auditoría con `by_period`, `closed_dates`,
  `confianza`, `fuente`, `_nota` y `fecha_auditoria`, con los tres casos (horario normal, parque que
  cierra en `sunset`, lugar sin fuente = `by_period: null`). Se importa con `importarPeriodos.mjs`.
- `docs/kit/plantilla_temporada.json`: `available` en lugares, nocturnas y excursiones, y
  `destination_config.experience_availability` para las experiencias.
- `validar.mjs`: rojo si no se puede calcular la puesta de sol (falta `timezone` o un punto del
  destino) y si un `available` está mal escrito. Probado con una copia rota de Roma (y borrada).
- INVARIANTES, sección I (kit), paso 5 "Estaciones".

**Dónde se nota**: en un destino nuevo, sin curar nada más que su `timezone` y sus zonas, ya tiene
puesta de sol por fecha, noche a los 30 min y miradores al atardecer; el validador no le deja pasar
sin ellos.

## Migraciones de Supabase

Ninguna en estas seis partes: el mes (`answers.month`) y `seasonalConfirmed` van dentro del jsonb
`route` del viaje.
