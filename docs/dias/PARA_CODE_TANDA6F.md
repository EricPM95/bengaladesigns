# Para Code · Tanda 6f: lo que ha salido al probar la app en Vercel

He probado un viaje de Roma de 3 días con Free Tour en la app publicada. El motor funciona, pero en pantalla hay cosas que parecen fallos. `DIAS_ROMA_PARADAS.md` ha cambiado: pásalo por el convertidor y no lo toques.

## Cómo trabajar

- **Nada de parches.**
- `PROGRESO_TANDA6F.md` con una línea por bloque, y TERMINADO al final.
- Al acabar, `INFORME_TANDA6F.md` en palabras sencillas.
- **Commits locales por bloques.**
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado, haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. Fuera la tarjeta «Llegada a…»

**Lo que se ve ahora:**
- dos tarjetas de «Free Tour Centro Histórico»: una a las 9:50, sin foto y con el recuadro de la foto vacío, y otra a las 10:00;
- dos de «Coliseo», a las 9:00;
- dos de «Museos Vaticanos», a las 15:15;
- y entre las dos tarjetas, «1 min · 0 m».

Parece que el sitio está repetido y que faltan fotos.

**Lo que tiene que salir:**
- **Quita del todo la tarjeta «Llegada a…».** Queda solo la tarjeta de la visita, con su foto.
- **Solo si el viajero tiene la reserva puesta y aceptada en RESERVAS,** la tarjeta lleva una línea arriba:
  - **Free Tour:** «🕘 Free Tour a las 10:00 · llega a las 9:45 a la Plaza de España. Busca el paraguas o el cartel del tour».
  - **Coliseo:** «🕘 Entrada a las 9:00 · llega a las 8:30: el control de seguridad y la cola de entrada».
  - **Sin reserva puesta,** no sale la línea. Esto vale también para el «Turno recomendado» de la Galería.
- **El motor sigue contando** el rato de llegada antes de la hora fija, para que el día cuadre.
- **La cuenta atrás de HOY** («Sal de aquí a las…») sale solo con la reserva puesta, y usa la hora de llegada.
- **Ningún trayecto** entre la llegada y la visita.

**Prueba:** 0 tarjetas «Llegada a…» y 0 trayectos de «0 m».

## 2. Ninguna tarjeta con el recuadro de la foto vacío

- Si una parada no tiene foto propia, usa la de su barrio o su zona.
- Si tampoco hay, la tarjeta va sin recuadro de foto, no con el recuadro vacío.
- **En el informe:** la lista de paradas que salen sin foto propia.

## 3. Fuera los textos «iluminada», «de noche», «ya con las luces»

**Lo que se ve ahora:** «Plaza de San Pedro, ya iluminada» hacia las 18:15 en verano, cuando el sol se pone a las 20:45.

**La regla:** en ningún nombre de parada salen esas palabras. Lo de noche ya se ve por su tarjeta azul de experiencia nocturna, con su foto de noche. Una parada de día lleva su nombre de siempre («Plaza de San Pedro»). Vale para todos los destinos.

**La etiqueta de la tarjeta azul de noche** ahora dice «De noche»: cámbiala por **«Experiencia nocturna»**.

## 4. La noche y lo visto ese día (regla 11c)

**Lo que pasa ahora:**
- el día 1, Trevi «sin gente» a las 7:30 y otra vez Trevi por la noche;
- el día 2, el Coliseo por la mañana y otra vez el Coliseo por la noche.

**La regla depende de la duración del viaje:**
- **Viajes de 2 días o menos:** sí se puede repetir de noche un sitio visto ese día. Hay poco tiempo y se quiere ver de día y de noche.
- **Viajes de 2,5 días o más:** una nocturna no puede ser un sitio visto ese mismo día, de ninguna forma. Va otro día del viaje. Si toca, va la siguiente que no haya salido, la más cercana a la cena (regla 13).

En los dos casos siguen valiendo las reglas de siempre: el taxi de 15 min o menos, sin repetir nocturnas en el viaje y las imprescindibles en los primeros días en que quepan.

**Prueba:** en los viajes de 2,5 días o más, 0 nocturnas de un sitio visto ese mismo día.

## 4b. Las nocturnas, por parejas cercanas (regla 13)

**Lo que pasa ahora:** la noche lleva la Plaza de España y, a continuación, el Coliseo, a **30 min andando (2,6 km)**, hacia las 22:00. Pasa porque Trevi no podía salir y el motor buscó la siguiente imprescindible, aunque estuviera lejos.

**La regla:**
- **Las nocturnas van por parejas:**
  - Trevi y la Plaza de España;
  - el Coliseo y el Foro desde el Campidoglio;
  - el Panteón y Piazza Navona;
  - el Puente y el Castillo de Sant'Angelo;
  - Trastevere de noche.
- **Una noche lleva una pareja, o solo una de las dos.** Si una de la pareja ya salió o no vale (regla 11c), va solo la otra.
- **Nunca se mezclan parejas,** y entre dos nocturnas de una misma noche no hay más de **15 min andando**.
- **Para elegir la pareja,** las reglas de siempre: el taxi de 15 min o menos desde la cena, y las imprescindibles primero.

**Prueba:** 0 noches con dos nocturnas a más de 15 min andando una de otra.

## 4c. D3: el Castillo y el Puente, antes de cenar

El D3 acababa la tarde en la Plaza de San Pedro hacia las 18:30 y dejaba el Puente y el Castillo para la noche. Pero había tiempo de sobra antes de cenar. Ahora, en el documento:
- **tarde:** la Plaza de San Pedro y, de camino, la Conciliazione; el Castillo por fuera (~30) y el Puente (~15);
- **cena:** en Prati;
- **noche:** la pareja que toque por la regla 13, ya no fija.

**Comprueba** que, en un viaje de 3 días con Free Tour, la noche del D3 no sale con Trevi (se ha visto esa mañana) ni con el Puente y el Castillo (vistos esa tarde).

## 4d. Fuera la tarjeta «Un respiro antes de cenar»

Quítala de RUTA, DÍAS, HOY y la página de prueba, en todos los destinos (regla 12 del documento). Si sobra tiempo antes de cenar, solo HOY lo dice con «Vas bien de tiempo» y sus sugerencias.

## 4e. El paseo por Trastevere, antes de cenar

En el D2, el D1-FT y el D1-corto, después del Janículo (o de Santa Maria in Trastevere en el D1-corto) va una parada nueva: **«Paseo por Trastevere»** (~30; el nombre, tal cual). Es la única excepción a «sin paseos».
- **Es una parada de verdad,** con su tarjeta normal, su número y **su foto** (`dia_trastevere.jpg`). No es un «de camino» ni va sin foto. Aquí no vale la regla de la Tanda 5 de que «los paseos no llevan foto propia».
- Usa el sitio «Trastevere» de `roma.json`.
- Si la nocturna del día sería «Trastevere de noche», en los viajes de 2,5 días o más va otra (regla 11c).

## 4f. El orden de los días: lo imprescindible, primero

**Lo que pasa ahora:** en el viaje de 3 días sin Free Tour, el orden es D1, D4 y D2: Villa Borghese va en medio y el Vaticano el último día.

**La regla** (en el documento, debajo de «Cómo funciona»):
- Los días con más imprescindibles van primero: el D1 y el D2 (o el D1-FT y el D3 con Free Tour), en los dos primeros días completos.
- Después, el D4, el D5, el D6 y el D7.
- Solo se cambia por un cierre (el Vaticano no en domingo ni en miércoles, la Galería no en lunes): se cambia con el día siguiente.
- Los medios días nunca son el D1 ni el D2.

**Prueba:** en todos los viajes y las 365 fechas, el D1 y el D2 (o sus versiones con Free Tour) caen en los dos primeros días completos, salvo por un cierre; y esos casos van en el informe.

## 4g. Villa Borghese: el parque, como parada

**Lo que pasa ahora:** la mañana del D4 con Free Tour empieza con una tarjeta «De camino» de cuatro sitios, y el Parque de Villa Borghese va dentro de ella, sin foto.

**Lo que tiene que salir:**
- **«Parque de Villa Borghese» es una parada** (~45: la Piazza di Siena y el lago con el Templo de Esculapio). La parada «Lago de Villa Borghese y el Templo de Esculapio» desaparece, porque va dentro.
- **Su foto es la que ahora tiene la parada del lago, en la que se ve el templo.** No la del parque que había antes.
- **Después:** la Galería, el reloj de agua y la Terraza del Pincio, como ya está.
- **Sin Free Tour:** Trevi, el desayuno y, de camino, el Tritón, Via Veneto y Porta Pinciana; luego, el parque.
- **Con Free Tour:** el día empieza directamente en el parque, sin tarjeta de «de camino» delante.
- **Regla para todos los días:** un día nunca empieza con una tarjeta de «de camino». La primera tarjeta del día siempre es una parada.

## 4h. La tarjeta «De camino», plegada

**Lo que se ve ahora:** la tarjeta «De camino a…» enseña todos los sitios abiertos, cada uno con su texto largo y su «Ver ›». Con tres o cuatro sitios agobia.

**Lo que tiene que salir:**
- **Plegada por defecto, en una sola línea:** «De camino a Parque de Villa Borghese · pasas por la Fuente del Tritón, Via Veneto y Porta Pinciana ▾».
- **Al tocarla se despliega,** con cada sitio, su texto y su «Ver ›», como ahora.
- Si es un solo sitio, igual: plegada en una línea.
- Vale para RUTA, DÍAS y HOY, en todos los destinos.

## 4i. «De camino» repetido: dos Plaza de España

**Lo que se ve ahora:** en el D4 sale la parada «Plaza de España» y, después de Trinità dei Monti, una tarjeta «De camino a Panteón» que vuelve a poner «Plaza de España» (era «bajar la escalinata»).

**Lo que tiene que salir:**
- **Un «de camino» nunca es un sitio que ese día ya sale como parada,** en ningún destino. Si lo es, no sale: ese rato es el trayecto.
- He quitado «bajar la escalinata» del documento.
- **El título de la tarjeta:** «De camino a {la siguiente parada}», contando la comida y la cena. Antes de cenar: «De camino a la cena, en Il Gabriello», no «De camino a Panteón» (que es la nocturna de después).

**Prueba:** 0 «de camino» que repitan una parada del mismo día.

**Dos paradas en la Plaza de España, en todos los días que la llevan:**
1. **«Plaza de España»** (~45), con su foto de la plaza y la Barcaccia.
2. **«Escalinata y Trinità dei Monti»** (~20): se sube la escalinata y arriba está la iglesia con su mirador. Usa la foto de Trinità dei Monti.

La parada vieja «Trinità dei Monti y su mirador sobre la Plaza de España» cambia de nombre a la nueva.

## 4j. Qué es «de camino» y qué es parada (regla 9, todos los destinos)

**La regla nueva:**
- **Parada:** todo sitio con nombre propio, con historia y conocido, aunque se vea en 5–10 min. Lleva su tarjeta y su foto.
- **De camino** es solo esto:
  - las calles de paso sin fama;
  - los rincones pequeños: fuentes pequeñas o plazuelas;
  - las fachadas de iglesias en las que no se entra;
  - lo que ya se visitó otro día del viaje, con la línea **«Ya lo visitaste el día {n}»**.

**En Roma pasan de «de camino» a parada** (~10 min, salvo lo que diga el documento):
- Via della Conciliazione
- Teatro de Marcelo
- Columna de Trajano
- Porta Pinciana
- Piazza Venezia
- Via dei Fori Imperiali
- Arco de Constantino
- Puente Sant'Angelo
- Via Condotti
- Via Veneto
- Fuente del Tritón

**Se quedan de camino:**
- calles de paso: Via del Babuino, Via dei Coronari, Via di Ripetta, el Lungotevere, Via Garibaldi, Monti (cuando solo se cruza) y **Via Margutta**;
- rincones pequeños: la Fuente de las Tortugas, el Elefantino de Bernini, la Piazza in Piscinula;
- las fachadas: Santa Maria sopra Minerva, el Gesù (cuando no se entra), la Basílica (cuando no se entra).

**Fotos nuevas** (ya en `public/fotos/roma/`, cada una con su versión pequeña `_p`):
- `dia_via_conciliazione` → Via della Conciliazione
- `dia_teatro_de_marcelo` → Teatro de Marcelo
- `dia_porta_pinciana` → Porta Pinciana
- `dia_plaza_venecia` → Piazza Venezia, de día (la de noche solo en su nocturna)
- `dia_via_dei_fori_imperiali` → Via dei Fori Imperiali
- `dia_via_condotti` → Via Condotti
- `dia_via_veneto` → Via Veneto
- `dia_fuente_del_triton` → Fuente del Tritón

Apunta en el informe cualquier otra parada sin foto propia.

**Crédito de las fotos:** añade a cada foto un campo `credito` (autor, licencia y enlace), vacío por defecto. Si tiene crédito, sale en letra pequeña al abrir la foto o la ficha del sitio: «Foto: {autor} · {licencia}». Las de `dia_via_conciliazione` y `dia_via_dei_fori_imperiali` son de Wikimedia Commons: te paso el autor y la licencia de cada una para rellenarlo.

**En el informe:** los días que, con estas paradas nuevas, ya no caben enteros (sin reserva, cierre ni pool). Pon el día, la franja y cuántos minutos se pasa. No cambies nada para que quepan: los recorto yo en el documento.

## 4k. El trayecto por defecto: andando o transporte público (regla 2)

**Lo que pasa ahora:**
- De Trastevere al Coliseo de noche sale «Taxi» por defecto.
- Y en todos los trayectos aparece la opción «Transporte público», aunque no haya ninguna línea entre los dos sitios: el tiempo es una estimación tuya.

**La regla, para todos los destinos:**
1. **Por defecto,** andando si son 25 min o menos. Si son más, **transporte público, si hay una línea de verdad.** Solo si no hay ninguna de las dos, taxi.
2. **El taxi siempre está en las opciones,** al tocar el icono del trayecto, pero nunca es lo primero si se puede ir andando o en transporte público.
3. **«Transporte público» solo sale si existe una línea real** que une los dos sitios, con su número: «Tranvía 8 · 15 min», «Metro A · 10 min», «Bus 40 · 15 min». Si no la hay, la opción no sale. **Quita** la estimación de bus y metro sin línea.
4. **Las líneas de Roma** están en el documento, en «Líneas de transporte público de Roma que usa la app». Cuentan si las dos paradas quedan a 8 min andando o menos de una estación o parada de la misma línea. El tiempo es la caminata hasta la línea, el viaje y la caminata hasta el sitio.
5. **Ejemplo:** de Trastevere al Coliseo de noche, «Tranvía 8 hasta Piazza Venezia + 12 min andando · unos 30 min», y en las opciones, el taxi.

**En el informe:**
- los trayectos que antes salían en taxi y ahora salen andando o en transporte público;
- los que siguen en taxi por defecto, porque no hay otra opción.

## 4l. D5 y DA-medio: la Pirámide y el Cementerio Protestante

- **D5:** después del Ojo de la Cerradura, la **Pirámide Cestia** (~15, por fuera), de camino a la cena en Testaccio. La noche ya no es fija: la pareja que toque por la regla 13 (en 4 días, normalmente Trastevere de noche). El Foro de noche ya sale otro día.
- **DA-medio (mañana de vuelta):** después de comer en el Mercado de Testaccio, la **Pirámide Cestia** (parada) y el **Cementerio Protestante** (~30). Es de lunes a sábado, de 9:00 a 17:00, con la última entrada a las 16:30; los domingos y festivos, hasta las 13:00. Va si queda tiempo antes de irse.

## 4m. Viaje de 3,5 días: el medio día es siempre el del Aventino

- En el viaje de 3,5 días, el medio día es el **DA-medio** (Termas de Caracalla, el Aventino y Testaccio), **nunca** la mitad de las basílicas del D5.
- **Si el medio día es la tarde de llegada,** va la versión «De tarde» del DA-medio, que ya está escrita en el documento: Circo Máximo, Boca de la Verdad, el Ojo, el Jardín de los Naranjos al atardecer, la Pirámide y la cena en Testaccio. Las Termas no van de tarde.
- **Comprueba en `roma.json` el horario del Jardín de los Naranjos:** de octubre a febrero, de 7:00 a 18:00; en marzo y septiembre, de 7:00 a 20:00; de abril a agosto, de 7:00 a 21:00 (fuente: turismoroma.it). Con la regla de siempre: si se llega cerrado, por fuera o «Si te sobra tiempo», y el aviso «Cierra a las 18:00: entra antes».

## 4n. El mapa de «+ Añadir parada», con las líneas de la ruta

**Lo que pasa ahora:** al tocar «+ Añadir parada» se abre un mapa con los sitios de ese día, pero sin las líneas entre ellos.

**Lo que tiene que salir:** el mismo dibujo que el mapa normal de la ruta:
- las paradas del día con su número;
- la línea entre una y otra, en orden, con el mismo estilo;
- marcado el hueco donde se va a añadir la parada nueva (entre la parada de antes y la de después).

Así el viajero ve si lo que añade le queda de camino o le hace volver atrás.

## 5. El Free Tour ya no se pregunta en el formulario

- **En el formulario,** en experiencias, quita la pregunta «¿A qué hora prefieres el Free Tour?».
- **El Free Tour se añade desde la app:** en RESERVAS y en el «+ Añadir parada» de cada día, una opción «Free Tour».
  - Pregunta la hora: de mañana (10:00), de tarde (17:00) o de noche (18:30).
  - El día cambia a su versión con Free Tour (D3, D1-FT o DM-medio) con las reglas de siempre.
  - Usa la hoja de reservas que ya tienes (mejores horas y avisos).
- **Sin Free Tour,** el viaje sale con los días normales (D1, D4, D2…).

## 6. Lo que había quedado de la 6e

`DIAS_ROMA_PARADAS.md` ya tiene escritos:
- **D3:** los Museos de 13:30 a 14:30 con Free Tour (quita la variante que escribiste tú);
- **D2:** los Museos a mediodía (de 12:30 a 14:30);
- **D4:** la Galería a las 9:00, sin Trevi «sin gente»;
- **D0:** el Coliseo de 14:30 en adelante;
- **D1-corto y D1-FT:** con el Coliseo reservado;
- **la comida hasta las 15:00** en días con reserva;
- y el ejemplo corregido de la regla 17.

Regenera `TABLA_RESERVAS.md`. Tiene que quedar «sin lista» solo en la Galería a las 13:00.

## 7. Pruebas

- La prueba entera, con las comprobaciones nuevas de los puntos 1, 3 y 4.
- Regenera `VIAJES_LISTAS.html`.
- Reinicia el api-server.
- Y el push del principio.
