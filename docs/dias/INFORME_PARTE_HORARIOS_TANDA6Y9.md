# Informe de la parte de horarios reales por fechas (Tanda 6y9, agente A)

En palabras sencillas: los horarios de Roma ya no van por «cuatro estaciones» sino por **tramos de fechas tal como los publica cada web oficial**, y valen para cualquier año («desde el último domingo de marzo»). Una sola función dice a qué hora abre y cierra un sitio en una fecha, y la usan el motor de rutas, la rueda de la hora, la ficha y las pruebas.

## Lo que había de verdad (y lo que no)

Antes de tocar nada miré cómo estaba. El motor **ya leía** un campo `by_period` (tramos con fecha fija) por delante de `by_season`, y para el Coliseo y el Foro ya traía el tramo correcto de octubre (1-24 oct, 08:30-18:30, última entrada 17:30). Lo que sí estaba mal o a medias:

1. Los cambios de hora estaban escritos como fechas fijas de 2026 (`03-29`, `10-25`): en 2027 el cambio de octubre es el 31, y del 25 al 30 de octubre de 2027 el Coliseo habría salido con el horario de invierno (cierre a las 16:30, última entrada 15:30) estando en realidad abierto hasta las 18:30. Era justo el «error gravísimo» que vio Eric, pero para cualquier año que no fuera 2026.
2. Seguían las 4 estaciones (`by_season`) y la última entrada por estación en 11 sitios: eran el «otoño 16:30 / 15:30» que sale cuando alguien lee el dato sin fecha.
3. La ficha ampliada (`data/pipeline_v2/detalle/roma/*.json`) llevaba los tramos escritos a mano, otra vez, con fechas fijas.
4. El 29 de febrero de un año bisiesto se quedaba **sin ningún horario** en 3 sitios (los tramos acababan el 28 de feb).
5. No había una función única para la rueda: el cálculo estaba suelto dentro de `horasDeEntrada` en el servidor.

Con un viaje de octubre de 2026 (y 2027 y 2028) y el Foro reservado a las 15:30, 16:00, 16:30 y 17:00, el Foro sale por dentro y nunca «por fuera» mientras sigue abierto (prueba nueva). El motor ya no cree que cierre a las 16:30 en octubre.

## El formato de tramos (para cualquier destino)

`by_period` es una lista de tramos que cubre el año entero. Cada tramo: `{ from, to, windows, last_entry }`.

- `from` y `to` son `MM-DD` (fecha fija, ambos días incluidos; un tramo puede cruzar el año) o relativos al **último día de la semana de un mes**: `ultimo_domingo:3` (el cambio de hora de marzo), `ultimo_domingo:10` (el de octubre) y con desplazamiento en días: `ultimo_domingo:10-1` (la víspera), `ultimo_domingo:10+1` (el día siguiente).
- Los tramos que acaban en febrero acaban el `02-29` (vale en años bisiestos y no).
- Una sola función los evalúa: `periodFor` / `dateInTramo` / `tramoDateToMd` en `shared/routeEngine/openingHours.js`. Nadie más compara fechas de tramos.
- Cada sitio con tramos lleva en `hours_audit`: `fuente` (URL), `fecha` (la comprobación anterior, 2026-09-25 o 29/30-sep) y `comprobado_web` (lo que se pudo ver el 2026-10-12 y qué falta).

Nota sobre «último sábado de octubre»: la web dice que el tramo de octubre acaba **la víspera del cambio de hora** (en 2026, el sábado 24), que **no** es el último sábado del mes (el 31). Lo escribí como `ultimo_domingo:10-1`, que es lo que dice la web oficial.

## Funciones nuevas (para pantallas, agente C)

Fichero: `shared/routeEngine/horarioDeLaFecha.js` (módulo puro, vale en servidor y en el navegador).

- `horarioDeLaFecha(sitio, fecha|null, mes|null)` → `{ cerrado, conFecha, fecha, abre, cierra, ultimaEntrada, ventanas:[{desde,hasta}], tramo:{desde,hasta,texto,abre,cierra,ultimaEntrada}|null, fuente, comprobado }`. Con fecha (`'2026-10-15'`) usa ese día; sin fecha usa el día 15 del `mes` (0-11) del viajero. `ventanas` va de la apertura a la **última entrada oficial** (es lo que debe cubrir la rueda). `sitio` es el lugar del destino (o su `hours_data`, que ya incluye `by_period`).
- `turnosDeReserva(sitio, fecha|null, mes|null)` → `{ tipo:'turnos'|'franja_libre', turnos:[…]|null, paso, ventanas, cerrado, aviso, nota }`. `tipo:'turnos'`: solo esas horas (Galería Borghese, Free Tour). `tipo:'franja_libre'`: la rueda de la apertura a la última entrada cada `paso` min (15). `aviso` = «Recuerda revisar la disponibilidad antes de añadirlo a tu ruta» (también exportado como `AVISO_DISPONIBILIDAD`).
- `periodosParaFicha(sitio)` → los tramos ya escritos para la ficha («Desde el último domingo de marzo hasta el 30 de septiembre»). El servidor los pone en `schedule.periods` de la ficha al cargarla (`loadPlaceDetail`), así que el texto de la ficha sale de los mismos datos que el motor.
- `tramoEnPalabras(tramo)`, `extremoEnPalabras(token)`.

**El endpoint de la rueda** `POST /api/reservation-hours` (sin cambiar su forma de llamarlo) ahora delega en estas funciones y devuelve además `tramo` y `aviso`; para el **Free Tour** (`place: "Free Tour por Roma"`) devuelve `turnos` con sus 6 horas (10:00, 12:00, 15:00, 17:00, 19:00, 21:00) y `ventanas: []`. La pantalla actual (`AddReservationSheet.tsx`) ya pinta `ventanas` de apertura a última entrada, así que en octubre llega a las 17:30 sin tocarla; lo que le falta a C es pintar `aviso` y, si quiere, leer las 6 horas del Free Tour del endpoint en vez de su lista fija `FREE_TOUR_HOURS` (que sigue con 5 horas). No toqué `src/components`.

## Sitios con tramos: fuente y comprobación

Las webs oficiales **no se podían abrir desde esta máquina** (la conexión a colosseo.it, etc. se rechaza); solo funcionaba el buscador, que devuelve el texto de sus páginas. Lo que coincide con la web oficial según el buscador lo dejé anotado con fecha 2026-10-12; lo demás vale la comprobación anterior del 25-30 de septiembre y está marcado «sin verificar de nuevo».

### Coliseo
- Fuente: https://colosseo.it/orari-e-biglietti/
- Comprobado: 2026-09-25 · y el 2026-10-12: Buscador (páginas de colosseo.it), 2026-10-12: 29 mar–30 sep 08:30-19:15 (última entrada 18:15); 1–24 oct 08:30-18:30 (17:30); 25 oct 2026–28 feb 2027 08:30-16:30 (15:30). Cierra 25 dic y 1 ene. Febrero y marzo de 2027, sin publicar: se usa el patrón de otros años. (confianza: alta (marzo 1-28: media))
- desde el último domingo de octubre hasta el final de febrero (`ultimo_domingo:10` → `02-29`): 08:30-16:30, última entrada 15:30
- desde el 1 de marzo hasta el 15 de marzo (`03-01` → `03-15`): 08:30-17:00, última entrada 16:00
- desde el 16 de marzo hasta la víspera del último domingo de marzo (`03-16` → `ultimo_domingo:3-1`): 08:30-17:30, última entrada 16:30
- desde el último domingo de marzo hasta el 30 de septiembre (`ultimo_domingo:3` → `09-30`): 08:30-19:15, última entrada 18:15
- desde el 1 de octubre hasta la víspera del último domingo de octubre (`10-01` → `ultimo_domingo:10-1`): 08:30-18:30, última entrada 17:30

### Foro Romano y Palatino
- Fuente: https://colosseo.it/orari-e-biglietti/
- Comprobado: 2026-09-25 · y el 2026-10-12: Buscador (páginas de colosseo.it), 2026-10-12: mismo calendario que el Coliseo, abriendo a las 09:00. 1–24 oct 09:00-18:30 (17:30); 25 oct–28 feb 09:00-16:30 (15:30). (confianza: alta (marzo 1-28: media))
- desde el último domingo de octubre hasta el final de febrero (`ultimo_domingo:10` → `02-29`): 09:00-16:30, última entrada 15:30
- desde el 1 de marzo hasta el 15 de marzo (`03-01` → `03-15`): 09:00-17:00, última entrada 16:00
- desde el 16 de marzo hasta la víspera del último domingo de marzo (`03-16` → `ultimo_domingo:3-1`): 09:00-17:30, última entrada 16:30
- desde el último domingo de marzo hasta el 30 de septiembre (`ultimo_domingo:3` → `09-30`): 09:00-19:15, última entrada 18:15
- desde el 1 de octubre hasta la víspera del último domingo de octubre (`10-01` → `ultimo_domingo:10-1`): 09:00-18:30, última entrada 17:30

### Basílica de San Pedro
- Fuente: https://www.basilicasanpietro.va/en/news/new-opening-hours-for-st-peters-basilica («From 1 June 2026 … open from 7:00 a.m. to 8:00 p.m. Last entry will be permitted by 7:15 p.m., subject to visitor flow and waiting times for security checks») y https://www.basilicasanpietro.va/it/orari
- Comprobado: 2026-09-30 (confianza: alta)
- desde el 1 de enero hasta el 31 de diciembre (`01-01` → `12-31`): 07:00-20:00, última entrada 19:15

### Parque de Villa Borghese
- Fuente: https://www.comune.roma.it/web/it/informazione-di-servizio.page?contentId=IDS1431373 (Roma Capitale: apertura de las verjas 06:30-08:30; cierre 17:00-19:00 de noviembre a febrero, 19:00-21:00 en marzo-abril y septiembre-octubre, 20:00-22:00 de mayo a agosto; acceso libre todos los días)
- Comprobado: 2026-09-29 (confianza: alta)
- desde el 1 de enero hasta el final de febrero (`01-01` → `02-29`): 06:30-19:00
- desde el 1 de marzo hasta el 30 de abril (`03-01` → `04-30`): 06:30-21:00
- desde el 1 de mayo hasta el 31 de agosto (`05-01` → `08-31`): 06:30-22:00
- desde el 1 de septiembre hasta el 31 de octubre (`09-01` → `10-31`): 06:30-21:00
- desde el 1 de noviembre hasta el 31 de diciembre (`11-01` → `12-31`): 06:30-19:00

### Bioparque de Roma
- Fuente: https://ecommerce.bioparco.it/regolamento-orari.php
- Comprobado: 2026-09-25 · y el 2026-10-12: La web oficial no se pudo abrir el 2026-10-12: vale la comprobación del 2026-09-25 y el cambio de hora se calcula (último domingo de marzo/octubre). Sin verificar de nuevo. (confianza: media)
- desde el último domingo de octubre hasta la víspera del último domingo de marzo (`ultimo_domingo:10` → `ultimo_domingo:3-1`): 09:30-17:00, última entrada 16:00
- desde el último domingo de marzo hasta la víspera del último domingo de octubre (`ultimo_domingo:3` → `ultimo_domingo:10-1`): 09:30-18:00, última entrada 17:00

### Cúpula de San Pedro
- Fuente: https://www.basilicasanpietro.va/it/orari
- Comprobado: 2026-09-25 · y el 2026-10-12: La web oficial no se pudo abrir el 2026-10-12: vale la comprobación del 2026-09-25 y el cambio de hora se calcula (último domingo de marzo/octubre). Sin verificar de nuevo. (confianza: alta)
- desde el último domingo de marzo hasta el último domingo de octubre (`ultimo_domingo:3` → `ultimo_domingo:10`): 07:00-18:00
- desde el día siguiente al último domingo de octubre hasta la víspera del último domingo de marzo (`ultimo_domingo:10+1` → `ultimo_domingo:3-1`): 07:30-17:00

### Iglesia del Gesù
- Fuente: https://www.turismoroma.it/it/luoghi/chiesa-del-ges%C3%B9 (Roma Capitale)
- Comprobado: 2026-10-12 (confianza: media)
- desde el 1 de octubre hasta el 30 de junio (`10-01` → `06-30`): 07:30-12:30 y 16:30-19:30
- desde el 1 de julio hasta el 30 de septiembre (`07-01` → `09-30`): 07:30-12:00 y 17:00-19:30

### Iglesia de San Pietro in Vincoli
- Fuente: https://www.oraridiapertura24.it/filiale/Roma-Basilica%20di%20San%20Pietro%20in%20Vincoli%20%28Aprile-Settembre%29-3904931U.html
- Comprobado: 2026-09-25 (confianza: media)
- desde el 1 de abril hasta el 30 de septiembre (`04-01` → `09-30`): 08:00-12:30 y 15:00-19:00
- desde el 1 de octubre hasta el 31 de marzo (`10-01` → `03-31`): 08:00-12:30 y 15:00-18:00

### Termas de Caracalla
- Fuente: https://cultura.gov.it/index.php/luogo/terme-di-caracalla (horario actual de septiembre y cierre del lunes) + https://www.10cose.it/roma/le-terme-di-caracalla-a-roma (calendario completo)
- Comprobado: 2026-09-25 · y el 2026-10-12: La web oficial no se pudo abrir el 2026-10-12: vale la comprobación del 2026-09-25 y el cambio de hora se calcula (último domingo de marzo/octubre). Sin verificar de nuevo. (confianza: media)
- desde el día siguiente al último domingo de octubre hasta el final de febrero (`ultimo_domingo:10+1` → `02-29`): 09:00-16:30, última entrada 15:30
- desde el 1 de marzo hasta la víspera del último domingo de marzo (`03-01` → `ultimo_domingo:3-1`): 09:00-17:30, última entrada 16:30
- desde el último domingo de marzo hasta el 31 de agosto (`ultimo_domingo:3` → `08-31`): 09:00-19:15, última entrada 18:15
- desde el 1 de septiembre hasta el 30 de septiembre (`09-01` → `09-30`): 09:00-19:00, última entrada 18:00
- desde el 1 de octubre hasta el último domingo de octubre (`10-01` → `ultimo_domingo:10`): 09:00-18:30, última entrada 17:30

### Jardín de los Naranjos
- Fuente: https://www.turismoroma.it/en/places/savello-park-or-orange-garden
- Comprobado: 2026-09-25 (confianza: alta)
- desde el 1 de octubre hasta el final de febrero (`10-01` → `02-29`): 07:00-18:00
- desde el 1 de marzo hasta el 31 de marzo (`03-01` → `03-31`): 07:00-20:00
- desde el 1 de abril hasta el 31 de agosto (`04-01` → `08-31`): 07:00-21:00
- desde el 1 de septiembre hasta el 30 de septiembre (`09-01` → `09-30`): 07:00-20:00

### Iglesia de Santa Maria in Trastevere
- Fuente: https://turismoroma.it/it/luoghi/basilica-di-santa-maria-trastevere (Roma Capitale)
- Comprobado: 2026-10-12 (confianza: media)
- desde el 1 de enero hasta el 31 de julio (`01-01` → `07-31`): 07:30-21:00
- desde el 1 de agosto hasta el 31 de agosto (`08-01` → `08-31`): 08:00-12:00 y 16:00-21:00
- desde el 1 de septiembre hasta el 31 de diciembre (`09-01` → `12-31`): 07:30-21:00


## Lo que NO se pudo verificar (y la hora prudente que puse)

| Sitio | Qué falta | Qué dejé |
|---|---|---|
| Coliseo y Foro, febrero y marzo de 2027 | La web solo publica hasta el 28 feb 2027. Marzo 1-15 (17:00) y 16 mar-víspera del cambio (17:30) siguen el patrón de otros años | Lo que ya había (las horas más prudentes de cada tramo) |
| Coliseo y Foro, septiembre | Eric pensaba en septiembre aparte; el buscador devuelve de la web oficial «29 mar-30 sep, cierre 19:15, última entrada 18:15» | Un solo tramo hasta el 30 sep (como la web oficial) |
| Museos Vaticanos, lunes a sábado | Solo se confirmó el último domingo (09:00-14:00, última 12:30). Entre semana una web no oficial dice 08:00-20:00 con entradas hasta las 18:00, otra 9:00-18:00 | Lo que había: 08:00-20:00, última entrada 18:00 (anotado «sin verificar de nuevo») |
| Panteón, turnos | El Ministerio dice «por orden de llegada»; una guía dice que se compra con hora. La web oficial del Capítulo no se abrió | Franja libre cada 15 min de 09:00 a la última entrada (18:30), marcado SIN VERIFICAR en `reserva_nota` |
| Galería Borghese, turnos | Horario 09:00-19:00 con última entrada 17:45 confirmado (cultura.gov.it). Los turnos (cada hora + el de las 17:45) vienen de la auditoría anterior; una guía habla de 5 turnos de 2 h (9, 11, 13, 15, 17) | Se quedan los de antes, marcado SIN VERIFICAR |
| Coliseo y Museos, turnos | No hay lista de horas publicada: la entrada es con franja | Franja libre cada 15 min de la apertura a la última entrada oficial |
| Cúpula de San Pedro, Termas de Caracalla, Bioparque, Iglesia de San Pietro in Vincoli, Jardín de los Naranjos, Parque de Villa Borghese, Basílica de San Pedro | Sin volver a abrir la web oficial el 12-oct | Vale la comprobación del 25-30 sep (en cada `hours_audit`). Los cambios de hora de Cúpula, Termas y Bioparque ahora siguen «último domingo de marzo/octubre» (mismo resultado en 2026) |
| Iglesia del Gesù, Santa Maria in Trastevere | No tenían fuente anotada | Fuente: Roma Capitale (turismoroma.it). La pausa de agosto de Santa Maria in Trastevere no se pudo confirmar |

## Pruebas

- `pruebaFase6y9_horarios.mjs` (nueva, 4064 comprobaciones, con el servidor propio): 0 fallos. Cubre cada sitio con tramos, cada tramo y los bordes (último domingo de marzo y octubre, 31 ago, 1 y 30 sep, 1 oct, 29 feb) en 2026-2030; la última hora de la rueda = última entrada oficial; sin fechas el tramo del mes; el Foro en octubre (2026, 2027, 2028) a las 15:30-17:00 por dentro; ni rastro de `by_season`; turnos y aviso; ficha; `/api/reservation-hours`.
- Antes/después de los datos: las 365 fechas de 2026 de los 11 sitios con tramos dan **exactamente** el mismo horario (0 diferencias): el cambio solo afecta a otros años y al 29 de febrero.
- 0 fallos: `pruebaFase6y8_comida` (13288 casos), `pruebaFase6y7_motor parte=1,2,3 paso=9` (17724), `pruebaFase6y6_cierre` (3211), `pruebaFase6y4_listas` (643), `pruebaTanda6g, 6h, 6i, 6j, 6k, 6l, 6o, 6r, 6u, 6z, 6z2, 6z6` (en paralelo) y, en serie (las de pantallas), `6s, 6t, 6v, 6z3, 6z5, 6z6a, 6z6b, 6z6c, 6z6d`.
- `pruebaListas` en 9 fechas seguidas (24-26 oct 2026, 29-31 oct 2027, 26-28 mar 2027) y una muestra de 60 fechas (festivos, Navidad, Año Nuevo, Reyes, Semana Santa, agosto, bisiesto, cambios de hora de 2027 y 2028, bordes de septiembre/octubre): 60 de 60 fechas con 0 fallos (más las 9 seguidas).
- `npx tsc --noEmit -p tsconfig.app.json`: sin errores.
- **Sin terminar:** `pruebaFase6y5_motor` (p1; p18,tope; p2,p4 paso=37) es muy lenta y la paré a petición del coordinador: no hay resultado. Tampoco repetí `pruebaFase6y2_fotos` y similares (no miran horarios).
- No lancé las 365 fechas.

## Decidido por Code

- Dejé el nombre de campo `by_period` (ya lo leían el motor, el servidor y la app); el formato nuevo solo amplía lo que vale en `from`/`to`.
- El final del tramo de octubre es `ultimo_domingo:10-1` (la víspera del cambio), no «último sábado de octubre»: en 2026 el último sábado es el 31 y la web oficial dice que el invierno empieza el 25.
- Cúpula (03-29/10-25), Termas y Bioparque pasan a fechas relativas con el mismo resultado en 2026 (suposición: siguen el cambio de hora; sin verificar).
- Tramos que acababan el 28 de febrero acaban el 29 (3 sitios se quedaban sin horario en años bisiestos).
- `horasDeEntrada` del servidor delega en `horarioDeLaFecha`/`turnosDeReserva` y entiende el nombre «Free Tour por Roma».
- Free Tour: `turnos_reserva` (6 horas) en `default_free_tour`; **no** toqué `disponibilidad.horas` (['10:00','16:00']) porque es del motor del Free Tour (agente B).
- La ficha ampliada coge los tramos de `by_period` al cargarse (en el servidor); no edité `detalle/roma/*.json`.
- El número de las reglas nuevas es 622-624; si B o C usan los mismos números hay que renumerar al juntar.

## Preguntas abiertas

1. **Panteón**: ¿entra la gente con hora comprada o por orden de llegada? Yo lo dejé como franja libre cada 15 min hasta las 18:30. Si es por orden de llegada, ¿preferís no enseñar rueda de hora?
2. **Galería Borghese**: ¿vale la lista de turnos actual (cada hora y el de las 17:45) o los 5 de 2 h (9, 11, 13, 15, 17) que dice una guía? Hay que mirarlo en la web oficial de la Galería.
3. **Museos Vaticanos**: ¿puede Eric mirar en la web oficial el horario de lunes a sábado? Lo tengo como 08:00-20:00 (última 18:00) y hay fuentes que dicen 9:00-18:00.
4. **Free Tour**: `AddReservationSheet.tsx` aún tiene la lista fija de 5 horas; el servidor ya devuelve las 6 (`turnos`). Lo toca el agente C, y el motor (`disponibilidad.horas`) el B.

## Otra cosa que debes saber

Recibí un mensaje del coordinador sobre la regla del miércoles del Vaticano (P3 y P4 de la 6y7: Castillo de Sant'Angelo por dentro entre la comida y los Museos, y Plaza y Basílica de San Pedro después de comer en el D0) dirigido a «Agente B». Es del documento, `listasVariantes.mjs` y el motor de B; no lo hice por no ser mío.
