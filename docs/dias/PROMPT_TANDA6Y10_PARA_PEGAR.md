Tanda 6y10 (después de la 6y9). Las respuestas a la 6y9, los fallos que han salido al revisar 20 viajes, la ficha del lugar con sus «me gusta», la etiqueta de Trastevere y añadir una excursión con los días llenos. Va todo en este archivo.

Antes de nada: Claude ha copiado en docs\dias PENDIENTES_6K.md, este prompt, VIAJES_REVISION.html (la revisión de 20 viajes) y la carpeta docs\dias\llegadas_rev\ (la revisión de la Tanda 7, para más adelante). Súbelos en el primer commit, sin tocarlos.

REGLA DE LAS PREGUNTAS (como siempre): lo pequeño lo decides tú, siguiendo el documento y las reglas de siempre, y lo apuntas en el INFORME en «Decidido por Code». En PREGUNTAS, como mucho 5.

0. RESPUESTAS A PREGUNTAS_TANDA6Y9.md
- P1, los horarios (Eric los ha mirado en las webs oficiales; ponlos así y apunta la fuente y la fecha, 13-oct-2026):
  - Panteón: todos los días de 9:00 a 19:00, último acceso a las 18:30. Cierra el 1 de enero y el 25 de diciembre. La entrada lleva hora: la rueda se queda.
  - Museos Vaticanos: de lunes a sábado de 8:00 a 20:00, último acceso a las 18:00. El último domingo de cada mes, de 9:00 a 14:00, último acceso a las 12:30 (salvo si cae en Pascua, el 29 de junio, el 25, el 26 o el 31 de diciembre). Cierran: los domingos (salvo el último del mes, si no es el 29 de junio), el 1 y el 6 de enero, el 11 de febrero, el 19 de marzo, el lunes de Pascua, el 1 de mayo, el 29 de junio, el 14 y el 15 de agosto, el 1 de noviembre y el 8, el 25 y el 26 de diciembre. Revisa que los datos digan exactamente esto (hoy hay fechas sueltas de 2027 que no salen en esta lista: quítalas si no están en la web).
  - Galería Borghese: de martes a domingo de 9:00 a 19:00, no se entra después de las 17:00. Turnos de 2 horas: 9, 11, 13, 15 y 17. Cierra los lunes.
  - Coliseo y Foro: el horario normal que ya tienes, también en febrero y marzo de 2027.
  - Regla (Eric): los cierres raros por celebraciones religiosas u otros días muy puntuales no los metemos.
- P2: vale. Lo que no cabe con el Free Tour de las 19:00 va a «Si te sobra tiempo», como siempre.
- P3: vale así.
- P4: no. La comida nunca va antes de las 12:00. La única excepción es la de los Museos reservados de 12:00 a 13:00 (comida antes, hacia las 11:15–11:30, cerca del Vaticano). Con los Museos a las 15:00 un miércoles: la mañana con sus paradas y el Castillo por dentro, la comida a su hora normal cerca del Vaticano y los Museos a las 15:00. Si queda un rato, no pasa nada.
- P5: vale al lanzar, pero con nombres de archivo que no se puedan adivinar (por ejemplo, con la huella del texto en el nombre) y sin ninguna lista pública de los audios. Los enlaces que caducan, más adelante si hace falta.
- Hallazgo de la parte 4: los «sitios grandes» (RESERVAS_GRANDES y BIG_RESERVATION_PLACES) son una lista fija de Roma. Pásalos a los datos del destino (un campo en roma.json), que el motor y la app lean de ahí, y que la guía lo diga. Roma tiene que salir exactamente igual que ahora.

1. LOS FALLOS QUE HAN SALIDO AL REVISAR 20 VIAJES (docs\dias\VIAJES_REVISION.html, «Cosas a mirar»)
Arréglalos con las reglas de siempre (nada se quita sin que lo decida el viajero; lo que no cabe, a «Si te sobra tiempo»):
- a) LO MÁS GORDO: el día del Vaticano se queda en un día en que cierran los Museos aunque otro orden de días lo evitaría. Ejemplo: 3 días del 24 al 26 de diciembre: hoy sale el Coliseo el 24, el Vaticano el 25 (cierran) y Villa Borghese el 26. Lo bueno: el Vaticano el 24 (abren), el Coliseo el 26 (abre) y Villa Borghese el 25 (la Galería cierra, pero es lo que menos se pierde). Pasa porque el motor solo prueba a cambiar un día con el siguiente. Arreglo: probar todos los órdenes posibles de los días del viaje (son pocos) y quedarse con el que pierde menos: si algo tiene que caer en un día cerrado, que sea lo de menor importancia (Eric: «es normal que alguno se pierda alguna vez»). Primero se salvan los imprescindibles, luego el nivel 1, luego lo demás; si empatan, el orden de siempre (lo imprescindible primero). El 31 de diciembre y el 1 de enero en un viaje de 2 días, como está (Eric: es lógico). Un día con horario reducido (el 24 y el 31 de diciembre, los Museos de 8:00 a 15:00) vale como día abierto, con la lista de los Museos por la mañana. Los días cambiados a mano y los días con una reserva del viajero no se mueven.
- b) Cuando de verdad no hay otro día (por ejemplo, del 14 al 16 de agosto): hoy sale «Llegada a los Museos» y 3 horas como si abrieran. Debe salir la parada marcada «Cerrado este día», sin «Llegada a…» y sin ocupar tiempo, con su aviso (se queda, no se quita: decide el viajero), y el resto del día como la versión sin Museos del documento.
- c) La Basílica de San Pedro por dentro cuando ya ha cerrado (Viaje 14, día 1: de 19:15 a 20:15, cierra a las 20:00) y antes de que abra un miércoles (Viaje 16, día 2: a las 11:59, abre a las 12:30). Con su horario real: si llega antes de que abra, espera o va después; si ya ha cerrado, por fuera con su aviso.
- d) Los avisos «Abre a las…» que salen aunque la ruta llega después de esa hora (San Luigi dei Francesi, la Iglesia del Gesù, Santa Maria del Popolo), y el aviso repetido «Abre a las 16:30. Abre a las 16:00». Solo sale si llega antes de que abra, y una sola vez, con la hora de ese día.
- e) Un cambio de día por un cierre que no gana nada (Viaje 5: el día del Vaticano se cambia del 15 al 14 de agosto, pero los Museos cierran los dos días). Si el otro día también cierra, no se cambia.
- Lo demás de «Cosas a mirar» (el Free Tour el día 2 o 3 por cierres, el Vaticano el último día en el Viaje 12, las comidas hacia las 14:45 en el día de la Galería) lo mira Eric: no lo toques.
- Prueba: añade los 20 viajes de la revisión a la prueba de listas, con estos casos comprobados.

2. LA FICHA DEL LUGAR: LAS ETIQUETAS Y LOS «ME GUSTA»
Diseño: docs\diseno\ficha_lugar\Ficha Lugar.dc.html (versión nueva, con el corazón; Claude la copia en docs\diseno\ficha_lugar\). Debajo del nombre:
- solo dos etiquetas: el reloj con el horario de ese día, sin texto («🕒 08:30–16:00»; si ese día cierra, «Cerrado»; sin fechas, el del mes), y el reloj de arena con el tiempo que recomendamos («⌛ 45 min»). Nada más dentro de la ficha: fuera «Monumento», «Fuente», «Mirador», «Ruinas», «Reserva obligatoria», «Acceso libre», «Abierto», «Abre a las…» y la etiqueta lila de Trastevere. Esas etiquetas siguen donde están fuera de la ficha (listas, tarjetas), salvo lo del punto 3;
- debajo, el botón del corazón como en el diseño: al tocarlo, el viajero da su «me gusta» (y lo quita al tocar otra vez), con su animación.
- El texto del botón: «{n} lo recomiendan» (sin «viajeros»: la cifra de partida sale de las redes de Eric, ver abajo).

LOS «ME GUSTA» DE PARTIDA (Eric): son «me gusta» reales de las redes de Eric; como no sabe el número exacto, se pone una cifra por debajo de la real:
- imprescindibles y nivel 1: entre 100 y 199; nivel 2: entre 50 y 99; nivel 3: 0;
- los 20–25 restaurantes que más salen en los días escritos: entre 100 y 199.
- Cada sitio, una cifra fija guardada en sus datos (no al azar cada vez), en un campo propio («me gusta de partida»), con la nota «redes de Eric, aproximado por debajo del real». Los «me gusta» de los viajeros de la app se suman encima (sin login, guárdalo como se guarda hoy el viaje; con login, en la cuenta). El orden de EXPLORAR por «me gusta» usa la suma.
- UNA SOLA CUENTA POR SITIO, la misma en toda la app (Eric): el corazón de EXPLORAR (el que ya sale en cada tarjeta, «♡ 2 viajeros») y el de la ficha son el mismo «me gusta» y enseñan el mismo número. Si el viajero lo da en la ficha, sale marcado y sumado en EXPLORAR, y al revés. Se puede dar desde los dos sitios. El Coliseo tiene siempre los mismos «me gusta» en su ficha que en EXPLORAR, que en cualquier otro sitio.
- En EXPLORAR, como ya está, el corazón con su número; el texto «viajeros» pasa a ser solo el número («♡ 154»), por lo mismo que en la ficha.

3. LA ETIQUETA LILA «TRASTEVERE»
Solo en los acordeones de los días (DÍAS y HOY). Fuera de las listas de EXPLORAR y de la ficha.

4. AÑADIR UNA EXCURSIÓN CUANDO LOS DÍAS ESTÁN LLENOS
En EXPLORAR › Excursiones › [+ Añadir], hoy sale que no cabe en ningún día (está bien). Debajo, dos opciones más, con el diseño de ahora:
- [Añadir en un día nuevo]: el viaje gana un día al final con la excursión (con fechas, la vuelta pasa al día siguiente). Sin aviso propio: si la vuelta de RESERVAS ya no cuadra, sale el aviso de siempre en la campana y decide el viajero. Con [Deshacer].
- [Cambiar un día por la excursión]: la lista de días con su título; los que llevan imprescindibles, marcados; arriba, recomendado, el que menos se pierde. Antes de cambiar, el «¿Estás seguro?» de siempre, nombrando lo que se pierde. Un día con una reserva del viajero sale en gris con «Tienes una reserva este día». Con [Deshacer].
- Igual para todos los destinos.

PRUEBAS (regla de Eric)
- Toca el motor (puntos 0 y 1): durante la tanda, la batería rápida y la muestra de unas 60 fechas, en paralelo. Con eso a 0 fallos, el push. Después del push, las 365 fechas completas, con el resultado al final del INFORME en un commit aparte; si sale algún fallo, no arregles nada: apúntalo arriba de PREGUNTAS.
- Nuevas: los casos del punto 1 (con el de 24-26 de diciembre) en los 20 viajes de la revisión; Roma con los sitios grandes leídos de los datos sale igual que antes; la comida nunca antes de las 12:00 salvo la excepción de los Museos; la ficha solo con sus dos etiquetas y el corazón; los «me gusta» de partida en su rango y fijos; Trastevere solo en los días; las dos opciones de la excursión.
- A mano, a 375 px: la ficha (Coliseo y Trevi, con fechas y sin fechas, y un día que cierra), el corazón, EXPLORAR ordenado por «me gusta», y las dos opciones de la excursión.
- Capturas en docs/dias/img/6y10-*.jpg. (La revisión de 20 viajes la vuelve a generar Claude después del push.)

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y10 en docs/dias, en palabras sencillas, y commits locales. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
