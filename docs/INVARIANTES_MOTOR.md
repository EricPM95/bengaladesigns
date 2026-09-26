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

73. **Un relleno nunca es de pago.** Lo que pide entrada (`requiresTicket`: por dentro y sin
    `is_free_access`) solo entra si es nivel 1, del pool o de una experiencia elegida. Lo que está
    DENTRO de algo de pago (`contained_in` en un contenedor de pago) tampoco es relleno salvo que su
    contenedor ya esté en la ruta; esto solo cuenta para decidir rellenos, el campo "de pago" no cambia.
74. **Mínimo-máximo de cada experiencia, por viaje** (1 día: 1 · 2-3 días: 2-3 · más de 3: 3-4). Cuenta
    solo lo que entra POR la experiencia (lo de pago del tema y lo que se añade para llegar al mínimo);
    los imprescindibles no cuentan aunque lleven la etiqueta. Se reparte entre días (el que menos lleva,
    primero), con lo más característico del tema delante (la primera etiqueta de su lista: museo en Arte,
    barrio en Barrios, mirador en Naturaleza) y nivel 2 antes que nivel 3. Al máximo, no entra nada más de
    pago del tema. Lo gratis del tema que cae de camino es relleno normal, no cuenta, y gana a otro relleno
    gratis que no sea de ninguna experiencia elegida.
75. **Lo que entra por una experiencia lleva su etiqueta** en la app ("Por tu experiencia · Arte y
    Museos"), y lo que se queda fuera sale en "Añadir parada" como **"También te puede interesar"**.
76. **`contained_in` es solo para lo que está físicamente dentro y no se ve sin entrar al contenedor**
    (la Cúpula en la Basílica, las Tortugas en el gueto, el Bioparque en Villa Borghese). Lo que está al
    lado o en su plaza es `neighbor_of` (Via dei Fori Imperiali y el Foro, el Elefantino y la Minerva, el
    Teatro de Marcelo y el Barrio Judío).
77. **Si entra lo de dentro, entra su contenedor** ese día y justo delante. Un relleno solo arrastra un
    contenedor gratis; lo del pool o de una experiencia lo arrastra aunque sea de pago (`draggedBy`), y
    los dos cuentan como 1 en la experiencia. Si el contenedor no puede entrar, lo de dentro se quita.

78. **Dentro de una experiencia gana lo más representativo; la geografía decide el día, no si entra.**
    Orden: la lista editorial del destino (`destination_config.experience_highlights`, opcional) y si no,
    más etiquetas del tema, la más característica y el nivel. El día, el más cercano entre los que menos
    llevan del tema, sin descartar por distancia. Lo que entró por una experiencia no es relleno
    provisional: no se aparta al elegir la cena. *La Galería Borghese perdía contra los Mercados de
    Trajano por estar lejos, y cuando entraba, se perdía al elegir la cena.*
79. **El tiempo que sobra no es un error: es una "Tarde libre", y va al FINAL del viaje.** El relleno
    llena primero los primeros días; si el destino no da para más, la tarde libre cae en los últimos,
    nunca en el día 2. Con 90 min o más libres antes de cenar, el día lleva `free_afternoon` con 2-3
    sugerencias cerca de donde acaba (pueden ser de pago; primero las de sus experiencias). En el
    semáforo, una tarde libre es amarillo, no rojo.

**Paso 4 — Free Tour**

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
83. **Una experiencia nocturna SUELTA a 10 min o menos de una parada de la tarde se ve al atardecer**, en
    la tarde, y su versión de noche ya no sale esa noche. Se mira al elegir la cena y otra vez con la
    tarde definitiva. Las cadenas de varias nocturnas (Panteón → Trevi → España) no se tocan.

84. **El recorrido de tarde fijado por el destino (`afternoon_flow`) va por delante del relleno y sin sus
    topes de desvío**: es el camino del día, no un rodeo (Vaticano: … Castillo → Mirador del Janículo →
    Fontana dell'Acqua Paola → Trastevere). Un mirador del recorrido con versión de noche va al
    atardecer solo si el sol se pone antes de cenar en la época del viaje
    (`destination_config.sunset_by_season`); si no, se queda como nocturna. Sin época, al atardecer.
85. **Entre dos visitas por dentro, primero la que cierra antes.** Lo que no cabe antes de comer va por la
    tarde detrás de los interiores que cierran antes y delante de los que cierran después (1 día con
    Free Tour: Coliseo 16:30 → Foro visto desde fuera → Panteón 19:00 → Altar de la Patria 19:30).
86. **Si antes del Free Tour no hay nada que merezca la pena, el día empieza con el tour**: un relleno
    (`filler_before_tour`) no justifica madrugar y esperar. Solo imprescindibles, pool, experiencia o lo
    fijado por el destino.
87. **Si lo que falla es el horario de un sitio, se recorta ese sitio**, no lo menos importante de la
    franja (el Foro que ya ha cerrado no se arregla quitando el Altar de detrás).
88. **Un barrio como parada y un bloque de tarde del mismo barrio no coinciden el mismo día** (sería
    pasear el barrio dos veces). Hoy el motor v3 no usa `evening_blocks` ni `zone_walks` (solo el motor
    viejo), así que no puede pasar; si se vuelven a usar, esta regla va con ellos.

**Paso 6 — El "por qué" de cada parada**

89. **Cada parada lleva una línea fija (`why`, `whyTexts.js`) según el motivo por el que la puso el
    motor**, sin IA: pool > imprescindible > experiencia > mirador / nocturna > de camino. Textos sin
    concordar en género con el lugar; {lugar} con su artículo (la etiqueta de su `pass_by`). "Atardecer"
    solo cerca de la puesta de sol (con época, `sunset_by_season`; sin época, desde las 17:30); "de
    camino a la cena" solo por la tarde (por la mañana, "Te pilla de camino"). El Free Tour dice
    {del zona} (`default_free_tour.area_del`) y sus imprescindibles, y cambia la última frase si el
    viaje vuelve a pasar por ellos (de noche o de paso). Revisitas y pasos por fuera llevan su propio
    texto ("Ya visitaste {lugar} el Día {n}, pero creemos que verlo a esta hora te va a gustar…").

**Revisión del 2026-09-25**

90. **Puesta de sol**: con fechas, calculada (`sunset.js`, fórmula astronómica con las coordenadas y la
    zona horaria del destino, sin API); sin fechas, `sunset_by_season`; sin nada, no se sabe y el motor
    no promete atardecer. Un mirador cuenta como atardecer si se llega de 60 min antes a 15 después de
    la puesta; el motor busca la hora dorada (no antes de 45 min antes) y la visita dura como mínimo
    hasta que se pone el sol. Texto: de 60 a 30 min antes, "Llegas con tiempo para coger buen sitio
    antes del atardecer sobre {ciudad}."; menos, "Llegas justo a tiempo…". Si ese día el sol se pone a la
    hora de cenar o después, el mirador con versión de noche se queda de noche.
91. **Ningún precio, ni "gratis", fuera de la pestaña Tickets** (el `card_text` del horario no los lleva).
92. **Sin fechas manda el horario de laborables** (`windows` = la entrada de `by_day` que cubre más días de
    lunes a viernes), con aviso en la parada de los días que a esa hora no se puede: "Domingos y
    festivos, solo de 16:30 a 18:00." (y "Cierra los lunes." si cierra algún día).

93. **Con fechas, un día curado cuyo imprescindible cierra ese día de la semana se cambia con otro día
    del viaje** en el que abra (y cuyo curado abra también en el primero). *El día del Vaticano caía en
    domingo y se perdía el grupo entero (Plaza y Basílica van con los Museos).*
94. **Solo un MIRADOR con versión de noche es "del atardecer"**; tener nocturna no basta (el Puente
    Sant'Angelo la tiene y se le obligaba a la hora de la puesta de sol, y el Castillo ya no cabía). Lo
    del recorrido fijado entra además en el orden del recorrido.

95. **Precio y condiciones de entrada, solo en la pestaña Tickets** (`ticket_info` del lugar, tarjeta
    "Entrada"): ni en el consejo (`tip`) ni en el horario. Al limpiar un texto, el dato se lleva allí,
    nunca se pierde.
96. **En un viaje no se repite un lugar de nivel 2 o 3**, ni como nocturna ni como mirador: si se ve de
    día, su nocturna no sale ninguna noche del viaje. Solo el nivel 1 se repite (de noche, de paso o
    como revisita en los días de repetición: `canRevisit` exige nivel 1).
97. **El barrio va el día que se cena en él**: si un barrio es el barrio de cena de otro día (está a 20 min
    o menos de donde se cena), va ese día, bajando a cenar; el día de donde sale se rellena con lo suyo.
98. **El orden fijado de la tarde es obligatorio**: la mejora de la tarde nunca se queda con un orden que
    lo rompa, aunque ahorre una espera (Janículo → Acqua Paola → Trastevere, bajando del mirador a cenar).

**Ajustes antes del push (2026-09-25)**

99. **Ninguna cifra de precio en los datos**: la tarjeta "Entrada" (`ticket_info`) dice solo "De pago" /
    "Gratis", "Reserva obligatoria/recomendada" y datos útiles sin importe ("gratis el primer domingo de
    mes", "las excavaciones son aparte"). Los precios saldrán de las APIs de los proveedores, reales y al
    día. `validar.mjs` marca en rojo cualquier precio en `ticket_info`, `tip` o `card_text`.
100. **La nocturna sale desde la cena o no sale**: la primera nocturna está a 15 min andando o menos del
    barrio de cena (`NIGHT_REACH_METERS`, ~950 m en línea recta con el rodeo medio). Si no hay ninguna, esa
    noche no hay nocturna. Al elegir barrio de cena, uno con nocturna posible a esa distancia suma un extra
    pequeño (`NIGHT_BONUS_MINUTES`, menor que el del atardecer: desempata, no arrastra el día). Una
    nocturna que mira un lugar desde OTRO sitio puede ir el mismo día que su visita de día
    (`same_day_as_visit`: el Foro iluminado desde el Campidoglio el día de la Roma Antigua).
101. **La bajada natural** (`leads_to`, datos del destino): "de A se sale directo a B" (del Campidoglio se
    baja al Barrio Judío). Si los dos van el mismo día, B justo después de A; en la tarde manda sobre los
    metros (solo por detrás de las esperas largas). Lo que va obligatoriamente seguido (lo de dentro con
    su contenedor, la bajada natural) se ordena como una sola pieza. El rato antes de comer no es un
    hueco y no cuenta como coste: no se mete una visita antes de comer para taparlo. Lo que pase de 60
    min sí es un hueco y cuenta (la mañana del lunes de Pascua no puede acabar a las 10:25).
102. **Hueco a mitad de día**: si entre dos visitas quedan 60 min o más de espera (a la hora del atardecer,
    a que abra algo), primero entra lo GRATIS que quede de camino (sin topes de categoría, desvío máximo
    del relleno), también la parte gratis de un grupo de pago que no está en la ruta con lo de pago visto
    por fuera (el Puente Sant'Angelo, con el Castillo por fuera). Una vez abierto, ese hueco se sigue
    llenando mientras quepa algo. Si aún quedan 60 min o más: bloque "Tiempo libre" con 2-3 sugerencias
    cerca, que pueden ser de pago, como la tarde libre. La comida no es un hueco. Por la mañana, antes de
    una hora fija (el Free Tour), el día empieza más tarde en vez de esperar.

**Estaciones (PROMPT_ESTACIONES.md, 2026-09-25)**

103. **El motor siempre conoce la fecha o, como mínimo, el mes** (`tripCalendar.js`): recibe fechas
    exactas (cada día, su fecha y su día de la semana) o días + mes 0-11 (todos los días, el **día 15** de
    ese mes, sin día de la semana: horario de laborables + aviso). La temporada ya no es una entrada: se
    deduce del mes (dic-feb invierno) y solo sirve para mostrarla y como reserva (`by_season`). Un viaje
    antiguo con solo temporada pasa a su mes central (abril, julio, octubre, enero). Sin fechas, el mes
    es obligatorio en el formulario; con fechas, sale de ellas.
104. **Horario de un lugar un día concreto**, en este orden: cierres (`closed_on` por día de la semana
    y `closed_dates` MM-DD, este solo con fechas, en el reparto: un día curado cuyo imprescindible cierra
    esa fecha se cambia con otro) → `by_day` con fechas → `by_period` (la fecha real o el 15 del mes;
    `from`/`to` MM-DD incluidos, pueden cruzar el año; su `last_entry` manda, null = no hay) →
    `by_season` (reserva) → `by_day` de laborables sin fechas → `windows`. La palabra `sunset` en una
    franja ("07:00-sunset") es la puesta de sol de ese día (sin ella, las 17:00). `validar.mjs` avisa si
    los periodos dejan días sin cubrir o se solapan (366 días) y si la auditoría (`hours_audit.fecha`) es
    de un año anterior al del viaje (`--anio`). Import: `scripts/destino/importarPeriodos.mjs`.
    **Fechas móviles**: en `closed_dates` (y en cualquier lista de fechas) `easter`, `easter+N`,
    `easter-N`: Pascua se calcula cada año (algoritmo gregoriano), nunca se escribe con su día (el lunes
    de Pascua es `easter+1`). **Último domingo**: `last_sunday: { windows, last_entry, except }` abre el
    último domingo del mes un lugar que cierra los domingos (Museos Vaticanos: 09:00-14:00), salvo las
    fechas de `except`. Un día "cierra" lugar a lugar (`closedOnDay`), no con listas de la unidad.
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
107. **Viajes de 1 día y cierres**: si el imprescindible de un bloque cierra esa fecha (`closed_on`,
    `closed_dates`) o no se puede visitar con su horario de ese día (el Vaticano el último domingo:
    09:00-14:00 no da para el grupo antes de comer), se usa otra combinación de bloques (domingo →
    Roma Antigua + Centro en vez de Vaticano + Centro) y se dice por qué.
    En viajes más largos, el día curado cuyo imprescindible cierra se cambia con otro día; si no hay con
    quién (2 días desde el domingo de Pascua: el Vaticano cierra los dos), el día se reparte como uno sin
    curado, nunca "el día del Vaticano sin Vaticano".
108. **En viajes cortos, lo fijo de un bloque curado (`core`) va primero.** Una visita por dentro nunca
    desplaza el interior de una joya (octubre, 1 día con Free Tour: el Foro se ve desde la Via dei Fori
    Imperiali y vuelven el Panteón por dentro, Plaza Venecia y el Altar). "No reducir el día a menos
    paradas" (dos o más) solo vale para visitas opcionales, nunca contra el core: en 1 día sin
    experiencias el Foro va por dentro. Los extras del bloque que no caben enteros (Plaza Venecia, el
    Altar) van de paso y por fuera, 15 min entre todos, de camino (un acceso, delante de aquello a lo
    que da acceso); solo si ni así caben, "No te dio tiempo".
109. **El mirador del atardecer va siempre en su sitio del recorrido**, y la espera hasta el atardecer
    no es una espera que evitar: la cubre la regla de huecos (102). **Nunca se cruza el río ni se vuelve
    sobre los propios pasos dos veces para evitar una espera.** Si con el mirador en su sitio no cabe lo
    que le sigue en el recorrido (puesta de sol tardía), ese día manda el recorrido: el mirador se visita
    en su sitio sin esperar al atardecer.
110. **Mercadillos**: son lugares con `available` (normalmente `aprox`) y la etiqueta
    `mercadillo_navideno`, que casa con la experiencia "Mercadillos Navideños".
111. **Un bloque con cierre se hace por fuera, no desaparece.** Si el imprescindible de un bloque cierra
    esa fecha y no hay otra combinación, el bloque va en modo exterior: lo gratis y abierto tal cual; lo
    de pago o cerrado, por fuera (su `pass_by` o, si se ve desde la calle, 15 min); lo que ni así se ve,
    fuera. El 25 de diciembre en 1 día: Arco, Coliseo por fuera, Foro desde la Via dei Fori Imperiali,
    Plaza Venecia y el Altar por la mañana, y el Centro por la tarde. Se avisa: "Ese día cierra: … Lo ves
    por fuera."

**Revisión de los 16 viajes (2026-09-25)**

112. **Una joya nunca se queda fuera.** Si no cabe en ninguna mañana, va por la tarde en un día sin otra
    visita larga (el Vaticano en 2 días con Free Tour, a las 14:30 con menos cola), reordenando el día; y
    si ni así, otra parada de ese día pasa a otro día del viaje (sin perderse) para hacerle sitio.
113. **La experiencia elegida se nota.** Antes de dejar una tarde libre entra lo de la experiencia que
    quepa, en el orden de `experience_highlights`. Lo de pago, con su mínimo-máximo (y `museos_de_pago`).
114. **Miradores al atardecer si el día tiene tiempo**: un mirador que iba a otra hora pasa a la hora
    del atardecer cuando sobra tiempo, y el sobrante va antes.
115. **Sin vaivenes**: para meter una parada que no es imprescindible ni del pool no se vuelve sobre los
    propios pasos más de 10 min; si no, va otro día.
116. **Se cena donde acaba el día**: el barrio de cena, a 15 min o menos del final de la tarde (antes,
    30); si al terminar el día queda más lejos, se cambia por el más cercano. La ventaja por una
    nocturna cerca desempata, nunca aleja la cena.
117. **Nocturnas con su tiempo real**: la duración de cada una más el paseo hasta la siguiente, en
    tramos de 5 min. Ninguna empieza después de las 23:00.
118. **Tranquilo es menos paradas, no paradas más largas**: el extra de duración solo para visitas por
    dentro. Madrugar (plan B, 08:00) solo si de verdad hace falta: antes se prueba a quitar un relleno. El
    aviso nombra lo que se recupera de verdad (el Coliseo y el Foro, no el Arco).
119. **Etiquetas de experiencias**: Naturaleza y Vistas = miradores y parques; Barrios y Sabores =
    barrios, mercados y sitios de comer. Una plaza, una calle o una fuente sin más no son ninguna. El "por
    qué" y la etiqueta de experiencia, solo si ese lugar es de ella (no se heredan del grupo).
120. **Días largos**: antes de una tarde libre entran los lugares gratis de nivel 2 que falten (el
    Parque de Villa Borghese, el Aventino). Los días de repaso llevan su excursión de medio día.
121. **La excursión de día completo nunca el último día del viaje**: si `core_days` cae ahí, se adelanta
    un día y ese día curado pasa al último.
122. **"Tiempo libre" y "Tarde libre"**: solo sugerencias abiertas a esa hora (se llega, se visita entero
    y da tiempo a seguir) y de camino (15 min de desvío como mucho hacia lo siguiente o la cena). Si no
    queda ninguna, el bloque sale igual, sin sugerencias.

**Cómo planifica un local (PROMPT_MANANAS_Y_TARDES.md, Parte A, 2026-09-25)** — también en el JSON del
destino (`principios_local`, `museos_de_pago`, `redundancias`); `shared/routeEngine/localRules.js`.

123. **Una visita grande al día**: como mucho una de más de 90 min; y junto a ella, otra de pago por
    dentro solo si dura 45 min o menos. Lo imprescindible (nivel 1) y el pool no cuentan.
124. **Museos de pago de más, según los días** (`museos_de_pago`): hasta 3 días, ninguno aparte de joyas e
    imprescindibles; 4 días, 1; 5-6, 2; 7 o más, 3. El pool entra siempre. En viajes cortos, "Arte y
    Museos" se cumple con arte gratis (Caravaggio en San Luigi, Bernini en la Vittoria, el Moisés).
125. **Museos parecidos** (`redundancias`): si el principal está en el viaje, el otro no entra, salvo
    pool o viaje de 5 días o más con la experiencia que lo pide (con los Vaticanos, los Capitolinos no).
126. **Las calles no son paradas**: lo que lleva la etiqueta `calle` sale como "Pasas por…", 10 min, sin
    número (el Foro visto desde la Via dei Fori Imperiali sí es parada: es un sitio para mirar).
127. **Miradores**: al atardecer cuando el día tiene tiempo (el tiempo va antes); si no, uno que pilla de
    camino a otra hora también vale (regla 114).
128. **Un lugar bonito de camino** puede entrar aunque no sea de la experiencia elegida, pero no cuenta para
    su mínimo-máximo ni lleva "Elegido según tus gustos" (regla 119).
129. **Nada de horas muertas en mitad del viaje**: un hueco de más de 90 min (entre paradas, antes de comer
    o tarde libre) que no sea el último día es un bloque que falta: el semáforo lo marca en rojo
    (`muertas`). La tarde libre del último día sigue en amarillo.
130. **En verano se cena después del atardecer**: con una parada al atardecer y el sol a las 20:15 o más
    tarde, la cena pasa a las 21:00 (hasta las 21:30 si hay que bajar del mirador), y las nocturnas
    empiezan cuando acaba la cena.

**Mañanas y tardes tipo (PROMPT_MANANAS_Y_TARDES.md, Parte B, 2026-09-25)** — `morning_flows`,
`afternoon_flows` y `flows_formato` en el JSON del destino; `shared/routeEngine/blockTrip.js`. Solo en
viajes de 2 días o más: los de 1 día siguen con `short_trips` (medido: con bloques salían peor en 28 de
40 casos).

131. **Cada día es una mañana tipo y una tarde tipo**: el destino se cura en bloques de medio día; el
    motor los elige, los ordena y pone horas, cierres, atardecer, comida y cena. Solo improvisa un medio
    día si ningún bloque encaja ("medio día sin tipo", amarillo en el semáforo: `sinTipo`).
132. **Mañanas por prioridad**: primero el Free Tour (sustituye a la mañana que recorre lo mismo); luego la
    que tiene una joya que no se visita en ninguna tarde (el Coliseo le gana el sitio al Vaticano, que
    tiene "vaticano_por_la_tarde"; verlo de paso no cuenta); luego la que tiene algo del pool que no sale
    en ninguna tarde (lo demás del pool se rescata por la tarde); luego
    las que van con el viaje (imprescindibles o una experiencia elegida) por `prioridad`. Las experiencias
    ordenan, no dejan un día sin mañana. Nunca una mañana con su ancla cerrada ese día ni una que pida
    más días (`minimo_dias_viaje`) que el viaje, salvo por el pool. Las mañanas se eligen mientras todas
    quepan en algún día con su ancla abierta y luego cada una va al primer día que deja sitio a las demás
    (si el Vaticano solo abre el sábado, el sábado es suyo aunque el Coliseo vaya antes en prioridad). Un bloque con `transporte` (la Via
    Appia) no es mañana de ciudad: va como excursión de medio día mientras no haya saltos de transporte.
133. **Tardes por encaje**: la que encaja después de dónde acaba la mañana (`encaja_despues_de`); si
    ninguna lo dice, la que empieza a 20 min andando (a 30 si no hay ninguna a 20). El Free Tour acaba en
    el centro. Entre las que encajan, la que más aporta (pool, joya del ancla, imprescindibles nuevos,
    experiencias, y mucho más si es la última oportunidad de un imprescindible: el Altar solo está en
    "campidoglio_ghetto"), la que menos pierde y la que no deja horas muertas. La única tarde que encaja
    detrás de la mañana de un día posterior se reserva: su ancla no se gasta antes. Nunca repetida, ni excluida por
    otro bloque (`excluye`, `excluye_tardes_mismo_dia`, `excluye_tardes_mismo_viaje`), ni con su ancla ya
    vista o en la mañana de otro día. Si con las elegidas un día (no el último) se queda con más de 90 min
    parado, se replanifica el viaje sin esa tarde ese día y se queda el mejor.
134. **Dentro del bloque manda su orden**: las relaciones entre lugares (vecinos, accesos) ya las decidió
    quien curó el bloque. El ancla tiene que caber; si no, otro bloque. `solo_con`: solo con esa
    experiencia o el pool. Lo cerrado se salta, o va de paso si se ve por fuera. Lo visto con el Free
    Tour va de paso. Lo de pago que el bloque se salta (solo con Arte, cuota de museos) se ve por fuera
    desde su compañero de grupo (el Castillo desde el Puente).
135. **La mañana del bloque se hace entera**: puede alargarse hasta las 13:30 (y comer hasta las 14:00);
    lo que no cabe antes de comer va detrás de la comida con lo que le sigue, nunca suelto en la tarde.
    Si así un imprescindible de la mañana se va a la tarde, se madruga (plan B) y se dice por qué.
136. **El atardecer, a su hora**: el tiempo que sobra va antes (en el propio mirador). Lo de detrás que no
    cabe antes de cenar se ve de paso bajando (Piazza del Popolo, al bajar del Pincio); adelantar
    paradas por delante del mirador solo si no hay otra, y nunca el ancla ni lo que va detrás de ella.
    Si ni así, el mirador va como una parada más, en su sitio.
137. **Comida y cena de su bloque**: se come donde acaba la mañana y se cena en el barrio que dice la tarde
    (`cena`); si nombra varios, el más cercano a donde acaba. Las nocturnas, solo las de su lista.
138. **Tranquilo es menos paradas**: la tarde se recorta hasta las paradas del ritmo (lo de paso no
    cuenta), quitando primero nivel 3, luego 2; nunca el ancla, el atardecer ni el pool.
139. **Nada de horas muertas con bloques**: si la tarde acaba y quedan más de 90 min hasta la cena (o el día
    no llega a las paradas mínimas del ritmo y le sobra tarde), se sigue de camino al barrio de la cena (15 min de parada a parada, 15 de desvío); si hay más de 60 min
    esperando a que algo abra, se mete algo entre medias. Nunca algo con grupo suelto, ni el ancla de
    otro bloque, ni la mañana de otro día, ni una espera nueva por encima de la tolerancia. Al final, lo
    añadido se recoloca donde menos se anda sin tocar el orden del bloque.
140. **Imprescindibles y pool que ningún bloque trae**: entran con su grupo entero (la Plaza Venecia y el
    Altar) en el día y el sitio donde menos se anda, pudiendo caer solo algo de paso o añadido.
141. **Kit: cada destino se cura en bloques** (`destination_config.size`): grande 8 mañanas y 10 tardes,
    mediano 6 y 7, pequeño 4 y 4. `validar.mjs` en rojo si faltan, si un nombre no existe o si entre dos
    paradas seguidas hay más de 20 min andando (salvo la parada con `paseo: true`: un paseo junto al río);
    en amarillo, la mañana sin ninguna tarde que encaje y el `comida`/`cena` de un bloque que no nombra
    ningún barrio con restaurantes.

**Ajustes a los bloques (PROMPT_AJUSTES_BLOQUES.md, Parte A, 2026-09-26)**

142. **`antes_del_atardecer`**: esas paradas llenan el tiempo antes del mirador. Sin tiempo (invierno), se
    saltan a la ida y se sube directo al mirador; lo que el bloque ponía entre ellas y el mirador se ve
    bajando (del Puente al Janículo y bajada por el Tempietto y Acqua Paola). Si el ancla es de antes del
    atardecer y se salta así, el bloque sigue valiendo.
143. **`reversible`**: el bloque se hace al revés cuando se llega por el otro extremo (desde Trastevere o
    Testaccio, el centro barroco empieza por el Ghetto y acaba en el Panteón).
144. **Cerrado a esa hora, de paso**: una parada de la tarde que se cae por su horario (cerrada, cierra
    durante la visita, pasada la última entrada) va como "Pasas por…": el bloque pasa por delante.
145. **El barrio del bloque y el de los restaurantes, el mismo nombre**: un restaurante con etiqueta doble
    ("Trastevere / Testaccio") cuenta también para el segundo barrio si ese barrio existe por sí solo en el
    destino. El texto `comida`/`cena` del bloque se lee con esos nombres (`restaurantZonesNamedIn`).
146. **Una visita grande al día, también en los bloques**: lo de pago de un grupo que no se visita en el
    viaje se ve por fuera desde su compañero (el Castillo de Sant'Angelo desde el Puente), salvo pool.
147. **Una experiencia elegida que ningún bloque trae** (mercadillos de Navidad) entra de camino una vez por
    viaje: lo más cercano de esa experiencia, con 15 min de desvío como mucho y sin que se caiga nada.
148. **El repartidor antiguo (`planTrip.js`) es legacy**: solo para destinos sin bloques; no se arregla y
    `verifyPlanTrip` no cuenta para el verde. Se retira cuando todos los destinos tengan bloques.

**Ajustes a los bloques (PROMPT_AJUSTES_BLOQUES.md, Partes B y C, 2026-09-26)**

149. **El orden de un bloque es sagrado**: nunca se reordena para rellenar tiempo. Si sobra antes del
    atardecer, se alarga lo marcado `antes_del_atardecer` (primero lo que es barrio: callejear Trastevere,
    no la iglesia) o queda un "Tiempo libre" justo antes del mirador; lo que el bloque pone detrás del
    mirador y no cabe se ve de paso bajando. El semáforo marca en rojo cualquier bloque en otro orden que
    el del JSON (`reorden`); no cuentan lo saltado, el bloque reversible hecho al revés ni la bajada que
    el propio bloque dice.
150. **Lo que sobra de la mañana no arrastra la tarde**: lo que no cabe antes de comer va de paso si se ve
    desde la calle; si no, fuera (un imprescindible lo recoge el rescate, de camino, en su sitio). La tarde
    empieza donde dice su bloque.
151. **Cerrado a esa hora, también si hay que esperar**: una parada de la tarde que obliga a esperar a que
    abra más que la tolerancia del ritmo va de paso (Santa Cecilia a las 14:30, abre a las 16:00). Nunca un
    imprescindible: para ese se acorta la comida o va a otro día.
152. **Rellenos de camino, sin derivar**: lo que llena una espera está a 20 min como mucho de los dos
    extremos de la espera original y se acerca a la parada que espera; lo que alarga la tarde hasta la
    cena queda a 15 min del barrio de la cena. La espera al mirador no se rellena con paradas.
153. **La experiencia elegida pesa más al elegir la tarde**: cada coincidencia vale más que la última
    oportunidad de un imprescindible suelto (el Altar puede ir de paso en otro bloque).
154. **El orden del pool manda en los días**: lo primero del pool, en los primeros días (la Borghese el
    día 1, no el 5). Qué mañanas entran sigue igual (Free Tour, joya que solo sale por la mañana, pool…).
155. **Los imprescindibles que se ven desde la calle nunca se quedan fuera**: si ningún bloque del viaje
    los tiene y no cabe su visita, entran de paso (15 min, desde su punto de paso si lo tienen) en el
    bloque que pase más cerca (25 min de desvío como mucho), sin que se caiga nada del bloque.
156. **Aperitivo y paseo por {barrio}**: 45-90 min libres justo antes de cenar en un barrio de cena se
    llaman así (no "Tarde libre"), con 2-3 sugerencias abiertas de camino.
157. **Antes que perder un imprescindible, comida más corta**: 60 min comiendo (75 con el paseo) y sin el
    extra de tranquilo, con aviso ("Hoy la comida es más corta para que te dé tiempo a ver …").
158. **Una mañana, al día en que su imprescindible abre por la mañana**: el miércoles la Basílica de San
    Pedro no abre hasta las 12:30, así que el Vaticano va otro día si puede.
159. **1 día**: con Arte, arte gratis (San Luigi) y al final Popolo → Santa Maria del Popolo → Pincio al
    atardecer, en vez de los Capitolinos. La tarde libre de 1 día (90 min o más) se rellena con el tramo
    del destino (`short_trips.relleno_tarde_libre`), parada a parada, sin repetir lo que ya está.
160. **Un bloque reversible se prueba en los dos sentidos**: se queda el que mejor sale (el Panteón cierra
    a las 16:00 los sábados: el centro barroco, empezando por él); a igualdad, el que empieza más cerca.
161. **Lo que la mañana no llega a hacer puede salir en la tarde** si su bloque de tarde lo lleva (el
    Pincio y Popolo tras la Borghese): no cuenta como visto por la mañana. Si la mañana pierde dos paradas o
    más, antes se prueba a madrugar; y lo que se cae de la mañana cae con su grupo (el Aventino entero),
    salvo que en el grupo haya un ancla o un imprescindible.
162. **El rescate va con su grupo**: si un compañero de grupo ya va en el viaje, solo ese día y justo al
    lado (la Basílica detrás de la Plaza de San Pedro). Lo de dentro de una joya, siempre por dentro si
    cabe; lo que se ve desde la calle, de paso. Para hacerle sitio solo se caen rellenos o lo de paso sin
    grupo. Lo alargado para esperar al atardecer es tiempo libre: el rescate lo puede usar.
163. **Al bajar del mirador en invierno**, lo que se saltó a la ida (callejear Trastevere) se hace camino de
    la cena; y si cerca del barrio de la cena ya no queda nada, el alargue sigue a 15 min de donde acaba el
    día y la cena pasa al barrio más cercano. Todo lo añadido junto, 20 min de desvío como mucho.
164. **Parejas mañana-tarde declaradas en el JSON: excepción al límite de 20 min**, que solo vale para lo
    que el motor elige por su cuenta. Si el traslado pasa de 25 min andando, el día lo avisa: "Traslado de
    ~X min: mejor en …" (`traslados[acaba_en]` del bloque; sin dato, "bus o metro"). Una pareja de más de
    35 min andando solo se queda si en transporte (bus, metro o taxi) baja de 20.
165. **Hueco para un imprescindible que se ve desde la calle**: se recorta en este orden, y solo lo
    necesario: el tiempo libre (rellenos), el callejeo de un bloque (un barrio, a la mitad y 20 min como
    mínimo), una sola parada de paso sin grupo. Nunca el orden de un bloque ni su parada principal.
166. **Ancla ya vista, de paso**: si el ancla de una tarde ya se vio un día anterior y se ve desde la
    calle, la tarde vale igual con el ancla de paso, siempre que traiga al menos dos paradas nuevas
    (`centro_barroco` con el Panteón ya visto). Si el ancla no se ve desde la calle, la tarde no va; si
    es de la mañana de un día posterior, tampoco (se llevaría lo de alrededor: Navona). Lo que hoy es de
    paso y tiene su visita en la mañana de otro día no cuenta como visto.
167. **Reparación a dos niveles**: si quitar un bloque solo mueve el día muerto a otro día, se prueba
    también a quitar el bloque que lo deja muerto allí; y si la tarde lleva su ancla de paso, el bloque
    del día que la enseñó.
168. **Lo de paso de un grupo no se cae primero**: si es del grupo de otra parada del bloque (Plaza
    Venecia con el Altar), se cae como una parada, no como lo de paso.
169. **Ritmo tranquilo, nunca antes de las 10:00**, salvo si un imprescindible de nivel 1 se queda fuera
    del día entero, ni siquiera de paso (no una joya ni un nivel 2-3); entonces a las 08:00, con aviso
    (madrugar lo justo, a las 09:00 o 09:30, descolocaba el resto del día). Que un nivel 1 pase a después
    de comer el mismo día NO es perderlo: va entero y en su orden antes de la tarde (el Foro tras el
    Coliseo y la comida; la Plaza y la Basílica tras los Museos; Navona tras el Panteón), con la comida en
    su ventana normal. Lo demás que no llega va de paso o a "No te dio tiempo" (`notEnoughTime`).
    La reparación del viaje también puede madrugar un día (`madruga:<día>:<nombres>`) si un imprescindible
    se queda fuera de todo el viaje por ese nivel 1 de después de comer, y solo si madrugar lo devuelve
    de verdad a la mañana. Lo de la mañana del bloque vuelve a ser de la mañana en cada programación (la
    marca "tarde" de una programación anterior no se arrastra). El aviso nombra lo que se recupera,
    sea de la mañana o de la tarde, y si además se acorta la comida, dice las dos cosas.
170. **Nocturnas**: en 3+ días, un lugar visto de día no es nocturna ese mismo día; en 1-2 días, solo si
    esa noche no hay otra nocturna posible.
171. **Comida acortada solo si hace falta**: con el día ya montado (y después del rescate), se prueba la
    comida normal, tal cual y quitando rellenos; si la parada sigue cabiendo, la comida vuelve a su
    duración.
172. **Traslados largos (más de 25 min andando) no son un fallo, pero se dicen**, cada uno con su tramo
    real (lo de paso metido por el rescate incluido): andando primero y luego la alternativa; con cuesta
    (`uphill` del lugar), "(con cuesta) · o el bus 115 si prefieres no subirla". Sin dato, "bus o taxi".
173. **Lo mejor primero** (semáforo, `primero`): en 2 días, las 4 joyas dentro de los 2 días; en 3+ días,
    como muy tarde el día 3 y ninguna solo el último día del viaje. Solo se comprueba: el reparto de
    mañanas aún no lo busca.
174. **Tiempo libre sin sugerencias**: una idea corta de la zona (el paseo de `zone_walks`, en una
    frase), sin más paradas: la espera al atardecer del Pincio con todo visto.
175. **Tranquilo = la ruta completa con menos cosas** (decisión del 2026-09-26): mismos bloques, orden y
    duraciones de visita (sin `visitDurationBonus`); empieza a las 10:00, come 90 min y cena a la misma
    hora que completo (la cena dura 60 en los dos: `dinnerMinutes`). Para que quepa, se cae en este orden:
    los rellenos, el nivel 3, el nivel 2 y lo de paso (`dropByLevel`); nunca un nivel 1 ni una joya.
    Si un nivel 1 se queda fuera del día, se empieza antes lo justo (de media en media hora), con aviso.
176. **Lo mejor primero, aplicado**: en viajes de 3+ días, una tarde de un día temprano (hasta el 3, y no
    el último) puede traer una joya que si no saldría tarde aunque su mañana vaya otro día (el centro
    barroco con el Panteón detrás del Coliseo), siempre que a esa mañana, si no es del último día, le
    queden 3 paradas propias. Una joya que se ve desde la calle y sale tarde (Trevi) entra además de paso
    en un día temprano. La reparación prueba a mover (o quitar) la mañana que deja una joya para el final;
    una joya tardía cuesta 60 (menos que algo del pool o un día muerto). Con Free Tour y 3+ días, el
    Vaticano va por la tarde del día del tour si eso no deja un medio día sin tipo. El Free Tour nunca se
    quita en una reparación: solo se mueve de día.
177. **Comida acortada**: nunca por debajo de 60 min comiendo, y siempre con aviso en el día (si no se
    sabe nombrar lo que salva, "todo lo de hoy"). Un madrugón tampoco va nunca en silencio.
178. **Banner de contexto**: uno solo, con el primer día de ciudad (`context_banner`), elegido y rellenado
    por el motor desde las plantillas de `destination_config.context_banners`: invierno corto, invierno,
    corto, tranquilo. En invierno, "y algún día empieza un poco antes" solo si algún día empieza antes de
    su hora.
179. **Antes de acortar la comida**, fuera las paradas de paso secundarias de la tarde (no nivel 1, sin grupo
    con otra parada), de la última hacia atrás y solo las que hagan falta. La comida solo se acorta si aun así
    un nivel 1 se queda fuera del día.
180. **Un nivel 1 que se ve desde fuera** (`pass_by`: el Altar, desde Piazza Venezia) y no cabe va de paso,
    15 min, en su sitio del recorrido, antes que madrugar, si el desvío es de 10 min como mucho. La
    reparación solo madruga por un imprescindible si entra ese mismo día, y no por uno rescatado de paso de
    camino (10 min o menos).
181. **Joyas y cierres**: si una joya está cerrada todos los días antes de la excursión y abre ese día, la
    excursión pasa al último día cerrado (Pascua: excursión el lunes, Vaticano el día 3). Una joya cerrada
    los primeros días va el primer día que abre si es como muy tarde el día 3, y la reparación no la mueve.
    La reparación de lo mejor primero nunca deja una joya solo de paso (el Coliseo por fuera).
182. **Lo mejor primero, excepciones** (semáforo y revisiones): en 3 días con Free Tour vale una joya el día
    3; una joya que va tarde porque lo del pool ocupa los días de antes no cuenta; ni una joya cerrada todos
    los días posibles.
183. **Aperitivo hasta 120 min antes de cenar** ("Aperitivo y paseo por {barrio}"); por encima, tarde libre.
184. **Ritmo del cuestionario**: 'zen' y 'balanced' son tranquilo (`isTranquiloPace`). Antes solo se miraba
    'tranquilo' y la app mandaba 'zen': todas las rutas tranquilas de la app salían completas.
185. **Rescate de paso de una joya temprana** (`rescueOutside` con `upToDay`): puede quitar varias paradas de
    paso ligeras, no solo una (Trevi el día 1 a las 19:45 en tranquilo 4 días, en vez del día 4).
186. **Mirador del atardecer que llega de noche** (más de 30 min después de la puesta de sol,
    `MIRADOR_LATE_MINUTES`): se adelanta quitando lo de paso secundario de delante, sin romper el orden del
    bloque (lo que sobra pasa a aperitivo o tiempo libre); si no llega, `night_view` con el texto
    `destination_config.night_view_text`. Se aplica SOLO al plan ya elegido (`settleMiradores`, al final de
    `planBlockTrip`): dentro de cada intento cambiaba el coste y 4 días en diciembre perdía la Galería Borghese.
187. **Zigzag con un nivel 1 de paso**: el límite de desvío es 1 km (0,4 km para el resto).
188. **Pascua, 4 días con Free Tour**: una joya el día 4 vale si alguna joya está cerrada los dos primeros días
    (excepción de "lo mejor primero", decisión del 2026-09-26).

**Cierre de Roma (10 arreglos, 2026-09-26)**
189. **Último día sin repetir**: un bloque con `evita_si_ya_salieron` (centro_temprano, bernini_trevi: Trevi, Panteón
    y Navona) no va si todo eso ya salió; una joya de calle cuenta como salida si ese día ya es tarde para ella (lo
    mejor primero la saca de paso antes). La mañana repetida, la que ya no tiene su ancla o el día sin mañana se
    cambian por la mejor mañana o tarde sin atardecer que aún no haya salido (`replacementMorning`: experiencias,
    imprescindibles nuevos, pool; sin `minimo_dias_viaje`). Si ninguna tarde encaja, antes de improvisar se prueba
    cualquier tarde no usada (`relaxed`).
190. **Como mucho 2 veces por viaje** (visita, de paso o de noche): las nocturnas no salen si el lugar ya sale 2 veces.
191. **Pool siempre y con visita**: nunca va de paso (`scheduleBlock` no lo convierte; el ajuste de miradores no lo
    quita); si de camino no cabe, fuera lo de paso secundario del día y luego hasta 40 min de desvío; la tarde que lo
    trae vale aunque no encaje si ningún día posterior puede llevarlo (`poolNeedsNow`).
192. **Día y noche**: en 3+ días nunca el mismo día, tampoco de paso (`daysOf` guarda TODOS los días de cada lugar).
    En 1-2 días, la visita de día desde las 17:00 o el atardecer se quita y queda la nocturna (`replacesDayVisit`),
    salvo la que justifica el madrugón. Tranquilo: una nocturna por noche.
193. **Madrugón**: solo si por él se VISITA (no de paso) un imprescindible que si no no se visitaba; el aviso nombra
    eso (el Foro que cierra pronto). Una joya no se ve "por fuera en vez de madrugar" (`outsideInsteadOfWaking`).
194. **Huecos**: dentro de un bloque curado se encadena hasta 10 min andando y dentro de un grupo del JSON hasta 15 (Coliseo
    → Foro). Todo hueco de más de 30 min sale como tiempo libre con sugerencias (`free_times`, también antes y
    después de comer); la mañana que acaba 60+ min antes de comer se rellena de camino (`fillBeforeLunch`).
195. **Free Tour**: siempre el día 1 por la mañana (también con pool; la reparación no lo mueve) y la tarde de ese día
    no lleva nada de lo que enseña el tour, ni de paso. Lo de paso de una tarde que se visita en la mañana de un día
    posterior no se adelanta.
196. **Aventino** (`aventino_testaccio`): Boca → Circo Máximo → Naranjos → Cerradura → Pirámide y Cementerio → Mercado
    de Testaccio con `solo_si_abierto` (si a esa hora está cerrado no entra, ni de paso).
197. **Miradores**: el tiempo libre va antes del mirador del atardecer (la espera que solo mueve el rato de antes de
    cenar no cuesta; con horas por delante, relleno con 25 min de desvío). Si la tarde lleva el mirador al atardecer,
    lo que la mañana ponía desde él (Pincio, Popolo) pasa a la tarde.
198. **Cerrados**: un nivel 1 nunca desaparece; si no cabe de ninguna forma, por fuera (`force`, puede quitar hasta dos
    paradas de nivel 2-3 o un mirador que no es nivel 1), con `closed_notice` ("El Coliseo está cerrado el 25 de
    diciembre por Navidad: te lo enseñamos por fuera…"). Lo que no se ve por fuera (los Museos Vaticanos) y cierra todo
    el viaje: su bloque va sin él, con la Plaza y la Basílica y el aviso. Dos joyas con un único día bueno: ese día es
    para la que no se ve por fuera. Se prefiere el día en que abren todos los imprescindibles de la mañana. Un
    imprescindible que no entra de día se queda con su nocturna (`mustNight`). Plantillas y festivos en
    `destination_config.closed_notices`.
199. **Artículos**: `placeWithArticle` pone el artículo por la primera palabra del nombre ("la Basílica de San Pedro").

**Checklist del Paso 7 (añadidos)**
- Cada experiencia elegida añade entre su mínimo y su máximo, sin contar imprescindibles.
- Ningún relleno arrastra un contenedor de pago.
- Ninguna nocturna a más de 15 min de donde se cena.
- Ningún hueco de 60 min o más entre visitas sin su bloque "Tiempo libre".


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
5. **Estaciones** (PROMPT_ESTACIONES.md):
   - Horarios por periodo: rellenar `docs/kit/plantilla_horarios_por_periodo.json` (`by_period`,
     `closed_dates`, `confianza`, `fuente`, `_nota`, `fecha_auditoria`) e importarla con
     `node scripts/destino/importarPeriodos.mjs <destino> <fichero>`. `validar.mjs` avisa si los
     periodos no cubren los 366 días o se solapan, y (con `--anio`) si la auditoría es de otro año.
   - Puesta de sol: no se cura. Sale de `timezone` y del centro de la primera zona; `validar.mjs` marca
     en rojo un destino sin ellos.
   - Temporada: `available` en lugares, nocturnas y excursiones, y
     `destination_config.experience_availability` para experiencias (`docs/kit/plantilla_temporada.json`).
     Solo con fuente; `validar.mjs` marca en rojo una fecha mal escrita.
   - Semáforo por meses: `--mes 1`, `--mes 4`, `--mes 7`, `--mes 10`, y con `--fecha` en los dos
     cambios de hora del año.

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
