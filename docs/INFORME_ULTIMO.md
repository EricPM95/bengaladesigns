# Informe de esta tanda (28 de septiembre de 2026)

Todo está guardado en commits separados (uno por parte) y **sin subir**. Las 20 rutas regeneradas están en `docs/REVISION_20_RUTAS.md`.

## a) Qué he cambiado

- **A — Títulos y Trevi.** Los títulos se quedan como acordamos (D3 sigue siendo "Trevi sin gente"). En las rutas, Trevi lleva mis textos. En la ficha va tu `trevi_ficha` tal cual (empieza por "No es una entrada" y lleva `cifra_ok`).
- **B — Todo monumento es parada.** Todo lugar de nivel 1 o 2 sale con su propia línea, por dentro o por fuera. Nunca va "Por el camino" ni escondido en el texto de otra parada.
  - Los 12 textos "por fuera" están en roma.json y en `docs/roma_por_que.json`.
  - La Conciliazione pasa a nivel 3.
  - San Luigi, el Gesù y Santa Maria in Trastevere pasan a "interior". Al revisar he encontrado otras dos en el mismo caso: Santa Maria sopra Minerva y San Ignacio. Las cinco siguen marcadas como entrada gratis.
  - Si un lugar no tiene tiempo "por fuera", va a "No te dio tiempo".
  - Queda apuntado en las normas del motor y en el kit de destino nuevo.
- **C — Primero la plaza o el puente, luego el monumento.** Tiene las dos excepciones que pediste: el monumento con hora fija, y la plaza o el puente que es el sitio del atardecer o de la noche. La revisión lo cuenta: **0 casos** en las 20 rutas.
- **D — D2 y D1.**
  - D2, en todas sus variantes: Conciliazione (10 min) → Puente → Castillo. En invierno, sin Borgo Pio. El Janículo sigue al atardecer en verano, invierno y tranquilo.
  - D1 y D1-FT: Campidoglio → Plaza Venecia (10 min) → Altar (45 min).
  - Ningún otro día va de San Pedro al Castillo.
- **E — La app.** Todas las paradas tienen las mismas pestañas: Resumen, Entradas y Tips.
  - La cabecera cerrada dice "Por dentro · 75 min" con icono de entrada, o "Por fuera · 15 min" con icono de cámara.
  - En Resumen, si la parada va por fuera, sale una línea con el motivo.
  - Todo con el diseño Trazo. Hay capturas en `docs/diseno/por_dentro_fuera/`.
- **F — "Quiero entrar".** Las paradas que van por fuera porque no caben llevan un interruptor. Al tocarlo, el motor rehace ese día con la parada por dentro, y antes de guardar enseña una frase con lo que cambia y los botones "Vale" / "Mejor no". Si hay que quitar un imprescindible o el atardecer, lo pregunta.
  - Probado con la ruta 1: el Castillo por dentro (70 min), Trastevere se acorta, la cena pasa de 21:00 a 21:30 y el Janículo sigue al atardecer.
- **G — Fechas.**
  - Sin fechas, los días son siempre normales: ni festivos, ni cierres de un día concreto, ni horarios especiales. He encontrado y arreglado un caso: un horario especial por rangos de fechas podía colarse sin fechas.
  - Si pones las fechas desde el botón del mapa, la ruta se rehace como en el formulario y luego sale la ventana de avisos. Las reservas se mantienen.
  - Si la ruta estaba cambiada a mano, antes pregunta "Vamos a ajustar tu ruta a estas fechas y algunos días pueden cambiar. ¿Seguimos?". Con "Mejor no", se guardan las fechas, la ruta no cambia y el día lleva la etiqueta del aviso.
  - La revisión incluye el caso de prueba de agosto: sin fechas sale normal, y del 13 al 15 sale con el aviso de Ferragosto y el Vaticano movido al viernes 13.
  - Hay capturas en `docs/diseno/fechas/`.
- **Comprobación.**
  - Recuentos de la revisión, todos a 0: monumentos sin línea, nivel 1-2 "Por el camino" o escondidos, y plazas o puentes después de su monumento.
  - Barrido (viajes de 2 a 5 días): **765 de 768** limpios, lo mismo que antes. Los 3 que fallan son los de siempre: le falta un imprescindible.
  - Con viajes de hasta 7 días: 1149 de 1152 limpios.

## b) Lo que no he podido hacer o he hecho distinto

- **Sube el número de lugares que se quedan en "No te dio tiempo".** Es consecuencia de la regla B.5: Santa Maria del Popolo y San Pietro in Vincoli no tienen tiempo "por fuera", así que cuando no caben ya no se ven de paso. Es lo que pediste, pero lo verás más en la revisión.
- **Dos cosas de los datos que no he tocado, para que lo decidas tú:**
  - D1 en Navidad (variante del 25 de diciembre) pone Piazza Navona antes del Panteón.
  - D4 en domingo de invierno pone el Parque de Villa Borghese a una hora a la que ya cierra (17:00), justo después de Santa Maria del Popolo.
- **"Mejor no" al poner fechas.** Tus textos de fechas dicen "Hemos ajustado tu ruta…" o "Hemos puesto tu visita…", y con "Mejor no" eso no es verdad. En ese caso:
  - quito esa última frase de tu texto;
  - en lo que genera el motor escribo "Tu ruta sigue como la tenías: ese día solo podrás verlo por fuera", o "…: mira que tu visita caiga dentro" si hay horario especial;
  - la ventana se titula "Lo que pasa en tus fechas" en vez de "Hemos preparado tu viaje para estas fechas".

  Son textos míos: cámbialos si quieres.
- **Sin fechas también quito "Hemos ajustado…"** del aviso "Si tu viaje coincide con…", por la misma razón.
- **En los destinos que no son curados**, el botón de fechas solo guarda las fechas, como antes. Rehacer esas rutas supondría llamadas nuevas a Claude.
- **Al rehacer la ruta por fechas**, las paradas que el viajero había pasado a "por dentro" con "Quiero entrar" vuelven a lo que decida el motor para las fechas nuevas.
- **Las capturas de la ficha a pantalla completa salen en blanco** con el navegador sin ventana. He comprobado el contenido leyendo el texto de la página.

## c) Preguntas y decisiones para ti

1. **Janículo en D2.**
   - **13 y 14 de octubre de 2026:** con los cambios de la Parte D ya no se cae. En todas las combinaciones que he probado (2, 3 y 4 días, completo y tranquilo) llega a las 18:45 con el atardecer. Antes se caía en tranquilo: el motor quitaba el Puente para llegar al sol y el Janículo llegaba tarde. Ahora Trastevere cede 15 o 30 min y todo cabe.
   - **8 de diciembre de 2026 (viaje de 4 días):** D2 cae el miércoles 9. En invierno y en miércoles pasan dos cosas: por la audiencia del Papa, la Basílica y la Cúpula van después de comer, y el sol se pone a las 16:39. El Janículo llega a las 17:15 y sale como "Roma iluminada" (de noche), no al atardecer. Pasa en cualquier miércoles de invierno en que caiga D2.
   - Opciones:
     - (a) Si el viaje tiene otro día libre para D2, no ponerlo en miércoles en invierno.
     - (b) En esos miércoles, ver la Cúpula por fuera o quitarla para llegar al sol.
     - (c) Dejarlo así: se ve de noche, que también es bonito.
   - **Recomiendo (a), y (c) cuando no haya otro día.**
2. **Aviso de Ferragosto sin fechas.** Con 3 días de agosto sin fechas, la ruta sale normal, pero la ventana de avisos enseña "Si tu viaje coincide con los días del 14 al 15 de agosto: …", sin etiqueta en ningún día. Así lo decidimos en su día para los viajes sin fechas.
   - Opciones:
     - (a) Mantenerlo.
     - (b) Sin fechas, no enseñar avisos de días concretos, solo los de temporada.
   - **Recomiendo (a)**: avisa sin cambiar nada. Pero si "sin Ferragosto" significaba que no saliera ni el aviso, es un cambio de una línea.
3. **D1 en Navidad (Navona antes del Panteón).**
   - Opciones:
     - (a) Poner el Panteón antes de Navona, como el resto de variantes.
     - (b) Dejarlo, si ese orden tiene un motivo que yo no veo.
   - **Recomiendo (a).**
4. **D4 en domingo de invierno (el Parque cierra a las 17:00).**
   - Opciones:
     - (a) Poner el Parque antes de Santa Maria del Popolo en esa variante.
     - (b) Quitar el Parque en invierno en domingo.
   - **Recomiendo (a).**
5. **Textos míos para "Mejor no"** (apartado b): revísalos y cámbialos si quieres otra forma de decirlo.
