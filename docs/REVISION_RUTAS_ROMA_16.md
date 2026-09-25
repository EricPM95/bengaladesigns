# Revisión de rutas de Roma — 16 viajes

Motor v3, generado el 2026-09-25 con `node scripts/destino/revisionRutas.mjs`. Sin fechas, cada día usa el 15 del mes (horarios y puesta de sol) y el horario de laborables. "Andando" = minutos desde la parada anterior (matriz del destino; en la primera, desde el punto de partida no se cuenta).

## Resumen: mañanas y tardes tipo

Medios días sin tipo (ningún bloque encaja y el motor improvisa): **2**. Los viajes de 1 día siguen con las rutas curadas de `short_trips` (con bloques salían peor).

| Viaje | Día | Mañana | Tarde |
|---|---|---|---|
| 1 | 1 | ruta de 1 día, bloque B (short_trips) | bloque A (short_trips) |
| 2 | 1 | ruta de 1 día, bloque A (short_trips) | bloque B (short_trips) |
| 3 | 1 | ruta de 1 día, bloque C (short_trips) | bloque B (short_trips) |
| 4 | 1 | Free Tour por el centro histórico (free_tour) | El Vaticano por la tarde (vaticano_por_la_tarde) |
| 4 | 2 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 5 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 5 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 6 | 1 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 6 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 6 | 3 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | **medio día sin tipo** |
| 7 | 1 | Free Tour por el centro histórico (free_tour) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 7 | 2 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 7 | 3 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 8 | 1 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 8 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 8 | 3 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | **medio día sin tipo** |
| 9 | 1 | Free Tour por el centro histórico (free_tour) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 9 | 2 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 9 | 3 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 10 | 1 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 10 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 10 | 3 | excursión de día completo | — |
| 10 | 4 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 11 | 1 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 11 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 11 | 3 | excursión de día completo | — |
| 11 | 4 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Galería Borghese, el parque y el Pincio (villa_borghese_pincio) |
| 12 | 1 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 12 | 2 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 12 | 3 | excursión de día completo | — |
| 12 | 4 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 13 | 1 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 13 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 13 | 3 | Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 13 | 4 | excursión de día completo | — |
| 13 | 5 | Galería Borghese, el parque y el Popolo (borghese) | Santa María la Mayor, el Moisés y Monti (monti_basilicas) |
| 14 | 1 | Free Tour por el centro histórico (free_tour) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 14 | 2 | Coliseo, Foro y Palatino (roma_antigua) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 14 | 3 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 14 | 4 | excursión de día completo | — |
| 14 | 5 | Galería Borghese, el parque y el Popolo (borghese) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 15 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 15 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 15 | 3 | Galería Borghese, el parque y el Popolo (borghese) | Del Popolo al Pincio al atardecer (tridente_pincio) |
| 15 | 4 | excursión de día completo | — |
| 15 | 5 | Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 15 | 6 | excursión de medio día (ostia_antica) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 16 | 1 | Coliseo, Foro y Palatino (roma_antigua) | El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco) |
| 16 | 2 | Museos Vaticanos, San Pedro y la Cúpula (vaticano) | Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere) |
| 16 | 3 | Galería Borghese, el parque y el Popolo (borghese) | Del Popolo al Pincio al atardecer (tridente_pincio) |
| 16 | 4 | excursión de día completo | — |
| 16 | 5 | Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) | Campidoglio, el Altar y el Ghetto (campidoglio_ghetto) |
| 16 | 6 | excursión de medio día (ostia_antica) | Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi) |
| 16 | 7 | excursión de medio día (tivoli_villas) | Santa María la Mayor, el Moisés y Monti (monti_basilicas) |

## 1. 1 día · diciembre · completo · Imprescindibles + Free Tour

### Día 1

**Bloques**: ruta de 1 día de `short_trips` — mañana B · tarde A

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | — | Con el Free Tour descubrirás varios imprescindibles del centro histórico, como la Plaza de España, la Fontana de Trevi, el Panteón y la Piazza Navona, de la mano de un guía que te contará su historia y sus secretos. El recorrido es por fuera, sin entrar en los monumentos. Si puedes, vuelve de noche: la experiencia es totalmente distinta. |
| 13:00–14:30 | 🍝 **Comida**: Armando al Pantheon en Centro Histórico | | | |
| 14:30 | Arco de Constantino | 15 min | 25 min | Uno de los imprescindibles de Roma. |
| 14:50 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 16:30 | Foro Romano visto desde Via dei Fori Imperiali | 15 min | 10 min | El Foro Romano por dentro no da tiempo hoy, pero desde aquí lo tienes entero a tus pies. |
| 17:15 | Panteón | 30 min | 16 min | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Conocer su historia es imprescindible en cualquier viaje a Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 18:00 | Plaza Venecia | 10 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Altar de la Patria | 60 min | 5 min | Uno de los imprescindibles de Roma. |

- **Cena**: 20:00 en Monti y Fori Imperiali (16 min andando desde la última parada).
- **Nocturna**: 21:30 Foro Romano desde el Campidoglio (noche) → 22:15 Coliseo (noche).
- **No incluido**: Vaticano — Con medio día más podrías ver el Vaticano.; Foro Romano y Palatino — No te dio tiempo.

## 2. 1 día · julio · completo · Arte

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
| 14:30 | Piazza Navona | 30 min | 9 min | Uno de los imprescindibles de Roma. |
| 15:10 | Panteón | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:00 | Fontana de Trevi | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 16:45 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |

- **Tarde libre** (158 min). Sugerencias: Ara Pacis (10 min, entrada), Piazza del Popolo (12 min), Via Condotti (6 min).
- **Cena**: 20:00 en Tridente y Spagna (7 min andando desde la última parada).
- **Nocturna**: 21:30 Plaza de España (noche) → 22:25 Fontana de Trevi (noche) → 23:00 Panteón (noche).
- **No incluido**: Vaticano — Con medio día más podrías ver el Vaticano..

## 3. 1 día · mayo · completo · Imprescindibles · pool: Museos Vaticanos y Capilla Sixtina

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

- **Tarde libre** (113 min). Sugerencias: Ara Pacis (10 min, entrada), Piazza del Popolo (12 min), Via Condotti (6 min).
- **Cena**: 20:00 en Tridente y Spagna (7 min andando desde la última parada).
- **Nocturna**: 21:30 Plaza de España (noche) → 22:25 Fontana de Trevi (noche) → 23:00 Panteón (noche).
- Idea para la noche: Coliseo iluminado por fuera después de cenar.

## 4. 2 días · septiembre · completo · Imprescindibles + Free Tour

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

- **Cena**: 20:30 en Centro Histórico (19 min andando desde la última parada).
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
| 14:30 | Plaza Venecia | 10 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 14:45 | Altar de la Patria | 60 min | 5 min | Uno de los imprescindibles de Roma. |
| 16:00 | Panteón | 30 min | 15 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 16:35 | Pasas por Elefantino de Bernini | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:50 | Iglesia de Santa Maria sopra Minerva | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 17:55 | Pasas por Piazza Navona | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:15 | Pasas por Campo de' Fiori | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:30 | Pasas por Plaza Farnese | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 19:00 | Barrio Judío | 30 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 19:35 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 19:50 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:30 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche) → 22:25 Fontana de Trevi (noche).

## 5. 2 días · abril · tranquilo · Arte

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver el Panteón, Iglesia de San Luigi dei Francesi, Plaza Farnese, Via dei Fori Imperiali, Elefantino de Bernini, Fuente de las Tortugas, Campo de' Fiori y el Foro Romano
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–15:00 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 15:00 | Fontana de Trevi | 30 min | 14 min | Uno de los imprescindibles de Roma. |
| 15:45 | Panteón | 30 min | 8 min | Uno de los imprescindibles de Roma. ⚠️ Sábados, solo de 09:00 a 16:00. |
| 16:20 | Pasas por Elefantino de Bernini | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Iglesia de San Luigi dei Francesi | 20 min | 8 min | Elegido según tus gustos: Arte y Museos. |
| 17:10 | Piazza Navona | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 18:00 | Pasas por Campo de' Fiori | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:15 | Pasas por Plaza Farnese | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:45 | Barrio Judío | 30 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 19:20 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Centro Histórico (10 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche) → 22:25 Fontana de Trevi (noche).
- **No incluido**: Plaza de España — No cabía en ningún día del viaje; Altar de la Patria — No cabía en ningún día del viaje.

### Día 2

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver San Pietro in Montorio y Tempietto de Bramante, Via della Conciliazione, Iglesia de Santa Maria in Trastevere, la Plaza de San Pedro y Basílica de San Pedro
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:30–15:30 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:30 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Mirador del Janículo | 40 min | 26 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | San Pietro in Montorio y Tempietto de Bramante | 30 min | 15 min | Elegido según tus gustos: Arte y Museos. ⚠️ Cierra los lunes. |
| 18:15 | Trastevere | 45 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 19:05 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.
- **No incluido**: Plaza de España — No cabía en ningún día del viaje; Altar de la Patria — No cabía en ningún día del viaje.

## 6. 3 días · del viernes 24 de septiembre de 2027 al domingo 26 de septiembre de 2027 · completo · Arte (de viernes a domingo)

### Día 1 — viernes 24 de septiembre de 2027

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
| 18:00 | Isla Tiberina | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |

- **Tarde libre** (90 min). Sugerencias: Iglesia de Santa Maria in Trastevere (9 min), Boca de la Verdad (6 min).
- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 2 — sábado 25 de septiembre de 2027

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 13:30–15:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:00 | Pasas por Borgo Pio | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:30 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Fontana dell'Acqua Paola | 15 min | 32 min | Te pilla de camino a la cena: merece la parada. |
| 17:00 | San Pietro in Montorio y Tempietto de Bramante | 30 min | 5 min | Elegido según tus gustos: Arte y Museos. |
| 18:20 | Mirador del Janículo 🌅 | 43 min | 17 min | Llegas con tiempo para coger buen sitio antes del atardecer sobre Roma. |
| 19:30 | Trastevere | 45 min | 21 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:30 en Trastevere (3 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3 — domingo 26 de septiembre de 2027

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: **medio día sin tipo**

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:30 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 10:30 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 11:30 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 12:00 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. |
| 13:00 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:30–15:00 | 🍝 **Comida**: Armando al Pantheon en Centro Histórico | | | |
| 15:00 | Iglesia de San Luigi dei Francesi | 20 min | 3 min | Elegido según tus gustos: Arte y Museos. |
| 15:30 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Iglesia del Gesù | 30 min | 7 min | Elegido según tus gustos: Arte y Museos. |
| 16:35 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 17:15 | Plaza Trilussa | 15 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Campo de' Fiori | 25 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Plaza Farnese | 10 min | 1 min | Te pilla de camino a la cena: merece la parada. |

- **Tarde libre** (90 min). Sugerencias: Elefantino de Bernini (9 min).
- **Cena**: 20:00 en Centro Histórico (5 min andando desde la última parada).
- **Nocturna**: ninguna.

## 7. 3 días · octubre · completo · Imprescindibles + Free Tour + Barrios

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

- **Cena**: 20:00 en Trastevere (7 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:30–15:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:00 | Pasas por Borgo Pio | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:30 | Puente Sant'Angelo | 15 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Fontana dell'Acqua Paola | 15 min | 32 min | Te pilla de camino a la cena: merece la parada. |
| 17:00 | San Pietro in Montorio y Tempietto de Bramante | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. ⚠️ Cierra los lunes. |
| 18:00 | Mirador del Janículo 🌅 | 40 min | 17 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |
| 19:15 | Trastevere | 45 min | 21 min | Elegido según tus gustos: Barrios y Sabores. |
| 20:05 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:30 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

## 8. 3 días · mayo · tranquilo · Naturaleza

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver Teatro de Marcelo, Via dei Fori Imperiali, Plaza Venecia, Fuente de las Tortugas, Isla Tiberina y el Foro Romano
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–15:00 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 15:00 | Plaza del Campidoglio | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 15:30 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:45 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:30 | Barrio Judío | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:05 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:30 | Isla Tiberina | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 2

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver Cúpula de San Pedro, Via della Conciliazione, Iglesia de Santa Maria in Trastevere, la Plaza de San Pedro y Basílica de San Pedro
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:20 | Cúpula de San Pedro | 30 min | 0 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 14:00–16:00 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 16:00 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:45 | Mirador del Janículo | 40 min | 24 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:00 | Trastevere | 45 min | 21 min | Te pilla de camino a la cena: merece la parada. |
| 18:50 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: **medio día sin tipo**

> Hoy empezamos a las 08:00 para que te dé tiempo a ver la Piazza Navona
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 10:30 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. ⚠️ Domingos y festivos, solo de 09:00 a 09:30 y de 11:45 a 19:00. |
| 11:30 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:00–15:00 | 🍝 **Comida**: Armando al Pantheon en Centro Histórico | | | |
| 15:00 | Iglesia de San Luigi dei Francesi | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 15:30 | Iglesia de Santa Maria sopra Minerva | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Iglesia del Gesù | 30 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 16:35 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 17:15 | Plaza Trilussa | 15 min | 11 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Campo de' Fiori | 25 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Plaza Farnese | 10 min | 1 min | Te pilla de camino a la cena: merece la parada. |

- **Tarde libre** (90 min). Sugerencias: Elefantino de Bernini (9 min).
- **Cena**: 20:00 en Centro Histórico (5 min andando desde la última parada).
- **Nocturna**: 21:30 Puente Sant'Angelo (noche).

## 9. 3 días · del sábado 14 de agosto de 2027 al lunes 16 de agosto de 2027 · completo · Imprescindibles + Free Tour

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

- **Tarde libre** (90 min). Sugerencias: Boca de la Verdad (6 min), Plaza Trilussa (9 min).
- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
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
| 16:45 | Mirador del Janículo | 40 min | 31 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Fontana dell'Acqua Paola | 15 min | 16 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Trastevere | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 19:05 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

## 10. 4 días · del jueves 25 de marzo de 2027 al domingo 28 de marzo de 2027 · tranquilo · Arte + Barrios (Semana Santa)

### Día 1 — jueves 25 de marzo de 2027

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver Teatro de Marcelo, Via dei Fori Imperiali, Plaza Venecia, Fuente de las Tortugas, Isla Tiberina y el Foro Romano
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–15:00 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 15:00 | Plaza del Campidoglio | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 15:30 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:45 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:30 | Barrio Judío | 30 min | 5 min | Elegido según tus gustos: Barrios y Sabores. |
| 18:05 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:30 | Isla Tiberina | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 2 — viernes 26 de marzo de 2027

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver San Pietro in Montorio y Tempietto de Bramante, Via della Conciliazione, Iglesia de Santa Maria in Trastevere, la Plaza de San Pedro y Basílica de San Pedro
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. |
| 13:30–15:30 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:30 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Mirador del Janículo | 40 min | 26 min | Te pilla de camino a la cena: merece la parada. |
| 17:30 | San Pietro in Montorio y Tempietto de Bramante | 30 min | 15 min | Elegido según tus gustos: Arte y Museos. |
| 18:15 | Trastevere | 45 min | 8 min | Elegido según tus gustos: Barrios y Sabores. |
| 19:05 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3 — sábado 27 de marzo de 2027

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — domingo 28 de marzo de 2027

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver la Piazza Navona
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:30 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 10:30 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 11:30 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 12:00 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. |
| 13:00 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:30–15:30 | 🍝 **Comida**: Trattoria Dal Cavalier Gino en Centro Histórico | | | |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 22 min | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Ignacio de Loyola | 20 min | 13 min | Elegido según tus gustos: Arte y Museos. |
| 17:25 | Palazzo Doria Pamphilj | 60 min | 3 min | Elegido según tus gustos: Arte y Museos. |

- **Cena**: 20:00 en Centro Histórico (10 min andando desde la última parada).
- **Nocturna**: ninguna.

## 11. 4 días · junio · completo · Naturaleza

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
| 18:00 | Isla Tiberina | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |

- **Tarde libre** (90 min). Sugerencias: Boca de la Verdad (6 min), Plaza Trilussa (9 min).
- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

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
| 17:15 | Mirador del Janículo | 40 min | 31 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:15 | Fontana dell'Acqua Paola | 15 min | 16 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:45 | Trastevere | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 19:35 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
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
| 10:30 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. ⚠️ Domingos y festivos, solo de 09:00 a 09:30 y de 11:45 a 19:00. |
| 11:30 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:00–14:30 | 🍝 **Comida**: Poldo e Gianna Osteria en Tridente y Spagna | | | |
| 14:45 | Galería Borghese | 120 min | 29 min | Te pilla de camino a la cena: merece la parada. ⚠️ Cierra los lunes. |
| 17:00 | Parque de Villa Borghese | 90 min | 8 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:45 | Piazza del Popolo | 30 min | 14 min | Te pilla de camino a la cena: merece la parada. |
| 20:05 | Terraza del Pincio 🌅 | 42 min | 7 min | Elegido según tus gustos: Naturaleza y Vistas. |

- **Cena**: 21:00 en Tridente y Spagna (13 min andando desde la última parada).
- **Nocturna**: ninguna.

## 12. 4 días · del sábado 5 de diciembre de 2026 al martes 8 de diciembre de 2026 · completo · Imprescindibles + Arte + Barrios

### Día 1 — sábado 5 de diciembre de 2026

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
| 16:45 | Mirador del Janículo 🌅 | 40 min | 31 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |
| 17:45 | Fontana dell'Acqua Paola | 15 min | 16 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Pasas por San Pietro in Montorio y Tempietto de Bramante | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:45 | Trastevere | 45 min | 8 min | Elegido según tus gustos: Barrios y Sabores. |
| 19:35 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 2 — domingo 6 de diciembre de 2026

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
| 17:00 | Barrio Judío | 30 min | 5 min | Elegido según tus gustos: Barrios y Sabores. |
| 17:35 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Isla Tiberina | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |

- **Tarde libre** (90 min). Sugerencias: Boca de la Verdad (6 min), Plaza Trilussa (9 min).
- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3 — lunes 7 de diciembre de 2026

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — martes 8 de diciembre de 2026

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 10:30 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. |
| 11:30 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:00–14:30 | 🍝 **Comida**: Trattoria Dal Cavalier Gino en Centro Histórico | | | |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 22 min | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Ignacio de Loyola | 20 min | 13 min | Elegido según tus gustos: Arte y Museos. |
| 17:25 | Palazzo Doria Pamphilj | 60 min | 3 min | Elegido según tus gustos: Arte y Museos. |

- **Cena**: 20:00 en Centro Histórico (10 min andando desde la última parada).
- **Nocturna**: ninguna.

## 13. 5 días · diciembre · tranquilo · Arte + Barrios · pool: Galería Borghese, Trastevere

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver el Foro Romano
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–15:00 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 15:00 | Plaza del Campidoglio | 20 min | 7 min | Te pilla de camino a la cena: merece la parada. |
| 15:30 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 16:45 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:30 | Barrio Judío | 30 min | 5 min | Elegido según tus gustos: Barrios y Sabores. |
| 18:05 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:30 | Isla Tiberina | 20 min | 10 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 2

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver Via della Conciliazione, Iglesia de Santa Maria in Trastevere, Mirador del Janículo, San Pietro in Montorio y Tempietto de Bramante, la Plaza de San Pedro y Basílica de San Pedro
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | — | Uno de los imprescindibles de Roma. ⚠️ Cierra los domingos. |
| 11:30 | Plaza de San Pedro | 30 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:05 | Basílica de San Pedro | 75 min | 3 min | Uno de los imprescindibles de Roma. ⚠️ Miércoles, solo de 12:30 a 20:00. |
| 13:30–15:30 | 🍝 **Comida**: Ristorante Arlù en Vaticano y Borgo | | | |
| 15:30 | Pasas por Via della Conciliazione | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Pasas por Borgo Pio | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:30 | Mirador del Janículo 🌅 | 40 min | 26 min | Llegas justo a tiempo para ver el atardecer sobre Roma. |
| 17:30 | San Pietro in Montorio y Tempietto de Bramante | 30 min | 15 min | Elegido según tus gustos: Arte y Museos. ⚠️ Cierra los lunes. |
| 18:15 | Trastevere | 45 min | 8 min | Uno de tus favoritos. |
| 19:05 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3

**Bloques**: mañana: Trevi y la Escalinata sin gente, Panteón y Navona (centro_temprano) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

> Hoy empezamos a las 08:00 para que te dé tiempo a ver Palazzo Doria Pamphilj y la Piazza Navona
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Fontana de Trevi | 30 min | — | Uno de los imprescindibles de Roma. |
| 09:00 | Plaza de España | 30 min | 10 min | Uno de los imprescindibles de Roma. |
| 10:00 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 10:30 | Panteón | 30 min | 12 min | Uno de los imprescindibles de Roma. ⚠️ Domingos y festivos, solo de 09:00 a 09:30 y de 11:45 a 19:00. |
| 11:30 | Piazza Navona | 30 min | 7 min | Uno de los imprescindibles de Roma. |
| 13:00–15:00 | 🍝 **Comida**: Trattoria Dal Cavalier Gino en Centro Histórico | | | |
| 15:00 | Plaza Colonna | 15 min | 3 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 18 min | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Iglesia de San Ignacio de Loyola | 20 min | 13 min | Elegido según tus gustos: Arte y Museos. |
| 17:25 | Palazzo Doria Pamphilj | 60 min | 3 min | Elegido según tus gustos: Arte y Museos. ⚠️ Cierra los miércoles. |

- **Cena**: 20:00 en Centro Histórico (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 4

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5

**Bloques**: mañana: Galería Borghese, el parque y el Popolo (borghese) · tarde: Santa María la Mayor, el Moisés y Monti (monti_basilicas)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 10:00 | Galería Borghese | 135 min | — | Uno de tus favoritos. ⚠️ Cierra los lunes. |
| 13:00–15:00 | 🍝 **Comida**: Edy en Tridente y Spagna | | | |
| 15:00 | Pasas por Terraza del Pincio | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:15 | Piazza del Popolo | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Santa Maria del Popolo | 45 min | 3 min | Elegido según tus gustos: Arte y Museos. ⚠️ Domingos y festivos, solo de 16:30 a 18:00. |
| 17:30 | Basílica de Santa María la Mayor | 45 min | 38 min | Elegido según tus gustos: Arte y Museos. |
| 18:30 | Monti | 40 min | 9 min | Elegido según tus gustos: Barrios y Sabores. |

- **Cena**: 20:00 en Monti y Fori Imperiali (3 min andando desde la última parada).
- **Nocturna**: 21:30 Foro Romano desde el Campidoglio (noche) → 22:15 Coliseo (noche).

## 14. 5 días · septiembre · completo · Imprescindibles + Free Tour

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
| 17:30 | Barrio Judío | 30 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 18:05 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:20 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

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

- **Cena**: 20:00 en Trastevere (7 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3

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
| 16:45 | Mirador del Janículo | 40 min | 31 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Fontana dell'Acqua Paola | 15 min | 16 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Trastevere | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 19:05 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 4

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5

**Bloques**: mañana: Galería Borghese, el parque y el Popolo (borghese) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Galería Borghese | 120 min | — | Te pilla de camino: merece la parada. ⚠️ Cierra los lunes. |
| 11:30 | Parque de Villa Borghese | 90 min | 8 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Edy en Tridente y Spagna | | | |
| 14:30 | Pasas por Terraza del Pincio | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Piazza del Popolo | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | 29 min | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Pasas por Fontana de Trevi | 10 min | 9 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:15 | Pasas por Iglesia de San Ignacio de Loyola | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:45 | Iglesia del Gesù | 30 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 18:30 | Columna de Trajano | 10 min | 8 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trevi (13 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche).

## 15. 6 días · mayo · completo · sin experiencias (sin experiencias)

### Día 1

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Panteón | 30 min | 17 min | Uno de los imprescindibles de Roma. |
| 15:05 | Pasas por Elefantino de Bernini | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:20 | Iglesia de Santa Maria sopra Minerva | 20 min | 1 min | Te pilla de camino a la cena: merece la parada. ⚠️ Sábados, solo de 10:00 a 12:30 y de 15:30 a 19:00. Domingos y festivos, solo de 08:00 a 12:30 y de 15:30 a 19:00. |
| 16:00 | Iglesia de San Luigi dei Francesi | 20 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 16:25 | Piazza Navona | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 17:15 | Pasas por Campo de' Fiori | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:30 | Pasas por Plaza Farnese | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Barrio Judío | 30 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 18:35 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Centro Histórico (10 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

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
| 16:45 | Mirador del Janículo | 40 min | 31 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Fontana dell'Acqua Paola | 15 min | 16 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Trastevere | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 19:05 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3

**Bloques**: mañana: Galería Borghese, el parque y el Popolo (borghese) · tarde: Del Popolo al Pincio al atardecer (tridente_pincio)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Galería Borghese | 120 min | — | Te pilla de camino: merece la parada. ⚠️ Cierra los lunes. |
| 11:30 | Parque de Villa Borghese | 90 min | 8 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Edy en Tridente y Spagna | | | |
| 14:30 | Pasas por Terraza del Pincio | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Piazza del Popolo | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 15:30 | Pasas por Via Condotti | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:45 | Pasas por Via del Corso | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 16:15 | Plaza de España | 30 min | 8 min | Uno de los imprescindibles de Roma. |
| 17:00 | Santa Maria del Popolo | 30 min | 13 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Ara Pacis | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Tridente y Spagna (6 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 4

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5

**Bloques**: mañana: Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Termas de Caracalla | 60 min | — | Te pilla de camino: merece la parada. ⚠️ Cierra los lunes. |
| 10:30 | Pasas por Circo Máximo | 10 min | 17 min | Pasas por aquí de camino: no hace falta pararse. |
| 11:00 | Boca de la Verdad | 20 min | 6 min | Te pilla de camino: merece la parada. |
| 12:00 | Jardín de los Naranjos | 20 min | 11 min | Te pilla de camino: merece la parada. |
| 12:30 | Ojo de la Cerradura del Aventino | 10 min | 4 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Felice a Testaccio en Testaccio | | | |
| 14:30 | Mercado de Testaccio | 40 min | 4 min | Te pilla de camino a la cena: merece la parada. ⚠️ Cierra los domingos. |
| 15:45 | Plaza del Campidoglio | 20 min | 30 min | Te pilla de camino a la cena: merece la parada. |
| 16:15 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 17:30 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:30 | Isla Tiberina | 20 min | 9 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 6

**Bloques**: mañana: excursión de medio día (ostia_antica) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

**Mañana: excursión de medio día** (ostia_antica, 08:00-14:00); la ciudad, desde las 16:00.
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | — | Te pilla de camino a la cena: merece la parada. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Fontana de Trevi | 30 min | 9 min | Uno de los imprescindibles de Roma. |
| 17:45 | Iglesia de San Ignacio de Loyola | 20 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Iglesia del Gesù | 30 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 18:50 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trevi (16 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche).

## 16. 7 días · del lunes 13 de septiembre de 2027 al domingo 19 de septiembre de 2027 · completo · Imprescindibles + Arte + Naturaleza (empieza en lunes)

### Día 1 — lunes 13 de septiembre de 2027

**Bloques**: mañana: Coliseo, Foro y Palatino (roma_antigua) · tarde: El centro barroco: Panteón, Caravaggio y el Ghetto (centro_barroco)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 08:00 | Arco de Constantino | 15 min | — | Uno de los imprescindibles de Roma. |
| 08:30 | Coliseo | 90 min | 3 min | Uno de los imprescindibles de Roma. |
| 10:30 | Foro Romano y Palatino | 105 min | 11 min | Uno de los imprescindibles de Roma. |
| 12:30 | Pasas por Via dei Fori Imperiali | 10 min | 5 min | Pasas por aquí de camino: no hace falta pararse. |
| 13:00–14:30 | 🍝 **Comida**: La Taverna dei Fori Imperiali en Monti y Fori Imperiali | | | |
| 14:30 | Panteón | 30 min | 17 min | Uno de los imprescindibles de Roma. |
| 15:05 | Pasas por Elefantino de Bernini | 10 min | 3 min | Pasas por aquí de camino: no hace falta pararse. |
| 15:20 | Iglesia de Santa Maria sopra Minerva | 20 min | 1 min | Elegido según tus gustos: Arte y Museos. |
| 16:00 | Iglesia de San Luigi dei Francesi | 20 min | 8 min | Elegido según tus gustos: Arte y Museos. |
| 16:25 | Piazza Navona | 30 min | 3 min | Uno de los imprescindibles de Roma. |
| 17:15 | Pasas por Campo de' Fiori | 10 min | 7 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:30 | Pasas por Plaza Farnese | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Barrio Judío | 30 min | 10 min | Te pilla de camino a la cena: merece la parada. |
| 18:35 | Pasas por Fuente de las Tortugas | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Centro Histórico (10 min andando desde la última parada).
- **Nocturna**: 21:30 Fontana de Trevi (noche).

### Día 2 — martes 14 de septiembre de 2027

**Bloques**: mañana: Museos Vaticanos, San Pedro y la Cúpula (vaticano) · tarde: Del Castillo al Janículo y a cenar a Trastevere (vaticano_trastevere)

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
| 17:15 | Mirador del Janículo | 40 min | 31 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:15 | Fontana dell'Acqua Paola | 15 min | 16 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 18:45 | Trastevere | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 19:35 | Pasas por Iglesia de Santa Maria in Trastevere | 10 min | 1 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Trastevere (4 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 3 — miércoles 15 de septiembre de 2027

**Bloques**: mañana: Galería Borghese, el parque y el Popolo (borghese) · tarde: Del Popolo al Pincio al atardecer (tridente_pincio)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Galería Borghese | 120 min | — | Elegido según tus gustos: Arte y Museos. |
| 11:30 | Parque de Villa Borghese | 90 min | 8 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 13:00–14:30 | 🍝 **Comida**: Edy en Tridente y Spagna | | | |
| 14:30 | Pasas por Terraza del Pincio | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 14:45 | Piazza del Popolo | 30 min | 5 min | Te pilla de camino a la cena: merece la parada. |
| 16:00 | Santa Maria del Popolo | 30 min | 3 min | Elegido según tus gustos: Arte y Museos. |
| 16:45 | Ara Pacis | 45 min | 9 min | Te pilla de camino a la cena: merece la parada. |
| 17:45 | Plaza de España | 30 min | 12 min | Uno de los imprescindibles de Roma. |
| 18:30 | Pasas por Via Condotti | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |

- **Cena**: 20:00 en Tridente y Spagna (3 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 4 — jueves 16 de septiembre de 2027

**Excursión** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — viernes 17 de septiembre de 2027

**Bloques**: mañana: Termas de Caracalla, Aventino y mercado de Testaccio (caracalla_aventino) · tarde: Campidoglio, el Altar y el Ghetto (campidoglio_ghetto)

| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 09:00 | Termas de Caracalla | 60 min | — | Te pilla de camino: merece la parada. |
| 10:30 | Pasas por Circo Máximo | 10 min | 17 min | Pasas por aquí de camino: no hace falta pararse. |
| 11:00 | Boca de la Verdad | 20 min | 6 min | Te pilla de camino: merece la parada. |
| 12:00 | Jardín de los Naranjos | 20 min | 11 min | Elegido según tus gustos: Naturaleza y Vistas. |
| 12:30 | Ojo de la Cerradura del Aventino | 10 min | 4 min | Te pilla de camino: merece la parada. |
| 13:00–14:30 | 🍝 **Comida**: Felice a Testaccio en Testaccio | | | |
| 14:30 | Mercado de Testaccio | 40 min | 4 min | Te pilla de camino a la cena: merece la parada. |
| 15:45 | Plaza del Campidoglio | 20 min | 30 min | Te pilla de camino a la cena: merece la parada. |
| 16:15 | Altar de la Patria | 60 min | 7 min | Uno de los imprescindibles de Roma. |
| 17:30 | Pasas por Plaza Venecia | 10 min | 4 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:00 | Pasas por Teatro de Marcelo | 10 min | 11 min | Pasas por aquí de camino: no hace falta pararse. |
| 18:30 | Isla Tiberina | 20 min | 9 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Trastevere (10 min andando desde la última parada).
- **Nocturna**: ninguna.

### Día 6 — sábado 18 de septiembre de 2027

**Bloques**: mañana: excursión de medio día (ostia_antica) · tarde: Bernini, Trevi y la cúpula falsa de San Ignacio (bernini_trevi)

**Mañana: excursión de medio día** (ostia_antica, 08:00-14:00); la ciudad, desde las 16:00.
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 16:00 | Iglesia de Santa Maria della Vittoria | 20 min | — | Elegido según tus gustos: Arte y Museos. |
| 16:30 | Pasas por Fuente del Tritón | 10 min | 6 min | Pasas por aquí de camino: no hace falta pararse. |
| 17:00 | Fontana de Trevi | 30 min | 9 min | Uno de los imprescindibles de Roma. |
| 17:45 | Iglesia de San Ignacio de Loyola | 20 min | 5 min | Elegido según tus gustos: Arte y Museos. |
| 18:15 | Iglesia del Gesù | 30 min | 8 min | Te pilla de camino a la cena: merece la parada. |
| 18:50 | Largo di Torre Argentina | 20 min | 3 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Centro Histórico (7 min andando desde la última parada).
- **Nocturna**: 21:30 Panteón (noche).

### Día 7 — domingo 19 de septiembre de 2027

**Bloques**: mañana: excursión de medio día (tivoli_villas) · tarde: Santa María la Mayor, el Moisés y Monti (monti_basilicas)

**Mañana: excursión de medio día** (tivoli_villas, 08:00-14:00); la ciudad, desde las 16:00.
| Hora | Parada | Duración | Andando | Por qué |
|---|---|---|---|---|
| 16:00 | Basílica de Santa María la Mayor | 30 min | — | Elegido según tus gustos: Arte y Museos. |
| 16:45 | Iglesia de San Pietro in Vincoli | 20 min | 12 min | Elegido según tus gustos: Arte y Museos. |
| 17:15 | Monti | 40 min | 4 min | Te pilla de camino a la cena: merece la parada. |
| 18:15 | Mercados de Trajano | 60 min | 8 min | Te pilla de camino a la cena: merece la parada. |

- **Cena**: 20:00 en Monti y Fori Imperiali (9 min andando desde la última parada).
- **Nocturna**: 21:30 Foro Romano desde el Campidoglio (noche) → 22:15 Coliseo (noche).

