# Tanda 7 · Huecos y casos raros de las llegadas y vueltas

Revisión del 12-oct-2026, sin tocar el repositorio. He leído `DIAS_ROMA_PARADAS.md` (reglas 1–17 y «Llegadas y vueltas»), `PROPUESTA_LLEGADAS.md`, `PARA_CODE_TANDA7.md`, `NOTAS_TANDA7_LLEGADAS.md`, `_llegada.json`, `PENDIENTES_LLEGADAS.md` y `PENDIENTES_6K.md` (estos dos mandan). También he mirado el código que ya existe (`shared/arrival/arrivalRules.js`, `shared/routeEngine/tripSkeleton.js`, `src/lib/tripDays.ts`, `src/lib/mapGeneratedRoute.ts`, `DayList.tsx`, `DayDetailPanel.tsx`, `data/pipeline_v2/roma.json`).

Cómo leer cada punto:
- **Caso:** el caso exacto.
- **Qué dicen:** qué dicen los documentos, o qué no dicen.
- **Propuesta:** una regla concreta. Todas respetan las cuatro reglas de Eric: la app avisa y nunca prohíbe; nada se quita sin que lo decida el viajero (lo que no cabe va a «Si te sobra tiempo»); ninguna hora calculada a la vista; la hora solo elige la fila de su tabla.

Las filas (R0–R6, S0–S4, FT…) son las de `MATRIZ.md`.

---

## A. Graves: sin esto, la tanda sale mal en muchos viajes

### 1. ¿Qué día es «el último día»? Los documentos y la app no cuentan igual
- **Caso:** un viaje del martes 10 al sábado 14, con la vuelta el sábado 14 a las 18:00.
- **Qué dicen:**
  - **Los documentos** cuentan los cinco días como días de ruta. En el ejemplo de Ana (`PROPUESTA_LLEGADAS.md`, 67–98), el sábado 14 es el D4 sin vuelos y la última mañana con vuelos. También cuentan así en «Con un solo día entero (el día 2)», en «En viajes de 2 días, el día 2 es la vuelta» y en «el día 4 pasa a ser el de vuelta».
  - **La app** cuenta noches. Con las fechas 10–14 hay `answers.days = 5`, pero solo 4 días de ruta. El sábado 14 es el día de vuelta que crea la app (`isReturnLeg`, «Vuelta desde Roma»), sin paradas (`tripDays.ts`, `mapGeneratedRoute.ts` 958–966, `tripSkeleton.js` 66–67). La barra de la vuelta sale en ese día (`DayList.tsx` 347).
  - **Lo que pasa por esto:**
    - el interruptor por defecto: en 10–14 son 4 días de ruta, así que sale «Roma», y Ana tendría «Excursión»;
    - el caso «el día 4 pasa a ser el de vuelta» no puede darse nunca: el interruptor solo existe con 4 días de ruta o más, y la vuelta cae en el día 5 o después;
    - si Code aplica el documento al pie de la letra, convierte en última mañana el viernes 13, que es un día entero en Roma, y deja vacío el sábado 14.
- **Propuesta:**
  - **Una sola definición:**
    - el día de llegada es el primer día del viaje;
    - el día de vuelta es el día de la fecha de vuelta, que en la app es el de vuelta que ella crea (`isReturnLeg`);
    - la última mañana va en ese día, que hoy está vacío;
    - todos los días de en medio son enteros.
  - **Reescribir con esa cuenta** las tablas de «Los días reales», el ejemplo de Ana, «Con un solo día entero», «Sin ningún día entero» y «La excursión y los vuelos».
  - **Decirlo siempre de la misma forma:** «N días» quiere decir N días de ruta, o N + 1 fechas.
  - **Sin horas, el día de vuelta sigue como ahora,** solo con la barra.

### 2. Lo que el recorte deja fuera desaparece, y eso va contra «nada se quita»
- **Caso:**
  - llegada por Fiumicino a las 20:00 (R5): el día 1 se queda en Trevi de noche;
  - llegada a las 23:30 (R6): el día 1 no lleva nada.
- **Qué dicen:**
  - «Si llega tarde, **lo primero que se quita** es el Pincio y el Popolo» (`DIAS` 987).
  - La tabla deja fuera Navona, el Panteón, la Plaza de España, la Trinità, el Pincio y el Popolo, y nadie dice adónde van.
  - Además, el D4 que va detrás del Centro sale siempre «sin Trevi y con la Plaza de España de camino» (`DIAS` 873). Con R5 o R6, el viajero solo ve de día la Plaza de España y Trevi si la última mañana es el DT-medio. Si no, nunca (y con R6, tampoco Navona, el Pincio ni el Popolo, salvo de camino en otros días).
  - Lo mismo pasa con el último día: con vuelos, el día que había (el D4 en 5 días, el D5 en 6) se cambia por una media mañana, y lo suyo desaparece sin preguntar.
- **Propuesta:**
  - **Lo que su fila deja fuera,** en «Si te sobra tiempo» de ese mismo día, en su orden. Si el día es de noche (R5 o R6), en el del día 2.
  - **El D4 sale en su versión de siempre** (con Trevi sin gente y la Plaza de España como parada) si la llegada no las vio de día: filas R4 (desde Navona), R5 y R6.
  - **El día que la última mañana sustituye:** sus paradas que no salen en ningún otro día, a «Si te sobra tiempo» de la última mañana. La hoja del resumen lo dice en una línea: «Lo del sábado 14 que no cabe con tu vuelo está en "Si te sobra tiempo"».
  - **Cambiar el verbo** del documento: «lo primero que pasa a "Si te sobra tiempo"».

### 3. La última mañana se monta con cuentas al minuto, y Eric las quitó
- **Caso:** el vuelo sale de Fiumicino a las 16:15. Por dentro, hay que salir a las 13:15 y recoger la maleta a las 12:15. La mañana es el DT-medio, que empieza a las 7:30.
- **Qué dicen:**
  - Hay «última mañana si quedan 3 h o más entre las 9:00 y salir − 1:00».
  - «Si no cabe entera antes de salir − 1:00, lo del final pasa a "Si te sobra tiempo"».
  - «Se mira si el bloque cabe antes de salir − 1:00», y la hoja del Foro (`DIAS` 939–958).
  - En las pruebas: «nunca una parada después de salir − 1:00» (`PARA_CODE` 214).
  - Todo eso es una suma de minutos, justo lo que quita «Sin cuentas al minuto» (6z5, `PENDIENTES_6K` 217): «la hora solo elige la fila de su tabla; nada se quita ni se mueve por minutos».
- **Propuesta:**
  - **Una tabla de la última mañana por la hora de salir,** como la de la llegada, escrita una vez a mano con los `~` del documento (hasta 12:00 / 12:00–13:00 / 13:00–14:30 / 14:30 o más). En cada fila, qué paradas de cada media mañana entran (DT-medio, D0-medio, DA-medio, mañana del D6) y si hay comida.
  - **Lo de después de la fila,** a «Si te sobra tiempo».
  - **Con una reserva grande,** la fila de su hora en la tabla del bloque (Coliseo: con o sin Foro; Museos: con o sin la Basílica…), sin cuentas al guardar.
  - **El motor solo elige la fila.** La regla de las 3 h pasa a ser la frontera de la primera fila, y en la matriz ya sale por punto: Fiumicino 16:00, Ciampino 15:50, Termini 13:45, Tiburtina 13:55 y Civitavecchia 16:50.

### 4. Las salidas de tarde y de noche: no hay regla para la tarde ni para la cena del último día
- **Caso:**
  - un vuelo de Fiumicino a las 21:00 (por dentro, salir a las 18:00) o a las 23:30 (salir a las 20:30);
  - un tren desde Termini a las 22:00 (salir a las 21:15).
- **Qué dicen:**
  - Solo hay «última mañana» (una media mañana) y «comida si salir es a las 14:30 o más tarde».
  - Desde la fila S4 en adelante (Fiumicino desde las 17:30 hasta las 23:59) todo sale igual: la mañana, la comida y la tarde vacía, sin cena.
  - Los medios días «de tarde» se han dejado guardados y no se usan (`DIAS` 872, `PROPUESTA` 164).
  - `_llegada.json` ya tiene `ultima_tarde` y `ultima_hora` (Santa Maria Maggiore y el Mercato Centrale, junto a Termini), sin regla que los use.
- **Propuesta:** dos filas nuevas en la tabla de salida.
  - **«Última mañana y tarde»:** la mañana que toque, su comida y la tarde de su mismo medio día («De tarde» del D0-medio, del DT-medio o del DA-medio, el que no se haya usado), sin cena ni nocturna.
  - **«Día casi entero»:** el día que había (no se cambia por una media mañana), con la cena y sin nocturna.
  - **Las fronteras las pone Eric.** Yo no las invento.
  - **La «Tu última hora» de `_llegada.json`,** en «Si te sobra tiempo» cuando sale de Termini.

### 5. El paso de medianoche en la llegada: puede dar «el día entero» a quien llega a las 23:30
- **Caso:**
  - Fiumicino desde las 22:30;
  - Ciampino desde las 22:40;
  - Termini desde las 23:15;
  - Tiburtina desde las 23:05;
  - Civitavecchia desde las 21:30.
  
  En todos, la hora en que queda libre pasa de las 24:00.
- **Qué dicen:**
  - «Después de las 23:00: nada», pero la cuenta da 0:00–1:30 del día siguiente.
  - `centerMinutesOf` no corta en las 24:00. Si alguien lo pasa a «minutos del día», cae en «antes de las 13:00» y el día 1 sale entero.
  - En la matriz son las celdas R6*: 6 de Fiumicino, 10 de Civitavecchia y 3 de Termini.
- **Propuesta:**
  - **Regla escrita:** «si la hora en que queda libre pasa de las 23:00, o de la medianoche, es la fila "después de las 23:00"».
  - **Mejor aún:** dar la tabla por la hora de llegada de cada punto, como en `MATRIZ.md`, para que el motor no sume nada.
  - **Una prueba** con cada punto a las 23:45.

### 6. La madrugada: la noche de antes o la de después, el hotel, y la vuelta de madrugada
- **Casos y lo que dicen:**
  - **(a) Llegada entre las 0:00 y las 5:00:** el documento dice «día entero normal». Pero la app solo guarda la hora, no la fecha. Quien sale de Madrid el 10 a las 22:00 y aterriza el 11 a las 0:30 pondrá el día 10 como primer día, y la app le da un día 10 entero en Roma cuando todavía está volando.
  - **(b) El hotel:** la noche de la llegada de madrugada (antes del día 1) no cuenta en las noches de «Tu alojamiento».
  - **(c) Vuelta entre las 0:00 y las 5:00:** «cuenta como la noche anterior; el día de antes acaba sin nocturna».
    - No dice nada de la cena. Con el vuelo de la 1:00 desde Fiumicino, hay que salir a las 22:00 del día anterior y recoger la maleta a las 21:00.
    - El aviso «una reserva después de la hora de salir» comprobaría la hora contra el día equivocado.
    - El aviso de la excursión del día anterior, que vuelve a las 20:00 o 21:00, tampoco se compara con esa hora.
    - `leaveMinutesOf` da minutos negativos.
  - **(d) Las fronteras:** «de 0:00 a 5:00» y «de 5:00 a 9:00» incluyen las dos las 5:00. Además, la regla habla de «vuelos»: no dice si vale para el barco o el tren (un ferry a las 3:00 obliga a salir a las 23:10 del día de antes).
- **Propuesta:**
  - **(a)** Con la llegada de 0:00 a 5:00, la hoja del resumen dice (sin horas calculadas): «Aterrizas a las 0:30: contamos que llegas la noche antes del martes 10. Si aterrizas la noche del martes 10, cambia las fechas del viaje.» [Cambiar fechas] · [De acuerdo].
  - **(b)** En esa misma hoja, una línea: «Esa noche ya necesitas alojamiento.»
  - **(c)** Con la vuelta de 0:00 a 5:00, el día de antes lleva la cena y no lleva nocturna. Los avisos de ese día (reserva y excursión) se comparan con la hora de salir de la noche de antes.
  - **(d)** Cada tramo empieza en su hora (las 5:00 en punto ya es «de 5:00 a 9:00»). La regla de la madrugada se mira por la hora de salir, no por la del vuelo, y vale igual para todos los medios.

### 7. Todavía quedan horas calculadas a la vista en el documento, en la tanda y en los datos
- **Qué dicen:**
  - `DIAS` 929 y `PARA_CODE` 58: «SAL A LAS 14:00» en la barra. El código ya lo quitó (`barTextOf`, 6t).
  - `DIAS` 958: la hoja del Foro, «Ese día sales hacia el aeropuerto **a las 12:00**».
  - `DIAS` 1049 y `PARA_CODE` 152: «… ese día sales hacia el aeropuerto **a las 14:00**».
  - `DIAS` 1059 y `PROPUESTA` 102: el resumen, «antes de salir hacia el aeropuerto **a las 15:00**».
  - `_llegada.json` → `ultima_tarde`: «sal a la hora que te marcamos».
  - PENDIENTES ya pedía quitarlas «antes de pasar la tanda», y siguen ahí.
- **Propuesta:**
  - **Textos sin la hora calculada:**
    - «Tu entrada a los Museos es a las 15:00 y tu vuelo sale a las 17:00: revisa tu reserva»;
    - «El sábado 14 tienes una última mañana por Roma antes de tu vuelo»;
    - en la hoja del Foro, «Con tu vuelo de las 15:00, te da tiempo al Coliseo, pero no al Foro y el Palatino…».
  - **Solo horas que pone el viajero o que vienen en los datos.**
  - **En `ultima_tarde`:** «sal con margen».

### 8. Viajes de 1 y 2 días con horas: o no se recortan o pierden lo imprescindible
- **Casos y lo que dicen:**
  - **(a) Llegar y salir el mismo día** (llegada a las 15:00 y vuelta a las 20:00): «el D0 de siempre, con las dos barras» (`DIAS` 925). Es un día de unas 13 h sin ningún recorte. Choca con «la escala de crucero se monta como un viaje de 1 día sin vuelos» (`DIAS` 1087): ¿lleva barras o no?
  - **(b) 2 días con vuelos:** «Sin ningún día entero: la llegada (Centro) y la última mañana (D0-medio)».
    - El viajero se queda sin el Coliseo y sin el Vaticano por dentro, aunque llegue a las 7:00 y se vaya a las 22:00.
    - El D0-medio repite Trevi y la Plaza de España, que ya vio el día 1.
    - El revisor B ya lo apuntó, y sigue sin resolver.
  - **(c) 3 días:** con última mañana, el día 2 es el D1; sin ella, el día 2 es el D0 (`DIAS` 948–950). La hora de la vuelta cambia un día de en medio, y eso va contra «los días de en medio no se mueven». Si el Coliseo está reservado el día 2, cambia la lista que se usa.
- **Propuesta:**
  - **(a)** El mismo día: la fila de llegada sobre el D0 (o sobre la ruta del Centro), cortada con la fila de salida. Como mínimo, el aviso «Hoy es un día completo» de la regla 17. Y decidir si la escala de crucero lleva barras.
  - **(b)** 2 días con la llegada en R1: el día 1 es el D1 (el Coliseo a su hora, por su tabla). Con la llegada en R2 o más tarde: el Centro por su fila, y el Coliseo y el Foro a «Si te sobra tiempo» del día 2. La última mañana, el D0-medio sin Trevi ni la Plaza de España si ya se vieron.
  - **(c)** El día 2 siempre es el D1. Sin última mañana, lo del Vaticano del D0 va a «Si te sobra tiempo» del día 2, sin cambiar el día.

---

## B. Importantes: casos frecuentes con la regla a medias o contradicha

### 9. El Free Tour el día de llegada
- **(a) 30 min o 15 min:** la tabla da «30 min para llegar a la Plaza de España» (`DIAS` 1015). La regla 4 (9-oct) dice 15 min para el Free Tour. Con 15 min, las fronteras serían 9:45, 11:45, 14:45 y 16:45, no 9:30, 11:30, 14:30 y 16:30.
  - **Propuesta:** una sola cifra (manda la regla 4), y la tabla se reescribe con ella.
- **(b) Las fronteras:** no dice si «16:30» es la fila de las 17:00 o «al día siguiente». La frase «cada tramo empieza en su hora» solo está en la otra tabla.
  - **Propuesta:** vale para todas las tablas. Las 16:30 en punto ya son «al día siguiente».
- **(c) Las fechas con el Free Tour solo a las 12:00** (24, 25 y 31 de diciembre, 1 y 6 de enero; `roma.json` → `horas_especiales`): la tabla de la llegada propone las 10:00, 15:00 o 17:00, que esos días no existen.
  - **Propuesta:** esos días, solo las 12:00 si queda libre antes de su frontera. Si no, el Free Tour no se propone ese día y la hoja lo dice.
- **(d) El dato viejo:** `roma.json` → `disponibilidad.horas` = `["10:00","16:00"]` (sin comprobar), y las horas de verdad son 10, 12, 15, 17, 19 y 21 (`freeTourHoras.js`).
  - **Propuesta:** que el dato lea `FREE_TOUR_HORAS`.
- **(e) La comida y el Free Tour de las 15:00:** con la llegada en R2 (libre de 13:00 a 14:30), la fila dice «comida nada más llegar», y la tabla del Free Tour pone el de las 15:00. Libre a las 14:20, la comida no cabe antes del tour, y después (sale a las 17:30) ya no es una comida. Nada lo resuelve.
  - **Propuesta:** con R2 y el Free Tour de las 15:00, la comida va antes, cerca de la Plaza de España, contada corta por dentro (regla 4). Si ni así llega, el tour pasa a las 17:00.
- **(f) El orden:** no dice dónde van «lo que el guía no enseña» (la Trinità, el Pincio y el Popolo) ni cómo se cruza con la fila. Por ejemplo, con R2 no hay ni Pincio ni Popolo. El tour acaba en Navona, y volver al Popolo es un zigzag.
  - **Propuesta:** la Trinità, antes del tour (al lado de la salida). El Pincio y el Popolo, antes del tour si es el de las 15:00 o el de las 17:00. Con el de las 10:00 o las 12:00, a «Si te sobra tiempo» (nunca después de Navona).
- **(g) El Free Tour pasa al día 2 (libre después de las 16:30):** el día 2 pasa a ser el D3 y el día 3 el D1-FT.
  - ¿Y si el viajero tiene reservado el Coliseo el día 2 o los Museos el día 3? El cambio movería un día con reserva, y la regla dice que no.
  - Además, el D3 repite todo lo que el día 1 ya vio (Trevi, el Panteón, la Plaza de España y Navona).
  - **Propuesta:** si el día 2 o el 3 tiene una reserva grande, no se cambia nada. El Free Tour sale como propuesta en «+ Añadir parada» con la hoja: «Con tu llegada, el Free Tour no cabe el día 1; si lo quieres, añádelo a otro día.»
- **(h) La tanda está vieja:** `PARA_CODE` 140 da las horas para reservar como «10, 12, 15, 17 o 21», sin las 19:00. Y en 125, «La de las 21:00, nunca sola» (falta la de las 19:00).

### 10. El Free Tour de las 19:00 o las 21:00 con el orden nuevo
- **Caso:** viaje de 4 días, con el Free Tour de las 21:00 reservado.
- **Qué dicen:** «el Free Tour va en la noche del D1». Con el orden nuevo, el D1 (la Roma antigua) es el día 2, y el tour repasa Trevi, la Plaza de España, el Panteón y Navona, todo visto el día 1. PENDIENTES 6y9 dice «la noche del D1» pensando en el orden viejo. Tampoco dice qué pasa si el viajero reserva el de las 21:00 para el día de llegada y está libre en R5 (de 20:30 a 23:00).
- **Propuesta:**
  - El tour de noche va en la noche del **día 1** (el Centro) si su fila deja la noche libre (R1–R4). Sustituye a la nocturna, y la cena va antes o después según la regla 4.
  - Si no se puede, en la noche del día 2.
  - Con la llegada en R5 o R6 y el tour del día 1 reservado: el aviso «no llegas a tiempo», sin quitar nada.

### 11. Una reserva grande el día de llegada o el de vuelta
- **(a) La Galería el día de llegada en un viaje de 3 días** (libre antes de las 13:00): «se cambian uno por otro» con el día que lleva el D4, pero en 3 días no hay D4.
  - **Propuesta:** la Galería y su parque, como bloque en el día 1 (como si estuviera libre después de las 13:00), y el Centro por su fila.
- **(b) El orden del bloque y el Centro** (libre después de las 13:00, por ejemplo el Coliseo a las 16:00): no dice si el bloque va antes o después de Navona, el Panteón, Trevi y la Plaza de España, ni dónde se cena. El Coliseo está en la otra punta, así que puede haber zigzag.
  - **Propuesta:** el bloque a su hora, y del Centro, lo que cabe antes (en su orden) y lo demás después, como la regla 4. Los dos órdenes, escritos para el Coliseo, los Museos y la Galería.
- **(c) El cambio trae repeticiones:** si el día de llegada pasa a ser el D1 con el Coliseo por la tarde, su lista «Por la tarde» lleva por la mañana el Panteón, Navona, San Luigi y el Gesù. El Centro, que pasa al día siguiente, se queda casi todo «de camino».
  - **Propuesta:** en ese cambio, el D1 lleva la otra parte del D1-FT (el Gueto y Trastevere) en lugar del centro.
- **(d) Dos reservas grandes en el mismo día corto** (el Coliseo y los Museos en la última mañana): no está escrito.
  - **Propuesta:** cada bloque a su hora, sin cuentas. Si se cruzan, el aviso «coinciden» de la regla 17.
- **(e) Las fronteras del aviso «no llegas»:** no dice si se compara la hora de la reserva con la hora en que queda libre, o con esa hora más los 30 min de «Llegada a…». Por ejemplo, el Coliseo a las 10:00 y libre a las 9:45.
  - **Propuesta:** con la hora en que queda libre, sin margen. La app avisa, no prohíbe.
- **(f) La reserva antes de estar libre:** sale el aviso, pero no dice qué enseña el día.
  - **Propuesta:** la reserva se queda en su sitio con el aviso, y el resto del día va por su fila.
- **(g) La reserva que empieza antes de salir pero acaba después** (el Coliseo a las 11:30, que dura 1 h 30, y la salida a las 12:30): no hay regla.
  - **Propuesta:** el aviso «Tu entrada al Coliseo es a las 11:30 y tu vuelo sale a las 15:30: revisa tu reserva», usando la duración de los datos.
- **(h) Una reserva pequeña el día de vuelta** (el Panteón, la Cúpula o el Castillo): para la llegada, la regla 4 dice que «se ajusta alrededor». Para la vuelta, no dice nada.
  - **Propuesta:** la parada va a su hora dentro de la última mañana, y lo de la media mañana que no quepa, a «Si te sobra tiempo».
- **(i) Los Museos en la última mañana de un miércoles:** el bloque es «Museos, Plaza y Basílica», pero los miércoles la Plaza y la Basílica nunca van antes de comer.
  - **Propuesta:** el miércoles, el bloque son solo los Museos. La Plaza y la Basílica, a «Si te sobra tiempo», o después de comer si hay comida.
- **(j) «Todo o nada»** (PENDIENTES, 6j y 6k) **contra «el bloque y el resto en su día»** (8-oct): convivirán bien si se escribe que «todo o nada» vale entre días enteros, y el bloque solo en el día de llegada y en el de vuelta.

### 12. La comida y la cena en la llegada
- **(a) La comida:** la fila R3 (libre de 14:30 a 17:00) no lleva comida porque «la regla 6 ya dice que la comida puede empezar hasta las 14:30» (`PROPUESTA` 181). Desde el 9-oct, la regla 6 dice las 15:00. Quien queda libre a las 14:40 se queda sin comer hasta la cena.
  - **Propuesta:** la frontera de R2 y R3 pasa a las 15:00, o se deja en las 14:30 con un motivo escrito.
- **(b) La cena en R5** (libre de 20:30 a 23:00): solo «Trevi de noche», sin cena. A las 20:45 se cena.
  - **Propuesta:** R5 lleva «Cena» (la de Trevi: Armando o Da Baffetto) si está libre antes de las 22:00. El texto se queda como está.
- **(c) El Centro entero empezando a las 9:00** (sin vuelos o en R1): son unas 5–6 h con los `~` del documento. La comida (Armando, junto al Panteón) caería hacia las 10:30 (demasiado pronto) o habría que volver desde el Popolo (zigzag). Y la tarde queda vacía hasta la cena. El documento dice además que este orden «deja el Pincio para el atardecer», y empezando a las 9:00 no es verdad.
  - **Propuesta:** escribir la versión «día entero» del Centro con la comida donde cae: el Tridente (Poldo e Gianna o Edy) para el orden desde Navona, y junto a Navona para el orden desde la Plaza de España.

### 13. La última mañana: cuál toca y qué cierra
- **(a) El DT-medio repite el día 1:** el Centro ya lleva Trevi, Via Condotti, la Plaza de España, la Trinità, el Pincio y el Popolo, y el DT-medio es casi lo mismo. Ya lo apuntó el revisor B, y sigue igual.
  - **Propuesta:** la media mañana se elige también por la fila de la llegada. Con R1 (o sin vuelos), el DA-medio o el D0-medio, lo que no se haya visto; con R2 en adelante, el DT-medio.
- **(b) La hora de empezar** del D0-medio, el DA-medio y la mañana del D6: no está escrita (solo la del DT-medio, a las 7:30).
- **(c) Pascua y Navidad:** con el D0-medio, el Papa da la bendición en San Pedro y la plaza se llena (`roma.json`, «Hemos puesto tu visita al Vaticano otro día»). En la última mañana no hay otro día.
  - **Propuesta:** esos días, el DT-medio o el DA-medio en su lugar, porque lo eligió la app, con la línea de la fecha especial.
- **(d) «Se cambia con un día entero»** (`PARA_CODE` 86): con los Museos marcados un domingo en la última mañana, no está claro qué se cambia por qué.
  - **Propuesta:** los Museos pasan al día entero del Vaticano si no está ya allí. Si ya están, «Cerrado hoy».
- **(e) La mañana del D6 en miércoles:** la Cúpula va al final, desde las 12:30, y con la última mañana casi nunca entra. Va a «Si te sobra tiempo» y no pasa nada, pero conviene escribirlo.
- **(f) El DA-medio en domingo:** la comida en el Mercado de Testaccio sigue «por comprobar» (`PENDIENTES_6K` 178).

### 14. Un cierre que cae en el día de llegada o en el de vuelta
- **Caso:** el día 2 es el 25 de diciembre (el Coliseo cierra) y el día 3 el 26 (los Museos cierran).
- **Qué dicen:** «primero se cambian el D1 y el D2; si no, con el día siguiente». El día siguiente puede ser el de vuelta, que no es entero. No dice que el día de llegada y el de vuelta no valgan para un cambio.
- **Propuesta:**
  - Con vuelos, un día corto (el de llegada o el de vuelta) nunca recibe ni da un día entero por un cierre.
  - Si no queda otro día entero, lo cerrado sale «Cerrado hoy» en su día, con el aviso en la campana.
  - Sin fechas no hay cierres de este tipo (como ahora).

### 15. El interruptor del día 4 y las excursiones con vuelos
- **(a) Un caso que nunca se da:** «si la puso la app por defecto, pasa a Roma». En los viajes de 4 días el interruptor ya sale en «Roma» por defecto (`roma_hasta_dias: 4`), y desde 5 el día 4 nunca es el de vuelta. Esa rama no se da nunca. Solo se da la de «la eligió el viajero».
- **(b) Ostia o Tívoli el día de vuelta:** «solo con el vuelo a las 18:00 o más tarde». No dice nada de los trenes, los autobuses ni el barco. Choca con «la excursión, en el día 4 si es entero».
  - **Propuesta:** se elige por la hora de salir, la misma para todos los puntos. En la matriz: Fiumicino 18:00, Ciampino 17:50, Termini 15:45, Tiburtina 15:55 y Civitavecchia 18:50.
- **(c) [Mantener la excursión] con una vuelta de madrugada:** se compara con la hora de salir de la noche anterior (ver el punto 6c).
- **(d) Excursión reservada el día de llegada, después de estar libre:** no dice qué pasa con el Centro de ese día.
  - **Propuesta:** el día lleva solo la excursión, como cualquier día de excursión, y el Centro pasa a «Si te sobra tiempo» del día 2.

### 16. La hora del vuelo sin el aeropuerto elegido
- **Caso:** el viajero pone la hora del vuelo y no toca Fiumicino ni Ciampino. O pone la hora del tren sin decir Termini ni Tiburtina.
- **Qué dicen:** el margen sale del punto (`al_centro_min`). `barTextOf` acepta un punto vacío, pero no dice con qué margen se elige la fila.
- **Propuesta:**
  - Sin punto, el margen más largo de ese medio: Fiumicino en avión y Tiburtina en tren. Es lo prudente.
  - La ventana de llegada enseña todos los puntos, como ahora.

### 17. Gratis, de pago y la ruta a mano
- **(a)** `DIAS` 1090 y `PARA_CODE` 246 dicen que lo gratis y lo de pago «se decide al final». `PENDIENTES_LLEGADAS` dice que con horas es de pago («x de 3» / «x de 2»). Manda lo segundo: hay que cambiar el documento.
- **(b) Si deja de pagar** con las horas ya puestas: no está escrito.
  - **Propuesta:** las horas se guardan, y los días vuelven a ser enteros, con la misma hoja que al borrar la hora.
- **(c) La ruta a mano:** ¿se recorta? Está sin decidir (PENDIENTES).
  - **Propuesta:** no se recorta nunca, porque lo suyo manda. Salen las barras y dos avisos sin horas calculadas: «Tienes paradas antes de tu llegada» y «Tienes paradas después de tu vuelo». «Reorganizar este día» no mira el vuelo.
- **(d) Los días cambiados a mano:** «no se tocan», bien. Pero si el viajero tiene paradas antes de su llegada, ¿sale algún aviso? Propuesta: el mismo de la ruta a mano.

---

## C. Menores: fronteras, textos y datos

### 18. «Para tu zona» y el último tren
- **(a)** Solo hay dato del último tren de Fiumicino (el Leonardo, a las 23:23, desde el aeropuerto). De Ciampino (Airlink y autobuses) y de Civitavecchia no hay. Code no lo inventa: pendiente de Eric.
- **(b) La frontera:** no dice si se compara la hora de aterrizar con la del último tren (quien aterriza a las 23:10 no llega al de las 23:23).
  - **Propuesta:** usar el dato: `al_centro_min` (60) menos el tren (32 min) = unos 28 min desde que aterriza. Con aterrizar a las 22:55 o más tarde, lo primero es el taxi.
- **(c) Antes del primer tren:** el Leonardo empieza a las 5:38 desde el aeropuerto y a las 4:50 desde Termini. No dice nada de las llegadas de madrugada ni de las vueltas muy tempranas.
  - **Propuesta:** la misma regla: lo primero, el taxi.

### 19. Fronteras que hay que escribir una vez para todas las tablas
- **La regla:** «cada tramo empieza en su hora».
- **Dónde está escrita:** solo en la tabla de la llegada.
- **Las tablas que la necesitan:** la del Free Tour (9:30, 11:30, 14:30 y 16:30), la madrugada (5:00), las vueltas (9:00), el último tramo de la llegada (23:00) y «comida si sale a las 14:30 o más tarde» (aquí sí dice «o más tarde», bien).
- **La excepción del Coliseo** («hasta las 13:00 incluida») es lo contrario. Que quede escrita como excepción.
- **El redondeo:** `centerMinutesOf` redondea al 5 más cercano. Con la rueda de 5 en 5 no cambia nada, pero una hora suelta (11:28) cambiaría de fila. Propuesta: no redondear, o elegir la fila por la hora de llegada (ver la matriz).

### 20. Textos según el medio, sin fechas, y el nombre del día
- **(a)** Solo los textos de las 20:30 cambian con el medio («Aterrizas / Llegas a Termini / Desembarcas»). «No llegas a tiempo… y aterrizas a las 9:30», «Tienes el vuelo a las 17:00…» y «Había excursión» dicen siempre «vuelo» y «aterrizas».
  - **Propuesta:** la misma tabla de palabras para todos (vuelo, tren, autobús o barco; aterrizas, llegas a o desembarcas).
- **(b) Sin fechas:** la hoja del resumen dice «El martes 10 es tu llegada». No está escrita la versión «El día 1…». Y con fechas, «Ya lo visitaste el día 1» y «El día 3 lo has cambiado tú» van contra «los días por su fecha».
- **(c) El nombre del día 1:** «Llegada a Roma, con o sin vuelos» (`DIAS` 977) choca con el título que sale de lo que se ve (6y7, `tituloDelDia.ts`: «Centro histórico»). Hay que elegir uno.

### 21. Lo visto de noche, ¿cuenta como visto?
- **Caso:** llegada en R5, con Trevi de noche, «primer contacto».
- **Qué dicen:** «La nocturna de la llegada cuenta para el viaje: no se repite otra noche». No dice si cuenta para la regla 9 de día. ¿El D4 se salta Trevi sin gente?
- **Propuesta:** la nocturna cuenta solo como nocturna. De día, Trevi sigue siendo parada (ver el punto 2).

### 22. La zona sin elegir
- **Caso:** el viajero no ha tocado «¿En qué zona te alojas?».
- **Qué dicen:** «Aún no lo sé» cuenta como Centro. Sin tocar nada (vacío), no lo dice para el orden del día 1. Para «Para tu zona» sí: «como ahora».
- **Propuesta:** vacío = «Aún no lo sé» = empieza en Navona.

### 23. Medios mezclados y coche
- **Caso:** la ida en coche (sin hora) y la vuelta en avión con hora.
- **Qué dicen:** «La vuelta usa su propio medio», pero no dice que el día 1 sea entero y el último se recorte.
- **Propuesta:** escribirlo así: cada barra con su medio, y el recorte solo donde hay hora.

### 24. El mercadillo de Navona en la llegada
- **Caso:** del 8 de diciembre al 6 de enero.
- **Qué dicen:** el D0 y el D1 llevan «Piazza Navona y su mercadillo navideño», y la ruta del Centro, que pasa por Navona, no.
- **Propuesta:** la misma línea en el Centro.

### 25. Lo viejo de la tanda
- **Las pruebas:** `PARA_CODE` §13 pide las 365 fechas. La regla nueva (12-oct) pide unas 60 durante la tanda y las 365 al final del día.
- **Los medios días:** `DIAS` 127 habla todavía de «3 días que pasa a 2,5».
- **Las tablas repetidas:** la tabla vieja de «Qué días lleva cada viaje» (95–127) sigue arriba, duplicada con la nueva (857–890). PENDIENTES manda dejar una sola antes de pasar la tanda.
