# Informe de la parte del motor de la Tanda 6y7

Solo el punto 10 del prompt (el Vaticano en miércoles y la línea de la última mañana). La frase de Cáritas se queda y el pool con 1 día es de otro agente.

## Qué pasaba
- Desde la 6y6 el día del Vaticano en miércoles llevaba los Museos como siempre y la Plaza y la Basílica por la tarde, pero **solo sin reserva de los Museos**. Con los Museos reservados un miércoles, la Plaza y la Basílica seguían yendo a primera hora (con los Museos a las 10:00, el motor ponía la Basílica a las 8:00 y la Plaza a las 9:00), justo cuando la audiencia del Papa tiene la plaza.
- La línea de la última mañana decía «con su versión sin Museos (la del miércoles…)», que ya no existe: los Museos no se quitan nunca por ser miércoles.

## Qué se hizo y dónde

### (a) El Vaticano en miércoles se cambia con otro día siempre que se pueda
- Ya era así y no se ha tocado: el D2 lleva el miércoles entre sus `fechas_malas` (`scripts/destino/escritosExtras.mjs`) y `listasOrden.js` lo cambia con otro día entero cuando existe una posición sin problemas (cuesta 1.000 por mala fecha, más que cerrar uno o dos sitios sueltos).
- Se ha comprobado y se deja una prueba (parte 2 de `pruebaFase6y7_motor.mjs`): el D2 solo cae en miércoles cuando no había otra posición sin problemas. Los 4 casos de viajes sin reserva son de 2 días y están justificados: el 1 y el 2 de junio de 2027 (el 2 de junio cierra el D1), el 10 de febrero (el 11 cierra el Vaticano, Pactos de Letrán) y el 29 de junio (San Pedro y San Pablo, el Vaticano cierra).
- La preferencia «el Vaticano no en domingo ni en miércoles» se queda en el documento (líneas de «Qué días lleva cada viaje» y de los cierres) y en el motor. En el documento se ha añadido «siempre que se pueda (el día del Vaticano entero, con otro día del viaje que encaje)».

### (b), (c) y (d) El día del miércoles, con los Museos reservados
Documento (`docs/dias/DIAS_ROMA_PARADAS.md`, día del Vaticano y Trastevere, «Cierres») y datos (`scripts/destino/listasVariantes.mjs` → `data/dias/roma/listas.json` con `listasConvertir.mjs`, 0 dudas) dicen lo mismo:

| Museos reservados | Variante | Cómo queda el miércoles |
|---|---|---|
| Sin reserva, o hasta las 11:30 | `miercoles_audiencia` | Museos, comida en el Borgo, Plaza y Basílica, y lo demás de la tarde |
| De 9:30 a 11:30 | `miercoles_museos_media_manana` (además de la anterior) | Lo mismo, y San Pietro in Montorio y la Fontana dell'Acqua Paola pasan a «Si te sobra tiempo» |
| 12:00 | `miercoles_museos_12` | Mañana sin Museos (Trevi sin gente desde las 8:00, Plaza de España, Via dei Coronari de camino, Puente, Castillo, Conciliazione), comida en el Borgo, Museos, y al salir Plaza y Basílica; sigue todo Trastevere |
| 12:30 y 13:00 | `miercoles_museos_12_30` | Igual, sin Montorio ni la Fontana dell'Acqua Paola (a «Si te sobra tiempo») |
| 13:30, 14:00, 14:30 | `miercoles_museos_mediodia` | Igual, y de Trastevere solo queda el paseo antes de cenar; el resto, a «Si te sobra tiempo» |
| 15:00 y 15:30 | `miercoles_museos_tarde_15` | Mañana sin Museos, comida en el Borgo, Museos a su hora y, al salir, Plaza y Basílica; taxi a Trastevere y paseo; el resto, a «Si te sobra tiempo» |
| 16:00 en adelante | `miercoles_museos_tarde_16` y `_17` | Igual, pero la Plaza y la Basílica van **antes** de los Museos, ya por la tarde (ver pregunta 1) |

- La Plaza y la Basílica nunca quedan antes de la comida, con o sin reserva.
- Los `cuando.reserva` de estas variantes repiten exactamente los tramos de hora que ya existían, así `listasReservas.js` no crea tramos nuevos y la hoja de horas de la reserva no cambia.
- Motor (`shared/routeEngine/listasDia.js`): una condición nueva, `sin_reserva_o_hasta { lugar, hasta }` («sin reserva, o con la reserva a esa hora o antes»), para la variante de «sin reserva o hasta las 9:15/11:30» sin crear un tramo de hora. Es la única línea nueva de motor; las listas son datos del documento.
- Regla 604 de `docs/INVARIANTES_PANTALLA.md` reescrita (sustituye a la de la 6y6). No he añadido reglas con número nuevo para no chocar con las que añadan los otros agentes.

### (e) La línea de la última mañana
Ahora dice: «el del Vaticano, con su versión sin Museos de los cierres (la del domingo: la mañana empieza en San Pedro con la Basílica y las Grutas, y la tarde sigue como siempre, con el Castillo, el Puente y Trastevere)».

## Pruebas
- **Nueva:** `scripts/destino/pruebaFase6y7_motor.mjs` (no usa servidor; llama al motor).
  - Parte 1, documento y datos: 0 fallos.
  - Parte 2 (con `paso=9`): 4.079 viajes (7 formas de 1 a 7 días, todo el año, sin reserva y con el Coliseo reservado en cada día del viaje); el D2 cae en miércoles 36 veces, **las 36 sin ninguna otra posición posible**; 0 casos en los que se podía cambiar.
  - Parte 3 (con `paso=9`): 864 miércoles con los Museos reservados (18 miércoles × 3 formas × 18 horas, de 9:00 a 18:00) y 17.683 comprobaciones, 0 fallos: los Museos a su hora y sin quitarse; la Plaza y la Basílica siempre después de comer; el orden de cada tramo; Montorio y la Fontana dell'Acqua Paola en «Si te sobra tiempo» solo de 9:30 a 11:30; nada repetido; también con la Cúpula en el pool (nunca antes de comer).
- **Ajustada:** `pruebaFase6y6_cierre.mjs` (parte 1: el documento y los datos del miércoles nuevos): 828 comprobaciones, 0 fallos.
- Las pruebas pesadas, ver el final de este informe (cifras al cierre).

## Preguntas abiertas
1. **Museos desde las 16:00 un miércoles.** Eric escribió «los Museos a su hora y, al salir, la Plaza y la Basílica». Con los Museos a las 16:00 o más tarde, al salir (19:00 o más) ya no hay entrada a la Basílica (última, 19:00-19:15), así que ahí he dejado la Plaza y la Basílica **antes** de los Museos, ya por la tarde y después de comer: se cumple lo importante («nunca antes de comer») y es lo que el documento ya hacía con esos Museos. Con los Museos a las 15:00 y 15:30 sí va «al salir». ¿Está bien?
2. **Qué pasa a «Si te sobra tiempo» con los Museos por la tarde.** Eric solo dijo qué hacer con Montorio y la Fontana dell'Acqua Paola cuando los Museos son por la mañana. Con los Museos a mediodía o por la tarde, lo de Trastevere no cabe (la Plaza y la Basílica ocupan la tarde), así que he mandado a «Si te sobra tiempo» la Isla Tiberina, Santa Maria in Trastevere, Montorio, la Fontana dell'Acqua Paola y el Janículo (todo o parte, según la hora; tabla de arriba) y dejado el paseo por Trastevere. ¿Prefiere otra cosa?
3. **La mañana del miércoles con los Museos a mediodía o por la tarde empieza a las 8:00** («Trevi sin gente»). Con los Museos a las 15:00 hay un hueco de más de una hora entre la comida y los Museos; HOY lo rellena con sugerencias cercanas como en cualquier otro hueco.
4. **Lo que no he tocado:** el día de 1 día (D0) y el medio día (D0-medio) tienen su propio miércoles, con la Plaza después de las 12:00 y no después de comer. No estaban en el encargo («el día del Vaticano entero»). ¿Queréis la misma regla ahí?

## Lo que no pude hacer / ojo
- **Los Museos a las 12:00, 12:30 y 13:00 (cualquier día, no solo miércoles) llegan tarde.** El motor de listas no sabe hacer la «comida rápida» antes de unos Museos de mediodía: `comida_rapida_*` está en la configuración (`listasTrip.js`) pero ningún código la usa, y la comida no empieza antes de las 12:30. Comprobado un jueves, sin mis cambios: con los Museos a las 12:00 la fila sale con 132 minutos de retraso. Es anterior a esta tanda y afecta igual al miércoles; lo dejo apuntado, no lo he arreglado (no era el encargo y toca la comida de todos los días).
- No he lanzado la tirada de las 365 fechas (la hace quien integre).
