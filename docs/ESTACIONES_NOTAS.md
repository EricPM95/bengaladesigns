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
