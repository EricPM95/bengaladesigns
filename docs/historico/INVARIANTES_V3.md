# ⚠ NO VIGENTE — Invariantes del motor v3 y reglas sustituidas

**Esto ya no manda.** Lo que manda sobre cómo se monta una ruta está en `docs/REGLAS_RUTAS.md`.

Aquí está, tal cual y con su número de siempre: (1) lo del motor v3 (ritmos, redondeos de antes, reparto y programador, bloques de mañana y tarde, días curados v3) y (2) las reglas que `REGLAS_RUTAS.md` sustituye (su ficha dice cuáles, en «Sustituye a»), movidas de los ficheros vivos el 4-oct-2026.
`docs/INVARIANTES_MOTOR.md` sigue intacto, en solo lectura.

# Parte 1 · El motor v3 (muerto)

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

12. **Las experiencias elegidas sesgan el RELLENO, y el sesgo tiene que notarse.**
    *Medido: elegir "Arte y museos" en un viaje de 3 días no mete ni un museo — solo cambia dos
    lugares de relleno, porque `interestTags` únicamente ordena sobrantes y el núcleo viene fijo del
    reparto curado.* Es el bug estructural que justifica esta reescritura.


## E. Reglas de ritmo del motor nuevo

25. **Ventana de cena por modo** *(sustituido por el 36: 20:00-21:00 en los dos ritmos)*: completo 20:00-21:00, tranquilo 19:30-20:30. *En tranquilo el día
    acaba sobre las 19:00 y la ventana de completo dejaba una hora muerta justo antes de cenar.*

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
38. **Encadenado manda sobre redondeo**: dentro de un grupo, a <= 3 min andando o dentro de su
    contenedor se entra al llegar, redondeando a 5 min. Lo demás, :00/:30 por la mañana y :15 por la
    tarde (ver F).
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


## J. Revisión de rutas (2026-09-24, PROMPT_REVISION_RUTAS_ROMA.md)

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

93. **Con fechas, un día curado cuyo imprescindible cierra ese día de la semana se cambia con otro día
    del viaje** en el que abra (y cuyo curado abra también en el primero). *El día del Vaticano caía en
    domingo y se perdía el grupo entero (Plaza y Basílica van con los Museos).*
94. **Solo un MIRADOR con versión de noche es "del atardecer"**; tener nocturna no basta (el Puente
    Sant'Angelo la tiene y se le obligaba a la hora de la puesta de sol, y el Castillo ya no cabía). Lo
    del recorrido fijado entra además en el orden del recorrido.

96. **En un viaje no se repite un lugar de nivel 2 o 3**, ni como nocturna ni como mirador: si se ve de
    día, su nocturna no sale ninguna noche del viaje. Solo el nivel 1 se repite (de noche, de paso o
    como revisita en los días de repetición: `canRevisit` exige nivel 1).
97. **El barrio va el día que se cena en él**: si un barrio es el barrio de cena de otro día (está a 20 min
    o menos de donde se cena), va ese día, bajando a cenar; el día de donde sale se rellena con lo suyo.
98. **El orden fijado de la tarde es obligatorio**: la mejora de la tarde nunca se queda con un orden que
    lo rompa, aunque ahorre una espera (Janículo → Acqua Paola → Trastevere, bajando del mirador a cenar).

**Ajustes antes del push (2026-09-25)**

100. **La nocturna sale desde la cena o no sale**: la primera nocturna está a 15 min andando o menos del
    barrio de cena (`NIGHT_REACH_METERS`, ~950 m en línea recta con el rodeo medio). Si no hay ninguna, esa
    noche no hay nocturna. Al elegir barrio de cena, uno con nocturna posible a esa distancia suma un extra
    pequeño (`NIGHT_BONUS_MINUTES`, menor que el del atardecer: desempata, no arrastra el día). Una
    nocturna que mira un lugar desde OTRO sitio puede ir el mismo día que su visita de día
    (`same_day_as_visit`: el Foro iluminado desde el Campidoglio el día de la Roma Antigua).
102. **Hueco a mitad de día**: si entre dos visitas quedan 60 min o más de espera (a la hora del atardecer,
    a que abra algo), primero entra lo GRATIS que quede de camino (sin topes de categoría, desvío máximo
    del relleno), también la parte gratis de un grupo de pago que no está en la ruta con lo de pago visto
    por fuera (el Puente Sant'Angelo, con el Castillo por fuera). Una vez abierto, ese hueco se sigue
    llenando mientras quepa algo. Si aún quedan 60 min o más: bloque "Tiempo libre" con 2-3 sugerencias
    cerca, que pueden ser de pago, como la tarde libre. La comida no es un hueco. Por la mañana, antes de
    una hora fija (el Free Tour), el día empieza más tarde en vez de esperar.

**Estaciones (PROMPT_ESTACIONES.md, 2026-09-25)**

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
174. **Tiempo libre sin sugerencias**: una idea corta de la zona (el paseo de `zone_walks`, en una
    frase), sin más paradas: la espera al atardecer del Pincio con todo visto.
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
263. **Verano, tiempo libre antes del atardecer**: con nombre y hasta 150 min no es hueco (regla 259); de más, sí.
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
277. **D2 no va en miércoles de invierno si el viaje tiene otro día para él** (decisión del usuario, 2026-09-28). En
    `no_en`, una regla con `evitar: true` (y `invierno: true`: solo con el sol antes de WINTER_SUNSET_BEFORE) no prohíbe
    el día: suma EVITAR_COST (300) al reparto, así que D2 se mueve si hay otro día sin cierres y, si no lo hay, se
    queda. No genera aviso de fecha. Si se queda, el Janículo llega de noche y sale como mirador nocturno ("Roma
    iluminada desde el Janículo", `night_view_text`): se vende como experiencia de noche, nunca como un atardecer
    perdido.
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

327. **Motor v4 (días escritos)** (PROMPT_ROMA_COMPLETA, 2026-09-29): detrás de `ROUTE_ENGINE=v4` (o `engine: 'v4'` en la
    petición); v3 no se toca y sigue por defecto mientras la prueba de las 365 fechas no dé 0. El motor coloca los días con la
    tabla de siempre (`curated_routes`) y los ordena con los mismos costes (cierres de cada día de la semana, joyas pronto,
    entradas cerradas, fechas especiales, medias jornadas en su día), elige la versión de la tarde por el sol, aplica variantes,
    fechas, experiencias, pool y ritmo, calcula las horas desde las duraciones y las horas fijas con la matriz de tiempos y
    ajusta la elástica. Nunca añade ni estira paradas por su cuenta; lo que está cerrado lo resuelve lo escrito
    (`si_cerrado`) y, si no hay nada escrito, lo apunta y la prueba lo marca. Si el viaje necesita un día que no está
    escrito, v3.

349. **Horas y duraciones de 5 en 5** (2026-09-29): todo lo que ve el viajero (hora de llegada, duración, comidas) va de 5
    en 5 minutos, y la elástica se ajusta de 5 en 5; los minutos andando entre paradas, exactos. (Antes, al cuarto de
    hora: el redondeo se comía minutos de las visitas y el Barrio Judío de 20 min salía de 11.)

363. **La hora de una parada es la anterior + su duración + el paseo** (2026-09-29, PROMPT_ROMA_V4_REPASO 1):
    - v4 pone cada llegada en la rejilla de 5 min (los 5 más cercanos), así lo que se ve es lo que calcula el motor.
    - El mínimo de 20 min de un imprescindible se cuenta en el motor, antes del paseo; la pantalla nunca alarga una
      visita comiéndose el paseo a la siguiente.
    - Los tramos a pie que la matriz mide mal (se entra por otro sitio) se corrigen por nombre en
      `data/pipeline_v2/travel/<destino>.ajustes.json` y mandan para todos: del Arco de Constantino al Foro, por la Vía
      Sacra, 4 min (no 9).
    - La auditoría avisa cuando no cuadra (`no_cuadra`: más de 4 min de diferencia).

365. **La comida, como mucho 90 min en completo y 105 en tranquilo** (2026-09-29, PROMPT_ROMA_V4_REPASO 3), aunque lo
    escrito empiece la tarde más tarde: lo que sobra pasa a la tarde (antes, Nonna Betta de 13:30 a 15:30 en completo).

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

378. **La varita, siempre a la vista** (2026-09-29, PROMPT_UI_REPASO 3):
    - **Flotando encima del mapa, haya cambios o no.** Si no hay cambios, al tocarla sale «Tu ruta está tal como te la
      preparamos».
    - **En móvil, con el mapa plegado**, va en la columna de botones flotantes.
    - **La columna:** presupuesto abajo (20 px), mapa encima (80 px) y varita arriba (140 px), con 12 px entre ellos. La
      lista de días deja 208 px debajo para que nunca tapen nada.

392. **La comida dura como mínimo 45 min, y nunca se acorta para que quepa lo demás** (PROMPT_TEXTOS_RITMO 6).
    - Si la mañana llega tan tarde que la comida no cabe antes de la hora escrita de la tarde, se hace esto, en orden:
      1. se quitan las opcionales de la mañana, de la última hacia atrás, hasta que quepa;
      2. se quitan las de la tarde, hasta cubrir lo que falta;
      3. lo que quede lo absorbe la elástica, porque la tarde empieza más tarde.
    - Cada opcional quitada queda anotada en las variantes del día (`comida:sin <lugar>`).
    - La prueba solo lo marca si no hay ni opcional ni elástica que lo absorba.
    - Las variantes por fecha conservan la marca `opcional` de la versión normal. El 1 de enero, la Plaza del Campidoglio
      la había perdido.

394. **Una variante por cierre no deja la tarde coja** (2026-09-30; el 14 de agosto, con los Museos Vaticanos cerrados). Si
    al quitar lo cerrado la mañana se queda con lo que la tarde necesitaba para llegar a su hora (el Castillo, que hace
    que las iglesias de Trastevere ya estén abiertas: 16:00 y 16:30), la variante lo reparte según la hora del sol, con la
    MISMA condición en la mañana (`sol_hasta`) y en la tarde (`sol_desde`), para que ninguna parada salga dos veces ni
    desaparezca cuando el día cambia de versión por la luz. Con el sol desde las 19:45: mañana a las 10:00 (Plaza, Cúpula
    y Basílica) y la tarde de siempre con el Castillo primero.

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

411. **Una parada lleva siempre su foto de día, aunque caiga después del atardecer** (PARA_CODE_FOTOS_2, 2026-10-01). La
    foto de noche solo va en las experiencias y los paseos nocturnos. Las fotos del usuario llevan `fuente: "propia"` y van
    sin línea de crédito; las de Unsplash y Pexels, de momento, también. Comprobación con peticiones reales:
    `scripts/destino/comprobarFotos.mjs`.



# Parte 2 · Reglas sustituidas por REGLAS_RUTAS.md (segunda tanda, 4-oct-2026)

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

11. **El nivel 1 entra SIEMPRE, elija el viajero lo que elija.** "Imprescindibles" como tarjeta es
    una promesa de la pantalla ("te hemos preparado lo esencial"), no un interruptor: apagarlo desde
    el cuestionario dejaría sin Coliseo a un primerizo que solo quiso marcar tres temas. Quien repite
    destino quita el Coliseo desde el menú de la parada, que ya funciona.
    *Sustituye a la versión anterior de este invariante, en la que la tarjeta sí apagaba el nivel 1.*

14. **Un grupo es UNA visita.** `roma_antigua_core` = Coliseo + Foro + Arco de Constantino;
    `vaticano_core` = Vaticanos + San Pedro + Plaza de San Pedro (285 min juntos). El motor cuenta y
    coloca GRUPOS, no lugares sueltos, con su `group_order` interno. Consecuencia: "Coliseo y Foro
    van siempre el mismo día" **no necesita ser una excepción escrita** — es imposible separarlos. Y
    "una visita larga por día" se mide por grupo, no por lugar.

17b. **Acceso + monumento (`approach_to`)**: la plaza, el puente o el parque va SIEMPRE antes del
    monumento al que da acceso, y si caen el mismo día, JUSTO antes: es el camino de llegada (con
    dos monumentos, justo antes del primero). Cada uno puede ir solo o en días distintos si no son
    inseparables (el Parque de Villa Borghese sin la Galería). Se acepta un rodeo de 10-50 m. Y son un
    grupo INSEPARABLE cuando el monumento se visita gratis (Basílica de San Pedro, Altar de la
    Patria: lo de pago es la cúpula o la terraza) o se disfruta también desde fuera
    (`visible_from_outside`: Castillo de Sant'Angelo, como el Coliseo). Si hay que entrar sí o sí
    (Museos Capitolinos, Galería Borghese), no: la plaza o el parque se ven sin el museo. El acceso
    no ocupa sitio propio: va encadenado y cuenta como una sola visita. Lo vigila verifyPlanTrip.

105. **El sol decide qué es tarde y qué es noche**: la puesta de sol se calcula (fecha real o día 15 del
    mes; `sunset_by_season` solo sin coordenadas) y **la noche empieza 30 min después**. Si eso es antes
    de la cena y el paseo cabe entre la última visita y la cena, las nocturnas van ANTES de cenar,
    recorridas hacia el barrio de la cena (si no cabe entero, sin lo más lejano); si no, después, desde
    las 21:30 o cuando ya sea de noche. No es una regla de invierno: sale de la hora del sol. Un
    exterior con horario (jardín, parque) que cierra antes de que sea de noche no puede ser nocturna ese
    día (lo que cierra en `sunset`, nunca); lo de interior se ve de noche desde fuera y no cuenta. La
    cena no cambia de franja.
285. **El pool manda: tiene que entrar** (decisión del usuario, 2026-09-28). En tranquilo, si lo del pool (o un nivel 1)
    se queda fuera, el día madruga un poco (de 30 en 30 min) y, si ni así, madruga Y acorta la comida, lo justo (la
    Galería de la ruta 20). La revisión cuenta "Lugares del pool fuera" (0).
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

328. **Días escritos: las cenas y la segunda elástica** (2026-09-29): en las tardes A y B, después del atardecer, primero la
    nocturna (20-25 min) y luego «luces y aperitivo», 90 min como mucho: es la segunda elástica, y la cena lleva su hora para
    que caiga ahí. En C y D la cena es al llegar (a partir de las 19:30). Con días escritos, el restaurante escrito manda: el
    servidor no lo vuelve a elegir junto a la nocturna.

338. **La excursión, desde `excursion_desde_dias` días** (2026-09-29; Roma, 5): con menos días de contenido todo es
    ciudad (Roma en 4 días: D1, D2, D4 y D5C; con Free Tour, D3, D1-FT, D4 y D5C) y la excursión se ofrece en un solo
    día, el de `excursion_oferta.dia`, con su texto y sin precios; los demás días no llevan banner. Si el viajero la
    elige, ese día pasa a ser la excursión (convertDayType) y nada más cambia. Con 5 días, los 4 y la excursión; con 6 y
    7, D5 (Via Appia), D6 y D7.

345. **Un extra del pool nunca le quita a un imprescindible de pago su visita por dentro** (2026-09-29): si el día de un
    extra deja uno por fuera por la hora, el viaje se vuelve a montar con el extra en su siguiente sitio, y se queda así
    solo si mejora.

351. **Nunca dos bloques seguidos del mismo barrio antes de cenar** (2026-09-29): el barrio de la tarde, su nocturna y el
    aperitivo del mismo barrio («Trastevere» + «Trastevere de noche» + «Paseo por Trastevere iluminado y aperitivo») se
    juntan en uno, «Trastevere al anochecer y aperitivo»; la nocturna de ese barrio va después de cenar.

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

447. **Un paseo con `una_vez_por_viaje` no se repite** (el del Tridente): si un día anterior del viaje ya cena en esa zona, el rato va a la parada que se estira. `minutos_max` por zona
    sobre el máximo general (el Tridente, 120).

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

457. **El viajero manda** (3-oct-2026, todos los destinos). Si su reserva coincide con el atardecer, la nocturna o cualquier otra cosa del día, ese día va sin ello, sin forzarlo y sin aviso. La ruta se adapta a sus horas, no al revés.
    En las pruebas, un atardecer que no cabe por la hora de una reserva no cuenta como fallo. (Motor: con una entrada reservada, un mirador de atardecer al que se llega después de la puesta se quita, en vez de pasar a «vista nocturna».)

461. **Margen antes de una entrada reservada**: el tiempo de más antes de ella (hasta 60 min) no cuenta como hueco (imprevistos y llegar con calma; Trevi a las 8:00 y la Galería a las 10:00). La parada lleva `reserved_entry`; la auditoría usa
    `HUECO_MARGEN_RESERVA = 60`. No hay que tener miedo a madrugar.

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

473. **El Free Tour añadido después se clasifica por su hora** (3-oct-2026, amplía 465): antes de las 13:00, de mañana; de las 13:00 a las 18:59, de tarde; a partir de las 19:00, de noche. El tour de «noche» de invierno (sale hacia las 16:30) cuenta como de tarde. La hora del tour no se mueve
    nunca (466). Va en el primer día, por orden, cuyo día escrito trae esa franja y acaba llevando el tour; si lo que cambia ese día (un domingo, una fecha) reescribe las paradas y se lo lleva, el tour vuelve a ponerse. Si lo de antes no cabe, se quita lo menor y sale en la campana;
    la sombra de verano no mueve el tour. Un atardecer se quita el último y sin aviso. (Motor: `freeTourDespues: { hora }`; `free_tour_info` en el día dice dónde quedó y, si no quedó, por qué.)

364. **Nunca pasar por delante de un sitio para volver a él** (2026-09-29, PROMPT_ROMA_V4_REPASO 2): el orden escrito va
    siempre hacia delante. D1: Minerva → Elefantino → Panteón → San Luigi → Navona (la plaza de la Minerva da al
    Panteón; San Luigi queda camino de Navona).

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

373. **Los ratos con nombre, también de 5 en 5** (2026-09-29, PROMPT_ROMA_V4_REPASO 11): aperitivo, tarde libre y tiempo
    libre se redondean hacia abajo a 5 min al final del día (salían 43, 53 o 57 min), para no pisar lo siguiente.

384. **El aperitivo, como una tarjeta más** (2026-09-29, PROMPT_UI_REPASO 13): su franja con el icono de la copa, una
    foto del barrio al anochecer (la misma búsqueda «de noche» que las nocturnas), la hora, el nombre, el tiempo («90
    min») y la etiqueta «Aperitivo». Sin número de orden, como la comida. Las ideas de camino («Plaza Trilussa · 3
    min») van dentro de su ficha (`AperitivoCard.tsx`).

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

51. **Un horario puede tener varios tramos por día** ("07:30-12:30, 16:00-19:30" o con "/"). El motor
    los comprueba TODOS (`parseHoursSessions`). En pantalla se enseñan todos los tramos del día
    ("07:30–12:30 / 16:00–19:30", `formatDaySessions`), nunca solo el primero, y el "abierto /
    cerrado" de la ficha se calcula a la HORA DE LA VISITA, no a la del móvil. *Una iglesia visitada a
    las 17:45 salía "10:00–12:30": era la tarjeta enseñando el primer tramo y la ficha mirando la hora
    a la que se revisaba la ruta.*
92. **Sin fechas manda el horario de laborables** (`windows` = la entrada de `by_day` que cubre más días de
    lunes a viernes), con aviso en la parada de los días que a esa hora no se puede: "Domingos y
    festivos, solo de 16:30 a 18:00." (y "Cierra los lunes." si cierra algún día).

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
470. **Última entrada por día de la semana** (3-oct-2026): `last_entry_by_day` en la ficha del lugar (`{ "vie-dom": "19:00" }`). El Palazzo Doria Pamphilj abre de viernes a domingo de 10:00 a 20:00 con la última entrada a las 19:00 (el resto, 09:00-19:00 y 18:00):
    doriapamphilj.it, «La Visita (Roma)», comprobado el 3-oct-2026. Antes, los sábados a las 19:00 salía «fuera de horario».


