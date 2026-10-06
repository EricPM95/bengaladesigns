# Preguntas de la Tanda 6e

Lo que he decidido yo. Se cambia con un dato (`listasVariantes.mjs`, `listasNombres.json`, `data/pipeline_v2/roma.json`) salvo lo que diga lo contrario.

## Lo que el fichero de la tanda decía y el documento no trae

1. **«Con los Museos reservados de 13:30 a 14:30» del D3 no está en `DIAS_ROMA_PARADAS.md`.** El punto 5b de la tanda lo describe («taxi de Navona al Borgo, comida de ~45, Museos y la Basílica al salir»), pero la sección del D3 del documento no lo trae. No lo he inventado: he escrito la lista con tus propias palabras de `PARA_CODE_TANDA6E.md` (cada variante cita su frase en ese fichero) y la Plaza de San Pedro iluminada que ya tenía el D3. Si lo escribes en el documento, esa variante sobra.
2. **La regla 17 del documento todavía cita «el Free Tour de mañana y los Museos a las 14:00» como combinación que no cabe**, y tu tanda dice que sí cabe. He hecho lo de la tanda: de 13:30 a 14:30 con Free Tour **no** se avisa (hay lista); antes de las 13:30 sí avisa («no cabe: ¿otra hora o otro día?»). Conviene que quites el ejemplo de la regla 17.

## Cortes de hora (los de tu respuesta 1)

3. **Coliseo en el D1:** hasta 10:15, día normal; 10:16–11:15, lista de 10:30–11:00; 11:16–12:15, la de 11:30–12:00; 12:16–15:15, la de mediodía; desde 15:16, la de tarde. **Coliseo en el D0:** hasta 12:15 «por la mañana» (la que ya había), 12:16–13:29 la de 12:30–14:00 con la comida después del Coliseo en Monti, 13:30–14:15 la de 12:30–14:00 con la comida antes en Armando, 14:16–15:30 la de 14:30–15:30; más tarde, sin lista. **Museos en el D2:** hasta 9:44 el día normal, de 9:45 a 12:00 media mañana, de 12:01 a 14:59 sin lista, desde 15:00 la de tarde. **Galería en el D4:** hasta 10:00 la de las 9:00; de 10:01 a 11:30 el día normal; de 11:31 a 14:00 sin lista (el turno de las 13:00); desde 14:01 la de las 15:00 o 17:00.
4. **Media mañana de los Museos: el día empieza a las 8:00** (la Basílica «a primera hora, desde las 8:00 casi sin cola»), si no, la Basílica y la Plaza no caben antes de la entrada de las 10:00 o las 10:30.
5. **El Foro después del Coliseo (D1 de 15:16 en adelante):** si el Foro está abierto a la hora a la que se llegaría (la hora del Coliseo + 1 h 30), va después; si no (invierno), el Foro desde la terraza del Campidoglio ~30, antes, como dice el documento. Lo decide el motor mirando el horario del Foro (dato nuevo en las condiciones: `abierto_tras_reserva`).
6. **El Foro por un lado u otro:** para el tiempo de andar cuenta el lado por el que se entra (Via dei Fori Imperiali) y por el que se sale (junto al Arco), como dice el documento; para el zigzag cuenta dónde está el Foro, no el lado.

## Una reserva nunca pasa un imprescindible por dentro a «de camino» o «por fuera» (regla 17)

7. **Qué es «imprescindible por dentro»:** un sitio de nivel 1 que va por dentro y que el viajero aún no ha visto por dentro en el viaje. **La excepción es el Altar de la Patria** (marcado `acortable` en `roma.json`): tus listas ya lo ponen «por fuera si va justo», así que sigue acortándose. El resto (la Basílica, el Foro, el Panteón…) se mueve antes o después de la reserva; luego se acortan otras cosas; solo al final se quita lo de menos importancia.
8. **El orden de lo que hago cuando algo no cabe antes de una hora fija:** primero mover (lo que no cabe va después, en su orden), luego acortar (de por dentro a por fuera y de por fuera a de camino, solo lo que no es de los protegidos), luego una comida de 45 min, luego quitar lo de menos y, por último, una comida de 30 min. Un acortamiento o una parada quitada solo cuenta si de verdad adelanta algo (no se acorta lo que va antes de una hora fija si después hay que esperar).
9. **La comida justo después de la hora fija:** si la hora fija acaba después de las 13:00, la comida está cerca de ella (12 min andando o menos) y no ha cabido antes, va justo después de la reserva (el Coliseo a las 13:00 en el D0 y la comida de Monti).
10. **La prueba de la regla:** 0 casos. La prueba solo mira los días con hora fija, y no cuenta lo que se acorta por un cierre ni lo que ya se vio por dentro otro día. Los casos que salen con una reserva **sin lista escrita** (regla 4) no cuentan: la regla se aplica a las horas con lista.

## Reservas «solo lo escrito» (2b)

11. **La hoja de «Añade tu reserva»** (la pregunta al servidor es `POST /api/reservation-advice`, sin Claude): enseña «Para este día, mejor a las 9:00, 10:30 …» con las horas de los tramos con lista; si la hora no tiene lista o la combinación no cabe, avisa y deja elegir otra hora (botones con las mejores), pasarla a otro día o «La quiero a esa hora». Con «La quiero a esa hora» la reserva se guarda y el motor aplica la regla 4 y lo apunta en su registro («reserva sin lista …»). El aviso solo sale para las reservas grandes (Coliseo, Museos Vaticanos y Galería Borghese).
12. **Las mejores horas** son las que escribí a mano por día (`reservas › mejores` en `listasVariantes.mjs`): D0 Coliseo 12:30, 14:00, 14:30 y 15:30; D1 Coliseo 9:00, 10:30, 11:30, 12:30, 14:00 y 16:00; D2 Museos 9:00, 10:00, 11:00, 15:00 y 16:00; D3 Museos 13:30, 14:00 y 14:30; D4 Galería 9:00, 11:00, 15:00 y 17:00. Para el D1-corto y el D1-FT (el Coliseo) no hay ninguna lista escrita: toda hora sale «sin lista» y no propone ninguna hora.
13. **La excursión de medio día y el Coliseo a las 16:00** (tu respuesta 21): se avisa si el día de la reserva lleva excursión por la mañana y la hora del Coliseo es hasta las 16:30: «Ese día tienes la excursión por la mañana. ¿Pasamos el Coliseo al día de la Roma antigua?» (el botón lleva la reserva al día D1 o D1-FT más cercano, sin Free Tour). El 16:30 es mío.

## Lo que no cabe del todo con las listas escritas (a revisar por ti; no los he tocado)

14. **Roma en un día (D0) con el Coliseo de 12:30 a 15:30:** las listas escritas llegan a la hora y no pierden ningún imprescindible, pero con nuestros tiempos de andar **la comida cae tarde** (hacia las 14:30–16:30) y, antes de la «Llegada a…», se rellenan huecos de más de 1 h con paradas cercanas. Con el Coliseo a las 14:00 (lista 12:30–14:00) la lista no cabe: Panteón, comida en Armando y los de camino necesitan unos 15 min más de los que hay entre las 8:00 y la «Llegada a…» de las 13:30; el motor pone el Panteón y la comida después del Coliseo.
15. **D1 con el Coliseo a las 11:30 y a las 12:30:** la comida cae tarde (14:40–15:30). A las 12:30 la mañana escrita (Campidoglio, Altar y Foro por dentro) no cabe antes de la «Llegada a…» de las 12:00: el Foro pasa después del Coliseo (la misma entrada).
16. **D4 con la Galería a las 9:00:** Trevi «sin gente» a las 7:30, el desayuno, el Tritón y Via Veneto no caben antes de la «Llegada a…» de las 8:30 (la Galería está lejos): Trevi y el desayuno salen después de la Galería (Trevi ya no «sin gente»). Con la Galería a las 15:00 el día va al revés como se escribe y llega a su hora; la Trinità dei Monti no abre hasta las 12:00 y sale por fuera con su aviso.
17. **D3 (Free Tour de mañana) con los Museos a las 13:30:** la comida sale de 30 min (no de 45) y se llega 1–3 min tarde (los 3 min vienen del Free Tour, que ya los traía).
18. **Con una lista escrita se tolera hasta 10 min de retraso a la reserva; con el resto, 5.** Son errores del cálculo de los trayectos, no de la lista.

## Trevi (2c)

19. **Dato:** `entrada_de_pago` en la Fontana de Trevi (2 €, de 9:00 a 22:00, los viernes desde las 11:30, última entrada a las 21:00, gratis fuera de horario, menores de 6 años, personas con discapacidad y su acompañante y residentes de Roma, solo con tarjeta). **Avisos:** a una hora anterior al pago: «Gratis y sin gente: antes de las 9:00 no se paga» (los viernes, «antes de las 11:30»); durante el pago, de día o de noche: «Hasta las 22:00, acercarte a la fuente cuesta 2 € (solo con tarjeta). Desde la plaza se ve gratis». Después de las 22:00, ningún aviso.

## Respuestas a la 6d

20. **8:** Osteria dell'Angelo vuelve a «cena»; la comida de Prati es **Il Sorpasso o Dal Toscano** (Il Sorpasso: lunes a sábado; Dal Toscano: martes a domingo, cerrado el lunes).
21. **6 (el hueco del miércoles del D2):** HOY dice «Tienes {n} min antes de Plaza de San Pedro» y sugiere el Borgo Pio y Via dei Coronari (y lo que quede cerca). En general, HOY también dice el hueco antes de una parada que no abre hasta una hora escrita (no para una espera que añade el motor).
22. **Sitios nuevos de `roma.json` (de camino, nivel 3, coordenadas aproximadas por revisar):** Via di Ripetta (Galería por la tarde) y el Lungotevere (de la 6d).
23. **Piperno:** sin cambios.
