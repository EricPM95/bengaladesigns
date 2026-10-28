# Las reglas de la app

Eric, 27-oct: «poco a poco, todas las funciones y secuencias de la app tienen que ser iguales entre ellas». Este documento reúne, en palabras sencillas, las reglas que hemos ido decidiendo. **Cada pantalla nueva o que se toque sigue este documento, y si una regla cambia, se cambia aquí.** (Las reglas del motor de rutas están aparte, en `docs/REGLAS_RUTAS.md`.)

Cada regla lleva un ejemplo y su pieza de Design (`docs/diseno/proyecto/Piezas/…`) cuando la hay.

## 1. Elegir, confirmar y avisar

### Elegir qué hacer: las tarjetas
Un menú de opciones es una hoja desde abajo con tarjetas (icono, título, línea gris). Siempre el componente `HojaOpciones` (`src/components/ui/HojaOpciones.tsx`). Nada de menús desplegables sueltos.
- Ejemplo: los tres puntitos de una parada («Mover antes», «Mover a otro día», «Cambiar parada», «Quitar parada» en rojo y la última). Lo que no se puede hacer sale en gris, diciendo por qué («Tienes entrada para el Coliseo»).
- Design: `Hojas Opciones`.

### Confirmar: solo si se pierde algo
La confirmación es la hoja de dos botones («¿Seguro que…?»). **Solo cuando se pierde algo que no se puede recuperar o que importa:** una parada con entrada o reserva, eliminar un día entero, quitar a una persona del viaje, borrar un viaje o la cuenta. **Quitar una parada normal: sin pregunta y con [Deshacer].**
- La pregunta, con artículo y cercana: «¿Quitamos el Panteón de tu ruta?». Fuera las comillas. Una línea con lo que pasa. El botón que quita, **en rojo**.
- **Las confirmaciones llevan la ✕ arriba y no llevan [Cancelar].**
- Tarjetas = elegir entre varias opciones. Confirmación = una sola decisión. Cada una para lo suyo.
- Design: la confirmación de «Eliminar día».

### Elegir un día: una sola hoja
Siempre que haya que elegir un día (añadir algo a un día, pasar algo a otro día, cambiar un día por otro: el Free Tour, un sitio desde EXPLORAR o su ficha, «Mover a otro día», una excursión), **la hoja `HojaDia`** (`src/components/ui/HojaDia.tsx`): la fila elegida en azul noche con ✓ dorado, las filas bloqueadas con candado y el motivo, botón dorado.
- **Al añadir o mover una parada nunca se bloquea un día.** Solo bloquea lo que mueve días enteros: el interruptor de excursión y cambiar el orden de los días. Si el día cierra, la línea roja («El miércoles 11 cierran los Museos Capitolinos.»), sin bloquearlo.
- Design: `Hoja Dia`.

### Avisos
- **Un aviso por acción**, con una frase de una línea que dice lo que de verdad pasó («Eric ha añadido Da Enzo al jueves 12.», «Eric ha quitado el sábado 14.», «Eric ha cambiado el orden de los días.»). Nunca la lista de sitios que se han movido por ello.
- **Cada cambio nuevo es un aviso nuevo** (franja, sonido y punto en la campana), aunque el anterior no se haya leído. Si hay varios seguidos se juntan unos 2 minutos, con la frase de lo último.
- **Nadie recibe avisos de lo que ha hecho él mismo.**
- **Al unirse a un viaje solo salen los avisos de desde que te uniste;** al salir del viaje sus avisos desaparecen de tu campana (menos «Ya no formas parte del viaje…»).
- La **franja** (arriba) y la **campana** son las dos formas de verlos. Todos suenan igual, con el ajuste «Sonido de los momentos» encendido.
- El **aviso de abajo con [Deshacer]** ocupa exactamente el sitio del menú de abajo (mismo alto, ancho y color) y lo tapa entero mientras se ve (`AvisoSobreLaBarra`).
- Design: `Avisos`, `Avisos Franja`, `Avisos Gestion`.

### Lo que va por encima y lo que no salta
- **El lápiz y el botón de los logros van siempre por encima, en todas las pantallas;** solo se quedan debajo de una hoja que sale desde abajo o de una confirmación mientras están abiertas.
- **Nada salta al cargar.** Si se espera una respuesta (por ejemplo, saber si hay pase), el hueco ya está pintado en gris claro, del mismo tamaño, y luego se pinta. Los candados no se pintan hasta saberlo.
- **Un botón suelto sobre un mapa lleva el borde marrón** de la pastilla «Roma · 11 – 15 nov» de RUTA.

## 2. Colores, letra y huecos

- **Los tres colores de las entradas** (y de todo lo que se reserva: entradas, Free Tour, excursiones): **frambuesa** = te falta; **verde con ✓** = ya lo tienes; **azul oscuro con dorado** = otro del grupo lo tiene y te queda elegir lo tuyo.
- **El estilo de elegir** (`Elegir.tsx`): la opción elegida en oscuro, las demás en claro.
- **La letra de Design:** Geist, Instrument Serif y Geist Mono. Nada más.
- **Nombres de personas:** siempre la primera letra en mayúscula y el resto en minúscula («Viajes», «José Luis»), en todos los sitios (`nombreVisible`). El nombre se guarda tal como lo escribió la persona; solo se arregla al enseñarlo.
- **Espacio claro entre bloques distintos** (una pregunta con sus opciones y la siguiente, un título y su lista…). Nada pegado, también en las hojas de añadir.
- **Iconos finos:** trazo fino, gris, sin relleno; solo dentro de los botones principales (CTA) pueden ir rellenos.
- **Cabecera de la ficha de un sitio:** foto, nombre, etiquetas y corazón en un solo bloque (solo alineación, sin fondo ni borde). El nombre arriba, a la altura del borde de la foto; las etiquetas justo debajo, en columna si el nombre ocupa una línea y en fila si ocupa dos. «Abierto 24 h» (verde) solo con el dato `abierto_24h` revisado a mano.

## 3. El pase

- **La caja pequeña azul con dorado** («¿En qué zona te alojas? · Con el Pase Roma, adaptamos tu ruta a tu alojamiento.» con [Ver]) se usa cuando **explica algo en su sitio**. Su [Ver] va directo a la película del pase (o a su final si ya la vio). No lleva el aviso del pase.
- **El candado dorado en la esquina** se usa en lo demás que está bloqueado por el pase (por ejemplo, Baños, Fuentes y «Cerca de ti» en EXPLORAR). Al tocarlo sale el aviso del pase. En EXPLORAR lo del pase **no** va en azul.
- **El aviso del pase** (hoja desde abajo, tarjeta azul con dorado; `abrirAvisoPase`, textos en un solo archivo `src/lib/avisoPaseTextos.ts`, por destino): título «Desbloquéalo con el *Pase {destino}*»; una línea pequeña **solo si dice algo que el viajero ya ha usado** («Ya has escuchado tu historia de prueba.»); una frase en negrita que nombra el pase del destino y deja claro que con él es sin límite («Con el Pase Roma, guarda fotos sin límite…»); botón [Ver el Pase {destino}]. Si ya tiene el pase, nunca sale. Siempre verdad: nada que el pase no haga.
- **Dos cosas distintas, cada una para lo suyo:** el aviso pequeño sale al tocar **algo bloqueado**; la **película del pase** sale al tocar algo que es **para ver el pase** (la pastilla «Pase Roma» de RUTA, [Ver] del aviso…). Si ya la vio, directo al final, con [Repetir].
- **La pastilla «Pase Roma» de RUTA:** sin pase, fondo azul oscuro con candado dorado; con pase, dorado con ✓.
- Design: `Pase Estilo`, `Pase Pelicula Movil`.

## 4. Reservas, vuelos, gastos y cuentas

- **«¿Para quién es?» es igual en reservas, vuelos, alojamiento y gastos:** sale marcado solo quien lo añade y los demás se marcan uno a uno, con una línea pequeña debajo que cambia según lo marcado («Solo para ti: es un gasto tuyo y nadie más lo ve.», «Para 2 personas: entra en las cuentas del grupo.», «Para Ana: …»). La pregunta cambia según lo que se añade («¿Para quién has comprado la entrada?», «…el vuelo?», «¿Para quién has reservado el alojamiento?»).
- **Los textos, siempre desde quien mira:** «Lo ha puesto Eric · para Eric y para ti».
- **Un solo bloque de vuelo y uno de alojamiento** para todos, administrador o no. Se rellena todo (ida y vuelta, horas, aeropuertos, «¿Para quién es?») y un **solo botón «Guardar el vuelo»**; solo entonces se guarda y llega un solo aviso con ida y vuelta juntas. La rueda de la hora no lleva [Guardar].
- **Las tres formas de llevar las cuentas** (`modo_cuentas`, 10N7): **viajas solo** (presupuesto normal, sin nombres); **cuenta conjunta** (pareja o familia: un solo presupuesto, «Para los dos»/«Para todos» y «Solo para mí»); **cada uno lo suyo** (amigos: nombres y «Cuentas del grupo» con quién le debe a quién). Solo el administrador cambia la forma.
- **Lo «Solo para mí» (o «Solo tú») no lo ve nadie más, tampoco el administrador:** va en su bloque propio «Lo tuyo · Solo lo ves tú» después de «Extras» (en cuenta conjunta y en cada uno lo suyo), cuenta en «Tu parte» y no llega en los datos a nadie más. Lo que se oculta es el dinero, no el sitio: la parada sale en la ruta de todos.
- **La moneda:** una sola por viajero y en toda la app, euros por defecto, elegible en el presupuesto y en Ajustes (van sincronizadas). Se enseña convertida con «≈» y, en pequeño, el original; donde se paga de verdad (RESERVAS, entradas, excursiones) se ve siempre el original. Las cuentas del grupo van en euros con el cambio del día de cada gasto.
- Design: `Reservas Cada Uno`, `Cuentas Modo`.

## 5. Paradas

- **Se mueve solo la parada, nunca su franja** («Mañana», «Tarde», «Noche» son del día). Dónde queda: el Free Tour siempre de primero por la mañana; lo demás, sin pase de primero en el día, y con pase donde mejor encaja; al acabar, la app lleva al viajero a esa parada y la marca un momento.
- **El Free Tour es una parada más, sin mover días:** una sola vez en la ruta (si ya está, «✓ En ruta» y sin +), se mueve y se quita como cualquier parada, de verdad y al momento.
- **Un mismo sitio puede estar varias veces en la ruta** (cada parada con su propio id). «Cambiar parada» pone un ⇄ en todos los sitios, también en los que ya están (que siguen diciendo «✓ En ruta»).
- **Quitar una parada con entrada:** nunca se pierde la entrada sin que el viajero lo elija. [Quitar parada] la deja en RESERVAS («Ya no está en tu ruta») y [Quitar también la entrada] va en rojo.
- **Una parada con entrada se puede mover antes/después dentro de su día,** sin ningún aviso de horas (el viajero no ve las horas de la ruta). «Mover a otro día» y «Cambiar parada» siguen en gris.
- Si quien solo recomienda mueve muchas paradas de golpe, es **un solo cambio** en su propuesta, con su frase.

## 6. Pantallas que todavía no cumplen del todo (a 28-oct)

Esta lista es la que quedó al terminar la tanda 10N8 y se ha de ir vaciando:
- **Confirmaciones sin ✕:** `PagoHost` mientras espera el pago no lleva ✕; no se ha hecho la lista completa de confirmaciones tras quitar [Cancelar].
- **Avisos de abajo sin `AvisoSobreLaBarra`:** `FranjaSinConexion` y el aviso dentro de logros (`HojasDeLogros`).
- **Hojas de elegir día que no usan `HojaDia`:** el desplegable «Elige el día» de `AddReservationSheet` (elige día y hora dentro del formulario de la entrada) y el paso «del punto» de `DayPositionPicker`.
- **Vuelo del administrador:** no tiene todavía el botón único «Guardar el vuelo» con aviso conjunto de ida y vuelta (solo se le ha quitado el [Guardar] de la rueda).
- **Alojamiento:** sin los chips de zona de Design.
- **Moneda por precio:** faltan por enlazar las etiquetas de precio del explorador de lugares.
- **Lugares que esperan saber si hay pase** (aparte de la pastilla de RUTA): no repasados uno a uno.
- **Película del pase, ficha de un sitio y aviso de abajo:** hechos en código; falta comprobarlos en el móvil, junto a Design y en Safari (con y sin la barra).
