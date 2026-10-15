# Roma · días por paradas y franjas

Este documento sustituye a las tablas con horas de `DIAS_ESCRITOS_ROMA.md` (decidido el 6-oct-2026). Los días son los mismos y las reglas de fondo también: la pirámide, por dentro una sola vez, nada de zigzags, se come y se cena donde acaba la ruta, y las nocturnas sin repetir. Lo que cambia es la forma: **paradas en orden, por franjas, sin horas escritas**.

## Cómo funciona (vale para todos los destinos)

1. **Franjas:** mañana, comida, tarde, cena y noche. Las escribimos nosotros, con las paradas en su orden. El motor **no cambia el orden**.
2. **El trayecto entre paradas se ve siempre**, en RUTA, en DÍAS y en HOY, entre una tarjeta y la siguiente: «8 min andando», «Taxi, 15 min», «Bus 23, 20 min».
   - **Por defecto, andando o transporte público** (decidido el 7-oct-2026, todos los destinos): andando si son 25 min o menos; si no, transporte público, si hay una línea de verdad. El taxi solo sale por defecto si no hay ninguna de las dos. El taxi siempre está en las opciones, al tocar el icono del trayecto.
   - **Transporte público solo si existe:** solo se ofrece si hay una línea real que une los dos sitios (con su número: «Tranvía 8», «Metro A», «Bus 40»). Si no la hay, no sale la opción.
3. **Minutos aproximados:** cada parada lleva lo que se tarda más o menos (`~`). La app solo los suma, con lo que se anda, para saber si una franja cabe. **No se enseña ninguna hora por parada** (decidido el 6-oct-2026), **ni en las franjas** (decidido el 9-oct-2026): solo «Mañana», «Comida», «Tarde», «Cena» y «Noche», sin hora, porque con una reserva el día se alarga y esa hora ya no sería verdad. Las horas fijas (reservas, turnos, Free Tour) colocan la parada en su sitio, pero tampoco se enseñan encima de ella (decidido el 9-oct-2026, tanda 6q): la única hora a la vista es la de la pestañita verde, cuando la entrada está añadida. La comida, la cena y las pausas tampoco llevan hora a la vista (por dentro, la comida empieza antes de las 15:00, regla 6); solo la llevan si el viajero ha reservado el restaurante. **Sin ajustes, sin rellenos, sin alargar.**
   - **Mejor pasarse que quedarse corto** (decidido el 6-oct-2026). Un imprescindible, la primera vez que sale en el viaje, lleva tiempo para verlo, hacer fotos y vídeos:
     - **por fuera, los grandes, ~45:** Coliseo, Fontana de Trevi, Piazza Navona, Plaza de San Pedro y Plaza de España;
     - **por fuera, los demás, ~30:** Altar de la Patria, Castillo de Sant'Angelo, Plaza del Campidoglio y el Foro desde la terraza;
     - **por dentro, ~1 h como mínimo** (la Basílica de San Pedro, y lo grande, que ya pasa de 1 h); los pequeños, ~45 (el Panteón, el Altar por dentro).
   - **Excepciones:**
     - la Plaza de San Pedro va a ~30 si después se entra en la Basílica, porque la cola se hace en la plaza;
     - Trevi «sin gente» también lleva ~45: el día que empieza con ella, empieza a las 7:30;
     - si un sitio repite en el viaje, va más corto.
   - Si al viajero le sobra tiempo, HOY le propone qué añadir por el camino (regla 15).
4. **Lo que tiene hora fija** (una reserva, un turno, el Free Tour) va a su hora:
   - antes va «Llegada a {sitio}», con su propio texto: 30 min antes en las reservas grandes (el Coliseo, los Museos, la Galería), por las colas de seguridad; 15 min en el Free Tour y en los turnos (decidido el 9-oct-2026). Si se va justo, el viajero irá más deprisa: la app no quita nada;
   - lo que cabe antes de la hora fija va antes, y lo demás después, siempre en el mismo orden;
   - si antes queda un rato, entra una parada corta que esté al lado (el Arco antes del Coliseo);
   - si aún queda más de 1 h, se adelantan las paradas de después que están cerca (a 15 min andando o menos del sitio), en su orden y sin zigzag. Ejemplo: Museos a las 14:00 → por la mañana San Pedro, la Basílica, el Castillo y el Puente; comida en el Borgo a las 12:30; Museos; y por la tarde, Trastevere;
   - **la comida y la cena, antes o después de la reserva** (decidido el 12-oct-2026, vale para todos los destinos; sale de lo que dura la visita en los datos de cada sitio, no de su nombre): se mira a qué hora SALES de la reserva (su hora más lo que dura la visita).
     - **La comida:** si al salir ya son **más de las 14:30**, la comida va **antes** de la reserva, cerca de ella; si sales a las 14:30 o antes, va **después**. (Coliseo de 1 h 30 a las 13:00: sales a las 14:30, la comida después. Museos de 3 h a las 12:00: sales a las 15:00, la comida antes. Galería de 2 h a las 13:00: sales a las 15:00, la comida antes; a las 11:00, después.)
     - **La cena,** igual con las **22:00** (cambiado el 12-oct-2026: en Roma se cena bien hasta tarde, y con el corte en las 21:00 el Free Tour de las 19:00 obligaría a cenar a las 18:00): si al salir ya son más de las 22:00 (el Free Tour de las 21:00, una visita nocturna), la cena va antes; si sales a las 22:00 o antes, va después (el Free Tour de las 19:00 sale hacia las 21:30: la cena, después). Y la cena se procura antes de las 22:30, pero **nunca se quita una parada por esto** (regla 17).
     - **La entrada nunca sale tarde:** la comida (o la cena) de antes se cuenta **corta** por dentro (45 min la comida, 60 la cena; la cena, desde las 18:00) si la normal haría llegar tarde; solo ponemos la parada, cuánto tarda en comer lo decide el viajero. **La comida nunca va antes de las 12:00** (decidido el 13-oct-2026, vale para todos los destinos). Única excepción: una reserva que empieza **entre las 12:00 y las 13:00** con la comida antes de ella (en Roma, los Museos reservados de 12:00 a 13:00): esa comida corta (30 min) puede empezar **desde las 11:15**, cerca del sitio, y hace de «Llegada a…», así que la entrada no sale tarde. Si aun así no llega, lo que va justo antes de la reserva pasa detrás de ella, en su orden (nada pasa a «Si te sobra tiempo»), y si es la primera hora fija del día, el día empieza antes. Si ni así se llega a tiempo, la comida (o la cena) va después de la reserva. Con **dos reservas del viajero el mismo día** no se mueve nada por esto: manda la lista escrita.
     - Los sitios con reserva llevan **cuánto dura la visita** en sus datos; esa duración es la que decide, y la hora de cada fila de abajo lo respeta (Coliseo: la comida después hasta las 13:00 incluida; Galería: después hasta las 12:30; Museos: después hasta las 11:30).
   - **el día nunca empieza más tarde por una reserva** (decidido el 6-oct-2026): empieza a su hora, y la mañana se llena con lo de antes y lo cercano de después. La app nunca mete una parada que no esté escrita ese día para llenar un hueco (decidido el 9-oct-2026, tanda 6r). Si la reserva es antes de que empiece el día, el día empieza antes.
5. **Días con cabeza, mejor que sobre** (decidido el 6-oct-2026): cada día se escribe para que quepa con holgura, con los minutos de la regla 3. Mejor que la app diga «Vas bien de tiempo, ¿quieres añadir algo?» que «hemos quitado…». La app **nunca dice «hemos eliminado» ni «hemos quitado»**: lo que no entra es «Si te sobra tiempo», un extra.
   **Si aun así una franja no cabe** (por un cierre; nunca por una reserva, ver la regla 17), lo de menos importancia de esa franja (la pirámide, de abajo arriba) pasa a **«Si te sobra tiempo»**. Nunca un imprescindible la primera vez que sale en el viaje.
6. **La comida** no debería empezar después de las 15:00 (decidido el 9-oct-2026; antes, las 14:30). Con una reserva, no se quita nada por esto: la comida va antes o después de la reserva según a qué hora sales de ella (regla 4) y, si va antes y la normal haría llegar tarde a la entrada, se cuenta corta. Sin reserva, si se iría más tarde, primero se acorta lo de menos de la mañana (por dentro → por fuera, o se queda «de camino») y después se pasa a «Si te sobra tiempo».
7. **Horarios y cierres (del dato de cada sitio):**
   - si un sitio cierra ese día, sale de la lista con «Cerrado hoy», o el día entero se cambia con otro (regla de orden de los días). Los sitios que **nunca se quitan** (el Vaticano, la Galería Borghese) no salen de la lista: si ningún día del viaje abre, se quedan en su día como parada marcada «Cerrado este día», sin «Llegada a…» y sin ocupar tiempo, con su aviso (decide el viajero), y el resto del día es la versión «sin él» del documento (decidido el 13-oct-2026);
   - si abre o cierra a una hora que importa, aviso: «Cierra a las 18:15: entra antes», «Abre a las 16:00». El «Abre a las…» solo sale si la ruta llega **antes** de que abra, **una sola vez** y con la hora de **ese día** (la del horario real); si la ruta llega con el sitio abierto, no sale (decidido el 13-oct-2026). Esto vale también con una reserva del viajero: una visita por dentro que a su hora ya habrá cerrado va por fuera con su aviso, y una que aún no habrá abierto espera o, si falta mucho, va por fuera con su aviso; el orden no cambia.
   - **si se llega antes de que abra:** se espera hasta 15 min en general, y **hasta 40 min si la parada de antes es una plaza o un sitio al aire libre justo al lado**, donde se pueden hacer fotos (la Piazza del Popolo antes de Santa Maria del Popolo). Más de 40 min: por fuera, con su aviso. HOY lo dice así: «Santa Maria del Popolo (los Caravaggio) abre en 20 min. Mientras, haz unas fotos en la Piazza del Popolo».
8. **Atardecer:** solo un dato en la cabecera del día, «Hoy el sol se pone a las 17:05». Los miradores tienen un texto que vale de día, al atardecer y de noche. No se mueve nada.
9. **«De camino»:** pasas por delante sin pararte. Dos o más seguidos van en una sola tarjeta, «De camino a {siguiente}», sin foto propia. Un «de camino» nunca es un sitio que ese día ya sale como parada (se sube y se baja la escalinata de la Plaza de España, pero no se nombra otra vez: ese rato es el trayecto).
   - **Qué es parada y qué es de camino** (decidido el 7-oct-2026): parada es todo sitio con nombre propio, con historia y conocido, aunque sean 5–10 min (en Roma: la Conciliazione, el Teatro de Marcelo, la Columna de Trajano, Porta Pinciana, Piazza Venezia, Via dei Fori Imperiali, el Arco de Constantino, el Puente Sant'Angelo, Via Condotti, Via Veneto, la Fuente del Tritón). De camino son solo las calles de paso sin fama (Via del Babuino, Via dei Coronari, Via Margutta…), los rincones pequeños (la Fuente de las Tortugas, el Elefantino), las fachadas de iglesias en las que no se entra y lo ya visitado otro día del viaje que no sea imprescindible, con «Ya lo visitaste el {día}» (el mar 10; sin fechas, el día 1).
   - **Los imprescindibles nunca van «de camino»** (decidido el 13-oct-2026, vale para todos los destinos): si ya se vieron otro día del viaje (también en la llegada), salen otra vez como parada, más corta. Solo lo que no es imprescindible pasa a «de camino» con «Ya lo visitaste el {día}». Si una lista escrita lleva un imprescindible «de camino», pasa a parada corta (~10 min). La única fachada que se queda de camino es la de la Basílica de San Pedro en el D0-medio, porque la Plaza de San Pedro ya es su parada.
10. **Sin paseos** (decidido el 6-oct-2026; con una excepción, el paseo por Trastevere antes de cenar, decidido el 7-oct-2026; cuando Trastevere va por la mañana, el paseo se queda para antes de la cena, en Trastevere, decidido el 9-oct-2026): solo paradas y «de camino». Una calle de paso o un barrio por el que se pasa (Monti, Via Margutta…) va «de camino», aunque se tarde más de 5 min andando: ese rato es el trayecto. Las calles con fama de la regla 9 (la Conciliazione, Via Condotti, Via Veneto…) son paradas (decidido el 7-oct-2026, corregido en los días el 9-oct-2026). Un sitio que se visita (el lago de Villa Borghese, el reloj de agua, el Barrio Judío) es una parada con su nombre.
11. **Restaurantes:**
    - la comida y la cena llevan su alternativa escrita;
    - si cierran los dos, otro restaurante de verdad de la misma zona, a menos de 10 min andando;
    - el mismo restaurante no se repite en el viaje (va su alternativa);
    - la zona sí se puede repetir.
11b. **Sin «iluminada» en los nombres** (decidido el 7-oct-2026): ninguna parada lleva en su nombre «iluminada», «de noche» ni «ya con las luces». Lo de noche se ve por su tarjeta azul de experiencia nocturna, con su foto.
11c. **La noche y lo visto ese día** (decidido el 7-oct-2026): en los viajes de **2 días o menos**, una nocturna puede ser un sitio ya visto ese mismo día, porque hay poco tiempo y se quiere ver de día y de noche. En los viajes de **2,5 días o más**, no: una nocturna no puede ser un sitio visto ese mismo día (ni por dentro, ni por fuera, ni «sin gente»), y va otro día del viaje, sin prisa. Si toca, va la siguiente nocturna (regla 13).
12. **Sin tarjeta de descanso** (quitada el 7-oct-2026): entre la última parada y la cena no sale ninguna tarjeta. Si sobra tiempo, solo HOY lo dice con «Vas bien de tiempo» (regla 15).
13. **Noche:** después de cenar. Las nocturnas no se repiten en el viaje, y las imprescindibles (Trevi, Plaza de España, Coliseo) van en los primeros días en que caben. Si la de un día ya salió, va la más cercana a la cena que no haya salido.
    - **Las nocturnas van por parejas cercanas** (decidido el 7-oct-2026): Trevi y la Plaza de España; el Coliseo y el Foro desde el Campidoglio; el Panteón y Piazza Navona; el Puente y el Castillo de Sant'Angelo; Trastevere de noche. Una noche lleva una pareja, o solo una de las dos.
    - **Nunca se mezclan parejas,** y entre las dos nocturnas de una noche no hay más de 15 min andando. Si una de la pareja ya salió o no vale (regla 11c), la noche lleva solo la otra; no se busca una nocturna lejos para completar.
14. **Al recolocar algo, siempre las mismas comprobaciones.** Cuando el motor mueve, quita o mete una parada (una reserva, el pool, una experiencia, un cierre, «Si te sobra tiempo»), el día que sale tiene que cumplir todo lo que ya teníamos:
    - **sin zigzag:** no se vuelve a una zona que ya se dejó (más de unos 300 m) para ver algo que se podía ver al pasar;
    - **la pirámide:** se quita de abajo arriba y nunca un imprescindible la primera vez;
    - **por dentro una sola vez** en el viaje;
    - **las nocturnas** y **los restaurantes** sin repetir;
    - **se come y se cena donde acaba** esa parte del día;
    - **nada cerrado** a la hora a la que se llega.

    Si una recolocación rompe alguna, no se hace: lo que no cabe pasa a «Si te sobra tiempo». **Con una reserva, no:** no se quita nada, solo se ordena (regla 17).
15. **Pestaña HOY** (de pago, durante el viaje; cambiado el 10-oct-2026):
    - la siguiente parada y cuánto se tarda andando (desde donde está el viajero si comparte su ubicación; si no, desde la parada anterior);
    - [Cómo llegar] (abre Google Maps), [✓ Visto] y **[No me da tiempo]**: la parada queda como «Saltada», en gris, y se pasa a la siguiente, con [Deshacer] y [Pasarla a otro día]. La app no calcula si el viajero va bien o justo de tiempo, ni le sugiere nada: decide él;
    - los avisos de cierre y la entrada reservada a su hora («Tu entrada al Coliseo · 12:00»), sin horas calculadas («sal de aquí a las…» no se hace).

16. **Plan de lluvia.** Cada día lleva su línea «🌧 Si llueve»: qué parada al aire libre se acorta o sale y qué parada por dentro entra, siempre cerca de la ruta y con las comprobaciones del punto 14. La app mira la previsión (la víspera y esa mañana). Si hay previsión de lluvia en una franja, HOY avisa: «Hay previsión de lluvia esta tarde. Si llueve, aquí tienes una alternativa» **[Ver alternativa]**. Nunca cambia sola: decide el viajero.
17. **Reservas: solo lo escrito** (decidido el 6-oct-2026, vale para todos los destinos). Cada reserva grande tiene su día escrito para cada tramo de hora, y el motor no se inventa otro.
    - **Las reservas mandan y el día lo lleva todo** (decidido el 9-oct-2026, vale para todos los destinos): con una reserva, el día lleva todo lo que tiene escrito. La app **solo lo ordena para que tenga sentido** (qué va antes y qué después, por dónde se empieza). No quita nada por la hora: hay quien sale a las 6:00 y vuelve a las 22:00. El viajero quita o añade lo que quiera. La única cuenta que sí hace es la de la regla 4: la entrada nunca sale tarde.
    - **La app nunca propone otra hora** (decidido el 9-oct-2026, vale para todos los destinos): el viajero compra la entrada cuando le va bien y la app se adapta. Por eso cada reserva grande tiene su día escrito para todas sus horas, de la primera a la última entrada.
    - **Si las horas de dos reservas se cruzan** (por ejemplo, el Free Tour de 10:00 a 12:30 y los Museos a las 11:45), es un hecho, no una propuesta: aviso «Tu Free Tour y tu entrada a los Museos coinciden. Revisa una de las dos reservas.» [Ver mis reservas], y se queda en la campana hasta que se arregla.
    - **Un imprescindible que se visita por dentro nunca pasa a «de camino» ni a «por fuera» por una reserva:** se mueve antes o después de ella.
    - **Sin cuentas al minuto** (decidido el 10-oct-2026, vale para todos los destinos; sustituye a «vas justo» y a «lo nuestro nunca te hace llegar tarde» del 9-oct). La hora de la reserva decide en qué fila de su tabla cae y qué lista escrita se usa. El día sigue esa lista: no se pasa nada «por fuera» por la hora y no sale ningún aviso de «vas justo». **Con una excepción (decidido el 12-oct-2026, regla 4):** la comida y la cena van antes o después de la reserva según a qué hora sales de ella, y la entrada nunca sale tarde (la comida de antes se cuenta corta; si aun así no llega, lo de justo antes pasa detrás de la reserva). Si el viajero ve que no le da, mueve lo que quiera (arrastrando) o lo quita, y durante el viaje tiene [No me da tiempo] (regla 15).
    - **«Vas justo» vuelve, solo como aviso** (decidido el 10-oct-2026, por la tarde): entre dos reservas del viajero del mismo día, si entre que acaba la primera (su hora más lo que dura) y empieza la segunda hay menos que el trayecto entre las dos más 30 min, el aviso «Ojo: entre tu Free Tour y tu entrada a los Museos hay poco margen. Es posible que vayas justo: te recomendamos ir directo.» No cuenta nuestras paradas, no mueve ni quita nada. Si luego no se cumple, no pasa nada.
    - **«Día completo»**, solo como aviso: si las paradas de un día con reserva suman más de lo que dura el día (de las 9:00 a las 22:00), la línea «Hoy es un día completo: te recomendamos madrugar.» en la cabecera del día. No mueve ni quita nada.
    - **El horario y la última entrada, a la vista** (decidido el 10-oct-2026): en la tarjeta de cada parada con horario, en pequeño, «Abre 9:00 – 19:15 · Última entrada 18:15» (los datos reales de ese día). Así decide el viajero.
    - **La noche tampoco se quita por la hora:** con una reserva, la nocturna se queda aunque el día acabe tarde. El viajero la quita si quiere.

**Líneas de transporte público de Roma que usa la app** (de momento solo estas; el resto, andando o taxi, y el botón «Rutas» abre el mapa). Cuentan si se llega a la parada de la línea en **12 min andando o menos** en cada punta:
- **Metro A:** Ottaviano (Vaticano) · Flaminio (Piazza del Popolo) · Spagna (Plaza de España) · Barberini (Tritón, Via Veneto) · Termini · San Giovanni (Letrán).
- **Metro B:** Termini · Cavour (Monti) · Colosseo (Coliseo) · Circo Massimo · Piramide (Testaccio, Ostiense).
- **Tranvía 8:** Trastevere (paradas Belli y Trastevere/Mastai, en Viale Trastevere) · Largo di Torre Argentina · Piazza Venezia.
- **Bus 64:** Termini · Piazza Venezia · Largo di Torre Argentina · Corso Vittorio (Sant'Andrea della Valle, Chiesa Nuova) · Lungotevere de Sassia (el Borgo) · estación de San Pietro (junto a la Plaza de San Pedro).
- **Bus 40:** Termini · Piazza Venezia · Largo di Torre Argentina · Chiesa Nuova · Lungotevere de Sassia (el Borgo, a ~400 m de Via della Conciliazione). Ya no llega a la Traspontina.
- **Bus 23:** por el Lungotevere, entre el Castillo de Sant'Angelo y Testaccio y la Pirámide. Cada sentido va por una orilla:
  - **hacia el sur** (Castillo → Pirámide), por la orilla de Trastevere: Lungotevere de Sassia, Lungotevere Farnesina/Trilussa, Lungotevere Sanzio (Trastevere), la Isla Tiberina (Lungotevere Alberteschi), Marmorata (Testaccio) y Piramide;
  - **hacia el norte** (Pirámide → Castillo), por la otra orilla: Piramide, Marmorata, Lungotevere Aventino, Monte Savello (la Isla Tiberina), Lungotevere Tebaldi y la Traspontina (el Castillo). **No pasa por Trastevere.**

**Restaurantes nuevos de Trastevere** (añadidos el 7-oct-2026; horarios sacados de guías, a confirmar antes de publicar):
- **Da Lucia** · Vicolo del Mattonato 2b. Cierra el lunes; el domingo, solo a mediodía (12:30–15:00); de martes a sábado, comida (12:30–15:00) y cena (19:30–23:00).
- **Checco er Carettiere** · Via Benedetta 10. Abre todos los días, comida y cena.
- **Da Teo** · Piazza dei Ponziani 7. De lunes a sábado, comida (13:00–15:00) y cena (19:30–23:30); cierra el domingo.

**Qué días lleva cada viaje** (decidido el 7-oct-2026; sustituye a la tabla de `DIAS_ESCRITOS_ROMA.md`):

| Viaje | Sin Free Tour | Con Free Tour de mañana |
|---|---|---|
| 1 día | D0 | no se ofrece |
| 1,5 días | D1-corto + D0-medio | no se ofrece |
| 2 días | D1 + D2 | D3 + D1-FT |
| 2,5 días | D1 + D2 + DT-medio | D3 + D1-FT + DM-medio (de mañana) o DT-medio (de tarde) |
| 3 días | D1 + D2 + D4 | D3 + D1-FT + D4 (versión con Free Tour) |
| 3,5 días | D1 + D2 + D4 + DA-medio | D3 + D1-FT + D4 + DA-medio |
| 4 días | D1 + D2 + D4 + **día 4 con interruptor** (Roma por defecto: D5) | D3 + D1-FT + D4 + día 4 con interruptor |
| 5 días | D1 + D2 + D4 + **día 4 con interruptor** + D5 (Excursión por defecto). Con Roma: D1 + D2 + D4 + D5 + D6 | D3 + D1-FT + D4 + … (igual) |
| 6 días | D1 + D2 + D4 + **día 4 con interruptor** + D5 + D6 (Excursión por defecto). Con Roma: D1 + D2 + D4 + D5 + D6 + D7 | D3 + D1-FT + D4 + … (igual) |
| 7 días o más | lo de 6 días; del día 7 en adelante, la hoja «Ya has visto lo mejor de Roma» y EXPLORAR | igual |

**Con el Free Tour de las 19:00 o el de las 21:00** (decidido el 9-oct-2026; el de las 19:00, el 12-oct-2026): el viaje lleva los días de «Sin Free Tour», y el Free Tour va en la noche del D1 (ver el D1). Con el de las 10:00, las 12:00, las 15:00 o las 17:00, los de «Con Free Tour de mañana», con el D3 según su hora (ver el D3).

**El día de excursión** (decidido el 7-oct-2026):
- Es siempre el **día 4** en los viajes de 4, 5 y 6 días. Con vuelos, ver «Llegadas y vueltas». Nunca el día de llegada ni el de vuelta.
- **El interruptor [Roma | Excursión]** va en el día 4.
- **Con el interruptor en Roma, los días de Roma van en su orden (D5, D6, D7):** el día de Roma que se gana va **al final** y lo que había del día 5 en adelante se corre un día. Así lo mejor sigue primero.
  - 4 días: el día 4 es el D5.
  - 5 días: D5 el día 4 y D6 el día 5.
  - 6 días: D5 el día 4, D6 el día 5 y D7 el día 6.
  - Con las reglas de siempre: lo ya visto que no es imprescindible pasa a «de camino» con «Ya lo visitaste el {día}» (los imprescindibles salen otra vez como parada, regla 9), sin repetir restaurantes ni nocturnas.
- **Con una reserva en un día que se movería** (los días de después del de la excursión), el interruptor no deja pasar a Roma: no se mueve nada y sale el aviso «Tienes una reserva el día {n} ({sitio}, {hora}): no puedes mover este día».
- **Con el interruptor en Excursión:** ese día lleva **solo la excursión**: ni comida, ni cena, ni noche propuestas. Si es de medio día, ver «Excursión de medio día», al final.

**El orden de los días** (decidido el 7-oct-2026, vale para todos los destinos): **lo imprescindible, primero**.
- Los días con más imprescindibles van en los primeros días completos del viaje: en Roma, la Roma antigua (D1) y el Vaticano (D2), o sus versiones con Free Tour (D1-FT y D3).
- Después van los demás, por este orden: Villa Borghese (D4), las basílicas (D5), Roma desde arriba (D6) y la Vía Appia (D7).
- Solo se cambia si un cierre lo obliga (el Vaticano no en domingo ni en miércoles, la Galería no en lunes). Entonces se prueban **todos los órdenes** posibles de los días del viaje y se queda el que menos pierde: primero se salvan los imprescindibles, luego los de nivel 2, y si algo tiene que caer en un día cerrado, es lo de menor importancia («es normal que alguno se pierda alguna vez»; decidido el 13-oct-2026). Con 3 días del 24 al 26 de diciembre: el Vaticano el 24, la Galería el 25 (cierra, pero es lo que menos se pierde) y el Coliseo el 26. Si dos órdenes pierden lo mismo, gana el de siempre, y lo imprescindible sigue lo más pronto posible. Si el otro día también cierra, no se cambia. Un día con horario reducido (los Museos el 24 y el 31 de diciembre, de 8:00 a 15:00) vale como día abierto, con la lista de los Museos por la mañana. Los días cambiados a mano y los que llevan una reserva del viajero no se mueven.
- **Los medios días** (llegada, salida o media jornada) nunca son el D1 ni el D2: se usan sus versiones de medio día (DT-medio, D0-medio, DA-medio, DM-medio). Por eso, si un viaje de 3 días pasa a 2,5 días por la hora de llegada, el Coliseo y el Vaticano se quedan enteros, y lo que se acorta es lo menos imprescindible.

**Lo que se quita del modelo anterior:**
- las horas al minuto;
- las versiones A, B, C y D por atardecer;
- las tablas de fechas especiales;
- rellenar huecos y alargar paradas;
- que el motor corrija las distancias por su cuenta.

---

## Roma en un día · D0

- **Mañana:**
  - Plaza de San Pedro ~30
  - Basílica de San Pedro, por dentro (gratis; a primera hora la cola es corta) ~1 h
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, por fuera ~30
  - Puente Sant'Angelo ~10
  - Piazza Navona ~45
  - Panteón, por dentro (entrada de 7 €) ~45
- **Comida:** Armando al Pantheon (o Supplizio; si cierran los dos, Piccolo Arancio)
- **Tarde:**
  - Piazza Venezia ~10
  - Altar de la Patria, por fuera ~30
  - Plaza del Campidoglio ~30
  - El Foro Romano, desde la terraza del Campidoglio ~30
  - Via dei Fori Imperiali ~15
  - Coliseo, por fuera ~45
  - Arco de Constantino ~10
  - Taxi a la Plaza de España
  - Plaza de España ~45
  - Escalinata y Trinità dei Monti ~20
  - Via Condotti ~15
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** Fontana de Trevi

**Con el Coliseo reservado por la mañana**, el día va al revés y acaba en San Pedro:
- Coliseo (reserva) y Arco
- Fori Imperiali
- la Plaza del Campidoglio y el Foro desde la terraza
- Piazza Venezia y el Altar
- comida en Armando
- Panteón, Navona, Puente, Castillo, Conciliazione y San Pedro
- y luego la misma tarde (taxi a la Plaza de España…) y la misma noche.

**Con el Coliseo reservado de 12:30 a 14:00** (cambiado el 9-oct-2026: la Roma antigua por la mañana, San Pedro por la tarde):
- **mañana:** Piazza Venezia ~10, el Altar por fuera ~30, la Plaza del Campidoglio ~30, el Foro desde la terraza ~30, Via dei Fori Imperiali ~15, «Llegada a…», 🎟 el Coliseo por dentro y el Arco ~10;
- **comida:** en Monti (La Taverna dei Fori Imperiali o Trattoria Valentino), después del Coliseo;
- **tarde:** taxi a Navona; el Panteón por dentro ~45, Piazza Navona ~45, el Puente ~10, el Castillo por fuera ~30, la Conciliazione ~10, la Plaza de San Pedro ~30 y la Basílica por dentro ~1 h (última entrada a las 19:15); taxi a la Plaza de España, la Escalinata y Trinità dei Monti ~20 y Via Condotti ~15;
- **cena y noche:** las de siempre.

**Con el Coliseo reservado de 14:30 en adelante:**
- la mañana y la comida de siempre;
- **tarde:** Piazza Venezia ~10, Via dei Fori Imperiali ~15, «Llegada a…», 🎟 el Coliseo por dentro y el Arco ~10; después, la Plaza del Campidoglio y el Foro desde la terraza ~30 y el Altar por fuera ~30 (al aire libre, se ven a cualquier hora); taxi a la Plaza de España ~45, la Escalinata y Trinità dei Monti ~20 y Via Condotti ~15;
- **cena y noche:** las de siempre.

**Miércoles (audiencia del Papa)** (decidido el 12-oct-2026, el mismo criterio que el D2): la Plaza y la Basílica de San Pedro nunca van antes de comer, porque por la mañana está la audiencia del Papa. La mañana va al revés:
Por la mañana, el Panteón por dentro ~45, Piazza Navona ~45, de camino el Puente Sant'Angelo, el Castillo por fuera ~30 y de camino la Conciliazione; la comida en el Borgo (Borghiciana o Dal Toscano); y, después de comer, la Plaza de San Pedro ~30 y la Basílica por dentro ~1 h, el taxi a Piazza Venezia y la misma tarde de siempre.

**Con los Museos marcados o reservados hasta las 11:30 un miércoles:** los Museos por la mañana, la comida en el Borgo y, después de comer, la Plaza y la Basílica por dentro.

**Pool y experiencias:**
- Sin pool ni reserva: todo por fuera, salvo la Basílica de San Pedro y el Panteón, que van por dentro (decidido el 6-oct-2026: sobraba la tarde).
- Con los Museos marcados: la mañana con Museos del D0-medio y la tarde desde Piazza Navona.
- Mercadillos (8 dic – 6 ene): «Piazza Navona y su mercadillo navideño».
- Free Tour: no se ofrece.

- **🌧 Si llueve:** la Basílica y el Panteón ya van por dentro; el Foro desde la terraza, el Coliseo y Navona, más cortos.

---

## Viaje de 1,5 días

### Día entero · D1-corto (la Roma antigua, el centro y Trastevere)

- **Mañana:**
  - Coliseo, por fuera ~45
  - Arco de Constantino ~10
  - Via dei Fori Imperiali ~15
  - Plaza del Campidoglio ~30
  - El Foro Romano, desde la terraza del Campidoglio ~30
  - Piazza Venezia ~10
  - Altar de la Patria, por fuera ~30
  - Teatro de Marcelo ~10
  - Boca de la Verdad ~15
  - Isla Tiberina ~20
- **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío
- **Tarde:**
  - Barrio Judío ~30
  - *de camino:* Fuente de las Tortugas, Largo di Torre Argentina, Iglesia del Gesù (la fachada), Elefantino de Bernini, Santa Maria sopra Minerva
  - Panteón, por dentro (entrada de 7 €) ~45
  - Piazza Navona ~45
  - Campo de' Fiori ~20
  - *de camino:* Ponte Sisto (se cruza el Tíber hacia Trastevere)
  - *de camino:* Via Garibaldi (se sube andando, ~20 min)
  - Mirador del Janículo ~20
  - *de camino:* bajada a Trastevere
  - Santa Maria in Trastevere, por dentro (gratis) ~20
  - Paseo por Trastevere ~30
- **Cena:** Da Enzo al 29 (o Tonnarello), en Trastevere
- **Noche:** Fontana de Trevi (taxi) y la Plaza de España
- **🌧 Si llueve:** el Panteón y Santa Maria in Trastevere ya van por dentro; la Isla Tiberina y el Ponte Sisto, de camino, y el Janículo sale.


### Medio día del Vaticano · D0-medio

**De mañana (la mañana de la vuelta):**
- Plaza de San Pedro ~45
- *de camino:* Basílica (la fachada)
- Via della Conciliazione ~10
- Castillo de Sant'Angelo, por fuera ~30
- Puente Sant'Angelo ~10
- *de camino:* Via dei Coronari
- Fontana de Trevi ~45
- Plaza de España ~45
- **Comida:** Poldo e Gianna Osteria (o Edy), en el Tridente

**De tarde (la tarde de la llegada):**
- Plaza de San Pedro ~30
- Basílica de San Pedro, por dentro (gratis; abre de 7:00 a 20:00 todo el año) ~1 h
- Via della Conciliazione ~10
- Castillo de Sant'Angelo, por fuera ~30
- Puente Sant'Angelo ~15
- **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati
- **Noche:** Fontana de Trevi y la Plaza de España, si el día entero no las ha llevado; si no, Piazza Navona.

**Con los Museos marcados o reservados:**
- **Mañana:** 🎟 Museos Vaticanos y Capilla Sixtina ~3 h, Plaza de San Pedro ~30, Basílica por dentro ~1 h 15, comida en el Borgo (Borghiciana o Dal Toscano), la Conciliazione ~10, el Castillo por fuera y el Puente ~10.
- **Tarde:** Plaza de San Pedro, Basílica por dentro, 🎟 Museos, cena en Prati y el Puente y el Castillo iluminados.

**Miércoles por la mañana (audiencia del Papa),** al revés para acabar en San Pedro cuando termina la audiencia:
- Fontana de Trevi sin gente
- Plaza de España
- *de camino:* Via dei Coronari
- Puente Sant'Angelo ~10
- Castillo, por fuera
- comida en el Borgo
- después de comer (decidido el 12-oct-2026: la Plaza y la Basílica nunca van antes de comer un miércoles), la Plaza de San Pedro ~30
- *de camino:* Basílica (la fachada)
- **Con los Museos marcados o reservados hasta las 11:30 un miércoles:** los Museos por la mañana, la comida en el Borgo y, después de comer, la Plaza de San Pedro, la Basílica por dentro, la Conciliazione, el Castillo por fuera y el Puente.

**Experiencias:** Mercadillos (8 dic – 6 ene): «Plaza de San Pedro y los 100 Presepi» y «Piazza Navona y su mercadillo navideño». Free Tour: no se ofrece.

- **🌧 Si llueve:** por la mañana, la Basílica por dentro (gratis, ~45) en vez de la fachada; por la tarde ya va por dentro. El Castillo, de camino.

---

## Día de la Roma antigua · D1

- **Mañana:**
  - 🎟 Coliseo, por dentro ~1 h 15 (turno)
  - Arco de Constantino ~10
  - Foro Romano y Palatino, por dentro ~1 h 30 (se sale por el Campidoglio)
  - Plaza del Campidoglio ~30
  - Piazza Venezia ~10
  - Altar de la Patria, por dentro ~45
- **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío
- **Tarde:**
  - Barrio Judío ~30
  - *de camino:* Fuente de las Tortugas
  - Largo di Torre Argentina ~15
  - *de camino:* Elefantino de Bernini, Santa Maria sopra Minerva
  - San Luigi dei Francesi (los Caravaggio) ~20 (⚠️ abre a las 14:30 y cierra a las 18:30). Va antes que el Panteón por eso.
  - Panteón, por dentro ~45 (el sábado, antes de las 17:00)
  - Piazza Navona ~45
  - Iglesia del Gesù, por dentro ~20, de camino a la cena (⚠️ por la tarde abre a las 16:30; de julio a septiembre, a las 17:00). Va al final por su hora de abrir: así no hay esperas. Desde Navona son ~12 min, y la cena está a ~5 min.
- **Cena:** Armando al Pantheon (o Da Baffetto)
- **Noche:** Fontana de Trevi y la Plaza de España
  - **Con el Free Tour de las 21:00** (decidido el 9-oct-2026): la noche es el 🎟 Free Tour por Roma, 21:00 ~2 h 30, en lugar de Trevi y la Plaza de España (el tour pasa por allí). Sale de la Plaza de España: de Armando, a pie (~15 min). Lo que el tour recorre y ya se ha visto por la tarde (el Panteón, Navona) se queda: de noche se ve distinto. La cena va antes del tour (sales a las 23:30).
  - **Con el Free Tour de las 19:00** (decidido el 12-oct-2026): igual que el de las 21:00, la noche es el 🎟 Free Tour por Roma, 19:00 ~2 h 30, en lugar de Trevi y la Plaza de España (el tour pasa por allí), pero la cena va **después** del tour, cerca de Navona, donde acaba (sale hacia las 21:30).
- **Cierres:** el sábado (y la víspera de festivo) el Panteón no deja entrar desde las 17:00 por la misa: aviso «entra antes». El domingo y los festivos, tampoco durante la misa de las 10:30. Si una iglesia cierra (domingo o festivo), por fuera.

**Si te sobra tiempo** (sugerencia de «Vas bien de tiempo» antes de comer): la Columna y los Mercados de Trajano (~1 h), al lado del Altar, si el viaje no los lleva en el D6.

**Pool:** solo si el viaje no lleva el día propio de ese sitio.
- **Museos Capitolinos:** por la mañana, después del Campidoglio ~60.
- **San Juan de Letrán:** a primera hora, antes del Coliseo (metro B de San Giovanni a Colosseo).
- **Boca de la Verdad, Jardín de los Naranjos y Ojo de la Cerradura:** por la tarde, después del Barrio Judío (taxi de vuelta a Largo Argentina).
- **Galería Borghese:** 🎟 por la tarde, después del Panteón (taxi). Cena en el Tridente.
- **Parque de Villa Borghese:** al final de la tarde (taxi), con el Pincio. Cena en el Tridente.

**Experiencias:**
- **Arte y Museos:** los Capitolinos.
- **Barrios y Sabores:** el Barrio Judío ~45.
- **Naturaleza y Vistas:** el ascensor panorámico del Altar.
- **Mercadillos:** «Piazza Navona y su mercadillo navideño» y el Santo Bambino de Aracoeli de camino.

**El Coliseo reservado a otra hora** (escrito como lo haría un guía; el motor no se lo inventa). El Coliseo y el Foro van con la misma entrada: el Foro y el Palatino se pueden ver antes o después de la hora del Coliseo.

**Cómo se monta este día con el Coliseo reservado** (decidido el 9-oct-2026, igual que el día del Free Tour y el Vaticano). Son dos partes:
- **la Roma antigua:** el Coliseo, el Arco, el Foro y el Palatino, el Campidoglio, Piazza Venezia y el Altar;
- **la otra parte:** en el D1, el centro (el Gueto, Torre Argentina, San Luigi, el Panteón, Navona, el Gesù); en el D1-FT, el Gueto y Trastevere.
- **Coliseo por la mañana:** la Roma antigua por la mañana y la otra parte por la tarde. **Coliseo por la tarde:** al revés.
- **El Foro y el Palatino, antes o después del Coliseo según la hora,** como la Basílica con los Museos:
  - va donde dice la tabla de abajo, por la hora del Coliseo (cambiado el 10-oct-2026: ya no se cuenta el tiempo hasta su última entrada).
- **La comida, antes de las 15:00:** en el Gueto si la Roma antigua acaba a mediodía; en Monti, entre el Foro y el Coliseo, si el Coliseo es a mediodía.

Las horas que no salen en una tabla (las 10:15, las 11:15…) van con la fila de la hora de antes (decidido el 9-oct-2026, vale para todas las tablas de horas), salvo la comida y la cena, que van antes o después de la reserva según a qué hora sales de ella (regla 4): con el Coliseo (~1 h 30) hasta las 13:00 incluida, la comida va después; desde las 13:05, antes.

| Coliseo a las… | La Roma antigua va… | El Foro y el Palatino | La comida |
|---|---|---|---|
| hasta las 10:00 | por la mañana | después del Coliseo | en el Gueto |
| 10:30 – 11:00 | por la mañana | después del Coliseo | en el Gueto |
| 11:30 – 12:00 | por la mañana | antes del Coliseo | en el Gueto |
| 12:30 – 13:00 | a mediodía | antes del Coliseo | en Monti, después del Coliseo |
| 13:30 – 15:00 | a mediodía | antes del Coliseo | en Monti, antes del Coliseo |
| 15:30 en adelante | por la tarde | antes del Coliseo | en el Gueto |

- **A primera hora (hasta las 10:00):** el día normal.
- **A media mañana, de 10:30 a 11:00:** el Foro (~1 h 30) no cabe antes, así que va después.
  - **mañana:** San Pietro in Vincoli, por dentro (el Moisés de Miguel Ángel; abre a las 8:00) ~20, el Arco de Constantino, «Llegada a…» y el Coliseo a su hora;
  - **después:** Foro Romano y Palatino, por dentro (se entra junto al Arco y se sale por el Campidoglio), la Plaza del Campidoglio, Piazza Venezia ~10 y el Altar de la Patria por dentro, después de comer (está a 5 min del Gueto);
  - **comida:** en el Gueto;
  - **la tarde, la de siempre.**
- **De 11:30 a 12:00:**
  - **mañana:** San Pietro in Vincoli, por dentro ~20, el Arco, el Foro Romano y Palatino por dentro (se entra junto al Arco), «Llegada a…» y el Coliseo;
  - **después:** Via dei Fori Imperiali ~15, la Plaza del Campidoglio, Piazza Venezia ~10 y el Altar por dentro, después de comer;
  - **comida:** en el Gueto;
  - **la tarde, la de siempre.**
- **A las 12:30 y a las 13:00** (decidido el 10-oct-2026: la visita primero y la comida después, como en el D0):
  - **mañana:** Plaza del Campidoglio, Altar de la Patria por dentro y Foro Romano y Palatino (se entra por Via dei Fori Imperiali y se sale junto al Arco);
  - **después:** «Llegada a…», el Coliseo y el Arco;
  - **comida:** en Monti, al lado del Coliseo (La Taverna dei Fori Imperiali o Trattoria Valentino);
  - **tarde, cena y noche:** las de mediodía (abajo).
- **A mediodía (de 13:30 a 15:00):**
  - **mañana:** Plaza del Campidoglio, Altar de la Patria por dentro y Foro Romano y Palatino (se entra por Via dei Fori Imperiali y se sale junto al Arco);
  - **comida:** en Monti, al lado del Coliseo (La Taverna dei Fori Imperiali o Trattoria Valentino);
  - **después:** «Llegada a…», el Coliseo y el Arco;
  - **tarde:** Via dei Fori Imperiali ~15, Largo di Torre Argentina, San Luigi dei Francesi (cierra a las 18:30), el Panteón por dentro, Piazza Navona y, al final, el Gesù (abre a las 16:30; en verano, a las 17:00);
  - **cena y noche:** las de siempre;
  - el Barrio Judío, al final de la tarde (está a 5 min de Torre Argentina).
- **Por la tarde (a las 15:30 o más tarde):** el día va al revés.
  - **mañana:** el Panteón por dentro (abre a las 9:00), Piazza Navona, San Luigi dei Francesi, Largo di Torre Argentina, el Gesù (por la mañana está abierto), el Barrio Judío, Piazza Venezia ~10 y el Altar de la Patria por dentro;
  - **comida:** en el Gueto;
  - **tarde:** Plaza del Campidoglio, Via dei Fori Imperiali ~15, el Arco ~10, «Llegada a…» y el Coliseo; el Foro Romano y Palatino por dentro va **antes del Coliseo** (se entra por Via dei Fori Imperiali y se sale junto al Arco; cambiado el 10-oct-2026: después del Coliseo, por la tarde, a menudo ya no deja entrar);
  - **cena:** en Monti (La Taverna dei Fori Imperiali o Trattoria Valentino);
  - **noche:** Trevi y la Plaza de España (15 min andando o taxi).
- **Nunca** se pasa el Foro y el Palatino a «de camino» o «por fuera» para que quepa: va antes o después del Coliseo, que para eso es la misma entrada.

**D1-corto y D1-FT con el Coliseo reservado:** la Roma antigua es la del D1 con la lista de su hora (por dentro), y la otra parte es la suya. Si la lista del D1 manda la comida a Monti, la tarde del D1-corto empieza en el Gueto, igual. **Con el Coliseo por la tarde (15:30 en adelante), en el D1-FT va al revés:** ver el D1-FT.

**Free Tour de tarde (15:00 o 17:00), si va en este día:** es una reserva en la tarde. Lo que el tour recorre (el centro) sale de la lista con «Lo ves en el Free Tour».

- **🌧 Si llueve:** el Foro y el Palatino son al aire libre: más cortos (~1 h). Si el viaje no lleva otro día con los Museos Capitolinos, van después del Campidoglio (~1 h). El Barrio Judío y Navona, más cortos.

---

## Día del Vaticano y Trastevere · D2

- **Mañana:**
  - 🎟 Museos Vaticanos y Capilla Sixtina ~3 h (turno a primera hora)
  - Plaza de San Pedro ~30
  - Basílica de San Pedro, por dentro ~1 h 15
- **Comida:** Borghiciana (o Dal Toscano), en el Borgo
- **Tarde:**
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, por fuera ~30
  - Puente Sant'Angelo ~15
  - Bus 23 por el Lungotevere hasta la Isla Tiberina
  - Isla Tiberina ~20
  - Santa Maria in Trastevere, por dentro ~25
  - San Pietro in Montorio y el Tempietto ~10 (si está cerrado: «El mirador de San Pietro in Montorio»)
  - Fontana dell'Acqua Paola ~10
  - Mirador del Janículo ~30
  - *de camino:* bajada a Trastevere
  - Paseo por Trastevere ~30
- **Cena:** Tonnarello (o Checco er Carettiere, o Da Lucia), en Trastevere
- **Noche:** Trastevere de noche (o la imprescindible que falte)
- **Cierres:**
  - el domingo, el miércoles (audiencia) y los días que cierran los Museos, este día se cambia con otro, siempre que se pueda (el día del Vaticano entero, con otro día del viaje que encaje);
  - si no se puede, sin Museos: la mañana empieza en San Pedro con la Basílica y las Grutas (el domingo y los días que cierran los Museos). Los Museos no se quitan: se quedan como parada «Cerrado este día», sin «Llegada a…» y sin ocupar tiempo, con su aviso;
  - **el miércoles, si no se puede cambiar el día** (no hay otro día que encaje, el cambio haría cerrar otras cosas o liaría el viaje, o los Museos están reservados ese miércoles), los Museos abren: van como siempre, a su hora, y no se quitan nunca por ser miércoles. Cambia la Plaza y la Basílica de San Pedro: **nunca van antes de comer** (por la mañana está la audiencia del Papa), tampoco con los Museos reservados por la mañana:
    - **Sin reserva, o con los Museos reservados hasta las 11:30:** los Museos, la comida en el Borgo, la Plaza y la Basílica y, después, lo demás de la tarde (la Conciliazione, el Castillo, el Puente y Trastevere). Con los Museos a media mañana (de 9:30 a 11:30) no cabe todo: San Pietro in Montorio y la Fontana dell'Acqua Paola pasan a «Si te sobra tiempo».
    - **Con los Museos a las 15:00 (hasta las 15:59)** (decidido el 12-oct-2026): el hueco entre la comida y los Museos lo llena el Castillo de Sant'Angelo por dentro ~1 h 30, y por la mañana el Castillo ya no va por fuera. La comida va a su hora, cerca del Vaticano, **nunca antes de las 12:00** (13-oct-2026): si por la mañana queda un rato libre, no pasa nada.
    - **Con los Museos reservados a mediodía (de 12:00 a 14:30) o por la tarde (desde las 15:00):** la mañana sin Museos, la del miércoles (Fontana de Trevi sin gente, Plaza de España, de camino Via dei Coronari, el Puente y el Castillo por fuera), la comida en el Borgo, los Museos a su hora y, al salir, la Plaza y la Basílica. Con los Museos desde las 16:00, la Plaza y la Basílica van antes de los Museos, ya por la tarde (su última entrada es a las 19:15). Lo de Trastevere que no cabe (la Isla Tiberina, Santa Maria in Trastevere, San Pietro in Montorio, la Fontana dell'Acqua Paola y el Janículo) pasa a «Si te sobra tiempo»: con los Museos a las 12:00 cabe todo; a las 12:30 o las 13:00 salen San Pietro in Montorio y la Fontana dell'Acqua Paola; desde las 13:30, toda esa parte, y el día acaba con el paseo por Trastevere.

**Pool:**
- **Cúpula:** después de la Basílica ~45.
- **Castillo por dentro:** ~60, en lugar de por fuera.

**Experiencias:**
- **Arte y Museos:** los Museos con la Pinacoteca ~4 h.
- **Naturaleza y Vistas:** la Cúpula.
- **Mercadillos:** «Plaza de San Pedro y los 100 Presepi».

**Reserva de los Museos a otra hora:** la regla general (la regla 4). La mañana se hace sin los Museos y los Museos van a su hora; después, lo de la tarde en su orden.

**Museos reservados a media mañana (de 9:30 a 11:30):**
- **mañana:** la Basílica de San Pedro por dentro a primera hora (abre a las 7:00; desde las 8:00, casi sin cola) ~1 h y la Plaza ~30;
- «Llegada a…» y 🎟 los Museos a su hora;
- **comida:** en el Borgo (Borghiciana o Dal Toscano), al salir;
- **tarde:** la de siempre (la Conciliazione, el Castillo, el Puente y Trastevere).
- **La Basílica nunca pasa a «de camino»** para que quepa la comida: va antes de los Museos.

**Museos reservados a mediodía (de 12:00 a 14:30):** la comida va antes de los Museos, cerca del Vaticano, porque los Museos duran ~3 h y al salir ya serían más de las 14:30 (regla 4). Por dentro se cuenta corta para que la entrada no salga tarde (30 min, y puede empezar desde las 11:15: es la única excepción a «la comida nunca antes de las 12:00», regla 4): solo ponemos la parada «Comida». Con los Museos hasta las 11:30 la comida va después (sales a las 14:30 o antes).
- **mañana:** Plaza de San Pedro ~30, Basílica por dentro ~1 h 15, la Conciliazione ~10, el Castillo por fuera ~30 y el Puente ~15 (con los Museos a las 12:00, a las 12:30 o a las 13:00, el Castillo y el Puente pasan a después de los Museos, de camino a Trastevere, para que con la comida corta de antes la entrada no salga tarde; a las 12:00, si ni así cabe, la Basílica pasa también a después de los Museos, por dentro, antes de seguir a Trastevere);
- **comida:** en el Borgo, antes de los Museos (Borghiciana o Dal Toscano);
- «Llegada a…» y 🎟 los Museos;
- **tarde:** el bus 23 a Trastevere: la Isla Tiberina, Santa Maria in Trastevere, el Tempietto, la Fontana dell'Acqua Paola y el Janículo;
- **cena y noche:** las de siempre.

**Cómo se monta este día** (decidido el 9-oct-2026, igual que el día del Free Tour): dos partes, **el Vaticano** (los Museos, la Plaza, la Basílica, la Conciliazione, el Castillo por fuera y el Puente) y **Trastevere** (la Isla Tiberina, Santa Maria in Trastevere, el Tempietto, la Fontana dell'Acqua Paola, el Janículo y el paseo). Con los Museos por la mañana (hasta las 14:30), el Vaticano por la mañana y Trastevere por la tarde, como arriba. Con los Museos por la tarde, al revés. La Basílica, antes o después de los Museos, con la misma regla que el D3.

**Museos reservados por la tarde (de las 15:00 a la última entrada, a las 18:00):** Trastevere por la mañana y el Vaticano por la tarde (los Museos cierran a las 20:00: si se entra a las 17:00 o más tarde, la visita es más corta, ~2 h).
- **Mañana:**
  - Isla Tiberina ~20
  - Santa Maria in Trastevere, por dentro ~25
- **Comida:** Da Lucia (o Checco er Carettiere), en Trastevere
- **Tarde:**
  - San Pietro in Montorio y el Tempietto ~10
  - Fontana dell'Acqua Paola ~10
  - Mirador del Janículo ~30
  - *de camino:* el paseo del Janículo, bajando hasta San Pedro (~20 min)
  - «Llegada a…» y 🎟 Museos Vaticanos y Capilla Sixtina ~3 h (con los Museos a las 16:00 o más tarde, la Plaza y la Basílica van antes: su última entrada es a las 19:15)
  - Plaza de San Pedro ~30
  - Basílica de San Pedro, por dentro ~1 h (última entrada a las 19:15)
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, por fuera ~30
  - Puente Sant'Angelo ~15 (ya de noche)
  - Taxi a Trastevere
  - Paseo por Trastevere ~30 (antes de cenar, regla 10)
- **Cena:** Tonnarello (o Da Enzo al 29), en Trastevere
- **Noche:** Trastevere de noche (el paseo ya lo es).
- **La Cúpula** (si el viaje no lleva el D6): no va este día, porque cierra a las 17:00 (a las 18:00 en verano) y el Vaticano va por la tarde.

- **🌧 Si llueve:** el Castillo de Sant'Angelo por dentro (~1 h 30) en vez de por fuera, si el viaje no lo lleva por dentro otro día. El Janículo y la Isla Tiberina salen; Santa Maria in Trastevere por dentro se queda.

---

## Día del Free Tour y el Vaticano por la tarde · D3

- **Mañana:**
  - Fontana de Trevi sin gente ~45 (el día empieza a las 7:30)
  - Desayuno en la Piazza della Rotonda
  - Panteón, por dentro ~30 (abre a las 9:00)
  - 🎟 Free Tour por Roma, 10:00 ~2 h 30. Sale de la Plaza de España y acaba en Navona.
- **Comida:** Armando al Pantheon (o Supplizio)
- **Tarde** (cambiado el 8-oct-2026: antes iba la Basílica primero, y de la Basílica a los Museos y vuelta a la Plaza eran 30 min de ir y volver):
  - Taxi a la entrada de los Museos
  - 🎟 Museos Vaticanos y Capilla Sixtina ~2 h 30 (turno de tarde)
  - Plaza de San Pedro ~30 (al salir de los Museos, ~10 min andando junto a la muralla; la cola de la Basílica se hace aquí)
  - Basílica de San Pedro, por dentro ~1 h (abre hasta las 20:00; última entrada a las 19:15)
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, por fuera ~30
  - Puente Sant'Angelo ~15
- **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati, a ~10 min del Castillo
- **Noche:** la pareja de nocturnas que toque (regla 13), con taxi de 15 min o menos. El Puente y el Castillo ya se han visto de tarde. En un viaje de 3 días suele ser el Coliseo y el Foro desde el Campidoglio, si no se han visto ese día.
- **Domingo (Museos cerrados):** se cambia de día; si no se puede, la tarde sin Museos. Los Museos se quedan como parada «Cerrado este día», sin tiempo.

**Cómo se monta este día** (decidido el 9-oct-2026). Son dos partes, y da igual qué se reserve primero:
- **la parte del Free Tour:** el Free Tour y lo de antes del tour (Trevi, el desayuno, el Panteón…);
- **la parte del Vaticano:** los Museos, la Plaza de San Pedro, la Basílica, la Conciliazione, el Castillo por fuera y el Puente.

**Sin reservas:** el Free Tour de las 10:00 por la mañana y el Vaticano por la tarde (el día de arriba).

**Con una reserva, la otra parte se va a la otra mitad del día:**
- **Free Tour reservado por la mañana (10:00 o 12:00):** el Vaticano entero pasa a la tarde, y acaba con el Castillo y el Puente ya de noche.
- **Free Tour reservado por la tarde (15:00 o 17:00):** el Vaticano pasa a la mañana, con todo. El Castillo y el Puente van después del Free Tour, que acaba en Navona, a 10 min del Puente (cambiado el 9-oct-2026; regla 17: la app no quita nada, solo ordena).
- **Museos reservados por la mañana:** el Free Tour pasa a la tarde. **Museos reservados por la tarde:** el Free Tour pasa a la mañana.

**Las horas de los Museos** (la última entrada es a las 18:00; cierran a las 20:00):

| Museos a las… | Van… | Free Tour (si no está reservado) | La Basílica | La comida |
|---|---|---|---|---|
| 8:00 – 9:00 | por la mañana | 15:00 | después de los Museos | en el Borgo, después |
| 9:30 – 11:30 | por la mañana | 17:00 | antes de los Museos (abre a las 7:00) | en el Borgo, después |
| 12:00 – 13:30 | por la mañana | 17:00 | antes de los Museos | en el Borgo, antes de los Museos (regla 4) |
| 14:00 – 15:30 | por la tarde | 10:00 | después de los Museos | junto a Navona, después del Free Tour |
| 16:00 – 17:00 | por la tarde | 10:00 | antes de los Museos (su última entrada es a las 19:15) | junto a Navona, después del Free Tour |
| 17:30 – 18:00 | por la tarde | 12:00 | antes de los Museos | junto a Navona, después del Free Tour |

**Si el Free Tour y los Museos se reservan en días distintos** (raro; decidido el 9-oct-2026):
- **el día de los Museos** lleva este día (D3) sin el Free Tour: lo que enseña el guía se hace por libre, como paradas, en la mitad del día que deja libre el Vaticano: Plaza de España ~45, Escalinata y Trinità dei Monti ~20, Fontana de Trevi ~30, Panteón por dentro ~30 y Piazza Navona ~45;
- **el día del Free Tour** lleva el D1-FT, y el Free Tour hace de «otra parte»: con el Free Tour por la mañana, la Roma antigua por la tarde; por la tarde, al revés. El Gueto y Trastevere se quedan, al final de la tarde;
- si el viaje no tiene D1-FT, el Free Tour va en el día del centro que haya (el D1), en la mitad del día que deje libre la Roma antigua.

**Si los dos están reservados,** cada uno a su hora, con la misma tabla. Si las horas se cruzan de verdad, el aviso «coinciden» de la regla 17. Si no se cruzan, el día se queda como está escrito, sin más avisos (regla 17, «Sin cuentas al minuto»).

**El Free Tour a otra hora** (decidido el 9-oct-2026). Sin reservar, el de las 10:00 (el día de arriba).
- **A las 12:00:** el mismo día, corrido.
  - el día empieza a las 8:00;
  - **mañana:**
    - Fontana de Trevi sin gente ~45
    - Desayuno en la Piazza della Rotonda
    - Panteón, por dentro ~30
    - Templo de Adriano, por fuera ~10
    - Piazza Colonna y la Columna de Marco Aurelio ~10
    - Via Condotti ~15
    - Plaza de España, la Escalinata y Trinità dei Monti ~40
    - 🎟 Free Tour por Roma, 12:00 ~2 h 30. Acaba en Navona.
  - **comida:** Armando al Pantheon (o Supplizio), antes de las 15:00;
  - **tarde:**
    - Taxi a la entrada de los Museos
    - 🎟 Museos Vaticanos y Capilla Sixtina ~2 h 30 (turno de 16:00 a 16:30)
    - Plaza de San Pedro ~30
    - Basílica de San Pedro, por dentro ~1 h (última entrada a las 19:15)
    - Via della Conciliazione ~10
    - Castillo de Sant'Angelo, por fuera ~30
    - Puente Sant'Angelo ~15
  - **cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati;
  - **noche:** no lleva otra: el Castillo y el Puente ya se ven iluminados al final de la tarde;
- **A las 15:00:** el Vaticano, por la mañana.
  - **mañana:**
    - 🎟 Museos Vaticanos y Capilla Sixtina ~3 h (turno a primera hora)
    - Plaza de San Pedro ~30
    - Basílica de San Pedro, por dentro ~1 h 15
  - **comida:** Borghiciana (o Dal Toscano), en el Borgo;
  - **tarde:**
    - Via della Conciliazione ~10
    - Taxi a la Plaza de España
    - 🎟 Free Tour por Roma, 15:00 ~2 h 30. Acaba en Navona.
    - Panteón, por dentro ~30 (el sábado no deja entrar desde las 17:00: ese día, «Cerrado hoy»)
    - Puente Sant'Angelo ~15
    - Castillo de Sant'Angelo, por fuera ~30
  - **cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati, a ~10 min del Castillo;
  - **noche:** la nocturna que toque (regla 13), que no sea de lo visto ese día (regla 11c);
  - sin Trevi «sin gente»: sale de noche otro día;
- **A las 17:00:** como el de las 15:00, con el Panteón y el camino de la Plaza de España antes del tour, y el Puente y el Castillo después.
  - **mañana y comida:** las del de las 15:00;
  - **tarde:**
    - Via della Conciliazione ~10
    - Taxi al Panteón
    - Panteón, por dentro ~30
    - Templo de Adriano, por fuera ~10
    - Piazza Colonna y la Columna de Marco Aurelio ~10
    - Via Condotti ~15
    - 🎟 Free Tour por Roma, 17:00 ~2 h 30. Sale de la Plaza de España y acaba en Navona.
    - Puente Sant'Angelo ~15 (ya de noche)
    - Castillo de Sant'Angelo, por fuera ~30
  - **cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati;
  - **noche:** la nocturna que toque (reglas 13 y 11c);
- **A las 19:00 y a las 21:00:** no hay D3: el Free Tour va en la noche del D1 (ver el D1 y la tabla «Qué días lleva cada viaje»).
- **Pool:** la Cúpula y el Castillo por dentro no caben: van a otro día del viaje o a «No incluido».
- **Experiencias:**
  - **Mercadillos:** «Plaza de San Pedro y los 100 Presepi».

- **🌧 Si llueve:** el Free Tour se hace igual (aviso: lleva paraguas); el resto ya es por dentro.

---

## Día de la Roma antigua, el Gueto y Trastevere · D1-FT (viajes con Free Tour de mañana)

- **Mañana:** la del Día de la Roma antigua (D1).
- **Comida:** Giggetto al Portico d'Ottavia (o Nonna Betta)
- **Tarde:**
  - Barrio Judío ~25
  - *de camino:* Fuente de las Tortugas
  - Teatro de Marcelo ~10
  - Isla Tiberina ~20
  - Santa Maria in Trastevere, por dentro ~20
  - San Pietro in Montorio y el Tempietto ~10
  - Fontana dell'Acqua Paola ~10
  - Mirador del Janículo ~30
  - *de camino:* bajada a Trastevere
  - Paseo por Trastevere ~30
- **Cena:** Da Enzo al 29 (o Tonnarello, o Checco er Carettiere)
- **Noche:** Fontana de Trevi (taxi) y la Plaza de España

**Con el Coliseo reservado por la tarde (15:30 en adelante)** (decidido el 9-oct-2026): Trastevere por la mañana y la Roma antigua por la tarde.
- **mañana:**
  - Santa Maria in Trastevere, por dentro ~20
  - San Pietro in Montorio y el Tempietto ~10 (abre a las 10:00 y cierra el lunes; si está cerrado: «El mirador de San Pietro in Montorio»)
  - Fontana dell'Acqua Paola ~10
  - Mirador del Janículo ~30
  - *de camino:* bajada a Trastevere
  - Isla Tiberina ~20
  - Teatro de Marcelo ~10
  - Barrio Judío ~25
- **comida:** Giggetto al Portico d'Ottavia (o Nonna Betta), en el Gueto;
- **tarde:** la Roma antigua de la lista del D1 «Por la tarde»: Piazza Venezia, el Altar de la Patria por dentro, la Plaza del Campidoglio, Via dei Fori Imperiali, el Arco, «Llegada a…» y el Coliseo; el Foro y el Palatino antes o después, según la regla del D1; después, taxi a Trastevere y el Paseo por Trastevere ~30 (antes de cenar, regla 10);
- **cena:** Da Enzo al 29 (o Tonnarello), en Trastevere;
- **noche:** la nocturna que toque (regla 13): Trastevere ya se ve en el paseo.
- **Con el Coliseo a mediodía (12:30 – 15:00):** la mañana y la comida de la lista del D1 «A mediodía», y por la tarde el Gueto y Trastevere, enteros.

**Pool:** como el D1, con el Ojo por la tarde. La Galería, 🎟 con su lista de horas del D4, en la mitad del día que deje libre la Roma antigua; la Isla Tiberina y Trastevere se quedan (regla 17: no se quita nada).

**Experiencias:**
- **Arte y Museos:** los Capitolinos.
- **Naturaleza y Vistas:** el ascensor del Altar.
- **Barrios y Sabores:** el Barrio Judío ~45.
- **Mercadillos:** el Santo Bambino de Aracoeli de camino.

- **🌧 Si llueve:** el Foro, más corto; por la tarde, Santa Maria in Trastevere y Santa Cecilia por dentro, en lugar del Janículo y la Isla Tiberina.

---

## Viaje de 2,5 días: los medios días

### Medio día del Tridente y el Pincio · DT-medio

**De mañana:**
- Fontana de Trevi sin gente ~45 (el día empieza a las 7:30)
- Desayuno
- Plaza de España ~45
- *de camino:* Via del Babuino y Via Margutta
- Piazza del Popolo ~20
- Santa Maria del Popolo (los Caravaggio) ~20 (⚠️ por la mañana, de 10:30 a 12:00)
- Terraza del Pincio ~20
- *de camino:* los Jardines del Pincio
- Escalinata y Trinità dei Monti ~20
- Via Condotti ~15
- **Comida:** Poldo e Gianna Osteria (o Edy), en el Tridente

**De tarde:**
- Plaza de España ~45
- *de camino:* Via del Babuino y Via Margutta
- Piazza del Popolo ~15
- Santa Maria del Popolo ~20 (⚠️ abre a las 16:00 y cierra a las 18:00)
- Terraza del Pincio ~30
- Escalinata y Trinità dei Monti ~20
- Via Condotti ~15
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** Coliseo (taxi)

**Pool:** la Galería Borghese, 🎟 por la mañana (turno de las 9:00) o por la tarde, va antes del Pincio. Santa Maria del Popolo, por la tarde.

**Experiencias:**
- **Naturaleza y Vistas:** el Parque de Villa Borghese antes del Pincio.
- **Mercadillos:** antes de cenar, «Luces de Navidad del Tridente» ~30 (Via Condotti y Via del Corso iluminadas).
- **🌧 Si llueve:** el Pincio y sus jardines salen; Santa Maria del Popolo y Trinità por dentro, y el Ara Pacis (~45) entre el Popolo y la Plaza de España.


### Medio día de Monti · DM-medio (con Free Tour de mañana)

- Fontana de Trevi ~10
- Plaza del Quirinal ~15
- *de camino:* Monti (Via Panisperna y la Piazza Madonna dei Monti)
- San Pietro in Vincoli (el Moisés), por dentro ~20
- Santa Maria Maggiore, por dentro ~40
- **Comida:** Trattoria Monti (o La Boccaccia)

**Pool:** San Juan de Letrán y la Escalera Santa, al final; comida en San Giovanni (SantoPalato o Il Bocconcino).

- **🌧 Si llueve:** igual (casi todo es por dentro), con más rato en Santa Maria Maggiore.

---

## Día de Villa Borghese, el Popolo y la Plaza de España · D4

- **Mañana:**
  - Fontana de Trevi sin gente ~45 (el día empieza a las 7:30)
  - Desayuno
  - Fuente del Tritón ~10
  - Via Veneto ~10
  - Porta Pinciana ~10
  - 🎟 Galería Borghese ~2 h (reserva con hora; está dentro del parque, junto a la entrada de Porta Pinciana). Si se llega antes de la hora, se espera en el parque (hasta 40 min, regla 7)
  - Parque de Villa Borghese ~45: la Piazza di Siena y el lago con el Templo de Esculapio (barcas de remos), de camino hacia el Pincio
  - Reloj de agua del Pincio ~10
  - Terraza del Pincio ~20
- **Comida:** Sgarro Bistrot (o Buccone Vini e Olii), junto a la Piazza del Popolo
- **Tarde:**
  - Piazza del Popolo, con el obelisco y las iglesias gemelas ~30
  - Santa Maria del Popolo (los Caravaggio) ~20 (⚠️ abre a las 16:00: si se llega antes, se espera en la Piazza del Popolo, hasta 40 min)
  - Ara Pacis, por dentro ~45 (⚠️ última entrada a las 18:30)
  - Via Condotti ~15
  - Plaza de España ~45
  - Escalinata y Trinità dei Monti ~20
  - *de camino:* Via Margutta
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** Coliseo (taxi)

**Lunes (la Galería cierra):**
- primero, el cambio de orden de los días;
- si no se puede, en lugar de la Galería, la Cripta de los Capuchinos (Via Veneto, ~45; abre a las 10:00), después de la Fuente del Tritón.

**La Galería Borghese a otra hora** (las entradas empiezan cada hora, de 9:00 a 17:00, y hay una a las 17:45; cada visita dura 2 h, y la de las 17:45, 1 h 15, porque cierra a las 19:00):
- **Qué lista usa cada hora:** 9:00 y 10:00 → la de las 9:00; 11:00 → el día normal; 12:00 → la de las 12:00; 13:00, 14:00, 15:00, 16:00, 17:00 y 17:45 → el día al revés (con la entrada a las 13:00 o a las 14:00, la comida antes: ver la lista).
- **A las 9:00:**
  - **mañana:** desayuno cerca de Via Veneto, la Fuente del Tritón ~10, Via Veneto ~10 y Porta Pinciana ~10, «Llegada a…» y la Galería; después, el lago, la Piazza di Siena, el reloj de agua y el Pincio;
  - **tarde:** la de siempre;
  - **Trevi:** no cabe a primera hora. Si el viaje no la lleva otro día, va al final de la tarde como parada (Fontana de Trevi ~30), entre la Plaza de España y la cena (~7 min).
- **A las 11:00:** el día normal (la Galería y después el parque, de camino al Pincio).
- **De las 13:00 a las 17:45:** el día va al revés.
  - **mañana:** Trevi «sin gente» a las 7:30, desayuno, la Plaza de España, la Escalinata y Trinità dei Monti, Via Condotti ~15, el Ara Pacis por dentro (abre a las 9:30), de camino Via di Ripetta, la Piazza del Popolo y Santa Maria del Popolo (por la mañana abre);
  - **comida:** junto a la Piazza del Popolo (Sgarro Bistrot o Buccone);
  - **comida:** antes de la Galería (con la entrada a las 12:35 o más tarde sales después de las 14:30; regla 4);
  - **tarde:** la Terraza del Pincio y el reloj de agua, «Llegada a…» y la Galería; al salir, el lago y la Piazza di Siena, Porta Pinciana ~10, Via Veneto ~10 y la Fuente del Tritón ~10 (cambiado el 9-oct-2026: el lago, después de la Galería, para no comer demasiado pronto);
  - **cena:** en el Tridente.
- **A las 12:00** (decidido el 9-oct-2026; vale hasta las 12:30 incluida: la Galería dura 2 h y sales a las 14:30; desde las 12:35, la comida va antes, regla 4): el parque antes y la comida después.
  - **mañana:** Trevi «sin gente» a las 7:30, desayuno, la Fuente del Tritón ~10, Via Veneto ~10, Porta Pinciana ~10, el lago y la Piazza di Siena ~30, el reloj de agua ~10, la Terraza del Pincio ~20, y vuelta por el parque: «Llegada a…» y la Galería (cambiado el 9-oct-2026: así se llega a la entrada y se come antes de las 15:00);
  - **comida:** junto a la Piazza del Popolo (Sgarro Bistrot o Buccone), bajando por el Pincio (~20 min);
  - **tarde:** la Piazza del Popolo ~30, Santa Maria del Popolo ~20 (abre a las 16:00), el Ara Pacis por dentro ~45, Via Condotti ~15, la Plaza de España ~45 y la Escalinata y Trinità dei Monti ~20, y *de camino* Via Margutta;
  - **cena y noche:** las de siempre.

**Con Free Tour de mañana:** sin Trevi ni desayuno, y sin el Tritón, Via Veneto ni Porta Pinciana del principio: **el día empieza directamente en Villa Borghese** (taxi hasta Porta Pinciana), con la Galería primero. Después, el parque (la Piazza di Siena y el lago), el reloj de agua y la Terraza del Pincio. La Plaza de España sale otra vez como parada corta (~10 min) por la tarde (el tour ya pasó, y los imprescindibles nunca van de camino); Via Condotti ~15, como parada.

**Experiencias:**
- **Naturaleza y Vistas:** el lago de Villa Borghese ~60.
- **Mercadillos:** antes de cenar, «Luces de Navidad del Tridente» ~30 (Via Condotti y Via del Corso iluminadas).

- **🌧 Si llueve:** el lago y el reloj de agua salen y el Pincio va de camino; la Galería se queda, y hay más rato en Santa Maria del Popolo y el Ara Pacis.

---

## Medio día del Aventino y Testaccio · DA-medio (3,5 días, mañana de vuelta)

- Termas de Caracalla, por dentro ~1 h 15 (abre a las 9:00)
- Circo Máximo ~20
- Boca de la Verdad ~20
- Jardín de los Naranjos ~30
- Ojo de la Cerradura del Aventino ~15
- **Comida:** en el Mercado de Testaccio, Mordi e Vai (o Felice a Testaccio)
- Pirámide Cestia ~15 (al lado del metro Piramide y del tren al aeropuerto)
- Cementerio Protestante ~30 (de lunes a sábado, de 9:00 a 17:00; domingos, hasta las 13:00), si queda tiempo antes de irse
- **Lunes (Caracalla cierra):** empieza en el Circo Máximo y al final, el Cementerio Protestante ~30.

**De tarde (si el medio día es la tarde de llegada):**
- Circo Máximo ~20
- Boca de la Verdad ~20 (⚠️ abre de 9:30 a 17:50 todo el año: si no da tiempo, por fuera)
- Ojo de la Cerradura del Aventino ~15
- Jardín de los Naranjos ~30, con la vista de Roma (⚠️ abre de 7:00 a 18:00 de octubre a febrero, a 20:00 en marzo y septiembre, y a 21:00 de abril a agosto; casi todo octubre cierra antes de que se ponga el sol: aviso «Cierra a las 18:00: entra antes»)
- *de camino:* bajada a Testaccio
- Pirámide Cestia ~15
- **Cena:** Felice a Testaccio (o Da Remo)
- **Noche:** la pareja que toque (regla 13)
- Las Termas de Caracalla no van de tarde: cierran pronto, sobre todo en invierno.
- **Experiencias:**
  - **Naturaleza y Vistas:** el Jardín de los Naranjos ~45.

- **🌧 Si llueve:** Caracalla, el Jardín de los Naranjos y el Ojo, más cortos (son al aire libre); Santa Maria in Cosmedin (la iglesia de la Boca de la Verdad) por dentro; la comida en el Mercado de Testaccio, que está cubierto.

---

## Día de las basílicas y el Aventino · D5

- **Mañana:**
  - Santa Maria Maggiore, por dentro ~30
  - *de camino:* Monti (Via Panisperna y la Piazza Madonna dei Monti)
  - San Pietro in Vincoli (el Moisés), por dentro ~20
  - Basílica de San Clemente, con las excavaciones ~40 (⚠️ cierra de 12:30 a 14:00; las excavaciones, con reserva en línea y última entrada a las 12:00 por la mañana)
  - San Juan de Letrán y la Escalera Santa ~40
- **Comida:** SantoPalato (o Il Bocconcino), en San Giovanni
- **Tarde:**
  - Taxi a las Termas de Caracalla
  - Termas de Caracalla, por dentro ~1 h 15 (⚠️ en invierno cierra pronto)
  - Circo Máximo ~20
  - Boca de la Verdad ~20
  - Jardín de los Naranjos ~30
  - Ojo de la Cerradura del Aventino ~15
  - Pirámide Cestia ~15, de camino a la cena (por fuera; el Cementerio Protestante, al lado, cierra a las 17:00 y no da tiempo)
- **Cena:** Felice a Testaccio
- **Noche:** la pareja que toque (regla 13). Suele ser el Panteón y Piazza Navona (taxi, ~10 min).
- **Lunes:** Caracalla cierra: sale con «Cerrado hoy».
- **Domingo:** San Clemente solo abre por la tarde: va después de comer y el taxi sale de allí.
- **Ya no van** el paseo por el Aventino ni el de Testaccio (decidido el 6-oct: sin paseos).
- **Pool:** la Domus Aurea, 🎟 solo con reserva y de viernes a domingo (el primer domingo de cada mes cierra), por la mañana entre San Pietro in Vincoli y San Clemente.
- **Experiencias:**
  - **Naturaleza y Vistas:** el Jardín de los Naranjos ~45.
  - **Mercadillos:** el belén de Santa Maria Maggiore.

- **🌧 Si llueve:** la mañana igual (todo por dentro); por la tarde, Caracalla, el Jardín de los Naranjos y el Ojo, más cortos, y Santa Maria in Cosmedin por dentro.

---

## Roma desde arriba · D6

- **Mañana:**
  - Cúpula de San Pedro ~1 h 15 (se sale por la Basílica)
  - Plaza de San Pedro ~10
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, hasta la terraza del ángel, por dentro ~1 h 30
  - Puente Sant'Angelo ~10
  - *de camino:* Via dei Coronari
  - Piazza Navona ~10
  - Panteón ~10
- **Comida:** Enoteca Corsi (o Giggetto al Portico d'Ottavia)
- **Tarde:**
  - *de camino:* Plaza del Campidoglio («Ya lo visitaste el {día}»)
  - Museos Capitolinos, con la terraza sobre los Foros ~1 h 30
  - El Foro Romano, desde la terraza del Campidoglio ~15
  - Santa Maria in Aracoeli y su escalinata ~20
  - Piazza Venezia ~10
  - Columna de Trajano y Mercados de Trajano ~1 h
  - Terraza del Altar de la Patria (ascensor panorámico) ~45 (⚠️ última subida a las 18:45). Cuenta como un sitio aparte del Altar por dentro del D1: es otra entrada y otra visita, así que no la quita la regla de «por dentro una sola vez».
  - Teatro de Marcelo ~10, de camino a la cena
- **Cena:** Giggetto al Portico d'Ottavia, en el Barrio Judío (Nonna Betta, solo si no ha salido en el viaje: es la comida del D1)
- **Noche:** la que no haya salido en el viaje y no se haya visto ese día (regla 11c). En 5 y 6 días no queda ninguna: sin nocturna. El día acaba pronto (hacia las 17:00–17:30) y va con «mejor que sobre»: en HOY, «Vas bien de tiempo» con sugerencias.
- **Lunes:** el Castillo cierra: por fuera ~30, y lo de después se adelanta.
- **Miércoles (audiencia):** la mañana va al revés y la Cúpula al final, cuando acaba la audiencia (desde las 12:30): Piazza Navona, el Panteón ~10 y, de camino, Via dei Coronari, el Puente, el Castillo por dentro, la Plaza de San Pedro ~10, la Cúpula y comida en el Borgo (Arlù o 200 Gradi). El día empieza a su hora. En julio no hay audiencias.
- **Experiencias:**
  - **Arte y Museos:** los Capitolinos ~2 h 30.
  - **Mercadillos:** el Santo Bambino en Santa Maria in Aracoeli.

- **🌧 Si llueve:** la Cúpula sale (con lluvia no hay vista y la subida final es por fuera) y el Castillo empieza la mañana; más rato en los Capitolinos; la terraza del Altar, solo si escampa.

---

## La Vía Appia y Trastevere tranquilo · D7

- **Mañana:**
  - Campo de' Fiori, con su mercado (solo por la mañana, de lunes a sábado) ~30
  - Plaza Farnese ~15
  - *de camino:* Ponte Sisto
  - Villa Farnesina (los frescos de Rafael) ~45 (⚠️ de 9:00 a 14:00; cierra el domingo)
  - *de camino:* Santa Maria in Trastevere
  - Santa Cecilia in Trastevere ~40
  - *de camino:* la Piazza in Piscinula
- **Comida:** Da Enzo al 29 (o Da Lucia, o Checco er Carettiere, o Da Teo), en Trastevere. Tonnarello no, si ya es la cena del D2.
- **Tarde:**
  - Taxi a las Catacumbas de San Calixto
  - Catacumbas de San Calixto (visita guiada) ~1 h (⚠️ cierran el miércoles, y del 13 de enero al 10 de febrero de 2027)
  - Vía Appia Antica en bici: los pinos, las tumbas y la de Cecilia Metela ~2 h
  - Taxi a Monti
  - El Coliseo desde la terraza de Largo Gaetana Agnesi ~20
  - *de camino:* Monti
- **Cena:** La Taverna dei Fori Imperiali (o Trattoria Valentino), en Monti
- **Noche:** la que no haya salido en el viaje, la más cerca de la cena; si no queda ninguna, sin nocturna. En 6 días suele ser el Puente y el Castillo de Sant'Angelo (taxi, ~15 min desde Monti).
- **Domingo:** la Farnesina cierra: la mañana empieza en Santa Maria in Trastevere; Da Enzo cierra: la siguiente alternativa abierta (Da Lucia abre el domingo a mediodía; Checco er Carettiere, todos los días).
- **Miércoles:** sin catacumbas; la Vía Appia empieza antes.

- **🌧 Si llueve:** sin bici: la Vía Appia se ve en taxi hasta la tumba de Cecilia Metela (~30), y más rato en las Catacumbas, que son bajo tierra.

---

## Excursión de medio día (Ostia, Tívoli)

Si el viajero elige una excursión de medio día en el día de excursión (el día 4 con el interruptor en Excursión):
- **De 8:00 a 14:00:** la excursión (su línea de horas acaba a las 14:00).
- **Después:** el texto «Vuelves a Roma a las 14:00. La tarde es para ti.» y el botón **«+ Añadir lugares»** (como el de «Añadir día» de la pestaña DÍAS), que abre EXPLORAR.
- **Nada más:** ni comida ni tarde propuestas. Lo que añada el viajero se monta con las reglas de siempre.

---

## Llegadas y vueltas (decidido el 8-oct-2026; repasado el 13-oct-2026 para la Tanda 7)

**La idea de fondo:** nosotros ponemos **las paradas**; el viajero decide cuándo las empieza. **No calculamos al minuto:** la hora de llegada y la de salida, como la de una reserva, solo eligen la **fila** de una tabla, y lo que lleva cada fila es una **lista escrita** en este documento. El motor no quita ni mueve nada por minutos.

**Gratis y de pago:** todo esto es de pago. En la gratis (y con el pago apagado), el viaje sale con días enteros, como sin vuelos, y el día de vuelta va sin ruta, con su tarjeta «Tu último día también cuenta». Si un viaje tiene horas guardadas y se ve en la gratis, el motor no las usa y no las borra.

### Cómo se cuentan los días
- **Por noches.** El último día del viaje, el de la fecha de vuelta, es el **día de vuelta**: lo crea la app y no lleva ruta, solo su barra. «3 noches» son 3 días de ruta más el día de vuelta. Las tablas de este documento («2 días», «4 días»…) son días de ruta.
- **Con una sola fecha** (llegar e irse el mismo día) no hay día de vuelta aparte: es el D0 de siempre, con las dos barras. Las horas no lo recortan.
- **Cómo se enseña,** siempre los dos, primero los días: «{n+1} días · {n} noches» (del 10 al 14: «5 días · 4 noches»). Con una sola fecha: «1 día».
- **La llegada es el día 1** y **la vuelta es el día de vuelta.** Nunca hay varios destinos: una llegada y una vuelta por viaje.

### Lo que pone el viajero (en RESERVAS, nunca en el formulario)
- **La hora de llegada y la de salida,** con su aeropuerto, estación o puerto. Ya existen en RESERVAS («+ AÑADIR VUELO», los botones de Fiumicino y Ciampino); se usan esas, no otras nuevas.
  - **El día** es el primero y el último del viaje. Debajo de la hora, en pequeño: «¿Llegas o te vas otro día? Cambia las fechas del viaje», que abre el cambio de fechas que ya existe.
  - **La vuelta usa su propio medio,** que puede no ser el de la ida (como ya hace la app).
  - **En coche no se pide hora,** como ahora: el viaje sale con días enteros.
- **«¿En qué zona te alojas?»,** en el bloque del alojamiento de RESERVAS (sirve para saber por dónde empieza la ruta del día 1 y para «Para tu zona», abajo): Centro (Panteón, Trevi, Navona) · Plaza de España (Plaza de España, Popolo, Via del Corso) · Prati (Vaticano) · Trastevere · Termini · Monti (Coliseo) · Aún no lo sé. «Aún no lo sé» cuenta como Centro.
- **Sin hora de llegada ni de salida,** el viaje sale con días enteros, como hasta ahora.

### Las horas: libre y salir
- **Todas las horas salen de `_llegada.json`,** que ya tiene los tiempos comprobados de cada punto. No se escriben en ningún otro sitio.
- **Libre** = la hora de llegada + el traslado de ese punto + 30 min para dejar la maleta:

  | Punto | Libre = llegada + |
  |---|---|
  | Fiumicino | 1:30 |
  | Ciampino | 1:20 |
  | Termini | 0:45 |
  | Tiburtina (tren) | 0:55 |
  | Estación de autobuses de Tiburtina | 0:55 |
  | Civitavecchia | 2:30 |

  Si pasa de la medianoche, sigue siendo el mismo día: cuenta en la última fila.
- **Salir** = la hora de salida − el margen de ese punto:

  | Punto | Salir = salida − |
  |---|---|
  | Fiumicino | 3:00 |
  | Ciampino | 2:50 |
  | Termini | 0:45 |
  | Tiburtina (tren) | 0:55 |
  | Estación de autobuses de Tiburtina | 0:55 |
  | Civitavecchia | 3:50 |

  Si queda antes de la medianoche, es la noche del día de antes.
- **Ninguna de las dos horas se enseña nunca:** ni la de «libre» ni la de «salir». Solo eligen la fila de una tabla. A la vista solo van las horas que pone el viajero (su vuelo, sus reservas) y las de los datos (un horario, el último tren, «32 min, sin paradas»). Nunca un tiempo total sumado por la app.
- **Cada tramo empieza en su hora:** libre a las 14:00 en punto ya es la fila de las 14:00. La hora no se redondea para elegir la fila. La única excepción escrita es la del Coliseo en su tabla de horas («hasta las 13:00 incluida»).
- **Los tiempos se cuentan siempre desde el centro,** y la zona no cambia la hora de salir. En los textos para el viajero no sale nunca la palabra «centro» (los nombres de zona, como «Centro (Panteón, Trevi, Navona)», y los datos reales, como «32 km al centro», sí).
- **Invierno y de marzo a octubre:** «invierno» son los días en que el Coliseo cierra a las 16:30 según el horario de su fecha (hoy, del último domingo de octubre al último sábado de febrero); todos los demás días son «de marzo a octubre». Así, los últimos días de octubre son invierno. Nunca se escriben fechas a mano: se mira el horario de la fecha. Sin fechas, se usa el día 15 del mes.
- **Vuelos de madrugada** (de 0:00 a 4:59):
  - **a la llegada,** el día 1 es un día entero normal (se duerme y se empieza a su hora, las 9:00);
  - **a la vuelta,** cuenta como la noche de antes: el último día de ruta lleva su cena y no lleva nocturna, y el día de vuelta solo lleva el traslado.
- **Vuelos de vuelta de 5:00 a 9:00:** el día de antes es normal, con su noche, y el día de vuelta solo lleva el traslado.

### Lo que se ve en el día
- **La barra de llegada,** sin hora calculada: «LLEGADA · VUELO 09:00 · FIUMICINO». Es la hora que puso el viajero. No lleva ninguna hora de la derecha.
- **La barra de vuelta,** igual: «VUELTA · VUELO 17:00 · FIUMICINO». Nunca «sal a las…».
- **El título del día,** por grupos, como siempre. Un día de llegada o de vuelta **sin paradas** se llama **«Día de viaje»**, nunca «Día libre».
- **Los días por su fecha** («el mar 10»; sin fechas, «el día 1»); nunca «Día 1» con fechas.

### Los días reales
- **La idea:** con vuelos, el viaje es el mismo que sin vuelos («Qué días lleva cada viaje»). Solo cambian el **primer día** y el **último**; los días de en medio no se mueven.
- **El día 1** es el **D1** (la Roma antigua y el centro) en la versión que toque por la hora a la que está libre (ver «Qué lleva el día 1 según la hora»). Con el Free Tour de mañana, el día 1 es el D3 o su parte del Free Tour (ver «El Free Tour y otras reservas el día de llegada»).
- **El D1 pasa entero al día 2** cuando está libre desde las 14:00 (en invierno, desde las 13:00): todo se corre un día y se cae el último día de ruta del viaje, que es el de menos importancia (en 3 noches, el D4: Villa Borghese; en 4, el de Roma del día 4…). Vuelve como «un día más» si el vuelo de vuelta lo permite (ver «El día de vuelta»). Si el viajero reserva la Galería Borghese, su día vuelve solo (reserva grande).
- **La zona** solo decide por dónde empieza la ruta del centro, no el D1 ni sus versiones, que van por la hora, el mes y la reserva del Coliseo.
- **La nocturna de la llegada** cuenta para el viaje (no se repite otra noche) y solo como nocturna: lo visto solo de noche sigue siendo parada de día otro día.
- **El día de llegada cumple las reglas de cierres** de cualquier día, con el horario de su fecha.
- **Viajes de 1 y 2 noches:** no se escriben días nuevos. El día 1 usa las mismas versiones, y lo que no cabe va a la mañana del día de vuelta (la primera que no ha visto) o, si tampoco cabe, a «Si te sobra tiempo» con el aviso «{sitio} lo tienes en «Si te sobra tiempo» del {día}: si reservas la entrada, te lo ponemos en el día.».
  - **2 noches, libre antes de las 14:00** (en invierno, antes de las 13:00): día 1, el D1 en su versión (tranquila, rápida o de tarde); día 2, el D2 entero; la vuelta, por su tabla.
  - **2 noches, libre desde las 14:00** (en invierno, desde las 13:00): día 1, la ruta del centro en su fila; día 2, **D1+Vaticano (2 noches con llegada tarde)**, escrito abajo; la vuelta, la primera mañana que no ha visto. Nunca la parte del centro del D1 (se repetiría).
  - **2 noches con Free Tour de mañana:** como se cuenta en «El Free Tour y otras reservas el día de llegada», con el día 2 que toque; lo que no cabe, a la mañana de la vuelta.
  - **1 noche, libre antes de las 10:00:** el D0 entero, como sin vuelos. **De 10:00 a 13:59:** el D1 en su versión rápida o de tarde, y la mañana de la vuelta, el Vaticano si el vuelo lo permite. **Desde las 14:00:** la ruta del centro en su fila, la mañana de la vuelta el Vaticano si cabe, y el Coliseo a «Si te sobra tiempo» con su aviso.
  - **1 día (D0) un miércoles con la versión sin Museos** (por ejemplo, el 6 de enero en miércoles), también sin vuelos: va el D0 del miércoles que ya está escrito arriba (por la mañana el Panteón por dentro, Piazza Navona, el Puente y el Castillo por fuera; la comida en el Borgo; después de comer, la Plaza y la Basílica, y la tarde de siempre). Así la mañana nunca queda vacía.
- **La regla 11c** (la noche y lo visto ese día) cuenta los días del viaje por sus fechas.

### Qué lleva el día 1 según la hora (viajes de 3 noches o más, sin Free Tour de mañana)
Cada fila es una lista escrita (más abajo, con ese nombre). Las dos tablas, la de **marzo a octubre** y la de **invierno**, cubren las 24 horas. La primera fila es por la hora de **llegada** (el vuelo de madrugada); las demás, por la hora a la que el viajero está **libre**. Si el viajero reserva el Coliseo, manda la tabla de la hora del Coliseo del D1, como siempre. Después de la lista: «comida al llegar» es la parada «Comida, cerca de tu alojamiento» (sin restaurante nuestro) antes de la primera parada; «comida corta» es la misma comida contada en 45 min.

#### El día 1, de marzo a octubre

| Libre a las… | El día 1 |
|---|---|
| llega de 0:00 a 4:59 | D1 · desde las 9:00 |
| antes de las 10:00 | D1 («Por la tarde (a las 15:30 o más tarde)») |
| de 10:00 a 11:59 | D1-rapido |
| de 12:00 a 13:59 | D1-tarde · comida al llegar |
| de 14:00 a 14:59 | D1-centro-navona o D1-centro-espana · comida al llegar · el D1 pasa al día 2 |
| de 15:00 a 18:59 | D1-centro-navona o D1-centro-espana · el D1 pasa al día 2 |
| de 19:00 a 20:29 | D1-anochecer-navona o D1-anochecer-espana · el D1 pasa al día 2 |
| de 20:30 a 21:59 | D1-noche · el D1 pasa al día 2 |
| de 22:00 a 22:59 | D1-noche-sin-cena · el D1 pasa al día 2 |
| a las 23:00 o más tarde | D1-sin-ruta · el D1 pasa al día 2 |

#### El día 1, en invierno

| Libre a las… | El día 1 |
|---|---|
| llega de 0:00 a 4:59 | D1 · desde las 9:00 |
| antes de las 10:00 | D1 |
| de 10:00 a 10:59 | D1-rapido-invierno-10 |
| de 11:00 a 11:59 | D1-rapido-invierno-11 |
| de 12:00 a 12:59 | D1-tarde · comida al llegar · comida corta (45 min) |
| de 13:00 a 13:59 | D1-centro-entera-navona o D1-centro-entera-espana · comida al llegar · el D1 pasa al día 2 |
| de 14:00 a 14:59 | D1-centro-navona o D1-centro-espana · comida al llegar · el D1 pasa al día 2 |
| de 15:00 a 18:59 | D1-centro-navona o D1-centro-espana · el D1 pasa al día 2 |
| de 19:00 a 20:29 | D1-anochecer-navona o D1-anochecer-espana · el D1 pasa al día 2 |
| de 20:30 a 21:59 | D1-noche · el D1 pasa al día 2 |
| de 22:00 a 22:59 | D1-noche-sin-cena · el D1 pasa al día 2 |
| a las 23:00 o más tarde | D1-sin-ruta · el D1 pasa al día 2 |

- **TRANQUILO (antes de las 10:00).** De marzo a octubre, el D1 «al revés» (su versión «Por la tarde (a las 15:30 o más tarde)», más arriba: la parte del centro por la mañana y la Roma antigua por la tarde), con todas sus paradas. En invierno, el D1 de siempre (la Roma antigua por la mañana). La versión tranquila no es una lista nueva.
- **RÁPIDO (de 10:00 a 11:59)** y **DE TARDE (de 12:00 a 13:59)** son listas nuevas, a buen paso: **los sitios por dentro que no son de los grandes se ven por fuera o más cortos, con sus propios minutos; los sitios grandes llevan siempre su tiempo entero** (el Coliseo, el Foro y Palatino, los Museos…).
- **La ruta del centro** tiene dos inicios según la zona del alojamiento (ver «Por dónde empieza la ruta del centro»). La cena de la ruta del centro es donde acaba la ruta, con el restaurante de esa zona.
- **La nocturna de las rutas** que dicen «la nocturna que toque» es la regla 13: no repite lo visto ese día (suele ser el Coliseo y el Foro desde el Campidoglio, en taxi de 15 min o menos).
- **Los dos puntos de las 22:00:** la cena del día 1 solo sale si el viajero está libre antes de las 22:00; por eso son dos filas.
- **«El D1 pasa al día 2»** quiere decir lo que dice «Los días reales»: se corre un día y se cae el último.

### La «Llegada a Roma» (el día 1)
Las listas de abajo son las de las tablas de arriba. Todas van **por fuera y a buen paso**, con sus propios minutos, salvo la que dice «entera».

#### Por dónde empieza la ruta del centro (según la zona)
La zona solo decide **por dónde empieza** la ruta del centro (las filas desde las 14:00 y la de invierno de 13:00 a 13:59). Desde Prati se cruza el Puente; desde Trastevere, el Ponte Sisto; desde Monti, el bus 40 o 64.

| Zona | Empieza en |
|---|---|
| Centro | Navona |
| Prati | Navona |
| Trastevere | Navona |
| Monti | Navona |
| Aún no lo sé | Navona |
| Plaza de España | Plaza de España |
| Termini | Plaza de España |

- **Empieza en Navona:** Piazza Navona · Panteón · Fontana de Trevi · Via Condotti · Plaza de España · Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo.
- **Empieza en la Plaza de España:** Plaza de España · Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo · de camino Via del Corso · Fontana de Trevi · Panteón · Piazza Navona. Desde Termini va en el metro A, directo a Spagna; la ruta acaba en Navona y vuelve en el bus 40 o 64.
- **La comida y la cena de la ruta del centro:** se come donde esté la ruta, con el restaurante de esa zona, sin repetir en el viaje (Navona y el Panteón: Armando al Pantheon o Da Baffetto; el Tridente: Poldo e Gianna o Edy). La cena: si la ruta acaba en Trevi o antes, Armando o Da Baffetto; si llega a la Plaza de España o más allá, Il Gabriello o Poldo e Gianna. Desde la Plaza de España, al revés.
- **Si llega tarde,** lo primero que sale de la ruta es el Pincio y el Popolo, que son lo menos vistoso: van a «Si te sobra tiempo».

### La ruta rápida del día 1 (marzo a octubre) · D1-rapido
Para quien está libre de 10:00 a 11:59: por la mañana, el centro a buen paso; después de comer, la Roma antigua entera. Trevi ya se vio por la mañana y no se repite de noche (regla 11c).

- **Mañana:**
  - Piazza Navona ~20
  - Panteón, por fuera ~15 (con su etiqueta de reserva)
  - Fontana de Trevi ~20
- **Comida:** Armando al Pantheon (o Da Baffetto)
- **Tarde:**
  - 🎟 Coliseo, por dentro ~1 h 15 (turno)
  - Arco de Constantino ~10
  - Foro Romano y Palatino, por dentro ~1 h 30 (se sale por el Campidoglio)
  - Plaza del Campidoglio ~30
  - Piazza Venezia ~10
  - Altar de la Patria, por dentro ~45
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** la Plaza de España y la Escalinata
- **Si te sobra tiempo:** Barrio Judío ~30, Fuente de las Tortugas ~5, Largo di Torre Argentina ~15, San Luigi dei Francesi (los Caravaggio) ~20, Iglesia del Gesù ~20

### La ruta rápida del día 1 en invierno, libre de 10:00 a 10:59 · D1-rapido-invierno-10
En invierno la Roma antigua va siempre primero (el Coliseo cierra a las 16:30). La comida, en el Gueto, antes de las 15:00; después, la parte del centro a buen paso.

- **Mañana:**
  - 🎟 Coliseo, por dentro ~1 h 15 (turno)
  - Arco de Constantino ~10
  - Foro Romano y Palatino, por dentro ~1 h 30 (se sale por el Campidoglio)
  - Plaza del Campidoglio ~30
- **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío
- **Tarde:**
  - Piazza Venezia ~10
  - Altar de la Patria, por dentro ~45
  - Panteón, por dentro ~30
  - Piazza Navona ~20
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** Fontana de Trevi y la Plaza de España
- **Si te sobra tiempo:** Barrio Judío ~30, Fuente de las Tortugas ~5, Largo di Torre Argentina ~15, San Luigi dei Francesi (los Caravaggio) ~20, Iglesia del Gesù ~20

### La ruta rápida del día 1 en invierno, libre de 11:00 a 11:59 · D1-rapido-invierno-11
Igual que la anterior, pero la comida va primero (nunca antes de las 12:00): en Monti, al lado del Coliseo, y después la Roma antigua y la parte del centro.

- **Comida:** La Taverna dei Fori Imperiali (o Trattoria Valentino), en Monti
- **Tarde:**
  - 🎟 Coliseo, por dentro ~1 h 15 (turno)
  - Arco de Constantino ~10
  - Foro Romano y Palatino, por dentro ~1 h 30 (se sale por el Campidoglio)
  - Plaza del Campidoglio ~30
  - Piazza Venezia ~10
  - Altar de la Patria, por dentro ~45
  - Panteón, por dentro ~30
  - Piazza Navona ~20
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** Fontana de Trevi y la Plaza de España
- **Si te sobra tiempo:** Barrio Judío ~30, Fuente de las Tortugas ~5, Largo di Torre Argentina ~15, San Luigi dei Francesi (los Caravaggio) ~20, Iglesia del Gesù ~20

### El día 1 de tarde · D1-tarde
Para quien está libre de 12:00 a 13:59: la comida al llegar (la fila la pone) y la Roma antigua entera, con el centro al atardecer. **En invierno, de 12:00 a 12:59,** es la misma lista con la comida corta (45 min) para entrar al Coliseo y al Foro antes de su última entrada.

- **Tarde:**
  - 🎟 Coliseo, por dentro ~1 h 15 (turno)
  - Arco de Constantino ~10
  - Foro Romano y Palatino, por dentro ~1 h 30 (se sale por el Campidoglio)
  - Plaza del Campidoglio ~30
  - Piazza Venezia ~10
  - Altar de la Patria, por dentro ~45
  - Panteón, por dentro ~45 (parada normal al atardecer, sin aviso de su última entrada)
  - Piazza Navona ~45
- **Cena:** Da Baffetto (o Armando al Pantheon)
- **Noche:** Fontana de Trevi y la Plaza de España
- **Si te sobra tiempo:** Barrio Judío ~30, Fuente de las Tortugas ~5, Largo di Torre Argentina ~15, San Luigi dei Francesi (los Caravaggio) ~20, Iglesia del Gesù ~20

### La ruta del centro a buen paso, desde Navona · D1-centro-navona
Libre desde las 14:00 hasta las 18:59 (de 14:00 a 14:59, con la comida al llegar). Todo por fuera. Unas 2 h con los paseos.

- **Empieza en:** Navona
- **Tarde:**
  - Piazza Navona ~20
  - Panteón, por fuera ~15 (con su etiqueta de reserva)
  - Fontana de Trevi ~20
  - Via Condotti ~10
  - Plaza de España ~20
  - Escalinata y Trinità dei Monti ~15
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** la nocturna que toque (regla 13): no repite lo visto ese día; suele ser el Coliseo y el Foro desde el Campidoglio (taxi, 15 min o menos)
- **Si te sobra tiempo:** Terraza del Pincio ~20, Piazza del Popolo ~20

### La ruta del centro a buen paso, desde la Plaza de España · D1-centro-espana
La misma ruta, empezando en la Plaza de España y sin volver atrás.

- **Empieza en:** Plaza de España
- **Tarde:**
  - Plaza de España ~20
  - Escalinata y Trinità dei Monti ~15
  - *de camino:* Via del Corso
  - Fontana de Trevi ~20
  - Panteón, por fuera ~15 (con su etiqueta de reserva)
  - Piazza Navona ~20
- **Cena:** Armando al Pantheon (o Da Baffetto)
- **Noche:** la nocturna que toque (regla 13): no repite lo visto ese día; suele ser el Coliseo y el Foro desde el Campidoglio (taxi, 15 min o menos)
- **Si te sobra tiempo:** Terraza del Pincio ~20, Piazza del Popolo ~20

### La ruta del centro entera, desde Navona · D1-centro-entera-navona
Solo en invierno, libre de 13:00 a 13:59 (con la comida al llegar). Con todos sus minutos, el Pincio y el Popolo incluidos.

- **Empieza en:** Navona
- **Tarde:**
  - Piazza Navona ~45
  - Panteón, por fuera ~30 (con su etiqueta de reserva)
  - Fontana de Trevi ~45
  - Via Condotti ~15
  - Plaza de España ~45
  - Escalinata y Trinità dei Monti ~20
  - Terraza del Pincio ~20
  - Piazza del Popolo ~20
- **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente
- **Noche:** la nocturna que toque (regla 13): no repite lo visto ese día
- **Mercadillos (8 dic – 6 ene):** «Piazza Navona y su mercadillo navideño».

### La ruta del centro entera, desde la Plaza de España · D1-centro-entera-espana
Solo en invierno, libre de 13:00 a 13:59 (con la comida al llegar).

- **Empieza en:** Plaza de España
- **Tarde:**
  - Plaza de España ~45
  - Escalinata y Trinità dei Monti ~20
  - Terraza del Pincio ~20
  - Piazza del Popolo ~20
  - *de camino:* Via del Corso
  - Fontana de Trevi ~45
  - Panteón, por fuera ~30 (con su etiqueta de reserva)
  - Piazza Navona ~45
- **Cena:** Armando al Pantheon (o Da Baffetto)
- **Noche:** la nocturna que toque (regla 13): no repite lo visto ese día
- **Mercadillos (8 dic – 6 ene):** «Piazza Navona y su mercadillo navideño».

### La llegada al anochecer, desde Navona · D1-anochecer-navona
Libre de 19:00 a 20:29: Navona y el Panteón por fuera, a buen paso; la cena; y de noche, Trevi y la Plaza de España.

- **Empieza en:** Navona
- **Tarde:**
  - Piazza Navona ~20
  - Panteón, por fuera ~15 (con su etiqueta de reserva)
- **Cena:** Armando al Pantheon (o Da Baffetto)
- **Noche:** Fontana de Trevi y la Plaza de España

### La llegada al anochecer, desde la Plaza de España · D1-anochecer-espana
Libre de 19:00 a 20:29: la Plaza de España y la Trinità, el Panteón y Navona, la cena y, de noche, Trevi.

- **Empieza en:** Plaza de España
- **Tarde:**
  - Plaza de España ~20
  - Escalinata y Trinità dei Monti ~15
  - Panteón, por fuera ~15 (con su etiqueta de reserva)
  - Piazza Navona ~20
- **Cena:** Armando al Pantheon (o Da Baffetto)
- **Noche:** Fontana de Trevi

### La llegada de noche, con cena · D1-noche
Libre de 20:30 a 21:59: la cena y Trevi de noche, «para un primer contacto» (su texto, abajo).

- **Cena:** Armando al Pantheon (o Da Baffetto)
- **Noche:** Fontana de Trevi
- **Texto:** «{Llegada} a las {hora}. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»

### La llegada de noche, sin cena · D1-noche-sin-cena
Libre de 22:00 a 22:59: Trevi de noche, con el mismo texto. La cena ya no sale.

- **Noche:** Fontana de Trevi
- **Texto:** «{Llegada} a las {hora}. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»

### La llegada tardísima, sin ruta · D1-sin-ruta
Libre desde las 23:00 (también si pasa de la medianoche): nada, con su texto.

- **Texto:** «{Llegada} a las {hora}. Descansa, que mañana empezamos a tope.»

**Los textos de la llegada de noche:** `{Llegada}` según cómo llega: avión, «Aterrizas»; tren o autobús, «Llegas a {punto}» (Termini, Tiburtina…); barco, «Desembarcas». `{hora}` es la que puso el viajero. Ejemplos: «Aterrizas a las 21:00. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.» y «Llegas a Termini a las 23:30. Descansa, que mañana empezamos a tope.»

**La nocturna de la llegada cuenta para el viaje:** no se repite otra noche.

**Lo visto en la llegada sí cuenta como visto (regla 9),** como en cualquier otro día: los días siguientes lo pasan a «de camino», con «Ya lo visitaste el {día}», **salvo los imprescindibles**, que salen otra vez como parada, y salvo lo que se entra por dentro ese día (el Panteón del D1, la Basílica del D2), que se queda como parada.

### D1+Vaticano (2 noches con llegada tarde) · D1-vaticano
El día 2 de un viaje de 2 noches cuando el día 1 fue la ruta del centro (libre desde las 14:00; en invierno, desde las 13:00): la mañana de la Roma antigua, la comida del D1 y la tarde del Vaticano del D3. Nunca la parte del centro del D1 (se repetiría).

- **Mañana:**
  - 🎟 Coliseo, por dentro ~1 h 15 (turno)
  - Arco de Constantino ~10
  - Foro Romano y Palatino, por dentro ~1 h 30 (se sale por el Campidoglio)
  - Plaza del Campidoglio ~30
  - Piazza Venezia ~10
  - Altar de la Patria, por dentro ~45
- **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío
- **Tarde:**
  - Taxi a la entrada de los Museos
  - 🎟 Museos Vaticanos y Capilla Sixtina ~2 h 30 (turno de tarde)
  - Plaza de San Pedro ~30
  - Basílica de San Pedro, por dentro ~1 h (abre hasta las 20:00; última entrada a las 19:15)
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, por fuera ~30
  - Puente Sant'Angelo ~15
- **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati
- **Noche:** la pareja de nocturnas que toque (regla 13)
- **Cierres:** si cae en domingo o miércoles, el Vaticano va a la mañana de la vuelta si cabe; si no, a «Si te sobra tiempo» con su aviso («Los Museos Vaticanos los tienes en «Si te sobra tiempo» del {día}: si reservas la entrada, te lo ponemos en el día.»).

### El Free Tour y otras reservas el día de llegada
- **Las horas del Free Tour en Roma:** 10:00, 12:00, 15:00 («Después de comer»), 17:00 («Por la tarde»), 19:00 y 21:00. Sale de la Plaza de España y dura 2 h 30. Las horas salen de la lista única del destino, no de este documento.
- **Se ofrece como ahora:** en viajes de 2 días o más (por sus fechas). Los días sin tour y los de horas especiales mandan también el día de llegada.
- **Con vuelos y Free Tour de mañana** (10:00, 12:00, 15:00 o 17:00), viajes de 3 noches o más, el día 1 es el **D3**, con sus dos partes: la del Free Tour (Trevi sin gente, el desayuno, el Panteón y el tour) y la del Vaticano (los Museos, la Plaza, la Basílica, la Conciliazione, el Castillo por fuera y el Puente).
  - **El D3 entero, como sin vuelos,** si está libre antes de las 9:30 con el tour de las 10:00; antes de las 11:30 con el de las 12:00 (el Vaticano después de comer); antes de las 10:00 con el de las 15:00 o el de las 17:00 (el Vaticano por la mañana).
  - **Si no, pero está libre al menos 30 min antes del tour:** el día 1 es solo la parte del Free Tour (la comida al llegar si toca, el tour a su hora, la cena y la noche). El día 2 es el D2 (el Vaticano y Trastevere) y el día 3 el D1 (la Roma antigua y el centro), no el D1-FT, para no repetir Trastevere. Todo se corre un día y se cae el último; vuelve como «un día más» si el vuelo lo permite. Si el D2 cae en domingo o miércoles, se cambia con el D1 con la regla de cierres de siempre.
  - **Si está libre cuando el tour ya ha empezado:** no se reorganiza nada. El Free Tour con su hora es una reserva del viajero: no se mueve, y sale el aviso de reservas contra el vuelo: «Tu Free Tour es a las {hora} y aterrizas a las {hora}: no te da tiempo. Revisa tu reserva.» [Ver mi reserva]. Si el viajero cambia la hora del tour, el día se rehace solo.
- **Si el Free Tour está reservado,** manda su hora.
- **Si solo está en el viaje** (marcado en Experiencias o añadido con «+ Añadir parada»), la app elige por dentro la primera hora que le pille libre (30 min para llegar a la Plaza de España y los 15 min de la regla 4):

  | Libre a las… | Free Tour |
  |---|---|
  | antes de las 9:30 | 10:00 |
  | de 9:30 a 11:29 | 12:00 |
  | de 11:30 a 14:29 | 15:00 |
  | de 14:30 a 16:29 | 17:00 |
  | desde las 16:30 | al día siguiente a las 10:00: el día 1 es la fila de arriba para su hora (sin el D1 detrás), el día 2 el D3 entero y el día 3 el D1-FT; todo se corre un día y se cae el último |

  - Solo si ni el día 2 ni el día 3 tienen una reserva grande; si no, el tour no se pone y la hoja del resumen lo dice. En un día de horas especiales, solo las de ese día.
  - La hora elegida sale marcada en la hoja del Free Tour (es la hora de un tour que existe, no una hora calculada), nunca en un texto del día.
  - Texto: «Hemos puesto el Free Tour el mar 10, nada más llegar. Al reservarlo, elige la hora que te encaje.» [Ver disponibilidad].
- **Con el Free Tour de las 19:00 o de las 21:00:** el viaje lleva los días de «Sin Free Tour» y el tour va en la noche del D1, como ahora; el día 1 sigue la tabla de arriba (si el D1 pasa al día 2, el tour va con él).
- **Si el Free Tour y otra reserva se cruzan:** el aviso «coinciden» de siempre.
- **Cualquier otra reserva pequeña de ese día** queda fija a su hora (regla 4) y del día al que llega no se quita nada.

### El día de vuelta
La hora de la tabla es la del **vuelo** (la que pone el viajero); por dentro se le resta el margen del punto («Las horas: libre y salir»). La tabla está escrita para Fiumicino; con los demás puntos, el mismo momento de salir (la hora de vuelo menos el margen de su punto, comparada con la de Fiumicino menos 3:00).

#### Qué lleva el día de vuelta según la hora

| Vuelo desde Fiumicino | El día de vuelta | Lleva |
|---|---|---|
| de 0:00 a 4:59 | cuenta como la noche de antes: el último día de ruta con su cena y sin nocturna; el día de vuelta, solo el traslado | solo-traslado · el día de antes con cena y sin nocturna |
| de 5:00 a 8:59 | solo el traslado; el día de antes, normal, con su noche | solo-traslado |
| de 9:00 a 13:29 | solo el traslado | solo-traslado |
| de 13:30 a 14:59 | una mañana corta (abajo), sin comida | manana-corta |
| de 15:00 a 16:59 | la última mañana sin comida: su lista sin comida (abajo) | manana-sin-comida |
| de 17:00 a 22:59 | la última mañana con comida: su lista con comida (abajo) si la tiene; si no, la mañana de siempre. Después, «La tarde es tuya hasta que te vayas.» y [+ Añadir lugares] (como la excursión de medio día) | manana-con-comida · tarde libre |
| a las 23:00 o más tarde | un día más entero, sin cena ni noche: el día que se cayó al llegar si se cayó alguno; si no, el siguiente día escrito que el viaje no lleva; si no queda ninguno, la última mañana con comida y la tarde libre | dia-mas · sin cena ni noche |

- **Una reserva pequeña el día de vuelta:** su parada a su hora, dentro de la mañana; no se quita nada.
- **Los avisos del último día de ruta,** con una salida de madrugada, se comparan con la hora de salir de esa noche.
- **Con una reserva grande** (ver «Las reservas grandes y los vuelos»), el día de vuelta tiene mañana aunque su fila diga «solo el traslado».
- **La maleta:** cuando el día de vuelta lleva mañana, su primera línea es «Déjala en tu alojamiento (pregunta si te la guardan después de dejar la habitación) o en la consigna de Termini y recógela de camino.» (`_llegada.json`, `maleta`). Y en la tarde libre: «Aprovecha la mañana sin prisas: deja la maleta en la consigna o en tu alojamiento y sal con margen.»

#### Las últimas mañanas (en su orden)
**La última mañana es la primera de esta tabla que no repite lo principal ya visto de día,** tal como está escrita, con su versión de cierres. Si el viajero ya ha visto alguno de «lo principal» de una fila, esa fila se salta. Si su hora de empezar no está escrita (solo lo está la del DT-medio, a las 7:30), se usa la de un día normal (las 9:00). Si no queda ninguna, la hoja «Ya has visto lo mejor de Roma».

| Orden | La última mañana | Su mañana corta | Lo principal (si ya lo ha visto, se salta) | Se salta además |
|---|---|---|---|---|
| 1 | D0-medio · De mañana (el Vaticano) | DC-vaticano | Plaza de San Pedro | el 25 de diciembre · el domingo de Pascua |
| 2 | D1 · Mañana (la Roma antigua) | DC-roma-antigua | Coliseo · Foro Romano y Palatino | nada |
| 3 | DT-medio · De mañana (el Pincio y el Popolo) | DC-pincio-popolo | Terraza del Pincio · Piazza del Popolo | nada |
| 4 | DA-medio (el Aventino) | DC-aventino | Jardín de los Naranjos · Circo Máximo | nada |
| 5 | D6 · Mañana (la Cúpula) | DC-cupula | Cúpula de San Pedro | nada |
| 6 | la hoja «Ya has visto lo mejor de Roma» | no hay | no hay | nada |

- **El miércoles (la audiencia),** la mañana del Vaticano y la de la Cúpula no se hacen: se usa la siguiente de la tabla.
- **El Vaticano el domingo:** su versión sin Museos de los cierres. Los demás días de cierres, como en cualquier día.

### Las mañanas cortas (vuelo de 13:30 a 14:59)
Unas pocas paradas cercanas, de 1 h 15 a 1 h 30 en total. Cada una cumple las reglas de cierres.

### Mañana corta del Vaticano · DC-vaticano
- Plaza de San Pedro ~30
- Basílica de San Pedro, por dentro ~45
- Via della Conciliazione ~10
- **El miércoles:** la siguiente de la tabla (por la audiencia del Papa).

### Mañana corta de la Roma antigua · DC-roma-antigua
- Coliseo, por fuera ~30 (con su etiqueta de reserva: si lo reserva, manda su hora)
- Arco de Constantino ~10
- Plaza del Campidoglio ~20
- El Foro Romano, desde la terraza del Campidoglio ~15

### Mañana corta del Pincio y el Popolo · DC-pincio-popolo
- Plaza de España ~30
- Escalinata y Trinità dei Monti ~15
- Terraza del Pincio ~20
- Piazza del Popolo ~15

### Mañana corta del Aventino · DC-aventino
- Circo Máximo ~15
- Jardín de los Naranjos ~20
- Ojo de la Cerradura del Aventino ~15
- Pirámide Cestia ~10 (al lado del metro Piramide y del tren al aeropuerto)

### Mañana corta de la Cúpula · DC-cupula
- Cúpula de San Pedro ~1 h 15 (se sale por la Basílica)
- Plaza de San Pedro ~10
- **El miércoles:** la siguiente de la tabla (por la audiencia del Papa).

### Las mañanas sin comida (vuelo de 15:00 a 16:59)
Las mismas 5 últimas mañanas y en el mismo orden de la tabla «Las últimas mañanas». Solo paradas, sin comida. Están pensadas para unas 2 h 30 con lo que se anda. Cada lista cumple las reglas de cierres y de lluvia de su día de origen (el D0-medio, el D1, el DT-medio, el DA-medio o el D6), salvo lo que se dice aquí.

### Mañana sin comida del Vaticano · DS-vaticano
- Plaza de San Pedro ~30
- Basílica de San Pedro, por dentro ~45
- Via della Conciliazione ~10
- Castillo de Sant'Angelo, por fuera ~30
- Puente Sant'Angelo ~10
- **El miércoles:** la siguiente de la tabla (por la audiencia del Papa), como siempre.

### Mañana sin comida de la Roma antigua · DS-roma-antigua
- 🎟 Coliseo, por dentro ~1 h 15 (turno)
- Arco de Constantino ~10
- Plaza del Campidoglio ~20
- El Foro Romano, desde la terraza del Campidoglio ~15
- Piazza Venezia ~10

### Mañana sin comida del Pincio y el Popolo · DS-pincio-popolo
El DT-medio de mañana sin Santa Maria del Popolo ni Via Condotti. Empieza a las 7:30, como el DT-medio.
- Fontana de Trevi sin gente ~45 (el día empieza a las 7:30)
- Desayuno
- Plaza de España ~45
- *de camino:* Via del Babuino y Via Margutta
- Piazza del Popolo ~20
- Terraza del Pincio ~20
- *de camino:* los Jardines del Pincio
- Escalinata y Trinità dei Monti ~20

### Mañana sin comida del Aventino · DS-aventino
- Termas de Caracalla, por dentro ~1 h (abre a las 9:00)
- Circo Máximo ~15
- Boca de la Verdad ~15
- Jardín de los Naranjos ~25
- Ojo de la Cerradura del Aventino ~15
- **Lunes (Caracalla cierra):** empieza en el Circo Máximo y al final van la Pirámide Cestia ~10 (al lado del metro Piramide y del tren al aeropuerto) y el Cementerio Protestante ~30.

### Mañana sin comida de la Cúpula · DS-cupula
- Cúpula de San Pedro ~1 h 15 (se sale por la Basílica)
- Plaza de San Pedro ~10
- Via della Conciliazione ~10
- Castillo de Sant'Angelo, por fuera ~30
- Puente Sant'Angelo ~10
- **El miércoles:** la siguiente de la tabla (por la audiencia del Papa), como siempre.

### Las mañanas con comida (vuelo de 17:00 a 22:59)
Solo las 3 que no cabían. El Pincio y el Popolo y el Aventino usan su mañana de siempre, con su comida.

### Mañana con comida del Vaticano · DCC-vaticano
El D0-medio de mañana, con Trevi y la Plaza de España más cortas.
- Plaza de San Pedro ~45
- *de camino:* Basílica (la fachada)
- Via della Conciliazione ~10
- Castillo de Sant'Angelo, por fuera ~30
- Puente Sant'Angelo ~10
- *de camino:* Via dei Coronari
- Fontana de Trevi ~30
- Plaza de España ~30
- **Comida:** Poldo e Gianna Osteria (o Edy), en el Tridente
- **El miércoles:** la siguiente de la tabla (por la audiencia del Papa), como siempre.

### Mañana con comida de la Roma antigua · DCC-roma-antigua
- 🎟 Coliseo, por dentro ~1 h 15 (turno)
- Arco de Constantino ~10
- Foro Romano y Palatino, por dentro ~1 h 15 (se sale por el Campidoglio)
- Plaza del Campidoglio ~20
- Piazza Venezia ~10
- **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío

### Mañana con comida de la Cúpula · DCC-cupula
El D6 de mañana, con el Castillo más corto y sin el Panteón.
- Cúpula de San Pedro ~1 h 15 (se sale por la Basílica)
- Plaza de San Pedro ~10
- Via della Conciliazione ~10
- Castillo de Sant'Angelo, hasta la terraza del ángel, por dentro ~1 h
- Puente Sant'Angelo ~10
- *de camino:* Via dei Coronari
- Piazza Navona ~10
- **Comida:** Enoteca Corsi (o Giggetto al Portico d'Ottavia)
- **Lunes:** el Castillo cierra: por fuera ~30, como en el D6.
- **El miércoles:** la siguiente de la tabla (por la audiencia del Papa), como siempre.

### El día de vuelta sin paradas (solo el traslado; de pago)
Una tarjeta para que sepa por qué, en DÍAS y en HOY. Con un vuelo de 0:00 a 4:59, la misma tarjeta va también al final del último día de ruta («Tu vuelo sale esta noche, a las {hora}…»).

### Hoy vuelves a casa (la tarjeta del día de vuelta) · DV-traslado
- **Texto del título:** «Hoy vuelves a casa»
- **Texto del avión:** «Tu vuelo sale de {punto} a las {hora}. Te recomendamos estar en el aeropuerto 2 horas antes, por eso hoy no te hemos puesto paradas: es el día de irte con calma.»
- **Texto del tren o autobús:** «Tu tren sale de {punto} a las {hora}. Llega a la estación con tiempo, por eso hoy no te hemos puesto paradas.»
- **Texto del barco:** «Tu barco sale de Civitavecchia a las {hora}. Mira en tu reserva a qué hora cierra el embarque; por eso hoy no te hemos puesto paradas.»
- **Texto de la madrugada:** «Tu vuelo sale esta noche, a las {hora}. Te recomendamos estar en el aeropuerto 2 horas antes: mañana es el día de irte con calma.»
- **Texto de desde tu zona:** «Desde tu zona ({zona}): {su mejor opción}.»
- **Regla de desde tu zona:** la mejor opción es la de «Para tu zona», con el tiempo de cada tramo de `_llegada.json`. Nunca un tiempo total sumado. Con «Aún no lo sé», la mejor opción desde Termini. [Ver cómo ir] abre la ficha de vuelta.
- **Texto de explorar:** «¿Crees que te da tiempo a ver algo? Aquí tienes los monumentos de Roma.»
- **Botón de explorar:** [Explorar monumentos] abre EXPLORAR › Monumentos (con «Cerca de mí»).
- **Texto de la despedida:** «Esperamos que hayas disfrutado de Roma. ¡Nos vemos en tu próximo viaje!»
- **Texto de la tarde libre:** «La tarde es tuya hasta que te vayas.»

### Las reservas grandes y los vuelos
Las reservas grandes son los «sitios grandes» del destino (en Roma: el Coliseo, los Museos Vaticanos y la Galería Borghese); lo que cada uno lleva va en los datos del destino. **Una reserva grande mueve el día entero; una pequeña, solo su parada, y del día al que llega no se quita nada.** Los días cambiados a mano no se tocan.
- **En un día de ruta de en medio:** se cambian los dos días enteros, como siempre (todo o nada).
- **El Coliseo reservado el día 1:** el día 1 ya es el D1; manda la tabla de la hora del Coliseo del D1 (y el Foro siempre con el Coliseo).
- **Los Museos o la Galería reservados el día 1, libre antes de las 14:00** (en invierno, antes de las 13:00): ese día pasa a ser el día escrito entero de ese sitio, con la lista de la hora de la reserva, y el D1 va al día que tenía ese sitio (se cambian uno por otro). Si el viaje no lleva el día escrito de ese sitio (la Galería con 3 noches y la llegada tarde), va su bloque, como abajo.
- **El día de llegada, libre desde las 14:00** (en invierno, desde las 13:00), **o el día de vuelta:** a ese medio día va solo el bloque de esa reserva, siempre entero y sin mirar si cabe:
  - **Coliseo:** el Coliseo a su hora, el Arco y el Foro y Palatino (antes o después según la tabla de la hora del Coliseo);
  - **Museos:** los Museos a su hora, la Plaza de San Pedro y la Basílica. El miércoles, la Plaza y la Basílica nunca antes de comer: después de la comida si la fila la lleva; si no, a «Si te sobra tiempo»;
  - **Galería:** la Galería a su hora y el parque de Villa Borghese.
  - **El resto de su día escrito se queda en su día, en la versión sin esa visita.** Nada se pierde, nada se repite y nada se inventa:
    - el del Coliseo empieza en el Campidoglio (el Altar, la comida en el Gueto y la tarde del centro);
    - el del Vaticano, con su versión sin Museos de los cierres (la del domingo: la mañana empieza en San Pedro con la Basílica y las Grutas, y la tarde sigue como siempre, con el Castillo, el Puente y Trastevere);
    - el de Villa Borghese, con la del lunes (sin Galería).
  - **En la llegada:** el bloque a su hora y, de la ruta de su fila, lo que va antes en su orden y lo demás después (regla 4), sin zigzag.
  - **Con una reserva, el día de vuelta tiene mañana** aunque su fila diga «solo el traslado».
  - **Dos reservas grandes en el mismo medio día:** cada bloque a su hora; si se cruzan, el aviso «coinciden».
- **Una reserva antes de estar libre** (se compara con «libre», sin margen) **o que acaba después de la hora de salir** (su hora más lo que dura, de los datos): se queda en su sitio, el resto del día va por su fila, y sale el aviso de «Las reservas y los vuelos», que se queda en la campana.

### La excursión y los vuelos
- **Va en el día 4 de ruta,** como sin vuelos, con el interruptor de siempre. **Nunca cae en el día de llegada ni en el de vuelta.** Si el día 1 se corre (el D1 pasa al día 2), el interruptor sigue en el día 4.
- **[Añadir en un día nuevo]:** el día nuevo va siempre **antes** del día de vuelta; la excursión nunca cae en el día de vuelta (con fechas, la vuelta pasa al día siguiente).
- **Excursión reservada:** no se toca nunca, y los demás días se quedan donde estaban.
- **Excursión reservada el día de llegada:** si sale antes de estar libre, el aviso de abajo; si sale después, ese día lleva la excursión y la ruta del día 1 se coloca como con una reserva grande en otro día (lo que se quede sin día, a «Si te sobra tiempo» del día 2).
- **Excursión reservada el día de vuelta** (o el último día con una salida de madrugada) **que vuelve después de la hora de salir:** el aviso de abajo, con [Ver mi reserva] · [Pasar este día a Roma]. No se cambia nada solo. Una de medio día (Ostia, Tívoli; vuelve a las 14:00): sin aviso si la hora de salir es a las 15:00 o más tarde.
- **Con los vuelos, el día 4 pasa a ser el de vuelta y la excursión no está reservada:**
  - **si la puso la app por defecto** (el viajero no tocó el interruptor ni eligió excursión), ese día pasa a Roma solo, con la última mañana, y sale el texto de la vuelta «Había excursión»: «Tienes el vuelo a las 17:00, hacer una excursión no es viable, pero te hemos organizado una última mañana por Roma para que te vayas con buen sabor de boca.»;
  - **si la eligió el viajero,** la hoja pregunta: «Con tus vuelos, el día 4 (jueves 13) es el de tu vuelta: no da tiempo a la excursión a Pompeya.» [Pasar este día a Roma] · [Mantener la excursión]. Si la mantiene, sale el aviso de la excursión que vuelve después de salir.

### Las reservas y los vuelos (los avisos)
Solo llevan las horas del viajero; las palabras cambian con el medio («hacia el aeropuerto», «hacia la estación», «hacia el puerto»). Van con [Ver mi reserva].
- **Una reserva antes de estar libre:** «Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.»
- **El Free Tour antes de estar libre:** «Tu Free Tour es a las 10:00 y aterrizas a las 11:30: no te da tiempo. Revisa tu reserva.»
- **Una reserva después de la hora de salir:** «Tu entrada a los Museos Vaticanos es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.»
- **Una excursión que sale antes de estar libre:** «Aterrizas a las 9:00 y tu excursión a Pompeya sale a las 7:30: no llegas. Revisa tu reserva.»
- **Una excursión que vuelve después de salir:** «Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma a las 20:00: no te da tiempo. Revisa tu reserva de la excursión.» [Ver mi reserva] · [Pasar este día a Roma]. Si la reserva no tiene hora de vuelta, la frase sin esa hora. El mismo aviso sale si añade la confirmación de una excursión en un día que su vuelo no permite.
- **Una reserva en un día en que ese sitio cierra** (vale también sin vuelos): «La Galería Borghese cierra los lunes: revisa la fecha de tu reserva.»
- **La vuelta que no cuadra con las fechas:** si cambian las fechas del viaje y ya había vuelta con hora: «Has cambiado los días del viaje: revisa que tu vuelta sigue siendo el {día}.» [Ver mi vuelta].

### Cómo salen los avisos
- **La hoja de abajo:** lo que acaba de pasar. Sale en el momento en que el viajero hace algo (pone el vuelo, guarda una reserva). Lleva su texto y la X; solo lleva botones si tiene que elegir. Todas las hojas de la app son la misma.
- **La campana de avisos:** lo que sigue mal. Si cierra la hoja sin arreglarlo, el aviso se queda en la campana (con su número) hasta que lo arregla, y se va solo. Solo van ahí los que son un problema: no llega a una reserva, una reserva después de salir, un sitio cerrado ese día, la excursión que no cuadra y la vuelta que no cuadra con las fechas.
- **Dentro del día,** lo pequeño, como siempre («Lo ves en el Free Tour», «Cerrado hoy»; el sitio que se queda cerrado lleva «Cerrado este día»).
- **Al poner, cambiar o borrar los vuelos, el punto o la zona,** sale **una sola hoja** con todo lo que ha cambiado, no una por cosa. Por ejemplo:
  - «El mar 10 es tu llegada a Roma.»
  - Con la llegada de 0:00 a 4:59: «Aterrizas a las 0:30 del mar 10: ese día lo tienes entero, y esa noche ya necesitas alojamiento. Si aterrizas la noche del mar 10, cambia las fechas del viaje.» [Cambiar fechas] · [De acuerdo].
  - «Como llegas por la tarde, la Roma antigua pasa al mié 11.» (cuando el D1 se corre) y, si se cae un día: «Villa Borghese no cabe en tu viaje: si reservas la Galería, te ponemos su día.»
  - «El sáb 14 tienes una última mañana por Roma antes de irte al aeropuerto.» (o «a la estación», «al puerto»). Con un día más: «El sáb 14 tienes casi un día entero por Roma antes de irte.» Sin mañana: «El sáb 14 te vas pronto: ese día solo lleva el camino al aeropuerto.»
  - «Hemos puesto el Free Tour el mar 10, nada más llegar. Al reservarlo, elige la hora que te encaje.» [Ver disponibilidad].
  - «El Coliseo lo tienes en «Si te sobra tiempo» del mar 10: si reservas la entrada, te lo ponemos en el día.»
  - «El jue 12 lo has cambiado tú: lo dejamos como está.»
  - Al borrar los vuelos: «Tus días vuelven a ser enteros. Tus reservas se quedan donde estaban.»
  - Con uno o ningún día entero y el Free Tour que no cabe: «Con tus vuelos, el Free Tour no cabe sin quitarte el Coliseo o el Vaticano. Si aun así lo quieres, añádelo desde «+ Añadir parada».»
  - Termina con [De acuerdo], o con los botones que haya que elegir.
- **Los días que el viajero ha cambiado a mano** no se rehacen (lo suyo manda).
- **Ningún texto de esta tanda** enseña una hora que calcule la app, ni el nombre de una empresa, ni «Día n» con fechas.

### Para tu zona (cómo llegar a tu alojamiento)
En la ventana de llegada que ya existe (Resumen · Traslados · Tips), arriba del todo, «Tu mejor opción» según su punto de llegada y su zona, y debajo «Otras opciones». A la vuelta, lo mismo al revés. La primera opción de cada celda es «Tu mejor opción»; las demás, debajo. Sin taxi, sin nombres de empresas y sin tiempo total sumado: los tiempos y los precios, solo los de `_llegada.json`, y donde no hay dato, sin tiempo.

| Zona | Desde Fiumicino | Desde Ciampino | Desde Termini | Desde Tiburtina (tren o autobús) | Desde Civitavecchia |
|---|---|---|---|---|---|
| Termini | Leonardo Express · autobús a Termini | Airlink a Termini · autobús a Termini | ya estás: andando | metro B a Termini | tren regional a Termini |
| Monti | Leonardo Express y metro B a Cavour (1 parada) | Airlink a Termini y metro B a Cavour | metro B a Cavour | metro B directo a Cavour | tren regional a Termini y metro B a Cavour |
| Centro | Leonardo Express y bus 40 o 64 a Largo di Torre Argentina | Airlink a Termini y bus 40 o 64 | bus 40 o 64 a Largo di Torre Argentina | metro B a Termini y bus 40 o 64 | tren regional a Roma San Pietro y bus 64 a Largo di Torre Argentina · o a Termini y bus 40 o 64 |
| Plaza de España | Leonardo Express y metro A a Spagna | autobús al metro Anagnina y metro A directo a Spagna · Airlink a Termini y metro A | metro A a Spagna | metro B a Termini y metro A a Spagna | tren regional a Termini y metro A a Spagna |
| Prati | autobús directo a Via Crescenzio [VERIFICAR] · Leonardo Express y metro A a Ottaviano | autobús al metro Anagnina y metro A directo a Ottaviano · Airlink a Termini y metro A | metro A a Ottaviano | metro B a Termini y metro A a Ottaviano | tren regional a Roma San Pietro y andando (unos 20 min) |
| Trastevere | tren FL1 a Roma Trastevere y tranvía 8 | Airlink a Termini, bus 40 o 64 a Largo di Torre Argentina y tranvía 8 | bus 40 o 64 a Largo di Torre Argentina y tranvía 8 | tren FL1 directo a Roma Trastevere y tranvía 8 | tren regional a Roma Trastevere y tranvía 8 |

- **Con «Aún no lo sé»,** sin «Tu mejor opción» para una zona: las opciones hasta Termini, las de siempre, y arriba: «Cuando sepas dónde duermes, ponlo en RESERVAS y te diremos cómo llegar hasta tu puerta.»
- **Si su mejor opción acaba en Termini:** «Casi todo el transporte público llega a Termini, la estación principal. Desde allí, {lo de su zona}: es otro billete (1,50 €, vale 100 min).» Si no pasa por Termini (el FL1 a Trastevere), no sale.
- **Solo las opciones que sirven:** a Trastevere desde Fiumicino no sale el Leonardo Express.
- **El taxi se va** de la ficha, de «Para tu zona» y de los Tips; en su lugar, el traslado privado («Te esperan a la salida con tu nombre y te dejan en la puerta de tu alojamiento o donde tú quieras.», sin precio y sin decir que es más barato). En `_llegada.json` el taxi se queda en los datos, marcado para no enseñarlo.
- **De noche y a primera hora** solo hay dato del Leonardo Express (desde el aeropuerto, el primero a las 5:38 y el último a las 23:23, del 14 de junio al 12 de diciembre de 2026). Si aterriza demasiado tarde para el último (o antes del primero), «Tu mejor opción» es el traslado privado, con «A esta hora ya no hay tren: el último Leonardo Express sale del aeropuerto a las 23:23.»; debajo, «Otras opciones · solo lo que sigue funcionando», solo lo que tenga su horario en `_llegada.json`. A la vuelta, lo mismo para los vuelos de primera hora.
- **Notas comprobadas el 13-oct-2026** (la fuente y la fecha, en `_llegada.json`):
  - El tren regional de Civitavecchia para en Roma San Pietro, Roma Trastevere, Roma Ostiense y Roma Termini; si algún tren no para en Trastevere, la nota «mira en tu billete que pare en Roma Trastevere».
  - El FL1 para en Roma Trastevere, Ostiense y Tiburtina, no en Termini. De Fiumicino a Trastevere, unos 27 min.
  - El autobús de Fiumicino a Via Crescenzio / Piazza Adriana (Prati) sale de la estación de autobuses de la T3, unos 40 min, desde 7 €. [VERIFICAR] en la web oficial; si no se puede, fuera de la tabla. Sin el nombre de la empresa.
  - El tranvía 8: restablecido entero el 21-sep-2026. Si sale otro corte, como aviso de fechas, sin cambiar la tabla.
  - El autobús al metro Anagnina (Ciampino): 1,20 € + 1,50 € el metro; la línea A va directa a Spagna y a Ottaviano.
- **Los textos de la ventana** que hoy dicen «centro» («Cómo llegar al centro…», «De Fiumicino al centro», «casi todo el centro») pasan a decir «a tu alojamiento» o «a tu zona». Se quedan los datos reales («32 km al centro»).

### Lo que no entra todavía
- La escala de crucero (llegar y salir el mismo día por Civitavecchia, sin dormir en Roma). De momento, se monta como un viaje de una fecha, con sus barras.
- Los viajes con varias ciudades. Las reglas de esta sección se escriben para que mañana sirvan para cada ciudad, pero de momento hay una sola llegada y una sola salida por viaje.
- La zona del alojamiento para el día de vuelta. La vuelta se cuenta desde el centro.
