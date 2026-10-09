# Progreso de la Tanda 6s (RESERVAS nueva, versión gratis y de pago)

Hecho en este orden, con un commit por bloque. Marcado ✔ lo terminado y comprobado.

- ✔ **0. Interruptor de pago.** Un solo sitio para toda la app: `src/lib/pago.ts`. Ahora está encendido. `?version=gratis` y `?version=completa` en la dirección lo cambian y se queda guardado mientras la pestaña esté abierta.
- ✔ **1. Orden de RESERVAS.** Resumen · Llegada y vuelta · Alojamiento · Entradas y Free Tour · Excursiones · Útil para el viaje. Quitados el banner amarillo, la tarjeta oscura del primer y último día, las filas sueltas de transporte y la fila vieja de alojamiento. La ventana «¿Ajustamos tu ruta a tu vuelo?» se queda (la quita la Tanda 7).
- ✔ **2. Resumen** «Tu viaje a Roma · n de 3 listo», con barra y tres fichas que llevan a su bloque. No sale en la versión gratis.
- ✔ **3. Llegada y vuelta.** Tarjeta de embarque con dos mitades, el medio de cada una sale del formulario, los puntos de `_llegada.json`, la hora con la rueda de siempre, «Eliminar vuelo» con su confirmación. Se guarda en `arrivalFlightTime`, `departureFlightTime`, `arrivalPointId` y `departurePointId`. No cambia la ruta todavía.
- ✔ **4. Alojamiento.** Gratis: una fila «Buscar alojamiento en Roma». De pago: la lista de zonas (Centro, Plaza de España, Prati, Trastevere, Termini, Monti, Aún no lo sé). Se guarda en `accommodationZone`.
- ✔ **5. Mapa de Stay22** en una ventana de unos 428 px con esquinas redondeadas, con las fechas del viaje y el código de campaña.
- ✔ **6. Entradas y Free Tour.** Cerrado de entrada, «1 de 7 reservadas» con barra, en el orden de los datos del destino, solo las que están en la ruta, «Ver n más». Las reservadas, en una línea verde con «Cambiar».
- ✔ **7. Hoja de la hora.** Fichas de los días (con «En tu ruta» y «Cerrado» en gris), la rueda con las horas reales de ese día, «Guardar · 10:00», «Rellenar desde el email o el PDF» pequeño debajo de la rueda. Quitadas la línea fija del día y «¿Es para otro día?».
- ✔ **8. Barra de llegada y vuelta de DÍAS.** Gratis: sin «+ AÑADIR VUELO», solo la flecha. De pago: como antes, y con el punto elegido la ventana enseña solo ese punto y abajo «¿Llegas por otro sitio? Ver Ciampino».
- ✔ **9. Excursiones.** No salen en viajes de menos de 4 días (ni el hueco). Con día de excursión, la tarjeta de esa excursión; sin él, «Excursiones desde Roma». Nunca dos «Añádela». Añadir una: «¿Qué excursión tienes?» y la hoja de la hora con «Hora de recogida».
- ✔ **10. Útil para el viaje.** Fila de tarjetas pequeñas que se deslizan: Seguro de viaje, eSIM Italia, Tarjeta sin comisiones y, en la gratis, «Buscar vuelos» al final.
- ✔ **11. Todo lo reservado se puede quitar** (entradas, Free Tour, excursiones, vuelos): texto rojo dentro de «Cambiar», con la confirmación en la misma ventana. No se mueve ningún día.
- ✔ **12. Textos.** Ningún proveedor ni «centro» suelto (lo comprueba la prueba nueva).
- ✔ **13. Pruebas.** `scripts/destino/pruebaTanda6s.mjs`, más todas las de siempre. Ver INFORME_TANDA6S.md.

## Cosas que salieron por el camino

- Las expresiones regulares de la 6m (horas con fecha) estaban rotas por culpa de un fallo de mi herramienta de edición: las horas «con fechas» se calculaban sin la fecha. Arregladas; ahora `/api/reservation-hours` acepta además la lista de fechas y devuelve los días cerrados.
- La prueba nueva encontró que, en viajes de menos de 4 días, quedaba el hueco vacío del bloque de excursiones. Arreglado: ya no sale ni el hueco, y «Útil para el viaje» ocupa todo el ancho.
