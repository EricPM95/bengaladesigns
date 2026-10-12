# Tanda 6y7, parte de las pantallas (puntos 1 a 5 y el pool con 1 día)

Prueba nueva: `API_URL=http://localhost:8833 node scripts/destino/pruebaFase6y7_pantallas.mjs` (73 comprobaciones, 0 fallos).
No hay push. Todo lo de abajo se ha mirado también a mano a 375 px (Chrome del equipo, móvil 375x812, sin nube); las capturas están en `docs/dias/img/6y7-*.jpg`.

## 1. El calendario, arriba

- Qué cambió: en `src/components/route/DatesCalendarModal.tsx` se quitó el hueco que se estiraba entre el título y el calendario. Ahora el calendario va justo debajo de «¿Cuándo estás en Roma?» y «Quitar fechas» (o «Cerrar» si no hay fechas) justo debajo del calendario.
- Es una sola implementación: todos los sitios que abren el calendario (cabecera del mapa, DÍAS/RUTA, RESERVAS) piden lo mismo con `useDatesCalendarStore.request()` y pintan este mismo modal.
- El formulario (`StepDates`) no se tocó: sigue con su hueco, el calendario abajo y «Aún no sé mis fechas» y «Continuar». Comparte `TrazoCalendar` pero el hueco es de cada pantalla, así que no se rompe.
- Visto a 375 px: `6y7-calendario-arriba.jpg` (el calendario empieza justo bajo el título; «Quitar fechas» pegado debajo; el resto de la pantalla queda vacío abajo).

## 2. Fuera la pantalla vieja «Creando tu ruta»

- Qué cambió: `regenerateRouteForDates` (en `useRouteStore.ts`) ya no pone `screen: 'loading'`. Marca `rehaciendoRuta: true` y el viajero se queda donde estaba (misma pantalla y misma pestaña). Una pieza nueva, `src/components/route/RehacerRuta.tsx` (montada una vez en `App.tsx`), rehace la ruta en segundo plano con la misma generación de siempre y, al acabar, la pone con `setRoute` (conserva reservas, wishlist, días libres y días añadidos, y ahora también la pestaña en la que estaba el viajero).
- Lo que se ve: una pieza compartida, `src/components/ui/ActualizandoRuta.tsx`: una barrita de 3 px arriba del todo y una pastilla pequeña «Actualizando tu ruta…». No tapa ni bloquea nada. Si el rehacer falla, la pastilla dice «No se pudo actualizar tu ruta.» con «Reintentar» y «Dejarla como estaba» (`dejarRutaComoEstaba()` en el almacén; la ruta queda tal cual).
- Mientras hay un rehacer en marcha, otro cambio de fechas no lo pisa (se ignora). Abrir otro viaje o empezar uno nuevo lo corta.
- Visto a 375 px: `6y7-cambiar-fechas-sin-pantalla-vieja.jpg` (barrita arriba y «Actualizando tu ruta…» sobre la pantalla de RUTA) y `6y7-tras-cambiar-fechas.jpg`. En la prueba a mano, el texto «Creando tu ruta / Organizando el mejor viaje / Ajustando según tu vehículo» no salió en ningún momento. En Roma el rehacer dura menos de un segundo (el motor no llama a Claude), así que la barrita se ve muy poco; en otros destinos con más espera se vería más.
- DÓNDE SALÍA LA PANTALLA VIEJA (se miraron todos los `setScreen('loading')` y `screen: 'loading'` de `src`):
  1. **Cambiar las fechas dentro de la app** (calendario → `useDatesChange` → `regenerateRouteForDates`, tanto el camino directo como el «Sí, ajústala» después de haber editado el viaje). Es el único caso de «rehacer o cambiar algo». Ahora lo sustituye la barrita.
  2. **Abrir un enlace compartido** (`App.tsx`, `decodeTripFromUrl` → `setScreen('loading')`). SIGUE saliendo: es crear un viaje desde un enlace, no rehacer ni cambiar nada, y no hay pantalla previa donde dejar al viajero.
  3. **Retomar una generación a medias al abrir la app** (`TripSync.tsx`, `setPendingResume` + `setScreen('loading')`). SIGUE saliendo por lo mismo.
  - No la usaban (comprobado): la creación inicial desde el formulario (usa `StepSummary`, la barra 7/7 → «Tu viaje está listo»), reabrir un viaje guardado (`hydrateTrip`, directo), acortar o alargar días (en la ruta a mano es local; en las curadas es el cambio de fechas), «Ajustar mi ruta a mi vuelo» y el resto de rehacer días (`rebuildDay`, locales), y la ruta a mano.
  - PREGUNTA para Eric: ¿quitamos también la pantalla vieja de los casos 2 y 3? Hoy no tienen otra cosa donde dejar al viajero; habría que decidir con qué se sustituye (por ejemplo, el resumen del formulario con las fases reales).

## 3. La ficha: el hueco bajo el tirador

- Causa: el tirador (20 px) subía 28 px sobre el mapa (`-mt-7`) y tenía su propio fondo; el mapa seguía pintado 8 px por debajo del tirador, entre el tirador y el título.
- Qué cambió (`StopDetailSheet.tsx`): el panel es ahora UNA pieza que sube 28 px, con el fondo, las esquinas redondas y la sombra; el tirador va dentro (sin fondo ni margen propios) y la zona que se desplaza es el resto del panel. Las otras fichas (llegada, comida) no usan ese solape y no tenían el hueco.
- Visto a 375 px: `6y7-ficha-sin-hueco-media-altura.jpg` y `6y7-ficha-sin-hueco-entera.jpg` (tirador arrastrado hasta arriba): el fondo del panel llega hasta el borde de arriba en las dos.

## 4. «Escuchar historia», sin «Voz del móvil»

- Qué cambió (`src/components/route/hoy/Escuchar.tsx`): el texto de la derecha de la barra ya no pone «Voz del móvil» cuando está parada; solo sale «Leyendo…» o «En pausa» mientras suena. Queda «Escuchar historia», el botón redondo y la barra de lo que lleva (y la cruz para parar). También se cambió un comentario de `StopDetailSheet.tsx` que nombraba la voz del móvil, para que no salga en ninguna parte de `src`.
- Pruebas: ninguna de las anteriores miraba ese texto (no hubo que ajustar nada); la nueva busca «Voz del móvil», con o sin mayúsculas, en todo `src`.
- Visto a 375 px: `6y7-barra-sin-voz.jpg` (el texto de la barra es solo «Escuchar historia»).

## 5. El mapa del Perfil

- Causa (medida en el navegador): Mapbox le pone `position: relative` al contenedor de su mapa (en su hoja de estilos) y anulaba el `absolute inset-0` del mismo elemento; el contenedor quedaba con 12 px de alto (la chincheta) y el mapa salía como una franja. No era el tamaño al crear.
- Qué cambió (`src/components/perfil/MapaMisViajes.tsx`): el recuadro que se estira (`absolute inset-0`) rodea a un contenedor a `h-full w-full` que es el de Mapbox. Además el mapa se ajusta (`map.resize()`) nada más montarse, al cargar, cuando cambia la caja (`ResizeObserver`, que ya estaba) y al girar el móvil (`orientationchange`), y se sueltan los escuchadores al cerrar.
- Visto a 375 px: antes, el mapa medía 341 x 12; ahora 341 x 284 (el recuadro mide 286 con el borde), al abrir el Perfil, al volver a abrirlo (dos veces seguidas), al girar a horizontal (778 x 284) y al volver a vertical. Captura: `6y7-perfil-mapa-lleno.jpg`.

## 10 (solo el pool). El pool con 1 día no sale

- `poolSelectionLimit` (`CuratedPlacesPool.tsx`): 0 con 1 día (la rama vieja de «2 sitios» ya no existe), 3 con 2 días, 6 con 3 o más, 3 sin días.
- `planChoice.ts`: nueva `usesPool(plan, días)` = la ruta no es a mano Y el tope es mayor que 0 (una sola regla, la del tope; no se repite «1 día» aparte). `stepNamesFor` y `visibleStepNamesFor` aceptan los días y, con 1 día, la barra del camino largo cuenta uno menos (sin «Lugares»).
- `TrazoFlow.tsx`: de las experiencias va directo al resumen con 1 día y no pinta el paso de lugares; la barra y el panel cuentan con los días. `StepSummary.tsx`: con 1 día la fila «Lugares» tampoco sale.
- Recorte al acortar: con 1 día la selección del pool curado queda vacía (ya lo hacía `trimCuratedPlaceSelection` con el tope nuevo). Cosa que NO se tocó: la selección de destinos no curados (`selected_place_ids`) nunca se recortaba por días; con 1 día el paso no sale pero una selección vieja de antes de acortar seguiría. Es poco probable y está así desde antes; lo dejo apuntado.
- Visto a 375 px: con 1 día (puesto por «Aún no sé mis fechas», porque el calendario no admite el mismo día de llegada y vuelta) la barra marca 6/6 en las experiencias y LISTO en el resumen, sin «Lugares» (`6y7-formulario-1-dia-barra-6-de-6.jpg`, `6y7-formulario-1-dia-sin-pool.jpg`). Con 2 días: 6/7 en las experiencias y 7/7 en «Elige lo que siempre soñaste ver en Roma», con «0/3» (`6y7-formulario-2-dias-con-pool.jpg`).
- Las medidas del motor de `pruebaFase6y5_motor.mjs` (con `n = dias === 1 ? 2 ...`) son del motor y no se tocaron.

## Pruebas

- Nueva: `scripts/destino/pruebaFase6y7_pantallas.mjs` (+ `_6y7_pantallas_entrada.tsx`): 73 comprobaciones, 0 fallos. Cubre cada punto: orden título, calendario y botón de abajo (con y sin fechas) y el diseño del formulario; el almacén que ya no cambia de pantalla, la barrita y su error, dejarla como estaba, el cambio de pestaña conservado, que la pantalla vieja solo se pone desde enlace compartido y generación a medias, y una sola pieza para la barrita; el panel de la ficha (tirador dentro, sin fondo propio); «Voz del móvil» fuera de todo `src`; el mapa del Perfil (contenedor sin `absolute`, resize al montar, al cargar, al cambiar la caja y al girar); el pool (tope, barra 6/6 y 7/7, resumen, salto, recorte).
- Ajustadas lo mínimo (las demás no cambiaron):
  - `pruebaFase6y4_formulario.mjs`: la tabla del tope y el recorte, de «1 día = 2» a «1 día = 0».
  - `pruebaFase6y6_cierre.mjs` (parte 2): comprueba `if (days === 1) return 0` en vez de `return 2`.
  - `pruebaFase6y3_formulario.mjs`: la barra se saca de `visibleStepNamesFor(plan, step, null, answers.days)`.
  - `pruebaFase6y_formulario.mjs`: el paso de lugares se pinta con `withPool` (que ya incluye «no ruta a mano»), y `regenerateRouteForDates` mira también `state.rehaciendoRuta`.
- A 0 fallos con la tuya: `pruebaFase6y4_formulario/_presupuesto/_perfil/_ficha/_reservas`, `pruebaFase6y5_pantallas/_historias`, `pruebaFase6y6_cierre`, `pruebaFase6y3_*`, `pruebaFase6y2_*`, `pruebaFase6y_formulario`, `pruebaCorr6z6*`, `pruebaTanda6z6a-d`, `6z3` (vigila emojis y colores), `6z5`, `pruebaFase6z6e/f/fWikimedia`, `pruebaFotos6z3`. Typecheck (`tsc -p tsconfig.app.json`): limpio.

## Qué NO se pudo ver / límites

- Se vio todo lo pedido a 375 px. La barrita de «Actualizando tu ruta…» se ve muy poco en Roma porque el rehacer es instantáneo; el aviso de error («No se pudo actualizar tu ruta.») se comprobó con la prueba de pintado, no con un fallo real.
- WebGL del Chrome sin pantalla va por software: el mapa del Perfil se ve, pero lento y sin tiles perfectos; el tamaño y el llenado son los de verdad.
- Los días de la ficha y el título de cada día los tocan otros agentes (títulos de los días, historias): no se miraron aquí.
