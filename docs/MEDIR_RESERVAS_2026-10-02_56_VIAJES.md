# Reservas dentro de la ruta · 2 · Medir si cabe

Medido el 2-oct-2026 con `scripts/destino/medirReservas.mjs` (solo mide: no cambia nada de la app). 56 viajes: los 26 de revision20.mjs y los 30 de revisionCierre.mjs, cada uno con su duración, su Free Tour y sus experiencias (si ya llevan Free Tour, ese no se mide como reserva), 8940 reservas simuladas, 7 s.

## 🟢 Fallos de la propuesta (ninguna hora fija rota, nada cerrado, nada quitado sin aviso, atardecer y cena intactos): **0**

Cada caso resuelto se comprobó después con una revisión aparte (hora de la reserva, aperturas y última entrada, cena y nocturnas en su hora, 30 min de margen, ningún imprescindible quitado). Se resolvieron 4354 casos que caben y ninguno falló la revisión.

## 🔴 Lo que el motor de hoy ya hace mal (sin ninguna reserva)

Nada: ni visitas por dentro de sitios cerrados ni el Panteón en misa.


Misas del Panteón: el motor respeta los horarios de misa de sábado y domingo y, desde el 2-oct-2026, también los de los festivos (como un domingo) y sus vísperas (como un sábado): dato misas_festivos del Panteón y massWeekday en openingHours.js. Esta medida lo comprueba contra el calendario festivo italiano de 2027. Pendiente de decidir: el 29 de junio, festivo solo en Roma.

Fidelidad del modelo: de 177 días que monta el motor, 156 (88.1 %) caben tal cual en la simulación. El resto: horario 18, ancla 3.

## Lo esencial, en pocas palabras

- **Coliseo (Coliseo, Foro y Palatino)**: con la reserva el mismo día que ya está la parada, cabe en 89 % de los casos (11 % sin tocar nada, 32 % encogiendo o quitando algo, 46.1 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 62.2 %.
- **Museos Vaticanos**: con la reserva el mismo día que ya está la parada, cabe en 36.5 % de los casos (12.8 % sin tocar nada, 13.1 % encogiendo o quitando algo, 10.6 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 31.7 %.
- **Panteón**: con la reserva el mismo día que ya está la parada, cabe en 76.1 % de los casos (2.2 % sin tocar nada, 36.4 % encogiendo o quitando algo, 37.5 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 54.1 %.
- **Galería Borghese**: con la reserva el mismo día que ya está la parada, cabe en 63.8 % de los casos (11.4 % sin tocar nada, 10.5 % encogiendo o quitando algo, 41.9 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 42.8 %.
- **Free Tour**: con la reserva el mismo día que ya está la parada, cabe en 10.5 % de los casos (0 % sin tocar nada, 2.1 % encogiendo o quitando algo, 8.4 % cambiando el orden). Con la reserva en otro día del viaje, cabe en —.
- **Vuelos**, % que no cabe — llegada: 9:00 → 0 %, 12:00 → 92.9 %, 15:00 → 100 %, 18:00 → 100 %, 21:00 → 100 %. Salida: 9:00 → 100 %, 12:00 → 100 %, 15:00 → 100 %, 18:00 → 87.5 %, 21:00 → 3.6 %.
- **Horas de 10 en 10, a la más cercana (sin recortar nunca más de 5 min)**: cuesta 44.7 min al día de horas enseñadas más tarde y 14.5 min al día de visitas recortadas; mueve cada hora 4.1 min de media; dejan de caber de verdad 0 de 137 días (0 %) y, entre las reservas que caben, 85 de 4329 (2 %); el coste: 5.1 % de los días llevan alguna visita enseñada más de 5 min más corta (14.5 min al día en total).

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
| 08:30 | 176 | 94.6 % | 5.4 % | 0 % | 0 % | 72.5 % | 27.5 % | 17 % |
| 09:00 | 176 | 69.6 % | 30.4 % | 0 % | 0 % | 62.5 % | 37.5 % | 17 % |
| 09:30 | 176 | 23.2 % | 76.8 % | 0 % | 0 % | 62.5 % | 37.5 % | 17 % |
| 10:00 | 176 | 8.9 % | 91.1 % | 0 % | 0 % | 62.5 % | 37.5 % | 17 % |
| 10:30 | 176 | 1.8 % | 96.4 % | 1.8 % | 0 % | 62.5 % | 37.5 % | 17 % |
| 11:00 | 176 | 0 % | 89.3 % | 10.7 % | 0 % | 62.5 % | 37.5 % | 17 % |
| 11:30 | 176 | 0 % | 82.1 % | 16.1 % | 1.8 % | 73.3 % | 26.7 % | 17 % |
| 12:00 | 176 | 0 % | 44.6 % | 53.6 % | 1.8 % | 73.3 % | 26.7 % | 17 % |
| 12:30 | 176 | 0 % | 25 % | 66.1 % | 8.9 % | 66.7 % | 33.3 % | 19.3 % |
| 13:00 | 176 | 0 % | 5.4 % | 83.9 % | 10.7 % | 66.7 % | 33.3 % | 23.3 % |
| 13:30 | 175 | 0 % | 25.5 % | 72.7 % | 1.8 % | 75 % | 25 % | 17.1 % |
| 14:00 | 175 | 0 % | 5.5 % | 90.9 % | 3.6 % | 74.2 % | 25.8 % | 17.1 % |
| 14:30 | 175 | 0 % | 1.8 % | 89.1 % | 9.1 % | 66.7 % | 33.3 % | 21.1 % |
| 15:00 | 175 | 0 % | 0 % | 89.1 % | 10.9 % | 64.2 % | 35.8 % | 22.9 % |
| 15:30 | 175 | 0 % | 0 % | 67.3 % | 32.7 % | 47.5 % | 52.5 % | 41.1 % |
| 16:00 | 124 | 0 % | 0 % | 82.1 % | 17.9 % | 58.8 % | 41.2 % | 26.6 % |
| 16:30 | 115 | 0 % | 0 % | 83.3 % | 16.7 % | 55.7 % | 44.3 % | 27.8 % |
| 17:00 | 113 | 0 % | 0 % | 77.8 % | 22.2 % | 54.5 % | 45.5 % | 31.9 % |
| 17:30 | 113 | 0 % | 0 % | 61.1 % | 38.9 % | 42.9 % | 57.1 % | 41.6 % |
| 18:00 | 98 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 3198 | 11 % | 32 % | 46.1 % | 11 % | 62.2 % | 37.8 % |  |

### Museos Vaticanos

Franjas: cada 30 min de 08:00 a 17:30 (web de venta oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:00 | 128 | 69.6 % | 0 % | 0 % | 30.4 % | 59.7 % | 40.3 % | 35.9 % |
| 08:30 | 128 | 69.6 % | 0 % | 0 % | 30.4 % | 59.7 % | 40.3 % | 35.9 % |
| 09:00 | 135 | 60.7 % | 8.9 % | 0 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 09:30 | 135 | 42.9 % | 26.8 % | 0 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 10:00 | 135 | 8.9 % | 60.7 % | 0 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 10:30 | 135 | 1.8 % | 58.9 % | 8.9 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 11:00 | 135 | 0 % | 42.9 % | 26.8 % | 30.4 % | 59.5 % | 40.5 % | 36.3 % |
| 11:30 | 135 | 0 % | 19.6 % | 33.9 % | 46.4 % | 43 % | 57 % | 39.3 % |
| 12:00 | 135 | 0 % | 7.1 % | 30.4 % | 62.5 % | 32.9 % | 67.1 % | 45.9 % |
| 12:30 | 135 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:00 | 128 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:30 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 63 % |
| 14:00 | 127 | 0 % | 0 % | 34.5 % | 65.5 % | 31.9 % | 68.1 % | 59.8 % |
| 14:30 | 127 | 0 % | 0 % | 30.9 % | 69.1 % | 26.4 % | 73.6 % | 69.3 % |
| 15:00 | 127 | 0 % | 0 % | 21.8 % | 78.2 % | 18.1 % | 81.9 % | 70.1 % |
| 15:30 | 127 | 0 % | 30.9 % | 10.9 % | 58.2 % | 38.9 % | 61.1 % | 44.9 % |
| 16:00 | 127 | 0 % | 5.5 % | 3.6 % | 90.9 % | 6.9 % | 93.1 % | 86.6 % |
| 16:30 | 127 | 0 % | 0 % | 10.9 % | 89.1 % | 6.9 % | 93.1 % | 91.3 % |
| 17:00 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 17:30 | 127 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 2607 | 12.8 % | 13.1 % | 10.6 % | 63.5 % | 31.7 % | 68.3 % |  |

### Panteón

Franjas: cada hora de 09:00 a 17:00 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 175 | 0 % | 0 % | 100 % | 0 % | 67.2 % | 32.8 % | 22.3 % |
| 10:00 | 130 | 0 % | 0 % | 61.4 % | 38.6 % | 51.2 % | 48.8 % | 45.4 % |
| 11:00 | 130 | 0 % | 0 % | 61.4 % | 38.6 % | 51.2 % | 48.8 % | 45.4 % |
| 12:00 | 175 | 0 % | 7.1 % | 62.5 % | 30.4 % | 50.4 % | 49.6 % | 43.4 % |
| 13:00 | 175 | 3.6 % | 57.1 % | 8.9 % | 30.4 % | 50.4 % | 49.6 % | 43.4 % |
| 14:00 | 175 | 7.1 % | 92.9 % | 0 % | 0 % | 67.2 % | 32.8 % | 22.3 % |
| 15:00 | 175 | 5.4 % | 60.7 % | 0 % | 33.9 % | 50.4 % | 49.6 % | 43.4 % |
| 16:00 | 131 | 2.3 % | 70.5 % | 2.3 % | 25 % | 49.4 % | 50.6 % | 41.2 % |
| 17:00 | 131 | 0 % | 29.5 % | 45.5 % | 25 % | 43.7 % | 56.3 % | 41.2 % |
| **Todas** | 1397 | 2.2 % | 36.4 % | 37.5 % | 23.9 % | 54.1 % | 45.9 % |  |

### Galería Borghese

Franjas: turnos a las horas en punto y 17:45 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 67 | 0 % | 0 % | 100 % | 0 % | 60.9 % | 39.1 % | 26.9 % |
| 10:00 | 67 | 0 % | 0 % | 90.5 % | 9.5 % | 60.9 % | 39.1 % | 26.9 % |
| 11:00 | 67 | 33.3 % | 57.1 % | 0 % | 9.5 % | 60.9 % | 39.1 % | 29.9 % |
| 12:00 | 67 | 52.4 % | 0 % | 42.9 % | 4.8 % | 56.5 % | 43.5 % | 26.9 % |
| 13:00 | 67 | 14.3 % | 0 % | 47.6 % | 38.1 % | 41.3 % | 58.7 % | 37.3 % |
| 14:00 | 67 | 14.3 % | 0 % | 52.4 % | 33.3 % | 45.7 % | 54.3 % | 26.9 % |
| 15:00 | 67 | 0 % | 23.8 % | 28.6 % | 47.6 % | 32.6 % | 67.4 % | 41.8 % |
| 16:00 | 67 | 0 % | 23.8 % | 9.5 % | 66.7 % | 26.1 % | 73.9 % | 50.7 % |
| 17:00 | 67 | 0 % | 0 % | 23.8 % | 76.2 % | 21.7 % | 78.3 % | 68.7 % |
| 17:45 | 67 | 0 % | 0 % | 23.8 % | 76.2 % | 21.7 % | 78.3 % | 58.2 % |
| **Todas** | 670 | 11.4 % | 10.5 % | 41.9 % | 36.2 % | 42.8 % | 57.2 % |  |

### Free Tour (como una reserva más)

Franjas: salidas a las 10:00 y a las 17:00; el tour cubre Plaza de España, Via Condotti, Trevi, San Ignacio y Navona (esas visitas sueltas desaparecen del día porque ya se ven con el tour).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10:00 | 119 | 0 % | 1.7 % | 5 % | 93.3 % | — | — | 26.1 % |
| 17:00 | 119 | 0 % | 2.5 % | 11.8 % | 85.7 % | — | — | 59.7 % |
| **Todas** | 238 | 0 % | 2.1 % | 8.4 % | 89.5 % | — | — |  |

Fuera de ruta: reservas de un sitio que el viaje no lleva (no se miden: la propuesta no dice qué pasa): Galería Borghese 830. Días con el sitio cerrado (no hay franja que reservar): 72.

### Por día de la semana de la reserva (% de «no cabe» sobre todas las franjas de ese día)

| Sitio | lun | mar | mié | jue | vie | sáb | dom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 17.5 % | 41.7 % | 30.4 % | 29.8 % | 18.5 % | 42.5 % | 26.5 % |
| Museos Vaticanos | 64 % | 75.8 % | 64.6 % | 63.8 % | 68.3 % | 64.6 % | 64.3 % |
| Panteón | 40.5 % | 54.9 % | 51.3 % | 25 % | 30 % | 37.6 % | 40.1 % |
| Galería Borghese | cerrado | 60 % | 37.1 % | 72.5 % | 47.1 % | 55.3 % | 38.7 % |

De los 4354 casos que caben: 82 obligan a empezar antes de las 8:30 (por una reserva temprana), 503 dejan un hueco de más de 90 min entre dos paradas (la reserva está lejos de lo demás) y 2289 necesitan dejar un imprescindible en su versión corta.

## 3. Vuelos: llegada y salida como horas fijas

Llegada: se está en el centro 60 min después de aterrizar (Fiumicino, `_llegada.json`); el primer día empieza entonces. Salida: hay que dejar la ciudad 180 min antes del vuelo; el último día acaba entonces. Mismo orden de cosas que arriba; si no cabe, el día entero se cambia con otro del viaje.

|  | Hora | Casos | sin tocar | encoge o quita | cambia el día | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| llegada | 9:00 | 56 | 3.6 % | 96.4 % | 0 % | 0 % | 0 % |
| llegada | 12:00 | 56 | 0 % | 1.8 % | 5.4 % | 92.9 % | 12.5 % |
| llegada | 15:00 | 56 | 0 % | 0 % | 0 % | 100 % | 33.9 % |
| llegada | 18:00 | 56 | 0 % | 0 % | 0 % | 100 % | 73.2 % |
| llegada | 21:00 | 56 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 9:00 | 56 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 12:00 | 56 | 0 % | 0 % | 0 % | 100 % | 53.6 % |
| salida | 15:00 | 56 | 0 % | 0 % | 0 % | 100 % | 26.8 % |
| salida | 18:00 | 56 | 0 % | 3.6 % | 8.9 % | 87.5 % | 0 % |
| salida | 21:00 | 56 | 0 % | 89.3 % | 7.1 % | 3.6 % | 0 % |

Ojo: hoy los vuelos no pasan por el motor (los trata el cliente, `fitDayToTrip`, recortando el día sin rehacerlo). Esto mide cómo quedaría si pasaran. Con salidas a las 9:00 el último día desaparece entero (hay que dejar la ciudad a las 6:00), y con llegadas a las 21:00 el primero también: ahí «nunca se pierde un imprescindible» no se puede cumplir, y sale el aviso.

## 4. Los casos que no caben, agrupados por motivo

**Coliseo (Coliseo, Foro y Palatino)** (936 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 37.9 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 15.6 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 14.4 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 11.5 % · El día que cedería su hueco no cabe en esa fecha: 10.1 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 10.1 % · No queda sitio para comer (entre las 12:15 y las 15:30): 0.2 %

**Museos Vaticanos** (1727 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 27.3 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 21.3 % · No queda sitio para comer (entre las 12:15 y las 15:30): 18.6 % · Se pisa con el atardecer, la cena o la nocturna: 14 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 8 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 5.8 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 2.8 % · El día que cedería su hueco no cabe en esa fecha: 2.3 %

**Panteón** (541 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 45.1 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 39.2 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 8.3 % · El día que cedería su hueco no cabe en esa fecha: 5.5 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 1.8 %

**Galería Borghese** (339 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 32.4 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 32.4 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 14.7 % · Se pisa con el atardecer, la cena o la nocturna: 11.5 % · El día que cedería su hueco no cabe en esa fecha: 5.9 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 2.7 % · No queda sitio para comer (entre las 12:15 y las 15:30): 0.3 %

**Free Tour** (213 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 98.1 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 1.9 %

**Vuelo de llegada** (220 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 66.8 % · Se pisa con el atardecer, la cena o la nocturna: 33.2 %

**Vuelo de salida** (219 casos): No cabe antes de salir hacia el aeropuerto: 97.7 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 2.3 %

## 5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada

Mirando los días que hoy monta el motor. «Paseo recortable» = minutos de opcionales, paseos, paradas de paso y «si entra» (más lo que se puede encoger de un paseo a 10 min) que hay en ese día **antes** o **después** del sitio. «Hueco» = minutos libres entre la parada y la de al lado (sin contar el paseo): lo que midió el usuario.

| Sitio | Días con el sitio | Paseo recortable antes: media | peor día | después: media | peor día | Hueco antes: media | % días con ≥15 min | Hueco después: media | % días con ≥15 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 56 | 0 | 0 | 51 | 20 | 0 | — | 0 | 0 % |
| Museos Vaticanos | 56 | 10.6 | 0 | 38 | 0 | 0 | 0 % | 0 | 0 % |
| Panteón | 56 | 40.7 | 10 | 9.5 | 0 | 0 | 0 % | 0 | 0 % |
| Galería Borghese | 21 | 13.8 | 0 | 95.2 | 0 | 0 | 0 % | 0 | 0 % |

## 6. Horas de 10 en 10, a la más cercana

La forma que pidió el usuario: a la decena más cercana (11:32 → 11:30, 11:38 → 11:40), **pero nunca se recorta una visita más de 5 min: en esos casos la hora sube a la siguiente decena**. Las horas fijas (entradas, atardecer, recogidas, cena) mantienen su hora real y las paradas pegadas (menos de 200 m) van seguidas, sin redondear. El motor sigue calculando con minutos exactos; se redondea la hora que se enseña y la visita dura lo que cuadra hasta la siguiente.

Un caso **deja de caber de verdad** si, al redondear, una hora cae fuera del horario del sitio (antes de abrir o después de la última entrada) o un sitio abre a una hora que no es múltiplo de 10 (la tarjeta no puede ser redonda). **El coste** es otra cosa: como la visita dura lo que cuadra hasta la siguiente, al redondear a la más cercana a veces se enseña una visita unos minutos más corta; se cuentan los casos con alguna visita enseñada más de 5 min (y más de un cuarto) más corta.

| Sobre | Casos | Dejan de caber | Por qué | Con alguna visita recortada (coste) |
| --- | --- | --- | --- | --- |
| Días que monta hoy el motor (sin reservas) | 137 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 7 (5.1 %) |
| Reservas que caben: Coliseo (Coliseo, Foro y Palatino) | 2262 | 50 (2.2 %) | fuera de horario 40 · abre a media hora 10 | 644 (28.5 %) |
| Reservas que caben: Museos Vaticanos | 880 | 35 (4 %) | fuera de horario 35 · abre a media hora 0 | 280 (31.8 %) |
| Reservas que caben: Panteón | 856 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 109 (12.7 %) |
| Reservas que caben: Galería Borghese | 331 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 2 (0.6 %) |

**Lo que cuesta, en minutos al día**: cada hora enseñada se mueve 4.1 min de media respecto a la real (mediana 3.8666666666666667, p90 6.166666666666667); en total, las horas enseñadas van 44.7 min más tarde que las reales al día (p90 64) y a las visitas se les quitan 14.5 min al día en total (p90 23). Los días que aun así llevan alguna visita recortada más de 5 min son los de la tabla (casi siempre, la que va justo antes de una hora fija).

## 7. Qué días de Roma reescribir, o dónde poner un paseo, para que no quede ningún «no cabe»

### 7a. Reserva el mismo día en que ya está el grupo: lo que no cabe (y no es un cierre ni una franja imposible)

Por día escrito y sitio: cuántos casos no caben, a qué horas de entrada y qué paradas son las que lo impiden. Aquí es donde habría que poner un paseo o una parada opcional (algo que se pueda quitar) o dejar sitio de otra forma.

| Día escrito | Sitio | No cabe | Motivo principal | Horas de entrada que fallan | Paradas que lo impiden (las más repetidas) |
| --- | --- | --- | --- | --- | --- |
| D3 D | Museos Vaticanos | 107 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (51), Museos Vaticanos y Capilla Sixtina (24), Panteón (noche) (12) |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos | 84 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (62), — (9), Trastevere de noche (7) |
| D2 D | Museos Vaticanos | 80 | Se pisa con el atardecer, la cena o la nocturna | 11:30 … 17:30 (11 franjas) | Puente Sant'Angelo (40), Panteón (noche) (15), Piazza Navona (noche) (9) |
| D3 B+sabado | Museos Vaticanos | 57 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (39), Puente Sant'Angelo (9), Panteón (noche) (6) |
| D3 D | Panteón | 42 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 17:00 (7 franjas) | Panteón (42) |
| D3 A | Museos Vaticanos | 38 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (24), Panteón (noche) (6), Puente Sant'Angelo (6) |
| D2 B+relleno_cena:Isla Tiberina | Museos Vaticanos | 37 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (26), Trastevere de noche (8), — (3) |
| D3 D+sabado | Museos Vaticanos | 36 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (16), Museos Vaticanos y Capilla Sixtina (13), Panteón (noche) (2) |
| D2 D+lunes | Museos Vaticanos | 36 | Se pisa con el atardecer, la cena o la nocturna | 12:30 … 17:30 (8 franjas) | Mirador del Janículo (16), Trastevere de noche (6), Panteón (noche) (6) |
| D2 B | Museos Vaticanos | 33 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (21), Trastevere de noche (6), — (3) |
| D3 A+sabado | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (13), Puente Sant'Angelo (3), Panteón (noche) (2) |
| D3 C+sabado | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (16), Piazza Navona (noche) (2), — (1) |
| D3 B | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (12), Panteón (noche) (3), Puente Sant'Angelo (3) |
| D3 C | Museos Vaticanos | 19 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 08:00 … 17:30 (19 franjas) | Plaza de San Pedro (15), Piazza Navona (noche) (3), — (1) |
| D3 B+sabado | Panteón | 15 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 15:00 (5 franjas) | Panteón (15) |
| D3 A | Panteón | 14 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 17:00 (7 franjas) | Panteón (14) |
| D4 A | Galería Borghese | 13 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (13) |
| D2 D+naturaleza_vistas | Museos Vaticanos | 12 | Se pisa con el atardecer, la cena o la nocturna | 11:30 … 17:30 (12 franjas) | Panteón (noche) (5), Puente Sant'Angelo (4), Museos Vaticanos y Capilla Sixtina (1) |
| D2 C+miercoles | Museos Vaticanos | 12 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (8), Trastevere de noche (3), — (1) |
| D2 A+barrios_sabores+relleno_cena:Isla Tiberina | Museos Vaticanos | 11 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (8), Trastevere de noche (2), — (1) |
| D1 C+domingo+arte_museos+pool:Galería Borghese | Coliseo (Coliseo, Foro y Palatino) | 11 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 18:00 (11 franjas) | Arco de Constantino (8), Plaza de España (noche) (2), — (1) |
| D2 C+lunes | Museos Vaticanos | 11 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (7), Trastevere de noche (3), — (1) |
| D2 B+lunes+barrios_sabores | Museos Vaticanos | 11 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (7), Cena (3), — (1) |
| D2 A | Museos Vaticanos | 11 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (7), Trastevere de noche (3), — (1) |
| D2 D+barrios_sabores | Museos Vaticanos | 11 | Se pisa con el atardecer, la cena o la nocturna | 11:30 … 17:30 (11 franjas) | Puente Sant'Angelo (6), Piazza Navona (noche) (3), Plaza de San Pedro (1) |
| D2 C+naturaleza_vistas | Museos Vaticanos | 11 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (11 franjas) | Cúpula de San Pedro (6), Trastevere de noche (4), — (1) |
| D3 D+sabado | Panteón | 10 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 10:00 … 15:00 (5 franjas) | Panteón (10) |
| D4 C+domingo | Galería Borghese | 10 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (10) |
| D2 C | Museos Vaticanos | 10 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (10 franjas) | Plaza de San Pedro (6), Trastevere de noche (3), — (1) |
| D1 D+sabado+comida:sin Plaza del Campidoglio | Coliseo (Coliseo, Foro y Palatino) | 9 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 18:00 (7 franjas) | Arco de Constantino (6), — (3) |

### 7b. Reserva en otro día: por qué un día no se puede cambiar por otro

El grupo solo pasa a otro día si los dos días abren en la fecha nueva. Estos son los cierres que lo impiden: **qué día escrito** (el que se movería), **qué parada** cierra y **en qué día de la semana**. «grupo» = el día del grupo no puede ir a esa fecha; «desplazado» = el día que cedería su hueco no puede ir a la fecha de origen.

| Día escrito | Cierra | El día de la semana | Papel | Casos |
| --- | --- | --- | --- | --- |
| D2 D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 91 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 76 |
| D4 C+domingo | no cabe en esa fecha | viernes | desplazado | 53 |
| D3 B+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 50 |
| D4 A | Galería Borghese | lunes | desplazado | 46 |
| D1 C+domingo+arte_museos+pool:Galería Borghese | Galería Borghese | lunes | grupo | 29 |
| D4 D | Galería Borghese | lunes | desplazado | 29 |
| D2 D+lunes | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 29 |
| D4M D | no cabe en esa fecha | domingo | desplazado | 29 |
| D4 D+con_free_tour | Galería Borghese | lunes | desplazado | 29 |
| D4 A+con_free_tour | Galería Borghese | lunes | desplazado | 29 |
| D2 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 27 |
| D2 A+barrios_sabores+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | lunes | desplazado | 24 |
| D4 B+domingo | no cabe en esa fecha | viernes | desplazado | 23 |
| D3 B+sabado | Museos Vaticanos y Capilla Sixtina | domingo | grupo | 21 |
| D3 D | Museos Vaticanos y Capilla Sixtina | domingo | grupo | 21 |
| D3 D+sabado | no cabe en esa fecha | domingo | desplazado | 20 |
| D1 B+arte_museos | no cabe en esa fecha | sábado | desplazado | 20 |
| D2 B | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 20 |
| D4 C+con_free_tour+domingo | Galería Borghese | lunes | desplazado | 20 |
| D3 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 20 |
| D3 D+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 20 |
| D1 D+barrios_sabores+luz:C→D | no cabe en esa fecha | sábado | desplazado | 20 |
| D4 A+con_free_tour+domingo | Galería Borghese | lunes | desplazado | 15 |
| D3 A+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 10 |
| D3 C+sabado | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 10 |
| D3 D | Panteón | domingo | desplazado | 10 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | miércoles | desplazado | 10 |

