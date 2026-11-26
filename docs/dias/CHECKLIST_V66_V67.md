# CHECKLIST V66 a V67 (26-nov)

**✅ 22 hechos · 🟡 7 a medias · ❌ 0 no hechos (de 29 puntos).**

Cada punto de cada tanda, uno por línea: ✅ hecho (y dónde se ve) · 🟡 a medias (qué falta) · ❌ no hecho (por qué). Todas las tandas se hicieron en modo rápido, SIN pasar pruebas. Detalle y capturas en `REPASO_V66_V67.html`.

## V66 · HOY: las respuestas de Eric, la hoja del Emblema Oculto y el atardecer

- ✅ **1a** — Hoja del Emblema Oculto nueva (E1, E2): azul noche con estrellas y rayos, rombo con «?», título y «Haz una foto en {sitio} y descúbrelo.» (se ve en: E1_design.jpg, E1_app.jpg)
- ✅ **1b** — [Hacer la foto] dorado y [Elegir de la galería] que abre la fototeca y la foto cuenta igual; «¿No estás aquí? Desmarcar visto»
- ✅ **1c** — Con un aviso con [Deshacer] abajo, la hoja empieza encima y no se tapan sus botones (se ve en: aviso_app.jpg)
- ✅ **2a** — Atardecer S1 (con parada de atardecer): «ATARDECER · 18:26», título, «Llega un cuarto de hora antes…» y botón a lo ancho (se ve en: S1_design.jpg, S1_app.jpg)
- ✅ **2b** — Atardecer S2 (sin parada): solo «ATARDECER», «Hoy el sol se pone a las 18:26», solo el sitio más cercano y su botón (se ve en: S2_design.jpg, S2_app.jpg)
- ✅ **2c** — Atardecer S3 (ningún sitio cerca): solo «Hoy el sol se pone a las 18:26», sin texto ni botón (se ve en: S3_design.jpg, S3_app.jpg)
- 🟡 **3.1** — Un documento con OTRO día del viaje: pregunta antes de mover la entrada («¿La pasamos al jueves?»), [Pasarla al jueves] / [Dejarla el martes], aviso con [Deshacer] — El flujo real de subir un PDF no se probó: se llamó a la misma función desde un gancho de desarrollo. Si dice «no», tampoco se aplica la hora del documento.
- 🟡 **3.2** — «Guarda un recuerdo de {sitio}»: solo en «Los imprescindibles» y maravillas, al pulsar [He terminado], si no hizo ya foto de ese sitio y una vez por sitio — Sin captura ni prueba de extremo a extremo. La tira «Guarda un recuerdo» tras ganar un pedazo sigue saliendo en sitios con pedazo (no solo imprescindibles).
- ✅ **3.3** — Aviso de la entrada con margen: «Al Foro puedes entrar más tarde; hoy quizá no llegues a todo»
- ✅ **3.4** — A la fila nueva de avisos: cierres de la mañana, viento y nubes, «activa los avisos» y el día de prueba del pase; «¿Cómo vas?» y «Cerca de ti» se quedan como tarjetas
- ✅ **3.5** — Texto «Es de los lugares más importantes de tu viaje: solo lo hacemos si tú quieres.»
- ✅ **3.6** — Lluvia: «esta mañana» hasta las 13:00, «esta tarde» hasta las 20:00, después «esta noche»
- 🟡 **3.7** — Hoja con muchos cambios: tarjeta solo para lo que cambia de día, va a pendientes o se quita; lo que sigue en el mismo día no se menciona — No se tocó la hoja de Reorganizar de la V61, que sigue enseñando cambios de hora de más de 15 min: ¿también se quitan? (DECISIONES_V66).
- 🟡 **3.8** — [Sin fuerzas] primero pregunta «¿Acabamos aquí el día y descansas?» ([Sí, acabar el día] / [Seguir]); con sí «Por hoy ya está» y después el resumen del día — El resumen del día no se pudo capturar (sin cuenta real no se abre); el cableado es la misma llamada de cerrarCierre de la V59.
- ✅ **3.9** — Viajando solo: «Sin fuerzas», «¿Cómo vas?», «Tómate un respiro»
- ✅ **4** — Build sin errores; push a main; producción

## V67 · Datos, lo que quedaba de los viajeros de prueba y el catálogo de avisos

- 🟡 **1a** — Puntualidad de las entradas: volver a comprobar en la web oficial de cada sitio los que estaban como «estricta» sin confirmar — Las webs de Domus Aurea y Galería Borghese dieron conexión rechazada y la de los Museos Vaticanos un 404: Vaticanos, Domus Aurea, Última Cena y Free Tours quedan «con margen» (no estrictos como esperabas) porque no se pudieron confirmar.
- ✅ **1b** — El Panteón con margen, 15 minutos antes o después
- ✅ **1c** — CAMBIA la regla de la V54: lo que no se pueda confirmar va como «con margen», no «estricta»; actualizar CLAUDE.md
- ✅ **2a** — Haría en dos paradas: «Haría» (sin horario, a pie) y «Casa-Museo César Manrique» (su horario, entrada y puntualidad), cada una con su foto, artículo y su pedazo; aparcar una vez; los viajes ya creados cambian solos (se ve en: haria_app.jpg)
- ✅ **2b** — Quitar el belén «100 Presepi» del Vaticano de los datos y de la app
- ✅ **2c** — Monedas: todas, también las de Latinoamérica, en Ajustes y en «¿En qué país vives?»
- ✅ **3a** — L2: el día de llegada en Lanzarote con casi 4 horas vacías por la mañana (se ve en: L2_antes.jpg, L2_despues.jpg)
- 🟡 **3b** — L6: miradores, playas y naturaleza de noche: no se proponen tras la puesta de sol; en la tarjeta «De día» y «Se ve hasta las 18:26», nunca «Cerrado» — Los sitios de día no pasan por el aviso amarillo «Hoy ya no llegas a X», solo por la tarjeta.
- ✅ **3c** — P2: la fila de botones de la tarjeta del viaje en RUTA no se corta y «Ruta» y «Explorar» no salen marcadas a la vez (se ve en: P2_antes.jpg, P2_despues.jpg)
- 🟡 **3d** — P3: cargar bien las fotos (hueco del color de fondo, fundido suave, el autor entra con la foto) — Las fotos de HOY, DÍAS, EXPLORAR, recuerdos y reservas siguen con img suelto: queda por aplicar «en toda tarjeta con foto que tarde». No hay captura «antes».
- ✅ **3e** — T2: «En coche · 3 min · 1 km» siempre en una línea (se ve en: T2_despues.jpg)
- ✅ **4** — El catálogo de avisos al día (CATALOGO_AVISOS.html), con una captura de cada aviso, hoja y momento y cuándo sale, cuántas veces y si suena
- ✅ **5** — Build sin errores; push a main; producción



## V66 · Respuestas de Eric, Emblema Oculto y atardecer
1. La hoja nueva del Emblema Oculto ya no tiene «Ahora no» (el dibujo no lo trae): ¿bien? La prueba vieja `pruebaTandaHOY1_B` lo clica y ya no encaja.
2. El botón del atardecer es el dorado de siempre porque el champán del dibujo ya no existe (V53): ¿bien?
3. En Lanzarote el atardecer puede llevar un nombre largo en el botón («Ir a El Golfo y el Charco de los Clicos»): ¿lo acortamos?
4. Si el viajero dice «no» a pasar una entrada al día que trae su documento, tampoco se aplica la hora del documento: ¿bien?
5. ¿Se quitan también las horas de la hoja de Reorganizar (V61), que sigue enseñando cambios de hora de más de 15 min, como pides en las hojas de HOY con muchos cambios?
6. La tira «Guarda un recuerdo» tras ganar un pedazo sigue saliendo en sitios con pedazo (no solo en «Los imprescindibles» y maravillas): ¿también la limitamos?
7. [Sin fuerzas] → «Por hoy ya está» → resumen del día: el resumen no se pudo ver en pantalla (sin cuenta real no se abre): ¿lo compruebas tú?

## V67 · Datos, viajeros de prueba y catálogo
8. Las webs oficiales de Domus Aurea, Galería Borghese y Museos Vaticanos no abrieron: Vaticanos, Domus Aurea, Última Cena y Free Tours quedan «con margen», no «estrictos» como esperabas, y el resto de Roma sin confirmar y parte de Lanzarote también «con margen», no «libres». ¿Los pasas tú a estrictos (una línea de cada archivo `_puntualidad.json`)?
9. Haría: la historia (audio) del pueblo se repartió por párrafos y la frase «Fíjate en tres cosas» quedó partida en dos: ¿la revisas?
10. La migración que corrige Haría en los viajes ya creados no se probó sobre uno guardado antiguo: ¿lo compruebas abriendo uno?
11. Monedas: se asume que Ajustes las saca de las tasas (no se abrió la pantalla): ¿lo compruebas?
12. L2: bajé «instalarse» de 60 a 20 minutos en Lanzarote (dejar las maletas y salir). En Roma sigue en 60: ¿lo bajamos también? Haría falta el barrido de 365.
13. L6: tras la puesta de sol, un mirador o playa sale con la etiqueta «YA ES DE NOCHE» (texto mío): ¿te vale?
14. L6: los sitios de día no pasan por el aviso amarillo «Hoy ya no llegas a X», solo por su tarjeta: ¿bien?
15. P3: el fundido de las fotos solo está en el Perfil, la portada y el mosaico de destinos; HOY, DÍAS, EXPLORAR, recuerdos y reservas siguen igual: ¿lo extendemos?

## Lo que no se ha podido comprobar (todo en modo rápido, sin pruebas)
16. Barrido de 365 tras tocar el motor de coche (L2) y el del día de llegada (V61), GPS real y lluvia real, T2 con letra pequeña y P2 con un nombre de destino largo.
17. Pruebas viejas que ya no encajan: las que buscan la hoja vieja del Emblema Oculto con «Ahora no», `HoyYaNoDaTiempo`, «Empiezas hacia las…», la casilla «Noches» y «o escribe los datos a mano».
