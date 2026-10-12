# Tanda 6y9, parte E: títulos de los días y hora de la reserva

## 1. Títulos de los días (P11, P13, P14)

Una sola función, como antes: `src/lib/tituloDelDia.ts`. Cambios:

- **P11, las nocturnas no cuentan.** `paradasParaElTitulo` deja fuera las experiencias nocturnas (`isNightExperience`) y los miradores que llegan de noche (`isNightView`). Un día que solo tiene una nocturna se queda sin paradas y se llama «Día libre».
- **P14, el segundo grupo necesita 3 paradas.** Se quitó lo de «al menos 2, o el día entero tiene solo 2». Ahora el segundo nombre entra solo con 3 paradas o más. El Free Tour (o la excursión de medio día) sigue yendo primero, y como mucho hay dos nombres. Lo ha comprobado la prueba, en 228 viajes del motor y en los casos sueltos.
- **P13, la vuelta sintética sin paradas.** El día `isReturnLeg` sin paradas se llama «Día de viaje» (constante `DIA_DE_VIAJE`). Su trayecto pequeño («Roma → Madrid») sigue donde estaba. Para no leer «Día de viaje» dos veces, la etiqueta pequeña de DÍAS y de HOY (`etiquetaDeViaje`) queda vacía cuando el título ya es «Día de viaje», y solo se ve el trayecto. Un día normal que no es de vuelta sintética y no tiene paradas sigue siendo «Día libre».
- Documentación: la cabecera de `tituloDelDia.ts` (puntos 3, 4 y 6) y la regla 614 de `docs/INVARIANTES_PANTALLA.md`.
- Prueba: `scripts/destino/pruebaFase6y7_titulos.mjs` ajustada. Los casos de empate pasaron a 3 y 3, el de «dos paradas de dos grupos» ahora da un solo nombre, y se añadieron casos nuevos para nocturnas, miradores de noche, vuelta sintética en DÍAS y «Día libre» normal. Resultado: 3652 comprobaciones, 0 fallos.

## 2. La hora de la reserva (P17)

**La hora YA se veía.** Los dos fallos eran de las pruebas, no de la app. Las pruebas reservaban «la primera parada con nombre del día 1», que hoy es la Fontana de Trevi, y la Fontana no tiene entradas en los datos. La pestañita verde (`EntradaEdgeTab`) solo sale en sitios con entradas. La app no tenía ningún error.

- Las dos pruebas ahora reservan el primer sitio del viaje que SÍ tiene entradas, en el día que le toca (con fechas, por fecha; sin fechas, por número de día).
- La comprobación pasó a «la hora sale UNA sola vez»:
  - DÍAS, con el día de la reserva abierto, exactamente 1 vez.
  - DÍAS, con la lista cerrada, 0 veces (sigue igual).
  - RESERVAS (el bloque «Entradas y Free Tour» abierto), exactamente 1 vez. Esto es nuevo en `pruebaTanda6z3_dias`; para eso se exportó `EntradasYFreeTour` en `_6z3_entrada.tsx`.
- La ficha («✓ Tu entrada») y HOY («Tu entrada a… · 11:00 ✓») ya las cubrían `pruebaFase6y4_ficha` y `pruebaTanda6z3` (HOY); siguen en 0 fallos.

**La plantilla rota** (`src/lib/reservaFueraDeDia.ts`, antes línea 43): sin fechas escribía `el día ${dayNumber}` a mano. Ahora llama a `elDia(route, dayNumber)` de `nombreDeDia.ts`: «el mié 15» con fechas, «el día 2» sin ellas. Es la misma salida de antes, pero ya sin plantilla a mano, y la regla 6 de la 6z3 vuelve a dar 0. No se pudo ver otro caso del texto «el día ${…}» en `src/`.

## 3. Renombrado de las dos pruebas

`git mv` a `pruebaTanda6x_franjas.mjs` y `pruebaTanda6z3_dias.mjs`. Se actualizó todo lo que las nombraba (grep en `docs/` y `scripts/`: INVARIANTES, informes y progresos de 6x, 6y7 y 6z3, preguntas de la 6y7, `_6y7_correr_otras.sh`, las cabeceras y los `_entrada.tsx`). Ahora entran en `ls scripts/destino | grep -E "^prueba(Fase6|Corr6|Tanda6|Fotos6)"`. Las dos dan 0 fallos.

Regla nueva 622 en INVARIANTES: la hora de la reserva se ve una sola vez, y los avisos nombran el día con `nombreDeDia.ts`.

## 4. Cifras (en serie, servidor propio en el 8855, sin las 365 fechas)

0 fallos en: `pruebaFase6y7_titulos` (3652), `pruebaTanda6x_franjas` (42420), `pruebaTanda6z3_dias` (48293), `pruebaTanda6z3` (29223), `pruebaFase6y_manual`, `6y2_*`, `6y3_*`, `6y4_*`, `6y5_pantallas`, `6y7_pantallas`, `6y7_historias`, `6y7_motor`, `pruebaCorr6z6*`, `pruebaTanda6z6a-d`, `6z5`, `6s`, `6u` y `6v`. Typecheck `npx tsc --noEmit -p tsconfig.app.json` limpio.

Una salvedad: `pruebaFase6y2_reorganizar` da «782 comprobaciones, 0 fallos» pero Node en Windows se cae al cerrar (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`, código de salida -1073740791). No es de este cambio; las comprobaciones pasan.

## 5. Decidido por Code

- Las nocturnas que no cuentan son `isNightExperience` y `isNightView` (los dos tipos de noche de la app).
- Con título «Día de viaje», la etiqueta pequeña no repite las palabras y solo enseña el trayecto. Si Eric prefiere ver «Día de viaje · Roma → Madrid» aunque se repita, es cambiar `etiquetaDeViaje`.
- No se tocó `AddReservationSheet.tsx` ni nada de los otros agentes.

## 6. Preguntas abiertas

1. Con P11 y P14 juntas, un día con una sola parada «de día» y varias nocturnas se llama con el grupo de esa parada; un día solo con nocturnas se llama «Día libre». ¿Es lo que quieres, o prefieres que un día con solo nocturnas lleve el nombre de la zona de la nocturna?
2. Ver punto 5: ¿«Día de viaje» solo, o «Día de viaje» y debajo «· Roma → Madrid» repitiendo las palabras?
