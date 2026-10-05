# Diferencias entre el motor y la simulación de los viajes de 2,5 días

Generado por `scripts/destino/viajes25Motor.mjs`. Compara parada a parada lo que saca el motor con `docs/dias/VIAJES_2_5_SIMULACION.html`. Cada diferencia lleva la causa que apunta el motor (su registro); sin causa apuntada, lo dice.
**239 diferencias** (64 sin causa apuntada). Por viaje: invierno 46 · primavera 41 · verano 56 · otono 52 · navidad 44.


## Invierno · Viernes 15 (tarde), sábado 16 y domingo 17 de enero de 2027

### Viernes 15 · Tarde · llegada: motor DT-medio · A · tarde_A_de_invierno · unica · noche:Fontana de Trevi (noche) / simulación DT-medio · tarde A de invierno

- Falta en el motor: 16:10 Pasea y piérdete por los Jardines del Pincio (colchón) (15 min) — El motor quita: traslado_un_taxi (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Coliseo (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje).
- Hora de «Santa Maria del Popolo (los Caravaggio)»: simulación 17:30, motor 17:25 — De 17:05 a 17:25: los márgenes: lo andado desde Terraza del Pincio más 10 min.
- Hora de «Piazza del Popolo»: simulación 18:05, motor 18:00 — De 17:40 a 18:00: los márgenes: lo andado desde Santa Maria del Popolo (los Caravaggio) más 10 min.
- Falta en el motor: 18:30 Via del Babuino y Via Margutta (10 min) — El motor quita: traslado_un_taxi (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Coliseo (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje).
- Hora de «Pasea y piérdete por Via Condotti y el Tridente iluminados (colchón)»: simulación 18:50, motor 19:00 — De 18:25 a 19:00, 40 → 30 min: los márgenes: lo andado desde Paseo por Via del Babuino más 10 min + el colchón se acorta 10 min: faltaban 10 min antes de Il Gabriello.
- Hora de «Cena: Il Gabriello (o Poldo e Gianna Osteria), en el Tridente»: simulación 19:35, motor 20:00 — De 19:20 a 20:00: la cena sigue al mirador: se mueve lo mismo que el atardecer + la cena va a en punto o a y media.
- Falta en el motor: 21:35 Coliseo iluminado (20 min) — El motor quita: traslado_un_taxi (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Coliseo (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje).
- Sobra en el motor (no está en la simulación): 16:10 Pasea y piérdete por el Tridente (10 min) — Nuevo: quedaban 25 min libres antes de Terraza del Pincio: se mete el colchón de la zona.
- Sobra en el motor (no está en la simulación): 18:40 Paseo por Via del Babuino (10 min) — De 18:05 a 18:40, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Piazza del Popolo más 10 min.
- Sobra en el motor (no está en la simulación): 21:55 Fontana de Trevi (noche) (20 min) — Nuevo: Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

### Sábado 16 · Día entero: motor D2 · A · normal · noche:Plaza de España (noche) / simulación D2 · tarde A

- Hora de «Museos Vaticanos y Capilla Sixtina»: simulación 08:00, motor 07:45 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Minutos de «Museos Vaticanos y Capilla Sixtina»: simulación 180, motor 15 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Cómo de «Museos Vaticanos y Capilla Sixtina»: simulación «por dentro (turno de las 8:00)», motor «por fuera» — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Hora de «Via della Conciliazione»: simulación 15:00, motor 15:10 — De 15:00 a 15:10, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Cómo de «Via della Conciliazione»: simulación «de camino», motor «-» — De 15:00 a 15:10, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Hora de «Castillo de Sant'Angelo»: simulación 15:30, motor 15:40 — De 15:30 a 15:40: los márgenes: lo andado desde Paseo por Via della Conciliazione más 10 min.
- Hora de «Puente Sant'Angelo»: simulación 16:05, motor 16:15 — De 16:05 a 16:15: los márgenes: lo andado desde Castillo de Sant'Angelo más 10 min.
- Hora de «Isla Tiberina»: simulación 17:05, motor 17:15 — De 17:05 a 17:15: los márgenes: lo andado desde traslado_el_bus_23_por_el_lungotevere más 10 min.
- Hora de «Santa Maria in Trastevere»: simulación 17:45, motor 17:55 — De 17:45 a 17:55: los márgenes: lo andado desde Isla Tiberina más 10 min.
- Hora de «Pasea y piérdete por Trastevere iluminado (colchón)»: simulación 18:20, motor 18:35 — De 18:25 a 18:35, 80 → 70 min: los márgenes: lo andado desde Iglesia de Santa Maria in Trastevere más 10 min + el colchón se acorta 10 min: faltaban 10 min antes de Tonnarello.
- Minutos de «Pasea y piérdete por Trastevere iluminado (colchón)»: simulación 80, motor 70 — De 18:25 a 18:35, 80 → 70 min: los márgenes: lo andado desde Iglesia de Santa Maria in Trastevere más 10 min + el colchón se acorta 10 min: faltaban 10 min antes de Tonnarello.
- Falta en el motor: 22:00 Piazza Navona de noche (30 min) — El motor quita: Piazza Navona (noche) (Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje).
- Sobra en el motor (no está en la simulación): 08:00 Museos Vaticanos y Capilla Sixtina (180 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 22:10 Plaza de España (noche) (20 min) — Nuevo: Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

### Domingo 17 · Día entero: motor D1 · A · normal · AB · noche:Coliseo (noche) · noche:Panteón (noche) / simulación D1 · tarde A y B

- Hora de «Coliseo»: simulación 08:30, motor 08:15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Minutos de «Coliseo»: simulación 75, motor 15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Cómo de «Coliseo»: simulación «por dentro (turno)», motor «por fuera» — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Hora de «Plaza del Campidoglio»: simulación 12:20, motor 12:30 — SIN CAUSA APUNTADA
- Hora de «Piazza Venezia»: simulación 12:40, motor 12:50 — SIN CAUSA APUNTADA
- Hora de «Altar de la Patria»: simulación 13:00, motor 13:10 — SIN CAUSA APUNTADA
- Hora de «Comida: Nonna Betta (o Giggetto), en el Barrio Judío»: simulación 13:50, motor 14:00 — SIN CAUSA APUNTADA
- Hora de «Barrio Judío»: simulación 15:00, motor 15:15 — SIN CAUSA APUNTADA
- Hora de «Fuente de las Tortugas»: simulación 15:35, motor 15:50 — SIN CAUSA APUNTADA
- Hora de «Largo di Torre Argentina»: simulación 15:55, motor 16:10 — SIN CAUSA APUNTADA
- Hora de «Iglesia del Gesù»: simulación 16:25, motor 16:40 — SIN CAUSA APUNTADA
- Hora de «Elefantino de Bernini»: simulación 16:55, motor 17:05 — SIN CAUSA APUNTADA
- Hora de «Santa Maria sopra Minerva»: simulación 17:00, motor 17:10 — SIN CAUSA APUNTADA
- Hora de «San Luigi dei Francesi»: simulación 17:20, motor 17:35 — SIN CAUSA APUNTADA
- Hora de «Panteón»: simulación 17:55, motor 18:10 — SIN CAUSA APUNTADA
- Hora de «Piazza Navona»: simulación 18:50, motor 19:10 — 45 → 65 min: se queda más rato 20 min: quedaban 20 min libres antes de Armando al Pantheon y no cabía un colchón.
- Minutos de «Piazza Navona»: simulación 45, motor 65 — 45 → 65 min: se queda más rato 20 min: quedaban 20 min libres antes de Armando al Pantheon y no cabía un colchón.
- Hora de «Cena: Pizzeria Da Baffetto»: simulación 20:00, motor 20:30 — Armando al Pantheon cierra ese día o a esa hora: va Pizzeria Da Baffetto.
- Falta en el motor: 21:50 Fontana de Trevi iluminada (20 min) — El motor quita: Fontana de Trevi (noche) (Coliseo (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Plaza de España (noche) (Plaza de España (noche) ya salió de noche en el viaje: la nocturna pasa a Panteón (noche)); Panteón (noche) (la noche (23:35) pasa de la hora límite de la noche).
- Falta en el motor: 22:30 Plaza de España de noche (20 min) — El motor quita: Fontana de Trevi (noche) (Coliseo (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Plaza de España (noche) (Plaza de España (noche) ya salió de noche en el viaje: la nocturna pasa a Panteón (noche)); Panteón (noche) (la noche (23:35) pasa de la hora límite de la noche).
- Sobra en el motor (no está en la simulación): 08:30 Coliseo (75 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 22:35 Coliseo (noche) (20 min) — Nuevo: Coliseo (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

## Primavera · Martes 13 y miércoles 14 enteros, y jueves 15 de abril de 2027 por la mañana

### Martes 13 · Día entero: motor D3 · D · normal · CD · noche:Fontana de Trevi (noche) / simulación D3 · C y D

- Minutos de comida: simulación 45, motor 65 — 45 → 65 min: la comida se alarga 20 min: quedaban 20 min libres antes de Llegada a Museos Vaticanos y Capilla Sixtina.
- Hora de «Museos Vaticanos y Capilla Sixtina»: simulación 15:00, motor 14:45 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Minutos de «Museos Vaticanos y Capilla Sixtina»: simulación 150, motor 15 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Cómo de «Museos Vaticanos y Capilla Sixtina»: simulación «por dentro (turno de las 15:00)», motor «por fuera» — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Hora de «Plaza de San Pedro»: simulación 18:00, motor 17:40 — De 18:00 a 17:40, 10 → 5 min, normal → camino: los márgenes (lo andado más 10 min) antes de Puente Sant'Angelo. los márgenes del día lo aprietan hasta «de camino» aunque sea la primera vez que sale Plaza de San Pedro en el viaje (nivel 1): es lo último antes de quitarlo.
- Minutos de «Plaza de San Pedro»: simulación 10, motor 5 — De 18:00 a 17:40, 10 → 5 min, normal → camino: los márgenes (lo andado más 10 min) antes de Puente Sant'Angelo. los márgenes del día lo aprietan hasta «de camino» aunque sea la primera vez que sale Plaza de San Pedro en el viaje (nivel 1): es lo último antes de quitarlo.
- Cómo de «Plaza de San Pedro»: simulación «-», motor «de camino» — De 18:00 a 17:40, 10 → 5 min, normal → camino: los márgenes (lo andado más 10 min) antes de Puente Sant'Angelo. los márgenes del día lo aprietan hasta «de camino» aunque sea la primera vez que sale Plaza de San Pedro en el viaje (nivel 1): es lo último antes de quitarlo.
- Hora de «Basílica de San Pedro (con el control)»: simulación 18:25, motor 18:00 — De 18:25 a 18:00: los márgenes (lo andado más 10 min) antes de Puente Sant'Angelo.
- Falta en el motor: 19:15 Via della Conciliazione (10 min) — El motor quita: Piazza Navona (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Paseo por Via della Conciliazione (no cabe antes de Puente Sant'Angelo (19:25) con los márgenes); Castillo de Sant'Angelo (no cabe antes de Puente Sant'Angelo (19:25) con los márgenes).
- Falta en el motor: 19:45 Castillo de Sant'Angelo (10 min) — El motor quita: Piazza Navona (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Paseo por Via della Conciliazione (no cabe antes de Puente Sant'Angelo (19:25) con los márgenes); Castillo de Sant'Angelo (no cabe antes de Puente Sant'Angelo (19:25) con los márgenes).
- Hora de «Puente Sant'Angelo»: simulación 20:10, motor 19:25 — De 20:10 a 19:25, 15 → 45 min: el atardecer: llega con el sol (19:48 menos 25 min) + se queda más rato 30 min: quedaban 30 min libres antes de L'Arcangelo y no cabía un colchón.
- Minutos de «Puente Sant'Angelo»: simulación 15, motor 45 — De 20:10 a 19:25, 15 → 45 min: el atardecer: llega con el sol (19:48 menos 25 min) + se queda más rato 30 min: quedaban 30 min libres antes de L'Arcangelo y no cabía un colchón.
- Hora de «Cena: L'Arcangelo (o Osteria dell'Angelo), en Prati»: simulación 20:45, motor 20:30 — De 20:45 a 20:30: la cena sigue al mirador: se mueve lo mismo que el atardecer.
- Falta en el motor: 22:45 Piazza Navona de noche (15 min) — El motor quita: Piazza Navona (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Paseo por Via della Conciliazione (no cabe antes de Puente Sant'Angelo (19:25) con los márgenes); Castillo de Sant'Angelo (no cabe antes de Puente Sant'Angelo (19:25) con los márgenes).
- Sobra en el motor (no está en la simulación): 15:00 Museos Vaticanos y Capilla Sixtina (150 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 22:50 Fontana de Trevi (noche) (20 min) — Nuevo: Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

### Miércoles 14 · Día entero: motor D1-FT · D · normal · noche:Plaza de España (noche) / simulación D1-FT · tarde D

- Hora de «Coliseo»: simulación 08:30, motor 08:15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Minutos de «Coliseo»: simulación 75, motor 15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Cómo de «Coliseo»: simulación «por dentro (turno)», motor «por fuera» — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Hora de «Plaza del Campidoglio»: simulación 12:20, motor 12:30 — SIN CAUSA APUNTADA
- Hora de «Piazza Venezia»: simulación 12:40, motor 12:50 — SIN CAUSA APUNTADA
- Hora de «Altar de la Patria»: simulación 13:00, motor 13:10 — SIN CAUSA APUNTADA
- Hora de «Comida: Giggetto al Portico d'Ottavia (o Nonna Betta)»: simulación 13:50, motor 14:00 — 60 → 45 min: la comida se acorta 15 min: faltaban 75 min antes de Mirador del Janículo.
- Minutos de comida: simulación 60, motor 45 — 60 → 45 min: la comida se acorta 15 min: faltaban 75 min antes de Mirador del Janículo.
- Hora de «Teatro de Marcelo»: simulación 15:40, motor 15:45 — De 16:00 a 15:45: los márgenes (lo andado más 10 min) antes de Mirador del Janículo.
- Hora de «Isla Tiberina»: simulación 16:00, motor 16:10 — De 16:25 a 16:10: los márgenes (lo andado más 10 min) antes de Mirador del Janículo.
- Hora de «Santa Maria in Trastevere»: simulación 16:40, motor 16:50 — De 17:05 a 16:50: los márgenes (lo andado más 10 min) antes de Mirador del Janículo.
- Falta en el motor: 17:10 Pasea y piérdete por Trastevere (45 min) — El motor quita: Fontana de Trevi (noche) (Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Pasea y piérdete por Trastevere (no cabe antes de Mirador del Janículo (19:25) con los márgenes).
- Hora de «San Pietro in Montorio y el Tempietto»: simulación 18:20, motor 17:30 — De 19:00 a 17:30: los márgenes (lo andado más 10 min) antes de Mirador del Janículo.
- Hora de «Fontana dell'Acqua Paola»: simulación 18:55, motor 18:05 — De 19:35 a 18:05: los márgenes (lo andado más 10 min) antes de Mirador del Janículo.
- Hora de «Cena: Da Enzo al 29 (o Tonnarello)»: simulación 20:35, motor 21:00 — De 22:00 a 21:00: la cena sigue al mirador: se mueve lo mismo que el atardecer + la cena va a en punto o a y media.
- Falta en el motor: 22:35 Fontana de Trevi iluminada (20 min) — El motor quita: Fontana de Trevi (noche) (Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Pasea y piérdete por Trastevere (no cabe antes de Mirador del Janículo (19:25) con los márgenes).
- Sobra en el motor (no está en la simulación): 08:30 Coliseo (75 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 18:45 La Passeggiata del Gianicolo (30 min) — De 20:15 a 18:45, 15 → 30 min: el colchón se acorta 5 min más: el sol (19:49) no espera + los márgenes (lo andado más 10 min) antes de Mirador del Janículo + el colchón se alarga 20 min: quedaban 20 min libres antes de Mirador del Janículo.
- Sobra en el motor (no está en la simulación): 20:05 Pasea y piérdete por el Gianicolo (20 min) — Nuevo: quedaban 30 min libres antes de Trattoria Da Enzo al 29: se mete el colchón de la zona.
- Sobra en el motor (no está en la simulación): 23:00 Plaza de España (noche) (20 min) — Nuevo: Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

### Jueves 15 · Mañana · salida: motor DM-medio · D · manana · unica / simulación DM-medio

- Hora de «Plaza del Quirinal (la vista de San Pedro)»: simulación 09:20, motor 09:25 — SIN CAUSA APUNTADA
- Hora de «Pasea y piérdete por Monti (Via Panisperna y la Piazza Madonna dei Monti)»: simulación 09:40, motor 10:00 — SIN CAUSA APUNTADA
- Hora de «San Pietro in Vincoli (el Moisés de Miguel Ángel)»: simulación 11:00, motor 11:15 — SIN CAUSA APUNTADA
- Hora de «Santa Maria Maggiore»: simulación 11:40, motor 12:00 — SIN CAUSA APUNTADA
- Hora de «Comida: Trattoria Monti (o La Boccaccia)»: simulación 12:45, motor 12:55 — SIN CAUSA APUNTADA

## Verano · Jueves 15 (tarde), viernes 16 y sábado 17 de julio de 2027

### Jueves 15 · Tarde · llegada: motor DT-medio · D · tarde · noche:Fontana de Trevi (noche) / simulación DT-medio · tarde D

- Falta en el motor: 16:30 Via del Babuino y Via Margutta (10 min) — El motor quita: traslado_un_taxi (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Coliseo (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Fontana de Trevi (noche) (la noche (23:55) pasa de la hora límite de la noche).
- Hora de «Piazza del Popolo»: simulación 16:55, motor 17:10 — De 17:00 a 17:10: los márgenes: lo andado desde Paseo por Via del Babuino más 10 min.
- Hora de «Santa Maria del Popolo (los Caravaggio)»: simulación 17:25, motor 17:40 — De 17:30 a 17:40: los márgenes: lo andado desde Piazza del Popolo más 10 min.
- Hora de «Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines (colchón)»: simulación 18:05, motor 18:30 — De 18:20 a 18:30, 65 → 85 min: los márgenes: lo andado desde Santa Maria del Popolo (los Caravaggio) más 10 min + el colchón se alarga 20 min: quedaban 20 min libres antes de Terraza del Pincio.
- Minutos de «Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines (colchón)»: simulación 115, motor 85 — De 18:20 a 18:30, 65 → 85 min: los márgenes: lo andado desde Santa Maria del Popolo (los Caravaggio) más 10 min + el colchón se alarga 20 min: quedaban 20 min libres antes de Terraza del Pincio.
- Hora de «Trinità dei Monti y su mirador sobre la Plaza de España»: simulación 21:10, motor 21:15 — De 20:45 a 21:15: los márgenes: lo andado desde Terraza del Pincio más 10 min.
- Hora de «Bajar la escalinata de la Plaza de España»: simulación 21:25, motor 21:40 — De 21:00 a 21:40, 5 → 10 min, camino → fuera: primera vez que sale Plaza de España en el viaje (nivel 1): va como parada, no de camino + los márgenes: lo andado desde Trinità dei Monti y su mirador sobre la Plaza de España más 10 min.
- Minutos de «Bajar la escalinata de la Plaza de España»: simulación 5, motor 10 — De 21:00 a 21:40, 5 → 10 min, camino → fuera: primera vez que sale Plaza de España en el viaje (nivel 1): va como parada, no de camino + los márgenes: lo andado desde Trinità dei Monti y su mirador sobre la Plaza de España más 10 min.
- Cómo de «Bajar la escalinata de la Plaza de España»: simulación «de camino», motor «por fuera» — De 21:00 a 21:40, 5 → 10 min, camino → fuera: primera vez que sale Plaza de España en el viaje (nivel 1): va como parada, no de camino + los márgenes: lo andado desde Trinità dei Monti y su mirador sobre la Plaza de España más 10 min.
- Hora de «Cena: Il Gabriello (o Poldo e Gianna Osteria), en el Tridente»: simulación 21:45, motor 22:00 — De 21:20 a 22:00: la cena sigue al mirador: se mueve lo mismo que el atardecer.
- Falta en el motor: 23:45 Coliseo iluminado (20 min) — El motor quita: traslado_un_taxi (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Coliseo (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Fontana de Trevi (noche) (la noche (23:55) pasa de la hora límite de la noche).
- Sobra en el motor (no está en la simulación): 16:40 Paseo por Via del Babuino (10 min) — De 16:30 a 16:40, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Plaza de España más 10 min.

### Viernes 16 · Día entero: motor D1 · D · normal / simulación D1 · tarde D (nueva)

- Hora de «Coliseo»: simulación 08:30, motor 08:15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Minutos de «Coliseo»: simulación 75, motor 15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Cómo de «Coliseo»: simulación «por dentro (turno)», motor «por fuera» — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Hora de «Plaza del Campidoglio»: simulación 12:20, motor 12:30 — SIN CAUSA APUNTADA
- Hora de «Piazza Venezia»: simulación 12:40, motor 12:50 — SIN CAUSA APUNTADA
- Hora de «Altar de la Patria»: simulación 13:00, motor 13:10 — SIN CAUSA APUNTADA
- Hora de «Comida: Nonna Betta (o Giggetto), en el Barrio Judío»: simulación 13:50, motor 14:00 — 60 → 45 min: la comida se acorta 15 min: faltaban 20 min antes de Ponte Sisto.
- Minutos de comida: simulación 60, motor 45 — 60 → 45 min: la comida se acorta 15 min: faltaban 20 min antes de Ponte Sisto.
- Hora de «Barrio Judío»: simulación 15:00, motor 15:15 — SIN CAUSA APUNTADA
- Hora de «Fuente de las Tortugas»: simulación 15:35, motor 15:50 — SIN CAUSA APUNTADA
- Hora de «Largo di Torre Argentina»: simulación 15:55, motor 16:10 — SIN CAUSA APUNTADA
- Hora de «Iglesia del Gesù»: simulación 16:25, motor 16:40 — SIN CAUSA APUNTADA
- Hora de «Elefantino de Bernini»: simulación 16:55, motor 17:05 — SIN CAUSA APUNTADA
- Hora de «Santa Maria sopra Minerva»: simulación 17:00, motor 17:10 — SIN CAUSA APUNTADA
- Hora de «San Luigi dei Francesi»: simulación 17:20, motor 17:35 — SIN CAUSA APUNTADA
- Hora de «Panteón»: simulación 17:55, motor 18:10 — SIN CAUSA APUNTADA
- Hora de «Piazza Navona»: simulación 18:50, motor 19:10 — SIN CAUSA APUNTADA
- Hora de «Campo de' Fiori»: simulación 19:40, motor 20:00 — SIN CAUSA APUNTADA
- Minutos de «Campo de' Fiori»: simulación 25, motor 20 — SIN CAUSA APUNTADA
- Hora de «Ponte Sisto, al atardecer»: simulación 20:20, motor 20:40 — SIN CAUSA APUNTADA
- Restaurante: simulación Da Enzo al 29, motor Dar Filettaro a Santa Barbara — SIN CAUSA APUNTADA
- Hora de «Cena: Da Enzo al 29 (o Tonnarello), en Trastevere»: simulación 21:05, motor 21:30 — SIN CAUSA APUNTADA
- Hora de «Fontana de Trevi iluminada»: simulación 23:10, motor 23:30 — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 08:30 Coliseo (75 min) — SIN CAUSA APUNTADA

### Sábado 17 · Día entero: motor D2 · D · normal · noche:Plaza de España (noche) / simulación D2 · tarde D

- Hora de «Museos Vaticanos y Capilla Sixtina»: simulación 08:00, motor 07:45 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Minutos de «Museos Vaticanos y Capilla Sixtina»: simulación 180, motor 15 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Cómo de «Museos Vaticanos y Capilla Sixtina»: simulación «por dentro (turno de las 8:00)», motor «por fuera» — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Minutos de comida: simulación 60, motor 50 — 60 → 50 min: la comida se acorta 10 min: faltaban 10 min antes de Mirador del Janículo.
- Hora de «Via della Conciliazione»: simulación 14:45, motor 14:55 — De 14:45 a 14:55, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Cómo de «Via della Conciliazione»: simulación «de camino», motor «-» — De 14:45 a 14:55, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Hora de «Castillo de Sant'Angelo»: simulación 15:15, motor 15:25 — De 15:15 a 15:25: los márgenes: lo andado desde Paseo por Via della Conciliazione más 10 min.
- Hora de «Puente Sant'Angelo»: simulación 15:50, motor 16:00 — De 15:50 a 16:00: los márgenes: lo andado desde Castillo de Sant'Angelo más 10 min.
- Hora de «Santa Maria in Trastevere»: simulación 16:55, motor 17:00 — De 16:55 a 17:00: los márgenes: lo andado desde traslado_el_bus_23_por_el_lungotevere más 10 min.
- Hora de «Pasea y piérdete por Trastevere»: simulación 17:30, motor 17:40 — De 17:35 a 17:40: los márgenes: lo andado desde Iglesia de Santa Maria in Trastevere más 10 min.
- Falta en el motor: 18:45 San Pietro in Montorio y el Tempietto (5 min) — El motor quita: Trastevere de noche (Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Plaza de España (noche) (la noche (24:10) pasa de la hora límite de la noche).
- Hora de «Fontana dell'Acqua Paola»: simulación 19:05, motor 19:25 — De 19:05 a 19:25: los márgenes: lo andado desde El mirador de San Pietro in Montorio más 10 min.
- Hora de «La Passeggiata del Gianicolo (colchón)»: simulación 19:25, motor 20:05 — De 19:45 a 20:05: los márgenes: lo andado desde Fontana dell'Acqua Paola más 10 min.
- Minutos de «La Passeggiata del Gianicolo (colchón)»: simulación 35, motor 15 — De 19:45 a 20:05: los márgenes: lo andado desde Fontana dell'Acqua Paola más 10 min.
- Hora de «Mirador del Janículo, al atardecer»: simulación 20:20, motor 20:30 — De 20:10 a 20:30: el atardecer: llega con el sol (20:43 menos 25 min).
- Hora de «Cena: Tonnarello, en Trastevere»: simulación 21:20, motor 22:00 — De 21:30 a 22:00: la cena sigue al mirador: se mueve lo mismo que el atardecer + la cena va a en punto o a y media.
- Falta en el motor: 23:00 Trastevere de noche (30 min) — El motor quita: Trastevere de noche (Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Plaza de España (noche) (la noche (24:10) pasa de la hora límite de la noche).
- Sobra en el motor (no está en la simulación): 08:00 Museos Vaticanos y Capilla Sixtina (180 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 19:00 El mirador de San Pietro in Montorio (10 min) — De 18:45 a 19:00, 5 → 10 min, camino → fuera: primera vez que sale San Pietro in Montorio y Tempietto de Bramante en el viaje (nivel 2): va como parada, no de camino + San Pietro in Montorio y Tempietto de Bramante no se ve desde la calle cuando está cerrado: la parada es El mirador de San Pietro in Montorio + los márgenes: lo andado desde Pasea y piérdete por Trastevere más 10 min.
- Sobra en el motor (no está en la simulación): 21:10 Pasea y piérdete por el Gianicolo (15 min) — Nuevo: quedaban 25 min libres antes de Tonnarello: se mete el colchón de la zona.

## Otoño · Martes 12 y miércoles 13 enteros, y jueves 14 de octubre de 2027 por la mañana

### Martes 12 · Día entero: motor D2 · B · normal · noche:Fontana de Trevi (noche) / simulación D2 · tarde B

- Hora de «Museos Vaticanos y Capilla Sixtina»: simulación 08:00, motor 07:45 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Minutos de «Museos Vaticanos y Capilla Sixtina»: simulación 180, motor 15 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Cómo de «Museos Vaticanos y Capilla Sixtina»: simulación «por dentro (turno de las 8:00)», motor «por fuera» — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Minutos de comida: simulación 60, motor 45 — 60 → 45 min: la comida se acorta 15 min: faltaban 40 min antes de Mirador del Janículo.
- Hora de «Via della Conciliazione»: simulación 14:45, motor 14:55 — De 14:45 a 14:55, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Cómo de «Via della Conciliazione»: simulación «de camino», motor «-» — De 14:45 a 14:55, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Hora de «Castillo de Sant'Angelo»: simulación 15:15, motor 15:25 — De 15:15 a 15:25: los márgenes: lo andado desde Paseo por Via della Conciliazione más 10 min.
- Hora de «Puente Sant'Angelo»: simulación 15:50, motor 16:00 — De 15:50 a 16:00: los márgenes: lo andado desde Castillo de Sant'Angelo más 10 min.
- Hora de «Santa Maria in Trastevere»: simulación 16:55, motor 17:00 — De 16:55 a 17:00: los márgenes: lo andado desde traslado_el_bus_23_por_el_lungotevere más 10 min.
- Falta en el motor: 17:35 San Pietro in Montorio y el Tempietto (5 min) — El motor quita: Trastevere de noche (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Fontana de Trevi (noche) (la noche (23:10) pasa de la hora límite de la noche).
- Hora de «Fontana dell'Acqua Paola»: simulación 17:55, motor 18:10 — De 17:55 a 18:10: los márgenes: lo andado desde El mirador de San Pietro in Montorio más 10 min.
- Hora de «Mirador del Janículo, al atardecer»: simulación 18:25, motor 18:50 — De 18:35 a 18:50: el atardecer: llega con el sol (18:34 menos 25 min).
- Hora de «Pasea y piérdete por Trastevere iluminado (colchón)»: simulación 19:20, motor 19:55 — De 19:40 a 19:55, 30 → 50 min: los márgenes: lo andado desde Mirador del Janículo más 10 min + el colchón se alarga 20 min: quedaban 20 min libres antes de Tonnarello.
- Minutos de «Pasea y piérdete por Trastevere iluminado (colchón)»: simulación 30, motor 50 — De 19:40 a 19:55, 30 → 50 min: los márgenes: lo andado desde Mirador del Janículo más 10 min + el colchón se alarga 20 min: quedaban 20 min libres antes de Tonnarello.
- Hora de «Cena: Tonnarello, en Trastevere»: simulación 20:15, motor 21:00 — De 20:30 a 21:00: la cena sigue al mirador: se mueve lo mismo que el atardecer + la cena va a en punto o a y media.
- Falta en el motor: 21:55 Trastevere de noche (30 min) — El motor quita: Trastevere de noche (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Fontana de Trevi (noche) (la noche (23:10) pasa de la hora límite de la noche).
- Sobra en el motor (no está en la simulación): 08:00 Museos Vaticanos y Capilla Sixtina (180 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 17:45 El mirador de San Pietro in Montorio (10 min) — De 17:35 a 17:45, 5 → 10 min, camino → fuera: primera vez que sale San Pietro in Montorio y Tempietto de Bramante en el viaje (nivel 2): va como parada, no de camino + San Pietro in Montorio y Tempietto de Bramante no se ve desde la calle cuando está cerrado: la parada es El mirador de San Pietro in Montorio + los márgenes: lo andado desde Iglesia de Santa Maria in Trastevere más 10 min.

### Miércoles 13 · Día entero: motor D1 · B · normal · AB / simulación D1 · tarde A y B

- Hora de «Coliseo»: simulación 08:30, motor 08:15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Minutos de «Coliseo»: simulación 75, motor 15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Cómo de «Coliseo»: simulación «por dentro (turno)», motor «por fuera» — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Hora de «Plaza del Campidoglio»: simulación 12:20, motor 12:30 — SIN CAUSA APUNTADA
- Hora de «Piazza Venezia»: simulación 12:40, motor 12:50 — SIN CAUSA APUNTADA
- Hora de «Altar de la Patria»: simulación 13:00, motor 13:10 — SIN CAUSA APUNTADA
- Hora de «Comida: Nonna Betta (o Giggetto), en el Barrio Judío»: simulación 13:50, motor 14:00 — SIN CAUSA APUNTADA
- Hora de «Barrio Judío»: simulación 15:00, motor 15:15 — SIN CAUSA APUNTADA
- Hora de «Fuente de las Tortugas»: simulación 15:35, motor 15:50 — SIN CAUSA APUNTADA
- Hora de «Largo di Torre Argentina»: simulación 15:55, motor 16:10 — SIN CAUSA APUNTADA
- Hora de «Iglesia del Gesù»: simulación 16:25, motor 16:40 — SIN CAUSA APUNTADA
- Hora de «Elefantino de Bernini»: simulación 16:55, motor 17:05 — SIN CAUSA APUNTADA
- Hora de «Santa Maria sopra Minerva»: simulación 17:00, motor 17:10 — SIN CAUSA APUNTADA
- Hora de «San Luigi dei Francesi»: simulación 17:20, motor 17:35 — SIN CAUSA APUNTADA
- Hora de «Panteón»: simulación 17:55, motor 18:10 — SIN CAUSA APUNTADA
- Hora de «Piazza Navona»: simulación 18:50, motor 19:10 — 45 → 65 min: se queda más rato 20 min: quedaban 20 min libres antes de Armando al Pantheon y no cabía un colchón.
- Minutos de «Piazza Navona»: simulación 45, motor 65 — 45 → 65 min: se queda más rato 20 min: quedaban 20 min libres antes de Armando al Pantheon y no cabía un colchón.
- Hora de «Cena: Armando al Pantheon (o Da Baffetto)»: simulación 20:00, motor 20:30 — SIN CAUSA APUNTADA
- Hora de «Fontana de Trevi iluminada»: simulación 21:50, motor 22:20 — SIN CAUSA APUNTADA
- Falta en el motor: 22:30 Plaza de España de noche (20 min) — El motor quita: Plaza de España (noche) (la noche (23:00) pasa de la hora límite de la noche).
- Sobra en el motor (no está en la simulación): 08:30 Coliseo (75 min) — SIN CAUSA APUNTADA

### Jueves 14 · Mañana · salida: motor DT-medio · B · manana · unica / simulación DT-medio · mañana

- Falta en el motor: 09:35 Via del Babuino y Via Margutta (10 min) — SIN CAUSA APUNTADA
- Hora de «Piazza del Popolo»: simulación 10:00, motor 10:20 — De 10:05 a 10:20: los márgenes: lo andado desde Paseo por Via del Babuino más 10 min.
- Hora de «Santa Maria del Popolo (los Caravaggio)»: simulación 10:35, motor 10:55 — De 10:40 a 10:55: los márgenes: lo andado desde Piazza del Popolo más 10 min.
- Hora de «Terraza del Pincio»: simulación 11:15, motor 11:35 — De 11:20 a 11:35: los márgenes: lo andado desde Santa Maria del Popolo (los Caravaggio) más 10 min.
- Hora de «Pasea y piérdete por los Jardines del Pincio (colchón)»: simulación 11:45, motor 12:10 — De 11:55 a 12:10: los márgenes: lo andado desde Terraza del Pincio (la vista de San Pedro con la luz de la mañana) más 10 min.
- Hora de «Trinità dei Monti y su mirador sobre la Plaza de España»: simulación 12:25, motor 12:55 — De 12:40 a 12:55: los márgenes: lo andado desde Pasea y piérdete por los Jardines del Pincio más 10 min.
- Hora de «Bajar la escalinata de la Plaza de España»: simulación 12:45, motor 13:25 — De 12:55 a 13:25, 5 → 10 min, camino → fuera: primera vez que sale Plaza de España en el viaje (nivel 1): va como parada, no de camino + los márgenes: lo andado desde Trinità dei Monti y su mirador sobre la Plaza de España más 10 min.
- Minutos de «Bajar la escalinata de la Plaza de España»: simulación 5, motor 10 — De 12:55 a 13:25, 5 → 10 min, camino → fuera: primera vez que sale Plaza de España en el viaje (nivel 1): va como parada, no de camino + los márgenes: lo andado desde Trinità dei Monti y su mirador sobre la Plaza de España más 10 min.
- Cómo de «Bajar la escalinata de la Plaza de España»: simulación «de camino», motor «por fuera» — De 12:55 a 13:25, 5 → 10 min, camino → fuera: primera vez que sale Plaza de España en el viaje (nivel 1): va como parada, no de camino + los márgenes: lo andado desde Trinità dei Monti y su mirador sobre la Plaza de España más 10 min.
- Hora de «Via Condotti»: simulación 12:50, motor 13:55 — De 13:05 a 13:55, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Bajar la escalinata de la Plaza de España más 10 min.
- Cómo de «Via Condotti»: simulación «de camino», motor «-» — De 13:05 a 13:55, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Bajar la escalinata de la Plaza de España más 10 min.
- Hora de «Comida: Poldo e Gianna Osteria (o Edy), en el Tridente»: simulación 13:15, motor 14:25 — De 13:35 a 14:25: los márgenes: lo andado desde Paseo por Via Condotti más 10 min.
- Sobra en el motor (no está en la simulación): 09:50 Paseo por Via del Babuino (10 min) — De 09:35 a 09:50, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Plaza de España más 10 min.

## Navidad · Viernes 17 (tarde), sábado 18 y domingo 19 de diciembre de 2027

### Viernes 17 · Tarde · llegada: motor DT-medio · A · tarde_A_de_invierno · unica · experiencia:mercadillos_navidenos · noche:Fontana de Trevi (noche) / simulación DT-medio · tarde A de invierno

- Falta en el motor: 18:05 Via del Babuino y Via Margutta (10 min) — El motor quita: traslado_un_taxi (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Coliseo (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje).
- Hora de «Luces de Navidad del Tridente (colchón)»: simulación 18:25, motor 18:50 — De 18:25 a 18:50, 40 → 55 min: experiencia: mercadillos_navidenos + los márgenes: lo andado desde Paseo por Via del Babuino más 10 min + el colchón se alarga 25 min: quedaban 25 min libres antes de Il Gabriello.
- Minutos de «Luces de Navidad del Tridente (colchón)»: simulación 40, motor 55 — De 18:25 a 18:50, 40 → 55 min: experiencia: mercadillos_navidenos + los márgenes: lo andado desde Paseo por Via del Babuino más 10 min + el colchón se alarga 25 min: quedaban 25 min libres antes de Il Gabriello.
- Hora de «Cena: Il Gabriello (o Poldo e Gianna Osteria), en el Tridente»: simulación 19:20, motor 20:00 — De 19:20 a 20:00: la cena, a la hora que dejan los márgenes + la cena va a en punto o a y media.
- Falta en el motor: 21:20 Coliseo iluminado (20 min) — El motor quita: traslado_un_taxi (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Coliseo (noche) (Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje).
- Sobra en el motor (no está en la simulación): 18:20 Paseo por Via del Babuino (10 min) — De 18:05 a 18:20, camino → normal: 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Piazza del Popolo más 10 min.
- Sobra en el motor (no está en la simulación): 21:55 Fontana de Trevi (noche) (20 min) — Nuevo: Fontana de Trevi (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

### Sábado 18 · Día entero: motor D2 · A · normal · experiencia:mercadillos_navidenos · noche:Plaza de España (noche) / simulación D2 · tarde A + Mercadillos

- Hora de «Museos Vaticanos y Capilla Sixtina»: simulación 08:00, motor 07:45 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Minutos de «Museos Vaticanos y Capilla Sixtina»: simulación 180, motor 15 — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Cómo de «Museos Vaticanos y Capilla Sixtina»: simulación «por dentro (turno de las 8:00)», motor «por fuera» — Nuevo: margen antes de el turno de Museos Vaticanos y Capilla Sixtina: llegada con tiempo.
- Hora de «Via della Conciliazione»: simulación 15:20, motor 15:30 — De 15:00 a 15:30, camino → normal: experiencia: mercadillos_navidenos + 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Cómo de «Via della Conciliazione»: simulación «de camino», motor «-» — De 15:00 a 15:30, camino → normal: experiencia: mercadillos_navidenos + 10 min andando: una calle de más de 5 min no es «de camino», es un paseo + los márgenes: lo andado desde Borghiciana Pastificio Artigianale más 10 min.
- Hora de «Castillo de Sant'Angelo»: simulación 15:50, motor 16:00 — De 15:30 a 16:00: experiencia: mercadillos_navidenos + los márgenes: lo andado desde Paseo por Via della Conciliazione más 10 min.
- Hora de «Puente Sant'Angelo»: simulación 16:25, motor 16:35 — De 16:05 a 16:35: experiencia: mercadillos_navidenos + los márgenes: lo andado desde Castillo de Sant'Angelo más 10 min.
- Hora de «Isla Tiberina»: simulación 17:25, motor 17:35 — De 17:05 a 17:35: experiencia: mercadillos_navidenos + los márgenes: lo andado desde traslado_el_bus_23_por_el_lungotevere más 10 min.
- Hora de «Santa Maria in Trastevere»: simulación 18:05, motor 18:15 — De 17:45 a 18:15: experiencia: mercadillos_navidenos + los márgenes: lo andado desde Isla Tiberina más 10 min.
- Hora de «Pasea y piérdete por Trastevere iluminado (colchón)»: simulación 18:40, motor 18:55 — De 18:25 a 18:55, 80 → 50 min: experiencia: mercadillos_navidenos + los márgenes: lo andado desde Iglesia de Santa Maria in Trastevere más 10 min + el colchón se acorta 10 min: faltaban 10 min antes de Tonnarello.
- Minutos de «Pasea y piérdete por Trastevere iluminado (colchón)»: simulación 65, motor 50 — De 18:25 a 18:55, 80 → 50 min: experiencia: mercadillos_navidenos + los márgenes: lo andado desde Iglesia de Santa Maria in Trastevere más 10 min + el colchón se acorta 10 min: faltaban 10 min antes de Tonnarello.
- Falta en el motor: 22:00 Piazza Navona de noche (con el mercadillo) (30 min) — El motor quita: Piazza Navona (noche) (Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje).
- Sobra en el motor (no está en la simulación): 08:00 Museos Vaticanos y Capilla Sixtina (180 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 22:10 Plaza de España (noche) (20 min) — Nuevo: Plaza de España (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

### Domingo 19 · Día entero: motor D1 · A · normal · AB · experiencia:mercadillos_navidenos · noche:Coliseo (noche) · noche:Panteón (noche) / simulación D1 · tarde A y B + Mercadillos

- Hora de «Coliseo»: simulación 08:30, motor 08:15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Minutos de «Coliseo»: simulación 75, motor 15 — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Cómo de «Coliseo»: simulación «por dentro (turno)», motor «por fuera» — Nuevo: margen antes de el turno de Coliseo: llegada con tiempo.
- Hora de «Plaza del Campidoglio»: simulación 12:20, motor 12:30 — SIN CAUSA APUNTADA
- Hora de «Santo Bambino de Aracoeli»: simulación 12:40, motor 12:45 — Nuevo: experiencia: mercadillos_navidenos.
- Hora de «Piazza Venezia»: simulación 12:50, motor 12:55 — De 12:50 a 12:55: experiencia: mercadillos_navidenos.
- Hora de «Altar de la Patria»: simulación 13:10, motor 13:15 — De 13:10 a 13:15: experiencia: mercadillos_navidenos.
- Hora de «Comida: Nonna Betta (o Giggetto), en el Barrio Judío»: simulación 14:00, motor 14:05 — De 14:00 a 14:05: experiencia: mercadillos_navidenos.
- Hora de «Barrio Judío»: simulación 15:10, motor 15:20 — De 15:15 a 15:20: experiencia: mercadillos_navidenos.
- Hora de «Fuente de las Tortugas»: simulación 15:45, motor 15:55 — De 15:50 a 15:55: experiencia: mercadillos_navidenos.
- Hora de «Largo di Torre Argentina»: simulación 16:05, motor 16:15 — De 16:10 a 16:15: experiencia: mercadillos_navidenos.
- Hora de «Iglesia del Gesù»: simulación 16:35, motor 16:45 — De 16:40 a 16:45: experiencia: mercadillos_navidenos.
- Hora de «Elefantino de Bernini»: simulación 17:05, motor 17:10 — De 17:05 a 17:10: experiencia: mercadillos_navidenos.
- Hora de «Santa Maria sopra Minerva»: simulación 17:10, motor 17:15 — De 17:10 a 17:15: experiencia: mercadillos_navidenos.
- Hora de «San Luigi dei Francesi»: simulación 17:30, motor 17:40 — De 17:35 a 17:40: experiencia: mercadillos_navidenos.
- Hora de «Panteón»: simulación 18:05, motor 18:15 — De 18:10 a 18:15: experiencia: mercadillos_navidenos.
- Hora de «Piazza Navona y su mercadillo navideño»: simulación 19:00, motor 19:15 — De 19:10 a 19:15, 45 → 60 min: experiencia: mercadillos_navidenos + se queda más rato 20 min: quedaban 20 min libres antes de Armando al Pantheon y no cabía un colchón.
- Minutos de «Piazza Navona y su mercadillo navideño»: simulación 40, motor 60 — De 19:10 a 19:15, 45 → 60 min: experiencia: mercadillos_navidenos + se queda más rato 20 min: quedaban 20 min libres antes de Armando al Pantheon y no cabía un colchón.
- Hora de «Cena: Pizzeria Da Baffetto»: simulación 20:00, motor 20:30 — Armando al Pantheon cierra ese día o a esa hora: va Pizzeria Da Baffetto.
- Falta en el motor: 21:50 Fontana de Trevi iluminada (20 min) — El motor quita: Fontana de Trevi (noche) (Coliseo (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Plaza de España (noche) (Plaza de España (noche) ya salió de noche en el viaje: la nocturna pasa a Panteón (noche)); Panteón (noche) (la noche (23:35) pasa de la hora límite de la noche).
- Falta en el motor: 22:30 Plaza de España de noche (20 min) — El motor quita: Fontana de Trevi (noche) (Coliseo (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje); Plaza de España (noche) (Plaza de España (noche) ya salió de noche en el viaje: la nocturna pasa a Panteón (noche)); Panteón (noche) (la noche (23:35) pasa de la hora límite de la noche).
- Sobra en el motor (no está en la simulación): 08:30 Coliseo (75 min) — SIN CAUSA APUNTADA
- Sobra en el motor (no está en la simulación): 22:35 Coliseo (noche) (20 min) — Nuevo: Coliseo (noche) es la primera nocturna imprescindible que aún no ha salido de noche en el viaje.

