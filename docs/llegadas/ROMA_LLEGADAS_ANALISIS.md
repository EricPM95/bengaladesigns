# El día de llegada y el de vuelta en Roma: cómo funciona hoy y qué propongo

Fecha: 4-nov-2026. Repositorio leído en `main` (último commit `acb8ba1`). No se ha cambiado nada del repositorio.
He ejecutado el motor de verdad (sin red) con dos guiones de prueba propios:
`/tmp/claude-0/-home-claude/65df8d95-7f50-5904-8e5d-59b6bce90948/scratchpad/agente_roma/dia1.mjs` y `/tmp/claude-0/-home-claude/65df8d95-7f50-5904-8e5d-59b6bce90948/scratchpad/agente_roma/vuelta.mjs`.

Primero va la explicación en español sencillo. Las referencias para el programador (archivo:línea) están al final, en el apartado 7.

---

## Resumen en 6 frases

1. Hoy **no hay una sola forma** de montar el día 1 con vuelo. Hay **tres**, y no dan lo mismo.
2. La que usa casi todo el mundo con pase (poner el vuelo en RESERVAS y pulsar «Sí, adaptarlos») **no monta un día de llegada**. Coge el día 1 normal (el del Coliseo o el del Vaticano) y **le quita lo que no cabe**. No añade nada nuevo. Por eso, si llegas por la tarde, el día se queda casi vacío y con paradas desordenadas.
3. Las tablas buenas del día de llegada (la «ruta del centro», «la rápida», la de la noche…) solo se usan si **se rehace la ruta entera** con el vuelo ya puesto (por ejemplo, al cambiar las fechas). Casi nunca pasa.
4. Las cuentas de la hora son cortas. Hoy, «libre» = aterrizas + 60 min (Fiumicino) o 50 min (Ciampino) + 30 min de maleta. Con «Sí, adaptarlos» ni siquiera se suman los 30 min. No se cuenta la zona del alojamiento ni la hora para instalarse.
5. Hoy hay días que **ponen el Coliseo o el Vaticano por la tarde o en un día a medias**: «la rápida» y «la de tarde» del día 1, la versión «Coliseo por la tarde» del día 1, el día del Free Tour con el Vaticano por la tarde, y algunas últimas mañanas. Eso choca con la regla nueva.
6. Propuesta: una **hora útil** igual para toda la app. Hora útil = aterrizas + 45 min para salir del aeropuerto + trayecto a tu zona + 1 hora para instalarte. Según la hora útil, el día se llena por **franjas** con paradas ligeras y cerca del alojamiento hasta la cena. Los grandes (Coliseo y Foro, Vaticano, Galería Borghese) van **solo por la mañana y solo en días enteros**.

---

## 1. Cómo se construye HOY el día 1 en Roma

### 1.1 Sin vuelo (o sin pase)

- **Sin pase, el vuelo no mueve nada.** Poner el vuelo es gratis y la app enseña el billete, la ficha de llegada y los avisos, pero el día 1 es el mismo que sin vuelo. Lo dice la regla 10S7b: «lo que mueve paradas, solo con pase».
- El día 1 es el primero de la ruta normal. Casi siempre es el **día de la Roma antigua**: Coliseo a las 9:15, Foro, Campidoglio, Altar de la Patria, comida, centro por la tarde, Panteón, Navona, cena y paseo de noche.
- **Ojo:** si el viaje empieza en martes, el día 1 es el **Vaticano** (Museos a las 9:15). El motor no pone el Vaticano el miércoles, así que lo adelanta al martes.
- Sin pase no se puede guardar la zona del alojamiento. La app no sabe dónde duermes.

### 1.2 Con pase: tres caminos distintos

**Camino B, el habitual: «¿Adaptamos tu primer y tu último día a tus vuelos?» → «Sí, adaptarlos»**
- El viajero crea el viaje sin vuelo. Luego pone el vuelo en RESERVAS y sale la pregunta.
- La app **no pide un día de llegada al motor**. El código lo explica así: «el motor solo sabe adaptar la llegada rehaciendo la ruta entera, así que el primer día no se rehace: se recorta».
- Cuenta la hora de empezar así: **aterrizas + traslado al centro**. Son 60 min desde Fiumicino y 50 desde Ciampino. **No suma la maleta** ni el rato para instalarse.
- Con esa hora, coge **las mismas paradas** del día 1 normal. Coloca primero las que cierran y deja al final las que se ven a cualquier hora. Lo que no cabe pasa a «Si te sobra tiempo». **No añade nada.** No cambia el día por otro más ligero. No mira dónde duermes.
- Resultado: cuanto más tarde llegas, más vacío queda el día. Además, las paradas salen sueltas. Por ejemplo, el Arco de Constantino acaba a las 18:00, después del Panteón, cuando está al lado del Coliseo.

**Camino A: se rehace la ruta entera con el vuelo ya puesto** (cambiar las fechas, o rehacer el viaje)
- Aquí sí entra el motor de llegadas (`decidirLlegada`). Calcula «libre» = aterrizas + traslado del punto (Fiumicino 60, Ciampino 50) + 30 min de maleta.
- Con esa hora busca la fila de una **tabla escrita** para Roma. Hay una tabla de marzo a octubre y otra de invierno. En invierno cuenta que el Coliseo cierra a las 16:30.

| «Libre» a las… (marzo-octubre) | Qué día 1 sale | Qué pasa con el resto |
|---|---|---|
| aterrizas entre 0:00 y 4:59 | el día de la Roma antigua entero, desde las 9:00 | nada |
| antes de 10:00 | Roma antigua, versión «Coliseo por la tarde» | nada |
| 10:00–11:59 | «La rápida»: Navona, Panteón por fuera, Trevi, comida y **Coliseo + Foro por la tarde** | nada |
| 12:00–13:59 | «De tarde»: comida al llegar y **Coliseo + Foro por la tarde** | nada |
| 14:00–14:59 | ruta del centro (desde Navona o desde Plaza de España, según la zona) con comida al llegar | la Roma antigua pasa al día 2 y **se cae el último día** |
| 15:00–18:59 | ruta del centro a buen paso (6 paradas) | igual |
| 19:00–20:29 | «al anochecer» (2-4 paradas) | igual |
| 20:30–21:59 | solo cena y Trevi de noche | igual |
| 22:00–22:59 | sin cena, Trevi de noche | igual |
| 23:00 o más | sin ruta («Descansa») | igual |

- La zona del alojamiento solo decide si la ruta del centro empieza en Navona o en Plaza de España. Plaza de España y Termini empiezan en Plaza de España. Centro, Prati, Trastevere, Monti y «no lo sé» empiezan en Navona.

**Camino C: rehacer un día suelto** (por ejemplo, al añadir una entrada; también el botón «Reorganizar» del primer día)
- El motor recibe el vuelo, pero también el **orden de días que el viajero ya ve**. Ese orden manda.
- Lo he probado. Con un vuelo de las 14:30, el día 1 vuelve a salir **entero desde el Coliseo a las 9:15**. Aun así, el resumen de la llegada que guarda la app dice «ruta del centro». **El día y su resumen no coinciden.**
- El botón «Reorganizar» del primer día usa el mismo recorte del camino B.

### 1.3 Fiumicino frente a Ciampino

- Solo cambian dos números: 60 min (Fiumicino) frente a 50 (Ciampino) de traslado al centro, y en la vuelta 3 h frente a 2 h 50 min de salir antes.
- No se cuenta la zona (Ciampino a Prati es bastante más lento que a Termini), ni el rato de salir del avión con maletas, ni la hora de instalarse.

---

## 2. Lo que sale HOY el día 1 (motor ejecutado de verdad)

Viaje de 3 días de ruta. Empieza el **jueves 10-jun-2027** (sin vuelo, el día 1 es la Roma antigua). Zona del alojamiento: Centro. «Libre» es la hora que calcula hoy el motor.
**Sin pase**, el día 1 es siempre el mismo, a cualquier hora: *9:15 Coliseo · Arco · Foro · Campidoglio · Plaza Venecia · Altar de la Patria · 13:57 comida · Barrio Judío · Torre Argentina · San Luigi · Panteón · Gesù · 18:08 Navona · 20:00 cena* (15 paradas). La app no lo adapta, aunque aterrices a las 20:00.

| Llegada | Libre (hoy) | **Con pase, camino B** («Sí, adaptarlos»): lo que queda | **Con pase, camino A** (ruta rehecha con el vuelo) |
|---|---|---|---|
| FCO 9:00 | 10:30 | 11 paradas. Coliseo 10:00, Foro, Altar, comida 13:57… y el Arco a las 18:00 | «La rápida»: Navona, Panteón por fuera, Trevi, comida 12:30, **Coliseo 13:56 + Foro**, Altar (9 paradas) |
| FCO 11:30 | 13:00 | 10 paradas. **Coliseo 12:30 sin el Foro** (el Foro va a «Si te sobra»), comida 13:57, Altar 15:00, Panteón… | «De tarde»: comida 13:00, **Coliseo 14:15 + Foro**, Altar, Panteón por fuera, Navona (8) |
| FCO 14:30 | 16:00 | 8 paradas. Sin comida, sin Coliseo ni Foro. Altar 15:30, Panteón, Arco 18:00, Navona 19:20 | Ruta del centro: Navona, Panteón por fuera, Trevi, Condotti, Plaza de España, Trinità (6). La Roma antigua pasa al día 2 y **se cae el día 3 (Villa Borghese)** |
| FCO 17:00 | 18:30 | **5 paradas sueltas**: Arco 18:00, Tortugas, Torre Argentina, Elefantino, Navona 19:20 | Ruta del centro de 18:30 a 20:27 (6) y cena 20:41. Se cae Villa Borghese |
| FCO 20:00 | 21:30 | **Nada** (0 paradas, ni cena) | Cena 21:30 y Coliseo de noche **a las 23:10** y Foro **a las 23:45**. El texto del día dice «visita la Fontana de Trevi de noche» |
| CIA 9:00 | 10:20 | 11 paradas (Coliseo 9:50…) | «La rápida» (igual que Fiumicino, 10 min antes) |
| CIA 11:30 | 12:50 | 10 paradas (Coliseo 12:20 sin el Foro) | «De tarde» (igual, 10 min antes) |
| CIA 14:30 | 15:50 | 8 paradas (Altar 15:20…) | Ruta del centro (6), se cae Villa Borghese |
| CIA 17:00 | 18:20 | **5 paradas sueltas** | Ruta del centro (6) |
| CIA 20:00 | 21:20 | **1 parada** (Arco de Constantino 20:50) | Cena 21:20 y Coliseo de noche 23:10 |

Lo mismo con otras fechas:
- **Martes 8-jun-2027** (el día 1 sin vuelo es el **Vaticano**). En el camino B, llegando a las 9:00 te deja los **Museos Vaticanos a las 10:00** el día de llegada. Llegando a las 11:30 quita los Museos y deja la Basílica, el Castillo… Llegando a las 17:00 quedan **2 paradas** (Basílica 18:00 y Plaza de San Pedro 19:20).
- **Invierno (jueves 14-ene-2027).** Mismo dibujo. Llegando a las 17:00 quedan 3 paradas, y a las 20:00, ninguna. En el camino A, «libre» a las 13:00 da la «ruta del centro entera». La cena es a las 19:30.

---

## 3. Por qué el día 1 sale casi vacío (las causas concretas)

1. **El camino habitual solo recorta.** «Sí, adaptarlos» coge el día pensado para empezar a las 9:00 (Coliseo o Vaticano) y le quita lo que no cabe. Si llegas por la tarde, los sitios grandes ya no caben o ya han cerrado, y no se pone nada en su lugar. Las tablas buenas (ruta del centro, anochecer…) existen, pero ese camino no las usa.
2. **No cambia el día pesado por uno ligero.** El código no puede pasar la Roma antigua al día 2 sin rehacer todo el viaje, y la regla 10S7b dice que «Sí» nunca cambia el orden de los días. Así que el día pesado se queda el día 1 y se vacía.
3. **Ordena por «lo que cierra primero», no por cercanía.** Por eso salen saltos absurdos: el Arco de Constantino a las 18:00, cuando el Coliseo estaba a las 12:30, y el Foro (la misma entrada del Coliseo) fuera.
4. **La comida no se mueve.** Si caía antes de llegar, desaparece y no se pone una comida cerca del alojamiento. En el camino B, llegando a las 14:30 no hay comida.
5. **Por la noche no hay nada que encajar.** Llegando a las 20:00, el día normal ya no tiene nada. La cena y el paseo de noche no se añaden, porque recortar no añade.
6. **Las horas son cortas y no miran la zona.** Fiumicino +60 o Ciampino +50, y en el camino B sin la maleta. Algunas cosas se ponen a una hora a la que el viajero aún está en el tren. Otras se quitan sin necesidad.
7. **Tres caminos que no dan lo mismo.** Según por dónde pase el viajero (pregunta del vuelo, cambio de fechas, rehacer un día), el día 1 sale distinto, y el resumen («ruta del centro») puede no coincidir con lo que se ve (Coliseo a las 9:15).
8. **Incluso en el camino bueno (A), la noche es mala.** Llegando a las 20:00 te pone el Coliseo de noche a las 23:10, aunque el texto promete Trevi.

---

## 4. El día de vuelta, hoy (más breve)

- **Sin pase:** el día de vuelta no tiene paradas. Sale la tarjeta «Hoy vuelves a casa», con «hasta las HH:MM» si hay hora, [+ Añadir lugares] y [Explorar]. La tarjeta cuenta: vuelo − 2 h de aeropuerto − trayecto desde tu zona (o desde el centro), redondeado hacia abajo al cuarto de hora.
- **Con pase:** el motor usa otra cuenta, **vuelo − 3 h** (Fiumicino) o **− 2 h 50 min** (Ciampino), sin mirar la zona. Con esa hora elige una fila de tabla. Viaje del 10-jun, zona Centro:

| Vuelo de vuelta | Hora de salir (motor) | Qué lleva el día de vuelta |
|---|---|---|
| 8:00 / 11:00 | 5:00 / 8:00 | Nada, solo la tarjeta |
| 14:00 | 11:00 | Mañana corta del Aventino (Circo Máximo, Naranjos, Cerradura, Pirámide; 9:00-10:30) |
| 16:00 | 13:00 | Mañana sin comida (Caracalla, Circo Máximo, Boca de la Verdad, Naranjos, Cerradura) |
| 18:00 | 15:00 | Mañana con comida (12:30) y «La tarde es tuya hasta que te vayas» |
| 21:00 | 18:00 | **Lo mismo que a las 18:00**: comida a las 12:30 y **4 h y media de tarde vacía** |
| 23:30 | 20:30 | Un día entero más (en este viaje, el de las basílicas). Si al llegar se cayó otro día, ese |

(Ciampino da lo mismo, 10 min después.)

Problemas de la vuelta:
- La fila «17:00-22:59» es muy ancha. Un vuelo a las 21:00 deja la tarde vacía.
- La última mañana no mira dónde duermes. Va en un orden fijo: Vaticano, Roma antigua, Pincio, Aventino, Cúpula.
- **Dos cuentas distintas.** La tarjeta (2 h + tu trayecto) y el motor (3 h fijas) pueden decir cosas diferentes el mismo día.
- **Algunas últimas mañanas llevan grandes por dentro.** «Mañana sin comida» y «con comida» de la Roma antigua llevan el **Coliseo por dentro**. Las del Vaticano llevan la Basílica por dentro. El «día más» puede traer el día de la Galería Borghese (entrada a las 11:00). Chocan con la regla nueva.

---

## 5. Propuesta de reglas (para toda la app)

### 5.1 La hora útil de llegada (la de Eric, con números)

**Hora útil = hora de aterrizaje + salir del aeropuerto (45 min, siempre) + trayecto a tu zona + 1 hora para instalarte.**
Es una hora que la app usa por dentro (hoy la regla dice que no se enseñan horas calculadas). Se redondea hacia arriba de 5 en 5.

**a) Salir del aeropuerto o de la estación (bajar, pasaporte si hace falta, maleta).** Regla de Eric: en un aeropuerto, desde que aterrizas hasta que sales con el equipaje son **siempre 45 minutos**, sea cual sea el aeropuerto.

| Punto | Minutos |
|---|---|
| Cualquier aeropuerto (Fiumicino, Ciampino…) | **45, siempre** |
| Termini, Tiburtina (tren) / estación de autobuses de Tiburtina | 10 |
| Civitavecchia (barco) | 45 |

**b) Trayecto estándar hasta la zona del alojamiento, puerta a puerta**, con el transporte que recomienda la app (Leonardo, Airlink, FL1, metro…). Incluye esperas y andar. **Son estimaciones mías: hay que comprobarlas.** En `_llegada.json` faltan los tiempos del metro y del tranvía. Los que sí están: Leonardo 32 min, autobús Fiumicino-Termini 45-50, FL1 a Trastevere 27, autobús Ciampino-Termini 40, Ciampino-Anagnina 20.

| Zona | Fiumicino | Ciampino | Termini | Tiburtina / Tibus | Civitavecchia |
|---|---|---|---|---|---|
| Termini | 50 | 45 | 10 | 20 | 90 |
| Monti | 60 | 55 | 15 | 25 | 100 |
| Plaza de España | 65 | 60 | 20 | 30 | 105 |
| Centro (Panteón, Trevi, Navona) | 70 | 65 | 25 | 35 | 105 |
| Prati | 70 | 70 | 25 | 35 | 90 |
| Trastevere | 60 | 75 | 30 | 40 | 90 |
| Aún no lo sé (y sin pase) | como Centro | como Centro | como Centro | como Centro | como Centro |

**c) Instalarse (dejar la maleta, ponerse cómodo, algo de compra): 60 min.** Es un dato del destino (`instalarse_min: 60`), no del código.

Total con zona Centro: **Fiumicino +2 h 55 min** (45 + 70 + 60) y **Ciampino +2 h 50 min** (45 + 65 + 60). Hoy son +1 h 30 y +1 h 20. Hora útil de los casos de la tabla 2:

| Aterrizaje | 9:00 | 11:30 | 14:30 | 17:00 | 20:00 |
|---|---|---|---|---|---|
| Fiumicino, Centro | 11:55 | 14:25 | 17:25 | 19:55 | 22:55 |
| Ciampino, Centro | 11:50 | 14:20 | 17:20 | 19:50 | 22:50 |

### 5.2 Qué se mete según la hora útil (franjas)

La cena se queda a su hora de siempre (Roma: 20:00 en verano, 19:30 en invierno). La regla de la comida tampoco cambia: la comida solo se pone si empieza como tarde a las 15:00.

| Franja | Hora útil | Qué lleva el día de llegada |
|---|---|---|
| F0 · Día entero | aterrizas de 0:00 a 4:59, **o** hora útil hasta las 9:30 | El día 1 normal, con su grande por la mañana (el Coliseo a su hora) |
| F1 · Desde media mañana | 9:31–12:00 | 2-3 paradas ligeras cerca del alojamiento, **comida cerca**, la ruta ligera del centro por la tarde, cena y paseo de noche. El día grande pasa al día 2 |
| F2 · Desde la comida | 12:01–15:00 | Comida cerca del alojamiento, la ruta ligera del centro entera (6-8 paradas), cena y paseo de noche |
| F3 · Tarde | 15:01–18:00 | Ruta ligera a buen paso (4-6 paradas), cena y paseo de noche |
| F4 · Antes de cenar | 18:01–20:00 | 1-3 paradas al lado de casa (al anochecer), cena y un paseo de noche corto |
| F5 · Cena | 20:01–21:30 | Cena cerca del alojamiento y **un** sitio de noche a menos de 15 min andando |
| F6 · Noche | 21:31–23:00 | Sin cena con restaurante. Un paseo corto de noche cerca, si apetece |
| F7 · Muy tarde | después de las 23:00 | «Descansa, que mañana empezamos a tope» |

**Cuántas paradas:** las que quepan entre la hora útil y la cena. Más o menos, **una parada ligera cada 35 min** (unos 20 de visita y 15 de andar). Así el día nunca queda vacío. Ejemplo: 2 h libres son 3 paradas.

**Qué es una parada «ligera»** (se puede sacar de los datos de cada destino, sin escribir nombres de Roma en el código):
- se ve en 45 min o menos;
- no lleva entrada con hora fija;
- no es de los grandes (5.3);
- si cierra, está abierta a esa hora (el Panteón, hasta las 19:00);
- mejor plazas, fuentes, miradores, calles e iglesias pequeñas: se ven a cualquier hora.

**Qué es «cerca del alojamiento»:**
- la primera parada a 15-20 min andando de la zona;
- el paseo va hacia la zona de la cena, y la cena cerca del alojamiento (o de la última parada);
- el paseo de noche, a menos de 15 min de la cena.

**Por zona (dato de Roma, `inicio_por_zona` ampliado).** Hoy solo hay dos salidas: Navona y Plaza de España. Propongo tres más:
- **Trastevere:** Trastevere, Santa María in Trastevere, Isla Tiberina.
- **Prati:** Puente y Castillo por fuera, Navona.
- **Monti / Termini:** Santa María la Mayor, Monti, Trevi.

Antes de escribirlas hay que comprobar que no se «comen» las paradas principales de otros días. Si las repiten, esos días las llevarían «de camino».

**Aprovechar el día que se cae.** Si la llegada hace que se caiga el último día (en 3 días, el de Villa Borghese), la ruta ligera del día 1 puede tomar sus partes ligeras: Plaza de España, Trinità, Via Condotti, Pincio, Popolo. Así solo se pierde lo grande de ese día (la Galería Borghese, que vuelve si la reservas, como hoy).

### 5.3 La regla de los grandes: por la mañana y en días enteros

- **Grandes** = las visitas de medio día o más. En Roma: **Coliseo y Foro** (una entrada), **Museos Vaticanos** (con su Plaza y Basílica) y **Galería Borghese**. Ya están como «sitios grandes» en los datos. **A decidir:** ¿la Basílica de San Pedro sola (gratis, 45-75 min) es grande? Hoy la lista de avisos de la app la cuenta como grande.
- **Solo en días enteros:** nunca el día de llegada (salvo F0) ni el día de vuelta.
- **Siempre por la mañana:** que la visita empiece antes de las 13:00.
- **Excepciones (no cambian):**
  - Una **reserva del viajero** manda. Nunca negamos nada: si el viajero tiene el Coliseo a las 16:00 el día de llegada, se queda, y como mucho sale el aviso de que no llega.
  - Los **cierres** siguen mandando primero.

**Lo que hoy choca con esta regla** (Eric tiene que decidir cada uno):
1. «La rápida» y «De tarde» del día 1 (y las de invierno de 10 y 11): **Coliseo y Foro por la tarde del día de llegada.** Desaparecen. La Roma antigua pasaría al día 2 desde una hora útil de 9:31.
2. La versión «Coliseo por la tarde» del día 1, que hoy se fuerza en marzo-octubre con «libre» antes de las 10:00. Con la regla nueva sobra.
3. **El día del Free Tour** (Free Tour por la mañana y **Vaticano por la tarde**). Es un día entero, pero el Vaticano va por la tarde. ¿Se cambia (Vaticano por la mañana y Free Tour por la tarde, a las 15:00 o a las 17:00) o queda como excepción?
4. **«Día 1 + Vaticano»** (2 noches con llegada tarde): Coliseo por la mañana y **Vaticano por la tarde**.
5. Las **últimas mañanas** con el Coliseo por dentro (la «sin comida» y la «con comida» de la Roma antigua) y las del Vaticano con la Basílica por dentro. Pasarían a «por fuera».
6. **Una regla tuya del 21-oct** (de tus reglas de destinos guardadas): «con llegada a la hora de comer, la tarde da para mucho (Roma: Galería Borghese por la tarde)». **La regla nueva la anula.** Confírmalo.
7. **Más viajes pierden su último día.** Hoy, llegando antes de las 14:00 (de «libre»), no se cae ningún día. Con la regla nueva, desde una hora útil de 9:31 la Roma antigua pasa al día 2 y se cae el último. Eso afecta a todo vuelo que aterrice después de unas 6:35 en Fiumicino. La parte ligera del día caído se aprovecha (5.2). Lo grande vuelve si se reserva, o como «día más» con una vuelta tardía.

### 5.4 El día de vuelta, con la misma idea

**Hora de irse del alojamiento = vuelo − 2 h de aeropuerto − trayecto desde tu zona (la tabla de 5.1) − 30 min para recoger la maleta.**
Tren o autobús: −30 min en vez de 2 h. Barco: el embarque de la naviera o 2 h.
**Una sola cuenta para el motor y para la tarjeta.** Con Fiumicino y zona Centro salen 3 h 40 min antes del vuelo.

| Tiempo desde las 9:00 hasta la hora de irte | Qué lleva |
|---|---|
| menos de 1 h | Nada: la tarjeta «Hoy vuelves a casa» (como hoy) |
| 1 h – 2 h 30 | Mañana corta: 2-3 paradas ligeras cerca del alojamiento |
| 2 h 30 – 4 h | Mañana sin comida, ligera |
| más de 4 h y hora de irte desde las 14:00 | Mañana con comida y, **en vez de «tarde libre»**, paradas ligeras cerca hasta la hora de irte (como el día de llegada) |
| hora de irte desde las 19:00 | Casi un día. **A decidir:** ¿cuenta como día entero para un grande por la mañana? Con la regla tal cual, no: día sin grandes |

La última mañana se elige entre lo que aún no has visto y **lo más cercano a tu zona**, no por un orden fijo. Nunca lleva grandes por dentro.

### 5.5 Gratis o del pase (según las reglas actuales)

| Qué | Gratis | Pase |
|---|---|---|
| Poner el vuelo (horas, aeropuertos, precio) | ✔ | ✔ |
| La ruta curada entera, también el día 1 normal | ✔ (sin cambios: «no dar una ruta peor gratis») | ✔ |
| Lo que solo informa: billete, ficha de llegada, «Hoy vuelves a casa» con «hasta las HH:MM», avisos de reservas que no cuadran con el vuelo | ✔ | ✔ |
| La zona del alojamiento y [Cómo llegar a tu alojamiento] | — | ✔ |
| **Adaptar el día 1 y el de vuelta** (hora útil, franjas, paradas cerca del alojamiento, pasar los grandes al día siguiente) | — | ✔ («Poner el vuelo: el primer y el último día se ajustan a tus horas») |
| El orden de los días según la llegada y la vuelta | — | ✔ |
| Reorganizar el día | — | ✔ |

- Sin pase no hay zona, así que «cerca del alojamiento» solo existe con pase. La hora útil sin zona usa la fila «Aún no lo sé».
- **A decidir:** que sin pase la tarjeta de llegada diga, solo informando, «con tu vuelo estarás libre hacia las 17:30». Hoy la regla «ninguna hora calculada a la vista» lo impide en el día 1, pero la tarjeta de vuelta ya enseña «hasta las HH:MM».

### 5.6 Tres ejemplos completos (pase, Fiumicino, zona Centro, 3 días, jueves 10-jun-2027)

Las horas son orientativas. Las paradas salen de los datos de Roma.

**Ejemplo 1 · Llegada de mañana: aterrizas a las 9:00 → hora útil 11:55 (F1)**
- 12:00 Piazza Navona (20 min).
- 12:30 Comida cerca del alojamiento (60-75 min).
- 13:45 Panteón por dentro (30).
- 14:30 Fontana de Trevi (30).
- 15:15 Via Condotti, Plaza de España y Trinità dei Monti (45).
- 16:20 Terraza del Pincio (20).
- 16:50 Piazza del Popolo (20).
- 17:15-20:00 Rato libre o vuelta al hotel.
- 20:00 Cena cerca del alojamiento.
- 21:30 Paseo de noche corto (por ejemplo, el Panteón de noche o Piazza Navona de noche).
- Día 2: la Roma antigua entera (Coliseo por la mañana). Día 3: el Vaticano (por la mañana).
- Se cae el día de Villa Borghese. Su parte ligera ya va el día 1, y la Galería vuelve si la reservas.
- Hoy (camino B), ese día sale con el Coliseo a las 10:00, cuando el viajero aún está en el Leonardo.

**Ejemplo 2 · Llegada a mediodía: aterrizas a las 11:30 → hora útil 14:25 (F2)**
- 14:30 Comida cerca del alojamiento (empieza antes de las 15:00).
- 15:45 Piazza Navona.
- 16:15 Panteón por dentro (cierra a las 19:00).
- 16:55 Fontana de Trevi.
- 17:35 Via Condotti y Plaza de España.
- 18:15 Trinità dei Monti.
- 18:45 Terraza del Pincio al atardecer.
- 20:00 Cena.
- 21:30 Paseo de noche corto.
- Días 2 y 3 como en el ejemplo 1.
- Hoy (camino B) sale el Coliseo a las 12:30 sin el Foro, y el Arco a las 18:00.

**Ejemplo 3 · Llegada de tarde: aterrizas a las 14:30 → hora útil 17:25 (F3)**
- 17:30 Piazza Navona.
- 17:55 Panteón (por dentro, entra antes de las 18:30; si no, por fuera).
- 18:30 Fontana de Trevi.
- 19:10 Plaza de España y Trinità dei Monti.
- 20:00 Cena cerca.
- 21:30 Un sitio de noche a menos de 15 min.
- Días 2 y 3 como en el ejemplo 1.
- (Si aterrizas a las 17:00, hora útil 19:55: cena a las 20:00 y Trevi de noche. Si aterrizas a las 20:00, hora útil 22:55: sin cena con restaurante y un paseo corto, o descansar.)

---

## 6. Riesgos: qué habría que tocar y qué podría romperse

**Lo que hay que tocar**
1. **Una sola cuenta compartida** de la hora útil y de la hora de irse, para el motor, la app, los logros y Lanzarote. Hoy hay **cinco cuentas** distintas: la del motor de llegada, la del recorte, la tarjeta de vuelta, la hora «en el centro» de la ficha y la de los logros/día de prueba.
2. **Datos.** En `_llegada.json`: minutos de salir de cada punto (45 en todos los aeropuertos) y tabla de trayectos por zona. En el destino: `instalarse_min: 60` en lugar de `libre_extra_min: 30`, y el umbral de día entero (9:30).
3. **Las tablas del día 1** (`listas.json › llegadas.dia1`), rehechas sobre la hora útil. Fuera «la rápida», «de tarde» y la versión «Coliseo por la tarde». Rutas ligeras por zona nuevas, y la comida al llegar en F1 y F2.
4. **El camino de «Sí, adaptarlos».** Tiene que pedir al motor el día de llegada de verdad, no recortar. **Choca con la regla 10S7b** («“Sí” nunca cambia el orden de los días»): para que el grande pase al día 2 hay que correr los días y se cae el último. Propongo permitirlo con [Deshacer] y una frase clara («Como llegas a mediodía, la Roma antigua pasa al jueves»). **Necesita el sí de Eric.**
5. **Rehacer un día suelto con el orden fijo** (camino C) debe respetar el día de llegada. Si no, deshace la adaptación y el resumen miente.
6. **Vuelta:** tabla nueva sobre la hora de irse, últimas mañanas sin grandes y elegidas por cercanía, tarde con paradas en lugar de «tarde libre», y una sola cuenta con la tarjeta.
7. **Días curados que chocan** con «grandes por la mañana»: el día del Free Tour, «Día 1 + Vaticano» y las últimas mañanas del Coliseo. Es trabajo de datos, y antes Eric tiene que decidir (5.3).
8. **Lanzarote.** Hoy su día 1 sale del aeropuerto en coche directo a la primera parada (aterrizaje + 20 o 45 min de recoger el coche). Si la regla es «para toda la app», ahí se añadiría salir del aeropuerto, trayecto al alojamiento y la hora de instalarse, y el día empezaría desde el alojamiento. **A decidir:** en un destino en coche, ¿se pasa antes por el alojamiento?

**Lo que podría romperse**
- **Las pruebas** que tienen las tablas copiadas a mano con los 30 min de maleta (la de la Tanda 7 de llegadas y su integración), los 20 viajes con vuelos, las del aviso de vuelos y Reorganizar, y los ficheros «dorados» con vuelos. Fallarán todas y hay que rehacerlas a propósito. La muestra de 60 fechas de Roma **sin vuelos** no debería cambiar, y hay que comprobarlo.
- **Más viajes pierden su último día** (5.3, punto 7), y con ellos los textos del resumen: «Como llegas por la tarde, la Roma antigua pasa al {día 2}» tendría que decir también «a mediodía».
- **Reservas del día 1.** Hoy una entrada del Coliseo antes de las 14:00 el día 1 hace que ese día sea la Roma antigua. Con la hora útil más tarde saldrán más avisos de «no llegas a tiempo», con la misma regla (se avisa, nunca se quita).
- **El Free Tour de mañana el día 1.** Sus cortes (`entero_si_libre_antes`, el margen de 30 min) se calculan con «libre». Con la hora útil más tarde, más viajes pasan a «solo la parte del tour» o a «el tour al día siguiente».
- **El día de prueba gratis** («el día de llegada si está libre antes de las 10:00») y **los logros** (Madrugador…) leen la misma «libre». Cambiarían qué día es el de prueba.
- **HOY [+ Más visitas]** decide qué días están «recortados» por el nombre del caso de llegada. Los casos nuevos hay que añadirlos ahí.
- **Ciampino con zona Prati o Trastevere.** Con mis estimaciones, el trayecto es 15-25 min más largo que hoy. Si los tiempos no se comprueban, se pueden quitar paradas sin necesidad.

---

## 7. Para el programador: referencias archivo:línea

**Motor del día 1 (camino A)**
- `shared/routeEngine/llegadaDia1.js:51`: `minutosLibre` (llegada + `al_centro_min` + 30).
- `llegadaDia1.js:208-218`: `libreDeLlegada`. `:264`: «libre» en `decidirLlegada`. `:265-266`: invierno o marzo-octubre (`esInvierno`, `:58-76`).
- `llegadaDia1.js:82-89`: `filaDeLlegada`. `:205`: `empiezaDesde`.
- `llegadaDia1.js:361-404`: casos «tranquilo», «rápido» y «de tarde». `:405-443`: «pasa al día 2» y el día caído. `:463-464`: comida al llegar. `:573-689`: Free Tour del día 1.
- `shared/routeEngine/listasTrip.js:117`: `llegadaPide` (solo con `pago !== false`). `:131`: excursión del día 1. `:208-225`: `ordenarDias` con la llegada.
- `shared/routeEngine/listasOrden.js:80-88`: la decisión de llegada cambia `chosen`. `:136`: `forceOrder` gana a la llegada (el camino C). `:172`: `fijoPrimero`.
- `data/pipeline_v2/roma.json:9518-9520`: `destination_config.llegada` (`libre_extra_min: 30`, `invierno`, `dos_noches_tarde`, `free_tour`).
- `data/dias/roma/listas.json:14640` (`llegadas`), `:14641` (`dia1`), `:14919` (`vuelta`), `:14971` (`ultimas_mananas`), `:15049` (`inicio_por_zona`).
- `data/dias/roma/listas.json:12566` (`D1-rapido`), `:12988` (`D1-tarde`), `:13596` (`D1-noche`), `:13672` (`D1-vaticano`), `:5126` (`D3`).
- `data/dias/roma/listas.json:14092` y `:14467` (`DS-roma-antigua` y `DCC-roma-antigua`, con el Coliseo dentro), `:1465` (variante `coliseo_tarde`).
- `data/dias/roma/_llegada.json:24` (Fiumicino `al_centro_min: 60`), `:117` (Ciampino `50`), `:15` (avión `salir_antes_min: 180`), `:182` (Ciampino `170`).

**Camino B, recorte con «Sí, adaptarlos» (el habitual)**
- `src/lib/adaptarVuelos.ts:9-12`: el comentario «el primer día no se rehace: se recorta».
- `adaptarVuelos.ts:111-118`: `tiemposDelVuelo` (sin maleta ni zona). `:178-196`: `adaptarUnDia`. `:188`: `desde = llegada + alCentro`. `:190`: `hasta`. `:309`: `propuestaDeVuelos`. `:329`: solo con `pagoActivo()`.
- `shared/routeEngine/adaptarDiaVuelo.js:37`: `adaptarDiaAlVuelo`. `:69`: con `desde`, primero lo que cierra. `:103`: límite = fin del día de antes. `:130-135`: puntuación (imprescindibles, número de paradas…). Nunca añade paradas.
- `server/index.js:5866-5890`: `/api/adaptar-dia-vuelo`.

**Camino C, rehacer días con el orden fijo**
- `src/lib/rebuildDay.ts:25-60`: `rehacerDiasSinTocar` manda el vuelo y, con `mantenerOrden`, `force_order`.
- Probado: con `forceOrder` y llegada a las 14:30, el día 1 sale el D1 entero desde las 9:15 mientras `plan.llegada.caso = 'ruta_del_centro'`.

**Gratis o pase**
- `src/lib/llegadaVuelta.ts:87`: sin `pagoActivo()` no se manda llegada ni vuelta.
- `src/lib/pago.ts`: `PAGO_ACTIVO` y `pagoActivo()`.
- `server/index.js:2641-2645`: `body.llegada` (con `zona`).
- `docs/REGLAS_DE_LA_APP.md`: 10S7b, líneas 179-185 («informa siempre, adapta preguntando»; «“Sí” nunca cambia el orden de los días»). 10S11, línea 234 («Hoy vuelves a casa»). §7, líneas 112-116 (alojamiento y zona del pase).
- `docs/dias/GRATIS_Y_PASE.md:31-40`.
- `data/pase/incluye.json` (`vuelos_horas`, `orden_dias`, `zona_alojamiento`, `hoy_dias_llegada_vuelta`).

**Vuelta**
- `shared/routeEngine/vueltaDia.js:66-69`: `margenDeSalida`. `:72-81`: `datosDeVuelta`. `:89-96`: `filaDeVuelta` (margen de la tabla 3:00). `:111-124`: `elegirUltimaManana` (orden fijo). `:263-290`: `disponerVuelta`.
- `src/lib/diaDeVuelta.ts:24-28`: margen de la tarjeta (avión 120). `:83-90`: «hasta las HH:MM» con el trayecto de la zona.
- `shared/arrival/arrivalRules.js:44-48`: `centerMinutesOf`. `:55`: `leaveMinutesOf`.

**Otros que leen la hora de llegada**
- `server/logros/servicio.js:40-51`: `horasDelViaje` usa `libreDeLlegada`.
- `server/logros/pase.js:7-8, 98`: el día de prueba (libre antes de las 10:00).
- `server/engine/cocheDay.js:38-39`: Lanzarote, `llegadaMin = hora + 20/45`.
- `src/lib/masVisitas.ts:12`: `CASOS_DE_LLEGADA_RECORTADOS`.
- `src/lib/imprescindiblesGrandes.ts:8-10`: lista de grandes de Roma (incluye la Basílica de San Pedro).
- `data/pipeline_v2/roma.json › sitios_grandes`: Coliseo, Museos Vaticanos, Galería Borghese y Free Tour.

**Pruebas afectadas**
- `scripts/destino/pruebaTanda7_llegada.mjs` (tablas `VERANO` e `INVIERNO` copiadas con `+30`).
- `pruebaTanda7_integracion.mjs`, `viajes20Lib.mjs` (`LLEGADAS_20`), `llegadaLib.mjs`.
- Las pruebas de vuelos y Reorganizar (`pruebaTanda10S7*`).

**Guiones usados**
- `/tmp/claude-0/-home-claude/65df8d95-7f50-5904-8e5d-59b6bce90948/scratchpad/agente_roma/dia1.mjs` (argumentos `inicio=`, `n=`, `horas=`).
- `/tmp/claude-0/-home-claude/65df8d95-7f50-5904-8e5d-59b6bce90948/scratchpad/agente_roma/vuelta.mjs`.
- Se lanzan con `node`. No arrancan servidores ni navegadores.
