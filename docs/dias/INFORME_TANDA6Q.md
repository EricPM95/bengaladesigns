# Informe de la Tanda 6q

Hechos los cuatro puntos. Lo que he decidido yo está en `PREGUNTAS_TANDA6Q.md`. No cambia cómo se montan los días.

## Lo que cambia

- **La 6p, deshecha** (commit `9523876`): las tarjetas vuelven a como estaban. La pestaña RUTA no se ha tocado y no cambia nada respecto a antes de la 6p (no usa estos componentes).
- **Solo móvil (430 px o menos) y solo DÍAS:**
  - Las tres rayitas están en el borde que separa el panel blanco del fondo beige, justo en medio, a la altura de cada tarjeta; la tarjeta se alarga por la izquierda hasta donde estaban (de 285 a 312 px). Arrastrar sigue funcionando.
  - La franja de color, más estrecha y con el icono más pequeño; la foto, un 14 % más estrecha.
- **El «···» y la pestañita de entrada, sin pisarse (móvil y ordenador):** el «···» arriba a la derecha y la pestañita abajo a la derecha, en la misma vertical, con el mismo hueco hasta el borde de arriba y de abajo. Nunca se tocan ni tapan el nombre.
- **Fuera la hora fija de encima del nombre** en todas las tarjetas de parada. La única hora que se ve es la de la pestañita verde. La franja de arriba («MAÑANA · 09:30–15:00») se queda como está.

## Capturas (375 px)

- **DÍAS antes** (antes de la 6p): `img/6q_dias_antes_375.jpg`
- **DÍAS después, con la pestañita naranja:** `img/6q_dias_despues_naranja_375.jpg`
- **DÍAS después, con la verde y su hora:** `img/6q_dias_despues_verde_375.jpg`
- **RUTA después** (igual que antes de la 6p: esa pestaña no se toca): `img/6q_ruta_despues_375.jpg`

## Comprobado

- A 375 y 390 px: naranja, verde con la hora, Free Tour sin reservar y «Museos Vaticanos y Capilla Sixtina» en dos líneas sin «…»; «El Puente y el Castillo de Sant'Angelo iluminados» en dos; ningún nombre toca el «···» ni la pestañita.
- Arrastrar una parada funciona. En el ordenador, las esquinas son las mismas y las rayitas no cambian.
- Pruebas del motor y typecheck: ver abajo.

## Las pruebas

- 6g, 6h, 6i, 6j, 6k (4.483 viajes), 6l, `pruebaTanda6o` (29 enlaces de Civitatis, todos con `aid=5206`) y `pruebaListas` (una de cada 5 fechas, de 1 a 6 días, 4 grupos): **0 fallos**. Typecheck limpio. El motor no ha cambiado.
