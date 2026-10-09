Tanda 6z2: el precio de todo lo que se añade, la moneda y la pantalla del presupuesto. Va todo en este mensaje. Si ya te pasé antes una 6z2, esta la sustituye entera: sigue con esta. La 6z ya está subida: puedes empezar. No cambia cómo se montan los días. La 6y sigue sin hacerse: va después.

Antes de empezar: he copiado este prompt (docs\dias\PROMPT_TANDA6Z2_PARA_PEGAR.md) y PENDIENTES_6K.md en docs\dias, y el diseño del presupuesto en docs\diseno\presupuesto\ (Presupuesto.dc.html y su support.js). Mételos en un commit tal cual.

LA IDEA (decidido por Eric, a INVARIANTES, todos los destinos)
Todo lo que el viajero añade al viaje lleva su precio, y todo se suma en el presupuesto del viaje. Sin excepciones: cualquier sitio de la app donde se añade algo que cuesta dinero tiene su campo «Precio (opcional)». Es informativo: no cambia la ruta.

1. EL CAMPO «PRECIO» EN LA HOJA DE LA HORA
- En la hoja donde se añade o se cambia una reserva (la de «¿Ya la tienes? Añádela» y «Cambiar», con las fichas de los días y la rueda de la hora), debajo de la hora, un campo nuevo:
  - «Precio (opcional)», el total de todas las personas, en la moneda del viajero (punto 5);
  - se guarda como número y con su moneda, con la reserva.
- Vale para lo que se reserva con esa hoja: las entradas y las excursiones. Desde RESERVAS, desde la pestañita naranja de DÍAS y desde la ficha.
- El Free Tour, NO: no lleva campo de precio (es gratis). Las propinas y los demás gastos sueltos van en «Extras» del presupuesto (punto 6), que los apunta el viajero.
- Nunca un precio puesto por la app: si el viajero no lo escribe, queda vacío. Nada de rellenarlo con el precio de la tienda.

2. DÓNDE SE VE EL PRECIO
- La línea de lo reservado, en RESERVAS, lleva el precio al final si lo puso: «✓ Coliseo, Foro y Palatino · 11 ago · 10:00 · 54 €». Sin precio, como ahora.
- En la tarjeta de la parada en DÍAS, no: allí solo la hora, como ahora.

3. LA LLEGADA Y LA VUELTA (de pago)
- En la hoja donde se pone la hora del vuelo (o del tren, el autobús o el barco), el mismo campo «Precio (opcional)», total de todas las personas.
- Si la ida y la vuelta son un mismo billete, que se pueda poner en la ida y dejar la vuelta vacía.

4. TODO LO DEMÁS QUE SE AÑADE
- Busca en toda la app los demás sitios donde el viajero añade algo que cuesta dinero, y ponles el mismo campo «Precio (opcional)», con la misma forma de guardarlo. Por ejemplo, en «útil para el viaje» (el seguro, la eSIM, la tarjeta), el coche de alquiler, los traslados o cualquier reserva añadida a mano. El alojamiento ya lo tiene (6z).
- Si en alguno no se añade nada (solo es un enlace a la tienda), dime cuál es en PREGUNTAS: a lo mejor hay que poner un «¿Ya lo tienes? Añádelo» con su precio.
- Las paradas sin entrada (una plaza, una fuente) no llevan precio.
- Una sola forma de guardar los precios para todo (importe y moneda), en un solo sitio del código, para que el presupuesto los sume sin casos raros.

5. LA MONEDA (decidido por Eric, a INVARIANTES, todos los destinos)
El viajero piensa en su moneda: un español que va a México apunta lo que gasta en euros. Por eso:
- La moneda del viajero sale de su ciudad de origen del formulario (España → «EUR», México → «MXN»…), y la puede cambiar en su perfil o en el propio presupuesto («Tu moneda: EUR · Cambiar»).
- Los campos de precio salen con la moneda del viajero y, al lado, se puede cambiar con un toque a la del destino (o a otra), por si lo pagó allí («800 MXN» en un taxi de Ciudad de México).
- Cada destino lleva también su moneda en sus datos (`moneda`: Roma, «EUR»; Londres, «GBP»; Praga, «CZK»; Ciudad de México, «MXN»…). Nada escrito en el código. Sirve para ofrecerla en el campo de precio y para los consejos («En México se paga en pesos»).
- Los precios de las tiendas (entradas, excursiones, traslados) salen tal como los da la tienda, sin convertir.
- El mapa de Stay22: `currency=` con la moneda del viajero, para que compare precios en la suya.
- Formato en español, como `Intl.NumberFormat('es-ES', { style: 'currency' })`, sin decimales si el número es redondo: «54 €», «54 £», «1.200 Kč», «800 MXN».
- En el presupuesto, todo se suma en la moneda del viajero. Lo que esté en otra moneda se pasa con el cambio del día, sacado de una fuente oficial y gratuita (por ejemplo, el Banco Central Europeo), y se ve así: «800 MXN · ≈ 41 €». Con una línea pequeña al pie del total: «Cambio aproximado del {fecha}».
  - El cambio lo pide nuestro servidor una vez al día y lo guarda; la app no llama a la fuente desde el móvil.
  - Si una moneda no está en esa fuente, o no hay cambio, ese gasto sale aparte, en su moneda, sin sumarlo, con «Sin cambio para MXN». Dime en el informe qué fuente usas y qué monedas tiene.
- Dime en el informe dónde salían precios con «€» escrito a mano.

6. LA PANTALLA DEL PRESUPUESTO (diseño en docs\diseno\presupuesto\Presupuesto.dc.html)
Del diseño se copia lo visual: la cabecera, la tarjeta oscura del total con la barra de colores, los bloques blancos con sus líneas, y «Extras» con su campo para añadir. Los textos y los datos son estos:
- Dónde está: en RESERVAS, arriba, una fila «Presupuesto · 334 €» que abre la pantalla (con la flecha de atrás para volver). Gratis y de pago, igual.
- Cabecera: «Presupuesto» y, debajo, «{destino} · {fechas} · {n} personas» (las personas, de la pantalla «¿Con quién viajas?» del formulario; si no hay número, «· Cambiar personas» para ponerlo).
- La tarjeta oscura:
  - «TOTAL DEL VIAJE» y el total, en la moneda del viajero;
  - a la derecha, «por persona», escondido con el ojo como en el diseño (se toca para verlo): el total entre las personas;
  - la barra de colores, con un trozo por bloque, y debajo cada bloque con su suma.
- Los bloques, de arriba abajo:
  1. «Transporte y alojamiento»: los vuelos o trenes de ida y vuelta (de pago), el alojamiento, los traslados, el coche de alquiler. (Este bloque no está en el diseño: hazlo igual que el de «Ruta», con su color propio.)
  2. «Ruta»: las entradas y las excursiones con precio, cada una con su nombre y, debajo, el día («Mié 11»). Sin el Free Tour (en el diseño sale con «propina orientativa»: eso NO se hace).
  3. «Útil para el viaje»: el seguro, la eSIM, la tarjeta… si tienen precio.
  4. «Extras»: lo que apunta el viajero a mano, con el campo del nombre («Cena el primer día»), el del importe (con la moneda, que se puede cambiar) y [Añadir]; cada uno con su ✕ para quitarlo, como en el diseño. Aquí van las propinas, las comidas, las compras…
- Un bloque sin nada no sale. Lo reservado sin precio no sale en el presupuesto (no es un gasto de 0).
- Con todo vacío: «Todavía no hay gastos» y, debajo, «Aparecerán aquí cuando añadas tus reservas con su precio. Y puedes apuntar tus extras.», y el bloque «Extras» para empezar.
- Las líneas de «Transporte y alojamiento», «Ruta» y «Útil» se tocan y abren su hoja para cambiar el precio (la misma de siempre). En el presupuesto no se reserva nada.
- Al final, «Total» otra vez, como en el diseño.
- Nunca un número inventado: solo lo que puso el viajero.
- Se guarda con el viaje.

7. PRUEBAS
- Las de siempre a 0 fallos (con la 6z).
- Una prueba 6z2: que el total del presupuesto sea siempre la suma exacta de lo que tiene precio; que lo que no tiene precio no sume; que el Free Tour no sume nunca; que en otra moneda se convierta con el cambio guardado; y 0 «€» escritos a mano en el código de lo que ve el viajero.
- A mano, a 375 px, gratis y de pago:
  - añadir una entrada con precio y otra sin precio;
  - el Free Tour, sin campo de precio;
  - una excursión con precio;
  - cambiar el precio y eliminar la reserva (y ver que cambia el presupuesto);
  - en la de pago, el vuelo con precio;
  - el alojamiento y lo del punto 4 (el seguro, la eSIM, el coche…), con precio;
  - un extra en otra moneda (por ejemplo, 800 MXN) y su cambio;
  - el presupuesto vacío y con todo, con el «por persona».
- Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z2 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
