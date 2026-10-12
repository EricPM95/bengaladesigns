Tanda 6y9 (después de la 6y8). Los horarios reales por fechas, las horas de reserva, el Free Tour, los audios preparados y las respuestas a la 6y8. Va todo en este archivo.

Antes de nada: Claude ha copiado en docs\dias PENDIENTES_6K.md, PENDIENTES_ESCUCHAR.md, PENDIENTES_RECOMPENSAS.md y este prompt. Súbelos en el primer commit, sin tocarlos.

REGLA DE LAS PREGUNTAS (como en la 6y8): lo pequeño lo decides tú, siguiendo el documento y las reglas de siempre, y lo apuntas en el INFORME en «Decidido por Code». En PREGUNTAS, como mucho 5, solo lo que cambie de verdad lo que ve el viajero o choque con una regla de Eric.

0. RESPUESTAS A PREGUNTAS_TANDA6Y8.md
- P1, P2, P3, P4 y P6: bien como lo hiciste.
- P5: sí, el turno real de la Galería entra siempre en la regla de la comida, tenga o no otra reserva ese día.

1. LO PRIMERO: LOS HORARIOS REALES POR FECHAS (Eric: «error gravísimo»)
- En data/pipeline_v2/roma.json el Coliseo tiene 4 estaciones (invierno, primavera, verano, otoño), y en «otoño» pone cierre a las 16:30 y última entrada a las 15:30. Lo oficial (web del Parque del Coliseo, captura de Eric): del 1 al 24 de octubre de 2026, de 8:30 a 18:30, última entrada a las 17:30. El Coliseo abre a las 8:30; el Foro y el Palatino y la Domus Aurea, a las 9:00. Por eso la rueda de la hora solo deja hasta las 15:30, y el motor cree que el Foro cierra a las 16:30 en octubre.
- Cambia las 4 estaciones por tramos de fechas, tal como los da cada web oficial (por ejemplo, en el Coliseo: del último domingo de marzo al 31 de agosto; septiembre; del 1 de octubre al último sábado de octubre; del último domingo de octubre en adelante…). Que sirva para cualquier año: «el último domingo de marzo», no una fecha fija.
- Comprueba en la web oficial de cada sitio los tramos del Coliseo, el Foro y Palatino, los Museos Vaticanos, la Galería Borghese, el Panteón y TODOS los demás sitios que usan «by_season». Apunta en los datos la fuente y la fecha de la comprobación. Ojo: una web no oficial da para octubre «el Coliseo hasta las 17:30, última entrada a las 16:30, el Parque hasta las 18:30», distinto de la captura de Eric. Manda la web oficial; si no está claro, pon la hora más prudente y dilo en el informe.
- El motor y la rueda de la hora usan el tramo de las fechas del viaje. Sin fechas, el del mes que eligió el viajero.

2. LA RUEDA DE LA HORA, HASTA LA ÚLTIMA ENTRADA
- En «¿Ya la tienes? Añádela» (y en «Cambiar»), la rueda va de la apertura hasta la última entrada oficial de ese día, en el tramo de su fecha. Ojo (Eric): lo que vendemos del Coliseo son visitas guiadas, que acaban antes (no ha visto ninguna después de las 15:30), pero quien compró la entrada oficial sin guía puede entrar hasta la última entrada oficial (17:30 en octubre). La rueda es para eso.
- Las entradas más comunes de cada destino (en Roma: el Coliseo, los Museos Vaticanos, la Galería Borghese, el Panteón y el Free Tour) llevan siempre sus horas reales de reserva: los turnos que existen de verdad. Comprueba los turnos reales del Panteón y de la Galería en su web oficial. Debajo, siempre: «Recuerda revisar la disponibilidad antes de añadirlo a tu ruta».

3. EL FREE TOUR
- Las horas: 10:00, 12:00, 15:00, 17:00, 19:00 (nueva) y 21:00. Las de las 15:00 y las 17:00 ya no se llaman igual: «Después de comer» la de las 15:00 y «Por la tarde» la de las 17:00.
- El texto de arriba de la hoja, en lugar de «Tu ruta se rehace con el Free Tour: el día que lo lleva cambia a su versión…»: «Lo ponemos al principio de tu viaje: es cuando más vale la pena, porque te ayuda a situarte. Recuerda revisar la disponibilidad antes de añadirlo a tu ruta.»
- Abajo del todo, debajo de las horas, un botón de los nuestros, [Ver disponibilidad], que abre la página del Free Tour en la tienda con nuestro enlace de afiliado y el aviso «Abriendo…», sin el nombre de la tienda.
- El Free Tour de las 19:00, en el documento y en el motor: igual que el de las 21:00 (los días de «Sin Free Tour», y el tour en la noche del D1, en lugar de Trevi y la Plaza de España, porque el tour pasa por allí), pero con la cena DESPUÉS del tour, cerca de Navona, donde acaba (sale hacia las 21:30). Escríbelo así en DIAS_ROMA_PARADAS.md, junto al de las 21:00.
- La regla de la cena de la 6y8 cambia (Claude, corrigiendo su propuesta): la cena va antes solo si al salir de la reserva ya son más de las 22:00; si sale a las 22:00 o antes, va después. En Roma se cena bien hasta tarde, y con el corte en las 21:00 el Free Tour de las 19:00 obligaría a cenar a las 18:00. La de las 21:00 sigue con la cena antes. Cámbialo en el motor, en la regla 4 del documento y en la guía.

4. LA REGLA DE LOS DÍAS ENTEROS, PARA TODOS LOS DESTINOS
- Comprueba que GUIA_NUEVOS_DESTINOS.md lo dice así, y si no, añádelo: cada destino marca en sus datos sus «sitios grandes» (en Roma: el Coliseo, los Museos Vaticanos y la Galería Borghese). Una reserva de un sitio grande en otro día mueve el día entero (se cambian los dos días). Un cierre cambia el día con otro. Una reserva de un sitio pequeño solo mueve esa parada al día de su fecha, más o menos a su hora, y del día al que llega no se quita nada. Los días cambiados a mano no se tocan.
- Añade también a la guía: las entradas más comunes de cada destino llevan sus turnos reales y «Recuerda revisar la disponibilidad» (punto 2), y los horarios van por tramos de fechas de la web oficial, con su fuente (punto 1).

5. LOS AUDIOS DE LAS HISTORIAS, PREPARADOS (sin crear ninguno todavía)
- La voz está elegida (PENDIENTES_ESCUCHAR.md): «Javier Rojas - Calm & Friendly», Voice ID RxPoOxDaJiOdJGnMMaql, modelo Eleven v4, estabilidad 0,75, similitud 0,75.
- La barra «Escuchar historia» reproduce el audio guardado de esa historia si existe; si no existe, la voz del móvil, como ahora. Sin el nombre de la empresa de voz en ningún texto de la app.
- Deja listo un programa (un script) que, con la clave ELEVENLABS_API_KEY del archivo .env.local, cree el audio de cada una de las 31 historias con esa voz y esos ajustes, lo guarde donde se guardan las fotos (o donde mejor encaje) y no vuelva a crear los que ya existen: solo los de las historias cuyo texto haya cambiado. La clave nunca va en el código, ni en los commits, ni en el informe.
- NO lo lances: Eric todavía no tiene la clave. Se lanzará justo antes de abrir la app. Explica en el informe, en palabras sencillas, cómo se lanza (una sola orden).

PRUEBAS (regla de Eric)
- Esta tanda toca el motor (puntos 1 y 3): durante la tanda, la batería rápida y la muestra de unas 60 fechas, en paralelo. Con eso a 0 fallos, haz el push. Después del push, las 365 fechas completas, con el resultado al final del INFORME en un commit aparte; si sale algún fallo, no arregles nada: apúntalo arriba de PREGUNTAS.
- Nuevas: para cada sitio con horario por tramos, en cada tramo, la última hora de la rueda es su última entrada oficial; el Foro en octubre no sale «por fuera» por la tarde mientras está abierto; el Free Tour de las 19:00 lleva la cena después y el de las 21:00, antes; la barra de la historia usa el audio si existe y la voz del móvil si no.
- A mano, a 375 px: la rueda del Coliseo en un viaje de octubre llega a las 17:30; la hoja del Free Tour con las 6 horas, el texto nuevo y [Ver disponibilidad]; «Escuchar historia» sin audio (voz del móvil).
- Capturas en docs/dias/img/6y9-*.jpg.

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y9 en docs/dias, en palabras sencillas, y commits locales. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
