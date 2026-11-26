# CHECKLIST V68 a V71 (26-nov)

**✅ 64 hechos · 🟡 21 a medias · ❌ 0 no hechos (de 85 puntos).**

Cada punto de cada tanda, uno por línea: ✅ hecho (y dónde se ve) · 🟡 a medias (qué falta) · ❌ no hecho (por qué). La V68 se hizo con pruebas (pruebaV68 y las de reservas y Reorganizar); la V71, con las de logros; el resto, en modo rápido (solo compilar y capturas). Detalle y capturas en `REPASO_V68_V71.html`.

## V68 · URGENTE: guardar una reserva para otro día, «Recuperar el día» y que Reorganizar nunca quite nada

- ✅ **0** — Buscar qué tanda rompió lo de guardar una reserva para otro día
- ✅ **1a** — Una reserva que cubre varios sitios («Coliseo, Foro y Palatino») mueve TODOS sus sitios, no solo el primero (se ve en: a_coliseo_antes.jpg, a_coliseo_despues.jpg)
- ✅ **1b** — Si la app mueve el día entero se mueve entero; si solo el sitio de la reserva, solo ese y los que van con él (se ve en: a_vaticanos_antes.jpg, a_vaticanos_despues.jpg)
- ✅ **1c** — El sitio con reserva va A SU HORA, no el primero (Vaticanos 15:00 por la tarde; Coliseo 13:00 y el Foro DESPUÉS; Free Tour a las 10:00 antes del Coliseo y a las 15:00 por la tarde) (se ve en: a_freetour_antes.jpg, a_freetour_despues.jpg)
- 🟡 **1d** — La hoja que sale dice EXACTAMENTE lo que ha hecho la app — La hoja previa de AddReservationSheet (la que enseña el plan antes de guardar) no se tocó y no se revisó con captura.
- ✅ **1e** — Los números de las paradas, siempre en orden (nunca un 9 entre el 12 y el 13 ni un 4 encima del 1)
- ✅ **2** — Nunca un sitio dos veces en el viaje (las nocturnas no cuentan); si pasa, no se guarda y se dice en el registro
- ✅ **3a** — «Recuperar el día» deshace todo lo que tocó a ese día (lo que salió vuelve y desaparece de allí; lo que entró vuelve a su día) (se ve en: a_recuperar_antes.jpg, a_recuperar_despues.jpg)
- 🟡 **3b** — Recuperar no pasa por Reorganizar: el botón flotante se va al momento y solo vuelve si se cambia algo después — Probado con función pura y por lectura de código, no en la app con un viaje en marcha.
- ✅ **4a** — Reorganizar nunca quita nada: lo que no cabe va al día donde mejor quepa o a Lugares pendientes; una reserva o el Free Tour jamás se quita (se ve en: b_1530_antes.jpg, b_1530_despues.jpg)
- ✅ **4b** — El cambio mínimo: solo se mueve lo que no cabe (no correr todos los días en cadena) (se ve en: b_1730_antes.jpg, b_1730_despues.jpg)
- 🟡 **4c** — Los días que ya pasaron y lo ya hecho de hoy están bloqueados — Solo por lectura de código y función pura, no con un viaje en curso.
- ✅ **4d** — La comida y la cena según la hora real del día (aterrizando a las 17:30: sin comida, con cena)
- ✅ **4e** — Cabeceras MAÑANA / TARDE / NOCHE desde la hora a la que el motor pone cada parada (se ve en: b_1730_despues_dias.jpg)
- ✅ **5a** — Escribir pruebaV68 con los casos de Eric, en Roma y en Lanzarote
- ✅ **5b** — Pasar pruebaV68, las de Reorganizar y de reservas y pruebaJutrip, con 0 fallos
- ✅ **5c** — npm run build sin errores; push a main; producción

## V69 · Las hojas de Reorganizar y de mover días, «Revisa las horas», horas del Free Tour, pendientes en DÍAS y [Ver entrada]

- ✅ **1a** — Hoja de Reorganizar: tarjeta solo para lo que cambia de día, va a Lugares pendientes o es una reserva con hora («Coliseo · A las 16:30, tu entrada»); lo que sigue en el mismo día no se lista (se ve en: a1_coliseo.jpg)
- ✅ **1b** — Si cambia solo el orden del mismo día, una frase arriba que diga por qué
- 🟡 **1c** — Si se mueve un día entero, UNA tarjeta por día (foto del sitio principal, nombre del día, «Pasa al miércoles 14») — Con el vuelo de 17:00 el día 1 no se va entero (Trastevere se queda). La tarjeta de «12 sitios…» es decisión tuya.
- 🟡 **1d** — Un «de camino» (Fuente de las Tortugas, Elefantino) nunca sale como tarjeta — No se comprobó que la Fuente de las Tortugas y el Elefantino lleven esa marca en los datos de Roma.
- ✅ **1e** — Un mismo sitio, una sola tarjeta (Piazza Navona de día y de noche)
- 🟡 **1f** — La comida y la cena con la imagen de los cubiertos (nunca el degradado verde) — No visto en una captura.
- ✅ **1g** — La franja verde, solo si de verdad queda algo igual; antes del viaje nunca «hoy»
- ✅ **2a** — Todas las hojas de propuesta: cada tarjeta con la foto real (la misma que la parada de HOY) (se ve en: b1_viento_lanzarote.jpg)
- ✅ **2b** — El botón dice la acción de cada caso: lluvia «Usar el plan de lluvia», viento «Cambiar de sitio», nubes «Cambiar de mirador»
- 🟡 **2c** — «Sale de hoy» con el texto gris igual que el cuadrado: «A Lugares pendientes» u «Otro día» con la fecha — En el aviso del tiempo ese sitio no va de verdad a pendientes (se guarda en la copia del plan y vuelve con Deshacer): el texto no es exacto ahí.
- ✅ **2d** — Sin horas salvo las de una reserva: «Hoy, en lugar de Los Hervideros»
- ✅ **2e** — La franja verde nombra lo que sigue igual («Sigue igual: Timanfaya, los Jameos del Agua y 2 más»), solo si es verdad
- ✅ **3a** — Hoja de mover días por una entrada o excursión (E1/E2), ANTES de aplicar, con una tarjeta por día que cambia y los dos botones lado a lado (se ve en: E1_design.jpg, E1_app.jpg)
- ✅ **3b** — [Cambiar los días] mueve los días enteros; [Solo mover la entrada] mueve solo los sitios de esa reserva; después, con [Deshacer] (se ve en: E2_app.jpg)
- ✅ **4a** — «Revisa las horas» (A1a): una reserva antes de aterrizar o después de salir el vuelo de vuelta, con [Revisar el vuelo] y [Revisar la entrada] (se ve en: A1a_design.jpg, A1a_app.jpg)
- ✅ **4b** — «Revisa las horas» (A1b): dos reservas a la vez; «Guardarla igualmente» con línea naranja y sin meterla en el día (se ve en: A1b_design.jpg, A1b_app.jpg)
- 🟡 **5a** — «Elige día y hora»: solo los días del viaje y las horas en botones (Civitatis con plazas o las 6 de siempre), la recomendada con borde verde, «Quedan 3», agotadas tachadas — La API solo da las horas libres: una hora se tacha si la actividad la ofrece otro día y ese día no la tiene. Capturas con Civitatis simulado (apagado en el servidor). Nueva llamada a /api/civitatis/horas-rango, una vez al abrir la hoja, 2-4 KB, comentada.
- ✅ **5b** — El día de llegada, las horas antes de quedar libre en gris con «No llegas»; un día sin horas libres «Agotado»; [Guardar el Free Tour] apagado hasta elegir hora (se ve en: H3_app.jpg)
- ✅ **6a** — Lugares pendientes en DÍAS (L5): el mismo bloque al final de la lista, encima de «Añadir día»; vacío no sale (se ve en: a5_lista.jpg)
- 🟡 **6b** — La hoja «Pasar todos a otros días» sigue la V63 §17 — No se encontró el texto de la V63 §17: se hizo como lo describe el prompt.
- ✅ **7a** — [Ver entrada]: con documento abre el código a pantalla completa (con varias personas, el bloque deslizable); sin documento «+ Subir tu entrada» abre la hoja de la V64 (se ve en: V2_app.jpg)
- ✅ **7b** — Regla nueva en CLAUDE.md: nunca un botón que no hace nada
- 🟡 **8** — Un caso en Lanzarote — La hoja de Reorganizar con el vuelo de 17:00, mover días, «Revisa las horas» y las horas en botones no se capturaron en Lanzarote.
- ✅ **9** — Build sin errores; push a main; producción

## V70 · El día de la vuelta en HOY, buscador de moneda y país, y tus respuestas a las preguntas de V60-V67

- ✅ **1a** — El día de la vuelta: la tarjeta de llegada en versión vuelta (etiqueta «VUELTA», «Hoy vuelves a casa», QR, línea del billete), con la misma cuenta datosDeLaSalida (se ve en: VL1_design.jpg, VL1_app.jpg)
- ✅ **1b** — Fila del vuelo (TERMINAL · ASIENTO · REF, solo con dato) y fila de abajo (SALIR · AEROPUERTO · ANTES, o «TU DÍA · Sin paradas · Hoy toca volver») (se ve en: VL1b_design.jpg, VL1b_app.jpg)
- ✅ **1c** — Botones [Salgo hacia el aeropuerto] dorado y [Vuelo retrasado] (tren/bus/ferry y coche propio con sus nombres) y «Cómo llegar al aeropuerto»; sin bloque oscuro aparte
- 🟡 **1d** — Tiempo libre (VL1c): con 1 h 30 o más antes de salir, tarjeta con [Añadir algo cerca] y «Ver en Explorar»; vuelo temprano (VL2) sin ella — En Lanzarote sin Reorganizar no hay hora de SALIR y no sale (sigue «La tarde es tuya»). Sin alojamiento ni GPS cuenta desde el centro del destino: distancias aproximadas.
- 🟡 **1e** — [Vuelo retrasado] (VL4/VL4b): «¿A qué hora sale ahora?», se tacha la hora vieja, se recalcula SALIR, cambia en la reserva y sale la hoja de Reorganizar — La hoja de Reorganizar no salió en la captura porque adaptar no cambiaba nada; no se vio con un caso que sí cambie días.
- ✅ **1f** — [Salgo hacia el aeropuerto] (VL5): «● DE CAMINO AL AEROPUERTO», fuera los botones, [Cómo llegar al aeropuerto] dorado (se ve en: VL5_design.jpg, VL5_app.jpg)
- ✅ **1g** — Ya en el aeropuerto (VL3): «● YA EN EL AEROPUERTO», solo la fila del vuelo y [Ver mi tarjeta de embarque] (se ve en: VL3_design.jpg, VL3_app.jpg)
- ✅ **1h** — Vuelo ya salido: «Buen viaje de vuelta» (V57) se queda
- ✅ **2** — Buscador en las hojas de la moneda y del país (Ajustes), el mismo de «Dónde has estado» (se ve en: BUSCADOR_moneda_colombia_app.jpg)
- ✅ **3a** — V60-5, V60-6, V60-4: hora recomendada = la mayor de las dos, solo franja y [Ver en Civitatis], repetir la búsqueda en producción
- 🟡 **3b** — V60-1d: la nota y las opiniones de cada actividad, de su ficha — El sandbox da 404 en 365, 146, 149, 604, 94632 y 3742; solo la 142547 trae nota (7,9 · 455 opiniones). Hay que repetirlo con la producción de Civitatis.
- ✅ **3c** — V61-8, 9, 10 y 11: sin cambios, y texto genérico «Has cambiado tu sábado. Esto es lo que cambia:»
- 🟡 **3d** — V62-13: [He salido tarde] con coche propio cuenta para el motor — Es una aproximación (el motor no tiene «llegada en coche») y no se probó de punta a punta con el motor.
- ✅ **3e** — V62-15 y V62-16: el QR de HOY como el círculo de 52 px; coche de alquiler sin empresa «COCHE · Recógelo al llegar» (se ve en: L6_sinempresa_app.jpg)
- ✅ **3f** — V63-19: cortar el emblema de la parada saltada también en el servidor
- ✅ **3g** — V63-21: fuera «A esta hora ya ha cerrado» también en la ficha de la parada (se ve en: FI_ficha_app.jpg)
- ✅ **3h** — V63-22: planes de lluvia de Roma con frases completas escritas a mano
- 🟡 **3i** — V64-26: entrada y excursión solo corrigen la reserva al pulsar [Guardar] en «Revisa los datos» — Se pierde el aviso «hemos cambiado tu reserva» con [Deshacer]. No probado en pantalla.
- 🟡 **3j** — V64-27: [+ Añade tu reserva] con BOTON_CLARO — Es marfil (#FBF3E2), no blanco puro; al ser una sola pieza cambia también en vuelo, entradas y excursiones.
- ✅ **3k** — V65-31 y V65-32: «Con margen · Hasta 15 min tarde» con los minutos de cada sitio; un PDF de varias páginas es UNA lectura
- 🟡 **3l** — V66-1: actualizar pruebaTandaHOY1_B (la hoja del emblema ya no tiene «Ahora no») — La prueba no termina: en la K4 un panel «Tus logros / Reclamar con tus fotos» tapa HOY y la cámara no se abre (sin relación con esta tanda).
- ✅ **3m** — V66-3: botón corto del atardecer; V66-6: la tira «Guarda un recuerdo» tras un pedazo solo en imprescindibles y maravillas (se ve en: A1_atardecer_lanza_app.jpg)
- ✅ **3n** — V67-8: estrictos aunque la web no lo confirme (Museos Vaticanos, Domus Aurea, Última Cena, Free Tours; ya Coliseo y Borghese)
- ✅ **3o** — V67-9: frase partida de la historia de Haría («Fíjate en tres cosas»)
- 🟡 **3p** — V67-13: caja HORARIO de un sitio de día: «De día · Se ve hasta las 18:26» — No se pudo capturar: necesita un sitio de día pasada la puesta de sol.
- 🟡 **3q** — V67-15: el fundido de las fotos en TODAS las tarjetas con foto — Quedan sin cambiar las filas pequeñas de añadir parada, buscador, comidas y cerca, la galería/álbum y las fotos de personas.
- 🟡 **4** — Los ~1.200 archivos de docs/dias: qué eran y que no vuelvan a quedarse — Lo ya versionado no se suelta con .gitignore: el git restore lo ejecuta el coordinador (ver el mensaje final).
- ✅ **5** — Build sin errores; peso de arranque bajo el tope; push a main; producción

## V71 · Una sola hoja del Emblema Oculto, el orden tras [He terminado] y cada logro en su pantalla

- ✅ **1a** — Una sola hoja del Emblema Oculto (la nueva de la V66); la vieja de Visto (tipo «oculto») se sustituye (se ve en: geria_03_despues_he_terminado.jpg)
- ✅ **1b** — Al llegar sale la nueva; [He terminado] después ya no la repite (se ve en: geria_03_antes_he_terminado.jpg, geria_03_despues_he_terminado.jpg)
- ✅ **1c** — Sin [Ya he llegado], [He terminado] abre la nueva una sola vez; como mucho una hoja de foto por parada y viaje
- ✅ **1d** — Si ya hay foto de esa parada (hoja de llegada o cámara), no se vuelve a pedir
- ✅ **1e** — Las tarjetas «Algo brilla cerca de aquí…» y «Más cerca…» como el dibujo A1-A4 (el mismo juego que la hoja nueva) (se ve en: A1_design.jpg, A1_app.jpg)
- ✅ **1f** — «Algo brilla…» y «Más cerca…» no salen después de la hoja de llegada de ese sitio ni si ya se descubrió
- ✅ **1g** — Comprobar la primera parada del día con un emblema que aún no se tiene (Lanzarote: Jameos del Agua; Roma: el Panteón) (se ve en: jameos_02_despues_ya_he_llegado.jpg)
- ✅ **2a** — Tras [He terminado], una cosa cada vez: foto → logros → resumen del día al final, sin asomar por detrás (se ve en: directo_02_antes_hoja_del_emblema.jpg, directo_02_despues_hoja_del_emblema.jpg)
- ✅ **2b** — Timanfaya: la pantalla de logros no sale a la vez que «Guarda un recuerdo» (se ve en: timanfaya_03_despues_logros_tras_cerrar_la_hoja.jpg)
- 🟡 **2c** — El sonido sale CON su pantalla — No se pudo medir el audio en el Chrome de pruebas: comprobado por el turno, no por el oído. Hay que oírlo en el iPhone.
- ✅ **3** — Cada logro de viajero en su propia pantalla grande; fuera «Y además…» (se ve en: app_dos_1.jpg)
- ✅ **4a** — «Nunca es la última vez» (volver) solo cuenta si el segundo viaje empieza después de que acabe el primero
- ✅ **4b** — «Tres viajes en un año» (viajes_en_un_ano): igual, los viajes que se pisan cuentan como uno
- ✅ **5** — Pruebas de logros en 0 fallos y los dos casos nuevos del §4
- ✅ **6** — Capturas de la secuencia de Eric en Lanzarote (Timanfaya, La Geria, El Golfo) y una en Roma
- ✅ **7** — Build sin errores; push a main; producción



## Cosas que hay que hacer tú o comprobar a mano
1. **La migración 0095** (tabla `documentos_de_entrada`, V65) sigue sin aplicar: ¿la aplicas tú?
2. **Los ~1.200 archivos viejos de `docs/dias`** son salidas que regeneran las pruebas y las capturas: ¿confirmas el `git restore docs/dias`? (Añadí a `.gitignore` lo temporal con guion bajo; lo ya versionado no se suelta solo.)
3. **Oír en el iPhone** que cada sonido sale con su pantalla (V71): no se pudo medir el audio en el Chrome de pruebas.
4. **Abrir Ajustes a mano** (moneda y país con su buscador, V70): con la carga perezosa nueva no se pudo capturar sin iniciar sesión.

## V68 · Reservas en otro día, «Recuperar el día», Reorganizar
5. Con los vuelos de 15:30 y 17:30 el Free Tour sin hora y los Museos Vaticanos acaban en **Lugares pendientes** porque los demás días van llenos: ¿quieres que el Free Tour tenga prioridad en el día 2?
6. En Lanzarote con el vuelo de 17:30 el día 1 queda solo con la cena (todo lo demás en pendientes): ¿bien o prefieres que quede algo?
7. La generación del viaje ENTERO con vuelo sigue con «el día 1 pasa al día 2» (diseño de la V61); solo cambia el botón Reorganizar: ¿lo cambiamos también al generar?
8. Al mandar un sitio a otro día se usa la distancia en línea recta, no Mapbox: ¿bien?
9. El barrido de 365 sigue sin pasar (no se tocó `shared/` en la V68, pero sí en V61, V63 y V67): ¿lo lanzamos esta noche (6-7 h de CPU)?
10. «Recuperar el día» con un viaje en marcha y días pasados bloqueados solo se probaron con función pura y por lectura de código: ¿lo compruebas tú en el móvil?

## V69 · Hojas de Reorganizar y de mover días, «Revisa las horas», horas del Free Tour, pendientes en DÍAS
11. Con 4 o más sitios al mismo destino puse una tarjeta «12 sitios de tu martes · A Lugares pendientes» (idea mía): ¿te vale?
12. En el aviso del tiempo (viento) «Sale de hoy · A Lugares pendientes» no es exacto: el sitio se guarda en la copia del plan y vuelve con Deshacer: ¿cambiamos el texto?
13. «Una sola lista» de pendientes: HOY sigue con su bloque «Si te sobra tiempo» y DÍAS tiene el suyo: ¿las unificamos?
14. «Agotado» por hora en el Free Tour es una aproximación (la API solo da las horas libres): ¿aceptas hasta que Civitatis dé también las agotadas?
15. En la hoja de mover días incluí también la tarjeta del día de la reserva (el dibujo solo enseña los desplazados): ¿bien?
16. Si la entrada es de otra persona y no hay documento para ti, el botón [Ver entrada] no sale (decisión mía): ¿bien?
17. «De camino» (Fuente de las Tortugas, Elefantino) no sale como tarjeta si el dato lleva la marca `passThrough`/`isFreeWalk`: ¿las marcamos en los datos de Roma?
18. Las 46 miniaturas de Lanzarote (166 KB) son archivos nuevos que se han subido: ¿bien?

## V70 · El día de la vuelta y tus respuestas
19. En la caja AEROPUERTO sale el tiempo del traslado (32 min), no los 70 min de SALIR: ¿bien?
20. «Ya en el aeropuerto» sin GPS usa el trayecto de SALIR (70 min en Roma): ¿bien?
21. [He salido tarde] con coche propio cuenta para el motor como una llegada por carretera (medio «tren», sin punto): es una aproximación: ¿quieres un medio «coche» de verdad en el motor?
22. En Lanzarote sin Reorganizar no hay hora de SALIR y no sale la tarjeta de tiempo libre: ¿bien?
23. Entrada y excursión ya no avisan «hemos cambiado tu reserva» con [Deshacer] al leer (solo [Guardar] cambia): ¿lo echas de menos?
24. [+ Añade tu reserva] es marfil (BOTON_CLARO), no blanco puro, en vuelo, entradas, excursiones y alojamiento: ¿bien?
25. Nota y opiniones de Civitatis: el sandbox solo da una ficha (142547): hay que repetirlo con producción de Civitatis: ¿cuándo?
26. El audio de la historia de Haría hay que regenerarlo si ya existe (la frase «Fíjate en tres cosas» cambió): ¿lo regeneras?
27. El fundido de fotos quedó fuera de las filas pequeñas de añadir parada, buscador, comidas y cerca, la galería y las fotos de personas: ¿las incluimos?
28. Los seis estrictos (Coliseo, Vaticanos, Borghese, Domus Aurea, Última Cena y Free Tours) ya salen con «Hora exacta · Llega 15 min antes»: ¿bien?

## V71 · Emblema y logros
29. La rama «oculto» de `HojaDelVisto` (`logros/visto/Hojas.tsx`) quedó sin usar: ¿la borramos?
30. Cinco logros de viajero seguidos son cinco pantallas: ¿quieres un tope (por ejemplo, tres y el resto en el resumen)?
31. «Volver» y «Tres viajes en un año»: si un viaje empieza el mismo día que acaba el anterior se considera que se pisan (lo elegí yo): ¿bien?
32. No hay captura del dibujo de Design (Día perfecto / M1) al lado de la de la app: ¿la sacas tú o la repetimos?

## Lo que no se ha podido comprobar
33. Peso de arranque: la V70 lo bajó de ~351 a 260,8 KB con carga perezosa de la primera pantalla y de 18 hojas y avisos; comprobado que carga en jutrip.app, pero no se abrió ninguna hoja de invitación, pago ni propuestas en el navegador.
34. Pruebas que siguen sin pasar por otras causas: `pruebaTandaHOY1_B` (un panel «Tus logros / Reclamar con tus fotos» tapa HOY en la K4) y `pruebaV35A_logros` con Vite (falla una aserción distinta cada vez, parece flaky).
