# Reservas dentro de la ruta · 2 · Medir si cabe

Medido el 2-oct-2026 con `scripts/destino/medirReservas.mjs` (solo mide: no cambia nada de la app). 1095 viajes de 3, 4, 5 días (salida cada día de 2027: 365 fechas), 233974 reservas simuladas, 157 s.

## 🟢 Fallos de la propuesta (ninguna hora fija rota, nada cerrado, nada quitado sin aviso, atardecer y cena intactos): **0**

Cada caso resuelto se comprobó después con una revisión aparte (hora de la reserva, aperturas y última entrada, cena y nocturnas en su hora, 30 min de margen, ningún imprescindible quitado). Se resolvieron 122444 casos que caben y ninguno falló la revisión.

## 🔴 Lo que el motor de hoy ya hace mal (sin ninguna reserva)

- 🔴 **Visita por dentro de un sitio cerrado ese día**: 14 días. Ej.: 2027-01-01 (viernes): Cementerio Protestante a las 11:00 · 2027-01-01 (viernes): Cementerio Protestante a las 11:00 · 2027-01-06 (miércoles): Cementerio Protestante a las 11:00 · 2027-01-06 (miércoles): Cementerio Protestante a las 11:00 · 2027-12-08 (miércoles): Cementerio Protestante a las 11:00 · 2027-12-08 (miércoles): Cementerio Protestante a las 11:00
- 🔴 **Panteón por dentro en la misa de sábado o víspera de festivo**: 9 días. Ej.: 2027-01-05 (martes): 16:25-16:55 · 2027-01-05 (martes): 16:25-16:55 · 2027-01-05 (martes): 16:25-16:55 · 2027-06-01 (martes): 17:05-17:35 · 2027-06-01 (martes): 17:05-17:35 · 2027-06-01 (martes): 17:05-17:35

Misas del Panteón: el motor ya respeta los dos horarios de misa que traen los datos (sábado hasta las 16:00 y domingo de 09:00 a 09:30 y desde las 11:45). Lo que **no** cubre: las vísperas de festivo y los festivos entre semana (misa a las 17:00 y a las 10:30 respectivamente según la web), porque los datos solo conocen sábado y domingo. Los sábados y los domingos, el motor lo hace bien (ningún caso). Las vísperas y los festivos entre semana, no: salen arriba, con su fecha.

Fidelidad del modelo: de 4380 días que monta el motor, 4294 (98 %) caben tal cual en la simulación. El resto: ancla 86.

## Lo esencial, en pocas palabras

- **Coliseo (Coliseo, Foro y Palatino)**: con la reserva el mismo día que ya está la parada, cabe en 93.3 % de los casos (11.4 % sin tocar nada, 33.1 % encogiendo o quitando algo, 48.8 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 54.4 %.
- **Museos Vaticanos**: con la reserva el mismo día que ya está la parada, cabe en 52.1 % de los casos (12.3 % sin tocar nada, 24 % encogiendo o quitando algo, 15.8 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 37.1 %.
- **Panteón**: con la reserva el mismo día que ya está la parada, cabe en 100 % de los casos (5.6 % sin tocar nada, 44.8 % encogiendo o quitando algo, 49.5 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 62.5 %.
- **Galería Borghese**: con la reserva el mismo día que ya está la parada, cabe en 64.8 % de los casos (7.4 % sin tocar nada, 11.7 % encogiendo o quitando algo, 45.7 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 46.7 %.
- **Free Tour**: con la reserva el mismo día que ya está la parada, cabe en 12.5 % de los casos (0 % sin tocar nada, 5.1 % encogiendo o quitando algo, 7.4 % cambiando el orden). Con la reserva en otro día del viaje, cabe en —.
- **Vuelos**, % que no cabe — llegada: 9:00 → 5.8 %, 12:00 → 90.4 %, 15:00 → 100 %, 18:00 → 100 %, 21:00 → 100 %. Salida: 9:00 → 100 %, 12:00 → 100 %, 15:00 → 100 %, 18:00 → 98.3 %, 21:00 → 2.8 %.
- **Horas redondas**: de 5 en 5 hacia arriba pierde de media 4.3 min al día (y 154 días dejan de caber de 3514); tu lista :00/:15/:20/:30/:40/:45 pierde 37.2 min y 77.1 % de los días dejan de caber; los cuartos de hora «donde sobra» cuestan 23.2 min y no rompen nada.

## Las horas de entrada y de dónde salen (comprobadas el 2-oct-2026)

| Sitio | Franjas que se miden | Fuente |
|---|---|---|
| Museos Vaticanos | cada 30 min, de 08:00 a 17:30 | tickets.museivaticani.va (10-nov-2026 y 1-dic-2026; 13-oct-2026 sin entradas a la venta; 13-jul-2027 y 9-mar-2027 todavía no se venden: la temporada alta no se puede mirar) |
| Panteón | cada hora, de 09:00 a 17:00 | direzionemuseiroma.cultura.gov.it/en/pantheon (cierra por misa: sábado/vísperas 17:00, domingo/festivos 10:30; venta cortada una hora antes) |
| Galería Borghese | a las horas en punto (9–17) y a las 17:45 (1 h 15) | galleriaborghese.cultura.gov.it/en/visita (martes a domingo; cierra 25 dic y 1 ene) |
| Free Tour | 10:00 y 17:00 | civitatis.com/es/roma/free-tour-roma (nuestros datos decían 16:00: sin comprobar; la web dice 17:00) |
| Coliseo | **malla supuesta**: cada 30 min de 08:30 a la última entrada | colosseo.it no publica las franjas y el vendedor (ticketing.colosseo.it) pide pasar un control de navegador: no lo he saltado. Si el Coliseo vende cada hora o cada 15 min, cambian los números de ese sitio |

Nuestros datos, además, dicen en unas notas que la Galería tiene turnos «cada 2 h» y en la ficha «cada hora»: la web oficial dice cada hora. Y a `turnos` de la Galería le falta el de las 17:45.

## Cómo se midió (reglas de la simulación)

- Cada día es el que monta hoy el motor (v4, días escritos). Una reserva a la hora T fija ese sitio a T; la parada anterior tiene que acabar, con el paseo, 30 min antes.
- Lo único que se toca, por este orden: **1** nada (solo cambian las horas) → **2** encoger paseos (a 10 min) → quitar opcionales → quitar paseos y paradas de paso → quitar «si entra» (el Campidoglio) → versión corta de un imprescindible que no es joya (de paso y por fuera, sus minutos curados) → **3** cambiar el orden del grupo (las dos maneras de la propuesta) o poner el grupo entre otras paradas → **4** si la reserva es de otro día, el grupo pasa a ese día y ese día ocupa su hueco (los dos tienen que abrir en su nueva fecha).
- Del resultado se quita todo lo que sobra: se muestra lo mínimo que hizo falta.
- **Niveles**: joyas e imprescindibles, como en los datos (más el Castillo y Trastevere, que la propuesta sube a imprescindibles, y el Campidoglio como «si entra»). Opcional = marcado `is_optional`; paseo = «Pasea y piérdete…»; «de paso» = paradas de 10 min sin visita. **Las demás paradas con nombre (Barrio Judío, Torre Argentina, Puente Sant'Angelo…) la propuesta no las clasifica**: en la medida principal NO se pueden quitar. La última columna («aun quitando lo sin clasificar») dice cuántos casos se salvarían si también se pudieran quitar.
- Anclas que no se mueven: el mirador del atardecer (con su holgura de ±10 min), las nocturnas y la cena. La comida (60 min) se pone entre las 12:15 y las 15:30.
- **El día de la excursión** (los viajes de 5 días llevan uno) no se cambia por otro: si la reserva cae ahí, no cabe. Los días de llegada y de vuelta de esta medida son días enteros (los vuelos se miden aparte, y una reserva y un vuelo a la vez no se miden juntos). Nochebuena y Navidad entran por los cierres de cada sitio; sus avisos no se modelan.
- Las visitas por dentro tienen que caber en el horario del sitio de esa fecha y entrar antes de la última entrada. Los días empiezan a las 8:30 salvo que una reserva más temprana lo adelante.
- Los datos de las paradas, los horarios de cada fecha y los paseos entre paradas son los del motor (`travelTimesFor`); donde el motor ya contaba un trayecto más corto (metro, taxi), la simulación lo respeta.

## 2. Por sitio: cada hora de entrada y el % de casos en cada resultado

Se simulan los viajes de 3, 4 y 5 días de todo el año, cada franja, **el día donde ya está la parada («mismo día») y cada otro día del viaje («otro día»)**. «Otro día»: el grupo pasa entero a ese día (o no cabe).

### Coliseo (Coliseo, Foro y Palatino)

Franjas: malla supuesta cada 30 min (la web no publica las franjas).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:30 | 4368 | 100 % | 0 % | 0 % | 0 % | 61.7 % | 38.3 % | 28.7 % |
| 09:00 | 4368 | 66.1 % | 33.9 % | 0 % | 0 % | 51 % | 49 % | 28.7 % |
| 09:30 | 4368 | 18.1 % | 81.9 % | 0 % | 0 % | 51 % | 49 % | 28.7 % |
| 10:00 | 4368 | 16.5 % | 83.5 % | 0 % | 0 % | 51 % | 49 % | 28.7 % |
| 10:30 | 4368 | 2.6 % | 97.4 % | 0 % | 0 % | 51 % | 49 % | 28.7 % |
| 11:00 | 4368 | 0 % | 98.9 % | 1.1 % | 0 % | 51 % | 49 % | 28.7 % |
| 11:30 | 4368 | 0 % | 98.4 % | 1.6 % | 0 % | 61.7 % | 38.3 % | 28.7 % |
| 12:00 | 4368 | 0 % | 46.8 % | 53.2 % | 0 % | 61.7 % | 38.3 % | 28.7 % |
| 12:30 | 4368 | 0 % | 19.2 % | 80.8 % | 0 % | 61.7 % | 38.3 % | 28.7 % |
| 13:00 | 4368 | 0 % | 6.3 % | 93.4 % | 0.3 % | 61.5 % | 38.5 % | 28.9 % |
| 13:30 | 4356 | 0 % | 19.4 % | 80.6 % | 0 % | 61.7 % | 38.3 % | 28.7 % |
| 14:00 | 4356 | 0 % | 7.2 % | 92.8 % | 0 % | 61.7 % | 38.3 % | 28.7 % |
| 14:30 | 4356 | 0 % | 0 % | 100 % | 0 % | 61.7 % | 38.3 % | 28.7 % |
| 15:00 | 4356 | 0 % | 0 % | 99.8 % | 0.2 % | 61.7 % | 38.3 % | 28.7 % |
| 15:30 | 4356 | 0 % | 0 % | 64.4 % | 35.6 % | 38.1 % | 61.9 % | 54.5 % |
| 16:00 | 2844 | 0 % | 0 % | 90.9 % | 9.1 % | 55.3 % | 44.7 % | 34.7 % |
| 16:30 | 2664 | 0 % | 0 % | 93.1 % | 6.9 % | 55.7 % | 44.3 % | 33.8 % |
| 17:00 | 2520 | 0 % | 0 % | 90.8 % | 9.2 % | 54.3 % | 45.7 % | 36.6 % |
| 17:30 | 2520 | 0 % | 0 % | 70.5 % | 29.5 % | 42.6 % | 57.4 % | 50.4 % |
| 18:00 | 2232 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 78240 | 11.4 % | 33.1 % | 48.8 % | 6.7 % | 54.4 % | 45.6 % |  |

### Museos Vaticanos

Franjas: cada 30 min de 08:00 a 17:30 (web de venta oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:00 | 3609 | 99.4 % | 0 % | 0.6 % | 0 % | 72.5 % | 27.5 % | 19.2 % |
| 08:30 | 3609 | 89.5 % | 9.9 % | 0.6 % | 0 % | 72.5 % | 27.5 % | 19.2 % |
| 09:00 | 3729 | 38 % | 61.3 % | 0.6 % | 0 % | 72.2 % | 27.8 % | 19.6 % |
| 09:30 | 3729 | 16.2 % | 83.2 % | 0.6 % | 0 % | 72.2 % | 27.8 % | 19.6 % |
| 10:00 | 3729 | 2.3 % | 97.7 % | 0 % | 0 % | 72.2 % | 27.8 % | 19.6 % |
| 10:30 | 3729 | 0 % | 71.5 % | 28.5 % | 0 % | 72.2 % | 27.8 % | 19.6 % |
| 11:00 | 3729 | 0 % | 69 % | 31 % | 0 % | 72.2 % | 27.8 % | 19.6 % |
| 11:30 | 3729 | 0 % | 47.3 % | 23.7 % | 29.1 % | 46.1 % | 53.9 % | 42.8 % |
| 12:00 | 3729 | 0 % | 32 % | 22.2 % | 45.8 % | 35.1 % | 64.9 % | 46.6 % |
| 12:30 | 3729 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:00 | 3609 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:30 | 3585 | 0 % | 2.4 % | 0 % | 97.6 % | 2.5 % | 97.5 % | 59.1 % |
| 14:00 | 3585 | 0 % | 2.3 % | 50.4 % | 47.3 % | 35.4 % | 64.6 % | 58.2 % |
| 14:30 | 3585 | 0 % | 0 % | 46.6 % | 53.4 % | 31.4 % | 68.6 % | 63.7 % |
| 15:00 | 3585 | 0 % | 0 % | 44.6 % | 55.4 % | 29.6 % | 70.4 % | 65.9 % |
| 15:30 | 3585 | 0 % | 0 % | 38.1 % | 61.9 % | 25.7 % | 74.3 % | 70.6 % |
| 16:00 | 3585 | 0 % | 0 % | 24.8 % | 75.2 % | 17.9 % | 82.1 % | 80 % |
| 16:30 | 3585 | 0 % | 0 % | 2.3 % | 97.7 % | 2.5 % | 97.5 % | 93.5 % |
| 17:00 | 3585 | 0 % | 0 % | 2.3 % | 97.7 % | 2.5 % | 97.5 % | 97.5 % |
| 17:30 | 3585 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 72924 | 12.3 % | 24 % | 15.8 % | 47.9 % | 37.1 % | 62.9 % |  |

### Panteón

Franjas: cada hora de 09:00 a 17:00 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 4356 | 0 % | 0 % | 100 % | 0 % | 62 % | 38 % | 28.5 % |
| 10:00 | 3741 | 0 % | 0 % | 100 % | 0 % | 66.7 % | 33.3 % | 24.5 % |
| 11:00 | 3741 | 0 % | 0 % | 100 % | 0 % | 66.7 % | 33.3 % | 24.5 % |
| 12:00 | 4356 | 0 % | 16.5 % | 83.5 % | 0 % | 62 % | 38 % | 28.5 % |
| 13:00 | 4356 | 16.5 % | 83.5 % | 0 % | 0 % | 62 % | 38 % | 28.5 % |
| 14:00 | 4356 | 17 % | 83 % | 0 % | 0 % | 62 % | 38 % | 28.5 % |
| 15:00 | 4356 | 16 % | 84 % | 0 % | 0 % | 62 % | 38 % | 28.5 % |
| 16:00 | 3750 | 0 % | 100 % | 0 % | 0 % | 59.8 % | 40.2 % | 28.6 % |
| 17:00 | 3738 | 0 % | 28.2 % | 71.8 % | 0 % | 59.7 % | 40.3 % | 28.7 % |
| **Todas** | 36750 | 5.6 % | 44.8 % | 49.5 % | 0 % | 62.5 % | 37.5 % |  |

### Galería Borghese

Franjas: turnos a las horas en punto y 17:45 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 2777 | 0 % | 0 % | 100 % | 0 % | 70.2 % | 29.8 % | 21.8 % |
| 10:00 | 2777 | 0 % | 0 % | 100 % | 0 % | 70.2 % | 29.8 % | 21.8 % |
| 11:00 | 2777 | 0 % | 100 % | 0 % | 0 % | 69.5 % | 30.5 % | 21.8 % |
| 12:00 | 2777 | 39.8 % | 0 % | 48.1 % | 12 % | 58.2 % | 41.8 % | 21.8 % |
| 13:00 | 2777 | 17.2 % | 0 % | 53.9 % | 28.9 % | 49.9 % | 50.1 % | 28.9 % |
| 14:00 | 2777 | 17.2 % | 0 % | 54.8 % | 28.1 % | 50.3 % | 49.7 % | 21.8 % |
| 15:00 | 2777 | 0 % | 17.2 % | 24.6 % | 58.2 % | 34 % | 66 % | 42.4 % |
| 16:00 | 2777 | 0 % | 0 % | 30.2 % | 69.8 % | 26.1 % | 73.9 % | 56.5 % |
| 17:00 | 2777 | 0 % | 0 % | 22.7 % | 77.3 % | 19.2 % | 80.8 % | 67.3 % |
| 17:45 | 2777 | 0 % | 0 % | 22.7 % | 77.3 % | 19.2 % | 80.8 % | 58.3 % |
| **Todas** | 27770 | 7.4 % | 11.7 % | 45.7 % | 35.2 % | 46.7 % | 53.3 % |  |

### Free Tour (como una reserva más)

Franjas: salidas a las 10:00 y a las 17:00; el tour cubre Plaza de España, Via Condotti, Trevi, San Ignacio y Navona (esas visitas sueltas desaparecen del día porque ya se ven con el tour).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10:00 | 4380 | 0 % | 1.5 % | 4.3 % | 94.2 % | — | — | 24.1 % |
| 17:00 | 4380 | 0 % | 8.7 % | 10.5 % | 80.8 % | — | — | 66.4 % |
| **Todas** | 8760 | 0 % | 5.1 % | 7.4 % | 87.5 % | — | — |  |

Fuera de ruta: reservas de un sitio que el viaje no lleva (no se miden: la propuesta no dice qué pasa): Galería Borghese 9530. Días con el sitio cerrado (no hay franja que reservar): 1337.

### Por día de la semana de la reserva (% de «no cabe» sobre todas las franjas de ese día)

| Sitio | lun | mar | mié | jue | vie | sáb | dom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 30.5 % | 51.3 % | 31.2 % | 16.4 % | 16.9 % | 48.3 % | 56.5 % |
| Museos Vaticanos | 90.6 % | 52.6 % | 51.7 % | 52.2 % | 51.4 % | 52.7 % | 58.3 % |
| Panteón | 25.7 % | 46.1 % | 26.3 % | 10.7 % | 11.2 % | 27.3 % | 52.4 % |
| Galería Borghese | cerrado | 53.8 % | 43.9 % | 39.9 % | 42 % | 64.1 % | 48.2 % |

De los 122444 casos que caben: 2917 obligan a empezar antes de las 8:30 (por una reserva temprana), 12826 dejan un hueco de más de 90 min entre dos paradas (la reserva está lejos de lo demás) y 63803 necesitan dejar un imprescindible en su versión corta.

## 3. Vuelos: llegada y salida como horas fijas

Llegada: se está en el centro 60 min después de aterrizar (Fiumicino, `_llegada.json`); el primer día empieza entonces. Salida: hay que dejar la ciudad 180 min antes del vuelo; el último día acaba entonces. Mismo orden de cosas que arriba; si no cabe, el día entero se cambia con otro del viaje.

|  | Hora | Casos | sin tocar | encoge o quita | cambia el día | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| llegada | 9:00 | 1095 | 14.2 % | 79.9 % | 0 % | 5.8 % | 0 % |
| llegada | 12:00 | 1095 | 0 % | 5.6 % | 4 % | 90.4 % | 2.2 % |
| llegada | 15:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 13.6 % |
| llegada | 18:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 60.9 % |
| llegada | 21:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 9:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 12:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 34.4 % |
| salida | 15:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 5.2 % |
| salida | 18:00 | 1095 | 0 % | 1.7 % | 0 % | 98.3 % | 0 % |
| salida | 21:00 | 1095 | 0 % | 81.5 % | 15.7 % | 2.8 % | 0.1 % |

Ojo: hoy los vuelos no pasan por el motor (los trata el cliente, `fitDayToTrip`, recortando el día sin rehacerlo). Esto mide cómo quedaría si pasaran. Con salidas a las 9:00 el último día desaparece entero (hay que dejar la ciudad a las 6:00), y con llegadas a las 21:00 el primero también: ahí «nunca se pierde un imprescindible» no se puede cumplir, y sale el aviso.

## 4. Los casos que no caben, agrupados por motivo

**Coliseo (Coliseo, Foro y Palatino)** (28071 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 47.2 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 23.3 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 11.1 % · El día que cedería su hueco no cabe en esa fecha: 10.1 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 4.7 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 3.7 %

**Museos Vaticanos** (42590 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 36.5 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 18.1 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 14.4 % · No queda sitio para comer (entre las 12:15 y las 15:30): 14.2 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 7.5 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 4.6 % · Se pisa con el atardecer, la cena o la nocturna: 4.1 % · El día que cedería su hueco no cabe en esa fecha: 0.8 %

**Panteón** (10182 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 56.6 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 30.2 % · El día que cedería su hueco no cabe en esa fecha: 13.2 % · Se pisa con el atardecer, la cena o la nocturna: 0 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 0 %

**Galería Borghese** (13493 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 33.5 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 22.9 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 21.9 % · Se pisa con el atardecer, la cena o la nocturna: 21.6 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 0.1 %

**Free Tour** (7664 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 89.1 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 9.5 % · Se pisa con el atardecer, la cena o la nocturna: 1.4 %

**Vuelo de llegada** (4339 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 94.8 % · Se pisa con el atardecer, la cena o la nocturna: 5.2 %

**Vuelo de salida** (4392 casos): No cabe antes de salir hacia el aeropuerto: 100 %

## 5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada

Mirando los días que hoy monta el motor. «Paseo recortable» = minutos de opcionales, paseos, paradas de paso y «si entra» (más lo que se puede encoger de un paseo a 10 min) que hay en ese día **antes** o **después** del sitio. «Hueco» = minutos libres entre la parada y la de al lado (sin contar el paseo): lo que midió el usuario.

| Sitio | Días con el sitio | Paseo recortable antes: media | peor día | después: media | peor día | Hueco antes: media | % días con ≥15 min | Hueco después: media | % días con ≥15 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 1095 | 0 | 0 | 66 | 20 | 0 | — | 0 | 0 % |
| Museos Vaticanos | 1094 | 0 | 0 | 47.1 | 10 | 0 | 0 % | 0 | 0 % |
| Panteón | 1095 | 45.2 | 10 | 20.8 | 0 | 0 | 0 % | 0 | 0 % |
| Galería Borghese | 723 | 20 | 20 | 66.3 | 0 | 0 | 0 % | 0 | 0 % |

## 6. Horas redondas

Sobre 3514 días tal como los monta el motor (sin ninguna reserva), con las anclas (atardecer, nocturnas, cena) en su hora. Minutos que se pierden al día = lo que se retrasa la última parada del día antes de la cena; «no caben» = días que dejan de caber (se pisaría el atardecer, la cena o un cierre).

| Variante | Minutos perdidos al día: media | mediana | p90 | Días que dejan de caber |
| --- | --- | --- | --- | --- |
| la lista :00 :15 :20 :30 :40 :45 (referencia) | 37.2 | 22 | 113 | 2709 de 3514 (77.1 %) |
| 1. de 5 en 5, siempre hacia arriba | 4.3 | 3 | 11 | 154 de 3514 (4.4 %) |
| 2. :00 :15 :30 :45 solo donde sobra tiempo | 23.2 | 18 | 42 | 0 de 3514 (0 %) |
| 3. de 5 en 5 en todas y más redondas donde sobra | 23.4 | 18 | 48 | 154 de 3514 (4.4 %) |

Las variantes 2 y 3 solo redondean a cuarto de hora cuando después sigue cabiendo todo (parada a parada, mientras el día aguante), así que **por construcción nunca hacen que algo deje de caber**; lo que cuestan es la media de la tabla. «Donde sobra» lo he generalizado a cualquier parada con holgura, no solo la de después de comer o antes de la nocturna.

### Y con reservas: qué casos que caben dejan de caber al redondear

Se vuelve a resolver cada caso (una de cada cuatro reservas que caben) con el redondeo puesto.

| Sitio | Variante | Casos | Dejan de caber | Caben, pero tocando más |
| --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | la lista :00 :15 :20 :30 :40 :45 (referencia) | 12751 | 348 (2.7 %) | 985 (7.7 %) |
| Coliseo (Coliseo, Foro y Palatino) | 1. de 5 en 5, siempre hacia arriba | 12751 | 20 (0.2 %) | 166 (1.3 %) |
| Museos Vaticanos | la lista :00 :15 :20 :30 :40 :45 (referencia) | 7811 | 398 (5.1 %) | 669 (8.6 %) |
| Museos Vaticanos | 1. de 5 en 5, siempre hacia arriba | 7811 | 58 (0.7 %) | 154 (2 %) |
| Panteón | la lista :00 :15 :20 :30 :40 :45 (referencia) | 6655 | 10 (0.2 %) | 410 (6.2 %) |
| Panteón | 1. de 5 en 5, siempre hacia arriba | 6655 | 0 (0 %) | 265 (4 %) |
| Galería Borghese | la lista :00 :15 :20 :30 :40 :45 (referencia) | 3571 | 518 (14.5 %) | 309 (8.7 %) |
| Galería Borghese | 1. de 5 en 5, siempre hacia arriba | 3571 | 274 (7.7 %) | 48 (1.3 %) |

## 7. Qué días de Roma reescribir, o dónde poner un paseo, para que no quede ningún «no cabe»

### 7a. Reserva el mismo día en que ya está el grupo: lo que no cabe (y no es un cierre ni una franja imposible)

Por día escrito y sitio: cuántos casos no caben, a qué horas de entrada y qué paradas son las que lo impiden. Aquí es donde habría que poner un paseo o una parada opcional (algo que se pueda quitar) o dejar sitio de otra forma.

| Día escrito | Sitio | No cabe | Motivo principal | Horas de entrada que fallan | Paradas que lo impiden (las más repetidas) |
| --- | --- | --- | --- | --- | --- |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos | 3241 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (2947), — (273), Trastevere de noche (21) |
| D2 D | Museos Vaticanos | 2339 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (8 franjas) | Panteón (noche) (798), Puente Sant'Angelo (572), — (360) |
| D2 B | Museos Vaticanos | 1131 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (751), Trastevere de noche (222), — (95) |
| D2 B+relleno_cena:Isla Tiberina | Museos Vaticanos | 927 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (666), Trastevere de noche (174), — (75) |
| D2 C | Museos Vaticanos | 681 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (10 franjas) | Plaza de San Pedro (225), Trastevere de noche (207), Museos Vaticanos y Capilla Sixtina (180) |
| D4 A | Galería Borghese | 669 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (669) |
| D2 A | Museos Vaticanos | 642 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (540), — (51), Trastevere de noche (39) |
| D4 A+domingo | Galería Borghese | 576 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (576) |
| D2 D+luz:C→D | Museos Vaticanos | 408 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (8 franjas) | Plaza de San Pedro (204), Piazza Navona (noche) (153), — (51) |
| D4 D+domingo | Galería Borghese | 388 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 17:45 (4 franjas) | Parque de Villa Borghese (184), Cena (108), Santa Maria del Popolo (96) |
| D2 D+miercoles | Museos Vaticanos | 339 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (6 franjas) | Piazza Navona (noche) (132), Cena (88), — (69) |
| D4 B | Galería Borghese | 328 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (292), Parque de Villa Borghese (36) |
| D2 C+luz:B→C | Museos Vaticanos | 312 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (204), Trastevere de noche (81), — (27) |
| D4 B+domingo | Galería Borghese | 234 | Se pisa con el atardecer, la cena o la nocturna | 13:00 … 17:45 (6 franjas) | Terraza del Pincio (162), Santa Maria del Popolo (36), Parque de Villa Borghese (36) |
| D2 C+miercoles | Museos Vaticanos | 201 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (69), Trastevere de noche (63), Plaza de San Pedro (48) |
| D1 C | Coliseo (Coliseo, Foro y Palatino) | 181 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 17:00 … 18:00 (3 franjas) | Coliseo (82), — (70), Arco de Constantino (29) |
| D4 C | Galería Borghese | 168 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (168) |
| D4 C+domingo | Galería Borghese | 132 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (132) |
| D1 D+luz:C→D | Coliseo (Coliseo, Foro y Palatino) | 114 | La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada | 17:30 … 18:00 (2 franjas) | — (63), Arco de Constantino (34), Foro Romano y Palatino (13) |
| D2 B+fecha:easter-2 | Museos Vaticanos | 84 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (56), Trastevere de noche (21), — (7) |
| D2 C+miercoles+luz:B→C | Museos Vaticanos | 72 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (48), Trastevere de noche (18), — (6) |
| D1 C+domingo | Coliseo (Coliseo, Foro y Palatino) | 34 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 18:00 (7 franjas) | Arco de Constantino (28), — (6) |
| D1 B+domingo | Coliseo (Coliseo, Foro y Palatino) | 30 | La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada | 15:30 … 17:30 (4 franjas) | — (16), Arco de Constantino (14) |
| D2 A+lunes+relleno_cena:Isla Tiberina | Museos Vaticanos | 26 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (24), — (2) |
| D4 A+fecha:01-06 | Galería Borghese | 24 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 13:00 … 17:45 (6 franjas) | Parque de Villa Borghese (24) |
| D4 B+luz:A→B | Galería Borghese | 24 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (12), Parque de Villa Borghese (12) |
| D2 D+lunes | Museos Vaticanos | 14 | Se pisa con el atardecer, la cena o la nocturna | 12:30 … 17:30 (8 franjas) | Mirador del Janículo (7), Trastevere de noche (3), — (2) |
| D1 C+domingo+fecha:primer_domingo | Coliseo (Coliseo, Foro y Palatino) | 10 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:30 … 17:30 (5 franjas) | Arco de Constantino (8), — (2) |
| D1 D+domingo+fecha:primer_domingo+luz:C→D | Coliseo (Coliseo, Foro y Palatino) | 8 | La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada | 17:30 … 18:00 (2 franjas) | — (4), Coliseo (2), Foro Romano y Palatino (2) |

### 7b. Reserva en otro día: por qué un día no se puede cambiar por otro

El grupo solo pasa a otro día si los dos días abren en la fecha nueva. Estos son los cierres que lo impiden: **qué día escrito** (el que se movería), **qué parada** cierra y **en qué día de la semana**. «grupo» = el día del grupo no puede ir a esa fecha; «desplazado» = el día que cedería su hueco no puede ir a la fecha de origen.

| Día escrito | Cierra | El día de la semana | Papel | Casos |
| --- | --- | --- | --- | --- |
| D2 D | San Pietro in Montorio y Tempietto de Bramante | lunes | grupo | 4240 |
| D2 D | San Pietro in Montorio y Tempietto de Bramante | lunes | desplazado | 3781 |
| D4 D+domingo | Galería Borghese | lunes | desplazado | 2052 |
| D2 D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 1753 |
| D4 A+domingo | Galería Borghese | lunes | desplazado | 1320 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 1286 |
| D4 D | Galería Borghese | lunes | desplazado | 1160 |
| D4M D+lunes | no cabe en esa fecha | domingo | desplazado | 1102 |
| D2 B | Castillo de Sant'Angelo | lunes | grupo | 1000 |
| D2 C | Castillo de Sant'Angelo | lunes | grupo | 880 |
| D4 B+domingo | Galería Borghese | lunes | desplazado | 856 |
| D2 B | Castillo de Sant'Angelo | lunes | desplazado | 843 |
| D2 C | Castillo de Sant'Angelo | lunes | desplazado | 789 |
| D2 B+relleno_cena:Isla Tiberina | Castillo de Sant'Angelo | lunes | grupo | 740 |
| D4 C+domingo | Galería Borghese | lunes | desplazado | 740 |
| D4M A+lunes | no cabe en esa fecha | domingo | desplazado | 696 |
| D4 A | Galería Borghese | lunes | desplazado | 648 |
| D4 A+domingo | no cabe en esa fecha | viernes | desplazado | 594 |
| D2 B+relleno_cena:Isla Tiberina | Castillo de Sant'Angelo | lunes | desplazado | 543 |
| D4 B | Galería Borghese | lunes | desplazado | 509 |
| D2 B | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 488 |
| D2 D+luz:C→D | San Pietro in Montorio y Tempietto de Bramante | lunes | grupo | 460 |
| D4M B+lunes | no cabe en esa fecha | domingo | desplazado | 458 |
| D4 B+domingo | no cabe en esa fecha | viernes | desplazado | 428 |
| D4 C | Galería Borghese | lunes | desplazado | 406 |
| D2 D+luz:C→D | San Pietro in Montorio y Tempietto de Bramante | lunes | desplazado | 398 |
| D4 C+domingo | no cabe en esa fecha | viernes | desplazado | 370 |
| D2 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 368 |

