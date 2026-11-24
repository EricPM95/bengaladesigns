Hola. TANDA V43: HOY, «CAMBIAR PLAN» Y LOS AVISOS. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. **Sube la nota `_estado_v43.md` a la rama `estado` cada 30 minutos**. **No apagues el PC.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. Consulta nueva a Supabase: cada cuánto y cuánto baja.

**Los dibujos están en Design, en «HOY_V5».** Copia SOLO la hoja o el bloque del que se habla: lo de detrás es relleno. Nombres, horas y días son ejemplos: salen de los datos reales.

## 1. El modelo nuevo de las hojas de propuesta (regla; apúntala en CLAUDE.md)
`HojaPropuesta` («Propuesta», «Cambia:», [Aplicar], «Volver a mi ruta original») pasa a ser, en TODAS (retraso, comer, otro día, añadir un sitio, plan de lluvia):
- el texto de arriba;
- **un solo bloque de resumen que no se pulsa** (fondo suave, sin borde ni sombra): una línea con icono por cada cambio, solo las que vienen al caso;
- el botón dorado dice lo que hace ([Pasarlo al viernes]); abajo, pequeño, [Dejarlo como está].
- **Nunca se protege una entrada o reserva cuya hora ya ha pasado.**
- **Nunca se quita si se puede mover.**

## 2. «Voy con retraso» (23a, 23b, 23c)
- **El fallo:** `escalonDeRetraso` corta en 60 min. A las 21:19 propone quitar el Panteón para llegar a una entrada de las 10:00 que ya pasó.
- **Primero, al mejor día donde quepa** (abierto, cerca, sin llenarlo), con su nombre: «Pasamos el Panteón al viernes 27».
- **Con [Ver otra opción], quitarlo** (23b), con [Mejor pasarlo al viernes]. Si no cabe en ningún día, solo quitar (23c), con «no cabe en ningún otro día de tu viaje».
- «Es de lo más importante: solo lo quitamos si tú quieres», solo con imprescindibles.
- **Hoja nueva «Hoy ya no da tiempo a todo»:** sale con más de una hora de retraso, o al abrir HOY con la mañana pasada sin nada hecho (una vez). Texto: «Lo que tenías por la mañana ya ha pasado. ¿Qué hacemos?». Si había una entrada, «Tu entrada de las 10:00 en el Coliseo ya ha pasado.». Botones: [Ver lo que queda hoy], [Pasar lo que falta a otro día] y [Dejarlo como está].

## 3. «Quiero comer ahora» (24a a 24g)
- El título dice «comer» o «cenar» (desde las 17:00).
- **Arriba, los filtros de restaurantes de EXPLORAR** (`RESTAURANT_SUB_CATEGORIES`). [Todos] enseña solo sitios para comer (trattoria, pizza, street food); los de gelato, café y aperitivo, solo con su filtro.
- **El mapa** (punto de partida, números sin pisarse) y «Cerca de ti» o «Sin tu ubicación, contamos desde {sitio}».
- **Cada tarjeta:** su número, el tipo de cocina, «5 min a pie», el precio y «Abierto hasta las 23:00», o «Cierra pronto» en naranja si cierra en menos de una hora. [Ir aquí] pasa a [Elegir].
- **Al elegir:**
  - lo normal, «El resto de tu día sigue igual: solo cambia el orden»;
  - si algo cierra o choca con una entrada por llegar, lo pasa a otro día y lo dice;
  - la comida o cena que ya había, se sustituye.

## 4. Saltar una parada y pasarla a otro día (menú, 25, 26a a 26d)
- **Subtítulos del menú:** «Guárdala en pendientes y decide luego.» y «Elige otro día de tu viaje que te vaya bien.»
- **Saltar, igual que hoy** (un toque y [Deshacer]). Si tiene una reserva por llegar, pregunta: «Tienes reserva a las 10:00 para el Free Tour por Roma. Si te lo saltas, puedes perderla.», con [No, lo mantengo] y [Saltarlo igual]. Si la reserva ya pasó, no pregunta.
- **Al saltar, mira todo el día de golpe,** no parada a parada. Lo que ya pasó y no es una visita (la comida del mediodía a las 22:35) sale de la lista. «Han cerrado», en plural.
- **Pasar a otro día:**
  - la lista de días, como la de DÍAS al mover una parada, con el mejor día arriba («Te lo recomendamos») y los días cerrados en gris («Cerrado ese día»);
  - al elegir un día, la mejor forma en ESE día: cabe; cabe quitando algo flexible (a «Si te sobra tiempo»); o al final, en «Si te sobra tiempo»;
  - [Pasarlo al sábado] y [Elegir otro día], sin [Ver otra opción].
  - Dime si hoy [Ver otra opción] cambia de día (Eric lo vio).

## 5. «Añadir un sitio cercano» (27a a 27f)
- **Los fallos de hoy:**
  - ofrece sitios que ya están ese día (Piazza Navona: en DÍAS salió repetida, con el número 1 en lugar del 12). `candidatosParaAnadir` compara el nombre: compara el sitio;
  - salen sin fotos, y salen sitios cerrados a las 23:50;
  - «100 Presepi in Vaticano» tiene fechas: compruébalas.
- **Solo sale lo abierto ahora,** según los horarios de los datos. De noche, eso son las nocturnas y los sitios al aire libre que no cierran; nunca un parque que cierra al anochecer.
- **El mapa y la línea de ubicación,** como en comer. Cada fila: número, foto, minutos, estado («Abierto · cierra a las 19:00», «Cierra pronto», «Al aire libre») y [Elegir].
- **La etiqueta «Contiene recompensa», SOLO en esta pantalla.** El orden: primero los que tienen recompensa, después por cercanía.
- **Escalones, hasta tener al menos 3:**
  1. fuera de la ruta, hasta 15 min a pie;
  2. **los sitios de otros días del viaje**, con la etiqueta azul «Lo tienes el {día}». Se añaden hoy y el otro día NO se toca. Si tienen entrada, hoy se ven **por fuera** (15-20 min). En el resumen, [Quitarlo del {día}], pequeño;
  3. hasta 30 min a pie, o en metro o bus;
  4. de noche, los sitios al aire libre y las nocturnas, aunque estén más lejos;
  5. si no hay nada: «A esta hora no queda nada abierto cerca.», con [Volver al alojamiento] y [Ver Explorar].
- En coche (Lanzarote), en minutos de coche.

## 6. Los avisos (A1 a A3; regla, en CLAUDE.md)
- **Los avisos con [Deshacer], exactamente como hoy:** tapando el menú inferior y todos en el mismo sitio (hoy «Plan actualizado» sale más arriba). El texto dice qué ha pasado: «Piazza Navona, añadida a tu día».
- **Los avisos sin [Deshacer], arriba,** bajo la cabecera (A1, A2). Se van solos a los 5 s, o deslizándolos. Nunca más de uno: si hay varios, se juntan.
- **El fallo:** en `HoyDuranteV2`, `anunciadas` (un `useRef`) se borra al cambiar de pestaña, y «Panteón ya ha cerrado…» se repite cada vez. Guárdalos por viaje y día, también al cerrar la app: cada aviso, una vez por sitio y día. Revisa los demás.

## 7. «Lugares pendientes» (L1 a L4)
- **Filas compactas,** con [Otro día] y «···». El «···» abre Recuperar hoy (solo si sigue abierto), Ya lo visité y Quitar (en rojo, con deshacer).
- **[Pasar todos a otros días],** en azul oscuro con dorado, a propósito: así destaca sobre los de cada fila. Antes, el resumen (L4); los que no caben se quedan en pendientes.
- **La lista se ve entera** y se baja con la página.

## 8. La tarjeta de la parada (T1, T2), la ubicación y la lluvia
- **El horario,** con «Cerrado ahora · abre a las 8:30» si está cerrado.
- **Con ubicación:** «A pie · 12 min desde ti», y abajo «¿Ya estás aquí? [Ya he llegado]».
- **Sin ubicación:** «… desde tu alojamiento», y el recuadro «Sin tu ubicación no sabemos cuándo llegas», con [Usar mi ubicación] y [Ya he llegado].
- **«Escucha su historia por el camino · 3 min»,** como un reproductor (T1). Mientras suena, se queda como hoy (azul): el T3 no se copia.
- **En todo HOY:** [Usar mi ubicación], o [Actualizar] si ya la hay. Si el viajero dijo que no, la hoja «Activa tu ubicación», con los pasos de Safari o de Chrome según el móvil, comprobados de verdad, nunca de memoria.
- **La lluvia** (`RainAlert.tsx`): «aquí tienes una alternativa» solo si el día tiene `rainPlan`, con [Ver alternativa]. Si no lo tiene, un texto que no prometa nada. El aviso no sale si esa parte del día ya ha pasado.

## 9. Un solo botón dorado (regla, en CLAUDE.md)
- **Hoy hay dos:** el de Design (`135deg`, sin borde) y otro con borde `#9A7228`, en `ParadaHoy`, `VolverAlAlojamiento`, `LugaresPendientes`, `ComoVais`, `QueHagoAhora` y `PaginaDelSorteo`.
- **Todos pasan al de Design.** El dorado y el claro se escriben una sola vez, en un archivo común, y todos los botones los usan.

## 10. La prueba
- **`pruebaJutrip`, `pruebaV36` y las de lo que toques, en 0.**
- **Nueva `pruebaV43`, con hora simulada:**
  - a las 21:19, con una entrada de las 10:00 ya pasada, no se protege la entrada y sale «Hoy ya no da tiempo a todo»;
  - añadir un sitio nunca ofrece uno que ya está ese día; a las 23:30, solo sale lo abierto o al aire libre; siempre sale algo o la pantalla de «nada»;
  - el aviso de «ya ha cerrado» sale una sola vez tras HOY → DÍAS → HOY → RUTA → HOY;
  - ningún botón con `#9A7228`;
  - ningún «Propuesta», «Cambia:», [Aplicar] ni «Volver a mi ruta original» en HOY.
- **En el REPASO:** capturas en tamaño iPhone de cada punto, tu lista de comprobación DE ESTA TANDA y qué cambia, en palabras sencillas.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que HOY, DÍAS y RUTA cargan. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
