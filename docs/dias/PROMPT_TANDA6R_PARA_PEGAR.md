Tanda 6r: ninguna parada que no esté escrita, y el Free Tour con su nombre nuevo. Va todo en este mensaje.

Antes de empezar: he copiado un DIAS_ROMA_PARADAS.md nuevo en docs\dias. Cambia dos cosas: la regla 3 (las horas fijas solo se ven en la pestañita verde, como ya hiciste en la 6q) y el nombre del Free Tour, que ahora es «Free Tour por Roma». Pásalo por el convertidor y no lo toques.

1. Lo que ha pasado
En un viaje de prueba que acabo de crear, en DÍAS sale esto seguido:
- Panteón (con su pestañita de entrada);
- «Via del Babuino» como parada entera: tarjeta propia, número 3, etiqueta «Calle», 10 min y el recuadro de la foto vacío;
- el Free Tour, reservado a las 12:00.
En el documento, Via del Babuino solo va «de camino» (en el DT-medio), nunca como parada. Y el D3 solo tiene escrito el Free Tour de las 10:00, no el de las 12:00.

Búscalo: crea viajes de 2, 3 y 4 días, con y sin fechas, con el Free Tour reservado a cada una de sus horas (10:00, 12:00, 15:00, 17:00 y 21:00), hasta que salga. Dime en el informe, en palabras sencillas, qué parte de la app ha metido Via del Babuino como parada y por qué (¿para rellenar el hueco hasta las 12:00?, ¿por estar cerca de la salida del Free Tour?, ¿otra cosa?).

2. La regla, para todos los destinos (a INVARIANTES)
- Una tarjeta de parada solo sale si el documento la escribe como parada ese día, o si el viajero la ha añadido él mismo con «Añadir parada».
- La app nunca mete paradas por su cuenta para llenar un hueco (regla 3: sin ajustes, sin rellenos, sin alargar). Si sobra tiempo antes de una reserva, se espera (regla 7) o sale «Si te sobra tiempo» (regla 5), como dice el documento.
- Las calles de paso y lo que el documento pone «de camino» solo van en la tarjeta «De camino a…», sin foto propia (regla 9).
- Si la hora reservada no tiene día escrito, sale la hoja de la regla 17 (la de las dos horas propuestas), como ya hace la 6k. No se inventa nada.
- Nunca una tarjeta con el recuadro de la foto vacío (ya estaba en la 6f): si una parada no tiene foto, la tarjeta sale sin ese recuadro. Mira por qué ha vuelto a salir.

3. El nombre del Free Tour
- «Free Tour por Roma» en toda la app: DÍAS, RESERVAS, HOY, las fichas, «Añadir parada», las hojas y los avisos. Fuera «Free Tour Centro Histórico».
- Que el convertidor lo siga reconociendo como el mismo sitio (mismo id, misma foto, mismo enlace).
- Busca en los textos de la app cualquier otro «centro» que lea el viajero (fuera de los nombres de zona como «Centro (Panteón, Trevi, Navona)») y dime cuáles son, sin cambiarlos.

4. La prueba
Añade una prueba 6r que recorra todos los viajes de la prueba de siempre, con y sin fechas, y con cada reserva a cada una de sus horas (Coliseo, Museos, Galería, Free Tour…), y que dé fallo si:
- sale una tarjeta de parada que no está escrita en el documento para ese día (salvo las que añade el viajero);
- sale como parada algo que el documento pone «de camino»;
- sale una tarjeta con el recuadro de la foto vacío;
- sale «Free Tour Centro Histórico» en algún sitio.
Pon en el informe una captura del viaje del punto 1, antes y después.

Cómo trabajar: lo de siempre (PROGRESO, PREGUNTAS e INFORME de la 6r en docs/dias, commits locales por bloques). Las pruebas de siempre a 0 fallos (6g, 6h, 6i, 6j, 6k, 6l, la de la 6o, pruebaListas y la nueva 6r). Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
