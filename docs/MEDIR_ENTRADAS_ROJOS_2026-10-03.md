# Órdenes nuevos de D1, D2 y D4 según la hora de la entrada

Medido con `scripts/destino/medirEntradas.mjs`: 365 fechas de 2027, 17155 reservas simuladas (cada día escrito, el primero de un viaje de 3 días, con la reserva a cada hora que se vende). Cabe = la parada sale a su hora, nada llega tarde ni fuera de horario, y no se quita un imprescindible en silencio. Un atardecer que no cabe por la hora de la reserva no es fallo.

## 🟢 Ningún fallo grave

- **Hora fija rota (llega tarde)**: 0
- **Parada fuera de horario o cerrada a su hora**: 0
- **Imprescindible quitado sin aviso**: 0
- **Un lugar repetido el mismo día**: 0
- **La Basílica de San Pedro por fuera el día de los Vaticanos**: 0
- **El motor falla**: 0

## Qué porcentaje cabe el mismo día (sin contar los días en que el sitio cierra: 1558 casos)

| Día · franja de la entrada | Casos | Caben | Huecos de más de 30 min (entre los que caben) | Por qué no caben (lo más repetido) |
|---|---|---|---|---|
| D1 · manana | 5092 | 5092 (100 %) | 49 | — |
| D1 · tarde | 1428 | 1427 (99.9 %) | 71 | la parada reservada no sale por dentro (1, p. ej. 2027-01-01 (viernes) · D1 · 15:30) |
| D2 · manana | 2107 | 2107 (100 %) | 0 | — |
| D2 · mediodia | 903 | 903 (100 %) | 55 | — |
| D2 · primera_tarde | 899 | 899 (100 %) | 0 | — |
| D2 · tarde | 1196 | 1196 (100 %) | 0 | — |
| D4 · nueve | 311 | 311 (100 %) | 94 | — |
| D4 · diez | 311 | 311 (100 %) | 108 | — |
| D4 · manana | 311 | 311 (100 %) | 0 | — |
| D4 · mediodia | 933 | 933 (100 %) | 0 | — |
| D4 · quince | 311 | 311 (100 %) | 12 | — |
| D4 · tarde | 933 | 933 (100 %) | 6 | — |

## Ejemplos de huecos de más de 30 min

- **D1 · manana**: 2027-03-26 (viernes) · D1 · 10:30 (15:00 Barrio Judío 32 min) ‖ 2027-07-01 (jueves) · D1 · 11:00 (15:50 Panteón 48 min) ‖ 2027-07-02 (viernes) · D1 · 11:00 (15:50 Panteón 48 min)
- **D1 · tarde**: 2027-04-26 (lunes) · D1 · 15:30 (19:40 Piazza Navona 34 min) ‖ 2027-04-27 (martes) · D1 · 15:30 (19:40 Piazza Navona 34 min) ‖ 2027-05-01 (sábado) · D1 · 16:00 (19:45 Piazza Navona 34 min)
- **D2 · mediodia**: 2027-01-02 (sábado) · D2 · 11:30 (16:20 Puente Sant'Angelo 33 min) ‖ 2027-01-04 (lunes) · D2 · 11:30 (16:20 Puente Sant'Angelo 33 min) ‖ 2027-01-05 (martes) · D2 · 11:30 (16:25 Puente Sant'Angelo 38 min)
- **D4 · nueve**: 2027-02-19 (viernes) · D4 · 09:00 (17:25 Terraza del Pincio 35 min) ‖ 2027-02-20 (sábado) · D4 · 09:00 (17:25 Terraza del Pincio 35 min) ‖ 2027-02-23 (martes) · D4 · 09:00 (17:30 Terraza del Pincio 40 min)
- **D4 · diez**: 2027-02-04 (jueves) · D4 · 10:00 (17:05 Terraza del Pincio 35 min) ‖ 2027-02-05 (viernes) · D4 · 10:00 (17:05 Terraza del Pincio 35 min) ‖ 2027-02-06 (sábado) · D4 · 10:00 (17:05 Terraza del Pincio 35 min)
- **D4 · quince**: 2027-04-25 (domingo) · D4 · 15:00 (19:25 Terraza del Pincio 33 min) ‖ 2027-05-01 (sábado) · D4 · 15:00 (19:35 Terraza del Pincio 43 min) ‖ 2027-05-02 (domingo) · D4 · 15:00 (19:35 Terraza del Pincio 43 min)
- **D4 · tarde**: 2027-05-15 (sábado) · D4 · 16:00 (19:50 Terraza del Pincio 33 min) ‖ 2027-05-18 (martes) · D4 · 16:00 (19:50 Terraza del Pincio 33 min) ‖ 2027-05-19 (miércoles) · D4 · 16:00 (19:50 Terraza del Pincio 33 min)

## Antes → ahora (primer informe → este; por día y franja de la entrada)

| Día · franja | Caben antes | Huecos >30 antes | Caben ahora | Huecos >30 ahora |
|---|---|---|---|---|
| D1 · manana | 5092 (100 %) | 49 | 5092 (100 %) | 49 |
| D1 · tarde | 1427 (99.9 %) | 431 | 1427 (99.9 %) | 71 |
| D2 · manana | 2107 (100 %) | 0 | 2107 (100 %) | 0 |
| D2 · mediodia | 903 (100 %) | 53 | 903 (100 %) | 55 |
| D2 · primera_tarde | 899 (100 %) | 0 | 899 (100 %) | 0 |
| D2 · tarde | 1196 (100 %) | 1 | 1196 (100 %) | 0 |
| D4 · nueve | 311 (100 %) | 94 | 311 (100 %) | 94 |
| D4 · diez | 311 (100 %) | 108 | 311 (100 %) | 108 |
| D4 · manana | 311 (100 %) | 0 | 311 (100 %) | 0 |
| D4 · mediodia | 933 (100 %) | 0 | 933 (100 %) | 0 |
| D4 · quince | 311 (100 %) | 12 | 311 (100 %) | 12 |
| D4 · tarde | 933 (100 %) | 112 | 933 (100 %) | 6 |
