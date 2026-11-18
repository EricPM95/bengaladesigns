Hola. TANDA V9: LOS LOGROS (18-nov). Va después de la V8. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Design:** el zip `ULTIMOS_RETOQUES.zip` (Descargas). Lleva también lo de otras tandas: aquí solo lo de los logros. Pon al día `docs/diseno/proyecto/`, sin `uploads/` ni `Archivo/`. El diseño, exactamente igual; los textos, los de este prompt; si no coinciden, manda el prompt.
- **Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v9.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción. Para todos los destinos igual.
- **Regla de Eric para toda la tanda: aire entre bloques,** más que el que deja Design, para que todo se vea limpio.

## 1. Que Logros abra al instante
- **Hoy, cada vez que se toca el botón de logros,** tarda unos 2 segundos con «Un momento…»: la app vuelve a pedirlo todo al servidor y no enseña nada hasta que contesta.
- **Que abra al instante, como el Perfil:**
  - guarda en el móvil lo último que se vio de los logros (por viaje y en «Todos mis logros»);
  - al abrir, enséñalo enseguida;
  - lo nuevo llega por detrás y cambia solo lo que cambie, sin parpadeos;
  - al abrir el viaje, pide ya los logros por detrás, para que la primera vez tampoco haya espera.
  - «Un momento…» solo la primera vez en un móvil nuevo, y como el esqueleto gris de siempre, no como texto.
- **Mide cuánto tarda el servidor** en contestar los logros (y por qué 2 segundos) y bájalo si se puede (menos lecturas, solo lo que hace falta). Dime el antes y el después.
- **Para todos los destinos igual,** también en la hoja de logros del viaje y en la vitrina.

## 2. La hoja «Tus logros en …» (Design: hoja de logros del viaje)
- **Fuera «Para tu próximo viaje a …»** de debajo de cada colección.
- **Arriba, las colecciones con algún pedazo:** la insignia, el nombre, «1 de 7» y su barra.
- **Al final, las que están a 0, juntas en un bloque plegado:** «Más colecciones de Lanzarote (5) ›». Al abrirlo, las mismas filas. Si todas están a 0, sin plegar.
- **La medalla y «Te quedan 6 para el diamante», en una sola tarjeta:** la medalla, su barra y «Te quedan 2 para la plata · 6 para el diamante».
- **Arriba:**
  - [Reclamar con tus fotos] con su plazo, **también durante el viaje** (Design lo quitó en la versión «en curso»: ponlo igual que en la de «terminado», con «Puedes reclamar hasta el 13 de diciembre»);
  - y la tarjeta pequeña de «Yo también estaba», si hay algo pendiente (V7).
- **Como Design,** con más aire entre bloques.

## 3. La pantalla de una colección (Design: «colección», con 3 de 7, en curso, tocada y completa)
- **Hoy cada sitio es una estrella genérica** (roja o gris), no se sabe qué trozo de la insignia es de qué sitio y, con el viaje terminado, salen «Día 3» y [Cómo llegar].
- **Cada sitio, una tarjeta con foto:**
  - **ganado:** la foto con la que se ganó (si fue con un Visto o con «Yo también estaba», la del sitio de nuestros datos), en color, con la marca y la fecha;
  - **sin ganar:** la foto del sitio en gris suave;
  - **en las dos,** su trozo de la insignia pequeño en una esquina.
- **Sin ganar:**
  - durante el viaje y en la ruta, el día y [Cómo llegar];
  - si no está en la ruta, [Añadir a mi viaje];
  - con el viaje terminado, nada.
- **Al tocar una tarjeta,** su trozo se ilumina en la insignia.
- **El orden:** primero los ganados.
- **Los emblemas ocultos sin descubrir,** nunca.
- **Dime qué trozo de la insignia va con cada sitio en Roma y en Lanzarote** (la tabla, en el REPASO).

## 4. [Añadir a mi viaje]: en el mejor día y en el mejor hueco (colección y EXPLORAR)
- **Hoy, desde EXPLORAR,** el sitio va de PRIMERA parada del día elegido (`DayPositionPicker`, 10S7). En Lanzarote eso manda a la otra punta de la isla a primera hora. Cámbialo, igual desde la colección y desde EXPLORAR:
  - **En la hoja «¿A qué día?»,** marca el día que mejor le va con «Te pilla de camino»: el día cuya ruta pasa más cerca de ese sitio y al que aún le cabe.
  - **Solo días que quedan,** nunca días pasados.
  - **En el día elegido,** ponlo en el mejor hueco: entre las dos paradas que tiene más cerca, con el menor rodeo. Si a esa hora está cerrado, en el siguiente hueco en que esté abierto. Las comidas y lo de hora fija no se mueven.
  - **Después, como ahora:** lleva al día, ilumina la parada y abajo «Fundación César Manrique añadida al día 4».
- **Al tocar una tarjeta de la colección,** su trozo de la insignia brilla o late un momento, para que se vea claro cuál es (en Design apenas se nota).

## 5. El resumen del viaje y los emblemas ocultos (Design: lo nuevo del resumen, en el zip)
- **El bloque «Emblemas ocultos · 3 de 11 secretos encontrados»,** con lo que haya cambiado Design en el resumen y en todo este final.
- **Hoy dice 3 encontrados, pero solo se ven 2 dibujos.** El primero es un aro dorado vacío. Mira qué emblema es, por qué sale sin dibujo y arréglalo: todo emblema encontrado sale con su dibujo.
- **La cuadrícula se corta por la derecha** (la cuarta columna sale a medias). Que quepa entera a lo ancho del móvil, sin cortes, en Roma (con sus emblemas) y en Lanzarote (11).
- **Al tocar un emblema encontrado,** su escena (V3); uno sin encontrar no enseña nada.

## 6. El resumen del viaje, rehecho (Design: «Resumen del viaje», la versión con la foto arriba)
**Es el RECUERDO de lo ganado en ESTE viaje, no la hoja de logros (que dice cómo vas). Como Design:**
- **Arriba:** una foto grande del viaje (una de las suyas; si no hay, la del destino), «Lo que te llevas de Lanzarote» y las cifras del viaje: días, paradas, km y fotos.
- **La medalla, grande y sin barra:** «Has conseguido el bronce de Lanzarote».
- **Colecciones:** solo las que han sumado en este viaje, con lo sumado («+2») y sin barras.
- **Emblemas:** solo los descubiertos en este viaje, con su dibujo y su nombre, y «+9 secretos por descubrir». Sin cuadrícula de «?».
- **Logros de viajero nuevos:** de 3 en 3 y **todos del mismo tamaño**, pero **cada uno con SU dibujo y SU marco de siempre** (bronce, plata, exclusivo…). Design los ha pintado todos como exclusivos para el ejemplo: no lo copies; solo copia el tamaño, la cuadrícula y el nombre debajo.

**Y estos fallos de hoy:**
- **«{ciudad} {anio}» sale sin rellenar** y con la moneda de Roma 2026 en un viaje a Lanzarote. Tiene que ser «Lanzarote 2026», con su moneda. Busca en toda la app más textos con `{…}` sin rellenar.
- **La moneda exclusiva de ciudad y año (`{ciudad} {anio}`):**
  - **cada destino, con su dibujo:** hoy la de «Lanzarote 2026» lleva el Coliseo de Roma. En Lanzarote, la montaña de su medalla; en cada destino, el suyo.
  - **El nombre, dentro de la moneda y entero:** hoy «LANZAROTE» se sale por los lados y se monta encima del dibujo. Que quepa siempre dentro del círculo, encima del año: si el nombre es largo, más pequeño o en arco por el borde. Para todos los destinos (Roma, Lanzarote, París…) y en todas las pantallas donde salga (resumen, vitrina, momento de logro y compartir).
- **«Te quedan 4 sorpresas por reclamar» hoy es solo texto y no hace nada.** Que sea una tarjeta que se toca y abre [Reclamar con tus fotos] (con «Hasta el 13 de diciembre»). Dime qué son esas «4 sorpresas» y que el número cuadre con lo que de verdad se puede reclamar. Sin plazo o sin nada que reclamar, no sale.
  - **Al tocarla, la hoja dice CUÁLES son** (Design: la hoja «Te quedan 4 sorpresas por reclamar»): la lista de los sitios de la ruta del viaje que se quedaron sin su pedazo, cada uno con su foto, su nombre, su día («Día 3 · mié 11») y lo que da («Tierra de fuego · Los imprescindibles»), y [Subir foto] en cada uno. Abajo, [Reclamar con tus fotos] para subir varias a la vez.
  - **Los emblemas ocultos nunca se nombran:** como mucho, una línea al final, «Y quizá algún secreto…».
  - **En la lista, solo los sitios que dan algún pedazo de colección** y que aún no lo tienes. Las paradas sin logro (un restaurante, Playa Blanca, Marina Rubicón…) no salen. El número del título es el de la lista. Un sitio que solo esconde un emblema no se nombra: cuenta solo para «Y quizá algún secreto…», que sale únicamente si queda algún emblema de la ruta por descubrir.
- **El emblema «El calor de la tierra» (`timanfaya`) sale como un aro vacío,** en la app y en Design. Revísalo rápido y arréglalo tú: si es un fallo al pintarlo, corrígelo; si a la pieza de Design (`Emblema Lanza`) le falta el dibujo, hazlo tú con el mismo estilo que los otros 10 (las Montañas del Fuego con el calor que sube del suelo). Mira también que los 11 emblemas de Lanzarote salgan con su dibujo y dime qué era.

## 9. La prueba
- `pruebaJutrip` y las de logros de Roma y de Lanzarote en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV9`:**
  - Logros abre sin «Un momento…» la segunda vez;
  - con un pedazo nuevo, se actualiza solo;
  - las colecciones a 0 van en «Más colecciones de …», plegado, y sin «Para tu próximo viaje»;
  - la medalla en una sola tarjeta;
  - la colección con fotos, su trozo y sin [Cómo llegar] con el viaje terminado;
  - los emblemas encontrados, todos con su dibujo, y la cuadrícula sin cortes;
  - el resumen sin «{ciudad} {anio}», con el logro de ciudad del destino bueno, y ningún texto con `{…}` en la app;
  - [Añadir a mi viaje] desde la colección y desde EXPLORAR: el día marcado con «Te pilla de camino», el mejor hueco, nunca cerrado ni en un día pasado (Roma y Lanzarote).
- **En el REPASO:** el tiempo antes y después, capturas de móvil al lado de Design y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
