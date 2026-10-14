# Tanda 7 · Parte UNIFICADO (las pantallas, una sola forma)

Tres trabajos hechos en paralelo (la ficha, HOY y la conexión) definían lo mismo con formas distintas. Esta parte deja **una sola forma de cada dato**, **un solo mapeo** desde el JSON del motor y **una sola tarjeta «Hoy vuelves a casa»**. El motor no se ha tocado.

## 1. Qué quedó como única forma de cada dato

| Dato | Única forma | Dónde vive |
|---|---|---|
| Lo que el motor dice del día que lleva la llegada (`day.arrival_day`) | `ArrivalDayInfo` (tal cual el JSON: `lista`, `nombre`, `variante`, `sin_paradas`, `comida_al_llegar`, `de_noche`, `es_dia_1`, `texto`) | `src/lib/types.ts`, en `DayPlan.arrivalDay` |
| El plan de la llegada (`day.arrival_plan`, solo el día 1) | `PlanLlegada` | `Route.planLlegada` (`src/lib/planLlegadaVuelta.ts`) |
| El plan de la vuelta, con la tarjeta (`day.return_day`) | `PlanVuelta`, con `tarjeta` y `tarjetaUltimoDia` de tipo `TarjetaHoyVuelvesDato` | `Route.planVuelta` |
| La tarjeta «Hoy vuelves a casa» | `TarjetaHoyVuelvesDato` (con `desde_tu_zona`, `ver_como_ir`, `explorar`, `despedida`, `madrugada`) | `src/lib/types.ts` |
| Qué tarjeta toca a cada día | `tarjetaHoyVuelvesDelDia(route, day)` | `src/lib/planLlegadaVuelta.ts` (la usan DÍAS y HOY) |
| ¿Es el día de llegada? | `esDiaDeLlegada(route, day)`: `arrivalDay.es_dia_1` o, con la hora de llegada puesta, el primer día | `src/lib/tituloDelDia.ts` (la usan la ficha, HOY, «más visitas» y el título) |
| La comida al llegar sin restaurante nuestro | `MealSlot.noRestaurant` (`meals[].no_restaurant`) | ya estaba una sola vez |
| El día de vuelta | `DayPlan.isReturnLeg` (`is_return_leg`) | ya estaba una sola vez |

**Lo que se quitó** (formas de J que repetían lo anterior): `ArrivalPlanInfo`, `DayPlan.arrivalPlan`, `ReturnDayInfo`, `DayPlan.returnDay`, `TarjetaVuelvesInfo` (en camelCase, con menos campos), `GeneratedReturnDay`, `GeneratedTarjetaVuelves`, `mapTarjetaVuelves`, el `esDiaDeLlegada` de `masVisitas.ts` (el «primer día que no es de vuelta»), y los campos `esDia1`/`sinParadas`/`deNoche` en camelCase. **Los planes ya no van dentro del día**: viven en la ruta, una sola vez.

**Un solo mapeo** (`src/lib/mapGeneratedRoute.ts`):
- `arrival_day` → `DayPlan.arrivalDay`, tal cual (una línea en `mapDay`).
- `is_return_leg` → `DayPlan.isReturnLeg`.
- `meals[].no_restaurant` → `MealSlot.noRestaurant` (en `mapMeal`).
- `arrival_plan` y `return_day` → `planesDelMotor(days)`, una función exportada que se usa al generar la ruta y al rehacer días (`rebuildDay.ts`). Es el único sitio que lee esos dos campos.

## 2. Componentes borrados o unificados

- **Borrado:** `src/components/route/hoy/SlotVuelvesACasa.tsx` (la ranura provisional de J).
- **Unificado:** HOY pinta ahora `TarjetaHoyVuelves.tsx` (la de H, la misma que DÍAS), con el cableado pedido: [Ver cómo ir] abre la ficha de vuelta; [Explorar monumentos] abre EXPLORAR con `useExploreAperturaStore.pedir({ categoria: 'atracciones', origen: null, cerca })` y `setMode('explore')` (`cerca` es el `cerca_de_mi` que manda el motor). Tanto el día de vuelta sin paradas como, con salida de madrugada, el final del último día de ruta.
- **La línea pequeña de HOY** es ahora la de DÍAS: «{origen} → Roma · Día de viaje» (el trayecto primero); si el título ya dice «Día de viaje», solo el trayecto.
- **«Más visitas»** (`masVisitas.ts`) decide con los planes de la ruta: `diaRecortado(route, day)` y `masVisitasDe(route, day, datos)` leen `Route.planLlegada.caso` y `Route.planVuelta.contenido`.
- **La ficha** (`ArrivalReturnSheet.tsx`) usa `esDiaDeLlegada` en lugar de su propia búsqueda; la hoja del resumen ya leía de `planLlegada`/`planVuelta`.
- **Arreglo visto a 375 px:** la ficha de llegada y vuelta abierta desde HOY quedaba por debajo de la cabecera y de la barra de abajo, sin la cruz a la vista. Ahora `useFichasDeHoy` la pinta en el `body` (en el servidor de las pruebas, que no tiene `document`, en su sitio), como una pantalla completa.

## 3. Pruebas

Todo en serie (las de pantallas) con el servidor propio en el puerto 8897; las de solo motor, en paralelo. El servidor y el `.env.local` copiado se han quitado al terminar.

**Nueva:** `scripts/destino/pruebaTanda7_unificado.mjs` (465 comprobaciones, 0 fallos): una sola definición de cada tipo y función, nada de las formas viejas en `src`, un solo mapeo, los planes en la ruta y no en el día, la tarjeta de DÍAS y la de HOY con el mismo HTML (día de vuelta y madrugada), el cableado de los botones, la línea pequeña, «más visitas» y la hoja del resumen sin planes → vacías. `FIXTURES=<carpeta>` escribe los viajes de prueba en JSON para verlos a 375 px.

**Typecheck:** `npx tsc --noEmit -p tsconfig.app.json` sin errores (venía con errores de «Duplicate identifier» y tipos incompatibles).

**Pantallas, todas en 0 fallos** (con el mismo resultado que antes de unificar): `pruebaTanda7_ficha` (1295), `_hoy` (128), `_conexion` (194), `_reservas` (159), `_mover` (147); `pruebaFase6y2_formulario/fotos/reservas`, `6y3_*`, `6y4_ficha/formulario/iconos/perfil/presupuesto/reservas`, `6y5_pantallas`, `6y7_historias/pantallas/titulos`, `6y9_audios/fichas/freetour/horarios/pantallas`, `6y_formulario`, `6y_manual`, `6y10_audios/ficha`, `pruebaCorr6z6*`, `pruebaTanda6s/6t/6v/6x_franjas/6z/6z2/6z3/6z3_dias/6z5/6z6/6z6a-d`, `pruebaFase6z6c-f`, `pruebaFotos6z3`.

**Las que fallaban en `main` y no empeoran (no se tocan):** `pruebaFase6y2_reorganizar` (3 fallos, los mismos: Museos reservados a las 9:00 en la tarde por el día escrito `D1-vaticano`) y `pruebaFase6y_reorganizar` (4 fallos, los mismos).

**Motor (en 0 fallos, sin tocar el motor):** `pruebaTanda7_llegada` (59.334), `_vuelta` (53.901), `_integracion`, `_documento`, `_datosllegada`, `_respuestas` (261); `pruebaFase6y4_listas` (643), `6y6_cierre` (3.219), `6y7_motor` (17.724), `6y8_comida`, `6y10_comida` (2.593), `6y10_excursion`, `6y10_horarios` (110.990), `6y10_sitiosgrandes`, `6y10_viajes` (118).

(`pruebaFase6y5_motor` no estaba en la lista y se lanzó de más: tras 40 minutos sin acabar se paró. El motor no tiene ningún cambio en esta parte.)

**Ajustes mínimos a pruebas que dejaban de valer:**
- `pruebaTanda7_hoy.mjs` y su entrada: los viajes de prueba ponen `planLlegada`/`planVuelta` en la ruta con `planesDelMotor` (antes los ponían dentro del día); `masVisitasDe`/`diaRecortado` reciben la ruta; la tarjeta de HOY se busca por `data-tarjeta-hoy-vuelves` (ya no por la ranura); `esDiaDeLlegada` se importa de `tituloDelDia`; se añaden comprobaciones de la tarjeta compartida, de los botones y de la línea pequeña (128 en total).
- `pruebaTanda7_ficha.mjs`: los dos viajes de la tarjeta usan `ruta.planVuelta`, y la comprobación del mapeo mira `planVuelta` y `.return_day`.
- `pruebaFase6z6e.mjs` (`2j`): este fallo ya estaba en `main` y no es de la unificación: `useAppNotices.ts` ya usa `pagoActivo` por los avisos de vuelo de la Tanda 7 (de pago) y la prueba prohibía esa palabra en todo el fichero. Ahora descuenta esos dos bloques; el aviso de la lluvia sigue sin depender de la versión de pago.

## 4. Qué se vio a 375 px y qué no

Playwright con el Chrome del equipo, front en el puerto 5196 (con un `vite.config.uni.ts` temporal que apunta al API 8897), Supabase bloqueado. El viaje **no se creó por el formulario**: los tres viajes de prueba salen del motor de verdad (`buildDayBlockV3` con llegada y vuelta) pasando por el mismo mapeo de la app (`mapSingleGeneratedDay` y `planesDelMotor`), con la llegada y la vuelta puestas (hora, punto, código, zona y dirección), y se meten en el almacén de la app, como hicieron J e I. Motivo: ver la pregunta 1 (hoy el servidor no devuelve un día de vuelta aparte).

Capturas (`docs/dias/img/7-unificado-*.jpg`):
- `2-dias-dia-llegada`: DÍAS, día de llegada con «Barcelona → Roma · Día de viaje» y el billete de llegada.
- `3-ficha-llegada`: la ficha de llegada abierta desde el billete.
- `3b-dias-hoy-vuelves-a-casa`: DÍAS, día de vuelta sin paradas con «Hoy vuelves a casa».
- `4-hoy-llegada`: HOY en el día de llegada.
- `5-hoy-vuelves-a-casa`: HOY en el día de vuelta, con la misma tarjeta y «Día de viaje» con «Roma → Barcelona».
- `6-hoy-ficha-vuelta`: [Ver cómo ir] de HOY abre la ficha de vuelta, a pantalla completa y con su cruz.
- `7-hoy-explorar-monumentos`: [Explorar monumentos] de HOY abre EXPLORAR › Atracciones en «Cerca de ti».
- `8-hoja-del-resumen`: la hoja «Hemos ajustado tu ruta» con los textos del motor.

Sin errores de página en toda la pasada. **No se vio:** el viaje creado de punta a punta por el formulario con la vuelta real (depende de la pregunta 1) ni el flujo de añadir los vuelos en RESERVAS pulsando (la hoja del resumen se abrió con el almacén de la hoja, con el mismo texto que construye la app).

## 5. Decidido por Code

- Los planes (`arrival_plan`, `return_day`) viven **solo en la ruta**, no en el día: así hay una sola copia y el rehacer de un día los actualiza con `ponerPlanes`. El precio: quien necesite saber algo del día de vuelta lo lee de `route.planVuelta`.
- `arrival_day` se guarda **tal cual el JSON** (snake_case, con campos abiertos), como lo leía la ficha; no se traduce a camelCase.
- `esDiaDeLlegada` es la de H (la que marca el motor o el primer día con la hora de llegada puesta). Cambia un caso respecto a J: un viaje sin hora de llegada y sin `arrival_day` ya no se trata como día de llegada en HOY (en HOY la tarjeta de llegada necesita la hora para el billete, así que no cambia lo que se ve).
- La tarjeta de HOY va sin envoltorio (se descartó dejar un envoltorio mínimo de la ranura).
- La ficha abierta desde HOY se pinta en el `body` (arreglo de lo visto a 375 px).
- `pruebaFase6z6e` 2j se ajustó aunque su fallo no viene de la unificación (ver arriba).

## 6. Preguntas abiertas

1. **`/api/generate-skeleton` pide `answers.days` días en vez de `answers.days − 1`** (server/index.js): un viaje real no trae el día de vuelta aparte y la vuelta con horas queda dormida (ver `INFORME_PARTE_CONEXION_TANDA7.md`, pregunta 1). No se ha tocado. ¿Se cambia esa línea?
2. Cuando eso se cambie, ¿conviene repetir esta comprobación a 375 px con el viaje creado por el formulario (con las reservas de llegada y vuelta puestas pulsando)? Aquí se hizo con viajes del motor metidos en el almacén.
3. `lineaDeViaje` (en `tituloDelDia.ts`) solo la usan las pruebas; DÍAS y HOY pintan la línea con dos trozos (trayecto y marca) por el estilo. ¿La dejamos o la quitamos?
