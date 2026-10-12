# Tanda 6y7, parte de los títulos de los días (punto 6)

Cada día tiene ahora su propio título, según lo que se ve ese día, también el de llegada y el de vuelta. El «Madrid → Roma» (o «Roma → Madrid» en la vuelta) va pequeño, detrás de la marca «Día de viaje».

## La regla del título (una sola función: `src/lib/tituloDelDia.ts`)

1. Si el viajero le puso nombre al día, manda el suyo. Un día que añadió él con «+ Añadir día» se llama como lo escribió.
2. Un día de excursión de día entero se llama «Excursión desde Roma». Sus paradas no se cuentan.
3. Se cuenta cuántas paradas hay de cada grupo. Cuentan los sitios, los paseos por barrio, los paseos libres («Pasea y piérdete por…») y las nocturnas. No cuentan la comida y la cena, las pausas, los «pasas por…», el tiempo libre ni la «llegada a…».
4. El título junta como mucho dos nombres con «y»:
   - Si el día tiene Free Tour, va primero, y solo se le suma el grupo con más paradas: «Free Tour y Vaticano».
   - Si no, va primero el grupo con más paradas. Un segundo grupo solo se suma si tiene al menos 2 paradas, o si el día entero tiene solo 2 paradas. Una parada suelta de otro grupo no cambia el título.
   - Una excursión de medio día en la mañana cuenta como el Free Tour (va primero): «Excursión desde Roma y Centro histórico». Si hubiera las dos cosas, solo esos dos nombres: «Free Tour y Excursión desde Roma».
5. Empates: gana el grupo que aparece antes en el día (por hora; sin horas, por orden).
6. Un día sin paradas se llama «Día libre» (también en la ruta a mano, y también el de llegada o el de vuelta si no tienen paradas, con su trayecto pequeño). Si tiene paradas pero ninguna es de nuestros datos (un sitio que el viajero buscó en el mapa), queda el nombre de siempre.
7. Un destino sin `grupos_dia` en sus datos (cualquier destino que no sea Roma) se queda como estaba: nada cambia.

Los nombres salen del dato (`grupos_dia` en `roma.json`), no del código. El título se calcula al enseñarlo y no se guarda en el viaje (salvo el nombre propio que ya existía). No se ha tocado el motor ni el reparto de paradas.

Mientras llegan los datos del destino (una petición que la app ya hacía, ahora con los grupos dentro) el título va vacío un instante, para que no salte de un nombre a otro. Si la petición falla, queda el nombre de siempre.

## La tabla completa parada → grupo (para que Eric la revise)

Cada sitio de `data/pipeline_v2/roma.json` lleva ahora `grupo_dia` (también las 10 nocturnas, los 11 paseos por barrio y los 9 paseos libres). Lo ha puesto `scripts/destino/asignarGruposDia6y7.mjs` (se puede repetir y no toca nada más del fichero: solo añade líneas). Los nombres usados son solo los 11 de Eric.

| Grupo | Paradas |
|---|---|
| Centro histórico | Fontana de Trevi, Panteón, Piazza Navona, Largo di Torre Argentina, Via del Corso, Campo de' Fiori, Iglesia del Gesù, Iglesia de San Luigi dei Francesi, Ara Pacis (*), Barrio Judío, Iglesia de Santa Maria sopra Minerva, Iglesia de San Ignacio de Loyola, Elefantino de Bernini, Fuente de las Tortugas, Fuente del Tritón, Plaza Colonna, Piazza Colonna, Plaza del Quirinal, Via dei Coronari, Templo de Adriano, Plaza Farnese, Ponte Sisto (*), Palazzo Doria Pamphilj, Cripta de los Capuchinos, Via Veneto, Mercadillo de Navidad de Piazza Navona; nocturnas Fontana de Trevi, Panteón y Piazza Navona; Pasear por el Centro Histórico; paseos libres de Trevi y Via del Corso y del Centro Histórico |
| Roma antigua | Coliseo, Foro Romano y Palatino, Arco de Constantino, Circo Máximo, Altar de la Patria, Via dei Fori Imperiali, Plaza Venecia, Mercados de Trajano, Plaza del Campidoglio, Museos Capitolinos, Basílica de San Clemente, Iglesia de San Pietro in Vincoli, Domus Aurea, Columna de Trajano, Teatro de Marcelo, Monti, Terraza de Largo Gaetana Agnesi, Colle Oppio, Santo Bambino de Aracoeli, Termas de Caracalla (*), Via Appia Antica (*), Catacumbas de San Calixto (*); nocturnas Coliseo y Foro Romano desde el Campidoglio; Pasear por la Roma Antigua y por la Via Appia Antica; paseos libres de Monti y del Coliseo y el Celio |
| Trastevere | Isla Tiberina, Iglesia de Santa Maria in Trastevere, Villa Farnesina, Plaza Trilussa, San Pietro in Montorio y Tempietto de Bramante (*), Basílica de Santa Cecilia in Trastevere, Trastevere; nocturna Trastevere de noche; Pasear por Trastevere; paseo libre de Trastevere |
| Plaza de España | Plaza de España, Via Condotti, Trinità dei Monti, Via del Babuino, Via Margutta, Luces de Navidad del Tridente; nocturna Plaza de España; paseo libre del Tridente |
| Vaticano | Museos Vaticanos y Capilla Sixtina, Basílica de San Pedro, Plaza de San Pedro, Via della Conciliazione, Lungotevere, Castillo de Sant'Angelo, Puente Sant'Angelo, Borgo Pio, Cúpula de San Pedro (*), 100 Presepi in Vaticano; nocturna El Puente y el Castillo de Sant'Angelo; Pasear por Prati y el Borgo; paseos libres del Borgo y Prati y del Borgo |
| Villa Borghese | Galería Borghese, Parque de Villa Borghese, Bioparque de Roma, Galería Nacional de Arte Moderno, Porta Pinciana, Quartiere Coppedè (*); Pasear por Villa Borghese; Pasear por el Nomentano (*) |
| Popolo | Piazza del Popolo, Santa Maria del Popolo, Via di Ripetta |
| Basílicas y el Aventino | Basílica de Santa María la Mayor, Basílica de San Juan de Letrán, Iglesia de Santa Maria della Vittoria (*), Boca de la Verdad, Jardín de los Naranjos, Ojo de la Cerradura del Aventino, Pirámide Cestia (*), Mercado de Testaccio (*), Cementerio Protestante (*), Testaccio (*); Pasear por el Aventino, por Testaccio, por San Giovanni y por el Esquilino; paseo libre de Testaccio |
| Roma desde las alturas | Mirador del Janículo, Mirador de San Pietro in Montorio, Fontana dell'Acqua Paola, Terraza del Pincio, Jardines del Pincio; nocturnas Mirador del Janículo y Terraza del Pincio |
| Free Tour | el Free Tour de las reservas (la parada marcada como Free Tour) |
| Excursión desde Roma | el día entero de una excursión |

Los 11 nombres de Eric salen todos. «Santa Sabina», que Eric nombró como ejemplo, no es una parada de nuestros datos (no está en `roma.json`), así que no tiene fila.

### Las que no encajan del todo o son dudosas (marcadas con (*)) y qué propongo

Ninguna se queda sin grupo. Estas las he puesto donde menos chirría, y Eric puede cambiarlas con solo editar `POR_SITIO` en el script y volver a pasarlo:

- Ara Pacis, Ponte Sisto: por su zona de los datos van en «Centro histórico». Podrían ir en «Popolo» (Ara Pacis) y «Trastevere» (Ponte Sisto, une con Trastevere).
- Termas de Caracalla, Via Appia Antica, Catacumbas de San Calixto: no hay un grupo de «Roma antigua» al sur. Van en «Roma antigua» (son ruinas y vía romana). Las Termas, en los datos, están en la zona del Aventino: podrían ir en «Basílicas y el Aventino».
- San Pietro in Montorio y Tempietto: la iglesia en «Trastevere» (su zona), los dos miradores de al lado en «Roma desde las alturas».
- Cúpula de San Pedro: «Vaticano» (es parte de la visita) y no «Roma desde las alturas».
- Quartiere Coppedè y Pasear por el Nomentano: no hay grupo en esa zona. Propongo «Villa Borghese» (es lo más cercano de la lista).
- Pirámide Cestia, Mercado de Testaccio, Cementerio Protestante, Testaccio y los paseos por Testaccio: no hay grupo de Testaccio. Propongo «Basílicas y el Aventino» (es el barrio de al lado).
- Iglesia de Santa Maria della Vittoria: en los datos está en «Roma antigua» pero queda junto a Termini. Propongo «Basílicas y el Aventino» (es una iglesia, como las del Esquilino).

## Dónde se pintaba el nombre del día y cómo se unificó

Todo llama ahora a `src/lib/tituloDelDia.ts` (`nombreDelDia` con título y trayecto; `useNombreDeDias` para componentes; `tituloSimpleDelDia` para hojas y textos):

| Sitio | Antes | Ahora |
|---|---|---|
| Cabecera de cada día en DÍAS (`DayList.tsx`) | título curado, ciudad o «Madrid → Roma» en grande | el título nuevo; el trayecto pequeño junto a «Día de viaje» |
| HOY durante el viaje (`HoyDurante.tsx`) | no decía el nombre del día | el mismo título arriba, con el trayecto pequeño si es día de viaje (solo se ha tocado el título) |
| «Cambiar el nombre» / «Eliminar día» (`DayList.tsx`) | `dayName(day)` | el nombre propio (vacío si lo calcula la app) y el título nuevo |
| «Añadir a un día» y avisos al añadir (`AddToDaySheet.tsx`, `AddToTripScreen.tsx`) | `curatedTitle ?? title ?? city` | `dayName(route, day)` = el título nuevo |
| «Mover a otro día» y «Pasarla a otro día» de HOY (`ListaDeDias.tsx`, `StopMenu.tsx`) | la ciudad / `day.title` | el título nuevo |
| «¿Dónde añadimos…?» (`DayPositionPicker.tsx`) | la ciudad | el título nuevo |
| PDF (`exportPdf.ts`) | `day.title` | el título nuevo |

La hoja de reorganizar, el mapa, los avisos y RESERVAS solo usaban la fecha o «el día n» (no el nombre del día), así que no han cambiado. Si el viajero le puso nombre propio a un día, manda el suyo en todos los sitios.

## Pruebas

- Nueva: `scripts/destino/pruebaFase6y7_titulos.mjs` (+ `_6y7_titulos_entrada.tsx`), 3642 comprobaciones, 0 fallos:
  1. todos los sitios (95), las 10 nocturnas, los 11 paseos por barrio y los 9 paseos libres tienen `grupo_dia` de la lista, y los ejemplos de Eric caen donde él dijo;
  2. la función con casos: Free Tour primero, como mucho dos nombres, parada suelta, empate (en los dos órdenes), excursión (día entero y medio día), «Día libre», pausas y «pasas por…» que no cuentan, nombre propio, destino sin grupos;
  3. 228 viajes hechos con el motor (de 1 a 6 días, con y sin Free Tour, en 16 fechas repartidas por el año más Navidad, Fin de Año y sin fechas): 798 días, todos con un título de la lista, 95 días con Free Tour (todos con «Free Tour» primero), llegada y vuelta con su título y su trayecto pequeño («Barcelona → Roma» / «Roma → Barcelona»), ninguna parada de los viajes se queda sin grupo;
  4. 23 pantallas pintadas con el código de verdad: DÍAS (gratis y de pago, con y sin fechas) y HOY (cada día, en su fecha) pintan el mismo título, sin horas ni flechas; la ruta a mano («Día libre», por paradas, nombre propio).
- Pruebas antiguas que miraban el título viejo y he ajustado lo mínimo (todas siguen a 0 fallos):
  - `pruebaFase6y2_formulario.mjs` (sección «Ponle nombre»: ahora un día vacío dice «Día libre» y el trayecto sale pequeño; añadida la carga de los datos del destino), `pruebaFase6y_manual.mjs` y `pruebaFase6y_formulario.mjs` (mismo cambio: «Día libre» y «· Madrid → Roma» en vez de «Ponle nombre» y «Madrid → Roma» en grande);
  - `pruebaFase6y4_presupuesto.mjs` (la cabecera del día lleva ahora el título nuevo) y `pruebaTanda6z5.mjs` (la hoja «Pasarla a otro día» lista «jue 11 — {título}» en vez de «— Roma»).
- A 0 fallos con mis cambios: pruebaFase6y_reorganizar, 6y2 (formulario, reorganizar, reservas, fotos), 6y3 (formulario, reservas, fotos), 6y4 (ficha, formulario, iconos, listas, perfil, presupuesto, reservas), 6y5_pantallas, 6y6_cierre, pruebaTanda6z3 (HOY), Corr6z6 (las cuatro), Tanda6z6 a-d, 6z, 6z2, 6z5, 6s, 6u, 6v, 6g.
- Fallan igual SIN mis cambios (comprobado en una copia limpia de la rama base, no son de esta parte): `pruebaFase6y5_historias` («solo 0 de 31 historias son idénticas…»: historias v4, es del agente B), `pruebaFranjas6x` y `pruebaDiasFecha6z3` («ya no sale la hora de lo reservado (16:40)»: la prueba reserva la Fontana de Trevi, que desde la 6y6 no vende entrada; y una frase de `reservaFueraDeDia.ts`).
- Typecheck: `npx tsc --noEmit -p tsconfig.app.json` sin errores.

## Lo que se ve a 375 px (Chrome del equipo, contexto móvil 375x812, viaje real creado por el formulario: Madrid → Roma, 15 a 17 de octubre, solo)

- DÍAS, de pago y gratis (`docs/dias/img/6y7-titulos-dias-pago.jpg` y `-dias-gratis.jpg`): «Centro histórico y Roma antigua» (con «Día de viaje» y debajo, pequeño, «· Madrid → Roma»), «Vaticano y Trastevere» y «Centro histórico y Villa Borghese» (con «Día de viaje · Roma → Madrid»). En 375 px el trayecto no cabe junto a la marca y baja entero a la línea de debajo, sin partirse.
- HOY con el panel «Pruebas» (momento «Durante · jue 15 / vie 16 / sáb 17»): `6y7-titulos-hoy-llegada.jpg`, `-hoy-medio.jpg`, `-hoy-vuelta.jpg`. El título sale arriba y es el mismo que en DÍAS; el día de en medio no lleva trayecto.
- Con Free Tour: NO se ha podido ver en el navegador. El viaje que crea el formulario no lleva Free Tour y el botón de añadirlo no sale en esa ruta (la ruta de prueba no tiene los días escritos que pide `freeTourAvailable`). El caso está probado con las 95 días con Free Tour de los 228 viajes del motor y con las pantallas de la prueba (por ejemplo «Free Tour y Vaticano» en DÍAS).

## Preguntas para Eric

1. En la ruta a mano, el botón gris «Ponle nombre» del día vacío se ha sustituido por el título («Día libre» si está vacío), como pide el punto 6. El nombre propio se sigue poniendo desde «···» → «Cambiar el nombre». ¿Está bien, o quieres que «Ponle nombre» siga saliendo en el día vacío?
2. Los 7 sitios dudosos de arriba: ¿te valen donde los he puesto?
3. Las nocturnas cuentan como parada de su grupo (una visita nocturna a Trevi suma uno a «Centro histórico»). ¿Prefieres que no cuenten para el título?
4. Una excursión de medio día en la mañana da «Excursión desde Roma y Centro histórico». ¿Bien? (No estaba en tus ejemplos.)
5. Un día de la ruta con el trayecto de vuelta añadido al final del viaje (`isReturnLeg`, solo viajes con varias ciudades) sin paradas sale como «Día libre» + «Roma → Madrid», como pide el punto 6. Suena raro; ¿quieres otro texto para ese día?
6. El título de los viajes de Roma sale casi siempre con dos nombres («Roma antigua y Vaticano»), porque los días escritos mezclan zonas. Con la regla de «segundo grupo si tiene 2 paradas» es lo que hay; ¿subimos el mínimo a 3 para que salgan más títulos de un solo nombre?

## Ficheros tocados

- Datos: `data/pipeline_v2/roma.json` (solo líneas añadidas: `grupo_dia` y el bloque `grupos_dia`).
- Servidor y compartido: `server/index.js` (una línea en `/api/destination-excursions`), `shared/routeEngine/fichaLugar.js` (`gruposDeDia`). No se ha tocado el motor.
- App: `src/lib/tituloDelDia.ts` (nuevo), `src/lib/destinationExcursions.ts`, `src/lib/exportPdf.ts`, `src/components/route/DayList.tsx`, `src/components/route/hoy/HoyDurante.tsx`, `src/components/route/StopMenu.tsx`, `src/components/route/dayDetail/ListaDeDias.tsx`, `src/components/route/dayDetail/DayPositionPicker.tsx`, `src/components/route/freeDay/AddToDaySheet.tsx`, `src/components/route/freeDay/AddToTripScreen.tsx`.
- Scripts: `scripts/destino/asignarGruposDia6y7.mjs`, `pruebaFase6y7_titulos.mjs`, `_6y7_titulos_entrada.tsx`, `_6y7_volcado.mjs`, `_6y7_tabla_grupos.mjs`, `_6y7_correr_afectadas.sh`, `_6y7_correr_otras.sh`, y los ajustes mínimos de las pruebas antiguas listadas arriba.
- Capturas: `docs/dias/img/6y7-titulos-*.jpg`.
