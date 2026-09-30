# Fechas especiales, más sencillas (1 de octubre de 2026)

Regla nueva: INVARIANTES 405. En las fechas especiales la app hace dos cosas: adapta la ruta a los horarios y lo cuenta en el aviso, y cuenta en la ficha lo que ya está en la ruta. Lo que se repite, sí; lo que pasa una vez al año, no.

## 1. Qué se ha quitado

- El concierto del Circo Máximo del 31 de diciembre (aviso y frase aparte).
- El concierto del 1 de mayo.
- Los fuegos de la Girandola del 29 de junio, con su noche en el Puente Sant'Angelo a las 21:30.
- El desfile del 2 de junio. Se queda el horario: el Coliseo y el Foro abren solo por la tarde.
- El 21 de abril entero (desfile y rayo de sol del Panteón): no cambiaba ningún horario.
- El Te Deum del 31. Se queda el horario: la Basílica cierra antes.
- La misa y el Ángelus del 1 de enero como frase aparte.
- **Todas las sugerencias con hora.** La bendición Urbi et Orbi del 25 de diciembre y la de Pascua ya no son una parada. El lugar «Bendición Urbi et Orbi» ya no existe en los datos.

Por quitar la bendición, tres días escritos cambian:
- **Roma Antigua el 25 de diciembre (con y sin Free Tour):** el día empieza a las 10:00 y el Barrio Judío pasa a la mañana.
- **Vaticano el 25 de diciembre, si no hay otro día para él:** empieza a las 11:30 por Borgo Pio; la Plaza y la Basílica van después de comer, con la plaza ya vacía.
- **Roma Antigua en Pascua:** la variante de Pascua se borra; el día es el normal.

## 2. Los grandes días religiosos

Solo como aviso al principio de la ruta: 24 y 25 de diciembre, 8 de diciembre, 6 de enero, Viernes Santo y Domingo de Pascua. «Navidad en Roma» (del 24 al 26) son ahora tres avisos: Nochebuena, Navidad y San Esteban.

**Si el día no cambia nada, el aviso sale igual** y lo dice: «Tu ruta de hoy no pasa por San Pedro: no te afecta.» Me parece más útil que callar: el viajero ve que lo hemos mirado.

Cada aviso elige su final según el viaje. Por ejemplo, el Viernes Santo dice «Hemos puesto el Coliseo por la mañana» solo si ese día el Coliseo va antes de las 13:00, y «Hemos puesto el Coliseo otro día» solo si va otro día.

**Lo del Papa de cada semana:**
- **Audiencia de los miércoles:** el aviso dice ahora «Los miércoles por la mañana el Papa recibe a los fieles en la plaza y la Basílica abre más tarde. Hemos puesto San Pedro por la tarde.»
- **Ángelus de los domingos:** línea en la ficha de la Plaza de San Pedro si la ruta está allí un domingo entre las 11:00 y las 13:00. No mueve nada. En la práctica sale poco: los domingos el día del Vaticano casi nunca cae.
- **Verano:** en 2026 el Papa estuvo en Castel Gandolfo del 5 al 27 de julio, sin audiencias hasta el 5 de agosto, y volvió allí del 15 al 17 de agosto. En esas fechas no salen ni el aviso de la audiencia ni la línea del Ángelus. La ruta no cambia (sigue la prudente). La fuente es de prensa (avvenire.it, infovaticana.com), no de vatican.va: marcado con `verificar`.

## 3. Horarios que se quedan

- **Viernes Santo:** el Coliseo y el Foro cierran a las 14:00, última entrada a las 13:00 (colosseo.it, 2024 y 2025). Horario nuevo en los datos, como «probable». Los días que acaban junto al Coliseo por la tarde y de noche se van a otro día si el viaje lo permite.
- El 2 de junio, el 24 y el 31 de diciembre y el 1 de enero: como estaban.
- El transporte recortado del festivo sale ahora como frase aparte del aviso («El 24 de diciembre el bus, el tranvía y el metro paran a las 21:00»). Antes ese texto no se enseñaba.

## 4. El 1 de enero después de Nochevieja

A las 10:00; si no cabe, el Campidoglio y el Altar de la Patria pasan a la tarde; si tampoco, a las 9:30.

- **Roma Antigua (viaje de 2 días, 31 dic-1 ene):** empieza a las 10:00. Comida a las 14:00, el Panteón a las 14:55, el Altar a las 17:25 y el Campidoglio ya de noche. No se quita nada, y por eso el día acaba tarde: cena a las 21:00.
- **Roma Antigua con Free Tour:** a las 9:30. A ninguna de las dos horas se salvaba el atardecer del Janículo con margen; he dejado que mande no madrugar. El paseo de tarde por Trastevere se queda sin sitio (va el de la noche). **Es el único caso nuevo de la prueba de las 365 fechas.**
- El día del Aventino: a las 10:00. El de las Termas de Caracalla: a las 9:30.

## 5. La nota navideña

Sale en lugar de la de invierno si algún día del viaje cae entre el 26 de noviembre y el 6 de enero (`temporada_navidad`, con fuente y `verificar`). Con el icono de Navidad y el rótulo «Navidad».

- Con el mercadillo abierto y Navona en la ruta (7-9 de diciembre): «¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las 16:45, también iluminado.»
- Antes del 8 de diciembre (27-29 de noviembre): «Roma ya se viste de Navidad: las calles estrenan luces. Hemos preparado tu ruta para que las veas, y como anochece sobre las 16:45, las disfrutarás de sobra.»
- 20-22 de noviembre: la nota de invierno de siempre.

He puesto los árboles desde el 8 de diciembre. Un viaje del 3 al 4 de diciembre lleva la nota de «solo luces» aunque el mercadillo ya esté abierto: promete de menos, nunca de más.

**No hay captura.** El panel del navegador sigue sin mostrarse y no puedo hacer capturas. Los textos de arriba son los que devuelve el motor; la pantalla no la he visto.

## 6. Pruebas

| Prueba | Antes | Ahora |
|---|---|---|
| 365 fechas | 44 | **36** (9 arreglados, 1 nuevo) |
| Navidad y Fin de Año | 0 (más 4 de Año Nuevo) | **0** |
| 56 viajes | 0 peor | **0 peor** (4 mejor, 52 igual) |

- Los 9 arreglados: 8 ratos libres de más de media hora en Pascua y Navidad (los dejaba la bendición) y un zigzag.
- El nuevo: el 1 de enero con Free Tour del punto 4.
- La prueba de Fin de Año cuenta ahora «antes de las 9:30», y también cualquier texto que hable de fuegos, conciertos o desfiles.
- La prueba de las 365 fechas tardó 6 min 17 s.

## 7. Para decidir

1. **El 1 de enero con Free Tour a las 9:30**, sin paseo de tarde por Trastevere. Si prefieres las 8:30 de antes para ese caso, se cambia.
2. **El 1 de enero de Roma Antigua acaba tarde** (cena a las 21:00) porque no se quita nada.
3. **El 25 de diciembre con el día del Vaticano** empieza a las 11:30.
4. **Los avisos de los festivos sin cierres** (25 de abril, 1 de noviembre) dicen «Es festivo en toda Italia y algunos sitios cambian de horario. Hemos comprobado los de tu ruta de hoy.» Si prefieres que no salgan, se quitan.

## 8. Todos los avisos, antes y después

**1 de enero · Año Nuevo**
- Antes: «Roma empieza el año con calma: muchos monumentos abren con horario corto. [texto completo: Hoy cierran los Museos Vaticanos, y el Coliseo y el Foro suelen abrir con horario corto (compruébalo en su web). Hemos puesto los Museos otro día y tus visitas dentro de ese horario.]» Y aparte: «En San Pedro, el Papa suele celebrar misa a las 10:00 y rezar el Ángelus a las 12:00 desde la ventana: la Basílica tiene tramos cerrados y a mediodía la plaza se llena (compruébalo en vatican.va).»
- Ahora: «El Coliseo y el Foro abren con horario corto y los Museos Vaticanos cierran.» Y según el viaje:
  - si el día empieza más tarde, si va otro día Museos Vaticanos: «Hemos empezado tu día más tarde y hemos puesto el Vaticano otro día.»
  - si el día empieza más tarde: «Hemos empezado tu día más tarde y tus visitas van dentro de ese horario.»
  - si va otro día Museos Vaticanos: «Hemos puesto el Vaticano otro día y tus visitas de hoy dentro de ese horario.»
  - si no: «Hemos puesto tus visitas de hoy dentro de ese horario.»

**6 de enero · Reyes (la Befana)**
- Antes: «Suele ser el último día del mercadillo navideño de Piazza Navona, con la fiesta de la Befana. [texto completo: Suele ser el último día del mercadillo navideño de Piazza Navona, con la fiesta de la Befana. Los Museos Vaticanos cierran: hemos puesto tu visita otro día.]»
- Ahora («6 de enero · Epifanía (la Befana)»): «Hay misa de la Epifanía en San Pedro y los Museos Vaticanos cierran; en Navona, la Befana y el último día del mercadillo.» Y según el viaje:
  - si va otro día Museos Vaticanos: «Hemos puesto el Vaticano otro día.»
  - si ese día pasas por Plaza de San Pedro / Basílica de San Pedro / Cúpula de San Pedro, desde las 12:30: «Hemos puesto San Pedro por la tarde.»
  - si ese día pasas por Plaza de San Pedro / Basílica de San Pedro / Cúpula de San Pedro: «Tu ruta pasa hoy por San Pedro: ve con tiempo.»
  - si no: «Tu ruta de hoy no pasa por San Pedro: no te afecta.»

**Viernes Santo · Via Crucis en el Coliseo**
- Antes: «Por la noche el Papa suele presidir el Via Crucis junto al Coliseo y la zona se corta por la tarde (compruébalo en vatican.va). Hemos puesto el Coliseo por la mañana.» Parada sugerida: Coliseo (noche).
- Ahora («Viernes Santo»): «Por la noche hay Via Crucis en el Coliseo y la zona se corta por la tarde.» Y según el viaje:
  - si ese día pasas por Coliseo / Foro Romano, antes de las 13:00: «Hemos puesto el Coliseo por la mañana.»
  - si va otro día Coliseo: «Hemos puesto el Coliseo otro día.»
  - si ese día pasas por Coliseo (noche) / Via dei Fori Imperiali: «Tu ruta pasa cerca por la tarde: ve con tiempo, habrá cortes.»
  - si no: «Tu ruta de hoy no pasa por el Coliseo: no te afecta.»

**Domingo de Pascua**
- Antes: «A las 12:00 el Papa suele dar la bendición Urbi et Orbi en la Plaza de San Pedro, con muchísima gente. Hemos dejado tu día preparado para que puedas ir si quieres.» Parada sugerida: Bendición Urbi et Orbi a las 11:30.
- Ahora: «A mediodía el Papa da la bendición en San Pedro y la plaza se llena de fieles.» Y según el viaje:
  - si va otro día Plaza de San Pedro / Basílica de San Pedro / Cúpula de San Pedro / Museos Vaticanos: «Hemos puesto tu visita al Vaticano otro día, para que la veas con calma.»
  - si ese día pasas por Plaza de San Pedro / Basílica de San Pedro, desde las 13:30: «Hemos puesto San Pedro por la tarde, cuando la plaza ya se ha vaciado.»
  - si ese día pasas por Plaza de San Pedro / Basílica de San Pedro: «Tu ruta pasa hoy por San Pedro: ve con tiempo.»
  - si no: «Tu ruta de hoy no pasa por San Pedro: no te afecta.»

**Lunes de Pascua (Pasquetta)**
- Antes: «Los romanos se van de pícnic a los parques. [texto completo: Los Museos Vaticanos cierran y los romanos se van de pícnic a los parques. Hemos movido el Vaticano a otro día de tu viaje.]»
- Ahora: «Es festivo y los Museos Vaticanos cierran.» Y según el viaje:
  - si va otro día Museos Vaticanos: «Hemos puesto el Vaticano otro día.»
  - si no: «Hemos comprobado los horarios de tu ruta de hoy.»

**21 de abril · Roma cumple años**
- Antes: «Roma cumple años: desfile de legionarios en el Circo Máximo y, a mediodía, el sol del óculo del Panteón cae sobre la puerta. Hemos dejado tu día listo para verlo hacia las 12:00.» Parada sugerida: Panteón a las 11:45.
- Ahora: **quitado entero** (no cambia ningún horario).

**25 de abril · Fiesta de la Liberación**
- Antes: «Fiesta de la Liberación: festivo nacional, con actos oficiales y mucha gente en el centro. Hemos revisado los horarios de hoy para que no choques con ningún cierre.»
- Ahora: «Es festivo en toda Italia y algunos sitios cambian de horario.» Y según el viaje:
  - si no: «Hemos comprobado los de tu ruta de hoy.»

**1 de mayo · Día del Trabajo**
- Antes: «Por la tarde suele haber un gran concierto en San Juan de Letrán. [texto completo: Los Museos Vaticanos y las Termas de Caracalla cierran, y por la tarde suele haber un gran concierto en San Juan de Letrán. Hemos puesto sus visitas otro día.]»
- Ahora: «Es festivo y cierran los Museos Vaticanos y algunos monumentos.» Y según el viaje:
  - si va otro día Museos Vaticanos: «Hemos puesto el Vaticano otro día.»
  - si no: «Hemos comprobado los horarios de tu ruta de hoy.»

**2 de junio · Fiesta de la República**
- Antes: «Hay desfile en Via dei Fori Imperiali. [texto completo: Hay desfile en Via dei Fori Imperiali y es posible que el Coliseo y el Foro no abran hasta la tarde (compruébalo en su web). Hemos puesto su visita otro día.]»
- Ahora: «Es festivo y el Coliseo y el Foro no abren hasta la tarde.» Y según el viaje:
  - si va otro día Coliseo: «Hemos puesto su visita otro día.»
  - si ese día pasas por Coliseo / Foro Romano: «Hemos puesto su visita dentro de ese horario.»
  - si no: «Tu ruta de hoy no pasa por ellos: no te afecta.»

**29 de junio · San Pedro y San Pablo**
- Antes: «Fiesta de los patronos de Roma: el Vaticano cierra y por la noche suele haber fuegos sobre el Castillo de Sant'Angelo, la Girandola. Hemos puesto tu noche en el Puente Sant'Angelo para verlos.» Parada sugerida: Puente Sant'Angelo (noche) a las 21:30.
- Ahora: «Es la fiesta de los patronos de Roma y los Museos Vaticanos cierran.» Y según el viaje:
  - si va otro día Museos Vaticanos: «Hemos puesto el Vaticano otro día.»
  - si no: «Hemos comprobado los horarios de tu ruta de hoy.»

**Ferragosto**
- Antes: «Los romanos se van a la playa y la ciudad está más tranquila que nunca. [texto completo: Los romanos se van a la playa y la ciudad está más tranquila que nunca; el Vaticano y algunos restaurantes cierran. Hemos ajustado tu ruta a lo que sí abre.]»
- Ahora: «El 15 de agosto es festivo: cierran los Museos Vaticanos y muchos comercios.» Y según el viaje:
  - si va otro día Museos Vaticanos: «Hemos puesto el Vaticano otro día y el resto de tu ruta, en lo que abre.»
  - si no: «Hemos ajustado tu ruta a lo que abre.»

**1 de noviembre · Todos los Santos**
- Antes: «Todos los Santos es festivo en toda Italia, con misas especiales y el centro animado. Hemos revisado los horarios de hoy para que no choques con ningún cierre.»
- Ahora: «Es festivo en toda Italia y algunos sitios cambian de horario.» Y según el viaje:
  - si no: «Hemos comprobado los de tu ruta de hoy.»

**8 de diciembre · La Inmaculada**
- Antes: «Por la tarde el Papa suele ir a la Plaza de España a honrar a la Virgen y la plaza se llena. [texto completo: Por la tarde el Papa suele ir a la Plaza de España a honrar a la Virgen y la plaza se llena. Los Museos Vaticanos cierran: hemos movido tu visita.]»
- Ahora: «Por la tarde el Papa va a la Plaza de España y se llena; los Museos Vaticanos cierran.» Y según el viaje:
  - (1) si ese día pasas por Plaza de España, antes de las 14:00: «Hemos puesto la Plaza de España por la mañana.»
  - (1) si va otro día Plaza de España: «Hemos puesto la Plaza de España otro día.»
  - (1) si ese día pasas por Plaza de España: «Tu ruta pasa por allí por la tarde: la verás llena.»
  - (2) si va otro día Museos Vaticanos: «El Vaticano va otro día.»

**Navidad en Roma**
- Antes: «Belenes en las iglesias, el árbol de San Pedro y el mercadillo de Navona; el 25 a las 12:00, bendición del Papa. Hemos colocado tu ruta para que no te pierdas nada.» Parada sugerida: Bendición Urbi et Orbi a las 11:30.
- Ahora («25 de diciembre · Navidad»): «A mediodía el Papa da la bendición en San Pedro y la plaza se llena de fieles; muchos monumentos cierran.» Y según el viaje:
  - si va otro día Plaza de San Pedro / Basílica de San Pedro / Cúpula de San Pedro / Museos Vaticanos: «Hemos puesto tu visita al Vaticano otro día, para que la veas con calma.»
  - si ese día pasas por Plaza de San Pedro / Basílica de San Pedro, desde las 13:30: «Hemos puesto San Pedro por la tarde, cuando la plaza ya se ha vaciado.»
  - si no: «Hemos ajustado tu ruta a lo que abre.»

**31 de diciembre · Nochevieja**
- Antes: «Roma despide el año en la calle, con un gran concierto en el Circo Máximo, y esta noche todo se llena. Hemos puesto tu cena en un barrio con ambiente: resérvala con tiempo.» Y aparte: «Después de cenar, si te apetece: el Concierto de Fin de Año del Circo Máximo suele empezar hacia las 21:00 y sigue hasta pasada la medianoche (compruébalo en turismoroma.it). Ve andando o en metro y vuelve en metro (línea B, Circo Massimo): esa noche los buses paran a las 21:00 y el metro sigue hasta las 2:30.»
- Ahora: «Los Museos Vaticanos y San Pedro cierran antes de lo normal.» Y según el viaje:
  - si ese día pasas por Basílica de San Pedro / Museos Vaticanos: «Hemos puesto tus visitas dentro de ese horario y tu noche, sin autobús.»
  - si no: «Hemos dejado tu noche sin autobús: a pie o en metro.»

**Primer domingo de mes · El Coliseo y los museos del Estado, gratis**
- Antes: «El primer domingo de mes la entrada al Coliseo y a los museos del Estado es gratis: habrá muchísima gente. Ese día no se reserva: las entradas se recogen en la taquilla por orden de llegada, así que ve temprano.»
- Ahora: igual (se repite cada mes o dura semanas).

**Mercadillo de Navidad en Piazza Navona**
- Antes: «Del 1 de diciembre al 6 de enero, Piazza Navona se llena con el mercadillo de Navidad. [texto completo: Del 1 de diciembre al 6 de enero suele haber mercadillo de Navidad en Piazza Navona, también el 25, hasta bien entrada la noche. Hemos puesto la plaza en tu ruta.]»
- Ahora: igual (se repite cada mes o dura semanas).

**24 de diciembre · Nochebuena** (nuevo: antes iban los tres días en «Navidad en Roma»)
- «Por la noche el Papa celebra la misa de Nochebuena en San Pedro: la Basílica y los Museos Vaticanos cierran antes.» Y según el viaje:
  - si ese día pasas por Plaza de San Pedro / Basílica de San Pedro / Cúpula de San Pedro / Museos Vaticanos: «Hemos puesto tus visitas dentro de ese horario.»
  - si va otro día Plaza de San Pedro / Basílica de San Pedro / Cúpula de San Pedro / Museos Vaticanos: «Hemos puesto el Vaticano otro día.»
  - si no: «Tu ruta de hoy no pasa por San Pedro: no te afecta.»

**26 de diciembre · San Esteban** (nuevo: antes iban los tres días en «Navidad en Roma»)
- «Es festivo y los Museos Vaticanos cierran.» Y según el viaje:
  - si va otro día Museos Vaticanos: «Hemos puesto el Vaticano otro día.»
  - si no: «Hemos comprobado los horarios de tu ruta de hoy.»
