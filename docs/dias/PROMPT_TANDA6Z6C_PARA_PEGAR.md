Tanda 6z6c: lo que se cortó de la 6z6b, las respuestas a tus preguntas, el tiempo desde nuestro servidor y una prueba de verdad de las fotos (decidido por Eric el 10-oct-2026). Va todo en este mensaje. La 6y (la ruta a mano) va después de esta: todavía NO.

Antes de empezar: he copiado en docs\dias un DIAS_ROMA_PARADAS.md nuevo (solo cambia el texto de los avisos suaves, «vas justo» entre reservas y «Día completo», que ya hiciste), GUIA_NUEVOS_DESTINOS.md, PENDIENTES_6K.md y este prompt (PROMPT_TANDA6Z6C_PARA_PEGAR.md). Pasa el documento por el convertidor y no lo toques; mete los otros en un commit tal cual. Si este mensaje te llega cortado, lee el prompt entero en ese archivo.

0. LAS RESPUESTAS A TUS PREGUNTAS DE LA 6Z6B
- Pregunta 1 (los tips): no era eso; el mensaje se cortó. Es el punto 1 de aquí.
- Pregunta 2 (la bombilla): gris, como la varita y los demás iconos finos. El frambuesa es solo para «falta».
- Pregunta 3 (en la gratis no hay Llegada y vuelta, así que no lanza el efecto): está bien.
- Pregunta 4 (los decimales de la pastilla): sin decimales cuando el importe es redondo («+100 €») y con dos cuando no («+103,13 €»). Igual en la pantalla del presupuesto, para que coincidan.
- Pregunta 5 (el globo): más grande, que llene el ancho del mapa, aunque se corte un poco el borde de arriba y de abajo. Que se siga notando que es una bola (la curva a los lados).
- Pregunta 6 (el acordeón de varios destinos con nombres de empresas): sí, pásalo a las mismas tarjetas de «Útil para el viaje», con [Comprar] y [Añadir], sin nombres de empresas.
- Pregunta 7 (TripReadinessQuickPanel.tsx): sí, bórralo, y lo que solo usaba él.
- La migración 0018_fotos_viaje.sql SÍ está aplicada en Supabase: Eric vio las 6 policies el 10-oct (punto 4).

1. LOS TIPS, CON UNA BOMBILLA EN LA TARJETA DE CADA DESTINO
- Quita la bombilla de arriba a la derecha del mapa de RUTA.
- En RUTA, en la tarjeta de cada destino (RouteOverview), un botón redondo con la bombilla (el icono «tips»), al lado de la varita («Recuperar mi ruta»), a su izquierda. Mismo tamaño y estilo que la varita (el círculo de 38 px con borde, en gris).
- Abre la hoja de los tips de siempre (TripTipsSheet) con los tips de ESE destino (data/dias/<destino>/_tips.json), no los de route.destination. Un viaje de Roma y Florencia: cada tarjeta, su bombilla con los suyos.
- Si ese destino no tiene tips, su tarjeta no lleva bombilla. La bombilla sale aunque la varita no salga (sin ruta original).
- Que el nombre del destino no se pise con los botones: si es largo, se corta con «…», como ahora.
- Los tips, solo aquí. Si salen en algún otro sitio, dime dónde y quítalos.

2. «GUARDA TUS RECUERDOS», COMO EL PROTOTIPO
- La tarjeta (TarjetaRecuerdos, en RUTA en la gratis después del viaje, y la de HOY después en la de pago), como en el diseño `docs\diseno\hoy\Iconos y HOY.dc.html`:
  - debajo del título, tres cuadros de fotos: las tres últimas fotos del viaje (en miniatura); los que estén vacíos, cuadros con borde de rayas y el icono de la cámara, que abren lo de subir fotos;
  - la línea, con el icono del mapa: «Sube tus fotos y {destino} queda en tu mapa de viajes, en tu perfil.»;
  - [Subir mis fotos] y, si ya hay fotos, [Ver mis recuerdos] (el álbum del Perfil).
  - En la gratis, debajo, en pequeño: «Una foto por parada».
- Lo demás de las fotos («Tus fotos de hoy», las miniaturas, una por parada en la gratis), como lo dejaste en la 6z6.

3. EL TIEMPO, DESDE NUESTRO SERVIDOR (estaba en la 6z5, punto 4b, y no se hizo)
- Ahora el móvil del viajero pide el tiempo directamente (src/lib/rainForecast.ts, fetchHourlyRain y fetchDailyWeather). Pásalo a nuestro servidor:
  - el servidor lo pide una vez cada pocas horas por destino (por sus coordenadas redondeadas) y lo guarda para todos;
  - la app lo pide a nuestro servidor, nunca al proveedor;
  - si el servidor no puede, la app sigue sin el tiempo, sin romper nada.
- La previsión sigue saliendo desde 5 días antes, como ahora.
- Dime en el informe cada cuánto lo pide y cuántas peticiones haría al día con 100 destinos.

4. LAS FOTOS, PROBADAS DE VERDAD
- La 0018 está aplicada. Con el Supabase de verdad (en local), con un viaje de prueba:
  - sube una foto desde la ficha de una parada;
  - comprueba que en el almacén están la grande y la pequeña («_min»), que se ve en el álbum y en «Guarda tus recuerdos», y que en la gratis «Añadir foto» pasa a «Cambiar foto»;
  - elimínala y comprueba que se borran las dos y su fila de trip_photos.
- Si algo falla, dime el error exacto en el informe. Al acabar, borra el viaje y las fotos de prueba.

5. PRUEBAS
- Las de siempre a 0 fallos (con la 6z6 y la 6z6b).
- Una prueba 6z6c:
  - 0 bombillas en el mapa de RUTA, una por destino con tips en sus tarjetas y 0 en el Perfil;
  - la pastilla sin decimales con un importe redondo;
  - 0 nombres de empresas en RESERVAS con varios destinos;
  - la app no llama nunca al proveedor del tiempo.
- A mano, a 375 px, con el panel de pruebas, en la gratis y en la de pago:
  - la bombilla en RUTA, en un viaje de un destino y en uno de dos (uno sin tips);
  - «Guarda tus recuerdos» con 0, 1 y 3 fotos;
  - el globo más grande;
  - RESERVAS de un viaje con varios destinos;
  - el aviso de lluvia, con el tiempo viniendo del servidor.
- Capturas en el informe. Borra al acabar los viajes y las fotos de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z6c en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
