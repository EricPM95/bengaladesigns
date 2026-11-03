Hola. TANDA LZ1: LANZAROTE, PRIMER DESTINO NUEVO (2-nov). PARTE 1 DE 2: PREPARAR EL TERRENO, LOS DATOS Y LOS TIEMPOS EN COCHE, SIN TOCAR ROMA. Va después de la 10S11 (ya subida). Antes, comprueba que en `docs/destinos/lanzarote/` están los 14 archivos del zip: si falta alguno, dímelo y para. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA_LZ1.md e inclúyelo en tu commit.
- **Lee primero** los documentos de Lanzarote que Eric ha dejado en `docs/destinos/lanzarote/` (zip `LANZAROTE_PARA_CODE.zip`): `DIAS_CURADOS_LANZAROTE.md` (los días, borrador 2, con las decisiones de Eric), `LANZAROTE_SITIOS.md` (los sitios), `LANZAROTE_PARA_CODE.md` (lo que la app tiene que aprender), `LANZAROTE_ENFOQUE_AYUDANTE.md` (el análisis del motor y del transporte), los tres `DATOS_*.md` (los datos con su fuente), `ZONAS_ALOJAMIENTO_LANZAROTE.md` y `REVISION_BORRADOR_1.md`. Los demás (historias, restaurantes, logros, llegada, EXPLORAR y pase) son para la LZ2: no los metas aún. Y `docs/METODO_DESTINOS.md`.
- **Regla de oro: Roma no cambia.** Todo lo nuevo, detrás de ajustes del destino (por ejemplo, `medio: "coche"`). Después de cada cambio del motor, la muestra de 60 fechas de Roma idéntica y `pruebaJutrip` en 0 fallos.
- **Lanzarote, oculto:** solo lo ve el administrador (como el interruptor de la API de Civitatis) hasta que Eric diga. Nadie más puede elegirlo.
- **Cómo trabajar:** 4 agentes, un servidor, hasta 2 Chrome. Solo las pruebas de lo tocado, `pruebaJutrip` y la muestra de 60. Dime al empezar cuánto calculas. Nota de estado (`_estado_lz1.md`) a la rama `estado` cada 30 minutos. No apagues el PC. Si algo se complica, déjalo a medias, dímelo y sigue.

## 1. Lo que está atado a Roma
- Antes de nada, **carga un Lanzarote de mentira de 2 días** (con 3-4 sitios) y mira qué se rompe o qué da por hecho Roma: las líneas de transporte, el interruptor del día 4 («roma»/«excursion»), la ciudad de Civitatis por defecto, nombres del destino en el servidor, los meses de invierno, la hora de Roma, los aeropuertos (Fiumicino, Ciampino), `_llegada.json`, los textos con «Roma» escritos a mano, el pase («Pase Roma»)…
- Arréglalo para que el destino venga de los datos. **Dime la lista**: qué había, qué has cambiado y qué queda para la LZ2. Lo que diga «Pase Roma», que diga el nombre del destino («Pase Lanzarote»). **El precio del pase es el mismo en todos los destinos** (Eric, 3-nov).

## 2. Los datos de Lanzarote
- Monta los datos como los de Roma (`data/pipeline_v2/lanzarote.json` y `data/dias/lanzarote/`), con los sitios de `LANZAROTE_SITIOS.md`: nombre, zona, coordenadas, horario con **fuente y fecha** (y `verificar` en lo marcado ⚠️), precio, reserva («solo online con día y hora» en Timanfaya y la Cueva de los Verdes), duración, **«por dentro / por fuera»** (la tabla de la 10S10), carrito (Jameos y la Cueva no lo dejan), y el nivel de la pirámide.
- **La foto de portada de Lanzarote** (primera pantalla y «Mis viajes»), como la de Roma: **elige una bonita** (licencia libre, con su crédito) y enséñamela en el REPASO.
- **Fotos:** con licencia libre y su crédito, como Roma (tus scripts de fotos), o las de la API de Civitatis si son de sus servidores públicos (permiso confirmado). Dime cuáles faltan.
- **Las historias, los restaurantes, la llegada al aeropuerto, los consejos de las fichas, las fechas especiales, las categorías de EXPLORAR y los textos del pase** los estamos preparando aparte: llegarán con la LZ2. No los escribas tú.
- **Zona horaria:** Atlantic/Canary (una hora menos que la península).
- **Atardeceres:** con el cálculo de la app (`sunset.js`) para Lanzarote, y sus cortes de luz como en `DIAS_ESCRITOS_FORMATO.md`.
- **«Cerca de mí»** (siempre del pase, en todos los destinos): **gasolineras y aparcamientos** en lugar de baños y fuentes (pocas gasolineras en el norte).

## 3. Los tiempos en coche
- **Con Mapbox** (ya lo usas en `scripts/buildTravelMatrix.mjs` y `src/lib/mapboxDirections.ts`): la tabla de tiempos **en coche** entre todos los sitios de Lanzarote, las 6 zonas de alojamiento de `ZONAS_ALOJAMIENTO_LANZAROTE.md` (Puerto del Carmen, Playa Blanca, Costa Teguise, Arrecife, El norte, El interior) y el aeropuerto. **Una parada = un sitio donde aparcas** (`LANZAROTE_PARA_CODE.md`, punto 9): los pueblos son una sola parada, con lo que se ve paseando en «Qué vas a ver», y las coordenadas de cada parada van **en su aparcamiento**. Sin tráfico, más el rato de aparcar de cada sitio (por defecto 5 min; Papagayo +15-20 por la pista; Teguise en domingo +10).
- **Compara con los tiempos de los documentos** (los marcados ⚠️ y la tabla de `REVISION_BORRADOR_1.md`) y dime los que no cuadran.
- **Con esa tabla, calcula cada día de `DIAS_CURADOS_LANZAROTE.md`** desde las 6 zonas: el total de coche (tope 3 h), si llega a cada sitio antes de su última entrada o su turno, y la comida antes de las 15:00. **Un informe por día** (en sencillo), con lo que no cabe. No cambies los días: eso lo decidimos Eric y yo.

## 4. Civitatis en Lanzarote
- Abre en Chrome las páginas **en español** de las excursiones de `LANZAROTE_SITIOS.md` y `DATOS_CIVITATIS_Y_LLEGADA.md` (desde fuera solo cargaban en inglés): el enlace bueno (con nuestro código y campaña), el nombre en español, el precio en euros, la nota, las opiniones, la duración y la cancelación. Y el Free Tour de Teguise: días y horas. Guárdalo en los datos con «comprobado: <fecha>».
- Con la API (sandbox), mira si resuelven y con qué número.

## 5. La prueba
- La muestra de 60 fechas de Roma, idéntica. `pruebaJutrip` en 0 fallos.
- Prueba nueva `pruebaTandaLZ1`: Lanzarote oculto para quien no es administrador; los datos de cada sitio completos (o con su `verificar`); la tabla de tiempos en coche completa; la zona horaria; «Cerca de mí» con gasolineras y aparcamientos; ningún texto con «Roma» en Lanzarote.

## 6. El informe
En «LZ1» de `INFORME_TANDA10B.md` (o un `INFORME_LANZAROTE.md` nuevo), en sencillo: la lista de lo atado a Roma, los datos que faltan, **el informe de los días con los tiempos de Mapbox**, Civitatis en español y las pruebas. La lista de comprobación DE ESTA TANDA al final y arriba de `REPASO_LZ1.html`.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
