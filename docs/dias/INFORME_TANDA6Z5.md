# Informe de la Tanda 6z5

## 1. El motor, más simple (reglas 15 y 17)
**La idea.** La hora de una reserva solo decide en qué fila de su tabla cae (el Coliseo, los Museos, la Galería, el Free Tour) y, con ella, qué lista escrita se usa. Ese día sigue la lista tal cual, en su orden. La app ya no calcula al minuto si el viajero llega: no sabe si anda rápido, si se para o si el metro va tarde.

**Lo que he quitado del motor** (`shared/routeEngine/listasTrip.js`, `listasDia.js`, `scripts/destino/listasVariantes.mjs`):
- **Colocar la hora fija** (la función `colocarFija`, unas 330 líneas): ya no se llena la mañana «hasta la reserva», ni se pasa nada detrás de ella para que quepa, ni el día empieza antes o más tarde por una reserva. La hora fija se queda donde la lista la pone.
- **Mover la comida según si da tiempo** (`comidaAntesDeLas15`): la comida va donde dice la lista de esa franja.
- **La cuenta de «1 h 30 hasta la última entrada del Foro»**: la condición `abierto_tras_reserva` ya no existe. Con el Coliseo por la tarde (desde las 15:30) el Foro y el Palatino van **siempre antes** (las dos variantes con «Foro después» y «Foro antes» son ahora una sola, la del Foro antes; también en la versión con Free Tour).
- **Pasar algo a «por fuera» o «de camino» por la hora en un día con reserva**: con una reserva puesta por el viajero ya no se mira la hora de llegada a cada sitio (`resolverHorarios`). Lo que ese día cierra entero (regla 5) sigue resolviéndose al elegir la lista. El turno que la app coge de la Galería sin reserva puesta no cuenta como reserva del viajero, así que ese día se comporta como antes.
- **Esperar a que abra solo si no empeora una reserva**: la espera ya no se compara con la hora de una reserva.
- Con todo esto desaparece también el parche de la 6z4 (el Foro o San Pedro «el primero del día» si iban a llegar cerrados): ya no hace falta, porque nada se empuja detrás de la reserva.

**Lo que se queda:** los días escritos y sus listas por franja, la «Llegada a…» antes de cada reserva como una parada más (30 o 15 min), los cierres por día y por fecha, el aviso «coinciden» (solo si dos reservas se cruzan de verdad), la noche, que no se quita por la hora, y «nada se quita» con una reserva.

**Lo que he quitado de la pantalla:**
- El aviso «vas justo» (en la hoja de abajo, en la campana y en el código): `src/lib/reservationOverlaps.ts` solo devuelve «coinciden»; la campana ya no tiene el título «Vas justo entre dos reservas».
- «Acceso libre» en las tarjetas de DÍAS sin horario (el encargo: «plazas: nada»).
- El «Hoy cierra» que se duplicaba con el nuevo «Cerrado hoy».

**¿Desaparecen los fallos de la 6z4?** Sí. Con 2, 3, 4, 5 y 6 días, el día ya no «empieza tarde» ni el Foro va «por fuera» en el Coliseo a las 16:00 del 26 de marzo de 2027 ni en Nochevieja: ahora el día simplemente sigue su lista. Por eso la regla de la 6z4 que adelantaba lo que iba a llegar cerrado se ha quitado con la función a la que pertenecía.

## 2. El horario y la última entrada a la vista
En la tarjeta de cada parada con horario, en DÍAS y en HOY, en pequeño bajo el nombre: «Abre 9:00 – 19:00 · Última entrada 17:45», con los datos de ese día (temporada y día de la semana, de la auditoría de horarios). Varios tramos: «Abre 8:30 – 9:45, 10:30 – 12:00 y 16:00 – 18:00». Sin última entrada en los datos, solo el horario. Cerrado ese día: «Cerrado hoy». Plazas, fuentes y calles: nada. Un solo módulo (`src/lib/horarioDeParada.ts`) decide; DÍAS y HOY lo usan. El servidor ahora manda también `last_entry_by_day` y `restriccion_dia` (antes no llegaban: faltaban la última entrada del Palazzo Doria Pamphilj por día y el horario de los miércoles de San Pedro y la Cúpula).
Sin fechas, el viaje solo enseña el horario cuando es único: casi todos varían por época o por día, así que se verán pocos.

## 3. «No me da tiempo» en HOY (de pago, durante el viaje)
Tercer botón en la tarjeta oscura de «Siguiente parada», a ancho entero bajo [Cómo llegar] y [✓ Visto]. Al tocarlo: la parada queda «Saltada» (gris y tachada) en la lista del día, se pasa a la siguiente, y sale «Saltada · {parada}» con [Deshacer] y [Pasarla a otro día] (abre la hoja de días, la misma lista que el menú «···» de DÍAS). No sugiere nada ni calcula. En una parada con entrada reservada, antes sale «Tienes la entrada reservada a las 11:00» con [Saltar igual] y [Cancelar] (y en una reservada no se ofrece «Pasarla a otro día»). Se guarda con el viaje (`saltada` en la parada); las saltadas no cuentan en «n de m visto». En la versión gratis no sale el botón.
En la prueba a mano encontré un fallo y lo arreglé: si la reserva no estaba ligada a la parada (el caso de una entrada puesta desde RESERVAS), saltarla no preguntaba; ahora reconoce la entrada de ese día que cubre ese sitio.

## 4. Las preguntas de la 6x
Resueltas con esto: la comida va donde dice la lista de cada franja; lo que llega cerrado, por fuera con su aviso (en los días sin reserva); el Altar, después de comer (como lo escribe la lista).

## 5. Pruebas
- **Prueba de listas con los próximos 12 meses** (del 11-oct-2026 al 10-oct-2027, las 365 fechas): 1 día, 2 días y 3 días: 0 fallos; 4, 5 y 6 días: ver el final.
- Puesta al día con las reglas nuevas (`comprobacionesListas.mjs`): ahora comprueba que cada día con reserva sigue la lista escrita en su orden, que el registro del motor nunca dice «vas justo» ni «llegas tarde», que el Foro nunca lo pasa a «por fuera» o «de camino» el motor, y que no se quita nada con una reserva. Fuera lo que medía minutos: «llega tarde a la reserva», «el día empieza tarde por la reserva», la comida por la hora y «cerrado a la llegada» en los días con reserva.
- Pruebas viejas al día por lo mismo: 6j y 6k (la última entrada y el horario a la hora sugerida ya no se miden el día de una reserva; los cierres de todo el día sí), 6u (fuera «llega tarde por lo nuestro» y la comida rápida) y 6v («vas justo» ahora no sale nunca). Nueva `pruebaTanda6z5.mjs` (109 comprobaciones: horario, última entrada, «Cerrado hoy», plazas, botón, tachado, contador, deshacer, guardado, reservada).
- Las demás (6g, 6h, 6i, 6l, 6o, 6r, 6s, 6t, 6z, 6z2, 6z3, franjas, días por fecha, fotos, salida, sugerencias, varita) y `tsc`: 0 fallos.
- A mano a 375 px (de pago): horario y última entrada en DÍAS y en HOY, [No me da tiempo] con [Deshacer] y con [Pasarla a otro día], y saltar una reservada (aviso con la hora). Capturas en `docs/dias/img/6z5-*.jpg`. Viaje de prueba borrado.
