# Informe de la Tanda 6y5, parte de las pantallas (punto 2, punto 3 y arreglos P8 a P28)

Palabras sencillas. Prueba nueva: `scripts/destino/pruebaFase6y5_pantallas.mjs` (con `_6y5_pantallas_entrada.tsx`): 247 comprobaciones, 0 fallos. Se ejecuta con `API_URL=http://localhost:PUERTO node scripts/destino/pruebaFase6y5_pantallas.mjs`.

## Punto 2. La ida y la vuelta abiertas
Código: `src/components/route/reservas/LlegadaYVuelta.tsx` (`MitadAbierta`), `src/lib/reservasLegs.ts`.
- La tarjeta blanca ya tenía la cabecera «Ida · Mar 10 ago» / «Vuelta · Sáb 14 ago» (sin fechas, «Día 1» / «Día 5»), el origen a un lado, la pregunta al otro (al revés en la vuelta), el arco de puntos con el círculo oscuro y los botones del punto. Se ha comprobado que coincide con el diseño y se ha dejado.
- Nuevo: las **cuatro casillas en dos columnas**: «Llega» (en la vuelta «Sale»; abre la rueda de la hora de siempre, ahora SOLO la rueda), «Precio» (abre `HojaPrecio`; va al presupuesto con su pastilla como antes), «Ref. vuelo / Ref. tren / Ref. billete» (el código de la 6y4, `arrivalCodigo`/`departureCodigo`, sin duplicarlo; se guarda al salir del campo) y «Aerolínea / Compañía / Naviera» (campo nuevo).
- Los nombres de las casillas salen de un solo sitio, `legWord` (`reservasLegs.ts`).
- Campo nuevo `arrivalCompania` / `departureCompania` en la ruta (`types.ts`), con `setLegCompania` en el almacén; se borra al quitar el tramo. Como va dentro de la ruta, se guarda con el viaje y se abre con `hydrateTrip` sin tocar `tripPersistence` ni `TripSync` (la ruta ya la vigilan). Un viaje guardado antes simplemente no lo trae (probado).
- La hoja de la hora ya no lleva precio ni código (se movieron a las casillas). `HojaPrecio` admite ahora una frase de ayuda propia (`ayuda`).
- Las filas cerradas no cambian y no llevan ninguna hora calculada (probado: las únicas horas que salen son las dos del viajero; nada de «libre hacia…»). Sin nombres de empresas.
- Cambio de comportamiento a tener en cuenta: tras guardar la hora el tramo se cierra (como antes), así que referencia y compañía se rellenan abriendo el tramo con «Cambiar».

## Punto 3. «Ver más excursiones»
Solo había un sitio con el texto viejo: `ExcursionesReservas.tsx` (botón y comentario). Los otros dos ya decían «Ver más excursiones». Probado que no queda «Ver otras excursiones» en `src`. La prueba `pruebaTanda6v` esperaba el texto viejo y se ha ajustado.

## Arreglos pequeños
- **P8 calendario sin botón.** `DatesCalendarModal.tsx` ya no tiene [Guardar]: guarda al tocar el segundo día. Para que sea una sola implementación, la regla del toque se sacó a `src/lib/dateRange.ts` (`tocarDiaDelRango`, `rangoCompleto`) y la usan `TrazoCalendar` (el del formulario y el de dentro de la app son el mismo) y el modal. El formulario sigue con su «Continuar». Se queda «Quitar fechas» / «Cerrar».
- **P9** ya estaba así (`alojamientoCubierto`: de pago, un destino y zona elegida cuenta; igual que RESERVAS). Comprobado, sin cambios.
- **P10.** «Lo tienes · Mi banco · 30 €» (los dos) en seguro y eSIM (`UtilParaElViaje.tsx`). Con los dos, no cabe la palabra «Cambiar» en la tarjeta de 220 px: se quita, la tarjeta entera sigue siendo el botón. Solo lugar o solo precio, como antes.
- **P15.** [Abrir este viaje], pequeño, en cada viaje guardado del Perfil que no es el abierto (`FilaDeViaje.tsx`, que pasa a ser una tarjeta con dos botones; `PerfilSheet.tsx` trae `abrirViaje`, que carga el viaje y cierra el Perfil). El álbum sigue sin ese botón.
- **P16** ya estaba (Lugares = ciudades distintas). **P17** ya estaba (sin «×1»; «×2» desde el segundo viaje). Probados.
- **P19.** El paseo de Trastevere lleva la etiqueta lila; los restaurantes no. La etiqueta sale del `etiqueta_barrio` de la zona (un solo dato): `etiquetasDeBarrio` (`fichaLugar.js`) ahora incluye también el paseo por barrio («Pasear por Trastevere») y el paseo libre («Pasea y piérdete por Trastevere» y su iluminado). El prefijo «Pasea y piérdete por » vivía en dos sitios; ahora está en `sitios.js` (`PREFIJO_PASEO_LIBRE`, `titulosDePaseoLibre`) y lo usa también `freeTime.js`. En pantalla: `ZoneWalkCard.tsx` (tarjeta del paseo por barrio, no tenía etiqueta) y se quitó la exclusión del paseo libre en `StopAccordion.tsx` y `StopDetailSheet.tsx`. La regla de la prueba `pruebaFase6y4_ficha` pasa a «los 10 lugares de la zona + su paseo». Nota: la parada escrita «Paseo por Trastevere» de las listas es el lugar «Trastevere» (con otro título), que ya la llevaba.
- **P20 a P27:** sin cambios; no se ha tocado la rama de HOY gratis.

## P28. La caché de fotos
- **Dónde vive:** tabla de Supabase `place_photo_cache` (migración 0014/0015). La escribe y lee `server/index.js` (`resolvePlacePhoto`, `resolveNightPhoto`, `/api/pool-photos`).
- **Qué había:** 291 filas; 268 de Roma, de las que 127 llevaban un nombre que no es de ningún sitio nuestro (restaurantes, textos de búsqueda como «Fiumicino airport» o «Cappuccino coffee», excursiones con otro título, «Free Tour Centro Histórico» con una foto de un disco de Madonna, y «Plaza de Espa?a» y «noche:Plaza de Espa?a» —nombre con un carácter roto— con la foto de Claudio Baglioni, el cantante).
- **Qué se hizo:** la clave pública no puede borrar (RLS: 0015 solo abre insert/update; mi intento de `delete` devolvió 0 filas sin error). Por eso esas 127 filas se han dejado **«sin foto»** con un UPDATE (la foto equivocada ya no sale), y se añade `supabase/migrations/0019_place_photo_cache_limpieza.sql`, que las **borra de verdad**: hay que ejecutarla a mano en el editor SQL de Supabase (no la he aplicado). Copia de seguridad de las filas, fuera del repo, en mi carpeta temporal de la sesión. No se tocó Barcelona (20) ni «italia» (3): no son de nuestros datos y no hay con qué compararlas.
- **La regla nueva:** `server/engine/nombresDeFoto.js` (`esNombreNuestro`). La caché solo se lee y se guarda con nombres de nuestros datos (lugares y su `photo_name`, nocturnas, paseos, excursiones, Free Tour, sitios extra; con sus formas «(por fuera)», «noche:», «de noche»). Un nombre ajeno se sigue buscando (para el viajero que añade un sitio de Mapbox), pero no se apunta. Un destino sin datos nuestros no se comprueba. Probado en vivo: pedir la foto de un nombre inventado no deja fila.

## Pruebas
- Nueva `pruebaFase6y5_pantallas.mjs`: 247, 0 fallos.
- A 0 fallos: pruebaFase6y4_formulario/_presupuesto/_perfil/_ficha/_reservas/_iconos, pruebaFase6y3_*, pruebaFase6y2_*, pruebaFase6y_formulario, pruebaCorr6z6 (+_efecto, _perfil, _reservas), pruebaTanda6z6a-d, 6z3, 6z5, pruebaFase6z6e/f/fWikimedia, pruebaFotos6z3, pruebaTanda6v. `tsc -p tsconfig.app.json` sin errores.
- **Ajustes a pruebas anteriores:** `pruebaFase6y4_presupuesto` (la hoja de la hora ya no lleva precio y código: ahora se mira el tramo abierto) y su entrada; `pruebaFase6y4_formulario` (sin [Guardar]; guarda con `rangoCompleto`); `pruebaFase6y4_ficha` (la regla de Trastevere: 10 + paseo); `pruebaTanda6v` (el texto nuevo).

## Preguntas abiertas
1. Tras guardar la hora, ¿prefieres que el tramo siga abierto para rellenar referencia y compañía? Ahora se cierra (como antes).
2. ¿Ejecutas tú la migración 0019 en Supabase? Hasta entonces las 127 filas siguen como «sin foto».
3. Los nombres ajenos se buscan pero no se guardan. Si prefieres que den «sin foto» directamente (más seguro contra fotos equivocadas, pero los sitios que añade el viajero desde Mapbox saldrían sin foto), es un cambio pequeño en `resolvePlacePhoto`.
4. Barcelona e «italia» siguen en la caché: no se pueden comparar con datos nuestros.

## Lo que no pude verificar en pantalla
Nada a ojo ni a 375 px (no he abierto la app en un navegador): el aspecto de las cuatro casillas, la tarjeta del viaje con [Abrir este viaje], la etiqueta del paseo y el calendario sin botón se han probado pintando con el código real en el servidor y con las reglas del toque, pero no con clics reales. Sin capturas.

## Dónde pueden chocar con otros agentes
`LlegadaYVuelta.tsx`, `PerfilSheet.tsx`, `useRouteStore.ts` (solo `setLegCompania` y el borrado en `removeFlightLeg`), `server/index.js` (el import y `resolvePlacePhoto`/`resolveNightPhoto`/`/api/pool-photos`), `types.ts`, `shared/routeEngine/sitios.js` y `server/engine/freeTime.js` (el prefijo del paseo).
