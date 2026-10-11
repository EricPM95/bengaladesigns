# Informe de la Tanda 6y4, parte del presupuesto (puntos 8 a 14)

Palabras sencillas. Cada punto por separado. Prueba nueva: `scripts/destino/pruebaFase6y4_presupuesto.mjs` (109 comprobaciones, 0 fallos).

## 8. La moneda, sin «tuya»
- Todos los selectores de moneda (precio de la hoja, extras, etc.) salen ahora solo con el código: «EUR», «CZK»... Sin «· tuya» ni «· destino» (`useMoneda.ts`).

## 9. La fila «Moneda» del presupuesto
- Abajo del todo, una fila con el estilo de las tarjetas del presupuesto: «Moneda» a la izquierda y «€ Euro» con su flecha a la derecha. Abre el mismo selector de moneda de antes.
- Nombres en español con el propio navegador (`Intl.DisplayNames`): Euro, Dólar estadounidense, Corona checa... Funciones nuevas `nombreDeMoneda` y `monedaConNombre` en `dinero.ts`.
- El selector que se abre también enseña «€ Euro» en vez de solo «EUR».

## 10. DÍAS sin contador
- Quitado el «17 paradas» de las cabeceras de los días (solo el contador; «Ponle nombre» no se ha tocado).

## 11. El aviso del alojamiento, solo si falta
- Una sola regla, `alojamientoCubierto` (en `tuAlojamiento.ts`), usada por tres sitios: el aviso del día 1, la tarjeta «Alojamiento» de RESERVAS y el «!» de preparación (`useTripReadiness`).
- Cuenta como resuelto: el hotel que puso el viajero en esa estancia; y, de pago y con un solo destino, también la zona elegida (como ya hacía RESERVAS; «Aún no lo sé» no cuenta).
- Con el alojamiento resuelto el aviso **no sale** (ni la fila verde de antes). Se ve y se cambia desde RESERVAS.
- Un pequeño cambio de efecto: en la versión de pago, un hotel puesto sin zona elegida ahora cuenta como alojamiento hecho en RESERVAS (antes solo contaba la zona).

## 12. El vuelo: precio y código
- El **precio** ya estaba en la hoja de «Añadir vuelo/tren/autobús» (desde la 6z2) y suma al presupuesto con su pastilla. Comprobado.
- Nuevo: **código** opcional («Código del vuelo», «del tren» o «del autobús», según el medio). Se guarda en el viaje: `route.arrivalCodigo` / `route.departureCodigo` (campos opcionales; un viaje guardado antes simplemente no los tiene, se lee como «sin código»; probado).
- Dónde se ve: en la tarjeta de la llegada y la vuelta de RESERVAS («Ida · mié 10 · 11:15 · IB 3214 · Fiumicino») y en la barra de llegada/vuelta de DÍAS («LLEGADA · FIUMICINO · IB 3214»; regla en `shared/arrival/arrivalRules.js`). Quitar la ida o la vuelta borra su código y su precio.
- Para la ficha de transporte de varios destinos (`TransportBookingModal`), campo «Código del vuelo, tren o autobús (opcional)», visible en la fila de RESERVAS. (Solo Roma está en uso; es por si acaso.)
- El texto de ejemplo del campo es «AB 1234» (sin empresas).

## 13. «¿Dónde lo has comprado?»
- Seguro, eSIM y tarjeta: al pulsar [Añadir] (o tocar la tarjeta ya añadida) sale la hoja con el campo opcional «¿Dónde lo has comprado?». La tarjeta sin comisiones, que no lleva precio, abre una hoja que es solo ese campo. El coche de alquiler no lo pregunta (no lo pediste).
- La tarjeta añadida dice «✓ Lo tienes · {lo que escribió}». Si no escribió nada, dice el precio, como antes.
- Se guarda en un campo nuevo del almacén, `dondeComprado` (claves `seguro`, `tarjeta`, `esim-{país}`), también con el viaje (guardado en la nube y al abrirlo; un viaje antiguo se abre con `{}`). Quitar la tarjeta borra su texto.
- Nuestros textos no nombran empresas (comprobado en la prueba).
- Arreglo de paso: el guardado en la nube no se enteraba de un cambio solo en el precio de la eSIM (faltaba en la lista que vigila `TripSync`). Añadido junto con lo nuevo.

## 14. La pastilla del precio

### Lo que he probado
Con el almacén de verdad y las mismas funciones que usa la app (`crearSeguidor`, `entradaDeEstado`, `preciosCambiaron`), llamando a las mismas acciones que llama cada pantalla, en versión de pago y en gratis, guardando y quitando:

| Sitio | Acción del almacén | Pastilla al guardar | Al quitar |
|---|---|---|---|
| Alojamiento | `setAccommodationHotel` | sí | sí |
| Entrada | `addReservation` (entrada) | sí | sí |
| Excursión | `addReservation` (excursión) | sí | sí |
| Vuelo / vuelta (hoja de llegada y vuelta) | `setLegPrecio` | sí, solo de pago (en gratis ese bloque no existe, igual que en el presupuesto) | sí |
| Tren o autobús (ficha) | `setTransportBooking` | sí | sí |
| Seguro | `setInsuranceBooking` | sí | sí |
| eSIM | `setEsimPrecio` | sí | sí |
| Coche de alquiler | `setRentalVehicleBooking` | sí | sí |
| Extras | `addGastoExtra` | sí con el presupuesto cerrado; los Extras solo se añaden dentro del presupuesto, donde no sale por diseño | sí |
| Tarjeta sin comisiones | `setN26Added` | no hay precio: no sale nada, correcto | |

También: cambiar 30 a 45 da «+15 €»; con el presupuesto abierto no sale y lo siguiente sale solo por lo nuevo.

### En cuáles NO salía y por qué
- **En ninguno falló la cuenta.** Con el almacén de verdad todos los sitios producen su pastilla. No he encontrado un sitio donde el seguidor no la calculara.
- La causa más probable de que Eric no la vea es visual: la pastilla sale en el instante de guardar, **mientras la hoja todavía está abierta y tapa la cartera** (el guardado y el cierre de la hoja ocurren en el mismo instante, y el efecto se lanzaba antes de que la hoja desapareciera). Los Extras, además, solo se añaden dentro del presupuesto, donde no sale por diseño.
- No puedo confirmar esto a ojo (no hay navegador): lo comprobaré con Eric a 375 px.

### El arreglo
- Nueva pieza reutilizable en `precioVuela.ts`: `cuandoSeVe(buscar, callback)` y `cuandoLaCarteraSeVe(callback, entorno)`. Si una hoja o una pantalla completa tapa la cartera (nada la tapa = «libre»), **espera** (mira cada 0,1 s, hasta 20 s) y la pastilla vuela cuando la cartera queda a la vista; si ya se ve, vuela al instante. Probada con un documento falso: con la hoja encima no vuela, al cerrarse vuela una sola vez, sin hoja vuela al instante, se rinde a los 20 s.
- Reutilizable para el vuelo de la foto al Perfil: `cuandoLaCarteraSeVe(callback, { document, ancho, alto, selector: '[data-perfil]' })` (el nombre dice «cartera» pero acepta otro `selector`; o directamente `cuandoSeVe`). También exporta `carteraLibre(documento, ancho, alto, selector)`.
- Para poder probar el cableado, `entradaDeEstado` y `preciosCambiaron` se han sacado de `PrecioVuela.tsx` a `precioVuela.ts` (misma lógica).

## Pruebas y ajustes a pruebas existentes
- Nueva: `pruebaFase6y4_presupuesto.mjs` (109 comprobaciones, 0 fallos): sin «tuya», fila de moneda, sin contador, aviso del alojamiento, precio y código del vuelo/tren/bus, «¿Dónde lo has comprado?», pastilla en cada sitio (gratis y pago) y espera a la hoja. Para ejecutarla hace falta un servidor de la app (`API_URL=http://localhost:PUERTO`).
- Existentes, a 0 fallos: `pruebaCorr6z6.mjs` (reservas 323, efecto 71, perfil 88), `pruebaTanda6z2.mjs`, `pruebaFase6y_manual.mjs`, `pruebaTanda6z6.mjs`, `pruebaTanda6s.mjs`, `pruebaTanda6u.mjs`, `pruebaTanda6v.mjs`.
- **Único ajuste a una prueba existente:** `pruebaCorr6z6_reservas.mjs` (3d) miraba que `gestionar` abriera la hoja solo cuando la tarjeta lleva precio; ahora también la tarjeta sin comisiones abre su hoja (para preguntar dónde la compró), así que la comprobación pasa a «todas abren la hoja».
- `tsc -p tsconfig.app.json`: sin errores.

## Preguntas abiertas
1. Punto 11: ¿te parece bien que, de pago, la zona elegida cuente como «alojamiento resuelto» también para el aviso del día 1 (igual que RESERVAS)? Si prefieres que el aviso desaparezca solo con el hotel puesto, es cambiar una condición en `alojamientoCubierto`.
2. Punto 13: con el seguro o la eSIM, si hay «dónde lo compré» y precio, la tarjeta enseña el lugar (el precio sigue en el presupuesto). ¿Quieres los dos («Lo tienes · Mi banco · 30 €»)? Cabe justo en 220 px.
3. Punto 14: si tras esto sigues sin ver la pastilla, necesito saber desde qué pantalla guardas el precio (hoja, versión gratis o de pago): el cálculo está probado en todos los sitios, así que sería algo de la pantalla.
4. Punto 12: el código se ve en la tarjeta de RESERVAS y en la barra de DÍAS solo cuando la ida/vuelta está completa (hora + punto elegido), igual que la hora.

## Lo que no pude verificar
- Nada a ojo ni a 375 px (sin navegador): la fila «Moneda», la hoja con el campo nuevo, el código en la barra, la espera de la pastilla con una hoja real. Todo probado pintando con el código real en el servidor y con documentos falsos.
