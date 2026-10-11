# Informe de la Tanda 6y3

Las respuestas a tus 14 preguntas de la 6y2. Se hizo en tres partes que luego se juntaron; cada una tiene su informe con el detalle:
- `INFORME_PARTE_RESERVAS_TANDA6Y3.md` (orden de «Añadir parada», Free Tour, botones)
- `INFORME_PARTE_FORMULARIO_TANDA6Y3.md` (acortar fechas, barra de pasos, `LandingScreen`)
- `INFORME_PARTE_FOTOS_TANDA6Y3.md` (rechazadas, candidatas, `_fotos_wikimedia.json`)

## 1. Las respuestas
- **«Añadir parada»:** el orden es más «me gusta» de verdad → nivel 1 → `pool_lista` (sin repetir) → el resto. Una sola regla (`compareManualExplorer`). Dentro del nivel 1 dejé el orden editorial de siempre (decisión mía, en las preguntas).
- **Fotos de la página de candidatas:** no se ha cambiado nada; esos sitios siguen sin foto hasta que elijas (está en PENDIENTES).
- **Tívoli y Pompeya y Sorrento:** añadidas a las rechazadas (ya son 10) y a la página de candidatas con 3 cada una. El nombre real de Tívoli es el largo: «Excursión a Tívoli — Villa d'Este y Villa Adriana». Tívoli: 3 candidatas de Villa d'Este (de Villa Adriana no hay nada en Unsplash; la página lo dice). Pompeya y Sorrento: 3 buenas, confirmadas por su descripción (Pompeya con el Vesubio dos veces y el puerto de Sorrento).
- **`_fotos_wikimedia.json`:** quitadas las 6 entradas equivocadas (de 27 a 21 fotos): Trastevere al atardecer (el reloj del Quirinal), la excursión a Florencia y Pisa (el manuscrito), la de Nápoles y Pompeya en tren (la vista de Marsella), Borgo Pio y Via dei Coronari (el Passetto di Borgo), las excursiones a Florencia en tren y a la Costa Amalfitana (el Vueling) y la Cripta de los Capuchinos (la de Viena). Tívoli no estaba en ese fichero. El script `creditosWikimedia.mjs` ya respeta las rechazadas y no las vuelve a añadir.
- **Recuadro neutro para sitios sin foto:** bien (ya estaba).
- **Barra de pasos:** «5/7» en la pantalla de elegir; con «Quiero hacerla yo» pasa a «5/5» y el resumen es LISTO; con «hazla por mí», 6/7, 7/7 y LISTO. Visto en pantalla (el contador al tocar la tarjeta también, con el aviso «Preparando tu viaje…»).
- **Acortar las fechas:** fuera la pregunta «¿Qué hago con ellas?» y el selector. Ahora, un solo «¿Estás seguro?» (el de siempre al eliminar) que dice qué días se quitan; «Eliminar» los quita con todo, «Cancelar» no cambia nada. Visto en pantalla: «¿Estás seguro? Se quitarán el mié 14 y el vie 16.» y «Cancelar» dejó los 5 días y las mismas fechas. Quedan estas reglas: un día fijado por una excursión reservada no se quita; las reservas de entrada de un día quitado se quedan en RESERVAS.
- **Quitar la reserva del Free Tour a mano:** quita también su parada, con «Free Tour quitado del viaje» y [Deshacer], que devuelve las dos cosas. Comprobado en el navegador.
- **Aviso de reserva fuera de su día en nuestra ruta:** no hace falta; solo en la ruta a mano, como estaba.
- **Reorganizar con reserva de tarde, la comida y los puntos de las zonas:** bien así; no se ha tocado nada.

## 2. Lo que dejaste para mirar
- **Botones del aviso:** ahora [Pasar al mié 15] y [Añadir al mié 15] (con «al día 2» sin fechas). Ya no queda ningún «Pasarlo» ni «Añadirlo» en `src`, `server`, `shared` ni `scripts`.
- **El Free Tour a mano con foto real:** la parada nace sin foto (recuadro neutro) y, al guardar la reserva, pide la foto real del punto de la ruta nuestra (`photo_from` del destino, la Piazza Navona). Hoy sale una de Unsplash, con su crédito (que la ficha ya pinta). Visto en pantalla: la tarjeta del Free Tour en el jueves 15 con la fuente de la Piazza Navona y su hora 10:00. Ojo: el punto de encuentro del Free Tour es la Plaza de España, pero la foto es la de la Piazza Navona (la misma que en nuestra ruta); está en las preguntas.
- **`LandingScreen.tsx` borrado**, y con él `src/components/ui/PlaceAutocomplete.tsx` (solo lo importaba él; comprobado con grep). No se borran: `RouteSearch` (lo usa `StepRoute`), `classifyInBackground`, `suggestExperiencesInBackground`, `mapboxGeocoding`, `FlagIcon` e `Icono`, porque los usan otros. El botón «Dev: ruta rápida» sigue en `StepRoute`. Quedan tres comentarios que nombran `LandingScreen` (`App.tsx`, `TrazoFlow.tsx`, `TransportResolutionStep.tsx`), que son explicaciones. Se retiró de `pruebaTanda6z3.mjs` la excepción del 🧪 de ese fichero. También limpié lo que solo usaba la pregunta vieja de las fechas (`ManualDaysDialog`, `manualDaysQuestionText`, `startManualAsk`, `answerManualAsk`, `ManualAsk`, `ManualResizeQuestion`, `RemovedDayChoice`, `moveTargetOf` y el parámetro `decisions`). `pasarAOtroDia` NO se ha borrado: es el de «Saltada» de HOY y se sigue usando.

## 3. Pruebas
Nuevas: `pruebaFase6y3_reservas` (97), `pruebaFase6y3_formulario` (964), `pruebaFase6y3_fotos` (55), a 0 fallos. Ajustadas por el cambio: `pruebaFase6y2_formulario` (60, quitada la pregunta vieja y la barra «5/5 en elegir»), `pruebaFase6y2_fotos` (al menos 8 rechazadas), `pruebaFase6y2_reservas` (textos de botones), `pruebaFase6y_manual` (orden de «Añadir parada»), `pruebaFase6z6fWikimedia` (no cuenta fotos) y `pruebaTanda6z3` (la excepción de `LandingScreen`). Las de siempre, a 0 fallos. Invariantes 564, 568, 569, 570, 571 y 573 retocadas. Capturas en `docs/dias/img/6y3-*.jpg`. Viaje de prueba borrado.

## 4. Lo que NO pude comprobar
- La pantalla de elegir a «5/5» (la vi en el resumen corto con LISTO y por el contador en el propio DOM; no pude capturar el instante de «5/5» antes de pasar de pantalla).
- El «Sí» del «¿Estás seguro?» (quita los días): lo cubren las pruebas; en pantalla solo pulsé «Cancelar».
- Noté, sin tocarlo (no es de esta tanda), que el calendario que se abre desde la cabecera de la pestaña RUTA queda por debajo del panel de abajo y sus filas de abajo no se pueden tocar; en la pestaña DÍAS sí se ve entero.
