# Tanda 6y, parte A: la pantalla de elegir y la creación de la ruta a mano

Rama de trabajo: `worktree-agent-ae2bb698dce6cbd71`. Tres commits locales, sin push. Lo de «Reorganizar» (B) y el interior de los días (C) no se ha tocado.

## Lo que se ha hecho, en palabras sencillas

### 1. La pantalla de elegir
- Va justo después de «quién viaja» y antes de las experiencias. Es un paso nuevo del formulario (`StepElegir.tsx`).
- Textos tal cual el prompt: «Roma · 5 días» arriba, «¿Te montamos el itinerario día a día?» con «día a día» en frambuesa, la tarjeta oscura «¡Sí, hazla por mí!» con «RECOMENDADO» y la flecha, y la tarjeta blanca «Quiero hacerla yo» con el lápiz. El mapa dibuja los tres días como en el diseño. Iconos de la familia fina (se añadió `flecha` a `iconos.ts`).
- Al tocar sale un aviso corto («Creando tu itinerario…» o «Preparando tu viaje…»), la tarjeta se queda pulsada 0,7 s y se pasa a la pantalla siguiente.
- «¡Sí, hazla por mí!» sigue como hoy: experiencias, lugares, resumen y la ruta que se monta por detrás.
- «Quiero hacerla yo» salta experiencias y lugares y va a un resumen corto (`StepManualSummary.tsx`): destino, fechas, estación, quién viaja, transporte y duración, y el botón «Empezar mi ruta». No sale nada de experiencias ni de sitios.
- Flechas de atrás: elegir vuelve a «quién viaja»; las experiencias y el resumen corto vuelven a elegir; el resumen que está montando la ruta sigue sin flecha.
- La barra de pasos, el contador, el panel lateral y las fichas del viaje siguen la ruta elegida: con la ruta a mano son 5 pasos (sin Experiencias ni Lugares) y la ficha «Ruta a mano»; con «hazla por mí», los 7 de siempre.
- Todo lo que decide el camino está en un solo sitio sin React (`planChoice.ts`): a dónde se va, la flecha de atrás, los nombres de los pasos y cuándo se monta la ruta por detrás. La ruta solo se monta en el resumen de siempre y solo en «hazla por mí» (`shouldGenerateRoute`).

### 2. La creación de la ruta a mano
- `src/lib/manualRoute.ts` tiene `buildManualRoute(...)`, una función pura: sin red, sin Claude, sin motor, sin caché de rutas. «Empezar mi ruta» la llama, la abre con `setRoute` y pasa a la pantalla de la ruta.
- La ruta sale con `planMode: 'manual'`, el mismo viaje del formulario (destino, origen, fechas, días, quién viaja, mes, medio de ida y de vuelta) y los días vacíos: cada día `dayType: 'manual'`, `stops: []`, `meals: []`, con su país y su ciudad. Ninguna parada, ninguna comida, ninguna cena y ninguna «Llegada a…».
- Nombre de cada día: por su fecha («lun 13 oct») con fechas, y «Día 1», «Día 2»… sin ellas. Se pueden renombrar con la ventana de siempre (los tres puntos del día, `DayNameSheet`). Si después se ponen o se cambian las fechas, los días que aún se llaman como los puso la app siguen a las fechas nuevas; los que el viajero renombró se quedan.
- Sin experiencias ni sitios elegidos: `experiencesPositive`, `experiencesNegative` y `experiences` vacíos, sin `mustIncludePlaces`, sin hora de Free Tour ni medio día guardados de un paso anterior.
- Los días son los de las fechas si las hay, y si no los que eligió (de 1 a 14).
- Se añadió `transportContextOf(...)` (en el mismo módulo) y `useRouteGeneration` lo usa también: el contexto de transporte del store se arma en un solo sitio.
- El guardado en Supabase no necesita nada nuevo: la ruta es un `Route` normal que va en el jsonb `route` (la prueba la guarda y la recupera con `hydrateTrip` y comprueba que sigue siendo manual y vacía). El autoguardado hace el insert la primera vez, como con cualquier ruta.
- La caché de rutas (`/api/route-cache/*`) solo la usa `routeGenerationOrchestrator.ts` (lo vigila la prueba): la ruta a mano nunca la lee ni la escribe.

Sitios del cliente que, con una ruta a mano, habrían llamado al motor y pisado los días del viajero. Cerrados cada uno en UN sitio con `planMode === 'manual'`:
- `rebuildDay.ts` (`rehacerDiasSinTocar` y `rehacerDiaConReservas`): los usan una reserva grande, quitar una reserva y la hoja del Free Tour; ahora no hacen nada en la ruta a mano.
- `AddReservationSheet.tsx`: ya no pide `/api/reservation-plan` en la ruta a mano (así no sale la hoja de «mover el día»).
- `DatesChangeDialog.tsx` y `regenerateRouteForDates` (store): cambiar las fechas desde el mapa en la ruta a mano solo guarda las fechas, nunca rehace el viaje ni abre la pantalla de carga.

### 3. Sin experiencias: qué las usaba y qué hace ahora

| Sitio | Qué hacía con las experiencias | Qué hace ahora, sin ellas |
|---|---|---|
| `TrazoFlow.tsx` (`confirmExperiences`) | Las guarda; si no hay, pone «Imprescindibles». | Solo se ejecuta en «hazla por mí». La ruta a mano no pasa por aquí. |
| `StepExperiences`, `StepPool` | Eligen experiencias y lugares. | No se pintan en la ruta a mano. |
| `StepSummary` | Lista las experiencias y los lugares elegidos. | Solo en «hazla por mí». El resumen corto no las nombra. |
| `routeGenerationOrchestrator.ts` | La clave de la caché de rutas (`experiencesPositive ?? ['imprescindibles']`). | No se llama en la ruta a mano. |
| `PlaceExplorerScreen` («También te puede interesar») | Sugiere lo que encaja con las experiencias elegidas. | Con la lista vacía no sugiere nada (comprobado: no sale el apartado). Era justo lo que el prompt no quiere en la ruta a mano. |
| `FreeTourSheet.routeHasFreeTour` | Mira si `free_tour` está en las experiencias. | Con la lista vacía, «no lleva Free Tour»; el resto de la hoja funciona. `setFreeTourChoice` (store) ya parte de una lista vacía. |
| Servidor (`server/engine`, `routeAlgorithm.js`, `reservationPlan.js`) | Temas, temporada y Free Tour para armar los días. | Todos aceptan lista vacía o ausente (`?? []`, `Array.isArray`). `/api/reservation-plan` se probó con una ruta sin experiencias: 200. En la ruta a mano no se llama de todos modos. |
| Temporada (`seasonalAvailability`, `experiencesInSeason`) | Solo filtran las experiencias elegidas. | Sin experiencias no hay nada que filtrar: sin errores. |
| `DevQuickRouteScreen` | Pone `['imprescindibles']`. | Sin cambios (es la pantalla de desarrollo, y se queda). |

La prueba tiene una auditoría que falla si aparece un sitio nuevo del cliente que lea las experiencias sin estar en esta lista.

### 4. Pruebas
- Nueva: `scripts/destino/pruebaFase6y_formulario.mjs` (+ `_6y_formulario_entrada.tsx`): 459 comprobaciones, 0 fallos. Cubre el camino del formulario (sin ruta por detrás en ningún paso del camino a mano), la pantalla de elegir (textos exactos, tarjetas, iconos), el resumen corto, la ruta a mano de 2, 3, 4 y 5 días con y sin fechas (también cambiando de mes) en la gratis y en la de pago, el guardado y la recuperación, los nombres por fecha y su cambio, la cuenta de llamadas al servidor (0 a la generación, al motor o a la caché al crearla, renombrar, cambiar fechas, añadir/quitar una reserva grande y poner el Free Tour; con una comprobación de control: la ruta nuestra SÍ llama), y DÍAS, RESERVAS, EXPLORAR y la hoja del Free Tour pintándose sin errores, sin «Te falta…», sin sugerencias, sin «Si te sobra tiempo», sin «Llegada a…» y sin horas a la vista. Se comprobó que falla si se quita la protección de `rebuildDay.ts`.
- Existentes, todas a 0 fallos sin tocarlas: `pruebaTanda6z5`, `pruebaTanda6z6` (6z6a-d), `pruebaCorr6z6`, `pruebaFase6z6f`, `pruebaTanda6s`, `pruebaTanda6u` (1884 viajes). `npx tsc --noEmit -p tsconfig.app.json` limpio.

## Lo que no se pudo hacer o verificar
- No hay navegador: **no se ha visto nada en pantalla**. Falta la comprobación visual a 375 px (y en escritorio) de la pantalla de elegir, el aviso, el resumen corto, las flechas de atrás y la barra de pasos de 5 y de 7. Lo más probable de ajustar: la altura del mapa dibujado (`clamp(150px, 27dvh, 236px)`) y que todo quepa sin desplazar en móviles bajos (la pantalla se desplaza sola si no cabe).
- Los pines del mapa dibujado van con la animación `trazo-pin` (pin con escala desde el centro de cada pin); hay que ver que aparecen donde toca.
- El flujo de pantallas (tocar → aviso → siguiente) no se ha ejecutado con un DOM real (no hay jsdom): la prueba comprueba la lógica y el código, no los toques.
- `Route.planMode` **no estaba en este worktree** (el prompt decía que ya existía): solo estaba en el árbol de trabajo del repo principal sin commit. Se ha añadido la misma línea en `src/lib/types.ts` (justo detrás de `isDevQuickRoute`); al unir ramas puede salir un conflicto trivial: vale con quedarse con una.

## Cosas que B/C o el orquestador deben saber
- El primer y el último día de la ruta a mano salen en DÍAS como en la nuestra: «Madrid → Roma · Día de viaje» y «Roma → Madrid · Día de viaje» (lo hace `computeDayTravelInfo`), con su ficha de la fecha («LUN 13»). Los de en medio salen con su nombre («mar 14 oct»). El prompt dice que «se llaman como en nuestra ruta»; lo he dejado así. Ver pregunta 1.
- Sigue habiendo dos caminos hacia el motor desde un día de la ruta a mano que NO he cerrado porque son del interior de los días / HOY: `adjustDay.ts` (HOY: «Vas justo» y «Estoy cansado» sustituyen el día con `/api/adjust-day`) y `WantInsideDialog.tsx` («Quiero entrar» rehace el día con `/api/curated-day-inside`). Si un día a mano los dispara, el motor pisaría el día del viajero. Hay que cerrarlos con la misma regla (`planMode === 'manual'`) o decidir otro comportamiento.
- `fitDayToTrip` (RESERVAS: hora del vuelo) reordena y recorta las paradas de un día con paradas: en la ruta a mano rompería «el orden del viajero». También del interior (C).
- Una reserva grande en la ruta a mano ya no mueve ni rehace nada (ver arriba); `reapplyReservations` sí la coloca como siempre.
- `timesAreFinal` no se pone en los días de la ruta a mano. Si C lo necesita para el panel del día (en `DevQuickRouteScreen` se pone para no llamar a Claude al abrir una ficha), ojo: `DatesChangeDialog` ya no lo mira para las rutas manuales.

## Preguntas abiertas
1. El primer y el último día de la ruta a mano, ¿con «Madrid → Roma / Día de viaje» como en la nuestra, o con su fecha («lun 13 oct») como los demás? Ahora mismo, como en la nuestra.
2. Si el viajero cambia las fechas de una ruta a mano y el rango tiene otra duración, hoy se quedan los mismos días (solo cambian los nombres). ¿Quieres que añada o quite días vacíos para que coincida?
3. El aviso de la pantalla de elegir dura 0,7 s antes de pasar (el diseño lo deja 2,2 s sin pasar). ¿Te vale?
4. En las fases anteriores al fork (al elegir el destino) siguen lanzándose en segundo plano la clasificación y las sugerencias de experiencias, porque aún no se sabe qué camino va a elegir el viajero. No he comprobado cuánto cuestan en Roma (pueden estar en caché); son llamadas que la ruta a mano no necesita. ¿Las dejo?
5. Los pines y números de la ilustración son decorativos (siempre tres días de 4-5 puntos); no cambian con los días del viaje.
