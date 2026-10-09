# Roma · días por paradas y franjas

Este documento sustituye a las tablas con horas de `DIAS_ESCRITOS_ROMA.md` (decidido el 6-oct-2026). Los días son los mismos y las reglas de fondo también: la pirámide, por dentro una sola vez, nada de zigzags, se come y se cena donde acaba la ruta, y las nocturnas sin repetir. Lo que cambia es la forma: **paradas en orden, por franjas, sin horas escritas**.

## Cómo funciona (vale para todos los destinos)

1. **Franjas:** mañana, comida, tarde, cena y noche. Las escribimos nosotros, con las paradas en su orden. El motor **no cambia el orden**.
2. **El trayecto entre paradas se ve siempre**, en RUTA, en DÍAS y en HOY, entre una tarjeta y la siguiente: «8 min andando», «Taxi, 15 min», «Bus 23, 20 min».
   - **Por defecto, andando o transporte público** (decidido el 7-oct-2026, todos los destinos): andando si son 25 min o menos; si no, transporte público, si hay una línea de verdad. El taxi solo sale por defecto si no hay ninguna de las dos. El taxi siempre está en las opciones, al tocar el icono del trayecto.
   - **Transporte público solo si existe:** solo se ofrece si hay una línea real que une los dos sitios (con su número: «Tranvía 8», «Metro A», «Bus 40»). Si no la hay, no sale la opción.
3. **Minutos aproximados:** cada parada lleva lo que se tarda más o menos (`~`). La app solo los suma, con lo que se anda, para saber si una franja cabe. **No se enseña ninguna hora por parada** (decidido el 6-oct-2026): solo la franja con su hora («Mañana · 9:00–14:00»). Las horas fijas (reservas, turnos, Free Tour) colocan la parada en su sitio, pero tampoco se enseñan encima de ella (decidido el 9-oct-2026, tanda 6q): la única hora a la vista es la de la pestañita verde, cuando la entrada está añadida. La comida, la cena y las pausas sí llevan su hora. **Sin ajustes, sin rellenos, sin alargar.**
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
   - antes va «Llegada a {sitio}», 30 min antes si es reserva y 15 si es turno, con su propio texto;
   - lo que cabe antes de la hora fija va antes, y lo demás después, siempre en el mismo orden;
   - si antes queda un rato, entra una parada corta que esté al lado (el Arco antes del Coliseo);
   - si aún queda más de 1 h, se adelantan las paradas de después que están cerca (a 15 min andando o menos del sitio), en su orden y sin zigzag. Ejemplo: Museos a las 14:00 → por la mañana San Pedro, la Basílica, el Castillo y el Puente; comida en el Borgo a las 12:30; Museos; y por la tarde, Trastevere;
   - si la hora fija cae a mediodía (empieza entre las 12:30 y las 15:00 y dura más de 1 h), la comida va antes, entre las 12:00 y las 12:30, en su zona;
   - **el día nunca empieza más tarde por una reserva** (decidido el 6-oct-2026): empieza a su hora, y la mañana se llena con lo de antes y lo cercano de después. La app nunca mete una parada que no esté escrita ese día para llenar un hueco (decidido el 9-oct-2026, tanda 6r). Si la reserva es antes de que empiece el día, el día empieza antes.
5. **Días con cabeza, mejor que sobre** (decidido el 6-oct-2026): cada día se escribe para que quepa con holgura, con los minutos de la regla 3. Mejor que la app diga «Vas bien de tiempo, ¿quieres añadir algo?» que «hemos quitado…». La app **nunca dice «hemos eliminado» ni «hemos quitado»**: lo que no entra es «Si te sobra tiempo», un extra.
   **Si aun así una franja no cabe** (por una reserva o un cierre), lo de menos importancia de esa franja (la pirámide, de abajo arriba) pasa a **«Si te sobra tiempo»**. Nunca un imprescindible la primera vez que sale en el viaje.
6. **La comida** no debería empezar después de las 15:00 (decidido el 9-oct-2026; antes, las 14:30). Si se iría más tarde, primero se acorta lo de menos de la mañana (por dentro → por fuera, o se queda «de camino») y después se pasa a «Si te sobra tiempo».
7. **Horarios y cierres (del dato de cada sitio):**
   - si un sitio cierra ese día, sale de la lista con «Cerrado hoy», o el día entero se cambia con otro (regla de orden de los días);
   - si abre o cierra a una hora que importa, aviso: «Cierra a las 18:15: entra antes», «Abre a las 16:00».
   - **si se llega antes de que abra:** se espera hasta 15 min en general, y **hasta 40 min si la parada de antes es una plaza o un sitio al aire libre justo al lado**, donde se pueden hacer fotos (la Piazza del Popolo antes de Santa Maria del Popolo). Más de 40 min: por fuera, con su aviso. HOY lo dice así: «Santa Maria del Popolo (los Caravaggio) abre en 20 min. Mientras, haz unas fotos en la Piazza del Popolo».
8. **Atardecer:** solo un dato en la cabecera del día, «Hoy el sol se pone a las 17:05». Los miradores tienen un texto que vale de día, al atardecer y de noche. No se mueve nada.
9. **«De camino»:** pasas por delante sin pararte. Dos o más seguidos van en una sola tarjeta, «De camino a {siguiente}», sin foto propia. Un «de camino» nunca es un sitio que ese día ya sale como parada (se sube y se baja la escalinata de la Plaza de España, pero no se nombra otra vez: ese rato es el trayecto).
   - **Qué es parada y qué es de camino** (decidido el 7-oct-2026): parada es todo sitio con nombre propio, con historia y conocido, aunque sean 5–10 min (en Roma: la Conciliazione, el Teatro de Marcelo, la Columna de Trajano, Porta Pinciana, Piazza Venezia, Via dei Fori Imperiali, el Arco de Constantino, el Puente Sant'Angelo, Via Condotti, Via Veneto, la Fuente del Tritón). De camino son solo las calles de paso sin fama (Via del Babuino, Via dei Coronari, Via Margutta…), los rincones pequeños (la Fuente de las Tortugas, el Elefantino), las fachadas de iglesias en las que no se entra y lo ya visitado otro día del viaje, con «Ya lo visitaste el día {n}».
10. **Sin paseos** (decidido el 6-oct-2026; con una excepción, el paseo por Trastevere antes de cenar, decidido el 7-oct-2026): solo paradas y «de camino». Una calle de paso o un barrio por el que se pasa (Monti, Via Margutta…) va «de camino», aunque se tarde más de 5 min andando: ese rato es el trayecto. Las calles con fama de la regla 9 (la Conciliazione, Via Condotti, Via Veneto…) son paradas (decidido el 7-oct-2026, corregido en los días el 9-oct-2026). Un sitio que se visita (el lago de Villa Borghese, el reloj de agua, el Barrio Judío) es una parada con su nombre.
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

    Si una recolocación rompe alguna, no se hace: lo que no cabe pasa a «Si te sobra tiempo».
15. **Pestaña HOY:**
    - la siguiente parada y cuánto se tarda andando;
    - marcar como hecha;
    - los avisos de cierre;
    - la cuenta atrás de las reservas: «Tu entrada al Coliseo es a las 12:00: sal de aquí a las 11:15».
    - **«Vas bien de tiempo» o «Vas justo»:** cada vez que el viajero marca «Visto», la app compara la hora con lo que le queda de la franja.
      - **Si le sobra:** «Vas bien de tiempo». Si era la última parada antes de comer, «¿Vas ya al restaurante o quieres ver algo más?».
      - **De dónde salen las sugerencias:** de todo el destino, no solo de los días de su viaje. Los sitios de los días de 5, 6 y 7 días (Monti, el Quirinal, los Foros de Trajano, Campo de' Fiori, el Aventino, la Vía Appia…) son sugerencias muy buenas para los viajes de 3 y 4 días, que serán la mayoría. Solo se excluye lo que ya sale en otro día de **su** viaje (o se avisa: «Lo tienes el día {n}»).
      - **Lo lejos que puede estar depende del tiempo que le sobra:**
        - en mitad de una franja, solo lo cercano (5–10 min andando), para no hacer zigzag;
        - justo antes de comer o de cenar, si le sobra 1 h 30 o más, vale ir más lejos: 15–20 min andando o 15 min en bus o metro;
        - y si esa zona tiene restaurante, la comida o la cena se cambia allí («y cenas en Monti»), con las reglas de restaurantes.
      - Siempre abiertas a la hora a la que llegaría, con tiempo de verlas, y no vistas.
      - **Si le falta:** «Vas justo. ¿Dejamos {lo de menos importancia} para si te sobra tiempo?». El viajero decide.
      - Nunca cambia nada sola.

17. **Reservas: solo lo escrito** (decidido el 6-oct-2026, vale para todos los destinos). Cada reserva grande tiene su día escrito para cada tramo de hora, y el motor no se inventa otro.
    - **La app nunca propone otra hora** (decidido el 9-oct-2026, vale para todos los destinos): el viajero compra la entrada cuando le va bien y la app se adapta. Por eso cada reserva grande tiene su día escrito para todas sus horas, de la primera a la última entrada.
    - **Si aun así una hora no tuviera lista,** la reserva manda (regla 4), sin preguntar y sin inventar paradas.
    - **Si dos reservas se pisan** (por ejemplo, el Free Tour de 10:00 a 12:30 y los Museos a las 11:45), es un hecho, no una propuesta: aviso «Tu Free Tour y tu entrada a los Museos coinciden. Revisa una de las dos reservas.» [Ver mis reservas], y se queda en la campana hasta que se arregla.
    - **Un imprescindible que se visita por dentro nunca pasa a «de camino» ni a «por fuera» por una reserva:** se mueve antes o después de ella.
16. **Plan de lluvia.** Cada día lleva su línea «🌧 Si llueve»: qué parada al aire libre se acorta o sale y qué parada por dentro entra, siempre cerca de la ruta y con las comprobaciones del punto 14. La app mira la previsión (la víspera y esa mañana). Si hay previsión de lluvia en una franja, HOY avisa: «Hay previsión de lluvia esta tarde. Si llueve, aquí tienes una alternativa» **[Ver alternativa]**. Nunca cambia sola: decide el viajero.

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

**Con el Free Tour de las 21:00** (decidido el 9-oct-2026): el viaje lleva los días de «Sin Free Tour», y el Free Tour va en la noche del D1 (ver el D1). Con el de las 10:00, las 12:00, las 15:00 o las 17:00, los de «Con Free Tour de mañana», con el D3 según su hora (ver el D3).

**El día de excursión** (decidido el 7-oct-2026):
- Es siempre el **día 4** en los viajes de 4, 5 y 6 días. Con vuelos, ver «Llegadas y vueltas». Nunca el día de llegada ni el de vuelta.
- **El interruptor [Roma | Excursión]** va en el día 4.
- **Con el interruptor en Roma, los días de Roma van en su orden (D5, D6, D7):** el día de Roma que se gana va **al final** y lo que había del día 5 en adelante se corre un día. Así lo mejor sigue primero.
  - 4 días: el día 4 es el D5.
  - 5 días: D5 el día 4 y D6 el día 5.
  - 6 días: D5 el día 4, D6 el día 5 y D7 el día 6.
  - Con las reglas de siempre: lo ya visto pasa a «de camino» con «Ya lo visitaste el día n», sin repetir restaurantes ni nocturnas.
- **Con una reserva en un día que se movería** (los días de después del de la excursión), el interruptor no deja pasar a Roma: no se mueve nada y sale el aviso «Tienes una reserva el día {n} ({sitio}, {hora}): no puedes mover este día».
- **Con el interruptor en Excursión:** ese día lleva **solo la excursión**: ni comida, ni cena, ni noche propuestas. Si es de medio día, ver «Excursión de medio día», al final.

**El orden de los días** (decidido el 7-oct-2026, vale para todos los destinos): **lo imprescindible, primero**.
- Los días con más imprescindibles van en los primeros días completos del viaje: en Roma, la Roma antigua (D1) y el Vaticano (D2), o sus versiones con Free Tour (D1-FT y D3).
- Después van los demás, por este orden: Villa Borghese (D4), las basílicas (D5), Roma desde arriba (D6) y la Vía Appia (D7).
- Solo se cambia si un cierre lo obliga (el Vaticano no en domingo ni en miércoles, la Galería no en lunes). Entonces se cambia con el día siguiente, y lo imprescindible sigue lo más pronto posible.
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
- **Noche:** Fontana de Trevi iluminada

**Con el Coliseo reservado por la mañana**, el día va al revés y acaba en San Pedro:
- Coliseo (reserva) y Arco
- Fori Imperiali
- Piazza Venezia y el Altar
- comida en Armando
- Panteón, Navona, Puente, Castillo, Conciliazione y San Pedro
- y luego la misma tarde (taxi a la Plaza de España…) y la misma noche.

**Con el Coliseo reservado de 12:30 a 14:00:**
- el día empieza a las 8:00, en San Pedro;
- **mañana:** Plaza de San Pedro ~30 y Basílica ~1 h, la Conciliazione ~10, el Castillo por fuera ~30, el Puente ~10, Piazza Navona ~45 y el Panteón por dentro ~45;
- **comida:** si la reserva es a las 13:30 o más tarde, antes, en Armando al Pantheon; si es antes, después del Coliseo, en Monti (La Taverna dei Fori Imperiali);
- Piazza Venezia ~10 y Via dei Fori Imperiali ~15, «Llegada a…» y 🎟 el Coliseo por dentro;
- **tarde:** Via dei Fori Imperiali ~15, la Plaza del Campidoglio y el Foro desde la terraza ~30, el Altar por fuera ~30, el taxi a la Plaza de España y la Escalinata y Trinità dei Monti;
- **cena y noche:** las de siempre.

**Con el Coliseo reservado de 14:30 en adelante:**
- la mañana y la comida de siempre;
- **tarde:** Piazza Venezia ~10, el Altar por fuera, la Plaza del Campidoglio y el Foro desde la terraza, Via dei Fori Imperiali ~15, «Llegada a…» y 🎟 el Coliseo por dentro, el taxi a la Plaza de España y la Escalinata y Trinità dei Monti;
- **cena y noche:** las de siempre.

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
- **Noche:** Fontana de Trevi iluminada (taxi) y la Plaza de España de noche
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
- **Noche:** Fontana de Trevi iluminada y la Plaza de España de noche, si el día entero no las ha llevado; si no, Piazza Navona de noche.

**Con los Museos marcados o reservados:**
- **Mañana:** 🎟 Museos Vaticanos y Capilla Sixtina ~3 h, Plaza de San Pedro ~30, Basílica por dentro ~1 h 15, comida en el Borgo (Borghiciana o Dal Toscano), la Conciliazione ~10, el Castillo por fuera y el Puente ~10.
- **Tarde:** Plaza de San Pedro, Basílica por dentro, 🎟 Museos, cena en Prati y el Puente y el Castillo iluminados.

**Miércoles por la mañana (audiencia del Papa),** al revés para acabar en San Pedro cuando termina la audiencia:
- Fontana de Trevi sin gente
- Plaza de España
- *de camino:* Via dei Coronari
- Puente Sant'Angelo ~10
- Castillo, por fuera
- Plaza de San Pedro (después de las 12:00, cuando acaba la audiencia)
- *de camino:* Basílica (la fachada)
- comida en el Borgo

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
- **Noche:** Fontana de Trevi iluminada y la Plaza de España de noche
  - **Con el Free Tour de las 21:00** (decidido el 9-oct-2026): la noche es el 🎟 Free Tour por Roma, 21:00 ~2 h 30, en lugar de Trevi y la Plaza de España (el tour pasa por allí). Sale de la Plaza de España: de Armando, a pie (~15 min). Lo que el tour recorre y ya se ha visto por la tarde (el Panteón, Navona) se queda: de noche se ve distinto.
- **Cierres:** el sábado (y la víspera de festivo) el Panteón no deja entrar desde las 17:00 por la misa: aviso «entra antes». El domingo y los festivos, tampoco durante la misa de las 10:30. Si una iglesia cierra (domingo o festivo), por fuera.

**Si te sobra tiempo** (sugerencia de «Vas bien de tiempo» antes de comer): la Columna y los Mercados de Trajano (~1 h), al lado del Altar, si el viaje no los lleva en el D6.

**Pool:** solo si el viaje no lleva el día propio de ese sitio.
- **Museos Capitolinos:** por la mañana, después del Campidoglio ~60.
- **San Juan de Letrán:** a primera hora, antes del Coliseo (metro B de San Giovanni a Colosseo).
- **Boca de la Verdad, Jardín de los Naranjos y Ojo de la Cerradura:** por la tarde, después del Barrio Judío (taxi de vuelta a Largo Argentina).
- **Galería Borghese:** 🎟 por la tarde, después del Panteón (taxi). Lo que no quepa, a «Si te sobra tiempo». Cena en el Tridente.
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
  - después, si al salir del Coliseo queda al menos 1 h 30 hasta la última entrada del Foro (una hora antes de que cierre, y cierra antes en invierno);
  - si no, antes.
- **La comida, antes de las 15:00:** en el Gueto si la Roma antigua acaba a mediodía; en Monti, entre el Foro y el Coliseo, si el Coliseo es a mediodía.

| Coliseo a las… | La Roma antigua va… | El Foro y el Palatino | La comida |
|---|---|---|---|
| hasta las 10:00 | por la mañana | después del Coliseo | en el Gueto |
| 10:30 – 11:00 | por la mañana | después del Coliseo | en el Gueto |
| 11:30 – 12:00 | por la mañana | antes del Coliseo | en el Gueto |
| 12:30 – 15:00 | a mediodía | antes del Coliseo | en Monti, antes del Coliseo |
| 15:30 en adelante | por la tarde | después si da tiempo (regla de arriba); si no, antes | en la otra parte (el Gueto o Trastevere) |

- **A primera hora (hasta las 10:00):** el día normal.
- **A media mañana, de 10:30 a 11:00:** el Foro (~1 h 30) no cabe antes, así que va después.
  - **mañana:** San Pietro in Vincoli, por dentro (el Moisés de Miguel Ángel; abre a las 8:00) ~20, el Arco de Constantino, «Llegada a…» y el Coliseo a su hora;
  - **después:** Foro Romano y Palatino, por dentro (se entra junto al Arco y se sale por el Campidoglio), la Plaza del Campidoglio y el Altar de la Patria de camino o por fuera;
  - **comida:** en el Gueto;
  - **la tarde, la de siempre.**
- **De 11:30 a 12:00:**
  - **mañana:** San Pietro in Vincoli, por dentro ~20, el Arco, el Foro Romano y Palatino por dentro (se entra junto al Arco), «Llegada a…» y el Coliseo;
  - **después:** Via dei Fori Imperiali ~15, la Plaza del Campidoglio y el Altar (por fuera si va justo);
  - **comida:** en el Gueto;
  - **la tarde, la de siempre.**
- **A mediodía (de 12:30 a 15:00):**
  - **mañana:** Plaza del Campidoglio, Altar de la Patria por dentro y Foro Romano y Palatino (se entra por Via dei Fori Imperiali y se sale junto al Arco);
  - **comida:** en Monti, al lado del Coliseo (La Taverna dei Fori Imperiali o Trattoria Valentino);
  - **después:** «Llegada a…», el Coliseo y el Arco;
  - **tarde:** Via dei Fori Imperiali ~15, Largo di Torre Argentina, San Luigi dei Francesi (cierra a las 18:30), el Panteón por dentro, Piazza Navona y, al final, el Gesù (abre a las 16:30; en verano, a las 17:00);
  - **cena y noche:** las de siempre;
  - el Barrio Judío pasa a «Si te sobra tiempo» (está a 5 min de Torre Argentina).
- **Por la tarde (a las 15:30 o más tarde):** el día va al revés.
  - **mañana:** el centro: el Panteón por dentro (abre a las 9:00), Piazza Navona, San Luigi dei Francesi, Largo di Torre Argentina, el Gesù (por la mañana está abierto) y el Barrio Judío;
  - **comida:** en el Gueto;
  - **tarde:** Plaza del Campidoglio, Altar de la Patria por dentro, Via dei Fori Imperiali ~15, el Arco ~10, «Llegada a…» y el Coliseo; **después del Coliseo, el Foro Romano y Palatino por dentro** (se entra junto al Arco, con la misma entrada), si queda al menos 1 h 30 hasta su última entrada (en verano, hacia las 18:15; en invierno, mucho antes). Si no, el Foro y el Palatino por dentro antes del Coliseo (se entra por Via dei Fori Imperiali y se sale junto al Arco);
  - **cena:** en Monti (La Taverna dei Fori Imperiali o Trattoria Valentino);
  - **noche:** Trevi y la Plaza de España (15 min andando o taxi).
- **Nunca** se pasa el Foro y el Palatino a «de camino» o «por fuera» para que quepa: va antes o después del Coliseo, que para eso es la misma entrada.

**D1-corto y D1-FT con el Coliseo reservado:** la Roma antigua es la del D1 con la lista de su hora (por dentro), y la otra parte es la suya. Si la lista del D1 manda la comida a Monti, la tarde del D1-corto empieza en el Gueto, igual. **Con el Coliseo por la tarde (15:30 en adelante), en el D1-FT va al revés:** ver el D1-FT.

**Comer un poco más tarde vale** en los días con reserva: si la comida cae entre las 14:30 y las 15:00 por una hora fija, se deja así. Para un viajero español es normal. Solo se toca si pasa de las 15:00.

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
  - el domingo, el miércoles (audiencia) y los días que cierran los Museos, este día se cambia con otro;
  - si no se puede, sin Museos: la mañana empieza en San Pedro con la Basílica y las Grutas;
  - **el miércoles sin Museos** el día empieza a su hora, con el Castillo de Sant'Angelo por dentro (abre a las 9:00; por fuera si el viaje ya lo lleva por dentro), el Puente y el Lungotevere. Después, la Plaza y la Basílica cuando acaba la audiencia (desde las 12:30), la comida en el Borgo y la tarde de siempre.

**Pool:**
- **Cúpula:** después de la Basílica ~45.
- **Castillo por dentro:** ~60, en lugar de por fuera.

**Experiencias:**
- **Arte y Museos:** los Museos con la Pinacoteca ~4 h.
- **Naturaleza y Vistas:** la Cúpula.
- **Mercadillos:** «Plaza de San Pedro y los 100 Presepi».

**Reserva de los Museos a otra hora:** la regla general (la regla 4). La mañana se hace sin los Museos y los Museos van a su hora; después, lo de la tarde en su orden.

**Museos reservados a media mañana (de 9:00 a 12:00):**
- **mañana:** la Basílica de San Pedro por dentro a primera hora (abre a las 7:00; desde las 8:00, casi sin cola) ~1 h y la Plaza ~30 (con los Museos a las 9:00, el día empieza a las 7:30);
- «Llegada a…» y 🎟 los Museos a su hora;
- **comida:** en el Borgo (Borghiciana o Dal Toscano), antes de las 15:00 (con los Museos a las 12:00, se sale hacia las 14:30);
- **tarde:** la de siempre (la Conciliazione, el Castillo, el Puente y Trastevere).
- **La Basílica nunca pasa a «de camino»** para que quepa la comida: va antes de los Museos.

**Museos reservados a mediodía (de 12:30 a 14:30):** la comida va antes, porque al salir ya serían más de las 15:00.
- **mañana:** Plaza de San Pedro ~30, Basílica por dentro ~1 h 15, la Conciliazione ~10, el Castillo por fuera ~30 y el Puente ~15 (con los Museos a las 12:30 o a las 13:00, el Castillo y el Puente pasan a después de los Museos, de camino a Trastevere);
- **comida:** en el Borgo, antes de los Museos (Borghiciana o Dal Toscano; con los Museos a las 12:30, hacia las 11:45, rápida);
- «Llegada a…» y 🎟 los Museos;
- **tarde:** el bus 23 a Trastevere: la Isla Tiberina, Santa Maria in Trastevere, el Tempietto, la Fontana dell'Acqua Paola y el Janículo;
- **cena y noche:** las de siempre.

**Cómo se monta este día** (decidido el 9-oct-2026, igual que el día del Free Tour): dos partes, **el Vaticano** (los Museos, la Plaza, la Basílica, la Conciliazione, el Castillo por fuera y el Puente) y **Trastevere** (la Isla Tiberina, Santa Maria in Trastevere, el Tempietto, la Fontana dell'Acqua Paola, el Janículo y el paseo). Con los Museos por la mañana (hasta las 14:30), el Vaticano por la mañana y Trastevere por la tarde, como arriba. Con los Museos por la tarde, al revés. La Basílica, antes o después de los Museos, con la misma regla que el D3.

**Museos reservados por la tarde (de las 15:00 a la última entrada, a las 18:00):** Trastevere por la mañana y el Vaticano por la tarde (los Museos cierran a las 20:00: si se entra a las 17:00 o más tarde, la visita es más corta, ~2 h).
- **Mañana:**
  - Isla Tiberina ~20
  - Santa Maria in Trastevere, por dentro ~25
  - Paseo por Trastevere ~30
- **Comida:** Tonnarello (o Da Enzo al 29), en Trastevere
- **Tarde:**
  - San Pietro in Montorio y el Tempietto ~10
  - Fontana dell'Acqua Paola ~10
  - Mirador del Janículo ~30
  - *de camino:* el paseo del Janículo, bajando hasta San Pedro (~20 min)
  - «Llegada a…» y 🎟 Museos Vaticanos y Capilla Sixtina ~3 h (con los Museos a las 17:00 o más tarde, la Plaza y la Basílica van antes)
  - Plaza de San Pedro ~30
  - Basílica de San Pedro, por dentro ~1 h (abre hasta las 20:00)
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, por fuera ~30
  - Puente Sant'Angelo ~15 (ya de noche)
- **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati
- **Noche:** la nocturna que toque (regla 13): Trastevere ya se ha visto ese día.
- **La Cúpula** (si el viaje no lleva el D6): después de la Basílica, si da tiempo; si no, a «Si te sobra tiempo».

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
  - Bus 40 o taxi a la entrada de los Museos
  - 🎟 Museos Vaticanos y Capilla Sixtina ~2 h 30 (turno de tarde)
  - Plaza de San Pedro ~30 (al salir de los Museos, ~10 min andando junto a la muralla; la cola de la Basílica se hace aquí)
  - Basílica de San Pedro, por dentro ~1 h (abre hasta las 20:00 todo el año)
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, por fuera ~30
  - Puente Sant'Angelo ~15
- **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati, a ~10 min del Castillo
- **Noche:** la pareja de nocturnas que toque (regla 13), con taxi de 15 min o menos. El Puente y el Castillo ya se han visto de tarde. En un viaje de 3 días suele ser el Coliseo y el Foro desde el Campidoglio, si no se han visto ese día.
- **Con los Museos reservados de 13:30 a 14:30:**
  - la mañana igual, con el Free Tour;
  - al acabar en Navona (hacia las 12:30), taxi al Borgo (~15 min);
  - **comida** sin entretenerse en el Borgo (Borghiciana o Dal Toscano, ~45);
  - «Llegada a…» y 🎟 los Museos;
  - al salir, la **Basílica** (abre hasta las 20:00) y la Plaza de San Pedro.
- **Domingo (Museos cerrados):** se cambia de día; si no se puede, la tarde sin Museos.

**Cómo se monta este día** (decidido el 9-oct-2026). Son dos partes, y da igual qué se reserve primero:
- **la parte del Free Tour:** el Free Tour y lo de antes del tour (Trevi, el desayuno, el Panteón…);
- **la parte del Vaticano:** los Museos, la Plaza de San Pedro, la Basílica y la Conciliazione; y, si va por la tarde, el Castillo por fuera y el Puente.

**Sin reservas:** el Free Tour de las 10:00 por la mañana y el Vaticano por la tarde (el día de arriba).

**Con una reserva, la otra parte se va a la otra mitad del día:**
- **Free Tour reservado por la mañana (10:00 o 12:00):** el Vaticano entero pasa a la tarde, y acaba con el Castillo y el Puente ya de noche.
- **Free Tour reservado por la tarde (15:00 o 17:00):** el Vaticano pasa a la mañana, **sin el Castillo ni el Puente** (no da tiempo). Van a «Si te sobra tiempo», y si da tiempo, HOY lo propone.
- **Museos reservados por la mañana:** el Free Tour pasa a la tarde. **Museos reservados por la tarde:** el Free Tour pasa a la mañana.

**Las horas de los Museos** (la última entrada es a las 18:00; cierran a las 20:00):

| Museos a las… | Van… | Free Tour (si no está reservado) | La Basílica | La comida |
|---|---|---|---|---|
| 8:00 – 9:00 | por la mañana | 15:00 | después de los Museos | en el Borgo, después |
| 9:30 – 12:00 | por la mañana | 17:00 | antes de los Museos (abre a las 7:00) | en el Borgo, después |
| 12:30 – 13:30 | por la mañana | 17:00 | antes de los Museos | en el Borgo, antes de los Museos |
| 14:00 – 16:30 | por la tarde | 10:00 | después de los Museos | junto a Navona, después del Free Tour |
| 17:00 – 18:00 | por la tarde | 12:00 | antes de los Museos (si no, ya habría cerrado) | junto a Navona, después del Free Tour |

**Si los dos están reservados,** cada uno a su hora, con la misma tabla. Se pisan, y sale el aviso de la regla 17, si no da tiempo a llegar de uno a otro (30 min para llegar a la Plaza de España, ~2 h 30 de Museos y ~2 h 30 de Free Tour). Por ejemplo:
- Free Tour a las 10:00 y Museos antes de las 13:30;
- Free Tour a las 12:00 y Museos antes de las 15:30;
- Free Tour a las 15:00 y Museos después de las 11:00;
- Free Tour a las 17:00 y Museos después de las 13:30.

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
    - Bus 40 o taxi a la entrada de los Museos
    - 🎟 Museos Vaticanos y Capilla Sixtina ~2 h 30 (turno de 15:30 a 16:30)
    - Plaza de San Pedro ~30
    - Basílica de San Pedro, por dentro ~1 h (abre hasta las 20:00)
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
  - **cena:** Armando al Pantheon (o Da Baffetto);
  - **noche:** la nocturna que toque (regla 13), que no sea de lo visto ese día (regla 11c);
  - sin Trevi «sin gente»: sale de noche otro día;
  - el Castillo y el Puente, a «Si te sobra tiempo» (HOY los propone si da tiempo);
- **A las 17:00:** como el de las 15:00, con el Panteón y el camino de la Plaza de España antes del tour.
  - **mañana y comida:** las del de las 15:00;
  - **tarde:**
    - Via della Conciliazione ~10
    - Taxi al Panteón
    - Panteón, por dentro ~30
    - Templo de Adriano, por fuera ~10
    - Piazza Colonna y la Columna de Marco Aurelio ~10
    - Via Condotti ~15
    - 🎟 Free Tour por Roma, 17:00 ~2 h 30. Sale de la Plaza de España y acaba en Navona.
  - **cena:** Da Baffetto (o Armando al Pantheon), junto a Navona;
  - **noche:** la nocturna que toque (reglas 13 y 11c);
  - el Castillo y el Puente, a «Si te sobra tiempo» (HOY los propone si da tiempo);
- **A las 21:00:** no hay D3: el Free Tour va en la noche del D1 (ver el D1 y la tabla «Qué días lleva cada viaje»).
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
- **Noche:** Fontana de Trevi iluminada (taxi) y la Plaza de España de noche

**Con el Coliseo reservado por la tarde (15:30 en adelante)** (decidido el 9-oct-2026): Trastevere por la mañana y la Roma antigua por la tarde.
- **mañana:**
  - Santa Maria in Trastevere, por dentro ~20
  - San Pietro in Montorio y el Tempietto ~10
  - Fontana dell'Acqua Paola ~10
  - Mirador del Janículo ~30
  - *de camino:* bajada a Trastevere
  - Paseo por Trastevere ~30
  - Isla Tiberina ~20
  - Teatro de Marcelo ~10
  - Barrio Judío ~25
- **comida:** Giggetto al Portico d'Ottavia (o Nonna Betta), en el Gueto;
- **tarde:** la Roma antigua de la lista del D1 «Por la tarde»: la Plaza del Campidoglio, el Altar de la Patria por dentro, Piazza Venezia, Via dei Fori Imperiali, el Arco, «Llegada a…» y el Coliseo; el Foro y el Palatino antes o después, según la regla del D1;
- **cena:** en Monti (La Taverna dei Fori Imperiali o Trattoria Valentino);
- **noche:** Fontana de Trevi iluminada (taxi) y la Plaza de España de noche.
- **Con el Coliseo a mediodía (12:30 – 15:00):** la mañana y la comida de la lista del D1 «A mediodía», y por la tarde el Gueto y Trastevere, más cortos (lo de menos, a «Si te sobra tiempo»).

**Pool:** como el D1, con el Ojo y la Galería por la tarde, en lugar de la Isla Tiberina y Trastevere.

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
- **Noche:** Coliseo iluminado (taxi)

**Pool:** la Galería Borghese, 🎟 por la mañana (turno de las 9:00) o por la tarde, va antes del Pincio. Santa Maria del Popolo, por la tarde.

**Experiencias:**
- **Naturaleza y Vistas:** el Parque de Villa Borghese antes del Pincio.
- **Mercadillos:** antes de cenar, «Luces de Navidad del Tridente» ~30 (Via Condotti y Via del Corso iluminadas).
- **🌧 Si llueve:** el Pincio y sus jardines salen; Santa Maria del Popolo y Trinità por dentro, y el Ara Pacis (~45) entre el Popolo y la Plaza de España.


### Medio día de Monti · DM-medio (con Free Tour de mañana)

- *de camino:* Fontana de Trevi
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
- **Noche:** Coliseo iluminado (taxi)

**Lunes (la Galería cierra):**
- primero, el cambio de orden de los días;
- si no se puede, en lugar de la Galería, la Cripta de los Capuchinos (Via Veneto, ~45; abre a las 10:00), después de la Fuente del Tritón.

**La Galería Borghese a otra hora** (las entradas empiezan cada hora, de 9:00 a 17:00, y hay una a las 17:45; cada visita dura 2 h):
- **Qué lista usa cada hora:** 9:00 y 10:00 → la de las 9:00; 11:00 → el día normal; 12:00 → la de las 12:00; 13:00, 14:00, 15:00, 16:00, 17:00 y 17:45 → el día al revés (con la entrada a las 13:00 o a las 14:00, la comida antes, entre las 12:00 y las 12:30).
- **A las 9:00:**
  - **mañana:** desayuno cerca de Via Veneto, la Fuente del Tritón ~10, Via Veneto ~10 y Porta Pinciana ~10, «Llegada a…» y la Galería; después, el lago, la Piazza di Siena, el reloj de agua y el Pincio;
  - **tarde:** la de siempre;
  - **Trevi:** no cabe a primera hora. Si el viaje no la lleva otro día, va al final de la tarde, de camino desde la Plaza de España a la cena (~7 min).
- **A las 11:00:** el día normal (la Galería y después el parque, de camino al Pincio).
- **De las 14:00 a las 17:45:** el día va al revés.
  - **mañana:** Trevi «sin gente» a las 7:30, desayuno, la Plaza de España, la Escalinata y Trinità dei Monti, Via Condotti ~15, el Ara Pacis por dentro (abre a las 9:30), de camino Via di Ripetta, la Piazza del Popolo y Santa Maria del Popolo (por la mañana abre);
  - **comida:** junto a la Piazza del Popolo (Sgarro Bistrot o Buccone);
  - **tarde:** la Terraza del Pincio, el reloj de agua, el lago y la Piazza di Siena, «Llegada a…» y la Galería; al salir, Porta Pinciana ~10, Via Veneto ~10 y la Fuente del Tritón ~10;
  - **cena:** en el Tridente.
- **A las 12:00** (decidido el 9-oct-2026): el parque antes y la comida después.
  - **mañana:** Trevi «sin gente» a las 7:30, desayuno, la Plaza de España ~45, la Escalinata y Trinità dei Monti ~20, la Terraza del Pincio ~20, el reloj de agua ~10, el lago y la Piazza di Siena ~30, «Llegada a…» y la Galería;
  - **comida:** junto a la Piazza del Popolo (Sgarro Bistrot o Buccone), bajando por el Pincio (~20 min), antes de las 15:00;
  - **tarde:** la Piazza del Popolo ~30, Santa Maria del Popolo ~20 (abre a las 16:00), el Ara Pacis por dentro ~45, Via Condotti ~15 y *de camino* Via Margutta;
  - **cena y noche:** las de siempre;
  - Porta Pinciana, Via Veneto y el Tritón no caben: si el viaje no los lleva otro día, a «Si te sobra tiempo».

**Con Free Tour de mañana:** sin Trevi ni desayuno, y sin el Tritón, Via Veneto ni Porta Pinciana del principio: **el día empieza directamente en Villa Borghese** (taxi o metro hasta Porta Pinciana), con la Galería primero. Después, el parque (la Piazza di Siena y el lago), el reloj de agua y la Terraza del Pincio. La Plaza de España va de camino por la tarde (el tour ya pasó); Via Condotti ~15, como parada.

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
- Boca de la Verdad ~20 (⚠️ cierra a las 17:50 en verano y a las 16:50 en invierno: si no da tiempo, por fuera)
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
  - Basílica de San Clemente, con las excavaciones ~40 (⚠️ cierra de 12:30 a 14:00)
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
- **Noche:** la pareja que toque (regla 13). Suele ser el Panteón y Piazza Navona de noche (taxi, ~10 min).
- **Lunes:** Caracalla cierra: sale con «Cerrado hoy».
- **Domingo:** San Clemente solo abre por la tarde: va después de comer y el taxi sale de allí.
- **Ya no van** el paseo por el Aventino ni el de Testaccio (decidido el 6-oct: sin paseos).
- **Pool:** la Domus Aurea, 🎟 solo con reserva y de viernes a domingo, por la mañana entre San Pietro in Vincoli y San Clemente.
- **Experiencias:**
  - **Naturaleza y Vistas:** el Jardín de los Naranjos ~45.
  - **Mercadillos:** el belén de Santa Maria Maggiore.

- **🌧 Si llueve:** la mañana igual (todo por dentro); por la tarde, Caracalla, el Jardín de los Naranjos y el Ojo, más cortos, y Santa Maria in Cosmedin por dentro.

---

## Roma desde arriba · D6

- **Mañana:**
  - Cúpula de San Pedro ~1 h 15 (se sale por la Basílica)
  - *de camino:* Plaza de San Pedro
  - Via della Conciliazione ~10
  - Castillo de Sant'Angelo, hasta la terraza del ángel, por dentro ~1 h 30
  - Puente Sant'Angelo ~10
  - *de camino:* Via dei Coronari
  - *de camino:* Piazza Navona («Ya lo visitaste el día 1»)
  - *de camino:* Panteón
- **Comida:** Enoteca Corsi (o Giggetto al Portico d'Ottavia)
- **Tarde:**
  - *de camino:* Plaza del Campidoglio («Ya lo visitaste el día 1»)
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
- **Miércoles (audiencia):** la mañana va al revés y la Cúpula al final, cuando acaba la audiencia (desde las 12:30): Piazza Navona, de camino el Panteón y Via dei Coronari, el Puente, el Castillo por dentro, la Plaza de San Pedro, la Cúpula y comida en el Borgo (Arlù o 200 Gradi). El día empieza a su hora. En julio no hay audiencias.
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
  - Catacumbas de San Calixto (visita guiada) ~1 h (⚠️ cierran el miércoles)
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

## Llegadas y vueltas (decidido el 8-oct-2026, repasado por la tarde)

**Toda esta sección es de la Tanda 7.** Hasta entonces, la app sigue como está: sin vuelos, días enteros, y una reserva en otro día cambia un día entero por otro.

### El orden nuevo de los días (entra con la Tanda 7; sustituye entonces a «Qué días lleva cada viaje», «El día de excursión» y «El orden de los días» de arriba)

**Qué días lleva cada viaje** (8-oct-2026: el día 1 es el del centro y el Coliseo y el Vaticano van en los días 2 y 3):

| Viaje | Sin Free Tour | Con Free Tour |
|---|---|---|
| 1 día | D0 | no se ofrece |
| 2 días | D1 + D2 | D3 + D1-FT |
| 3 días | Centro + D1 + D2 | Centro con Free Tour + D1 + D2 |
| 4 días | Centro + D1 + D2 + **día 4 con interruptor** (Roma por defecto: D4) | Centro con Free Tour + D1 + D2 + día 4 con interruptor |
| 5 días | Centro + D1 + D2 + **día 4 con interruptor** (Excursión por defecto) + D4. Con Roma: Centro + D1 + D2 + D4 + D5 | igual, con el Centro con Free Tour |
| 6 días | Centro + D1 + D2 + **día 4 con interruptor** (Excursión por defecto) + D4 + D5. Con Roma: Centro + D1 + D2 + D4 + D5 + D6 | igual, con el Centro con Free Tour |
| 7 días o más | lo de 6 días; del día 7 en adelante, la hoja «Ya has visto lo mejor de Roma» y EXPLORAR | igual |

**Con el Free Tour de las 21:00** (decidido el 9-oct-2026): el viaje lleva los días de «Sin Free Tour», y el Free Tour va en la noche del D1 (ver el D1). Con el de las 10:00, las 12:00, las 15:00 o las 17:00, los de «Con Free Tour de mañana», con el D3 según su hora (ver el D3).

- **El Centro** es la «Llegada a Roma»: la ruta del centro histórico entera, con la comida, la cena y la nocturna, empezando a las 9:00, para todos (ver «Llegadas y vueltas»). **Con Free Tour,** el Free Tour a las 10:00 y, de la lista, lo que el guía no enseña.
- **Con vuelos,** la misma tabla: el día 1 se recorta por la hora de llegada y el último pasa a ser la última mañana o el traslado (ver «Llegadas y vueltas»). Los medios días (D0-medio, DT-medio, DA-medio, DM-medio) solo salen ahí.
- **El D4 detrás del día del Centro** va siempre en su versión «Con Free Tour de mañana»: empieza en Villa Borghese y la Plaza de España va de camino, porque ya se vio el día 1.
- **El D1-corto** ya no se usa: el centro lo ve el día 1.

**El día de excursión,** con el orden nuevo:
- Es el **día 4** en los viajes de 4, 5 y 6 días, también con vuelos, si ese día es entero.
- **Con el interruptor en Roma, los días de Roma van en su orden (D4, D5, D6):**
  - 4 días: el día 4 es el D4.
  - 5 días: D4 el día 4 y D5 el día 5.
  - 6 días: D4 el día 4, D5 el día 5 y D6 el día 6.
- Lo demás, como arriba (la reserva que bloquea el interruptor, solo la excursión ese día).

**El orden de los días** (decidido el 7-oct-2026; cambiado el 8-oct-2026, vale para todos los destinos):
- **Día 1, el centro** (en viajes de 3 días o más): lo que más rápido se ve y casi sin entradas. Es lo que hace casi todo el mundo el día que llega.
- **Días 2 y 3, lo imprescindible con reserva:** en Roma, la Roma antigua (D1) y el Vaticano (D2).
- **Día 4, el interruptor;** después, Villa Borghese (D4), las basílicas (D5) y Roma desde arriba (D6).
- **Por qué:** el día 1 y el último casi nunca son enteros. Así, cuando el viajero pone sus vuelos, solo cambian esos dos días, y el Coliseo y el Vaticano (y lo que haya reservado) se quedan donde estaban.
- **Los cierres** (el Vaticano no en domingo ni en miércoles, la Galería no en lunes): primero se cambian entre sí el D1 y el D2 (días 2 y 3); si aun así no se puede, con el día siguiente. Lo imprescindible, lo más pronto posible, y nunca en el día 1.
- **En viajes de 2 días,** como antes: D1 + D2 (con Free Tour, D3 + D1-FT).

---


**La idea de fondo:** nosotros ponemos **las paradas**; el viajero decide cuándo las empieza. **No calculamos al minuto:** el día de llegada se monta por tramos de hora, y lo que pase luego (si descansa, si va más rápido) lo ajusta HOY, quitando o añadiendo paradas.

### Lo que pone el viajero (en RESERVAS, nunca en el formulario)
- **La hora de llegada y la de salida,** con su aeropuerto, estación o puerto. Ya existen en RESERVAS («+ AÑADIR VUELO», los botones de Fiumicino y Ciampino); se usan esas, no otras nuevas.
  - **El día** es el primero y el último del viaje. Debajo de la hora, en pequeño: «¿Llegas o te vas otro día? Cambia las fechas del viaje», que abre el cambio de fechas que ya existe.
  - **La vuelta usa su propio medio,** que puede no ser el de la ida (como ya hace la app).
  - **En coche no se pide hora,** como ahora: el viaje sale con días enteros.
- **«¿En qué zona te alojas?»,** en el bloque del alojamiento de RESERVAS (sirve para saber por dónde empieza la ruta del día 1 y para «Cómo llegar a tu zona», abajo): Centro (Panteón, Trevi, Navona) · Plaza de España (Plaza de España, Popolo, Via del Corso) · Prati (Vaticano) · Trastevere · Termini · Monti (Coliseo) · Aún no lo sé. «Aún no lo sé» cuenta como Centro.
- **Sin hora de llegada ni de salida,** el viaje sale con días enteros, como hasta ahora.

### Las horas: libre y salir
- **Todas las horas salen de `_llegada.json`,** que ya tiene los tiempos comprobados de cada punto. No se escriben en ningún otro sitio.
- **Libre** = la hora de llegada + el traslado de ese punto (`al_centro_min`) + 30 min para dejar la maleta. Queda así:
  - Fiumicino, 1:30;
  - Ciampino, 1:20;
  - Termini, 0:45;
  - Tiburtina y la estación de autobuses, 0:55;
  - Civitavecchia, 2:30.
- **Salir** = la hora de salida menos lo de `_llegada.json`:
  - Fiumicino, 3:00;
  - Ciampino, 2:50;
  - Termini, 0:45;
  - Tiburtina y la estación de autobuses, 0:55;
  - Civitavecchia, el embarque más el trayecto al puerto (unas 3:50).
- **La hora a la que está libre no se enseña nunca:** es solo para elegir el tramo.
- **Los tiempos se cuentan siempre desde el centro.** En los textos para el viajero no sale nunca la palabra «centro» (los nombres de zona, como «Centro (Panteón, Trevi, Navona)», sí).
- **Vuelos de madrugada** (de 0:00 a 5:00):
  - **a la llegada,** el día 1 es un día entero normal (se duerme y se empieza a su hora);
  - **a la vuelta,** se cuenta como la noche anterior: el último día solo lleva el traslado, y el día de antes acaba sin nocturna.
- **Vuelos de vuelta de 5:00 a 9:00:** el día de antes es normal, con su noche, y el último día solo lleva el traslado.
- **Llegar y irse el mismo día** (un viaje de un día): de momento, el D0 de siempre, como sin vuelos, con las dos barras.

### Lo que se ve en el día
- **La barra de llegada que ya existe,** sin la hora de la derecha: «LLEGADA · VUELO 09:00 · FIUMICINO». Fuera «EN EL CENTRO 10:00».
- **La de vuelta,** como ahora: «VUELTA · VUELO 17:00 · FIUMICINO · SAL A LAS 14:00».
- **La etiqueta «Día de viaje»,** como ahora, en el primer día y en el último.

### Los días reales
- **La idea:** con vuelos, el viaje es el mismo que sin vuelos (la tabla de «El orden nuevo de los días», arriba). Solo cambian el primer día y el último:
  - **el día 1** (el Centro, la «Llegada a Roma») se recorta por la hora a la que está libre (abajo); con un vuelo de madrugada, entero;
  - **el último día** pasa a ser la última mañana o solo el traslado;
  - **los días de en medio no se mueven:** el día 2, el D1; el día 3, el D2; el día 4, el interruptor; luego, D4, D5 y D6.
- **En viajes de 2 días** con vuelos, el día 1 es la llegada y el día 2 la vuelta: el D1 y el D2 no caben enteros. Van como «Sin ningún día entero» (abajo).
- **El día que se va:**
  - **hay «última mañana»** si quedan 3 h o más entre las 9:00 y la hora de salir menos 1:00 (para recoger la maleta). Con Fiumicino, si el vuelo sale a las 16:00 o más tarde;
  - **si no da para una mañana,** ese día solo lleva el traslado.
- **La última mañana** es el medio día de mañana que toque, tal como está escrito y a su hora de empezar (el DT-medio, a las 7:30), con su versión de cierres (el D0-medio del miércoles, el DA-medio del lunes):
  - si el viaje no lleva el Vaticano (D2) en un día entero, el D0-medio;
  - con el D1 y el D2, el DT-medio;
  - con el D4 también, el DA-medio;
  - con el D5 también, la mañana del D6. Si ya han salido todos, la hoja «Ya has visto lo mejor de Roma».
  - **Si no cabe entera** antes de la hora de salir menos 1:00, lo del final pasa a «Si te sobra tiempo» (regla 5).
- **La comida de la última mañana** solo sale si la hora de salir es a las 14:30 o más tarde.
- **Con un solo día entero** (el día 2):
  - con última mañana, el D1 y, en la última mañana, el D0-medio. Es la ruta de 1,5 días, con el centro ya visto el día 1;
  - sin última mañana, el D0 (Roma en un día).
- **Sin ningún día entero:** la llegada y, si la hay, la última mañana (el D0-medio).
- **Una reserva grande en la última mañana** (decidido el 8-oct-2026, por la noche). La reserva manda: aunque la mañana no llegue a 3 h, si hay una reserva, esa mañana existe.
  - **A la última mañana va solo su bloque:**
    - Coliseo: el Coliseo a su hora, el Arco de Constantino y el Foro y Palatino;
    - Museos: los Museos a su hora, la Plaza de San Pedro y la Basílica;
    - Galería: la Galería a su hora y el parque de Villa Borghese.
  - **Se mira si el bloque cabe** antes de la hora de salir menos 1:00. Con un vuelo a las 15:00 o más tarde desde Fiumicino, el del Coliseo cabe entero (justo, pero la reserva manda).
  - **Lo que no cabe se queda en su día** (la Basílica, el parque), salvo el Foro y Palatino: va con la misma entrada y empieza en el Coliseo, así que no puede ir otro día antes. Si no cabe, al guardar la reserva sale la hoja: «Ese día sales hacia el aeropuerto a las 12:00. Te da tiempo al Coliseo, pero no al Foro y el Palatino, que van con la misma entrada.» [De acuerdo] · [Cambiar la reserva].
  - **Si no cabe ni la reserva,** el aviso de siempre: «… no te da tiempo. Revisa tu reserva.».
  - **El resto de su día escrito se queda en su día,** sin el bloque. Nada se pierde, nada se repite y nada se inventa. Ese día queda más corto y HOY propone qué añadir.
    - el día del Coliseo empieza en el Campidoglio (el Altar, la comida en el Gueto y la tarde del centro);
    - el del Vaticano, con su versión sin Museos (la del miércoles: el Castillo, el Puente y Trastevere);
    - el de Villa Borghese, con su versión sin Galería (la del lunes).
  - **La comida de la última mañana,** solo si se sale a las 14:30 o más tarde, como siempre.
- **Una reserva grande el día de llegada:**
  - **si está libre antes de las 13:00,** ese día pasa a ser el día escrito de ese sitio entero, desde la hora a la que está libre, con la lista de la hora de la reserva, y el día que lo llevaba pasa a ser el del Centro: se cambian uno por otro, como sin vuelos;
  - **si está libre más tarde,** como en la última mañana: la reserva con su bloque, el resto de la llegada según el tramo, y el resto de su día escrito se queda en su día.
- **La excursión** va en el día 4, como sin vuelos, si ese día es entero. El interruptor sale como sin vuelos (4 días, en «Roma»; 5 o más, en «Excursión»), así no cambia al poner los vuelos.
  - **Si con los vuelos el día 4 pasa a ser el de vuelta,** no hay interruptor (ver «La excursión y los vuelos»).
- **La regla 11c** (la noche y lo visto ese día) cuenta los días del viaje por sus fechas.

### La «Llegada a Roma» (el día 1)
**Una sola ruta para todos, el centro histórico** (decidido el 8-oct-2026, por la noche). Es lo que mejor se adapta a cualquier hora de llegada, porque está todo cerca, y no repite lo de los días 2 y 3. La zona donde duerme solo decide **por dónde empieza**:
- **Centro, Prati, Trastevere, Monti y Termini** (y «Aún no lo sé»): empieza en Navona. Desde Prati se cruza el Puente; desde Trastevere, el Ponte Sisto; desde Monti y Termini, el bus 40 o 64. Para el Centro, este orden deja el Pincio para el atardecer, la cena en el Tridente y Trevi de vuelta al alojamiento.
- **Plaza de España:** empieza en la Plaza de España y da la vuelta sin volver atrás (sube a la Trinità y al Pincio, baja al Popolo y vuelve por Via del Corso a Trevi, el Panteón y Navona).

**Sin vuelos, también:** el día 1 de los viajes de 3 días o más es esta ruta entera, empezando a las 9:00. Al poner los vuelos, solo se recorta por el tramo. El día se llama «Llegada a Roma», con o sin vuelos.

**La ruta:** todo por fuera.
- **Empezando en Navona:** Piazza Navona · Panteón · Fontana de Trevi · Via Condotti · Plaza de España · la Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo.
  - Comida: Armando al Pantheon (o Da Baffetto).
  - Cena: si acaba en Trevi o antes, Armando o Da Baffetto; si llega a la Plaza de España o más allá, Il Gabriello (o Poldo e Gianna).
- **Empezando en la Plaza de España:** Plaza de España · la Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo · *de camino* Via del Corso · Fontana de Trevi · Panteón · Piazza Navona.
  - Comida: Poldo e Gianna (o Edy).
  - Cena: si acaba en el Popolo o antes, Il Gabriello (o Poldo e Gianna); si llega a Trevi o más allá, Armando o Da Baffetto.
- **Sin repetir** el restaurante de la comida.
- **Si llega tarde, lo primero que se quita es el Pincio y el Popolo,** que son lo menos vistoso. Los imprescindibles del centro (Navona, el Panteón, Trevi y la Plaza de España con la Trinità) se quedan siempre que esté libre antes de las 20:30: de día o, lo que no quepa, de noche.

**Qué ve según la hora a la que está libre** (cada tramo empieza en su hora: libre a las 13:00 en punto ya es el segundo):

| Libre a las… | Qué ve el día 1 |
|---|---|
| antes de las 13:00 | toda la ruta, con el Pincio y el Popolo, la comida, la cena y la nocturna. Si está libre antes de las 9:00, empieza a las 9:00 |
| de 13:00 a 14:30 | la comida nada más llegar y los imprescindibles: Navona, el Panteón, Trevi y la Plaza de España con la Trinità (sin el Pincio ni el Popolo); la cena y la nocturna |
| de 14:30 a 17:00 | los imprescindibles, sin comida; la cena y la nocturna |
| de 17:00 a 20:30 | **desde Navona:** Navona y el Panteón, la cena, y de noche Trevi y la Plaza de España. **Desde la Plaza de España:** la Plaza de España y la Trinità, el Panteón y Navona, la cena, y de noche Trevi |
| de 20:30 a 23:00 | Trevi de noche, «para un primer contacto» (texto abajo) |
| después de las 23:00 | nada (texto abajo) |

**La noche:**
- **Si Trevi y la Plaza de España ya se han visto ese día** (los tres primeros tramos), en viajes de 2,5 días o más la nocturna no puede ser un sitio visto ese día (regla 11c). Va otra a 15 min o menos de la cena, andando o en taxi, como en el D3 (regla 13): primero las imprescindibles, así que suele ser el Coliseo. En viajes más cortos, Trevi y la Plaza de España de noche.
- **De 20:30 a 23:00:** «{Llegada} a las {hora}. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.» Ejemplo: «Aterrizas a las 21:00. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»
- **{Llegada}** según cómo llega: avión, «Aterrizas»; tren o autobús, «Llegas a {punto}» (Termini, Tiburtina…); barco, «Desembarcas».
- **Después de las 23:00:** «{Llegada} a las {hora}. Descansa, que mañana empezamos a tope.» Ejemplo: «Aterrizas a las 23:30. Descansa, que mañana empezamos a tope.»
- **La nocturna de la llegada cuenta para el viaje:** no se repite otra noche.

**Lo visto en la llegada sí cuenta como visto (regla 9),** como en cualquier otro día:
- los días siguientes lo pasan a «de camino», con «Ya lo visitaste el día 1»;
- **salvo si ese día se entra por dentro** (el Panteón del D1, la Basílica del D2): entonces se queda como parada, igual.

### El Free Tour y otras reservas el día de llegada
- **Las horas del Free Tour en Roma:** 10:00, 12:00, 15:00, 17:00 y, a veces, 21:00. Sale de la Plaza de España y dura 2 h 30.
- **Se ofrece como ahora:** en viajes de 2 días o más (por sus fechas).
- **Si está reservado,** manda su hora.
- **Si solo está en el viaje** (marcado en Experiencias o añadido con «+ Añadir parada»), la app elige la primera hora que le pille libre, con 30 min para llegar a la Plaza de España:

  | Libre a las… | Free Tour |
  |---|---|
  | antes de las 9:30 | 10:00 |
  | de 9:30 a 11:30 | 12:00 |
  | de 11:30 a 14:30 | 15:00 |
  | de 14:30 a 16:30 | 17:00 |
  | después de las 16:30 | al día siguiente a las 10:00: el día 2 es el D3 y el día 3 el D1-FT (el único caso en que el Coliseo y el Vaticano se cambian de día al poner los vuelos) |

  - El de las 21:00, solo si lo reserva el viajero.
  - Texto: «Te proponemos el Free Tour de las {hora}, nada más llegar», con el botón para reservarlo.
- **La llegada con Free Tour:**
  - el Free Tour a su hora;
  - de la ruta, solo lo que el guía no enseña (la Trinità, el Pincio y el Popolo); Plaza de España, Trevi, el Panteón y Navona salen con «Lo ves en el Free Tour»;
  - la comida, la cena y la nocturna según el tramo.
- **Si el Free Tour se hace el día de llegada,** los días enteros son el D1 y el D2 (sin el D3), y los demás en su versión con Free Tour (el D4 «Con Free Tour de mañana»). Lo del D1 que ya enseñó el guía (Navona; el Panteón por fuera) va «de camino»; el Panteón por dentro se queda. No se usa el D1-FT: su tarde (Trastevere) repetiría la del D2.
- **Con uno o ningún día entero,** el Free Tour solo va el día de llegada. Si ahí no cabe, no se pone, y la hoja del resumen lo dice: «Con tus vuelos, el Free Tour no cabe sin quitarte el Coliseo o el Vaticano. Si aun así lo quieres, añádelo desde «+ Añadir parada».»
- **Cualquier otra reserva de ese día** queda fija a su hora y la llegada se ajusta alrededor (regla 4).
- **Si el día de llegada tiene reservado el Coliseo, los Museos o la Galería:** ver «Una reserva grande el día de llegada», en «Los días reales».

### La excursión y los vuelos
- **Con los vuelos, el día 4 pasa a ser el de vuelta y la excursión no está reservada:**
  - **si la puso la app por defecto** (el viajero no tocó el interruptor ni eligió excursión), ese día pasa a Roma solo, con la última mañana, y sale el texto de la vuelta «Había excursión»: «Tienes el vuelo a las 17:00, hacer una excursión no es viable, pero te hemos organizado una última mañana por Roma para que te vayas con buen sabor de boca.»;
  - **si la eligió el viajero,** la hoja pregunta: «Con tus vuelos, el día 4 (jueves 13) es el de tu vuelta: no da tiempo a la excursión a Pompeya.» [Pasar este día a Roma] · [Mantener la excursión]. Si la mantiene, sale el aviso de la excursión que vuelve después de salir.
- **Excursión reservada:** no se toca nunca, y los demás días se quedan donde estaban.
- **Excursión reservada el día de llegada, antes de que esté libre:** «Aterrizas a las 9:00 y tu excursión a Pompeya sale a las 7:30: no llegas. Revisa tu reserva.» [Ver mi reserva].
- **Excursión reservada el día de vuelta, que vuelve después de la hora de salir:** «Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma a las 20:00: no te da tiempo. Revisa tu reserva de la excursión.» [Ver mi reserva] · [Pasar este día a Roma].
  - No se cambia nada solo.
  - El mismo aviso sale si añade la confirmación de una excursión en un día que su vuelo no permite.
- **Ostia o Tívoli** (medio día, vuelta a las 14:00) el día de vuelta: solo con el vuelo a las 18:00 o más tarde.

### Las reservas y los vuelos
- **Una reserva antes de estar libre:** «Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.» [Ver mi reserva].
- **Una reserva después de la hora de salir:** «Tu entrada a los Museos Vaticanos es a las 15:00 y ese día sales hacia el aeropuerto a las 14:00. Revisa tu reserva.» [Ver mi reserva].
  - Según cómo se vaya, «hacia el aeropuerto», «hacia la estación» o «hacia el puerto».
- **Una reserva en un día en que ese sitio cierra** (vale también sin vuelos): «La Galería Borghese cierra los lunes: revisa la fecha de tu reserva.» [Ver mi reserva].

### Cómo salen los avisos
- **La hoja de abajo:** lo que acaba de pasar. Sale en el momento en que el viajero hace algo (pone el vuelo, guarda una reserva). Lleva su texto y la X; solo lleva botones si tiene que elegir. Todas las hojas de la app son la misma, también las de la 6j.
- **La campana de avisos:** lo que sigue mal. Si cierra la hoja sin arreglarlo, el aviso se queda en la campana (con su número) hasta que lo arregla. Solo van ahí los que son un problema: no llega a una reserva, una reserva después de salir, un sitio cerrado, la excursión que no cuadra.
- **Dentro del día,** lo pequeño, como siempre («Lo ves en el Free Tour», «Cerrado hoy»).
- **Al poner o cambiar los vuelos, el punto o la zona,** sale **una sola hoja** con todo lo que ha cambiado, no una por cosa. Por ejemplo:
  - «El martes 10 es tu llegada a Roma.»
  - «El sábado 14 tienes una última mañana por Roma, antes de salir hacia el aeropuerto a las 15:00.»
  - «Te proponemos el Free Tour de las 15:00, nada más llegar.»
  - «El día 3 lo has cambiado tú: lo dejamos como está.»

  Termina con [De acuerdo], o con los dos botones de la excursión si hay que elegir.
- **Los días que el viajero ha cambiado a mano** no se rehacen (lo suyo manda).
- **Si borra la hora del vuelo,** los días vuelven a ser enteros, con la misma hoja, y las reservas se quedan.

### Cómo llegar a tu zona
En la ventana de llegada que ya existe (Resumen · Traslados · Tips), arriba del todo, una línea «Para tu zona» con lo más cómodo según su punto de llegada y su zona. Debajo, las demás formas, como ahora. A la vuelta, lo mismo al revés.

| Zona | Desde Fiumicino | Desde Termini |
|---|---|---|
| Termini | Leonardo Express a Termini | ya estás: andando |
| Monti | Leonardo Express y metro B hasta Cavour (1 parada) | metro B hasta Cavour |
| Centro | Leonardo Express y bus 40 o 64 hasta Largo di Torre Argentina | bus 40 o 64 hasta Largo di Torre Argentina |
| Plaza de España | Leonardo Express y metro A hasta Spagna (3 paradas) | metro A hasta Spagna |
| Prati | Leonardo Express y metro A hasta Ottaviano | metro A hasta Ottaviano |
| Trastevere | tren FL1 hasta Roma Trastevere y tranvía 8 | bus 40 o 64 hasta Largo di Torre Argentina y tranvía 8 |

- **Desde Ciampino,** primero el Airlink a Termini y luego la columna «Desde Termini».
- **Desde Tiburtina,** el metro B a Termini y luego la columna «Desde Termini» (a Monti, directo en el B hasta Cavour).
- **Desde Civitavecchia,** el tren regional: a Prati, bajando en San Pietro; a las demás zonas, hasta Termini y luego la columna «Desde Termini».
- **El taxi de precio fijo** (55 € desde Fiumicino y 40 € desde Ciampino, dentro de las murallas) sale siempre como opción. A Prati va por taxímetro.
- **Si llega después del último tren** (la hora está en `_llegada.json`: el último Leonardo Express sale del aeropuerto a las 23:23), lo más cómodo es el taxi.
- **Los textos de la ventana** que hoy dicen «centro» («Cómo llegar al centro…», «De Fiumicino al centro», «casi todo el centro») pasan a decir «a Roma» o «a tu zona».

### Lo que no entra todavía
- La escala de crucero (llegar y salir el mismo día por Civitavecchia, sin dormir en Roma). De momento, se monta como un viaje de 1 día sin vuelos.
- Los viajes con varias ciudades. Las reglas de esta sección se escriben para que mañana sirvan para cada ciudad, pero de momento hay una sola llegada y una sola salida por viaje.
- La zona del alojamiento para el día de vuelta. La vuelta se cuenta desde el centro.
- Lo que sea gratis o de pago: se decide al final.
