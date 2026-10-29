Hola. TANDA 10N10: EL REPASO DE ERIC DE LA 10N7 Y LA 10N8 CON DOS TELÉFONOS (28 y 29-oct): los avisos que siguen sin llegar, EXPLORAR, DÍAS, la ficha, el presupuesto nuevo con el interruptor «Mi cuenta | Cuenta conjunta / Cuenta del grupo», RESERVAS con el diseño nuevo del vuelo y el alojamiento, y las hojas para apuntar dinero. Va después de la 10N9: si estás con otra tanda, acábala primero (con su push) y haz esta después. No hace falta la muestra de 60 fechas, salvo que toques el motor de rutas (entonces, dímelo antes).
0. Antes de empezar

* Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N10.md e inclúyelo en tu commit.
* Las reglas de siempre: `docs/REGLAS_DE_LA_APP.md`. Las reglas nuevas de esta tanda, añádelas ahí.
* Design: el zip completo más nuevo, `RETOQUES.zip`, en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`). Lo de esta tanda: `Piezas/Presupuesto Compartido` (01 a 09), `Piezas/Vuelo Reservas` (01 a 09, con la 05b y la 08b), `Piezas/Entrada Nueva` (01 a 03) y `Piezas/Cuentas Grupo` (04 a 06, la que ya tenemos). El diseño, exactamente igual; los textos y los datos, los de este prompt (Eric, 29-oct: «Design da visualmente cosas muy bonitas, pero los textos los decidimos nosotros»). Donde Design y este prompt no coinciden, manda el prompt.
* Cómo trabajar esta noche (Eric, 29-oct): solo trabajas tú en el PC, así que puedes usar más agentes a la vez si eso va más rápido (hasta 4), siempre con un solo servidor y un solo Chrome de prueba a la vez. Antes de lanzar uno, mira la memoria libre: con menos de 6 GB, espera a que acabe otro. Ve cerrando todo lo que deje de hacer falta (agentes terminados, servidores, Chrome, esbuild), para que siempre vaya rápido. Si el PC se reinicia, retoma desde las notas de cada agente sin repetir lo hecho. La nota de estado (`docs/dias/_estado_10n10.md`) a la rama `estado` cada 30 minutos, también mientras esperas a los agentes. No apagues el PC al acabar.
* Migraciones: Eric tiene aplicadas todas hasta la 0063, menos la 0062. Las de la 10N9 las aplica mañana. Si esta tanda necesita alguna, nueva, sin editar las anteriores, con su comprobación.

1. Los avisos (siguen fallando con la 0058 y la 0059 aplicadas)

* No le llegan al invitado: quitar un día, cambiar el orden de los días, añadir un restaurante. Sí llegan: añadir un día, «Recuperar día» (siempre), quitar el Free Tour y la propuesta del Free Tour (al administrador, con sonido).
* Dos cambios seguidos siguen juntándose en el mismo aviso: al quitar el Free Tour, primero salió el aviso con la «i» y «Ha cambiado el viaje», y después ESE MISMO aviso cambió a «Eric ha quitado el Free Tour». Sin sonido. Cada cambio tiene que ser un aviso nuevo, con franja y sonido.
* El sonido no suena siempre, aunque los dos móviles se han tocado muchas veces (no es lo del primer toque del iPhone). Tampoco sonó el aviso del Free Tour en el móvil del invitado.
* El invitado pone un vuelo solo para él y al administrador no le llega ningún aviso. Tiene que llegarle uno: «Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.» (con la 0061 aplicada).
* Pruébalo de verdad con dos cuentas reales contra el Supabase real (como `pruebaTanda10N3_real`), caso por caso: quitar un día, cambiar el orden, añadir un restaurante, añadir sitios, quitar el Free Tour, dos cambios seguidos, el vuelo del invitado. Para cada uno: si llega, si es un aviso nuevo, si sale la franja, si suena y cuánto tarda. Sin esta prueba no lo des por hecho. Si hace falta, mira también si Realtime está activo en las tablas `trips` y `avisos` del Supabase real (la `pruebaTanda10N3_real` fallaba ahí) y dime qué hay que activar.

2. EXPLORAR

* El botón de los logros desaparece. Pasos de Eric: EXPLORAR › tocar cualquier bloque (Atracciones, Miradores, Restaurantes…) › se abre el mapa con el filtro puesto › ya no está el botón de los logros. Arréglalo (lo de la 10N4: siempre por encima, en todas las pantallas).
* Restaurantes, cafés, helados y bares, con el + en EXPLORAR, para añadirlos como una parada más (para parar a tomar algo o un helado). En «Comida — vie 30», que es elegir la comida del día, sigue «Elegir».
* Fuera el botón «Free Tour» de arriba a la derecha de la pantalla de elegir (sale en «Comida — vie 30 · Barrio Judío» y en «+ Añadir parada»: `onFreeTour` de `PlaceExplorerScreen`, desde `DayDetailPanel`). Es un atajo viejo de la Tanda 6z; el Free Tour ya es una parada más y está en «Entradas».

3. RUTA y DÍAS

* La pastilla del pase tarda en pintarse (sale el hueco gris un rato). Que se pinte al momento con lo último que se sabía (guardado en el móvil) y luego se confirme.
* Añadir una parada entre dos («+ Añadir parada»): al tocar el + de un sitio, que se cierre EXPLORAR y se vuelva a DÍAS con la parada ya puesta en su sitio, y que la app baje hasta ella y la marque un segundo (como al moverla de día). Sin el aviso de abajo «Añadido al día…» ni [Deshacer]: si no la quiere, la quita en un momento. (Desde la pestaña EXPLORAR, sin estar añadiendo entre dos paradas, sigue como hoy.)
* «+ Añadir parada»: primero los sitios para visitar. Hoy salen mezclados monumentos y restaurantes. Al abrir, solo los sitios para visitar (monumentos, iglesias, plazas, miradores…), los más recomendados primero. Los restaurantes, cafés, helados y bares, solo si el viajero toca su bloque (y con el +).
* Al reservar una entrada con hora, la parada no se mueve sola. Hoy, si el Vaticano está por la mañana en nuestro día escrito y el viajero reserva a otra hora, la app la pasa a la franja de esa hora y el viajero cree que ha desaparecido. Que se quede donde está: el viajero la coloca a su gusto (Mover antes/después o arrastrándola). Lo que sí se dice, como siempre, es la hora de su entrada. Si para esto hay que tocar el motor de rutas, dímelo antes.
* El Castillo de Sant'Angelo lleva una foto de noche en su tarjeta de DÍAS y en la ficha, aunque la parada es de día. Que lleve una foto de día, distinta de la del Puente Sant'Angelo, con licencia libre y la fuente apuntada.

4. Las reglas nuevas para toda la app (añádelas a `docs/REGLAS_DE_LA_APP.md`)

* Personas: para elegir, cuadrados; para enseñar, redondo (Eric, 29-oct). Siempre que hay que marcar a alguien («¿Para quién es…?», «¿Quién lo ha pagado?», «Solo para algunos»), cuadrados como en `Piezas/Vuelo Reservas` 05: la inicial y el nombre, en azul oscuro con ✓ dorado si está marcado y en blanco si no. Cuando solo se enseña quién es, sin elegir nada (la tarjeta y la pantalla de «¿Quién debe a quién?», «En este vuelo · Tú y Viajes», «Lo ha puesto Eric · para Eric y para ti», los avisos…), redondo, como ahora. En `Piezas/Entrada Nueva` 02, «¿Quién la ha pagado?» está en redondo: va en cuadrados. Repasa todas las hojas donde se elige a alguien (también la de «Nuevo gasto» de hoy).
* Las preguntas, con la letra en tinta azul de Design (la de «¿A qué aeropuerto llegas?»), en todas las hojas.
* Los títulos de RESERVAS y del presupuesto, solos: «Reservas» y «Presupuesto», sin la línea de debajo («Barcelona → Roma · 29 – 31 oct 2026», «Roma · 10 – 14 ago · Eric y Ana»). El destino y las fechas ya se ven en el mapa.

5. El presupuesto: un interruptor «Mi cuenta | Cuenta conjunta / Cuenta del grupo» (cambia lo de la 10N7 y la 10N8)
Diseño: `Piezas/Presupuesto Compartido` 01 a 09, exactamente igual, con lo de abajo.
5a. Se acaban las tres formas de llevar las cuentas y su botón

* Fuera el botón «¿Cómo lleváis las cuentas?», su hoja, su confirmación, su aviso «Eric ha cambiado las cuentas…» y la pregunta del aviso «Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?». Lo decide la app sola:
   * una sola persona en el viaje: sin interruptor. Como `Piezas/Presupuesto` 03 (09 de `Presupuesto Compartido`): «Total del viaje», sin «por persona».
   * dos personas (pareja, dos amigos, quien sea) o una familia (sean los que sean): «Mi cuenta | Cuenta conjunta».
   * tres o más que no son familia: «Mi cuenta | Cuenta del grupo».
* Si cambia el número de personas: de 1 a 2, pasa a Cuenta conjunta. De 2 a 3 (sin ser familia), pasa a Cuenta del grupo: lo que ya estaba en la conjunta queda como pagado por quien lo apuntó y repartido entre esas dos personas, no entre las tres. Si alguien sale, lo ya apuntado no cambia; si quedaban deudas en la Cuenta del grupo, sigue así. Que las cuentas cuadren al céntimo.
* Dime qué partes de la 10N7 se quitan y qué se aprovecha (lo «Solo para mí», las deudas, la moneda y el cambio de cada gasto se quedan).

5b. Cada pestaña enseña solo lo suyo

* El interruptor, en la tarjeta oscura: «Mi cuenta» siempre a la izquierda. Fuera el texto pequeño encima del importe («DEL GRUPO» / «MI CUENTA»): lo dice el interruptor. La leyenda de la barra, siempre con los importes («Ruta · 40 € · Extras · 25 € · Tu parte · 130 €»), también en «Mi cuenta» (en las 01 y 03 de Design faltan).
* Mi cuenta: Ruta con tus reservas que son solo para ti; Extras con tus gastos; y al final la línea amarilla «Tu parte de la cuenta conjunta: 130 €» (o «de la cuenta del grupo»), que se puede tocar: abre el detalle de tu parte, los gastos comunes que la forman con lo que te toca de cada uno, y desde ahí se toca cada gasto para corregirlo. El importe de arriba = lo tuyo más tu parte de lo común: lo que te cuesta el viaje a ti. Solo lo ve cada uno.
* Cuenta conjunta / Cuenta del grupo: Ruta y Extras solo con lo que es para varios, y la tarjeta de las cuentas que ya tenemos (la de las iniciales, que abre la pantalla «Ha pagado · Le toca» de cada uno, «Para quedar en paz» con [Ya está pagado] y «Estáis en paz»: `Piezas/Cuentas Grupo` 04, 05 y 06). Va en las dos pestañas comunes, nunca en «Mi cuenta». Su título, «¿Quién debe a quién?» (para no confundirla con la pestaña). Sale cuando hay gastos comunes. El importe de arriba = todo lo común.
* Lo que NO se hace de Design: la 04 de `Presupuesto Compartido` (el bloque «¿Quién debe a quién?» con sus filas): en su lugar, la tarjeta de arriba. La línea amarilla de la 02 («Eric ha pagado 150 € · Ana 110 €»): fuera, lo dice la tarjeta.
* Fuera: el bloque «Lo tuyo · Solo lo ves tú», la línea «Del grupo 0 € · Lo tuyo 50 € · Total 50 €», «por persona» y la pastilla «Tu parte».
* Tocar cualquier gasto o reserva de la lista abre su hoja para cambiar el precio, la cuenta o quién lo pagó, o borrarlo. Al guardar, todo se recalcula.

6. Las hojas para apuntar dinero (gastos, entradas, Free Tour, excursiones, vuelo, alojamiento, coche)

* El diseño: las casillas con fondo blanco, como en Design. Al lado del precio, la moneda, como ya tenemos.
* El mismo orden en todas (Eric, 29-oct): 1) qué es (el concepto; el día y la hora de la entrada; los datos del vuelo o del alojamiento); 2) para quién; 3) «¿Cuánto ha costado en total?» (opcional) con su moneda; 4) «¿Quién lo ha pagado?»; 5) la línea pequeña de a dónde va el dinero; 6) el botón. Primero para quién, porque de eso depende para cuántas personas es el precio.
* «Para quién», según la hoja:
   * gasto suelto del presupuesto (Extras): sin pregunta. Va a la pestaña desde la que se abre, y el título de la hoja lo dice: «Añadir a Mi cuenta», «Añadir a la cuenta conjunta», «Añadir a la cuenta del grupo». Desde «Mi cuenta», solo el concepto y el precio. Desde la cuenta común, con «¿Quién lo ha pagado?» y, en la del grupo, la opción pequeña «Solo para algunos», que abre los nombres para marcar (el taxi de Ana y tuyo, no de Luis; la entrada de Ana que pagas tú). Si alguien se equivoca de pestaña, toca el gasto y lo cambia.
   * vuelo: «¿Para quién es este vuelo?»; alojamiento: «¿Para quién es el alojamiento?»; entradas y Free Tour: «¿Para quién son las entradas?»; excursión: «¿Para quién es la excursión?»; coche: «¿Para quién es el coche?». Con los nombres en cuadrados, marcado solo quien lo pone. La cuenta sale sola: solo tú, «Mi cuenta»; más, la cuenta común. Esto decide también quién tiene la entrada o el vuelo (los tres colores, «Eric y Viajes la tienen», el vuelo de cada uno). Lo raro (regalar el vuelo) se cambia tocando ese gasto en el presupuesto.
   * viajando solo: ninguna de estas preguntas, ni «¿Quién lo ha pagado?»: solo el precio.
* «¿Quién lo ha pagado?»: solo si es para más de uno y hay precio. En cuadrados, más grandes que hoy.
* La línea pequeña de debajo: «90 € cada uno · Va a la cuenta conjunta», «60 € cada uno · Va a la cuenta del grupo», «Va a Mi cuenta»; en «Mi cuenta», «Solo lo ves tú». Quien solo recomienda: «Se lo enviamos a Eric» y el botón «Enviar a Eric» (lo que apunta para el grupo queda pendiente hasta que lo aceptan; lo suyo entra directo). Quien puede editar: «Entra directo en el presupuesto».
* El botón de abajo, según lo que sea: «Añadir gasto», «Guardar la entrada», «Guardar el vuelo», «Guardar el alojamiento»…
* Fuera: «¿A qué cuenta lo sumamos?» y sus dos botones, [Para todos] / [Para mí], la lista de «¿Para quién es?» de antes y las preguntas «¿Para quién has comprado la entrada?»….
* Ejemplo que tiene que cuadrar: vuelo de 180 €, para Eric y Viajes, pagó Eric. Cuenta conjunta: 180 €. En «Mi cuenta» de cada uno: «Tu parte de la cuenta conjunta: 90 €» (no 180). En «¿Quién debe a quién?»: «Viajes le debe 90 € a Eric». Si es solo para Eric: 180 € en «Mi cuenta» de Eric y nada para Viajes.

7. RESERVAS

* La pantalla de RESERVAS, con el aspecto de `Vuelo Reservas` 01: las tarjetas de «Llegada y vuelta», «Alojamiento» y «Entradas y Free Tour» más amplias y con el texto más grande. Solo el aspecto: el contenido es el nuestro, con todo lo que ya tiene (los días que faltan para el viaje, «0 de 3 listo» con sus casillas, Excursiones, Transporte, «Útil para el viaje»…). Nada se pierde.
* El vuelo: `Piezas/Vuelo Reservas` 02 a 07 (y 05b), exactamente igual, con:
   * las pestañas Ida | Vuelta con sus datos; debajo de las pestañas, para todo el vuelo, «¿Para quién es este vuelo?», «¿Cuánto ha costado en total?», «¿Quién lo ha pagado?» y la línea (apartado 6). En la 05 de Design el precio está dentro de la pestaña «Vuelta»: va debajo, para todo el vuelo. Viajando solo, como la 05b;
   * la rueda de la hora sin [Guardar] (04) y un solo botón «Guardar el vuelo», con un solo aviso (lo de la 10N9);
   * la tarjeta ya guardada (06): la ida y la vuelta y, dentro de la misma tarjeta, «En este vuelo · Tú y Viajes» (en redondo) con «Cambiar». Fuera la caja del pase «Tu primer y tu último día» debajo del vuelo, y fuera el bloque suelto «En este vuelo» de hoy;
   * lo que ve otra persona (07): «Lo ha puesto Eric · para Eric y para ti» y «Poner el mío».
* El alojamiento: `Vuelo Reservas` 08, 08b y 09, exactamente igual (a Eric le encanta la 08, elegir la zona a todo el ancho, con sus márgenes), con «¿Para quién es el alojamiento?» y la parte del dinero del apartado 6. La caja del pase del alojamiento se queda, pero con zona ya elegida no puede seguir preguntando «¿En qué zona te alojas?»: «Adaptamos tu ruta a Prati» · «Con el Pase Roma, tu primer y tu último día salen desde tu zona.» y [Ver]. Sin zona elegida, como la dibuja Design.
* Las entradas: `Piezas/Entrada Nueva` 01 a 03, con el orden y los textos del apartado 6 («¿Para quién son las entradas?» antes del precio; en Design va «¿A qué cuenta lo sumamos?»: fuera).

8. Comprar la entrada a la misma hora (cambia lo de la 10N8 §8)

* El proveedor confirma (28-oct) que el enlace no puede llevar el día ni la hora. El botón no puede decir «Comprar a las 14:00»: [Ir a comprar] y, encima, «Eric la tiene el jueves 12 a las 14:00. Recuerda elegir esa hora al reservar.». «Ya la tengo · Guardarla», igual.
* Al volver de la web: «¿Has comprado la entrada del Coliseo?» · «Guárdala aquí y la tendrás siempre a mano.» · [Guardar] · [Todavía no]. Con [Guardar], la hoja de la entrada con el día y la hora ya puestos.
* Lo que ha contestado el proveedor está en la 10T (apartado 0b): el enlace no lleva fecha ni hora, la nota va de 0 a 10, los precios del sandbox son ficticios, la certificación es un documento (en `docs/civitatis/`). Tenlo en cuenta en todo lo que toque las entradas.
* Aparte: el proveedor nos pide la petición completa de POST /search que da el error 400 (sandbox). Prepárala en `docs/civitatis/peticion_search_400.md`: la URL, las cabeceras, el cuerpo y la respuesta, SIN el token ni ninguna clave (pon «<TOKEN>»). No la envíes tú.

9. La prueba

* La batería completa y `pruebaJutrip`, en 0 fallos (si alguna falla solo con el Vite normal, pásala con el Vite estable y dilo en el informe).
* La prueba de dos cuentas reales del apartado 1, con su tabla de resultados en el informe.
* Prueba nueva `pruebaTanda10N10`: el botón de los logros en EXPLORAR con un bloque abierto; el + en restaurantes; sin el botón «Free Tour»; la pastilla del pase al momento; añadir entre dos paradas (vuelve a DÍAS, baja y marca, sin [Deshacer]); «+ Añadir parada» con solo sitios para visitar; la entrada con hora que no mueve la parada; la foto del Castillo; cuadrados para elegir y redondo para enseñar; los títulos solos; el presupuesto con una persona, con dos (conjunta) y con tres (grupo), cada pestaña con lo suyo, la línea amarilla que se toca, «¿Quién debe a quién?» en las pestañas comunes, el paso de 2 a 3 personas al céntimo; las hojas con el mismo orden y sus textos, «Añadir a Mi cuenta», «Solo para algunos», la línea de a dónde va el dinero; el ejemplo del vuelo de 180 €; RESERVAS con su aspecto nuevo, el vuelo y el alojamiento como Design, la caja del pase con la zona elegida; «Ir a comprar» con su línea y la pregunta al volver.
* Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N10.html`, a tamaño de móvil, cada una al lado de la de Design.

10. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N10». Di por qué no llegaban los avisos y qué era lo del sonido, con la tabla de la prueba de dos cuentas; qué se quita de la 10N7; y qué migración hay que aplicar, con su comprobación.
Al final del informe, la lista de comprobación. Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con ✅ Hecho, ⚠️ A medias (qué falta) o ❌ No hecho (por qué), dónde lo mira Eric en el móvil (y con qué cuenta) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N10.html`, con una casilla en cada punto.
Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.

---

Añadido a la 10N10 (Eric, 29-oct), apartado 0a: tus dudas de la 10N9, respondidas.
1 y 4. El título y los márgenes de la película: ya no hacen falta, la película se quita (apartado 8b).
2. El resumen «✓ Ida…» en las pestañas del vuelo: como Piezas/Vuelo Reservas (✓ en la pestaña cuando está rellena), que sustituye a la hoja de la 10N9.
3. El precio del vuelo del invitado: lo resuelve esta tanda: la hoja del vuelo lleva «¿Cuánto ha costado en total?» para todos (apartados 6 y 7).
5. El chip de logros de «Mis viajes»: solo si sale de un dato de verdad (los logros conseguidos en ese destino). Si no hay forma fiable, fuera el chip: nunca un número inventado.
- Ojo con la forma de las cuentas en el servidor: modo_cuentas_del_viaje (0055, 0064) tiene que seguir la regla nueva del apartado 5a (dos personas o familia: cuenta conjunta; tres o más que no son familia: cuenta del grupo; una: sola), no el modoCuentas que se elegía a mano. Si hace falta, migración nueva.
Eric ha aplicado la 0064 (no la 0062). Guarda este añadido también en docs/dias/PROMPT_TANDA10N10.md.

---

Añadido a la 10N10 (Eric, 29-oct), apartado 8b: FUERA LA PELÍCULA DEL PASE. Sí, es lo que quiero.
- La película del pase se quita: nos está dando demasiados problemas. En su lugar, la lista del pase por puntos. De momento, usa la pantalla que ya tenemos al final de la película (escena 7, «Todo lo que incluye tu Pase Roma», con [Elegir mi pase]), como pantalla propia. Design va a rediseñar esa lista; cuando llegue, se cambia en otra tanda.
- Todo lo que hoy abre la película (la pastilla «Pase Roma» de RUTA, [Ver el Pase Roma] del aviso del pase, las cajas pequeñas del pase, las tarjetas «Con el pase tendrás» de HOY, «Tu último día», los logros cerrados…) abre directamente esa lista, siempre, la primera vez y las siguientes.
- Quita el código de la película que ya no se use (escenas, música, peliculaMusica, el botón de silencio, el «ya la ha visto»), sin romper nada de lo demás. Antes de borrar, comprueba qué usa cada cosa; lo que comparta con la lista (los datos de lo que incluye el pase, los textos, los precios), se queda. Dime qué has quitado.
- Las pruebas de la película, fuera o cambiadas por las de la lista.
- La música (pelicula_pase.mp3) ya no hace falta.
- Para la prueba con dos cuentas reales: no crees cuentas nuevas en cada pasada (por el límite de altas de Supabase). Usa siempre las mismas dos cuentas de prueba, creadas una sola vez y guardadas en las notas de prueba del proyecto (no en el chat).
