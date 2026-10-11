# Informe de la Tanda 6z6f

Los tips y HOY a pantalla completa, fuera las etiquetas de momento, «x de 3 listo» sin título y el autor de las fotos de Wikimedia.

## 1. Los tips, a pantalla completa de verdad
- La hoja de tips ahora se pinta en el `body` con un portal (como `Modal` y `PickerSheet`), por encima de la cabecera y de la barra de abajo. Con su X; al cerrarla vuelves a RUTA donde estabas.
- Comprobado a 375 px: el elemento ocupa los 375×812 y en cinco puntos (cabecera y barra incluidas) el elemento de arriba es el de los tips.
- **Otras pantallas «completas» con el mismo problema:** revisé todo lo que usa `fixed inset-0` sin portal. Las fichas de parada, de llegada y de comida de DÍAS ya van en el portal de `DayDetailPanel`; las del explorador, en el suyo; `SeasonCard` y `DateNoticesModal` las monta `RouteView` fuera del panel; `StopMenu` y `DayMenu` son menús desplegables. **Queda una: `AttractionsFinder`** (la lista de atracciones de EXPLORAR y el modo «elegir varios sitios» del menú del día para destinos **sin catálogo**; no es Roma). Va dentro del panel con `z-50` y lleva su propio `map-cover-overlay`. No la he tocado: es una ruta heredada, delicada y no probable con Roma. Está en las preguntas.

## 2. HOY a pantalla completa
- HOY (de pago) no lleva el mapa grande de arriba: ocupa toda la pantalla entre la cabecera y la barra. Una sola línea (`mapHidden`). El mapa pequeño de «Siguiente parada» se queda. Visto en los tres momentos a 375 px y en escritorio.
- RUTA, DÍAS y EXPLORAR siguen con su mapa de 268 px; RESERVAS es pantalla completa como siempre.

## 3. Fuera las etiquetas «Antes del viaje», «Durante el viaje» y «Después del viaje»
Quitadas de la tarjeta oscura de RESERVAS, de HOY antes (las dos tarjetas) y de HOY después. No quedaba ninguna más (las demás menciones están en comentarios del código y en el panel de pruebas, que conserva su «Momento»). «Hoy · dom 11 oct» de HOY durante es la fecha del día, no el momento, y se queda. Lo que cambia con el momento sigue igual.

## 4. «x de 3 listo», sin título
La tarjeta clara de RESERVAS dice solo «0 de 3 listo» (en la de pago hoy salen 2 si la ruta no tiene entradas; en la gratis, «0 de 2» o menos según la ruta), con el mismo estilo (frambuesa, cursiva), sus rayas y sus botones redondos. Ya no recibe la ciudad.

## 5. Las fotos de Wikimedia, con autor y licencia
- **Qué fotos de Roma se sirven de Wikipedia:** de 125 lugares consultados, 76 son propias, 14 de Unsplash, 29 de Wikipedia (27 ficheros de Commons) y 6 sin foto. La lista, con los días escritos donde salen: Largo di Torre Argentina, Via del Corso, Museos Vaticanos y Capilla Sixtina, Castillo de Sant'Angelo (por fuera), Bioparque de Roma, Isla Tiberina, Campo de' Fiori, Borgo Pio, Iglesia del Gesù, San Luigi dei Francesi, Santa Maria sopra Minerva, San Ignacio de Loyola, Elefantino de Bernini, Fuente de las Tortugas, Plaza Colonna, Plaza del Quirinal, Via dei Coronari, Plaza Farnese, Santa Maria della Vittoria, Plaza Trilussa, Quartiere Coppedè, San Pietro in Montorio y Tempietto, Monti, Cripta de los Capuchinos, Trastevere al atardecer y cuatro excursiones.
- **Script:** `scripts/destino/creditosWikimedia.mjs` (pide una vez por foto a la API de Commons, con pausa, reanudable e idempotente) y sus datos en `data/dias/roma/_fotos_wikimedia.json`: **27 fotos, 22 con autor y licencia (CC BY y CC BY-SA), 5 de dominio público (sin línea) y 0 sin autor.** Dominio público: Largo di Torre Argentina, Bioparque, Plaza del Quirinal, Plaza Farnese y la excursión a Florencia y Pisa.
- **Servidor:** al responder, añade el crédito mirando el nombre del fichero (vale también para lo que viene de la caché de Supabase); nada se pide a Wikimedia al abrir una ficha.
- **Pantalla:** «Foto: {autor} · {licencia}» en pequeño, con el autor enlazado a Commons, igual que Unsplash, y en «Créditos». Sin datos o de dominio público, nada, nunca algo vacío. Se versionó el guardado local de fotos para que las ya vistas sin crédito se vuelvan a pedir una vez.
- Visto a 375 px: la ficha de la Plaza Colonna dice «Foto: Diego Delso · CC BY-SA 4.0» con el enlace a la página de la imagen. Isla Tiberina y Plaza Colonna con crédito; Largo di Torre Argentina (dominio público), Coliseo de noche y Trevi (propias) sin línea.
- **Cosas que he visto y no he cambiado (son tuyas de decidir):**
  - 4 fotos equivocadas servidas de Wikipedia: **Cripta de los Capuchinos (D4)** sale la «Kapuzinergruft» de Viena; **Trastevere al atardecer** sale un reloj del Quirinal; **Via dei Coronari y Borgo Pio** comparten la foto del Passetto di Borgo; **las 4 excursiones** salen un manuscrito, una vista de Marsella y un avión. Conviene cambiarlas.
  - Hay fotos que se piden solo como dirección, sin pasar por la ficha, y por tanto sin línea de crédito (cabecera de excursiones, tarjetas del explorador, selector de lugares, `ExplorePanel`, `AddToDaySheet`). Ya era así con las de Unsplash.

## 6. Tus respuestas a la 6z6e
Pregunta 2 y 3, bien así (no he cambiado nada).

## 7. Pruebas
- Nueva `pruebaFase6z6f.mjs` (22 comprobaciones, 0 fallos): tips en el body por encima de la cabecera y la barra; ninguna otra pantalla «completa» sin portal fuera de las revisadas; HOY sin mapa grande y el de RUTA, DÍAS, EXPLORAR y RESERVAS como antes; 0 etiquetas de momento; la tarjeta clara sin «Tu viaje a…».
- Nueva `pruebaFase6z6fWikimedia.mjs` (39 comprobaciones, 0 fallos con servidor): forma del JSON, autor y licencia de las no públicas, el crédito del servidor, el cliente con un servidor simulado, la ficha y «Créditos».
- Ajustadas dos pruebas viejas que pedían «Tu viaje a Roma · 0 de 3 listo», «Antes del viaje» y «Después del viaje». Las de siempre, a 0 fallos. Capturas: `docs/dias/img/6z6f-*.jpg`. Viaje de prueba borrado.
- Invariantes 534 y 550 retocadas y 558 a 560 nuevas.

## 8. Lo que NO pude comprobar
- Los enlaces de Commons abriéndose en un móvil real.
- La ficha con foto de Wikimedia **en la versión gratis** (el código es el mismo; lo vi en la de pago).
