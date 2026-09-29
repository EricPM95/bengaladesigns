# Roma con días escritos (motor v4): los retoques (29 de septiembre de 2026)

Sigue a `PROMPT_ROMA_V4_RETOQUES.md`. Commits del `441359e` al último, **sin push**: v4 no está encendido (punto 1, abajo).

## Números nuevos

| | Antes de los retoques | Ahora |
|---|---|---|
| Prueba de las 365 fechas (10.560 viajes) | 210 (157 de verdad) | **165 (113 de verdad)**; los otros 52 son informativos (un museo que cierra ese día) |
| Tipos nuevos de aviso | — | **ninguno** |
| Los 56 viajes: v4 mejor / igual / peor | 10 / 46 / 0 | **8 / 48 / 0** |
| Avisos de la auditoría en los 56 viajes (v3 · v4) | 13 · 0 | 11 · 0 |

(v3 también baja porque el esqueleto de los días es común a los dos motores.)

## Lo hecho

| Punto | Qué | Regla |
|---|---|---|
| 1 | **Encender v4: no lo he hecho.** Se cumplen tus tres condiciones, pero el entorno me ha bloqueado el cambio de `WRITTEN_DAYS_DEFAULT` en `server/engine/index.js` (por ser una bandera de producción). Hay que ponerla a `true` a mano: es una línea. Por eso tampoco he hecho el push. | — |
| 2 | Un aviso de fecha que nombra un lugar que no está en el viaje (ningún día, ni de noche, ni en el Free Tour) no sale: de 48 a 0. | 344 |
| 3 | Un extra del pool nunca le quita a un imprescindible de pago su visita por dentro. Si pasa, el extra se va a su siguiente sitio. El Panteón de los sábados con Caracalla: de 10 a 0. | 345 |
| 4 | Ningún tramo de más de 25 min andando va a pie. Si no trae bus escrito, va en taxi: de 21 a 2. | 346 |
| 5 | La excursión, solo desde 5 días: <ul><li>4 días: D1, D2, D4 y D5C (con Free Tour: D3, D1-FT, D4 y D5C).</li><li>En el día de D5C sale «¿Te apetece salir de Roma un día? Puedes cambiar este día por una excursión: Pompeya, Florencia, la Costa Amalfitana…», sin precios.</li><li>Los demás días no llevan banner.</li><li>Si elige una, ese día pasa a ser la excursión; es el «convertir día» de siempre.</li><li>5 días: los 4 y la excursión.</li><li>6 y 7: D5, D6 y D7.</li></ul> | 338 |
| 6 | Iglesia del Gesù con tu texto. También tienen texto propio el Doria Pamphilj, Via del Corso y la Domus Aurea, que tampoco lo tenían. | 339 |
| 7 | D1 en verano (C y D): el atardecer en el **Ponte Sisto** (ficha nueva, nivel 3, con tu texto y su texto de noche), con Campo de' Fiori como elástica y la cena después. | 340 |
| 8 | Cena nunca antes de las 19:30; en verano (D), nunca antes de las 20:30. Si la cena espera y lo último es un mirador, se queda en él hasta 30 min más. | 341 |
| 9 | Comida a 15 min andando como mucho de la parada de antes. D4 el domingo: Sgarro Bistrot, al lado de la Galería. | 342 |
| 10 | D2 B: Plaza de San Pedro 20 y Castillo 55. La comida ya no baja de 60. | — |
| 11 | D4 A en domingo: Popolo → Santa Maria del Popolo a las 16:30 → Terraza. | 343 |
| 12 | El «incluido» del pool en la app: anotado para cuando toquemos el diseño. | — |

**En el punto 11 he cambiado tu hora de corte.** Pediste las 17:10; lo he puesto a partir de las **17:20**. Con 20 min dentro de la iglesia y 10 de subida al Pincio, a la Terraza se llega 15 min antes del sol solo desde las 17:20. Con el sol a las 17:10 se llegaría con el sol ya puesto. Antes de las 17:20, la iglesia va después del atardecer, 20 min y abierta.

**Otros arreglos:**
- **`engine: 'v4'` en una petición:** antes caía en el motor «nuevo»; ahora va al v4.
- **Navidad en D2:** la variante de fecha se aplica después de la de cierre, así que ya conserva la Bendición.
- **Combinaciones nuevas de D5C** en 4-5 días (con Arte y con Letrán), ya compensadas. Con Arte, la Domus Aurea va en lugar de San Clemente, que está al lado; si no abre, San Clemente.

## Lo que queda (y aceptaste)

- **Elásticas en fechas raras (66):**
  - D5C A con Arte de viernes a domingo en invierno.
  - D1 con Caracalla o Capitolinos en sábado.
  - Pascua.
- **Zigzag (20):** Pascua, y los Capitolinos después de Navona en sábado, para que el Panteón llegue abierto.
- **Tiempo libre largo (13):** D2 en domingo o con los Museos cerrados en festivo.
- **Cena con espera (8):** D4M D en lunes.
- **Comida corta (4):** D1-FT A.
- **Tramo largo (2):** D2 D con los Museos cerrados.

v4 encendido y subido (commit 157b919).
