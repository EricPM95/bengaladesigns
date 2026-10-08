# Informe de la Tanda 6k

Hechos los diez puntos, en el orden. Las pruebas, a cero fallos. Lo que he decidido yo, y lo que no he podido ver con los ojos, está en `PREGUNTAS_TANDA6K.md`.

## Los dos fallos gordos, explicados

**1. «Algo ha ido mal» sin fechas.** La frase «Tu reserva es del jueves 31: la pasamos a tu Día 3» calculaba el día de la semana de una fecha que, sin fechas, no existe, y el navegador lanzaba un error. Ahora esa frase solo sale con fechas y no puede fallar. Además, la ventana de «Añade tu reserva» lleva una red de seguridad: si algo falla, se cierra, sale un aviso en la campana, la reserva se guarda y la app sigue. Sin fechas, la hoja dice «Para que tengas una buena experiencia en Roma, vamos a mover el día del Coliseo al día 3, con tu reserva.». Probado a mano: del día 1 al día 3, sin error y con el día 3 como el de la Roma antigua con el Coliseo a su hora.

**2. El día que se descontrolaba.** No era por ser el último día. Al guardar, la app movía la parada del Coliseo ella sola y apuntaba los dos días como «cambiados a mano»; rehacer los días se salta los días cambiados a mano, así que ninguno se rehacía. El día 1 se quedaba sin su Coliseo y con las horas corridas (la cena a la 1:15, las dos «Mañana»). Lo mismo le pasaba, desde el 5 de octubre, al ajuste de un día por una reserva normal. Ahora: la parada no se mueve sola, los días se piden todos juntos y se cambian a la vez (todo o nada), y un día no puede salir a medias. Sin vuelos, el primer y el último día son días normales: se cambian los dos días enteros, uno por otro, y algún día más solo si un cierre lo obliga (la hoja lo explica). Si un día no se puede mover (lo has tocado tú, una excursión reservada…), no se mueve nada, la reserva se guarda con su aviso y el aviso se queda en la campana.

## Lo demás

- **Horas de entrada.** Para el Coliseo, los Museos y la Galería, la rueda solo enseña las horas de la apertura a la última entrada de esa fecha, con las mejores marcadas. Si la hora no tiene lista escrita, la hoja de la regla 17: «A las 12:30 la visita no encaja bien en el día. Te proponemos las 11:00 o las 14:00.» con [las dos horas] y [Dejar las 12:30].
- **Panteón «Hoy cierra».** La pantalla escribía «Hoy cierra» para cualquier motivo de «por fuera»; el Panteón llega 5 min antes de abrir. Ahora cada motivo lleva su texto, y sin fechas nunca sale «Hoy cierra» (un sitio de temporada dice «Solo está del 24 de diciembre al 6 de enero»). 12 meses sin fechas, 0.
- **«Añade tu reserva».** El día donde ya está el sitio sale elegido, con «· aquí está ahora»; con fechas, la fecha sale elegida y solo queda la línea «Tu reserva es del jueves 31: la pasamos a tu Día 4.».
- **Mercadillos:** la tarjeta crece con su texto. **RUTA:** el mapa sin el punto del aeropuerto (la ventana de llegada lo conserva).
- **Fecha y hora:** un solo selector de cada para toda la app: hoja con el calendario (en una reserva, solo los días del viaje) y hoja con dos ruedas (o botones si hay pocas horas, como el Free Tour). Sustituyen a los campos del sistema de las reservas, los vuelos, «+ Añadir parada» de un día libre, el menú de la parada y las otras reservas.
- **D3:** Museos → Plaza → Basílica → Conciliazione → Castillo → Puente; la versión con Museos de 13:30 a 14:30 no cambia.
- **De paso:** la franja de cada parada es la de su sitio en el día (antes de la comida, «Mañana»; después, «Tarde»): con una reserva salían días con una franja con horas que no eran las suyas. `.claude/` ya no entra en el repositorio.

## Las pruebas

- **Prueba nueva de la 6k** (3.259 viajes, 14.542 días, una de cada 30 fechas y los 12 meses sin fechas): **0 fallos.** Las cinco cosas que no pueden pasar nunca (una parada cerrada a su hora, una comida o cena fuera de hora —la cena nunca después de las 22:30—, franjas repetidas o con horas ajenas, una reserva perdida, una parada inventada) y el Foro siempre con el Coliseo. Reservas del Coliseo, los Museos y la Galería movidas a cada día de viajes de 2 a 6 días (el primero y el último también), a primera hora, a mediodía y por la tarde, con y sin fechas: 0 días a medias; se cambian dos días enteros en 2.358 casos, y más de dos en 360 (cada uno comprobado contra el cambio sencillo: siempre hay un cierre que lo obliga). Sin fechas, los 12 meses: 0 «Hoy cierra». D3: 26 de 26 en el orden nuevo.
- **6g, 6h, 6i y 6j:** 0 fallos (la 6i ahora solo cuenta el orden de Villa Borghese; lo exige la 6j).
- **`pruebaListas`** (una de cada 5 fechas, de 1 a 6 días): 0 fallos en todos los grupos.
- **A mano, en el navegador a 375 px:** descrito en `PREGUNTAS_TANDA6K.md`. Visto: lo de las reservas con y sin fechas, la lista, el calendario, las ruedas, las tarjetas de Experiencias y de DÍAS. **No visto:** la hoja de la regla 17 y los botones de hora del Free Tour (probados con el servidor, no a ojo).
