# Reservas: entradas, excursión, añadir una reserva y lo reservado, fijado

Va **después** de PARA_CODE_EXCURSIONES. Commit por parte y sin push. Comprueba cada parte a 390 px (móvil), con capturas.

Vale para **todos los destinos**: lo que es de Roma sale de los datos de Roma, nunca del código. A INVARIANTES lo que lleve esa marca.

**Regla de textos (ya en INVARIANTES desde el prompt de excursiones):** lo que lee el viajero nunca nombra a las empresas con las que trabajamos. Palabras directas: «tu reserva», «Reservar», «Cancela primero tu reserva».

## 1. La pantalla de Reservas, en este orden

Hoy tiene: el aviso de arriba, «Vuelos» con las horas de llegada y salida, «IMPRESCINDIBLES» (el seguro) y «PARA TU VIAJE A {DESTINO}» (la ida, la vuelta y el alojamiento, y lo que haya). Eso se queda igual. Se añaden dos secciones debajo, con el mismo formato de filas (icono, nombre, línea pequeña, «Añadir» y «Reservar»):

1. **«ENTRADAS»**
   - Las **tres entradas imprescindibles** de cada destino, elegidas por nosotros al curarlo. Es un dato del destino (por ejemplo `entradas_reservas`). En Roma:
     - Coliseo, Foro y Palatino;
     - Museos Vaticanos y Capilla Sixtina;
     - Panteón.
   - Cada fila lleva, en la línea pequeña, el día en que está en la ruta: «Día 2 · jue 15 oct».
   - Debajo, una línea: «Ver {n} entradas más de tu ruta ›». Al tocarla, se despliegan las demás paradas de la ruta que llevan entrada (en Roma, por ejemplo, la Galería Borghese, el Castillo, la Cúpula), con el mismo formato. Si no hay más, la línea no sale.
2. **«EXCURSIÓN»**: **una sola fila**, nunca la lista entera.
   - **Si el viaje tiene un día de excursión:** esa excursión, con su día («Pompeya y Sorrento · Día 3 · vie 16 oct»), «Añadir» y «Reservar».
   - **Si no tiene ninguno:** una fila «Excursiones desde {destino}», con la línea «{n} excursiones · {%} de valoración media» y el botón «Ver excursiones», que abre la página de excursiones (la misma del botón del autobús). Si no hay valoración real todavía, la línea dice solo «{n} excursiones».
   - Si el destino no tiene excursiones, o el viaje tiene menos días de los que marca `excursiones_desde_dias`, la sección no sale.
- **Lo reservado** sale en verde, con un check y la línea «Reservada ✓ · Día {n} · {fecha} · {hora}», sin «Añadir» ni «Reservar».

## 2. Reservas sigue siempre a la ruta

Reservas no es una lista aparte: se calcula a partir de los días del viaje, en todo momento.
- **Si se mueven los días**, la línea de cada fila cambia sola. Por ejemplo, si el Día 2 pasa a ser el Día 1, la fila dice «Día 1 · …». Igual que la llegada y la vuelta, que ya se heredan.
- **Si se quita una parada con entrada** (el Coliseo, los Museos, la Galería…), su fila desaparece de Reservas.
- **Si se añade**, aparece: entre las tres si es una de ellas, o en «Ver más» si no.
- Lo mismo con la excursión: si se añade, se cambia o se quita un día de excursión, la fila de excursión cambia.
- **Lo reservado no se mueve** (punto 6): una entrada o excursión reservada se queda en su fecha y su hora aunque se muevan los demás días.
- **A INVARIANTES:** «Reservas se calcula siempre desde la ruta: nunca puede decir un día, una parada o una excursión distintos de los que hay en la pestaña Días».

## 3. El % de arriba

Cada cosa añadida en Reservas sube el % de la cabecera, hasta el 100 %.
- **Cuentan** las filas que se ven sin desplegar nada:
  - los vuelos o el transporte de ida y vuelta;
  - el alojamiento;
  - el seguro;
  - las entradas imprescindibles que están en la ruta;
  - la excursión, solo si el viaje tiene un día de excursión.
- **No cuentan** las entradas de «Ver más» ni la fila «Excursiones desde {destino}» sin excursión. Así, un viaje sin excursión puede llegar al 100 %.
- Como Reservas sigue a la ruta, el total cambia solo: si se quita el Panteón de la ruta, deja de contar, y el % se recalcula.
- Dime cómo se calcula hoy el % y qué cambia.

## 4. Añadir una reserva: una sola ventana

Una ventana que sube desde abajo, con su tirador y su cruz, igual para todo (vuelos, tren, alojamiento, entradas, excursiones). Se abre desde dos sitios:
- **«Añadir»** en cualquier fila de Reservas;
- **«¿Ya la has reservado? Añade tu confirmación»**, un botón en la tarjeta de la excursión y en la de las paradas con entrada, en la pestaña Días, mientras no estén reservadas.

Dentro:
- en letra pequeña, el nombre de lo que se reserva; el título: «Añade tu reserva»;
- tres pestañas: **«Pegar email»**, **«Captura o PDF»** y **«A mano»**;
- **pegar o subir:** se lee con lo mismo que ya lee los vuelos en Reservas. Debajo sale «LO HEMOS LEÍDO ASÍ» con lo que ha sacado:
  - el día, con su día del viaje: «Viernes 16 oct → tu Día 3»;
  - la hora (de recogida, de entrada o del vuelo);
  - el punto de encuentro, si lo hay;
  - el número de reserva;
- **a mano**, según lo que sea:
  - excursión: día (obligatorio), hora de recogida (obligatoria), y opcionales la hora de vuelta, el punto de encuentro y el n.º de reserva;
  - entrada: día y hora de entrada (obligatorios) y n.º de reserva;
  - vuelos, tren y alojamiento: los campos que ya tenga hoy Reservas;
- el botón: «Guardar y ponerla en el Día {n}».

**El día lo pone la fecha de la reserva**, nunca la app: busca qué día del viaje cae en esa fecha.
- Si cae en otro día distinto del que tenía en la ruta, la mueve a ese día y lo dice en la ventana: «Tu reserva es del viernes 16: la pasamos a tu Día 3».
- Si la fecha está fuera del viaje: «Tu reserva es del {fecha}, fuera de las fechas de tu viaje. Revisa la fecha», y no se guarda hasta que cuadre.
- Si el viaje no tiene fechas, la ventana pide elegir el día.

Lo que se lee del email se queda solo en ese viaje, para el viajero. No se manda a ningún sitio más.

## 5. Saber solo que alguien ha reservado

El usuario ha comprobado que en su panel de afiliado puede poner la campaña que quiera en cada enlace. Así que:
- **Cada viaje lleva su código de campaña**, al azar (por ejemplo `v-8F3K2`), y todos los enlaces de «Reservar» de ese viaje lo llevan en el campo de campaña.
  - Nunca el nombre, el email ni nada del viajero en el código.
  - Comprueba con la documentación del afiliado cómo se pasa la campaña en el enlace, y dímelo.
- **Cuando llega una venta** con ese código, con producto, fecha, hora, personas y número de reserva, la app la une a su viaje. En la próxima visita, el viajero ve arriba, en la pestaña Días, una tarjeta:
  > Hemos visto que has reservado {excursión o entrada} el {día} a las {hora}. ¿La ponemos en tu Día {n}?

  Con los botones «Sí, ponla» y «Ahora no». Al decir que sí, pasa a reservada (punto 6).
- **De dónde llegan las ventas:** déjalo preparado para leerlas de la API o del informe de ventas del afiliado cuando tengamos acceso. **No leas los correos del usuario.** Hasta entonces, la parte de unir la venta al viaje queda hecha y probada con una venta de ejemplo.
- Si la venta se cancela y nos llega la cancelación, la tarjeta del viaje avisa: «Tu reserva de {x} se ha cancelado», con el botón «Quitar del viaje».

## 6. Una vez reservada, queda fijada

La tarjeta de la excursión o la parada con entrada, en la pestaña Días:
- **Arriba, dos marcas:** «Reservada ✓» en verde y un candado con «Fijada».
- **Los datos:** la hora (de recogida o de entrada), el punto de encuentro si lo hay y el número de reserva.
- **Desaparecen** el botón «Reservar» y el de «¿Ya la has reservado?».

**Qué no se puede hacer:**
- ese día no se mueve, ni se sustituye por otra excursión, ni se cambia la hora de lo reservado;
- la varita de ese día no quita lo reservado: al recuperar el día, lo reservado se queda;
- «¿Dónde la ponemos?» no ofrece ese día.

**Para cambiarla,** el viajero la quita y la vuelve a crear. Al tocar «Quitar del viaje»:
- ventana con el título «¿Quitar {nombre} de tu viaje?»;
- un aviso amarillo: «Quitarla de tu viaje no cancela tu reserva. **Cancela primero tu reserva** y después quítala aquí.»;
- los botones «Cancelar» y «Quitar del viaje».

**Entradas reservadas:**
- la parada se coloca a la hora de la entrada;
- en su pestaña Entradas sale «Ya tienes entrada · {hora}» en lugar de los enlaces para comprar.

**A INVARIANTES:** «Lo reservado tiene fecha y hora fijas: nada del motor ni del viajero lo mueve. Para cambiarlo, se quita y se vuelve a crear».

**Informe corto:** capturas a 390 px de:
- Reservas sin excursión y con excursión, con una entrada reservada y «Ver más» desplegado;
- lo que pasa al mover un día y al quitar el Panteón (las filas y el %);
- la ventana de añadir reserva en sus tres pestañas, y con una fecha fuera del viaje;
- la tarjeta de «¿La ponemos?» con una venta de ejemplo;
- una tarjeta reservada y fijada, y la ventana de quitarla.
