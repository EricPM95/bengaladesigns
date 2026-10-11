# Tanda 6y, parte B: el botón «Reorganizar este día»

Prueba: `node scripts/destino/pruebaFase6y_reorganizar.mjs out=docs/dias/PRUEBA_REORGANIZAR_6Y.json` (0 fallos, 1.166 comprobaciones; enciende ella sola un servidor en el puerto 8799). No hay push. Lo visual a 375 px lo tienes que mirar tú.

## Lo hecho, en palabras sencillas

- **Un solo sitio para la regla**: `shared/routeEngine/reorganizarDia.js`. Recibe las paradas del día (y si ya tiene comida y cena), lee nuestros días escritos (`listas.json`, que sale del convertidor) y devuelve **los mismos ids en otro orden** y dónde van la comida y la cena. No hay ningún nombre de sitio escrito dentro: si cambia el documento, cambian los grupos.
- **Cómo ordena** (los pasos del encargo):
  1. Los grupos son cada mañana y cada tarde de cada día escrito. Cada parada va al día escrito que cubre más paradas del viajero (se elige repartiendo: el que cubre más, luego el que cubre más de lo que queda; a igual, el día más corto) y dentro de él a su mañana o su tarde. Lo que no está en ningún día va junto al grupo más cercano andando, donde menos alarga el camino.
  2. Dentro del grupo, el orden del documento.
  3. Lo reservado (Coliseo, Museos, Galería, Free Tour) elige su fila de la tabla por la hora, con las mismas variantes del documento que usa el motor (`cuando.reserva`). Esa fila ordena su grupo; una reserva de mañana va en la mañana y una de tarde en la tarde. «Llegada a…» solo sale si el día ya la tenía, pegada delante de su reserva.
  4. Los grupos entre sí: primero lo de primera hora sin gente (Trevi, lo marca el documento), luego la mañana, luego la tarde, luego el paseo de antes de cenar (Trastevere, lo marca el documento) y las nocturnas al final. Dentro de la mañana y de la tarde, lo reservado primero y el resto por cercanía sin volver atrás (se prueban todos los órdenes; la mañana y la tarde se miran juntas, hasta el paseo de Trastevere).
  5. La comida, entre la mañana y la tarde; la cena, al final antes de las nocturnas. Solo si el día ya las tiene. Con todo el día en una sola parte, la comida va a la mitad, en el límite de grupo más cercano.
  6. Con la zona del alojamiento y sin nada de primera hora ni reservado, el día empieza por el grupo más cercano a ella (el módulo lo hace; ver pregunta 4).
- **El botón**: `ReorganizarDia.tsx` (en `DayDetailPanel.tsx` solo hay una línea y el import). Sale con 2 paradas o más, en la ruta a mano y en los días nuestros que el viajero ha cambiado a mano. Pide el orden al servidor (`POST /api/reorganizar-dia`), lo aplica con `withUndo('Día reorganizado')` o dice «Tu día ya está en buen orden».
- **La acción del almacén** `reorganizeDay`: no va en la lista de «cambio a mano», así que no marca nada: un día cambiado a mano sigue siéndolo y uno que no lo era no pasa a serlo. Las paradas con reserva se quedan en su hora y nada se «empuja».
- **«Crear mi propio día»** (6g) usa ahora este mismo orden: `diaPropio.js` llama a `reorganizarDia` (se quitó su camino más corto propio y el reparto por 4 horas). Lo único que cambia: la mañana y la tarde del día propio las marca la comida de este orden (antes eran 4 horas de visitas).

## Lo que ajusté de lo existente

- `diaPropio.js` recibe ahora `written` (los días escritos) y `server/engine/index.js` se lo pasa. La prueba de la 6g (`pruebaTanda6g.mjs paso=30`, 170 viajes) sigue en 0 fallos.
- `tsc -p tsconfig.app.json` limpio.

## La prueba

**A. Nuestros días escritos.** D0 a D7, 20 mezclas cada uno, sin reservas: 160 de 160 salen en su orden escrito. Con reservas (Coliseo a 6 horas, Museos a 7, Galería a 4, y el D3 con Free Tour y Museos a 8 combinaciones; 25 filas, 8 mezclas cada una): 200 de 200 salen en la fila que escribe el documento.

**B. 200 días mezclados** (4 a 8 paradas de grupos distintos, semilla fija; el 20 % lleva una nocturna):

| Qué | Resultado |
|---|---|
| Mismas paradas (ni una más ni una menos), ninguna «Llegada a…» inventada | 200 de 200 |
| Nocturnas de día | 0 |
| Comida al principio o al final del día | 0 y 0 |
| Cena mal puesta (no es lo último antes de las nocturnas) | 0 |
| Trastevere (el paseo) antes de la comida | 0 |
| Un sitio de la zona de Trastevere antes de la comida | 28 (ver abajo) |
| Grupos partidos en dos | 0 |
| Días que ya estaban en buen orden | 3 |
| Zigzag (un tramo dado la vuelta acorta el camino 15 % o más) | 75 de 200; 29 si se miran la mañana y la tarde por separado |

**Por qué hay zigzag (no lo he arreglado a mano):** casi todo es consecuencia de poner la mañana antes que la tarde, que sale del documento. Ejemplo: Ojo de la Cerradura (Aventino, mañana) → Cementerio Protestante (Testaccio, tarde) → Plaza de España → Via Condotti. Si fuera solo por cercanía, el Cementerio iría primero, pero entonces una parada de tarde iría antes que una de mañana. Dentro de lo libre el orden es el más corto que hay. Si quieres menos zigzag, hay que decidir que la cercanía pese más que mañana/tarde (pregunta 1).

**Los 28 «sitios de la zona de Trastevere antes de la comida»:** son el Janículo, Isla Tiberina, Santa Maria in Trastevere, Villa Farnesina, etc., que el documento pone de mañana (D7) o de tarde-temprano. No es el paseo de Trastevere. Es lo que escribe el documento.

### Cinco ejemplos, en palabras sencillas

1. Puso: Trinità dei Monti, Altar de la Patria, Jardín de los Naranjos, Pirámide Cestia, Fontana de Trevi, Panteón, Via Condotti, Plaza de San Pedro. Quedó: Trevi (primera hora sin gente) → Plaza de San Pedro → Panteón (la mañana de «Roma en un día») → comida → Altar → Trinità → Via Condotti (su tarde) → Jardín de los Naranjos → Pirámide Cestia → cena.
2. Puso: Terraza del Pincio, Boca de la Verdad, Plaza Venecia, Mirador del Janículo, Plaza de San Pedro. Quedó: Plaza Venecia → Boca de la Verdad (mañana del «Día entero») → comida → Mirador del Janículo → Plaza de San Pedro → Terraza del Pincio → cena. Cada una de las tres últimas es de un día distinto; las ordena la cercanía.
3. Puso: Cementerio Protestante, Via della Conciliazione, Monti, San Luigi dei Francesi, Santa Maria in Trastevere, Santa María la Mayor, Panteón. Quedó: Monti → Santa María la Mayor (juntas en un medio día de Monti) → comida → San Luigi → Panteón (el D1 las pone juntas) → Via della Conciliazione → Santa Maria in Trastevere (juntas en el D2) → Cementerio Protestante → cena.
4. Puso: Plaza de San Pedro, Terraza del Pincio, Via dei Fori Imperiali, Jardín de los Naranjos. Quedó: Plaza de San Pedro → Jardín de los Naranjos (mañanas) → comida → Via dei Fori Imperiali → Terraza del Pincio (tardes) → cena.
5. Puso: Via Veneto, Terraza del Pincio, Fontana de Trevi, Museos Vaticanos, Puente Sant'Angelo, Foro Romano. Quedó: Trevi sin gente → Foro Romano → Via Veneto y Terraza del Pincio (juntas en el D4) → Museos Vaticanos → comida → Puente Sant'Angelo (la tarde del D2) → cena.

**C. El botón y el almacén (con el código de la app y el servidor real):** en la ruta a mano, en un día nuestro cambiado a mano y en uno sin tocar (por código): no quita nada, no toca el otro día, no toca «Si te sobra tiempo», sale «Día reorganizado» con Deshacer, Deshacer deja la ruta idéntica, una segunda pulsación dice «Tu día ya está en buen orden» y no cambia nada (misma referencia del estado), el día sigue o no sigue siendo «cambiado a mano» tal como estaba, y la comida y la cena quedan en su sitio. Con una reserva a las 9:00 en los Museos: queda a su hora, «Llegada a…» va justo delante y tras Trevi; sin reserva no sale ninguna «Llegada a…». «Crear mi propio día» ordena igual que «Reorganizar».

## Lo que no pude hacer o comprobar

- El navegador: el botón (11 de alto, a ancho completo, bajo «Añadir lugares») y su sitio a 375 px, gratis y de pago, lo tienes que mirar tú. Solo está comprobado que se pinta o no según el día.
- En nuestra ruta el botón sale **solo en días que ya cuentan como cambiados a mano** (`originalSnapshot`) y en los días libres/añadidos. En un día que no se ha tocado no sale (ya está en el orden del motor).
- `DayDetailPanel.tsx`: la línea `<ReorganizarDia day={day} />` está justo después del bloque «Añadir lugares» del día libre. Si A o C reescriben esa zona, habrá un choque pequeño al juntar ramas.
- Las otras pruebas pesadas (365 días) no se han corrido; solo la 6g con `paso=30`.

## Decisiones mías que conviene que mires (preguntas abiertas)

1. **Mañana antes que tarde manda sobre la cercanía.** Lo saqué de que el documento tiene mañana y tarde y de «una reserva de mañana va en la mañana». Causa casi todo el zigzag (75 de 200). Si prefieres cercanía pura, se cambia en un sitio.
2. **Lo reservado va primero en su parte** (mañana o tarde), por orden de hora entre reservas. No comparo la hora de una reserva con las paradas sin reserva.
3. **El paseo de Trastevere**: el documento lo marca con «Paseo por Trastevere» (D1-corto, D2, D1-FT) y va al final de la tarde. En el D7 el documento pone «Trastevere» de mañana. Regla mía: se queda como el D7 si el viajero tiene 3 o más paradas de ese grupo; con menos, va al final. Si lo quieres siempre al final, el D7 escrito dejaría de salir tal cual.
4. **La zona del alojamiento**: el módulo ya empieza por el grupo más cercano, pero hoy `zonas_alojamiento` no tiene coordenadas en los datos (solo `trastevere` coincide con una zona del destino). El servidor busca `coordinates` de la zona, o el centro de la zona del destino con el mismo id; para `centro`, `prati`, `monti`, `termini` hace falta añadir un punto a los datos.
5. **Tour en días sin Free Tour**: un día escrito que lleva el Free Tour (el D3) no se usa para repartir si el viajero no tiene el Free Tour. Mía.
6. **Nombres de los grupos**: salen medios días («Medio día del Aventino y Testaccio») como grupos. Está bien para ordenar, pero si algún día se enseña el motivo al viajero habría que ponerles nombre de verdad.
7. **«Crear mi propio día»**: la mañana y la tarde ya no se parten por 4 horas sino por la comida de este orden. Con un solo sitio, todo es mañana como antes.
