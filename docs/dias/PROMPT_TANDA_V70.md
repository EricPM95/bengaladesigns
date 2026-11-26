Hola. TANDA V70: EL DÍA DE LA VUELTA EN HOY (COMO LA LLEGADA) Y LAS RESPUESTAS A TUS PREGUNTAS DE LA V60-V67. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V69 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v70.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos.**

**Dibujos:** `docs/diseno/proyecto/` (`TODO_IGUAL`, descomprimido en la V69), la página **«El día de la vuelta en HOY»** (VL1, VL1b, VL1c, VL2, VL3, VL4, VL4b, VL5).

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. El día de la vuelta: la misma tarjeta que la llegada (V62)
Sustituye a la tarjeta «Hoy vuelves» de la V57 (`VueltaH14.tsx`), con su misma cuenta (`datosDeLaSalida`: una sola para todo):
- **La tarjeta de llegada (V62) en versión vuelta:** etiqueta «VUELTA», título «Hoy vuelves a casa», el icono del QR, la línea del billete (VUELO VY6105 · Viernes 27, 19:30 FCO ✈ 21:45 BCN).
- **Fila del vuelo** (solo las cajas con dato, sin estirarse): TERMINAL · ASIENTO · REF (la compañía en negro y el código en gris). Los datos, de la reserva de RESERVAS (regla V62: HOY = RESERVAS).
- **Fila de abajo:** **SALIR** («16:30 · Hacia el aeropuerto»), **AEROPUERTO** («35 min · Leonardo Express»; en Lanzarote, la devolución del coche), **ANTES** («2 paradas · Trastevere primero»; sin paradas: «TU DÍA · Sin paradas · Hoy toca volver»).
- **Botones:** [Salgo hacia el aeropuerto] (dorado) y [Vuelo retrasado]; debajo, «Cómo llegar al aeropuerto». (Tren/bus/ferry: [Salgo hacia la estación…], [Tren retrasado]…; coche propio: [He salido tarde].)
- **No hay bloque oscuro «SAL HACIA EL AEROPUERTO» aparte** (la hora va en la caja SALIR).
- **Tiempo libre (VL1c):** si antes de la hora de salir quedan **1 h 30 o más** libres, debajo una tarjeta «Tienes hasta las 16:30 antes de salir hacia el aeropuerto» (con paradas: «Aún te queda tiempo antes de las 16:30») con [Añadir algo cerca] (abre «Añadir un sitio cercano» SOLO con lo abierto que cabe antes de esa hora, cerca del alojamiento o de camino al aeropuerto) y «Ver en Explorar». Vuelo temprano (VL2): sin esa tarjeta.
- **[Vuelo retrasado] (VL4, VL4b):** pregunta **«¿A qué hora sale ahora?»** (la rueda empieza en la hora del vuelo, no en 12:00); se tacha la hora de SALIDA (~~19:30~~ 20:15) y se recalcula SALIR (17:15). Cambia en la reserva.
- **Al pulsar [Salgo hacia el aeropuerto] (VL5):** etiqueta «● DE CAMINO AL AEROPUERTO»; las dos filas se quedan; fuera los dos botones; **[Cómo llegar al aeropuerto]** dorado de punta a punta.
- **Ya en el aeropuerto (VL3, por el GPS o tras salir y pasar el tiempo del trayecto):** etiqueta «● YA EN EL AEROPUERTO» (corta: que no se tape con el QR); **solo la fila del vuelo** (fuera SALIR / AEROPUERTO / ANTES); **[Ver mi tarjeta de embarque]** de punta a punta, con el icono del QR.
- Cuando el vuelo ya ha salido: «Buen viaje de vuelta» (V57). Se queda.

## 1b. Un buscador en las hojas de la moneda y del país (Ajustes)
La lista es larga (ahora con las de Latinoamérica). En `HojaMonedaViajero` y `HojaPaisVive`, **debajo del título, un buscador de punta a punta**: el mismo de «Dónde has estado» (`DondeHasEstado.tsx`, «Busca un país»), no uno nuevo. Busca sin tildes ni mayúsculas por nombre, código («COP») y país («Colombia» encuentra el peso colombiano). Sin resultados: «No encontramos nada con "…"».

## 2. Respuestas a tus preguntas (CHECKLIST_V60_V65 y V66_V67)
- **Los ~1.200 archivos de `docs/dias`:** si son de pruebas, `git restore docs/dias` y que no vuelvan a quedarse (añade a `.gitignore` lo que generen las pruebas). Dime en una línea qué eran.
- **(V60-5)** El día de llegada, la hora recomendada parte de **la mayor** de las dos (la hora útil del vuelo y la hora a la que llega la ruta). **(V60-6)** La franja ámbar, bien; sin otro día con hueco, solo la franja y [Ver en Civitatis]. **(V60-4)** Al pasar a producción de Civitatis, sí, se repite la búsqueda. **(V60-1d, a medias)** La nota y el número de opiniones de cada actividad, de su FICHA (`GET` de la actividad), no del listado: hazlo ahora en el sandbox.
- **(V61-8)** Lo que cierra pronto se adelanta solo si hace falta (cambio mínimo). **(V61-9)** El Panteón «por fuera» de noche, se queda. **(V61-10)** No hace falta guardar lo añadido: texto genérico «Has cambiado tu sábado. Esto es lo que cambia:». **(V61-11 y V67-16)** El barrido de 365, en la próxima noche de pruebas.
- **(V62-12)** Bien. **(V62-13)** [He salido tarde] con coche propio **sí cuenta para el motor**, como [Vuelo retrasado]. **(V62-14)** La rueda con ✓, bien (regla V55). **(V62-15)** El QR de HOY, como el dibujo (el círculo de 52 px). **(V62-16)** Coche de alquiler sin empresa: «COCHE · Recógelo al llegar».
- **(V63-18)** La regla de la hoja encima del aviso, solo para las hojas de abajo. **(V63-19)** Sí, cortar el emblema de la parada saltada también en el servidor. **(V63-21)** Sí: fuera «A esta hora ya ha cerrado» también en la ficha de la parada. **(V63-22)** Los planes de lluvia de Roma, **frases completas escritas a mano** con los sitios de cada plan (nada inventado), no «Si llueve, este es el plan: » delante de media frase.
- **(V64-25)** Bien. **(V64-26)** Sí: entrada y excursión solo corrigen al pulsar [Guardar] en «Revisa los datos», como el vuelo (y si es otro día, la pregunta de la V66). **(V64-27)** [+ Añade tu reserva] con `BOTON_CLARO` (blanco); «Desde las 15:00» en dos líneas, bien. **(V64-29)** Bien.
- **(V65-31)** «Con margen · Hasta 15 min tarde» (con los minutos de cada sitio), bien. **(V65-33 y 34)** Bien. **(V65-32)** Un PDF de varias páginas cuenta como UNA lectura, no una por página.
- **(V66-1)** Bien sin «Ahora no» (se cierra con la X); actualiza `pruebaTandaHOY1_B`. **(V66-2)** Bien. **(V66-3)** Botón corto: «Ir a El Golfo». **(V66-4)** Bien. **(V66-5)** Ya va en la V69. **(V66-6)** Sí, la tira «Guarda un recuerdo» tras un pedazo también solo en imprescindibles y maravillas.
- **(V67-8)** Sin web que confirme, estos son **estrictos** igualmente (lo son): Coliseo, Museos Vaticanos, Galería Borghese, Domus Aurea, Última Cena y los Free Tours. Lo demás sin confirmar, «con margen» (V67). **(V67-9)** Arregla la frase partida de la historia de Haría («Fíjate en tres cosas»). **(V67-13)** La etiqueta «YA ES DE NOCHE», bien; en la caja HORARIO, «De día · Se ve hasta las 18:26». **(V67-14)** Bien. **(V67-15)** Sí: el fundido de las fotos en TODAS las tarjetas con foto (HOY, DÍAS, EXPLORAR, recuerdos, reservas).

## 3. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: captura en modo iPhone al lado de su dibujo de VL1, VL1c, VL2, VL3, VL4 y VL5 (Roma) y una en Lanzarote con coche de alquiler; la línea de cada respuesta del punto 2; qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
