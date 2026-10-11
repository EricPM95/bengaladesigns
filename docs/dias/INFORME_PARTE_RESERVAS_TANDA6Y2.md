# Tanda 6y2, parte RESERVAS (ruta a mano)

Cubre los puntos (a) a (e) del encargo: Free Tour a mano, «día completo» a mano, la reserva fuera de su día, restaurantes en «Añadir parada» y qué es «imprescindible».

## Lo hecho (en palabras sencillas)

### (a) El Free Tour en la ruta a mano
- Se añade **como cualquier reserva**: desde RESERVAS («Entradas y Free Tour») con «¿Ya la tienes? Añádela», y desde EXPLORAR (filtro «Entradas», el «+» de la tarjeta del Free Tour). Los dos abren la misma hoja de «Entrada · elige día y hora» (`AddReservationSheet`), con las horas de siempre (10:00, 12:00, 15:00, 17:00, 21:00). Ya no abren la hoja del motor («¿A qué hora lo quieres?»), que rehacía los días y en la ruta a mano no tiene nada que rehacer.
- Al guardar, la parada del Free Tour **va al día de su fecha**, al final, como una parada más, con su hora y la marca de reserva. No toca ninguna otra parada ni ningún otro día. No llama al motor.
- Si el viajero cambia la fecha de la reserva, **la misma parada** pasa al día nuevo (no se duplica).
- **Sin precio**: la hoja no pide precio al Free Tour y el presupuesto no lo suma.
- La parada lleva punto de encuentro, lo que recorre y sus consejos (igual que la del motor). Para eso el servidor manda ahora `meeting_point`, `covers` y `tip` en la entrada del Free Tour (`/api/destination-places`, cambio pequeño en `server/index.js`).
- Dónde está: `src/lib/freeTourManual.ts` (nuevo), `addReservation` en el almacén (tercer dato opcional con la entrada del Free Tour), `FreeTourSheet.tsx` (en la ruta a mano abre la reserva), `freeTourAvailable` (en la ruta a mano, true), `EntradasYFreeTour.tsx` («Añádela» solo en el Free Tour de la ruta a mano) y `buildEntradasBloque` (reconoce el Free Tour por su nombre en la ruta a mano aunque todavía no esté en un día).
- La ruta nuestra no cambia (la prueba lo comprueba).
- Al **quitar** la reserva del Free Tour, la parada se queda en el día (sin hora fija), como cualquier otra reserva; se quita con el menú de la parada. Ver preguntas.

### (b) «Hoy es un día completo» a mano
- En la ruta a mano cuenta **solo lo que el día tiene de verdad**: la comida y la cena solo suman si el día las tiene. Un día a mano sin comida ni cena ya no suma esa hora y cuarto que nunca puso el viajero. En la ruta nuestra, igual que siempre (`src/lib/diaCompleto.ts`).

### (c) Una reserva cuyo sitio no está en el día de su fecha
- **Avisa, sin mover nada solo.** Dos casos:
  - el sitio está en otro día: «Tu entrada al Coliseo es el jue 11, pero en tu ruta el Coliseo está el mié 10.» con [Pasarlo al jue 11];
  - no está en ningún día: «Tu entrada al Coliseo es el jue 11 y el Coliseo no está en tu ruta.» con [Añadirlo al jue 11].
  Con el Free Tour: «Tu Free Tour es …». Sin fechas en el viaje: «el día 2», «[Pasarlo al día 2]».
- Sale **en la campana** (`useAppNotices.ts`, un aviso por reserva, `fuera-de-dia:<id de la reserva>:<caso>`) y **en la tarjeta de la reserva** en RESERVAS (bajo su línea verde). Se va solo cuando se arregla.
- Los botones hacen lo que dicen: «Pasarlo» mueve la parada al final del día de la reserva y le pone su hora y su marca; «Añadirlo» mete el sitio (o el Free Tour) en ese día, con su hora y su marca. Los dos dejan el aviso corto con **Deshacer**.
- Mientras no se pulsa, no se mueve nada (la prueba lo comprueba). No avisa si la reserva cae fuera del viaje, en el día de vuelta o en un día de excursión (no hay a dónde pasarlo).
- Código nuevo: `src/lib/reservaFueraDeDia.ts`; la campana admite ahora un botón que hace algo (`run`) además de los que abren pantallas.
- **Solo en la ruta a mano.** En la nuestra no lo he puesto: el motor ya pone cada entrada en su día, y los pocos casos en que no puede (día de excursión, día que el viajero cambió) ya tienen su aviso propio («Tu reserva está guardada…»). Un botón de «Pasarlo» ahí chocaría con esas razones. El texto sí se podría reutilizar en la nuestra; dime si lo quieres.

### (d) Restaurantes en «Añadir parada»
- En el modo de elegir varios (el de la ruta a mano y el de «Crear mi propio día») la lista ya **no trae restaurantes** ni el filtro «Restaurantes». Tampoco trae baños, fuentes ni la tarjeta del Free Tour (tampoco se pueden marcar; el Free Tour es una reserva). EXPLORAR normal sigue con todo, sin cambios (`PlaceExplorerScreen.tsx`).

### (e) ¿`pool_lista` es la lista de imprescindibles de EXPLORAR?
**NO.**
- EXPLORAR **no tiene** una lista de «imprescindibles». Su orden «Recomendados» es: más «me gusta» → **nivel** del lugar (`level`, 1 = lo imprescindible) → orden editorial → alfabético (`PlaceExplorerScreen.tsx`, el comentario del propio código dice que el nivel es «lo imprescindible primero»). La etiqueta «Recomendado» de EXPLORAR es otra cosa: solo se pone a los restaurantes de la zona de la comida que se está cambiando.
- `pool_lista` (`data/pipeline_v2/roma.json`) es otra lista: la que se enseña en el formulario («Elige lo que siempre soñaste ver en Roma»), a mano y con 20 lugares (decisión del 27-sep).
- Evidencia con los datos de Roma: el nivel 1 son 11 lugares (Coliseo, Foro Romano y Palatino, Arco de Constantino, Fontana de Trevi, Panteón, Piazza Navona, Plaza de España, Museos Vaticanos, Basílica de San Pedro, **Plaza de San Pedro**, Altar de la Patria). `pool_lista` tiene 20: comparten 10; la **Plaza de San Pedro** es nivel 1 y no está en `pool_lista`; y 10 de `pool_lista` no son nivel 1 (Cúpula de San Pedro, Trastevere, Galería Borghese, Castillo de Sant'Angelo, Boca de la Verdad, Parque de Villa Borghese, Ojo de la Cerradura del Aventino, Museos Capitolinos, Termas de Caracalla, Basílica de San Juan de Letrán). Ningún lugar lleva la etiqueta `imprescindible`.
- No he cambiado nada: el orden de la ruta a mano (6y) sigue usando `pool_lista` (`essential_rank`) y, detrás, el nivel 1. La diferencia queda a la vista: en la ruta a mano, Trastevere o la Boca de la Verdad salen antes que la Plaza de San Pedro; en EXPLORAR de la ruta nuestra, al revés. Ver preguntas.

## Pruebas
- Nueva: `scripts/destino/pruebaFase6y2_reservas.mjs` (con `_6y2_reservas_entrada.tsx`): **128 comprobaciones, 0 fallos**. Cubre: Free Tour a mano (con y sin fechas) al día de su fecha, con su hora, sin precio, sin tocar nada más, cambiando de fecha, sin motor; ruta nuestra sin cambios; «día completo» a mano (700, 760, 775 y 835 min) y en la nuestra; el aviso de la reserva fuera de su día (los dos textos, el del Free Tour, el botón de cada uno, la campana, la tarjeta de RESERVAS, con y sin fechas, sin mover nada solo, el botón, Deshacer y que se va al arreglarse); 0 restaurantes en la lista de «Añadir parada» (con cada filtro) y EXPLORAR normal con ellos.
- `npx tsc --noEmit -p tsconfig.app.json`: limpio.
- Existentes, contra mi servidor (puerto 8841, código nuevo): 6y manual (1694) 0 fallos; 6z5 (119) 0; 6z6 (las cuatro partes) 0; Corr6z6 (las tres partes) 0; 6z6f (22) 0; 6s (2511) 0; 6u (1884 viajes) 0; 6v (82) 0.
- **Ajustes a pruebas existentes (solo por mi trabajo):**
  - `pruebaFase6y_formulario.mjs`: antes comprobaba que en la ruta a mano **no** se ofrecía el Free Tour y que salía la hoja del motor («¿A qué hora lo quieres?»). Ahora comprueba lo contrario (se ofrece; la hoja del motor no sale). Es justo lo que se pidió cambiar.
  - `pruebaTanda6v.mjs`: la regla «las de “Ver n más” no llevan “Añádela”» ahora admite la única excepción, el Free Tour de la ruta a mano.

## No pude hacer / no verifiqué
- **Visual a 375 px**: sin navegador. Falta mirar: la tarjeta del aviso bajo la línea verde en RESERVAS, el botón en la campana, la tarjeta «Free Tour por Roma» con «Añádela» en «Ver más», y la hoja de la hora del Free Tour desde EXPLORAR.
- La hoja de reserva y los botones de la pantalla son de navegador (usan efectos): la prueba los comprueba por la lógica que llaman y por el cableado en el código, no pintándolos con un clic real.
- La foto de la parada del Free Tour añadida a mano es la de relleno (como otras paradas a mano sin foto cargada); no he pedido la real (Piazza Navona) en ese momento.

## Preguntas abiertas
1. **Quitar la reserva del Free Tour** en la ruta a mano deja la parada en el día (sin hora fija). ¿Debe quitarse la parada también? Hoy se quita con el menú de la parada, como cualquier otra (la app no borra nada sola).
2. **Aviso en la ruta nuestra**: ¿lo quieres también ahí (con las excepciones de día de excursión)? Hoy no.
3. **Imprescindibles** (la diferencia de arriba): ¿la ruta a mano debe ordenar por `pool_lista` (como ahora) o por el nivel 1 que usa EXPLORAR? Con `pool_lista` sale antes la Cúpula, Trastevere, la Galería Borghese…; con el nivel 1 sale antes la Plaza de San Pedro y no sale Trastevere.
4. Los botones dicen «Pasarlo» / «Añadirlo» también con sitios femeninos («la Galería Borghese»), tal como pediste (el «lo» es «el sitio»). ¿Está bien?
5. Mi servidor de pruebas: `SERVER_PORT=8841 node server/index.js`. Hay que reiniciar el api-server del repo principal para que `meeting_point`, `covers` y `tip` del Free Tour lleguen; sin reiniciar, la parada del Free Tour a mano sale sin punto de encuentro (pero sale).
