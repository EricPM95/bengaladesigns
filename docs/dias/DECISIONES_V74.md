# DECISIONES V74 — parte «excursiones, restaurantes, HOY y pequeños» (apartados 1, 3, 4, 4b y 5)

(El apartado 2, «El motor», lo apunta el otro agente en su propia sección.) Todas las migraciones están aplicadas (0065-0095): esta parte no necesita ninguna.

## 1. Excursiones desde Roma y Civitatis
- Hecho en `data/civitatis/roma.json › excursiones`: `pompeya_sorrento` → 149, `florencia_tren` → 3742, `tivoli_villas` → 146. `florencia_pisa` (142547) y `ostia_antica` (2283) se quedan como estaban.
- `napoles_pompeya_tren` y `costa_amalfitana`: SIN actividad (quien vaya por su cuenta guardará su billete con «+ Añadir una reserva», V75-V76). `venecia_tren` tampoco tenía.
- Son números del SANDBOX: al pasar a producción hay que repetir la búsqueda (V60-4).
- Radios de las zonas de Lanzarote (4, 4, 3,5, 4, 10 y 9 km): como estaban, sin tocar. «Instalarse»: Roma 60, Lanzarote 20: sin tocar.
- Propuesta: duda abierta, ¿«Florencia: la 3742» era solo la de «en tren» (florencia_tren)? Se ha puesto ahí; «Florencia y Pisa» sigue con su 142547.

## 3. Restaurantes
- **(44) «Revisa el horario».** Un restaurante sin horario que se entienda, o marcado `revisa_horario` en los datos (`true`, o `[días]` con 0 = domingo), YA NO se esconde. En HOY › tarjeta de comida, la caja HORARIO dice «Revisa el horario» (debajo: «No lo tenemos confirmado»); en «Comer cerca de ti», su fila dice «Revisa el horario» y va detrás de los que sabemos que están abiertos. Vale para todos los destinos (`horarioDeComer`, `src/lib/hoyComer.ts`, lee `hours_data.revisa_horario`; el servidor lo manda en `hours_data`).
  - **Cómo se hizo sin tocar `shared/routeEngine/*`** (prohibido en esta tanda): en `data/dias/lanzarote/_restaurantes.json` el campo `dias_sin_confirmar` se ha RENOMBRADO a `revisa_horario` (15 sitios). El motor (`abreEseDia`, `cocheTrip.js`) solo lee `dias_sin_confirmar`, así que ya no esconde a nadie; solo `cierra_dias` quita un restaurante. **Para el coordinador / el otro agente:** `abreEseDia` y su comentario aún mencionan `dias_sin_confirmar`; se pueden simplificar cuando se pueda tocar el motor (queda como código muerto inofensivo). `pruebaTandaLL_LZ.mjs` aún habla de `dias_sin_confirmar`: hay que actualizarla (no se ha pasado).
  - CLAUDE.md: la regla de V58 («con `true` no sale nunca») está sustituida.
  - Liken (lunes) y Brisa Marina (todos los días) salen así. Comprobado con captura iPhone: `V74_capturas/lanza_revisa_horario_app.jpg` (Brisa Marina).
- **(43) Comida del último día en Arrecife.** `_ll.json`: las tres filas con `"zona": "en Arrecife"` (costa_teguise, arrecife y «nose», fila V3) llevaban `lista: null` (sin restaurante) y ahora apuntan a la lista nueva `comidas.V_comida_arrecife` de `_restaurantes.json`. Lista (de los datos que ya teníamos, sin inventar):
  1. Malecón Restaurante & Copas (Av. César Manrique, 6; datos que ya había: miércoles a lunes 10:00-23:00, cierra martes).
  2. Tasca La Raspa (Av. César Manrique, 20; todos los días 13:00-00:00; coordenadas 28.962326, -13.546774, ya en los datos).
  3. Cala (Charco de San Ginés), con `revisa_horario: true` y SIN coordenadas: solo la fuente de un listado (Planomato, https://planomato.com/es/arrecife/n/restaurante-cala: miércoles a lunes 13:00-23:00, cierra martes); no es la web oficial, por eso sale con «Revisa el horario».
  4. Lilium, solo los viernes y sábados (cierra_dias 0-4): comidas de 13:30 a 15:00 según los datos que ya teníamos.
  - Entre semana (lunes a jueves) solo hay 2-3 con certeza (Malecón o Cala, La Raspa). **No he encontrado datos fiables (web oficial o Google) de 3 o 4 restaurantes MÁS de Arrecife con horario y coordenadas**: los listados que salen (Lanzarote Information, Planomato, Restaurant Guru, Tripaligner) no dan dirección y horario a la vez, y no los he añadido para no inventar. **Pendiente de Eric:** decidir si quiere que busque en Google Maps a mano La Puntilla, Papa Miguel, Kenewa, La Miñoca y Divina Italia (los que cita Lanzarote Information, 2022).
  - **No comprobado:** la comida del último día no se pudo ver en la app: el día de vuelta se queda vacío en mi generación de pruebas (`__rutaLanzarote` con `vuelos`), que es de la parte del motor. Solo está comprobado que el JSON es válido y que la lista y el puntero existen.
- **(45) Coordenadas.** Buscadas con Photon (OpenStreetMap, sin clave; es el geocodificador del proyecto, `buscarLugarPhoton.ts`) solo cuando el nombre y la calle coinciden con nuestra dirección; cada una lleva su `coord_fuente` en los datos:
  - Casa Enriqueta (C/ Mar de Barlovento 6, Caleta de Sebo): 29.23119, -13.50336.
  - Primario Gastrobar (Paseo Marítimo, Playa Blanca; en los datos «La Marina 8B»): 28.85688, -13.81261 (el nombre coincide; la calle de OSM es el paseo: revisar).
  - El Charcón (Arrieta, Haría): 29.13277, -13.45870.
  - El Barquillo (C/ Recalmón 20, La Santa): 29.10886, -13.66616.
  - Volcán de la Corona (C/ Malpaís, Yé, Haría): 29.19582, -13.47857.
  - **Sin encontrar (no se inventan):** Liken, Tacande, El Risco, Bogavante, Mar Azul (Casa Luis), La Puerta Verde, Ikarus, La Casa Roja, Casa Carlos, Costa Famara, Sol, Girasol, La Maresía, La Tapita, La Cubierta, SeBE, La Bohemia, Lilium, Naia, Malecón, La Tegala, La Era, Palacio Ico, Casa Cejas, Lago Verde. (Mapbox Search Box es la otra fuente del proyecto, pero necesita la clave de `.env.local`, que los agentes no abren: lo puede pasar Eric con `scripts/destino/lanzaroteRestaurantes.mjs`.) Lago Verde y Palacio Ico dieron un resultado con el mismo nombre pero en otro pueblo: descartados.

## 4. HOY y textos
- **(35)** «Buen viaje de vuelta» se queda. El resumen del viaje (`HoyDespuesV2`) sale 2 h después de «Ya en el aeropuerto» (TarjetaDeVuelta apunta ese minuto UNA vez en el móvil: `trazo:hoy:enaeropuerto:<viaje>:<día>`; si no estuvo, el de [Salgo hacia el aeropuerto] + 30 min del trayecto) y, si no pasó por ahí, 2 h después de la hora del vuelo. Sigue sin salir antes de que el vuelo haya salido. **Riesgo:** si el viajero estuvo en el aeropuerto a las 14:00 y el vuelo es a las 17:00, el resumen sale en cuanto despega (17:00), no a las 16:00. **No comprobado en pantalla.**
- **(36)** El probador: `free_tour_con_hora_ya_empezado` ya salía como frase y «El el día 1» ya estaba arreglado (V73: `contraer` y `sinDoble` en `motorDelProbador.ts`). Solo comprobado por lectura del código.
- **(48)** El aviso de abajo es ahora «Tu entrada del Coliseo, el domingo 18. …», igual que el título de la hoja E1 (`useRouteStore.ts`, `lugarCon('de', placeNames[0])`). Captura: `V74_capturas/roma_aviso_coliseo_app.jpg`. (46 y 47: como están.)

## 4b. Pequeños
- **(27)** `ImagenConFundido` en: añadir parada (`AddStopScreen`, `FilaSitioNuestro`), buscador (`OtraReservaBuscador`, `AttractionsFinder`), comidas (`MealDetailSheet`), cerca (`NearbyPlacesView`, `masVisitas`, `TrazoCards`) y galerías (`GaleriaRecuerdos`, `AlbumDeViaje`, `TusFotosDeHoy`, `HojaPortada`). **«Las fotos de personas»:** no he encontrado ninguna `<img>` de personas (el `Avatar` de Ajustes no usa foto): no aplicado, a confirmar con Eric qué pantalla. Las demás fotos grandes (excursión, ficha) se quedan sin fundido.
- **(29)** Borrada la rama «oculto» de `HojaDelVisto` (`logros/visto/Hojas.tsx`): el efecto del sonido, el fondo oscuro, el «?» dorado, sus botones y `BTN_GAL_OSCURO`. `VistoFlujo` ya nunca le pasaba esa hoja (usa `HojaDelEmblema`). El tipo `'oculto'` de `decidir.ts` se queda (lo usa el flujo).
- **(13)** «Si te sobra tiempo» y «Lugares pendientes» NO se unen: sin cambios. **(6, 8, 11, 14, 15, 16, 18, 19, 20, 23, 24, 28, 31)** como están. **(30)** sin tope de pantallas de logros: ya era así, sin cambios.
- **(21)** El medio «coche» de verdad en el motor: APUNTADO para más adelante (no se hace en esta tanda).
- **«Si te sobra tiempo»** (para que Eric lo vea): es la lista plegable de los sitios que el motor ha dejado fuera de un día porque no caben pero que se pueden hacer «si te sobra tiempo» (`day.spareStops`, cada uno con su motivo, p. ej. «Para otro momento»). Salen de lo que el motor aparta al repartir/recortar el día (o de un cambio del viajero que lo deja fuera); en DÍAS está al final del día con [Añadir] y en HOY abajo del todo con [Recuperar] y [Pasar a otro día]. Capturas con un sitio puesto a mano en esa lista (en estos viajes de prueba el motor no deja ninguno): `V74_capturas/roma_sobra_hoy_app.jpg`, `roma_sobra_dias_app.jpg` (Foro Romano desde el Campidoglio), `lanza_sobra_hoy_app.jpg`, `lanza_sobra_dias_app.jpg` (Mirador de los Helechos).

## 5. Para el fin de semana de pruebas (NO en esta tanda)
- **(37)** App rápida: medir cuánto tarda en abrir cada pantalla en modo iPhone y optimizar lo más lento, sin subir el tope de 340 KB (cargar más pantallas solo al abrirlas).
- **Supabase al doble de lo que debería:** buscar qué consultas bajan más y reducirlas (reglas V36).
- **(38)** Probador: lo que no se comprobó (el último día, Lanzarote, el billete y el alojamiento dentro de sus tarjetas).
- **El barrido de 365** (V68_V71, 9).


---
# DECISIONES V74 — apartado 2, «El motor» (agente del motor)

Sin migraciones. Peso de arranque: no se ha tocado nada que suba el tope (los cambios van en archivos que ya estaban en el arranque y en datos). Barrido de 365: NO se ha pasado (se apunta, ver «Pendiente»).

## Una línea por decisión
- ✅/🟡 **Vuelo tarde (V68).** `src/lib/reorganizarMinimo.ts`: un imprescindible (nivel 1 del catálogo) o el Free Tour sin reserva que no cabe el día de llegada entra en el mejor día siguiente (primero se prueba pegado al final del día; si no cabe, justo después de la comida o al principio del día, corriendo lo de después). Lo que sale para hacerle sitio es lo MENOS importante (de camino → opcional → nivel 3 → nivel 2; nunca imprescindible, reserva ni Free Tour) y va a «Lugares pendientes» de ese día con su motivo; la hoja lo dice («8 sitios de tu sábado · A Lugares pendientes»). Comprobado en el viaje del probador (Roma, 17:30): los Museos Vaticanos, la Basílica y el Free Tour ya NO van a pendientes (captura `V74_capturas/b_1730_despues.jpg`). 🟡 en el viaje de pruebas denso de la app (`__rutaPrueba`, 13/18/17 paradas por día) los Vaticanos siguen en pendientes: ningún día tiene sitio sin sacar más de 10 paradas.
- 🟡 **Algo con reserva (hora fija) sigue yendo a pendientes con su reserva**, no a otro día: la entrada es para esa fecha. Propuesta: si Eric quiere moverla, que la hoja pida confirmar «cambiar la fecha de tu reserva».
- ✅ **(34) Lanzarote sin Reorganizar.** `asegurarElPlanDeVuelta()` (`adaptarVuelos.ts`), llamada desde HOY (`HoyDuranteV2`) cuando es el día de vuelta en coche con el vuelo puesto: pide UNA vez al motor de coche el plan de la vuelta (hora de salir, límite en la T1) y lo guarda en `planVuelta`, sin mover paradas. Solo se repite si cambia el vuelo, la zona del alojamiento o el coche; nunca por tiempo. Con eso salen «Salir 13:45» y «Devuelve el coche… antes de las 15:35» y el aviso «Tu vuelo sale a las … y hoy no te da tiempo a todo» (mismo `datosDeLaSalida`). Capturas `lanza_ultimo_dia_antes.jpg` / `_despues.jpg`. Comentario de cadencia/tamaño puesto (una respuesta de `/api/rebuild-day` del servidor de la app, no de Supabase).
- 🟡 **(42) Visita que acabaría tras el cierre.** Motor de coche (`cocheTrip.js › medirDia`): si le queda MÁS de la mitad de su tiempo, se acorta hasta el cierre (como antes); con la mitad o menos (o si ya llegaría cerrado) sale del día y va a `spare_stops` = «Lugares pendientes» con su motivo. 🟡 «a otro día» automático NO está: el motor de coche monta cada día por separado; hoy va directo a pendientes (propuesta: que `cambioMinimo` use `mejorDia` también para estos). Roma no se ha tocado (su motor ya no deja llegar cerrado).
- ✅ **(41) Minutos de Lanzarote.** El Golfo sin `hasta_atardecer` (45 min); Papagayo 180 (máximo 480); Salinas de Janubio 30; Montaña Bermeja 20. En `lanzarote.json`, `listas.json` y el generador `lanzaroteDatos.mjs`. Las filas de los días de llegada (`_ll.json`, Papagayo 90/120/150) no se tocan (llevan su `min` propio). Aviso: en el día 1 NO hay una parada de atardecer aparte (solo el Faro de Pechiguera y Famara la tienen): ahora el día 1 acaba hacia las 16:50 sin atardecer. Propuesta: añadir una parada «Atardecer en El Golfo».
- 🟡 **(V68_V71-7) Generar con vuelo con la misma regla que Reorganizar.** NO cambiado: el motor sigue haciendo la cadena de la V61 al generar el viaje entero (es el motor de generación y lo lee `pruebaListas`; cambiarlo sin el barrido de 365 no es seguro). Lo que sí: Reorganizar (botón y alerta de vuelos) ya usa una sola regla (cambio mínimo). Propuesta: generar SIN el vuelo y aplicar `propuestaDeVuelos` + `ponerDiasAdaptados` al crear, y pasar el barrido de 365.
- ✅ **(V68_V71-12) Viento/lluvia → Lugares pendientes de verdad.** `hoyLluvia.ts › opParadas` + la operación `paradas` (`hoyCambiarPlan.ts`: `spareSale`/`spareVuelve`): el sitio que sale entra en `spareStops` con su motivo; [Deshacer] lo devuelve; al «volver al plan», lo que había entrado por la lluvia se queda en pendientes. Las reservas, los paseos y los «de camino» no van. Probado en `pruebaV74` (plan de lluvia de Roma).
- ✅/🟡 **(V68_V71-17) «De camino» con `passThrough`.** Roma: Fuente de las Tortugas y Elefantino de Bernini (`roma.json`); Lanzarote: Mirador de los Helechos (el único «saliendo hacia Teguise»; `lanzarote.json` + generador; el motor de coche lo pasa como `pass_through`). En Reorganizar salen los primeros de un día, sin aviso y sin ir a pendientes (`esDeCamino`). 🟡 Piazza in Piscinula no existe en los datos; en Lanzarote solo cumple ese; si Eric quiere más, se dicen.
- ✅ **Cuatro pruebas de RESERVAS en 0**: `pruebaTanda10N11_a` (etiqueta «ZONA», en mayúsculas), `10R_B` y `10S8_D` (papelera de 38 px con el toque en 44; código en «TU ENTRADA · [Ampliar]»; localizador en su caja; zona en «ZONA Centro»; «Datos de la reserva» se abre con el icono del documento), `10S7_T` (cajas ENTRADA/SALIDA/TELÉFONO/LOCALIZADOR, aviso «Hemos leído tu reserva», sin casilla de noches). Aserciones actualizadas a lo vigente, ninguna comprobación borrada.

## Riesgos / posibles fallos (aunque no estén arreglados)
1. Sacar hasta 10 paradas de un día por UNA importante (`MAX_SACADOS`) es mucho; propuesta: bajarlo a 4-5 y dejar el resto en pendientes (con 6 los Vaticanos del probador ya no entran).
2. El Free Tour se coloca a la hora que sale por hueco (p. ej. 16:40): puede no existir un tour a esa hora; hay que confirmarlo.
3. Al tapar huecos las paradas se corren con la distancia en línea recta (+5 min), no con Mapbox: «Reorganizar este día» las afina. Un sitio con entrada con hora no marcada como reserva podría moverse.
4. Imprescindibles pequeños (Panteón, Plaza de San Pedro) pueden seguir en pendientes si el día que los recibiría acaba en una parada protegida.
5. `roma.json` cambia (2 `passThrough`): puede afectar a `pruebaListas`; se recomienda pasar el muestreo y el barrido antes de subir.
6. (34): `salir_de_la_zona` es el del día de vuelta del motor; si el día mostrado no se ha reorganizado, el aviso compara sus paradas con esa hora. Sin red, no se reintenta hasta reabrir HOY.
7. La API se dejó con `DESTINOS_OCULTOS='-'` durante las pruebas; al acabar se vuelve a dejar normal.
8. `pruebaTanda10N11_a` falló UNA vez (A5) justo al reiniciar yo la API; repetida, 0 fallos.
9. (21) El medio «coche» de verdad en el motor: apuntado para más adelante, sin tocar.

## Pruebas pasadas (motor)
| Prueba | Comprobaciones | Fallos |
|---|---|---|
| pruebaV68 (con `V68_LANZAROTE=1`, API en `DESTINOS_OCULTOS='-'`) | 84 | 0 |
| pruebaV74 (nueva: minutos, de camino, cierre, lluvia a pendientes) | 20 | 0 |
| pruebaJutrip (API normal) | 130 | 0 |
| pruebaTanda10N11_a / 10R_B / 10S7_T / 10S8_D (las 4 de RESERVAS) | 36 / 54 / 86 / 83 | 0 / 0 / 0 / 0 |
| pruebaTanda10S7c_Y, 10S9_D, 10S7_R, 10S8_B, 7_conexion | 34, 26, 37, 32, 200 | 0 |
| pruebaTandaHOY2_C, HOY1_C, 10S7b_U, 10R_C | 132, 124, 23, 24 | 24, 6, 5, 1: textos viejos (V43 «Una solución», «¿Adaptamos tu primer y tu último día…?», «Cambiar el archivo»); NO verificado contra un «antes» limpio |

## Seguimiento (peticiones del coordinador)
- `MAX_SACADOS` baja de 10 a 8 (con 6 los Vaticanos del probador ya no entran; con 8 sí: pruebaV68 y pruebaV74 en 0).
- `abreEseDia` (cocheTrip.js) simplificada: solo mira `cierra_dias` (`dias_sin_confirmar` ya no existe; `revisa_horario` no esconde). `pruebaTandaLL_LZ` actualizada (restaurantes con `revisa_horario`, «instalarse» 20 min: hora útil 10:45 fila A, Teguise 11:18). Quedan 2 fallos de la prueba (vuelta desde el norte con vuelo 15:00/17:30: la mañana sale vacía) que NO vienen de mis cambios (da igual con los datos y el motor de antes).
- Bug real encontrado y arreglado: al reorganizar con vuelo de llegada Y de vuelta, el día de vuelta que vuelve a montar el motor repetía sitios de otros días y el guardián rechazaba TODO el cambio (el aviso decía «Hemos adaptado» sin cambiar nada). Ahora el día de vuelta no repite lo que ya está en otro día, y con día de vuelta aparte no se mantiene la propuesta del último día de ciudad (la adaptación es idempotente).
- Trampa de las fechas: Reorganizar no toca días que ya pasaron y los viajes de prueba (Lanzarote 8-13 nov, Roma octubre) ya son pasado: `propuestaDeVuelos` admite `hoy` (solo pruebas); `__rutaLanzarote` lo usa con un «hoy» antiguo.
- Pruebas de HOY/vuelos/reservas actualizadas a lo vigente: HOY2_C (132/0), HOY1_C (124/0), 10S7b_U (40/0), 10R_C (24/0). Peso de arranque 261,1 KB (tope 340).
- `pruebaListas` muestra=1 (12 fechas, 25 887 viajes): 42 fallos de la regla [orden] (D1-FT y D4), IGUALES con y sin mis `passThrough` (comprobado en una fecha) → anteriores a la V74. No se ha lanzado el barrido de 365 (6-7 h).
