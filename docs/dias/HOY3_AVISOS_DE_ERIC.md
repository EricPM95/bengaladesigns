# Los avisos del viaje de Eric (HOY3)

Lanzarote, domingo 8-nov (aterriza a las 8:25) → viernes 13-nov (vuela a las 19:40). Costa Teguise, coche de alquiler. Horas en la hora de Lanzarote (Atlantic/Canary; en noviembre, una hora por detrás de la Península). Hecho con `scripts/destino/_hoy3_listaDeEric.mjs` sobre la ruta que genera la app (`docs/dias/_hoy3_ruta_eric.json`).

## domingo 8

| Hora | Aviso | Texto |
| --- | --- | --- |
| 08:35 | Llegada | Bienvenido a Lanzarote. Cuando tengas el coche, empiezas hacia las 11:25. |
| 17:04 | Atardecer | Hoy el sol se pone a las 18:04. Desde Famara se ve precioso. |

## lunes 9

| Hora | Aviso | Texto |
| --- | --- | --- |
| 07:30 | Mañana | Buenos días. Hoy toca Fuego y mar: sal de casa a las 7:51. |
| 17:04 | Atardecer | Hoy el sol se pone a las 18:04. Desde El Golfo se ve precioso. |

## martes 10

| Hora | Aviso | Texto |
| --- | --- | --- |
| 08:56 | Mañana | Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26. |
| 17:03 | Atardecer | Hoy el sol se pone a las 18:03. Desde Famara se ve precioso. |

## miércoles 11

| Hora | Aviso | Texto |
| --- | --- | --- |
| 08:14 | Mañana | Buenos días. Hoy toca La Graciosa: sal de casa a las 8:44. |
| 17:02 | Atardecer | Hoy el sol se pone a las 18:02. Desde Famara se ve precioso. |

## jueves 12

| Hora | Aviso | Texto |
| --- | --- | --- |
| 08:17 | Mañana | Buenos días. Hoy toca Papagayo y Playa Blanca: sal de casa a las 8:47. |
| 17:02 | Atardecer | Hoy el sol se pone a las 18:02. Desde el Faro de Pechiguera se ve precioso. |

## viernes 13

| Hora | Aviso | Texto |
| --- | --- | --- |
| 09:08 | Vuelta (mañana) | Hoy vuelves a casa. Devuelve el coche en la T1 antes de las 17:10. |
| 15:17 | Vuelta (antes de salir) | En media hora tienes que salir hacia el aeropuerto. |

## Los que salen SOLO si toca

**El tiempo, la noche antes (21:00).** Sale si mañana hay lluvia, nubes sobre un mirador del norte o viento fuerte (umbrales de data/hoy/avisos_tiempo.json). Ejemplos con una previsión inventada:

- Si hay nubes en el Mirador del Río el martes 10: lunes 9 a las 21:00: «Mañana habrá nubes en el Mirador del Río. Te hemos preparado una alternativa en HOY.» · y la mañana de ese día lleva el tiempo: «Buenos días. Hoy toca El norte de Manrique: sal de casa a las 9:26. Hoy hay nubes en el Mirador del Río. Te hemos preparado una alternativa en HOY.»
- Si hay viento fuerte en Los Hervideros el lunes 9: domingo 8 a las 21:00: «Mañana habrá viento fuerte en Los Hervideros. Te hemos preparado una alternativa en HOY.» · y la mañana de ese día lleva el tiempo: «Buenos días. Hoy toca Fuego y mar: sal de casa a las 7:51. Hoy hay viento fuerte en Los Hervideros. Te hemos preparado una alternativa en HOY.»
- Si hay lluvia por la mañana el jueves 12: miércoles 11 a las 21:00: «Mañana va a llover por la mañana. Te hemos preparado una alternativa en HOY.» · y la mañana de ese día lleva el tiempo: «Buenos días. Hoy toca Papagayo y Playa Blanca: sal de casa a las 8:47. Hoy va a llover por la mañana. Te hemos preparado una alternativa en HOY.»

**«Sal ahora para llegar a tu turno»:** solo si apuntas una reserva o un turno con hora. Ejemplo: si reservas la Cueva de los Verdes a las 11:30 del martes 10, a esa hora de salir llega:

| Hora | Aviso | Texto |
| --- | --- | --- |
| 11:22 | Turno | Sal ahora para llegar a tu turno de las 11:30. |

## Cómo se cuentan

- La mañana sale 30 min antes de la hora de salir de casa, nunca antes de las 7:30 (el lunes 9 se sale a las 7:51: el aviso llega a las 7:30). El domingo 8 no lleva «mañana»: ya vas de camino y el aviso es el de la llegada.
- La llegada: aterrizas a las 08:25 + 10 min; «empiezas hacia las 11:25» es la hora útil del primer día (la del motor de coche).
- El atardecer, 1 hora antes de la puesta de sol (calculada para ese día); con la parada del día si la hay (El Golfo, el Faro de Pechiguera…) o, si no, el sitio de atardecer más cercano a la zona de hoy.
- El viernes 13: por la mañana, la hora límite del coche en la T1 (17:10); y 30 min antes de salir hacia el aeropuerto (sales a las 15:47) → 15:17.
- Como mucho 4 al día y ninguno entre las 22:00 y las 7:30 (salvo el de llegada).
