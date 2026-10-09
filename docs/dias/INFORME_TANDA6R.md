# Informe de la Tanda 6r

Hechos los cuatro puntos. Lo que he decidido yo (y dónde el documento nuevo y tu mensaje se contradicen) está en `PREGUNTAS_TANDA6R.md`.

## 1. Lo que pasó con Via del Babuino

Lo he reproducido a la primera: un viaje de 3 días con Free Tour y el Free Tour reservado a las 12:00 el día en que el documento solo lo escribe a las 10:00.

**Qué parte de la app lo metió:** el motor de días, justo en el momento de poner una hora fija en su sitio. Con el Free Tour a las 12:00, antes quedaba más de una hora libre (desayuno y Panteón acaban hacia las 9:45). Entonces el motor, para no dejar un hueco, buscaba un sitio cercano al punto de salida del Free Tour (la Plaza de España) que no estuviera ya en el viaje y estuviera abierto, y eligió Via del Babuino (a menos de 450 m, 10 minutos, una calle al aire libre). Así que fue **«para rellenar el hueco hasta las 12:00»**, y de paso por estar cerca de la salida del Free Tour. Es el último punto de la regla 4 del documento anterior («si aún sobra, sitios cercanos… que no salgan en el viaje»).

No era solo el Free Tour. Con el Coliseo reservado a las 12:30 o a las 15:00 en el primer día corto, la misma pieza metía los **Mercados de Trajano**. Y como la prueba de siempre dejaba pasar cualquier sitio de nivel 1 o 2 «que llena huecos», nadie lo vio.

**El recuadro vacío de la foto:** Via del Babuino está marcado «Sin foto», y la tarjeta pintaba igualmente el recuadro de color de la foto. La 6f solo había quitado el nombre de dentro del recuadro. Ahora, sin foto, la tarjeta no pinta el recuadro.

## 2. La regla, para todos los destinos

Quitado el relleno: la app **no mete nunca una parada por su cuenta** para llenar un hueco. Si sobra tiempo antes de una hora fija, se espera o sale «Si te sobra tiempo». Lo único que se mueve es lo que el documento ya escribe ese día. Las calles de paso y lo «de camino» solo van en su tarjeta «De camino a…». A `INVARIANTES_MOTOR.md` (477, 478) y `INVARIANTES_PANTALLA.md` (479, 480).

## 3. El nombre del Free Tour

«Free Tour por Roma» en toda la app (datos, entrada de la ficha, convertidor, scripts) y también en los viajes que ya tenías guardados. Mismo sitio para el convertidor (mismo id y misma foto). Los demás «centro» que lee el viajero, sin cambiar, en `PREGUNTAS_TANDA6R.md`.

## 4. La prueba 6r

`pruebaTanda6r.mjs` recorre los viajes de 2 a 6 días, con y sin fechas, con y sin Free Tour, con el Coliseo, los Museos y la Galería a tres horas cada uno y el Free Tour a las 10:00, 12:00, 15:00, 17:00 y 21:00, **cada reserva en cada día del viaje**. Da fallo si sale una parada que el documento no escribe ese día, si sale como parada algo que el documento solo pone «de camino», si la tarjeta pinta el recuadro de la foto vacío o si sale «Free Tour Centro Histórico» en cualquier archivo de la app. Comprobado que, con el motor de antes del arreglo, da fallo (Via del Babuino y Mercados de Trajano).

## Capturas del viaje del punto 1 (375 px)

- **Antes** (Panteón → Via del Babuino → Free Tour 12:00): `img/6r_babuino_antes.jpg`
- **Después** (Panteón → Free Tour por Roma 12:00, sin la calle): `img/6r_babuino_despues.jpg`

## Las pruebas

- 6g, 6h, 6i, 6j, 6k (4.483 viajes), 6l, `pruebaTanda6o`, **`pruebaTanda6r` (5.083 viajes, 22.338 días)** y `pruebaListas` (una de cada 5 fechas, de 1 a 6 días, 4 grupos): **0 fallos**. Typecheck limpio.
- **A mano a 375 px:** viaje de 5 días con fechas y Free Tour reservado a las 12:00: sale Panteón → Free Tour por Roma (verde, 12:00), sin Via del Babuino y con el nombre nuevo también en el texto de la comida.
