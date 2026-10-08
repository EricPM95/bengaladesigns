# Informe de la Tanda 6n

Hechos los cuatro puntos. Lo que he decidido yo, y las listas de sitios con y sin entradas, están en `PREGUNTAS_TANDA6N.md`.

## Lo que cambia

- **Pestañita de entrada en cada tarjeta de DÍAS.** Pegada al borde derecho, a media altura. Sin reservar, naranja con el icono de entrada: al tocarla se abre la ficha del sitio directamente en su pestaña «Entradas» (no va a comprar). Reservada, verde con ✓ y la hora debajo: al tocarla se abre «Cambiar». El Coliseo y el Foro comparten entrada: al añadir la del Coliseo, el Coliseo queda con su hora y el Foro con ✓; al eliminarla, se quitan las dos. Un sitio sin entradas en los datos no lleva pestañita. La etiqueta «✓ Reservada · 13:30» y el borde verde de la tarjeta ya no salen. A 375 px no tapa el «···» ni el nombre.
- **Pestaña «Entradas» de la ficha.** Enseña todas las entradas que hay en los datos de ese sitio, una debajo de otra: nombre, qué incluye, «Desde X €» y [Reservar] (abre la compra en otra pestaña con «Abriendo la tienda de entradas…»; nunca sale el nombre del proveedor). Debajo, «¿Ya la tienes? Añádela», que abre la hoja de la hora de la 6m; reservada, «Ya tienes entrada · hora» con «Cambiar». La pestaña y el botón solo salen en sitios con entradas. No he inventado ninguna: salen de lo que los datos ya decían de pago, en `data/dias/roma/_entradas.json`, que puedes cambiar tú.
- **Fuera «Reserva obligatoria en estas fechas»** de la tarjeta del día, de RESERVAS y de la ficha.
- **Fuera el botón flotante del autobús** en DÍAS y en RUTA.

## Lo que hay que saber

- 20 sitios de Roma tienen entradas y 73 no (lista en PREGUNTAS). Tres de los 20 no tienen precio en los datos (Bioparque, Galería Nacional de Arte Moderno y Palazzo Doria Pamphilj): salen sin «Desde».
- Las fichas que se abren desde EXPLORAR o «Añadir parada» ya no tienen la pestaña «Entradas» con tarjetas de ejemplo (no vienen de un día de la ruta).

## Las pruebas

- 6g, 6h, 6i, 6j, 6k (4.483 viajes), 6l y `pruebaListas` (una de cada 5 fechas, de 1 a 6 días, 4 grupos): **0 fallos**. El motor no ha cambiado.
- **A mano a 375 px y en ordenador** (viaje con fechas 16–21 oct): pestañita naranja del Coliseo y el Foro, abre «Entradas»; [Reservar] saca «Abriendo la tienda de entradas…»; «Añádela» a las 10:00 pasa la pestañita a verde con ✓ y «10:00» (Foro, ✓); la verde abre «Cambiar»; eliminar quita las dos; 0 «Reserva obligatoria en estas fechas», 0 «✓ Reservada ·», 0 botón del autobús. Sin ver: viaje sin fechas y la Galería/Museos en la rueda.
