# Notas de HOY v2 (Tanda 8B)

## Qué hay hecho y dónde está
Todo va detrás del interruptor `hoyV2Activo()` (`src/lib/hoyV2.ts`; local: `?hoy2=on` / `?hoy2=off`). Apagado, HOY es exactamente el de antes (comprobado). `HoyView` elige: con el interruptor encendido pinta `src/components/route/hoy/v2/HoyV2.tsx`.

Archivos nuevos en `src/components/route/hoy/v2/`:
- `HoyV2.tsx`: antes / durante / después y la pregunta de las 12:00 (P10).
- `HoyAntesV2.tsx`: pantallas 1a y 1b (cuenta atrás o «Pon tus fechas», lo que da HOY, tarjeta del Pase) y la cabecera pequeña de cada día.
- `HoyDuranteV2.tsx`: pantallas 2, 3, 3b, 3c, 4, 5 y la lista. Usa la misma lógica de siempre (Visto, No me da tiempo, Cómo llegar, Escuchar historia, avisos, lluvia, más visitas, billete, ficha de llegada y vuelta).
- `HojasV2.tsx`: hoja 7 («¿Qué hacemos con esta parada?» + «Mover a»), 8 («Más para tu día»), 11 («Sobre este lugar») y P10.
- `TarjetasPase.tsx`: P3 (día de llegada sin pase) y la tarjeta de la pantalla 12.
- `ParadaFoto.tsx`: la pieza «Parada con foto» (miniatura WebP `/fotos/<destino>/mini/…`; a color con ✓ si está vista, apagada si está por ver; sin foto propia, un color suave por nombre).
- `ExtraDeParada.tsx`: punto de extensión VACÍO para el agente del Visto. Se usa en la tarjeta (`contexto="tarjeta"`) y en cada fila de la lista (`contexto="fila"`). Los botones [Visto] y [Añadir foto] siguen llamando a `setStopVisto` como antes.
- Nuevo fuera de la carpeta: `src/lib/paseEstado.ts` (estado del pase para HOY).

## El pase
- Cobro apagado, sin servidor o sin cuenta: todo abierto (no se ve nada de pase salvo en la pantalla 1a/1b, que sin cobro no lleva ni la insignia ni el botón).
- Con cobro: `GET /api/pase/estado?trip_id=…`. Sin pase y día de llegada: tarjeta P3. Prueba gastada (`hoy.puede` falso): solo la tarjeta de la 12. Día de prueba con todo visto: tarjeta de la 12 encima de la lista.
- La pregunta de las 12:00: hoja P10 cuando `useLogrosStore.pregunta` tiene algo; [Hoy]/[Mañana] llaman a `responderPregunta(tripId, …)`.
- Parámetro de desarrollo (solo `import.meta.env.DEV`, se recuerda en la sesión): `?pase=sin|prueba|con|pregunta` (y `?pase=off` lo quita).
- [Ver el pase] / [Seguir con HOY] lanzan el evento de pago de la app (`pedirPago`); aún no hay pantalla de compra que lo escuche.

## Capturas (`docs/dias/capturas_8b/`, formato .jpg, escala móvil 375 px)
1a, 1b, 2, 3, 3b, 3c, 4, 4b (tarde de la vuelta), 5, 7, 7b («Mover a»), 8, 11, lista, P3, P10, 12 (día de prueba con lista), 12b (prueba ya gastada). Me guardé los archivos copiándolos desde la carpeta de capturas del panel.

## Lo que no es igual que el diseño, y por qué
- Sin el chip del tiempo («—°») ni la campanita dentro de HOY: la cabecera de la app (RouteView) es de todas las pestañas y no la he tocado.
- Sin arrastrar para ordenar en la lista de HOY (el asa de seis puntos del diseño): no está hecho; en DÍAS sí se reordena.
- Las listas de las pantallas 3b/3c/4 se ven con los datos de prueba de la ruta rápida (sin «Hoy cierra» ni lluvia reales).
- La hoja 8: la fila añadida se queda con «✓ Añadida»; el [Deshacer] es el aviso de siempre de la app (abajo), no uno dentro de la fila.
- La hoja 11: «Por qué» (la primera sección del diseño) no existe como dato; salen «Qué es», «Qué vas a ver» y «Por qué te lo recomendamos» (el texto nuestro de `por_que_recomendamos`).
- El «Después del viaje» (sello, logros secretos, «Ver mis recuerdos», «Crea tu cuenta») no está: HOY sigue usando el de antes, porque depende de los dibujos de los logros que pone otro agente y los emblemas nunca se ven antes de ganarlos.
- El reloj de «Ubicación» ahora pone el rótulo «N min andando» solo cuando el viajero comparte su ubicación (antes también salía «desde la parada anterior»).
- Las pantallas 9, 9b y 9c (Visto con logro, cámara, galería) NO son de este encargo: son del agente del Visto.

## Textos que he puesto yo
- «Tu día de prueba» (etiqueta pequeña de P10 y de la 12) y «Te queda medio día.» / «¿Usas hoy tu día de prueba…?» salen de la pregunta del servidor y del diseño.
- «De este sitio todavía no tenemos más que contarte.» (hoja 11, si un sitio no tiene nada).
- «Tienes la entrada reservada a las {hora}.» (hoja 7, sitio reservado: solo [Saltar igual]; no se puede mover).
- «Hoy · {día}» como etiqueta de P3.

## Ediciones en archivos compartidos
- `src/components/route/hoy/HoyView.tsx`: dos imports y una línea (`if (hoyV2Activo()) return <HoyV2 …/>`). Nada más.

## Sin hacer / por mirar
- El orden de la lista (comida y cena) usa `mealAfter` o la hora; no he probado con una ruta real de v4.
- «Tu ruta empieza en…» necesita que `paradasParaElTitulo` dé la primera parada real; probado con datos de prueba.
- «La maleta» del día de vuelta sale de los datos de llegada/vuelta del destino (solo si hay).
- No he probado la compra, el servidor del pase ni el Visto con cuenta real (solo `?pase=` y datos de prueba).

---

# 8B2 (arreglos de Eric)
1. **Avisos del día con cruz** (zona de toque de 44 px): al cerrar uno no vuelve ESE día; se guarda por viaje + día en `localStorage` (`trazo:hoy:avisos-cerrados:<viaje>:<día>`, con try/catch).
2. **Fuera «Tu ruta empieza en…».**
3. **Fuera la etiqueta «Saltada»:** la parada ya sale tachada y con [Recuperar].
4. **Mapa pequeño:** alejado (zoom 13: se leen «Vatican City», «Saint Peter's Basilica», «Castle of…»). El texto «© Mapbox © OpenStreetMap» ya no tapa el mapa: va con la «i» (la zona de toque es de 44 px); al tocarla sale el texto pequeño. La imagen se pide con `attribution=false` y el crédito sigue accesible.
5. **Título del día de llegada:** «Centro histórico» (si el título del día es el trayecto «Madrid → Roma», se usa el nombre de la zona del día, y el trayecto va pequeño debajo). El «Madrid → Roma» de mi primera captura era porque aún no habían llegado los datos del destino.
6. **HOY de después:** con los logros encendidos (`HoyDespuesV2.tsx`) abre el resumen del viaje de «Logros · Momentos» (`useMomentosUI.abrirResumenViaje()`; una vez por viaje y sesión) y deja [Ver el resumen de mi viaje]. Con los logros apagados, el de siempre. La pieza del resumen, en la captura, todavía la está terminando el agente de momentos (sale «undefined esconde 12 secretos»): no es de HOY.
7. **Fotos:** ver `docs/dias/notas_8b/fotos.md` y `scripts/destino/auditoriaFotos.mjs`. La foto de Navona = Trevi era mi dato de prueba, no el mapeo.
8. **Fechas:** todo usa `route.answers.dateRange` (la cabecera de la app). El «17 – 19 oct» de mi tarjeta salía de contar solo los días de ruta sin el de vuelta; ahora 1a dice «17 – 20 oct» arriba y en el modo de pruebas, y «Tu viaje a Roma · 4 días · 3 noches · 17 – 20 oct» en el HOY de después. La ruta rápida de desarrollo no cambia (ya ponía inicio + días − 1).
9. **Con `?hoy2=on` el HOY viejo no sale por ningún camino** (`HoyView` es el único sitio que lo monta). La fila vieja «Visto: … Añadir foto» ya se oculta con logros (cambio del agente del Visto, en mi archivo).
10. **Capturas nuevas** (JPG, sustituyen a las de antes): 1a, 2, 2b (aviso cerrado + crédito del mapa), 3, 3b, lista (parada saltada sin etiqueta), despues, despues-resumen.
- Aviso: en el panel del navegador otro agente me navegó mi pestaña (`tab-3`); acabé con una pestaña nueva (`tab-6`).

---

# 8B3
- **Avisos de otro día (B):** los avisos de cierre salen solo de `day.stops` (las paradas del día de hoy: `avisosDeCierre` recibe `vigentes` de ese día). Con el viaje único el día 1 (sáb 17) da exactamente 3: Coliseo 18:30, Panteón 19:00 y Basílica de San Pedro 20:00, que son paradas de ese día. El «Basílica … 20:00» del domingo que se veía en V2 era de la ruta de prueba del Visto, que ponía esa parada en el día 1. Con otro día, otros avisos (probado con el día 2 de las pruebas anteriores: solo sus paradas).
- **«0min» (C):** ningún chip enseña una duración de 0: ficha (`StopDetailSheet`), tarjeta de DÍAS (`StopAccordion`, dos sitios), «Si te sobra tiempo» (`SpareStopsSection`), la tarjeta de HOY v2 y «Más para tu día». Ediciones mínimas en esos tres archivos compartidos.
- **Fotos (D):** ver `docs/dias/notas_8b/fotos.md`, sección 8B3. HOY v2 pide la foto al servidor si la parada viene sin ella (`v2/useFotoDeParada.ts`) y la lista de paradas enseña también las fotos de Unsplash/Wikipedia (antes solo las propias).
- **Viaje único (A):** usado `await window.__rutaPrueba()`. Edité `src/dev/rutaDePrueba.ts` (tuyo): ahora llama a `enrichRoutePhotos(ruta)` para que las paradas lleven foto como en un viaje de verdad.
- **Capturas nuevas** (JPG, del viaje único, sin duplicados entre ellas): 1a, 2 (sáb 17 con los 3 avisos), hoy-coliseo (el Coliseo como siguiente parada, con su foto y sin «0min»), lista (cinco fotos correctas). Comprobación de duplicados: quedan dos pares idénticos que NO son míos: `CS-coliseo-01-visto-aviso.jpg` = `V5.jpg` y `V6.jpg` = `plazo.jpg`.
- Pestaña del panel: acabé en `tab-4` (otro agente volvió a cambiarme la anterior); el api-server lo reinicié yo al tocar `server/index.js` y los datos.
