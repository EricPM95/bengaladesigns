# Preguntas abiertas de la Tanda 6y7

Las de cada parte, con más detalle, están en `INFORME_PARTE_MOTOR_TANDA6Y7.md`, `INFORME_PARTE_PANTALLAS_TANDA6Y7.md`, `INFORME_PARTE_TITULOS_TANDA6Y7.md` e `INFORME_PARTE_DATOS_TANDA6Y7.md`. Los 12 datos de las fichas que no se pudieron confirmar están en `PREGUNTAS_TANDA6Y7_PARTE_DATOS.md`.

## FALLO PARA LA SIGUIENTE TANDA (pedido por Eric: no se toca en esta)
**Los Museos reservados de 12:00 a 13:00 llegan tarde, cualquier día (no solo los miércoles).** Comprobado un jueves: con la reserva de las 12:00 la fila sale 132 minutos tarde. El motor de listas no hace la «comida rápida»: `comida_rapida_*` está en la configuración de `listasTrip.js` pero ningún código la usa, y la comida no empieza antes de las 12:30. En un miércoles con esas horas, el resto de la tarde se desplaza por lo mismo.

## Vaticano en miércoles
1. ~~Museos desde las 16:00 un miércoles~~ — respondida por Eric: vale (la Plaza y la Basílica después de comer y antes de los Museos).
2. **Qué pasa a «Si te sobra tiempo»:** solo dijiste que con los Museos por la mañana pasan San Pietro in Montorio y la Fontana dell'Acqua Paola. Con los Museos a mediodía o por la tarde decidí yo qué se descarta de Trastevere: a las 12:30 y 13:00, Montorio y la Fontana; desde las 13:30, la Isla Tiberina, Santa Maria, Montorio, la Fontana y el Janículo (queda el paseo). ¿Prefieres otra cosa?
3. La mañana del miércoles con los Museos a mediodía o por la tarde empieza a las 8:00 («Trevi sin gente»). Con los Museos a las 15:00 queda un hueco de más de una hora entre la comida y los Museos.
4. **El día de 1 día y la última mañana en miércoles:** no toqué el D0 (1 día) ni el D0-medio: su miércoles lleva la Plaza después de las 12:00, no después de comer. Estaban fuera del encargo («el día del Vaticano entero»). ¿Misma regla ahí?
5. El fallo de los Museos de 12:00 a 13:00 está arriba, para la siguiente tanda.

## Pantallas
6. ~~La pantalla vieja «Creando tu ruta» en el enlace compartido y al retomar una generación~~ — respondida por Eric: quitada también ahí; ahora sale el fondo de la app con «Preparando tu viaje…» y una barrita.
7. Con un rehacer en marcha, un segundo cambio de fechas se ignora para no pisarlo. ¿Prefieres que se encole o que cancele el primero?
8. Si el viajero acorta a 1 día, la selección de destinos no curados (`selected_place_ids`) no se recorta. Ya era así y no lo toqué.

## Títulos de los días
9. **Ruta a mano:** el botón gris «Ponle nombre» del día vacío se sustituye por el título («Día libre»). El nombre propio se cambia desde «···» → «Cambiar el nombre». ¿Bien?
10. **Sitios dudosos que puse donde menos chirría:** Ara Pacis y Ponte Sisto en «Centro histórico»; Termas de Caracalla, Via Appia Antica y Catacumbas en «Roma antigua»; Cúpula de San Pedro en «Vaticano»; San Pietro in Montorio y Tempietto en «Trastevere» (los miradores de al lado, «Roma desde las alturas»); Coppedè y el paseo por el Nomentano en «Villa Borghese»; Testaccio (Pirámide, mercado, cementerio, paseos) y Santa Maria della Vittoria en «Basílicas y el Aventino». «Santa Sabina», que nombraste, no existe en `roma.json`, así que no tiene fila. La tabla completa parada → grupo está en `INFORME_PARTE_TITULOS_TANDA6Y7.md`.
11. Las nocturnas cuentan como parada de su grupo. ¿Prefieres que no cuenten?
12. El medio día de excursión da «Excursión desde Roma y Centro histórico». ¿Bien?
13. El día de vuelta sintético (viajes de varias ciudades) sin paradas sale «Día libre» + «Roma → Madrid», como pide el punto 6. Suena raro; ¿otro texto?
14. Los títulos de Roma casi siempre llevan dos nombres porque los días escritos mezclan zonas. ¿Subimos a 3 el mínimo de paradas del segundo grupo?

## Datos de las fichas
15. Hay 12 datos que no pude confirmar con una fuente fiable (el rayo del 21 de abril del Panteón, el obelisco de San Pedro, el agua de Navona, Mussolini en Torre Argentina, las cuadrigas de 50 toneladas, Beatrice Cenci, la tumba de San Pedro, el Cavalier d'Arpino, Piranesi, el nombre de la Piazza del Popolo, Santa Maria in Trastevere y la sangre de toro en el Mitreo): están sin tocar, con el detalle en `PREGUNTAS_TANDA6Y7_PARTE_DATOS.md`.
16. **Superlativos en textos tuyos:** no toqué los textos de los días escritos de `roma.json` ni `docs/roma_por_que.json` («La fuente más famosa del mundo» de Trevi, «La escalinata más famosa del mundo», «La mejor colección de Bernini del mundo»…) porque son tuyos. ¿Los suavizo igual?

## Pruebas antiguas que ya fallaban
17. `pruebaFranjas6x` (4 fallos: «ya no sale la hora de la reserva del viajero (16:40)») y `pruebaDiasFecha6z3` (3 fallos: la misma hora y una plantilla `el día ${…}` en `src/lib/reservaFueraDeDia.ts:43`) ya fallaban ANTES de esta tanda (el agente de los títulos lo comprobó en una copia limpia del commit anterior). No están en la batería de siempre y no he tocado nada de lo suyo. Hay que actualizarlas o arreglar lo que miran en una tanda aparte.
