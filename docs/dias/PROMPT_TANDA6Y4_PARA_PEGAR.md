Tanda 6y4: 17 arreglos rápidos que ha visto Eric probando la app, más la etiqueta «Trastevere» (decidido por Eric el 11-oct-2026). Va todo en este mensaje. Si te llega cortado, está entero en docs\dias\PROMPT_TANDA6Y4_PARA_PEGAR.md. La 6y3 ya está subida: empieza ahora.

Antes de empezar: he copiado en docs\dias este prompt, en docs\diseno\ficha_lugar\ el diseño nuevo de la ficha de cada lugar («Ficha Lugar.dc.html») y en docs\diseno\perfil\ el del Perfil («Perfil.dc.html»), cada uno con su support.js e image-slot.js. Mételos en un commit tal cual.

IMPORTANTE: como siempre, solo Roma; nada de varios destinos. Las reglas de siempre: la app avisa y no prohíbe, sin horas calculadas a la vista, sin nombres de empresas en nuestros textos.

0. LAS RESPUESTAS A TUS 9 PREGUNTAS DE LA 6Y3
- Pregunta 1 (dentro del nivel 1, el orden editorial): bien así.
- Pregunta 2 (la foto del Free Tour a mano): su punto de encuentro es la Plaza de España, así que la foto de la Plaza de España (la nuestra, con su crédito si lo lleva), en la ruta a mano y en la nuestra.
- Preguntas 3 y 4 (las fotos de Tívoli y de Pompeya y Sorrento): las elige Eric antes de dar Roma por acabada (está en PENDIENTES). No cambies nada.
- Pregunta 5 (acortar las fechas cuando los días a quitar tienen una excursión reservada): esos días se quitan también, como los demás. El «¿Estás seguro?» lo dice: «Se quitarán el jue 16 y el vie 17, con sus paradas y tu excursión a Pompeya». Nunca quedan días de más.
- Pregunta 6 ([Deshacer] tras acortar): no. Basta con el «¿Estás seguro?».
- Pregunta 7 (las reservas de los días quitados): se quitan con su día (también del presupuesto), y el «¿Estás seguro?» las nombra («y tu entrada al Coliseo del vie 16»). No se quedan sueltas en RESERVAS.
- Pregunta 8 ([Deshacer] al quitar otras reservas): sí, en todas, igual que con el Free Tour.
- Pregunta 9 (el calendario de la cabecera de RUTA tapado por el panel): sí, se arregla con el punto 3 de aquí (el calendario solo, a pantalla completa, en todos los sitios).

1. LA PANTALLA DE ELEGIR, SIN ESPERA
- Al tocar «¡Sí, hazla por mí!» sale «Creando tu itinerario…» y tarda un momento en pasar. Que pase al momento a la pantalla siguiente (la ruta se sigue montando por detrás, como siempre). Igual con «Quiero hacerla yo».

2. EL POOL DEL FORMULARIO: MÁS SITIOS EN VIAJES LARGOS
- Ahora se pueden elegir 5 sitios. Con los días escritos hay sitio para más: 1 y 2 días, 5; 3 días, 7; 4 días o más, 8.
- Dime en el informe si con 8 sitios elegidos la ruta de 4 días sigue saliendo bien (sin quitar nada de lo elegido y sin zigzag).

3. «PON TUS FECHAS» DESDE HOY: SOLO EL CALENDARIO
- Sin fechas, en HOY, [Pon tus fechas] abre ahora la pestaña DÍAS con el calendario detrás: los días salen por encima del calendario.
- Que se abra solo el calendario, a pantalla completa (con un portal al body, como los tips), por encima de todo. Al guardar o cerrar, vuelve a donde estaba. Mira si [Pon tus fechas] se abre así desde los demás sitios (RESERVAS, la cabecera…) y que sea igual en todos.

4. EL CALENDARIO, CON NUESTRO ESTILO
- El calendario de dentro de la app parece anticuado. Usa el mismo diseño que el calendario del formulario (el paso de las fechas, StepDates), con sus colores, su letra y su temporada, en todos los sitios donde se cambian las fechas dentro de la app. Un solo calendario en toda la app.
- Si no se puede usar el mismo, dímelo y lo pedimos a diseño.

5. FUERA LA FONTANA DE TREVI DE «ENTRADAS»
- La Fontana de Trevi no tiene entrada que se compre: se paga allí (la tasa para bajar junto al agua). Quítala de la lista de «Entradas y Free Tour» de RESERVAS, de «x de 3 listo» y de todo lo que cuente entradas por comprar.
- En su ficha, lo que diga nuestro dato (el diseño nuevo trae el bloque «No necesitas entrada · Bajar junto al agua»). Los importes y horarios, solo si están en nuestros datos y comprobados con la fuente oficial (la auditoría de horarios); si no, ese bloque sin números.

6. MENOS «10:30» CON UNA ENTRADA RESERVADA
- Con la entrada reservada, la pestaña «Entradas» del lugar dice ahora «Ya tienes entrada · 10:30», «Entrada 10:30» y «Entrada 10:30 · Llega a las 10:00: la cola de control…». Demasiado.
- Que la hora salga una sola vez: «✓ Tu entrada: 10:30». Y debajo, sin hora calculada: «Llega unos 30 minutos antes: hay cola de control» (15 en el Free Tour y los turnos, como en la regla 4).
- Mira lo mismo en la tarjeta de la parada en DÍAS, en HOY y en RESERVAS: la hora de la entrada, una vez por pantalla.

7. FALLO: PARADAS QUE DESAPARECEN CON UNA RESERVA (importante)
Eric hizo esto:
- una ruta de 3 días, sin Free Tour. El día 3 tenía el Ara Pacis;
- puso una reserva del Coliseo a las 10:00 el día 1 (el día 1 quedó con Coliseo, Arco, Foro, Piazza Venezia y el Altar). El Ara Pacis desapareció: no está ni en el día 2 ni en el 3;
- luego añadió una reserva del Altar de la Patria para el día 3. Apareció el Ara Pacis delante de todo, con «Tarde → Ara Pacis → 10:00», y el Altar desapareció: no está en ningún día.
- Con el Coliseo o los Museos sí cambia el día entero, como debe.
Lo que tiene que pasar (reglas de siempre): con una reserva no se quita nada nunca. Si una reserva cae en otro día, ese día pasa entero con su bloque (todo o nada), y lo que había en el día al que llega se va al día que deja libre. Cada reserva, a la hora del viajero, y en la fila de su tabla. Un sitio reservado que va en el bloque de otro (el Altar en el bloque del Coliseo) sale del bloque y va al día de su reserva.
- Repite exactamente lo que hizo Eric, encuentra por qué se pierden el Ara Pacis y el Altar, y por qué sale «Tarde → … → 10:00» en la mañana, y arréglalo en la regla, no a mano.
- Añade a la prueba de listas una comprobación nueva: tras cualquier reserva (de cualquier sitio, también de los que no tienen tabla, como el Altar), las paradas del viaje son exactamente las mismas que antes (ni una menos), en todas las fechas.

8. LA MONEDA, SIN «TUYA»
- Al añadir algo con precio sale «EUR · tuya». Que salga solo la moneda («EUR», o la que sea).

9. «TU MONEDA», MÁS BONITO EN EL PRESUPUESTO
- Abajo del todo del presupuesto pone «Tu moneda EUR · cambiar». Que sea una fila con el estilo de la app: «Moneda» a la izquierda y, a la derecha, «€ Euro» con su flecha, que abre el selector de moneda como ahora.

10. FUERA EL CONTADOR DE PARADAS EN DÍAS
- Quita «17 paradas», «11 paradas»… de las cabeceras de los días en DÍAS.

11. EL AVISO DEL ALOJAMIENTO, SOLO SI FALTA
- El bloque del principio del día 1 que recuerda reservar el alojamiento: si el viajero ya ha añadido su hotel, que no salga. Solo sale mientras falta.

12. EL VUELO: PRECIO Y CÓDIGO
- En «Añadir vuelo» (y lo mismo en tren o autobús), dos campos más, opcionales: el precio (al presupuesto, con la pastilla que vuela a la cartera) y el código del vuelo («IB 3214»), que luego se ve en la tarjeta de la llegada y la vuelta, para consultarlo cuando quiera.

13. SEGURO, eSIM Y TARJETA: DÓNDE LO HA COMPRADO
- Al añadir el seguro de viaje, la eSIM o la tarjeta, un campo opcional «¿Dónde lo has comprado?» (texto libre), que se ve luego en su tarjeta («✓ Lo tienes · {lo que escribió}»). Lo escribe el viajero: nuestros textos siguen sin nombrar empresas.

14. LA PASTILLA DEL PRECIO NO SALE
- Eric dice que al guardar algo con precio no ve el efecto hacia la cartera. Pruébalo en todos los sitios donde se guarda un precio (alojamiento, entradas, excursiones, vuelo o tren, seguro, eSIM, tarjeta, extras) y arréglalo donde no salga. Si en alguno sale y Eric no lo ve (por ejemplo, porque la cartera queda tapada por una hoja), que la pastilla espere a que se cierre la hoja y vuele entonces.

15. EL PERFIL, CON EL DISEÑO NUEVO
- El diseño está en docs\diseno\perfil\Perfil.dc.html. Cópialo entero (cabecera, «Hola, viajero» con su círculo, el mapa con su chincheta «Roma ×5», las cifras «1 país · 4 lugares · 14 días», «Mis viajes» con su número, cada viaje con su fecha, «155 fotos» y «Abierto», «Créditos» y [+ Nuevo viaje] al final del todo). Los textos y los datos, los nuestros (las cifras salen de los viajes de verdad).
- Lo único distinto del diseño: la bandera de cada viaje, igual que en la tarjeta del destino de la pestaña RUTA (el cuadrado redondeado con las franjas inclinadas), no la franja cortada del diseño.
- El mapa: nuestro globo de Mapbox de verdad, dentro del marco del diseño, un 30 % más alto que ahora.
- Fuera «Pronto podrás guardar tus viajes en tu cuenta» (el diseño ya no lo lleva).
- Al tocar un viaje de «Mis viajes»: solo el título, la fecha y el álbum, con todas las fotos del viaje juntas en una cuadrícula. Sin filtros ni títulos por día ni por lugar: es el álbum de ese viaje («Roma · 2 – 10 sep»), no de cada parada.
- Cómo llegan las fotos al álbum: desde el botón redondo de la cámara que va en la esquina de la foto de la ficha de cada parada (el del diseño de la ficha nueva; en la gratis, una por parada; en la de pago, sin límite), desde «✓ Visto» y «Tus fotos de hoy» en HOY (de pago) y desde «Guarda tus recuerdos». Todas van al mismo viaje. Por dentro se siguen guardando con su día y su parada (la gratis las cuenta por parada); solo que no se enseñan así.
- En la gratis, el álbum no lleva [Añadir fotos] (se añaden desde la ficha de cada parada); en la de pago, sí.
- EL EFECTO NUEVO («la foto vuela al Perfil»), como la pastilla del precio: al añadir una foto desde cualquier sitio, una miniatura de la foto vuela hasta el botón del Perfil de la cabecera (el icono o la foto del perfil, lo que haya), encogiendo y desvaneciéndose (unos 0,8 s), y el botón da un saltito. Con «reducir movimiento», solo el saltito. Si el botón queda tapado por una hoja, el vuelo espera a que se cierre.

16. LA FICHA DE CADA LUGAR, CON EL DISEÑO NUEVO
- El diseño está en docs\diseno\ficha_lugar\Ficha Lugar.dc.html. Copia todo el diseño tal cual (Eric: «solo hay que copiar todo el diseño»): la foto de arriba, el nombre, las etiquetas pequeñas (duración, acceso, tipo), el texto, «Qué vas a ver», «Por el camino», «Horario», «Cómo llegar», el bloque de la entrada y «Escuchar la historia» (de pago, la voz del móvil de la 6z6).
- Los textos, los nuestros (los de nuestros datos), no los de ejemplo del diseño. Una sección sin datos, no sale.
- Lo que ya tiene la ficha de ahora (la foto con su crédito, el horario de ese día, «Añadir foto», «Me gusta», «Añadir a mi día»…) se queda, colocado en el diseño nuevo. Dime en el informe dónde has puesto cada cosa.

17. LOS ICONOS DE TRANSPORTE, LOS DEL DISEÑO DE VARIAS CIUDADES
- Algunos iconos de transporte de la app no se entienden. Cambia todos (avión, tren, autobús, coche y los que haya) por los del diseño docs\diseno\multidestino\Varias Ciudades.dc.html (están ahí como trazos SVG: avion, tren, bus, coche). Si falta alguno (barco, a pie, autocaravana…), hazlo con el mismo estilo de línea y dímelo.

18. LA ETIQUETA «TRASTEVERE»
- Mucha gente conoce Trastevere pero no sus sitios. En cada lugar que está en Trastevere (según la zona de nuestros datos), una etiqueta pequeña «Trastevere», en lila: en la tarjeta de la parada en DÍAS y HOY, en EXPLORAR y en la ficha.
- Un lila de la familia de la app que no se confunda con los colores de los días ni con el frambuesa. Dime en el informe qué sitios la llevan.

19. PRUEBAS
- Las de siempre a 0 fallos (con la 6y, 6y2 y 6y3), y la de listas con las 365 fechas (por el punto 7).
- Lo del punto 0: al acortar con una excursión o una entrada reservada en los días que se quitan, el «¿Estás seguro?» las nombra y se quitan con su día; [Deshacer] al quitar cualquier reserva.
- Una prueba 6y4: 0 esperas al elegir camino; el tope del pool según los días; el calendario solo, por encima de todo; la Fontana de Trevi fuera de las entradas; la hora de una entrada una sola vez por pantalla; ni una parada perdida tras una reserva (punto 7); sin «tuya» en la moneda; sin contador en DÍAS; el aviso del alojamiento solo cuando falta; el precio y el código del vuelo; «¿Dónde lo has comprado?»; la pastilla en todos los sitios con precio; el Perfil como el diseño (con la bandera de RUTA) y con el álbum sin filtros; la foto que vuela al Perfil; la etiqueta «Trastevere».
- A mano, a 375 px, con el panel de pruebas, gratis y de pago: lo que hizo Eric en el punto 7, paso a paso, con capturas de antes y después; el calendario nuevo desde HOY; la ficha nueva (la Fontana de Trevi y un sitio con entrada reservada); el Perfil y su álbum; la foto volando al Perfil al añadirla desde una ficha; la pastilla al guardar el vuelo con precio. Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y4 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
