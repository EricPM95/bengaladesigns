# Tanda 6y2: «Reorganizar» sin zigzag y los puntos de las zonas del alojamiento

Pruebas: `node scripts/destino/pruebaFase6y2_reorganizar.mjs` (782 comprobaciones, 0 fallos; enciende su propio servidor en el puerto 8797) y `node scripts/destino/pruebaFase6y_reorganizar.mjs [port=8799] [out=docs/dias/PRUEBA_REORGANIZAR_6Y.json]` (1.166 comprobaciones, 0 fallos). `pruebaTanda6g.mjs paso=30`: 170 viajes, 0 fallos. `tsc -p tsconfig.app.json` limpio. No hay push.

## Punto 1: Reorganizar sin zigzag

**Qué cambió** (un solo sitio: `shared/routeEngine/reorganizarDia.js`, función nueva `ordenarGrupos`). El orden de prioridad es ahora exactamente el que pediste:

1. Lo reservado, como antes: va primero en su parte, por la hora entre reservas (no se compara con la hora de lo que no tiene reserva).
2. Los momentos fuertes: lo de primera hora sin gente al principio, el paseo de Trastevere al final de la tarde, las nocturnas de noche.
3. Dentro de cada grupo, el orden de nuestro día escrito.
4. Los grupos que van juntos en un día escrito (su mañana y su tarde, sus partes) van en el orden del documento.
5. Entre los demás grupos manda la cercanía, sin volver atrás: se prueba el camino más corto entre todos los que se pueden poner (hasta 10 grupos se prueban todos; más, el más cercano disponible cada vez).
6. «Mañana o tarde» del documento solo desempata: si dos caminos miden lo mismo (1 m), gana el que tiene menos tardes delante de mañanas.

La comida ya no va «al final de la mañana» (la mañana y la tarde ahora pueden mezclarse): va en el límite entre grupos donde menos grupos de mañana quedan detrás y de tarde delante; si hay varios, el más cercano a la mitad del día. Nunca al principio ni al final.

Las decisiones de Eric siguen igual: lo reservado no se compara con las paradas sin reserva; Trastevere como el D7 si hay 3 o más paradas de su grupo y, si no, al final; el D3 con Free Tour no se usa si el viajero no lleva el Free Tour.

**La prueba de nuestros días escritos sigue dando el orden escrito**: D0 a D7 desordenados 20 veces sin reservas, 160 de 160; con reservas y las 8 combinaciones del D3, 200 de 200. No hubo que tocar nada a mano: como el punto 4 obliga a respetar el orden del documento entre grupos del mismo día, los días escritos salen solos.

**Zigzag, antes y después** (mismos 200 días mezclados, misma semilla, misma medida: dar la vuelta a un tramo acorta el camino un 15 % o más):

| Qué | Antes | Ahora |
|---|---|---|
| Zigzag en el día entero | 75 de 200 | **23 de 200** |
| Zigzag mirando la mañana y la tarde por separado | 29 | 27 (esta medida ya significa menos: la mañana y la tarde se pueden mezclar; se parte por donde cae la comida) |
| Nocturnas de día | 0 | 0 |
| Comida al principio / al final | 0 / 0 | 0 / 0 |
| Cenas mal puestas | 0 | 0 |
| Paseo de Trastevere antes de comer | 0 | 0 |
| Un sitio de la zona de Trastevere antes de comer | 28 | 24 (son sitios del D7 o de tarde-temprano, no el paseo) |
| Grupos partidos en dos | 0 | 0 |
| Días que ya estaban en buen orden | 3 | 5 |

**Por qué quedan los 23 zigzag** (la prueba ahora los separa):
- **14 son por un momento fuerte**: Trevi de primera hora tiene que abrir el día aunque esté al otro lado de lo demás, o el paseo de Trastevere tiene que cerrar la tarde aunque lo demás acabe lejos. Si se quita Trevi o el paseo del camino, el zigzag desaparece. Es lo que pide el punto 2 y gana a la cercanía.
- **9 son el orden de nuestro día escrito**: un grupo escrito cruza la ciudad en su orden (por ejemplo Altar de la Patria, Trinità dei Monti, Via Condotti), o dos grupos del mismo día escrito tienen que ir en su orden (mañana y luego tarde) aunque otro orden fuera más corto. Es lo que piden los puntos 3 y 4.
- Ninguno es «mañana antes que tarde» de días distintos: eso ya no manda.

**Una cosa que sí se queda como estaba**: cuando el día tiene una reserva de tarde, lo libre de la mañana va antes que ella y lo libre de la tarde después (si no, una entrada de las 16:00 podría quedar la primera del día). Con una reserva de mañana, ella va delante de todo. Esto solo ocurre con reservas (la prueba de los 200 días no las lleva).

### Cinco ejemplos, en palabras sencillas

1. Puso: Trinità dei Monti, Altar de la Patria, Jardín de los Naranjos, Pirámide Cestia, Fontana de Trevi, Panteón, Via Condotti, Plaza de San Pedro. Quedó: Trevi (primera hora sin gente) → Plaza de San Pedro → Panteón (mañana de «Roma en un día») → comida → Altar → Trinità → Via Condotti (su tarde) → Jardín de los Naranjos → Pirámide Cestia → cena.
2. Puso: Terraza del Pincio, Boca de la Verdad, Plaza Venecia, Mirador del Janículo, Plaza de San Pedro. Quedó: Terraza del Pincio → Plaza Venecia → Boca de la Verdad → comida → Mirador del Janículo → Plaza de San Pedro → cena. Antes empezaba por Plaza Venecia (porque su grupo es de mañana) y volvía al Pincio al final; ahora el Pincio va primero porque es lo que deja el camino más corto.
3. Puso: Cementerio Protestante, Via della Conciliazione, Monti, San Luigi dei Francesi, Santa Maria in Trastevere, Santa María la Mayor, Panteón. Quedó: Monti → Santa María la Mayor (juntas en un medio día de Monti) → comida → San Luigi → Panteón (juntas en el día de la Roma antigua) → Via della Conciliazione → Santa Maria in Trastevere (juntas en el día del Vaticano y Trastevere) → Cementerio Protestante → cena.
4. Puso: Via Veneto, Terraza del Pincio, Fontana de Trevi, Museos Vaticanos, Puente Sant'Angelo, Foro Romano. Quedó: Trevi sin gente → Foro Romano → Via Veneto y Terraza del Pincio (juntas) → Museos Vaticanos → comida → Puente Sant'Angelo → cena.
5. Puso: Plaza de San Pedro, Panteón, Fuente de las Tortugas, Trinità dei Monti, Via Appia Antica. Quedó: Plaza de San Pedro → Panteón (mañana de «Roma en un día») → comida → Trinità dei Monti → Fuente de las Tortugas → Via Appia Antica → cena. Cada una de las tres últimas es de un día distinto y manda la cercanía.

**«Crear mi propio día»** usa el mismo módulo: `pruebaTanda6g.mjs paso=30` sigue en 0 fallos y la prueba de Reorganizar comprueba que ordena igual.

## Punto 2: la zona del alojamiento

`zonas_alojamiento` vive en `data/pipeline_v2/roma.json` (`destination_config`). Cada zona lleva ahora `coordinates: { lat, lng }`, el centro de la zona. Los saqué de mi conocimiento de Roma (centros de plaza conocidos), sin consultar Mapbox; la prueba comprueba que cada punto queda dentro de Roma y a menos de 1,2 km (1,8 km Prati) del sitio de referencia de su nombre:

| Zona | Punto (lat, lng) | Referencia |
|---|---|---|
| centro (Panteón, Trevi, Navona) | 41.8990, 12.4755 | entre el Panteón y Piazza Navona |
| plaza_de_espana | 41.9060, 12.4823 | Plaza de España |
| prati | 41.9072, 12.4637 | Piazza Cola di Rienzo |
| trastevere | 41.8896, 12.4698 | Santa Maria in Trastevere (antes solo coincidía con el centro de la zona del destino) |
| termini | 41.9009, 12.5017 | Estación Termini |
| monti | 41.8954, 12.4931 | Piazza della Madonna dei Monti |
| nose | sin punto, a propósito | «Aún no lo sé» |

**El módulo lo usa**: función nueva `puntoZonaAlojamiento(destData, zoneId)` en `reorganizarDia.js` (lee `coordinates` en forma `{lat,lng}` o `[lat,lng]`, o el centro de la zona del destino con el mismo id; `nose` o una zona desconocida dan `null`). El servidor (`/api/reorganizar-dia`) la llama en lugar de su lectura anterior, que esperaba un array y por eso nunca encontraba nada. Cuando el viajero tiene zona (versión de pago) y no hay nada de primera hora ni reservado, el día empieza por el grupo más cerca de esa zona (el camino se mide desde el alojamiento). Si hay Trevi de primera hora o una reserva, mandan ellos. Comprobado de punta a punta con el servidor: Prati empieza por la Plaza de San Pedro; Monti y Termini, por la Boca de la Verdad.

**Lo que más lee esas zonas sigue igual**: el servidor las sigue entregando al cliente (`zonas_alojamiento` en `/api/destination-excursions`, con id, nombre y sub; el campo nuevo no molesta al tipo de TypeScript ni a la hoja de zonas de RESERVAS) y `tsc` y las pruebas siguen limpios. No he corrido las pruebas 6s/6t/6v/6z6a que miran la zona, solo comprobado que el servidor la entrega.

## Preguntas abiertas

1. **Reservas y mezcla**: con una reserva de tarde, la mañana libre va antes y la tarde libre después (no se mezclan). ¿Prefieres que, incluso con reserva, mande la cercanía entre lo libre? Se cambia en `ordenarGrupos` (las líneas de `exige`).
2. **La comida** va ahora donde menos mezcla de mañana/tarde hay; en días de un solo tipo, a la mitad. Si las mañanas y tardes se cruzan mucho, la comida puede quedar entre dos grupos «de tarde». Si quieres otra regla (por ejemplo, a las 13:30 por tiempo), hay que decirlo.
3. **Los puntos de las zonas** son míos, no de Mapbox; si alguna zona te parece mal situada, se cambia el número en `roma.json`.
4. **Puerto 8799**: mientras se hizo esto, otro agente tenía un servidor en el 8799 y `pruebaFase6y_reorganizar.mjs` habría hablado con él por error. La prueba acepta ahora `port=NNNN` (por defecto, el 8799 de siempre). Corrí la mía con `port=8796`.
5. **Lo que no pude ver**: nada en pantalla (no hay cambio visual); el botón se pinta igual.
