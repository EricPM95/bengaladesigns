# Tanda 6y, parte C: el interior de los días de la ruta a mano

## Lo hecho (en palabras sencillas)

- **Una sola regla**: `isManualRoute(route)` (`src/lib/manualPlan.ts`, `planMode === 'manual'`). Con ella la app no mete, no quita y no reordena nada sola.
- **Día en blanco**: dos botones, [Añadir parada] y [Añadir excursión] (`ManualDayFooter`). Con paradas puestas queda solo [Añadir parada] al final; [Añadir excursión] solo en días en blanco.
- **[Añadir parada]** abre EXPLORAR en el modo de elegir varios (`ManualAddStopsScreen`). Los marcados van a ese día, en el orden en que se marcan, sin hora. Se pueden marcar varios a la vez.
- **Orden de EXPLORAR en la ruta a mano**: más «me gusta» de verdad, luego imprescindibles (la lista a mano `pool_lista` del destino, nuevo campo `essential_rank` en `/api/destination-places`), luego nivel 1 y el resto. Los números de prueba (`?prueba=1`) solo se pintan, nunca ordenan.
- **«En tu día 2»** (con fechas «En tu lun 13») en lugar de «✓ En ruta» para lo que ya está en otro día.
- **[Añadir excursión]** abre la página de excursiones; la elegida va a ese día como día de excursión (`placeExcursionIn`), sin preguntar dónde.
- **Reservas**: la parada se queda donde la puso el viajero y solo coge la hora y la marca de la reserva (`reservedEntranceInPlace`, llamada desde `placeReservedEntrance`). Una reserva en un día que no lleva el sitio no trae nada de otro día. Una reserva grande no mueve días. Una excursión reservada solo entra en un día en blanco (no borra paradas).
- **El motor, cerrado** en una ruta a mano: `rehacerDiasSinTocar`, `rehacerDiaConReservas`, `fitDayToTrip`, `optimizeDayWithRealTransport`, `adjustDay` y `checkTime` (HOY), «Quiero entrar» (petición y botón), `/api/reservation-plan` (AddReservationSheet) y el cambio de fechas (`DatesChangeDialog`). `removeReservation` tampoco rehace el día.
- **Nombres de los días**: por su fecha («lun 13 oct») o «Día 1»; renombrar con DayNameSheet (`nameByUser`); dejar el nombre vacío vuelve al de por defecto.

## Qué ya funcionaba (sin tocar)
Los días `dayType: 'manual'` (días libres de la 6g) ya no calculaban horas, ya mostraban horario y última entrada, «Cerrado ese día», «Hoy cierra…», avisos «coinciden»/«vas justo»/«día completo»/cierre de reserva (se calculan del estado del viaje), precios y presupuesto (salen de las reservas), pastilla a la cartera, fotos, HOY, RESERVAS («EN TU RUTA») y los enlaces de afiliado (`withCampaign`, sin distinguir el modo).

## Qué arreglé (huecos)
Orden de EXPLORAR, etiqueta con el día, botones del día en blanco, reservas que reordenaban o traían paradas de otro día, y los caminos del motor de arriba.

## Pruebas
`scripts/destino/pruebaFase6y_manual.mjs`: 1694 comprobaciones, 0 fallos (rutas de 2, 3, 4 y 5 días, con y sin fechas, gratis y de pago). Existentes a 0 fallos sin ajustar nada: 6z5, 6z6, Corr6z6, 6z6f, 6s, 6u, 6g. `tsc -p tsconfig.app.json` limpio.

## Preguntas abiertas
1. **Free Tour en la ruta a mano**: `freeTourAvailable` exige días escritos (`curatedId`), así que no sale el botón del Free Tour. ¿Cómo debe añadirse a mano (como parada en un día, con su hora)?
2. «Hoy es un día completo» cuenta comida y cena aunque el día a mano no las tenga (misma regla que la nuestra). ¿Se deja?
3. Una reserva de un sitio que no está en el día de su fecha se queda solo en RESERVAS (la parada no se mueve). ¿Avisar al viajero?
4. En las tarjetas de «Añadir parada» salen también restaurantes (lista completa); solo se pueden marcar las atracciones.
5. Hay que reiniciar el api-server para que `essential_rank` llegue (los imprescindibles); sin reiniciar, el orden cae a nivel 1 y resto.

## No verificado
La comprobación visual a 375 px (sin navegador). Capturas pendientes.
