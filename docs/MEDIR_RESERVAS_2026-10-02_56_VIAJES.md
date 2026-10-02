# Reservas dentro de la ruta · 2 · Medir si cabe

Medido el 2-oct-2026 con `scripts/destino/medirReservas.mjs` (solo mide: no cambia nada de la app). 56 viajes: los 26 de revision20.mjs y los 30 de revisionCierre.mjs, cada uno con su duración, su Free Tour y sus experiencias (si ya llevan Free Tour, ese no se mide como reserva), 8954 reservas simuladas, 5 s.

## 🟢 Fallos de la propuesta (ninguna hora fija rota, nada cerrado, nada quitado sin aviso, atardecer y cena intactos): **0**

Cada caso resuelto se comprobó después con una revisión aparte (hora de la reserva, aperturas y última entrada, cena y nocturnas en su hora, 30 min de margen, ningún imprescindible quitado). Se resolvieron 4228 casos que caben y ninguno falló la revisión.

## 🔴 Lo que el motor de hoy ya hace mal (sin ninguna reserva)

Nada: ni visitas por dentro de sitios cerrados ni el Panteón en misa.


Misas del Panteón: el motor ya respeta los dos horarios de misa que traen los datos (sábado hasta las 16:00 y domingo de 09:00 a 09:30 y desde las 11:45). Lo que **no** cubre: las vísperas de festivo y los festivos entre semana (misa a las 17:00 y a las 10:30 respectivamente según la web), porque los datos solo conocen sábado y domingo. Los sábados y los domingos, el motor lo hace bien (ningún caso). Las vísperas y los festivos entre semana, no: salen arriba, con su fecha.

Fidelidad del modelo: de 177 días que monta el motor, 155 (87.6 %) caben tal cual en la simulación. El resto: horario 18, ancla 4.

## Lo esencial, en pocas palabras

- **Coliseo (Coliseo, Foro y Palatino)**: con la reserva el mismo día que ya está la parada, cabe en 89.6 % de los casos (11.5 % sin tocar nada, 33.4 % encogiendo o quitando algo, 44.8 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 56.2 %.
- **Museos Vaticanos**: con la reserva el mismo día que ya está la parada, cabe en 38.2 % de los casos (13.2 % sin tocar nada, 13.2 % encogiendo o quitando algo, 11.7 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 33.8 %.
- **Panteón**: con la reserva el mismo día que ya está la parada, cabe en 76.5 % de los casos (2.4 % sin tocar nada, 37 % encogiendo o quitando algo, 37.2 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 46.7 %.
- **Galería Borghese**: con la reserva el mismo día que ya está la parada, cabe en 65.7 % de los casos (10 % sin tocar nada, 9 % encogiendo o quitando algo, 46.7 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 41.1 %.
- **Free Tour**: con la reserva el mismo día que ya está la parada, cabe en 16.4 % de los casos (0 % sin tocar nada, 6.3 % encogiendo o quitando algo, 10.1 % cambiando el orden). Con la reserva en otro día del viaje, cabe en —.
- **Vuelos**, % que no cabe — llegada: 9:00 → 0 %, 12:00 → 87.5 %, 15:00 → 100 %, 18:00 → 100 %, 21:00 → 100 %. Salida: 9:00 → 100 %, 12:00 → 100 %, 15:00 → 100 %, 18:00 → 91.1 %, 21:00 → 5.4 %.
- **Horas de 10 en 10, a la más cercana**: mueve cada hora 2.3 min de media; dejan de caber de verdad 0 de 136 días (0 %) y, entre las reservas que caben, 17 de 4189 (0.4 %); el coste: 51.5 % de los días llevan alguna visita enseñada más de 5 min más corta (24.3 min al día en total).

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
| 08:30 | 176 | 94.6 % | 5.4 % | 0 % | 0 % | 65 % | 35 % | 22.2 % |
| 09:00 | 176 | 73.2 % | 26.8 % | 0 % | 0 % | 54.2 % | 45.8 % | 22.2 % |
| 09:30 | 176 | 25 % | 75 % | 0 % | 0 % | 54.2 % | 45.8 % | 22.2 % |
| 10:00 | 176 | 12.5 % | 87.5 % | 0 % | 0 % | 54.2 % | 45.8 % | 22.2 % |
| 10:30 | 176 | 1.8 % | 96.4 % | 1.8 % | 0 % | 54.2 % | 45.8 % | 22.2 % |
| 11:00 | 176 | 0 % | 92.9 % | 7.1 % | 0 % | 54.2 % | 45.8 % | 22.2 % |
| 11:30 | 176 | 0 % | 89.3 % | 8.9 % | 1.8 % | 65.8 % | 34.2 % | 22.2 % |
| 12:00 | 176 | 0 % | 53.6 % | 44.6 % | 1.8 % | 65.8 % | 34.2 % | 22.2 % |
| 12:30 | 176 | 0 % | 30.4 % | 60.7 % | 8.9 % | 60 % | 40 % | 24.4 % |
| 13:00 | 176 | 0 % | 7.1 % | 82.1 % | 10.7 % | 60.8 % | 39.2 % | 28.4 % |
| 13:30 | 175 | 0 % | 30.9 % | 67.3 % | 1.8 % | 67.5 % | 32.5 % | 22.3 % |
| 14:00 | 175 | 0 % | 7.3 % | 89.1 % | 3.6 % | 67.5 % | 32.5 % | 22.3 % |
| 14:30 | 175 | 0 % | 1.8 % | 89.1 % | 9.1 % | 60.8 % | 39.2 % | 26.3 % |
| 15:00 | 175 | 0 % | 0 % | 90.9 % | 9.1 % | 60.8 % | 39.2 % | 28 % |
| 15:30 | 175 | 0 % | 0 % | 69.1 % | 30.9 % | 45 % | 55 % | 45.7 % |
| 16:00 | 124 | 0 % | 0 % | 84.6 % | 15.4 % | 55.3 % | 44.7 % | 33.1 % |
| 16:30 | 115 | 0 % | 0 % | 86.1 % | 13.9 % | 53.2 % | 46.8 % | 33.9 % |
| 17:00 | 113 | 0 % | 0 % | 80.6 % | 19.4 % | 51.9 % | 48.1 % | 38.1 % |
| 17:30 | 113 | 0 % | 0 % | 63.9 % | 36.1 % | 40.3 % | 59.7 % | 46.9 % |
| 18:00 | 98 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 3198 | 11.5 % | 33.4 % | 44.8 % | 10.4 % | 56.2 % | 43.8 % |  |

### Museos Vaticanos

Franjas: cada 30 min de 08:00 a 17:30 (web de venta oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:00 | 128 | 69.6 % | 0 % | 0 % | 30.4 % | 59.7 % | 40.3 % | 35.9 % |
| 08:30 | 128 | 69.6 % | 0 % | 0 % | 30.4 % | 59.7 % | 40.3 % | 35.9 % |
| 09:00 | 135 | 51.8 % | 17.9 % | 0 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 09:30 | 135 | 39.3 % | 30.4 % | 0 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 10:00 | 135 | 32.1 % | 37.5 % | 0 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 10:30 | 135 | 0 % | 51.8 % | 17.9 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 11:00 | 135 | 0 % | 42.9 % | 26.8 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 11:30 | 135 | 0 % | 28.6 % | 16.1 % | 55.4 % | 36.7 % | 63.3 % | 51.9 % |
| 12:00 | 135 | 0 % | 17.9 % | 17.9 % | 64.3 % | 32.9 % | 67.1 % | 54.1 % |
| 12:30 | 135 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:00 | 128 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:30 | 127 | 0 % | 0 % | 0 % | 100 % | 8.3 % | 91.7 % | 63.8 % |
| 14:00 | 127 | 0 % | 0 % | 36.4 % | 63.6 % | 33.3 % | 66.7 % | 62.2 % |
| 14:30 | 127 | 0 % | 0 % | 32.7 % | 67.3 % | 29.2 % | 70.8 % | 68.5 % |
| 15:00 | 127 | 0 % | 0 % | 32.7 % | 67.3 % | 29.2 % | 70.8 % | 69.3 % |
| 15:30 | 127 | 0 % | 30.9 % | 29.1 % | 40 % | 54.2 % | 45.8 % | 43.3 % |
| 16:00 | 127 | 0 % | 5.5 % | 16.4 % | 78.2 % | 19.4 % | 80.6 % | 79.5 % |
| 16:30 | 127 | 0 % | 0 % | 9.1 % | 90.9 % | 6.9 % | 93.1 % | 92.1 % |
| 17:00 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 17:30 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 2607 | 13.2 % | 13.2 % | 11.7 % | 61.8 % | 33.8 % | 66.2 % |  |

### Panteón

Franjas: cada hora de 09:00 a 17:00 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 175 | 0 % | 0 % | 100 % | 0 % | 59.7 % | 40.3 % | 27.4 % |
| 10:00 | 134 | 0 % | 0 % | 59.5 % | 40.5 % | 45.7 % | 54.3 % | 50 % |
| 11:00 | 134 | 0 % | 0 % | 59.5 % | 40.5 % | 45.7 % | 54.3 % | 50 % |
| 12:00 | 175 | 0 % | 10.7 % | 58.9 % | 30.4 % | 42.9 % | 57.1 % | 48.6 % |
| 13:00 | 175 | 7.1 % | 51.8 % | 10.7 % | 30.4 % | 42.9 % | 57.1 % | 48.6 % |
| 14:00 | 175 | 7.1 % | 91.1 % | 1.8 % | 0 % | 59.7 % | 40.3 % | 27.4 % |
| 15:00 | 175 | 5.4 % | 58.9 % | 1.8 % | 33.9 % | 42.9 % | 57.1 % | 48.6 % |
| 16:00 | 134 | 0 % | 72.9 % | 4.2 % | 22.9 % | 38.4 % | 61.6 % | 47 % |
| 17:00 | 134 | 0 % | 33.3 % | 45.8 % | 20.8 % | 37.2 % | 62.8 % | 47 % |
| **Todas** | 1411 | 2.4 % | 37 % | 37.2 % | 23.5 % | 46.7 % | 53.3 % |  |

### Galería Borghese

Franjas: turnos a las horas en punto y 17:45 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 67 | 0 % | 0 % | 100 % | 0 % | 58.7 % | 41.3 % | 28.4 % |
| 10:00 | 67 | 0 % | 0 % | 90.5 % | 9.5 % | 58.7 % | 41.3 % | 28.4 % |
| 11:00 | 67 | 33.3 % | 57.1 % | 0 % | 9.5 % | 58.7 % | 41.3 % | 31.3 % |
| 12:00 | 67 | 38.1 % | 0 % | 57.1 % | 4.8 % | 54.3 % | 45.7 % | 28.4 % |
| 13:00 | 67 | 14.3 % | 0 % | 57.1 % | 28.6 % | 39.1 % | 60.9 % | 38.8 % |
| 14:00 | 67 | 14.3 % | 0 % | 57.1 % | 28.6 % | 39.1 % | 60.9 % | 28.4 % |
| 15:00 | 67 | 0 % | 23.8 % | 28.6 % | 47.6 % | 32.6 % | 67.4 % | 49.3 % |
| 16:00 | 67 | 0 % | 9.5 % | 28.6 % | 61.9 % | 26.1 % | 73.9 % | 52.2 % |
| 17:00 | 67 | 0 % | 0 % | 23.8 % | 76.2 % | 21.7 % | 78.3 % | 70.1 % |
| 17:45 | 67 | 0 % | 0 % | 23.8 % | 76.2 % | 21.7 % | 78.3 % | 59.7 % |
| **Todas** | 670 | 10 % | 9 % | 46.7 % | 34.3 % | 41.1 % | 58.9 % |  |

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
| Coliseo (Coliseo, Foro y Palatino) | 32.5 % | 41.7 % | 30.4 % | 29.8 % | 18.5 % | 49.9 % | 26.5 % |
| Museos Vaticanos | 61 % | 75.4 % | 61.3 % | 60.4 % | 66.7 % | 63.3 % | 64.3 % |
| Panteón | 54.3 % | 54.7 % | 50.4 % | 25 % | 31 % | 44.6 % | 44.9 % |
| Galería Borghese | cerrado | 60 % | 37.1 % | 73.8 % | 47.9 % | 60 % | 35.3 % |

De los 4228 casos que caben: 82 obligan a empezar antes de las 8:30 (por una reserva temprana), 544 dejan un hueco de más de 90 min entre dos paradas (la reserva está lejos de lo demás) y 2099 necesitan dejar un imprescindible en su versión corta.

## 3. Vuelos: llegada y salida como horas fijas

Llegada: se está en el centro 60 min después de aterrizar (Fiumicino, `_llegada.json`); el primer día empieza entonces. Salida: hay que dejar la ciudad 180 min antes del vuelo; el último día acaba entonces. Mismo orden de cosas que arriba; si no cabe, el día entero se cambia con otro del viaje.

|  | Hora | Casos | sin tocar | encoge o quita | cambia el día | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| llegada | 9:00 | 56 | 19.6 % | 80.4 % | 0 % | 0 % | 0 % |
| llegada | 12:00 | 56 | 0 % | 1.8 % | 10.7 % | 87.5 % | 12.5 % |
| llegada | 15:00 | 56 | 0 % | 0 % | 0 % | 100 % | 33.9 % |
| llegada | 18:00 | 56 | 0 % | 0 % | 0 % | 100 % | 73.2 % |
| llegada | 21:00 | 56 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 9:00 | 56 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 12:00 | 56 | 0 % | 0 % | 0 % | 100 % | 53.6 % |
| salida | 15:00 | 56 | 0 % | 0 % | 0 % | 100 % | 21.4 % |
| salida | 18:00 | 56 | 0 % | 0 % | 8.9 % | 91.1 % | 0 % |
| salida | 21:00 | 56 | 0 % | 87.5 % | 7.1 % | 5.4 % | 0 % |

Ojo: hoy los vuelos no pasan por el motor (los trata el cliente, `fitDayToTrip`, recortando el día sin rehacerlo). Esto mide cómo quedaría si pasaran. Con salidas a las 9:00 el último día desaparece entero (hay que dejar la ciudad a las 6:00), y con llegadas a las 21:00 el primero también: ahí «nunca se pierde un imprescindible» no se puede cumplir, y sale el aviso.

## 4. Los casos que no caben, agrupados por motivo

**Coliseo (Coliseo, Foro y Palatino)** (1062 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 40.9 % · El día que cedería su hueco no cabe en esa fecha: 17.6 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 12.9 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 10.1 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 9.4 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 8.9 % · No queda sitio para comer (entre las 12:15 y las 15:30): 0.2 %

**Museos Vaticanos** (1677 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 41.6 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 17.3 % · No queda sitio para comer (entre las 12:15 y las 15:30): 16.5 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 8.2 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 6 % · Se pisa con el atardecer, la cena o la nocturna: 5.2 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 2.9 % · El día que cedería su hueco no cabe en esa fecha: 2.4 %

**Panteón** (615 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 40 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 39.2 % · El día que cedería su hueco no cabe en esa fecha: 11.9 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 7.3 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 1.6 %

**Galería Borghese** (343 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 35 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 28.3 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 14.6 % · Se pisa con el atardecer, la cena o la nocturna: 13.4 % · El día que cedería su hueco no cabe en esa fecha: 5.8 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 2.6 % · No queda sitio para comer (entre las 12:15 y las 15:30): 0.3 %

**Free Tour** (199 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 97.5 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 2 % · Se pisa con el atardecer, la cena o la nocturna: 0.5 %

**Vuelo de llegada** (217 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 66.4 % · Se pisa con el atardecer, la cena o la nocturna: 33.6 %

**Vuelo de salida** (222 casos): No cabe antes de salir hacia el aeropuerto: 97.7 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 2.3 %

## 5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada

Mirando los días que hoy monta el motor. «Paseo recortable» = minutos de opcionales, paseos, paradas de paso y «si entra» (más lo que se puede encoger de un paseo a 10 min) que hay en ese día **antes** o **después** del sitio. «Hueco» = minutos libres entre la parada y la de al lado (sin contar el paseo): lo que midió el usuario.

| Sitio | Días con el sitio | Paseo recortable antes: media | peor día | después: media | peor día | Hueco antes: media | % días con ≥15 min | Hueco después: media | % días con ≥15 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 56 | 0 | 0 | 54.1 | 20 | 0 | — | 0 | 0 % |
| Museos Vaticanos | 56 | 10.6 | 0 | 35.4 | 0 | 0 | 0 % | 0 | 0 % |
| Panteón | 56 | 43.7 | 10 | 9.6 | 0 | 0 | 0 % | 0 | 0 % |
| Galería Borghese | 21 | 13.8 | 0 | 56.2 | 0 | 0 | 0 % | 0 | 0 % |

## 6. Horas de 10 en 10, a la más cercana

La forma que pidió el usuario: 11:32 → 11:30, 11:38 → 11:40. Las horas fijas (entradas, atardecer, recogidas, cena) mantienen su hora real y las paradas pegadas (menos de 200 m) van seguidas, sin redondear. El motor sigue calculando con minutos exactos; se redondea la hora que se enseña y la visita dura lo que cuadra hasta la siguiente.

Un caso **deja de caber de verdad** si, al redondear, una hora cae fuera del horario del sitio (antes de abrir o después de la última entrada) o un sitio abre a una hora que no es múltiplo de 10 (la tarjeta no puede ser redonda). **El coste** es otra cosa: como la visita dura lo que cuadra hasta la siguiente, al redondear a la más cercana a veces se enseña una visita unos minutos más corta; se cuentan los casos con alguna visita enseñada más de 5 min (y más de un cuarto) más corta.

| Sobre | Casos | Dejan de caber | Por qué | Con alguna visita recortada (coste) |
| --- | --- | --- | --- | --- |
| Días que monta hoy el motor (sin reservas) | 136 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 70 (51.5 %) |
| Reservas que caben: Coliseo (Coliseo, Foro y Palatino) | 2136 | 17 (0.8 %) | fuera de horario 1 · abre a media hora 16 | 1161 (54.4 %) |
| Reservas que caben: Museos Vaticanos | 930 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 555 (59.7 %) |
| Reservas que caben: Panteón | 796 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 394 (49.5 %) |
| Reservas que caben: Galería Borghese | 327 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 109 (33.3 %) |

Minutos: cada hora se mueve 2.3 min de media (mediana 2, p90 3.5), y a las visitas se les quitan 24.3 min al día en total (p90 39).

## 7. Qué días de Roma reescribir, o dónde poner un paseo, para que no quede ningún «no cabe»

### 7a. Reserva el mismo día en que ya está el grupo: lo que no cabe (y no es un cierre ni una franja imposible)

Por día escrito y sitio: cuántos casos no caben, a qué horas de entrada y qué paradas son las que lo impiden. Aquí es donde habría que poner un paseo o una parada opcional (algo que se pueda quitar) o dejar sitio de otra forma.

| Día escrito | Sitio | No cabe | Motivo principal | Horas de entrada que fallan | Paradas que lo impiden (las más repetidas) |
| --- | --- | --- | --- | --- | --- |
| D3 D | Museos Vaticanos | 108 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (51), Museos Vaticanos y Capilla Sixtina (24), Panteón (noche) (13) |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos | 95 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (85), — (9), Trastevere de noche (1) |
| D2 D | Museos Vaticanos | 86 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (8 franjas) | Panteón (noche) (30), Puente Sant'Angelo (24), — (13) |
| D3 B+sabado | Museos Vaticanos | 57 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (48), Panteón (noche) (6), — (3) |
| D3 D | Panteón | 42 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 17:00 (7 franjas) | Panteón (42) |
| D2 B+relleno_cena:Isla Tiberina | Museos Vaticanos | 39 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (29), Trastevere de noche (7), — (3) |
| D3 A | Museos Vaticanos | 38 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (30), Panteón (noche) (6), — (2) |
| D3 D+sabado | Museos Vaticanos | 36 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (16), Museos Vaticanos y Capilla Sixtina (13), Panteón (noche) (2) |
| D2 C+luz:B→C | Museos Vaticanos | 24 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (16), Trastevere de noche (6), — (2) |
| D3 A+sabado | Museos Vaticanos | 19 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (16), Panteón (noche) (2), — (1) |
| D4 A | Galería Borghese | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (19) |
| D3 C+sabado | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (16), Piazza Navona (noche) (2), — (1) |
| D3 B | Museos Vaticanos | 19 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 08:00 … 17:30 (19 franjas) | Museos Vaticanos y Capilla Sixtina (15), Panteón (noche) (3), — (1) |
| D3 C | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (15), Piazza Navona (noche) (3), — (1) |
| D3 B+sabado | Panteón | 15 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 15:00 (5 franjas) | Panteón (15) |
| D3 A | Panteón | 14 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 17:00 (7 franjas) | Panteón (14) |
| D2 A+barrios_sabores+relleno_cena:Isla Tiberina | Museos Vaticanos | 13 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (12), — (1) |
| D2 A | Museos Vaticanos | 13 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (11), Trastevere de noche (1), — (1) |
| D2 B | Museos Vaticanos | 13 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (9), Cena (3), — (1) |
| D2 B+barrios_sabores | Museos Vaticanos | 12 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (8), Trastevere de noche (3), — (1) |
| D2 C+miercoles | Museos Vaticanos | 12 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (8), Trastevere de noche (3), — (1) |
| D2 C+naturaleza_vistas | Museos Vaticanos | 12 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:30 (12 franjas) | Cúpula de San Pedro (6), Trastevere de noche (4), Mirador del Janículo (1) |
| D1 C+domingo+arte_museos+pool:Galería Borghese | Coliseo (Coliseo, Foro y Palatino) | 11 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 18:00 (11 franjas) | Arco de Constantino (8), Plaza de España (noche) (2), — (1) |
| D3 D+sabado | Panteón | 10 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 15:00 (5 franjas) | Panteón (10) |
| D4 C+domingo | Galería Borghese | 10 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (10) |
| D2 C+lunes | Museos Vaticanos | 10 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (10 franjas) | Museos Vaticanos y Capilla Sixtina (6), Trastevere de noche (3), — (1) |
| D2 C | Museos Vaticanos | 10 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (10 franjas) | Plaza de San Pedro (6), Trastevere de noche (3), — (1) |
| D1 A+domingo+pool:Galería Borghese+relleno_cena:Piazza del Popolo | Coliseo (Coliseo, Foro y Palatino) | 9 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 11:30 … 15:30 (9 franjas) | Arco de Constantino (8), — (1) |
| D4 D+domingo | Galería Borghese | 8 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 17:45 (4 franjas) | Parque de Villa Borghese (8) |
| D2 D+barrios_sabores+luz:C→D | Museos Vaticanos | 8 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (8 franjas) | Plaza de San Pedro (4), Piazza Navona (noche) (3), — (1) |

### 7b. Reserva en otro día: por qué un día no se puede cambiar por otro

El grupo solo pasa a otro día si los dos días abren en la fecha nueva. Estos son los cierres que lo impiden: **qué día escrito** (el que se movería), **qué parada** cierra y **en qué día de la semana**. «grupo» = el día del grupo no puede ir a esa fecha; «desplazado» = el día que cedería su hueco no puede ir a la fecha de origen.

| Día escrito | Cierra | El día de la semana | Papel | Casos |
| --- | --- | --- | --- | --- |
| D2 D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 184 |
| D4M D+lunes | no cabe en esa fecha | domingo | desplazado | 116 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 78 |
| D4 C+domingo | no cabe en esa fecha | viernes | desplazado | 77 |
| D3 B+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 50 |
| D4 A | Galería Borghese | lunes | desplazado | 48 |
| D2 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 29 |
| D1 C+domingo+arte_museos+pool:Galería Borghese | Galería Borghese | lunes | grupo | 29 |
| D4 D | Galería Borghese | lunes | desplazado | 29 |
| D4 D+con_free_tour | Galería Borghese | lunes | desplazado | 29 |
| D4 A+con_free_tour | Galería Borghese | lunes | desplazado | 29 |
| D4 D+domingo | Galería Borghese | lunes | desplazado | 27 |
| D2 B+barrios_sabores | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 26 |
| D2 A+barrios_sabores+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | lunes | desplazado | 24 |
| D4M B+lunes | no cabe en esa fecha | domingo | desplazado | 24 |
| D4 B+domingo | no cabe en esa fecha | viernes | desplazado | 23 |
| D3 B+sabado | Museos Vaticanos y Capilla Sixtina | domingo | grupo | 21 |
| D3 D | Museos Vaticanos y Capilla Sixtina | domingo | grupo | 21 |
| D3 D+sabado | no cabe en esa fecha | domingo | desplazado | 20 |
| D1 B+arte_museos | no cabe en esa fecha | sábado | desplazado | 20 |
| D4 C+con_free_tour+domingo | Galería Borghese | lunes | desplazado | 20 |
| D3 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 20 |
| D3 D+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 20 |
| D1 D+barrios_sabores+luz:C→D | no cabe en esa fecha | sábado | desplazado | 20 |
| D4 A+con_free_tour+domingo | Galería Borghese | lunes | desplazado | 15 |
| D2 C+luz:B→C | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 10 |
| D3 A+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 10 |
| D3 C+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 10 |

