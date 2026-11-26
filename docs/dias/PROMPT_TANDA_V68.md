Hola. TANDA V68 (URGENTE): GUARDAR UNA RESERVA PARA OTRO DÍA, «RECUPERAR EL DÍA» Y QUE REORGANIZAR NUNCA QUITE NADA. Tanda corta. **Esta vez SÍ con pruebas de lo que toques** (es el corazón de la app y está roto). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v68.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita. **Todo vale para todos los destinos** (Roma y Lanzarote).

## Lo que vio Eric esta mañana (iPhone, jutrip.app, con la V60-V67 subida)
Viaje de Roma (13-15 jul) creado de cero:
- **Museos Vaticanos reservados a las 15:00 para el día de «Roma antigua»:** la hoja dice que cambia el día entero por el de Roma antigua, pero **solo se movieron los Museos Vaticanos**, y **los puso los primeros**, delante del Coliseo. La Plaza y la Basílica de San Pedro se quedaron en su día.
- **La entrada «Coliseo, Foro y Palatino» (13:00) pasada al martes 13:** al martes solo pasó el Foro y Palatino (el primero, con el número 4 encima del 1), y **el Coliseo y el Foro se quedaron TAMBIÉN** en su día: el Foro, dos veces.
- **Free Tour reservado a las 15:00:** sale el primero de la mañana, encima del Coliseo.
- **«Recuperar el día»** devuelve el día original, pero lo que había salido de él a otros días se queda también allí: **sitios repetidos** (el Free Tour el 27 y el 28). Después Reorganizar propone **«Se quita de tu viaje»** a 13 sitios (Trevi, Panteón, Free Tour, Vaticanos…).
- Tras recuperar, el botón de Reorganizar no se iba hasta cerrar la app.

Esto funcionaba en la V49-V50 (`cambiarDiaPorReserva.ts`, `excursionMove.ts`, `AddReservationSheet.tsx`). **Primero, busca qué tanda lo rompió** (`git log` / `git bisect` sobre V51-V67; sospechosas: V57 `diaAdmite`, V58, V61, V65) y dímelo en una línea.

## 1. Una reserva para otro día
- **Una reserva que cubre varios sitios** (`placeNames`: «Coliseo, Foro y Palatino») **mueve TODOS sus sitios**, no solo el primero (hoy se ata a `placeNames[0]`). Ninguno se queda en el día de antes.
- **Si la app decide mover el día entero** (como en la V49), **se mueve entero**: todas sus paradas, ninguna se queda atrás ni repetida. Si solo se mueve el sitio de la reserva, solo ese (y los que van con él).
- **El sitio con reserva va A SU HORA**, no el primero: los Vaticanos a las 15:00 por la tarde; el Coliseo a las 13:00 y **el Foro y Palatino DESPUÉS** (la entrada del Foro vale el resto del día; la del Coliseo es estricta); el Free Tour a las 10:00 antes del Coliseo, a las 15:00 por la tarde.
- **La hoja que sale dice EXACTAMENTE lo que ha hecho la app.**
- **Los números de las paradas, siempre en orden** (nunca un «9» entre el 12 y el 13 ni un «4» encima del «1»).

## 2. Nunca un sitio dos veces en el viaje
Añade una comprobación en el código: después de cualquier cambio (reserva, mover, Reorganizar, recuperar), **ningún sitio está dos veces en el viaje**. **Las nocturnas no cuentan:** la visita de día y la de noche de un mismo sitio (la Fontana de Trevi de día y «de noche», Piazza Navona…) son dos visitas distintas y pueden estar las dos. (En las hojas, si las dos cambian a la vez, una sola tarjeta.) Si pasa, es un fallo: no se guarda y se dice en el registro.

## 3. «Recuperar el día»
- **Recuperar es recuperar:** el día vuelve al original **y deshace todo lo que tocó a ese día**: lo que salió de él a otros días (o a pendientes) vuelve y desaparece de allí; lo que entró desde otro día vuelve a su día.
- **No pasa por Reorganizar:** el botón flotante se va al momento. Solo vuelve si después se cambia algo (una parada, el vuelo o una reserva). Nunca hace falta cerrar la app.

## 4. Reorganizar nunca quita nada del viaje
- **Nada «se quita de tu viaje».** Lo que no cabe el día de llegada va al día donde mejor quepa; si no cabe en ninguno, a **Lugares pendientes**. Un sitio con reserva o un imprescindible, jamás.
- **El cambio MÍNIMO:** no correr todos los días en cadena (con el vuelo a las 15:30 proponía 45 cambios moviendo todos los días). Solo se mueve lo que no cabe.
- **Los días que ya pasaron y lo ya hecho de hoy están bloqueados:** Reorganizar no los toca.
- **La comida y la cena según la hora real del día** (aterrizando a las 17:30: sin comida, con cena).
- **Las cabeceras MAÑANA / TARDE / NOCHE** salen de la hora a la que el motor pone cada parada (aterrizando a las 17:30, «NOCHE»; nunca «MAÑANA»).

## 5. Pruebas (esta vez sí)
- Escribe **`pruebaV68`** con estos casos, en Roma y en Lanzarote: reserva de un solo sitio a otro día y a su hora; la entrada combinada del Coliseo a otro día (los tres sitios se mueven, el Coliseo a su hora, el Foro después); el Free Tour a las 10:00 y a las 15:00; recuperar un día después de reorganizar (nada repetido, el botón se va); Reorganizar con el vuelo a las 15:30 y a las 17:30 (nada «se quita», cambio mínimo, sin comida si no hay mediodía); nunca un sitio dos veces.
- Pasa `pruebaV68`, las pruebas de Reorganizar y de reservas que ya existan y `pruebaJutrip`. `npm run build` sin errores.
- El REPASO: qué tanda lo rompió y por qué; captura en modo iPhone, antes y después, de cada caso de Eric; qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
