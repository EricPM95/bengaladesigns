# Tanda 7 · Parte RESPUESTAS A LA 6Y10 y la revisión de 20 viajes (Agente C)

Qué se ha hecho, punto por punto, con palabras sencillas. Todo en commits locales (sin push).

## 1. El 1 de enero: el Coliseo y el Foro cierran (P1)

- Los dos ya llevaban `closed_dates: ["12-25", "01-01"]` (de la 6y10). Lo que quedaba mal eran los textos y la auditoría:
  - `fechas_especiales` › «Año Nuevo» (`ano_nuevo`): fuera el horario corto del Coliseo y del Foro (08:30-16:30, última entrada 15:30) de su `horario_especial`. También he quitado el del **Panteón** (09:00-17:00): el Panteón cierra el 1 de enero desde la 6y10 (su `closed_dates`), así que ese horario ya no podía cumplirse. Se queda solo el de las **Termas de Caracalla** (09:30-16:30, es lo que dice la fuente oficial).
  - Texto nuevo: «El Coliseo, el Foro, el Panteón y los Museos Vaticanos cierran.» + lo que se ha hecho en ese viaje: «Hemos empezado tu día más tarde y hemos puesto esas visitas otro día.» / «Hemos empezado tu día más tarde.» / «Hemos puesto esas visitas otro día.» (solo sale lo que es verdad en ese viaje; he quitado la opción «tus visitas van dentro de ese horario», que ya no es cierta). Máximo 24 palabras.
  - `closed_dates_audit['01-01']` del Coliseo y del Foro: «cierra», fuente colosseo.it/orari, comprobado el 13-oct-2026.
  - La fuente y la fecha de comprobación de `ano_nuevo` también están al día. Comentario de `specialDates.js` puesto al día.
- Viajes 3 y 13 del punto 23 (1 de enero): el aviso de Año Nuevo ahora dice «El Coliseo, el Foro, el Panteón y los Museos Vaticanos cierran.» (en el 13 añade «Hemos puesto esas visitas otro día.», que es verdad). Ya no sale en ningún aviso «horario corto». El Coliseo y el Foro no salen ese día con tiempo.
- Nota: en el viaje 13, al cerrar el Coliseo el 1 de enero, el motor (con sus reglas de siempre, «el que pierde menos») pone el día de la Galería el 1 de enero, que también cierra, y la Galería queda como «Cerrado este día». Es el comportamiento de la 6y10; no lo he tocado.

## 2. Fuera el «viernes noche» de los Museos (P3)

Quitado de: `roma.json` (el consejo `tip` y `best_time` de los Museos) y de la ficha ampliada (`detalle/roma/vaticano.json`: la nota del horario y un consejo). Sigue la apertura nocturna de agosto del **Panteón** (es otra cosa y está en su horario oficial). No queda «viernes noche» en `data/`, `src/`, `shared/` ni `server/` (lo comprueba la prueba nueva).

## 3. Me gusta de partida

- `scripts/destino/megustaInicial6y10.mjs` ya no saca los lugares de una semilla: lleva las seis cifras fijas y dos listas ordenadas (de más a menos conocido). `roma.json` cambia solo la línea `megusta_inicial` de cada sitio (el resto del fichero, igual).
- Los seis primeros (fijos): Coliseo 412 · Fontana de Trevi 391 · Museos Vaticanos y Capilla Sixtina 368 · Basílica de San Pedro 347 · Panteón 326 · Plaza de España 305 (cada uno 15 o más por encima del siguiente; el primero, por encima de 400).
- Imprescindibles que quedan, de 199 a 139 de 15 en 15 (en este orden): Piazza Navona 199 · Foro Romano y Palatino 184 · Plaza de San Pedro 169 · Altar de la Patria 154 · Arco de Constantino 139.
- Nivel 2: de 99 a 52, de más a menos conocido (Galería Borghese 99 … San Pietro in Montorio y Tempietto 52). Nivel 3: 0. Restaurantes: como estaban (21 con cifra de 100 a 199, el resto 0).
- **Choque de rangos (apuntado):** «por debajo de 290» y «dentro de sus rangos de siempre (100–199)» solo chocan en los seis primeros: sus cifras (305 a 412) están fuera de 100–199, y es la **única excepción** a los rangos. Los cuatro «joya» (Coliseo, Trevi, Museos, Panteón) están dentro de los seis, así que **todo el nivel 1 que queda es «imprescindible»**.
- Prueba `pruebaFase6y10_ficha.mjs` puesta al día (acepta la excepción de los seis).
- Invariante 638 puesta al día con las cifras.

### La lista entera (de más a menos)

| Puesto | Sitio | Nivel | Cifra |
|---|---|---|---|
| 1 | Coliseo | nivel 1 (joya) | 412 |
| 2 | Fontana de Trevi | nivel 1 (joya) | 391 |
| 3 | Museos Vaticanos y Capilla Sixtina | nivel 1 (joya) | 368 |
| 4 | Basílica de San Pedro | nivel 1 (imprescindible) | 347 |
| 5 | Panteón | nivel 1 (joya) | 326 |
| 6 | Plaza de España | nivel 1 (imprescindible) | 305 |
| 7 | Piazza Navona | nivel 1 (imprescindible) | 199 |
| 8 | Foro Romano y Palatino | nivel 1 (imprescindible) | 184 |
| 9 | Plaza de San Pedro | nivel 1 (imprescindible) | 169 |
| 10 | Altar de la Patria | nivel 1 (imprescindible) | 154 |
| 11 | Arco de Constantino | nivel 1 (imprescindible) | 139 |
| 12 | Galería Borghese | nivel 2 | 99 |
| 13 | Castillo de Sant'Angelo | nivel 2 | 98 |
| 14 | Trastevere | nivel 2 | 96 |
| 15 | Cúpula de San Pedro | nivel 2 | 95 |
| 16 | Museos Capitolinos | nivel 2 | 93 |
| 17 | Plaza del Campidoglio | nivel 2 | 92 |
| 18 | Boca de la Verdad | nivel 2 | 91 |
| 19 | Basílica de San Juan de Letrán | nivel 2 | 89 |
| 20 | Basílica de Santa María la Mayor | nivel 2 | 88 |
| 21 | Termas de Caracalla | nivel 2 | 87 |
| 22 | Circo Máximo | nivel 2 | 85 |
| 23 | Campo de' Fiori | nivel 2 | 84 |
| 24 | Isla Tiberina | nivel 2 | 82 |
| 25 | Parque de Villa Borghese | nivel 2 | 81 |
| 26 | Mirador del Janículo | nivel 2 | 80 |
| 27 | Terraza del Pincio | nivel 2 | 78 |
| 28 | Barrio Judío | nivel 2 | 77 |
| 29 | Cripta de los Capuchinos | nivel 2 | 76 |
| 30 | Basílica de San Clemente | nivel 2 | 74 |
| 31 | Domus Aurea | nivel 2 | 73 |
| 32 | Piazza del Popolo | nivel 2 | 71 |
| 33 | Trinità dei Monti | nivel 2 | 70 |
| 34 | Iglesia de San Pietro in Vincoli | nivel 2 | 69 |
| 35 | Ara Pacis | nivel 2 | 67 |
| 36 | Iglesia de Santa Maria in Trastevere | nivel 2 | 66 |
| 37 | Santa Maria del Popolo | nivel 2 | 65 |
| 38 | Iglesia de San Luigi dei Francesi | nivel 2 | 63 |
| 39 | Iglesia del Gesù | nivel 2 | 62 |
| 40 | Mercados de Trajano | nivel 2 | 60 |
| 41 | Monti | nivel 2 | 59 |
| 42 | Testaccio | nivel 2 | 58 |
| 43 | Largo di Torre Argentina | nivel 2 | 56 |
| 44 | Villa Farnesina | nivel 2 | 55 |
| 45 | Jardín de los Naranjos | nivel 2 | 53 |
| 46 | San Pietro in Montorio y Tempietto de Bramante | nivel 2 | 52 |
| 47 | Via del Corso | nivel 3 | 0 |
| 48 | Via di Ripetta | nivel 3 | 0 |
| 49 | Via della Conciliazione | nivel 3 | 0 |
| 50 | Lungotevere | nivel 3 | 0 |
| 51 | Bioparque de Roma | nivel 3 | 0 |
| 52 | Galería Nacional de Arte Moderno | nivel 3 | 0 |
| 53 | Puente Sant'Angelo | nivel 3 | 0 |
| 54 | Via dei Fori Imperiali | nivel 3 | 0 |
| 55 | Borgo Pio | nivel 3 | 0 |
| 56 | Plaza Venecia | nivel 3 | 0 |
| 57 | Iglesia de Santa Maria sopra Minerva | nivel 3 | 0 |
| 58 | Iglesia de San Ignacio de Loyola | nivel 3 | 0 |
| 59 | Elefantino de Bernini | nivel 3 | 0 |
| 60 | Fuente de las Tortugas | nivel 3 | 0 |
| 61 | Fuente del Tritón | nivel 3 | 0 |
| 62 | Plaza Colonna | nivel 3 | 0 |
| 63 | Plaza del Quirinal | nivel 3 | 0 |
| 64 | Via dei Coronari | nivel 3 | 0 |
| 65 | Via Condotti | nivel 3 | 0 |
| 66 | Templo de Adriano | nivel 3 | 0 |
| 67 | Piazza Colonna | nivel 3 | 0 |
| 68 | Plaza Farnese | nivel 3 | 0 |
| 69 | Columna de Trajano | nivel 3 | 0 |
| 70 | Teatro de Marcelo | nivel 3 | 0 |
| 71 | Ojo de la Cerradura del Aventino | nivel 3 | 0 |
| 72 | Pirámide Cestia | nivel 3 | 0 |
| 73 | Iglesia de Santa Maria della Vittoria | nivel 3 | 0 |
| 74 | Ponte Sisto | nivel 3 | 0 |
| 75 | Plaza Trilussa | nivel 3 | 0 |
| 76 | Quartiere Coppedè | nivel 3 | 0 |
| 77 | Mercado de Testaccio | nivel 3 | 0 |
| 78 | Palazzo Doria Pamphilj | nivel 3 | 0 |
| 79 | Via Appia Antica | nivel 3 | 0 |
| 80 | Catacumbas de San Calixto | nivel 3 | 0 |
| 81 | Cementerio Protestante | nivel 3 | 0 |
| 82 | Fontana dell'Acqua Paola | nivel 3 | 0 |
| 83 | Basílica de Santa Cecilia in Trastevere | nivel 3 | 0 |
| 84 | Terraza de Largo Gaetana Agnesi | nivel 3 | 0 |
| 85 | Mirador de San Pietro in Montorio | nivel 3 | 0 |
| 86 | Colle Oppio | nivel 3 | 0 |
| 87 | Via Veneto | nivel 3 | 0 |
| 88 | Via del Babuino | nivel 3 | 0 |
| 89 | Via Margutta | nivel 3 | 0 |
| 90 | Porta Pinciana | nivel 3 | 0 |
| 91 | Jardines del Pincio | nivel 3 | 0 |
| 92 | Mercadillo de Navidad de Piazza Navona | nivel 3 | 0 |
| 93 | 100 Presepi in Vaticano | nivel 3 | 0 |
| 94 | Santo Bambino de Aracoeli | nivel 3 | 0 |
| 95 | Luces de Navidad del Tridente | nivel 3 | 0 |

Restaurantes (los que llevan cifra; el resto, 0):

| Restaurante | Cifra |
|---|---|
| Felice a Testaccio | 199 |
| Borghiciana Pastificio Artigianale | 198 |
| Il Gabriello | 198 |
| Nonna Betta | 190 |
| Supplizio | 173 |
| Dal Toscano | 163 |
| Armando al Pantheon | 162 |
| L'Arcangelo | 162 |
| Osteria dell'Angelo | 162 |
| Da Lucia | 159 |
| Piperno | 151 |
| Pizzeria Da Baffetto | 148 |
| Trattoria Valentino | 147 |
| Tonnarello | 141 |
| Checco er Carettiere | 132 |
| Poldo e Gianna Osteria | 126 |
| La Taverna dei Fori Imperiali | 123 |
| Trattoria Da Enzo al 29 | 108 |
| Buccone Vini e Olii | 106 |
| Giggetto al Portico d'Ottavia | 103 |
| Sgarro Bistrot | 100 |

Restaurantes con cifra 0: 50.

## 4. Audios: el «secreto» de la casa (`AUDIOS_SECRETO`)

- `shared/audio/historiasAudio.js`: `secretoDeAudios()` lee la variable de entorno `AUDIOS_SECRETO` (sin espacios sobrantes). Entra en la huella (`huellaDelAudio`, `nombreDelFichero`, `audioVigente`) **solo si tiene valor**. **Sin valor la huella es exactamente la de antes** (la prueba lo comprueba con el cálculo viejo escrito a mano).
- El programa (`crearAudiosHistorias.mjs`) lo lee de `.env.local` o del entorno, igual que la clave de la voz, y se lo pone a la función compartida: **programa y servidor usan la misma función**. Sin valor, **avisa** («AVISO: no hay AUDIOS_SECRETO…»); con valor lo dice, sin enseñarlo nunca. No se guarda en el índice ni en ningún fichero.
- El servidor (`/api/historia-audio`) usa `audioVigente`, que lee el mismo secreto de su entorno (dotenv en local, variables de Vercel en producción). Los enlaces directos se quedan. El programa sigue avisando de los ficheros viejos sin borrarlos («Ficheros viejos que ya no se usan…»).
- `pruebaFase6y10_audios.mjs`: nueva parte 6 (huella igual sin secreto, distinta con él, la misma en servidor y programa, el programa avisa y no enseña el valor).
- **Cómo ponerlo en Vercel (sin el valor):** (1) Inventa una frase larga al azar y guárdala aparte (gestor de contraseñas). (2) Vercel › tu proyecto › Settings › Environment Variables › Add: nombre `AUDIOS_SECRETO`, valor = esa frase, entorno **Production** (y Preview si quieres) › Save. (3) Vuelve a desplegar (Deployments › ⋯ › Redeploy), porque las variables solo se leen al arrancar. (4) En tu ordenador, pon la misma línea `AUDIOS_SECRETO=...` en `.env.local` **antes** de lanzar `node scripts/destino/crearAudiosHistorias.mjs`. (5) Si los audios ya estaban creados sin secreto, al ponerlo todos los nombres cambian: el programa los recrea (gasta créditos de la voz) y avisa de los ficheros viejos, que puedes borrar. Sin el mismo valor en el servidor y en el programa, la app no encuentra los audios y suena la voz del móvil.
- Guía (`GUIA_NUEVOS_DESTINOS.md`, apartado de historias): explicado.

## 5. Motor

- El aviso «Llega unos 30 minutos antes» de los Museos a las 12:00 se queda (no se ha tocado).
- **Invariante 593** reescrita: un cierre no quita el sitio; primero se busca otro día y, si de verdad no hay, se queda como parada «Cerrado este día» con la versión «sin él» (ver la 636). No he numerado ninguna invariante nueva.
- `GUIA_NUEVOS_DESTINOS.md`, parte MOTOR: ya estaban «la comida nunca antes de las 12:00» y su excepción `comida_rapida_excepcion` y `comida_rapida_desde` (12:00). He añadido lo que faltaba: los sitios que no se quitan se quedan como «Cerrado este día» cuando de verdad no hay otro día (en el apartado de los sitios grandes).

## 6. Sitios grandes: la regla del Coliseo, a los datos

- `roma.json` › `sitios_grandes.lugares[Coliseo].no_cabe_con_excursion_hasta: "16:30"`.
- `claseDeReserva` (shared/routeEngine/listasReservas.js) ya no escribe «Coliseo» ni 16:30: lee `contexto.destData` (lo pasa `listasTrip.js`) y el campo del sitio. Sin dato (otro destino), sin regla.
- Roma sale **igual**: la prueba nueva compara la función con la copia exacta del código de antes en 77.616 casos (todos los días escritos, los sitios grandes más el Panteón, el Altar y el Foro, cada 5 minutos de 6:00 a 22:00 más los bordes 16:29/16:30/16:31, con y sin Free Tour, con y sin excursión de mañana; 1.048 de ellos pasan por la regla del Coliseo): **0 diferencias**. Además, 1.224 planes completos (dos a cuatro días, 31 fechas, con excursión de medio día de mañana o de tarde y el Coliseo reservado a las 9, 12, 15, 16:30, 17 y 18) comparados contra el código de antes: **0 diferencias**.
- Aviso para ti: en los planes de hoy la rama «excursión de mañana» (`day.halfDayExcursion.soloTarde`) no la activa ninguna cosa del motor actual (solo la leen `listasTrip.js` y `listasOrden.js`; nadie la escribe), así que esa regla del Coliseo está dormida en la práctica. La he movido a los datos igualmente y está probada a nivel de función.
- Free Tour de 10:00 sin día (`server/index.js`): ya no escribe «Free Tour por Roma»; usa `destData.default_free_tour.name` (un destino sin Free Tour no lo pone).
- `pruebaFase6y10_sitiosgrandes.mjs` necesita una copia del código de **antes de la 6y10** (`ref=`), que ya no existe: no se puede lanzar; la sustituye la comparación de la prueba nueva.

## 7. `default_free_tour.disponibilidad.horas`

Solo lo leía `server/index.js` para la tarjeta del Free Tour de EXPLORAR («Sale a las 10:00 y a las 16:00», que era falso: las horas reales son 6). Ahora la tarjeta construye las horas desde la lista única `freeTourHoras.js` («Sale a las 10:00, 12:00, 15:00, 17:00, 19:00 y 21:00.») y he borrado `horas` y `horas_nota` de `roma.json`. **Cambia el texto de esa tarjeta** (para bien); el motor y la ruta de Roma no cambian.

## 8. Los imprescindibles en el orden de los días

`listasOrden.js` pesa lo que se pierde por **nivel** (nivel 1 = 10000, nivel 2 = 100). En los datos de Roma **todo el nivel 1 es imprescindible o joya** (los 11), así que no hay "resto del nivel 1" al que ganar: se queda así, como pedías. Para un destino nuevo con un nivel 1 que no sea todo imprescindible, habría que añadir un peso por `tier` (no lo he puesto para no tocar el orden de Roma sin poder correr las 365).

## 9. `pruebaTanda6g`

Seguía con 1 fallo (`etiqueta_roja`), pero **el fallo era de la prueba, no de la app**: buscaba el texto «Día de viaje» escrito en `DayList.tsx`, y desde la 6y7 la etiqueta sale de `etiquetaDeViaje(title)` (texto en `tituloDelDia.ts`), siempre en `text-accent` (naranja). He puesto la prueba al día (comprueba lo mismo: naranja, no rojo). Ahora 0 fallos.

## 10. Punto 23: viajes 5, 11 y 19 («sobran 150 / 60 min»)

- **Causa.** Los tres llevan el Free Tour **de noche** (21:00, 19:00 y 21:00). Ese tour tiene su hora fija y acaba después de la hora de cenar (el de las 21:00 acaba a las 23:30). `listasTrip.js` (`exceso()`) medía la tarde hasta la última parada **incluido el tour**, así que contaba los 150 minutos del tour como «tiempo que sobra de la tarde» (en el de las 19:00 contaba la cena que va detrás del tour, regla 4). Como el tour no se puede mover ni quitar, no había nada que quitar y salía el aviso «no queda nada que quitar sin romper otra regla».
- **Arreglo.** `exceso()` no cuenta el tour: la tarde se mide hasta su última parada que no es el tour, y la cena que va detrás de un tour que acaba después de la hora de cenar no cuenta como excesiva. Es la misma regla de siempre (lo de menos importancia a «Si te sobra tiempo», los imprescindibles nunca se quitan), solo que ya no se confunde un tour fijo con tiempo que sobra.
- **Qué cambia en la ruta: nada.** Comparado con el código de antes en 1.590 días de viaje con Free Tour de noche (53 fechas × 1 a 5 días × tour de las 19:00 y de las 21:00): 0 paradas distintas, 0 imprescindibles que se quiten; solo desaparece el aviso del registro. En el viaje 11 la Iglesia del Gesù (nivel 2) sigue yendo a «Si te sobra tiempo» por la regla de siempre (no cabe antes del tour y cierra antes de que acabe).
- La prueba nueva comprueba que ninguno de los 20 viajes dice «no cabe del todo» y que el D1 de los tres lleva todos sus imprescindibles y su Free Tour a su hora.

## 11. Etiqueta «Cerrado este día» (punto 15)

No estaba conectada: la tarjeta de una parada que se queda en su día cerrada enseñaba «Hoy cierra» / «Cerrado hoy» en rojo y «0min». Ahora el servidor manda la marca (`closed_this_day` desde `closedThisDay`), llega a la tarjeta (`Stop.closedThisDay`) y `StopAccordion` pone **solo** «Cerrado este día» (sin el reloj de «Cerrado hoy», sin «0min» y sin «Hoy cierra»). La dejo en el rojo de avisos (es un aviso de verdad); ver la pregunta 1.

## Decidido por Code

1. Quitar también el horario especial del Panteón de Año Nuevo y decir en el aviso que cierra (ya cerraba desde la 6y10; Eric solo habló del Coliseo y el Foro).
2. Texto de Año Nuevo: solo se dice «otro día» cuando de verdad se ha puesto otro día; se quita la opción de «dentro de ese horario».
3. Ordenar los imprescindibles que quedan: Piazza Navona, Foro Romano y Palatino, Plaza de San Pedro, Altar de la Patria, Arco de Constantino (de 15 en 15). Nivel 2 ordenado por lo conocido que es.
4. El secreto se recorta de espacios y vale vacío = sin secreto; no se guarda en el índice.
5. La tarjeta del Free Tour de EXPLORAR enseña ahora las 6 horas reales (antes enseñaba 2, mal).
6. `listasOrden.js` no se toca (ver punto 8).
7. `pruebaTanda6g`: arreglada la prueba, no la app.
8. «Cerrado este día» se cablea hasta la tarjeta, en rojo de aviso.

## Invariantes: textos propuestos (para que los numeres tú)

- **Año Nuevo:** «El 1 de enero el Coliseo, el Foro, el Panteón y los Museos Vaticanos cierran (colosseo.it/orari, 13-oct-2026): ninguno lleva un horario corto, y el aviso de Año Nuevo no lo promete. Solo las Termas de Caracalla abren, con su horario reducido.»
- **Audios:** «Los nombres de los audios llevan el secreto de la casa (`AUDIOS_SECRETO`) en la huella, el mismo en el programa y en el servidor; sin valor, la huella es la de siempre y el programa avisa; el secreto no se guarda ni se muestra nunca.»
- **Sitios grandes:** «Las reglas propias de un sitio grande (en Roma, que el Coliseo no cabe con una excursión de mañana hasta las 16:30) salen de los datos del sitio (`no_cabe_con_excursion_hasta`), no del código.»
- **Free Tour:** «El nombre del Free Tour sale de `default_free_tour.name` y sus horas de `freeTourHoras.js`; no hay texto fijo ni una segunda lista de horas en los datos.»
- **Día con Free Tour de noche:** «El Free Tour de la noche (19:00 y 21:00) tiene hora fija: no cuenta como tiempo que sobra de la tarde y no produce el aviso “el día no cabe del todo”.»
- **Cerrado este día en la tarjeta:** «La parada que se queda cerrada lleva en su tarjeta solo “Cerrado este día” (sin “Hoy cierra”, sin “Cerrado hoy”, sin duración).» (Se añade a la 636.)
- (No he usado números nuevos: la 593 está reescrita y la 638 puesta al día.)

## Preguntas abiertas (máximo 5)

1. «Cerrado este día» en la tarjeta: ¿en rojo (aviso) como ahora, o en gris, para que no parezca un error de la app?
2. Orden de los días con el Coliseo cerrado el 1 de enero: en el viaje 13 (30 dic. a 2 ene., Free Tour de las 10:00), el motor deja el día de la Galería (nivel 2) el 1 de enero, que también cierra, y la Galería queda como «Cerrado este día»; así salva el Coliseo (nivel 1) el 31 de diciembre. Es la regla de la 6y10 («el que pierde menos»); no la he cambiado. El registro del motor dice «ningún otro día del viaje lo permite», que aquí es una simplificación (otros días caben, pero a costa del Coliseo). ¿Te parece bien perder la Galería antes que el Coliseo?
3. Para destinos nuevos: ¿añadimos un peso por «imprescindible» en el orden de los días, separado del nivel 1? En Roma no cambia nada (los 11 de nivel 1 son todos imprescindibles o joya).

## Archivos tocados

Datos: `data/pipeline_v2/roma.json`, `data/pipeline_v2/detalle/roma/vaticano.json`. Motor: `shared/routeEngine/listasReservas.js`, `listasTrip.js`, `specialDates.js` (comentario), `shared/audio/historiasAudio.js`. Servidor: `server/index.js`, `server/engine/buildDayV3.js`. App: `src/lib/types.ts`, `mapGeneratedRoute.ts`, `mockDayDetail.ts`, `src/components/route/dayDetail/StopAccordion.tsx`. Programas y pruebas: `scripts/destino/crearAudiosHistorias.mjs`, `megustaInicial6y10.mjs`, `tablaReservas.mjs`, `pruebaFase6y10_audios.mjs`, `pruebaFase6y10_ficha.mjs`, `pruebaFase6y10_sitiosgrandes.mjs`, `pruebaTanda6g.mjs`, **`pruebaTanda7_respuestas.mjs`** (nueva). Docs: `INVARIANTES_PANTALLA.md` (593 y 638), `GUIA_NUEVOS_DESTINOS.md`.

## Pruebas

Todo a **0 fallos** (no he lanzado las 365 fechas, como pediste):

- `pruebaTanda7_respuestas.mjs` (nueva): 261 comprobaciones, 0 fallos.
- Batería afectada, **en serie** (52 pruebas, todas con salida 0 y 0 fallos): `pruebaFase6y10_*` (audios, comida, excursión, ficha, horarios, viajes), `pruebaFase6y9_*`, `pruebaFase6y8_comida`, `pruebaFase6y7_*`, `pruebaFase6y6_cierre`, `pruebaFase6y4_*`, `pruebaTanda6g` a `6z6d` (incluida `pruebaTanda6g`, que ahora da 0 fallos), `pruebaCorr6z6*`, `pruebaTanda6z3` (sin emojis), `6z5` y `pruebaFotos6z3`. No se ha lanzado `pruebaFase6y10_sitiosgrandes.mjs` (necesita una copia del código de antes de la 6y10, `ref=`, que ya no existe; la sustituye la comparación de la prueba nueva).
- Muestra de **54 fechas** con `pruebaListas` (festivos, domingos, lunes, miércoles, Navidad y Año Nuevo, Semana Santa, agosto, cambios de hora): 119.673 viajes, 324.948 días, **0 fallos**.
- Typecheck `npx tsc --noEmit -p tsconfig.app.json`: sin errores.
- Comparación del plan contra el código de antes (copia en una carpeta aparte): 1.378 viajes (53 fechas, 1 a 5 días, sin Free Tour y con cada una de sus horas). Los 424 que cambian llevan todos Free Tour de noche (19:00 o 21:00); en esos días (1.590 días de ruta) hay 0 paradas distintas y 0 imprescindibles que se quiten: solo desaparece el aviso «no cabe del todo» del registro.
