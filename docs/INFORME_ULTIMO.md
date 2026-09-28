# Informe de esta tanda (respuesta a tu informe, 28 de septiembre de 2026)

Todo va en commits separados, uno por punto, y **sin subir**. Las 20 rutas están regeneradas en `docs/REVISION_20_RUTAS.md`, con la auditoría automática **a 0 en todo**.

## a) Qué he cambiado

1. **Campidoglio en D5.** Sale como revisita al atardecer, con tu texto: «Ya estuviste el Día 1, pero al atardecer es otro sitio…». El número del día es el real de cada viaje.
   - Regla general en INVARIANTES: un lugar solo se repite otro día si es una revisita marcada, a otra hora y con su texto. La auditoría no la cuenta como repetida.
   - El barrido encontró además el **Altar de la Patria** repetido en D5 en invierno (96 viajes). Ahora en D5 solo va si el viaje no lo tiene ya. Cuando no va, D5 baja a Monti por la Columna de Trajano y los Mercados de Trajano (por fuera), que quedan de camino.
2. **El Gesù, San Luigi y Santa Maria in Trastevere.** Tienen 10 min por fuera con tus textos. Siguen sin tiempo por fuera exactamente los que dijiste que no lo llevan: Cúpula, Ara Pacis, Capitolinos, San Clemente, Domus Aurea y Villa Farnesina. No queda ningún otro de nivel 2.
3. **Lugares nuevos.**
   - Trinità dei Monti: nivel 2, 15 min por dentro, 10 por fuera. Horario de su web oficial: de lunes a sábado de 10:15 a 19:45 (el miércoles desde las 12:00) y el domingo de 9:00 a 19:30. Sin día de cierre; las visitas se suspenden durante las misas. Lleva `comprobado`.
   - Via Veneto, Via del Babuino y Via Margutta: calles, de paso, 10 min.
   - Las coordenadas coinciden con las de Wikipedia. Via Veneto queda a 203 m del punto de Wikipedia, que es normal en una calle larga.
   - Órdenes de D4 con ellos:
     - Con Free Tour: Santa Maria della Vittoria → Tritón → Via Veneto → Parque → Galería a las 11:00 → … → Pincio → Via Margutta → Via del Babuino → Plaza de España iluminada.
     - Tranquilo de invierno: Plaza de España → Trinità dei Monti → Galería a las 11:00.
4. **Tardes de verano en D4.** El Parque de Villa Borghese, cuando se estira 45 min o más, sale como «Tiempo libre en Villa Borghese», con tu texto (la barca en el lago, la bici o un rato a la sombra antes del Pincio).
5. **Noviembre como invierno.** Queda como estaba.
6. **`scripts/comprobado.mjs`.** Existe con ese nombre, además de `scripts/destino/comprobado.mjs`. Los dos sacan el mismo listado; ahora mismo, 0 datos por repasar en Roma.
7. **Lunes de octubre en D2.** El Castillo sale por fuera y se sube al Janículo por el barrio: el Tempietto (cerrado el lunes, así que por fuera) y la Fontana dell'Acqua Paola, con el bus 115 o 870 hasta la subida. El Janículo llega al atardecer con 34 min de margen y se recupera el paseo por Trastevere.
   - Regla general en INVARIANTES: si un cierre deja un hueco de más de 90 min, primero entran paradas de nivel 2-3 de camino y en la misma zona; después se estira lo estirable, y solo entonces sale tiempo libre con nombre.
8. **`docs/TEXTOS_PARA_REVISAR.md`.** Recoge mis textos:
   - «lo mejor de la visita» de 12 monumentos, más el de Trinità dei Monti, que es nuevo;
   - el contexto de las fechas, al lado de tu texto;
   - la Bendición de Pascua;
   - las descripciones y los tips de los cuatro lugares nuevos.

**Comprobación**
- Revisión de las 20 rutas: auditoría a 0 y recuentos a 0.
- Barrido (viajes de 2 a 5 días): **764 de 768**.
  - 3 son los de siempre (falta un imprescindible).
  - El resto sale de los dos casos que me pediste para decidir (punto 7b, abajo).
  - Con lo que decidas, debería quedar en 765 o mejor.

## b) Lo que no he podido hacer o he hecho distinto

- **Trinità dei Monti en D4 tranquilo de invierno va de paso** (10 min en la balaustrada), no por dentro. En ritmo tranquilo el día no empieza antes de las 10:00, y con la visita por dentro la Galería perdía su turno de las 11:00. Sale con el motivo de siempre: «Hoy lo ves por fuera para llegar a todo lo del día».
- **«Tiempo libre en Villa Borghese»** solo sale cuando el Parque se estira. Los domingos de verano, Santa Maria del Popolo (de 16:30 a 18:00) va entre el Parque y el Pincio, así que la espera queda después y sigue saliendo como tiempo libre. Es uno de los casos del punto 7b.
- **El nombre de la estirable** usa el mismo sitio que el título de «Roma iluminada desde…»: en la tarjeta y en la ficha se ve como nombre de la parada.

## c) Preguntas y decisiones para ti

**Punto 7b: los dos casos que pediste**

1. **D4 con Free Tour, domingo de mayo** (barrido: viaje de 5 días desde el 14 de mayo de 2027, día 3 = domingo 16):
   - 09:00 Santa Maria della Vittoria → Tritón → Via Veneto → 11:00 Galería Borghese (2 h) → comida → 14:45 Piazza del Popolo → 15:45 Parque de Villa Borghese (90 min, estirado) → 17:30 Santa Maria del Popolo (el domingo abre a las 16:30).
   - **Hueco:** 94 min de tiempo libre.
   - Después, 19:45 Pincio al atardecer → Via Margutta → Via del Babuino → cena → Plaza de España iluminada.
   - Opciones:
     - (a) Aceptarlo con nombre: «Tiempo libre en Villa Borghese», pasando Santa Maria del Popolo a antes del Parque (ya está abierta a las 16:30).
     - (b) Llenarlo con el Ara Pacis por dentro o con compras en Via del Corso.
   - **Recomiendo (a).**
2. **D3 tranquilo, 14 de agosto (Ferragosto)** (barrido: viaje de 2 días con Free Tour desde el 14 de agosto de 2027, día 1):
   - 10:00 Free Tour (2 h 30) → comida → 15:00 Plaza de San Pedro → 15:30 Basílica (80 min) → 17:00 Borgo Pio.
   - **Hueco:** 163 min de tarde libre hasta la cena de las 20:00. Los Museos Vaticanos cierran el 14 y el 15, así que la tarde se queda vacía.
   - Opciones:
     - (a) Llenarla con lo de la zona: Castillo de Sant'Angelo por dentro, Puente y paseo por el río hacia Trastevere.
     - (b) Dejarla como «Tarde libre» con ideas.
   - **Recomiendo (a).**

**Otras**

3. **Textos para revisar:** `docs/TEXTOS_PARA_REVISAR.md`. Lo que cambies, lo aplico tal cual.
