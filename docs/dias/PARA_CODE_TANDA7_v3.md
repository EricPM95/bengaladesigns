Tanda 7 (después de la 6y10). Las llegadas y las vueltas: el día de llegada y el día de vuelta según la hora del vuelo, el tren, el autobús o el barco, la ficha de llegada y vuelta, el billete del vuelo, «Mover a otro día» y «Cambiar parada», y las respuestas a la 6y10. Es la parte de pago y tiene que quedar perfecta. Va todo en este archivo.

Antes de nada: Claude ha copiado en docs\dias este archivo, VIAJES_REVISION.html (regenerado con el motor de la 6y10) y PENDIENTES_RECOMPENSAS.md, y en docs\diseno tres diseños: ficha_llegada\Ficha Llegada.dc.html, dia1_vuelo\Dia 1 Reservas.dc.html y mover_parada\Mover Parada.dc.html. Súbelos en el primer commit, sin tocarlos. Este archivo sustituye a PARA_CODE_TANDA7.md (8-oct), a PROMPT_TANDA7_PARA_PEGAR.md (8-oct) y a docs\dias\llegadas_rev\PARA_CODE_TANDA7_v2.md: no los sigas. Pon arriba de cada uno una sola línea: «Sustituido por PARA_CODE_TANDA7_v3.md (13-oct-2026).» La carpeta llegadas_rev (DUDAS, HUECOS, MATRIZ, REVISION_REGLAS) es historia: no la sigas.

REGLA DE LAS PREGUNTAS (como siempre): lo pequeño lo decides tú, siguiendo el documento y las reglas de siempre, y lo apuntas en el INFORME en «Decidido por Code». En PREGUNTAS, como mucho 5, solo lo que cambie de verdad lo que ve el viajero o choque con una regla de Eric.

LAS REGLAS DE ERIC QUE MANDAN EN TODA LA TANDA (si algo de abajo choca con una, manda la regla y lo apuntas):
- La app avisa y nunca prohíbe.
- Nada se quita sin que lo decida el viajero: lo que no cabe va a «Si te sobra tiempo».
- Los IMPRESCINDIBLES con entrada que también se pueden ver por fuera (el Coliseo, el Panteón…) nunca se quitan: se quedan como parada, con su espacio y su etiqueta de reserva, y el viajero decide (añadir la entrada, cambiar la hora, pasarlo a otro día, verlo por fuera). «Nunca se quitan» quiere decir que nunca desaparecen: solo cuando no les queda ningún día en el viaje (un cierre, o un viaje de 1 o 2 noches con la llegada tarde, puntos 8 y 9), van a «Si te sobra tiempo» con su aviso. El Coliseo lleva siempre su tiempo entero, por dentro; la única excepción es la mañana corta de la vuelta (punto 9), por fuera con su etiqueta. Lo que tiene entrada y no es imprescindible (San Luigi, el Altar por dentro, el Ara Pacis…) puede ir a «Si te sobra tiempo», como lo demás.
- Los imprescindibles nunca van «de camino»: si ya se vieron otro día (también en la llegada), salen otra vez como parada. Solo lo que no es imprescindible pasa a «de camino» con «Ya lo visitaste el {día}». Si una lista escrita lleva un imprescindible «de camino» (Navona y el Panteón en la mañana del D6, la Plaza de San Pedro en la Cúpula), pasa a parada corta (~10 min). La fachada de la Basílica del D0-medio se queda de camino: la Plaza de San Pedro ya es su parada.
- Ninguna hora calculada a la vista. Solo se enseñan las horas que pone el viajero (su vuelo, sus reservas) y las de los datos (un horario, el último tren, «32 min sin paradas»). La hora a la que está libre o a la que tiene que salir se usa por dentro y nunca se enseña. Nunca un tiempo total sumado por la app.
- Sin cuentas al minuto: la hora de llegada y la de salida, como la de una reserva, solo eligen la fila de una tabla. Lo que lleva cada fila es una lista escrita en el documento. El motor no quita ni mueve nada por minutos.
- Sin nombres de empresas en los textos (sí los nombres del transporte público: Leonardo Express, FL1, metro A, bus 40). Sin taxi como forma de llegar o irse (la ficha de llegada y vuelta, «Para tu zona», los Tips, las tarjetas): en su lugar, el traslado privado. Los trayectos en taxi dentro de la ruta que ya están escritos (taxi a la entrada de los Museos, a la nocturna, a la Plaza de España) se quedan como están.
- La llegada y la vuelta con horas son de pago. En la gratis, los días como hoy.
- Reserva grande (los «sitios grandes» de `roma.json`: Coliseo, Museos Vaticanos, Galería Borghese) mueve el día entero; reserva pequeña, solo su parada, y del día al que llega no se quita nada. Los días cambiados a mano no se tocan.
- Horarios reales por tramos de fechas (`horarioDeLaFecha`); sin fechas, el día 15 del mes.
- Comida nunca antes de las 12:00 (salvo la excepción de los Museos de 12:00 a 13:00 de la 6y10) y siempre antes de las 15:00. Comida antes de una visita si al salir de ella son más de las 14:30; cena antes si son más de las 22:00 (regla 4).
- Los días por su fecha («el mar 10»), sin «Día 1» (sin fechas, «el día 1»): siempre con `src/lib/nombreDeDia.ts`. Los títulos de los días, por grupos (`src/lib/tituloDelDia.ts`, invariante 614).
- Nada de varios destinos: una llegada y una vuelta por viaje.
- Cada tramo de cada tabla empieza en su hora: libre a las 14:00 en punto ya es la fila de las 14:00. La única excepción escrita es la del Coliseo en su tabla de horas («hasta las 13:00 incluida»). La hora no se redondea para elegir la fila.
- El Free Tour, al principio del viaje (cuando se puede).

0. MIRA ANTES LO QUE YA EXISTE Y ÚSALO (no lo hagas de nuevo)
- En RESERVAS, «Llegada y vuelta» (`LlegadaYVuelta.tsx`, `ReservasPanel.tsx`): la hora de llegada y la de salida, el punto (Fiumicino, Ciampino, Termini, Tiburtina, Civitavecchia), el medio de cada mitad (`tripModes`), el precio, la referencia, la compañía y el código. «x de 3 listo» de pago y «x de 2» gratis.
- La zona del alojamiento: «¿En qué zona te alojas?» con su rueda, de pago (`AlojamientoReservas.tsx`, `route.accommodationZone`, las 7 zonas en `destination_config.zonas_alojamiento` de `roma.json`).
- Las horas de cada punto: `data/dias/roma/_llegada.json` y `shared/arrival/arrivalRules.js` (`centerMinutesOf`, `leaveMinutesOf`). Son la única fuente de los márgenes.
- La barra de llegada y de vuelta del diseño 1b (`barTextOf`): sin horas calculadas. No la cambies.
- La ventana de llegada y de vuelta (`ArrivalReturnSheet.tsx`: Resumen · Traslados · Tips) y su tarjeta del traslado privado (sin precio, sin proveedor).
- La hoja de abajo (`HojaAbajo`), la campana (`useAppNotices`, `NoticesSheet`), el rehacer en segundo plano («Actualizando tu ruta…», «gana el último») y [Deshacer] (`quitarConDeshacer`).
- La hoja del Free Tour (`FreeTourSheet.tsx`) y la lista única de sus horas (`shared/routeEngine/freeTourHoras.js`).
- El candado de pago de «Escuchar historia» (`pedirPago()`) y el interruptor (`pagoActivo()`, `?version=gratis`).
- El orden de los días de la 6y10 (todos los órdenes, el que pierde menos), «Cerrado este día» y los «sitios grandes» de `roma.json`.
- La lista de días de «Mover a otro día» (`ListaDeDias.tsx`, la usan el menú «···» de DÍAS y la hoja de HOY) y el menú «···» de cada parada (`StopMenu.tsx`).

1. LOS DÍAS: CÓMO SE CUENTAN Y CÓMO SE ENSEÑAN
- La app cuenta los días de ruta por noches. El último día del viaje, el de la fecha de vuelta, es el día de vuelta que crea la app (`appendReturnLegDay`; invariante 21: `contentDays = días − 1`). Sin vuelos no lleva ruta, solo su barra.
- En esta tanda, «3 noches» = 3 días de ruta + el día de vuelta. Las tablas del documento («2 días», «4 días»…) son días de ruta.
- Con una sola fecha (llegar e irse el mismo día) no hay día de vuelta aparte: el D0 de siempre, con las dos barras; las horas no lo recortan, solo salen los avisos del punto 14.
- CÓMO SE ENSEÑA (Eric): siempre los dos, primero los días: «{n+1} días · {n} noches» (del 10 al 14: «5 días · 4 noches»). Con una sola fecha: «1 día».
  - En el calendario del formulario, debajo de las fechas, así, en lugar de «5 días».
  - Sin fechas, la hoja «Aún no sé mis fechas» pregunta «¿Cuántas noches?» en lugar de «¿Cuántos días?», con «noche» / «noches». Por dentro se guarda igual que ahora (`days` = noches + 1). Si hoy se puede elegir un solo día, sigue pudiéndose, con el texto «Solo un día».
  - Donde la app escribe hoy los días del viaje («{n} días»: la cabecera, la tarjeta del viaje, Mis viajes, el PDF), igual: «5 días · 4 noches». Haz la lista de los sitios en el INFORME.
  - Los viajes guardados no cambian: solo cómo se enseñan.
- Si ves que algo no es así (por ejemplo, que un viaje de Roma ya lleva ruta en la fecha de vuelta), para y pregúntalo.

2. SIN VUELOS (y siempre en la gratis): LOS DÍAS COMO HOY
- El orden de los días se queda COMO ESTÁ HOY («Qué días lleva cada viaje» del documento, el del 7-oct: D1 + D2 + D4…; con Free Tour de mañana, D3 + D1-FT + D4…), con el orden de la 6y10. El «orden nuevo» del 8-oct (el Centro como día 1 para todos) NO entra: bórralo del documento (punto 18).
- El día 1 y el último día de ruta, enteros y normales: una reserva grande en ellos cambia los dos días enteros, como en cualquier otro día.
- El día de vuelta, sin ruta. En la gratis lleva la tarjeta del punto 3.

3. GRATIS Y DE PAGO
- Gratis (con el pago apagado o `?version=gratis`): los días como en el punto 2; en RESERVAS no sale «Llegada y vuelta» ni la zona («x de 2», como ahora); la barra abre la ventana con todos los puntos y sin «Para tu zona»; sin hoja del resumen y sin avisos de vuelos. Si un viaje tiene horas guardadas y se ve en la gratis (o deja de pagar), el motor no las usa y no las borra.
- De pago: todo lo de esta tanda.
- Lo de pago de esta tanda no lleva candados en la gratis: simplemente no sale. La única excepción es esta tarjeta, que es el motivo principal para pagar:
- LA TARJETA DEL DÍA DE VUELTA (solo en la gratis, en DÍAS, dentro del acordeón del día de vuelta; en la de pago no sale, ahí está el «+ AÑADIR VUELO» de la barra de vuelta). Con el diseño de las tarjetas de siempre:
  - Título: «Tu último día también cuenta»
  - Texto: «Aún no sabemos a qué hora te vas, por eso este día está en blanco. Dinos cuándo sale tu vuelo o tu tren y te lo dejamos listo: lo que te falta por ver, dónde comer y la tarde libre si te da tiempo. Sin repetir nada y sin prisas para irte.»
  - Botón principal: [Añadir mi vuelta], con el candado: hace lo mismo que el candado de «Escuchar historia» (`pedirPago()`), con esta línea arriba: «Con tu vuelo, el primer y el último día se ajustan a tu hora.»
  - Debajo, pequeño: [Prefiero montarlo yo], que hace lo mismo que [+ Añadir lugares] de cualquier día.
  - Si el viajero ya añadió lugares a ese día, la tarjeta se queda pequeña, debajo de sus lugares: «¿Te vas por la tarde? Añade tu vuelta y te preparamos la mañana.» [Añadir mi vuelta].
  - En coche (sin hora): no sale.

4. LO QUE PONE EL VIAJERO (en RESERVAS, nunca en el formulario)
- Las horas y los puntos que ya existen. Para guardar una mitad con hora, el punto de Roma (aeropuerto, estación o puerto) es obligatorio. Con hora y sin punto en un viaje viejo, se usa el del traslado más largo de ese medio: avión, Fiumicino; tren, Tiburtina; autobús, la estación de autobuses de Tiburtina; barco, Civitavecchia.
- CASILLAS NUEVAS, opcionales (Eric: «así el cliente también usa la app como recordatorio»), en las dos mitades: el punto del otro lado (en la ida, de dónde sale: «Barcelona-El Prat (BCN)»; en la vuelta, a dónde llega) y la otra hora (en la ida, la de salida; en la vuelta, la de llegada). Las enseña el billete (punto 15). Para el motor no cambian nada: solo cuentan la llegada a Roma y la salida de Roma.
- LA ZONA: la que ya existe. Con hora, se pide; «Aún no lo sé» es una respuesta válida (la zona sin tocar cuenta igual). Debajo de «¿En qué zona te alojas?», en pequeño: «Con tu zona, tu ruta queda aún más a tu medida: te decimos cómo llegar desde el aeropuerto y por dónde empezar tu primer día.»
- LA DIRECCIÓN DEL ALOJAMIENTO, casilla nueva y opcional, de pago, en RESERVAS › Alojamiento: «Dirección de tu alojamiento (opcional)». Solo con ella sale [Cómo llegar a tu alojamiento] (Google Maps con esa dirección): en la ficha de llegada, en HOY al acabar cada día y en HOY el día de llegada después de «Llegada a {punto}». Sin la dirección, el botón no sale nunca (ni con el nombre del hotel ni con la zona).
- La llegada es el día 1 y la vuelta, el día de vuelta. Debajo de la hora, en pequeño: «¿Llegas o te vas otro día? Cambia las fechas del viaje», que abre el calendario de siempre.
- En coche no se pide hora. Con medios mezclados, cada barra con su medio, y solo cuenta la hora donde la hay.
- Al poner, cambiar o borrar una hora, un punto o la zona, los días se rehacen solos, con el rehacer en segundo plano, y sale una sola hoja del resumen (punto 14). Las reservas se quedan en su día y a su hora. Los días cambiados a mano no se tocan.
- Al quitar el vuelo, [Deshacer] devuelve el viaje como estaba.
- Si cambian las fechas del viaje (también con [Añadir en un día nuevo]) y ya había vuelta con hora: aviso en la campana, «Has cambiado los días del viaje: revisa que tu vuelta sigue siendo el {día}.» [Ver mi vuelta]. Se va cuando el viajero abre su vuelta o la cambia. No cambies la vuelta tú.

5. LAS HORAS POR DENTRO (nunca se enseñan)
Con los datos de `_llegada.json`:
- «Libre» = la hora de llegada + el traslado del punto + 30 min para dejar la maleta: Fiumicino 1:30, Ciampino 1:20, Termini 0:45, Tiburtina (tren) 0:55, estación de autobuses de Tiburtina 0:55, Civitavecchia 2:30. Si pasa de la medianoche, sigue siendo el mismo día (la última fila).
- «Salir» = la hora de salida − el margen del punto: Fiumicino 3:00, Ciampino 2:50, Termini 0:45, Tiburtina 0:55, estación de autobuses de Tiburtina 0:55, Civitavecchia 3:50. Si queda antes de la medianoche, es la noche del día de antes.
- Escribe en el INFORME, para cada punto, la tabla con la hora de llegada o de salida de cada frontera de los puntos 6 a 9 (por ejemplo: con Fiumicino, libre antes de las 10:00 = aterriza antes de las 8:30).
- «Invierno» en esta tanda = los días en que el Coliseo cierra a las 16:30 según `horarioDeLaFecha` (hoy, del último domingo de octubre al último sábado de febrero); todos los demás días son «de marzo a octubre» (así, los últimos días de octubre son invierno). Nunca fechas escritas a mano.

6. CON VUELOS: EL DÍA 1 EN LOS VIAJES DE 3 NOCHES O MÁS (sin Free Tour de mañana)
El día 1 es el D1 (la Roma antigua y el centro) en una versión según la hora a la que está libre; los demás días, como sin vuelos (punto 2). Cada fila es una lista escrita: escríbelas en el documento (punto 18) tal como van aquí y pásalas por el convertidor.

| Libre a las… | El día 1 |
|---|---|
| llega de 0:00 a 4:59 | un día entero normal: el D1 de siempre, desde las 9:00 |
| antes de las 10:00 | TRANQUILO. De marzo a octubre, el D1 «al revés» (su versión «Por la tarde (a las 15:30 o más tarde)» del documento: la parte del centro por la mañana y la Roma antigua por la tarde), con todas sus paradas. En invierno, el D1 de siempre (la Roma antigua por la mañana). Si reserva el Coliseo, manda la tabla de la hora del Coliseo, como siempre |
| de 10:00 a 11:59 | RÁPIDO. De marzo a octubre: por la mañana, a buen paso, Piazza Navona ~20, Panteón ~15 (por fuera, con su etiqueta de reserva) y Fontana de Trevi ~20; comida: Armando al Pantheon (o Da Baffetto); tarde: Coliseo por dentro ~1 h 15, Arco de Constantino ~10, Foro Romano y Palatino por dentro ~1 h 30 (se sale por el Campidoglio), Plaza del Campidoglio ~30, Piazza Venezia ~10, Altar de la Patria por dentro ~45; cena: Il Gabriello (o Poldo e Gianna); noche: la Plaza de España y la Escalinata (Trevi no se repite de noche: regla 11c). A «Si te sobra tiempo»: el Barrio Judío, la Fuente de las Tortugas, Largo di Torre Argentina, San Luigi dei Francesi y la Iglesia del Gesù. En invierno, la Roma antigua siempre primero: libre de 10:00 a 10:59, Coliseo, Arco, Foro y Palatino y Plaza del Campidoglio, la comida en el Gueto antes de las 15:00 (Nonna Betta o Giggetto), y después Piazza Venezia, el Altar por dentro y la parte del centro a buen paso (el Panteón por dentro, Navona); libre de 11:00 a 11:59, la comida a las 12:00 en Monti (La Taverna dei Fori Imperiali o Trattoria Valentino) y después lo mismo (la Roma antigua y la parte del centro). Cena y noche en Trevi y la Plaza de España |
| de 12:00 a 13:59 | DE TARDE. De marzo a octubre: comida al llegar (punto 16, «La comida al llegar»); Coliseo por dentro, Arco, Foro y Palatino por dentro, Plaza del Campidoglio, Piazza Venezia, Altar por dentro; al atardecer, el Panteón por dentro (parada normal, sin aviso de su última entrada) y Piazza Navona; cena: Da Baffetto (o Armando al Pantheon); noche: Fontana de Trevi y la Plaza de España. A «Si te sobra tiempo»: el Barrio Judío, la Fuente de las Tortugas, Largo di Torre Argentina, San Luigi dei Francesi y la Iglesia del Gesù. En invierno, de 12:00 a 12:59: lo mismo con la comida corta (45 min) para entrar al Coliseo y al Foro antes de su última entrada; de 13:00 a 13:59: la RUTA DEL CENTRO ENTERA, con la comida al llegar, y el D1 pasa entero al día 2 (fila «se corre un día», abajo) |
| de 14:00 a 14:59 | la comida al llegar y después lo mismo que de 15:00 a 18:59. El D1 pasa entero al día 2 |
| de 15:00 a 18:59 | LA RUTA DEL CENTRO A BUEN PASO, sin comida, todo por fuera, con sus propios minutos: Piazza Navona ~20, Panteón ~15 (por fuera, con su etiqueta), Fontana de Trevi ~20, Via Condotti de camino, Plaza de España ~20, Escalinata y Trinità dei Monti ~15 (unas 2 h con los paseos). El Pincio y el Popolo, a «Si te sobra tiempo». Cena por donde acabe (regla de la cena de la ruta del centro) y la nocturna que toque: no repite lo visto ese día (suele ser el Coliseo y el Foro desde el Campidoglio, en taxi de 15 min o menos). El D1 pasa entero al día 2 |
| de 19:00 a 20:29 | Navona y el Panteón por fuera, a buen paso; la cena; de noche, Fontana de Trevi y la Plaza de España. Desde la Plaza de España (punto 6b): la Plaza de España y la Trinità, el Panteón y Navona, la cena y de noche Trevi. El D1 pasa entero al día 2 |
| de 20:30 a 22:59 | la cena si está libre antes de las 22:00 (Armando al Pantheon o Da Baffetto) y Trevi de noche, con su texto. El D1 pasa entero al día 2 |
| a las 23:00 o más tarde | nada, con su texto. El D1 pasa entero al día 2 |

- «EL D1 PASA ENTERO AL DÍA 2» (desde las 14:00; en invierno, desde las 13:00): todo se corre un día y se cae el último día de ruta del viaje, que es el de menos importancia (en 3 noches, el D4: Villa Borghese; en 4, el de Roma del día 4…). Vuelve como «un día más» si el vuelo de vuelta lo permite (punto 9). Si el viajero reserva la Galería Borghese, su día vuelve solo (reserva grande).
- 6b. LA ZONA Y POR DÓNDE EMPIEZA: la zona solo decide por dónde empieza la RUTA DEL CENTRO (las filas desde las 14:00 y la de invierno de 13:00 a 13:59), no el D1 ni sus versiones, que van por la hora, el mes y la reserva del Coliseo. Empiezan en Navona: Centro, Prati, Trastevere, Monti y «Aún no lo sé» (Navona · Panteón · Trevi · Via Condotti · Plaza de España · Escalinata y Trinità · Pincio · Popolo). Empiezan en la Plaza de España: Plaza de España y TERMINI (cambiado: metro A directo a Spagna; la ruta acaba en Navona y vuelve en bus 40 o 64): Plaza de España · Escalinata y Trinità · Pincio · Popolo · de camino Via del Corso · Trevi · Panteón · Navona. Cámbialo en el documento («La «Llegada a Roma»» y la lista de zonas).
- La ruta del centro entera (la de invierno de 13:00 a 13:59) lleva estos minutos (escríbelos en «La «Llegada a Roma»», que hoy no los lleva): Piazza Navona ~45, Panteón por fuera ~30, Fontana de Trevi ~45, Via Condotti ~15, Plaza de España ~45, Escalinata y Trinità ~20, Pincio ~20, Popolo ~20; y del 8 de diciembre al 6 de enero, «Piazza Navona y su mercadillo navideño».
- La comida y la cena de la ruta del centro: se come donde esté la ruta, con el restaurante de esa zona, sin repetir en el viaje (Navona y el Panteón: Armando al Pantheon o Da Baffetto; el Tridente: Poldo e Gianna o Edy). La cena: si la ruta acaba en Trevi o antes, Armando o Da Baffetto; si llega a la Plaza de España o más allá, Il Gabriello o Poldo e Gianna. Desde la Plaza de España, al revés.
- Los textos de la llegada de noche: de 20:30 a 22:59, «{Llegada} a las {hora}. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»; desde las 23:00, «{Llegada} a las {hora}. Descansa, que mañana empezamos a tope.». {Llegada}: avión, «Aterrizas»; tren o autobús, «Llegas a {punto}»; barco, «Desembarcas». {hora} es la del viajero.
- La nocturna de la llegada cuenta para el viaje (no se repite otra noche) y solo como nocturna: lo visto solo de noche sigue siendo parada de día otro día.
- El día de llegada cumple las reglas de cierres de cualquier día, con el horario de su fecha.
- PARA TODOS LOS DESTINOS (ponlo en GUIA_NUEVOS_DESTINOS.md): los días de llegada se aceleran quitando tiempo de las visitas por dentro (por fuera y a buen paso, con sus propios minutos), salvo los sitios grandes, que llevan siempre su tiempo entero. Cada destino escribe sus versiones como Roma.

7. CON VUELOS Y FREE TOUR DE MAÑANA (10:00, 12:00, 15:00 o 17:00), viajes de 3 noches o más
El día 1 es el D3, con sus dos partes: la del Free Tour (Trevi sin gente, el desayuno, el Panteón y el tour) y la del Vaticano (los Museos, la Plaza, la Basílica, la Conciliazione, el Castillo por fuera y el Puente).
- El D3 entero, como sin vuelos, si está libre: antes de las 9:30 con el tour de las 10:00; antes de las 11:30 con el de las 12:00 (el Vaticano después de comer); antes de las 10:00 con el de las 15:00 o el de las 17:00 (el Vaticano por la mañana).
- Si no, pero está libre al menos 30 min antes del tour: el día 1 es solo la parte del Free Tour (la comida al llegar si toca, el tour a su hora, la cena y la noche). El día 2 es el D2 (el Vaticano y Trastevere) y el día 3 el D1 (la Roma antigua y el centro), no el D1-FT, para no repetir Trastevere. Todo se corre un día y se cae el último (en 3 noches, el D4); vuelve como «un día más» si el vuelo lo permite. Si el D2 cae en domingo o miércoles, se cambia con el D1 con la regla de cierres de siempre.
- Si está libre cuando el tour ya ha empezado: no se reorganiza nada. El Free Tour con su hora es una reserva del viajero: no se mueve, y sale el aviso de reservas contra el vuelo (punto 14): «Tu Free Tour es a las {hora} y aterrizas a las {hora}: no te da tiempo. Revisa tu reserva.» [Ver mi reserva]. Si el viajero cambia la hora del tour, el día se rehace solo.
- Con el Free Tour marcado SIN HORA, la app elige por dentro la primera que pille libre (los 30 min son el camino a la Plaza de España y los 15 min de la regla 4): libre antes de las 9:30, 10:00; de 9:30 a 11:29, 12:00; de 11:30 a 14:29, 15:00; de 14:30 a 16:29, 17:00; desde las 16:30, al día siguiente a las 10:00: el día 1 es la fila del punto 6 para su hora (sin el D1 detrás), el día 2 el D3 entero y el día 3 el D1-FT, como dice el documento; todo se corre un día y se cae el último. Solo si ni el día 2 ni el día 3 tienen una reserva grande; si no, el tour no se pone y la hoja del resumen lo dice. En un día de horas especiales, solo las de ese día. La hora elegida sale marcada en la hoja del Free Tour (es la hora de un tour que existe, no una hora calculada), nunca en un texto del día.
- Con el Free Tour de las 19:00 o de las 21:00: el viaje lleva los días de «Sin Free Tour» y el tour va en la noche del D1, como ahora; el día 1 sigue el punto 6 (si el D1 pasa al día 2, el tour va con él).
- Los días sin tour y los de horas especiales de `default_free_tour.disponibilidad` mandan también el día de llegada. `default_free_tour.disponibilidad.horas` todavía dice `["10:00","16:00"]`: que lea la lista única de `freeTourHoras.js`.
- Si el Free Tour y otra reserva se cruzan, el aviso «coinciden» de siempre.

8. CON VUELOS: LOS VIAJES DE 1 Y 2 NOCHES
No se escriben días nuevos: el día 1 usa las mismas versiones del punto 6, y lo que no cabe va a la mañana del día de vuelta (que elige la primera que no ha visto, punto 9) o, si tampoco cabe, a «Si te sobra tiempo» con el aviso «{sitio} lo tienes en «Si te sobra tiempo» del {día}: si reservas la entrada, te lo ponemos en el día.».
- 2 noches, libre antes de las 14:00 (en invierno, antes de las 13:00): día 1, el D1 en su versión (tranquila, rápida o de tarde); día 2, el D2 entero; la vuelta, por su tabla.
- 2 noches, libre desde las 14:00 (en invierno, desde las 13:00): día 1, la ruta del centro en su fila; día 2, la mañana del D1 (Coliseo, Arco, Foro y Palatino, Plaza del Campidoglio, Piazza Venezia, Altar), la comida del D1 (Nonna Betta o Giggetto, en el Gueto) y la tarde del Vaticano del D3 (taxi a la entrada de los Museos con turno de tarde, Plaza de San Pedro, Basílica por dentro, Via della Conciliazione, Castillo por fuera, Puente; cena en Prati: L'Arcangelo o Osteria dell'Angelo). Nunca la parte del centro del D1 (se repetiría). Escribe este día en el documento como «D1+Vaticano (2 noches con llegada tarde)». Si cae en domingo o miércoles, el Vaticano va a la mañana de la vuelta si cabe; si no, a «Si te sobra tiempo» con su aviso. La vuelta, la primera mañana que no ha visto.
- 2 noches con Free Tour de mañana: el punto 7, con el día 2 que toque; lo que no cabe, a la mañana de la vuelta.
- 1 noche, libre antes de las 10:00: el D0 entero, como sin vuelos. De 10:00 a 13:59: el D1 en su versión rápida o de tarde, y la mañana de la vuelta, el Vaticano si el vuelo lo permite. Desde las 14:00: la ruta del centro en su fila, la mañana de la vuelta el Vaticano si cabe, y el Coliseo a «Si te sobra tiempo» con su aviso.
- 1 día (D0) un miércoles con la versión sin Museos (por ejemplo, el 6 de enero en miércoles), también sin vuelos (respuesta a la P4 de la 6y10): no se escribe nada nuevo; va el D0 del miércoles que ya está en el documento (decidido el 12-oct: por la mañana el Panteón por dentro, Piazza Navona, el Puente y el Castillo por fuera; la comida en el Borgo; después de comer, la Plaza y la Basílica, y la tarde de siempre). Así la mañana nunca queda vacía.

9. EL DÍA DE VUELTA (con horas)
La hora de la tabla es la del vuelo (la que pone el viajero); por dentro se le resta el margen del punto. Con Fiumicino (los demás puntos, con su margen):

| Vuelo desde Fiumicino | El día de vuelta |
|---|---|
| de 0:00 a 4:59 | cuenta como la noche de antes: el último día de ruta con su cena y sin nocturna; el día de vuelta, solo el traslado |
| de 5:00 a 8:59 | solo el traslado; el día de antes, normal, con su noche |
| de 9:00 a 13:29 | solo el traslado |
| de 13:30 a 14:59 | una MAÑANA CORTA (abajo), sin comida |
| de 15:00 a 16:59 | la última mañana entera, sin comida: lo que su lista lleva después de la comida, a «Si te sobra tiempo» |
| de 17:00 a 22:59 | la última mañana con comida; después, «La tarde es tuya hasta que te vayas.» y [+ Añadir lugares] (como la excursión de medio día) |
| a las 23:00 o más tarde | un día más entero, sin cena ni noche: el día que se cayó al llegar (punto 6) si se cayó alguno; si no, el siguiente día escrito que el viaje no lleva; si no queda ninguno, la última mañana con comida y la tarde libre |

- LA ÚLTIMA MAÑANA es la primera de estas que no repita lo principal ya visto de día, tal como está escrita, con su versión de cierres:
  1. el Vaticano (D0-medio, de mañana), si no ha visto la Plaza de San Pedro; se salta el 25 de diciembre y el domingo de Pascua (la bendición del Papa);
  2. la Roma antigua (la mañana del D1), si no ha visto el Coliseo y el Foro;
  3. el Pincio y el Popolo (DT-medio, de mañana), si no los ha visto;
  4. el Aventino (DA-medio), si no lo ha visto;
  5. la Cúpula (la mañana del D6), si no la ha visto;
  6. si no queda ninguna, la hoja «Ya has visto lo mejor de Roma».
  Si su hora de empezar no está escrita (solo lo está la del DT-medio, a las 7:30), la de un día normal; apúntalo.
- LAS MAÑANAS CORTAS (vuelo de 13:30 a 14:59): unas pocas paradas cercanas, de 1 h 15 a 1 h 30 en total. Escríbelas en el documento tal cual:
  1. Vaticano corta: Plaza de San Pedro ~30 · Basílica de San Pedro, por dentro ~45 · Via della Conciliazione ~10. El miércoles (la audiencia), la siguiente de la lista.
  2. Roma antigua corta: Coliseo ~30 (por fuera, con su etiqueta de reserva: si lo reserva, manda su hora) · Arco de Constantino ~10 · Plaza del Campidoglio ~20 · El Foro Romano, desde la terraza del Campidoglio ~15.
  3. Pincio y Popolo corta: Plaza de España ~30 · Escalinata y Trinità dei Monti ~15 · Terraza del Pincio ~20 · Piazza del Popolo ~15.
  4. Aventino corta: Circo Máximo ~15 · Jardín de los Naranjos ~20 · Ojo de la Cerradura del Aventino ~15 · Pirámide Cestia ~10 (al lado del metro Piramide y del tren al aeropuerto).
  5. Cúpula corta: Cúpula de San Pedro ~1 h 15 (se sale por la Basílica) · Plaza de San Pedro ~10. El miércoles, la siguiente.
- Cada lista (las mañanas y las cortas) cumple las reglas de cierres. Comprueba en la prueba que cabe con la hora más temprana de su fila. Si una no cabe, no la recortes en el motor: a PREGUNTAS con la lista y lo que sobra.
- La maleta: cuando el día de vuelta lleva mañana, su primera línea es «Déjala en tu alojamiento (pregunta si te la guardan después de dejar la habitación) o en la consigna de Termini y recógela de camino.» (`_llegada.json`, `maleta`, sin nombres de empresas). En `ultima_tarde`, fuera «sal a la hora que te marcamos»: «Aprovecha la mañana sin prisas: deja la maleta en la consigna o en tu alojamiento y sal con margen.»
- EL DÍA DE VUELTA SIN PARADAS (solo el traslado; de pago), una tarjeta para que sepa por qué, en DÍAS y en HOY:
  - Título: «Hoy vuelves a casa»
  - Texto: «Tu vuelo sale de {punto} a las {hora}. Te recomendamos estar en el aeropuerto 2 horas antes, por eso hoy no te hemos puesto paradas: es el día de irte con calma.» (tren o autobús: «Tu tren sale de {punto} a las {hora}. Llega a la estación con tiempo, por eso hoy no te hemos puesto paradas.»; barco: «Tu barco sale de Civitavecchia a las {hora}. Mira en tu reserva a qué hora cierra el embarque; por eso hoy no te hemos puesto paradas.»)
  - Debajo: «Desde tu zona ({zona}): {su mejor opción de «Para tu zona», con el tiempo de cada tramo de `_llegada.json`}.» Nunca un tiempo total sumado. Con «Aún no lo sé», la mejor opción desde Termini. [Ver cómo ir] abre la ficha de vuelta.
  - «¿Crees que te da tiempo a ver algo? Aquí tienes los monumentos de Roma.» [Explorar monumentos], que abre EXPLORAR › Monumentos (con «Cerca de mí»).
  - Al final: «Esperamos que hayas disfrutado de Roma. ¡Nos vemos en tu próximo viaje!»
  - Con un vuelo de 0:00 a 4:59, la misma tarjeta al final del último día de ruta: «Tu vuelo sale esta noche, a las {hora}…».
- Una reserva pequeña el día de vuelta: su parada a su hora, dentro de la mañana; no se quita nada.
- Los avisos del último día de ruta, con una salida de madrugada, se comparan con la hora de salir de esa noche.

10. LAS RESERVAS GRANDES Y LOS VUELOS (Eric: solo el bloque)
- En un día de ruta de en medio: se cambian los dos días enteros, como siempre (todo o nada).
- El Coliseo reservado el día 1: el día 1 ya es el D1; manda la tabla de la hora del Coliseo del documento (y el Foro siempre con el Coliseo).
- Los Museos o la Galería reservados el día 1, libre antes de las 14:00 (en invierno, antes de las 13:00): ese día pasa a ser el día escrito entero de ese sitio, con la lista de la hora de la reserva, y el D1 va al día que tenía ese sitio (se cambian uno por otro). Si el viaje no lleva el día escrito de ese sitio (la Galería con 3 noches y la llegada tarde), va su bloque, como abajo.
- El día de llegada, libre desde las 14:00 (en invierno, desde las 13:00), o el día de vuelta: a ese medio día va solo el bloque de esa reserva, siempre entero y sin mirar si cabe:
  - Coliseo: el Coliseo a su hora, el Arco y el Foro y Palatino (antes o después según la tabla de la hora del Coliseo);
  - Museos: los Museos a su hora, la Plaza de San Pedro y la Basílica. El miércoles, la Plaza y la Basílica nunca antes de comer: después de la comida si la fila la lleva; si no, a «Si te sobra tiempo»;
  - Galería: la Galería a su hora y el parque de Villa Borghese.
  - El resto de su día escrito se queda en su día, en la versión sin esa visita: el del Coliseo empieza en el Campidoglio; el del Vaticano, con su versión sin Museos; el de Villa Borghese, con la del lunes. Nada se pierde y nada se repite.
  - En la llegada: el bloque a su hora y, de la ruta de su fila, lo que va antes en su orden y lo demás después (regla 4), sin zigzag.
  - Con una reserva, el día de vuelta tiene mañana aunque su fila diga «solo el traslado».
  - Dos reservas grandes en el mismo medio día: cada bloque a su hora; si se cruzan, el aviso «coinciden».
- Los sitios grandes y sus bloques, en los datos del destino (para todos los destinos), no en el código. Pasa también a los datos la regla del Coliseo que sigue escrita en `claseDeReserva` («con excursión de mañana, el Coliseo no cabe antes de las 16:30»): por ejemplo, `no_cabe_con_excursion_hasta: "16:30"`. Roma tiene que salir igual.
- Una reserva antes de estar libre (se compara con «libre», sin margen) o que acaba después de la hora de salir (su hora más lo que dura, de los datos): se queda en su sitio, el resto del día va por su fila, y sale el aviso del punto 14, que se queda en la campana.

11. LO QUE SE QUEDA FUERA Y «MÁS PARA TU DÍA»
- Lo que eligió o reservó el viajero nunca desaparece. Lo del pool o lo añadido a mano que no cabe va a «Si te sobra tiempo» de ese día (o a «No incluido», como ya hace el pool).
- Lo que la versión del día 1 deja fuera va a «Si te sobra tiempo» del día 1, en su orden; si el día 1 es de noche (desde las 20:30), al del día 2.
- Nunca restaurantes ni nocturnas en «Si te sobra tiempo».
- «MÁS PARA TU DÍA» EN HOY (de pago). En los días que salen en una versión recortada (las del punto 6 rápida y de tarde, la ruta del centro a buen paso, las mañanas cortas), junto a [Visto] y [No me da tiempo], un botón [+ Más visitas]. No depende de «Vas bien de tiempo»: lo pulsa el viajero. Abre una hoja:
  - Título: «Más para tu día». Texto: «Estas visitas son de la ruta completa de hoy. Si vas bien, añade las que quieras.»
  - La lista: las paradas escritas de ese día que la versión recortada dejó fuera, de la más importante a la menos (imprescindible, nivel 1, 2, 3) y, a igual nivel, la más cercana primero. Cada una con su foto pequeña, su tiempo de visita y [Añadir].
  - [Añadir] la mete en la ruta de hoy donde menos rodeo hace, sin quitar nada, con [Deshacer].
  - Solo en esos días y si queda alguna.

12. LA EXCURSIÓN Y LOS VUELOS
- Va en el día 4 de ruta, como sin vuelos, con el interruptor de siempre. Nunca cae en el día de llegada ni en el de vuelta. Si el día 1 se corre (punto 6), el interruptor sigue en el día 4.
- [Añadir en un día nuevo] (6y10, respuesta a la P5): el día nuevo va siempre ANTES del día de vuelta; la excursión nunca cae en el día de vuelta (con fechas, la vuelta pasa al día siguiente).
- Excursión reservada: no se toca nunca, y los demás días se quedan donde estaban.
- Excursión reservada el día de llegada: si sale antes de estar libre, el aviso del punto 14; si sale después, ese día lleva la excursión y la ruta del día 1 se coloca como con una reserva grande en otro día (lo que se quede sin día, a «Si te sobra tiempo» del día 2).
- Excursión reservada el día de vuelta (o el último día con una salida de madrugada) que vuelve después de la hora de salir: el aviso del punto 14, con [Ver mi reserva] · [Pasar este día a Roma]. No se cambia nada solo. Una de medio día (Ostia, Tívoli; vuelve a las 14:00): sin aviso si la hora de salir es a las 15:00 o más tarde.

13. LA FICHA DE LLEGADA Y VUELTA, Y «PARA TU ZONA»
- SIN VUELO PUESTO (y siempre en la gratis): el acordeón de llegada y el de vuelta como ahora (el blanco y azul con «+ Añadir vuelo»), con la información general de todos los puntos: la distancia, el transporte público con su precio y su tiempo y el traslado privado.
- CON EL VUELO PUESTO (de pago): la ficha del diseño docs\diseno\ficha_llegada\Ficha Llegada.dc.html (1a llegada a las 13:00, 1b llegada tarde a las 23:30, 1c vuelta a las 19:00), dentro de la ventana que ya existe (Resumen · Traslados · Tips), con el mapa pequeño de arriba (el punto, Termini si pasa por allí, y su zona). Los textos y el orden, como en el diseño y en este punto. SIN los botones [Comprar billete] del diseño: en el transporte público, solo su precio oficial de `_llegada.json`. Lo único que se vende aquí es el traslado privado, en frambuesa, como en el diseño.
- EL RESUMEN DE LA LLEGADA, de arriba abajo, solo con sus datos y los nuestros comprobados:
  1. «Aterrizas en {punto} a las {hora}.» (tren o autobús: «Llegas a {punto} a las {hora}.»; barco: «Desembarcas en Civitavecchia a las {hora}.») y debajo el dato real («32 km al centro de Roma.»).
  2. «Tu mejor opción»: la fila de su punto y su zona de la tabla de abajo, con el precio y el tiempo de cada tramo de `_llegada.json`.
  3. Si su mejor opción acaba en Termini: «Casi todo el transporte público llega a Termini, la estación principal. Desde allí, {lo de su zona}: es otro billete (1,50 €, vale 100 min).» Si no pasa por Termini (el FL1 a Trastevere), no sale.
  4. «Otras opciones»: las demás que sirven para su zona, con precio y tiempo. Solo las que sirven (a Trastevere desde Fiumicino no sale el Leonardo Express).
  5. El traslado privado: «Te esperan a la salida con tu nombre y te dejan en la puerta de tu alojamiento o donde tú quieras.», la etiqueta «Ideal si viajas en pareja, en familia o con amigos» y [Reservar traslado] (la pestaña Traslado de siempre). Sin precio y sin decir que es más barato.
  6. LA COMIDA AL LLEGAR (solo si la fila del día 1 la lleva): «Tu alojamiento está en la zona de {zona}. Te recomendamos comer algo antes de ponerte en marcha: aquí tienes los mejores restaurantes de Roma.» [Explorar restaurantes], que abre EXPLORAR › Restaurantes con «Recomendados» y «Cerca de mí». Con «Aún no lo sé», sin la primera frase. En el día, la parada «Comida, cerca de tu alojamiento», sin restaurante nuestro.
  7. «Tu ruta empieza en {primera parada del día 1}.» y [Cómo llegar a tu alojamiento] si hay dirección.
  - Con «Aún no lo sé»: sin los puntos 2 y 3 (las opciones hasta Termini, las de siempre), y arriba: «Cuando sepas dónde duermes, ponlo en RESERVAS y te diremos cómo llegar hasta tu puerta.»
- EL RESUMEN DE LA VUELTA, al revés: «Tu vuelo sale de {punto} a las {hora}. Te recomendamos estar en el aeropuerto 2 horas antes.» (tren o autobús: «Tu tren sale de {punto} a las {hora}.»; barco: «Tu barco sale de Civitavecchia a las {hora}. Mira en tu reserva a qué hora cierra el embarque.»); su mejor opción desde su zona, las demás que sirven, el traslado privado («Te recogen en la puerta de tu alojamiento o donde tú quieras y te dejan en el aeropuerto.»), la maleta y «Arrivederci, Roma.». Nunca «sal a las…».
- EL TAXI SE VA: fuera de la ficha, de «Para tu zona» y de los Tips. «El taxi de Ciampino sale más barato» se quita; «Nadie te lleva en coche desde la terminal» pasa a «Nadie te espera sin reserva: si alguien se te acerca en la terminal ofreciendo coche, di que no. Si has reservado el traslado, te esperan con un cartel con tu nombre.». En `_llegada.json` el taxi se queda en los datos, marcado para no enseñarlo.
- DE NOCHE Y A PRIMERA HORA: solo hay dato del Leonardo Express (desde el aeropuerto, el primero a las 5:38 y el último a las 23:23, del 14 de junio al 12 de diciembre de 2026). Guárdalo como tramo de fechas. Si aterriza demasiado tarde para el último (o antes del primero), «Tu mejor opción» es el traslado privado, con «A esta hora ya no hay tren: el último Leonardo Express sale del aeropuerto a las 23:23.» (diseño 1b). Debajo, «Otras opciones · solo lo que sigue funcionando»: solo lo que tenga su horario en `_llegada.json` y funcione a esa hora. Busca en las webs oficiales el último y el primer horario de cada autobús del aeropuerto, los autobuses nocturnos del aeropuerto a Roma y, desde Termini o Tiburtina, los nocturnos de la ciudad hasta cada zona (las líneas «n») (Eric: «así damos más valor»). Cada uno con su fuente y su fecha. Sin fuente oficial, no sale; si no queda ninguno, la sección no sale. A la vuelta, lo mismo para los vuelos de primera hora. Lo que no tenga dato (Ciampino, Tiburtina, Civitavecchia, fuera de ese tramo), al INFORME para que Eric lo dé. No lo inventes.
- Los textos con «centro»: fuera de nuestras frases («Cómo llegar al centro desde tu punto de entrada en Roma» → «Cómo llegar a tu alojamiento desde tu punto de llegada»). Se quedan los datos reales («32 km al centro»).
- Fuera los nombres de empresas de la ficha y de `_llegada.json`: «Autobús a Termini (Terravision)», «(Rome Airport Bus)», «Autobús ATRAL…», «KiPoint», «KiBag», «la app de Trenitalia». Queda el autobús con su andén, su precio y su tiempo; la consigna de Termini con su sitio, su horario y su precio; «la app oficial del tren». Las fuentes se quedan en los datos.

LA TABLA «PARA TU ZONA» (en el documento, sustituye a «Cómo llegar a tu zona», y en los datos, no en el código). La primera opción de cada celda es «Tu mejor opción»; las demás, debajo:

| Zona | Desde Fiumicino | Desde Ciampino | Desde Termini | Desde Tiburtina (tren o autobús) | Desde Civitavecchia |
|---|---|---|---|---|---|
| Termini | Leonardo Express · autobús a Termini | Airlink a Termini · autobús a Termini | ya estás: andando | metro B a Termini | tren regional a Termini |
| Monti | Leonardo Express y metro B a Cavour (1 parada) | Airlink a Termini y metro B a Cavour | metro B a Cavour | metro B directo a Cavour | tren regional a Termini y metro B a Cavour |
| Centro | Leonardo Express y bus 40 o 64 a Largo di Torre Argentina | Airlink a Termini y bus 40 o 64 | bus 40 o 64 a Largo di Torre Argentina | metro B a Termini y bus 40 o 64 | tren regional a Roma San Pietro y bus 64 a Largo di Torre Argentina · o a Termini y bus 40 o 64 |
| Plaza de España | Leonardo Express y metro A a Spagna | autobús al metro Anagnina y metro A directo a Spagna · Airlink a Termini y metro A | metro A a Spagna | metro B a Termini y metro A a Spagna | tren regional a Termini y metro A a Spagna |
| Prati | autobús directo a Via Crescenzio [VERIFICAR] · Leonardo Express y metro A a Ottaviano | autobús al metro Anagnina y metro A directo a Ottaviano · Airlink a Termini y metro A | metro A a Ottaviano | metro B a Termini y metro A a Ottaviano | tren regional a Roma San Pietro y andando (unos 20 min) |
| Trastevere | tren FL1 a Roma Trastevere y tranvía 8 | Airlink a Termini, bus 40 o 64 a Largo di Torre Argentina y tranvía 8 | bus 40 o 64 a Largo di Torre Argentina y tranvía 8 | tren FL1 directo a Roma Trastevere y tranvía 8 | tren regional a Roma Trastevere y tranvía 8 |

Notas (comprobadas por Claude el 13-oct-2026; pon la fuente y la fecha en `_llegada.json`):
- El tren regional de Civitavecchia para en Roma San Pietro, Roma Trastevere, Roma Ostiense y Roma Termini (por ejemplo, el regional 12539: Civitavecchia 11:42 → San Pietro 12:26 → Trastevere 12:31 → Ostiense 12:38 → Termini 12:48; e656.net/orario/treno/12539). Comprueba en la web de Trenitalia que paran así todos o casi todos; si alguno no, la nota «mira en tu billete que pare en Roma Trastevere».
- El FL1 para en Roma Trastevere, Ostiense y Tiburtina, no en Termini. De Fiumicino a Trastevere, unos 27 min.
- El autobús de Fiumicino a Via Crescenzio / Piazza Adriana (Prati): sale de la estación de autobuses de la T3, unos 40 min, desde 7 € (solo en webs no oficiales: omio.it e infoviajera.com, abril de 2026). [VERIFICAR] en la web oficial de la empresa; si no se puede, fuera de la tabla. Sin el nombre de la empresa.
- El tranvía 8: ATAC lo dio por restablecido entero el 21-sep-2026. Si sale otro corte, como aviso de fechas, sin cambiar la tabla.
- El autobús al metro Anagnina (Ciampino): 1,20 € + 1,50 € el metro; la línea A va directa a Spagna y Ottaviano.
- Los tiempos y los precios, solo los de `_llegada.json`. Donde no hay, sin tiempo.

14. LOS AVISOS Y LA HOJA DEL RESUMEN (los textos)
- La hoja de abajo es para lo que acaba de pasar; la campana, para lo que sigue mal (se queda hasta que se arregla y se va sola).
- Van a la campana: no llega a una reserva, una reserva después de salir, un sitio cerrado ese día (el que ya existe), la excursión que no cuadra y la vuelta que no cuadra con las fechas (punto 4).
- Al poner, cambiar o borrar los vuelos, el punto o la zona, una sola hoja del resumen con lo que ha cambiado. Por ejemplo:
  - «El mar 10 es tu llegada a Roma.»
  - Con la llegada de 0:00 a 4:59: «Aterrizas a las 0:30 del mar 10: ese día lo tienes entero, y esa noche ya necesitas alojamiento. Si aterrizas la noche del mar 10, cambia las fechas del viaje.» [Cambiar fechas] · [De acuerdo].
  - «Como llegas por la tarde, la Roma antigua pasa al mié 11.» (cuando el D1 se corre) y, si se cae un día: «Villa Borghese no cabe en tu viaje: si reservas la Galería, te ponemos su día.»
  - «El sáb 14 tienes una última mañana por Roma antes de irte al aeropuerto.» (o «a la estación», «al puerto»). Con un día más: «El sáb 14 tienes casi un día entero por Roma antes de irte.» Sin mañana: «El sáb 14 te vas pronto: ese día solo lleva el camino al aeropuerto.»
  - «Hemos puesto el Free Tour el mar 10, nada más llegar. Al reservarlo, elige la hora que te encaje.» con [Ver disponibilidad].
  - «El Coliseo lo tienes en «Si te sobra tiempo» del mar 10: si reservas la entrada, te lo ponemos en el día.»
  - «El jue 12 lo has cambiado tú: lo dejamos como está.»
  - Al borrar los vuelos: «Tus días vuelven a ser enteros. Tus reservas se quedan donde estaban.»
  - Termina con [De acuerdo], o con los botones que haya que elegir.
- Los avisos de reservas y vuelos (con [Ver mi reserva]; solo horas del viajero; las palabras cambian con el medio):
  - «Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.»
  - «Tu Free Tour es a las 10:00 y aterrizas a las 11:30: no te da tiempo. Revisa tu reserva.»
  - «Tu entrada a los Museos Vaticanos es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.»
  - «Aterrizas a las 9:00 y tu excursión a Pompeya sale a las 7:30: no llegas. Revisa tu reserva.»
  - «Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma a las 20:00: no te da tiempo. Revisa tu reserva de la excursión.» [Ver mi reserva] · [Pasar este día a Roma]. Si la reserva no tiene hora de vuelta, la frase sin esa hora.
- Ningún texto de esta tanda enseña una hora que calcule la app, ni el nombre de una empresa, ni «Día n» con fechas.

15. LO QUE SE VE: LA BARRA, EL TÍTULO, EL BILLETE Y HOY
- La barra de llegada y de vuelta: la de la 6t, sin cambios.
- El título del día, por grupos (invariante 614): el de sus grupos, grande, y «{origen} → Roma · Día de viaje» pequeño. Un día de llegada o de vuelta sin paradas se llama «Día de viaje», nunca «Día libre».
- EL BILLETE (de pago): del diseño docs\diseno\dia1_vuelo\Dia 1 Reservas.dc.html, SOLO la tarjeta del vuelo (Eric: el diseño parte de prototipos viejos; lo demás del acordeón se queda como está hoy). En el acordeón del día de llegada, la tarjeta del vuelo como un billete: «LLEGADA · VUELO {código}», [Reservado] en verde, la hora de salida y la de llegada con los códigos de los aeropuertos (BCN → FCO) y la línea con el avión; lo mismo en el día de vuelta con «VUELTA». Enseña lo que haya: sin las casillas opcionales del punto 4, solo el lado de Roma. En tren, autobús o barco, el mismo billete con su medio. Al tocarlo, la ficha de llegada o de vuelta.
- HOY (de pago):
  - el día de llegada, antes de la primera parada, la tarjeta «Llegada a {punto}» con el billete, que abre la ficha; después, [Cómo llegar a tu alojamiento] si hay dirección;
  - el día de vuelta, después de la última parada, «Llegada al aeropuerto de Fiumicino» (o «a la estación de Termini», «al puerto de Civitavecchia») con [Cómo llegar] (Google Maps) y, en pequeño, «Ver cómo ir», que abre la ficha de vuelta; sin paradas, la tarjeta «Hoy vuelves a casa» (punto 9);
  - [+ Más visitas] (punto 11);
  - al acabar cada día, [Cómo llegar a tu alojamiento] si hay dirección;
  - nunca «sal a las…»; [No me da tiempo] y [Deshacer], como siempre.
- La etiqueta «Cerrado este día» (respuesta a la duda de la parte MOTOR de la 6y10): la parada que se queda cerrada lleva en su tarjeta «Cerrado este día», no el «Hoy cierra» rojo.

16. «MOVER A OTRO DÍA» Y «CAMBIAR PARADA» (Eric, 13-oct)
- «MOVER A OTRO DÍA» del menú «···» de cada parada (y la hoja de HOY, que usa la misma lista `ListaDeDias`): del diseño docs\diseno\mover_parada\Mover Parada.dc.html SOLO la caja «Mover a» (lo demás de la pantalla, como está hoy), con nuestros datos: «MOVER A» con «Ahora: {día}», y cada día con su fecha en su cuadrado, su nombre y su título; los de excursión entera, con su icono. El día de vuelta no sale. Un día de excursión entera sale en gris con «Día de excursión» (no se mueven paradas a una excursión). Al tocar, la parada pasa a ese día, más o menos a su hora, sin quitar nada, con [Deshacer], como ahora.
- «CAMBIAR PARADA» del menú «···»: en lugar del buscador de ahora (`PlaceFinderPanel`), abre EXPLORAR con «Monumentos» y «Miradores» activos y arriba la pregunta «¿Por cuál quieres cambiar {parada}?». En este modo, el botón de la esquina de arriba a la derecha de cada tarjeta deja de ser el «+» y es el icono de intercambiar (⇄). Al tocarlo, ese sitio sustituye a la parada en su día y a su hora, con [Deshacer], y vuelve a DÍAS. Los sitios que ya están en el viaje salen con «Ya en tu viaje» y sin el icono. El viajero puede cambiar los filtros. Fuera de este modo, EXPLORAR sale como siempre, con su «+».

17. RESPUESTAS A LA 6Y10 (PREGUNTAS_TANDA6Y10 y las de los informes de cada parte)
- P1: el Coliseo y el Foro CIERRAN el 1 de enero (colosseo.it/orari, comprobado el 13-oct-2026: «Chiuso: 25 dicembre 2026, 1° gennaio 2027»). Quita el horario corto de «Año Nuevo» de `fechas_especiales` y su texto («El Coliseo y el Foro abren con horario corto…»), y arregla su auditoría.
- P2: la Galería Borghese, cerrada el lunes de Pascua. Bien así.
- P3 (Eric): fuera el «viernes noche» de los Museos (19:00–23:00), de la ficha, de los consejos y de los datos.
- P4 (Eric: sí): la mañana del D0 nunca vacía; un miércoles sin Museos, el D0 del miércoles ya escrito (punto 8).
- P5: el día nuevo de la excursión, antes del día de vuelta (punto 12).
- Los imprescindibles en el orden de los días: comprueba que pesan más que el resto del nivel 1 (Eric: primero los imprescindibles, luego el nivel 1, luego lo demás). Si en los datos de Roma todo el nivel 1 es imprescindible, apúntalo en el INFORME y déjalo.
- Audios: añade el «secreto» de la casa (una variable de entorno, `AUDIOS_SECRETO`, que entra en la huella), el mismo en el programa y en el servidor; apunta en el INFORME cómo ponerlo en Vercel, sin el valor. Los enlaces directos se quedan al lanzar (los que caducan, más adelante). El programa sigue avisando de los ficheros viejos sin borrarlos.
- Excursión: con el aviso de la vuelta del punto 4 basta; no se cambia una excursión de día entero por otra desde aquí; el gris vale para cualquier reserva ese día.
- Me gusta de partida (Eric, 13-oct): los seis primeros, con estas cifras fijas en `megusta_inicial` de `roma.json` (cada uno 15 o más por encima del siguiente, y el primero por encima de 400): 1) Coliseo 412; 2) Fontana de Trevi 391; 3) Museos Vaticanos y Capilla Sixtina 368; 4) Basílica de San Pedro 347; 5) Panteón 326; 6) Plaza de España 305. Todos los demás, por debajo de 290 y en un orden lógico de más a menos conocido (primero los imprescindibles: Piazza Navona, el Foro Romano y Palatino, la Plaza de San Pedro…; luego el nivel 1, el nivel 2…), dentro de sus rangos de siempre (imprescindibles y nivel 1 entre 100 y 199, nivel 2 entre 50 y 99, nivel 3 a 0; los restaurantes como están). Escribe la lista entera con su cifra en el INFORME para que Eric la vea. El caso raro sin nube, como está. Para otros destinos, ya se verá.
- Motor: el aviso «Llega unos 30 minutos antes» de los Museos a las 12:00 se queda. La invariante 593 de `INVARIANTES_PANTALLA.md` deja de ser cierta: cámbiala. Las frases de `GUIA_NUEVOS_DESTINOS.md` de la parte MOTOR (la comida nunca antes de las 12:00 y su excepción; `comida_rapida_desde` 12:00; `comida_rapida_excepcion`; los sitios que no se quitan como «Cerrado este día»): ponlas.
- Sitios grandes: el Free Tour de 10:00 sin día, con `destData.default_free_tour.name`, no el texto fijo «Free Tour por Roma».
- `pruebaTanda6g` daba 1 fallo (`etiqueta_roja`, en `DayList.tsx`): mira si sigue y arréglalo.

18. EL DOCUMENTO (DIAS_ROMA_PARADAS.md; luego `listasConvertir.mjs` con 0 dudas)
- Fuera «El orden nuevo de los días» del 8-oct: «Qué días lleva cada viaje», «El día de excursión» y «El orden de los días» de arriba se quedan como están (punto 2). En «Llegadas y vueltas», con lo de esta tanda.
- Fuera «Toda esta sección es de la Tanda 7. Hasta entonces…».
- Escribe, con sus nombres, las listas nuevas: las versiones del D1 del punto 6 (rápida y de tarde, con su variante de invierno), la ruta del centro a buen paso (desde Navona y desde la Plaza de España), «D1+Vaticano (2 noches con llegada tarde)» y las 5 mañanas cortas (punto 9). La versión tranquila es la «Por la tarde» del D1 que ya existe.
- «Las horas: libre y salir», «Lo que se ve en el día», «Los días reales», «La «Llegada a Roma»» y los textos de los avisos: con lo de esta tanda. Fuera la hoja «Ese día sales hacia el aeropuerto a las 12:00…», «SAL A LAS» y cualquier hora calculada.
- «Cómo llegar a tu zona» → la tabla «Para tu zona» del punto 13.
- «Ya lo visitaste el día 1» → «Ya lo visitaste el {día}», y la regla de los imprescindibles (nunca «de camino»).
- «Lo que no entra todavía»: fuera «Lo que sea gratis o de pago: se decide al final».
No toques nada más del documento. Si al pasarlo por el convertidor sale alguna duda, arréglala en el documento, no en el motor.

19. LA RUTA A MANO (la de la 6y)
- La app no mete nada sola ni reordena nada, tampoco por los vuelos: las horas solo ponen las barras, el billete, «Día de viaje» y los avisos de reservas contra el vuelo. Nunca recortan ni rehacen un día. Sin hoja del resumen. «Reorganizar este día» no mira el vuelo.

20. FUERA LO VIEJO
- La hoja «¿Ajustamos tu ruta a tu vuelo?» (`FlightAdjustSheet.tsx`), su llamada desde `ReservasPanel.tsx` y `LlegadaYVuelta.tsx` (`onGuardada`), y `src/lib/flightOpportunity.ts` (también lo usan un comentario de `stopScheduling.ts`, `types.ts` y `scripts/destino/_6z3_entrada.tsx`: cámbialos sin romperlos). El campo `flightAdjust` y `setFlightAdjust`.
- «Ajustar este día a tu llegada / a tu vuelta» de `DayDetailPanel.tsx`, su acción en `useRouteStore.ts` y `fitMealsToStops` de `arrivalReturn.ts`, si solo se usa ahí. El comentario «EN EL CENTRO» de `arrivalReturn.ts` y cualquier otro camino que rehaga el primer o el último día por la hora del vuelo.
- `PlaceFinderPanel` en «Cambiar parada» (punto 16); si no lo usa nadie más, fuera.
- Si algo de esto lo usa otra pantalla, no la rompas: dilo en el INFORME.

21. PARA LOS DESTINOS QUE VIENEN
- Las reglas de llegada y vuelta reciben la ciudad, la hora y el punto, y leen del destino sus tablas, sus listas, sus sitios grandes, sus bloques y su «Para tu zona». Nada de Roma escrito en el código.
- No cambies cómo se guarda el viaje: una llegada y una vuelta por viaje.
- En `GUIA_NUEVOS_DESTINOS.md`, «Llegadas y vueltas»: cómo se cuentan los días, las tablas por filas, las versiones del día 1 (por fuera y a buen paso, salvo los sitios grandes), la ruta del centro por inicio de zona, las mañanas de la vuelta y las cortas, el bloque de cada sitio grande, «Para tu zona» sin taxi y sin nombres de empresas, y el traslado privado.

22. LO QUE NO VA EN ESTA TANDA
- La escala de crucero (llegar y salir el mismo día por Civitavecchia): un viaje de una fecha, con sus barras.
- Los viajes de varios destinos.
- Las horas de la vuelta por zona: el margen para salir se cuenta siempre desde el centro (el del punto). Los textos sí usan su zona (su mejor opción desde su zona), pero el motor no cambia la hora de salir por la zona.
- HOY para todos y los logros: van en la Tanda 8 (PENDIENTES_RECOMPENSAS.md). No los toques.

23. LO QUE HA SALIDO EN LA REVISIÓN DE 20 VIAJES CON LA 6Y10 (docs\dias\VIAJES_REVISION.html)
- Viaje 5 (día 1, sáb 14 ago, D1) y Viaje 19 (día 1, lun 31 may, D1): «El día no cabe del todo: sobran 150 min y el motor no encuentra nada más que quitar». Viaje 11 (día 1, mié 21 oct, D1): sobran 60 min. Mira por qué y arréglalo con las reglas de siempre (lo de menos importancia a «Si te sobra tiempo»; los imprescindibles nunca se quitan).
- Viaje 3 y Viaje 13 (1 de enero): el texto de Año Nuevo dice que el Coliseo y el Foro abren con horario corto. Con la P1 (cierran), cambia el texto y el aviso.
- Lo demás de «Cosas a mirar» (las comidas hacia las 14:45 en el día de la Galería, el Free Tour el día 2 o 3 por cierres, el último día con imprescindibles) lo mira Eric: no lo toques.
- Añade los 20 viajes con vuelos (una llegada de cada fila del punto 6 y una vuelta de cada fila del punto 9) a la prueba de los 20 viajes.

PRUEBAS (regla de Eric)
- Esta tanda toca el motor: durante la tanda, la batería rápida y la muestra de unas 60 fechas (festivos, domingos, lunes, miércoles, Navidad, Semana Santa, agosto, el cambio de hora de marzo y de octubre), en paralelo. Con eso a 0 fallos, haz el push. Después del push, las 365 fechas completas (`_correr365.mjs`), con el resultado al final del INFORME en un commit aparte; si sale algún fallo, no arregles nada: apúntalo arriba de PREGUNTAS.
- Casos: de 1 a 7 noches (y la escala de una fecha), con fechas y sin fechas, en verano y en invierno; sin Free Tour, con el Free Tour sin hora y con cada una de sus 6 horas (también en sus días especiales); sin excursión, con la de la app, la elegida, la reservada y la de medio día; las 7 zonas y la zona sin tocar; con y sin dirección; gratis y de pago; nuestra ruta y la ruta a mano; medios mezclados.
  - Llegadas, para cada punto (y sin punto): las 0:00, las 4:59 y las 5:00, y las horas que dejan libre a las 9:59, 10:00, 11:59, 12:00, 12:59, 13:00, 13:59, 14:00, 14:59, 15:00, 18:59, 19:00, 20:29, 20:30, 21:59, 22:00, 22:59 y 23:00, más una que pasa de la medianoche.
  - Vueltas, para cada punto (y sin punto), con Fiumicino los vuelos de las 0:00, 4:59, 5:00, 8:59, 9:00, 13:29, 13:30, 14:59, 15:00, 16:59, 17:00, 22:59 y 23:00 (y su equivalente en los demás puntos).
  - El Coliseo, los Museos y la Galería reservados el día de llegada (antes y después de las 14:00), el día de vuelta (también con «solo el traslado» y un miércoles) y en un día de en medio. Dos reservas grandes el mismo medio día. Una reserva pequeña el día de llegada y el de vuelta.
  - Cambiar las fechas y añadir un día con la vuelta puesta.
- Hay que comprobar:
  1. Sin vuelos (y en la gratis), los días salen igual que antes de esta tanda (la misma salida que con el código de `origin/main` de antes, salvo los textos y la P1); el día de vuelta sin ruta, con su tarjeta en la gratis.
  2. Con vuelos, cada hora cae en su fila (los bordes) y cada fila lleva exactamente su lista escrita. Ninguna hora de 0:00 a 23:59 se queda sin fila, para ningún punto; la tabla de fronteras por punto, en el INFORME.
  3. Desde las 14:00 (en invierno, desde las 13:00), el D1 pasa al día 2, todo se corre un día y solo se cae el último día de ruta; vuelve como «un día más» con un vuelo de vuelta a las 23:00 o más tarde.
  4. Los imprescindibles: nunca se quitan; nunca «de camino»; el Coliseo siempre por dentro con su tiempo (salvo en la mañana corta, por fuera con su etiqueta).
  5. Comida nunca antes de las 12:00 ni después de las 15:00; solo en las filas que la llevan; la del día de vuelta, solo con vuelos a las 17:00 o más tarde (Fiumicino).
  6. La noche: 0 nocturnas repetidas; con 3 noches o más, ninguna nocturna es un sitio visto ese día; con una salida de madrugada, el día de antes sin nocturna y con cena.
  7. La última mañana nunca repite lo principal ya visto de día, y cada lista (también las cortas) cabe con la hora más temprana de su fila (si no, a PREGUNTAS).
  8. Las reservas: nunca desaparecen ni cambian de hora; en la llegada y el día de vuelta, su bloque entero, con el Foro siempre con el Coliseo; en los días de en medio, los dos días cambiados; los avisos salen cuando toca y se quedan en la campana.
  9. Nada elegido o reservado desaparece; lo que la llegada deja fuera está en «Si te sobra tiempo» y en «Más para tu día».
  10. El Free Tour: la hora del viajero manda; sin hora, la de la tabla y sin hora a la vista; los días sin tour y los de horas especiales se cumplen.
  11. La excursión: la reservada nunca se mueve; el interruptor nunca se bloquea; nunca cae en el día de llegada ni en el de vuelta; el día nuevo, antes del día de vuelta.
  12. La ruta a mano: las horas no cambian ningún día.
  13. Los títulos: el día de llegada o de vuelta sin paradas es «Día de viaje».
  14. Los textos de esta tanda (barras, hojas, avisos, ficha, billete, HOY, tarjetas): 0 horas calculadas, 0 tiempos totales sumados, 0 nombres de empresas, 0 «taxi», 0 «Día n» con fechas, y «centro» solo en datos reales.
  15. Lo de siempre: nada cerrado, sin zigzag, por dentro una sola vez, 0 restaurantes repetidos, «Cerrado este día» sin tiempo.
- A mano, a 375 px, de pago y gratis, con fechas y sin fechas: poner la llegada (con las casillas nuevas), la vuelta, la zona y la dirección en RESERVAS y ver la hoja del resumen; el billete en DÍAS; el día de llegada de cada fila (desde Navona y desde la Plaza de España); una llegada a las 21:00 con su cena y su texto; el día de vuelta de cada fila, con la mañana corta y «Hoy vuelves a casa»; la ficha de llegada a las 13:00 y a las 23:30, y la de vuelta; «Para tu zona» con Trastevere desde Fiumicino (sin Leonardo Express); un aviso de reserva que se queda en la campana; HOY el día de llegada y el de vuelta, con [+ Más visitas]; «Mover a otro día» con un día de excursión en gris; «Cambiar parada» con el ⇄; la gratis con la tarjeta «Tu último día también cuenta» y su candado; «5 días · 4 noches» y «¿Cuántas noches?».
- Capturas en docs/dias/img/7-*.jpg.

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 7 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
