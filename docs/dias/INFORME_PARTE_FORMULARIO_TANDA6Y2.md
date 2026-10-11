# Tanda 6y2, parte del formulario: «Ponle nombre», fechas de la ruta a mano, sugerencias y pantalla de elegir

Sin push. Dos commits locales. Solo Roma. No he tocado Reorganizar, reservas, Free Tour, avisos, la lista de «Añadir parada» ni las fotos.

## (a) «Ponle nombre»
- Un día a mano sin nombre ya no repite la fecha: el cuadrito se queda («MIÉ 14») y el título dice «Ponle nombre», en gris y en cursiva.
- Es un botón: al tocarlo se abre `DayNameSheet` (el mismo del menú «Cambiar el nombre», con el nombre vacío). No abre además la tarjeta.
- Sin fechas pasa igual (el cuadrito lleva el número del día).
- Un día que el viajero ya renombró enseña su nombre. El primer y el último día siguen como «Madrid → Roma» y «Roma → Madrid». Las rutas nuestras no cambian.
- Cambio en `DayList.tsx`.

## (b) Cambiar las fechas de la ruta a mano a otra duración
Todo está en `src/lib/manualDuration.ts` (funciones puras) y lo usa `setRouteDateRange` del almacén.
- **Más días:** se añaden días vacíos justo antes del último (el de la vuelta). El de la vuelta sigue siendo el último y conserva sus paradas. Con un solo día, los nuevos van detrás. Máximo 14.
- **Menos días:** se quitan primero los vacíos del medio, empezando por el último antes de la vuelta. Si no bastan, se pregunta por los del medio que tienen paradas. El primer día y el de la vuelta solo se tocan si no queda otro (primero si están vacíos). Decidí no quitar el primero ni el último antes que un día del medio con paradas, porque son los de llegada y salida.
- **Pregunta:** «El sáb 13 tiene 3 paradas. ¿Qué hago con ellas?» con [Pasarlas a otro día] [Quitarlas] [Cancelar]. Con una sola parada dice «una parada… ¿Qué hago con ella?». Si hay varios días por preguntar, se pregunta uno a uno y no cambia nada hasta contestar el último. Cancelar no cambia nada.
- **«Pasarlas a otro día»:** decido yo con sentido, no se elige: van al FINAL del día más cercano ANTERIOR que se queda (si era el primero, al más cercano posterior), en su orden. Así no se rompe el orden del viajero. La pregunta lo dice antes («Si las paso, irán al final del jue 11, con lo que ya tengas allí.»). Una comida elegida pasa también, salvo que ese día ya tenga la suya (entonces se pierde: caso raro, ver preguntas).
- **Una excursión** no se pasa: solo [Quitarla] / [Cancelar].
- **Nunca se borra nada sin preguntar:** aunque alguien llame a `setRouteDateRange` sin decisión, un día con paradas, con comida elegida o con excursión se queda (el viaje queda con un día de más).
- Los nombres siguen a las fechas: los que puso la app («jue 11 mar», «Día 2») pasan a los nuevos; los que puso el viajero se quedan. Si se quitan las fechas, los días no cambian y vuelven a «Día n».
- Ventana nueva `ManualDaysDialog` en `DatesChangeDialog.tsx`.

## (c) Sugerencias de experiencias y de lugares solo con «¡Sí, hazla por mí!»
- Ya no se lanzan al elegir el destino ni al confirmar las fechas. `suggestExperiencesInBackground` se lanza en `choosePlan`, solo con «hazla por mí» (y, como ya hay fechas, encadena la precarga de lugares como antes).
- **La clasificación (`classifyInBackground`) NO la he movido:** el paso de Transporte (que va ANTES de elegir) la necesita para saber el arquetipo, en los dos caminos. Moverla rompería el transporte. Se queda al elegir el destino. Con «Quiero hacerla yo» no se lanza nada más de experiencias ni de lugares.
- **Tiempos medidos** (servidor local, Roma): clasificar 2-18 ms, sugerir experiencias 2 ms, pool de lugares 2-4 ms. En Roma no hay llamada a Claude en ninguna (destino curado: experiencias nuestras y pool del JSON). Tampoco se nota en la ruta nuestra: el paso de experiencias de Roma no lee la sugerencia, y la precarga de lugares no hace nada si el destino es curado. Veredicto: no hace más lenta nuestra ruta, así que se queda movido.
- **No pude medir un destino sin curar** (Lisboa): la clave de Anthropic devuelve «saldo de crédito demasiado bajo» (502). Para esos destinos la sugerencia sí es una llamada a Claude (~segundos); ahora empieza al tocar «hazla por mí» en vez de 3 pantallas antes, pero lo único que la usa es la precarga de lugares, que ya tenía respaldo (`suggestPlacesOnDemand`) al llegar a «Elige lugares». Fuera de Roma queda sin medir.
- El viaje panorámico (`startPanoramic`) también dejó de lanzar la sugerencia antes de elegir. `LandingScreen.tsx` (pantalla antigua, ya no se monta) la sigue lanzando; no la he tocado, y la prueba avisa si alguien la vuelve a montar.

## (d) El dibujo de la pantalla de elegir
Causas que he visto (sin navegador, por el código):
1. El dibujo estaba en un encuadre de 343×236 con «slice»: si la caja es más baja (clamp de 150 px a 27 % de alto), el encuadre se recorta por arriba y por abajo y se cortan pines y líneas.
2. Con el ratón encima de «Quiero hacerla yo» (y en el móvil el «encima» se queda pegado tras tocar) el dibujo bajaba al 25 % de opacidad.
3. Las animaciones usaban `both` con un «hasta» explícito.

Arreglos: encuadre ajustado al dibujo con sus pines (`28 24 290 204`) y «meet» (se ve entero en cualquier altura); el mapa de fondo (calles, agua, parques) se extiende más allá para llenar la caja; las animaciones solo llevan el «desde» (`trazo.css`) y `backwards`, así el estado final es el de la propia figura; con el ratón encima se atenúa solo al 60 %, al tocar «Quiero hacerla yo» sigue apagándose al 25 % (es el aviso) y en pantalla táctil el «encima» ya no cuenta. La prueba comprueba que los 12 pines y las 3 líneas caben en el encuadre.

## (e) La barra de pasos
Falló: en la pantalla de elegir (donde aún no se sabe el camino) salía «5/7». Ahora, hasta la pantalla de elegir (incluida) se cuentan solo los 5 pasos de los dos caminos («5/5»); «Experiencias» y «Lugares» se suman al elegir «hazla por mí» (6/7, 7/7, LISTO en el resumen). Con «Quiero hacerla yo» nunca aparecen: 5 pasos y LISTO en el resumen corto. Barra, contador y panel lateral salen de la misma lista (`visibleStepNamesFor`, `stepCounterLabel` en `planChoice.ts`).

## Pruebas
- Nueva: `scripts/destino/pruebaFase6y2_formulario.mjs` (+ `_6y2_formulario_entrada.tsx`): 136 comprobaciones, 0 fallos. Cubre los cinco puntos (con el servidor local; `API_URL` si no es el 8787).
- Ajustadas por mi cambio (solo esto): `pruebaFase6y_formulario.mjs` y `pruebaFase6y_manual.mjs` esperaban el título con la fecha («mar 14 oct») en los días de en medio; ahora esperan «Ponle nombre» (y que la fecha no se repita).
- Sin tocar y a 0 fallos: `pruebaFase6y_formulario` (459), `pruebaFase6y_manual` (1706), `pruebaTanda6z6` (las cuatro partes), `pruebaCorr6z6` (las tres), `pruebaFase6z6f` (22), `pruebaTanda6s` (2511), `pruebaTanda6u` (1884 viajes). `npx tsc --noEmit -p tsconfig.app.json` limpio.

## Lo que no pude hacer ni verificar
- **No hay navegador:** nada visto en pantalla. Falta la comprobación a 375 px de: «Ponle nombre» (gris/cursiva, que se toque bien), la ventana de la pregunta de los días con sus tres botones, el contador «5/5» y el dibujo entero de la pantalla de elegir.
- Los toques (tocar «Ponle nombre», los botones de la pregunta, tocar una tarjeta de elegir) no se ejecutan con un DOM real; la prueba comprueba la lógica y el código.
- Destinos sin curar: tiempos de la sugerencia sin medir (sin crédito en la API).

## Preguntas abiertas
1. Antes de elegir camino, la barra cuenta 5 pasos y al elegir «hazla por mí» crece a 7. ¿Prefieres esto o ver siempre 7 hasta elegir «a mano»?
2. «Pasarlas a otro día» elige el día anterior más cercano y lo avisa; no deja elegir. ¿Quieres un selector de día?
3. Si el día que recibe las paradas ya tiene su comida/cena elegida, la del día quitado se pierde al pasarlas. ¿Lo dejo o la añado igualmente?
4. Si el viajero acorta tanto que el primer o el último día hay que quitarlos y tienen paradas, se pregunta igual (con el mismo texto). ¿Bien?
