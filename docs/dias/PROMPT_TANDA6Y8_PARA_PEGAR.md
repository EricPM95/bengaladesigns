Tanda 6y8 (después de la 6y7). La comida con una reserva a mediodía. Va todo en este archivo.

Antes de nada: Claude ha copiado en docs\dias PENDIENTES_6K.md y este prompt. Súbelos en el primer commit, sin tocarlos.

1. LA COMIDA CON UNA RESERVA A MEDIODÍA
Hoy, con los Museos reservados de 12:00 a 13:00, la ruta llega tarde (132 min con la de las 12:00): pone una comida normal antes, y la comida rápida de la configuración no la usa nadie. Arréglalo así, sin complicarlo (solo ponemos paradas; el viajero decide cuánto tarda en comer):
- Museos Vaticanos (unas 3 h) reservados de 12:00 a 13:00: la parada «Comida» va antes de los Museos, cerca del Vaticano. Por dentro, cuéntala corta para que la entrada nunca salga tarde.
- Coliseo (unas 1 h 30): con la entrada hasta las 13:00 incluida, la comida va después (hacia las 15:00). Con la entrada después de las 13:00, la comida va antes.
- Galería Borghese (2 h): con el turno de las 11:00, comida después; con el de las 13:00, comida antes.
- Esto no es solo de Roma (Eric): es una regla general, para todos los destinos, que sale de la duración de cada visita en los datos (no de los nombres de Roma):
  - LA COMIDA: si al salir de la reserva ya son más de las 14:30, la comida va antes; si sale a las 14:30 o antes, va después. (Coliseo de 13:00, sale 14:30: después. Vaticano de 12:00, sale 15:00: antes. Galería de 13:00, sale 15:00: antes.)
  - LA CENA, igual: si al salir de la reserva ya son más de las 21:00 (un Free Tour de noche, una visita nocturna), la cena va antes; si sale a las 21:00 o antes, va después. Y la cena nunca después de las 22:30, como siempre.
  - La duración de cada sitio con reserva tiene que estar en sus datos. Si a alguno le falta, dilo en el informe.
- Cambia en DIAS_ROMA_PARADAS.md la regla 4 y «Museos reservados a mediodía» para que digan esto, y añade la regla general a GUIA_NUEVOS_DESTINOS.md.
- Si la comida rápida de la configuración ya no hace falta, quítala.

PRUEBAS (regla nueva de Eric, para no esperar horas)
- Durante la tanda, NO pases las 365 fechas. Pasa la batería rápida y una muestra de unas 60 fechas: los festivos, varios domingos, lunes y miércoles, Navidad y Año Nuevo, Semana Santa y agosto. Todo en paralelo, con todos los núcleos del PC.
- Nueva: ninguna reserva sale tarde, a ninguna hora, con cada entrada con reserva y cada turno posible; y la comida y la cena van antes o después según el punto 1.
- Con eso a 0 fallos, haz el push.
- Después del push, lanza las 365 fechas completas y deja el resultado en INFORME_TANDA6Y8.md (añádelo al final y súbelo en un commit aparte). Si sale algún fallo, no arregles nada: apúntalo arriba de PREGUNTAS_TANDA6Y8.md para la siguiente tanda.

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y8 en docs/dias, en palabras sencillas, y commits locales. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
