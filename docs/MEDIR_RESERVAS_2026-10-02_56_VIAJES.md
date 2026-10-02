# Reservas dentro de la ruta · 2 · Medir si cabe

Medido el 2-oct-2026 con `scripts/destino/medirReservas.mjs` (solo mide: no cambia nada de la app). 56 viajes: los 26 de revision20.mjs y los 30 de revisionCierre.mjs, cada uno con su duración, su Free Tour y sus experiencias (si ya llevan Free Tour, ese no se mide como reserva), 8954 reservas simuladas, 6 s.

## 🟢 Fallos de la propuesta (ninguna hora fija rota, nada cerrado, nada quitado sin aviso, atardecer y cena intactos): **0**

Cada caso resuelto se comprobó después con una revisión aparte (hora de la reserva, aperturas y última entrada, cena y nocturnas en su hora, 30 min de margen, ningún imprescindible quitado). Se resolvieron 3804 casos que caben y ninguno falló la revisión.

## 🔴 Lo que el motor de hoy ya hace mal (sin ninguna reserva)

Nada: ni visitas por dentro de sitios cerrados ni el Panteón en misa.


Misas del Panteón: el motor ya respeta los dos horarios de misa que traen los datos (sábado hasta las 16:00 y domingo de 09:00 a 09:30 y desde las 11:45). Lo que **no** cubre: las vísperas de festivo y los festivos entre semana (misa a las 17:00 y a las 10:30 respectivamente según la web), porque los datos solo conocen sábado y domingo. Los sábados y los domingos, el motor lo hace bien (ningún caso). Las vísperas y los festivos entre semana, no: salen arriba, con su fecha.

Fidelidad del modelo: de 177 días que monta el motor, 155 (87.6 %) caben tal cual en la simulación. El resto: horario 18, ancla 4.

## Lo esencial, en pocas palabras

- **Coliseo (Coliseo, Foro y Palatino)**: con la reserva el mismo día que ya está la parada, cabe en 89.6 % de los casos (11.5 % sin tocar nada, 33.4 % encogiendo o quitando algo, 44.8 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 46 %.
- **Museos Vaticanos**: con la reserva el mismo día que ya está la parada, cabe en 39.2 % de los casos (8.8 % sin tocar nada, 18.5 % encogiendo o quitando algo, 11.9 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 23.7 %.
- **Panteón**: con la reserva el mismo día que ya está la parada, cabe en 77.2 % de los casos (3 % sin tocar nada, 37 % encogiendo o quitando algo, 37.2 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 41.1 %.
- **Galería Borghese**: con la reserva el mismo día que ya está la parada, cabe en 65.7 % de los casos (6.7 % sin tocar nada, 15.7 % encogiendo o quitando algo, 43.3 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 38.7 %.
- **Free Tour**: con la reserva el mismo día que ya está la parada, cabe en 16.4 % de los casos (0 % sin tocar nada, 6.3 % encogiendo o quitando algo, 10.1 % cambiando el orden). Con la reserva en otro día del viaje, cabe en —.
- **Vuelos**, % que no cabe — llegada: 9:00 → 0 %, 12:00 → 94.6 %, 15:00 → 100 %, 18:00 → 100 %, 21:00 → 100 %. Salida: 9:00 → 100 %, 12:00 → 100 %, 15:00 → 100 %, 18:00 → 96.4 %, 21:00 → 5.4 %.
- **Horas redondas**: de 5 en 5 hacia arriba pierde de media 5.5 min al día (y 6 días dejan de caber de 136); tu lista :00/:15/:20/:30/:40/:45 pierde 29.8 min y 76.5 % de los días dejan de caber; los cuartos de hora «donde sobra» cuestan 23.8 min y no rompen nada.

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
| 08:30 | 176 | 94.6 % | 5.4 % | 0 % | 0 % | 53.3 % | 46.7 % | 30.1 % |
| 09:00 | 176 | 73.2 % | 26.8 % | 0 % | 0 % | 43.3 % | 56.7 % | 30.1 % |
| 09:30 | 176 | 25 % | 75 % | 0 % | 0 % | 43.3 % | 56.7 % | 30.1 % |
| 10:00 | 176 | 12.5 % | 87.5 % | 0 % | 0 % | 43.3 % | 56.7 % | 30.1 % |
| 10:30 | 176 | 1.8 % | 96.4 % | 1.8 % | 0 % | 43.3 % | 56.7 % | 30.1 % |
| 11:00 | 176 | 0 % | 92.9 % | 7.1 % | 0 % | 43.3 % | 56.7 % | 30.1 % |
| 11:30 | 176 | 0 % | 89.3 % | 8.9 % | 1.8 % | 54.2 % | 45.8 % | 30.1 % |
| 12:00 | 176 | 0 % | 53.6 % | 44.6 % | 1.8 % | 54.2 % | 45.8 % | 30.1 % |
| 12:30 | 176 | 0 % | 30.4 % | 60.7 % | 8.9 % | 49.2 % | 50.8 % | 31.8 % |
| 13:00 | 176 | 0 % | 7.1 % | 82.1 % | 10.7 % | 50.8 % | 49.2 % | 35.8 % |
| 13:30 | 175 | 0 % | 30.9 % | 67.3 % | 1.8 % | 55.8 % | 44.2 % | 30.3 % |
| 14:00 | 175 | 0 % | 7.3 % | 89.1 % | 3.6 % | 55.8 % | 44.2 % | 30.3 % |
| 14:30 | 175 | 0 % | 1.8 % | 89.1 % | 9.1 % | 50.8 % | 49.2 % | 33.7 % |
| 15:00 | 175 | 0 % | 0 % | 90.9 % | 9.1 % | 50.8 % | 49.2 % | 35.4 % |
| 15:30 | 175 | 0 % | 0 % | 69.1 % | 30.9 % | 36.7 % | 63.3 % | 52 % |
| 16:00 | 124 | 0 % | 0 % | 84.6 % | 15.4 % | 47.1 % | 52.9 % | 39.5 % |
| 16:30 | 115 | 0 % | 0 % | 86.1 % | 13.9 % | 44.3 % | 55.7 % | 40.9 % |
| 17:00 | 113 | 0 % | 0 % | 80.6 % | 19.4 % | 42.9 % | 57.1 % | 45.1 % |
| 17:30 | 113 | 0 % | 0 % | 63.9 % | 36.1 % | 31.2 % | 68.8 % | 54 % |
| 18:00 | 98 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 3198 | 11.5 % | 33.4 % | 44.8 % | 10.4 % | 46 % | 54 % |  |

### Museos Vaticanos

Franjas: cada 30 min de 08:00 a 17:30 (web de venta oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:00 | 128 | 69.6 % | 0 % | 0 % | 30.4 % | 41.7 % | 58.3 % | 46.1 % |
| 08:30 | 128 | 62.5 % | 7.1 % | 0 % | 30.4 % | 41.7 % | 58.3 % | 46.1 % |
| 09:00 | 135 | 32.1 % | 37.5 % | 0 % | 30.4 % | 43 % | 57 % | 45.9 % |
| 09:30 | 135 | 10.7 % | 58.9 % | 0 % | 30.4 % | 43 % | 57 % | 45.9 % |
| 10:00 | 135 | 0 % | 69.6 % | 0 % | 30.4 % | 43 % | 57 % | 45.9 % |
| 10:30 | 135 | 0 % | 51.8 % | 17.9 % | 30.4 % | 43 % | 57 % | 45.9 % |
| 11:00 | 135 | 0 % | 48.2 % | 21.4 % | 30.4 % | 43 % | 57 % | 45.9 % |
| 11:30 | 135 | 0 % | 30.4 % | 19.6 % | 50 % | 25.3 % | 74.7 % | 60.7 % |
| 12:00 | 135 | 0 % | 23.2 % | 17.9 % | 58.9 % | 21.5 % | 78.5 % | 63 % |
| 12:30 | 135 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:00 | 128 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:30 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 70.1 % |
| 14:00 | 127 | 0 % | 0 % | 36.4 % | 63.6 % | 19.4 % | 80.6 % | 70.1 % |
| 14:30 | 127 | 0 % | 0 % | 34.5 % | 65.5 % | 18.1 % | 81.9 % | 74.8 % |
| 15:00 | 127 | 0 % | 0 % | 32.7 % | 67.3 % | 18.1 % | 81.9 % | 75.6 % |
| 15:30 | 127 | 0 % | 30.9 % | 30.9 % | 38.2 % | 41.7 % | 58.3 % | 49.6 % |
| 16:00 | 127 | 0 % | 9.1 % | 16.4 % | 74.5 % | 16.7 % | 83.3 % | 79.5 % |
| 16:30 | 127 | 0 % | 0 % | 10.9 % | 89.1 % | 6.9 % | 93.1 % | 88.2 % |
| 17:00 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 17:30 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 2607 | 8.8 % | 18.5 % | 11.9 % | 60.8 % | 23.7 % | 76.3 % |  |

### Panteón

Franjas: cada hora de 09:00 a 17:00 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 175 | 0 % | 0 % | 100 % | 0 % | 52.1 % | 47.9 % | 32.6 % |
| 10:00 | 134 | 0 % | 0 % | 59.5 % | 40.5 % | 40.2 % | 59.8 % | 53.7 % |
| 11:00 | 134 | 0 % | 0 % | 59.5 % | 40.5 % | 40.2 % | 59.8 % | 53.7 % |
| 12:00 | 175 | 0 % | 10.7 % | 58.9 % | 30.4 % | 37.8 % | 62.2 % | 52 % |
| 13:00 | 175 | 7.1 % | 51.8 % | 10.7 % | 30.4 % | 37.8 % | 62.2 % | 52 % |
| 14:00 | 175 | 12.5 % | 85.7 % | 1.8 % | 0 % | 52.1 % | 47.9 % | 32.6 % |
| 15:00 | 175 | 5.4 % | 64.3 % | 1.8 % | 28.6 % | 39.5 % | 60.5 % | 49.1 % |
| 16:00 | 134 | 0 % | 72.9 % | 4.2 % | 22.9 % | 32.6 % | 67.4 % | 50.7 % |
| 17:00 | 134 | 0 % | 33.3 % | 45.8 % | 20.8 % | 32.6 % | 67.4 % | 50.7 % |
| **Todas** | 1411 | 3 % | 37 % | 37.2 % | 22.8 % | 41.1 % | 58.9 % |  |

### Galería Borghese

Franjas: turnos a las horas en punto y 17:45 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 67 | 0 % | 0 % | 100 % | 0 % | 54.3 % | 45.7 % | 31.3 % |
| 10:00 | 67 | 0 % | 33.3 % | 57.1 % | 9.5 % | 54.3 % | 45.7 % | 31.3 % |
| 11:00 | 67 | 0 % | 90.5 % | 0 % | 9.5 % | 54.3 % | 45.7 % | 34.3 % |
| 12:00 | 67 | 38.1 % | 0 % | 57.1 % | 4.8 % | 52.2 % | 47.8 % | 31.3 % |
| 13:00 | 67 | 14.3 % | 0 % | 57.1 % | 28.6 % | 37 % | 63 % | 40.3 % |
| 14:00 | 67 | 14.3 % | 0 % | 57.1 % | 28.6 % | 37 % | 63 % | 31.3 % |
| 15:00 | 67 | 0 % | 23.8 % | 28.6 % | 47.6 % | 30.4 % | 69.6 % | 50.7 % |
| 16:00 | 67 | 0 % | 9.5 % | 28.6 % | 61.9 % | 23.9 % | 76.1 % | 53.7 % |
| 17:00 | 67 | 0 % | 0 % | 23.8 % | 76.2 % | 21.7 % | 78.3 % | 71.6 % |
| 17:45 | 67 | 0 % | 0 % | 23.8 % | 76.2 % | 21.7 % | 78.3 % | 62.7 % |
| **Todas** | 670 | 6.7 % | 15.7 % | 43.3 % | 34.3 % | 38.7 % | 61.3 % |  |

### Free Tour (como una reserva más)

Franjas: salidas a las 10:00 y a las 17:00; el tour cubre Plaza de España, Via Condotti, Trevi, San Ignacio y Navona (esas visitas sueltas desaparecen del día porque ya se ven con el tour).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10:00 | 119 | 0 % | 3.4 % | 5 % | 91.6 % | — | — | 21.8 % |
| 17:00 | 119 | 0 % | 9.2 % | 15.1 % | 75.6 % | — | — | 58 % |
| **Todas** | 238 | 0 % | 6.3 % | 10.1 % | 83.6 % | — | — |  |

Fuera de ruta: reservas de un sitio que el viaje no lleva (no se miden: la propuesta no dice qué pasa): Galería Borghese 830. Días con el sitio cerrado (no hay franja que reservar): 72.

### Por día de la semana de la reserva (% de «no cabe» sobre todas las franjas de ese día)

| Sitio | lun | mar | mié | jue | vie | sáb | dom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 66 % | 49.8 % | 38.3 % | 29.8 % | 18.5 % | 51.7 % | 28 % |
| Museos Vaticanos | 94 % | 75.8 % | 60.4 % | 60 % | 65.3 % | 62.4 % | 64.3 % |
| Panteón | 61.5 % | 67.5 % | 58.1 % | 25 % | 30.3 % | 46 % | 47.4 % |
| Galería Borghese | cerrado | 60 % | 37.1 % | 77.5 % | 47.9 % | 65.3 % | 35.3 % |

De los 3804 casos que caben: 69 obligan a empezar antes de las 8:30 (por una reserva temprana), 485 dejan un hueco de más de 90 min entre dos paradas (la reserva está lejos de lo demás) y 2180 necesitan dejar un imprescindible en su versión corta.

## 3. Vuelos: llegada y salida como horas fijas

Llegada: se está en el centro 60 min después de aterrizar (Fiumicino, `_llegada.json`); el primer día empieza entonces. Salida: hay que dejar la ciudad 180 min antes del vuelo; el último día acaba entonces. Mismo orden de cosas que arriba; si no cabe, el día entero se cambia con otro del viaje.

|  | Hora | Casos | sin tocar | encoge o quita | cambia el día | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| llegada | 9:00 | 56 | 1.8 % | 98.2 % | 0 % | 0 % | 0 % |
| llegada | 12:00 | 56 | 0 % | 1.8 % | 3.6 % | 94.6 % | 16.1 % |
| llegada | 15:00 | 56 | 0 % | 0 % | 0 % | 100 % | 44.6 % |
| llegada | 18:00 | 56 | 0 % | 0 % | 0 % | 100 % | 80.4 % |
| llegada | 21:00 | 56 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 9:00 | 56 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 12:00 | 56 | 0 % | 0 % | 0 % | 100 % | 53.6 % |
| salida | 15:00 | 56 | 0 % | 0 % | 0 % | 100 % | 23.2 % |
| salida | 18:00 | 56 | 0 % | 0 % | 3.6 % | 96.4 % | 0 % |
| salida | 21:00 | 56 | 0 % | 85.7 % | 8.9 % | 5.4 % | 0 % |

Ojo: hoy los vuelos no pasan por el motor (los trata el cliente, `fitDayToTrip`, recortando el día sin rehacerlo). Esto mide cómo quedaría si pasaran. Con salidas a las 9:00 el último día desaparece entero (hay que dejar la ciudad a las 6:00), y con llegadas a las 21:00 el primero también: ahí «nunca se pierde un imprescindible» no se puede cumplir, y sale el aviso.

## 4. Los casos que no caben, agrupados por motivo

**Coliseo (Coliseo, Foro y Palatino)** (1284 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 54 % · El día que cedería su hueco no cabe en esa fecha: 14.6 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 9.6 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 7.5 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 7.4 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 6.9 % · No queda sitio para comer (entre las 12:15 y las 15:30): 0.2 %

**Museos Vaticanos** (1818 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 34.5 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 20.2 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 14 % · No queda sitio para comer (entre las 12:15 y las 15:30): 13.4 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 6.7 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 5.5 % · Se pisa con el atardecer, la cena o la nocturna: 3.5 % · El día que cedería su hueco no cabe en esa fecha: 2.2 %

**Panteón** (665 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 48.6 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 32.2 % · El día que cedería su hueco no cabe en esa fecha: 11 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 6.8 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 1.5 %

**Galería Borghese** (354 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 39.5 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 26.8 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 14.1 % · Se pisa con el atardecer, la cena o la nocturna: 11 % · El día que cedería su hueco no cabe en esa fecha: 5.6 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 2.5 % · No queda sitio para comer (entre las 12:15 y las 15:30): 0.3 %

**Free Tour** (199 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 97.5 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 2 % · Se pisa con el atardecer, la cena o la nocturna: 0.5 %

**Vuelo de llegada** (221 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 66.5 % · Se pisa con el atardecer, la cena o la nocturna: 33.5 %

**Vuelo de salida** (225 casos): No cabe antes de salir hacia el aeropuerto: 97.8 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 2.2 %

## 5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada

Mirando los días que hoy monta el motor. «Paseo recortable» = minutos de opcionales, paseos, paradas de paso y «si entra» (más lo que se puede encoger de un paseo a 10 min) que hay en ese día **antes** o **después** del sitio. «Hueco» = minutos libres entre la parada y la de al lado (sin contar el paseo): lo que midió el usuario.

| Sitio | Días con el sitio | Paseo recortable antes: media | peor día | después: media | peor día | Hueco antes: media | % días con ≥15 min | Hueco después: media | % días con ≥15 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 56 | 0 | 0 | 54.1 | 20 | 0 | — | 0 | 0 % |
| Museos Vaticanos | 56 | 10.6 | 0 | 35.4 | 0 | 0 | 0 % | 0 | 0 % |
| Panteón | 56 | 43.7 | 10 | 9.6 | 0 | 0 | 0 % | 0 | 0 % |
| Galería Borghese | 21 | 13.8 | 0 | 56.2 | 0 | 0 | 0 % | 0 | 0 % |

## 6. Horas redondas

Sobre 136 días tal como los monta el motor (sin ninguna reserva), con las anclas (atardecer, nocturnas, cena) en su hora. Minutos que se pierden al día = lo que se retrasa la última parada del día antes de la cena; «no caben» = días que dejan de caber (se pisaría el atardecer, la cena o un cierre).

| Variante | Minutos perdidos al día: media | mediana | p90 | Días que dejan de caber |
| --- | --- | --- | --- | --- |
| la lista :00 :15 :20 :30 :40 :45 (referencia) | 29.8 | 27 | 53 | 104 de 136 (76.5 %) |
| 1. de 5 en 5, siempre hacia arriba | 5.5 | 3 | 14 | 6 de 136 (4.4 %) |
| 2. :00 :15 :30 :45 solo donde sobra tiempo | 23.8 | 20 | 42 | 0 de 136 (0 %) |
| 3. de 5 en 5 en todas y más redondas donde sobra | 23.9 | 20 | 42 | 6 de 136 (4.4 %) |

Las variantes 2 y 3 solo redondean a cuarto de hora cuando después sigue cabiendo todo (parada a parada, mientras el día aguante), así que **por construcción nunca hacen que algo deje de caber**; lo que cuestan es la media de la tabla. «Donde sobra» lo he generalizado a cualquier parada con holgura, no solo la de después de comer o antes de la nocturna.

### Y con reservas: qué casos que caben dejan de caber al redondear

Se vuelve a resolver cada caso (una de cada cuatro reservas que caben) con el redondeo puesto.

| Sitio | Variante | Casos | Dejan de caber | Caben, pero tocando más |
| --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | la lista :00 :15 :20 :30 :40 :45 (referencia) | 471 | 24 (5.1 %) | 50 (10.6 %) |
| Coliseo (Coliseo, Foro y Palatino) | 1. de 5 en 5, siempre hacia arriba | 471 | 0 (0 %) | 20 (4.2 %) |
| Museos Vaticanos | la lista :00 :15 :20 :30 :40 :45 (referencia) | 190 | 14 (7.4 %) | 26 (13.7 %) |
| Museos Vaticanos | 1. de 5 en 5, siempre hacia arriba | 190 | 5 (2.6 %) | 4 (2.1 %) |
| Panteón | la lista :00 :15 :20 :30 :40 :45 (referencia) | 184 | 3 (1.6 %) | 21 (11.4 %) |
| Panteón | 1. de 5 en 5, siempre hacia arriba | 184 | 1 (0.5 %) | 11 (6 %) |
| Galería Borghese | la lista :00 :15 :20 :30 :40 :45 (referencia) | 81 | 11 (13.6 %) | 6 (7.4 %) |
| Galería Borghese | 1. de 5 en 5, siempre hacia arriba | 81 | 8 (9.9 %) | 0 (0 %) |

## 7. Qué días de Roma reescribir, o dónde poner un paseo, para que no quede ningún «no cabe»

### 7a. Reserva el mismo día en que ya está el grupo: lo que no cabe (y no es un cierre ni una franja imposible)

Por día escrito y sitio: cuántos casos no caben, a qué horas de entrada y qué paradas son las que lo impiden. Aquí es donde habría que poner un paseo o una parada opcional (algo que se pueda quitar) o dejar sitio de otra forma.

| Día escrito | Sitio | No cabe | Motivo principal | Horas de entrada que fallan | Paradas que lo impiden (las más repetidas) |
| --- | --- | --- | --- | --- | --- |
| D3 D | Museos Vaticanos | 105 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (51), Museos Vaticanos y Capilla Sixtina (24), Panteón (noche) (14) |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos | 95 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (85), — (9), Trastevere de noche (1) |
| D2 D | Museos Vaticanos | 85 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (7 franjas) | Panteón (noche) (30), Puente Sant'Angelo (22), — (13) |
| D3 B+sabado | Museos Vaticanos | 57 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (48), Panteón (noche) (6), — (3) |
| D3 D | Panteón | 40 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 17:00 (7 franjas) | Panteón (40) |
| D3 A | Museos Vaticanos | 38 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (30), Panteón (noche) (6), — (2) |
| D2 B+relleno_cena:Isla Tiberina | Museos Vaticanos | 37 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (26), Trastevere de noche (8), — (3) |
| D3 D+sabado | Museos Vaticanos | 36 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (16), Museos Vaticanos y Capilla Sixtina (13), Panteón (noche) (2) |
| D2 C+luz:B→C | Museos Vaticanos | 23 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (15), Trastevere de noche (6), — (2) |
| D3 A+sabado | Museos Vaticanos | 19 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (16), Panteón (noche) (2), — (1) |
| D4 A | Galería Borghese | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (19) |
| D3 C+sabado | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (16), Piazza Navona (noche) (2), — (1) |
| D3 B | Museos Vaticanos | 19 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (15), Panteón (noche) (3), — (1) |
| D3 C | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (15), Piazza Navona (noche) (3), — (1) |
| D3 B+sabado | Panteón | 15 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 15:00 (5 franjas) | Panteón (15) |
| D3 A | Panteón | 14 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 17:00 (7 franjas) | Panteón (14) |
| D2 A+barrios_sabores+relleno_cena:Isla Tiberina | Museos Vaticanos | 13 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (12), — (1) |
| D2 A | Museos Vaticanos | 13 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (11), Trastevere de noche (1), — (1) |
| D2 B+barrios_sabores | Museos Vaticanos | 12 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (8), Trastevere de noche (3), — (1) |
| D2 B | Museos Vaticanos | 12 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (8), Cena (3), — (1) |
| D1 C+domingo+arte_museos+pool:Galería Borghese | Coliseo (Coliseo, Foro y Palatino) | 11 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 18:00 (11 franjas) | Arco de Constantino (8), Plaza de España (noche) (2), — (1) |
| D2 C+miercoles | Museos Vaticanos | 11 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (7), Trastevere de noche (3), — (1) |
| D2 C+naturaleza_vistas | Museos Vaticanos | 11 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (11 franjas) | Cúpula de San Pedro (6), Trastevere de noche (4), — (1) |
| D4 C+domingo | Galería Borghese | 10 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (10) |
| D2 C | Museos Vaticanos | 10 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (10 franjas) | Plaza de San Pedro (6), Trastevere de noche (3), — (1) |
| D3 D+sabado | Panteón | 9 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 15:00 (5 franjas) | Panteón (9) |
| D2 C+lunes | Museos Vaticanos | 9 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (9 franjas) | Museos Vaticanos y Capilla Sixtina (5), Trastevere de noche (3), — (1) |
| D1 A+domingo+pool:Galería Borghese+relleno_cena:Piazza del Popolo | Coliseo (Coliseo, Foro y Palatino) | 9 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 11:30 … 15:30 (9 franjas) | Arco de Constantino (8), — (1) |
| D4 D+domingo | Galería Borghese | 8 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 17:45 (4 franjas) | Parque de Villa Borghese (8) |
| D2 D+barrios_sabores+luz:C→D | Museos Vaticanos | 8 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (8 franjas) | Plaza de San Pedro (4), Piazza Navona (noche) (3), — (1) |

### 7b. Reserva en otro día: por qué un día no se puede cambiar por otro

El grupo solo pasa a otro día si los dos días abren en la fecha nueva. Estos son los cierres que lo impiden: **qué día escrito** (el que se movería), **qué parada** cierra y **en qué día de la semana**. «grupo» = el día del grupo no puede ir a esa fecha; «desplazado» = el día que cedería su hueco no puede ir a la fecha de origen.

| Día escrito | Cierra | El día de la semana | Papel | Casos |
| --- | --- | --- | --- | --- |
| D2 D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 184 |
| D2 D | San Pietro in Montorio y Tempietto de Bramante | lunes | grupo | 120 |
| D4M D+lunes | no cabe en esa fecha | domingo | desplazado | 116 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 78 |
| D4 C+domingo | no cabe en esa fecha | viernes | desplazado | 77 |
| D3 B+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 50 |
| D4 A | Galería Borghese | lunes | desplazado | 48 |
| D1-FT D+sabado | San Pietro in Montorio y Tempietto de Bramante | lunes | grupo | 40 |
| D2 D+miercoles+naturaleza_vistas | Castillo de Sant'Angelo | lunes | desplazado | 29 |
| D2 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 29 |
| D5C D | Mercados de Trajano | sábado | desplazado | 29 |
| D1 C+domingo+arte_museos+pool:Galería Borghese | Galería Borghese | lunes | grupo | 29 |
| D1-FT B | San Pietro in Montorio y Tempietto de Bramante | lunes | desplazado | 29 |
| D2 D+barrios_sabores | San Pietro in Montorio y Tempietto de Bramante | lunes | desplazado | 29 |
| D4 D | Galería Borghese | lunes | desplazado | 29 |
| D1-FT D | San Pietro in Montorio y Tempietto de Bramante | lunes | desplazado | 29 |
| D4 D+con_free_tour | Castillo de Sant'Angelo | lunes | desplazado | 29 |
| D1-FT A | San Pietro in Montorio y Tempietto de Bramante | lunes | desplazado | 29 |
| D4 A+con_free_tour | Castillo de Sant'Angelo | lunes | desplazado | 29 |
| D4 D+domingo | Ara Pacis | sábado | desplazado | 27 |
| D2 D | San Pietro in Montorio y Tempietto de Bramante | lunes | desplazado | 27 |
| D4 D+domingo | Galería Borghese | lunes | desplazado | 27 |
| D2 B+barrios_sabores | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 26 |
| D2 A+barrios_sabores+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | lunes | desplazado | 24 |
| D5C A | Cementerio Protestante | domingo | desplazado | 24 |
| D4M B+lunes | no cabe en esa fecha | domingo | desplazado | 24 |
| D4 B+domingo | no cabe en esa fecha | viernes | desplazado | 23 |
| D3 B+sabado | Museos Vaticanos y Capilla Sixtina | domingo | grupo | 21 |

