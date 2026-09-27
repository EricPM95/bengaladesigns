# Revisión de rutas de Roma — V2

Motor v3 tras los 10 arreglos para cerrar Roma, generado el 2026-09-27 con `node scripts/destino/revisionV2.mjs`. 21 viajes: 6 de 2 días, 6 de 3 y 6 de 4 (misma matriz en cada duración: completo con Arte; completo con Naturaleza y pool A; completo con Free Tour y Barrios; completo con Free Tour, Arte y Naturaleza y pool B; tranquilo con Barrios y pool A; tranquilo con Free Tour y Naturaleza) y los 3 de festivos (24-25 de diciembre, 31 de diciembre al 2 de enero y 1-2 de mayo).

- **Pool A**: Galería Borghese y Castillo de Sant'Angelo. **Pool B**: Termas de Caracalla y Basílica de San Clemente.
- Meses: enero, abril, julio y octubre; salidas en lunes, miércoles, sábado y domingo, sin repetir la pareja mes-día dentro de una duración.
- Nada de lo que sale aquí está arreglado: la tabla resumen y "lo que parece raro" están al final.

Cómo leerlo:
- **Llega / Sale**: la hora a la que se llega a la parada y a la que se sale; **Dura**: el tiempo en ella.
- **Nota**: "por el camino" (se pasa por delante, sin pararse: calles, plazas, fuentes), "por fuera" (un monumento que ese día no se visita, con el motivo), 🌅 el mirador del atardecer, 🔒 cerrado ese día (con su aviso), "tiempo libre", y los avisos de horario.
- **Traslado**: solo los de más de 15 min andando, con los minutos (matriz del destino). El aviso de transporte del día (🚌) va arriba del día.
- 🕐 tiempo libre (todo hueco de más de 30 min, con sugerencias); 🍝 comida con su restaurante y barrio; 🍷 cena con su barrio (el motor elige el barrio de la cena, no el restaurante); 🌙 experiencia nocturna, en su hora.
- Al final de cada viaje, lo que no entró; al final del documento, **lo que parece raro**, para decidir.

## Índice

| Viaje | Días | Ritmo | Experiencias | Mes | Empieza | Pool |
|---|---|---|---|---|---|---|
| [1](#viaje-1) | 2 | completo | Arte | enero (invierno) | lunes 11 de enero | no |
| [2](#viaje-2) | 2 | completo | Naturaleza | abril (primavera) | miércoles 14 de abril | Galería Borghese, Castillo de Sant'Angelo |
| [3](#viaje-3) | 2 | completo | Free Tour + Barrios | julio (verano) | sábado 17 de julio | no |
| [4](#viaje-4) | 2 | completo | Free Tour + Arte + Naturaleza | octubre (otoño) | domingo 17 de octubre | Termas de Caracalla, Basílica de San Clemente |
| [5](#viaje-5) | 2 | tranquilo | Barrios | enero (invierno) | sábado 16 de enero | Galería Borghese, Castillo de Sant'Angelo |
| [6](#viaje-6) | 2 | tranquilo | Free Tour + Naturaleza | julio (verano) | lunes 12 de julio | no |
| [7](#viaje-7) | 3 | completo | Arte | abril (primavera) | lunes 12 de abril | no |
| [8](#viaje-8) | 3 | completo | Naturaleza | julio (verano) | miércoles 14 de julio | Galería Borghese, Castillo de Sant'Angelo |
| [9](#viaje-9) | 3 | completo | Free Tour + Barrios | octubre (otoño) | sábado 16 de octubre | no |
| [10](#viaje-10) | 3 | completo | Free Tour + Arte + Naturaleza | enero (invierno) | domingo 17 de enero | Termas de Caracalla, Basílica de San Clemente |
| [11](#viaje-11) | 3 | tranquilo | Barrios | abril (primavera) | sábado 17 de abril | Galería Borghese, Castillo de Sant'Angelo |
| [12](#viaje-12) | 3 | tranquilo | Free Tour + Naturaleza | octubre (otoño) | miércoles 13 de octubre | no |
| [13](#viaje-13) | 4 | completo | Arte | julio (verano) | domingo 18 de julio | no |
| [14](#viaje-14) | 4 | completo | Naturaleza | octubre (otoño) | lunes 11 de octubre | Galería Borghese, Castillo de Sant'Angelo |
| [15](#viaje-15) | 4 | completo | Free Tour + Barrios | enero (invierno) | miércoles 13 de enero | no |
| [16](#viaje-16) | 4 | completo | Free Tour + Arte + Naturaleza | abril (primavera) | domingo 18 de abril | Termas de Caracalla, Basílica de San Clemente |
| [17](#viaje-17) | 4 | tranquilo | Barrios | julio (verano) | miércoles 14 de julio | Galería Borghese, Castillo de Sant'Angelo |
| [18](#viaje-18) | 4 | tranquilo | Free Tour + Naturaleza | enero (invierno) | sábado 16 de enero | no |
| [19](#viaje-19) | 2 | completo | sin experiencias | diciembre (invierno) | jueves 24 de diciembre | no |
| [20](#viaje-20) | 3 | completo | sin experiencias | diciembre (invierno) | jueves 31 de diciembre | no |
| [21](#viaje-21) | 2 | completo | sin experiencias | mayo (primavera) | sábado 1 de mayo | no |

<a id="viaje-1"></a>
## Viaje 1 — 2 días · completo · Arte · enero · empieza en lunes

Del lunes 11 de enero al martes 12 de enero de 2027.

> **Banner**: 2 días en Roma en invierno son un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1 — lunes 11 de enero · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco
- **Atardecer**: 16:59

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Fuente de las Tortugas | por el camino |  |
| 16:00 | 16:20 | 20 min | Largo di Torre Argentina | por el camino |  |
| 16:30 | 16:55 | 25 min | Panteón |  |  |
| 17:00 | 17:10 | 10 min | Elefantino de Bernini | por el camino |  |
| 17:15 | 17:35 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:35 | 20 min | Piazza Navona |  |  |
| 18:45 | 18:55 | 10 min | Campo de' Fiori | por el camino |  |
| | | 55 min | 🕐 **Tiempo libre**: Paseo por Piazza Navona y el Panteón iluminados y aperitivo | Plaza Farnese, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |
| 22:30 | 22:55 | 25 min | 🌙 Plaza de España (noche) | paseo nocturno «La Roma de las fuentes» | |

### Día 2 — martes 12 de enero · Roma — día 2

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer · variantes: invierno
- **Atardecer**: 17:00
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 15:20 | 5 min | Borgo Pio | por el camino |  |
| 15:30 | 15:50 | 20 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 17:10 | 40 min | Mirador del Janículo | 🌅 atardecer 17:00 | 🚶 31 min desde Puente Sant'Angelo |
| 17:30 | 17:40 | 10 min | Fontana dell'Acqua Paola |  | 🚶 16 min desde Mirador del Janículo |
| 17:45 | 18:05 | 20 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 18:15 | 18:25 | 10 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:30 | 19:15 | 45 min | Trastevere |  |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno. Solo de noche: Fontana de Trevi, Plaza de España.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-2"></a>
## Viaje 2 — 2 días · completo · Naturaleza · abril · empieza en miércoles · pool: Galería Borghese, Castillo de Sant'Angelo

Del miércoles 14 de abril al jueves 15 de abril de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — miércoles 14 de abril · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco · variantes: pool_borghese
- **Atardecer**: 19:49

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:30 | 16:05 | 35 min | Fontana de Trevi |  |  |
| 16:15 | 16:25 | 10 min | Plaza de España | por el camino |  |
| 16:45 | 18:45 | 120 min | Galería Borghese |  | 🚶 16 min desde Plaza de España |
| 19:15 | 19:49 | 34 min | Terraza del Pincio | 🌅 atardecer 19:49 | 🚶 17 min desde Galería Borghese |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | paseo nocturno «El centro iluminado» | |
| 22:30 | 22:55 | 25 min | 🌙 Piazza Navona (noche) | paseo nocturno «El centro iluminado» | |

### Día 2 — jueves 15 de abril · Roma — día 2

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer
- **Atardecer**: 19:51

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 16:30 | 75 min | Castillo de Sant'Angelo | se ve por fuera: Puente Sant'Angelo |  |
| 17:00 | 17:25 | 25 min | Iglesia de Santa Maria in Trastevere |  | 🚶 24 min desde Castillo de Sant'Angelo |
| 17:30 | 18:10 | 40 min | Trastevere |  |  |
| 18:30 | 18:45 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:15 | 19:55 | 40 min | Mirador del Janículo | 🌅 atardecer 19:51 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno. Solo de noche: Panteón, Piazza Navona.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-3"></a>
## Viaje 3 — 2 días · completo · Free Tour + Barrios · julio · empieza en sábado

Del sábado 17 de julio al domingo 18 de julio de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — sábado 17 de julio · Roma — día 1

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 08:55 | 25 min | Fontana de Trevi |  |  |
| 09:00 | 09:50 | 50 min | Desayuno romano |  |  |
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 2 — domingo 18 de julio · Roma — día 2

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer
- **Atardecer**: 20:42

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 16:05 | 20 min | Fuente de las Tortugas | por el camino |  |
| 16:15 | 16:20 | 5 min | Teatro de Marcelo | por el camino |  |
| 16:30 | 16:55 | 25 min | Isla Tiberina |  |  |
| 17:00 | 17:20 | 20 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 17:30 | 18:40 | 70 min | Trastevere |  |  |
| 18:45 | 19:05 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:15 | 19:20 | 5 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 20:00 | 20:42 | 42 min | Mirador del Janículo | 🌅 atardecer 20:42 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 22:30 | 23:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-4"></a>
## Viaje 4 — 2 días · completo · Free Tour + Arte + Naturaleza · octubre · empieza en domingo · pool: Termas de Caracalla, Basílica de San Clemente

Del domingo 17 de octubre al lunes 18 de octubre de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — domingo 17 de octubre · Roma — día 1

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer · variantes: invierno, pool_caracalla
- **Atardecer**: 18:26

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 13:30 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 13:30 | 15:00 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:00 | 15:10 | 10 min | Circo Máximo | por el camino |  |
| 15:30 | 16:30 | 60 min | Termas de Caracalla |  | 🚶 17 min desde Circo Máximo |
| 17:00 | 17:15 | 15 min | Boca de la Verdad |  | 🚶 21 min desde Termas de Caracalla |
| 17:30 | 17:55 | 25 min | Jardín de los Naranjos |  |  |
| 18:00 | 18:10 | 10 min | Ojo de la Cerradura del Aventino |  |  |
| 18:45 | 19:30 | 45 min | Trastevere |  | 🚶 21 min desde Ojo de la Cerradura del Aventino |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Mirador del Janículo (noche) | paseo nocturno «Roma desde arriba» | |

### Día 2 — lunes 18 de octubre · Roma — día 2

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 18:25

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 08:55 | 25 min | Fontana de Trevi |  |  |
| 09:00 | 09:50 | 50 min | Desayuno romano |  |  |
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

#### Lo que quedó fuera

- **No te dio tiempo**: Basílica de San Clemente (En 2 días solo hay una tarde para tus lugares elegidos, y es para Termas de Caracalla).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-5"></a>
## Viaje 5 — 2 días · tranquilo · Barrios · enero · empieza en sábado · pool: Galería Borghese, Castillo de Sant'Angelo

Del sábado 16 de enero al domingo 17 de enero de 2027.

> **Banner**: 2 días en Roma en invierno son un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1 — sábado 16 de enero · Roma — día 1

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer · variantes: invierno, tranquilo, tranquilo_invierno
- **Atardecer**: 17:05

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:25 | 25 min | Plaza de San Pedro |  |  |
| 15:30 | 16:50 | 80 min | Basílica de San Pedro |  |  |
| 17:15 | 18:25 | 70 min | Castillo de Sant'Angelo |  |  |
| 18:30 | 18:50 | 20 min | Puente Sant'Angelo | 🌙 Roma iluminada desde el Puente Sant'Angelo |  |
| 19:15 | 19:40 | 25 min | Iglesia de Santa Maria in Trastevere |  | 🚶 22 min desde Puente Sant'Angelo |
| 19:45 | 20:30 | 45 min | Trastevere |  |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 2 — domingo 17 de enero · Roma — día 2

- **Día curado**: D1 · Roma Antigua y el centro barroco · variantes: tranquilo, pool_borghese
- **Atardecer**: 17:06
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver la Galería Borghese

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 11:25 | 85 min | Coliseo |  |  |
| 11:30 | 11:50 | 20 min | Arco de Constantino |  |  |
| 12:00 | 13:45 | 105 min | Foro Romano y Palatino |  |  |
| 13:45 | 15:00 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:00 | 15:30 | 30 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 15:45 | 16:20 | 35 min | Fontana de Trevi |  |  |
| 16:30 | 16:40 | 10 min | Plaza de España | por el camino |  |
| 17:00 | 19:00 | 120 min | Galería Borghese |  | 🚶 16 min desde Plaza de España |
| 19:30 | 19:50 | 20 min | Terraza del Pincio | 🌙 Roma iluminada desde el Pincio | 🚶 17 min desde Galería Borghese |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 21:30 | 22:15 | 45 min | 🌙 Panteón (noche) | paseo nocturno «El centro iluminado» | |
| 22:30 | 22:55 | 25 min | 🌙 Piazza Navona (noche) | paseo nocturno «El centro iluminado» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno. Solo de noche: Panteón, Piazza Navona.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-6"></a>
## Viaje 6 — 2 días · tranquilo · Free Tour + Naturaleza · julio · empieza en lunes

Del lunes 12 de julio al martes 13 de julio de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — lunes 12 de julio · Roma — día 1

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 20:46
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:15 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 2 — martes 13 de julio · Roma — día 2

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer · variantes: tranquilo
- **Atardecer**: 20:45

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 11:25 | 85 min | Coliseo |  |  |
| 11:30 | 11:50 | 20 min | Arco de Constantino |  |  |
| 12:00 | 13:45 | 105 min | Foro Romano y Palatino |  |  |
| 13:45 | 15:45 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:45 | 16:45 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 17:00 | 17:35 | 35 min | Barrio Judío |  |  |
| 17:45 | 18:05 | 20 min | Isla Tiberina |  |  |
| 18:15 | 19:00 | 45 min | Trastevere |  |  |
| | | 61 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Iglesia de Santa Maria in Trastevere, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-7"></a>
## Viaje 7 — 3 días · completo · Arte · abril · empieza en lunes

Del lunes 12 de abril al miércoles 14 de abril de 2027.

> **Banner**: ninguno.

### Día 1 — lunes 12 de abril · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco
- **Atardecer**: 19:47

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Fuente de las Tortugas | por el camino |  |
| 16:00 | 16:20 | 20 min | Largo di Torre Argentina | por el camino |  |
| 16:30 | 16:55 | 25 min | Panteón |  |  |
| 17:00 | 17:10 | 10 min | Elefantino de Bernini | por el camino |  |
| 17:15 | 17:35 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:35 | 20 min | Piazza Navona |  |  |
| 18:45 | 18:55 | 10 min | Campo de' Fiori | por el camino |  |
| | | 55 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Plaza Farnese, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |

### Día 2 — martes 13 de abril · Roma — día 2

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer
- **Atardecer**: 19:48

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 15:20 | 5 min | Borgo Pio | por el camino |  |
| 15:30 | 15:50 | 20 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:15 | 16:40 | 25 min | Iglesia de Santa Maria in Trastevere |  | 🚶 22 min desde Puente Sant'Angelo |
| 16:45 | 17:50 | 65 min | Trastevere |  |  |
| 18:00 | 18:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 18:15 | 18:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:00 | 19:43 | 43 min | Mirador del Janículo | 🌅 atardecer 19:48 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 3 — miércoles 14 de abril · Roma — día 3

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese
- **Atardecer**: 19:49

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:25 | 25 min | Fontana de Trevi |  |  |
| 08:30 | 09:25 | 55 min | Desayuno romano |  |  |
| 09:30 | 09:40 | 10 min | Iglesia de San Ignacio de Loyola |  |  |
| 09:45 | 10:05 | 20 min | Plaza Colonna | por el camino |  |
| 10:15 | 10:20 | 5 min | Via Condotti | por el camino |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:55 | 25 min | Santa Maria del Popolo |  |  |
| 12:00 | 12:35 | 35 min | Piazza del Popolo |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:00 | 17:05 | 125 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 17:15 | 18:35 | 80 min | Parque de Villa Borghese |  |  |
| 19:00 | 19:44 | 44 min | Terraza del Pincio | 🌅 atardecer 19:49 |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 21:30 | 22:15 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-8"></a>
## Viaje 8 — 3 días · completo · Naturaleza · julio · empieza en miércoles · pool: Galería Borghese, Castillo de Sant'Angelo

Del miércoles 14 de julio al viernes 16 de julio de 2027.

> **Banner**: ninguno.

### Día 1 — miércoles 14 de julio · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Fuente de las Tortugas | por el camino |  |
| 16:00 | 16:20 | 20 min | Largo di Torre Argentina | por el camino |  |
| 16:30 | 16:55 | 25 min | Panteón |  |  |
| 17:00 | 17:10 | 10 min | Elefantino de Bernini | por el camino |  |
| 17:15 | 17:35 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:35 | 20 min | Piazza Navona |  |  |
| 18:45 | 18:55 | 10 min | Campo de' Fiori | por el camino |  |
| | | 55 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Plaza Farnese, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |

### Día 2 — jueves 15 de julio · Roma — día 2

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 15:25 | 10 min | Borgo Pio | por el camino |  |
| 15:45 | 16:55 | 70 min | Castillo de Sant'Angelo |  |  |
| 17:00 | 17:20 | 20 min | Puente Sant'Angelo |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de Santa Maria in Trastevere |  | 🚶 22 min desde Puente Sant'Angelo |
| 18:15 | 18:50 | 35 min | Trastevere |  |  |
| 19:00 | 19:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 19:15 | 19:35 | 20 min | Fontana dell'Acqua Paola |  |  |
| 20:00 | 20:44 | 44 min | Mirador del Janículo | 🌅 atardecer 20:44 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 22:30 | 23:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 3 — viernes 16 de julio · Roma — día 3

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:25 | 25 min | Fontana de Trevi |  |  |
| 08:30 | 09:25 | 55 min | Desayuno romano |  |  |
| 09:30 | 09:40 | 10 min | Iglesia de San Ignacio de Loyola |  |  |
| 09:45 | 10:05 | 20 min | Plaza Colonna | por el camino |  |
| 10:15 | 10:20 | 5 min | Via Condotti | por el camino |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:55 | 25 min | Santa Maria del Popolo |  |  |
| 12:00 | 12:35 | 35 min | Piazza del Popolo |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:00 | 17:05 | 125 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 17:15 | 19:25 | 130 min | Parque de Villa Borghese |  |  |
| 20:00 | 20:43 | 43 min | Terraza del Pincio | 🌅 atardecer 20:43 |  |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 22:00 | 22:45 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-9"></a>
## Viaje 9 — 3 días · completo · Free Tour + Barrios · octubre · empieza en sábado

Del sábado 16 de octubre al lunes 18 de octubre de 2027.

> **Banner**: ninguno.

### Día 1 — sábado 16 de octubre · Roma — día 1

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 18:28

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 08:55 | 25 min | Fontana de Trevi |  |  |
| 09:00 | 09:50 | 50 min | Desayuno romano |  |  |
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 2 — domingo 17 de octubre · Roma — día 2

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer · variantes: invierno
- **Atardecer**: 18:26

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 16:05 | 20 min | Fuente de las Tortugas | por el camino |  |
| 16:15 | 16:20 | 5 min | Teatro de Marcelo | por el camino |  |
| 16:30 | 16:55 | 25 min | Isla Tiberina |  |  |
| 17:00 | 17:20 | 20 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 17:30 | 18:25 | 55 min | Trastevere |  |  |
| 18:30 | 18:50 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:00 | 19:40 | 40 min | 🌙 Mirador del Janículo (noche) | paseo nocturno «Roma desde arriba», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — lunes 18 de octubre · Roma — día 3

- **Día curado**: D5C · El Aventino, Testaccio, las basílicas y el Coliseo de noche
- **Atardecer**: 18:25

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:30 | 09:45 | 15 min | Boca de la Verdad |  |  |
| 10:00 | 10:25 | 25 min | Jardín de los Naranjos |  |  |
| 10:30 | 10:35 | 5 min | Ojo de la Cerradura del Aventino |  |  |
| 10:45 | 10:55 | 10 min | Pirámide Cestia | por el camino |  |
| 11:00 | 11:35 | 35 min | Cementerio Protestante |  |  |
| 11:45 | 12:20 | 35 min | Testaccio |  |  |
| 12:30 | 13:45 | | 🍝 **Comida**: Felice a Testaccio | en Testaccio | |
| 14:15 | 15:00 | 45 min | Basílica de San Clemente |  | 🚇 Metro B, unos 20 min |
| 15:15 | 15:45 | 30 min | Basílica de San Juan de Letrán |  |  |
| 16:15 | 16:45 | 30 min | Basílica de Santa María la Mayor |  | 🚶 21 min desde Basílica de San Juan de Letrán |
| 17:00 | 17:25 | 25 min | Iglesia de San Pietro in Vincoli |  |  |
| 17:30 | 18:05 | 35 min | Monti |  |  |
| 18:15 | 18:25 | 10 min | Via dei Fori Imperiali | 🌅 atardecer 18:25 |  |
| 19:00 | 19:45 | 45 min | 🌙 Coliseo (noche) | paseo nocturno «El Coliseo iluminado», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Monti |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-10"></a>
## Viaje 10 — 3 días · completo · Free Tour + Arte + Naturaleza · enero · empieza en domingo · pool: Termas de Caracalla, Basílica de San Clemente

Del domingo 17 de enero al martes 19 de enero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:15 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — domingo 17 de enero · Roma — día 1

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer · variantes: invierno
- **Atardecer**: 17:06

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 16:05 | 20 min | Fuente de las Tortugas | por el camino |  |
| 16:15 | 16:20 | 5 min | Teatro de Marcelo | por el camino |  |
| 16:30 | 16:55 | 25 min | Isla Tiberina |  |  |
| 17:00 | 17:20 | 20 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 17:30 | 18:25 | 55 min | Trastevere |  |  |
| 18:30 | 18:50 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:00 | 19:40 | 40 min | 🌙 Mirador del Janículo (noche) | paseo nocturno «Roma desde arriba», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 2 — lunes 18 de enero · Roma — día 2

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 17:07

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 08:55 | 25 min | Fontana de Trevi |  |  |
| 09:00 | 09:50 | 50 min | Desayuno romano |  |  |
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 3 — martes 19 de enero · Roma — día 3

- **Día curado**: D5 · El sur de Roma: el Aventino, Testaccio y la Via Appia · variantes: invierno, pool_san_clemente
- **Atardecer**: 17:08

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 10:00 | 60 min | Termas de Caracalla |  |  |
| 10:30 | 10:45 | 15 min | Boca de la Verdad |  | 🚶 21 min desde Termas de Caracalla |
| 11:00 | 11:25 | 25 min | Jardín de los Naranjos |  |  |
| 11:30 | 11:35 | 5 min | Ojo de la Cerradura del Aventino |  |  |
| 11:45 | 12:30 | 45 min | Testaccio |  |  |
| 13:00 | 14:15 | | 🍝 **Comida**: Felice a Testaccio | en Testaccio | |
| 14:45 | 15:30 | 45 min | Basílica de San Clemente |  | 🚇 Metro B, unos 20 min |
| 15:45 | 16:10 | 25 min | Iglesia de San Pietro in Vincoli |  |  |
| 16:15 | 16:50 | 35 min | Monti |  |  |
| 17:15 | 17:35 | 20 min | Plaza del Campidoglio | 🌅 atardecer 17:08 | 🚶 18 min desde Monti |
| 17:45 | 18:45 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| | | 56 min | 🕐 **Tiempo libre**: Paseo por Monti y los Foros iluminados y aperitivo | Iglesia del Gesù, Largo di Torre Argentina, Plaza Venecia | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Monti | 🚶 19 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-11"></a>
## Viaje 11 — 3 días · tranquilo · Barrios · abril · empieza en sábado · pool: Galería Borghese, Castillo de Sant'Angelo

Del sábado 17 de abril al lunes 19 de abril de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas.

### Día 1 — sábado 17 de abril · Roma — día 1

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer · variantes: tranquilo
- **Atardecer**: 19:53

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:25 | 25 min | Plaza de San Pedro |  |  |
| 15:30 | 16:50 | 80 min | Basílica de San Pedro |  |  |
| 17:15 | 18:30 | 75 min | Castillo de Sant'Angelo | se ve por fuera: Puente Sant'Angelo |  |
| 19:00 | 19:45 | 45 min | Trastevere |  | 🚶 25 min desde Castillo de Sant'Angelo |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 2 — domingo 18 de abril · Roma — día 2

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese · variantes: tranquilo, domingo
- **Atardecer**: 19:54

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:35 | 35 min | Fontana de Trevi | ℹ️ A esta hora ya hay gente; si puedes, pásate temprano. |  |
| 10:45 | 11:10 | 25 min | Plaza de España |  |  |
| 11:30 | 12:00 | 30 min | Piazza del Popolo |  |  |
| | | 55 min | 🕐 **Tiempo libre** | antes de comer · Via Condotti | |
| 13:00 | 15:00 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:00 | 17:00 | 120 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 17:30 | 18:00 | 30 min | Santa Maria del Popolo |  | 🚶 19 min desde Galería Borghese |
| 18:30 | 19:00 | 30 min | Parque de Villa Borghese |  | 🚶 16 min desde Santa Maria del Popolo |
| 19:15 | 19:54 | 39 min | Terraza del Pincio | 🌅 atardecer 19:54 |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 21:30 | 22:15 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada» | |

### Día 3 — lunes 19 de abril · Roma — día 3

- **Día curado**: D1 · Roma Antigua y el centro barroco · variantes: tranquilo
- **Atardecer**: 19:55

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 11:25 | 85 min | Coliseo |  |  |
| 11:30 | 11:50 | 20 min | Arco de Constantino |  |  |
| 12:00 | 13:45 | 105 min | Foro Romano y Palatino |  |  |
| 13:45 | 15:45 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:45 | 15:50 | 5 min | Plaza del Campidoglio | por el camino |  |
| 16:00 | 16:35 | 35 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 17:00 | 17:35 | 35 min | Panteón |  |  |
| 17:45 | 17:55 | 10 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:00 | 18:35 | 35 min | Piazza Navona |  |  |
| 18:45 | 19:10 | 25 min | Campo de' Fiori |  |  |
| 19:15 | 19:25 | 10 min | Plaza Farnese | por el camino |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |

#### Lo que quedó fuera

- **No te dio tiempo**: Mirador del Janículo (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-12"></a>
## Viaje 12 — 3 días · tranquilo · Free Tour + Naturaleza · octubre · empieza en miércoles

Del miércoles 13 de octubre al viernes 15 de octubre de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas.

### Día 1 — miércoles 13 de octubre · Roma — día 1

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 18:33
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:15 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 2 — jueves 14 de octubre · Roma — día 2

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer · variantes: tranquilo
- **Atardecer**: 18:31

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 11:25 | 85 min | Coliseo |  |  |
| 11:30 | 11:50 | 20 min | Arco de Constantino |  |  |
| 12:00 | 13:45 | 105 min | Foro Romano y Palatino |  |  |
| 13:45 | 15:45 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:45 | 16:45 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 17:00 | 17:35 | 35 min | Barrio Judío |  |  |
| 17:45 | 18:05 | 20 min | Isla Tiberina |  |  |
| 18:15 | 19:00 | 45 min | Trastevere |  |  |
| | | 61 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Trastevere | Iglesia de Santa Maria in Trastevere, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 3 — viernes 15 de octubre · Roma — día 3

- **Día curado**: D5C · El Aventino, Testaccio, las basílicas y el Coliseo de noche
- **Atardecer**: 18:29

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:15 | 15 min | Boca de la Verdad |  |  |
| 10:30 | 10:55 | 25 min | Jardín de los Naranjos |  |  |
| 11:00 | 11:05 | 5 min | Ojo de la Cerradura del Aventino |  |  |
| 11:15 | 11:35 | 20 min | Pirámide Cestia | por el camino |  |
| 11:45 | 12:20 | 35 min | Testaccio |  |  |
| | | 39 min | 🕐 **Tiempo libre** | antes de comer · Cementerio Protestante | |
| 13:00 | 14:45 | | 🍝 **Comida**: Felice a Testaccio | en Testaccio | |
| 15:15 | 16:00 | 45 min | Basílica de San Clemente |  | 🚇 Metro B, unos 20 min |
| 16:30 | 17:00 | 30 min | Basílica de Santa María la Mayor |  | 🚶 17 min desde Basílica de San Clemente |
| 17:15 | 17:40 | 25 min | Iglesia de San Pietro in Vincoli |  |  |
| 17:45 | 18:20 | 35 min | Monti |  |  |
| 18:30 | 18:40 | 10 min | Via dei Fori Imperiali | 🌅 atardecer 18:29 |  |
| 19:00 | 19:45 | 45 min | 🌙 Coliseo (noche) | paseo nocturno «El Coliseo iluminado», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Monti |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-13"></a>
## Viaje 13 — 4 días · completo · Arte · julio · empieza en domingo

Del domingo 18 de julio al miércoles 21 de julio de 2027.

> **Banner**: ninguno.

### Día 1 — domingo 18 de julio · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco
- **Atardecer**: 20:42

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Fuente de las Tortugas | por el camino |  |
| 16:00 | 16:20 | 20 min | Largo di Torre Argentina | por el camino |  |
| 16:30 | 16:55 | 25 min | Panteón |  |  |
| 17:00 | 17:10 | 10 min | Elefantino de Bernini | por el camino |  |
| 17:15 | 17:35 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:35 | 20 min | Piazza Navona |  |  |
| 18:45 | 18:55 | 10 min | Campo de' Fiori | por el camino |  |
| | | 55 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Iglesia del Gesù, Plaza Farnese, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |

### Día 2 — lunes 19 de julio · Roma — día 2

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer
- **Atardecer**: 20:41

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 15:20 | 5 min | Borgo Pio | por el camino |  |
| 15:30 | 15:50 | 20 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:15 | 16:40 | 25 min | Iglesia de Santa Maria in Trastevere |  | 🚶 22 min desde Puente Sant'Angelo |
| 16:45 | 18:55 | 130 min | Trastevere |  |  |
| 19:15 | 19:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| 20:00 | 20:41 | 41 min | Mirador del Janículo | 🌅 atardecer 20:41 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 22:30 | 23:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 3 — martes 20 de julio · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:40
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — miércoles 21 de julio · Roma — día 4

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese
- **Atardecer**: 20:40

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:25 | 25 min | Fontana de Trevi |  |  |
| 08:30 | 09:25 | 55 min | Desayuno romano |  |  |
| 09:30 | 09:40 | 10 min | Iglesia de San Ignacio de Loyola |  |  |
| 09:45 | 10:05 | 20 min | Plaza Colonna | por el camino |  |
| 10:15 | 10:20 | 5 min | Via Condotti | por el camino |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:55 | 25 min | Santa Maria del Popolo |  |  |
| 12:00 | 12:35 | 35 min | Piazza del Popolo |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:00 | 17:05 | 125 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 17:15 | 19:30 | 135 min | Parque de Villa Borghese |  |  |
| 20:00 | 20:45 | 45 min | Terraza del Pincio | 🌅 atardecer 20:40 |  |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 22:00 | 22:45 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-14"></a>
## Viaje 14 — 4 días · completo · Naturaleza · octubre · empieza en lunes · pool: Galería Borghese, Castillo de Sant'Angelo

Del lunes 11 de octubre al jueves 14 de octubre de 2027.

> **Banner**: ninguno.

### Día 1 — lunes 11 de octubre · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco
- **Atardecer**: 18:36

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Fuente de las Tortugas | por el camino |  |
| 16:00 | 16:20 | 20 min | Largo di Torre Argentina | por el camino |  |
| 16:30 | 16:55 | 25 min | Panteón |  |  |
| 17:00 | 17:10 | 10 min | Elefantino de Bernini | por el camino |  |
| 17:15 | 17:35 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:35 | 20 min | Piazza Navona |  |  |
| 18:45 | 18:55 | 10 min | Campo de' Fiori | por el camino |  |
| | | 55 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Plaza Farnese, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |

### Día 2 — martes 12 de octubre · Roma — día 2

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer
- **Atardecer**: 18:34

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 16:30 | 75 min | Castillo de Sant'Angelo | se ve por fuera: Puente Sant'Angelo |  |
| 17:00 | 17:25 | 25 min | Iglesia de Santa Maria in Trastevere |  | 🚶 24 min desde Castillo de Sant'Angelo |
| 17:30 | 18:10 | 40 min | Trastevere |  |  |
| 18:30 | 18:45 | 15 min | Fontana dell'Acqua Paola |  |  |
| 19:15 | 19:55 | 40 min | Mirador del Janículo | 🌙 Roma iluminada desde el Janículo | 🚶 16 min desde Fontana dell'Acqua Paola |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 3 — miércoles 13 de octubre · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 18:33
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — jueves 14 de octubre · Roma — día 4

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese
- **Atardecer**: 18:31

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:25 | 25 min | Fontana de Trevi |  |  |
| 08:30 | 09:25 | 55 min | Desayuno romano |  |  |
| 09:30 | 09:40 | 10 min | Iglesia de San Ignacio de Loyola |  |  |
| 09:45 | 10:05 | 20 min | Plaza Colonna | por el camino |  |
| 10:15 | 10:20 | 5 min | Via Condotti | por el camino |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:55 | 25 min | Santa Maria del Popolo |  |  |
| 12:00 | 12:35 | 35 min | Piazza del Popolo |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:00 | 17:05 | 125 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 17:15 | 17:40 | 25 min | Parque de Villa Borghese |  |  |
| 18:00 | 18:31 | 31 min | Terraza del Pincio | 🌅 atardecer 18:31 |  |
| | | 76 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Tridente y Spagna | Via del Corso | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 21:30 | 22:15 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-15"></a>
## Viaje 15 — 4 días · completo · Free Tour + Barrios · enero · empieza en miércoles

Del miércoles 13 de enero al sábado 16 de enero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:15 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — miércoles 13 de enero · Roma — día 1

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 17:01

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 08:55 | 25 min | Fontana de Trevi |  |  |
| 09:00 | 09:50 | 50 min | Desayuno romano |  |  |
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 2 — jueves 14 de enero · Roma — día 2

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer · variantes: invierno
- **Atardecer**: 17:03

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 16:05 | 20 min | Fuente de las Tortugas | por el camino |  |
| 16:15 | 16:20 | 5 min | Teatro de Marcelo | por el camino |  |
| 16:30 | 16:55 | 25 min | Isla Tiberina |  |  |
| 17:00 | 17:20 | 20 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 17:30 | 18:25 | 55 min | Trastevere |  |  |
| 18:30 | 18:50 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 19:00 | 19:40 | 40 min | 🌙 Mirador del Janículo (noche) | paseo nocturno «Roma desde arriba», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |

### Día 3 — viernes 15 de enero · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 17:04
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — sábado 16 de enero · Roma — día 4

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese · variantes: invierno, con_free_tour
- **Atardecer**: 17:05

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 09:45 | 45 min | Desayuno romano |  |  |
| 10:30 | 10:50 | 20 min | Iglesia de Santa Maria della Vittoria |  | 🚶 19 min desde Desayuno romano |
| 11:00 | 11:10 | 10 min | Fuente del Tritón | por el camino |  |
| 11:30 | 11:55 | 25 min | Santa Maria del Popolo |  | 🚶 20 min desde Fuente del Tritón |
| 12:00 | 12:35 | 35 min | Piazza del Popolo |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 14:30 | 16:30 | 120 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 17:00 | 17:20 | 20 min | Terraza del Pincio | 🌅 atardecer 17:05 | 🚶 17 min desde Galería Borghese |
| | | 102 min | 🕐 **Tiempo libre**: Paseo por Via del Corso y Via Condotti iluminadas y aperitivo | Ara Pacis, Via del Corso, Plaza Colonna | |
| 18:00 | 18:45 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: Parque de Villa Borghese (No te dio tiempo).
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-16"></a>
## Viaje 16 — 4 días · completo · Free Tour + Arte + Naturaleza · abril · empieza en domingo · pool: Termas de Caracalla, Basílica de San Clemente

Del domingo 18 de abril al miércoles 21 de abril de 2027.

> **Banner**: ninguno.

### Día 1 — domingo 18 de abril · Roma — día 1

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer
- **Atardecer**: 19:54

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 16:05 | 20 min | Teatro de Marcelo | por el camino |  |
| 16:15 | 16:25 | 10 min | Isla Tiberina |  |  |
| 16:30 | 17:05 | 35 min | Basílica de Santa Cecilia in Trastevere |  |  |
| 17:15 | 17:55 | 40 min | Trastevere |  |  |
| 18:00 | 18:20 | 20 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:30 | 18:45 | 15 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 19:15 | 19:55 | 40 min | Mirador del Janículo | 🌅 atardecer 19:54 | 🚶 17 min desde San Pietro in Montorio y Tempietto de Bramante |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 2 — lunes 19 de abril · Roma — día 2

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 19:55

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 08:55 | 25 min | Fontana de Trevi |  |  |
| 09:00 | 09:50 | 50 min | Desayuno romano |  |  |
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 3 — martes 20 de abril · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 19:56
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — miércoles 21 de abril · Roma — día 4

- **Día curado**: D5 · El sur de Roma: el Aventino, Testaccio y la Via Appia · variantes: pool_san_clemente
- **Atardecer**: 19:57

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 09:00 | 10:00 | 60 min | Termas de Caracalla |  |  |
| 10:30 | 10:45 | 15 min | Boca de la Verdad |  | 🚶 21 min desde Termas de Caracalla |
| 11:00 | 11:25 | 25 min | Jardín de los Naranjos |  |  |
| 11:30 | 11:35 | 5 min | Ojo de la Cerradura del Aventino |  |  |
| 11:45 | 12:30 | 45 min | Testaccio |  |  |
| 13:00 | 14:30 | | 🍝 **Comida**: Felice a Testaccio | en Testaccio | |
| 14:30 | 14:40 | 10 min | Pirámide Cestia | por el camino |  |
| 15:00 | 15:45 | 45 min | Basílica de San Clemente |  | 🚇 Metro B, unos 20 min |
| 16:00 | 16:25 | 25 min | Iglesia de San Pietro in Vincoli |  |  |
| 16:30 | 18:35 | 125 min | Monti |  |  |
| 19:15 | 19:57 | 42 min | Plaza del Campidoglio | 🌅 atardecer 19:57 | 🚶 18 min desde Monti |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Monti | 🚶 19 min |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-17"></a>
## Viaje 17 — 4 días · tranquilo · Barrios · julio · empieza en miércoles · pool: Galería Borghese, Castillo de Sant'Angelo

Del miércoles 14 de julio al sábado 17 de julio de 2027.

> **Banner**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas.

### Día 1 — miércoles 14 de julio · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco · variantes: tranquilo
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 11:25 | 85 min | Coliseo |  |  |
| 11:30 | 11:50 | 20 min | Arco de Constantino |  |  |
| 12:00 | 13:45 | 105 min | Foro Romano y Palatino |  |  |
| 13:45 | 15:45 | | 🍝 **Comida**: La Taverna dei Fori Imperiali | en Monti y Fori Imperiali | |
| 15:45 | 15:50 | 5 min | Plaza del Campidoglio | por el camino |  |
| 16:00 | 16:35 | 35 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 17:00 | 17:35 | 35 min | Panteón |  |  |
| 17:45 | 17:55 | 10 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:00 | 18:35 | 35 min | Piazza Navona |  |  |
| 18:45 | 19:10 | 25 min | Campo de' Fiori |  |  |
| 19:15 | 19:25 | 10 min | Plaza Farnese | por el camino |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |

### Día 2 — jueves 15 de julio · Roma — día 2

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer · variantes: tranquilo
- **Atardecer**: 20:44

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 13:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 13:00 | 15:00 | | 🍝 **Comida**: 200 Gradi | en Vaticano y Borgo | |
| 15:00 | 15:25 | 25 min | Plaza de San Pedro |  |  |
| 15:30 | 16:50 | 80 min | Basílica de San Pedro |  |  |
| 17:15 | 18:30 | 75 min | Castillo de Sant'Angelo | se ve por fuera: Puente Sant'Angelo |  |
| 19:00 | 19:45 | 45 min | Trastevere |  | 🚶 25 min desde Castillo de Sant'Angelo |
| 20:15 | 20:55 | 40 min | Mirador del Janículo | 🌅 atardecer 20:44 | 🚶 23 min desde Trastevere |
| 21:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 22:30 | 23:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 3 — viernes 16 de julio · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 20:43
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — sábado 17 de julio · Roma — día 4

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese · variantes: tranquilo
- **Atardecer**: 20:43

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:35 | 35 min | Fontana de Trevi | ℹ️ A esta hora ya hay gente; si puedes, pásate temprano. |  |
| 10:45 | 11:10 | 25 min | Plaza de España |  |  |
| 11:30 | 12:00 | 30 min | Piazza del Popolo |  |  |
| | | 55 min | 🕐 **Tiempo libre** | antes de comer · Via Condotti | |
| 13:00 | 15:00 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 15:00 | 17:05 | 125 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 17:15 | 19:25 | 130 min | Parque de Villa Borghese |  |  |
| 20:00 | 20:43 | 43 min | Terraza del Pincio | 🌅 atardecer 20:43 |  |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |
| 22:00 | 22:45 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-18"></a>
## Viaje 18 — 4 días · tranquilo · Free Tour + Naturaleza · enero · empieza en sábado

Del sábado 16 de enero al martes 19 de enero de 2027.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:15 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — sábado 16 de enero · Roma — día 1

- **Día curado**: D3 · Trevi sin gente, Free Tour y Vaticano por la tarde
- **Atardecer**: 17:05
- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 12:30 | 150 min | Free Tour Centro Histórico | recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |  |
| 13:00 | 14:15 | | 🍝 **Comida**: Supplizio | en Centro Histórico | |
| 14:45 | 17:45 | 180 min | Museos Vaticanos y Capilla Sixtina |  | 🚶 25 min desde la comida |
| 18:00 | 18:25 | 25 min | Plaza de San Pedro |  |  |
| 18:30 | 19:50 | 80 min | Basílica de San Pedro |  |  |
| 20:00 | 20:10 | 10 min | Borgo Pio | por el camino |  |
| 20:30 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Vaticano |  |
| 21:30 | 21:55 | 25 min | 🌙 Puente Sant'Angelo (noche) | paseo nocturno «El Castillo y el Tíber» | |

### Día 2 — domingo 17 de enero · Roma — día 2

- **Día curado**: D1-FT · Roma Antigua, el Ghetto y Trastevere al atardecer · variantes: invierno, tranquilo
- **Atardecer**: 17:06

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 11:25 | 85 min | Coliseo |  |  |
| 11:30 | 11:50 | 20 min | Arco de Constantino |  |  |
| 12:00 | 13:45 | 105 min | Foro Romano y Palatino |  |  |
| 13:45 | 15:45 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:45 | 16:45 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 17:00 | 17:35 | 35 min | Barrio Judío |  |  |
| 17:45 | 18:05 | 20 min | Isla Tiberina |  |  |
| 18:15 | 19:00 | 45 min | Trastevere |  |  |
| | | 61 min | 🕐 **Tiempo libre**: Paseo por Trastevere iluminado y aperitivo | Iglesia de Santa Maria in Trastevere, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Mirador del Janículo (noche) | paseo nocturno «Roma desde arriba» | |

### Día 3 — lunes 18 de enero · Excursión

- **Mañana**: —
- **Tarde**: —
- **Atardecer**: 17:07
- **Excursión de día completo** — preseleccionada: pompeya_sorrento. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — martes 19 de enero · Roma — día 4

- **Día curado**: D4 · Trevi sin gente, el Popolo y la Borghese · variantes: invierno, tranquilo, con_free_tour
- **Atardecer**: 17:08

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:20 | 20 min | Iglesia de Santa Maria della Vittoria |  |  |
| 10:30 | 10:40 | 10 min | Fuente del Tritón | por el camino |  |
| 11:00 | 11:25 | 25 min | Santa Maria del Popolo |  | 🚶 20 min desde Fuente del Tritón |
| 11:30 | 12:05 | 35 min | Piazza del Popolo |  |  |
| 12:15 | 14:15 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 14:15 | 16:20 | 125 min | Galería Borghese |  | 🚶 19 min desde la comida |
| 16:30 | 16:55 | 25 min | Parque de Villa Borghese |  |  |
| 17:15 | 17:35 | 20 min | Terraza del Pincio | 🌅 atardecer 17:08 |  |
| | | 87 min | 🕐 **Tiempo libre**: Paseo por Via del Corso y Via Condotti iluminadas y aperitivo | Ara Pacis, Via del Corso, Plaza Colonna | |
| 18:00 | 18:45 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La escalinata iluminada», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Tridente y Spagna |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-19"></a>
## Viaje 19 — 2 días · completo · sin experiencias · diciembre · empieza en jueves

Del jueves 24 de diciembre al viernes 25 de diciembre de 2026.

> **Banner**: 2 días en Roma en invierno son un reto: los días son cortos y muchos monumentos cierran pronto. Lo hemos organizado para que veas lo máximo posible sin carreras: lo imprescindible primero y los paseos cuando cae la tarde. Si prefieres otro plan, cambia cualquier parada desde los tres puntos.

### Día 1 — jueves 24 de diciembre · Roma — día 1

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer · variantes: invierno
- **Atardecer**: 16:43
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 15:20 | 5 min | Borgo Pio | por el camino |  |
| 15:30 | 15:50 | 20 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 17:10 | 40 min | Mirador del Janículo | 🌅 atardecer 16:43 | 🚶 31 min desde Puente Sant'Angelo |
| 17:30 | 17:40 | 10 min | Fontana dell'Acqua Paola |  | 🚶 16 min desde Mirador del Janículo |
| 17:45 | 18:05 | 20 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 18:15 | 18:25 | 10 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:30 | 19:15 | 45 min | Trastevere |  |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 2 — viernes 25 de diciembre · Roma — día 2

- **Día curado**: D1 · Roma Antigua y el centro barroco · variantes: navidad, navidad_25
- **Atardecer**: 16:44
- 🚌 Altar de la Patria → Bendición Urbi et Orbi: ~35 min andando · o en bus o taxi

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 10:00 | 10:20 | 20 min | Coliseo | por fuera (cerrado hoy) · se ve por fuera: Arco de Constantino · 🔒 El Coliseo está cerrado el 25 de diciembre por Navidad: te lo enseñamos por fuera, merece la pena igual. |  |
| 10:30 | 10:50 | 20 min | Foro Romano y Palatino | por fuera (cerrado hoy) · 🔒 El Foro Romano está cerrado el 25 de diciembre por Navidad: te lo enseñamos por fuera, merece la pena igual. |  |
| 11:00 | 11:10 | 10 min | Altar de la Patria | por fuera (hoy no toca entrar) · se ve por fuera: Plaza Venecia |  |
| 12:00 | 12:45 | 45 min | Bendición Urbi et Orbi |  | 🚶 37 min desde Altar de la Patria |
| 13:00 | 14:30 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 14:30 | 14:55 | 25 min | Piazza Navona |  | 🚶 16 min desde la comida |
| 15:00 | 15:25 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 15:30 | 15:40 | 10 min | Panteón | por fuera (cerrado hoy) · 🔒 El Panteón está cerrado el 25 de diciembre por Navidad: te lo enseñamos por fuera, merece la pena igual. |  |
| 15:45 | 15:55 | 10 min | Elefantino de Bernini | por el camino |  |
| 16:00 | 16:25 | 25 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 16:30 | 16:35 | 5 min | Largo di Torre Argentina | por el camino |  |
| 16:45 | 17:25 | 40 min | Barrio Judío |  |  |
| 17:30 | 17:40 | 10 min | Fuente de las Tortugas | por el camino |  |
| | | 65 min | 🕐 **Tiempo libre**: Paseo por Piazza Navona y el Panteón iluminados y aperitivo | Campo de' Fiori, Iglesia del Gesù, Plaza del Campidoglio | |
| 18:00 | 18:45 | 45 min | 🌙 Plaza de España (noche) | paseo nocturno «La Roma de las fuentes», antes de cenar | |
| 19:00 | 19:25 | 25 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes», antes de cenar | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno. Solo de noche: Fontana de Trevi, Plaza de España.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-20"></a>
## Viaje 20 — 3 días · completo · sin experiencias · diciembre · empieza en jueves

Del jueves 31 de diciembre al sábado 2 de enero de 2026.

> **Banner**: En invierno Roma madruga y cierra pronto: anochece antes de las 17:00 y lugares como el Coliseo cierran a las 16:30. Hemos ajustado tu ruta para que aproveches cada hora de luz y no te pierdas nada importante: lo mejor va primero. ¿Te apetece otro plan? Cambia cualquier parada desde los tres puntos.

### Día 1 — jueves 31 de diciembre · Roma — día 1

- **Día curado**: D1 · Roma Antigua y el centro barroco
- **Atardecer**: 16:48

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Fuente de las Tortugas | por el camino |  |
| 16:00 | 16:20 | 20 min | Largo di Torre Argentina | por el camino |  |
| 16:30 | 16:55 | 25 min | Panteón |  |  |
| 17:00 | 17:10 | 10 min | Elefantino de Bernini | por el camino |  |
| 17:15 | 17:35 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:35 | 20 min | Piazza Navona |  |  |
| 18:45 | 18:55 | 10 min | Campo de' Fiori | por el camino |  |
| | | 55 min | 🕐 **Tiempo libre**: Paseo por Piazza Navona y el Panteón iluminados y aperitivo | Plaza Farnese, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |
| 22:30 | 22:55 | 25 min | 🌙 Plaza de España (noche) | paseo nocturno «La Roma de las fuentes» | |

### Día 2 — viernes 1 de enero · Roma — día 2

- **Día curado**: D4M · Trevi sin gente, el Pincio y la tarde en Monti
- **Atardecer**: 16:49

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:25 | 25 min | Fontana de Trevi |  |  |
| 08:30 | 09:25 | 55 min | Desayuno romano |  |  |
| 09:30 | 09:40 | 10 min | Iglesia de San Ignacio de Loyola |  |  |
| 09:45 | 10:05 | 20 min | Plaza Colonna | por el camino |  |
| 10:15 | 10:20 | 5 min | Via Condotti | por el camino |  |
| 10:30 | 11:00 | 30 min | Plaza de España |  |  |
| 11:30 | 11:55 | 25 min | Santa Maria del Popolo |  |  |
| 12:00 | 12:35 | 35 min | Piazza del Popolo |  |  |
| 12:45 | 13:05 | 20 min | Terraza del Pincio |  |  |
| 13:15 | 14:45 | | 🍝 **Comida**: Edy | en Tridente y Spagna | |
| 14:45 | 16:15 | 90 min | Parque de Villa Borghese |  |  |
| 16:45 | 17:05 | 20 min | Iglesia de Santa Maria della Vittoria |  | 🚶 20 min desde Parque de Villa Borghese |
| 17:30 | 18:00 | 30 min | Basílica de Santa María la Mayor |  |  |
| 18:15 | 18:25 | 10 min | Iglesia de San Pietro in Vincoli | por fuera (a esta hora ya ha cerrado) |  |
| 18:30 | 19:05 | 35 min | Monti |  |  |
| 19:15 | 19:25 | 10 min | Via dei Fori Imperiali | 🌙 Roma iluminada desde los Foros |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Monti |  |
| 21:30 | 22:15 | 45 min | 🌙 Coliseo (noche) | paseo nocturno «El Coliseo iluminado» | |

### Día 3 — sábado 2 de enero · Roma — día 3

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer · variantes: invierno
- **Atardecer**: 16:50
- 🚌 Puente Sant'Angelo → Mirador del Janículo: ~30 min andando (con cuesta) · o el bus 115 si prefieres no subirla

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 11:00 | 180 min | Museos Vaticanos y Capilla Sixtina |  |  |
| 11:15 | 11:40 | 25 min | Plaza de San Pedro |  |  |
| 11:45 | 13:00 | 75 min | Basílica de San Pedro |  |  |
| 13:00 | 13:35 | 35 min | Cúpula de San Pedro |  |  |
| 13:45 | 15:15 | | 🍝 **Comida**: Borghiciana Pastificio Artigianale | en Vaticano y Borgo | |
| 15:15 | 15:20 | 5 min | Borgo Pio | por el camino |  |
| 15:30 | 15:50 | 20 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 16:30 | 17:10 | 40 min | Mirador del Janículo | 🌅 atardecer 16:50 | 🚶 31 min desde Puente Sant'Angelo |
| 17:30 | 17:40 | 10 min | Fontana dell'Acqua Paola |  | 🚶 16 min desde Mirador del Janículo |
| 17:45 | 18:05 | 20 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 18:15 | 18:25 | 10 min | Iglesia de Santa Maria in Trastevere |  |  |
| 18:30 | 19:15 | 45 min | Trastevere |  |  |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere |  |
| 21:30 | 22:10 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

#### Lo que quedó fuera

- **No te dio tiempo**: nada.
- **Imprescindibles que no salen**: ninguno.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

<a id="viaje-21"></a>
## Viaje 21 — 2 días · completo · sin experiencias · mayo · empieza en sábado

Del sábado 1 de mayo al domingo 2 de mayo de 2027.

> **Banner**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

### Día 1 — sábado 1 de mayo · Roma — día 1

- **Día curado**: D2 · Vaticano, Castillo y Trastevere al atardecer · variantes: museos_cerrados
- **Atardecer**: 20:08

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:00 | 08:25 | 25 min | Plaza de San Pedro | 🔒 Los Museos Vaticanos y Capilla Sixtina están cerrados el 1 de mayo (Día del Trabajo). Hoy ves la Plaza de San Pedro y la Basílica de San Pedro, que sí abren. |  |
| 08:30 | 09:45 | 75 min | Basílica de San Pedro |  |  |
| 09:45 | 10:20 | 35 min | Cúpula de San Pedro |  |  |
| 11:00 | 11:15 | 15 min | Puente Sant'Angelo | se ve por fuera: Castillo de Sant'Angelo |  |
| 12:00 | 12:20 | 20 min | Iglesia de Santa Maria in Trastevere |  | 🚶 22 min desde Puente Sant'Angelo |
| | | 40 min | 🕐 **Tiempo libre** | antes de comer · Plaza Trilussa | |
| 13:00 | 14:30 | | 🍝 **Comida**: Tonnarello | en Trastevere | |
| 14:30 | 17:50 | 200 min | Trastevere |  |  |
| 18:00 | 18:10 | 10 min | San Pietro in Montorio y Tempietto de Bramante | por fuera (a esta hora ya ha cerrado) |  |
| 18:15 | 18:30 | 15 min | Fontana dell'Acqua Paola |  |  |
| | | 44 min | 🕐 **Tiempo libre** | antes de Mirador del Janículo · Pasear por Trastevere: piérdete por las callejuelas empedradas de Trastevere. | |
| 19:30 | 20:13 | 43 min | Mirador del Janículo | 🌅 atardecer 20:08 | 🚶 16 min desde Fontana dell'Acqua Paola |
| 21:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Trastevere | 🚶 21 min |
| 22:00 | 22:40 | 40 min | 🌙 Trastevere de noche | paseo nocturno «Trastevere de noche» | |

### Día 2 — domingo 2 de mayo · Roma — día 2

- **Día curado**: D1 · Roma Antigua y el centro barroco
- **Atardecer**: 20:09

| Llega | Sale | Dura | Parada | Nota | Traslado desde lo anterior |
|---|---|---|---|---|---|
| 08:30 | 09:55 | 85 min | Coliseo |  |  |
| 10:00 | 10:20 | 20 min | Arco de Constantino |  |  |
| 10:30 | 12:15 | 105 min | Foro Romano y Palatino |  |  |
| 12:30 | 12:50 | 20 min | Plaza del Campidoglio |  |  |
| 13:00 | 14:00 | 60 min | Altar de la Patria | se ve por fuera: Plaza Venecia |  |
| 14:00 | 15:15 | | 🍝 **Comida**: Giggetto al Portico d'Ottavia | en Barrio Judío | |
| 15:15 | 15:40 | 25 min | Barrio Judío |  |  |
| 15:45 | 15:55 | 10 min | Fuente de las Tortugas | por el camino |  |
| 16:00 | 16:20 | 20 min | Largo di Torre Argentina | por el camino |  |
| 16:30 | 16:55 | 25 min | Panteón |  |  |
| 17:00 | 17:10 | 10 min | Elefantino de Bernini | por el camino |  |
| 17:15 | 17:35 | 20 min | Iglesia de Santa Maria sopra Minerva |  |  |
| 17:45 | 18:10 | 25 min | Iglesia de San Luigi dei Francesi |  |  |
| 18:15 | 18:35 | 20 min | Piazza Navona |  |  |
| 18:45 | 18:55 | 10 min | Campo de' Fiori | por el camino |  |
| | | 55 min | 🕐 **Tiempo libre**: Aperitivo y paseo por Centro Histórico | Iglesia del Gesù, Plaza Farnese, Plaza Trilussa | |
| 20:00 | | | 🍷 **Cena**: sin restaurante elegido (el motor elige el barrio) | en Centro Histórico |  |
| 21:30 | 22:15 | 45 min | 🌙 Fontana de Trevi (noche) | paseo nocturno «La Roma de las fuentes» | |
| 22:30 | 22:55 | 25 min | 🌙 Plaza de España (noche) | paseo nocturno «La Roma de las fuentes» | |

#### Lo que quedó fuera

- **No te dio tiempo**: Museos Vaticanos y Capilla Sixtina (Cierra todos los días de tu viaje).
- **Imprescindibles que no salen**: ninguno. Solo de noche: Fontana de Trevi, Plaza de España. Cerrados todo el viaje: Museos Vaticanos y Capilla Sixtina.

- **Lo mejor primero** (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día): 🟢 sí.

## Resumen por viaje

Paradas por día (sin lo de paso ni las nocturnas; "exc." es el día de excursión), madrugones, comidas acortadas, huecos de más de 30 min sin nombre, lugares que salen más de 2 veces en el viaje (visita, de paso o de noche), día y noche el mismo día (en 3+ días también de paso), lo del pool que falta o va solo de paso e imprescindibles que no salen.

| Viaje | Tipo | Paradas por día | Madrugones | Comidas cortas | Huecos sin nombre | Más de 2 veces | Día y noche | Pool | Imprescindibles que faltan | Libre de más de 90 min (completo) |
|---|---|---|---|---|---|---|---|---|---|---|
| [1](#viaje-1) | 2 · completo | 10 · 9 | 0 | 0 | 0 | — | — | — | — | 0 |
| [2](#viaje-2) | 2 · completo | 8 · 9 | 0 | 0 | 0 | — | — | ok | — | 0 |
| [3](#viaje-3) | 2 · completo · FT | 6 · 11 | 0 | 0 | 0 | — | — | — | — | 0 |
| [4](#viaje-4) | 2 · completo · FT | 9 · 6 | 0 | 0 | 0 | — | — | Basílica de San Clemente falta | — | 0 |
| [5](#viaje-5) | 2 · tranquilo | 7 · 7 | 0 | 1 | 0 | — | — | ok | — | 0 |
| [6](#viaje-6) | 2 · tranquilo · FT | 4 · 7 | 0 | 1 | 0 | — | — | — | — | 0 |
| [7](#viaje-7) | 3 · completo | 10 · 9 · 9 | 0 | 0 | 0 | — | — | — | — | 0 |
| [8](#viaje-8) | 3 · completo | 10 · 10 · 9 | 0 | 0 | 0 | — | — | ok | — | 0 |
| [9](#viaje-9) | 3 · completo · FT | 6 · 10 · 11 | 0 | 0 | 0 | — | — | — | — | 0 |
| [10](#viaje-10) | 3 · completo · FT | 10 · 6 · 10 | 0 | 0 | 0 | — | — | ok | — | 0 |
| [11](#viaje-11) | 3 · tranquilo | 5 · 7 · 8 | 0 | 0 | 0 | — | — | ok | — | 0 |
| [12](#viaje-12) | 3 · tranquilo · FT | 4 · 7 · 9 | 0 | 1 | 0 | — | — | — | — | 0 |
| [13](#viaje-13) | 4 · completo | 10 · 9 · exc. · 9 | 0 | 0 | 0 | — | — | — | — | 0 |
| [14](#viaje-14) | 4 · completo | 10 · 9 · exc. · 9 | 0 | 0 | 0 | — | — | ok | — | 0 |
| [15](#viaje-15) | 4 · completo · FT | 6 · 10 · exc. · 6 | 0 | 0 | 0 | — | — | — | — | 0 |
| [16](#viaje-16) | 4 · completo · FT | 11 · 6 · exc. · 9 | 0 | 0 | 0 | — | — | ok | — | 0 |
| [17](#viaje-17) | 4 · tranquilo | 8 · 6 · exc. · 6 | 0 | 0 | 0 | — | — | ok | — | 0 |
| [18](#viaje-18) | 4 · tranquilo · FT | 4 · 7 · exc. · 6 | 0 | 1 | 0 | — | — | — | — | 0 |
| [19](#viaje-19) | 2 · completo | 9 · 5 | 0 | 0 | 0 | — | — | — | — | 0 |
| [20](#viaje-20) | 3 · completo | 10 · 12 · 9 | 0 | 0 | 0 | — | — | — | — | 0 |
| [21](#viaje-21) | 2 · completo | 8 · 10 | 0 | 0 | 0 | — | — | — | — | 0 |

## Lo que parece raro (para decidir; no se ha arreglado nada)

Sacado de las rutas de arriba con estos criterios: traslados de más de 25 min sin su aviso (con aviso no son un fallo), ritmo tranquilo antes de las 10:00 sin aviso o por algo que no es nivel 1, lo mejor primero (las 4 joyas dentro del viaje en 2 días; en 3+, como muy tarde el día 3 y ninguna solo el último día), horarios que no dan, huecos de más de 30 min sin "Tiempo libre", días flojos (menos de 4 paradas en completo o 3 en tranquilo, sin el último día), días que acaban antes de las 17:00, tardes libres, avisos del día, un lugar de día y de noche el mismo día (en 3+ días, también de paso), lugares que salen más de 2 veces, lo del pool que falta o va de paso, lugares repetidos, imprescindibles que no salen y rutas iguales.

### Patrones que se repiten

- **Plaza de España: de día y de noche el mismo día, excepción aprobada del día curado** — 8 veces: viaje 7 día 3; viaje 8 día 3; viaje 11 día 2; viaje 13 día 4; viaje 14 día 4; viaje 15 día 4; viaje 17 día 4; viaje 18 día 4.
- **Imprescindible cerrado ese día (se enseña por fuera o se avisa)** — 4 veces: viaje 19 día 2 (Coliseo); viaje 19 día 2 (Foro Romano y Palatino); viaje 19 día 2 (Panteón); viaje 21 día 1 (Plaza de San Pedro).

### Caso a caso

- **Viaje 4** (2 d, completo, octubre): pool: Basílica de San Clemente falta.
- **Viaje 5, día 2** (2 d, tranquilo, enero): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver la Galería Borghese".
- **Viaje 6, día 1** (2 d, tranquilo, julio): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro".
- **Viaje 10, día 3** (3 d, completo, enero): Plaza del Campidoglio se repite (ya se visitó el día 1).
- **Viaje 10, día 3** (3 d, completo, enero): Altar de la Patria se repite (ya se visitó el día 1).
- **Viaje 12, día 1** (3 d, tranquilo, octubre): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro".
- **Viaje 15, día 4** (4 d, completo, enero): Desayuno romano se repite (ya se visitó el día 1).
- **Viaje 15, día 4** (4 d, completo, enero): 🟡 paseo iluminado y aperitivo de invierno de 102 min (hasta 2 h está permitido).
- **Viaje 16, día 4** (4 d, completo, abril): Plaza del Campidoglio se repite (ya se visitó el día 1).
- **Viaje 18, día 1** (4 d, tranquilo, enero): aviso del día: "Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro".

