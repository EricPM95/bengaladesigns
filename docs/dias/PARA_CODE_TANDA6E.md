# Para Code · Tanda 6e: reservas que pierden un imprescindible

He mirado uno a uno los viajes con cada hora de reserva de `VIAJES_LISTAS.html`. Los Museos a las 14:00 y a las 16:00 y el Coliseo a las 14:00 salen bien. En tres casos se pierde un imprescindible. El fallo es de mis listas, no del motor: las he reescrito en `DIAS_ROMA_PARADAS.md`. Pásalo por el convertidor y no lo toques.

## Cómo trabajar

- **Nada de parches.**
- `PROGRESO_TANDA6E.md` con una línea por bloque, y TERMINADO al final.
- Al acabar, `INFORME_TANDA6E.md` en palabras sencillas.
- **Commits locales por bloques. No hagas push.**

## 1. Lo que pasaba

1. **Museos a las 11:00:** la Basílica de San Pedro pasaba a «de camino» (5 min) para que la comida no pasara de las 14:30.
   - **Lista nueva**, «Museos reservados a media mañana»: la Basílica y la Plaza, antes de los Museos.
2. **Coliseo a las 11:00:** el Foro y el Palatino pasaban a «por fuera» (30 min), y entraba de relleno San Pietro in Vincoli por fuera.
   - **Lista nueva**, de 10:30 a 11:00: San Pietro in Vincoli por dentro, el Arco y el Coliseo; **el Foro, después**, por dentro.
   - De 11:30 a 12:00, el Foro va antes.
3. **Coliseo a las 16:00:** el Foro pasaba a «de camino» (5 min), y después del Coliseo quedaban casi 3 horas vacías hasta la cena.
   - **Lista nueva:** el Foro va **después** del Coliseo, con la misma entrada.
4. **Coliseo a mediodía:** el Gesù y San Luigi iban a «Si te sobra tiempo» y la tarde acababa a las 17:40.
   - **Lista nueva:** van en la tarde; solo el Barrio Judío pasa a «Si te sobra tiempo».
5b. **Free Tour de mañana y Museos a las 14:00 (D3):** sí caben, y ya no es un «caso conocido». Hay lista escrita en el D3, «Con los Museos reservados de 13:30 a 14:30»: taxi de Navona al Borgo, comida de ~45, Museos y la Basílica al salir. Antes de las 13:30 no cabe, y la app propone otra hora. **Quita el aviso** de «Free Tour + Museos a las 14:00» que pusiste en la 6c.
5. **Roma en un día (D0) con el Coliseo de 12:30 a 15:30** (tu pregunta 9): ya hay lista escrita para ese caso, en dos tramos: de 12:30 a 14:00, y de 14:30 a 15:30.

## 2. Una regla nueva para todos los destinos

**Una reserva nunca pasa un imprescindible a «de camino» ni a «por fuera» la primera vez**, si el imprescindible es de los que se visitan por dentro: la Basílica, el Foro, el Panteón… Primero se mueve, antes o después de la reserva; luego se acortan otras cosas; y solo al final se quita lo de menos importancia.

- **La prueba:** 0 casos de un imprescindible que, por una reserva, pasa de «por dentro» a «de camino» o «por fuera» la primera vez.
- **En el informe:** cualquier caso que quede, con el día, la hora de la reserva y qué ha pasado.

## 2b. Cerrar Roma: esta es la última tanda de reglas del motor

Después de esta tanda no se añade ninguna regla nueva al motor para Roma. Lo que no esté escrito no se improvisa (regla 17 del documento, para todos los destinos).

1. **Listas escritas por hora de reserva:**
   - Coliseo en el D1: 5 tramos;
   - Coliseo en el D0: 2 tramos;
   - Museos en el D2: media mañana y tarde;
   - **Galería Borghese en el D4: nueva**, a las 9:00, a las 11:00 y a las 15:00 o 17:00.
   - El motor coge la lista del tramo y la pone a su hora. Nada más.
2. **Al meter una reserva** (la hoja de «Añade tu reserva»):
   - enseña **las mejores horas** para ese día, que son las de los tramos con lista escrita: «Para este día, mejor a las 9:00 o a las 16:00»;
   - **si la hora no tiene lista** (la Galería a las 13:00; los Museos antes de las 13:30 con Free Tour de mañana) **o la combinación no cabe** (la excursión y el Coliseo a las 16:00), avisa y propone otra hora u otro día;
   - si el viajero insiste, se aplica la regla 4, y queda apuntado en el registro y en la prueba como «sin lista».
3. **En el informe:** la tabla de todas las reservas posibles (sitio × día × hora) y, para cada una, si sale con lista escrita, con aviso o «sin lista».

## 2c. Un dato nuevo: la Fontana de Trevi cuesta 2 €

**Desde el 2 de febrero de 2026**, entrar a la zona de dentro, junto al agua, cuesta 2 €:
- **horario de pago:** de 9:00 a 22:00 (los viernes, desde las 11:30), con la última entrada a las 21:00;
- **gratis:** fuera de ese horario; también para los menores de 6 años, las personas con discapacidad y su acompañante, y los residentes de Roma;
- **cómo se paga:** online o allí mismo, solo con tarjeta.

Ponlo en `roma.json` y en sus avisos:
- **Trevi «sin gente» a las 7:30:** «Gratis y sin gente: antes de las 9:00 no se paga».
- **Trevi de noche:** si la hora cae antes de las 22:00, «Hasta las 22:00, acercarte a la fuente cuesta 2 € (solo con tarjeta). Desde la plaza se ve gratis».
- **Trevi de día:** el mismo aviso.

## 3. Respuestas a PREGUNTAS_TANDA6D.md

Todo lo que no sale aquí, vale como lo hiciste.

- **1:** vale, con los cortes nuevos: Coliseo hasta las 10:15, el día normal; de 10:16 a 11:15, la lista de 10:30–11:00; de 11:16 a 12:15, la de 11:30–12:00; de 12:16 a 15:15, la de mediodía; desde las 15:16, la de tarde. Museos de 9:45 a 12:00, la de media mañana; desde las 15:00, la de tarde.
- **6:** el miércoles del D2 sin Museos deja 1 h 40 libre antes de las 12:30. Que HOY lo diga con «Tienes … antes de la Plaza de San Pedro», con sugerencias cercanas (Borgo Pio, los Coronari).
- **8:** a la comida en Prati, **Il Sorpasso o Dal Toscano** (ya en el documento). L'Arcangelo y Osteria dell'Angelo, solo a la cena. Vuelve a poner Osteria dell'Angelo como estaba.
- **9:** escrita (punto 1.5).
- **21:** excursión de medio día y el Coliseo a las 16:00. Al meter la reserva, avisa como con el Free Tour y los Museos: «Ese día tienes la excursión por la mañana. ¿Pasamos el Coliseo al día de la Roma antigua?».

## 4. Pruebas

- La prueba entera, con la regla nueva del punto 2.
- Regenera `VIAJES_LISTAS.html`, con los mismos viajes por hora de reserva y, además:
  - el Coliseo a las 10:30;
  - el D0 con el Coliseo a las 13:00 y a las 15:00;
  - los Museos a las 10:00;
  - la Galería a las 9:00 y a las 15:00.
- Reinicia el api-server.
