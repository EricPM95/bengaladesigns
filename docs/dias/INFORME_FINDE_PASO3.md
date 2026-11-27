# Finde, paso 3: las pruebas viejas que fallaban

(27-nov. Cada prueba se ha pasado SOLA, con un solo Chrome. Regla: si la prueba encuentra un fallo de verdad, se arregla la app, no la prueba. En esta tanda **no ha salido ningún fallo de la app**: todo era la prueba desfasada o la prueba demasiado impaciente; ninguna línea de `src/` se ha tocado para esto.)

## Una línea por prueba

| Prueba | Antes | Qué era | Qué se hizo | Ahora |
|---|---|---|---|---|
| `pruebaV43` | 0 fallos (39 comprobaciones; la batería del día 27 decía 41) | no fallaba sola | nada | 39 · 0 fallos |
| `pruebaV44` | 2 fallos | **Prueba al día.** Pedía que al saltar saliera «Han cerrado…» (V44) y que los avisos de abajo se «juntaran» (V43). La V52 quitó el aviso «ya ha cerrado» (lo cerrado sale en su tarjeta, «YA HA CERRADO») y la V54 quitó el juntar avisos (cada uno espera su turno) | Las dos comprobaciones piden ahora lo de hoy: sin «Han cerrado» y con «YA HA CERRADO» en `ParadaHoy.tsx`; la cola de abajo no junta nunca | 43 · 0 fallos |
| `pruebaV45` | 0 fallos | no fallaba sola | nada | 54 · 0 fallos |
| `pruebaV55` | — | **No existe.** No hay ningún archivo con ese nombre; lo de la V55 (hojas con tarjetas, un solo formato) lo vigilan `pruebaV43` y `pruebaV44` y, desde este paso, `pruebaTandaHOY2_B` | nada | — |
| `pruebaTandaHOY1_B` | 1 fallo («no sale "Guardada · La comprobamos…"») | **Prueba demasiado impaciente.** En el paso «sin conexión» esperaba 1,6 s fijos a que el visor de la cámara tuviera imagen; con la máquina cargada tardaba más, el disparador abría el selector de archivos y la foto no se hacía (la captura mostraba «ABRIENDO LA CÁMARA…»). No es la app: con tiempo, el visor abre | Espera EXPLÍCITA a que el visor tenga imagen (hasta 20 s) antes de pulsar el disparador | 197 · 0 fallos |
| `pruebaTandaHOY1_C` | 0 fallos | no fallaba sola | nada | 0 fallos |
| `pruebaTandaHOY2_B` | 18 fallos | **Prueba al día** (ninguno era un fallo de la app: los botones y los textos que mira eran los de antes de la V55/V59/V77). Detalle abajo | Ver abajo | 125 · 0 fallos |
| `pruebaTandaHOY2_C` | 1 fallo («sin restaurante, "Es hora de comer" con [Elegir sitio]») | **Prueba al día.** Para quitar el restaurante del almuerzo borraba la línea que lo ponía; ahora el viaje de pruebas ya trae un restaurante recomendado en esa comida y quedaba puesto | La prueba vacía los dos campos (`recommendedRestaurant` y `chosenRestaurant`) a propósito | 132 · 0 fallos |
| `pruebaV35A_logros` | 0 fallos las 3 veces que la pasé sola (126 comprobaciones); en la batería falla una cosa distinta cada vez | **Prueba demasiado impaciente** (ver abajo). No hay un fallo de la app | Las 19 esperas fijas tras un clic se cambian por «espera y además hasta que la pantalla deje de cambiar» | 126 · 0 fallos, 3 de 3 veces |
| `pruebaV36C` (además) | 1 fallo («29 tarjetas, cada una con su id (32)») | **Prueba al día.** La V52 añadió tres tarjetas al estudio de sonidos (oculto, exp, dinero) | Cuenta 32 y comprueba que esas tres están | 129 · 0 fallos |

## `pruebaTandaHOY2_B`, detalle de las 18 comprobaciones

Todas eran del diseño anterior a la V55 (hojas con tarjetas), la V59 (hoja única de «Voy con retraso»), la V67 (margen de 15 min en las entradas) o la V77 («Si te sobra tiempo» y «Lugares pendientes» son una sola lista):

- **Voy con retraso (23, 30, aplicar, original: 8 fallos):** la hoja ya no es un «bloque de resumen» con [Aplicar] y [Ver otra opción]: es `data-hoja-cierre` con la tarjeta del sitio («A Lugares pendientes»), la franja verde y el dorado «Guardarlo en pendientes» (`data-cierre-pendientes` / `data-cierre-pasar`). La prueba hacía clic en `[data-propuesta-aplicar]`, que ahí no existe, y por eso «el día no cambiaba» y no salía el aviso: era la prueba, no la app (al hacer clic en el botón de ahora, el día cambia, sale el aviso con [Deshacer] y [Deshacer] lo deja como estaba). Ahora la prueba usa los botones y textos de hoy. La nota «admite hasta 15 minutos de retraso» (V67) ya no cuenta como «minutos al viajero».
- **Saltarme esta parada con reserva (25: 4 fallos):** la hoja es ahora una hoja de propuesta con «Guardarlo en pendientes» y «Dejarlo como está» (antes «Saltarlo igual» y «No, lo mantengo»). Mismos botones nuevos en la prueba; el resto (aviso con [Deshacer], la tarjeta pasa a la siguiente) pasa.
- **Textos del motor (3):** «lo más importante de tu día» (lo fijo), «Para no perder lo que tienes fijo tendríamos que quitar F, que es de lo más importante.» (la pregunta de lo imprescindible), y «Lugares pendientes» en vez de «Si te sobra tiempo» (V77).
- **Pasar a otro día 26c y añadir 27a (2):** «Lugares pendientes» (V77) y las tarjetas con «Hoy, a otra hora» / «Hoy, un poco más tarde» y el dorado «Añadirlo a mi día».
- **27b (1):** con la tarde apretada ya ningún sitio sale como «caso b» (quitar algo) en la pantalla: el motor mete el sitio y corre los de después («Hoy, un poco más tarde»), conservando el turno de las 15:00. El caso «b» de verdad (quitar algo) sigue comprobado en el motor (`anadir_27b`, que pasa). La comprobación de pantalla pide ahora «un poco más tarde» y que el turno no se mueva.

## Causa de lo raro de `pruebaV35A_logros`

La prueba no falla sola (3 de 3 limpias). Su patrón es: tras cada clic hace `await a.esp(400…900)` (19 esperas fijas) y lee la pantalla justo después; tiene además 5 esperas con tope de 20 s que sí son explícitas. Con la máquina cargada (una batería con varios Chrome, o un barrido de 365 en marcha) el panel (que pinta una tabla de 14 destinos con sus fotos y banderas) tarda más que esa espera, la prueba lee a medias y falla **una comprobación distinta cada vez** (la que le caiga justo en ese momento). Es una carrera entre el tiempo fijo y la carga, no un fallo de la app. Arreglo: `quieto(a, ms)`, que espera lo de siempre y, además, hasta que el texto de la página y el número de elementos no cambian en 3 miradas seguidas (tope 8 s). Pasada 3 veces sola después del cambio: 0 fallos.

## Otra causa de fallos «al azar» que se ha quitado (HOY2_B y HOY2_C)

Durante el paso, las dos pruebas fallaron de golpe («sin parada Jameos en el día 3: Montañas del Fuego (Timanfaya) | Castillo de Santa Bárbara | …») unas veces sí y otras no, y la ruta de Lanzarote que generaba la prueba era distinta. La causa, mirando el código de la ruta de pruebas (`src/dev/rutaDePrueba.ts`): la ruta entra en el almacén **antes** de que termine la adaptación a los vuelos (`vuelos: {llegada, vuelta}`), y las pruebas daban 2,5 s por bastantes. Con la máquina cargada (el barrido de 365 está corriendo) la prueba guardaba como «ruta original» una a medias y todas sus partes fallaban. Arreglo: espera explícita a que el día 3 tenga ya Jameos del Agua (hasta 90 s) antes de seguir, en las dos pruebas. No es un fallo de la app (la ruta final es siempre la misma; ocurre solo en esa ventana de unos segundos que solo existe en el probador de desarrollo).

## Resultado final de las pruebas de este paso (cada una sola, un Chrome)

`pruebaV43` 39/0 · `pruebaV44` 43/0 · `pruebaV45` 54/0 · `pruebaTandaHOY1_B` 197/0 · `pruebaTandaHOY1_C` 0 fallos · `pruebaTandaHOY2_B` 125/0 · `pruebaTandaHOY2_C` 132/0 · `pruebaV35A_logros` 126/0 (3 de 3) · `pruebaV36B` 41/0 · `pruebaV36C` 129/0 · `pruebaV36_servidor` 31/0 · `pruebaV36_cliente` 32/0.
