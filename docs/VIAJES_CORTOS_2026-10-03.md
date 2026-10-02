# Viajes de 1 y 2 días: por fuera, salvo lo marcado

Medido con `scripts/destino/viajesCortos.mjs`: 5840 viajes (365 fechas de 2027, 1 y 2 días, con y sin Free Tour, con el pool vacío, con el Coliseo, con los Vaticanos y con los dos). Cada viaje se hace con la regla nueva y con la de antes.

## 🟢 Ningún fallo grave

- **Hora fija rota** (0):
— ninguno
- **Sitio cerrado por dentro** (0):
— ninguno
- **Imprescindible quitado sin aviso** (0):
— ninguno
- **El motor falla** (0):
— ninguno

## Avisos de cierre que salen con fechas

| Aviso | Veces | Ejemplo |
|---|---|---|
| Vaticano: Ese día cierra: Museos Vaticanos y Capilla Sixtina | 212 | 2027-01-01 · 1 día · pool Vaticanos, día 1 |
| Museos Vaticanos y Capilla Sixtina: Cierra todos los días de tu viaje | 80 | 2027-03-28 · 2 días · pool sin nada, día 1 |
| Centro: Ese día cierra: Panteón. Lo ves por fuera. | 6 | 2027-08-15 · 1 día · pool Vaticanos, día 1 |
| Vaticano: Ese día cierra: Museos Vaticanos y Capilla Sixtina. Lo ves por fuera. | 4 | 2027-12-25 · 1 día · pool Vaticanos, día 1 |

## Lo que va por dentro (imprescindibles de pago)

| Viaje | Por dentro (veces) |
|---|---|
| 1 día · pool Coliseo | Coliseo 727 |
| 1 día · pool Coliseo + Vaticanos | Coliseo 304 · Museos Vaticanos y Capilla Sixtina 552 |
| 2 días · pool sin nada | Coliseo 730 · Foro Romano y Palatino 730 · Panteón 724 |
| 2 días · pool Coliseo | Coliseo 730 · Foro Romano y Palatino 730 · Panteón 724 |
| 2 días · pool Vaticanos | Panteón 724 · Museos Vaticanos y Capilla Sixtina 717 |
| 2 días · pool Coliseo + Vaticanos | Coliseo 730 · Foro Romano y Palatino 730 · Panteón 724 · Museos Vaticanos y Capilla Sixtina 717 |
| 1 día · pool Vaticanos | Museos Vaticanos y Capilla Sixtina 602 |

## Avisos del auditor: antes → ahora

| Tipo | Antes | Ahora | Nuevos (no estaban antes) |
|---|---|---|---|
| Aviso de fecha que nombra un lugar que no está en el viaje | 11 | 9 | 0 |
| "Por fuera para llegar a todo" en un día con tiempo libre o paradas estiradas | 1240 | 1240 | 0 |
| Parada fuera de su horario real de ese día | 14 | 0 | 0 |
| Hueco de más de 20 min sin nada entre dos paradas (30 antes del atardecer o de una entrada con turno) | 506 | 516 | 10 |
| Más de 45 min antes de cenar sin nada, con un sitio de la ruta sin ver a un paseo | 104 | 0 | 0 |
| Tiempo libre de más de 30 min (60 si sale con nombre de paseo) | 379 | 379 | 0 |
| El paseo de «Pasea y piérdete por…» en el mismo sitio que la parada de antes (esa parada se alarga y no hay tarjeta aparte) | 1 | 1 | 0 |
| Iglesia o monumento antes que su plaza | 2297 | 1831 | 1068 |
| Lugar del pool fuera de la ruta | 521 | 529 | 27 |
| El mismo restaurante dos veces en el viaje | 176 | 150 | 62 |
| Tramo de más de 25 min andando sin transporte | 1638 | 1026 | 970 |
| Zigzag: volver a una zona que ya se dejó ese día | 748 | 0 | 0 |

## Tramos largos andando (más de 25 min): todos son de viajes de 1 y 2 días

| Hasta la parada | Veces | Ejemplo |
|---|---|---|
| 17:30 Piazza del Popolo — 26 min andando | 421 | 2027-01-02 · 1 día · FT · pool sin nada, día 1, 17:30 Piazza del Popolo |
| 18:45 Piazza del Popolo — 26 min andando | 420 | 2027-01-02 · 1 día · FT · pool Coliseo, día 1, 18:45 Piazza del Popolo |
| 17:30 Coliseo — 30 min andando | 128 | 2027-03-30 · 1 día · pool Coliseo + Vaticanos, día 1, 17:30 Coliseo |
| 14:45 Museos Vaticanos y Capilla Sixtina — 34 min andando | 50 | 2027-01-13 · 1 día · pool Vaticanos, día 1, 14:45 Museos Vaticanos y Capilla Sixtina |
| 14:45 Plaza de San Pedro — 29 min andando | 4 | 2027-12-25 · 1 día · pool Vaticanos, día 1, 14:45 Plaza de San Pedro |
| 17:05 Piazza del Popolo — 29 min andando | 2 | 2027-12-25 · 1 día · pool Coliseo + Vaticanos, día 1, 17:05 Piazza del Popolo |
| 17:15 Piazza del Popolo — 26 min andando | 1 | 2027-03-26 · 1 día · FT · pool Coliseo, día 1, 17:15 Piazza del Popolo |

### Ejemplos de avisos nuevos

- **Iglesia o monumento antes que su plaza** (1068): 2027-01-01 · 1 día · pool sin nada, día 1 — Coliseo (08:00) antes que Arco de Constantino (08:25) ‖ 2027-01-01 · 1 día · pool Vaticanos, día 1 — Piazza Navona (14:30) antes que Panteón (15:10) ‖ 2027-01-01 · 1 día · pool Coliseo + Vaticanos, día 1 — Piazza Navona (14:30) antes que Panteón (15:10)
- **Tramo de más de 25 min andando sin transporte** (970): 2027-01-02 · 1 día · FT · pool sin nada, día 1, 17:30 Piazza del Popolo — 26 min andando ‖ 2027-01-02 · 1 día · FT · pool Coliseo, día 1, 18:45 Piazza del Popolo — 26 min andando ‖ 2027-01-03 · 1 día · FT · pool sin nada, día 1, 17:30 Piazza del Popolo — 26 min andando
- **El mismo restaurante dos veces en el viaje** (62): 2027-01-02 · 1 día · FT · pool sin nada, día 1 Armando al Pantheon — día 1 (comida), día 1 (cena) ‖ 2027-01-05 · 1 día · FT · pool sin nada, día 1 Armando al Pantheon — día 1 (comida), día 1 (cena) ‖ 2027-01-09 · 1 día · FT · pool sin nada, día 1 Armando al Pantheon — día 1 (comida), día 1 (cena)
- **Lugar del pool fuera de la ruta** (27): 2027-03-01 · 1 día · pool Coliseo + Vaticanos, día 1 Coliseo — No te dio tiempo ‖ 2027-03-02 · 1 día · pool Coliseo + Vaticanos, día 1 Coliseo — No te dio tiempo ‖ 2027-03-04 · 1 día · pool Coliseo + Vaticanos, día 1 Coliseo — No te dio tiempo
- **Hueco de más de 20 min sin nada entre dos paradas (30 antes del atardecer o de una entrada con turno)** (10): 2027-03-24 · 1 día · pool sin nada, día 1, 18:05 Puente Sant'Angelo — 31 min ‖ 2027-03-25 · 1 día · pool sin nada, día 1, 18:05 Puente Sant'Angelo — 31 min ‖ 2027-09-18 · 1 día · pool sin nada, día 1, 18:50 Puente Sant'Angelo — 31 min
