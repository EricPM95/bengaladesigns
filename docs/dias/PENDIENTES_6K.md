# Pendientes de la 6k

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
     - **Si aun así la hora no tiene lista escrita** (la Galería a las 12:00, por ejemplo), se aplica la regla 17 con una hoja desde abajo: «A las 12:00 la visita no encaja bien en el día. Te proponemos las 11:00 o las 15:00.» [11:00] · [15:00] · [Dejar las 12:00]. Si la deja, se aplica la regla 4, sin romper nada de lo de arriba.
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
   - **Se queda también la hoja de la regla 17** (la que propone otras dos horas cuando la hora elegida no tiene día escrito): es otra cosa y sigue haciendo falta.
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
- **El Free Tour según la hora:** el D3 solo está escrito con el Free Tour de las 10:00. Hay que escribir en el documento cómo queda el día con el de las 12:00, 15:00, 17:00 y 21:00 (o decidir qué horas se proponen). Mientras tanto, con otra hora sale la hoja de la regla 17.
- **La regla 9 del documento se contradice con los días:** dice que son paradas la Conciliazione, Via Condotti, Via Veneto, el Puente, Piazza Venezia, los Fori Imperiali y el Arco de Constantino, pero los días (y la regla 10) los ponen «de camino». **Resuelto (9-oct):** manda la regla 9 (decidido el 7-oct; Eric: «Via Condotti la pusimos siempre como parada»). Hay que pasar a parada, en los días, esas que aún ponen «de camino» (y quitar los ejemplos de la regla 10). Hacerlo después de la 6r, junto con la 6u.
- **(9-oct) Ninguna hora calculada a la vista:** va en la 6t. Antes de la Tanda 7, quitar de su prompt y del documento los textos con esas horas (ver NOTAS_TANDA7_LLEGADAS.md).
- **Los enlaces de los traslados** (Fiumicino, Ciampino, Civitavecchia): Eric los pasa al final; mientras, el buscador con nuestro código.
- (9-oct) Hoteles en el día (la fila «Añade alojamiento en Roma · noches»): de momento solo el aspecto del diseño 1b (6t). Lo que hace, más adelante.
- **(9-oct) 6u: escrito en el documento (D3 «El Free Tour a otra hora», D1 con el de las 21:00, la tabla y la regla 6). Borrador en PROMPT_TANDA6U_PARA_PEGAR.md; falta el punto de la regla 9 tras el informe de la 6r.** Lo decidido para las 12:00: el D3 de siempre, corrido: Trevi 8:00, desayuno, Panteón, el Templo de Adriano (por fuera; el Hadrianeum de L–V, pendiente de horario y precio), Piazza Colonna (Columna de Marco Aurelio) y Via Condotti, como paradas, Plaza de España con la Escalinata y la Trinità (~40), en la salida a las 11:45, Free Tour 12:00–14:30, comida antes de las 15:00 cerca de Navona, Museos a las 16:00 (de 15:30 a 16:30; con otra hora, regla 17), Plaza y Basílica, Castillo y Puente iluminados, cena en Prati, sin otra nocturna. Falta: las 15:00, las 17:00 y las 21:00 (Eric lo mira). La regla 6 pasa a «antes de las 15:00».
- **(9-oct) Fotos candidatas para la 6u:** Templo de Adriano, Piazza Colonna (Columna de Marco Aurelio) y Via Condotti (con la Escalinata al fondo). Desde Claude no se pueden descargar (el espacio de trabajo bloquea Wikimedia). **Cambiado:** las pasa Eric (fotos suyas) del Templo de Adriano y la Piazza Colonna; Via Condotti ya tiene foto.
- (9-oct) Orden de las tandas: 6t → 6v (RESERVAS segunda vuelta) → 6u (Free Tour por hora). Pendiente de decidir: escribir listas de los Museos por hora para el D2 (media mañana).
- **(9-oct) Traslados:** la pestaña Traslados se esconde hasta tener los enlaces directos de Fiumicino, Ciampino y Civitavecchia (las búsquedas dan resultados que no sirven). Eric los busca; es comisión.
- **(9-oct) Tras la 6u:** aviso «vas justo» (regla 17); Free Tour y Museos reservados en días distintos (pendiente de la respuesta de Eric sobre los Museos y el pool); el Foro nunca «por fuera» al final del Coliseo; quitar el «consejo» viejo del servidor; capturas con un viaje nuevo.
