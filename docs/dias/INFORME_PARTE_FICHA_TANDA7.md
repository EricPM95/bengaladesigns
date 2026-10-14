# Informe parte FICHA (agente H) · Tanda 7

Todo en mi copia (worktree), commits locales, sin push. `npx tsc --noEmit -p tsconfig.app.json`: limpio.

## Qué cambió, punto por punto

### 1. La ficha de llegada y vuelta (punto 13)
- **Sin vuelo puesto, y siempre en la gratis, en coche**: la ventana de siempre (`ArrivalReturnSheet`) con la información general de todos los puntos: la distancia, el transporte público con su precio y su tiempo y la pestaña de traslado privado. Cambios mínimos: los títulos «De {punto} al centro» / «Del centro a {punto}» son ahora «De {punto} a tu alojamiento» / «De tu alojamiento a {punto}»; el texto de Traslados ya no dice «al centro de la ciudad».
- **De pago y con la hora puesta (no coche)**: el resumen del diseño, de arriba abajo y solo con datos. Está en `src/lib/fichaLlegada.ts` (`construirFicha`, todo el texto como datos) y se pinta en `FichaResumen.tsx`. Orden: aviso «Aún no lo sé» (si toca) · primera frase + dato real · aviso de noche · «Tu mejor opción» (con precio y tiempo de cada tramo, nunca un total) · lo de Termini (solo si su mejor opción pasa por Termini) · «Otras opciones» (solo las que sirven) · traslado privado · comida al llegar · «Tu ruta empieza en…» + [Cómo llegar a tu alojamiento] (solo con dirección, pieza `BotonComoLlegarAlojamiento` de E). A la vuelta: primera frase, mejor opción, otras, traslado, maleta (con la consigna: sitio, horario y precio) y «Arrivederci, Roma.».
- La zona sale de `paraTuZona` con la hora y la fecha; de noche/primera hora (fecha en el tramo del dato del Leonardo) la mejor opción es el traslado privado con el aviso del dato y «Otras opciones · solo lo que sigue funcionando» solo con lo que tiene horario (si no queda nada, la sección no sale). A la vuelta la hora que se mira es la de salir de su zona (vuelo − margen); se usa por dentro y no se enseña.
- Mapa pequeño de arriba: el punto, Termini si su mejor opción pasa por allí y su zona, con una línea. Para eso añadí `coordenadas` a cada punto de `_llegada.json` y `coordinates` al tipo de las zonas.
- Fuera el taxi: `ArrivalDetailSheet` (pantalla vieja, SOLO la usa la tarjeta de transporte de un día de cambio de ciudad) ya no enseña «Taxi» ni `taxiPriceLabel`; el mock sin «Tren/autobús directo al centro».
- Sin botones [Comprar billete]. El traslado privado va en frambuesa; [Reservar traslado] abre la pestaña Traslados y **solo sale si el punto tiene enlace en los datos** (ver pregunta 1).
- La hora de salir/libre no se enseña en ningún sitio.

### 2. La tarjeta «Hoy vuelves a casa» (punto 9)
- Componente reutilizable **`src/components/route/dayDetail/TarjetaHoyVuelves.tsx`**, props: `tarjeta: TarjetaHoyVuelvesDato` (la que da el motor en `day.returnDay.tarjeta`; con salida de madrugada, `returnDay.tarjetaUltimoDia`; tipo en `src/lib/types.ts`), `onVerComoIr: () => void` (abrir la ficha de vuelta), `onExplorarMonumentos: () => void`, `className?`. Todos los textos vienen hechos del motor; el componente solo dibuja (`data-tarjeta-hoy-vuelves="dia|madrugada"`).
- En DÍAS (`DayDetailPanel`): sale en el día de vuelta (de pago) y, con madrugada, al final del último día de ruta (lee `returnDay` del día de vuelta). [Ver cómo ir] abre la ficha de vuelta; [Explorar monumentos] abre EXPLORAR › Atracciones (el chip de los monumentos hoy) en «Cerca de ti».
- **Para J (HOY)**: pone `<TarjetaHoyVuelves tarjeta=… onVerComoIr=… onExplorarMonumentos=… />`. Para abrir EXPLORAR: `useExploreAperturaStore.pedir({ categoria: 'atracciones', origen: null, cerca: true })` y `setMode('explore')`. Estaba ya hecho en `DayDetailPanel` (`abrirExplorar`).
- Engancho con el motor (a falta de la conexión de I): `DayPlan.arrivalDay`, `DayPlan.returnDay` y `MealSlot.noRestaurant` (tipos en `types.ts`) se rellenan en `mapGeneratedRoute.ts` (`arrival_day`, `return_day`, `meals[].no_restaurant`). **Posible choque al fundir con I**: si I añade los mismos campos con otro nombre, hay que dejar uno solo.

### 3. «Día de viaje» (punto 15)
- `tituloDelDia.ts`: un día de llegada (`esDiaDeLlegada`: lo marca `arrivalDay` o es el primero con hora de llegada) o de vuelta sin paradas se llama «Día de viaje», nunca «Día libre». Un día de en medio sin paradas sigue siendo «Día libre».
- Línea pequeña de DÍAS: «Barcelona → Roma · Día de viaje» (el trayecto primero; si el título ya es «Día de viaje», solo el trayecto). Nueva `lineaDeViaje()`. **HOY (`HoyDurante.tsx`, de J) sigue con el orden viejo «Día de viaje · Barcelona → Roma»**: J debe usar `etiquetaDeViaje` en el mismo orden que DÍAS (trayecto, `· Día de viaje`).

### 4. El billete abre su ficha
- Comprobado: el billete de la llegada abre `setArrivalSheet('llegada')`, el de la vuelta `abrirFichaDeVuelta()` (ficha de vuelta); sin hora puesta sigue la barra blanca/azul «+ Vuelo» y su ficha es la información general. Con hora y sin punto elegido, `ArrivalReturnSheet` ahora usa el punto por defecto (`puntoDeLaMitad`), igual que el billete.

## Pruebas
- Nueva `scripts/destino/pruebaTanda7_ficha.mjs` (+ `_tanda7_ficha_entrada.tsx`): **1295 comprobaciones, 0 fallos**. Cubre los textos del punto 13 palabra por palabra para avión (Fiumicino, Ciampino), tren (Termini, Tiburtina), autobús y barco × las 6 zonas + «Aún no lo sé» (llegada y vuelta), noche y primera hora (llegada y vuelta), Trastevere sin Leonardo, lo de Termini, comida al llegar solo si el motor la marca, botón de alojamiento solo con dirección, sin taxi/empresas/«centro» ajeno/horas calculadas/tiempo total, ficha solo de pago y con hora, traslado solo con enlace, la tarjeta con los datos REALES del motor (avión, tren, autobús, barco, madrugada, sin zona), en DÍAS y no en la gratis, «Día de viaje», y los botones de EXPLORAR.
- Pasan a 0 fallos (en serie, servidor propio): todas las de la lista (6y2 a 6y10 salvo las dichas, Corr6z6*, 6s, 6t, 6v, 6x, 6z, 6z2, 6z3, 6z5, 6z6a-d, Tanda7_reservas, Tanda7_mover, Fotos6z3). **No corridas**: `pruebaFase6y5_motor`, `6y7_motor`, `6y10_viajes`, `6y10_sitiosgrandes` (motor; no toco motor ni `shared/`). Siguen fallando como antes y no son mías: `6y2_reorganizar` y `6y_reorganizar`.
- Viejas ajustadas (lo mínimo): `6y2_formulario`, `6y_formulario` (línea pequeña con el trayecto primero), `6t` (con hora puesta la vuelta ya sigue el punto 13, sin «Tu última tarde»; ese texto se comprueba sin hora), `6z6c` (regex de `initialNearby`).

## A 375 px (Playwright, Chrome del equipo, Supabase bloqueado)
Capturas en `docs/dias/img/7-ficha-*.jpg`: `llegada-1300-a/b/c` (Fiumicino, Centro), `llegada-2330-*` (noche), `llegada-trastevere-*` (FL1 + tranvía 8, sin Leonardo), `llegada-nose-*`, `llegada-comida-prati`, `explorar-restaurantes`, `vuelta-1900-*`, `sin-vuelo-barra`, `sin-vuelo-general-*`, `tarjeta-hoy-vuelves` (+ `-tren`), `vuelta-desde-tarjeta-*`, `explorar-monumentos`, `titulo-dia-de-viaje`, `gratis-dia1`. Viaje creado con el flujo real; las horas, la zona, la dirección y el día de vuelta/tarjeta se pusieron en el almacén del navegador (como lo haría RESERVAS y el motor). **No visto**: ficha en tren/autobús/barco en pantalla (solo por la prueba), [Reservar traslado] (Roma no tiene enlaces: solo por la prueba con un enlace de mentira), la tarjeta con datos del motor conectado de verdad (falta la conexión de I).

## Invariantes propuestas (sin número)
- La ficha de llegada y vuelta, de pago y con la hora puesta, solo dice lo del punto 13: primera frase del medio, dato real, «Tu mejor opción» de `paraTuZona`, lo de Termini solo si pasa por Termini, otras solo las que sirven, traslado privado sin precio, comida solo con la marca del motor y botón del alojamiento solo con dirección; sin hora, o en la gratis, la información general.
- Nada en la ficha, «Para tu zona», los Tips ni la tarjeta dice «taxi», nombra una empresa, enseña una hora que calcule la app ni suma tiempos; «centro» solo en datos reales.
- La tarjeta «Hoy vuelves a casa» es un componente (`TarjetaHoyVuelves`) que solo dibuja lo que da el motor; sale solo de pago.
- Un día de llegada o de vuelta sin paradas se llama «Día de viaje», nunca «Día libre»; la línea pequeña es «{origen} → Roma · Día de viaje» (sin repetir si el título ya lo dice).
- (Cambiar la invariante 614: «un día sin paradas, "Día libre"; el de vuelta sintético…» → «un día de llegada o de vuelta sin paradas, "Día de viaje"».)

## Decidido por Code
1. Resumen con «Aún no lo sé»: sin «Tu mejor opción» ni lo de Termini; las opciones hasta Termini van con el título «Cómo llegar a Termini» (a la vuelta, «Cómo ir desde Termini»).
2. De noche, el traslado privado es «Tu mejor opción» y no se repite como tarjeta aparte.
3. El traslado privado solo sale donde llegas lejos (aeropuerto y puerto), como ya hacía la pestaña Traslados; a la vuelta en barco, «te dejan en el puerto» (dato nuevo `tarjeta_vuelta_barco`).
4. Primera frase: aeropuerto y puerto por su nombre corto («Fiumicino», «Civitavecchia»); estación por el suyo («Roma Termini»), igual que la tarjeta del motor.
5. «Ya estás en Termini» cuando la zona es Termini y se llega a Termini.
6. Después de «y», los nombres genéricos van en minúscula («bus 40 o 64», «metro A»); los propios no.
7. «Explorar restaurantes» abre en «Recomendados» (con «Cerca de ti» a un toque); «Explorar monumentos», directamente en «Cerca de ti». En la app el orden se llama «Cerca de ti», no «Cerca de mí».
8. Coordenadas de los puntos de Roma añadidas a `_llegada.json` (solo para el mapa pequeño).

## Preguntas abiertas
1. **Roma no tiene enlaces de traslado privado** (se quitaron el 9-oct hasta tener enlaces). Sin enlace no se enseña [Reservar traslado]; de noche, donde el traslado es «Tu mejor opción», no hay forma de reservarlo. ¿Pones los enlaces, o enseño el botón igual?
2. La tarjeta del motor escribe «Tranvía 8 a Largo di Torre Argentina y **Bus** 40 o 64…» con mayúscula en medio (`fraseDeOpcion`, motor G) y «Tu autobús sale de Estación de autobuses de Tiburtina…»; la ficha lo escribe distinto («y bus 40…»). ¿Lo igualo en el motor?
3. HOY (J) debe cambiar el orden de la línea pequeña del día de viaje (ver arriba). ¿Lo hace J o lo hago yo en la fusión?
4. El texto «Tu última tarde, sin prisas» y «Tu última hora» ya no salen en la ficha de vuelta con hora (el punto 13 no los lista). ¿Bien?
5. Con la ficha, si no hay hora de vuelta/llegada con fecha dentro del tramo del Leonardo (2026-06-14 a 12-12), nunca hay modo noche: sin dato de invierno, solo la regla normal (ya anotado por B).
