# Tanda 7, parte REPARTO POR NOCHES (el día de vuelta aparte)

Decidido por Eric el 14-oct-2026: «Cambiar el esqueleto». Hecho en los destinos con motor de días escritos (hoy, Roma).

## Dónde se decidía el número de días de ruta

- Cliente: `answers.days` (los días del viaje, el de vuelta incluido, `n`) se manda tal cual. `mapGeneratedRouteToRoute` añade el día de vuelta (`appendReturnLegDay`) solo si los días generados son menos que `answers.days`. El cliente ya esperaba `n−1` días de ruta.
- Servidor: `/api/generate-skeleton` hacía `totalDays = answers.days` y pasaba `totalDays` a `buildSkeletonV2`, así que el esqueleto salía con `n` días de ruta. Los demás pasos (`generate-day-places`, `generate-day-block`, `rebuild-day`, `adjust-day`…) calculan el viaje como `all_days.length + 1`; con un esqueleto de `n` días el motor creía que el viaje duraba `n+1` y hacía `n` días de ruta. Nunca había día de vuelta aparte. Ese es el único sitio que lo decidía mal.
- Aclaración sobre el encargo: `planListasTrip` / `tripDays` reciben `totalDays = n` (días del viaje) y dentro hacen `contentDays = n−1` (invariante 21). Con el esqueleto arreglado, `all_days.length + 1 = n`, que es lo que el motor espera. Las pruebas de motor puro (`VIAJES`: `totalDays: dias + 1`) ya hablan así.
- Rehacer por cambio de fechas, por cambio de vuelo, «+ Añadir día» y [Añadir en un día nuevo] pasan por la misma generación (`regenerateRouteForDates` → `runGeneration`) o por `all_days` sin el día de vuelta: no hizo falta tocar nada más.

## Qué cambió

- `shared/routeEngine/tripSkeleton.js`: nueva `diasDeRuta(n) = max(1, n−1)`, el único sitio donde se cuenta. La usan `tripDays` e `interruptorDia4` (antes cada uno tenía su copia).
- `server/index.js`: `/api/generate-skeleton` pide `diasDeRuta(answers.days)` solo si el destino tiene días escritos (`writtenDaysFor(findPipelineV2Key(destino))`); los demás siguen con `answers.days`. `regenerate-route-redistribute` usa `diasDeRuta` (misma cuenta que ya tenía).
- `server/engine/index.js`: sus 4 copias de `max(1, totalDays−1)` pasan a `diasDeRuta`.
- `src/lib/mapGeneratedRoute.ts`: solo un comentario (apuntaba a una función que ya no existe).
- Prueba nueva `scripts/destino/pruebaTanda7_reparto.mjs` (+ `_tanda7_reparto_entrada.tsx`).

## Qué NO cambia

- Los destinos no curados (Claude): esqueleto con `answers.days` días, caché de rutas y `engine_version` igual. Roma nunca usa la caché de rutas (`route-cache/lookup` y `save` la saltan), así que no hay nada que mezclar y no subí `engine_version`.
- Ruta a mano (`buildManualRoute`, n días vacíos), coche, viajes guardados y Supabase (modelo guardado igual; un viaje guardado se ve como estaba, solo cambian los nuevos y los rehechos).
- Una sola fecha / «Solo un día»: 1 día de ruta (D0) sin día de vuelta aparte.
- No se toca la migración 0019 de fotos.
- No hay multidestino con motor de días escritos (un destino por viaje).

## Pruebas

- Nueva `pruebaTanda7_reparto.mjs`: 2087 comprobaciones, 0 fallos, con el servidor real y la petición completa del cliente (`runGeneration`). Cubre: esqueleto n=1..14 con y sin fechas; viaje n=1..14 con y sin fechas, de pago y gratis, sin vuelos (días de ruta, un solo día de vuelta y el último, fechas, números, tabla «Qué días lleva cada viaje» para n−1); Free Tour de mañana; reservas en su día y a su hora; las 7 filas de la vuelta con hora (tarjeta «Hoy vuelves a casa», última mañana, día de más) y la llegada con plan; la gratis con horas guardadas (no se usan, no se borran) y la tarjeta «Tu último día también cuenta»; una sola fecha; tren, bus, barco y coche; los 20 viajes de la revisión (sin vuelos y con llegada) y los 10 de `VIAJES_VUELTA` contra el motor directo; rehacer por cambio de fechas (también con un día añadido), «+ Añadir día», [Añadir en un día nuevo] con su aviso y Deshacer; ruta a mano.
- Pruebas ajustadas: ninguna. Ninguna prueba existente asumía `días` días de ruta (ninguna pedía el esqueleto ni usaba `runGeneration`).
- Batería (pantallas en serie, motor en paralelo): todo en verde salvo lo esperado. `pruebaFase6y2_reorganizar` (3) y `pruebaFase6y_reorganizar` (4) fallan como en main (Museos a las 9:00 por el día escrito `D1-vaticano`). Cuatro pruebas dieron fallo solo por apuntar al puerto 8787 (`pruebaFase6y_formulario`, `pruebaSalida`, `pruebaFase6z6c`, `pruebaFase6z6d`, `pruebaTanda6u`): repetidas con el puerto bien, 0 fallos.
- Muestra de 54 fechas con `pruebaListas`: 119.673 viajes, 0 fallos. Typecheck `tsc -p tsconfig.app.json`: limpio. No se lanzaron las 365 fechas.

## A 375 px (Chrome del equipo, Supabase bloqueado)

Capturas `docs/dias/img/7-reparto-*.jpg`. Visto: el calendario con «5 días · 4 noches»; viaje Madrid → Roma, 15–19 oct, creado por el formulario: 4 días de ruta (jue 15 a dom 18) + «lun 19 · Día de viaje · Roma → Madrid»; llegada 15:30 y vuelta 17:00 en RESERVAS con sus hojas del resumen y el billete de vuelta; el día de vuelta con su última mañana (Circo Máximo, Boca de la Verdad, Jardín de los Naranjos, Ojo de la Cerradura, comida); vuelta 11:00: «Hoy vuelves a casa»; la gratis con «Tu último día también cuenta», [Añadir mi vuelta] con candado y [Prefiero montarlo yo]; excursión en un día nuevo desde «+ Añadir día»: el día nuevo va antes del de vuelta.
No se vio bien a 375 px: el cambio de fechas completo con el aviso de la campana «revisa que tu vuelta sigue siendo…» (el calendario y la hoja «Vamos a ajustar tu ruta» salieron, pero mi guion no confirmó el cambio a tiempo); eso sí lo comprueba la prueba (`vueltaCambiada`, aviso y Deshacer). Tampoco se vio qué abre el candado al pulsar [Añadir mi vuelta] en local (la pantalla no cambió; es `pedirPago()`, igual que «Escuchar historia»).

## Invariantes propuestos

- 21 (se aclara): «`contentDays = días − 1`: un viaje de `n` días (`n−1` noches) lleva `n−1` días de ruta y el último es el de vuelta, que crea la app. `diasDeRuta(n)` (`tripSkeleton.js`) es el único sitio donde se cuenta; el esqueleto del servidor lo pide así en los destinos con días escritos. Con una sola fecha hay 1 día de ruta y ningún día de vuelta aparte.»
- Nuevo: «Nadie escribe `días − 1` a mano: se llama a `diasDeRuta`. El `+ 1` de `all_days.length + 1` es su inverso y lo dan los días de ruta del esqueleto.»

## Decidido por Code

- «Con días escritos» = el destino tiene `data/dias/<destino>/` leído por `writtenDaysFor` (hoy Roma), no depende de `ROUTE_ENGINE`.
- `buildSkeletonV2` sigue buscando `zone_distribution` con el número de días de ruta (como cuando `n` ya era de ruta); solo rellena títulos que el motor nuevo ignora.
- El resumen del esqueleto dice «Roma en n−1 días»; no se enseña en ninguna pantalla.
- Con 6 días de ruta o más y una vuelta entre 13:30 y 22:59 el día de vuelta sale sin paradas con la hoja «Ya has visto lo mejor de Roma» (ya se vio todo): es lo que dice el documento y lo acepta la prueba.

## Preguntas abiertas

1. Los demás destinos (los que hace Claude) siguen con `answers.days` días de ruta y sin día de vuelta aparte (el comentario antiguo de `mapGeneratedRoute` decía lo contrario). ¿Se alinean con la misma regla cuando se quiera?
2. El tope del pool de lugares del formulario (`poolSelectionLimit`: 1 día 0, 2 días 3, 3 o más 6) cuenta días del viaje, no de ruta: un viaje de «2 días · 1 noche» tiene 1 día de ruta y deja elegir 3 lugares. ¿Se cuenta ahora en días de ruta?
3. Al rehacer con un día añadido con «+ Añadir día», `answers.dateRange.end` conserva las fechas que planificó el motor (la línea «Tienes más días que fechas»), así que el día de vuelta puede tener una fecha un día después de `end`. Es como era antes (sin día de vuelta aparte pasaba igual con el último día). ¿Se deja?
