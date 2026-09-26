# Revisión de rutas de Roma — 16 viajes + 1 caso añadido

Motor v3, generado el 2026-09-26 con `node scripts/destino/revisionRutas.mjs`. Sin fechas, cada día usa el 15 del mes (horarios y puesta de sol) y el horario de laborables. "Andando" = minutos desde la parada anterior (matriz del destino; en la primera, desde el punto de partida no se cuenta).

## Resumen: mañanas y tardes tipo

- Bloques reordenados respecto al JSON: **0**.
- Medios días sin tipo (ningún bloque encaja y el motor improvisa): **0**.
- Huecos rojos (más de 90 min parado en mitad del viaje): **0**.
- 🔴 Lo mejor primero (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): **2** viajes en rojo (viaje 7: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último); viaje 9: joya Museos Vaticanos y Capilla Sixtina el día 3 (el último)).
- Imprescindibles que se ven desde la calle y faltan (viajes de 2+ días): **0**.

Los viajes de 1 día siguen con las rutas curadas de `short_trips` (con bloques salían peor).

| Viaje | Día | Mañana | Tarde |
|---|---|---|---|
| 1 | 1 | ruta de 1 día, bloque B (short_trips) | bloque A (short_trips) |
| 2 | 1 | ruta de 1 día, bloque A (short_trips) | bloque B (short_trips) |
| 3 | 1 | ruta de 1 día, bloque C (short_trips) | bloque B (short_trips) |
| 4 | 1 | Free Tour por el centro histórico (free_tour) | El Vaticano por la tarde (vaticano_por_la_tarde) |
| 4 | 2 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 5 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 5 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 6 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 6 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 6 | 3 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 7 | 1 | Free Tour por el centro histórico (free_tour) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 7 | 2 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 7 | 3 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 8 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 8 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 8 | 3 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 9 | 1 | Free Tour por el centro histórico (free_tour) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 9 | 2 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 9 | 3 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 10 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 10 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 10 | 3 | excursión de día completo | — |
| 10 | 4 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 11 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 11 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 11 | 3 | excursión de día completo | — |
| 11 | 4 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Galería Borghese, el parque y el Pincio (villa_borghese_pincio) |
| 12 | 1 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 12 | 2 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 12 | 3 | excursión de día completo | — |
| 12 | 4 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Galería Borghese, el parque y el Pincio (villa_borghese_pincio) |
| 13 | 1 | Galería Borghese, el parque y el Popolo (borghese) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 13 | 2 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 13 | 3 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 13 | 4 | excursión de día completo | — |
| 13 | 5 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | San Juan de Letrán, San Clemente y el Coliseo al anochecer (letran_celio) |
| 14 | 1 | Free Tour por el centro histórico (free_tour) | El Vaticano por la tarde (vaticano_por_la_tarde) |
| 14 | 2 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 14 | 3 | Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 14 | 4 | excursión de día completo | — |
| 14 | 5 | Galería Borghese, el parque y el Popolo (borghese) | Del Popolo al Pincio al atardecer (tridente_pincio) |
| 15 | 1 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 15 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 15 | 3 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 15 | 4 | excursión de día completo | — |
| 15 | 5 | Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 15 | 6 | excursión de medio día (ostia_antica) | Santa María la Mayor, el Moisés y Monti (monti_basilicas) |
| 16 | 1 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 16 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 16 | 3 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Galería Borghese, el parque y el Pincio (villa_borghese_pincio) |
| 16 | 4 | excursión de día completo | — |
| 16 | 5 | Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 16 | 6 | excursión de medio día (ostia_antica) | Santa María la Mayor, el Moisés y Monti (monti_basilicas) |
| 16 | 7 | excursión de medio día (tivoli_villas) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 17 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 17 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |

## 1. 1 día · diciembre · completo · Imprescindibles + Free Tour

> **Banner**: Un día en Roma en invierno es un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1

**Bloques**: ruta de 1 día de `short_trips` — mañana B · tarde A

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | — | Con el Free Tour descubrirás varios imprescindibles del centro histórico, como la Plaza de España, la Fontana de Trevi, el Panteón y la Piazza Navona, de la mano de un guía que te contará su historia y sus secretos. El recorrido es por fuera, sin entrar en los monumentos. Te los volveremos a enseñar a otra hora del viaje, porque la experiencia es totalmente distinta. |
| 13:00–14:30 | 🍝 **Comida**: Armando al Pantheon en Centro Histórico | | | |
| 14:30 | Arco de Constantino | 15 min | 24 min | Uno de los imprescindibles de Roma. |
| 14:50 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 16:30 | Foro Romano visto desde Via dei Fori Imperiali | 15 min | 10 min | El Foro Romano por dentro no da tiempo hoy, pero desde aquí lo tienes entero a tus pies. |
| 17:15 | Panteón | 30 min | 16 min | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Conocer su historia es imprescindible en cualquier viaje a Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 18:00 | Plaza Venecia | 10 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Altar de la Patria | 60 min | 5 min | Uno de los imprescindibles de Roma. |

- **Cena**: 20:00 en Centro Histórico (17 min andando desde la última parada).
- **Nocturna**: 21:30 Piazza Navona (noche) → 22:15 Puente Sant'Angelo (noche).
- **No incluido**: Vaticano — Con medio día más podrías ver el Vaticano.; Foro Romano y Palatino — No te dio tiempo.

## 2. 1 día · julio · completo · Arte

> **Banner**: Un día en Roma da para mucho si se aprovecha bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1

**Bloques**: ruta de 1 día de `short_trips` — mañana A · tarde B

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:15 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Plaza Venecia | 8 min | 10 min | Hoy no da tiempo a entrar: Plaza Venecia y Altar de la Patria, de paso y por fuera, de camino. |
| 12:45 | Altar de la Patria | 8 min | 5 min | Hoy no da tiempo a entrar: Plaza Venecia y Altar de la Patria, de paso y por fuera, de camino. |
| 13:00–14:30 | 🍝 **Comida**: Enoteca Corsi en Piazza Venezia | | | |
| 14:30 | Iglesia de San Luigi dei Francesi | 20 min | 7 min | Elegido según tus gustos: Arte y Museos. |
| 14:55 | Piazza Navona | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 15:35 | Panteón | 30 min | 7 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 16:15 | Fontana de Trevi | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 17:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 17:45 | Piazza del Popolo | 30 min | 12 min | Te pilla de camino a la cena: merece la parada. |
| 20:00 | Terraza del Pincio 🌅 | 44 min | 7 min | Llegas con tiempo para coger buen sitio antes del atardecer sobre Roma. |
| 21:00 | Santa Maria del Popolo | 15 min | 5 min | Hoy no da tiempo a entrar: Santa Maria del Popolo, de paso y por fuera, de camino. |

- **Tiempo libre**: 98 min entre Piazza del Popolo y Terraza del Pincio. Sugerencias: Ara Pacis (7 min, entrada).
- **Cena**: 21:30 en Tridente y Spagna (11 min andando desde la última parada).
- **Nocturna**: 22:30 Plaza de España (noche).
- **No incluido**: Vaticano — Con medio día más podrías ver el Vaticano..

## 3. 1 día · mayo · completo · Imprescindibles · pool: Museos Vaticanos y Capilla Sixtina

> **Banner**: Un día en Roma da para mucho si se aprovecha bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1

**Bloques**: ruta de 1 día de `short_trips` — mañana C · tarde B

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:15 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 11:50 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:15–14:45 | 🍝 **Comida**: Borghiciana Pastificio Artigianale en Vaticano y Borgo | | | |
| 14:45 | Puente Sant'Angelo | 15 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 15:15 | Piazza Navona | 30 min | 14 min | Uno de los imprescindibles de Roma. |
| 15:55 | Panteón | 30 min | 7 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 16:45 | Fontana de Trevi | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 17:30 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 18:15 | Piazza del Popolo | 30 min | 12 min | Te pilla de camino a la cena: merece la parada. |
| 19:40 | Terraza del Pincio 🌅 | 43 min | 7 min | Llegas con tiempo para coger buen sitio antes del atardecer sobre Roma. |

- **Cena**: 21:00 en Tridente y Spagna (13 min andando desde la última parada).
- **Nocturna**: 22:00 Plaza de España (noche) → 22:55 Fontana de Trevi (noche).
- Idea para la noche: Coliseo iluminado por fuera después de cenar.

## 4. 2 días · septiembre · completo · Imprescindibles + Free Tour

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1

**Bloques**: mañana: Free Tour por el centro histórico (free_tour) · tarde: El Vaticano por la tarde (vaticano_por_la_tarde)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | — | Con el Free Tour descubrirás varios imprescindibles del centro histórico, como la Plaza de España, la Fontana de Trevi, el Panteón y la Piazza Navona, de la mano de un guía que te contará su historia y sus secretos. El recorrido es por fuera, sin entrar en los monumentos. Te los volveremos a enseñar a otra hora del viaje, porque la experiencia es totalmente distinta. |
| 13:00–14:30 | 🍝 **Comida**: Supplizio en Centro Histórico | | | |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | 25 min | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 18:00 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 18:35 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 20:00 | Pasas por Borgo Pio | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:30 en Prati y Vaticano (7 min andando desde la última parada).
- **Nocturna**: 21:30 Puente Sant'Angelo (noche).

### Día 2

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Barrio Judío | 30 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:15 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Piazza Navona | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Luigi dei Francesi | 20 min | 4 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 17:55 | Pasas por Elefantino de Bernini | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:10 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |

- **Aperitivo y paseo por Centro Histórico** (73 min). Sugerencias: Largo di Torre Argentina (6 min), Iglesia del Gesù (9 min), Plaza Colonna (6 min).
- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

## 5. 2 días · abril · tranquilo · Arte

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver el Altar de la Patria y la Plaza de España, y la comida es más corta para ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:15 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:15 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Barrio Judío | 30 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 15:45 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:00 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Piazza Navona | 30 min | 6 min | Uno de los imprescindibles de Roma. |
| 17:15 | Pasas por Iglesia de San Luigi dei Francesi | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:45 | Pasas por Elefantino de Bernini | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 18:45 | Fontana de Trevi | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 19:30 | Pasas por Plaza de España | 15 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:30 en Centro Histórico (21 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche) → 22:25 Fontana de Trevi (noche).

### Día 2

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> 🚌 Borgo Pio → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 13:00–15:00 | 🍝 **Comida**: 200 Gradi en Vaticano y Borgo | | | |
| 15:00 | Plaza de San Pedro | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 15:35 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 17:00 | Pasas por Via della Conciliazione | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 27 min | Pasas por aquí de camino: no hace falta pararse. |
| 19:10 | Mirador del Janículo 🌅 | 41 min | 17 min | Llegas con tiempo para coger buen sitio antes del atardecer sobre Roma. |

- **Cena**: 20:30 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.

## 6. 3 días · del viernes 24 de septiembre de 2027 al domingo 26 de septiembre de 2027 · completo · Arte (de viernes a domingo)

> **Banner**: ninguno.

### Día 1 — viernes 24 de septiembre de 2027

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy la comida es más corta para que te dé tiempo a ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:15 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:15 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Barrio Judío | 30 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 15:45 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:00 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Piazza Navona | 30 min | 6 min | Uno de los imprescindibles de Roma. |
| 17:15 | Iglesia de San Luigi dei Francesi | 20 min | 4 min | Elegido según tus gustos: Arte y Museos. |
| 17:45 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Elegido según tus gustos: Arte y Museos. |
| 18:10 | Pasas por Elefantino de Bernini | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:25 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 19:15 | Pasas por Fontana de Trevi | 15 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Centro Histórico (14 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

### Día 2 — sábado 25 de septiembre de 2027

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 13:30–15:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:00 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Trastevere | 45 min | 24 min | Te pilla de camino a la cena: merece la parada. |
| 17:20 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Elegido según tus gustos: Arte y Museos. |
| 18:00 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:15 | Fontana dell'Acqua Paola | 15 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 19:00 | Mirador del Janículo 🌅 | 40 min | 16 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |

- **Cena**: 20:30 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3 — domingo 26 de septiembre de 2027

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: Colline Emiliane en Trevi | | | |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 9 min | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Plaza Colonna | 15 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Iglesia de San Ignacio de Loyola | 20 min | 4 min | Elegido según tus gustos: Arte y Museos. |
| 18:00 | Iglesia del Gesù | 30 min | 8 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Trevi** (77 min). Sugerencias: Largo di Torre Argentina (3 min), Plaza del Campidoglio (6 min), Plaza Venecia (4 min).
- **Cena**: 20:00 en Trevi (13 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche).

## 7. 3 días · octubre · completo · Imprescindibles + Free Tour + Barrios

> **Banner**: ninguno.

### Día 1

**Bloques**: mañana: Free Tour por el centro histórico (free_tour) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | — | Con el Free Tour descubrirás varios imprescindibles del centro histórico, como la Plaza de España, la Fontana de Trevi, el Panteón y la Piazza Navona, de la mano de un guía que te contará su historia y sus secretos. El recorrido es por fuera, sin entrar en los monumentos. Te los volveremos a enseñar a otra hora del viaje, porque la experiencia es totalmente distinta. |
| 13:00–14:30 | 🍝 **Comida**: Armando al Pantheon en Centro Histórico | | | |
| 14:30 | Panteón | 30 min | 1 min | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Conocer su historia es imprescindible en cualquier viaje a Roma. |
| 15:05 | Pasas por Elefantino de Bernini | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:20 | Iglesia de Santa Maria sopra Minerva | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. ⚠️ Sábados, solo de 10:00 a 12:30 y de 15:30 a 19:00. Domingos y festivos, solo de 08:00 a 12:30 y de 15:30 a 19:00. |
| 16:00 | Iglesia de San Luigi dei Francesi | 20 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 16:25 | Pasas por Piazza Navona | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Campo de' Fiori | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Pasas por Plaza Farnese | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:30 | Barrio Judío | 30 min | 10 min | Elegido según tus gustos: Barrios y Sabores. |
| 18:05 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:20 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Centro Histórico** (73 min). Sugerencias: Iglesia del Gesù (5 min), Plaza Colonna (11 min).
- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 19:00 Fontana de Trevi (noche) (antes de cenar).

### Día 2

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Plaza del Campidoglio | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 15:00 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:15 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Isla Tiberina | 20 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Basílica de Santa Cecilia in Trastevere | 30 min | 4 min | Te pilla de camino a la cena: merece la parada. ⚠️ Domingos y festivos, solo de 11:30 a 12:30 y de 16:30 a 18:00. |
| 18:30 | Plaza Trilussa | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Trastevere** (67 min). Sugerencias: Trastevere (5 min), Iglesia de Santa Maria in Trastevere (3 min).
- **Cena**: 20:00 en Trastevere (8 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> 🚌 Puente Sant'Angelo → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:30–15:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:00 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | San Pietro in Montorio y Tempietto de Bramante | 30 min | 27 min | Te pilla de camino a la cena: merece la parada. ⚠️ Cierra los lunes. |
| 17:15 | Fontana dell'Acqua Paola | 15 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:00 | Mirador del Janículo 🌅 | 40 min | 16 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |

- **Aperitivo y paseo por Trastevere** (59 min). Sugerencias: Iglesia de Santa Maria in Trastevere (20 min).
- **Cena**: 20:00 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.

## 8. 3 días · mayo · tranquilo · Naturaleza

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 1 día empieza antes, para que no te quedes sin ver la Fontana de Trevi y el Altar de la Patria.

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:15 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:15 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Barrio Judío | 30 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 15:45 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:00 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Piazza Navona | 30 min | 6 min | Uno de los imprescindibles de Roma. |
| 17:15 | Pasas por Iglesia de San Luigi dei Francesi | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:45 | Pasas por Elefantino de Bernini | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 18:45 | Pasas por Fontana de Trevi | 15 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |

- **Aperitivo y paseo por Centro Histórico** (46 min). Sugerencias: Largo di Torre Argentina (13 min), Plaza Colonna (4 min), Columna de Trajano (10 min).
- **Cena**: 20:00 en Centro Histórico (14 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).
- **No incluido**: Cúpula de San Pedro — No te dio tiempo.

### Día 2

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 13:00–15:00 | 🍝 **Comida**: 200 Gradi en Vaticano y Borgo | | | |
| 15:00 | Plaza de San Pedro | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 15:35 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 17:00 | Pasas por Via della Conciliazione | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Trastevere | 45 min | 24 min | Te pilla de camino a la cena: merece la parada. |
| 18:50 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. |
| 19:45 | Mirador del Janículo 🌅 | 40 min | 22 min | Elegido según tus gustos: Naturaleza y Vistas. |

- **Cena**: 21:00 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Cúpula de San Pedro — No te dio tiempo.

### Día 3

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 11:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 12:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–15:00 | 🍝 **Comida**: Colline Emiliane en Trevi | | | |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Ignacio de Loyola | 20 min | 13 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Iglesia de Santa Maria sopra Minerva | 20 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:00 | Iglesia del Gesù | 30 min | 7 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Trevi** (77 min). Sugerencias: Largo di Torre Argentina (3 min), Plaza del Campidoglio (6 min), Plaza Venecia (4 min).
- **Cena**: 20:00 en Trevi (13 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche).
- **No incluido**: Cúpula de San Pedro — No te dio tiempo.

## 9. 3 días · del sábado 14 de agosto de 2027 al lunes 16 de agosto de 2027 · completo · Imprescindibles + Free Tour

> **Banner**: ninguno.

### Día 1 — sábado 14 de agosto de 2027

**Bloques**: mañana: Free Tour por el centro histórico (free_tour) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | — | Con el Free Tour descubrirás varios imprescindibles del centro histórico, como la Plaza de España, la Fontana de Trevi, el Panteón y la Piazza Navona, de la mano de un guía que te contará su historia y sus secretos. El recorrido es por fuera, sin entrar en los monumentos. Te los volveremos a enseñar a otra hora del viaje, porque la experiencia es totalmente distinta. |
| 13:00–14:30 | 🍝 **Comida**: Armando al Pantheon en Centro Histórico | | | |
| 14:30 | Panteón | 30 min | 1 min | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Conocer su historia es imprescindible en cualquier viaje a Roma. |
| 15:05 | Pasas por Elefantino de Bernini | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:30 | Iglesia de Santa Maria sopra Minerva | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Iglesia de San Luigi dei Francesi | 20 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 16:25 | Pasas por Piazza Navona | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Campo de' Fiori | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Pasas por Plaza Farnese | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:30 | Barrio Judío | 30 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 18:05 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:20 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Centro Histórico** (73 min). Sugerencias: Iglesia del Gesù (5 min), Plaza Colonna (11 min).
- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

### Día 2 — domingo 15 de agosto de 2027

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Plaza del Campidoglio | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 15:00 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:15 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Basílica de Santa Cecilia in Trastevere | 30 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 18:00 | Isla Tiberina | 20 min | 4 min | Te pilla de camino a la cena: merece la parada. |
| 18:30 | Plaza Trilussa | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Trastevere** (67 min).
- **Cena**: 20:00 en Trastevere (8 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3 — lunes 16 de agosto de 2027

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 13:30–15:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:00 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Trastevere | 75 min | 24 min | Te pilla de camino a la cena: merece la parada. |
| 17:50 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. |
| 18:30 | Fontana dell'Acqua Paola | 15 min | 12 min | Te pilla de camino a la cena: merece la parada. |
| 19:25 | Mirador del Janículo 🌅 | 44 min | 16 min | Llegas con tiempo para coger buen sitio antes del atardecer sobre Roma. |

- **Cena**: 20:30 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.

## 10. 4 días · del jueves 25 de marzo de 2027 al domingo 28 de marzo de 2027 · tranquilo · Arte + Barrios (Semana Santa)

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 1 día empieza antes, para que no te quedes sin ver la Fontana de Trevi y el Altar de la Patria.

### Día 1 — jueves 25 de marzo de 2027

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver la Fontana de Trevi y el Altar de la Patria, y la comida es más corta para ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:15 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:15 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Barrio Judío | 30 min | 3 min | Elegido según tus gustos: Barrios y Sabores. |
| 15:45 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:00 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Piazza Navona | 30 min | 6 min | Uno de los imprescindibles de Roma. |
| 17:15 | Pasas por Iglesia de San Luigi dei Francesi | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:45 | Pasas por Elefantino de Bernini | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 18:45 | Pasas por Fontana de Trevi | 15 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |

- **Aperitivo y paseo por Centro Histórico** (46 min). Sugerencias: Largo di Torre Argentina (13 min), Plaza Colonna (4 min), Columna de Trajano (10 min).
- **Cena**: 20:00 en Centro Histórico (14 min andando desde la última parada).
- **Nocturna**: 19:00 Fontana de Trevi (noche) (antes de cenar).

### Día 2 — viernes 26 de marzo de 2027

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> 🚌 Borgo Pio → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 13:00–15:00 | 🍝 **Comida**: 200 Gradi en Vaticano y Borgo | | | |
| 15:00 | Plaza de San Pedro | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 15:35 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 17:00 | Pasas por Via della Conciliazione | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 27 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:30 | Mirador del Janículo 🌅 | 40 min | 17 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |

- **Cena**: 20:00 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3 — sábado 27 de marzo de 2027

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — domingo 28 de marzo de 2027

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 11:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 12:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–15:00 | 🍝 **Comida**: Colline Emiliane en Trevi | | | |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 9 min | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Ignacio de Loyola | 20 min | 13 min | Elegido según tus gustos: Arte y Museos. |
| 17:25 | Palazzo Doria Pamphilj | 60 min | 3 min | Elegido según tus gustos: Arte y Museos. |

- **Aperitivo y paseo por Centro Histórico** (85 min). Sugerencias: Iglesia del Gesù (4 min), Iglesia de Santa Maria sopra Minerva (4 min), Largo di Torre Argentina (7 min).
- **Cena**: 20:00 en Centro Histórico (10 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche).

## 11. 4 días · junio · completo · Naturaleza

> **Banner**: ninguno.

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy la comida es más corta para que te dé tiempo a ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:15 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:15 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Barrio Judío | 30 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 15:45 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:00 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Piazza Navona | 30 min | 6 min | Uno de los imprescindibles de Roma. |
| 17:15 | Iglesia de San Luigi dei Francesi | 20 min | 4 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 18:10 | Pasas por Elefantino de Bernini | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:25 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 19:15 | Pasas por Fontana de Trevi | 15 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Centro Histórico (14 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

### Día 2

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:20 | Cúpula de San Pedro | 30 min | 0 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 14:00–15:30 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:30 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:15 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 17:00 | Trastevere | 75 min | 24 min | Te pilla de camino a la cena: merece la parada. |
| 18:20 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. |
| 19:00 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |
| 19:15 | Fontana dell'Acqua Paola | 15 min | 5 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 20:05 | Mirador del Janículo 🌅 | 42 min | 16 min | Elegido según tus gustos: Naturaleza y Vistas. |

- **Cena**: 21:30 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Galería Borghese, el parque y el Pincio (villa_borghese_pincio)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: Sgarro Bistrot en Tridente y Spagna | | | |
| 14:30 | Galería Borghese | 120 min | 22 min | Te pilla de camino a la cena: merece la parada. ⚠️ Cierra los lunes. |
| 16:45 | Parque de Villa Borghese | 90 min | 8 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:30 | Terraza del Pincio | 20 min | 11 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 19:00 | Piazza del Popolo | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Tridente y Spagna (9 min andando desde la última parada).
- **Nocturna**: ninguna.

## 12. 4 días · del sábado 5 de diciembre de 2026 al martes 8 de diciembre de 2026 · completo · Imprescindibles + Arte + Barrios

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 16:45 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — sábado 5 de diciembre de 2026

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 13:30–15:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:00 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:45 | Mirador del Janículo 🌅 | 40 min | 31 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |
| 17:45 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 15 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Fontana dell'Acqua Paola | 15 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:30 | Trastevere | 45 min | 9 min | Elegido según tus gustos: Barrios y Sabores. |
| 19:20 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Elegido según tus gustos: Arte y Museos. |

- **Cena**: 20:00 en Trastevere (5 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 2 — domingo 6 de diciembre de 2026

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy la comida es más corta para que te dé tiempo a ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:15 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:15 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Barrio Judío | 30 min | 3 min | Elegido según tus gustos: Barrios y Sabores. |
| 15:45 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:00 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Piazza Navona | 30 min | 6 min | Uno de los imprescindibles de Roma. |
| 17:15 | Iglesia de San Luigi dei Francesi | 20 min | 4 min | Elegido según tus gustos: Arte y Museos. |
| 17:45 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Elegido según tus gustos: Arte y Museos. |
| 18:10 | Pasas por Elefantino de Bernini | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:25 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 19:15 | Pasas por Fontana de Trevi | 15 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Centro Histórico (14 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

### Día 3 — lunes 7 de diciembre de 2026

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — martes 8 de diciembre de 2026

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Galería Borghese, el parque y el Pincio (villa_borghese_pincio)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: Sgarro Bistrot en Tridente y Spagna | | | |
| 14:30 | Galería Borghese | 120 min | 22 min | Elegido según tus gustos: Arte y Museos. |
| 16:45 | Pasas por Parque de Villa Borghese | 10 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Terraza del Pincio | 20 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Piazza del Popolo | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:20 | Pasas por Santa Maria del Popolo | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |

- **Aperitivo y paseo por Tridente y Spagna** (79 min). Sugerencias: Via del Corso (15 min), Plaza Colonna (17 min).
- **Cena**: 20:00 en Tridente y Spagna (11 min andando desde la última parada).
- **Nocturna**: ninguna.

## 13. 5 días · diciembre · tranquilo · Arte + Barrios · pool: Galería Borghese, Trastevere

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 16:45 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero y algún día empieza un poco antes. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1

**Bloques**: mañana: Galería Borghese, el parque y el Popolo (borghese) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Galería Borghese | 120 min | — | Uno de tus favoritos. ⚠️ Cierra los lunes. |
| 13:00–15:00 | 🍝 **Comida**: Colline Emiliane en Trevi | | | |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 9 min | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Fontana de Trevi | 30 min | 9 min | Uno de los imprescindibles de Roma. |
| 17:45 | Iglesia de San Ignacio de Loyola | 20 min | 5 min | Elegido según tus gustos: Arte y Museos. |
| 18:15 | Iglesia del Gesù | 30 min | 8 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Trevi** (62 min). Sugerencias: Largo di Torre Argentina (3 min), Plaza del Campidoglio (6 min), Plaza Venecia (4 min).
- **Cena**: 20:00 en Trevi (13 min andando desde la última parada).
- **Nocturna**: 19:00 Panteón (noche) (antes de cenar).
- **No incluido**: Parque de Villa Borghese — No te dio tiempo; Santa Maria del Popolo — No te dio tiempo; Mirador del Janículo — No te dio tiempo.

### Día 2

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy empezamos a las 09:00 para que te dé tiempo a ver el Foro Romano, y la comida es más corta para ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 09:20 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 11:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 13:15–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Pasas por Fuente de las Tortugas | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Barrio Judío | 30 min | 3 min | Elegido según tus gustos: Barrios y Sabores. |
| 16:00 | Pasas por Plaza Farnese | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:15 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Piazza Navona | 30 min | 6 min | Uno de los imprescindibles de Roma. |
| 17:30 | Pasas por Iglesia de San Luigi dei Francesi | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Pasas por Elefantino de Bernini | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:15 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |

- **Aperitivo y paseo por Centro Histórico** (68 min). Sugerencias: Largo di Torre Argentina (6 min), Plaza Colonna (6 min).
- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 19:00 Fontana de Trevi (noche) (antes de cenar).
- **No incluido**: Parque de Villa Borghese — No te dio tiempo; Santa Maria del Popolo — No te dio tiempo; Mirador del Janículo — No te dio tiempo.

### Día 3

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 13:00–15:00 | 🍝 **Comida**: 200 Gradi en Vaticano y Borgo | | | |
| 15:00 | Plaza de San Pedro | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 15:35 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 17:00 | Pasas por Via della Conciliazione | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Trastevere | 45 min | 24 min | Uno de tus favoritos. |
| 18:50 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Elegido según tus gustos: Arte y Museos. |
| 19:30 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (7 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Parque de Villa Borghese — No te dio tiempo; Santa Maria del Popolo — No te dio tiempo; Mirador del Janículo — No te dio tiempo.

### Día 4

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: San Juan de Letrán, San Clemente y el Coliseo al anochecer (letran_celio)

> 🚌 Via dei Fori Imperiali → Basílica de San Juan de Letrán: ~25 min andando · o en taxi (10-20 min) o bus 87 desde Rinascimento (unos 28 min)
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Plaza de España | 30 min | — | Uno de los imprescindibles de Roma. |
| 11:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–15:00 | 🍝 **Comida**: Piccolo Arancio en Trevi | | | |
| 15:00 | Pasas por Via dei Fori Imperiali | 10 min | 13 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Basílica de San Juan de Letrán | 30 min | 27 min | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Basílica de San Clemente | 45 min | 13 min | Elegido según tus gustos: Arte y Museos. |
| 17:30 | Iglesia de San Pietro in Vincoli | 20 min | 12 min | Te pilla de camino a la cena: merece la parada. |
| 18:00 | Monti | 40 min | 4 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Monti** (79 min).
- **Cena**: 20:00 en Monti (1 min andando desde la última parada).
- **Nocturna**: 19:00 Coliseo (noche) (antes de cenar).
- **No incluido**: Parque de Villa Borghese — No te dio tiempo; Santa Maria del Popolo — No te dio tiempo; Mirador del Janículo — No te dio tiempo.

## 14. 5 días · septiembre · completo · Imprescindibles + Free Tour

> **Banner**: ninguno.

### Día 1

**Bloques**: mañana: Free Tour por el centro histórico (free_tour) · tarde: El Vaticano por la tarde (vaticano_por_la_tarde)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | — | Con el Free Tour descubrirás varios imprescindibles del centro histórico, como la Plaza de España, la Fontana de Trevi, el Panteón y la Piazza Navona, de la mano de un guía que te contará su historia y sus secretos. El recorrido es por fuera, sin entrar en los monumentos. Te los volveremos a enseñar a otra hora del viaje, porque la experiencia es totalmente distinta. |
| 13:00–14:30 | 🍝 **Comida**: Supplizio en Centro Histórico | | | |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | 25 min | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 18:00 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 18:35 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 20:00 | Pasas por Borgo Pio | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:30 en Prati y Vaticano (7 min andando desde la última parada).
- **Nocturna**: 21:30 Puente Sant'Angelo (noche).
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 2

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Pasas por Fuente de las Tortugas | 10 min | 14 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Barrio Judío | 30 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 15:30 | Largo di Torre Argentina | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Pasas por Plaza Farnese | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:15 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Piazza Navona | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Luigi dei Francesi | 20 min | 4 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 17:55 | Pasas por Elefantino de Bernini | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:10 | Panteón | 30 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |

- **Aperitivo y paseo por Centro Histórico** (73 min). Sugerencias: Plaza Colonna (6 min).
- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 3

**Bloques**: mañana: Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Termas de Caracalla | 60 min | — | Te pilla de camino: merece la parada. ⚠️ Cierra los lunes. |
| 10:30 | Pasas por Circo Máximo | 10 min | 17 min | Pasas por aquí de camino: no hace falta pararse. |
| 11:00 | Boca de la Verdad | 20 min | 6 min | Te pilla de camino: merece la parada. |
| 12:00 | Jardín de los Naranjos | 20 min | 11 min | Te pilla de camino: merece la parada. |
| 12:30 | Ojo de la Cerradura del Aventino | 10 min | 4 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Trattoria Da Enzo al 29 en Trastevere | | | |
| 14:30 | Isla Tiberina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 15:00 | Pasas por Teatro de Marcelo | 10 min | 9 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:30 | Pasas por Plaza Venecia | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Altar de la Patria | 60 min | 5 min | Uno de los imprescindibles de Roma. |
| 17:00 | Plaza del Campidoglio | 20 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Palazzo Doria Pamphilj | 60 min | 8 min | Te pilla de camino a la cena: merece la parada. ⚠️ Cierra los miércoles. |
| 18:45 | Iglesia del Gesù | 30 min | 4 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Centro Histórico (9 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 4

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5

**Bloques**: mañana: Galería Borghese, el parque y el Popolo (borghese) · tarde: Del Popolo al Pincio al atardecer (tridente_pincio)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Galería Borghese | 120 min | — | Te pilla de camino: merece la parada. ⚠️ Cierra los lunes. |
| 11:30 | Parque de Villa Borghese | 90 min | 8 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Edy en Tridente y Spagna | | | |
| 14:30 | Pasas por Plaza de España | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:00 | Pasas por Via del Corso | 10 min | 9 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:30 | Ara Pacis | 45 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Piazza del Popolo | 30 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 17:05 | Santa Maria del Popolo | 30 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Terraza del Pincio | 20 min | 6 min | Te pilla de camino a la cena: merece la parada. |

- **Tarde libre** (102 min). Sugerencias: Plaza Colonna (19 min).
- **Cena**: 20:00 en Tridente y Spagna (13 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

## 15. 6 días · mayo · completo · sin experiencias (sin experiencias)

> **Banner**: ninguno.

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Plaza del Campidoglio | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 15:00 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:15 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Barrio Judío | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 17:35 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Basílica de Santa Cecilia in Trastevere | 30 min | 12 min | Te pilla de camino a la cena: merece la parada. ⚠️ Domingos y festivos, solo de 11:30 a 12:30 y de 16:30 a 18:00. |
| 18:45 | Isla Tiberina | 20 min | 4 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Trastevere** (46 min). Sugerencias: Plaza Trilussa (9 min).
- **Cena**: 20:00 en Trastevere (9 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 2

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:30–15:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:00 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Trastevere | 75 min | 24 min | Te pilla de camino a la cena: merece la parada. |
| 17:50 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. |
| 18:30 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 8 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:45 | Fontana dell'Acqua Paola | 15 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 19:40 | Mirador del Janículo 🌅 | 43 min | 16 min | Llegas con tiempo para coger buen sitio antes del atardecer sobre Roma. |

- **Cena**: 21:00 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 3

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 10:30 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. ⚠️ Domingos y festivos, solo de 09:00 a 09:30 y de 11:45 a 19:00. |
| 11:30 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:00–14:30 | 🍝 **Comida**: Trattoria Dal Cavalier Gino en Centro Histórico | | | |
| 14:30 | Plaza Colonna | 15 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 14:50 | Pasas por Via del Corso | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 18 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Ignacio de Loyola | 20 min | 13 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Elefantino de Bernini | 10 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Iglesia del Gesù | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:20 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Centro Histórico** (73 min).
- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche).
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 4

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5

**Bloques**: mañana: Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Termas de Caracalla | 60 min | — | Te pilla de camino: merece la parada. ⚠️ Cierra los lunes. |
| 10:30 | Pasas por Circo Máximo | 10 min | 17 min | Pasas por aquí de camino: no hace falta pararse. |
| 11:00 | Boca de la Verdad | 20 min | 6 min | Te pilla de camino: merece la parada. |
| 12:00 | Jardín de los Naranjos | 20 min | 11 min | Te pilla de camino: merece la parada. |
| 12:30 | Ojo de la Cerradura del Aventino | 10 min | 4 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Trattoria Da Enzo al 29 en Trastevere | | | |
| 14:30 | Pasas por Plaza Farnese | 10 min | 16 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Iglesia de San Luigi dei Francesi | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 15:45 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 16:15 | Palazzo Doria Pamphilj | 60 min | 4 min | Te pilla de camino a la cena: merece la parada. ⚠️ Cierra los miércoles. |
| 17:30 | Pasas por Panteón | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Ara Pacis | 45 min | 11 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Tridente y Spagna** (69 min). Sugerencias: Piazza del Popolo (7 min).
- **Cena**: 20:00 en Tridente y Spagna (6 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 6

**Bloques**: mañana: excursión de medio día (ostia_antica) · tarde: Santa María la Mayor, el Moisés y Monti (monti_basilicas)

**Mañana: excursión de medio día** (ostia_antica, 08:00-14:00); la ciudad, desde las 16:00.
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 16:00 | Basílica de Santa María la Mayor | 30 min | — | Te pilla de camino a la cena: merece la parada. |
| 17:00 | Columna de Trajano | 10 min | 17 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Iglesia de San Pietro in Vincoli | 20 min | 14 min | Te pilla de camino a la cena: merece la parada. |
| 18:00 | Monti | 40 min | 4 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Monti** (79 min).
- **Cena**: 20:00 en Monti (1 min andando desde la última parada).
- **Nocturna**: 21:30 Coliseo (noche) → 22:30 Foro Romano desde el Campidoglio (noche).
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

## 16. 7 días · del lunes 13 de septiembre de 2027 al domingo 19 de septiembre de 2027 · completo · Imprescindibles + Arte + Naturaleza (empieza en lunes)

> **Banner**: ninguno.

### Día 1 — lunes 13 de septiembre de 2027

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Plaza del Campidoglio | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 15:00 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:15 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Barrio Judío | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 17:35 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Basílica de Santa Cecilia in Trastevere | 30 min | 12 min | Te pilla de camino a la cena: merece la parada. |
| 18:45 | Isla Tiberina | 20 min | 4 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Trastevere** (46 min). Sugerencias: Iglesia de Santa Maria in Trastevere (9 min), Plaza Trilussa (9 min).
- **Cena**: 20:00 en Trastevere (9 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 2 — martes 14 de septiembre de 2027

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> 🚌 Puente Sant'Angelo → San Pietro in Montorio y Tempietto de Bramante: ~25 min andando (con cuesta) · o el bus 115 si prefieres no subirla
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 13:20 | Cúpula de San Pedro | 30 min | 0 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 14:00–15:30 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:30 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:15 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 17:00 | San Pietro in Montorio y Tempietto de Bramante | 30 min | 27 min | Elegido según tus gustos: Arte y Museos. |
| 17:45 | Fontana dell'Acqua Paola | 15 min | 5 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:40 | Mirador del Janículo 🌅 | 42 min | 16 min | Elegido según tus gustos: Naturaleza y Vistas. |

- **Cena**: 20:00 en Trastevere (21 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 3 — miércoles 15 de septiembre de 2027

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Galería Borghese, el parque y el Pincio (villa_borghese_pincio)

> 🚌 Desde la comida → Galería Borghese: ~30 min andando · o en bus o taxi
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 10:30 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. |
| 11:30 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:00–14:30 | 🍝 **Comida**: Poldo e Gianna Osteria en Tridente y Spagna | | | |
| 14:45 | Galería Borghese | 120 min | 29 min | Elegido según tus gustos: Arte y Museos. |
| 17:00 | Parque de Villa Borghese | 90 min | 8 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:45 | Terraza del Pincio 🌅 | 35 min | 11 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 19:30 | Piazza del Popolo | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 20:05 | Pasas por Santa Maria del Popolo | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:30 en Tridente y Spagna (11 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 4 — jueves 16 de septiembre de 2027

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — viernes 17 de septiembre de 2027

**Bloques**: mañana: Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Termas de Caracalla | 60 min | — | Te pilla de camino: merece la parada. |
| 10:30 | Pasas por Circo Máximo | 10 min | 17 min | Pasas por aquí de camino: no hace falta pararse. |
| 11:00 | Boca de la Verdad | 20 min | 6 min | Te pilla de camino: merece la parada. |
| 12:00 | Jardín de los Naranjos | 20 min | 11 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 12:30 | Ojo de la Cerradura del Aventino | 10 min | 4 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Trattoria Da Enzo al 29 en Trastevere | | | |
| 14:30 | Pasas por Plaza Farnese | 10 min | 16 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Pasas por Campo de' Fiori | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Iglesia de San Luigi dei Francesi | 20 min | 10 min | Elegido según tus gustos: Arte y Museos. |
| 15:45 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Elegido según tus gustos: Arte y Museos. |
| 16:10 | Pasas por Elefantino de Bernini | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Iglesia del Gesù | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 17:05 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Pasas por Panteón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:15 | Ara Pacis | 45 min | 11 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Tridente y Spagna** (54 min).
- **Cena**: 20:00 en Tridente y Spagna (6 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 6 — sábado 18 de septiembre de 2027

**Bloques**: mañana: excursión de medio día (ostia_antica) · tarde: Santa María la Mayor, el Moisés y Monti (monti_basilicas)

**Mañana: excursión de medio día** (ostia_antica, 08:00-14:00); la ciudad, desde las 16:00.
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 16:00 | Basílica de Santa María la Mayor | 30 min | — | Elegido según tus gustos: Arte y Museos. |
| 16:45 | Iglesia de San Pietro in Vincoli | 20 min | 12 min | Elegido según tus gustos: Arte y Museos. |
| 17:15 | Mercados de Trajano | 60 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 18:30 | Monti | 40 min | 10 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Monti** (49 min).
- **Cena**: 20:00 en Monti (1 min andando desde la última parada).
- **Nocturna**: 21:30 Coliseo (noche) → 22:30 Foro Romano desde el Campidoglio (noche).
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

### Día 7 — domingo 19 de septiembre de 2027

**Bloques**: mañana: excursión de medio día (tivoli_villas) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

**Mañana: excursión de medio día** (tivoli_villas, 08:00-14:00); la ciudad, desde las 16:00.
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | — | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Pasas por Via del Corso | 10 min | 10 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Plaza Colonna | 15 min | 4 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Iglesia de San Ignacio de Loyola | 20 min | 4 min | Elegido según tus gustos: Arte y Museos. |
| 18:15 | Columna de Trajano | 10 min | 9 min | Te pilla de camino a la cena: merece la parada. |

- **Aperitivo y paseo por Monti** (82 min).
- **Cena**: 20:00 en Monti (13 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Mercado de Testaccio — No te dio tiempo.

## 17. 2 días · del sábado 24 de octubre de 2026 al domingo 25 de octubre de 2026 · completo · sin experiencias (empieza en sábado; caso añadido)

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — sábado 24 de octubre de 2026

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy la comida es más corta para que te dé tiempo a ver el Panteón
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:15 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:15 | Pasas por Altar de la Patria | 15 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Fontana de Trevi | 30 min | 14 min | Uno de los imprescindibles de Roma. |
| 15:30 | Panteón | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 16:05 | Iglesia de Santa Maria sopra Minerva | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 16:45 | Iglesia de San Luigi dei Francesi | 20 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 17:10 | Piazza Navona | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 18:00 | Pasas por Campo de' Fiori | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:15 | Pasas por Plaza Farnese | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:45 | Barrio Judío | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 19:10 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 19:45 | Pasas por Plaza de España | 15 min | 25 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:30 en Centro Histórico (21 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche) → 22:25 Fontana de Trevi (noche).

### Día 2 — domingo 25 de octubre de 2026

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 12:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 13:00–14:30 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 14:30 | Basílica de San Pedro | 75 min | 6 min | Uno de los imprescindibles de Roma. |
| 16:00 | Puente Sant'Angelo | 15 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 17:00 | Mirador del Janículo 🌅 | 40 min | 31 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |
| 18:00 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 15 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:15 | Fontana dell'Acqua Paola | 15 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:45 | Trastevere | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 19:35 | Iglesia de Santa Maria in Trastevere | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trastevere (5 min andando desde la última parada).
- **Nocturna**: ninguna.

