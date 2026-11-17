Hola. TANDA V5: RECLAMAR CON TUS FOTOS (16-nov). Va después de la V4. Sustituye a `PROMPT_GALERIA_MISMO_DIA.md` (que no se llegó a pasar): lo de aquel prompt va dentro de este. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v5.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción. Para todos los destinos igual.

**El problema (Eric, viaje a Lanzarote):**
- Vieron muchos más sitios de los que consiguieron en la app.
- Hoy solo se puede reclamar con la galería desde el día siguiente («Lo de ayer también cuenta»), parada a parada, y solo las paradas de la ruta. La hoja sale una vez al día al abrir el viaje y, si se cierra, no hay forma de volver.
- Los sitios fuera de la ruta no se pueden reclamar.

## 0. Primero, comprobar y contarme
- **Si el iPhone, al elegir fotos de la galería en la web** (Safari y la app instalada), quita la ubicación, la fecha o la marca y modelo de la cámara. Pruébalo con fotos reales de un iPhone. Si quita algo, dímelo antes de seguir, porque cambia el punto 2.
- **Cómo se ganan hoy los emblemas con fotos de la galería,** sobre todo `lz_madrugador`, `atardecer_atlantico` y el `madrugador` de Roma (los que dependen de la hora).
- Esta tanda SÍ toca el servidor: si hace falta migración, el SQL listo para pegar, con su número y su COMPROBAR.

## 1. Un sitio fijo: [Reclamar con tus fotos]
- **Un botón fijo en Logros del viaje** (y en la hoja de logros), durante el viaje y hasta que acabe el plazo (30 días después del último día).
- **Solo con pase,** igual que los logros de la cámara: sin pase, el botón sale con el candado pequeño y lleva al pase.
- **Debajo, el plazo:** «Puedes reclamar hasta el 13 de diciembre».
- **«Lo de ayer también cuenta» sigue saliendo** igual, pero con su texto según el momento:
  - durante el viaje, «Ayer tenías en tu ruta…»;
  - después, «En tu viaje tenías…».
  - Y con un botón que lleva aquí.

## 2. Elegir varias fotos a la vez
- **Se abre la galería y se pueden elegir muchas,** por ejemplo todas las del viaje.
- **Cada foto pasa por `evaluarFoto`** con las reglas de siempre: de la cámara del móvil (marca y modelo; nada de capturas ni de WhatsApp) y de los días del viaje.
- **Con ubicación:** cuenta para CUALQUIER sitio con logro del destino en cuyo radio caiga, esté o no en la ruta.
  - Si cae en dos sitios, cuenta para los dos.
  - Varias fotos del mismo sitio cuentan una vez.
- **Sin ubicación:** al final, la app pregunta por cada una «¿De qué sitio es esta foto?».
  - Primero, las paradas de ese día sin su pedazo.
  - Después, el resto de sitios con logro del destino, con buscador.
  - Se puede saltar.
- **Lo que no vale** (otra fecha, sin datos de cámara, fuera del radio), en una lista corta con el motivo, sin una hoja por foto.
- **Las fotos que valen,** también a los recuerdos de ese día del viaje.
- **Mientras sube,** «Comprobando 12 de 30…». Si se corta la red, sigue donde lo dejó.

## 3. El resumen y las animaciones
- **Al acabar:** «Has ganado 6 pedazos y 2 emblemas», con la lista de sitios y sus fotos.
- **Las animaciones, por la fila de momentos de la V3:** de una en una, los pedazos de la misma colección juntos y la EXP como línea dentro de la pantalla (nunca 4 pantallas seguidas). Si son muchas, al final [Ver todo en Logros] en vez de 15 pantallas.

## 4. El mismo día, durante el viaje
- **La hoja «Parece que no estás en…»:** «¿Ya has estado hoy en Jameos del Agua? Sube una foto que hiciste allí y gana tu pedazo.» y [Elegir de la galería].
- **La cámara flotante:** [Hacer foto] y [Subir de la galería], que usa lo del punto 2.

## 4b. La cámara flotante, en TODAS las pantallas del viaje (Eric, 17-nov)
- **Hoy solo sale en HOY.** Que salga también en Ruta, Días, Explorar y Reservas: el mismo botón, en el mismo sitio y con lo mismo que hace en HOY (antes, durante y después del viaje).
- **Que no tape nada importante:** ni la barra de pestañas ni los botones del mapa en Explorar. Si choca, súbelo un poco, pero en el mismo sitio en todas.
- **Sin pase ya no va con candado, pero solo hace fotos** (Eric):
  - **una foto por parada,** con la misma regla de la gratis que ya existe (`limiteDeFotos`). La foto va a la parada donde estás (o a la del momento del día). Si esa parada ya tiene su foto, pregunta si la cambia;
  - **sin logros:** las fotos sin pase van al álbum y NUNCA dan pedazos ni emblemas (ni ahora ni si luego compra el pase: el pase cuenta desde que se compra; dime si hoy funciona así);
  - **con el pase,** fotos sin límite y con recompensas, como ahora.
- **La hoja, con este texto:**
  - Título: **«Tu cámara de viaje»**.
  - **Texto, para todos:** «Las fotos que hagas con ella se guardan en el álbum de tu viaje, día a día, para que tengas todos tus recuerdos juntos.» Sin pase, añade al final: «Una foto por cada lugar.»
  - **Debajo, con un espacio, un segundo párrafo con el pase** (con `nombreDelPase`):
    - **Sin pase,** con el candado pequeño y que lleve a comprar el pase: «Con el **Pase de Lanzarote**, fotos sin límite. Y además, podrás coleccionar recompensas: pedazos de colección y emblemas ocultos.»
    - **Con pase:** «Con tu **Pase de Lanzarote**, fotos sin límite. Y además, podrás coleccionar recompensas: pedazos de colección y emblemas ocultos.»
  - **Al hacer la segunda foto en la misma parada sin pase:** «Sin el Pase, una foto por lugar. ¿Cambias la que tenías?».
  - **Antes del viaje,** debajo, como ahora: «Podrás usarla durante tu viaje, del 8 al 13 de noviembre».

## 4c. El botón flotante de los logros (Eric, 17-nov)
- **El mismo tamaño que el de la cámara:** hoy es un poco más grande. Los dos iguales, uno encima del otro.
- **Con un poco de color cuando aún no hay nada:** hoy, sin logros, es un círculo blanco casi vacío. Que se vea vivo desde el principio, con el trofeo en oro y un fondo crema u oro suave, como la cámara pero sin competir con ella. Con logros, como ahora.
- **En las mismas pantallas que la cámara.**

## 5. La prueba
- `pruebaJutrip`, `pruebaV3` y las de logros de Roma y de Lanzarote en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV5`:**
  - 10 fotos de golpe: con ubicación en la ruta, fuera de la ruta, en dos sitios a la vez, sin ubicación, de otra fecha y una captura de pantalla;
  - cuenta lo que toca y explica lo que no;
  - el plazo de 30 días;
  - el mismo día;
  - los textos de «Lo de ayer» durante y después;
  - la cámara flotante en las 5 pestañas, con el texto nuevo;
  - sin pase, una foto por parada (la segunda pregunta si cambia la primera) y ningún logro; con pase, sin límite y con logros;
  - los dos flotantes del mismo tamaño y el de logros con color sin logros;
  - Roma y Lanzarote.
- **En el REPASO:**
  - capturas de móvil del botón, la subida, el resumen y la lista de lo que no vale;
  - lo que encontraste en el punto 0;
  - tu lista de comprobación DE ESTA TANDA;
  - y explícale a Eric en dos frases cómo reclamar ahora sus sitios de Lanzarote.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga y que el botón sale en Logros. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
