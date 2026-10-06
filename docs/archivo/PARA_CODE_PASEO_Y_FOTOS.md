# Fuera el «aperitivo»: llega «Pasea y piérdete por {zona}». Y fotos de San Pedro

Commit por parte y push al final. Comprueba cada punto a 390 px (móvil), con capturas.

Si ya hiciste PARA_CODE_TARDE_VATICANO (punto 5, el aperitivo invisible) y el repaso de diseño 4 (punto 4), esto va encima de lo que dejaste: no lo deshagas, adáptalo.

## 1. El rato antes de cenar: «Pasea y piérdete por {zona}»

Hoy el tiempo que sobra antes de la cena sale como una tarjeta de aperitivo («Aperitivo en Campo de' Fiori y la Plaza Farnese», «Trastevere al anochecer y aperitivo»…). Decisión del usuario: deja de ser un aperitivo y pasa a ser un paseo, que es lo que es.

- **Nombre:** «Pasea y piérdete por {zona}». Por ejemplo, «Pasea y piérdete por Campo de' Fiori y la Plaza Farnese» o «Pasea y piérdete por Trastevere».
  - Cambia todos los nombres que hoy llevan «aperitivo»: en el motor, en roma.json, en los días escritos y en sus variantes (también los de Navidad, invierno y el 25 de diciembre).
  - En los de Navidad, el nombre se queda con las luces: «Pasea y piérdete entre las luces de Via del Corso y Via Condotti».
  - En el informe, pon la lista de todos los nombres, antes y después.
- **Etiqueta e icono:** la etiqueta «Paseo libre» en lugar de «Aperitivo», y el icono del muñequito andando en lugar de la copa.
- **El aperitivo, como consejo dentro de la ficha** (pestaña Tips o Resumen, lo que encaje mejor). Texto:
  > A esta hora los romanos se toman un spritz o una copa de vino antes de cenar. Si te apetece, siéntate en una terraza y mira pasar la ciudad.
- **Foto:** la foto de día de esa zona, como cualquier parada (ver la regla del punto 3).
  - Si no hay foto de la zona, un color neutro de la app. **Nunca el degradado naranja y rosa** que sale ahora, que parece un atardecer aunque sea diciembre a las 19:20 y de noche cerrada. Ese degradado no sale en ninguna tarjeta que no sea de atardecer.
- **Mismo sitio que la parada de antes: no hay tarjeta aparte.**
  - Ejemplo de hoy: Campo de' Fiori a las 18:50 (30 min) y justo después «Aperitivo en Campo de' Fiori y la Plaza Farnese» a las 19:20 (30 min). Es el mismo sitio dos veces seguidas.
  - Tiene que salir una sola parada: Campo de' Fiori, 18:50, 60 min, y dentro de la ficha el consejo de arriba.
  - Vale para cualquier zona: si el paseo cae en la misma zona que la parada anterior, esa parada se alarga y no sale el paseo.
- **Lo de siempre:** 90 min como mucho, y si sale de menos de 20 min no aparece. La cena dice «X min andando desde…» el sitio real de justo antes, nunca «desde el aperitivo».
- **Pruebas:** busca en las 365 fechas cuántos días tienen un paseo en la misma zona que la parada anterior, y que queden en 0. Añádelo a la prueba para que salte solo.
- **A INVARIANTES:** «El rato libre antes de cenar es "Pasea y piérdete por {zona}". Nunca va en el mismo sitio que la parada de antes: si coincide, se alarga esa parada».

## 2. Fotos nuevas: San Pedro, el Pincio y Villa Borghese

En el día del Vaticano en Navidad, «Plaza de San Pedro y los 100 Presepi» y «Basílica de San Pedro» salen **con la misma foto** (la del árbol). Cada una tiene que llevar la suya.

Las fotos nuevas están en `docs/archivo/fotos_roma_nuevas3/`. Prepáralas igual que las otras (1.600 px y 640 px, en `public/fotos/roma/`). La de Navidad mide 1.500 px: úsala tal cual, sin ampliarla. Crédito: de momento sin línea de crédito, como la tanda anterior.

| Foto | Parada | Cuándo |
|---|---|---|
| `navidad_noche_plaza_san_pedro.jpg` | Plaza de San Pedro (con el árbol y el belén) | solo en las fechas de Navidad en que están el árbol y el belén (la misma ventana que ya usas para los 100 Presepi). Igual que en Plaza de España, en Navidad va esta aunque la parada sea de día. |
| `dia_plaza_san_pedro.jpg` | Plaza de San Pedro | el resto del año |
| `dia_basilica_san_pedro.jpg` | Basílica de San Pedro | todo el año, también en Navidad |
| `cupula_basilica_san_pedro.jpg` | Cúpula de San Pedro | todo el año, en todas las tarjetas y fichas de la Cúpula |
| `dia_terraza_pincio.webp` | Terraza del Pincio | de día, todo el año (en la nocturna del Pincio no) |
| `dia_parque_villa_borghese_templo_esculapio.jpg` | Parque de Villa Borghese (y el lago y el Templo de Esculapio) | de día, todo el año. Es pequeña (750 px): úsala tal cual, sin ampliarla. |
| `dia_jardines_pincio_hidrocronometro.jpg` | Jardines del Pincio (es el reloj de agua, el Hidrocronómetro) | de día, todo el año. Es pequeña (783 px): úsala tal cual, sin ampliarla. |

- **Regla nueva (a INVARIANTES y a la prueba):** nunca la misma foto en dos tarjetas del mismo día. Busca en las 365 fechas cuántos días la repiten hoy, dime cuáles y que queden en 0.

## 3. Las fotos de noche, solo en las experiencias nocturnas

Plaza de España a las 10:05 sale con `amanecer_plaza_espana.jpg`: cielo rosa y farolas encendidas. Aunque sea de amanecer, parece de noche, y a las 10 de la mañana no tiene sentido.

- **Regla (a INVARIANTES, sustituye a la de antes):** todo lo que parezca de noche (noche, anochecer, amanecer con farolas encendidas…) va **solo en las experiencias nocturnas**. Las paradas normales, los paseos antes de cenar y las comidas llevan siempre foto de día, aunque caigan después del atardecer.
- **Única excepción: las fotos de Navidad** (el árbol de Plaza de España, el de San Pedro, el mercadillo de Navona…), que van en sus fechas aunque la parada sea de día.
- **`amanecer_plaza_espana.jpg`:** pasa a la experiencia nocturna de Plaza de España. Para Plaza de España de día, vuelve a poner la foto que tenía antes (búscala en el historial de git) hasta que el usuario pase una nueva.
- **Revisa todas las fotos de Roma:** dime cuáles parecen de noche o de anochecer y en qué paradas de día salen hoy, y pásalas a su experiencia nocturna. Si una parada se queda sin foto de día, dímelo en el informe.

## 4. Al lado de un imprescindible, aunque esté cerrado: se ve por fuera

En el mismo día sale Trinità dei Monti a las 10:25 con el aviso en rojo «Todavía no ha abierto (abre a las 12:00)». Está en lo alto de la escalinata de Plaza de España: lo lógico es subir, verla por fuera, hacerse fotos y disfrutar de las vistas, no quitarla ni moverla a otra hora.

- **Regla general (a INVARIANTES, todos los destinos):** si estás visitando un imprescindible o un lugar de nivel 1, y al lado (5 min andando o menos) hay otro lugar que merece la pena ver, ese lugar entra **por fuera** cuando a esa hora está cerrado. Así se ve la fachada, se hacen fotos y se sigue la ruta.
  - Sale con su etiqueta «Por fuera», con su tiempo de visita por fuera, y **sin el aviso rojo**.
  - Dentro de la ficha, una línea con el horario por si quieres volver a entrar: «Por dentro abre de {hora} a {hora}».
  - **Solo vale para los sitios cuyo exterior merece la pena por sí mismo:** los que tienen curados sus minutos por fuera (`minutos_fuera`). Si un sitio no tiene ese dato, o lo que se va a ver está solo dentro, no va por fuera: se coloca a una hora en que esté abierto. Por ejemplo, San Luigi dei Francesi (los Caravaggio) o Santa Maria della Vittoria (el Éxtasis de Santa Teresa de Bernini): por fuera no tienen nada, y mandarte allí cerrados sería como no ir.
  - En el informe, dime qué sitios de Roma tienen `minutos_fuera` y cuáles no, por si falta alguno que sí merezca la pena por fuera (como Trinità dei Monti).
  - La regla no cambia el orden de la ruta: la parada se queda donde está y solo pasa a «Por fuera». Los minutos que sobran los absorbe la parada que se estira, como ya pasa hoy.
- **Trinità dei Monti:** comprueba su horario en la web oficial y corrígelo si está mal. Con la regla, al lado de Plaza de España va por fuera cuando esté cerrada.
- **Prueba:** busca en las 365 fechas cuántas paradas salen con «Todavía no ha abierto» o «Ya ha cerrado» a su hora. Que queden en 0: o van por fuera con esta regla, o se mueven a cuando estén abiertas. Añádelo a la prueba para que salte solo, y dime cuántas había y cuáles pasaron a «Por fuera».

## 5. D4 reescrito: la Galería Borghese con su parque

**Lo que sale hoy** (viaje de 4 días, invierno):
- Plaza de España 10:05 → Trinità dei Monti 10:25 (cerrada) → 19 min por la calle → Galería Borghese 11:00;
- comida 13:15-14:10;
- «Tiempo libre» 14:10 con «Una idea: pasear por el Centro Histórico»;
- 23 min por la calle → Ara Pacis 14:35 → Via Margutta y Via del Babuino → Piazza del Popolo → Jardines del Pincio → Terraza del Pincio 16:40.

**Qué falla:**
- vas a la Galería, que está dentro del Parque de Villa Borghese, y no pisas el parque;
- en la versión de invierno (A) no hay lago ni Templo de Esculapio;
- de la Galería al Ara Pacis cruzas 2 km de calles y luego vuelves a subir al Pincio;
- hay un «Tiempo libre» del formato viejo.

**Regla (a INVARIANTES):** la Galería Borghese nunca va sola: siempre con el Parque de Villa Borghese, como parada con su nombre. Y nunca se cruza a pie por la calle algo que se puede cruzar por el parque.

### D4 nuevo

**Mañana, igual en las 4 versiones.** La hora de la Galería manda: lo de antes se coloca hacia atrás desde ella.
1. Plaza de España, a primera hora, con la escalinata vacía (20 min).
2. Trinità dei Monti (10 min). Por fuera si está cerrada, con la regla del punto 4.
3. Subes por Via Sistina y Via di Porta Pinciana y entras al parque por la Porta Pinciana. Así no pasas por el Pincio, que queda para la tarde.
4. Parque de Villa Borghese: Piazza di Siena, de camino a la Galería (unos 30 min).
5. Galería Borghese, en su turno de las 11:00.
6. Comida cerca de la Galería (Pinciana, Via Veneto), a 15 min como mucho.

**Tarde A (invierno, se pone el sol pronto).** Primero el parque, para llegar al Pincio con el atardecer; lo de abajo, después, ya con las luces.
1. Parque de Villa Borghese: el lago y el Templo de Esculapio (la parada que se estira).
2. Jardines del Pincio (20 min).
3. Terraza del Pincio, al atardecer.
4. Bajas a Piazza del Popolo.
5. Santa Maria del Popolo, por dentro si está abierta: los Caravaggio.
6. Ara Pacis, si a esa hora aún se entra; si no, por fuera.
7. Via Margutta y Via del Babuino (30 min).
8. Plaza de España de noche, como nocturna.
9. Cena.

**Tardes B y C (primavera y otoño, la tarde es larga).** Bajas por el parque y vuelves a subir al Pincio para el atardecer.
1. Parque de Villa Borghese: el lago y el Templo de Esculapio (la parada que se estira).
2. Jardines del Pincio.
3. Bajas a Piazza del Popolo.
4. Ara Pacis.
5. Via Margutta y Via del Babuino (30 min).
6. Santa Maria del Popolo, por dentro.
7. Subes a la Terraza del Pincio, al atardecer.
8. Bajas a cenar por el Tridente, y después la nocturna (Plaza de España de noche).

La Terraza solo es parada una vez, al atardecer: al bajar por el Pincio antes, se pasa «De camino».

**Tarde D (verano, el sol se pone durante la cena).** De 14:00 a 16:30, sombra y sitios cerrados, con la regla de verano.
1. Parque de Villa Borghese, a la sombra: el lago y el Templo de Esculapio (la parada que se estira).
2. Jardines del Pincio.
3. Bajas a Piazza del Popolo.
4. Santa Maria del Popolo.
5. Ara Pacis.
6. Via Margutta y Via del Babuino (30 min).
7. Cena por el Tridente.
8. Después de cenar, la Terraza del Pincio de noche (está abierta siempre) o Plaza de España de noche, lo que el motor vea mejor.

**Variantes:** la del lunes (D4M, la Galería cierra) y las demás que ya tengas se quedan, pero repásalas con esta misma regla: nada de cruzar por la calle lo que se cruza por el parque, y el parque siempre con la Galería.

**Antes de escribirlo, comprueba en las webs oficiales:**
- los turnos de la Galería, con cuánta antelación hay que llegar y cuánto dura la visita (hoy la tarjeta dice «2h 5min»);
- el horario del Ara Pacis y su última entrada;
- a qué hora abre Santa Maria del Popolo por la tarde.

Si algo no cuadra con estas horas, no lo fuerces: dime qué opciones ves, con sus horas, antes de cambiarlo.

**«Tiempo libre»:** con esto, ese rato desaparece (y el bloque entero se quita de la app: punto 7).

**Prueba:**
- en los 56 viajes y en las 365 fechas, ningún día con la Galería sin el parque;
- ningún tramo andando de más de 15 min por la calle cuando hay un camino por el parque.

Añádelo a la prueba para que salte solo.

## 6. Fotos que no son del sitio: un perro en Via Margutta

En el mismo día, «Via Margutta y Via del Babuino» sale con la foto de un perro. Seguramente es una de las fotos que se buscaron solas en Unsplash y nadie revisó a ojo.

- **Quita ya la del perro.** Hasta que el usuario pase una buena, Via Margutta va sin foto (el color neutro de la app).
- **Hoja de contactos:** prepara una página (por ejemplo `docs/revision_fotos_roma.html`) con **todas** las fotos de Roma, cada una con el nombre de la parada, cuándo sale (de día, de noche, Navidad) y de dónde viene (propia, Unsplash, Wikipedia…). Así el usuario las revisa todas de una vez y te dice cuáles cambiar.
- Marca en esa hoja, para que se vean primero, las que se buscaron solas y nadie ha revisado.

## 7. Fuera el «Tiempo libre»

Decisión del usuario: el bloque «Tiempo libre» («Tienes 20 min libres antes de la siguiente parada… Una idea: pasear por el Centro Histórico») **desaparece de la app**. Es un hueco con una idea genérica, sin sitio, sin tarjeta y sin foto.

Cuando entre dos paradas sobre tiempo:
- **Menos de 20 min:** no sale nada. Se suma a la parada de antes o queda como margen del camino.
- **20 min o más:**
  - si hay un sitio de la ruta de camino, entra ese sitio como parada;
  - si no lo hay, pero la zona merece un paseo, sale la tarjeta **«Pasea y piérdete por {zona}»** (la del punto 1), a cualquier hora del día y no solo antes de cenar;
  - si no hay ni sitio ni zona que merezca la pena, se recolocan las horas (la parada que se estira, o la siguiente un poco antes). Nunca un texto con «Una idea…».
- **Lo que pone el viajero no se toca.** Ni los días que hace él (con «+ Añadir día», con «lo organizo yo» o, más adelante, la ruta manual), ni la tarde libre de las excursiones de medio día, ni las paradas que añade con «Añadir parada». Ahí no entra nada de esto: ni paseos, ni paradas que se estiran, ni horas recolocadas. **Solo** se calcula el tiempo de una parada a la siguiente y la recomendación de «Rutas» (andando, bus, metro…).
- **A INVARIANTES:** «En lo que hace el viajero (días libres, ruta manual, Añadir parada) el motor no rellena ni recoloca nada: solo calcula el tiempo entre paradas y el transporte recomendado».
- Quita el bloque del motor, del código de la pantalla y de los textos. Busca en las 365 fechas y en los 56 viajes cuántos «Tiempo libre» salían, en qué días, y qué ha ido en su lugar en cada caso. Tienen que quedar en 0. Añádelo a la prueba para que salte solo.
- **A INVARIANTES:** «No existe el "Tiempo libre". El tiempo que sobra va a una parada con nombre, a "Pasea y piérdete por {zona}" o a recolocar las horas».

**Informe corto:** el D4 nuevo en sus 4 versiones con sus horas, parada a parada (y capturas de un viaje de 4 días en invierno, antes y después), de Plaza de España y Trinità de día, del día del Vaticano en Navidad y fuera de Navidad, y de un día con Campo de' Fiori antes de cenar, antes y después.
