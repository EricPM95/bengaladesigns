# Informe de la Tanda 6o

Hechos los cinco puntos. Lo que he decidido yo (y los enlaces que no son de Civitatis) está en `PREGUNTAS_TANDA6O.md`.

## Lo que cambia

- **«Entradas» en todas las fichas.** Antes solo la tenían las fichas que se abrían desde un día. Ahora la ficha de todo sitio con entradas la lleva, se abra desde donde se abra (un día, EXPLORAR o «+ Añadir parada»), con su lista y sus [Reservar]. «¿Ya la tienes? Añádela» solo sale si ese sitio ya está en algún día del viaje.
- **El Free Tour, como una entrada más.** Está en `_entradas.json` con su enlace. Su tarjeta lleva la pestañita: naranja, abre su ficha en «Entradas» con [Reservar Free Tour]; verde con ✓ y la hora cuando está añadido, abre «Cambiar» (con sus cinco horas).
- **El Foro, sin hora fija.** Ya no sale la hora encima de su nombre; solo el ✓ verde de su pestañita.
- **El código de afiliado, siempre.** Cualquier enlace de Civitatis (entradas, excursiones, Free Tour, búsquedas) sale con `aid=5206`, lo lleve o no, y si traía otro se cambia. Es una sola regla para todos los destinos, en un solo archivo. Los enlaces que no son de Civitatis no se tocan (lista en PREGUNTAS).

## Un fallo que salió al probar

Al guardar una reserva desde una ficha, el día se rehacía y la ficha abierta saltaba a otra parada. Arreglado: la ficha se queda con su parada.

## Las pruebas

- 6g, 6h, 6i, 6j, 6k (4.483 viajes), 6l, `pruebaTanda6o` (29 enlaces de Civitatis, todos con `aid=5206`) y `pruebaListas` (una de cada 5 fechas, de 1 a 6 días, 4 grupos): **0 fallos**. El motor no ha cambiado.
- **A mano a 375 px** (viaje sin fechas, en enero): «Entradas» desde EXPLORAR y «+ Añadir parada»; «Añádela» solo con el sitio en el viaje; el Free Tour naranja y verde; el Foro sin hora; la rueda de la Galería y la de los Museos. Sin ver: las fichas de EXPLORAR y «+ Añadir parada» en ordenador.
