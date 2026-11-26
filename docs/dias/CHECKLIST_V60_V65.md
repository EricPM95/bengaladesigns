# CHECKLIST V60 a V65 (25-nov)

**✅ 73 hechos · 🟡 15 a medias · ❌ 0 no hechos (de 88 puntos).**

Cada punto de cada tanda, uno por línea: ✅ hecho (y dónde se ve) · 🟡 a medias (qué falta) · ❌ no hecho (por qué). Todas las tandas se hicieron en modo rápido, SIN pasar pruebas. Detalle y capturas en `REPASO_V60_V65.html`.

## V60 · La búsqueda de Civitatis y la hora que recomendamos para reservar

- ✅ **1a** — Buscador de Civitatis en el servidor: buscar(texto, destinoId) con searchText, lang y currency en el cuerpo, 400 «Not Found» = lista vacia, con cache
- ✅ **1b** — civitatisBuscarCinco.mjs con el formato bueno, pasado, y que dice que encuentra para las cinco excursiones de Roma
- ✅ **1c** — Apuntar la respuesta de Civitatis en docs/civitatis/
- 🟡 **1d** — La nota y las opiniones, de la ficha de la actividad (no del listado) — No he pedido la ficha de ninguna actividad ni comprobado produccion (solo sandbox).
- ✅ **2a** — La hora recomendada es la primera que cabe DESPUES (nunca antes de poder estar alli), desde la hora util del vuelo el dia de llegada (se ve en: F1_app.jpg)
- ✅ **2b** — Si ese dia no cabe ninguna o no hay plazas, la del dia mas cercano con hueco (se ve en: F2_app.jpg)
- ✅ **2c** — Se recalcula al cambiar el vuelo o el orden del dia, sin Reorganizar
- 🟡 **2d** — Al guardar la reserva en otro dia, la parada pasa a ese dia en la ruta — No probado de extremo a extremo.
- ✅ **2e** — Dibujo F1: caja verde «TE RECOMENDAMOS», dia y hora grandes y el porque (se ve en: F1_design.jpg, F1_app.jpg)
- ✅ **2f** — Dibujo F2: franja ambar «no llegas» y caja verde del primer dia que encaja, con la frase gris (se ve en: F2_design.jpg, F2_app.jpg)
- ✅ **2g** — Dibujo F3: franja roja «no quedan plazas» y «El dia mas cercano con plazas» (se ve en: F3_design.jpg, F3_app.jpg)
- 🟡 **2h** — Funciona tambien en Lanzarote (en coche) — Sin captura de la app en Lanzarote (la API no la tenia visible).
- ✅ **3a** — Build sin errores; push a main; produccion

## V61 · Reorganizar: que deje el día bien a la primera y se entienda

- ✅ **1a** — Toda reserva o actividad con hora (Free Tour) va A SU HORA, no como primera parada; sin hora, el motor elige la de la regla de la V60
- 🟡 **1b** — Lo que llegaria cerrado va antes del Free Tour si cabe, o sale del dia a pendientes (nunca queda en la ruta cerrado) — El Panteon con el vuelo de 17:00 sigue «por fuera» (ya venia asi en el documento de llegada tardia). Con ese vuelo lo que ya no cabe el viernes no llega a otro dia ni a pendientes: sale como «Se quita de tu viaje» (unas 17 tarjetas). Ver DECISIONES_V61.
- ✅ **1c** — Reorganizar da el resultado final de una vez; reorganizar dos veces = mismo resultado, con comprobacion en el codigo
- 🟡 **1d** — [Deshacer] devuelve EXACTAMENTE los dias que toco y no abre ninguna hoja sola — Razonado por codigo, no probado en pantalla.
- 🟡 **1e** — El boton flotante desaparece tras [Reorganizar mi dia] y solo se queda tras [Dejarlo como esta] — No visto en pantalla.
- ✅ **2a** — Hoja unica RO1 «¿Reorganizamos tu dia?», RO2 «¿…tus dias?» (agrupada por dia) y RO3 «¿Adaptamos tus dias a tu vuelo?» (se ve en: RO1_design.jpg, RO1_app.jpg)
- ✅ **2b** — RO2: tarjetas agrupadas por dia con cabecera «VIERNES 27»; un sitio que cambia de dia sale en el dia al que va (se ve en: RO2_design.jpg, RO2_app.jpg)
- ✅ **2c** — RO3: al guardar un vuelo sale directamente la hoja; [Reorganizar] sin boton flotante; [Dejarlo como esta] lo deja (se ve en: RO3_design.jpg, RO3_app.jpg)
- 🟡 **2d** — Texto de arriba concreto («Aterrizas a las 17:00 y quedas libre hacia las 19:50…») — «Has añadido la Galeria Borghese el sabado…» no sale: no existe el dato de lo que se añadio. En Lanzarote el motor no da la hora de quedar libre.
- ✅ **2e** — Una tarjeta solo por cada sitio que cambia de verdad (dia, pendientes, quitado o hora >15 min), con a donde va y la hora, nunca numero de parada ni «hoy»; tambien los que se van
- ✅ **2f** — Franja verde concreta con un solo ✓ y botones [Reorganizar mi dia/mis dias] dorado y [Dejarlo como esta] lado a lado
- ✅ **2g** — Las propuestas entre viajeros de un viaje compartido no se tocan
- ✅ **3a** — Probador: la linea de lo que decidio el motor y por que, en palabras (fuera `free_tour_con_hora_ya_empezado` y «El el dia 1») (se ve en: probador_roma_eric-1030.jpg)
- ✅ **3b** — Probador: primer y ultimo dia antes y despues, lado a lado (se ve en: probador_roma_eric-1700.jpg)
- ✅ **3c** — Probador: casos preparados con un toque (llegada 9/14/21, salida 10/18, 16:00 con FT 17:00, 18:00 con FT sin hora, y los de Eric 10:30/13:30/17:00 a Ciampino) (se ve en: probador_roma_eric-1330.jpg)
- ✅ **4a** — Un caso en Lanzarote (se ve en: RO2_lanzarote_app.jpg)
- ✅ **4b** — Build sin errores; push a main; produccion

## V62 · La llegada en HOY (billete y tarjeta del vuelo, en una)

- ✅ **1** — Regla nueva en CLAUDE.md: HOY y RESERVAS, los mismos datos (nada se guarda dos veces; QR gris con «+» tambien en HOY) (se ve en: datos_2_hoy_app.jpg)
- ✅ **1b** — Al tocar el QR gris de HOY abre la hoja de subir documento de la V64
- ✅ **2a** — Una sola tarjeta de llegada (sustituye al billete y a TarjetaBienvenida) con el formato de la tarjeta de la parada (se ve en: L1_design.jpg, L1_app.jpg)
- ✅ **2b** — Imagen fija de avion, tren o coche (una pieza) (se ve en: L5_app.jpg)
- ✅ **2c** — Linea del billete y fila del vuelo (TERMINAL/ASIENTO/REF; tren ESTACION/ASIENTO/REF), solo cajas con dato (se ve en: L1b_design.jpg, L1b_app.jpg)
- ✅ **2d** — Fila de abajo AL CENTRO / HOTEL / TU DIA; con coche de alquiler «COCHE · Cicar · Recogelo al llegar» (se ve en: L6_design.jpg, L6_app.jpg)
- ✅ **2e** — Botones: [He aterrizado]/[Vuelo retrasado]; tren/bus/ferry [He llegado]/[… retrasado]; coche propio [He llegado]/[He salido tarde]; enlace «Como llegar al centro» (se ve en: L4_design.jpg, L4_app.jpg)
- ✅ **2f** — Fuera «Aterrizas a las…» y «Empiezas hacia las…»
- ✅ **3a** — Tras [He aterrizado] o GPS: «● AQUI · YA HAS LLEGADO», ✓ verde, sin botones, [Como llegar a tu alojamiento] dorado (se ve en: L2_design.jpg, L2_app.jpg)
- ✅ **3b** — Con coche de alquiler: franja «Primero, recoge tu coche» y el boton lleva en coche (L7) (se ve en: L7_design.jpg, L7_app.jpg)
- 🟡 **4** — [Vuelo retrasado]: hoja «¿A que hora llegas ahora?», hora nueva con la vieja tachada, se cambia en la reserva y sale la hoja de Reorganizar de la V61 — No probado el retraso en tren, coche propio ni Lanzarote. La rueda es la HojaDeHora de siempre (✓ arriba), no el boton [Guardar] del dibujo.
- ✅ **5** — Capturas de L1…L7 al lado del dibujo y que un dato cambiado en RESERVAS sale igual en HOY (se ve en: datos_1_reservas_app.jpg)
- ✅ **6** — Build sin errores; push a main; produccion

## V63 · Arreglos de HOY y DÍAS que vio Eric en el iPhone

- ✅ **1** — Con un aviso con [Deshacer] abajo, la hoja que se abre empieza justo encima del aviso (se ve en: 1_antes.jpg, 1_despues.jpg)
- 🟡 **2** — El aviso «Parada saltada» sale como los demás, tapando el menú entero — Hipótesis: no se reprodujo el fallo del iPhone (en Chrome de pruebas ya salía bien). Si sigue saliendo más abajo, hace falta una captura de ese momento.
- ✅ **3** — Línea de tiempo dorada que se acorta de derecha a izquierda en todos los avisos con [Deshacer], con la duración de ahora (se ve en: 3_antes.jpg, 3_despues.jpg)
- ✅ **4** — El Emblema Oculto de una parada saltada no sale
- 🟡 **5** — Al eliminar un viaje no sale el resumen del día; nunca de un día sin paradas ni pantalla vacía — No reproducido: necesita eliminar un viaje con otro guardado.
- ✅ **6** — El aviso verde «Tu entrada a…» se va a la hora de la entrada + el tiempo de visita de ese sitio (se ve en: 6_antes.jpg, 6_despues.jpg)
- ✅ **7** — El atardecer no sale con lluvia o cielo cubierto previstos; con plan de lluvia nunca un sitio que el plan quitó
- ✅ **8** — Plan de lluvia: frases completas, sin empezar a media frase
- ✅ **9** — «De dónde» cuenta los minutos siempre desde donde dice; el coche se calcula igual en toda la app (se ve en: lanzarote_9.jpg)
- ✅ **10** — El contador «0 DE 5» del álbum, en dorado (se ve en: 10_antes.jpg, 10_despues.jpg)
- ✅ **11** — Fuera «A esta hora ya ha cerrado» y parecidos en DÍAS; en la tarjeta plegada el horario del día («⏳ 15 min · 🕘 9:00–19:00»), «Abierto siempre» sin horario, «Cerrado este día» se queda (se ve en: 11_antes.jpg, 11_despues.jpg)
- 🟡 **12** — El motor no pone visitas en el cierre de mediodía; al añadir una parada a un día en que cierra, avisa sin obligar — El motor de coche no se ejercitó (ningún sitio de Lanzarote tiene dos tramos). Barrido de 365 sin pasar; aviso al añadir no visto en pantalla.
- ✅ **13** — Build sin errores; push a main; producción

## V64 · RESERVAS: documentos, tarjetas del vuelo, el tren y el alojamiento

- ✅ **1a** — Una sola forma de añadir un documento: hoja pequeña [Subir foto o archivo] / [Escribir los datos] en todas las tarjetas (vuelo, tren, barco, entrada, excursión, alojamiento, coche) (se ve en: D1_vuelo_design.jpg, D1_vuelo_app.jpg)
- ✅ **1b** — Fuera los enlaces «o escribe los datos a mano»
- ✅ **1c** — Después de subir, siempre «Revisa los datos» con campos rellenos y [Guardar], en todos los tipos (se ve en: D3_design.jpg, D3_despues_app.jpg)
- ✅ **1d** — Campo «Compañía» arriba de Datos del vuelo/tren, rellenado solo por el código del vuelo (se ve en: D2_design.jpg, D2_app.jpg)
- ✅ **1e** — El QR gris de HOY abre esta hoja (conexión pedida por la V62) (se ve en: HOY_qr_gris_app.jpg)
- ✅ **2** — Línea naranja: «Si no es la buena, súbela otra vez o cambia los datos a mano» con [Es correcta] y [Cambiar] (se ve en: D5_app.jpg)
- ✅ **3a** — Tarjeta guardada del vuelo y del tren: seis cajas en tres filas de dos; sin dato la caja no sale y las demás se recolocan (se ve en: B1_design.jpg, B1_app.jpg)
- ✅ **3b** — Bloque oscuro del documento: «TARJETA DE EMBARQUE · Enséñala en la puerta · [Ampliar]»; tren, ferry y autobús con su frase (se ve en: B3_design.jpg, B3_app.jpg)
- ✅ **4a** — «Llegada y vuelta»: vuelos, luego precio y [Buscar vuelos] abajo del todo (se ve en: LV2_app.jpg)
- ✅ **4b** — Precio con el formato de la caja PRECIO, a lo ancho y con su lápiz
- ✅ **4c** — Vuelta sin poner: solo «+ Falta añadir la vuelta» (se ve en: LV_design.jpg, LV_app.jpg)
- ✅ **5a** — Noches calculadas siempre de las fechas (24 a 27 = 3) y fuera la casilla «Noches» (se ve en: D5a_design.jpg, D5a_app.jpg)
- ✅ **5b** — «DATOS DEL ALOJAMIENTO» en cajas de dos (PRECIO/ZONA, ENTRADA/SALIDA, TELÉFONO/LOCALIZADOR), sin dato no sale (se ve en: D5a_sin_app.jpg)
- 🟡 **5c** — Mapa a lo ancho con dirección y [Cambiar]; [Cómo llegar a tu alojamiento] dorado; [+ Añade tu reserva] blanco con borde — [+ Añade tu reserva] ya era de borde, pero crema con borde dorado, no blanco puro. Sin token de Mapbox sale el mapa de la captura. Quité el segundo lápiz y las líneas de puntos.
- ✅ **6a** — Alojamiento en otra zona: hoja «Tu alojamiento está en Monti» con [Cambiar a Monti] y [Dejarlo como está] lado a lado (se ve en: D6_design.jpg, D6_app.jpg)
- 🟡 **6b** — Al cambiar de zona, Reorganizar (V61) con [Deshacer] — No se vio en pantalla el aviso con [Deshacer] tras [Cambiar]; en Lanzarote no se probó que rehaga los días de coche. Solo pregunta con pase y con zona ya elegida.
- ✅ **6c** — Si la dirección no cae en ninguna zona, no pregunta
- ✅ **7** — La papelera de RESERVAS, un poco más arriba (la tarjeta pierde 15-20 px por abajo) (se ve en: PAP_app.jpg)
- ✅ **8** — Lanzarote (se ve en: LZ_app.jpg)
- ✅ **9** — Build sin errores; push a main; producción

## V65 · Las entradas y las excursiones, cada uno con la suya

- ✅ **1a** — Tarjeta guardada de la entrada: arriba como ahora; «DATOS DE LA ENTRADA» en cajas de dos, sin dato no sale (PRECIO, LOCALIZADOR) (se ve en: D7a_design.jpg, D7a_app.jpg)
- ✅ **1b** — Caja PERSONAS («2 · Eric y Alicia»; en el móvil de Alicia «2 · Tú y Eric · La compró Eric») (se ve en: D7b_design.jpg, D7b_app.jpg)
- 🟡 **1c** — Caja ACCESO de la puntualidad de la V54 («Hora exacta · Llega 15 min antes» o «Todo el día») — Para las de margen puse «Con margen · Hasta N min tarde»: texto mío. «Todo el día» no se capturó.
- ✅ **1d** — Sin documento «+ Sube tu entrada» (hoja de la V64); con documento, el bloque oscuro del QR (se ve en: excursion_app.jpg)
- 🟡 **2a** — El documento de una entrada lo ven todas las personas para las que es, y nadie más — La migración 0095 NO está aplicada: hasta que la apliques todo funciona en cada móvil pero el QR de una persona no llega a las demás. Sincronización real con Supabase sin comprobar.
- ✅ **2b** — Hoja «Las entradas de cada uno»: [Subir todas a la vez], una fila por persona «✓ Subida» + [Cambiar] o «Falta» + [Subir] (se ve en: hoja_design.jpg, hoja_eric_app.jpg)
- ✅ **2c** — [Subir todas a la vez] reparte varios archivos o un PDF de varias páginas por el nombre; lo que no sabe colocar queda «Falta»
- ✅ **2d** — Un solo QR para todos: el mismo en todos los móviles («ENTRADA PARA 4») (se ve en: comun_app.jpg)
- ✅ **2e** — Bloque del QR deslizable: «TU ENTRADA · 1 DE 2», «ALICIA · 2 DE 2», puntitos; [Ampliar] amplía la que se ve; una sola entrada «TU ENTRADA» (se ve en: D7d_design.jpg, D7d_app.jpg)
- ✅ **3** — Quién puede cambiar qué: lo SUYO cada uno desde su móvil sin permiso; lo COMÚN sigue los permisos del viaje (se ve en: hoja_alicia_app.jpg)
- ✅ **4** — Lo mismo con una excursión y un caso en Lanzarote (se ve en: L_hoja_app.jpg)
- ✅ **5** — Build sin errores; push a main; producción



## Cosas que hay que hacer tú
1. **Aplicar la migración 0095** (tabla `documentos_de_entrada`, V65) en Supabase, con su `COMPROBAR_0095.sql`: ¿la aplicas tú? Hasta entonces, el QR de una persona no llega a las demás del grupo. Las migraciones que ya estaban sin aplicar (0065, 0067, 0068, 0073 a 0076) siguen igual.
2. **Los ~1.200 archivos viejos de `docs/dias`** siguen sin subir: ¿ejecutas tú `git restore docs`?

## V60 · Civitatis y hora recomendada
3. Excursiones de Roma: ¿qué id de Civitatis ponemos? Candidatas del sandbox: Pompeya y Sorrento 149 (o 365 si es solo Pompeya); Nápoles y Pompeya «en tren»: ninguna dice tren (365); Costa Amalfitana: no hay excursión de un día desde Roma (solo 604, de 3 días); Florencia en tren 3742; Tívoli 146.
4. Al pasar a producción de Civitatis, ¿repetimos la búsqueda (el sandbox tiene menos actividades)?
5. El día de llegada, ¿la hora recomendada parte de la hora útil del vuelo aunque sea anterior a la hora de la ruta, o de la mayor de las dos?
6. En un día normal sin hora libre, la franja ámbar «no llegas a ninguna hora libre» la escribí yo por analogía: ¿te vale? Y sin otro día con hueco, ¿solo la franja, sin caja verde?

## V61 · Reorganizar
7. Con el vuelo de 17:00, lo que no cabe el viernes (el Vaticano y otros, ~17 sitios) sale como «Se quita de tu viaje» en vez de «Al sábado 28» o «A Lugares pendientes»: ¿lo pasamos a otro día o a pendientes?
8. «Antes lo que cierra pronto» solo se aplica cuando si no llegaría cerrado: ¿quieres que el motor adelante siempre lo que cierra pronto (el Panteón a las 17:35 con el vuelo de 10:30)?
9. El Panteón con el vuelo de 17:00 sigue «por fuera» (venía así del documento de llegada tardía): ¿se queda?
10. «Has añadido la Galería Borghese el sábado…» no sale porque no existe el dato de lo que se añadió: ¿lo guardamos?
11. El barrido de 365 no se pasó tras tocar el motor del día de llegada: ¿lo pasamos en la próxima tanda de pruebas?

## V62 · La llegada en HOY
12. La tarjeta de llegada sale hasta la primera parada hecha (antes, el billete se quedaba todo el día): ¿bien?
13. Con coche propio, [He salido tarde] solo guarda la hora como recuerdo y no adapta los días: ¿quieres que cuente para el motor?
14. La hoja de [Vuelo retrasado] usa la rueda de siempre (✓ arriba, regla V55) y no el botón [Guardar] del dibujo: ¿bien?
15. El QR de HOY es la pieza pequeña de RESERVAS (no el círculo de 52 px del dibujo): ¿lo agrandamos?
16. Coche de alquiler sin reserva: la caja dice «COCHE · Alquiler»: ¿bien?

## V63 · Arreglos de HOY y DÍAS
17. «Parada saltada» más abajo en el iPhone: mi arreglo es una hipótesis (en Chrome ya salía bien): ¿me mandas una captura si sigue pasando?
18. ¿La regla de «la hoja empieza encima del aviso» vale también para las pantallas completas, o solo para las hojas de abajo?
19. ¿Cortamos el emblema de la parada saltada también en el servidor (`server/logros/cerca.js`)?
20. El resumen al eliminar un viaje: arreglo por la causa más probable, sin reproducir: ¿lo miras tú al eliminar un viaje?
21. La ficha de la parada puede seguir diciendo «A esta hora ya ha cerrado»: ¿la quitamos también?
22. Plan de lluvia: los textos de Roma están a media frase en `listas.json` y ahora les pongo «Si llueve, este es el plan: » delante: ¿prefieres frases escritas a mano?
23. Haría sale con horario aunque es un pueblo (V56): ¿separamos el pueblo de la Casa-Museo?
24. El motor de coche (Lanzarote) con cierre de mediodía no se ejercitó (ningún sitio tiene dos tramos): ¿lo damos por bueno?

## V64 · RESERVAS
25. Si el documento trae otra hora que el vuelo, «Revisa los datos» la enseña cambiada y al pulsar [Guardar] se cambia la hora y se adaptan los días (antes preguntaba «¿Actualizamos la hora?»): ¿bien?
26. Entrada y excursión siguen corrigiendo la reserva al leer (V50) antes de «Revisa los datos»: ¿lo cambiamos para que solo corrija al pulsar [Guardar]?
27. En la tarjeta del alojamiento, [+ Añade tu reserva] es crema con borde dorado, no blanco puro, y «Desde las 15:00» ocupa dos líneas en 390 px: ¿bien?
28. Los `radio_km` que añadí a las 6 zonas de Lanzarote (4, 4, 3,5, 4, 10 y 9 km) son estimaciones mías: ¿los ajustas?
29. La hoja de la zona solo pregunta con pase y con una zona ya elegida: ¿bien?
30. No se vio en pantalla el aviso con [Deshacer] tras cambiar de zona: ¿lo compruebas?

## V65 · Entradas y excursiones
31. Para las entradas con margen puse «Con margen · Hasta N min tarde» (texto mío): ¿cuál es el texto bueno?
32. El servidor ahora pide el nombre del titular de cada código solo para repartir las entradas; cada archivo gasta una de las 10 lecturas del día: ¿bien, o subimos el límite para esto?
33. Si dos personas del viaje tienen el mismo nombre, el código queda en «Falta» y no se adivina: ¿bien?
34. Si [Subir todas] saca un único código y su nombre no es de nadie, se pone a todos: ¿bien?

## Lo que no se ha podido comprobar (todo en modo rápido, sin pruebas)
35. Leer un documento de verdad (vuelo, tren, entrada, alojamiento, PDF de varias páginas), el selector de archivos del iPhone y la sincronización real con Supabase.
36. Pruebas viejas que ya no encajan: las que buscan `HoyYaNoDaTiempo` (`pruebaV43`), «Empiezas hacia las…», el billete en HOY el día de llegada, la casilla «Noches» y «o escribe los datos a mano».
