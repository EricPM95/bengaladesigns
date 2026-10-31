Hola. TANDA 10S8: RESERVAS COMO EL DISEÑO NUEVO (VUELO, ENTRADAS Y ALOJAMIENTO), LOS DOCUMENTOS SOLO CON EL PASE Y LEER DOCUMENTOS SIN ABUSOS (31-oct). Va después de la 10S7c (ya hecha). No toques el motor de rutas, salvo el módulo nuevo de la 10S7c (`shared/routeEngine/adaptarDiaVuelo.js`, apartado 0b): si lo tocas, la muestra de 60 fechas tiene que salir idéntica.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S8.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Migraciones aplicadas por Eric:** todas hasta la **0072**. Si hace falta una nueva, con su `COMPROBAR_…sql`; si toca una tabla con datos de una persona, la regla de `CLAUDE.md` (empezar_de_cero desde la 0072, `pruebaTanda10J`).
- **Design:** el zip más nuevo, `RETOQUES.zip`, en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` (sin `uploads/` ni `Archivo/`). Cambian tres piezas: `Piezas/Billete Reservas` (B1b, B1c, B1d, B2, B2b, B2c, B3, B4; la B1 sola está vieja: vale la B1b), `Piezas/Entradas Billete` (E1 a E5, A1, A1p, A2, A2p, A3) y `Piezas/Vuelo Reservas`. **El diseño, exactamente igual; los textos y los datos, los nuestros y los de este prompt.**
- **Cómo trabajar (Eric quiere esta tanda rápida):** los 4 agentes a la vez, repartiendo los apartados; un solo servidor; hasta 2 Chrome de prueba a la vez. Nada de batería completa: solo las pruebas de lo tocado y `pruebaJutrip`. Si un apartado se complica, déjalo a medias, dímelo y sigue. Dime al empezar cuánto calculas que vas a tardar. La nota de estado (`docs/dias/_estado_10s8.md`) a la rama `estado` cada 30 minutos, de principio a fin. No apagues el PC.

## 0b. Respuestas a tus dudas de la 10S7c
- **Gracias por arreglar las listas de la 10S5 a la 10S7b.** En esta tanda, la lista de comprobación tiene que ser la de ESTE prompt: añade a la prueba una comprobación de que `REPASO_10S8.html` tiene sus apartados. **De la 10S7 faltan dos apartados** que no llegaron a tu prompt (están abajo, en el 1 y en el 4): leer documentos con sesión y límite, y el bloque de entradas en claro.
- **Los imprescindibles que no caben: aviso solo de los grandes**: el Coliseo con el Foro y el Palatino, el Vaticano (Museos y San Pedro) y la Galería Borghese (la lista, en un sitio fácil de cambiar, por destino). Uno por línea, como ahora («El Coliseo no cabe el jueves.» [Pasarlo a otro día]). **Los demás que no caben, en una sola línea debajo:** «**Y 4 sitios más pasan a “Si te sobra tiempo”.**» [Ver], que lleva a esa sección del día. Si no hay ninguno grande, solo esa línea. Nada se esconde y no salen seis avisos.
- **El orden al adaptar un día corto** (solo en `adaptarDiaVuelo.js`): primero los sitios que cierran (el Panteón, que cierra a las 19:00, antes que el Arco de Constantino o la Fontana delle Tartarughe, que se ven a cualquier hora); los que se ven a cualquier hora, al final, porque caben aunque se haga tarde. Así, con llegada a las 16:30, entra el Panteón. La muestra de 60 fechas, idéntica (la ruta normal no usa este módulo).
- **Una comida quitada porque cae antes de la llegada:** si la siguiente comida (la cena) queda dentro del día, que se quede; no hace falta recolocar la que se quitó.
- El último día de ciudad con día de vuelta, como lo dejaste.

## 1. Leer un documento cuesta dinero: solo con sesión, con el pase y con límite (urgente)
- Hoy `POST /api/read-ticket` (`server/billete/lectura.js`, con `claude-sonnet-4-6`) **lo puede llamar cualquiera, sin cuenta y sin límite**, y desde la 10S7 también lee entradas y reservas de hotel. Cada llamada nos cuesta dinero.
- Que solo funcione: **con sesión iniciada**; **con el pase** (de esa persona o el de grupo del viaje: apartado 2); con un **límite por cuenta** de 10 lecturas al día (al pasarse: «Has leído muchos documentos hoy. Puedes añadir los datos a mano.»); y con un **tope de tamaño** del archivo (por ejemplo, 10 MB; si es mayor: «El archivo es demasiado grande. Prueba con una captura.»). Sin sesión o sin pase, el servidor responde con error y no llama a Claude.
- **Primero el código de barras, gratis:** lee en el móvil el código de la tarjeta de embarque (PDF417, Aztec, QR); si ya trae los datos (vuelo, fecha, asiento, localizador), no llames a Claude. Dime en qué casos basta.
- **Dime cuánto cuesta cada lectura** (con `logCallCost`) y prueba si `claude-haiku-4-5` lee igual de bien con 3 ejemplos (una tarjeta de embarque, una entrada y una reserva de hotel). Si lee igual, usa Haiku.

## 2. Los documentos, solo con el pase (regla nueva)
- **Gratis:** poner el vuelo (horas, aeropuertos, precio), el alojamiento (hotel, fechas, precio) y las entradas (día, hora, para quién, precio). **Con el pase:** añadir el documento (la tarjeta de embarque o el billete, la entrada, la reserva del hotel), que la app lo lea, y tenerlo con su código y sin internet.
- **Sin pase**, los botones [Añadir tarjeta de embarque] / [Añadir tu billete], [Añadir tu entrada] y [Añadir tu reserva] llevan el **candado dorado en su círculo azul noche**, como en Design. Al tocarlos, **el aviso pequeño de siempre** del pase:
  - vuelo: «Con el Pase Roma, guardas tu tarjeta de embarque y la tienes a mano en el aeropuerto, aunque no haya internet.» (tren, autobús y barco: «tu billete», «en la estación»);
  - entrada: «Con el Pase Roma, guardas tu entrada y la tienes a mano en la puerta, aunque no haya internet.»;
  - alojamiento: «Con el Pase Roma, guardas tu reserva y tienes la dirección, las horas y el teléfono a mano, aunque no haya internet.»;
  - y [Ver el Pase Roma].
- **Con el pase, nunca hay candado** (Design pinta el candado en la A1p, con pase: es un error).
- **Viaje compartido:** el pase de grupo cubre a los invitados, como el resto del pase.
- **Lo que ya esté guardado se sigue viendo** aunque no haya pase (o se haya acabado): es suyo. Lo que no se puede sin pase es añadir uno nuevo.

## 3. «Llegada y vuelta» como Design (`Billete Reservas` B1b, B1c, B1d, B2, B2b, B2c, B3 y B4)
- **Por bloques:** el día y las horas; los datos (con documento); el código con «Toca para ampliar»; y abajo del todo, el precio.
- **Cada lado (Ida y Vuelta) con su botón** [Añadir tarjeta de embarque] y **su papelera roja abajo a la derecha**, que quita ese lado (con la confirmación de hoy). La tarjeta de la vuelta es otra (otro check-in).
- **Sin tarjeta:** la hora grande y el trayecto. Fuera la duración calculada, «Desde el PDF, una foto o una captura.» y «Cambiar los datos».
- **Los dos lápices (44 × 44):**
  - el de arriba, junto al día: abre la hoja del vuelo de siempre (horas, aeropuertos);
  - el del bloque de datos (con tarjeta): abre «**Datos del vuelo**» (B2b: vuelo, horario, terminal, asiento, localizador) y [Guardar los datos]. **Las horas de «Datos del vuelo» y las de la hoja del vuelo son el mismo dato:** cambiar una cambia la otra.
- **El precio, en su fila, abajo del todo del bloque** (debajo de la Vuelta): «€ **Precio total** · 180 €» con su lápiz (B1b, B1c). Si solo hay ida: «**Precio** · 180 €» (B1d). El lápiz abre una hoja pequeña con el precio. En esa hoja y en la del vuelo, debajo de «¿Cuánto ha costado en total?», en gris: «**Si compraste la ida y la vuelta por separado, pon la suma.**». El precio va al presupuesto como hoy («Vuelo a Roma»).
- **La Ida plegada (B2c):** cuando ya ha pasado el día de la ida, la Ida se queda en una línea y al tocarla se abre. **Con la llegada, que siempre está:** «Jueves 26 · 11:25 · Fiumicino» (Design pone la salida, «08:30 · El Prat», que es opcional y puede no estar).
- **Si la tarjeta no cuadra con lo puesto:** al leerla, si la hora es otra: «**Tu tarjeta dice que llegas a las 11:25. ¿Actualizamos la hora de tu vuelo?**» [Sí, actualizar] [No] (en la vuelta, «…que sales a las 18:10…»). «Sí» guarda la hora y, con el pase, sale la alerta de la 10S7b («¿Adaptamos tu primer y tu último día a tus vuelos?»). Si la fecha es otra: «Tu tarjeta es del viernes 27 y tu vuelo está el jueves 26. Revisa las fechas.» (sin cambiar nada solo).
- **Tren, autobús y barco**, igual (B3), con «Tren 03180», «Coche 003», estaciones o puertos.
- **Nada partido:** «Vuelo VY 6102» y el título «Entradas y Free Tour» en una línea en 375 px (en la vista de Design se parten).
- B4 (el código a pantalla completa), como Design.

## 4. «Entradas y Free Tour» como Design (`Entradas Billete` E1 a E5)
- **El bloque, en claro**, igual que «Llegada y vuelta» y «Alojamiento» (hoy sale en azul oscuro: error de Eric al aprobarlo).
- **Cada entrada:** «En tu ruta» pequeño arriba (o «Ya no está en tu ruta», como hoy), el sitio grande, el día («Viernes / 27 de noviembre») y la hora (09:15, en el cuadro azul noche), para quién (en redondo), el precio, el botón [Añadir tu entrada] y la papelera (E1). Con la entrada: el localizador, el código con «Toca para ampliar» y la papelera (E2). E3 a pantalla completa. E4 en HOY con pase («Tu entrada»).
- **Los dos lápices (44 × 44), como Design:**
  - el de arriba, junto al nombre: el sitio, el día y la hora;
  - el del bloque de datos (arriba a la derecha del bloque, a la altura de «para quién»): abre todo lo del bloque: para quién, precio y, con documento, los datos leídos («**Datos de la entrada**», E5, con [Guardar los datos]).
- **En «Datos de la entrada», fuera «2 personas»:** ya lo dice «para quién es».
- **El Free Tour, con el mismo estilo** que una entrada.

## 5. El alojamiento como Design (`Entradas Billete` A1, A1p, A2, A2p y A3)
- El nombre grande, las fechas («Jueves 26 → Domingo 29», «26 – 29 de noviembre») y las noches (el cuadro azul noche), para quién, el precio; con el pase, la zona y [Cómo llegar a tu alojamiento]; el botón [Añadir tu reserva] y la papelera. Con la reserva: la dirección, «Entrada desde las 15:00 · Salida hasta las 11:00», el teléfono y el localizador. Los dos lápices, como en las entradas; el del bloque abre «**Datos de la reserva**» (A3).
- **Diferencias con Design:**
  - **«Listo» en cuanto el hotel está puesto** (A1 dice «Falta»): el documento es un extra, y del pase. Igual que el vuelo, que sin tarjeta dice «Listo»;
  - **con pase, sin candado** (A1p);
  - **la dirección, una sola vez** (A2p la pone dos veces): «Zona Monti · Via Cavour 12» con la zona nuestra y la dirección de la reserva (si no hay reserva, la que haya puesto el viajero). La zona, la de verdad de nuestros datos (en Design, «Prati» con Via Cavour no cuadra);
  - **en «Datos de la reserva», cada casilla con su nombre:** «Teléfono» y «Localizador», como «Dirección»;
  - la A2 «sin pase» es el caso del pase ya terminado: lo guardado se ve (apartado 2).
- Quién ve qué en un viaje compartido, como dejó la 10S7b (el localizador y el documento, solo quien lo añadió).

## 6. Para todo RESERVAS
- **La papelera roja abajo a la derecha** sustituye a «Eliminar vuelo», «Eliminar alojamiento» y «Quitar entrada».
- **Las cabeceras de los bloques, sin línea de texto debajo del título.** Sí el estado («Listo», «Falta», «1 de 8 reservadas»).
- **Las fechas enteras** en las tarjetas («Sábado 31», «Viernes 27 de noviembre»).

## 7. La prueba
- Solo las pruebas de lo que tocas, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10S8`:
  - `read-ticket` sin sesión → error, sin llamar a Claude; con sesión y sin pase → error; con pase → lee; la lectura 11 del día → el texto del límite; un archivo de 15 MB → el texto del tamaño;
  - sin pase: los tres botones con candado y su aviso; con pase: sin candado; un documento guardado se sigue viendo sin pase;
  - el vuelo: cada lado con su botón y su papelera; el precio abajo («Precio total» y, solo con ida, «Precio»); los dos lápices; cambiar la hora en «Datos del vuelo» la cambia en la hoja del vuelo; la Ida plegada con la llegada; la pregunta de la hora con una tarjeta que dice otra hora; «Vuelo VY 6102» en una línea a 375 px;
  - las entradas en claro, como E1 y E2, sin «personas» en su hoja; el Free Tour con el mismo estilo;
  - el alojamiento: «Listo» sin reserva;
