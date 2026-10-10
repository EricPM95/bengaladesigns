Tanda 6z5: sin cuentas al minuto con las reservas, el horario y la última entrada a la vista, y «No me da tiempo» en HOY. Va todo en este mensaje. Empieza cuando esté subida la 6z4. Después van la 6z6 y la 6y (la ruta a mano).

Antes de empezar: he copiado en docs\dias un DIAS_ROMA_PARADAS.md nuevo, GUIA_NUEVOS_DESTINOS.md, PENDIENTES_6K.md, este prompt (PROMPT_TANDA6Z5_PARA_PEGAR.md) y los de las dos tandas siguientes (PROMPT_TANDA6Z6_PARA_PEGAR.md y PROMPT_TANDA6Y_PARA_PEGAR.md, que todavía NO se hacen). Pasa el documento por el convertidor y no lo toques; mete los otros en un commit tal cual.

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
  - si una reserva cae en otro día, ese día pasa entero con su grupo (el Coliseo con su Roma antigua, los Museos con su Vaticano), todo o nada, como siempre; los días cambiados a mano no se tocan;
  - cada reserva, a la hora que puso el viajero, aunque con otra no le dé tiempo: lo decide él con lo que ya tiene (eliminar, cambiar la hora, arrastrar, [No me da tiempo]);
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
Quedan resueltas con esto: la comida va donde dice la lista de cada franja; lo que cierra pronto ese día, con su horario en la tarjeta (punto 2), sin moverlo; el Altar, después de comer.

4b. LAS RESPUESTAS A TUS PREGUNTAS DE LA 6Z4, Y EL TIEMPO
- Pregunta 1 (una reserva a una hora en que el sitio está cerrado ese día, como el Viernes Santo o Nochevieja): eso es un dato real, no una cuenta, así que sí. En la hoja de la hora, la rueda solo ofrece las horas en que ese sitio está abierto ese día (con la auditoría de horarios y los cierres especiales). Si el viajero ya tenía guardada una hora que ese día está cerrada, el aviso «Ese día el Coliseo cierra a las 14:00. Revisa tu reserva.» [Ver mi reserva], en la hoja de abajo y en la campana, como «coinciden».
- Lo de la 6z4 de poner lo que «a su hora ya habría cerrado» lo primero del día: con la 6z5 no se calcula a qué hora se llega a cada sitio, así que tampoco se mueve nada por eso. Lo que cierra pronto ese día (el Coliseo a las 14:00 el Viernes Santo) sale con su horario en la tarjeta («Hoy cierra a las 14:00», punto 2) y decide el viajero. Lo que está cerrado todo el día sigue la regla 5, como siempre. Si el arreglo de la 6z4 queda sin uso, quítalo y dímelo.
- Pregunta 2 (furgoneta y parque): de momento, como están. Los pediremos a diseño junto con la autocaravana.
- Pregunta 3 (el emoji de cada excursión en los datos): sí, quítalo de los datos.
- El tiempo: sigue pidiéndose desde el móvil (`src/lib/rainForecast.ts`). Pásalo a nuestro servidor: lo pide una vez cada pocas horas por destino y lo guarda para todos; la app lo pide a nuestro servidor. La previsión sigue saliendo desde 5 días antes. Dime en el informe cada cuánto lo pide.

5. PRUEBAS
- Las de siempre a 0 fallos (con la 6z, 6z2, 6z3 y 6z4).
- La prueba de listas, al día con las reglas nuevas: que cada día con reserva siga la lista escrita de su fila, en su orden; que no salga nunca «vas justo»; que el Foro nunca vaya por fuera ni de camino; que no se quite nada con una reserva. Fuera de la prueba lo que medía minutos («llega tarde», «el día empieza tarde por la reserva», la comida por la hora). Con las fechas de los próximos 12 meses (o una de cada 2, como en la 6z4).
- Con las fechas especiales de la 6z4 (Viernes Santo, Nochevieja): que el día siga su lista, que la tarjeta enseñe el horario de ese día y que la rueda de la hora no ofrezca horas en que está cerrado.
- A mano, a 375 px, de pago:
  - una parada con su horario y su última entrada en DÍAS y en HOY;
  - [No me da tiempo] con [Deshacer] y con [Pasarla a otro día];
  - saltar una parada reservada.
- Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z5 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
