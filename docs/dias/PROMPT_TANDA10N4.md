Hola. TANDA 10N4: PEQUEÑOS ARREGLOS DEL REPASO DE ERIC CON DOS TELÉFONOS (26-oct). Va después de la 10N3: si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N4.md e inclúyelo en tu commit.
- **Lo de Design, exactamente igual (Eric, 26-oct: «nos gusta mucho»).** Cada pantalla de Design que nombra esta tanda se hace igual que en su pieza: medidas, márgenes, colores, letras, iconos, sombras, textos y animaciones. Nada «parecido» ni a tu manera. Solo cambian los datos de ejemplo (usa los de verdad) y lo que este prompt diga expresamente que cambia. Si algo no se puede hacer igual en la web o en el iPhone, dímelo antes y no lo cambies por tu cuenta. En el REPASO de esta tanda, cada captura al lado de la de Design, para compararlas.
- **Design, nuevo: «APP_RUTAS.zip»**, en la carpeta del proyecto. Es el zip completo de Design y lleva todo lo anterior (también lo de «cabecera.zip»). Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`) e inclúyelo en tu commit. Lo nuevo: `Piezas/Avisos Gestion`, `Piezas/Avisos Franja`, `Piezas/Hojas Opciones`, `Piezas/Ficha Cabecera` y `Piezas/Parada Entrada` (de esta tanda); `Piezas/Entradas Horas`, `Piezas/Ver Entrada` y los cambios de `Piezas/Entradas Pestana` son de la 10T: cópialos, pero no los hagas aquí. Donde la pieza vieja `Piezas/Avisos` no cuadre con las nuevas, mandan `Avisos Gestion` y `Avisos Franja`.
- Eric lo ha visto en su iPhone, con las migraciones de la 0032 a la 0045 aplicadas, y dos cuentas (él, administrador; bengala.ingresos, invitada).

## 0a. Tus dudas de la 10N3, respondidas
1. **Las fechas del viaje, bloqueadas también para quien solo recomienda:** sí, así está bien. Las fechas solo las cambia el administrador.
2. y 4. **El perfil viejo, fuera del todo** (y con él, «Abierto»). Un solo perfil para todos: quien tiene los logros apagados ve el perfil nuevo sin lo de los logros (sin EXP, vitrina ni billete del sorteo; con su pasaporte, sus viajes y sus ajustes). La prueba antigua que pedía «Abierto», cámbiala para que compruebe el perfil nuevo (dímelo en el informe).
3. **«Tu parte» en lugar de «por persona»** cuando una reserva es solo para parte del grupo: sí («Tu parte · 31 €»). Para todo el grupo, sigue «por persona».
5. **El Free Tour como invitado:** Eric ya lo ha probado y salió mal (después de la cena y con un aviso que no se entiende). Va en la 10N5: no lo toques aquí.
- **«Cambiar portada»** (de la 10N3): su hoja, con el formato de tarjetas del apartado 3.

## 0b. IMPORTANTE: el lápiz y los logros, en todas las pantallas
- El lápiz de la propuesta (cuando hay cambios) y el botón de los logros son **flotantes y tienen que verse en todas las pantallas**: RUTA, DÍAS, EXPLORAR (también a pantalla completa, con su lista y su mapa), las fichas de los sitios, RESERVAS, el presupuesto, HOY…
- Hoy, en la prueba de Eric (invitado añadiendo un sitio desde EXPLORAR), **no aparecen hasta que se cierra todo** y se vuelve a la ruta. Es un error grave: el invitado no ve que tiene un cambio en su propuesta.
- Solo se pueden quedar debajo de una hoja que sale desde abajo mientras está abierta (para no taparla), y vuelven en cuanto se cierra.
- Que nunca tapen el último elemento de una lista (el hueco al final, como en la 10N) ni los botones de abajo.

## 1. La pastilla del pase parpadea «comprado»
- Al cargar la ruta (RUTA activa), la pastilla «Pase Roma» sale medio segundo como si estuviera comprado y luego pasa a bloqueada. Mira por qué (¿empieza con el valor de antes mientras llega `/api/pase/estado`?) y que no pase: mientras no se sabe, la pastilla sin estado (o sin pintar), nunca «comprado» por adelantado. Lo mismo en cualquier otro sitio que enseñe el pase (HOY, el perfil, los candados).

## 1b. Una sola letra en toda la app: la de Design
- La app ya usa la letra de Design (Instrument Serif en los títulos, Geist en el texto, Geist Mono en horas y etiquetas). Pero quedan restos de las letras viejas: el calendario para elegir las fechas al crear la ruta (`DurationSelector.tsx`, con `font-dmsans`, y `.rdp-root` en `index.css` con Plus Jakarta Sans).
- Que ese calendario use las mismas letras que el resto, como en Design, y quita de `index.css` y `tailwind.config.ts` lo que ya no se use (Plus Jakarta Sans, Playfair Display, DM Sans): así carga menos.
- Busca si queda alguna otra pantalla con otra letra (fuera del logo, que es Italiana) y dímelo en el informe.

## 2. La campana: «Gestionar los avisos», como en Design
- **El diseño:** `Piezas/Avisos Gestion` (01 normal, con [Seleccionar]; 02 seleccionando; 03 después de eliminar). Hazlo **exactamente igual** (letras, tamaños, colores, iconos, el fondo dorado claro del elegido, los botones), con solo dos cambios de Eric:
  - **nuestra campana es a pantalla completa** (en Design sale como hoja): arriba, igual que en Design, «TUS AVISOS» pequeño, «Avisos» grande y [Seleccionar], y se cierra como hoy;
  - **[Marcar leído] y [Eliminar] no van en una barra con dos botones, sino como el resto de opciones de la app** (apartado 3, `Hojas Opciones`): sube desde abajo una hoja pequeña con dos tarjetas, «Marcar como leído» (con su icono y su línea: «Dejan de salir como nuevos») y, la última y en rojo, «Eliminar» («Se quitan de tu campana. Puedes deshacerlo»). Sube al elegir el primero, se queda mientras eliges (sin tapar la lista: la lista deja su hueco abajo) y baja al no quedar ninguno o al tocar [Cancelar].
- **Los textos de la pieza son de ejemplo:** los de verdad, con la regla del apartado 4b2 (y la 10N5). Con artículo también en los de cierre («Los Museos Vaticanos y la Villa Farnesina cierran el domingo 15 de noviembre.»). **Ojo:** en la pieza, ese aviso de que cierran sale como «Fecha especial» con el calendario; es **información** (la «i»). «Fecha especial» y el calendario son para «Mañana empieza tu viaje» y parecidos.
- **Fuera la etiqueta «Leído»** («Fecha especial · Leído», «Información · Leído»): como en Design, los nuevos en negrita con el puntito dorado; los leídos, en gris.
- **Cambia lo de la 10M (Eric, 26-oct): abrir la campana ya no marca todo como leído.** Cada aviso se queda nuevo hasta que el viajero lo abre o lo marca.
- **Normal (01):** tocar un aviso lo abre (la propuesta, el gasto, el día que ha cambiado…) y lo marca como leído. Los que llevan botones dentro ([Aceptar] [Rechazar] de un gasto o de una propuesta) los siguen llevando.
- **[Seleccionar] (02):** sale un circulito a la izquierda de cada aviso; al tocar un aviso se elige (fondo dorado claro y ✓ oscuro); arriba, «2 seleccionados» y «Seleccionar todos»; [Seleccionar] pasa a [Cancelar]. Abajo, la hoja con las dos tarjetas (arriba). Si todos los elegidos ya están leídos, «Marcar como no leído».
- **Eliminar (03):** sin preguntar más; los quita de su campana, sale la franja oscura «2 avisos eliminados» con [Deshacer] (unos segundos), y la campana vuelve a la normal.
- **El aviso «Sobre tu ruta»** («2 días en Roma dan para mucho…»): está bien que esté en la campana. Pero el viaje de la prueba es del 11 al 15 de noviembre (5 días): mira de qué viaje sale ese texto. Cada aviso tiene que ser del viaje que está abierto.
- **«Mañana empieza tu viaje a Roma · ahora»** salió hoy (26-oct) con el viaje del 11 al 15 de noviembre: está mal. Mira por qué salió (¿de otro viaje, de las pruebas, de la fecha?) y que solo salga de verdad el día antes, en la hora del destino.

## 3. Todos los menús de opciones, como en Design (y siempre iguales)
- **El diseño:** Design ha hecho los menús de opciones: 01 menú de una parada, 02 menú de un día, 03 «Personas del viaje», 04 al tocar a una persona. Están en `Piezas/Hojas Opciones` (01 a 04). Hazlos **exactamente igual**.
- **Lo de hoy es muy feo** (Eric, 26-oct): una lista de palabras sueltas con rayas («Cambiar parada», «Quitar parada», «Mover antes»…), «Eliminar día» solo, y los botones [Cambiar permiso] [Quitar del viaje] debajo de la fila de la persona. Fuera.
- **La regla, para toda la app (Eric, 26-oct): cada vez que el viajero elige qué hacer (cambiar, añadir, mover, quitar…), las opciones salen así**, para que la app sea siempre igual:
  - la hoja desde abajo, con el tirador y la ✕; arriba, pequeño, qué es («PARADA», «DÍA», «PERSONAS DEL VIAJE · EDITAR») y debajo, grande, su nombre («Fontana di Trevi», «Domingo 15 · Hoy vuelves a casa», «VIAJES»);
  - **cada opción, una tarjeta blanca con borde redondeado:** delante, su icono en un cuadrado de color suave (cada opción con su color, como en Design); el nombre con la letra de los títulos; debajo, en gris, una línea corta que explica qué hace («Elige otro sitio para este hueco», «Pásala a otro día del viaje»); y la flecha «›» a la derecha si lleva a otra pantalla;
  - **la que no se puede usar, en gris claro y diciendo por qué** («Mover antes · Ya es la primera del día»);
  - **la de quitar o borrar, siempre la última, en rojo**, con su tarjeta en rosa muy claro, la papelera (o la puerta de salir) y lo que pasa («Sale de tu ruta. Puedes deshacerlo», «Se quitan el día y sus paradas», «Pierde el acceso y su plaza del pase vuelve a ti»).
- **Dónde:** el menú de una parada (01), el de un día (02), «Personas del viaje» (03), al tocar a una persona (04), y **todos los demás menús de opciones de la app** (los tres puntitos de RESERVAS, de un gasto, del viaje en «Mis viajes», del perfil…). Esto cambia lo que dijo Eric en la 10N3 («la hoja clara está bien»). Ponlos todos en el informe, con su captura.
- **El menú de la parada:** el orden de Design (Cambiar parada, Mover a otro día, Mover antes, Mover después y Quitar parada, la última). Si hoy hay más opciones que no salen en Design, se quedan, con el mismo formato, antes de «Quitar parada»; dime cuáles.
- **El menú del día:** como en Design, con «Añadir lugares» (abre EXPLORAR para añadir a ese día) y «Añadir una excursión» (hace lo mismo que el interruptor [Roma | Excursión] de ese día), además de «Eliminar día». **Ojo:** «Añadir una excursión», solo en los días en que cabe una (no en el de llegada ni en el de vuelta, como el interruptor): si no cabe, en gris con el porqué.
- **«Personas del viaje» (03 y 04):** al tocar a una persona, su hoja con «Cambiar permiso» y «Quitar del viaje». Abajo, «Añadir a alguien · Con un enlace o un código», como en Design (en vez de «+ Invitar a alguien»). **Ojo, en Design salen los nombres viejos de los permisos** («Puede editar», «Administrador, puede editar o solo recomendar»): usa los del apartado 4 («Editar», «Recomendar»; en la 04, «Editar o Recomendar»).
- **La hoja del permiso** (apartado 4), con el mismo formato de tarjetas: «Administrador» en gris con el candado y «Solo Eric»; «Editar · Cambia la ruta.»; «Recomendar · Propone cambios.»; la elegida, con el estilo de elegir (oscuro, como en la 10N).

## 4. Los permisos, con nombres cortos
- **En la hoja del permiso** (y en las etiquetas de la lista, y en cualquier sitio donde salgan):
  - **«Administrador»**, sin texto debajo: solo la palabra, en gris, con el candado y «Solo {nombre del administrador}» a la derecha («Solo Eric»);
  - **«Editar»** (en vez de «Puede editar»), con una línea corta: «Cambia la ruta.»;
  - **«Recomendar»** (en vez de «Solo recomendar»), con una línea corta: «Propone cambios.».
  - Fuera las frases largas de lo que puede y no puede hacer.
- Los avisos siguen diciendo lo que pasa en lenguaje normal («Eric te ha dado permiso para editar el viaje a Roma»).

## 4b. Cada aviso nuevo, también arriba y con sonido
- Eric cambió el permiso de la otra cuenta a «Editar»: le llegó a la campana, pero **no salió la franja de arriba**. La franja oscura que sale un par de segundos y se va sola (como la de Design 11, más abajo) tiene que salir con **cualquier aviso nuevo** que llegue mientras la app está abierta: permisos, propuestas, gastos, cambios del viaje, entradas, sorteo… Y además, siempre, en la campana.
- **Con el sonido de la campanita** al llegar cada aviso nuevo, para que se note. Un sonido corto y suave, el mismo para todos. Respeta el ajuste «Sonido de los momentos» de Ajustes (apagado, sin sonido). Ojo: en el iPhone, la web solo puede sonar si el viajero ya ha tocado la pantalla alguna vez desde que la abrió; si no puede, que no falle nada. La vibración no funciona en Safari del iPhone: no la uses.
- Si llegan varios a la vez, una sola franja («3 avisos nuevos») y un solo sonido.
- **La franja, exactamente como en Design «11 · La franja de aviso nuevo»** (`Piezas/Avisos Franja`: 01 una de cada tipo, 02 varios a la vez, 03 encima de DÍAS). Oscura, con la moneda dorada delante y dos líneas:
  - **arriba, corto y en negrita, lo que ha pasado** («Eric ha añadido un sitio», «Ana ha añadido un gasto», «Laura te ha mandado una propuesta»); **debajo, el detalle** («Fontana di Trevi · sábado 14», «Cena en Trastevere · 84 €», «3 cambios»). Así que cada aviso tiene su título corto y su detalle para la franja, y su frase entera para la campana (apartado 4b2);
  - **el icono:** si lo ha hecho una persona, **su inicial en la moneda dorada** (o su foto, si tiene); si avisa la app, su icono dorado en un círculo oscuro con borde dorado. **Ojo, en la pieza de Design están cruzados:** el calendario va con «Mañana empieza tu viaje» (fecha especial) y la «i» con «El martes 10 cierran los Museos Vaticanos» (información). La estrella, para el sorteo; el ticket, para las entradas que avisa la app;
  - **varios a la vez (02):** una sola franja con las monedas de quien los ha hecho, una encima de otra, «3 avisos nuevos», debajo los nombres («Eric, Ana y Laura») y [Ver] a la derecha, que abre la campana;
  - **al tocar una franja,** abre lo que sea (como tocar el aviso en la campana) y lo marca como leído; deslizándola hacia arriba, se va antes de tiempo;
  - que no tape la barra de arriba del iPhone (la hora y la batería), como en la 03.
- **La franja ya existe:** al aceptar Eric una propuesta, en el otro teléfono salió bien («Eric ha aceptado…»). Usa esa misma pieza para todos los avisos, sobre todo los del grupo (la ruta, los permisos, las propuestas, los gastos, quitar o salir). **La franja y la campana, a la vez**, con el mismo aviso y **un solo sonido** (no uno por cada una).

## 4b2. Los textos de todos los avisos, con frases que se entiendan
- **Una sola regla para todos los avisos** (la campana, la franja y los avisos al móvil): frases cortas, coherentes y en español normal, como las diría una persona. Con artículo («la Fontana di Trevi», «los Museos Capitolinos»), en plural cuando toca («cierran»), con el día bien dicho («el sábado 14») y diciendo **lo que ha decidido la persona**, no la lista de lo que la app ha movido por detrás (eso, en la 10N5).
- Repasa uno a uno todos los textos de avisos que hay (los de la 10M, 10N, 10N2, 10P…) y ponlos en una lista en el informe, con el antes y el después, para que Eric los revise.

## 4c. Añadir un sitio: el aviso de que cierra, más sencillo
- En «¿A qué día lo añadimos?», cuando el día elegido cierra, hoy sale un recuadro con «El miércoles 11 los Museos Capitolinos cierra. ¿Lo ponemos el jueves 12?» y los botones [Ponerlo el jueves 12] [Dejarlo el miércoles 11 igual]. Sobra: los días ya están arriba para elegir.
- **Que sea solo un aviso, en rojo, sin botones, debajo de la lista, y solo cuando el viajero toca un día que cierra:** «El miércoles 11 cierran los Museos Capitolinos.» El viajero elige otro día de la lista, o lo deja; nunca se le niega nada.
- **La lista de días, igual para todos los días:** sin etiquetas ni marcas en el que cierra. Todos se pueden elegir.
- Ojo con la concordancia: «los Museos Capitolinos cierran», «la Galería Borghese cierra» (con su artículo y en plural cuando toca, como en el apartado de los avisos de la 10N3).

## 4d. Las entradas en la ficha y en DÍAS, como en `Piezas/Ficha Cabecera` y `Piezas/Parada Entrada`
- **Design:** del zip «APP_RUTAS.zip» (apartado 0): `Piezas/Ficha Cabecera` y `Piezas/Parada Entrada`, nuevas, y los cambios de «App Explorar y fichas» y «App Ruta y días».
- **La regla de los tres colores (Eric, 26-oct), en toda la app:**
  - **frambuesa:** te falta (no tienes entrada y nadie del grupo te la ha comprado);
  - **verde:** ya lo tienes (tu entrada, «Reservada ✓», tu Free Tour, tu excursión);
  - **azul oscuro con dorado:** otro del grupo ya la tiene y te queda elegir lo tuyo («Eric la tiene para el jueves 12 · 11:45»).
  Dime dónde lo has cambiado.
- **La cabecera de la ficha (Ficha Cabecera 01 y 02):** la foto con la cámara, el nombre, las pastillas del horario y la duración, y a la derecha **el corazón con el número** («93»), en lugar de «93 lo recomiendan». Al tocarlo, se llena en frambuesa y sube a 94 (lo recomiendas tú); al volver a tocarlo, se quita.
- **La pestaña Entradas, con lo tuyo arriba del todo, encima de todo lo demás** (para que en un móvil pequeño se vea nada más entrar):
  - **03 · otro del grupo la tiene y tú no:** el recuadro en azul oscuro con dorado, «Eric la tiene para el jueves 12 · 11:45» (el día y la hora en dorado), [Reservar la mía a la misma hora] y «¿Ya la tienes? Ya la tengo»;
  - **04 · ya tienes la tuya:** el recuadro **verde** con ✓, «Tu entrada», la hora en grande, «Museos Capitolinos · jueves 12», y [Cambiar hora] y [Ver entrada] (el de «Ver entrada» en azul oscuro). **Fuera la etiqueta «Fijada»** que sale hoy.
  - Debajo, las entradas para comprar, como hasta ahora (o como en la 10T cuando llegue).
- **La tarjeta de la parada en DÍAS (Parada Entrada):** fuera la etiqueta larga «Comprar entrada» que tapaba las de la tarjeta. En su lugar, **el botón redondo con el icono de la entrada**, abajo a la derecha, que nunca tapa las etiquetas (04, con etiquetas largas):
  - en **frambuesa** si no la tienes, con **un numerito** cuando alguien del grupo ya la tiene (02: «1», 03: «2»: cuántos del viaje la tienen);
  - en **verde con un ✓** si ya tienes la tuya: el mismo botón redondo, en verde, con el icono de la entrada, y el ✓ verde en un circulito blanco arriba a la derecha (en el mismo sitio que el numerito), como en la captura de Design que pasó Eric. **Fuera la pastilla «Reservada ✓»** de la tarjeta: en el móvil de Eric ya se come las etiquetas;
  - **nunca palabras en la tarjeta** («Reservada», «Comprar entrada»…): solo el botón con su color. Para el dueño también, no solo para el invitado.
  - al tocarlo, la ficha abierta en la pestaña Entradas.
  - **Las etiquetas nunca pasan por debajo del botón:** en la captura de Design, «Monumento» queda cortada por el botón. Si no caben al lado, bajan a otra línea; nunca cortadas ni tapadas.
- Se actualizó solo en el otro teléfono cuando el dueño añadió la entrada: eso está bien.

## 5. La prueba
- La batería rápida y `pruebaJutrip`. Si algo falla solo al correr con las demás y solo pasa, dilo y sigue (se arregla en la 10S).
- Añade a `pruebaTanda10N`: el lápiz y los logros visibles en cada pantalla (EXPLORAR a pantalla completa, una ficha, RESERVAS, el presupuesto, HOY) y debajo de una hoja abierta; la pastilla del pase sin parpadeo (nunca «comprado» antes de saberlo); la campana sin la etiqueta «Leído», abrirla no marca todo, tocar un aviso lo abre y lo marca leído; [Seleccionar] con los circulitos, «Seleccionar todos», la hoja desde abajo con las tarjetas «Marcar como leído» (y «no leído») y «Eliminar» en rojo, con el mismo formato que los demás menús, «2 avisos eliminados» con [Deshacer]; una letra en toda la app (el calendario de las fechas también); los avisos del viaje abierto; la franja con su icono por tipo; los textos de los avisos, coherentes; «Mañana empieza…» solo el día antes; la franja de Design 11 (título y detalle, la inicial o el icono bien puesto, «3 avisos nuevos» con las monedas y [Ver], tocarla y deslizarla); los menús de opciones como en Design (la parada, el día, las personas, la persona, el permiso y los demás de la app), con su icono, su línea, la que no se puede en gris y la de quitar la última en rojo; «Añadir una excursión» solo donde cabe; los nombres cortos de los permisos; la franja de arriba y el sonido con cada aviso nuevo (y sin sonido con el ajuste apagado); el aviso rojo sin botones al tocar un día que cierra (y la lista sin marcas) y la concordancia; la cabecera de la ficha con el corazón; la pestaña Entradas con «Eric la tiene…» (azul y dorado) y «Tu entrada» (verde, sin «Fijada») arriba del todo; el botón de la entrada en DÍAS (frambuesa con numerito, verde si es tuya) sin tapar nada; los tres colores en toda la app.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N4.html`, a tamaño de móvil.

## 6. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N4». Di de dónde salían «Sobre tu ruta» y «Mañana empieza tu viaje».

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N4.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
