# Tanda 6y3, parte del formulario: acortar las fechas, barra de pasos y LandingScreen

Sin push. Solo Roma. No he tocado «Añadir parada», el Free Tour ni las fotos (son de otros).

## (a) Acortar las fechas de una ruta a mano (preguntas 7, 8 y 9)
- **Fuera** la pregunta «¿Qué hago con ellas?», sus tres botones, «Pasarlas a otro día» y el selector de día.
- **Ahora:** al poner unas fechas que dejan menos días, sale UN solo «¿Estás seguro?» (el diálogo de siempre al eliminar, `ConfirmDialog`, con [Eliminar] y [Cancelar]). Debajo dice qué días se quitan:
  - varios: «Se quitarán el vie 12 y el sáb 13, con sus paradas.»; tres: «Se quitarán el vie 12, el sáb 13 y el dom 14.»;
  - uno: «Se quitará el sáb 13, con sus paradas.»;
  - sin fechas en el viaje: «Se quitarán el día 2 y el día 3.»
  - Decido: «con sus paradas» solo sale si alguno de esos días lleva algo (paradas, comida elegida o excursión). Si todos están vacíos se dice sin eso. El diálogo es el mismo.
- **«Eliminar»:** se guardan las fechas y esos días se quitan con todo lo que tengan (paradas, comida, excursión). Las paradas ya no pasan a ningún otro día. Los días se renumeran y los nombres de la app siguen a las fechas (como antes).
- **«Cancelar»:** no cambia nada: ni las fechas ni los días.
- **Alargar:** igual que antes, días vacíos justo antes de la vuelta, sin preguntar.
- **Qué días se quitan:** el mismo orden de la 6y2 (primero los vacíos del medio, del último antes de la vuelta hacia atrás; luego los del medio con paradas; el primero y el de la vuelta solo si no queda otro).
- **Reservas (lo que hace hoy «Eliminar día», respetado):**
  - una reserva de entrada de un día que se quita NO se borra: se queda en RESERVAS, como pasa al eliminar un día. El diálogo lo dice: «Tus reservas de esos días se quedan en RESERVAS.»
  - un día fijado por una excursión reservada NO se quita (igual que «Eliminar día» lo bloquea): se quita otro día y el diálogo dice «El sáb 13 se queda, porque tiene una excursión reservada.»
- Código: `src/lib/manualDuration.ts` (`planManualResize`, `manualRemovalText`, `manualShrinkNotice`, `resizeManualRoute`), `ManualShrinkDialog` y `useDatesChange` en `src/components/route/DatesChangeDialog.tsx`, `setRouteDateRange` en el almacén (ya no recibe «decisiones»).
- **Limpiado (solo lo usaba la pregunta vieja):** `ManualDaysDialog`, `manualDaysQuestionText`, `startManualAsk`, `answerManualAsk`, `ManualAsk`, `ManualResizeQuestion`, `RemovedDayChoice`, `moveTargetOf`, el estado `manualAsk` del gancho y el parámetro `decisions` de `setRouteDateRange` y de `resizeManualRoute`.
- **`pasarAOtroDia` NO lo he borrado:** el de `HoyDurante.tsx` es de Modo Hoy (la parada «Saltada» → [Pasarla a otro día]) y se sigue usando. No es lo mismo.

## (b) La barra de pasos (pregunta 6)
- Hasta la pantalla de elegir (incluida) se cuentan los 7 del camino largo: «5/7» en elegir.
- En cuanto se toca «Quiero hacerla yo» (mientras sale el aviso corto) pasa a «5/5», y el resumen corto sigue siendo LISTO. Con «hazla por mí» sigue 6/7, 7/7, LISTO.
- Cómo: `visibleStepNamesFor(plan, step, picked)` en `planChoice.ts`: hasta elegir usa la tarjeta tocada (`picked`); después, el camino. Barra, contador y panel siguen saliendo de la misma lista.
- Detalle a saber: si el viajero vuelve atrás desde el resumen corto a la pantalla de elegir, vuelve a verse «5/7» hasta que toque una tarjeta.

## (c) LandingScreen borrado
Borrado:
1. `src/components/destination/LandingScreen.tsx` (ya no se montaba y lanzaba las sugerencias de experiencias).
2. `src/components/ui/PlaceAutocomplete.tsx` (solo lo importaba LandingScreen; lo comprobé con grep).
3. En `scripts/destino/pruebaTanda6z3.mjs`, la excepción del 🧪 para `LandingScreen.tsx`.

NO borrado, a propósito:
- `RouteSearch.tsx` (lo usa `StepRoute.tsx`), `classifyInBackground`, `suggestExperiencesInBackground`, `mapboxGeocoding`, `FlagIcon` e `Icono` (los usan otros).
- El botón «Dev: ruta rápida (sin IA)» vive en `StepRoute.tsx` y sigue (la prueba lo comprueba), igual que `DevQuickRouteScreen`.
- Quedan dos comentarios que nombran LandingScreen (`App.tsx`, `TrazoFlow.tsx`, `TransportResolutionStep.tsx`): son texto de explicación, no código.

## Pruebas
- Nueva: `scripts/destino/pruebaFase6y3_formulario.mjs` (+ `_6y3_formulario_entrada.tsx`): 964 comprobaciones, 0 fallos. Cubre la barra en los dos caminos, el aviso (varios días, uno, con y sin paradas, sin fechas, comida y excursión), «no» sin cambios, «sí» quitando con todo, alargar sin preguntar, reservas, que ya no existe «¿Qué hago con ellas?» ni «Pasarlas a otro día», y que LandingScreen y PlaceAutocomplete no existen ni se importan.
- Ajustadas por mi cambio (solo esto): `pruebaFase6y2_formulario.mjs` (y su entrada `_6y2_formulario_entrada.tsx`): quité la parte de la pregunta vieja y las comprobaciones de la barra «5/5 en elegir» (ahora las cubre la 6y3, con el valor nuevo) y quité LandingScreen de la lista de quien lanza las sugerencias; `pruebaTanda6z3.mjs`: quitada la excepción del 🧪 de LandingScreen.
- Sin tocar y a 0 fallos: `pruebaFase6y_formulario` (459), `pruebaFase6y_manual` (1706), `pruebaTanda6z6` (las cuatro partes), `pruebaCorr6z6` (las tres), `pruebaFase6z6f` (22), `pruebaTanda6s` (2511), `pruebaTanda6u` (1884 viajes), `pruebaTanda6z3` (27715). `npx tsc --noEmit -p tsconfig.app.json` limpio.

## Lo que no pude hacer ni verificar
- **No hay navegador:** nada visto en pantalla. Falta tu comprobación a 375 px de: «5/7» en elegir y el paso a «5/5» al tocar «Quiero hacerla yo», y el «¿Estás seguro?» al acortar (cómo se lee el texto largo con tres días y con el aviso de reservas). Sin capturas.
- Los toques (pulsar [Eliminar] / [Cancelar]) no se ejecutan con un DOM real. La prueba comprueba la lógica, el texto pintado y el código de los botones.
- No he tocado ni reiniciado el api-server (no hacía falta: no cambié el servidor ni los datos).
- Los commits: la primera de las tres entradas del git incluye también el borrado de los dos ficheros (estaba preparado antes), no es un fallo.

## Preguntas abiertas
1. Si TODOS los días que se quitarían estuvieran fijados por excursiones reservadas, no sale aviso y las fechas se guardan igual (el viaje queda con días de más, como ya pasaba con «Eliminar día»). ¿Prefieres un aviso específico?
2. No hay [Deshacer] tras acortar (la confirmación previa lo sustituye, como pediste). ¿Lo quieres también?
3. Las reservas de entrada de días quitados se quedan en RESERVAS fuera del viaje, sin aviso en la campana. ¿Bien así, o prefieres que se borren con el día?
