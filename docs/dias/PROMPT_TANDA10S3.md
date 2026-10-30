Hola. TANDA 10S3: LO QUE HA ENCONTRADO ERIC EN EL REPASO DE LO GRATIS (30-oct): LA CIUDAD DE SALIDA, LOS RESULTADOS TAPADOS POR EL TECLADO, «HA CAMBIADO EL VIAJE» EN UN VIAJE PROPIO, LA HOJA DEL VUELO CON SUS DOS LADOS, LA RESERVA DEL FREE TOUR, LOS DÍAS EN CUADRADOS Y LAS FOTOS DEL ACORDEÓN. Va después de la 10S2 (ya hecha): si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas, salvo lo del apartado 5 (dímelo antes si hace falta más). No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S3.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Design:** el zip completo más nuevo, `RETOQUES.zip`, en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`). Lo de esta tanda: `Piezas/Vuelo Reservas` (02, 02b, 02c, 03 y 04) y `Piezas/Alojamiento Dias` (03 y 03b). **El diseño, exactamente igual; los textos y los datos, los de este prompt.**
- **Cómo trabajar:** hasta 4 agentes a la vez si va más rápido, un solo servidor, hasta 2 Chrome de prueba a la vez (las pruebas del Supabase real, solas y con cuentas fijas). Con menos de 6 GB libres, espera. Cierra todo lo que deje de hacer falta. La nota de estado (`docs/dias/_estado_10s3.md`) a la rama `estado` cada 30 minutos, también mientras corren las pruebas. No apagues el PC.
- **Las pruebas, solo las de lo que tocas** más `pruebaJutrip` (no la batería completa).
- **Eric sigue repasando la app mientras trabajas:** no cambies nada fuera de lo que pide esta tanda.

## 1. La ciudad de salida se confunde por el nombre
- **Lo que ve Eric:** desde «Barcelona» de Brasil hasta Roma salen los mismos tiempos y transportes que desde Barcelona de España.
- **La causa** (en `server/index.js`, `/api/transport-feasibility`): la tabla de tiempos de Roma busca la ciudad de salida **solo por el nombre** (`alias`), sin mirar el país.
- **Lo que pido:** que la tabla solo valga si coinciden **el nombre y el país** y, además, las coordenadas están cerca de las de la tabla (por ejemplo, a menos de 50 km). Si no coincide, la ciudad se trata como cualquiera que no está en la tabla (lo que ya se hace con ellas). Repasa que la caché (`place_content_cache`) no guarde ni devuelva lo de una ciudad para otra con el mismo nombre.
- Prueba los casos: Barcelona (España) y Barcelona (Brasil); Valencia (España) y Valencia (Venezuela); Córdoba (España) y Córdoba (Argentina); Mérida (España) y Mérida (México). Cada una con lo suyo.

## 2. Los resultados de la ciudad, tapados por el teclado
- **Lo que ve Eric** (en el iPhone, al escribir el origen con el teclado abierto): la lista de resultados sale arriba del todo, encima del logo, cortada y tapada por el botón «Volver a mi viaje». Casi no se ve (solo asoma «Barcelos»).
- **Lo que pido:** al tocar el campo (origen o destino), la tarjeta sube arriba de la pantalla y **los resultados salen justo debajo del campo, entre el campo y el teclado**, cada uno con **su bandera, la ciudad y el país** («Barcelona, España», «Barcelona, Brasil»), bien legibles y que se puedan tocar. Mientras se escribe, se esconde lo que estorba (el logo, «Volver a mi viaje», el mapa si hace falta). Al cerrar el teclado o elegir una ciudad, todo vuelve como estaba.
- Con el estilo de esta pantalla (no hay pieza de Design para esto).
- Compruébalo con el teclado abierto en 390 × 844 y 375 × 667 (simulando el alto que deja el teclado del iPhone, unos 300 px menos), con 1, 3 y 5 resultados: todos a la vista y ninguno tapado.

## 3. «Ha cambiado el viaje» en un viaje recién creado
- **Lo que ve Eric:** al crear un viaje nuevo con su cuenta y cargarse la ruta, salió la línea «(i) Ha cambiado el viaje». No había nadie más en el viaje y su otro móvil estaba cerrado.
- Esa línea es para cuando **otra persona** cambia un viaje compartido (`anfitrionDeCambios.ts`, `CompartidoHost`). **Sobre lo que hace uno mismo no debe salir nunca**, ni en un viaje compartido.
- **Encuentra la causa** (lo más probable: la app toma por cambios de otro sus propios guardados al montar la ruta) y dímela en palabras sencillas. **Arréglala de raíz**, no escondiendo la línea.

## 4. La hoja del vuelo (y del tren, el autobús y el barco), con sus dos lados
- **Para qué:** tener el viaje entero en la app, como en una tarjeta de embarque, y dejarlo preparado para los multidestinos.
- **Como `Piezas/Vuelo Reservas` 02, 02b, 02c, 03 y 04.** Fuera el recuadro de puntos amarillo «¿De dónde sales? · opcional / Sales a las». En su lugar, los dos lados, uno debajo del otro, con el avión (o el tren) en medio:
  - **Ida:** «Sales de» (opcional, **casilla en blanco para escribir**: la app no propone nada) · «Sale a las» (opcional) · «Llegas a» (Fiumicino o Ciampino en cuadrados; con tren, Roma Termini o Tiburtina) · «Llega a las» (obligatoria: monta el día 1).
  - **Vuelta:** «Sales de» (Fiumicino o Ciampino) y «Sale a las» (obligatorios: montan el último día) · «Llegas a» (opcional, para escribir) · «Llega a las» (opcional).
  - Con tren, autobús o barco, igual, con estaciones o puertos.
  - Lo demás de la hoja, como está: el día, la línea del pase, la referencia y la compañía, «¿Para quién es…?», el dinero y el botón de guardar.
- **Diferencias con Design:**
  - **En la hoja del tren, «¿Para quién es este tren?»** (Design pone «vuelo»), «Tu tren» y «Guardar el tren»; igual con autobús y barco.
  - **La línea del pase sin pase también en la Vuelta**, debajo de «Sale a las» (Design no la pinta en la 03). Con pase, sin línea, como siempre.
  - «Ref. del billete» y «Compañía» en tren y autobús, como dejó la 10S2.
- **El billete de DÍAS y HOY** (`Alojamiento Dias` 03 y 03b): con los dos lados si los puso («BCN 08:30 → FCO 11:15»); sin el de fuera, solo el de Roma («FCO 11:15»).
  - **Que nunca se corte la hora de llegada a Roma** (en el 03 de Design sale «BCN 08:30 → FCO 1…»): que quepa entera en 375 px; si no cabe en una línea, el lado de fuera arriba, pequeño, y «FCO 11:15» grande debajo.
  - **El código del lado de fuera:** si lo escrito lleva un código entre paréntesis, ese; si no, el código de la ciudad de salida del viaje (el mismo de la primera pantalla: «BCN», «MAD»). Nunca el texto largo («BARCELONA-EL PRAT»).
- Si hace falta guardar algo nuevo en la nube, migración nueva con su comprobación.

## 5. La reserva del Free Tour sigue el camino viejo
- **Lo que ve Eric** (viaje del 26 al 29 de noviembre, con el Free Tour ya en el jueves 26 por la mañana; lo reserva para el jueves 26 a las 21:00):
  1. **la parada se mueve** al final del día, después de la cena;
  2. **se lleva su franja «Mañana»** con el icono y el texto (sale «MAÑANA» después de la cena);
  3. al irse, **la tarde se queda vacía y la comida y la cena quedan juntas**;
  4. sale el mensaje **falso** «Para que tengas una buena experiencia en Roma, vamos a mover el día del Free Tour al día 1 (jueves 26 de noviembre), con tu reserva.» y, debajo, «Hemos puesto el día del Vaticano y Trastevere el viernes 27 de noviembre», cuando el Free Tour ya estaba ese día y no se mueve ningún día.
- **Las reglas que se salta** (`REGLAS_DE_LA_APP.md`): «Reservar una entrada con hora no mueve la parada de sitio: el viajero la coloca a su gusto» (10N10); «Se mueve solo la parada, nunca su franja»; «El Free Tour es una parada más, sin mover días».
- **La causa probable:** la reserva del Free Tour (`FreeTourSheet`) pasa por el plan de reservas del motor (`server/engine/reservationPlan.js`), que no recibió las reglas de la 10N10. Además, con el Free Tour, ese plan calcula el «antes» como si el viaje no lo llevara, y por eso dice que mueve días que ya estaban así.
- **Lo que pido:** reservar el Free Tour (o cambiarle la hora) funciona igual que reservar cualquier entrada: **la parada se queda donde está, con su hora nueva; ningún día se mueve; ningún mensaje de mover días; la franja nunca se mueve.** Repasa que ninguna otra reserva (entradas, excursiones) siga ese camino viejo y dime cuáles lo seguían.
- **Las horas del Free Tour:** hoy la hoja da seis horas fijas, las mismas todos los días (10:00, 12:00, 15:00, 17:00, 19:00 y 21:00). Dime de dónde salen. Si no son las horas reales del Free Tour que recomendamos, cámbialas por la rueda de la hora (la misma de las entradas), para que el viajero ponga la que ha reservado.

## 6. La reserva que no cuadra con su franja (sin pase)
- Con la regla de arriba, una reserva a las 21:00 puede quedarse en la Mañana. **Sin pase**, si la hora de la reserva no cuadra con la franja donde está la parada (Mañana hasta las 14:00, Tarde hasta las 20:00, Noche después; usa los cortes que ya tenga la app), debajo de la parada sale la línea gris del pase con su candado (`LineaDelPase`): «**Con el Pase Roma, tus reservas se colocan solas a su hora.**». Al tocarla, el aviso pequeño del pase, con ese mismo texto.
- **Con pase**, de momento, nada nuevo (la parada se queda donde está, sin línea): lo que hará el pase va en otra tanda.

## 7. Elegir un día, en cuadrados
- En «Free Tour · Elige día y hora», los días salen en **pastillas redondas** («Jue 26 · En tu ruta», «Vie 27», «Sáb 28»). Todo lo que se elige va en **cuadrados**: los días, con el mismo estilo que las horas de debajo, el elegido en azul oscuro con ✓ dorado.
- Repasa todas las hojas donde se elige un día con pastillas (entradas, excursiones, gastos…) y pásalas igual. Dime cuáles has cambiado. Añádelo a las reglas.

## 8. Las fotos del acordeón de DÍAS
- **Lo que ve Eric:** en el acordeón de los días, las paradas salen sin foto (la banda de color con el icono). Solo sale la del Desayuno romano. Dentro de cada parada (la ficha) las fotos sí salen. Antes salían en el acordeón.
- Encuentra desde qué versión pasa y por qué (mira también la tabla `errores_pantalla`), dímelo en palabras sencillas y arréglalo.

## 9. La foto del Castillo de Sant'Angelo de noche
- La foto de noche, **solo en la experiencia nocturna**. En las paradas de día, en la ficha, en EXPLORAR y en «Añadir parada», la foto de día. Repasa si hay otro sitio con foto de noche que salga donde no toca.

## 10. Un arreglo pequeño
- `docs/dias/CERRAR_SESIONES.sql` falla al ejecutarlo: `auth.refresh_tokens.user_id` es texto. Debe ser `user_id in (select id::text from cuenta)`. (Eric ya lo ejecutó corregido.)

## 11. La prueba
- Solo las pruebas de lo que tocas, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10S3`:
  - los ocho casos de ciudades del apartado 1;
  - los resultados con el teclado abierto en los dos tamaños, con bandera, ciudad y país, sin tapar ninguno;
  - un viaje nuevo con cuenta, sin nadie más, sin «Ha cambiado el viaje» (con el Supabase real, sola y con una cuenta fija); y con dos cuentas, el aviso de la otra persona como siempre (`pruebaTanda10N10_avisos_real`);
  - la hoja del vuelo con sus dos lados (avión y tren, ida y vuelta), lo opcional sin rellenar y rellenado, la línea del pase en la vuelta, «este tren»; el billete con los dos lados y solo con el de Roma, sin cortarse en 375 px, con el código de la ciudad de salida;
  - reservar el Free Tour a las 21:00 en su mismo día: la parada no se mueve, la franja tampoco, ningún día cambia y no sale ningún mensaje; lo mismo con una entrada;
  - sin pase, la línea gris debajo de la reserva que no cuadra con su franja; con pase, sin línea;
  - los días en cuadrados en las hojas de elegir día;
  - las fotos en el acordeón de un viaje nuevo;
  - la foto de día del Castillo fuera de la experiencia nocturna.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S3.html`, a tamaño de móvil, al lado de las de Design donde las haya.

## 12. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10S3»: la causa de cada fallo en palabras sencillas, qué pruebas has pasado y si hace falta migración (con su comprobación).

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta, con pase o sin él) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10S3.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
