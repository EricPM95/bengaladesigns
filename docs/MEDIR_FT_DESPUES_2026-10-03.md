# El Free Tour añadido después (viajes de 3, 4 y 5 días)

Medido con `scripts/destino/medirFtDespues.mjs`: 365 fechas de 2027, viajes de 3, 4, 5 días, 4380 casos. El tour sustituye la parte del día que enseña lo mismo (de mañana, la mañana del centro de D4; de tarde, la tarde del centro barroco de D1; de noche, la nocturna de ese día). La hora de la salida de noche es una suposición: la ficha del proveedor solo dice «antes de que se ponga el sol», sin hora (aquí, 20 min antes de la puesta).

## 🔴 Fallos graves: 2076

- **Hora fija rota** (1556):
  - 2027-01-01 · 3 d · tour de tarde 16:00: sale a las 16:15
  - 2027-01-01 · 3 d · tour de noche 16:30: sale a las 17:40
  - 2027-01-03 · 3 d · tour de tarde 16:00: sale a las 16:15
  - 2027-01-03 · 3 d · tour de noche 16:30: sale a las 17:40
  - 2027-01-03 · 4 d · tour de tarde 16:00: sale a las 16:15
  - 2027-01-03 · 4 d · tour de noche 16:30: sale a las 17:40
  - … y 1550 más
- **Parada fuera de horario o cerrada** (0):
— ninguno
- **Imprescindible que se pierde** (0):
— ninguno
- **Lugar repetido el mismo día** (520):
  - 2027-02-11 · 4 d · tour de mañana 10:00: 18:20 Terraza del Pincio
  - 2027-02-11 · 5 d · tour de mañana 10:00: 18:20 Terraza del Pincio
  - 2027-02-12 · 4 d · tour de mañana 10:00: 18:20 Terraza del Pincio
  - 2027-02-12 · 5 d · tour de mañana 10:00: 18:20 Terraza del Pincio
  - 2027-02-13 · 4 d · tour de mañana 10:00: 18:20 Terraza del Pincio
  - 2027-02-13 · 5 d · tour de mañana 10:00: 18:20 Terraza del Pincio
  - … y 514 más
- **El motor falla** (0):
— ninguno

## Cuánto cabe

| Viaje y tour | Casos | Caben | Por qué no caben (lo más repetido) |
|---|---|---|---|
| 3 días · tour de mañana · 10:00 | 365 | 265 (72.6 %) | ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (100, p. ej. 2027-01-02 · 3 d · tour de mañana 10:00) |
| 3 días · tour de noche · sale 20 min antes de la puesta | 365 | 115 (31.5 %) | ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (52, p. ej. 2027-01-02 · 3 d · tour de noche 16:30) · el tour sale a las 17:40, no a las 16:20 (23, p. ej. 2027-11-26 · 3 d · tour de noche 16:20) · el tour sale a las 21:20, no a las 20:30 (17, p. ej. 2027-06-18 · 3 d · tour de noche 20:30) |
| 3 días · tour de tarde · 16:00 | 365 | 43 (11.8 %) | el tour sale a las 16:15, no a las 16:00 (150, p. ej. 2027-01-01 · 3 d · tour de tarde 16:00) · el tour sale a las 16:30, no a las 16:00 (68, p. ej. 2027-04-11 · 3 d · tour de tarde 16:00) · ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (52, p. ej. 2027-01-02 · 3 d · tour de tarde 16:00) |
| 3 días · tour de tarde · 17:00 | 365 | 261 (71.5 %) | ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (52, p. ej. 2027-01-02 · 3 d · tour de tarde 17:00) · el tour sale a las 17:45, no a las 17:00 (52, p. ej. 2027-07-01 · 3 d · tour de tarde 17:00) |
| 4 días · tour de mañana · 10:00 | 365 | 105 (28.8 %) | un lugar sale dos veces el mismo día (260, p. ej. 2027-02-11 · 4 d · tour de mañana 10:00) |
| 4 días · tour de noche · sale 20 min antes de la puesta | 365 | 115 (31.5 %) | ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (52, p. ej. 2027-01-01 · 4 d · tour de noche 16:30) · el tour sale a las 17:40, no a las 16:20 (23, p. ej. 2027-11-26 · 4 d · tour de noche 16:20) · el tour sale a las 21:20, no a las 20:30 (17, p. ej. 2027-06-18 · 4 d · tour de noche 20:30) |
| 4 días · tour de tarde · 16:00 | 365 | 43 (11.8 %) | el tour sale a las 16:15, no a las 16:00 (149, p. ej. 2027-01-03 · 4 d · tour de tarde 16:00) · el tour sale a las 16:30, no a las 16:00 (67, p. ej. 2027-04-11 · 4 d · tour de tarde 16:00) · ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (54, p. ej. 2027-01-01 · 4 d · tour de tarde 16:00) |
| 4 días · tour de tarde · 17:00 | 365 | 259 (71 %) | ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (54, p. ej. 2027-01-01 · 4 d · tour de tarde 17:00) · el tour sale a las 17:45, no a las 17:00 (52, p. ej. 2027-07-01 · 4 d · tour de tarde 17:00) |
| 5 días · tour de mañana · 10:00 | 365 | 105 (28.8 %) | un lugar sale dos veces el mismo día (260, p. ej. 2027-02-11 · 5 d · tour de mañana 10:00) |
| 5 días · tour de noche · sale 20 min antes de la puesta | 365 | 115 (31.5 %) | ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (52, p. ej. 2027-01-01 · 5 d · tour de noche 16:30) · el tour sale a las 17:40, no a las 16:20 (23, p. ej. 2027-11-26 · 5 d · tour de noche 16:20) · el tour sale a las 21:20, no a las 20:30 (17, p. ej. 2027-06-18 · 5 d · tour de noche 20:30) |
| 5 días · tour de tarde · 16:00 | 365 | 43 (11.8 %) | el tour sale a las 16:15, no a las 16:00 (149, p. ej. 2027-01-03 · 5 d · tour de tarde 16:00) · el tour sale a las 16:30, no a las 16:00 (67, p. ej. 2027-04-11 · 5 d · tour de tarde 16:00) · ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (54, p. ej. 2027-01-01 · 5 d · tour de tarde 16:00) |
| 5 días · tour de tarde · 17:00 | 365 | 259 (71 %) | ningún día del viaje lleva el tour de esa franja (el motor no lo pone) (54, p. ej. 2027-01-01 · 5 d · tour de tarde 17:00) · el tour sale a las 17:45, no a las 17:00 (52, p. ej. 2027-07-01 · 5 d · tour de tarde 17:00) |
