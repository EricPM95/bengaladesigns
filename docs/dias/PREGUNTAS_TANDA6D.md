# Preguntas de la Tanda 6d

Lo que he decidido yo. Se cambia con un dato (`data/dias/roma/_destino.json › franjas`, `listasVariantes.mjs`, `listasNombres.json`) salvo lo que diga lo contrario.

## Reservas a otra hora (ya escritas)

1. **Dónde corta cada franja.** El documento da rangos con huecos (D1: «10:30–12:00», «12:30–15:00», «16:00 o más»). Como corte he usado el punto medio: hasta las 10:15 es el día normal; de 10:16 a 12:15, media mañana; de 12:16 a 15:30, mediodía; desde las 15:31, tarde. En el D2, los Museos «a las 15:00 o más tarde» son la lista de tarde; entre las 9:00 y las 14:59 siguen con la regla general (la 4).
2. **El Foro tiene dos lados.** Para las listas escritas he dado al Foro un lado de entrada y otro de salida por parada: en media mañana se entra por el lado del Arco y se sale junto al Arco; en mediodía y en tarde se entra por Via dei Fori Imperiali y se sale junto al Arco (como dice el documento). Son las coordenadas aproximadas que ya usaba (el lado del Coliseo 41,8895 · 12,4890 y el de Via dei Fori Imperiali 41,8938 · 12,4857).
3. **Lo que no cabe, se acorta antes de quitar, también al llegar a una hora fija.** Con el Coliseo a las 16:00 (la lista de tarde es larga) primero lo de menos pasa de por dentro a por fuera y de por fuera a de camino, y solo después se quita algo a «Si te sobra tiempo»; y después, la comida más corta. Solo cuenta un acortamiento si de verdad adelanta la llegada (no se acorta algo cuando después hay que esperar a una hora). El Foro, en esa versión de las 16:00, acaba de camino y el Altar por fuera ~30.
4. **La comida escrita justo antes de la hora fija se queda antes** (la de Monti con el Coliseo a mediodía): si 60 min no caben va de 45 o 30.
5. **«Si te sobra tiempo» escrito.** Lo que el documento deja ahí en una versión del día (el Barrio Judío y las iglesias con el Coliseo a mediodía; la Isla Tiberina, Santa Maria in Trastevere y el Janículo con los Museos por la tarde) sale en «Si te sobra tiempo» con el motivo «Para otro momento».
6. **El miércoles del D2 sin Museos:** la Basílica va sin las Grutas (~1 h 15, como en el día normal) para que la comida no pase de las 14:30. Entre el Lungotevere (hacia las 10:50) y la Plaza «desde las 12:30» quedan 1 h 40 sin nada: no lo he rellenado porque el documento lo deja así.
7. **El Lungotevere es un sitio nuevo** en `roma.json` (de camino, nivel 3, junto al Puente Sant'Angelo). **Las coordenadas (41,9027 · 12,4655) son aproximadas.**
8. **Comida en Prati (L'Arcangelo o Osteria dell'Angelo).** En los datos, L'Arcangelo solo abre a la cena (lo dejaste anotado: «solo cenas») y Osteria dell'Angelo estaba como «cena» (sin saber si abre a mediodía). Como el documento las pone a la comida, he pasado **Osteria dell'Angelo a «ambos»**; L'Arcangelo se queda como cena, así que a la comida va Osteria. Si L'Arcangelo sí abre a mediodía, dímelo.
9. **Roma en un día (D0) con el Coliseo a las 13:00–15:30 llega tarde** (de 150 a 200 min). No hay lista escrita para ese caso (la lista escrita es del D1) y todo lo que va antes en el día de 1 día es imprescindible la primera vez, así que no hay nada que quitar sin romper la regla. Lo he apuntado como segundo caso conocido (junto al Free Tour + Museos a las 14:00) y la prueba lo deja como información, no como fallo. **Decisión tuya:** o se escribe una lista para ese caso, o se permite que una reserva mande sobre un imprescindible la primera vez en un viaje de 1 día.
10. **La alternativa de lluvia no se aplica si rompe una comprobación** en esa versión del día (el D1 con el Coliseo a mediodía: los Capitolinos después del Campidoglio hacían volver sobre los pasos). Antes la prueba lo daba como fallo; ahora esa parte de la alternativa se salta.

## Espera

11. **Espera de 15 min en general y de hasta 40 si lo de antes es una plaza o un sitio al aire libre justo al lado** (a 5 min andando o menos): la Piazza del Popolo antes de Santa Maria del Popolo (abre a las 16:00). Más de eso: por fuera, con su aviso.
12. **Aviso de HOY al llegar antes:** «Santa Maria del Popolo (los Caravaggio) abre en 20 min. Mientras, haz unas fotos en la Piazza del Popolo». El texto sale del campo nuevo `texto_espera` del sitio de antes (solo lo tiene la Piazza del Popolo); si no lo tiene, «Mientras, aprovecha {la parada de antes}». Sale en la tarjeta de la parada y en «A continuación». Cambia con el punto 3 de tu tanda, que ponía 20 min.

## Sugerencias de «Vas bien de tiempo»

13. **No se sugiere nada que ya salga en el viaje** (de ningún día, ni de camino) **ni en la noche de ese mismo día** (Trevi, Plaza de España, el Foro de noche…, y lo que choca con esa nocturna). Ya no existe «Lo tienes el día n».
14. **Antes de comer, solo lo cercano a donde empieza la tarde** (10 min andando o menos de la primera parada de la tarde, además de cerca de donde está). **Excepción:** lo que el documento sugiere para ese día antes de comer (la Columna y los Mercados de Trajano en el D1, que la tarde empieza en el Barrio Judío a ~12 min).
15. **Lo lejano, solo antes de cenar** (90 min o más de sobra).
16. **Si se cambia la cena de zona, la noche sigue cerca:** se mira si la nocturna del día queda a 15 min en taxi o menos de la nueva cena; si no, va la nocturna más cercana a la nueva cena que no haya salido, y la sugerencia lo dice («Y cenas en Coliseo / Celio y después, el Foro Romano desde el Campidoglio, de noche»). Al pulsar «Añadir» se cambia también la nocturna del día.
17. **El hueco antes de una entrada:** si lo siguiente es la «Llegada a…» de una reserva y sobran más de 30 min, HOY dice «Tienes {n} min antes de tu entrada» y propone algo a 10 min o menos de donde está y de la entrada (en el D1 con el Coliseo a las 12:00, la primera es San Pietro in Vincoli). Es un estado nuevo del servidor (`hueco`).
18. **Coming Out es un pub**, no un sitio para cenar: ahora es `tipo_local` «pub» y `meal` «copa». Ya no sale como cena ni como comida.

## Pruebas

19. **Pruebas nuevas:** `pruebaSugerencias.mjs` (nada que ya salga, nunca «Lo tienes», lo lejano solo antes de cenar, la noche cerca, solo sitios conocidos), y en la prueba grande: más horas de reserva (Coliseo 11:00, 14:00 y 18:00; Museos 9:00, 11:00, 16:00 y 17:30), «aviso contradictorio», «quitar sin acortar» y «relleno desconocido». La excepción del D2 en miércoles ya no existe.
20. **El ajuste aparte de la Piazza del Popolo** (respuesta 4): quitado; el documento ya dice ~30.
21. **Tercer caso conocido de «llega tarde a la reserva»:** un viaje con una excursión de medio día (la ciudad empieza a las 16:00) y el Coliseo reservado a las 16:00. La lista escrita de tarde (Campidoglio, Altar, Foro, Arco) no cabe antes de la hora si el día empieza a esa misma hora. La prueba lo deja como información. Es un día muy raro; si quieres que haga otra cosa (p. ej. empezar con el Coliseo y dejar lo demás después), dímelo.
22. **Restaurante repetido sin recambio:** sale como información (no fallo) en el D7 de «Prefiero quedarme en Roma» con Da Enzo al 29 (ya salió en el D2 cuando la cena cae en Trastevere y Tonnarello no vale). Es el mismo caso de siempre, repetido en más viajes de la prueba porque ahora hay más horas de reserva.
