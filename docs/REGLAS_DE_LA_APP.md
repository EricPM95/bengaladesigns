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
- **El candado del pase, siempre igual (10N11, Eric 29-oct):** cuando algo es del pase y el viajero aún no lo tiene, el candado es **dorado sobre un círculo azul oscuro** con un filo dorado (`CandadoRedondo` en `src/components/pase/Candado.tsx`: círculo `#1C2230`, filo 1,5 px `#B58A2E`, candado `#F3D88F`; 22 px en las líneas pequeñas, 34 px en la esquina de un bloque, y 20/26/30/54 px donde Design los pone). También en las líneas pequeñas del pase (`LineaDelPase`: la frase en gris con su candado). Nunca el candado suelto en marrón ni sobre marfil. Quedan con el candado suelto, a propósito: dentro de un botón o pastilla que ya es azul oscuro o dorada (la pastilla «Pase Roma» de RUTA, el botón de la tarjeta del día de vuelta y el [Ver] de la caja azul).
- **Con el pase, sin frases del pase (10N11):** las líneas que explican lo que hace el pase («Con el Pase Roma, adaptamos…») solo salen a quien **no** lo tiene: `LineaDelPase` y `Candado` se pintan solo con `usePasePintable() === 'sin'` (mientras no se sabe, no se pintan ni cerradas ni abiertas). Con el pase, fuera. Lo que sí sale con pase son los datos y las acciones (la zona, [Cómo llegar…], «Pon la hora de tu vuelo…»), no la explicación del pase.
- **El candado dorado en la esquina** se usa en lo demás que está bloqueado por el pase (por ejemplo, Baños, Fuentes y «Cerca de ti» en EXPLORAR). Al tocarlo sale el aviso del pase. En EXPLORAR lo del pase **no** va en azul.
- **El aviso del pase** (hoja desde abajo, tarjeta azul con dorado; `abrirAvisoPase`, textos en un solo archivo `src/lib/avisoPaseTextos.ts`, por destino): título «Desbloquéalo con el *Pase {destino}*»; una línea pequeña **solo si dice algo que el viajero ya ha usado** («Ya has escuchado tu historia de prueba.»); una frase en negrita que nombra el pase del destino y deja claro que con él es sin límite («Con el Pase Roma, guarda fotos sin límite…»); botón [Ver el Pase {destino}]. Si ya tiene el pase, nunca sale. Siempre verdad: nada que el pase no haga.
- **Dos cosas distintas, cada una para lo suyo:** el aviso pequeño sale al tocar **algo bloqueado**; la **película del pase** sale al tocar algo que es **para ver el pase** (la pastilla «Pase Roma» de RUTA, [Ver] del aviso…). Si ya la vio, directo al final, con [Repetir].
- **La pastilla «Pase Roma» de RUTA:** sin pase, fondo azul oscuro con candado dorado; con pase, dorado con ✓.
- Design: `Pase Estilo`, `Pase Pelicula Movil`.

- **Siempre «Pase Roma» (10N12):** nunca «Pase de Roma». Con otro destino, «Pase {Destino}» («Pase París»), sin «de»: en los avisos, los logros, las hojas, los textos de `data/pase/` y las pruebas («✓ Tu Pase Roma está activo»).
- **La lista del pase no lleva precios (10N12):** [Elegir mi pase] va fijo abajo, siempre a la vista y sin precio, sin tapar el último punto ni la barra del iPhone; los precios salen solo en «¿Cuántos sois?», que se abre al tocarlo. Con el pase, sin botón fijo.
- **HOY sin pase (10N12):** la pantalla de Design (`Pase Lista` 2 y 2b) con, arriba, «Pon tus fechas» (sin fechas), la cuenta atrás (antes del viaje), «Tu viaje ha terminado» (después) y los avisos del día de prueba cuando tocan. Sin ✕: es una pestaña.
- **El botón de la cama en HOY (10N12):** un botón redondo pequeño, siempre a la vista en HOY con pase (todos los días, a cualquier hora): con dirección abre el camino al alojamiento; con pase y sin dirección abre la hoja «Tu alojamiento»; sin pase no sale.

## 4. Reservas, vuelos, gastos y cuentas

- **«¿Para quién es?» es igual en reservas, vuelos, alojamiento y gastos:** sale marcado solo quien lo añade y los demás se marcan uno a uno, con una línea pequeña debajo que cambia según lo marcado («Solo para ti: es un gasto tuyo y nadie más lo ve.», «Para 2 personas: entra en las cuentas del grupo.», «Para Ana: …»). La pregunta cambia según lo que se añade («¿Para quién has comprado la entrada?», «…el vuelo?», «¿Para quién has reservado el alojamiento?»).
- **Los textos, siempre desde quien mira:** «Lo ha puesto Eric · para Eric y para ti».
- **Un solo bloque de vuelo y uno de alojamiento** para todos, administrador o no. Se rellena todo (ida y vuelta, horas, aeropuertos, «¿Para quién es?») y un **solo botón «Guardar el vuelo»**; solo entonces se guarda y llega un solo aviso con ida y vuelta juntas. La rueda de la hora no lleva [Guardar].
- **Las tres formas de llevar las cuentas** (`modo_cuentas`, 10N7): **viajas solo** (presupuesto normal, sin nombres); **cuenta conjunta** (pareja o familia: un solo presupuesto, «Para los dos»/«Para todos» y «Solo para mí»); **cada uno lo suyo** (amigos: nombres y «Cuentas del grupo» con quién le debe a quién). Solo el administrador cambia la forma.
- **Lo «Solo para mí» (o «Solo tú») no lo ve nadie más, tampoco el administrador:** va en su bloque propio «Lo tuyo · Solo lo ves tú» después de «Extras» (en cuenta conjunta y en cada uno lo suyo), cuenta en «Tu parte» y no llega en los datos a nadie más. Lo que se oculta es el dinero, no el sitio: la parada sale en la ruta de todos.
- **La moneda:** una sola por viajero y en toda la app, euros por defecto, elegible en el presupuesto y en Ajustes (van sincronizadas). Se enseña convertida con «≈» y, en pequeño, el original; donde se paga de verdad (RESERVAS, entradas, excursiones) se ve siempre el original. Las cuentas del grupo van en euros con el cambio del día de cada gasto.
- **Personas (10N10, Eric 29-oct): para elegir, cuadrados; para enseñar, redondo.** Siempre que hay que marcar a alguien («¿Para quién es…?», «¿Quién lo ha pagado?», «Solo para algunos»): cuadrados como en `Piezas/Vuelo Reservas` 05, con inicial y nombre, azul oscuro con ✓ dorado si está marcado y blanco si no. Cuando solo se enseña quién es (la tarjeta «¿Quién debe a quién?», «En este vuelo · Tú y Viajes», «Lo ha puesto Eric · para Eric y para ti», los avisos), redondo.
- **Las preguntas de las hojas, con la letra en tinta azul de Design** (la de «¿A qué aeropuerto llegas?»), en todas las hojas.
- **Los títulos de RESERVAS y del presupuesto, solos:** «Reservas» y «Presupuesto», sin línea de destino ni fechas debajo (ya se ven en el mapa).
- **Las cuentas (10N10) las decide la app sola, sin botón:** una persona = sin interruptor («Total del viaje»); dos personas o una familia = «Mi cuenta | Cuenta conjunta»; tres o más que no son familia = «Mi cuenta | Cuenta del grupo». «Mi cuenta» siempre a la izquierda. «¿Quién debe a quién?» solo en las pestañas comunes. Cada pestaña enseña solo lo suyo.
- **Mi cuenta y la cuenta común (10N10, detalle):** «Mi cuenta» = Ruta con tus reservas solo para ti + Extras tuyos + la línea amarilla «Tu parte de la cuenta conjunta: 130 €» (o «de la cuenta del grupo»), que se toca y abre el detalle de tu parte (cada gasto común con lo que te toca; desde ahí se toca para corregirlo). El importe de arriba en «Mi cuenta» = lo tuyo + tu parte de lo común. En la cuenta conjunta / del grupo: solo lo que es para varios, la tarjeta «¿Quién debe a quién?» (solo cuando hay gastos comunes) y el importe de arriba = todo lo común. La leyenda de la barra lleva siempre importes («Ruta · 40 € · Extras · 25 € · Tu parte · 130 €»). Fuera: «Lo tuyo · Solo lo ves tú», «por persona», la pastilla «Tu parte», «¿Cómo lleváis las cuentas?» y el aviso de que cambian. De 1 a 2 personas pasa a conjunta; de 2 a 3 (no familia) pasa a la del grupo y lo apuntado sin «entre quién» se queda entre los dos de antes (route.cuentaConjuntaCon); si alguien sale, lo apuntado no cambia. La base de datos lo sabe por route.cuentasPersonas (migración 0067). «Solo para mí» = Mi cuenta (paraQuien = [yo]).
- **Orden de las hojas para apuntar dinero (10N10):** 1) qué es; 2) para quién (cuadrados); 3) «¿Cuánto ha costado en total?» con su moneda; 4) «¿Quién lo ha pagado?» (solo si es para más de uno y hay precio); 5) línea pequeña de a dónde va el dinero; 6) botón («Añadir gasto», «Guardar la entrada», «Guardar el vuelo», «Guardar el alojamiento»). Viajando solo: solo el precio.
- **Comprar una entrada a la misma hora (10N10):** el proveedor no deja llevar día ni hora en el enlace: botón [Ir a comprar] con la línea «Eric la tiene el jueves 12 a las 14:00. Recuerda elegir esa hora al reservar.»; al volver, «¿Has comprado la entrada del Coliseo?» [Guardar] / [Todavía no].
- **Reservar una entrada con hora no mueve la parada de sitio** (10N10): el viajero la coloca a su gusto.
- **Los botones flotantes (logros, lápiz) van siempre por encima, también con el mapa de EXPLORAR abierto con un filtro.**
- Design: `Reservas Cada Uno`, `Cuentas Modo`, `Presupuesto Compartido`, `Vuelo Reservas`, `Entrada Nueva`, `Cuentas Grupo`.

## 5. Paradas

- **Se mueve solo la parada, nunca su franja** («Mañana», «Tarde», «Noche» son del día). Dónde queda: el Free Tour siempre de primero por la mañana; lo demás, sin pase de primero en el día, y con pase donde mejor encaja; al acabar, la app lleva al viajero a esa parada y la marca un momento.
- **El Free Tour es una parada más, sin mover días:** una sola vez en la ruta (si ya está, «✓ En ruta» y sin +), se mueve y se quita como cualquier parada, de verdad y al momento.
- **Reservar el Free Tour (o cambiarle la hora) es como reservar una entrada (10S3, Eric 30-oct):** la parada se queda donde está con su hora nueva; ningún día se mueve, no sale el mensaje de «vamos a mover el día…» y la franja no cambia. El plan de reservas del servidor (`reservationPlan.js`) no calcula nada para el Free Tour, y ni la hoja lo pide para una entrada cuyo sitio ya está en el día de la fecha elegida. La hora del Free Tour se elige con la misma rueda que las entradas (de 08:00 a 22:00, de 15 en 15), no con seis horas fijas: la web del tour no publica sus horas, el viajero pone la que ha reservado.
- **La reserva que no cuadra con su franja (10S3):** sin pase, si la hora de la reserva cae en otra franja que la de su parada (Mañana hasta las 14:00, Tarde hasta las 20:00, Noche después), bajo la parada sale `LineaDelPase` «Con el Pase Roma, tus reservas se colocan solas a su hora.» (aviso pequeño `reservas`). Con pase, de momento, nada.
- **Elegir un día, en cuadrados (10S3, Eric 30-oct):** todo lo que se elige va en cuadrados, también los días: «Jue 26 · En tu ruta», «Vie 27»…, con el mismo estilo que las personas (`PersonasCuadradas`): blanco, y el elegido azul oscuro con ✓ dorado. Nada de pastillas redondas para elegir. Hoy lo hace la hoja de reservas (entradas, Free Tour y excursiones: `AddReservationSheet`); las hojas de filas de `HojaDia` ya eran filas, no pastillas.
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
- **Varios destinos (10N12):** hoy la zona y la dirección del alojamiento son del viaje entero y solo salen en la primera estancia; cuando se hagan los multidestinos, cada estancia tendrá su zona y su dirección.
- **Catacumbas de San Calixto (decisión de Eric, 30-oct):** evitarlas cuando el viaje, o su mes si no hay fechas, cae en el cierre (13-ene a 10-feb); se hace en la próxima tanda del motor (ver `docs/dias/PENDIENTES_MOTOR.md`).
- **Casos del motor apartados en las pruebas (10S, 30-oct):** Catacumbas de San Calixto cerradas en viajes sin fechas, el Viaje 11 · día 1 que no cabe por 105 min y el orden de la lista del D1 al llegar a las 16:30. Se imprimen como «PENDIENTE DEL MOTOR» y se miran en la próxima tanda del motor; el detalle y la evidencia, en docs/dias/PENDIENTES_MOTOR.md.
- **Película del pase, ficha de un sitio y aviso de abajo:** hechos en código; falta comprobarlos en el móvil, junto a Design y en Safari (con y sin la barra).

## 7. El alojamiento (10N11, agente A)
- **Gratis:** nombre del hotel, «¿Para quién es el alojamiento?», «¿Cuánto ha costado en total?» y «¿Quién lo ha pagado?» (con todas las personas marcadas de partida). **Con pase, además:** la zona y la dirección (`route.accommodationAddress`), que activan [Cómo llegar a tu alojamiento].
- **La hoja «Tu alojamiento», en este orden:** nombre + [Buscar alojamiento]; zona y dirección; «¿Para quién…?», precio, «¿Quién lo ha pagado?», la línea de a dónde va el dinero y [Guardar el alojamiento]. Sin pase: bloque pequeño gris con `CandadoRedondo` («¿Dónde te alojas?» / «Dirección del hotel», abre el pase) y `LineaDelPase`. Con pase la primera vez: lista de zonas; con zona elegida: desplegable cerrado «TU ZONA · Prati ✓» que al tocarlo abre las demás; debajo, Dirección y [Cómo llegar].
- **Sin caja del pase** «Tu primer día, cerca de donde duermes» ni «¿En qué zona te alojas?» en la hoja ni en la tarjeta de RESERVAS: en su lugar, `LineaDelPase`. Sin pase no se guarda zona ni dirección.
- **Hoja del vuelo (administrador):** sin pase, `LineaDelPase` «adaptamos tu primer y tu último día a tus vuelos» bajo la hora; con pase, nada.

## 8. Reglas de la 10S4 (agente F, Eric, 30-oct)
- **El precio del transporte suma siempre:** el precio del vuelo, del tren, del autobús y del barco entra en el presupuesto con pase y sin él (poner el vuelo es gratis; lo del pase es adaptar los días). Nada del presupuesto depende del pase.
- **Leyenda del presupuesto:** debajo del total, «Transporte», «Alojamiento», «Ruta» y «Extras» (si hay) van separados, cada uno con su color en la barra; si no caben en una línea, pasan a dos. El bloque de abajo sigue junto: «Transporte y alojamiento».
- **«Reorganizar este día» es del pase:** sin pase no sale el botón; con pase, como siempre.
- **Todos los buscadores, igual:** ningún buscador de la app falla por un acento, una mayúscula, una palabra a medias o una letra equivocada, y todos encuentran también el nombre en el idioma del destino («Cupola», «Musei Capitolini»). Todos usan una sola forma de buscar: `src/lib/busqueda.ts`; no se escribe un `includes` a mano para buscar lo que escribe el viajero.

## 9. Reglas de la 10S4 (agente H, Eric, 30-oct)
- **«Entradas y Free Tour» enseña solo «En tu ruta»:** la entrada de cada parada de la ruta que la necesita (cualquier sitio con entrada del destino, no solo una lista fija: Museos Capitolinos, Cúpula…) más el Free Tour si va. Se actualiza solo al añadir o quitar paradas; con un sitio varias veces en la ruta, una entrada por parada. Quitada la parada, la entrada se va, salvo que ya esté guardada: entonces se queda con «Ya no está en tu ruta». Fuera «Ver n más».
- **[Añadir otra reserva]** va en lugar de «Ver n más»: una casilla libre con sugerencias de sitios nuestros con entrada (foto pequeña y nombre). Si elige una sugerencia: la hoja de siempre y el sitio entra TAMBIÉN en la ruta, en el día elegido, como PRIMERA parada de ese día con su hora, sin quitar nada, sin mover ningún día (el día de la reserva no cambia nunca) y la app lleva a la parada y la marca; si la hora no cuadra con su franja sale la línea gris del pase. Con pase, de momento, igual. Si se queda lo escrito, solo vive en RESERVAS (refId `otra:…`, `noMueve`, sin avisos ni motor).
