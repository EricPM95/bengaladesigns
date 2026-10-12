# Informe 6y9, parte de pantallas (puntos 2 y 3)

## Punto 2: la rueda de la hora, hasta la última entrada
- La rueda ya pedía las horas al servidor (`/api/reservation-hours`). Ahora ese cálculo vive en UNA pieza: `src/lib/horarioDeEntrada.ts` (`horasDeLaRueda`, `useHorarioDeEntrada`, `AVISO_DISPONIBILIDAD`). `AddReservationSheet.tsx` ya no tiene su propia cuenta.
- La rueda va de la apertura a la ÚLTIMA ENTRADA (no al cierre). Si el sitio tiene turnos reales (`turnos`), la rueda solo lleva esos (más la hora de la reserva que ya hay).
- Debajo de la rueda (entradas y Free Tour), siempre: «Recuerda revisar la disponibilidad antes de añadirlo a tu ruta.»
- Lo vi a 375 px: Coliseo, viaje del 15 al 17 de octubre, la rueda va de 08:30 a 17:30 (con los datos que ya trae esta copia: `by_period` 10-01 a 10-24). Captura: `docs/dias/img/6y9-rueda-coliseo-octubre.jpg`.

### Contrato del adaptador de horarios (para unirlo con el agente A)
- Pantalla: `src/lib/horarioDeEntrada.ts`, tipo `HorarioDeEntrada = { cerrado: boolean, ventanas: {desde,hasta}[], turnos?: string[]|null }`. `hasta` = última entrada oficial en el tramo de esa fecha.
- Fuente: `POST /api/reservation-hours` -> `horasDeEntrada` en `server/engine/reservationPlan.js` (no lo he tocado). Para integrar: que `horasDeEntrada` llame a `horarioDeLaFecha(sitio, fecha|mes)` y `turnosDeReserva(sitio, fecha)` de A y devuelva ese mismo formato (ventana = abre..ultimaEntrada; turnos = los de A). La pantalla no cambia.
- HALLAZGO para A: sin fechas (solo el mes), el servidor usa la estación (otoño) y el Coliseo en octubre acaba en 15:30; con fechas, 17:30. La prueba lo avisa (AVISO), no falla.

## Punto 3: el Free Tour
- Lista única de horas: `src/lib/freeTourHoras.ts` (`FREE_TOUR_FRANJAS`, `FREE_TOUR_HOURS`): 10:00, 12:00, 15:00 «Después de comer», 17:00 «Por la tarde», 19:00 «Al anochecer» (franja `noche`, como la de 21:00), 21:00 «De noche». La usan `FreeTourSheet.tsx` y `AddReservationSheet.tsx`. El motor tiene la suya: al integrar con B, unir las dos (la pantalla envía `{franja, hora}` a `setFreeTourChoice`).
- Texto nuevo de arriba de la hoja y [Ver disponibilidad] debajo de las horas (`VerDisponibilidad.tsx`, botón bg-accent). Reutiliza `openTicketShop` (código de afiliado y de campaña del viaje) con el aviso «Abriendo…». El enlace es el de la entrada «Free Tour» de los datos; sin él, la búsqueda del destino. Sin nombre de empresa.
- No queda en src el texto «Tu ruta se rehace con el Free Tour…».
- Visto a 375 px: la hoja con las 6 horas, el texto nuevo y el botón (`docs/dias/img/6y9-free-tour-hoja.jpg`). NO pude confirmar a ojo el pulsar [Ver disponibilidad] (el guion se colgó al abrir la pestaña); lo cubre la prueba (afiliado `aid=5206` y aviso «Abriendo…» con `openTicketShop`).

## Pruebas (en serie, servidor propio en 8853)
- Nueva `scripts/destino/pruebaFase6y9_pantallas.mjs` (+ `_6y9_pantallas_entrada.tsx`): 87 comprobaciones, 0 fallos.
- 0 fallos: 6y7_pantallas, 6y5_pantallas, 6y4_reservas/presupuesto/formulario/ficha, 6y2_reservas/reorganizar, 6y3_reservas, 6y_formulario/manual, Corr6z6 (todas), Tanda6z6a-d, 6z3, 6z5, 6z6e/f/fWikimedia, Fotos6z3, 6y8_comida, 6y6_cierre. No he cambiado ninguna prueba antigua. No lancé las 365 fechas.

## Decidido por Code
- Nombre de la hora de las 19:00: «Al anochecer» (Eric no dio nombre).
- Turnos: la rueda se restringe a ellos (lo más simple y fiel al diseño actual); el servidor ya lo hacía.
- El aviso de disponibilidad también sale en el Free Tour cuando se añade como reserva; [Ver disponibilidad] solo en la hoja del Free Tour.
- Lo de «rehacer, gana el último» que menciona el coordinador no estaba en mi encargo: NO está hecho.

## Preguntas
1. ¿«Al anochecer» para las 19:00 está bien, o prefieres otro nombre?
2. Sin fechas y con mes de octubre (tramo 1-24 vs 25-31): ¿la rueda usa la hora más prudente (15:30) o la del tramo mayoritario?
