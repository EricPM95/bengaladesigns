# Guía para montar un destino nuevo (lo aprendido con Roma)

Lo que vamos decidiendo con Roma y que vale para cualquier destino. La lleva Claude y la pone al día cada vez que decidimos algo que no es solo de Roma. Empezada el 9-oct-2026.

## 1. Los días
- **Los días se escriben a mano**, uno a uno, en el documento del destino (como `DIAS_ROMA_PARADAS.md`). La app no inventa días ni paradas.
- **Lo imprescindible, primero:** los días con más imprescindibles van en los primeros días completos del viaje.
- **Solo es parada lo que está escrito como parada**, o lo que añade el viajero. La app nunca rellena huecos (6r).
- **Parada o «de camino»:**
  - parada, un sitio con nombre, que se visita;
  - de camino, las calles de paso, los rincones pequeños, las fachadas en las que no se entra y lo ya visto otro día («Ya lo visitaste el día n»).
- **Cada parada lleva sus minutos aproximados.** Las horas solo se usan por dentro. Las franjas van sin hora («Mañana», «Comida», «Tarde», «Cena», «Noche»; Eric, 9-oct). La única hora a la vista es la de lo que ha reservado el viajero, en la pestañita verde.
- **La comida, antes de las 15:00** (decidido por Eric el 9-oct, tras su viaje a Roma).
- **Con lluvia, cierres o días de la semana sin abrir:** cada día lleva su variante escrita.
- **Que el día no se quede corto ni con esperas largas:** si entre dos paradas sobra mucho tiempo, se escribe algo de camino que tenga sentido. Por ejemplo, entre el Panteón y la Plaza de España, Sant'Ignazio y el Templo de Adriano.

## 2. Las reservas
- **Las reservas mandan:** quedan fijas a su hora y el día se ajusta alrededor.
- **Los sitios grandes** (Tanda 6y9 y 6y10): cada destino marca en sus datos cuáles son sus «sitios grandes», en el campo **`sitios_grandes`** (en `data/pipeline_v2/<destino>.json`). Lleva `lugares`: una lista con un objeto por sitio: **`nombre`** (el del lugar, igual que en `places`; el Free Tour lleva el de `default_free_tour.name`), **`del`** y **`el`** (cómo se dice en los avisos: «del Coliseo» / «el Coliseo»), **`dias`** (los ids de los días escritos que son de ese sitio: «D1», «D2»…, los que usa el motor para saber qué día mover) y, solo si hace falta, **`nunca_se_quita: true`** (el motor no lo saca de su día aunque cierre; la hoja avisa). En Roma son el Coliseo, los Museos Vaticanos, la Galería Borghese y el Free Tour. El motor, el servidor y la app leen SOLO de ahí (no hay ninguna lista en el código): un destino que no trae el campo no tiene sitios grandes y se porta como tal, sin romper. **Una reserva de un sitio grande en otro día mueve el día entero:** se cambian los dos días enteros (todo o nada). **Un cierre cambia el día con otro.** **Una reserva de un sitio pequeño solo mueve esa parada** al día de su fecha, más o menos a su hora, y del día al que llega no se quita nada. **Los días cambiados a mano no se tocan.**
- **La app nunca propone otra hora** (Eric, 9-oct): el viajero compra cuando le va bien. Las reservas grandes (en Roma: el Coliseo, los Museos y la Galería) llevan una lista escrita para todas sus horas, de la primera a la última entrada. Si dos reservas se pisan, solo un aviso.
- **Un día con dos reservas largas (en Roma, el Free Tour y los Museos):** dos partes, mañana y tarde. Da igual qué se reserve primero: la reservada manda y la otra pasa a la otra mitad del día. Se escribe una tabla con las horas de la visita larga (por la mañana o por la tarde, qué va antes o después, dónde se come). Si las dos se pisan, solo un aviso.
- **Las reservas mandan y el día lo lleva todo** (Eric, 9-oct): con una reserva no se quita nada porque no dé tiempo; la app solo ordena (y cuenta corta la comida de antes de una reserva si hace falta, ver más abajo). Cada franja (mañana, tarde) lleva una parte, y la reserva decide en cuál va cada una. El viajero quita o añade lo que quiera.
- **Solo las visitas largas** (más de ~1 h 30: museos grandes, tours) llevan listas y tablas por hora. Las cortas (el Panteón, una iglesia, un mirador) se colocan solas en su ruta.
- **El Free Tour (o el tour gratis del destino), según su hora** (Roma, 9-oct): cada hora lleva su día escrito.
  - Si es a media mañana, el mismo día, corrido, con algo de camino al punto de salida. La visita grande de la tarde se reserva más tarde (en Roma, los Museos a las 16:00).
  - Si es por la tarde, la visita grande pasa a la mañana.
  - Si es de noche, sustituye a la nocturna del día que pasa por los mismos sitios, y no hace falta el día del Free Tour.
- **Sin cuentas al minuto** (Eric, 10-oct; sustituye a lo del 9-oct): la hora de la reserva decide qué fila de su tabla y qué lista escrita se usa. Nada pasa «por fuera» por la hora y no hay aviso «vas justo» (la única cuenta es la de la comida y la cena de arriba, 12-oct: la entrada nunca sale tarde). El viajero mueve o quita lo que quiera, y durante el viaje tiene [No me da tiempo]. A la vista, el horario y la última entrada de cada sitio, en pequeño: decide él. Solo un aviso: «coinciden», cuando dos reservas se pisan de verdad.
- **La comida y la cena según la reserva (regla general, Eric, 12-oct; vale para todos los destinos y la aplica el motor, no el documento):** se mira a qué hora SALES de la reserva (su hora más lo que dura la visita, que sale de los datos del sitio: `duration_minutes`).
  - **Comida:** si al salir ya son más de las 14:30, la comida va ANTES de la reserva (cerca de ella); si sales a las 14:30 o antes, va DESPUÉS. (Ejemplos de Roma: Coliseo ~1 h 30 a las 13:00 → después; Museos ~3 h a las 12:00 → antes; Galería 2 h a las 13:00 → antes.)
  - **Cena** (cambiada el 12-oct, Tanda 6y9): la cena va ANTES de la reserva solo si al salir ya son más de las 22:00; si sales a las 22:00 o antes, va DESPUÉS (en Roma se cena bien hasta tarde: un Free Tour de las 19:00 lleva la cena después, cerca de donde acaba; el de las 21:00, antes). La cena nunca va después de las 22:30, salvo que la reserva acabe después de las 22:15. No se quita ninguna parada para cumplirlo.
  - **La entrada nunca sale tarde:** la mesa de antes se cuenta corta por dentro (45 min la comida, 60 la cena) si la normal haría llegar tarde (la comida nunca va antes de las 12:00; única excepción, `comida_rapida_excepcion`: una reserva de 12:00 a 13:00 lleva una comida corta de 30 min desde las 11:15, que hace de «Llegada a…»); solo ponemos la parada, cuánto tarda en comer lo decide el viajero. Si aun así no llega, lo de justo antes pasa detrás de la reserva (en su orden; nada pasa a «Si te sobra tiempo»), y el día empieza antes si la reserva es muy temprano. Si ni así llega, la mesa va después. Con dos reservas del viajero el mismo día no se mueve nada por esto (manda la lista escrita).
  - **Cada sitio con reserva tiene que llevar cuánto dura la visita en sus datos** (`duration_minutes`). Sin ese dato el motor usa los minutos de la parada del día escrito; avísalo al montar el destino. Las tablas de horas del documento tienen que respetar el corte (que la fila de la hora de antes no ponga la comida en el lado contrario).
  - La configuración (`franjas` del destino) puede cambiar las horas de la regla: `comida_antes_si_sale_despues_de` (14:30), `cena_antes_si_sale_despues_de` (22:00), `comida_rapida_min` / `comida_rapida_desde` (45 min, 12:00) y `comida_rapida_excepcion`, `cena_rapida_min` / `cena_rapida_desde` (60 min, 18:00).
- **La noche no se quita por la hora:** la nocturna se queda aunque el día acabe tarde.
- **Avisos suaves** (Eric, 10-oct, por la tarde): «vas justo» solo entre dos reservas del viajero del mismo día (sin contar nuestras paradas) y «Hoy es un día completo: te recomendamos madrugar» si el día con reserva va muy cargado. Solo avisan: no mueven ni quitan nada.
- **La app avisa, nunca prohíbe** (Eric, 10-oct): una reserva a una hora en que el sitio está cerrado ese día (Navidad, Nochevieja, Reyes, Semana Santa…) se guarda igual, con el aviso «Ese día el Coliseo cierra a las 14:00. Revisa tu reserva.». No se toca nada más: su día pasa con su bloque, como siempre.
- **Todo lo que se reserva se puede eliminar,** y al eliminar no se mueve ningún día.

## 3. RESERVAS (la pestaña)
- **El orden:**
  1. resumen (de pago);
  2. llegada y vuelta (de pago);
  3. alojamiento;
  4. entradas y Free Tour;
  5. excursiones;
  6. útil para el viaje.
- **Al principio, todo cerrado,** como acordeón, con «Falta».
- **Entradas:** las 4 imprescindibles arriba y el resto en «Ver n más». Solo las que están en la ruta. Es un dato del destino (`entradas_reservas`).
- **Excursiones:**
  - solo en viajes de X días o más (`excursiones_desde_dias`; en Roma, 4);
  - una sola tarjeta según el viaje;
  - se puede añadir una ya comprada.
- **Alojamiento:** el mapa de Stay22 (aid `viajesbengala`), con las fechas del viaje, centrado en la ciudad. El mismo para todos.
- **Útil para el viaje:** seguro (primero), eSIM, tarjeta.

## 4. Llegadas y vueltas (de pago)
- **El medio sale del formulario,** y la ida y la vuelta pueden ser distintas.
- **Los puntos de llegada por medio** van en `_llegada.json` del destino (en Roma: Fiumicino/Ciampino, Termini/Tiburtina, Civitavecchia). Ninguno viene marcado de serie.
- **La barra del día** (diseño 1b): sin vuelo, «Añade tu vuelo y ajustamos tu día» con [+ Vuelo]; con vuelo, la hora del viajero en verde.
- **Traslados privados:** solo en aeropuertos y puertos, con texto vendedor y enlace de afiliado.
- **La zona del alojamiento:** fichas con los barrios del destino y «Aún no lo sé».
- **Cómo se cuentan los días** (Tanda 7): por noches. El último día del viaje, el de la fecha de vuelta, es el **día de vuelta**: lo crea la app y no lleva ruta. «3 noches» son 3 días de ruta más el día de vuelta. Se enseña siempre con los dos: «{n+1} días · {n} noches» (con una sola fecha, «1 día»; ese viaje es el D0 de siempre, con las dos barras).
- **Las tablas por filas:** la hora de llegada («libre» = llegada + el traslado de su punto + 30 min para la maleta) y la de salida (la hora del vuelo − el margen de su punto) **solo eligen la fila de una tabla**, y lo que lleva cada fila es una **lista escrita en el documento**. El motor no quita ni mueve nada por minutos, y ninguna de las dos horas se enseña nunca. Cada tramo empieza en su hora (libre a las 14:00 en punto ya es la fila de las 14:00; la hora no se redondea). Las tablas salen del documento con `listasConvertir.mjs` a `listas.json` (`llegadas.dia1.marzo_octubre`, `llegadas.dia1.invierno`, `llegadas.vuelta`, `llegadas.ultimas_mananas`, `llegadas.inicio_por_zona`), nunca escritas en el código. Cada destino escribe sus tablas y sus listas como Roma.
- **«Invierno» y «de marzo a octubre»:** son dos tablas del día 1. «Invierno» son los días en que el sitio grande del destino cierra pronto según el horario de su fecha (en Roma, el Coliseo a las 16:30); todos los demás son «de marzo a octubre». Nunca se escriben fechas a mano: se mira el horario de la fecha (sin fechas, el día 15 del mes).
- **Las versiones del día 1** (PARA TODOS LOS DESTINOS): los días de llegada se aceleran quitando tiempo de las visitas por dentro (por fuera y a buen paso, con sus propios minutos), **salvo los sitios grandes, que llevan siempre su tiempo entero**. Cada destino escribe sus versiones como Roma: la tranquila (el día de siempre, o «al revés»), la rápida, la de tarde, la ruta del centro (a buen paso y entera), la del anochecer, la de noche (con cena y sin cena) y «sin ruta», con su variante de invierno si sus horarios cambian. Lo que una versión deja fuera va a «Si te sobra tiempo» de esa misma lista. Cuando el viajero llega tarde, el día 1 pasa entero al día 2: todo se corre un día y solo se cae el último día de ruta, el de menos importancia.
- **La ruta del centro por inicio de zona:** la zona del alojamiento solo decide **por dónde empieza** la ruta (una tabla zona → inicio; en Roma, Navona o la Plaza de España), no qué versión del día 1 sale. Cada inicio es una lista con las mismas paradas en otro orden, sin volver atrás; la comida y la cena van donde acaba cada tramo.
- **Las mañanas de la vuelta y las cortas:** la tabla de la vuelta tiene una fila por tramo de hora (solo el traslado · mañana corta · última mañana sin comida · con comida y tarde libre · un día más). La última mañana es la primera de una **lista de mañanas en su orden** que no repite lo principal ya visto de día (cada fila dice lo principal que la salta y los días en que no se usa); la última fila es la hoja «Ya has visto lo mejor de {destino}». Cada mañana tiene su versión **corta** (de 1 h 15 a 1 h 30 en total) para los vuelos que dejan poco rato. Si una lista no cabe con la hora más temprana de su fila, no se recorta: se pregunta.
- **El bloque de cada sitio grande:** el sitio grande reservado en un día de llegada tardía o de vuelta no mueve el día entero: va solo su **bloque** (la visita a su hora y lo que va con la misma entrada o pegado a ella; en Roma, el Coliseo con el Arco y el Foro, los Museos con la Plaza y la Basílica, la Galería con el parque), siempre entero y sin mirar si cabe. El resto de su día escrito se queda en su día, en la versión sin esa visita. Los sitios grandes y sus bloques van en los **datos del destino**, no en el código.
- **Cómo se escriben el bloque y el aviso en los datos** (`sitios_grandes.lugares[]` de `data/pipeline_v2/<destino>.json`): `bloque.paradas` son los lugares del bloque (la visita reservada y lo que va con ella); el motor los toma, en el orden del día escrito de ese sitio para la hora de la reserva, de la lista de `dias[0]` del sitio. `bloque.despues_de_comer` (opcional) dice qué paradas, en qué días de la semana, nunca van antes de comer (en Roma, la Plaza y la Basílica el miércoles): después de la comida si la fila la lleva y, si no, a «Si te sobra tiempo». `entrada_a` es cómo se dice «Tu entrada …» en los avisos de reservas contra el vuelo («al Coliseo», «a los Museos Vaticanos»). Si, sin el bloque, el día escrito del sitio se quedara con una mañana vacía (la versión sin Museos del Vaticano es solo la Plaza y la Basílica), ese día se queda con lo suyo y el bloque del día de vuelta no lo repite.
- **«Para tu zona»:** una tabla zona × punto de llegada con «Tu mejor opción» y las demás, en los datos del destino. **Sin taxi** (ni como forma de llegar ni de irse) y **sin nombres de empresas** (sí los del transporte público: Leonardo Express, FL1, metro A, bus 40). Solo las opciones que sirven en esa zona, con el precio y el tiempo de cada tramo, nunca un tiempo total sumado. De noche o a primera hora, solo lo que tenga horario comprobado; si no queda nada, «Tu mejor opción» es el traslado privado.
- **El traslado privado:** es lo único que se vende en la ficha de llegada y vuelta. Va con su texto («Te esperan a la salida con tu nombre y te dejan en la puerta de tu alojamiento o donde tú quieras.»), sin precio, sin proveedor y sin decir que es más barato.
- **Los imprescindibles** (todos los destinos): nunca van «de camino». Si ya se vieron otro día del viaje (también en la llegada), salen otra vez como parada, más corta (~10 min); solo lo que no es imprescindible pasa a «de camino» con «Ya lo visitaste el {día}». Una lista escrita que lleve un imprescindible «de camino» lo pasa a parada corta.

## 5. Textos (todos los destinos)
- **Nunca el nombre de un proveedor** en lo que lee el viajero (dentro de un mapa o un widget de fuera, da igual).
- **Ninguna hora que calcule la app** a partir del vuelo («llegas al centro a las…», «libre hacia las…», «sal a las…»): si el vuelo se retrasa, es una promesa falsa.
- **Sí los datos reales y comprobados:** cuánto se tarda, la distancia, la frecuencia, el precio, los horarios («32 km al centro», «De Fiumicino al centro»).
- **«Centro» solo cuando es un sitio real** (datos de transporte, el traslado, el nombre de una zona), no en nuestras frases.
- **Nada de fuentes a la vista:** las fuentes se quedan en los datos, para revisarlos.

## 6. Gratis y de pago
- **Un solo interruptor** para todo lo de pago. Con `?version=gratis` se ve la gratis.
- **Gratis:** los días escritos enteros, las reservas que cambian días, las entradas, las excursiones, el alojamiento (mapa) y lo útil.
- **De pago:** los vuelos y la llegada y la vuelta, la zona, el resumen, el orden de los días según los vuelos (Tanda 7), HOY y explorar extras.
- **Lo de pago no se enseña con candados:** simplemente no sale, salvo "Escuchar historia", que lleva candado en la versión gratis.
- **El pago no se activa de cara al público sin la Tanda 7 hecha.**

## 7. Los datos de cada destino (archivos)
- el documento de los días;
- `_llegada.json`: medios, puntos, cómo llegar, tips, traslados;
- `_entradas.json`: entradas con enlace de afiliado;
- `_excursiones.json`;
- `entradas_reservas`: las imprescindibles y las de «Ver más»;
- los **sitios grandes** del destino (ver el apartado 2);
- los **turnos reales** de las entradas más comunes del destino (en Roma: el Coliseo, los Museos Vaticanos, la Galería Borghese, el Panteón y el Free Tour), comprobados en su web oficial, y debajo siempre «Recuerda revisar la disponibilidad antes de añadirlo a tu ruta»;
- los **horarios por tramos de fechas**, tal como los da la web oficial de cada sitio, con su fuente y la fecha en que se comprobó. Los tramos valen para cualquier año: «el último domingo de marzo», no una fecha fija. La rueda de la hora llega hasta la última entrada oficial del tramo de esa fecha;
- `excursiones_desde_dias`;
- las zonas del alojamiento;
- los horarios auditados (como `AUDITORIA_HORARIOS_ROMA`).
- Historias para "Escuchar historia" (ver HISTORIAS_ROMA.md). Cada sitio importante lleva su historia, de unos 3 minutos, contada como un cuento. Puede contar lo importante aunque salga en la ficha, pero no copia sus frases. **Su audio:** la voz se elige una vez; los audios se crean con `node scripts/destino/crearAudiosHistorias.mjs --destino=<destino>` (solo los de las historias cuyo texto ha cambiado) y se guardan en `public/audios/<destino>/<sitio>-<huella>.mp3`: la huella (SHA-256 del texto + la voz y sus ajustes, 24 caracteres) va en el nombre, así que no se puede adivinar sin conocer el texto exacto. El índice `data/audios/<destino>.json` se queda en el servidor (nunca en `public/`) y no se envía entero: la app pregunta por UN sitio (`POST /api/historia-audio`) y el servidor contesta solo la dirección de ese audio, y solo si el texto de ahora coincide con el del audio. **Si cambias una letra de la historia (o la voz), la huella cambia: el audio viejo deja de usarse (suena la voz del móvil) y la orden de crear lo rehace y avisa de qué fichero viejo se puede borrar.** No dejes nunca una lista de audios dentro de `public/`. Sin audio, la barra usa la voz del móvil.
