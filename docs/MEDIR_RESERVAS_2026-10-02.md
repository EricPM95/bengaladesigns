# Reservas dentro de la ruta · 2 · Medir si cabe

Medido el 2-oct-2026 con `scripts/destino/medirReservas.mjs` (solo mide: no cambia nada de la app). 1095 viajes de 3, 4, 5 días (salida cada día de 2027: 365 fechas), 233710 reservas simuladas, 170 s.

## 🟢 Fallos de la propuesta (ninguna hora fija rota, nada cerrado, nada quitado sin aviso, atardecer y cena intactos): **0**

Cada caso resuelto se comprobó después con una revisión aparte (hora de la reserva, aperturas y última entrada, cena y nocturnas en su hora, 30 min de margen, ningún imprescindible quitado). Se resolvieron 133210 casos que caben y ninguno falló la revisión.

## 🔴 Lo que el motor de hoy ya hace mal (sin ninguna reserva)

Nada: ni visitas por dentro de sitios cerrados ni el Panteón en misa.


Misas del Panteón: el motor ya respeta los dos horarios de misa que traen los datos (sábado hasta las 16:00 y domingo de 09:00 a 09:30 y desde las 11:45). Lo que **no** cubre: las vísperas de festivo y los festivos entre semana (misa a las 17:00 y a las 10:30 respectivamente según la web), porque los datos solo conocen sábado y domingo. Los sábados y los domingos, el motor lo hace bien (ningún caso). Las vísperas y los festivos entre semana, no: salen arriba, con su fecha.

Fidelidad del modelo: de 4380 días que monta el motor, 4294 (98 %) caben tal cual en la simulación. El resto: ancla 86.

## Lo esencial, en pocas palabras

- **Coliseo (Coliseo, Foro y Palatino)**: con la reserva el mismo día que ya está la parada, cabe en 93 % de los casos (11.4 % sin tocar nada, 33.2 % encogiendo o quitando algo, 48.4 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 62 %.
- **Museos Vaticanos**: con la reserva el mismo día que ya está la parada, cabe en 51.3 % de los casos (18.6 % sin tocar nada, 16.7 % encogiendo o quitando algo, 16 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 45.7 %.
- **Panteón**: con la reserva el mismo día que ya está la parada, cabe en 99.9 % de los casos (5.8 % sin tocar nada, 45 % encogiendo o quitando algo, 49.1 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 70.8 %.
- **Galería Borghese**: con la reserva el mismo día que ya está la parada, cabe en 64.8 % de los casos (7.4 % sin tocar nada, 11.7 % encogiendo o quitando algo, 45.7 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 47.2 %.
- **Free Tour**: con la reserva el mismo día que ya está la parada, cabe en 12.1 % de los casos (0 % sin tocar nada, 4.7 % encogiendo o quitando algo, 7.4 % cambiando el orden). Con la reserva en otro día del viaje, cabe en —.
- **Vuelos**, % que no cabe — llegada: 9:00 → 5.7 %, 12:00 → 89.4 %, 15:00 → 100 %, 18:00 → 100 %, 21:00 → 100 %. Salida: 9:00 → 100 %, 12:00 → 100 %, 15:00 → 100 %, 18:00 → 98.2 %, 21:00 → 1.1 %.
- **Horas de 10 en 10, a la más cercana (sin recortar nunca más de 5 min)**: cuesta 39.3 min al día de horas enseñadas más tarde y 15 min al día de visitas recortadas; mueve cada hora 3.7 min de media; dejan de caber de verdad 0 de 3514 días (0 %) y, entre las reservas que caben, 1336 de 132150 (1 %); el coste: 4.3 % de los días llevan alguna visita enseñada más de 5 min más corta (15 min al día en total).

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
| 08:30 | 4368 | 100 % | 0 % | 0 % | 0 % | 70 % | 30 % | 22.5 % |
| 09:00 | 4368 | 67.1 % | 32.9 % | 0 % | 0 % | 57.7 % | 42.3 % | 22.5 % |
| 09:30 | 4368 | 18.4 % | 81.6 % | 0 % | 0 % | 57.7 % | 42.3 % | 22.5 % |
| 10:00 | 4368 | 16.5 % | 83.5 % | 0 % | 0 % | 57.7 % | 42.3 % | 22.5 % |
| 10:30 | 4368 | 2.6 % | 97.4 % | 0 % | 0 % | 57.7 % | 42.3 % | 22.5 % |
| 11:00 | 4368 | 0 % | 99.9 % | 0.1 % | 0 % | 57.7 % | 42.3 % | 22.5 % |
| 11:30 | 4368 | 0 % | 99.5 % | 0.5 % | 0 % | 70 % | 30 % | 22.5 % |
| 12:00 | 4368 | 0 % | 46.8 % | 53.2 % | 0 % | 70 % | 30 % | 22.5 % |
| 12:30 | 4368 | 0 % | 19.5 % | 80.5 % | 0 % | 70 % | 30 % | 22.5 % |
| 13:00 | 4368 | 0 % | 6.3 % | 93.4 % | 0.3 % | 69.8 % | 30.2 % | 22.7 % |
| 13:30 | 4356 | 0 % | 19.7 % | 80.3 % | 0 % | 69.9 % | 30.1 % | 22.5 % |
| 14:00 | 4356 | 0 % | 7.2 % | 92.8 % | 0 % | 69.9 % | 30.1 % | 22.5 % |
| 14:30 | 4356 | 0 % | 0 % | 100 % | 0 % | 69.9 % | 30.1 % | 22.5 % |
| 15:00 | 4356 | 0 % | 0 % | 98.8 % | 1.2 % | 69.7 % | 30.3 % | 22.5 % |
| 15:30 | 4356 | 0 % | 0 % | 63.4 % | 36.6 % | 45.3 % | 54.7 % | 49 % |
| 16:00 | 2844 | 0 % | 0 % | 89.3 % | 10.7 % | 65.5 % | 34.5 % | 26.8 % |
| 16:30 | 2664 | 0 % | 0 % | 91.4 % | 8.6 % | 66.1 % | 33.9 % | 25.8 % |
| 17:00 | 2520 | 0 % | 0 % | 89 % | 11 % | 64 % | 36 % | 29 % |
| 17:30 | 2520 | 0 % | 0 % | 68.7 % | 31.3 % | 50.5 % | 49.5 % | 44.2 % |
| 18:00 | 2232 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 78240 | 11.4 % | 33.2 % | 48.4 % | 7 % | 62 % | 38 % |  |

### Museos Vaticanos

Franjas: cada 30 min de 08:00 a 17:30 (web de venta oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:00 | 3609 | 99.4 % | 0 % | 0.6 % | 0 % | 87.8 % | 12.2 % | 8.5 % |
| 08:30 | 3609 | 98.8 % | 0.5 % | 0.6 % | 0 % | 87.8 % | 12.2 % | 8.5 % |
| 09:00 | 3729 | 70.3 % | 29.1 % | 0.6 % | 0 % | 86.8 % | 13.2 % | 9.3 % |
| 09:30 | 3729 | 54.7 % | 44.7 % | 0.6 % | 0 % | 86.8 % | 13.2 % | 9.3 % |
| 10:00 | 3729 | 42.2 % | 57.8 % | 0 % | 0 % | 86.8 % | 13.2 % | 9.3 % |
| 10:30 | 3729 | 2.3 % | 69.2 % | 28.5 % | 0 % | 86.8 % | 13.2 % | 9.3 % |
| 11:00 | 3729 | 2.3 % | 59 % | 38.7 % | 0 % | 86.8 % | 13.2 % | 9.3 % |
| 11:30 | 3729 | 0 % | 40.7 % | 22.6 % | 36.7 % | 55.4 % | 44.6 % | 32.5 % |
| 12:00 | 3729 | 0 % | 26.8 % | 25.8 % | 47.4 % | 48.1 % | 51.9 % | 36.9 % |
| 12:30 | 3729 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:00 | 3609 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:30 | 3585 | 0 % | 2.4 % | 0 % | 97.6 % | 8.7 % | 91.3 % | 52 % |
| 14:00 | 3585 | 0 % | 2.3 % | 49.8 % | 47.9 % | 46.2 % | 53.8 % | 51.2 % |
| 14:30 | 3585 | 0 % | 0 % | 45.2 % | 54.8 % | 39.8 % | 60.2 % | 57.2 % |
| 15:00 | 3585 | 0 % | 0 % | 44.6 % | 55.4 % | 39.2 % | 60.8 % | 59.2 % |
| 15:30 | 3585 | 0 % | 0 % | 34.3 % | 65.7 % | 30.3 % | 69.7 % | 68.5 % |
| 16:00 | 3585 | 0 % | 0 % | 24.5 % | 75.5 % | 22.7 % | 77.3 % | 76.8 % |
| 16:30 | 3585 | 0 % | 0 % | 2.3 % | 97.7 % | 2.5 % | 97.5 % | 97.5 % |
| 17:00 | 3585 | 0 % | 0 % | 2.3 % | 97.7 % | 2.5 % | 97.5 % | 97.5 % |
| 17:30 | 3585 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 72924 | 18.6 % | 16.7 % | 16 % | 48.7 % | 45.7 % | 54.3 % |  |

### Panteón

Franjas: cada hora de 09:00 a 17:00 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 4356 | 0 % | 0 % | 100 % | 0 % | 70.2 % | 29.8 % | 22.3 % |
| 10:00 | 3669 | 0 % | 0 % | 100 % | 0 % | 76.4 % | 23.6 % | 17.5 % |
| 11:00 | 3669 | 0 % | 0 % | 100 % | 0 % | 76.4 % | 23.6 % | 17.5 % |
| 12:00 | 4356 | 0 % | 16.5 % | 83.5 % | 0 % | 70.2 % | 29.8 % | 22.3 % |
| 13:00 | 4356 | 16.5 % | 83.5 % | 0 % | 0 % | 70.2 % | 29.8 % | 22.3 % |
| 14:00 | 4356 | 17 % | 83 % | 0 % | 0 % | 70.2 % | 29.8 % | 22.3 % |
| 15:00 | 4356 | 16 % | 84 % | 0 % | 0 % | 70.2 % | 29.8 % | 22.3 % |
| 16:00 | 3690 | 1 % | 99 % | 0 % | 0 % | 67 % | 33 % | 23.3 % |
| 17:00 | 3678 | 0 % | 27.9 % | 71.1 % | 1 % | 66.6 % | 33.4 % | 23.4 % |
| **Todas** | 36486 | 5.8 % | 45 % | 49.1 % | 0.1 % | 70.8 % | 29.2 % |  |

### Galería Borghese

Franjas: turnos a las horas en punto y 17:45 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 2777 | 0 % | 0 % | 100 % | 0 % | 71.1 % | 28.9 % | 21.1 % |
| 10:00 | 2777 | 0 % | 0 % | 100 % | 0 % | 71.1 % | 28.9 % | 21.1 % |
| 11:00 | 2777 | 0 % | 100 % | 0 % | 0 % | 70.4 % | 29.6 % | 21.1 % |
| 12:00 | 2777 | 39.8 % | 0 % | 48.1 % | 12 % | 58.8 % | 41.2 % | 21.1 % |
| 13:00 | 2777 | 17.2 % | 0 % | 53.9 % | 28.9 % | 50.3 % | 49.7 % | 28.4 % |
| 14:00 | 2777 | 17.2 % | 0 % | 54.8 % | 28.1 % | 50.7 % | 49.3 % | 21.1 % |
| 15:00 | 2777 | 0 % | 17.2 % | 24.6 % | 58.2 % | 34.4 % | 65.6 % | 42.1 % |
| 16:00 | 2777 | 0 % | 0 % | 30.2 % | 69.8 % | 26.5 % | 73.5 % | 56.2 % |
| 17:00 | 2777 | 0 % | 0 % | 22.7 % | 77.3 % | 19.4 % | 80.6 % | 67 % |
| 17:45 | 2777 | 0 % | 0 % | 22.7 % | 77.3 % | 19.4 % | 80.6 % | 57.8 % |
| **Todas** | 27770 | 7.4 % | 11.7 % | 45.7 % | 35.2 % | 47.2 % | 52.8 % |  |

### Free Tour (como una reserva más)

Franjas: salidas a las 10:00 y a las 17:00; el tour cubre Plaza de España, Via Condotti, Trevi, San Ignacio y Navona (esas visitas sueltas desaparecen del día porque ya se ven con el tour).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10:00 | 4380 | 0 % | 1.5 % | 4.3 % | 94.2 % | — | — | 24.1 % |
| 17:00 | 4380 | 0 % | 7.9 % | 10.5 % | 81.6 % | — | — | 67.2 % |
| **Todas** | 8760 | 0 % | 4.7 % | 7.4 % | 87.9 % | — | — |  |

Fuera de ruta: reservas de un sitio que el viaje no lleva (no se miden: la propuesta no dice qué pasa): Galería Borghese 9530. Días con el sitio cerrado (no hay franja que reservar): 1337.

### Por día de la semana de la reserva (% de «no cabe» sobre todas las franjas de ese día)

| Sitio | lun | mar | mié | jue | vie | sáb | dom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 29.6 % | 24 % | 30.4 % | 16.1 % | 16.2 % | 39.8 % | 55.4 % |
| Museos Vaticanos | 51.1 % | 53.1 % | 52.4 % | 52.9 % | 52.2 % | 53.5 % | 58.3 % |
| Panteón | 24.8 % | 18.6 % | 25.5 % | 10.5 % | 10.3 % | 16 % | 50.9 % |
| Galería Borghese | cerrado | 53.8 % | 43.9 % | 39.7 % | 41.7 % | 62.3 % | 48.2 % |

De los 133210 casos que caben: 3302 obligan a empezar antes de las 8:30 (por una reserva temprana), 14650 dejan un hueco de más de 90 min entre dos paradas (la reserva está lejos de lo demás) y 59189 necesitan dejar un imprescindible en su versión corta.

## 3. Vuelos: llegada y salida como horas fijas

Llegada: se está en el centro 60 min después de aterrizar (Fiumicino, `_llegada.json`); el primer día empieza entonces. Salida: hay que dejar la ciudad 180 min antes del vuelo; el último día acaba entonces. Mismo orden de cosas que arriba; si no cabe, el día entero se cambia con otro del viaje.

|  | Hora | Casos | sin tocar | encoge o quita | cambia el día | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| llegada | 9:00 | 1095 | 20.7 % | 73.4 % | 0.2 % | 5.7 % | 0 % |
| llegada | 12:00 | 1095 | 0 % | 5.6 % | 5 % | 89.4 % | 0.6 % |
| llegada | 15:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 9.2 % |
| llegada | 18:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 59.5 % |
| llegada | 21:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 9:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 12:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 33.9 % |
| salida | 15:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 1.1 % |
| salida | 18:00 | 1095 | 0 % | 1.7 % | 0.1 % | 98.2 % | 0.1 % |
| salida | 21:00 | 1095 | 0 % | 84.5 % | 14.4 % | 1.1 % | 0 % |

Ojo: hoy los vuelos no pasan por el motor (los trata el cliente, `fitDayToTrip`, recortando el día sin rehacerlo). Esto mide cómo quedaría si pasaran. Con salidas a las 9:00 el último día desaparece entero (hay que dejar la ciudad a las 6:00), y con llegadas a las 21:00 el primero también: ahí «nunca se pierde un imprescindible» no se puede cumplir, y sale el aviso.

## 4. Los casos que no caben, agrupados por motivo

**Coliseo (Coliseo, Foro y Palatino)** (23641 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 34.4 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 27.6 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 14.3 % · El día que cedería su hueco no cabe en esa fecha: 12 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 6.6 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 5.1 %

**Museos Vaticanos** (38362 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 43.8 % · No queda sitio para comer (entre las 12:15 y las 15:30): 18 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 16 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 9.3 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 6.6 % · Se pisa con el atardecer, la cena o la nocturna: 5.5 % · El día que cedería su hueco no cabe en esa fecha: 0.8 %

**Panteón** (7880 casos): El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 44 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 38.8 % · El día que cedería su hueco no cabe en esa fecha: 16.9 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 0.2 % · Se pisa con el atardecer, la cena o la nocturna: 0 %

**Galería Borghese** (13387 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 34.3 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 23.1 % · Se pisa con el atardecer, la cena o la nocturna: 21.8 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 20.8 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 0.1 %

**Free Tour** (7700 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 89.1 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 9.5 % · Se pisa con el atardecer, la cena o la nocturna: 1.4 %

**Vuelo de llegada** (4326 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 94.8 % · Se pisa con el atardecer, la cena o la nocturna: 5.2 %

**Vuelo de salida** (4372 casos): No cabe antes de salir hacia el aeropuerto: 100 %

## 5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada

Mirando los días que hoy monta el motor. «Paseo recortable» = minutos de opcionales, paseos, paradas de paso y «si entra» (más lo que se puede encoger de un paseo a 10 min) que hay en ese día **antes** o **después** del sitio. «Hueco» = minutos libres entre la parada y la de al lado (sin contar el paseo): lo que midió el usuario.

| Sitio | Días con el sitio | Paseo recortable antes: media | peor día | después: media | peor día | Hueco antes: media | % días con ≥15 min | Hueco después: media | % días con ≥15 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 1095 | 0 | 0 | 66.1 | 20 | 0 | — | 0 | 0 % |
| Museos Vaticanos | 1094 | 0 | 0 | 47.1 | 10 | 0 | 0 % | 0 | 0 % |
| Panteón | 1095 | 45.2 | 10 | 20.9 | 0 | 0 | 0 % | 0 | 0 % |
| Galería Borghese | 723 | 20 | 20 | 66.3 | 0 | 0 | 0 % | 0 | 0 % |

## 6. Horas de 10 en 10, a la más cercana

La forma que pidió el usuario: a la decena más cercana (11:32 → 11:30, 11:38 → 11:40), **pero nunca se recorta una visita más de 5 min: en esos casos la hora sube a la siguiente decena**. Las horas fijas (entradas, atardecer, recogidas, cena) mantienen su hora real y las paradas pegadas (menos de 200 m) van seguidas, sin redondear. El motor sigue calculando con minutos exactos; se redondea la hora que se enseña y la visita dura lo que cuadra hasta la siguiente.

Un caso **deja de caber de verdad** si, al redondear, una hora cae fuera del horario del sitio (antes de abrir o después de la última entrada) o un sitio abre a una hora que no es múltiplo de 10 (la tarjeta no puede ser redonda). **El coste** es otra cosa: como la visita dura lo que cuadra hasta la siguiente, al redondear a la más cercana a veces se enseña una visita unos minutos más corta; se cuentan los casos con alguna visita enseñada más de 5 min (y más de un cuarto) más corta.

| Sobre | Casos | Dejan de caber | Por qué | Con alguna visita recortada (coste) |
| --- | --- | --- | --- | --- |
| Días que monta hoy el motor (sin reservas) | 3514 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 151 (4.3 %) |
| Reservas que caben: Coliseo (Coliseo, Foro y Palatino) | 54599 | 868 (1.6 %) | fuera de horario 653 · abre a media hora 215 | 13467 (24.7 %) |
| Reservas que caben: Museos Vaticanos | 34562 | 468 (1.4 %) | fuera de horario 468 · abre a media hora 0 | 8549 (24.7 %) |
| Reservas que caben: Panteón | 28606 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 3054 (10.7 %) |
| Reservas que caben: Galería Borghese | 14383 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 199 (1.4 %) |

**Lo que cuesta, en minutos al día**: cada hora enseñada se mueve 3.7 min de media respecto a la real (mediana 3.7777777777777777, p90 5); en total, las horas enseñadas van 39.3 min más tarde que las reales al día (p90 58) y a las visitas se les quitan 15 min al día en total (p90 24). Los días que aun así llevan alguna visita recortada más de 5 min son los de la tabla (casi siempre, la que va justo antes de una hora fija).

## 7. Qué días de Roma reescribir, o dónde poner un paseo, para que no quede ningún «no cabe»

### 7a. Reserva el mismo día en que ya está el grupo: lo que no cabe (y no es un cierre ni una franja imposible)

Por día escrito y sitio: cuántos casos no caben, a qué horas de entrada y qué paradas son las que lo impiden. Aquí es donde habría que poner un paseo o una parada opcional (algo que se pueda quitar) o dejar sitio de otra forma.

| Día escrito | Sitio | No cabe | Motivo principal | Horas de entrada que fallan | Paradas que lo impiden (las más repetidas) |
| --- | --- | --- | --- | --- | --- |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos | 3241 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (2947), — (273), Trastevere de noche (21) |
| D2 D | Museos Vaticanos | 2384 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (8 franjas) | Panteón (noche) (798), Puente Sant'Angelo (602), — (360) |
| D2 B | Museos Vaticanos | 1176 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (811), Trastevere de noche (207), — (95) |
| D2 B+relleno_cena:Isla Tiberina | Museos Vaticanos | 975 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (738), Trastevere de noche (150), — (75) |
| D2 C | Museos Vaticanos | 696 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (11 franjas) | Plaza de San Pedro (234), Trastevere de noche (207), Museos Vaticanos y Capilla Sixtina (186) |
| D4 A | Galería Borghese | 669 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (669) |
| D2 A | Museos Vaticanos | 642 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (540), — (51), Trastevere de noche (39) |
| D4 A+domingo | Galería Borghese | 576 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (576) |
| D2 D+luz:C→D | Museos Vaticanos | 408 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:30 … 17:30 (8 franjas) | Plaza de San Pedro (204), Piazza Navona (noche) (153), — (51) |
| D4 D+domingo | Galería Borghese | 388 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 17:45 (4 franjas) | Parque de Villa Borghese (184), Cena (108), Santa Maria del Popolo (96) |
| D2 D+miercoles | Museos Vaticanos | 339 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (6 franjas) | Piazza Navona (noche) (132), Cena (88), — (69) |
| D4 B | Galería Borghese | 328 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (292), Parque de Villa Borghese (36) |
| D2 C+luz:B→C | Museos Vaticanos | 318 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (210), Trastevere de noche (81), — (27) |
| D4 B+domingo | Galería Borghese | 234 | Se pisa con el atardecer, la cena o la nocturna | 13:00 … 17:45 (6 franjas) | Terraza del Pincio (162), Santa Maria del Popolo (36), Parque de Villa Borghese (36) |
| D2 C+miercoles | Museos Vaticanos | 210 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (72), Trastevere de noche (63), Plaza de San Pedro (54) |
| D1 C | Coliseo (Coliseo, Foro y Palatino) | 181 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 17:00 … 18:00 (3 franjas) | Coliseo (82), — (70), Arco de Constantino (29) |
| D4 C | Galería Borghese | 168 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (168) |
| D4 C+domingo | Galería Borghese | 132 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (132) |
| D1 D+luz:C→D | Coliseo (Coliseo, Foro y Palatino) | 114 | La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada | 17:30 … 18:00 (2 franjas) | — (63), Arco de Constantino (34), Foro Romano y Palatino (13) |
| D2 B+fecha:easter-2 | Museos Vaticanos | 84 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (56), Trastevere de noche (21), — (7) |
| D1 D+sabado+comida:sin Plaza del Campidoglio | Coliseo (Coliseo, Foro y Palatino) | 77 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 18:00 (7 franjas) | Arco de Constantino (48), Coliseo (18), — (11) |
| D2 C+miercoles+luz:B→C | Museos Vaticanos | 72 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (48), Trastevere de noche (18), — (6) |
| D1 C+domingo | Coliseo (Coliseo, Foro y Palatino) | 34 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 18:00 (7 franjas) | Arco de Constantino (28), — (6) |
| D1 B+domingo | Coliseo (Coliseo, Foro y Palatino) | 30 | La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada | 15:30 … 17:30 (4 franjas) | — (16), Arco de Constantino (14) |
| D2 A+lunes+relleno_cena:Isla Tiberina | Museos Vaticanos | 26 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (24), — (2) |
| D4 A+fecha:01-06 | Galería Borghese | 24 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 13:00 … 17:45 (6 franjas) | Parque de Villa Borghese (24) |
| D4 B+luz:A→B | Galería Borghese | 24 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (12), Parque de Villa Borghese (12) |
| D2 D+lunes | Museos Vaticanos | 14 | Se pisa con el atardecer, la cena o la nocturna | 12:30 … 17:30 (8 franjas) | Mirador del Janículo (7), Trastevere de noche (3), — (2) |
| D1 D+sabado+comida:sin Plaza del Campidoglio | Panteón | 11 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 17:00 … 17:00 (1 franjas) | Panteón (11) |
| D1 C+domingo+fecha:primer_domingo | Coliseo (Coliseo, Foro y Palatino) | 10 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:30 … 17:30 (5 franjas) | Arco de Constantino (8), — (2) |

### 7b. Reserva en otro día: por qué un día no se puede cambiar por otro

El grupo solo pasa a otro día si los dos días abren en la fecha nueva. Estos son los cierres que lo impiden: **qué día escrito** (el que se movería), **qué parada** cierra y **en qué día de la semana**. «grupo» = el día del grupo no puede ir a esa fecha; «desplazado» = el día que cedería su hueco no puede ir a la fecha de origen.

| Día escrito | Cierra | El día de la semana | Papel | Casos |
| --- | --- | --- | --- | --- |
| D4 D+domingo | Galería Borghese | lunes | desplazado | 2052 |
| D2 D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 1753 |
| D4 A+domingo | Galería Borghese | lunes | desplazado | 1320 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 1274 |
| D4 D | Galería Borghese | lunes | desplazado | 1156 |
| D4M D+lunes | no cabe en esa fecha | domingo | desplazado | 1102 |
| D4 B+domingo | Galería Borghese | lunes | desplazado | 856 |
| D4 C+domingo | Galería Borghese | lunes | desplazado | 740 |
| D4M A+lunes | no cabe en esa fecha | domingo | desplazado | 692 |
| D4 A | Galería Borghese | lunes | desplazado | 642 |
| D4 A+domingo | no cabe en esa fecha | viernes | desplazado | 594 |
| D4 B | Galería Borghese | lunes | desplazado | 509 |
| D2 B | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 488 |
| D4M B+lunes | no cabe en esa fecha | domingo | desplazado | 458 |
| D4 B+domingo | no cabe en esa fecha | viernes | desplazado | 428 |
| D4 C | Galería Borghese | lunes | desplazado | 406 |
| D4 C+domingo | no cabe en esa fecha | viernes | desplazado | 370 |
| D2 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 362 |
| D2 C | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 346 |
| D2 D+luz:C→D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 281 |
| D2 B+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 275 |
| D4M C+lunes | no cabe en esa fecha | domingo | desplazado | 230 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | miércoles | desplazado | 224 |
| D2 C+luz:B→C | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 178 |
| D2 D | Museos Vaticanos y Capilla Sixtina | lunes | desplazado | 174 |
| D4M D+lunes+luz:C→D | no cabe en esa fecha | domingo | desplazado | 170 |
| D2 D+luz:C→D | Museos Vaticanos y Capilla Sixtina | lunes | desplazado | 145 |
| D1 D | Panteón | domingo | grupo | 120 |

