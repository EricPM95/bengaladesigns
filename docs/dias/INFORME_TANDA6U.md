# Informe de la Tanda 6u

## Qué hace ahora la app

- **El Free Tour según su hora.** Con el de las 10:00 (el de siempre), 12:00, 15:00 o 17:00 el viaje lleva el D3 de esa hora y la parte de los Museos se ordena con la tabla «Las horas de los Museos»; a las 12:00 el día empieza a las 8:00 con el Templo de Adriano, la Piazza Colonna y Via Condotti antes del tour. Con el de las 21:00 no hay D3: el viaje lleva los días de «Sin Free Tour» y el tour va en la noche del primer día, en lugar de Trevi y la Plaza de España; la cena es antes (hacia las 19:30, junto al punto de salida).
- **Cómo llega la hora.** Al reservar el Free Tour (o cambiar su hora) el servidor lo apunta en las respuestas del viaje y todos los días se rehacen con él (todo o nada; los días cambiados a mano no se tocan). Un solo sitio, sin parches.
- **Nunca se propone otra hora.** Quitada la última pieza que lo hacía (el servicio «reservation-advice» y sus textos). Lo único que avisa: «coinciden», cuando no da tiempo a llegar de una reserva a otra.
- **La comida, hasta las 15:00**, en un solo sitio para todos los destinos. **Ningún día cambia** (4.968 viajes comparados).
- **Paradas nuevas** (Templo de Adriano y Piazza Colonna) y **las diez calles como paradas**.
- **Quitado** el aviso «…con el centro a tu aire».

## Cuántos viajes cambian (prueba de listas, una de cada 10 fechas)

| | antes de la 6u | ahora |
|---|---|---|
| Viajes de 1 y 2 días con algo en «Si te sobra tiempo» | 2.467 | 2.359 |
| Viajes de 3 días | 1.183 | 1.164 |
| Viajes de 4 días | 2.368 | 2.328 |
| Horas de reserva sin lista escrita («sin_lista») | 108 / 185 / 370 | **0** |

Con las calles como paradas, en general se va a «Si te sobra tiempo» menos que antes (las listas nuevas del documento caben mejor). No he sacado la lista día a día de lo que se va; si la quieres, me lo dices.

## ¿Queda alguna hora de reserva sin lista?

No: la prueba de listas ya no cuenta ninguna (Coliseo, Museos, Galería y Free Tour). Hay dos horas que tienen lista pero con una pega, en PREGUNTAS (1 y 2).

## Fotos

- Templo de Adriano y Piazza Colonna: **sin foto** (no existe `docs/archivo/fotos_6u/`). Van sin recuadro.
- Las diez calles tienen foto; Via Condotti, como estaba.

## Pruebas

Todas a 0 fallos: 6g, 6h, 6i, 6j, 6k, 6l, 6o, 6r, 6s, 6t, 6v, la prueba de listas completa (días 1-2, 3, 4 y 5, una de cada 5 fechas) y la nueva 6u. La 6u cubre 1.494 viajes de 2, 3 y 4 días, con y sin fechas, con el Free Tour a cada hora y los Museos de 8:00 a 18:00 cada 15 min, y el servidor (la hoja y la reserva del Free Tour dan los mismos días).

## Capturas (375 px)

- `img/6u-solape-free-tour-12-375.jpg`: el aviso «coinciden» al poner el Free Tour a las 12:00 con los Museos a las 14:00.
- Pendiente (PREGUNTAS 8): el D3 a las 12:00, 15:00 y 17:00 y el D1 con el de las 21:00 en pantalla. Comprobados con el servidor.

## Lo que ha salido por el camino

- El D3 con el Free Tour a las 15:00 dejaba la Plaza, la Basílica y la comida detrás del tour: venía de un traslado que quedaba colgado delante de la hora fija y de un coste que prefería mover todo detrás. Arreglados.
- La comida antes del Museos de las 13:00 no cabía (suelo a las 12:00): ahora desde las 11:30.
- El Free Tour de las 21:00 dejaba la cena después del tour (a las 23:35): ahora va antes, y se mira el restaurante abierto a esa hora.
- La comida se acorta (45 o 30 min) cuando no deja llegar a una reserva.
