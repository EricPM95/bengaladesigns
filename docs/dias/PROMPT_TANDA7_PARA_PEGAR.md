Empieza la Tanda 7: está en docs\dias\PARA_CODE_TANDA7.md. Léela entera y hazla toda, en el orden de los puntos.

Antes de empezar: docs\dias\DIAS_ROMA_PARADAS.md tiene la sección final «Llegadas y vueltas» reescrita entera. Pásalo por el convertidor y no lo toques. Mucho de lo que hace falta ya existe en la app (las horas de vuelo y los aeropuertos en RESERVAS, _llegada.json, la barra de llegada y de vuelta, la ventana de llegada, la campana de avisos y la hoja de la 6j): úsalo, no lo hagas de nuevo.

Resumen:
1. En RESERVAS: las horas de llegada y de salida que ya hay, y «¿En qué zona te alojas?» en el bloque del alojamiento (Centro, Plaza de España, Prati, Trastevere, Termini, Monti, Aún no lo sé = Centro), que decide por dónde empieza el día 1 y sirve para «Para tu zona». Nada en el formulario. Sin horas, días enteros como ahora. Al poner, cambiar o borrar una hora, el punto o la zona, los días se rehacen solos.
2. Las horas, solo de _llegada.json. Libre = llegada + al_centro_min + 30 min (no se enseña). Salir = leaveMinutesOf. Vuelos de madrugada y de primera hora, como dice la tanda. Nunca la palabra «centro» en un texto para el viajero.
3. La barra de llegada sin «EN EL CENTRO …».
4. El orden de los días, también sin vuelos (cambia para todos): en 3 días o más, el día 1 es el Centro (la «Llegada a Roma»: la ruta del centro histórico entera, igual para todos), los días 2 y 3 el D1 y el D2, el día 4 el interruptor y después D4, D5 y D6. Con vuelos, el viaje es el mismo y solo cambian el primer día (recortado por el tramo) y el último (la última mañana —3 h o más; comida solo si sale a las 14:30 o más tarde— o solo el traslado). Con un día entero, D1 + D0-medio, o D0.
5. La llegada: una sola ruta (el centro histórico), que empieza en Navona (en la Plaza de España si duerme allí), recortada por tramos con la tabla del documento (antes de las 13:00 / 13–14:30 / 14:30–17 / 17–20:30 / 20:30–23 / después de las 23:00), quitando primero el Pincio y el Popolo (los imprescindibles del centro se quedan, de día o de noche) y sin cuentas al minuto. La nocturna a 15 min andando o en taxi; de 20:30 a 23:00, Trevi de noche con su texto. Lo visto en la llegada cuenta como visto, salvo lo que se ve por dentro.
6. El Free Tour el día de llegada (con él, los días enteros son D1 y D2, sin D1-FT), y en «+ Añadir parada»: el primero de la lista, en su ficha [Añadir al Día n] y [Reservar Free Tour] con su enlace, y fuera FreeTourSheet. La hora, al reservar (con las 12:00).
7. La excursión y los vuelos: los casos con sus textos (si el día 4 pasa a ser el de vuelta: la que puso la app, pasa a Roma sola; la que eligió el viajero, se pregunta).
8. Las reservas y los vuelos: no llegas, después de salir, sitio cerrado. Una reserva grande en la última mañana o en el día de llegada: solo su bloque, y el resto de su día se queda en su día (o el día entero, si llega antes de las 13:00).
9. Los avisos: una sola hoja de abajo para toda la app; los que son un problema se quedan en la campana hasta que se arreglan; una sola hoja de resumen al cambiar vuelos, el punto o la zona.
10. Fuera lo viejo: «¿Ajustamos tu ruta a tu vuelo?», flightOpportunity.ts (sin romper PaceWandPrompt ni stopScheduling), FirstLastDayCard y flightAdjust, «Ajustar este día a tu llegada / vuelta» y «EN EL CENTRO».
11. «Para tu zona» arriba de la ventana de llegada, y fuera «centro» de sus textos.
12. preguntar_movilidad por destino (Roma: false), y las reglas de llegada y vuelta por ciudad.
13. Las pruebas, la página de simulación y la comprobación a mano del punto 13.

Cómo trabajar: lo de siempre (PROGRESO, PREGUNTAS e INFORME de la 7, commits locales por bloques). Añade .claude/ al .gitignore. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
