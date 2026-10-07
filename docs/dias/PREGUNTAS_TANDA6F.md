# Preguntas y decisiones de la Tanda 6f

Lo que he decidido yo porque el documento no lo dice (o lo dice a medias). Cada punto dice qué hice y dónde cambiarlo si no te gusta. Nada está escondido: si algo se puede deshacer fácil, lo digo.

## Transporte público (4k)

1. **Falta la sección «Líneas de transporte público de Roma que usa la app» en `DIAS_ROMA_PARADAS.md`.** Mi `PARA_CODE_TANDA6F.md` la nombra, pero en el documento no está. Para no dejar el punto sin hacer, sembré las líneas que conozco de Roma en `shared/routeEngine/transitLines.js`: Metro A, Metro B, Tranvía 8, Bus 40 y Bus 23, con las coordenadas de sus paradas **aproximadas**. Hay que revisarlas y completarlas con las tuyas. Está hecho para que la lista sea un dato aparte: cuando tengas la sección, se cambia ahí y nada más.
2. **El ejemplo del punto 4k no sale con la regla.** «Trastevere → Coliseo de noche: Tranvía 8 hasta Piazza Venezia + 12 min andando» no se puede reproducir con «las dos paradas a 8 min andando o menos de una parada de la misma línea»: el Tranvía 8 va de Largo Argentina a Trastevere, no pasa por Piazza Venezia, y el Coliseo no queda a 8 min de ninguna parada suya. Con las líneas que tengo, de Trastevere al Coliseo no hay línea real y sale andando (si son 25 min o menos) o taxi. Si quieres que ese trayecto lleve línea, dime cuál (o dame las paradas) y la meto.
3. **Los minutos andando de la regla** son los que calcula Mapbox en la app; en el informe son una estimación (recta × 1,3 a 80 m/min). Por eso el informe de trayectos es una guía, no la medida exacta.
4. **«Transporte público» con línea dice** «Tranvía 8 · 15 min» (línea + minutos). La distancia no se enseña en esa opción.

## El Free Tour desde la app (5)

5. **Qué se rehace al añadir o quitar el Free Tour:** todos los días de ciudad que el viajero no ha cambiado a mano (los que tienen cambios suyos no se tocan: lo suyo manda). Se hace día a día con la misma llamada que ya usan las reservas, así que si falla alguno, los demás quedan hechos y la hoja avisa.
6. **Mañana, tarde o noche.** La mañana (10:00) es el Free Tour de siempre y rehace el viaje con D3 / D1-FT. Tarde (17:00) y noche (18:30) usan la hora que ya tenía el motor (el D1 lleva su versión con el tour a esa hora).
7. **Cuándo sale la opción:** solo en destinos con días escritos y con al menos dos días de ciudad. Con un solo día de ciudad no se ofrece (el viaje de 1 día nunca lleva Free Tour).
8. **En el formulario** se ha quitado el Free Tour entero (la tarjeta y la pregunta de la hora), no solo la pregunta. Si prefieres que la tarjeta se quede como «Recomendado» y solo desaparezca la hora, es un cambio pequeño en `StepExperiences.tsx`.
9. **«+ Añadir parada»:** el botón «Free Tour» está arriba a la derecha de las dos pantallas (la de Roma y la de los demás destinos). Al terminar, se cierra también la pantalla de añadir parada, porque el día que se estaba mirando ya no es el mismo.

## El orden de los días (4f)

10. **Qué cuenta como excepción.** El D1 y el D2 (o el D3 y el D1-FT) van en los dos primeros días completos salvo cuando el documento marca una mala fecha de ese día (`fechas_malas`: el Vaticano cerrado los domingos y miércoles, el 2 de junio y el 25 de diciembre para el Coliseo, un sitio cerrado). La prueba lo cuenta como «explicado» solo si encuentra uno de esos motivos; si no, es un fallo. Los casos explicados están en el informe.

## Fotos (2, 4j)

11. **Crédito de las fotos.** El campo `credito` (autor, licencia, enlace) está en todas las fotos, vacío. Las de `dia_via_conciliazione` y `dia_via_dei_fori_imperiali` esperan el autor y la licencia que me pasarás; no he inventado ninguno. Cuando lo tengan, la ficha enseña «Foto: autor · licencia» sola.
12. **Foto de la zona.** Si una parada no tiene foto propia, el servidor usa la de otro sitio de su misma zona (primero uno de nivel 1). Si la zona tampoco tiene, la tarjeta va sin recuadro de foto. La lista de las que salen sin foto propia está en el informe.
13. **Foto del Parque de Villa Borghese:** la del lago con el templo (`dia_villa_borghese_lago_templo.jpg`); la foto que tenía antes el parque ya no se le asigna.

## Horas y cortes (6)

14. **Cortes entre las horas escritas del Coliseo.** Para pasar de un tramo del documento al siguiente usé los cortes 10:16 – 11:15, 11:16 – 12:15, 12:16 – 15:15 y desde 15:16 (D1), y D0 desde las 14:16 sin tope, y los Museos de mediodía del D2 de 12:16 a 14:59. Son el punto medio entre dos horas escritas; si tu intención era otra, se cambian en `scripts/destino/listasVariantes.mjs` (`D1_TRAMOS`, `coliseo_14_30_15_30`, `museos_mediodia`).
15. **La Galería a las 9:00 sin Trevi** (D4): Trevi solo vuelve a la tarde cuando el viaje no tiene un D3 que ya lo lleve (`viaje_sin D3`).
16. **La comida hasta las 15:00** vale en días con una reserva (hora fija). En los demás días sigue siendo las 14:30. La prueba ya lo comprueba con ese mismo límite.
17. **La espera nunca hace llegar tarde a una reserva.** Si esperar a que abra un sitio (hasta 15 min, o hasta 40 si lo de antes es una plaza pegada) haría llegar tarde a una hora fija, ya no se espera: el sitio pasa a verse por fuera con su aviso «Abre a las…». Lo he arreglado en la causa (el motor de horarios), no en la prueba. Salió porque el Galería de las 15:00 llegaba 19 min tarde por esperar 29 a la Trinità dei Monti.
18. **Sitios con coordenadas aproximadas:** Via di Ripetta y el Lungotevere (nuevos «de camino» en `roma.json`): sin hora ni ficha, solo sirven para el trayecto. Corrígelas si las tienes.

## Pantalla (1, 4n, HOY)

19. **La línea de reserva de arriba** sale solo si hay una reserva puesta o el Free Tour añadido: «🕘 Entrada a las 9:00 · llega a las 8:30: …». El texto del Free Tour usa el punto «la Plaza de España» y la frase «Busca el paraguas o el cartel del tour» (`_destino.json`, `llegadas.free_tour`): cámbialos si el punto de encuentro es otro.
20. **La cuenta atrás de HOY** cuenta desde la hora de llegada (la de la línea de reserva), no desde la hora de la entrada.
21. **El hueco en el mapa de «+ Añadir parada»:** el tramo entre la parada de antes y la de después va más grueso y del color del día, y con un círculo blanco con «+» en medio. Si se añade al principio o al final del día, el «+» va pegado a la única parada vecina.
22. **«De camino»:** una tarjeta plegada que agrupa lo que se pasa de camino a la siguiente parada. El título es «De camino a {siguiente}» (la comida o la cena también cuentan como siguiente). Un «de camino» nunca repite una parada del día; y si es de otro día, dice «Ya lo visitaste el día {n}».
