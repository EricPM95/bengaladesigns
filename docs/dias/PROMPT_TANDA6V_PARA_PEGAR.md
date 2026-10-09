Tanda 6v: RESERVAS, segunda vuelta (lo que ha visto el usuario al probar la 6s). Va todo en este mensaje. Empieza cuando esté subida la 6t. No cambia cómo se montan los días.

1. ENTRADAS: «EN TU RUTA» Y «VER MÁS»
Ahora el bloque cuenta todas las entradas («0 de 9») y nadie reserva 9 entradas. Cambia a dos partes:
- «EN TU RUTA», un título pequeño arriba, con las entradas de las paradas que el viajero visita por dentro en su ruta.
  - Van en el orden de `entradas_reservas` (Coliseo, Foro y Palatino · Museos Vaticanos y Capilla Sixtina · Panteón · Free Tour por Roma · …), y solo las que están en la ruta.
  - Son las que cuentan: el bloque dice «1 de 4 reservadas», y la ficha del resumen de arriba, «Entradas 1/4». Así se puede completar.
- Debajo, «Ver {n} más»: las demás entradas de la lista del destino que no están en la ruta (en Roma, de la Cúpula de San Pedro, la Galería Borghese, las Termas de Caracalla y el Castillo de Sant'Angelo, las que falten). No cuentan en el «x de n».
  - Sin «Añádela»: solo el botón para reservar (punto 2). Para meter una de estas en el viaje, el viajero usa «+ Añadir parada» en DÍAS, como siempre.
  - Si no hay más, la línea no sale.
- Si el viajero añade a la ruta una parada con entrada (o la quita), pasa sola de una parte a la otra, y el «x de n» se recalcula.

2. [RESERVAR ENTRADA] ABRE LA FICHA, NO LA TIENDA
- En RESERVAS, [Reservar entrada] (y [Reservar Free Tour]) ya no van directos a la tienda. Abren la ficha de ese sitio en su pestaña «Entradas» (la de la 6n: Resumen · Entradas · Tips), donde están todas sus entradas con su [Reservar].
- Es lo mismo que ya hace la pestañita naranja de la tarjeta en DÍAS.
- «¿Ya la tienes? Añádela» sigue igual: abre la hoja de la hora.

3. LA ZONA DEL ALOJAMIENTO, CON UN DESPLEGABLE
Ahora son siete fichas que ocupan mucho, y quitan protagonismo a [Buscar alojamiento]. Cambia a:
- una sola línea, «¿En qué zona te alojas?», con un campo que se toca: «Elige tu zona ⌄» (o la zona elegida);
- al tocarlo, una hoja desde abajo con las siete zonas en una rueda, como la de la hora (Centro (Panteón, Trevi, Navona) · Plaza de España · Prati · Trastevere · Termini · Monti · Aún no lo sé), y [Guardar];
- debajo del campo, el botón [Buscar alojamiento] bien visible, como botón principal. Abre la hoja del mapa.
  - Con una zona ya elegida, el bloque se cierra como ahora («Te alojas en Prati · Cambiar»).
  - Con «Aún no lo sé» o sin elegir, el botón sigue a la vista.
- Igual en la versión gratis, pero sin el campo de la zona: solo [Buscar alojamiento].

4. EXCURSIONES: «¿YA TIENES UNA? AÑÁDELA», DENTRO DEL BLOQUE
- Ahora sale debajo, fuera de la tarjeta. Ponlo dentro de la tarjeta de «Excursiones desde Roma», justo debajo del botón [Ver excursiones], en pequeño.
- Con día de excursión, como está («¿Ya la tienes? Añádela», dentro de su tarjeta).

5. FUERA LA HOJA DE «NO ENCAJA BIEN» (regla 17, decidido el 9-oct, para todos los destinos)
La app nunca propone otra hora: el viajero compra la entrada cuando le va bien y la app se adapta.
- Fuera la hoja «A las 11:45 la visita no encaja bien en el día. Te proponemos las 13:30 o las 14:00» con sus botones, en todos los sitios donde sale (RESERVAS, DÍAS, la ficha).
- Al guardar una hora, se queda. El día usa la lista escrita de esa hora; si no la hay, la reserva manda (regla 4), sin preguntar y sin inventar paradas (6r). En la 6u llegan las listas que faltan en el documento.
- Lo único que sí avisa: si dos reservas se pisan (por ejemplo, el Free Tour de 10:00 a 12:30 y los Museos a las 11:45). La hoja de abajo y la campana: «Tu Free Tour y tu entrada a los Museos coinciden. Revisa una de las dos reservas.» [Ver mis reservas]. Con los nombres de las dos reservas que sea. Se va sola cuando se arregla.
- A INVARIANTES.

6. «¿AJUSTAMOS TU RUTA A TU VUELO?»
Se queda como está hasta la Tanda 7, que lo quitará. Solo comprueba que en la versión gratis no sale nunca.

7. PRUEBAS
- Las de siempre a 0 fallos (con la 6r, la 6s y la 6t).
- La prueba 6s, puesta al día:
  - el «x de n» de entradas cuenta solo las de «En tu ruta»;
  - «Ver más» son solo las que no están en la ruta;
  - [Reservar entrada] abre la ficha, no un enlace de fuera.
- A mano, a 375 px y 390 px, gratis y de pago:
  - el bloque de entradas;
  - la hoja de la zona;
  - [Buscar alojamiento];
  - las excursiones con y sin día de excursión;
  - una hora sin lista (los Museos a las 11:45): no sale ninguna hoja;
  - dos reservas que se pisan: sale el aviso.
- Capturas en el informe.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6v en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
