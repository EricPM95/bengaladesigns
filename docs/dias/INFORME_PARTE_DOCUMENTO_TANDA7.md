# Informe de la parte del DOCUMENTO · Tanda 7 (punto 18)

Agente A. Solo he tocado el documento (`DIAS_ROMA_PARADAS.md`), la guía (`GUIA_NUEVOS_DESTINOS.md`), el convertidor y sus variantes (`scripts/destino/listasConvertir.mjs`, `listasVariantes.mjs`), `data/dias/roma/listas.json` (que sale del convertidor) y una prueba nueva. Nada de `shared/routeEngine`, `src` ni `server`.

## 1. Qué se ha escrito en el documento

- **Fuera:** «El orden nuevo de los días» del 8-oct y «Toda esta sección es de la Tanda 7. Hasta entonces…». «Qué días lleva cada viaje», «El día de excursión» y «El orden de los días» se quedan como estaban (solo cambia que «Ya lo visitaste el día n» pasa a «el {día}»).
- **Fuera también:** la hoja «Ese día sales hacia el aeropuerto a las 12:00…», «SAL A LAS» y toda hora calculada, y «Lo que sea gratis o de pago: se decide al final».
- **«Llegadas y vueltas»** entera, con lo de esta tanda, por apartados: Cómo se cuentan los días · Lo que pone el viajero · Las horas: libre y salir (con las dos tablas de márgenes) · Lo que se ve en el día · Los días reales (también los viajes de 1 y 2 noches) · Qué lleva el día 1 según la hora (dos tablas) · La «Llegada a Roma» (las listas) · El Free Tour y otras reservas el día de llegada · El día de vuelta (tabla, últimas mañanas, mañanas cortas, «Hoy vuelves a casa») · Las reservas grandes y los vuelos · La excursión y los vuelos · Las reservas y los vuelos (avisos) · Cómo salen los avisos · Para tu zona · Lo que no entra todavía.
- **Regla 9** de «Cómo funciona»: «Ya lo visitaste el {día}» y «Los imprescindibles nunca van “de camino”».
- **Imprescindibles que iban «de camino» y ahora son parada corta (~10 min):** en el D6, la Plaza de San Pedro (la Cúpula), Piazza Navona y el Panteón (y la misma mañana del miércoles del D6); en el DM-medio, Fontana de Trevi; en el D4 con Free Tour de mañana, la Plaza de España. La fachada de la Basílica del D0-medio se queda de camino.
- **GUIA_NUEVOS_DESTINOS.md** (sección 4, «Llegadas y vueltas»): cómo se cuentan los días, las tablas por filas, «invierno» y «marzo a octubre», las versiones del día 1 (con la nota «PARA TODOS LOS DESTINOS»: por fuera y a buen paso, salvo los sitios grandes), la ruta del centro por inicio de zona, las mañanas de la vuelta y las cortas, el bloque de cada sitio grande, «Para tu zona» sin taxi y sin empresas, el traslado privado y los imprescindibles nunca de camino.

## 2. Los nombres exactos en `data/dias/roma/listas.json`

Todas las listas nuevas están en `dias.<ID>`, con la misma forma de siempre (`partes.unica.{manana, comida, tarde, cena, noche}`), más tres claves nuevas dentro de la parte o del día: `sobra`, `inicio`, `textos` (y `miercoles`). Los minutos (`min`) y los modos (`dentro`, `fuera`, `camino`, `null`) son los del documento. La comida y la cena traen `restaurante`, `alternativa` y `zona`. La noche trae `lista` (nombres de `night_experiences`) o `libre: true` («la nocturna que toque», regla 13).

| ID en `dias` | Nombre en el documento | Para qué fila |
|---|---|---|
| `D1-rapido` | La ruta rápida del día 1 (marzo a octubre) | libre de 10:00 a 11:59 |
| `D1-rapido-invierno-10` | …en invierno, libre de 10:00 a 10:59 | invierno 10:00–10:59 |
| `D1-rapido-invierno-11` | …en invierno, libre de 11:00 a 11:59 | invierno 11:00–11:59 (`manana` vacía; la comida va primero) |
| `D1-tarde` | El día 1 de tarde | 12:00–13:59 (invierno: 12:00–12:59) |
| `D1-centro-navona` / `D1-centro-espana` | La ruta del centro a buen paso, desde Navona / desde la Plaza de España | 14:00–18:59 (los dos inicios) |
| `D1-centro-entera-navona` / `D1-centro-entera-espana` | La ruta del centro entera | solo invierno 13:00–13:59 |
| `D1-anochecer-navona` / `D1-anochecer-espana` | La llegada al anochecer | 19:00–20:29 |
| `D1-noche` | La llegada de noche, con cena | 20:30–21:59 |
| `D1-noche-sin-cena` | La llegada de noche, sin cena | 22:00–22:59 |
| `D1-sin-ruta` | La llegada tardísima, sin ruta | desde las 23:00 (solo `textos.texto`) |
| `D1-vaticano` | **D1+Vaticano (2 noches con llegada tarde)** (`nombre` exacto) | día 2 de 2 noches con la ruta del centro el día 1 |
| `DC-vaticano`, `DC-roma-antigua`, `DC-pincio-popolo`, `DC-aventino`, `DC-cupula` | Mañana corta de… | vuelo de 13:30 a 14:59 (lista plana: `partes.unica.manana`) |
| `DV-traslado` | Hoy vuelves a casa (la tarjeta del día de vuelta) | solo `textos` |

La versión **tranquila** no es una lista nueva: es la variante `coliseo_tarde` del `D1` («Por la tarde (a las 15:30 o más tarde)»), y en invierno el `D1` de siempre.

Claves nuevas que pueden traer las listas:
- `partes.unica.sobra`: las paradas que la versión deja fuera («Si te sobra tiempo»), en su orden, con `lugar`, `min`, `modo`.
- `inicio`: `"navona"` o `"plaza_de_espana"` (en las listas de la ruta del centro y del anochecer).
- `textos`: textos del documento sin comillas, con `{Llegada}`, `{hora}`, `{punto}`, `{zona}` para rellenar. `D1-noche` y `D1-noche-sin-cena` → `textos.texto`; `D1-sin-ruta` → `textos.texto`; `DV-traslado` → `titulo`, `avion`, `tren_o_autobus`, `barco`, `madrugada`, `desde_tu_zona`, `explorar`, `despedida`, `tarde_libre`.
- `miercoles: "siguiente"` (en `DC-vaticano` y `DC-cupula`): el miércoles se usa la siguiente última mañana de la tabla.

### Las tablas (clave de arriba `llegadas`)

- `llegadas.dia1.marzo_octubre` y `llegadas.dia1.invierno`: lista de filas, cada una `{ por?: "llegada", desde: "HH:MM", hasta: "HH:MM" | null, listas: [{ lista, variante? }], segun_zona?, comida_al_llegar?, comida_corta_min?, pasa_al_dia_2?, empieza?, doc }`.
  - La primera fila (`por: "llegada"`, 00:00–04:59) se mira con la **hora de llegada**; las demás, con la hora a la que está **libre**. `hasta: null` = sin final (23:00 o más tarde, también si pasa de la medianoche). Cada fila empieza en su hora; no se redondea.
  - `listas` con dos entradas + `segun_zona: true`: la ruta del centro; se elige la lista cuyo `inicio` sale de `llegadas.inicio_por_zona[<id de la zona>]`.
  - `variante` es el `id` de una variante que ya existe en esa lista (`D1` → `coliseo_tarde`).
  - `comida_al_llegar`: la parada «Comida, cerca de tu alojamiento» (sin restaurante nuestro) antes de la primera parada. **No está dentro de las listas**: la ponen las filas. `comida_corta_min: 45` es la misma comida más corta (invierno 12:00–12:59). `empieza: "09:00"` es la hora de empezar el día de la fila de madrugada.
  - `pasa_al_dia_2`: el D1 pasa entero al día 2 (todo se corre un día y se cae el último).
- `llegadas.inicio_por_zona`: `{ centro, prati, trastevere, monti, nose → "navona"; plaza_de_espana, termini → "plaza_de_espana" }` (los ids de `destination_config.zonas_alojamiento`).
- `llegadas.vuelta`: `{ hora_de: "vuelo", punto_de_la_tabla: "fiumicino", margen_de_la_tabla: "03:00", filas: [{ desde, hasta, lleva, dia_antes?, tarde_libre?, sin_cena_ni_noche?, doc }] }`. `lleva` es `solo_traslado`, `manana_corta`, `manana_sin_comida`, `manana_con_comida` o `dia_mas`. Las horas son las del **vuelo desde Fiumicino**; para otro punto se compara «hora de vuelo − margen del punto» con «hora de la fila − 3:00».
- `llegadas.ultimas_mananas`: 6 filas en orden: `{ orden, lista, parte, franja: "manana", corta, lo_principal: [lugares], se_salta: ["12-25","pascua"] }` y la sexta `{ orden: 6, hoja: "Ya has visto lo mejor de Roma" }`. Se elige la primera cuyo `lo_principal` el viajero no haya visto de día (si ha visto alguno, se salta) y que no esté en `se_salta` ese día. `parte` dice dónde está la mañana dentro de la lista (`D0-medio` y `DT-medio` → `partes.manana`; `D1`, `DA-medio`, `D6` → `partes.unica`).

El convertidor lo comprueba: que las filas cubran las 24 horas sin huecos ni solapes, que cada lista citada exista, que cada variante citada exista, que `lo_principal` sean sitios de `roma.json` y que haya 6 últimas mañanas. Cualquier fallo sale como duda.

## 3. Cambios en el convertidor (los pido yo porque lo exigía el documento)

`scripts/destino/listasConvertir.mjs`: IDs nuevos (`LISTAS_TANDA7`) y mañanas cortas como listas planas; etiquetas nuevas `Si te sobra tiempo:`, `Texto…:`, `Empieza en:` y `El miércoles:`; los días con solo texto ya no dan duda; y la lectura de las tablas de arriba. `listasVariantes.mjs`: tres ajustes de «imprescindible de camino → parada de ~10 min» (la variante del miércoles del D6: el Panteón y la Plaza de San Pedro; la variante del D4 con Free Tour: la Plaza de España). Convertidor: **0 dudas**.

## 4. Cómo se ha comprobado que Roma sale igual

- `node scripts/destino/listasConvertir.mjs`: 34 días, 295 paradas, **0 dudas**. (Antes de tocar nada, el convertidor regeneraba el `listas.json` viejo idéntico.)
- Comparación del `listas.json` viejo con el nuevo (14 días viejos): **11 iguales** (D0, D0-medio, D1-corto, D1, D2, D3, D1-FT, DT-medio, DA-medio, D5, D7) y **3 distintos**, solo por la regla de los imprescindibles: D6 (Plaza de San Pedro, Navona y Panteón de camino → parada de 10 min; igual en la variante del miércoles; y el texto «Ya lo visitaste el {día}»), DM-medio (Trevi) y D4 (variante del Free Tour: la Plaza de España). Lo demás que cambia son las 20 listas nuevas y la clave `llegadas`.
- Pruebas que leen `listas.json`, todas en **0 fallos**: `pruebaFase6y4_listas` (643 comprobaciones), `pruebaFase6y10_viajes` (118), `pruebaFase6y10_comida` (2593), `pruebaFase6y8_comida` (53559), `pruebaFase6y6_cierre` (3219) y `pruebaFase6y7_motor` partes 1 a 3 (17724).
- Muestra de ~54 fechas con `pruebaListas` (la copia de `muestra60.mjs` apuntando a este worktree): ver el final de este informe.
- **Prueba nueva** `scripts/destino/pruebaTanda7_documento.mjs`: 420 comprobaciones, **0 fallos**. Mira que cada lista nueva esté con sus paradas, tiempos y modos, comida, cena, noche y «Si te sobra tiempo»; que las tablas cubran las 24 horas y que las 24 horas de frontera del prompt (llegada: 0:00, 4:59, 5:00, 9:59, 10:00, 11:59, 12:00, 12:59, 13:00, 13:59, 14:00, 14:59, 15:00, 18:59, 19:00, 20:29, 20:30, 21:59, 22:00, 22:59, 23:00; vuelta: 0:00, 4:59, 5:00, 8:59, 9:00, 13:29, 13:30, 14:59, 15:00, 16:59, 17:00, 22:59, 23:00) caigan en la fila del prompt, en marzo a octubre y en invierno; las 5 últimas mañanas en su orden y las 5 cortas; que ningún imprescindible vaya «de camino» en ninguna lista de Roma (salvo la fachada de la Basílica del D0-medio y el «bajar la escalinata»); que el texto nuevo no lleve horas calculadas, empresas, «taxi» como forma de llegar o irse, «Día n» ni restos de lo que se quita; y que los textos de los datos no lleven «taxi», «centro», empresas, ni horas escritas.
- **Aviso, no fallo:** la prueba calcula si cada mañana corta y cada última mañana cabe con la hora más temprana de su fila (ver preguntas).

## 5. Tablas de fronteras por punto (para los agentes del motor)

La hora de **llegada** a partir de la cual el viajero cae en cada fila (libre = llegada + traslado del punto + 30 min):

| Libre a las… | Fiumicino | Ciampino | Termini | Tiburtina (tren) | Estación de autobuses de Tiburtina | Civitavecchia |
|---|---|---|---|---|---|---|
| 10:00 | 08:30 | 08:40 | 09:15 | 09:05 | 09:05 | 07:30 |
| 11:00 (solo invierno) | 09:30 | 09:40 | 10:15 | 10:05 | 10:05 | 08:30 |
| 12:00 | 10:30 | 10:40 | 11:15 | 11:05 | 11:05 | 09:30 |
| 13:00 (solo invierno) | 11:30 | 11:40 | 12:15 | 12:05 | 12:05 | 10:30 |
| 14:00 | 12:30 | 12:40 | 13:15 | 13:05 | 13:05 | 11:30 |
| 15:00 | 13:30 | 13:40 | 14:15 | 14:05 | 14:05 | 12:30 |
| 19:00 | 17:30 | 17:40 | 18:15 | 18:05 | 18:05 | 16:30 |
| 20:30 | 19:00 | 19:10 | 19:45 | 19:35 | 19:35 | 18:00 |
| 22:00 | 20:30 | 20:40 | 21:15 | 21:05 | 21:05 | 19:30 |
| 23:00 | 21:30 | 21:40 | 22:15 | 22:05 | 22:05 | 20:30 |

(La fila de madrugada, de 0:00 a 4:59, mira la hora de llegada tal cual, sin sumar nada.)

La hora de **vuelo** a partir de la cual cae en cada fila de la vuelta (salir = vuelo − margen del punto; la tabla del documento es la de Fiumicino, margen 3:00):

| Vuelo desde Fiumicino | Fiumicino | Ciampino | Termini | Tiburtina (tren) | Estación de autobuses de Tiburtina | Civitavecchia |
|---|---|---|---|---|---|---|
| 05:00 | 05:00 | 04:50 | 02:45 | 02:55 | 02:55 | 05:50 |
| 09:00 | 09:00 | 08:50 | 06:45 | 06:55 | 06:55 | 09:50 |
| 13:30 | 13:30 | 13:20 | 11:15 | 11:25 | 11:25 | 14:20 |
| 15:00 | 15:00 | 14:50 | 12:45 | 12:55 | 12:55 | 15:50 |
| 17:00 | 17:00 | 16:50 | 14:45 | 14:55 | 14:55 | 17:50 |
| 23:00 | 23:00 | 22:50 | 20:45 | 20:55 | 20:55 | 23:50 |

(Estas horas son solo para los agentes: no se enseñan nunca.)

## 6. Decidido por Code

1. **Nombres de las listas** (arriba). Los IDs empiezan por `D` porque el convertidor así lo exige; «D1+Vaticano (2 noches con llegada tarde)» es el `nombre` de `D1-vaticano` (el `+` no cabe en un ID).
2. **Dos tablas del día 1** (marzo a octubre e invierno) en vez de una con columnas, para que cada una cubra las 24 horas y se pueda partir el invierno en 10:00–10:59, 11:00–11:59, 12:00–12:59 y 13:00–13:59. La fila de las 20:30 a las 22:59 son **dos filas** (20:30–21:59 con cena y 22:00–22:59 sin ella), porque la cena solo sale si está libre antes de las 22:00.
3. **«Comida al llegar» y «comida corta»** son marcas de la fila, no están dentro de las listas (así `D1-tarde` y la ruta del centro sirven con y sin comida). La variante de invierno de `D1-tarde` (12:00–12:59) es la misma lista con `comida_corta_min: 45`; no he duplicado la lista.
4. **Minutos que el prompt no daba:** Panteón por dentro ~30 y Navona ~20 en la parte «a buen paso» del invierno (como el D3 y el rápido de verano); Via Condotti ~10 en la ruta a buen paso (la regla 9 dice que es parada, no de camino) y ~15 en la entera; Navona ~45 en `D1-tarde` (como el D1); todo lo demás, los del prompt.
5. **Cena y noche de las rápidas de invierno:** Il Gabriello (o Poldo e Gianna) y Trevi + Plaza de España («cena y noche en Trevi y la Plaza de España»). En la rápida de verano, la noche es la Plaza de España y la Escalinata, y Trevi sale por la mañana.
6. **«Si te sobra tiempo» de las rápidas de invierno y de la de tarde:** las mismas cinco del verano (Barrio Judío, Fuente de las Tortugas, Largo di Torre Argentina, San Luigi, Gesù); el prompt solo lo decía para el verano.
7. **Ruta del centro:** «Via del Corso» va «de camino» (no tiene nombre propio como parada en los datos). La nocturna de las rutas es «la que toque» (regla 13), como pide el prompt.
8. **Lo principal de cada última mañana** (lo que hace que se salte): el Vaticano, la Plaza de San Pedro; la Roma antigua, el Coliseo y el Foro Romano y Palatino; el Pincio y el Popolo, la Terraza del Pincio y la Piazza del Popolo; el Aventino, el Jardín de los Naranjos y el Circo Máximo (el prompt solo dice «si no lo ha visto»); la Cúpula, la Cúpula de San Pedro. Se salta si ha visto **alguno**. «Se salta el 25 de diciembre y el domingo de Pascua» vale también para la mañana corta del Vaticano.
9. **Hora de empezar de las últimas mañanas:** solo la del DT-medio está escrita (7:30); las demás, las 9:00, como pide el prompt.
10. **Puntos 10 y 12 del prompt:** como sus reglas vivían dentro de «Los días reales» y «La excursión y los vuelos», las he puesto al día en esas mismas secciones («Las reservas grandes y los vuelos», «La excursión y los vuelos»), y los avisos del punto 14 en «Las reservas y los vuelos» y «Cómo salen los avisos». El punto 7 (Free Tour) está en «El Free Tour y otras reservas el día de llegada».
11. **Imprescindibles de camino:** además de los tres del prompt (D6), he pasado a parada de ~10 min la Fontana de Trevi del DM-medio y la Plaza de España del D4 con Free Tour de mañana, porque eran imprescindibles de camino en una lista escrita. **No he tocado** el «bajar la escalinata» de las variantes del D0 (es el trayecto de la Escalinata, la regla 9 dice que no se nombra otra vez).
12. **La capa de Navidad** («Piazza Navona y su mercadillo navideño», del 8 de diciembre al 6 de enero) de la ruta del centro entera está escrita en el documento (línea «Mercadillos»), pero no la he metido en los datos de variantes; el agente del motor la puede leer del documento o pedirlo.
13. **Lo del D1+Vaticano en domingo o miércoles** (el Vaticano a la mañana de la vuelta si cabe; si no, a «Si te sobra tiempo») está en el documento como línea «Cierres», no como dato.
14. **Pendiente de otro agente:** las casillas nuevas de RESERVAS (punto de salida, otra hora, dirección del alojamiento) no están en el documento; el documento solo recoge lo que pedía el punto 18.

## 7. Preguntas abiertas (máx. 5)

Las ha sacado la prueba (`pruebaTanda7_documento.mjs`, apartado 7). Cuenta lo que dura cada parada más lo que se anda entre ellas (la matriz de tiempos de Roma), con el día empezando a las 9:00 (el DT-medio, a las 7:30), la comida de 60 min y el margen de Fiumicino (3:00), que es el más largo y por tanto el caso más justo de cada fila. No he recortado nada.

1. **Tres mañanas cortas se pasan unos minutos** con el vuelo más temprano de su fila (13:30; hay 90 min): la del Vaticano (93), la de la Roma antigua (97) y la del Pincio y el Popolo (97). Si se cuentan solo los minutos de las paradas, caben (85, 75 y 80). La del Aventino (82) y la de la Cúpula (86) caben. ¿Se quedan como están (se pasan 3 a 7 minutos si el viajero anda despacio) o quitamos algo? Lo que sobraría: la Via della Conciliazione, el Arco de Constantino y la Escalinata y Trinità, respectivamente.
2. **La última mañana entera, sin comida (vuelo de 15:00; hay 3 h):** no cabe ninguna salvo la del Pincio y el Popolo. Necesitan: Vaticano (D0-medio de mañana) 247 min, Roma antigua (la mañana del D1) 289, Aventino 198, Cúpula (D6) 255. ¿Qué pasa con lo que no cabe? La opción que veo, la de siempre: lo del final de la lista, a «Si te sobra tiempo» (el viajero decide), y las listas se quedan como están en el documento.
3. **La última mañana con comida (vuelo de 17:00; hay 5 h):** se pasan el D1 (349 min con la comida), el Aventino (318), la Cúpula (315) y el Vaticano (307); cabe el Pincio y el Popolo (324 de 390). Es la misma pregunta que la 2: ¿lo del final a «Si te sobra tiempo»?
4. **La prueba `pruebaTanda6g`** (de la Tanda 6g) ahora da fallos en `d6_de_camino` (2190) y `d6_ya_visitado` (1087), porque comprueba lo contrario de lo que pide Eric (Navona y el Panteón del D6 «de camino» y con «Ya lo visitaste el día 1»). Antes daba 1 fallo (`etiqueta_roja`). No la he tocado: la regla nueva la deja obsoleta. ¿Quién la actualiza, el agente del motor o yo en el cierre?

## 8. Muestra de ~54 fechas

`pruebaListas` en 54 fechas (festivos, domingos, lunes, miércoles, Navidad y Año Nuevo, Semana Santa, agosto, cambios de hora), con las listas nuevas ya en `listas.json` y el D6, el DM-medio y el D4 con la regla de los imprescindibles: **119.673 viajes, 324.948 días, 0 fallos** (619 s). Las 365 fechas completas no se han lanzado, como pedía el prompt.
