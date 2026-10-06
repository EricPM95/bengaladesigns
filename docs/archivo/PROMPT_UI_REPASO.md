# Repaso del diseño (lo que veo en la app)

Commit por parte y sin push. Todo con reglas generales, a INVARIANTES.

1. **Avisos de fechas: un aviso, un tema.** En el viaje de diciembre sale una sola ventana titulada «Primer domingo de mes · Museos gratis», pero el primer párrafo habla de que los Museos Vaticanos cierran el domingo 6 y el martes 8. El título no dice lo que hay dentro. Además, confunde: lees «museos gratis» y justo debajo que los Vaticanos están cerrados. Los Vaticanos solo son gratis el último domingo, no el primero.
   - Regla: cada aviso habla de una sola cosa, y su título dice exactamente esa cosa.
   - Aquí salen dos avisos:
     - «Domingo 6 y martes 8 · Museos Vaticanos cerrados»: «Los Museos Vaticanos cierran el domingo 6 y el martes 8, la Inmaculada. Hemos puesto tu visita el lunes 7 para que no los pierdas.»
     - «Domingo 6 · El Coliseo, gratis»: el texto de la entrada gratis, la gente y la taquilla. En el título, di qué es gratis (el Coliseo y los museos del Estado), nunca «museos» a secas.
   - Primero va el que cambia la ruta, y después el informativo.
   - El icono, según el tipo:
     - confeti, solo para fiestas y eventos;
     - un candado o un calendario tachado, para los cierres;
     - una entrada, para los días gratis.
   - Revisa todos los avisos de Roma con esta regla y lista en el informe los que has separado o cambiado de título.

## Lo que has hecho: retoques

2. **Fuera la tarjeta «Sal de Roma un día»** del final de la lista de días. Quítala entera. Ya veremos cómo ofrecer la excursión de forma más discreta; de momento, solo queda el enlace pequeño «¿Prefieres una excursión este día?» al final del día de la oferta.
3. **Barra flotante abajo, con 5 iconos (prototipo: lienzo «Barra de abajo», opción B).** Sustituye a los botones flotantes sueltos (mapa, presupuesto, varita) y a la pestaña Reservas de arriba.
   - Una píldora oscura (#1F1B16), flotando sobre la lista: 64 px de alto, a 24 px de los lados y 26 px del borde de abajo, con sombra suave.
   - Cinco sitios, iconos de línea en crema, sin texto (cada uno con su `aria-label` y 44 × 44 px de toque), en este orden:
     1. **Mapa**: abre el mapa. Sustituye al botón «Mostrar mapa».
     2. **Bombilla**: los tips del viaje. Todavía está por hacer: de momento, al tocarla, «Muy pronto: los consejos para tu viaje».
     3. **Perfil**, en el centro, en un círculo terracota de 50 px. Abre una hoja desde abajo con:
        - «Hola, viajero» (la cuenta llegará más adelante);
        - el botón «Nuevo viaje», con el icono de la maleta;
        - «MIS VIAJES», con la lista de viajes guardados en este dispositivo y el abierto marcado.
     4. **Reservas**: la pestaña Reservas pasa aquí, con su aviso naranja «!» mientras falte algo por reservar.
     5. **Presupuesto**: la bolsa, sin ningún aviso encima.
   - **La varita («Volver a mi ruta original») va arriba de la pestaña Días**, a la derecha de la cabecera «Tus 3 días».
     - Un botón pequeño con el icono y el texto «Ruta original», siempre visible y siempre igual, sin puntito.
     - Si no hay cambios, al tocarlo sale «Tu ruta está tal como te la preparamos».
   - **Arriba quedan cuatro pestañas:** Hoy, Ruta, Días y Explorar.
   - **Fuera el botón de la luna** (modo oscuro) de la cabecera de arriba.
   - Ya no queda ningún botón flotante suelto.
   - La lista deja espacio abajo para que la barra no tape nunca la última tarjeta.
   - En escritorio, la misma barra, centrada abajo, con el ancho de la lista.
4. **Espacio entre la barra de llegada y «MAÑANA»:** los mismos 50 px que entre los demás bloques.
5. **Las cifras del día** («13 paradas · 10,6 km a pie · 7,5h actividad») con otro diseño.
   - Tres cifras pequeñas en fila, separadas por una línea fina vertical.
   - En cada una, el número en Instrument Serif (18 px) y debajo la palabra en mono pequeño, en mayúsculas: «13 PARADAS | 10,6 KM A PIE | 7 H 30 DE ACTIVIDAD».
   - Sin iconos, sin caja, centradas en el ancho del día.
6. **«De camino», del mismo ancho que las paradas.**
   - Quita el margen de la izquierda, para que quede alineada con las tarjetas de las paradas.
   - Deja un poco más de aire encima y debajo (16 px), para que se vea mejor.
7. **Las cabeceras de tramo (MAÑANA, TARDE, NOCHE), con aire.** Ahora «TARDE» va pegada a la comida.
   - 50 px encima de cada cabecera y 12 px debajo, hasta el primer «+ Añadir parada».
   - Nunca pegadas a nada.
8. **La comida y la cena, con el mismo aire que la NOCHE:** 50 px encima y 50 px debajo, para que se distingan como un bloque propio.
9. **En la ventana de la llegada y la vuelta, sin foto.** En su lugar va el mapa de la pestaña Ruta, el que enseña el viaje entero.

## Nuevo

10. **Todos los días se pueden mover, también el de llegada y el de vuelta.**
    - Todos llevan las tres rayas.
    - El día que quede primero hereda el alojamiento y la llegada, y el que quede último hereda la vuelta, como ya está.
    - Las fechas van con la posición: el que queda primero toma la primera fecha.
    - Si al moverlo un día cae en una fecha con un cierre (los Vaticanos en domingo, por ejemplo), sale la marca roja de siempre en esa parada.
11. **Tarjetas de parada más estrechas, para que la foto se vea bien.** En la tarjeta solo va:
    - la hora;
    - el nombre;
    - una línea con el horario (icono del reloj) y, justo al lado, el tiempo de visita (icono del reloj de arena);
    - las etiquetas.

    Fuera de la tarjeta:
    - «Reserva obligatoria» y «Reserva recomendada»: van dentro de la ficha, en Entradas;
    - «Por dentro» y «Por fuera»: van dentro de la ficha, en Resumen.

    Solo se queda en la tarjeta la marca roja cuando hay un problema («Hoy cierra», «Cerrado a esa hora»).
12. **El bus y el metro, como el paseo andando.** Cuando el muñeco de andar se cambia por el bus, se queda el número («Bus 115 · 15 min»).
    - Además, sale igual que la fila de andar: con el enlace «Rutas».
    - «Rutas» abre Maps en transporte público, hasta la parada, para que el viajero vea dónde se coge.
    - Y el «+ Añadir parada» a la derecha, como siempre.
13. **El bloque del aperitivo** («Trastevere al anochecer y aperitivo», con los botones «Plaza Trilussa · 3 min»): no me gusta cómo se ve ahora, como un texto suelto. Que sea una tarjeta como las paradas:
    - su franja, con el icono de copa;
    - una foto del barrio al anochecer;
    - la hora, el nombre y el tiempo («90 min»);
    - la etiqueta «Aperitivo».

    Las sugerencias («Plaza Trilussa», «Ponte Sisto») van dentro de su ficha. Sin número de orden, como la comida.
14. **«0 min andando desde…».** En la cena de Tonnarello pone «0 min andando desde Iglesia de Santa Maria in Trastevere».
    - Si está a menos de 1 min, «Justo al lado».
    - Siempre desde el bloque de justo antes (aquí, el aperitivo), no desde la última parada.
15. **La nota de temporada, a la ventana de los avisos.** Ahora sale como un banner oscuro encima de los días («INVIERNO · En tus fechas anochece sobre las 16:45…»), y con el de alojamiento al lado parece todo alertas.
    - Quítala de la pestaña Días.
    - Pasa a la ventana de los avisos de fechas, con el mismo formato que los demás, y **siempre la primera**. Si hay festivos o días especiales, van detrás.
    - Si no hay ningún aviso de fechas, la ventana sale igual, solo con la nota de temporada.
    - Su título dice la temporada y el destino: «Invierno en Roma».
    - **Con el mismo efecto que en el formulario**, solo dentro de esa ventana:
      - invierno, nieve cayendo;
      - verano, el sol poniéndose;
      - primavera y otoño, el suyo del formulario.
    - Suave y sin tapar el texto. Si el móvil tiene activado «reducir movimiento», sin animación.
