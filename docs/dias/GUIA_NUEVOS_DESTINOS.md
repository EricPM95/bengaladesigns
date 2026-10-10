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
- **Si una reserva cae en otro día,** se cambian los dos días enteros (todo o nada). Los días cambiados a mano no se tocan.
- **La app nunca propone otra hora** (Eric, 9-oct): el viajero compra cuando le va bien. Las reservas grandes (en Roma: el Coliseo, los Museos y la Galería) llevan una lista escrita para todas sus horas, de la primera a la última entrada. Si dos reservas se pisan, solo un aviso.
- **Un día con dos reservas largas (en Roma, el Free Tour y los Museos):** dos partes, mañana y tarde. Da igual qué se reserve primero: la reservada manda y la otra pasa a la otra mitad del día. Se escribe una tabla con las horas de la visita larga (por la mañana o por la tarde, qué va antes o después, dónde se come). Si las dos se pisan, solo un aviso.
- **Las reservas mandan y el día lo lleva todo** (Eric, 9-oct): con una reserva no se quita ni se acorta nada porque no dé tiempo; la app solo ordena. Cada franja (mañana, tarde) lleva una parte, y la reserva decide en cuál va cada una. El viajero quita o añade lo que quiera.
- **Solo las visitas largas** (más de ~1 h 30: museos grandes, tours) llevan listas y tablas por hora. Las cortas (el Panteón, una iglesia, un mirador) se colocan solas en su ruta.
- **El Free Tour (o el tour gratis del destino), según su hora** (Roma, 9-oct): cada hora lleva su día escrito.
  - Si es a media mañana, el mismo día, corrido, con algo de camino al punto de salida. La visita grande de la tarde se reserva más tarde (en Roma, los Museos a las 16:00).
  - Si es por la tarde, la visita grande pasa a la mañana.
  - Si es de noche, sustituye a la nocturna del día que pasa por los mismos sitios, y no hace falta el día del Free Tour.
- **Sin cuentas al minuto** (Eric, 10-oct; sustituye a lo del 9-oct): la hora de la reserva solo decide qué fila de su tabla y qué lista escrita se usa. No se calcula si da tiempo, nada pasa «por fuera» ni «detrás», no hay aviso «vas justo». El viajero mueve o quita lo que quiera, y durante el viaje tiene [No me da tiempo]. A la vista, el horario y la última entrada de cada sitio, en pequeño: decide él. Solo un aviso: «coinciden», cuando dos reservas se pisan de verdad.
- **La noche no se quita por la hora:** la nocturna se queda aunque el día acabe tarde.
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
- **Lo de pago no se enseña con candados:** simplemente no sale.
- **El pago no se activa de cara al público sin la Tanda 7 hecha.**

## 7. Los datos de cada destino (archivos)
- el documento de los días;
- `_llegada.json`: medios, puntos, cómo llegar, tips, traslados;
- `_entradas.json`: entradas con enlace de afiliado;
- `_excursiones.json`;
- `entradas_reservas`: las imprescindibles y las de «Ver más»;
- `excursiones_desde_dias`;
- las zonas del alojamiento;
- los horarios auditados (como `AUDITORIA_HORARIOS_ROMA`).
