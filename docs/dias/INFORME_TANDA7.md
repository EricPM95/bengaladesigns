# Informe de la Tanda 7 (llegadas y vueltas)

Informes de cada parte: `INFORME_PARTE_DOCUMENTO_TANDA7.md`, `INFORME_PARTE_DATOSLLEGADA_TANDA7.md`, `INFORME_PARTE_RESPUESTAS_TANDA7.md`, `INFORME_PARTE_MOVER_TANDA7.md`, `INFORME_PARTE_RESERVAS_TANDA7.md`, `INFORME_PARTE_MOTORLLEGADA_TANDA7.md`, `INFORME_PARTE_MOTORVUELTA_TANDA7.md`, `INFORME_PARTE_INTEGRACION_TANDA7.md`, `INFORME_PARTE_FICHA_TANDA7.md`, `INFORME_PARTE_HOY_TANDA7.md`, `INFORME_PARTE_CONEXION_TANDA7.md`, `INFORME_PARTE_UNIFICADO_TANDA7.md` e `INFORME_PARTE_REPARTO_TANDA7.md`. Invariantes nuevas: 642 a 681 (y 19 notas puestas en su sitio en las viejas). Preguntas: `PREGUNTAS_TANDA7.md`.

## Qué se ha hecho, por puntos

0. **Lo que ya existía.** Se reutiliza todo: la hoja de abajo, la campana, el rehacer en segundo plano, [Deshacer], `ListaDeDias`, `StopMenu`, la ventana de llegada y vuelta, las horas de `_llegada.json`. La barra de llegada y vuelta no cambia (`barTextOf`).
1. **Los días por noches.** Un viaje de `n` días lleva `n − 1` días de ruta y el último es el día de vuelta, sin ruta (`diasDeRuta`, un solo sitio; el esqueleto del servidor lo pide así en Roma). Con una sola fecha, 1 día de ruta. Se enseña «5 días · 4 noches» en 13 sitios y, sin fechas, «¿Cuántas noches?».
2. **Sin vuelos y en la gratis**, los días salen como antes (483 viajes con la misma huella). El orden nuevo del 8-oct se borró del documento.
3. **Gratis y de pago.** Lo de pago no lleva candados. Solo la tarjeta «Tu último día también cuenta» (con [Añadir mi vuelta] y el candado, y [Prefiero montarlo yo]).
4. **Lo que pone el viajero (RESERVAS).** El punto de Roma es obligatorio con hora (en viajes viejos, el del traslado más largo del medio); casillas opcionales del otro lado («Sale de» / «Sale», «Llega a» / «Llega»); zona con «Aún no lo sé»; dirección del alojamiento; lo escrito sobrevive a rehacer; aviso de la campana «revisa que tu vuelta sigue siendo…»; [Deshacer] al quitar el vuelo.
5. **Las horas por dentro**: libre = llegada + traslado del punto + 30 min; salir = hora − margen del punto. Solo eligen la fila de una tabla y no se enseñan (tabla abajo).
6. **El día 1 (3 noches o más)**: las filas de llegada (con sus variantes de invierno), con las listas nuevas: tranquila (el D1 «al revés» en verano), rápida, de tarde, ruta del centro a buen paso (desde Navona o desde la Plaza de España), anochecer, noche con y sin cena y «sin ruta». Desde las 14:00 (13:00 en invierno) el D1 pasa entero al día 2 y se cae el último día. Comida al llegar sin restaurante nuestro.
7. **Free Tour de mañana**: el D3 entero, solo la parte del tour, o aviso si el tour ya ha empezado; sin hora, la primera que pille libre. 19:00 y 21:00 van en la noche.
8. **1 y 2 noches**: las mismas versiones; «D1+Vaticano (2 noches con llegada tarde)»; el D0 del miércoles.
9. **Día de vuelta con horas**: tabla por filas, última mañana (la primera que no repite lo ya visto), cinco mañanas cortas, maleta, «Hoy vuelves a casa», «un día más» con vuelos de las 23:00 o más, salida de madrugada (último día con cena y sin nocturna).
10. **Reservas grandes**: en un día de en medio, los dos días enteros; en la llegada tarde y en la vuelta, solo su bloque. Un solo formato en `sitios_grandes` (`bloque`, `entrada_a`, `sin_la_visita`, `no_cabe_con_excursion_hasta`). Roma sale igual.
11. **Lo que se queda fuera** va a «Si te sobra tiempo»; en HOY, [+ Más visitas] («Más para tu día»).
12. **Excursión**: sigue en el día 4; nunca cae en el día de llegada ni en el de vuelta; la reservada no se mueve; [Pasar este día a Roma] solo al pulsarlo y con [Deshacer].
13. **Ficha de llegada y vuelta** con «Para tu zona» (6 zonas × 5 puntos), sin taxi, sin empresas, sin botones de comprar billete; de noche y a primera hora, el traslado privado.
14. **Avisos y hoja del resumen**: una sola hoja al poner, cambiar o borrar vuelos; los avisos de reservas contra el vuelo, en la campana.
15. **Lo que se ve**: billete en DÍAS y HOY, «Día de viaje», «Llegada a {punto}», «Cerrado este día».
16. **«Mover a otro día»** (con fecha, nombre y título; excursión en gris) y **«Cambiar parada»** (EXPLORAR con ⇄).
17. **Respuestas a la 6y10**: el 1 de enero cierran el Coliseo, el Foro y el Panteón; fuera el «viernes noche»; me gusta de partida; `AUDIOS_SECRETO`; el nombre del Free Tour sale de los datos; `pruebaTanda6g` arreglada (era un fallo de la prueba).
18. **El documento** (`DIAS_ROMA_PARADAS.md`) con las listas nuevas y `listas.json` con 0 dudas.
19. **La ruta a mano**: las horas solo ponen barras, billete, «Día de viaje» y avisos.
20. **Fuera lo viejo**: la hoja «¿Ajustamos tu ruta a tu vuelo?», `flightOpportunity.ts`, `flightAdjust`, «Ajustar este día…», `fitDayToTrip`, los avisos «Llegas después» / «Ya te has ido», `PlaceFinderPanel` y un `StopMenu.tsx` viejo que nadie usaba.
21. **Para los destinos que vienen**: nada de Roma en el código; `GUIA_NUEVOS_DESTINOS.md` al día.
22. **Lo que no va**: respetado (sin escala de crucero, sin varios destinos, el margen de salida desde el centro).
23. **Revisión de 20 viajes**: los viajes 5, 11 y 19 ya no dicen «no cabe del todo» (el Free Tour de noche contaba como tiempo que sobra; la ruta no cambia); los viajes 3 y 13 dicen que el 1 de enero cierran; los 20 viajes con una llegada de cada fila y 10 con una vuelta de cada fila están en la prueba.

Además: **el reparto por noches** (Eric, 14-oct: «Cambiar el esqueleto») cerró la pregunta 1 de CONEXIÓN y UNIFICADO, que bloqueaba la vuelta en la app real; y **UNIFICADO** dejó una sola forma de cada dato y una sola tarjeta «Hoy vuelves a casa».

## Qué ve ahora el viajero

- **En el formulario**: «5 días · 4 noches» debajo de las fechas; sin fechas, «¿Cuántas noches?».
- **En RESERVAS** (de pago): al elegir la hora, también el punto de Roma; las casillas opcionales «Sale de» y «Sale» (o «Llega a» y «Llega»); «¿En qué zona te alojas?» con su texto; «Dirección de tu alojamiento (opcional)». Al cambiar algo, los días se rehacen solos («Actualizando tu ruta…») y sale **una** hoja con lo que ha cambiado.
- **En DÍAS**: el billete («LLEGADA · VUELO IB3214», «Reservado») en el día de llegada y en el de vuelta; el título «Día de viaje» con «Barcelona → Roma»; el día de llegada con la versión de su hora; el día de vuelta con su última mañana (o «Hoy vuelves a casa» si el vuelo sale pronto, o «La tarde es tuya hasta que te vayas.» si sale tarde). Al tocar el billete, la ficha de llegada o de vuelta con «Tu mejor opción» para su zona.
- **En la campana**: «Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.», «Has cambiado los días del viaje: revisa que tu vuelta sigue siendo…», etc., con [Ver mi reserva] y, en la excursión, [Pasar este día a Roma].
- **En HOY**: «Llegada a Fiumicino» con el billete antes de la primera parada; «Llegada al aeropuerto» con [Cómo llegar] después de la última; [+ Más visitas] junto a [No me da tiempo] en los días recortados; [Cómo llegar a tu alojamiento] si dio la dirección.
- **En el menú «···» de cada parada**: «Mover a» con la fecha, el nombre y el título de cada día (la excursión en gris); «Cambiar parada» abre EXPLORAR con ⇄.
- **En la gratis**: los días como antes, el día de vuelta en blanco con la tarjeta «Tu último día también cuenta».
- **Una parada cerrada ese día** dice «Cerrado este día» (ya no «Hoy cierra»).

## Las horas por dentro (nunca se enseñan)

«Libre» = hora de llegada + traslado del punto + 30 min. «Salir» = hora de salida − margen del punto. Márgenes: libre, Fiumicino 1:30, Ciampino 1:20, Termini 0:45, Tiburtina (tren) 0:55, estación de autobuses de Tiburtina 0:55, Civitavecchia 2:30; salir, 3:00, 2:50, 0:45, 0:55, 0:55 y 3:50. Sin punto, el del traslado más largo del medio (avión Fiumicino, tren Tiburtina, autobús la estación de autobuses de Tiburtina, barco Civitavecchia).

### Llegada: desde qué hora de llegada (la que pone el viajero) se cae en cada fila

Cada fila empieza en su hora en punto; la de 0:00 a 4:59 mira la hora de llegada tal cual. Lo que pasa de la medianoche sigue siendo el mismo día (última fila).

| Libre a las… (la fila) | Fiumicino | Ciampino | Termini | Tiburtina (tren) | Autobuses de Tiburtina | Civitavecchia |
|---|---|---|---|---|---|---|
| llega de 0:00 a 4:59 (día entero normal) | 0:00 | 0:00 | 0:00 | 0:00 | 0:00 | 0:00 |
| antes de las 10:00 (tranquilo) | 5:00 | 5:00 | 5:00 | 5:00 | 5:00 | 5:00 |
| 10:00 (rápido) | 8:30 | 8:40 | 9:15 | 9:05 | 9:05 | 7:30 |
| 11:00 (solo invierno, rápido de invierno 11) | 9:30 | 9:40 | 10:15 | 10:05 | 10:05 | 8:30 |
| 12:00 (de tarde; en invierno, con comida corta) | 10:30 | 10:40 | 11:15 | 11:05 | 11:05 | 9:30 |
| 13:00 (solo invierno: ruta del centro entera, D1 al día 2) | 11:30 | 11:40 | 12:15 | 12:05 | 12:05 | 10:30 |
| 14:00 (ruta del centro con comida, D1 al día 2) | 12:30 | 12:40 | 13:15 | 13:05 | 13:05 | 11:30 |
| 15:00 (ruta del centro, D1 al día 2) | 13:30 | 13:40 | 14:15 | 14:05 | 14:05 | 12:30 |
| 19:00 (anochecer, D1 al día 2) | 17:30 | 17:40 | 18:15 | 18:05 | 18:05 | 16:30 |
| 20:30 (noche con cena, D1 al día 2) | 19:00 | 19:10 | 19:45 | 19:35 | 19:35 | 18:00 |
| 22:00 (noche sin cena, D1 al día 2) | 20:30 | 20:40 | 21:15 | 21:05 | 21:05 | 19:30 |
| 23:00 o más (sin ruta, D1 al día 2) | 21:30 | 21:40 | 22:15 | 22:05 | 22:05 | 20:30 |

Las filas de 10:00 a 10:59 de invierno (rápida de invierno 10) caen en la misma hora de llegada que la rápida de marzo a octubre. En invierno, la fila «de 12:00 a 12:59» es la misma lista con la comida corta de 45 min.

### Vuelta: desde qué hora de salida del vuelo, tren, autobús o barco (la que pone el viajero) se cae en cada fila

Equivale a «salir» = esa hora − margen del punto, comparada con la hora de la fila de la tabla (la del documento es la de Fiumicino, margen 3:00).

| La fila | Fiumicino | Ciampino | Termini | Tiburtina (tren) | Autobuses de Tiburtina | Civitavecchia |
|---|---|---|---|---|---|---|
| de 0:00 a 4:59 del documento: cuenta como la noche de antes, el día de vuelta solo el traslado | 0:00 | 0:00 | 0:00 | 0:00 | 0:00 | 0:00 |
| de 5:00: solo el traslado (el día de antes, normal) | 5:00 | 4:50 | 2:45 | 2:55 | 2:55 | 5:50 |
| de 9:00: solo el traslado | 9:00 | 8:50 | 6:45 | 6:55 | 6:55 | 9:50 |
| de 13:30: mañana corta, sin comida | 13:30 | 13:20 | 11:15 | 11:25 | 11:25 | 14:20 |
| de 15:00: última mañana entera, sin comida | 15:00 | 14:50 | 12:45 | 12:55 | 12:55 | 15:50 |
| de 17:00: última mañana con comida y tarde libre | 17:00 | 16:50 | 14:45 | 14:55 | 14:55 | 17:50 |
| de 23:00: un día más entero, sin cena ni noche | 23:00 | 22:50 | 20:45 | 20:55 | 20:55 | 23:50 |

La fila de madrugada acaba un minuto antes de la de 5:00 (Fiumicino 4:59, Ciampino 4:49, Termini 2:44, Tiburtina 2:54, Civitavecchia 5:49). Las 24 horas caen en alguna fila para los 6 puntos y para «sin punto»; la prueba lo mira minuto a minuto.

## Los «me gusta» de partida

Resumen (la lista entera, con su cifra y los 21 restaurantes, está en `INFORME_PARTE_RESPUESTAS_TANDA7.md`):

- Los seis primeros, fijos: Coliseo 412, Fontana de Trevi 391, Museos Vaticanos y Capilla Sixtina 368, Basílica de San Pedro 347, Panteón 326, Plaza de España 305.
- Los imprescindibles que quedan, de 15 en 15: Piazza Navona 199, Foro Romano y Palatino 184, Plaza de San Pedro 169, Altar de la Patria 154, Arco de Constantino 139.
- Nivel 2 de 99 a 52 (de Galería Borghese a San Pietro in Montorio y Tempietto), nivel 3 a 0. Restaurantes: 21 con cifra de 199 (Felice a Testaccio) a 100 (Sgarro Bistrot); el resto, 0.
- Los seis primeros son la única excepción a los rangos de siempre (100-199). Todo el nivel 1 de Roma es imprescindible o joya, así que el orden de los días ya pesa primero a los imprescindibles; para un destino nuevo con nivel 1 mezclado habría que añadir un peso por «imprescindible».

## Cómo poner `AUDIOS_SECRETO` en Vercel (sin el valor)

1. Inventa una frase larga al azar y guárdala aparte (gestor de contraseñas). No la escribas en ningún fichero del proyecto.
2. Vercel › tu proyecto › Settings › Environment Variables › Add: nombre `AUDIOS_SECRETO`, valor = esa frase, entorno Production (y Preview si quieres) › Save.
3. Vuelve a desplegar (Deployments › ⋯ › Redeploy): las variables solo se leen al arrancar.
4. En tu ordenador, pon la misma línea `AUDIOS_SECRETO=...` en `.env.local` antes de lanzar `node scripts/destino/crearAudiosHistorias.mjs`.
5. Si los audios ya estaban creados sin secreto, al ponerlo todos los nombres cambian: el programa los recrea (gasta créditos de la voz) y avisa de los ficheros viejos, que puedes borrar tú (el programa no borra nada). Sin el mismo valor en el servidor y en el programa, la app no encuentra los audios y suena la voz del móvil. Mientras no lo pongas, todo funciona como antes y el programa avisa («AVISO: no hay AUDIOS_SECRETO»).

## Los sitios donde ahora sale «5 días · 4 noches»

Todos usan `textoDeDuracion` (`src/lib/duracionViaje.ts`):

1. `src/components/trazo/TrazoCalendar.tsx`: el calendario del formulario y el de toda la app, debajo de las fechas.
2. `src/components/trazo/StepDates.tsx`: la hoja «Aún no sé mis fechas» («¿Cuántas noches?»).
3. `src/components/trazo/StepSummary.tsx`: la fila «Duración» del resumen y «N días · M planes a tu medida».
4. `src/components/trazo/StepManualSummary.tsx`: la fila «Duración» del resumen de «Quiero hacerla yo».
5. `src/components/trazo/StepElegir.tsx`: la línea de arriba de «¿Cómo quieres montar tu itinerario?».
6. `src/components/trazo/TrazoFlow.tsx`: la barra del formulario sin fechas.
7. `src/components/route/RouteOverview.tsx`: la tarjeta del viaje en RUTA (dos líneas: duración y fechas).
8. `src/components/route/ReservasPanel.tsx` (`rangoDelViaje`): la cabecera de RESERVAS y la del presupuesto sin fechas.
9. `src/components/myTrips/TripCard.tsx`: la tarjeta de «Mis viajes» sin fechas.
10. `src/lib/viajesPerfil.ts` y `src/components/perfil/FilaDeViaje.tsx`: «Mis viajes» del Perfil.
11. `src/components/route/hoy/HoyDespues.tsx`: HOY después del viaje.
12. `src/lib/exportPdf.ts`: el PDF.
13. `src/hooks/useAppNotices.ts`: el aviso «Tienes más días que fechas».

No cambian (no son la duración de un viaje): la cifra «días» del mapa del Perfil, la cuenta atrás de RESERVAS, «Se suele hacer en 3-5 días», «el 25% de tus {n} días», «Máximo 14 días» y la cabecera de RUTA (solo fechas).

## Lo que NO tiene dato y Eric debe dar

(De `INFORME_PARTE_DATOSLLEGADA_TANDA7.md`; sin dato, esa opción no sale en «Otras opciones» de noche, y en esos puntos nunca se activa el «modo noche».)

- **Primer y último horario de:** Ciampino (Airlink y autobuses), Tiburtina (FL1 y metro B), Civitavecchia (tren regional), FL1 desde Fiumicino (lo único que sirve a Trastevere), metro A y B, bus 40 y 64, tranvía 8.
- **Los nocturnos:** autobuses nocturnos del aeropuerto a Roma (solo hay un PDF de Cotral sin fecha, citado por una web no oficial) y las líneas «n» de la ciudad (ATAC solo nombra nMA, nMB, nMB1 y nMC, sin paradas ni horas): qué línea n lleva a cada zona y sus horas.
- **Leonardo Express de invierno** (desde el 13-dic-2026) y de cualquier otro año: hoy solo hay el tramo del 14-jun al 12-dic de 2026 (desde el aeropuerto, 5:38 y 23:23; desde Termini, 4:50 y 23:05). El PDF dice 23:23 y la página general 23:27: se usa 23:23.
- **Autobús de Fiumicino a Via Crescenzio (Prati):** la web oficial dice que hay servicio directo, sin precio ni tiempo (los 7 € y 40 min son de webs no oficiales): fuera de la tabla.
- **Autobuses de Ciampino:** sus horarios publicados son de 2022 y 2024; no entran.
- **Autobús del andén 18 de Fiumicino:** su web solo dice «cada 20 min», sin primero ni último.
- **Tren regional de Civitavecchia:** la web de Trenitalia no lista las paradas por tren; Roma San Pietro, Trastevere, Ostiense y Termini salen de un tren de ejemplo (fuente no oficial), por eso la nota «mira en tu billete que el tren pare en Roma…».
- **Enlaces del traslado privado de Roma** (ninguno): sin ellos no sale [Reservar traslado].

## Las pruebas

(Todo a 0 fallos salvo lo que se dice. Las de pantallas, en serie y con servidor propio; las de motor, en paralelo.)

- **Nuevas de la tanda:** `pruebaTanda7_documento` 420; `_datosllegada` 0 fallos (con las tablas de fronteras); `_respuestas` 261; `_mover` 147; `_reservas` 159; `_llegada` 59.334 (y 483 de 483 viajes sin vuelos iguales que antes); `_vuelta` 53.901; `_integracion` 18.062 (870 viajes; días caídos recuperados 45 de 45); `_ficha` 1.295; `_hoy` 128; `_conexion` 194; `_unificado` 465; `_reparto` 2.087.
- **De siempre, a 0:** `pruebaFase6y4_listas` 643, `6y6_cierre` 3.219, `6y7_motor` 17.724, `6y8_comida` 53.559, `6y10_comida` 2.593, `6y10_horarios` 110.990, `6y10_viajes` 118, toda la batería de pantallas (6s, 6t, 6v, 6x, 6z a 6z6d, Corr6z6, Fotos6z3, 6y2 a 6y10…), `pruebaTanda6g` (ahora 0: era un fallo de la prueba).
- **Muestra de 54 fechas** (festivos, domingos, lunes, miércoles, Navidad, Semana Santa, agosto, cambios de hora): sin vuelos, 119.673 viajes y 324.948 días, 0 fallos; con `llegada=15:30 vuelta=23:30`, `llegada=09:00` y `llegada=21:30 vuelta=14:00`, 29.322 viajes y 112.266 días, 0 fallos cada una.
- **Typecheck** `npx tsc --noEmit -p tsconfig.app.json`: 0 errores. Peticiones reales a la API (`generate-day-block`, `rebuild-day`, `reservation-plan`, `avisos-de-vuelo`): ninguna da 500.
- **Fallan igual que antes de la tanda** (no son de ella): `pruebaFase6y2_reorganizar` (3 fallos) y `pruebaFase6y_reorganizar` (4): «Reorganizar» reconoce los sitios como `D1-vaticano` y deja los Museos de las 9:00 en la tarde (pregunta 2 de PREGUNTAS).
- **No sirven ya / no se terminaron:** `pruebaFase6y10_sitiosgrandes` necesita una copia del código de antes de la 6y10 (`ref=`): sin ella pasan solo las partes 0 y 3, y la comparación de Roma la hace `pruebaTanda7_respuestas` (77.616 casos, 0 diferencias). `pruebaFase6y5_motor` se paró tras más de 35 minutos sin acabar (no se sabe su resultado; hay que lanzarla aparte).
- **Las 365 fechas completas** no se han lanzado: van después del push (abajo).

## Qué se vio a 375 px y qué no

Playwright con el Chrome del equipo, Supabase bloqueado a propósito (por eso a veces sale «Cambios sin guardar»). Capturas en `docs/dias/img/7-*.jpg` (110).

- **MOVER:** visto «Mover a» (excursión en gris), mover con [Deshacer] desde DÍAS y desde HOY, «Cambiar parada» con ⇄ y «Ya en tu viaje», cambiar y [Deshacer], «Cerrado este día», el calendario «5 días · 4 noches», «¿Cuántas noches?», RUTA con y sin fechas, Perfil y HOY después. **No visto:** la tarjeta de «Mis viajes» (pide un viaje en la nube), el PDF, el aviso «Tienes más días que fechas», «Cambiar parada» de un destino sin catálogo.
- **RESERVAS:** vistas la ida y la vuelta con las casillas opcionales, la zona con su texto, la dirección con el botón, los billetes de llegada (BCN → FCO) y de vuelta, el aviso de fechas en la campana, la tarjeta de la gratis grande y pequeña, «Elige primero el punto». **No visto:** billete en tren, autobús y barco; la gratis en RESERVAS; [Deshacer] al quitar el vuelo; la tarjeta de la gratis con un día de vuelta real (se puso a mano en el almacén).
- **FICHA:** vistas la ficha de llegada a las 13:00 y a las 23:30, Trastevere (FL1 + tranvía 8, sin Leonardo), «Aún no lo sé», comida al llegar, la vuelta de las 19:00, la ventana sin vuelo y «Día de viaje». **No visto:** la ficha en tren, autobús y barco, [Reservar traslado] (Roma no tiene enlaces).
- **HOY:** vistos la llegada con el billete, [No me da tiempo] y [+ Más visitas], la hoja, «Añadido» con [Deshacer], la llegada al aeropuerto y «Ver cómo ir». **No visto:** las fotos pequeñas de la hoja (salían grises), el clic en [Cómo llegar], la gratis (HOY no existe), tren, autobús y barco.
- **CONEXIÓN:** vistas la hoja del resumen (llegada tarde, madrugada, 9:30, Free Tour, vuelta), borrar con [Deshacer], los avisos de la campana (reserva y excursión). **No visto:** la hoja con tren, autobús y barco o con un día cambiado a mano, el corte de un rehacer en marcha, [Ver mi reserva] llevando a RESERVAS, la gratis, [Pasar este día a Roma] con [Deshacer], [Añadir en un día nuevo] con vuelta.
- **UNIFICADO:** vistos DÍAS (llegada, «Hoy vuelves a casa») y HOY (llegada, vuelta, ficha de vuelta a pantalla completa, [Explorar monumentos]) y la hoja del resumen, con tres viajes del motor metidos en el almacén. **No visto:** el viaje creado de punta a punta por el formulario con la vuelta puesta pulsando.
- **REPARTO:** visto el viaje por el formulario (Madrid → Roma, 15-19 oct): 4 días de ruta y «lun 19 · Día de viaje», la llegada y la vuelta en RESERVAS con sus hojas, la última mañana, «Hoy vuelves a casa», la gratis con su tarjeta, y la excursión en un día nuevo antes del de vuelta. **No visto:** el cambio de fechas completo con el aviso de la campana, qué abre el candado de [Añadir mi vuelta] en local.

## Lo que queda abierto o sin terminar

- Las listas de la vuelta que no caben con la hora más temprana de su fila (pregunta 1).
- «Había excursión» (el día 4 que pasa a ser el de vuelta) y los avisos de un viaje de una sola fecha: el motor de la vuelta no los hizo.
- La ficha de la parada sigue diciendo «Por fuera · Hoy cierra» (lo escribe el motor, `OUTSIDE_REASONS` en `listasTrip.js` y `curatedTrip.js`); la tarjeta ya dice «Cerrado este día».
- Con 2 noches y el Free Tour reservado el día 2, la Roma antigua queda en «Si te sobra tiempo».
- La excursión reservada el día 1 puede no traer `arrival_plan` (`excursion_el_dia_1`): entonces ni la hoja ni los avisos de la llegada salen. Es del motor y no se tocó.
- La rama «excursión de mañana» de la regla del Coliseo (`day.halfDayExcursion.soloTarde`) no la activa nada hoy: la regla está en los datos y probada a nivel de función, pero dormida.

## Decidido por Code

**DOCUMENTO.** Los ids de las listas empiezan por `D` (el convertidor lo exige); «D1+Vaticano (2 noches con llegada tarde)» es el `nombre` de `D1-vaticano`. Dos tablas del día 1 (marzo a octubre e invierno) en vez de una con columnas; la fila de 20:30 a 22:59 son dos (con cena hasta las 22:00, sin ella después). La comida al llegar es una marca de la fila, no está dentro de las listas. Minutos que el prompt no daba: Panteón por dentro ~30 y Navona ~20 en la parte a buen paso del invierno; Via Condotti ~10 (a buen paso) y ~15 (entera); Navona ~45 en el D1 de tarde. Cena y noche de las rápidas de invierno: Il Gabriello (o Poldo e Gianna) y Trevi + Plaza de España. «Via del Corso» va de camino. Además de los tres imprescindibles del D6, pasan a parada corta (~10 min) la Fontana de Trevi del DM-medio y la Plaza de España del D4 con Free Tour de mañana; el «bajar la escalinata» de las variantes del D0 no se toca.

**DATOS DE LLEGADA.** Los dos autobuses de Fiumicino y los dos de Ciampino quedan como opciones separadas (andén 18 y 19; opción 1 y 2), el de menor precio primero. El texto de primera hora es «A esta hora aún no hay tren: el primer Leonardo Express sale del aeropuerto a las 5:38.» La hora que se compara es la exacta del viajero (aterrizar a las 23:23 aún coge el último). Modo noche solo si el servicio de referencia de esa columna (Leonardo en Fiumicino) tiene horario conocido para esa fecha. Las opciones de Civitavecchia empiezan en la estación. Los márgenes de `_llegada.json` ya coincidían con el prompt: no se cambió nada. Las coordenadas de los puntos se añadieron a `_llegada.json` solo para el mapa pequeño de la ficha.

**RESPUESTAS.** Se quitó también el horario especial del Panteón del 1 de enero (ya cerraba desde la 6y10). El aviso de Año Nuevo solo dice «otro día» cuando de verdad se ha puesto otro día. La tarjeta del Free Tour de EXPLORAR enseña las 6 horas reales (antes 2, mal). `listasOrden.js` no se toca (todo el nivel 1 de Roma es imprescindible o joya). `pruebaTanda6g`: se arregló la prueba, no la app. El secreto de los audios se recorta de espacios y vale vacío = sin secreto. Los viajes 5, 11 y 19: causa en `exceso()` de `listasTrip.js`, que contaba el Free Tour de noche como tiempo que sobra.

**MOVER.** El chip de EXPLORAR se llama «Atracciones» (no hay chip «Monumentos» suelto): «Cambiar parada» abre con él y con «Miradores». En «Cambiar parada» no hay Restaurantes, Excursiones ni Free Tour. La ficha del sitio lleva abajo «Cambiar por este →». El aviso de [Deshacer] es «Cambiada por {sitio nuevo}». «Mover a» lleva [Deshacer] siempre (antes solo los días libres). Con 1 día el texto es «1 día», no «1 día · 0 noches». «Cerrado este día» conserva el rojo de antes en DÍAS y HOY y se usa también en EXPLORAR (gris). Se borraron `PlaceFinderPanel`, `poolEntries.ts` y un `StopMenu.tsx` viejo sin uso.

**RESERVAS.** El billete sustituye a la barra cuando hay hora de Roma (de pago, sin coche). El punto se elige en la hoja de la hora. El punto por defecto de los viajes de antes sale de los datos (mayor `al_centro_min`). «Con hora, se pide la zona» es una línea que abre la rueda, no una hoja sola. El aviso de fechas se apoya en la fecha de vuelta vista (`departureFechaVista`). Se quitaron las tarjetas de «oportunidad de vuelo» de RESERVAS. Con la tarjeta grande de la gratis no sale «Añadir lugares». El enlace de Google Maps va en transporte público desde la ubicación del viajero.

**MOTOR DE LA LLEGADA.** Los datos que no caben en `listas.json` van a `destination_config.llegada` de `roma.json`. El día 1 es siempre el D1 (el D0 con 1 noche) en la versión de su fila. La versión tranquila es el D1 con la variante `coliseo_tarde` forzada. La comida al llegar no se mueve. Free Tour con hora: «libre al menos 30 min antes» = `libre ≤ hora − 30`; sin hora, `libre < hora − 30`. Si hay otra reserva grande y la llegada pediría «solo la parte del tour», no se reorganiza nada (solo avisos). Una reserva grande del día 1 antes de las 14:00 hace de ese día el del sitio; las otras van de bloque. Los días que la llegada tarde dejó fuera vuelven solos si una reserva grande los reclama. Con la Galería, el D4 del lunes pierde además el parque de Villa Borghese (lo lleva el bloque). Excursión reservada el día 1: ese día es la excursión.

**MOTOR DE LA VUELTA.** «Lo de después de la comida» de las filas de 15:00 y 17:00 va entero a «Si te sobra tiempo», sin recortar por minutos. El bloque se quita del día del sitio salvo si con eso su mañana se quedaría vacía (los Museos: el día del Vaticano se queda con la Plaza y la Basílica). Una reserva pequeña con la fila «solo el traslado»: el día lleva solo esa parada. Sin fechas no se salta nada (ni 25 de diciembre, ni Pascua, ni el miércoles). Autobús: «Tu autobús sale…». Con «Aún no lo sé»: «Desde tu zona (Termini)…». Un día más con una reserva grande: solo su bloque. La ruta a mano conserva los avisos de reservas. Con salida de madrugada, quitar la nocturna del último día puede cambiar las nocturnas de los primeros días (nunca las paradas).

**INTEGRACIÓN.** Formato único del bloque: `bloque` siempre objeto con `paradas`. `claseDeReserva` lee los límites de los datos. Los ganchos entre llegada y vuelta: día caído (`vuelve_como_dia_mas`), días sustituidos (`sustituidos`), reservas del día de vuelta tratadas por la vuelta. Los `pendientes` de la llegada se quedan en «Si te sobra tiempo» del día 1. Una reserva fuera de hora la avisa el motor y no cuenta como «a su hora».

**FICHA.** Con «Aún no lo sé»: sin «Tu mejor opción» ni lo de Termini; las opciones hasta Termini bajo «Cómo llegar a Termini». De noche el traslado privado es «Tu mejor opción» y no se repite como tarjeta. El traslado privado solo sale donde llegas lejos (aeropuerto y puerto). «Explorar restaurantes» abre en «Recomendados» y «Explorar monumentos» en «Cerca de ti». Ya no salen «Tu última tarde, sin prisas» ni «Tu última hora» en la ficha de vuelta con hora.

**HOY.** «Recortado» = llegada `rapido`, `de_tarde`, `ruta_del_centro` y mañanas de la vuelta. Sin la hora del viajero no hay tarjeta de llegada ni de vuelta. La hoja de [+ Más visitas] sigue abierta tras [Añadir] y se cierra con la última. «Cerrado este día» también en HOY.

**CONEXIÓN.** Los avisos tienen su propio endpoint (`/api/avisos-de-vuelo`) para actualizarse sin rehacer días. Una ruta con días cambiados a mano ya se rehace (esos días no se tocan). [Pasar este día a Roma] deja la excursión en RESERVAS marcada, sin borrarla. [Ver mi reserva] abre RESERVAS en el bloque, no en la fila exacta. La hoja del resumen se titula «Hemos ajustado tu ruta» (etiqueta «Tus vuelos»). Se arregló la rueda de la hora (empezaba a las 6:00; ahora las 24 horas de 5 en 5).

**UNIFICADO.** Los planes viven solo en la ruta. `arrival_day` se guarda tal cual el JSON. La tarjeta de HOY va sin envoltorio. La ficha abierta desde HOY se pinta en el `body`. `pruebaFase6z6e` (2j) se ajustó.

**REPARTO.** «Con días escritos» = el destino tiene `data/dias/<destino>/` leído por `writtenDaysFor`. `buildSkeletonV2` sigue buscando `zone_distribution` con los días de ruta. Con 6 días de ruta o más y una vuelta entre 13:30 y 22:59, el día de vuelta sale con la hoja «Ya has visto lo mejor de Roma». No se subió `engine_version` (Roma nunca usa la caché de rutas).

**CIERRE.** Las invariantes nuevas son la 642 a la 681; la 21 (`contentDays = días − 1`) vive en `INVARIANTES_TECNICO.md` y lleva una nota (`INVARIANTES_MOTOR.md` queda como estaba). Se corrigieron en su sitio la 358, 381, 382, 383, 484, 487, 488, 489, 490, 494, 516, 530, 563, 565, 597, 614, 640 y 641, y se añadió una nota a la 481.

## Pruebas finales del cierre (batería, muestra de fechas, 365 fechas)

- **Batería en serie** (pruebas de pantallas una detrás de otra, 82 pruebas de `Fase6`, `Corr6`, `Tanda6`, `Tanda7` y `Fotos6`): 80 en 0 fallos y 2 con fallo (`pruebaFase6y2_reorganizar`, 3 fallos, y `pruebaFase6y_reorganizar`, 4). Esos 2 fallos NO eran de antes: nacían de las listas nuevas de llegada y vuelta, que «Reorganizar» tomaba por días de ruta. Se arreglaron con una marca en los datos (`solo_llegada_o_vuelta`; ver `INFORME_PARTE_REORGANIZAR_TANDA7.md`) y tras el arreglo vuelven a 0 fallos (782 y 1.166 comprobaciones), igual que `pruebaTanda7_reorganizar` (71), `_integracion`, `_reparto`, `_documento`, `_respuestas` (261) y `pruebaFase6y10_viajes` (118).
- **Muestra de 54 fechas** (`pruebaListas`, con el arreglo ya puesto): 119.673 viajes y 324.948 días, 0 fallos. Es idéntica a la de antes de la tanda: Roma sin vuelos ni llegada sale exactamente igual.
- **Aparte:** `pruebaFase6y5_motor` no se lanzó (tarda más de 40 minutos) y `pruebaFase6y10_sitiosgrandes` solo sirve con `ref=` (una copia del código de antes).
- **Las 365 fechas completas:** se lanzan después del push; su resultado va abajo, en un commit aparte.
