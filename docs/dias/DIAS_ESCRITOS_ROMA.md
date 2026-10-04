# Días escritos de Roma

**Este documento manda.** Lo que pone aquí es lo que tiene que salir en la app: hora, parada, minutos y si es por dentro o por fuera.

- **Code copia** cada tabla a su fichero del día (`data/dias/roma/`), sin cambiar horas, sin añadir nada y sin «mejorar». Si algo no le cuadra, lo apunta y pregunta.
- **El motor solo ajusta**, y solo lo que dice «Lo que hará el motor» de cada día. No estira paradas, no rellena huecos, no reordena y no elige nocturnas.
- **Festivos y cierres:** el motor mira el horario oficial de cada sitio para esa fecha (festivos, misas y horarios especiales incluidos) y aplica la regla de cierres: adelantar, acortar (mínimo 20 min), por fuera o quitar.
- **Cada sitio es su propia parada.** La única excepción es de noche: «El Puente y el Castillo de Sant'Angelo iluminados» es una sola parada.
- **La prueba** compara, parada a parada, lo que sale con este documento. Solo valen las diferencias que explica «Lo que hará el motor».
- Debajo de cada día van siempre tres bloques: **pool**, **experiencias** y **Free Tour**.

## Márgenes (valen para estos días escritos)

1. **Entre una parada y la siguiente:** lo que se tarda andando **más 10 min**, redondeado a 5. Aunque estén al lado, nunca menos de 10 min.
2. **Después de algo largo o con guía** (Free Tour, Museos Vaticanos, Coliseo, Foro, Galería Borghese): andar **más 15 min**.
3. **Antes de una hora fija:** llegar **15 min antes** a un turno o al Free Tour; **30 min antes** a una reserva.
4. **Bus o taxi:** el trayecto **más 10 min** de espera.
5. **Las colas van dentro de la visita:** la Basílica de San Pedro lleva 15 min más por el control de seguridad.
6. **«De camino»** no es parada: solo cuenta lo que se anda.
7. **Cada medio día tiene un colchón** (marcado «colchón»): es lo primero que se acorta si se va con retraso, para no perder una visita.

Versiones de la tarde según la puesta de sol: **A** antes de las 17:40 · **B** de 17:40 a 18:45 · **C** de 18:45 a 19:45 · **D** después de las 19:45. «Al atardecer» quiere decir que el motor ajusta esa parada (y el colchón de antes) para llegar con el sol, sin esperar nunca más de 30 min. La noche acaba a las 23:00 (23:30 en julio y agosto): una nocturna que pase de ahí se quita.

---

## Nombres

| Nombre | Fichero |
|---|---|
| Roma en un día (crucero) | D0 |
| Medio día del Vaticano (viaje de 1,5 días) | D0-medio (nuevo) |
| Día de la Roma antigua | D1 |
| Día del Vaticano y Trastevere | D2 |
| Día del Free Tour y el Vaticano por la tarde | D3 |
| Día de la Roma antigua, el Gueto y Trastevere | D1-FT |
| Día de Trevi, el Pincio y Monti | D4M (pendiente) |
| Día de la Borghese | D4 (pendiente) |

## Qué días lleva cada viaje

| Viaje | Sin Free Tour | Con Free Tour de mañana |
|---|---|---|
| 1 día | D0 | no se ofrece |
| 1,5 días | D1 + D0-medio | no se ofrece |
| 2 días | D1 + D2 | D3 + D1-FT |
| 3 días | D1 + D2 + D4 (con Galería) o D4M (sin ella) | D3 + D1-FT + D4 o D5C |
| 4 días | D1 + D2 + D4 + D5C | D3 + D1-FT + D4 + D5C |
| 5 días | D1 + D2 + D4 + D5 + D6 | D3 + D1-FT + D4 + D5 + D6 |
| 6 días | + D7 | + D7 |
| 7 o más | del día 7 en adelante, en blanco (el viajero lo rellena a mano) | igual |

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
| 12:40 | **Comida:** Armando al Pantheon | 60 |  |
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
| 13:15 | **Comida:** Armando al Pantheon | 45 |  |
| 14:15 | Panteón | 15 | por fuera |
| 14:45 | Piazza Navona | 20 |  |
| 15:15 | Puente Sant'Angelo | 5 | de camino |
| 15:25 | Castillo de Sant'Angelo | 5 | de camino |
| 15:55 | Plaza de San Pedro | 15 |  |
| 16:10 | Basílica de San Pedro | 10 | de camino (la fachada) |

**Lo que hará el motor**
- Sin reserva, nada por dentro (aunque el viajero marque algo en el pool).
- Con reserva: esa visita va a su hora y por dentro. Museos Vaticanos o Coliseo por la tarde → ruta normal. Coliseo por la mañana → ruta del revés.
- Si no cabe todo, se quita por este orden: 1) Via dei Fori Imperiali, 2) Via della Conciliazione, 3) el Foro desde el Campidoglio, 4) Plaza del Campidoglio, 5) el Altar de la Patria. Nunca se quitan San Pedro, el Panteón, Trevi ni el Coliseo. (La Plaza de España ya no cabe con los márgenes.)
- Si el viajero cambia el horario, el día empieza y acaba a sus horas.

**Pool:** no se usa. Solo cuenta una reserva.
**Experiencias:** solo Mercadillos (8 de diciembre a 6 de enero): «Piazza Navona y su mercadillo navideño», 35 min.
**Free Tour:** no se ofrece.
**Pendiente:** la versión para quien viene 1 día y se va después de las 21:00.

---

## Viaje de 1,5 días · D1 + D0-medio

**1,5 días = el Día de la Roma antigua entero + medio día del Vaticano.** Si el medio día va primero (se llega a mediodía), el Vaticano es la tarde de llegada; si va al final, es la última mañana. Por dentro: el Coliseo con el Foro, el Panteón, la Basílica y los Museos Vaticanos.

**Medio día del Vaticano por la mañana**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:30 | Plaza de San Pedro | 20 |  |
| 12:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 13:40 | **Comida:** Borghiciana, en el Borgo | 60 |  |
| 14:45 | Via della Conciliazione | 5 | de camino |
| 15:00 | Castillo de Sant'Angelo | 5 | de camino |
| 15:10 | Puente Sant'Angelo | 5 | de camino |

**Medio día del Vaticano por la tarde (se llega antes de las 13:00)**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:45 | Plaza de San Pedro | 15 |  |
| 14:15 | Basílica de San Pedro (con el control) | 60 | por dentro |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 150 | por dentro (turno de las 16:00) |
| 18:50 | Pasea y piérdete por Prati (colchón) | 20 |  |
| 19:30 | **Cena:** L'Arcangelo, en Prati | 90 |  |
| 21:25 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | de noche |

**Medio día del Vaticano por la tarde, sin Museos (se llega después de las 13:00), A y B**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 15:00 | Plaza de San Pedro | 20 |  |
| 15:35 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 16:55 | Via della Conciliazione | 10 | de camino |
| 17:25 | Castillo de Sant'Angelo | 20 | por fuera |
| 18:00 | Puente Sant'Angelo | 15 |  |
| 18:30 | Pasea y piérdete por Prati y el Borgo (colchón) | 40 |  |
| 19:30 | **Cena:** L'Arcangelo, en Prati | 90 |  |
| 21:30 | Piazza Navona de noche | 30 | de noche |

C y D: igual hasta el Castillo; después el colchón de Prati, el Puente al atardecer, cena a las 20:00 (C) o 21:00 (D) y Piazza Navona de noche. En D la tarde empieza a las 16:30.

**Lo que hará el motor**
- Elegir mañana o tarde según el viaje, y tarde con o sin Museos según la hora de llegada.
- Miércoles y domingo por la mañana: ver «Variantes con horas».
- Si algo cierra: adelantar, acortar (mínimo 20 min), por fuera o quitar.

**Pool y experiencias:** los del Día de la Roma antigua y del Día del Vaticano, cada uno en su medio día.
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

**Tarde A y B** (iguales a propósito: esta tarde no depende del sol)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 30 |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |
| 15:45 | Largo di Torre Argentina | 5 | de camino |
| 16:05 | Iglesia del Gesù (abre a las 16:00) | 20 | por dentro |
| 16:35 | Elefantino de Bernini | 5 | de camino |
| 16:40 | Santa Maria sopra Minerva | 5 | de camino |
| 17:00 | Panteón | 30 | por dentro |
| 17:45 | San Luigi dei Francesi | 20 | por dentro |
| 18:20 | Piazza Navona | 30 |  |
| 19:10 | Campo de' Fiori (colchón) | 25 |  |
| 20:00 | **Cena:** Armando al Pantheon (o Da Baffetto) | 90 |  |
| 21:50 | Fontana de Trevi iluminada | 20 | de noche |
| 22:30 | Plaza de España de noche | 20 | de noche |

**Tarde C**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 30 |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |
| 15:45 | Largo di Torre Argentina | 5 | de camino |
| 16:05 | Iglesia del Gesù (abre a las 16:00) | 20 | por dentro |
| 16:35 | Elefantino de Bernini | 5 | de camino |
| 16:40 | Santa Maria sopra Minerva | 5 | de camino |
| 17:00 | Panteón | 30 | por dentro |
| 17:45 | San Luigi dei Francesi | 20 | por dentro |
| 18:20 | Piazza Navona | 30 |  |
| 19:10 | Campo de' Fiori | 25 |  |
| 19:50 | Ponte Sisto al atardecer (colchón) | 15 |  |
| 20:30 | **Cena:** Armando al Pantheon (o Da Baffetto) | 90 |  |
| 22:20 | Fontana de Trevi iluminada | 20 | de noche |

**Tarde D**

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 13:50 | **Comida:** Nonna Betta (o Giggetto), en el Barrio Judío | 60 |  |
| 15:00 | Barrio Judío | 30 |  |
| 15:35 | Fuente de las Tortugas | 5 | de camino |
| 15:45 | Largo di Torre Argentina | 5 | de camino |
| 16:05 | Iglesia del Gesù (abre a las 16:00) | 20 | por dentro |
| 16:35 | Elefantino de Bernini | 5 | de camino |
| 16:40 | Santa Maria sopra Minerva | 5 | de camino |
| 17:00 | Panteón | 30 | por dentro |
| 17:45 | San Luigi dei Francesi | 20 | por dentro |
| 18:20 | Piazza Navona | 30 |  |
| 19:10 | Campo de' Fiori | 25 |  |
| 19:45 | Pasea y piérdete por el Centro Histórico (colchón) | 10 |  |
| 20:10 | Ponte Sisto al atardecer | 25 |  |
| 21:00 | **Cena:** Armando al Pantheon (o Da Baffetto) | 90 |  |
| 22:50 | Fontana de Trevi iluminada | 15 | de noche |

En C no da tiempo a la Plaza de España de noche; en D solo Trevi (15 min).

**Lo que hará el motor**
- Sábado: el Panteón cierra a las 17:00 por la misa → se adelanta, antes del Gesù.
- Domingo o festivo: si una iglesia cierra, se acorta o va por fuera.
- Coliseo cerrado (1 de enero, 25 de diciembre): por fuera.
- Entrada al Coliseo por la tarde: se mantiene la variante que ya hay (`entrada:tarde`) hasta que la escribamos en este formato.

### Pool (solo si el viaje no tiene el día propio del extra; las horas salen de los márgenes)
1. **Museos Capitolinos** (si no hay D5): después del Campidoglio, 75 min por dentro; el Altar pasa a «de camino»; por la tarde el Barrio Judío baja a 20 min y San Luigi va por fuera si no llega antes de las 18:00.
2. **Termas de Caracalla** (si no hay D5 ni D5C): taxi después de comer, Termas 60 min, taxi al Gesù; se quitan el Barrio Judío, la Fuente de las Tortugas y Largo di Torre Argentina.
3. **Galería Borghese** (si no hay D4; turno de las 17:00): Panteón, Elefantino y Minerva de camino, San Luigi, Piazza Navona, taxi, Galería 120, Terraza del Pincio, cena en Il Gabriello (Tridente), Plaza de España y Trevi de noche.
4. **Boca de la Verdad:** después del Barrio Judío, 15 min; el resto igual (el colchón se acorta).
5. **Ojo de la Cerradura del Aventino** (con la Boca): Barrio Judío 20, Boca 15, Ojo 10, taxi al Gesù; se quita San Luigi si no llega antes de las 18:00.
6. **San Juan de Letrán a primera hora** (si no hay D4M ni D5C): Letrán a las 7:45 (25 min), metro, Coliseo a las 9:00; el resto del día, 30 min más tarde, y el colchón se acorta.

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

Los Museos van siempre a las 8:00 (en 2 días y en más).

**Tarde A** (con la mañana; en A la comida dura 75 min)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:30 | Plaza de San Pedro | 20 |  |
| 12:05 | Basílica de San Pedro (con el control) | 75 | por dentro |
| 13:40 | **Comida:** Borghiciana, en el Borgo | 75 |  |
| 15:00 | Via della Conciliazione | 10 | de camino |
| 15:30 | Castillo de Sant'Angelo | 20 | por fuera |
| 16:05 | Puente Sant'Angelo | 15 |  |
| 16:35 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 17:10 | Santa Maria in Trastevere | 25 | por dentro |
| 17:45 | Pasea y piérdete por Trastevere iluminado | 75 |  |
| 19:20 | Isla Tiberina (colchón) | 20 |  |
| 20:00 | **Cena:** Tonnarello, en Trastevere | 90 |  |
| 22:00 | Piazza Navona de noche | 30 | de noche |

En invierno no da tiempo a llegar al Janículo con luz: Trastevere se pasea ya iluminado.

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
| 22:15 | Piazza Navona de noche | 30 | de noche |

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
| 22:30 | Piazza Navona de noche | 30 | de noche |

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
| 23:00 | Piazza Navona de noche | 20 | de noche |

En B, C y D el Tempietto va de camino (por fuera) y la Isla Tiberina se queda fuera: no caben con los márgenes. En D, Navona de noche solo en julio y agosto.

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
| 12:50 | **Comida:** Armando al Pantheon (o Supplizio) | 45 |  |
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
| 20:45 | **Cena:** L'Arcangelo, en Prati | 90 |  |
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
| 22:55 | Taxi a Trevi (en julio y agosto) | 10 |  |
| 23:20 | Fontana de Trevi iluminada (en julio y agosto) | 15 | de noche |

La nocturna es Trevi, en taxi: en un viaje con Free Tour es la única vez que sale de noche. En D no hay nocturna: Trevi pasaría de la hora límite.

**Lo que hará el motor**
- Lunes: el Tempietto por fuera.
- Primer domingo del mes (Coliseo gratis) y 25 de diciembre (cerrado): regla de cierres y horario oficial de ese día.

**Pool:** Boca de la Verdad después de la Isla Tiberina (15 min); Ojo de la Cerradura con la Boca y taxi al Tempietto (se quita la Isla); Museos Capitolinos y San Juan de Letrán como en el D1; Termas de Caracalla en taxi después de comer (se quita el Barrio Judío); Galería Borghese (turno de las 15:00, en taxi) en vez de la tarde de Trastevere, con el parque, el Pincio, cena en el Tridente y Trevi y Plaza de España de noche.
**Experiencias:** Arte y Museos: los Capitolinos. Naturaleza y Vistas: el ascensor del Altar (+30). Barrios y Sabores: el Barrio Judío 45 y el colchón de Trastevere más largo. Mercadillos: el Santo Bambino de Aracoeli de camino.

---

## Variantes con horas

Sustituyen a las variantes antiguas de estos días. Las fechas especiales que no están aquí (sábado, lunes, Pascua, 24, 25 y 31 de diciembre, 1 y 6 de enero) las resuelve el motor con el horario oficial de ese día y la regla de cierres hasta que las escribamos; en Nochebuena, la nocturna es Trevi (`noche_especial`).

### D2 · Miércoles (audiencia del Papa)

Tarde A:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:25 | Pasea y piérdete por Borgo Pio y Prati (colchón) | 20 |  |
| 12:00 | **Comida:** Borghiciana, en el Borgo | 60 |  |
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
| 12:00 | **Comida:** Borghiciana, en el Borgo | 60 |  |
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
| 19:50 | Pasea y piérdete por Trastevere iluminado (colchón) | 30 |  |
| 20:45 | **Cena:** Tonnarello | 90 |  |
| 22:45 | Piazza Navona de noche | 30 | de noche |

Tardes C y D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:25 | Pasea y piérdete por Borgo Pio y Prati (colchón) | 20 |  |
| 12:00 | **Comida:** Borghiciana, en el Borgo | 60 |  |
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

### D2 · Domingo (Museos cerrados; también el último domingo del mes)

Tardes A y B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Plaza de San Pedro | 20 |  |
| 09:35 | Basílica de San Pedro (con las Grutas y el control) | 90 | por dentro |
| 11:20 | Pasea y piérdete por Borgo Pio (colchón) | 30 |  |
| 11:55 | Via della Conciliazione | 10 | de camino |
| 12:25 | Castillo de Sant'Angelo | 20 | por fuera |
| 13:00 | Puente Sant'Angelo | 15 |  |
| 13:35 | **Comida:** Borghiciana, en el Borgo | 75 |  |
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
| 13:35 | **Comida:** Borghiciana, en el Borgo | 75 |  |
| 15:10 | Bus 23 por el Lungotevere hasta Trastevere | 20 |  |
| 15:45 | Isla Tiberina | 20 |  |
| 16:25 | Santa Maria in Trastevere | 25 | por dentro |
| 17:00 | Pasea y piérdete por Trastevere | 60 |  |
| 18:25 | San Pietro in Montorio y el Tempietto | 20 | por dentro |
| 19:00 | Fontana dell'Acqua Paola | 10 |  |
| 19:30 | Mirador del Janículo, al atardecer | 30 |  |
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
| 15:25 | **Comida:** Borghiciana, en el Borgo | 60 |  |
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
| 15:25 | **Comida:** Borghiciana, en el Borgo | 60 |  |
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
| 12:35 | **Comida:** Borghiciana, en el Borgo | 60 |  |
| 13:55 | Plaza de San Pedro | 15 |  |
| 14:25 | Basílica de San Pedro (con el control) | 45 | por dentro |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 19:30 | **Cena:** L'Arcangelo, en Prati | 90 |  |
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
| 12:35 | **Comida:** Borghiciana, en el Borgo | 60 |  |
| 13:55 | Plaza de San Pedro | 15 |  |
| 14:25 | Basílica de San Pedro (con el control) | 45 | por dentro |
| 16:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (reserva) |
| 19:25 | Pasea y piérdete por Prati (colchón) | 30 |  |
| 20:30 | **Cena:** L'Arcangelo, en Prati | 90 |  |
| 22:25 | El Puente y el Castillo de Sant'Angelo iluminados | 30 | de noche |

Si la reserva no cae justo en la hora del ejemplo, el motor corre las horas con los márgenes. Una reserva de 8:00 a 10:00 usa el día normal (empieza más tarde si la reserva es más tarde).

### D0-medio · Miércoles por la mañana

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 | por dentro (turno de las 8:00) |
| 11:25 | Pasea y piérdete por Borgo Pio y Prati (colchón) | 20 |  |
| 12:00 | **Comida:** Borghiciana, en el Borgo | 60 |  |
| 13:20 | Plaza de San Pedro (abre tras la audiencia) | 20 |  |
| 13:55 | Basílica de San Pedro (con el control) | 60 | por dentro |

### D0-medio · Domingo por la mañana (sin Museos)

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 09:00 | Plaza de San Pedro | 20 |  |
| 09:35 | Basílica de San Pedro (con las Grutas y el control) | 90 | por dentro |
| 11:10 | Via della Conciliazione | 10 | de camino |
| 11:40 | Castillo de Sant'Angelo | 20 | por fuera |
| 12:15 | Puente Sant'Angelo | 15 |  |
| 12:50 | **Comida:** Borghiciana, en el Borgo | 60 |  |

El medio día de mañana acaba, por defecto, a las 15:00 (o a la hora de salida que ponga el viajero). Lo que no quepa antes de esa hora se quita del final.

### D3 · Domingo (Museos cerrados)

Tardes A y B:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Fontana de Trevi, sin gente | 20 |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 |  |
| 09:00 | Panteón (abre a las 9:00) | 20 | por dentro |
| 10:00 | **Free Tour Centro Histórico** (sale de la Plaza de España, acaba en Navona) | 150 | con guía |
| 12:50 | **Comida:** Armando al Pantheon (o Supplizio) | 60 |  |
| 14:05 | Bus 40 o taxi al Vaticano | 25 |  |
| 14:45 | Plaza de San Pedro | 15 |  |
| 15:15 | Basílica de San Pedro (con las Grutas y el control) | 75 | por dentro |
| 16:45 | Pasea y piérdete por Borgo Pio | 30 |  |
| 17:20 | Via della Conciliazione | 10 | de camino |
| 17:50 | Castillo de Sant'Angelo | 20 | por fuera |
| 18:25 | Puente Sant'Angelo, al atardecer | 20 |  |
| 19:05 | Pasea y piérdete por Prati (colchón) | 25 |  |
| 19:45 | **Cena:** L'Arcangelo, en Prati | 90 |  |
| 21:45 | Piazza Navona de noche | 30 | de noche |

Tardes C y D:

| Hora | Parada | Min | Cómo |
|---|---|---|---|
| 07:45 | Fontana de Trevi, sin gente | 20 |  |
| 08:25 | Desayuno en Piazza della Rotonda, frente al Panteón | 20 |  |
| 09:00 | Panteón (abre a las 9:00) | 20 | por dentro |
| 10:00 | **Free Tour Centro Histórico** (sale de la Plaza de España, acaba en Navona) | 150 | con guía |
| 12:50 | **Comida:** Armando al Pantheon (o Supplizio) | 60 |  |
| 14:05 | Bus 40 o taxi al Vaticano | 25 |  |
| 14:45 | Plaza de San Pedro | 15 |  |
| 15:15 | Basílica de San Pedro (con las Grutas y el control) | 75 | por dentro |
| 16:45 | Pasea y piérdete por Borgo Pio | 30 |  |
| 17:20 | Via della Conciliazione | 10 | de camino |
| 17:50 | Castillo de Sant'Angelo | 20 | por fuera |
| 18:30 | Pasea y piérdete por Prati (colchón) | 60 |  |
| 19:55 | Puente Sant'Angelo, al atardecer | 20 |  |
| 20:45 | **Cena:** L'Arcangelo, en Prati | 90 |  |
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
