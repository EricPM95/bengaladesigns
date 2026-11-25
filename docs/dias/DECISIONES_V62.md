# DECISIONES V62: la llegada en HOY (para Eric)

Lo que he decidido solo y conviene que mires (todo se puede cambiar):

1. **Cuándo sale la tarjeta de llegada.** El día de llegada, hasta que se hace la primera parada (antes el billete se quedaba todo el día). Con coche propio no hay día de llegada para el motor (sin hora no hay llegada), así que sale el PRIMER día del viaje.
2. **Coche propio, [He salido tarde].** No hay reserva que cambiar (el motor no cuenta una llegada en coche), así que la hora que se pone solo se guarda como recuerdo (`arrivalRetraso`) y la tarjeta dice «Llegas hacia las HH:MM». No sale la pregunta de adaptar los días. Si quieres que cuente para el motor, hay que decidir cómo.
3. **La hoja de la hora.** Uso `HojaDeHora` tal cual (la rueda de siempre, con el ✓ arriba a la derecha como «Guardar»): Design pinta un botón [Guardar] abajo, pero la regla V55 dice una sola rueda confirmable.
4. **Coche de alquiler sin reserva.** Con Lanzarote en alquiler pero sin reserva guardada, la caja dice «COCHE · Alquiler · Recógelo al llegar» (así no se pierde el aviso de «Recoge tu coche» de antes). Con reserva, el nombre de la compañía (Cicar). La franja «Primero, recoge tu coche» es un enlace a Google Maps (alquileres del aeropuerto): conserva el botón «Cómo llegar al coche de alquiler» que había.
5. **Lo que se queda de la tarjeta oscura de bienvenida:** solo «Te recomendamos comer algo…», «Llegas tarde: descansa» y los restaurantes (lo que la nueva no tiene). Sin nada de eso, no sale.
6. **Rapidez del QR en HOY:** es la misma pieza de RESERVAS (`IconoDeDocumento`, 30 px con zona de toque de 44), no el círculo de 52 px del dibujo.
7. **TERMINAL, sub-línea:** sale el aeropuerto de fuera («El Prat»), sacado de «Salida: Barcelona (El Prat)» de RESERVAS, solo si lo dice la reserva. Para tren, la caja es ESTACIÓN (en autobús PARADA, en barco PUERTO).
8. **«Cómo llegar al centro»** se queda en Lanzarote (el dibujo lo pone igual); abre la misma ficha de llegada.
9. **Sin animaciones nuevas** (solo el punto verde que ya usa la tarjeta de la parada), así que no hay tarjeta nueva en el estudio de sonidos.
10. **Viaje en grupo:** «Llegáis a…», «Hemos aterrizado», «Recogedlo al llegar», «vuestro alojamiento», con `segunGrupo`.
11. **«Cómo llegar a tu alojamiento»** sigue exigiendo pase y dirección (regla de siempre); sin dirección, tras llegar queda el enlace «Cómo llegar al centro».
12. Las pruebas viejas que busquen `data-hoy-bienvenida-billete`, «Empiezas hacia las…» o el billete en el día de llegada (`data-billete="llegada"` en HOY) ya no lo encontrarán: no he tocado pruebas (modo rápido).
