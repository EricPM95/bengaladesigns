# Excursiones: botón flotante, página propia y «¿Dónde la ponemos?»

Va **después** del archivo de trabajo del 1 de octubre (PARA_CODE_TODO_2026-10-01). Commit por parte y sin push. Comprueba cada parte a 390 px (móvil), con capturas.

Vale para **todos los destinos**: nada de textos ni datos de Roma metidos en el código; `{destino}` y los datos de las excursiones salen de cada destino. A INVARIANTES lo que lleve esa marca.

Lo de las **reservas** (saber que alguien ha reservado y colocar la excursión sola, o subir la confirmación) **no va aquí**: llegará en otro prompt cuando lo cerremos.

**Regla de textos (a INVARIANTES, todos los destinos):** lo que lee el viajero nunca nombra a las empresas con las que trabajamos (ni el proveedor de excursiones, ni el de alojamiento, ni ninguna otra). Se usan palabras directas: «tu reserva», «Reservar», «Cancela primero tu reserva». Revisa los textos que ya hay en la app y cambia los que las nombren; dime cuáles eran.

## 1. El botón flotante de excursiones

- Un botón redondo flotante con el icono del autobús, **abajo a la derecha, justo encima de la barra flotante oscura**, como el antiguo botón flotante del mapa, en la pestaña Días.
  - 58 × 58 px, fondo crema, borde e icono terracota, sombra suave. Su `aria-label`: «Excursiones desde {destino}».
  - Por encima de la lista de días, nunca tapado por la barra ni por los menús.
  - **Quieto:** sin animación.
- **Cuándo sale:** solo en los viajes con los días suficientes para que una excursión merezca la pena en ese destino. Es un dato de cada destino (por ejemplo `excursiones_desde_dias`; en Roma, **4**). En Roma sale en los viajes de 4 días o más, y en los de 1 a 3 no.
  - Si el viaje ya trae un día de excursión (los de 5 días o más), el botón sigue: desde ahí se cambia fácil una excursión por otra.
  - Si el destino no tiene excursiones, no sale nunca.
- **Al tocarlo,** abre la página de excursiones (punto 2).
- **Quita** el enlace pequeño «¿Prefieres una excursión este día?» del final del día: lo sustituye este botón.
- **A INVARIANTES:** «Las excursiones se abren siempre desde el botón flotante del autobús, en todos los destinos, a partir de los días que marca cada destino».

## 2. La página de excursiones

Una pantalla completa, con el mismo formato en todos los destinos, sin menús ni barra flotante detrás y con su cruz arriba (la regla de las ventanas del repaso 5). **Sin mapa.** No hay ninguna ventana antes: el botón del autobús abre directamente esta página.

- **Arriba:** «UN DÍA FUERA» en letra pequeña y el título «Excursiones desde {destino}».
- **Debajo, la franja que vende** (oscura, esquinas redondeadas):
  - a la izquierda, grande y en terracota, **la valoración media en %**, con «VALORACIÓN MEDIA» debajo en letra pequeña. Se calcula sola: la nota media de todas las excursiones del destino en Civitatis, pasada a % (9,3 sobre 10 = 93 %). Nunca un número escrito a mano;
  - a la derecha: «Así valoran los viajeros las excursiones desde {destino}. Te recogen en la ciudad y vuelves para cenar.»;
  - debajo, en letra pequeña: «MEDIA DE {n} EXCURSIONES · {total de opiniones} OPINIONES DE VIAJEROS».
  - Si todavía no hay notas reales (antes de la API, o con precios provisionales), la franja sale solo con el texto, sin el % ni la línea de abajo.
- **Debajo, todas las excursiones**, sin filtros (ni «medio día» ni «día entero»). Cada tarjeta:
  - la foto;
  - el nombre;
  - si Civitatis la marca como la más vendida del destino, una etiqueta pequeña: «LA MÁS RESERVADA DESDE {DESTINO}» (solo con ese dato real);
  - una línea con «Día entero» o «Medio día», la duración y cómo se va (recogida en {destino}, tren desde…);
  - la nota y las opiniones (con la regla de siempre: si el precio es provisional, sin nota ni opiniones);
  - «desde {precio}» (las excursiones sí llevan precio);
  - dos botones: «Reservar» (el enlace de afiliado, como hoy) y «Añadir a mi viaje» (punto 3).
- Hasta que llegue la API, la página usa las excursiones que ya tenemos en los datos de cada destino. Déjala lista para que, cuando llegue, las tarjetas, la nota media y las opiniones salgan de ahí sin cambiar el diseño.
- **Más adelante** (no ahora): las excursiones también saldrán en Explorar.

## 3. «¿Dónde la ponemos?»

Al tocar «Añadir a mi viaje», sube una ventana desde abajo, con su tirador y su cruz:
- en letra pequeña, el nombre de la excursión; el título: «¿Dónde la ponemos?»;
- **«SUSTITUYE UNO DE TUS DÍAS»:** la lista de días donde cabe, con su fecha y su título. Uno se marca al tocarlo.
  - Las de día entero nunca se ofrecen para el día de llegada ni para el de vuelta.
  - Con fechas y con la API, solo los días en que esa excursión funciona.
- **«O EN UN DÍA NUEVO»:** con el mismo formato de título que el de arriba (letra pequeña, mayúsculas), y debajo la opción «Añádela en un día nuevo», con la línea «Se añade a tu viaje como "{excursión}"»;
- el botón: «Ponerla en el Día {n}» (o «Añadirla en un día nuevo»).

**Sin avisos:** el viajero decide.

**Qué pasa:**
- **Si sustituye un día:**
  - ese día pasa a ser el día de la excursión y se llama como ella;
  - las paradas de ese día se quitan y el resto del viaje no cambia;
  - con la varita de ese día («Recuperar este día») vuelve tal como estaba;
  - si la excursión es de medio día, solo se cambia la mañana, y la tarde sigue en el destino con la regla de medio día que ya existe.
- **Si es un día nuevo:** se añade al final de la lista como día de excursión, con su nombre.
- **En los dos casos,** la app vuelve a la pestaña Días con ese día abierto.

## 4. Más días que el viaje

Si el viaje tiene más días en la ruta que su duración (por ejemplo, viaje de 4 días con 5 días en la lista), justo **debajo del botón «+ Añadir día»** sale una línea de texto, con un icono de aviso pequeño en terracota:

> Tu viaje es de 4 días y ahora tienes 5. **Añade un día más a tu viaje** o elimina el que menos te convenga.

- «Añade un día más a tu viaje» es un enlace: abre el calendario de fechas del viaje (o, si el viaje no tiene fechas, donde se elige el número de días).
- En cuanto los días vuelven a cuadrar, la línea desaparece.
- No sale nada más: ni en las fechas, ni en ventanas.

## 5. «+ Añadir día», primero qué quieres hacer

Al tocar «+ Añadir día», sube una ventana con su tirador y su cruz:
- en letra pequeña, «DÍA {n} · NUEVO»; el título: «¿Qué quieres hacer este día?»;
- dos opciones grandes, cada una con su icono en un cuadrado de color:
  - **«Añadir lugares»** (icono de chincheta, verde), con la línea «Monumentos, barrios, miradores…». Pide el nombre del día y luego abre Explorar, como hoy;
  - **«Añadir una excursión»** (icono del autobús, terracota), con la línea «Pompeya, Florencia, Tívoli…» (los sitios de excursión de ese destino). Abre la página de excursiones. Al tocar «Añadir a mi viaje», la excursión va directa a ese día nuevo, sin la ventana del punto 3, y el día se llama como la excursión.

**Informe corto:** capturas a 390 px de:
- el botón flotante, en un viaje de 4 días (sale) y en uno de 3 (no sale);
- la página de excursiones, con la franja de la valoración media;
- «¿Dónde la ponemos?»;
- un día sustituido;
- la línea de «más días que el viaje»;
- la ventana de «+ Añadir día».
