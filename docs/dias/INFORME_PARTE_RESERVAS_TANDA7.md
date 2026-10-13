# Tanda 7 · Parte RESERVAS (agente E): casillas nuevas, dirección, billete y tarjeta de la gratis

Todo en mi copia (worktree), commits locales, sin push. Typecheck `npx tsc --noEmit -p tsconfig.app.json`: 0 errores.

## Qué cambió, punto por punto

### 1a. El punto de Roma es obligatorio con hora
- La hoja de la hora (`HojaHoraLlegada`, en `LlegadaYVuelta.tsx`) ahora lleva los botones del punto (Fiumicino · Ciampino, Termini · Tiburtina…). Si el medio tiene varios y no hay uno elegido, [Guardar] dice «Elige primero el punto» y no se puede pulsar. Con un solo punto (el puerto de Civitavecchia) ya viene elegido. La hora y el punto se guardan juntos.
- Viajes de antes (hora y sin punto): se usa el punto del traslado más largo de ese medio. Sale de los datos del destino (`al_centro_min` más alto de `_llegada.json`, primero de la lista si empatan), no de nombres escritos en el código: avión Fiumicino, tren Tiburtina, autobús Autostazione Tiburtina (`tibus`), barco Civitavecchia. Funciones: `puntoPorDefecto(medio)` y `puntoDeLaMitad(medio, elegidoId, hayHora)` en `src/lib/arrivalReturn.ts`. `legOf` (`reservasLegs.ts`) las usa y trae `pointPorDefecto`, `otroPunto`, `otraHora`. La barra y el billete de DÍAS también (`DayDetailPanel`).
- El punto «estación de autobuses de Tiburtina» ya existía en los datos (`tibus`). No añadí nada a `_llegada.json` (es del agente de datos B).

### 1b. Casillas nuevas, opcionales, en las dos mitades
- En la ida: «Sale de» (punto, texto libre) y «Sale» (hora). En la vuelta: «Llega a» y «Llega». Salen en una sección aparte debajo de «¿Llegas o te vas otro día?», con el título «De dónde sales · opcional» / «A dónde llegas · opcional». El punto va a ancho completo (el ejemplo «Barcelona-El Prat (BCN)» no cabe en media fila). El texto de ejemplo de la casilla es la ciudad de origen del viaje.
- Para el motor no cambian nada. Se quitan con «Eliminar vuelo» de esa mitad (y Deshacer las devuelve).
- Campos nuevos del viaje (dentro de `route`, que es la columna JSON `route` de `trips`: sin migración, nada que ejecutar): `arrivalOtroPunto`, `arrivalOtraHora`, `departureOtroPunto`, `departureOtraHora`, `accommodationAddress`, `departureFechaVista`. Acciones nuevas en `useRouteStore`: `setLegOtroPunto`, `setLegOtraHora`, `setAccommodationAddress`, `marcarVueltaVista`.
- Al rehacer la ruta (cambiar fechas) el motor devolvía una ruta sin nada de lo que el viajero puso en RESERVAS. `setRoute` ahora vuelve a poner esos campos de la ruta de antes cuando es un rehacer (`camposDelViajero`, lista única en `src/lib/datosDelViajero.ts`). Era un hueco que ya existía (horas, puntos, precio, código, zona…), no solo de lo nuevo. Si otro agente añade un campo del viajero, lo apunta ahí.

### 1c. La zona
- Debajo de «¿En qué zona te alojas?», en pequeño, el texto del documento. «Aún no lo sé» ya era una respuesta de la lista y no se vuelve a pedir.
- «Con hora, se pide»: con la hora de Roma puesta y la zona sin elegir, la mitad abierta enseña una línea «¿En qué zona te alojas? Elige tu zona («Aún no lo sé» también vale).» que abre la rueda de zonas. No abre ninguna hoja sola.

### 1d. La dirección del alojamiento
- Casilla «Dirección de tu alojamiento (opcional)» en RESERVAS › Alojamiento, solo de pago, se guarda al salir del campo en `route.accommodationAddress`.
- **La pieza compartida del enlace** (para la ficha de llegada y HOY):
  - Componente: `BotonComoLlegarAlojamiento` en `src/components/route/alojamiento/BotonComoLlegarAlojamiento.tsx`.
  - Props: `direccion: string | null | undefined` (obligatoria; sin dirección el botón NO SALE NUNCA, ni con el nombre del hotel ni con la zona), `variante?: 'completo' | 'pequeno'` (por defecto `completo`: botón ancho; `pequeno`: línea corta), `className?`, `style?`.
  - Solo sale de pago (`pagoActivo()` dentro del componente). Abre Google Maps en pestaña nueva, desde donde esté el viajero y en transporte público. Texto: «Cómo llegar a tu alojamiento».
  - Quien lo pone: `<BotonComoLlegarAlojamiento direccion={route.accommodationAddress} />`.
  - Funciones sueltas en `src/lib/direccionAlojamiento.ts`: `enlaceComoLlegarAlojamiento(direccion)` (el enlace, o null) y `direccionDelAlojamiento(route)` (la dirección limpia, o null). Una sola pieza construye el enlace.
- En RESERVAS también sale el botón debajo de la casilla (con dirección), para que el viajero compruebe que lleva a su puerta.

### 1e. «¿Llegas o te vas otro día? Cambia las fechas del viaje»
- Ya estaba en las dos mitades, debajo de las casillas, y abre el calendario de siempre (`useDatesCalendarStore.request()`). Lo dejé; la prueba lo comprueba.

### 1f. Coche y medios mezclados
- En coche no se pide hora (ya era así). Con medios mezclados, cada mitad habla de su medio (la prueba lo comprueba con avión de ida y tren de vuelta).

### 1g. Quitar el vuelo y Deshacer
- Ya usaba `quitarConDeshacer`. `removeFlightLeg` ahora borra también las casillas nuevas de esa mitad y Deshacer devuelve todo (la prueba lo comprueba con hora, punto, código, compañía, casillas y precio).

### 1h. Aviso de la campana al cambiar las fechas
- `useAppNotices` (de pago): con hora de vuelta y fechas, si la última fecha del calendario ya no es la que el viajero tenía vista, sale «Has cambiado los días del viaje: revisa que tu vuelta sigue siendo {el jueves 22}.» con [Ver mi vuelta] (abre RESERVAS › Llegada y vuelta, mitad de la vuelta). El día sale de `nombreDeDia.ts` (`elDia`).
- Cómo funciona: `route.departureFechaVista` guarda la fecha de vuelta que el viajero ya vio. Se sella al poner o cambiar la hora de la vuelta, al abrir la vuelta en RESERVAS, al abrir la ficha de vuelta en DÍAS, y al abrir un viaje guardado de antes (`sellarVueltaAlAbrir`, en `hydrateTrip`). `vueltaCambiada(route)` compara con la fecha actual. Así sirve para cualquier cosa que cambie la última fecha (calendario, rehacer, [Añadir en un día nuevo] si alarga el viaje). La app no toca la vuelta.
- No sale en la gratis, sin fechas, sin vuelta puesta, ni si la vuelta está a la vista cuando cambian las fechas.

### Enganche `onCambioDeVuelo` (para el rehacer y la hoja del resumen)
- Archivo: `src/lib/cambioDeVuelo.ts`. Tipo: `EnCambioDeVuelo = (cambio: { que: 'hora' | 'punto' | 'zona' | 'quitar'; mitad: 'arrival' | 'departure' | null }) => void`.
- `LlegadaYVuelta` y `AlojamientoReservas` lo llaman al poner/cambiar una hora de Roma (`hora`), cambiar el punto de Roma (`punto`, solo si hay hora), elegir la zona (`zona`, `mitad: null`) y quitar un vuelo que tenía hora (`quitar`). NO avisan: código, compañía, precio, las casillas nuevas ni la dirección.
- `ReservasPanel` recibe el prop opcional `onCambioDeVuelo`. Si no se le pasa, usa `rehacerPorCambioDeVuelo(cambio)`: el rehacer de siempre en segundo plano (`regenerateRouteForDates` con las fechas actuales; barrita «Actualizando tu ruta…», «gana el último») solo si es de pago, ruta nuestra de un destino curado, no a mano y sin cambios a mano. Ese rehacer existe y sigue funcionando (la prueba lo comprueba, y que `RehacerRuta` sigue montado en `App`).
- Lo que **no** hice: la hoja del resumen y la decisión de qué se rehace de verdad. Hoy el motor no lee las horas, así que rehacer deja los días igual.

### 2. El billete
- `BilleteDeVuelo` (`src/components/route/dayDetail/BilleteDeVuelo.tsx`) y `billeteDe` (`src/lib/billete.ts`). Del diseño `Dia 1 Reservas.dc.html` solo la tarjeta del vuelo; sin la línea «Tu día en Roma empieza a las…» (era una hora calculada).
- «LLEGADA · VUELO IB3214» (con el código que puso el viajero; sin código, «LLEGADA · VUELO»), [Reservado] en verde, hora y código de cada lado y la línea con el medio. Tren «TREN», autobús «AUTOBÚS», barco «BARCO». Sin casillas opcionales, solo el lado de Roma; con ellas, BCN → FCO en la llegada y FCO → BCN en la vuelta. Código del lado de Roma: el IATA si lo hay (FCO) o la barra del punto (TERMINI). Del otro lado: lo que va entre paréntesis («BCN») o el texto en mayúsculas.
- En `DayDetailPanel`: con hora de Roma, de pago y no en coche, el billete ocupa el sitio de la barra (llegada: día 1; vuelta: último día). Sin hora sigue la barra con «+ VUELO». Al tocarlo abre `ArrivalReturnSheet` (la misma llamada de siempre; otro agente rehace su contenido). Solo enseña las horas que puso el viajero.

### 3. La tarjeta del día de vuelta (solo gratis)
- `TarjetaTuUltimoDia` (`src/components/route/dayDetail/TarjetaTuUltimoDia.tsx`) con los textos del documento. Grande si el día está en blanco; pequeña («¿Te vas por la tarde?…») si el viajero ya añadió lugares. [Añadir mi vuelta] lleva el candado y llama a `pedirPago()`; [Prefiero montarlo yo] hace `openAddFlow(day.id)`, igual que [+ Añadir lugares]. No sale de pago, ni en coche, ni en días que no son el de vuelta. Con la tarjeta grande no sale además el botón «Añadir lugares» (haría lo mismo).

### 4. Gratis
- Sin «Llegada y vuelta» ni zona ni dirección en RESERVAS («x de 2», como antes); sin billete; sin aviso de fechas. Lo de pago de esta tanda no lleva candados: no sale. La única excepción es la tarjeta de arriba.

### Fuera lo viejo (lo que toca a mi parte)
- `ReservasPanel` y `LlegadaYVuelta` ya no usan `FlightAdjustSheet`, `setFlightAdjust` ni `onGuardada`. Quité también las tarjetas de «oportunidad de vuelo» de RESERVAS (llevaban horas calculadas).
- **No toqué** (por si otro agente los quita): el archivo `FlightAdjustSheet.tsx` (ya sin uso), `src/lib/flightOpportunity.ts`, el campo `flightAdjust`/`setFlightAdjust` del almacén, «Ajustar este día a tu llegada / vuelta» de `DayDetailPanel` y `fitDayToTrip`.

## Pruebas
- Nueva: `scripts/destino/pruebaTanda7_reservas.mjs` (+ `_tanda7_reservas_entrada.tsx`): **159 comprobaciones, 0 fallos**. Cubre punto obligatorio y por defecto, casillas guardadas y que sobreviven a rehacer, texto de la zona, dirección y botón, aviso (sale, se va, viajes viejos, gratis, sin fechas), Deshacer, billete (con y sin casillas, tres medios, llegada y vuelta, DÍAS, gratis, coche), tarjeta (grande, pequeña, coche, de pago), gratis sin «Llegada y vuelta», enganche y rehacer, textos (sin taxi, sin empresas, sin emojis, sin horas calculadas). Arrancar con `API_URL=http://localhost:PUERTO`. Al empaquetar RESERVAS y DÍAS queda un puerto abierto que impide que el proceso acabe (pasa también con `_6t_entrada.tsx`), así que acaba con `process.exit` 400 ms después de poner `process.exitCode`.
- Pasadas en serie con 0 fallos: 6y2 (4), 6y3 (3), 6y4 (8), 6y5_pantallas, 6y6_cierre, 6y7 (historias, pantallas, titulos), 6y8_comida, 6y9 (5), 6y10 (audios, comida, excursion, ficha, horarios), Corr6z6 (las 4), Tanda6s, 6t, 6v, 6x_franjas, 6z, 6z2, 6z3, 6z3_dias, 6z5, 6z6, 6z6a-d, Fotos6z3.
- **No corridas**: `pruebaFase6y5_motor`, `pruebaFase6y7_motor`, `pruebaFase6y10_viajes` y `pruebaFase6y10_sitiosgrandes` (esta pide `ref=<carpeta del código de antes>`). Ninguna lee nada de `src/` ni de lo que toqué (no toqué el motor ni `shared/`).
- Pruebas viejas que dejaron de valer y ajusté lo mínimo (todas por la misma razón: ahora una hora sin punto usa el punto por defecto, o la hoja que desaparece):
  - `pruebaCorr6z6_reservas`, `pruebaTanda6z6a`: el viaje de ejemplo traía horas sin punto para que «Llegada y vuelta» saliera «Falta»; ahora las horas se ponen junto con los puntos (en `todoListo`/`listo`).
  - `pruebaTanda6v`: ya no existe `FlightAdjustSheet`; ahora comprueba que no está y que «Llegada y vuelta» sigue protegida por el interruptor.
  - `pruebaFase6y6_cierre`: busca en el código la hoja que guarda la hora; adaptada al nuevo `onSave(time, pointId)`.
  - `pruebaFase6y5_pantallas`: las casillas del tramo abierto ahora son seis (las dos opcionales al final) y [Guardar] sin punto dice «Elige primero el punto».

## Lo que se vio a 375 px (Playwright con el Chrome del equipo, Supabase bloqueado) y lo que no
Capturas en `docs/dias/img/`:
- `7-reservas-llegada.jpg`: ida con punto, hora, referencia, casillas opcionales (punto «Barcelona-El Prat (BCN)» y hora), «¿Llegas o te vas otro día?» y la línea de la zona.
- `7-reservas-vuelta.jpg`: la vuelta con «A dónde llegas · opcional».
- `7-reservas-alojamiento.jpg`: texto de la zona, «Dirección de tu alojamiento (opcional)» y el botón.
- `7-dias-billete-llegada.jpg` (BCN → FCO, con código de vuelo) y `7-dias-billete-vuelta.jpg` (solo el lado de Roma).
- `7-campana-aviso-fechas.jpg`: el aviso «Revisa tu vuelta» tras cambiar las fechas, con [Ver mi vuelta]. Comprobado a mano: el botón abre RESERVAS en la vuelta y el aviso desaparece de la campana. (El «Cambios sin guardar» de la captura es porque bloqueo Supabase.)
- `7-gratis-ultimo-dia-grande.jpg` y `7-gratis-ultimo-dia-pequena.jpg`.
- También vi: la hoja de la hora pidiendo el punto («Elige primero el punto», botón gris) y que tocar el billete abre la ficha de llegada de siempre.
- **No visto en pantalla** (solo por la prueba): billete en tren, autobús y barco; gratis en RESERVAS (sin «Llegada y vuelta»); Deshacer al quitar el vuelo; el botón con Deshacer visible; la casilla de la zona al abrirse. Y la tarjeta de la gratis la vi con un día de vuelta puesto a mano en el almacén del navegador (ver pregunta 1).

## Invariantes propuestas (sin número; las numera quien las junte)
- Una mitad con hora de Roma siempre tiene punto: el que eligió el viajero o, en un viaje de antes, el del traslado más largo de su medio (dato del destino).
- Las casillas del otro lado (punto y hora) son opcionales, no cambian el motor y se guardan con el viaje; el billete enseña lo que haya.
- Sin dirección del alojamiento no sale [Cómo llegar a tu alojamiento] (ni con hotel ni con zona); un solo componente (`BotonComoLlegarAlojamiento`) lo dibuja y una sola función (`enlaceComoLlegarAlojamiento`) construye el enlace.
- Lo que el viajero escribe en RESERVAS sobrevive a rehacer la ruta (`camposDelViajero`).
- Al cambiar la última fecha del calendario con la vuelta puesta, sale en la campana el aviso de revisar la vuelta; se va al abrirla o cambiarla; la app nunca cambia la vuelta.
- El billete solo enseña horas que puso el viajero, y en coche no hay billete.
- La tarjeta «Tu último día también cuenta» solo sale en la gratis, en el día de vuelta en blanco, y no en coche; en la de pago no sale; el candado llama a `pedirPago()`.
- Cada cambio de hora de Roma, de punto de Roma o de zona pasa por `onCambioDeVuelo`, y solo esos.

## Decidido por Code
1. El billete **sustituye** a la barra cuando hay hora de Roma (de pago, no coche); sin hora, la barra con «+ VUELO» como antes (así lo enseña el diseño 1c). La barra no cambió (`barTextOf` intacto).
2. El punto se elige en la hoja de la hora (botones y [Guardar] esperando), no en la mitad abierta después. Los botones del punto de la mitad abierta siguen para cambiarlo.
3. El punto por defecto de los viajes de antes sale de los datos (mayor `al_centro_min`), no de nombres en el código; vale para cualquier destino.
4. «Con hora, se pide la zona»: una línea en la mitad abierta, no una hoja que se abre sola (no choca con la hoja del resumen del otro agente).
5. El aviso de fechas se apoya en la fecha de vuelta (`departureFechaVista`) y no en cada pantalla que cambia fechas; los viajes guardados de antes se sellan al abrirlos.
6. Si cambian las fechas con la vuelta a la vista, no hace falta avisar (la ve con su día nuevo).
7. El rehacer por defecto solo se pone en marcha en rutas curadas, de pago, no a mano y sin cambios a mano (los días cambiados a mano no se tocan).
8. Quité las tarjetas de «oportunidad de vuelo» de RESERVAS (tenían horas calculadas) además de la hoja «¿Ajustamos tu ruta?».
9. Con la tarjeta grande de la gratis no sale el botón «Añadir lugares» (haría lo mismo que [Prefiero montarlo yo]).
10. El enlace de Google Maps va en transporte público y desde la ubicación del viajero. El texto de ejemplo de «Sale de» es la ciudad de origen, no «Barcelona».
11. La rueda de la otra hora arranca en 09:00 (ida) y 20:30 (vuelta): solo es dónde empieza la rueda, no se enseña como dato de la app.

## Preguntas abiertas (5)
1. **La tarjeta de la gratis solo sale en un día con `isReturnLeg`.** Hoy un viaje curado de Roma no trae ese día aparte: el último día de ruta hace de «vuelta» y lleva paradas, así que la tarjeta no se vería. Saldrá cuando el reparto por noches (puntos 1 y 2, otro agente) cree el día de vuelta en blanco. ¿Es lo que quieres, o debe salir también en el último día de ruta actual?
2. **Quitar el vuelo + Deshacer + rehacer en segundo plano.** Al quitar un vuelo con hora se avisa a `onCambioDeVuelo` y empieza un rehacer; si el viajero pulsa Deshacer antes de que acabe, el rehacer puede acabar después sobre el viaje devuelto (las horas se conservan, los días vendrían del rehacer). Hay que decidir quién cancela el rehacer al deshacer (agente del rehacer).
3. **[Añadir en un día nuevo]** hoy no cambia las fechas (sale «Tienes más días que fechas»). El aviso de la vuelta saltará solo si el día nuevo mueve la fecha de vuelta (respuesta a la P5 de la 6y10). ¿Confirmas que ese es el momento?
4. **«Aún no lo sé» en el contador «x de 3».** Para el motor cuenta como zona hecha; en el contador de RESERVAS sigue contando «Falta» (como hasta ahora). ¿También debe contar hecho?
5. El punto del autobús se llama en los datos «Autostazione Tiburtina (Tibus)» (nombre de servicio). El billete usa la barra («TIBURTINA»), pero el nombre completo sale en otras pantallas: para el agente de datos B.
