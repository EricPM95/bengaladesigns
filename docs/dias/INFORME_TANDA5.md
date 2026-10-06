# Informe de la Tanda 5

Prueba entera: 27.740 días, 437.015 filas, 52.195 comidas y cenas. **0 sin explicar, 0 fallos de orden, 0 restaurantes cerrados, 0 comidas o cenas sin restaurante, 0 cenas pasadas de las 22:00, 0 colchones de más de 2 horas, 0 «por dentro» repetidos, 0 nocturnas repetidas, 0 fallos en las excursiones de medio día.** Las decisiones mías, en `PREGUNTAS_TANDA5.md`.

## Por qué mis comprobaciones no veían los fallos

La comprobación de huecos miraba las filas del cálculo, no lo que el viajero ve. El 25 de diciembre San Clemente (cerrado todo el día) seguía en el cálculo aunque otro paso la quitaba de la pantalla: el hueco de 50 min no se veía y daba 0. Ahora existe `fila_sin_parada` (toda fila del cálculo es una parada en pantalla), y los cierres se resuelven antes y después de calcular las horas. Al añadirla, mis comprobaciones nuevas dieron 34 falsos fallos en el D7 con excursión de medio día (la tarde sale libre a propósito); lo arreglé en la comprobación, no en el motor.

## Por puntos

1. **Sin crucero.** Fuera de datos, motor, formulario, textos y la hora de vuelta de las 16:30. El D0 es un día entero normal (9:30 a la noche). Con Museos en el pool, mañana del D0-medio y tarde del D0 desde Piazza Navona (provisional). Prueba: los 5 viajes de 1 día y el del Coliseo salen completos.
2. **Restaurantes.** Fuera las reglas de barrio. Solo no se repite el mismo restaurante; el recambio es un `tipo_local` restaurante o pizzería a ≤10 min andando; lo andado se cuenta desde el que va de verdad. Prueba: 0 repetidos sin motivo (2 con motivo, sin recambio posible), 0 recambios que no sean restaurantes, 0 a más de 10 min.
3. **Huecos.** Hasta 30 min es normal. Solo se alargan colchones con contenido (≤2 h) y comidas (≤75 min); calles, paseos, puentes, plazas, miradores y «de camino» no. Quitado el «rato más» del último sitio. 25 de diciembre: arreglado (San Clemente se resuelve antes de calcular y las horas corren hacia antes). Quedan 124 huecos >30 min con aviso, donde no hay nada alargable.
4. **Orden.** El motor ya no reordena una tabla. 0 fallos de orden, 0 repetidas, 0 solapes. El caso D1-FT de primavera está cubierto.
5. **Llegada.** Tipo propio con texto propio y sin foto (también en el Free Tour: «Llegada al punto de encuentro»).
6. **Imprescindibles.** Antes de apretar uno, se quita lo de nivel más bajo. De los 654 quedan 8, todos la Plaza de San Pedro el 25 de diciembre con Free Tour (no hay nada más bajo que quitar).
7. **Fotos.** Via Margutta con su hueco; «de camino» y paseos sin foto ni recuadro; el paseo usa la del barrio; la Escalera Santa con la de Letrán. 80 fotos, todas con versión pequeña. Huecos vacíos (3): Cripta de los Capuchinos, Plaza del Quirinal, Puente y Castillo de Sant'Angelo iluminados. Sin usar: `dia_escalera_santa.jpg`.
8. **Respuestas de la Tanda 4.** Hechas; la 14 desde el botón del autobús (el motor recalcula la tarde desde las 16:00).
9. **Documento nuevo.** Pasado por el convertidor sin tocarlo (D0, regla de restaurantes, cena en el Gueto, paseo del Aventino).
10. **Pruebas.** Hecha entera. Páginas `VIAJES_2_5_MOTOR.html` y `VIAJES_3_6_MOTOR.html` regeneradas (la segunda con 6 viajes de 1 día). api-server reiniciado y probado con peticiones reales; `tsc` sin errores.

No he hecho push.
