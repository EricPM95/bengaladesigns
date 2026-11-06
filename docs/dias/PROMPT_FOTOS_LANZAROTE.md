Hola. LAS FOTOS DE LANZAROTE QUE HA ELEGIDO ERIC (6-nov). Va DESPUÉS del arreglo pequeño (con su push). Este mensaje acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**El paquete:** `FOTOS_LANZAROTE.zip` (Descargas o carpeta del proyecto).
- **Qué trae:** 27 fotos ya revisadas por Eric y por mí, una por parada, y 2 de reserva (`X1`, `X2`).
- **Formato:** todas en .jpg, de 1920 px de ancho como mucho.
- **El nombre:** cada una se llama `NN_<id>.jpg` con el id sugerido de su parada.
- **`_fotos_eric.json`:** la lista con el nombre de cada parada tal como sale en la app y si sus derechos están por revisar.

## 1. Cada parada, con la foto de Eric
- **Dónde van:** pon cada foto en su parada (`public/fotos/lanzarote/`, con su versión `_p` de 640 px para la tarjeta, como las de ahora) y en `data/dias/lanzarote/_fotos.json`.
- **Sustituyen a las de Commons** en esas paradas.
- **Sin crédito en la app** (decisión de Eric, como las de Roma). En `_fotos.json`, `origen: "Eric"` y el campo `derechos` del paquete: «libre» o «revisar antes del lanzamiento».
- **Ojo, son dos tarjetas distintas** en la tarde del día de Papagayo:
  - «El paseo marítimo de Playa Blanca» lleva la `22` (el muelle de Marina Rubicón);
  - «Faro de Pechiguera» lleva la `23`.
- **Las de reserva** (`X1` Mirador del Río al atardecer y `X2` Famara al atardecer) se guardan, pero no se usan.
- **Las cuadradas o alargadas, recortadas para la tarjeta sin perder lo importante:**
  - **`25` Ermita de las Nieves:** que se vean la ermita y la escalinata, aunque se pierdan ramas de arriba;
  - **`20` Arrecife:** el charco con las barcas y las casas;
  - **`14` Jardín de Cactus:** el molino;
  - **`11` Casa-Museo de Haría,** muy alargada: el patio con la cocina de leña.

## 2. Por qué salían mal (Eric lo vio en DÍAS)
- **Lo que vio:**
  - Timanfaya, sin foto aunque la tenía;
  - Haría y el Mirador de los Helechos, con un mapa de satélite;
  - la Casa-Museo de Haría, con una estatua.
- **Lo que sospecho:** el nombre de la parada no casaba con su foto y la app tiraba de la imagen de Wikipedia.
- **El arreglo:**
  - **el cruce:** cada parada se cruza con su foto por su id o por su nombre normalizado, nunca a ojo. Dime qué fallaba;
  - **en Lanzarote, NUNCA la imagen de Wikipedia de reserva.** Sin foto nuestra, el fondo de color de siempre;
  - **en Roma, no cambies nada;** solo dime si tira de Wikipedia en algún sitio.
- **Las paradas que no están en el paquete** (Mirador de Guinate, Mirador de Haría, LagOmar, Castillo de San José, Caletón Blanco, Punta Mujeres y Arrieta, Puerto del Carmen, Caldera Blanca…) se quedan con la de Commons que ya tienen. Mira que valgan (nada de mapas, satélite, estatuas ni noche).
  - El Mirador del Bosquecillo sigue sin foto: fondo de color.

## 3. Detalles de las tarjetas
- **«A pie · 5 min»** lleva el icono del coche: con «A pie», el icono de andar.
- **La etiqueta «Cesar manrique»:** «César Manrique». Repasa las etiquetas de Lanzarote: tildes, y mayúscula en los nombres propios.

## 4. El REPASO y la prueba (corta)
- **`docs/dias/REPASO_FOTOS_LANZAROTE.html`:** todas las paradas de Lanzarote con su foto puesta, para que Eric las vea de un vistazo. Más las capturas de móvil de los días martes y jueves de su viaje.
- **`pruebaJutrip` en 0** y la muestra de 60 de Roma, idéntica.
- **Una prueba nueva:**
  - todas las paradas de Lanzarote tienen foto nuestra o salen con fondo de color, nunca de Wikipedia;
  - ninguna foto apunta a un archivo que no existe;
  - las 27 del paquete están en su parada.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que las fotos cargan. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
