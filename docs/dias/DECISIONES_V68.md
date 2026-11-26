# V68 · Decisiones

(Este archivo lo escriben dos agentes: cada uno AÑADE su sección, no pisa la del otro.)

## Apartado 4 · «Reorganizar nunca quita nada del viaje» (agente del motor de Reorganizar)

### Qué tanda lo rompió y por qué
La **V61** (motor del día de llegada, `shared/routeEngine/listasTrip.js` + `llegadaDia1.js`) hace que, con un vuelo de llegada tarde, **«el día 1 pasa al día 2»**: todo se corre un día y **se cae el último día de ruta**. Eso está pensado para generar el viaje entero, pero `adaptarVuelos.ts › propuestaDeVuelos` rehacía **cada día por separado** (`/api/rebuild-day`) y el día caído no tenía dónde ir: **desaparecía** (Galería Borghese, Villa Borghese, Pincio…). La hoja lo contaba con verdad («Se quita de tu viaje») y el cambio tocaba TODOS los días (45 tarjetas con el vuelo de 15:30). Reproducido con el vuelo de 15:30 y de 17:30 (Roma, 27-nov-2026, 4 días, Free Tour sin hora): **3 días cambian de 4, 45 tarjetas, 17 «se quita», 12 sitios que desaparecen y 2 repetidos nuevos**.

### Qué hace ahora (V68)
- **Archivo nuevo `src/lib/reorganizarMinimo.ts`** (`cambioMinimo`, `garantizarNadaSeQuita`, `diaBloqueado`), llamado desde `propuestaDeVuelos` justo después de pedir al motor día por día:
  1. **Con vuelo de llegada solo cambia el día de la llegada** (lo que el motor monta para esa hora, con su comida/cena). Las propuestas «en cadena» de los demás días se descartan (si hay vuelo de vuelta se mantiene la del último día y la del día de vuelta).
  2. **Lo que no cabe ese día** va **al día POSTERIOR donde mejor quepa** (a continuación de la última parada del día, antes de la cena, abierto ese día —`horarioDeParada`—, no tras la puesta de sol si es un sitio «solo de día», el más cercano y menos lleno), y **si no cabe en ninguno, a «Lugares pendientes»** (`spareStops` del día 1, motivo «Con tu vuelo no te da tiempo ese día.»). **Una reserva o el Free Tour nunca se manda a otro día solo**: va a pendientes con su reserva.
  3. **Bloqueados:** un día que ya pasó (fecha < hoy) y el de hoy si ya se ha visto o saltado algo (`diaBloqueado`): Reorganizar no los toca.
  4. **Red de seguridad:** todo sitio que había en el viaje sigue en una parada o en pendientes (si no, va a los pendientes de su día); un sitio que la propuesta dejaría **repetido** (nuevo) se queda solo en el primer día (o en el de su reserva). Los repetidos que ya traía el viaje (el mismo sitio de día y «(noche)») no se tocan.
- **`adaptacionAlVuelo` / `diasQueCambian`** (el botón): una sola propuesta para todo el viaje (guardada 30 s) y los días que reciben lo que no cabe entran en la hoja aunque no se hayan pedido. Devuelve `todos`.
- **La hoja nunca emite «quitar»:** `cambiosDeReorganizar` (`tarjetasDePropuesta.ts`) manda un sitio que no está en ningún día a «A Lugares pendientes»; ya no hay tarjeta «Se quita de tu día» para la comida (la comida no es un sitio; lo dice el texto de arriba). `detalleDelCambio` (`reorganizarDia.ts`) nunca da `'quitado'`: da `'pendientes'`. (La operación «quitar» de las hojas de HOY —otra cosa— no se toca.)
- **Comida y cena según la hora real:** salen del motor (aterrizas 15:30 → sin comida, cena 19:30; 17:30 → sin comida, cena 20:25).
- **Cabeceras MAÑANA / TARDE / NOCHE de DÍAS** (`DayDetailPanel.tsx`): la hora a la que el motor pone la parada es ahora un **suelo** (`src/lib/franjaDelDia.ts`: desde las 14:00 nunca MAÑANA, desde las 20:00 NOCHE) además de la regla de la comida y la cena de la 10S10. Aterrizando a las 17:30, la parada de las 22:05 sale en NOCHE.
- Vale igual para todos los destinos: el motor no se ha tocado (`shared/` sin cambios); la corrección está en el cliente. **Lanzarote** (coche, `adaptarUnDiaDeCoche`): mismo camino; 15:30 → el día 1 se queda con el Faro de Pechiguera (18:23) y lo que no cabe va a pendientes o al día 5 (sin tocar los días 2, 3 y 4).

### Decisiones para Eric
1. **El Free Tour sin hora y los Museos Vaticanos** del día 1 acaban en **Lugares pendientes** con el vuelo de 15:30/17:30 (los demás días de Roma van llenos y no cabe nada más). Antes el motor los pasaba al día 2 empujando todo en cadena. Si prefieres que el Free Tour tenga prioridad para el día 2 (empujando lo demás a pendientes), es cambiar la regla en `cambioMinimo`.
2. **El motor sigue con su «el día 1 pasa al día 2»** al generar el viaje ENTERO con vuelo (generación desde cero): ahí sí se mueven los días (es el diseño de la V61). Lo único que cambia es el botón Reorganizar y la alerta de los vuelos.
3. Un sitio puede ir al final de otro día **sin comprobar la distancia real por Mapbox** (usa la distancia en línea recta como el resto de HOY): los tiempos se afinan al pulsar «Reorganizar este día».

### Para el agente de `pruebaV68` (todo por script, sin navegador; API en 8787)
- **Reproducir cada caso (Roma):** `VUELOS=15:30,17:30 node scripts/destino/comprobarReorganizarV68.mjs Roma 2026-11-27 4` (añade `DETALLE=1` para ver cada día antes y después). Sale con código 1 si algo falla. Tarda unos 2-4 minutos (genera el viaje con Mapbox).
- **Lanzarote** (la API con `DESTINOS_OCULTOS='-'`): `VUELOS=15:30,17:30 node scripts/destino/comprobarReorganizarV68.mjs Lanzarote 2027-03-07 6`.
- **Qué comprueba el script** (cada línea = un fallo si no se cumple): (1) ningún sitio desaparece (cada parada de antes sigue en una parada o en `spareStops`); (2) ningún sitio repetido NUEVO; (3) 0 tarjetas `quitar` en la hoja (`cambiosDeReorganizar`); (4) el día de llegada sin comida aterrizando a las 16:30 o más tarde, con cena entre las 15:00 y las 18:00, y ninguna comida antes de aterrizar; (5) ninguna parada en MAÑANA aterrizando a las 17:00 o más tarde (`franjasDelDia`, la misma función que DÍAS); (6) idempotente: la segunda pasada sobre el resultado no propone ningún día. Imprime **nº de días que cambian**, **nº de tarjetas**, comida/cena del día de llegada y la franja de cada parada.
- **Resultado esperado hoy:** Roma 15:30 → días que cambian 2 (1 y 3) de 4, 13 tarjetas, 0 quitadas; 17:30 → 2 días, 13 tarjetas, 0 quitadas. Lanzarote 15:30 → 2 días (1 y 5) de 6, 8 tarjetas; 17:30 → 2 días, 6 tarjetas. Antes: 3 días, 45 tarjetas, 17 quitadas.
- Para la prueba de la hoja por función pura (sin red): `cambioMinimo(route, propuestos, { hayLlegada, hayVuelta, enCoche })` y `garantizarNadaSeQuita(route, mapaDeDias)` son importables desde `src/lib/reorganizarMinimo.ts` (con un `esbuild` como en `comprobarReorganizarV68.mjs`: hay que sustituir `import.meta.glob` por `{}`, ya lo hace el script).
- **Bloqueo de días pasados:** `diaBloqueado(route, day, hoyIso)` con `hoyIso` posterior a la fecha de un día → true; `propuestaDeVuelos` no lo propone nunca.
- **Capturas:** `APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV68_b.mjs hoja|dias antes|despues [Roma|Lanzarote] vuelo=15:30` → `docs/dias/V68_capturas/b_1530_antes.jpg`, `b_1530_despues.jpg`, `b_1730_…`, `b_1530_lanzarote_…`, y `…_dias.jpg` (DÍAS con las cabeceras). «antes» usa `propuestaDeVuelos(…, { sinMinimo: true })` (opción solo para capturas).

### Lo que NO he podido comprobar
- El barrido de 365 (ver el informe del agente: se pasó/no se pasó).
- El comportamiento con vuelo de llegada Y de vuelta a la vez: se mantiene la propuesta del motor para el último día y el de vuelta (calculada con la cadena de la V61); la red de seguridad quita los repetidos, pero no está comprobado sitio por sitio.
- Días ya pasados / de hoy con paradas vistas: comprobado por lectura del código y con la función pura, no con un viaje en curso.


---
## Apartados 1, 2 y 3 (reservas a otro día, nunca un sitio dos veces, recuperar el día) — agente A

### Qué lo rompió (una línea)
No fue una sola tanda: la colocación del cliente de la 10S7 (`placeReservedEntranceUna`: la parada que viaja entra «de PRIMERA» y solo viaja `placeNames[0]`) pasó a ser el camino principal en cuanto los días llevan `originalSnapshot` (Reorganizar / «Sí, adaptarlos» de V49-V61 los marcan como tocados y `rehacerDiasSinTocar` los salta, así que el motor no recoloca), y el servidor (`server/index.js`, desde la f47e0f46 de octubre) daba la hora de la reserva a TODOS los sitios de la entrada (Coliseo Y Foro a las 13:00: el motor ponía el Foro a esa hora y el Coliseo después). No se ha podido bisecar contra producción; reproducido en local con el código viejo (`scripts/destino/_v68_antes.mjs`).

### Cambios
- `src/lib/bookings.ts`: nueva `colocarEntradaConSusSitios(route, reserva, diaDestino)` (pura, exportada) que usa `placeReservedEntranceUna`: mueve TODOS los sitios de `placeNames` (el primero lleva hora y marca; los demás detrás), cada uno a su hora (delante de la primera parada más tardía, o que aún duraría cuando empieza la reserva: Free Tour 10:00 antes del Coliseo de 09:15), empuja lo que se pisa (salvo horas fijas), nada queda atrás ni repetido, las nocturnas no se tocan. Ruta a mano: sin cambios.
- `server/index.js` (`entradas` en el reparto de `/api/rebuild-day`): una entrada con varios sitios lleva la hora SOLO en el primero. (Coliseo 13:00 → Coliseo 13:00, Foro 14:25.) API reiniciada.
- `src/lib/sinSitiosRepetidos.ts` (NUEVO, puro): `sitiosRepetidos(route)`, `repetidosNuevos(antes, despues)`, `guardianDeSitios(antes, despues, que)` → `{ ok, route, repetidos }` (si no ok devuelve la ruta de antes y escribe en consola `[V68] «…» no se guarda…` y en `window.__sitiosRepetidosLog`; array `registroDeRepetidos`), `claveDeSitio(stop)`, `visitasDeSitio(day)`. Un repetido que YA venía de antes no es fallo nuevo.
  Usado en: `addReservation` (todas sus rutas, `guardar`), `rehacerDiasSinTocar` (todo o nada), `restoreOriginalDay`, y envoltorios al final de `useRouteStore.ts` para `moveStopToDay` y `restoreOriginalRoute`.
  **Para el agente del apartado 4:** Reorganizar debería llamar `guardianDeSitios(rutaAntes, rutaDespues, 'reorganizar')` sobre el resultado COMPLETO antes de guardarlo (no por día: a mitad hay repetidos transitorios). No lo he cableado porque `reorganizarDia.ts` / `adaptarVuelos.ts` son suyos.
- `src/lib/recuperarDia.ts` (NUEVO, puro): `recuperarDiaCompleto(route, dayId)`. `src/lib/recuperarElDia.ts` (NUEVO, síncrono): `recuperarElDia(dayId)` = `restoreOriginalDay` + marca los días tocados con `marcarDiaReorganizado` + `useReorganizarStore.poner([], ids)` (el botón se va al momento; vuelve solo si cambia el día). `DayList.tsx` llama a `recuperarElDia`. `restoreOriginalDay` del almacén ahora usa `recuperarDiaCompleto` y el guardián.
- `src/lib/loQueHizoLaReserva.ts` (NUEVO, puro): `resumenDeLoMovido(antes, despues, tituloDe)` → `{ movidos, diasEnteros, texto }`. El aviso de abajo con [Deshacer] (`addReservation`, entrada grande) lo usa: «Tu Coliseo, Foro y Palatino, el martes 13. Hemos pasado el día entero «X» al martes 13 y el día entero «Y» al miércoles 14.» o «Solo se han movido A y B al martes 13.». (La hoja E1 previa de `AddReservationSheet` no se ha tocado: enseña el plan del motor, que ahora coincide con lo que se hace.)

### Ganchos para `pruebaV68` (sin navegador)
- `node scripts/destino/_v68_puras.mjs` (26 comprobaciones, código 1 si falla). Exporta `cargarPuras()` (esbuild → módulo con `colocarEntradaConSusSitios, placeReservedEntrance, reapplyReservations, sitiosRepetidos, repetidosNuevos, guardianDeSitios, claveDeSitio, recuperarDiaCompleto, resumenDeLoMovido, numberedStopsOf, stopNumbersOf`); la prueba puede `import { cargarPuras } from './_v68_puras.mjs'`.
- Con la app (Vite + API): `scripts/destino/capturasV68_a0_repro.mjs [vaticanos|coliseo|freetour|freetour10]` vuelca por consola/`docs/dias/V68_log_a0.json` las paradas tras `addReservation` real (Roma 13-15 jul 2027 generado de cero); `scripts/destino/_v68_motor_crudo.mjs '<json reserva>'` da lo que devuelve el motor solo. En el navegador: `useRouteStore.getState().addReservation(res)`, `window.__sitiosRepetidosLog`, `(await import('/src/lib/recuperarElDia.ts')).recuperarElDia(dayId)`.
- Comprobar en la prueba: Coliseo 13:00 → Coliseo [R] 13:00 y Foro DESPUÉS en el día 1, ninguno en el 2; Vaticanos 15:00 → en TARDE, no primero; FT 15:00 en el día elegido por la tarde y FT 10:00 antes de lo que empieza antes de las 10:10; recuperar → `sitiosRepetidos` vacío y `useReorganizarStore.getState().dias` sin el día.

### No comprobado / pendiente
- No he probado contra producción (jutrip.app) ni con un viaje cuyos días ya tienen `originalSnapshot` por Reorganizar de verdad (solo el camino del cliente con función pura y el del motor).
- La rama «Free Tour a las 10:00» solo se prueba con función pura (en la app el Free Tour no rehace días: 10S3).
