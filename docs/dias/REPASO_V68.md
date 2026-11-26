# REPASO V68 (26-nov): reservas en otro dia, «Recuperar el dia» y Reorganizar que no quita nada

Esta vez CON pruebas: `pruebaV68` (64 comprobaciones en Roma, 84 con Lanzarote), `pruebaJutrip` (130), Reorganizar (1166) y las de reservas, todas en 0 fallos. Capturas (iPhone) antes y despues en `docs/dias/V68_capturas/`.

**Que tanda lo rompio y por que:** no fue una sola. La colocacion del cliente de la 10S7 (la parada entra «de primera» y solo se movia el primer sitio de la reserva) paso a ser el camino principal en cuanto los dias llevan una marca de «tocado» (Reorganizar y los vuelos de V49 a V61). El servidor daba la hora de la reserva a todos los sitios de la entrada. Y la V61 empujaba todo en cadena con un vuelo tardio y el ultimo dia desaparecia.

- ✅ Una reserva que cubre varios sitios mueve todos sus sitios, a su hora (Coliseo 13:00, Foro despues; Vaticanos 15:00 por la tarde; Free Tour 15:00 entre las paradas).
- ✅ Nunca un sitio dos veces (guardian en reservas, mover, recuperar y Reorganizar). ✅ «Recuperar el dia» lo deja todo como estaba, sin repetidos.
- ✅ Reorganizar no quita nada: 0 «Se quita de tu viaje» con vuelos de 15:30 y 17:30 (antes 17 y 12 sitios desaparecian) y solo cambian 2 dias (antes 3, con 45 tarjetas).
- 🟡 Sin comprobar: «Recuperar» con un viaje en marcha, dias pasados bloqueados con un viaje en curso, la hoja previa de AddReservationSheet. Barrido de 365 sin pasar.
- Ojo: con el vuelo de 17:30 el dia 1 de Lanzarote queda solo con la cena, y el Free Tour sin hora y los Vaticanos acaban en Lugares pendientes. Decisiones: `DECISIONES_V68.md`.
