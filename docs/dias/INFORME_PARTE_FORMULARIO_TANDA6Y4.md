# Tanda 6y4, parte del formulario (puntos 1, 2, 3 y 4)

En palabras sencillas. Prueba: `scripts/destino/pruebaFase6y4_formulario.mjs` (562 comprobaciones, 0 fallos). El tsc de verdad (`-p tsconfig.app.json`) sale limpio.

## Punto 1. Elegir sin espera

- Al tocar «¡Sí, hazla por mí!» o «Quiero hacerla yo» se pasa AL MOMENTO a la pantalla siguiente (experiencias o resumen corto). Ya no hay temporizador de 0,7 s.
- Quité también el aviso «Creando tu itinerario…» / «Preparando tu viaje…»: con el paso inmediato ya no tenía sentido (no se veía nunca) y no retrasa nada. Se borró `AVISO_DE_ELEGIR` de `planChoice.ts`, la espera de `TrazoFlow.tsx` y el estado de «tarjeta tocada».
- La sugerencia de experiencias se sigue lanzando antes de pasar, y la ruta se sigue montando por detrás en el resumen, como siempre.
- Pruebas viejas ajustadas (solo lo que cambia por esto): `pruebaFase6y_formulario.mjs` (ya no hay aviso: ahora comprueba que el paso es inmediato), `pruebaFase6y2_formulario.mjs` (la sugerencia va antes de `setPlan`, ya no de `setPicked`) y `pruebaFase6y3_formulario.mjs` (`visibleStepNamesFor(plan, step)`).

## Punto 2. El tope del pool

- `poolSelectionLimit` ahora da: 1 y 2 días, 5; 3 días, 7; 4 días o más, 8 (sin días, 5). Antes era 3 / 5 / 7. Lo usan `StepPool` (el contador «n de 8») y `TrazoFlow` (recorta lo elegido al acortar los días con `trimCuratedPlaceSelection`). El servidor no recorta lo elegido (la prueba lo comprueba).

### ¿Sale bien la ruta de 4 días con 8 sitios elegidos?

Sí. Medido con el motor de verdad (`scripts/destino/medirPool8_6y4.mjs`, el mismo `planListasTrip` que usa el servidor): 4 días, sin Free Tour, 16 conjuntos de 8 sitios (14 al azar con semilla fija, de los 20 del pool, y 2 exigentes: los 8 más pesados —Vaticanos, Borghese, Coliseo, Foro, Cúpula, Castillo, Capitolinos, Termas— y 8 repartidos por toda la ciudad), con salida cada 3 días del año 2027 (122 fechas).

| | 4 días, 8 sitios (1.952 viajes, 15.616 sitios elegidos) |
|---|---|
| Salen en la ruta | 15.614 de 15.616 (99,99 %): 8.722 por dentro y 6.892 «de camino» (los ves por fuera) |
| No salen | 2, las dos el 1 de enero («Museos Vaticanos» y «Museos Capitolinos», motivo `no_room`) |
| Zigzag (el 2-opt de pruebaFase6y_reorganizar) | 10 viajes de 1.952, TODOS con salida el 1 de enero o el 30/31 de diciembre (los que pasan por Año Nuevo, con sus cierres). Sin pool, esos mismos viajes no tienen zigzag |
| Comprobación general de la prueba de listas | 0 fallos |

Con salida cada 14 días (432 viajes) sale lo mismo: 2 sitios perdidos y 10 zigzags, otra vez solo el 1 de enero y el 31 de diciembre. Los demás días del año: 0 sitios perdidos y 0 zigzag. Con 5 sitios en 4 días (el tope de antes) también ocurre lo del 1 de enero (3 perdidos y 4 zigzags), así que no lo causa el subir a 8: es el caso Año Nuevo, que ya estaba. No lo he tocado.

Otras duraciones, por si ayudan (432 viajes cada una, salida cada 14 días):

| Viaje | Sitios elegidos | Perdidos (van a «No incluido») | Viajes con zigzag nuevo |
|---|---|---|---|
| 1 día | 5 | 1.031 de 2.160 (48 %): casi todos `no_room`; 5 `closed_on_day` | 0 |
| 2 días | 5 | 507 de 2.160 (23 %): 463 por `pool_limit` y 44 `no_room` | 51 de 432 |
| 3 días | 7 | 262 de 3.024 (8,7 %): 179 `no_room` y 83 `pool_limit` | 4 |
| 4 días | 8 | 2 de 3.456 (0,06 %) | 10 (solo Año Nuevo) |
| 5 días | 8 | 1 de 3.456 | 10 (solo Año Nuevo) |
| 6 días | 8 | 0 | 4 (Año Nuevo) |

Lo que no va bien, y NO he arreglado (como pedías):

1. **Viajes de 1 a 3 días: no cabe todo lo elegido.** Con 1 día y 5 sitios, casi la mitad de lo marcado queda en «No incluido»; con 2 días y 5, casi una cuarta parte; con 3 días y 7, casi un 9 %. Hay dos motivos: (a) el motor limita los extras del pool a 2/3/4/5 según los días (`poolExtrasLimit` en `shared/routeEngine/listasTrip.js`, que cuenta los sitios del pool que no iban ya en la ruta), y (b) simplemente no caben. Lo probé a mano subiendo ese límite a 5/5/7/8 (y lo deshice): los perdidos por `pool_limit` desaparecen pero casi todos pasan a `no_room` (en 3 días: 262 → 207, en 2 días: 507 → 159); es decir, el límite del motor no es el problema, es que el día no da más. La app avisa y no prohíbe: lo que no cabe sale en «No incluido».
2. **2 días con 5 sitios: zigzag.** En 51 de 432 viajes de 2 días (12 %) aparece un zigzag que sin pool no estaba. Al pasar de 3 a 5 en 2 días el riesgo sube. Merece una mirada del que lleve el motor (`planMustIncludePlacement` / el reparto del pool por día).
3. En los viajes de 1 día con pool sale además el fallo `foro_por_fuera` (48 de 432) de la prueba de listas.

Pregunta abierta 1: ¿subimos `poolExtrasLimit` del motor para que vaya con el tope de la pantalla? No arregla que no quepa, pero evita que sitios que sí cabrían queden fuera. Pregunta abierta 2: ¿quieres que en 1 y 2 días el tope siga en 3 mientras el motor no encaje 5? (Tú pediste 5.)

## Punto 3. «Pon tus fechas»: solo el calendario

- Antes: [Pon tus fechas] cambiaba a DÍAS y abría el calendario pequeño de la cabecera del mapa, detrás de los días. Ahora el calendario es una ventana a pantalla completa, pintada en el `body` con un portal (como los tips), con `z-index` 130 (más que cualquier otra pieza de la app; la prueba lo compara con todas las demás) y SIN cambiar de pestaña. Al guardar, quitar fechas, cerrar (✕ o Esc), el viajero sigue exactamente donde estaba.
- Una sola puerta: `useDatesCalendarStore.request()`. Ahora entran por ella, igual en todos: la cabecera del mapa (el botón destino + fechas), [Pon tus fechas] de HOY, «Cambia las fechas del viaje» de RESERVAS (la tarjeta de cuenta atrás), el aviso de la campana y «Añade un día más a tu viaje». Antes, HOY y RESERVAS cambiaban a DÍAS; ya no.
- Arreglo de paso (pregunta 9): desde RESERVAS el «¿Estás seguro?» de acortar a mano ni siquiera estaba montado (RESERVAS tiene su propio `return`); ahora el calendario y el diálogo están en los dos `return` de `RouteView`.
- El almacén `useDatesCalendarStore` cambió de `pending/clear` a `open/request/close`.

## Punto 4. Un solo calendario, el del formulario

- Saqué el calendario de `StepDates` a un componente compartido, `src/components/trazo/TrazoCalendar.tsx` (meses con la letra serif, días con el azul marino del formulario, rango en azul claro, flechas, resumen «10 mar → 14 mar · 5 días», 21 días como mucho, sin días pasados). `StepDates` (formulario) y `DatesCalendarModal` (app) usan EL MISMO; no hay copia. Se borró el calendario viejo de `react-day-picker` de la cabecera del mapa.
- La temporada: al elegir la llegada, el fondo del calendario de la app toma el color y las partículas (nieve, pétalos, hojas, chispas) de esa estación, igual que el formulario. Si ya hay fechas, sale la de su mes.
- Hace lo mismo que el anterior: elegir llegada y vuelta, y «Quitar fechas» (sale solo si ya hay fechas; si no, «Cerrar»). Una diferencia: antes se guardaba al tocar el segundo día; ahora hay un botón **Guardar** (como el «Continuar» del formulario). Si prefieres que guarde al tocar el segundo día, es cambiar una línea.
- Intacto: `useDatesChange` en `DatesChangeDialog.tsx` (el «¿Estás seguro?» de acortar a mano, `manualDuration.ts`, los avisos de fechas, rehacer la ruta de los curados). El calendario llama a la misma `onChangeDateRange` de siempre. No toqué nada de esa lógica.
- No se pudo hacer: nada; el mismo diseño sirvió. Queda `react-day-picker` solo en `DateField` (fecha de una reserva) y en `DurationSelector` (no se usa en ningún sitio): no son cambios de fechas del viaje.

## No pude verificar

- No tengo navegador: la comprobación visual a 375 px (el calendario nuevo desde HOY, que tape cabecera y barra de abajo, el fondo de temporada) la haces tú. La prueba comprueba el código (portal, z-index, una puerta, mismo componente) y pinta el calendario con el código real, pero no lo ve un ojo.
- No probé el cambio de fechas de punta a punta en un navegador (guardar un rango con una ruta curada).

## Ficheros

`src/components/trazo/TrazoCalendar.tsx` (nuevo), `src/components/route/DatesCalendarModal.tsx` (nuevo), `src/store/useDatesCalendarStore.ts`, `src/components/trazo/StepDates.tsx`, `src/components/trazo/TrazoFlow.tsx`, `src/components/trazo/planChoice.ts`, `src/components/questionnaire/CuratedPlacesPool.tsx`, `src/components/trazo/StepPool.tsx`, `src/components/route/MapDestinationHeader.tsx`, `src/components/route/RouteView.tsx`, `src/components/route/ReservasPanel.tsx` (solo `abrirFechas` y dos líneas que sobraban). Pruebas: `pruebaFase6y4_formulario.mjs` + `_6y4_formulario_entrada.tsx`, `medirPool8_6y4.mjs`.
