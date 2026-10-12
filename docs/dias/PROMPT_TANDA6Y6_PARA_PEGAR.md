Tanda 6y6. Solo las respuestas de Eric a PREGUNTAS_TANDA6Y5.md, para dejar cerrada esta parte. Nada más.

1. El Ara Pacis delante de todo: si es lo que dices (una reserva de las 10:00 sale antes del Coliseo, por su hora), está bien. Eric lo mirará en su móvil; si vuelve a ver otra cosa, te pasará el viaje. No toques nada.
2. El miércoles de los Museos: los Museos abren los miércoles y no se quitan nunca por ser miércoles. En el documento (DIAS_ROMA_PARADAS.md), la variante «el miércoles sin Museos» pasa a ser: los Museos como siempre, y solo cambian la Plaza y la Basílica de San Pedro, que van por la tarde (por la mañana está la audiencia del Papa). Cambia el documento y el motor para que digan lo mismo.
3. El tope del pool con 1 día: baja a 2. Con 2 días se queda en 3, y con 3 o más días, en 6. Pon en el informe cuánto queda en «No incluido» con 1 día.
4. Las calles «de camino» que se dejan de pasar con una reserva grande: bien así.
5. El candado mientras no haya pantalla de pago: vale como está.
6. En GUIA_NUEVOS_DESTINOS.md, añade a la frase «Lo de pago no se enseña con candados»: «salvo "Escuchar historia", que lleva candado en la versión gratis».
7. Fontana de Trevi, secretos: deja una sola frase para la costumbre, en lugar de las dos que se contradicen: «Antes de la moneda, la costumbre era beber de su agua para volver a Roma. La película de 1954 hizo famosa la moneda.» Comprueba que no repite la historia de Trevi de HISTORIAS_ROMA.md.
8. El dicho de los Barberini en el Baldaquino: se queda.
9. La ida y la vuelta: al guardar la hora, el tramo sigue abierto, para poder rellenar la referencia, la compañía y el precio sin darle a «Cambiar». Se cierra al tocar la cabecera o al salir.
10. La tarjeta de 220 px sin «Cambiar»: vale.
11. Los sitios que añade el viajero desde el mapa: como ahora (se busca su foto, pero no se guarda en la caché).
12 y 13: la migración 0019 la ejecuta Eric. Los viajes de prueba se quedan.

PRUEBAS
- Los puntos 2 y 3 tocan el motor: pasa TODAS las pruebas, también la de las 365 fechas, a 0 fallos.
- Nuevas: un viaje con el Vaticano en miércoles lleva los Museos, y la Plaza y la Basílica por la tarde; el tope de 2 con 1 día.
- A mano, a 375 px: la ida abierta tras guardar la hora (sigue abierta), y la ficha de la Fontana de Trevi.
- Capturas en docs/dias/img/6y6-*.jpg.

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y6 en docs/dias, en palabras sencillas, y commits locales. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
