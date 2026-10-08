# Llegadas y vueltas: repaso completo y propuesta

*Para Eric · 8-oct-2026, tarde.* Lo he repasado todo: lo que decidimos hoy, el documento y **cómo está hecha la app por dentro**. Después, otro agente lo ha revisado sin haber visto cómo lo hice, y he arreglado lo que encontró. Ya está escrito en el documento de días y en la Tanda 7, listo para Code. **No le pases nada hasta que lo repases.**

Cada punto lleva su marca:
- ✅ **Decidido:** lo hablamos tú y yo.
- 🆕 **Lo propongo yo:** está dentro, pero si no te gusta, lo quito.
- ⚠️ **Cambia algo que ya habíamos decidido.**

---

## 1. En un minuto

**Lo más importante que he encontrado:** la app **ya tiene medio camino hecho**:
- en RESERVAS ya se pone la hora del vuelo y se elige Fiumicino o Ciampino;
- ya hay una barra de llegada y de vuelta en cada día;
- ya hay una ventana de llegada con todas las formas de ir y sus precios comprobados;
- ya hay una campana de avisos.

Pero también hay cosas viejas que chocan con lo nuevo. La Tanda 7 de antes no lo decía, y Code habría hecho cosas repetidas. Ahora le digo qué usar y qué quitar.

**Lo que propongo o cambio, en una línea cada cosa:**
1. 🆕 Usar lo que ya hay en RESERVAS, sin campos nuevos. La zona va en el bloque del alojamiento.
2. 🆕 Quitar de la app todo lo que enseña la hora a la que está libre o dice «centro»: «EN EL CENTRO 10:00» en la barra y «Libre hacia las…» en RESERVAS.
3. 🆕 Quitar la ventana vieja «¿Ajustamos tu ruta a tu vuelo?» y el botón «Ajustar este día a tu llegada»: lo nuevo lo hace solo.
4. 🆕 Las horas, de un solo sitio: los tiempos que ya están comprobados en la app.
5. ✅ El día 1 es **una sola ruta para todos, el centro histórico**, recortada por la hora de llegada con la tabla que te gustó (con comida si está libre de 13:00 a 14:30). Empieza en Navona, o en la Plaza de España si duerme allí. Fuera las seis listas por zona.
6. 🆕 La nocturna del día de llegada puede ir en taxi de 15 min, como ya hace el D3. Si no, muchas veces no habría ninguna.
7. ⚠️ Lo que ves el día de llegada cuenta como visto los días siguientes. Así no se repite Navona dos días seguidos.
8. ⚠️ Con el Free Tour el día de llegada, los días enteros son D1 y D2, no D1-FT y D2: esos dos tienen la misma tarde de Trastevere. Lo escribí yo mal esta mañana.
9. ✅ **El orden de los días cambia, también sin vuelos** (tu idea de esta noche): el día 1 es el centro, los días 2 y 3 el Coliseo y el Vaticano, y el día 4 el interruptor. Al poner los vuelos solo cambian el primer y el último día.
10. 🆕 La última mañana: si no cabe entera, lo del final a «Si te sobra tiempo», y la comida solo si sale a las 14:30 o más tarde.
11. 🆕 Si con los vuelos el día 4 pasa a ser el de vuelta, la excursión que puso la app pasa a Roma sola. Solo se pregunta si la eligió él.
12. 🆕 «Para tu zona»: cómo llegar desde su aeropuerto a su zona, arriba de la ventana de llegada que ya existe.

---

## 2. Lo que he visto dentro de la app

| Lo que ya existe | Qué hacemos |
|---|---|
| En RESERVAS, la hora de llegada y la de salida, y los botones Fiumicino y Ciampino | Se usan tal cual |
| `_llegada.json`: cuánto se tarda desde cada aeropuerto o estación, con precios y fuentes comprobadas en septiembre | Es la única fuente de las horas |
| La barra de cada día: «LLEGADA · VUELO 09:00 · FIUMICINO · **EN EL CENTRO 10:00**» | Se queda, pero **sin «EN EL CENTRO»**: rompe la regla y enseña una hora que no queremos enseñar |
| En RESERVAS, la tarjeta del primer y el último día: «Libre hacia las 10:00» y «Ajustado / Lo ajustas tú / Por ajustar» | **Fuera,** por lo mismo |
| La ventana de llegada (Resumen · Traslados · Tips), con todas las formas de ir y la consigna | Se queda, con «Para tu zona» arriba. Sus textos dicen «Cómo llegar al centro» o «De Fiumicino al centro»: pasan a «a Roma» o «a tu zona» |
| La ventana «¿Ajustamos tu ruta a tu vuelo?», con «Sí, ajústala por mí» y «No, lo hago yo» | **Fuera.** Es de la época de antes de los días escritos |
| El botón «Ajustar este día a tu llegada / vuelta», en DÍAS | **Fuera,** por lo mismo |
| La campana de avisos de arriba, con su número | Ahí se quedan los avisos que son un problema |
| La etiqueta naranja «Día de viaje» | Se queda |

**Por qué importa:** sin esto, Code habría hecho dos sitios donde poner el vuelo, dos formas de rehacer el primer día, y la app seguiría diciendo «centro» y enseñando la hora libre.

---

## 3. La idea de fondo (lo que manda en todo)
1. **Paradas, no minutos.** Nosotros ponemos qué ver; él decide cuándo. HOY ajusta el resto. (✅ lo dijiste tú)
2. **Lo que él ha elegido o pagado no se toca sin preguntar.** Lo que puso la app por defecto, sí se puede cambiar sola.
3. **Una sola hoja por cambio.** Si al poner el vuelo cambian cuatro cosas, sale una hoja con las cuatro, no cuatro hojas.
4. **La hoja de abajo es para lo que acaba de pasar, la campana para lo que sigue mal.** (✅)
5. **Ningún texto para el viajero dice «centro» ni nombra a un proveedor.** (✅) Los nombres de zona («Centro (Panteón, Trevi, Navona)») sí, porque son los que tú elegiste.

---

## 4. Un viaje de ejemplo, paso a paso

**Ana va a Roma del martes 10 al sábado 14 de agosto de 2027.** No ha marcado el Free Tour, y el día 4 está en «Excursión», que es lo que sale por defecto en 5 días. Pone sus vuelos en RESERVAS:
- **llegada:** el martes 10, a las 11:30, en Fiumicino;
- **vuelta:** el sábado 14, a las 18:00, desde Fiumicino;
- **zona:** Centro.

**Paso 1, a qué hora está libre:** 11:30 + 1:00 de tren (el dato de Fiumicino) + 0:30 para dejar la maleta = **13:00**. Esto no se enseña; solo sirve para elegir el tramo.

**Paso 2, el martes 10 (llegada):** está libre a las 13:00, así que le toca el tramo de 13:00 a 14:30 (propuesta 5): comida nada más llegar, los imprescindibles del centro, cena y nocturna.
- **La comida:** la del Centro, Armando al Pantheon.
- **Los imprescindibles del centro:** Piazza Navona, el Panteón (por fuera), la Fontana de Trevi y la Plaza de España con la Trinità. El Pincio y el Popolo no entran.
- **La cena,** donde acaba: Il Gabriello.
- **La noche:** su viaje es de más de 2,5 días, así que la nocturna no puede ser algo que ya ha visto hoy (regla 11c). Trevi, la Plaza de España, el Panteón y Navona ya están vistos. Andando no queda ninguna a 15 min. Con la propuesta 6, taxi de 15 min al **Coliseo de noche**, que además es de las imprescindibles. Sin ella, se quedaría sin noche el primer día.
- **Con tu tabla de esta mañana,** Ana no comería: «de 13:00 a 17:00, sin comida».

**Paso 3, los días de en medio no se mueven.** Sin vuelos, el viaje de Ana ya era así (el orden nuevo):

| Día | Sin vuelos | Con sus vuelos |
|---|---|---|
| martes 10 | Centro, entero | llegada: comida, los imprescindibles del centro, cena y nocturna |
| miércoles 11 | D1 (Coliseo) | D1 (Coliseo) |
| jueves 12 | D2 (Vaticano) | D2 (Vaticano) |
| viernes 13 | Excursión | Excursión |
| sábado 14 | D4 (Villa Borghese) | última mañana |

- El D2 va el jueves y el D1 el miércoles, que así el Vaticano no cae en miércoles, el día de la audiencia del Papa.
- El miércoles por la tarde, Navona sale «de camino», con «Ya lo visitaste el día 1». El Panteón se queda como parada, porque ese día se entra. Como Armando ya salió en la comida del martes, la cena del miércoles es en Da Baffetto (no se repiten restaurantes).
- **Si Ana ya había reservado el Coliseo para el miércoles,** sigue igual. Con el orden de antes (el Coliseo el día 1), al poner el vuelo se le habría movido.

**Paso 4, el sábado 14 (vuelta):**
- **La hora de salir:** vuelo a las 18:00 − 3:00 = **15:00**. Para la maleta, 1:00 menos: tiene de las 9:00 a las 14:00. Son 5 h, así que hay última mañana.
- **La mañana:** el viaje lleva el D1 y el D2, así que toca el DT-medio (el Popolo, Santa Maria del Popolo, el Pincio y la Trinità). Es la misma zona que el día de Villa Borghese que tenía antes, así que casi no cambia. Trevi y la Plaza de España, que vio el martes, salen «de camino».
- **La comida:** sale a las 15:00, así que sí hay comida, en el Tridente.

**Paso 5, lo que ve Ana:** una sola hoja abajo.
> «El martes 10 es tu llegada a Roma.
> El sábado 14 tienes una última mañana por Roma, antes de salir hacia el aeropuerto a las 15:00.»
> [De acuerdo]

**Paso 6, la ventana de llegada:** arriba, «Para tu zona: Leonardo Express a Termini y bus 40 o 64 hasta Largo di Torre Argentina». Debajo, el taxi de 55 € y las demás formas, como ahora.

---

## 5. Punto por punto, con el porqué

### 5.1 Dónde pone los datos
- ✅ **En RESERVAS, nunca en el formulario.**
- 🆕 **Las horas y los aeropuertos que ya existen,** sin campos nuevos. La vuelta puede ir en otro medio que la ida, como ya hace la app.
- 🆕 **«¿En qué zona te alojas?»,** dentro del bloque del alojamiento de RESERVAS. Ya existe y ya se le pide al viajero («añade tu vuelo y tu alojamiento»). Sirve para saber por dónde empieza la ruta del día 1 y para «Para tu zona».
- 🆕 **Debajo de la hora, en pequeño:** «¿Llegas o te vas otro día? Cambia las fechas del viaje». **Por qué:** la app supone que el vuelo de ida es el día 1 y el de vuelta el último. Si alguien llega el día antes, que lo arregle con el cambio de fechas que ya existe.
- 🆕 **En coche, sin hora,** como ahora: días enteros.

### 5.2 Las horas
- 🆕 **De un solo sitio:** los tiempos comprobados de `_llegada.json`, más 30 min para dejar la maleta. Cambian un poco respecto a lo que pusimos esta mañana:

  | Punto | Esta mañana | Ahora | Por qué |
  |---|---|---|---|
  | Fiumicino (llegada) | 1:30 | 1:30 | igual |
  | Ciampino (llegada) | 1:15 | 1:20 | el dato comprobado da 50 min de traslado |
  | Termini (llegada) | 0:45 | 0:45 | igual |
  | Tiburtina (llegada) | 0:45 | 0:55 | desde Tiburtina hay que coger el metro |
  | Civitavecchia (llegada) | 2:00 | 2:30 | son 80 km: lanzadera, tren y metro |
  | Fiumicino (vuelta) | 3:00 | 3:00 | igual |
  | Ciampino (vuelta) | 2:30 | 2:50 | lo que ya tiene la app |
  | Termini (vuelta) | 1:00 | 0:45 | lo que ya tiene la app |
  | Tiburtina (vuelta) | 1:00 | 0:55 | lo que ya tiene la app |
  | Civitavecchia (vuelta) | 3:00 | unas 3:50 | lo que ya tiene la app: el embarque y el trayecto al puerto |

  **Por qué:** si las horas están en dos sitios, algún día no coinciden y la barra dice una cosa y el día otra.
- 🆕 **Vuelos de madrugada:**
  - **aterrizar a las 0:30:** el día 1 es un día entero normal (duerme y empieza a su hora);
  - **despegar a la 1:00:** cuenta como la noche anterior. El último día solo lleva el traslado y el de antes acaba sin nocturna;
  - **despegar entre las 5:00 y las 9:00:** el día de antes es normal y el último solo lleva el traslado.

  **Por qué:** si no, la app creería que a las 0:30 está libre para ver Roma entera.
- 🆕 **Llegar y irse el mismo día:** de momento, el día de siempre de un viaje de 1 día (D0), con las dos barras. Es el mismo caso que la escala de crucero, que haremos aparte.

### 5.3 Los días reales
- ✅ **El orden nuevo, para todos los viajes de 3 días o más (tu idea):**
  - día 1, el centro: la «Llegada a Roma», la ruta del centro histórico entera, aunque no haya vuelos (con Free Tour, con el Free Tour a las 10:00);
  - días 2 y 3, el Coliseo (D1) y el Vaticano (D2), en el orden que pidan los cierres;
  - día 4, el interruptor; después, Villa Borghese, las basílicas y Roma desde arriba.
- ✅ **Con vuelos, el viaje es el mismo:** el día 1 se recorta por la hora de llegada y el último pasa a ser la última mañana (3 h o más) o solo el traslado. Los días de en medio no se mueven.
- **Lo que trae el orden nuevo, para que lo sepas:**
  - **en viajes de 3 días, el día de Villa Borghese ya no entra.** La Galería se puede añadir desde el pool o con «+ Añadir parada». La Plaza de España, el Pincio y el Popolo ya salen el día 1;
  - **en viajes de 6 días con Roma, la Vía Appia (D7) ya no entra:** solo en los de 7 o más;
  - **el D4, detrás del día del centro,** va siempre en su versión sin Trevi a primera hora (ya la viste el día 1);
  - **la ruta de 1,5 días hecha a mano (D1-corto) ya no se usa:** con un solo día entero, el centro ya sale el día 1, así que va el D1 y, en la última mañana, el D0-medio;
  - **el único caso en que el Coliseo y el Vaticano cambian de día al poner los vuelos:** el Free Tour marcado, sin reservar, y llegar libre después de las 16:30. Entonces el Free Tour pasa al día 2 a las 10:00, con el Vaticano por la tarde.
- 🆕 **La última mañana:**
  - empieza a la hora escrita de su medio día (el DT-medio, a las 7:30, con Trevi sin gente);
  - si no cabe entera antes de la hora de salir, lo del final pasa a «Si te sobra tiempo», como en cualquier día;
  - la comida, solo si sale a las 14:30 o más tarde. Con un vuelo a las 16:00 se sale a las 13:00 y la comida no cabe;
  - cuál toca: sin el Vaticano en un día entero, el D0-medio (el Vaticano); con el Coliseo y el Vaticano, el DT-medio (el Tridente y el Pincio); con Villa Borghese también, el DA-medio (el Aventino).
- ✅ **Con una reserva grande en la última mañana** (lo hablamos por la noche): la reserva manda. A esa mañana va solo su bloque (Coliseo + Arco + Foro y Palatino; Museos + Plaza + Basílica; Galería + parque), si cabe antes de recoger la maleta. Lo que no cabe se queda en su día, salvo el Foro, que va con la misma entrada y lleva su hoja. El resto de su día se queda donde estaba: no se pierde ni se repite nada.
- 🆕 **El día de llegada, igual:** si está libre antes de las 13:00, el día entero de ese sitio; si llega más tarde, solo el bloque, como en la última mañana.
- 🆕 **Los cierres en la última mañana:** ya estaban casi resueltos. El D0-medio tiene su versión del miércoles y el DA-medio la del lunes. Solo hay que decirle a Code que la última mañana cumple las mismas reglas que cualquier día.
- 🆕 **El interruptor del día 4,** como sin vuelos (4 días, «Roma»; 5 o más, «Excursión»). Con el orden nuevo, la excursión no se mueve al poner los vuelos.
- **Para que lo sepas:** los medios días «de tarde» que escribimos (D0-medio, DT-medio y DA-medio de tarde) ya no se usan, porque la tarde de llegada es la ruta del centro. Se quedan guardados, sin borrar.

### 5.4 El día de llegada
- ✅ **Una sola ruta para todos, el centro histórico** (lo decidiste esta noche): Navona · Panteón · Trevi · Plaza de España · Trinità · Pincio · Popolo. Fuera las seis listas por zona, que con el orden nuevo repetían lo de los días 2 y 3. La zona solo decide por dónde empieza:
  - **Centro, Prati, Trastevere, Monti y Termini:** empieza en Navona. Para el Centro, que me pediste que eligiera: así deja el Pincio para el atardecer, cena en el Tridente y vuelve por Trevi, que le pilla de camino a su alojamiento;
  - **Plaza de España:** empieza en la Plaza de España, sube a la Trinità y al Pincio, baja al Popolo y vuelve por Via del Corso a Trevi, el Panteón y Navona. Una vuelta, sin volver atrás.
- ✅ **La tabla, con lo que me dijiste de los imprescindibles:** lo primero que se quita es el Pincio y el Popolo. Navona, el Panteón, Trevi y la Plaza de España con la Trinità se quedan siempre que esté libre antes de las 20:30, de día o de noche.

  | Libre a las… | Qué ve el día 1 |
  |---|---|
  | antes de las 13:00 | toda la ruta, con el Pincio y el Popolo, comida, cena y nocturna |
  | de 13:00 a 14:30 | comida y los imprescindibles (Navona, Panteón, Trevi, Plaza de España y Trinità); cena y nocturna |
  | de 14:30 a 17:00 | los imprescindibles; cena y nocturna |
  | de 17:00 a 20:30 | **desde Navona:** Navona y el Panteón, cena, y de noche Trevi y la Plaza de España. **Desde la Plaza de España:** la Plaza de España y la Trinità, el Panteón y Navona, cena, y de noche Trevi |
  | de 20:30 a 23:00 | Trevi de noche, «para un primer contacto» |
  | después de las 23:00 | nada |

  **Por qué la comida de 13:00 a 14:30:** la regla 6 del documento ya dice que la comida puede empezar hasta las 14:30. Un español libre a las 13:30 come, y es justo la hora a la que llegan muchos vuelos de la mañana desde España.
- 🆕 **Si está libre antes de las 9:00, el día empieza a las 9:00.** Es lo que dijiste: «el día comienza cuando toca».
- 🆕 **La nocturna, si ya vio Trevi y la Plaza de España ese día** (los tres primeros tramos): en viajes de 2,5 días o más no se puede repetir algo visto ese día (regla 11c), así que va otra a 15 min o menos de la cena, andando o en taxi, como ya hace el D3. Primero las imprescindibles: suele ser el Coliseo.
- ✅ **El texto de las 21:00, según cómo llega:**
  - avión: «Aterrizas a las 21:00…»;
  - tren o autobús: «Llegas a Termini a las 21:00…» (o a Tiburtina);
  - barco: «Desembarcas a las 21:00…».

  El resto es el tuyo: «Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»
- ⚠️ **Lo visto en la llegada cuenta como visto.** Antes decidimos que no contaba, para que el D1 siguiera entrando en el Panteón. Propongo cambiarlo con una excepción:
  - lo que el día siguiente ve **por fuera**, pasa a «de camino» con «Ya lo visitaste el día 1»;
  - lo que el día siguiente ve **por dentro** (el Panteón, la Basílica), se queda como parada.

  **Por qué:** si no, Ana ve Navona el martes y otra vez el miércoles como parada, y parece un fallo. Así el D1 sigue entrando en el Panteón, que era lo que queríamos proteger. Es la misma regla 9 que ya usamos en todo el viaje.

### 5.5 El Free Tour
- ✅ **El día de llegada:** si está reservado, manda su hora. Si solo está marcado, la hora sale de la tabla (10, 12, 15 o 17). Después de las 16:30, al día siguiente.
- ✅ **En «+ Añadir parada»:**
  - el primero de la lista;
  - en su ficha, [Añadir al Día n] y [Reservar Free Tour] con tu enlace;
  - fuera la hoja de la hora;
  - la hora se pone al reservar (con la de las 12:00, que faltaba).
- 🆕 **Con la llegada y el Free Tour el mismo día:** de la ruta solo sale lo que el guía no enseña (la Trinità, el Pincio y el Popolo). **Por qué:** el guía ya pasa por la Plaza de España, Trevi, el Panteón y Navona.
- ⚠️ **Con el Free Tour en la llegada, los días enteros son D1 y D2.** Esta mañana escribí «D1-FT y D2», y está mal: el D1-FT y el D2 tienen la misma tarde (la Isla Tiberina, Santa Maria in Trastevere, el Janículo y el paseo). El D1 normal hace el centro por la tarde. Lo que ya enseñó el guía (Navona) va «de camino» y el Panteón por dentro se queda.
- 🆕 **Con uno o ningún día entero,** el Free Tour solo va el día de llegada. Si no cabe ahí, no se pone y se le dice. **Por qué:** con un solo día, meter el Free Tour quita el Coliseo o el Vaticano. Que decida él, añadiéndolo a mano.

### 5.6 La excursión
- ✅ Reservada: no se toca nunca.
- ✅ Los avisos del día de llegada y del de vuelta.
- 🆕 **Con los vuelos, el día 4 pasa a ser el de vuelta (un viaje de 4 días) y la excursión no está reservada:**
  - **si la puso la app por defecto,** ese día pasa a Roma solo, con su última mañana y el texto que ya tenemos: «Tienes el vuelo a las 17:00, hacer una excursión no es viable, pero te hemos organizado una última mañana por Roma…»;
  - **si la eligió él,** se le pregunta: «Con tus vuelos, el día 4 es el de tu vuelta: no da tiempo a la excursión a Pompeya.» [Pasar este día a Roma] · [Mantener la excursión].

  **Por qué:** casi nadie toca el interruptor antes de poner el vuelo. Preguntarle por algo que no ha elegido es una pregunta de más.

### 5.7 Las reservas
- ✅ «No llegas a tiempo», «después de la hora de salir» y «ese sitio cierra ese día».
- ✅ Una reserva grande el día de llegada o en la última mañana: ver 5.3.

### 5.8 Los avisos
- ✅ La hoja de abajo y la campana.
- 🆕 **Al borrar la hora del vuelo,** los días vuelven a ser enteros, con la misma hoja, y las reservas se quedan.
- 🆕 **Los días que ha cambiado a mano** no se rehacen nunca, y la hoja lo dice: «El día 3 lo has cambiado tú: lo dejamos como está». Es la regla que ya puso Code en la 6j.

### 5.9 «Para tu zona» (el extra que te propuse)
- 🆕 **Arriba de la ventana de llegada que ya existe,** una línea con lo más cómodo para su zona. Debajo, todo lo demás, como ahora.

  | Zona | Desde Fiumicino |
  |---|---|
  | Termini | Leonardo Express a Termini |
  | Monti | Leonardo Express y metro B hasta Cavour |
  | Centro | Leonardo Express y bus 40 o 64 hasta Largo di Torre Argentina |
  | Plaza de España | Leonardo Express y metro A hasta Spagna |
  | Prati | Leonardo Express y metro A hasta Ottaviano |
  | Trastevere | tren FL1 hasta Roma Trastevere y tranvía 8 |

  - Desde Ciampino, el Airlink a Termini y luego lo mismo.
  - El taxi de precio fijo (55 € o 40 €) sale siempre como opción; a Prati va por taxímetro.
  - Si aterriza después del último tren (23:23), lo primero es el taxi.
- **Por qué lo dejo dentro:**
  - usa solo líneas y precios que la app ya tiene comprobados;
  - es lo primero que necesita al aterrizar;
  - ninguna app te lo da hecho para tu zona.
- **Lo que no sé seguro, y Code no lo inventa:** si el tren de Civitavecchia para en Roma Trastevere.

---

## 6. Lo que queda fuera de esta tanda (y por qué)
- **La escala de crucero** (llegar y salir el mismo día). Es otra forma de viaje, sin hotel; va en su tanda. Llegar en barco o en ferry para quedarse sí entra: es como un avión.
- **Varias ciudades.** Las reglas se escriben ya para que mañana sirvan para cada ciudad, pero no cambiamos cómo se guarda el viaje. Lo haremos cuando haya una segunda ciudad escrita.
- **La zona para el día de vuelta.** Se cuenta desde el centro, que es lo que más tarda.
- **Gratis o de pago.** Al final, como dijiste. Lo de las llegadas está todo junto en un sitio, así que luego será fácil cerrarlo.

---

## 7. Por qué esto vale dinero
Lo que ninguna app hace y la tuya sí, cuando el viajero pone su vuelo:
1. **El primer día está pensado para su hora:** no un día entero imposible ni un día vacío.
2. **El último día le deja una mañana bonita** y le dice a qué hora salir.
3. **Le dice cómo llegar a su zona** desde su aeropuerto, con precios comprobados.
4. **Le avisa de lo que le puede fastidiar el viaje:** una reserva a la que no llega o una excursión que su vuelo no permite.
5. **No le toca nada de lo que ha elegido o pagado** y se lo explica en una sola hoja.

---

## 8. Lo que tienes que decidir tú
Si no me dices nada, va como está. Lo marcado con ⭐ es lo que más me importa que mires:
1. ⭐ **¿Lo visto en la llegada cuenta como visto (⚠️)?** Yo: sí, con la excepción de lo que se ve por dentro.
2. ⭐ **¿La nocturna de la llegada puede ir en taxi de 15 min, si ya vio Trevi?** Yo: sí, o muchas veces no habrá noche el primer día.
3. **¿Pasar a Roma sola la excursión que puso la app, si el día 4 es el de vuelta?** Yo: sí.
4. **¿«Para tu zona» entra ya?** Yo: sí, es poco trabajo y se nota mucho.
5. **¿Quitar la ventana vieja «¿Ajustamos tu ruta a tu vuelo?» y la tarjeta «Libre hacia las…»?** Yo: sí. Lo nuevo lo hace solo y explica qué ha cambiado.

Cuando me digas, lo ajusto y le pasas a Code el texto de `PROMPT_TANDA7_PARA_PEGAR.md`.
