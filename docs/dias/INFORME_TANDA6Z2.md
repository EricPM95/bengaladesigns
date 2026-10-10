# Informe de la Tanda 6z2

## El presupuesto viejo: qué enseñaba

El `BudgetPanel` (la bolsa de dinero de la barra de abajo) enseñaba un «💰 Presupuesto» con un total y dos listas, «📍 Ruta» y «➕ Extras». **Sí tenía números inventados:**

- **«Estimación de la IA (alojamiento + comidas)»**: un importe que Claude estimaba al generar la ruta (`estimated_budget`) y que entraba en el total como si fuera un gasto del viajero.
- **El hotel de ejemplo**: al elegir uno de los hoteles inventados de la ventana «Hoteles en {destino}» (6z lo quitó), su precio por noche multiplicado por las noches entraba en el total.
- Lo demás sí era del viajero (el billete, el seguro y el coche con el precio que escribía) y los «Extras» a mano, pero todo en euros fijos, con «€» escrito a mano.
- Había además un pie de pantalla de escritorio («Ver presupuesto») y cuatro piezas del viejo (`TourOptions`, `ExcursionSection`, `StopCard`, `PlaceDetailModal`) que añadían al presupuesto el precio de las tiendas con un botón «+ Presupuesto»; ninguna estaba puesta en ninguna pantalla.

Todo eso está borrado (`BudgetPanel`, `AddExtraForm`, `BudgetItem`, `FloatingBudget`, `budgetFlyBus` y esas cuatro piezas sin uso). La bolsa de la barra de abajo y la fila «Presupuesto · 54 €» de RESERVAS abren ahora la pantalla nueva, que solo suma lo que el viajero ha puesto con su precio.

## Dónde salían precios con «€» escrito a mano

- La ficha de llegada y vuelta (`ArrivalDetailSheet`): el precio de cada opción del aeropuerto y el del traslado privado.
- Las excursiones: la tarjeta de cada excursión, la página de la excursión del día 4 (donde, sin precio, **salía «XX€»**, un número falso: ya no sale nada) y la lista de excursiones.
- Los tickets de una parada (`PurchaseSection`), «Desde 14 €» de las entradas de una ficha (`StopReservation`), el carrusel de tarjetas y el PDF.
- El presupuesto estimado del PDF («Presupuesto estimado: €…»), que ahora saca el total del presupuesto nuevo (y no sale si no hay gastos).
- Los datos de ejemplo del aeropuerto y los rangos de precio de restaurantes del archivo de ejemplos (`mockDayDetail`), el servidor (el precio de las excursiones) y los campos de precio de las fichas del seguro, el coche y los billetes (llevaban «€» de texto de ayuda).
- Todo pasa ya por un solo formato (`shared/dinero/formato.js`: «54 €», «1.200 Kč», «800 MXN»). Quedan solo los símbolos de nivel de los restaurantes («€», «€€», «€€€», que no son importes).

## La moneda y el cambio

- **Fuente del cambio:** el Banco Central Europeo (tipos de referencia diarios, gratis y oficiales: `eurofxref-daily.xml`). Lo pide **nuestro servidor** como mucho una vez cada 12 h y lo guarda (en memoria y en un archivo temporal); la app llama a `/api/cambio` y nunca a la fuente. Si el BCE no responde, sirve el último que tenga, con su fecha.
- **Monedas del BCE (29):** USD, JPY, CZK, DKK, GBP, HUF, PLN, RON, SEK, CHF, ISK, NOK, TRY, AUD, BRL, CAD, CNY, HKD, IDR, ILS, INR, KRW, MXN, MYR, NZD, PHP, SGD, THB y ZAR (más el euro). Una moneda que no esté (ARS, CLP, COP, PEN, AED, EGP, MAD…) sale aparte, en la suya, con «Sin cambio para ARS», sin sumar.
- **Moneda del viajero:** del país de su ciudad de origen (`shared/dinero/monedasPorPais.json`, más de cien países); España → EUR, México → MXN. Se cambia en el presupuesto («Tu moneda: EUR · Cambiar»).
- **Moneda del destino:** en los datos de cada destino (`moneda`: Roma, «EUR»). Se ofrece en los campos de precio como «MXN · destino».
- **Stay22:** el mapa lleva `currency=` con la moneda del viajero (ver la pregunta 4).

## Probado a mano a 375 px (gratis y de pago)

Con un viaje nuevo Madrid → Roma, 13–17 oct, en pareja:

- Una entrada con precio (el Coliseo, 54 €) y otra sin precio (los Museos): la primera sale con «· 54 €» en RESERVAS y suma; la segunda no sale en el presupuesto.
- El Free Tour, sin campo de precio (su hoja solo pregunta la hora).
- Una excursión con precio (Pompeya, 178 €).
- Cambiar el precio de la entrada (54 → 60 €, el total sube 6 €) y eliminar la reserva (el total baja y el bloque «Ruta» desaparece).
- De pago, el billete de ida con precio (180 €): en la versión gratis no cuenta (el total baja exactamente 180 €).
- El alojamiento (420 €), el seguro (30 €) con su «Añadir precio».
- Un extra en otra moneda: 800 MXN → «≈ 39,23 €» con «Cambio aproximado del 9 de octubre»; total 543,23 €.
- El presupuesto vacío («Todavía no hay gastos») y con todo, y el «por persona» (489,23 € → 244,62 €).
- El viaje guardado se reabre con todos sus precios (se guardan con el viaje).

## Pruebas

Todas a 0 fallos: 6g, 6h, 6i, 6j, 6k, 6l, 6o, 6r (3.289 viajes), 6s (2.475 comprobaciones), 6t (1.054), 6u (1.884 viajes), 6v (83), la prueba de listas completa en 4 trozos (una de cada 5 fechas: 6.497, 4.380, 8.760 y 8.760 viajes), la prueba de franjas (32 pantallas), la de la 6z y `tsc`.

**Nueva: `pruebaTanda6z2.mjs` (45 comprobaciones):** el total del presupuesto es siempre la suma exacta de lo que tiene precio (hecha aparte, a mano); lo reservado sin precio no sale ni suma; el Free Tour no suma nunca, ni con un precio guardado; con el viajero en otra moneda el total sale en ella; el extra en otra moneda se convierte con el cambio guardado (800 MXN → 40 € con la tasa de la prueba) y, sin cambio de esa moneda, sale aparte sin sumar; sin lo de pago, el billete no cuenta; un seguro guardado antes de esta tanda (un número) se lee como euros; el formato («54 €», «1.200 Kč», «800 MXN», «54,50 €»); la moneda por país de origen; el XML del Banco Central Europeo se lee y el servidor lo pide una sola vez; Stay22 lleva `currency=`; **0 «€» escritos a mano en el código de `src`** y el presupuesto viejo ya no está.

La prueba 6v (zona del alojamiento) se actualizó en la 6z al bloque cerrado; la de la 6z, a la forma nueva de guardar el precio del alojamiento.

## Capturas a 375 px (`docs/dias/img/`)

- `6z2-hoja-hora-precio-375.jpg`: la hoja de la hora con «Precio (opcional)» y la moneda.
- `6z2-reservas-linea-con-precio-375.jpg`: «✓ Coliseo, Foro y Palatino · 13 oct · 09:30 · 54 €» y la fila «Presupuesto · 54 €».
- `6z2-free-tour-sin-precio-375.jpg`: la hoja del Free Tour, sin campo de precio.
- `6z2-presupuesto-con-gastos-375.jpg`: el presupuesto con gastos (504 €).
- `6z2-presupuesto-extra-mxn-cambio-375.jpg`: el extra de 800 MXN con su cambio y el total de 543,23 €.
- `6z2-presupuesto-por-persona-375.jpg`: el «por persona» destapado.
- `6z2-presupuesto-gratis-375.jpg`: el presupuesto en la versión gratis, con una excursión.
- `6z2-presupuesto-vacio-375.jpg`: el presupuesto vacío.

No he podido enseñar con captura: la hoja del precio del billete de llegada (se probó y se guardó, sin captura), la del seguro y el cambio de moneda del viajero (probado por la prueba, no en pantalla).

## Limpieza

Borrado el viaje de prueba «Roma 13–17 oct» que creé para esta tanda. No queda ningún viaje de prueba en el navegador.
