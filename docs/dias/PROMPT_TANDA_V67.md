Hola. TANDA V67: DATOS, LO QUE QUEDABA DE LOS VIAJEROS DE PRUEBA Y EL CATÁLOGO DE AVISOS AL DÍA. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V66 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v67.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53).

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. La puntualidad de las entradas (tus preguntas 9 y 10)
- Vuelve a comprobar en la **web oficial** de cada sitio los que pusiste como «estricta» sin confirmar. Lo que Eric espera, como pista (compruébalo, no lo copies): estrictos de verdad, el Coliseo, los Museos Vaticanos, la Galería Borghese, la Domus Aurea, la Última Cena y los Free Tours; con margen, las Catacumbas de San Calixto; el resto de Roma y todo Lanzarote, libres.
- **El Panteón: con margen, 15 minutos antes o después** (Eric).
- **CAMBIA la regla de la V54: lo que no se pueda confirmar va como «con margen», no como «estricta»** (para no sacar avisos rojos de urgencia donde no hace falta). Actualiza CLAUDE.md.

## 2. Datos
- **Haría, en dos paradas** (pregunta 25): hoy la ruta tiene un solo sitio «Haría y la Casa-Museo César Manrique» con el horario de la Casa-Museo, y por eso el pueblo sale cerrado. **Dos paradas seguidas** (a 100 m): **«Haría»** (sin horario, a pie) y **«Casa-Museo César Manrique»** (su horario, su entrada, su puntualidad). Cada una con su foto, su artículo y **el pedazo que YA tiene en logros** (`haria_pueblo` en «Pueblos con alma», `casa_museo_cesar_manrique` en «César Manrique»; Design no tiene que hacer nada). En coche se aparca una vez. **Los viajes ya creados** cambian solos al abrirlos, sin perder lo visto. Quita la regla pendiente de CLAUDE.md (V56).
- **El belén «100 Presepi» del Vaticano (26): se quita** de los datos y de la app, como si no existiera (la app no sale antes de diciembre).
- **Las monedas (29): TODAS, también las de Latinoamérica** (con España, nuestro usuario principal). Ya hay un complemento gratuito (`server/cambio.js`, `COMPLEMENTO`): añade las que falten (por ejemplo VES, HNL, NIO, PAB, CUP) y comprueba que **todas** salen en Ajustes y en «¿En qué país vives?» → moneda (`monedaDelPais.ts`).

## 3. Lo que quedaba de los viajeros de prueba (`VIAJEROS_LANZAROTE.html`)
- **L2 · El día de llegada en Lanzarote:** aterriza a las 9:30 en Arrecife, libre hacia las 10:15, y la primera parada es a las 14:18: casi 4 horas vacías. Míralo con el probador de Reorganizar y dime por qué (¿espera a la hora de entrada del hotel?). Lo normal es dejar las maletas y salir: llena la mañana con lo cercano a esa hora (ese domingo, el mercadillo de Teguise, que es solo los domingos por la mañana; o Arrecife). Para todos los destinos.
- **L6 · Miradores, playas y naturaleza de noche:** después de la puesta de sol **la app no los propone** como siguiente parada (van a «Hoy ya no da tiempo», como lo demás). **En su tarjeta, de noche, nunca «Cerrado»:** en la caja HORARIO, «De día» y debajo «Se ve hasta las 18:26» (la puesta de sol). Lo que se ve de noche (la Fontana de Trevi iluminada…) sigue igual.
- **P2 · RUTA:** la fila de botones de la tarjeta del viaje se corta por la derecha (la bombilla y la flecha, a medias) y salen marcadas «Ruta» y «Explorar» a la vez. Arréglalo. (El «Lanzarote» de la derecha es el nombre del mapa: se queda.)
- **P3 · Cargar bien las fotos:** la tarjeta del viaje del Perfil sale primero con el degradado y el texto del autor, y la foto llega después. Mientras carga, un hueco del mismo color de fondo (sin el texto del autor); la foto entra con un fundido suave y el autor con ella. En toda tarjeta con foto que tarde.
- **T2 · DÍAS:** «En coche · 3 min · 1 km» se parte en dos líneas y se pisa con «+ Añadir parada». **Siempre en una línea:** si no cabe, el icono del coche (o del pie) + «3 min · 1 km», sin «En coche»; si aún no cabe, la letra un poco más pequeña. Nunca dos líneas.

## 4. El catálogo de avisos, al día (`docs/dias/CATALOGO_AVISOS.html`)
Eric quiere VER todas las pantallas y avisos decididos estos días sin tener que provocarlos en el móvil. Rehaz el catálogo con el día simulado de HOY y viajes de prueba (Roma y Lanzarote): **una captura en modo iPhone de cada aviso, hoja y momento**, y al lado, en palabras sencillas, **cuándo sale, cuántas veces y si suena**. Como mínimo: los avisos de arriba (cada color, juntos y con «+x»), el de abajo con [Deshacer] y su línea dorada, «Voy con retraso» (H4 y H5), «Hoy ya no da tiempo» (H1), «Por hoy ya está» (H2, H3), el resumen del día (R1, R2), la comida y la cena (C1-C6), **«Si te sobra tiempo»**, **el recorrido de [Sin fuerzas]**, **la papelera dorada**, una entrada ya pasada, la entrada en peligro, el plan de lluvia, el atardecer (S1-S3), el Emblema Oculto, «Guarda un recuerdo», la llegada (L1-L7), Reorganizar (RO1-RO3), la hora recomendada (F1-F3), la línea naranja y la pregunta de mover una reserva. Si alguno no se puede provocar, di por qué. No cambies nada de la app para hacerlas. Que se abra solo, sin internet ni servidor.

## 5. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: la lista con ✅/🟡/❌; la tabla de puntualidad con su web; captura de Haría en la ruta, de L2 (antes y después), L6, P2, P3 y T2; qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
