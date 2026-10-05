# Días escritos de Roma

**Este documento manda.** Lo que pone aquí es lo que tiene que salir en la app: hora, parada, minutos y si es por dentro o por fuera.

- **Code copia** cada tabla a su fichero del día (`data/dias/roma/`), sin cambiar horas, sin añadir nada y sin «mejorar». Si algo no le cuadra, lo apunta y pregunta.
- **El motor solo ajusta**, y solo lo que dice «Lo que hará el motor» de cada día. No estira paradas, no rellena huecos, no reordena y no elige nocturnas.
- **Festivos y cierres:** el motor mira el horario oficial de cada sitio para esa fecha (festivos, misas y horarios especiales incluidos) y aplica la regla de cierres: adelantar, acortar (mínimo 20 min), por fuera o quitar.
- **Cada sitio es su propia parada.** La única excepción es de noche: «El Puente y el Castillo de Sant'Angelo iluminados» es una sola parada.
- **La prueba** compara, parada a parada, lo que sale con este documento. Solo valen las diferencias que explica «Lo que hará el motor».
- Debajo de cada día van siempre tres bloques: **pool**, **experiencias** y **Free Tour**.

## Qué sale en cada viaje (regla general, vale para todos los viajes)

1. **Viajes de 1 día y de 1,5 días: todo por fuera.** Lo que el viajero marque en el **pool** (o reserve) va por dentro y **es la prioridad**. Lo demás, lo que quepa. Si para meter lo del pool no cabe algún imprescindible, se queda fuera y punto: **el pool manda**.
2. **Viajes de 2 y 2,5 días:** van **todos los imprescindibles**: por dentro el **Coliseo con el Foro**, el **Panteón**, el **Altar**, la **Basílica de San Pedro** y los **Museos Vaticanos** (y las iglesias del camino); los de fuera (Arco, Trevi, Navona, Plaza de España, Trastevere) salen siempre; el Castillo de Sant'Angelo, por fuera. Lo del pool **tiene prioridad siempre** y va en **el mejor día para ese sitio** (su día escrito y la regla de orden de los días).
3. **Viajes de 3 días o más:** van **todos los imprescindibles**, por dentro, porque caben.
4. **Lo que solo se ve por dentro** (museos, galerías, palacios) y no va por dentro **no sale**, y no se explica por qué.
5. **Mientras se respeten los márgenes**, entran por este orden: primero el **nivel 1**, luego el **nivel 2** y luego el **nivel 3**. **Si algo no cabe, se quita al revés:** primero el nivel 3, luego el 2 y luego el 1. Un imprescindible solo se queda fuera en el caso del punto 1 (el pool manda en 1 y 1,5 días).
6. **Free Tour: en viajes de 1,5 días o menos, no.** Si el viaje dura **1,5 días o menos** (≤ 1,5), el Free Tour **no aparece en experiencias**: el formulario no lo ofrece y el motor no lo pone. Desde 2 días, sí.
7. **Restaurantes:** cada comida y cena lleva su alternativa entre paréntesis. Si el primero cierra ese día (día de descanso, vacaciones o festivo), va la alternativa; si cierran los dos, la tercera cuando la hay. Si no hay ninguna abierta, el motor pone otro restaurante de la misma zona abierto a esa hora (de los datos) y lo apunta en el registro.
8. **«No incluido»: motivo solo si es por un cierre o un festivo** («Cerrado el lunes», «Cerrado el 25 de diciembre»). En el resto de casos, solo el nombre, sin frase («solo con reserva», «no cabía»… no se ponen).

## Márgenes (valen para estos días escritos)

1. **Entre una parada y la siguiente:** lo que se tarda andando **más 10 min**, redondeado a 5. Aunque estén al lado, nunca menos de 10 min.
2. **Después de algo largo o con guía** (Free Tour, Museos Vaticanos, Coliseo, Foro, Galería Borghese): andar **más 15 min**.
3. **Antes de una hora fija:** llegar **15 min antes** a un turno o al Free Tour; **30 min antes** a una reserva.
4. **Bus o taxi:** el trayecto **más 10 min** de espera.
5. **Las colas van dentro de la visita:** la Basílica de San Pedro lleva 15 min más por el control de seguridad.
6. **«De camino»** no es parada: solo cuenta lo que se anda.
7. **Cada medio día tiene un colchón** (marcado «colchón»): es lo primero que se acorta si se va con retraso, para no perder una visita.

Versiones de la tarde según la puesta de sol: **A** antes de las 17:40 · **B** de 17:40 a 18:45 · **C** de 18:45 a 19:45 · **D** después de las 19:45. «Al atardecer» quiere decir que el motor ajusta esa parada (y el colchón de antes) para llegar con el sol, sin esperar nunca más de 30 min. **Hora límite de la noche:** las 23:00, y una nocturna que pase de ahí se quita. **Cuando la noche es agradable, se alarga:** de mayo a septiembre, y siempre que el sol se ponga después de las 19:45 (versión D), la nocturna entra si empieza como tarde a las 23:45 (puede acabar pasada la medianoche). Regla para todos los destinos: en los meses de verano, o donde el clima de noche lo permita, la noche se alarga lo que haga falta, sobre todo donde ver monumentos de noche es parte del viaje.

---

### Nocturna cuando se cena en Trastevere (regla general)

Si la cena es en Trastevere y esa tarde no se ha paseado ya Trastevere de noche, la nocturna es **Trastevere de noche** (30 min, sin taxi): de noche el barrio es otro, la gente sale con guitarras y se junta a cantar en la Plaza Trilussa. Antes van los imprescindibles que no hayan salido en el viaje (Trevi, Plaza de España). Vale también para las variantes (miércoles, sin Museos, reservas) que cenan en Trastevere.

### Qué hay en cada colchón

**Regla (todos los destinos):** todo colchón en el que haya algo que ver o hacer lo cuenta en su texto, dure lo que dure, para que el viajero entienda por qué está ahí. Nunca pasa de 2 horas; si el sol se pone tan tarde que pasaría de 2 horas, el motor lo apunta en el registro y lo revisamos. Lo que hay dentro no son paradas: va en el texto de la parada (las tiendas y cafés, como recomendación de camino).

| Colchón | Qué contar |
|---|---|
| Pasea y piérdete por Trastevere (iluminado) | Piazza Trilussa con su fuente, Via della Lungaretta, Vicolo del Cinque, Via della Scala con la hiedra y la Piazza di Santa Maria in Trastevere con la fuente más antigua de Roma. De noche, ropa tendida, faroles y terrazas. |
| Pasea y piérdete por Prati | Via Cola di Rienzo, la calle de compras de los romanos; la Piazza Cavour con el Palacio de Justicia, el «Palazzaccio»; la Piazza del Risorgimento junto a los muros vaticanos. |
| Pasea y piérdete por Borgo Pio | La calle peatonal del Borgo y el Passetto di Borgo, el pasadizo elevado por el que los Papas escapaban al Castillo. |
| Pasea y piérdete por Prati y el Borgo, hacia los Museos | Borgo Pio, el Passetto, la Piazza del Risorgimento y los muros vaticanos hasta la entrada de los Museos. |
| Pasea y piérdete por Via Condotti y el Tridente iluminados | Los escaparates de Via Condotti, el Antico Caffè Greco (abierto desde 1760), Via Frattina y Via della Croce, y la Fontana della Barcaccia iluminada al pie de la escalinata. En Navidad, las luces. |
| Pasea y piérdete por los Jardines del Pincio | Los bustos de italianos ilustres, el obelisco de Antínoo, el reloj de agua y la Casina Valadier por fuera. |
| Pasea y piérdete por Villa Borghese | Ver la lista de arriba, en el DT-medio (el lago y sus barcas, el reloj de agua, la Fontana dei Cavalli Marini, la Piazza di Siena). |
| La Passeggiata del Gianicolo | La avenida de los bustos de Garibaldi, el monumento ecuestre a Garibaldi, el de Anita Garibaldi y el Faro de los Argentinos, con Roma a los pies. |
| Plaza de San Pedro, ya iluminada | La columnata de Bernini, el obelisco y las dos fuentes; los dos discos del suelo desde donde las cuatro filas de columnas se ven como una sola. |
| Piazza Navona (colchón) | Las tres fuentes (los Cuatro Ríos, el Moro y Neptuno), Sant'Agnese in Agone y los pintores de la plaza. |
| Pasea y piérdete por el Centro Histórico | Via del Governo Vecchio, la Piazza di Pasquino con su «estatua parlante» y Via dei Coronari, la calle de los anticuarios. |
| … hacia la Plaza de España | La Piazza di Pietra con el Templo de Adriano, la Piazza Colonna con la Columna de Marco Aurelio y Via Frattina. |

## Nombres

| Nombre | Fichero |
|---|---|
| Roma en un día (crucero) | D0 |
| Día entero del viaje de 1,5 días | D1-corto (nuevo) |
| Medio día del Vaticano (viaje de 1,5 días) | D0-medio (nuevo) |
| Día de la Roma antigua | D1 |
| Día del Vaticano y Trastevere | D2 |
| Día del Free Tour y el Vaticano por la tarde | D3 |
| Día de la Roma antigua, el Gueto y Trastevere | D1-FT |
| Medio día del Tridente y el Pincio (viaje de 2,5 días) | DT-medio (nuevo) |
| Medio día de Monti (2,5 días con Free Tour de mañana) | DM-medio (nuevo) |
| Día de Trevi, el Pincio y Monti | D4M (pendiente; se rehará por niveles) |
| Día de la Borghese | D4 (pendiente) |

## Qué días lleva cada viaje

| Viaje | Sin Free Tour | Con Free Tour de mañana |
|---|---|---|
| 1 día | D0 | no se ofrece |
| 1,5 días | D1-corto + D0-medio (todo por fuera, salvo reserva) | no se ofrece |
| 2 días | D1 + D2 | D3 + D1-FT |
| 2,5 días | D1 + D2 + DT-medio (de mañana o de tarde) | D3 + D1-FT + DM-medio (de mañana) o DT-medio (de tarde) |
| 3 días | D1 + D2 + D4 (con Galería) o D4M (sin ella) | D3 + D1-FT + D4 o D5C |
| 4 días | D1 + D2 + D4 + D5C | D3 + D1-FT + D4 + D5C |
| 5 días | D1 + D2 + D4 + D5 + D6 | D3 + D1-FT + D4 + D5 + D6 |
| 6 días | + D7 | + D7 |
| 7 o más | del día 7 en adelante, en blanco (el viajero lo rellena a mano) | igual |

**Orden de los días (regla general):** si un día cae en una fecha que le va mal y se puede cambiar con otro día del viaje, se cambian. Fechas que le van mal a cada día:
- **Día del Vaticano (D2) y D3:** el **domingo**, el **Domingo de Pascua** (bendición del Papa, la plaza llena) y **cualquier fecha en que cierren los Museos Vaticanos** (las de sus datos: 1 y 6 de enero, 11 de febrero, 19 de marzo, Lunes de Pascua, 1 de mayo, 29 de junio, 14 y 15 de agosto, 8, 25 y 26 de diciembre…). El D2, además, el **miércoles** (audiencia del Papa).
- **Día de la Roma antigua (D1 y D1-FT):** el **2 de junio** (el Coliseo y el Foro no abren hasta la tarde) y el **25 de diciembre**.

En 2 días se cambian entre ellos (D1 ↔ D2; con Free Tour de mañana, D3 ↔ D1-FT). Ejemplo: martes y miércoles → el Vaticano el martes y la Roma antigua el miércoles. Miércoles y jueves → no hace falta: el Vaticano ya cae en jueves. Si los dos días caen en fechas malas, o no se puede cambiar, se usan las tablas de esa fecha (miércoles, «Sin Museos», fiesta) y la regla de cierres.

**Free Tour de tarde o de noche:** el viaje usa los días sin Free Tour, y el Día de la Roma antigua lleva su versión con el tour.

---

## Roma en un día (crucero) · D0

Todo por fuera. Horario por defecto de 9:30 a 16:30 (el viajero lo puede cambiar). Cómo llegar y cómo volver va en el acordeón del ferry.

**Ruta normal: del Vaticano al Coliseo**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:45 | Plaza de San Pedro | 20 |  |
| 10:05 | Basílica de San Pedro | 5 | de camino (la fachada) |
| 10:15 | Via della Conciliazione | 10 | de camino |
| 10:45 | Castillo de Sant'Angelo | 15 | por fuera |
| 11:05 | Puente Sant'Angelo | 5 | de camino |
| 11:30 | Piazza Navona | 25 |  |
| 12:10 | Panteón | 15 | por fuera |
| 12:40 | **Comida:** Armando al Pantheon (o Supplizio; si cierran los dos, Piccolo Arancio) | 60 |  |
| 14:00 | Fontana de Trevi | 20 |  |
| 14:30 | Piazza Venezia | 5 | de camino |
| 14:40 | Altar de la Patria | 5 | de camino |
| 14:50 | Plaza del Campidoglio | 5 | de camino |
| 15:10 | El Foro Romano, desde la terraza del Campidoglio | 15 | por fuera |
| 15:30 | Via dei Fori Imperiali | 10 | de camino |
| 15:55 | Coliseo | 15 | por fuera |
| 16:15 | Arco de Constantino | 5 | de camino |

**Ruta del revés: con reserva en el Coliseo por la mañana**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 10:00 | Coliseo | 60 | por dentro (reserva) |
| 11:20 | Arco de Constantino | 10 |  |
| 11:35 | Via dei Fori Imperiali | 15 | de camino |
| 12:00 | Piazza Venezia | 5 | de camino |
| 12:10 | Altar de la Patria | 5 | de camino |
| 12:35 | Fontana de Trevi | 20 |  |
| 13:15 | **Comida:** Armando al Pantheon (o Supplizio; si cierran los dos, Piccolo Arancio) | 45 |  |
| 14:15 | Panteón | 15 | por fuera |
| 14:45 | Piazza Navona | 20 |  |
| 15:15 | Puente Sant'Angelo | 5 | de camino |
| 15:25 | Castillo de Sant'Angelo | 5 | de camino |
| 15:55 | Plaza de San Pedro | 15 |  |
| 16:10 | Basílica de San Pedro | 10 | de camino (la fachada) |

**Lo que hará el motor**
- Sin reserva, nada por dentro (aunque el viajero marque algo en el pool).
- Con reserva: esa visita va a su hora y por dentro. Museos Vaticanos o Coliseo por la tarde → ruta normal. Coliseo por la mañana → ruta del revés.
- Si no cabe todo, se quita por este orden: 1) Via dei Fori Imperiali, 2) Via della Conciliazione, 3) el Foro desde el Campidoglio, 4) Plaza del Campidoglio, 5) el Altar de la Patria. Sin pool, nunca se quitan San Pedro, el Panteón, Trevi ni el Coliseo; con pool, el pool manda (regla general, punto 1). (La Plaza de España ya no cabe con los márgenes.)
- Si el viajero cambia el horario, el día empieza y acaba a sus horas.

**Pool:** lo marcado va por dentro y es la prioridad (como una reserva). Para que quepa se quita lo de menos importancia por el orden de arriba; si hace falta, también un imprescindible: el pool manda.
**Experiencias:** solo Mercadillos (8 de diciembre a 6 de enero): «Piazza Navona y su mercadillo navideño», 35 min.
**Free Tour:** no se ofrece.
**Pendiente:** la versión para quien viene 1 día y se va después de las 21:00.

---

## Viaje de 1,5 días · D1-corto + D0-medio

**Todo por fuera, como el viaje de 1 día.** Sin pool ni reserva no se entra en ningún sitio. Con pool o reserva (Coliseo y Foro, o Museos Vaticanos), esa visita va por dentro y es la prioridad.

**1,5 días = un día entero (la Roma antigua, el centro y Trastevere) + medio día del Vaticano.** Si el medio día va primero (se llega a mediodía), el Vaticano es la tarde de llegada; si va al final, es la última mañana.

### Día entero · D1-corto (la Roma antigua, el centro y Trastevere, por fuera)

**Tardes A y B** (día completo)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Coliseo | 20 | por fuera |
| 09:25 | Arco de Constantino | 5 | de camino |
| 09:35 | Via dei Fori Imperiali (con la vista de los Foros) | 15 | de camino |
| 10:05 | Plaza del Campidoglio | 15 |  |
| 10:35 | El Foro Romano, desde la terraza del Campidoglio | 15 | por fuera |
| 10:55 | Piazza Venezia | 5 | de camino |
| 11:15 | Altar de la Patria | 10 | por fuera |
| 11:35 | Teatro de Marcelo | 5 | de camino |
| 12:00 | Boca de la Verdad | 15 |  |
| 12:35 | Isla Tiberina | 20 |  |
| 13:10 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 14:20 | Barrio Judío | 30 |  |
| 14:55 | Fuente de las Tortugas | 5 | de camino |
| 15:05 | Largo di Torre Argentina | 5 | de camino |
| 15:15 | Iglesia del Gesù | 5 | de camino (la fachada) |
| 15:30 | Elefantino de Bernini | 3 | de camino |
| 15:35 | Santa Maria sopra Minerva | 3 | de camino |
| 15:50 | Panteón | 15 | por fuera |
| 16:20 | Piazza Navona | 30 |  |
| 17:10 | Campo de' Fiori | 25 |  |
| 17:50 | Ponte Sisto, al atardecer | 15 |  |
| 18:20 | Pasea y piérdete por Trastevere iluminado (colchón) | 35 |  |
| 19:00 | Santa Maria in Trastevere | 5 | de camino (la plaza y la fachada) |
| 19:45 | **Cena:** Da Enzo al 29 (o Tonnarello), en Trastevere | 90 |  |
| 21:25 | Taxi a Trevi | 10 |  |
| 21:50 | Fontana de Trevi iluminada | 20 | de noche |
| 22:30 | Plaza de España de noche | 20 | de noche |

**Tarde B:** igual que la A hasta Campo de' Fiori; después:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 17:45 | Pasea y piérdete por el Centro Histórico (colchón) | 15 |  |
| 18:15 | Ponte Sisto, al atardecer | 15 |  |
| 18:45 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 19:20 | Santa Maria in Trastevere | 5 | de camino (la plaza y la fachada) |
| 20:00 | **Cena:** Da Enzo al 29 (o Tonnarello), en Trastevere | 90 |  |
| 21:40 | Taxi a Trevi | 10 |  |
| 22:05 | Fontana de Trevi iluminada | 20 | de noche |
| 22:45 | Plaza de España de noche | 20 | de noche |

**Tarde C** (desde Campo de' Fiori)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 17:10 | Campo de' Fiori | 25 |  |
| 17:40 | Ponte Sisto | 5 | de camino |
| 17:55 | Santa Maria in Trastevere | 5 | de camino (la plaza y la fachada) |
| 18:15 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 18:35 | Fontana dell'Acqua Paola | 10 |  |
| 19:05 | Mirador del Janículo, al atardecer | 30 |  |
| 20:30 | **Cena:** Da Enzo al 29 (o Tonnarello), en Trastevere | 90 |  |
| 22:10 | Taxi a Trevi | 10 |  |
| 22:35 | Fontana de Trevi iluminada | 20 | de noche |

**Tarde D** (desde Campo de' Fiori)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 17:10 | Campo de' Fiori | 25 |  |
| 17:40 | Ponte Sisto | 5 | de camino |
| 18:00 | Pasea y piérdete por Trastevere | 45 |  |
| 18:50 | Santa Maria in Trastevere | 5 | de camino (la plaza y la fachada) |
| 19:10 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 19:30 | Fontana dell'Acqua Paola | 10 |  |
| 20:00 | Mirador del Janículo, al atardecer | 30 |  |
| 21:15 | **Cena:** Da Enzo al 29 (o Tonnarello), en Trastevere | 90 |  |

En la tarde D no hay nocturna: la cena acaba tarde. Trevi y la Plaza de España se ven de día en el medio día del Vaticano por la mañana; si el medio día es por la tarde, su nocturna es Trevi (ver abajo).

**Con el Coliseo en el pool o con reserva:** la mañana es la del Día de la Roma antigua (Coliseo a su hora, Arco, Foro y Palatino por dentro, Campidoglio, Piazza Venezia y Altar por fuera) y la comida en el Barrio Judío; la Boca de la Verdad y la Isla Tiberina se quitan, y la tarde sigue igual con las horas corridas por los márgenes.

### Medio día del Vaticano · D0-medio (por fuera)

**Por la mañana** (se vuelve después de comer; acaba a las 15:00 por defecto)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:30 | Plaza de San Pedro | 20 |  |
| 09:50 | Basílica de San Pedro | 5 | de camino (la fachada) |
| 10:10 | Pasea y piérdete por Borgo Pio | 20 |  |
| 10:35 | Via della Conciliazione | 10 | de camino |
| 11:05 | Castillo de Sant'Angelo | 15 | por fuera |
| 11:25 | Puente Sant'Angelo | 5 | de camino |
| 11:35 | Via dei Coronari | 10 | de camino |
| 12:10 | Fontana de Trevi | 20 |  |
| 12:50 | Plaza de España | 20 |  |
| 13:25 | **Comida:** Poldo e Gianna Osteria (o Edy), en el Tridente | 60 |  |

**Por la tarde, A y B**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Plaza de San Pedro | 20 |  |
| 15:20 | Basílica de San Pedro | 5 | de camino (la fachada) |
| 15:40 | Pasea y piérdete por Borgo Pio | 25 |  |
| 16:10 | Via della Conciliazione | 10 | de camino |
| 16:40 | Castillo de Sant'Angelo | 15 | por fuera |
| 17:10 | Puente Sant'Angelo, al atardecer | 15 |  |
| 17:45 | Pasea y piérdete por Prati (colchón) | 45 |  |
| 19:30 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 21:30 | Piazza Navona de noche | 30 | de noche |

**Por la tarde, C y D** (empieza a las 16:00, después del check-in)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 16:00 | Plaza de San Pedro | 20 |  |
| 16:20 | Basílica de San Pedro | 5 | de camino (la fachada) |
| 16:40 | Pasea y piérdete por Borgo Pio | 25 |  |
| 17:10 | Via della Conciliazione | 10 | de camino |
| 17:40 | Castillo de Sant'Angelo | 15 | por fuera |
| 18:15 | Pasea y piérdete por Prati (colchón) | 60 |  |
| 19:40 | Puente Sant'Angelo, al atardecer | 20 |  |
| 20:30 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 22:30 | Piazza Navona de noche | 20 | de noche |

**Nocturna del medio día de tarde:** si Trevi no ha salido de noche en el día entero (tarde D), la nocturna es «Fontana de Trevi iluminada» (taxi desde la cena) en lugar de Piazza Navona.

### Con reserva de los Museos Vaticanos

Si el viajero marca los Museos en el pool o los tiene reservados, el medio día lleva los Museos y la Basílica por dentro:

Por la mañana (reserva a las 8:00):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:30 | Plaza de San Pedro | 20 |  |
| 12:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 13:40 | **Comida:** Borghiciana (o Dal Toscano), en el Borgo | 60 |  |
| 14:45 | Via della Conciliazione | 5 | de camino |
| 15:00 | Castillo de Sant'Angelo | 5 | de camino |
| 15:10 | Puente Sant'Angelo | 5 | de camino |

Por la tarde (reserva a las 16:00):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:45 | Plaza de San Pedro | 15 |  |
| 14:15 | Basílica de San Pedro (con el control) | 60 | por dentro |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 150 | por dentro (turno de las 16:00) |
| 18:50 | Pasea y piérdete por Prati (colchón) | 20 |  |
| 19:30 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 21:25 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | de noche |

Con otra hora de reserva, el motor corre las horas con los márgenes.

**Lo que hará el motor**
- Elegir mañana o tarde según el viaje, y con o sin Museos según la reserva.
- Sin pool ni reserva, los Museos no salen (regla general, punto 4).
- Miércoles por la mañana (audiencia): la Plaza de San Pedro está ocupada hasta mediodía; la mañana empieza en el Castillo y el Puente, y la Plaza y la Basílica (por fuera) van al final, si da tiempo antes de irse.
- Si algo cierra: la regla de cierres.

**Pool:** lo marcado en el pool va por dentro y es la prioridad (como en el viaje de 1 día): los Museos con las tablas «con Museos», el Coliseo y el Foro con la mañana del D1. Para que quepa se quita lo de menos importancia; si hace falta, también un imprescindible: el pool manda.
**Experiencias:** solo Mercadillos (8 de diciembre a 6 de enero): «Piazza Navona y su mercadillo navideño» (40 min) y «Plaza de San Pedro y los 100 Presepi» (35 min).
**Free Tour:** no se ofrece.

---

## Día de la Roma antigua · D1

**Mañana (igual todo el año)**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Coliseo | 75 | por dentro (turno) |
| 10:05 | Arco de Constantino | 10 |  |
| 10:30 | Foro Romano y Palatino | 90 | por dentro |
| 12:20 | Plaza del Campidoglio | 15 |  |
| 12:40 | Piazza Venezia | 5 | de camino |
| 13:00 | Altar de la Patria | 30 | por dentro |
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |

**Tarde A y B** (iguales a propósito: esta tarde no depende del sol). San Luigi va antes que el Panteón (se vuelven 250 m) porque cierra a las 18:15; Campo de' Fiori no sale en A y B (era una ida y vuelta desde Navona).

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 30 |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |
| 15:55 | Largo di Torre Argentina | 15 |  |
| 16:25 | Iglesia del Gesù (abre a las 16:00) | 20 | por dentro |
| 16:55 | Elefantino de Bernini | 5 | de camino |
| 17:00 | Santa Maria sopra Minerva | 5 | de camino |
| 17:20 | San Luigi dei Francesi (cierra a las 18:15) | 20 | por dentro |
| 17:55 | Panteón | 40 | por dentro |
| 18:50 | Piazza Navona | 45 |  |
| 20:00 | **Cena:** Armando al Pantheon (o Da Baffetto) | 90 |  |
| 21:50 | Fontana de Trevi iluminada | 20 | de noche |
| 22:30 | Plaza de España de noche | 20 | de noche |

**Tarde C:** igual que la A y la B. El sol se pone mientras estás en Piazza Navona (18:50-19:35): el atardecer se ve en la plaza, sin ir a ningún puente.

**Tarde D** (el sol se pone después de las 19:45). Igual que la A y la B hasta el Panteón; luego Navona, Campo de' Fiori y el Ponte Sisto al atardecer, y se cruza el puente para cenar en Trastevere (sin volver atrás).

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 30 |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |
| 15:55 | Largo di Torre Argentina | 15 |  |
| 16:25 | Iglesia del Gesù (abre a las 16:00) | 20 | por dentro |
| 16:55 | Elefantino de Bernini | 5 | de camino |
| 17:00 | Santa Maria sopra Minerva | 5 | de camino |
| 17:20 | San Luigi dei Francesi (cierra a las 18:15) | 20 | por dentro |
| 17:55 | Panteón | 40 | por dentro |
| 18:50 | Piazza Navona | 30 |  |
| 19:40 | Campo de' Fiori | 20 |  |
| 20:15 | Ponte Sisto, al atardecer | 25 |  |
| 21:00 | **Cena:** Da Enzo al 29 (o Tonnarello), en Trastevere | 90 |  |
| 22:40 | Taxi a Trevi | 15 |  |
| 23:05 | Fontana de Trevi iluminada | 20 | de noche |

**Nocturna de la tarde D:** en taxi desde Trastevere. Si la Fontana de Trevi todavía no ha salido en el viaje, Trevi (es imprescindible). Si ya salió, el Coliseo iluminado (taxi al Coliseo, 15 min), si no ha salido de noche. Si los dos ya salieron, Trastevere de noche (ya estás allí). Cabe siempre: en la versión D la noche se alarga hasta las 23:45.

**Lo que hará el motor**
- Sábado: el Panteón cierra a las 17:00 por la misa → se adelanta, antes del Gesù.
- Domingo o festivo: si una iglesia cierra, se acorta o va por fuera.
- Coliseo cerrado (1 de enero, 25 de diciembre): por fuera.
- Entrada al Coliseo por la tarde: se mantiene la variante que ya hay (`entrada:tarde`) hasta que la escribamos en este formato.

### Pool (solo si el viaje no tiene el día propio del extra; las horas salen de los márgenes)
1. **Museos Capitolinos** (si no hay D5): después del Campidoglio, 75 min por dentro; el Altar pasa a «de camino»; por la tarde el Barrio Judío baja a 20 min y San Luigi va por fuera si no llega antes de las 18:00.
2. **Termas de Caracalla** (si no hay D5 ni D5C): taxi después de comer, Termas 60 min, taxi al Gesù; se quitan el Barrio Judío, la Fuente de las Tortugas y Largo di Torre Argentina.
3. **Galería Borghese** (solo si el viajero la marca en el pool; si no, va a «No incluido»). Turno de las 17:00 (reserva). Sustituye la tarde desde la comida; se pierden el Barrio Judío, el Gesù, San Luigi y Campo de' Fiori. Tardes A, B y C:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 45 | |
| 14:45 | Largo di Torre Argentina | 5 | de camino |
| 15:05 | Panteón | 25 | por dentro |
| 15:35 | Piazza Navona | 5 | de camino |
| 15:55 | Taxi a la Galería Borghese | 20 | |
| 16:30 | Galería Borghese: llegada con la reserva | | |
| 17:00 | Galería Borghese | 120 | por dentro (reserva) |
| 19:35 | Terraza del Pincio | 20 | al atardecer en C; iluminada en A y B |
| 20:15 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 | |
| 22:00 | Fontana de Trevi iluminada | 20 | de noche |
| 22:40 | Plaza de España de noche | 20 | de noche |

   Tarde D: igual, con la cena a las 20:30 y solo Trevi de noche (la Plaza de España pasaría de las 23:00).
4. **Boca de la Verdad:** después del Barrio Judío, 15 min; el resto igual (el colchón se acorta).
5. **Ojo de la Cerradura del Aventino** (va con la Boca de la Verdad). El Gesù y San Luigi pasan a «de camino» (la fachada) y se quita Campo de' Fiori. Tardes A y B (en C y D, igual con la cena y la noche de su versión):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 20 |  |
| 15:25 | Teatro de Marcelo | 5 | de camino |
| 15:45 | Boca de la Verdad | 15 |  |
| 16:10 | Jardín de los Naranjos | 10 | de camino |
| 16:35 | Ojo de la Cerradura del Aventino | 10 |  |
| 17:00 | Taxi a Largo di Torre Argentina | 15 |  |
| 17:20 | Iglesia del Gesù | 3 | de camino (la fachada) |
| 17:30 | Elefantino de Bernini | 3 | de camino |
| 17:35 | Santa Maria sopra Minerva | 3 | de camino |
| 17:50 | Panteón | 30 | por dentro |
| 18:25 | San Luigi dei Francesi | 3 | de camino (la fachada) |
| 18:45 | Piazza Navona (colchón) | 30 |  |
| 20:00 | **Cena:** Armando al Pantheon (o Da Baffetto) | 90 |  |
| 21:50 | Fontana de Trevi iluminada | 20 | de noche |
| 22:30 | Plaza de España de noche | 20 | de noche |

6. **San Juan de Letrán a primera hora** (si no hay D4M ni D5C). El Coliseo pasa a las 9:00 y se quita Campo de' Fiori. Tardes A y B (en C y D, igual con la cena y la noche de su versión):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Basílica de San Juan de Letrán | 25 | por dentro |
| 08:25 | Metro B de San Giovanni a Colosseo | 10 |  |
| 09:00 | Coliseo | 75 | por dentro (turno) |
| 10:35 | Arco de Constantino | 10 |  |
| 11:00 | Foro Romano y Palatino | 90 | por dentro |
| 12:50 | Plaza del Campidoglio | 15 |  |
| 13:10 | Piazza Venezia | 5 | de camino |
| 13:30 | Altar de la Patria | 30 | por dentro |
| 14:20 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:30 | Barrio Judío | 30 |  |
| 16:05 | Fuente de las Tortugas | 5 | de camino |
| 16:15 | Largo di Torre Argentina | 5 | de camino |
| 16:35 | Iglesia del Gesù | 20 | por dentro |
| 17:05 | Elefantino de Bernini | 3 | de camino |
| 17:10 | Santa Maria sopra Minerva | 5 | de camino |
| 17:30 | Panteón | 30 | por dentro |
| 18:15 | San Luigi dei Francesi | 20 | por dentro |
| 18:50 | Piazza Navona | 30 |  |
| 20:00 | **Cena:** Armando al Pantheon (o Da Baffetto) | 90 |  |
| 21:50 | Fontana de Trevi iluminada | 20 | de noche |
| 22:30 | Plaza de España de noche | 20 | de noche |

   Si San Luigi no llega con 20 min antes de su cierre (18:30), va de camino.

7. **Parque de Villa Borghese** (solo en las tardes C y D, con luz; en A y B no entra). Se quitan San Luigi, Campo de' Fiori y el Ponte Sisto; Piazza Navona va de camino:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 30 |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |
| 15:45 | Largo di Torre Argentina | 5 | de camino |
| 16:05 | Iglesia del Gesù | 20 | por dentro |
| 16:35 | Elefantino de Bernini | 3 | de camino |
| 16:40 | Santa Maria sopra Minerva | 5 | de camino |
| 17:00 | Panteón | 30 | por dentro |
| 17:35 | Piazza Navona | 5 | de camino |
| 17:55 | Taxi a Villa Borghese | 15 |  |
| 18:25 | Parque de Villa Borghese (el lago) | 45 |  |
| 19:30 | Terraza del Pincio, al atardecer | 25 |  |
| 20:15 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 22:10 | Fontana de Trevi iluminada | 20 | de noche |
| 22:50 | Plaza de España de noche | 20 | de noche |

**Dos extras a la vez:** un extra por media jornada; si no caben, el segundo va a su otro sitio o a «No incluido». Manda el orden en que los marcó el viajero.

### Experiencias
- **Arte y Museos:** los Museos Capitolinos (como el extra 1).
- **Barrios y Sabores:** Barrio Judío 45 min; el colchón se acorta lo mismo.
- **Naturaleza y Vistas:** el ascensor panorámico del Altar (terraza de las Cuadrigas): el Altar pasa de 30 a 60 min.
- **Mercadillos (8 de diciembre a 6 de enero):** «Piazza Navona y su mercadillo navideño», 40 min; el Santo Bambino de Aracoeli de camino entre el Campidoglio y Piazza Venezia.

### Free Tour
- **De mañana:** el viaje usa los días del Free Tour (D3 y D1-FT).
- **De tarde (17:00) y de noche (18:30):** ver «Variantes con horas».

---

## Día del Vaticano y Trastevere · D2

**Museos Vaticanos:** van **siempre** desde 2 días, a las 8:00, en este día con su grupo (la Plaza y la Basílica). La versión «sin Museos» solo se usa cuando cierran (domingo) o en fechas especiales.

**Tarde A** (con la mañana; en A la comida dura 75 min)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:30 | Plaza de San Pedro | 20 |  |
| 12:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 13:40 | **Comida:** Borghiciana (o Dal Toscano), en el Borgo | 75 |  |
| 15:00 | Via della Conciliazione | 10 | de camino |
| 15:30 | Castillo de Sant'Angelo | 20 | por fuera |
| 16:05 | Puente Sant'Angelo | 15 |  |
| 16:35 | Bus 23 por el Lungotevere hasta la Isla Tiberina (parada Lungotevere dei Cenci) | 20 |  |
| 17:05 | Isla Tiberina | 20 |  |
| 17:45 | Santa Maria in Trastevere | 25 | por dentro |
| 18:20 | Pasea y piérdete por Trastevere iluminado (colchón) | 80 |  |
| 20:00 | **Cena:** Tonnarello, en Trastevere | 90 |  |
| 22:00 | Piazza Navona de noche | 30 | de noche |

En invierno no da tiempo a llegar al Janículo con luz: Trastevere se pasea ya iluminado. El bus deja junto a la Isla Tiberina y se cruza a Trastevere por el Ponte Cestio: sin ir y volver.

**Tarde B** (la mañana es igual, con la comida de 60 min)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:50 | Puente Sant'Angelo | 15 |  |
| 16:20 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 16:55 | Santa Maria in Trastevere | 25 | por dentro |
| 17:35 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 17:55 | Fontana dell'Acqua Paola | 10 |  |
| 18:25 | Mirador del Janículo, al atardecer | 30 |  |
| 19:20 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:15 | **Cena:** Tonnarello | 90 |  |
| 21:55 | Trastevere de noche | 30 | de noche |

**Tarde C**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:50 | Puente Sant'Angelo | 15 |  |
| 16:20 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 16:55 | Santa Maria in Trastevere | 25 | por dentro |
| 17:30 | Pasea y piérdete por Trastevere (colchón) | 40 |  |
| 18:25 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 18:45 | Fontana dell'Acqua Paola | 10 |  |
| 19:15 | Mirador del Janículo, al atardecer | 30 |  |
| 20:30 | **Cena:** Tonnarello | 90 |  |
| 22:10 | Trastevere de noche | 30 | de noche |

**Tarde D**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:50 | Puente Sant'Angelo | 15 |  |
| 16:20 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 16:55 | Santa Maria in Trastevere | 25 | por dentro |
| 17:30 | Pasea y piérdete por Trastevere | 60 |  |
| 18:45 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 19:05 | Fontana dell'Acqua Paola | 10 |  |
| 19:25 | La Passeggiata del Gianicolo (colchón) | 15 |  |
| 20:00 | Mirador del Janículo, al atardecer | 30 |  |
| 21:00 | **Cena:** Tonnarello | 90 |  |
| 22:40 | Trastevere de noche | 30 | de noche |

En B, C y D el Tempietto va de camino (por fuera) y la Isla Tiberina se queda fuera: no caben con los márgenes. En B, C y D, la nocturna es **Trastevere de noche**, sin taxi (en A se queda Piazza Navona: en invierno Trastevere ya se pasea de noche antes de cenar): ya estás allí y el barrio de noche es otro (texto: «Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado.»). Acaba a las 23:10 (en la versión D la noche se alarga). Si la Plaza de España no ha salido en el viaje, manda la regla de la Plaza de España.

**Miércoles, domingo y reservas de los Museos:** ver «Variantes con horas».

**Lo que hará el motor**
- Elegir la versión según la fecha y la hora de la reserva, y correr las horas con los márgenes.
- Lunes: el Tempietto va por fuera.
- Si algo cierra: adelantar, acortar (mínimo 20 min), por fuera o quitar.

### Pool
- **Cúpula de San Pedro:** 45 min después de la Basílica; la tarde empieza 55 min más tarde y pierde lo que no quepa por el orden de siempre.
- **Castillo de Sant'Angelo por dentro:** 60 min (con la terraza) en vez de 20 por fuera.
- **Boca de la Verdad, Ojo de la Cerradura y Trastevere:** ya no tienen sitio en este día (quitar de `_destino.json`).

### Experiencias
- **Arte y Museos:** Museos 240 min (con la Pinacoteca).
- **Barrios y Sabores:** Pasea y piérdete por Borgo Pio, 30 min antes de comer.
- **Naturaleza y Vistas:** la Cúpula entra siempre.
- **Mercadillos (8 de diciembre a 6 de enero):** «Plaza de San Pedro y los 100 Presepi», 40 min.

### Free Tour
No le afecta: con Free Tour, el Vaticano va por la tarde del D3.

---

## Día del Free Tour y el Vaticano por la tarde · D3

El tour sale a las 10:00 de la Plaza de España y acaba en Piazza Navona (pasa por Via Condotti, Trevi, Sant'Ignazio y el Panteón, por fuera). El Panteón por dentro va antes del tour, a las 9:00, con el desayuno enfrente.

**A y B** (en invierno la Basílica cierra antes: va antes de los Museos, y la Plaza se ve después, ya iluminada)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Fontana de Trevi, sin gente | 20 |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 |  |
| 09:00 | Panteón (abre a las 9:00) | 20 | por dentro |
| 10:00 | **Free Tour Centro Histórico** (sale de la Plaza de España, acaba en Navona) | 150 | con guía |
| 12:50 | **Comida:** Armando al Pantheon (o Supplizio; si cierran los dos, Piccolo Arancio) | 45 |  |
| 13:50 | Bus 40 o taxi al Vaticano | 25 |  |
| 14:30 | Basílica de San Pedro (con el control; se cruza la Plaza) | 45 | por dentro |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 150 | por dentro (turno de las 16:00) |
| 19:00 | Plaza de San Pedro, ya iluminada (colchón) | 20 |  |
| 19:45 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 21:40 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | de noche |

**C y D** (la Basílica cierra a las 20:00: va después de los Museos)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | Bus 40 o taxi al Vaticano | 25 |  |
| 15:00 | Museos Vaticanos y Capilla Sixtina | 150 | por dentro (turno de las 15:00) |
| 18:00 | Plaza de San Pedro | 10 |  |
| 18:25 | Basílica de San Pedro (con el control; cierra a las 20:00) | 45 | por dentro |
| 19:15 | Via della Conciliazione | 10 | de camino |
| 19:45 | Castillo de Sant'Angelo | 10 | por fuera |
| 20:10 | Puente Sant'Angelo, al atardecer | 15 |  |
| 20:45 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 22:45 | Piazza Navona de noche | 15 | de noche |

**Domingo:** ver «Variantes con horas».

**Lo que hará el motor**
- Poner este día en una fecha en que haya tour (está en los datos).
- Si un restaurante cierra ese día, su alternativa.

**Pool:** la Cúpula y el Castillo por dentro no caben: van a «No incluido» (o a otro día si el viaje es más largo).
**Experiencias:** Mercadillos: «Plaza de San Pedro y los 100 Presepi» (+15 min) y, al acabar el tour, «Piazza Navona y su mercadillo navideño» (+15 min, la comida empieza más tarde). Barrios y Sabores: Pasea y piérdete por Prati con Via Cola di Rienzo. Arte y Museos y Naturaleza y Vistas van en el D1-FT.

---

## Día de la Roma antigua, el Gueto y Trastevere · D1-FT

**Tarde A** (con la mañana, igual que la del Día de la Roma antigua)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Coliseo | 75 | por dentro (turno) |
| 10:05 | Arco de Constantino | 10 |  |
| 10:30 | Foro Romano y Palatino | 90 | por dentro |
| 12:20 | Plaza del Campidoglio | 15 |  |
| 12:40 | Piazza Venezia | 5 | de camino |
| 13:00 | Altar de la Patria | 30 | por dentro |
| 13:50 | **Comida:** Giggetto al Portico d'Ottavia (o Nonna Betta) | 60 |  |
| 15:00 | Barrio Judío | 25 |  |
| 15:30 | Fuente de las Tortugas | 5 | de camino |
| 15:40 | Teatro de Marcelo | 5 | de camino |
| 16:00 | Isla Tiberina | 20 |  |
| 16:40 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 17:00 | Fontana dell'Acqua Paola | 10 |  |
| 17:30 | Mirador del Janículo, al atardecer | 30 |  |
| 18:25 | Santa Maria in Trastevere | 20 | por dentro |
| 18:55 | Pasea y piérdete por Trastevere iluminado (colchón) | 35 |  |
| 19:45 | **Cena:** Da Enzo al 29 (o Tonnarello) | 90 |  |
| 21:25 | Taxi a Trevi | 10 |  |
| 21:50 | Fontana de Trevi iluminada | 20 | de noche |
| 22:30 | Plaza de España de noche | 20 | de noche |

**Tarde B** (hasta el Teatro de Marcelo y la Isla Tiberina, igual que la A)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 16:40 | Santa Maria in Trastevere | 20 | por dentro |
| 17:15 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 17:35 | Fontana dell'Acqua Paola | 10 |  |
| 18:05 | Mirador del Janículo, al atardecer | 30 |  |
| 19:00 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:15 | **Cena:** Da Enzo al 29 (o Tonnarello) | 90 |  |
| 21:55 | Taxi a Trevi | 10 |  |
| 22:20 | Fontana de Trevi iluminada | 20 | de noche |

**Tarde C**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 16:40 | Santa Maria in Trastevere | 20 | por dentro |
| 17:10 | Pasea y piérdete por Trastevere (colchón) | 60 |  |
| 18:25 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 18:45 | Fontana dell'Acqua Paola | 10 |  |
| 19:15 | Mirador del Janículo, al atardecer | 30 |  |
| 20:15 | **Cena:** Da Enzo al 29 (o Tonnarello) | 90 |  |
| 21:55 | Taxi a Trevi | 10 |  |
| 22:20 | Fontana de Trevi iluminada | 20 | de noche |

**Tarde D**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 16:40 | Santa Maria in Trastevere | 20 | por dentro |
| 17:10 | Pasea y piérdete por Trastevere | 60 |  |
| 18:35 | San Pietro in Montorio y el Tempietto | 20 | por dentro |
| 19:10 | Fontana dell'Acqua Paola | 10 |  |
| 19:30 | La Passeggiata del Gianicolo (colchón) | 15 |  |
| 20:05 | Mirador del Janículo, al atardecer | 30 |  |
| 21:15 | **Cena:** Da Enzo al 29 (o Tonnarello) | 90 |  |
| 22:55 | Taxi a Trevi | 10 |  |
| 23:20 | Fontana de Trevi iluminada | 15 | de noche |

La nocturna es Trevi, en taxi: en un viaje con Free Tour es la única vez que sale de noche. En D, Trevi a las 23:20 (en la versión D la noche se alarga).

**Lo que hará el motor**
- Lunes: el Tempietto por fuera.
- Primer domingo del mes (Coliseo gratis) y 25 de diciembre (cerrado): regla de cierres y horario oficial de ese día.

**Pool:**
- **Boca de la Verdad:** después del Teatro de Marcelo, 15 min, antes de la Isla Tiberina; el colchón de Trastevere se acorta.
- **Ojo de la Cerradura** (con la Boca); se quitan la Isla Tiberina y el Tempietto. Tarde A (en B, C y D, igual con la cena y la noche de su versión):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Giggetto al Portico d'Ottavia (o Nonna Betta) | 60 |  |
| 15:00 | Barrio Judío | 20 |  |
| 15:25 | Fuente de las Tortugas | 3 | de camino |
| 15:35 | Teatro de Marcelo | 5 | de camino |
| 15:55 | Boca de la Verdad | 15 |  |
| 16:20 | Jardín de los Naranjos | 10 | de camino |
| 16:45 | Ojo de la Cerradura del Aventino | 10 |  |
| 17:10 | Taxi al Janículo (Fontana dell'Acqua Paola) | 15 |  |
| 17:45 | Mirador del Janículo, al atardecer | 30 |  |
| 18:40 | Santa Maria in Trastevere | 20 | por dentro |
| 19:10 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:00 | **Cena:** Da Enzo al 29 (o Tonnarello) | 90 |  |
| 21:40 | Taxi a Trevi | 10 |  |
| 22:05 | Fontana de Trevi iluminada | 20 | de noche |
| 22:45 | Plaza de España de noche | 20 | de noche |

- **San Juan de Letrán a primera hora:** el Coliseo pasa a las 9:00. Tarde A:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Basílica de San Juan de Letrán | 25 | por dentro |
| 08:25 | Metro B de San Giovanni a Colosseo | 10 |  |
| 09:00 | Coliseo | 75 | por dentro (turno) |
| 10:35 | Arco de Constantino | 10 |  |
| 11:00 | Foro Romano y Palatino | 90 | por dentro |
| 12:50 | Plaza del Campidoglio | 15 |  |
| 13:10 | Piazza Venezia | 5 | de camino |
| 13:30 | Altar de la Patria | 30 | por dentro |
| 14:20 | **Comida:** Giggetto al Portico d'Ottavia (o Nonna Betta) | 60 |  |
| 15:30 | Barrio Judío | 25 |  |
| 16:00 | Fuente de las Tortugas | 5 | de camino |
| 16:10 | Teatro de Marcelo | 5 | de camino |
| 16:30 | Isla Tiberina | 20 |  |
| 17:10 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 17:30 | Fontana dell'Acqua Paola | 10 |  |
| 18:00 | Mirador del Janículo, al atardecer | 30 |  |
| 18:55 | Santa Maria in Trastevere | 20 | por dentro |
| 19:25 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:15 | **Cena:** Da Enzo al 29 (o Tonnarello) | 90 |  |
| 21:55 | Taxi a Trevi | 10 |  |
| 22:20 | Fontana de Trevi iluminada | 20 | de noche |
| 22:50 | Plaza de España de noche | 5 | de camino |

- **Museos Capitolinos:** al salir del Foro, como en el D1 (el Altar pasa a «de camino»).
- **Termas de Caracalla:** taxi después de comer, Termas 60 min, taxi a la Isla Tiberina; se quita el Barrio Judío.
- **Galería Borghese** (solo si se marca; turno de las 17:00). Sustituye la tarde de Trastevere; Trastevere se ve de noche:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Giggetto al Portico d'Ottavia (o Nonna Betta) | 45 |  |
| 14:45 | Barrio Judío | 20 |  |
| 15:10 | Fuente de las Tortugas | 3 | de camino |
| 15:30 | Taxi a la Galería Borghese (desde Largo di Torre Argentina) | 20 |  |
| 17:00 | Galería Borghese | 120 | por dentro (reserva) |
| 19:35 | Terraza del Pincio | 20 |  |
| 20:15 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 21:55 | Taxi a Trastevere | 15 |  |
| 22:25 | Trastevere de noche | 40 | de noche |

**Experiencias (D1-FT):** Arte y Museos: los Capitolinos. Naturaleza y Vistas: el ascensor del Altar (el Altar pasa de 30 a 60 min). Barrios y Sabores: el Barrio Judío pasa de 25 a 45 min y el colchón de Trastevere se acorta 20 min (si no queda colchón, se quita la Isla Tiberina). Mercadillos: el Santo Bambino de Aracoeli de camino.

---

## Viaje de 2,5 días · los 2 días enteros + DT-medio (o DM-medio)

Dos días enteros y medio día. Los días enteros son los del viaje de 2 días (D1 + D2; con Free Tour de mañana, D3 + D1-FT), con su cambio de orden, su pool y sus fechas. El medio día es de tarde (el día que llegan) o de mañana (el día que se van), según el formulario (`mediaJornada`); solo hay uno, así que los dos medios días son de la misma zona.

- **Sin Free Tour de mañana:** el medio día es el **del Tridente y el Pincio (DT-medio)**, de mañana o de tarde.
- **Con Free Tour de mañana:** el tour ya pasa por la Plaza de España, Via Condotti y Trevi, y Trevi madrugando sale en el D3. Por eso:
  - de mañana, el medio día es el **de Monti (DM-medio)**;
  - de tarde, el DT-medio, con la Plaza de España de camino (5 min) en vez de 20.
- Las dos iglesias (Santa Maria del Popolo, por los Caravaggio, y Trinità dei Monti) van **por dentro** si caben.

### Medio día del Tridente y el Pincio · DT-medio

**Qué hay en el paseo por Villa Borghese** (el texto de esa parada lo tiene que contar, para que el viajero entienda por qué son 60-90 min). Recorrido en círculo desde Santa Maria del Popolo, que acaba en la terraza del Pincio a la hora del sol:
- subir por la rampa del Pincio a los jardines, con los bustos de italianos ilustres;
- el **reloj de agua** del Pincio (un hidrocronómetro del siglo XIX, en el Viale dell'Orologio);
- el **lago con el Templo de Esculapio**, donde se alquilan **barcas de remos** (unos 20 min);
- la **Fontana dei Cavalli Marini** y la **Piazza di Siena**, entre pinos;
- si sobra tiempo: alquilar una bici o un *risciò* (cuatriciclo) para dar la vuelta al parque;
- vuelta por el Viale delle Magnolie a la terraza del Pincio, para el atardecer.

**Regla del colchón:** ver «Qué hay en cada colchón», en «Márgenes».

**Por la mañana**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Fontana de Trevi, sin gente | 20 |  |
| 08:25 | Desayuno cerca de la Plaza de España | 30 |  |
| 09:10 | Plaza de España | 20 |  |
| 09:35 | Via del Babuino y Via Margutta | 10 | de camino |
| 10:00 | Piazza del Popolo | 20 |  |
| 10:35 | Santa Maria del Popolo (los Caravaggio) | 20 | por dentro |
| 11:15 | Terraza del Pincio (la vista de San Pedro con la luz de la mañana) | 20 |  |
| 11:45 | Pasea y piérdete por los Jardines del Pincio (colchón) | 20 |  |
| 12:25 | Trinità dei Monti y su mirador sobre la Plaza de España | 15 | por dentro |
| 12:45 | Bajar la escalinata de la Plaza de España | 5 | de camino |
| 12:50 | Via Condotti | 10 | de camino |
| 13:15 | **Comida:** Poldo e Gianna Osteria (o Edy), en el Tridente | 60 |  |

Santa Maria del Popolo, a las 10:30 o después: de 9:45 a 10:30 no se visita (misa). Por eso el desayuno va antes de la Plaza de España.

**Por la tarde, A** (con la puesta de sol de 17:15 a 17:40)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Plaza de España | 20 |  |
| 15:30 | Via del Babuino y Via Margutta | 10 | de camino |
| 15:55 | Piazza del Popolo | 15 |  |
| 16:25 | Santa Maria del Popolo (los Caravaggio) | 20 | por dentro |
| 17:05 | Terraza del Pincio, al atardecer | 30 |  |
| 17:55 | Trinità dei Monti y su mirador sobre la Plaza de España | 15 | por dentro |
| 18:15 | Bajar la escalinata de la Plaza de España | 5 | de camino |
| 18:30 | Pasea y piérdete por Via Condotti y el Tridente iluminados (colchón) | 45 |  |
| 19:30 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 21:10 | Taxi al Coliseo | 10 |  |
| 21:30 | Coliseo iluminado | 20 | de noche |

**Por la tarde, A de invierno** (con la puesta de sol antes de las 17:15; la A normal, de 17:15 a 17:40). Santa Maria del Popolo abre a las 16:00 y cierra a las 18:00: con el sol tan pronto, el Pincio va antes, luego la iglesia y después la plaza, ya iluminada.

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Plaza de España | 20 |  |
| 15:35 | Trinità dei Monti y su mirador sobre la Plaza de España (subiendo la escalinata) | 15 | por dentro |
| 16:15 | Terraza del Pincio, al atardecer | 30 |  |
| 17:05 | Santa Maria del Popolo (los Caravaggio) | 20 | por dentro |
| 17:40 | Piazza del Popolo | 20 |  |
| 18:05 | Via del Babuino y Via Margutta | 10 | de camino |
| 18:25 | Pasea y piérdete por Via Condotti y el Tridente iluminados (colchón) | 40 |  |
| 19:20 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 21:00 | Taxi al Coliseo | 10 |  |
| 21:20 | Coliseo iluminado | 20 | de noche |

Con la puesta de sol más tarde (hasta las 17:15), el motor mete «Pasea y piérdete por los Jardines del Pincio (colchón)» entre Trinità y el Pincio, corre el resto y acorta el colchón del Tridente (mínimo 30 min); la cena, no antes de las 19:15. Si Santa Maria del Popolo no llega con 20 min antes de las 18:00, se quita.

**Por la tarde, B**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Plaza de España | 20 |  |
| 15:30 | Via del Babuino y Via Margutta | 10 | de camino |
| 15:55 | Piazza del Popolo | 15 |  |
| 16:25 | Santa Maria del Popolo (los Caravaggio) | 20 | por dentro |
| 17:00 | Pasea y piérdete por los Jardines del Pincio (colchón) | 45 |  |
| 18:00 | Terraza del Pincio, al atardecer | 30 |  |
| 18:50 | Trinità dei Monti y su mirador sobre la Plaza de España | 15 | por dentro |
| 19:10 | Bajar la escalinata de la Plaza de España | 5 | de camino |
| 19:25 | Pasea y piérdete por Via Condotti y el Tridente iluminados (colchón) | 20 |  |
| 20:00 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 21:40 | Taxi al Coliseo | 10 |  |
| 22:00 | Coliseo iluminado | 20 | de noche |

**Por la tarde, C**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 16:00 | Plaza de España | 20 |  |
| 16:30 | Via del Babuino y Via Margutta | 10 | de camino |
| 16:55 | Piazza del Popolo | 15 |  |
| 17:25 | Santa Maria del Popolo (los Caravaggio) | 20 | por dentro |
| 18:05 | Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines (colchón) | 60 |  |
| 19:25 | Terraza del Pincio, al atardecer | 30 |  |
| 20:15 | Trinità dei Monti y su mirador sobre la Plaza de España | 10 | por fuera (la iglesia cierra a las 19:45) |
| 20:30 | Bajar la escalinata de la Plaza de España | 5 | de camino |
| 20:50 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 22:30 | Taxi al Coliseo (de mayo a septiembre) | 10 |  |
| 22:50 | Coliseo iluminado (de mayo a septiembre) | 20 | de noche |

**Por la tarde, D**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 16:00 | Plaza de España | 20 |  |
| 16:30 | Via del Babuino y Via Margutta | 10 | de camino |
| 16:55 | Piazza del Popolo | 15 |  |
| 17:25 | Santa Maria del Popolo (los Caravaggio) | 20 | por dentro |
| 18:05 | Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines (colchón) | 90 |  |
| 19:55 | Terraza del Pincio, al atardecer | 30 |  |
| 20:45 | Trinità dei Monti y su mirador sobre la Plaza de España | 10 | por fuera (la iglesia cierra a las 19:45) |
| 21:00 | Bajar la escalinata de la Plaza de España | 5 | de camino |
| 21:20 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 23:00 | Taxi al Coliseo | 10 |  |
| 23:20 | Coliseo iluminado | 20 | de noche |

En C y D, Trinità dei Monti va por fuera (la iglesia cierra a las 19:45), pero es parada: el mirador de arriba de la escalinata, con la Plaza de España a tus pies. En C, la nocturna solo de mayo a septiembre (el resto del año pasaría de las 23:00). En D, el Coliseo iluminado a las 23:20 (la noche se alarga).

**Lo que hará el motor**
- Ajustar «al atardecer» (y el colchón de antes) a la puesta de sol de ese día.
- Si Santa Maria del Popolo o Trinità dei Monti cierran (misa, festivo), la regla de cierres; como son iglesias, si no se puede entrar, no salen.
- Si el viaje lleva Free Tour de mañana: en la tarde, la Plaza de España de camino (5 min) y el tiempo que sobra, al colchón.
- Si un restaurante cierra ese día, su alternativa.
- Si el Coliseo iluminado ya salió de noche en el viaje (Nochebuena, Navidad o Nochevieja), la nocturna es Piazza Navona de noche (taxi).

**Pool** (va por dentro y es la prioridad):
- **Galería Borghese, por la mañana** (turno de las 9:00; lo de nivel 3 y Trinità dei Monti se quitan):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:40 | Fontana de Trevi, sin gente | 20 |  |
| 08:10 | Taxi a la Galería Borghese | 10 |  |
| 09:00 | Galería Borghese | 120 | por dentro (reserva) |
| 11:25 | Pasea por Villa Borghese hasta el Pincio | 20 |  |
| 12:00 | Terraza del Pincio | 20 |  |
| 12:40 | Piazza del Popolo | 15 |  |
| 13:00 | Via del Babuino y Via Margutta | 10 | de camino |
| 13:25 | Plaza de España | 20 |  |
| 14:00 | **Comida:** Poldo e Gianna Osteria (o Edy), en el Tridente | 60 |  |

  Santa Maria del Popolo no sale: a esa hora ya ha cerrado (abre de 10:30 a 12:00).

- **Galería Borghese, por la tarde, A y B** (turno de las 15:00; en A el Pincio ya es de noche):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Galería Borghese | 120 | por dentro (reserva) |
| 17:25 | Pasea por Villa Borghese hasta el Pincio | 20 |  |
| 18:00 | Terraza del Pincio, al atardecer | 30 |  |
| 18:50 | Piazza del Popolo | 15 |  |
| 19:15 | Via Margutta y Via del Babuino | 10 | de camino |
| 19:40 | Plaza de España | 20 |  |
| 20:15 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 21:55 | Taxi al Coliseo | 10 |  |
| 22:15 | Coliseo iluminado | 20 | de noche |

- **Galería Borghese, por la tarde, C y D** (turno de las 15:00):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Galería Borghese | 120 | por dentro (reserva) |
| 17:25 | Pasea y piérdete por Villa Borghese: el lago, el reloj de agua y los jardines (colchón) | 60 |  |
| 18:45 | Terraza del Pincio, al atardecer | 30 |  |
| 19:35 | Piazza del Popolo | 15 |  |
| 20:00 | Via Margutta y Via del Babuino | 10 | de camino |
| 20:25 | Plaza de España | 20 |  |
| 21:00 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |

  Con la Galería, Santa Maria del Popolo y Trinità dei Monti no salen (cierran antes). Sin nocturna en C y D.

- **Parque de Villa Borghese, por la tarde, B** (en C y D ya va como colchón; en A no hay luz):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Plaza de España | 20 |  |
| 15:30 | Via del Babuino y Via Margutta | 10 | de camino |
| 15:55 | Piazza del Popolo | 15 |  |
| 16:25 | Santa Maria del Popolo (los Caravaggio) | 20 | por dentro |
| 17:05 | Parque de Villa Borghese | 45 |  |
| 18:10 | Terraza del Pincio, al atardecer | 30 |  |
| 19:00 | Trinità dei Monti y su mirador sobre la Plaza de España | 15 | por dentro |
| 19:20 | Bajar la escalinata de la Plaza de España | 5 | de camino |
| 20:00 | **Cena:** Il Gabriello (o Poldo e Gianna Osteria), en el Tridente | 90 |  |
| 21:40 | Taxi al Coliseo | 10 |  |
| 22:00 | Coliseo iluminado | 20 | de noche |

- Lo demás del pool, en los días enteros (su día escrito).

**Experiencias:**
- **Naturaleza y Vistas:** por la tarde, como la tabla del Parque de Villa Borghese (en A, sin cambios).
- **Mercadillos (8 de diciembre a 6 de enero):** el colchón de Via Condotti pasa a «Luces de Navidad del Tridente».
- **Arte y Museos** y **Barrios y Sabores:** van en los días enteros.

**Free Tour:** de mañana, ver arriba (la mañana es el DM-medio). De tarde o de noche, el medio día no cambia.

### Medio día de Monti · DM-medio (solo con Free Tour de mañana, por la mañana)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Fontana de Trevi | 5 | de camino |
| 09:20 | Plaza del Quirinal (la vista de San Pedro) | 15 |  |
| 09:40 | Pasea y piérdete por Monti (Via Panisperna y la Piazza Madonna dei Monti) | 60 |  |
| 11:00 | San Pietro in Vincoli (el Moisés de Miguel Ángel) | 20 | por dentro |
| 11:40 | Santa Maria Maggiore | 40 | por dentro |
| 12:45 | **Comida:** Trattoria Monti (o La Boccaccia), junto a Santa Maria Maggiore | 60 |  |

Acaba a 5 min de Termini (tren y autobús al aeropuerto). La Plaza del Quirinal no está en los datos: hay que añadirla (nivel 3, por fuera, 15 min).

**Lo que hará el motor**
- San Pietro in Vincoli cierra de 12:30 a 15:00: si no llega, la regla de cierres.
- Si un restaurante cierra ese día, su alternativa (Trattoria Monti cierra el lunes).

**Pool:** San Juan de Letrán (y la Escalera Santa):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Plaza del Quirinal (la vista de San Pedro) | 15 |  |
| 09:40 | Pasea y piérdete por Monti (Via Panisperna y la Piazza Madonna dei Monti) | 30 |  |
| 10:30 | San Pietro in Vincoli (el Moisés de Miguel Ángel) | 20 | por dentro |
| 11:10 | Santa Maria Maggiore | 30 | por dentro |
| 12:10 | San Juan de Letrán y la Escalera Santa | 45 | por dentro |
| 13:10 | **Comida:** SantoPalato (o Il Bocconcino), en San Giovanni | 60 |  |

Lo demás del pool, en los días enteros.

**Experiencias:** Barrios y Sabores: Monti pasa de 60 a 75 min (la comida, a las 13:00). Las demás, en los días enteros.

---

## Variantes con horas

Sustituyen a las variantes antiguas de estos días. Las fechas especiales que no están aquí (sábado, lunes, Pascua, 24, 25 y 31 de diciembre, 1 y 6 de enero) las resuelve el motor con el horario oficial de ese día y la regla de cierres hasta que las escribamos; en Nochebuena, la nocturna es Trevi (`noche_especial`).

### D2 · Miércoles (audiencia del Papa)

Tarde A:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:25 | Pasea y piérdete por Borgo Pio y Prati (colchón) | 20 |  |
| 12:00 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 13:20 | Plaza de San Pedro (abre tras la audiencia) | 20 |  |
| 13:55 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 15:15 | Via della Conciliazione | 10 | de camino |
| 15:45 | Castillo de Sant'Angelo | 20 | por fuera |
| 16:20 | Puente Sant'Angelo | 15 |  |
| 16:50 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 17:25 | Santa Maria in Trastevere | 25 | por dentro |
| 18:00 | Pasea y piérdete por Trastevere iluminado (colchón) | 60 |  |
| 20:00 | **Cena:** Tonnarello, en Trastevere | 90 |  |
| 22:00 | Piazza Navona de noche | 30 | de noche |

Tarde B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:25 | Pasea y piérdete por Borgo Pio y Prati (colchón) | 20 |  |
| 12:00 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 13:20 | Plaza de San Pedro (abre tras la audiencia) | 20 |  |
| 13:55 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 15:15 | Via della Conciliazione | 10 | de camino |
| 15:45 | Castillo de Sant'Angelo | 20 | por fuera |
| 16:20 | Puente Sant'Angelo | 15 |  |
| 16:50 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 17:25 | Santa Maria in Trastevere | 25 | por dentro |
| 18:05 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 18:25 | Fontana dell'Acqua Paola | 10 |  |
| 18:55 | Mirador del Janículo, al atardecer | 30 |  |
| 19:50 | Pasea y piérdete por Trastevere iluminado (colchón) | 10 |  |
| 20:15 | **Cena:** Tonnarello | 90 |  |
| 22:15 | Piazza Navona de noche | 30 | de noche |

Tardes C y D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:25 | Pasea y piérdete por Borgo Pio y Prati (colchón) | 20 |  |
| 12:00 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 13:20 | Plaza de San Pedro (abre tras la audiencia) | 20 |  |
| 13:55 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 15:15 | Via della Conciliazione | 10 | de camino |
| 15:45 | Castillo de Sant'Angelo | 20 | por fuera |
| 16:20 | Puente Sant'Angelo | 15 |  |
| 16:50 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 17:25 | Santa Maria in Trastevere | 25 | por dentro |
| 18:00 | Pasea y piérdete por Trastevere (colchón) | 40 |  |
| 18:55 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 19:15 | Fontana dell'Acqua Paola | 10 |  |
| 19:45 | Mirador del Janículo, al atardecer | 30 |  |
| 21:00 | **Cena:** Tonnarello | 90 |  |
| 23:00 | Piazza Navona de noche | 20 | de noche |

### D2 · Sin Museos (cuando cierran: el domingo, también el último del mes)

Tardes A y B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Plaza de San Pedro | 20 |  |
| 09:35 | Basílica de San Pedro (con las Grutas y el control) | 90 | por dentro |
| 11:20 | Pasea y piérdete por Borgo Pio (colchón) | 30 |  |
| 11:55 | Via della Conciliazione | 10 | de camino |
| 12:25 | Castillo de Sant'Angelo | 20 | por fuera |
| 13:00 | Puente Sant'Angelo | 15 |  |
| 13:35 | **Comida:** Borghiciana (o Dal Toscano), en el Borgo | 75 |  |
| 15:10 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 15:45 | Isla Tiberina | 20 |  |
| 16:25 | Santa Maria in Trastevere | 25 | por dentro |
| 17:05 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 17:25 | Fontana dell'Acqua Paola | 10 |  |
| 17:55 | Mirador del Janículo, al atardecer | 30 |  |
| 18:50 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:15 | **Cena:** Tonnarello | 90 |  |
| 22:15 | Piazza Navona de noche | 30 | de noche |

Tardes C y D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Plaza de San Pedro | 20 |  |
| 09:35 | Basílica de San Pedro (con las Grutas y el control) | 90 | por dentro |
| 11:20 | Pasea y piérdete por Borgo Pio (colchón) | 30 |  |
| 11:55 | Via della Conciliazione | 10 | de camino |
| 12:25 | Castillo de Sant'Angelo | 20 | por fuera |
| 13:00 | Puente Sant'Angelo | 15 |  |
| 13:35 | **Comida:** Borghiciana (o Dal Toscano), en el Borgo | 75 |  |
| 15:10 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 15:45 | Isla Tiberina | 20 |  |
| 16:25 | Santa Maria in Trastevere | 25 | por dentro |
| 17:00 | Pasea y piérdete por Trastevere | 60 |  |
| 18:25 | San Pietro in Montorio y el Tempietto | 20 | por dentro |
| 19:00 | Fontana dell'Acqua Paola | 10 |  |
| 19:30 | Mirador del Janículo, al atardecer | 30 |  |
| 21:00 | **Cena:** Tonnarello | 90 |  |
| 23:00 | Piazza Navona de noche | 20 | de noche |

### D2 · Miércoles sin Museos (solo si el viajero quita los Museos; normalmente el miércoles se resuelve con el cambio de orden de los días)

Tarde A:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Puente Sant'Angelo | 10 |  |
| 09:25 | Castillo de Sant'Angelo | 20 | por fuera |
| 10:05 | Pasea y piérdete por Prati | 60 |  |
| 11:25 | Pasea y piérdete por Borgo Pio (colchón) | 30 |  |
| 12:10 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 13:30 | Plaza de San Pedro (abre tras la audiencia) | 20 |  |
| 14:05 | Basílica de San Pedro (con las Grutas y el control) | 75 | por dentro |
| 15:40 | Bus 23 por el Lungotevere hasta la Isla Tiberina (parada Lungotevere dei Cenci) | 20 |  |
| 16:10 | Isla Tiberina | 20 |  |
| 16:50 | Santa Maria in Trastevere | 25 | por dentro |
| 17:25 | Pasea y piérdete por Trastevere iluminado (colchón) | 110 |  |
| 19:30 | **Cena:** Tonnarello, en Trastevere | 90 |  |
| 21:30 | Piazza Navona de noche | 30 | de noche |

Tarde B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Puente Sant'Angelo | 10 |  |
| 09:25 | Castillo de Sant'Angelo | 20 | por fuera |
| 10:05 | Pasea y piérdete por Prati | 60 |  |
| 11:25 | Pasea y piérdete por Borgo Pio (colchón) | 30 |  |
| 12:10 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 13:30 | Plaza de San Pedro (abre tras la audiencia) | 20 |  |
| 14:05 | Basílica de San Pedro (con las Grutas y el control) | 75 | por dentro |
| 15:40 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 16:15 | Santa Maria in Trastevere | 25 | por dentro |
| 16:55 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 17:15 | Fontana dell'Acqua Paola | 10 |  |
| 17:45 | Mirador del Janículo, al atardecer | 30 |  |
| 18:40 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:15 | **Cena:** Tonnarello | 90 |  |
| 22:15 | Piazza Navona de noche | 30 | de noche |

Tardes C y D (en C, Navona de noche solo si acaba antes de las 23:00):

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Puente Sant'Angelo | 10 |  |
| 09:25 | Castillo de Sant'Angelo | 20 | por fuera |
| 10:05 | Pasea y piérdete por Prati | 60 |  |
| 11:25 | Pasea y piérdete por Borgo Pio (colchón) | 30 |  |
| 12:10 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 13:30 | Plaza de San Pedro (abre tras la audiencia) | 20 |  |
| 14:05 | Basílica de San Pedro (con las Grutas y el control) | 75 | por dentro |
| 15:40 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 16:15 | Isla Tiberina | 20 |  |
| 16:55 | Santa Maria in Trastevere | 25 | por dentro |
| 17:30 | Pasea y piérdete por Trastevere (colchón) | 45 |  |
| 18:40 | San Pietro in Montorio y el Tempietto | 20 | por dentro |
| 19:15 | Fontana dell'Acqua Paola | 10 |  |
| 19:45 | Mirador del Janículo, al atardecer | 30 |  |
| 21:00 | **Cena:** Tonnarello | 90 |  |
| 23:00 | Piazza Navona de noche | 20 | de noche |

### D2 · Reserva de los Museos de 10:30 a 12:30 (ejemplo: 12:00)

Tardes A y B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Plaza de San Pedro | 20 |  |
| 09:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 10:35 | Pasea y piérdete por Prati y el Borgo, hacia los Museos (colchón) | 35 |  |
| 12:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 15:25 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 16:30 | Via della Conciliazione | 10 | de camino |
| 17:00 | Castillo de Sant'Angelo | 20 | por fuera |
| 17:35 | Puente Sant'Angelo | 15 |  |
| 18:05 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 18:40 | Santa Maria in Trastevere | 25 | por dentro |
| 19:15 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:00 | **Cena:** Tonnarello | 90 |  |
| 22:00 | Piazza Navona de noche | 30 | de noche |

Tardes C y D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Plaza de San Pedro | 20 |  |
| 09:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 10:35 | Pasea y piérdete por Prati y el Borgo, hacia los Museos (colchón) | 35 |  |
| 12:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 15:25 | **Comida:** Borghiciana (o Pizzarium, al lado de los Museos), en el Borgo | 60 |  |
| 16:30 | Via della Conciliazione | 10 | de camino |
| 17:00 | Castillo de Sant'Angelo | 20 | por fuera |
| 17:35 | Puente Sant'Angelo | 15 |  |
| 18:05 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 18:40 | Santa Maria in Trastevere | 25 | por dentro |
| 19:20 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 19:40 | Fontana dell'Acqua Paola | 10 |  |
| 20:10 | Mirador del Janículo, al atardecer | 30 |  |
| 21:15 | **Cena:** Tonnarello | 90 |  |
| 23:15 | Piazza Navona de noche | 20 | de noche |

### D2 · Reserva de los Museos de 13:00 a 13:30 (ejemplo: 13:00)

Tardes A y B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Plaza de San Pedro | 20 |  |
| 09:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 10:35 | Pasea y piérdete por Prati y el Borgo, hacia los Museos (colchón) | 50 |  |
| 11:45 | **Comida rápida:** Pizzarium, al lado de los Museos | 25 |  |
| 13:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 16:05 | Via della Conciliazione | 10 | de camino |
| 16:35 | Castillo de Sant'Angelo | 20 | por fuera |
| 17:10 | Puente Sant'Angelo | 15 |  |
| 17:40 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 18:15 | Santa Maria in Trastevere | 25 | por dentro |
| 18:50 | Pasea y piérdete por Trastevere iluminado (colchón) | 40 |  |
| 20:15 | **Cena:** Tonnarello | 90 |  |
| 22:15 | Piazza Navona de noche | 30 | de noche |

Tardes C y D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Plaza de San Pedro | 20 |  |
| 09:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 10:35 | Pasea y piérdete por Prati y el Borgo, hacia los Museos (colchón) | 50 |  |
| 11:45 | **Comida rápida:** Pizzarium, al lado de los Museos | 25 |  |
| 13:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 16:05 | Via della Conciliazione | 10 | de camino |
| 16:35 | Castillo de Sant'Angelo | 20 | por fuera |
| 17:10 | Puente Sant'Angelo | 15 |  |
| 17:40 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 18:15 | Santa Maria in Trastevere | 25 | por dentro |
| 18:55 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 19:15 | Fontana dell'Acqua Paola | 10 |  |
| 19:45 | Mirador del Janículo, al atardecer | 30 |  |
| 21:00 | **Cena:** Tonnarello | 90 |  |
| 23:00 | Piazza Navona de noche | 20 | de noche |

### D2 · Reserva de los Museos de 14:00 a 16:00 (ejemplo: 16:00)

Tardes A, B y C:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Santa Maria in Trastevere | 25 | por dentro |
| 09:35 | Pasea y piérdete por Trastevere | 25 |  |
| 10:15 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 10:35 | Fontana dell'Acqua Paola | 10 |  |
| 11:05 | Mirador del Janículo | 25 |  |
| 11:40 | La Passeggiata del Gianicolo, bajando hasta San Pedro | 35 |  |
| 12:35 | **Comida:** Borghiciana (o Dal Toscano), en el Borgo | 60 |  |
| 13:55 | Plaza de San Pedro | 15 |  |
| 14:25 | Basílica de San Pedro (con el control) | 45 | por dentro |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 19:30 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 21:25 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | de noche |

Tarde D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Santa Maria in Trastevere | 25 | por dentro |
| 09:35 | Pasea y piérdete por Trastevere | 25 |  |
| 10:15 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 10:35 | Fontana dell'Acqua Paola | 10 |  |
| 11:05 | Mirador del Janículo | 25 |  |
| 11:40 | La Passeggiata del Gianicolo, bajando hasta San Pedro | 35 |  |
| 12:35 | **Comida:** Borghiciana (o Dal Toscano), en el Borgo | 60 |  |
| 13:55 | Plaza de San Pedro | 15 |  |
| 14:25 | Basílica de San Pedro (con el control) | 45 | por dentro |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 19:25 | Pasea y piérdete por Prati (colchón) | 30 |  |
| 20:30 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 22:25 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | de noche |

Si la reserva no cae justo en la hora del ejemplo, el motor corre las horas con los márgenes. Una reserva de 8:00 a 10:00 usa el día normal (empieza más tarde si la reserva es más tarde).

### D0-medio · Miércoles y domingo

Ver «Lo que hará el motor» del viaje de 1,5 días: sin Museos, la mañana del miércoles empieza en el Castillo y el Puente; el domingo es igual que cualquier otro día (todo por fuera).

### D3 · Domingo (Museos cerrados)

Tardes A y B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Fontana de Trevi, sin gente | 20 |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 |  |
| 09:00 | Panteón (abre a las 9:00) | 20 | por dentro |
| 10:00 | **Free Tour Centro Histórico** (sale de la Plaza de España, acaba en Navona) | 150 | con guía |
| 12:50 | **Comida:** Armando al Pantheon (o Supplizio; si cierran los dos, Piccolo Arancio) | 60 |  |
| 14:05 | Bus 40 o taxi al Vaticano | 25 |  |
| 14:45 | Plaza de San Pedro | 15 |  |
| 15:15 | Basílica de San Pedro (con las Grutas y el control) | 75 | por dentro |
| 16:45 | Pasea y piérdete por Borgo Pio | 30 |  |
| 17:20 | Via della Conciliazione | 10 | de camino |
| 17:50 | Castillo de Sant'Angelo | 20 | por fuera |
| 18:25 | Puente Sant'Angelo, al atardecer | 20 |  |
| 19:05 | Pasea y piérdete por Prati (colchón) | 25 |  |
| 19:45 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 21:45 | Piazza Navona de noche | 30 | de noche |

Tardes C y D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Fontana de Trevi, sin gente | 20 |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 |  |
| 09:00 | Panteón (abre a las 9:00) | 20 | por dentro |
| 10:00 | **Free Tour Centro Histórico** (sale de la Plaza de España, acaba en Navona) | 150 | con guía |
| 12:50 | **Comida:** Armando al Pantheon (o Supplizio; si cierran los dos, Piccolo Arancio) | 60 |  |
| 14:05 | Bus 40 o taxi al Vaticano | 25 |  |
| 14:45 | Plaza de San Pedro | 15 |  |
| 15:15 | Basílica de San Pedro (con las Grutas y el control) | 75 | por dentro |
| 16:45 | Pasea y piérdete por Borgo Pio | 30 |  |
| 17:20 | Via della Conciliazione | 10 | de camino |
| 17:50 | Castillo de Sant'Angelo | 20 | por fuera |
| 18:30 | Pasea y piérdete por Prati (colchón) | 60 |  |
| 19:55 | Puente Sant'Angelo, al atardecer | 20 |  |
| 20:45 | **Cena:** L'Arcangelo (o Osteria dell'Angelo), en Prati | 90 |  |
| 22:45 | Piazza Navona de noche | 20 | de noche |

### D1 · Con Free Tour de tarde (17:00)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Coliseo | 75 | por dentro (turno) |
| 10:05 | Arco de Constantino | 10 |  |
| 10:30 | Foro Romano y Palatino | 90 | por dentro |
| 12:20 | Plaza del Campidoglio | 15 |  |
| 12:40 | Piazza Venezia | 5 | de camino |
| 13:00 | Altar de la Patria | 30 | por dentro |
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 45 |  |
| 14:45 | Barrio Judío | 20 |  |
| 15:10 | Fuente de las Tortugas | 5 | de camino |
| 15:20 | Largo di Torre Argentina | 5 | de camino |
| 15:35 | Elefantino de Bernini | 5 | de camino |
| 15:55 | Panteón | 25 | por dentro |
| 17:00 | **Free Tour Centro Histórico** (sale de la Plaza de España, acaba en Navona) | 150 | con guía |
| 19:50 | **Cena:** Pizzeria Da Baffetto (o Armando al Pantheon) | 90 |  |
| 21:45 | El Foro Romano desde el Campidoglio (noche) | 25 | de noche |

### D1 · Con Free Tour de noche (18:30)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Coliseo | 75 | por dentro (turno) |
| 10:05 | Arco de Constantino | 10 |  |
| 10:30 | Foro Romano y Palatino | 90 | por dentro |
| 12:20 | Plaza del Campidoglio | 15 |  |
| 12:40 | Piazza Venezia | 5 | de camino |
| 13:00 | Altar de la Patria | 30 | por dentro |
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 30 |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |
| 15:45 | Largo di Torre Argentina | 5 | de camino |
| 16:00 | Elefantino de Bernini | 5 | de camino |
| 16:05 | Santa Maria sopra Minerva | 5 | de camino |
| 16:25 | Panteón | 30 | por dentro |
| 17:10 | San Luigi dei Francesi | 20 | por dentro |
| 17:40 | Pasea y piérdete por el Centro Histórico, hacia la Plaza de España (colchón) | 10 |  |
| 18:30 | **Free Tour Centro Histórico** (sale de la Plaza de España, acaba en Navona) | 150 | con guía |
| 21:20 | **Cena:** Pizzeria Da Baffetto (o Armando al Pantheon) | 90 |  |

---

## Pool y experiencias: cómo se calculan las horas

Los sitios del pool son siempre los mismos y cada uno tiene su sitio escrito (día, qué sale, qué entra, en qué orden y cuántos minutos). Las horas salen de la regla de márgenes, que es un cálculo fijo (no es decidir nada). Si con los márgenes algo no cabe, primero se acorta el colchón y luego se quita por el orden del día.

---

## Fechas especiales (Navidad y Año Nuevo)

**Los horarios cortos y los cierres de esos días salen del dato oficial de cada sitio**, y el motor aplica la regla de cierres. Además:

- **24 de diciembre (Nochebuena):** la nocturna es solo la Fontana de Trevi (`noche_especial`). Las comidas y cenas llevan «(con reserva)».
- **25 de diciembre y 1 de enero:** el Coliseo, el Foro y los Museos Vaticanos cierran. Además:
  - si ese día toca el **Día de la Roma antigua**, se usa el **D1-corto** (todo por fuera);
  - si toca el **Día del Vaticano**, se usa esta tabla (el 25, la bendición «Urbi et Orbi»; el 1 de enero, el Ángelus);
  - si toca el **Día del Free Tour** y ese día no hay tour, el motor lo pone otro día del viaje;
  - el **crucero** no cambia (todo es por fuera), salvo los restaurantes.

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:30 | Pasea y piérdete por Trastevere (aún tranquilo) | 30 |  |
| 09:00 | Santa Maria in Trastevere | 5 | de camino (la plaza y la fachada) |
| 09:20 | San Pietro in Montorio y el Tempietto | 5 | de camino |
| 09:40 | Fontana dell'Acqua Paola | 10 |  |
| 10:00 | La Passeggiata del Gianicolo, bajando hasta San Pedro | 30 |  |
| 11:00 | Plaza de San Pedro: la bendición del Papa a las 12:00 y el belén | 75 |  |
| 12:35 | **Comida:** Borghiciana (o Dal Toscano), en el Borgo (con reserva) | 90 |  |
| 14:10 | Via della Conciliazione | 10 | de camino |
| 14:40 | Castillo de Sant'Angelo | 15 | por fuera |
| 15:10 | Pasea y piérdete por Prati (colchón) | 40 |  |
| 16:10 | Puente Sant'Angelo, al atardecer | 15 |  |
| 16:40 | Pasea y piérdete por el centro iluminado | 90 |  |
| 18:15 | Panteón | 5 | de camino |
| 19:30 | **Cena:** Armando al Pantheon (o la alternativa abierta ese día; con reserva) | 90 |  |
| 21:15 | Piazza Navona de noche | 30 | de noche |

- **31 de diciembre (Nochevieja):** horarios cortos por el dato oficial; la cena lleva «(con reserva: menú de Nochevieja)»; la nocturna solo si acaba antes de las 23:00.
- **Restaurantes en estas fechas:** si el dato dice que cierra ese día, se usa su alternativa. Si no hay dato, sale el aviso «En Navidad, reserva con antelación».
- **Avisos:** uno solo por fecha, con lo que cambia ese día.

---

## Notas para escribir los días de 3 a 6 (pendiente)

- **Orden para escribirlos: por niveles.** Primero la zona con imprescindibles o más nivel 2, luego las demás. Plan:
  - 3 días: + día de la Plaza de España, el Popolo, el Pincio y Villa Borghese (con la Galería si va en el pool), sacado del DT-medio;
  - 4 días: + día de Monti y el Esquilino (Santa Maria Maggiore, San Pietro in Vincoli, Mercados de Trajano, San Clemente, Letrán), sacado del DM-medio;
  - 5 días: + día del Aventino, Testaccio y Caracalla (Circo Máximo, Jardín de los Naranjos, Ojo de la Cerradura, Caracalla, Mercado de Testaccio);
  - 6 días: + día de Trastevere tranquilo (Villa Farnesina, Santa Cecilia) y lo que quede.
- **Nivel 3, si no cabe, no pasa nada** (regla general de arriba): se quita el primero y no sale en «No incluido».
- **Dónde colocar los sitios que hoy no están en ningún día:**
  - Santa Maria della Vittoria, la Fuente del Tritón y Via Veneto → día de la Borghese;
  - Villa Farnesina y Santa Cecilia in Trastevere → un día de Trastevere más tranquilo;
  - Via Margutta → de camino en el día del Pincio;
  - Mercado de Testaccio → día del Aventino;
  - Quartiere Coppedè → experiencia Barrios y Sabores;
  - Bioparque y Galería Nacional de Arte Moderno → solo con «Añadir parada».
