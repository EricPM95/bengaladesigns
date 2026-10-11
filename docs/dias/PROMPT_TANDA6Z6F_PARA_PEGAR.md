Tanda 6z6f: los tips y HOY a pantalla completa, fuera las etiquetas de «antes, durante, después», «x de 3 listo» sin título y el autor de las fotos de Wikimedia (decidido por Eric el 11-oct-2026). Va todo en este mensaje. Si te llega cortado, está entero en docs\dias\PROMPT_TANDA6Z6F_PARA_PEGAR.md: mételo en un commit tal cual.

IMPORTANTE: como siempre, solo Roma; nada de varios destinos ni de la 6y.

1. LOS TIPS, A PANTALLA COMPLETA DE VERDAD
- La bombilla de cada tarjeta de RUTA abre los tips (TripTipsSheet). Ya son «fixed inset-0», pero se pintan dentro del panel de RUTA, así que la cabecera y la barra de abajo les quedan por encima y no se ven a pantalla completa.
- Sácalos fuera con un portal al body (como ya hacen Modal.tsx y PickerSheet.tsx), por encima de todo: de la cabecera, de la barra de abajo y del mapa. Con su X para cerrar, como ahora, y volviendo a RUTA donde estaba.
- Mira si hay más pantallas «completas» con el mismo problema (las que van dentro del panel de RUTA, DÍAS o RESERVAS) y dímelo en el informe. Arregla las que sean igual de claras.

2. HOY, A PANTALLA COMPLETA
- En HOY (de pago) no sale el mapa grande de arriba: HOY ocupa toda la pantalla, entre la cabecera de siempre (destino, cartera, campana y Perfil) y la barra de abajo, que siguen.
- HOY ya tiene su mapa pequeño en «Siguiente parada» (con [Cómo llegar]), así que no hace falta el grande.
- Igual en los tres momentos del viaje.
- Las demás pestañas, como ahora.

3. FUERA LAS ETIQUETAS «ANTES DEL VIAJE», «DURANTE», «DESPUÉS»
- Al viajero no le interesa en qué «momento» está la app. Quita esas etiquetas pequeñas de todas las pantallas (la de arriba de la tarjeta oscura de RESERVAS, las de HOY, y cualquier otra que lo diga: «Antes del viaje», «Durante el viaje», «Después del viaje» o parecidas).
- Lo que cambia según el momento se queda igual (la cuenta atrás, «Estás en Roma · día 2 de 4», «Guarda tus recuerdos»…): solo fuera la etiqueta.
- El panel de pruebas sigue con su «Momento» (es solo para Eric, fuera de producción).

4. «X DE 3 LISTO», SIN TÍTULO
- En RESERVAS, la tarjeta clara de debajo de la cuenta atrás dice ahora «Tu viaje a Roma · 0 de 3 listo». Arriba, la tarjeta oscura ya dice «Tu viaje a Roma empieza en…», así que se repite.
- Que diga solo «0 de 3 listo» (en la gratis, «0 de 2 listo»), con el mismo estilo de ahora (frambuesa, en cursiva), sus rayas de progreso y sus botones redondos debajo.

5. LAS RESPUESTAS A TUS PREGUNTAS DE LA 6Z6E
- Pregunta 1 (las fotos de Wikimedia sin autor): pon el autor y la licencia, debajo de la foto y en pequeño, igual que las de Unsplash, y también en «Créditos». Que no se pida a Wikimedia cada vez que alguien abre una ficha: pídelo una vez por foto con un script y guárdalo con los datos de la foto (como el resto de sus datos). Las de dominio público, sin línea. Si de alguna no se encuentra el autor, dímelo en el informe con su nombre y su parada, para cambiarla.
- Pregunta 2 (durante el viaje, «Hoy llueve…» y «Mañana llueve…» a la vez): bien así, los dos.
- Pregunta 3 (la campana no avisa de lluvia en los viajes ya hechos): bien así.

6. PRUEBAS
- Las de siempre a 0 fallos (con la 6z6 a la 6z6e).
- Una prueba 6z6f:
  - con los tips abiertos, no se ve ni la cabecera ni la barra de abajo;
  - en HOY no hay mapa grande, en los tres momentos;
  - en RUTA, DÍAS, EXPLORAR y RESERVAS el mapa sigue como estaba;
  - 0 textos «Antes del viaje», «Durante el viaje» ni «Después del viaje» en la app (fuera del panel de pruebas);
  - la tarjeta de RESERVAS dice «x de 3 listo» (o «x de 2») sin «Tu viaje a…» delante;
  - cada foto de Wikimedia que no sea de dominio público lleva su autor.
- A mano, a 375 px, con el panel de pruebas, gratis y de pago: los tips desde la bombilla; HOY en los tres momentos; RESERVAS antes y durante el viaje; una ficha con foto de Wikimedia. Capturas en el informe.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z6f en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
