# Informe parte DATOS DE LLEGADA Y VUELTA — Tanda 7 (agente B), 13-oct-2026

Todo en palabras sencillas. Sin push. Commits locales.

## 1. Qué se ha cambiado

- `data/dias/roma/_llegada.json`:
  - El taxi sigue en los datos pero lleva `no_enseñar: true` (5 opciones y 1 consejo de la vuelta). Se quita «El taxi de Ciampino sale más barato». «Nadie te lleva en coche…» ahora es «Nadie te espera sin reserva» con el texto de Eric.
  - Fuera los nombres de empresas de todo lo que se enseña (Terravision, Rome Airport Bus, ATRAL, Portlink, KiPoint, KiBag, Tibus, «la app de Trenitalia»). Los autobuses quedan como «Autobús a Termini (andén 18)» y «(andén 19)» en Fiumicino y «(opción 1)» y «(opción 2)» en Ciampino. Las URL siguen en los campos `fuente`, que no se enseñan.
  - «Cómo llegar al centro desde tu punto de entrada en Roma» → «Cómo llegar a tu alojamiento desde tu punto de llegada». Quitado «centro» de nuestras frases; quedan los datos reales («32 km al centro», «ZTL del centro histórico»).
  - `maleta` y `ultima_tarde` con los textos del punto 9 (la consigna con su sitio, horario y precio en datos, sin empresa).
  - El punto `tibus` ya existía; ahora se llama «Estación de autobuses de Tiburtina» (sin «Tibus»).
  - Secciones nuevas: `lugares`, `tramos` (25 tramos con medio, de→a, precio, tiempo, fuente y fecha) y `para_tu_zona` (la tabla de Eric: 6 zonas × 5 columnas = 30 celdas, más `zona_sin_saber`, `nota_otro_billete`, `traslado_privado` y `descartadas`).
- `shared/arrival/paraTuZona.js` (función pura, sin textos de pantalla) y `soloLoQueSeEnseña` en `shared/arrival/arrivalRules.js`. El servidor (`arrivalInfoFor`, `server/engine/writtenDays.js`) y `scripts/destino/llegadas.mjs` quitan lo marcado `no_enseñar` antes de servirlo.
- Cadenas triviales: `src/lib/mockDayDetail.ts` (frase del «centro» y «(Trenitalia)»); `src/lib/arrivalReturn.ts` (el respaldo sin taxi; tipos nuevos opcionales).
- Prueba nueva: `scripts/destino/pruebaTanda7_datosllegada.mjs` (0 fallos; con `--fronteras` escribe la tabla de abajo en `docs/dias/_fronteras_tmp.md`, que no se sube).
- Pasan a 0 fallos, en serie y con servidor propio en el 8882: 6t (1054), 6s (2511), 6y10_ficha (299), 6y4_ficha (124), 6y4_reservas (117), 6z3 (30059), 6y2_reservas (128). `npx tsc --noEmit -p tsconfig.app.json` limpio. No se han lanzado las 365 fechas.

## 2. Estructura de los datos y la función

- `tramos[id]` = `{ id, medio, nombre, de, a, a_id?, precio?, tiempo?, detalle?, nota?, nota_parada?, fuente, comprobado, horario? }`. Donde no hay dato de tiempo o precio, el campo no existe (no se inventa).
- `tramos[id].horario.ida` (de→a) y `.vuelta` (a→de) = `{ tramos_de_fechas: [{ from, to, anio?, primero, ultimo }], texto_tarde?, texto_pronto?, fuente, comprobado }`. `from`/`to` usan el formato de `openingHours.js` (`"06-14"`, `ultimo_domingo:10`…) y se comparan con `dateInTramo`; sin `from`/`to` vale todo el año; `anio` hace que solo valga ese año. Un `ultimo` menor que `primero` pasa la medianoche (autobús de Termini a Fiumicino, último a la 1:00).
- `para_tu_zona.zonas[zona][columna]` = lista ORDENADA de opciones `{ id, tramos: [ids], pasa_por_termini, otro_billete_desde? }`. La primera es «Tu mejor opción». `columnas` dice qué puntos van a cada columna (`fco`, `cia`, `termini`, `tiburtina` = tren y `tibus`, `civitavecchia`) y cuál es el servicio de referencia de la hora (`leonardo_express` en Fiumicino).
- `pasa_por_termini`: Termini es parada intermedia (texto 3 del resumen). La opción que solo llega a Termini (zona Termini) no lo marca, porque no hay «desde allí».
- Función: `paraTuZona(info, { zona, puntoId, hora, fecha, mes, anio, sentido: 'llegada'|'vuelta', margenMin })` → `{ columna, zona, sinZona, quitarDelResumen, avisoSinZona, modo: 'normal'|'noche', aviso, horarioConocido, mejor, otras, sinOtras }`.
  - `mejor` es `{ tipo: 'opcion', tramos… }` o `{ tipo: 'traslado_privado' }` (de noche). `otras` solo lleva lo que sigue funcionando; en modo noche, solo opciones con TODOS los tramos con horario conocido y cumplido.
  - Para `nose` («Aún no lo sé») usa la zona Termini y devuelve `quitarDelResumen: [2, 3]`.
  - A la vuelta lee los tramos al revés y con el horario `vuelta`. La hora que se le pasa a la vuelta es la de SALIR de su zona (vuelo − margen, de `leaveMinutesOf`); se usa por dentro y no se enseña.
  - Sin fecha, mira el día 15 del mes dado (año 2026 si no se dice). Sin fecha ni mes, o fuera del tramo, no se aplica (`horarioConocido: false`).

## 3. Fuentes (consultadas el 13-oct-2026)

- Leonardo Express desde el aeropuerto: primero 5:38, último 23:23, del 14-jun al 12-dic de 2026 (PDF oficial de Trenitalia, ya apuntado el 30-sep). La página general de Trenitalia dice 23:27 sin fechas; se usa el PDF, que tiene el tramo de fechas (pregunta 2).
- Leonardo Express desde Termini: primero 4:50, último 23:05 (página oficial del Leonardo Express; no dice hasta cuándo vale).
- Autobús andén 19 de Fiumicino: de Fiumicino a Termini 6:00–23:55; de Termini a Fiumicino 4:30–1:00 (web oficial de la empresa).
- Autobús andén 18 (otra empresa): su web oficial solo dice «cada 20 min», sin primero ni último; no entra en las noches.
- Autobús de Ciampino al metro Anagnina: 1,20 €; su horario publicado (laborables 8:15–22:40; festivos 5:05–23:00) está guardado en `horario_publicado_sin_usar`, sin usar porque la web lo data en octubre de 2024. Autobús de Ciampino a Termini (3:30–23:20, sin precio en la web, publicado desde 2022): no entra.
- Regional de Civitavecchia: la web de Trenitalia no lista las paradas por tren; las de Roma San Pietro, Trastevere, Ostiense y Termini se vieron en un tren de ejemplo (e656.net, no oficial) y en la guía del puerto. Por eso los tramos a San Pietro y a Trastevere llevan la nota «Mira en tu billete que el tren pare en Roma …».
- FL1: la web de Trenitalia confirma Fiumicino–Tiburtina 48 min y cada 15 min (30 en domingos y festivos); «unos 27 min a Trastevere» y las paradas (Trastevere, Ostiense, Tiburtina; no Termini) son de la nota del documento.
- Tranvía 8: restablecido entero el 21-sep-2026 (nota del documento). Si hay otro corte, será un aviso de fechas, sin tocar la tabla.
- Metro A/B y bus 40/64: línea y parada son de la tabla de Eric; el precio, del billete BIT de ATAC (1,50 €, 100 min). Ningún tiempo.
- Traslado privado: sin precio y sin proveedor (`para_tu_zona.traslado_privado`); ningún punto de `_llegada.json` lleva dato de traslado (el enlace lo pone la pestaña Traslado de la app). Comprobado.

## 4. Lo que NO tiene dato (Eric debe darlo)

- Primer y último horario de: Ciampino (Airlink y autobuses), Tiburtina (FL1 y metro B), Civitavecchia (regional), FL1 desde Fiumicino (lo único que sirve a Trastevere), metro A/B, bus 40/64 y tranvía 8. Por eso, de noche, esas opciones NO salen en «Otras opciones»; y en Ciampino, Tiburtina y Civitavecchia nunca se activa el modo noche.
- Fuera del 14-jun a 12-dic de 2026 (invierno, otros años, viajes de 2027): sin dato del Leonardo Express; no se aplica la regla de noche. Hace falta el horario de invierno 2026-27.
- Autobuses nocturnos del aeropuerto a Roma: la única fuente es un PDF de Cotral sin fecha, citado por una web no oficial (desde Tiburtina 0:30, 1:15, 2:30, 3:45; desde el aeropuerto 1:15, 2:15, 3:30, 5:00); la web oficial de Cotral no lo tiene a mano. No entra.
- Nocturnos de la ciudad (líneas «n»): ATAC bloquea las consultas automáticas y su comunicado del 17-jul-2026 solo nombra nMA (Anagnina–Battistini), nMB (Rebibbia–Laurentina), nMB1 (Termini–Viale Ionio) y nMC (Piazza Venezia–Pantano), sin paradas ni horas. Sin las paradas (Spagna, Ottaviano, Cavour, Trastevere) no entra nada. Eric debe dar qué línea n lleva a cada zona y sus horas.
- Autobús de Fiumicino a Via Crescenzio / Piazza Adriana (Prati): la web oficial dice que hay servicio directo con parada en Via Crescenzio, sin precio ni tiempo (los 7 € y 40 min son de webs no oficiales). Fuera de la tabla, en `descartadas`.

## 5. Frases con «centro» y taxi/empresas en pantallas (para el agente de pantallas)

- `src/components/route/dayDetail/ArrivalReturnSheet.tsx` líneas 277-278: «De {punto} al centro» y «Del centro a {punto}» (títulos de sección). Línea 310: «…al centro de la ciudad o a la puerta de tu alojamiento» (texto de Traslados).
- `src/lib/mockDayDetail.ts` línea 133: «Tren/autobús directo al centro» (respaldo de destinos sin datos). Las líneas 93, 114 y 130 («32 km al centro»…) son datos reales.
- `src/components/route/dayDetail/ArrivalDetailSheet.tsx` líneas 259-260: pantalla vieja que enseña «Taxi» con `taxiPriceLabel` (campos `taxiPriceLabel` en `mockDayDetail.ts`, líneas 60-141). Debe salir.
- `ArrivalReturnSheet` pinta `point.al_centro`/`a_la_salida` tal cual; el taxi ya no llega (el servidor lo quita). «Para tu zona» aún no está pintado: lo lee `paraTuZona`.
- Ya cambiadas por mí (cadenas): subtítulo de `mockDayDetail.ts` («Cómo llegar a tu alojamiento desde tu punto de llegada») y «(Trenitalia)» → «del tren».

## 6. Decidido por Code

- Los dos autobuses de Fiumicino y los dos de Ciampino se quedan como opciones separadas (andén 18 y 19; opción 1 y 2), porque tienen precio y tiempo distintos y la tabla de Eric solo dice «autobús a Termini». El de menor precio va primero.
- Texto de «a primera hora»: «A esta hora aún no hay tren: el primer Leonardo Express sale del aeropuerto a las 5:38.» (analogo al de Eric). A la vuelta: «…el último Leonardo Express sale de Termini a las 23:05.» y «…el primero sale de Termini a las 4:50.»
- La hora de comparar es la hora exacta que pasa el viajero (aterrizar 23:23 todavía coge el último); `margenMin` (por defecto 0) permite exigir un margen para llegar al tren. No se ha activado.
- Modo noche solo cuando el servicio de referencia de la columna (Leonardo en Fiumicino) tiene horario conocido para esa fecha y la hora cae fuera.
- Civitavecchia: las opciones empiezan en la estación (como la tabla de Eric); no se ha añadido la lanzadera del puerto como primer tramo.
- Márgenes: los de hoy (`al_centro_min` y `salir_antes_min`) ya coinciden con el punto 5 en los 6 puntos (libre: 1:30, 1:20, 0:45, 0:55, 0:55, 2:30; salir: 3:00, 2:50, 0:45, 0:55, 0:55, 3:50). No se cambió nada. Lo comprueba la prueba.
- Coche: los consejos de la ZTL conservan «centro histórico» (nombre real de la zona); «no en el centro» pasó a «no dentro de la ZTL».
- El tranvía 8 desde el bus 40/64 sale de Largo di Torre Argentina (`tranvia_8_desde_argentina`); desde el tren, de la estación de Roma Trastevere.

## 7. Preguntas abiertas (máximo 5)

1. Autobús de Fiumicino a Prati (Via Crescenzio): ¿lo confirmas con precio y tiempo oficiales para meterlo en la tabla, o se queda fuera?
2. Leonardo Express: el PDF dice último 23:23 y la página general dice 23:27. Se usa 23:23 (el que lleva fechas). ¿Correcto?
3. ¿Quieres que los horarios de Ciampino (3:30–23:20 a Termini; Anagnina) entren cuando confirmes que siguen vigentes? La web los data en 2022 y 2024.
4. Nocturnos: ¿me das las líneas «n» de cada zona con sus horas, y los autobuses nocturnos del aeropuerto con fuente oficial? Sin eso, de noche solo salen el Leonardo (en horario de verano) y el autobús andén 19.
5. Horario de invierno del Leonardo Express (a partir del 13-dic-2026): ¿lo pasas tú cuando salga?

## 8. Tablas de fronteras (punto 5), para TODOS los puntos

La hora de llegada es la que pone el viajero; «libre» y «salir» son internas y nunca se enseñan. Las filas son las de los puntos 6 y 9 del documento. Para «sin punto» se usa el del medio con el traslado más largo (avión, Fiumicino; tren, Tiburtina; autobús, estación de autobuses de Tiburtina; barco, Civitavecchia). En invierno, la fila «D1 pasa al día 2» empieza a las 13:00 de «libre»: en Fiumicino, llegar a las 11:30.

### Fronteras de la llegada (hora de llegada ↔ «libre»)

**Fiumicino** — libre = llegada + 1:30

| Libre a las… | Llegas (hora de aterrizar o de llegada) |
|---|---|
| (llegada de 0:00 a 4:59) | un día entero normal: de 0:00 a 4:59 |
| antes de las 10:00 | de 5:00 a 8:29 |
| de 10:00 a 11:59 | de 8:30 a 10:29 |
| de 12:00 a 13:59 (en invierno, de 12:00 a 12:59) | de 10:30 a 12:29 · en invierno el corte es a las 13:00 (llegada 11:30) |
| de 14:00 a 14:59 | de 12:30 a 13:29 |
| de 15:00 a 18:59 | de 13:30 a 17:29 |
| de 19:00 a 20:29 | de 17:30 a 18:59 |
| de 20:30 a 22:59 | de 19:00 a 21:29 |
| a las 23:00 o más tarde | desde las 21:30 (lo que pase de la medianoche sigue siendo el mismo día) |

**Ciampino** — libre = llegada + 1:20

| Libre a las… | Llegas (hora de aterrizar o de llegada) |
|---|---|
| (llegada de 0:00 a 4:59) | un día entero normal: de 0:00 a 4:59 |
| antes de las 10:00 | de 5:00 a 8:39 |
| de 10:00 a 11:59 | de 8:40 a 10:39 |
| de 12:00 a 13:59 (en invierno, de 12:00 a 12:59) | de 10:40 a 12:39 · en invierno el corte es a las 13:00 (llegada 11:40) |
| de 14:00 a 14:59 | de 12:40 a 13:39 |
| de 15:00 a 18:59 | de 13:40 a 17:39 |
| de 19:00 a 20:29 | de 17:40 a 19:09 |
| de 20:30 a 22:59 | de 19:10 a 21:39 |
| a las 23:00 o más tarde | desde las 21:40 (lo que pase de la medianoche sigue siendo el mismo día) |

**Termini** — libre = llegada + 0:45

| Libre a las… | Llegas (hora de aterrizar o de llegada) |
|---|---|
| (llegada de 0:00 a 4:59) | un día entero normal: de 0:00 a 4:59 |
| antes de las 10:00 | de 5:00 a 9:14 |
| de 10:00 a 11:59 | de 9:15 a 11:14 |
| de 12:00 a 13:59 (en invierno, de 12:00 a 12:59) | de 11:15 a 13:14 · en invierno el corte es a las 13:00 (llegada 12:15) |
| de 14:00 a 14:59 | de 13:15 a 14:14 |
| de 15:00 a 18:59 | de 14:15 a 18:14 |
| de 19:00 a 20:29 | de 18:15 a 19:44 |
| de 20:30 a 22:59 | de 19:45 a 22:14 |
| a las 23:00 o más tarde | desde las 22:15 (lo que pase de la medianoche sigue siendo el mismo día) |

**Tiburtina (tren)** — libre = llegada + 0:55

| Libre a las… | Llegas (hora de aterrizar o de llegada) |
|---|---|
| (llegada de 0:00 a 4:59) | un día entero normal: de 0:00 a 4:59 |
| antes de las 10:00 | de 5:00 a 9:04 |
| de 10:00 a 11:59 | de 9:05 a 11:04 |
| de 12:00 a 13:59 (en invierno, de 12:00 a 12:59) | de 11:05 a 13:04 · en invierno el corte es a las 13:00 (llegada 12:05) |
| de 14:00 a 14:59 | de 13:05 a 14:04 |
| de 15:00 a 18:59 | de 14:05 a 18:04 |
| de 19:00 a 20:29 | de 18:05 a 19:34 |
| de 20:30 a 22:59 | de 19:35 a 22:04 |
| a las 23:00 o más tarde | desde las 22:05 (lo que pase de la medianoche sigue siendo el mismo día) |

**Estación de autobuses de Tiburtina** — libre = llegada + 0:55

| Libre a las… | Llegas (hora de aterrizar o de llegada) |
|---|---|
| (llegada de 0:00 a 4:59) | un día entero normal: de 0:00 a 4:59 |
| antes de las 10:00 | de 5:00 a 9:04 |
| de 10:00 a 11:59 | de 9:05 a 11:04 |
| de 12:00 a 13:59 (en invierno, de 12:00 a 12:59) | de 11:05 a 13:04 · en invierno el corte es a las 13:00 (llegada 12:05) |
| de 14:00 a 14:59 | de 13:05 a 14:04 |
| de 15:00 a 18:59 | de 14:05 a 18:04 |
| de 19:00 a 20:29 | de 18:05 a 19:34 |
| de 20:30 a 22:59 | de 19:35 a 22:04 |
| a las 23:00 o más tarde | desde las 22:05 (lo que pase de la medianoche sigue siendo el mismo día) |

**Civitavecchia** — libre = llegada + 2:30

| Libre a las… | Llegas (hora de aterrizar o de llegada) |
|---|---|
| (llegada de 0:00 a 4:59) | un día entero normal: de 0:00 a 4:59 |
| antes de las 10:00 | de 5:00 a 7:29 |
| de 10:00 a 11:59 | de 7:30 a 9:29 |
| de 12:00 a 13:59 (en invierno, de 12:00 a 12:59) | de 9:30 a 11:29 · en invierno el corte es a las 13:00 (llegada 10:30) |
| de 14:00 a 14:59 | de 11:30 a 12:29 |
| de 15:00 a 18:59 | de 12:30 a 16:29 |
| de 19:00 a 20:29 | de 16:30 a 17:59 |
| de 20:30 a 22:59 | de 18:00 a 20:29 |
| a las 23:00 o más tarde | desde las 20:30 (lo que pase de la medianoche sigue siendo el mismo día) |

### Fronteras de la vuelta (hora del vuelo, tren, autobús o barco ↔ salir = hora − margen)

Las filas del documento son las de Fiumicino (margen 3:00). Para los demás puntos se conserva la misma hora de SALIR; la hora de salida del medio es salir + el margen del punto.

**Fiumicino** — margen 3:00

| Fila | Salida (vuelo / tren / barco) |
|---|---|
| cuenta como la noche de antes (solo el traslado) | de 0:00 a 4:59 |
| de 5:00 a 8:59 (solo el traslado) | de 5:00 a 8:59 |
| de 9:00 a 13:29 (solo el traslado) | de 9:00 a 13:29 |
| de 13:30 a 14:59 (mañana corta, sin comida) | de 13:30 a 14:59 |
| de 15:00 a 16:59 (última mañana entera, sin comida) | de 15:00 a 16:59 |
| de 17:00 a 22:59 (última mañana con comida y tarde libre) | de 17:00 a 22:59 |
| a las 23:00 o más tarde (un día más entero) | desde las 23:00 |

**Ciampino** — margen 2:50

| Fila | Salida (vuelo / tren / barco) |
|---|---|
| cuenta como la noche de antes (solo el traslado) | de 0:00 a 4:49 |
| de 5:00 a 8:59 (solo el traslado) | de 4:50 a 8:49 |
| de 9:00 a 13:29 (solo el traslado) | de 8:50 a 13:19 |
| de 13:30 a 14:59 (mañana corta, sin comida) | de 13:20 a 14:49 |
| de 15:00 a 16:59 (última mañana entera, sin comida) | de 14:50 a 16:49 |
| de 17:00 a 22:59 (última mañana con comida y tarde libre) | de 16:50 a 22:49 |
| a las 23:00 o más tarde (un día más entero) | desde las 22:50 |

**Termini** — margen 0:45

| Fila | Salida (vuelo / tren / barco) |
|---|---|
| cuenta como la noche de antes (solo el traslado) | de 0:00 a 2:44 |
| de 5:00 a 8:59 (solo el traslado) | de 2:45 a 6:44 |
| de 9:00 a 13:29 (solo el traslado) | de 6:45 a 11:14 |
| de 13:30 a 14:59 (mañana corta, sin comida) | de 11:15 a 12:44 |
| de 15:00 a 16:59 (última mañana entera, sin comida) | de 12:45 a 14:44 |
| de 17:00 a 22:59 (última mañana con comida y tarde libre) | de 14:45 a 20:44 |
| a las 23:00 o más tarde (un día más entero) | desde las 20:45 |

**Tiburtina (tren)** — margen 0:55

| Fila | Salida (vuelo / tren / barco) |
|---|---|
| cuenta como la noche de antes (solo el traslado) | de 0:00 a 2:54 |
| de 5:00 a 8:59 (solo el traslado) | de 2:55 a 6:54 |
| de 9:00 a 13:29 (solo el traslado) | de 6:55 a 11:24 |
| de 13:30 a 14:59 (mañana corta, sin comida) | de 11:25 a 12:54 |
| de 15:00 a 16:59 (última mañana entera, sin comida) | de 12:55 a 14:54 |
| de 17:00 a 22:59 (última mañana con comida y tarde libre) | de 14:55 a 20:54 |
| a las 23:00 o más tarde (un día más entero) | desde las 20:55 |

**Estación de autobuses de Tiburtina** — margen 0:55

| Fila | Salida (vuelo / tren / barco) |
|---|---|
| cuenta como la noche de antes (solo el traslado) | de 0:00 a 2:54 |
| de 5:00 a 8:59 (solo el traslado) | de 2:55 a 6:54 |
| de 9:00 a 13:29 (solo el traslado) | de 6:55 a 11:24 |
| de 13:30 a 14:59 (mañana corta, sin comida) | de 11:25 a 12:54 |
| de 15:00 a 16:59 (última mañana entera, sin comida) | de 12:55 a 14:54 |
| de 17:00 a 22:59 (última mañana con comida y tarde libre) | de 14:55 a 20:54 |
| a las 23:00 o más tarde (un día más entero) | desde las 20:55 |

**Civitavecchia** — margen 3:50

| Fila | Salida (vuelo / tren / barco) |
|---|---|
| cuenta como la noche de antes (solo el traslado) | de 0:00 a 5:49 |
| de 5:00 a 8:59 (solo el traslado) | de 5:50 a 9:49 |
| de 9:00 a 13:29 (solo el traslado) | de 9:50 a 14:19 |
| de 13:30 a 14:59 (mañana corta, sin comida) | de 14:20 a 15:49 |
| de 15:00 a 16:59 (última mañana entera, sin comida) | de 15:50 a 17:49 |
| de 17:00 a 22:59 (última mañana con comida y tarde libre) | de 17:50 a 23:49 |
| a las 23:00 o más tarde (un día más entero) | desde las 23:50 |
