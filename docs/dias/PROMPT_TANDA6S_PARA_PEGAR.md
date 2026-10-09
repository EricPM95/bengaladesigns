Tanda 6s: la pestaña RESERVAS nueva, en versión gratis y de pago. Va todo en este mensaje. Empieza cuando esté subida la 6r. No cambia cómo se montan los días.

EL DISEÑO
Está en docs\diseno\reservas\Reservas v4.dc.html (el prototipo de Claude Design; se abre en el navegador y arriba tiene interruptores: estado, medio de ida y de vuelta, día de excursión, entradas abiertas o cerradas, completa o gratis, y las hojas). Del diseño se copia lo visual. Los datos y las reglas son los nuestros: en el diseño todo es de ejemplo (Barcelona, las fechas, Pompeya, las horas).

0. EL INTERRUPTOR DE PAGO
- Un solo interruptor para toda la app, en un solo sitio (por ejemplo, un dato de configuración `pagoActivo`). Ahora va encendido, para hacer las pruebas.
- Para ver la versión gratis sin tocar nada: añadiendo `?version=gratis` al final de la dirección. Y `?version=completa` para volver.
- Lo de pago de esta tanda: el bloque «Llegada y vuelta», la pregunta de la zona, el resumen de arriba y lo de la barra de llegada del punto 8. Con el interruptor apagado no sale nada de eso, sin candados ni avisos.
- A INVARIANTES: «Todo lo de pago va detrás del mismo interruptor».

1. EL ORDEN DE RESERVAS
De arriba abajo:
1. el resumen (solo de pago);
2. Llegada y vuelta (solo de pago);
3. Alojamiento;
4. Entradas y Free Tour;
5. Excursiones;
6. Útil para el viaje.

Fuera de RESERVAS:
- el banner amarillo de arriba («¡Corre que vuelan!»);
- la tarjeta oscura «Tu primer y último día» (`FirstLastDayCard`);
- las filas sueltas de transporte («Barcelona → Roma [Reservar]»);
- la fila del alojamiento de ahora (el hotel de ejemplo).

Ojo: la hoja «¿Ajustamos tu ruta a tu vuelo?» y lo que hace en DÍAS se quedan como están. Las quitará la Tanda 7. Que no se rompa nada al quitar la tarjeta de RESERVAS.

Si RESERVAS tiene hoy otras filas que no salen aquí (el alquiler de coche, por ejemplo), pásalas a «Útil para el viaje» y dime cuáles eran. Los viajes de varios destinos: que no se rompan; con un destino, como en el diseño.

2. EL RESUMEN (de pago)
- «Tu viaje a Roma · 1 de 3 listo», con la barra y tres fichas: Llegada y vuelta · Alojamiento · Entradas 1/8.
- Una ficha está hecha (verde con ✓):
  - la llegada y vuelta, cuando las dos tienen hora y punto (o el medio es coche);
  - el alojamiento, con una zona elegida («Aún no lo sé» no cuenta);
  - las entradas, cuando están todas las de su bloque.
- Al tocar una ficha, la pantalla baja a su bloque y lo abre.
- En la gratis no hay resumen.

3. LLEGADA Y VUELTA (de pago)
- Una sola tarjeta de embarque con dos mitades, la ida y la vuelta, como en el diseño.
- El medio de cada mitad sale de lo que eligió el viajero en el formulario (`tripModes`). La ida y la vuelta pueden ser distintas.
- Los botones de cada medio, con los puntos de `data/dias/roma/_llegada.json`:
  - avión: Fiumicino · Ciampino;
  - tren: Termini · Tiburtina;
  - autobús: Tiburtina · Termini;
  - barco: Civitavecchia, sin botones;
  - coche: sin hora, solo «Llegas en coche» / «Te vas en coche».
  Si el autobús no tiene sus puntos en `_llegada.json`, usa los del tren (los mismos tiempos hasta la zona) y dímelo.
- Ningún punto viene marcado de serie. Sin elegir, la mitad pregunta («¿Fiumicino o Ciampino?», «¿Termini o Tiburtina?»).
  - Si hoy la app guarda Fiumicino de serie al crear un viaje, deja de hacerlo en los viajes nuevos. Los que ya existen se quedan como están.
- Se guarda en lo que ya existe: `arrivalFlightTime`, `departureFlightTime`, `arrivalPointId`, `departurePointId`.
- La hora, con el selector de hora de la app (el de la 6k).
- Debajo de cada hora, en pequeño, «¿Llegas o te vas otro día? Cambia las fechas del viaje», que abre el cambio de fechas que ya existe.
- Debajo de la tarjeta: «¿Aún no tienes vuelo? Buscar vuelos» («Buscar tren», «Buscar autobús» o «Buscar ferry», según el medio), con el enlace que hoy usan las filas de transporte.
- Abierto y cerrado:
  - todo vacío: el bloque, cerrado, con su icono, «Llegada y vuelta», «Barcelona → Roma» (su origen), la etiqueta «Falta» y la flecha;
  - al abrirlo, se abre la mitad que falta; la que está hecha queda en una línea con «Cambiar»;
  - todo hecho: cerrado en dos líneas cortas con «Cambiar»:
    - «✈ Ida · mar 10 · 11:15 · Fiumicino · libre hacia las 13:15»
    - «✈ Vuelta · sáb 14 · 18:05 · Ciampino»
- El «libre hacia las…»: con el mismo cálculo que ya usa la tarjeta vieja del primer y el último día. Sin hora, la línea no lo pone.
- Si falta una mitad, su línea dice «Vuelta · sáb 14 · Añadir» (o «Ida…»). Nunca «null», «undefined» ni un hueco vacío.
- La etiqueta de la derecha: «Falta la ida», «Falta la vuelta», «Falta» o «✓ Listo».
- Sin fechas: «Ida · Día 1 · 11:15 · Fiumicino».
- Dentro de «Cambiar», abajo del todo, en rojo y en texto: «Eliminar vuelo» (para la ida y para la vuelta, cada una por su lado). Pregunta en la misma hoja: «¿Seguro que quieres eliminar este vuelo?» [Eliminar] · [Cancelar]. Al eliminar, se borran la hora y el punto de esa mitad, y los días se quedan como están.
- Lo que se guarde aquí todavía no cambia la ruta: eso es de la Tanda 7. Hoy sigue haciendo lo mismo que hacen las horas de vuelo de ahora.

4. ALOJAMIENTO
Gratis:
- Una fila: el icono, «Alojamiento», «Buscar alojamiento en Roma» y la flecha «›».
- Al tocarla, se abre la hoja «Alojamiento en Roma», que sube desde abajo, con su tirador y su cruz, y el mapa de alojamientos dentro (punto 5).

De pago: un desplegable, como el de entradas, con estos estados:
- sin elegir: cerrado, el icono, «Alojamiento», la etiqueta «Falta» y la flecha;
- abierto: «¿En qué zona te alojas?» y las siete fichas:
  - Centro (Panteón, Trevi, Navona)
  - Plaza de España (Popolo, Via del Corso)
  - Prati (Vaticano)
  - Trastevere
  - Termini
  - Monti (Coliseo)
  - Aún no lo sé
- con una zona: en verde, «Te alojas en Prati · Cambiar», y cuenta como hecho. No ofrece buscar;
- con «Aún no lo sé»: sin verde y sin contar como hecho; pone «Aún no sabes dónde te alojas», con [Buscar alojamiento] (abre la hoja del mapa) y «Cambiar».

La zona se guarda con el viaje (por ejemplo, `accommodationZone`). Todavía no cambia la ruta: la usará la Tanda 7 («Aún no lo sé» contará como Centro).

5. EL MAPA DE ALOJAMIENTOS
- Va dentro de la hoja, a lo ancho, con unos 428 px de alto y las esquinas redondeadas, como el hueco del diseño.
- El mismo sitio para todos: Roma. En la de pago también, aunque haya zona (quien elige zona ya tiene dónde dormir).
- El enlace:
  https://www.stay22.com/embed/gm?aid=viajesbengala&address=Roma&checkin=AAAA-MM-DD&checkout=AAAA-MM-DD&campaign={código}&ljs=es&currency=EUR&hidemodeswitcher=true
  - `checkin` es el primer día del viaje y `checkout` el último (el de la vuelta). Sin fechas, sin esos dos.
  - `campaign`: el mismo código de campaña del viaje que ya ponen los enlaces de entradas (`campaignCode`). Si no hay, `Routy`.
  - Sin personas: se eligen dentro del mapa.
- El usuario ha creado este mapa en su panel: https://www.stay22.com/embed/6ac8bf7c73890e8abbbe9a61. Prueba primero si acepta los mismos datos añadidos al final (fechas y campaña). Si los acepta, usa ese. Si no, el de arriba.
- Si la app bloquea meter páginas de otras webs dentro, deja pasar stay22.com.
- Que los nombres de las webs de reserva salgan dentro del mapa no importa: es el mapa, no un texto nuestro.

6. ENTRADAS Y FREE TOUR
- El bloque sale cerrado de entrada, con el icono, «Entradas y Free Tour», «1 de 8 reservadas», la barra y la flecha. Al tocarlo, se despliega.
- El orden, siempre este, y solo las que estén en la ruta del viajero:
  - arriba: Coliseo, Foro y Palatino · Museos Vaticanos y Capilla Sixtina · Panteón · Free Tour por Roma;
  - en «Ver 4 más»: Cúpula de San Pedro · Galería Borghese · Termas de Caracalla · Castillo de Sant'Angelo.
  - El número de «Ver n más» y el «x de n» salen de las que hay en la ruta.
  - Es un dato del destino, no del código (por ejemplo, `entradas_reservas` con las dos listas).
- Todas juntas, sin títulos de día.
- Sin reservar: la tarjeta de la 6m con, arriba, «ENTRADA · En tu ruta el mié 11» (sin fechas: «En tu ruta el día 2»), [Reservar entrada] (en el Free Tour, [Reservar Free Tour]) y «¿Ya la tienes? Añádela».
- Reservada: una línea verde, «✓ Coliseo, Foro y Palatino · 11 ago · 10:00 · Cambiar» (sin fechas: «Día 2 · 10:00»).

7. LA HOJA DE LA HORA («Añádela» y «Cambiar», en entradas, Free Tour y excursiones)
- Fuera la línea fija del día de debajo del nombre.
- Arriba, los días del viaje en fichas que se deslizan de lado («Mar 10», «Mié 11»…; sin fechas, «Día 1», «Día 2»…):
  - el día que tiene en la ruta, ya marcado, con «En tu ruta» en pequeño;
  - se puede dejar ese o tocar otro. Si elige otro, al guardar se cambian los dos días enteros, como ya hace la app (6k);
  - si ese día el sitio está cerrado (con los horarios de los datos), la ficha sale apagada con «Cerrado» y no se puede tocar.
- La rueda de horas, la de la 6m. Sus horas cambian según el día elegido (las de verdad de ese día). En el Free Tour, sus cinco horas.
- [Guardar · 10:00].
- Debajo de la rueda, en pequeño: «Rellenar desde el email o el PDF» (lo que ya existe).
- En «Cambiar», abajo del todo, «Eliminar reserva», como en la 6m.
- Fuera «¿Es para otro día? Cambiar el día» de la 6m: lo sustituyen las fichas de días.

8. LA BARRA DE LLEGADA Y DE VUELTA (en DÍAS)
- Gratis: la barra sale como ahora («LLEGADA · AVIÓN DESDE BARCELONA»), pero sin «+ AÑADIR VUELO», porque llevaría a un bloque que no se ve. Solo la flecha «›», que abre la ventana de llegada con todo, como ahora. Igual en la barra de la vuelta.
- De pago, como ahora. Y con el punto elegido, la ventana de llegada (`ArrivalReturnSheet`) enseña solo ese punto, y abajo, en pequeño, «¿Llegas por otro sitio? Ver Ciampino» (o el otro punto de ese medio). Sin punto elegido, todo, como en la gratis. Mira antes si ya filtra por `arrivalPointId` / `departurePointId`.

9. EXCURSIONES
- Viajes de menos días que `excursiones_desde_dias` (Roma: 0 a 3 días): el bloque no sale, como ahora.
- Con el día de excursión en la ruta (el interruptor del día en Excursión):
  - solo la tarjeta de esa excursión, con la tarjeta de entrada: «EXCURSIÓN · En tu ruta el jue 12», el nombre, [Reservar excursión] · «¿Ya la tienes? Añádela»;
  - debajo, en pequeño, «Ver otras excursiones», que abre la página de excursiones.
- Sin día de excursión (4 días o más con el interruptor en Roma):
  - solo «Excursiones desde Roma · {n} excursiones» [Ver excursiones];
  - debajo, en pequeño, «¿Ya tienes una? Añádela».
- Nunca dos «Añádela» en el bloque.
- «¿Ya tienes una? Añádela» abre una hoja:
  1. «¿Qué excursión tienes?», con las excursiones de `_excursiones.json`, su foto pequeña, el nombre y «Día completo» / «Medio día»;
  2. al elegir una, la hoja de la hora del punto 7, con «HORA DE RECOGIDA» en la rueda.
  - Al guardar, se coloca en ese día como cuando se elige día desde la página de excursiones (`WhereSheet`). Si es el día del interruptor, pasa a Excursión solo.
- Ya añadida: «✓ Pompeya · 12 ago · recogida 7:15 · Cambiar». En «Cambiar», también «Eliminar reserva»: al eliminar, la tarjeta vuelve a estar sin reservar y el día se queda como está (el interruptor no se mueve).
- Si quiere volver el día a Roma con la excursión reservada, el aviso que ya existe («Cancela primero tu reserva»).

10. ÚTIL PARA EL VIAJE
- El título «Útil para el viaje», con más aire encima.
- Debajo, una fila de tarjetas pequeñas que se desliza de lado, en este orden:
  - Seguro de viaje (5 % dto.)
  - eSIM Italia (5 % dto.)
  - Tarjeta sin comisiones
  - en la gratis, al final, «Buscar vuelos»
- Los enlaces, los de ahora.

11. TODO LO QUE SE RESERVA SE PUEDE ELIMINAR
Entradas, Free Tour, excursiones y vuelos: dentro de su «Cambiar», abajo, en rojo y en texto, con la pregunta en la misma hoja. Al eliminar, nada se mueve. A INVARIANTES.

12. TEXTOS
- Nunca el nombre de un proveedor en lo que lee el viajero.
- Ni «centro» suelto: sí en el nombre de la zona «Centro (Panteón, Trevi, Navona)».

13. PRUEBAS
- Las de siempre a 0 fallos: 6g, 6h, 6i, 6j, 6k, 6l, la de la 6o, la 6r y pruebaListas.
- Una prueba 6s nueva que compruebe:
  - con `?version=gratis`, 0 rastros de lo de pago en RESERVAS y en la barra;
  - 0 «null» o «undefined» en RESERVAS, en todos los estados;
  - el orden y el número de entradas en viajes de 1 a 6 días;
  - el bloque de excursiones según los días y el interruptor;
  - que eliminar una reserva no mueve ningún día.
- A mano, a 375 px, 390 px y en el ordenador, completa y gratis, con y sin fechas:
  - todo vacío (todo cerrado), a medias y casi todo hecho;
  - ida en avión y vuelta en tren, autobús, barco y coche;
  - Fiumicino y Ciampino, y la línea cerrada sin la vuelta;
  - las tres zonas («Prati», «Aún no lo sé», nada) y la hoja del mapa (que cargue con las fechas del viaje);
  - «Añádela» y «Cambiar» con otro día, y con un día «Cerrado»;
  - añadir una excursión con el interruptor en Roma;
  - eliminar una entrada, una excursión y un vuelo.
- Pon capturas en el informe.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6s en docs/dias, en palabras sencillas, y commits locales por bloques. Lo que decidas tú, a PREGUNTAS. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
