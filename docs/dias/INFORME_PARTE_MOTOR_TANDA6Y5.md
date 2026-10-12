# Tanda 6y5 · parte del motor (puntos P1, P2, P3, P4, P6/P7 y P18)

## P1 · Eric reservó el Altar de la Patria y el Ara Pacis a la vez

**Qué pasaba:** no he podido reproducir ninguna pérdida. Lo probé de tres maneras:
- Con el motor: 19.000 viajes con las dos reservas (mismo día y días distintos, cuatro parejas de horas, con fechas y sin fechas, las dos en los dos órdenes de la petición, y con el Altar también elegido en el pool): ni una parada de menos.
- Con el almacén de la ruta de verdad y el servidor (`pruebaFase6y5_motor.mjs parte=p1`): poner las dos, quitar una, quitar la otra, en los dos órdenes, mismo día y días distintos, a cinco parejas de horas, con tres fechas y sin fechas: 4.322 comprobaciones en la primera pasada, 0 fallos (cifras finales abajo).
- Revisé también que ninguna parada de la mañana lleve «Tarde» y que cada día vaya por orden de hora.

Lo único «raro» que se ve es con las dos reservas **a la misma hora y el mismo día**: salen una detrás de otra a las 10:00 (el viajero reservó dos cosas a la vez; la app avisa y no prohíbe). Y una reserva de las 10:00 en un día cuyo Coliseo dura más de una hora sale antes del Coliseo: es lo que dice la hora. Si el «Ara Pacis delante de todo» de Eric era una de esas dos cosas, no hay nada roto. Si no, hace falta su viaje (fechas, horas y días de cada reserva).

**Dónde queda:** `pruebaListas.mjs` tiene un bloque nuevo («Dos reservas a la vez»): con cualquier combinación de las dos reservas, el viaje lleva las mismas paradas, y cada reserva sale en el día de su fecha y a su hora.

## P2 y P3 · Los días que cierran: el Vaticano en domingo, la Galería en lunes

**Qué pasaba:** cuando ningún día del viaje permitía evitar el cierre (una reserva grande fija otros días, o el cierre cae también en el día que quedaba libre, p. ej. 1 de enero, 11 de febrero y 19 de marzo en el Vaticano), el documento («domingo sin Museos», «lunes sin Galería») **quitaba el sitio**.

**Arreglo (una regla, en un solo sitio):**
- `data/pipeline_v2/roma.json` → `destination_config.closed_notices.sitios_que_no_se_quitan` (Museos Vaticanos y Galería Borghese) y el texto `se_queda`.
- `shared/routeEngine/listasTrip.js`: los sitios de esa lista no activan las variantes «si cierra, sin él» (contexto `cerrado`), y el paso 5.3 los deja en su día con el aviso («… está cerrado el domingo por cierre semanal. No hay otro día de tu viaje en que se pueda ir, así que se queda en su día y decides tú.»). El aviso sale en la parada y en los avisos del día. Tampoco entran en «No incluido» del pool por cerrar.
- **Antes de quedarse** el orden de los días (`listasOrden.js`, la 6k) ya busca otro día donde abra y cambia los dos días enteros; no lo toqué. La prueba comprueba, para cada caso en que un sitio se queda en un día que cierra, que **ningún** cambio con otro día libre dejaba a los dos días en fechas buenas.
- `server/engine/reservationPlan.js`: la hoja de la reserva añade una línea cuando, tras el cambio, el Vaticano o la Galería caen en un día que cierra y no hay otro día.
- Una reserva del propio viajero en un día que el sitio cierra sigue como antes (se queda y avisa).

**El miércoles de los Museos (lo que pidió Eric averiguar):** en `DIAS_ROMA_PARADAS.md` el día del Vaticano dice «el domingo, el miércoles (audiencia) y los días que cierran los Museos, este día se cambia con otro» y escribe una versión «el miércoles sin Museos» (Castillo, Puente, y la Plaza y la Basílica desde las 12:30). Es decir, el documento mezcla dos cosas: la audiencia del Papa cambia la Plaza y la Basílica por la mañana, pero **los Museos sí abren los miércoles** (en los datos, `closed_on` es solo el domingo). Por eso, hoy: (1) el orden de los días evita poner el Vaticano en miércoles, y (2) si no puede (una reserva fija el resto), la variante `miercoles_audiencia` quita los Museos. **No he cambiado el documento ni esa variante.** Lo cuento en las medidas: son 34 casos de 6.519 en una pasada de nueve en nueve fechas. Si Eric lo quiere, la corrección es de documento: que el miércoles lleve los Museos y cambie solo la Plaza y la Basílica.

## P4 · Una reserva grande a la hora de otra fila de su tabla

**Qué pasaba:** con el Coliseo desde las 14:16 la fila de su tabla trae una tarde con menos paradas y se perdían la Fuente de las Tortugas, el Elefantino, la iglesia de Santa Maria sopra Minerva y Plaza Venecia.

**Arreglo:** `listasTrip.js`, paso 5.0b (y `preparar`): se calcula el mismo día sin las reservas grandes; lo que esa fila ya no lleva (y no sale en ningún otro día) pasa a «Si te sobra tiempo» de ese día, con su registro («con tu reserva a esa hora ya no cabe en el día»). Un «de camino» que es un sitio (la Fuente de las Tortugas) pasa a parada corta en «Si te sobra tiempo»; una calle de camino sigue desapareciendo como siempre. No se añade lo que ve el Free Tour, ni lo cerrado ese día.

## P6 y P7 · Tope del pool 3 / 6

`poolSelectionLimit` (`CuratedPlacesPool.tsx`): 3 con 1 o 2 días, 6 con 3 o más (3 sin días). Prueba 6y4 de formulario ajustada y el invariante 576. Medida (`pruebaFase6y5_motor.mjs parte=tope`: 20 conjuntos al azar × una de cada 14 fechas, 540 viajes por forma; cuántos de los sitios elegidos quedan en «No incluido»):

| Días | Tope | Elegidos | En «No incluido» | % |
|---|---|---|---|---|
| 1 | 3 | 1.620 | 837 | 51,7 % |
| 2 | 3 | 1.620 | 203 | 12,5 % |
| 3 | 6 | 3.240 | 262 | 8,1 % |
| 4 | 6 | 3.240 | 2 | 0,1 % |
| 5 | 6 | 3.240 | 0 | 0 % |
| 6 | 6 | 3.240 | 0 | 0 % |

Ningún sitio elegido desaparece sin decirlo (sale en el viaje o en «No incluido»). Para pensar: con **1 día**, la mitad de lo que se elige no cabe; con 3 sitios, 1 día es el único caso con muchos «No incluido».

## P18 · Aviso de la Fontana de Trevi

`shared/routeEngine/pagoEntrada.js`: el aviso mira `desde_tarde_dias` (lunes y viernes, como la ficha) y no solo el viernes; sin esa lista sigue siendo el viernes.

## Pruebas

- Nueva: `scripts/destino/pruebaFase6y5_motor.mjs` (partes `p1` con servidor, `p2`, `p4`, `p18`, `tope`). Resultados (12 y 13 de octubre): p1 6.483 comprobaciones, 0 fallos; p2/p3 en las 365 fechas (58.035 viajes, 104.952 comprobaciones, 1.058 sitios que se quedan con aviso en un día que cierra, 330 miércoles de los Museos por el documento), 0 fallos; p4 en las 365 fechas (21.780 viajes), 0 fallos; p18 y tope, 0 fallos.
- `pruebaListas` con las 365 fechas completas (desde 2026-10-12, 16 procesos): 815.301 viajes, 2.220.356 días, 0 fallos.
- Pruebas 6g a 6z6d, 6y reorganizar, 6y2/6y3 reservas, 6y4 formulario y 6y4 listas: 0 fallos. Tipos (`tsc -p tsconfig.app.json`): sin errores.
- `pruebaListas.mjs`: bloque nuevo de dos reservas; con una reserva grande se compara siempre con el viaje de antes (ya no con «la fila de su tabla»), así que cualquier parada que falte es fallo; se quitan de las variantes admitidas `domingo_sin_museos`, `sin_museos` y `lunes_sin_galeria` (ya no existen); se admiten el Free Tour (lo que ya enseña) y el D1-corto de Navidad y Año Nuevo.
- Ajustes mínimos a pruebas existentes por las reglas nuevas: `comprobacionesListas.mjs` (acepta «se queda en su día, cerrado, con su aviso» y «Si te sobra tiempo» por la fila de la reserva), `invariantes6k.mjs` y `pruebaTanda6j.mjs` (aceptan una parada con ese aviso), `pruebaFase6y4_formulario.mjs` (tope 3/6).

## Preguntas abiertas

1. P1: ¿era el «Ara Pacis delante de todo» una de las dos cosas descritas arriba? Si no, necesito su viaje.
2. Miércoles: ¿que el documento deje los Museos en miércoles y cambie solo la Plaza y la Basílica?
3. Tope con 1 día: 3 sitios dejan casi la mitad en «No incluido». ¿Se baja a 2, o se deja?
4. Una calle «de camino» que ya no pasa por allí con una reserva grande sigue desapareciendo (no es una parada). ¿Vale?

## Lo que no hice

- No toqué `DIAS_ROMA_PARADAS.md` ni las pantallas.
- Las variantes viejas del documento («sin Museos», «lunes sin Galería») siguen en `listas.json` pero ya no se activan por cierre.
