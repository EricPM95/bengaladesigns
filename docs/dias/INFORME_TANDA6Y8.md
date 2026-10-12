# Informe de la Tanda 6y8

Una sola tarea: la comida (y la cena) con una reserva. La hizo un agente en su copia y la integré yo. El detalle técnico está en `INFORME_PARTE_COMIDA_TANDA6Y8.md`.

## Qué pasaba
Con los Museos Vaticanos reservados de 12:00 a 13:00 la entrada salía **132 minutos tarde** (con la de las 12:00): el motor ponía una comida normal antes (no empieza antes de las 12:30 y la cuenta de 60 min), y la «comida rápida» de la configuración la tenía escrita pero ningún código la leía. En general, cualquier reserva con hora podía salir tarde: la prueba nueva encontró unos 1.300 casos tarde en una sola fecha antes del cambio.

## La regla (una sola, para todos los destinos)
Vive en un solo sitio (`shared/routeEngine/listasTrip.js`, paso 5.7b) y no lee nombres de Roma: sale de la hora de la reserva y de la duración de cada sitio en sus datos (`duration_minutes`).
- **La comida:** si al salir de la reserva ya son más de las 14:30, va antes; si sale a las 14:30 o antes, va después. (Coliseo de 13:00, sale 14:30: después. Vaticano de 12:00, sale 15:00: antes. Galería de 13:00, sale 15:00: antes.)
- **La cena:** igual con las 21:00; y nunca más tarde de las 22:30 salvo que la reserva acabe después de las 22:15 (la regla 17 manda: no se quita nada).
- **La entrada nunca sale tarde con una reserva:** (1) la comida de antes se cuenta corta (45 min desde las 10:30; la cena, 60 min desde las 18:00); la comida rápida de la configuración se usa de verdad; (2) si no basta, lo de justo antes pasa detrás de la reserva, en su orden; (3) si es la primera hora fija del día, el día empieza antes; (4) si ni así llega, la mesa va después y queda apuntado en el registro del día. Hasta 5 min de retraso cuentan como llegar a su hora.
- **Resultados concretos:** Museos de 12:00 a 13:00, comida corta antes, cerca del Vaticano, y el Castillo y el Puente van después de los Museos; Coliseo con la entrada hasta las 13:00 incluida, comida después; con la entrada después de las 13:00, comida antes; Galería con el turno de las 11:00, comida después; con el de las 13:00, comida antes.
- **Duraciones:** todos los sitios de Roma con reserva obligatoria o recomendada traen `duration_minutes`; ninguno falta (Coliseo 90, Museos 180, Galería 120).
- **Configuración muerta quitada:** `comida_antes_mediodia`, `comida_rapida_hasta`, `comida_despues_de_fija_desde`, `cena_antes_de_hora_fija` y `cena_antes_desde`.
- **Sin ninguna reserva el motor da exactamente lo mismo que antes** (636 viajes comparados con el motor anterior: 0 diferencias).

## Un choque que apareció y cómo se resolvió
La primera versión, para que dos entradas del mismo día salieran a su hora (Free Tour + Museos), mandaba paradas a «Si te sobra tiempo»: chocaba con tu regla 17 y `pruebaTanda6u` pasó de 0 a 61 fallos. Se corrigió: **nada pasa a «Si te sobra tiempo» por la comida o la cena**, y con dos reservas del viajero el mismo día manda la lista escrita de siempre. Con una sola reserva se mantiene lo de «la entrada nunca sale tarde». `pruebaTanda6u` volvió a 0 (pregunta 1).

## Documento y guía
`DIAS_ROMA_PARADAS.md` (regla 4, regla 6, dos puntos de la regla 17, «Museos reservados a mediodía», la comida de la Galería y una nota en la tabla del Coliseo; `listasConvertir.mjs` con 0 dudas) y `GUIA_NUEVOS_DESTINOS.md` (la regla general). Reglas 619, 620 y 621 en `INVARIANTES_PANTALLA.md`.

## Pruebas (con la regla nueva de Eric: durante la tanda, sin las 365 fechas)
- **Nueva `pruebaFase6y8_comida`:** 13.288 casos sin servidor: cada entrada con reserva de Roma a cada hora (de 30 en 30 min y de 5 en 5 de 11:30 a 15:30), en viajes de 1, 3, 5 y 7 días y en 15 tipos de día (lunes a domingo, Pascua, 2 de junio, Ferragosto, agosto, Navidad, Nochevieja, Año Nuevo, Reyes), el Free Tour de mañana, tarde y noche, un sitio inventado con 5 duraciones (la regla no lee nombres) y los casos de Eric: **0 fallos**.
- **Muestra de 54 fechas** con la prueba de listas (festivos, Semana Santa, Navidad y Año Nuevo, agosto, domingos, lunes, miércoles y días corrientes), 16 a la vez: **119.621 viajes, 324.744 días, 0 fallos**.
- **Batería de siempre:** 54 pruebas en 0 fallos, más `pruebaFase6y2_reorganizar` (782, 0 fallos, con la salida rara conocida); tipos limpios. La prueba larga del motor de la 6y5 por partes: tope 14.589 y cierres 3.265 (con paso 37), 0 fallos.
- Ajustes a pruebas antiguas: la del motor de la 6y7 (exigía el Castillo y el Puente por la mañana con los Museos a las 12:00, que ahora van después) y la de la 6u (su comprobación de las 14:30 ignora la configuración nueva).
- **Las 365 fechas completas:** se lanzan después del push; el resultado va abajo, al final de este informe, en un commit aparte.
