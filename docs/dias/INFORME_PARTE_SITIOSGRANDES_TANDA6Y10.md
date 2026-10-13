# Tanda 6y10 · Parte «sitios grandes a los datos del destino»

## El campo nuevo

En `data/pipeline_v2/roma.json` (antes de `entradas_reservas`), añadido con `scripts/destino/_6y10_sitiosGrandes.mjs` (solo añade líneas, se puede repetir):

```
"sitios_grandes": { "_nota": "...", "lugares": [
  { "nombre": "Coliseo", "del": "del Coliseo", "el": "el Coliseo", "dias": ["D1", "D1-FT"] },
  { "nombre": "Museos Vaticanos y Capilla Sixtina", "del": "del Vaticano", "el": "el Vaticano", "dias": ["D2", "D3"], "nunca_se_quita": true },
  { "nombre": "Galería Borghese", "del": "de la Galería Borghese", "el": "la Galería Borghese", "dias": ["D4"], "nunca_se_quita": true },
  { "nombre": "Free Tour por Roma", "del": "del Free Tour", "el": "el Free Tour", "dias": ["D3", "D1"] } ] }
```

La lista fija solo llevaba los cuatro nombres. Pero había otras tres listas fijas, una por cada sitio grande, repartidas por el código; las he metido en el mismo campo para que no quede ninguna lista de Roma en el código:
- `del` / `el`: cómo se nombra el sitio en los avisos (antes `DEL` en `server/engine/reservationPlan.js` y `DEL`/`EL` en `AddReservationSheet.tsx`).
- `dias`: los días escritos que son de cada sitio (antes `DIAS_DEL_SITIO` en `reservationPlan.js`).
- `nunca_se_quita`: el Vaticano y la Galería nunca se quitan de su día (antes `QUE` en `reservationPlan.js`).

Las horas normales de la reserva (`normal: {desde, hasta}`) NO estaban en la lista fija: ya viven en `listas.json` (`dia.reservas[lugar].normal`), así que no se han tocado.

## Dónde se leía la lista fija y cómo se lee ahora

| Antes | Ahora |
|---|---|
| `RESERVAS_GRANDES` (Set en `shared/routeEngine/listasReservas.js`) | Borrada. `sitiosGrandesDe(destData)` (Set de nombres) y `sitioGrandeDe(destData, nombre)` leen `destData.sitios_grandes.lugares`. Sin campo: Set vacío. |
| `claseDeReserva` | Recibe `contexto.sitiosGrandes`; sin él, ningún sitio es grande. |
| `listasTrip.js` (5 sitios: reservas sin grandes, reservas del viaje, clase, margen de llegada de 30 min, margen entre reservas) | Un `const sitiosGrandes = sitiosGrandesDe(destData)` al principio de `planListasTrip`. |
| `reorganizarDia.js` (2 sitios) | Igual, con su `destData`. |
| `server/index.js` (`engineExtrasFromRequest`: reservas grandes del viaje y las que no) | `engineExtrasFromRequest(body, answers, dayNumber, destData)`; los 5 sitios que lo llaman le pasan su `destData`. |
| `server/engine/reservationPlan.js` (`RESERVAS_GRANDES`, `DEL`, `DIAS_DEL_SITIO`, `QUE`, y el nombre «Free Tour por Roma») | Todo sale de `destData.sitios_grandes` y de `destData.default_free_tour.name`. |
| `src/lib/bookings.ts` (`BIG_RESERVATION_PLACES`) | Borrada. `isBigReservation(reserva, sitiosGrandes)` y `sitiosGrandesDelViaje(route)`. |
| `AddReservationSheet.tsx` | Usa `useDestinationExcursions(route.destination).sitiosGrandes` (nombre, `del`, `el`). |
| `useRouteStore.ts` | Usa `sitiosGrandesDelViaje(route)`. |

**Cómo llega a la app:** por el endpoint de siempre, `/api/destination-excursions` (campo `sitios_grandes: [{nombre, del, el}]`, `[]` si el destino no lo trae), y `src/lib/destinationExcursions.ts` lo guarda como `sitiosGrandes`, igual que `grupos_dia` o las etiquetas de barrio. No hay lista en el cliente.

Scripts de prueba que importaban la lista (`pruebaListas.mjs`, `comprobacionesListas.mjs`, `tablaReservas.mjs`) leen ahora de los datos.

## Cómo se probó que Roma sale igual

Prueba nueva: `scripts/destino/pruebaFase6y10_sitiosgrandes.mjs ref=<copia del código de antes, commit bef2731>`. Compara el motor de antes (lista fija) con el nuevo (datos):
- Los datos de Roma son los mismos salvo el campo nuevo, y el campo trae exactamente los cuatro nombres de antes.
- `planListasTrip`: de 1 a 7 días, con y sin Free Tour, más dos medios días, 30 fechas repartidas por el año, sin reservas, con pool, y con cada reserva (Coliseo, Museos, Galería Borghese, Free Tour, Altar de la Patria, Panteón) a varias horas en varios días del viaje. Resultado: ver el cierre de abajo.
- `claseDeReserva`: todos los días escritos × 6 sitios × horas de 8:00 a 20:00 × con/sin Free Tour × con/sin excursión de mañana.
- Servidores (uno con el código de antes y otro con el nuevo): las mismas peticiones a `/api/reservation-plan` y `/api/rebuild-day`, respuestas idénticas.
- Destino de mentira: solo el Panteón grande, sin el Coliseo, sin el campo y con la lista vacía: el motor no se rompe, cada uno se porta con SU lista (el Coliseo deja de ser grande y su viaje cambia; sin campo no hay sitios grandes).

**Resultados (0 fallos):**
- Roma igual: 17.340 viajes comparados, 0 diferencias.
- `claseDeReserva`: 8.400 casos, 0 diferencias.
- Servidores: 1.440 respuestas comparadas (`reservation-plan` y `rebuild-day`), 0 diferencias; `/api/destination-excursions` trae los cuatro sitios, y `[]` en un destino sin datos.
- Destino de mentira: 120 viajes, sin el Coliseo cambian los 120, sin el campo cambian los 120, 0 rompen.
- Muestra de 54 fechas con `pruebaListas`: 119.621 viajes, 324.744 días, 0 fallos.
- Pruebas afectadas a 0 fallos: 6y2/6y3/6y4 reservas, 6y4 listas (643), 6y6 cierre, 6y7 motor, 6y8 comida, 6y9 freetour y pantallas, Corr6z6 reservas, Tanda 6h, 6i, 6j, 6k, 6l, 6r, 6s, 6t, 6v, 6x, 6z, 6z2, 6z3, 6z3_dias, 6z5, 6z6 y 6z6a-d. Dos con una línea que NO viene de este cambio: 6g (1 fallo `etiqueta_roja`, sale igual con el código de antes) y 6u (la parte de servidor tiene el puerto 8787 fijo y no se puede probar con mi servidor).

## La guía

`docs/dias/GUIA_NUEVOS_DESTINOS.md` (apartado 2, «Los sitios grandes»): ahora dice que se marcan en el campo `sitios_grandes` de los datos, con `lugares` (`nombre`, `del`, `el`, `dias`, `nunca_se_quita`), que el motor, el servidor y la app leen solo de ahí, y que un destino sin el campo no tiene sitios grandes.

## Decidido por Code

- El campo es un objeto con `lugares` y una `_nota` (como `entradas_nombres_cortos`), por si luego hace falta algo más del conjunto.
- Metí en el campo las otras tres listas fijas ligadas a los mismos cuatro sitios (`del`/`el`, `dias`, `nunca_se_quita`), porque eran lista fija de Roma en el código.
- El Free Tour sigue en la lista de sitios grandes por su nombre (`default_free_tour.name`); en `reservationPlan.js` el caso especial «el Free Tour no está en el viaje de antes» ahora compara con ese nombre, no con un texto fijo.
- La app necesita los datos del destino ya cargados para saber qué es grande. En la app real ya lo están (los pide RESERVAS y la hoja de reservas antes de poder reservar). Si no estuvieran, una reserva se trataría como de sitio pequeño. La prueba `pruebaFase6y4_listas` ahora los carga antes, como la app.

## Preguntas abiertas

1. Sigue una regla del Coliseo escrita en el código: en `claseDeReserva`, «con excursión de mañana, el Coliseo no cabe antes de las 16:30». Es una regla de un sitio concreto, no una lista. ¿La pasamos también al campo (por ejemplo `no_cabe_con_excursion_hasta: "16:30"`)?
2. En `server/index.js`, el Free Tour de 10:00 sin día se marca como entrada con el texto fijo «Free Tour por Roma» (línea de `engineExtrasFromRequest`). ¿Lo cambiamos a `destData.default_free_tour.name` en otra tanda? No lo he tocado porque no es la lista de sitios grandes.
