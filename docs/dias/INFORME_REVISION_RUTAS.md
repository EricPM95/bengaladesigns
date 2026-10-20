# Revisión de las rutas de Roma, tal cual salen en la app

Solo he sacado y enseñado: **no he tocado el motor de rutas ni ningún dato.** La página es `docs/dias/RUTAS_REVISION.html` (se abre sola en el navegador, en el móvil y en el ordenador) y los datos, una fila por parada, `docs/dias/RUTAS_REVISION.json`.

## 1. Cómo lo he sacado

- **Las 126 rutas:** 2, 3 y 4 días × las 6 combinaciones (Imprescindibles siempre; A Arte y Museos + Barrios y Sabores, B Naturaleza y Vistas + Barrios y Sabores, C Arte y Museos + Naturaleza y Vistas, D/E/F Free Tour con cada una de las otras) × los 7 días de inicio, del lunes 9 al domingo 15 de noviembre de 2026. Sin vuelos, sin alojamiento y sin monumentos a mano; con 4 días, el día 4 en Roma. Una pareja de viaje, ritmo y presupuesto normales (los de la app por defecto).
- **Por el mismo camino que la app:** cada ruta se crea con la misma generación que hace la app al crear el viaje (`runGeneration`: las peticiones `generate-skeleton`, `generate-day-places` y `generate-day-block` al servidor de este PC, con el código de ahora) y el mismo paso a ruta (`mapGeneratedRouteToRoute`).
- **Y se abre en la app de verdad:** cada ruta se crea otra vez dentro de la propia app (en un Chrome sin ventana contra `npm run dev`), se abre cada día en **DÍAS** y se **lee lo que enseña la pantalla**: el nombre de cada parada, sus minutos, los trayectos entre paradas («3 min · 227 m»), las paradas «de camino», las comidas y cenas con su restaurante y los avisos de cada parada (cerrado, reserva, etc.). No se recalcula nada de eso: sale tal cual.
- **Del motor** salen: el «por qué» de cada parada (los motivos que el motor ya guarda —sus cierres, sus reservas, el Free Tour, la cercanía a la anterior— y, si no hay otro, «lo pide el día escrito «…»»), el título del día escrito, el plan «Si llueve» y lo que el día deja fuera.
- **Los 126 viajes tardan unos 6 minutos** (4 procesos a la vez). Para repetirlo: `API_URL=http://localhost:8787 node scripts/destino/rutasRevision.mjs` (hace falta `npm run server` y `npm run dev`).
- **Sin horas:** la página no enseña horas, solo el orden (las horas se usan por dentro solo para saber qué día acaba tarde).

## 2. Cuántas marcas hay (en las 126 rutas, 378 días)

| Marca (color) | Cuántas | En cuántas rutas |
|---|---|---|
| Nombre ≠ título del día escrito (violeta) | 126 | 84 |
| Parada repetida (naranja) | 168 | 84 |
| Cerrada ese día (rojo) | 63 | 45 |
| Andando más de 20 min (azul) | 132 | 126 |
| Día que acaba muy tarde (marrón; 22:45 o más) | 31 | 30 |

Cómo se cuenta cada una:
- **Nombre ≠ título:** el título que el día escrito da a la parada **no tiene nada en común** con el nombre del sitio (se ignoran palabras como «iglesia» o «plaza»). Las diferencias leves («Fontana de Trevi» → «Fontana de Trevi, sin gente») no se marcan; se enseñan en pequeño.
- **Repetida:** el mismo sitio dos veces en el mismo viaje, las dos de día o las dos de noche (Coliseo de día y «Coliseo (noche)» son cosas distintas).
- **Cerrada:** la app dice «Cerrado hoy» o «Cerrado este día» en esa parada.
- **Andando > 20 min:** cualquier trayecto de más de 20 minutos de los que enseña DÍAS.
- **Muy tarde:** el día acaba (por dentro) a las 22:45 o después; es el 8 % de los días.

## 3. Los 10 casos más raros

1. **«Parque de Villa Borghese» dos veces seguidas el mismo día (84 rutas, las que llevan el día de Villa Borghese).** No es un error de datos: la segunda es **«Reloj de agua del Pincio»**, una parada del día escrito. Pero comparten el nombre del sitio. **Corrección a mi informe de la tanda 9:** dije que la app enseñaba la segunda con el nombre del parque. **En DÍAS enseña «Reloj de agua del Pincio»**; el nombre del parque solo sale donde se usa el nombre del sitio (la hoja de recomendaciones, por ejemplo). Eso es lo que parecía un duplicado.
2. **Castillo de Sant'Angelo, cerrado los lunes, pero con «Reserva: recomendada» (36 rutas en lunes).** La app lo enseña a la vez «Cerrado este día», «Por fuera: hoy cierra» y «Reserva recomendada». Se queda en su día porque ningún otro del viaje abre.
3. **Mirador de San Pietro in Montorio / Tempietto, cerrados los lunes (27 apariciones).** También se quedan en su día, «por fuera».
4. **«Basílica de Santa María la Mayor» frente a «Santa Maria Maggiore» (42 rutas).** El nombre en español y el título en italiano del día escrito: es el **mismo sitio**, pero la marca violeta salta por no compartir ninguna palabra (es un falso aviso de mi regla).
5. **Coliseo de día y «Coliseo (noche)» en las 126 rutas.** Salen los dos en todos los viajes (el de noche, junto a «Foro Romano desde el Campidoglio»). No es repetición mala, pero conviene mirarlo.
6. **2 días con Free Tour (D, E, F): el día 1 tiene solo 8 paradas y el día 2, 17** (lunes a jueves, «Free Tour y Vaticano»). El reparto es muy desigual.
7. **Días que acaban a las 22:50-23:00 (31).** Sobre todo en las combinaciones C y D de 2 días (7 y 5 rutas de 2 días C y D).
8. **«No te dio tiempo» no sale en ninguno de los 378 días.** El apartado existe en la app pero con estas rutas el motor no deja nada fuera.
9. **El Mirador del Janículo → siguiente: 21 min andando (1,8 km) en las 126 rutas.** Es el único trayecto largo que se repite en todas: casi toda la marca «azul» sale de ahí (126 de las 132; las otras 6, de la Iglesia de San Pietro in Vincoli, también 21 min).
10. **«Desayuno» sale como una parada más, sin minutos,** en los días con el Pincio/Trevi: con el nombre «Desayuno romano» en la pantalla y «Desayuno en la Piazza della Rotonda» en el día escrito (no se marca porque comparten la palabra «desayuno»).

Más cosas que he mirado y salieron limpias: **ninguna parada repetida aparte de Villa Borghese; ningún imprescindible cerrado** (Coliseo, Foro, Vaticanos, Galería Borghese, Panteón…) **y ningún trayecto de 30 minutos o más.** Todas las comidas y cenas llevan restaurante. La pantalla y el motor enseñan las mismas paradas en las 126 rutas (0 avisos de que no cuadren).

## 4. ¿Coincide lo que sale en la página con la app?

Lo he comprobado abriendo **otra vez** 3 rutas en la app de este PC y comparando con los datos de la página: **3 días A empezando el lunes 9, 2 días D empezando el sábado 14 y 4 días F empezando el domingo 15 de noviembre.** `pruebaRevisionRutas`: **174 comprobaciones, 0 fallos.** Mira, en cada día: el título del día, el nombre de cada parada y su orden, los minutos de visita, las paradas «de camino», los trayectos entre paradas (en el mismo orden y con los mismos minutos), los restaurantes y que «Cerrado» salga en las mismas paradas.

**Lo que no coincide con lo que dije al principio:** mis primeras pruebas (con una versión que recalculaba los trayectos y los nombres por mi cuenta) **sí encontraron diferencias con la app**, y por eso ahora todo eso se lee de la propia pantalla: (a) el desayuno sale con otro nombre y sin minutos; (b) la app no pinta el trayecto entre una parada y la comida, ni entre dos paradas «de camino» seguidas, ni a la parte de noche; (c) hay avisos que solo calcula la pantalla según la hora («A esta hora ya ha cerrado», «aún no ha abierto»). Todo eso ya sale igual que en la app.
- **El título del día** de la app sale de unos grupos propios («Roma antigua y Centro histórico»), no del día escrito («Día de la Roma antigua»): la página enseña el de la app y el escrito en pequeño.
- **Un detalle:** los avisos «A esta hora ya ha cerrado / aún no ha abierto» salen en la página como avisos de la parada pero **no cuentan** como «cerrada ese día»: eso es solo para «Cerrado hoy» o «Cerrado este día».

## 5. Pruebas

- **`pruebaRevisionRutas` (nueva): 174 comprobaciones, 0 fallos** (apartado 4).
- **La página:** `scripts/destino/capturaRevisionRutas.mjs` la abre en un Chrome sin ventana (escritorio y móvil), comprueba los selectores, las marcas, «siguiente» y que no desborda, y no da errores en la consola. Capturas en `docs/dias/capturas_revision_rutas/`.
- **Batería rápida:** **76 pruebas, ninguna en MAL** (todas en 0 fallos o con su «ok?» de siempre; incluye `pruebaEntrar`, `pruebaCuentas1/3` y las de pantallas). No he tocado el motor ni los datos, así que no he vuelto a pasar las 60 fechas, push y 365 del motor.

## 6. Riesgos

- **El «por qué» es lo que el motor ya guarda;** cuando no hay otra razón dice «lo pide el día escrito». No hay un motivo guardado por parada del tipo «a primera hora para que no haya cola»: si Eric lo quiere, habría que guardarlo en los datos (fuera de esta tarea).
- **Mapbox:** los minutos andando los calcula la propia app en el momento con Mapbox: si cambian las rutas de Mapbox, cambian un minuto o dos.
- **La marca violeta** puede saltar con el mismo sitio en dos idiomas (caso 4).
- **Las rutas dependen de los datos de ahora:** si se cambia un día escrito, hay que volver a lanzar el generador.
