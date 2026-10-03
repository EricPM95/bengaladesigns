# Informe: la hoja de reglas claras de las rutas

*(4-oct-2026. Solo opinión y comparación: no se ha cambiado ningún dato ni código. Lo único que se ha ejecutado son lecturas y las pruebas de siempre, para medir.)*

**Qué he leído:** `docs/archivo/REGLAS_RUTAS_BORRADOR.md` (30 reglas) y `docs/INVARIANTES_MOTOR.md` entero (2.709 líneas, **472 reglas numeradas**), más lo que hace hoy el motor (`shared/routeEngine/writtenTrip.js`, `curatedTrip.js`, `nightWalk.js`), los datos de Roma (`roma.json`, `_fotos.json`, los días escritos) y la prueba (`prueba365.mjs` y `auditoria.mjs`).

## Lo más importante, en seis líneas

1. **Tienes razón: las reglas se pisan.** Encuentro **25 choques** entre INVARIANTES y el borrador (tabla 1). Siete son graves, porque el motor puede seguir cualquiera de las dos versiones: la 416 contra la 462 (noche), el orden Puente-Castillo, la luz de invierno, el orden de rellenar huecos, la comida, el Free Tour y quién gana entre el pool y los imprescindibles.
2. **El error del Castillo tiene tres causas, y ninguna es «una regla mala»:** (a) la nocturna «El Puente y el Castillo» solo apunta que enseña el Puente (`conflicts_with: ["Puente Sant'Angelo"]`), así que el motor no sabe que el Castillo ya salió; (b) la 416 sigue viva y permite repetir; (c) **la prueba no podía verlo** (ver el punto siguiente). No he conseguido reproducirlo con 768 días de muestra, así que es un diagnóstico por lectura del dato y del código, no un fallo visto salir.
3. **He encontrado cuatro comprobaciones rotas** (expresiones con las barras `\` perdidas al escribirlas). La más grave: `nocturna_repite` (`auditoria.mjs:387`) **nunca salta con un nombre «(noche)»**. Es justo el aviso que habría cazado el Castillo. Detalle en 4.5.
4. **Más de la mitad de INVARIANTES ya no se usa en Roma** (ritmos, bloques, días curados v3, redondeos…). Sigue mezclado con lo vivo, y por eso es difícil saber qué manda. Lista en la parte 2.
5. **El borrador está bien enfocado**, pero tiene 9 cosas que yo cambiaría o aclararía (4.8) y le faltan unas 25 cosas que el motor ya hace (parte 3).
6. **La propuesta para dejarlo ordenado** (4.6) es: un `REGLAS_RUTAS.md` corto, con cada regla numerada y con su comprobación al lado; y que la prueba imprima una línea por regla. Así, cuando algo no esté comprobado, se vea.

---

## 1. Tabla de choques

Primero la columna que más importa: **qué hacer**. «Borrador» = la regla del borrador que choca. «Gana» = mi propuesta de cuál debe quedar.

| # | INVARIANTES | Qué dice | Borrador | Qué hacer |
|---|---|---|---|---|
| 1 | **416** (1-oct) | Una nocturna puede volver a un sitio visto *esa tarde* (el Puente Sant'Angelo al atardecer y otra vez de noche). | **20** | **Borrar la 416** (sigue viva en el texto). Gana la 462 y el borrador: solo si la visita fue por la mañana. |
| 2 | **462** (3-oct) | Nocturna el mismo día solo si la visita de día fue antes de las 13:00. | **20** | Se queda. Pero está escrita sobre `conflicts_with`, y ese dato es incompleto (ver 4.1). |
| 3 | **96**, **170**, **192**, **204**, **300**, **83**, **190** | Seis versiones más de «día y noche el mismo día»: «si se ve de día, su nocturna no sale ninguna noche» (96, nivel 2-3); «en 3+ días nunca el mismo día» (170, 192, 204); «la nocturna no repite lo que salió ese día» (300); «una nocturna suelta a ≤10 min se ve al atardecer y su versión de noche ya no sale» (83); «como mucho 2 veces por viaje» (190). | **19, 20** | **Borrar las siete.** Las sustituyen la 462 y la 467. |
| 4 | **273**, **274**, **464** | Primero la plaza o el puente y luego el monumento. D2: Conciliazione → **Puente → Castillo**. | **12** | Se quedan, pero **chocan con la 416 y con la 364**: ver fila siguiente. |
| 5 | **416** (2.º punto) | El día del Vaticano: Conciliazione, **el Castillo por fuera y el Puente al atardecer** (Castillo antes que Puente). | **12** | **Decidir el orden de verdad.** La 273 pide Puente→Castillo y la 416 pide Castillo→Puente. Además, desde San Pedro se llega al Castillo antes que al Puente, y la 364 prohíbe pasar por delante de un sitio para volver a él. Propuesta: la regla 12 dice «el acceso va antes **si se llega por su lado**; si no, manda no volver sobre los pasos». Y el dato `approach_to` lleva desde qué lado. |
| 6 | **105**, **186**, **240**, **245**, **246**, **290**, **311**, **315**, **328** | El sol decide qué es noche; un mirador que llega después del sol pasa a «Roma iluminada desde…» (experiencia nocturna); las nocturnas van antes de cenar; la cena se adelanta. | **17** (invierno) | El borrador dice lo contrario: *«que sea de noche no convierte una parada en nocturna ni adelanta la cena»*. **Hay que decidir.** Hoy v4 hace las dos cosas: elige la versión de la tarde por el sol (así casi nunca llega de noche) y aun así conserva lo de «iluminada» (yo mismo añadí `night_view_overrides` el 3-oct para el Puente). Si el borrador es lo que quieres, se borran 6 reglas y se quita ese camino del motor. |
| 7 | **419** (1-oct) | El tiempo que sobra a mitad de día va **en este orden**: 1.º un sitio de camino como parada, 2.º el paseo de la zona, 3.º recolocar (la parada de antes se alarga). | **16** | **El borrador tiene el orden al revés** (estirar → paseo → sitio cercano). Decidir cuál; la 419 es la que hace hoy el motor. |
| 8 | **44, 102, 122, 129, 139, 156, 183, 194, 222, 240, 246, 263, 311, 317, 321, 328, 351, 352, 370, 373, 375, 384** | La familia del «Tiempo libre», la «Tarde libre» y el «Aperitivo» (con sus umbrales de 20, 30, 45, 60, 90 y 120 min). | **15, 16** | La 419 ya dijo «no existe el Tiempo libre». **Borrar toda la familia** salvo lo que la 419 deja (descanso de después de comer, el paseo antes del mirador). |
| 9 | **36, 63, 64, 135, 157, 171, 177, 179, 235** | La comida es una franja fija (13:00-14:00, o 13:00-14:30), nunca menos de 60 min, o se alarga la mañana hasta las 14:00. | **14** | **Borrar.** Las sustituyen la 460, 469 y 475 (flexible, con la entrada reservada). |
| 10 | **392**, **408** | La comida dura **45 min como mínimo, siempre**. | **1, 14** | Chocan con la 460 y la 469 (con una hora fija detrás, hasta **30 min**), y con el borrador. Dejar solo «45 sin hora fija detrás; 30 con ella». |
| 11 | **365** | La comida dura **90 min como mucho** en completo. | **14** | **Al borrador le falta este máximo.** Añadirlo. |
| 12 | **38, 238, 349, 363, 374, 375** (+ la sección F) | Cinco redondeos distintos: :00/:30, cuarto de hora, 5 en 5, «la pantalla redondea ≤4 min hacia arriba». | **18** | **Borrar todas.** Manda la 454 (10 en 10; 5 en 5 las fijas y las pegadas), igual que el borrador. |
| 13 | **413** (punto sobre el Free Tour) y la prueba `tour_repite` | «El día del Free Tour, nada suelto de lo que el tour recorre (**Trevi a las 8:30**)». La prueba cuenta como fallo cualquier sitio del recorrido que sale suelto. | **22** | El borrador, la 40, la 86 y la 465 dicen lo contrario: **Trevi a las 8:00 antes del tour está bien**. Corregir la 413 y el comprobador `tour_repite` (que hoy da 2 en las 1.032 pruebas). |
| 14 | **195** | El Free Tour va **siempre el día 1 por la mañana**. | **22** | La 465 y la 473 lo dejan ir de mañana, de tarde o de noche, según su hora. Borrar la 195. |
| 15 | **31**, **345**, **11** | Una joya puede desplazar a un imprescindible; **un extra del pool nunca le quita a un imprescindible de pago su visita por dentro**. | **3, 4, 9** | El borrador pone «el viajero manda» (3) por encima de «los imprescindibles» (4): el pool ganaría. La 345 dice lo contrario. **Hay que elegir** y escribir el empate (mi propuesta en 4.2). |
| 16 | **285** | «El pool manda»: si se queda fuera, el día madruga y **acorta la comida**. | **9, 14** | Choca con 14 (comida ≥45) si se aplica a rajatabla, y con 9 («lo que no cabe se le dice»). Decir qué pasa primero: avisar, o madrugar. |
| 17 | **427** | Hora fija = toda `hora` escrita en los días (turno, entrada, Free Tour, recogida). **A la entrada se llega 10 min antes.** | **1, 26** | La 469 y el borrador dicen **30 min antes**. Borrar el «10 min» de la 427. |
| 18 | **406** y **427** | Una `hora` escrita **sin turno es orientativa** (llegar 10 min después no es llegar tarde). | **1** | El borrador mete «un horario escrito con hora» entre las horas fijas (y «una misa»). **Aclarar:** o solo es fija la que tiene reserva o turno, o hay dos clases («fija» y «orientativa»). |
| 19 | **358**, **451** | Los vuelos y trenes **no entran en el motor**: se ajustan en el cliente al tocar «Ajustar este día». La 451 (medio día) está pendiente. | **1, 8, 27, 28** | El borrador trata el vuelo como hora fija y el medio día como regla ya hecha. **Hoy no lo son.** Marcar esas reglas como «pendientes del encargo de vuelos». |
| 20 | **466** | Si no cabe, además de recortar, **se quita lo menor** (nivel 3, 2 y 1) y sale en la campana. | **1** | El borrador solo dice «aviso». Decir también qué se quita (la 466 es lo que hace el motor). |
| 21 | **467** | Un sitio, una vez al día, pero **con una salvedad**: el parque de Villa Borghese en D4, que sale «con dos nombres escritos» (de camino a la Galería y el lago). | **19, 29** | La salvedad **contradice la regla 29** (una sola identidad). O se quita (el parque de camino y el lago son un solo sitio con una elástica) o se declaran dos sitios distintos con dos `id`. El comentario de `auditoria.mjs:125` hace lo mismo con `display_title`. |
| 22 | **338** y **428** | Dos umbrales de excursión que parecen uno: Roma **5** («las excursiones se ofrecen desde 5 días de contenido», `destination_config.excursion_desde_dias`) y Roma **4** («el botón sale desde 4», `excursions.excursiones_desde_dias`). | **8** | El borrador dice «el día que marca el destino». Nombrar **los dos datos**: uno es cuándo se ofrece, otro cuándo se convierte un día. |
| 23 | **100** y **413** | 100: «la nocturna sale desde la cena o no sale» (≤15 min andando). 413: «un paseo nocturno todas las noches, **aunque haya que cruzar la ciudad**». | **25** | Se contradicen. El borrador sigue la 413. Borrar el «o no sale» de la 100. |
| 24 | **34** y **123** | Una visita grande son **180 min** (34) o **más de 90** (123). | **7** | El borrador dice 90. Borrar la 34. Y aclarar cómo cuenta un grupo (Coliseo+Foro+Palatino suma más de 180). |
| 25 | **14**, **17b** y los datos `groups` | Un grupo es **una visita inseparable** (`roma_antigua_core` = Coliseo + Foro + Arco; el Altar es de `altar_patria_group` con la Plaza Venecia; el Puente+Castillo es otro grupo). | **7** | El borrador usa «grupo» como «el día»: pone el **Altar** en el grupo del Coliseo y mete **Conciliazione, el Puente y el Castillo** en el de los Vaticanos. **Son dos palabras para dos cosas:** llamar *grupo* a lo inseparable y *día* a «lo que se recorre andando». |
| 26 | **13/ 21 / 413** y **447** | «Un barrio, una vez al día» (413, 419). Solo el paseo del Tridente tiene `una_vez_por_viaje` (447). | **21** | El borrador pide **cada paseo una vez por viaje**: es regla nueva y puede quedarse sin paseos en 7 días (ver 4.3). |

**Otros choques menores** (los resuelve borrar):

- **17 (verano)**: el borrador dice «verano» sin meses; la 413 dice **julio y agosto**; la 399 y la 402 dicen **junio a agosto**; el código (`SUMMER_MONTHS`) dice **7 y 8**.
- **13 (20 minutos)**: el borrador dice «unos 20 min»; las 164, 172, 241, 346 y 393 usan **25**; la 335 usa **12** (un traslado escrito no se usa si andando son 12 o menos).
- **5 (nada inventado)**: la 260, la 261 y la 395 permiten un dato «**probable**» con texto prudente; el borrador dice «si no se sabe, no se dice».
- **11 (madrugar está bien)**: la 193 solo deja madrugar si por ello se *visita* un imprescindible; la 157 y la 177 piden aviso cuando se acorta o se madruga.
- **2**: el borrador omite lo que dice la 92 (sin fechas, aviso en la parada de los días que a esa hora está cerrado).
- **223 y 327** dicen que el motor por defecto es v3. **Falso hoy:** `WRITTEN_DAYS_DEFAULT = true` y `.env.local` tiene `ROUTE_ENGINE=v4`.

---

## 2. Lo que sobra de INVARIANTES

Dos clases: **muertas** (el motor que las usaba ya no corre en Roma) y **sustituidas** (otra posterior las cambia y nadie las ha borrado).

### 2.1 Muertas: motores que ya no existen o no corren por defecto

| Familia | Reglas | Por qué sobran |
|---|---|---|
| **Los ritmos** (completo / tranquilo) | 25, 35, 40, 56, 63, 190 (parte), 200, 202, 206, 209, 285, 290, 310, 325, 365, 370, 374, 375, 392 y las demás que dicen «tranquilo» (50 líneas lo nombran) | La 403 quitó los ritmos. La propia 403 admite que «en las antiguas vale solo la parte de completo»: eso se limpia **borrándolas**, no dejándolas. |
| **Redondeos antiguos** | 38, 238, 349, 363, 374, 375 y la sección F entera (la de «lo que SÍ se tira») | Los sustituye la 454. |
| **Motor v3: reparto y programador** | 7, 8, 9, 10, 12, 29 (zigzag probando órdenes), 30 a 35, 41 a 46, 48 a 50, 53 a 56, 59 a 62, 64 a 66, 73 a 78, 83 a 87, 89, 93, 94, 96 a 98, 100 a 102, 107 a 117, 119 a 125, 127 a 130 | Describen `planTrip.js` y el programador de rellenos. Para Roma los días están escritos (v4). |
| **El repartidor antiguo, `zone_walks` y `evening_blocks`** | 88, 148, 174, la sección F | La 88 dice «solo el motor viejo». La 148 lo llama *legacy*. |
| **Bloques de mañana y tarde** (`morning_flows`, `afternoon_flows`, `blockTrip.js`) | 131 a 188 (menos 173, 176 y 182, que pasan al borrador como «lo mejor primero»), 189 a 199 | Sustituidos por los días curados v3 y luego por los escritos. Son 90 reglas. |
| **Días curados v3** (`curatedTrip.js`, `curated_days`) | 200 a 222, 231 a 233, 235 a 247, 253 a 259, 263, 271 a 274, 277, 290 a 304, 308 a 322 | Sustituidos por los días escritos (323 y siguientes). Son las reglas de los «repasos de las 20 rutas». |
| **Contrato de aceptación y semáforo `medirDias`** | la sección G (la de «9 fallos conocidos») y el punto 4 del kit (sección I) | La prueba de las 365 fechas lo sustituyó. |
| **Claude eligiendo o completando** | 1 (la nota «motores anteriores»), 12 (`interestTags`), 20 (parte), y las menciones a `route_cache` de destinos curados (70 a 72: se pueden dejar en «técnico») | Los destinos curados ya no usan Claude para elegir. |

### 2.2 Sustituidas por otra posterior

| Regla vieja | La sustituye |
|---|---|
| 25 (ventana de cena por modo) | 36 → 341 y 352 |
| 36, 63, 64, 135, 157, 171, 177, 179, 235 (comida) | 460, 469, 475 |
| 38, 238, 349, 363, 374, 375 (horas) | 454 |
| 79, 102, 122, 129, 139, 194 (tarde libre, tiempo libre) | 419 |
| 96, 170, 192, 204, 300, 83 (día y noche) | 416 → 462 → 467 |
| 221 (D4 sin Galería) | 231 |
| 248 (esconder fechas `verificar`) | 260 |
| 255 (sin «gratis») | 262 |
| 366 a 368, 118, 138, 169, 175, 184, 234, 353 | ya borradas por la 403 (huecos de numeración) |
| 378 (varita flotante) | 386 → 425 → 442 |
| 411 (foto de día siempre) | 420, 438 |
| 394 (variante por cierre) | 399 |
| 223, 327 (v3 por defecto) | `WRITTEN_DAYS_DEFAULT` |

### 2.3 De pantalla que ya no cuadran con la app de hoy

Estas no son del motor, pero **también se han quedado viejas**:

- **386** describe la barra flotante de cinco iconos (maleta, presupuesto, perfil, mapa, reservas) y la cabecera con la varita. La barra de hoy es fija y de tres iconos, y la cabecera lleva %, bombilla, «+» y campana.
- **428** dice que el botón del autobús va «encima de la barra oscura de Días».
- **430** dice que el aviso de «más días que el viaje» sale bajo «+ Añadir día»; ahora va en la campana.
- **412** y **417** hablan de medidas de la pantalla de antes del último rediseño.

### 2.4 Mal numeradas

Las secciones están en el orden **A, B, C, D, E, H, J, I, F, G**; hay números repetidos como 17/17b y huecos (47 después de la 50, 118, 138…). Esto es una de las razones por las que cuesta fiarse del documento.

---

## 3. Lo que falta en el borrador

Todo esto **lo hace hoy el motor** y el borrador no lo dice (o lo deja solo para «Lo propio de Roma»):

1. **Relaciones entre lugares**: `contained_in` (lo de dentro solo sale con su contenedor, 16, 76, 77), `neighbor_of` (van el mismo día y seguidos, 16), `approach_to` (el acceso va justo antes, 17b, 273), `related_to` (17), `leads_to` / «la bajada natural» (101), `group_order`. El borrador solo recoge «primero el acceso» y los pares.
2. **La versión de la tarde por la luz**: cuatro tardes (A, B, C, D) según la hora del sol, la parada elástica (±30 min), el 75 % mínimo de lo escrito, la llegada al mirador entre 15 y 35 min antes del sol, la versión vecina en la frontera (323, 327, 334, 336, 337, 343, 348, 394). Es la columna vertebral de los días de hoy y no está.
3. **La cena**: nunca antes de las 19:30 (20:30 en verano), el aperitivo máximo de 90 min y la cena que se adelanta (341, 352), el restaurante a ≤15 min andando de lo último (342, 372), **nunca el mismo restaurante dos veces** (316), el restaurante cerrado ese día (307), «Cambiar» (307).
4. **Variantes por cierre, día de la semana y fecha**: cuál se aplica antes (cierre → fecha → dos días, 347 y 408), `si_cerrado` (por fuera, quitar, cambiar), el miércoles de audiencia, los domingos, el último domingo de los Vaticanos, Pascua (`easter±N`, 104), el 29 de junio como domingo (455), el 14 de agosto (399), el 25/12 y el 1/1 (216, 333).
5. **Excursiones**: día completo y medio día, nunca el día de llegada, el de vuelta ni el último (121, 362), convertir un día (429), la excursión reservada fija el día (436), los días sin excursión (`excursion_fechas_no`, 413).
6. **Navidad y fechas especiales**: capas (397), líneas de la ficha (398), mercadillos con fechas aproximadas (106, 110), transporte recortado (396), el día que empieza más tarde (404), fechas clave de viajeros españoles (406), tarjeta de temporada (415), avisos «un aviso, un tema» de 35 palabras (249, 376, 405).
7. **Free Tour en festivos**: días sin tour y horas especiales (402, 407), dónde acaba (257), qué cubre (80), el tour «añadido después» de mañana, tarde o noche (465, 473).
8. **El pool en detalle**: lista cerrada y sitio escrito (324, 332), hasta 2/3/4/5 extras según los días, «nunca de paso» (191), «nunca a un sitio en un día que cierra» (357), «no incluido» con su motivo (237).
9. **Mínimos y máximos de duración**: un imprescindible dura 20 min como mínimo (286), un paseo 90 como máximo (329), «Por el camino» 10 (256), los minutos de «por fuera» no se recortan (284), la elástica no baja del 75 % (348).
10. **Transporte**: más de 25 min andando va en bus o taxi (346, 393), un traslado escrito no se usa si andando son 12 o menos (335), festivos (396).
11. **Horarios**: tramos partidos (51), última entrada por día (470), horario por época (`by_period`, 104), `special_hours` (251), sin fechas = laborables más aviso (92, 276), fecha de comprobación (280, 395).
12. **«Por fuera»**: qué es (`minutos_fuera`), «Quiero entrar» (275, 282, 476), lo que no se ve desde la calle no existe por fuera (452), junto a un imprescindible aunque esté cerrado se ve por fuera (421), el Castillo siempre por fuera (445, 472).
13. **El día del Vaticano**: el Castillo y el Puente de día (416, 464), la Basílica por fuera solo si cierra (472), los Museos cierran los domingos salvo el último del mes (472).
14. **Lo que toca el viajero**: el motor no rellena ni recoloca nada de lo que hace el viajero (292, 305, 306, 419 último punto), «Volver a la ruta original» (292, 442), lo reservado se queda fijo (436).
15. **Entradas reservadas**: órdenes nuevos por franja del día (458), la comida con reserva (460), la Basílica o lo escrito que choca con la reserva pasa a después (475), «Llegarás N min más tarde» (469).
16. **Llegada y vuelta**: la hora en el centro = llegada + traslado del punto, hora de salir por medio, «Llegas después» / «Ya te has ido», Reservas manda (358, 418).
17. **Fotos**: paradas con foto de día, sin repetir foto el mismo día, sin foto antes que una mala, **los restaurantes nunca llevan foto** (420, 438, y la decisión de hoy). El borrador dice que «las fotos siguen donde están», pero `foto_repetida` es una comprobación de la ruta.
18. **Todo lo que lee el viajero va curado en el JSON** (264): nunca de una llamada a la API.
19. **Destino nuevo**: qué necesita (kit, `validar.mjs`, fechas clave, método). El borrador dice «Lo propio de cada destino va en su apartado» pero no dice cuáles son los mínimos.
20. **Motor puro**: sin red, sin reloj; un día por llamada y todo recalculable desde cero (20, 47). Es técnico: va a otro fichero, pero hay que decirlo en algún sitio.

---

## 4. Mi opinión

### 4.1 Qué regla falta para que no vuelva un error como el del Castillo

La causa está en **tres capas** y hay que cerrarlas las tres:

1. **El dato.** `night_experiences["El Puente y el Castillo de Sant'Angelo (noche)"].conflicts_with` es `["Puente Sant'Angelo"]`. El Castillo no está. Pasa lo mismo con `"Trastevere de noche"`, que apunta a `["Plaza Trilussa"]` y no a Trastevere. El motor compara con esa lista (`writtenTrip.js:1920`, `visitedThisAfternoon`): si el Castillo salió a las 19:50 pero la lista no lo nombra, la nocturna sigue pareciendo nueva.
2. **La regla.** La 416 sigue viva y dice lo contrario que la 462.
3. **La prueba.** `nocturna_repite` está rota (ver 4.5), y `repetido_dia` / `repetido_viaje` **excluyen por diseño** las nocturnas, los paseos y «De camino».

**Reglas que añadiría** (las dos primeras son lo que de verdad evita el Castillo):

- **R-A. «Cada cosa dice qué sitios enseña.»** Toda parada, nocturna, paseo, «De camino» y el Free Tour llevan un campo `muestra: [id de sitio, …]`. «El Puente y el Castillo (noche)» enseña dos: `puente_santangelo` y `castillo_santangelo`. «Pasea y piérdete por Trastevere» enseña Trastevere (y lo que su texto nombre). El Free Tour ya lo tiene: son sus `covers`.
- **R-B. «Se compara por sitios, no por nombres.»** Dos cosas del mismo día no pueden mostrar el mismo sitio (salvo la excepción de la 462: visita de mañana y nocturna). Lo comprueban el motor (para decidir) y la prueba (para avisar), con la misma función.
- **R-C. «Antes de dar un destino por bueno, los datos se cruzan solos.»** `validar.mjs` comprueba que cada `muestra` existe, que ninguna nocturna deja de nombrar un sitio que su paseo enseña, y que no hay dos listas con el mismo nombre (parada / nocturna / paseo). Hoy no lo hace.
- **R-D. «Cuando se junta o se renombra algo, se buscan sus referencias.»** Al fusionar el Puente y el Castillo hubo que tocar a la vez `roma.json`, la matriz de viajes, las fechas especiales y las fotos: cuatro sitios. Eso debería ser una lista de comprobación (o mejor, ids que no cambian).

### 4.2 El orden de importancia

El orden del borrador es razonable, pero lo cambiaría así:

1. **Antes de la regla 1, una sección «Definiciones»**: qué es una *parada*, una *hora fija*, una *identidad de sitio*, un *grupo* (lo inseparable), un *día*, una *visita grande*, una *nocturna*, un *paseo*, un *de camino*. Hoy el borrador usa «grupo» de dos formas, y «hora fija» de dos formas. Las reglas se pelean porque las palabras no están fijadas.
2. **Nunca un sitio cerrado** pasa al primer puesto. Una reserva solo se hace en horas de apertura, así que no choca con la hora fija; pero si algún día chocan (misa, cierre, festivo), no queremos entrar a un sitio cerrado «porque era hora fija».
3. **Hora fija**, y que el borrador diga qué se quita además del aviso (como la 466).
4. **El viajero manda**, con el empate escrito: *«lo que el viajero reserva y lo que marca en el pool entra siempre; un extra del pool no quita a un imprescindible de pago su visita por dentro (345); si no caben los dos, se avisa»*.
5. **Los imprescindibles**.
6. **Una identidad por sitio y no repetir** (hoy las reglas 19-21 y 29): súbelas justo detrás. Es el error que más se ve y el más barato de comprobar.
7. **La comida y la cena** (14-15) **antes** de «cómo se ordena un día» (11-13): son las anclas del día; lo demás se coloca alrededor.
8. Después, huecos, época, horas.
9. **«Nada inventado» (5) sale del orden**: es una regla de *datos*, no de rutas. La prueba de rutas no puede comprobarla; va a las reglas de datos.
10. Etiquetar cada regla como **OBLIGATORIA** (la prueba falla: 1, 2, 3, 4, 14, 19, 20…) o **PREFERENCIA** (la prueba solo avisa en amarillo: 6, 11, 13, 25…). Hoy el borrador las trata a todas igual.

### 4.3 Lo que me parece difícil de cumplir o de comprobar

| Regla | Por qué cuesta |
|---|---|
| **1 (vuelos, trenes, barcos)** | El motor no recibe los vuelos (358, 451). Hasta el encargo de vuelos, no se puede cumplir. |
| **1 («una misa o un horario escrito con hora»)** | Una misa no es un compromiso del viajero, es una ventana de cierre. Y la 406 dice que una hora escrita sin turno es orientativa. Habría que decidir si hay dos clases. |
| **7 (una sola visita grande)** | Necesita un dato «cuánto dura el grupo entero». Coliseo+Foro+Palatino pasa de 180 min; Vaticanos+Basílica+Cúpula, igual. Con «más de 90» salen dos grandes a menudo. |
| **8 (medio día)** | No existe en el motor (451). Es una regla de futuro, no de hoy. |
| **17 (verano, 14:00-16:30)** | Hay que fijar los meses (julio-agosto o junio-agosto). La prueba hoy salta el descanso de junio a agosto. |
| **18 (10 en 10)** | Comprobable, pero hay que definir «pegadas» (<200 m) y «fijas». Sin ese listado, la prueba daría falsos fallos. |
| **21 (cada paseo, una vez por viaje)** | Con 7 días y 4-5 barrios de cena, se queda sin paseos distintos. Hoy solo el Tridente es una vez por viaje (447). Propongo «una vez por viaje **si hay otro**; si no, otro día pero no el mismo». |
| **25 (una nocturna cada noche)** | Con 7 noches y 10 nocturnas que además se reparten en 13 paseos (algunas se repiten dentro de varios paseos: Trevi aparece en tres), es posible agotarlas. Mide cuántas hay por destino. |
| **29 y 30 (la prueba)** | La 30 («Claude revisa 20 viajes») es un proceso humano. Habría que convertirlo en una **lista fija de 20 viajes** guardada en un fichero, para que cualquiera la repita (hoy existen `revision20.mjs`, pero la lista no está atada a la regla). |

### 4.4 La prueba, regla a regla

**Cómo es la prueba de hoy:** `prueba365.mjs` recorre 365 fechas de inicio × 2-7 días × con y sin Free Tour × experiencias × cada lugar del pool solo y en parejas, y pasa lo de `auditoria.mjs`. En modo rápido son **1.032 viajes**, y el 3-oct da **100 problemas** (26 huecos, 23 repetidos en el viaje, 18 «no cuadra», 9 fuera de horario…). *No* cubre: viajes sin fechas, **viajes de 1 día**, reservas, vuelos, ni nada de pantalla.

| Regla | ¿Ya la comprueba? | Cómo la comprobaría |
|---|---|---|
| 1 Hora fija | **Parcial**: `v4_llega_tarde` | Falta: que la hora fija *siga ahí* (que no se haya quitado sin aviso), que se cumpla el orden de recorte (opcionales → elástica → comida) leyendo las `variantes` del día (`comida:sin…`), y que el aviso exista. |
| 2 Nunca cerrado | **Sí**: `fuera_de_horario`, `v4_fuera_de_horario`, `cerrada_a_su_hora`, `v4_cerrado_sin_solucion` (incluye la última entrada) | Añadir el modo **sin fechas** (hoy no se prueba) y festivos con fuente. |
| 3 El viajero manda | **No** en la prueba grande (existen `medirEntradas.mjs` y `medirReservas.mjs`, aparte) | Meter reservas en la prueba: una entrada a cada franja y comprobar que «el atardecer y la nocturna se quitan sin aviso». |
| 4 Imprescindibles | **Parcial**: `pago_sin_dentro`, `pool_fuera`, `basilica_fuera` | Falta «todo nivel 1 está visto, por fuera o con aviso» en cada viaje. |
| 5 Nada inventado | **No** (es de datos) | `validar.mjs` (precios, `comprobado`). Sacarla de la prueba de rutas. |
| 6 Lo mejor primero | **No** en v4 (existía el semáforo `primero` en el v3) | Primera aparición de cada joya ≤ día 3 (o 2 en viajes de 2). |
| 7 Un sentido, una visita grande | **No** | Suma de minutos «dentro» por día y que ningún grupo esté partido entre días. |
| 8 Según los días | **Parcial**: 2-7 días en la prueba; 1 día en scripts aparte | Meter el viaje de 1 día; el medio día cuando exista. |
| 9 El pool | **Sí**: `pool_fuera` | Falta el *orden* y el aviso cuando no cabe. |
| 10 Experiencia añade algo | **No** | Comparar el mismo viaje con y sin la experiencia: tiene que cambiar algo. |
| 11 Primera hora | **No** | Sitios marcados «se llenan» ≤ 09:30. |
| 12 Acceso y monumento | **Sí**: `plaza_despues` | Hay que añadir el lado de llegada (4.2) para no dar falsos positivos con el Puente. |
| 13 Sin ir y volver | **Sí**: `zigzag`, `tramo_largo` (usa 25 min, no 20) | Alinear el número. |
| 14 La comida | **Parcial**: `comida_menos_45`, `v4_comida_corta`, `restaurante_repetido` | Falta: comida ≤90 min, restaurante a ≤15 min, abierto ese día. |
| 15 La tarde acaba donde se cena | **Parcial**: `cena_espera`, `hueco_cena`, `tiempo_libre_sigue` | Falta: cena a ≤15 min de lo último y nunca antes de 19:30 / 20:30. |
| 16 Los huecos | **Sí** (cantidad): `hueco`, `libre_largo` | El *orden* de rellenar no se puede comprobar de fuera; se comprueba por el resultado. |
| 17 La época | **No** | Verano: ninguna parada al aire libre de 14:00 a 16:30. Invierno: ninguna parada se llama «nocturna» por el sol. |
| 18 Horas de 10 en 10 | **No** | Todo `suggested_time` con minuto múltiplo de 10, salvo fijas y pegadas. |
| 19 Una vez | **Sí, pero por nombre**: `repetido_dia`, `repetido_viaje` | Por **id de sitio** (4.5). |
| 20 Nocturnas | **Rota**: `nocturna_repite` no salta con «(noche)» | Arreglar y pasar a ids. Además: «cada nocturna una vez por viaje». |
| 21 Un barrio | **Parcial**: `barrio_dos_veces` (por día) | «Cada paseo una vez por viaje» no se comprueba. |
| 22 Free Tour | **Parcial**: `tour_repite` (que choca con la regla, fila 13), `v4_llega_tarde` | Corregir `tour_repite`; añadir mañana/tarde/noche según la hora. |
| 23 Qué es parada | **Parcial**: `nivel_camino`, `nivel_idea` | OK. |
| 24 Por fuera | **Parcial**: `fuera_minutos`, `fuera_con_tiempo` | Falta: «los Museos Vaticanos nunca por fuera». |
| 25 Nocturna cada noche | **No** | Contar noches con y sin nocturna; avisar si falta una y quedaban sitios. |
| 26 Información práctica | **Parcial** (`v4_llega_tarde`) | El texto «Llega 30 min antes» es de pantalla. |
| 27, 28 Llegada y vuelta | **No** (`medirReservas`, cliente) | Hasta el encargo de vuelos. |
| 29 Una identidad por sitio | **No** | Ver 4.5. |
| 30 Revisión de 20 viajes | **No es automática** | Lista fija en un fichero + informe de cada viaje. |

### 4.5 La regla 29: una sola identidad por sitio

**Qué hace hoy la prueba:** compara por el *texto del nombre* (`stop.place_name ?? stop.name`), y deja fuera justo tres familias: las nocturnas (`dayStops` ya las filtra, `auditoria.mjs:110`), los paseos (`is_free_walk`) y «De camino» (`pass_through`, `is_pass_by`) en el repetido del viaje (`auditoria.mjs:129`). Es decir, **la regla 29 no se cumple en justo los tres casos que nombras.**

**Lo que está roto** (por una expresión regular a la que se le perdieron las barras al escribirla; se nota porque no hace lo que dice):

| Dónde | Qué hace |
|---|---|
| `scripts/destino/auditoria.mjs:387` | `nocturna_repite` quita `(noche)` con `/s*(noche)$/`. Con «Coliseo (noche)» **no quita nada** (lo he comprobado), así que la comprobación nunca ve el lugar de día. |
| `scripts/destino/auditoria.mjs:318` | `foto_repetida` hace `!/(noche)$\|sde noche$/.test(base) ? base + ' (noche)'`: a una nocturna le pide la foto «X (noche) (noche)», que no existe. Las nocturnas no cuentan en `foto_repetida`. |
| `server/engine/index.js:702` | **La misma línea, en el motor**: `markRepeatedOwnPhotos` tampoco reconoce la foto de una nocturna, así que no marca `no_own_photo` cuando dos tarjetas del mismo día la comparten. |
| `src/components/route/TripExcursionCard.tsx:22` | `split(/s+(?:y\|en\|con)s+/)` parece querer separar «Pompeya y Sorrento»; como busca la letra *s* en vez de espacios, no separa nada. No es grave, pero es el mismo fallo. |

**Qué falta para cumplirla de verdad:**

1. **Un `id` por sitio** (`castillo_santangelo`, `puente_santangelo`, `trastevere`…), estable aunque el nombre cambie.
2. **`muestra` en cada cosa** (R-A): nocturnas, paseos, «De camino», aperitivo/desayuno si siguen, el Free Tour (sus `covers`), «X visto desde Y» (`pass_by.includes`).
3. **Que el motor escriba esos ids en la salida** de cada parada (hoy salen nombres), para que la prueba y la pantalla no tengan que adivinar.
4. **La prueba por ids**, en tres niveles: (a) dos paradas del mismo día con ids que se cruzan → fallo, salvo la excepción (visita de mañana + nocturna) y la revisita marcada; (b) un mismo id en dos días como *visita* → fallo; (c) la misma *nocturna* o el mismo *paseo* dos veces → fallo.
5. **Alias y fusiones**: `search_aliases`, y el aviso cuando dos nombres distintos apuntan al mismo sitio (el parque de Villa Borghese de la fila 21).
6. **Arreglar las 4 expresiones.**
7. **Decidir «De camino»**: ¿ver un sitio «de camino» cuenta como verlo? La 19 del borrador dice que solo se repite la *revisita de paso de un nivel 1*. Entonces un «De camino» que repite un sitio ya visto (otro día) debe contar como repetición, salvo esa excepción.

### 4.6 Cómo lo dejaría (los ficheros)

```
docs/REGLAS_RUTAS.md            ← manda. Corto (≈3 páginas). Es el borrador aprobado.
docs/reglas/CAMBIOS.md          ← el diario con fechas (lo que hoy ensucia INVARIANTES)
docs/INVARIANTES_TECNICO.md     ← arquitectura: un día por llamada, motor puro, caché, API, persistencia
docs/INVARIANTES_PANTALLA.md    ← las reglas de UI (354-390, 409, 412, 423-443…, ya al día con el rediseño)
docs/INVARIANTES_DATOS.md       ← cómo es un destino: kit, validar.mjs, `comprobado`, fotos, textos
docs/archivo/INVARIANTES_V3.md  ← lo muerto: ritmos, bloques, días curados v3 (con un aviso arriba: «no vigente»)
```

**Cada regla de `REGLAS_RUTAS.md` lleva su ficha de cinco líneas**, fija y siempre igual:

```
R-14  La comida, siempre                                 [OBLIGATORIA]
  Texto:        …
  Ejemplo:      …
  Datos:        restaurants[].meal, closed_on
  Comprobación: prueba365 → comida_menos_45, restaurante_lejos      ← el nombre exacto del tipo
  Sustituye a:  INV 36, 63, 64, 135, 157, 171, 177, 235, 392, 408
```

**Tres cosas que harían que no vuelva a pasar lo de ahora:**

1. **Que la prueba imprima una línea por regla** (`R-14: 0 fallos`, `R-19: 0 fallos`, `R-17: SIN COMPROBACIÓN`). Una regla sin comprobación se ve en rojo.
2. **Una regla nueva solo entra en `REGLAS_RUTAS.md`, quitando la que la contradiga** (como ya dice el borrador), **y se apunta en `CAMBIOS.md`** con fecha y el encargo que la pidió.
3. **INVARIANTES_MOTOR.md queda en solo lectura** y con un aviso arriba apuntando al nuevo. Las reglas vivas se *mueven* al sitio correcto; las muertas, al archivo. No se borra nada de golpe: se archiva.

### 4.7 Qué tocaría en el motor y en los días escritos (de lo que más errores quita a lo que menos)

1. **Ids y `muestra` en todo** (motor + `roma.json` + días escritos). Es lo que cierra el error del Castillo y toda la familia de repetidos. *Esfuerzo medio: cambia la salida de las paradas y hay que rellenar `muestra` en ~25 sitios (10 nocturnas, 11 paseos, los «De camino»).*
2. **Arreglar las 4 expresiones** y alinear la prueba con las reglas (`tour_repite`, `nocturna_repite`, `foto_repetida`). *Esfuerzo pequeño: son líneas, y es lo que más vale por lo que cuesta.* Después de arreglarlas, esperar que salgan fallos nuevos que estaban tapados.
3. **Decidir y escribir** las 7 elecciones graves de la tabla 1 (filas 1, 5, 6, 7, 13, 15 y 17), y aplicarlas borrando el resto. Sin esto, cualquier arreglo es un parche más.
4. **`hora fija` explícita en los días escritos**: hoy cualquier `hora` es «fija»; sería un campo propio (`fija: true` o `tipo: reserva|turno|orientativa`). Evita la ambigüedad de la 406 y de la 427 y permite la regla 1 del borrador.
5. **El orden de los días (`approach_to`) con el lado de llegada** para el Puente/Castillo (y para la Plaza Venecia/Altar, Popolo/Pincio).
6. **La prueba: añadir lo que no mira** — viajes sin fechas, de 1 día, con reservas (una por franja), y las reglas 6, 7, 10, 11, 17, 18, 25.
7. **Limpiar el código de lo muerto** una vez archivadas las reglas: el v3 de bloques y de días curados sigue en el repositorio como respaldo («si el viaje necesita un día que no está escrito, v3»). Para Roma ya no se usa. Decidir si se quita o si se mantiene como respaldo de destinos sin días escritos (y entonces se marca como tal en el código).
8. **Unificar el camino de «iluminada»**: hoy hay dos (la nocturna «El Puente y el Castillo» y el mirador que llega de noche con `night_view_overrides`). Si el borrador es lo que quieres (fila 6), uno de los dos sobra.
9. **Lo menor**: los dos umbrales de excursión (4 y 5) con nombres que no se confundan; el número del tramo largo (20 o 25) en un solo sitio.

### 4.8 Cosas del borrador que no entiendo o me parecen mal

- **Regla 1 (la lista de horas fijas):** meter la misa y «un horario escrito con hora» mezcla un compromiso (reserva) con una ventana de apertura. Y el vuelo no lo recibe el motor.
- **Regla 7 (grupos):** ver fila 25. El Altar no es del grupo del Coliseo en los datos, y el Puente y el Castillo no son del de los Vaticanos; son dos grupos aparte que en el día se recorren seguidos.
- **Regla 8:** «Pasado el máximo de días del destino, los días van en blanco». No se dice qué es «el máximo» (en Roma `max_auto_days` = 7, `manual_from` = 7); que lo diga el dato.
- **Regla 11 («Madrugar está bien»):** es una preferencia, no una regla; la 193 pone una condición (que por ello se visite un imprescindible).
- **Regla 12 (Puente y luego Castillo):** desde San Pedro se llega antes al Castillo. Sin el «si se llega por su lado», la regla manda ir y volver (choca con la 13).
- **Regla 17 (invierno):** «ni adelanta la cena» choca con la 352 (la cena se adelanta con un aperitivo muy largo, nunca antes de las 19:30). Si lo que se quiere es que no se adelante *por el sol*, hay que decirlo así.
- **Regla 21 (una vez por viaje):** puede dejar sin paseos.
- **Regla 22:** habla de «de mañana», «de tarde» y «de noche» según la hora de salida; cierto, pero no dice qué pasa con el tour de las 12:00 de los festivos (407) ni con los días sin tour.
- **Regla 25:** debería estar con las reglas de cómo se compone un día, no entre «qué es una parada».
- **Regla 30 («Claude revisa»):** es una buena práctica pero no una regla de rutas; mejor como el procedimiento de «cierre de un destino» y con la lista de 20 viajes escrita.

---

*Lo que no he podido comprobar:* el error exacto del Castillo (19:50 y 20:15) no sale en 768 días de muestra con Roma; el diagnóstico se apoya en el dato y en el código. Si me pasas la fecha, los días y la duración de ese viaje, lo reproduzco y compruebo que lo que digo es la causa.
