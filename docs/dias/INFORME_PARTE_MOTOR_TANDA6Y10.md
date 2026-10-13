# Tanda 6y10, parte del motor (agente B)

QuÃ© se ha hecho, en palabras sencillas: el orden de los dÃ­as, los sitios cerrados, la BasÃ­lica, los avisos Â«Abre a lasâ€¦Â» y la hora de la comida. Todo con las reglas de siempre: nada se quita sin que lo decida el viajero; lo que no cabe, a Â«Si te sobra tiempoÂ».

## Los fallos del punto 1, uno a uno

### a) El dÃ­a del Vaticano en un dÃ­a cerrado (el mÃ¡s gordo)

**QuÃ© pasaba.** El motor ya probaba todos los Ã³rdenes de los dÃ­as (no solo cambiar un dÃ­a con el siguiente), pero los comparaba mal: un Vaticano cerrado y una GalerÃ­a cerrada pesaban casi igual, asÃ­ que, con 3 dÃ­as del 24 al 26 de diciembre, salÃ­a Coliseo el 24, Vaticano el 25 (cierra) y Villa Borghese el 26. AdemÃ¡s, el DÃ­a de la Roma antigua con Free Tour (D1-FT) no contaba como cerrado el Coliseo y el Foro de su maÃ±ana (los hereda del D1), y por eso se podÃ­a quedar en un 1 de enero.

**CÃ³mo se arreglÃ³** (`shared/routeEngine/listasOrden.js`):
- Se prueban TODOS los Ã³rdenes de los dÃ­as libres (hasta 8 dÃ­as libres: 40.320; con mÃ¡s, se mejora el orden de la tabla cambiando los dÃ­as de dos en dos). En la prÃ¡ctica un viaje tiene 7 dÃ­as como mucho.
- Cada sitio cerrado pesa segÃºn lo que importa: nivel 1 (imprescindible) 10.000, nivel 2 (GalerÃ­a, Termas, Castilloâ€¦) 100, el resto lo de siempre. Primero se salvan los imprescindibles, luego el nivel 2, luego lo demÃ¡s. Si dos Ã³rdenes pierden lo mismo, gana el de siempre (el que menos mueve los dÃ­as: lo imprescindible primero).
- El D1-FT cuenta las paradas que hereda de la maÃ±ana del D1.
- Resultado: 24-26 de diciembre = **Vaticano el 24, GalerÃ­a (cierra) el 25, Coliseo el 26**. Los dÃ­as cambiados a mano (`forceOrder`) y los de una reserva del viajero (`reservasGrandes`) no se mueven, como antes. Un dÃ­a de horario reducido (Museos el 24 y el 31) cuenta como abierto: el motor solo mira `closedOnDay`, asÃ­ que lo que deje el agente A en los datos vale tal cual.

### b) Cuando de verdad no hay otro dÃ­a (14-16 de agosto)

**QuÃ© pasaba.** El Vaticano se quedaba en su dÃ­a con Â«Llegada a los MuseosÂ» y 3 horas, como si abrieran.

**CÃ³mo se arreglÃ³** (`shared/routeEngine/listasTrip.js`, `server/engine/buildDayV3.js`):
- Los sitios que nunca se quitan (Museos y GalerÃ­a) ya activan la versiÃ³n Â«sin Ã©lÂ» del documento (`sin_museos`, `domingo_sin_museos`, `lunes_sin_galeria`).
- El sitio se saca de la secuencia del dÃ­a (sin Â«Llegada aâ€¦Â», sin tiempo, sin contar para nada) y vuelve a su puesto como parada marcada **Â«Cerrado este dÃ­aÂ»** (`outsideKind: 'cerrado'`, `outsideReason: 'Cerrado este dÃ­a'`, `closedThisDay`, duraciÃ³n 0), con su aviso de Â«no hay otro dÃ­a de tu viajeâ€¦Â» (`stop.notice` y el aviso del dÃ­a). No sale ademÃ¡s en Â«No incluidoÂ».
- El servidor ya no le pone el texto Â«te lo enseÃ±amos por fueraÂ» (una lÃ­nea en `buildDayV3.js`, porque no se enseÃ±a por fuera).
- Las pantallas no se han tocado: el color rojo Â«Hoy cierraÂ» ya sale por `outside_kind: 'cerrado'`; si se quiere el texto exacto Â«Cerrado este dÃ­aÂ» en la tarjeta, la pantalla puede leer `outside_reason`.

### c) La BasÃ­lica con su horario real

**QuÃ© pasaba.** Con una reserva del viajero o con el Free Tour reservado el motor no miraba los horarios (regla 6z5), y la BasÃ­lica salÃ­a por dentro de 19:15 a 20:15 (cierra a las 20:00) o a las 11:59 (abre a las 12:30 el miÃ©rcoles).

**CÃ³mo se arreglÃ³.** Ahora tambiÃ©n esos dÃ­as se mira el horario real de cada visita por dentro (nunca se mueve el orden): si a su hora ya habrÃ¡ cerrado, va por fuera con su aviso; si aÃºn no habrÃ¡ abierto, espera (hasta 15 min, 40 si lo de antes es una plaza al lado) o va por fuera con su aviso. Dos cuidados: con reserva nada pasa a Â«Si te sobra tiempoÂ» por la hora (lo que no se ve desde fuera se queda donde estÃ¡), y al final del dÃ­a, cuando mover una mesa cambia las horas, los avisos se rehacen con las horas de verdad (`horariosCoherentes` otra vez). Viaje 14 dÃ­a 1: BasÃ­lica **por fuera** con Â«Hoy ya ha cerradoÂ». Viaje 16 dÃ­a 2: la BasÃ­lica **espera** hasta las 12:30.

### d) Los avisos Â«Abre a lasâ€¦Â»

**QuÃ© pasaba.** El Â«Abre a las 14:30 / 16:30 / 16:00Â» venÃ­a escrito del documento y salÃ­a siempre, y a veces junto al aviso calculado con la hora de ese dÃ­a (Â«Abre a las 16:30. Abre a las 16:00Â»).

**CÃ³mo se arreglÃ³.** Solo sale si la ruta llega antes de que abra, con la hora real de ESE dÃ­a (del horario del sitio, no la del documento), y una sola vez. Si la parada ya trae su aviso calculado, no se repite; si la ruta llega con el sitio abierto, no sale nada (tampoco el texto escrito del documento que dice lo mismo).

### e) El cambio de dÃ­a que no gana nada (Viaje 5)

**QuÃ© pasaba.** El dÃ­a del Vaticano se cambiaba del 15 al 14 de agosto solo porque el documento no quiere el D2 en domingo, aunque los Museos cierran los dos dÃ­as.

**CÃ³mo se arreglÃ³.** La Â«mala fechaÂ» de un dÃ­a de la semana o de una fecha que el documento marca por el cierre de un sitio no se cuenta dos veces: si el sitio de su lista `cerrado` cierra ese dÃ­a, ya estÃ¡ contado en el cierre. Si el otro dÃ­a tambiÃ©n cierra, empatan y gana el orden de la tabla. El domingo con los Museos abiertos (Ãºltimo domingo del mes) y el miÃ©rcoles (audiencia) siguen penalizÃ¡ndose como antes.

## La comida (punto 0, P4)

- **La comida nunca va antes de las 12:00.** `comida_rapida_desde` pasa de 10:30 a 12:00 (la comida corta de antes de una reserva).
- **Ãšnica excepciÃ³n** (`comida_rapida_excepcion`, en los datos de franjas del destino, sin nombres de Roma): una reserva que empieza entre las 12:00 y las 13:00 con la comida antes de ella â†’ la comida corta (30 min) puede empezar desde las 11:15, y hace de Â«Llegada aâ€¦Â»: el rato de llegada solo dura lo que queda hasta la hora de la reserva, asÃ­ que la entrada no sale tarde.
- Museos a las 15:00 en miÃ©rcoles: maÃ±ana con sus paradas, comida a las 12:00 en el Borgo, Castillo por dentro y Museos a las 15:00; el rato libre de la maÃ±ana se queda libre.
- Se ha editado `DIAS_ROMA_PARADAS.md` solo en lo autorizado: regla 4 (comida), los avisos Â«Abre a lasâ€¦Â» y el horario real con reserva, los cierres (Â«Cerrado este dÃ­aÂ», versiÃ³n sin Museos), el orden de los dÃ­as y Â«Museos reservados a mediodÃ­aÂ». Regenerado con `listasConvertir.mjs`: **0 dudas** (`listas.json` no cambia). Comentario de `listasVariantes.mjs` al dÃ­a.
- **Frases a cambiar en `GUIA_NUEVOS_DESTINOS.md`** (la edita otro agente): lÃ­nea 32, Â«la mesa de antes se cuenta corta por dentro (45 min la comida, 60 la cena)Â» â†’ aÃ±adir Â«la comida nunca antes de las 12:00; Ãºnica excepciÃ³n: una reserva entre las 12:00 y las 13:00, cuya comida corta (30 min) puede empezar desde las 11:15 y hace de llegadaÂ»; lÃ­nea 34, Â«`comida_rapida_min` / `comida_rapida_desde` (45 min, 10:30)Â» â†’ Â«(45 min, 12:00)Â» y aÃ±adir `comida_rapida_excepcion` (`reserva_desde`, `reserva_hasta`, `desde`, `min`); y, en los cierres, que los sitios de `sitios_que_no_se_quitan` se quedan como Â«Cerrado este dÃ­aÂ» con la versiÃ³n Â«sin Ã©lÂ».

## Pruebas

Nuevas:
- `scripts/destino/pruebaFase6y10_viajes.mjs` (+ `viajes20Lib.mjs`, los 20 viajes de la revisiÃ³n): las comprobaciones de siempre en los 20 viajes; el orden de los dÃ­as contra TODAS las permutaciones (la prueba las prueba por su cuenta); 24-26 de diciembre; 14-16 de agosto (marca, sin Â«Llegada aâ€¦Â», sin tiempo, aviso, versiÃ³n sin Museos, sin Â«No incluidoÂ»); Viaje 5; BasÃ­lica de los Viajes 14 y 16; avisos Â«Abre a lasâ€¦Â». **118 comprobaciones, 0 fallos.**
- `scripts/destino/pruebaFase6y10_comida.mjs`: la comida nunca antes de las 12:00 salvo la excepciÃ³n (cada reserva de Roma a cada hora, varios dÃ­as), los casos de Eric (Museos 15:00 en miÃ©rcoles; 12:00, 12:30 y 13:00; 11:45) y un sitio inventado. **1735 comprobaciones, 0 fallos.**

Ajustes mÃ­nimos a pruebas antiguas (lo que ya no valÃ­a):
- `pruebaFase6y8_comida.mjs`: Â«cabe la mesa antesÂ» ahora es 12:00 + 45 + 12 (11:15 + 30 + 12 en la ventana de 12:00 a 13:00); el caso Coliseo 13:30 acepta que el motor la deje despuÃ©s si no llega a tiempo (lo apunta, la entrada nunca sale tarde).
- `pruebaFase6y5_motor.mjs` (p2): un dÃ­a que hereda la maÃ±ana (D1-FT) no vale en una fecha en que cierra una visita por dentro heredada.
- `pruebaTanda6u.mjs` y `comprobacionesListas.mjs` (regla 6c): el Foro por fuera con una reserva ya no es fallo si a esa hora ya ha cerrado o no ha abierto (horario real, punto 1c).
- `pruebaListas.mjs`: las versiones Â«sin Ã©lÂ» (`sin_museos`, `domingo_sin_museos`, `lunes_sin_galeria`) cuentan como variantes de cierre del documento.

Resultados de las pruebas afectadas: pruebaFase6y8_comida (43.162 comprobaciones, 0 fallos), 6y9_freetour p1 (1653, 0), 6y7_motor (17.724, 0), 6y6_cierre (3223, 0), 6y5_motor p1 (8644, 0), p18+tope (14.589, 0), p2+p4 paso=37 (3487, 0), 6y4_listas (643, 0), Tanda 6h, 6i, 6j, 6k, 6l, 6r, 6s, 6t, 6u, 6v, 6x_franjas, 6z, 6z2, 6z3, 6z3_dias, 6z5, 6z6a-d: todas a 0 fallos. Excepcion: pruebaTanda6g da 1 fallo (`etiqueta_roja`: una etiqueta de `src/components/route/DayList.tsx`, una pantalla que no he tocado; no es del motor). Muestra de 54 fechas con pruebaListas (festivos, domingos, lunes, miercoles, 24 a 31 de diciembre, 1 y 6 de enero, Semana Santa, 14 al 16 de agosto): 119.621 viajes, 324.744 dias, **0 fallos**. Typecheck (`tsc -p tsconfig.app.json`) sin errores. No se han lanzado las 365 fechas.

## Decidido por Code
- Pesos del cierre: nivel 1 = 10.000, nivel 2 = 100, el resto sin recargo (es lo que dice Â«imprescindibles, luego nivel 1, luego lo demÃ¡sÂ»: en los datos de Roma los imprescindibles son el nivel 1).
- La comida de la excepciÃ³n dura 30 min y hace de Â«Llegada aâ€¦Â» (con 45 min y la llegada de 30 min, los Museos a las 12:00 y las 12:30 no podÃ­an llevar la comida antes sin llegar tarde).
- Las versiones Â«sin Ã©lÂ» del documento ahora tambiÃ©n se activan para la GalerÃ­a en lunes (`lunes_sin_galeria`: la Cripta de los Capuchinos), no solo para el Vaticano: es la misma regla (Â«se queda como Cerrado este dÃ­a y el resto del dÃ­a es la versiÃ³n sin Ã©lÂ»).
- Con una reserva del viajero se mira el horario real para pasar a Â«por fueraÂ» o esperar, pero nunca se manda nada a Â«Si te sobra tiempoÂ» ni se mueve el orden.
- La invariante 593 de `INVARIANTES_PANTALLA.md` (Â«las variantes viejas ya no se activan por cierreÂ») deja de ser cierta; no la he tocado (otro agente edita ese fichero): hay que cambiarla.

## Preguntas abiertas
1. Un miÃ©rcoles de EpifanÃ­a (6 de enero) o cualquier dÃ­a de Museos cerrados en un viaje de 1 dÃ­a: la versiÃ³n sin Museos del D0 deja la maÃ±ana vacÃ­a hasta la comida (la Plaza y la BasÃ­lica van despuÃ©s de comer los miÃ©rcoles). Â¿Se quiere llenar esa maÃ±ana con otra cosa?
2. Con los Museos a las 12:00 la comida de 30 min hace de llegada: el aviso Â«Llega unos 30 minutos antesÂ» sigue saliendo en la ficha aunque se coma justo antes. Â¿Se deja asÃ­?
3. La pantalla enseÃ±a Â«Hoy cierraÂ» (rojo) en la parada Â«Cerrado este dÃ­aÂ»; Â¿queremos el texto Â«Cerrado este dÃ­aÂ» en la tarjeta (es un cambio de pantalla)?

