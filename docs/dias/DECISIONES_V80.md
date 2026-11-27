
## Pieza compartida (agente B: apartados 3b y 4) — «Ideas y pendientes»

**Nombre:** `IdeasYPendientesHoy` — `src/components/route/hoy/v2/IdeasYPendientesHoy.tsx`. Una sola pieza para la excursión cancelada y para «al volver» de la excursión.

**Props:**
- `route: Route`, `day: DayPlan`, `dateIso: string` (el día de excursión de hoy).
- `desde: Coordinates | null` (GPS útil o, si no, el alojamiento) y `enCoche: boolean`, `ahoraMin: number` (para «abierto ahora» y los minutos).
- `titulo?: string`: con título («Tu día libre en Roma») es la excursión CANCELADA; sin título (al volver) sale arriba la frase «¿Te queda tiempo y quieres seguir visitando? Aquí tienes ideas cerca de ti.».
- `conAHoy?: boolean`: solo en la cancelada, saca el botón [+ A hoy] en cada pendiente (al volver no: el día ya se hizo).

**Qué pinta (en este orden):** título o frase · Lugares pendientes (el bloque de siempre, `LugaresPendientes`, abierto, con [Otro día]; con `conAHoy`, [+ A hoy]) · IDEAS CERCA DE TI (3 o 4 sitios reales de EXPLORAR del destino, con foto, «8 min a pie» / «25 min en coche») · [Ver en Explorar] (abre EXPLORAR con lo de cerca). Sin pendientes no sale el bloque; sin ideas no sale esa tarjeta (nunca nada inventado); [Ver en Explorar] sale siempre.

**Cómo usarla al volver (agente A):** pon `<IdeasYPendientesHoy route day dateIso desde enCoche ahoraMin />` en «Al acabar el día» del día de excursión (organizada: tras [He terminado]; por tu cuenta: tras «Vuelta a tu alojamiento»), y NO pongas `QueHagoAhora`. Ya no hace falta nada más (pendientes y exploración los resuelve la pieza).

**Estado «cancelada»:** `src/lib/excursionCancelada.ts` (`useExcursionCancelada(rutaId, dayId, dateIso)` → `{ cancelada, cancelar, deshacer }`; en el móvil, por viaje y día, guarda la FECHA en que se canceló: si la excursión se cambia de día, deja de estar cancelada sola). El enlace «¿Se ha cancelado la excursión?» es `EnlaceExcursionCancelada` (`ExcursionCancelada.tsx`, mismo directorio): va al final de la tarjeta de la excursión; agente A: colócalo dentro de tu tarjeta (mientras tanto sale justo debajo de `TodayExcursion`).

---

## Agente A (apartados 1, 2 y 3): el día de excursión paso a paso

**Dónde está:** `src/lib/excursionHoy.ts` (puro), `src/components/route/hoy/v2/ExcursionHoy.tsx` (pantalla), `TodayExcursion.tsx` (solo decide y carga los datos), datos en `data/dias/<destino>/_excursion_hoy.json`.

### §1. `modo_habitual` de cada excursión (propuesta de la V80; Eric dijo solo las cuatro primeras)
| Excursión | Modo | De quién es |
|---|---|---|
| Pompeya y Sorrento (`pompeya_sorrento`) | organizada | Eric |
| La Graciosa (`la_graciosa`) | por tu cuenta | Eric |
| Florencia en tren (`florencia_tren`), Nápoles y Pompeya en tren (`napoles_pompeya_tren`) | por tu cuenta | Eric |
| Costa Amalfitana, Florencia y Pisa, Tívoli | organizada | PROPUESTA: autobús (y barco) con guía, todo de la empresa |
| Venecia en tren | por tu cuenta | PROPUESTA: como Florencia (tren de alta velocidad) |
| Ostia Antica | por tu cuenta | PROPUESTA: se llega en el tren urbano desde Roma |
| Fuerteventura, Isla de Lobos (Lanzarote) | por tu cuenta | PROPUESTA: ferry/barco desde Playa Blanca / Corralejo |
Cómo lo sabe la app (en este orden): una reserva de excursión en RESERVAS la hace ORGANIZADA; billetes unidos (V76) la hacen POR TU CUENTA; sin nada guardado, `modo_habitual`; sin ese dato, por tu cuenta solo si el día escrito trae traslados (`partes`), si no, organizada. «Al leer la reserva que sube el viajero»: una reserva leída que se guarda como excursión ya es una reserva de excursión (organizada); no existe hoy un campo «empresa» ni «recogida» en el billete leído, así que no hay otra señal que mirar (ver informe, 🟡).

### §2. «Tu tiempo en…»: sitios reales y su fuente
- **La Graciosa** (`data/dias/lanzarote/_excursion_hoy.json`): Playa de La Laja («Junto al muelle»), Playa del Salado («A 15 min andando»), Playa de La Francesa («Buena para snorkel»). Fuente: turismolanzarote.com («What you can't miss on La Graciosa», feb-2026), tal como está recogido en `docs/destinos/lanzarote/DATOS_NATURALEZA_PUEBLOS_COCHE.md`. No se pone Las Conchas (esa fuente dice «mar bravo, cuidado al bañarse») ni La Cocina (a 1,5 h a pie). El dibujo trae otros nombres y subtítulos: no se copian.
- **Florencia** (Duomo, Uffizi, Ponte Vecchio) y **Nápoles** (Museo Arqueológico Nacional, Spaccanapoli, Castel dell'Ovo): sitios muy conocidos, con la fuente anotada en el dato (UNESCO, webs oficiales) pero **sin comprobar contra la web de cada sitio en esta tanda**: PENDIENTE de que Eric o el siguiente agente los abra.
- **Fotos pequeñas:** ninguna de esas playas ni sitios tiene foto propia en el proyecto. La tarjeta sale con el color de siempre (sin foto) antes que con una foto equivocada. Para ponerlas hacen falta fotos con licencia (Wikimedia Commons, como las de `_fotos.json`) o permiso: `FilaDeIdea` ya lee `foto`.
- **Los restaurantes:** una línea, de la zona de la comida de `listas.json` DG («en Caleta de Sebo»): «En Caleta de Sebo hay bares y restaurantes.» (el «junto al puerto» del dibujo no se pone: no está en los datos).

### Los tres botones (qué ver, escuchar, cámara): solo con contenido
| Sitio | Qué ver | Escuchar historia | Cámara |
|---|---|---|---|
| La Graciosa | NO (su ficha tiene `what_to_see` vacío) | SÍ (tiene `historia`) | solo con logros activos y emblema o pedazo |
| Pompeya, Florencia, Nápoles | NO | **FALTA la historia** | solo con logros activos y pedazo o emblema |
**Historias que faltan:** Pompeya, Florencia y Nápoles (y «qué ver» de La Graciosa y de las tres). Están en `data/pipeline_v2/detalle/<destino>/` (zona «excursiones» en Lanzarote).

### Otras decisiones
- El billete del ferry/tren/bus se lee SIEMPRE de la reserva unida de RESERVAS (V62/V76): [Cambiar la hora] cambia la hora de ESA reserva; sin billete guarda la hora en el móvil (`jutrip:excursion-hoy:<viaje>:<fecha>`).
- Lo guardado hoy en el móvil (cero red): [Ya he llegado], [He embarcado] (ida y vuelta), la hora cambiada, [He terminado] y que el GPS ya estuvo en el destino.
- Los consejos con X: la X marca `consejos-excursion` en `avisosUnaVez` (viaje + día).
- El «Tu día · 0 de 5 · ver todo» del dibujo es un resumen de los pasos (plegado/desplegado); no hay lista de paradas en un día de excursión.
- La tarjeta lleva `pieDeTarjeta`: ahí va el enlace «¿Se ha cancelado la excursión?» del agente B.
- **Roma y Lanzarote, ambos probados.** Un destino nuevo añade su `_excursion_hoy.json` (modo, ideas, destino con radio) y, si es en coche, su día escrito con `partes`/`vuelta`.

## Agente B (apartados 3b y 4): decisiones y propuestas

### Pieza compartida: cómo quedó (actualiza la sección de arriba)
- `IdeasYPendientesHoy` (`v2/IdeasYPendientesHoy.tsx`), props: `route, day, dateIso, titulo?, desde, enCoche, ahoraMin, conAHoy?`. Con `titulo` = la cancelada («Tu día libre en Roma»); sin él = «al volver» (la frase «¿Te queda tiempo y quieres seguir visitando? Aquí tienes ideas cerca de ti.», sin título). `conAHoy` solo en la cancelada.
- El agente A ya la usa al volver (`ExcursionHoy.tsx`); la cancelada la usa `DiaDeExcursionCancelada` (`v2/ExcursionCancelada.tsx`). El enlace «¿Se ha cancelado la excursión?» (`EnlaceExcursionCancelada`) lo coloca A dentro de su tarjeta (`pieDeTarjeta`).
- El modo (organizada / por tu cuenta) de la cancelada sale de `modoDeLaExcursion` del agente A (`useModoDeLaExcursion`, en `ExcursionCancelada.tsx`: la reserva guardada manda; si no, `modo_habitual`; si no, los traslados del día escrito): una sola regla para el paso a paso y para [Hacer … otro día].

### Qué se ha decidido (todo reversible; di si prefieres otra cosa)
1. **«¿Qué hago ahora?» nunca en un día de excursión.** Además de que la rama del día de excursión no lo pinta, `HoyDuranteV2` lo gatea con `!esDiaDeExcursion(day)` (también con sitios metidos con [+ A hoy] en el día libre: antes, con paradas, saldría).
2. **Estado «cancelada»:** en el móvil (`jutrip:excursion-cancelada:<viaje>:<día>`), por viaje y día, guardando la FECHA en que se canceló. No toca Supabase, no cambia la ruta y no borra la reserva. Si la excursión se cambia a otro día con [Hacer … otro día], esa fecha ya no es la del día de excursión y deja de estar cancelada sola; con [Deshacer] del cambio vuelve a estarlo. Como no está en la ruta, «Empezar de cero» y «Borrar mi cuenta» (que solo borran lo de Supabase) no lo tocan: son unos bytes del móvil que el propio viajero deshace. PROPUESTA si prefieres que viaje con la cuenta: un campo `excursionCanceladaEl` en `camposDelViajero`.
3. **La tarjeta gris** (EX7 y EX8 enseñan dos formas distintas): se hizo la de EX7 para todos (foto en gris con «EXCURSIÓN CANCELADA» y el nombre; sin foto, el gris liso) porque dice exactamente lo que pide el prompt. La compacta de EX8 (círculo con X) no se hizo. Lanzarote: La Graciosa no trae foto en los datos (sale el gris liso).
4. **[Hacer La Graciosa otro día]:** se cambia con el PRIMER día posterior al de hoy que no sea otra excursión, ni el de llegada ni el de vuelta, ni esté fijado por una reserva (`cambioParaLaExcursionCancelada`, en `excursionMove.ts`, sobre `intercambioDeExcursion`, que ahora acepta el día de excursión concreto: con dos excursiones en el viaje cambia la de hoy, no la primera). Es un intercambio (el resto de días no se mueve). Si no hay ninguno (la excursión es el último día), el botón no sale. La hoja es la de la V69 (`HojaMoverDias`) con tres opciones nuevas y opcionales: `texto`, `etiquetaSolo` («Dejarlo como está») y `sinRecomendado`.
5. **El nombre de cada día es su título de DÍAS** (`nombreDelDia` con los grupos del destino; en Lanzarote casi todos los días salen como «Lanzarote» porque el título lo dan los grupos de sitios, igual que en DÍAS). El «Norte de Lanzarote» del dibujo es de ejemplo.
6. **Una reserva (ferry) unida a la excursión NO se mueve** con el cambio de día: sigue en la fecha de antes (RESERVAS la mostrará en su fecha). Se supone que el viajero cambia el día porque no hay barco, y rehará el billete. PROPUESTA: un aviso «Tu ferry sigue en su día anterior» en el aviso de [Deshacer]; no se ha puesto porque nadie lo ha pedido.
7. **[+ A hoy]** (lo saltado, o lo que no dio tiempo en un día anterior): sale de su día y entra en el de hoy con `addStop`, no con `moveStopToDay`, porque un día que ya pasó no se mueve (red de seguridad de la V24). Con [Deshacer]. Lo de «No cabía…» usa `anadirAHoy` de siempre.
8. **«Ideas cerca de ti»:** salen de `candidatosParaAnadir` (EXPLORAR del destino; abiertos ahora; ninguno que ya esté en el viaje; hasta 15 o 30 min a pie/en coche según el caso), de 1 a 4. Sin ubicación ni alojamiento se ordenan desde el centro del viaje y no se enseñan minutos (nada inventado). A horas en que no hay nada abierto cerca, la tarjeta no sale y queda [Ver en Explorar].
9. **«Cerca de ti» en el día libre y al volver** sale como en un día normal (`CercaDeTiFila`). Durante la excursión NO sale: no hay datos de gasolineras, baños ni aparcamientos de La Graciosa, Pompeya, Florencia ni Nápoles en el proyecto, y la regla es «solo si hay datos de ese sitio». Si Eric quiere los de la isla, hay que añadirlos a los datos.
10. **El aviso «Excursión cancelada» [Deshacer]** y el de «La Graciosa, pasada al jueves 12 [Deshacer]** son `avisarAbajo` (`AvisoSobreLaBarra`). El segundo se pone un instante después de cambiar los días, porque el host de avisos del día de excursión se desmonta al cambiar de día y vacía la cola.
11. **Sonido (regla V52):** la tarjeta gris y la hoja no llevan animación nueva (sin movimiento que oír); no hay tarjeta nueva en el estudio de sonidos.

### Riesgos que quedan
- La cancelación y [Hacer … otro día] no avisan a otros viajeros de un viaje compartido (es de ese móvil, no de la ruta compartida): en un viaje con varios, el cambio de días SÍ se guarda en la ruta (y se comparte), la cancelación no. PROPUESTA: llevarla a `camposDelViajero`.
- [Otro día] de un pendiente de un día pasado usa `moveStopToDay`, que la V24 bloquea para días pasados: puede no hacer nada (ya era así antes de esta tanda; no se ha tocado). [+ A hoy] sí funciona.
