# Órdenes nuevos de D1, D2 y D4 según la hora de la entrada

Medido con `scripts/destino/medirEntradas.mjs`: 365 fechas de 2027, 17155 reservas simuladas (cada día escrito, el primero de un viaje de 3 días, con la reserva a cada hora que se vende). Cabe = la parada sale a su hora, nada llega tarde ni fuera de horario, y no se quita un imprescindible en silencio. Un atardecer que no cabe por la hora de la reserva no es fallo.

## 🔴 Fallos graves

- **Hora fija rota (llega tarde)**: 192
- **Parada fuera de horario o cerrada a su hora**: 50
  - 2027-04-10 (sábado) · D1 · 15:30: 18:10 Palazzo Doria Pamphilj
  - 2027-04-24 (sábado) · D1 · 15:30: 18:10 Palazzo Doria Pamphilj
  - 2027-05-01 (sábado) · D1 · 15:30: 18:35 Palazzo Doria Pamphilj
  - 2027-05-08 (sábado) · D1 · 15:30: 18:40 Palazzo Doria Pamphilj
  - 2027-05-15 (sábado) · D1 · 15:30: 18:50 Palazzo Doria Pamphilj
  - 2027-05-22 (sábado) · D1 · 15:30: 18:55 Palazzo Doria Pamphilj
  - 2027-05-29 (sábado) · D1 · 15:30: 19:00 Palazzo Doria Pamphilj
  - 2027-06-05 (sábado) · D1 · 15:30: 19:00 Palazzo Doria Pamphilj
- **Imprescindible quitado sin aviso**: 0
- **El motor falla**: 0

## Qué porcentaje cabe el mismo día (sin contar los días en que el sitio cierra: 1478 casos)

| Día · franja de la entrada | Casos | Caben | Huecos de más de 30 min (entre los que caben) | Por qué no caben (lo más repetido) |
|---|---|---|---|---|
| D1 · manana | 5092 | 5092 (100 %) | 49 | — |
| D1 · tarde | 1428 | 1407 (98.5 %) | 1349 | fuera de horario: 19:00 Palazzo Doria Pamphilj (9, p. ej. 2027-05-29 (sábado) · D1 · 15:30) · fuera de horario: 18:10 Palazzo Doria Pamphilj (4, p. ej. 2027-04-10 (sábado) · D1 · 15:30) · fuera de horario: 18:35 Palazzo Doria Pamphilj (2, p. ej. 2027-05-01 (sábado) · D1 · 15:30) |
| D2 · manana | 2157 | 2099 (97.3 %) | 0 | la parada reservada no sale por dentro (50, p. ej. 2027-01-31 (domingo) · D2 · 09:00) · fuera de horario: 17:40 San Pietro in Montorio y Tempietto de Bramante (6, p. ej. 2027-03-03 (miércoles) · D2 · 10:30) · sale a las 09:00, no a las 08:00 (1, p. ej. 2027-03-26 (viernes) · D2 · 08:00) |
| D2 · mediodia | 933 | 900 (96.5 %) | 11 | la parada reservada no sale por dentro (30, p. ej. 2027-01-31 (domingo) · D2 · 11:30) · sale a las 13:35, no a las 11:30 (1, p. ej. 2027-03-25 (jueves) · D2 · 11:30) · sale a las 13:35, no a las 12:00 (1, p. ej. 2027-03-25 (jueves) · D2 · 12:00) |
| D2 · primera_tarde | 899 | 746 (83 %) | 0 | sale a las 14:55, no a las 13:00 (50, p. ej. 2027-01-13 (miércoles) · D2 · 13:00) · sale a las 14:55, no a las 13:30 (50, p. ej. 2027-01-13 (miércoles) · D2 · 13:30) · sale a las 14:55, no a las 14:00 (50, p. ej. 2027-01-13 (miércoles) · D2 · 14:00) |
| D2 · tarde | 1196 | 1172 (98 %) | 350 | sale a las 18:35, no a las 15:30 (8, p. ej. 2027-07-07 (miércoles) · D2 · 15:30) · sale a las 18:35, no a las 16:00 (8, p. ej. 2027-07-07 (miércoles) · D2 · 16:00) · sale a las 18:15, no a las 14:30 (1, p. ej. 2027-03-25 (jueves) · D2 · 14:30) |
| D4 · nueve | 311 | 311 (100 %) | 94 | — |
| D4 · diez | 311 | 311 (100 %) | 108 | — |
| D4 · manana | 311 | 311 (100 %) | 0 | — |
| D4 · mediodia | 933 | 933 (100 %) | 0 | — |
| D4 · quince | 311 | 258 (83 %) | 12 | la parada reservada no sale por dentro (39, p. ej. 2027-07-01 (jueves) · D4 · 15:00) · sale a las 17:15, no a las 15:00 (5, p. ej. 2027-08-14 (sábado) · D4 · 15:00) · sale a las 17:10, no a las 15:00 (4, p. ej. 2027-08-21 (sábado) · D4 · 15:00) |
| D4 · tarde | 933 | 774 (83 %) | 194 | la parada reservada no sale por dentro (159, p. ej. 2027-07-01 (jueves) · D4 · 16:00) |

## Ejemplos de huecos de más de 30 min

- **D1 · manana**: 2027-03-26 (viernes) · D1 · 10:30 (15:00 Barrio Judío 32 min) ‖ 2027-07-01 (jueves) · D1 · 11:00 (15:50 Panteón 48 min) ‖ 2027-07-02 (viernes) · D1 · 11:00 (15:50 Panteón 48 min)
- **D1 · tarde**: 2027-01-03 (domingo) · D1 · 15:30 (15:30 Coliseo 65 min) ‖ 2027-01-04 (lunes) · D1 · 15:30 (15:30 Coliseo 65 min) ‖ 2027-01-05 (martes) · D1 · 15:30 (15:30 Coliseo 65 min)
- **D2 · mediodia**: 2027-01-02 (sábado) · D2 · 11:30 (16:20 Puente Sant'Angelo 33 min) ‖ 2027-01-04 (lunes) · D2 · 11:30 (16:20 Puente Sant'Angelo 33 min) ‖ 2027-01-28 (jueves) · D2 · 12:00 (16:50 Puente Sant'Angelo 33 min)
- **D2 · tarde**: 2027-04-10 (sábado) · D2 · 14:30 (18:50 Puente Sant'Angelo 62 min) ‖ 2027-04-10 (sábado) · D2 · 15:00 (18:50 Puente Sant'Angelo 32 min) ‖ 2027-04-12 (lunes) · D2 · 14:30 (18:50 Puente Sant'Angelo 62 min)
- **D4 · nueve**: 2027-02-19 (viernes) · D4 · 09:00 (17:25 Terraza del Pincio 35 min) ‖ 2027-02-20 (sábado) · D4 · 09:00 (17:25 Terraza del Pincio 35 min) ‖ 2027-02-23 (martes) · D4 · 09:00 (17:30 Terraza del Pincio 40 min)
- **D4 · diez**: 2027-02-04 (jueves) · D4 · 10:00 (17:05 Terraza del Pincio 35 min) ‖ 2027-02-05 (viernes) · D4 · 10:00 (17:05 Terraza del Pincio 35 min) ‖ 2027-02-06 (sábado) · D4 · 10:00 (17:05 Terraza del Pincio 35 min)
- **D4 · quince**: 2027-04-25 (domingo) · D4 · 15:00 (19:25 Terraza del Pincio 33 min) ‖ 2027-05-01 (sábado) · D4 · 15:00 (19:35 Terraza del Pincio 43 min) ‖ 2027-05-02 (domingo) · D4 · 15:00 (19:35 Terraza del Pincio 43 min)
- **D4 · tarde**: 2027-03-28 (domingo) · D4 · 16:00 (19:05 Terraza del Pincio 48 min) ‖ 2027-03-30 (martes) · D4 · 16:00 (19:10 Terraza del Pincio 53 min) ‖ 2027-03-31 (miércoles) · D4 · 16:00 (19:10 Terraza del Pincio 53 min)
