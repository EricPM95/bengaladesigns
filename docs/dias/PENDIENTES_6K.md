# Pendientes de la 6k

**REGLA DE PRUEBAS (Eric, 12-oct):** si la tanda no toca el motor, sin las 365 fechas (solo las rápidas). Si lo toca, una muestra de unas 60 fechas (festivos, domingos, lunes, miércoles, Navidad) durante la tanda, y las 365 al final del día. Las pruebas, en paralelo.

**PARA LA 6y9, LO PRIMERO (12-oct, Eric: «error gravísimo»): los horarios por temporada están mal.** En roma.json el Coliseo tiene 4 estaciones (invierno, primavera, verano, otoño) y en «otoño» pone cierre 16:30 y última entrada 15:30. Lo oficial (captura de Eric, web del Parque): del 1 al 24 de octubre de 2026, 8:30–18:30, última entrada 17:30 (el Coliseo abre a las 8:30; el Foro y el Palatino y la Domus Aurea, a las 9:00). Por eso la rueda de la hora solo deja hasta las 15:30 y el motor cree que el Foro cierra a las 16:30 en octubre. Arreglo:
- cambiar las 4 estaciones por tramos de fechas, como los da la web oficial (por ejemplo: desde el último domingo de marzo hasta el 31 de agosto; septiembre; del 1 de octubre al último sábado de octubre; del último domingo de octubre en adelante…);
- comprobar en la web oficial de cada sitio los tramos del Coliseo, el Foro y Palatino, los Museos Vaticanos, la Galería Borghese y todos los demás sitios que usan «by_season», y apuntar la fuente y la fecha de la comprobación;
- ojo: una web no oficial da para octubre «el Coliseo hasta las 17:30, última entrada 16:30, el Parque hasta las 18:30», distinto de la captura de Eric. Manda la web oficial; si no está claro, poner la hora más prudente y apuntarlo.
- la rueda de la hora y el motor, con el tramo de la fecha del viaje; sin fechas, el del mes.
- Prueba: para cada sitio con temporadas, en cada tramo, la última hora de la rueda es su última entrada.
- **Matiz (Eric, 20:04):** lo que vendemos del Coliseo son visitas guiadas, y no ha visto ninguna después de las 15:30. Pero la rueda es para «¿Ya la tienes? Añádela», y quien compró la entrada oficial sin guía puede entrar hasta la última entrada oficial (17:30 en octubre). Así que la rueda llega hasta la última entrada oficial del tramo; las horas de las visitas guiadas las enseña la tienda al reservar. Y el motor, con los horarios oficiales por tramo (el Foro no cierra a las 16:30 en octubre).
- **Regla para todos los destinos (Eric):** las entradas más comunes de cada destino (en Roma: el Coliseo, los Museos Vaticanos, la Galería Borghese, el Panteón y el Free Tour) llevan siempre sus horas reales de reserva (los turnos que existen de verdad), y siempre con «Recuerda revisar la disponibilidad». Añadirlo a GUIA_NUEVOS_DESTINOS.md. Comprobar los turnos reales del Panteón y de la Galería.

**PARA LA 6y9 (12-oct): los audios de las historias, preparados sin pagar.** La voz ya está elegida (ver PENDIENTES_ESCUCHAR.md). La barra reproduce el audio guardado si existe y, si no, la voz del móvil; y queda listo el programa que crea los 31 audios con la clave de .env.local. No se lanza hasta antes de lanzar la app.

**PARA LA 6y9 (12-oct): la regla de los días enteros, para todos los destinos.** Comprobar que GUIA_NUEVOS_DESTINOS.md dice: en cada destino se marcan en los datos sus «sitios grandes» (en Roma: Coliseo, Museos Vaticanos y Galería Borghese); una reserva de un sitio grande en otro día mueve el día entero (se cambian los dos días); los cierres cambian el día con otro; una reserva de un sitio pequeño solo mueve esa parada; los días cambiados a mano no se tocan. Si no lo dice, añadirlo.

**PARA LA 6y9 (12-oct): las horas del Free Tour.** Las horas son reales (Eric): 10:00, 12:00, 15:00, 17:00, **19:00 (falta, añadirla)** y 21:00. Texto de arriba nuevo (Eric, sin complicarse): «Lo ponemos al principio de tu viaje: es cuando más vale la pena, porque te ayuda a situarte. Recuerda revisar la disponibilidad antes de añadirlo a tu ruta.» (La app ya lo pone en el primer día completo: el D3, o la noche del D1 con el de las 21:00; si un cierre cambia los días, puede ir en el segundo, por eso «al principio» y no «el primer día».) (fuera lo de «su versión con Free Tour… las reglas de siempre»). Abajo del todo, debajo de las horas, un botón de los nuestros, [Ver disponibilidad], que abre la página del Free Tour en la tienda (con nuestro enlace de afiliado y el aviso «Abriendo…», sin el nombre de la tienda). Sin los dos «Por la tarde»: solo las horas, o «Después de comer» (15:00) y «Por la tarde» (17:00). Hace falta escribir en el documento cómo queda el día con el Free Tour de las 19:00 (Claude). Más adelante, si la API de la tienda de excursiones da las horas de cada día, la app enseña solo las que hay (Eric pregunta a su contacto de afiliados).

**PARA LA 6y8, LO PRIMERO: los Museos reservados de 12:00 a 13:00 llegan tarde** (132 min con la de las 12:00). El documento ya dice que la comida va antes y rápida, hacia las 11:30, cerca de los Museos (regla 4 y «Museos reservados a mediodía»), pero el motor no usa la comida rápida: pone una comida normal y se pasa. Arreglo (Eric, 12-oct, sin complicarse): **solo el Vaticano** (3 h) lleva la comida antes: con los Museos reservados de 12:00 a 13:00, la parada «Comida» va antes de los Museos, cerca del Vaticano, y el viajero decide cuánto tarda (por dentro, el motor la cuenta corta para que la entrada no salga «tarde»). **El Coliseo (~1 h 30)**: con la entrada hasta las 13:00 incluida, la comida va después (sale hacia las 14:30 y come hacia las 15:00); con la entrada después de las 13:00, la comida va antes (Eric). **La Galería (2 h)**: con la entrada de las 11:00, comida después; con la de las 13:00 (sale a las 15:00), comida antes (Eric: sí). Cambiar en el documento la regla 4 y «Museos reservados a mediodía» para que digan esto. **Regla general para todos los destinos (Eric):** según la duración de la visita, la comida va antes si se sale después de las 14:30, y la cena va antes si se sale después de las 21:00. Va en la 6y8 (PROMPT_TANDA6Y8_PARA_PEGAR.md). Prueba: ninguna reserva sale tarde, a ninguna hora.

**PARA LA 6y8 (12-oct, lo que toca el motor; sumar lo que salga de la prueba de Eric en el móvil):**
- El pool no sale con 1 día: solo con 2 días o más (Eric). Con 2 días, tope 3; con 3 o más, 6.
- Miércoles (decidido por Eric, 12-oct): **primero, cambiar el día del Vaticano entero con otro día**, como ya se hacía («el Vaticano no en miércoles» se queda). **Solo si no se puede** (por ejemplo, los Museos reservados un miércoles, o no hay otro día), el D2 del miércoles va así:
  - Mañana: Museos Vaticanos y Capilla Sixtina, a primera hora (o a la hora de su reserva).
  - Comida: en el Borgo (Borghiciana o Dal Toscano).
  - Tarde: Plaza de San Pedro → Basílica por dentro → Via della Conciliazione → Castillo por fuera → Puente → bus 23 → Isla Tiberina → Trastevere, como siempre. Si no cabe todo, San Pietro in Montorio y la Fontana dell'Acqua Paola pasan a «Si te sobra tiempo».
  - Regla: en miércoles, la Plaza y la Basílica nunca van antes de comer.
  - Con los Museos reservados por la tarde: mañana como la del «miércoles por la mañana» de la vuelta (Trevi, Plaza de España, Via dei Coronari, Puente, Castillo), comida en el Borgo, los Museos a su hora y, al salir, la Plaza y la Basílica.
  - En julio no hay audiencias (comprobar): el miércoles es un día normal.
- Corregir en el documento la línea vieja de «la versión sin Museos (la del miércoles…)» para que diga lo de arriba. La preferencia «el Vaticano no en miércoles» se queda.

**ÍNDICE POR TEMAS (11-oct):** lo de cada tema grande tiene su propio archivo en docs\dias:
- `PENDIENTES_LLEGADAS.md`: la llegada, el primer día, el último y la vuelta (Tanda 7).
- `PENDIENTES_ESCUCHAR.md`: Escuchar, las historias y la voz.
- `PENDIENTES_MULTIDESTINOS.md`: los viajes de varios destinos (lo decidido; la historia, en BORRADOR_MULTIDESTINOS.md).
- `PENDIENTES_RECOMPENSAS.md`: Tu mundo, el pasaporte de sellos, los logros y sus regalos.
- Este archivo: el orden de las tandas (más abajo, «EL ORDEN DE AQUÍ EN ADELANTE») y lo suelto de Roma.

**Ya pasado a `PARA_CODE_TANDA6K.md` (8-oct-2026, noche).** Lo nuevo que salga, aquí debajo, para la siguiente.

## Pantallas
1. **Experiencias · Mercadillos navideños:** el texto se sale de la tarjeta (la línea «Es probable que algunos mercadillos ya hayan cerrado.» queda por fuera).
   - La tarjeta tiene que crecer con su texto, como las demás.
   - Mirarlo a 375 px con las seis tarjetas.
2. **RUTA · el mapa:** quitar el punto del aeropuerto (Fiumicino) del mapa de la pestaña RUTA, para que el mapa se centre en Roma y no se vea pequeño.
   - **Solo en RUTA.** En la ventana de llegada (Resumen · Traslados · Tips) el punto del aeropuerto se queda: ahí sí sirve.
   - Que el encuadre del mapa cuente solo las paradas de los días.

## Reservas
5. **«Añade tu reserva» → «Día del viaje»:** en la lista de días, el día en el que ya está ese sitio lleva detrás «· aquí está ahora» (por ejemplo, «Día 2 · aquí está ahora»), y sale ya elegido.
   - Se puede elegir igual: así sabe que lo pone en el día bueno y no se mueve nada.
   - Con fechas, cada día con su fecha: «Día 2 · mar 12 ene · aquí está ahora».
   - En el móvil la lista es la del sistema y no admite cursiva: por eso va como texto detrás.
6. **«Añade tu reserva» con fechas: fuera la línea repetida.** Ahora salen dos: «Jueves 31 dic → tu Día 4» y «Tu reserva es del jueves 31: la pasamos a tu Día 4.». **Se queda solo la segunda** (sin rojo, como dijo la 6j).
7. **Elegir la fecha y la hora, más bonito (en toda la app):**
   - **La fecha:** fuera el campo del sistema (el «31/12/2026» con el icono). Sale una hoja desde abajo con el mismo calendario que el formulario (el `DayPicker` de «Añadir fechas», con los colores de la app).
     - En una reserva, solo se pueden tocar los días del viaje; los demás, en gris. Así no hace falta mover nada a otro día por error.
   - **La hora:** fuera el campo del sistema. Sale una hoja desde abajo con dos ruedas que se deslizan, como el reloj del iPhone (horas y minutos, de 5 en 5), con los colores de la app y la hora elegida resaltada en el centro. Se mueve con el dedo, con la rueda del ratón y con el teclado. Abajo, [Listo].
     - Cuando las horas posibles son pocas (el Free Tour: 10:00, 12:00, 15:00, 17:00 y 21:00), en lugar de la rueda salen esas horas como botones.
   - **Un solo componente de fecha y uno de hora para toda la app,** y que sustituyan a todos los campos del sistema: «Añade tu reserva» (día, hora y hora de vuelta), las horas de los vuelos de RESERVAS, «+ Añadir parada» en un día libre, el menú de cada parada y las fechas de otras reservas. Las pantallas de pruebas no.
   - Mirarlo a 375 px y en el ordenador.

## Fallos que hay que mirar
0. **URGENTE · la app se rompe al mover una reserva a otro día.**
   - **Cómo se ve:** un viaje de 4 días sin fechas. En RESERVAS, «Añade tu reserva» del Coliseo → «A mano» → elegir un día que no es el del Coliseo (por ejemplo, el día 3). Sale la pantalla «Algo ha ido mal · Esta pantalla no se pudo mostrar correctamente…».
   - **Solo funciona si se elige el mismo día** en el que ya está el Coliseo.
   - **Así no se puede probar nada de la 6j:** ni que se mueve el día entero, ni la hoja, ni los avisos.
   - **Es el caso sin fechas (comprobado por Eric):** con fechas no se rompe. La hoja de la 6j lleva «({fecha})», y la 6j solo se probó con fechas y sin abrirla en el navegador (lo dice su informe).
   - **Lo que hay que hacer:**
     - encontrar el fallo y arreglarlo;
     - sin fechas, la hoja sin la fecha: «Para que tengas una buena experiencia en Roma, vamos a mover el día del Coliseo al día 3, con tu reserva.»;
     - probarlo **en el navegador, a mano**, con fechas y sin fechas, con el Coliseo, los Museos y la Galería, a cada día del viaje;
     - y que una pantalla de error no vuelva a salir por esto: si algo falla, la reserva se guarda en su día y sale un aviso, sin romper la app.
8. **URGENTE · al mover el Coliseo al último día, el día del que sale se descontrola** (viaje de 4 días con fechas; el Coliseo pasa del día 1 al día 4, el jueves 31 de diciembre).
   - **El día 4** sale con el Coliseo, bien.
   - **El día 1** (el que se queda sin el Coliseo) sale así:
     - por la mañana, la Plaza del Campidoglio, Plaza Venecia, el Altar, el Arco y la «Terraza de Largo Gaetana Agnesi» (sin foto y que no está en ningún día escrito);
     - la comida en Il Bocconcino y, justo después, **la cena a la 1:15** en Da Enzo;
     - después, **otra vez «Mañana · 09:00–12:30»** con el **Foro y Palatino a las 20:22** (cierra a las 16:30);
     - la noche, «Fin del día».
   - **O sea: no se ha movido el día entero, solo el Coliseo,** y el día 1 se ha rehecho con lo que quedaba. Es lo que la 6j tenía que evitar.
   - **Lo más probable:** la 6j dice que el día no se mueve «en el día de llegada o de vuelta», y Code ha tomado el último día como día de vuelta aunque el viaje no tenga vuelos. **Sin vuelos, el primer y el último día son días enteros normales:** el día se mueve igual. La excepción es solo para cuando hay vuelos (Tanda 7).
   - **Lo que tiene que pasar (sin vuelos, decidido por Eric):** **se cambian los dos días enteros, uno por otro.**
     - el día del Coliseo (D1) va al día 4 con la lista escrita de la hora de la reserva, y el que había en el día 4 pasa al día 1;
     - solo si un cierre lo obliga (el Vaticano un domingo, la Galería un lunes) se mueve algún día más, y la hoja lo explica;
     - **el Foro y Palatino van siempre con el Coliseo** (es la misma entrada).
   - **Si un día de verdad no se puede mover** (las excepciones de la 6j), no se arranca la parada sola: no se mueve nada y sale el aviso de la 6j, que se queda en la campana. Nunca un día a medias.
   - **Lo que no puede pasar nunca** (ponlo como comprobación en las pruebas, para todos los días y todas las reservas):
     - una parada a una hora en que ese sitio está cerrado;
     - una comida o una cena fuera de su hora (la cena, nunca después de las 22:30);
     - dos franjas con el mismo nombre en un día, o una franja con horas que no son las suyas;
     - una reserva que desaparece del día;
     - una parada que no está en ningún día escrito (salvo lo que el viajero añade y «Si te sobra tiempo»).
   - **La hora de la reserva:** la 6j quitó el aviso «A las {hora} no tenemos escrito…» y ahora la app acepta **cualquier** hora. Eso estaba bien para las horas que sí tienen lista (como las 13:30 del Coliseo), pero no para las que no la tienen o están fuera de horario.
     - **En la rueda de la hora** (punto 7), para el Coliseo, los Museos y la Galería solo salen las horas a las que se puede entrar ese día (de la apertura a la última entrada), y las mejores, marcadas («Mejor hora este día»).
     - **Si aun así la hora no tiene lista escrita** (la Galería a las 12:00, por ejemplo), se aplica la regla 17 con una hoja desde abajo: «A las 12:00 la visita no encaja bien en el día. Te proponemos las 11:00 o las 15:00.» [11:00] · [15:00] · [Dejar las 12:00]. Si la deja, se aplica la regla 4, sin romper nada de lo de arriba. **[Superado el 9-oct-2026: la app nunca propone otra hora; ver la regla 17 del documento y las tandas 6u, 6v y 6w.]**
   - **Probar en el navegador, a mano:** el Coliseo, los Museos y la Galería, movidos a cada día del viaje (también el primero y el último), a primera hora, a mediodía y por la tarde, con fechas y sin fechas.
3. **El Panteón sale «Hoy cierra» sin fechas.**
   - **Cómo se ve:** un viaje de 4 días en enero, sin fechas y con el Free Tour marcado. En el día del Free Tour (D3), el Panteón sale en rojo «Hoy cierra», con 15 min (por fuera).
   - **Lo que debería pasar:** sin fechas no hay «hoy», así que no debería salir ningún «Hoy cierra». La app usa el día 15 del mes solo como referencia (`closedOnDate` ya dice que, sin fechas, no cierra).
   - **Hay que buscar qué lo marca así:** puede ser el horario nuevo del Panteón de la 6j (la última entrada a las 18:30 o las misas). Y comprobar que no les pasa a otros sitios.

## Cambios del documento (pásalo por el convertidor)
9. **El orden de los días (el Centro el día 1, el Coliseo y el Vaticano en los días 2 y 3):** decidido por Eric, pero va en la **Tanda 7**, porque usa las listas de la llegada. En la 6k, nada.
4. **D3, la tarde del Vaticano:** ahora va Museos → Plaza de San Pedro → Basílica → Conciliazione → Castillo → Puente (antes, Basílica → Museos → Plaza: se iba y se volvía). Es como lo hace un guía, porque el Free Tour ya enseñó el centro por la mañana y la Basílica abre hasta las 20:00.
   - Comprobar que no cambia la versión con los Museos reservados de 13:30 a 14:30, que ya iba así.

## Para la próxima tanda (después de la 6k) · ya pasado a la 6l
1. **El Panteón del D3 llega 5 min antes de abrir y pasa a «por fuera».** Va contra la regla 7 del documento: si se llega antes de que abra, se espera hasta 15 min (y hasta 40 si al lado hay una plaza para hacer fotos, como la Piazza della Rotonda). Tiene que esperar y entrar por dentro. Comprobar que no les pasa a otros sitios con la misma regla.

## Para la siguiente (después de la 6l) · ya pasado a la 6m
1. **Fuera «Mejor hora este día» en toda la app** (Eric, 8-oct noche): en la rueda de «Hora de entrada», en la tarjeta de RESERVAS y en la ficha de cada sitio. Quien añade su reserva ya tiene su hora en la entrada que ha comprado.
   - **La rueda se queda** con las horas a las que se puede entrar ese día (6k, punto 2).
   - **Se queda también la hoja de la regla 17** (la que propone otras dos horas cuando la hora elegida no tiene día escrito): es otra cosa y sigue haciendo falta. **[Superado el 9-oct-2026: la app nunca propone otra hora; ver la regla 17 del documento y las tandas 6u, 6v y 6w.]**
2. **RESERVAS · la tarjeta de cada entrada, más clara** (Eric, 8-oct noche):
   - **Sin la entrada todavía:** el nombre entero (en dos líneas si hace falta, sin «…»), el botón grande **[Reservar entrada]** (lleva a comprarla) y, al lado, en pequeño, «¿Ya la tienes? **Añádela**» (abre «Añade tu reserva»). Fuera el «Añadir» gris de ahora.
   - **Sin la línea de la mejor hora** en la tarjeta.
   - **El día, siempre en la tarjeta:** sin fechas, «Día 1»; con fechas, la fecha en su lugar («Mar 12 ene»).
   - **Con la entrada puesta:** «Mar 12 ene · ✓ Reservada · 14:00» (sin fechas, «Día 1 · ✓ Reservada · 14:00») y «Cambiar». Ya no sale «Reservar».
   - **Sin la mejor hora** (punto 1).

## Para la siguiente (después de la 6m)
Diseño: `docs\diseno\reservas\Etiqueta Entrada.dc.html` y `Etiqueta_Entrada.png` (subirlos al PC cuando Code acabe la 6m). Solo la tarjeta y su pestaña; la hoja de compra del prototipo (precios, personas, «4 libres») no se hace.

1. **DÍAS · la pestaña de entrada en la tarjeta de cada sitio** (Eric, 8-oct noche):
   - **Sin reservar:** pestaña naranja con el icono de la entrada, pegada al borde derecho de la tarjeta. **Al tocarla, abre la ficha del sitio directamente en su pestaña «Entradas»** (cambiado por Eric: no va directa a comprar).
   - **La pestaña «Entradas» de la ficha** enseña **todas las entradas que hay para ese sitio**, cada una con su nombre, una línea de qué incluye, el precio «desde» si lo tenemos y su botón [Reservar], que abre la compra en otra pestaña con el aviso «Abriendo la tienda de entradas…». Nunca el nombre del proveedor.
     - Debajo, «¿Ya la tienes? **Añádela**», que abre la hoja de la hora de la 6m (el mismo texto que en RESERVAS; fuera «¿Ya la has reservado? Añade tu confirmación»).
     - **Los datos:** las entradas de cada sitio salen de los datos del destino, con su enlace de afiliado. Si un sitio tiene una sola, sale una. Las que falten, las pone Eric (como los datos de las excursiones); no se inventan.
     - **La pestaña naranja y «Entradas» solo salen en los sitios con entradas.** (La Basílica tendrá la subida a la Cúpula cuando esté la API.)
   - **Ya añadida:** la pestaña pasa a verde, con ✓ y la hora («11:30»). **Sin borde verde en la tarjeta.** Al tocarla, la hoja de «Cambiar» de la 6m (hora, día o eliminar).
   - **En todo lo que se puede reservar,** se visite por dentro o por fuera, siempre que tenga enlace de compra en los datos.
   - **El Coliseo y el Foro:** al añadir la entrada del Coliseo, el Foro queda añadido también (la misma entrada). Las dos pestañas en verde: el Coliseo con su hora y el Foro con el ✓. Al eliminarla, se quitan las dos.
   - **Sustituye a la etiqueta «✓ Reservada · 13:30»** de la 6j, que sale de la tarjeta.
   - **Fuera «Reserva obligatoria en estas fechas» en toda la app** (Eric: es intrusiva): en la tarjeta del día, en RESERVAS y en la ficha.
   - Mirarlo a 375 px: que la pestaña no tape el «···» ni el nombre.
2. **Fuera el botón flotante redondo del autobús** (abajo a la derecha, en DÍAS y en RUTA). Eric sabe lo que abre: quítalo sin más.

## Para Claude (documento de días, cuando Code acabe la 6q)
- **Regla 3 de `DIAS_ROMA_PARADAS.md`:** las horas fijas (reservas, turnos, Free Tour) ya no se enseñan encima de la parada. La única hora a la vista es la de la pestañita verde, cuando la entrada está reservada. Sin reservar, la parada va en su sitio sin hora. **Hecho en el documento el 9-oct-2026, tras la 6q.**

## Después de dejar RESERVAS listo (apuntado el 9-oct-2026)
- **El Free Tour según la hora:** el D3 solo está escrito con el Free Tour de las 10:00. Hay que escribir en el documento cómo queda el día con el de las 12:00, 15:00, 17:00 y 21:00 (o decidir qué horas se proponen). Mientras tanto, con otra hora sale la hoja de la regla 17. **[Superado el 9-oct-2026: la app nunca propone otra hora; ver la regla 17 del documento y las tandas 6u, 6v y 6w.]**
- **La regla 9 del documento se contradice con los días:** dice que son paradas la Conciliazione, Via Condotti, Via Veneto, el Puente, Piazza Venezia, los Fori Imperiali y el Arco de Constantino, pero los días (y la regla 10) los ponen «de camino». **Resuelto (9-oct):** manda la regla 9 (decidido el 7-oct; Eric: «Via Condotti la pusimos siempre como parada»). Hay que pasar a parada, en los días, esas que aún ponen «de camino» (y quitar los ejemplos de la regla 10). Hacerlo después de la 6r, junto con la 6u.
- **(9-oct) Ninguna hora calculada a la vista:** va en la 6t. Antes de la Tanda 7, quitar de su prompt y del documento los textos con esas horas (ver NOTAS_TANDA7_LLEGADAS.md).
- **Los enlaces de los traslados** (Fiumicino, Ciampino, Civitavecchia): Eric los pasa al final; mientras, el buscador con nuestro código.
- (9-oct) Hoteles en el día (la fila «Añade alojamiento en Roma · noches»): de momento solo el aspecto del diseño 1b (6t). Lo que hace, más adelante.
- **(9-oct) 6u: escrito en el documento (D3 «El Free Tour a otra hora», D1 con el de las 21:00, la tabla y la regla 6). Borrador en PROMPT_TANDA6U_PARA_PEGAR.md; falta el punto de la regla 9 tras el informe de la 6r.** Lo decidido para las 12:00: el D3 de siempre, corrido: Trevi 8:00, desayuno, Panteón, el Templo de Adriano (por fuera; el Hadrianeum de L–V, pendiente de horario y precio), Piazza Colonna (Columna de Marco Aurelio) y Via Condotti, como paradas, Plaza de España con la Escalinata y la Trinità (~40), en la salida a las 11:45, Free Tour 12:00–14:30, comida antes de las 15:00 cerca de Navona, Museos a las 16:00 (de 15:30 a 16:30; con otra hora, regla 17), Plaza y Basílica, Castillo y Puente iluminados, cena en Prati, sin otra nocturna. Falta: las 15:00, las 17:00 y las 21:00 (Eric lo mira). La regla 6 pasa a «antes de las 15:00». **[Superado el 9-oct-2026: la app nunca propone otra hora; ver la regla 17 del documento y las tandas 6u, 6v y 6w.]**
- **(9-oct) Fotos candidatas para la 6u:** Templo de Adriano, Piazza Colonna (Columna de Marco Aurelio) y Via Condotti (con la Escalinata al fondo). Desde Claude no se pueden descargar (el espacio de trabajo bloquea Wikimedia). **Cambiado:** las pasa Eric (fotos suyas) del Templo de Adriano y la Piazza Colonna; Via Condotti ya tiene foto.
- (9-oct) Orden de las tandas: 6t → 6v (RESERVAS segunda vuelta) → 6u (Free Tour por hora). Pendiente de decidir: escribir listas de los Museos por hora para el D2 (media mañana).
- **(9-oct) Traslados:** la pestaña Traslados se esconde hasta tener los enlaces directos de Fiumicino, Ciampino y Civitavecchia (las búsquedas dan resultados que no sirven). Eric los busca; es comisión.
- **(9-oct) Tras la 6u:** aviso «vas justo» (regla 17); Free Tour y Museos reservados en días distintos (pendiente de la respuesta de Eric sobre los Museos y el pool); el Foro nunca «por fuera» al final del Coliseo; quitar el «consejo» viejo del servidor; capturas con un viaje nuevo. **[Superado el 9-oct-2026: la app nunca propone otra hora; ver la regla 17 del documento y las tandas 6u, 6v y 6w.]**

## Revisión del documento por dos agentes (9-oct-2026, noche)
- Arreglado en el documento (lo gratis): órdenes con hora fija (D0, D1, D2, D3, D4), la llegada 15 min antes del Free Tour y 30 antes de las reservas grandes, la comida antes en reservas de 12:00 a 13:00, la Basílica con última entrada a las 19:15, el paseo por Trastevere siempre antes de cenar, el Castillo y el Puente después del Free Tour de tarde, lo del guía por libre como paradas, los nombres sin «iluminada», la regla 16 antes que la 17, y cierres de la auditoría (Tempietto, Catacumbas, Domus Aurea, San Clemente, Boca de la Verdad, Galería de las 17:45).
- **Para antes de la Tanda 7** (del informe del revisor B, todo de pago): textos con horas calculadas (doc 928 «SAL A LAS 14:00», 957, 1048, 1058; P7 58, 152; regla 15 «sal de aquí a las 11:15» en HOY); la barra vieja en doc 927 y P7 57; P7 169 (FirstLastDayCard ya quitada); tablas de días duplicadas (99–131 y 854–889); 956 contra 957 (vuelo de las 15:00 → 16:00); la tabla nueva sin 1,5, 2,5 ni 3,5 días; la «Llegada a Roma» con la tarde vacía y sin sitio para la comida; la última mañana DT-medio que repite el día 1; 2 días con vuelos sin Coliseo ni Vaticano; el Free Tour después de las 16:30 el día de llegada; el D4 «Con Free Tour» sin lista de horas de la Galería; «centro» en P7 (prueba 10) contra la regla nueva.
- **Datos por comprobar:** la cena del D5 (Felice) sin alternativa; el Mercado de Testaccio en domingo; los cierres del Cementerio Protestante; la Farnesina el segundo domingo; el Gesù en sábado; la Cripta de los Capuchinos el lunes (espera de 55 min).

## PARA MAÑANA (10-oct): la ruta a mano y lo que va detrás (decidido con Eric el 9-oct-2026, noche)

**Estado al cerrar el 9-oct:** la 6x está subida (`6b1551a`, con las franjas sin hora). La 6z (EXPLORAR solo con el nombre, el Free Tour primero en Entradas, el alojamiento cerrado y a pantalla completa, «Hoteles» en EXPLORAR, el día 1 abre el mapa, fuera el recuadro lila, la comida «después si da antes de las 15:00») está copiada para pegar. La 6y (la ruta a mano) va después de la 6z: se completa y se pega el 10-oct.

**Cuando Code suba la 6x, copiar al PC:**
- `docs\dias\DIAS_ROMA_PARADAS.md` (la regla 3 con las franjas sin hora);
- `docs\dias\GUIA_NUEVOS_DESTINOS.md`;
- `docs\dias\PENDIENTES_6K.md`;
- `docs\dias\PROMPT_TANDA6Y_PARA_PEGAR.md`;
- `docs\diseno\ruta_manual\Itinerario Eleccion.dc.html` + `support.js` (del zip ruta_manual de Eric).

Después, leer el informe de la 6x (los 63 casos, los «Si te sobra tiempo» que quedan y las pruebas que vuelven) y luego pegar la 6y.

**La 6y, cerrada con Eric:**
- **La pantalla de elegir:** va después del resumen, y «VER MI RUTA» pasa a «CONTINUAR».
  - «¡Sí, hazla por mí!» (RECOMENDADO).
  - «Quiero hacerla yo… y compártela con tus amigos». Esto último se queda: no se lanza hasta que esté todo.
- **La ruta a mano:** los días en acordeón, vacíos, con dos botones:
  - [Añadir parada]: abre EXPLORAR con toda nuestra lista, ordenada por «me gusta» > imprescindibles > nivel 1 > resto, y se pueden elegir varias;
  - [Añadir excursión]: abre nuestra página de excursiones.
- **Fuera:**
  - la hoja «¿Tienes algo ya reservado?» (parecía otro pool);
  - el «Te falta…» y las sugerencias (decide el viajero);
  - «Rellenar con la ruta de Bengala» (sería lo mismo que la primera opción).
- **Igual que en nuestra ruta:** las entradas, RESERVAS y los afiliados.
- **«Reorganizar este día»:**
  - Solo dentro del día. Nunca mueve nada a otro día, y no hay «Reorganizar el viaje».
  - **Solo ordena, nunca rellena:** Coliseo → Altar, sin meter el Foro ni el Arco. Tampoco añade comida ni cena; si el día ya las tiene, las coloca.
  - **Ordena con nuestros días escritos:** cada parada va con su grupo (una parte de un día escrito), y dentro del grupo en nuestro orden.
  - **Entre grupos, manda por este orden:** lo reservado → los momentos (sin gente al principio, Trastevere al final, las nocturnas de noche) → los grupos que ya van juntos en un día escrito (el Vaticano y luego Trastevere, del D2) → la cercanía.
  - **Ejemplo:** Coliseo, Altar, Museos, Trastevere, Fontana → Trevi → Coliseo → Altar → Museos → Trastevere.
  - Con «Deshacer». Gratis.
  - **La prueba:** al desordenar un día escrito, tiene que salir nuestro orden; además, 200 días mezclados, con 5 ejemplos para Eric.
- **Por contestar Eric:** ¿lo que marcó en el pool del formulario sale arriba en EXPLORAR con «Lo marcaste», o solo su orden?

**Las preguntas de la 6x:** quedan resueltas con «sin cuentas al minuto» (Eric, 10-oct): la comida va donde dice la lista escrita de cada franja; lo cerrado sale por fuera con su aviso; el Altar, después de comer.

**Sin cuentas al minuto (Eric, 10-oct; Tanda 6z5):** fuera «vas justo», «lo nuestro nunca te hace llegar tarde» y la cuenta de 1 h 30 hasta la última entrada del Foro. La reserva solo elige la fila de su tabla. En la tarjeta, el horario y la última entrada en pequeño. En HOY (de pago), [No me da tiempo]: la parada queda «Saltada» y se pasa a la siguiente, con [Deshacer] y [Pasarla a otro día]. El viajero mueve la comida y lo demás arrastrando.

**El presupuesto del viaje (Eric, 10-oct; Tanda 6z2):** todo lo que se añade lleva su precio (opcional, total de todas las personas, lo pone el viajero, nunca la app): el alojamiento, las entradas, las excursiones, los vuelos o trenes, el seguro, la eSIM, el coche, los traslados. El Free Tour no lleva precio. La pantalla del presupuesto (diseño `docs\diseno\presupuesto\Presupuesto.dc.html`): total con «por persona» escondido, bloques «Transporte y alojamiento», «Ruta», «Útil para el viaje» y «Extras» (a mano: propinas, comidas, compras). Se abre desde RESERVAS. Gratis. La moneda: la del viajero (de su ciudad de origen, se puede cambiar); cada precio se guarda con la suya y el presupuesto lo suma todo en la del viajero, con el cambio del día («≈»).

**La barra, HOY y los iconos (Tanda 6z3, 10-oct; diseño `docs\diseno\hoy\Iconos y HOY.dc.html`):** la barra fija Hoy · Ruta · Días · Explorar · Reservas; la cabecera con Presupuesto, campana y Perfil; HOY en cuatro momentos (antes, durante gratis, durante de pago, después; sin fechas, «Pon tus fechas»); una sola familia de iconos (la excursión, mochila); «falta» en rosa frambuesa en toda la app; con fechas, los días por su fecha (fuera «Día 1»); las fotos del viaje durante y después (sin EXIF, privadas, sin límite por ahora: decidir gratis/pago antes de lanzar); «Ubicación» y [Cómo llegar] a Google Maps en la siguiente parada.
- Por decidir: el botón «Cómo llegar a tu alojamiento» (Google Maps con el nombre del hotel y la ciudad), en la llegada del día 1, al final de cada día y en HOY. Propuesto, sin respuesta de Eric.

**HOY, solo de pago (Eric, 10-oct; Tanda 6z6):** la barra: gratis 4 pestañas (Ruta · Días · Explorar · Reservas), de pago 5 (Hoy delante). La cuenta atrás y «te faltan n cosas», arriba de RESERVAS. Durante el viaje, DÍAS se abre en hoy. Las fotos, en Perfil › Mis viajes (álbum por días; se añaden desde la ficha de la parada). HOY de pago: antes, «Tu modo Hoy se activa el…»; durante, siguiente parada, Cómo llegar, Visto, No me da tiempo, «Escuchar» (la ficha en voz alta, con la voz del móvil), «Cerca de ti» (baños, fuentes, comer) y los avisos del día; después, «Ver mis recuerdos». Panel de pruebas (versión, momento, números de prueba), solo fuera de producción. «Cerca de mí» de EXPLORAR y los filtros de baños y fuentes, de pago. En el Perfil, el mapa de mis viajes (globo con chinchetas y la lista de viajes; al tocar, el álbum). Fotos: gratis una por parada, de pago sin límite; en la gratis, «Guarda tus recuerdos» sale en RUTA después del viaje.
- Siguiente tanda de HOY (6z7, después): «sin conexión» (descargar el viaje) y avisos en el móvil («Tu entrada es hoy a las 9:00», «Hoy cierra», lluvia). En iPhone, solo con la app añadida a la pantalla de inicio: explicarlo al pagar. Más adelante: las huelgas de transporte (buscar fuente).
- Antes de lanzar: el plan comercial de Open-Meteo (el gratis no vale para uso comercial). Planes: Standard, 1 millón de peticiones al mes; nosotros, unas 48.000 al mes con 100 destinos. El precio no sale en su página: mirarlo al contratar. Su licencia (CC BY 4.0) pide citar la fuente también con el plan de pago. Ya está en la página «Créditos» del Perfil (6z6d), no en las pantallas. Ellos piden su enlace junto a cada dato: al contratar, preguntarles si les vale la página «Créditos».
- ANTES DE DAR ROMA POR ACABADA (Eric, 11-oct): elegir las fotos de docs\dias\FOTOS_ROMA_CANDIDATAS.html (las 4 excursiones, más Tívoli y Pompeya y Sorrento), poner una foto propia de la Cripta de los Capuchinos y, si las hay, de Via dei Coronari y Borgo Pio. Mientras, esas salen sin foto.
- Antes de lanzar: Supabase Pro (25 $/mes). El plan gratis solo tiene 1 GB de fotos (unos 140 viajes con una foto por parada). Pro: 100 GB y 250 GB de descarga al mes.
- Fotos (10-oct, falta que Eric lo confirme): se propone dejar una por parada en la gratis. Cuesta casi nada: unos 7 MB por viaje; 100.000 viajes, unos 13 $/mes de más. Que el álbum enseñe miniaturas (añadido para la 6z6).
- RESERVAS (Eric, 10-oct; Tanda 6z6b): lo que falta, solo en «x de 3 listo» (fuera «Te faltan n cosas» y el «0%»). El presupuesto, solo en la cartera de arriba (fuera la fila de RESERVAS), con el «+103,13 €» que vuela a la cartera al poner un precio. «Útil para el viaje»: solo tarjetas más anchas que se deslizan, con [Comprar] y [Añadir]. Los descuentos del 5 % son reales (Eric). El Perfil, a pantalla completa y que se pueda bajar (el mapa ya no se come el dedo). «Tus fotos de hoy» y las miniaturas ya estaban en la 6z6. A Code se le cortó el prompt de la 6z6b en el punto 5, así que van a la 6z6c: «Guarda tus recuerdos» como el prototipo (tres cuadros de fotos y la línea del mapa de viajes) y los tips (Eric): fuera del Perfil; en RUTA, una bombilla en la tarjeta de cada destino, al lado de la varita, con los tips de ese destino (sin tips, sin bombilla). Code la puso arriba del mapa de RUTA. También a la 6z6c: el tiempo pedido desde nuestro servidor (la 6z5 4b no se hizo) y probar de verdad una foto subida y borrada (la 0018 SÍ está aplicada: 6 policies vistas el 10-oct).
- Con el login: limpiar las fotos huérfanas. Si alguien borra los datos del navegador antes de tener cuenta, pierde el acceso a sus fotos, pero siguen ocupando sitio. Hay que borrarlas pasado un tiempo, avisando antes.

**VIAJES DE VARIOS DESTINOS: NO TOCAR TODAVÍA (Eric, 10-oct, noche).** Primero, Roma entera curada y lista para lanzar: la ruta, RESERVAS, las llegadas, todo, como si se pudiera lanzar (aunque no se lance). Hasta entonces, Code trata Roma como si no hubiera nada más. Después se curan los multidestinos. El borrador del prompt está en BORRADOR_MULTIDESTINOS.md (es un borrador: no se le pasa a Code hasta entonces). Lo decidido:
- Ejemplo: Florencia → Pisa → Roma son tres destinos. Cada uno tiene lo suyo: su chincheta en el globo con sus fotos, su alojamiento, sus entradas, sus excursiones, sus tips y su tiempo. Una vez por viaje: la llegada y la vuelta, el seguro, la tarjeta y el coche. La eSIM, una por país.
- El día de viaje: el último día de un destino es el primero del siguiente. 3 días en Roma y 5 en Florencia son 7 días: el tercero es «Roma → Florencia · día de viaje». En RUTA va entre las dos tarjetas, en vez de la distancia sola. La mañana, como nuestro día de vuelta en el primer destino; la tarde, como nuestro día de llegada en el segundo; en medio, el tren o el vuelo con [Cómo llegar]. Sin horas calculadas.
- Las fotos del día de viaje (Eric): sin preguntar nada. Con parada, a la ciudad de su parada. Sueltas (en HOY): a la ciudad de la siguiente parada por visitar; si ya está todo visto, a la de la última.
- Hoy no existe: cada día es de una sola ciudad, sin día compartido. Entre las tarjetas de RUTA solo sale la distancia. Solo Roma tiene días escritos.
- La excursión de un día (Pisa desde Florencia) también lleva su chincheta pequeña en el globo, con sus fotos (Eric, de acuerdo).
- LA FORMA (Eric, 10-oct, noche; mejor que la mía): cada destino es un viaje suelto, como Roma ahora. El último día de Roma es su día de vuelta, hasta la hora en que se va. El primer día de Florencia es su día de llegada, desde la hora en que llega. No se parte ningún día: esa fecha sale en los dos destinos. 3 días en Roma (13–15) y 5 en Florencia (15–19) son 7 días.
  - El tren de en medio se apunta una sola vez («Tren Roma → Florencia», salida y llegada). Con la salida se cierra Roma y con la llegada empieza Florencia. No se pide dos veces.
  - En la gratis (sin llegada y vuelta): ese día, por defecto, Roma por la mañana y Florencia por la tarde.
  - Esa fecha, en DÍAS, sale en cada destino con su parte («mié 15 · hasta que te vas» en Roma, «mié 15 · desde que llegas» en Florencia). En HOY, las dos partes seguidas: primero Roma y luego Florencia. En RUTA, entre las tarjetas, «Roma → Florencia · mié 15» con el tren.
  - Las horas de llegada y salida solo eligen la fila (mañana, tarde, noche), como las reservas: sin cuentas al minuto.
  - Lo de verdad grande no es el motor: es escribir los días de Florencia (y de cada destino nuevo) como los de Roma, con GUIA_NUEVOS_DESTINOS.
- Ya pedido en la 6y (punto 0): en el álbum del Perfil, un título por destino; la chincheta abre ese destino.

**EL ORDEN DE AQUÍ EN ADELANTE (Eric y Claude, 11-oct, noche; por confirmar con Eric):**
1. La 6y4 (en marcha).
2. Roma pulida: Eric prueba un viaje entero en su móvil (antes, durante y después, gratis y de pago) y apunta lo que falle; una tanda de arreglos. Elegir las fotos que faltan.
3. «Escuchar» con las historias (docs\dias\HISTORIAS_ROMA.md, revisadas por Eric; las 31 entran en la 6y5): el botón solo sale donde hay historia; la del Coliseo, gratis como muestra. Más adelante, con la voz de Eric (grabada o clonada con su permiso; el plan comercial de la empresa de voz).
4. LAS LLEGADAS (Tanda 7, PROPUESTA_LLEGADAS.md): antes que los multidestinos, porque cada destino de un viaje de varios usa su día de llegada y su día de salida, y los tramos de en medio son llegadas y salidas.
5. Curar el segundo destino (Florencia), con GUIA_NUEVOS_DESTINOS: sin un segundo destino curado no se puede ofrecer ni probar un viaje de varios (solo se buscan destinos curados).
6. Los multidestinos (BORRADOR_MULTIDESTINOS.md y docs\diseno\multidestino\).
7. El login y las cuentas; luego el viaje compartido, «Tu mundo» (el globo coloreado), el pasaporte de sellos (diseño de Eric), los logros y sus regalos (sellos especiales, colores, marcos de la tarjeta para compartir, más fotos en la gratis, portadas, insignias; sin puntos ni guías), la tarjeta para compartir y «Hace un año estabas en…».
8. Antes de lanzar: activar el pago, Supabase Pro, el plan comercial del tiempo, sin conexión y avisos en el móvil (6z7), y un mes de ElevenLabs para crear los audios de las historias ya cerradas (la voz, elegida antes con la cuenta gratis).

**Detrás de la 6y:**
1. El login: Google, Apple y email con enlace; sin obligar al principio; el viaje de ahora pasa a la cuenta. Hace falta antes de activar el pago.
2. La Tanda 7.
3. Activar el pago.
4. El viaje compartido (el admin aprueba). Es obligatorio antes de lanzar, porque la pantalla de elegir ya promete «compártela con tus amigos».
5. El mapa de viajes con fotos.
6. Más adelante: el buzón «Falta este sitio», los avisos en directo y los restaurantes de los viajeros.
