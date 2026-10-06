# Preguntas de la Tanda 6c

Lo que he decidido yo. Se cambia con un dato (`data/dias/roma/_destino.json › franjas`, `listasVariantes.mjs`, `listasNombres.json`) salvo lo que diga lo contrario.

## El documento nuevo

1. **«Columna de Trajano y Mercados de Trajano»** es una sola parada: el sitio de `roma.json` es los Mercados de Trajano (por dentro, ~1 h) y el título lleva la Columna. La Columna de Trajano (que también existe como sitio) no sale aparte.
2. **D7 en domingo.** El documento dice que el mercado de Campo de' Fiori es «de lunes a sábado». El domingo, Campo de' Fiori va de camino (5 min); la Plaza Farnese y el Ponte Sisto siguen igual, y la Farnesina (cierra los domingos) pasa por la regla de cierres de siempre. La mañana sigue empezando en Campo de' Fiori; no la empiezo en Santa Maria in Trastevere, como decía la línea del domingo de antes.
3. **Sugerencia del D1** («la Columna y los Mercados de Trajano, si el viaje no lleva el D6»): sale la primera de las sugerencias de HOY del D1 (después de lo que haya en «Si te sobra tiempo»), solo si el viaje no lleva el D6. Está en `listasVariantes.mjs › D1 › sugerencias`.
4. **Piazza del Popolo ~30 en el D4** (por la tarde): el documento sigue diciendo ~15; lo he cambiado con un cambio aparte (`listasVariantes.mjs › ajustes_base`) que cita tu frase de `PARA_CODE_TANDA6C.md`, sin tocar `DIAS_ROMA_PARADAS.md`. Si cambias el documento, este cambio sobra.
5. **Miércoles del D2 sin Museos:** el documento sigue diciendo que la Plaza de San Pedro y la Basílica van «después de la audiencia (desde las 12:30)», así que ese día empieza a las 12:30. No lo he llenado por la mañana porque no me lo has pedido. Es la única excepción que queda en la prueba de «el día no empieza más tarde».

## Acortar antes de quitar

6. **Un imprescindible la primera vez también se acorta.** Para que la comida no pase de las 14:30 se acorta primero lo de menos de la mañana: por dentro → por fuera (con los minutos de «por fuera» que ya pone el documento en otro sitio, p. ej. el Altar de la Patria ~30) y por fuera → de camino. Esto vale también para un imprescindible que se ve por primera vez (el Altar): sigue viéndose, solo se tarda menos. Solo después de eso, lo de menos pasa a «Si te sobra tiempo».
7. **El hueco de 50 min entre el Foro y la «Llegada a…» del Coliseo** sigue existiendo en D1 con el Coliseo a las 12:00 y el día a las 9:00 (Arco 10 + Foro 90 acaban a las 10:42; la llegada es a las 11:30). Lo he dejado: el Campidoglio va después, como en tu ejemplo, y el motor solo rellena huecos de más de 1 h.
8. **La hora que se enseña y la del cierre son la misma.** Antes el cierre se miraba con la hora de antes de ajustar el día; ahora, tras ajustar, se mira otra vez con la hora definitiva y se repite hasta que coinciden (hasta 5 vueltas). San Luigi dei Francesi estaba bien en `roma.json` (09:30-12:45 y 14:30-18:15); el fallo era la hora vieja.

## Sugerencias de «Vas bien de tiempo»

9. **Qué cuenta como «sitio conocido»:** nivel 1 o 2, o que salga en algún día escrito del documento (paradas, de camino, variantes, pool, experiencias). Nunca el Colle Oppio ni sitios así. Vale lo mismo para los rellenos de la mañana.
10. **Cerca / lejos:** cerca = 10 min andando o menos (de donde está o de lo que le queda). Lejos (solo antes de comer o de cenar, con 90 min o más de sobra): hasta 20 min andando o 15 min en bus o metro. No tengo tiempos reales de bus o metro: los estimo como 6 min de espera + la distancia en línea recta ×1,3 a 20 km/h. Es una estimación; los números están en `franjas`.
11. **Si lo sugerido queda lejos, la comida o la cena se cambia a su zona**: un restaurante de verdad (restaurante o pizzería), abierto a esa hora, a 12 min andando o menos del sitio, que no salga en ninguno de los días escritos ni en lo ya usado del viaje. Si no hay ninguno, esa sugerencia no sale. Al pulsar «Añadir» se añade la parada y se cambia el restaurante en la comida o la cena de ese día (el viajero decide, nada cambia solo).
12. **Zonas:** el texto sale tal cual está la zona del restaurante en `roma.json` («Trevi», «Coliseo / Monti», «Barrio Judío»…). Algunas no suenan a barrio («Trevi»); si quieres otro nombre, se cambia en el restaurante.
13. **Máximo 6 sugerencias**, por este orden: lo de «Si te sobra tiempo» del día, lo que sugiere el documento para ese día, y el resto por nivel y cercanía. Un sitio que el viaje lleva otro día **posterior** sale con «Lo tienes el día n»; uno de un día anterior o ya visto, no sale.

## Lo que había quedado de la 6b

14. **Tercer restaurante en el Gueto: Piperno** (Via Monte de' Cenci 9). Horario de su web (ristorantepiperno.it, leído hoy): martes a viernes solo cena (19:45-22:30), sábado comida (12:45-14:30) y cena, domingo solo comida, lunes cerrado. Para que el motor lo sepa he añadido a los restaurantes dos campos nuevos, `closed_comida_on` y `closed_cena_on` (y `dinnerZones.js` los lee). **Las coordenadas (41,8923 · 12,4767) y el precio (€€€, 45-60 €) son aproximados: la web no los trae. Revísalos.**
15. **Dónde sale Piperno:** como tercera opción de la comida en los días cuyo restaurante principal está en el Barrio Judío (D1, D1-corto y D1-FT). No en el D6 (Enoteca Corsi no es del Gueto) ni en las cenas.
16. **«Turno recomendado: 11:00»:** sin reserva puesta, el turno que propone el motor (Galería Borghese, cada 2 h) sale como «Turno recomendado» y no en negrita, sin ser una reserva (no cuenta para la cuenta atrás de HOY). En cuanto el viajero reserva, sale su hora en negrita como siempre.
17. **Aviso del Free Tour con los Museos:** sale en la hoja de «Añade tu reserva», no al reconstruir el día. Salta si el día de la reserva lleva un Free Tour y la hora de los Museos va de las 13:00 a las 15:00. «Sí» pasa la reserva al día más cercano que no lleve el Free Tour (ni sea de excursión); «No» la deja donde está. Si no hay otro día, la deja.
18. **Sitios sin foto:** Via del Babuino y Via Veneto van de camino y no llevan foto; no he cambiado datos de fotos en esta tanda (lo apuntado queda para los scripts de fotos). *(Ver el informe: lo que haya quedado.)*
19. **Página `VIAJES_LISTAS.html`:** el viaje «con lluvia» se muestra con la alternativa aplicada (lo que sale se va; lo que entra va al final), el ejemplo de HOY está en «3 días con un ejemplo de HOY…» y la tarjeta de descanso sale en cada día que la tiene.
