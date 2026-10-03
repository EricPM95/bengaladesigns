# El Free Tour añadido después (viajes de 3, 4 y 5 días)

Medido con `scripts/destino/medirFtDespues.mjs`: 365 fechas de 2027, viajes de 3, 4, 5 días, 4380 casos. El tour sustituye la parte del día que enseña lo mismo (de mañana, la mañana del centro de D4; de tarde, la tarde del centro barroco de D1; de noche, la nocturna de ese día). La hora de la salida de noche es una suposición: la ficha del proveedor solo dice «antes de que se ponga el sol», sin hora (aquí, 20 min antes de la puesta).

## 🟢 Ningún fallo grave

- **Hora fija rota** (0):
— ninguno
- **Parada fuera de horario o cerrada** (0):
— ninguno
- **Imprescindible que se pierde** (0):
— ninguno
- **Lugar repetido el mismo día** (0):
— ninguno
- **El motor falla** (0):
— ninguno

## Quitado con aviso en la campana (no es fallo): 81

  - 2027-07-01 · 3 d · tour de noche 20:30: Altar de la Patria
  - 2027-07-01 · 4 d · tour de noche 20:30: Altar de la Patria
  - 2027-07-01 · 5 d · tour de noche 20:30: Altar de la Patria
  - 2027-07-02 · 3 d · tour de noche 20:30: Altar de la Patria
  - 2027-07-02 · 4 d · tour de noche 20:30: Altar de la Patria
  - 2027-07-02 · 5 d · tour de noche 20:30: Altar de la Patria
  - … y 75 más

## Cuánto cabe (antes → ahora)

| Viaje y tour | Casos | Antes | Ahora | Por qué no caben (lo más repetido) |
|---|---|---|---|---|
| 3 días · tour de mañana · 10:00 | 365 | 265 (72.6 %) | 365 (100 %) | — |
| 3 días · tour de noche · sale 20 min antes de la puesta | 365 | 115 (31.5 %) | 365 (100 %) | — |
| 3 días · tour de tarde · 16:00 | 365 | 43 (11.8 %) | 365 (100 %) | — |
| 3 días · tour de tarde · 17:00 | 365 | 261 (71.5 %) | 365 (100 %) | — |
| 4 días · tour de mañana · 10:00 | 365 | 105 (28.8 %) | 365 (100 %) | — |
| 4 días · tour de noche · sale 20 min antes de la puesta | 365 | 115 (31.5 %) | 365 (100 %) | — |
| 4 días · tour de tarde · 16:00 | 365 | 43 (11.8 %) | 365 (100 %) | — |
| 4 días · tour de tarde · 17:00 | 365 | 259 (71 %) | 365 (100 %) | — |
| 5 días · tour de mañana · 10:00 | 365 | 105 (28.8 %) | 365 (100 %) | — |
| 5 días · tour de noche · sale 20 min antes de la puesta | 365 | 115 (31.5 %) | 365 (100 %) | — |
| 5 días · tour de tarde · 16:00 | 365 | 43 (11.8 %) | 365 (100 %) | — |
| 5 días · tour de tarde · 17:00 | 365 | 259 (71 %) | 365 (100 %) | — |

## El tour de noche, mes a mes (viaje de 3 días; la hora es la de 20 min antes de la puesta)

| Mes | Hora de salida | Franja que le toca | Casos | Caben |
|---|---|---|---|---|
| 01 | 16:30 a 17:05 | tarde | 31 | 31 (100 %) |
| 02 | 17:05 a 17:40 | tarde | 28 | 28 (100 %) |
| 03 | 17:40 a 19:15 | tarde y noche | 31 | 31 (100 %) |
| 04 | 19:15 a 19:45 | noche | 30 | 30 (100 %) |
| 05 | 19:50 a 20:20 | noche | 31 | 31 (100 %) |
| 06 | 20:20 a 20:30 | noche | 30 | 30 (100 %) |
| 07 | 20:10 a 20:30 | noche | 31 | 31 (100 %) |
| 08 | 19:25 a 20:10 | noche | 31 | 31 (100 %) |
| 09 | 18:35 a 19:25 | noche y tarde | 30 | 30 (100 %) |
| 10 | 16:45 a 18:35 | tarde | 31 | 31 (100 %) |
| 11 | 16:20 a 16:45 | tarde | 30 | 30 (100 %) |
| 12 | 16:20 a 16:30 | tarde | 31 | 31 (100 %) |

## Fechas de frontera (el cambio de hora y el día en que el tour pasa de tarde a noche o al revés)

| Fecha | Hora del tour | Franja | Qué pasa | Cabe |
|---|---|---|---|---|
| 2027-03-27 | 18:10 | tarde | cambio de hora | sí |
| 2027-03-28 | 19:10 | noche | cambia la franja | sí |
| 2027-03-29 | 19:10 | noche | cambio de hora | sí |
| 2027-09-17 | 18:55 | tarde | cambia la franja | sí |
| 2027-10-30 | 17:45 | tarde | cambio de hora | sí |
| 2027-10-31 | 16:45 | tarde | cambio de hora | sí |
| 2027-11-01 | 16:45 | tarde | cambio de hora | sí |
