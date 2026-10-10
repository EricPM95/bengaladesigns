Tanda 6y: la ruta a mano («Quiero hacerla yo») y el botón «Reorganizar». Va todo en este mensaje. Empieza cuando esté subida la 6z3. Gratis y de pago igual: no va detrás del interruptor de pago.

El diseño ya está en docs\diseno\ruta_manual\ (Itinerario Eleccion.dc.html y su support.js; lo subiste en la 6z).

1. LA PANTALLA DE ELEGIR, AL FINAL DEL FORMULARIO
- Va después del resumen (StepSummary). El botón del resumen, «VER MI RUTA», pasa a «CONTINUAR» y abre esta pantalla. La flecha de atrás vuelve al resumen.
- La ruta se sigue montando por detrás en el resumen, como ahora.
- Del diseño se copia lo visual: el mapa dibujado con los tres días, la tarjeta oscura con «RECOMENDADO» y la flecha, y la tarjeta blanca con el lápiz. Los textos son estos:
  - arriba, pequeño: «{destino} · {n} días» (del formulario);
  - el título: «¿Te montamos el itinerario día a día?», con «día a día» resaltado como en el diseño;
  - tarjeta 1: «¡Sí, hazla por mí!», con «Lo hacemos todo: el orden de cada día, los tiempos entre sitios, dónde comer y qué reservar.». Abre la ruta como ahora;
  - tarjeta 2: «Quiero hacerla yo», con «Crea una ruta a tu gusto: tú eliges los sitios y el orden, y compártela con tus amigos.» (compartir viajes llega antes de lanzar la app);
  - el aviso corto al tocar: «Creando tu itinerario…» o «Preparando tu viaje…».

2. LA RUTA A MANO
Es el mismo viaje del formulario (destino, fechas, días, origen, medio de ida y de vuelta), pero con los días vacíos, para que los monte el viajero. El viajero decide todo: la app no le sugiere nada ni le dice lo que le falta.
- Los días salen como ahora, en acordeón («Día 1», «Día 2»…, que se pueden renombrar como ahora con DayNameSheet), pero vacíos por dentro. Cada día es un día propio (`dayType: 'manual'`).
- Dentro de cada día vacío, dos botones:
  - [Añadir parada]: abre EXPLORAR con nuestra lista completa del destino, ordenada así: primero las que tienen más «me gusta» (`place_likes`), luego los imprescindibles, luego las de nivel 1 y luego el resto. Se pueden marcar varias a la vez (el modo de elegir varios sitios de la 6g) y van a ese día. Las que ya están en otro día del viaje llevan «En tu día {n}».
  - [Añadir excursión]: abre nuestra página de excursiones. La que elija va a ese día, como día de excursión (`placeExcursionIn`).
- Con paradas ya puestas, el día se ve como cualquier otro, con [Añadir parada] al final. [Añadir excursión] solo sale en los días vacíos.
- Nada de hoja de «¿Tienes algo ya reservado?» al empezar: las reservas se añaden como en nuestra ruta, con la pestañita naranja de la parada o en RESERVAS («¿Ya la tienes? Añádela»), y cada una va a su hora.
- La app no mete nada sola (6r) ni enseña «Te falta…» ni sugerencias: solo lo que el viajero elige.
- El orden del viajero se respeta: la app no reordena nada sola. Solo coloca lo reservado a su hora (con su margen, regla 4); lo demás queda en el orden que él ha puesto. Para ordenar, el botón «Reorganizar» (punto 3).
- Los avisos de siempre también aquí: «coinciden» y «vas justo» (regla 17), y «Cerrado ese día» en la tarjeta si una parada cierra ese día (regla 5: solo avisa, no quita nada; el viajero decide).
- Ninguna hora calculada a la vista, como en la 6x (franjas, comida y cena sin hora).
- Lo de reservar y los afiliados, igual que en nuestra ruta:
  - la pestañita naranja de la entrada en cada parada que la tenga;
  - RESERVAS entero: «EN TU RUTA» cuenta las entradas de su ruta, el alojamiento, las excursiones y «útil»;
  - los mismos códigos de afiliado y la misma campaña del viaje (`stampCivitatis` / `CampaignLinks`, `cmp=app-…`, Stay22 con `viajesbengala`);
  - en la de pago, la barra de llegada y vuelta y la zona, como ahora.

3. EL BOTÓN «REORGANIZAR» (en la ruta a mano y en la nuestra), CON NUESTROS DÍAS ESCRITOS
La idea (de Eric): no ordenamos «a ciegas» por el mapa. Cada parada ya está en algún día escrito del documento, dentro de su grupo y en su orden. Reorganizar junta las paradas del viajero con su grupo y las pone en el orden que nosotros ya escribimos.
- **Solo ordena, nunca rellena huecos.** Usa nuestros días escritos solo para saber el orden: no añade ninguna parada de ellos. Si el viajero pone el Coliseo y el Altar, quedan Coliseo → Altar, sin meter entre medio el Foro y el Palatino, el Arco de Constantino ni nada más.
- Los grupos salen del documento, con el convertidor: cada parte de cada día escrito es un grupo, con sus paradas en su orden. Por ejemplo: la Roma antigua del D1 (Coliseo, Foro y Palatino, Piazza Venezia, Altar…), la parte del Vaticano (Museos, Plaza de San Pedro, Basílica…), Trastevere, el centro (Trevi, Panteón, Navona…).
  - Si una parada está en varios días escritos, va al grupo donde estén más paradas de ese día del viajero.
  - Si una parada no está en ningún día escrito, va junto al grupo que le quede más cerca andando.
  - Nada escrito a mano en el código: si cambiamos el documento, cambian los grupos.
- Dónde sale: en cada día con dos paradas o más, junto a [Añadir parada], el botón «Reorganizar este día».
- Cómo ordena el día, por pasos:
  1. Lo reservado, fijo a su hora, con su margen (regla 4). Su grupo va alrededor de la reserva, como en nuestras listas por hora (por ejemplo, la Basílica antes o después de los Museos según la hora, el Foro antes o después del Coliseo).
  2. Dentro de cada grupo, el orden de nuestro día escrito.
  3. Los grupos entre sí (esto es lo que no está escrito tal cual, porque el viajero mezcla grupos de días distintos):
     - si dos grupos van juntos en algún día escrito, en ese orden (por ejemplo, el Vaticano y luego Trastevere, como en el D2; la Roma antigua y el centro, como en el D1);
     - lo de primera hora sin gente, al principio (Trevi sin gente);
     - Trastevere, al final de la tarde, con el paseo antes de la cena (regla 10);
     - las nocturnas, por la noche (reglas 11 y 13);
     - el resto, por cercanía entre grupos, sin volver atrás (sin zigzag), contando lo que se tarda andando de verdad.
     - Si chocan, manda por este orden: lo reservado; luego los momentos (sin gente al principio, Trastevere al final, las nocturnas de noche); luego los grupos que ya van juntos en un día escrito; y por último la cercanía.
  4. Los horarios de apertura de ese día: si un grupo no puede ir donde le toca porque algo cierra, se cambia de sitio con otro grupo.
  5. Si el día ya tiene comida o cena (las puso el viajero o «Crear mi propio día»), la comida va antes de las 15:00, donde vaya la ruta a esa hora, y la cena donde acaba. Si no las tiene, no se añaden.
  Ejemplo: el viajero pone en un día «Coliseo, Altar, Museos, Trastevere, Fontana de Trevi», sin reservas. Sale: Fontana de Trevi sin gente → Coliseo → Altar (la Roma antigua, en nuestro orden) → Museos (el Vaticano) → Trastevere. Las mismas cinco paradas, solo ordenadas. Por qué: Trevi va primero porque es «sin gente»; Coliseo antes que Altar, por el D1; de Trevi está más cerca la Roma antigua que el Vaticano; el Vaticano y luego Trastevere, por el D2; Trastevere al final, por la cena.
  Segundo ejemplo: las mismas paradas, con los Museos reservados a las 9:00. Sale: Fontana de Trevi sin gente → Museos a las 9:00 (con su margen) → Coliseo → Altar → Trastevere.
  Si los Museos cierran ese día (domingo), no se quitan: «Cerrado ese día» en la tarjeta, y decide el viajero.
- Si el viajero tiene la zona del alojamiento (versión de pago), y no hay nada de primera hora ni reservado, el día empieza por el grupo más cerca de ella.
- Nunca añade nada, nunca quita nada, nunca mueve paradas a otro día y nunca manda nada a «Si te sobra tiempo».
- Al acabar, el aviso «Día reorganizado» con [Deshacer] (el UndoToast que ya hay). Deshacer deja el día exactamente como estaba.
- Si el día ya está en buen orden, el aviso dice «Tu día ya está en buen orden» y no cambia nada.
- «Crear mi propio día» de la 6g usa esta misma forma de ordenar (un solo sitio en el código).
- En nuestra ruta sirve para los días que el viajero ha cambiado a mano. Reorganizar no cuenta como cambiar el día a mano.

4. PRUEBAS
- Las de siempre a 0 fallos (con la 6r, 6s, 6t, 6u, 6v, 6w y 6x).
- Una prueba 6y, con viajes a mano de 2, 3, 4 y 5 días, con y sin fechas y con y sin reservas:
  - 0 paradas puestas por la app que no haya elegido el viajero;
  - el orden del viajero se queda igual hasta que toca «Reorganizar»;
  - «Reorganizar» no quita nada, no mueve de día y no manda nada a «Si te sobra tiempo»;
  - «Deshacer» deja el día igual que antes;
  - las reservas, a su hora;
  - los enlaces de afiliado, con los mismos códigos que en nuestra ruta;
  - «EN TU RUTA», con las entradas de su ruta;
  - «Reorganizar» deja exactamente las mismas paradas (ni una más ni una menos);
  - 0 horas calculadas a la vista;
  - 0 «Te falta…» ni sugerencias en la ruta a mano.
- La prueba de «Reorganizar»:
  - con nuestros días escritos: coge cada día (D0 a D7, sin reservas y con algunas), desordena sus paradas al azar 20 veces y pulsa «Reorganizar». Tiene que salir nuestro orden escrito;
  - con días mezclados, como los haría un viajero: 200 días al azar con 4 a 8 paradas de grupos distintos. Dime en el informe si sale algún zigzag, alguna nocturna de día, alguna comida después de las 15:00, Trastevere antes de mediodía o algún grupo partido en dos. Pon 5 ejemplos en el informe, en palabras sencillas (lo que puso el viajero y cómo quedó).
  - Si algo sale mal, explícame por qué y no lo arregles a mano día a día.
- A mano, a 375 px, gratis y de pago:
  - la pantalla de elegir;
  - los días vacíos en acordeón, con [Añadir parada] y [Añadir excursión];
  - EXPLORAR en el orden nuevo, eligiendo varias;
  - una excursión añadida a un día;
  - «Reorganizar» con «Deshacer».
  Capturas en el informe.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
