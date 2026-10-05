# Para Code · Tanda 2 (cerrar los viajes de 1, 1,5, 2 y 2,5 días)

Este fichero ya está en docs\dias\, junto al DIAS_ESCRITOS_ROMA.md nuevo y la simulación VIAJES_2_5_SIMULACION.html. A Code basta con decirle que lo lea y lo haga entero.

```
TANDA 2: CERRAR LOS VIAJES DE 1, 1,5, 2 Y 2,5 DÍAS

Vuelve a leer ENTERO docs/dias/DIAS_ESCRITOS_ROMA.md: hay una versión nueva con muchos cambios. Ese documento manda. Pásalo tal cual a data/dias/roma/ (los días nuevos: D1-corto, D0-medio, DT-medio y DM-medio).

CÓMO TRABAJAR: estoy fuera y no puedo contestarte. Hazlo todo seguido, sin pararte a preguntarme. Si algo no te cuadra o tienes que elegir, toma la opción más prudente (la que no inventa nada y sigue el documento), márcala como provisional y apúntala en docs/dias/PREGUNTAS_TANDA2.md con el porqué; luego sigue. Haz commits locales por partes (uno por bloque), con mensajes claros. No hagas push.

A. CAMBIOS EN LOS DÍAS

1. Viaje de 1,5 días: TODO por fuera, como el de 1 día. Lo que el viajero marque en el pool (o reserve) va por dentro y es la prioridad; lo demás, lo que quepa. Si para meter lo del pool no cabe un imprescindible, se queda fuera: el pool manda. Lo mismo en el viaje de 1 día (cambia lo que te dije antes: ahora el pool SÍ cuenta en 1 y 1,5 días).
   - El día entero es un día nuevo, D1-corto (la Roma antigua, el centro y Trastevere, por fuera), con sus tablas A, B, C y D. Con reserva del Coliseo, su mañana es la del D1 (explicado en el documento).
   - El D0-medio es por fuera (mañana, tarde A y B, tarde C y D). Sus tablas con Museos solo valen con reserva de los Museos.
   - Si Trevi no ha salido de noche en el viaje, la nocturna del medio día de tarde es Trevi en lugar de Piazza Navona.

2. Viaje de 2 días: van todos los imprescindibles. Por dentro: el Coliseo y el Foro, el Panteón y el Altar (D1), y la Basílica y los Museos Vaticanos a las 8:00 (D2), como ya estaba. La versión «Sin Museos» del D2 solo se usa cuando cierran (domingo). El miércoles se resuelve con el cambio de orden de los días (punto 3).

3. Orden de los días (regla general, está en el documento): si un día cae en una fecha que le va mal y se puede cambiar con otro día del viaje, se cambian.
   - Al D2 y al D3 les va mal: el domingo, el Domingo de Pascua y cualquier fecha en que cierren los Museos Vaticanos (usa sus closed_dates y easter+1 de roma.json, no una lista a mano). Al D2, además, el miércoles.
   - Al D1 y al D1-FT les va mal: el 2 de junio (el Coliseo y el Foro abren por la tarde) y el 25 de diciembre.
   - En 2 días se cambian D1 y D2 (con Free Tour de mañana, D3 y D1-FT). Si los dos días caen mal o no se puede, se usan las tablas de esa fecha y la regla de cierres.
   - Los avisos de fechas_especiales ya dicen «Hemos puesto el Vaticano otro día»: comprueba que con este cambio sea verdad, y si en algún viaje no lo es, ponlo en el informe.

4. Pool: ya están escritas las tablas que faltaban:
   - en el D1: Ojo de la Cerradura (con la Boca), San Juan de Letrán y Parque de Villa Borghese (solo tardes C y D; en A y B no entra);
   - en el D1-FT: Ojo de la Cerradura, San Juan de Letrán, Galería Borghese (Trastevere pasa a la noche) y Barrios y Sabores.
   - Galería Borghese en el D1: solo si se marca en el pool; si no, a «No incluido». Tabla en el documento (turno de las 17:00). Si en tu copia no está, ponlo en las preguntas.

4bis. Restaurantes (revisados con sus horarios de roma.json):
   - El D0-medio tenía la comida en Il Gabriello, que solo abre de cena: ahora es Poldo e Gianna Osteria (o Edy).
   - Todas las comidas y cenas llevan ya su alternativa: Il Gabriello (o Poldo e Gianna), Borghiciana (o Dal Toscano; a las 12:00, 12:10 y 15:25, o Pizzarium), Armando al Pantheon (o Supplizio; si cierran los dos, Piccolo Arancio), L'Arcangelo (o Osteria dell'Angelo, por sus vacaciones del 10 al 31 de agosto).
   - Regla general (punto 7 de la regla de arriba): si el primero cierra ese día, la alternativa; si cierran los dos, la tercera; si no hay ninguna abierta a esa hora, otro de la misma zona abierto (de los datos), apuntado en el registro.
   - Comprueba en la prueba que ninguna comida ni cena caiga en un restaurante cerrado ese día o a esa hora, en las 365 fechas, y pon en el informe cuántas salen.

4ter. Viaje de 2,5 días (nuevo, sección «Viaje de 2,5 días» del documento):
   - Los 2 días enteros, como el viaje de 2 días (con su cambio de orden), más un medio día de mañana o de tarde (mediaJornada).
   - Sin Free Tour de mañana: DT-medio (Tridente y Pincio), con sus tablas de mañana y de tarde A de invierno, A, B, C y D.
   - Con Free Tour de mañana: por la mañana, DM-medio (Monti); por la tarde, DT-medio con la Plaza de España de camino (5 min).
   - Pool: Galería Borghese (mañana; tarde A y B; tarde C y D), Parque de Villa Borghese (tarde B) y San Juan de Letrán (DM-medio). Lo demás del pool, en los días enteros.
   - La Plaza del Quirinal no está en roma.json: añádela (nivel 3, por fuera, 15 min, entre Trevi y Monti).
   - El Free Tour sí se ofrece en 2,5 días (es más de 1,5).

4quater. Colchones: cada colchón lleva en su texto lo que hay que ver o hacer dentro (tabla «Qué hay en cada colchón» del documento), dure lo que dure. Ponlo en el texto de la parada. Si un colchón pasaría de 2 horas, apúntalo en el registro y ponlo en el informe.

4quinquies. Hora límite de la noche (nuevo, sección «Márgenes»): las 23:00, salvo de mayo a septiembre y cuando el sol se pone después de las 19:45 (versión D): entonces la nocturna entra si empieza como tarde a las 23:45. Sustituye a «23:30 en julio y agosto». Quita de las tablas las notas «(en julio y agosto)».

4sexies. Nocturna en Trastevere (nuevo, sección «Nocturna cuando se cena en Trastevere»): si se cena en Trastevere y esa tarde no se ha paseado Trastevere de noche, la nocturna es «Trastevere de noche» (30 min, sin taxi), salvo que falte un imprescindible (Trevi, Plaza de España). Aplícalo también a las variantes del D2 que cenan en Trastevere; en las tardes A se queda Navona.

4septies. Cambios de hoy en los días (todos están en el documento; revísalos uno a uno):
   - D1 (Roma antigua), tardes A y B: Largo di Torre Argentina pasa a parada de 15 min; San Luigi dei Francesi va ANTES que el Panteón (cierra a las 18:15); Panteón 40 min; Piazza Navona 45; Campo de' Fiori sale de esta tarde. La tarde C es igual que la A y la B. La tarde D es nueva: Navona, Campo de' Fiori, Ponte Sisto al atardecer y cena en Trastevere al cruzar el puente; nocturna en taxi: Trevi si no ha salido, si no el Coliseo iluminado, si no Trastevere de noche.
   - D2 (Vaticano), tarde A: el bus 23 deja junto a la Isla Tiberina (parada Lungotevere dei Cenci), se cruza a Trastevere por el Ponte Cestio y se cena allí (antes se iba a Trastevere, se bajaba a la Isla y se volvía). Igual en el «Miércoles sin Museos». Tardes B, C y D: nocturna Trastevere de noche.
   - DT-medio: nueva «tarde A de invierno» (puesta de sol antes de las 17:15): Plaza de España, Trinità, Pincio al atardecer, Santa Maria del Popolo y la Piazza del Popolo (20 min). Trinità dei Monti es siempre parada («Trinità dei Monti y su mirador sobre la Plaza de España»), nunca de camino; en C y D, por fuera. Villa Borghese se llama «Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines» y su texto cuenta lo que hay. En la tarde D, nocturna Coliseo iluminado a las 23:20.
   - Restaurantes: todas las comidas y cenas con alternativa (ver 4bis).

5. Fechas especiales (nueva sección al final del documento):
   - 24 de diciembre: solo Trevi de noche.
   - 25 de diciembre y 1 de enero: si toca el D1, se usa el D1-corto (todo por fuera); si toca el D2, la tabla de fiesta (la bendición del Papa a las 12:00).
   - 31 de diciembre: cena con reserva.
   - Restaurantes cerrados esos días → su alternativa; si no hay dato, el aviso «En Navidad, reserva con antelación» (es un aviso del día, no un motivo de «No incluido»).

6bis. Regla general de qué sale (sección nueva al principio del documento; vale para TODOS los viajes y manda sobre lo anterior):
   - 1 y 1,5 días: todo por fuera. Lo del pool (o reservado) va por dentro y es la prioridad; lo demás, lo que quepa; si no cabe un imprescindible, se queda fuera: el pool manda.
   - 2 días: todos los imprescindibles (por dentro Coliseo y Foro, Panteón, Altar, Basílica y Museos; el Castillo, por fuera). Lo del pool tiene prioridad siempre y va en el mejor día para ese sitio.
   - 3 días o más: todos los imprescindibles, por dentro.
   - Lo que solo se ve por dentro (museos, galerías, palacios) y no va por dentro no sale.
   - Mientras se respeten los márgenes, entran nivel 1, luego nivel 2, luego nivel 3; si algo no cabe, se quita al revés (3, luego 2, luego 1).
   - Free Tour: si el viaje dura 1,5 días o menos (duración <= 1,5), el Free Tour NO aparece en experiencias. Quítalo de la lista del formulario en esos viajes, y que el motor no lo ponga aunque llegue marcado. Desde 2 días, sí.
   - «No incluido»: el motivo solo se pone si es por un cierre o un festivo («Cerrado el lunes», «Cerrado el 25 de diciembre»). Quita los demás («Solo por dentro con reserva», «No cabía en este viaje», «Márcalo en el pool»…).
   - Pon en el informe qué lista usas para «imprescindible» y si alguno no sale en ningún viaje de 1, 1,5 o 2 días.

B. RESPUESTAS A TU INFORME ANTERIOR

6. Domingo del D2: Dal Toscano (abre de martes a domingo, de 12:30 a 15:00).

7. Plaza de España (imprescindible):
   - En el D1, la tarde C ahora es igual que la A y la B (con Trevi y la Plaza de España de noche).
   - Regla general para el D2: si la Plaza de España todavía no ha salido en el viaje (de día o de noche), la nocturna del D2 es «Plaza de España de noche», con su taxi desde la cena, en lugar de Piazza Navona (Navona ya sale de día en el D1). Si ya salió, se queda Navona.
   - Si aun así no sale en algún caso, ponlo en el informe con la fecha.

8. Cena después de un Free Tour tardío: puede retrasarse hasta las 22:00. Si pasaría de las 22:00, ponlo en el informe.

9. Panteón (y cualquier joya) que cierra antes, por misa o festivo: mejor por dentro aunque sea corto (mínimo 20 min) que por fuera. Para una joya se permite adelantarla aunque haga andar hasta 15 min de más. Solo va por fuera si ni así llega con 20 min antes del cierre. Para lo que no es joya, se queda tu regla de 6 y 12 min.

10. Etiquetas de causa: valen así, porque son internas. Si alguna sale al viajero, apúntalo y la escribimos con palabras suyas.

11. El formulario: conecta la franja del Free Tour (de mañana, de tarde o de noche) y el medio día del viaje de 1,5 días a freeTourDespues y mediaJornada. Prueba /api/rebuild-day en el navegador y pon en el informe si va.

12. La prueba antigua de 365 fechas: deja los fallos de los viajes de 3 días o más como están; los arreglaremos al escribir esos días.

C. REVISIÓN

13. Regenera docs/dias/REVISION_TANDA1.md con los mismos 10 viajes y añade estos:
   11) 2 días: sábado 29 y domingo 30-05-2027, sin Free Tour ni pool (Panteón del sábado, Plaza de España y cambio de orden por el domingo).
   12) 2 días: martes 16 y miércoles 17-03-2027, sin pool (cambio de orden por el miércoles: el Vaticano, con Museos, pasa al martes).
   13) 1,5 días: día entero el martes 12-10-2027 y medio día de tarde el miércoles 13-10, sin reservas.
   14) 2 días: martes 24 y miércoles 25-12-2027, sin pool (Nochebuena y Navidad).
   15) 2 días: martes 12 y miércoles 13-10-2027, con la Galería Borghese en el pool (con el cambio de orden, el D1 cae en miércoles y la Galería abre).
   16) 2 días con Free Tour de mañana: martes 12 y miércoles 13-10-2027, con el Ojo de la Cerradura en el pool.

   17) 2,5 días: llegada el viernes 14-05-2027 por la tarde y días enteros sábado 15 y domingo 16, sin pool (DT-medio de tarde y cambio de orden por el domingo).
   18) 2,5 días con Free Tour de mañana: martes 12 y miércoles 13-10-2027 enteros y medio día de mañana el jueves 14, con San Juan de Letrán en el pool (DM-medio con Letrán).

   19) a 23) Los 5 viajes de 2,5 días de la simulación que te paso (docs/dias/VIAJES_2_5_SIMULACION.html): invierno 15-17 ene 2027, primavera 13-15 abr 2027 con Free Tour de mañana, verano 15-17 jul 2027, otoño 12-14 oct 2027 (medio día de mañana) y Navidad 17-19 dic 2027 con Mercadillos. Compara parada a parada lo que saca el motor con la simulación y apunta cada diferencia. Además, genera con lo que saca el MOTOR una página igual que la simulación (mismo formato: barra horaria, paradas, porqué y en amarillo lo que el motor ha cambiado respecto a la tabla escrita), en docs/dias/VIAJES_2_5_MOTOR.html, y déjame un script para volver a generarla con otras fechas. Es la que voy a revisar yo.

14. Al acabar, deja en docs/dias/INFORME_TANDA2.md, en palabras sencillas: qué has hecho, el resultado de la prueba contra el documento (cuántas diferencias y cuáles), las diferencias con la simulación de los viajes 19 a 23, y lo provisional que has decidido tú (con el enlace a PREGUNTAS_TANDA2.md). No hagas push.
```
