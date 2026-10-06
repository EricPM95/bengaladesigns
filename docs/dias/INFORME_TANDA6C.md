# Informe de la Tanda 6c

Todo hecho y comprobado. No he hecho push. Lo que he decidido yo está en `PREGUNTAS_TANDA6C.md` (19 puntos). Las sugerencias que salen en los viajes de 3 y 4 días están en `INFORME_TANDA6C_SUGERENCIAS.md`.

## Lo nuevo en los días

- **D6:** la Columna y los Mercados de Trajano (~1 h) entre la Piazza Venezia y la terraza del Altar.
- **D7:** la mañana empieza en Campo de' Fiori (con su mercado) y la Plaza Farnese, y luego se cruza el Ponte Sisto hasta la Farnesina. El domingo no hay mercado: Campo de' Fiori va de camino.
- **D1:** la Columna y los Mercados de Trajano salen como primera sugerencia de HOY antes de comer, si el viaje no lleva el D6.
- **Ya no queda ningún «el día empieza más tarde»** (miércoles del D0-medio, lunes del D4, miércoles del D6). Solo queda lo que el documento dice sin esa frase: el D2 sin Museos en miércoles, donde la Plaza de San Pedro va «desde las 12:30».
- Piazza del Popolo ~30 por la tarde en el D4 (así se llega a Santa Maria del Popolo cuando abre).

## Las sugerencias de «Vas bien de tiempo»

- Salen de **todo el destino**, no solo de los días del viaje. Solo se excluye lo que sale otro día del viaje (o se avisa «Lo tienes el día n»).
- **Cerca** (en mitad de una franja): hasta 10 min andando. **Lejos** (justo antes de comer o cenar, con 1 h 30 o más de sobra): hasta 20 min andando o 15 en bus o metro.
- Si lo sugerido queda lejos, se cambia también **la comida o la cena a esa zona**, con un restaurante de verdad, abierto y sin repetir: «Plaza del Quirinal… Y comes en Trevi». Al pulsar «Añadir» se añade la parada y se cambia el restaurante; nada cambia solo.
- Siempre abierto a la hora a la que se llegaría, con tiempo de verlo, y solo sitios conocidos (de nivel 1 o 2 o que salen en el documento). **El Colle Oppio ya no sale** ni como sugerencia ni como relleno.
- Ejemplo real (3 días, D1, antes de cenar, sobran 100 min): la Columna y los Mercados de Trajano, Fontana de Trevi (con «Y cenas en Trevi»), Plaza de España, Campo de' Fiori, Boca de la Verdad…

## Lo que había quedado de la 6b

1. **Acortar antes de quitar.** Con el Coliseo a las 12:00, el D1 ya no manda el Campidoglio a «Si te sobra tiempo»: primero el Altar pasa de por dentro a por fuera (~30) y, si aún no cabe, a de camino; la comida sale hacia las 14:30. Esto vale también para un imprescindible la primera vez (se sigue viendo, solo se tarda menos). La prueba nueva `quitar_sin_acortar` da 0.
2. **San Luigi dei Francesi.** Su horario en `roma.json` estaba bien. El fallo era que el cierre se miraba con la hora de antes de ajustar el día y se enseñaba otra. Ahora, tras ajustar, se vuelve a mirar con la hora definitiva hasta que coinciden. Prueba nueva: `aviso_contradictorio` (una parada por fuera por su horario tiene que estar de verdad cerrada a esa hora) da 0.
3. **Rellenos conocidos.** Para llenar mañanas y para las sugerencias, solo sitios del documento o de nivel 1 o 2. Prueba nueva: `relleno_desconocido` da 0.
4. **Tarjeta de descanso y «Vas bien de tiempo» en la página.** `VIAJES_LISTAS.html` ya enseña la tarjeta en cada día que la tiene (27 días) y un ejemplo de HOY con sus sugerencias («3 días con un ejemplo de HOY»).
5. **Viaje «con lluvia»** de la página: ahora con la alternativa aplicada (salen el Janículo y la Isla Tiberina; entra lo que dice cada día).
6. **Galería Borghese sin reserva:** «Turno recomendado: 11:00», sin negrita y sin ser una reserva.
7. **Free Tour de mañana + Museos a las 14:00:** al meter la reserva sale «El Free Tour y los Museos a las 14:00 el mismo día no caben bien. ¿Pasamos los Museos a otro día?». Con «Sí», la reserva pasa al día más cercano sin Free Tour; con «No», se queda.
8. **Piperno** (Via Monte de' Cenci 9) como tercera opción de la comida del Gueto, con el horario de su web (martes a viernes solo cena; sábado comida y cena; domingo solo comida; lunes cerrado). **Las coordenadas y el precio son aproximados: revísalos.**
9. **Fotos:** el mirador de San Pietro in Montorio usa la del Janículo y la terraza de Largo Gaetana Agnesi la del Coliseo. Via del Babuino y Via Veneto van de camino y no llevan foto.

## Resultado de la prueba entera

125.925 viajes (todas las duraciones, 365 fechas, Free Tour, medios días, reservas, pool, lluvia): **0 fallos**, con las pruebas nuevas incluidas. Antes de arreglarlo, la prueba nueva de avisos saltó en los miércoles del D2 (esa excepción está apuntada arriba) y mi primera versión comparaba con otra tolerancia que el motor (última entrada y minuto exacto); la corregí a lo que hace el motor.

## Límites y lo que debes mirar

- El Free Tour de mañana + Museos a las 14:00 en el mismo día sigue llegando tarde si el viajero elige «No».
- El hueco de ~50 min entre el Foro y la «Llegada a…» del Coliseo a las 12:00 sigue (el motor solo rellena huecos de más de 1 h).
- Los tiempos de bus o metro de las sugerencias lejanas son una estimación (no hay datos reales).
- Las zonas de los restaurantes salen tal cual están en `roma.json` («Trevi», «Coliseo / Monti»…).
- No he probado la pantalla a mano en el móvil. tsc sin errores; servidor reiniciado y `/api/rebuild-day`, `/api/adjust-day` y `/api/check-time` responden bien.
