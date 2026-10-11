# Pendientes: VIAJES DE VARIOS DESTINOS

**NO TOCAR TODAVÍA (Eric, 10-oct).** Va cuando Roma esté entera curada y lista para lanzar, después de las Llegadas (Tanda 7) y de curar Florencia. Hasta entonces, Code trata Roma como si no hubiera nada más.

Este archivo es el resumen de lo decidido. La historia de cómo se llegó aquí (versiones 1 a 4 y el borrador viejo del prompt) está en `BORRADOR_MULTIDESTINOS.md`. Antes de pasárselo a Code, Claude escribe un prompt nuevo con esto y con lo que haya cambiado, y le pone su número de tanda.

## En qué lugar va
1. Roma pulida y Escuchar.
2. Las Llegadas (Tanda 7): cada destino usa su día de llegada y su día de salida, y los tramos de en medio son llegadas y salidas. Ver `PENDIENTES_LLEGADAS.md`.
3. Curar Florencia con `GUIA_NUEVOS_DESTINOS.md`: sin un segundo destino curado no se puede ofrecer ni probar un viaje de varios.
4. Los multidestinos.

## Las reglas
- **Solo se buscan destinos curados** (Eric, 11-oct). Si escribe otro, no sale en la lista y debajo pone «Aún no tenemos este destino».
- **Cada destino es un viaje suelto**, como Roma ahora: su ruta, su RESERVAS, sus fotos, sus tips, su tiempo. No se parte ningún día.
- **La app no propone nada:** las noches las pone el viajero.
- Las de siempre: la app avisa y nunca prohíbe, sin horas calculadas a la vista, sin cuentas al minuto y sin nombres de empresas.
- **Un viaje solo a Roma sale exactamente igual que ahora.**

## El formulario (versión 4, con el diseño de Eric)
Diseño: `docs\diseno\multidestino\Varias Ciudades.dc.html` (Eric: «es perfecto, iconos y todo») y `formulario_varias_ciudades.png`. **Solo se cogen tres pantallas:** la 1, la 2 y la 4. Todo lo demás, lo nuestro de siempre.
- **Pantalla 1:** «¿De dónde sales y a dónde vas?» con el interruptor «Un destino · Varias ciudades». En «Varias ciudades»: Origen, Destino, Destino 2 (con su X), «+ Añadir otra ciudad» y [Trazar ruta · 2 destinos].
- **Dos caminos.** Un destino: como ahora. Varias ciudades: sin experiencias ni pool, y la barra de pasos cuenta menos pasos.
- **Pantalla 2, el recorrido:** cada destino con sus noches (− 3 +) y en cada tramo un desplegable con el medio (avión, tren, autobús, coche). Solo se elige el medio: no se calcula nada. Si el tramo está en nuestra tabla de tramos, sale su dato (~1 h 30 en tren). «Vuelves a» (por defecto, el origen) va en esta pantalla.
- **El calendario, el nuestro:** como las noches ya están puestas, solo se toca el día de salida y el viaje entero se pinta solo, cada ciudad con su color; el día de cambio, con los dos colores. Debajo, el resumen («Roma 3 noches · Florencia 4 · vuelves el lun 20») y «Cambiar noches», que vuelve a la pantalla 2. Si toca otro día, cambia el día de salida. Sin fechas: el mes, como ahora.
- **Después:** «Quién viaja» (hace falta para el presupuesto) y la pantalla de elegir («hazla por mí» = nuestros días escritos de cada destino; «quiero hacerla yo» = días vacíos).
- **Pantalla 4, RUTA:** las noches de cada destino se cambian con − y + (se rehace solo ese destino), y «+ Añadir destino».

## La tabla de tramos
La escribimos nosotros, como la de las llegadas, porque solo hay destinos curados: Roma ↔ Florencia, tren, ~1 h 30, de estación a estación. Entre destinos no se calcula nada. Solo se calculan la ida (origen → primer destino) y la vuelta, como ahora.

## Cómo se cuentan los días
- El día de cambio cuenta en los dos destinos y una sola vez en el viaje. 3 días en Roma (13–15) y 5 en Florencia (15–19) son 7 días.
- Días del viaje = la suma de los días de cada destino − (destinos − 1).
- El último día de un destino es su «día de vuelta», hasta la hora en que se va; el primero del siguiente es su «día de llegada», desde la hora en que llega. Las horas solo eligen la fila (mañana, tarde, noche).
- **En la gratis** (sin llegada y vuelta): ese día, el destino de antes por la mañana y el siguiente por la tarde.

## El tramo de en medio, una sola vez
- «Tren Roma → Florencia», con su salida y su llegada. Con la salida acaba Roma y con la llegada empieza Florencia. No se pide dos veces.
- En RESERVAS (de pago, «Llegada y vuelta»): la llegada al primer destino, cada tramo y la vuelta, en orden, con su precio opcional. «Llegada y vuelta» está lista cuando lo están todos sus tramos.

## Cada destino, lo suyo
- **RESERVAS:** el alojamiento, las entradas, el Free Tour y las excursiones, por destino. Una vez por viaje: el seguro, la tarjeta y el coche. La eSIM, una por país.
- **RUTA:** una tarjeta por destino («Roma · 3 días · 13 – 15 oct»), con su bombilla y su varita. Entre dos tarjetas, el tramo con su icono: «Roma → Florencia · mié 15».
- **DÍAS:** bajo el nombre de cada destino. La fecha de cambio sale en los dos: «mié 15 · hasta que te vas» y «mié 15 · desde que llegas» (con la hora que puso el viajero, nunca una calculada).
- **HOY (de pago):** el día de cambio, las dos partes seguidas, con el tramo como una parada más ([Cómo llegar] a la estación o al aeropuerto).
- **La tarjeta oscura de RESERVAS:** antes, «Tu viaje a Roma y Florencia empieza en…»; durante, «Estás en Florencia · día 4 de 7».
- **Las fotos, sin preguntar:** cada foto es del destino de su parada; las sueltas de HOY, del destino de la siguiente parada por visitar (si ya está todo visto, del de la última).
- **El globo del Perfil:** una chincheta por destino y una pequeña por cada excursión de un día (Pisa desde Florencia). Al tocarla, el álbum solo de ese sitio, con [Ver todo el viaje]. En el álbum, un título por destino.
- **El presupuesto:** uno por viaje, todo sumado, como ahora.

## Las pruebas (cuando toque)
- Roma dentro de un viaje (Florencia → Roma, Roma → Florencia, Florencia → Roma → Nápoles) da los mismos días que Roma sola, en 20 fechas.
- Las cuentas de días y noches; cada tramo pedido una vez; RESERVAS por destino; las fotos y las chinchetas; un destino de un solo día en medio.
- A mano, a 375 px, en la gratis y en la de pago, con capturas.

## Más adelante
- Italia en tren: este mismo modelo, curando cada ciudad como Roma.
- Islandia en coche o autocaravana: otro tipo de viaje. La pieza es la etapa (de A a B, con sus paradas y dónde se duerme), con «etapas escritas», el coche una vez y la temporada y las carreteras como avisos.
- Orden: Roma → ciudades de Italia → rutas en coche (Islandia la primera).
- Nada de «optimizar» el orden de los destinos: el orden lo pone el viajero.

## Por decidir
- ¿Se puede arrastrar para cambiar el orden de los destinos en RUTA?
- ¿Qué pasa con las reservas de un destino si el viajero le quita noches? (Lo mismo que al acortar un viaje: «¿Estás seguro?» nombrando lo que se pierde.)
