# Revisión completa de rutas de Roma

Motor v3 tal cual está (sin tocar nada), generado el 2026-09-26 con `node scripts/destino/revisionCompleta.mjs`. 30 viajes: sobre todo de 2, 3 y 4 días, y dos de 1 y dos de 5 días como referencia. Todos con fecha, así que los horarios, los cierres y la puesta de sol son los de ese día.

Cómo leerlo:
- **Llega / Sale**: la hora a la que se llega a la parada y a la que se sale; **Dura**: el tiempo en ella.
- **Nota**: "de paso" (se pasa por delante, sin pararse), 🌅 el mirador del atardecer, "tiempo libre", y los avisos de horario.
- **Traslado**: solo los de más de 15 min andando, con los minutos (matriz del destino). El aviso de transporte del día (🚌) va arriba del día.
- 🍝 comida con su restaurante y barrio; 🍷 cena con su barrio (el motor elige el barrio de la cena, no el restaurante); 🌙 experiencia nocturna.
- Al final de cada viaje, lo que no entró; al final del documento, **lo que parece raro**, para decidir.

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

### Día 1 — miércoles 14 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 19:49
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver Plaza de España y Altar de la Patria, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 14:30 | 14:50 | 20 min | Barrio Judío |  |  |
| 15:15 | 15:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 16:00 | 16:10 | 10 min | Plaza Farnese | de paso | 🚶 17 min desde Altar de la Patria |
| 16:15 | 16:25 | 10 min | Campo de' Fiori | de paso |  |
| 16:45 | 17:15 | 30 min | Piazza Navona |  |  |
| 17:30 | 17:40 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 18:00 | 18:10 | 10 min | Elefantino de Bernini | de paso |  |
| 18:15 | 18:45 | 30 min | Panteón |  |  |
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 15 de abril · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:51
- 🚌 Basílica de San Pedro → Trastevere: ~25 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 26 min desde Basílica de San Pedro |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| | | 45 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Fontana dell'Acqua Paola, Isla Tiberina, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Cúpula de San Pedro (No te dio tiempo); Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-3"></a>
## Viaje 3 — 2 días · completo · Free Tour + Barrios · julio · empieza en sábado

Del sábado 17 de julio al domingo 18 de julio de 2027.

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

### Día 1 — sábado 20 de febrero · Roma — día 1

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:49

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 17:45 | 18:25 | 40 min | Mirador del Janículo | 🌅 atardecer 17:49 | 🚶 24 min desde Basílica de San Pedro |
| 18:45 | 18:55 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| | | 58 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Iglesia de Santa Maria in Trastevere, Trastevere, Fontana dell'Acqua Paola | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 21 de febrero · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:50
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 14:30 | 14:50 | 20 min | Barrio Judío |  |  |
| 15:15 | 15:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 16:00 | 16:10 | 10 min | Plaza Farnese | de paso | 🚶 17 min desde Altar de la Patria |
| 16:15 | 16:25 | 10 min | Campo de' Fiori | de paso |  |
| 16:45 | 17:15 | 30 min | Piazza Navona |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:00 | 18:10 | 10 min | Elefantino de Bernini | de paso |  |
| 18:15 | 18:45 | 30 min | Panteón |  |  |
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
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

### Día 1 — miércoles 13 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:01
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 14:15 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 14:30 | 14:50 | 20 min | Barrio Judío |  |  |
| 15:15 | 15:30 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 16:00 | 16:10 | 10 min | Plaza Farnese | de paso | 🚶 17 min desde Altar de la Patria |
| 16:15 | 16:25 | 10 min | Campo de' Fiori | de paso |  |
| 16:45 | 17:15 | 30 min | Piazza Navona |  |  |
| 17:30 | 17:40 | 10 min | Iglesia de San Luigi dei Francesi | de paso |  |
| 18:00 | 18:10 | 10 min | Elefantino de Bernini | de paso |  |
| 18:15 | 18:45 | 30 min | Panteón |  |  |
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | experiencia nocturna | |
| 22:25 | 22:50 | 25 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 14 de enero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:03
- 🚌 Basílica de San Pedro → Trastevere: ~25 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 26 min desde Basílica de San Pedro |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| | | 45 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Isla Tiberina, Plaza Trilussa, Fontana dell'Acqua Paola | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-8"></a>
## Viaje 8 — 2 días · completo · sin experiencias · abril · empieza en sábado

Del sábado 17 de abril al domingo 18 de abril de 2027.

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

### Día 1 — lunes 12 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 19:47

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
| 17:00 | 17:30 | 30 min | Barrio Judío |  |  |
| 17:35 | 17:45 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:00 | 18:30 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:45 | 19:05 | 20 min | Isla Tiberina |  |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

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
| 10:30 | 11:00 | 30 min | Panteón |  |  |
| 11:30 | 12:00 | 30 min | Piazza Navona |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Trattoria Dal Cavalier Gino | en Centro Histórico | |
| 14:30 | 14:45 | 15 min | Plaza Colonna |  |  |
| 14:50 | 15:00 | 10 min | Via del Corso | de paso |  |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  | 🚶 18 min desde Via del Corso |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:50 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Largo di Torre Argentina, Campo de' Fiori, Elefantino de Bernini | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).

<a id="viaje-11"></a>
## Viaje 11 — 3 días · tranquilo · Barrios · julio · empieza en miércoles

Del miércoles 14 de julio al viernes 16 de julio de 2027.

### Día 1 — miércoles 14 de julio · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 20:44
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 15:00 | 15:20 | 20 min | Isla Tiberina |  | 🚶 16 min desde la comida |
| 15:30 | 15:40 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:45 | 16:15 | 30 min | Barrio Judío |  |  |
| 16:30 | 16:40 | 10 min | Teatro de Marcelo | de paso |  |
| 17:00 | 17:10 | 10 min | Plaza Venecia | de paso |  |
| 17:15 | 18:15 | 60 min | Altar de la Patria |  |  |
| 18:30 | 18:50 | 20 min | Plaza del Campidoglio |  |  |
| | | 56 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Campo de' Fiori, Largo di Torre Argentina, Columna de Trajano | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 2 — jueves 15 de julio · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:44
- 🚌 Borgo Pio → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 17:30 | 17:40 | 10 min | Via della Conciliazione | de paso |  |
| 17:45 | 17:55 | 10 min | Borgo Pio | de paso |  |
| 18:30 | 18:40 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso | 🚶 27 min desde Borgo Pio |
| | | 63 min | 🕐 **Tiempo libre** | antes de Mirador del Janículo · Iglesia de Santa Maria in Trastevere, Fontana dell'Acqua Paola, Plaza Trilussa | |
| 20:00 | 20:44 | 44 min | Mirador del Janículo | 🌅 atardecer 20:44 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 3 — viernes 16 de julio · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 20:43
- 🚌 Iglesia del Gesù → Iglesia de Santa Maria della Vittoria: ~25 min andando · o en bus 492 hasta Largo di Santa Susanna (unos 20 min) o taxi (unos 10 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 12:30 | 13:15 | 45 min | Panteón |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:15 | 15:45 | 30 min | Piazza Navona |  |  |
| 16:00 | 16:30 | 30 min | Iglesia del Gesù |  |  |
| 17:00 | 17:35 | 35 min | Iglesia de Santa Maria della Vittoria |  | 🚶 26 min desde Iglesia del Gesù |
| 17:45 | 17:55 | 10 min | Fuente del Tritón | de paso |  |
| 18:15 | 18:35 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Plaza Colonna, Elefantino de Bernini, Iglesia de Santa Maria sopra Minerva | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).

<a id="viaje-12"></a>
## Viaje 12 — 3 días · completo · Naturaleza · enero · empieza en sábado

Del sábado 16 de enero al lunes 18 de enero de 2027.

### Día 1 — sábado 16 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 17:05

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
| 17:00 | 17:30 | 30 min | Barrio Judío |  |  |
| 17:35 | 17:45 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:00 | 18:30 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:45 | 19:05 | 20 min | Isla Tiberina |  |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 17 de enero · Roma — día 2

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 17:06

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:30 | 10:00 | 30 min | Fontana de Trevi |  |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:40 | 10 min | Via Condotti | de paso |  |
| 12:00 | 12:30 | 30 min | Panteón |  |  |
| 13:00 | 13:30 | 30 min | Piazza Navona |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Trattoria Dal Cavalier Gino | en Centro Histórico | |
| 15:00 | 15:15 | 15 min | Plaza Colonna |  |  |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  | 🚶 18 min desde Plaza Colonna |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:40 | 10 min | Elefantino de Bernini |  |  |
| 17:45 | 18:15 | 30 min | Iglesia del Gesù |  |  |
| 18:20 | 18:40 | 20 min | Largo di Torre Argentina |  |  |
| | | 73 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Campo de' Fiori, Plaza Farnese | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 3 — lunes 18 de enero · Roma — día 3

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:07
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
| 17:15 | 17:55 | 40 min | Mirador del Janículo | 🌅 atardecer 17:07 | 🚶 31 min desde Puente Sant'Angelo |
| 18:15 | 18:30 | 15 min | Fontana dell'Acqua Paola |  | 🚶 16 min desde Mirador del Janículo |
| 18:45 | 19:30 | 45 min | Trastevere |  |  |
| 19:35 | 19:55 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).

<a id="viaje-13"></a>
## Viaje 13 — 3 días · completo · Free Tour + Arte · mayo · empieza en sábado · pool: Termas de Caracalla

Del sábado 15 de mayo al lunes 17 de mayo de 2027.

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

### Día 1 — lunes 15 de febrero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 17:43
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano

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
| 17:30 | 18:00 | 30 min | Barrio Judío |  |  |
| 18:05 | 18:15 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:30 | 18:50 | 20 min | Isla Tiberina |  |  |
| | | 61 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Trastevere, Iglesia de Santa Maria in Trastevere | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — martes 16 de febrero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 17:45 | 18:25 | 40 min | Mirador del Janículo | 🌅 atardecer 17:44 | 🚶 24 min desde Basílica de San Pedro |
| 18:45 | 18:55 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| | | 58 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Iglesia de Santa Maria in Trastevere, Trastevere, Fontana dell'Acqua Paola | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — miércoles 17 de febrero · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 17:45
- 🚌 Iglesia del Gesù → Iglesia de Santa Maria della Vittoria: ~25 min andando · o en bus 492 hasta Largo di Santa Susanna (unos 20 min) o taxi (unos 10 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 12:30 | 13:15 | 45 min | Panteón |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:15 | 15:45 | 30 min | Piazza Navona |  |  |
| 16:00 | 16:30 | 30 min | Iglesia del Gesù |  |  |
| 17:00 | 17:35 | 35 min | Iglesia de Santa Maria della Vittoria |  | 🚶 26 min desde Iglesia del Gesù |
| 17:45 | 17:55 | 10 min | Fuente del Tritón | de paso |  |
| 18:15 | 18:35 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Plaza Colonna, Elefantino de Bernini, Iglesia de Santa Maria sopra Minerva | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).

<a id="viaje-15"></a>
## Viaje 15 — 3 días · completo · Barrios + Naturaleza · julio · empieza en sábado · pool: Galería Borghese

Del sábado 17 de julio al lunes 19 de julio de 2027.

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

### Día 1 — miércoles 14 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 19:49
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 15:00 | 15:20 | 20 min | Isla Tiberina |  | 🚶 16 min desde la comida |
| 15:30 | 15:40 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:45 | 16:15 | 30 min | Barrio Judío |  |  |
| 16:30 | 16:40 | 10 min | Teatro de Marcelo | de paso |  |
| 17:00 | 17:10 | 10 min | Plaza Venecia | de paso |  |
| 17:15 | 18:15 | 60 min | Altar de la Patria |  |  |
| 18:30 | 18:50 | 20 min | Plaza del Campidoglio |  |  |
| | | 56 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Campo de' Fiori, Columna de Trajano | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 2 — jueves 15 de abril · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:51
- 🚌 Basílica de San Pedro → Trastevere: ~25 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 26 min desde Basílica de San Pedro |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| | | 45 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Plaza Trilussa, Fontana dell'Acqua Paola | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — viernes 16 de abril · Roma — día 3

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 19:52
- 🚌 Iglesia del Gesù → Iglesia de Santa Maria della Vittoria: ~25 min andando · o en bus 492 hasta Largo di Santa Susanna (unos 20 min) o taxi (unos 10 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 12:30 | 13:15 | 45 min | Panteón |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:15 | 15:45 | 30 min | Piazza Navona |  |  |
| 16:00 | 16:30 | 30 min | Iglesia del Gesù |  |  |
| 17:00 | 17:35 | 35 min | Iglesia de Santa Maria della Vittoria |  | 🚶 26 min desde Iglesia del Gesù |
| 17:45 | 17:55 | 10 min | Fuente del Tritón | de paso |  |
| 18:15 | 18:35 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Iglesia de Santa Maria sopra Minerva, Plaza Colonna, Elefantino de Bernini | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).

<a id="viaje-17"></a>
## Viaje 17 — 3 días · completo · sin experiencias · agosto · empieza en sábado

Del sábado 7 de agosto al lunes 9 de agosto de 2027.

### Día 1 — sábado 7 de agosto · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 20:22

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
| 17:00 | 17:30 | 30 min | Barrio Judío |  |  |
| 17:35 | 17:45 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:00 | 18:30 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:45 | 19:05 | 20 min | Isla Tiberina |  |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 8 de agosto · Roma — día 2

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 20:20

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:30 | 10:00 | 30 min | Fontana de Trevi |  |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:40 | 10 min | Via Condotti | de paso |  |
| 12:00 | 12:30 | 30 min | Panteón |  |  |
| 13:00 | 13:30 | 30 min | Piazza Navona |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Trattoria Dal Cavalier Gino | en Centro Histórico | |
| 15:00 | 15:15 | 15 min | Plaza Colonna |  |  |
| 16:00 | 16:20 | 20 min | Iglesia de Santa Maria della Vittoria |  | 🚶 18 min desde Plaza Colonna |
| 16:30 | 16:40 | 10 min | Fuente del Tritón | de paso |  |
| 17:00 | 17:20 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:30 | 17:40 | 10 min | Elefantino de Bernini |  |  |
| 17:45 | 18:15 | 30 min | Iglesia del Gesù |  |  |
| 18:20 | 18:40 | 20 min | Largo di Torre Argentina |  |  |
| | | 73 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Campo de' Fiori, Plaza Farnese | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 3 — lunes 9 de agosto · Roma — día 3

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:19

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 18:00 | 90 min | Trastevere |  | 🚶 24 min desde Puente Sant'Angelo |
| 18:05 | 18:25 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:45 | 19:00 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:35 | 20:19 | 44 min | Mirador del Janículo | 🌅 atardecer 20:19 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).

<a id="viaje-18"></a>
## Viaje 18 — 3 días · tranquilo · Free Tour + Naturaleza · enero · empieza en miércoles

Del miércoles 13 de enero al viernes 15 de enero de 2027.

### Día 1 — miércoles 13 de enero · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 17:01

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:00 | 15:45 | 45 min | Panteón |  |  |
| 15:50 | 16:00 | 10 min | Elefantino de Bernini | de paso |  |
| 16:05 | 16:25 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 16:45 | 17:05 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:10 | 17:20 | 10 min | Piazza Navona | de paso |  |
| 17:30 | 17:40 | 10 min | Campo de' Fiori | de paso |  |
| 17:45 | 17:55 | 10 min | Plaza Farnese | de paso |  |
| 18:15 | 18:45 | 30 min | Barrio Judío |  |  |
| 18:50 | 19:00 | 10 min | Fuente de las Tortugas | de paso |  |
| | | 50 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Trilussa, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 14 de enero · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 17:03
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano

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
| | | 61 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — viernes 15 de enero · Roma — día 3

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:04
- 🚌 Basílica de San Pedro → Trastevere: ~25 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 26 min desde Basílica de San Pedro |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| | | 45 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Fontana dell'Acqua Paola, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Cúpula de San Pedro (No te dio tiempo); Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).

<a id="viaje-19"></a>
## Viaje 19 — 4 días · completo · Arte + Naturaleza · enero · empieza en lunes

Del lunes 11 de enero al jueves 14 de enero de 2027.

### Día 1 — lunes 11 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 16:59

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
| 17:00 | 17:30 | 30 min | Barrio Judío |  |  |
| 17:35 | 17:45 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:00 | 18:30 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:45 | 19:05 | 20 min | Isla Tiberina |  |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

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
- 🚌 Desde la comida → Galería Borghese: ~30 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:30 | 30 min | Fontana de Trevi |  |  |
| 09:00 | 09:30 | 30 min | Plaza de España |  |  |
| 10:00 | 10:10 | 10 min | Via Condotti | de paso |  |
| 10:30 | 11:00 | 30 min | Panteón |  |  |
| 11:30 | 12:00 | 30 min | Piazza Navona |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Poldo e Gianna Osteria | en Tridente y Spagna | |
| 14:45 | 16:45 | 120 min | Galería Borghese |  | 🚶 29 min desde la comida |
| 17:15 | 17:35 | 20 min | Terraza del Pincio | 🌅 atardecer 17:03 | 🚶 17 min desde Galería Borghese |
| 17:45 | 18:15 | 30 min | Piazza del Popolo |  |  |
| 18:20 | 18:30 | 10 min | Santa Maria del Popolo | de paso |  |
| | | 79 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Tridente y Spagna | Via del Corso, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 4 (el último), joya Panteón el día 4 (el último).

<a id="viaje-20"></a>
## Viaje 20 — 4 días · tranquilo · Barrios · abril · empieza en sábado

Del sábado 17 de abril al martes 20 de abril de 2027.

### Día 1 — sábado 17 de abril · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 19:53
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 15:00 | 15:20 | 20 min | Isla Tiberina |  | 🚶 16 min desde la comida |
| 15:30 | 15:40 | 10 min | Fuente de las Tortugas | de paso |  |
| 15:45 | 16:15 | 30 min | Barrio Judío |  |  |
| 16:30 | 16:40 | 10 min | Teatro de Marcelo | de paso |  |
| 17:00 | 17:10 | 10 min | Plaza Venecia | de paso |  |
| 17:15 | 18:15 | 60 min | Altar de la Patria |  |  |
| 18:30 | 18:50 | 20 min | Plaza del Campidoglio |  |  |
| | | 56 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Campo de' Fiori, Largo di Torre Argentina, Columna de Trajano | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 2 — domingo 18 de abril · Roma — día 2

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 19:54
- 🚌 Iglesia del Gesù → Iglesia de Santa Maria della Vittoria: ~25 min andando · o en bus 492 hasta Largo di Santa Susanna (unos 20 min) o taxi (unos 10 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 12:30 | 13:15 | 45 min | Panteón |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:15 | 15:45 | 30 min | Piazza Navona |  |  |
| 16:00 | 16:30 | 30 min | Iglesia del Gesù |  |  |
| 17:00 | 17:35 | 35 min | Iglesia de Santa Maria della Vittoria |  | 🚶 26 min desde Iglesia del Gesù |
| 17:45 | 17:55 | 10 min | Fuente del Tritón | de paso |  |
| 18:15 | 18:35 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| | | 77 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trevi | Plaza Colonna, Elefantino de Bernini, Iglesia de Santa Maria sopra Minerva | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi |  |

### Día 3 — lunes 19 de abril · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 19:55
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — martes 20 de abril · Roma — día 4

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:56
- 🚌 Basílica de San Pedro → Trastevere: ~25 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 26 min desde Basílica de San Pedro |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| | | 45 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Plaza Trilussa, Fontana dell'Acqua Paola | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).

<a id="viaje-21"></a>
## Viaje 21 — 4 días · completo · Free Tour · julio · empieza en miércoles

Del miércoles 14 de julio al sábado 17 de julio de 2027.

### Día 1 — miércoles 14 de julio · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 14:30 | 15:00 | 30 min | Panteón |  |  |
| 15:05 | 15:15 | 10 min | Elefantino de Bernini | de paso |  |
| 15:20 | 15:40 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 16:00 | 16:20 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 16:25 | 16:35 | 10 min | Piazza Navona | de paso |  |
| 16:45 | 16:55 | 10 min | Campo de' Fiori | de paso |  |
| 17:00 | 17:10 | 10 min | Plaza Farnese | de paso |  |
| 17:30 | 18:00 | 30 min | Barrio Judío |  |  |
| 18:05 | 18:15 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:20 | 18:40 | 20 min | Largo di Torre Argentina |  |  |
| | | 73 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Iglesia del Gesù, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — jueves 15 de julio · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 20:44

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
| 17:15 | 17:35 | 20 min | Isla Tiberina |  |  |
| 17:45 | 18:15 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:30 | 18:45 | 15 min | Plaza Trilussa |  |  |
| | | 67 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere |  | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — viernes 16 de julio · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:43
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — sábado 17 de julio · Roma — día 4

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

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).

<a id="viaje-22"></a>
## Viaje 22 — 4 días · tranquilo · sin experiencias · mayo · empieza en lunes · pool: Castillo de Sant'Angelo, Basílica de San Clemente

Del lunes 10 de mayo al jueves 13 de mayo de 2027.

### Día 1 — lunes 10 de mayo · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: San Juan de Letrán, San Clemente y el Coliseo al anochecer (`letran_celio`)
- **Atardecer**: 20:18
- 🚌 Foro Romano y Palatino → Basílica de San Juan de Letrán: ~30 min andando · o en taxi (unos 10 min) o bus 87

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:15 | 15 min | Arco de Constantino |  |  |
| 10:20 | 12:05 | 105 min | Coliseo |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 15:00 | 17:00 | 120 min | Foro Romano y Palatino |  |  |
| 17:30 | 18:15 | 45 min | Basílica de San Juan de Letrán |  | 🚶 28 min desde Foro Romano y Palatino |
| 18:30 | 18:40 | 10 min | Basílica de San Clemente | de paso |  |
| | | 76 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Coliseo y Celio |  | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Coliseo y Celio |  |

### Día 2 — martes 11 de mayo · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:19
- 🚌 Castillo de Sant'Angelo → San Pietro in Montorio y Tempietto de Bramante: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 17:30 | 17:40 | 10 min | Via della Conciliazione | de paso |  |
| 17:45 | 17:55 | 10 min | Borgo Pio | de paso |  |
| 18:15 | 18:25 | 10 min | Puente Sant'Angelo | de paso |  |
| 18:30 | 18:40 | 10 min | Castillo de Sant'Angelo | de paso |  |
| 19:15 | 19:25 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso | 🚶 28 min desde Castillo de Sant'Angelo |
| 19:45 | 20:25 | 40 min | Mirador del Janículo | 🌅 atardecer 20:19 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

### Día 3 — miércoles 12 de mayo · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:20
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — jueves 13 de mayo · Roma — día 4

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Bernini, Trevi y la cúpula falsa de San Ignacio (`bernini_trevi`)
- **Atardecer**: 20:21
- 🚌 Iglesia del Gesù → Iglesia de Santa Maria della Vittoria: ~25 min andando · o en bus 492 hasta Largo di Santa Susanna (unos 20 min) o taxi (unos 10 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 12:30 | 13:15 | 45 min | Panteón |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:15 | 15:45 | 30 min | Piazza Navona |  |  |
| 16:00 | 16:30 | 30 min | Iglesia del Gesù |  |  |
| 17:00 | 17:35 | 35 min | Iglesia de Santa Maria della Vittoria |  | 🚶 26 min desde Iglesia del Gesù |
| 17:45 | 17:55 | 10 min | Fuente del Tritón | de paso |  |
| 18:15 | 18:35 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 19:00 | 19:15 | 15 min | Altar de la Patria | de paso · se ve por fuera: Plaza Venecia |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trevi | 🚶 17 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 4 (el último), joya Panteón el día 4 (el último).

<a id="viaje-23"></a>
## Viaje 23 — 4 días · completo · Naturaleza · febrero · empieza en sábado

Del sábado 20 de febrero al martes 23 de febrero de 2027.

### Día 1 — sábado 20 de febrero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 17:49

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
| 17:00 | 17:30 | 30 min | Barrio Judío |  |  |
| 17:35 | 17:45 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:00 | 18:30 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:45 | 19:05 | 20 min | Isla Tiberina |  |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 21 de febrero · Roma — día 2

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Galería Borghese, el parque y el Pincio (`villa_borghese_pincio`)
- **Atardecer**: 17:50
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
| 17:30 | 17:40 | 10 min | Parque de Villa Borghese | de paso |  |
| 18:00 | 18:20 | 20 min | Terraza del Pincio | 🌅 atardecer 17:50 |  |
| 18:30 | 19:00 | 30 min | Piazza del Popolo |  |  |
| | | 51 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Tridente y Spagna | Via del Corso, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

### Día 3 — lunes 22 de febrero · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 17:51
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — martes 23 de febrero · Roma — día 4

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:53
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
| 17:15 | 17:55 | 40 min | Mirador del Janículo | 🌅 atardecer 17:53 | 🚶 31 min desde Puente Sant'Angelo |
| 18:15 | 18:25 | 10 min | San Pietro in Montorio y Tempietto de Bramante | de paso |  |
| 18:30 | 18:45 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:00 | 19:45 | 45 min | Trastevere |  |  |
| 19:50 | 20:00 | 10 min | Iglesia de Santa Maria in Trastevere | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).

<a id="viaje-24"></a>
## Viaje 24 — 4 días · completo · Arte + Barrios · julio · empieza en sábado · pool: Trastevere

Del sábado 17 de julio al martes 20 de julio de 2027.

### Día 1 — sábado 17 de julio · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 20:43

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
| 17:00 | 17:30 | 30 min | Barrio Judío |  |  |
| 17:35 | 17:45 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:00 | 18:30 | 30 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 18:45 | 19:05 | 20 min | Isla Tiberina |  |  |
| | | 46 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — domingo 18 de julio · Roma — día 2

- **Mañana**: Trevi y la Escalinata sin gente, Panteón y Navona (`centro_temprano`)
- **Tarde**: Trastevere a fondo (`trastevere_a_fondo`)
- **Atardecer**: 20:42

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:30 | 10:00 | 30 min | Fontana de Trevi |  |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:40 | 10 min | Via Condotti | de paso |  |
| 12:00 | 12:30 | 30 min | Panteón |  |  |
| 13:00 | 13:30 | 30 min | Piazza Navona |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Forno Campo de' Fiori | en Centro Histórico | |
| 15:00 | 15:25 | 25 min | Campo de' Fiori |  |  |
| 15:45 | 16:30 | 45 min | Trastevere |  |  |
| 16:35 | 16:55 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 17:00 | 17:15 | 15 min | Plaza Trilussa |  |  |
| 17:30 | 18:00 | 30 min | San Pietro in Montorio y Tempietto de Bramante |  |  |
| 18:15 | 18:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| | | 82 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere |  | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — lunes 19 de julio · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:41
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — martes 20 de julio · Roma — día 4

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:40

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:30 | 12:00 | 30 min | Plaza de San Pedro |  |  |
| 12:05 | 13:20 | 75 min | Basílica de San Pedro |  |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Ristorante Arlù | en Vaticano y Borgo | |
| 15:00 | 15:10 | 10 min | Via della Conciliazione | de paso |  |
| 15:15 | 15:25 | 10 min | Borgo Pio | de paso |  |
| 15:45 | 16:00 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 16:40 | 10 min | Trastevere | de paso | 🚶 24 min desde Puente Sant'Angelo |
| 17:15 | 17:55 | 40 min | Mirador del Janículo |  | 🚶 23 min desde Trastevere |
| | | 104 min | 🕐 **Tarde libre** |  | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).

<a id="viaje-25"></a>
## Viaje 25 — 4 días · tranquilo · Arte · enero · empieza en miércoles

Del miércoles 13 de enero al sábado 16 de enero de 2027.

### Día 1 — miércoles 13 de enero · Roma — día 1

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 17:01
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano

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
| 17:30 | 18:00 | 30 min | Barrio Judío |  |  |
| 18:05 | 18:15 | 10 min | Fuente de las Tortugas | de paso |  |
| 18:30 | 18:50 | 20 min | Isla Tiberina |  |  |
| | | 61 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Boca de la Verdad, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — jueves 14 de enero · Roma — día 2

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 17:03
- 🚌 Basílica de San Pedro → Trastevere: ~25 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 18:00 | 18:45 | 45 min | Trastevere |  | 🚶 26 min desde Basílica de San Pedro |
| 18:50 | 19:10 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| | | 45 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Plaza Trilussa, Fontana dell'Acqua Paola | |
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
- 🚌 Piazza Navona → Iglesia de Santa Maria della Vittoria: ~30 min andando · o en bus 492 hasta Largo di Santa Susanna (unos 20 min) o taxi (unos 10 min)

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:30 | 30 min | Fontana de Trevi |  |  |
| 11:00 | 11:30 | 30 min | Plaza de España |  |  |
| 12:00 | 12:10 | 10 min | Via Condotti | de paso |  |
| 12:30 | 13:15 | 45 min | Panteón |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:15 | 15:45 | 30 min | Piazza Navona |  |  |
| 16:15 | 16:50 | 35 min | Iglesia de Santa Maria della Vittoria |  | 🚶 29 min desde Piazza Navona |
| 17:00 | 17:10 | 10 min | Fuente del Tritón | de paso |  |
| 17:30 | 17:50 | 20 min | Iglesia de San Ignacio de Loyola |  |  |
| 17:55 | 19:10 | 75 min | Palazzo Doria Pamphilj |  |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Fontana de Trevi el día 4 (el último), joya Panteón el día 4 (el último).

<a id="viaje-26"></a>
## Viaje 26 — 4 días · completo · Barrios + Naturaleza · abril · empieza en lunes · pool: Termas de Caracalla

Del lunes 12 de abril al jueves 15 de abril de 2027.

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
| 19:00 | 19:30 | 30 min | Fontana de Trevi |  |  |
| 19:45 | 20:00 | 15 min | Plaza de España | de paso |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico | 🚶 21 min |

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

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 19:51
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
| 19:10 | 19:51 | 41 min | Mirador del Janículo | 🌅 atardecer 19:51 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

#### Lo que quedó fuera

- **No te dio tiempo**: Mercado de Testaccio (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🔴 joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).

<a id="viaje-27"></a>
## Viaje 27 — 1 día · completo · Arte · mayo · empieza en sábado

Del sábado 15 de mayo al sábado 15 de mayo de 2027.

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

### Día 1 — sábado 17 de julio · Roma — día 1

- **Mañana**: Free Tour por el centro histórico (`free_tour`)
- **Tarde**: El centro barroco: Panteón, Caravaggio y el Ghetto (`centro_barroco`)
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 15:00 | | 🍝 **Comida**: Armando al Pantheon | en Centro Histórico | |
| 15:00 | 15:45 | 45 min | Panteón |  |  |
| 15:50 | 16:00 | 10 min | Elefantino de Bernini | de paso |  |
| 16:05 | 16:25 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 16:45 | 17:05 | 20 min | Iglesia de San Luigi dei Francesi |  |  |
| 17:10 | 17:20 | 10 min | Piazza Navona | de paso |  |
| 17:30 | 17:40 | 10 min | Campo de' Fiori | de paso |  |
| 17:45 | 17:55 | 10 min | Plaza Farnese | de paso |  |
| 18:15 | 18:45 | 30 min | Barrio Judío |  |  |
| 18:50 | 19:00 | 10 min | Fuente de las Tortugas | de paso |  |
| | | 50 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Trilussa, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | experiencia nocturna | |

### Día 2 — domingo 18 de julio · Roma — día 2

- **Mañana**: Coliseo, Foro y Palatino (`roma_antigua`)
- **Tarde**: Campidoglio, el Altar y el Ghetto (`campidoglio_ghetto`)
- **Atardecer**: 20:42
- ⚠️ Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:15 | 15 min | Arco de Constantino |  |  |
| 08:30 | 10:00 | 90 min | Coliseo |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:40 | 10 min | Via dei Fori Imperiali | de paso |  |
| 13:00 | 15:00 | | 🍝 **Comida**: La Prezzemolina | en Coliseo y Monti | |
| 15:00 | 15:20 | 20 min | Isla Tiberina |  | 🚶 16 min desde la comida |
| 15:30 | 15:40 | 10 min | Teatro de Marcelo | de paso |  |
| 16:00 | 16:10 | 10 min | Plaza Venecia | de paso |  |
| 16:15 | 17:15 | 60 min | Altar de la Patria |  |  |
| 17:30 | 17:50 | 20 min | Plaza del Campidoglio |  |  |
| 18:00 | 18:30 | 30 min | Iglesia del Gesù |  |  |
| | | 81 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Largo di Torre Argentina, Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

### Día 3 — lunes 19 de julio · Roma — día 3

- **Mañana**: Museos Vaticanos, San Pedro y la Cúpula (`vaticano`)
- **Tarde**: Del Castillo al Janículo y a cenar a Trastevere (`vaticano_trastevere`)
- **Atardecer**: 20:41
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:15 | 195 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:15 | 15:15 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:15 | 15:45 | 30 min | Plaza de San Pedro |  |  |
| 15:50 | 17:20 | 90 min | Basílica de San Pedro |  |  |
| 17:30 | 17:40 | 10 min | Via della Conciliazione | de paso |  |
| 17:45 | 17:55 | 10 min | Borgo Pio | de paso |  |
| 18:15 | 18:30 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 20:00 | 20:41 | 41 min | Mirador del Janículo | 🌅 atardecer 20:41 | 🚶 31 min desde Puente Sant'Angelo |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |

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
| 10:00 | 12:15 | 135 min | Galería Borghese |  |  |
| 12:30 | 12:40 | 10 min | Parque de Villa Borghese | de paso |  |
| 13:00 | 13:10 | 10 min | Terraza del Pincio | de paso |  |
| 13:15 | 15:15 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:15 | 15:25 | 10 min | Plaza de España | de paso |  |
| 15:45 | 16:15 | 30 min | Piazza del Popolo |  |  |
| 16:20 | 17:05 | 45 min | Santa Maria del Popolo |  |  |
| 17:15 | 18:15 | 60 min | Ara Pacis |  |  |
| 18:30 | 18:40 | 10 min | Via del Corso | de paso |  |
| | | 75 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Tridente y Spagna | Plaza Colonna | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

## Lo que parece raro (para decidir; no se ha arreglado nada)

Sacado de las rutas de arriba con estos criterios: traslados de más de 25 min sin su aviso (con aviso no son un fallo), ritmo tranquilo antes de las 10:00 sin aviso o por algo que no es nivel 1, lo mejor primero (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día), horarios que no dan (se llega tarde andando; tras la comida no se mira, su franja ya lleva el paseo), esperas de más de 60 min entre paradas (sin la comida), días flojos (menos de 4 paradas en completo o 3 en tranquilo, sin el último día), días que acaban antes de las 17:00, tardes libres, avisos del día, un lugar de día y de noche el mismo día, lugares repetidos, imprescindibles que no salen y rutas iguales.

### Patrones que se repiten

- **Panteón: de día y otra vez de noche el mismo día** — 8 veces: viaje 1 día 1 (18:10 y 21:30); viaje 2 día 1 (18:15 y 21:30); viaje 4 día 2 (18:15 y 21:30); viaje 5 día 1 (18:10 y 21:30); viaje 6 día 1 (18:10 y 21:30); viaje 7 día 1 (18:15 y 21:30); viaje 8 día 2 (18:10 y 21:30); viaje 28 día 1 (15:40 y 23:00).
- **Fontana de Trevi: de día y otra vez de noche el mismo día** — 9 veces: viaje 1 día 1 (19:00 y 22:25); viaje 2 día 1 (19:00 y 22:25); viaje 4 día 2 (19:00 y 22:25); viaje 5 día 1 (19:00 y 22:25); viaje 6 día 1 (19:00 y 22:25); viaje 7 día 1 (19:00 y 22:25); viaje 8 día 2 (19:00 y 22:25); viaje 27 día 1 (16:30 y 22:55); viaje 28 día 1 (16:30 y 22:25).
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver Plaza de España y Altar de la Patria"** — 1 vez: viaje 2 día 1.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano"** — 5 veces: viaje 4 día 2; viaje 7 día 1; viaje 14 día 1; viaje 18 día 2; viaje 25 día 1.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Panteón"** — 1 vez: viaje 9 día 2.
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria"** — 4 veces: viaje 11 día 1; viaje 16 día 1; viaje 20 día 1; viaje 30 día 2.
- **Plaza de España: de día y otra vez de noche el mismo día** — 2 veces: viaje 27 día 1 (17:15 y 22:00); viaje 28 día 1 (17:15 y 21:30).
- **Se madruga con ritmo tranquilo por un imprescindible (permitido, con aviso): "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Coliseo y el Foro Romano"** — 1 vez: viaje 28 día 1.

### Caso a caso

- **Viaje 2, día 1** (2 d, tranquilo, abril): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver Plaza de España y Altar de la Patria, y la comida es más corta para ver el Panteón".
- **Viaje 4, día 2** (2 d, tranquilo, febrero): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón".
- **Viaje 7, día 1** (2 d, tranquilo, enero): además la comida es más corta: "Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón".
- **Viaje 7** (2 d, tranquilo, enero): la ruta es igual que la del viaje 2.
- **Viaje 9, día 1** (2 d, tranquilo, agosto): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver Basílica de San Pedro".
- **Viaje 9** (2 d, tranquilo, agosto): la ruta es igual que la del viaje 3.
- **Viaje 10** (3 d, completo, abril): lo mejor primero, en rojo: joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).
- **Viaje 11** (3 d, tranquilo, julio): lo mejor primero, en rojo: joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).
- **Viaje 12** (3 d, completo, enero): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 13** (3 d, completo, mayo): lo mejor primero, en rojo: joya Fontana de Trevi el día 3 (el último), joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 14** (3 d, tranquilo, febrero): lo mejor primero, en rojo: joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).
- **Viaje 15** (3 d, completo, julio): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 16** (3 d, tranquilo, abril): lo mejor primero, en rojo: joya Fontana de Trevi el día 3 (el último), joya Panteón el día 3 (el último).
- **Viaje 17** (3 d, completo, agosto): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 18** (3 d, tranquilo, enero): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último).
- **Viaje 19** (4 d, completo, enero): lo mejor primero, en rojo: joya Fontana de Trevi el día 4 (el último), joya Panteón el día 4 (el último).
- **Viaje 20** (4 d, tranquilo, abril): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).
- **Viaje 21** (4 d, completo, julio): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).
- **Viaje 22** (4 d, tranquilo, mayo): lo mejor primero, en rojo: joya Fontana de Trevi el día 4 (el último), joya Panteón el día 4 (el último).
- **Viaje 23** (4 d, completo, febrero): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).
- **Viaje 24** (4 d, completo, julio): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).
- **Viaje 25** (4 d, tranquilo, enero): lo mejor primero, en rojo: joya Fontana de Trevi el día 4 (el último), joya Panteón el día 4 (el último).
- **Viaje 26** (4 d, completo, abril): lo mejor primero, en rojo: joya Museos Vaticanos y Capilla Sixtina el día 4 (el último).

