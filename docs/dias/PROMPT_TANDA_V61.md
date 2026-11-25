Hola. TANDA V61: REORGANIZAR, QUE DEJE EL DÍA BIEN A LA PRIMERA Y SE ENTIENDA. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V60 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v61.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53): compruébalo también en Lanzarote.

**Dibujos:** `docs/diseno/proyecto/` (`TODO_IGUAL`, descomprimido en la V60), la hoja de Reorganizar: **RO1, RO2 y RO3**. Design es un prototipo: se copia SOLO lo que se describe.

## Lo que vio Eric probando (25-nov, viaje de Roma, ida el viernes 27)
- Con el vuelo a las 10:30 y a las 13:30, Reorganizar quitó bien lo de la mañana. Pero:
- **El Free Tour, recomendado a las 17:00 (2 h 30), va como PARADA 1 de la tarde**, y lo de después se corre hasta pasadas las 19:30: «Panteón · A esta hora ya ha cerrado».
- **Tras pulsar Reorganizar, el botón flotante sigue**, y al abrirlo propone otra cosa («Free Tour · de la parada 1 a la 6»).
- **Con el vuelo a las 17:00** (libre hacia las 19:50): deja el viernes el Panteón (cierra a las 19:00) y el Free Tour; tarjetas «Piazza Navona · De la parada 1 a la 1» (no cambia nada) y «Castillo de Sant'Angelo · De la parada 0 a la 10».
- **[Deshacer] no deja el día como estaba:** tras deshacer se abre sola la hoja y propone otra cosa (solo Sant'Angelo).

## 1. El motor
- **Toda reserva o actividad con hora (el Free Tour) va A SU HORA**, no como primera parada. El resto se reparte: **antes**, lo que cierra pronto (Panteón, iglesias, museos); **después**, lo que se ve de noche o al aire libre, cerca de donde acaba. Si el FT aún no tiene hora, el motor elige la que deja el día posible (con la regla de la V60: con 10:30, las 15:00; con 13:30, las 17:00).
- **Lo que no cabe ese día por horario** (llega cuando ya ha cerrado) **va a otro día o a pendientes**, con su tarjeta. Nunca se queda en la ruta a una hora en que está cerrado.
- **Reorganizar da el resultado final de una vez:** si se vuelve a pedir justo después, no propone nada. Añade una comprobación en el código: reorganizar dos veces seguidas = mismo resultado.
- **[Deshacer] devuelve EXACTAMENTE todos los días que tocó** («Reorganizar mis días»), y después no se abre ninguna hoja sola.
- **El botón flotante:** tras [Reorganizar mi día], desaparece. Solo se queda tras [Dejarlo como está].

## 2. La hoja (RO1, RO2, RO3)
- **RO1 «¿Reorganizamos tu día?» · RO2 «¿Reorganizamos tus días?» (varios días) · RO3 «¿Adaptamos tus días a tu vuelo?».**
- **Texto de arriba, concreto:** «Aterrizas a las 17:00 y quedas libre hacia las 19:50. Esto es lo que cambia:» (sin vuelo nuevo, lo que corresponda: «Has añadido la Galería Borghese el sábado. Esto es lo que cambia:»).
- **Una tarjeta (`TarjetaDelSitio`) SOLO por cada sitio que cambia de verdad** (de día, a pendientes, quitado, o de hora más de 15 min). En gris, a dónde va **con la hora, nunca con número de parada ni «hoy»** (sale antes del viaje): «Al sábado 28, por la mañana», «Al sábado 28 a las 10:00», «A las 21:30, después de cenar», «A Lugares pendientes». A la derecha, su cuadrado (fecha o icono de pendientes). **Los que se van (a pendientes, a otro día o quitados) también salen** (hoy no salían la Fontana de Trevi ni el desayuno).
- **RO2:** las tarjetas agrupadas por día, con una cabecera pequeña («VIERNES 27», «SÁBADO 28»); un sitio que pasa de un día a otro sale en el día al que va («Llega del viernes, por la tarde»).
- **La franja verde, concreta y con un solo ✓:** «Sigue igual: tu cena en Armando al Pantheon y tus reservas».
- [Reorganizar mi día / mis días] (dorado) y [Dejarlo como está] (blanco con borde), lado a lado.
- **RO3: al guardar un vuelo nuevo sale DIRECTAMENTE esta hoja** (nada de un aviso antes que pregunte si quieres reorganizar). [Reorganizar] → hecho, sin botón flotante. [Dejarlo como está] → el botón flotante se queda para luego.
- Las propuestas entre viajeros de un viaje compartido no se tocan.

## 3. Lo que quedó a medias de la V57: el probador (`/admin`, «Probar Reorganizar»)
- **La línea de lo que decidió el motor y por qué**, en palabras (hoy sale `free_tour_con_hora_ya_empezado` sin traducir, y un texto dice «El el día 1»).
- **El primer y el último día antes y después, lado a lado.**
- **Los casos preparados con un toque:** llegada 9:00, 14:00 y 21:00; salida 10:00 y 18:00; llegada 16:00 con el FT de las 17:00 reservado; llegada 18:00 con FT sin hora; **y los de Eric: vuelo 10:30, 13:30 y 17:00 a Ciampino con FT sin hora.**

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva (además de la comprobación del punto 1). Antes de subir: `npm run build` sin errores.
- El REPASO, corto: con los tres vuelos de Eric (10:30, 13:30 y 17:00), captura del día antes y después, de la hoja y de lo que dice el probador; que reorganizar dos veces da lo mismo; que [Deshacer] lo deja igual; un caso en Lanzarote; qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
