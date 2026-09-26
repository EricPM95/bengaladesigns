# Revisión completa de rutas de Roma

Motor v3 tal cual está (sin tocar nada), generado el 2026-09-26 con `node scripts/destino/revisionCompleta.mjs`. 30 viajes: sobre todo de 2, 3 y 4 días, y dos de 1 y dos de 5 días como referencia. Todos con fecha, así que los horarios, los cierres y la puesta de sol son los de ese día.

Cómo leerlo:
- **Llega / Sale**: la hora a la que se llega a la parada y a la que se sale; **Dura**: el tiempo en ella.
- **Nota**: "de paso" (se pasa por delante, sin pararse), 🌅 el mirador del atardecer, "tiempo libre", y los avisos de horario.
- **Traslado**: solo los de más de 15 min andando, con los minutos (matriz del destino). El aviso de transporte del día (🚌) va arriba del día.
- 🍝 comida con su restaurante y barrio; 🍷 cena con su barrio (el motor elige el barrio de la cena, no el restaurante); 🌙 experiencia nocturna.
- Al final de cada viaje, lo que no entró; al final del documento, **lo que parece raro**, para decidir.

## Tranquilo frente a completo

Los mismos 30 viajes hechos en los dos ritmos: paradas por día (sin lo de paso ni las nocturnas) y, entre paréntesis, la media. En total, completo 586 paradas y tranquilo 463 (7.4 frente a 5.9 por día).

| Viaje | Días | Completo | Tranquilo | De menos |
|---|---|---|---|---|
| 1 | 2 | 9 · 8 (8.5) | 7 · 5 (6.0) | 5 |
| 2 | 2 | 9 · 8 (8.5) | 7 · 4 (5.5) | 6 |
| 3 | 2 | 4 · 7 (5.5) | 4 · 5 (4.5) | 2 |
| 4 | 2 | 7 · 9 (8.0) | 4 · 8 (6.0) | 4 |
| 5 | 2 | 9 · 9 (9.0) | 7 · 8 (7.5) | 3 |
| 6 | 2 | 9 · 9 (9.0) | 7 · 6 (6.5) | 5 |
| 7 | 2 | 9 · 8 (8.5) | 7 · 5 (6.0) | 5 |
| 8 | 2 | 8 · 9 (8.5) | 4 · 8 (6.0) | 5 |
| 9 | 2 | 4 · 7 (5.5) | 4 · 5 (4.5) | 2 |
| 10 | 3 | 8 · 8 · 6 (7.3) | 6 · 4 · 6 (5.3) | 6 |
| 11 | 3 | 8 · 8 · 6 (7.3) | 6 · 6 · 6 (6.0) | 4 |
| 12 | 3 | 8 · 8 · 6 (7.3) | 7 · 6 · 6 (6.3) | 3 |
| 13 | 3 | 9 · 8 · 4 (7.0) | 7 · 7 · 4 (6.0) | 3 |
| 14 | 3 | 8 · 8 · 6 (7.3) | 6 · 5 · 6 (5.7) | 5 |
| 15 | 3 | 7 · 7 · 9 (7.7) | 6 · 7 · 4 (5.7) | 6 |
| 16 | 3 | 8 · 8 · 6 (7.3) | 6 · 4 · 6 (5.3) | 6 |
| 17 | 3 | 8 · 8 · 6 (7.3) | 4 · 7 · 6 (5.7) | 5 |
| 18 | 3 | 6 · 8 · 8 (7.3) | 5 · 7 · 5 (5.7) | 5 |
| 19 | 4 | 8 · 8 · — · 5 (7.0) | 6 · 7 · — · 5 (6.0) | 3 |
| 20 | 4 | 8 · 8 · — · 5 (7.0) | 4 · 7 · — · 6 (5.7) | 4 |
| 21 | 4 | 4 · 7 · — · 6 (5.7) | 4 · 5 · — · 5 (4.7) | 3 |
| 22 | 4 | 8 · 9 · — · 7 (8.0) | 7 · 8 · — · 6 (7.0) | 3 |
| 23 | 4 | 8 · 8 · — · 5 (7.0) | 5 · 6 · — · 5 (5.3) | 5 |
| 24 | 4 | 8 · 8 · — · 6 (7.3) | 6 · 7 · — · 5 (6.0) | 4 |
| 25 | 4 | 8 · 8 · — · 5 (7.0) | 6 · 5 · — · 5 (5.3) | 5 |
| 26 | 4 | 8 · 9 · — · 5 (7.3) | 7 · 5 · — · 5 (5.7) | 5 |
| 27 | 1 | 10 (10.0) | 10 (10.0) | 0 |
| 28 | 1 | 9 (9.0) | 9 (9.0) | 0 |
| 29 | 5 | 7 · 8 · 10 · — · 6 (7.8) | 7 · 4 · 9 · — · 5 (6.3) | 6 |
| 30 | 5 | 4 · 8 · 8 · — · 7 (6.8) | 4 · 7 · 6 · — · 5 (5.5) | 5 |

## Índice

| Viaje | Días | Ritmo | Experiencias | Mes | Empieza | Pool |
|---|---|---|---|---|---|---|
| [1](#viaje-1) | 2 | completo | Arte | enero (invierno) | lunes 11 de enero | no |
| [2](#viaje-2) | 2 | tranquilo | Naturaleza | abril (primavera) | miércoles 14 de abril | no |
| [3](#viaje-3) | 2 | completo | Free Tour + Barrios | julio (verano) | sábado 17 de julio | no |
| [4](#viaje-4) | 2 | tranquilo | sin experiencias | febrero (invierno) | sábado 20 de febrero | Galería Borghese |
| [5](#viaje-5) | 2 | completo | Barrios | mayo (primavera) | miércoles 12 de mayo | Trastevere, Castillo de Sant'Angelo |
| [6](#viaje-6) | 2 | completo | Naturaleza | julio (verano) | lunes 12 de julio | no |
| [7](#viaje-7) | 2 | tranquilo | Arte + Barrios | enero (invierno) | miércoles 13 de enero | no |
| [8](#viaje-8) | 2 | completo | sin experiencias | abril (primavera) | sábado 17 de abril | no |
| [9](#viaje-9) | 2 | tranquilo | Free Tour | agosto (verano) | miércoles 4 de agosto | no |
| [10](#viaje-10) | 3 | completo | Arte | abril (primavera) | lunes 12 de abril | no |
| [11](#viaje-11) | 3 | tranquilo | Barrios | julio (verano) | miércoles 14 de julio | no |
| [12](#viaje-12) | 3 | completo | Naturaleza | enero (invierno) | sábado 16 de enero | no |
| [13](#viaje-13) | 3 | completo | Free Tour + Arte | mayo (primavera) | sábado 15 de mayo | Termas de Caracalla |
| [14](#viaje-14) | 3 | tranquilo | sin experiencias | febrero (invierno) | lunes 15 de febrero | no |
| [15](#viaje-15) | 3 | completo | Barrios + Naturaleza | julio (verano) | sábado 17 de julio | Galería Borghese |
| [16](#viaje-16) | 3 | tranquilo | Arte | abril (primavera) | miércoles 14 de abril | no |
| [17](#viaje-17) | 3 | completo | sin experiencias | agosto (verano) | sábado 7 de agosto | no |
| [18](#viaje-18) | 3 | tranquilo | Free Tour + Naturaleza | enero (invierno) | miércoles 13 de enero | no |
| [19](#viaje-19) | 4 | completo | Arte + Naturaleza | enero (invierno) | lunes 11 de enero | no |
| [20](#viaje-20) | 4 | tranquilo | Barrios | abril (primavera) | sábado 17 de abril | no |
| [21](#viaje-21) | 4 | completo | Free Tour | julio (verano) | miércoles 14 de julio | no |
| [22](#viaje-22) | 4 | tranquilo | sin experiencias | mayo (primavera) | lunes 10 de mayo | Castillo de Sant'Angelo, Basílica de San Clemente |
| [23](#viaje-23) | 4 | completo | Naturaleza | febrero (invierno) | sábado 20 de febrero | no |
| [24](#viaje-24) | 4 | completo | Arte + Barrios | julio (verano) | sábado 17 de julio | Trastevere |
| [25](#viaje-25) | 4 | tranquilo | Arte | enero (invierno) | miércoles 13 de enero | no |
| [26](#viaje-26) | 4 | completo | Barrios + Naturaleza | abril (primavera) | lunes 12 de abril | Termas de Caracalla |
| [27](#viaje-27) | 1 | completo | Arte | mayo (primavera) | sábado 15 de mayo | no |
| [28](#viaje-28) | 1 | tranquilo | sin experiencias | enero (invierno) | lunes 11 de enero | no |
| [29](#viaje-29) | 5 | completo | Naturaleza + Barrios | abril (primavera) | lunes 12 de abril | no |
| [30](#viaje-30) | 5 | tranquilo | Free Tour + Arte | julio (verano) | sábado 17 de julio | no |

<a id="viaje-1"></a>
## Viaje 1 — 2 días · completo · Arte · enero · empieza en lunes

Del lunes 11 de enero al martes 12 de enero de 2027.

> **Banner**: 2 días en Roma en invierno son un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1 — lunes 11 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 16:59

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 13:00 | 13:10 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:15 | 14:45 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:20 | 20 min | Barrio Judío |  |  |
| 15:30 | 15:40 | 10 min | Plaza Farnese | de paso |  |
| 15:45 | 15:55 | 10 min | Campo de' Fiori | de paso |  |
| 16:15 | 16:45 | 30 min | Piazza Navona |  |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:55 | 18:05 | 10 min | Elefantino de Bernini | de paso |  |
| 18:10 | 18:40 | 30 min | Panteón |  |  |
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — martes 12 de enero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:00
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:45 | 17:25 | 40 min | Mirador del Janículo | 🌅 atardecer 17:00 | 🚶 31 min desde Puente Sant'Angelo |
| 17:45 | 17:55 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:00 | 18:15 | 15 min | Fontana dell'Acqua Paola |  |  |
| 18:30 | 19:15 | 45 min | Trastevere |  |  |
| 19:20 | 19:40 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-2"></a>
## Viaje 2 — 2 días · tranquilo · Naturaleza · abril · empieza en miércoles

Del miércoles 14 de abril al jueves 15 de abril de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — miércoles 14 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 19:49
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:25 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 17:45 | 17:55 | 10 min | Elefantino de Bernini | de paso |  |
| 18:00 | 18:30 | 30 min | Panteón |  |  |
| 18:45 | 19:15 | 30 min | Fontana de Trevi |  |  |
| 19:30 | 19:45 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 15 de abril · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:51
- 🚌 Borgo Pio → Mirador del Janículo: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| | | 79 min | 🕐 **Tiempo libre** | antes de Mirador del Janículo · Puente Sant'Angelo | |
| 19:10 | 19:51 | 41 min | Mirador del Janículo | 🌅 atardecer 19:51 | 🚶 26 min desde Borgo Pio |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: Cúpula de San Pedro (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-3"></a>
## Viaje 3 — 2 días · completo · Free Tour + Barrios · julio · empieza en sábado

Del sábado 17 de julio al domingo 18 de julio de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — sábado 17 de julio · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El Vaticano por la tarde (`vaticano_por_la_tarde`)
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:30 | 30 min | Plaza de San Pedro |  |  |
| 18:35 | 19:50 | 75 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Prati y Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | experiencia nocturna | |

### Día 2 — domingo 18 de julio · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:42

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:00 | 15:10 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:15 | 15:45 | 30 min | Barrio Judío |  |  |
| 16:00 | 16:10 | 10 min | Plaza Farnese | de paso |  |
| 16:15 | 16:25 | 10 min | Campo de' Fiori | de paso |  |
| 16:45 | 16:55 | 10 min | Piazza Navona | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:55 | 18:05 | 10 min | Elefantino de Bernini | de paso |  |
| 18:10 | 18:40 | 30 min | Panteón |  |  |
| | | 73 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Iglesia del Gesù, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-4"></a>
## Viaje 4 — 2 días · tranquilo · sin experiencias · febrero · empieza en sábado · pool: Galería Borghese

Del sábado 20 de febrero al domingo 21 de febrero de 2027.

> **Banner**: 2 días en Roma en invierno son un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1 — sábado 20 de febrero · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:49
- 🚌 Borgo Pio → Mirador del Janículo: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:40 | 40 min | Mirador del Janículo | 🌅 atardecer 17:49 | 🚶 26 min desde Borgo Pio |
| 19:00 | 19:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 21 de febrero · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:50
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 17:55 | 10 min | Elefantino de Bernini | de paso |  |
| 18:00 | 18:30 | 30 min | Panteón |  |  |
| 18:45 | 19:15 | 30 min | Fontana de Trevi |  |  |
| 19:30 | 19:45 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: Galería Borghese (No cabía en ningún día del viaje).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-5"></a>
## Viaje 5 — 2 días · completo · Barrios · mayo · empieza en miércoles · pool: Trastevere, Castillo de Sant'Angelo

Del miércoles 12 de mayo al jueves 13 de mayo de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — miércoles 12 de mayo · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:20

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 13:00 | 13:10 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:15 | 14:45 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:20 | 20 min | Barrio Judío |  |  |
| 15:30 | 15:40 | 10 min | Plaza Farnese | de paso |  |
| 15:45 | 15:55 | 10 min | Campo de' Fiori | de paso |  |
| 16:15 | 16:45 | 30 min | Piazza Navona |  |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:55 | 18:05 | 10 min | Elefantino de Bernini | de paso |  |
| 18:10 | 18:40 | 30 min | Panteón |  |  |
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 13 de mayo · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:21

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo |  |  |
| 16:05 | 17:20 | 75 min | Castillo de Sant'Angelo |  |  |
| 17:45 | 18:30 | 45 min | Trastevere |  | 🚶 25 min desde Castillo de Sant'Angelo |
| 18:35 | 18:55 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:15 | 19:25 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 19:30 | 19:45 | 15 min | Fontana dell'Acqua Paola |  |  |
| 20:15 | 20:55 | 40 min | Mirador del Janículo | 🌅 atardecer 20:21 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-6"></a>
## Viaje 6 — 2 días · completo · Naturaleza · julio · empieza en lunes

Del lunes 12 de julio al martes 13 de julio de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — lunes 12 de julio · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:46

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 13:00 | 13:10 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:15 | 14:45 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:20 | 20 min | Barrio Judío |  |  |
| 15:30 | 15:40 | 10 min | Plaza Farnese | de paso |  |
| 15:45 | 15:55 | 10 min | Campo de' Fiori | de paso |  |
| 16:15 | 16:45 | 30 min | Piazza Navona |  |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:55 | 18:05 | 10 min | Elefantino de Bernini | de paso |  |
| 18:10 | 18:40 | 30 min | Panteón |  |  |
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — martes 13 de julio · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:45

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:20 | 13:50 | 30 min | Cúpula de San Pedro |  |  |
| 14:00 | 15:30 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:30 | 15:40 | 10 min | Via della Conciliazione | de paso |  |
| 15:45 | 15:55 | 10 min | Borgo Pio | de paso |  |
| 16:15 | 16:30 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 17:00 | 18:15 | 75 min | Trastevere |  | 🚶 24 min desde Puente Sant'Angelo |
| 18:20 | 18:40 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:00 | 19:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 19:15 | 19:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| 20:00 | 20:45 | 45 min | Mirador del Janículo | 🌅 atardecer 20:45 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-7"></a>
## Viaje 7 — 2 días · tranquilo · Arte + Barrios · enero · empieza en miércoles

Del miércoles 13 de enero al jueves 14 de enero de 2027.

> **Banner**: 2 días en Roma en invierno son un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1 — miércoles 13 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:01
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:25 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 17:45 | 17:55 | 10 min | Elefantino de Bernini | de paso |  |
| 18:00 | 18:30 | 30 min | Panteón |  |  |
| 18:45 | 19:15 | 30 min | Fontana de Trevi |  |  |
| 19:30 | 19:45 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 14 de enero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:03

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 24 min desde Borgo Pio |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:30 | 19:40 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-8"></a>
## Viaje 8 — 2 días · completo · sin experiencias · abril · empieza en sábado

Del sábado 17 de abril al domingo 18 de abril de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — sábado 17 de abril · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:53

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 17:15 | 45 min | Trastevere |  | 🚶 24 min desde Puente Sant'Angelo |
| 17:20 | 17:40 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:00 | 18:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:15 | 18:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:10 | 19:53 | 43 min | Mirador del Janículo | 🌅 atardecer 19:53 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 2 — domingo 18 de abril · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 19:54

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 13:00 | 13:10 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:15 | 14:45 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:20 | 20 min | Barrio Judío |  |  |
| 15:30 | 15:40 | 10 min | Plaza Farnese | de paso |  |
| 15:45 | 15:55 | 10 min | Campo de' Fiori | de paso |  |
| 16:15 | 16:45 | 30 min | Piazza Navona |  |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:55 | 18:05 | 10 min | Elefantino de Bernini | de paso |  |
| 18:10 | 18:40 | 30 min | Panteón |  |  |
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-9"></a>
## Viaje 9 — 2 días · tranquilo · Free Tour · agosto · empieza en miércoles

Del miércoles 4 de agosto al jueves 5 de agosto de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — miércoles 4 de agosto · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El Vaticano por la tarde (`vaticano_por_la_tarde`)
- **Atardecer**: 20:25
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver Basílica de San Pedro

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:15 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:30 | 30 min | Plaza de San Pedro |  |  |
| 18:35 | 19:50 | 75 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Prati y Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | experiencia nocturna | |

### Día 2 — jueves 5 de agosto · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:24
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:00 | 15:15 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:30 | 15:40 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:45 | 16:15 | 30 min | Barrio Judío |  |  |
| 16:30 | 16:40 | 10 min | Plaza Farnese | de paso |  |
| 16:45 | 16:55 | 10 min | Campo de' Fiori | de paso |  |
| 17:15 | 17:25 | 10 min | Piazza Navona | de paso |  |
| 17:30 | 17:40 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 18:00 | 18:10 | 10 min | Iglesia de Santa Maria sopra Minerva | de paso |  |
| 18:15 | 18:25 | 10 min | Elefantino de Bernini | de paso |  |
| 18:30 | 19:00 | 30 min | Panteón |  |  |
| | | 53 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-10"></a>
## Viaje 10 — 3 días · completo · Arte · abril · empieza en lunes

Del lunes 12 de abril al miércoles 14 de abril de 2027.

> **Banner**: ninguno.

### Día 1 — lunes 12 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 19:47
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:10 | 18:20 | 10 min | Elefantino de Bernini | de paso |  |
| 18:25 | 18:55 | 30 min | Panteón |  |  |
| 19:15 | 19:30 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — martes 13 de abril · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:48

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 17:15 | 45 min | Trastevere |  | 🚶 24 min desde Puente Sant'Angelo |
| 17:20 | 17:40 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:00 | 18:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:15 | 18:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:05 | 19:48 | 43 min | Mirador del Janículo | 🌅 atardecer 19:48 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 3 — miércoles 14 de abril · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 19:49

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:15 | 15 min | Plaza Colonna |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Plaza del Campidoglio, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-11"></a>
## Viaje 11 — 3 días · tranquilo · Barrios · julio · empieza en miércoles

Del miércoles 14 de julio al viernes 16 de julio de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 1 día empieza antes, para que no te quedes sin ver la Fontana de Trevi y el Altar de la Patria.

### Día 1 — miércoles 14 de julio · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:44
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:25 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 17:45 | 17:55 | 10 min | Elefantino de Bernini | de paso |  |
| 18:00 | 18:30 | 30 min | Panteón |  |  |
| 18:45 | 19:00 | 15 min | Fontana de Trevi | de paso |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Colonna, Columna de Trajano | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 15 de julio · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 24 min desde Borgo Pio |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:30 | 19:40 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 20:00 | 20:44 | 44 min | Mirador del Janículo | 🌅 atardecer 20:44 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 3 — viernes 16 de julio · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Plaza del Campidoglio, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-12"></a>
## Viaje 12 — 3 días · completo · Naturaleza · enero · empieza en sábado

Del sábado 16 de enero al lunes 18 de enero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:15 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — sábado 16 de enero · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:05
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:20 | 13:50 | 30 min | Cúpula de San Pedro |  |  |
| 14:00 | 15:30 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:30 | 15:40 | 10 min | Via della Conciliazione | de paso |  |
| 15:45 | 15:55 | 10 min | Borgo Pio | de paso |  |
| 16:15 | 16:30 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 17:15 | 17:55 | 40 min | Mirador del Janículo | 🌅 atardecer 17:05 | 🚶 31 min desde Puente Sant'Angelo |
| 18:15 | 18:25 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:30 | 18:45 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:00 | 19:45 | 45 min | Trastevere |  |  |
| 19:50 | 20:00 | 10 min | Iglesia de Santa Maria in Trastevere | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 17 de enero · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:06
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:10 | 18:20 | 10 min | Elefantino de Bernini | de paso |  |
| 18:25 | 18:55 | 30 min | Panteón |  |  |
| 19:15 | 19:30 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 3 — lunes 18 de enero · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 17:07

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:15 | 15 min | Plaza Colonna |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Plaza del Campidoglio, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |
| 19:00 | 19:45 | 45 min | 🌙 Panteón (noche) | experiencia nocturna, antes de cenar | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-13"></a>
## Viaje 13 — 3 días · completo · Free Tour + Arte · mayo · empieza en sábado · pool: Termas de Caracalla

Del sábado 15 de mayo al lunes 17 de mayo de 2027.

> **Banner**: ninguno.

### Día 1 — sábado 15 de mayo · Roma — día 1

- **Mañana**: Termas de Caracalla, Aventino y mercado de Testaccio (`caracalla_aventino`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:23

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 10:00 | 60 min | Termas de Caracalla |  |  |
| 10:30 | 10:40 | 10 min | Circo Máximo | de paso | 🚶 17 min desde Termas de Caracalla |
| 11:00 | 11:20 | 20 min | Boca de la Verdad |  |  |
| 12:00 | 12:20 | 20 min | Jardín de los Naranjos |  |  |
| 12:30 | 12:40 | 10 min | Ojo de la Cerradura del Aventino |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Trattoria Da Enzo al 29 | en Trastevere | |
| 14:30 | 15:00 | 30 min | Panteón |  | 🚶 18 min desde la comida |
| 15:05 | 15:15 | 10 min | Elefantino de Bernini | de paso |  |
| 15:30 | 15:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 16:00 | 16:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 16:25 | 16:35 | 10 min | Piazza Navona | de paso |  |
| 16:45 | 16:55 | 10 min | Campo de' Fiori | de paso |  |
| 17:00 | 17:10 | 10 min | Plaza Farnese | de paso |  |
| 17:30 | 18:00 | 30 min | Barrio Judío |  |  |
| 18:05 | 18:15 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:30 | 19:00 | 30 min | Iglesia del Gesù |  |  |
| | | 51 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — domingo 16 de mayo · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 20:24

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:50 | 20 min | Plaza del Campidoglio |  |  |
| 15:00 | 16:00 | 60 min | Altar de la Patria |  |  |
| 16:15 | 16:25 | 10 min | Plaza Venecia | de paso |  |
| 16:45 | 16:55 | 10 min | Teatro de Marcelo | de paso |  |
| 17:15 | 17:45 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:00 | 18:20 | 20 min | Isla Tiberina |  |  |
| 18:30 | 18:45 | 15 min | Plaza Trilussa |  |  |
| | | 67 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Iglesia de Santa Maria in Trastevere, Trastevere, Fontana dell'Acqua Paola | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — lunes 17 de mayo · Roma — día 3

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El Vaticano por la tarde (`vaticano_por_la_tarde`)
- **Atardecer**: 20:25

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:30 | 30 min | Plaza de San Pedro |  |  |
| 18:35 | 19:50 | 75 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Prati y Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: Mercado de Testaccio (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 3 (el último), joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).

<a id="viaje-14"></a>
## Viaje 14 — 3 días · tranquilo · sin experiencias · febrero · empieza en lunes

Del lunes 15 de febrero al miércoles 17 de febrero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:45 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero y algún día empieza un poco antes. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — lunes 15 de febrero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:43
- ⚠️ Hoy empezamos a las 09:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 09:15 | 15 min | Arco de Constantino |  |  |
| 09:20 | 10:50 | 90 min | Coliseo |  |  |
| 11:30 | 13:15 | 105 min | Foro Romano y Palatino |  |  |
| 13:15 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:00 | 15:10 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:15 | 15:45 | 30 min | Barrio Judío |  |  |
| 16:00 | 16:10 | 10 min | Plaza Farnese | de paso |  |
| 16:15 | 16:25 | 10 min | Campo de' Fiori | de paso |  |
| 16:45 | 17:15 | 30 min | Piazza Navona |  |  |
| 17:30 | 17:40 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 18:00 | 18:10 | 10 min | Elefantino de Bernini | de paso |  |
| 18:15 | 18:45 | 30 min | Panteón |  |  |
| 19:00 | 19:15 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — martes 16 de febrero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 24 min desde Borgo Pio |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:30 | 19:40 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — miércoles 17 de febrero · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 17:45

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Plaza del Campidoglio, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |
| 19:00 | 19:45 | 45 min | 🌙 Panteón (noche) | experiencia nocturna, antes de cenar | |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-15"></a>
## Viaje 15 — 3 días · completo · Barrios + Naturaleza · julio · empieza en sábado · pool: Galería Borghese

Del sábado 17 de julio al lunes 19 de julio de 2027.

> **Banner**: ninguno.

### Día 1 — sábado 17 de julio · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El Aventino al atardecer y cena en Testaccio (`aventino_testaccio`)
- **Atardecer**: 20:43
- 🚌 Altar de la Patria → Mercado de Testaccio: ~35 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:30 | 15:40 | 10 min | Mercado de Testaccio | de paso | 🚶 34 min desde Altar de la Patria |
| 16:00 | 16:25 | 25 min | Cementerio Protestante |  |  |
| 16:45 | 16:55 | 10 min | Circo Máximo | de paso | 🚶 19 min desde Cementerio Protestante |
| 17:15 | 17:35 | 20 min | Boca de la Verdad |  |  |
| 18:00 | 18:20 | 20 min | Jardín de los Naranjos |  |  |
| 18:30 | 18:40 | 10 min | Ojo de la Cerradura del Aventino |  |  |
| 19:00 | 19:10 | 10 min | Pirámide Cestia | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Testaccio |  |

### Día 2 — domingo 18 de julio · Roma — día 2

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Galería Borghese, el parque y el Pincio (`villa_borghese_pincio`)
- **Atardecer**: 20:42
- 🚌 Desde la comida → Galería Borghese: ~30 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:30 | 10:00 | 30 min | Fontana de Trevi |  |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:40 | 10 min | Via Condotti | de paso |  |
| 12:00 | 12:30 | 30 min | Panteón |  |  |
| 13:00 | 13:30 | 30 min | Piazza Navona |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Poldo e Gianna Osteria | en Tridente y Spagna | |
| 15:15 | 17:15 | 120 min | Galería Borghese |  | 🚶 29 min desde la comida |
| 17:30 | 19:00 | 90 min | Parque de Villa Borghese |  |  |
| 20:00 | 20:42 | 42 min | Terraza del Pincio | 🌅 atardecer 20:42 |  |
| 21:00 | 21:10 | 10 min | Piazza del Popolo | de paso |  |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

### Día 3 — lunes 19 de julio · Roma — día 3

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:41

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:20 | 13:50 | 30 min | Cúpula de San Pedro |  |  |
| 14:00 | 15:30 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:30 | 15:40 | 10 min | Via della Conciliazione | de paso |  |
| 15:45 | 15:55 | 10 min | Borgo Pio | de paso |  |
| 16:15 | 16:30 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 17:00 | 18:30 | 90 min | Trastevere |  | 🚶 24 min desde Puente Sant'Angelo |
| 18:35 | 18:55 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:15 | 19:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| 20:00 | 20:41 | 41 min | Mirador del Janículo | 🌅 atardecer 20:41 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).

<a id="viaje-16"></a>
## Viaje 16 — 3 días · tranquilo · Arte · abril · empieza en miércoles

Del miércoles 14 de abril al viernes 16 de abril de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 1 día empieza antes, para que no te quedes sin ver la Fontana de Trevi y el Altar de la Patria.

### Día 1 — miércoles 14 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 19:49
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:25 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 17:45 | 17:55 | 10 min | Elefantino de Bernini | de paso |  |
| 18:00 | 18:30 | 30 min | Panteón |  |  |
| 18:45 | 19:00 | 15 min | Fontana de Trevi | de paso |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Colonna, Columna de Trajano | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 15 de abril · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:51
- 🚌 Borgo Pio → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso | 🚶 27 min desde Borgo Pio |
| 19:10 | 19:51 | 41 min | Mirador del Janículo | 🌅 atardecer 19:51 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 3 — viernes 16 de abril · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 19:52

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Plaza del Campidoglio, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-17"></a>
## Viaje 17 — 3 días · completo · sin experiencias · agosto · empieza en sábado

Del sábado 7 de agosto al lunes 9 de agosto de 2027.

> **Banner**: ninguno.

### Día 1 — sábado 7 de agosto · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:22

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 17:45 | 75 min | Trastevere |  | 🚶 24 min desde Puente Sant'Angelo |
| 17:50 | 18:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:30 | 18:40 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:45 | 19:00 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:40 | 20:22 | 42 min | Mirador del Janículo | 🌅 atardecer 20:22 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 2 — domingo 8 de agosto · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:20
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:10 | 18:20 | 10 min | Elefantino de Bernini | de paso |  |
| 18:25 | 18:55 | 30 min | Panteón |  |  |
| 19:15 | 19:30 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 3 — lunes 9 de agosto · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 20:19

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:15 | 15 min | Plaza Colonna |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Plaza del Campidoglio, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-18"></a>
## Viaje 18 — 3 días · tranquilo · Free Tour + Naturaleza · enero · empieza en miércoles

Del miércoles 13 de enero al viernes 15 de enero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:15 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero y algún día empieza un poco antes. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — miércoles 13 de enero · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:01

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:00 | 15:30 | 30 min | Panteón |  |  |
| 15:35 | 15:45 | 10 min | Elefantino de Bernini | de paso |  |
| 15:50 | 16:10 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 16:30 | 16:50 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 16:55 | 17:05 | 10 min | Piazza Navona | de paso |  |
| 17:15 | 17:25 | 10 min | Campo de' Fiori | de paso |  |
| 17:30 | 17:40 | 10 min | Plaza Farnese | de paso |  |
| 18:00 | 18:30 | 30 min | Barrio Judío |  |  |
| 18:35 | 18:45 | 10 min | Fuente de las Tortugas | de paso |  |
| | | 65 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Iglesia del Gesù, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 19:00 | 19:45 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna, antes de cenar | |

### Día 2 — jueves 14 de enero · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 17:03
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:00 | 15:20 | 20 min | Plaza del Campidoglio |  |  |
| 15:30 | 16:30 | 60 min | Altar de la Patria |  |  |
| 16:45 | 16:55 | 10 min | Plaza Venecia | de paso |  |
| 17:15 | 17:25 | 10 min | Teatro de Marcelo | de paso |  |
| 17:45 | 18:15 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:30 | 18:50 | 20 min | Isla Tiberina |  |  |
| | | 61 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Iglesia de Santa Maria in Trastevere, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — viernes 15 de enero · Roma — día 3

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:04

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 24 min desde Borgo Pio |
| 19:15 | 19:55 | 40 min | Mirador del Janículo |  | 🚶 23 min desde Trastevere |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: Cúpula de San Pedro (No te dio tiempo); Iglesia de Santa Maria in Trastevere (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).

<a id="viaje-19"></a>
## Viaje 19 — 4 días · completo · Arte + Naturaleza · enero · empieza en lunes

Del lunes 11 de enero al jueves 14 de enero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:00 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — lunes 11 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 16:59
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:10 | 18:20 | 10 min | Elefantino de Bernini | de paso |  |
| 18:25 | 18:55 | 30 min | Panteón |  |  |
| 19:15 | 19:30 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — martes 12 de enero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:00
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:20 | 13:50 | 30 min | Cúpula de San Pedro |  |  |
| 14:00 | 15:30 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:30 | 15:40 | 10 min | Via della Conciliazione | de paso |  |
| 15:45 | 15:55 | 10 min | Borgo Pio | de paso |  |
| 16:15 | 16:30 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 17:15 | 17:55 | 40 min | Mirador del Janículo | 🌅 atardecer 17:00 | 🚶 31 min desde Puente Sant'Angelo |
| 18:15 | 18:25 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:30 | 18:45 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:00 | 19:45 | 45 min | Trastevere |  |  |
| 19:50 | 20:00 | 10 min | Iglesia de Santa Maria in Trastevere | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — miércoles 13 de enero · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 17:01
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — jueves 14 de enero · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Galería Borghese, el parque y el Pincio (`villa_borghese_pincio`)
- **Atardecer**: 17:03

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Sgarro Bistrot | en Tridente y Spagna | |
| 14:30 | 16:30 | 120 min | Galería Borghese |  | 🚶 22 min desde la comida |
| 16:45 | 16:55 | 10 min | Parque de Villa Borghese | de paso |  |
| 17:15 | 17:35 | 20 min | Terraza del Pincio | 🌅 atardecer 17:03 |  |
| 17:45 | 18:15 | 30 min | Piazza del Popolo |  |  |
| 18:20 | 18:30 | 10 min | Santa Maria del Popolo | de paso |  |
| | | 79 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Tridente y Spagna | Via del Corso, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-20"></a>
## Viaje 20 — 4 días · tranquilo · Barrios · abril · empieza en sábado

Del sábado 17 de abril al martes 20 de abril de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 1 día empieza antes, para que no te quedes sin ver la Fontana de Trevi y el Altar de la Patria.

### Día 1 — sábado 17 de abril · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:53
- 🚌 Borgo Pio → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso | 🚶 27 min desde Borgo Pio |
| 19:10 | 19:53 | 43 min | Mirador del Janículo | 🌅 atardecer 19:53 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 2 — domingo 18 de abril · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 19:54
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 17:55 | 10 min | Elefantino de Bernini | de paso |  |
| 18:00 | 18:30 | 30 min | Panteón |  |  |
| 18:45 | 19:00 | 15 min | Fontana de Trevi | de paso |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Colonna, Columna de Trajano | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 3 — lunes 19 de abril · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 19:55
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — martes 20 de abril · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 19:56

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Plaza del Campidoglio, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-21"></a>
## Viaje 21 — 4 días · completo · Free Tour · julio · empieza en miércoles

Del miércoles 14 de julio al sábado 17 de julio de 2027.

> **Banner**: ninguno.

### Día 1 — miércoles 14 de julio · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El Vaticano por la tarde (`vaticano_por_la_tarde`)
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:30 | 30 min | Plaza de San Pedro |  |  |
| 18:35 | 19:50 | 75 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Prati y Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | experiencia nocturna | |

### Día 2 — jueves 15 de julio · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:00 | 15:10 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:15 | 15:45 | 30 min | Barrio Judío |  |  |
| 16:00 | 16:10 | 10 min | Plaza Farnese | de paso |  |
| 16:15 | 16:25 | 10 min | Campo de' Fiori | de paso |  |
| 16:45 | 16:55 | 10 min | Piazza Navona | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:55 | 18:05 | 10 min | Elefantino de Bernini | de paso |  |
| 18:10 | 18:40 | 30 min | Panteón |  |  |
| | | 73 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Iglesia del Gesù, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 3 — viernes 16 de julio · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:43
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — sábado 17 de julio · Roma — día 4

- **Mañana**: Galería Borghese, el parque y el Popolo (`borghese`)
- **Tarde**: Del Popolo al Pincio al atardecer (`tridente_pincio`)
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 11:00 | 120 min | Galería Borghese |  |  |
| 11:30 | 13:00 | 90 min | Parque de Villa Borghese |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 14:30 | 14:40 | 10 min | Plaza de España | de paso |  |
| 15:00 | 15:10 | 10 min | Via del Corso | de paso |  |
| 15:30 | 16:15 | 45 min | Ara Pacis |  |  |
| 16:30 | 17:00 | 30 min | Piazza del Popolo |  |  |
| 17:05 | 17:35 | 30 min | Santa Maria del Popolo |  |  |
| 17:45 | 18:05 | 20 min | Terraza del Pincio |  |  |
| | | 102 min | 🕐 **Tarde libre** | Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-22"></a>
## Viaje 22 — 4 días · tranquilo · sin experiencias · mayo · empieza en lunes · pool: Castillo de Sant'Angelo, Basílica de San Clemente

Del lunes 10 de mayo al jueves 13 de mayo de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 2 días empiezan antes, para que no te quedes sin ver el Panteón.

### Día 1 — lunes 10 de mayo · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:18
- ⚠️ Hoy empezamos a las 09:00 para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 09:15 | 15 min | Arco de Constantino |  |  |
| 09:20 | 10:50 | 90 min | Coliseo |  |  |
| 11:30 | 13:15 | 105 min | Foro Romano y Palatino |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:15 | 15:25 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:30 | 16:00 | 30 min | Barrio Judío |  |  |
| 16:15 | 16:25 | 10 min | Plaza Farnese | de paso |  |
| 16:30 | 16:40 | 10 min | Campo de' Fiori | de paso |  |
| 17:00 | 17:30 | 30 min | Piazza Navona |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:25 | 10 min | Elefantino de Bernini | de paso |  |
| 18:30 | 19:00 | 30 min | Panteón |  |  |
| 19:15 | 19:30 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — martes 11 de mayo · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:19
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a verlo todo

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:30 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:30 | 15:40 | 10 min | Via della Conciliazione | de paso |  |
| 15:45 | 15:55 | 10 min | Borgo Pio | de paso |  |
| 16:15 | 16:30 | 15 min | Puente Sant'Angelo |  |  |
| 16:35 | 17:50 | 75 min | Castillo de Sant'Angelo |  |  |
| 18:15 | 19:00 | 45 min | Trastevere |  | 🚶 25 min desde Castillo de Sant'Angelo |
| 19:05 | 19:25 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:45 | 19:55 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 20:15 | 20:55 | 40 min | Mirador del Janículo | 🌅 atardecer 20:19 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 3 — miércoles 12 de mayo · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:20
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — jueves 13 de mayo · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: San Juan de Letrán, San Clemente y el Coliseo al anochecer (`letran_celio`)
- **Atardecer**: 20:21
- 🚌 Via dei Fori Imperiali → Basílica de San Juan de Letrán: ~25 min andando · o en taxi (10-20 min) o bus 87 desde Rinascimento (unos 28 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Piccolo Arancio | en Trevi | |
| 15:00 | 15:15 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:30 | 15:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 16:15 | 16:45 | 30 min | Basílica de San Juan de Letrán |  | 🚶 27 min desde Via dei Fori Imperiali |
| 17:00 | 17:45 | 45 min | Basílica de San Clemente |  |  |
| 18:00 | 18:20 | 20 min | Iglesia de San Pietro in Vincoli |  |  |
| 18:30 | 19:10 | 40 min | Monti |  |  |
| | | 49 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Monti |  | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Monti |  |
| 21:30 | 22:15 | 45 min | 🌙 Coliseo (noche) | experiencia nocturna | |
| 22:30 | 22:55 | 25 min | 🌙 Foro Romano desde el Campidoglio (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-23"></a>
## Viaje 23 — 4 días · completo · Naturaleza · febrero · empieza en sábado

Del sábado 20 de febrero al martes 23 de febrero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 18:00 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — sábado 20 de febrero · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:49
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:20 | 13:50 | 30 min | Cúpula de San Pedro |  |  |
| 14:00 | 15:30 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:30 | 15:40 | 10 min | Via della Conciliazione | de paso |  |
| 15:45 | 15:55 | 10 min | Borgo Pio | de paso |  |
| 16:15 | 16:30 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 17:15 | 17:55 | 40 min | Mirador del Janículo | 🌅 atardecer 17:49 | 🚶 31 min desde Puente Sant'Angelo |
| 18:15 | 18:25 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:30 | 18:45 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:00 | 19:45 | 45 min | Trastevere |  |  |
| 19:50 | 20:00 | 10 min | Iglesia de Santa Maria in Trastevere | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 21 de febrero · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:50
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:10 | 18:20 | 10 min | Elefantino de Bernini | de paso |  |
| 18:25 | 18:55 | 30 min | Panteón |  |  |
| 19:15 | 19:30 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 3 — lunes 22 de febrero · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 17:51
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — martes 23 de febrero · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Galería Borghese, el parque y el Pincio (`villa_borghese_pincio`)
- **Atardecer**: 17:53

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Sgarro Bistrot | en Tridente y Spagna | |
| 14:30 | 14:40 | 10 min | Via del Corso | de paso |  |
| 15:15 | 17:15 | 120 min | Galería Borghese |  | 🚶 22 min desde Via del Corso |
| 17:30 | 17:40 | 10 min | Parque de Villa Borghese | de paso |  |
| 18:00 | 18:20 | 20 min | Terraza del Pincio | 🌅 atardecer 17:53 |  |
| 18:30 | 19:00 | 30 min | Piazza del Popolo |  |  |
| | | 51 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Tridente y Spagna | Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-24"></a>
## Viaje 24 — 4 días · completo · Arte + Barrios · julio · empieza en sábado · pool: Trastevere

Del sábado 17 de julio al martes 20 de julio de 2027.

> **Banner**: ninguno.

### Día 1 — sábado 17 de julio · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 18:15 | 105 min | Trastevere |  | 🚶 24 min desde Puente Sant'Angelo |
| 18:20 | 18:40 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:00 | 19:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 19:15 | 19:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| 20:00 | 20:43 | 43 min | Mirador del Janículo | 🌅 atardecer 20:43 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 2 — domingo 18 de julio · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:42
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:15 | 14:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 14:45 | 14:55 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:00 | 15:30 | 30 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Plaza Farnese | de paso |  |
| 16:00 | 16:10 | 10 min | Campo de' Fiori | de paso |  |
| 16:30 | 17:00 | 30 min | Piazza Navona |  |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:10 | 18:20 | 10 min | Elefantino de Bernini | de paso |  |
| 18:25 | 18:55 | 30 min | Panteón |  |  |
| 19:15 | 19:30 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 3 — lunes 19 de julio · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:41
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — martes 20 de julio · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Galería Borghese, el parque y el Pincio (`villa_borghese_pincio`)
- **Atardecer**: 20:40

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Sgarro Bistrot | en Tridente y Spagna | |
| 14:30 | 16:30 | 120 min | Galería Borghese |  | 🚶 22 min desde la comida |
| 16:45 | 18:15 | 90 min | Parque de Villa Borghese |  |  |
| 18:30 | 18:50 | 20 min | Terraza del Pincio |  |  |
| 19:00 | 19:30 | 30 min | Piazza del Popolo |  |  |
| 19:35 | 19:45 | 10 min | Santa Maria del Popolo | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-25"></a>
## Viaje 25 — 4 días · tranquilo · Arte · enero · empieza en miércoles

Del miércoles 13 de enero al sábado 16 de enero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:15 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero y algún día empieza un poco antes. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — miércoles 13 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:01
- ⚠️ Hoy empezamos a las 09:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 09:15 | 15 min | Arco de Constantino |  |  |
| 09:20 | 10:50 | 90 min | Coliseo |  |  |
| 11:30 | 13:15 | 105 min | Foro Romano y Palatino |  |  |
| 13:15 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:00 | 15:10 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:15 | 15:45 | 30 min | Barrio Judío |  |  |
| 16:00 | 16:10 | 10 min | Plaza Farnese | de paso |  |
| 16:15 | 16:25 | 10 min | Campo de' Fiori | de paso |  |
| 16:45 | 17:15 | 30 min | Piazza Navona |  |  |
| 17:30 | 17:40 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 18:00 | 18:10 | 10 min | Elefantino de Bernini | de paso |  |
| 18:15 | 18:45 | 30 min | Panteón |  |  |
| 19:00 | 19:15 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 14 de enero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:03

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:30 | 30 min | Plaza de San Pedro |  |  |
| 15:35 | 16:50 | 75 min | Basílica de San Pedro |  |  |
| 17:00 | 17:10 | 10 min | Via della Conciliazione | de paso |  |
| 17:15 | 17:25 | 10 min | Borgo Pio | de paso |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 24 min desde Borgo Pio |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:30 | 19:40 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — viernes 15 de enero · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 17:04
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — sábado 16 de enero · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 17:05

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Colline Emiliane | en Trevi | |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:25 | 18:25 | 60 min | Palazzo Doria Pamphilj |  |  |
| | | 85 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Iglesia del Gesù, Iglesia de Santa Maria sopra Minerva, Largo di Torre Argentina | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 19:00 | 19:45 | 45 min | 🌙 Panteón (noche) | experiencia nocturna, antes de cenar | |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-26"></a>
## Viaje 26 — 4 días · completo · Barrios + Naturaleza · abril · empieza en lunes · pool: Termas de Caracalla

Del lunes 12 de abril al jueves 15 de abril de 2027.

> **Banner**: ninguno.

### Día 1 — lunes 12 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 19:47

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:40 | 10 min | Fuente de las Tortugas | de paso |  |
| 14:45 | 15:15 | 30 min | Barrio Judío |  |  |
| 15:30 | 15:40 | 10 min | Plaza Farnese | de paso |  |
| 15:45 | 15:55 | 10 min | Campo de' Fiori | de paso |  |
| 16:15 | 16:45 | 30 min | Piazza Navona |  |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:55 | 18:05 | 10 min | Elefantino de Bernini | de paso |  |
| 18:10 | 18:40 | 30 min | Panteón |  |  |
| 19:00 | 19:15 | 15 min | Fontana de Trevi | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — martes 13 de abril · Roma — día 2

- **Mañana**: Termas de Caracalla, Aventino y mercado de Testaccio (`caracalla_aventino`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 19:48

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 10:00 | 60 min | Termas de Caracalla |  |  |
| 10:30 | 10:40 | 10 min | Circo Máximo | de paso | 🚶 17 min desde Termas de Caracalla |
| 11:00 | 11:20 | 20 min | Boca de la Verdad |  |  |
| 12:00 | 12:20 | 20 min | Jardín de los Naranjos |  |  |
| 12:30 | 12:40 | 10 min | Ojo de la Cerradura del Aventino |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Trattoria Da Enzo al 29 | en Trastevere | |
| 14:30 | 14:50 | 20 min | Isla Tiberina |  |  |
| 15:00 | 15:10 | 10 min | Teatro de Marcelo | de paso |  |
| 15:30 | 15:40 | 10 min | Plaza Venecia | de paso |  |
| 15:45 | 16:45 | 60 min | Altar de la Patria |  |  |
| 17:00 | 17:20 | 20 min | Plaza del Campidoglio |  |  |
| 17:30 | 18:00 | 30 min | Iglesia del Gesù |  |  |
| 18:05 | 18:25 | 20 min | Largo di Torre Argentina |  |  |
| | | 88 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Iglesia de San Ignacio de Loyola, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 3 — miércoles 14 de abril · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 19:49
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — jueves 15 de abril · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: El Vaticano por la tarde (`vaticano_por_la_tarde`)
- **Atardecer**: 19:51
- 🚌 Desde la comida → Museos Vaticanos y Capilla Sixtina: ~35 min andando · o en bus 492 desde Senato (unos 20 min) o taxi (unos 20 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Sgarro Bistrot | en Tridente y Spagna | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 34 min desde la comida |
| 18:00 | 18:30 | 30 min | Plaza de San Pedro |  |  |
| 18:35 | 19:50 | 75 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Prati y Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: Mercado de Testaccio (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).

<a id="viaje-27"></a>
## Viaje 27 — 1 día · completo · Arte · mayo · empieza en sábado

Del sábado 15 de mayo al sábado 15 de mayo de 2027.

> **Banner**: Un día en Roma da para mucho si se aprovecha bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — sábado 15 de mayo · Roma — día 1

- **Mañana**: ruta de 1 día, bloque A (`short_trips`)
- **Tarde**: bloque B (`short_trips`)
- **Atardecer**: 20:23

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:15 | 12:00 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:38 | 8 min | Plaza Venecia | de paso · por fuera, en vez de la visita |  |
| 12:45 | 12:53 | 8 min | Altar de la Patria | de paso · por fuera, en vez de la visita |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Enoteca Corsi | en Piazza Venezia | |
| 14:30 | 14:50 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 15:00 | 15:30 | 30 min | Panteón |  |  |
| 15:40 | 16:10 | 30 min | Piazza Navona |  |  |
| 16:30 | 17:00 | 30 min | Fontana de Trevi |  |  |
| 17:15 | 17:45 | 30 min | Plaza de España |  |  |
| 18:00 | 18:30 | 30 min | Piazza del Popolo |  |  |
| | | 63 min | 🕐 **Tiempo libre** | antes de Terraza del Pincio · Pasear por Villa Borghese: el pulmón verde de Roma. | |
| 19:40 | 20:23 | 43 min | Terraza del Pincio | 🌅 atardecer 20:23 |  |
| 20:30 | 20:45 | 15 min | Santa Maria del Popolo | de paso · por fuera, en vez de la visita |  |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 22:00 | 22:45 | 45 min | 🌙 Plaza de España (noche) | experiencia nocturna | |
| 22:55 | 23:20 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: Vaticano (Con medio día más podrías ver el Vaticano.).
- **Imprescindibles que no salen**: Museos Vaticanos y Capilla Sixtina, Basílica de San Pedro, Plaza de San Pedro.

<a id="viaje-28"></a>
## Viaje 28 — 1 día · tranquilo · sin experiencias · enero · empieza en lunes

Del lunes 11 de enero al lunes 11 de enero de 2027.

> **Banner**: Un día en Roma en invierno es un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1 — lunes 11 de enero · Roma — día 1

- **Mañana**: ruta de 1 día, bloque A (`short_trips`)
- **Tarde**: bloque B (`short_trips`)
- **Atardecer**: 16:59
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Coliseo y el Foro Romano

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:15 | 12:00 | 105 min | Foro Romano y Palatino |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:00 | 15:30 | 30 min | Piazza Navona |  | 🚶 22 min desde la comida |
| 15:40 | 16:10 | 30 min | Panteón |  |  |
| 16:30 | 17:00 | 30 min | Fontana de Trevi |  |  |
| 17:15 | 17:45 | 30 min | Plaza de España |  |  |
| 18:00 | 18:30 | 30 min | Piazza del Popolo |  |  |
| 18:45 | 19:05 | 20 min | Terraza del Pincio |  |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 21:30 | 22:15 | 45 min | 🌙 Plaza de España (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |
| 23:00 | 23:25 | 25 min | 🌙 Panteón (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: Vaticano (Con medio día más podrías ver el Vaticano.).
- **Imprescindibles que no salen**: Museos Vaticanos y Capilla Sixtina, Basílica de San Pedro, Plaza de San Pedro, Altar de la Patria.

<a id="viaje-29"></a>
## Viaje 29 — 5 días · completo · Naturaleza + Barrios · abril · empieza en lunes

Del lunes 12 de abril al viernes 16 de abril de 2027.

> **Banner**: ninguno.

### Día 1 — lunes 12 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El Aventino al atardecer y cena en Testaccio (`aventino_testaccio`)
- **Atardecer**: 19:47
- 🚌 Altar de la Patria → Mercado de Testaccio: ~35 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:30 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 14:30 | 14:45 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 15:30 | 15:40 | 10 min | Mercado de Testaccio | de paso | 🚶 34 min desde Altar de la Patria |
| 16:00 | 16:25 | 25 min | Cementerio Protestante |  |  |
| 16:45 | 16:55 | 10 min | Circo Máximo | de paso | 🚶 19 min desde Cementerio Protestante |
| 17:15 | 17:35 | 20 min | Boca de la Verdad |  |  |
| 18:00 | 18:20 | 20 min | Jardín de los Naranjos |  |  |
| 18:30 | 18:40 | 10 min | Ojo de la Cerradura del Aventino |  |  |
| 19:00 | 19:10 | 10 min | Pirámide Cestia | de paso |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Testaccio |  |

### Día 2 — martes 13 de abril · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:48
- 🚌 Puente Sant'Angelo → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:20 | 13:50 | 30 min | Cúpula de San Pedro |  |  |
| 14:00 | 15:30 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:30 | 15:40 | 10 min | Via della Conciliazione | de paso |  |
| 15:45 | 15:55 | 10 min | Borgo Pio | de paso |  |
| 16:15 | 16:30 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 17:00 | 17:30 | 30 min | San Pietro in Montorio y Tempietto de Bramante |  | 🚶 27 min desde Puente Sant'Angelo |
| 17:45 | 18:00 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:05 | 19:48 | 43 min | Mirador del Janículo | 🌅 atardecer 19:48 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 3 — miércoles 14 de abril · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 19:49

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 10:30 | 11:00 | 30 min | Panteón |  |  |
| 11:30 | 12:00 | 30 min | Piazza Navona |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Trattoria Dal Cavalier Gino | en Centro Histórico | |
| 14:30 | 14:45 | 15 min | Plaza Colonna |  |  |
| 14:50 | 15:00 | 10 min | Via del Corso | de paso |  |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  | 🚶 18 min desde Via del Corso |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:40 | 10 min | Elefantino de Bernini |  |  |
| 17:45 | 18:15 | 30 min | Iglesia del Gesù |  |  |
| 18:30 | 18:55 | 25 min | Campo de' Fiori |  |  |
| | | 60 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Farnese, Fuente de las Tortugas | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 4 — jueves 15 de abril · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 19:51
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — viernes 16 de abril · Roma — día 5

- **Mañana**: Galería Borghese, el parque y el Popolo (`borghese`)
- **Tarde**: Del Popolo al Pincio al atardecer (`tridente_pincio`)
- **Atardecer**: 19:52

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 11:00 | 120 min | Galería Borghese |  |  |
| 11:30 | 13:00 | 90 min | Parque de Villa Borghese |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 14:30 | 14:40 | 10 min | Plaza de España | de paso |  |
| 15:00 | 15:30 | 30 min | Piazza del Popolo |  |  |
| 16:00 | 16:30 | 30 min | Santa Maria del Popolo |  |  |
| 16:45 | 17:05 | 20 min | Terraza del Pincio |  |  |
| 17:30 | 18:15 | 45 min | Ara Pacis |  |  |
| | | 99 min | 🕐 **Tarde libre** |  | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-30"></a>
## Viaje 30 — 5 días · tranquilo · Free Tour + Arte · julio · empieza en sábado

Del sábado 17 de julio al miércoles 21 de julio de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 1 día empieza antes, para que no te quedes sin ver el Panteón.

### Día 1 — sábado 17 de julio · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El Vaticano por la tarde (`vaticano_por_la_tarde`)
- **Atardecer**: 20:43
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver Basílica de San Pedro

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:15 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:30 | 30 min | Plaza de San Pedro |  |  |
| 18:35 | 19:50 | 75 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Prati y Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | experiencia nocturna | |

### Día 2 — domingo 18 de julio · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:42
- ⚠️ Hoy empezamos a las 08:30 para que te dé tiempo a ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 08:45 | 15 min | Arco de Constantino |  |  |
| 08:50 | 10:20 | 90 min | Coliseo |  |  |
| 11:00 | 12:45 | 105 min | Foro Romano y Palatino |  |  |
| 13:00 | 13:10 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:15 | 15:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:15 | 15:25 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:30 | 16:00 | 30 min | Barrio Judío |  |  |
| 16:15 | 16:25 | 10 min | Plaza Farnese | de paso |  |
| 16:30 | 16:40 | 10 min | Campo de' Fiori | de paso |  |
| 17:00 | 17:10 | 10 min | Piazza Navona | de paso |  |
| 17:15 | 17:35 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:45 | 18:05 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:10 | 18:20 | 10 min | Elefantino de Bernini | de paso |  |
| 18:25 | 18:55 | 30 min | Panteón |  |  |
| | | 58 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Iglesia del Gesù, Largo di Torre Argentina | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 3 — lunes 19 de julio · Roma — día 3

- **Mañana**: Trastevere de mañana y la Villa Farnesina (`trastevere_manana`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 20:41

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:20 | 20 min | Isla Tiberina |  |  |
| 10:30 | 11:00 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 11:30 | 11:50 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 11:55 | 12:40 | 45 min | Trastevere |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Tonnarello | en Trastevere | |
| 15:00 | 15:10 | 10 min | Teatro de Marcelo | de paso |  |
| 15:30 | 15:40 | 10 min | Plaza Venecia | de paso |  |
| 15:45 | 16:45 | 60 min | Altar de la Patria |  |  |
| 17:00 | 19:00 | 120 min | Museos Capitolinos |  |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Plaza del Campidoglio, Largo di Torre Argentina, Columna de Trajano | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 4 — martes 20 de julio · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:40
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — miércoles 21 de julio · Roma — día 5

- **Mañana**: Galería Borghese, el parque y el Popolo (`borghese`)
- **Tarde**: Del Popolo al Pincio al atardecer (`tridente_pincio`)
- **Atardecer**: 20:40

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:00 | 120 min | Galería Borghese |  |  |
| 12:30 | 12:40 | 10 min | Parque de Villa Borghese | de paso |  |
| 13:00 | 13:10 | 10 min | Terraza del Pincio | de paso |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:15 | 15:25 | 10 min | Plaza de España | de paso |  |
| 15:45 | 16:15 | 30 min | Piazza del Popolo |  |  |
| 16:20 | 16:50 | 30 min | Santa Maria del Popolo |  |  |
| 17:00 | 17:45 | 45 min | Ara Pacis |  |  |
| 18:00 | 18:15 | 15 min | Plaza Colonna |  |  |
| 18:20 | 18:30 | 10 min | Via del Corso | de paso |  |
| | | 85 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Tridente y Spagna |  | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Villa Farnesina (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

## Lo que parece raro (para decidir; no se ha arreglado nada)

Sacado de las rutas de arriba con estos criterios: traslados de más de 25 min sin su aviso (con aviso no son un fallo), ritmo tranquilo antes de las 10:00 sin aviso o por algo que no es nivel 1, lo mejor primero (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día), horarios que no dan (se llega tarde andando; tras la comida no se mira, su franja ya lleva el paseo), esperas de más de 60 min entre paradas (sin la comida), días flojos (menos de 4 paradas en completo o 3 en tranquilo, sin el último día), días que acaban antes de las 17:00, tardes libres, avisos del día, un lugar de día y de noche el mismo día, lugares repetidos, imprescindibles que no salen y rutas iguales.

### Patrones que se repiten

- **Panteón: de día y otra vez de noche el mismo día** — 8 veces: viaje 1 día 1 (18:10 y 21:30); viaje 2 día 1 (18:00 y 21:30); viaje 4 día 2 (18:00 y 21:30); viaje 5 día 1 (18:10 y 21:30); viaje 6 día 1 (18:10 y 21:30); viaje 7 día 1 (18:00 y 21:30); viaje 8 día 2 (18:10 y 21:30); viaje 28 día 1 (15:40 y 23:00).
- **Fontana de Trevi: de día y otra vez de noche el mismo día** — 9 veces: viaje 1 día 1 (19:00 y 22:25); viaje 2 día 1 (18:45 y 22:25); viaje 4 día 2 (18:45 y 22:25); viaje 5 día 1 (19:00 y 22:25); viaje 6 día 1 (19:00 y 22:25); viaje 7 día 1 (18:45 y 22:25); viaje 8 día 2 (19:00 y 22:25); viaje 27 día 1 (16:30 y 22:55); viaje 28 día 1 (16:30 y 22:25).
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España"** — 3 veces: viaje 2 día 1; viaje 4 día 2; viaje 7 día 1.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Panteón"** — 1 vez: viaje 9 día 2.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria"** — 3 veces: viaje 11 día 1; viaje 16 día 1; viaje 20 día 2.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 09:00 para que te dé tiempo a ver el Foro Romano"** — 2 veces: viaje 14 día 1; viaje 25 día 1.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria"** — 1 vez: viaje 18 día 2.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 09:00 para que te dé tiempo a ver el Panteón"** — 1 vez: viaje 22 día 1.
- **Plaza de España: de día y otra vez de noche el mismo día** — 2 veces: viaje 27 día 1 (17:15 y 22:00); viaje 28 día 1 (17:15 y 21:30).
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Coliseo y el Foro Romano"** — 1 vez: viaje 28 día 1.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:30 para que te dé tiempo a ver el Panteón"** — 1 vez: viaje 30 día 2.

### Caso a caso

- **Viaje 2, día 1** (2 d, tranquilo, abril): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España, y la comida es más corta para ver el Panteón".
- **Viaje 4, día 2** (2 d, tranquilo, febrero): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España, y la comida es más corta para ver el Panteón".
- **Viaje 7, día 1** (2 d, tranquilo, enero): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España, y la comida es más corta para ver el Panteón".
- **Viaje 9, día 1** (2 d, tranquilo, agosto): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver Basílica de San Pedro".
- **Viaje 9** (2 d, tranquilo, agosto): la ruta es igual que la del viaje 3.
- **Viaje 10, día 1** (3 d, completo, abril): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver el Panteón".
- **Viaje 11, día 1** (3 d, tranquilo, julio): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón".
- **Viaje 12, día 2** (3 d, completo, enero): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver el Panteón".
- **Viaje 13** (3 d, completo, mayo): lo mejor primero, en rojo: joya Fontana de Trevi el día 3 (el último), joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 14, día 1** (3 d, tranquilo, febrero): además la comida es más corta: "Hoy empezamos a las 09:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón".
- **Viaje 15** (3 d, completo, julio): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 16, día 1** (3 d, tranquilo, abril): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón".
- **Viaje 17, día 2** (3 d, completo, agosto): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver el Panteón".
- **Viaje 18** (3 d, tranquilo, enero): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 19, día 1** (4 d, completo, enero): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver el Panteón".
- **Viaje 20, día 2** (4 d, tranquilo, abril): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón".
- **Viaje 22, día 2** (4 d, tranquilo, mayo): aviso del día: "Hoy empezamos a las 08:00 para que te dé tiempo a verlo todo".
- **Viaje 23, día 2** (4 d, completo, febrero): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver el Panteón".
- **Viaje 24, día 2** (4 d, completo, julio): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver el Panteón".
- **Viaje 25, día 1** (4 d, tranquilo, enero): además la comida es más corta: "Hoy empezamos a las 09:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón".
- **Viaje 26** (4 d, completo, abril): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).
- **Viaje 30, día 1** (5 d, tranquilo, julio): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver Basílica de San Pedro".

