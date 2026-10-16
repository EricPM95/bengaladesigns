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

## Las 365 fechas completas (después del primer push, c406899)
Lanzadas con todo ya subido (`_correr365.mjs desde=2026-10-16`, 16 tramos a la vez, 2.999 s): **815.379 viajes y 2.220.668 días, 0 fallos en los 16 tramos.**

## El fallo anterior de `pruebaTanda6g`, arreglado
Eric confirmó que fue un descuido (la etiqueta «Día de viaje» va en el naranja de la app, `text-accent`, como «Día de excursión»; decidido en la Tanda 6g). Se arregló la pantalla, no la prueba: en `DayList.tsx` (línea 302) el texto «Día de viaje» vuelve a llevar `text-accent`; el «·» y el trayecto se quedan en gris. No toca el motor, así que no se repitieron las fechas. `pruebaTanda6g`: 0 fallos. Batería rápida de nuevo (82 pruebas, con los servidores 8787 y 8883): 81 en 0 fallos; `pruebaFase6y5_motor` no se cuenta (se para a los 1.500 s, como en la tanda anterior; las 365 fechas ya revisan el motor). En la pestaña Días «Día de viaje» y «Día de excursión» (`ExcursionCardMeta.tsx`) van en naranja y no queda ninguna etiqueta de día con `accent-red`. El título grande de un día sin paradas que se llama «Día de viaje» no es la etiqueta y se queda como está.

## `pruebaFase6y5_motor` por fin entera (fallo de la prueba, no del motor)
Lleva sin acabar dos tandas porque tarda más de una hora. Lanzada sola y sin límite: **3.669 s (unos 61 min), 143.647 comprobaciones, 0 fallos** (antes del arreglo: 3.875 s y 9 fallos).

- **Qué fallaba.** La regla `p4_parada_perdida` daba 9 fallos, todos la «Cripta de los Capuchinos», en los viajes de 3 días que empiezan el 24, el 25 o el 31 de diciembre de 2027 con el Coliseo reservado a las 13:30, 14:16 o 15:00. La prueba exige que lo que se quita por una reserva grande pase a «Si te sobra tiempo».
- **Desde cuándo.** Desde `ec8deab` (Tanda 6y10, 13-oct): con `96506d8` da 0 y con `ec8deab` da 9. No es de la Tanda 7 ni de la 7b (`b97f9c3` da 0; `9af2c31` y la versión actual dan los 9). Se escapó porque la prueba no se esperó entera en las tandas 7 y 7b.
- **Por qué era la prueba y no el motor.** La Cripta no es una parada propia: el documento la pone «en lugar de la Galería» solo cuando la Galería cierra (variante `lunes_sin_galeria`: 25-dic y 1-ene, sábado). Al reservar el Coliseo, la reserva mueve los días enteros y Villa Borghese pasa al 26-dic o al 2-ene (domingos, Galería abierta): la variante ya no se activa y el recambio no hace falta. La Cripta no va a «Si te sobra tiempo» cuando la Galería está abierta (decisión de Eric).
- **El arreglo, solo en la prueba** (`pruebaFase6y5_motor.mjs`): `p4_parada_perdida` no cuenta como perdida una parada que en el plan sin reserva venía de una variante que depende de la fecha (un cierre o un día de la semana) cuando, con la reserva, esa variante ya no está en ningún día. Vale para cualquier recambio de ese tipo; todo lo demás sigue exigiendo «Si te sobra tiempo». El motor no se tocó, así que no se repitieron las fechas.
- **Batería rápida** (81 pruebas, sin `6y5_motor`): todas en 0 fallos.

### Cómo meterla en la batería normal
Partida por partes y lanzadas a la vez (`parte=p1`, `p2`, `p4`, `p18,tope`), 0 fallos en todas: p1 985 s, p2 1.616 s, p4 792 s, p18+tope 85 s. A la vez tarda lo de la más lenta (p2): unos 27 min en lugar de 61. Para bajar de ahí hay que partir también p2 y p4 por fechas (un parámetro `tramo=i/n` que reparta `fechasAnio`, como `_correr365`): la suma es unos 3.500 s de CPU, con 16 procesos unos 5 min. Pendiente de hacer si Eric lo quiere.
