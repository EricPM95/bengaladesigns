# Invariantes del motor de rutas

Lo que el motor nuevo (Prompt 9, Entrega B) tiene que seguir cumpliendo aunque se reescriba desde
cero. **No son preferencias de estilo: cada línea de esta lista se escribió después de ver el fallo
en pantalla.** Reescribir sin portarlas es volver a comprarlas de una en una.

Formato: **qué** debe cumplirse · *por qué* (el fallo real que lo motivó) · dónde vive hoy.

---

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

7. **Jerarquía de colocación**: `pool del viajero > reparto curado > zone_priority`. El pool va lo
   antes posible en el viaje y el curado no lo bloquea; el curado manda donde el pool no interviene;
   `zone_priority` cubre lo que no tiene curado (días 6-7, destinos nuevos).

8. **El pool va sí o sí, y para eso tiene que saber DESALOJAR**, no solo reubicar en huecos vacíos.
   *Hoy solo sabe reubicar, y por eso en un viaje de 2 días la Galería Borghese se descarta con un
   log de "ningún día tiene hueco ni haciéndole sitio".*

9. **Los `level` mandan el orden de relleno**: 12 lugares de nivel 1, 28 de nivel 2, 27 de nivel 3.
   Nivel 1 es "si vienes a Roma y no lo ves, la ruta ha fallado".

10. **`NEVER_MISS_LANDMARKS`**: la red que impide que un imprescindible desaparezca por un ajuste de
    ritmo. *Se perdió el Coliseo en una ruta real.*

11. **El nivel 1 entra SIEMPRE, elija el viajero lo que elija.** "Imprescindibles" como tarjeta es
    una promesa de la pantalla ("te hemos preparado lo esencial"), no un interruptor: apagarlo desde
    el cuestionario dejaría sin Coliseo a un primerizo que solo quiso marcar tres temas. Quien repite
    destino quita el Coliseo desde el menú de la parada, que ya funciona.
    *Sustituye a la versión anterior de este invariante, en la que la tarjeta sí apagaba el nivel 1.*

12. **Las experiencias elegidas sesgan el RELLENO, y el sesgo tiene que notarse.**
    *Medido: elegir "Arte y museos" en un viaje de 3 días no mete ni un museo — solo cambia dos
    lugares de relleno, porque `interestTags` únicamente ordena sobrantes y el núcleo viene fijo del
    reparto curado.* Es el bug estructural que justifica esta reescritura.

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
    - `contained_in` (lo de dentro → su contenedor: una fuente en su plaza, un monumento en su
      barrio, la cúpula en su basílica). Si el contenedor está en el viaje, lo de dentro solo sale
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

25. **Ventana de cena por modo** *(sustituido por el 36: 20:00-21:00 en los dos ritmos)*: completo 20:00-21:00, tranquilo 19:30-20:30. *En tranquilo el día
    acaba sobre las 19:00 y la ventana de completo dejaba una hora muerta justo antes de cenar.*

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

29. **La tarde, sin zigzag** (decisión del 2026-09-23). Con la tarde ya llena, se prueban TODOS
    los órdenes de lo que va después de comer (hasta 8 piezas) con salida fija (donde se come) y
    llegada fija (el barrio de la cena), y se queda el de menos metros que respete horarios y
    reglas. Lo curado y el recorrido de tarde (`afternoon_flow`) no se mueven entre sí; solo se
    intercala lo demás. Si los HORARIOS obligan a andar más de 5 min de más (mejor orden real frente
    al mejor orden con las mismas paradas y todo abierto), se quita el relleno responsable (y no
    vuelve a ese día): un relleno nunca justifica un zigzag. *La primera versión ("con el relleno
    frente a sin él") vaciaba las tardes en bucle en cuanto hubo barrios de cena cerca de donde se
    come: Ara Pacis → Pincio → Popolo → cena en Plaza de España contaba como zigzag.* Lo único
    del tema elegido en el día no se quita: el mínimo de experiencias no se baja. Métrica: tarde+%
    y zigzag en medirDias (km andados frente al mínimo con las mismas paradas).
    *Por qué: Castillo → Tortugas → Minerva → Elefantino → Trastevere bajaba, subía y volvía a bajar
    (6,0 km frente a 5,2); medido sobre 96 viajes, las tardes andaban un 5,8% de más y 35 hacían
    más de 400 m de más.*

---

## H. Reglas generales del motor v3 (decisiones del 2026-09-23)

Valen para CUALQUIER destino: el motor (`shared/routeEngine/`) no sabe nada de Roma; lo propio de
cada ciudad vive en su JSON. Roma aparece solo como ejemplo. Un destino nuevo no necesita tocar el
motor: necesita su JSON, su matriz de tiempos y pasar el kit (sección I).

**Reparto y programador**

30. **El reparto PREGUNTA al programador.** Cada vez que quiere meter algo en un día, el
    programador lo prueba con los trayectos de la matriz, los horarios y las comidas
    (`openDay().tryAdd`). Lo que el reparto da por hecho, el día final lo contiene; nada se tira en
    silencio. *El motor anterior suponía minutos y perdía 488 paradas en 112 viajes.*
31. **Nivel 1 = 4-5 joyas + imprescindibles, 10-12 en total.** Entra siempre en viajes de 3+ días
    de ciudad. Nunca se cae por el ritmo: si no cabe, ese día pasa al horario normal (empieza antes,
    sin el extra de duración) y se avisa con una línea discreta (`pace_notice`). En 1-2 días lo que
    no cabe va a "No te dio tiempo"; una joya puede desplazar a un imprescindible, nunca al revés.
32. **El reparto curado FIJA el nivel 1 a su día.** Pool y experiencias solo pueden moverlo de día,
    nunca quitarlo del viaje. El pool va en el orden en que el viajero lo eligió.
33. **Experiencias = CUOTA, no prioridad absoluta.** Una del tema por día si hay algo a 20 min o
    menos andando, y como mínimo una por día de ciudad en el viaje. Fuera de eso, un lugar del tema
    solo entra DE CAMINO: sin alejarse de la cena más de 2 min andando y sin añadir más de 10. Lo
    curado y el recorrido de tarde están exentos, y lo que va de camino (<= 5 min) no cuenta para el
    tope de categoría. Si un día se queda sin su tema, se dice por qué (`quotaMisses`).
34. **Visita larga = 180+ min** (contando grupos). Una por día en viajes de 2+ días, siempre de
    mañana, salvo en viajes de un día.
35. **El ritmo se mide en VISITAS**: lo encadenado (un grupo, sitios a <= 3 min, lo que está dentro
    de otro) cuenta como una. Completo: desde las 08:00, comida de 60 min, 8-10 visitas. Tranquilo:
    desde las 10:00, comida de 90 min, +15 min por visita (una vez por grupo, en el lugar principal;
    nunca en una parada "de paso"), 5-7 visitas. La app sigue enseñando lugares.

**Horas**

36. **Comida 13:00-14:00; cena 20:00-21:00 en los dos ritmos**; el día acaba con la cena (~21:30).
    La comida puede caer dentro de un grupo, entre dos de sus lugares, salvo entre un par
    inseparable. *Sustituye a la ventana de cena de tranquilo del invariante 25.*
37. **Horarios**: nada empieza antes de abrir ni se queda sin tiempo antes de cerrar; con cierre de
    mediodía se espera a la tarde. `last_entry` es opcional y se respeta si está. Un interior sin
    horario se supone de 09:00 a 17:00; un exterior, siempre abierto. Horarios sin días de la semana
    ni festivos.
38. **Encadenado manda sobre redondeo**: dentro de un grupo, a <= 3 min andando o dentro de su
    contenedor se entra al llegar, redondeando a 5 min. Lo demás, :00/:30 por la mañana y :15 por la
    tarde (ver F).
39. **"Primera hora" (`best_time`) es cuanto antes**, y lo curado de mañana va antes de comer.

**Free Tour**

40. **El Free Tour va a SU hora** (`default_free_tour.default_time`), uno por ciudad. En tranquilo
    es lo primero del día; en completo pueden ir antes 1-2 exteriores rápidos, solo los de
    `early_visit_ok`, sin plan B (si no caben, el tour ya los enseña). Lo que recorre (`covers`) no
    vuelve a salir suelto ese día. Cambiar su hora recalcula el día alrededor.

**La tarde y la cena**

41. **Dónde se cena, por contenido** (decisión del 2026-09-23, sin listas ni reglas por día). Los
    barrios de cena salen solos de los restaurantes (49). Desde donde acaba la parte FIJA de la tarde
    (lo curado, el nivel 1, el pool; el relleno de la primera vuelta se aparta como provisional),
    entre los barrios a 30 min o menos, puntúa el contenido sin ver DE CAMINO (rodeo de 15 min o
    menos), hasta lo que cabe en la tarde que queda, más un extra si hay un mirador para el atardecer.
    El reparto es CONJUNTO: la combinación de barrios que más suma en todo el viaje (por turnos, el
    día 1 se quedaba Trastevere por 32 min de ventaja y el del Vaticano, que perdía 63, cenaba sin
    nada que ver). Un barrio lo comparten dos días solo si uno de ellos está a 15 min o menos. Si el
    barrio ganó por el mirador, el mirador entra el primero; luego se rellena hacia la cena. Resultado
    en Roma, sin escribirlo en ningún sitio: el día del Vaticano cena en Trastevere subiendo a la
    Fontana dell'Acqua Paola. En 1 y 1,5 días, el barrio de cena más cercano a donde acaba la tarde.
42. **El recorrido de tarde (`afternoon_flow`) impone su orden** y está exento de la regla de tema y
    del tope de categoría: es el destino hablando. Es OPCIONAL (50).
43. **"De paso"**: un nivel 1 con `pass_by`, visto un día anterior, se repasa por fuera camino de la
    cena si quedan 45+ min libres y el desvío es de 10 min o menos. Siempre al final del día, con su
    mensaje, una vez por viaje; nunca si esa noche sale como experiencia nocturna.
44. **El tiempo libre antes de cenar no se persigue**: 45+ min se enseñan como bloque de tiempo
    libre (descanso, aperitivo, "Ver en el mapa"), no como un hueco que haya que rellenar.

**Viajes cortos y relaciones**

45. **1 y 1,5 días = rutas curadas por bloques, si el destino las tiene** (`short_trips`, OPCIONAL, 50: un bloque por franja, en su orden,
    núcleo en tranquilo, extras en completo, swaps por experiencia). El motor no reordena; pone horas
    y comprueba. Lo del pool sustituye a lo de menor prioridad y, si no cabe, devuelve su sitio; un
    par inseparable se sustituye entero.
46. **Relaciones entre lugares, en el dato y nunca deducidas por distancia**: grupos e inseparables
    (14, 17b), `contained_in` y `neighbor_of` (16), `approach_to` (17b), `related_to` (17). La
    distancia solo sirve para PROPONER (el validador lista los pares a menos de 300 m).

48. **Días limitados + reserva obligatoria** (`booking_required`, con `booking_note` y `closed_on`):
    sin fechas no entran solos en la ruta (podrían caer un día que cierra); sí desde el pool o
    "Añadir parada", y allí se enseña la nota ("Solo vie-dom, visita guiada con reserva"). Con
    fechas, como cualquier otro, solo los días que abre.

49. **Restaurantes curados = barrios de cena y ficha de comida.** Cada sitio de comer lleva `meal`:
    "comida" | "cena" | "ambos" (cafés, heladerías y bares de aperitivo no). Una zona (`zone` del
    restaurante, por su parte principal: "Monti / Fori Imperiali" y "Monti" son Monti) es barrio de cena si tiene 3 o más restaurantes con `meal` "cena" o "ambos"; su punto
    es el centro de esos restaurantes (shared/routeEngine/dinnerZones.js). Se calcula solo, en
    cualquier destino: nada de `dinner_zones` a mano. Cada zona de imprescindibles necesita
    restaurantes curados cerca (el validador avisa). La ficha de comida/cena de un destino curado enseña los
    restaurantes del JSON a 12 min o menos andando (desde la parada, o desde el barrio de la cena),
    abiertos a esa hora, en lista y en el mapa; solo si no hay ninguno se busca en la web.
    *Sin barrio de cena en el norte, la tarde de Plaza de España/Popolo se podaba entera.*

50. **`afternoon_flow` y `short_trips` son OPCIONALES.** El motor tiene que dar buenas rutas sin
    ellos; el kit los propone como borrador. Se mide con `medirDias --semaforo --sin-opcionales`.

**Tiempos a pie y pureza**

47. **Los tiempos salen de la matriz del destino** (`data/pipeline_v2/travel/<destino>.json`), con
    la API de RUTAS de Mapbox (la que usa la app), en los dos sentidos, con el modo como dato. El
    motor es un módulo puro: sin red, sin reloj, sin Node — el mismo que usará Modo Hoy con hora,
    posición y paradas restantes.

---

## J. Revisión de rutas (2026-09-24, PROMPT_REVISION_RUTAS_ROMA.md)

Reglas generales salidas de revisar en la app dos rutas de Roma de 3 días con el motor v3.

**Paso 1 — Datos y cálculo**

51. **Un horario puede tener varios tramos por día** ("07:30-12:30, 16:00-19:30" o con "/"). El motor
    los comprueba TODOS (`parseHoursSessions`). En pantalla se enseñan todos los tramos del día
    ("07:30–12:30 / 16:00–19:30", `formatDaySessions`), nunca solo el primero, y el "abierto /
    cerrado" de la ficha se calcula a la HORA DE LA VISITA, no a la del móvil. *Una iglesia visitada a
    las 17:45 salía "10:00–12:30": era la tarjeta enseñando el primer tramo y la ficha mirando la hora
    a la que se revisaba la ruta.*
52. **La coordenada de un monumento es su ENTRADA, no el centro del edificio**, sobre todo en pares
    inseparables: el validador da rojo si un par inseparable está a más de 5 min andando. *La Basílica
    de San Pedro apuntaba al centro de la nave: Mapbox la rodeaba y salían 642 m desde la plaza.*
53. **Ninguna hora se pisa, tampoco al editar.** El motor no solapa (lo vigila verifyPlanTrip); en la
    app, al añadir, mover, reordenar o cambiar la hora de una parada, lo que se pisa se EMPUJA hacia
    delante al cuarto de hora siguiente y nunca se adelanta nada (`pushOverlapsForward`). Las
    experiencias nocturnas ni empujan ni se empujan.
54. **Transporte público solo si ahorra tiempo puerta a puerta**: andar a la parada (5) + esperar (6)
    + trayecto + andar desde la parada (5). Si no ahorra al menos 5 min frente a ir andando, el tramo
    va a pie y la opción de transporte no se enseña.

**Horarios auditados**

55. **Horarios por lugar** (`scripts/destino/importarHorarios.mjs`): `windows` = franjas válidas TODOS
    los días que abre, todo el año (valor prudente) — es lo que usa el motor sin fecha ni época (`schedule`
    pasa a ser las windows unidas; "00:00-24:00" = acceso libre). `by_season` y `by_day` se usan
    según la época y las fechas (ver 57). `last_entry` puede ser "HH:MM", un objeto por
    época (sin época, la más PRUDENTE) o por franja (manana/tarde, la de la franja de la visita); ninguna
    visita empieza después (`lastEntryMinutes`). `card_text` es la sección "Horario" de la ficha y
    manda sobre la de la ficha curada; `reservation: obligatoria` pone "Requiere reserva".
56. **Un relleno nunca obliga a esperar más que la tolerancia del ritmo** (45 completo / 60 tranquilo)
    a que abra algo, y al reordenar la tarde un orden sin esperas largas gana siempre a uno que las
    tiene. *Con el Gesù abriendo a las 17:00 salían esperas de 56 y 90 min.*
57. **Qué horario manda cada día** (`effectiveSchedule(place, {weekday, season})`), de más a menos
    preciso: con FECHAS, el `by_day` del día de la semana (sin avisos: ese es el real); con ÉPOCA del
    formulario, el `by_season`; sin nada, el de LUNES A VIERNES (`by_day`; si no hay, `windows`).
    La `last_entry` sigue la misma época (sin época, la más prudente).
58. **Sin fechas, la parada avisa** (`hours_warning`) de los días de la semana en que a esa hora está
    cerrado: "Ojo: el sábado de 16:00 a 16:30 no se puede visitar." Los `closed_on` también se avisan
    ("Cierra los miércoles."). Con fechas no hay aviso.
59. **Plan B también en viajes cortos**: si un imprescindible no cabe con el ritmo, el día empieza a
    las 08:00 y sin el extra de duración, con `pace_notice`.
60. **Antes de perder un grupo por el cierre de un sitio con horario, lo de acceso libre del grupo
    pasa detrás** (el Arco de Constantino se ve al salir del Coliseo). Solo cuando si no se perdería
    el grupo entero.
61. **Un imprescindible con `pass_by` que no llega a su cierre se ve POR FUERA, gratis y pegado a su
    grupo** (`instead_of_visit`): con `from`, la parada se llama "Foro Romano visto desde Via dei Fori
    Imperiali" y dice "…por dentro no da tiempo hoy, pero desde aquí lo tienes entero a tus pies."; sin
    `from`, "…pero por fuera lo tienes entero.". Lo de su `includes` cuenta como visto.
62. **La mañana empieza más tarde en vez de esperar**: si todo lo anterior es de acceso libre y hay que
    esperar ≥30 min a que abra lo siguiente, lo anterior se corre hacia la apertura (en medias horas).
    Nunca lo que va a primera hora a propósito (`best_time` primera hora, `latest_end`: la Fontana de
    Trevi a las 08:00). *La Fontana dell'Acqua Paola a las 08:00 esperaba 100 min al Tempietto.*

**Paso 2 — Comida**

63. **La comida es una FRANJA fija**: 13:00-14:30 en completo, 13:00-15:00 en tranquilo
    (`lunchBlockMinutes` 90/120). Incluye llegar al restaurante, comer (60/90) y andar a la siguiente
    parada; la tarde empieza al acabar la franja. El rato entre el fin de la mañana y la franja no es
    un hueco.
64. **Antes de comer, una visita NUEVA acaba a las 13:00.** Si no, se come primero y la visita abre la
    tarde (en rutas de orden fijo pasa a la tarde con lo que venía detrás). Única excepción: el resto
    de un GRUPO REAL del JSON ya en marcha (Vaticano; Panteón → Navona) puede acabar hasta las 13:30 y
    la franja empieza al acabar (la tarde se retrasa lo mismo). Un bloque curado de varias paradas NO
    es un grupo.
65. **Dónde se come** (`lunchSpots.js`, regla general): en la zona donde acaba la mañana si hay ≥2
    restaurantes curados para comer (`meal` comida|ambos; cafés, helados y aperitivos no cuentan) a
    ≤10 min; si no, el de menos rodeo EN DIRECCIÓN A LA TARDE (nunca más lejos de la siguiente parada
    que donde se estaba), mejor con otro restaurante al lado. La tarde sale del restaurante.
66. **El orden del día se prueba desde dos arranques**: el que deja el reparto y otro con lo de primera
    hora y lo largo delante de la comida; se queda el más barato. *Desde el del reparto la mejora
    local se atascaba: Roma Antigua empezaba en el Barrio Judío y el Coliseo iba a las 11:20.*
67. **El orden curado fijado a mano no cuenta como zigzag**: la métrica mide el mínimo respetándolo
    (Popolo → Pincio → España es para acabar en la Escalinata al atardecer).
68. **Día con excursión de medio día**: sin franja fija (excursión 08:00-14:00, tarde desde las
    16:00), pero entre las dos va SIEMPRE un bloque de comida: "¿Tu excursión incluye comida? Si no,
    cuando vuelvas a {destino} aquí tienes restaurantes perfectos para ti", con el mapa de
    restaurantes centrado donde empieza la tarde (sin paradas de tarde, en el centro de la ciudad).
**Caché y respaldo (2026-09-24)**

70. **Un destino curado nunca usa `route_cache`** (ni lee ni guarda): el motor es gratis, instantáneo y
    más nuevo que cualquier ruta guardada. *Roma de 6+ días servía rutas de motores anteriores.*
71. **En la caché que queda (destinos no curados) cada fila lleva `engine_version`** (hash del modelo y
    los prompts de generación, `routeCacheVersion`) y solo se sirven las de la versión actual: al
    cambiar el motor, lo viejo deja de usarse solo.
72. **En un destino curado NUNCA se llama a Claude de respaldo.** Si el motor no da un día (vacío o
    error), sale como día libre (`engine_empty`) y se registra `[motor v3] día vacío` en el log.
    *Completar una ruta cacheada pedía el día de la vuelta, el motor lo daba vacío y se pagaba a Claude.*

69. **En la app, la tarjeta de comida va en su posición real** (detrás de la última parada que empieza
    antes de la franja) y enseña la franja ("13:00 – 14:30").

---

## I. Kit de nuevo destino: cuándo un destino está listo

1. **Datos** — `node scripts/destino/validar.mjs <destino>`: referencias, grupos, nivel 1 (4-5
   joyas, 10-12 en total), visitas largas frente a `core_days`, horarios, pares a menos de 150 m
   decididos (y propuestas hasta 300 m), coordenadas contra Wikipedia (rojo a más de 200 m),
   restaurantes con `meal` y barrios de cena que salen (y a qué zonas les falta uno).
2. **Borradores de criterio** — `node scripts/destino/borradores.mjs <destino>`: joyas por
   popularidad, recorrido de tarde por zona y rutas de 1 y 1,5 días, probadas con el motor. Se
   revisan a mano y se copian al JSON; no se usan tal cual.
3. **Matriz** — `node scripts/buildTravelMatrix.mjs <destino>`.
4. **Semáforo** — `node server/engine/__tests__/medirDias.mjs --destino <destino> --motor v3
   --semaforo`: las 112 variantes contra límites que salen de estas reglas. Los días por encima de
   `core_days` (repaso, excursión de medio día) tienen sus propias reglas: no se les pide acabar
   después de las 16:00, sí como mucho 3 revisitas. **Destino listo = datos
   sin rojos + semáforo todo en verde.** Los límites no se aflojan para que un destino pase: si algo
   sale en rojo, o el dato está mal o el motor tiene un fallo.

---

## F. Lo que SÍ se tira (y hay que reemplazar, no solo borrar)

- **`zone_walks` (11 paseos)**: fuera. Pero eran el tapón de un agujero real — medido: en
  `tranquilo` 5 días, el día 4 acaba a las **13:45**. La tolerancia de 45 minutos no cubre seis
  horas. **Quitarlos sin resolver los días sin tarde deja esos días peor que hoy.** Decisión: en
  tranquilo el día se rellena con niveles 2-3 cercanos hasta las 16:00 como mínimo; si aún sobra
  hueco, ese día se marca como candidato a excursión de medio día.
- **`best_time` como restricción**: solo lo llevan 3 lugares (Coliseo, Fontana, Vaticanos) y ningún
  mirador. Pasa a bonus de desempate.
- **El redondeo al cuarto más cercano** (`:15`/`:45`, hoy el 38% de las horas): pasa a :00/:30 hacia
  arriba por la MAÑANA; por la TARDE (después de comer), al cuarto de hora siguiente, hacia arriba
  (decisión del 2026-09-23: con :00/:30 cada parada de tarde podía esperar hasta 29 minutos y el
  orden que menos camina perdía frente a un zigzag que llegaba "en punto"). Las encadenadas, a 5 min.
- **Los parches de reparto de relleno** (tope de tarde, fase antihuérfanos): se van con el motor
  viejo. Lo que NO se va es el problema que resolvían — que un día se quede sin contenido mientras
  otro se queda con el doble.

---

## G. Contrato de aceptación

El harness actual corre las 8 variantes × 2 ritmos y comprueba: solapes de horario, repetidos entre
días, mirador dentro de ventana, mañana dentro del corte, cena después de la última parada.

**Línea base hoy: 9 fallos conocidos** (mañanas de núcleo curado que se pasan de las 13:20 en ritmo
tranquilo — el núcleo no se recorta por diseño), 0 solapes, 0 duplicados.

El motor nuevo **no se da por bueno hasta que pasa este mismo harness ampliado a 1 día y a 6-7
días**, con esos 9 fallos resueltos o justificados uno a uno. Comprobaciones nuevas que hay que
añadirle: ninguna hora en `:15`/`:45`, ninguna parada antes de su apertura, el pool siempre presente,
las experiencias reflejadas en el núcleo del día, y una visita larga por día como máximo.
