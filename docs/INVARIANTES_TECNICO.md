# Invariantes técnicos

Arquitectura del motor: un día por llamada, motor puro, caché, API, relaciones entre lugares, persistencia. Las reglas vivas que no son de pantalla ni de datos.

Las reglas se copian **tal cual**, con su número de siempre (`docs/INVARIANTES_MOTOR.md` queda como estaba, en solo lectura, y sigue siendo la fuente).
Lo que manda sobre cómo se monta una ruta está en `docs/REGLAS_RUTAS.md`; si una regla de aquí choca con esa hoja, gana la hoja.

## A. Lo que nunca puede salir mal en pantalla


1. **El Free Tour empieza a SU hora (`default_free_tour.default_time`, Roma 10:00) y nada lo retrasa.**
   *Se probó sin red y Claude lo colocaba a media mañana, detrás de un museo que abría antes: un
   free tour al que llegas tarde no existe.* Motor v3 (decisión del 2026-09-23): en ritmo completo
   puede ir antes una visita rápida que acabe antes del tour (Trevi a las 08:00, vacía, es otra
   experiencia — `early_visit_ok`); en tranquilo el tour es la primera parada. Lo que el tour
   recorre (`covers`) no vuelve a salir suelto ese día. Motores anteriores: la regla en el prompt +
   `enforceFreeTourFirst` como red de seguridad.

2. **Ninguna parada empieza antes de que el sitio abra.**
   *El Coliseo programado a las 07:30 (abre 08:30) y anunciado como "Acceso libre" — una entrada de
   18€ presentada como gratis.* Hoy: `validateStopHours` en el servidor + `parseOpeningMinutes` en
   el cliente, con parser **multi-tramo** (un horario partido "07:30-12:30, 16:00-19:30" tiene que
   leerse entero; leer solo el primer tramo cerraba iglesias a mediodía para siempre).

3. **`closed_on` se respeta cuando el viaje tiene fechas exactas.**
   8 lugares lo llevan (Vaticanos: domingo; Borghese, Mercados de Trajano, Ara Pacis, Capitolinos,
   Caracalla, Domus Aurea: lunes; Villa Farnesina: domingo). Sin fechas, la regla no aplica.

4. **Ningún lugar se repite entre días** salvo que sea una revisita explícita.
   *Plaza Colonna salió los días 2 y 3 del mismo viaje.* Ojo: el nombre es la clave de unión en toda
   la app (fichas, likes, caché de fotos), así que el deduplicado va por nombre exacto.

5. **Las horas que se muestran son las que se usan.** Si el motor decide 09:30, la ficha, el mapa,
   RESERVAS y Modo Hoy dicen 09:30.

6. **Nada se pinta en (0,0).** Las coordenadas placeholder se filtran antes del mapa y antes de
   cualquier cálculo de distancia (`hasRealCoordinates`), o el mapa se va al Golfo de Guinea y los
   "a 5 min a pie" salen en miles de km.

---


## B. Lo que manda sobre el algoritmo


11. **El nivel 1 entra SIEMPRE, elija el viajero lo que elija.** "Imprescindibles" como tarjeta es
    una promesa de la pantalla ("te hemos preparado lo esencial"), no un interruptor: apagarlo desde
    el cuestionario dejaría sin Coliseo a un primerizo que solo quiso marcar tres temas. Quien repite
    destino quita el Coliseo desde el menú de la parada, que ya funciona.
    *Sustituye a la versión anterior de este invariante, en la que la tarjeta sí apagaba el nivel 1.*

13. **Los restaurantes NUNCA son paradas de la ruta.** Hoy está garantizado por estructura: viven en
    su propio array `restaurants` y `routeAlgorithm.js` no lo menciona ni una vez. **Mantener esa
    separación física** es más seguro que cualquier condición.

---


## C. Relaciones entre lugares que el JSON ya codifica


14. **Un grupo es UNA visita.** `roma_antigua_core` = Coliseo + Foro + Arco de Constantino;
    `vaticano_core` = Vaticanos + San Pedro + Plaza de San Pedro (285 min juntos). El motor cuenta y
    coloca GRUPOS, no lugares sueltos, con su `group_order` interno. Consecuencia: "Coliseo y Foro
    van siempre el mismo día" **no necesita ser una excepción escrita** — es imposible separarlos. Y
    "una visita larga por día" se mide por grupo, no por lugar.

15. **El Free Tour no es una visita larga.** Recorre varios puntos a pie, no es un sitio en el que
    entras. No cuenta para "una visita larga por día": puede convivir con los Vaticanos o el Coliseo
    el mismo día.

16. **`contained_in` y `neighbor_of`: sitios dentro de otro o pegados a otro** (decisión del
    2026-09-23). Se deciden a mano, par a par, sobre la lista de lugares a menos de 300 m.
    - `contained_in` (lo de dentro → su contenedor: solo lo que está físicamente dentro y no se ve
      sin entrar, como la cúpula en su basílica o una fuente dentro del gueto; lo que está al lado
      o en su plaza es `neighbor_of`, ver 76). Si el contenedor está en el viaje, lo de dentro solo sale
      SU día, justo detrás de él y como una sola visita (encadenado aunque haya 4-5 min). Si el
      contenedor no está en el viaje, sale con normalidad.
    - `neighbor_of` (secundario → principal; el secundario es el de menor nivel, y a igualdad, el
      que se visita desde el otro). Si los dos están en el viaje, van el mismo día y seguidos (lo
      de dentro de cada uno va con él). Si el secundario no cabe ese día, se queda fuera: no se va
      a otro día. Un secundario con dos principales va con el que esté en su día, o entre los dos.
      Excepción de dirección: si el "principal" es un museo de pago y la plaza es su acceso
      (`approach_to`), manda el museo — la plaza va al día del museo, delante; sin el museo en el
      viaje, la plaza va en su día normal.
    - Si uno de los vecinos es el mirador del atardecer de un día (41), manda el mirador: va su día, y
      el otro va justo antes si ese día cabe y está abierto; si no, puede ir otro día (decisión del
      2026-09-24: Tempietto y Fontana dell'Acqua Paola; Popolo y Pincio).
    - Un grupo del JSON ya es inseparable: no hace falta marcar sus miembros como vecinos.
    - Programador: `relationBroken` (scheduleDay.js). Repartidor: `relationDays` +
      `enforceRelations` (planTrip.js). Lo vigila verifyPlanTrip.
    *Por qué: el Elefantino salía el día 3 con la Minerva vista el día 1, y Campo de' Fiori y Plaza
    Farnese (a 108 m) se repartían en dos días distintos en 21 de 96 viajes.*

17. **`related_to` (10 lugares)**: pareja natural (Castillo ↔ Puente Sant'Angelo, Basílica ↔ Cúpula,
    Mercados ↔ Columna de Trajano...). Se usa para sustituir una elección del pool por su pareja
    cuando encaja mejor con los intereses, y en el motor v3 para que la pareja vaya SEGUIDA si cae
    el mismo día (preferencia, no regla: a diferencia de un grupo, se puede separar). Castillo ↔
    Puente se citaba aquí de ejemplo pero no estaba en el JSON hasta el 2026-09-23.

17b. **Acceso + monumento (`approach_to`)**: la plaza, el puente o el parque va SIEMPRE antes del
    monumento al que da acceso, y si caen el mismo día, JUSTO antes: es el camino de llegada (con
    dos monumentos, justo antes del primero). Cada uno puede ir solo o en días distintos si no son
    inseparables (el Parque de Villa Borghese sin la Galería). Se acepta un rodeo de 10-50 m. Y son un
    grupo INSEPARABLE cuando el monumento se visita gratis (Basílica de San Pedro, Altar de la
    Patria: lo de pago es la cúpula o la terraza) o se disfruta también desde fuera
    (`visible_from_outside`: Castillo de Sant'Angelo, como el Coliseo). Si hay que entrar sí o sí
    (Museos Capitolinos, Galería Borghese), no: la plaza o el parque se ven sin el museo. El acceso
    no ocupa sitio propio: va encadenado y cuenta como una sola visita. Lo vigila verifyPlanTrip.

18. **`search_aliases`**: la tabla de equivalencias que hace que un viaje guardado con nombres
    antiguos siga resolviendo. Si el motor nuevo cambia nombres, los alias se actualizan **en el
    mismo commit**.

19. **Nombres en español en todas partes.** Nunca "Colosseum" ni "Fontana di Trevi" en pantalla.

---


## D. Cómo está construido el pipeline (restricciones de arquitectura)


20. **Un día por llamada, sin estado compartido.** `BLOCK_SIZE=1`: cada día se genera aislado, así
    que **toda decisión que cruce días tiene que ser determinista y recalculable desde cero**
    (reparto de noches, reparto de relleno, asignación de zonas). Si dos llamadas calculan cosas
    distintas, salen duplicados o huecos. Ver `docs/PREPLAN_MOTOR.md`.

21. **`contentDays = días - 1`**: el último día es la vuelta (`appendReturnLegDay`) y no lleva ruta.
    *Se cayó una vez y generó un día fantasma.*

    **Ojo con quién llama.** El esqueleto curado (`buildSkeletonV2`) devuelve días que TODOS llevan
    contenido — no incluye la vuelta, la añade el cliente. Por eso `generate-day-block` le pasa al
    motor `all_days.length + 1`: sin ese `+1` el motor descontaba una vuelta que ahí no existe y el
    último día de cada viaje se quedaba sin plan, caía en una llamada de pago a Claude y llegaba
    con contenido no curado.

22. **El servidor no tiene Mapbox para los tiempos a pie del cliente**: los trayectos reales que usa
    la UI se calculan en el cliente (`stopScheduling.ts`). El motor produce horas; el cliente las
    afina con distancias reales.

23. **Las excursiones y las experiencias de noche no son `places`**: catálogos aparte
    (`excursions.options`, `night_experiences`, `default_free_tour`). No entran en la selección
    normal ni se pueden añadir como parada.

24. **`is_free_access` es derivado, no un campo**: `is_free_access ?? type === 'exterior'`. Solo 4
    de los 67 lo traen escrito. La misma regla alimenta el filtro "Entradas" de la UI — si el motor
    cambia el criterio, cambian las dos cosas a la vez.

---


## E. Reglas de ritmo del motor nuevo


26. **El primer hueco del modo completo (8:00-9:00) es siempre un exterior** cercano al primer
    interior fuerte del día. Casi nada abre antes de las 9:00: es un paseo por la zona mientras
    abren, no un error de horario.

27. **Las excursiones de MEDIO DÍA solo caben en días de revisitas** (`dayNumber > core_days + 1`),
    una por día y sin repetir en el viaje. Ocupan 08:00-14:00, dejan 14:00-16:00 vacío a propósito
    (volver, comer, dejar la mochila) y la ruta de ciudad arranca a las 16:00. Ese día NO lleva
    bloque de comida: a esa hora el viajero está volviendo, no eligiendo restaurante. Tampoco lleva
    el banner de excursiones de jornada completa — proponerle salir de la ciudad a un día que ya
    sale es contradecirse.

28. **El TIPO de cada día lo decide el motor, no el esqueleto**: `core_days`/`max_auto_days` del
    destino mandan sobre el `day_pattern` viejo. El esqueleto marca todos los días como `city` y el
    cliente deja ganar al bloque (`type: blockDay.type ?? day.type` en el orquestador). *Con los dos
    decidiendo, un día de ciudad con excursión de media jornada llegaba pintado como día de
    excursión entero.*


## H. Reglas generales del motor v3 (decisiones del 2026-09-23)


Valen para CUALQUIER destino: el motor (`shared/routeEngine/`) no sabe nada de Roma; lo propio de
cada ciudad vive en su JSON. Roma aparece solo como ejemplo. Un destino nuevo no necesita tocar el
motor: necesita su JSON, su matriz de tiempos y pasar el kit (sección I).

**Reparto y programador**

37. **Horarios**: nada empieza antes de abrir ni se queda sin tiempo antes de cerrar; con cierre de
    mediodía se espera a la tarde. `last_entry` es opcional y se respeta si está. Un interior sin
    horario se supone de 09:00 a 17:00; un exterior, siempre abierto. Horarios sin días de la semana
    ni festivos.
39. **"Primera hora" (`best_time`) es cuanto antes**, y lo curado de mañana va antes de comer.

**Free Tour**

40. **El Free Tour va a SU hora** (`default_free_tour.default_time`), uno por ciudad. En tranquilo
    es lo primero del día; en completo pueden ir antes 1-2 exteriores rápidos, solo los de
    `early_visit_ok`, sin plan B (si no caben, el tour ya los enseña). Lo que recorre (`covers`) no
    vuelve a salir suelto ese día. Cambiar su hora recalcula el día alrededor.

**La tarde y la cena**

47. **Los tiempos salen de la matriz del destino** (`data/pipeline_v2/travel/<destino>.json`), con
    la API de RUTAS de Mapbox (la que usa la app), en los dos sentidos, con el modo como dato. El
    motor es un módulo puro: sin red, sin reloj, sin Node — el mismo que usará Modo Hoy con hora,
    posición y paradas restantes.

---


## J. Revisión de rutas (2026-09-24, PROMPT_REVISION_RUTAS_ROMA.md)


Reglas generales salidas de revisar en la app dos rutas de Roma de 3 días con el motor v3.

**Paso 1 — Datos y cálculo**

52. **La coordenada de un monumento es su ENTRADA, no el centro del edificio**, sobre todo en pares
    inseparables: el validador da rojo si un par inseparable está a más de 5 min andando. *La Basílica
    de San Pedro apuntaba al centro de la nave: Mapbox la rodeaba y salían 642 m desde la plaza.*
57. **Qué horario manda cada día** (`effectiveSchedule(place, {weekday, season})`), de más a menos
    preciso: con FECHAS, el `by_day` del día de la semana (sin avisos: ese es el real); con ÉPOCA del
    formulario, el `by_season`; sin nada, el de LUNES A VIERNES (`by_day`; si no hay, `windows`).
    La `last_entry` sigue la misma época (sin época, la más prudente).
58. **Sin fechas, la parada avisa** (`hours_warning`) de los días de la semana en que a esa hora está
    cerrado: "Ojo: el sábado de 16:00 a 16:30 no se puede visitar." Los `closed_on` también se avisan
    ("Cierra los miércoles."). Con fechas no hay aviso.
67. **El orden curado fijado a mano no cuenta como zigzag**: la métrica mide el mínimo respetándolo
    (Popolo → Pincio → España es para acabar en la Escalinata al atardecer).
68. **Día con excursión de medio día**: sin franja fija (excursión 08:00-14:00, tarde desde las
    16:00), pero entre las dos va SIEMPRE un bloque de comida: "¿Tu excursión incluye comida? Si no,
    cuando vuelvas a {destino} aquí tienes restaurantes perfectos para ti", con el mapa de
    restaurantes centrado donde empieza la tarde (sin paradas de tarde, en el centro de la ciudad).
69. **En la app, la tarjeta de comida va en su posición real** (detrás de la última parada que empieza
    antes de la franja) y enseña la franja ("13:00 – 14:30").

**Caché y respaldo (2026-09-24)**

70. **Un destino curado nunca usa `route_cache`** (ni lee ni guarda): el motor es gratis, instantáneo y
    más nuevo que cualquier ruta guardada. *Roma de 6+ días servía rutas de motores anteriores.*
71. **En la caché que queda (destinos no curados) cada fila lleva `engine_version`** (hash del modelo y
    los prompts de generación, `routeCacheVersion`) y solo se sirven las de la versión actual: al
    cambiar el motor, lo viejo deja de usarse solo.
72. **En un destino curado NUNCA se llama a Claude de respaldo.** Si el motor no da un día (vacío o
    error), sale como día libre (`engine_empty`) y se registra `[motor v3] día vacío` en el log.
    *Completar una ruta cacheada pedía el día de la vuelta, el motor lo daba vacío y se pagaba a Claude.*

**Paso 3 — Rellenos y experiencias**

76. **`contained_in` es solo para lo que está físicamente dentro y no se ve sin entrar al contenedor**
    (la Cúpula en la Basílica, las Tortugas en el gueto, el Bioparque en Villa Borghese). Lo que está al
    lado o en su plaza es `neighbor_of` (Via dei Fori Imperiali y el Foro, el Elefantino y la Minerva, el
    Teatro de Marcelo y el Barrio Judío).
77. **Si entra lo de dentro, entra su contenedor** ese día y justo delante. Un relleno solo arrastra un
    contenedor gratis; lo del pool o de una experiencia lo arrastra aunque sea de pago (`draggedBy`), y
    los dos cuentan como 1 en la experiencia. Si el contenedor no puede entrar, lo de dentro se quita.

80. **El tour cubre lo que se ve por fuera y las iglesias gratis por las que entra** (`covers`, en el orden
    del recorrido: el último es donde acaba y desde donde se va a comer). Lo cubierto no vuelve a salir
    suelto ese día, tampoco antes del tour. Un imprescindible con interior de pago (el Panteón) NO se
    quita: se visita por dentro aparte; de un grupo (Panteón + Navona), el tour cubre lo de fuera y en la
    ruta queda el interior. En viajes de 1 día va detrás del tour y, si no acaba antes de las 13:00,
    después de comer.
81. **Antes del tour solo entra lo que está a 10 min o menos del punto de encuentro** (`far_before_tour`).
    *Salía Trevi → Popolo → Plaza de España: más de 30 min andando antes del tour.*

**Paso 5 — Orden y geografía**

82. **Popolo → Pincio → Villa Borghese** con `approach_to` (el acceso va justo antes): Popolo da acceso al
    Pincio y el Pincio al Parque. La norma de datos "acceso + monumento gratis = grupo inseparable" no se
    aplica a pares que además son vecinos: pueden ir en días distintos por decisión.
90. **Puesta de sol**: con fechas, calculada (`sunset.js`, fórmula astronómica con las coordenadas y la
    zona horaria del destino, sin API); sin fechas, `sunset_by_season`; sin nada, no se sabe y el motor
    no promete atardecer. Un mirador cuenta como atardecer si se llega de 60 min antes a 15 después de
    la puesta; el motor busca la hora dorada (no antes de 45 min antes) y la visita dura como mínimo
    hasta que se pone el sol. Texto: de 60 a 30 min antes, "Llegas con tiempo para coger buen sitio
    antes del atardecer sobre {ciudad}."; menos, "Llegas justo a tiempo…". Si ese día el sol se pone a la
    hora de cenar o después, el mirador con versión de noche se queda de noche.
91. **Ningún precio, ni "gratis", fuera de la pestaña Tickets** (el `card_text` del horario no los lleva).
95. **Precio y condiciones de entrada, solo en la pestaña Tickets** (`ticket_info` del lugar, tarjeta
    "Entrada"): ni en el consejo (`tip`) ni en el horario. Al limpiar un texto, el dato se lleva allí,
    nunca se pierde.
99. **Ninguna cifra de precio en los datos**: la tarjeta "Entrada" (`ticket_info`) dice solo "De pago" /
    "Gratis", "Reserva obligatoria/recomendada" y datos útiles sin importe ("gratis el primer domingo de
    mes", "las excavaciones son aparte"). Los precios saldrán de las APIs de los proveedores, reales y al
    día. `validar.mjs` marca en rojo cualquier precio en `ticket_info`, `tip` o `card_text`.
101. **La bajada natural** (`leads_to`, datos del destino): "de A se sale directo a B" (del Campidoglio se
    baja al Barrio Judío). Si los dos van el mismo día, B justo después de A; en la tarde manda sobre los
    metros (solo por detrás de las esperas largas). Lo que va obligatoriamente seguido (lo de dentro con
    su contenedor, la bajada natural) se ordena como una sola pieza. El rato antes de comer no es un
    hueco y no cuenta como coste: no se mete una visita antes de comer para taparlo. Lo que pase de 60
    min sí es un hueco y cuenta (la mañana del lunes de Pascua no puede acabar a las 10:25).
103. **El motor siempre conoce la fecha o, como mínimo, el mes** (`tripCalendar.js`): recibe fechas
    exactas (cada día, su fecha y su día de la semana) o días + mes 0-11 (todos los días, el **día 15** de
    ese mes, sin día de la semana: horario de laborables + aviso). La temporada ya no es una entrada: se
    deduce del mes (dic-feb invierno) y solo sirve para mostrarla y como reserva (`by_season`). Un viaje
    antiguo con solo temporada pasa a su mes central (abril, julio, octubre, enero). Sin fechas, el mes
    es obligatorio en el formulario; con fechas, sale de ellas.
105. **El sol decide qué es tarde y qué es noche**: la puesta de sol se calcula (fecha real o día 15 del
    mes; `sunset_by_season` solo sin coordenadas) y **la noche empieza 30 min después**. Si eso es antes
    de la cena y el paseo cabe entre la última visita y la cena, las nocturnas van ANTES de cenar,
    recorridas hacia el barrio de la cena (si no cabe entero, sin lo más lejano); si no, después, desde
    las 21:30 o cuando ya sea de noche. No es una regla de invierno: sale de la hora del sol. Un
    exterior con horario (jardín, parque) que cierra antes de que sea de noche no puede ser nocturna ese
    día (lo que cierra en `sunset`, nunca); lo de interior se ve de noche desde fuera y no cuenta. La
    cena no cambia de franja.
106. **Disponibilidad por fechas** (`available: { from, to }` MM-DD, puede cruzar el año; en lugares,
    nocturnas, excursiones y, para experiencias, `destination_config.experience_availability[id]`).
    **Sin `aprox`, estricta**: con fechas, día a día (una experiencia, si algún día del viaje cae
    dentro); con solo el mes, solo si el mes cae entero dentro (en un mes frontera únicamente entra un
    lugar que el viajero puso en su pool). **Con `aprox: true`** (mercadillos, fiestas, eventos con
    fechas que cambian cada año): dentro del rango entra normal; hasta 15 días antes o después entra
    igual, con el aviso que trae el propio dato (`notice_before`: "Es probable que algunos mercadillos
    aún no hayan abierto.", `notice_after`: "…ya hayan cerrado.") en la parada y en la tarjeta de la
    experiencia; más lejos, no se ofrece. Con solo el mes: si toca el rango o está a 15 días o menos,
    entra con el aviso. No se pregunta nada en el formulario. Lo de temporada sigue en "Añadir parada"
    con "De temporada: solo del X al Y." Nunca se inventan fechas.
126. **Las calles no son paradas**: lo que lleva la etiqueta `calle` sale como "Pasas por…", 10 min, sin
    número (el Foro visto desde la Via dei Fori Imperiali sí es parada: es un sitio para mirar).
173. **Lo mejor primero** (semáforo, `primero`): en 2 días, las 4 joyas dentro de los 2 días; en 3+ días,
    como muy tarde el día 3 y ninguna solo el último día del viaje. Solo se comprueba: el reparto de
    mañanas aún no lo busca.
176. **Lo mejor primero, aplicado**: en viajes de 3+ días, una tarde de un día temprano (hasta el 3, y no
    el último) puede traer una joya que si no saldría tarde aunque su mañana vaya otro día (el centro
    barroco con el Panteón detrás del Coliseo), siempre que a esa mañana, si no es del último día, le
    queden 3 paradas propias. Una joya que se ve desde la calle y sale tarde (Trevi) entra además de paso
    en un día temprano. La reparación prueba a mover (o quitar) la mañana que deja una joya para el final;
    una joya tardía cuesta 60 (menos que algo del pool o un día muerto). Con Free Tour y 3+ días, el
    Vaticano va por la tarde del día del tour si eso no deja un medio día sin tipo. El Free Tour nunca se
    quita en una reparación: solo se mueve de día.
182. **Lo mejor primero, excepciones** (semáforo y revisiones): en 3 días con Free Tour vale una joya el día
    3; una joya que va tarde porque lo del pool ocupa los días de antes no cuenta; ni una joya cerrada todos
    los días posibles.

## G. Contrato de aceptación

224. **Pausas con nombre** (`curated_breaks`: el desayuno romano): la parada lleva `is_break`, `break_icon` y
    `break_suggestions` (los 2 cafés más cercanos de `restaurants`, `sub_category: cafe`) y ni horario, ni etiquetas,
    ni foto. La app la pinta como la comida (BreakCard), sin número ni marcador en el mapa, y no se abre: nunca pide
    ficha, foto ni nada a Claude.
225. **Etiqueta de los miradores**: al atardecer, `destination_config.sunset_text` ("🌅 El momento perfecto para ver
    el atardecer"); si llega de noche, `night_view_text` ("🌃 Roma iluminada a tus pies").
226. **Paseos nocturnos**: todas sus paradas llevan `night_walk_name` y la tarjeta enseña "🌙 Paseo nocturno: {nombre}".
    En 2 días, "El centro iluminado" solo si el Panteón o Navona no han salido de día (`solo_si_falta`); su texto se
    monta con lo que lleva de verdad (`texto_partes`).
227. **Foto del Free Tour**: `default_free_tour.photo_url` (la propia, pendiente) o, mientras, la de `photo_from`
    (Piazza Navona); nunca la que salga buscando "Free Tour".
228. **D5 tarde B en verano** (`si_sobra`): con más de 60 min antes de cenar y atardecer desde las 20:00, la tarde
    acaba con la Via dei Fori Imperiali y la Columna de Trajano al atardecer, y el rato de antes se queda en Monti.
229. **Cuestionario sin Claude en destinos curados**: `/api/classify-destination` y `/api/suggest-experiences`
    responden con `destination_config.classification` y `destination_config.experience_ids` del JSON. El transporte
    (`/api/transport-feasibility`) sigue con Claude hasta decidir los casos que FLUJO_TRANSPORTE.md no cubre.
230. **Fichas sin Claude**: `/api/place-detail` da la ficha del lugar al que pertenece lo que no es un lugar del
    catálogo: la nocturna (su `conflicts_with`), el Free Tour (su punto de encuentro) y "X visto desde Y" (X). El Free
    Tour saca de ahí su transporte cercano. `/api/describe-stop` se guarda en `place_content_cache` (destino
    `describe:{destino}`): se paga una sola vez por lugar.
250. **Sin fechas (solo el mes)**: solo lo de temporada y las fechas fijas de ese mes, con "Si tu viaje coincide con
    …:". Nunca los de día de la semana ni los de Pascua (sin año no se sabe el mes).
252. **`aviso_fecha` en una variante** (`{ icono, etiqueta, texto }`): el aviso de lo que esa variante del día de la
    semana cambia de un imprescindible (la audiencia de los miércoles, el Panteón del sábado). Nunca un aviso genérico
    de "el fin de semana hay más gente".
265. **`cifra_ok`** (en un lugar de la ficha, lista de frases): las curiosidades con cifra que no son precios ("unos
    3.000€ en monedas" que se recogen cada día en la Fontana de Trevi) se quedan y `validar.mjs` las deja pasar. Un
    precio (la tasa de la balaustrada, una multa, "monedas de 1 €") nunca: va sin cifra o a Tickets con las APIs.
266. **`cifra_ok: true`** (sustituye a la lista de la regla 265): lo que se queda con cifra a propósito lleva
    `cifra_ok: true` en su objeto (el lugar de la ficha, la nocturna o el texto `{ texto, cifra_ok }`) y `validar.mjs`
    lo deja pasar: la tasa de la balaustrada de Trevi bien explicada (no es una entrada: la fuente es gratis y solo se
    paga por bajar junto al agua de 9:00 a 22:00), los 3.000 € diarios y el millón para Cáritas. Un `por_que`
    `{ texto, temprano }` puede traer `temprano_antes` ("09:00") si su umbral no es el de siempre (09:30).
267. **Una cifra que evita una sorpresa se explica, nunca se quita** (decisión del usuario, 2026-09-27): la tasa de 2 €
    de Trevi no es una entrada (la fuente se ve gratis desde la plaza a cualquier hora; solo se paga por bajar junto
    al agua de 9:00 a 22:00, algunos laborables desde las 11:30). Va en la ficha, en la nocturna de las fuentes y en el
    `por_que` de Trevi (con `temprano_antes: "09:00"`: a las 9:15 ya no se baja sin pagar), todo con `cifra_ok: true`.
268. **`hora_ok: true` en la parada** (scripts/destino/textChecks.mjs, validar.mjs y el recuento de la revisión): un
    `por_que` con hora está bien si la hora es un DATO DEL SITIO (abre, cierra, hora fija: la bendición Urbi et Orbi,
    Santa Maria del Popolo, Santa Cecilia) o si dice cuándo llega el viajero y coincide con la ruta con 30 min de margen
    como mucho (medido: el Vaticano de D3 entra a las 14:45 en todas; "con la última luz" en Via dei Fori Imperiali, en
    el atardecer las 178 veces). Si no coincide, `{ texto, temprano }` o se reescribe. "Casi siempre sin gente" no habla
    de horas y no cuenta.
269. **Títulos del día que prometen una hora** (textChecks.mjs, `tituloQueNoSeCumple`): si el título dice "sin gente" o
    "a primera hora" de una parada, esa parada tiene que empezar antes de las 09:30; si dice "al atardecer", ese día una
    parada tiene que ser la del atardecer. Si una variante lo rompe, la variante lleva su propio `nombre` (sin la
    promesa). Roma: D4 y D4M en tranquilo ("Trevi, el Popolo y la Borghese", "Trevi, el Pincio y la tarde en Monti"),
    D1-FT en invierno y en tranquilo ("Roma Antigua, el Ghetto y Trastevere") y D2 en tranquilo de invierno ("Vaticano,
    Castillo y Trastevere"): rompían el 100 % de las veces. D3 nunca (Trevi antes de las 09:30 también en tranquilo).
    El barrido lo apunta como `titulo_hora` (amarillo, no es fallo); la revisión lo cuenta.
270. **Un monumento no va nunca escondido en el texto de otra parada** (decisión del usuario, 2026-09-27; como el
    Altar): lo de su grupo que ese día no se visita (cerrado, no toca este viaje, el tope de museos de pago, o que no
    llega a su hora) y lo que un lugar tiene delante (`pass_by.includes`: la Plaza Venecia desde el Altar) sale en su
    propia línea junto a su compañero: "Por fuera" con su motivo si es un monumento, "Por el camino" si no. Se ve desde
    el compañero: en su mismo punto, 5 min que salen de la visita del compañero (el día no se alarga), antes o después
    de él según el día curado. Su texto, `por_fuera` si lo trae (`{ texto, por_fuera }`, el Castillo); lo que no es
    parada curada toma el suyo de `por_que_lugares`. "Por fuera" tampoco se rellena con el redondeo (10 min como mucho).
    Si su línea no cabe sin perder nada, queda nombrado en el compañero como antes (7 casos sueltos en el barrido).
275. **"Quiero entrar"** (decisión del usuario, 2026-09-28): una parada por fuera porque no cabe (`outside_kind:
    'no_cabe'`; nunca si está cerrada) lleva un interruptor. `/api/curated-day-inside` rehace ese día curado con la
    parada por dentro y obligatoria (`insideNames`: como si estuviera en el pool, sin sus reglas; no cambia paradas ni
    orden, solo recoloca horas) y lo compara con el de antes (server/engine/insideSwitch.js). El tiempo sale de lo
    estirable y de lo de menos nivel (pasa a por fuera o sale); la comida y la cena nunca se acortan, solo se mueven en
    su franja. Si se pierde un imprescindible o el atardecer, se pregunta ("Para entrar hay que quitar el Janículo.
    ¿Lo cambiamos?"). Antes de guardar, una línea con lo que cambia y "Vale" / "Mejor no". La ruta guarda
    `insideNames`.
278. **Tono de los textos** (decisión del usuario, 2026-09-28): los "Por qué aquí" (`por_lugar`, `por_dia`) y los
    `por_fuera` se escriben como te lo contaría un amigo que vive allí: un poco de contexto y un detalle que poca gente
    sabe, sin enrollarse (dos o tres frases). Se aplican tal cual desde docs/<destino>_por_que.json a las paradas de los
    días curados (`por_que`), a `por_que_lugares` y a `minutos_fuera`/`por_fuera` de cada lugar. Siguen las reglas de
    siempre: `temprano`/`temprano_antes`, `cifra_ok` solo donde el usuario lo pone, "gratis" solo cuando suma. Plantilla
    en docs/kit/plantilla_por_que.json (`_estilo`) y docs/kit/plantilla_por_fuera.json (`_tono`).
279. **Todo nivel 1-2 con algo que ver por fuera lleva `minutos_fuera`** (decisión del usuario, 2026-09-28): Santa Maria
    del Popolo y San Pietro in Vincoli (10 min) no pueden desaparecer, así que salen siempre como parada, aunque sea por
    fuera. El Ara Pacis no lleva: desde fuera apenas se entrevé tras la cristalera y no merece un desvío; si no se
    entra, va a "No te dio tiempo".
281. **Tarjetas sin texto** (decisión del usuario, 2026-09-28, para todas las paradas y todos los destinos): la tarjeta
    cerrada del día no lleva el texto descriptivo ("Por qué aquí" / resumen). Fuera solo lo que se escanea de un
    vistazo: hora, nombre, foto, horario, duración, "Por dentro / Por fuera" con su motivo corto, avisos en rojo y
    etiquetas. El "Por qué aquí" es el primer párrafo de Resumen en la ficha. Vale también para las nocturnas, las
    pausas (el desayuno romano ahora abre su ficha) y los "Por el camino".
282. **"Por fuera" en la tarjeta**: el motivo va en la misma línea, a la vista sin abrir: "Por fuera · 15 min · Hoy
    cierra" o "· A esta hora ya ha cerrado" en rojo; por tiempo, en gris y corto: "· para llegar a todo". Por fuera no
    sale "Reserva recomendada" (no hace falta reservar para verlo desde fuera); dentro, en Entradas, sí. "Quiero
    entrar" va dentro de la ficha, arriba del todo en Resumen, justo debajo del motivo, y solo si el motivo es de
    tiempo (`outside_kind: 'no_cabe'`); con "Vale" se cierra la ficha y el día sale rehecho, con la parada "Por
    dentro". La ventana se compone de tres piezas (server/engine/insideSwitch.js): lo que ganas ("Si entras, tendrás
    unos 70 min para {lo_mejor_dentro}."), lo que cambia de verdad ("Para que te dé tiempo, el paseo por Trastevere se
    queda en 45 min y cenas a las 21:30.") y lo que no pierdes ("Tranquilo: sigues llegando al Janículo para el
    atardecer."). Si se pierde el atardecer o un imprescindible, lo dice claro y ofrece la alternativa ("…Lo verás ya
    de noche, con Roma iluminada, que también es precioso. ¿Lo cambiamos?"). `lo_mejor_dentro` va en cada lugar con
    `minutos_fuera` (y en docs/roma_por_que.json, `por_fuera`).
283. **Un lugar no aparece nunca dos veces en el mismo día** (decisión del usuario, 2026-09-28). Si una entrada suya va
    por dentro, la otra no se queda "por fuera" (la Galería de D4 con Free Tour: turno de las 13:00 en invierno, de
    las 15:00 si no); de las que no van, una sola por fuera; y cada sección sin repetidos (resolveEntry). La revisión
    lo cuenta ("Lugares repetidos en el mismo día": 0).
284. **Los minutos "por fuera" son los del JSON y no se recortan** (decisión del usuario, 2026-09-28): ni al verse desde
    su compañero (la línea propia del monumento lleva su `minutos_fuera`, no 5 min), ni al quitarle a un monumento por
    fuera los minutos de lo que se ve desde él, ni con el redondeo al cuarto de hora (quarterHourStops). Si no cabe
    con su tiempo, el motor decide como con cualquier parada.
285. **El pool manda: tiene que entrar** (decisión del usuario, 2026-09-28). En tranquilo, si lo del pool (o un nivel 1)
    se queda fuera, el día madruga un poco (de 30 en 30 min) y, si ni así, madruga Y acorta la comida, lo justo (la
    Galería de la ruta 20). La revisión cuenta "Lugares del pool fuera" (0).
286. **Un imprescindible dura 20 min como mínimo** (salvo por fuera o de paso): la Plaza de España no se ve en 10.
    En unitOf (la parada corta de exterior y el `minutos` del día curado) y en quarterHourStops (`min_minutes`).
287. **Cierres del 25/12 y el 1/1 comprobados** (2026-09-28): la Galería Borghese y el Castillo cierran los dos días;
    Capitolinos, Mercados de Trajano y Ara Pacis cierran el 25/12 y el 1/5 (el 1/1 abren); Doria Pamphilj, el 1/1, Pascua
    y el 25/12. Sin confirmar (no se ha tocado): Cúpula de San Pedro, Domus Aurea, Villa Farnesina, GNAM y San Clemente.
288. **Sugerencias de las fechas especiales** (decisión del usuario, 2026-09-28): una `sugerencia` con hora entra en la
    ruta de ese día a su hora y el resto se ajusta. Una pausa del destino (la Bendición Urbi et Orbi, 11:30-12:30 el
    25/12 —`dia`— y el Domingo de Pascua) se añade a la mañana o a la tarde; si el día ya lleva el lugar (el Panteón el
    21/4), se le pone esa hora; un lugar que el día no lleva no se añade. Si no llega a su hora, sale lo de la mañana
    que va justo antes (nunca un nivel 1 ni lo del pool); la comida con hora fija no la pisa (come después). "(noche)":
    esa noche la nocturna es esa, a su hora (la Girandola, 21:30, en el Puente Sant'Angelo; `fixedStart`).
289. **Avisos de fechas que cuadran con la ruta** (decisión del usuario, 2026-09-28): la promesa final del texto curado
    ("Hemos puesto…", "Hemos colocado…") solo sale si su sugerencia está de verdad en la ruta de ese día. Si el aviso
    automático ya cuenta los cierres y lo movido (solo de lugares del viaje), el curado aporta su `contexto` (el mismo
    texto sin los cierres): sale uno y nunca nombra un lugar que no está en el viaje (el 1 de mayo ya no habla de
    Caracalla). También sin fechas ("Si tu viaje coincide con…" usa el `contexto`).
305. **"+ Añadir día" y la pantalla de añadir** (decisión del usuario, 2026-09-28), general para todos los destinos:
    - El día añadido va detrás del último día de ruta (el de vuelta se mueve un día), es `manual` con `userAdded` y el
      motor no lo toca nunca: al rehacer el viaje se planifica sin él y vuelve igual, en su número de día. El semáforo,
      la auditoría y el barrido no lo ven (solo vive en el cliente). Máximo 14 días por viaje.
    - "+ Añadir" en cada sitio (desde el día o desde Explorar) pregunta a qué día. Hora sugerida: cuando acaba la
      anterior más el paseo, al cuarto de hora (menos de 3 min andando, encadenada); en un día vacío, las 09:30; con
      excursión de medio día, las 14:00. Avisos solo si pasan: cerrado a esa hora (con el horario de ese día y de esa
      época, el mismo cálculo que el motor), se pisa con otra parada, reserva. Se puede añadir igual.
    - Los restaurantes nunca son paradas: van como comida o cena (en un día nuestro la sustituyen; en uno libre, a las
      13:30 o las 20:30). Las excursiones, solo en un día vacío; la de día entero lo ocupa.
    - En un día libre: "Con horas / Sin horas" (al volver a "Con horas", horas seguidas desde las 09:30); arrastrar
      reajusta desde la parada que cambia hacia abajo y la primera conserva su hora; "Mover a otro día" la pone al final
      con su hora sugerida. Quitar un día, quitar una parada, moverla o cambiarle la hora dejan "Deshacer".

306. **Días libres: solo paradas, y las horas las pone el viajero** (decisión del usuario, 2026-09-28; sustituye a lo
    que la 305 decía de las horas en los días libres):
    - Un día libre no tiene hora sugerida, ni "Sin hora", ni interruptor "Con horas / Sin horas". Las paradas salen en
      el orden en que el viajero las pone, con los minutos andando entre una y otra, y sin hora (`time: ''`).
    - Cada parada lleva "Poner hora" (luego "Cambiar hora" o "Quitar hora"). La app no calcula ni mueve esa hora, y no
      reordena por ella; arrastrar o subir/bajar solo cambia el orden.
    - En rojo, solo el dato de la parada: "Hoy cierra" y, si tiene hora, "Cerrado a esa hora", con el horario de ese
      día y de esa época (la parada guarda los datos de horario del lugar, así que vale aunque el día cambie de fecha).
    - Los días nuestros siguen igual: al añadir, hora sugerida y los avisos de siempre.

307. **Comidas y cenas con restaurante recomendado, que el viajero puede cambiar** (decisión del usuario,
    2026-09-28; se descarta "solo la zona"):
    - El motor pone un restaurante curado en cada comida y en cada cena (`recommendedRestaurant` en
      shared/routeEngine/dinnerZones.js para la cena; `lunchSpots` para la comida). Si ese día cierra (`closed_on`
      semanal o `closed_dates`, leídos del horario comprobado de cada restaurante), pone otro de los del día o, si
      cierran todos, de la misma zona.
    - Los paseos se miden desde ese restaurante (no desde el centro de la zona), así que no salen "tramos largos"
      falsos.
    - En la línea: "Comida · Giggetto al Portico d'Ottavia" (o "Cena · …"), los minutos andando con la parada anterior
      y la siguiente, y "Cambiar": el mapa de restaurantes centrado en esa zona, con los de la zona primero
      ("Recomendado") y en gris los que cierran ese día ("Hoy cierra").
    - Cambiar de restaurante no mueve ninguna hora: solo cambian los minutos andando que se enseñan.

323. **Días escritos: la estructura** (decisión del usuario, 2026-09-28; formato en `docs/DIAS_ESCRITOS_FORMATO.md`;
    todavía en borrador, el motor actual sigue hasta que los 56 viajes salgan igual o mejor):
    - Cada día, en dos mitades: la mañana se escribe una vez; la tarde, en 4 versiones por la hora del sol, cada una de
      unos 60 min de ancho (Roma: A antes de las 17:40, B hasta las 18:44, C hasta las 19:44, D desde las 19:45).
      Cada tarde se escribe para el sol del centro de su versión.
    - Una sola parada elástica por tarde, elegida a mano, de ±30 min. Ninguna otra parada cambia de duración.
    - Solo se escriben duraciones y horas fijas (entradas, Free Tour); el resto de horas las calcula el motor.
    - Variantes solo donde un cierre toca ese día (lunes, domingo con misa, miércoles de audiencia) y en los festivos
      grandes; una variante dice qué cambia (quitar, cambiar, mover, restaurante), no reescribe el día.
    - Cada parada lleva qué hacer si está cerrada: por fuera con su texto, o el cambio por otra parada concreta.
    - Restaurantes escritos por día y mitad, con su alternativa; nunca el mismo dos veces en el viaje.
    - Las entradas que se venden, marcadas en su parada; todo imprescindible de pago por dentro al menos una vez por viaje.

324. **Días escritos: el pool** (2026-09-28): `pool_lista` es una lista cerrada y cada lugar tiene su sitio escrito
    (día, mitad y qué sustituye), su sitio si ese día no está en el viaje y un segundo sitio; si dos chocan, manda el
    orden de `pool_lista`. Lo que ya está siempre en las rutas, si se elige, queda garantizado por dentro. Lo que el
    viajero añade después («+ Añadir», Explorar) no mueve la ruta.

325. **Días escritos: el ritmo** (2026-09-28): paradas fijas (con hora; dos si cambia con el ritmo), normales (en los
    dos) y opcionales (en tranquilo se quitan; pueden llevar a dónde pasan o una sugerencia). El tranquilo solo cambia la
    mañana (empieza más tarde, quita las opcionales) y la comida llega hasta la hora escrita de empiezo de la tarde: lo
    que sobra va a la comida o al paseo de esa mañana, nunca a un hueco. Las 4 tardes son las mismas en los dos ritmos.
    El título y los textos llevan versión tranquila cuando mencionan algo opcional.

326. **Días escritos: la comprobación** (2026-09-28): en la prueba, no en la app. La app nunca inventa ni estira; la
    prueba recorre las 365 fechas de inicio con todas las duraciones, los dos ritmos, con y sin Free Tour y cada lugar
    del pool solo y en parejas, con las comprobaciones de `auditoria.mjs`, y lo que salga se arregla en el dato.


328. **Días escritos: las cenas y la segunda elástica** (2026-09-29): en las tardes A y B, después del atardecer, primero la
    nocturna (20-25 min) y luego «luces y aperitivo», 90 min como mucho: es la segunda elástica, y la cena lleva su hora para
    que caiga ahí. En C y D la cena es al llegar (a partir de las 19:30). Con días escritos, el restaurante escrito manda: el
    servidor no lo vuelve a elegir junto a la nocturna.

329. **Días escritos: ninguna parada de paseo pasa de 90 min** (120 en tranquilo, 45 una avenida), ni en el borde de la
    elástica: la base de una elástica de parque o barrio es de 60 como mucho.

330. **Días escritos: lo que va por fuera dice por qué** (2026-09-29): lo escrito «por fuera» lleva el motivo real si a esa
    hora está cerrado («A esta hora ya ha cerrado», «Todavía no ha abierto»), no «para llegar a todo».

331. **Días escritos: las entradas** (2026-09-29): el Castillo va siempre por dentro en D2 y, con Free Tour, por la mañana
    de D4 (con 4 días o más); el Panteón por dentro al acabar el Free Tour; los museos de pago según el día y la versión (Ara
    Pacis en D4, Mercados de Trajano en D4M, D5 y D5C, Capitolinos en D5, Domus Aurea con Arte los fines de semana).

332. **Días escritos: el pool** (2026-09-29, amplía la 324): lo que ya va en la ruta no cuenta como elección y queda
    garantizado por dentro (lo opcional deja de serlo); los extras, hasta 2/3/4/5 según los días, en el orden de
    `pool_lista`; cada extra en su primer sitio escrito cuyo día está en el viaje y cuyo hueco está libre. Lo que no tiene
    sitio sale como no incluido con su motivo (el Castillo con Free Tour en 2-3 días).

333. **Días escritos: fechas especiales** (2026-09-29): los cierres de las fichas (`closed_dates`) con lo escrito en
    `si_cerrado` y el orden de los días resuelven la mayoría; tienen versión escrita el 1 de enero (D1, D1-FT, D4), el 25
    de diciembre (D1 y D2, con la Bendición Urbi et Orbi), el Domingo de Pascua (D1) y el primer domingo de mes (el Coliseo
    antes de que abra). La Girandola y el Vía Crucis van a su hora como nocturnas del día.

334. **Días escritos: al mirador, de 15 a 35 min antes del sol** (2026-09-29): la elástica mueve ±30; lo que no llega a
    absorber (hasta 10 min más) lo absorbe la llegada al mirador, que se adelanta o se retrasa respecto a los 25 de
    siempre. Por menos de 5 min no se adelanta. La prueba de las 365 fechas marca la elástica solo si pasa de ±40.

335. **Días escritos: un traslado escrito no se usa si andando son 12 min o menos** (2026-09-29): la parada lleva su taxi o
    su bus para cuando viene de lejos; si esa vez viene de al lado (la Isla Tiberina y Santa Cecilia, cuando van seguidas),
    se va andando.

336. **Días escritos: la versión vecina en la frontera de luz** (2026-09-29): si el sol está a 15 min o menos del corte y la
    elástica no llega en su versión, el día prueba la versión vecina (con lo mismo del pool) y se queda la que llegue
    mejor. Sale en las variantes como `luz:B→A`.

337. **Días escritos: un sitio del pool compensa lo que añade** (2026-09-29): si un extra mete tiempo en una tarde con
    atardecer, su sitio quita o acorta algo de esa versión (el Aventino en D2 acorta Trastevere; los Capitolinos en D5 A
    quitan las Catacumbas y la Isla; el Parque en D4 A es el lago en lugar de los jardines), para que el mirador siga
    llegando a su hora.

338. **La excursión, desde `excursion_desde_dias` días** (2026-09-29; Roma, 5): con menos días de contenido todo es
    ciudad (Roma en 4 días: D1, D2, D4 y D5C; con Free Tour, D3, D1-FT, D4 y D5C) y la excursión se ofrece en un solo
    día, el de `excursion_oferta.dia`, con su texto y sin precios; los demás días no llevan banner. Si el viajero la
    elige, ese día pasa a ser la excursión (convertDayType) y nada más cambia. Con 5 días, los 4 y la excursión; con 6 y
    7, D5 (Via Appia), D6 y D7.

339. **Días escritos: toda parada lleva su «Por qué aquí»** (2026-09-29): el texto escrito en la parada; si no, el de los
    días curados; si no, el del destino (`_destino.json` → `textos`). Nunca el genérico «Te pilla de camino» en un día
    escrito. Y `engine: 'v4'` en una petición va al v3 con días escritos (antes caía en el motor «nuevo»).

340. **Días escritos: toda tarde de verano (C y D) acaba en un atardecer** (2026-09-29): si el sol se pone después de
    cenar la hora de siempre, la tarde lleva su mirador antes de la cena (D1: el Ponte Sisto, a 5 min de Campo de'
    Fiori, con Campo como elástica).

341. **Días escritos: la cena, nunca antes de las 19:30** (2026-09-29) **y en verano (versión D), nunca antes de las
    20:30**. Si se llega antes, el rato va a la nocturna y a «luces y aperitivo» (90 min como mucho); si lo último del
    día es un mirador (no una avenida), se queda en él hasta 30 min más, con las luces.

342. **Días escritos: el restaurante de la comida, a 15 min andando como mucho de la parada de antes** (2026-09-29): el
    escrito o su alternativa; si ninguno está a esa distancia (la Galería Borghese y Poldo e Gianna, a 29), el más cercano
    que abra ese día.

343. **Días escritos: paradas según la hora del sol** (2026-09-29): `sol_desde` / `sol_hasta` en una parada la dejan solo
    si el sol se pone a partir de / antes de esa hora, porque una versión de la tarde abarca una hora de sol. D4 A en
    domingo: con el sol desde las 17:20, Santa Maria del Popolo a las 16:30 (los festivos abre de 16:30 a 18:00), entre el
    Popolo y la Terraza; antes, después del atardecer. (17:20 y no 17:10: con 20 min dentro y 10 de subida, a la Terraza
    se llega 15 min antes del sol solo desde las 17:20.)

344. **Un aviso de fecha que nombra un lugar que no está en el viaje no sale** (2026-09-29): cualquier día, de día, de
    noche o en el Free Tour. Si el lugar está, el aviso sale como siempre.

345. **Un extra del pool nunca le quita a un imprescindible de pago su visita por dentro** (2026-09-29): si el día de un
    extra deja uno por fuera por la hora, el viaje se vuelve a montar con el extra en su siguiente sitio, y se queda así
    solo si mejora.

346. **Ningún tramo de más de 25 min andando va a pie** (2026-09-29): lleva su bus o taxi escrito y, si no lo trae, va en
    taxi con su tiempo estimado.

347. **Días escritos: la variante de fecha va después de la de cierre** (2026-09-29): es lo más concreto y manda (Navidad
    en D2, con los Museos cerrados, conserva la Bendición). Y un extra o una experiencia que entra en un día con una
    parada que tiene hora (el Panteón del sábado) se escribe con `antes_de`, no `al_principio`.

348. **Ninguna parada se recorta de más** (2026-09-29): la elástica no baja del 75 % de lo escrito ni de 15 min (20 un
    barrio), y un barrio nunca se escribe por debajo de 20. Si la elástica tendría que quedarse en menos de 15, se quita,
    solo si después hay un bloque del mismo barrio (Monti con el aperitivo en Monti) y nunca si es del pool. La prueba
    marca `parada_corta`. La llegada al mirador solo se adelanta en un mirador, nunca en una avenida (los Foros).

350. **D1-FT A**: al Janículo en el bus 115 y se baja por la Fontana dell'Acqua Paola y el Tempietto; el Barrio Judío
    20 min y la Isla 15, sin recortes. **D4 B en domingo**: Santa Maria del Popolo 20 min y el lago de 20, con la tarde
    desde las 14:45 (abre a las 16:30). El mirador solo se alarga si la cena espera en C y D: en A y B ese rato es de la
    nocturna y del aperitivo (la Terraza del Pincio de 70 min del 14 de marzo).

351. **Nunca dos bloques seguidos del mismo barrio antes de cenar** (2026-09-29): el barrio de la tarde, su nocturna y el
    aperitivo del mismo barrio («Trastevere» + «Trastevere de noche» + «Paseo por Trastevere iluminado y aperitivo») se
    juntan en uno, «Trastevere al anochecer y aperitivo»; la nocturna de ese barrio va después de cenar.

352. **El aperitivo, 90 min como mucho, siempre** (2026-09-29): si el rato hasta la cena es más largo, la cena se
    adelanta (nunca antes de las 19:30, ni de las 20:30 en verano) y lo de después de cenar se mueve con ella.

391. **Ningún texto promete una hora que la ruta no cumple** (PROMPT_TEXTOS_RITMO).
    - Las horas que se enseñan salen del motor, no de lo que el ritmo pretendía:
      - `pace_stats.<ritmo>.inicio` es la hora de la primera parada de cada día con el motor v4: la mediana, de 5 en 5,
        medida con `scripts/destino/paceStats.mjs --guardar`, igual que las paradas por día;
      - si no todos los días empiezan igual, lleva `inicio_desde` / `inicio_hasta` (cuartiles 25-75 %). El formulario
        dice «El día empieza entre las X y las Y», y el gráfico empieza en `inicio`.
    - El banner de tranquilo no da hora fija. Solo dice que algún día empieza pronto, cosa que se ha comprobado en todos
      los viajes de la muestra.
    - Un aviso por día («Hoy toca madrugar… a las {hora}») usa la hora real de ese día.
    - Al cambiar los días escritos o el motor, se vuelve a pasar paceStats.

393. **El bus o taxi de un tramo largo se queda aunque la parada cambie al llegar** (PROMPT_TEXTOS_RITMO 7). A más de 25
    min andando, el tramo va en bus o taxi, con su tiempo real, y la hora de llegada es la anterior + su duración + ese
    trayecto. Esto vale también cuando, al llegar, la parada está cerrada y pasa a «por fuera» o se cambia por otra: el
    transporte del tramo no se pierde. Antes la hora contaba el taxi, pero la pantalla pintaba «33 min andando» de San
    Pedro a Santa Cecilia en Navidad, y 27 a Santa Maria in Trastevere el 14 de agosto.
    - **Un destino sin medición del motor no dice ninguna hora** (2026-09-30): con los valores de reserva (`medido` ausente),
      la pantalla de ritmo no pinta «El día empieza a las…» ni la marca de inicio del gráfico. «≈ N planes al día» se queda,
      como orientación.

396. **En los festivos con el transporte recortado, fuera de sus horas solo andando o en taxi** (PROMPT_ROMA_NAVIDAD 1).
    - Los horarios viven en `destination_config.transporte_festivos` (por fecha: `servicio`, o `bus` y `metro` por separado),
      con su fuente, su fecha y `verificar` (cambian cada año). Roma 2025-26: el 24 de diciembre todo para a las 21:00; el
      25, solo de 8:30 a 13:00 y de 16:30 a 21:00; el 31, el bus hasta las 21:00 y el metro hasta las 2:30; el 1 de enero,
      desde las 8:00.
    - Un tramo escrito en bus o metro que cae fuera de esas horas pasa a taxi (o a pie si son 25 min o menos): nunca en bus
      ni metro (`shared/routeEngine/holidayTransit.js`).
    - El aviso de traslado largo dice «o en taxi», no «o en bus o taxi», y ningún texto de una parada manda al bus o al metro
      a esa hora («Sube con calma o en el bus 115» → «…o en taxi»).
    - Los paseos nocturnos van a pie desde la cena: ninguno depende del metro para volver.

397. **Una experiencia elegida siempre añade algo a la ruta, o no se ofrece** (PROMPT_ROMA_NAVIDAD 2).
    - La ventana de una experiencia de temporada vive en `destination_config.experience_availability` (con `aprox`, sus
      avisos de margen y `descripcion`: lo que esa experiencia es en ESE destino, para la tarjeta del formulario). Con
      ventana, manda ella; la regla de «solo en invierno» queda para los destinos sin ventana.
    - **Capas** (`capa_de`): un lugar de la experiencia que está en el mismo sitio que una parada no es otra parada. Cambia
      la que ya existe: su título, su tiempo y su texto («Piazza Navona y su mercadillo de Navidad», 45 min). Una vez por
      viaje, en el primer día que lleva esa parada, y solo en sus fechas. En el margen de una ventana aproximada la parada
      se queda como es, con el aviso («Es probable que el mercadillo ya haya cerrado»). Nunca dos paradas en el mismo sitio,
      y una capa no sale como «idea» de tiempo libre.
    - Lo que cada día escrito añade con la experiencia va en sus `experiencias.<id>`; con `si_disponible: <lugar>`, solo los
      días en que ese lugar está en fechas. Lo insertado de temporada (un «de camino», o una parada con
      `si_cerrado: "quitar"`) no va fuera de sus fechas, sin margen.
    - Si la parada de debajo no sale ese viaje (el Free Tour ya pasa por Piazza Navona), lo de la experiencia va donde
      quepa sin quitar nada: el mercadillo al anochecer, al salir del Vaticano, y la cena al lado (`noche: "sin_paseo"`).
    - Roma: el mercadillo de Piazza Navona (capa), los 100 Presepi (capa de la Plaza de San Pedro, desde el 8 de
      diciembre), el Santo Bambino de Aracoeli (de camino, desde el 24) y el paseo de las luces del Tridente (D4).

398. **Las líneas de temporada de las fichas** (PROMPT_ROMA_NAVIDAD 3): cuando la ruta ya pasa por un sitio en sus fechas, la
    ficha de esa parada lleva una línea arriba del Resumen, destacada y con el icono de Navidad. No se añaden paradas.
    - Viven en el JSON del destino (`navidad_lineas.lineas`), cada una con sus `lugares`, `desde`, `hasta`, `fuente`,
      `comprobado` y, si hace falta, `verificar` con su nota. Los textos son del usuario y van tal cual.
    - Una línea por parada como mucho; si hay dos, gana la de la fecha más concreta. Una línea sale una vez por viaje: el
      primer día que pasa por su sitio.
    - Con `verificar`, la línea no sale hasta que el dato esté confirmado ese año.
    - `siguiente_si_ocupada`: si su parada ya lleva otra, va en la siguiente parada de esa lista. `no_si_mercadillo`: no
      se repite el día en que la ruta ya cuenta el mercadillo (la parada con su título o el texto del paseo de noche).
    - Solo con fechas reales, y las nocturnas no llevan (tienen su propio texto de fechas).

399. **El 14 de agosto, y los festivos de verano con los Museos Vaticanos cerrados** (2026-09-30; cambia la regla 394): se
    empieza temprano igual (San Pedro a las 8:30, con la Cúpula y la Basílica) y el Castillo va antes de comer. Después de
    comer, un descanso largo por el calor, y las iglesias de Trastevere por dentro cuando abren: Santa Maria in Trastevere
    a las 16:00 (hora fija en la variante de verano, `tarde.D`) y Santa Cecilia a las 16:30.
    - **En verano, un descanso largo después de comer no es un aviso:** la prueba no lo cuenta de junio a agosto, entre las
      14:00 y las 16:30.

400. **Cierres con año** (2026-09-30): `closed_dates` admite, además de "MM-DD" (todos los años) y "easter±N", una fecha
    completa "AAAA-MM-DD", que vale solo ese año (los Museos Vaticanos el lunes 1 de noviembre y el lunes 16 de agosto de
    2027, del calendario oficial). Cada una con su fuente en `closed_dates_audit`. En los avisos se nombra por su día
    ("11-01" → Todos los Santos).

401. **El 24 y el 31 de diciembre, el Vaticano por la mañana** (2026-09-30). Esos dos días los Museos Vaticanos cierran a las
    15:00 (última entrada a las 13:00, calendario oficial) y la Basílica cierra antes a las visitas por las celebraciones
    del Papa. El día que lleva el Free Tour por la mañana y el Vaticano por la tarde (D3) se da la vuelta con su variante
    de fecha: los Museos y la Basílica por la mañana, y por la tarde el Panteón por dentro y el Free Tour a las 16:00
    (los tours tienen salida de tarde). Con mercadillos, el tour acaba en Piazza Navona y allí va el mercadillo.
    - General: cuando un imprescindible solo se puede ver una mañana del viaje, esa mañana es suya y lo que tenía hora
      fija se mueve a otra hora u otro día.

402. **Free Tour en festivos** (2026-09-30): los días sin tour viven en `default_free_tour.disponibilidad.sin_tour` (fecha,
    fuente y fecha de comprobación). El día que lleva el tour no cae en una fecha sin tour si el viaje lo permite; si no
    hay más remedio, el tour no se pone y el viajero ve el aviso del destino. Sin dato comprobado en la web de la empresa,
    no se quita ningún tour (regla 395: nada se da por cerrado sin fuente).
    - **Una parada escrita puede depender del mes** (`meses` / `no_meses`, 1-12), además de la hora del sol: el descanso
      largo de después de comer es cosa de junio a agosto.

403. **Hay una sola ruta. El viajero la aligera quitando paradas; las opcionales se ven como tales** (PROMPT_QUITAR_RITMOS,
    2026-09-30).
    - La ruta única es la que era «completo». Cada día empieza a su hora escrita, casi siempre entre las 8:00 y las 9:30.
    - **El motor no recibe ni mira ningún ritmo**: un solo modo (`MODE_V3` en shared/routeEngine/modes.js, `MODE_CONFIG` en
      el servidor). Ningún motor, ni el servidor, ni las pruebas tienen parámetro de ritmo. Los datos de un destino no
      llevan variantes ni textos por ritmo.
    - Un viaje guardado con ritmo se abre igual: ese dato se ignora.
    - La caché de rutas conserva su columna de ritmo con un valor fijo (columna antigua de la base de datos).
    - El formulario no tiene pantalla de ritmo (seis pasos), y ningún texto habla de ritmo.
    - Una parada `opcional` de lo escrito lleva la etiqueta «Opcional» en su tarjeta, con el estilo de las demás.
    - Las reglas que solo eran de tranquilo se han borrado (118, 138, 169, 175, 184, 234, 353, 366, 367 y 368: esos números
      quedan libres). En las reglas antiguas que aún nombran «tranquilo» o «los dos ritmos», vale solo la parte de completo.

404. **Fin de Año** (PROMPT_ROMA_FIN_DE_ANO, 2026-09-30).
    - **Un día puede no empezar antes de una hora por una fecha especial** (`fechas_especiales.fechas[].empieza_desde:
      { hora, si_viaje_incluye, comida_como_tarde }`): el 1 de enero, solo si el 31 de diciembre está en el viaje, desde
      las 10:00. Toda la mañana se corre lo mismo que la primera hora, menos lo que tiene turno. Si así se llega tarde a
      una hora fija o la comida empieza después de `comida_como_tarde` (14:30), se quitan las opcionales de la mañana, de la
      última hacia atrás. Si ni así cabe, **no se fuerza**: el día se queda a su hora escrita, queda apuntado en sus
      variantes (`empieza:no_cabe`) y la prueba de Navidad lo cuenta.
    - **El nombre del día no promete la primera hora si ya no lo es**: con el día corrido, vale `nombre_empieza_tarde` del
      día escrito («Trevi, el Pincio y la tarde en Monti», sin «sin gente»).
    - **Una fecha especial puede llevar una frase aparte** (`sugerencia_texto`): algo que el viajero puede hacer ese día por
      su cuenta. No entra en la ruta ni quita nada, y se escribe con prudencia («suele…», «compruébalo en…»). El concierto
      del Circo Máximo el 31 y la misa y el Ángelus del 1 de enero.
    - **Ningún texto promete fuegos artificiales sin fuente oficial de ese año.**
    - La prueba de Navidad cuenta, en el 31 y el 1: un bus después de las 21:00 del 31, un 1 de enero antes de las 10:00
      tras la Nochevieja, una visita por dentro que empieza después de la última entrada y un texto que promete fuegos.

406. **Un destino no se da por cerrado hasta que sus fechas clave de viajeros españoles están curadas y probadas**
    (PROMPT_FECHAS_CLAVE, 2026-10-01; el método, en docs/METODO_DESTINOS.md).
    - Las fechas clave son los festivos y puentes de España: Semana Santa, el puente de mayo, el verano (el 15 de agosto y
      un fin de semana de julio), el Pilar, Todos los Santos, el puente de diciembre y Navidad y Reyes.
    - **Se calculan con el calendario real de cada año**, nunca a mano (`scripts/destino/fechasClave.mjs`).
    - Cada una lleva su viaje típico revisado a mano, con y sin Free Tour (`revisionFechasClave.mjs`), y la prueba de las
      365 fechas da sus números **solo en las fechas clave**: el objetivo es 0 avisos de verdad en ellas. Los
      informativos (algo cierra ese día y el aviso lo explica) se aceptan.
    - **Una parada puede ir solo con una experiencia** (`si_experiencia`), para lo que una experiencia añade en otro sitio
      según la variante del día: con Arte, los Museos Capitolinos van por la mañana los sábados y el 1 de enero, junto al
      Campidoglio (por la tarde el Panteón va primero y habría que volver atrás). Lo que la mañana ya lleva no se inserta
      otra vez por la tarde.
    - **El descanso de después de comer no cierra ninguna puerta**: si por empezar la tarde más tarde algo pasa a verse por
      fuera, no hay descanso.
    - **Una hora escrita sin turno es orientativa**: llegar hasta 10 min después no es llegar tarde.

407. **El Free Tour, a las horas a las que sale ese día** (2026-10-01; dato del calendario de reserva, con `verificar`).
    - `default_free_tour.disponibilidad.horas_especiales`: fechas en las que el tour solo sale a ciertas horas (en Roma, el
      24, 25 y 31 de diciembre y el 1 y 6 de enero, solo a las 12:00). El día escrito que lleva el tour trae su variante
      de esa fecha, con la ruta recolocada alrededor, y la prueba cuenta cualquier tour a otra hora.
    - El día del tour evita esas fechas si el viaje tiene otro día para él (`no_en` con `fecha` y `evitar`).
    - **En un viaje de un día**, un tour que solo sale a mediodía parte la ruta en dos: el día va sin tour y lo dice.

413. **Roma como un local** (PROMPT_REPASO_LOCAL_ROMA, 2026-10-01).
    - **Un paseo nocturno todas las noches** mientras queden sitios que valgan la pena, aunque haya que cruzar la ciudad
      (un día sin paseo escrito toma el mejor que quede). Si el viajero no quiere, no va. Es por destino: uno con pocas
      nocturnas tendrá menos.
    - ~~Nada de noche y otra vez a la mañana siguiente~~: **quitada** (regla 416). El día del Free Tour, nada suelto de lo
      que el tour recorre (Trevi a las 8:30).
    - **Un barrio, una vez al día**: se sube al Janículo por el Tempietto (por dentro mientras está abierto, cierra a las
      18:00), la Acqua Paola y el mirador, y se baja a Trastevere una sola vez para el barrio, el aperitivo y la cena.
      Con el sol después de las 19:45 (de mayo a agosto), el Janículo va con la luz de la tarde y el atardecer, en un
      puente (el Ponte Sisto, el Puente Sant'Angelo). Monti, igual: al final, para el aperitivo y la cena.
    - **Verano (julio y agosto)**: de 14:00 a 16:30, solo descanso o sitios a cubierto (el motor espera a las 16:30 antes
      de lo que va al aire libre, y el rato sale como «Descanso a la sombra»). El Foro, más corto, y el Altar de la Patria,
      a última hora.
    - **Sábado**: sin comer en el Ghetto ni el texto de las alcachofas (es su día de descanso). **Domingo**: Santa Maria
      del Popolo solo abre por la tarde.
    - **Nochebuena y Nochevieja**: un paseo corto cerca de la cena, sin «terrazas hasta tarde», y cómo volver dicho claro;
      el 25, que después de cenar se vuelve andando o en taxi. Ninguna excursión de día completo el 24, el 25, el 31 ni el
      1 (`excursion_fechas_no`).
    - Semana Santa: la Basílica de San Pedro cierra a las visitas el Jueves Santo por la mañana y el Viernes Santo por la
      tarde (horario especial prudente, `verificar`), con 45-60 min de cola en el control. El cambio de hora dentro del
      viaje se dice con sus dos horas de atardecer.
    - Prueba: `auditoria.mjs` lleva `tour_repite` y `barrio_dos_veces` (de día).

414. **La llegada y la vuelta, verdad en cada punto** (PARA_CODE_LLEGADAS, 2026-10-01).
    - **Ningún tip dice «ahora mismo» sin fecha de fin**: lo que dura unas semanas (los controles de frontera) lleva
      `hasta` y su fuente, y deja de salir solo pasada esa fecha (la del viaje o, sin ella, la de hoy). Lo que es verdad
      siempre va aparte («la aerolínea te pide el DNI para embarcar»).
    - **Cada punto de llegada, lo suyo**: el resumen del punto (`por_que_llegada` / `por_que_vuelta`) si el del medio no
      vale allí; los tips de un sitio (`solo_en`) solo en ese sitio; la consigna, la estación y «Tu última hora» de
      Termini, solo si se pasa por Termini (`termini: false` en Tiburtina y en el crucero). Del centro a un punto, su
      camino de ida (`a_la_salida`), nunca el de llegada al revés. Sin dato propio, no sale.
    - Un precio sin comprobar en la web oficial no sale; con su fuente y su fecha, sí. Un traslado sin enlace de afiliado
      no sale a la venta.

415. **Cada viaje empieza con su tarjeta de temporada. Solo dice lo que la ruta hace de verdad** (PROMPT_TARJETA_TEMPORADA,
    2026-10-01).
    - Al abrir la ruta por primera vez: la tarjeta (`SeasonCard.tsx`); con su «Entendido», los avisos de fechas, uno por
      tema; después, la ruta. Lo que ya se vio no vuelve a salir. Sustituye a la nota de temporada de arriba de la ruta.
    - La estación: con fechas, la del primer día (primavera 20-3 a 20-6, verano 21-6 a 22-9, otoño 23-9 a 20-12,
      invierno 21-12 a 19-3); si ese día cae en la `temporada_navidad` del destino, Navidad. Sin fechas, la del
      formulario. Los cortes de `by_period` son de horarios, no de la tarjeta.
    - Los textos valen para cualquier destino (`{destino}`, `{hora}`: el atardecer real) y cada trozo condicionado sale
      solo si se cumple: los miradores al atardecer, con un atardecer en la ruta; lo importante a primera hora, con la
      mayoría de los días así; el descanso después de comer, con días de julio o agosto; la ciudad iluminada, con paseo
      nocturno.
    - Con «reducir movimiento», no cae nada.

416. **Ver de noche lo que viste de día no es repetir; el día del Vaticano, con su Castillo y su Puente**
    (PARA_CODE_TARDE_VATICANO, 2026-10-01).
    - Fuera la regla de «no repetir de noche»: una nocturna puede volver a un sitio visto esa tarde o a la mañana
      siguiente (el Puente Sant'Angelo al atardecer y otra vez de noche). Solo no se repite la misma nocturna en el viaje.
      Las nocturnas nunca llevan «Revisita». Un atardecer escrito nunca lo sustituye la nocturna.
    - El día del Vaticano lleva siempre el Castillo de Sant'Angelo (por dentro o por fuera) y el Puente Sant'Angelo de día:
      al salir de la Basílica, Via della Conciliazione, el Castillo por fuera y el Puente al atardecer, y la cena cerca.
      Si el Castillo cierra, por fuera. Excepción: el 24 y el 31 en los viajes de 2 días con Free Tour (se perdía el Foro
      por dentro). La prueba lo comprueba (`vaticano_sin_castillo`, `vaticano_sin_puente`).
    - Sin huecos antes de cenar: con más de 45 min libres después de lo último y un sitio del destino a un paseo (nivel 1
      o 2, que el viaje no ve, abierto a esa hora, de la misma zona, sin volver junto a lo ya visto y ningún museo de
      noche), va ese sitio (`relleno_cena`). La prueba: `hueco_cena`.
    - Si la cena dice «desde el aperitivo», la tarjeta del aperitivo sale siempre.

418. **Reservas manda en la llegada y la vuelta; cada aeropuerto, estación o puerto lleva sus textos**
    (PARA_CODE_TODO_2026-10-01, paso 2).
    - La vuelta es en el mismo medio que la llegada: no hay otra pregunta. Las horas y el sitio de cada trayecto salen
      de Reservas (la hora y, con más de un sitio, el aeropuerto o la estación de cada uno: Fiumicino a la ida y
      Ciampino a la vuelta). Quitar o cambiar la hora o el sitio vuelve a cambiar solas las barras, las ventanas y el
      último día.
    - Cada punto lleva lo suyo en `_llegada.json`: sus caminos de ida y de vuelta con fuente y fecha, su resumen si el
      del medio no vale, sus tips (`solo_en`: el Leonardo es de Fiumicino, no de Ciampino) y, si no sale igual, su
      `salir_antes_min` (Ciampino 170, no 180). «Tu última tarde» y la hora de salir usan los de ese punto, nunca los
      del principal.
    - Un tip con `solo_en` sale cuando ese punto está a la vista.
    - Al curar un destino: cada sitio de llegada y de salida lleva sus propios textos, comprobados en la web oficial.

419. **El rato libre antes de cenar es «Pasea y piérdete por {zona}». No existe el «Tiempo libre»** (PARA_CODE_TODO_2026-10-01,
    paso 5, puntos 1 y 7).
    - El tiempo que sobra antes de cenar sale como «Pasea y piérdete por {zona}» (etiqueta «Paseo libre», el muñequito
      andando, la foto de día de su zona; en Navidad, «…entre las luces de…»), con el consejo del aperitivo dentro de la
      ficha (Tips). 20 min como mínimo y 90 como mucho. La cena dice «X min andando desde…» el sitio real de justo antes,
      nunca «desde el aperitivo».
    - Nunca va en el mismo sitio que la parada de antes (su nombre dentro del del paseo, o a menos de 250 m del centro de
      la zona): si coincide, esa parada se alarga (con el consejo) y no hay tarjeta aparte. Una nocturna no se alarga. El
      barrio que el día ya vio antes con otra cosa en medio no vuelve como paseo. Un paseo no se coge a más de 15 min
      andando de lo último.
    - No existe el «Tiempo libre»: el tiempo que sobra a mitad de día va, en este orden, a un sitio de camino como parada,
      al paseo de la zona a la que se llega («Pasea y piérdete por…», a cualquier hora) o a recolocar las horas (la
      parada de antes se alarga hasta su máximo, su cierre y nunca un «por fuera»). Menos de 20 min no sale nada. Nunca
      un texto con «Una idea…». Lo que no cabe de cena se adelanta (no antes de las 19:30, ni de las 20:30 en verano).
    - Lo que sí queda: los ratos con nombre y contenido propio (el descanso de después de comer o a la sombra en verano, el
      paseo de antes del mirador).
    - En lo que hace el viajero (días libres, ruta manual, «Añadir parada», «+ Añadir día») el motor no rellena ni
      recoloca nada: solo calcula el tiempo entre paradas y el transporte recomendado.
    - La prueba: `tiempo_libre_sigue` y `paseo_misma_zona` salen en 0; `scripts/destino/contarLibres.mjs` cuenta los
      ratos libres de las 365 fechas.

421. **Junto a un imprescindible, aunque esté cerrado, se ve por fuera** (PARA_CODE_TODO_2026-10-01, paso 5, punto 4).
    - Un lugar con su exterior curado (`minutos_fuera`) que a su hora está cerrado y tiene un imprescindible (nivel 1) a 5
      min andando o menos, justo antes o justo después, sale «Por fuera» con su tiempo de por fuera, sin el aviso rojo y
      con la línea «Por dentro abre de {hora} a {hora}». Lo escrito «por fuera» (`modo: fuera`, `si_cerrado: fuera`) es una
      decisión del día y tampoco lleva el aviso. La parada no cambia de sitio en la ruta.
    - Sin `minutos_fuera`, o con el interior como único motivo (San Luigi, la Vittoria), no va por fuera: se coloca a una
      hora en que esté abierto (en la misma tarde, sin hora fija ni atardecer, sin zigzag ni perder el mirador) o, si es
      de nivel 3 y no hay sitio, queda en «Quedó fuera». Se espera hasta 40 min a que abra (20 si lo escrito dice «si
      cerrado, por fuera»).
    - La prueba: `cerrada_a_su_hora` en 0.

422. **La Galería Borghese nunca va sola: siempre con el Parque de Villa Borghese** (PARA_CODE_TODO_2026-10-01, paso 5,
    punto 5). D4: Trevi, Plaza de España, Trinità (por fuera si cierra), el parque entrando por la Porta Pinciana y la
    Galería a las 11:00; por la tarde, el lago y el Templo de Esculapio (la parada que se estira), los Jardines del Pincio
    y el resto en el orden de cada versión de la luz. Nunca se cruza por la calle lo que se cruza por el parque.

444. **La misa del Panteón en festivos y vísperas** (2-oct-2026). La web oficial: misa a las 17:00 los sábados y las vísperas de festivo (venta cortada a las 16:00) y a las 10:30 los domingos
    y los festivos (venta cortada a las 09:30). El lugar lo pide con `misas_festivos` (los festivos nacionales de Italia: 1 y 6 ene, Lunes de Pascua, 25 abr, 1 may, 2 jun, 15 ago, 1 nov, 8,
    25 y 26 dic) y `massWeekday` (`openingHours.js`) lee el festivo como un domingo y su víspera como un sábado; el servidor lo manda a la ventana de «+ Añadir» (`hours_data`). Pendiente
    de decidir: el 29 de junio (festivo solo en Roma).

445. **El Castillo de Sant'Angelo va solo por fuera, 20 min, todos los días** (decisión del usuario, 2-oct-2026). Sin «Entra si quieres»: si alguien quiere entrar, cambia la hora y la
    duración a mano. Su cierre de los lunes ya no bloquea el día de los Vaticanos. En lo escrito, `una_vez: true` hace que una parada que el viaje ya vio (por dentro o por fuera) no salga
    otro día, y `si_visto` mira todo lo visto (no solo lo visto por dentro). La auditoría pide el Castillo en el día del Vaticano solo si ningún otro día del viaje lo lleva.

446. **Una calle solo es parada si es un sitio en sí misma** (2-oct-2026). Via Margutta, Via del Babuino y Via del Corso (D7) ya no son parada: su rato va al paseo de la zona
    («Pasea y piérdete por el Tridente») y sus textos van en «Por el camino», dentro de la ficha (`por_el_camino` del lugar o de la zona; `Stop.porElCamino`). Via Condotti sigue como parada
    corta de camino; Conciliazione, Via dei Fori Imperiali, Via Appia y las luces de Navidad del Tridente se quedan. Venchi: solo la tienda de Via del Corso (cerca de Trevi, en la web
    oficial de Venchi), como recomendación de camino en la ficha de Trevi o del paseo del Tridente, **una sola vez por viaje** (`una_vez`) y nunca como parada.

447. **Un paseo con `una_vez_por_viaje` no se repite** (el del Tridente): si un día anterior del viaje ya cena en esa zona, el rato va a la parada que se estira. `minutos_max` por zona
    sobre el máximo general (el Tridente, 120).

448. **Borgo Pio pasa a paseo**: «Pasea y piérdete por Borgo Pio» (título de la parada, como los demás paseos escritos).

449. **Viajes de 1 día: todo por fuera, salvo lo marcado en el pool** (3-oct-2026, todos los destinos con `short_trips`; en Roma `short_trips.todo_por_fuera`). En un día no da tiempo a
    entrar: todo lo que tiene entrada va por fuera (con su `pass_by` o `minutos_fuera`; el Foro desde la Via dei Fori Imperiali). Solo va por dentro lo que el viajero marcó en el pool
    (los Museos Vaticanos, el Coliseo…). Lo gratis sigue como estaba. Con fechas, si ese sitio cierra ese día sale el aviso y se cambia de bloque o se ve por fuera (el cierre manda); sin
    fechas no se puede saber y se muestra igualmente. Con Free Tour, el tour enseña por fuera lo suyo y no se añade el Panteón por dentro. Una reserva que añada el viajero adapta la ruta
    solo a esa reserva (en el cliente, `medirReservas`/`fitDayToTrip`): lo demás sigue por fuera. El texto de la parada dice «En un viaje de un día no da tiempo a entrar».

450. **Viajes de 2 días (Roma): por dentro solo lo que dice `_destino.json › viajes_cortos.dos_dias`** (3-oct-2026). Sin nada marcado en el pool: el Coliseo (con el Foro y el Palatino) y el
    Panteón por dentro, todo lo demás con entrada por fuera. Con algo marcado (`marcables`): lo marcado y sus acompañantes (Coliseo → Foro y Palatino; Museos Vaticanos solo ellos), y el
    Panteón (`siempre_dentro`) en todos los casos. Si se marcan los dos: un día cada uno, y el centro (Trevi, Plaza de España…) por fuera. Un cierre siempre va por fuera. Lo que pasa a
    fuera pierde su hora de entrada y su turno, y su razón es «En un viaje corto lo ves por fuera: no da tiempo a entrar» (`outsideKind: 'no_cabe'`: deja pedir «Quiero entrar»).
    Una parada vista por fuera no cuenta como entrada en RESERVAS (`stopHasEntrance`).

451. **Viajes de 2,5 días**: hoy el motor no conoce el medio día (los vuelos se recortan en el cliente con `fitDayToTrip`), así que un viaje de 3 días sale como 3 días enteros. La regla
    (medio día = regla de 1 día; días enteros = viaje de esos días; la entrada solo en los días enteros) queda escrita y pendiente de implementar cuando el motor reciba los vuelos.

452. **Lo que no se ve desde la calle no existe «por fuera»** (3-oct-2026, todos los destinos). Un lugar sin `minutos_fuera`, sin `pass_by` y que no es exterior (los Museos Vaticanos: por fuera son un
    muro; la Cúpula de San Pedro) **no sale «por fuera»**: si no se entra, la parada desaparece y la visita de la zona son sus otros lugares (la Plaza y la Basílica de San Pedro, gratis). Vale en
    los viajes de 1 y 2 días y en los avisos: el día dice «En un viaje corto no entra, y por fuera no hay nada que ver», con «Márcalo en tu selección si quieres entrar». Un cierre ya lo trataba
    así (`closedAnchorNotice`). La mañana del Vaticano, sin el museo de las 08:00, empieza a las 09:30 y la Basílica se queda 90 min.

453. **Viaje de 1 día de Roma: Roma Antigua y Centro por la mañana, Vaticano por fuera por la tarde, Tridente de noche** (3-oct-2026, aprobado por el usuario). Mañana: Coliseo, Arco, Foro desde
    Via dei Fori Imperiali, Plaza del Campidoglio, Altar de la Patria, Panteón, Santa Maria sopra Minerva, Piazza Navona y San Luigi dei Francesi (las iglesias gratis, por dentro). Tarde (desde las 14:30): Plaza y
    Basílica de San Pedro (gratis), Via della Conciliazione, Puente Sant'Angelo (al atardecer si cuadra) y Castillo por fuera. Cena en el Tridente y, **después de cenar**, Plaza de España y Fontana de
    Trevi iluminadas (`blocks.V.dinner_zone`, `night_names`, `night_whole_walk`). Con Free Tour se queda el reparto de antes (Roma Antigua + Centro); con los Museos Vaticanos en el pool, el de antes (Vaticano + Centro).

454. **Horas de 10 en 10, a la más cercana** (3-oct-2026, `quarterHourStops`, `DISPLAY_STEP = 10`). La hora que se enseña de cada parada es la decena más cercana (11:32 → 11:30, 11:38 → 11:40); las duraciones, de 5 en 5.
    Nunca se recorta una visita más de 5 min: si al redondear la de antes se queda corta, esta hora sube a la decena siguiente, y nunca antes de que acabe la anterior con su paseo (ni de su mínimo). Las horas fijas (entrada con hora,
    Free Tour, atardecer) y las paradas pegadas (a menos de 200 m) no se redondean a 10: van de 5 en 5, como siempre. Nunca antes de que abra el sitio. La comida, de 10 en 10; la cena (hora fija), de 5 en 5.
    El motor sigue calculando con los minutos exactos.

455. **29 de junio, festivo con horario de domingo** (San Pedro y San Pablo, patronos de Roma). `festivos_domingo: ["06-29"]` en cada lugar con horario de domingo (`by_day`) y `06-29` en `misas_festivos` del Panteón; ese día
    (sin la víspera) se lee el horario como domingo (`massWeekday`). Villa Farnesina y el Mercado de Testaccio cierran (`closed_dates`). Los Museos Vaticanos ya cerraban.

456. **`por_fuera` solo donde se ve algo desde la calle, `si_cerrado: "quitar"` donde vale por dentro** (3-oct-2026). Textos `por_fuera` de la Basílica y la Cúpula de San Pedro, Santa Cecilia, San Ignacio y Santa Maria sopra Minerva.
    San Clemente, las Catacumbas, la Domus Aurea, los Museos Capitolinos y el Palazzo Doria Pamphilj no tienen `por_fuera`: si están cerrados, `quitar` (su tiempo va al paseo de la zona o a la parada que se estira).

457. **El viajero manda** (3-oct-2026, todos los destinos). Si su reserva coincide con el atardecer, la nocturna o cualquier otra cosa del día, ese día va sin ello, sin forzarlo y sin aviso. La ruta se adapta a sus horas, no al revés.
    En las pruebas, un atardecer que no cabe por la hora de una reserva no cuenta como fallo. (Motor: con una entrada reservada, un mirador de atardecer al que se llega después de la puesta se quita, en vez de pasar a «vista nocturna».)

458. **Entrada reservada: órdenes nuevos por franja** (3-oct-2026, D1 Coliseo, D2 Vaticano, D4 Galería). El día trae su orden de siempre y uno o dos órdenes nuevos según la hora de la entrada: `entradas` en el día (`{ lugar: { franja: [desde, hasta] } }`;
    la primera franja es la de siempre) y una variante `entrada:<franja>` por cada franja nueva, con `entrada:<franja>@<día de la semana>` para lo que cambia ese día con ese orden (si no existe, vale el del día de siempre).
    El motor las usa cuando recibe `entradas: { lugar: "HH:MM" }` (hoy, solo las pruebas: `scripts/destino/medirEntradas.mjs`). La parada de ese lugar sale a la hora reservada (la que trae la variante es solo un ejemplo), se llega 30 min antes
    (`llegar_antes`) y la visita se recorta hasta el cierre si hace falta (`recorta_al_cierre`, nunca menos de 60 min). `si_entrada_desde: "15:30"`: la parada solo va si la reserva es a esa hora o después. Una parada elástica de antes de una hora
    fija (Borgo Pio antes de los Museos) absorbe lo que falta hasta llegar a ella, hasta su máximo.

459. **Tiempo libre de mitad de día: nunca pasada la hora de cierre** (3-oct-2026, `freeTime.js`). El sitio de camino que rellena un hueco se recorta hasta el cierre de ese día y no se retrasa más allá de él (la Santa Maria sopra Minerva los sábados,
    que cierra a las 19:00, salía a las 19:05).

460. **La comida se adapta a la entrada reservada** (3-oct-2026, todos los destinos). Con una reserva, la comida sustituye a la ventana fija y al mínimo de 45 min: algo rápido desde las 12:00 (una pizza al corte, unos 30 min) o una comida tranquila a las 14:30 o 15:00,
    según la hora elegida (`LUNCH_EARLIEST_RESERVED`, `LUNCH_MIN_RESERVED`; `reserva:<hora>` en el día). Sin reserva, todo como antes (12:30, 45 min).

461. **Margen antes de una entrada reservada**: el tiempo de más antes de ella (hasta 60 min) no cuenta como hueco (imprevistos y llegar con calma; Trevi a las 8:00 y la Galería a las 10:00). La parada lleva `reserved_entry`; la auditoría usa
    `HUECO_MARGEN_RESERVA = 60`. No hay que tener miedo a madrugar.

462. **Nocturna el mismo día** (cambia la regla de «nunca de día y de noche el mismo día»): si la visita de día de un sitio fue **por la mañana** (antes de las 13:00), su nocturna puede ir ese mismo día (Trevi a las 8:00 y Trevi iluminada a las 22:00 son dos
    experiencias distintas); si fue **por la tarde**, la nocturna va en otro día (`visitedThisAfternoon`, `AFTERNOON_FROM`). Solo no se repite la misma nocturna en el viaje.

463. **Museos Vaticanos: el último turno online es siempre a las 16:00** (comprobado por el usuario en varias fechas). El orden 4 de D2 va de 14:30 a 16:00; sin entradas de las 17:00 ni de las 18:00 en la prueba.

464. **D1, D2 y D4, decisiones del 3-oct-2026**: D2 con entrada a las 13:00 o 13:30, comida rápida en Pizzarium (Bonci) desde las 12:00; D2 miércoles con el orden 2, mañana desde las 9:00 (Puente, Castillo por fuera, Borgo Pio elástica); Ponte Sisto (10 min) y Plaza
    Trilussa (5) `una_vez`, y si se saltan, del Castillo a Santa Maria in Trastevere en el bus 23 (`traslado_si_se_salta`); el Castillo va siempre por fuera a propósito (no cuenta como «imprescindible de pago nunca por dentro»); D4 con entrada a las 9:00 (la Galería lo
    primero, Trevi, Plaza de España y Trinità por la tarde), a las 10:00 (Trevi a las 8:00 y a la Galería), a las 15:00 (solo comida y Parque antes; Jardines y Terraza del Pincio después, al atardecer); D4 C y D: el paseo de la tarde sale de Piazza del Popolo por Via del Babuino y
    Via Margutta (no vuelve a Via Condotti ni a la Plaza de España); D1 orden 2: la mañana empieza por el Foro a las 9:00, y **Piazza Navona no se cae**: si no cabe por la tarde, va de noche (`noche_si_cae`, paseo `navona_y_fuentes`).

465. **Free Tour añadido después, en viajes de 3 días o más** (3-oct-2026). El tour sustituye la parte del día que enseña lo mismo (no se suma a un día lleno): **de mañana (10:00)** la mañana del centro (D4 y D4M; Trevi a las 8:00 antes del tour y la Galería con su orden de tarde, `usa_entrada`);
    **de tarde (17:00)** la tarde del centro barroco de D1 (Navona, San Luigi, Campo de' Fiori…), con el Panteón por dentro justo antes (el tour no entra); **de noche** la nocturna de ese día (`sin_paseo`), con el centro de día y la cena después. Lo que el tour enseña no se repite ese día.
    Variantes `free_tour_despues:<franja>` en los días escritos; el motor las usa con `freeTourDespues: { franja, hora }` (hoy, solo la prueba `medirFtDespues.mjs`). El tour de noche existe (Civitatis, 2 h, desde Santa Maria del Popolo hasta Navona, «antes de que se ponga el sol») pero la ficha no da
    hora: la prueba supone 20 min antes de la puesta. Si de verdad no cabe, como una reserva más: aviso en la campana y ese tramo pasa a manos del viajero (cuando llegue el encargo del motor).

466. **Una hora fija nunca se mueve ni se quita** (3-oct-2026, todos los destinos). Vale para las entradas reservadas y para el Free Tour. Si no cabe todo, se recorta lo que va antes, en este orden: primero salen las opcionales; luego se encoge la elástica
    (y lo que se puede acortar, hasta su mínimo); luego se acorta la comida, hasta los 30 min de la comida flexible (INVARIANTES 460). Si aun así no cabe, se quita lo menor de lo que va antes (nivel 3, 2 y 1; el más cercano a la hora fija primero) y sale
    en «Quedó fuera», la campana. La hora fija sigue donde estaba. La sombra de verano (nada al sol antes de las 16:30) también cede ante una hora fija de después. (Motor: `runList` → `dropCandidate`; en la comida, el bucle de `lateBy`.)

467. **Un mismo sitio, una vez al día** (3-oct-2026, todos los destinos). La única excepción es la nocturna: un sitio visto de día puede volver iluminado esa noche (Trevi a las 8:00 y Trevi iluminada a las 22:00). Un atardecer no es una nocturna: un mirador visto de día
    no vuelve al atardecer el mismo día. Si un sitio sirve para el atardecer, va al atardecer; si el atardecer no cuadra (la hora de una reserva, el sol), va de día, y solo una vez. (Motor: antes de montar la tarde se prueba el día sin la visita de día; si el
    atardecer llega con sol, queda el atardecer y, si no, la visita de día. Un paseo de zona («Pasea y piérdete por…») tampoco sale dos veces el mismo día. La única salvedad que queda es el mismo lugar con dos nombres escritos distintos y ambos con título, el
    parque de Villa Borghese en D4: de camino a la Galería y el lago.) Si una fecha especial trae el mismo lugar reservado en la mañana y en la tarde, queda el de la parte del día de la hora reservada.

468. **D4 en verano con la entrada a la Galería de 15:00 a 17:45** (3-oct-2026). La regla de «nada al sol antes de las 16:30» (INVARIANTES 413) es para el parque, no para la Galería, que es por dentro. En julio y agosto, con esa entrada, el orden es: comida,
    la Galería en las horas de calor, el Parque de Villa Borghese (con elástica) cuando baja el sol y, al final, los Jardines y la Terraza del Pincio al atardecer (variantes `entrada:quince@verano` y `entrada:tarde@verano`; el motor las aplica después de
    `entrada:<franja>` cuando el mes es 7 u 8). La Terraza del Pincio sale una sola vez (INVARIANTES 467): al atardecer si cuadra con la reserva y, si no, de día.

469. **La comida con una hora fija detrás** (3-oct-2026, todos los destinos; amplía 460). Si lo primero que no es opcional de la tarde es una hora fija (una entrada reservada, San Clemente a las 14:00, el Free Tour), la comida dura 60 min si cabe y se acorta
    hasta lo que deje esa hora (30 min como mínimo con reserva); no acaba donde empieza «la tarde escrita». A una entrada reservada se llega siempre 30 min antes (la tarjeta dice «Llega 30 min antes»), sin tolerancia: si no caben, se recorta lo de antes (opcionales, elástica, comida) y, si aun así no cabe, aviso en la campana («Llegarás N min más tarde de lo recomendado»). Si lo escrito del día trae un restaurante
    junto a la entrada (la pizza al corte de Bonci a 2 min de los Museos), gana al más cercano a la parada de antes aunque haya que andar algo más. El descanso de después de comer (`restAfterLunch`) nunca mueve una hora fija. Un opcional que está delante
    de un lugar que, por su culpa, se pasaría de la hora de cierre (la Cúpula antes de la Basílica el 24 de diciembre) se quita primero. Un imprescindible de entrada libre que se pasaría del cierre (la Basílica) se recorta hasta el cierre, no menos de 30 min.

471. **D1, Coliseo desde las 15:30**: «Pasea y piérdete por Monti» (`Monti`, 30 min, elástica 90, opcional, `una_vez`) delante del Coliseo en `entrada:tarde`: llena el rato que queda hasta la hora de la entrada, y si no queda, no sale (ni avisa). Con la comida más larga (469)
    los huecos de más de 30 min de ese orden pasan de 201 a 31.

472. **El Castillo de Sant'Angelo, siempre por fuera; el Tempietto, quitado si cierra** (3-oct-2026). Lo escrito `modo: "fuera"` lleva `outside_authored` en la parada: no es «por fuera para llegar a todo» y la prueba no lo cuenta. El Tempietto de Bramante, si cierra, `si_cerrado: "quitar"`
    (nunca «por fuera» forzado). La Basílica de San Pedro no sale por fuera el día de los Vaticanos salvo que esté cerrada (`basilica_fuera` en la prueba). D2, miércoles con la entrada de 13:00 a 14:00: la mañana desde las 9:00 (Puente, Castillo por fuera, Borgo Pio), comida
    rápida en Pizzarium, los Museos y, después de ellos, la Plaza y la Basílica. Los Museos Vaticanos cierran los domingos (el último de cada mes, gratis de 9:00 a 14:00, última entrada a las 12:30, sin reserva: cola): no hay entradas reservadas en domingo.

473. **El Free Tour añadido después se clasifica por su hora** (3-oct-2026, amplía 465): antes de las 13:00, de mañana; de las 13:00 a las 18:59, de tarde; a partir de las 19:00, de noche. El tour de «noche» de invierno (sale hacia las 16:30) cuenta como de tarde. La hora del tour no se mueve
    nunca (466). Va en el primer día, por orden, cuyo día escrito trae esa franja y acaba llevando el tour; si lo que cambia ese día (un domingo, una fecha) reescribe las paradas y se lo lleva, el tour vuelve a ponerse. Si lo de antes no cabe, se quita lo menor y sale en la campana;
    la sombra de verano no mueve el tour. Un atardecer se quita el último y sin aviso. (Motor: `freeTourDespues: { hora }`; `free_tour_info` en el día dice dónde quedó y, si no quedó, por qué.)

474. **Avisos de la campana que no son «Quedó fuera»** (3-oct-2026): `dayNotices` en el plan y `is_notice` en `not_included`. Llegar tarde a una entrada reservada, y la Basílica de San Pedro por fuera un día de Vaticanos: «Hoy la Basílica cierra a las {hora}; si quieres entrar, ve otro día del viaje.»
    (con la hora de cierre de ese día sacada del dato; el 24 y el 31 de diciembre de D3 con Free Tour, que están escritos así a propósito: el viajero manda).

475. **Una hora escrita que choca con la reserva pasa a después de ella** (3-oct-2026): la Basílica de San Pedro a las 12:00 el Jueves Santo (abre entonces) va después de los Museos si la entrada la pisa (`despues_de_la_reserva`); la Plaza de San Pedro, al aire libre, sale siempre.
    La comida tranquila (460): con una entrada reservada de la tarde, la comida se retrasa hasta como mucho las 15:00 (17:00 → 14:30; 17:45 → 15:00) y lo que sobra antes de la entrada es margen (hasta 60 min no es hueco).

476. **Lo escrito «por fuera» a propósito** (3-oct-2026): `outsideKind: 'a_proposito'`. En la ficha sale su texto de `por_fuera` y no sale «Hoy lo ves por fuera para llegar a todo lo del día» ni el botón «Quiero entrar» (que es solo de `no_cabe`). En viajes de 1 y 2 días se queda como antes
    (el viajero puede marcarlo en el pool). La Passeggiata del Gianicolo de los lunes puede durar hasta 70 min en la prueba. Último domingo de mes de los Museos Vaticanos: el día va sin ellos y la ficha lo explica en Entradas (gratis de 9:00 a 12:30, sin reserva, con cola; no vale en Pascua, 29 de junio, 25, 26 y 31 de diciembre).

