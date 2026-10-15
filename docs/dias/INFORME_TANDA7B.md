# Tanda 7b: las mañanas del día de vuelta que no cabían

Respuesta 1 de Eric (14-oct) en `PREGUNTAS_TANDA7.md`: listas más cortas escritas a mano, sin cortar por minutos.

## Qué se hizo
- **Tabla «Qué lleva el día de vuelta según la hora»** (`DIAS_ROMA_PARADAS.md`): solo cambian las filas de 15:00 a 16:59 (su lista sin comida) y de 17:00 a 22:59 (su lista con comida si la tiene; si no, la mañana de siempre). La de 23:00 o más no cambia.
- **Listas nuevas**, tras `DC-cupula`: `DS-vaticano`, `DS-roma-antigua`, `DS-pincio-popolo`, `DS-aventino`, `DS-cupula` (vuelo de 15:00 a 16:59, sin comida) y `DCC-vaticano`, `DCC-roma-antigua`, `DCC-cupula` (vuelo de 17:00 a 22:59, con comida). El Pincio-Popolo y el Aventino usan su mañana de siempre con el vuelo de 17:00.
- **Motor:** el convertidor enlaza cada fila de «Las últimas mañanas» con su `DS-`/`DCC-` por el nombre de la corta (`fila.sin_comida`, `fila.con_comida`); `disponerVuelta` devuelve `listaPropia` y `listasTrip.js` la usa. Sin lista propia, todo igual que antes. El lunes del Aventino (`lunes_sin_caracalla`) está en `listasVariantes.mjs`.
- **Dos retoques de texto** (aprobados por Eric): Trevi lleva «(el día empieza a las 7:30)» y el Coliseo «(turno)».

## Cuánto cabe (vuelo más temprano de su fila, Fiumicino, peor día de la prueba)
| Lista | Fila | Acaba | Hay que salir | |
|---|---|---|---|---|
| DS-vaticano | 15:00 | 11:24 | 12:00 | cabe |
| DS-roma-antigua | 15:00 | 11:53 | 12:00 | cabe |
| DS-pincio-popolo | 15:00 | 11:26 | 12:00 | cabe |
| DS-aventino | 15:00 | 11:48 | 12:00 | cabe |
| DS-cupula | 15:00 | 11:30 | 12:00 | cabe |
| DCC-vaticano | 17:00 | 13:47 | 14:00 | cabe |
| DCC-roma-antigua | 17:00 | 13:42 | 14:00 | cabe |
| DCC-cupula | 17:00 | 13:36 | 14:00 | cabe |
| DT-medio (de siempre) | 17:00 | 13:30 | 14:00 | cabe |
| DA-medio (de siempre) | 17:00 | 13:30 | 14:00 | cabe; Pirámide Cestia y Cementerio Protestante a «Si te sobra tiempo» |

Las mañanas cortas (13:30) no se tocaron: `DC-vaticano` (+3 min), `DC-roma-antigua` (+7) y `DC-pincio-popolo` (+7) siguen pasándose por poco, como Eric decidió. No hay nada que preguntar: no existe `PREGUNTAS_TANDA7b.md`.

## Pruebas ajustadas
- `pruebaTanda7_vuelta`: espera la lista `DS-`/`DCC-` de la fila según la hora.
- `pruebaTanda7_hoy`: el caso de mañana recortada pasó a 3 noches con el Aventino (la Cúpula con 17:00 ya no deja nada fuera).
- `pruebaTanda7_documento`: la fachada de la Basílica «de camino» también vale en `DCC-vaticano`.
- `megustaInicial6y10`: las `DCC-` no cuentan dos veces la comida de su día de origen (las cifras de `roma.json` no cambian).

## Nota aparte
**Fallo anterior, no de esta tanda.** `pruebaTanda6g` da 1 fallo (`etiqueta_roja`) y da exactamente el mismo sobre `origin/main` (9af2c31) sin ningún cambio de esta tanda, lanzada en un `git worktree` aparte. Comprueba que, en `DayList.tsx`, la etiqueta «Día de viaje» se escribe dentro de un texto con la clase de color naranja de la app (`text-accent">{etiquetaDeViaje(title)}`). Falla porque en `DayList.tsx` (línea 302) la etiqueta se pinta ahora dentro de un texto gris (`text-text/55`) y ya no lleva `text-accent`. Sin mirar la pantalla no sé si el naranja se quitó a propósito (entonces la prueba está vieja) o si es un descuido; queda para que lo decida Eric.

## Pruebas finales
- **Batería** (82 pruebas): todas en 0 fallos salvo `pruebaTanda6g` (fallo anterior, ver arriba) y `pruebaFase6y5_motor`, que no se lanza por lo larga (más de 20 min), como en la tanda anterior. Las 7 que fallaron al lanzarla por primera vez (`ficha`, `formulario`, `6z6c`, `6z6d`, `documento`, `hoy`, `6u`) se arreglaron o se repitieron con los servidores arrancados y dan 0.
- **Muestra de 61 fechas** (`pruebaListas`, desde el 16-oct-2026, una de cada 6): 136.384 viajes y 371.508 días, **0 fallos** (3.807 s).
- **Las 365 fechas completas:** se lanzan después del push; su resultado va abajo, en un commit aparte.
