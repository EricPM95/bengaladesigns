Hola. TANDA V73: HOY CUANDO YA HAS VISTO TODO («TODO VISTO POR HOY»). Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V72 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v73.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** `docs/diseno/proyecto/`, la página nueva **«Hoy Al Acabar» (AC1-AC3)**: manda sobre `Hoy Completa`. Design es un prototipo:
- **la cabecera de arriba de la app** (JUTRIP, cartera, campana, perfil) **no cambia**: la del dibujo no se copia;
- los textos y números son de ejemplo: van los reales;
- «2 colecciones avanzan» sale dos veces en AC1 (en la tarjeta de cierre y bajo el reto): **solo una vez, en la tarjeta de cierre**.

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## Lo que vio Eric (Lanzarote, jueves 26, 12:30, las 6 paradas hechas)
De arriba abajo:
- «Todo visto por hoy»;
- «Sin tu ubicación no sabemos cuándo llegas · Usar mi ubicación»;
- una tarjeta oscura vacía, «Has hecho 6 paradas hoy»;
- «Reto del día · Entre viñas de ceniza · 0 de 3» con el hueco de la foto vacío y «Te falta Bodega La Geria y no está en tu ruta»;
- «Y 2 colecciones más avanzan hoy ›»;
- ¿Qué hago ahora?;
- Tu día · 6 de 6 hechas;
- «Hasta aquí, hoy»;
- «MAÑANA · Mañana, viernes 27 · La Graciosa (excursión)», sin nada más;
- «Pon tu alojamiento para volver con un toque» con un botón azul con borde dorado.

## 1. El orden, como AC1-AC3
1. La cabecera «JUE 26 · AL ACABAR EL DÍA · Todo visto por hoy» con las barras, como ahora.
2. La tarjeta de cierre (§2).
3. El alojamiento (§5).
4. El Reto del día, solo si se puede hacer todavía hoy (§3).
5. ¿Qué hago ahora?
6. TU DÍA · 6 de 6 · ver todo.
7. «Hasta aquí, hoy».
8. MAÑANA (§4).
9. «Si te sobra tiempo» y «Lugares pendientes», si hay algo, como ahora.

**Fuera «Sin tu ubicación no sabemos cuándo llegas»** cuando ya no queda ninguna parada: no hay adónde llegar.

## 2. La tarjeta de cierre: nunca vacía
- **Con atardecer visto:** «Hoy has visto el atardecer · Un cierre perfecto en El Golfo.», como ahora (`fraseDeCierre`).
- **Sin atardecer:** la frase de debajo, con lo mejor del día, sacado de lo visto: los imprescindibles primero y, si no hay, las primeras paradas. Por ejemplo:
  > «Has hecho 6 paradas hoy · Lo mejor: Timanfaya, los Jameos del Agua y la Cueva de los Verdes.»

  Nunca la tarjeta con solo el título.
- **«Ver el resumen del día ›»** (la franja dorada de abajo de la tarjeta; en el dibujo pone «Ver lo que te llevas de hoy») abre **el mismo resumen del día de siempre** (`ResumenDia`), no otra pantalla.
- **El título del resumen** (`ResumenDia.tsx`, `data-resumen-titulo`): «Lo que te llevas de hoy» pasa a ser **«Resumen del día»**, y a la mañana siguiente «Lo que te llevaste ayer» pasa a ser **«Resumen de ayer»**. La etiqueta de encima («TU DÍA EN LANZAROTE»), igual. Busca si el texto sale en algún sitio más y cámbialo también. Las etiquetas de debajo de la frase («6 paradas», «2 colecciones avanzan»), como el dibujo, con los números reales.

## 3. El Reto del día
- **El hueco de la foto, nunca vacío:** el dibujo de la colección con sus pedazos, como en `Hoy Entero` y `Hoy Recorrido`.
- **El número y el texto dicen lo mismo.** «0 de 3» y «Te falta Bodega La Geria» (solo uno) no cuadran: si se ha visto La Geria hoy y falta su foto, se dice así («La Geria: falta tu foto»). Busca por qué salía 0 y dímelo en una línea.
- **Con el día acabado,** el reto solo sale si aún se puede hacer hoy: un sitio cerca y abierto ahora, con [Añadir a mi día] (la hoja de días de siempre). Si no, no sale.
- **«Y 2 colecciones más avanzan hoy ›»,** con el día acabado, pasa a la etiqueta «2 colecciones avanzan» de la tarjeta de cierre (al tocarla, lo mismo que abre ahora).

## 4. MAÑANA (`TarjetaMananaOscura`, `mananaH13`)
Como `Hoy Completa`: el título y debajo sus líneas con icono. Hoy sale solo el título.
- **Título:** «Mañana, viernes 27 · La Graciosa», sin «(excursión)».
- **La primera línea:**
  - **excursión con reserva en RESERVAS** (Civitatis): «Sales a las 8:10», la hora de la reserva;
  - **excursión por libre con un traslado con hora en los datos del día** (`listas.json`, `tipo: traslado`, `hora`): «Ferry de las 10:00 desde Órzola», sacado de ahí;
  - **excursión que RESERVAS cuenta como por reservar** (`excursionesDeLaRuta`: La Graciosa sale como «Isla La Graciosa») **y aún sin reserva:** «Aún no tienes la reserva de La Graciosa», con [Añadir tu reserva], que abre RESERVAS en esa excursión. Nunca «el billete del ferry»: la app aún no guarda billetes de transporte;
  - **día normal:** «Empiezas por Timanfaya».
- **El consejo** (`consejo`), si hay: «Lleva el bañador y protector solar: hay playa.». Sale de los datos del día o de la excursión, nunca inventado; si no hay, no sale.
- **El tiempo de mañana,** si hay aviso (lluvia, viento, nubes en un mirador: `data/hoy/avisos_tiempo.json` / RainAlert): «Mañana, viento fuerte en el norte», con su icono.
- **Al tocarla:** DÍAS, abierto en mañana.

## 5. «Pon tu alojamiento para volver con un toque»
- **Su botón, como en `Hoy Entero`:** [+ Añadir] blanco con borde (`BOTON_CLARO`), nunca azul con borde dorado (diseño inventado).
- **Con el día acabado, sube** detrás de la tarjeta de cierre: es lo que más se necesita ahora.
- **Con el alojamiento puesto,** el [Volver al alojamiento] de siempre (`VolverAlAlojamiento.tsx`), en el mismo sitio.

## 5b. RESERVAS: el bloque «Coche», siempre debajo de «Entradas y Free Tour»
El bloque «Coche» (`CocheDeViaje.tsx`) va **siempre** justo debajo de «Entradas y Free Tour» y encima de «Excursiones y actividades» (`ReservasPanel.tsx`), lleve o no la etiqueta «SÚPER RECOMENDADO».

## 6. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- **El REPASO, corto:** captura en modo iPhone al lado de AC1, AC2 y AC3 de:
  - Lanzarote con el día acabado a mediodía, con la excursión de mañana sin reserva y con reserva;
  - Roma con el atardecer visto y sin él;
  - un día sin alojamiento y otro con él.
- Qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
