Hola. TANDA 10N · TANDA RUTA: LOS ARREGLOS DEL REPASO DE ERIC (la cabecera, el modo sin pase, compartir el viaje con sus permisos, la propuesta del invitado y el presupuesto compartido). Si estás con otra tanda (la 10P), acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N.md e inclúyelo en tu commit.
- **Design, nuevo:** Eric ha dejado en la carpeta del proyecto el zip «DESIGN_26OCT.zip» (lleva todo lo de «NUEVA_TANDA_1.zip» de la 10P, lo de esta tanda, lo de la 10N2 y lo de la 10Q). Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`) e inclúyelo en tu commit. Lo de esta tanda:
  - **la propuesta de cambios:** `Piezas/Propuesta Cambios` y `Piezas/Propuesta Boton`, montadas en «App Ruta y días» (apartado 6);
  - **las personas del viaje y sus permisos:** `Piezas/Viaje Compartido` (nueva), montada en «App Ruta y días» (apartados 4 y 4a);
  - **«¿Para quién es?» en Reservas:** `Piezas/Reservas v4` (apartado 8);
  - **el presupuesto compartido:** `Piezas/Presupuesto Compartido`, montada en «App Reservas y presupuesto», con sus diez pantallas, de la 01 a la 10 (apartado 9).
  - (`Piezas/Cuentas Grupo` es de la 10N2 y `Piezas/Pase Fundador` de la 10Q: no las toques ahora.)
  Míralas enteras antes de tocar nada.
- Todo esto sale del repaso de la app que Eric ha hecho el 25-oct en su iPhone, desde cero y sin pase, y de una prueba con dos teléfonos (un viaje compartido entre dos cuentas).

## 1. Crear el viaje
- En «Elige lo que siempre soñaste ver en Roma», la foto del **Castillo de Sant'Angelo** es la de la terraza. Cámbiala por una en la que se vean **el castillo y el puente** (Ponte Sant'Angelo), con licencia libre, como las demás. Apunta la fuente.

## 2. La cabecera de arriba
- Arriba a la izquierda, donde ahora pone «Roma / 26 – 29 nov · 2 personas»: fuera. En su lugar, **el logo de JUTRIP** (la palabra en Italiana con la estrella sobre la I, como en la pantalla de inicio), a su tamaño, con los colores de Marca JUTRIP. La fecha ya sale en el centro del mapa y en cada pestaña.
- La misma cabecera en todas las pestañas: el logo, la cartera, la campana y el perfil. La etiqueta «Sin pase (prueba)» sigue donde está.
- Dime dónde más se ve el número de personas del viaje, para que no se pierda (lo necesita el pase Dúo y Grupo).
- **El invitado** tiene que seguir viendo que el viaje es de otro: «Viaje de Eric» pasa a la tarjeta del destino de RUTA, debajo de «Roma» (el nombre, el de quien comparte).

## 3. El modo sin pase y [Empezar de cero]
- **[Empezar de cero] apaga «Verme como viajero sin pase»** (borra `admin_sin_pase`). Que no lo toque: es un ajuste de las pruebas, no algo de la cuenta.
- **Después de [Empezar de cero], RUTA enseñaba la pastilla «✓ Pase de Roma»** (con pase) y HOY la tarjeta cerrada con el candado: las dos pantallas tienen que decir lo mismo. Dime de dónde le sale el pase a la cuenta de Eric después de [Empezar de cero] (¿Probador?) y que, con «sin pase» encendido, no salga en ningún sitio.
- **HOY antes del viaje, la tarjeta «Durante el viaje, Hoy te dará»** sigue con nombres viejos («Tu día, paso a paso · Visto, No me da tiempo y Más visitas», «Escuchar su historia»…). Que salga de la misma lista que el final de la película (en la 10I solo cambió «Con el pase tendrás»). Busca cualquier otra lista del pase que quede escrita aparte y pásala a la misma.

## 4. Compartir el viaje (`HojaInvitar.tsx`)
- Título: **«Invita a los tuyos a tu viaje a Roma»** («Roma», del dato).
- Debajo del título: **«Tus acompañantes verán tu ruta y podrán proponerte cambios.»**
- En el recuadro del código, en vez de «Cada persona que entra con el código ocupa una plaza.»: **«Invita hasta 10 personas con este código.»** (confirma que son 10). Con un Pase Dúo o Grupo se queda lo de ahora («1 de 2 plazas del pase usadas»).
- **El mismo código para el mismo viaje.** Hoy, sin pase, cada vez que se abre la hoja se crea una invitación nueva (`crearInvitacion` con `usos: 10`) y sale un código distinto. Que reutilice la que ya tiene ese viaje y solo cree otra si la de antes se ha gastado o se ha anulado. Los códigos que ya se crearon siguen valiendo.

## 4a. Las personas del viaje y sus permisos, como en `Piezas/Viaje Compartido` (Eric, 26-oct)
- **Los tres permisos de un viaje compartido:**
  - **Administrador** (quien crea el viaje): todo. Es **el único** que invita, quita gente, cambia permisos, cambia las fechas, el vuelo o el alojamiento, y borra el viaje.
  - **Puede editar:** toca la ruta **directamente**, como el administrador (DÍAS, EXPLORAR, añadir, mover, quitar), sin propuesta; y **acepta o rechaza las propuestas y los gastos [Para todos]** de los demás, como el administrador. No puede invitar, quitar gente, cambiar permisos, ni cambiar fechas, vuelo o alojamiento (en RESERVAS lo ve en gris, como el invitado), ni borrar el viaje.
  - **Solo recomendar:** es el invitado de los apartados 6 a 9: propone, y sus gastos [Para todos] esperan a que los acepten.
  - **Al entrar en el viaje, todos empiezan con «Solo recomendar».** El administrador sube a quien quiera.
- **La tarjeta del viaje en RUTA (arriba de la pieza):**
  - **sin compartir:** fuera el icono suelto de compartir; en su lugar, el botón **[Compartir]** en champán, con su texto, junto a la pastilla del pase;
  - **ya compartido:** en ese sitio, las caras de las personas (las iniciales en círculo) con el número y la flechita («E A L M 4 ›»). Al tocarlo, «Personas del viaje».
  - **los invitados (Puede editar y Solo recomendar) ven también las caras con el número**, en el mismo sitio, y al tocarlas su «Personas del viaje» (la 05: sin botones, con [Salir del viaje]). **Nunca el botón [Compartir]** ni [+ Invitar a alguien]: invitar es solo del administrador. Debajo de «Roma», «Viaje de Eric» (apartado 2).
- **01 · La hoja de invitar:** el enlace con [Copiar], el código, [Compartir el enlace] y, debajo, **«Personas del viaje · 4 ›»**, que abre la lista. (Los textos de la hoja, los del apartado 4.)
- **02 · «Personas del viaje»** (el administrador): cada persona con su permiso en una etiqueta (Administrador en azul oscuro, Puede editar en dorado claro, Solo recomendar en gris). Al tocar a alguien, se abre su fila con **[Cambiar permiso]** y **[Quitar del viaje]**. Abajo, [+ Invitar a alguien], que abre la hoja de invitar.
- **03 · «Permiso de Ana»:** la hoja desde abajo con los tres permisos, cada uno con su línea; «Administrador» en gris, con el candado y «Solo Eric»; el elegido en azul oscuro con su ✓; [Guardar permiso]. A quien le cambian el permiso le llega a la campana: «Eric te ha dado permiso para editar el viaje a Roma» (o «…ahora puedes recomendar cambios»).
- **04 · Quitar a alguien:** «¿Quitar a Luis del viaje a Roma?»; si tenía plaza del pase, el recuadro «Plaza del pase Grupo · 3 de 4 usadas» con su plaza vacía y «→ Vuelve a ti»; [Quitar a Luis] en rojo y [Cancelar].
  - **Al quitarlo:** deja de ver el viaje enseguida (si lo tiene abierto, en directo); **pierde su plaza del pase y la plaza vuelve a quien la compró**, para dársela a otro. Lo que ya ganó (logros, fundador, EXP) se lo queda. Si tenía una propuesta sin enviar, se borra; sus gastos [Para todos] ya aceptados se quedan en el presupuesto del grupo.
- **05 · Lo que ve un invitado:** la misma lista, sin botones, con «· Tú» en su fila, y abajo **[Salir del viaje]** (con su confirmación). Al salir, lo mismo que al quitarlo.
- **06 · El aviso a quien quitan:** en su campana, «Ya no formas parte del viaje a Roma». Sin más detalle.
- **El administrador no puede quitarse ni salir** (si quiere dejar el viaje, lo borra).

## 5. Abrir un enlace de invitación
- **Se cuela «Crear viaje»** (la pantalla de origen y destino con el mapa) durante 1-1,5 s dos veces: al abrir el enlace, antes de «Eric te invita a su viaje a Roma», y otra vez al tocar [Unirme], antes de entrar en el viaje. Con un enlace de invitación, que salga directamente «Eric te invita…» y, al unirse, directamente el viaje.
- **Al recargar, ya dentro del viaje, vuelve a salir un segundo «Eric te invita a su viaje a Roma».** Eric, como invitado ya unido, recargó la página y la vio antes de entrar en el viaje. Que, en cuanto se une, el código salga de la dirección de la página, y que si ya está dentro del viaje no salga nunca más la pantalla de la invitación (ni al recargar ni al volver a abrir el mismo enlace): directo al viaje.
- En «Eric te invita a su viaje a Roma» (que está muy bien), **el logo de JUTRIP, pequeño, arriba del todo y en el centro.**
- **Compartir un viaje sin Dúo ni Grupo nunca da el pase al invitado.** En la prueba de Eric, el invitado (bengala.ingresos, que también es administrador) entró con el pase. Compruébalo con una cuenta normal, que no sea de administrador.

## 6. El invitado propone cambios (el diseño de Design, `Propuesta Cambios` y `Propuesta Boton`)
- **Fuera el botón [Recomendar otra ruta]** y el «modo propuesta». El invitado cambia las cosas **directamente** en DÍAS o en EXPLORAR, como si la ruta fuera suya, y cada cambio va a su propuesta (nunca al viaje del dueño).
- **Todo lo que añade el invitado va a su propuesta, entre por donde entre (prueba de Eric, 25-oct).** Hoy, desde «+ Añadir parada» de un día en DÍAS (añadió la Galería Borghese) y desde EXPLORAR (añadió la Cúpula de San Pedro), sale «Añadido el jueves 26» con [Deshacer], como si fuera su ruta, y no sale nada de la propuesta: parece que el invitado cambia la ruta a su antojo. En el teléfono del dueño no apareció (bien: no se guarda), pero el invitado no lo sabe. Que:
  - desde «+ Añadir parada», desde EXPLORAR, desde la ficha de un sitio y desde cualquier otro sitio donde se pueda añadir, mover o quitar, el cambio del invitado vaya **siempre** a su propuesta, nunca al viaje;
  - el aviso diga lo que de verdad ha pasado: «Añadido a tu propuesta · jueves 26» (con [Deshacer], que lo quita de la propuesta), y que aparezca o suba el numerito del lápiz;
  - en la ruta del invitado, lo que ha añadido se vea marcado como propuesta (por ejemplo, con un borde de puntos y «Propuesta»), para que no lo confunda con la ruta de verdad.
- **El botón flotante:** el lápiz redondo con el numerito de cambios en oro, encima del botón de los logros (la versión A de Design). Solo aparece **después del primer cambio** (nunca «Aún sin cambios»), en todas las pestañas, sin tapar el botón de los logros ni la última parada de una lista (deja espacio al final de DÍAS y EXPLORAR). Fuera la barra de abajo «Tu propuesta · Ver · Enviar a Eric».
- **Al tocarlo, la hoja de la propuesta** de Design: «Tu propuesta · 5 cambios», la lista y [Enviar a Eric] siempre a mano abajo. Nunca se envía sin pasar por la lista.
- **La lista, un cambio por idea y en lenguaje normal.** Hoy salen los toques sueltos («Día 1 · Mover · Coliseo», «Quitar · Barrio Judío» y aparte «Añadir · Barrio Judío») y no se entiende nada. Los cinco tipos, como en Design:
  - **cambiar el orden en el mismo día** (paradas seguidas o no): «Día 1 · Jue 26 · Primero el Arco de Constantino y después el Coliseo», y debajo «Antes: Coliseo → Arco de Constantino»;
  - **mover a otro día**, en una sola línea (no un quitar y un añadir): «Barrio Judío: del jueves 26 al sábado 28, después del Trastevere»;
  - **quitar:** «Día 1 · Jue 26 · Quitar la Iglesia del Gesù»;
  - **añadir** (desde EXPLORAR o con «añadir parada»): «Día 3 · Sáb 28 · Añadir la Fontana di Trevi, después de Piazza Navona»;
  - cada uno con su icono y color (verde añadir, rojo quitar, oro mover o cambiar el orden), la flechita › y [Deshacer].
- **El detalle de cada cambio,** al tocar una línea, como en Design: [Antes] y [Ahora], el mapa pequeño del día con sus kilómetros, lo que cambia marcado («Movida», «Sale», «Entra», «Nueva»), y en un cambio de día, los dos días. Para Ana, [Deshacer este cambio]; para el dueño, [Rechazar] [Aceptar], y después «Aceptado ✓» o «Rechazado».
- **Dónde queda lo que se mueve de día.** Si el invitado lo arrastra a un sitio concreto, ese sitio. Si solo elige el día («Mover a»), donde menos hay que andar de más entre las paradas de al lado (como al añadir un sitio): nunca en medio de una visita larga; el Arco de Constantino en el día del Vaticano iría al empezar o al acabar el día. Dime dónde lo pone la app hoy (Eric cree que al final de la tarde) y cámbialo a esto. Usa la misma lógica que ya tiene la app al añadir un sitio; si para eso hay que tocar el motor, dímelo antes.
- **La propuesta, en tiempo real mientras no se envía:** siempre enseña cómo quedan las cosas al final, no cada paso. Si se mueve una parada y luego se vuelve a mover, la misma línea se actualiza; si vuelve a donde estaba, la línea desaparece. Al pulsar [Enviar a Eric] se queda fija; lo que cambie después empieza otra propuesta.
- **Quién acepta (apartado 4a):** el administrador y los que pueden editar. Si dos lo miran a la vez, vale lo que decida el primero; el otro lo ve ya decidido.
- **El dueño:** en la campana, «Ana te propone 5 cambios en tu viaje a Roma» (y a los que pueden editar, igual). Al tocarlo, la misma lista, con [Aceptar] [Rechazar] en cada cambio y [Aceptar todos] arriba. Al aceptar, el cambio se coloca justo donde decía; si el dueño ha cambiado ese día mientras tanto y ese sitio ya no existe, donde mejor encaje. Después, la lista se queda en la campana con «3 aceptados · 2 rechazados».
- **Lo que le llega al invitado:** «Eric ha aceptado 3 de tus 5 cambios», y al tocarlo, su lista con cuáles sí y cuáles no.
- **Durante el viaje, el invitado ya no propone (Eric, 25-oct).** Hasta el día antes del viaje puede proponer cambios, como arriba. Desde el primer día del viaje (con la hora del destino), lo único que deja de poder hacer es **cambiar la ruta** (mover, quitar o añadir paradas) y el lápiz no sale. Todo lo demás sigue igual: entra en DÍAS y ve la ruta, abre las fichas con sus pestañas (Resumen, Entradas, Tips), sus logros, HOY, RESERVAS (con sus entradas), las fotos…: durante el viaje, los botones flotantes son solo el de los logros (y, más adelante, el de reportar). Si el día antes tiene una propuesta sin enviar, un aviso en su campana: «Tienes 2 cambios sin enviar a Eric. Envíalos hoy, que mañana empieza el viaje.»

## 6a. EXPLORAR del invitado: le falta el Free Tour
- Con la cuenta del invitado, en EXPLORAR no sale el Free Tour (con la del dueño, sí). Sale solo si `freeTourAvailable(route)` (`FreeTourSheet.tsx`), que mira que la ruta tenga al menos dos días con `curatedId`: puede que al invitado le llegue la ruta sin esos datos. Mira por qué y que salga también para el invitado, igual que para el dueño (con su «lo recomiendan», su ficha y sus Entradas).
- Para el invitado, el Free Tour es de lo que paga cada uno: puede reservar el suyo; añadirlo a un día es un cambio de su propuesta, como cualquier sitio.

## 6b. Los tres puntitos de cada día en DÍAS
- **Para quien solo recomienda, fuera los tres puntitos del día.** Hoy tienen «Ver el día en el mapa» (es lo mismo que tocar el día) y «Recomendar cambios en este día» (abre la barra «Tu propuesta · Aún sin cambios», que ya no existe: ahora cambia las cosas directamente).
- **Para el administrador y quien puede editar se queda como está** (hoy solo sale «Eliminar día»).
- **Las rayitas para arrastrar los días (≡), con los permisos (apartado 4a):** el administrador y quien puede editar, sí (mueven los días directamente). **Quien solo recomienda, sin rayitas:** no mueve días enteros (sí puede proponer mover paradas). Dime qué pasaba hoy si un invitado cambiaba el orden de los días.

## 6c. Los menús de los tres puntitos, desde abajo (Eric, 25-oct)
- Hoy, en DÍAS, el menú de los tres puntitos de un día («Eliminar día») y de una parada («Eliminar», «Mover a»…), la confirmación «¿Seguro que quieres eliminar…? [Cancelar] [Sí, eliminar]» y la lista de «Mover a» salen como cuadritos flotantes encima del día o de la parada, con un borde negro grueso.
- Que salgan **todos desde abajo, como hoja con el tirador arriba y una ✕ para cerrar**, como el resto de hojas de la app (la pieza `Hoja` que ya existe), bien ordenados y con el mismo estilo que tienen ahora. Se cierran con la ✕, deslizando hacia abajo o tocando fuera.
- Arriba de la hoja, el nombre de lo que se toca («Iglesia del Gesù», «Jueves 26 · Roma antigua y Centro histórico»), para que se sepa sobre qué es.
- **La hoja, baja: que no ocupe media pantalla** (como la del aviso «Ese día (28 nov) el Foro Romano abre a las 9:00…», que es la referencia de Eric).
  - Las opciones (Eliminar, Mover a otro día…), una debajo de otra, como en el iPhone.
  - **Elegir un día en «Mover a»: con una ruedita, como al elegir la hora en el iPhone** (se desliza arriba y abajo y el elegido queda en el centro), con «Ahora: jueves 26» arriba y [Mover aquí] debajo. Así la hoja no crece aunque el viaje tenga muchos días.
- En toda la app: cualquier otro menú de tres puntitos que salga en medio de la pantalla, igual.

## 7. DÍAS: fuera «Cambiar hora»
- Quita «Cambiar hora» de las opciones de cada parada (los tres puntitos), para todos, no solo para el invitado. La app ya no enseña horas, y cambiar la hora no mueve nada: el orden lo decide el viajero colocando las paradas. Lo que tiene hora de verdad (una entrada reservada) va en RESERVAS. Los demás menús de edición se quedan como están.

## 8. RESERVAS del invitado: la misma pantalla que la del dueño, sin poder tocar
- Hoy el invitado ve una pantalla aparte, más pobre («Esto es lo que ha reservado Eric. Aquí solo se mira.», con listas de puntitos: «Ida · jue 26», «Sin alojamiento puesto»…). Eric quiere que vea **exactamente la misma pantalla de RESERVAS que el dueño**: los mismos bloques (Llegada y vuelta, Alojamiento, Entradas y Free Tour…), con su diseño y sus «Falta» / «Listo».
- **Donde hay un dato, sale el dato** (el vuelo, la zona del alojamiento, la entrada con su día y hora), igual que lo ve el dueño.
- **Los campos para rellenar y los botones de editar, en gris y sin poder tocarlos** (añadir el vuelo, elegir zona, la dirección, cambiar la hora…). Al tocarlos, no pasa nada (o, como mucho, una línea corta: «Esto lo cambia Eric»).
- Fuera «Esto es lo que ha reservado Eric. Aquí solo se mira.»: el gris ya lo dice.
- **La regla (Eric, 25-oct): lo que comparte el grupo, en gris; lo que paga cada uno, cada uno lo suyo.**
  - **Llegada y vuelta: en gris.** La ruta se ajusta al vuelo del dueño; el invitado lo ve para saber a qué hora llega el grupo.
  - **Alojamiento: en gris** si el dueño ya lo ha puesto (el invitado ve dónde duermen). Si el dueño aún no tiene, [Buscar alojamiento] activo para el invitado (puede buscar y mandarle la idea), pero guardarlo en el viaje solo lo puede hacer el dueño.
  - **Entradas, Free Tour y excursiones: activos.** Cada persona necesita su entrada y la puede comprar desde JUTRIP. Si el dueño ya tiene entrada para ese sitio, que salga su día y su hora, y el botón diga **[Reservar la mía a la misma hora]** (con ese día y esa hora ya elegidos al abrir la compra), para que vayan juntos.
  - **Entradas que el dueño compra para varios (Eric, 25-oct).** Solo en un viaje compartido (sin invitados, nada de esto sale):
    - **Al añadir una reserva**, en el mismo formulario, un campo más: **«¿Para quién es?»**, con los nombres de las personas del viaje para marcar (el dueño ya marcado). Ejemplo: 4 personas y una entrada para 2: marca a Eric y a Ana; Luis y Marta, no. Si el viaje se comparte después, sus reservas cuentan como «solo para mí», y el dueño puede editarlas para marcar a los demás.
    - **Dónde y cómo (Eric, 25-oct):** en el formulario de la entrada, después de la ruedita de la hora y «Recuerda revisar la disponibilidad…», y antes del precio: «**¿Para quién es?** · 2 de 4» y debajo una pastilla por persona del viaje con su nombre ([✓ Eric] [✓ Ana] [Luis] [Marta]), del mismo estilo que las de los días: la marcada, en oscuro con su ✓; si no caben, bajan a otra fila. Que quede bonito y bien ordenado, como en `Piezas/Reservas v4`. Sin compartir, el formulario se queda como ahora.
    - **El botón [Guardar · …] del formulario, en champán**, como los demás botones principales (en Design sale en azul oscuro).
    - **En todo el formulario, más espacio entre secciones** (el día, la hora, para quién, el precio), para que se distinga bien cada una.
    - **Fuera «Lo que pagaste en total, todas las personas.»** debajo de «Precio (opcional)». (El precio sigue siendo el total de esa reserva; si el presupuesto lo reparte por persona, que use las personas marcadas.)
    - **La ruta es una:** la parada pasa al día y la hora de esa reserva para todos.
    - **En DÍAS, la etiqueta de la parada, corta (sin textos largos):** para los que están incluidos, **«Reservada ✓»** (en verde); para los que no, la de siempre, en frambuesa, **«Comprar entrada»**. El detalle va en la ficha (pestaña Entradas: «Eric va el jueves 26 a las 8:00») y en la campana.
    - **En la campana de cada invitado:** si está incluido, «Eric ha reservado el Coliseo para ti: jueves 26, 8:00.»; si no, «Eric ha reservado el Coliseo el jueves 26 a las 8:00.» con **[Reservar la mía a la misma hora]** (con ese día y esa hora ya elegidos al abrir la compra) y **[Ya la tengo]** (para añadir la que le hayan comprado o reenviado).
    - Al leerlo, deja de contar en la campana y se queda en la lista, como todos los avisos.
  - Lo que compre el invitado es suyo: sale en su RESERVAS (no en la del dueño). La ruta sigue siendo la del dueño: si su entrada no cuadra con el día o la hora de esa parada en la ruta, se le avisa («Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26»), y puede proponer el cambio.

## 9. El presupuesto de un viaje compartido, como en `Piezas/Presupuesto Compartido` (01 a 10)
- Hoy el invitado no entiende nada en el presupuesto. El diseño, tal cual Design, con Eric (dueño) y Ana (invitada):
  - **01 · el de Ana:** la misma pantalla que la del dueño, con «de Eric» arriba; arriba, «Del grupo · 600 € · 300 € por persona» (con el ojo para enseñarlo u ocultarlo); en Extras, cada gasto con «Pagó Eric · Para todos», su gasto pendiente en amarillo con «Pendiente de Eric» y los suyos con el ojo tachado y «Solo para ti»; [+ Añadir gasto].
  - **02 · el de Eric:** igual, con «Eric y Ana» arriba y sus gastos «Solo para ti».
  - **03 · Ana añade [Para todos]:** la hoja desde abajo con el nombre, el precio, [Para todos] [Para mí], la línea «Se lo enviamos a Eric», «¿Quién lo ha pagado?» con una pastilla por persona (quien lo añade, ya marcado) y [Enviar a Eric]. Queda «Pendiente de Eric».
  - **04 · Ana añade [Para mí]:** «Solo lo ves tú», sin «¿Quién lo ha pagado?», y [Añadir gasto]: entra directo y solo lo ve ella.
  - **05 · Eric añade [Para todos]:** «Entra directo en el presupuesto», con «¿Quién lo ha pagado?», sin pasar por nadie. Eric también tiene [Para mí].
  - **06, 07 y 08 · la campana de Eric:** el aviso «Ana quiere añadir al presupuesto», con el gasto dentro («Cena día 1 · Para todos · pagó Ana · 30 €») y **[Rechazar] [Aceptar] dentro del mismo aviso**, en la campana. Después, en ese aviso, «✓ Aceptado · suma al grupo» o «Rechazado». Se queda en la lista, como todos los avisos.
  - **09 · Ana, después de aceptar:** el gasto pasa a «Pagó Ana · Para todos», marcado en verde un momento, y suben el total y el «por persona».
  - **10 · Ana, después de rechazar:** el gasto **se le queda a ella como suyo**: «Eric prefirió no sumarlo · ahora solo para ti».
  - **El aviso a Ana (Eric, 26-oct): siempre en su campana** («Eric ha aceptado tu gasto · Cena día 1 · 30 € · ya suma en el grupo» o «Eric ha preferido no sumar tu gasto · Cena día 1 · 30 € · se queda solo para ti»). **Y además, si en ese momento tiene la app abierta,** la franja de arriba de 09 y 10, que se va sola, y el cambio en directo.
- **Con los permisos (apartado 4a):** los gastos [Para todos] de quien puede editar entran directos, como los del administrador; los de «Solo recomendar» esperan, y los aceptan el administrador o los que pueden editar (a todos ellos les llega el aviso; vale lo que decida el primero).
- **«¿Quién lo ha pagado?»:** se guarda. «¿Entre quién?» y la pantalla de quién le debe a quién llegan en la tanda siguiente, la 10N2.
- **El «por persona»:** solo de los gastos del grupo ([Para todos] y lo reservado para todos), nunca de los [Para mí] de cada uno. Sin compartir, como ahora.
- **Extras, en nuestro azul de Extras** (como en `Presupuesto Compartido`; en `Piezas/Presupuesto` Design lo había puesto en dorado: ese no), con el icono de la cartera en el apartado y en cada gasto.
- **Los precios, «334 €»**, con el símbolo detrás, como en el resto de la app (en `Piezas/Presupuesto` sale «€334»: ese no).
- Sin compartir, el presupuesto se queda como ahora (sin [Para todos] / [Para mí] ni «¿Quién lo ha pagado?»).

## 10. Los cambios del dueño, en directo para los invitados
Eric lo ha probado con dos teléfonos: si el dueño cambia el viaje (por ejemplo, de 4 días a 2), el invitado lo ve al volver a abrir la app, porque es el mismo viaje. Pero el invitado no sabe que algo ha cambiado. Que:
- **Con la app abierta, el cambio le llegue solo, en directo** (por ejemplo, con Realtime de Supabase escuchando su viaje), sin recargar. Arriba, una línea corta: «Eric ha cambiado el viaje.»
- **Siempre, un aviso en su campana** con lo que ha cambiado, en lenguaje normal: «Eric ha cambiado el viaje: ha quitado 2 días.», «…ha añadido la Fontana di Trevi al sábado 28», «…ha cambiado las fechas». Si son muchos cambios seguidos, uno solo que los junte. Al tocarlo, le lleva a la ruta ya cambiada.
- **Con la app cerrada,** al abrirla carga siempre el viaje de ahora (como ya hace), y el aviso le espera en la campana.
- El invitado nunca tiene que recargar ni volver a abrir el enlace. Volver a compartir solo sirve para invitar a alguien nuevo.
- Si el invitado tiene una propuesta a medias y el dueño cambia ese mismo día, la propuesta se ajusta (un cambio que ya no tiene sentido, como mover una parada que el dueño ha quitado, sale marcado y se puede quitar).
- Lo mismo al revés: cuando el dueño acepta una propuesta, el invitado ve la ruta cambiada en directo.
- **Lo mismo con quien puede editar (apartado 4a):** sus cambios en la ruta les llegan en directo a todos (también al administrador), con su aviso: «Luis ha cambiado el viaje: ha añadido la Fontana di Trevi al sábado 28».

## 11. Elegir una cosa u otra: el mismo estilo en toda la app (Eric, 26-oct)
- El estilo de [Para todos] [Para mí] y de las pastillas de «¿Quién lo ha pagado?» de `Presupuesto Compartido` (03, 04 y 05): **lo elegido, en el azul oscuro de la marca (#1C2230) con el texto claro y el icono en oro; lo no elegido, en blanco con su borde fino.** A Eric le encanta con el dorado.
- **En toda la app,** en todo lo que sea elegir una cosa u otra: los interruptores de dos o más opciones y las pastillas. Entre ellos:
  - **[Recomendados] [Cerca de ti] de EXPLORAR** (hoy, marfil con el texto en oro: cambian a este);
  - «¿Para quién es?» de Reservas y «¿Quién lo ha pagado?» del presupuesto;
  - y cualquier otro que encuentres (dime cuáles has cambiado).
- Las listas de una hoja donde se elige una fila (la «Moneda» del pase, «Elige tu título»…) se quedan con su borde de oro, como en Design.

## 12. La prueba
- La batería rápida y `pruebaJutrip`. Si `pruebaJutrip`, `pruebaTanda10B`, `pruebaRevisionLargos` o `pruebaTanda10F` fallan solo al correr con las demás y solas pasan, dilo y sigue: se arreglan más adelante.
- Prueba nueva `pruebaTanda10N`:
  - la cabecera con el logo, en todas las pestañas;
  - [Empezar de cero] deja «sin pase» como estaba; con «sin pase», RUTA y HOY sin pase; la tarjeta de HOY con la misma lista que la película;
  - la hoja de compartir con sus textos y el mismo código dos veces seguidas;
  - la tarjeta de RUTA con [Compartir] y, ya compartido, las caras con el número; «Personas del viaje» de la 01 a la 06: los tres permisos, todos empiezan con «Solo recomendar», cambiar un permiso (con su aviso), quitar a alguien (deja de ver el viaje, su plaza vuelve a quien la compró, su aviso), [Salir del viaje], y el administrador no puede salir;
  - «Puede editar»: cambia la ruta directo y los demás lo ven en directo; acepta propuestas y gastos; no puede invitar, quitar, cambiar permisos, fechas, vuelo ni alojamiento;
  - abrir una invitación no pasa por «Crear viaje»; ya unido, recargar o volver a abrir el enlace va directo al viaje, sin la pantalla de la invitación; un invitado con una cuenta normal y sin Dúo ni Grupo no tiene el pase;
  - la propuesta: cada tipo de cambio sale en una línea con su texto; mover dos veces actualiza la misma línea y devolverlo la quita; mover de día con «Mover a» lo pone donde dice; el dueño acepta uno, rechaza otro y [Aceptar todos]; lo aceptado sale en las dos rutas; lo que le llega al invitado;
  - «Cambiar hora» ya no está;
  - el invitado ve el Free Tour en EXPLORAR, como el dueño;
  - el invitado añade un sitio desde «+ Añadir parada» y otro desde EXPLORAR: los dos van a su propuesta («Añadido a tu propuesta»), el lápiz cuenta 2, y el viaje del dueño no cambia hasta que acepta;
  - RESERVAS del invitado es la misma pantalla que la del dueño, con los datos y lo de rellenar en gris y sin poder tocarlo; las entradas, activas;
  - el presupuesto, de la 01 a la 10: el invitado añade «Cena día 1 · 30 €» [Para todos]: le sale «Pendiente de Eric» y al dueño le llega a la campana con [Aceptar] [Rechazar] dentro; al aceptar, suma al grupo para los dos; al rechazar, se le queda «solo para ti»; el aviso a Ana, siempre en la campana, y además arriba si tiene la app abierta; un gasto [Para mí] no pasa por el dueño y solo lo ve quien lo añade; el «por persona», solo de lo del grupo; Extras en azul; los precios con «€» detrás;
  - el estilo de elegir: [Recomendados] [Cerca de ti], [Para todos] [Para mí] y las pastillas de personas, con lo elegido en el azul oscuro;
  - el botón [Guardar] de Reservas, en champán;
  - el dueño añade una entrada del Coliseo para 2 en un viaje de 4: los 2 incluidos ven «Reservada ✓» y su aviso; los otros 2, «Comprar entrada», su aviso con [Reservar la mía a la misma hora] y [Ya la tengo]; en un viaje sin compartir no sale «¿Para quién es?»;
  - el dueño quita un día y el invitado, con la app abierta, lo ve sin recargar, con su aviso en la campana; con la app cerrada, al abrirla; una propuesta a medias sobre una parada que el dueño ha quitado sale marcada.
- Capturas en `docs/dias/capturas_jutrip/` de cada cosa, y una página `docs/dias/REPASO_10N.html`, a tamaño de móvil, para que Eric lo revise en su teléfono.

## 13. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N». Di qué no se ha podido hacer igual que en Design.

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden (cada viñeta, no solo los apartados), cada uno con:
- **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué);
- **dónde lo mira Eric en el móvil** (la pestaña y los toques: «RUTA › Compartir»), y con qué cuenta o en qué modo (dueño o invitado, con pase o sin pase);
- su captura, si la tiene.
La misma lista, arriba del todo de la página de repaso (`REPASO_10N.html`), con una casilla en cada punto para que Eric la vaya marcando en su teléfono mientras lo comprueba.


Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
