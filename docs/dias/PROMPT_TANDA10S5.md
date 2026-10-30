Hola. TANDA 10S5: EL BILLETE EN RESERVAS (LA TARJETA DE EMBARQUE CON SU CÓDIGO), «SALES DE» RELLENO DE PARTIDA, «PROPÓN UN SITIO» Y RETOQUES DEL REPASO DE ERIC (30-oct). Va después de la 10S4 (ya hecha): si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas (si hace falta, dímelo antes). No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S5.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Design:** el zip completo más nuevo, `RETOQUES.zip`, en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`). Lo nuevo: `Piezas/Billete Reservas` (B1, B2, B3, B4, P1, P2 y P3). **El diseño, exactamente igual; los textos y los datos, los de este prompt.**
- **Cómo trabajar (Eric quiere las tandas rápidas):** usa los 4 agentes a la vez, repartiendo los apartados que no se pisan; un solo servidor; hasta 2 Chrome de prueba a la vez (las del Supabase real, solas y con cuentas fijas). Con menos de 6 GB libres, espera. Nada de batería completa: solo las pruebas de lo tocado y `pruebaJutrip`. Si un apartado se complica más de la cuenta, déjalo a medias, dímelo en el informe y sigue con los demás. Dime al empezar cuánto calculas que vas a tardar. **La nota de estado (`docs/dias/_estado_10s5.md`) a la rama `estado` cada 30 minutos, de principio a fin** (en la 10S4 se quedó en las 14:52 durante toda la tanda: que no vuelva a pasar). No apagues el PC.
- **Eric sigue repasando la app mientras trabajas:** no cambies nada fuera de lo que pide esta tanda.

## 1. Respuestas a tus dudas de la 10S4
- **El «Me gusta» de 30 px:** zona de toque de 44 × 44, sin cambiar lo que se ve.
- **«Añadir parada» (y `AttractionsFinder`) buscan en el mapa (Mapbox):** que busquen **primero en nuestros sitios** (con su foto, horario, entrada e historia), con la forma de buscar de la 10S4 (sin acentos, a medias, con erratas, en italiano), y **debajo**, con el título «Otros sitios», lo del mapa. La ciudad de salida sigue con el mapa (puede ser cualquier ciudad del mundo).
- **Un sitio con entrada dos veces en la ruta** (la Cúpula añadida el jueves con [Añadir otra reserva] y ya en la ruta el viernes): **se deja añadir**, y la entrada sale **reservada en las dos paradas**. El viajero quita la que no quiera.
- **Los botones flotantes, sin pisarse nunca (regla nueva, a `REGLAS_DE_LA_APP.md`):** el de logros, siempre fijo abajo; encima de él, cuando toque, el lápiz (la propuesta) o, más adelante, el de reorganizar del pase. En columna, con su espacio, nunca uno tapando a otro. Y **ninguna pantalla deja contenido debajo de ellos**: espacio abajo para que no tapen nada (hoy tapan el borde de «Extras» en el presupuesto). Repasa todas las pantallas con botones flotantes.

## 2. Retoques pequeños
- **Presupuesto:** la línea del vuelo dice «Ida a Roma» y es el vuelo entero (ida y vuelta): «**Vuelo a Roma**» (con tren, «Tren a Roma»; autobús y barco, igual).
- **Las fechas, enteras en las listas (regla nueva):** en el presupuesto, en RESERVAS y donde se lea una fecha en una lista o una tarjeta: «**Viernes 27**», «Jueves 13», no «Vie 27» ni «sáb 31». Solo en los cuadrados de elegir día, donde no cabe, se queda corto.
- **Los días de elegir, a todo el ancho:** en «Reserva · Elige día y hora» (y en todas las hojas donde se elige un día), los días ocupan todo el ancho, repartidos a partes iguales. Si no caben en una fila, en dos.
- **En la hoja de una reserva escrita a mano** (que no va a la ruta) sale «Recuerda revisar la disponibilidad antes de añadirlo a tu ruta.»: que diga «**Recuerda revisar la disponibilidad antes de reservar.**».

## 3. «Propón un sitio» (`Billete Reservas` P1, P2 y P3)
- **El texto** cuando el sitio no está en nuestra lista (en [Añadir otra reserva]): «**Este sitio aún no está en JUTRIP. Ayúdanos a añadirlo desde aquí.**», con «aquí» subrayado como enlace (P1).
- **Al tocar «aquí», la hoja «Propón un sitio»** (P2): «Nombre del sitio» ya escrito con lo que puso, «¿Algo más que debamos saber? · opcional» y [Enviar]. Al enviar, P3: «Gracias. Lo revisamos y, si encaja, lo añadimos.».
- **Que funcione de verdad:** lo enviado se guarda en el servidor (el nombre, el comentario, el destino, la fecha; sin datos privados), en una tabla nueva (migración nueva, con su comprobación `COMPROBAR_…sql` que devuelva «Aplicada» o «FALTA»). Dime cómo lo verá Eric (una consulta para el SQL editor). Esta hoja servirá más adelante para el botón de proponer sitios y avisar de errores: hazla para que se pueda abrir desde cualquier sitio.

## 4. El billete en RESERVAS (`Billete Reservas` B1, B2, B3 y B4)
- **Para qué:** que el viajero tenga a mano en el aeropuerto o la estación su tarjeta de embarque (o su billete) con el código que escanean, y todos sus datos.
- **Gratis:** guardar el billete en RESERVAS es gratis (es consulta). **Con el pase:** HOY lo enseña solo el día del viaje, en la tarjeta del billete de siempre («Tu billete, siempre a mano»), con su código, sin buscarlo.
- **Antes de añadirlo (B1):** el bloque de la Ida (o de la Vuelta) como ahora y el botón **[Añadir tarjeta de embarque]** (avión) o **[Añadir tu billete]** (tren, autobús y barco: el código suele llegar al comprarlo, sin check-in). Debajo, en gris: «Desde el PDF, una foto o una captura.».
- **Cómo se añade:** el PDF del correo, una foto o una captura. La app lo lee (aprovecha lo que ya hace «Rellenar desde el email o el PDF») y **rellena sola todos los datos que encuentre**: nº de vuelo o de tren, compañía, localizador, las horas y los aeropuertos o estaciones de los dos lados, terminal, asiento (tren: coche y asiento). **La duración la calcula la app** con las dos horas (con avión, teniendo en cuenta la hora de cada país; si no se sabe, sin duración). El viajero lo revisa y puede cambiar cualquier dato a mano. Se puede añadir en dos veces: primero la reserva (datos) y, después del check-in, la tarjeta de embarque (el código).
- **Con el billete (B2 y B3):** las dos horas grandes, el trayecto, y los datos en su fila con su nombre («Vuelo VY 6102», «1 h 55 min», «Terminal 1», «Asiento 14C», «Localizador ABC123»; en tren, «Tren 03180», «3 h 2 min», «Coche 003», «Asiento 01D»). Solo los datos que haya. Y el código en pequeño con «Toca para ampliar».
- **El código a pantalla completa (B4):** fondo blanco, el código grande, el trayecto y la hora arriba, «Asiento 14C · Vuelo VY 6102» abajo, y la ✕. Si la app puede leer el código (QR, Aztec, PDF417), que lo vuelva a dibujar grande y nítido; si no, la imagen recortada del código, lo más grande posible. (Desde la web no se puede subir el brillo del móvil: no lo intentes.)
- **Privado:** el billete es de cada persona. En un viaje compartido, cada uno ve solo el suyo (y nadie más ve su PDF ni su código). Si hace falta guardar el archivo en el servidor, en un sitio privado de esa persona (migración con su comprobación).
- **Sin internet:** el billete (los datos y el código) se tiene que ver aunque no haya conexión en el aeropuerto: como mínimo, guardado en el móvil. Dime cómo lo has hecho.
- **Diferencias con Design:**
  - **la cabecera «Llegada y vuelta», sin la línea de debajo del título** (Design aún pinta «Barcelona → Roma»): como dejó la 10S4;
  - **el precio dentro** («Precio · 150 €», con «Cambiar»), como dejó la 10S4 (Design no lo pinta);
  - **en la B1, primero [Añadir tarjeta de embarque] y «Eliminar vuelo» al final**, abajo a la derecha (Design lo pone encima del botón);
  - **las fechas enteras** («Sábado 31», no «sáb 31»).

## 5. El trayecto y «Sales de»
- **Debajo de la hora, el trayecto**, con la ciudad y el aeropuerto (o la estación) entre paréntesis, como en la B1 y la B2: Ida «**Barcelona → Roma (Fiumicino)**»; Vuelta «**Roma (Ciampino) → Barcelona**». Si el viajero ha puesto su aeropuerto o estación de fuera, también entre paréntesis («Barcelona (El Prat) → Roma (Fiumicino)»). Fuera «Fiumicino · Roma».
- **«Sales de» (Ida) y «Llegas a» (Vuelta), rellenos de partida** con la ciudad de salida del viaje (la de la primera pantalla). Si esa ciudad tiene **un solo aeropuerto** (o, en tren, una sola estación principal sin duda), también entre paréntesis: «Barcelona (El Prat)». Si tiene varios (Londres, Milán, París, Nueva York…), solo la ciudad, y el viajero añade el suyo. Siempre se puede cambiar. Dime de dónde sacas qué aeropuertos tiene cada ciudad (una lista de datos abiertos, por ejemplo).
- **La hora de salida sigue siendo opcional.** Sin ella, el bloque sale como la B1 («Llegas a las 11:25»); con ella, como la B2 (las dos horas).

## 6. La prueba
- Solo las pruebas de lo que tocas, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10S5`:
  - «Añadir parada» con «coliseo»: primero el nuestro, debajo «Otros sitios»;
  - los botones flotantes sin pisarse y sin tapar contenido (presupuesto, RESERVAS, DÍAS, EXPLORAR), en 375 × 667 y 390 × 844;
  - «Vuelo a Roma»; las fechas enteras en el presupuesto y en RESERVAS; los días a todo el ancho con 3 y con 7 días;
  - «Propón un sitio»: el texto con «aquí», la hoja, el envío guardado en el servidor y el «Gracias»;
  - el billete: añadir un PDF de ejemplo (avión) y una captura de ejemplo (tren) → los datos rellenados, el código en pequeño y a pantalla completa; sin billete, la B1 con el botón y «Eliminar vuelo» al final; en un viaje compartido, el otro no ve el billete; el billete con el móvil sin conexión; con pase, en HOY el día del viaje;
  - el trayecto con paréntesis en la Ida y la Vuelta; «Sales de» relleno con «Barcelona (El Prat)» desde Barcelona, solo «Londres» desde Londres.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S5.html`, a tamaño de móvil, al lado de las de Design.

## 7. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10S5»: qué has hecho, en palabras sencillas, qué pruebas has pasado y qué migraciones hay que aplicar (con su comprobación).

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta, con pase o sin él) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10S5.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
