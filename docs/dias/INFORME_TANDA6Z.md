# Informe de la Tanda 6z

## Lo que había de hoteles en la app, y adónde lleva ahora

Todo lo que hablaba de hoteles lleva ya a la misma pantalla (el mapa de alojamientos a pantalla completa); nada va directo a otra web.

- **RESERVAS, bloque de alojamiento** (`AlojamientoReservas.tsx`): [Buscar alojamiento] abría una hoja de abajo con el mapa; ahora abre la pantalla completa.
- **RESERVAS de varios destinos** (`AccommodationRow.tsx`): tenía un «Reservar» que iba directo a `stay22.com` y marcaba «reservado» solo con pulsar el enlace; ahora tiene [Buscar], que abre la pantalla, y «Añadir» abre «Tu alojamiento».
- **Primer día de cada destino** (`AccommodationBlock.tsx`): abría una ventana con hoteles de ejemplo; ahora, sin alojamiento abre la pantalla del mapa y con alojamiento abre «Tu alojamiento».
- **EXPLORAR y «Añadir al viaje»** (`PlaceExplorerScreen.tsx` con `buildHotelSearchUrl`): el botón «Hoteles» de la fila de filtros enseñaba una tarjeta con «Ver hoteles» que iba directo a Booking. Ahora «Hoteles» está en la fila de filtros de EXPLORAR y de «Añadir al viaje», no filtra y abre la pantalla. `buildHotelSearchUrl` se ha quitado del código.
- **Detalle de destino** (`DestinationDetailModal.tsx`): carrusel de hoteles de ejemplo y «Ver más hoteles» directo a Booking; ahora un botón «Buscar alojamiento» que abre la pantalla.
- **Aviso lila de DÍAS** (`MissingAccommodationBanner`): ya no se pinta (la pieza se queda; el aviso de la camper sigue).

## Datos de ejemplo que se han quitado de lo que ve el viajero

`mockHotels`, `mockActivities` y `mockAffiliateData` (archivo borrado):

- **Ventana «Hoteles en {destino}»** (`AccommodationHotelModal`, borrada): enseñaba tres hoteles inventados con estrellas, nota y precio por noche, con [Seleccionar]. Salía en el primer día, en RESERVAS y en el aviso lila.
- **Detalle de destino**: el carrusel «Alojamientos» (hoteles inventados) y el de «Actividades» (actividades inventadas). Se queda el botón «Descubre más experiencias» de Civitatis y las excursiones, que son datos de verdad.
- **Conectores con el hotel en DÍAS** (`buildAccommodationConnectorInfo`): con un hotel elegido, el primer trayecto del día («desde el hotel») y el último («hasta el hotel») enseñaban distancias y minutos inventados. Ya no hay: el alojamiento solo informa y no cambia la ruta.
- **Presupuesto**: el hotel de ejemplo metía su precio por noche en el presupuesto. Ahora entra solo el precio total que dice el viajero, y si no lo dice no entra nada.

## «Tu alojamiento»

Un nombre libre y un precio total opcional; las noches son las del viaje. Se guarda con el viaje, uno por destino (en el primer día de cada destino). Los viajes guardados antes con un hotel de ejemplo siguen abriéndose: se lee solo su nombre y no se enseña ningún precio de ejemplo.

En gratis y de pago, probado a mano a 375 px: añadir desde RESERVAS, desde el mapa («¿Ya tienes alojamiento? Añádelo») y desde el primer día; cambiar; eliminar. De pago y sin zona: «✓ Hotel Artemide · Falta la zona» y el «0 de 3» sin tocar. **Con una zona elegida no lo he probado a mano** (solo la cuenta, que sigue la regla de INVARIANTES 514).

## Viajeros lo recomiendan

Sin `?prueba=1`: 85 corazones en EXPLORAR y **0 números** (probado en el navegador y en la prueba). Con `?prueba=1`: números fijos por lugar (nivel 1 de 800 a 2.500, nivel 2 de 80 a 600, el resto ninguno) en la lista y en la ficha. En producción `?prueba=1` no hace nada (prueba con los dominios: ver la pregunta 1).

## Pruebas (todas a 0 fallos)

6g, 6h, 6i, 6j, 6k, 6l, 6o, 6r (3.289 viajes), 6s (2.475 comprobaciones), 6t (1.054), 6u (1.884 viajes), 6v (83: se ha actualizado al bloque de alojamiento cerrado, que es el diseño nuevo), la prueba de listas completa en 4 trozos (una de cada 5 fechas: 6.497, 4.380, 8.760 y 8.760 viajes), la prueba de franjas (32 pantallas, 0 horas) y `tsc`.

Nueva: `pruebaTanda6z.mjs`: sin `?prueba=1`, 0 números inventados; con él, números fijos por nivel en todos los lugares de Roma; en producción, nada (tres dominios de ejemplo y `VITE_VERCEL_ENV=production`); ningún enlace de hoteles a otra web ni dato de ejemplo en `src`; el Free Tour viaja con el catálogo, marcado «solo entradas», con foto y ficha; las cuentas del alojamiento.

## Capturas a 375 px (`docs/dias/img/`)

- `6z-explorar-entradas-375.jpg`: lista con el Free Tour el primero, «✓ En ruta» en verde, «+» y corazón con los números de prueba.
- `6z-explorar-mas-hoja-dias-375.jpg`: el «+» desde EXPLORAR abre la hoja de los días. (La captura es anterior al último cambio de texto: el día que ya lo tiene decía «Ya está en este día» y ahora dice «En tu día 1».)
- `6z-anadir-parada-check-apagado-375.jpg`: «Añadir parada», con el ✓ apagado en el Altar de la Patria (ya está en ese día).
- `6z-anadir-parada-directo-deshacer-375.jpg`: el «+» de «Añadir parada», añadido directo con «Añadido al día 1 · Deshacer».
- `6z-alojamiento-pantalla-completa-375.jpg`: el mapa de alojamientos a pantalla completa (desde «Hoteles» de EXPLORAR).
- `6z-tu-alojamiento-hoja-375.jpg`: la hoja «Tu alojamiento».
- `6z-reservas-alojamiento-cerrado-pago-375.jpg`, `6z-reservas-alojamiento-abierto-con-hotel-375.jpg`, `6z-reservas-alojamiento-abierto-vacio-375.jpg`, `6z-reservas-gratis-alojamiento-cerrado-375.jpg`: RESERVAS de pago y gratis.
- `6z-dia1-alojamiento-puesto-375.jpg`: la fila del primer día con ✓ verde, nombre y «4 noches · 420 €».
- `6z-ficha-prueba-375.jpg`: la ficha con «555 viajeros lo recomiendan» (`?prueba=1`).

Lo que no he podido enseñar con captura: el mapa de alojamientos en escritorio (la lista de EXPLORAR sí se vio en escritorio) y el aviso de [Deshacer] pulsado.

## Limpieza

Borrados los dos viajes de prueba «Roma 13–17 oct» (los de la 6x, que usé también en esta tanda). No queda ningún viaje de prueba en el navegador. Un «me gusta» que se puso sin querer en una prueba (Altar de la Patria) se quitó en el momento.
