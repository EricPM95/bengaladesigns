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

**Días curados (docs/DIAS_CURADOS_ROMA.md, 2026-09-26)** — `shared/routeEngine/curatedTrip.js`, detrás de la
bandera `ROUTE_V3_PLANNER` (por defecto `dias`; `bloques` vuelve al planificador de mañanas y tardes).
200. **El día es la unidad**: `curated_days` del JSON (D1, D2, D3, D1-FT, D4-D7). El motor elige los días
    (`curated_selection`: por días de ciudad, Free Tour, tercer día por experiencia, pool), los ordena (probando todos
    los órdenes: `no_en` y lo del pool cerrado ese día pesan 1000; joyas tarde o solo el último día, 100; luego el
    orden por defecto) y aplica la variante que toca sin inventar otra: tarde B, invierno (atardecer antes de las
    18:00), Free Tour, tranquilo (y tranquilo_invierno), el día de la semana (y tranquilo_<día>; el domingo de D2
    solo si no hubo remedio) y las de pool de D1.
201. **Paradas**: `solo` (ritmo, experiencia, pool, días del viaje, estación; varias = basta una); lo del pool va
    siempre. Tope de museos de pago (💶, `pago`): `curated_selection.museos_de_pago`, sin contar el pool, quitando en
    su orden. `hora` = como pronto a esa hora; `no_calle`, `aviso` y `nota` pasan a la parada.
202. **Horas**: el programador de siempre con el orden fijo; comida en los restaurantes del día y cena en su barrio.
    Tranquilo madruga solo si así se VISITA un nivel 1; comida corta como último recurso. Lo cerrado: el nivel 1 por
    fuera (`pass_by`, con aviso), lo que se ve desde la calle de paso, el resto se salta (y su grupo lo ve por fuera);
    la joya cerrada sin vista por fuera, con el aviso del día (`closedAnchors`). El mirador que no llega a su
    atardecer va en su sitio como vistas de Roma iluminada.
203. **Pool que ningún día trae**: al día con la parada más cercana, detrás de ella, con visita; se puede quitar la
    parada de menos nivel que no sea nivel 1, y solo vale si todo lo demás del día se sigue visitando. Si no, "No te
    dio tiempo" con su motivo (fuera de temporada, cerrado o sin sitio).
204. **Noches**: cada día su paseo (`night_walks`), entero (antes de cenar solo si cabe todo), con nombre y texto.
    Tope de 2 veces por lugar, nunca de día y de noche el mismo día en 3+ días (salvo `excepcion_mismo_dia`: la
    escalinata de D4), `quitar_si_va` (D1 sin la Plaza de España si va D4), 1 en tranquilo; si ninguna vale, las
    alternativas o la nocturna más cercana a la cena.
205. **Experiencia sin día** (mercadillos de Navidad): lo suyo en temporada, junto a la parada más cercana a 10 min
    como mucho, sin que se caiga nada.
206. **Días curados v3** (DIAS_CURADOS_ROMA.md v3): variantes en orden tarde A/B → con_d5 → invierno → tranquilo
    (+ tranquilo_invierno) → con_free_tour (después del ritmo: con tour, D4 da la vuelta al día) → día de la semana →
    `si_cerrado` (D2 "Museos cerrados") → pool de D1 → tarde_b_san_clemente → sin_caracalla. La tarde A o B de D5 se
    decide con el viaje entero (lo de `si_salen_en_otro_dia` en otro día o en el Free Tour); el tope de museos que
    quita Caracalla vuelve a resolver el día (mañana sin Caracalla).
207. **Banderas de parada**: `estirar` (Trastevere crece en tramos de 15 min hasta el atardecer sin perder visitas),
    `si_abre` (fuera si está cerrada o hay que esperar más de 30 min: Santa Cecilia), `si_cerrado: 'de_paso'` (el
    Tempietto cerrado se ve de paso, también cuando lo cierra el estirar).
208. **Orden de los días**: solo evita cierres de lo que el día lleva de verdad (`no_en` con `si_lleva`: D5 en lunes
    solo si lleva Caracalla). Una joya cerrada ese día cuesta 300 si se ve por fuera y 2000 si no (los Museos el 25
    de diciembre o el 1 de enero mueven D2 a otro día).
209. **Madrugón**: con `keepOrder`, la visita que sigue a otra del mismo grupo del JSON cuenta como en curso
    (Coliseo → Foro), y la comida puede irse a las 14:00 en vez de madrugar.
210. **Pool general**: `nunca_en` (San Clemente nunca en la mañana de D5); con D5 en tarde B, San Clemente va ahí.
211. **Noche de 2 días**: los imprescindibles del centro que no salen de día van al paseo "centro iluminado"
    (`centro_dos_dias`, hasta 4).
212. **Revisión (sección 6)**: en completo, tiempo libre de más de 90 min en rojo salvo antes de un atardecer de
    verano; una joya vista de noche cuenta como vista ese día (revisión y semáforo).
213. **Días curados v4** (DIAS_CURADOS_ROMA.md v4). D4: "Desayuno romano" es una parada con nombre
    (`curated_breaks`, fuera de `places`), Santa Maria del Popolo con `antes_de: '12:00'` (`latest_end`: nunca se
    pasa a la tarde; se entra nada más llegar a la plaza) y la Galería en el turno de las 15:00, o en invierno en el
    de las 13:00 con comida a las 12:00 (`comida.hora`/`bloque`, solo `si_lleva` la Galería). El domingo sigue siendo
    la excepción: la iglesia solo abre de 16:30 a 18:00.
214. **Tarde B de D5**: la ruta completa de las basílicas (San Clemente → Letrán → Santa María la Mayor → San Pietro
    in Vincoli → Monti), con o sin San Clemente en el pool. El metro hasta San Clemente cuenta como 20 min
    (`traslado_min`), y la comida se adelanta a las 12:30 (`comida.temprana`) solo si así no se pierde nada.
215. **Tercer día con Free Tour y sin Galería** (ni pool ni Arte): D5; en 4+ días, D5 antes que D4.
216. **Navidad** (D1 el 25 de diciembre o el 1 de enero, `si_fecha`): desde las 10:00, el Coliseo y el Foro por
    fuera (la `hora` vale aunque la parada vaya por fuera por cierre). El 25, la bendición Urbi et Orbi a las 12:00
    (`fija`, parada con nombre) y la tarde desde el Vaticano. El 1 de enero, el Ghetto antes de comer.
217. **El Altar de la Patria de paso** va en la mañana de D1 tranquilo (detrás del Foro), así ninguna variante de
    tarde lo quita. La comida acortada como último recurso vale también para no perder un lugar del pool.
218. **Pool en 2 días con Free Tour**: el primer lugar cambia la tarde de D1-FT (Caracalla: Circo Máximo → Caracalla
    → Boca de la Verdad → Naranjos); el segundo va a "No te dio tiempo" con el motivo (`pool_afternoon_taken`). El
    mirador del atardecer que a esa hora ya cerró (Naranjos en otoño) se visita mientras está abierto.
219. **pool_caracalla de D1-FT**: si los Naranjos cierran antes del atardecer (`solo.cierra_antes_del_atardecer`),
    después va el Ojo de la Cerradura y se baja por el Ponte Sublicio a Trastevere: aperitivo y cena en el barrio.
220. **Tarde A de D5 solo si ni el Campidoglio ni el Ghetto salen en otro día del viaje**; si sale alguno, tarde B.
221. **D4 sin Galería solo con el atardecer después de las 18:00**: en invierno sin Galería (ni pool ni Arte), el
    tercer día es D5 (y en 4+ días, D5 antes que D4).
222. **El paseo nocturno antes de cenar no es tiempo libre**: el aperitivo y la tarde libre descuentan su duración
    (DIAS_CURADOS_ROMA.md, 2b: aprovecha el hueco).
223. **Motor por defecto**: en un destino con `curated_days` (Roma), el motor v3 con días curados, también en
    producción sin variables de entorno. Solo lo cambian una petición con `engine`, `ROUTE_ENGINE=viejo` o
    `ROUTE_V3_PLANNER=bloques`.
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
231. **Tabla de rutas** (`curated_routes.por_dias_ciudad`, PROMPT_RUTAS_CURADAS B.1): qué días curados van, por días
    de ciudad (sin la excursión) y con o sin Free Tour. `{con_galeria, sin_galeria}` se decide por el pool o Arte;
    desde 4 días de viaje, siempre con Galería. Sustituye a la regla 221 (D4 sin Galería): en 3 días sin Galería va
    D4M (sin Free Tour) o D5C (con Free Tour).
232. **Cena tardía desde atardeceres a las 20:00** (`LATE_SUNSET_MINUTES`, antes 20:15): con atardeceres de 20:00 a
    20:14 la cena no cabía antes de las 20:30 y el motor tiraba la tarde entera del Vaticano y Trastevere.
233. **Invierno en los días curados con el sol antes de las 18:30** (antes 18:00). Una variante de invierno con
    `atardecer_antes_de` solo se aplica si el sol se pone antes de esa hora (D2: 18:20); `tranquilo_invierno` sigue
    la suya o, si no la trae, la de `invierno`.
235. **La comida flexible, solo por un imprescindible**: en orden curado, una visita de nivel 1 puede alargar la
    mañana hasta las 14:00 (`lunchClose + 30`). Una comida que empieza a las 14:00 o más tarde dura 1 h más el paseo
    (`mealMinutes + 15`). Nunca para meter relleno antes de comer.
236. **La tarde no repite lo de la mañana YA filtrada**: si una parada de la mañana no va ese día (`solo`), la de la
    tarde con el mismo nombre se queda.
237. **Pool con día fijo** (`curated_pool`: `dia` + `despues_de`; `si_viaje_tiene` / `si_no`): su día y detrás de
    su parada (o justo delante si detrás ya no llega). Lo marcado nunca va "de paso" y nunca desaparece en silencio:
    si no cabe, `not_included` con `from_pool` y `day_number`, y la app lo avisa en ese día ("No hemos podido
    incluir X porque…").
238. **Horas redondas** (B2.1): las horas que se enseñan van en :00, :15, :30 o :45. El motor calcula con los minutos
    exactos y el formateador (quarterHourStops) enseña el cuarto de hora MÁS CERCANO de cada llegada (nunca siempre
    hacia arriba). Lo que hay hasta la siguiente parada (paseo, comida, espera) se queda con sus minutos exactos y la
    visita dura lo que cuadra; así la salida más el paseo da la llegada a la siguiente.
239. **"Por el camino" y "Por fuera"** (B2.2-3): lo de paso de acera (calles, plazas, fuentes, ruinas: `type: exterior`)
    sale "Por el camino: …" entre dos paradas, con foto pequeña y ficha. Un monumento (`type: interior`) nunca va por
    el camino: sale "Por fuera" con `outside_reason` ("hoy no toca entrar", "a esta hora ya ha cerrado", "cerrado hoy").
240. **Invierno: paseo iluminado y aperitivo de hasta 2 h** (B3.1): con el sol antes de las 18:00, el rato entre la
    última parada y la cena puede llegar a 120 min. Sale con nombre ("Paseo por Via del Corso y Via Condotti iluminadas
    y aperitivo", de `destination_config.paseo_iluminado` por barrio de cena) y sugerencias abiertas a esa hora, y
    lleva `winter`. En el semáforo y en sweep.mjs es amarillo como mucho; más de 120 min sigue siendo rojo.
241. **El transporte público está permitido** (B3.2), en todos los destinos: si la ruta es natural y la que haría un
    local (el bus 118 a la Via Appia, el metro B a San Clemente, el 115 al Janículo), no es un fallo. Solo cuenta como
    fallo un salto de más de 25 min andando sin su aviso de transporte.
242. **Lo del pool sin su día propio** (San Clemente sin D6): va en la variante de su nombre (`curated_pool.antes`:
    `pool_san_clemente`) de cualquier día que la tenga y no sea el de las variantes de pool (D1/D1-FT); en D5, San
    Clemente en lugar de la Via Appia.
243. **El Altar siempre se entra** (2026-09-27): es un monumento, nunca "por fuera". D1 con la Galería Borghese lo lleva
    al principio de la tarde (30 min, comiendo por los Foros) y de ahí a Trevi; en completo ya va por la mañana y la
    tarde no lo repite. Su taquilla cierra a las 18:45 (`last_entry`): la terraza de noche solo en invierno
    (`solo: {estacion: invierno}`, D5 con San Clemente después del Campidoglio), nunca como atardecer en verano.
244. **El transporte es un tramo propio** (2026-09-27): la parada con `traslado_min` y `traslado` sale con
    `transit` ("🚌 Bus 118, unos 25 min"; 🚇 el metro, 🚊 el tranvía) y no con "57 min andando" ni aviso de traslado.
    Después de comer, la comida acaba al comer y andar a la parada (1 h 15 min) y el trayecto suma a la llegada
    (comida hasta las 14:15 → catacumbas hacia las 14:45).
245. **El mirador que llega de noche es una experiencia nocturna** (2026-09-27): `night_view_title` ("Roma iluminada
    desde el Janículo", de `destination_config.night_view_title` + `night_view_names`), con su texto. En sweep.mjs se
    apunta (`mirador_noche`) pero no es fallo, y la revisión no lo cuenta como raro.
246. **Invierno, más de 2 h antes de cenar** (C.1): lo que pasa de 120 min se queda en el paseo nocturno de antes de
    cenar (la bajada por la escalinata de D4), de 15 en 15 y como mucho 45 min más. Nunca un relleno.
247. **`si_espera`** (D2 en invierno): si antes del atardecer se esperan más de `minutos` (60), la tarde de `si_espera`
    (Trastevere antes del Janículo, que se estira); lo que así llega cerrado y quiere de paso (el Tempietto), de paso.
    Solo si no se pierde nada y el mirador llega a su atardecer.
248. **Avisos de fechas especiales** (PROMPT_AVISO_FECHAS, 2026-09-27): el primer día de ciudad lleva `date_notices`,
    una tarjeta por día `{ id, day_number, date_iso, icon, title, tag, texts, kind }` (server/engine/dateNotices.js).
    Automáticos (lo que el motor YA ha hecho, solo joyas, nivel 1 y pool): día movido (`dateMoves` del planificador:
    lo que otro día del viaje cierra o su `no_en`), por fuera (cerrado ese día y visitado), cerrado todo el viaje,
    horario especial confirmado y la variante del día de la semana con `aviso_fecha`. Curados: `fechas_especiales`
    sin `verificar: true`. El mismo día (o el mismo rango: Navidad) van en una tarjeta: primero lo hecho, luego lo curado.
249. **Regla de oro de los avisos**: primero el dato y al final lo que hemos hecho ("Hemos puesto…", "Hemos movido…"),
    35 palabras como mucho, de tú a tú y sin precios. Vale para las plantillas del motor y para los textos curados.
250. **Sin fechas (solo el mes)**: solo lo de temporada y las fechas fijas de ese mes, con "Si tu viaje coincide con
    …:". Nunca los de día de la semana ni los de Pascua (sin año no se sabe el mes).
251. **Horario especial** (`fechas_especiales[].horario_especial`): solo con `confirmado: true`; el cargador lo pone
    en el lugar (`special_hours`) y va por delante de `last_sunday`, `by_day` y `by_period`, por detrás de los cierres.
252. **`aviso_fecha` en una variante** (`{ icono, etiqueta, texto }`): el aviso de lo que esa variante del día de la
    semana cambia de un imprescindible (la audiencia de los miércoles, el Panteón del sábado). Nunca un aviso genérico
    de "el fin de semana hay más gente".
253. **"Por qué aquí" curado** (PROMPT_AJUSTES_20_RUTAS A.1): cada parada de los días curados y sus variantes lleva
    `por_que` (docs/roma_por_que.json: `por_dia[día][lugar]`, el atardecer del Campidoglio/Pincio con el de D5/D4, si no
    `por_lugar`). La app enseña `por_que` (`why_source: 'curado'`); el texto genérico es solo reserva, y lo que añade el
    pool sin el suyo toma el más habitual de ese lugar. `validar.mjs` avisa de la parada curada sin `por_que`.
254. **La `nota` es interna** (A.2): nunca sale del motor. Al viajero le llegan `por_que` y los avisos (cerrado,
    madrugón, turno: `aviso`, `closed_notice`, `hours_warning`, `pace_notice`).
255. **Sin "gratis" en lo que se lee** (A.3), fuera de la pestaña Tickets (`ticket_info` sigue igual hasta las APIs;
    `pago: true` del motor, también). Ni en la ficha de lugar (los días sin coste ya no van en el horario).
    `validar.mjs` en rojo si aparece.
256. **"Por el camino" dura 10 min como mucho** (B.1): el sobrante del redondeo a cuartos no se mete ahí; se queda
    esperando la hora de la siguiente parada. Lo que merece más (un monumento, la Fontana de Trevi) es una parada.
257. **Dónde acaba el Free Tour** (B.2): `default_free_tour.ends_at` { name, coordinates }, curado por nosotros (si la
    API de actividades lo trae como dato, manda ese). El tramo siguiente sale de ahí (`end_latitude/end_longitude` en la
    parada) y la tarjeta lo dice: "El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona…".
258. **El transporte es del tramo** (B.3): si una parada con `traslado` se salta (cerrada ese día), la siguiente
    hereda su bus o su metro y sale con su "🚌 Bus 118, unos 25 min".
259. **Tope de estirado** (B.4): `estirar_max` en la parada (el Circo Máximo, un prado: 30; la Via Appia: 150). Lo que
    pase va a la otra estirable del día y, si aún sobra, queda como tiempo libre con nombre antes del atardecer (que en
    verano no cuenta como hueco). Sin atardecer en la tarde, lo que pase de 90 min (120 en tranquilo) antes de cenar
    se reparte igual entre las estirables.
260. **`verificar: true` sale, con prudencia** (decisión del usuario, 2026-09-27): el dato exacto cambia cada año, pero
    avisar ya tiene valor. El texto lo dice con cuidado ("es posible que…", "suele…", "compruébalo en la web oficial");
    `validar.mjs` avisa si no. Sustituye a la regla 248 en esto: ya no se esconde ninguna fecha.
261. **Horario especial "probable"** (`horario_especial.confirmado: "probable"`, el 2 de junio): el horario NO se aplica,
    pero el reparto evita poner ese día lo que lleva esos lugares (coste 400: menos que un cierre, más que el orden).
    Con `confirmado: true`, además se aplica el horario (regla 251).
262. **"Gratis" sí, cifras y precios no** (decisión del usuario, 2026-09-27; sustituye a la regla 255): "gratis" se
    puede decir cuando suma, dentro de una frase con valor ("…y la entrada es gratis: una joya que mucha gente se
    salta"), también en la ficha de lugar y en su horario ("Entrada gratuita: …"). Lo prohibido fuera de la pestaña
    Tickets son las cifras y los precios (€, euros, importes): `validar.mjs` los marca en rojo, nunca la palabra
    "gratis". Los campos de precio estructurados (`ticket_info`, `price_range`, `avg_price_person`) son datos, no texto.
263. **Verano, tiempo libre antes del atardecer**: con nombre y hasta 150 min no es hueco (regla 259); de más, sí.
264. **Todo lo que lee el viajero va curado en el JSON del destino** (regla general, decisión del usuario 2026-09-27):
    nunca de una llamada a la API. Si un texto depende de la hora, va como `{ texto, temprano }`: `temprano` solo si la
    parada empieza antes de las 09:30 (`curatedWhyAt`, buildDayV3.js); si no, `texto`. `validar.mjs` avisa del texto
    sin `temprano` que habla de "primera hora", "a la apertura", "sin gente" o de una hora concreta. Plantilla en
    `docs/kit/plantilla_por_que.json`.
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
271. **La parada que se estira también devuelve tiempo**: antes de dar un atardecer por perdido, el callejeo (`estirar`,
    Trastevere) se acorta 15 o 30 min, nunca por debajo de 20. Así cabe lo que va de camino (Via della Conciliazione,
    "Por el camino" en D2 y todas sus variantes, antes del Castillo) sin perder el sol.
272. **Todo monumento es parada, por dentro o por fuera** (decisión del usuario, 2026-09-28; todos los destinos).
    Monumento = nivel 1 o 2 (imprescindibles y muy visitados: edificios, fuentes, plazas, parques). Sale con su propio
    nombre y su acordeón; nunca "Por el camino" ni escondido en otra parada. Los de nivel 3 sí pueden ir por el camino.
    - De exterior (Trevi, Navona, Plaza de España): parada normal; si el día lo ponía de paso, parada corta (15 min).
    - Con interior: por dentro (su tiempo) o por fuera (`minutos_fuera` y su `por_fuera`, `visit_mode: 'fuera'`).
      Por fuera, en este orden: cerrado ese día ("Hoy cierra") o a esa hora ("A esta hora ya ha cerrado"); museo de pago
      que no cabe por el tope de museos de pago, por su `solo` o por tiempo, y no elegido en el pool ("Hoy lo ves por
      fuera para llegar a todo lo del día"); si no, por dentro. Sin `minutos_fuera` no hay nada que ver por fuera: no
      sale y va a "No te dio tiempo".
    - `visible_from_outside` ya no existe: se deduce de tener `minutos_fuera`. El kit pide `minutos_fuera` y `por_fuera`
      (docs/kit/plantilla_por_fuera.json) y `validar.mjs` lista los de interior sin él.
    - Lo que se visita por dentro va como `type: interior` aunque la entrada sea libre (eso lo dice `is_free_access` /
      `ticket_info`): San Luigi, el Gesù, Santa Maria in Trastevere, Santa Maria sopra Minerva, San Ignacio.
273. **Primero la plaza o el puente, luego el monumento** (decisión del usuario, 2026-09-28): dentro de un grupo, el
    orden de `group_order` (Puente Sant'Angelo 1 → Castillo 2; Plaza Venecia 1 → Altar 2; Plaza de San Pedro →
    Basílica). Excepciones: el monumento con hora fija en su día curado (el Coliseo a la apertura, antes que el Arco) y
    la plaza o el puente que es el sitio del atardecer o de la noche (D7: el Castillo a las 17:30 y el Puente al
    atardecer). `textChecks.mjs` (`gruposFueraDeOrden` en los datos, `grupoFueraDeOrdenEnDia` en las rutas); lo que se
    ve desde su compañero también va en ese orden.
274. **D2: Via della Conciliazione → Puente Sant'Angelo → Castillo** en todas sus variantes (en invierno, sin Borgo Pio:
    va en paralelo a la Conciliazione); **D1 y D1-FT: Plaza del Campidoglio → Plaza Venecia (de paso) → Altar (45 min)**.
    Si el programador quita algo para llegar al sol, la parada que se estira (Trastevere) devuelve 15 o 30 min antes
    (nunca por debajo de 20); y la tarde de `si_espera` convierte a "por fuera" lo de pago igual que la de siempre.
275. **"Quiero entrar"** (decisión del usuario, 2026-09-28): una parada por fuera porque no cabe (`outside_kind:
    'no_cabe'`; nunca si está cerrada) lleva un interruptor. `/api/curated-day-inside` rehace ese día curado con la
    parada por dentro y obligatoria (`insideNames`: como si estuviera en el pool, sin sus reglas; no cambia paradas ni
    orden, solo recoloca horas) y lo compara con el de antes (server/engine/insideSwitch.js). El tiempo sale de lo
    estirable y de lo de menos nivel (pasa a por fuera o sale); la comida y la cena nunca se acortan, solo se mueven en
    su franja. Si se pierde un imprescindible o el atardecer, se pregunta ("Para entrar hay que quitar el Janículo.
    ¿Lo cambiamos?"). Antes de guardar, una línea con lo que cambia y "Vale" / "Mejor no". La ruta guarda
    `insideNames`.
276. **Sin fechas = días normales, nunca festivos** (decisión del usuario, 2026-09-28). Sin fechas el motor usa el día
    15 del mes solo para el atardecer y el horario de temporada (`by_season`/`by_period`): ni `closed_dates`, ni
    cierres por día de la semana (`weekday` es null), ni `last_sunday`, ni `special_hours` de `fechas_especiales`, ni
    las reglas con fecha de los días curados (`no_en.fecha`, `cuando.fecha`, `si_fecha`). En curatedTrip todo pasa por
    `realDateIso(day)` (null sin fechas); en openingHours `specialHoursOn` recibe la fecha solo si hay `weekday`. Lo
    único del mes que sale sin fechas es la ventana de avisos "Si tu viaje coincide con…" (sin etiqueta en ningún día y sin
    la última frase "Hemos ajustado / puesto…" del texto curado, que sin fechas no es verdad).
    Al poner fechas desde el botón del mapa, la ruta se rehace como en el formulario y sale la ventana de avisos; si el
    viajero la había editado a mano, antes se pregunta ("Vamos a ajustar tu ruta a estas fechas y algunos días pueden
    cambiar. ¿Seguimos?"): con "Mejor no" (decisión del 2026-09-28) se guardan las fechas y la ruta se queda
    exactamente igual, sin ventana ni avisos ni etiquetas. Solo el dato de cada parada: las que cierran ese día (cierre
    semanal o festivo, /api/kept-route-closures) llevan "Hoy cierra" en rojo en su línea de horario.
277. **D2 no va en miércoles de invierno si el viaje tiene otro día para él** (decisión del usuario, 2026-09-28). En
    `no_en`, una regla con `evitar: true` (y `invierno: true`: solo con el sol antes de WINTER_SUNSET_BEFORE) no prohíbe
    el día: suma EVITAR_COST (300) al reparto, así que D2 se mueve si hay otro día sin cierres y, si no lo hay, se
    queda. No genera aviso de fecha. Si se queda, el Janículo llega de noche y sale como mirador nocturno ("Roma
    iluminada desde el Janículo", `night_view_text`): se vende como experiencia de noche, nunca como un atardecer
    perdido.
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
280. **Datos que caducan llevan `comprobado: "AAAA-MM-DD"`** (decisión del usuario, 2026-09-28): las fechas especiales con
    `verificar`, todo objeto con `cifra_ok` (textos de los días, por_que_lugares, paseos, fichas), los lugares con
    horario por temporada (`by_season` / `by_period`) y los restaurantes curados. Roma: 2026-09-28 en todo (se revisó
    en septiembre); también en docs/roma_por_que.json y docs/roma_fechas_especiales.json, para que no se pierda al
    volver a aplicarlos. validar.mjs (sección 13) avisa en amarillo de lo que no tiene fecha o la tiene de hace más de
    11 meses; `node scripts/destino/comprobado.mjs` saca la lista por destino, y es lo que usa la revisión automática de
    cada 1 de diciembre. Las plantillas del kit piden el campo (`_comprobado`).
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
290. **Revisión "como un local" (decisión del usuario, 2026-09-28), con reglas generales:**
    - El tiempo libre de antes de cenar acaba cuando hay que salir hacia la cena (con las horas ya redondeadas), y una
      nocturna antes de cenar dura 25 min como mucho (la Plaza de España de 60 min era demasiado).
    - Un mirador del atardecer que llega después del sol ya es de noche ("Roma iluminada desde el Pincio"), sin 🌅
      (`MIRADOR_LATE_MINUTES = 0`). Si con el orden normal el mirador llega tarde, se prueba el orden de invierno
      (el mirador primero), sin depender solo de `atardecer_antes_de`; y si así queda más de una hora de espera antes
      del sol, el monumento que iba por fuera por tiempo (el Castillo) va por dentro. `si_espera` solo vale si llega al
      sol de verdad.
    - Castillo/Puente → Janículo: el bus 115 o el 870 desde Via Paola (comprobado en ATAC). La revisión cuenta un tramo
      de más de 25 min como largo si la parada no lleva línea (un aviso "o en bus o taxi" no es transporte).
    - La cena empieza en el cuarto de hora siguiente a llegar a su barrio, dentro de su franja; la de verano solo alarga
      la franja por arriba.
    - Órdenes nuevos de los días curados: D4 en invierno (Galería → Parque → Pincio al atardecer → Santa Maria del
      Popolo), D4 en domingo (Parque sin estirar; Santa Maria del Popolo antes del Pincio, en invierno después), D4 con
      Free Tour (Santa Maria della Vittoria a las 9:00 → Tritón → Parque → Galería a las 11:00 fija → comida 13:15 →
      Popolo → Pincio), D4 tranquilo en invierno (Plaza de España 10:00 → Galería 11:00 → Parque → comida 13:30 →
      Pincio → Santa Maria del Popolo), D1 tranquilo en sábado y en invierno (Plaza Venecia → Altar → Campidoglio al
      atardecer), D1-FT tranquilo come junto a los Foros, D5 con la Isla Tiberina y el Teatro de Marcelo de camino al
      Campidoglio, D4M tranquilo con el Pincio de parada. `insertar` admite `despues_de` y `estacion`; `sin_estirar`.
291. **Auditoría automática siempre** (decisión del usuario, 2026-09-28), para todos los destinos:
    scripts/destino/auditoria.mjs (`auditarViaje`), usada por la revisión (con la lista de casos: ruta, día, hora,
    parada) y por el barrido (tipos `audit_*`). Comprueba: lugar repetido el mismo día u otro día (salvo nocturnas y
    revisitas); pool fuera; parada fuera de su horario real de ese día; mirador después del sol o texto de atardecer de
    noche; tramo de más de 25 min andando sin línea en la parada; hueco de más de 30 min sin nada; tiempo libre de más
    de 60 min (en verano, antes del atardecer, hasta 150: decisión del 2026-09-27); tiempo libre que pisa la comida o
    la cena; cena que espera más de 20 min sin motivo; zigzag (volver a menos de 300 m de una parada tras alejarse más
    de 1,2 km, salvo junto al mirador del atardecer, que es a propósito); nivel 1-2 "Por el camino" o como idea de
    tiempo libre (el motor ya no los sugiere como ideas); imprescindible de menos de 20 min; por fuera distinto de su
    `minutos_fuera`; avisos que prometen lo que la ruta no hace, que nombran un lugar que no está en el viaje o que se
    repiten; títulos con hora. Las horas de la app van al cuarto de hora: la auditoría da 7 min de margen. Los días
    libres del viajero no se revisan. La revisión solo sale con todo a 0 o con la lista de lo que no se ha podido
    arreglar y por qué (docs/INFORME_ULTIMO.md).
292. **Retocar la ruta** (decisión del usuario, 2026-09-28, general para cualquier destino):
    - Añadir una parada (en un hueco o al final): solo se calcula el paseo con la anterior y la siguiente; NO se
      mueven las horas de las demás ni se reoptimiza el día. Si algo se pisa, se ve. Hora sugerida: cuando acaba la
      anterior más el paseo, redondeada al cuarto de hora (con menos de 3 min andando, encadenada sin redondear). En
      los días nuestros no hay "Sin hora".
    - Quitar una parada o cambiar la hora de cualquiera: solo cambia esa; se recalcula el paseo con la anterior y la
      siguiente (`withLegToNext` ya no empuja nada; `pushOverlapsForward` ya no se usa al añadir ni al cambiar hora).
    - "Volver a la ruta original": solo en un día nuestro con algún cambio. `DayPlan.originalSnapshot` guarda el día
      exacto que dio el motor antes del primer cambio (se guarda con el viaje); recuperarlo no regenera. Aviso antes:
      "Vuelves a la ruta que te propusimos. Perderás los cambios que has hecho en este día."
    - Regenerar un día ("Quiero entrar", "Regenerar día") o el viaje (fechas) con cambios del viajero: aviso antes,
      "Perderás los cambios que hiciste en el día 2". Lo nuevo pasa a ser la ruta original.
    - Días libres ("lo organizo yo", `dayType: 'manual'`): el motor no los toca nunca, ni al rehacer el viaje (se
      quedan en su número de día); el semáforo, la auditoría y el barrido no los revisan. Primera parada a las 09:30 o
      "Sin hora" (`DayPlan.untimed`: paradas en orden con el paseo entre ellas).
    - Los restaurantes no entran como parada. Pendiente (no se hace todavía): la pantalla de "día libre" después del
      formulario y el botón "+" para añadir un día.
293. **Nota de temporada** (decisión del usuario, 2026-09-28, general para todos los destinos; sustituye a cualquier
    "aviso de invierno"): no es un aviso de cuidado, cuenta que la ruta está pensada para su época. Una vez, arriba de
    la ruta (encima del Día 1), con el efecto de temporada del formulario (SEASON_FX) y con X; no es ventana emergente
    (SeasonNote.tsx, `Route.seasonNote`). Textos por época en `destination_config.nota_temporada` (server/engine/
    seasonNote.js); sin textos, el de reserva del kit ("Tu ruta está pensada para disfrutar {destino} en {época}",
    docs/kit/plantilla_nota_temporada.json). Época: la de los horarios (`by_period`): con el sol antes de las 17:30
    es invierno (en Roma, de finales de octubre a febrero); si no, la del mes. {hora_atardecer}: la real, al cuarto de
    hora. Solo promete lo que se cumple: "y veas Roma iluminada" si alguna noche lleva nocturna (si no, "para que
    llegues a todo"); en verano "a primera hora de la mañana" si la mayoría de los días empieza por un imprescindible
    antes de las 10:00 (si no, "para que la disfrutes sin agobios"). Sin fechas: "Si viajas en {mes}, …". Si un aviso
    de fechas de temporada ya lo dice, sale uno; y si sale la nota, el banner de invierno no. La auditoría lo comprueba
    ("Nota de temporada que promete algo que la ruta no hace") y la revisión pone la nota de cada viaje.
294. **Santa Maria del Popolo en D4, por la hora del sol** (2026-09-28): abre de 16:00 a 18:00 (el domingo, desde las
    16:30). Con el sol antes de las 17:00 va después del Pincio; si no, antes (`sol_antes_de` / `sol_despues_de`, en
    `solo` y en `insertar`). La espera antes de una parada que abre más tarde se queda en la estirable que va justo
    antes (el Parque), de 15 en 15 min y sin que se caiga nada; `sin_estirar` solo si hace falta (sin Free Tour y con
    el sol después de las 17:00).
295. **Revisitas marcadas** (decisión del usuario, 2026-09-28): un lugar puede repetirse otro día solo si es una
    revisita marcada, a otra hora y con su texto de revisita: la parada del día curado lleva `revisita` ("Ya estuviste
    el Día {dia}, pero al atardecer es otro sitio…", el Campidoglio de D5; también en docs/roma_por_que.json,
    `revisitas`). Si el viaje ya lo vio otro día, sale como revisita (`is_revisit`, `revisit_reason`); si no, visita
    normal. La auditoría no cuenta las revisitas marcadas como repetidas.
296. **Lugares nuevos de Roma** (2026-09-28): Trinità dei Monti (nivel 2, interior gratis, 15 min dentro y 10 por fuera,
    horario oficial de trinitadeimonti.net con `comprobado`), Via Veneto, Via del Babuino y Via Margutta (calles, de paso,
    10 min como mucho). Coordenadas contrastadas con Wikipedia en validar.mjs. D4 con Free Tour: Santa Maria della
    Vittoria → Tritón → Via Veneto → Parque → Galería 11:00 … Pincio → Via Margutta → Via del Babuino → Plaza de España
    iluminada. D4 tranquilo en invierno: Plaza de España → Trinità dei Monti (desde la balaustrada, para llegar al turno
    de las 11:00 de la Galería: en tranquilo el día no empieza antes de las 10:00).
297. **Tardes de verano en D4** (decisión del usuario, 2026-09-28): hasta 2,5 h antes del atardecer se aceptan, pero
    no como tiempo libre suelto: el Parque de Villa Borghese se estira con nombre y texto (`estirar_titulo` /
    `estirar_texto` en la parada estirable: "Tiempo libre en Villa Borghese" · "Barca en el lago, bici o un rato a la
    sombra antes de subir al Pincio para el atardecer."). Sale así cuando se estira 45 min o más sobre su tiempo
    (`display_title`, que la app pinta como el nombre).
298. **Huecos por un cierre** (decisión del usuario, 2026-09-28, regla general): si un cierre deja un hueco de más de
    90 min antes del sol, primero entran paradas de nivel 2-3 de camino, en la misma zona (a 700 m del mirador como
    mucho, de la más lejana a la más cercana: el lunes de octubre en D2, con el Castillo cerrado, se sube al Janículo
    por el Tempietto y la Fontana dell'Acqua Paola, y el bus pasa a la primera de la subida); después se estira lo
    estirable hasta su `estirar_max`; y solo entonces sale tiempo libre con nombre. (Si aún sobra más de una hora y hay
    un monumento por fuera por tiempo, ese va por dentro.)
299. **Condiciones de día en las paradas curadas**: `no_si_dia` (una lista o un día) quita la parada si el viaje lleva
    ese otro día (la Isla Tiberina y el Altar de D5, que ya salen en D1 o D1-FT); `si_dia` la pone solo si lo lleva (la
    Columna y los Mercados de Trajano en D5 en invierno, de camino a Monti, cuando el Altar ya salió).
300. **Repaso "como un local" de las 20 rutas, Parte A** (decisión del usuario, 2026-09-28), reglas generales:
    - Noche con nocturna a hora fija (la Girandola el 29/6): ese día va uno que cene a 15 min o menos (en Roma, D1);
      la nocturna sale con su nombre y su texto (`sugerencia.nombre` / `texto`); la nota con "hora a confirmar" es interna.
    - La nocturna no repite lo que ya salió ese día (sin `excepcion_mismo_dia`); la escalinata vista por la mañana deja
      paso al centro iluminado, siempre después de cenar (`alternativas_despues_de_cenar`); en invierno, antes de cenar,
      el rato con nombre (`destination_config.aperitivo_invierno`: luces de Navidad en diciembre, compras el resto,
      paseo con luces el 25; y si ya se vio lo que nombra, otro título). La "Tarde libre" de invierno sale igual.
    - "Lo que quedó fuera": nunca lo que la ruta pasa ese día (visitado, de paso, nocturno, el barrio de la cena o su
      compañero de grupo); si fue un cierre, el motivo es el cierre ("Cierra el 25 de diciembre").
    - Todo monumento con `minutos_fuera` sale siempre, aunque sea gratis; por horario, "A esta hora no abre"
      (`outside_kind: 'no_abre'`, en rojo). Piazza del Popolo → Santa Maria del Popolo (grupo `popolo`); el rescate de
      una sugerencia no quita lo que tiene su compañero de grupo en el día.
    - Atardecer: la parada empieza unos 25 min antes del sol (`SUNSET_WINDOW.idealFrom`; un paseo como la avenida de
      los Foros, `atardecer_desde`) y acaba 15 min después (`stayAfter`); lo de detrás se recoloca.
    - La parada de barrio de antes de cenar (Trastevere, Monti, Campo de' Fiori; `estirar` o `aperitivo`) se estira hasta
      la hora de salir a cenar.
    - Turnos (`turnos` en el lugar: la Galería cada hora de 9:00 a 17:00): si antes queda más de media hora, el turno
      anterior que no deja hueco. `si_da_tiempo`: la parada sale si por ella se pierde una a hora fija.
    - El monumento que el motor pasa a por dentro para llenar la espera se estira; si un cierre deja más de 90 min, antes
      entran paradas de camino. D1-FT tiene orden de invierno (subir primero al Janículo).
    - Datos: la Cúpula antes que la Basílica (45 min); Trevi a las 8:30 y desayuno de 25 min (D4, D4M); D3 con Trinità dei
      Monti si da tiempo; D5C sin Letrán, San Clemente a las 14:00 ("para bajar hay que reservar online") y Monti después
      de los Foros; D4 con Free Tour: Babuino → Margutta → Popolo → Santa Maria del Popolo → Parque → Pincio; el domingo de
      verano, Santa Maria del Popolo justo después de la Galería; Santa Maria del Popolo después del Pincio solo con el sol
      antes de las 17:30.
    - Fechas: el primer domingo de mes (`fecha: primer_domingo`, `requiere_lugares`: solo si ese día va el Coliseo); en
      Navidad y Ferragosto, "Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena."
    - En la app, si a lo siguiente se va en bus o metro, el trayecto se pinta antes del tiempo libre.
301. **Repaso de las 20 rutas, Parte B: textos que cuadran con lo que pasa** (decisión del usuario, 2026-09-28):
    - Cada lugar nocturno puede llevar su `texto` (la Plaza de España y Piazza Navona de noche); el genérico ya no sale
      en el segundo lugar de una nocturna. El paseo que habla del segundo lugar lleva `texto_si_va_segundo` (la Fontana
      de Trevi sin "sube hasta la Plaza de España" cuando la plaza va detrás). Lo que sale en lugar del paseo del día,
      si coincide con otro paseo del destino (el centro iluminado), lleva su nombre y su texto.
    - "Roma iluminada desde…": un texto por mirador (`destination_config.night_view_texts`); `night_view_text` queda de
      reserva.
    - Un texto que habla de lo de antes o de después lleva `solo_si_viene_de` / `solo_si_sigue` (con la comida en medio,
      lo de antes es la comida); si no se cumple, su `general` o el texto general del lugar (la Plaza de San Pedro
      después de comer, Trastevere sin mirador detrás). El paseo de noche lleva `texto_despues_cenar` (la escalinata).
      La parada guarda `why_condition` para la auditoría.
    - Museos Vaticanos por la tarde sin hora en el texto.
302. **Repaso de las 20 rutas, Parte C: minutos** (decisión del usuario, 2026-09-28): `max_minutos` en la parada (el
    Puente Sant'Angelo, 15: lo que sobra del redondeo no se queda en un puente); `salida` en el lugar (el Foro sale por el
    Clivo Capitolino, junto al Campidoglio: lo siguiente se mide desde ahí, como el `ends_at` del Free Tour; vale para
    cualquier lugar con la salida lejos de la entrada); `solo_antes_de_cenar` + `si_no` en un lugar nocturno (el Janículo
    de noche no se sube a oscuras después de cenar: sale Trastevere de noche; el bus 115 deja de salir de Via Paola a las
    22:00).

303. **Repaso de las 20 rutas, Parte D: la auditoría ve estos fallos sola** (decisión del usuario, 2026-09-28):
    `auditarViaje` (scripts/destino/auditoria.mjs, la usan la revisión y el barrido) avisa de: el atardecer que acaba
    antes de que se ponga el sol (`atardecer_corto`); la nocturna que repite un lugar del mismo día
    (`nocturna_repite`); el "Quedó fuera" que es falso (el día pasa por el lugar) o con el motivo equivocado ("No te
    dio tiempo" cuando ese día cierra) (`fuera_mal`); la plaza o el puente después de su monumento
    (`plaza_despues`); el texto genérico en una nocturna o un mirador con texto propio (`texto_generico`); el texto con
    `solo_si_viene_de`/`solo_si_sigue` que sale sin cumplirse (`texto_condicion`); las ideas del tiempo libre a más de
    1,5 km (`ideas_lejos`); y la espera antes de cenar a cualquier hora (`cena_espera`, antes solo desde las 20:00).
    Todo lo que queda fuera lleva su `day_number`. Un lugar con `aperitivo_antes_de_cenar` (Trastevere, Monti, Campo
    de' Fiori) se estira hasta la cena en vez de dejar un "Aperitivo y paseo" suelto detrás.

304. **Repaso de las 20 rutas, comprobación: ningún arreglo puede vaciar una tarde** (2026-09-28):
    - La espera antes del sol de más de una hora (antes, de 90 min) se llena en cualquier día con mirador, sea de
      invierno por la fecha o por el orden forzado: primero la subida por el barrio y luego, por dentro, el monumento
      que iba por fuera por tiempo. El D2 de marzo esperaba 100 min antes del Janículo; ahora sube por el Tempietto
      (por dentro) y la Fontana, y recupera el paseo por Trastevere.
    - Llenar la espera y el orden de invierno forzado solo se quedan si no se pierde ninguna parada más (sin el mirador,
      la espera "bajaba" a 0 y se aceptaba una tarde vacía).
    - Quedarse 15 min después del sol retrasa la cena lo mismo: la franja de la cena se alarga esos 15 min cuando el día
      tiene atardecer (el 14 de abril, D1-FT perdía toda la tarde).
    - `si_da_tiempo` sale si por ella se pierde cualquier cosa, no solo una hora fija (Monti después de los Foros en
      D5C, en mayo).

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

308. **Segundo repaso, puntos 4 y 5: la iglesia por dentro por la mañana y dos textos de "por fuera"** (2026-09-28):
    - Por la mañana, dentro de un mismo bloque curado, se encadena hasta 12 min andando (antes 10) sin saltar a la
      media hora siguiente. En D4 y D4M: Plaza de España 20 min, Piazza del Popolo 15 y Santa Maria del Popolo 25,
      para entrar a las 11:30 (su horario, comprobado en santamariadelpopoloroma.it: lun-sáb 8:30-9:45, 10:30-12:00,
      16:00-18:00; domingo y festivos 16:30-18:00).
    - "Por fuera" por el horario tiene dos textos, según la hora real de la visita: si ese día todavía abre más tarde,
      "Todavía no ha abierto (abre a las 16:30)"; si ya no, "A esta hora ya ha cerrado".

309. **Segundo repaso, puntos 1 (trayecto), 6 y 7** (2026-09-28):
    - Si a la siguiente parada se va en metro o bus (también después de comer, `transitAfter`), el tiempo libre es al
      llegar: se descuenta el trayecto y sus ideas y su paseo son de la zona de la siguiente.
    - Una nocturna que solo vale antes de cenar (el Janículo): si el barrio de la tarde se estiró hasta la cena,
      devuelve lo justo para que quepa antes (el barrio, nunca por debajo de 30 min). Su relevo después de cenar
      (Trastevere de noche) sale con su propio texto, y el paseo no se nombra si no queda ninguna de sus paradas.
    - Antes de dejar 20 min o más de espera antes del sol, el monumento que ese día va por fuera por tiempo (el
      Castillo) prueba a ir por dentro, con la subida por el barrio o sin ella. Se queda si no se pierde nada (lo que va
      "por el camino" no cuenta) y la espera no pasa de una hora.

310. **Segundo repaso, puntos 2, 3, 8, 9, 10, 11 y 12** (2026-09-28), reglas generales:
    - `horas` en una variante: la hora preferida de una parada ese día. `sin_free_tour`: lo que solo vale sin Free Tour.
      `insertar` acepta varias opciones en `despues_de` (la primera que haya) y `en: 'manana'`.
    - D4 en domingo: Santa Maria del Popolo abre de 16:30 a 18:00. Sin Free Tour, comida a las 12:00, la Galería a las
      14:00, luego la Piazza del Popolo y la iglesia juntas, el Parque y el Pincio al atardecer; la mañana acaba en la
      Plaza de España y Trinità dei Monti. Con Free Tour, la Piazza del Popolo de la tarde se estira hasta que abre la
      iglesia ("Tiempo libre en la Piazza del Popolo").
    - D4 en invierno: la mañana hasta la Plaza de España, Trinità dei Monti y el Pincio hasta la Galería de las 11:00
      (San Ignacio, si da tiempo); comida normal; el Parque, la Piazza del Popolo, Santa Maria del Popolo cuando abre y el
      Pincio al atardecer.
    - La espera antes de una parada que abre más tarde se queda en la estirable de antes (exactamente esa visita, aunque
      vaya en el mismo grupo que la siguiente), también después de mover un turno; y el barrio de antes de comer se
      estira hasta la comida (Testaccio y su mercado).
    - Nocturna antes de cenar: primero el rato libre con nombre (60 min como mucho) y luego la nocturna, camino de la
      cena; en invierno con más de 90 min antes de cenar, la nocturna pasa siempre antes. El rato de antes de cenar sale
      con nombre desde 20 min (antes, 45).
    - Una nocturna sin texto propio sale con su descripción, nunca con el genérico; `texto_fechas` da el texto de unas
      fechas (Piazza Navona con el mercadillo de Navidad, del 1 de diciembre al 6 de enero).
    - Monti va detrás de los Foros como una sola parada también en D4M; los Foros al atardecer empiezan 30 min antes del
      sol (unos 45 min); los días largos (sol a las 20:00 o más tarde), D5C recupera San Juan de Letrán.
    - La auditoría mira también la última entrada (la Basílica de San Pedro, 19:15).
    - `insertar` también acepta `solo_si_esta` (sin ninguna de esas paradas, no se inserta) y `solo_si_falta` (si la
      parada ya va ese día, no se repite); `sin_free_tour.si_en_tarde`: solo si esa parada va por la tarde. D4 en
      domingo: la Piazza del Popolo y Santa Maria del Popolo siempre juntas, antes del Pincio si el sol se pone a las
      17:30 o más tarde y después si antes (con Free Tour, la plaza se estira antes de subir al Pincio). D4 tranquilo
      de invierno: sin Trinità por la mañana (si no, la Galería pierde las 11:00) y con la misma tarde que D4 de invierno.

311. **Repaso 3, puntos 1 y 3** (decisión del usuario, 2026-09-28; sustituye el orden de la 310):
    - Con la nocturna antes de cenar: primero la nocturna (20-25 min por parada) y luego el rato de "luces y aperitivo",
      justo antes de la cena y hasta la hora de cenar, de hasta 90 min.
    - El orden de invierno forzado (el mirador primero) solo con el sol antes de las 18:30.
    - Lo estirable de la mañana (Testaccio) solo se estira hasta la comida, nunca con lo que sobra de la tarde; y la
      espera antes de una parada no cuenta si hay una comida o una cena en medio.

312. **Repaso 3, puntos 2, 4, 5 y 6** (2026-09-28):
    - D4 en domingo con Free Tour: de Via Veneto a la Galería por la Porta Pinciana y el parque ("De Via Veneto a la
      Galería por el parque de Villa Borghese"), estirable, para no llegar con prisa a recoger la entrada.
    - D4 con Free Tour fuera del invierno: Via del Babuino y Via Margutta, el Parque (el lago y la sombra), la Piazza del
      Popolo y Santa Maria del Popolo cuando abre, los Jardines del Pincio hasta el atardecer (estirables) y la Terraza.
      La espera antes de una parada que abre más tarde se queda en la estirable más cercana antes (hasta 3 paradas).
    - En julio y agosto, más de 90 min libres entre las 14:00 y las 17:00 salen como "Descanso a la sombra".
    - Lo que ya ha cerrado cuando se llega, con su plaza, no se baja a ver para volver a subir al mirador: va después del
      atardecer, camino de la cena (la plaza, de nivel 2, sigue como parada corta).
    - Una nocturna sin nombre propio se llama por sus lugares: «Trastevere y Navona de noche».

313. **Repaso 3, textos y comprobaciones** (2026-09-28):
    - `texto_partes` de un paseo nocturno: `uno_antes_de_cenar` / `varios_antes_de_cenar` ("un paseo precioso antes de ir
      a cenar"); `texto_fechas` lleva su `texto_despues_cenar` (sin "antes de cenar" después de cenar).
    - Santa Maria in Trastevere: 7:30-21:00 todo el año, agosto 8:00-12:00 y 16:00-21:00 (con `verificar`: la web oficial
      no cargaba). El mercadillo de Navona: nueva fecha especial con `verificar: true` hasta confirmarlo el 1 de diciembre.

314. **Ruta 3 de octubre: el día recupera lo suyo antes de dejar tiempo libre** (2026-09-28):
    - Antes de dejar más de 30 min de tiempo libre entre dos visitas, el día recupera una parada suya de la tarde que se
      había quedado fuera solo por el sol o la estación (Letrán en D5C, entre San Clemente y Santa María la Mayor), si
      está abierta, cabe y no se pierde nada. Es la misma idea que el Castillo por dentro.
    - D1-FT de invierno con más de 45 min de espera antes del sol (octubre, marzo; `si_espera`): Trastevere como parada,
      se sube andando por el Tempietto abierto (10:00-18:00, última entrada 17:30, cerrado el lunes) y la Fontana
      dell'Acqua Paola al Janículo al atardecer, y se baja a Santa Maria in Trastevere y a cenar. Con el sol pronto
      (diciembre), el bus 115.

315. **Miradores al atardecer: sin corte fijo por la hora del sol** (decisión del usuario, 2026-09-28; sustituye el
    corte de las 18:30 de la 311): el día elige el orden con el que el mirador del atardecer llega a su hora (el de
    siempre, el de invierno, la subida por el barrio, `si_espera`). Solo si ningún orden llega, sale la versión de noche
    («Roma iluminada desde…»).

316. **Cierre de Roma, puntos 5 y 6: restaurantes y textos** (2026-09-28):
    - Nunca el mismo restaurante dos veces en un viaje (ni la comida y la cena del mismo día): el motor planifica los
      días en orden y no vuelve a proponer uno ya usado mientras quede otro que abra.
    - Con la nocturna antes de cenar, el restaurante recomendado de la cena es el de cerca de donde acaba la nocturna.
    - El rato de antes de cenar de menos de 20 min no sale.
    - Un texto que habla de la mañana solo sale por la mañana: `temprano` + `temprano_antes: "13:00"` (Santa Maria del
      Popolo "Ojo: por la mañana cierra a las 12:00"; Campo de' Fiori, "por la mañana es mercado").
    - `requiere_lugares` de una fecha especial cuenta también las nocturnas: el aviso del mercadillo de Navona va en el
      día que pasa por la plaza, de día o de noche; si ninguno, no sale.

317. **Cierre de Roma, punto 1: una sola regla de relleno** (2026-09-28; amplía la 314):
    - Hueco: más de 30 min libres entre dos visitas, antes de comer o después de comer, o una parada de paseo por encima
      de su máximo (parque, jardín o barrio: 90 min en completo, 120 en tranquilo; una calle, 45; o su propio
      `max_minutos_paseo`, la Via Appia 150).
    - El día prueba, en este orden, hasta 4 veces: a) por dentro lo que iba "por fuera para llegar a todo"; b) lo suyo
      que se quedó fuera (Letrán por el sol, Monti por "si da tiempo") o lo suyo que iba detrás del atardecer (Santa Maria
      in Trastevere antes de subir al Janículo), llevado al hueco; c) la siguiente parada que no está en el viaje, junto a
      la parada del hueco o a la anterior (a 700 m, o de la misma zona a 1 km), por nivel y abierta, después o justo
      antes de ella (el Ara Pacis entre el Popolo y el Pincio). Nunca una calle, nunca lo que se añadió de relleno como
      referencia, nunca un tramo andando más largo que los del día, y sin perder nada ni el atardecer.
    - d) Solo entonces, tiempo libre; si sus ideas son todas de paseo (calles, plazas, paseos), sale con su nombre: «Via
      Margutta y Via del Babuino».
    - Lo que se añade lleva su texto del destino o el consejo de su ficha, nunca "Te pilla de camino".
    - Una variante que cambia la mañana se lleva sus paradas de la tarde (no salen dos veces).
    - La versión de noche de un mirador ("Roma iluminada desde…") dura 15 min como mínimo, y la avenida que el día hace
      paseo (`no_calle`) no se recorta como calle.

318. **Cierre de Roma, punto 2: el miércoles de audiencia** (2026-09-28): Museos Vaticanos → Borgo Pio → Puente y
    Castillo por dentro mientras la audiencia ocupa la plaza → comida a las 13:00 → Plaza de San Pedro, Cúpula y
    Basílica (reabre hacia las 12:30) → Trastevere. En `variantes.miercoles` y `tranquilo_miercoles` de D2.

319. **Cierre de Roma, punto 3: la subida al Janículo depende de la hora, no del mes** (2026-09-28):
    - `si_espera` se prueba también cuando con el orden de ahora se llega cerrado a algo de esa tarde (el Tempietto
      después de su última entrada, 17:30), y vale si llega al sol y se llega abierto a más cosas. Lo que solo iba de
      paso (la Fuente de las Tortugas) no cuenta como perdido.
    - Y al revés: un día en invierno por la fecha prueba el orden normal y se lo queda si el mirador llega a su hora,
      no pierde ningún mirador y hay menos cosas cerradas.
    - El Tempietto dura 20 min por dentro; en la subida, Trastevere 20 min (se vuelve de noche).

320. **Cierre de Roma, punto 4: antes de «ya ha cerrado», cambiar el orden** (2026-09-28): antes de dejar una parada
    por fuera porque ya ha cerrado, el día prueba a cambiarla de sitio con la de al lado (de interior, de la misma zona o
    a menos de 1,4 km, no de su mismo grupo). San Pietro in Vincoli antes que Santa María la Mayor los domingos de
    invierno de D4M.

321. **Cierre de Roma, punto 7: la auditoría** (2026-09-28): tiempo libre desde 30 min (60 si sale con nombre de
    paseo); hueco desde 20 min (30 antes de un mirador del atardecer o de una entrada con turno: es margen); nuevas:
    parada de paseo por encima de su máximo, restaurante repetido en el viaje, "por fuera para llegar a todo" con tiempo
    libre o paradas estiradas, "por la mañana" en una parada de la tarde.

322. **Las entradas son parte del negocio** (auditoría final de Roma, 2026-09-28):
    - Un imprescindible de pago (nivel 1, interior, "De pago") que en el viaje solo se ve con el Free Tour sale por dentro
      el mismo día, justo al acabar el tour, con el texto "El Free Tour te ha enseñado… ahora toca verlo por dentro"
      (el Panteón, a 5 min de Navona, antes de comer). En Roma, D3 come a las 13:00 (60 min) y entra a los Museos
      Vaticanos a las 14:45 (dentro de su franja de 14:30-15:00), en bus 40 o taxi.
    - Una entrada de pago que el día lleva y ese día cierra (el Castillo en D2 un lunes) pesa en el orden de los días:
      mejor otro día, si lo hay.
    - `sin_tope` en una parada de pago: no cuenta para el tope de `museos_de_pago` (el Castillo desde 4 días, `min_dias: 4`).
      El tope es un techo (quita lo que sobra), no un mínimo.
    - D3 en ritmo tranquilo (empieza a las 10:00 con el tour): "Free Tour por el centro y el Vaticano por la tarde".
    - La auditoría avisa si un imprescindible de pago no sale nunca por dentro en el viaje.

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


327. **Motor v4 (días escritos)** (PROMPT_ROMA_COMPLETA, 2026-09-29): detrás de `ROUTE_ENGINE=v4` (o `engine: 'v4'` en la
    petición); v3 no se toca y sigue por defecto mientras la prueba de las 365 fechas no dé 0. El motor coloca los días con la
    tabla de siempre (`curated_routes`) y los ordena con los mismos costes (cierres de cada día de la semana, joyas pronto,
    entradas cerradas, fechas especiales, medias jornadas en su día), elige la versión de la tarde por el sol, aplica variantes,
    fechas, experiencias, pool y ritmo, calcula las horas desde las duraciones y las horas fijas con la matriz de tiempos y
    ajusta la elástica. Nunca añade ni estira paradas por su cuenta; lo que está cerrado lo resuelve lo escrito
    (`si_cerrado`) y, si no hay nada escrito, lo apunta y la prueba lo marca. Si el viaje necesita un día que no está
    escrito, v3.

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

349. **Horas y duraciones de 5 en 5** (2026-09-29): todo lo que ve el viajero (hora de llegada, duración, comidas) va de 5
    en 5 minutos, y la elástica se ajusta de 5 en 5; los minutos andando entre paradas, exactos. (Antes, al cuarto de
    hora: el redondeo se comía minutos de las visitas y el Barrio Judío de 20 min salía de 11.)

350. **D1-FT A**: al Janículo en el bus 115 y se baja por la Fontana dell'Acqua Paola y el Tempietto; el Barrio Judío
    20 min y la Isla 15, sin recortes. **D4 B en domingo**: Santa Maria del Popolo 20 min y el lago de 20, con la tarde
    desde las 14:45 (abre a las 16:30). El mirador solo se alarga si la cena espera en C y D: en A y B ese rato es de la
    nocturna y del aperitivo (la Terraza del Pincio de 70 min del 14 de marzo).

351. **Nunca dos bloques seguidos del mismo barrio antes de cenar** (2026-09-29): el barrio de la tarde, su nocturna y el
    aperitivo del mismo barrio («Trastevere» + «Trastevere de noche» + «Paseo por Trastevere iluminado y aperitivo») se
    juntan en uno, «Trastevere al anochecer y aperitivo»; la nocturna de ese barrio va después de cenar.

352. **El aperitivo, 90 min como mucho, siempre** (2026-09-29): si el rato hasta la cena es más largo, la cena se
    adelanta (nunca antes de las 19:30, ni de las 20:30 en verano) y lo de después de cenar se mueve con ella.

354. **UI · Pestaña Días** (2026-09-29, PROMPT_UI Parte 1):
    - **Color del día.** Cada día tiene su color (`colorIndex`), fijado al crear el viaje. Va con el día, no con su
      posición: si se mueve, su franja y sus pines se mueven con él.
    - **Dónde se ve.** Una franja diagonal fina a la izquierda del acordeón, el número del día y los pines y la línea
      del mapa. Sin ningún día abierto, el mapa enseña todos los días, cada uno con su línea; con uno abierto, solo ese.
      Sin leyenda.
    - **Asa de arrastre.** A la izquierda del todo, asomando por el borde, con 44 × 44 px de toque; solo en los días que
      se pueden mover.
    - **Menú de cada día.** «Volver al día original» (la varita), solo si el día tiene cambios, y «Eliminar día» en todos
      los días (también llegada y vuelta), con ventana de la app y «Día eliminado · Deshacer».
    - **«Volver a mi ruta original».** La varita del mapa, solo si hay cambios. Recupera la copia guardada al crear el
      viaje (`originalRoute`: días, orden, paradas, horas, restaurantes y fechas), sin recalcular.
    - **Confirmaciones.** Siempre en ventanas de la app, nunca alertas del navegador.

355. **UI · Interior de cada día** (2026-09-29, PROMPT_UI Parte 2):
    - **Color del día dentro.** El número del día y los números de las paradas van en el color del día, como sus pines:
      relleno claro, número fuerte y borde blanco. Con el día abierto, pines y línea también.
    - **Tramos.** Solo tres con cabecera, Mañana, Tarde y Noche: lo de antes de comer es la mañana. La comida y la cena
      van entre tramos, como bloques propios; si la cena va después de las nocturnas, dentro de la Noche. Hay 50 px
      encima de cada bloque, y el mismo espacio de la cabecera al primer «+ Añadir parada» que entre parada y parada.
    - **Comida, cena y desayuno.** Formato «Mesa»: terracota suave, sin foto ni número y «Cambiar»; el desayuno, igual
      en pequeño.
    - **«De camino».** Mini-tarjeta con borde discontinuo, sin número ni hora.
    - **Botones fuera del día.** «Volver al día original» va en el menú; no hay «Montar día manualmente».
    - **Excursión.** Una tarjeta al final de la lista si el viaje no lleva excursión: tres escapadas sin repetir sitio,
      con foto (`photo_name`) y sin precios. Al elegir una, se pregunta qué día y se propone el de la oferta.
    - **Fotos.** La de cada parada es siempre de ese lugar. De noche, ese lugar de noche (Unsplash con «night»…) o, si
      no hay, el mismo lugar de día; nunca otro. La revisión está en `docs/FOTOS_ROMA.html`
      (`scripts/destino/fotosRoma.mjs`).
    - **Avisos de fechas.** Flechas ‹ ›, «1 de 3» y «Siguiente» hasta el último, que dice «Entendido».

356. **El desayuno** (2026-09-29): solo en ritmo completo (en tranquilo el día empieza a las 10:00 y no lleva), y solo
    después de una visita temprana con hora (Trevi a las 8:30) o para llenar el rato hasta algo con hora fija (el Free
    Tour de las 10:00). Nunca como bloque de todas las mañanas. Se ve con la tarjeta de siempre (franja y diagonal), sin
    número, y en la diagonal la misma foto en todos los destinos: un café (`BREAKFAST_PHOTO_URL`, enlazada de Unsplash).

357. **Un extra del pool nunca va a un sitio en un día en que ese lugar cierra** (2026-09-29): pasa a su siguiente
    sitio (Caracalla el lunes, por fuera, en D5C).

358. **La llegada y la vuelta** (2026-09-29, PROMPT_UI Parte 3). Vale para avión, tren, autobús, ferry, crucero y coche, y
    para todos los destinos: los datos de cada uno en `data/dias/<destino>/_llegada.json` (`/api/arrival-info`), las
    reglas en `shared/arrival/arrivalRules.js` (la app y la página de revisión usan las mismas).
    - **Van con la posición.** La llegada, en el primer día, después del bloque de alojamiento y antes del primer
      tramo; la vuelta, en el último, al final del todo, con «Fin del viaje. {despedida en el idioma del destino}»
      debajo. Si se borra o se mueve el primer o el último día, el nuevo primero hereda la llegada y el alojamiento y
      el nuevo último, la vuelta.
    - **La barra cerrada.** Tipo billete: 52 px (48 en móvil), bloque petróleo #1F5F78 con el icono del medio y una
      diagonal clara, datos en mono mayúsculas (se cortan con «…»), la hora clave en terracota (nunca se corta) y la
      línea de puntos con dos muescas y «›». Sin número y sin hora en la columna de paradas. Sin reserva, «+ AÑADIR
      VUELO» en azul, que lleva a Reservas con la casilla de esa hora enfocada.
    - **Las horas.** En el centro = llegada + traslado del punto, de 5 en 5. Salir = avión − 3 h, tren y autobús
      − 45 min, ferry − embarque (2 h) − trayecto al puerto, crucero = a bordo − trayecto − 30 min; de 5 en 5 hacia
      abajo. Coche: sin hora clave, el aviso de la ZTL. Un ferry de un solo día es un crucero. La vuelta puede ir en
      otro medio (`returnTransportOptionId`).
    - **Las marcas.** «Llegas después» en lo que empieza antes de la hora en el centro; «Ya te has ido» en lo que acaba
      después de la hora de salir. Nada se mueve solo: «Ajustar este día a tu llegada / vuelta» lo hace al tocarlo.
      La llegada reprograma desde la hora en el centro; la vuelta no rehace el día, quita lo que acaba después de salir.
      Las comidas siguen a las paradas (se corren o se quitan). Cuenta como cambio: la varita lo devuelve todo.
    - **La ventana.** Foto fija del punto (comprobada a mano: es ese sitio), «LLEGADA · MAR 29 SEP», el título y la
      reserva con «Editar». Resumen: todas las formas de ir (la más cómoda primero, «EL MÁS CÓMODO»), cada una con
      tiempo, frecuencia y precio; a la llegada, la estación, la consigna y la primera parada; a la vuelta, «Tu última
      tarde, sin prisas», la maleta y «Tu última hora». Traslados solo si hay traslado privado (nunca en coche). Tips
      con título corto en negrita. Cada precio con su fuente oficial y la fecha en que se comprobó; sin web oficial, sin
      precio. Revisión: `docs/LLEGADAS_<DESTINO>.html` (`scripts/destino/llegadas.mjs`).

359. **Las fichas a pantalla completa del día van en el body** (2026-09-29): parada, comida, llegada y vuelta se pintan
    con un portal. Dentro del panel del día quedaban encerradas en la tarjeta (la animación de entrada dejaba un
    `transform`) o debajo de la cabecera de la app. La animación de entrada del día es `backwards`, no `both`.

360. **Una fecha especial va con su fecha, no con el número del día** (2026-09-29): si se borra el día 1, la audiencia
    del miércoles sigue en el miércoles.

361. **Una visita por dentro cabe entera en un tramo abierto** (2026-09-29, `nextOpenSlotMinutes`): San Clemente
    (09:00–12:30 / 14:00–18:00) a las 12:30 con 45 min dentro pasa a las 14:00.

362. **Retoques de la UI** (2026-09-29):
    - **Excursiones.** Una excursión de día entero nunca va el día de llegada ni el de vuelta (ni en la lista ni en el
      enlace del día). Si el día de la oferta es uno de ellos, se propone el día completo más cercano
      (`excursionOffer.ts`).
    - **Botones flotantes.** Nunca tapan el «···» del último día (espacio debajo de la lista) y llevan iconos de línea.
    - **Mapa.** En el idioma de la app. La línea de todos los días va gruesa y con borde blanco.
    - **Móvil (<480 px).** Escala compacta, con títulos de dos líneas como mucho y la tarjeta del mapa en una línea.
    - **Día abierto y cerrado.** Abierto, sin línea de color; cerrado, con su franja y el número neutro.
    - **Horas de los tramos.** Van de 5 en 5, como las de las paradas.

363. **La hora de una parada es la anterior + su duración + el paseo** (2026-09-29, PROMPT_ROMA_V4_REPASO 1):
    - v4 pone cada llegada en la rejilla de 5 min (los 5 más cercanos), así lo que se ve es lo que calcula el motor.
    - El mínimo de 20 min de un imprescindible se cuenta en el motor, antes del paseo; la pantalla nunca alarga una
      visita comiéndose el paseo a la siguiente.
    - Los tramos a pie que la matriz mide mal (se entra por otro sitio) se corrigen por nombre en
      `data/pipeline_v2/travel/<destino>.ajustes.json` y mandan para todos: del Arco de Constantino al Foro, por la Vía
      Sacra, 4 min (no 9).
    - La auditoría avisa cuando no cuadra (`no_cuadra`: más de 4 min de diferencia).

364. **Nunca pasar por delante de un sitio para volver a él** (2026-09-29, PROMPT_ROMA_V4_REPASO 2): el orden escrito va
    siempre hacia delante. D1: Minerva → Elefantino → Panteón → San Luigi → Navona (la plaza de la Minerva da al
    Panteón; San Luigi queda camino de Navona).

365. **La comida, como mucho 90 min en completo y 105 en tranquilo** (2026-09-29, PROMPT_ROMA_V4_REPASO 3), aunque lo
    escrito empiece la tarde más tarde: lo que sobra pasa a la tarde (antes, Nonna Betta de 13:30 a 15:30 en completo).

369. **Cada tramo hacia delante, también entre basílicas** (2026-09-29, PROMPT_ROMA_V4_REPASO 7): D4M con Letrán va en
    metro A de Spagna a San Giovanni y sigue Letrán → Santa María la Mayor → San Pietro in Vincoli → Mercados de Trajano
    → Monti (la comida queda cerca de Spagna). San Clemente sale del D4M, porque ahí sería de ida y vuelta; va en D5C.

370. **Ningún rato de más de 20 min sin nombre** (2026-09-29, PROMPT_ROMA_V4_REPASO 8):
    - **La nocturna antes de cenar**, de 5 en 5, nada más oscurecer o al llegar. Antes se redondeaba a la media hora y
      quedaban 25-35 min sin nada (los Mercados de Trajano → 30 min → el Coliseo de noche).
    - **Todo hueco de más de 20 min** sale con nombre (antes, de más de 30).
    - **Antes del atardecer, viniendo de un barrio**, el rato es «Aperitivo en {barrio}» (Monti antes de los Foros en
      verano).
    - **El barrio elástico** crece hasta su máximo de paseo también en completo (90).
    - **La «Tarde libre» de justo antes de cenar** es el aperitivo con su nombre, de 90 min como mucho. Si aun así
      sobra, la cena se adelanta, nunca antes de las 19:30. Ejemplo: D5C de invierno en tranquilo, Coliseo de noche a
      las 17:10, aperitivo de 90 min y cena a las 19:30, en vez de 135 min de tarde libre.

371. **La comida cerca de la Galería Borghese** (2026-09-29, PROMPT_ROMA_V4_REPASO 9): la regla de siempre (la comida y su
    alternativa a 15 min andando como mucho de la parada de antes) no se cumplía porque no había ningún restaurante cerca.
    Nuevo en los datos, con dirección y coordenada comprobadas (turismoroma.it y OSM): Girarrosto Fiorentino, Via
    Sicilia 46, arriba de Via Veneto, a unos 10 min por Porta Pinciana. Descartados: Molto de la Galería (ya no aparece
    en su web), Al Ceppo (Via Panama, 17 min) y Caffè delle Arti (16 min).

372. **La cena, también a 15 min andando como mucho de lo último** (2026-09-29, PROMPT_ROMA_V4_REPASO 10): la escrita o
    su alternativa si están a 15 min. Si no, la más cercana, y solo si ninguna está a 15 min, la escrita. En D4M, desde
    los Foros: La Boccaccia (8 min) o Trattoria Valentino (10), en Monti, en vez de Trattoria Monti (20).

373. **Los ratos con nombre, también de 5 en 5** (2026-09-29, PROMPT_ROMA_V4_REPASO 11): aperitivo, tarde libre y tiempo
    libre se redondean hacia abajo a 5 min al final del día (salían 43, 53 o 57 min), para no pisar lo siguiente.

374. **Ajustes tras la prueba de las 365 fechas** (2026-09-29, PROMPT_ROMA_V4_REPASO):
    - **La rejilla de 5 min va en la pantalla, no en el motor.** Esto corrige la regla 363: en el motor, los redondeos
      se sumaban y se llegaba tarde a los turnos (la Galería a las 10:55 para las 11:00). El motor cuenta con los minutos
      exactos. La pantalla redondea cada llegada hacia arriba (como mucho 4 min, sin acumular), así el paseo siempre se
      ve (Arco 10:00-10:20, Foro 10:25). El mínimo de 20 min de un imprescindible puede comerse 4 min del paseo, nunca más.
    - **En tranquilo, toda la mañana se corre lo mismo que la primera hora** (regla 366), ya sin las opcionales: las
      demás horas fijas, al turno siguiente si hay turnos (la Galería de las 11:00, a las 12:00), y el comienzo de la tarde.
    - **`si_cerrado: "quitar"` también si cierra a esa hora**, no solo ese día: el lago de Villa Borghese de noche.
      Con la Galería del pool en el D1 en tranquilo, turno de las 17:00 y Navona opcional.
    - **En tranquilo, también el «centro en dos días» da una sola nocturna**: la que cubre algo que falta.
    - **La prueba de la elástica.** Cuando sobra tiempo, solo avisa si sobra más de lo que absorbe un rato con nombre (60
      min), porque ese rato ya lo vigila la auditoría. Cuando falta, avisa igual que antes. La comida de 90 min en completo
      deja tarde de sobra en verano, y eso ya no es un error.

375. **Se deshace la regla 366** (2026-09-29, decisión del usuario): en tranquilo, las mañanas vuelven a empezar a la
    hora escrita de cada día. También se deshacen los cambios que solo venían de ella: Torre Argentina vuelve a ser
    parada en el D1 y la Galería del pool en el D1 vuelve a las 16:00 con Navona. Lo demás de la 374 se queda, salvo:
    - **El mínimo de 20 min de los imprescindibles no va en el motor**, porque retrasaba la llegada a los turnos. Va en lo
      escrito: el Arco, 20 min en D1 y D1-FT (también en Pascua); la Plaza de España, 20 min en D4, con Via Condotti
      opcional para que en tranquilo se llegue al turno de las 11:00.
    - **Si la tarde no llega al sol**, la comida se acorta (hasta 45 min en completo y 60 en tranquilo). Comer junto a la
      Galería Borghese deja después 25 min hasta el Ara Pacis. Si con ese rato la elástica ya no bajaría de 15 min,
      vuelve: Monti no se quita por nada.
    - **Lo que sobra por la tarde** después del barrio elástico es un «Descanso después de comer» con nombre (hasta 60
      min en completo; en tranquilo, lo que no quepa tampoco en el aperitivo). La comida escrita de 140 min en verano
      pasa a 90, y así la tarde no empieza antes de que abra Santa Cecilia.
    - **Antes del atardecer, viniendo de un barrio o de una plaza de ambiente** (Campo de' Fiori), el rato es «Aperitivo
      en…», de 90 min como mucho.
    - **Una calle o un paseo nunca pasa de su máximo** por el redondeo de la pantalla (Via della Conciliazione, 45).
    - **Un rato libre de 30 min o menos no gasta las ideas de paseo**: le hacen falta al rato largo.

376. **Un aviso, un tema** (2026-09-29, PROMPT_UI_REPASO 1):
    - **Cada aviso habla de una sola cosa y su título dice exactamente esa cosa.**
    - **Cada cierre en su tarjeta**, con sus días y lo cerrado en el título: «Domingo 6 y martes 8 · Museos Vaticanos
      cerrados». Con un festivo, «… el martes 8, la Inmaculada».
    - **Cada fecha curada en la suya.** Las que se repiten llevan el día real delante (`titulo_con_fecha`): «Domingo 6 ·
      El Coliseo y los museos del Estado, gratis». Nunca «museos» a secas.
    - **Primero lo que cambia la ruta** (cierres), después lo informativo.
    - **Iconos:** confeti solo para fiestas y eventos; calendario tachado para los cierres; entrada para los días gratis.

377. **Sin tarjeta «Sal de Roma un día» ni banner de excursión** (2026-09-29, PROMPT_UI_REPASO 2): de la excursión solo
    queda el enlace pequeño «¿Prefieres una excursión este día?», al final del día de la oferta (o del día completo más
    cercano, nunca el de llegada ni el de vuelta). Ningún otro día habla de excursiones.

378. **La varita, siempre a la vista** (2026-09-29, PROMPT_UI_REPASO 3):
    - **Flotando encima del mapa, haya cambios o no.** Si no hay cambios, al tocarla sale «Tu ruta está tal como te la
      preparamos».
    - **En móvil, con el mapa plegado**, va en la columna de botones flotantes.
    - **La columna:** presupuesto abajo (20 px), mapa encima (80 px) y varita arriba (140 px), con 12 px entre ellos. La
      lista de días deja 208 px debajo para que nunca tapen nada.

379. **El aire del día** (2026-09-29, PROMPT_UI_REPASO 4-8):
    - **Cabeceras de tramo:** 50 px encima de cada una y 12 px debajo, hasta el primer «+ Añadir parada».
    - **Comida y cena:** 50 px encima y 50 debajo, como la noche.
    - **Barra de llegada:** 50 px hasta «MAÑANA».
    - **Las cifras del día:** tres en fila, separadas por una línea fina; el número en Instrument Serif (18 px) y la
      palabra en mono y en mayúsculas («13 PARADAS | 10,6 KM A PIE | 7 H 30 DE ACTIVIDAD»). Sin iconos ni caja, centradas.
    - **«De camino»:** del mismo ancho que las paradas, con 16 px arriba y abajo.

380. **La ventana de llegada y vuelta, con el mapa del viaje** (2026-09-29, PROMPT_UI_REPASO 9): arriba ya no va una foto,
    sino el mapa de la pestaña Ruta, con el viaje entero (los días con sus líneas y el punto de llegada). Las fotos
    comprobadas de `_llegada.json` quedan para la página de revisión.

381. **Todos los días se pueden mover** (2026-09-29, PROMPT_UI_REPASO 10), también el de llegada y el de vuelta, y todos
    llevan el asa.
    - **Qué va con la posición:** el que queda primero hereda el alojamiento y la llegada, el último la vuelta, y cada
      uno toma la fecha de su puesto.
    - **Qué no se mueve:** el día sintético de vuelta y un cambio de ciudad a mitad de un viaje con varios destinos.
    - **La marca roja:** si un día movido (respecto a la ruta original) cae en una fecha en la que una parada cierra o
      está cerrada a esa hora, sale la marca de siempre («Hoy cierra», «Cerrado a esa hora»).

382. **La tarjeta de parada, más limpia** (2026-09-29, PROMPT_UI_REPASO 11).
    - **En la tarjeta solo va:** la hora, el nombre, una línea con el horario (reloj) y el tiempo de visita (reloj de
      arena), y las etiquetas.
    - **Va a la ficha:** «Reserva obligatoria / recomendada» a Entradas; «Por dentro / Por fuera» a Resumen.
    - **Fuera de la tarjeta:** «Añadida por ti», «Revisita», «Por tu experiencia», el paseo nocturno y el final del
      Free Tour.
    - **Solo se queda lo rojo** cuando hay un problema: «Hoy cierra», «Cerrado a esa hora», «Llegas después», «Ya te
      has ido», el motivo de un «por fuera» por cierre.

383. **El bus y el metro, como la fila de andar** (2026-09-29, PROMPT_UI_REPASO 12): el tramo en transporte escrito sale
    con su icono y el número de línea («Bus 115 · 20 min», «Metro B · 20 min», «Taxi · 20 min»), el enlace «Rutas», que
    abre Maps en transporte público hasta la parada para ver dónde se coge, y «+ Añadir parada» a la derecha. Las
    alternativas («o el 870», «o un taxi») siguen en la ficha.

384. **El aperitivo, como una tarjeta más** (2026-09-29, PROMPT_UI_REPASO 13): su franja con el icono de la copa, una
    foto del barrio al anochecer (la misma búsqueda «de noche» que las nocturnas), la hora, el nombre, el tiempo («90
    min») y la etiqueta «Aperitivo». Sin número de orden, como la comida. Las ideas de camino («Plaza Trilussa · 3
    min») van dentro de su ficha (`AperitivoCard.tsx`).

385. **Desde el bloque de justo antes** (2026-09-29, PROMPT_UI_REPASO 14): la comida y la cena dicen los minutos andando
    desde lo de justo antes (con aperitivo antes de cenar, «desde el aperitivo», no desde la última parada), y a menos
    de 1 min, «Justo al lado de…», nunca «0 min andando».

386. **Cabecera y barra de abajo** (2026-09-29, PROMPT_UI_REPASO_2 1; sustituye a la columna de botones de la regla 378 y a
    la pestaña Reservas de arriba):
    - **Cabecera:** junto al «● %», la bombilla (los tips del viaje) y la varita («Volver a mi ruta original»; sin
      cambios, «Tu ruta está tal como te la preparamos»). La varita va siempre visible y siempre igual. La maleta y el
      modo noche salen de aquí.
    - **La barra de abajo:** una píldora oscura (#1F1B16) de 64 px, a 24 px de los lados y 26 del borde de abajo, flotando
      sobre la lista (en escritorio, con el ancho de la lista), con sombra suave. Cinco sitios sin texto, iconos de línea
      en crema, 44 × 44 px de toque y su `aria-label`: maleta (nuevo viaje), presupuesto (la bolsa, abre el panel del
      presupuesto), perfil en el centro (círculo terracota de 50 px: «Hola, viajero» y MIS VIAJES, con el abierto
      marcado), mapa (abre el mapa; sustituye a «Mostrar mapa») y reservas (con su «!» naranja mientras falte algo).
    - **Arriba quedan cuatro pestañas:** Hoy, Ruta, Días y Explorar. No queda ningún botón flotante suelto, y las listas
      dejan 144 px abajo para que la barra no tape nunca la última tarjeta.

387. **La nota de temporada vive en la ventana de los avisos de fechas** (PROMPT_UI_REPASO_2, 2), no en la pestaña Días.
    - Es la **primera tarjeta**, siempre; los festivos y días especiales van detrás. Si no hay ningún aviso de fechas, la
      ventana sale igual, solo con ella (una vez por ruta: su texto entra en la firma de lo ya visto).
    - Título: la temporada y el destino («Invierno en Roma»); su texto, el de siempre.
    - En el sitio del dibujo, una franja con el degradado y el efecto de su época, como en el formulario: invierno, nieve
      cayendo; verano, el sol poniéndose; primavera, pétalos; otoño, hojas. Suave y solo dentro de la franja: nunca tapa
      el texto. Con «reducir movimiento», quieta.

388. **Los tips del viaje** (PROMPT_UI_REPASO_2, 3): la bombilla de la cabecera abre una ventana a pantalla completa con
    los de su destino, en `data/dias/<destino>/_tips.json` (servidos por `/api/destination-tips`).
    - **Pocos y buenos: de 5 a 8.** Solo los que ahorran dinero, tiempo o un mal rato, o que el viajero no sabía; nada que
      ya diga una parada.
    - Cada uno con su orden, su etiqueta (`dinero` verde «Ahorras dinero», `tiempo` azul «Ahorras tiempo», `mal_rato`
      terracota «Te evitas un mal rato»), su título, dos o tres líneas de tú a tú, su fuente y su fecha de comprobación.
    - Cabecera oscura con la bombilla, «N COSAS QUE <gentilicio> TE DIRÍA» (`local`, «un romano») y «Lo que ojalá te
      hubieran contado». Si el tip tiene que ver con algo que se reserva (`enlace: "entradas"`), lleva «Ver entradas de
      tu viaje ›», que abre Reservas.
    - **Aquí sí pueden ir precios**, como en Entradas, siempre comprobados en la web oficial y con la fecha.
    - Un destino sin tips: la ventana lo dice («Aún no tenemos los tips de X»), sin inventarlos.

389. **Un texto curado que depende del día dice la hora de ESE día** (PROMPT_UI_REPASO_2, 4). El `por_que` puede llevar
    `variables` ({nombre: {siempre, <día de la semana>, <AAAA-MM-DD>, sin_fecha}}) y usarlas en su texto como `{nombre}`;
    `temprano_antes` también puede ser una variable. Con fechas manda el día exacto, luego el día de la semana, luego
    `siempre`; sin fechas, `sin_fecha`, que cuenta las excepciones. Ejemplo: la tasa de la Fontana de Trevi (2 €, de 9:00
    a 22:00; lunes y viernes desde las 11:30; algunos lunes desde las 14:00; fontanaditrevi.roma.it, 2026-09-29): el
    lunes a las 9:30 la parada ya dice que bajas sin pagar, porque la tasa empieza a las 11:30.

390. **Lo que vuelve a la tarjeta de parada, y lo que va a la ficha** (PROMPT_UI_REPASO_2, 5; retoca la regla 382):
    «Revisita» y «Por tu experiencia · <experiencia>» son etiquetas, con el mismo estilo que las demás (útiles de un
    vistazo). El nombre del paseo nocturno y dónde acaba el Free Tour («El tour acaba en Piazza Navona…») van dentro de
    la ficha, arriba del Resumen. «Añadida por ti» no sale.

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

392. **La comida dura como mínimo 45 min, y nunca se acorta para que quepa lo demás** (PROMPT_TEXTOS_RITMO 6).
    - Si la mañana llega tan tarde que la comida no cabe antes de la hora escrita de la tarde, se hace esto, en orden:
      1. se quitan las opcionales de la mañana, de la última hacia atrás, hasta que quepa;
      2. se quitan las de la tarde, hasta cubrir lo que falta;
      3. lo que quede lo absorbe la elástica, porque la tarde empieza más tarde.
    - Cada opcional quitada queda anotada en las variantes del día (`comida:sin <lugar>`).
    - La prueba solo lo marca si no hay ni opcional ni elástica que lo absorba.
    - Las variantes por fecha conservan la marca `opcional` de la versión normal. El 1 de enero, la Plaza del Campidoglio
      la había perdido.

393. **El bus o taxi de un tramo largo se queda aunque la parada cambie al llegar** (PROMPT_TEXTOS_RITMO 7). A más de 25
    min andando, el tramo va en bus o taxi, con su tiempo real, y la hora de llegada es la anterior + su duración + ese
    trayecto. Esto vale también cuando, al llegar, la parada está cerrada y pasa a «por fuera» o se cambia por otra: el
    transporte del tramo no se pierde. Antes la hora contaba el taxi, pero la pantalla pintaba «33 min andando» de San
    Pedro a Santa Cecilia en Navidad, y 27 a Santa Maria in Trastevere el 14 de agosto.
    - **Un destino sin medición del motor no dice ninguna hora** (2026-09-30): con los valores de reserva (`medido` ausente),
      la pantalla de ritmo no pinta «El día empieza a las…» ni la marca de inicio del gráfico. «≈ N planes al día» se queda,
      como orientación.

394. **Una variante por cierre no deja la tarde coja** (2026-09-30; el 14 de agosto, con los Museos Vaticanos cerrados). Si
    al quitar lo cerrado la mañana se queda con lo que la tarde necesitaba para llegar a su hora (el Castillo, que hace
    que las iglesias de Trastevere ya estén abiertas: 16:00 y 16:30), la variante lo reparte según la hora del sol, con la
    MISMA condición en la mañana (`sol_hasta`) y en la tarde (`sol_desde`), para que ninguna parada salga dos veces ni
    desaparezca cuando el día cambia de versión por la luz. Con el sol desde las 19:45: mañana a las 10:00 (Plaza, Cúpula
    y Basílica) y la tarde de siempre con el Castillo primero.

395. **Un horario de festivo no se da por abierto ni por cerrado sin la fuente oficial de ese año** (PROMPT_ROMA_NAVIDAD 1).
    - Cada cierre por fecha lleva su fuente y su fecha de comprobación (`closed_dates_audit`). Lo que no tenga fuente, fuera.
    - Si no hay fuente del año en curso, el dato va como `probable` y el texto es prudente («suele abrir con horario corto…
      compruébalo en su web»).
    - `horario_especial` con `confirmado: "probable"` + `aplicar: true`: el reparto evita ese día si puede; si no puede, la
      visita va dentro de ese horario (el prudente). Sin `aplicar`, como el 2 de junio: solo se evita el día.
    - Un lugar puede llevar sus tramos especiales en su ficha (`special_hours`, con `motivo`, `fuente` y `verificar`): la
      Basílica de San Pedro no cierra el día entero por una misa del Papa, solo el tramo de alrededor.
    - Ejemplo: el 1 de enero el Coliseo, el Foro (08:30-16:30), el Panteón (09:00-17:00) y las Termas de Caracalla
      (09:30-16:30) abren (colosseo.it y cultura.gov.it, 1 de enero de 2026); el Castillo, la Galería Borghese, el Doria
      Pamphilj y las catacumbas cierran (sus webs oficiales).

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

405. **Fechas especiales, sencillas** (PROMPT_FECHAS_SENCILLAS, 2026-10-01). En Navidad, en los festivos y en las fechas
    especiales, la app hace solo dos cosas: **adapta la ruta a los horarios** (cierres, horarios cortos, transporte) y lo
    cuenta en el aviso, y **cuenta en la ficha lo que ya está en la ruta** (un árbol, un belén, el mercadillo, las luces).
    - **Lo que se repite, sí; lo que pasa una vez al año, no.** Se cuentan las misas y audiencias del Papa, el Ángelus de
      los domingos y los mercadillos, que duran semanas. Fuegos artificiales, conciertos, desfiles y festivales no salen
      en ningún sitio, salvo lo que cambien en los horarios (el Coliseo el 2 de junio, abierto solo por la tarde).
    - **Los grandes días religiosos** (los que llenan la ciudad) se cuentan solo en el aviso de fechas del principio: qué
      pasa y qué hemos cambiado en la ruta. **Nunca son una parada ni una sugerencia con hora.** Las fechas especiales no
      llevan `sugerencia`.
    - **Un aviso dice qué cambia ese día y qué hemos hecho**, en 35 palabras como mucho y de tú: `contexto` + `hecho`. De
      cada grupo de `hecho` sale la primera opción que se cumple en ESE viaje (`hoy`, `antes_de`, `despues_de`, `otro_dia`,
      `en_viaje`, `empieza_tarde`); si el día no pasa por el sitio, lo dice («tu ruta de hoy no pasa por San Pedro: no te
      afecta»). Ningún aviso promete lo que la ruta no hace.
    - **Un aviso, un tema:** el día movido o el horario especial que el aviso de esa fecha ya cuenta (`cubre`) no sale
      aparte. El transporte recortado de ese festivo y el aviso de restaurantes van como frases aparte del mismo aviso.
    - **Lo semanal** vive en `destination_config.papa` y `lineas_semana`: el aviso de la audiencia de los miércoles y la
      línea de ficha del Ángelus (domingo, en la plaza, de 11:00 a 13:00) no salen en las fechas en que no los hay
      (`sin_audiencia`, `angelus_fuera`: el verano). La ruta no cambia: sigue siendo la prudente.
    - **Un horario especial que corta solo la tarde** (`horario_especial.sin_evitar`) no hace huir de ese día: el Viernes
      Santo el Coliseo va por la mañana. Un día escrito puede pedir otro día con una fecha (`no_en: { fecha, evitar }`).
    - **El día que empieza más tarde** (regla 404): a su hora (10:00); si no cabe, con la variante `empieza_tarde` del día
      escrito (lo que pasa a la tarde, nada se quita); si tampoco, a la segunda hora (`si_no_cabe`, 9:30). Si a ninguna
      hora se salva el atardecer, manda no madrugar. Sustituye a la parte de la 404 que quitaba opcionales.
    - **La nota navideña** (`temporada_navidad` + `nota_temporada.navidad*`): si algún día del viaje cae en la época de
      Navidad del destino, sale en lugar de la de invierno, con el icono de Navidad. Solo promete lo que hay en ese viaje:
      el mercadillo si está abierto y en la ruta; árboles y belenes desde `arboles_desde`; antes, solo las luces;
      «iluminado» si alguna noche sale a pasear. Un destino sin `temporada_navidad` lleva la nota de invierno de siempre.

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

408. **Dos días se reparten algo entre los dos** (2026-10-01). Una variante de fecha puede depender de dónde cae otro día
    del viaje: `fecha:12-24&D1-FT@12-25` vale el 24 de diciembre solo si el día D1-FT cae el 25. Cada día lleva su mitad
    escrita. Las que dependen de otro día se aplican después de las de la fecha sola: son más concretas.
    - En los viajes de 2 días 24-25 y 31-1 con Free Tour, el Vaticano entero va el 24 o el 31 (con la Roma Antigua por la
      tarde) y el tour pasa al 25 o al 1, a las 12:00: así se ven por dentro la Basílica, el Coliseo y el Foro.
    - **La comida dura 45 min como mínimo en la ruta que ve el viajero, siempre.** La prueba de las 365 fechas lo cuenta
      (`comida_menos_45`): 0.
    - `si_experiencia` admite `o_si_pool`: la parada va también si el viajero marcó ese lugar en «Elige lugares».
    - **Un festivo que cae en el día de cierre semanal se queda cerrado hasta que el sitio publique su apertura de ese
      año**, con `verificar` y fecha de revisión, aunque otros años abriera (el Castillo y la Galería Borghese el Lunes de
      Pascua). Lo mismo si dos fuentes oficiales no coinciden (el Panteón el 15 de agosto).

409. **Lo que se ve de una parada** (PARA_CODE_NAVONA, 2026-10-01).
    - **Un nombre interno nunca se ve en pantalla**: ninguna etiqueta ni título con guion bajo («mercadillo_navideno» es
      «Mercadillo de Navidad»). La prueba de Navidad lo cuenta.
    - **Las etiquetas solo dicen qué es el sitio** (Plaza, Iglesia, Mercadillo de Navidad…). «Revisita» y «Opcional» se
      quedan; «Por tu experiencia» no sale en ninguna parada.
    - **El nombre de una parada es el mismo en la tarjeta y en la ficha.** Y va **primero el lugar y luego lo que tiene
      que ver con la fecha**: «Piazza Navona y su mercadillo navideño», «Plaza de San Pedro y los 100 Presepi».
    - **`sin_texto_ia`** en un lugar: su ficha lleva solo nuestro texto, sin el que escribe la IA bajo demanda.
    - **Un texto que dice «antes de cenar» va en una parada que acaba antes de la cena**, en todos los viajes.
    - **La pestaña «Entradas» nunca sale en un sitio de acceso libre**, salvo que esté incluido en un Free Tour, una visita
      guiada o una actividad: entonces sí, y en ella va ese tour o esa visita. Un sitio libre con una parte de pago (la
      cúpula, la cripta, las excavaciones) la mantiene, y en ella dice claro que la entrada al sitio es libre y que solo
      se paga esa parte. Las nocturnas no la llevan.
    - Las paradas de Navidad llevan el aspecto normal (el aspecto propio se diseñará más adelante; decisión del usuario,
      2026-10-01). Un lugar sin ficha escrita a mano lleva `sin_texto_ia` hasta que tenga su texto.

410. **Fotos propias y textos de ficha** (PARA_CODE_FOTOS y PARA_CODE_TEXTOS_FICHAS, 2026-10-01).
    - **Una foto también es una promesa.** Las fotos propias de un destino (`data/dias/<destino>/_fotos.json`, ficheros en
      `public/fotos/<destino>/`) van antes que las de Unsplash y Wikipedia. Una foto de unas fechas (Navidad) solo sale con
      la fecha real de ese día dentro de su ventana; con `verificar`, no sale hasta confirmar que ese año hay lo que se ve.
      Una foto de día nunca va en una parada de noche.
    - **El crédito nunca se inventa:** sin autor, enlace y fuente, la foto va sin línea de crédito.
    - Los originales no entran en git: en la app van reducidas (1.600 px de ancho como máximo para la ficha, 640 px para
      la tarjeta).
    - **Un lugar sin ficha escrita a mano lleva nuestro texto** (`por_que_lugares`) y `sin_texto_ia`. En su ficha, ese
      texto va debajo del «por qué» de la ruta cuando no son el mismo.
    - **Una línea de ficha no repite lo que la parada ya cuenta**: `si_repite` (sale su texto corto) y `no_si_parada` (no
      sale el día que la ruta lleva la parada que ya lo cuenta).
    - **Después de tocar el servidor, una petición real a la API** antes de darlo por bueno: las pruebas del motor no pasan
      por ella (el 30 de septiembre se subió un servidor que arrancaba y respondía 500 a todo).

411. **Una parada lleva siempre su foto de día, aunque caiga después del atardecer** (PARA_CODE_FOTOS_2, 2026-10-01). La
    foto de noche solo va en las experiencias y los paseos nocturnos. Las fotos del usuario llevan `fuente: "propia"` y van
    sin línea de crédito; las de Unsplash y Pexels, de momento, también. Comprobación con peticiones reales:
    `scripts/destino/comprobarFotos.mjs`.

412. **El día, bien alineado** (PROMPT_UI_REPASO_3, 2026-10-01).
    - Todas las tarjetas del día van alineadas entre sí, dentro de la línea del día, y con el mismo hueco entre ellas:
      paradas, comidas, cenas, aperitivos, desayuno y «De camino». La comida y la cena llevan su hueco encima, como una
      parada.
    - Cada cabecera de franja lleva 40 px de margen arriba (también la primera, debajo de la llegada) y 12 abajo (antes
      28; PROMPT_UI_REPASO_4).
    - Un tipo de transporte, un icono lineal, sin emojis: bus, metro, tranvía y taxi.
    - La comida y la cena se arrastran con la misma asa que las paradas. La comida no acaba en la noche ni la cena en la
      mañana: fuera de su parte, vuelven a su sitio. Las horas se recolocan por posición, como al mover una parada; un
      restaurante sigue sin ser una parada del motor (`DayPlan.mealAfter`).
    - En la pestaña Ruta, una tarjeta por destino: bandera, nombre del destino y sus días y fechas. Tocarla abre su
      ventana de hoteles y actividades.

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

417. **Días, repaso 4** (PROMPT_UI_REPASO_4, 2026-10-01): las cifras del día con 20 px debajo; la zona de la foto de las
    tarjetas, el doble de ancha (208 px; 168 en el móvil), con el nombre en las líneas que haga falta y la hora sin
    partir; el asa de arrastrar, centrada en la tarjeta y nunca al lado de un hueco vacío.

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

420. **Fotos: de noche solo en las experiencias nocturnas; nunca la misma foto dos veces en un día; sin foto antes que una
    mala** (PARA_CODE_TODO_2026-10-01, paso 5, puntos 2, 3 y 6; sustituye a la 411).
    - Todo lo que parezca de noche (noche, anochecer, amanecer con farolas) va solo en las experiencias nocturnas; una
      parada, un paseo antes de cenar y una comida llevan siempre foto de día. Única excepción: las de Navidad (el árbol
      de Plaza de España y el de San Pedro, el mercadillo de Navona), en sus fechas aunque la parada sea de día.
    - Nunca la misma foto en dos tarjetas del mismo día: si dos paradas compartirían una foto propia, la segunda
      (`no_own_photo`) pide la de siempre. Una parada puede pedir su foto con otro nombre (`foto` en lo escrito): el parque
      de camino a la Galería y el del lago y el templo. La prueba (`foto_repetida`) y `scripts/destino/fotosRepetidas.mjs`
      (todas las fuentes, contra la API).
    - `sin_foto` (en `_fotos.json`): lugares que van con el color neutro hasta que el usuario pase una buena; nunca una
      buscada sola. El degradado naranja y rosa no sale en ninguna tarjeta que no sea de atardecer.
    - La hoja de contactos `docs/revision_fotos_roma.html` (`scripts/destino/revisionFotos.mjs`) enseña todas las fotos,
      cuándo salen y de dónde vienen; arriba, las buscadas solas que nadie ha visto.

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

423. **Las ventanas van por encima de todo y llevan su cruz; abrir un día sube a su principio** (PARA_CODE_TODO_2026-10-01,
    paso 6). Las ventanas (fichas, «Añadir parada», «Abrir ruta en…», alojamientos y actividades del destino) se pintan
    en el body, por encima de los menús y de la barra flotante, con su cruz visible; la del destino, a pantalla completa
    sin el mapa de debajo, con «Excursiones desde {destino}» solo si hay excursiones. Al tocar un día, los demás se cierran
    y la pantalla sube sola hasta su primera parada.

424. **El pool del formulario, guardado y listo desde el principio** (PARA_CODE_TODO_2026-10-01, paso 7). La lista del pool
    se guarda en el navegador con la versión de los datos del servidor (`data_version`, que cambia sola al cambiar
    roma.json o sus fotos) y se revalida en segundo plano; las fotos ligeras (640 px) llegan en una petición
    (`/api/pool-photos`) en cuanto se sabe el destino, y las propias llevan `?v=` y caché larga en Vercel. Una foto ya
    resuelta se guarda 24 h para el pool, Explorar y Añadir parada.

425. **La varita, en cada día** (PARA_CODE_TODO_2026-10-01, paso 8). Entre los tres puntos y la flecha de cada día: «Recuperar
    este día» (la copia de cuando se creó el viaje) y «Recuperar toda mi ruta» (también los días borrados y la llegada y la
    vuelta), cada una con su pregunta y su «Deshacer»; la que no tiene nada que recuperar, en gris con «Está tal como te lo
    preparamos». En un día que crea el viajero, solo la de la ruta. Ni en la cabecera ni en los tres puntos.


426. **Una parada opcional nunca crea una espera ni sale cerrada: si no está abierta a su hora, no entra**
    (PARA_CODE_TODO_2026-10-01, ajuste final). Santa Cecilia in Trastevere es opcional en todos los días escritos: si a su
    hora está cerrada o habría que esperar a que abra, se quita, y su tiempo lo recoge la parada que se estira.

427. **Una hora fija no se mueve ni un minuto: lo de antes se coloca hacia atrás desde ella** (PARA_CODE, 2026-10-01).
    - Hora fija es todo lo que trae `hora` en lo escrito: el turno de la Galería, la entrada del Coliseo o de los Vaticanos, el Free
      Tour, la recogida de una excursión y, cuando existan, las reservas del viajero con hora. A la entrada con turno se llega 10 min
      antes (`TICKET_MARGIN`); las demás, a su hora.
    - El motor encadena las paradas hacia delante; si la suma de lo de antes (duraciones + paseos + traslados) llega después de lo que
      pide la hora fija, `compressToFixedHours` recorta hacia atrás desde ella: primero la parada más cercana, sin bajar de su mínimo
      (el 75 % de lo escrito; si aun así no llega, hasta la mitad; nunca menos de 15 min, 20 un barrio), nunca un «por fuera», un paso, un mirador ni una nocturna; y
      recoloca lo de detrás (respetando sus propias horas fijas y esperas de apertura). Si algo recolocado quedaría cerrado, se deja
      como estaba y se avisa.
    - Si la hora fija es lo primero de la tarde (San Clemente a las 14:00), primero acaba antes la comida (hasta su mínimo, 45 min) y, si no
      basta, se recorta la mañana por el mismo camino.
    - Ya no hay «parches» de minutos para que una cadena llegue (el Castillo de D4 con Free Tour o el 6 de enero): se escribe lo que
      se quiere ver y el motor lo ajusta. Vale para cualquier destino y cualquier hora fija.
    - La prueba de las 365 fechas no admite tolerancia: `v4_llega_tarde` salta en cuanto se llega después de lo que pide la hora.

428. **Las excursiones se abren siempre desde el botón flotante del autobús, en todos los destinos, a partir de los días que marca cada destino**
    (PARA_CODE_EXCURSIONES, 1 y 2).
    - Botón redondo de 58 × 58, fondo crema, borde e icono terracota, abajo a la derecha justo encima de la barra oscura de Días; quieto, sin
      animación; `aria-label` «Excursiones desde {destino}». Sale solo si el destino tiene excursiones y el viaje llega a los días que marca su
      dato `excursions.excursiones_desde_dias` (Roma, 4). Sin excursiones, nunca. Con un día de excursión ya en el viaje, el botón sigue.
    - Se quitó el enlace «¿Prefieres una excursión este día?» del final del día.
    - La página («Un día fuera» / «Excursiones desde {destino}») es pantalla completa, en el body, con su cruz y sin mapa: la franja oscura con la
      valoración media (el % sale solo de las notas reales de las excursiones del destino; sin notas reales, solo el texto), todas las excursiones
      sin filtros (foto, nombre, «La más reservada desde {destino}» solo con el dato real `mas_reservada`, día entero o medio día + horas + dónde te
      recogen, nota y opiniones si son reales, «desde {precio}», «Reservar» y «Añadir a mi viaje»). Todo sale de los datos del destino
      (`/api/destination-excursions`); nada de Roma en el código.

429. **«¿Dónde la ponemos?»: el viajero decide, sin avisos** (PARA_CODE_EXCURSIONES, 3).
    - «Sustituye uno de tus días» (nunca el de llegada ni el de vuelta; un día que ya es una excursión se puede cambiar por otra) u «O en un día
      nuevo» (al final de la lista, con el nombre de la excursión). El día sustituido pasa a ser la excursión y se llama como ella; sus paradas se
      quitan y el resto del viaje no cambia; con la varita de ese día («Recuperar este día») vuelve tal como estaba. Una de medio día solo ocupa la
      mañana (hasta las 14:00): la tarde sigue en el destino. En los dos casos, la app vuelve a Días con ese día abierto.
    - Un día que crea el viajero se llama siempre como lo llamó, aunque quede el último de la lista.

430. **Más días en la lista que en el viaje** (PARA_CODE_EXCURSIONES, 4). Añadir un día (o una excursión en un día nuevo) ya no alarga el viaje: la
    duración (`answers.days` y sus fechas) es la que eligió el viajero y solo se acorta si quedan menos días que ella. Con más días que viaje,
    debajo de «+ Añadir día» sale una sola línea con un aviso terracota: «Tu viaje es de {n} días y ahora tienes {m}. **Añade un día más a tu
    viaje** (enlace: abre el calendario de fechas) o elimina el que menos te convenga». Desaparece en cuanto cuadran. Nada más.

431. **«+ Añadir día»: primero qué quieres hacer** (PARA_CODE_EXCURSIONES, 5). Con excursiones en el destino, sube una ventana («DÍA {n} · NUEVO» /
    «¿Qué quieres hacer este día?») con «Añadir lugares» (la de siempre: nombre del día y Explorar) y «Añadir una excursión» (con los sitios de
    excursión del destino en una línea, dato `ejemplos_linea`); esta abre la página y la excursión va directa al día nuevo, sin «¿Dónde la
    ponemos?». Sin excursiones en el destino, la ventana no sale.

432. **Los textos que lee el viajero nunca nombran a las empresas con las que trabajamos** (proveedor de excursiones, de alojamiento, de vuelos…).
    Se dice «Reservar», «tu reserva», «Ver más alojamientos». Cambiados al aplicarla: la etiqueta de las entradas («Civitatis» / «GetYourGuide» →
    «Reserva»), «Ver más en Booking.com» (→ «Ver más alojamientos»), «se buscan en Booking» (→ «se reservan aparte»), «Ver en Civitatis»
    (→ «Reservar»), «Reservado vía Stay22» y «Reservado vía Skyscanner» (→ «Tu reserva»), el proveedor que salía junto al hotel, y el consejo de
    Roma «Reserva con antelación en Civitatis». Los enlaces y los datos internos sí pueden llevar el nombre; los nombres de trenes y autobuses
    (Leonardo, Airlink…) son información, no proveedores.

433. **Reservas se calcula siempre desde la ruta: nunca puede decir un día, una parada o una excursión distintos de los que hay en la pestaña Días**
    (PARA_CODE_RESERVAS, 1 y 2). `src/lib/bookings.ts` (funciones puras). Debajo de lo de siempre, dos secciones con el mismo formato de filas:
    - **«ENTRADAS»**: las tres entradas imprescindibles del destino (dato `entradas_reservas`: nombre y lugares de la ruta que cubre; en Roma, Coliseo + Foro y
      Palatino, Museos Vaticanos y Capilla Sixtina, Panteón) que están en la ruta, cada una con su día («Día 2 · jue 15 oct»); y «Ver {n} entradas más de
      tu ruta ›» con las demás paradas con entrada (de pago, con reserva obligatoria o con precio de entrada). Si no hay más, la línea no sale.
    - **«EXCURSIÓN»**: una sola fila. Con un día de excursión en el viaje, esa excursión con su día; sin ninguno, «Excursiones desde {destino}» con «{n}
      excursiones · {%} de valoración media» (solo «{n} excursiones» sin nota real) y «Ver excursiones», que abre la misma página del botón del autobús.
      Sin excursiones en el destino, o con menos días que `excursiones_desde_dias`, la sección no sale.
    - Si se mueven los días, la línea de cada fila cambia sola; si se quita una parada con entrada, su fila desaparece (con la imprescindible que cubre varias,
      cuando se quitan todas); si se añade, aparece; si se añade, cambia o quita la excursión, cambia la fila.

434. **El % de la cabecera suma lo de Reservas** (PARA_CODE_RESERVAS, 3). `buildReadinessItems(route, resolved, extras)`: cuentan las filas que se ven sin desplegar
    (vuelos o transporte de ida y vuelta, alojamiento, seguro, eSIM, N26, vehículo si lo hay) más las entradas imprescindibles que están en la ruta y la excursión
    solo si el viaje tiene un día de excursión (peso 1 cada una). No cuentan las de «Ver más» ni la fila «Excursiones desde {destino}» sin excursión: un viaje sin
    excursión llega al 100 %. Como Reservas sigue a la ruta, el total cambia solo (se quita el Panteón y deja de contar).

435. **«Añade tu reserva»: una sola ventana para todo, y el día lo pone la fecha de la reserva** (PARA_CODE_RESERVAS, 4). Desde «Añadir» de cada fila y desde «¿Ya la has
    reservado? Añade tu confirmación» (tarjeta de la excursión y pestaña Entradas de una parada con entrada). Tres pestañas: «Pegar email», «Captura o PDF» (se leen
    con IA, `/api/read-booking`; sale «Lo hemos leído así» para corregirlo) y «A mano» (día y hora, lo demás opcional). Nunca la app elige el día: busca el día del
    viaje que cae en esa fecha; si es otro del que tenía, la pasa a él y lo dice («Tu reserva es del viernes 16: la pasamos a tu Día 3»); fuera del viaje, no se guarda
    hasta que cuadre; sin fechas en el viaje, se elige el día. Lo que se lee del email no se guarda en ningún sitio (ni caché ni registro): se devuelve y ya.

436. **Lo reservado tiene fecha y hora fijas: nada del motor ni del viajero lo mueve. Para cambiarlo, se quita y se vuelve a crear** (PARA_CODE_RESERVAS, 6).
    - Una entrada reservada pone la parada a la hora de la entrada y en el día de su fecha (`Stop.reservedId`); una excursión reservada fija ese día (`isDayPinned`).
      Tarjeta: «Reservada ✓» (verde) y un candado con «Fijada», sus datos (hora, punto de encuentro, n.º de reserva), sin «Reservar» ni «¿Ya la has reservado?»; en la
      pestaña Entradas, «Ya tienes entrada · {hora}» en lugar de los enlaces para comprar.
    - No se puede: mover ese día (arrastrar, «mover el día»), sustituirlo por otra excursión («¿Dónde la ponemos?» no lo ofrece), eliminarlo, ni cambiar la hora, mover
      o quitar la parada reservada. La varita no quita lo reservado (la de un día de excursión reservada no tiene nada que recuperar; al recuperar un día o toda la ruta,
      `reapplyReservations` deja lo reservado en su sitio y a su hora). Al mover los demás días, las entradas reservadas siguen a su fecha.
    - «Quitar del viaje» (única salida): «¿Quitar {nombre} de tu viaje?» con el aviso amarillo «Quitarla de tu viaje no cancela tu reserva. **Cancela primero tu reserva** y
      después quítala aquí.» y «Cancelar» / «Quitar del viaje».
    - Pendiente (no hecho): que el motor, al rehacer la ruta con otras fechas, coloque lo reservado con `compressToFixedHours` (regla 427); hoy se recoloca después, con
      `reapplyReservations`.

437. **Saber solo que alguien ha reservado: el código de campaña de cada viaje** (PARA_CODE_RESERVAS, 5). Cada viaje lleva un código al azar (`app-8F3K2`: nada del viajero ni del
    viaje dentro, `newCampaignCode`) y todos los enlaces de «Reservar» a Civitatis lo llevan (`CampaignLinks` lo pone al seguir el enlace). El nombre del campo sale de
    `VITE_AFFILIATE_CAMPAIGN_PARAM` (por defecto `cmp`) y el número de afiliado de `VITE_CIVITATIS_AID` (por defecto el nuestro, 5206; los enlaces salen `…?aid=5206&cmp=app-8F3K2`; el servidor acepta también los `v-` de los viajes guardados antes): la documentación pública de Civitatis solo explica `?aid=XXX`.
    Las ventas llegan de la API o del informe de ventas del afiliado a `/api/sales/ingest` (cabecera `x-ingest-secret`; tabla en la migración 0017, sin aplicar; en memoria
    mientras no esté `SUPABASE_SERVICE_ROLE_KEY`), **nunca de los correos de nadie**. Al abrir el viaje, arriba de Días: «Hemos visto que has reservado {x} el {día} a las
    {hora}. ¿La ponemos en tu Día {n}?» con «Sí, ponla» (pasa a reservada y fijada) y «Ahora no»; si se cancela una ya unida, «Tu reserva de {x} se ha cancelado» con
    «Quitar del viaje».

438. **Todo lo que se ve lleva foto; sin foto antes que una mala** (PARA_CODE_UI_DIAS, 1; completa la 420). El Coliseo y el Puente Sant'Angelo salen de `sin_foto`: llevan la foto de día
    (`dia_coliseo.jpg`, de las candidatas, con su crédito; `dia_puente_sant_angelo.jpg`, del usuario, sin crédito). `scripts/destino/auditarFotos.mjs` pide a la API la foto de
    todo lo que el viajero puede ver (paradas de los días escritos, paseos, nocturnas, pool, excursiones) y lista lo que se queda sin ella: hoy solo Via Margutta, Via del
    Babuino, Via Veneto, Santo Bambino de Aracoeli y «Pasear por San Giovanni» (sin foto buena en Unsplash: las pasa el usuario). Un «Pasea y piérdete por…» cuya foto de zona
    ya lleva otra tarjeta del día (Campo de' Fiori) no se queda en blanco: prueba con `foto_alternativas` de su zona (`destination_config.paseo_libre.zonas`; en Roma, Piazza
    Farnese para el Centro Histórico).

439. **El viajero nunca ve los niveles ni las marcas internas del motor** (PARA_CODE_UI_DIAS, 2). Fuera de tarjetas y fichas: «Opcional», «Imprescindible» (en el pool
    del formulario) y las etiquetas de datos (`paseo`, `secreto`, `local`, `tranquilo`, `foto`…, `visibleTags` en `tagColors.ts`). Solo salen etiquetas que dicen qué es el sitio (Plaza,
    Iglesia, Museo…) o algo útil al viajero (Revisita, Por fuera, Paseo libre, Reservada ✓, Fijada).

440. **El mapa recogido deja una franja** (PARA_CODE_UI_DIAS, 3). Con la flecha del mapa pulsada en Días o Explorar queda arriba una franja con una flecha hacia abajo («Mostrar mapa»); al
    tocarla el mapa vuelve como estaba.

441. **Añadir lugares** (PARA_CODE_UI_DIAS, 4 y 5). El ejemplo del nombre del día sale de los datos del destino (`destination_config.ejemplo_nombre_dia`; Roma: «Recorrido por el Centro
    Histórico»). El pool de «Añadir lugares» se abre con «Atracciones» marcado. La ventana de «+ Añadir» sube con su tirador y su cruz: el nombre del lugar en letra pequeña,
    «¿A qué día lo añades?», los días con su fecha y su título (el marcado en terracota suave; el que ya lo tiene, apagado con «Ya está en este día») y «Minutos / ¿Cuánto tiempo
    quieres visitarlo?» con el tiempo recomendado del lugar. Al añadir, la pantalla se queda en el pool y sale «Añadido al Día {n} ✓» unos segundos (sin «Deshacer»).

442. **Recuperar** (PARA_CODE_UI_DIAS, 6; cambia la varita de cada día de la 1-oct). «Recuperar este día» va en los tres puntos del día, solo si ese día tiene cambios; nunca en un día del
    viajero (libre o creado con «+ Añadir día») ni en uno fijado por una excursión reservada. «Recuperar mi ruta» va con una varita en la tarjeta del destino, en Ruta (solo con un
    destino: la ruta original es la del viaje entero), con la ventana «¿Recuperar tu ruta de {destino}?». En los dos, lo reservado se queda en su día y a su hora.

443. **Lo reservado se marca en el día** (PARA_CODE_UI_DIAS, 7). Día cerrado: bajo el título, «🔒 Coliseo · 11:00» en el verde de Reservas (con dos o más, «🔒 2 reservas»). Parada con el día
    abierto: la franja de la tarjeta en verde y arriba «Reservada ✓» y el candado con «Fijada». Lo añadido sin reservar no se marca.

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
