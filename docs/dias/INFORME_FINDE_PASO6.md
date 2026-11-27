# Paso 6 del finde: lo que no se comprobó en el probador (V74, punto 38)

Prueba reutilizable: `scripts/destino/pruebaFinde6_probador.mjs` (modo por defecto = probador `/admin/reorganizar`; modo `dias` = DÍAS y RESERVAS). Se pasa por la cola: `APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaFinde6_probador.mjs [dias] [Roma|Lanzarote] [sinCapturas]`.
Capturas: `docs/dias/FINDE_capturas/paso6_*.jpg` (último día de Roma y Lanzarote a 9:00, 15:30 y 17:30; DÍAS día 1 y último; RESERVAS). Textos: `_paso6_textos_probador.json` / `_paso6_textos_dias.json`.

## Tabla: caso → resultado (última pasada: 0 fallos)

| Caso | Antes (sin vuelos) | Después de Reorganizar | Resultado |
|---|---|---|---|
| Roma, vuelta 9:00 | «Aún no sabemos a qué hora sale tu vuelo» + [Añadir tu vuelo] | «Tu vuelo sale de Fiumicino a las 9:00… hoy no te hemos puesto paradas», cómo ir al aeropuerto, billete de vuelta dentro de la tarjeta | OK |
| Roma, vuelta 15:30 | igual | Desayuno + «hasta las 11:45 el día es tuyo» + billete 15:30. **Antes del arreglo salían COMIDA y CENA tras «Fin del día»** | ARREGLADO (ver abajo) |
| Roma, vuelta 17:30 | igual | igual que 15:30 («hasta las 13:45») | ARREGLADO |
| Lanzarote, vuelta 9:00 | pide el vuelo; «De Playa Blanca al aeropuerto, 36 min» | «Tu vuelo sale a las 09:00… día de irse con calma», coche a la T1, billete 09:00 | OK (con avisos, ver riesgos) |
| Lanzarote, vuelta 15:30 | igual | «Sal de casa a las 09:00», 1 parada (Puerto del Carmen), comida, al aeropuerto, «devuelve el coche antes de las 13:00», billete 15:30 | OK con riesgos |
| Lanzarote, vuelta 17:30 | igual | Día sin paradas; Teguise quitado con su nota; «hasta las 15:15 el día es tuyo»; billete 17:30 | OK con riesgos |
| DÍAS Roma y Lanzarote, día 1 | — | Alojamiento (encima del día, V24) y billete de llegada dentro de la tarjeta: hora, vuelo, «Tarjeta de embarque guardada» | OK |
| DÍAS Roma y Lanzarote, último día | — | Billete de vuelta con hora, vuelo y QR guardado; sin QR pasa a «falta» (gris con +) | OK |
| RESERVAS (mismos viajes) | — | Mismo hotel, compañía, número de vuelo, hora y localizador que DÍAS (regla V62) | OK |

Nota sobre (c): por la V24 el **alojamiento NO va dentro de la tarjeta del día**, va encima del primer día de cada estancia (`AccommodationBlock` en `DayList`); el probador solo monta la tarjeta (sin lista), por eso ahí no sale. Se comprobó en la app de verdad (modo `dias`). El billete sí va dentro de la tarjeta y sale en el probador.

## Arreglado
1. **Roma, día de vuelta con vuelo antes de las 21:00 pintaba «Hora de comer» y «Hora de cenar» detrás de «Fin del día»**, y el motor decía «mañana sin comida». Dos causas: (a) `DayDetailPanel.tsx` pinta esos bloques solo con mirar la ventana horaria (el arreglo de la cena de la V6-nov solo valía para destinos de coche): ahora el día de vuelta sin cena en `meals` nunca pinta «Hora de cenar», y con `planVuelta.lleva` = «sin_comida»/«corta» tampoco «Hora de comer»; (b) `adaptarVuelos.ts` (`sinComidasDeLaVuelta`, en los dos caminos que montan el día de vuelta) quita del día de vuelta la cena si el vuelo sale antes de las 21:00 y la comida si el motor dice «sin comida»/«corta».
2. **Terminal «T1» se veía «TT1» en RESERVAS** (`TarjetaBillete.tsx`: ponía otra «T» delante a todo valor de 1-2 caracteres): ahora «T1» se queda «T1» y «1» pasa a «T1».
3. **La línea del motor del probador no decía la hora de la vuelta en Lanzarote** (el motor de coche no devuelve el plan en `propuestaDeVuelos`): ahora dice «Vuelta a las HH:MM: el motor no da su plan en el probador (en la app lo pide HOY al abrir el día de vuelta)». Igual para la llegada.

Tocado: `src/components/route/dayDetail/DayDetailPanel.tsx`, `src/lib/adaptarVuelos.ts`, `src/components/route/reservas/TarjetaBillete.tsx`, `src/components/panel/reorganizar/motorDelProbador.ts`. Sin migración, sin diseño nuevo.
Pasadas en 0: `pruebaFinde6_probador` (Roma 38, Lanzarote 36, dias 13+13), `pruebaV74` (20), `pruebaV68` (64), `pruebaJutrip` (130), `npx tsc -p tsconfig.app.json --noEmit`. Un solo Chrome de prueba a la vez por la cola; todos cerrados al acabar (0 abiertos). Ninguna petición a Supabase.

## NO arreglado (motor, `shared/routeEngine`, que no se podía tocar) y riesgos
1. **Lanzarote 17:30: cabecera «Sal de casa a las 09:10 · En coche 45 min · 43 km» de un día SIN paradas**: es el tramo hacia Teguise, que el motor quitó («Lo quitamos porque con él llegarías tarde a lo siguiente»), pero `coche.ida` se queda con la salida y los km de la parada quitada. Engaña al viajero. Motor de coche (`cocheTrip.js`, al recortar por la vuelta).
2. **Esa misma nota de Lanzarote dice «posiblemente ya esté cerrado» de Teguise**, un pueblo, y los pueblos no cierran (V56). Texto genérico de la nota de «quitamos»; debería no llevar el «cerrado» para pueblos.
3. **Lanzarote 17:30: día vacío con 6 h libres** (hasta las 15:15) y se quita Teguise por «llegarías tarde» aunque cabría; y a 15:30 «Sal de casa a las 09:00» arriba pero abajo «hasta las 13:15 el día es tuyo» y «devuelve el coche antes de las 13:00» (15 min de diferencia entre dos cifras del mismo día) y dos tramos «de Playa Blanca al aeropuerto» con km distintos (29 / 33 km) en la misma tarjeta.
4. **Roma 15:30/17:30: «0 paradas · 2,2 km a pie · 40 min de actividad»** con un desayuno y un aviso «DE CAMINO · pasas por Via del Babuino y Jardines del Pincio» que hablaba «de camino a la comida» (la comida ya no sale): queda un «de camino» huérfano. El motor deja el día con una mañana de desayuno y nada más aunque el vuelo es a las 15:30 (el día se queda corto): comprobar si es lo que Eric quiere.
5. **Roma, la línea del motor repite cosas del día 1 que no son de la vuelta** («se cae Día de Villa Borghese…», «Villa Borghese no cabe en tu viaje») en un viaje de 4 días con llegada a las 14:00: es el motor y es lo que salía ya en la V74; solo se anota.
6. **Terminal en HOY ≠ RESERVAS:** RESERVAS pone «T» delante si guardas «1» (queda «T1»); `TarjetaDeVuelta`/`TarjetaDeLlegada` de HOY pintan el valor tal cual («1»). Mismo dato, dos formatos (regla V62). No lo he unificado para no tocar HOY sin prueba; propuesta: una función `etiquetaDeTerminal` común.
7. **Límites del probador:** no pone alojamiento ni zona en Lanzarote (usa el valor por defecto, «Playa Blanca») ni reservas, así que no ve los avisos de «Reorganizar» que dependen del hotel; para eso, el modo `dias` o la V74. Y el probador no pinta el alojamiento (por V24 va fuera de la tarjeta).
8. **Riesgo del arreglo 1:** el día de vuelta de un viaje en el que el vuelo es a las 21:00 o más sigue pintando cena si el motor la manda en `meals`; sin `meals` de cena (antes salía siempre) ya nunca sale en un día de vuelta. Si Eric quiere cena el día de la vuelta con vuelo muy tarde, hay que pedirlo al motor.
9. La primera pasada de capturas a 1280 px sólo mostraba la parte de arriba (el probador es largo): la prueba ahora hace `scrollIntoView` al «ÚLTIMO DÍA» antes de capturar.
