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
| Centro: Ese día cierra: Panteón. Lo ves por fuera. | 12 | 2027-08-15 · 1 día · pool sin nada, día 1 |
| Roma Antigua: Ese día cierra: Coliseo, Foro Romano y Palatino. Lo ves por fuera. | 4 | 2027-12-25 · 1 día · pool sin nada, día 1 |
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
| Aviso de fecha que nombra un lugar que no está en el viaje | 15 | 11 | 0 |
| "Por fuera para llegar a todo" en un día con tiempo libre o paradas estiradas | 2704 | 2704 | 0 |
| Hueco de más de 20 min sin nada entre dos paradas (30 antes del atardecer o de una entrada con turno) | 506 | 506 | 0 |
| Más de 45 min antes de cenar sin nada, con un sitio de la ruta sin ver a un paseo | 104 | 0 | 0 |
| Tiempo libre de más de 30 min (60 si sale con nombre de paseo) | 359 | 359 | 0 |
| Nivel 1-2 como "Por el camino" | 1462 | 4105 | 3911 |
| Imprescindible de pago que no sale nunca por dentro en el viaje | 9340 | 13623 | 4772 |
| El paseo de «Pasea y piérdete por…» en el mismo sitio que la parada de antes (esa parada se alarga y no hay tarjeta aparte) | 1 | 1 | 0 |
| Iglesia o monumento antes que su plaza | 1369 | 1480 | 1081 |
| Lugar del pool fuera de la ruta | 521 | 529 | 27 |
| El mismo restaurante dos veces en el viaje | 176 | 150 | 62 |
| Tramo de más de 25 min andando sin transporte | 880 | 1026 | 970 |

### Ejemplos de avisos nuevos

- **Nivel 1-2 como "Por el camino"** (3911): 2027-01-01 · 1 día · pool sin nada, día 1, 08:20 Coliseo ‖ 2027-01-01 · 1 día · pool sin nada, día 1, 08:50 Foro Romano y Palatino ‖ 2027-01-01 · 1 día · pool sin nada, día 1, 15:10 Panteón
- **Iglesia o monumento antes que su plaza** (1081): 2027-01-01 · 1 día · pool sin nada, día 1 — Piazza Navona (14:30) antes que Panteón (15:10) ‖ 2027-01-01 · 1 día · pool Coliseo, día 1 — Piazza Navona (14:30) antes que Panteón (15:10) ‖ 2027-01-01 · 1 día · pool Vaticanos, día 1 — Piazza Navona (14:30) antes que Panteón (15:10)
- **Imprescindible de pago que no sale nunca por dentro en el viaje** (4772): 2027-01-01 · 1 día · pool sin nada, todo el viaje Coliseo — ningún día por dentro ‖ 2027-01-01 · 1 día · pool sin nada, todo el viaje Foro Romano y Palatino — ningún día por dentro ‖ 2027-01-01 · 1 día · pool sin nada, todo el viaje Panteón — ningún día por dentro
- **Tramo de más de 25 min andando sin transporte** (970): 2027-01-02 · 1 día · FT · pool sin nada, día 1, 17:30 Piazza del Popolo — 26 min andando ‖ 2027-01-02 · 1 día · FT · pool Coliseo, día 1, 18:45 Piazza del Popolo — 26 min andando ‖ 2027-01-03 · 1 día · FT · pool sin nada, día 1, 17:30 Piazza del Popolo — 26 min andando
- **El mismo restaurante dos veces en el viaje** (62): 2027-01-02 · 1 día · FT · pool sin nada, día 1 Armando al Pantheon — día 1 (comida), día 1 (cena) ‖ 2027-01-05 · 1 día · FT · pool sin nada, día 1 Armando al Pantheon — día 1 (comida), día 1 (cena) ‖ 2027-01-09 · 1 día · FT · pool sin nada, día 1 Armando al Pantheon — día 1 (comida), día 1 (cena)
- **Lugar del pool fuera de la ruta** (27): 2027-03-01 · 1 día · pool Coliseo + Vaticanos, día 1 Coliseo — No te dio tiempo ‖ 2027-03-02 · 1 día · pool Coliseo + Vaticanos, día 1 Coliseo — No te dio tiempo ‖ 2027-03-04 · 1 día · pool Coliseo + Vaticanos, día 1 Coliseo — No te dio tiempo

## Ejemplos (martes 16 de marzo de 2027, sin Free Tour)

### 1 día, sin nada marcado

**Día 1**

- 08:00 Arco de Constantino
- 08:20 Coliseo — por fuera
- 08:50 Foro Romano visto desde Via dei Fori Imperiali — por fuera
- 09:10 Plaza Venecia
- 09:30 Altar de la Patria
- 12:00 Via dei Fori Imperiali
- 13:00 Comida
- 14:30 Piazza Navona
- 15:10 Panteón — por fuera
- 15:35 Fontana de Trevi
- 16:15 Plaza de España
- 17:00 Piazza del Popolo
- 17:55 Terraza del Pincio
- 18:50 Plaza de España (noche)
- 19:25 Pasea y piérdete por el Tridente
- 20:00 Cena

### 1 día, con los Museos Vaticanos marcados

**Día 1**

- 08:00 Museos Vaticanos y Capilla Sixtina
- 11:15 Plaza de San Pedro
- 11:50 Basílica de San Pedro
- 13:15 Comida
- 14:45 Puente Sant'Angelo
- 15:15 Piazza Navona
- 15:55 Panteón — por fuera
- 16:20 Fontana de Trevi
- 17:10 Piazza del Popolo
- 17:45 Jardines del Pincio
- 18:25 Terraza del Pincio
- 19:00 Plaza de España (noche)
- 19:35 Pasea y piérdete por el Tridente
- 20:00 Cena

### 2 días, sin nada marcado

**Día 1**

- 08:00 Museos Vaticanos y Capilla Sixtina — por fuera
- 08:30 Plaza de San Pedro
- 08:50 Cúpula de San Pedro — por fuera
- 09:05 Basílica de San Pedro
- 11:40 Borgo Pio
- 12:30 Comida
- 14:05 Via della Conciliazione — de camino
- 14:25 Puente Sant'Angelo
- 14:35 Castillo de Sant'Angelo — por fuera
- 15:10 San Pietro in Montorio y Tempietto de Bramante
- 15:35 Fontana dell'Acqua Paola
- 17:55 Mirador del Janículo
- 18:55 Iglesia de Santa Maria in Trastevere
- 19:15 Trastevere
- 20:30 Cena
- 22:00 Trastevere de noche

**Día 2**

- 08:30 Coliseo
- 10:00 Arco de Constantino
- 10:25 Foro Romano y Palatino
- 12:05 Plaza del Campidoglio
- 12:25 Plaza Venecia — de camino
- 12:40 Altar de la Patria
- 13:30 Comida
- 14:50 Barrio Judío
- 15:20 Fuente de las Tortugas — de camino
- 15:35 Largo di Torre Argentina
- 15:55 Iglesia de Santa Maria sopra Minerva
- 16:10 Elefantino de Bernini — de camino
- 16:25 Panteón
- 17:00 Iglesia de San Luigi dei Francesi
- 17:20 Piazza Navona
- 18:00 Campo de' Fiori
- 20:00 Cena
- 21:30 Fontana de Trevi (noche)
- 22:25 Plaza de España (noche)

### 2 días, con Coliseo y Vaticanos marcados

**Día 1**

- 08:00 Museos Vaticanos y Capilla Sixtina
- 11:15 Plaza de San Pedro
- 11:35 Cúpula de San Pedro — por fuera
- 11:50 Basílica de San Pedro
- 13:00 Comida
- 14:35 Via della Conciliazione — de camino
- 14:55 Puente Sant'Angelo
- 15:05 Castillo de Sant'Angelo — por fuera
- 15:40 San Pietro in Montorio y Tempietto de Bramante
- 16:05 Fontana dell'Acqua Paola
- 17:55 Mirador del Janículo
- 18:55 Iglesia de Santa Maria in Trastevere
- 19:15 Trastevere
- 20:30 Cena
- 22:00 Trastevere de noche

**Día 2**

- 08:30 Coliseo
- 10:00 Arco de Constantino
- 10:25 Foro Romano y Palatino
- 12:05 Plaza del Campidoglio
- 12:25 Plaza Venecia — de camino
- 12:40 Altar de la Patria
- 13:30 Comida
- 14:50 Barrio Judío
- 15:20 Fuente de las Tortugas — de camino
- 15:35 Largo di Torre Argentina
- 15:55 Iglesia de Santa Maria sopra Minerva
- 16:10 Elefantino de Bernini — de camino
- 16:25 Panteón
- 17:00 Iglesia de San Luigi dei Francesi
- 17:20 Piazza Navona
- 18:00 Campo de' Fiori
- 20:00 Cena
- 21:30 Fontana de Trevi (noche)
- 22:25 Plaza de España (noche)

