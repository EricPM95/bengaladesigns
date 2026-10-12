# Informe de la parte del Free Tour y la cena, Tanda 6y9 (agente B, motor)

## Qué cambió y dónde
1. **La cena a las 22:00** (antes 21:00). `cena_antes_si_sale_despues_de: '22:00'` en `shared/routeEngine/listasTrip.js` (paso 5.7b). Si al salir de la reserva son más de las 22:00, la cena va antes; si sale a las 22:00 o antes, va después. Regla 4 de `docs/dias/DIAS_ROMA_PARADAS.md` cambiada.
2. **El turno real de la Galería entra siempre en la regla de la comida** (P5). Se quitó la condición «solo si el viajero tiene otra reserva ese día» (`turnosCuentan`). La regla 17 sigue igual: con DOS reservas del viajero el mismo día no se mueve nada.
3. **Free Tour de las 19:00.** Es «de la noche», igual que el de las 21:00: sin D3, los días de «Sin Free Tour», el tour en la noche del D1 en lugar de Trevi y la Plaza de España. La cena sale sola de la regla (19:00 + 2 h 30 = 21:30, después, y el restaurante queda a menos de 350 m de Navona; 21:00, antes). Escrito en `DIAS_ROMA_PARADAS.md` junto al de las 21:00. `listasConvertir.mjs`: 0 dudas y los datos (`data/dias/roma/listas.json`) no cambian: la variante `free_tour_noche` ya vale para cualquier hora de la noche.
4. **Cortes del Free Tour en un solo sitio.** Antes el corte «noche» eran las 20:30 en el servidor y las 19:00 en otros dos sitios. Ahora lo decide una función de la lista.
5. **P7 de la 6y7 (pedido por el coordinador): el último cambio de fechas gana.** Contador `rehacerGeneracion` en `src/store/useRouteStore.ts`; `regenerateRouteForDates` ya no ignora el segundo cambio; `RehacerRuta.tsx` se monta con `key={generacion}`, así el primer rehacer se desmonta y `useRouteGeneration` descarta su resultado (`cancelled`). El primer pedido al servidor no se corta de verdad: termina y se tira (sin pisar nada).

## La lista de horas del Free Tour y dónde vive
`shared/routeEngine/freeTourHoras.js` (nuevo): `FREE_TOUR_HORAS` = 10:00 «Por la mañana», 12:00 «A mediodía», 15:00 «Después de comer», 17:00 «Por la tarde», 19:00 «Al caer la tarde», 21:00 «De noche», cada una con su franja (`manana`, `tarde`, `noche`). También `franjaDelFreeTour(hora)` y `esFreeTourDeNoche(hora)`. La usan `server/routeAlgorithm.js` y `listasTrip.js`.

**Para el agente C:** las pantallas todavía tienen su propia lista y deben leer de ahí (`import { FREE_TOUR_HORAS } from '../../../../shared/routeEngine/freeTourHoras.js'`, como ya se hace con `comida.js`): `FREE_TOUR_HOURS` en `src/components/route/reservas/AddReservationSheet.tsx` (línea 66) y `FRANJAS` en `src/components/route/reservas/FreeTourSheet.tsx` (línea 14). No las he tocado. Los nombres de franja («Después de comer», «Por la tarde») están en la lista nueva; los textos de pantalla los pone C. El nombre de la de las 19:00 («Al caer la tarde») lo he elegido yo.

## La frase exacta para la guía (`GUIA_NUEVOS_DESTINOS.md`, línea 34)
Cambiar `` `cena_antes_si_sale_despues_de` (21:00) `` por `` `cena_antes_si_sale_despues_de` (22:00) ``. Si la guía describe la cena en prosa, la frase nueva es: «La cena, igual con las 22:00: si al salir de la reserva ya son más de las 22:00, la cena va antes; si sale a las 22:00 o antes, va después.» Y añadir: «Un Free Tour de las 19:00 lleva la cena después, cerca de donde acaba el tour; uno de las 21:00, antes. El destino escribe en `freeTourHoras.js` las horas del tour y su franja (mañana, tarde o noche): de las 19:00 en adelante es de la noche.»

## Pruebas (todas con mi servidor en el puerto 8852)
- Nueva `pruebaFase6y9_freetour.mjs`: parte 1 (motor), 1.589 comprobaciones, 0 fallos (15 tipos de día × viajes de 3, 5 y 7 días × tour a las 19:00, 19:30, 19:35, 20:00, 21:00 y 21:30; Galería en 8 turnos, con y sin otra reserva). Parte 2 (último cambio de fechas), 6 comprobaciones, 0 fallos. Comprobado que la parte de la Galería falla si se vuelve a la regla vieja.
- `pruebaFase6y8_comida` (constante de la cena 21:00 → 22:00 y el Free Tour de noche con 19:00): 15 tipos de día, 0 fallos (~110.000 comprobaciones).
- `pruebaTanda6u` 0 fallos (1.884 viajes); `pruebaFase6y7_motor` 0; `6y6_cierre` 0; `6y4_listas`, 6g, 6h, 6i, 6j, 6k, 6l, 6o, 6r, 6z, 6z2: exit 0 / 0 fallos; `6y5_motor` p1, p2+p4 (paso 37) y tope: 0 fallos; `6s`, `6t`, `6v`: 0 fallos; `pruebaFase6y7_pantallas` (ajustada: ahora exige que gane el último cambio): 0 fallos. `tsc -p tsconfig.app.json` limpio.
- Muestra de ~60 fechas con `pruebaListas`: 48 de las 60 fechas terminadas, **todas 0 fallos** (festivos, domingos, lunes, miércoles, Pascua, agosto y Ferragosto, 1 y 6 de enero entre ellas). Las 12 últimas (22-nov y diciembre, incluidos Navidad y Nochevieja) las paré sin terminar por orden del coordinador: sin cifra.
- No se lanzaron las 365 fechas.

## Decidido por Code
- El nombre de la franja de las 19:00 es «Al caer la tarde» (el prompt no lo daba).
- El corte entre «tarde» y «noche» del Free Tour son las 19:00 (ya lo era en el motor; ahora también en el servidor, que usaba las 20:30).
- La cena sigue procurándose antes de las 22:30 (`cena_hasta`), sin quitar nada.
- `INVARIANTES_PANTALLA.md`: añadidas la 622 a la 625.
- Para ahorrar peso, los datos de Roma no se han tocado: `listas.json` queda igual.

## No hecho / dudas de alcance
- **«P3 y P4 del miércoles»**, que citó el coordinador: no estaban en mi encargo ni en el prompt de la 6y9; no los he hecho. Si son otra cosa, dímelo.
- Las listas de horas de las pantallas (C) siguen sin leer la lista nueva.

## Preguntas abiertas
1. Con el corte a las 22:00, una reserva que sale entre las 21:00 y las 22:00 deja la cena después y a veces pasa de las 22:30 (en las pruebas de la 6y8 salen unos cientos de casos por tipo de día, antes eran menos). Se queda así porque la regla 17 dice que no se quita nada. ¿Está bien, o prefieres que en esos casos la cena se acorte?
2. Con el Free Tour de las 19:00, la tarde del D1 se aprieta y alguna parada (en mi prueba, la Iglesia del Gesù) pasa a «Si te sobra tiempo» porque después del tour ya está cerrada. ¿Lo aceptas?

## Segunda entrega: el miércoles del Vaticano (P3 y P4 de la 6y7)
- **P3.** Con los Museos de 15:00 a 15:59 un miércoles, el Castillo de Sant'Angelo va POR DENTRO (~1 h 30) en el hueco entre la comida y los Museos, y por la mañana ya no va por fuera (el Puente sigue por la mañana). Variante `miercoles_museos_tarde_15` en `scripts/destino/listasVariantes.mjs`; documento: D2, cierres del miércoles.
- **P4.** La misma regla del D2 en el D0 (1 día) y en el D0-medio (última mañana): un miércoles la Plaza de San Pedro y la Basílica van DESPUÉS de comer. D0: la mañana va al revés (Panteón, Navona, Puente, Castillo por fuera, Conciliazione), comida en el Borgo, y luego la Plaza y la Basílica y la tarde de siempre. D0-medio: la Plaza y la Basílica van detrás de la comida. Con los Museos marcados o reservados hasta las 11:30: los Museos, la comida y, después, la Plaza y la Basílica. Antes, en el D0-medio, el miércoles pisaba lo de los Museos; ya no.
- **Motor.** Una media mañana no tiene tarde, así que una variante no podía poner nada después de comer. `shared/routeEngine/listasDia.js`: la variante puede pedir `tarde: { abre: true, … }` para abrirla. Solo la usan las dos variantes del D0-medio.
- `listasConvertir.mjs`: 0 dudas. INVARIANTES 626 y 627.
- Pruebas: `pruebaFase6y9_freetour` parte 3 (nueva): 141 comprobaciones, 0 fallos (5 miércoles; Museos a 15:00 y 15:30 en 5 y 7 días; D0 y D0-medio, con y sin Museos; un martes el D0 sigue empezando en la Plaza). `pruebaFase6y7_motor` ajustada (con los Museos a las 15:00 el Castillo va por dentro después de comer): 17.724 comprobaciones, 0 fallos. `pruebaFase6y8_comida`: 116.000 comprobaciones, 0 fallos. `pruebaFase6y6_cierre` 0, `pruebaTanda6u` y `pruebaFase6y4_listas` exit 0.

### Decidido por Code
- El Castillo dentro dura 90 min (con 60 quedaba un hueco mayor). Aun así queda un rato libre entre la Conciliazione y los Museos (~1 h 20 a las 15:00, ~1 h 50 a las 15:30), porque la comida corta de antes se pone a las 10:30 (regla de la 6y8). Está dicho en el documento como «~1 h 30».
- En el D0 con el Coliseo reservado hasta las 14:15 no se toca nada: ya acaba en San Pedro, después de comer.
- Con los Museos reservados DESPUÉS de las 11:30 un miércoles en el D0 / D0-medio, no hay variante nueva (queda como estaba).

### Pregunta abierta
- ¿Quieres que la comida de esos miércoles (Museos a las 15:00) sea a mediodía en vez de a las 10:30? Habría que cambiar la regla de la comida corta de la 6y8 o llenar la mañana con más paradas.
- Muestra de 40 fechas con `pruebaListas` (n=1; festivos, domingos, lunes y miércoles, Navidad, Año Nuevo, Reyes, Semana Santa y agosto): 40 de 40 con 0 fallos. No se lanzaron las 365.
