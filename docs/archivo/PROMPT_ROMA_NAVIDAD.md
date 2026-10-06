# Roma en Navidad (del 1 de diciembre al 8 de enero)

Mucha gente va a Roma en Navidad y queremos darle una ruta navideña de verdad. Antes de cerrar Roma, este periodo tiene que estar perfecto.

Reglas de siempre:
- Commit por parte y sin push.
- Las reglas generales van a INVARIANTES.
- Sin precios donde los ve el viajero.
- Textos con «tú».
- Ningún texto promete algo que la ruta no cumple.

Abajo están los datos oficiales que he comprobado (temporada 2025-26). Los horarios de festivos cambian cada año: guarda la fuente y la fecha de comprobación en cada dato.

## Parte 1. Fechas que hoy no son verdad

**1 de enero.** En `roma.json`, el Coliseo, el Foro, el Panteón y las Termas de Caracalla tienen `01-01` en `closed_dates`, y el aviso dice «hoy cierran el Coliseo, el Foro, el Panteón y los Museos Vaticanos». Las webs oficiales dicen lo contrario:
- Coliseo y Foro-Palatino: abrieron el 1 de enero de 2025 y el de 2026, de 8:30 a 16:30 (colosseo.it, «1 January 2026»). Ese día no se entra a los subterráneos.
- Panteón: el 1 de enero de 2026, de 9:00 a 17:00, con la última entrada a las 16:30 (cultura.gov.it, «1 gennaio 2026 al Pantheon»). Los datos citan pantheonroma.com, que dice que cierra: manda el aviso del Ministerio de ese año.
- Termas de Caracalla: el 1 de enero de 2026, de 9:30 a 16:30, con la última entrada a las 15:30 (cultura.gov.it).

Qué hacer:
- Quita `01-01` de sus `closed_dates`. Pon un `horario_especial` del 1 de enero con esas horas y `confirmado: "probable"`, igual que el 2 de junio.
- Reescribe el aviso del 1 de enero con lo que sí es verdad: los Museos Vaticanos cierran, y el Coliseo y el Foro suelen abrir con horario corto. Termina con lo que hemos hecho.
- La variante `navidad` de D1 tiene `si_fecha: ["12-25", "01-01"]` y enseña el Coliseo «por fuera». Déjala solo para el 25.
- Revisa con la web oficial de cada uno los demás `01-01` y `12-31` dudosos:
  - Castillo de Sant'Angelo, Galería Borghese, Palazzo Doria Pamphilj y catacumbas.
  - Parque de Villa Borghese: la fuente de Roma Capitale que ya tenemos dice «acceso libre todos los días», así que no puede cerrar el 31 ni el 1.
  - Santa Maria in Trastevere.
  - Basílica de San Pedro: el 31 y el 1 abre, pero con misas del Papa (ver la parte 3). Ponlo como un tramo cerrado alrededor de la misa, no como el día entero cerrado.
  - Lo que no tenga fuente, fuera.

**Transporte en los festivos.** Hoy el motor pone bus como cualquier otro día. Los horarios de ATAC de 2025-26 (fanpage.it y funweek.it, con el plan de Roma Capitale):
- **24 de diciembre:** bus, tranvía y metro paran a las 21:00.
- **25 de diciembre:** solo de 8:30 a 13:00 y de 16:30 a 21:00.
- **26 de diciembre:** horario de festivo normal, con metro hasta la 1:30.
- **31 de diciembre:** los buses hasta las 21:00 y el metro hasta las 2:30.
- **1 de enero:** servicio normal desde las 8:00.

Regla: fuera de esas horas, el tramo va andando o en taxi, nunca en bus ni metro. Comprueba el tramo que se arregló ayer en Navidad, de San Pedro a Santa Cecilia: si cae entre las 13:00 y las 16:30, no puede ir en bus. Y en la noche del 24 y del 25, ningún paseo nocturno que necesite metro para volver después de las 21:00.

## Parte 2. Los mercadillos navideños no hacen nada en Roma

Lo que pasa ahora:
- En el formulario sale «Mercadillos Navideños», pero solo si el viaje empieza en noviembre o diciembre (`isWinterTrip` en `StepExperiences.tsx`). Un viaje del 2 al 6 de enero no la ve. Uno de principios de noviembre sí la ve, aunque todavía no hay nada abierto.
- Si la eliges, no añade nada, porque ningún lugar de Roma tiene la etiqueta `mercadillo_navideno` (`experienceTags.js`: «mientras no haya, la experiencia no añade nada»). Es una promesa que no cumplimos.

Qué hacer:
1. **Ventana:** añade a Roma la ventana de la experiencia (`experience_availability`, la que ya lee `seasonalAvailability`) del 12-01 al 01-06, con `aprox: true` y sus avisos:
   - «Es probable que algunos mercadillos aún no hayan abierto»;
   - «…ya hayan cerrado».
   - Así la opción sale bien del 16 de noviembre al 21 de enero, con aviso en los márgenes, y un viaje del 7 al 8 de enero la ve con el aviso.
2. **El mercadillo de Piazza Navona:**
   - La fuente oficial es turismoroma.it, «Festa di Piazza Navona 2025»: del 1 de diciembre de 2025 al 6 de enero de 2026, todos los días de 9:00 a 1:00 (hasta las 2:00 en festivos y vísperas). El 6 de enero a las 14:00 llega la Befana y se cierra la fiesta.
   - Crea el lugar con la etiqueta `mercadillo_navideno` y su `available`. Piazza Navona ya es una parada: si eliges la experiencia, que no salgan dos paradas en el mismo sitio. La parada de Navona pasa a ser «Piazza Navona y su mercadillo de Navidad», con más tiempo (unos 45 min) y, si se puede, al caer la tarde, cuando está iluminada.
   - Si no la eliges, se queda como hoy: el texto del mercadillo en el paseo de noche.
   - El aviso `mercadillo_navona` de `fechas_especiales` ya tiene fuente oficial para 2025-26: puede salir con «suele». Actualiza la fuente.
3. **Qué es «mercadillos» en Roma, visto por un local:** Roma no tiene mercadillos como los alemanes. Su Navidad es Navona, los belenes y las luces. En Roma, la tarjeta del formulario dice: «El mercadillo de Piazza Navona, los belenes y las luces de Navidad». El título se queda. Si la eliges, además de Navona:
   - **Belenes:** si el día pasa cerca y sin que se caiga nada, como el «de camino» de siempre.
     - 100 Presepi, bajo la columnata de San Pedro (del 8 de diciembre de 2025 al 6 de enero de 2026), en el día del Vaticano.
     - El belén de Arnolfo di Cambio en Santa María la Mayor, de 1291, el más antiguo.
     - El Bambinello de Santa Maria in Aracoeli, junto al Campidoglio.
     - El belén de los barrenderos (Presepe dei Netturbini), junto al Vaticano, que se monta desde 1972.
     - Fuente: turismoroma.it, «Alberi di Natale, Presepi e Luminarie a Roma 2025-26».
   - **Luces:** el rato antes de cenar ya dice «Luces de Navidad por Via del Corso y Via Condotti». Con la experiencia elegida, que sea un paseo de verdad: Via del Corso, Via Condotti, Via del Babuino y Via Margutta, del 26 de noviembre al 6 de enero (misma fuente).
   - Christmas World en Villa Borghese no entra: es de pago y está fuera del centro.

## Parte 3. La Navidad para todos (aunque no elijas la experiencia)

Del 1 de diciembre al 6 de enero, cuando la ruta ya pasa por esos sitios, la ficha lleva una línea de Navidad, sin añadir paradas. Por ejemplo:
- Plaza de San Pedro: el árbol y el belén de la plaza.
- Santa María la Mayor: el belén de Arnolfo.
- Campidoglio: el Bambinello de Aracoeli, a un paso.
- Plaza de España: el árbol y el belén de la escalinata.

Comprueba cada año cuándo se montan: el árbol y el belén de San Pedro suelen inaugurarse a primeros o mediados de diciembre.

Fechas con misas del Papa. En 2025-26 fueron estas (vatican.va, «Notificazione tempo di Natale»):
- **24 de diciembre:** misa de la noche a las 22:00, en la Basílica. La Basílica cierra antes a los turistas: compruébalo y ponlo como tramo cerrado.
- **25 de diciembre:** misa a las 10:00 y bendición Urbi et Orbi a las 12:00. Ya está como sugerencia: que se mantenga y respete el horario de bus del 25.
- **31 de diciembre:** Te Deum a las 17:00, en la Basílica.
- **1 de enero:** misa a las 10:00.
- **6 de enero:** misa de la Epifanía por la mañana. En 2026 fue a las 9:30, por el cierre de la Puerta Santa, que ya no vuelve.
- **8 de diciembre:** por la tarde, el Papa en la Plaza de España. Ya está en los avisos.

El calendario de 2026-27 aún no está publicado: márcalo `verificar` con la fecha de 2025-26 y revísalo en noviembre.

Restaurantes: el 24 por la noche, el 25 y el 31 muchos cierran o tienen menú especial. El aviso de restaurantes ya existe para el 24-26: añádelo también al 31 de diciembre y al 1 de enero.

## Parte 4. Prueba y revisión

1. **Prueba de Navidad:** todos los días de salida del 1 de diciembre al 8 de enero, de 1 a 7 días, completo y tranquilo, con y sin la experiencia de mercadillos. Que dé 0 en todo esto:
   - un lugar cerrado planificado por dentro;
   - un tramo en bus o metro fuera del horario de ese festivo;
   - un texto que diga algo falso (cierres, horas, «mercadillo»);
   - un viaje dentro de la ventana, con la experiencia elegida, sin el mercadillo de Navona;
   - dos paradas en el mismo sitio.
2. **La de siempre:** la prueba de las 365 fechas y los 56 viajes, igual o mejor.
3. **Revisión:** escribe en `docs/revision/NAVIDAD_ROMA.md`, parada a parada y con horas, estos viajes para que los revise como un local:
   - 7-9 dic (3 días, completo, con mercadillos);
   - 23-27 dic (5 días, tranquilo, con mercadillos);
   - 24-26 dic (3 días, completo, sin mercadillos);
   - 30 dic-2 ene (4 días, completo);
   - 31 dic-1 ene (2 días, tranquilo);
   - 4-8 ene (5 días, tranquilo, con mercadillos).
4. **INVARIANTES:**
   - Un horario de festivo no se da por abierto ni por cerrado sin la fuente oficial de ese año. Si no hay fuente, `probable` y un texto prudente.
   - En los festivos con transporte recortado, solo andando o en taxi fuera de sus horas.
   - Una experiencia elegida siempre añade algo a la ruta, o no se ofrece.

**Informe corto:** qué datos cambiaron (antes y después), los números de las pruebas y el archivo de revisión.
