Tanda 7 (después de la 6y10). Las llegadas y las vueltas: el día de llegada y el día de vuelta según la hora del vuelo, el tren, el autobús o el barco. Es la parte de pago y tiene que quedar perfecta. Va todo en este archivo.

Antes de nada: Claude ha copiado en docs\dias PENDIENTES_LLEGADAS.md, PENDIENTES_6K.md y este archivo. Súbelos en el primer commit, sin tocarlos. Este archivo sustituye a PARA_CODE_TANDA7.md y a PROMPT_TANDA7_PARA_PEGAR.md (del 8-oct): no los sigas. Pon arriba de cada uno una sola línea: «Sustituido por PARA_CODE_TANDA7_v2.md (12-oct-2026).»

REGLA DE LAS PREGUNTAS (como en la 6y9): lo pequeño lo decides tú, siguiendo el documento y las reglas de siempre, y lo apuntas en el INFORME en «Decidido por Code». En PREGUNTAS, como mucho 5, solo lo que cambie de verdad lo que ve el viajero o choque con una regla de Eric.

LAS REGLAS DE ERIC QUE MANDAN EN TODA LA TANDA (si algo de abajo choca con una, manda la regla y lo apuntas):
- La app avisa y nunca prohíbe.
- Nada se quita sin que lo decida el viajero: lo que no cabe va a «Si te sobra tiempo».
- Ninguna hora calculada a la vista. Solo se enseñan las horas que pone el viajero (su vuelo, sus reservas) y las de los datos (un horario, el último tren). La hora a la que está libre o a la que tiene que salir se usa por dentro y nunca se enseña.
- Sin cuentas al minuto: la hora de llegada y la de salida, como la de una reserva, solo eligen la fila de una tabla. Lo que lleva cada fila es una lista escrita. El motor no quita ni mueve nada por minutos.
- Sin nombres de empresas en los textos.
- La llegada y la vuelta con horas son de pago. En la gratis, días enteros, como ahora.
- Reserva grande (en Roma: Coliseo, Museos Vaticanos, Galería Borghese) mueve el día entero; reserva pequeña, solo su parada, y del día al que llega no se quita nada. Los días cambiados a mano no se tocan.
- Horarios reales por tramos de fechas (`horarioDeLaFecha`); sin fechas, el día 15 del mes.
- Comida antes de una visita si al salir de ella son más de las 14:30; cena antes si son más de las 22:00 (regla 4, la de la 6y8 y la 6y9).
- El Free Tour, al principio del viaje.
- Los días por su fecha («el mar 10»), sin «Día 1» (sin fechas, «el día 1»): siempre con la función única `src/lib/nombreDeDia.ts`.
- Los títulos de los días, por grupos (`src/lib/tituloDelDia.ts`).
- Nada de varios destinos: una llegada y una vuelta por viaje.
- Cada tramo de cada tabla empieza en su hora: libre a las 13:00 en punto ya es la fila de las 13:00. La única excepción escrita es la del Coliseo («hasta las 13:00 incluida»). La hora no se redondea para elegir la fila.

Lo que lleva [DUDA n] es la propuesta de Claude a una pregunta abierta a Eric. Hazlo así salvo que Claude te diga otra cosa antes de empezar.

0. MIRA ANTES LO QUE YA EXISTE Y ÚSALO (no lo hagas de nuevo)
- En RESERVAS, «Llegada y vuelta» (`LlegadaYVuelta.tsx`, `ReservasPanel.tsx`): la hora de llegada y la de salida, el punto (Fiumicino, Ciampino, Termini, Tiburtina, Civitavecchia), el medio de cada mitad (`tripModes`), el precio, la referencia, la compañía y el código (6y4, 6y5, 6y6). «x de 3 listo» de pago y «x de 2» gratis (6z6b).
- La zona del alojamiento: «¿En qué zona te alojas?» con su rueda, de pago (`AlojamientoReservas.tsx`, `route.accommodationZone`, las 7 zonas en `destination_config.zonas_alojamiento` de `data/pipeline_v2/roma.json`). Esta tanda solo la usa.
- Las horas de cada punto: `data/dias/roma/_llegada.json` y `shared/arrival/arrivalRules.js` (`centerMinutesOf`, `leaveMinutesOf`). Son la única fuente: no escribas los márgenes en ningún otro sitio.
- La barra de llegada y de vuelta del diseño 1b (`barTextOf`, 6t y 6y4): ya no enseña horas calculadas. No la cambies.
- La ventana de llegada y de vuelta (`ArrivalReturnSheet.tsx`: Resumen · Traslados · Tips). De pago y con punto, solo ese punto (6s).
- La hoja de abajo de toda la app (`HojaAbajo`) y la campana (`useAppNotices`, `NoticesSheet`).
- El rehacer en segundo plano con «Actualizando tu ruta…» y «gana el último» (6y7, 6y9 P7). [Deshacer] al quitar un vuelo (`quitarConDeshacer`, 6y4).
- La hoja del Free Tour de la 6y9 (`FreeTourSheet.tsx`) y la lista única de sus horas (`shared/routeEngine/freeTourHoras.js`): las 6 horas, su texto y [Ver disponibilidad]. Se queda. Y los días sin tour y los de horas especiales de `default_free_tour.disponibilidad` en `roma.json`.
- El aviso de una reserva en un día en que el sitio cierra (6y5). Se queda.
- El interruptor del pago (`pagoActivo()` en `src/lib/pago.ts`, `?version=gratis`).

1. LOS DÍAS: CÓMO SE CUENTAN (léelo antes que nada; el documento del 8-oct no lo cuenta igual que la app)
- La app cuenta los días de ruta por noches. El último día del viaje, el de la fecha de vuelta, es el día de vuelta que crea la app (`appendReturnLegDay`; invariante 21 de `docs/INVARIANTES_MOTOR.md`: `contentDays = días − 1`). Hoy no lleva ruta, solo su barra.
- Las tablas del documento («1 día», «2 días», «4 días»…) son días de ruta: lo mismo que ya usa el motor para el interruptor (`contentDays`). En esta tanda, «días de ruta» = esos.
- Sin horas (y siempre en la gratis): como ahora. Los días de ruta, enteros, y el día de vuelta sin ruta.
- Con horas (de pago):
  - el día 1 (el de llegada) se monta con la tabla de la llegada (punto 5);
  - los demás días de ruta son enteros y no se mueven por la hora;
  - el día de vuelta gana lo que diga la tabla de la vuelta (punto 5): la última mañana, una mañana y una tarde libre, un día más, o solo el traslado.
- Con una sola fecha (llegar e irse el mismo día) no hay día de vuelta aparte: el D0 de siempre, con las dos barras. Las horas no lo recortan; solo salen los avisos del punto 13.
- Con esto, la excursión del día 4 nunca cae en el día de vuelta. Fuera del documento y de la tanda los casos «el día 4 pasa a ser el de vuelta».
- Si al mirarlo ves que no es así (por ejemplo, que un viaje de Roma ya lleva ruta en la fecha de vuelta), para y pregúntalo antes de seguir.

2. EL DOCUMENTO (hazlo justo después del punto 1; luego pásalo por `listasConvertir.mjs` con 0 dudas)
En `docs\dias\DIAS_ROMA_PARADAS.md`, para que quede una sola versión y diga lo de esta tanda:
- Arriba, sustituye «Qué días lleva cada viaje», «El día de excursión» y «El orden de los días» por «El orden nuevo de los días», que ahora está dentro de «Llegadas y vueltas». En «Llegadas y vueltas» deja una línea que remita a él. Con estos cambios:
  - una línea al principio: «Los días de estas tablas son días de ruta (las noches). El día de la fecha de vuelta va aparte (ver «Llegadas y vueltas»).»;
  - fuera la fila de «1,5 días» y la frase «Los medios días… nunca son el D1 ni el D2»;
  - el interruptor ya no se bloquea: en lugar de «Con una reserva en un día que se movería, el interruptor no deja pasar a Roma… no puedes mover este día», pon: «Con una reserva del viajero en un día que se movería, el interruptor funciona igual: el día con la reserva se queda en su fecha y los demás se colocan en su orden alrededor.»
- En el D1-corto y en los medios días «de tarde» (D0-medio, DT-medio y DA-medio de tarde), una línea: «Ya no se usa (Tanda 7). Se queda en los datos.»
- Fuera, al principio de «Llegadas y vueltas», «Toda esta sección es de la Tanda 7. Hasta entonces…».
- «Lo que pone el viajero»: la zona es la que ya existe, de pago, con su rueda.
- «Las horas: libre y salir»: la palabra «centro», con la regla de la guía: «Centro» solo cuando es un dato real (la distancia, el traslado, el nombre de una zona: «32 km al centro», «De Fiumicino al centro»); en nuestras frases, no. Y las tablas del punto 5 de esta tanda.
- «Lo que se ve en el día»: la barra que ya existe (diseño 1b), sin «SAL A LAS» ni ninguna hora calculada.
- «Los días reales» y «La «Llegada a Roma»»: con los días contados como en el punto 1 y lo de los puntos 5 a 10 de esta tanda. Fuera la hoja «Ese día sales hacia el aeropuerto a las 12:00…». Fuera «El día se llama «Llegada a Roma»»: el título sale de los grupos, como todos.
- En la ruta del centro, los minutos de cada parada (no los lleva): Piazza Navona ~45, Panteón por fuera ~30, Fontana de Trevi ~45, Via Condotti ~15, Plaza de España ~45, Escalinata y Trinità dei Monti ~20, Terraza del Pincio ~20, Piazza del Popolo ~20. Y la línea de los mercadillos, como en el D0 y el D1: del 8 de diciembre al 6 de enero, «Piazza Navona y su mercadillo navideño».
- «Ya lo visitaste el día 1» → «Ya lo visitaste el {día}».
- «El Free Tour y otras reservas el día de llegada», «La excursión y los vuelos», «Las reservas y los vuelos» y «Cómo salen los avisos»: con los textos del punto 13 de esta tanda (sin horas calculadas, con el día por su fecha).
- «Lo que no entra todavía»: fuera «Lo que sea gratis o de pago: se decide al final»; añade la parte «Gratis y de pago» del punto 3.
- Añade dos líneas: la ruta a mano (punto 16) y HOY (punto 14).
- `_llegada.json`: en `ultima_tarde`, fuera «sal a la hora que te marcamos»: «Aprovecha la mañana sin prisas: deja la maleta en la consigna o en tu alojamiento y sal con margen.» Y lo del punto 15.
- `roma.json`: `default_free_tour.disponibilidad.horas` todavía dice `["10:00","16:00"]`. Que lea la lista única de `freeTourHoras.js`.
No toques nada más del documento. Si al pasarlo por el convertidor sale alguna duda, arréglala en el documento, no en el motor.

3. GRATIS Y DE PAGO
- Gratis (con el pago apagado o `?version=gratis`):
  - el orden nuevo de los días (punto 6), que es para todos;
  - sin horas: todos los días de ruta, enteros, y el día de vuelta sin ruta, como ahora;
  - en RESERVAS no sale «Llegada y vuelta» ni la zona («x de 2», como ahora);
  - el día 1 empieza siempre en Navona (no hay zona);
  - la barra, con la flecha, abre la ventana con todos los puntos y sin «Para tu zona»;
  - sin hoja del resumen y sin avisos de vuelos.
  - Si un viaje tiene horas guardadas y se ve en la gratis (o deja de pagar), el motor no las usa y no las borra.
- De pago: todo lo de esta tanda.
- Lo de pago no lleva candados: simplemente no sale.

4. LO QUE PONE EL VIAJERO (en RESERVAS, nunca en el formulario)
- Las horas y los puntos que ya existen. No hagas campos nuevos.
- La llegada es el día 1 y la vuelta, el día de vuelta. Debajo de la hora, en pequeño: «¿Llegas o te vas otro día? Cambia las fechas del viaje», que abre el calendario de siempre.
- En coche no se pide hora. Con medios mezclados (la ida en coche y la vuelta en avión, por ejemplo), cada barra con su medio, y solo se recorta donde hay hora.
- Con hora y sin punto elegido, se usa el punto con el traslado más largo de ese medio: avión, Fiumicino; tren, Tiburtina; autobús, la estación de autobuses de Tiburtina; barco, Civitavecchia.
- La zona sin tocar cuenta como «Aún no lo sé»: el día 1 empieza en Navona.
- Al poner, cambiar o borrar una hora, un punto o la zona, los días se rehacen solos, con el rehacer en segundo plano de siempre, y sale una sola hoja del resumen (punto 13). Las reservas se quedan en su día y a su hora. Los días cambiados a mano no se tocan. La zona solo cambia el día 1.
- Al quitar el vuelo, [Deshacer] devuelve el viaje como estaba.
- Si cambian las fechas del viaje (también con [Añadir en un día nuevo] de la 6y10) y ya había vuelta con hora: aviso en la campana, «Has cambiado los días del viaje: revisa que tu vuelta sigue siendo el {día}.» [Ver mi vuelta]. Se va cuando el viajero abre su vuelta o la cambia. No cambies la vuelta tú.

5. LAS HORAS: UNA FILA PARA CADA HORA
Por dentro, con los datos de `_llegada.json` (nunca se enseñan):
- «Libre» = la hora de llegada + el traslado del punto + 30 min para dejar la maleta: Fiumicino 1:30, Ciampino 1:20, Termini 0:45, Tiburtina (tren) 0:55, estación de autobuses de Tiburtina 0:55, Civitavecchia 2:30. Si pasa de la medianoche, sigue contando como el mismo día (es la última fila), nunca como la mañana siguiente.
- «Salir» = la hora de salida − el margen del punto: Fiumicino 3:00, Ciampino 2:50, Termini 0:45, Tiburtina (tren) 0:55, estación de autobuses de Tiburtina 0:55, Civitavecchia 3:50 (el margen de embarque y el trayecto al puerto). Si queda antes de la medianoche, es la noche del día de antes.
- Escribe en el INFORME, para cada punto, la tabla con la hora de llegada o de salida de cada frontera (por ejemplo: con Fiumicino, la última mañana empieza con un vuelo a las 16:00).

La llegada (el día 1):

| Hora | El día 1 |
|---|---|
| llega entre las 0:00 y las 4:59 | un día entero normal (como «libre antes de las 13:00», empezando a las 9:00) |
| libre antes de las 13:00 | su día escrito entero, desde la hora a la que está libre (desde las 9:00 si está libre antes): con 3 días de ruta o más, toda la ruta del centro, con el Pincio y el Popolo, comida, cena y noche; con 2, el D1; con 1, el D0 [DUDA 2] |
| libre de 13:00 a 14:59 | la ruta del centro: la comida nada más llegar y los imprescindibles (Navona, el Panteón, Trevi y la Plaza de España con la Trinità), sin el Pincio ni el Popolo; cena y noche |
| libre de 15:00 a 16:59 | los imprescindibles, sin comida; cena y noche |
| libre de 17:00 a 20:29 | desde Navona: Navona y el Panteón, la cena, y de noche Trevi y la Plaza de España. Desde la Plaza de España: la Plaza de España y la Trinità, el Panteón y Navona, la cena, y de noche Trevi |
| libre de 20:30 a 22:59 | Trevi de noche, con su texto [DUDA 3: y la cena si está libre antes de las 22:00] |
| libre a las 23:00 o más tarde | nada, con su texto |

(La frontera de la comida pasa de las 14:30 a las 15:00: la tabla del 8-oct ponía las 14:30 porque la regla 6 lo decía entonces, y desde el 9-oct la regla 6 dice las 15:00.)

La vuelta (el día de vuelta) [DUDA 4]:

| Hora | El día de vuelta |
|---|---|
| sale entre las 0:00 y las 4:59 | cuenta como la noche de antes: el día de vuelta, solo el traslado; el último día de ruta, con su cena y sin nocturna |
| sale entre las 5:00 y las 8:59 | solo el traslado; el último día de ruta, normal, con su noche |
| desde las 9:00, salir antes de las 13:00 | solo el traslado |
| salir de 13:00 a 14:29 | la última mañana, sin comida: lo que su lista lleva después de la comida pasa a «Si te sobra tiempo» |
| salir de 14:30 a 19:59 | la última mañana con comida; después, «Después de comer, la tarde es tuya hasta que te vayas.» y [+ Añadir lugares] (como la excursión de medio día) |
| salir de 20:00 a 22:29 | un día más: el siguiente día escrito del orden que el viaje no lleva (por ejemplo, con 3 días de ruta, el D4), entero, sin cena ni noche. Si ya no queda ninguno, la última mañana con comida y la tarde libre |
| salir a las 22:30 o más tarde | ese día más, con cena y sin noche |

- Con una reserva grande el día de vuelta, hay mañana aunque la fila diga «solo el traslado» (punto 9).
- Los avisos del último día de ruta, con una salida de madrugada, se comparan con la hora de salir de esa noche.

6. EL ORDEN DE LOS DÍAS DE RUTA (para todos, también en la gratis y sin vuelos)
Sigue «El orden nuevo de los días» del documento:
- 1 día de ruta: D0. 2 días: D1 + D2 (con Free Tour, D3 + D1-FT), como ahora.
- 3 días o más: el día 1, el Centro (la ruta del centro histórico entera, igual para todos, empezando a las 9:00; con Free Tour, el «Centro con Free Tour»); los días 2 y 3, el D1 y el D2; el día 4, el interruptor (4 días: Roma por defecto, con el D4; 5 o más: Excursión por defecto); después, D4, D5 y D6. Del día 7 en adelante, la hoja «Ya has visto lo mejor de Roma» y EXPLORAR.
- Los cierres (el Vaticano no en domingo ni en miércoles, la Galería no en lunes): primero se cambian entre sí el D1 y el D2; si no se puede, con el día siguiente; nunca con el día 1. Con horas, el día 1 y el día de vuelta nunca dan ni reciben un día entero por un cierre: si no queda otro día entero, lo cerrado sale «Cerrado hoy» en su día, con su aviso.
- El D4 va en su versión «Con Free Tour de mañana» (el centro ya se vio el día 1), salvo que el día 1 no viera de día Trevi y la Plaza de España (la llegada de 17:00 a 20:29 desde Navona, o desde las 20:30): entonces, su versión de siempre.
- El D3 y el D1-FT ya no salen con 3 días de ruta o más, salvo en el caso del punto 11. El D1-corto y los medios días de tarde ya no salen.
- Sin horas de vuelo (y siempre en la gratis), el primer y el último día de ruta son días enteros normales: una reserva grande en ellos cambia los dos días enteros, como en cualquier otro día (lo que falló en la 6k).
- La regla 11c cuenta por los días de ruta: con 1 o 2, la nocturna puede ser un sitio visto ese día; con 3 o más, no.
- Con 2 días de ruta y la llegada desde las 13:00, el día 1 es el Centro por su fila y el día 2, el D1 (como decía el documento en «Con un solo día entero»). Con 1 día de ruta y la llegada desde las 13:00, el día 1 es el Centro por su fila. [DUDA 2]

7. EL DÍA DE LLEGADA (el día 1, con horas)
- La ruta del centro histórico, igual para todos, todo por fuera. La zona solo decide por dónde empieza:
  - Centro, Prati, Trastevere, Monti, Termini y «Aún no lo sé»: empieza en Navona: Piazza Navona · Panteón · Fontana de Trevi · Via Condotti · Plaza de España · la Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo.
  - Plaza de España: empieza en la Plaza de España: Plaza de España · la Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo · de camino Via del Corso · Fontana de Trevi · Panteón · Piazza Navona.
- Cada fila de la tabla de la llegada, con cada uno de los dos inicios, es una lista escrita (12 listas), en los datos, sacada del documento por el convertidor. El motor no recorta por minutos. Via Condotti va en las filas que llevan Trevi y la Plaza de España (es parada, regla 9).
- Lo primero que sale de la ruta al llegar tarde es el Pincio y el Popolo. Los imprescindibles se quedan siempre que esté libre antes de las 20:30: de día o, lo que no quepa, de noche.
- [DUDA 3] El día 1 entero (sin vuelos, o libre antes de las 13:00) se queda como está escrito, aunque acabe pronto («mejor que sobre», regla 5; HOY propone qué añadir). No le añadas paradas.
- La comida y la cena: se come donde esté la ruta a la hora de comer, con el restaurante de esa zona, sin repetir en el viaje. Navona y el Panteón: Armando al Pantheon (o Da Baffetto). El Tridente: Poldo e Gianna (o Edy). La cena: si la ruta acaba en Trevi o antes de llegar a ella, Armando o Da Baffetto; si llega a la Plaza de España o más allá, Il Gabriello (o Poldo e Gianna). Desde la Plaza de España, al revés. La comida, antes de las 15:00 (regla 6).
- La noche [DUDA 5, punto 2]: en las tres primeras filas, Trevi y la Plaza de España ya se han visto ese día. Con 3 días de ruta o más va otra nocturna a 15 min o menos de la cena, andando o en taxi, primero las imprescindibles (suele ser el Coliseo y el Foro desde el Campidoglio). Con 1 o 2, Trevi y la Plaza de España. La nocturna de la llegada cuenta para el viaje: no se repite otra noche. Y cuenta solo como nocturna: lo visto solo de noche sigue siendo parada de día otro día.
- Los dos textos:
  - de 20:30 a 22:59: «{Llegada} a las {hora}. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»;
  - a las 23:00 o más tarde: «{Llegada} a las {hora}. Descansa, que mañana empezamos a tope.»;
  - {Llegada}: avión, «Aterrizas»; tren o autobús, «Llegas a {punto}» (Termini, Tiburtina…); barco, «Desembarcas». {hora} es la del viajero.
- Lo visto en la llegada cuenta como visto [DUDA 5, punto 1]: los días siguientes, lo que se ve por fuera pasa a «de camino» con «Ya lo visitaste el {día}»; lo que se ve por dentro (el Panteón del D1, la Basílica del D2) se queda como parada.
- El día de llegada cumple las reglas de cierres de cualquier día, con el horario de su fecha.
- Una reserva grande el día de llegada: punto 9. Una reserva pequeña: solo su parada, a su hora, y la llegada se coloca alrededor (regla 4), sin quitar nada.

8. EL DÍA DE VUELTA (con horas) [DUDA 4]
- La fila de la tabla de la vuelta (punto 5) decide qué lleva.
- La última mañana es el primero de estos medios días que no repita lo principal que el viaje ya ha visto de día, tal como está escrito, a su hora de empezar y con su versión de cierres (el D0-medio del miércoles, el DA-medio del lunes):
  1. el D0-medio, si el viaje no ha visto la Plaza de San Pedro;
  2. el DT-medio, si no ha visto el Pincio ni el Popolo;
  3. el DA-medio, si no ha visto el Aventino;
  4. la mañana del D6, si no ha visto la Cúpula;
  5. si no queda ninguno, la hoja «Ya has visto lo mejor de Roma».
  - El 25 de diciembre y el domingo de Pascua (la bendición del Papa, el aviso de fechas de `roma.json`), el D0-medio se salta y va el siguiente.
- Si su hora de empezar no está escrita (solo lo está la del DT-medio, a las 7:30), la de un día normal; apúntalo.
- La última mañana cumple las reglas de cierres de cualquier día: si lleva algo cerrado ese día (los Museos marcados un domingo), los Museos van al día entero del Vaticano si no están ya allí; si ya están, «Cerrado hoy».
- Cada lista de la última mañana es una lista escrita para su fila. Comprueba en la prueba que cabe con la hora más temprana de su fila. Si una no cabe, no la recortes en el motor: apúntalo en PREGUNTAS con la lista y lo que sobra.
- Una reserva pequeña el día de vuelta: su parada a su hora, dentro de la mañana; no se quita nada.

9. LAS RESERVAS GRANDES Y LOS VUELOS [DUDA 1]
- En un día de ruta de en medio: se cambian los dos días enteros, como siempre (todo o nada).
- El día de llegada, libre antes de las 13:00: ese día pasa a ser el día escrito entero de ese sitio, desde la hora a la que está libre, con la lista de la hora de la reserva, y el día que tenía el día 1 pasa al día que lo llevaba (se cambian uno por otro). Si el viaje no lleva el día escrito de ese sitio (la Galería con 3 días de ruta), va su bloque, como abajo. Si el día que llega es el D1 con el Coliseo por la tarde, usa su versión del D1-FT (Trastevere por la mañana) para no repetir el centro del día siguiente.
- El día de llegada, libre desde las 13:00, o el día de vuelta: a ese medio día va solo el bloque de esa reserva, siempre entero y sin mirar si cabe:
  - Coliseo: el Coliseo a su hora, el Arco de Constantino y el Foro y Palatino. El Foro siempre con el Coliseo (es la misma entrada), antes o después según la tabla de la hora del Coliseo;
  - Museos: los Museos a su hora, la Plaza de San Pedro y la Basílica. El miércoles, la Plaza y la Basílica nunca antes de comer: después de la comida si la fila la lleva; si no, a «Si te sobra tiempo»;
  - Galería: la Galería a su hora y el parque de Villa Borghese.
  - El resto de su día escrito se queda en su día, en la versión sin esa visita: el del Coliseo empieza en el Campidoglio (el Altar, la comida en el Gueto y la tarde del centro); el del Vaticano, con su versión sin Museos del domingo; el de Villa Borghese, con la del lunes. Nada se pierde y nada se repite.
  - En la llegada: el bloque a su hora y, de la ruta de su fila, lo que va antes en su orden y lo demás después (regla 4), sin zigzag.
  - Con una reserva, el día de vuelta tiene mañana aunque su fila diga «solo el traslado».
  - Dos reservas grandes en el mismo medio día: cada bloque a su hora. Si se cruzan, el aviso «coinciden».
  - La comida y la cena, con la regla 4.
- Los sitios grandes y su bloque, en los datos del destino (para todos los destinos), no escritos en el código.
- Una reserva antes de estar libre (se compara con «libre», sin margen) o que acaba después de la hora de salir (su hora más lo que dura, de los datos): se queda en su sitio, el resto del día va por su fila, y sale el aviso del punto 13, que se queda en la campana.

10. LO QUE LOS VUELOS DEJAN FUERA [DUDA 2]
- Lo que eligió o reservó el viajero nunca desaparece. Las reservas mandan; lo del pool o lo añadido a mano que no cabe va a «Si te sobra tiempo» de ese día (o a «No incluido», como ya hace el pool).
- De lo nuestro: lo que la fila de la llegada deja fuera de la ruta del día 1 va a «Si te sobra tiempo» del día 1, en su orden; si el día 1 es de noche (desde las 20:30), al del día 2.
- Con 1 o 2 días de ruta, los imprescindibles que se quedan sin ningún día en el viaje (con 2 días y la llegada tarde, los Museos y la Basílica por dentro; con 1, el Coliseo y la Basílica de San Pedro por dentro, del D0) van a «Si te sobra tiempo» del día en que estaban.
- La hoja del resumen lo dice (punto 13).
- Nunca restaurantes ni nocturnas en «Si te sobra tiempo».

11. EL FREE TOUR
- Se ofrece como ahora: con 2 días de ruta o más, por sus fechas. Horas: 10:00, 12:00, 15:00 («Después de comer»), 17:00 («Por la tarde»), 19:00 y 21:00 (`freeTourHoras.js`). Sale de la Plaza de España y dura 2 h 30. Los días sin tour y los de horas especiales (24, 25 y 31 de diciembre, 1 y 6 de enero: solo a las 12:00) mandan también el día de llegada.
- Manda la hora que puso el viajero: la de su reserva o la que eligió en la hoja del Free Tour. Las de las 19:00 y las 21:00, solo si las pone él.
- Sin hora puesta, el Free Tour no lleva hora a la vista (regla 3). La que elige la app sale ya marcada en la hoja del Free Tour.
- Sin vuelos, con 3 días de ruta o más, va en el día 1 («Centro con Free Tour»): el tour a las 10:00 y, de la ruta, lo que el guía no enseña (la Trinità, el Pincio y el Popolo). Si el viajero pone otra hora para el día 1: la misma regla que la llegada con Free Tour (abajo). Con las 19:00 o las 21:00 en otro día, como ahora (la noche del D1) [DUDA 5, punto 3]. Reservado en el día 1 a las 19:00 o a las 21:00: en la noche del día 1, en lugar de la nocturna, con la cena después (19:00) o antes (21:00).
- Con vuelos, el día de llegada, sin hora puesta, la app elige la primera que le pille libre (por dentro). Los 30 min de la tabla son el camino hasta la Plaza de España más los 15 min de antes de la regla 4:

| Libre a las… | Free Tour |
|---|---|
| antes de las 9:30 | 10:00 |
| de 9:30 a 11:29 | 12:00 |
| de 11:30 a 14:29 | 15:00 |
| de 14:30 a 16:29 | 17:00 |
| a las 16:30 o más tarde | al día siguiente a las 10:00: el día 2 es el D3 y el día 3 el D1-FT (el único caso en que el Coliseo y el Vaticano cambian de día al poner los vuelos). Solo con 2 días de ruta enteros o más después del de llegada, y solo si ni el día 2 ni el día 3 tienen una reserva grande. Si no, el Free Tour no se pone y la hoja del resumen lo dice |

  - En un día de horas especiales, solo las horas de ese día que pille libre; si no queda ninguna, ese día no se pone y la hoja lo dice.
- La llegada con Free Tour:
  - el tour a su hora; la Plaza de España, Trevi, el Panteón y Navona, con «Lo ves en el Free Tour»;
  - de la ruta, solo lo que el guía no enseña y lleve su fila: con el tour de la mañana (10:00, 12:00), después de comer la Trinità, el Pincio y el Popolo, en su orden; con el de la tarde (15:00, 17:00), antes del tour, acabando en la Trinità, al lado de la salida. Nunca volver atrás desde Navona;
  - la comida, la cena y la noche según la fila y la regla 4 (con el tour de las 15:00, la comida antes, contada corta; si ni así llega, después).
- Con el Free Tour el día de llegada, los días enteros son el D1 y el D2 (no el D3 ni el D1-FT) y el D4 en su versión «Con Free Tour de mañana». Lo del D1 que ya enseñó el guía (Navona; el Panteón por fuera) va «de camino»; el Panteón por dentro se queda.
- Con uno o ningún día de ruta entero después del de llegada, el Free Tour solo va el día de llegada. Si ahí no cabe, no se pone, y la hoja del resumen lo dice.
- Si el Free Tour y otra reserva se cruzan, el aviso «coinciden» de siempre.

12. LA EXCURSIÓN Y LOS VUELOS
- Va en el día 4 de ruta, como sin vuelos, con el interruptor de siempre (4 días de ruta, Roma; 5 o más, Excursión). Nunca cae en el día de llegada ni en el de vuelta (punto 1).
- Excursión reservada: no se toca nunca, y los demás días se quedan donde estaban.
- Excursión reservada el día de llegada: si sale antes de estar libre, el aviso del punto 13; si sale después, ese día lleva la excursión, como cualquier día de excursión, y la ruta del día 1 se coloca como con una reserva grande en otro día (lo que se quede sin día, a «Si te sobra tiempo» del día 2).
- Excursión reservada el día de vuelta (o en el último día de ruta con una salida de madrugada) que vuelve después de la hora de salir: el aviso del punto 13, con [Ver mi reserva] · [Pasar este día a Roma]. No se cambia nada solo. Una de medio día (Ostia, Tívoli; vuelve a las 14:00): sin aviso si la hora de salir es a las 15:00 o más tarde (con Fiumicino, un vuelo a las 18:00 o más tarde).

13. LOS AVISOS Y LA HOJA DEL RESUMEN (los textos)
- La hoja de abajo (`HojaAbajo`) es para lo que acaba de pasar: su texto, la X y botones solo si hay que elegir. La campana es para lo que sigue mal: se queda hasta que se arregla, aunque se cierre la hoja, y se va sola al arreglarlo.
- Van a la campana: no llega a una reserva, una reserva después de salir, un sitio cerrado ese día (el que ya existe), la excursión que no cuadra y la vuelta que no cuadra con las fechas (punto 4).
- Al poner, cambiar o borrar los vuelos, el punto o la zona, una sola hoja del resumen con todo lo que ha cambiado. Por ejemplo:
  - «El mar 10 es tu llegada a Roma.»
  - Con la llegada de 0:00 a 4:59: «Aterrizas a las 0:30 del mar 10: ese día lo tienes entero, y esa noche ya necesitas alojamiento. Si aterrizas la noche del mar 10, cambia las fechas del viaje.» [Cambiar fechas] · [De acuerdo].
  - «El sáb 14 tienes una última mañana por Roma antes de irte al aeropuerto.» (o «a la estación», «al puerto»). Con un día más: «El sáb 14 tienes casi un día entero por Roma antes de irte.» Sin mañana: «El sáb 14 te vas pronto: ese día solo lleva el camino al aeropuerto.»
  - «Hemos puesto el Free Tour el mar 10, nada más llegar. Al reservarlo, elige la hora que te encaje.» con [Ver disponibilidad].
  - «Con tus vuelos, el Free Tour no cabe sin quitarte el Coliseo o el Vaticano. Si aun así lo quieres, añádelo desde «+ Añadir parada».»
  - [DUDA 2] «El Coliseo lo tienes en «Si te sobra tiempo» del mar 10: si reservas la entrada, te lo ponemos en el día.»
  - «El jue 12 lo has cambiado tú: lo dejamos como está.»
  - Al borrar los vuelos: «Tus días vuelven a ser enteros. Tus reservas se quedan donde estaban.»
  - Termina con [De acuerdo], o con los botones que haya que elegir.
- Los avisos de reservas y vuelos (todos con [Ver mi reserva]; solo horas del viajero; las palabras cambian con el medio: vuelo, tren, autobús o barco; aterrizas, llegas a {punto} o desembarcas):
  - «Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.»;
  - «Tu entrada a los Museos Vaticanos es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.»;
  - «Aterrizas a las 9:00 y tu excursión a Pompeya sale a las 7:30: no llegas. Revisa tu reserva.»;
  - «Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma a las 20:00: no te da tiempo. Revisa tu reserva de la excursión.» [Ver mi reserva] · [Pasar este día a Roma]. Si su reserva no tiene hora de vuelta, la frase sin esa hora.
- Ningún texto de esta tanda enseña una hora que calcule la app («libre a las», «sal a las», «sales hacia el aeropuerto a las», «en el centro a las»), ni el nombre de una empresa, ni «Día n» con fechas.

14. LO QUE SE VE: LA BARRA, EL TÍTULO Y HOY
- La barra de llegada y de vuelta: la de la 6t, sin cambios.
- «Día de viaje» y el trayecto pequeño («Madrid → Roma»), como ahora, en el día de llegada y en el de vuelta.
- El título del día, por grupos, como todos. Un día de llegada o de vuelta sin paradas (llega a las 23:00 o más tarde, solo el traslado, o solo Trevi de noche, que no cuenta para el título) se llama «Día de viaje», nunca «Día libre».
- HOY (de pago):
  - el día de llegada, antes de la primera parada, la tarjeta «Llegada a {punto}» (Fiumicino, Termini…) con [Cómo llegar a tu zona], que abre la ventana de llegada en «Para tu zona»;
  - el día de vuelta, después de la última parada, la tarjeta «Llegada al aeropuerto de Fiumicino» (o «a la estación de Termini», «al puerto de Civitavecchia») con [Cómo llegar] (Google Maps, como cualquier parada) y, en pequeño, «Ver cómo ir», que abre la ventana de vuelta;
  - sin horas calculadas: nunca «sal a las…»; [No me da tiempo] y [Deshacer], como siempre;
  - [DUDA 6] [Cómo llegar a tu alojamiento] (Google Maps con el nombre del alojamiento y la ciudad): en la ventana de llegada, debajo de «Para tu zona»; en HOY, al acabar cada día; y en HOY el día de llegada, después de «Llegada a {punto}». Solo si el viajero puso su alojamiento.

15. LA VENTANA DE LLEGADA Y «PARA TU ZONA» [DUDA 5, punto 4]
- Arriba del Resumen, una línea «Para tu zona» con lo más cómodo según el punto y la zona (tabla «Cómo llegar a tu zona» del documento). Debajo, las demás formas, como ahora. A la vuelta, al revés.
- Sin zona, o con «Aún no lo sé», sin la línea, como ahora. En la gratis, sin la línea.
- Desde Ciampino, el Airlink a Termini y luego la columna «Desde Termini». Desde Tiburtina, el metro B a Termini (a Monti, directo hasta Cavour). Desde Civitavecchia, el tren regional: a Prati, bajando en San Pietro; a las demás zonas, hasta Termini.
- Las líneas, las que ya usa la app: Leonardo Express, FL1, Airlink, metro A y B, bus 40 y 64, tranvía 8.
- El taxi de precio fijo (55 € desde Fiumicino y 40 € desde Ciampino) sale siempre como opción, con lo que dice el dato: vale dentro de las murallas, y fuera (el dato dice «Prati alto, el EUR») va por taxímetro.
- El primer y el último tren: solo hay dato del Leonardo Express (desde el aeropuerto, el primero a las 5:38 y el último a las 23:23), y vale del 14 de junio al 12 de diciembre de 2026 (lo dice su fuente). Guárdalo como tramo de fechas en `_llegada.json`. Si aterriza demasiado tarde para el último o antes del primero (el margen sale de los datos: el traslado menos lo que tarda el tren; apúntalo en el INFORME), lo primero es el taxi. Fuera de ese tramo, y en Ciampino, Tiburtina y Civitavecchia (no hay dato), no se aplica: apúntalo en el INFORME para que Eric dé el dato. No lo inventes.
- Si el tren de Civitavecchia para en Roma Trastevere: no está en los datos. No lo inventes.
- Los textos con «centro»: fuera de nuestras frases (por ejemplo, el subtítulo «Cómo llegar al centro desde tu punto de entrada en Roma» → «Cómo llegar a tu alojamiento desde tu punto de llegada»). Se quedan los datos reales («32 km al centro», «De Fiumicino al centro»).
- Fuera los nombres de empresas de la ventana y de `_llegada.json`: «Autobús a Termini (Terravision)», «Autobús a Termini (Rome Airport Bus)», «Autobús ATRAL al metro Anagnina», «KiPoint» y «KiBag» de la consigna, «la app de Trenitalia» del consejo «Compra el billete antes». Queda el autobús con su andén, su precio y su tiempo; la consigna de Termini con su sitio, su horario y su precio; «la app oficial del tren». Las fuentes se quedan en los datos (no se ven).

16. LA RUTA A MANO (la de la 6y)
- La app no mete nada sola ni reordena nada, tampoco por los vuelos: las horas solo ponen las barras, «Día de viaje» y los avisos de reservas contra el vuelo (punto 13). Nunca recortan ni rehacen un día. Sin hoja del resumen. «Reorganizar este día» no mira el vuelo.

17. FUERA LO VIEJO
- La hoja «¿Ajustamos tu ruta a tu vuelo?» (`FlightAdjustSheet.tsx`), su llamada desde `ReservasPanel.tsx` y `LlegadaYVuelta.tsx` (`onGuardada`), y `src/lib/flightOpportunity.ts` (también lo usan un comentario de `stopScheduling.ts`, `types.ts` y la prueba `scripts/destino/_6z3_entrada.tsx`: cámbialos sin romperlos).
- El campo `flightAdjust` y `setFlightAdjust`.
- «Ajustar este día a tu llegada» y «Ajustar este día a tu vuelta» de `DayDetailPanel.tsx`, su acción en `useRouteStore.ts` y `fitMealsToStops` de `arrivalReturn.ts`, si solo se usa ahí.
- El comentario «EN EL CENTRO» de `arrivalReturn.ts` y cualquier otro camino que rehaga el primer o el último día por la hora del vuelo.
- `FirstLastDayCard`, «Libre hacia las…» y `PaceWandPrompt` ya no existen: no hay nada que hacer.
- Si algo de esto lo usa otra pantalla, no la rompas: dilo en el INFORME.

18. PARA LOS DESTINOS QUE VIENEN
- Las reglas de llegada y vuelta reciben la ciudad, la hora y el punto, y leen del destino sus tablas, sus listas, sus sitios grandes y sus bloques. Nada de Roma escrito en el código.
- No cambies cómo se guarda el viaje: una llegada y una vuelta por viaje.
- Añade a `GUIA_NUEVOS_DESTINOS.md`, en «Llegadas y vueltas»: cómo se cuentan los días (punto 1), las dos tablas por filas (punto 5), la ruta del día de llegada por inicio de zona, la última mañana sin repetir, el bloque de cada sitio grande, y que la ventana no lleva nombres de empresas.

19. LO QUE NO VA EN ESTA TANDA
- La escala de crucero (llegar y salir el mismo día por Civitavecchia sin dormir en Roma): de momento, un viaje de una fecha, con sus barras.
- Los viajes de varios destinos.
- La zona del alojamiento para el día de vuelta: la vuelta se cuenta desde el centro.
- Que la app proponga sola el Free Tour de las 19:00 el día de llegada.

PRUEBAS (regla de Eric)
- Esta tanda toca el motor: durante la tanda, la batería rápida y la muestra de unas 60 fechas (festivos, domingos, lunes, miércoles, Navidad, Semana Santa, agosto), en paralelo. Con eso a 0 fallos, haz el push. Después del push, las 365 fechas completas (`_correr365.mjs`), con el resultado al final del INFORME en un commit aparte; si sale algún fallo, no arregles nada: apúntalo arriba de PREGUNTAS.
- Casos: de 1 a 7 días de ruta (y la escala de una fecha), con fechas y sin fechas; sin Free Tour, con el Free Tour marcado sin hora y con cada una de sus 6 horas, también en sus días especiales; sin excursión, con la de la app, la elegida, la reservada y la de medio día; las 7 zonas y la zona sin tocar; gratis y de pago; nuestra ruta y la ruta a mano; medios mezclados.
  - Llegadas, para cada punto (y sin punto): las 0:00, las 4:59 y las 5:00, y las horas que dejan libre a las 8:59, 9:00, 12:59, 13:00, 14:59, 15:00, 16:59, 17:00, 20:29, 20:30, 22:59 y 23:00, más una que pasa de la medianoche y una a las 23:45.
  - Vueltas, para cada punto (y sin punto): las 0:00, 4:59, 5:00, 8:59 y 9:00, y las horas que dan salir a las 12:59, 13:00, 14:29, 14:30, 19:59, 20:00, 22:29 y 22:30.
  - El Coliseo, los Museos y la Galería reservados el día de llegada (libre antes y después de las 13:00), el día de vuelta (también con la fila «solo el traslado» y un miércoles) y en un día de en medio, a primera hora, a mediodía y por la tarde. Dos reservas grandes el mismo medio día. Una reserva pequeña el día de llegada y el de vuelta.
  - Cambiar las fechas y añadir un día al final con la vuelta puesta.
- Hay que comprobar:
  1. Sin vuelos (y en la gratis): los días de ruta, como el orden nuevo (con 3 o más, el Centro entero el día 1, el D1 y el D2 los días 2 y 3, o al revés por un cierre, nunca al día 1, y el interruptor el día 4), y el día de vuelta sin ruta, como ahora. Una reserva grande en el primer o el último día de ruta cambia los dos días enteros.
  2. Con vuelos, los días de ruta de en medio son los mismos que sin vuelos (salvo el caso del Free Tour a las 16:30 y el de 2 días de ruta), el día 1 empieza en Navona (en la Plaza de España si duerme allí) y el día de vuelta lleva lo de su fila.
  3. Cada hora cae en su fila (los bordes) y cada fila lleva exactamente su lista escrita. Ninguna hora, de 0:00 a 23:59, se queda sin fila, para ningún punto; la tabla de fronteras por punto está en el INFORME.
  4. Comida solo en las filas que la llevan; la del día 1, antes de las 15:00; la del día de vuelta, solo saliendo a las 14:30 o más tarde.
  5. La noche: 0 nocturnas repetidas en el viaje; con 3 días de ruta o más, ninguna nocturna es un sitio visto ese día; la de la llegada, a 15 min o menos de la cena; con una salida de madrugada, el día de antes sin nocturna y con cena.
  6. Lo visto en la llegada sale «de camino» los días siguientes, con «Ya lo visitaste el {día}», salvo lo que se ve por dentro y lo visto solo de noche. Nada por dentro dos veces en el viaje.
  7. La última mañana nunca repite lo principal ya visto de día, y cada lista cabe con la hora más temprana de su fila (si no, a PREGUNTAS).
  8. Las reservas: nunca desaparecen ni cambian de hora; en la llegada y el día de vuelta, su bloque entero, con el Foro siempre con el Coliseo; en los días de en medio, los dos días enteros cambiados; los avisos salen cuando toca y se quedan en la campana hasta que se arreglan.
  9. Nada elegido o reservado desaparece; lo que los vuelos dejan fuera está en «Si te sobra tiempo» (punto 10).
  10. El Free Tour: la hora del viajero manda; sin hora, la de la tabla y sin hora a la vista; los días sin tour y los de horas especiales se cumplen; a las 16:30 o más tarde, al día siguiente solo en su caso; nunca a las 19:00 o las 21:00 si no las puso él.
  11. La excursión: la reservada nunca se mueve ni se quita; el interruptor nunca se bloquea; nunca cae en el día de llegada ni en el de vuelta.
  12. La ruta a mano: las horas no cambian ningún día.
  13. Los títulos: el día de llegada o de vuelta sin paradas es «Día de viaje», nunca «Día libre».
  14. Los textos de esta tanda (barras, hojas, avisos, ventana, textos de la llegada, HOY): 0 horas calculadas, 0 nombres de empresas, 0 «Día n» con fechas, y «centro» solo en datos reales.
  15. Lo de siempre: nada cerrado, sin zigzag, por dentro una sola vez, 0 restaurantes repetidos.
  16. Sin horas, el motor da lo mismo que antes de quitar lo viejo (salvo el orden nuevo).
- A mano, a 375 px, de pago y gratis, con fechas y sin fechas: poner la llegada, la vuelta y la zona en RESERVAS y ver la hoja del resumen; el día de llegada con su barra (una llegada de cada fila, desde Navona y desde la Plaza de España); una llegada a las 21:00 con su texto; el día de vuelta de cada fila; el aviso de una reserva a la que no llega, que se queda en la campana; la ventana con «Para tu zona» y sin nombres de empresas; HOY el día de llegada y el de vuelta; la gratis con los días enteros y el día de vuelta como ahora.
- Capturas en docs/dias/img/7-*.jpg.

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 7 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
