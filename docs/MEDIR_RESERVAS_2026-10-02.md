# Reservas dentro de la ruta · 2 · Medir si cabe

Medido el 2-oct-2026 con `scripts/destino/medirReservas.mjs` (solo mide: no cambia nada de la app). 1095 viajes de 3, 4, 5 días (salida cada día de 2027: 365 fechas), 233710 reservas simuladas, 175 s.

## 🟢 Fallos de la propuesta (ninguna hora fija rota, nada cerrado, nada quitado sin aviso, atardecer y cena intactos): **0**

Cada caso resuelto se comprobó después con una revisión aparte (hora de la reserva, aperturas y última entrada, cena y nocturnas en su hora, 30 min de margen, ningún imprescindible quitado). Se resolvieron 135331 casos que caben y ninguno falló la revisión.

## 🔴 Lo que el motor de hoy ya hace mal (sin ninguna reserva)

Nada: ni visitas por dentro de sitios cerrados ni el Panteón en misa.


Misas del Panteón: el motor respeta los horarios de misa de sábado y domingo y, desde el 2-oct-2026, también los de los festivos (como un domingo) y sus vísperas (como un sábado): dato misas_festivos del Panteón y massWeekday en openingHours.js. Esta medida lo comprueba contra el calendario festivo italiano de 2027. Pendiente de decidir: el 29 de junio, festivo solo en Roma.

Fidelidad del modelo: de 4380 días que monta el motor, 4321 (98.7 %) caben tal cual en la simulación. El resto: ancla 59.

## Lo esencial, en pocas palabras

- **Coliseo (Coliseo, Foro y Palatino)**: con la reserva el mismo día que ya está la parada, cabe en 92.9 % de los casos (10.9 % sin tocar nada, 31.8 % encogiendo o quitando algo, 50.2 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 66.3 %.
- **Museos Vaticanos**: con la reserva el mismo día que ya está la parada, cabe en 49.6 % de los casos (17.6 % sin tocar nada, 16.7 % encogiendo o quitando algo, 15.3 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 42.1 %.
- **Panteón**: con la reserva el mismo día que ya está la parada, cabe en 99.9 % de los casos (5.8 % sin tocar nada, 44.9 % encogiendo o quitando algo, 49.2 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 74 %.
- **Galería Borghese**: con la reserva el mismo día que ya está la parada, cabe en 65.8 % de los casos (8.3 % sin tocar nada, 13.5 % encogiendo o quitando algo, 44 % cambiando el orden). Con la reserva en otro día del viaje, cabe en 52.6 %.
- **Free Tour**: con la reserva el mismo día que ya está la parada, cabe en 11.1 % de los casos (0 % sin tocar nada, 4 % encogiendo o quitando algo, 7.1 % cambiando el orden). Con la reserva en otro día del viaje, cabe en —.
- **Vuelos**, % que no cabe — llegada: 9:00 → 0.2 %, 12:00 → 84.5 %, 15:00 → 100 %, 18:00 → 100 %, 21:00 → 100 %. Salida: 9:00 → 100 %, 12:00 → 100 %, 15:00 → 100 %, 18:00 → 97.1 %, 21:00 → 2.8 %.
- **Horas de 10 en 10, a la más cercana (sin recortar nunca más de 5 min)**: cuesta 42 min al día de horas enseñadas más tarde y 14.6 min al día de visitas recortadas; mueve cada hora 3.9 min de media; dejan de caber de verdad 0 de 3541 días (0 %) y, entre las reservas que caben, 2126 de 134356 (1.6 %); el coste: 6.6 % de los días llevan alguna visita enseñada más de 5 min más corta (14.6 min al día en total).

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
| 08:30 | 4368 | 100 % | 0 % | 0 % | 0 % | 74.7 % | 25.3 % | 19 % |
| 09:00 | 4368 | 60.8 % | 39.2 % | 0 % | 0 % | 65 % | 35 % | 19 % |
| 09:30 | 4368 | 18.1 % | 81.9 % | 0 % | 0 % | 65 % | 35 % | 19 % |
| 10:00 | 4368 | 14.2 % | 85.8 % | 0 % | 0 % | 65 % | 35 % | 19 % |
| 10:30 | 4368 | 1.9 % | 98.1 % | 0 % | 0 % | 65 % | 35 % | 19 % |
| 11:00 | 4368 | 0 % | 89.1 % | 10.9 % | 0 % | 65 % | 35 % | 19 % |
| 11:30 | 4368 | 0 % | 86.4 % | 13.6 % | 0 % | 74.7 % | 25.3 % | 19 % |
| 12:00 | 4368 | 0 % | 40.5 % | 59.5 % | 0 % | 74.7 % | 25.3 % | 19 % |
| 12:30 | 4368 | 0 % | 18.3 % | 81.7 % | 0 % | 73.8 % | 26.2 % | 19 % |
| 13:00 | 4368 | 0 % | 5.5 % | 94.2 % | 0.3 % | 72.3 % | 27.7 % | 19.2 % |
| 13:30 | 4356 | 0 % | 18.6 % | 81.4 % | 0 % | 74.7 % | 25.3 % | 19 % |
| 14:00 | 4356 | 0 % | 6 % | 94 % | 0 % | 73.7 % | 26.3 % | 19 % |
| 14:30 | 4356 | 0 % | 0 % | 100 % | 0 % | 72.5 % | 27.5 % | 19 % |
| 15:00 | 4356 | 0 % | 0 % | 98.7 % | 1.3 % | 71.8 % | 28.2 % | 19 % |
| 15:30 | 4356 | 0 % | 0 % | 62.5 % | 37.5 % | 46.6 % | 53.4 % | 46.2 % |
| 16:00 | 2844 | 0 % | 0 % | 89.3 % | 10.7 % | 67.5 % | 32.5 % | 22.7 % |
| 16:30 | 2664 | 0 % | 0 % | 90.7 % | 9.3 % | 67.8 % | 32.2 % | 21.6 % |
| 17:00 | 2520 | 0 % | 0 % | 89.7 % | 10.3 % | 66.3 % | 33.7 % | 24.2 % |
| 17:30 | 2520 | 0 % | 0 % | 67.8 % | 32.2 % | 51.5 % | 48.5 % | 41.5 % |
| 18:00 | 2232 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 78240 | 10.9 % | 31.8 % | 50.2 % | 7.1 % | 66.3 % | 33.7 % |  |

### Museos Vaticanos

Franjas: cada 30 min de 08:00 a 17:30 (web de venta oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08:00 | 3609 | 99.4 % | 0 % | 0.6 % | 0 % | 84 % | 16 % | 11.1 % |
| 08:30 | 3609 | 98.9 % | 0.5 % | 0.6 % | 0 % | 84 % | 16 % | 11.1 % |
| 09:00 | 3729 | 74.7 % | 24.7 % | 0.6 % | 0 % | 83.1 % | 16.9 % | 11.9 % |
| 09:30 | 3729 | 57.1 % | 42.2 % | 0.6 % | 0 % | 83.1 % | 16.9 % | 11.9 % |
| 10:00 | 3729 | 14.1 % | 85.9 % | 0 % | 0 % | 83.1 % | 16.9 % | 11.9 % |
| 10:30 | 3729 | 3.9 % | 73.9 % | 22.2 % | 0 % | 83.1 % | 16.9 % | 11.9 % |
| 11:00 | 3729 | 2.3 % | 59.8 % | 37.9 % | 0 % | 83.1 % | 16.9 % | 11.9 % |
| 11:30 | 3729 | 0.6 % | 31.1 % | 45.4 % | 22.9 % | 65.1 % | 34.9 % | 17.7 % |
| 12:00 | 3729 | 0 % | 8.4 % | 49 % | 42.6 % | 48.8 % | 51.2 % | 28.5 % |
| 12:30 | 3729 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:00 | 3609 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| 13:30 | 3585 | 0 % | 3.4 % | 0 % | 96.6 % | 3.6 % | 96.4 % | 52.6 % |
| 14:00 | 3585 | 0 % | 2.3 % | 50.3 % | 47.4 % | 45.2 % | 54.8 % | 49 % |
| 14:30 | 3585 | 0 % | 0 % | 47.1 % | 52.9 % | 39.6 % | 60.4 % | 57 % |
| 15:00 | 3585 | 0 % | 0 % | 29.2 % | 70.8 % | 25 % | 75 % | 64.9 % |
| 15:30 | 3585 | 0 % | 0 % | 11.7 % | 88.3 % | 9.8 % | 90.2 % | 70.2 % |
| 16:00 | 3585 | 0 % | 0 % | 6.2 % | 93.8 % | 6.7 % | 93.3 % | 81 % |
| 16:30 | 3585 | 0 % | 0 % | 2.3 % | 97.7 % | 2.5 % | 97.5 % | 97.5 % |
| 17:00 | 3585 | 0 % | 0 % | 2.3 % | 97.7 % | 2.5 % | 97.5 % | 97.5 % |
| 17:30 | 3585 | 0 % | 0 % | 0 % | 100 % | 0 % | 100 % | 100 % |
| **Todas** | 72924 | 17.6 % | 16.7 % | 15.3 % | 50.4 % | 42.1 % | 57.9 % |  |

### Panteón

Franjas: cada hora de 09:00 a 17:00 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 4356 | 0 % | 0 % | 100 % | 0 % | 74.9 % | 25.1 % | 18.8 % |
| 10:00 | 3669 | 0 % | 0 % | 100 % | 0 % | 77 % | 23 % | 17.3 % |
| 11:00 | 3669 | 0 % | 0 % | 100 % | 0 % | 77 % | 23 % | 17.3 % |
| 12:00 | 4356 | 0 % | 14.2 % | 85.8 % | 0 % | 74.9 % | 25.1 % | 18.8 % |
| 13:00 | 4356 | 14.2 % | 85.8 % | 0 % | 0 % | 74.9 % | 25.1 % | 18.8 % |
| 14:00 | 4356 | 17 % | 83 % | 0 % | 0 % | 74.9 % | 25.1 % | 18.8 % |
| 15:00 | 4356 | 15.9 % | 84.1 % | 0 % | 0 % | 74.9 % | 25.1 % | 18.8 % |
| 16:00 | 3690 | 1.2 % | 98.8 % | 0 % | 0 % | 70.4 % | 29.6 % | 20.2 % |
| 17:00 | 3678 | 0 % | 28 % | 70.8 % | 1.2 % | 65.5 % | 34.5 % | 20.2 % |
| **Todas** | 36486 | 5.8 % | 44.9 % | 49.2 % | 0.1 % | 74 % | 26 % |  |

### Galería Borghese

Franjas: turnos a las horas en punto y 17:45 (web oficial).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 09:00 | 2777 | 0 % | 0 % | 100 % | 0 % | 78.9 % | 21.1 % | 15.3 % |
| 10:00 | 2777 | 0 % | 0 % | 100 % | 0 % | 78.9 % | 21.1 % | 15.3 % |
| 11:00 | 2777 | 0 % | 100 % | 0 % | 0 % | 78.6 % | 21.4 % | 15.3 % |
| 12:00 | 2777 | 49 % | 0.6 % | 37.9 % | 12.6 % | 66.4 % | 33.6 % | 15.3 % |
| 13:00 | 2777 | 17.2 % | 0 % | 50.1 % | 32.8 % | 55.1 % | 44.9 % | 23 % |
| 14:00 | 2777 | 17.2 % | 0 % | 52.6 % | 30.3 % | 56.9 % | 43.1 % | 15.3 % |
| 15:00 | 2777 | 0 % | 17.2 % | 27.7 % | 55.2 % | 38.2 % | 61.8 % | 36.4 % |
| 16:00 | 2777 | 0 % | 17.2 % | 16 % | 66.8 % | 29 % | 71 % | 53.4 % |
| 17:00 | 2777 | 0 % | 0 % | 27.9 % | 72.1 % | 22.1 % | 77.9 % | 64.8 % |
| 17:45 | 2777 | 0 % | 0 % | 27.9 % | 72.1 % | 22.1 % | 77.9 % | 54.9 % |
| **Todas** | 27770 | 8.3 % | 13.5 % | 44 % | 34.2 % | 52.6 % | 47.4 % |  |

### Free Tour (como una reserva más)

Franjas: salidas a las 10:00 y a las 17:00; el tour cubre Plaza de España, Via Condotti, Trevi, San Ignacio y Navona (esas visitas sueltas desaparecen del día porque ya se ven con el tour).

| Hora | Casos | mismo día: sin tocar | encoge o quita | orden | no cabe | otro día: cabe | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10:00 | 4380 | 0 % | 4.1 % | 3.9 % | 92 % | — | — | 27.8 % |
| 17:00 | 4380 | 0 % | 3.9 % | 10.4 % | 85.7 % | — | — | 67.7 % |
| **Todas** | 8760 | 0 % | 4 % | 7.1 % | 88.9 % | — | — |  |

Fuera de ruta: reservas de un sitio que el viaje no lleva (no se miden: la propuesta no dice qué pasa): Galería Borghese 9530. Días con el sitio cerrado (no hay franja que reservar): 1337.

### Por día de la semana de la reserva (% de «no cabe» sobre todas las franjas de ese día)

| Sitio | lun | mar | mié | jue | vie | sáb | dom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 33.7 % | 24.9 % | 30.4 % | 16.1 % | 16.1 % | 30.2 % | 38.1 % |
| Museos Vaticanos | 54.1 % | 61.7 % | 53.5 % | 54.2 % | 54.6 % | 55 % | 59.4 % |
| Panteón | 32.1 % | 20.5 % | 26.4 % | 10.5 % | 10.2 % | 9.8 % | 26.8 % |
| Galería Borghese | cerrado | 41.3 % | 40.8 % | 38.5 % | 41.5 % | 52.3 % | 49.6 % |

De los 135331 casos que caben: 3207 obligan a empezar antes de las 8:30 (por una reserva temprana), 14706 dejan un hueco de más de 90 min entre dos paradas (la reserva está lejos de lo demás) y 64736 necesitan dejar un imprescindible en su versión corta.

## 3. Vuelos: llegada y salida como horas fijas

Llegada: se está en el centro 60 min después de aterrizar (Fiumicino, `_llegada.json`); el primer día empieza entonces. Salida: hay que dejar la ciudad 180 min antes del vuelo; el último día acaba entonces. Mismo orden de cosas que arriba; si no cabe, el día entero se cambia con otro del viaje.

|  | Hora | Casos | sin tocar | encoge o quita | cambia el día | no cabe | no cabe aun quitando lo sin clasificar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| llegada | 9:00 | 1095 | 14.2 % | 85.5 % | 0.2 % | 0.2 % | 0 % |
| llegada | 12:00 | 1095 | 0 % | 6.2 % | 9.3 % | 84.5 % | 0.4 % |
| llegada | 15:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 8.9 % |
| llegada | 18:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 59.7 % |
| llegada | 21:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 9:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 100 % |
| salida | 12:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 34.2 % |
| salida | 15:00 | 1095 | 0 % | 0 % | 0 % | 100 % | 4.7 % |
| salida | 18:00 | 1095 | 0 % | 2.7 % | 0.2 % | 97.1 % | 0.1 % |
| salida | 21:00 | 1095 | 0 % | 82.3 % | 14.9 % | 2.8 % | 0 % |

Ojo: hoy los vuelos no pasan por el motor (los trata el cliente, `fitDayToTrip`, recortando el día sin rehacerlo). Esto mide cómo quedaría si pasaran. Con salidas a las 9:00 el último día desaparece entero (hay que dejar la ciudad a las 6:00), y con llegadas a las 21:00 el primero también: ahí «nunca se pierde un imprescindible» no se puede cumplir, y sale el aviso.

## 4. Los casos que no caben, agrupados por motivo

**Coliseo (Coliseo, Foro y Palatino)** (21172 casos): Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 30.9 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 25.6 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 16.7 % · El día que cedería su hueco no cabe en esa fecha: 12.6 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 7.5 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 6.6 % · Se pisa con el atardecer, la cena o la nocturna: 0 %

**Museos Vaticanos** (40561 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 35.3 % · No queda sitio para comer (entre las 12:15 y las 15:30): 19.7 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 15.1 % · Se pisa con el atardecer, la cena o la nocturna: 13.1 % · La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada: 8.5 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 5.1 % · Algo del día cae en un horario cerrado (o pasada la última entrada): 2.6 % · El día que cedería su hueco no cabe en esa fecha: 0.4 %

**Panteón** (7128 casos): Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 42.9 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 36.2 % · El día que cedería su hueco no cabe en esa fecha: 17 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 3 % · Se pisa con el atardecer, la cena o la nocturna: 0.9 %

**Galería Borghese** (12203 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 40.8 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 25.3 % · Se pisa con el atardecer, la cena o la nocturna: 24.2 % · El día que cedería su hueco tiene algo que cierra en la nueva fecha (lunes, domingos…): 9.5 % · Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 0.1 %

**Free Tour** (7785 casos): Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben): 90.4 % · Ese día del viaje es el de la excursión (un día entero fuera: no se cambia por otro): 9.4 % · Se pisa con el atardecer, la cena o la nocturna: 0.2 %

**Vuelo de llegada** (4212 casos): Algo del día cae en un horario cerrado (o pasada la última entrada): 99 % · Se pisa con el atardecer, la cena o la nocturna: 1 %

**Vuelo de salida** (4379 casos): No cabe antes de salir hacia el aeropuerto: 100 %

## 5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada

Mirando los días que hoy monta el motor. «Paseo recortable» = minutos de opcionales, paseos, paradas de paso y «si entra» (más lo que se puede encoger de un paseo a 10 min) que hay en ese día **antes** o **después** del sitio. «Hueco» = minutos libres entre la parada y la de al lado (sin contar el paseo): lo que midió el usuario.

| Sitio | Días con el sitio | Paseo recortable antes: media | peor día | después: media | peor día | Hueco antes: media | % días con ≥15 min | Hueco después: media | % días con ≥15 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coliseo (Coliseo, Foro y Palatino) | 1095 | 0 | 0 | 62.8 | 20 | 0 | — | 0 | 0 % |
| Museos Vaticanos | 1094 | 0 | 0 | 52.7 | 10 | 0 | 0 % | 0 | 0 % |
| Panteón | 1095 | 40.7 | 10 | 22.1 | 0 | 0 | 0 % | 0 | 0 % |
| Galería Borghese | 723 | 20 | 20 | 106.3 | 0 | 0 | 0 % | 0 | 0 % |

## 6. Horas de 10 en 10, a la más cercana

La forma que pidió el usuario: a la decena más cercana (11:32 → 11:30, 11:38 → 11:40), **pero nunca se recorta una visita más de 5 min: en esos casos la hora sube a la siguiente decena**. Las horas fijas (entradas, atardecer, recogidas, cena) mantienen su hora real y las paradas pegadas (menos de 200 m) van seguidas, sin redondear. El motor sigue calculando con minutos exactos; se redondea la hora que se enseña y la visita dura lo que cuadra hasta la siguiente.

Un caso **deja de caber de verdad** si, al redondear, una hora cae fuera del horario del sitio (antes de abrir o después de la última entrada) o un sitio abre a una hora que no es múltiplo de 10 (la tarjeta no puede ser redonda). **El coste** es otra cosa: como la visita dura lo que cuadra hasta la siguiente, al redondear a la más cercana a veces se enseña una visita unos minutos más corta; se cuentan los casos con alguna visita enseñada más de 5 min (y más de un cuarto) más corta.

| Sobre | Casos | Dejan de caber | Por qué | Con alguna visita recortada (coste) |
| --- | --- | --- | --- | --- |
| Días que monta hoy el motor (sin reservas) | 3541 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 234 (6.6 %) |
| Reservas que caben: Coliseo (Coliseo, Foro y Palatino) | 57068 | 848 (1.5 %) | fuera de horario 591 · abre a media hora 257 | 14401 (25.2 %) |
| Reservas que caben: Museos Vaticanos | 32363 | 1278 (3.9 %) | fuera de horario 1278 · abre a media hora 0 | 11132 (34.4 %) |
| Reservas que caben: Panteón | 29358 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 3336 (11.4 %) |
| Reservas que caben: Galería Borghese | 15567 | 0 (0 %) | fuera de horario 0 · abre a media hora 0 | 94 (0.6 %) |

**Lo que cuesta, en minutos al día**: cada hora enseñada se mueve 3.9 min de media respecto a la real (mediana 3.7, p90 6.166666666666667); en total, las horas enseñadas van 42 min más tarde que las reales al día (p90 59) y a las visitas se les quitan 14.6 min al día en total (p90 24). Los días que aun así llevan alguna visita recortada más de 5 min son los de la tabla (casi siempre, la que va justo antes de una hora fija).

## 7. Qué días de Roma reescribir, o dónde poner un paseo, para que no quede ningún «no cabe»

### 7a. Reserva el mismo día en que ya está el grupo: lo que no cabe (y no es un cierre ni una franja imposible)

Por día escrito y sitio: cuántos casos no caben, a qué horas de entrada y qué paradas son las que lo impiden. Aquí es donde habría que poner un paseo o una parada opcional (algo que se pueda quitar) o dejar sitio de otra forma.

| Día escrito | Sitio | No cabe | Motivo principal | Horas de entrada que fallan | Paradas que lo impiden (las más repetidas) |
| --- | --- | --- | --- | --- | --- |
| D2 D | Museos Vaticanos | 2297 | Se pisa con el atardecer, la cena o la nocturna | 11:30 … 17:30 (11 franjas) | Puente Sant'Angelo (1135), Panteón (noche) (540), — (244) |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos | 2073 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (1596), — (199), Cena (141) |
| D2 B | Museos Vaticanos | 1012 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (656), Trastevere de noche (222), — (89) |
| D2 D+lunes | Museos Vaticanos | 906 | Se pisa con el atardecer, la cena o la nocturna | 12:30 … 17:30 (9 franjas) | Mirador del Janículo (426), Panteón (noche) (225), — (120) |
| D2 A+lunes+relleno_cena:Isla Tiberina | Museos Vaticanos | 819 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (744), — (63), Trastevere de noche (12) |
| D2 C | Museos Vaticanos | 795 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (261), Trastevere de noche (252), Plaza de San Pedro (198) |
| D4 A | Galería Borghese | 793 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (793) |
| D2 B+relleno_cena:Isla Tiberina | Museos Vaticanos | 678 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (495), Trastevere de noche (123), — (54) |
| D2 B+lunes | Museos Vaticanos | 540 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (372), Trastevere de noche (102), — (48) |
| D2 A | Museos Vaticanos | 429 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (273), Trastevere de noche (99), — (39) |
| D4 B | Galería Borghese | 402 | Se pisa con el atardecer, la cena o la nocturna | 13:00 … 17:45 (5 franjas) | Terraza del Pincio (358), Parque de Villa Borghese (44) |
| D4 A+domingo | Galería Borghese | 372 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 12:00 … 17:45 (7 franjas) | Parque de Villa Borghese (372) |
| D2 A+lunes | Museos Vaticanos | 306 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (258), — (24), Trastevere de noche (18) |
| D4 D+domingo | Galería Borghese | 268 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 17:45 (4 franjas) | Santa Maria del Popolo (192), Cena (76) |
| D2 D+miercoles+relleno_cena:Isla Tiberina | Museos Vaticanos | 252 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (6 franjas) | Piazza Navona (noche) (126), Cena (84), — (42) |
| D2 C+lunes | Museos Vaticanos | 240 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (84), Trastevere de noche (72), Plaza de San Pedro (60) |
| D2 C+miercoles | Museos Vaticanos | 210 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:00 … 17:30 (12 franjas) | Museos Vaticanos y Capilla Sixtina (72), Trastevere de noche (63), Plaza de San Pedro (54) |
| D4 C | Galería Borghese | 206 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (206) |
| D4 B+domingo | Galería Borghese | 200 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 13:00 … 17:45 (6 franjas) | Santa Maria del Popolo (136), Terraza del Pincio (32), Parque de Villa Borghese (24) |
| D1 C | Coliseo (Coliseo, Foro y Palatino) | 141 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 17:00 … 18:00 (3 franjas) | Coliseo (58), — (54), Arco de Constantino (29) |
| D1 D+sabado+comida:sin Plaza del Campidoglio | Coliseo (Coliseo, Foro y Palatino) | 113 | Algo del día cae en un horario cerrado (o pasada la última entrada) | 15:00 … 18:00 (7 franjas) | Arco de Constantino (50), — (44), Coliseo (18) |
| D2 D+lunes+luz:C→D | Museos Vaticanos | 108 | Se pisa con el atardecer, la cena o la nocturna | 12:30 … 17:30 (9 franjas) | Mirador del Janículo (60), Panteón (noche) (30), — (12) |
| D1 D+luz:C→D | Coliseo (Coliseo, Foro y Palatino) | 98 | La visita entera no cabe antes del cierre de ese sitio a esa hora de entrada | 17:30 … 18:00 (2 franjas) | — (55), Arco de Constantino (30), Foro Romano y Palatino (13) |
| D4 C+domingo | Galería Borghese | 94 | Se pisa con el atardecer, la cena o la nocturna | 15:00 … 17:45 (4 franjas) | Terraza del Pincio (94) |
| D4 B+luz:A→B | Galería Borghese | 88 | Se pisa con el atardecer, la cena o la nocturna | 13:00 … 17:45 (6 franjas) | Terraza del Pincio (54), Parque de Villa Borghese (32), Plaza de España (noche) (2) |
| D2 B+fecha:easter-2 | Museos Vaticanos | 77 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (49), Trastevere de noche (21), — (7) |
| D2 D+miercoles | Museos Vaticanos | 75 | No queda sitio para comer (entre las 12:15 y las 15:30) | 12:30 … 17:30 (3 franjas) | Panteón (noche) (50), — (25) |
| D2 C+miercoles+luz:B→C | Museos Vaticanos | 75 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 11:30 … 17:30 (13 franjas) | Museos Vaticanos y Capilla Sixtina (54), Trastevere de noche (15), — (6) |
| D2 C+lunes+luz:B→C | Museos Vaticanos | 66 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 12:30 … 17:30 (11 franjas) | Museos Vaticanos y Capilla Sixtina (42), Trastevere de noche (18), — (6) |
| D1 C+domingo | Coliseo (Coliseo, Foro y Palatino) | 51 | Lo de antes no llega a la puerta 30 min antes de la hora (los imprescindibles de antes no caben) | 15:00 … 18:00 (7 franjas) | Coliseo (28), Arco de Constantino (14), — (9) |

### 7b. Reserva en otro día: por qué un día no se puede cambiar por otro

El grupo solo pasa a otro día si los dos días abren en la fecha nueva. Estos son los cierres que lo impiden: **qué día escrito** (el que se movería), **qué parada** cierra y **en qué día de la semana**. «grupo» = el día del grupo no puede ir a esa fecha; «desplazado» = el día que cedería su hueco no puede ir a la fecha de origen.

| Día escrito | Cierra | El día de la semana | Papel | Casos |
| --- | --- | --- | --- | --- |
| D4 D | Galería Borghese | lunes | desplazado | 1916 |
| D2 D+lunes | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 1305 |
| D4 A | Galería Borghese | lunes | desplazado | 1103 |
| D4 B | Galería Borghese | lunes | desplazado | 869 |
| D2 A+lunes+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 720 |
| D4 C | Galería Borghese | lunes | desplazado | 646 |
| D4 A+domingo | no cabe en esa fecha | sábado | desplazado | 636 |
| D4M D | no cabe en esa fecha | domingo | desplazado | 578 |
| D4 A+domingo | no cabe en esa fecha | viernes | desplazado | 572 |
| D2 B+lunes | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 528 |
| D4 B+domingo | no cabe en esa fecha | sábado | desplazado | 444 |
| D4 B+domingo | no cabe en esa fecha | viernes | desplazado | 428 |
| D4M A | no cabe en esa fecha | domingo | desplazado | 355 |
| D2 D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 350 |
| D2 D | Museos Vaticanos y Capilla Sixtina | sábado | desplazado | 333 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 330 |
| D2 C+lunes | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 258 |
| D4M B | no cabe en esa fecha | domingo | desplazado | 230 |
| D2 A+relleno_cena:Isla Tiberina | Museos Vaticanos y Capilla Sixtina | miércoles | desplazado | 224 |
| D2 A+lunes | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 216 |
| D4 C+domingo | no cabe en esa fecha | sábado | desplazado | 176 |
| D2 D+lunes+luz:C→D | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 174 |
| D2 D | Museos Vaticanos y Capilla Sixtina | lunes | desplazado | 174 |
| D2 B | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 164 |
| D4 C+domingo | no cabe en esa fecha | viernes | desplazado | 160 |
| D2 C | Museos Vaticanos y Capilla Sixtina | domingo | desplazado | 149 |
| D2 C | Museos Vaticanos y Capilla Sixtina | lunes | desplazado | 145 |
| D4 B+luz:A→B | Galería Borghese | lunes | desplazado | 136 |

