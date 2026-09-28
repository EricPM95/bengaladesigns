# Informe de esta tanda (28 de septiembre de 2026, tarde)

Todo está guardado en commits separados, uno por punto, y **sin subir**. Las 20 rutas regeneradas están en `docs/REVISION_20_RUTAS.md`. Debajo de cada viaje sale su nota de temporada, y al final hay una sección nueva, «Auditoría automática».

## a) Qué he cambiado

1. **Vaticano en miércoles de invierno.** Si el viaje tiene otro día posible para D2, ya no cae en miércoles de invierno. Si no lo hay, se queda así y el Janículo sale como «Roma iluminada desde el Janículo», con el texto «Roma iluminada a tus pies»: nunca como un atardecer perdido.
2. **Ferragosto sin fechas.** Se mantiene el aviso «Si tu viaje coincide con…», como pediste.
3. **D1 en Navidad.** El Panteón va antes de Piazza Navona.
4. **D4 en domingo de invierno.** El Parque de Villa Borghese va antes de Santa Maria del Popolo, así que ya no llega cerrado.
5. **«Mejor no» al poner fechas.** No sale ninguna ventana ni ningún aviso y la ruta queda exactamente igual. Lo único que se ve es la marca roja «Hoy cierra» en la parada que cierra ese día.
6. **Santa Maria del Popolo y San Pietro in Vincoli** tienen su tiempo «por fuera» (10 min) con tus textos. Ya no desaparecen: salen siempre como parada.
7. **Textos nuevos.** Aplicados tal cual en todas las paradas de los días curados (también en las listas internas de los días) y en las fichas.
   - El tono («como te lo contaría un amigo que vive allí») está en las normas y en la plantilla del kit.
   - Los textos «por fuera» también, incluido el Ara Pacis sin tiempo por fuera, como pediste.
8. **Datos que caducan.** Todo lo de Roma revisado en septiembre lleva «comprobado: 2026-09-28»: fechas especiales, textos con cifra, horarios por temporada y restaurantes.
   - El validador avisa en amarillo de lo que tiene más de 11 meses o no tiene fecha.
   - Hay un listado por destino para la revisión del 1 de diciembre (`node scripts/destino/comprobado.mjs`).
   - Las plantillas del kit piden el campo.
9. **Tarjeta «Por fuera».**
   - El motivo va en la misma línea: «Por fuera · 15 min · Hoy cierra» en rojo, o «… · para llegar a todo» en gris.
   - Por fuera ya no sale «Reserva recomendada».
   - «Quiero entrar» es un botón dentro de la ficha, debajo del motivo. Con «Vale» se cierra la ficha y el día sale rehecho, con la parada «Por dentro».
   - **Tarjetas sin texto** en todas las paradas (también nocturnas, pausas y «Por el camino»): el «Por qué aquí» es el primer párrafo de Resumen. El desayuno romano ahora abre su ficha.
   - El Castillo salía con 10 min por fuera: el redondeo al cuarto de hora y la línea «visto desde el Puente» le recortaban minutos. Ahora el tiempo por fuera es siempre el del JSON.
10. **Ventana «Quiero entrar»** en tres piezas. Ejemplo de la ruta 1: «Si entras, tendrás unos 70 min para recorrerlo y subir a la terraza del ángel. Para que te dé tiempo, cenas a las 21:30. Tranquilo: sigues llegando al Janículo para el atardecer.»
    - Si se pierde el atardecer, lo dice y ofrece la versión de noche.
11. **Dos fallos.**
    - Un lugar ya no sale dos veces el mismo día (la Galería de D4 con Free Tour).
    - El Ara Pacis va a «No te dio tiempo» si no se entra.
    - Los minutos «por fuera» no se recortan.
12. **Revisión «como un local».** Todo con reglas generales:
    - la Galería del pool vuelve a entrar en la ruta 20 (ese día se madruga un poco y la comida es más corta);
    - la Galería y el Castillo cierran el 25/12 y el 1/1 (comprobado en sus webs); también Capitolinos, Mercados de Trajano y Ara Pacis el 25/12 y el 1/5, y Doria Pamphilj;
    - el 25 de diciembre y el Domingo de Pascua, el día lleva la **Bendición Urbi et Orbi de 11:30 a 12:30**, con ida en metro A o bus 64. Ese día se come cerca de San Pedro y se vuelve en metro;
    - el tiempo libre acaba cuando hay que salir a cenar, y la nocturna antes de cenar dura 25 min como mucho;
    - Castillo → Janículo en el bus 115 o 870 desde Via Paola (comprobado en ATAC);
    - el mirador que llega después del sol pasa a ser nocturno. Si con el orden normal llega tarde, se usa el de invierno;
    - la cena empieza en el cuarto de hora siguiente a llegar;
    - la Plaza de España dura 20 min como mínimo;
    - órdenes nuevos en D4 (invierno, domingo, con Free Tour, tranquilo de invierno), D1 (tranquilo sábado y tranquilo invierno), D1-FT tranquilo (se come junto a los Foros), D5 (Isla Tiberina y Teatro de Marcelo de camino) y D4M tranquilo (Pincio de parada).
13. **Avisos de fechas que cuadran con la ruta.**
    - La promesa final («Hemos puesto…») solo sale si la sugerencia está de verdad en la ruta.
    - La Girandola del 29 de junio es la nocturna de esa noche, a las 21:30 en el Puente Sant'Angelo.
    - Si el aviso automático ya cuenta los cierres, del texto curado sale solo el contexto (tu texto sin la parte de cierres). Así no se repite y nunca nombra un lugar que no está en el viaje: el 1 de mayo ya no habla de Caracalla.
14. **Auditoría automática** en la revisión y en el barrido, para cualquier destino, con todas las comprobaciones que listaste y la lista de casos de cada una.
15. **Retocar la ruta.**
    - Añadir, quitar o cambiar la hora de una parada solo toca esa parada y los paseos con la anterior y la siguiente: nada se empuja.
    - La parada nueva entra con hora sugerida (fin de la anterior más el paseo, al cuarto de hora).
    - «Volver a la ruta original» recupera exactamente el día que dimos, con su aviso.
    - Antes de rehacer un día o el viaje con cambios sale «Perderás los cambios que hiciste en el día N».
    - Los días libres no los toca el motor ni al rehacer el viaje. Su primera parada va a las 09:30, o se ponen «Sin hora».
    - Todo se guarda con el viaje.
16. **Nota de temporada** (tu añadido).
    - Sale una vez, encima del Día 1, con el degradado de temporada del formulario, y se puede cerrar. Ese efecto ya existía en el formulario Trazo y lo he reutilizado.
    - Solo promete lo que se cumple: «Roma iluminada» si hay nocturna; «a primera hora» si la mayoría de los días empieza por un imprescindible antes de las 10:00.
    - Sin fechas dice «Si viajas en marzo, …».
    - Si sale, no sale el banner de invierno.
    - Capturas en `docs/diseno/nota_temporada/`.

**Comprobación**
- Auditoría de las 20 rutas: todo a 0 menos «lugar repetido otro día» (2 casos, ver pregunta 1).
- Recuentos de siempre: todos a 0.
- Barrido (viajes de 2 a 5 días): **759 de 768** limpios (antes, 765). Salen 7 huecos nuevos, explicados en el apartado b, más los 3 de siempre (falta un imprescindible). La auditoría automática también cuenta sus casos en el barrido.

## b) Lo que no he podido hacer o he hecho distinto

- **Lugares que no existen en los datos.** Trinità dei Monti, Via Veneto, Via del Babuino y Via Margutta no están en roma.json. No los he inventado sin coordenadas. Los órdenes nuevos de D4 van sin ellos.
- **D4 con Free Tour.**
  - En invierno el Parque va por la mañana, como pediste.
  - En verano va por la tarde, entre Santa Maria del Popolo y el Pincio, para que absorba la espera hasta el atardecer (con el Parque por la mañana quedaban casi 3 h libres).
  - En invierno, Santa Maria del Popolo va después del Pincio: abre a las 16:00 y el sol se pone a las 16:40.
- **D1-FT tranquilo** come junto a los Foros en todas las épocas, no solo en invierno: el ir y volver al Ghetto pasaba igual todo el año.
- **D1 tranquilo en invierno.** Con la comida larga del ritmo tranquilo, el Campidoglio llega a las 16:45 con el sol a las 16:43: sale como «Roma iluminada desde el Campidoglio».
- **D4 en domingo de primavera o verano.** Santa Maria del Popolo cierra a las 18:00 y el turno de la Galería es a las 15:00: sale por fuera (su texto invita a entrar si está abierta).
- **Ruta 3, 27 de marzo (D2).** Con el orden de invierno quedaba más de una hora de espera antes del Janículo. La he llenado con el Castillo por dentro, que es lo que haría un local. Se pierde el callejeo por Trastevere, pero esa noche se cena allí.
- **Verano.** El tiempo libre con nombre antes del atardecer se acepta hasta 150 min, como decidimos el 27 de septiembre. La auditoría solo marca lo que pasa de ahí.
- **Redondeo al cuarto de hora.** Las horas que ve el viajero pueden correr hasta 7 min respecto a las del motor, así que la auditoría da ese margen. Quedan dos casos al límite: Santa Maria in Trastevere de 19:45 a 20:05 con cierre a las 20:00, y los Foros a las 17:45 con el sol a las 17:43.
- **Cierres del 25/12 y el 1/1 sin confirmar** (no los he tocado): Cúpula de San Pedro, Domus Aurea, Villa Farnesina, Galería de Arte Moderno y San Clemente.
- **Textos míos para revisar:**
  - «lo mejor de la visita» de 12 monumentos (el del Castillo es tuyo);
  - el texto de la Bendición en Pascua;
  - los «contexto», recortados de tus textos quitando la parte de cierres.
  
  Están en `docs/roma_por_que.json` (por_fuera) y `docs/roma_fechas_especiales.json`.
- **San Ignacio lleva `cifra_ok`** (la moneda de 1 €) porque venía así en tu archivo, aunque dijiste «cifra_ok solo en Trevi».
- **La revisión automática del 1 de diciembre** no la he programado: el listado está listo (`comprobado.mjs`), pero programarla es una tarea fija que prefiero que decidas tú.
- **Nota de temporada en noviembre.** Pediste la época «de by_period». En Roma el horario de invierno empieza con el cambio de hora (25 de octubre), así que con el sol antes de las 17:30 la nota es la de invierno. Noviembre sale como invierno y no como «buena época».
- **Huecos que quedan en el barrido (7):**
  - Cinco lunes de octubre en D2: el Castillo cierra, así que con el orden de invierno no hay nada que ver por dentro para llenar la espera, y quedan unos 100 min de tiempo libre, con ideas, antes del Janículo.
  - Un D4 con Free Tour en mayo: 94 min antes del Pincio. En mayo aún no aplica la regla de verano de los 150 min.
  - Un D3 tranquilo en agosto con Free Tour: una tarde libre de 163 min.
- **D4 en domingo de verano:** el Parque llena ahora la espera, pero Santa Maria del Popolo sigue por fuera (turno de la Galería a las 15:00 y cierre a las 18:00).
- **No hecho, como pediste:** la pantalla de día libre después del formulario y el botón «+» para añadir un día.

## c) Preguntas y decisiones para ti

1. **El Campidoglio se repite en D5** (rutas 11 y 12). D5 acaba en el mirador del Campidoglio al atardecer («Terminas el día en la plaza de Miguel Ángel…»), y el viaje ya lo vio en D1 o D1-FT.
   - Opciones:
     - (a) Marcarlo como revisita al atardecer.
     - (b) Que D5 acabe en otro sitio (el Circo Máximo al atardecer) cuando el Campidoglio ya va en el viaje.
   - **Recomiendo (a)**: de noche es otra vista y el texto lo vende.
2. **El Gesù, San Luigi y Santa Maria in Trastevere** son de nivel 2, se visitan por dentro y no tienen tiempo «por fuera». Si un día no caben o cierran, desaparecen. Pasa lo mismo que con Santa Maria del Popolo.
   - Opciones:
     - (a) Darles `minutos_fuera` y `por_fuera` (los textos serían tuyos).
     - (b) Dejarlos así.
   - **Recomiendo (a).**
3. **Lugares que faltan** para tus órdenes de D4 (Trinità dei Monti, Via Veneto, Via del Babuino, Via Margutta).
   - Opciones:
     - (a) Añadirlos al JSON, con coordenadas y textos.
     - (b) Dejar los órdenes como están.
   - **Recomiendo (a)**, sobre todo Trinità dei Monti y Via Margutta.
4. **Tardes de verano en D4** con 1,5-2,5 h libres antes del atardecer en el Pincio.
   - Opciones:
     - (a) Aceptarlo, como el 27 de septiembre.
     - (b) Llenarlo con algo más (el Ara Pacis por dentro, compras en Via del Corso).
   - **Recomiendo (a)**, con las ideas del tiempo libre.
5. **Nota de temporada en noviembre** como invierno (ver apartado b).
   - Opciones:
     - (a) Así, por la hora del sol.
     - (b) Por meses: noviembre, otoño.
   - **Recomiendo (a).**
6. **Revisión automática del 1 de diciembre.**
   - Opciones:
     - (a) La programo con el listado de `comprobado.mjs`.
     - (b) La lanzas tú.
   - **Recomiendo (a).**
7. **Textos míos** (apartado b): revísalos cuando puedas; si los cambias en tus archivos, los aplico tal cual.
