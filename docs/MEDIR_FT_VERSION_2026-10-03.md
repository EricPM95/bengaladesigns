# Free Tour añadido después: cambiar el día por su versión con Free Tour

Medido con `scripts/destino/medirFtVersion.mjs`: 73 fechas de 2027 (una de cada 5), viajes de 3, 4, 5 días, 1752 casos (cada día del viaje, con el tour reservado a las 10:00 y a las 17:00).
La vía: el viaje se monta sin tour y con tour, y el día con tour del viaje con tour se pone en el lugar de ese día. Cabe si el tour sale a la hora reservada, no se pierde ningún imprescindible (lo que cubre el tour cuenta como visto) y ninguno sale en dos días.

| Viaje y reserva | Casos | Caben | Por qué no caben (lo más repetido) |
|---|---|---|---|
| 3 días · tour a las 10:00 · el día que lleva el tour | 73 | 14 (19.2 %) | se pierde un imprescindible: Coliseo, Foro Romano y Palatino (59, p. ej. 2027-01-11 · 3 d · día 1) |
| 3 días · tour a las 10:00 · otro día (sin versión con tour) | 146 | 0 (0 %) | ese día no tiene versión con Free Tour (el tour va en otro día del viaje) (146, p. ej. 2027-01-01 · 3 d · día 1) |
| 3 días · tour a las 17:00 · el día que lleva el tour | 73 | 0 (0 %) | la versión con tour sale a las 10:00, no a las 17:00 (73, p. ej. 2027-01-01 · 3 d · día 2) |
| 3 días · tour a las 17:00 · otro día (sin versión con tour) | 146 | 0 (0 %) | ese día no tiene versión con Free Tour (el tour va en otro día del viaje) (146, p. ej. 2027-01-01 · 3 d · día 1) |
| 4 días · tour a las 10:00 · el día que lleva el tour | 73 | 14 (19.2 %) | se pierde un imprescindible: Coliseo, Foro Romano y Palatino (59, p. ej. 2027-01-01 · 4 d · día 2) |
| 4 días · tour a las 10:00 · otro día (sin versión con tour) | 219 | 0 (0 %) | ese día no tiene versión con Free Tour (el tour va en otro día del viaje) (219, p. ej. 2027-01-01 · 4 d · día 1) |
| 4 días · tour a las 17:00 · el día que lleva el tour | 73 | 0 (0 %) | la versión con tour sale a las 10:00, no a las 17:00 (73, p. ej. 2027-01-01 · 4 d · día 2) |
| 4 días · tour a las 17:00 · otro día (sin versión con tour) | 219 | 0 (0 %) | ese día no tiene versión con Free Tour (el tour va en otro día del viaje) (219, p. ej. 2027-01-01 · 4 d · día 1) |
| 5 días · tour a las 10:00 · el día que lleva el tour | 73 | 14 (19.2 %) | se pierde un imprescindible: Coliseo, Foro Romano y Palatino (59, p. ej. 2027-01-01 · 5 d · día 2) |
| 5 días · tour a las 10:00 · otro día (sin versión con tour) | 292 | 0 (0 %) | ese día no tiene versión con Free Tour (el tour va en otro día del viaje) (292, p. ej. 2027-01-01 · 5 d · día 1) |
| 5 días · tour a las 17:00 · el día que lleva el tour | 73 | 0 (0 %) | la versión con tour sale a las 10:00, no a las 17:00 (73, p. ej. 2027-01-01 · 5 d · día 2) |
| 5 días · tour a las 17:00 · otro día (sin versión con tour) | 292 | 0 (0 %) | ese día no tiene versión con Free Tour (el tour va en otro día del viaje) (292, p. ej. 2027-01-01 · 5 d · día 1) |
