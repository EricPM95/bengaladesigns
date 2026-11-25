Hola. TANDA V60: LA BÚSQUEDA DE CIVITATIS Y LA HORA QUE RECOMENDAMOS PARA RESERVAR. Tanda corta, MODO RÁPIDO. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v60.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave; no abras los `.env*` (las claves de Civitatis las lee el cliente en memoria, como siempre). **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53).

**Dibujos: `TODO_IGUAL`, en mis Descargas** (la versión de esta noche; sustituye a la de la V59). Descomprímelo en `docs/diseno/proyecto/`, **encima, sin borrar** lo que no traiga. Lo usan esta tanda y las siguientes (V61-V65). **Design es un prototipo:** se copia SOLO lo que se describe; los datos de los dibujos son de ejemplo.

## 1. La búsqueda de Civitatis: por qué daba 400 (respuesta de Civitatis, 23-nov)
En `docs/civitatis/peticion_search_400.md` probamos `text`, `query`, `search`, `q` y `keyword`, con `lang` y `currency` en la dirección y frases largas. Civitatis dice:
- `POST /v2/search`: el texto va en **`searchText`** (el único obligatorio, **3 letras como mínimo**). **`lang`, `currency` y los filtros, en el cuerpo JSON**, no en la dirección. Sin `lang`, español.
- Excursiones desde Roma: **`destinationId: 19`** y **palabras cortas** («Pompeya», «Amalfi», «Tívoli»), no frases.
- **Un 400 con el mensaje «Not Found» es una búsqueda sin resultados**, no un error: lista vacía.
- El sandbox tiene menos actividades que producción.
- Se sigue con `Authorization: Bearer <token>`. **La nota y el número de opiniones, de la ficha de la actividad** (no del listado).

Haz:
- **El buscador en el servidor** (`server/civitatis/servicio.js`, con su caché como lo demás): `buscar(texto, destinoId)` con ese formato, y el 400 «Not Found» como lista vacía.
- **`scripts/destino/civitatisBuscarCinco.mjs`** con el formato bueno y palabras cortas. Pásalo (el sandbox responde de 7:00 a 2:00) y dime en el REPASO qué encuentra para las cinco excursiones de Roma (Pompeya y Sorrento, Nápoles y Pompeya en tren, Costa Amalfitana, Florencia en tren, Tívoli). **No cambies datos:** lo que encuentres, a DECISIONES con su id, para que Eric diga.
- Apunta la respuesta de Civitatis en `docs/civitatis/` (qué estaba mal y cómo es).

## 2. La hora que recomendamos para reservar (pestaña Entradas de la ficha; dibujos F1-F3)
**El fallo** (Eric, 25-nov): con el vuelo a las 17:20 le recomienda el Free Tour **a las 17:00**; con el vuelo a las 10:30, las 17:00 cuando cabían las 15:00. `recomendarHora` / `horaMasCercana` (`src/lib/civitatis.ts`) cogen de las horas libres **la más CERCANA** a la hora de la ruta, **aunque sea antes**, y no miran el vuelo.

**Cómo tiene que ser** (para toda actividad con horas fijas):
- **Nunca una hora antes de que pueda estar allí:** el día de llegada, desde la hora útil del vuelo (`horaUtilMin`: aterriza + salir del punto + trayecto + instalarse; con 10:30 en Ciampino, libre hacia las 13:20 → 15:00); los demás días, desde la hora a la que la ruta le lleva. **La primera hora que cabe DESPUÉS**, no la más cercana.
- **Si ese día no cabe ninguna, o no quedan plazas,** la de otro día del viaje (la más cercana con hueco).
- **Se recalcula al cambiar el vuelo o el orden del día**, sin esperar a Reorganizar.
- **Al guardar la reserva en RESERVAS para otro día, la parada pasa a ese día en la ruta** (como ya hacen las excursiones, V49).

**El dibujo:**
- **F1:** caja verde «TE RECOMENDAMOS», en grande **el día y la hora** («Viernes 27 · 17:00») y debajo el porqué («Aterrizas a las 13:30: a esta hora llegas con calma»; un día normal, «Encaja después del Panteón»).
- **F2 (ese día no llega):** encima de la caja verde, **una franja ámbar aparte**: «⚠ El viernes 27 no llegas: aterrizas a las 17:20». La caja verde: «Sábado 28 · 10:00 · El primer día que te encaja».
- **F3 (sin plazas, dato de Civitatis, `sinPlazas`):** la franja **en rojo**: «⚠ El viernes 27 no quedan plazas». La caja verde: «Sábado 28 · 10:00 · El día más cercano con plazas».
- En F2 y F3, debajo de la caja verde, en gris: **«Cuando añadas la reserva, lo pasamos al sábado en tu ruta.»**
- El botón [Reservar Free Tour] (o de la actividad) igual que ahora.

## 3. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: lo que devuelve el buscador con «Pompeya», «Amalfi» y «Tívoli»; captura en modo iPhone de F1, F2 y F3 al lado de su dibujo, con un viaje de Roma con el vuelo a las 10:30, 13:30 y 17:20; qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
