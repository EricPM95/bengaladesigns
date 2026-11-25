Hola. TANDA V62: LA LLEGADA EN HOY (EL BILLETE Y LA TARJETA DEL VUELO, EN UNA). Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V61 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v62.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53): Roma (avión, tren) y Lanzarote (avión y coche de alquiler).

**Dibujos:** `docs/diseno/proyecto/` (`TODO_IGUAL`), la página **«La llegada en HOY»**: L1, L1b, L2, L3, L4, L5, L6 y L7. Design es un prototipo: se copia SOLO lo que se describe.

## 1. Regla nueva para CLAUDE.md: HOY y RESERVAS, los mismos datos (Eric)
**HOY saca los datos de la MISMA reserva guardada en RESERVAS; nada se guarda dos veces.** Compañía, vuelo, terminal, asiento, localizador y documento (QR): iguales en los dos sitios; si se cambia en uno, cambia en el otro. Si en RESERVAS el QR está gris con «+», en HOY también (y al tocarlo abre la hoja de subir el documento de la V64; hasta entonces, lo que hace hoy). Igual con la vuelta.

## 2. La tarjeta de llegada (sustituye a lo de ahora)
Hoy, el día de llegada, HOY enseña el billete (`BilleteDeVuelo`) y aparte la tarjeta de bienvenida (`TarjetaBienvenida`, en `BloquesHoy.tsx`: «Aterrizas a las 9:30», «Empiezas hacia las 10:15»…), y a las 10:00 sigue diciendo «Aterrizas a las 9:30». **Todo eso pasa a UNA sola tarjeta**, con el formato de la tarjeta de la parada:
- **Imagen fija** (una pieza, como la de comer): avión, tren o coche. Etiqueta «LLEGADA», título «Llegas a Roma». Arriba a la derecha, el icono del QR (dorado si está, gris con «+» si no).
- **La línea del billete** (la de `Billete QR`): «VUELO VY6102 · Martes 24», la hora de salida grande con «BCN» y la de llegada con «FCO», y la línea de puntos con el avión.
- **Fila del vuelo** (solo las cajas con dato; las que quedan, del mismo tamaño que las de abajo y alineadas a la izquierda, sin estirarse): **TERMINAL** («T1 · El Prat»), **ASIENTO** («14C»), **REF** (en negro la compañía, «Vueling»; debajo, en gris, el código de la reserva). En tren: ESTACIÓN, ASIENTO («Coche 5 · 12A»), REF («Iryo»).
- **Fila de abajo:** **AL CENTRO** («35 min · Leonardo Express»; sale del punto al que llega: en tren a Termini, «5 min · Metro desde Termini», nunca uno fijo), **HOTEL** (su nombre y la zona; en coche, «20 min en coche»), **TU DÍA** («7 paradas · Empieza en Piazza Navona»).
- **Con coche de alquiler reservado (L6):** AL CENTRO pasa a «COCHE · Cicar · Recógelo al llegar» (el sitio de recogida solo si lo dice la reserva).
- **Botones:** [He aterrizado] (dorado) y **[Vuelo retrasado]** (blanco con borde); tren/autobús/ferry: [He llegado] y [Tren / Autobús / Ferry retrasado]; **coche propio (L5): [He llegado] y [He salido tarde]**, con la imagen del coche. Debajo, el enlace «Cómo llegar al centro» (la ficha de llegada de siempre).
- **Fuera** «Aterrizas a las…» y «Empiezas hacia las…».

## 3. Después de aterrizar (L2, L7)
Al pulsar [He aterrizado] **o cuando el GPS lo sabe** (en el destino, `zonaDeUbicacion`):
- la etiqueta de la imagen pasa a **«● AQUÍ · YA HAS LLEGADO»** (como la parada al llegar); junto a la hora de llegada, el ✓ verde (sin el texto «Has aterrizado»);
- **las dos filas de cajas se quedan**; fuera los dos botones; **[Cómo llegar a tu alojamiento]** dorado, de punta a punta;
- **con coche de alquiler (L7):** encima del botón, la franja «Primero, recoge tu coche: Cicar · Ref CK-48213», y el botón lleva en coche.

## 4. [Vuelo retrasado] (L3)
Hoja «¿A qué hora llegas ahora?» con la rueda de la hora de siempre y [Guardar]. Al guardar: la hora nueva en la línea del billete y la vieja tachada al lado; se cambia en la reserva (regla del punto 1) y **sale la hoja de Reorganizar de la V61** («¿Adaptamos tus días a tu vuelo?»).

## 5. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: captura en modo iPhone al lado de su dibujo de L1 (con y sin tarjeta de embarque), L2, L3, L4 (tren), L5 (coche propio), L6 y L7 (Lanzarote con Cicar); que un dato cambiado en RESERVAS sale igual en HOY; qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
