# Informe: repaso de las 20 rutas (28 de septiembre de 2026)

Todo va en commits, uno por parte, y **sin subir**. Las 20 rutas están regeneradas en `docs/REVISION_20_RUTAS.md`, con la auditoría automática **a 0 en todo**.

**Barrido: 765 de 768 limpios** (pedías 759 o más). Los 3 que faltan son los de siempre: viajes de 2 días el 14 de agosto, con los Museos Vaticanos cerrados en Ferragosto.

## a) Qué he cambiado

1. **Parte A: los fallos que el viajero notaría.**
   - La Girandola sale el día 2, con la cena a las 20:00 en el centro.
   - Las nocturnas ya no repiten un lugar de ese día.
   - «Quedó fuera» dice el día y el motivo reales.
   - El grupo del Popolo va con la plaza antes que la iglesia.
   - El atardecer dura hasta 15 min después del sol: «quédate hasta que se enciendan las luces».
   - La Galería Borghese coge el turno anterior si llegas antes.
   - La Cúpula va antes que la Basílica y dura 45 min.
   - Desayuno de 25 min.
   - D1-FT tiene tarde de invierno.
   - D5C va sin Letrán, con San Clemente a las 14:00 y Monti como aperitivo.
   - El primer domingo del mes lleva su aviso.
   - Los restaurantes de Navidad y Ferragosto llevan su frase aparte.
2. **Parte B: textos.**
   - Cada nocturna y cada mirador de noche tienen su texto propio, no el genérico.
   - Los textos que hablan de lo de antes o de después solo salen si se cumple (`solo_si_viene_de` / `solo_si_sigue`).
   - La escalinata después de cenar tiene su texto.
3. **Parte C: minutos.**
   - El Puente Sant'Angelo dura 15 min como mucho.
   - El Foro sale por el Clivo Capitolino, junto al Campidoglio: lo siguiente se mide desde ahí.
   - El Janículo de noche solo sale antes de cenar; después, Trastevere de noche.
4. **Parte D: la auditoría ve estos fallos sola.** Detecta:
   - el atardecer que acaba antes del sol;
   - la nocturna repetida;
   - el «Quedó fuera» falso;
   - la plaza después de su monumento;
   - los textos genéricos o con la condición sin cumplir;
   - las ideas de otra zona;
   - la espera antes de cenar, a cualquier hora.
5. **Comprobación.** Al pasar el barrido salieron 4 regresiones de las partes A-C. Están arregladas con reglas generales (regla 304):
   - **D2 en marzo:** esperabas 100 min antes del Janículo. Ahora subes por el Tempietto (por dentro) y la Fontana, y recuperas el paseo por Trastevere.
   - **D1-FT el 14 de abril y D5C en mayo:** se perdía la tarde entera. Quedarse después del sol retrasaba la cena más allá de su franja, y Monti después de los Foros no cabía.
   - **Orden de invierno forzado y relleno de la espera:** solo se quedan si no se pierde ninguna parada más.

## b) Lo que no he podido hacer o he hecho distinto

- **El primer domingo del mes el Coliseo no se puede reservar.** Lo dice su web oficial: las entradas se recogen en la taquilla por orden de llegada. He adaptado tu texto: «Ese día no se reserva: … ve temprano».
- **Hay un motivo nuevo de «Por fuera»: «A esta hora no abre».** Es para Santa Maria del Popolo antes de su hora. Sale en rojo, como los otros cierres.
- **Santa Maria della Vittoria empieza a las 08:30, no a las 09:00.** Con las 09:00 la Galería perdía su turno de las 11:00.
- **Trinità dei Monti en D3 va «si da tiempo».** Si por ella se pierde algo (el Free Tour a su hora), sale ella.
- **Domingos de verano en D4:** Santa Maria del Popolo va después de la Galería. Por la tarde no cabía.
- **La subida por el barrio antes del atardecer ahora entra con más de 60 min de espera, no de 90.** Si no, quedaba un tiempo libre de 65 min antes del Janículo (ruta 5, día 2), y el Tempietto se quedaba por fuera cuando podía ir por dentro.
- **En verano, Monti va antes de los Foros en D5C.** Después del atardecer ya no da tiempo antes de cenar. En invierno sigue después, como aperitivo.
- **Ruta 6, día 3: la Cúpula queda fuera («No te dio tiempo»).** Es el miércoles con el Castillo del pool, y la tarde no da para todo.

## c) Preguntas y decisiones para ti

1. **Monti antes de los Foros en verano**, en lugar de quitarlo.
   - (a) Así, como paseo antes del atardecer.
   - (b) Quitarlo en verano.
   - **Recomiendo (a).**
2. **Espera antes del atardecer:** subir por el barrio desde 60 min.
   - (a) Dejarlo en 60.
   - (b) Volver a 90 y aceptar tiempo libre de hasta hora y media.
   - **Recomiendo (a).**
3. **Punto 7b del informe anterior.**
   - El caso del domingo de mayo en D4 ya no sale en el barrido.
   - Sigue pendiente el de Ferragosto: D3 tranquilo el 14 de agosto, con 163 min de tarde libre porque los Vaticanos cierran.
   - (a) Aceptarlo con nombre: «Tarde libre por San Pedro y Borgo».
   - (b) Llenarlo con el Castillo de Sant'Angelo por dentro.
   - **Recomiendo (b).**
