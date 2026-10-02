# Órdenes nuevos de D1, D2 y D4 según la hora de la entrada

Medido con `scripts/destino/medirEntradas.mjs`: 365 fechas de 2027, 18615 reservas simuladas (cada día escrito, el primero de un viaje de 3 días, con la reserva a cada hora que se vende). Cabe = la parada sale a su hora, nada llega tarde ni fuera de horario, y no se quita un imprescindible en silencio. Un atardecer que no cabe por la hora de la reserva no es fallo.

## 🔴 Fallos graves

- **Hora fija rota (llega tarde)**: 1182
- **Parada fuera de horario o cerrada a su hora**: 87
  - 2027-04-10 (sábado) · D1 · 15:30: 18:10 Palazzo Doria Pamphilj
  - 2027-04-24 (sábado) · D1 · 15:30: 18:10 Palazzo Doria Pamphilj
  - 2027-05-01 (sábado) · D1 · 15:30: 18:35 Palazzo Doria Pamphilj
  - 2027-05-08 (sábado) · D1 · 15:30: 18:40 Palazzo Doria Pamphilj
  - 2027-05-15 (sábado) · D1 · 15:30: 18:50 Palazzo Doria Pamphilj
  - 2027-05-22 (sábado) · D1 · 15:30: 18:55 Palazzo Doria Pamphilj
  - 2027-05-29 (sábado) · D1 · 15:30: 19:00 Palazzo Doria Pamphilj
  - 2027-06-05 (sábado) · D1 · 15:30: 19:00 Palazzo Doria Pamphilj
- **Imprescindible quitado sin aviso**: 241
  - 2027-03-27 (sábado) · D1 · 16:00: Piazza Navona
  - 2027-03-27 (sábado) · D1 · 16:30: Piazza Navona
  - 2027-03-29 (lunes) · D1 · 17:00: Piazza Navona
  - 2027-03-29 (lunes) · D1 · 17:30: Piazza Navona
  - 2027-03-29 (lunes) · D1 · 18:00: Piazza Navona
  - 2027-03-31 (miércoles) · D1 · 17:00: Piazza Navona
  - 2027-03-31 (miércoles) · D1 · 17:30: Piazza Navona
  - 2027-03-31 (miércoles) · D1 · 18:00: Piazza Navona
- **El motor falla**: 0

## Qué porcentaje cabe el mismo día (sin contar los días en que el sitio cierra: 1694 casos)

| Día · franja de la entrada | Casos | Caben | Huecos de más de 30 min (entre los que caben) | Por qué no caben (lo más repetido) |
|---|---|---|---|---|
| D1 · manana | 5092 | 5092 (100 %) | 53 | — |
| D1 · tarde | 1428 | 1166 (81.7 %) | 1005 | se quita Piazza Navona (241, p. ej. 2027-03-27 (sábado) · D1 · 16:00) · fuera de horario: 19:00 Palazzo Doria Pamphilj (9, p. ej. 2027-05-29 (sábado) · D1 · 15:30) · fuera de horario: 18:10 Palazzo Doria Pamphilj (4, p. ej. 2027-04-10 (sábado) · D1 · 15:30) |
| D2 · manana | 2157 | 2105 (97.6 %) | 0 | la parada reservada no sale por dentro (50, p. ej. 2027-01-31 (domingo) · D2 · 09:00) · sale a las 09:00, no a las 08:00 (1, p. ej. 2027-03-26 (viernes) · D2 · 08:00) · sale a las 09:00, no a las 08:30 (1, p. ej. 2027-03-26 (viernes) · D2 · 08:30) |
| D2 · mediodia | 933 | 900 (96.5 %) | 235 | la parada reservada no sale por dentro (30, p. ej. 2027-01-31 (domingo) · D2 · 11:30) · sale a las 13:35, no a las 11:30 (1, p. ej. 2027-03-25 (jueves) · D2 · 11:30) · sale a las 13:35, no a las 12:00 (1, p. ej. 2027-03-25 (jueves) · D2 · 12:00) |
| D2 · primera_tarde | 899 | 496 (55.2 %) | 0 | sale a las 13:25, no a las 13:00 (249, p. ej. 2027-01-02 (sábado) · D2 · 13:00) · sale a las 15:10, no a las 13:00 (50, p. ej. 2027-01-13 (miércoles) · D2 · 13:00) · sale a las 15:10, no a las 13:30 (50, p. ej. 2027-01-13 (miércoles) · D2 · 13:30) |
| D2 · tarde | 2392 | 2328 (97.3 %) | 1132 | sale a las 18:35, no a las 15:30 (8, p. ej. 2027-07-07 (miércoles) · D2 · 15:30) · sale a las 18:35, no a las 16:00 (8, p. ej. 2027-07-07 (miércoles) · D2 · 16:00) · sale a las 18:35, no a las 16:30 (8, p. ej. 2027-07-07 (miércoles) · D2 · 16:30) |
| D4 · manana | 933 | 312 (33.4 %) | 0 | sale a las 10:15, no a las 09:00 (310, p. ej. 2027-01-02 (sábado) · D4 · 09:00) · sale a las 10:15, no a las 10:00 (310, p. ej. 2027-01-02 (sábado) · D4 · 10:00) · sale a las 10:10, no a las 09:00 (1, p. ej. 2027-01-06 (miércoles) · D4 · 09:00) |
| D4 · mediodia | 933 | 933 (100 %) | 0 | — |
| D4 · tarde | 1244 | 934 (75.1 %) | 239 | la parada reservada no sale por dentro (212, p. ej. 2027-07-01 (jueves) · D4 · 15:00) · sale a las 15:55, no a las 15:00 (55, p. ej. 2027-04-11 (domingo) · D4 · 15:00) · sale a las 16:05, no a las 15:00 (11, p. ej. 2027-04-18 (domingo) · D4 · 15:00) |

## Ejemplos de huecos de más de 30 min

- **D1 · manana**: 2027-07-01 (jueves) · D1 · 11:00 (15:50 Panteón 48 min) ‖ 2027-07-02 (viernes) · D1 · 11:00 (15:50 Panteón 48 min) ‖ 2027-07-04 (domingo) · D1 · 11:00 (15:50 Panteón 48 min)
- **D1 · tarde**: 2027-01-02 (sábado) · D1 · 15:30 (15:30 Coliseo 35 min) ‖ 2027-01-03 (domingo) · D1 · 15:30 (15:30 Coliseo 35 min) ‖ 2027-01-04 (lunes) · D1 · 15:30 (15:30 Coliseo 35 min)
- **D2 · mediodia**: 2027-01-13 (miércoles) · D2 · 11:30 (11:30 Museos Vaticanos y Capilla Sixtina 71 min) ‖ 2027-01-13 (miércoles) · D2 · 12:00 (12:00 Museos Vaticanos y Capilla Sixtina 101 min) ‖ 2027-01-13 (miércoles) · D2 · 12:30 (12:30 Museos Vaticanos y Capilla Sixtina 131 min)
- **D2 · tarde**: 2027-01-02 (sábado) · D2 · 17:00 (17:00 Museos Vaticanos y Capilla Sixtina 41 min) ‖ 2027-01-02 (sábado) · D2 · 17:30 (17:30 Museos Vaticanos y Capilla Sixtina 71 min) ‖ 2027-01-02 (sábado) · D2 · 18:00 (18:00 Museos Vaticanos y Capilla Sixtina 101 min)
- **D4 · tarde**: 2027-03-12 (viernes) · D4 · 15:00 (17:50 Terraza del Pincio 33 min) ‖ 2027-03-13 (sábado) · D4 · 15:00 (17:50 Terraza del Pincio 33 min) ‖ 2027-03-14 (domingo) · D4 · 15:00 (17:50 Terraza del Pincio 33 min)
