Hola. TANDA V57: EL DÍA DE LA VUELTA Y EL DE LA EXCURSIÓN EN HOY, Y EL PROBADOR DE REORGANIZAR. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V56 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v57.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa: se usan las piezas que ya existen (CLAUDE.md). **Todo vale para todos los destinos** (regla V53): cada punto, en Roma (avión) y en Lanzarote (coche).

## 1. El día de la vuelta en HOY (CHECKLIST 28)
Los viajeros de prueba vieron HOY **vacío** el día de vuelta: sin billete, sin hora del vuelo, sin nada. Ya existe la tarjeta «Hoy vuelves» (`VueltaH14.tsx`, `diaDeVuelta.ts`), con la hora del vuelo, el margen y el coche de Lanzarote.
- **Primero, mira por qué salió vacío** y dímelo en una línea: ¿el viaje de prueba no tenía vuelo de vuelta, o es un fallo?
- **Lo que tiene que salir**, solo en HOY y solo el día de vuelta, como todo HOY en directo: con el pase o el día de prueba. Sin pase, con su candado, como ahora.
  - **Con vuelo:**
    - el billete de vuelta (la tarjeta de embarque, con la pieza del billete QR de HOY);
    - «Sal hacia el aeropuerto a las …», con la hora del vuelo y lo que se tarda en llegar (en Lanzarote, la hora límite del coche, como ya hace);
    - debajo, las paradas que da tiempo a ver antes.
  - **Sin vuelo:** «Añade tu vuelo de vuelta para saber a qué hora salir», con [Añadir mi vuelo] (abre la hoja «Tu vuelo» de siempre).
  - **Cuando el vuelo ya ha salido** (Lanzarote L7: a las 19:00 y a las 22:00 seguía «Tu vuelo sale a las 18:05», «Devuelve el coche…» y «Has hecho 0 paradas hoy»): nada de eso. HOY pasa a lo de después del viaje (`HoyDespuesV2`), o, si eso aún no toca, una línea «Buen viaje de vuelta», sin botones.
  - **Con vuelo pero sin Reorganizar, si las paradas no caben antes de salir:** un aviso de arriba (pieza V54), «Tu vuelo sale a las 18:00 y hoy no te da tiempo a todo», con [Adaptar mi día], que abre Reorganizar. Si ya reorganizó, nada.
- **Nada de diseño nuevo:** usa las piezas que ya hay. Eric lo va a pulir después con Design, así que lo importante del REPASO son **las capturas de todos los casos** (ver punto 4).

## 2. El día de la excursión en HOY (CHECKLIST 32)
Los viajeros de prueba vieron el día de la excursión como «Hoy libre / A tu aire», y se le podían pasar 10 sitios.
- **Compruébalo con un viaje creado como lo crea un usuario normal**, con una excursión de Roma (Pompeya) y una de Lanzarote (La Graciosa). Dime si falla también o era solo el viaje de prueba.
- **Lo que tiene que salir:** HOY como **día de excursión**, con su tarjeta, la hora, el billete (si lo hay) y el punto de encuentro **solo si es verdad** (regla V49). Nunca «Hoy libre» ni «A tu aire».
- **A un día de excursión no se le pueden pasar sitios** desde «Pasar a otro día», «Hoy ya no da tiempo» ni Reorganizar. No sale en la lista de días a elegir.

## 3. El probador de Reorganizar, en el panel (idea de Eric)
Un apartado nuevo en `/admin` (solo administradores): **«Probar Reorganizar»**. Con las piezas del panel que ya existen.
- **Se elige:**
  - el destino (Roma, Lanzarote y los que haya);
  - cuántos días;
  - la hora de llegada;
  - la hora de salida;
  - el aeropuerto o el punto de llegada;
  - **el Free Tour:** sin Free Tour, con Free Tour sin hora reservada, o con hora reservada (10:00, 12:00, 15:00, 17:00, 19:00, 21:00).
- **Debajo, en una línea, lo que ha decidido el motor y por qué** (por ejemplo: «Libre a las 17:00: el tour de las 17:00 no cabe (30 min de margen) → pasa al día 2 a las 10:00», o el aviso «No llegas a tu Free Tour»).
- **Se ve:** el primer y el último día **como saldrían en la app** (las mismas tarjetas de DÍAS), **antes y después** de Reorganizar, uno al lado del otro.
- **Casos ya preparados**, con un toque:
  - llegada a las 9:00, a las 14:00 y a las 21:00;
  - salida a las 10:00 y a las 18:00;
  - llegada a las 16:00 con el Free Tour de las 17:00 reservado, y llegada a las 18:00 con Free Tour sin hora.
- **Usa el mismo motor de la app, sin copias.** No guarda nada: no crea viajes ni toca datos.
- No hace falta que se vea perfecto en el móvil: Eric lo usará en el ordenador.

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva.
- Antes de subir: `npm run build` sin errores.
- El REPASO:
  - **El día de la vuelta**, captura en modo iPhone de cada caso, en Roma y en Lanzarote:
    - con vuelo;
    - sin vuelo;
    - con vuelo sin reorganizar y sin tiempo;
    - sin pase;
    - a primera hora y a media tarde.
  - **La excursión:** una captura en Roma y otra en Lanzarote.
  - **El probador:** una captura con un caso preparado.
  - Qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
