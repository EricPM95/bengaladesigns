Hola. TANDA V77: LAS RESPUESTAS DE ERIC A TUS 44 PREGUNTAS DE LA V72-V76. Tanda corta, MODO RÁPIDO (salvo el §3: pasa las pruebas del motor). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v77.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. Publicar los destinos (44)
- **Lanzarote deja de estar oculto:** en `server/destinosCurados.js`, `DESTINOS_OCULTOS` por defecto vacío (`[]`). Los destinos que vengan, igual: visibles desde el principio.
- **Las pruebas ya no dependen de esto:** quita el truco de `DESTINOS_OCULTOS='-'`. Una sola configuración para `pruebaJutrip`, `pruebaTandaLL_LZ` y las de Lanzarote.
- Las fotos de Lanzarote (`/api/place-photo`) ya cargan para todos (V72-8).
- Dime en una línea si en el código hay algo más que esconda Lanzarote.

## 2. Nombres cortos (10), en TODOS los destinos
- **Un campo `nombre_corto`** en los datos de cada sitio que tenga un nombre largo. Se usa en las frases y listas que nombran varios sitios: «Lo mejor:», avisos, resúmenes. Las tarjetas y fichas siguen con el nombre entero.
- **Lanzarote:**
  - Montañas del Fuego (Timanfaya) → «Timanfaya»;
  - La Geria y sus bodegas → «La Geria»;
  - Las Grietas (Montaña Blanca) → «Las Grietas»;
  - Jameos del Agua → «los Jameos».
- **Roma y los demás:** propón los nombres cortos de los largos (por ejemplo, los Museos Vaticanos con la Capilla Sixtina) en DECISIONES, para que Eric los apruebe. No los pongas aún.
- **«Lo mejor:»** nombra primero los imprescindibles: en Lanzarote, Timanfaya, los Jameos y la Cueva de los Verdes antes que la Ciudad Estratificada.

## 3. Motor (pasa `pruebaV68`, `pruebaV74` y las de Reorganizar)
- **(20)** «Atardecer en El Golfo», parada propia al final del día 1 de Lanzarote, a la hora de la puesta de sol de ese día.
- **(17)** Un Free Tour reservado va a SU hora y en su franja (10, primero de la mañana, salvo algo antes como un desayuno; 12, antes de comer; 15, primera hora de la tarde; 17, media tarde; 19 y 21, tarde-noche). Sin reserva, el motor pone el Free Tour SOLO a sus horas reales (`freeTourHoras.js`: 10, 12, 15, 17, 19, 21), nunca a una hora que no existe (16:40). Es lo que hace el motor por dentro; las horas que elige el viajero ya son botones (V69).
- **(18)** Visita que acabaría después del cierre y no se puede acortar a más de la mitad: `cambioMinimo` la pasa al mejor día; si no cabe, a pendientes.
- **(15)** `MAX_SACADOS` se queda en 8.

## 4. «Si te sobra tiempo» se une a «Lugares pendientes» (cambia la decisión de la V74)
Vistas tus capturas, «Si te sobra tiempo» (`day.spareStops`, «Para otro momento») son sitios que no cupieron en su día, como Lugares pendientes. **Una sola lista: Lugares pendientes.**
- **Lo que el motor deja fuera de un día va a Lugares pendientes,** con su motivo («No cabía el lunes»).
- **En HOY,** desde pendientes se puede **añadir a hoy** (lo que hacía [Recuperar]) o [Pasar a otro día].
- **En DÍAS,** el bloque de pendientes de la V69, al final, encima de «Añadir día»; fuera el «Si te sobra tiempo» de dentro de cada día.
- Los viajes ya creados: sus `spareStops` pasan a pendientes al abrirlos, una vez, sin perder ninguno.

## 5. Restaurantes, coordenadas y consejos
- **(21)** Arrecife a mediodía: busca **2 o 3 restaurantes más**, con datos reales (nombre, dirección, coordenadas y horario de su web o de Google, con la fuente en DECISIONES). Sin horario seguro, con «Revisa el horario» (V74).
- **(22)** **Eric te da permiso para EJECUTAR `lanzaroteRestaurantes.mjs`** (usa la clave de Mapbox del archivo de claves). **No abras, no leas y no enseñes el archivo de claves:** solo ejecuta el script. Coordenadas de Liken, Tacande, El Risco y los demás, con la fuente.
- **(13) Consejos de cada excursión y día especial:** un campo `consejos` en los datos, con 2 o 3 por excursión, cada uno con su tipo de icono (`agua`, `calzado`, `banador`, `protector`, `sombrero`, `abrigo`, `efectivo`, `documento`…) y su frase corta («Lleva agua: no hay fuentes dentro», «Calzado cómodo: piedras irregulares»).
  - Redáctalos con información REAL (web oficial o guía, la fuente en DECISIONES) para Pompeya, Florencia, Tívoli, Nápoles, La Graciosa y los días de playa de Lanzarote.
  - **Cómo se ven: la página de Design «Consejos del día» (C1-C3)** (descomprime `TODO_IGUAL` de Descargas en `docs/diseno/proyecto/`, encima, sin borrar): el bloque «CONSEJOS PARA MAÑANA / PARA LA EXCURSIÓN / PARA HOY», con un icono en su círculo, la palabra en negrita y la frase. Sale en MAÑANA (V73) y en la tarjeta de la excursión de HOY.
  - **Del dibujo, no se copia:**
    - en C1, «Bañador y protector» y «Protector solar» se repiten: uno solo, y en su lugar **gorra o sombrero** (Eric: en La Graciosa casi no hay sombra);
    - «Abrigo: por la mañana hace frío» solo si el pronóstico real de ese día lo dice;
    - «Lleva tu documento: te lo piden al entrar» solo si la web oficial lo dice.
    - Los datos de la tarjeta (recogida, duración…) son los reales.

## 5b. El audio de la historia de Haría
La frase cambió en la V70 («Fíjate en tres cosas»). **Eric te da permiso para EJECUTAR** `node scripts/destino/crearAudiosHistorias.mjs --destino=lanzarote --solo=haria_pueblo` (primero con `--simular`, para ver lo que gasta). Solo rehace ese audio. No abras ni enseñes el archivo de claves.

## 6. Reservas
- **(30)** Borrar una reserva no lleva [Deshacer]: la hoja dice la verdad («no se puede deshacer»).
- **(38)** La escala: **solo el dato**, sin aviso. En la tarjeta del vuelo, entre los dos tramos, «Escala de 45 min en Madrid».

## 7. Lo demás, como lo propusiste
- **(9)** La franja dorada de la tarjeta de cierre se queda como el dibujo.
- **3-8, 11, 12, 14, 16, 19, 23-29, 31-37 y 39-43:** como lo propusiste. El 19 (generar con vuelo) y el 41-43 van al fin de semana de pruebas, después del barrido de 365.

## 8. Pruebas
- Las del §3 y `pruebaJutrip`. `npm run build` sin errores.
- **El REPASO, corto:** capturas en modo iPhone de:
  - Lanzarote visible sin ser administrador;
  - «Lo mejor:» con nombres cortos;
  - el día 1 de Lanzarote con el atardecer;
  - Lugares pendientes en HOY y en DÍAS con un sitio que antes era «Si te sobra tiempo»;
  - la escala con su dato.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
