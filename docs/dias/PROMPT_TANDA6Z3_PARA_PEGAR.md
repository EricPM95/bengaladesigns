Tanda 6z3: la barra nueva, HOY según el momento, los iconos, el color frambuesa, los días con su fecha y las fotos del viaje. Va todo en este mensaje. La 6z2 ya está subida: puedes empezar. No cambia cómo se montan los días. La 6y (la ruta a mano) sigue sin hacerse: va después de esta.

Antes de empezar: he copiado este prompt (docs\dias\PROMPT_TANDA6Z3_PARA_PEGAR.md), PENDIENTES_6K.md y PROMPT_TANDA6Y_PARA_PEGAR.md en docs\dias, y el diseño en docs\diseno\hoy\ («Iconos y HOY.dc.html» y su support.js). Mételos en un commit tal cual. El diseño manda en lo visual; los textos y las reglas, los de este prompt.

1. LA BARRA DE ABAJO, NUEVA Y FIJA (diseño: «La barra de abajo»)
- Cinco pestañas, siempre las mismas, antes, durante y después del viaje, en la gratis y en la de pago: Hoy · Ruta · Días · Explorar · Reservas. Cada una con su icono y su nombre debajo; la activa, como en el diseño (la píldora clara). Reservas, con su «!» cuando falta algo (como ahora).
- Sustituye a la barra de ahora (`BottomBar.tsx`: Presupuesto · Perfil · Reservas) y a las pestañas de arriba (`ModeSwitcher.tsx`: Hoy · Ruta · Días · Explorar). Las de arriba se quitan.
- HOY sale siempre (hoy solo sale con fechas del viaje, `showToday`): punto 3.
- La barra nunca cambia ni se esconde según el momento del viaje.

2. LA CABECERA (diseño: «La cabecera»)
- A la izquierda, el destino («Roma») y debajo «13 – 16 oct · 2 personas» (sin fechas: el mes, «octubre · 2 personas»).
- A la derecha: Presupuesto (la cartera; abre la pantalla de la 6z2), la campana de los avisos (con su punto si hay algo nuevo; es la campana que ya hay) y el Perfil (la inicial del viajero en su círculo; abre lo que hoy abre el círculo del centro de la barra: «Mis viajes»).
- El «+» de nuevo viaje, donde esté ahora en la cabecera, si cabe; si no, dentro del Perfil, en «Mis viajes». Dime dónde lo pones.

3. HOY, SEGÚN EL MOMENTO (diseño: «Hoy, según el momento»)
Lo de dentro de HOY cambia; la barra no. Ya hay piezas de HOY (`src/components/route/today/`): úsalas y cámbialas a este diseño.
- **Antes del viaje** (gratis y de pago):
  - la tarjeta oscura con la cuenta atrás: «Tu viaje a {destino} empieza en» y «{n} días» (los días que faltan, de la fecha de hoy a la del viaje);
  - «Te falta por reservar», con el número («2 por reservar») y cada cosa con su [Reservar], que abre la ficha de ese sitio en su pestaña «Entradas» (como en RESERVAS, 6v): las entradas de «EN TU RUTA» sin reservar, el alojamiento (abre la pantalla del mapa de la 6z) y, en la de pago, la llegada y la vuelta;
  - lo ya hecho, en verde con ✓ («Alojamiento · Hotel Artemide»; en la de pago, con la zona: «· Prati»; en la gratis, sin zona);
  - «Útil para el viaje»: el seguro y la eSIM, con su «Ver» (los mismos enlaces que en RESERVAS);
  - «El tiempo en {destino}»: «La previsión sale cuando falten 5 días». Si la app ya tiene una previsión del tiempo (`RainAlert` o la de la regla 16), desde 5 días antes enseña la de cada día del viaje; si no la hay, deja solo la línea y dímelo en PREGUNTAS.
  - **Sin fechas** (solo el mes): en lugar de la cuenta atrás, «Tu viaje a {destino} · octubre» y el botón [Pon tus fechas], que abre donde se ponen las fechas. Sin fechas, HOY nunca pasa a «durante».
- **Durante el viaje, en la gratis:** el plan de hoy, el mismo que en DÍAS: arriba «HOY · {fecha}» y el título del día («Vaticano y Trastevere»), y la lista de paradas en su orden, con la hora solo en lo reservado (la pastilla verde «✓ 9:00»). Más el botón de la cámara (punto 6).
- **Durante el viaje, en la de pago** (lo de vivo):
  - la tarjeta oscura «SIGUIENTE PARADA · {n}», con el mapa pequeño hasta la parada (diseño), el nombre y la distancia («8 min andando»);
  - la distancia es desde donde está el viajero si comparte su ubicación; si no, desde la parada anterior. Al lado, un botón pequeño «Ubicación» (el icono de la chincheta) para pedirla; sin ubicación, «desde {parada anterior}»;
  - [Cómo llegar]: abre Google Maps con el camino a esa parada, como el botón «Rutas» de los días;
  - [✓ Visto]: la marca en verde, pasa a la siguiente y ofrece «📷 Añadir foto» (punto 6);
  - el aviso de la entrada a su hora («Tu entrada a los Museos · 9:00 ✓»), el de lluvia con [Ver alternativa] (si hay previsión) y la lista del día con lo visto en verde («2 de 5 visto»).
  - Ninguna hora calculada por la app a la vista (ni «sal a las…», ni «llegas a las…»).
- **Después del viaje** (el día siguiente al último; gratis y de pago):
  - la tarjeta «Tu viaje a {destino}», «{n} días · {fechas}» y las fichas de los días (diseño);
  - «Guarda tus recuerdos», con las fotos del viaje (punto 6) y [Subir mis fotos];
  - «¿A dónde vamos ahora?» con [+ Nuevo viaje].
- Un viaje con varios destinos: HOY enseña el del día de hoy.

4. LOS ICONOS Y EL COLOR (diseño: «Una sola familia»)
- Todos los iconos de la app, los de la hoja del diseño: una sola familia, de línea, con el grosor y las puntas del diseño, en un solo sitio del código para que sean iguales en todas partes. Cambia los que haya ahora por estos. Dime en el informe cuáles has cambiado.
- La excursión lleva ahora una mochila, no el autobús. El autobús queda solo para la llegada y la vuelta en autobús.
- El color de «falta» y «reservar» pasa a ser el rosa frambuesa del diseño (`oklch(0.55 0.17 5)` o el que use el diseño), en un solo sitio del código, en toda la app: los botones [Reservar], la pestañita de las entradas de DÍAS (hoy naranja), el «+» de EXPLORAR, los «Falta», el «!» si va en ese color, y el acento de la app donde hoy es terracota o naranja. Dime en el informe todo lo que ha cambiado de color.
- Los otros dos colores, igual que ahora: verde = hecho o reservado; azul = llegada, vuelta y el tiempo.
- Contraste: el texto blanco sobre frambuesa y el frambuesa sobre crema, de 4,5:1 como mínimo; si no llega, oscurece el frambuesa del texto.

5. CON FECHAS, LOS DÍAS SE LLAMAN POR SU FECHA
- Con fechas del viaje, fuera «Día 1», «Día 2»… en toda la app: el día se llama por su fecha.
  - En DÍAS, la cabecera de cada día: el cuadrado del número pasa a ser la ficha de la fecha («LUN» y «13», como las fichas del diseño en «Después del viaje»), y la línea pequeña de arriba deja de decir «DÍA 1 · LUN 13 OCT». El título del día, como ahora.
  - Fuera de la cabecera cerrada la línea de lo reservado con su hora («🔒 Coliseo · 10:00» o la que salga): la hora de lo reservado ya está en la pestañita verde de la parada.
  - Todos los textos que dicen «el día {n}»: «Ya lo visitaste el día 2», «En tu día 2», «Añadido al día 2», «¿A qué día lo añadimos?», «Añadir parada — Día 2», «Tu reserva es del martes 14: la pasamos a tu Día 2», el menú de la parada, el aviso «El Día 3 pasa a caer en…»… Con fechas, «el lun 13» / «el martes 14»; sin fechas, como ahora.
- Sin fechas (solo el mes), todo como ahora: «Día 1», «Día 2».
- Dime en el informe todos los sitios donde lo has cambiado.

6. LAS FOTOS DEL VIAJE (durante y después)
- Durante el viaje, en las dos versiones:
  - en HOY, un botón de la cámara para hacer o elegir una foto del día;
  - al marcar una parada «✓ Visto» (de pago) o desde la ficha de la parada, «📷 Añadir foto»: la foto queda con esa parada y ese día.
- Después del viaje, «Guarda tus recuerdos» enseña las fotos del viaje ordenadas por días (y por parada, si la tienen), y [Subir mis fotos] para añadir más.
- Cómo se guardan:
  - en Supabase Storage, en un sitio privado, con el viajero que ya tiene la app (`auth.uid()`, el de ahora; cuando haya cuentas, pasarán a la suya sin perderse);
  - se reducen antes de subirlas (1.600 px, como las de la app);
  - se les quitan siempre los datos de dentro (EXIF: la ubicación GPS, el móvil, la hora). La ubicación de la foto sale de la parada, nunca de la foto;
  - cada foto se puede borrar (con «Eliminar»), y se borra de verdad del almacén;
  - solo las ve su dueño.
- Sin límite de fotos por ahora: lo de cuántas son gratis y cuántas de pago lo decidimos antes de lanzar. Dime en el informe cuánto ocupa una foto reducida.
- El mapa de viajes del Perfil (la chincheta por viaje con sus fotos) no va en esta tanda.

7. LAS RESPUESTAS A TUS PREGUNTAS DE LA 6Z2
- Pregunta 1 (lo de «útil» se marca al pulsar): no se marca al pulsar, porque pulsar no es comprar. Al pulsar, se abre la tienda, como ahora; y cada uno lleva su «¿Ya lo tienes? Añádelo», que abre la hoja con su precio. Solo entonces queda como añadido.
- Pregunta 2 (los traslados): de momento no. Un taxi o un traslado se apunta en «Extras». Cuando la pestaña Traslados tenga sus enlaces, le pondremos su «¿Ya lo tienes? Añádelo».
- Pregunta 3 (la moneda de los precios de las tiendas): bien así. Apúntalo en la guía de destinos nuevos: cada precio de los datos de un destino lleva su moneda.
- Pregunta 4 (Stay22 y `currency=`): déjalo puesto. Si no lo aplica, no pasa nada.
- Pregunta 5 (monedas sin cambio): de momento no hace falta otra fuente.
- Preguntas 6 y 7: bien así.

8. PRUEBAS
- Las de siempre a 0 fallos (con la 6z y la 6z2).
- Una prueba 6z3:
  - la barra tiene siempre las mismas cinco pestañas, con y sin fechas, antes, durante y después, gratis y de pago;
  - HOY sale en el momento que toca (con la fecha simulada, `DevDateSimulator`): antes, durante y después; sin fechas, siempre «antes» con [Pon tus fechas];
  - con fechas, 0 «Día {n}» a la vista; sin fechas, como antes;
  - 0 horas calculadas a la vista en HOY;
  - en la gratis, nada de lo de pago en HOY (ni la siguiente parada ni la zona);
  - una foto subida no lleva datos de dentro (EXIF) y se borra de verdad.
- A mano, a 375 px, gratis y de pago:
  - la barra y la cabecera;
  - HOY en los cuatro momentos y sin fechas;
  - la «Ubicación» y [Cómo llegar] (que abre Google Maps);
  - [✓ Visto] con «Añadir foto»;
  - DÍAS con las fechas en la cabecera;
  - la mochila de la excursión;
  - el color frambuesa en RESERVAS, DÍAS y EXPLORAR.
- Capturas en el informe. Borra al acabar los viajes y las fotos de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z3 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
