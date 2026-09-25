# Estaciones — notas de trabajo

Resumen de cada parte de `PROMPT_ESTACIONES.md` al acabarla, y las preguntas que no he decidido yo.
Sin push hasta que lo revises.

## Preguntas abiertas

(ninguna todavía)

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
