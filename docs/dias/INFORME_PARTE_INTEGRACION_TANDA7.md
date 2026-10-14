# Tanda 7 · Parte INTEGRACIÓN (llegada + vuelta juntas)

Se unen el motor del día de LLEGADA (agente F, rama `worktree-agent-a7e2e9bb2e3bd2944`) y el del día de VUELTA (agente G, en `main` desde 529cd93). Los informes de las dos partes no se han tocado:
`INFORME_PARTE_MOTORLLEGADA_TANDA7.md` y `INFORME_PARTE_MOTORVUELTA_TANDA7.md`.

(Nota técnica: la copia de trabajo salía de un commit anterior a la fusión de G, así que la fusión de F entró "en recto" y los 8 ficheros en conflicto —12 bloques— salieron al fusionar después `main`. El resultado es el mismo.)

## 1. Cómo se resolvió cada conflicto

| Fichero | Qué se hizo |
|---|---|
| `data/pipeline_v2/roma.json` (`sitios_grandes`) | Un solo formato por sitio (ver apartado 2). |
| `server/index.js` (`engineExtrasFromRequest`) | Los dos bloques (`llegada` de F y `vuelta` de G) y UN solo `return` que lleva los dos: `{ …, forceOrder, llegada, ...(vuelta ? { vuelta } : {}) }`. |
| `server/engine/index.js` (`planArgs`) | Lleva a la vez `llegada` y `vuelta`. La vuelta ya no necesita que el servidor le pase los datos de los puntos: los coge el motor (ver apartado 3). Se quita el `arrivalInfoFor` que sobraba. |
| `server/engine/writtenDays.js` | Una sola declaración de `llegadas` y `llegadaInfo`; `writtenDaysFor` devuelve `{ destino, days, llegadas, llegadaInfo }`. |
| `shared/routeEngine/listasReservas.js` (`claseDeReserva`) | UNA sola fuente: los datos (`sitios_grandes[].no_cabe_con_excursion_hasta`). La función acepta `contexto.destData` (G) o `contexto.limitesConExcursion` (F); los dos salen de `limitesConExcursionDe(destData)`, que lee los datos. El motor pasa `destData`. Nada escrito en el código. |
| `shared/routeEngine/listasTrip.js` | Desestructuración de `args` con las claves de los dos (`llegada: llegadaIn`, `vuelta: vueltaIn`); `contextoDe` con las dos ideas (reservas propias del día de vuelta de G y `forzar`/`entradasApp` de F); llamada a `claseDeReserva` con `destData`. |
| `scripts/destino/viajes20Lib.mjs` | Se quedan `LLEGADAS_20` y `VIAJES_VUELTA` (más sus ayudas). |
| `scripts/destino/pruebaFase6y10_sitiosgrandes.mjs` | Ver apartado 6. |

## 2. El formato único del bloque (`sitios_grandes.lugares[]`)

Se quedó el de G (objeto con `paradas`, que ya sabe lo del miércoles) más lo de F:

- `bloque`: SIEMPRE objeto `{ "paradas": [...], "despues_de_comer": { "dias_semana": [...], "paradas": [...] } }` (el segundo, opcional).
- `entrada_a` (G), `sin_la_visita` (F), `nunca_se_quita`, `no_cabe_con_excursion_hasta`, `dias`, `nombre`, `del`, `el`.

`shared/routeEngine/llegadaDia1.js` lee ahora `sitio.bloque.paradas` (antes `sitio.bloque` como lista). `docs/dias/GUIA_NUEVOS_DESTINOS.md` explica este único formato y cómo se unen los ganchos.

## 3. Cómo se unen los ganchos

1. **Día caído** (`diaCaidoAlLlegar`). En `listasTrip.js` la variable `let diaCaidoAlLlegar` vale lo que decidió la llegada (`plan.llegada.hooks.vuelta.vuelve_como_dia_mas`) cuando hay llegada con hora; si no, lo que traiga la petición (`vuelta.diaCaidoAlLlegar`). La vuelta de las 23:00 o más lo trae como «un día más» (`origen: "cayo_al_llegar"`). Con otras filas de la tabla el día caído NO se repite.
2. **Días sustituidos** (nuevo, `hooks.vuelta.sustituidos`). La llegada cambia el D1 por una versión suya (`D1-rapido`, `D1-centro-navona`…). Sin este dato la vuelta creía que el D1 «faltaba» y lo traía otra vez como «un día más» (repetía el Campidoglio, el Foro…). Ahora la vuelta sabe qué días de la tabla siguen en el viaje con otra forma.
3. **Reservas del día de vuelta.** Las trata la vuelta (su bloque a su hora). La llegada ya no las toma por reservas «de otro día» que reclaman el D1 (el Coliseo reservado el día de vuelta le quitaba el D1 a la llegada y metía el Coliseo dos veces). Solo con una vuelta de pago que corre de verdad (no con la ruta a mano).
4. **Días «dueños» de una visita.** Para dejar una visita fuera de los días de ruta cuando su reserva es del día de vuelta, `vueltaDia.js` ya no mira solo `dias`: suma las claves de `sin_la_visita` y cualquier día escrito cuya lista lleve la visita por dentro (el D1 «de tarde», «la rápida»…). Sale de los datos y de las listas.
5. **Lo ya visto en «un día más» y en la última mañana.** El día que vuelve (D4, por ejemplo) comparte calles con la «ruta del centro» de la llegada (Trevi, Plaza de España, Via Condotti…). Se aplica la regla de siempre de los imprescindibles: si ya se vieron, parada corta (~10 min); lo que no es imprescindible, «de camino» («Ya lo visitaste…»).
6. **Datos de los puntos.** Llegada y vuelta leen los mismos (`written.llegadaInfo`, de `_llegada.json`). Una sola fuente.

Sin llegada y sin vuelta todo sale igual que antes de la tanda (comprobado por `pruebaTanda7_llegada` con la huella de `_baseline_sinvuelos.json`, y por `pruebaTanda7_integracion`, apartado «apagado»).

## 4. La prueba de integración nueva

`node scripts/destino/pruebaTanda7_integracion.mjs [solo=cruce,cruce2,rejilla,reservas,apagado,ganchos,servidor] [muestras=500] [ver=25]`

1. `cruce`: los 20 viajes de la revisión con SU llegada × una vuelta de cada fila (7).
2. `cruce2`: los 10 `VIAJES_VUELTA` × las 20 llegadas.
3. `rejilla`: 500 viajes al azar (siempre los mismos) de 1 a 7 noches, verano e invierno, con y sin fechas, Free Tour con y sin hora, excursión, 6 puntos y 4 medios.
4. `reservas`: Coliseo, Museos, Galería y pequeñas en el día 1 y en el de vuelta a la vez (3 vuelos × 10 casos, con fechas en que los sitios abren).
5. `apagado`: gratis, ruta a mano, solo llegada, solo vuelta.
6. `ganchos`: el día caído vuelve (45 casos) o no se repite.
7. `servidor`: `buildDayBlockV3` con `llegada` y `vuelta`.

Mira por viaje: sin errores, sin días repetidos, sin paradas repetidas **nuevas** (las que no salen ni con solo la llegada ni con solo la vuelta; los imprescindibles que vuelven cortos están permitidos), el día caído no se pierde, los «nunca se quita» no desaparecen, los días de ruta no cambian por la vuelta (salvo las nocturnas con salida de madrugada), reservas a su hora, comida entre 12:00 y 15:00, 0 nocturnas repetidas, textos sin empresas, sin «taxi», sin «Día n» y sin horas que no sean del viajero, más todas las comprobaciones de siempre (`comprobarViaje`).

Los solapes entre días escritos del propio documento (la Plaza de San Pedro en la Cúpula del D6, las calles del centro y el D4) ya existían con solo la llegada o solo la vuelta: salen en el informe de la prueba, no como fallo.

## 5. Pruebas

Todo a **0 fallos** (servidor propio en el 8893, ya apagado):

- Nueva `pruebaTanda7_integracion`: 870 viajes, 18.062 comprobaciones, 0 fallos (unos 50 s). Días caídos recuperados como «un día más»: 45 de 45.
- `pruebaTanda7_llegada`, `pruebaTanda7_vuelta`, `pruebaTanda7_documento`, `pruebaTanda7_datosllegada`, `pruebaTanda7_respuestas`.
- `pruebaFase6y4_listas`, `6y6_cierre`, `6y7_motor`, `6y8_comida`, `6y9_freetour`, `6y9_horarios`, `6y10_viajes`, `6y10_comida`, `6y10_horarios`, `6y10_sitiosgrandes` (sin `ref=`: partes 0 y 3), `6y10_excursion`, `6y10_ficha`, `6y10_audios`, `6y2_reservas`, `6y3_reservas`, `6y4_reservas`, `6y7_titulos`, `6y9_pantallas`, `Corr6z6_reservas`.
- `pruebaTanda6g`, `6h`, `6i`, `6j`, `6k`, `6l`, `6o`, `6r`, `6u`, `6z6`, y en serie las de SSR `6s`, `6t`, `6v`, `6x_franjas`, `6z`, `6z2`, `6z3`, `6z3_dias`, `6z5`, `6z6a` a `6z6d`, `Fase6z6c`, `Fase6z6d`, `Tanda7_mover`, `Tanda7_reservas`.
- Muestra de 54 fechas con `pruebaListas`: sin vuelos 119.673 viajes / 324.948 días / 0 fallos (las mismas cifras que antes de la tanda); con `llegada=15:30 vuelta=23:30`, `llegada=09:00` y `llegada=21:30 vuelta=14:00`: 29.322 viajes / 112.266 días / 0 fallos cada una.
- `npx tsc --noEmit -p tsconfig.app.json`: limpio.
- Petición real a la API (`generate-day-block` de los días 1 a 4 con solo llegada, solo vuelta, las dos y ninguna; `rebuild-day`; `reservation-plan`; datos raros y 400 sin datos): ninguna da 500.
- NO terminada: `pruebaFase6y5_motor` (no estaba en la lista; tardó más de 35 minutos y la paré; no se sabe su resultado). Falla igual en `main`, sin la fusión: las dos `reorganizar` (apartado 6).

## 6. Decidido por Code

- **`pruebaFase6y10_sitiosgrandes.mjs`**: sus partes 1 y 2 comparan Roma con el código de ANTES de la 6y10 (`ref=`, commit bef2731); ya no pueden valer para la tanda entera (Roma tiene llegada y vuelta). Queda como herramienta con `ref=`; sin `ref=` pasan las partes 0 y 3 (destino de mentira), que sí valen siempre. Está dicho en su cabecera.
- **`pruebaListas.mjs`** acepta `vuelta=HH:MM` (`vmedio=`, `vpunto=`) además de `llegada=`, y se pueden combinar.
- **`/api/generate-route` no existe** en este servidor (son `generate-skeleton`, `generate-day-places` y `generate-day-block`); la petición real se hizo contra `generate-day-block`, `rebuild-day` y `reservation-plan`.
- **Reservas fuera de hora**: una reserva a una hora que la lista del documento no cubre, o en un día en que el sitio cierra (los Museos un domingo), la avisa el motor y no cuenta como «a su hora»; la prueba elige fechas en que abren.
- `pendientes` de la llegada (`hooks.vuelta.pendientes`, solo con 2 noches y Free Tour): se quedan en «Si te sobra tiempo» del día 1; no se llevan a la mañana de la vuelta (no se inventa una mañana).
- **Fallo anterior**: `pruebaFase6y2_reorganizar` (3 fallos) y `pruebaFase6y_reorganizar` (4) fallan IGUAL en `main` sin la fusión (comprobado con una copia de `main`). No son de esta tanda. Causa: «Reorganizar» reconoce los tres sitios del test como el día escrito `D1-vaticano` («D1+Vaticano, 2 noches con llegada tarde»), respeta su orden sagrado y deja los Museos reservados a las 9:00 en la tarde. No se ha tocado (hace falta decidir qué hora manda sobre el orden escrito).
- `pruebaTanda6g` ya pasa a 0 fallos (F actualizó su regla); no queda el fallo `etiqueta_roja`.

## 7. Preguntas abiertas

Nuevas de la integración:

1. **«Un día más» con calles repetidas.** Cuando vuelve el D4 y la llegada ya llevó la «ruta del centro», las calles comunes pasan a parada corta / de camino. ¿Prefieres eso, o que el día que vuelve sea otro distinto?
2. **Última mañana con día caído.** Si la vuelta es de las filas de mañana, la última mañana puede ser la del día que cayó (no es repetir: no se vio). ¿Bien?

Vigentes de F (INFORME_PARTE_MOTORLLEGADA_TANDA7, apartado 10): 1 (Museos el día 1 repiten la Plaza y la Basílica en el día del Vaticano; es la misma duda que la 2 de G), 2 (Free Tour de 19:00 con la llegada tranquila), 3 (Coliseo reservado un día de en medio con llegada rápida/de tarde), 4 (2 noches + Free Tour el día 2), 5 (comida a medianoche con dos horas fijas).

Vigentes de G (INFORME_PARTE_MOTORVUELTA_TANDA7, apartado 9): 1 (11 listas que no caben con la hora más temprana de su fila), 2 (Plaza y Basílica en el bloque de la vuelta y en la versión sin Museos), 3 (reserva pequeña con vuelo de «solo traslado»), 4 (excursión reservada el día de vuelta), 5 («Tu autobús sale…»).

Fuera de esta tanda: los dos «Reorganizar» (apartado 6).
