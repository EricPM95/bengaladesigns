Tanda 6y5 (después de la 6y4). Las respuestas a la 6y4, las historias de «Escuchar historia», el diseño de la ida y la vuelta, el texto de las excursiones y unos arreglos pequeños. Va todo en este archivo.

Antes de nada: Claude ha copiado en docs estos archivos nuevos o cambiados: docs\dias\PENDIENTES_6K.md, BORRADOR_MULTIDESTINOS.md, PENDIENTES_LLEGADAS.md, PENDIENTES_ESCUCHAR.md, PENDIENTES_MULTIDESTINOS.md, PENDIENTES_RECOMPENSAS.md, HISTORIAS_ROMA.md y docs\diseno\reservas\Reservas v4.dc.html (versión nueva). Súbelos en el primer commit. Son documentos: no se tocan, salvo lo que diga el punto 6.

0. RESPUESTAS DE ERIC A LAS PREGUNTAS DE LA 6y4 (PREGUNTAS_TANDA6Y4.md)
- P1, el Ara Pacis delante de todo: Eric reservó LOS DOS, el Altar de la Patria y el Ara Pacis, en el mismo viaje. Reprodúcelo con las dos reservas a la vez (en el mismo día y en días distintos, varias horas, con fechas y sin fechas) y arréglalo si sale. Añádelo a la prueba de listas: con cualquier combinación de reservas, el viaje lleva las mismas paradas.
- P2 y P3, días que cierran (el Vaticano en domingo, la Galería Borghese en lunes): nunca se quita el sitio. Se busca otro día del viaje en el que no cierre y se cambian los dos días enteros, como en la 6k; la hoja lo explica. Solo si no hay ningún día posible, el sitio se queda en su día con el aviso de que ese día cierra, y decide el viajero. Ojo: los Museos Vaticanos abren los miércoles (el miércoles por la mañana lo que cambia es la Plaza y la Basílica, por la audiencia del Papa). Mira por qué el documento quita los Museos en miércoles y dímelo en el informe; no lo cambies en el documento sin preguntar.
- P4, una reserva grande a una hora de otra fila (el Coliseo desde las 14:16): el Coliseo se queda, claro. Las paradas pequeñas que ya no caben (la Fuente de las Tortugas, el Elefantino…) pasan a «Si te sobra tiempo» de ese día: no desaparecen.
- P5: bien.
- P6 y P7, el tope del pool: no complicarlo. 3 sitios con 1 o 2 días y 6 con 3 o más días. Mide con la prueba cuántos quedan en «No incluido» con ese tope y ponlo en el informe.
- P8, el calendario: sin botón. Se guarda al tocar el segundo día, como antes. Si se equivoca, vuelve a tocar las fechas y lo cambia.
- P9: con la zona elegida cuenta como resuelto, igual que en RESERVAS.
- P10: los dos: «Lo tienes · Mi banco · 30 €».
- P11 y P12: bien. Eric lo mira en su móvil.
- P13 y P14: bien como está.
- P15: devuelve [Abrir este viaje], pequeño, en cada viaje del Perfil.
- P16: «Lugares» cuenta ciudades (destinos) distintos.
- P17: «Roma» sin «×1»; «×2» desde el segundo viaje.
- P18: corrige el aviso de la Fontana de Trevi en DÍAS para que diga lunes y viernes, como la ficha.
- P19: el «Paseo por Trastevere» lleva también la etiqueta lila. Los restaurantes, no.
- P20 a P27: como lo has hecho (los iconos del barco y la autocaravana valen; a pie, metro y tranvía se pedirán a diseño más adelante; borra la rama de HOY gratis que ya no se usa).
- P28, la foto equivocada: borra de la caché de fotos la del cantante (y cualquier otra guardada para un nombre que no es de ningún sitio nuestro), y que la caché no guarde fotos de nombres que no estén en nuestros datos.

1. «ESCUCHAR HISTORIA», CON LAS HISTORIAS (revisadas por Eric)
Puedes mandar un agente para pasar las historias a los datos.
- Las historias: docs\dias\HISTORIAS_ROMA.md, 31 sitios. De cada una se coge solo el texto de la historia: ni el título, ni las líneas «Comprobar», ni las notas del final. Va en un campo nuevo, «historia», en la ficha de cada sitio (data/pipeline_v2/detalle/roma/*.json), no en el código. Cada historia, en el sitio que le toca (los 31 tienen que encontrar su ficha; si alguno no la encuentra, dilo en el informe y no lo inventes).
- La barra de la ficha: «Escuchar historia», y lee la historia. Solo sale en los sitios con historia. En un sitio sin historia no sale ninguna barra ni ningún botón (Eric).
- En HOY (de pago): el «Escuchar» de la siguiente parada sigue leyendo el Resumen. Si la parada tiene historia, al lado sale «Historia», que la lee.
- Gratis y de pago: es de pago, como Escuchar. La historia del Coliseo es gratis para todos, como muestra. En la gratis, en los demás sitios con historia, la barra sale con el candado y lleva a pagar.
- La historia no se escribe en ninguna pestaña de la ficha: solo se escucha.
- Mismas reglas de la voz que ahora (la voz del móvil, en español; avanza por frases).

2. EL ACORDEÓN DE LA IDA Y LA VUELTA, ABIERTO (diseño)
Diseño: docs\diseno\reservas\Reservas v4.dc.html (con su support.js), marco «Móvil · Completa», con «Bloques: Abiertos». De ese diseño se copia SOLO el formato del tramo abierto con sus campos. Nada más.
- Cuando se abre un tramo (la ida o la vuelta) para rellenarlo, sale como en el diseño, una tarjeta blanca con:
  - arriba, pequeño: «IDA · MAR 10 AGO» (o «VUELTA · SÁB 14 AGO»; sin fechas, el día como ahora);
  - debajo, el trayecto: la ciudad de origen a un lado, al otro «¿Fiumicino o Ciampino?» (en la vuelta, al revés), y en medio un arco de puntos con el icono del medio en un círculo oscuro. Cuando elige, la pregunta pasa a ser el nombre;
  - dos botones grandes para elegir: Fiumicino · Ciampino (tren: Termini · Tiburtina; autobús: Tiburtina · Termini). En barco, sin botones: «Puerto de Civitavecchia · el único de Roma»;
  - cuatro casillas en dos columnas: «Llega» (en la vuelta, «Sale») con nuestra rueda de la hora, «Precio» (al presupuesto con la pastilla), «Ref. vuelo» (ej. AB 1234; es el código de la 6y4, no lo dupliques) y «Aerolínea». En tren, «Ref. tren» y «Compañía»; en autobús, «Ref. billete» y «Compañía»; en barco, «Ref. billete» y «Naviera».
- Lo que la app ya hace se queda igual: qué se guarda, la cabecera del bloque, las filas cerradas, «Buscar vuelos», el coche y la versión gratis. Solo cambia cómo se ve el tramo abierto.
- En las filas cerradas no se añade ninguna hora calculada (el diseño pone «libre hacia las 13:15»: eso no va).

3. EL TEXTO DE LAS EXCURSIONES
- Donde hoy pone «Ver otras excursiones» (o parecido), pasa a poner «Ver más excursiones». Mismo sitio, mismo aspecto y lo mismo al tocarlo: solo cambia el texto.

4. DATOS DUDOSOS DE LAS FICHAS (data/pipeline_v2/detalle/roma/*.json)
Cambia solo estas frases; nada más de las fichas.
- Fontana de Trevi, descripción: la figura del centro es Océano, no Neptuno. Donde ponga Neptuno, Océano (en «Qué vas a ver», «Océano» a secas).
- Fontana de Trevi, secretos: la moneda. En vez de que la costumbre viene de la película de 1954: «La película de 1954 hizo famosa la costumbre de la moneda, pero echar monedas al agua es mucho más antiguo.»
- Panteón, secretos: el rayo de luz sobre la puerta al mediodía es el 21 de abril, el día del nacimiento de Roma (no el 21 de junio).
- Panteón, secretos: fuera «técnicamente imposible para la ingeniería moderna». En su lugar: «Todavía hoy es la mayor cúpula de hormigón sin armar del mundo.»
- Piazza Navona, consejos: la leyenda con sus dos figuras: «Se cuenta que el Río de la Plata levanta la mano como si la iglesia de enfrente se le fuera a caer encima, y que el Nilo se tapa la cabeza para no verla. Es solo una leyenda: la fuente es de antes que la fachada.»
- Basílica de San Pedro, secretos: el bronce del Baldaquino. «Se cuenta que el bronce salió del pórtico del Panteón, aunque la mayor parte de aquel bronce parece que acabó en cañones.»
- Después, comprueba que ninguna de estas frases repite lo que dice HISTORIAS_ROMA.md de ese sitio (la regla de arriba de ese archivo).

5. LAS CAPTURAS
- Las capturas del informe se guardan en disco (docs/dias/img/6y5-*.jpg), por ejemplo con la captura de Playwright a un archivo. Si de verdad no se puede, dilo al principio del informe.

6. UNA LÍNEA EN LA GUÍA
- En docs\dias\GUIA_NUEVOS_DESTINOS.md, añade: «Cada sitio importante lleva su historia para "Escuchar historia" (ver HISTORIAS_ROMA.md). La historia nunca repite lo que dice la ficha.»

7. PRUEBAS
- Esta tanda toca el motor (P1, P2, P4 y el tope del pool): pasa TODAS las pruebas, también la de las 365 fechas, a 0 fallos.
- Historias: los 31 sitios tienen su historia y ninguno más; ningún sitio sin historia enseña barra ni botón en la ficha, ni «Historia» en HOY; en la gratis solo suena la del Coliseo; ninguna historia repite una frase de su ficha (que no compartan 8 palabras seguidas con la descripción, «Qué vas a ver», los consejos ni los secretos).
- Nuevas: dos reservas a la vez (el Altar y el Ara Pacis) sin perder paradas; un cierre nunca quita el sitio (el Vaticano en domingo y la Galería en lunes, con cada reserva grande, en las 365 fechas); las paradas que no caben con una reserva a otra hora salen en «Si te sobra tiempo»; el tope 3/6 y su «No incluido».
- A mano, a 375 px: la ida y la vuelta abiertas con avión, tren, autobús y barco, con fechas y sin fechas; «Ver más excursiones» donde sale; la barra «Escuchar historia» en el Coliseo (gratis y de pago), en la Fontana de Trevi y en un sitio sin historia, y «Historia» en HOY; [Abrir este viaje] en el Perfil; el calendario que se guarda al segundo toque.
- Capturas en el informe (punto 5).

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y5 en docs/dias, en palabras sencillas, y commits locales. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
