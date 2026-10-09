Tanda 6t: la barra y la ventana de llegada y de vuelta (Resumen · Traslados · Tips). Va todo en este mensaje. Empieza cuando esté subida la 6s. No cambia cómo se montan los días.

Es la barra de llegada y de vuelta de DÍAS (`ArrivalReturnBar.tsx`) y la ventana que se abre al tocarla (`ArrivalReturnSheet.tsx`, con los datos de `data/dias/roma/_llegada.json`).

1. FUERA LAS FUENTES
- En la ventana no se enseña ningún «Fuente» ni ningún enlace a la fuente: ni en las formas de llegar, ni en los bloques (la estación, la consigna, la maleta), ni en los Tips.
- Los datos se quedan como están en `_llegada.json`: la página de revisión los sigue usando. Solo dejan de verse en la app.

2. FUERA «TU PRIMERA PARADA»
- La sección «Tu primera parada» de la llegada sale de la ventana.

3. LA PESTAÑA «TRASLADOS»
Cuándo sale:
- en Fiumicino, Ciampino y Civitavecchia, a la llegada y a la vuelta;
- no en tren, autobús ni coche (ya estás en la ciudad, o vas en tu coche);
- solo si ese punto tiene enlace de traslado en los datos (punto «Los enlaces»).
Con el punto elegido en RESERVAS (versión de pago), el traslado de ese punto. Sin elegir, los de todos los puntos de ese medio.

Lo que lleva, de arriba abajo:
- El texto. A la llegada:
  «¿Vienes en familia, en grupo o en pareja y quieres aprovechar {destino} al máximo? Con un traslado privado te recogen y te llevan directo adonde tú quieras: al centro de la ciudad o a la puerta de tu alojamiento. Sin colas, sin trasbordos y sin cargar con las maletas.»
  A la vuelta:
  «El último día, sin trasbordos ni maletas por el metro: un traslado privado te recoge en tu alojamiento y te lleva directo a {punto}. Ideal si vais en familia, en grupo o en pareja.»
  `{destino}` y `{punto}` salen de los datos: nada de Roma escrito en el código.
- Debajo, una tarjeta por punto, con el estilo de la tarjeta de entrada de RESERVAS:
  - arriba, en pequeño, «TRASLADO PRIVADO»;
  - el título: «De Fiumicino a tu alojamiento» (a la vuelta, «De tu alojamiento a Fiumicino»);
  - una línea pequeña: «Puerta a puerta · sin trasbordos»;
  - el botón [Reservar traslado]. Abre el enlace en otra pestaña, con el aviso corto «Abriendo la tienda de traslados…», y lleva nuestro código de afiliado y la campaña del viaje (como los demás enlaces: `stampCivitatis` / `CampaignLinks`).
- Sin precio, salvo que el dato sea real y del mismo enlace (como en las entradas). Fuera el precio de ejemplo de ahora (45 €, de otro proveedor).
- Nunca el nombre del proveedor.

Los enlaces:
- Van en `_llegada.json`, en cada punto: `traslado: { url }`. El campo `privado` de ahora (con `url_afiliado: '#'`) se cambia por este.
- Los enlaces directos de cada traslado los pondrá el usuario.
- Mientras no estén, usa el buscador con nuestro código (`civitatisSearchUrl`):
  - «traslado aeropuerto fiumicino roma»;
  - «traslado aeropuerto ciampino roma»;
  - «traslado puerto civitavecchia roma».
  Así la pestaña sale ya. Dime en el informe qué devuelve cada búsqueda.

El orden de las pestañas: Resumen · Traslados · Tips.

4. LA BARRA DE LLEGADA Y DE VUELTA, NUEVA (en DÍAS)
El diseño está en docs\diseno\llegadas\Dia 1 Reservas.dc.html: es la opción «1b · Línea y pase azul» (la 1a no se hace). Del diseño se copia lo visual: la barra blanca con el borde azul suave, el bloque azul con la diagonal y el icono del medio a la izquierda, dos líneas de texto y el botón azul redondo a la derecha. Los textos son estos, no los del diseño.

La barra de llegada:
- De pago, sin hora:
  - arriba, en pequeño: «LLEGADA · DESDE BARCELONA» (su origen);
  - abajo: «Añade tu vuelo y ajustamos tu día» («tu tren», «tu autobús», «tu barco», según el medio);
  - el botón [+ Vuelo] ([+ Tren]…), que lleva a RESERVAS, a la ida.
- De pago, con hora (puesta en RESERVAS o en la ventana):
  - fuera el texto «Añade tu vuelo…» y el botón [+ Vuelo];
  - arriba: «LLEGADA · FIUMICINO» (el punto elegido);
  - abajo: «Cómo llegar desde Fiumicino»;
  - a la derecha, la pastilla verde «✓ 11:20» (la hora que puso el viajero).
  - Nada de «libre…» (en el diseño pone «libre 13:20»: no se hace, punto 5).
- Gratis:
  - arriba: «LLEGADA · DESDE BARCELONA»;
  - abajo: «Cómo llegar a Roma» (`{destino}`);
  - sin botón [+ Vuelo] ni pastilla. Solo la flecha «›».
- Coche (en las dos versiones): «LLEGADA · EN COCHE» y «La ZTL y dónde aparcar», sin botón ni hora.

La barra de la vuelta, igual:
- de pago, sin hora: «VUELTA · A BARCELONA», «Añade tu vuelo de vuelta y ajustamos tu día» y [+ Vuelo] (lleva a RESERVAS, a la vuelta);
- de pago, con hora: «VUELTA · CIAMPINO», «Cómo llegar a Ciampino» y la pastilla «✓ 18:05»;
- gratis: «VUELTA · A BARCELONA» y «Cómo volver al aeropuerto» («a la estación», «al puerto»), sin botón.

En todas, al tocar la barra (fuera del botón), se abre la ventana de llegada o de vuelta, como ahora.

Dentro de la ventana, la fila «Sin vuelo añadido · + Añadir vuelo»:
- en la gratis no sale;
- en la de pago sale solo sin hora; con hora, queda solo «Editar».
- Ojo: «En el centro {hora}», que sale en esa fila, se va (punto 5).

4b. LA FILA DEL ALOJAMIENTO DEL DÍA 1, SOLO EL ASPECTO
En el mismo diseño (opción 1b), encima de la barra, está la fila del alojamiento: el icono de la cama en un círculo, el texto en cursiva («Añade alojamiento en Roma», con la línea pequeña debajo) y el botón redondo «+» a la derecha; ya puesto, el ✓ verde redondo.
- Cambia solo cómo se ve la fila de alojamiento que ya hay en el día, para que quede así.
- Lo que hace y sus textos, como ahora: los hoteles se tocarán más adelante.

5. NINGUNA HORA QUE PONGAMOS NOSOTROS (a INVARIANTES, todos los destinos)
La app no promete nada que no dependa de ella: si el vuelo se retrasa, esa hora es mentira. Así que:
- Fuera de toda la app las horas que calcula la app a partir del vuelo, el tren o el barco:
  - «En el centro {hora}»;
  - «libre hacia las {hora}» (también en la línea cerrada de llegada y vuelta de RESERVAS de la 6s);
  - «Sal a las {hora}»;
  - la tabla «Tu última tarde, sin prisas» con «Libre hasta / Maleta a las / Sal a las»: se queda solo su texto general (`ultima_tarde`), sin horas.
  - Y cualquier otra del mismo tipo que encuentres (en la barra, en la ventana, en RESERVAS, en HOY o en los avisos). Dime cuáles eran.
- Sí se enseñan:
  - las horas que pone el viajero (la de su vuelo, la de su reserva);
  - los datos reales y comprobados: lo que se tarda («32 min, sin paradas»), la frecuencia, el precio, los horarios, la distancia («32 km al centro»), «De Fiumicino al centro»… Esos textos se quedan como están, con su «centro».
- Por dentro, la app puede seguir usando esas horas para montar el día (lo hará la Tanda 7). Solo dejan de enseñarse.
- «Centro» sí vale cuando es un sitio real: en los datos de cómo llegar y en el texto del traslado («al centro de la ciudad»), porque es adonde te lleva. Lo que no se pone es «centro» como hora o promesa nuestra.

6. FUERA LOS BOTONES DEL PUNTO DENTRO DE LA VENTANA
- Los botones Fiumicino / Ciampino que salen dentro de la ventana con la hora puesta se quitan: el punto se elige en RESERVAS (6s).
- En la ventana, con el punto elegido, solo ese punto y «¿Llegas por otro sitio? Ver Ciampino» (6s).

7. PRUEBAS
- Las de siempre a 0 fallos (6g, 6h, 6i, 6j, 6k, 6l, la de la 6o, la 6r, la 6s y pruebaListas).
- Una prueba 6t que compruebe, en la ventana:
  - 0 «Fuente»;
  - 0 horas calculadas por la app («En el centro», «libre hacia», «Sal a las», «Libre hasta», «Maleta a las»), también en RESERVAS y en la barra;
  - 0 «Tu primera parada»;
  - la pestaña Traslados solo en Fiumicino, Ciampino y Civitavecchia;
  - 0 «Añadir» ni «+ Vuelo» en la gratis;
  - con hora, 0 «Añade tu vuelo» y 0 «+ Vuelo» en la barra.
- A mano, a 375 px y en el ordenador, gratis y de pago:
  - llegada y vuelta en avión (Fiumicino y Ciampino), tren, autobús, barco y coche;
  - con y sin hora;
  - el botón [Reservar traslado], que abre el enlace con el aviso.
- Capturas en el informe.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6t en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
