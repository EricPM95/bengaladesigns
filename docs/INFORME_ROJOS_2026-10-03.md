# Informe: lo que salió en rojo en D1, D2, D4 y el Free Tour

Respuesta al encargo `PARA_CODE_ROJOS_D1_D2_D4_FREE_TOUR_2026-10-03`. Cinco commits, sin push (a82eb4d, d56e1d8, fb79450, 706841e, 54c9d13) más este informe. Las pruebas completas están en `docs/MEDIR_ENTRADAS_ROJOS_2026-10-03.md`, `docs/MEDIR_FT_ROJOS_2026-10-03.md` y `docs/PRUEBA365.md`.

## 🔴 En rojo, arriba

**Hora fija rota: 0.** Antes eran 192 (entradas) y 1556 (Free Tour). Ahora, en las 17 155 reservas simuladas y en los 4 380 viajes con Free Tour, ninguna hora fija se mueve ni se quita. Tampoco hay sitios cerrados a su hora, ni imprescindibles quitados sin aviso, ni lugares repetidos el mismo día.

Lo único que sigue en rojo:

- **La Basílica de San Pedro por fuera en un día de Vaticanos: 2 casos en la prueba de las 365 fechas** (los dos son D3, en viajes de 3 días con Free Tour): **24 y 31 de diciembre**. Está escrito a propósito en el día (`fecha:12-24` y `fecha:12-31` de D3): Museos a las 8:00, tour a las 12:00, y entre medias no da tiempo a entrar en la Basílica, que además cierra antes por la misa. No lo he tocado: dime si prefieres otra cosa esos dos días (por ejemplo, ir a la Basílica antes que a los Museos, o dejar el tour para el otro día).
- **Jueves Santo (25 de marzo) con entrada a los Museos:** la Basílica abre a las 12:00 y choca con la entrada. Manda la entrada reservada, y **la Plaza y la Basílica quedan fuera con aviso en la campana** (con todas las horas de entrada de ese día). Es lo que pide la regla 1; si prefieres otra cosa ese día, dímelo.
- **Basílica de San Pedro, Nochebuena y Nochevieja:** cierra a las 15:00 y a las 14:30; con la entrada de las 10:30 en adelante ya no llega y sale por fuera con «cerrada» (no es fallo: está cerrada).

## A. Las dos reglas generales (INVARIANTES 466 y 467)

1. **Una hora fija nunca se mueve ni se quita.** Si lo de antes no cabe: salen primero las opcionales, luego se encoge lo que se puede encoger, luego se acorta la comida (hasta 30 min), y si aun así no cabe se quita lo menor y sale en la campana. La sombra de verano (nada al sol antes de las 16:30) también cede ante una hora fija.
2. **Un mismo sitio, una vez al día** (la única excepción es la nocturna). Un atardecer no es una nocturna: si un sitio sirve para el atardecer va al atardecer, y si el atardecer no cuadra va de día, y solo una vez. Esto también cubre el «Pasea y piérdete por…» de una zona.
   - **Una salvedad que te pregunto:** el parque de Villa Borghese sale dos veces en D4 con dos nombres (de camino a la Galería, y «el lago y el Templo de Esculapio»). Lo dejé como estaba porque lo decidiste tú (PARA_CODE_TODO 5.5). Con la regla 2 estricta saldría en cada viaje donde D4 lleva entrada (más de 200 casos en una muestra de una fecha por semana). ¿Lo dejamos?

## B. D4

- **3. Terraza del Pincio:** ahora sale una sola vez, al atardecer si cuadra y, si no, de día. 0 repetidos en la prueba.
- **4. Verano con entrada a la Galería de 15:00 a 17:45:** variantes nuevas `entrada:quince@verano` y `entrada:tarde@verano`. Orden: comida, Galería en las horas de calor, Parque con elástica, y al final Jardines y Terraza al atardecer. Ejemplo comprobado, jueves 1 de julio: a las 15:00, Galería 15:00 y Parque 17:10; a las 16:00, Galería 16:00 y Parque 18:10; a las 17:45, Galería 17:45. Antes, las 14 fechas de agosto de las 15:00 llegaban a las 17:05-17:25 y 159 entradas de la tarde «no salían por dentro».
- **Un hueco que no he arreglado:** en verano, con la entrada a las 17:00 o a las 17:45 la tarde queda vacía antes de la Galería (96 y 141 min, 53 fechas cada uno), porque el sol manda sobre el parque. Podría ir un descanso largo con nombre, o la comida tranquila a las 15:00; dime cuál.

## C. D2

- **5. Miércoles con entrada de 13:00 a 14:00:** hecho como pedías: 9:00 Puente, Castillo por fuera y Borgo Pio con elástica; comida rápida en Pizzarium; Museos; y **la Plaza y la Basílica después de los Museos**. Comprobado el cierre de la Basílica en su web oficial (basilicasanpietro.va): desde el 1 de junio de 2026 abre de 7:00 a 20:00 todo el año, y los miércoles el motor la abre a las 12:30 por la audiencia. Antes: 153 entradas con la hora rota; ahora 0. Ejemplo, miércoles 13 de enero: entrada 13:00 → Museos 13:00, Plaza 16:10, Basílica 16:40.
  - Para que saliera Pizzarium tuve que hacer que el restaurante escrito junto a la entrada gane al más cercano a la parada de antes (desde Borgo Pio andando son 17 min).
- **6. Lunes:** el Castillo por fuera no cuenta como cerrado ni deja hueco (comprobado). El Tempietto, si cierra, se quita (`si_cerrado: "quitar"`), y quité también los «por fuera» forzados del lunes. **Su tiempo va al paseo de la zona: «La Passeggiata del Gianicolo», de 65 a 70 minutos antes del mirador** (sale 70 veces en la prueba de las 365 fechas, en lunes con la versión D). Esos 65-70 min pasan un poco del límite de 60 que mide la prueba para un paseo con nombre. ¿Lo dejamos así o prefieres que se estire otra parada?
- **7. Domingos:** los Museos cierran los domingos; quité los domingos de la prueba (80 casos). Último domingo de mes, comprobado en museivaticani.va: **gratis, de 9:00 a 14:00, última entrada a las 12:30, sin reserva (se hace cola)**, y no vale si cae en Pascua, 29 de junio, 25, 26 o 31 de diciembre. **Qué haría yo:** ese día no existe una entrada con hora, así que el día se queda como hoy (sin Museos) y la ficha/campana avisa «último domingo: entrada gratis de 9:00 a 12:30, con cola». El 31 de enero de 2027 es último domingo. Si prefieres que el día lleve los Museos a las 9:00 en cola, es una variante nueva `fecha:ultimo_domingo`: dime y la hago.
- **8. «Por fuera para llegar a todo» de 184 a 545:** **todos los 545 son el Castillo de Sant'Angelo, y solo él.** Desde el commit 40aa45f el Castillo va siempre por fuera a propósito, y el motor le ponía la etiqueta «Hoy lo ves por fuera para llegar a todo lo del día», que es falsa. Ejemplo: 3 de febrero de 2027, viaje de 2 días, día 2, 14:40. Arreglo: lo escrito «por fuera» ahora lleva una marca (`outside_authored`) y la prueba ya no lo cuenta (545 → 0). **Pendiente tuyo:** la app sigue enseñando ese texto y el botón «Quiero entrar» en el Castillo (`outsideKind: 'no_cabe'`); no he tocado la pantalla.
  - **La Basílica de San Pedro por fuera en un día de Vaticanos:** está en la prueba como fallo (`basilica_fuera`). Solo salen los dos casos de arriba (D3, 24 y 31 de diciembre).

## D. D1

- **9. Sábados con el orden 2 y el Palazzo Doria Pamphilj:** su web oficial (doriapamphilj.it, «La Visita») dice: viernes a domingo de 10:00 a 20:00 con **última entrada a las 19:00**; el resto, 9:00-19:00 y 18:00. El dato tenía una sola última entrada (18:00) para todos los días, por eso salía «fuera de horario» los sábados. Ahora la ficha tiene `last_entry_by_day` y el relleno no lo coloca después de la última entrada. Ejemplo, sábado 29 de mayo con entrada a las 15:30: el Doria a las 19:00, dentro de horario. 0 fuera de horario.
  - Al arreglar esto salió otro fallo: el Panteón de los sábados de julio y agosto se perdía sin aviso (48 casos) porque quedaba delante del Foro. Arreglado.
- **10. Coliseo desde las 15:30:** la comida ya se alarga (60 min si hay una hora fija detrás) y «Pasea y piérdete por Monti» (elástica de hasta 90 min, opcional, una vez por viaje) llena el rato que quede. Los huecos de más de 30 min de D1 de tarde bajan de **1349 a 431**. **Dónde sigue quedando hueco:**
  - entradas a las **17:30 y a las 18:00** (180 y 171 casos: 80 y 125 min antes del Coliseo; el paseo por Monti no llega a llenarlo);
  - entradas a las **15:30** (68 casos, 34 min antes de Piazza Navona al atardecer) y a las 17:00 (9 casos, 65 min).

## E. El Free Tour añadido después

- **11. El tour se clasifica por su hora:** antes de las 13:00 es de mañana; de 13:00 a 18:59, de tarde; desde las 19:00, de noche. El tour «de noche» de invierno (sale hacia las 16:30) cuenta como de tarde. Comprobado que sale bien, mes a mes y en las fechas de frontera: el tour pasa a ser de noche el **28 de marzo** (el cambio de hora lo lleva de 18:10 a 19:10) y vuelve a ser de tarde el **17 de septiembre**; el cambio de hora de octubre (31) no cambia la franja. Todas esas fechas caben.
- **12. La hora del tour no se mueve nunca.** El tour de las 16:00 pasa de caber en el 11,8 % de los casos a caber en el 100 %.
- **13. Enero sin tour (sábado 2 de enero):** ningún día del viaje traía el tour de esa franja porque, **los sábados, la variante del sábado de D1 reescribía la tarde y se llevaba el tour; los domingos, la variante del domingo de D4 y D4M reescribía la mañana y se lo llevaba.** (Un viaje de 3 días que empieza en sábado es sábado-domingo-lunes y los dos días que podían llevarlo perdían el tour.) Ahora el tour vuelve a ponerse después de esos cambios.
- **14. Medida de nuevo, viajes de 3, 4 y 5 días (365 fechas cada uno):**

| Viaje y tour | Antes | Ahora |
|---|---|---|
| 3 días · mañana · 10:00 | 265 (72,6 %) | 365 (100 %) |
| 3 días · tarde · 16:00 | 43 (11,8 %) | 365 (100 %) |
| 3 días · tarde · 17:00 | 261 (71,5 %) | 365 (100 %) |
| 3 días · noche (20 min antes de la puesta) | 115 (31,5 %) | 365 (100 %) |
| 4 días · mañana · 10:00 | 105 (28,8 %) | 365 (100 %) |
| 4 días · tarde · 16:00 | 43 (11,8 %) | 365 (100 %) |
| 4 días · tarde · 17:00 | 259 (71 %) | 365 (100 %) |
| 4 días · noche | 115 (31,5 %) | 365 (100 %) |
| 5 días · mañana · 10:00 | 105 (28,8 %) | 365 (100 %) |
| 5 días · tarde · 16:00 | 43 (11,8 %) | 365 (100 %) |
| 5 días · tarde · 17:00 | 259 (71 %) | 365 (100 %) |
| 5 días · noche | 115 (31,5 %) | 365 (100 %) |

  - **81 casos caben «con aviso»:** el tour de noche de las 20:30 en julio deja fuera el Altar de la Patria, que sale en la campana («Quedó fuera») y pasa a manos del viajero, como una reserva más.
  - Sobre el tour de noche: sigo sin hora publicada (Civitatis, 2 h, de Santa Maria del Popolo a Navona, «antes de que se ponga el sol»). Medí con 20 minutos antes de la puesta.

## Tabla de lo que cabe, por día y franja de la entrada (antes → ahora)

| Día · franja | Antes: caben | Ahora: caben | Huecos >30 min antes | Huecos >30 min ahora |
|---|---|---|---|---|
| D1 · mañana | 5092 (100 %) | 5092 (100 %) | 49 | 49 |
| D1 · tarde | 1407 (98,5 %) | 1427 (99,9 %) | 1349 | 431 |
| D2 · mañana | 2099 (97,3 %) | 2107 (100 %) | 0 | 0 |
| D2 · mediodía | 900 (96,5 %) | 903 (100 %) | 11 | 53 |
| D2 · primera tarde | 746 (83 %) | 899 (100 %) | 0 | 0 |
| D2 · tarde | 1172 (98 %) | 1196 (100 %) | 350 | 1 |
| D4 · nueve | 311 (100 %) | 311 (100 %) | 94 | 94 |
| D4 · diez | 311 (100 %) | 311 (100 %) | 108 | 108 |
| D4 · mañana | 311 (100 %) | 311 (100 %) | 0 | 0 |
| D4 · mediodía | 933 (100 %) | 933 (100 %) | 0 | 0 |
| D4 · quince | 258 (83 %) | 311 (100 %) | 12 | 12 |
| D4 · tarde | 774 (83 %) | 933 (100 %) | 194 | 112 |

Los casos de D2 bajan porque quité los domingos (Museos cerrados).

## Huecos de más de 30 min que quedan (sin contar el margen de 60 min antes de una entrada)

- **D1 tarde:** lo de arriba (17:30 y 18:00, y algo en 15:30 y 17:00).
- **D4 nueve y diez (94 y 108):** de 35 a 55 min antes de la Terraza del Pincio en invierno; es la espera del atardecer.
- **D4 tarde (112):** verano con 17:00 y 17:45, ver arriba.
- **D2 mediodía (53, antes 11):** de 33 a 53 min antes del Puente Sant'Angelo al atardecer, los miércoles; subió porque ahora el Castillo y el Puente no salen dos veces (regla 2) y el rato que dejan queda libre.
- **D1 mañana (49):** 33-48 min antes del Panteón con entradas de mediodía en verano.

## Cosas que cambié y no estaban en el encargo (por si quieres revisarlas)

- La comida con una hora fija detrás dura 60 min si cabe (antes se quedaba en el mínimo, 30), y a una entrada reservada se llega 30 min antes pero hasta 10 min antes vale (INVARIANTES 469).
- El descanso de después de comer ya no mueve una hora fija (San Clemente a las 14:00 salía a las 14:25: lo vi en la prueba y lo arreglé).
- Un opcional delante de un lugar que se pasaría del cierre se quita primero (la Cúpula antes de la Basílica en Nochebuena); la Basílica, si se pasara del cierre, se recorta hasta el cierre (mínimo 30 min).
- La hora enseñada (de 10 en 10) ya no pasa de la última entrada (el Tempietto a las 17:40 con última entrada a las 17:30).
- La prueba de las 365 fechas: de **1076 a 522** casos en total (el grueso: los 545 del Castillo, que ya no cuentan). Lo único que sube: «tiempo libre de más de 30 min» de 17 a 94 (70 son el paseo del Janículo de los lunes, arriba) y «hora que no cuadra» baja de 201 a 115.
- Probado con una petición real a la API (`/api/curated-day-inside`, 200).
