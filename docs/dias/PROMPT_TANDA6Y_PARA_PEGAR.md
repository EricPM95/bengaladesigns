Tanda 6y: la ruta a mano («Quiero hacerla yo») y el botón «Reorganizar». Va todo en este archivo. TODAVÍA NO: empieza solo cuando Eric te lo diga. Gratis y de pago igual: no va detrás del interruptor de pago (salvo lo que ya es de pago en toda la app: HOY, «Cerca de mí», la llegada y vuelta y la zona).

Este prompt está al día con las reglas nuevas (sin cuentas al minuto, la app avisa y no prohíbe, los días por su fecha, HOY de pago). Este es el bueno: si tienes el viejo en la cabeza, manda este.

IMPORTANTE (Eric, 10-oct): nada de viajes de varios destinos hasta que Roma esté entera curada y lista para lanzar (la ruta, RESERVAS, las llegadas, todo). Hasta entonces, trata Roma como si no hubiera nada más.

1. LA PANTALLA DE ELEGIR, ANTES DE LAS EXPERIENCIAS (Eric, 11-oct)
- El formulario va hoy así: la ruta (origen y destino), el transporte, las fechas, quién viaja, las experiencias, el pool de sitios y el resumen. La pantalla de elegir va justo después de «quién viaja» (StepCompanion) y antes de las experiencias (StepExperiences).
- Por qué: las experiencias y el pool sirven para que nosotros montemos la ruta a su gusto. Si la hace él a mano, no hacen falta.
  - [¡Sí, hazla por mí!] sigue como ahora: las experiencias, el pool, el resumen y su ruta (que se sigue montando por detrás en el resumen, como ahora).
  - [Quiero hacerla yo] se salta las experiencias y el pool, y va a un resumen corto (destino, fechas, quién viaja y transporte, sin experiencias ni sitios) con [Empezar mi ruta], que abre la ruta a mano. No se monta ninguna ruta por detrás.
- La flecha de atrás de la pantalla de elegir vuelve a «quién viaja»; la de las experiencias y la del resumen corto, a la pantalla de elegir.
- Sin experiencias, todo lo que hoy las usa tiene que seguir funcionando (EXPLORAR, la hoja del Free Tour, el plan de las reservas, lo de temporada…), con lo de siempre por defecto. Dime en el informe qué usaba las experiencias y qué hace ahora sin ellas.
- El diseño está en docs\diseno\ruta_manual\ (Itinerario Eleccion.dc.html y su support.js). Se copia lo visual: el mapa dibujado con los tres días, la tarjeta oscura con «RECOMENDADO» y la flecha, y la tarjeta blanca con el lápiz. Con los iconos de la familia de la 6z3 y el frambuesa de la app. Los textos son estos:
  - arriba, pequeño: «{destino} · {n} días» (del formulario);
  - el título: «¿Te montamos el itinerario día a día?», con «día a día» resaltado como en el diseño;
  - tarjeta 1: «¡Sí, hazla por mí!», con «Lo hacemos todo: el orden de cada día, los tiempos entre sitios, dónde comer y qué reservar.». Abre la ruta como ahora;
  - tarjeta 2: «Quiero hacerla yo», con «Crea una ruta a tu gusto: tú eliges los sitios y el orden, y compártela con tus amigos.» (compartir viajes llega antes de lanzar la app);
  - el aviso corto al tocar: «Creando tu itinerario…» o «Preparando tu viaje…».

2. LA RUTA A MANO
Es el mismo viaje del formulario (destino, fechas, días, quién viaja, origen, medio de ida y de vuelta), sin experiencias ni sitios elegidos, y con los días vacíos, para que los monte el viajero. El viajero decide todo: la app no le sugiere paradas ni le dice qué paradas le faltan.
- Los días salen como ahora, en acordeón, y con su nombre como en nuestra ruta: con fechas, por su fecha («lun 13 oct»); sin fechas, «Día 1», «Día 2»… Se pueden renombrar como ahora (DayNameSheet). Vacíos por dentro. Cada día es un día propio (`dayType: 'manual'`).
- Dentro de cada día vacío, dos botones:
  - [Añadir parada]: abre EXPLORAR con nuestra lista completa del destino, ordenada así: primero las que tienen más «me gusta» de verdad (`place_likes`; los números de prueba, solo con `?prueba=1`, nunca en producción), luego los imprescindibles, luego las de nivel 1 y luego el resto. Se pueden marcar varias a la vez (el modo de elegir varios sitios de la 6g, y el «+» de las tarjetas de la 6z) y van a ese día. Las que ya están en otro día del viaje llevan la etiqueta verde de la 6z con su día: «En tu día 2» (con fechas, «En tu lun 13»).
  - [Añadir excursión]: abre nuestra página de excursiones. La que elija va a ese día, como día de excursión (`placeExcursionIn`).
- Con paradas ya puestas, el día se ve como cualquier otro, con [Añadir parada] al final. [Añadir excursión] solo sale en los días vacíos.
- Cada tarjeta de parada, como en nuestra ruta: su horario y su última entrada en pequeño (6z5), «Cerrado ese día» si cierra ese día (regla 5: solo avisa, no quita nada) y «Hoy cierra a las 14:00» en los días especiales.
- Nada de hoja de «¿Tienes algo ya reservado?» al empezar: las reservas se añaden como en nuestra ruta, con la pestañita de la entrada en la parada o en RESERVAS («¿Ya la tienes? Añádela»), y cada una se queda a la hora que puso el viajero.
- La app no mete nada sola (6r) ni enseña «Te falta…» ni sugerencias de paradas en la ruta. RESERVAS, igual que siempre (con su «x de 3 listo» o «x de 2», que es de reservas, no de paradas).
- El orden del viajero se respeta: la app no reordena nada sola, ni por las reservas. Una reserva va donde la ponga el viajero, con su «Llegada a…» delante (regla 4), y lo demás queda en el orden que él ha puesto. Sin cuentas al minuto: nada se mueve ni se quita por la hora. Para ordenar, el botón «Reorganizar» (punto 3).
- Los avisos, los de nuestra ruta (regla 17), y ninguno cambia nada:
  - «coinciden», cuando dos reservas se pisan de verdad;
  - «vas justo», solo entre dos reservas del viajero del mismo día (sin contar las paradas);
  - «Hoy es un día completo: te recomendamos madrugar», con la misma regla que en nuestra ruta;
  - «Ese día (25 dic) el Coliseo cierra a las 14:00. Revisa tu reserva.» en los días especiales.
- Ninguna hora calculada a la vista, como en la 6x (franjas, comida y cena sin hora).
- Los precios y el presupuesto, igual que en nuestra ruta (6z2 y 6z6b): lo que se añade puede llevar su precio, suma al presupuesto y lanza la pastilla que vuela a la cartera. El Free Tour, sin precio.
- Las fotos, HOY (de pago), DÍAS abriéndose en hoy durante el viaje y el globo del Perfil: igual que con nuestra ruta.
- Lo de reservar y los afiliados, igual que en nuestra ruta:
  - la pestañita de la entrada en cada parada que la tenga;
  - RESERVAS entero: «EN TU RUTA» cuenta las entradas de su ruta, el alojamiento, las excursiones y «Útil para el viaje»;
  - los mismos códigos de afiliado y la misma campaña del viaje (`stampCivitatis` / `CampaignLinks`, `cmp=app-…`, Stay22 con `viajesbengala`);
  - en la de pago, la barra de llegada y vuelta y la zona, como ahora.

3. EL BOTÓN «REORGANIZAR» (en la ruta a mano y en la nuestra), CON NUESTROS DÍAS ESCRITOS
La idea (de Eric): no ordenamos «a ciegas» por el mapa. Cada parada ya está en algún día escrito del documento, dentro de su grupo y en su orden. Reorganizar junta las paradas del viajero con su grupo y las pone en el orden que nosotros ya escribimos.
- **Solo ordena, nunca rellena huecos.** Usa nuestros días escritos solo para saber el orden: no añade ninguna parada de ellos. Si el viajero pone el Coliseo y el Altar, quedan Coliseo → Altar, sin meter entre medio el Foro y el Palatino, el Arco de Constantino ni nada más. Tampoco añade «Llegada a…» si el viajero no tiene la reserva.
- Los grupos salen del documento, con el convertidor: cada parte de cada día escrito es un grupo, con sus paradas en su orden. Por ejemplo: la Roma antigua del D1 (Coliseo, Foro y Palatino, Piazza Venezia, Altar…), la parte del Vaticano (Museos, Plaza de San Pedro, Basílica…), Trastevere, el centro (Trevi, Panteón, Navona…).
  - Si una parada está en varios días escritos, va al grupo donde estén más paradas de ese día del viajero.
  - Si una parada no está en ningún día escrito, va junto al grupo que le quede más cerca andando.
  - Nada escrito a mano en el código: si cambiamos el documento, cambian los grupos.
- Dónde sale: en cada día con dos paradas o más, junto a [Añadir parada], el botón «Reorganizar este día».
- Cómo ordena el día, por pasos (sin cuentas al minuto, como el motor desde la 6z5):
  1. Lo reservado: su hora solo decide en qué fila de su tabla del documento cae (el Coliseo, los Museos, la Galería, el Free Tour). Con esa fila, su grupo va como en esa lista (por ejemplo, la Basílica antes o después de los Museos, el Foro antes o después del Coliseo), con su «Llegada a…» delante. Una reserva de mañana va en la parte de la mañana; una de tarde, en la de la tarde.
  2. Dentro de cada grupo, el orden de nuestro día escrito.
  3. Los grupos entre sí (esto es lo que no está escrito tal cual, porque el viajero mezcla grupos de días distintos):
     - si dos grupos van juntos en algún día escrito, en ese orden (por ejemplo, el Vaticano y luego Trastevere, como en el D2; la Roma antigua y el centro, como en el D1);
     - lo de primera hora sin gente, al principio (Trevi sin gente);
     - Trastevere, al final de la tarde, con el paseo antes de la cena (regla 10);
     - las nocturnas, por la noche (reglas 11 y 13);
     - el resto, por cercanía entre grupos, sin volver atrás (sin zigzag).
     - Si chocan, manda por este orden: lo reservado; luego los momentos (sin gente al principio, Trastevere al final, las nocturnas de noche); luego los grupos que ya van juntos en un día escrito; y por último la cercanía.
  4. Los horarios no mueven nada: lo que cierra ese día o cierra pronto lleva su aviso en la tarjeta (regla 5 y 6z5), y decide el viajero.
  5. Si el día ya tiene comida o cena (las puso el viajero o «Crear mi propio día»), la comida va donde la pone nuestra lista: entre la parte de la mañana y la de la tarde; y la cena, al final, después de lo de la tarde y antes de las nocturnas. Si no las tiene, no se añaden.
  Ejemplo: el viajero pone en un día «Coliseo, Altar, Museos, Trastevere, Fontana de Trevi», sin reservas. Sale: Fontana de Trevi sin gente → Coliseo → Altar (la Roma antigua, en nuestro orden) → Museos (el Vaticano) → Trastevere. Las mismas cinco paradas, solo ordenadas. Por qué: Trevi va primero porque es «sin gente»; Coliseo antes que Altar, por el D1; de Trevi está más cerca la Roma antigua que el Vaticano; el Vaticano y luego Trastevere, por el D2; Trastevere al final, por la cena.
  Segundo ejemplo: las mismas paradas, con los Museos reservados a las 9:00. Sale: Fontana de Trevi sin gente → «Llegada a…» y los Museos a las 9:00 → Coliseo → Altar → Trastevere. Si con eso va justo, no pasa nada: la app no calcula si llega.
  Si los Museos cierran ese día (domingo), no se quitan: «Cerrado ese día» en la tarjeta, y decide el viajero.
- Si el viajero tiene la zona del alojamiento (versión de pago), y no hay nada de primera hora ni reservado, el día empieza por el grupo más cerca de ella.
- Nunca añade nada, nunca quita nada, nunca mueve paradas a otro día y nunca manda nada a «Si te sobra tiempo».
- Al acabar, el aviso «Día reorganizado» con [Deshacer] (el UndoToast que ya hay). Deshacer deja el día exactamente como estaba.
- Si el día ya está en buen orden, el aviso dice «Tu día ya está en buen orden» y no cambia nada.
- «Crear mi propio día» de la 6g usa esta misma forma de ordenar (un solo sitio en el código).
- En nuestra ruta sirve para los días que el viajero ha cambiado a mano. Pulsar «Reorganizar» no cambia si el día cuenta como cambiado a mano o no: un día cambiado a mano sigue siéndolo (y no se toca cuando una reserva pasa un bloque de día); uno que no lo era, tampoco pasa a serlo.

4. PRUEBAS
- Las de siempre a 0 fallos (con la 6r, 6s, 6t, 6u, 6v, 6w, 6x, 6z, 6z2, 6z3, 6z4, 6z5, 6z6, 6z6b, 6z6c y 6z6d).
- Una prueba 6y, con viajes a mano de 2, 3, 4 y 5 días, con y sin fechas y con y sin reservas, en la gratis y en la de pago:
  - con «Quiero hacerla yo», el formulario no pasa por las experiencias ni por el pool, y no se monta ninguna ruta por detrás;
  - sin experiencias, EXPLORAR, el Free Tour y las reservas funcionan sin errores;
  - 0 paradas puestas por la app que no haya elegido el viajero;
  - el orden del viajero se queda igual hasta que toca «Reorganizar», también al añadir una reserva;
  - «Reorganizar» no quita nada, no mueve de día y no manda nada a «Si te sobra tiempo»;
  - «Reorganizar» deja exactamente las mismas paradas (ni una más ni una menos; «Llegada a…» solo con reserva);
  - «Deshacer» deja el día igual que antes;
  - las reservas, a la hora del viajero;
  - los días por su fecha cuando hay fechas;
  - los enlaces de afiliado, con los mismos códigos que en nuestra ruta;
  - «EN TU RUTA», con las entradas de su ruta;
  - lo añadido con precio suma al presupuesto;
  - 0 horas calculadas a la vista;
  - 0 «Te falta…» ni sugerencias de paradas en la ruta a mano.
- La prueba de «Reorganizar»:
  - con nuestros días escritos: coge cada día (D0 a D7, sin reservas y con algunas), desordena sus paradas al azar 20 veces y pulsa «Reorganizar». Tiene que salir nuestro orden escrito;
  - con días mezclados, como los haría un viajero: 200 días al azar con 4 a 8 paradas de grupos distintos. Dime en el informe si sale algún zigzag, alguna nocturna de día, alguna comida al final o al principio del día, Trastevere antes de mediodía o algún grupo partido en dos. Pon 5 ejemplos en el informe, en palabras sencillas (lo que puso el viajero y cómo quedó).
  - Si algo sale mal, explícame por qué y no lo arregles a mano día a día.
- A mano, a 375 px, con el panel de pruebas, gratis y de pago:
  - la pantalla de elegir, después de «quién viaja», con los dos caminos (el de «hazla por mí» con experiencias, pool y resumen; el de «quiero hacerla yo» sin ellos, con el resumen corto) y las flechas de atrás;
  - los días vacíos en acordeón (con fechas, por su fecha), con [Añadir parada] y [Añadir excursión];
  - EXPLORAR en el orden nuevo, eligiendo varias, con «En tu día…»;
  - una excursión añadida a un día, con precio (y la pastilla a la cartera);
  - «Reorganizar» con «Deshacer».
  Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
