# Tanda 7 · Parte CONEXIÓN (agente I): cliente ↔ motores, hoja del resumen, avisos de la campana y fuera lo viejo

Todo en mi copia (worktree), commits locales, sin push. Typecheck `npx tsc --noEmit -p tsconfig.app.json`: 0 errores. Prueba nueva: `scripts/destino/pruebaTanda7_conexion.mjs` (+ `_tanda7_conexion_entrada.tsx`).

(Nota técnica: mi copia salía de un commit viejo de la 6y10; lo primero fue traer `main` con `git merge main`, que ya lleva A a G y la integración.)

## LO PRIMERO: lo que hay que saber antes de nada (pregunta 1, bloquea la vuelta en la app real)

**En la app de verdad un viaje de «5 días · 4 noches» lleva 5 días de ruta y NINGÚN día de vuelta aparte** (comprobado a 375 px: el 19 de oct. tiene paradas, `answers.days = 5`, no hay `isReturnLeg`). Los motores de la llegada y de la vuelta, el documento (puntos 1, 2 y 3), la tarjeta de la gratis de E y mi conexión suponen lo contrario: `contentDays = días − 1`, el último día es la vuelta y no lleva ruta. La causa está en el servidor: `/api/generate-skeleton` pide `totalDays = answers.days` días de ruta (`buildSkeletonV2(…, totalDays)`) en lugar de `answers.days − 1`; el cliente (`mapGeneratedRouteToRoute`) ya espera el otro caso y añadiría el día de vuelta solo (`appendReturnLegDay`). E ya lo contó en su pregunta 1 («el reparto por noches, otro agente»); no lo ha hecho nadie de los que he visto.

- **Qué pasa hoy sin ese arreglo:** la LLEGADA funciona entera (el día 1 existe). La VUELTA no se activa: no hay día de vuelta al que ponerle la mañana, así que `requestReturnDay` no pide nada (devuelve null si `skeleton.days.length >= answers.days`) y no se rompe nada.
- **No lo he tocado** (cambia el número de días de TODOS los viajes, también los de la gratis, y puede haber otro agente con ello). Para poder ver la vuelta a 375 px apliqué en local, **sin commit y ya revertido**, este cambio de una línea en `server/index.js › /api/generate-skeleton`: `const totalDays = (answers.days > 1 && findPipelineV2Data(destination) ? answers.days − 1 : answers.days)` (solo destinos con motor). Con él, 15–19 oct. da 4 días de ruta + el día de vuelta, y todo lo de abajo funciona; sin él, la vuelta queda dormida. Es la pregunta 1.

## Qué cambió, punto por punto

### 1. CONEXIÓN: lo que se manda al servidor
Pieza nueva `src/lib/llegadaVuelta.ts`: `datosParaMotor(route, reservas, info)` devuelve `{ llegada?, vuelta? }` en los formatos exactos de `engineExtrasFromRequest`:
- `llegada: { hora, medio: 'avion'|'tren'|'bus'|'ferry', puntoId, zona, excursionReservada?: { dateIso, dayNumber, salida, vuelta, nombre } }`
- `vuelta: { hora, modo, puntoId, zona, excursion?: { nombre, vuelve, medioDia, dateIso, dayNumber } }`

| Caso | Qué se manda |
|---|---|
| De pago, ruta nuestra, con hora | cada mitad que tenga hora, con su medio, su punto y la zona (`'nose'` si «Aún no lo sé»; `null` si sin tocar) |
| Viaje de antes (hora y sin punto) | el punto del traslado más largo de su medio (`puntoDeLaMitad`, dato del destino) |
| Medios mezclados | cada mitad con su medio |
| Mitad sin hora | esa mitad no se manda (solo lo que pone el viajero) |
| Gratis, coche, ruta a mano | NADA. Las horas guardadas no se borran (la prueba lo mira) |
| Ruta a mano, solo para los avisos | sí (`paraAvisos`), porque el endpoint de avisos no devuelve ningún día |
| Excursión reservada el día 1 / el día de vuelta o el último de ruta | va dentro de `llegada` / `vuelta`; una dejada sin día (`noMueve`) no se manda |

Quién las manda (todas las peticiones que piden un día): `routeGenerationOrchestrator.ts` (cada `generate-day-block` al rehacer, solo si es el mismo viaje que se rehace: `soloSiRehace`), `rebuildDay.ts` (rehacer días y rehacer un día), `dayInterruptor.ts`, `adjustDay.ts` y `checkTime.ts` (HOY: ojo, tocados con una línea cada uno; si no, el día 1 de HOY volvería al día de siempre), `WantInsideDialog.tsx`, `AddReservationSheet.tsx` (`reservation-plan`). La prueba lo comprueba mirando el código de cada sitio y pidiendo al servidor de verdad.

**El día de vuelta:** al generar o rehacer, con hora de vuelta, `requestReturnDay` pide el día de vuelta al servidor (`/api/rebuild-day`, número de día = el del final, sin el día sintético en `all_days`). Va en `generated.return_leg_day` (dentro del punto de control, para que sobreviva a reanudar; nunca a la caché de rutas) y `mapGeneratedRouteToRoute` lo pone en lugar del día sintético (mismo número y mismo id). Un día de vuelta hecho por el motor se rehace con los demás al cambiar reservas (`rebuildDay.ts`).

**Lo que sale del motor se guarda en la ruta** (para H y para la hoja): `Route.planLlegada` (= `day.arrival_plan` del día 1) y `Route.planVuelta` (= `day.return_day`), tipados en `src/lib/planLlegadaVuelta.ts`. H los lee de ahí. Al rehacer días sueltos se actualizan con `ponerPlanes`.

### 2. Al poner, cambiar o borrar: rehacer solo + UNA hoja
- `onCambioDeVuelo` (de E) → `rehacerPorCambioDeVuelo` (`src/lib/cambioDeVuelo.ts`): el rehacer de siempre en segundo plano («Actualizando tu ruta…», «gana el último»: usa `regenerateRouteForDates` y `rehacerGeneracion`). Solo de pago, rutas nuestras de un destino curado. **Cambio respecto a E:** una ruta con días cambiados a mano YA se rehace (antes no se rehacía nada); esos días no se tocan.
- Al acabar (`RehacerRuta` → `terminarRehacer`): los días cambiados a mano (los que guardan su copia original) se quedan como estaban, en su número de día; las reservas no se mueven (el motor las recibe en cada petición y `setRoute` ya conserva las del viajero); sale UNA hoja del resumen (`HojaResumenVuelo`, con la `HojaAbajo` de siempre).
- Los textos de la hoja salen del motor (`planLlegada.resumen` y los avisos que no van a la campana; `planVuelta.resumen`) con la fecha de cada día puesta con `nombreDeDia.ts` (`diaCortoProsa`: «mar 10», sin fechas «día 1»). Palabra por palabra, comprobados: «El mar 10 es tu llegada a Roma.», la madrugada con [Cambiar fechas], «Como llegas por la tarde, la Roma antigua pasa al mié 11.», «Villa Borghese no cabe en tu viaje…», las tres de la vuelta con «al aeropuerto / a la estación / al puerto», el Free Tour con [Ver disponibilidad], «El Coliseo lo tienes en «Si te sobra tiempo»…», «El jue 12 lo has cambiado tú…» y «Tus días vuelven a ser enteros…». Solo habla de la mitad que cambia (la zona, de las dos). Termina siempre en un solo [De acuerdo].
- Una zona o un punto que no mueve ningún día no saca hoja (no habría nada que contar).
- Lo propio de la pantalla son dos frases: los días cambiados a mano y «Al borrar los vuelos». Nada inventado: ninguna hora calculada.

### 3. Avisos de la campana
- Endpoint nuevo `POST /api/avisos-de-vuelo` (server/index.js, sin Claude): pide al motor el día 1 y el día de vuelta con lo que manda la app y devuelve solo los avisos (`arrival_plan.avisos` y `return_day.avisos`), nunca un día. Sirve también a la ruta a mano.
- `useAvisosDeVuelo` (montado en `App` con `AvisosDeVueloWatcher`) vuelve a preguntar cuando cambia lo que importa (reservas, horas, puntos, zona, fechas, medio; «gana el último», 350 ms) y deja los avisos en `useAvisosVueloStore`. `useAppNotices` los pinta como `warning`: no se marcan como leídos y se van solos al arreglarse.
- Los cinco del punto 14, palabra por palabra, comprobados contra el servidor de verdad, más la versión con tren y barco y la excursión sin hora de vuelta.
- `AppNotice.acciones` (varios botones) y su pintado en `NoticesSheet`: [Ver mi reserva] abre RESERVAS en el bloque de esa reserva (entradas, o excursiones) y [Pasar este día a Roma] (`src/lib/pasarDiaARoma.ts`) deja el día como un día de la ciudad, con [Deshacer]. La excursión NO se borra: queda en sus reservas con `noMueve` (y `reapplyReservations` ya no la vuelve a poner en el día). Nada se cambia solo.
- «Dos reservas coinciden» de los motores no se repite (ya lo da la campana de siempre con nombres cortos).

### 4. Quitar el vuelo y [Deshacer]
- `rehacerPorCambioDeVuelo` marca el aviso «Deshacer» (`toast.alDeshacer`); `useAddFlowStore.undo` lo ejecuta ANTES de devolver la ruta: `cortarRehacerPorVuelo` apaga el rehacer en marcha (`dejarRutaComoEstaba`: el componente se desmonta y su resultado se ignora), borra lo pendiente y cierra la hoja. Si el rehacer ya había acabado, [Deshacer] devuelve la ruta entera de antes (días incluidos, como ya hacía); la prueba mira los dos casos y a 375 px se vio (el rehacer dura 1-2 s, así que lo normal es el segundo).
- La hoja se abre por debajo del aviso «Deshacer» (capa 94 contra 95) y deja sitio para que no tape [De acuerdo].

### 5. Fuera lo viejo
Borrado: `FlightAdjustSheet.tsx`, `flightOpportunity.ts`, `flightAdjust`/`setFlightAdjust`, «Ajustar este día a tu llegada / a tu vuelta» (y sus avisos rojos «Llegas después» / «Ya te has ido», que usaban las horas calculadas), `fitDayToTrip` y `optimizeDayWithRealTransport` del almacén (solo servían a eso), `optimizeDayWithRealTransport` de `stopScheduling.ts`, `fitMealsToStops`, `mealDroppedByTrip` y el comentario «EN EL CENTRO». Se limpiaron los comentarios de `stopScheduling.ts` y `types.ts`, y `_6z3_entrada.tsx` (+ la prueba `pruebaTanda6z3_dias`, que miraba los avisos de `flightOpportunity`). `fitDayToTrip` ya no lo usaba RESERVAS (E lo quitó): solo DayDetailPanel y una prueba. Nada más lo usaba; no se rompió ninguna otra pantalla. `PlaceFinderPanel` lo quitó D.

Se dejó: `centerMinutesOf`, `leaveMinutesOf` y `puntoDeLaMitad` en `arrivalReturn.ts` (los lee la prueba de E y el motor tiene los suyos); `computeRealStopSchedule` (lo usa `applyRealStopSchedule`).

### 6. La ruta a mano
Las horas solo ponen la barra, el billete y los avisos de reservas contra el vuelo (que sí salen, por `paraAvisos`); no se manda nada a los motores de días, no se rehace nada, sin hoja. «Reorganizar este día» no mira el vuelo (la prueba lo comprueba en el código).

### 7. [Añadir en un día nuevo]
Ya ponía el día nuevo ANTES del día de vuelta (`addFreeDay` inserta antes del `isReturnLeg`) y la vuelta pasa al día siguiente; el aviso de las fechas de E salta (`vueltaCambiada`). Lo comprueba la prueba (día 5 nuevo, día 6 de vuelta, `end` +1, excursión en el día nuevo y nunca en el de vuelta, aviso «revisa que tu vuelta sigue siendo el domingo 15», Deshacer). Depende de la pregunta 1: sin día de vuelta aparte no hay a qué ponerle delante.

### 8. Gratis
Sin hoja, sin avisos, sin nada mandado, sin rehacer; las horas guardadas siguen y el motor no las usa (probado).

### Tres arreglos fuera de mi lista, hechos porque sin ellos no se podía probar
- **La rueda de la hora (E) empezaba a las 6:00**: no se podía poner 0:30 ni un vuelo de las 2:00 (dos filas del documento). Ahora son las 24 horas de 5 en 5 (`LlegadaYVuelta.tsx`).
- `reapplyReservations` salta las excursiones con `noMueve` (para «Pasar este día a Roma»).
- `mapSingleGeneratedDay` conserva `isReturnLeg`.

## Qué se vio a 375 px y qué no
Playwright con el Chrome del equipo, Supabase bloqueado (por eso la campana lleva «Cambios sin guardar»), con el cambio local de la pregunta 1. Capturas en `docs/dias/img/7-resumen-*.jpg`:
`llegada-tarde` (hoja con el día corrido y el día que se cae), `madrugada` (con [Cambiar fechas]), `llegada-0930`, `free-tour` ([Ver disponibilidad]), `vuelta` («última mañana… al aeropuerto»), `borrar-con-deshacer` (la hoja de «Tus días vuelven a ser enteros» con el «Deshacer» flotando), `despues-de-deshacer`, `campana-reserva` («No llegas a tu reserva», [Ver mi reserva]), `campana-excursion` ([Ver mi reserva] · [Pasar este día a Roma]). Comprobado a mano: la hoja sale UNA vez y tras 1-2 s; [Cambiar fechas] cierra y abre el calendario; la excursión pasada a Roma deja el aviso fuera y la reserva marcada; [Deshacer] con el rehacer terminado devuelve la vuelta y cierra la hoja.
**No visto en pantalla** (solo por la prueba): la hoja con tren, autobús y barco; la hoja con un día cambiado a mano; el corte de un rehacer EN MARCHA (dura 1-2 s, no hay manera de pulsar [Deshacer] a tiempo); [Ver mi reserva] llevando a RESERVAS (solo la llamada); la gratis en pantalla (probada con el servidor); [Añadir en un día nuevo] con vuelta puesta (probado en el almacén); `Pasar este día a Roma` con [Deshacer] (el aviso dura 6 s y mi guion llegó tarde; lo comprueba la prueba).

## Pruebas
- Nueva `pruebaTanda7_conexion`: **194 comprobaciones, 0 fallos** (`API_URL=http://localhost:PUERTO node scripts/destino/pruebaTanda7_conexion.mjs`, con el servidor encendido: pide los planes y los avisos al motor de verdad).
- Afectadas, en serie: ver el resultado al final de este informe.
- Ajustadas lo mínimo: `pruebaTanda7_reservas` (una ruta cambiada a mano ahora SÍ se rehace), `pruebaFase6y4_formulario` («una puerta» del calendario: ahora son 5 sitios, entra `HojaResumenVuelo`), `pruebaTanda6z3_dias` y `_6z3_entrada.tsx` (fuera los avisos de `flightOpportunity`), `pruebaFase6y_manual` (fuera las tres llamadas a lo borrado).
- `pruebaFase6y2_reorganizar` (3 fallos) y `pruebaFase6y_reorganizar`: fallan igual en `main`; la causa ya la dio la integración: «Reorganizar» reconoce los tres sitios del test como el día escrito `D1-vaticano` («D1+Vaticano, 2 noches con llegada tarde»), respeta su orden escrito y deja los Museos reservados a las 9:00 en la tarde. No es mía ni de los vuelos; hace falta decidir qué manda, la hora de la reserva o el orden del día escrito.

## Invariantes propuestas (sin número)
- Lo que pone el viajero (hora, medio, punto, zona, excursión reservada) viaja en CADA petición que pide un día al servidor; en la gratis, en coche, sin hora y en la ruta a mano no viaja nada y las horas guardadas no se borran.
- Un cambio de hora, de punto o de zona rehace los días en segundo plano («gana el último»), deja como estaban los días cambiados a mano y las reservas, y saca UNA sola hoja con lo que ha cambiado; sin nada que contar, no hay hoja.
- Todos los textos de la hoja y de la campana de los vuelos salen del motor; la pantalla solo pone las fechas. Ninguna hora calculada.
- Los avisos de reservas contra los vuelos se quedan en la campana hasta que se arreglan; nada cambia solo: [Pasar este día a Roma] solo al pulsarlo, con [Deshacer].
- [Deshacer] de quitar el vuelo corta el rehacer en marcha antes de devolver la ruta.
- El día de vuelta del motor ocupa el sitio del sintético (mismo número e id) y se guarda con la ruta; nunca va a la caché de rutas.

## Decidido por Code
1. **La vuelta espera al reparto por noches** (pregunta 1); no toqué el esqueleto.
2. **Los avisos tienen su endpoint** en vez de salir solo del rehacer: así se actualizan al cambiar una reserva sin rehacer días, y la ruta a mano también los tiene. (El motor ignora `llegada.aMano`; por eso los avisos se piden sin esa marca: el endpoint nunca devuelve ni cambia un día.)
3. **La hoja habla solo de la mitad que cambia**; un cambio de zona o de punto sin efecto en los días no saca hoja.
4. **Una ruta con días cambiados a mano se rehace** (esos días se quedan en su número de día) en vez de no rehacerse nada, como dicen el punto 2 de mi encargo y el documento («los días cambiados a mano no se tocan»).
5. **[Pasar este día a Roma]** = el día se rehace como día de la ciudad sin la excursión y la excursión queda en sus reservas marcada (`noMueve`), con [Deshacer]. El día 4 con interruptor usa `cambiarInterruptor`.
6. **[Ver mi reserva]** abre RESERVAS en el bloque (entradas o excursiones), no en la fila exacta (RESERVAS no tiene aún dónde apuntar a una fila).
7. **Título de la hoja** «Hemos ajustado tu ruta» con la etiqueta «Tus vuelos»: el documento no pone título y la hoja lo necesita; es lo único escrito por mí.
8. Se quitaron también los avisos rojos «Llegas después» / «Ya te has ido» de DÍAS (usaban horas calculadas y eran la otra mitad de «Ajustar este día»).
9. El título de las notificaciones nuevas de la campana («No llegas a tu reserva», «Tu reserva no te da tiempo», «Tu excursión vuelve tarde»…) es mío; el texto debajo es del motor.
10. Rueda de la hora: las 24 horas.

## Preguntas abiertas (5)
1. **El reparto por noches (BLOQUEA la vuelta).** ¿Pido yo el cambio de `/api/generate-skeleton` (días de ruta = `answers.days − 1`, solo destinos con motor) o lo hace el agente de los puntos 1 y 2? Es una línea; cambia el número de días de todos los viajes de Roma (también la gratis, que gana su día de vuelta en blanco con la tarjeta de E).
2. **[Pasar este día a Roma]:** ¿es lo que quieres (el día vuelve a ser de ciudad y la excursión se queda en RESERVAS sin día), o debe borrar la reserva de la excursión?
3. **Días cambiados a mano y el D1 que se corre:** el día cambiado se queda en SU número; si el motor corre el D1 al día 2 y ese día 2 lo cambió el viajero, la Roma antigua puede repetirse o perderse sin que lo avise nada más que la frase «El jue 12 lo has cambiado tú». ¿Basta con esa frase?
4. **Tapones del motor que he visto:** `arrival_plan` solo viaja en el día 1 con `es_dia_1`; con una excursión reservada el día 1 (`excursion_el_dia_1`) puede no traerlo y, entonces, ni la hoja ni los avisos de la llegada salen. No lo he tocado (es del motor).
5. **La hoja pide título** (decidido el 7): ¿«Hemos ajustado tu ruta»?

## Ficheros
Nuevos: `src/lib/llegadaVuelta.ts`, `planLlegadaVuelta.ts`, `resumenDeVuelo.ts`, `avisosDeVuelo.ts`, `pasarDiaARoma.ts`, `src/store/useResumenVueloStore.ts`, `useAvisosVueloStore.ts`, `src/hooks/useAvisosDeVuelo.ts`, `src/components/route/reservas/HojaResumenVuelo.tsx`, `src/components/route/AvisosDeVueloWatcher.tsx`, `scripts/destino/pruebaTanda7_conexion.mjs`, `_tanda7_conexion_entrada.tsx`. Tocados: `src/lib/cambioDeVuelo.ts`, `rebuildDay.ts`, `dayInterruptor.ts`, `adjustDay.ts`, `checkTime.ts`, `routeGenerationOrchestrator.ts`, `mapGeneratedRoute.ts`, `types.ts`, `bookings.ts`, `nombreDeDia.ts`, `arrivalReturn.ts`, `stopScheduling.ts`, `src/store/useRouteStore.ts`, `useAddFlowStore.ts`, `src/hooks/useAppNotices.ts`, `src/components/layout/NoticesSheet.tsx`, `src/components/route/RehacerRuta.tsx`, `DayDetailPanel.tsx`, `StopAccordion.tsx` (solo comentario), `WantInsideDialog.tsx`, `AddReservationSheet.tsx`, `VerDisponibilidad.tsx`, `LlegadaYVuelta.tsx` (la rueda), `src/App.tsx`, `server/index.js` (`/api/avisos-de-vuelo`).

## Resultado de las pruebas afectadas (en serie, servidor propio en el 8895, 0 fallos)
`pruebaTanda7_conexion` (194), `Tanda7_reservas` (159), `Tanda7_mover` (147), `Tanda7_integracion` (870 viajes, 20.760 comprobaciones), `Fase6y2` formulario, fotos, reservas; `6y3` formulario, fotos, reservas; `6y4` ficha, formulario, iconos, listas, perfil, presupuesto, reservas; `6y_manual`; `6y5_pantallas`; `6y6_cierre`; `6y7` historias, pantallas, titulos; `6y8_comida`; `6y9` audios, fichas, freetour, horarios, pantallas; `6y10` audios, comida, excursion, ficha, horarios; `Corr6z6` (las 4); `Tanda6s`, `6t`, `6v`, `6x_franjas`, `6z`, `6z2`, `6z3`, `6z3_dias`, `6z5`, `6z6a` a `6z6d`; `Fase6z6c`, `6z6d`; `Fotos6z3`. Única con fallos: `pruebaFase6y2_reorganizar` (3, ya fallaba en `main`). No lancé las 365 fechas ni las pruebas solo de motor (no toqué el motor). Petición real a la API: `/api/avisos-de-vuelo`, `rebuild-day` y `generate-day-block` con llegada y vuelta, desde el cliente (Playwright), sin 500.
