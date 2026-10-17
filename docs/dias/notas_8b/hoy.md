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
