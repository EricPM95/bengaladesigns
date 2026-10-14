# Preguntas de la Tanda 7

Como mucho cinco. Lo pequeño está decidido en `INFORME_TANDA7.md` («Decidido por Code») y en los informes de cada parte.

## Arriba: fallos de las 365 fechas (si los hay)

(Lo rellena el coordinador tras el push. Si no hay fallos, se queda vacío.)

## Las cinco

1. **Listas de la vuelta que no caben con la hora más temprana de su fila.** El motor no recorta nada por minutos (regla tuya), así que se quedan como están y la app solo avisa. Medido con el propio motor (peor caso, Fiumicino, el vuelo más temprano de cada fila):
   - **Mañanas cortas (vuelo de 13:30, hay 90 min):** Vaticano 93, Roma antigua 97 y Pincio-Popolo 97 min. Se pasan de 3 a 7 minutos (sobraría la Via della Conciliazione, el Foro desde la terraza del Campidoglio y la Piazza del Popolo). Si se cuentan solo los minutos de las paradas, caben (85, 75 y 80). El Aventino y la Cúpula caben.
   - **Mañana entera sin comida (vuelo de 15:00, hay 3 h):** se pasan el Vaticano (67 min), la Roma antigua (110), la Cúpula (75), el Pincio-Popolo (14) y el Aventino (18).
   - **Mañana con comida (vuelo de 17:00, hay 5 h):** se pasan la Roma antigua (57), el Vaticano (17) y la Cúpula (26).
   - **Mi propuesta:** las cortas se quedan como están (3 a 7 minutos no cambian lo que ve el viajero). En las enteras, que lo que cae después de la hora de salir pase a «Si te sobra tiempo» (el viajero decide), aunque sea cortar por minutos, que choca con tu regla de «sin cuentas al minuto»; si prefieres no cortar, hay que acortar a mano esas listas en el documento. Dime cuál de las dos.

2. **«Reorganizar este día» contra los Museos reservados.** Ya fallaba antes de esta tanda (`pruebaFase6y2_reorganizar`, 3 fallos, y `pruebaFase6y_reorganizar`, 4): «Reorganizar» reconoce los tres sitios como el día escrito `D1-vaticano` («D1+Vaticano, 2 noches con llegada tarde»), respeta su orden escrito y deja los Museos reservados a las 9:00 en la tarde. ¿Manda la hora de la reserva o el orden escrito del día? **Mi propuesta:** manda la reserva (la invariante 565 ya pone «lo reservado» en primer lugar); «Reorganizar» solo usaría el orden del día escrito para lo que no está reservado.

3. **El traslado privado de Roma no tiene enlaces de reserva.** Se quitaron el 9-oct hasta tener enlaces, así que [Reservar traslado] no sale, y de noche (cuando ya no hay tren) el traslado es «Tu mejor opción» y el viajero no puede reservarlo desde la app. ¿Pasas tú los enlaces directos antes de abrir de pago? **Mi propuesta:** sí, ponerlos antes de abrir; mientras tanto la tarjeta del traslado sale sin botón, como ahora.

4. **Los destinos que no son de Roma (los que hace Claude) no tienen día de vuelta aparte.** Siguen con tantos días de ruta como días del viaje: un «5 días · 4 noches» tiene 5 días de ruta y la llegada y la vuelta con horas no actúan allí (no hay tablas escritas). El texto «5 días · 4 noches» sale igual. ¿Se dejan así hasta que cada destino tenga sus días escritos, o quieres el mismo reparto (4 de ruta + vuelta) también en ellos? **Mi propuesta:** dejarlos, porque sin tablas escritas el día de vuelta saldría vacío.

5. **Los horarios que faltan para que «Para tu zona» funcione de noche.** Solo hay dato oficial del Leonardo Express (del 14-jun al 12-dic de 2026) y del autobús del andén 19. Faltan los de Ciampino, Tiburtina, Civitavecchia, FL1, metro, bus 40/64, tranvía 8, los nocturnos y el Leonardo de invierno (desde el 13-dic-2026), y el Leonardo da 23:23 en el PDF con fechas y 23:27 en la página general. ¿Abrimos de pago con esto (fuera de ese tramo nunca hay «modo noche»: sale la regla normal), o esperas a tener los horarios? **Mi propuesta:** abrir ya; tú me pasas los horarios de invierno antes del 13-dic y el resto cuando los tengas (la lista completa está en `INFORME_TANDA7.md`). Uso 23:23 (el que lleva fechas).

Las demás dudas, cada una con su propuesta, están al final de cada informe de parte (`INFORME_PARTE_*_TANDA7.md`): por ejemplo, los Museos reservados con la llegada tarde (se repiten la Plaza y la Basílica), el Free Tour de las 19:00 con la llegada tranquila, el Coliseo reservado en un día de en medio con una llegada rápida, la comida a medianoche con dos horas fijas, «Cerrado este día» en rojo o en gris, el chip «Atracciones» o «Monumentos», «Tu autobús sale…», la cabecera de RUTA sin días, el título de la hoja del resumen y las preguntas del reparto por noches.

## Respuestas de Eric (14-oct)

Solo se apuntan; no se toca código. Lo que haya que cambiar llega en la próxima tanda.

1. **Las mañanas de la vuelta que no caben con el vuelo más temprano de su fila.**
   - Las mañanas cortas (vuelo de 13:30) se quedan como están: de 3 a 7 minutos no cambian lo que ve el viajero.
   - Las mañanas enteras (vuelos de 15:00 y de 17:00) no se cortan por minutos, por la regla de «sin cuentas al minuto». Claude va a escribir a mano listas más cortas para esas filas en `DIAS_ROMA_PARADAS.md`, y llegarán en la próxima tanda.
   - Mientras tanto, nada cambia.
2. **«Reorganizar este día» con los Museos reservados.** Manda la reserva. El arreglo que ya se hizo (las listas de llegada y vuelta marcadas y saltadas por «Reorganizar») vale. **Resuelta.**
3. **El traslado privado sin enlaces.** Eric pasará los enlaces antes de abrir la versión de pago. Hasta entonces, la tarjeta del traslado sale sin botón, como ahora.
4. **Los destinos que no son de Roma.** Se dejan como están (tantos días de ruta como días del viaje, sin día de vuelta aparte) hasta que cada destino tenga sus días escritos.
5. **Los horarios de transporte que faltan.** Se abre la versión de pago con lo que hay. Fuera del tramo con dato, sin «modo noche», con la regla normal. Se usa 23:23 para el Leonardo Express, el que lleva fechas. Claude está buscando los horarios que faltan (Ciampino, Tiburtina, Civitavecchia, FL1, metro, bus 40/64, tranvía 8, nocturnos y el Leonardo de invierno desde el 13-dic) y llegarán en la próxima tanda.
