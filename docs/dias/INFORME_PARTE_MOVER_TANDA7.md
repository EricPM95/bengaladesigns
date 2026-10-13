# Tanda 7 · Parte «Mover a otro día», «Cambiar parada» y «5 días · 4 noches»

Hecho por el agente D, en su propia copia (rama `worktree-agent-a9b4aa13aa5e17af0`), con commits locales y sin push. Todo en palabras sencillas.

Qué toca esta parte: los puntos 1 (cómo se enseñan los días), 15 (solo la última viñeta, «Cerrado este día») y 16 («Mover a otro día» y «Cambiar parada») de `PARA_CODE_TANDA7_v3.md`. No he tocado nada de las otras partes (documento y listas, datos de llegada, respuestas, RESERVAS/billete/ficha de llegada, motor de llegadas).

## 1. Qué cambió, punto por punto

### «Mover a otro día» (menú «···» de cada parada y hoja de HOY)

- Una sola lista, `src/components/route/dayDetail/ListaDeDias.tsx`, la usan los dos sitios (el menú de DÍAS y la hoja «Pasarla a otro día» de HOY). Sigue el diseño `docs/diseno/mover_parada/Mover Parada.dc.html` (solo la caja «Mover a»; el resto de la pantalla, como estaba).
- Arriba: icono de calendario, «MOVER A» y «Ahora: viernes 16» (sin fechas, «Ahora: día 2»).
- Cada día: su fecha en el cuadrado («VIE» y «16»; sin fechas, el número del día), su nombre («Viernes 16», con `nombreDeDia.ts`) y su título (el mismo de DÍAS, con `tituloDelDia.ts`).
- Un día de excursión entera sale en gris, con su icono (la montaña, ya en la familia de iconos), «Día de excursión» y sin poder elegirse. El día de vuelta no sale.
- Al tocar un día, la parada pasa a ese día, como hasta ahora (`moveStopToDay`: va al final del día nuevo, sin quitar nada), y siempre con [Deshacer].
  - Hasta ahora solo los días libres llevaban [Deshacer]; ahora lo llevan todos, en DÍAS y en HOY.
  - La acción es una sola, `moverParadaAOtroDia` en `src/lib/cambiarParada.ts` (usa `cambiarConDeshacer`); el menú y HOY la comparten.
- Ninguna hora a la vista en la lista (lo comprueba la prueba).
- El menú oscuro se ensancha para esta vista y la lista tiene su desplazamiento si hay muchos días.

### «Cambiar parada» (menú «···»)

- Ya no abre `PlaceFinderPanel`: abre EXPLORAR (el explorador compartido, `PlaceExplorerScreen`) con «Atracciones» y «Miradores» puestos y arriba la pregunta «¿Por cuál quieres cambiar {parada}?». Lo hace el componente nuevo `src/components/route/dayDetail/CambiarParada.tsx`.
- En este modo, el botón de la esquina de arriba a la derecha de cada tarjeta es el icono ⇄ (`intercambiar`, nuevo en `src/lib/iconos.ts`: fino, gris-frambuesa, sin relleno, como los demás). Los sitios que ya están en el viaje salen con «Ya en tu viaje» y sin el icono. El viajero puede cambiar los filtros.
- Al tocar el ⇄: el sitio nuevo ocupa el hueco de la parada, en su día y a su hora, con [Deshacer], y se vuelve a DÍAS.
  - Se reutiliza la acción de siempre, `replaceStop`, sin duplicarla, a través de `cambiarParadaPorOtra` (`src/lib/cambiarParada.ts`, con `cambiarConDeshacer`).
  - `replaceStop` mezcla datos (`{ ...vieja, ...nueva }`). Antes, el sitio nuevo heredaba cosas de la parada vieja (su «Por fuera», su aviso, sus etiquetas, su consejo). Ahora `paradaQueSustituye` borra de forma expresa todo lo que traía la vieja y el sitio nuevo no dice. Se queda su hora y su franja.
  - También se arreglan los paseos: al cambiar el sitio, el paseo desde la parada de antes y hasta la de después se vuelven a pedir (`replaceStop` los marca como pendientes cuando cambian las coordenadas).
  - Un solo cambio por apertura: si se toca el ⇄ dos veces mientras llega la foto, la segunda no hace nada (así [Deshacer] no devuelve un viaje ya cambiado).
- Fuera de este modo, EXPLORAR sale como siempre, con su «+» (lo comprueba la prueba).
- `PlaceFinderPanel` ya no lo usa nadie → **borrado**, junto con `src/lib/poolEntries.ts` (solo existía por él). No tenían prueba ni entrada propias. Quedaba también un `src/components/route/StopMenu.tsx` viejo que ninguna pantalla importaba (con su propia lista de días y un «cambiar por nombre»): **borrado** también, para que no quede una segunda lista de «Mover a». `AddStopScreen` (el buscador de siempre de «Añadir parada») sigue donde estaba.
- Un destino sin catálogo propio (sin explorador de lugares) no se queda sin «Cambiar parada»: usa el buscador de «Añadir parada» (`AddStopScreen`) con el mismo resultado (el sitio ocupa el hueco, con [Deshacer]).

### «5 días · 4 noches»

- Una sola función compartida, `src/lib/duracionViaje.ts`: `textoDeDuracion(dias)` da «{n+1} días · {n} noches» (con 1 día, «1 día»; con 2, «2 días · 1 noche»). También `textoDeDias`, `textoDeNoches` y `diasDelViaje(route)` (los días del viaje entero, el de vuelta incluido).
- En el calendario del formulario, debajo de las fechas, en lugar de «5 días»: «5 días · 4 noches». Con una sola fecha, «1 día». (El calendario de toda la app, `DatesCalendarModal`, usa el mismo componente y lo trae igual.)
- Sin fechas, la hoja «Aún no sé mis fechas» pregunta «¿Cuántas noches?» (con «noche»/«noches»). Por dentro se guarda igual: `days` = noches + 1. Un solo día sigue pudiéndose, con el botón «Solo un día». La rejilla va de 1 a 20 noches (21 días, como el calendario).
- Los viajes guardados no cambian: solo cambia cómo se enseñan.

**Lista de sitios donde la app escribe los días del viaje** (hecha con grep; todos usan la función compartida):

1. `src/components/trazo/TrazoCalendar.tsx` — el calendario del formulario y el de toda la app (debajo de las fechas).
2. `src/components/trazo/StepDates.tsx` — la hoja «Aún no sé mis fechas» («¿Cuántas noches?»).
3. `src/components/trazo/StepSummary.tsx` — la fila «Duración» del resumen y el texto «N días · M planes a tu medida».
4. `src/components/trazo/StepManualSummary.tsx` — la fila «Duración» del resumen de «Quiero hacerla yo».
5. `src/components/trazo/StepElegir.tsx` — la línea de arriba de «¿Cómo quieres montar tu itinerario?» («Roma · 5 días · 4 noches»).
6. `src/components/trazo/TrazoFlow.tsx` — la barra del formulario sin fechas («5 días · 4 noches · Octubre»).
7. `src/components/route/RouteOverview.tsx` — la tarjeta del viaje en RUTA. Ahora son dos líneas («5 días · 4 noches» y debajo las fechas), porque en una línea no cabía junto a la bombilla y el deshacer a 375 px. El último tramo cuenta también el día de vuelta, y su fecha.
8. `src/components/route/ReservasPanel.tsx` (`rangoDelViaje`) — la cabecera de RESERVAS y la de la pantalla del presupuesto cuando el viaje no tiene fechas.
9. `src/components/myTrips/TripCard.tsx` — la tarjeta del viaje de «Mis viajes» sin fechas.
10. `src/lib/viajesPerfil.ts` + `src/components/perfil/FilaDeViaje.tsx` — «Mis viajes» del Perfil (nuevo campo `duracion`; el rótulo y el resumen del viaje lo llevan).
11. `src/components/route/hoy/HoyDespues.tsx` — HOY después del viaje («Tu viaje a Roma · 5 días · 4 noches · 15 – 19 oct»).
12. `src/lib/exportPdf.ts` — el PDF («5 días · 4 noches · desde Madrid»).
13. `src/hooks/useAppNotices.ts` — el aviso de la campana «Tienes más días que fechas».

**Lo que NO es la duración de un viaje y se queda como estaba:** la cifra «días» del mapa del Perfil (`CifrasDelMapa`, suma de días viajados), la cuenta atrás de RESERVAS («faltan 12 días»), «Se suele hacer en 3-5 días» (`RouteSearch`), «el 25% de tus {n} días» (`ExcursionDayPage`), «Máximo 14 días» (`DayNameSheet`) y el selector antiguo `DurationSelector` (ninguna pantalla lo usa).
**La cabecera de RUTA** («Roma · 15 – 19 oct», `MapDestinationHeader`) hoy no escribe ningún número de días, solo las fechas; no he añadido nada (el documento dice «donde la app escribe hoy»). Si Eric quiere «5 días · 4 noches» también ahí, es una línea.

La prueba busca por código que no quede ningún «{n} días» suelto fuera de estos sitios y de la lista de excepciones de arriba.

### «Cerrado este día» (punto 15, última viñeta)

- La tarjeta de una parada cerrada ese día (DÍAS y HOY) dice «Cerrado este día», una sola vez, y ya no «Hoy cierra» ni «Cerrado hoy».
- Una sola constante, `CERRADO_ESTE_DIA` (`src/lib/placeHoursOnDate.ts`), usada por: la línea de horario de la tarjeta (`horarioDeParada.ts`, que sirve a DÍAS y a HOY), el motivo corto de «Por fuera» (`outsideKind: 'cerrado'`, en `StopAccordion.tsx`), el aviso de los días libres (`freeDayStopWarning`), el aviso al cambiar las fechas (`useRouteStore.ts`) y la etiqueta de las tarjetas de EXPLORAR cuando el sitio cierra el día que se mira.
- Sigue en el mismo color que antes (rojo en DÍAS y HOY, gris en EXPLORAR): he cambiado las palabras, no el color (ver «Decidido por Code»).
- Lo que cierra a una hora o aún no abre («A esta hora ya ha cerrado», «Cerrado a esa hora») no cambia.

## 2. Qué se vio a 375 px y qué no

Con Playwright y el Chrome del equipo, a 375 × 812, de pago, con Supabase bloqueado. Viaje de Roma del 15 al 19 de octubre (5 días · 4 noches) y otro sin fechas. Capturas en `docs/dias/img/7-*.jpg`:

| Qué | Captura |
|---|---|
| «Mover a» con el día de excursión en gris y el título de cada día (menú de DÍAS) | `7-mover-a.jpg` |
| Parada movida con [Deshacer] | `7-movida-con-deshacer.jpg` |
| La misma lista en la hoja de HOY («Pasarla a otro día»), y movida con [Deshacer] | `7-hoy-pasarla-a-otro-dia.jpg`, `7-hoy-pasada-con-deshacer.jpg` |
| «Cambiar parada»: EXPLORAR con la pregunta, los dos filtros, «Ya en tu viaje» | `7-cambiar-parada-explorar.jpg` |
| … con el ⇄ en las tarjetas (y «Ya en tu viaje» sin icono) | `7-cambiar-parada-con-intercambiar.jpg` |
| … una búsqueda: Galería Borghese, que cierra el lunes («Cerrado este día», gris, y «Ya en tu viaje») | `7-cambiar-parada-galeria-cerrada.jpg` |
| Después de cambiar, con [Deshacer] (vuelve a DÍAS) | `7-cambiada-con-deshacer.jpg` |
| «Cerrado este día» en una tarjeta de DÍAS (la Galería, pasada al lunes con «Mover a») | `7-tarjeta-cerrado-este-dia.jpg` |
| El calendario con «5 días · 4 noches» | `7-calendario-5-dias-4-noches.jpg` |
| La hoja «¿Cuántas noches?» (4 noches) y con «Solo un día» | `7-cuantas-noches.jpg`, `7-cuantas-noches-solo-un-dia.jpg` |
| La tarjeta del viaje en RUTA (con y sin fechas) | `7-ruta.jpg`, `7-ruta-sin-fechas.jpg` |
| «Mis viajes» del Perfil («octubre · 5 días · 4 noches») | `7-perfil-mis-viajes.jpg` |
| HOY después del viaje | `7-hoy-despues-del-viaje.jpg` |

Comprobado a mano en pantalla: el texto del calendario (con 4 y 3 noches y «Solo un día»), «Ahora: viernes 16», la fila de excursión sin poder elegirse (no se mueve nada), mover y [Deshacer] desde DÍAS y desde HOY, el ⇄ y «Ya en tu viaje», cambiar y [Deshacer] (la parada vuelve), y que la tarjeta cerrada dice «Cerrado este día» sin «Hoy cierra» ni «Cerrado hoy».

**Lo que NO se vio en pantalla (solo en la prueba o en el código):**

- La tarjeta de «Mis viajes» (`TripCard`, pantalla `myTrips`): hace falta un viaje guardado en la nube y Supabase estaba bloqueado. Sí se vio la fila del Perfil.
- El PDF: no lo he abierto; la prueba mira que use la función compartida.
- El aviso de la campana «Tienes más días que fechas»: solo por código.
- La lista de «Mover a» sin fechas, el aviso «Movida al día 3» y «Cambiar parada» de un destino sin catálogo (buscador de «Añadir parada»): solo con la prueba.

## 3. Pruebas

- Nueva: `scripts/destino/pruebaTanda7_mover.mjs` (+ `_7_mover_entrada.tsx`). Pinta con el código de verdad (SSR) y llama a las funciones de verdad. Cubre: la lista de «Mover a» (fecha, nombre, título, icono de excursión, gris «Día de excursión», sin día de vuelta, «Ahora: …», sin fechas, sin horas), mover y Deshacer (viaje idéntico, también desde HOY, una reservada no se mueve), «Cambiar parada» (sin `PlaceFinderPanel`, filtros, pregunta, ⇄ en lugar de «+», «Ya en tu viaje», fuera del modo el «+», el sitio ocupa el hueco a su hora sin heredar nada, paseos, Deshacer idéntico), el texto de días y noches (n de 0 a 20, calendario con una y varias fechas, RESERVAS, Perfil, tarjeta, HOY, sitios por código), «Cerrado este día» (7 casos de tarjeta, sin «Hoy cierra» ni «Cerrado hoy», EXPLORAR) y una sola pieza (nada viejo, sin emojis, colores a mano ni empresas en lo nuevo).
- Se comprobó que la prueba falla cuando algo está mal (cambiando la etiqueta a mano dio 10 fallos).
- Pruebas viejas ajustadas (lo mínimo, solo el texto «Cerrado hoy» → «Cerrado este día»): `pruebaTanda6z5.mjs` (7 sitios) y `pruebaTanda6z6c.mjs` (un horario de mentira).
- Ajustadas además por el nuevo texto, tras verlas fallar (solo el texto esperado): `pruebaFase6y_formulario.mjs` («Roma · 5 días» → «Roma · 5 días · 4 noches»), `pruebaTanda6z5.mjs` (la hoja «Pasarla a otro día» ahora lista «Jueves 11», «Viernes 12» en lugar de «jue 11 — …») y `pruebaTanda6z6b.mjs` (rótulos del Perfil con «· n noches»; la fila del Perfil ahora parte fecha y duración en dos trozos).
- Resultado, en serie y con el servidor propio (puerto 8884), 0 fallos en todas: `pruebaTanda7_mover` (147 comprobaciones), `pruebaFase6y2_*` (formulario, fotos, reorganizar, reservas), `6y3_*`, `6y4_*` (ficha, formulario, iconos, listas, perfil, presupuesto, reservas), `6y5_pantallas`, `6y6_cierre`, `6y7_*` (historias, pantallas, títulos), `6y8_comida`, `6y9_*` (audios, fichas, freetour, pantallas), `6y_formulario`, `6y_manual`, `6y_reorganizar`, `6y10_*` (audios, comida, excursión, ficha), `Corr6z6*` (cuatro), `Tanda6x_franjas`, `Tanda6z`, `6z2`, `6z3`, `6z3_dias`, `6z5`, `6z6` (y a, b, c, d), `Fase6z6c-f` y `Fotos6z3`. No se han lanzado las 365 fechas. No he corrido las pruebas de motor puro (`6y5_motor`, `6y7_motor`, `6y10_viajes`, `6y10_horarios`, `6y10_sitiosgrandes`), que no miran pantallas.

Typecheck: `npx tsc --noEmit -p tsconfig.app.json` → 0 errores.

## 4. Textos de invariantes propuestos

(Sin número: las pone quien lleve `INVARIANTES_PANTALLA.md`.)

- **Mover a otro día.** La lista de días a los que se puede mover una parada es una sola (`ListaDeDias`) y la usan el menú «···» de DÍAS y la hoja «Pasarla a otro día» de HOY: «MOVER A» con «Ahora: {día}»; cada día con su fecha en su cuadrado (sin fechas, el número), su nombre y su título; el día de vuelta no sale; un día de excursión entera sale en gris con «Día de excursión» y no se puede elegir. Mover una parada no quita nada, y mover y cambiar siempre dejan [Deshacer], que devuelve el viaje idéntico.
- **Cambiar parada.** «Cambiar parada» abre EXPLORAR con «Atracciones» y «Miradores» y la pregunta «¿Por cuál quieres cambiar {parada}?». El botón de la esquina es ⇄ (nunca «+»); lo que ya está en el viaje sale con «Ya en tu viaje» y sin icono. El sitio nuevo ocupa el hueco (su día, su sitio y su hora) y no hereda nada de la parada vieja.
- **Duración del viaje.** Toda duración de un viaje que escriba la app sale de `textoDeDuracion`: «{n+1} días · {n} noches», y con una sola fecha «1 día». El texto es siempre sobre el viaje entero (el día de vuelta incluido). La cifra «días» del mapa del Perfil y la cuenta atrás no son la duración de un viaje.
- **Cerrado este día.** Una parada cerrada ese día lleva «Cerrado este día» una sola vez en su tarjeta (DÍAS, HOY y EXPLORAR), nunca «Hoy cierra» ni «Cerrado hoy».

## 5. Decidido por Code

- «Monumentos»: en EXPLORAR el chip se llama «Atracciones» (monumentos + museos y arte + iglesias; ya no hay un chip «Monumentos» suelto). «Cambiar parada» abre con ese chip y con «Miradores».
- En «Cambiar parada» se quitan los chips de Restaurantes y Excursiones (y los baños y fuentes no salen): no se puede cambiar una parada por ellos. Solo salen lugares que se visitan; buscando por el nombre tampoco salen restaurantes. El Free Tour tampoco (es una reserva, no una parada).
- La ficha del sitio (al tocar la tarjeta) lleva abajo «Cambiar por este →» (el mismo cambio que el ⇄), salvo si ya está en el viaje.
- El título de la pantalla es «Cambiar parada — vie 16» (el mismo patrón que «Añadir parada — vie 16»).
- El aviso de [Deshacer] de «Cambiar parada» es «Cambiada por {sitio nuevo}» (corto, porque a 375 px el aviso de abajo recorta el texto).
- «Mover a otro día» y «Pasarla a otro día» llevan [Deshacer] en todos los casos (hasta ahora solo los días libres). La parada pasa al final del día nuevo, como hasta ahora; la hora la calcula el almacén y no se enseña.
- Una parada reservada no se mueve ni se cambia (como hasta ahora); el menú de una reservada solo ofrece «Quitar del viaje», igual que antes.
- «Cerrado este día»: solo cambio las palabras (el color rojo de DÍAS y HOY se queda). También lo uso en la etiqueta de las tarjetas de EXPLORAR (antes «Hoy cierra», gris) para que en toda la app se diga igual. El texto de la ficha de la parada («Por fuera · Hoy cierra»), que escribe el motor, no lo he tocado (es de la parte del motor).
- Los textos de duración con 1 día son «1 día» y no «1 día · 0 noches». En el tramo de un viaje de varios destinos (tarjeta de RUTA), las noches son las del tramo (un tramo que no es el último duerme todos sus días).
- «Ahora: {día}» usa el nombre en prosa («jueves 11»; sin fechas, «día 2»).
- Ya que la lista de «Mover a» sale de las paradas del viaje entero, el día de vuelta se filtra dentro de la propia lista (aunque quien la llame lo mande), para que nunca salga.
- Una lista de «Mover a» sin ningún día posible mantiene lo de siempre: el menú deshabilita «Mover a otro día» si no hay otros días.

## 6. Preguntas abiertas

1. **El último día de un viaje sin vuelos sí lleva ruta.** El punto 1 dice que el día de la fecha de vuelta es un día aparte sin ruta (`contentDays = días − 1`) y que, si no es así, hay que preguntar. En mi viaje de prueba (Roma, del 15 al 19 de octubre, sin vuelos puestos) el lunes 19 sale con ruta entera («Vaticano y Trastevere», con la etiqueta «Día de viaje · Roma → Madrid»), y no es un día de vuelta aparte (`isReturnLeg` no está puesto): el viaje tiene 5 días con ruta. El texto «5 días · 4 noches» sale bien igual (cuenta los días del viaje entero), pero «Mover a otro día» ofrece ese último día como cualquier otro. No lo he tocado: es de la parte de llegadas y vueltas. ¿Es lo esperado hasta que esa parte lo cambie?
2. **¿El chip «Atracciones» se queda con ese nombre?** El documento dice «Monumentos» (en «Cambiar parada» y en «Explorar monumentos» del día de vuelta). Hoy el chip de EXPLORAR que agrupa monumentos, museos e iglesias se llama «Atracciones». Renombrarlo cambiaría todo EXPLORAR (y sus pruebas). ¿Lo dejo o se renombra?
3. **¿«Cerrado este día» en rojo?** Lo dejo en el color de antes (rojo en DÍAS y HOY). Si Eric lo quiere neutro (porque la parada «se queda» y no es un fallo), es cambiar un color.
4. **La ficha de la parada sigue diciendo «Por fuera · Hoy cierra».** Es el motivo que escribe el motor (`OUTSIDE_REASONS` en `listasTrip.js` y `curatedTrip.js`). En la tarjeta ya dice «Cerrado este día»; ¿lo cambia la parte del motor también en la ficha?
5. **La cabecera de RUTA no escribe los días.** Hoy solo dice «Roma · 15 – 19 oct». ¿Se quiere «5 días · 4 noches» también ahí? Hoy solo se enseña en la tarjeta del viaje, en Mis viajes, en el calendario y en las otras pantallas de la lista.
