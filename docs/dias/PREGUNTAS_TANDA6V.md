# Preguntas de la Tanda 6v

1. **Lo del servidor que ya no se usa.** El servidor sigue calculando el «consejo» de la regla 17 (`consejoDeReserva`, en `/api/reservation-plan` y `/api/reservation-advice`), pero la app ya no lo lee ni lo enseña. Lo dejé porque las pruebas del motor (6k) lo usan; si quieres, lo quito en otra tanda.
2. **«Por dentro».** «En tu ruta» solo cuenta las paradas que van por dentro. El Castillo de Sant'Angelo, que en los viajes de Roma casi siempre se ve por fuera, ahora sale en «Ver más». Lo mismo le pasaría al Coliseo en un viaje corto en el que se ve por fuera.
3. **Cuánto dura cada reserva para decir que se pisan.** Lo que dura la visita de ese sitio en la ruta (los sitios que cubre la entrada, sumados; el Free Tour, 2 h 30; si no se sabe, 1 h 30). Si una acaba justo cuando empieza la otra (Free Tour de 10:00 a 12:30 y Museos a las 12:30), no cuenta como pisarse. Las excursiones no cuentan.
4. **Cuándo sube la hoja del aviso.** Solo cuando, al guardar una reserva, aparece un solape nuevo. Al abrir un viaje que ya tenía dos reservas pisadas, sube solo en la campana (no sale la hoja cada vez que se abre el viaje).
5. **«Ninguna en tu ruta».** Si el viaje no lleva ninguna entrada por dentro, el bloque dice «Ninguna en tu ruta» (sin «0 de 0») y solo enseña «Ver n más».
6. **La hoja que explica qué día se mueve** (la de la 6k, «De acuerdo») sigue como estaba: no es la de «no encaja bien». Solo sale cuando una reserva grande hace cambiar de día algo.
7. **«Cambiar» del alojamiento** con una zona elegida abre directamente la hoja de la rueda (ya no despliega nada).
8. **La rueda de las zonas** enseña el nombre de cada zona; lo de «Popolo, Via del Corso» o «Vaticano» sale debajo de la rueda, en pequeño, para la zona que estás mirando.
