# Reservas dentro de la ruta · 1 · ¿Qué te parece esta propuesta?

**Este paso es solo para pensar.** No cambies código ni hagas commit. Lee la propuesta, mira el motor y los datos de Roma, y contéstame con tu opinión sincera. Si algo no te convence o ves un riesgo, dilo claramente. **Si puede haber un % de fallo, preferimos no hacerlo.**

Contesta en español sencillo, sin jerga: el usuario tiene que entenderlo.

## El problema (ya lo conoces)

Cuando el viajero tiene una entrada o una excursión reservada, su día y su hora pueden no coincidir con la ruta.

- Tu medición en unos 330 días de Roma: las rutas van pegadas y casi no hay margen alrededor de las paradas con entrada.
  - Coliseo y Museos Vaticanos: 0 % de días con 15 min libres después.
  - Galería Borghese: 0 % antes.
- Por eso hemos descartado dos cosas:
  - que el motor rehaga el día solo, con libertad total;
  - quitar los horarios.

## La propuesta

### 1. Cada parada tiene un nivel

| Nivel | Qué es | Qué puede pasarle |
|---|---|---|
| 1. Reservado | Una entrada o excursión que el viajero ya tiene | Nada. Fecha y hora fijas (ya es así) |
| 2. Imprescindible | Lo que nunca puede faltar en un viaje a ese destino. Tiene dos escalones: **joya** e **imprescindible** (abajo) | Puede cambiar de hora o de orden dentro de su día. **Nunca desaparece del viaje.** Si no cabe, no se quita: sale un aviso en la campana |
| 3. Si entra | Sitios cercanos que suman (en Roma: Plaza del Campidoglio) | Se quita si no cabe |
| 4. Paseo | «Pasea y piérdete por…», paseos entre paradas | Se encoge (por ejemplo, de 45 a 10 min) o se quita |
| 5. Opcional | Como Santa Cecilia (regla 426) | Se quita |

**Imprescindibles de Roma** (elegidos por el usuario), en dos escalones:
- **Joyas:** Coliseo, Museos Vaticanos y Capilla Sixtina, Panteón y Fontana di Trevi.
  - Siempre con su visita entera y en su mejor momento del día.
- **Imprescindibles:**
  - Foro y Palatino, y Arco de Constantino;
  - Basílica y Plaza de San Pedro;
  - Altar de la Patria (con Piazza Venezia);
  - Castillo de Sant'Angelo, por fuera (punto 4);
  - Piazza Navona y Plaza de España;
  - Trastevere.
  - Tampoco desaparecen nunca. Pero, si hace falta sitio para una joya o una reserva, pueden quedarse en su versión corta: de paso y por fuera, con sus minutos curados. Por ejemplo, el Altar con Piazza Venezia, 15 min.

Es un dato de cada destino, nunca del código. Dime si encaja con los niveles que ya tiene Roma (joyas e imprescindibles del nivel 1, y el campo de minutos de paso).

### 2. Cada entrada tiene su grupo, y el grupo es su día

Las paradas con entrada van siempre con su grupo. Sea cual sea la hora de la reserva, ese día lleva siempre las mismas paradas principales. Lo único que cambia es el orden del grupo y los paseos o paradas sueltas de alrededor.

- **Coliseo**
  - Siempre: Coliseo, Arco de Constantino, Foro, Palatino y Altar de la Patria con Piazza Venezia.
  - Si entra: Plaza del Campidoglio. Es una plaza: 15-20 min bastan.
  - Dos órdenes:
    - **Coliseo primero** (entradas temprano): Coliseo, Arco, Foro, Palatino, Campidoglio y Altar.
    - **Foro primero** (entradas de mediodía o tarde): Altar, Campidoglio, Foro, Palatino, Arco y Coliseo.
  - Comprobado en la web oficial (colosseo.it, entrada «Colosseo, Foro Romano, Palatino»):
    - el Foro y el Palatino se pueden visitar el mismo día o dentro de las 24 h **antes o después** de la hora del Coliseo;
    - hay una entrada a cada sitio;
    - en el Coliseo se puede estar como mucho 75 min.
- **Vaticanos**
  - Siempre: Museos y Sixtina, Basílica, Plaza de San Pedro, Via della Conciliazione y Castillo.
  - Dos órdenes:
    - Museos primero y Basílica después;
    - o Basílica primero, si la entrada a los Museos es tarde.
  - Comprueba en la web oficial que el orden «Basílica primero» funciona todo el año: horario de la Basílica por temporada, audiencias de los miércoles y domingos cerrados. Dime lo que encuentres, con su fuente.
- **Panteón**
  - Ahora tiene entrada con hora: turnos de hasta 1.200 personas, 7 €. Cierra durante las misas, el 25 de diciembre y el 1 de enero. Fuente: cultura.gov.it/luogo/pantheon.
  - Va con su día del centro: Trevi, Navona y Plaza de España. Si está reservado, el resto se ordena alrededor.
- **Galería Borghese** (propuesta, el usuario todavía no la ha confirmado): Galería, parque de Villa Borghese y terraza del Pincio, bajando después a Plaza del Popolo.
- **Fontana di Trevi** no tiene hora:
  - desde el 2 de febrero de 2026 cuesta 2 € de 9:00 a 22:00 (los viernes desde las 11:30), sin reserva;
  - después de las 22:00 es gratis;
  - nunca choca con nada.

### 3. Lo único que puede tocar el motor

El motor no inventa nada. Solo puede, por este orden:

1. no cambiar nada, si la reserva ya cuadra;
2. encoger un paseo cercano;
3. quitar una parada opcional o «si entra»;
4. cambiar el orden del grupo (una de las dos maneras escritas);
5. **si la reserva es de otro día:**
   - pasar el grupo entero a ese día, y el día que estaba ahí ocupa su hueco;
   - solo si ese otro día abre en la nueva fecha y conserva todos sus imprescindibles;
6. **si nada funciona:**
   - aviso en la campana de notificaciones;
   - solo el tramo afectado (la mañana o la tarde) pasa a manos del viajero;
   - el resto del día sigue curado.

**Nunca puede:**
- quitar un imprescindible;
- mover lo reservado;
- poner algo con el sitio cerrado;
- romper el atardecer.

Cada cambio se deshace con la varita del día («Volver a mi ruta original»).

### 4. El Castillo de Sant'Angelo: por fuera + «Entra si quieres»

Comprobado en cultura.gov.it/luogo/castel-santangelo:
- cierra los lunes, el 1 de enero y el 25 de diciembre;
- la entrada cuesta 18 € y va a nombre de quien la compra (hay que enseñar el documento);
- la visita oficial se calcula en 1 h 30 a 2 h.

La propuesta:
- **Imprescindible:** verlo por fuera, con el puente de Sant'Angelo. Unos 20 min, todos los días, también los lunes. Es la regla de «por fuera» que ya tenemos.
- **«Entra si quieres»:** unos 40 min más, hasta 1 h en total.
  - Esos 40 min son paseo: lo primero que se encoge si una entrada de los Vaticanos necesita sitio.
  - Los lunes no sale, porque está cerrado.
  - El texto no promete la visita entera: «Si quieres entrar, calcula al menos 1 hora para subir a la terraza».

### 5. Una pregunta en el formulario

¿Preguntar al crear el viaje si ya tiene entrada? La idea del usuario:
- «¿Ya tienes entrada para el Coliseo?»
- «¿Ya tienes entrada para los Vaticanos?»

Lo que proponemos:
- **una sola pregunta, opcional y plegada:** «¿Ya tienes alguna entrada con hora?»;
- dentro, los sitios con entrada del destino (en Roma: Coliseo, Vaticanos, Panteón, Galería) y, en cada uno, el día y la hora;
- solo si el viaje tiene fechas.

Así la ruta se monta desde el principio con la reserva en su sitio, sin ningún choque. Quien compre la entrada después sigue teniendo «Añade tu reserva».

### 6. Llegar antes de la hora de la entrada

Con entrada reservada hay que estar en la puerta un rato antes. **Decidido por el usuario: siempre 30 min antes, en todos los sitios**, aunque la web oficial pida menos. Lo oficial, para que lo tengas:
- **Coliseo** (comprobado en su Reglamento de visitantes, art. 7.3, colosseo.it):
  - entrada normal (Coliseo, Foro y Palatino): hay que presentarse 15 min antes, y como mucho 15 min después de la hora;
  - si llegas más tarde, pierdes el Coliseo y solo te vale para el Foro y el Palatino;
  - la Full Experience con subterráneos: 30 min antes, sin ninguna tolerancia;
  - control con detector de metales en la entrada.
- **Vaticanos, Galería y Panteón:** búscalo en sus webs oficiales. Si alguno pide **más** de 30 min, dímelo.

La propuesta:
- 30 min antes en todos los sitios con entrada (un dato general, que se puede subir en un sitio si su web pide más);
- la parada anterior termina a tiempo para llegar con ese margen;
- la tarjeta lo dice junto a la hora, sin más: «Llega 30 min antes»;
- el Coliseo lleva, **dentro de su ficha** (en Tips, no en la tarjeta), el aviso: «Si llegas más de 15 min tarde, pierdes la entrada al Coliseo (te sigue valiendo para el Foro y el Palatino)».

**Regla general (a INVARIANTES, todos los destinos):** la información práctica de cada lugar va siempre dentro de su ficha, en Tips o en Entradas, como información de valor. Por ejemplo: llegar antes, qué pasa si llegas tarde, qué incluye la entrada, que va a tu nombre. La tarjeta solo lleva lo de siempre: hora, nombre, foto, horario, duración y avisos cortos.

¿Cómo lo hace hoy el motor con las horas fijas, y cuánto margen deja antes?

### 7. Horas más redondas

Al encoger o quitar paseos, el día no tiene que ir más apretado. El usuario prefiere que se use para dar aire al viajero, con horas más redondas.
- Cada parada empieza en la siguiente hora redonda de esta lista: **:00, :15, :20, :30, :40 o :45**.
  - Siempre hacia arriba, nunca hacia abajo: nunca se recorta una visita.
  - Los minutos que sobran son unos minutos de respiro para el viajero entre parada y parada.
  - Ejemplo del usuario: Trevi a las 11:00, 30 min de visita (11:30), 8 min andando hasta el Panteón (11:38): el Panteón va a las **11:40**. Mide también la variante «con al menos 5 min de respiro», que lo pondría a las **11:45**, y dime cuánto cuesta cada una en un día entero.
- Las horas fijas (una entrada a las 11:15, el atardecer, una recogida) mantienen su hora real.
- Las paradas pegadas, a menos de 200 m, siguen encadenadas sin redondear.
- Si los redondeos de un día suman demasiado, primero se encogen los paseos. Nunca se quita un imprescindible por redondear.

Según las notas del usuario, desde el 30-9-2026 las horas y duraciones que ve el viajero van de 5 en 5 minutos (antes era :00 o :30), y los minutos andando son exactos. La lista nueva sustituiría a eso. ¿Es así hoy en el motor? ¿Cuántos minutos se perderían o ganarían con la lista?

### 8. El Free Tour funciona como una reserva

El Free Tour tiene hora fija, como una entrada.
- **Si el viajero lo elige en el formulario,** la ruta lo pone a una de sus horas reales. Cuando añade su reserva, manda la hora de la reserva: queda fijado, igual que una entrada (nivel 1).
- **Si no lo eligió en el formulario,** tiene que poder añadirlo después. Propuesta del usuario: desde **«Añadir parada»**, con una tarjeta «Free Tour por {destino}» arriba del todo. Al tocarla:
  - eliges el día y una de sus horas;
  - la ruta se recoloca con las mismas reglas que una reserva: se encogen los paseos, se quitan los opcionales, se cambia el orden del grupo y nunca se pierde un imprescindible.
- **Si ya lo tiene reservado,** también entra por «Añade tu reserva».
- **Cuando está reservado, se marca igual que una entrada:** en el día cerrado, «🔒 Free Tour · 10:00»; en la parada, franja verde y «Reservada ✓ · Fijada». Hoy el Free Tour no se puede reservar en la app, así que todavía no se marca: tiene que entrar con esto.
- **Se mantiene cómo funciona hasta ahora:**
  - hoy en Roma no hay Free Tours antes de las 10:00. Lo que haya antes de su hora, a primera hora, son imprescindibles sin gente, que es una experiencia completamente distinta;
  - **no lo dejes fijo en las 10:00:** la hora sale siempre de los datos de cada Free Tour. Si algún día hay uno más temprano, la mañana de antes simplemente es más corta (o no hay);
  - el Free Tour no entra en los sitios. Por eso el Panteón por dentro puede ir el mismo día, y no se quita ninguna parada porque el Free Tour pase por delante;
  - comprueba las horas reales de los Free Tours de cada destino. No te las inventes.

  Dime cómo lo hace hoy el motor, para que añadirlo después funcione igual.

## Qué quiero que me contestes

1. ¿Te parece bien la propuesta? ¿Qué cambiarías?
2. ¿Qué parte ya hace el motor hoy (la parada que se estira, las opcionales, las horas fijas hacia atrás de la regla 427) y qué falta?
3. ¿Dónde puede fallar? Dame casos concretos de Roma: días de la semana, temporadas, viajes cortos, la llegada y la vuelta.
4. ¿Cómo lo probarías para estar seguros de que hay 0 fallos? Por ejemplo: con las horas reales de entrada, en las 365 fechas y en los 56 viajes.
5. ¿Qué datos necesitas que todavía no tenemos? Por ejemplo, los turnos reales de los Vaticanos, el Panteón y la Galería, sacados de sus webs oficiales.
6. La pregunta del formulario: ¿la ves bien? ¿Dónde iría y qué pasa si el viaje no tiene fechas?
7. Las horas redondas: ¿cómo redondea hoy el motor, y qué pasaría con la lista nueva?
8. **Los vuelos.** ¿Vale este mismo sistema para la hora de llegada y la de salida? Es decir:
   - la llegada y la salida son horas fijas, como una reserva;
   - si el primer o el último día se acortan, primero se encogen los paseos y se quitan los opcionales;
   - si aun así no caben, el grupo de ese día (por ejemplo, el del Coliseo) se pasa entero a otro día, con las mismas reglas;
   - nunca se pierde un imprescindible.

   ¿Qué hace hoy el motor con los vuelos y qué cambiaría? ¿Se puede medir en la misma prueba del paso 2, con llegadas, por ejemplo, a las 9, 12, 15, 18 y 21 h, y salidas a esas mismas horas?
9. **El Free Tour:** ¿cómo lo coloca hoy el motor? ¿Te parece bien añadirlo desde «Añadir parada», o ves un sitio mejor? Si se añade después, ¿la mañana antes de las 10:00 y el resto del día quedan igual que cuando se elige en el formulario?
10. ¿En qué pasos lo partirías, y cuánto trabajo es cada uno?
