Hola. TANDA 10N8: EL REPASO DE ERIC DE LA 10N5 Y LA 10N6 CON DOS TELÉFONOS (27 y 28-oct): perfil y Ajustes, unirse y avisos, el Free Tour como una parada más, los avisos que no llegan, la película del pase, EXPLORAR, RESERVAS (los vuelos de cada uno), las entradas, quitar y cambiar paradas, la ficha de un sitio y lo que quedó de la 10N7. Va después de la 10N7 (ya hecha): si estás con otra tanda, acábala primero (con su push) y haz esta después. No hace falta la muestra de 60 fechas, salvo que toques el motor de rutas (entonces, dímelo antes).

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N8.md e inclúyelo en tu commit.
- **Las reglas de siempre:** lo de Design, exactamente igual; los menús de opciones con el formato de tarjetas de la 10N4; la confirmación solo donde se pierde algo (10N6); los nombres con la primera letra en mayúscula; espacio entre bloques distintos (10N5).
- **Design:** el zip completo más nuevo, `RETOQUES.zip`, en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`). Lo de esta tanda: `Piezas/Hoja Dia` (apartado 3i), `Pase Pelicula Movil` (apartado 5, junto con los cambios de `Piezas/Pase Pelicula`, `Piezas/Pase Escena 4b` y `Piezas/Pase Globo`) y los cambios de `Piezas/Reservas Cada Uno` (apartado 7). Hazlas **exactamente igual**, con lo que digo en cada apartado.
- **Las reglas de la app, en un solo sitio (Eric, 27-oct: «poco a poco, todas las funciones y secuencias de la app tienen que ser iguales entre ellas»).** Escribe `docs/REGLAS_DE_LA_APP.md`, en palabras sencillas, con todas las reglas que hemos ido decidiendo, cada una con un ejemplo y su pieza de Design:
  - elegir qué hacer: las tarjetas (`Hojas Opciones`, 10N4); confirmar: la hoja de dos botones, solo si se pierde algo, con el botón rojo (10N6);
  - elegir un día: `Hoja Dia` (esta tanda);
  - los tres colores de las entradas (10N4); el estilo de elegir; lo del pase: la caja pequeña azul con dorado cuando explica algo, y el candado dorado en la esquina en lo demás; el aviso del pase y la película (10N6);
  - los avisos: la franja y la campana (10N4), las frases (10N4, 10N5), un aviso por acción;
  - «¿Para quién es?» igual en reservas, vuelos, alojamiento y gastos; las tres formas de llevar las cuentas (10N7);
  - los nombres con mayúscula, el espacio entre bloques, la letra de Design, los botones flotantes siempre visibles, nada que salte al cargar.
  Desde esta tanda, **cada pantalla nueva o que toques sigue ese documento**, y si una regla cambia, lo cambias ahí. En el informe, dime qué pantallas de la app no las cumplen todavía.
- **Esta tanda cambia cosas de la 10N5, la 10N6 y la 10N7** (lo marco en cada punto): manda lo de aquí.

## 0a. Tus dudas de la 10N6, respondidas
1. **La excursión quitada de la ruta:** sí, con botón. En su línea de RESERVAS («Ya no está en tu ruta»), [Volver a ponerla en la ruta]: abre la `Hoja Dia` con el día de la reserva ya elegido. Como el día entero pasa a ser la excursión, antes sale la confirmación (con la forma del apartado 8b): «¿Pasamos el jueves 12 a la excursión?» · «Las paradas de ese día salen de tu ruta.» · [Sí, pasar].
2. **«✓ En ruta» en «Cambiar parada»:** bien, igual que en EXPLORAR.
3. **Las fotos desde una ficha sin día:** bien como lo has hecho.
4. **«Cambiar parada»:** sin filtros puestos, como se abre EXPLORAR siempre. Quita `initialFilters`.
5. **«Tus recuerdos» en las pausas:** bien, que no salga.
6. **Los gastos [Para mí] de Extras:** sí cuentan en «Tu parte», porque es dinero que pagas tú. Cambia la condición y la prueba vieja. (Que nadie más los vea sigue igual; con la 10N7, van en «Lo tuyo».)
7. **Una entrada «solo para quien la paga»:** bien, que se vea y avise igual.
8. **El invitado en «Del grupo»:** bien.
9. **Quitar un Free Tour sin reserva:** ya no rehace los días con el motor: se quita al momento, como cualquier parada (apartado 3d).
10. **Los textos del aviso del pase** (Eric, 28-oct; cambia lo de la 10N6). El título se queda («Desbloquéalo con el Pase Roma»). Debajo, **la línea pequeña solo cuando dice algo que el viajero ya ha usado** (la prueba gastada, la foto que ya tiene); si no, **una sola frase en negrita, de una o dos líneas**. Y que se entienda que con el pase es **sin límite**:
    - «Escuchar historia»: «Ya has escuchado tu historia de prueba.» · «**Escucha todas las historias que quieras, sin límite.**»
    - la segunda foto: «Ya tienes tu foto de este sitio.» · «**Guarda fotos sin límite y haz crecer tus recuerdos de Roma.**» ({destino})
    - «Fuentes»: «**Encuentra las fuentes de agua más cercanas, estés donde estés.**»
    - «Baños»: «**Encuentra los baños más cercanos, estés donde estés.**»
    - «Cerca de ti»: «**Descubre todo lo que tienes cerca, estés donde estés.**»
    - HOY: «Solo tienes HOY abierto el día de prueba.» · «**Ten HOY todos los días de tu viaje.**»
    - la genérica: «**Desbloquea todo lo que el pase añade a tu viaje.**»
    Fuera «Tu ruta ya te dice qué ver y dónde comer.» y «Tu ruta ya te dice qué hay en cada parada.». «Estés donde estés» solo si de verdad ordenan por dónde está el viajero (dímelo). Añade la regla a `docs/REGLAS_DE_LA_APP.md`.
11. **La música:** la pone Eric en la carpeta. Cuando esté, comprímela con tu script y dime cómo queda.
12. **Con dos cuentas reales:** lo prueba Eric después de aplicar las migraciones.
- **La 0053 también junta avisos durante 15 minutos** (el vuelo y el alojamiento del administrador). Haz con ella lo mismo que en el apartado 4, en una migración nueva (no edites la 0053): unos 2 minutos, y cada cambio vuelve a marcar el aviso como nuevo, con franja y sonido.
- **La prueba que falla con el Vite normal** (`pruebaTanda10N6_recuerdos`, «Con pase»): va a la 10S. Aquí no la toques.

## 0b. Tus dudas de la 10N7, respondidas
1. **Vuelo, alojamiento y coche del administrador:** la pregunta («¿Para quién has comprado el vuelo?», o «Para los dos» / «Solo para mí» en la cuenta conjunta) sale **en el momento de añadirlos**, como en las entradas, y con **marcado solo quien lo añade** (lo del apartado 7c). Lo que ya estaba guardado no cambia.
2. **Privacidad a nivel de red: sí, ciérralo.** Lo «Solo para mí» es sobre todo un regalo o una sorpresa: no puede llegar a nadie más, tampoco en los datos. Guarda lo «Solo para mí» del administrador aparte (como `reservas_invitado`), con su migración (no edites las anteriores).
3. **Design 07:** bien como lo has hecho («Cada uno lo suyo» con su tarjeta mientras no se elige).
4. **Design 08:** bien, sin el interruptor.
5. **El presupuesto de quien viaja solo:** hazlo ya como `Cuentas Modo` 01 («Tu viaje», los bloques, «Añadir gasto» punteado), sin «por persona».
6. **El PDF del presupuesto:** que lleve el modo, y «Lo tuyo» solo en el PDF de quien lo tiene.
7. **El cambio del día de cada gasto:** sí, guarda el cambio del día en que se apunta cada gasto (con su migración). Si no, las deudas entre amigos cambian cada día sin que nadie toque nada.
8. **El recargo del 4 %:** bien, solo en el pase.
9. **Importes largos en la tarjeta oscura:** a la 10S.
10. **Lo de dos cuentas reales:** lo prueba Eric.
- **Lo que quedó por enlazar de la moneda** (los campos donde se escribe el precio: `HojaPrecio`, `AddReservationSheet`, `GeneralBookingModal`; el «Cuánto toca» de «Añadir gasto»; las etiquetas de precio del explorador): acábalo aquí. **En todos los sitios donde se escribe un precio** (gasto, entrada, alojamiento, vuelo, coche, excursión), el precio sale en la moneda del viajero y, al lado, **se puede elegir otra solo para ese precio** (por ejemplo, quien ve la app en pesos y ha pagado en euros). Se guarda en la moneda elegida, con el cambio de ese día.
- **La 0054 también junta avisos durante 15 minutos** («ha cambiado las cuentas»): lo mismo que con la 0053 (apartado 0a), unos 2 minutos y que vuelva a salir como nuevo.

## 1. El perfil
- **«Mis viajes»:**
  - **con un solo viaje, la tarjeta a todo el ancho** (hoy queda un hueco a la derecha y se ve raro);
  - **con más de uno, cada tarjeta, el 60 % del ancho** (hoy casi todo el ancho), para que la siguiente se vea bien y se entienda que se desliza.
- **La tarjeta del [+] «Añadir un viaje que ya hiciste»** pasa a: «**Añade un viaje que ya hiciste**» · «¿Viajaste antes de tener JUTRIP? Añade tu destino y rellena tu mapa y tu pasaporte.»

## 1b. El orden de Ajustes (Eric, 28-oct)
- **«Mi cuenta»**, en este orden: el correo (como ahora, el primero), **«Moneda»** (se pasa aquí desde «La app»: es importante y tiene que verse enseguida) y «Tengo un código de invitación».
- Después, como ahora: «Mis pases», «La app» (sin «Moneda»), y «Invitar a un amigo» y «Privacidad y condiciones».
- **«Cerrar sesión», al final de todo**, sola en su propio bloque.

## 2. Unirse, avisos, sonido y los botones flotantes
- **Al unirse a un viaje, solo los avisos de desde que te uniste.** Hoy, al unirse, le llegan a la campana todos los avisos de antes de ese viaje (decenas). Que no: lo de antes de unirse no sale (ni en la campana, ni en la franja, ni con sonido).
- **Al salir o al quitarte de un viaje, sus avisos desaparecen de tu campana** (menos el de «Ya no formas parte del viaje…»).
- **El código que no vale:** solo «**Este código no existe.**»
- **El sonido de los avisos:** a Eric le sonó en el móvil del administrador y en el invitado solo con el interruptor de excursión. Mira si es lo del iPhone (solo suena si ya se ha tocado la pantalla desde que se abrió la app) o si falta en algún tipo de aviso. Que suene igual para todos y con todos los avisos (con el ajuste encendido). Dime qué has encontrado.
- **El botón de los logros desaparece al entrar en una categoría de EXPLORAR** (por ejemplo, Miradores). Lo de la 10N4 vale para todo: el lápiz y los logros, siempre por encima, en todas las pantallas; solo se quedan debajo de una hoja que sale desde abajo o de una confirmación mientras están abiertas. Repasa EXPLORAR entero (categorías, lista, mapa, a pantalla completa).

## 2b. La pastilla «Pase Roma» de RUTA
- **El estilo nuevo del pase:** sin pase, **fondo azul oscuro con el candado dorado**; con pase, **en dorado con el ✓**. (Hoy, sin pase, sale en dorado.)
- **Que no desaparezca al cargar:** hoy, al entrar en RUTA, a veces no sale y aparece un segundo después (la tarjeta del viaje salta). Mientras no se sabe si hay pase, que su hueco ya esté (la pastilla en gris claro, sin texto), del mismo tamaño, y luego se pinta. Nada salta. Lo mismo en cualquier sitio que espere a saber si hay pase.

## 3. El Free Tour: una parada más, sin mover días (Eric, 28-oct; cambia lo de la 10N5 y la 10N6)
- **Por qué:** mover días enteros para el Free Tour nos está dando un fallo tras otro (días en gris sin motivo, «Ningún día encaja», 26 cambios en una propuesta, el Free Tour que no se quita). Se acaba: **el Free Tour no mueve ni cambia ningún día**. Es una parada más, con dos reglas suyas.
- **a. Añadirlo** (desde EXPLORAR, su ficha, «+ Añadir parada» o RESERVAS): la `Hoja Dia` «¿A qué día lo añadimos?», y va **de primera parada, por la mañana**, de ese día. El resto del día queda como estaba. Desde ahí, el viajero lo mueve si quiere. **Ningún día en gris**, salvo el día de una excursión (que es el día entero), con su línea: «El jueves 12 es el día de tu excursión.».
- **b. Moverlo a otro día** («···» › «Mover a otro día», con la `Hoja Dia`): lo mismo, de primera parada por la mañana del día elegido.
- **c. Una sola vez en la ruta** (es la excepción a lo de poder repetir un sitio, apartado 8b): si ya está en la ruta, en EXPLORAR y en su ficha sale con «✓ En ruta» y **sin el +**, ni en «+ Añadir parada». Se mueve desde su propia parada.
- **d. Quitarlo, como cualquier parada:** «···» › «Quitar parada», al momento, con [Deshacer] (si tiene reserva, la confirmación del apartado 8b). **Fallo grave de hoy:** sale «Free Tour quitado de tu ruta · Deshacer», pero el Free Tour no desaparece. Que se quite de verdad y al momento, sin rehacer los días con el motor. Busca por qué no se quitaba.
- **e. Nuestro día escrito con el Free Tour** (el D3, a las 10:00) se queda como está mientras nadie lo toque.
- **f. Regla para cualquier parada que pasa a otro día** (añádela a las reglas): **se mueve solo la parada, nunca su franja** («Mañana», «Tarde», «Noche»). Hoy, al pasar el Free Tour a otro día, se lleva su «MAÑANA» y aparece un «MAÑANA» suelto en medio del día. Las franjas son del día, no de la parada: la parada entra en la franja que le toque en su nuevo sitio. Dónde queda (Eric, 28-oct):
  - **el Free Tour, siempre de primero por la mañana** (con pase o sin él);
  - **lo demás, sin pase: de primero en el día**, para que el viajero lo vea enseguida sin bajar hasta el final, y desde ahí lo coloca él;
  - **lo demás, con pase: donde mejor encaja** (lo de la 10N: donde menos hay que andar de más). Dime si eso ya lo hace la app hoy, y si es así, añádelo a la lista del pase con una línea que sea verdad;
  - vale igual al pasar una parada a otro día y al añadir un sitio a un día;
  - **en los dos casos, al acabar, la app lleva al viajero a esa parada** (baja hasta ella y la marca un momento), para que vea dónde ha quedado.
- **g. Con este cambio, lo de bloquear días** (un día con entradas con hora o una excursión no se mueve, con «El sábado 14 tiene entradas con hora: no lo movemos. Elige otro día.») **ya solo vale para lo que mueve días enteros:** el interruptor de excursión y cambiar el orden de los días. Al añadir o mover una parada, nunca se bloquea un día (como mucho, la línea roja de la 10N4 si ese día cierra).
- **h. Quien solo recomienda, al mover el Free Tour a otro día: un solo cambio.** Hoy le salen **26 cambios** en su propuesta (cada parada que se cambia de día cuenta como un cambio). Que sea **uno**: «Pasar el Free Tour al jueves 12» (y al añadirlo, «Añadir el Free Tour al jueves 12», como dice la 10N5). Al aceptarlo, se hace todo de golpe. Lo mismo con cualquier cambio que mueva muchas paradas de golpe (el interruptor de excursión, cambiar el orden de los días): un cambio, con su frase.
- **i. La hoja para elegir el día, exactamente como `Piezas/Hoja Dia`** (01 mover el Free Tour, 01b otro día elegido, 02 añadir el Free Tour, 03 añadir cualquier sitio). **Regla para toda la app (Eric, 27-oct): siempre que haya que elegir un día** (añadir algo a un día, pasar algo a otro día, cambiar un día por otro: el Free Tour, cualquier sitio desde EXPLORAR o su ficha, «Mover a otro día» de una parada, una excursión…), **esta hoja**. Busca todas las hojas de elegir día que hay hoy y cámbialas; dime cuáles eran. En la 01 y la 02 (el Free Tour), fuera cualquier texto que diga que se cambian días: ahora solo se pone de primera parada.
  - **Ojo, en la 03 (añadir cualquier sitio) Design ha bloqueado el sábado 14 por «tiene entradas con hora»:** al añadir un sitio no se mueve ningún día, así que **no se bloquea ninguno**. Solo se bloquea cuando lo que se hace mueve el día entero (el interruptor de excursión, cambiar el orden de los días; el Free Tour ya no, apartado 3). Al añadir un sitio, si ese día cierra, la línea roja de la 10N4 («El miércoles 11 cierran los Museos Capitolinos.»), sin bloquearlo.
- **j. Fuera «Quitar el Free Tour» en toda la app**, en cualquier hoja donde salga (también el texto pequeño de abajo del todo que sale a veces): se quita como cualquier parada (10N6). Busca todos los sitios y dime cuáles eran.

## 4. Los avisos que no llegan
- **Lo que ha visto Eric:** con la 0051 aplicada, al invitado no le llega nada cuando el administrador **elimina un día entero**, **cambia el orden de los días**, **añade un restaurante** o **añade sitios**. Sí le llegó «Eric ha vuelto a la ruta inicial», y el del interruptor de excursión, con retraso.
- **Mira por qué.** Una pista: el aviso de cambios junta los cambios seguidos (la 0036, 15 minutos) en el mismo aviso. Si lo que pasa es que se juntan en un aviso que ya estaba (y no sale como nuevo), arréglalo así: **cada cambio nuevo, aunque se junte con el anterior, vuelve a marcar el aviso como nuevo, sale la franja y suena**, con la frase de lo último que ha pasado. Y que el rato para juntarlos sea corto (unos 2 minutos), no 15.
- **Cada uno de estos, con su línea:** «Eric ha quitado el sábado 14.», «Eric ha cambiado el orden de los días.», «Eric ha añadido Da Enzo al jueves 12.», «Eric ha añadido el Panteón y 2 sitios más al jueves 12.».
- **Que lleguen enseguida** (unos segundos), también el del interruptor. Dime cuánto tardan, de un móvil a otro.
- **Nadie recibe avisos de lo que ha hecho él mismo.** Hoy, a veces, quien cambia algo (el administrador y también un invitado que edita) ve un aviso con una «i» tipo «Tu viaje ha cambiado» por su propio cambio. Que no salga nunca a quien lo ha hecho: ni ese aviso, ni la franja, ni la campana, ni el sonido. Busca de dónde sale (puede que sea el propio guardado volviendo por Realtime) y dime qué era.

## 5. La película del pase
- Eric la ha visto en su iPhone y **sigue mal**: solo están bien el título y las rayitas. Hay escenas con un recuadro con otro fondo dentro de la escena (por ejemplo, la cuarta, la del sorteo, con los bordes del recuadro a los lados), y no se ven a pantalla completa.
- **Hazla exactamente como `Pase Pelicula Movil`, escena por escena** (1 Vuelo y alojamiento, 2 HOY, 3 Algo brilla, 4 Colección y niveles, 5 El pasaporte, 6 Los recuerdos, 7 El final), a pantalla completa, en los dos tamaños que dibuja Design (390 × 844 y 375 × 667), con la barra de Safari. Captura de cada escena al lado de la de Design.
- **Una diferencia con Design:** el título «Todo lo que incluye tu Pase Roma» va **en la misma línea que [Saltar]** (Eric, 26-oct), no encima de las rayitas.

## 6. EXPLORAR: lo del pase, como antes y con el candado (cambia lo de la 10N5 y la 10N6)
- **«Baños» y «Fuentes»:** como eran antes de la 10N5 (sus tarjetas en gris, con su foto si la tenían), **con el candado dorado arriba a la derecha**, donde está ahora. Fuera el fondo azul oscuro.
- **«Recomendados» y «Cerca de ti»:** como eran antes (el estilo de elegir de siempre: la elegida en oscuro y la otra en claro), y **«Cerca de ti», sin pase, con el candado dorado en su esquina de arriba a la derecha**, como Baños y Fuentes. Fuera el azul oscuro de «Cerca de ti» (hoy no se distinguen las dos).
- Esto cambia la regla de la 10N6 (apartado 1d): en EXPLORAR, lo del pase va **con el candado en la esquina**, no en azul. La caja pequeña azul con dorado sigue para las cajas que explican algo (como la del alojamiento en RESERVAS).

## 7. RESERVAS
- **a. Al cambiar el día de una reserva a uno que no está en la ruta:** fuera el texto «Tu reserva es del viernes 13: la pasamos a ese día de tu viaje…».
- **b. Un solo bloque de vuelo y uno de alojamiento para quien no es administrador.** Hoy Ana ve dos: «Llegada y vuelta · Falta · Todavía no hay vuelo puesto» y debajo «Pon tu vuelo · Pon el tuyo» (lo mismo con el alojamiento). Que vea **solo uno**, «Llegada y vuelta» (y «Alojamiento»), igual que el administrador: si no hay ninguno, «Falta» y al tocarlo pone el suyo; si alguien se lo ha puesto, sale ese, con «Lo ha puesto Eric · …» y la opción de poner el suyo.
- **El diseño de b, c y d: `Piezas/Reservas Cada Uno`, exactamente igual.** **Ojo con un texto de Design:** en la 04, Ana ve «Lo ha puesto Eric · para ti y Ana»; desde Ana es «**Lo ha puesto Eric · para Eric y para ti**». Los textos, siempre desde quien lo mira.
- **c. El vuelo y el alojamiento, igual para todos, con «¿Para quién es?»** (cambia lo de la 10N5): cualquiera que ponga un vuelo (o un alojamiento) elige **para quién es**, como en el presupuesto: sale marcado solo quien lo pone y los demás se marcan uno a uno. A los marcados se les pone ese vuelo (si tenían el suyo, se les cambia, con su aviso). Nadie se queda en blanco por esto: a quien no tenía ninguno, se le pone. Cada uno puede volver a poner el suyo cuando quiera. La ruta sigue al del administrador (si el administrador no tiene vuelo, la ruta como hoy).
- **d. Guardar el vuelo de una vez, con ida y vuelta:** hoy, al poner solo la hora, ya salta el aviso a todos. Que no:
  - en la rueda de la hora, **fuera [Guardar]**: al cerrarla (✕ o tocando fuera) la hora se queda puesta;
  - se rellena todo (ida y vuelta, horas, aeropuertos, «¿Para quién es?») y, al final, **un solo botón «Guardar el vuelo»**. Solo entonces se guarda y llegan los avisos, una vez, con la ida y la vuelta juntas («Eric ha puesto el vuelo para ti y Ana: ida mar 10 · 11:15, vuelta sáb 14 · 18:05.»);
  - lo mismo con el alojamiento («Guardar el alojamiento»).
- **e. «Añadir gasto», en «¿Para quién es?», marcado solo quien lo añade** (cambia lo de la 10N5); los demás se marcan a mano, como en las reservas. Con esto, en «Cada uno lo suyo», **[Para todos] / [Para mí] sobra**: lo dicen los nombres (solo tú, es tuyo y nadie más lo ve; con más, entra en las cuentas del grupo, con la línea pequeña de la 10N7). Quítalos de «Añadir gasto» en «Cada uno lo suyo» (también si en `Cuentas Modo` 08 siguen saliendo). En la cuenta conjunta siguen «Para los dos» / «Solo para mí» (10N7).

## 8. Comprar la entrada a la misma hora
- **Hoy:** desde el invitado, en una entrada que otro ya tiene (azul con el numerito), [Reservar la mía a la misma hora] abre la hoja con «Abrir la compra · 14:00», que lleva a la web del proveedor. Está bien que lleve a comprarla, pero luego no se guarda.
- **Que la hoja tenga las dos cosas:** el botón principal «**Comprar a las 14:00**» (abre la web, como hoy) y, debajo, «**Ya la tengo · Guardarla**» (la guarda en RESERVAS con ese día y esa hora, sin abrir la web).
- **Al volver a la app después de abrir la compra,** la pregunta: «**¿Has comprado la entrada del Coliseo de las 14:00?**» · [Sí, guardarla] · [Todavía no]. Con «Sí», se guarda en su RESERVAS, con su precio si lo pone, y su botón pasa a verde con ✓.

## 8b. Lo que ha visto Eric de la 10N6 (28-oct)
- **a. La confirmación de quitar una parada con entrada** (también el Free Tour reservado; cambia lo de la 10N6). Hoy los botones son feos (el dorado degradado no es de ninguna confirmación). Que quede así:
  - «¿Quitamos el Panteón de tu ruta?» · «Tienes su entrada para el miércoles 11 a las 9:00.»
  - [**Quitar parada**] (la entrada se queda en RESERVAS, con «Ya no está en tu ruta») y [**Quitar también la entrada**] (en rojo). Los dos botones, con el estilo de la confirmación de «Eliminar día», que a Eric le gusta.
  - Fuera la línea «La entrada se queda en RESERVAS.».
  - **Fuera [Cancelar]:** ya está la ✕ arriba.
- **Regla para toda la app (añádela a `docs/REGLAS_DE_LA_APP.md`):** las confirmaciones llevan la ✕ arriba y **no llevan [Cancelar]**. Repásalas todas (la lista que hiciste en la 10N6) y dime si alguna no tiene la ✕.
- **b. Una parada con entrada: «Mover antes» y «Mover después», activos** (Eric, 28-oct; cambia lo de la 10N6). Hoy salen en gris con «Su hora la fija tu entrada de las 9:00». Que no: dentro de su día, el viajero decide el orden (hay quien madruga a las 6 y quien a las 8), igual que ya puede arrastrarla. Haz lo mismo que al arrastrarla, **sin ningún aviso de horas**: el viajero no ve las horas de la ruta (las usamos solo por dentro), así que no se le dice nada. Lo que sí se dice, como hasta ahora: la hora de la entrada («Tienes tu entrada a las 9:00») y, si algo con entrada se pasa a otro día, que revise la entrada. Lo que sigue en gris, diciendo por qué: «Mover a otro día» (la entrada es de ese día) y «Cambiar parada» (tiene su entrada).
- **c. «Cambiar parada»:**
  - **fuera la franja** «Elige el sitio que cambia por…»: con el ⇄ en cada sitio basta. Para que se sepa qué se cambia, el título de arriba, donde hoy pone «Cambiar parada — jue 12», pasa a lo más corto: «**Cambiar Via dei Fori Imperiali**», «Cambiar Coliseo», «Cambiar Fontana di Trevi» (sin artículo y sin el día; si no cabe, en dos líneas);
  - **el ⇄, en todos los sitios, también en los que ya están en tu ruta** («✓ En ruta», que sigue saliendo como información). Se puede tener el mismo sitio dos veces o más (Eric, 28-oct: la Fontana di Trevi a las 8 solo, luego con el Free Tour y otra vez por la tarde). Cambiar una parada por otra que ya está en la ruta pone una segunda vez ese sitio en su lugar, sin quitar la otra;
  - **lo mismo en EXPLORAR y en su ficha:** el + también en los sitios «✓ En ruta», para añadirlo otra vez;
  - **comprueba que un sitio repetido no rompe nada:** cada parada con su propio id; las fotos de «Tus recuerdos», las entradas, los likes, los logros, el mapa (dos números en el mismo sitio) y los avisos de los cambios. Dime qué has tenido que tocar;
  - sin filtros puestos al abrir (0a-4), y «Cerca de ti» como dice el apartado 6.
- **d. El presupuesto con algo «Solo tú» en «Cada uno lo suyo»:** Eric compra el Panteón (25 €) solo para él y ve «Ruta 0 €», con el Panteón dentro, y «Total 0 €». Es verdad que no es del grupo, pero parece que no se ha sumado. **Que sea igual que la cuenta conjunta (10N7):**
  - lo «Solo tú» sale en el bloque propio de abajo, después de «Extras»: «**Lo tuyo · Solo lo ves tú**», con su importe; no dentro de «Ruta»;
  - el total de abajo, explicado: «**Del grupo 0 € · Lo tuyo 25 € · Total 25 €**»;
  - viajando solo, todo suma en «Ruta», como siempre.
- **e. Los botones sobre el mapa, que se vean:** en la ficha de una parada, la flecha de volver (arriba a la izquierda) y la fecha («Mié, 11 Nov», arriba a la derecha) casi no se ven sobre el mapa. Que lleven **el mismo borde marrón que la pastilla «Roma · 11 – 15 nov»** del mapa de RUTA. Lo mismo con cualquier botón suelto que vaya encima de un mapa en la app (añádelo a las reglas).
- **f. «Tus recuerdos»** (el diseño, perfecto):
  - **con pase, elegir varias fotos de la galería de una vez**, no de una en una;
  - **el aviso del pase de la segunda foto:** el texto de 0a-10;
  - en ese aviso, la ✕ de arriba va montada sobre el borde de la tarjeta azul: que quede fuera, separada.
- **g. La cabecera de la ficha de un sitio** (en toda la app: DÍAS, EXPLORAR, «Cambiar parada»…). Hoy, en el Coliseo, queda un hueco grande entre el nombre y las etiquetas, y las cosas no cuadran con la foto. Que quede así:
  - **la foto, el nombre, las etiquetas y el corazón, en un solo bloque** (solo es cómo se alinean: **sin fondo, sin tarjeta ni borde**, como ahora): nada sobresale ni por encima ni por debajo de la foto. El nombre arriba, alineado con el borde de arriba de la foto; el corazón, a la derecha, también arriba;
  - **las etiquetas, justo debajo del nombre, sin hueco:** si el nombre ocupa una línea, **una etiqueta debajo de la otra**, en columna, alineadas a la izquierda con el nombre (primero el horario, luego el tiempo de visita); si el nombre ocupa dos líneas, las etiquetas en una sola fila;
  - **nueva etiqueta «Abierto 24 h», en verde**, para los sitios que están siempre abiertos y no tienen horario (la Fontana di Trevi, las plazas…). **Solo si es verdad:** muchos parques cierran de noche. Sácala de los datos (sitios al aire libre sin horario de apertura) y pásame la lista de sitios de Roma que la llevan, para que Eric la revise antes;
  - captura de la Fontana di Trevi, del Coliseo y de un sitio con nombre de dos líneas.
- **h. El aviso de abajo con [Deshacer] ocupa exactamente el sitio del menú de abajo** (Hoy · Ruta · Días · Explorar · Reservas): mismo alto, mismo ancho y mismas esquinas, tapándolo entero mientras se ve. Hoy queda más bajo que el menú y por encima se ven trozos del menú (el círculo de «Días», el punto de Reservas). Lo mismo con cualquier aviso de abajo de la app (añádelo a las reglas). Pruébalo en Safari y con la app añadida a la pantalla de inicio (sin la barra de Safari).
- **i. El Castillo de Sant'Angelo no tiene el botón frambuesa de la entrada** en su parada de DÍAS, y se puede reservar. Arréglalo y **repasa todos los sitios de Roma**: cada sitio que tiene entradas para comprar, con su botón. Pásame la lista de los que faltaban.

## 9. La prueba
- La batería completa y `pruebaJutrip`, en 0 fallos (si alguna falla solo con el Vite normal, pásala con el Vite estable y dilo en el informe).
- Prueba nueva `pruebaTanda10N8`: el perfil con un viaje (todo el ancho) y con varios (60 %); el texto nuevo del [+]; el orden de Ajustes (Moneda en «Mi cuenta», «Cerrar sesión» al final); unirse sin los avisos de antes y salir sin los del viaje; «Este código no existe.»; el botón de los logros en todas las pantallas de EXPLORAR; la pastilla del pase (azul con candado, dorado con ✓, sin saltar al cargar); el Free Tour como una parada más (sin mover días ni días en gris, de primera parada por la mañana, una sola vez en la ruta, quitarlo al momento y volver a añadirlo, un solo cambio en la propuesta, la hoja de Design, sin «Quitar el Free Tour», la franja que no viaja con la parada); los avisos de quitar un día, cambiar el orden, añadir un restaurante y añadir sitios, nuevos, con franja y sonido, y en segundos; la película como `Pase Pelicula Movil` (con el título en la línea de [Saltar]); la hoja de elegir día de `Hoja Dia` en todos los sitios, sin bloquear días al añadir un sitio; Baños, Fuentes y «Cerca de ti» como antes con el candado en la esquina; RESERVAS (sin el texto del día, un solo bloque, «¿Para quién es?» en el vuelo y el alojamiento, la rueda sin [Guardar], «Guardar el vuelo» con un solo aviso); «Añadir gasto» con solo quien lo añade marcado y sin [Para todos] / [Para mí]; comprar la entrada a la misma hora, «Ya la tengo» y la pregunta al volver; lo del apartado 8b (la confirmación sin [Cancelar], «Mover antes» y «Mover después» activos y sin aviso de horas, «Cambiar parada» sin franja, con el título y el ⇄ en todos, un sitio dos veces en la ruta, «Lo tuyo» en el presupuesto, los botones con borde sobre el mapa, la cabecera de la ficha con «Abierto 24 h», el [Deshacer] en el sitio del menú, dónde queda lo que se mueve sin pase y con pase, los textos nuevos del aviso del pase, varias fotos de una vez con pase, el botón de la entrada en todos los sitios con entrada); lo de la 0b (la pregunta al añadir vuelo, alojamiento y coche, «Solo para mí» del administrador guardado aparte, el presupuesto de quien viaja solo, el PDF, el cambio del día de cada gasto, otra moneda en cada precio).
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N8.html`, a tamaño de móvil.

## 10. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N8». Di por qué salían los días bloqueados del Free Tour, por qué no llegaban los avisos y cuánto tardan ahora, y qué pasaba con el sonido. Si hace falta migración, dime cuál aplicar.

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N8.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.

---

## Cambio posterior en el apartado 0a-10 (Eric, 28-oct)

Cambio en la 10N8, apartado 0a-10 (los textos del aviso del pase). Usa estas frases en negrita en lugar de las del prompt; las líneas pequeñas de encima se quedan igual. «Pase Roma» es siempre el pase del destino ({destino}: Pase Lanzarote…), escrito igual que en el título y el botón:
- Escuchar historia: «Con el Pase Roma, podrás escuchar todas las historias que quieras, sin límite.»
- Segunda foto: «Con el Pase Roma, guarda fotos sin límite y haz crecer tu álbum de recuerdos.»
- Fuentes: «Con el Pase Roma, encuentra las fuentes de agua más cercanas, estés donde estés.»
- Baños: «Con el Pase Roma, encuentra los baños más cercanos, estés donde estés.»
- Cerca de ti: «Con el Pase Roma, descubre todo lo que tienes cerca, estés donde estés.»
- HOY: «Con el Pase Roma, tienes HOY disponible todos los días de tu viaje.»
- La genérica: «Desbloquea todo lo que el Pase Roma añade a tu viaje.»
Guarda también este cambio en docs/dias/PROMPT_TANDA10N8.md.
