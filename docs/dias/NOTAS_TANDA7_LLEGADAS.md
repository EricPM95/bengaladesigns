# Notas de la Tanda 7 (llegadas y vueltas)

**Ya está todo pasado a limpio (8-oct-2026):**
- **El documento:** `DIAS_ROMA_PARADAS.md`, sección final «Llegadas y vueltas»:
  - los barrios y las seis llegadas;
  - la tabla según la hora a la que está libre;
  - el Free Tour (10, 12, 15, 17 y 21) y su tabla;
  - los márgenes;
  - los textos de la vuelta.
- **La tanda:** `PARA_CODE_TANDA7.md`, que va después de la 6j.

Este archivo queda solo como aviso: lo que vale es lo de esos dos.

**Antes de pasar la Tanda 7 (para Claude):** en `DIAS_ROMA_PARADAS.md`, sustituir arriba «Qué días lleva cada viaje», «El día de excursión» y «El orden de los días» por «El orden nuevo de los días» (que ahora está dentro de «Llegadas y vueltas»), para que quede una sola versión.

**Añadir a la Tanda 7 (9-oct-2026): la barra de llegada y de vuelta, gratis y de pago:**
- **Gratis** (con el pago apagado):
  - la barra sale como ahora, con «LLEGADA · AVIÓN DESDE BARCELONA», pero **sin «+ AÑADIR VUELO»**, porque llevaría a un bloque que no se ve;
  - solo la flecha «›», que abre la ventana de llegada con todo, como ahora (Fiumicino y Ciampino; en tren, Termini y Tiburtina…);
  - igual en la barra de la vuelta.
- **De pago, con el punto elegido:**
  - la ventana enseña **solo ese punto**, con «Para tu zona» arriba (punto 11);
  - abajo, en pequeño, «¿Llegas por otro sitio? Ver Ciampino» (o el otro punto de ese medio);
  - **sin punto elegido,** todo, como en la gratis.
- **Code, mira antes** si la ventana ya filtra por `arrivalPointId` / `departurePointId`. Si ya lo hace, solo hay que quitar el botón en la gratis.
- **(9-oct) Lo de la barra de llegada y vuelta (gratis sin «+ Añadir vuelo», de pago solo el punto elegido) pasa a la tanda 6s.** No hace falta repetirlo en la 7. En la 7 sí hay que acordarse de que la 6s ya ha quitado la tarjeta del primer y el último día de RESERVAS, pero no la hoja «¿Ajustamos tu ruta a tu vuelo?» ni el campo `flightAdjust`.
- **(9-oct) Ninguna hora calculada a la vista (Eric):** la app no enseña horas que calcula ella a partir del vuelo («En el centro {hora}», «libre hacia las {hora}», «Sal a las {hora}», «Libre hasta / Maleta a las»). Si el vuelo se retrasa, es una promesa que no podemos cumplir. Por dentro sí se usan para montar el día. **Antes de pasar la Tanda 7, quitar de `PARA_CODE_TANDA7.md` y del documento todos los textos que enseñan esas horas** (la hoja del resumen, la barra, «Aterrizas a las… libre a las…»). Las horas que pone el viajero y los datos reales («32 km al centro», «De Fiumicino al centro», «32 min») sí se enseñan.
