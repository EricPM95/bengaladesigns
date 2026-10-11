# Tanda 6y4 · parte de listas · punto 7: paradas que desaparecen con una reserva

## Lo que pasaba

Con un viaje de 3 días sin Free Tour, al poner la reserva del Altar de la Patria en un día distinto del que lo llevaba, **el Altar se quedaba sin día**. Lo repetí con el almacén de la ruta de verdad y el servidor de verdad, paso a paso, y pasaba en todas las fechas probadas (el Altar en el día 1 del Coliseo y su reserva en el día 2 o el 3, o al revés).

### La causa (una sola, en dos mitades)

1. **La app** (al poner una reserva de un sitio que no es de los grandes) sacaba la parada del día que la llevaba y la ponía en el día de la reserva. Después pedía al motor rehacer **solo el día de la reserva**.
2. **El motor** rehacía ese día con su lista escrita, que no lleva el Altar (el Altar va en el día del Coliseo). Contestaba un día sin el Altar, la app lo cambiaba por el que tenía, y la parada ya no estaba en ningún sitio. Además, cada día se pedía por separado y con **solo sus propias reservas**: cada día veía un viaje distinto.

Con el Coliseo, los Museos o la Galería sí funcionaba, porque esas reservas mueven el día entero y la petición lleva todas.

### El «Tarde → … → 10:00» en la mañana

Es la misma familia: una reserva de un sitio que, en la lista del día, cae en la tarde (el Panteón, el Ara Pacis…) pero se reserva por la mañana. El motor ponía la hora de la reserva y dejaba la parada donde la lista la tiene, así que el día enseñaba «Tarde» con una hora de las 10:00 y, al ordenar por hora, la parada salía la primera del día. Lo reproduje con el Panteón a las 11:00 (el Panteón va en la tarde del día 1). **No he podido reproducir exactamente el «Ara Pacis delante de todo» de Eric** (con el Ara Pacis reservado sí saldría así; con la reserva del Altar, no). Ver preguntas.

## El arreglo (en la regla, un solo sitio)

- `shared/routeEngine/listasTrip.js`, paso 5.0 (nuevo): **una reserva de un sitio que no es de los grandes va al día de su fecha**. Sale de la lista del día que lo llevaba (con su traslado) y entra en la del día de la reserva, **en el puesto que le toca por su hora** (detrás de lo que a esa hora ya habrá hecho, sin pasar una hora fija). Si ya estaba en ese día pero en un puesto que no es de su hora (más de una hora de diferencia), se pasa al puesto de su hora. Si el sitio ya iba por dentro otro día, ahí pasa a verse por fuera (por dentro una sola vez). Nada se quita: lo que sale de un día entra en otro.
- La petición lleva ahora **todas las reservas del viaje con su día** (`reservasViaje`, hecho en `server/index.js` y `server/engine/index.js`): cada día que se pide por separado ve el mismo viaje. Lo que cubre la misma entrada que una grande (el Foro con el Coliseo) va con el día de la grande.
- Cliente (`src/store/useRouteStore.ts`, `src/lib/rebuildDay.ts`): al poner la reserva se rehacen **el día de la reserva y el día que llevaba el sitio**; al quitarla, todos los días (sin cambiar su orden), para que el sitio vuelva a su día de siempre. `rehacerDiasSinTocar` admite `mantenerOrden`; nueva `rehacerDiasConReservas`.

## Pruebas

- **Prueba propia** `scripts/destino/pruebaFase6y4_listas.mjs` (con el almacén de verdad y el servidor): el caso de Eric paso a paso en 5 fechas (Coliseo día 1 a las 10:00; Altar día 3 a las 10:00; quitar el Altar; quitar el Coliseo) y siete sitios (Coliseo, Museos, Galería, Altar, Panteón, Castillo, Boca de la Verdad) en cada día del viaje y en 2 fechas, con quitarlas: **641 comprobaciones, 0 fallos**. Mira que no falte ni sobre ninguna parada, que el sitio salga solo en el día de su reserva, a su hora y marcado, que ninguna parada de la mañana lleve «Tarde» y que los días vayan por orden de hora. Antes del arreglo, el paso del Altar dejaba el Altar sin día en cualquier fecha (salida guardada en la conversación).
- **Prueba de listas** (`pruebaListas.mjs`), comprobación nueva `paradas_perdidas` y `reserva_sin_su_dia`: tras una reserva (Coliseo 10:00 y 15:00, Museos, Galería, Altar 10:00 y 16:00, Panteón, Castillo, Boca de la Verdad) en **cada día** de **cada forma de viaje** y cada fecha, el viaje lleva las mismas paradas que antes. Con `antiguo=1` (sin la regla nueva) la prueba da fallo (48 en 3 fechas), así que la echa en falta. Nuevos parámetros `n=` (fechas seguidas) y `desde=`; `scripts/destino/_correr365.mjs` las reparte en procesos.
- **Las 365 fechas** (`desde=2026-10-11`, 16 procesos, 40 minutos): **581.677 viajes, 2.220.266 días, 0 fallos**.
- Tipos (`npx tsc --noEmit -p tsconfig.app.json`): sin errores. Las pruebas 6g (paso=30), 6y reorganizar, 6s, 6t, 6u, 6v, 6z, 6z2, 6z3, 6z5, 6z6 (a, b, c, d), 6y2 y 6y3 de reservas: **0 fallos**, sin cambiar ninguna.

### Cómo cuenta la comprobación «ni una menos»

Se comparan los **sitios** (no el modo), sin los rellenos de hueco. Se admite, **y se cuenta aparte**, esto:
- lo que un cierre del propio sitio ese día quita y la ruta avisa («Cerrado hoy»): 369 casos;
- con una reserva grande, lo que escribe **la fila de su tabla** para esa hora (el documento manda: p. ej. el Coliseo desde las 14:16 trae una tarde distinta);
- las variantes del propio documento que quitan o cambian un sitio por el día de la semana, cuando la reserva cambia el día del viaje en que cae ese día escrito: domingo y miércoles sin Museos, lunes sin Galería y sin Termas, domingo de la Farnesina y de San Clemente, sábado del Panteón: **3.006 casos**;
- no se prueba una reserva grande en un día de excursión, de medio día o en una fecha en que el sitio cierra (la app la guarda con su aviso y no mueve nada).

## Preguntas abiertas

1. **El «Ara Pacis delante de todo» de Eric**: no he podido reproducirlo tal cual. Con la reserva del Altar no sale; sale con el Ara Pacis reservado a las 10:00 (parada de la tarde con hora de mañana), que ahora queda arreglado. ¿Reservó Eric el Altar de la Patria o el Ara Pacis (a veces llamado «el Altar de la Paz»)? Si fue el Altar, hay algo más que no he visto y necesito sus fechas y el estado del viaje.
2. **El documento quita sitios según el día**: si una reserva fija el Coliseo en un día y eso deja el día del Vaticano en un miércoles o un domingo, el documento («el miércoles sin Museos», «domingo sin Museos») quita los Museos; con el Galería, el lunes. El viajero lo ve en «No incluido», pero **desde su punto de vista, una reserva ha quitado algo**. Lo dejo como está porque es el documento. ¿Lo cambiamos para que, en ese caso, el día del Vaticano salte al otro día libre?
3. **Quitar la reserva de los Museos puesta en un miércoles**: como quitar una reserva no mueve días (Tanda 6m), el día se rehace en miércoles y el documento quita los Museos. Mismo asunto que la pregunta 2.
4. Con una reserva grande a una hora cuya fila del documento es distinta (Coliseo desde las 14:16), la tarde del día trae otras paradas (se pierden la Fuente de las Tortugas, el Elefantino…). Es el documento, pero choca con «con una reserva no se quita nada». ¿Se queda así o esas paradas pasan a «Si te sobra tiempo»?
5. Al mover un sitio al día de su reserva, el día que lo recibe puede acabar con una parada de más o de menos de relleno (el hueco de tiempo cambia). Se cuenta, no se prohíbe.

## Ficheros tocados

`shared/routeEngine/listasTrip.js`, `server/index.js`, `server/engine/index.js`, `src/lib/rebuildDay.ts`, `src/store/useRouteStore.ts`, `scripts/destino/pruebaListas.mjs`, `scripts/destino/comprobacionesListas.mjs`, `scripts/destino/pruebaFase6y4_listas.mjs` (nueva), `scripts/destino/_6y4_listas_entrada.tsx` (nueva), `scripts/destino/_correr365.mjs` (nueva), este informe.
