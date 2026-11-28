# CHECKLIST V77 a V81 (25-nov)

**✅ 54 hechos · 🟡 17 a medias · ❌ 2 no hechos (de 73 puntos).**

Cada punto de cada tanda, uno por línea: ✅ hecho (y dónde se ve) · 🟡 a medias (qué falta) · ❌ no hecho (por qué). Cada tanda con sus pruebas.html`.

## V77 · Tus respuestas a las 44 preguntas: Lanzarote visible, Free Tour, pendientes, consejos, restaurantes

- ✅ **1a** — Publicar los destinos: Lanzarote deja de estar oculto (DESTINOS_OCULTOS vacío por defecto) y los que vengan, igual (se ve en: visible_destino.jpg)
- ✅ **1b** — Las pruebas ya no dependen de DESTINOS_OCULTOS='-': una sola configuración para pruebaJutrip, pruebaTandaLL_LZ y las de Lanzarote
- ✅ **1c** — Las fotos de Lanzarote cargan para todos; si hay algo más en el código que esconda Lanzarote
- 🟡 **2a** — Nombres cortos: un campo nombre_corto en los datos (Timanfaya, La Geria, Las Grietas, los Jameos) usado en las frases que nombran varios sitios; «Lo mejor:» con los imprescindibles primero — Solo «Lo mejor:» usa el nombre corto; avisos y resúmenes no (el campo y el mapa ya están, falta enchufarlos). «El Golfo y el Charco de los Clicos» se lee mal sin su nombre corto propuesto «El Golfo». «Las Grietas» y «La Geria» salen con mayúscula en mitad de frase.
- ✅ **2b** — Roma y el resto: proponer los nombres cortos en DECISIONES, sin ponerlos
- ✅ **3a** — (20) «Atardecer en El Golfo»: parada propia al final del día 1 de Lanzarote, a la hora de la puesta de sol (se ve en: atardecer_hoy_atardecer.jpg)
- ✅ **3b** — (17) Un Free Tour reservado va a SU hora y en su franja; sin reserva, solo a sus horas reales (10, 12, 15, 17, 19, 21)
- ✅ **3c** — (18) Una visita que acabaría tras el cierre y no se puede acortar: cambioMinimo la pasa al mejor día; si no cabe, a pendientes
- ✅ **3d** — (15) MAX_SACADOS se queda en 8
- ✅ **4a** — «Si te sobra tiempo» se une a «Lugares pendientes»: una sola lista (se ve en: pendientes_dias_pendientes.jpg)
- ✅ **4b** — En HOY, desde pendientes se puede añadir a hoy (lo que hacía [Recuperar]) o [Pasar a otro día] (se ve en: pendientes_hoy_pendientes.jpg)
- 🟡 **5a** — (21) Arrecife a mediodía: 2 o 3 restaurantes más con datos reales y fuente — Un tercero no se pudo añadir: sin datos fiables (lanzarote.com da 403).
- 🟡 **5b** — (22) Coordenadas de Liken, Tacande, El Risco y los demás, con la fuente; ejecutar lanzaroteRestaurantes.mjs — lanzaroteRestaurantes.mjs NO se ejecutó: no usa Mapbox ni clave y al regenerar borraría V_comida_arrecife y los revisa_horario añadidos a mano. Tacande es aproximada (punto de «cercanos»). Siguen sin coordenada unos 18 (Bogavante, Mar Azul, La Puerta Verde, Casa Carlos —OSM lo sitúa en otra calle—, Girasol, La Maresía, Malecón, Lilium, Naia…).
- 🟡 **5c** — (13) Consejos de cada excursión y día especial, con icono y fuente; cómo se ven: C1-C3 de «Consejos del día» — «No hay fuentes dentro» de Pompeya es falso (hay fuentes públicas): la frase cambió. Sin consejo de efectivo en La Graciosa (sin fuente) ni abrigo ni documento fijos (la app no baja temperatura y ninguna web oficial pide documento). Sin consejos: Nápoles propio, Ostia, Venecia, Costa Amalfitana y otros días de playa. Los de Tívoli salen de una fuente no oficial.
- ❌ **5d** — Audio de la historia de Haría: rehacerlo con crearAudiosHistorias.mjs — NO creado: --solo=haria_pueblo no existe (el script espera el nombre «Haría»); falta AUDIOS_SECRETO donde lo lee el script (el nombre del audio lo lleva y el servidor de Vercel buscaría otro, así que saldría inservible); no existe public/audios/lanzarote ni data/audios/lanzarote.json: no hay ningún audio hecho, así que no hay nada que «rehacer»; y la historia de norte.json dice «dos cosas», no «tres».
- ✅ **6a** — (30) Borrar una reserva no lleva [Deshacer]: la hoja dice la verdad
- 🟡 **6b** — (38) La escala: solo el dato, sin aviso: «Escala de 45 min en Madrid» entre los dos tramos — Solo en RESERVAS, no en HOY; no se ve una escala que cruce la medianoche.
- ✅ **7** — (9) La franja dorada de la tarjeta de cierre se queda como el dibujo; el resto, como lo propusiste
- ✅ **8** — Pruebas del §3 y pruebaJutrip; build
- ✅ **9** — Build sin errores; push a main; producción

## V78 · Cámara y galería: una sola regla; puntos de foto

- ✅ **1a** — Una sola regla para la cámara y la galería: si está la parada de HOY y tiene algo por ganar, cuenta solo esa
- ✅ **1b** — La ubicación se mira al hacer la foto, no al abrir la cámara; la parada de ahora la manda la app al servidor con la foto
- ✅ **1c** — Una foto sin nada que ganar va al álbum, sin ningún aviso; el radio de «has llegado» no cambia
- ✅ **2a** — El código de los puntos de foto: campo puntos_de_foto por sitio; desde un punto la foto vale para ese sitio pero sin «has llegado»
- 🟡 **2b** — Los puntos reales, propuestos con su fuente en docs/dias/PUNTOS_DE_FOTO_PROPUESTOS.md (sin meterlos en los datos) — Solo 3 tienen fuente abierta y confirmada (Colle Oppio, Mirador del Río y Risco de Famara); el resto, sin confirmar (algunas webs dan 403 o 429). Sin punto fiable: Castillo de Sant'Angelo, Vittoriano, Montañas del Fuego, Jameos, Cueva de los Verdes, Papagayo, Salinas de Janubio, La Geria, Los Hervideros, Teguise y Arrecife; Largo Gaetana Agnesi, la terraza del Campidoglio y el Mirador del Golfo caen dentro del radio normal. La longitud de Guinate difiere entre webs (-13.5424 frente a -13.501 de OpenStreetMap): se usó OpenStreetMap.
- 🟡 **2c** — El caso de Via dei Fori mirando el Coliseo: antes la foto iba al Foro — Propuesta no implementada: dejar que la parada de HOY valga también a menos de ~150 m del borde de su radio. El punto de Via dei Fori cae dentro del radio normal del Foro (240 m, radio 350): solo sirve porque el punto tiene prioridad sobre el radio normal.
- ✅ **3a** — pruebaV78 (Roma y Lanzarote) con los casos pedidos
- ✅ **3b** — Pasar las de logros, V36, pruebaJutrip y el build
- ✅ **4** — Build sin errores; push a main; producción

## V79 · Cerrar mi viaje, resumen del viaje y medallas por nivel

- ✅ **1a** — «Cerrar mi viaje» (VL6): en «Ya en el aeropuerto», debajo de la tarjeta del vuelo, la tarjeta oscura con estrellas «Tu viaje a Roma termina aquí» y [Cerrar mi viaje] (se ve en: design_VL6.jpg, VL6_roma_app.jpg)
- ✅ **1b** — Al pulsarlo se abre el resumen del viaje y HOY pasa a «después»; no se borra nada (se ve en: VL6_roma_tras_cerrar.jpg)
- 🟡 **1c** — Si no lo pulsa, el resumen sale solo UNA vez, 2 horas después de «Ya en el aeropuerto» o, si no pasó por ahí, 2 horas después de la hora del vuelo — Cambio de comportamiento sobre la V74: HOY pasa a «después» a las 2 h del aeropuerto aunque el vuelo no haya salido (aeropuerto a las 16:00 y vuelo a las 19:30: a las 18:00, no a las 19:30). El resumen solo se abre solo si HOY está montado: si la persona está en otra pestaña a las 2 h, sale al volver a HOY.
- ❌ **1d** — Se puede volver a abrir desde el viaje acabado en Perfil — Propuesta en DECISIONES_V79: pasarle el tripId por parámetro (unas 20 líneas). Ya se reabre desde HOY «después», «Tus logros» y el resumen del día.
- ✅ **2a** — «Resumen de tu viaje a Roma» a pantalla completa con la forma de P1: foto real, «TU VIAJE A ROMA · 6 DÍAS», título y la tarjeta de la medalla con su grado y su frase (se ve en: design_VL7a.jpg, app_resumen_roma_1.jpg)
- ✅ **2b** — «Más medallas» solo en destinos con más de una medalla (Roma: Roma y el Vaticano) y solo si en este viaje se ganó esa otra; en Lanzarote nunca
- ✅ **2c** — «Colecciones que han avanzado» («4 de 8» y la barrita de P1) y «Emblemas ocultos descubiertos» con su dibujo real y su nombre (se ve en: app_resumen_roma_2.jpg)
- ✅ **2d** — «Logros de viajero» ganados en este viaje: tarjetas de L1 sin el círculo de la vitrina (se ve en: app_resumen_roma_3.jpg)
- 🟡 **2e** — «Tus fotos del viaje» (unas cuantas y «+43»; al tocar, el álbum) y «Roma aún esconde 9 secretos: vuelve cuando quieras» — Programada y con la lógica probada pero no vista con fotos reales (el Chrome de pruebas no habla con Supabase). Consultas del resumen: cuenta de fotos (≈0,1 KB) y lista para las miniaturas (≈15 KB), una vez al abrir; la tarjeta «Cerrar mi viaje» pide la cuenta (≈0,1 KB) una vez. Nada en bucle.
- ✅ **2f** — [Ver mi pasaporte] en GRANATE; regla nueva en CLAUDE.md: el pasaporte va siempre en granate
- ✅ **2g** — Al tocar una medalla o una colección, la ficha en grande de la V72; con pocos logros no queda vacío (se ve en: app_resumen_pocos_1.jpg)
- ✅ **3a** — Los logros que cuentan se dibujan SIEMPRE con la medalla del nivel que les toca por el TOTAL (1.º y 2.º país nivel 1; el 3.º sube a Trotamundos) (se ve en: v79_dia2.jpg)
- 🟡 **3b** — Cada país nuevo con su bandera redonda en la esquina de la medalla; fuera el emoji delante del nombre — Design VL7a pone la bandera pequeña DELANTE del nombre, no en la esquina; se siguió tu frase. Un país cuyo nombre no se reconoce sale sin bandera (no probado con todos los del catálogo). «Todos mis logros» y la ficha dibujan la medalla de la familia y no una por país, así que ahí no hay bandera.
- ✅ **3c** — Una sola cuenta para todo: una función que dado el logro y el total da su nivel, usada por todas las pantallas (se ve en: v79_todos.jpg)
- ✅ **4a** — pruebaV79 (función del nivel, resumen del día con un 4.º país, resumen del viaje sin otra medalla, sale una sola vez)
- ✅ **4b** — Pasar pruebaLogros1/2, pruebaV35A_logros, pruebaJutrip y el build
- ✅ **5** — Build sin errores; push a main; producción

## V80 · El día de excursión en HOY paso a paso y la excursión cancelada

- ✅ **1a** — Dos tipos de excursión: organizada o por tu cuenta, y cómo lo sabe la app
- ✅ **1b** — modo_habitual en los datos de cada excursión (Pompeya organizada; La Graciosa, Florencia y Nápoles por tu cuenta; las demás con propuesta)
- ✅ **2a** — Por tu cuenta: la tarjeta con foto real, «EXCURSIÓN · VIE 27» y las cajas SALIDA, FERRY/TREN («falta billete»), VUELTA («Último barco 17:00» según la fecha) (se ve en: design_EX1_EX2_EX3.jpg, ex1_app.jpg)
- ✅ **2b** — Los consejos con la X: cerrados, no vuelven ese día en ese viaje
- ✅ **2c** — Los pasos de logística, cada uno su tarjeta, sacados de partes y de los billetes; «PASO 1 · AHORA» con [Cómo llegar] / [Ya he llegado] y [He embarcado] (se ve en: design_EX1_EX2_EX3.jpg, ex2_app.jpg)
- 🟡 **2d** — «Tu tiempo en La Graciosa»: ideas, no órdenes, sin [He terminado]; 3 playas con foto pequeña y [Cómo llegar]; restaurantes en una línea sin botón; la nota de en_la_isla; qué ver / escuchar / cámara solo con contenido — Las ideas salen sin foto pequeña (solo el color de la tarjeta): ningún sitio tiene foto propia en el proyecto; FilaDeIdea ya lee «foto» cuando haya. Los sitios de Florencia y Nápoles no se comprobaron contra la web de cada sitio. Historias que faltan: Pompeya, Florencia y Nápoles no tienen historia (no sale «Escuchar»); «Qué ver» no sale en ninguno de los cuatro (La Graciosa tiene what_to_see vacío); La Graciosa sí tiene historia; la cámara solo sale con logros activos y un pedazo o emblema.
- ✅ **2e** — Cuándo se da el transporte por hecho: con el GPS, con [He embarcado] o, sin las dos, pasada la hora más el trayecto («¿No has cogido este barco? [Cambiar la hora]»); el último de vuelta nunca se supone
- ✅ **2f** — El aviso del último barco o tren (EX3) en la fila roja, desde 1 h 30 antes (se ve en: ex3_app.jpg)
- ✅ **3a** — Organizada (EX4): las cajas RECOGIDA, DURACIÓN y TRANSPORTE; la reserva con su QR y los consejos con su X (se ve en: design_EX4_EX5_EX6.jpg, ex4_app.jpg)
- 🟡 **3b** — Como la tarjeta de la parada: «Aquí ganas X pedazos» con la pieza de siempre, qué ver/escuchar/cámara solo con contenido, [He terminado] de punta a punta, sin [Necesito más tiempo] ni «Saltar parada» — [He terminado] guarda «Excursión hecha» y muestra «ideas y pendientes», pero no pasa por el flujo del «visto» de la parada: la colección y el Reto del día no se suman al terminar una excursión organizada.
- ✅ **4a** — «¿Qué hago ahora?» no sale nunca en un día de excursión (ni en la excursión, ni al volver, ni en la cancelada)
- ✅ **4b** — Al volver, en lugar de ¿Qué hago ahora?: «¿Te queda tiempo y quieres seguir visitando? Aquí tienes ideas cerca de ti.», tus Lugares pendientes, 3 o 4 ideas y [Ver en Explorar]; una sola pieza para los dos usos (se ve en: EX4_design.jpg, EX4_alvolver_app.jpg)
- 🟡 **5a** — Excursión cancelada (EX7, EX8): «¿Se ha cancelado la excursión?» → tarjeta gris «EXCURSIÓN CANCELADA · Hoy no hay excursión: tienes el día libre» y aviso con [Deshacer] — Se hizo la forma de EX7 (foto en gris, nombre y franja); la compacta de EX8 (círculo con X) no. La Graciosa no trae foto en los datos y sale el gris liso. El estado está solo en el móvil (localStorage por viaje y día): no va con la cuenta ni se comparte en un viaje compartido (propuesta de camposDelViajero en DECISIONES).
- ✅ **5b** — «Tu día libre en Roma/Lanzarote»: Lugares pendientes con [Otro día] y [+ A hoy], 3 o 4 ideas de EXPLORAR con [Ver en Explorar], sin ¿Qué hago ahora?
- ✅ **5c** — [Hacer La Graciosa otro día] (solo por tu cuenta): la hoja de cambiar días de la V69 que intercambia los días, con [Deshacer] (se ve en: L_EX8b_app.jpg)
- 🟡 **5d** — «Cerca de ti» sale en el día libre de la cancelada y al volver; durante la excursión solo si hay datos de ese sitio — Durante la excursión no sale: en el proyecto no hay gasolineras, baños ni aparcamientos de La Graciosa, Pompeya, Florencia ni Nápoles.
- ✅ **6** — Pruebas: La Graciosa por tu cuenta, Pompeya organizada, cancelar y [Deshacer], Florencia en tren; y pasar V76, V68, Jutrip y el build
- ✅ **7** — Build sin errores; push a main; producción

## V81 · Retoques del iPhone: fichas, reserva Otra en DÍAS, teclado

- 🟡 **1** — RESERVAS: las fichas del contador «X de N reservas listas» en columnas iguales (3 si caben en una línea, si no 2), con los nombres enteros — En el iPhone de 390 px salen 2 columnas (la tarjeta mide ~328 px y la ficha más larga ~140 px: 3 no caben). Si quieres 3 en el iPhone habría que reducir la letra o quitar el círculo ✓ (propuesto en DECISIONES_V81).
- ✅ **2a** — DÍAS: la tarjeta de una reserva extra como R13/R13b: borde que se ve, nombre una vez con su etiqueta («OTRA», «FERRY», «TREN», «AUTOBÚS»), cajas A LAS / HASTA / LUGAR, fila «Tu reserva» con su QR (se ve en: R13_design.jpg, otra_dias_app.jpg)
- 🟡 **2b** — En su sitio por la hora: una reserva a las 19:30 va ANTES de la cena y la cena pasa detrás; la app no reorganiza el día sola — Con la cena a las 19:00 y la reserva a las 19:30, la reserva va DETRÁS de la cena (solo se adelanta con hora igual o posterior): si quieres forzarla siempre delante, dímelo. Al cortar la franja la línea punteada del día se interrumpe un momento.
- ✅ **2c** — En la hoja de «Otra», un campo opcional «Hasta las…» con la rueda de hora de siempre
- ✅ **2d** — Si choca con una parada, el «Revisa las horas» de siempre (V69)
- ✅ **3** — «Casi lista» de ferry, tren, autobús y otra en grupo con PersonasCuadradas y sin líneas que se contradigan (se ve en: casi_lista_tren_mia_app.jpg)
- 🟡 **4a** — Las hojas con un campo de texto y el teclado del iPhone: la hoja se coloca encima del teclado, no cambia de alto al filtrar, título y buscador siempre a la vista — Safari en iOS real NO comprobado. Se simuló un visualViewport falso (la hoja pasa de 776 px, con la parte baja tapada, a 467 px, justo sobre el teclado: 41–508). Hojas miradas una a una: Ajustes › Moneda, Ajustes › País y «+ Añadir una reserva» (Ferry, campo Naviera); el resto las cubre el mismo mecanismo global, sin mirarlas una a una. En las hojas que no son HojaOpciones el título sale con el panel al deslizar, no queda fijo. El umbral de 120 px y scale < 1,05 es mío: un teclado flotante o el iPad con teclado físico puede no activarlo. Si hay un salto entre focusin y resize en iOS real.
- ✅ **5** — Pruebas: pruebaV76, pruebaV75, pruebaJutrip y el caso de la cena detrás de una reserva a las 19:30
- ✅ **6** — Build sin errores; push a main; producción



Cada una con la pregunta y mi propuesta. Las que dicen «migración» necesitan que las apliques tú.

## Motor y HOY
1. **Free Tour a las 10:00 y el desayuno (día 1 de 3 días, 9-mar-2027).** Con el tour a las 10:00 el día 1 deja el Panteón, la Via della Conciliazione y el Castillo en pendientes: solo cabía un desayuno antes. Es tu regla al pie de la letra. *Propuesta:* dejar ir antes del tour lo que quepa con margen (Panteón a las 9:00, como antes).
2. **Reserva «Otra» a las 19:30 con la cena a las 19:00.** Va detrás de la cena (solo se adelanta con hora igual o posterior). *Propuesta:* dejarlo así; si la quieres siempre delante, lo cambio.
3. **Fichas del contador de RESERVAS en el iPhone:** salen 2 columnas, no 3. *Propuesta:* dejar 2; para 3 habría que reducir la letra o quitar el círculo ✓.
4. **«Casi lista» en grupo:** ¿una línea pequeña «Va a Mi cuenta · Solo lo ves tú»? *Propuesta:* no, ya no se contradice.
5. **Excursión cancelada:** solo se guarda en el móvil (no se comparte en un viaje compartido). *Propuesta:* guardarla en la cuenta (`camposDelViajero`) en una tanda aparte.
6. **Terminar una excursión organizada** no suma colección ni Reto del día. *Propuesta:* que pase por el flujo del «visto».
7. **Excursión por tu cuenta o organizada:** los `modo_habitual` de Costa Amalfitana, Florencia y Pisa y Tívoli (organizadas) y de Venecia, Ostia Antica, Fuerteventura e Isla de Lobos (por tu cuenta) son mi propuesta. *Pregunta:* ¿los confirmas?
8. **HOY pasa a «después» 2 h tras «Ya en el aeropuerto»** aunque el vuelo no haya salido. *Propuesta:* esperar a la hora del vuelo si es posterior.

## Datos y textos
9. **Audio de Haría:** no creado (falta el secreto de audios). *Propuesta:* lo generas tú o me lo pasas cuando quieras.
10. **Puntos de foto (V78):** 9 propuestos en `PUNTOS_DE_FOTO_PROPUESTOS.md`, solo 3 con fuente confirmada. Via dei Fori no cambia hasta que apruebes el punto. *Pregunta:* ¿cuáles apruebas?
11. **Nombres cortos de Roma** (solo «Lo mejor:» los usa): *Propuesta:* aprobar la lista y extenderlos a las demás pantallas.
12. **~18 restaurantes sin coordenadas** y Tacande aproximada. *Propuesta:* completarlas con Mapbox en una tanda de datos.
13. **Historias de Pompeya, Florencia y Nápoles** (no sale «Escuchar») y fotos pequeñas de las ideas. *Propuesta:* encargarlas a la próxima tanda de contenido.
14. **Hoja de pago:** muestra «Texto pendiente» (texto legal). *Propuesta:* escribirlo o quitarlo antes de abrir pagos.
15. **Fotos:** 78 pasan de 300 KB. *Propuesta:* recomprimirlas solo si te molesta el peso del repositorio; la foto de cabecera de la parada en HOY se queda grande.

## Supabase (finde, Paso 5) — todas con migración o cambio de regla
16. **Resumen de «me gusta»** (`place_likes_resumen(destino)`, ~3 KB). *Propuesta:* migración nueva.
17. **Avisos del viaje sin bajar la ruta entera** (`avisos_viaje_para_plan`) o rehacer solo cuando cambie la huella. *Propuesta:* migración nueva.
18. **Solo los avisos nuevos** (`avisos_de(p_uid, p_desde)`). *Propuesta:* migración nueva.
19. **Subir la vida de la lectura ligera del servidor de 30 s a 2-3 min** (ahorra otro ~60 % de «cerca»). *Propuesta:* sí, con el riesgo de ofrecer un pedazo ya ganado un rato.
20. **«Cerca de aquí» quieto cada 10 min** (hoy 5) y **campana cada 10 min** (ya llega por Realtime). *Propuesta:* sí a las dos.
21. **Mirar el gráfico de egress de Supabase unos días:** si no baja de ~160 a ~80 MB/día, la causa sigue siendo otra.

## Riesgos sin arreglar (los dicen los agentes)
- Botones viejos de quitar (SaleCards, TransportRow, InsuranceRow, RentalVehicleRow, UtilParaElViaje, AnadirReserva) borran de golpe, sin hoja de confirmar.
- El teclado del iPhone solo se probó con un teclado simulado; Safari real sin comprobar.
- `listas.json` de Lanzarote se regenera con `lanzaroteDatos.mjs` y perdería «Atardecer en El Golfo».
- `pruebaV36_cliente` parpadea con la máquina cargada; `pruebaFase6y2_fotos` está desfasada.
- Las rutas de Lanzarote en `HOY2_B` y `HOY2_C` fallaron varias veces antes de arreglar la espera; la causa no está confirmada.

## Probador (finde, Paso 6): fallos del motor sin arreglar (tocan `shared/routeEngine`)
- **Lanzarote, vuelo de vuelta a las 17:30:** el día sin paradas conserva la cabecera «Sal de casa a las 09:10 · 45 min · 43 km» (el tramo a Teguise, que el motor quitó) y queda vacío con 6 h libres. *Propuesta:* una tanda de motor que quite la cabecera y rellene el día.
- **Nota de Teguise** dice «posiblemente ya esté cerrado» de un pueblo (V56: los pueblos no cierran). *Propuesta:* quitar esa nota.
- **Lanzarote 15:30:** «el día es tuyo hasta las 13:15» contra «devuelve el coche antes de las 13:00», y dos tramos «al aeropuerto» con km distintos (29 y 33).
- **Roma 15:30 y 17:30:** queda un «DE CAMINO» huérfano y «0 paradas» con un solo desayuno.
- **Terminal:** HOY enseña «1» y RESERVAS «T1». *Propuesta:* una función común `etiquetaDeTerminal`.
- **Arreglo hecho** (comidas del día de vuelta): un día de vuelta sin `meals` de cena no pinta cena nunca, ni con vuelo a las 21:00 o más.
- El probador usa la zona por defecto de Lanzarote y no pone alojamiento ni reservas.

## Batería completa (finde): 355 pruebas corridas, 271 bien y 84 mal (no se ha arreglado ninguna; lista completa en `docs/dias/_bateria_365.md`)
Faltan 8 de las 363 sin apuntar (no terminaron o se repitieron). Mi lectura, sin haber abierto cada una:
- **Desfasadas por decisiones de Eric (lo más probable, ~55):** el contador de RESERVAS «x de 4 listo» (V22/V58: `pruebaV22`, `Tanda10G`, `Tanda6s`, `Tanda6z6a`, `Fase6z6f`), Lanzarote con 35 sitios y Haría partida (`TandaLZ1_B`, `LZ2b1_A/B`), «Deshacer» al borrar reservas (V75/V77: `Fase6y3_reservas`, `Tanda7_reservas`), emoji/trazos en tarjetas (`Fase6y4_iconos`, `Tanda6z3`), V18/V21/V28 (archivos que ya no existen), estudio de sonidos con 29 tarjetas (`V38*`, `V39*`, `V40*`), panel admin (`V33`, `V35A`), `Cuentas3` y `10N_compartir` (sin claves de Supabase en la prueba).
- **Posibles fallos reales (hay que mirarlos):** al «Quitar la hora» la casilla queda vacía en vez de volver al ejemplo (`10S3_C`, `10S6_O`, `10S9_C`, `10S9b_B`); «null» en el aviso del mirador del atardecer (`10P_hoy`, `HOY2b_E`); el recuadro «Sin tu ubicación» respecto a «Escucha su historia» (`V46`); `V42` (botones flotantes) y `V27` (tarjetas de DÍAS alineadas); `HOY2b_D` (foto de los sitios y [Volver a mi ruta]); `V2Hoy` («avisoDeCerrada is not a function»); `Fase6y2_formulario` (tocar «Ponle nombre»).
- **Exit raro (marcadas OK pero con salida sospechosa):** `pruebaV38`, `FotosLanzarote`, `10H`, `10I`.
- Hay 6.615 carpetas viejas `enLaApp-*` en Temp (perfiles de Chrome): bórralas a mano o dime y lo hago.
*Propuesta:* una tanda de «ponerse al día» que actualice las desfasadas y arregle las 8 posibles reales.
