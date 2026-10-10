Tanda 6z5: sin cuentas al minuto con las reservas, el horario y la última entrada a la vista, y «No me da tiempo» en HOY. Va todo en este mensaje. Empieza cuando esté subida la 6z4. La 6y (la ruta a mano) va después de esta.

Antes de empezar: he copiado en docs\dias un DIAS_ROMA_PARADAS.md nuevo, GUIA_NUEVOS_DESTINOS.md, PENDIENTES_6K.md y este prompt (PROMPT_TANDA6Z5_PARA_PEGAR.md). Pasa el documento por el convertidor y no lo toques; mete los otros en un commit tal cual.

LA IDEA (decidido por Eric el 10-oct-2026, a INVARIANTES, todos los destinos)
Nos hemos ido al milímetro con las reservas. La app no enseña horas calculadas, así que tampoco tiene sentido calcular al minuto si el viajero llega o no: no sabemos si anda rápido, si se para o si el metro va tarde. Nosotros proponemos una ruta bonita y con sentido; el viajero la ajusta a su gusto (arrastrando, quitando, saltando).

1. EL MOTOR, MÁS SIMPLE (reglas 15 y 17 nuevas del documento)
- La hora de la reserva solo decide en qué fila de su tabla cae (el Coliseo, los Museos, la Galería, el Free Tour) y qué lista escrita se usa. Ese día sigue la lista tal cual, en su orden.
- Fuera del motor:
  - el aviso «vas justo» (en la hoja de abajo, en la campana y donde salga);
  - «lo nuestro nunca te hace llegar tarde»: no se pasa nada detrás de la reserva para que quepa;
  - la cuenta de «1 h 30 hasta la última entrada del Foro»: el Foro y el Palatino van donde dice la tabla del Coliseo (con el Coliseo por la tarde, desde las 15:30, el Foro va antes);
  - mover la comida según si da tiempo: la comida va donde dice la lista de esa franja;
  - pasar algo a «por fuera» porque no dé tiempo.
- Se quedan:
  - los días escritos y sus listas por franjas de la reserva;
  - «Llegada a…» antes de la reserva, como una parada más de la lista (con su texto de 30 o 15 min antes);
  - los cierres por día y por fecha (regla 5: lo que cierra ese día), que son datos reales;
  - el aviso «coinciden», solo cuando dos reservas se pisan de verdad (las horas se cruzan);
  - la noche, que no se quita por la hora;
  - «nada se quita» con una reserva.
- Por dentro, el motor puede seguir usando los minutos de las paradas para lo que ya hacía sin reservas (las franjas de los días escritos). Lo que no hace es mover, quitar o avisar por la hora de una reserva.
- Dime en el informe todo lo que has quitado del motor y de la pantalla, en palabras sencillas.

2. EL HORARIO Y LA ÚLTIMA ENTRADA, A LA VISTA
- En la tarjeta de cada parada con horario (en DÍAS y en HOY), en pequeño, debajo del nombre: «Abre 9:00 – 19:15 · Última entrada 18:15», con los datos de ese día (temporada y día de la semana, de la auditoría de horarios). Sin última entrada en los datos, solo el horario.
- Si ese día está cerrado: «Cerrado hoy» (como ahora).
- Plazas, fuentes y calles (sin horario): nada.
- Son datos reales, no horas calculadas: así decide el viajero.

3. «NO ME DA TIEMPO» EN HOY (de pago, durante el viaje)
- En la tarjeta oscura de «Siguiente parada», junto a [Cómo llegar] y [✓ Visto], un tercer botón: [No me da tiempo].
- Al tocarlo:
  - esa parada queda como «Saltada», en gris y tachada, en la lista del día;
  - se pasa a la siguiente;
  - el aviso corto «Saltada» con [Deshacer] y [Pasarla a otro día] (abre la hoja de los días).
- No sugiere otra parada ni calcula nada: decide el viajero.
- Una parada reservada (con entrada) también se puede saltar, pero el aviso dice «Tienes la entrada reservada a las {hora}» antes de saltarla, con [Saltar igual] y [Cancelar].
- Se guarda con el viaje. Las paradas saltadas no cuentan en «2 de 5 visto».

4. LAS PREGUNTAS DE LA 6X
Quedan resueltas con esto: la comida va donde dice la lista de cada franja; lo que llega cerrado, por fuera con su aviso (como ya hace); el Altar, después de comer.

5. PRUEBAS
- Las de siempre a 0 fallos (con la 6z, 6z2, 6z3 y 6z4).
- La prueba de listas, al día con las reglas nuevas: que cada día con reserva siga la lista escrita de su fila, en su orden; que no salga nunca «vas justo»; que el Foro nunca vaya por fuera ni de camino; que no se quite nada con una reserva. Fuera de la prueba lo que medía minutos («llega tarde», «el día empieza tarde por la reserva», la comida por la hora). Con las fechas de los próximos 12 meses (o una de cada 2, como en la 6z4).
- Los fallos de la 6z4 (el día empieza tarde y el Foro por fuera en 2 y 3 días con el Coliseo a las 16:00): dime si desaparecen con esto.
- A mano, a 375 px, de pago:
  - una parada con su horario y su última entrada en DÍAS y en HOY;
  - [No me da tiempo] con [Deshacer] y con [Pasarla a otro día];
  - saltar una parada reservada.
- Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z5 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
