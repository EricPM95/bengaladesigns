# Trabajo para Code · 1 de octubre de 2026

Ocho pasos, **en este orden**. Cada paso lleva sus propias instrucciones de commit, push e informe: síguelas.

- Al acabar cada paso, escribe su informe corto en `docs/INFORME_2026-10-01.md` (un apartado por paso) y sigue con el siguiente sin esperar.
- Párate y pregunta solo si algo no se puede deshacer, o si una prueba sale peor que antes.
- Si un paso posterior cambia algo de uno anterior (por ejemplo, el aperitivo de los pasos 3 y 4 pasa a «Pasea y piérdete por {zona}» en el paso 5), manda el posterior.
- Las fotos nuevas del paso 5 están en `docs/archivo/fotos_roma_nuevas3/`.

---

# Paso 1 · No subir los prompts a GitHub

Los prompts de `docs/archivo/` son notas de trabajo y no tienen que estar en GitHub.

- Añade `docs/archivo/` al `.gitignore`.
- Si ya hay archivos de esa carpeta subidos, sácalos de git sin borrarlos del ordenador (`git rm -r --cached docs/archivo`).
- `docs/diseno/` sí se queda en git.

Commit y push.

---

# Paso 2 · Llegada y vuelta

*Llegada y vuelta: los aeropuertos salen de Reservas*

Decisión:
- La vuelta es en el mismo medio que la llegada. No se añade ninguna fila ni pregunta para elegir otro medio.
- Los datos reales de cada trayecto (aeropuerto o estación y hora) salen de lo que el viajero pone en **Reservas**. Allí se añaden los vuelos pegando el email de confirmación o subiendo la captura o el PDF, y la IA saca los datos.

Comprueba, y arregla si hace falta:

1. **Cada trayecto con lo suyo:** al guardar en Reservas un vuelo de ida y otro de vuelta, la barra de la llegada usa el aeropuerto y la hora del de ida, y la de la vuelta los del de vuelta, aunque los aeropuertos sean distintos (por ejemplo, llegar a Fiumicino y volver desde Ciampino).
2. **Todo al día:** con esos datos se actualizan el Resumen, los Traslados, los Tips y «Tu última tarde» de cada ventana, y el último día se recoloca con la hora de salida, como ya pasa hoy.
3. **«+ AÑADIR VUELO» de la barra:** lleva a Reservas para añadir ese vuelo; no a otro formulario distinto. Lo mismo con tren, autobús y ferry.
4. **Sin reserva:** la barra sale como hoy (por ejemplo, «AVIÓN DESDE BARCELONA», con el aeropuerto principal del destino).
5. **Si se borra o se cambia una reserva,** las barras y las ventanas vuelven a cambiar solas.
6. **Tren:** lo mismo con la estación (por ejemplo, llegar a Termini y salir de Tiburtina).

7. **Los textos, según el sitio de llegada y de salida.** Cada aeropuerto, estación, terminal de autobús o puerto tiene sus propios textos en las tres pestañas (Resumen, Traslados, Tips) y en «Tu última tarde». Llegar a Ciampino no es como llegar a Fiumicino: cambian el transporte al centro, el tiempo y lo que conviene saber.
   - **Qué hay hoy:** dime, para Roma, qué sitios de llegada y salida tienen ya sus textos en `_llegada.json` y cuáles no. Como mínimo: Fiumicino, Ciampino, Termini, Tiburtina, la terminal de autobuses de Tiburtina y el puerto de Civitavecchia (ferry).
   - **Lo que falte:** escribe un borrador con sus textos, en «tú» y con el tono de los que ya hay. Cada precio, horario y tiempo de trayecto, comprobado en la web oficial (la del aeropuerto, Trenitalia, ATAC, la naviera…), con su fuente y su fecha de «comprobado». En esta ventana sí van precios.
   - **Qué sitios salen:** solo los que existen de verdad desde el origen del viajero, con la misma lógica de las barras de hoy (la vía que no existe para ese trayecto no carga su barra). Por ejemplo, desde Barcelona: avión a Fiumicino o Ciampino, y ferry a Civitavecchia.
   - **La vuelta:** «Tu última tarde» y la hora límite cambian según el sitio de salida (a Ciampino se tarda distinto que a Fiumicino). Comprueba que se usan los tiempos de ese sitio y no los del principal.
   - **Para todos los destinos (a INVARIANTES y a METODO_DESTINOS):** al curar un destino, cada sitio de llegada y salida lleva sus propios textos, comprobados en la web oficial.
   - No subas los textos nuevos: déjalos en un borrador para revisarlos antes.

Commit y sin push. **Informe corto** con capturas de un viaje con reserva de ida a Fiumicino y de vuelta desde Ciampino: las dos barras y las dos ventanas. Y la lista del punto 7: qué sitios tenían textos, cuáles faltaban y el borrador de los nuevos.

---

# Paso 3 · Diseño de la pestaña Días

*Repaso de diseño 4 (pestaña Días)*

Commit por parte y push al final. Comprueba cada punto a 390 px (móvil) y en escritorio, con capturas.

1. **Resumen del día:** la línea de datos del día («6 PARADAS · 8 KM A PIE…») lleva **20 px de margen abajo**, hasta lo siguiente.
2. **Cabeceras de franja:** más margen arriba en «MAÑANA», «TARDE» y «NOCHE», para separarlas más de lo de encima. De 28 px a **40 px**, y los 12 px de abajo se quedan.
3. **Fotos de las tarjetas:** la zona de la foto, **el doble de ancha** que ahora. Se mantienen la diagonal y la banda de color con su icono. Nombre, horario y etiquetas siguen cabiendo sin cortarse a 390 px. Si hace falta, el nombre pasa a dos líneas antes que cortarse. Vale para todas las tarjetas: paradas, de noche y aperitivo.
4. **Puntitos sueltos:** en la línea del día salen puntitos («·») sin nada al lado. Por ejemplo, debajo de «De camino · Borgo Pio» y debajo de la cabecera «NOCHE». Si son elementos vacíos, que no se pinten. Y si hay un aperitivo o un rato libre que no se ve, que se vea: la cena dice «12 min andando desde el aperitivo» y no hay tarjeta de aperitivo encima.

---

# Paso 4 · La tarde del Vaticano

*Fuera la regla de «no repetir de noche»*

**Decisión del usuario:** se quita la regla que impide ver de noche un sitio que ya has visto de día, sea esa misma tarde o a la mañana siguiente.

Ver algo de día y volver de noche es otra experiencia y vale la pena. Por ejemplo: bajar por Via della Conciliazione al Castillo y al Puente Sant'Angelo con el atardecer, cenar cerca y volver al Puente de noche, o irse al centro de noche.

El ejemplo que lo ha destapado: un viaje de 4 días en verano, día 1 (Vaticano).
- La Basílica termina a las 19:25 y luego solo hay «De camino · Borgo Pio».
- La cena es a las 20:30 («12 min andando desde el aperitivo», pero no se ve ningún aperitivo).
- El Puente Sant'Angelo va a las 22:00 como nocturna, con la etiqueta «Revisita».
- Falta el paseo de la tarde por Via della Conciliazione, el Castillo por fuera y el Puente al atardecer.

Qué hacer:

1. **Quitar la regla.** Quítala del motor y de INVARIANTES (la 413 o la que sea), y la comprobación «noche y mañana siguiente» de la prueba de repeticiones. Las otras dos comprobaciones se quedan, porque son de día: Trevi a las 8:30 el día del Free Tour que pasa por Trevi, y el mismo barrio dos veces de día.
2. **El día del Vaticano lleva siempre Via della Conciliazione, el Castillo de Sant'Angelo y el Puente.**
   - Via della Conciliazione es el camino lógico entre San Pedro y el Castillo: siempre se va por ella, en el orden que toque (de San Pedro al Castillo o al revés).
   - **El atardecer, solo si cae bien.** Si la hora del atardecer de esas fechas encaja con la salida de la Basílica, el Castillo y el Puente van con esa luz. Si no encaja, van a su hora y no pasa nada: no se fuerza ni se estira nada para que coincida.
   - Después, la cena cerca. La nocturna después de cenar puede volver al Puente o ir al centro, lo que el motor elija como mejor.
3. **Sin huecos antes de cenar.** Si después de la última visita queda más de 45 min antes de cenar y hay un sitio de la ruta a un paseo, va ese sitio. Busca en las 365 fechas cuántos días tenían ese hueco y cuántos quedan.
4. **Revisita en la nocturna:** la etiqueta «Revisita» no sale en las experiencias nocturnas. Ver de noche lo que viste de día es la gracia de la nocturna, no una repetición.
5. **El aperitivo invisible:** si la cena dice «desde el aperitivo», el texto tiene que decir desde dónde se va de verdad (la parada o el paseo de justo antes). El aperitivo pasa a «Pasea y piérdete por {zona}» en el paso 5.
6. **El día escrito se respeta:** el día del Vaticano lleva siempre Via della Conciliazione, el Castillo de Sant'Angelo (por dentro o por fuera) y el Puente, como está escrito. Nunca se quitan para cumplir una regla general. Busca en las 365 fechas cuántos días del Vaticano salen hoy sin alguno de los tres, dime por qué, y que queden en 0 (si el Castillo está cerrado ese día, va por fuera). Añádelo a la prueba para que salte solo.
7. **Pruebas:** las de siempre, igual o mejor.

Commit y push si sale bien. Informe corto con ese día antes y después, parada a parada.

---

# Paso 5 · Paseos, fotos, D4 y fuera el «Tiempo libre»

*Fuera el «aperitivo»: llega «Pasea y piérdete por {zona}». Y fotos de San Pedro*

Commit por parte y push al final. Comprueba cada punto a 390 px (móvil), con capturas.

Esto va encima de lo que dejaste en los pasos 3 (punto 4) y 4 (punto 5, el aperitivo invisible): no lo deshagas, adáptalo.

### 1. El rato antes de cenar: «Pasea y piérdete por {zona}»

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

### 2. Fotos nuevas: San Pedro, el Pincio y Villa Borghese

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

### 3. Las fotos de noche, solo en las experiencias nocturnas

Plaza de España a las 10:05 sale con `amanecer_plaza_espana.jpg`: cielo rosa y farolas encendidas. Aunque sea de amanecer, parece de noche, y a las 10 de la mañana no tiene sentido.

- **Regla (a INVARIANTES, sustituye a la de antes):** todo lo que parezca de noche (noche, anochecer, amanecer con farolas encendidas…) va **solo en las experiencias nocturnas**. Las paradas normales, los paseos antes de cenar y las comidas llevan siempre foto de día, aunque caigan después del atardecer.
- **Única excepción: las fotos de Navidad** (el árbol de Plaza de España, el de San Pedro, el mercadillo de Navona…), que van en sus fechas aunque la parada sea de día.
- **`amanecer_plaza_espana.jpg`:** pasa a la experiencia nocturna de Plaza de España. Para Plaza de España de día, vuelve a poner la foto que tenía antes (búscala en el historial de git) hasta que el usuario pase una nueva.
- **Revisa todas las fotos de Roma:** dime cuáles parecen de noche o de anochecer y en qué paradas de día salen hoy, y pásalas a su experiencia nocturna. Si una parada se queda sin foto de día, dímelo en el informe.

### 4. Al lado de un imprescindible, aunque esté cerrado: se ve por fuera

En el mismo día sale Trinità dei Monti a las 10:25 con el aviso en rojo «Todavía no ha abierto (abre a las 12:00)». Está en lo alto de la escalinata de Plaza de España: lo lógico es subir, verla por fuera, hacerse fotos y disfrutar de las vistas, no quitarla ni moverla a otra hora.

- **Regla general (a INVARIANTES, todos los destinos):** si estás visitando un imprescindible o un lugar de nivel 1, y al lado (5 min andando o menos) hay otro lugar que merece la pena ver, ese lugar entra **por fuera** cuando a esa hora está cerrado. Así se ve la fachada, se hacen fotos y se sigue la ruta.
  - Sale con su etiqueta «Por fuera», con su tiempo de visita por fuera, y **sin el aviso rojo**.
  - Dentro de la ficha, una línea con el horario por si quieres volver a entrar: «Por dentro abre de {hora} a {hora}».
  - **Solo vale para los sitios cuyo exterior merece la pena por sí mismo:** los que tienen curados sus minutos por fuera (`minutos_fuera`). Si un sitio no tiene ese dato, o lo que se va a ver está solo dentro, no va por fuera: se coloca a una hora en que esté abierto. Por ejemplo, San Luigi dei Francesi (los Caravaggio) o Santa Maria della Vittoria (el Éxtasis de Santa Teresa de Bernini): por fuera no tienen nada, y mandarte allí cerrados sería como no ir.
  - En el informe, dime qué sitios de Roma tienen `minutos_fuera` y cuáles no, por si falta alguno que sí merezca la pena por fuera (como Trinità dei Monti).
  - La regla no cambia el orden de la ruta: la parada se queda donde está y solo pasa a «Por fuera». Los minutos que sobran los absorbe la parada que se estira, como ya pasa hoy.
- **Trinità dei Monti:** comprueba su horario en la web oficial y corrígelo si está mal. Con la regla, al lado de Plaza de España va por fuera cuando esté cerrada.
- **Prueba:** busca en las 365 fechas cuántas paradas salen con «Todavía no ha abierto» o «Ya ha cerrado» a su hora. Que queden en 0: o van por fuera con esta regla, o se mueven a cuando estén abiertas. Añádelo a la prueba para que salte solo, y dime cuántas había y cuáles pasaron a «Por fuera».

### 5. D4 reescrito: la Galería Borghese con su parque

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

#### D4 nuevo

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

### 6. Fotos que no son del sitio: un perro en Via Margutta

En el mismo día, «Via Margutta y Via del Babuino» sale con la foto de un perro. Seguramente es una de las fotos que se buscaron solas en Unsplash y nadie revisó a ojo.

- **Quita ya la del perro.** Hasta que el usuario pase una buena, Via Margutta va sin foto (el color neutro de la app).
- **Hoja de contactos:** prepara una página (por ejemplo `docs/revision_fotos_roma.html`) con **todas** las fotos de Roma, cada una con el nombre de la parada, cuándo sale (de día, de noche, Navidad) y de dónde viene (propia, Unsplash, Wikipedia…). Así el usuario las revisa todas de una vez y te dice cuáles cambiar.
- Marca en esa hoja, para que se vean primero, las que se buscaron solas y nadie ha revisado.

### 7. Fuera el «Tiempo libre»

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

---

# Paso 6 · Diseño de las pestañas Ruta y Días

*Repaso de diseño 5 (pestañas Ruta y Días)*

Commit por parte y push al final. Comprueba cada punto a 390 px (móvil) y en escritorio, con capturas.

### Pestaña Ruta

1. **La ventana del destino, a pantalla completa:** al tocar la tarjeta del destino, la ventana de «Alojamientos en {destino}» y «Actividades en {destino}» ocupa toda la pantalla. Sin mapa arriba (ahora sale), ni pestañas, ni menú detrás.
   - **Cerrar:** arriba, una cruz para cerrar y volver a la pestaña Ruta.
   - **Tercer bloque:** debajo de Actividades, **«Excursiones desde {destino}»**. Solo sale si hay excursiones que enseñar; cuando conectemos las APIs de afiliados, saldrán de ahí. Déjalo preparado: si no hay datos, el bloque no aparece, ni vacío ni con «próximamente».
   - Sin precios de prueba, como ya se pidió.

### Pestaña Días

2. **Esconder el mapa:** al abrir el acordeón de un día se puede volver atrás, pero ya no está el botón para esconder el mapa, que antes sí estaba. Recupéralo (búscalo en el historial de git) y comprueba que funciona.
3. **«Rutas» y la barra de abajo:** al tocar «Rutas», las opciones «Abrir en Apple Maps» y «Abrir en Google Maps» salen por debajo de la barra flotante de abajo, que las tapa y no se pueden tocar. Tienen que salir por encima de todo, barra incluida, y enteras.
4. **«Añadir parada»:** la ventana con el mapa y su tirador está bien, pero el menú de arriba (Hoy, Ruta, Días, Explorar) se queda encima y tapa parte de la ventana.
   - La ventana va por encima de todo, sin ese menú ni la barra flotante.
   - Tiene una cruz para cerrar, visible siempre. Hoy no se ve.
5. **Abrir un día:**
   - Al tocar un día (Día 1, Día 2…), los demás días se cierran.
   - El día que se abre empieza desde arriba, en su primera parada. Hoy, si estás leyendo el final del Día 1 y tocas el Día 2, se abre por su última parada.
   - Que la pantalla suba sola hasta el principio del día abierto.

**INVARIANTES:** las ventanas (fichas, Añadir parada, Rutas, alojamientos) van siempre por encima de los menús y de la barra flotante, y tienen su cruz para cerrar.

---

# Paso 7 · El pool del formulario, guardado

*El pool del formulario, guardado y listo desde el principio*

El pool de lugares del formulario (las tarjetas con foto para elegir qué quieres ver) parece cargarse cada vez desde cero, y tarda. Es igual para todos los viajeros de un mismo destino: no tiene sentido pedirlo cada vez.

Commit por parte y sin push. Sin cambios de diseño.

1. **Mira primero cómo carga hoy** y dímelo en el informe:
   - qué pide la pantalla al abrir el pool;
   - si alguna parte ya se guarda;
   - cuánto tarda en un móvil con 4G (la herramienta de red del navegador, en lento), la primera vez y la segunda.
2. **La lista del pool, guardada.** La lista de lugares del pool de cada destino (nombre, foto, orden, a qué época o experiencia pertenece) se prepara una vez y se guarda: en el servidor y en el navegador del viajero.
   - Solo cambia cuando cambiamos los datos del destino (roma.json). Ponle una versión, para que al cambiar los datos se renueve sola y nadie vea una lista vieja.
   - Lo que cambia con el viajero (la época, las experiencias que elige, cuántos caben según los días) se aplica encima, sin volver a pedir nada.
3. **Las fotos del pool, ligeras y guardadas.**
   - Usa la versión pequeña (640 px), nunca la grande.
   - Que el navegador las guarde mucho tiempo (cabeceras de caché largas en Vercel). Si una foto cambia, que cambie de nombre o de versión, para que se renueve.
4. **Que esté listo antes de llegar.** Mientras el viajero rellena los pasos de antes del formulario (destino, fechas…), la app va trayendo en segundo plano la lista y las fotos del pool de ese destino. Al llegar al pool, sale al momento.
5. **Lo mismo en Explorar y en Añadir parada**, si usan las mismas fotos y datos: que aprovechen lo ya guardado.

**Informe corto:** los tiempos antes y después, la primera vez y la segunda, en móvil con 4G.

---

# Paso 8 · La varita mágica, en cada día

*Commit y push.*

Hoy la varita («Volver a mi ruta original») está arriba, en la cabecera, y deja **todo el viaje** como se lo dimos. Decisión del usuario: sale de la cabecera y pasa a **cada día**, con dos opciones dentro, para no llenar la pantalla de botones y enlaces.

1. **Dónde:** en la fila de **todos** los días de la pestaña Días (la de «Día 2 · Jue 15 Oct · Vaticano, Castillo y Trastevere al atardecer»), **entre el botón de los tres puntos y la flecha «›»**.
   - El mismo estilo que el botón de los tres puntos: redondo, del mismo tamaño y con el mismo borde. Dentro, el icono de la varita.
   - Que quepan los tres a 390 px sin cortar el título del día. Si hace falta, el título pasa a dos líneas.
   - Toque de 44 × 44 px y su `aria-label`: «Recuperar la ruta original».
2. **Al tocarla,** un menú pequeño junto a la varita, con el mismo estilo que el de los tres puntos y por encima de todo (menús y barra flotante incluidos), con dos opciones:
   1. **«Recuperar este día»:** deja ese día exactamente como lo preparamos (la copia guardada al crear el viaje, sin recalcular).
      - Ventana de la app: «¿Recuperar este día? Quedará tal como te lo preparamos y se perderán los cambios que has hecho en él.», con «Recuperar» y «Cancelar».
      - Después, el aviso de abajo unos segundos: «Día recuperado · Deshacer».
   2. **«Recuperar toda mi ruta»:** deja el viaje entero como se lo dimos, también los días que haya borrado y los bloques de llegada y vuelta (lo que hacía la varita de arriba).
      - Ventana de la app: «¿Recuperar toda tu ruta? Tus días quedarán tal como te los preparamos y se perderán todos los cambios que has hecho.», con «Recuperar» y «Cancelar».
      - Después: «Ruta original recuperada · Deshacer».
3. **Sin cambios:** la opción que no tiene nada que recuperar sale en gris, con una línea debajo: «Está tal como te lo preparamos» (o «te la preparamos», para la ruta).
4. **En los días que crea el viajero** (los de «+ Añadir día» o «lo organizo yo») no hay un original al que volver: ahí solo sale la opción 2.
5. **Quita de la cabecera** la varita de arriba, y **del menú de los tres puntos** la opción «Volver al día original». Ya está todo en la varita de cada día.

**Informe corto:** capturas a 390 px de la lista de días con la varita, del menú abierto (con cambios y sin cambios, y en un día creado por el viajero) y de las dos ventanas.
