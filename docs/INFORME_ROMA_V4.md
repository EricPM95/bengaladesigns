# Roma entera con días escritos (motor v4) — informe (29 de septiembre de 2026)

Todo en commits sin push, del `5129d8b` al último. **La app sigue con v3 por defecto**; v4 se enciende con `ROUTE_ENGINE=v4`.

## 1. Lo que está hecho

- **D4, como pediste:**
  - En A y B, después del sol: la nocturna y luego «luces y aperitivo» (90 min como mucho), con su hora de cena.
  - A: la elástica son los Jardines del Pincio (30).
  - B: como C.
  - C: el lago (60) → Jardines (20) → Terraza.
  - D: el lago y el templo de Esculapio (elástica, 60) → «Aperitivo en los Jardines del Pincio» (45) → Terraza.
  - Ninguna parada de paseo pasa de 90 min.
  - Santa Maria del Popolo, por fuera del 5 al 12 de febrero.
  - Ficha del Parque de Villa Borghese comprobada en la web de Roma Capitale: 06:30 a 19:00, 21:00 o 22:00 según el mes.
- **Los días:** D1, D2, D3, D1-FT, D4, D4M, D5, D5C, D6 y D7 están escritos, con:
  - su mañana (y la tranquila) y las 4 tardes por la luz;
  - variantes por cierres: lunes, miércoles de audiencia, domingo, sábado del Panteón y el Doria Pamphilj cerrado;
  - fechas especiales: 1 de enero, Navidad, Pascua y primer domingo;
  - experiencias y los sitios del pool.
  - La excursión (D6/D7 con Tívoli u Ostia) sigue como estaba: media jornada con su tarde escrita.
- **El pool:**
  - Lo que ya va en la ruta sale como incluido y no cuenta.
  - Los extras, como mucho 2, 3, 4 o 5 según los días.
  - Cada extra tiene su sitio escrito y un segundo sitio. Si dos piden el mismo hueco, manda el orden de `pool_lista`.
- **El motor v4** (`shared/routeEngine/writtenTrip.js`):
  - Elige los días y su orden con la tabla de siempre.
  - Aplica lo escrito y calcula las horas con la matriz de tiempos.
  - Ajusta la elástica ±30. No inventa ni estira nada.
  - v3 no se ha tocado.
- **Las herramientas** (en `scripts/destino/`):
  - `prueba365.mjs`: la prueba de las 365 fechas.
  - `comparacion.mjs`: los 56 viajes con v3 y v4.
  - `reparto.mjs`: dónde va cada lugar, en `docs/REPARTO_ROMA.md`. Todos los lugares de nivel 1 y 2 tienen sitio.
  - `calibrar.mjs`: el centro de la elástica de cada día.
  - `v4dia.mjs`: un viaje, día a día.

## 2. La prueba de las 365 fechas

Son 10.560 viajes: cada día de 2027, de 2 a 7 días, los dos ritmos, con y sin Free Tour, cada experiencia y el pool (solo y en parejas).

| | Al empezar | Ahora |
|---|---|---|
| Total | 2.350 | **210** |
| De ellos, informativos (un museo de pago que ese día cierra: 1 de enero, Navidad…) | 54 | 53 (quedan **157** de verdad) |

**No da 0.** Lo que queda, en `docs/PRUEBA365.md`:

| Qué | Cuántos |
|---|---|
| Aviso de fecha que nombra un lugar que no está en el viaje | 48 |
| Elástica que no llega ni con los 10 min del mirador | 24 |
| Tramo de más de 25 min andando | 21 |
| Zigzag (volver a una zona ya dejada) | 20 |
| Tiempo libre largo | 19 |
| Imprescindible de pago sin visita por dentro | 10 |
| Comida corta · cena con espera | 4 · 4 |
| Otros (repetidos en Navidad con los Museos cerrados, una llegada tarde) | 7 |

## 3. v3 contra v4 (los 56 viajes de las revisiones)

**v4 mejor en 10, igual en 46, peor en 0.** Avisos de la auditoría: v3 13, v4 0. El detalle, viaje a viaje, está en `docs/COMPARACION_V3_V4.md`.

**Por qué sigue v3 por defecto:** tu regla era «si la prueba da 0 y los 56 salen igual o mejor». Lo segundo se cumple; lo primero, no. Pasar a v4 es cambiar una línea (`WRITTEN_DAYS_DEFAULT` en `server/engine/index.js`). Mi opinión: lo que queda en v4 son casos raros (sábados con dos extras, festivos, pool en invierno), y v3 tiene más avisos en los 56 viajes. Yo lo encendería después de que mires los puntos de la sección 5.

## 4. Lo que he decidido yo (como lo haría un romano)

- **El mirador, de 15 a 35 min antes del sol** (regla 334). Una versión de la tarde abarca 64 min de sol y la elástica solo 60.
  - Los días frontera entre versiones no cabían nunca.
  - Ahora lo que falta (hasta 10 min) se absorbe llegando un poco antes o un poco después al mirador.
  - Esto solo, bajó unos 800 avisos.
- **Un taxi escrito no se coge para 8 min andando** (335): la Isla Tiberina y Santa Cecilia, cuando van seguidas.
- **La versión vecina en la frontera de luz** (336): si la elástica no llega, el día prueba la versión de al lado. Casi nunca ayuda (entre versiones hay unos 74 min), pero no estorba.
- **Un extra del pool quita lo que añade** (337):
  - El Aventino en D2 acorta Trastevere (y en D quita Santa Cecilia).
  - Los Capitolinos en D5 A quitan las Catacumbas y la Isla.
  - El Parque en D4 A es el lago en lugar de los jardines, y su primer sitio es D4M.
- **El Castillo:** siempre por dentro en D2 y, con Free Tour, por la mañana de D4.
- **D7:**
  - Revisitas con texto propio.
  - Si el Castillo ya se vio, el Palazzo Doria Pamphilj.
  - El miércoles, que cierra: por fuera, y el rato va a Via del Corso y la Plaza Colonna (Minerva y San Luigi ya salen en D1).
- **D2:**
  - El lunes, con más luz, empieza por Borgo Pio.
  - El miércoles, en tranquilo, el Castillo va en 50 min para que la comida no se quede corta.
- **D5 con D1-FT** (suma Largo Argentina y el Gesù): su propia Via Appia, más corta.
- **Fechas:**
  - **Pascua:** el Altar de la Patria, a la vuelta de la Bendición y más corto; la tarde empieza a las 14:30, para que el Panteón llegue abierto.
  - **1 de enero con Free Tour:** la mañana empieza a las 10:00, no a las 8:00 con todo cerrado.
  - **Navidad en D4 con Free Tour:** el Castillo por fuera a las 10:30 y el parque, 85 min.
- **Explorar y avisos:**
  - **Villa Farnesina, solo en Explorar:** abre de 9 a 14 y los días de Trastevere son de tarde.
  - **La Befana en viajes con Free Tour:** el aviso nombra Piazza Navona y el Free Tour pasa por allí. La prueba ahora lo cuenta como visto.
- **Cenas:** en C y D la cena es al llegar, desde las 19:30. En A y B lleva su hora, calculada con las 365 fechas.
- **No he tocado el diseño.** El «incluido» del pool ya lo manda el servidor (con `days`), pero la app no lo pinta todavía.

## 5. Lo que no he podido arreglar

- **Avisos de fecha que nombran un lugar que no está en el viaje**:
  - El Circo Máximo el 21 de abril, los Capitolinos el 1 de mayo…
  - Son tus textos de `fechas_especiales` y no los he cambiado.
  - Arreglo: quitar el nombre del texto, o que el aviso salga solo si el lugar está.
- **El Panteón sin visita por dentro** (10): viajes de 4 días que empiezan en sábado con Caracalla en el pool. El sábado el Panteón cierra a las 16:00 y Caracalla ocupa la primera hora de la tarde.
- **Los Capitolinos del pool en sábado**: van después de Navona para que el Panteón llegue abierto. A cambio sale un zigzag corto y alguna espera de cena (8 y 4 casos). Lo prefiero a perder el Panteón.
- **El zigzag de Pascua** (9): el Altar de la Patria, a la vuelta de la Bendición, está junto al Foro de la mañana. Quitarlo dejaba el Altar sin visita en los viajes cortos, que es peor.
- **Elásticas que no llegan**: sobre todo D2 en 2 días con fechas raras (1 de mayo, 14 de agosto, lunes de Pascua) y dos extras del pool juntos en invierno.
- **Tiempo libre largo**:
  - D2 en domingo, en viajes de 2 días (el orden ya evita el domingo cuando puede).
  - Algún festivo con todo cerrado (24 y 25 de diciembre).
- **Tramos de más de 25 min andando**: D2 con los Museos Vaticanos cerrados en festivo, y D1 con Caracalla el sábado.
- **Comida corta**: 4 casos de D1-FT A en viernes y sábado.
