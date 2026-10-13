# Informe de la parte del MOTOR DEL DÍA DE VUELTA · Tanda 7 (puntos 9, 10-vuelta, 12-vuelta, 19 y 23-vuelta)

Agente G. Solo he tocado el motor de la vuelta (y el último día de ruta con una salida de madrugada): un módulo nuevo (`shared/routeEngine/vueltaDia.js`), los enganches mínimos de `listasTrip.js` y del servidor, dos campos nuevos de los datos de Roma y la prueba nueva. **No he tocado la llegada ni las pantallas.** Sin push. Nada de Roma está escrito en el código: la tabla, las últimas mañanas, los bloques, los textos y «Para tu zona» salen de los datos del destino.

## 1. Qué se ha hecho, punto por punto

- **9 · La tabla de la vuelta por filas** (`llegadas.vuelta` de `listas.json`): la hora que pone el viajero (la del billete) menos el margen de su punto (`_llegada.json`: Fiumicino 3:00, Ciampino 2:50, Termini 0:45, Tiburtina 0:55, estación de autobuses 0:55, Civitavecchia 3:50) se compara con la hora de la fila menos el margen de la tabla (3:00). **Cada tramo empieza en su hora y nada se redondea.** Sin punto (un viaje viejo), el del traslado más largo del medio (`al_centro_min`: avión, Fiumicino; tren, Tiburtina; autobús, la estación de autobuses; barco, Civitavecchia). En coche no hay hora: no hay vuelta.
  - **De 0:00 a 4:59** cuenta como la noche de antes: el último día de ruta conserva su cena y **no lleva nocturna** (si la tenía, las nocturnas imprescindibles pasan a los primeros días: lo único que cambia en los días de ruta es la nocturna), y la tarjeta «Hoy vuelves a casa» sale **también al final de ese último día** (`tarjetaUltimoDia`, texto «Tu vuelo sale esta noche, a las {hora}…»). El día de vuelta, solo el traslado.
  - **De 5:00 a 13:29**: solo el traslado (el día de antes, igual que sin vuelo, con su noche).
  - **De 13:30 a 14:59**: la mañana corta de la última mañana que toca, sin comida.
  - **De 15:00 a 16:59**: la última mañana entera, sin comida: lo que su lista lleva **después de la comida** va a «Si te sobra tiempo».
  - **De 17:00 a 22:59**: la última mañana con comida; lo de después de la comida a «Si te sobra tiempo»; `tardeLibre` («La tarde es tuya hasta que te vayas.» y [+ Añadir lugares]).
  - **23:00 o más**: «un día más» entero, sin cena ni nocturna: el día que se cayó al llegar (gancho `diaCaidoAlLlegar`, ver 4.4); si no, el siguiente día escrito que el viaje no lleva (el orden de la fila más larga de `curated_routes.por_dias_ciudad`); si no queda ninguno, la última mañana con comida y la tarde libre.
- **9b · La última mañana**: la primera de `llegadas.ultimas_mananas` que no repite lo principal ya visto de día. «Visto» = lo que ya ha salido como parada, por fuera o de camino en los días de ruta (las nocturnas no cuentan; lo que se queda «Cerrado este día» tampoco). Se salta el Vaticano el 25 de diciembre y el domingo de Pascua (`se_salta`), y el miércoles las mañanas cuya corta dice `miercoles: "siguiente"` (el Vaticano y la Cúpula). Se prepara con su versión de cierres (las variantes de su día escrito, con la fecha del día de vuelta). Si no queda ninguna, `hoja: "Ya has visto lo mejor de Roma"` (el día no lleva paradas). **Su hora de empezar**: solo el DT-medio la tiene escrita (7:30); las demás usan la de un día normal (9:00) y queda apuntado en `notas` («la hora de empezar de … no está escrita»). Sin fechas no se puede saber la fecha ni el día de la semana: no se salta nada.
- **9c · Las mañanas cortas**: las 5 listas `DC-*` con el miércoles → la siguiente; pasan por las mismas reglas de cierres (si a su hora algo aún no ha abierto, el motor lo pone por fuera con su aviso, como en cualquier día).
- **9d · La maleta**: si el día de vuelta lleva paradas, `maleta` (el texto de `_llegada.json`) es su primera línea y `ultimaTarde` lleva el texto nuevo («Aprovecha la mañana sin prisas…»).
- **9e · El día de vuelta sin paradas**: `tarjeta` con el título, el texto con `{punto}` y `{hora}` (avión, tren, autobús, barco), «Desde tu zona ({zona}): {mejor opción}» (la función `paraTuZona`, sentido `vuelta`, sin tiempo total sumado), [Ver cómo ir], «¿Crees que te da tiempo a ver algo?…» [Explorar monumentos] y la despedida. Todo como dato (ver 4.3).
- **9f · Una reserva pequeña el día de vuelta**: su parada a su hora dentro de la mañana, con su «Llegada a…»; no se quita nada.
- **10 · Reserva grande el día de vuelta**: solo el **bloque** de esa reserva, entero y sin mirar si cabe (`contenido: "bloques"`). El bloque sale de los datos (`sitios_grandes.lugares[].bloque`) y del día escrito de ese sitio para la hora de la reserva (con su tabla de horas: el Foro antes o después del Coliseo, etc.). **El resto de su día escrito se queda en su día, en la versión sin esa visita** (el Coliseo: el D1 empieza en el Campidoglio; los Museos: la versión sin Museos del D2; la Galería: la versión del lunes del D4). Con una reserva el día tiene mañana aunque su fila diga «solo el traslado». **Dos reservas grandes** el mismo medio día: cada bloque a su hora, uno detrás de otro; si se cruzan, el aviso `coinciden`. El miércoles, la Plaza y la Basílica de los Museos nunca antes de comer (`bloque.despues_de_comer`): después de la comida si la fila la lleva, y si no, a «Si te sobra tiempo».
- **12 · La excursión reservada el día de vuelta** (o el último día de ruta con una salida de madrugada): aviso `excursion_vuelve_tarde` con los textos del documento y los botones [Ver mi reserva] · [Pasar este día a Roma]. **No se cambia nada solo**: los días de ruta son idénticos con y sin la excursión. Una de medio día que vuelve a las 14:00 no avisa si la hora de salir es a las 14:00 o más tarde. El día de vuelta de una excursión reservada es el de la excursión (`contenido: "excursion"`): no se le pone una mañana encima ni la tarjeta.
- **14 (la parte de vuelta) · Avisos**: `reserva_despues_de_salir` (su hora + lo que dura, de los datos, contra la hora de salir; el último día de ruta con una salida de madrugada, contra la hora de salir de esa noche), `excursion_vuelve_tarde` y `coinciden`. Todos van a la campana y llevan solo horas del viajero o de los datos.
- **19 · La ruta a mano** (`vuelta.aMano`): ningún día se recorta ni se rehace; solo salen los avisos de reservas contra el vuelo. Sin hoja del resumen, sin tarjeta, sin día de vuelta rehecho.
- **«Sin vuelos y en la gratis, los días salen igual»** (`vuelta` ausente o `pago: false`): comprobado contra el motor de antes de esta tanda sacado de git, byte a byte.
- **23 · Viajes**: `VIAJES_VUELTA` (10 viajes: una vuelta de cada fila + un miércoles, el 25 de diciembre y el domingo de Pascua) y `argsDeViajeVuelta` / `planViajeVuelta` en `scripts/destino/viajes20Lib.mjs`.

**No hecho (no es de la vuelta o lo hace el agente de la llegada):** «pasar a los datos la regla del Coliseo de `claseDeReserva` (`no_cabe_con_excursion_hasta`)» (punto 10, último párrafo: toca la reserva de la llegada); los avisos de un viaje de una sola fecha (sin día de vuelta aparte); «Había excursión» (día 4 que pasa a ser el de vuelta).

## 2. Ficheros

- **Nuevo** `shared/routeEngine/vueltaDia.js`: todo lo de la vuelta, puro.
- `shared/routeEngine/listasTrip.js`: enganches (`vuelta` en los argumentos; `prepararVuelta` antes de preparar los días; `contextoDe`/`preparar` aceptan `sobre` —el día de vuelta, que no es un día de ruta—; la madrugada; `nochesDelDia` respeta `sinNocheVuelta`; `montarVuelta` después de los días; `vuelta` en la salida; `unitPrefix`/`sobra_causa` en `construirSalida`/`procesarDia`).
- `server/engine/index.js`: `vuelta` a `planArgs` (con los datos de llegada), la clave de la caché sin `vuelta.info`, y el día de vuelta como día pedible (`dayNumber === totalDays`).
- `server/engine/writtenDays.js`: `writtenDaysFor(...).llegadas` (las tablas de `listas.json`, que antes se perdían).
- `server/index.js`: `engineExtrasFromRequest` lee `body.vuelta`.
- `data/pipeline_v2/roma.json`: `sitios_grandes.lugares[].bloque` y `.entrada_a` (3 sitios).
- `scripts/destino/pruebaTanda7_vuelta.mjs` (nueva), `viajes20Lib.mjs` (los viajes con vuelta); exploradores `_t7v_*.mjs` (no son pruebas).
- `docs/dias/GUIA_NUEVOS_DESTINOS.md`: cómo se escriben `bloque` y `entrada_a` en los datos de un destino.

## 3. La ENTRADA del motor

### 3.1 `planListasTrip({ …, vuelta })` (y `buildDayBlockV3(…, options.vuelta)`)

```js
vuelta: {
  hora: '17:00',          // la hora del billete, la del viajero (también '9:05'). Obligatoria; sin ella no hay vuelta.
  modo: 'flight',         // 'flight' | 'train' | 'bus' | 'ferry' (o 'avion' | 'tren' | 'bus' | 'ferry'). 'own_vehicle' / 'car' / 'coche': sin vuelta.
  puntoId: 'fco',         // 'fco' | 'cia' | 'termini' | 'tiburtina' | 'tibus' | 'civitavecchia' | null (sin punto: el del traslado más largo del medio)
  zona: 'centro',         // id de la zona del alojamiento ('nose' o null = «Aún no lo sé»)
  info: { … },            // _llegada.json (el servidor lo pone con arrivalInfoFor; el motor es puro)
  pago: false,            // false = la gratis: se ignora todo
  aMano: true,            // la ruta a mano: solo avisos
  diaCaidoAlLlegar: 'D4', // id (o lista de ids) del día escrito que se cayó al llegar (lo pone la llegada; ver 4.4)
  excursion: { nombre: 'Pompeya', vuelve: '20:00' | null, medioDia: false, dateIso: '2027-05-08', dayNumber: 4 }, // la excursión RESERVADA por el viajero
}
```

Las reservas del viaje entran como siempre (`reservasGrandes` y `reservasViaje` con `name`, `dateIso`, `dayNumber`, `time`): las que caen en el día de vuelta (o en el último día de ruta, para los avisos de madrugada) las lee `prepararVuelta`.

### 3.2 La petición

`POST /api/rebuild-day` (y los demás que usan `engineExtrasFromRequest`) acepta `body.vuelta` con `{ hora, modo, puntoId, zona, aMano, diaCaidoAlLlegar, excursion }`. **Para pedir el día de vuelta**: `day_number = totalDays` y `all_days` **sin** el día de vuelta sintético (el servidor calcula `totalDays = all_days.length + 1`). Sin `vuelta`, ese día sigue sin pedirse (devuelve `null`, como antes). El día 1…N–1 no cambian por pedir la vuelta (comprobado).

## 4. La SALIDA del motor

### 4.1 `plan.vuelta` (solo con `vuelta`; nunca se enseña lo marcado «interno»)

| Campo | Qué es |
|---|---|
| `activo`, `aMano` | `activo: false` con la ruta a mano (solo avisos). |
| `medio`, `punto {id, nombre, corto, porDefecto}`, `hora` | lo que puso el viajero (y el punto por defecto si no puso ninguno). |
| `fila {indice, desde, hasta, lleva, doc}`, `lleva`, `madrugada` | la fila de la tabla; `lleva` ∈ `solo_traslado`, `manana_corta`, `manana_sin_comida`, `manana_con_comida`, `dia_mas`. |
| `fecha {dayNumber, dateIso, weekday}`, `ultimoDiaDeRuta {dayNumber, dateIso}` | el día de vuelta y el último de ruta. Sin fechas, `dateIso` y `weekday` son `null`. |
| `contenido` | lo que lleva de verdad el día: `sin_paradas`, `manana`, `dia_mas`, `bloques`, `solo_reservas`, `hoja`, `excursion`, o `null` (ruta a mano). |
| `listaId` | la lista escrita que se ha usado (`DC-vaticano`, `D6`, `DV-bloque-…`…). |
| `manana {lista, orden, corta, saltadas[{lista, motivo}]}` | la última mañana y por qué se saltaron las anteriores. |
| `diaMas {lista, origen}` | `origen`: `cayo_al_llegar` \| `siguiente_que_no_lleva`. |
| `hoja` | «Ya has visto lo mejor de Roma» cuando no queda ninguna mañana. |
| `bloques[{sitio, hora, paradas[]}]`, `reservasPequenas[{name, hora}]`, `excursion` | lo reservado ese día. |
| `comida` | si el día de vuelta lleva comida (solo con `manana_con_comida` y `dia_mas`). |
| `tardeLibre {texto, anadirLugares}` | «La tarde es tuya hasta que te vayas.» y [+ Añadir lugares] (solo desde las 17:00). **No** es `afternoon_free` de la excursión de medio día: ese campo esconde las paradas; aquí las paradas de la mañana se quedan. |
| `maleta {titulo, texto, consigna}`, `ultimaTarde {texto}` | solo si el día lleva paradas; `maleta.texto` es la primera línea del día. |
| `tarjeta`, `tarjetaUltimoDia` | ver 4.3. `tarjeta` solo si el día va sin paradas; `tarjetaUltimoDia` solo con salida de madrugada. |
| `resumen {tipo, plantilla, dayNumber, dateIso, madrugada}` | para la hoja del resumen (4.5). |
| `avisos[]` | ver 4.2. |
| `notas[]` | cosas apuntadas (la hora de empezar que no está escrita). |
| `interno` | `salirMin`, `margenMin`, `equivalenteMin`: **nunca se enseña**; el servidor lo quita de `return_day`. |
| `diaPlan` | el día de vuelta hecho, como un día de ruta (mismas `escritoRows`, `spareRows`, `schedule`…), o `null` si va sin paradas. |

### 4.2 Los avisos (`plan.vuelta.avisos[]`, también `day.return_day.avisos`)

Todos van a la **campana** (`donde: "campana"`) y se quedan mientras sigan mal. Forma: `{ tipo, texto, donde, botones[{id, texto}], dayNumber, dateIso, reserva?/reservas? }`.

| `tipo` | Texto (el de `PARA_CODE_TANDA7_v3.md`, punto 14) | Botones |
|---|---|---|
| `reserva_despues_de_salir` | «Tu entrada a los Museos Vaticanos es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.» («al Coliseo», «a la Galería Borghese», «Tu Free Tour…»; «tu tren / autobús / barco sale». Un sitio sin `entrada_a`: «Tu reserva de {sitio} es a las…».) | [Ver mi reserva] `ver_reserva` |
| `excursion_vuelve_tarde` | «Tienes el vuelo a las 17:00 y tu excursión a Pompeya vuelve a Roma a las 20:00: no te da tiempo. Revisa tu reserva de la excursión.» (sin hora de vuelta, sin «a las 20:00») | [Ver mi reserva] `ver_reserva` · [Pasar este día a Roma] `pasar_a_roma` |
| `coinciden` | «Tu entrada al Coliseo y tu entrada a los Museos Vaticanos coinciden. Revisa una de las dos reservas.» | [Ver mis reservas] `ver_reservas` |

Cuándo salen: la reserva avisa si **su hora + lo que dura** (`duration_minutes` del sitio, 150 el Free Tour) pasa de la hora de salir; la excursión, si **vuelve** después de salir (estricto: si vuelve justo a la hora de salir no avisa). Con una salida de madrugada, lo del último día de ruta se compara con la hora de salir **de esa noche**. Ninguna hora de los textos es calculada.

### 4.3 La tarjeta «Hoy vuelves a casa»

```js
{ titulo: 'Hoy vuelves a casa',
  texto: 'Tu vuelo sale de Fiumicino a las 10:00. Te recomendamos estar en el aeropuerto 2 horas antes, por eso hoy no te hemos puesto paradas: es el día de irte con calma.', // tren/autobús/barco: sus textos; madrugada: «Tu vuelo sale esta noche, a las 2:00…»
  desde_tu_zona: { texto: 'Desde tu zona (Centro): Bus 40 o 64 a Roma Termini y Leonardo Express a Aeropuerto de Fiumicino (32 min, sin paradas).',
                   zona, zona_nombre, sin_zona, aviso, mejor, otras, traslado_privado },   // `mejor`/`otras` = lo de paraTuZona sin fuentes ni horarios completos; `aviso` = el texto del último tren si toca
  ver_como_ir: { texto: 'Ver cómo ir', abre: 'ficha_de_vuelta' },
  explorar: { texto: '¿Crees que te da tiempo a ver algo? Aquí tienes los monumentos de Roma.', boton: 'Explorar monumentos', abre: 'explorar_monumentos', cerca_de_mi: true },
  despedida: 'Esperamos que hayas disfrutado de Roma. ¡Nos vemos en tu próximo viaje!', madrugada: false }
```

Con «Aún no lo sé» o sin zona, la mejor opción es la de Termini (`sin_zona: true`, «Desde tu zona (Termini)…»). De noche o a primera hora (Leonardo Express sin servicio), `mejor` es `{ tipo: 'traslado_privado' }` y `traslado_privado` lleva su texto. La frase de `desde_tu_zona.texto` no suma tiempos.

### 4.4 Los enganches con la llegada (para el agente F y para el cierre)

- **`diaCaidoAlLlegar`** (`listasTrip.js`, junto a `Vactiva`): una variable `let` que la llegada debe rellenar con el id (o los ids) del día escrito que se cae cuando el D1 pasa al día 2. Mientras no lo haga, vale `vuelta.diaCaidoAlLlegar` de la petición. La vuelta de las 23:00 o más lo recupera como «un día más» (`diaMas.origen: "cayo_al_llegar"`); si ya está en el viaje, no se usa.
- **`contextoDe(dia, day, hours, parte, index, sobre)` y `preparar(id, index, sobre)`**: el parámetro nuevo `sobre = { day, parteKey, entradas }` prepara un día que no es de ruta (el de vuelta). La llegada puede usarlo igual para el medio día de llegada.
- **Funciones reutilizables**: `armarBloque`, `sacarParadas` y `prepararVuelta().limpiar/cerradoEn` de `vueltaDia.js` sirven tal cual para el bloque del **día de llegada** (el bloque a su hora; el resto del día del sitio en su versión sin esa visita). Los datos (`bloque`, `entrada_a`) son comunes.
- **`procesarDia` / `construirSalida`**: `draft.unitPrefix` (los `unitId` del día de vuelta empiezan por `vuelta:` para no chocar con un día de ruta que use la misma lista), `stop.sobra_causa` (texto del registro de «Si te sobra tiempo»), `draft.sinNocheVuelta`.
- **Dónde se va a notar el choque al fusionar**: la línea de `import … tripSkeleton`, la desestructuración de `args`, `contextoDe`/`preparar`, el `return` final de `planListasTrip`, `engineExtrasFromRequest`, `planArgs` y el `return` de `writtenDaysFor`, y las líneas de `sitios_grandes` de `roma.json` (si F también añade el bloque o el nombre de la entrada, hay que dejar uno solo: aquí `bloque` y `entrada_a`).

### 4.5 La hoja del resumen (cambio de la vuelta)

`plan.vuelta.resumen`: `{ tipo, plantilla, dayNumber, dateIso, madrugada }`. Las pantallas ponen el día con `nombreDeDia` donde dice `{dia}`:
- `ultima_manana`: «{dia} tienes una última mañana por Roma antes de irte al aeropuerto.» (a la estación / al puerto según el medio)
- `casi_un_dia`: «{dia} tienes casi un día entero por Roma antes de irte.»
- `solo_traslado` / `madrugada`: «{dia} te vas pronto: ese día solo lleva el camino al aeropuerto.»
- Con `contenido: "excursion"` o la ruta a mano, `resumen` es `null`. Los avisos van a la campana; la hoja de abajo es para lo que acaba de cambiar (el aviso `excursion_vuelve_tarde` pide además la hoja de elegir [Pasar este día a Roma] · [Mantener la excursión] si la eligió el viajero: eso lo decide la pantalla).

### 4.6 El día pedido al servidor (`buildDayBlockV3`)

- Con paradas: un día de ciudad normal + `is_return_leg: true` + `return_day` (todo lo de 4.1 menos `interno` y `diaPlan`).
- Sin paradas (`sin_paradas`, `hoja`, `excursion`, ruta a mano): `{ day_number, title: "Día de viaje", type: "manual", stops: [], meals: [], …, is_return_leg: true, return_day }`. El título es «Día de viaje», nunca «Día libre».

## 5. Las fronteras por punto

Están en `INFORME_PARTE_DATOSLLEGADA_TANDA7.md` (sección 8, tabla de la vuelta de cada punto). La prueba las comprueba **minuto a minuto**: para cada medio y punto (y sin punto), las 1.440 horas del día caen cada una en su fila (ninguna se queda sin fila) con la fila de la tabla del documento (escrita aparte en la prueba) y el margen del punto; las filas no retroceden. Además las 13 horas del prompt con Fiumicino y sus equivalentes en los demás puntos.

## 6. Listas que NO caben con la hora más temprana de su fila (a PREGUNTAS)

Medido con el propio motor (una mañana forzada a salir la primera, sin nada visto, jueves/domingo/lunes de verano y jueves de invierno; el peor caso). «Se pasa» = cuánto después de la hora de salir acaba la última parada. **No se ha recortado nada.**

| Lista | Fila (hora más temprana) | Acaba / hay que salir | Se pasa | Lo que sobra |
|---|---|---|---|---|
| `DC-vaticano` (corta) | 13:30 | 10:33 / 10:30 | 3 min | la Via della Conciliazione |
| `DC-roma-antigua` (corta) | 13:30 | 10:37 / 10:30 | 7 min | el Foro desde la terraza del Campidoglio |
| `DC-pincio-popolo` (corta) | 13:30 | 10:37 / 10:30 | 7 min | la Piazza del Popolo |
| `D0-medio` (el Vaticano) | 15:00 | 13:07 / 12:00 | 67 min | la Fontana de Trevi y la Plaza de España |
| `D1` (la Roma antigua) | 15:00 | 13:50 / 12:00 | 110 min | el Foro y el Palatino (90), el Campidoglio, Piazza Venecia y el Altar |
| `DT-medio` (Pincio y Popolo) | 15:00 | 12:14 / 12:00 | 14 min | la Via Condotti |
| `DA-medio` (Aventino) | 15:00 | 12:18 / 12:00 | 18 min | el Ojo de la Cerradura |
| `D6` (la Cúpula) | 15:00 | 13:15 / 12:00 | 75 min | el Castillo (90), el Puente, la Via dei Coronari, Navona y el Panteón |
| `D0-medio` | 17:00 | 14:17 / 14:00 | 17 min | la comida (60) |
| `D1` | 17:00 | 14:57 / 14:00 | 57 min | la comida (60) |
| `D6` | 17:00 | 14:26 / 14:00 | 26 min | la comida (60) |

Caben: `DC-aventino` (10:22 / 10:30) y `DC-cupula` (10:26 / 10:30) en la mañana corta; `DT-medio`, `DA-medio` en la mañana con comida (13:30 / 14:00).

**Lo que cada lista manda a «Si te sobra tiempo»** (lo de después de la comida; no se repite lo que el viaje ya ha visto): `DA-medio`: Pirámide Cestia y Cementerio Protestante; `D6`: Museos Capitolinos, Santo Bambino de Aracoeli, Mercados de Trajano y Teatro de Marcelo (y lo que el viaje no haya visto); `D1`: Barrio Judío, Largo di Torre Argentina, San Luigi dei Francesi, Panteón, Piazza Navona y el Gesù; las demás, nada.

## 7. Decidido por Code

1. **Los datos nuevos**: `bloque` (`paradas`, `despues_de_comer`) y `entrada_a` en `sitios_grandes.lugares[]` de `roma.json`, y `writtenDaysFor(...).llegadas`. Solo la Coliseo, los Museos y la Galería tienen bloque; el Free Tour es una reserva pequeña.
2. **«Lo de después de la comida» en las filas de 15:00 y de 17:00**: toda la tarde de la lista va a «Si te sobra tiempo» (también en la de 17:00, donde la tarde es del viajero), sin repetir lo que el viaje ya ha visto ni lo que iba «de camino». No hay recorte por minutos.
3. **El bloque y el día del sitio** (el único choque del documento consigo mismo): el documento dice que el Vaticano sin Museos empieza «en San Pedro con la Basílica y las Grutas» y que el bloque de los Museos lleva «la Plaza y la Basílica». Para que nada se repita: el bloque se quita del día del sitio **salvo si con eso su mañana (o su tarde) se quedaba vacía**; entonces el día se queda con lo suyo (la Plaza y la Basílica) y el bloque del día de vuelta no las repite (queda solo la visita reservada). Con el Coliseo y la Galería el bloque sí se quita del día del sitio (el D1 empieza en el Campidoglio; el D4 del lunes se queda sin el parque). → Pregunta 2.
4. **Una reserva pequeña con la fila «solo el traslado»**: el día lleva solo esa parada (`solo_reservas`); no se inventa una mañana. Con una mañana (corta o entera), la reserva entra en ella por su hora.
5. **Una excursión reservada el día de vuelta**: el día es de la excursión (`contenido: "excursion"`): ni mañana ni tarjeta ni resumen; solo el aviso si vuelve tarde. → Pregunta 4.
6. **Sin fechas** no se salta nada (ni el 25 de diciembre, ni Pascua, ni el miércoles): no se sabe qué día es.
7. **Autobús**: la tarjeta del tren dice «Tu autobús sale…» (se cambia la palabra «tren»); el texto es el mismo.
8. **«Aún no lo sé»** (o sin zona): «Desde tu zona (Termini)…» con la mejor opción desde Termini; la frase no lleva los tramos «andando».
9. **Los avisos de reservas**: un sitio sin `entrada_a` dice «Tu reserva de {sitio}»; la duración sale del dato del sitio (`duration_minutes`) y, si no lo tiene, de los minutos por dentro. La excursión sin hora de vuelta avisa solo si es de día entero.
10. **Un día más (23:00 o más) con una reserva grande**: solo su bloque (como la regla general); no se cambia el día entero por el del sitio.
11. **La ruta a mano** conserva los avisos de reservas contra el vuelo (el prompt dice que sí) y nada más.
12. **Con la salida de madrugada**, quitar la nocturna del último día deja libre la imprescindible: las nocturnas de los primeros días pueden cambiar (nunca las paradas). Es el único cambio en los días de ruta.
13. **La tarjeta y la hoja**: con `hoja` («Ya has visto lo mejor de Roma») también sale `tarjeta`, porque el día va sin paradas; así el viajero tiene [Explorar monumentos].
14. **`unplacedEssentials`** (los imprescindibles que «no tienen sitio») cuenta ahora también lo que lleva la mañana de vuelta (es verdad: se ve).

## 8. Textos de invariantes propuestos

(Los números los asigna el cierre; siguen a los del agente de la llegada.)
- **El día de vuelta con horas** (de pago): la hora del billete menos el margen de su punto elige una fila de la tabla del destino; cada fila lleva una lista escrita; ninguna hora de 0:00 a 23:59 se queda sin fila, para ningún punto; nada se redondea.
- **La última mañana** nunca repite lo principal ya visto de día y es la primera de la tabla de mañanas que no lo repite; el 25 de diciembre y el domingo de Pascua no hay Vaticano; el miércoles, ni el Vaticano ni la Cúpula.
- **Solo hay comida en el día de vuelta** con vuelos que dejan la fila «con comida» (17:00 o más desde Fiumicino) o con «un día más»; nunca cena ni nocturna.
- **Con una salida de madrugada** el último día de ruta lleva su cena y no lleva nocturna, y la tarjeta «Hoy vuelves a casa» sale al final de ese día.
- **Una reserva grande el día de vuelta** lleva solo su bloque entero; el día del sitio se queda en su versión sin esa visita y nada se repite ni se pierde; las reservas nunca cambian de hora.
- **Los avisos de reservas y excursiones contra el vuelo** solo llevan horas del viajero o de los datos; la excursión reservada nunca se mueve.
- **La ruta a mano y la gratis**: las horas no recortan ni rehacen ningún día; sin vuelos, los días salen igual que antes.

## 9. Preguntas abiertas (máx. 5)

1. **Listas que no caben** (tabla de la sección 6): con la hora más temprana de su fila, 11 combinaciones de lista y fila se pasan de la hora de salir (las mañanas cortas del Vaticano, la Roma antigua y el Pincio y el Popolo por 3 a 7 min; las de las 15:00 del Vaticano, la Roma antigua y la Cúpula por 67 a 110 min; las de las 17:00 por 17 a 57 min). El motor no recorta nada por minutos (regla de Eric). ¿Se quedan como están (el viajero decide y la app solo avisa) o quieres que el final de esas listas vaya a «Si te sobra tiempo»?
2. **Los Museos reservados el día de vuelta**: el documento pone la Plaza y la Basílica en el bloque **y** en la versión sin Museos del día del Vaticano. He dejado que el día del Vaticano conserve la Plaza y la Basílica (si no, su mañana se quedaba vacía) y que el bloque del día de vuelta sea solo los Museos. ¿Está bien, o prefieres la Plaza y la Basílica en la vuelta y otra mañana para el día del Vaticano?
3. **Una reserva pequeña con un vuelo que solo deja el traslado** (de 5:00 a 13:29): el día lleva solo esa parada. ¿O prefieres una mañana corta con la reserva dentro?
4. **Una excursión reservada el día de vuelta**: el día es de la excursión, sin mañana ni tarjeta, y solo sale el aviso si vuelve tarde. ¿Correcto? (Si vuelve a tiempo y es de medio día, la tarde queda libre en la pantalla.)
5. **Autobús**: «Tu autobús sale de Tiburtina a las…» en lugar de «Tu tren sale…» (el documento dice «tren o autobús: Tu tren…»). ¿Cambio la palabra, como he hecho?

## 10. Pruebas

- **`node scripts/destino/pruebaTanda7_vuelta.mjs`** (nueva, sin servidor; `rapida=1` salta los demás puntos): **53.901 comprobaciones, 0 fallos** (1,5 min). Qué mira: (1) la tabla minuto a minuto para 10 combinaciones de medio y punto; (2) 884 planes con vuelta (de 1 a 7 noches, verano e invierno, con y sin fechas, las 13 horas de frontera con Fiumicino y las equivalentes de los otros 5 puntos), más los 10 viajes con vuelta de la revisión: fila y lista exactas, la última mañana recalculada aparte, la comida, 0 nocturnas repetidas, la madrugada, la tarjeta y los textos (sin empresas, sin taxi, sin horas calculadas) y las comprobaciones de siempre (nada cerrado, sin zigzag, por dentro una sola vez, 0 restaurantes repetidos); (3) 25 de diciembre, domingo de Pascua y miércoles; (4) el Coliseo, los Museos y la Galería reservados el día de vuelta (a dos horas, cinco vuelos, tres días de la semana), dos reservas grandes, una reserva pequeña, el Free Tour, la Galería sin su día en el viaje; (5) los avisos, palabra por palabra, con tren y barco, la excursión de día y de medio día, la madrugada; (6) la ruta a mano, la gratis y sin vuelos contra el motor de antes (`git show cf67f11`), una sola fecha; (7) el servidor (`buildDayBlockV3`); (8) cada una de las 10 listas forzada a salir la primera, con la hora más temprana de su fila (la sección 6). Cobertura: 408 planes sin paradas, 360 con mañana, 68 con un día más, 48 con la hoja, 136 de madrugada, 456 tarjetas.
- **Las afectadas, a 0 fallos** (las de solo motor en paralelo, las de SSR en serie, servidor propio en el 8892): `pruebaFase6y4_listas` (643), `6y6_cierre`, `6y7_motor` partes 1 a 3, `6y8_comida` (53.559 comprobaciones), `6y9_freetour`, `6y10_viajes`, `6y10_comida`, `pruebaTanda6h`, `6i`, `6j`, `6k`, `6l`, `6o`, `6r`, `6u`, `6z6`; las de SSR `6s`, `6t`, `6v`, `6x_franjas`, `6z`, `6z2`, `6z3`, `6z3_dias`, `6z5`, `6z6a` a `6z6d`; `pruebaTanda7_documento` (420) y `pruebaTanda7_datosllegada`. **Menos `6g`** (ver más abajo).
- **Muestra de 54 fechas con `pruebaListas`** (festivos, domingos, lunes, miércoles, Navidad, Semana Santa, agosto, los cambios de hora): **119.673 viajes, 324.948 días, 0 fallos** (857 s), las mismas cifras que antes de mi parte.
- `npx tsc --noEmit -p tsconfig.app.json`: limpio (no he tocado TypeScript)
- Petición real a la API (`/api/rebuild-day` con la vuelta, servidor propio en el 8892): 200 con `is_return_leg` y `return_day`, sin 500.
- `pruebaTanda6g` sigue en 3.278 fallos (`d6_de_camino` 2.190, `d6_ya_visitado` 1.087, `etiqueta_roja` 1), los mismos que antes de mi parte: la regla nueva de los imprescindibles la deja obsoleta y la actualiza el agente F (no la he tocado). Compruebo lo contrario de la regla nueva en `pruebaTanda7_documento` (ningún imprescindible «de camino»).
- Las 365 fechas no se han lanzado (como pedía el prompt).
