Hola. TANDA V71: UNA SOLA HOJA DEL EMBLEMA OCULTO, EL ORDEN DE LO QUE SALE TRAS [HE TERMINADO] Y CADA LOGRO EN SU PANTALLA; LOGROS CON VIAJES REPETIDOS. Tanda corta, MODO RÁPIDO (salvo las pruebas de logros del §5). Empieza SOLO cuando la V70 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v71.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** `docs/diseno/proyecto/`:
- la hoja nueva del Emblema Oculto de la V66 (rombo grande arriba, [Hacer la foto] y [Elegir de la galería] uno debajo del otro, «¿No estás aquí? Desmarcar visto»);
- `Visto Fotos`: V5, V6 y M1 «6 sorpresas seguidas, una a una».
- **la página nueva «Emblema Oculto · Al acercarte» (A1-A4)**: las tarjetas «Algo brilla cerca de aquí…» y «Más cerca…».

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## Lo que vio Eric (iPhone, viaje de prueba de Lanzarote)
- **La Geria:** [Ya he llegado] → sale la hoja NUEVA del emblema (`JuegoCerca.tsx`). [He terminado] → sale OTRA VEZ, ahora la hoja VIEJA (`logros/visto/Hojas.tsx`, tipo `oculto`: el rombo pequeño a la izquierda y los botones lado a lado).
- **El Golfo (la última parada del día):**
  - [Ya he llegado] → la hoja nueva;
  - [He terminado] y sube la foto → sale un segundo el resumen del día («Lo que te llevas de hoy»), y encima la hoja vieja del emblema otra vez;
  - al cerrarlas, «Día perfecto».
- **Timanfaya:**
  - el sonido de los logros sonó mientras estaba abierta «Guarda un recuerdo», y la pantalla salió después, al cerrarla;
  - salió «Y además…» con dos logros pequeños, sin nada antes.

## 1. Una sola hoja del Emblema Oculto, una vez por parada
- **Una sola forma:** la NUEVA de la V66. La vieja (`Hojas.tsx`, tipo `oculto`) se sustituye por la nueva en todos los casos; no queda otra.
- **Al llegar** ([Ya he llegado] o el GPS): sale la nueva, como ahora.
- **Al pulsar [He terminado]:**
  - si ya salió al llegar, **no vuelve a salir**: la parada se queda con su tira de lo que falta (V6 «La parada con lo que le falta»);
  - si no salió (pulsó [He terminado] sin [Ya he llegado]), sale la nueva **una vez**, con «¿No estás aquí? Desmarcar visto».
- **Si ya hay una foto de esa parada,** hecha desde la hoja de llegada o desde la cámara, **no se vuelve a pedir**: el emblema se descubre con esa foto.
- Lo mismo con los pedazos: una hoja de foto por parada, nunca dos.
- **Las tarjetas «Algo brilla cerca de aquí…» y «Más cerca…» (`TarjetaBrilla` en `JuegoCerca.tsx`), como el dibujo A1-A4**: el mismo juego que la hoja nueva (fondo, rayos, rombo y etiqueta). Siguen siendo tarjetas de HOY, no hojas.
- **«Algo brilla cerca de aquí…» y «Más cerca…» (`AvisosDeCerca.tsx`) no salen nunca después de la hoja de llegada** de ese sitio, ni si ya se descubrió el emblema. Hoy solo miran su propia marca (`yaSalio(…, juego)`), no la de `'llegada'`: que miren las dos.
- **Comprueba el caso de la PRIMERA parada del día con un emblema que aún NO se tenga** (Lanzarote, un día que empiece por los Jameos del Agua; Roma, uno que empiece por el Panteón): ¿sale la hoja al llegar? Si no, busca por qué (la marca `yaSalio` compartida con `AvisosDeCerca`, la tarjeta de llegada o la de bienvenida en lugar de la parada…) y arréglalo. (En el caso de Eric, en Timanfaya, ya tenía el emblema: por eso no salió.)

## 2. Después de [He terminado], una cosa cada vez, en este orden
1. La hoja de la foto que toque: el emblema (§1) o «Guarda un recuerdo».
2. Las pantallas de logros, una a una (§3).
3. **El resumen del día al final**, solo si era la última parada: nunca antes, ni asomando por detrás de otra hoja.

Ninguna sale mientras la anterior está abierta (`useTurno`, `MomentosHost.tsx`).

**El sonido sale CON su pantalla.** Hoy suena cuando contesta el servidor (`reproducirMomentos` en `VistoFlujo.tsx`), aunque la pantalla esté esperando. Si la pantalla espera, el sonido también.

## 3. Cada logro, su propia pantalla
- **Se quita «Y además…»** (`PantallaAdemas`, `FAMILIA_ADEMAS` en `plan.ts`): cada logro de viajero sale en su pantalla grande, como «Día perfecto» y como M1. Así se ve mejor en el móvil y es más emocionante. [Seguir] y «Saltar todo» se quedan.
- **En el resumen del día siguen juntos,** como ahora («2 Logros de viajero» con sus medallas).

## 4. Logros de viajero que salen con viajes repetidos (`server/logros/motor.js`)
- **«Nunca es la última vez» (`volver`)** solo cuenta si el segundo viaje al destino **empieza después de que acabe el primero**. Dos viajes con fechas que se pisan (crear el viaje dos veces) no cuentan.
- **«Tres viajes en un año» (`viajes_en_un_ano`):** igual; los viajes que se pisan en fechas cuentan como uno.
- Los ya ganados no se quitan.

## 5. Pruebas: solo las de logros
- Pasa `pruebaLogros1`, `pruebaLogros2` y `pruebaV35A_logros`, y añade a una de ellas los dos casos del §4: dos viajes que se pisan no dan el logro; uno detrás de otro, sí. Antes de subir: `npm run build` sin errores.
- **El REPASO, corto:** capturas en modo iPhone, en orden, de la secuencia de Eric en Lanzarote:
  - Timanfaya con dos logros a la vez;
  - La Geria, [Ya he llegado] y después [He terminado];
  - El Golfo como última parada, con la foto.
- Una captura en Roma (el Panteón o San Pedro).
- Qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
