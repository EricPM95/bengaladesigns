# Informe de la Tanda 6y6

Solo las respuestas de Eric a `PREGUNTAS_TANDA6Y5.md`, para dejar cerrada esa parte. Lo hice yo directamente (no hacía falta repartirlo).

## Lo que no se toca
- **1. Ara Pacis delante de todo:** una reserva de las 10:00 que sale antes del Coliseo, por su hora, está bien. Si Eric ve otra cosa en su móvil, pasará el viaje.
- **4. Las calles «de camino»** que se dejan de pasar con una reserva grande: bien así.
- **5. El candado** mientras no haya pantalla de pago: vale como está.
- **8. El dicho de los Barberini** del Baldaquino: se queda.
- **10. La tarjeta de 220 px sin «Cambiar»:** vale.
- **11. Los sitios que añade el viajero desde el mapa:** como ahora (se busca su foto, pero no se guarda en la caché).
- **12 y 13:** la migración 0019 la ejecuta Eric. Los viajes de prueba se quedan.

## 2. El miércoles de los Museos
Los Museos abren los miércoles y no se quitan nunca por ser miércoles. Documento, datos y motor dicen ahora lo mismo:
- **Documento** (`DIAS_ROMA_PARADAS.md`, día del Vaticano y Trastevere): la variante «el miércoles sin Museos» pasa a ser «el miércoles los Museos abren: van como siempre, a primera hora… Solo cambian la Plaza y la Basílica de San Pedro, que van por la tarde (por la mañana está la audiencia del Papa)».
- **Datos** (`data/dias/roma/listas.json`, regenerado con `listasConvertir.mjs`, 0 dudas): la variante `miercoles_audiencia` solo quita la Plaza y la Basílica de la mañana y las pone al principio de la tarde.
- **Motor:** como la Cúpula va detrás de la Basílica y ahora la Basílica puede estar por la mañana o por la tarde, la operación de insertar admite `si_hay_ancla` (si la Basílica no está en esa lista, no inserta nada). Así la Cúpula sigue a la Basílica en los dos casos.
- **Cómo queda un miércoles:** Museos a las 9:00, comida en el Borgo a las 12:30, la Plaza a las 13:37 y la Basílica a las 14:10, y después la Conciliazione, el Castillo, el Puente y Trastevere como siempre.
- El orden de los días sigue evitando poner el Vaticano en miércoles cuando puede; la variante solo se activa si no puede (y sin reserva de los Museos ese día).
- **Una cosa que tienes que saber:** en las tandas anteriores el documento y el motor quitaban los Museos en miércoles. Ya no. Las pruebas que dejaban perder los Museos en miércoles (la de listas, la de 6y4 y la del motor de la 6y5) ya no lo permiten.

## 3. Tope del pool
2 con 1 día, 3 con 2 días, 6 con 3 o más. Con ese tope, lo elegido que queda en «No incluido» (540 viajes por forma):
- **1 día, tope 2:** 540 de 1.080 (**50 %**; con el tope de 3 era el 51,7 %).
- 2 días, tope 3: 203 de 1.620 (12,5 %).
- 3 días, tope 6: 262 de 3.240 (8,1 %).
- 4 días, tope 6: 2 de 3.240 (0,1 %); 5 y 6 días: ninguno.
Es decir, con 1 día la mitad de lo que elige el viajero no cabe: casi siempre uno de los dos. Se lo dice «No incluido».

## 6. La guía
En `GUIA_NUEVOS_DESTINOS.md`: «Lo de pago no se enseña con candados: simplemente no sale, salvo "Escuchar historia", que lleva candado en la versión gratis.»

## 7. Fontana de Trevi, secretos
Una sola frase para la costumbre: «Antes de la moneda, la costumbre era beber de su agua para volver a Roma. La película de 1954 hizo famosa la moneda.» Sigue después la frase de Cáritas que ya estaba. Comprobado que no comparte 8 palabras seguidas con la historia de Trevi de `HISTORIAS_ROMA.md`.

## 9. La ida y la vuelta
Al guardar la hora, el tramo sigue abierto para rellenar la referencia, la compañía y el precio sin darle a «Cambiar». Se cierra al tocar la cabecera del bloque o al salir de RESERVAS. Visto a 375 px (capturas `docs/dias/img/6y6-*.jpg`).

## Pruebas
- **Nueva:** `pruebaFase6y6_cierre.mjs`: documento, datos y motor (en 6 formas de viaje, todo el año, sin reserva y con el Coliseo reservado en cada día para forzar el Vaticano en miércoles: **36 miércoles** con los Museos por la mañana y la Plaza y la Basílica por la tarde, y 3.014 días del Vaticano normales sin cambios), el tope de 2 con 1 día, la frase de Trevi, la guía y el tramo abierto.
- **Ajustadas:** la de listas y la de reservas con dos sitios ya no dejan perder los Museos en miércoles; la de formulario y la del motor de la 6y5 usan el tope nuevo; la de historias comprueba la frase nueva de Trevi.
- **Las 365 fechas** con el motor nuevo (`pruebaListas`, 10 tramos desde el 13-oct-2026): 0 fallos en los 10.
- **Prueba propia del motor de la 6y5** por partes (es muy larga entera): dos reservas a la vez, 8.644 comprobaciones; cierres y «Si te sobra tiempo», 13.495; aviso de la Fontana y tope, 15.669. Todas a 0 fallos.
- **Batería de siempre:** 51 pruebas a 0 fallos y tipos limpios.
- **Capturas a 375 px** en `docs/dias/img/6y6-*.jpg`: la ida abierta antes y después de guardar la hora 11:15 (sigue abierta, con referencia, aerolínea y precio a mano) y la ficha de la Fontana con la frase nueva de la moneda.
