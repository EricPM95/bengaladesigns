# Informe Tanda 11 · rutas de Roma (sin vuelos)

Hecho sin preguntar a Eric (estaba fuera): donde algo no estaba claro he tomado la decisión más razonable y está escrita aquí, en «Decisiones mías». Páginas: `RUTAS_REVISION.html` (126 rutas) y `RUTAS_REVISION_LARGOS.html` (210), las dos con el selector nuevo **«Qué ha cambiado»**. Prueba nueva: `scripts/destino/pruebaTanda11.mjs` (27.540 comprobaciones, 0 fallos).

## Resultado en cifras

- Prueba nueva de la Tanda 11 contra las dos páginas: **27.540 comprobaciones, 0 fallos**.
- Muestra de ~60 fechas (`pruebaListas paso=6`): **132.613 viajes, 0 fallos**.
- Batería rápida: 79 pruebas. 4 estaban en MAL al principio; las 3 de motor/títulos/viajes eran expectativas viejas que Eric ya había cambiado (ver «Pruebas que he cambiado») y la cuarta es la de las 365 (se lanza aparte). Todas en 0 fallos al final.
- Las 365 fechas (`_correr6y5.mjs procesos=12`): **144.531 comprobaciones, 0 fallos**. (A mitad de camino dieron fallos que eran míos —la Galería se quedaba en lunes cuando se podía cambiar de día, y la Basílica elegida que cubre la Cúpula no contaba como «sale»—; arreglados en el motor y en la prueba, y vueltas a pasar enteras.)
- Marcas de las páginas: «cerrada» 27 → 15 (126 rutas) y 48 → 42 (210); «andando» 132 → 92; «repetida» y «título» a 0 (eran los falsos avisos del punto 5).
- Qué ha cambiado (126 rutas): orden de días 59, paradas que entran/salen 110, mismas paradas en otro orden 54, noche 63. (210 rutas): orden de días 183, paradas 194, otro orden 51, noche 141.

## Punto por punto (Parte A)

0. **Comida.** Ya estaba en las 15:00. Lo que cambia: un imprescindible (nivel 1, o la visita única que lo cubre) **nunca** se acorta ni pasa a «por fuera» por la comida (`intocable` en `reducir`). Solo se recorta lo de nivel 2 y 3. La prueba vieja que exigía acortar antes de quitar ahora exceptúa los imprescindibles.
1. **Basílica por fuera + Cúpula.** Con la Cúpula (Naturaleza y Vistas) sale una sola visita, «Cúpula de San Pedro y Basílica por dentro» (105 min, `cubre` la Basílica). Nunca las dos.
2. **La Basílica no desaparece.** Prueba: todo día con los Museos Vaticanos lleva la Basílica (sola o con la Cúpula) como parada, en las 336 rutas. 0 fallos. Con otros imprescindibles el mismo hueco queda cerrado por el mismo `intocable`.
3. **2 días con Free Tour (D, E, F).** El Gueto se queda; el Janículo pasa a **después de cenar** («Mirador del Janículo» de noche, fijado en el día) y la tarde acaba en Trastevere; el Tempietto no va de noche. El día baja de 15 a 13-14 paradas. *No he conseguido bajarlo más sin quitar algo que Eric dijo que se queda.* La nocturna del día 2 ya no repite lo visto ese día si hay otra pareja.
4. **Un solo aviso.** «Hoy está cerrado: lo ves por fuera» (cierre del día), «A esta hora ya ha cerrado», etc.: **uno solo**, sin «Cerrado este día», sin «Reserva recomendada» y sin la pestaña naranja de entrada (solo se queda si el viajero ya la reservó). El Tempietto cerrado es **siempre** «El mirador de San Pietro in Montorio» y el mirador no sale cerrado (`si_cerrado` en el dato del lugar). Reserva de un sitio en otra fecha: una parada pequeña se mueve a su día (ya lo hacía); en una fecha en que cierra, la reserva **se guarda igual** y sale «Ojo: X está cerrado ese día. Revisa la fecha de tu entrada.» (antes: «Ese día X está cerrado»). Lo he cambiado al texto de Eric.
5. **Falsos avisos de la página.** Quitados «repetida» (Parque/Reloj de agua), «título distinto» (Santa Maria la Mayor), la «Reserva» en lo que va por fuera y el «Por fuera: …» repetido.
6. **Andando más de 20 min.** Del Mirador del Janículo (176 en las 210) y San Pietro in Vincoli: **sin bus verificado**. El dato del Janículo solo trae una nota del ATAC 115 sin recorrido; no invento un bus. Se queda a pie, como dijo Eric. Con el punto 3 desaparece en los 2 días con Free Tour.
7. **«Se ve dentro del Free Tour».** Solo el día que lleva el Free Tour y nunca en un viaje sin él (motor: `in_free_tour` solo si ese día lleva el tour; página igual). Dentro del día del tour la frase tiene sentido (explica por qué ya lo ves). 0 casos fuera.
8-11. **Orden de los días.** Costes nuevos en `listasOrden.js`: un cierre que el día resuelve con su versión (Galería el lunes, Caracalla el lunes) pesa 1; una parada que se ve por fuera (Castillo, Tempietto) pesa 15; **el Vaticano el último día** pesa 150 (más que el desplazamiento, menos que un cierre real de 300). D5 tiene ya su versión de lunes (sin Caracalla). Resultado: viernes 13 nov (4 días A) = Roma antigua · Vaticano · Centro y Villa Borghese · Basílicas; 3 días desde el sábado = Vaticano · Roma antigua · Centro; el Vaticano nunca cae en domingo ni miércoles. **El primer domingo del mes / misa del Panteón: no lo he mirado** (queda para Eric).
12. **Datos de horarios.** Corregido en la ficha: Museos Capitolinos y Mercados de Trajano ya no cierran los lunes; el Ara Pacis tampoco; San Luigi 9:30-12:45 y 14:30-18:30 (también en el motor, `windows` decía 18:15); el Gesù con el horario del motor (16:30). Auditoría completa en `scripts/destino/_auditoriaFichaMotor.mjs`: quedan 7 diferencias que son **omisiones de la ficha** (cierres que el motor sabe y la ficha no dice: Catacumbas, Doria Pamphilj, Domus Aurea, Caracalla, Mercado de Testaccio, Tempietto) y varias de temporada que no son errores. *Santa Maria in Aracoeli «Cerrado este día»*: el lugar es el Santo Bambino (solo del 24-dic al 6-ene) y no tiene horario; no lo he tocado, queda sin verificar.
13. **Gesù.** Regla general nueva: antes de dejar que una visita llegue cerrada, el motor prueba a ponerla antes de lo que no cierra (rodeo máximo 10 min, sin cruzar comidas ni horas fijas, sin romper el zigzag). Día 1: Argentina → San Luigi → Panteón → Gesù → Navona, todo abierto. También lo hace con la Basílica (los Museos a las 15:30). Si no hay forma, por fuera con un solo aviso.
14. **Último día sin vuelo.** Se queda vacío a propósito, con «Hoy vuelves a casa» (Tanda 10B). Confirmado cómo cuenta la página: «N días» = N días con paradas **+** el de vuelta (la app: «N+1 días · N noches»); la prueba lo comprueba en las 126.

## Parte C

- **C8.** Roma lleva 5 días curados (la tabla pasa a D1, D2, D4, D5, D7); el 6.º día de ciudad sale en blanco (`max_auto_dias_ciudad: 5`; con excursión no queda ninguno en blanco). Si las Catacumbas cierran (miércoles), la Vía Appia y las basílicas se cambian entre sí, nunca con los tres primeros. Roma desde arriba (D6) se queda en los datos. **No he podido hacer** el «¿Te lo organizamos? Roma desde arriba»: el motor no sabe montar un día suelto sobre un día en blanco y sin parche no se puede; queda como propuesta de diseño.
- **C9.** La Cúpula solo con Naturaleza y Vistas (B, C, F: 0 casos en las demás). Sin ella, en la pestaña de consejos de la ficha de la Basílica sale «¿Te quedan fuerzas? Sube a la Cúpula» con [+ Añadir], que convierte la parada en la visita única. *No probada en pantalla* (solo tipos y SSR).
- **Nombres de los días.** Grupo nuevo «La Vía Appia» (Catacumbas, Via Appia Antica, Terraza de Largo Gaetana Agnesi): el día se llama «La Vía Appia» y el de las basílicas «Basílicas y el Aventino» (antes «Roma antigua» y «Basílicas y el Aventino y Roma antigua»). Caracalla y San Clemente pasan al grupo de las basílicas; **Circo Máximo se queda en Roma antigua** porque era un ejemplo explícito de Eric en la prueba de títulos.
- **C3.** Con 4 días y excursión, la excursión el día 4: ya estaba así y las páginas lo enseñan.

## Decisiones mías

- Un cierre «cubierto por versión» pesa 1, no 0, para que desempate a favor del orden sin cierre.
- El Vaticano último día pesa 150: lo he puesto entre «un cierre» (300) y «un cambio de sitio» (1-3) para cumplir el orden que dijo Eric (cierres, luego Vaticano no último, luego Roma antigua el día 1).
- La exención «el día tiene su versión» es solo para Caracalla (`curated_routes.cierre_resuelto_por_version`), no para la Galería: sin ella el D4 pierde su centro y sí vale cambiar de día.
- Janículo de noche: no he añadido la Fontana dell'Acqua Paola como parada nocturna (el catálogo de nocturnas no la tiene); se queda fuera del viaje de 2 días.
- Gesù: el horario de la tarde es el del motor (16:30, de chiesadelgesu.org), no el 16:00 de la ficha antigua.
- Grupo «La Vía Appia» en la lista de grupos de día: añade a la lista de Eric (`grupos_dia`); si no lo quiere, se quita del dato.

## Pruebas que he cambiado (y por qué; no las he aflojado)

- `comprobacionesListas.mjs`: lo movido por «llegaría cuando ya ha cerrado» no cuenta como fuera de orden; un imprescindible no es «acortable» (punto 0).
- `pruebaFase6y10_viajes.mjs`: un cierre con versión del día no cuenta como perdido (solo si el día no tiene `dias_semana` en sus fechas malas, igual que el motor); la Basílica del viaje 14 puede llegar abierta en vez de «por fuera».
- `pruebaFase6y7_motor.mjs`: Museos antes que Plaza y Basílica (ya no «Plaza antes que Basílica»).
- `pruebaFase6y7_titulos.mjs`: «La Vía Appia» en la lista de grupos.

## Lo que no se ha podido o queda sin mirar

- «¿Te lo organizamos?» (C8): necesita parche.
- Bus del Janículo / San Pietro in Vincoli: sin dato verificado.
- Misa del Panteón el domingo y el primer domingo del mes (punto 9): sin mirar.
- Aracoeli: sin horario en los datos.
- Cambio «Qué ha cambiado» de las 126: calculado contra la pasada anterior en la primera tanda; el tag «avisos» sale en todas porque la página cambia el formato de avisos.
- La pestaña de la Cúpula (C9) y las capturas de pantalla: no verificadas en navegador.

## Las 10 cosas más raras de la página de viajes largos

1. **El Coliseo sale de día y de noche en las 210 rutas.**
2. **Todas las rutas tienen un día de 17 paradas** («Centro histórico y Villa Borghese»).
3. **El Mirador del Janículo andando más de 20 min: 176 veces.**
4. **La Galería Borghese «Cerrado este día» en 42 rutas** (cae en lunes y no hay otro día).
5. **El día en blanco aparece en 42 rutas** (6 días en Roma): hoy no lleva la propuesta de Roma desde arriba.
6. **7 nocturnas por viaje en 126 rutas** (de 5 a 7 en todas).
7. **San Pietro in Vincoli: 21 min andando hasta la siguiente en 42 rutas.**
8. **El día de excursión sale sin nada en la página** (126 rutas); en la app lleva su tarjeta.
9. **64 rutas con un día que acaba tarde** (22:45 o más).
10. **Con la Vía Appia el martes y las basílicas el miércoles (6 días desde el sábado)**: es el cambio por el cierre de las Catacumbas del miércoles, pero se ve raro que la Vía Appia vaya antes que las basílicas.

---

# 11B · tres arreglos de la Tanda 11 (22/23-oct-2026)

Prompt guardado tal cual en `docs/dias/PROMPT_TANDA11B.md`.

## 1. La Galería Borghese cerrada en lunes — por qué pasaba

**No era lo que pensaba Claude** (que el motor tratara la Galería como algo «que se ve por fuera»): en el motor la Galería se visita por dentro y su cierre pesa **entero** (1.000 por «mala fecha del documento» + 300 por el cierre + 100 por ser de nivel 2 = 1.400 al ponerla en lunes). Lo comprobé imprimiendo la tabla de costes del orden: D4 en lunes costaba 1.400.

Eran **dos fallos míos de la Tanda 11**, uno detrás de otro:

1. **Las páginas publicadas se sacaron con un motor intermedio.** Para cumplir «un día con versión para ese día de la semana no cuenta como malo» (punto 8) dejé que *cualquier* cierre con versión del día pesara 1: eso incluía la Galería (el D4 tiene una versión «sin Galería» para los lunes). Con esa regla ancha la Galería en lunes costaba 1 y el motor la dejaba caer en lunes en 42 rutas de las 210 (15 de las 126). Las 365 fechas lo pillaron después (`p2_habia_otro_dia`) y limité la exención a **Caracalla** en el D5 (que es lo que decidió Eric), pero **no volví a sacar las páginas**: las que se publicaron seguían con el fallo. Esa es la causa de los «Cerrado este día / No hay otro día de tu viaje en que se pueda ir» que ha visto Eric.
2. **Tras arreglar eso, el Vaticano seguía en sábado en el ejemplo (4 días desde el sábado 14-nov).** Aquí sí había un peso mal puesto: el Castillo cerrado el lunes (se ve por fuera) pesaba **15**, más que mover un día un puesto (1-2 por día), así que bastaba el Castillo para que el Vaticano no fuese al lunes y la Roma antigua y Villa Borghese se movieran. Eric dijo que un cierre que se ve por fuera «pesa poco»: ahora pesa **0,5** (solo desempata, nunca decide).

## 2. Reglas cambiadas

- `COSTE_CIERRE_POR_FUERA`: 15 → **0,5** (`shared/routeEngine/listasOrden.js`). «Pesa poco» pasa a ser «menos que mover un día un puesto».
- **La exención por versión es un dato, no una norma general**: `curated_routes.cierre_resuelto_por_version` (hoy solo «Termas de Caracalla»). Un museo, galería o sitio con entrada que se visita por dentro (Galería Borghese, Museos Vaticanos, Catacumbas, Villa Farnesina…) cuenta **siempre como cierre entero** al elegir el orden, aunque al lado haya un parque o una plaza abiertos.
- **Los días que se añaden van los últimos** (C8): nuevo dato `curated_routes.dias_que_se_anaden` (D5, D7) y coste 500 si uno no está en las últimas posiciones. Hace falta porque, al dejar de caer la Galería en lunes, el motor colocó la Vía Appia en el medio en los viajes de 5 y 6 días con Free Tour desde el sábado; con la regla la Vía Appia y las basílicas son los dos últimos y, si las Catacumbas cierran (miércoles), se cambian entre sí. 500 queda por debajo de un cierre entero (la Galería en lunes, 1.400) y por encima de cualquier desplazamiento.

## 3. Cuántas rutas cambian

- Respecto a las páginas publicadas en la Tanda 11: **27 de las 126** y **69 de las 210** cambian el orden de los días.
- Galería Borghese cerrada: **15 → 0** (126) y **42 → 0** (210). La marca «cerrada» de las páginas es **0 en las dos**.
- Siguen con algo cerrado: **ninguna** ruta de las 336 tiene una parada marcada como cerrada. Lo que sigue cerrado «a propósito» y se ve por fuera (el Castillo y el Tempietto los lunes) sale con **un solo aviso** y no cuenta como cierre.
- Ejemplo de Eric, 4 días A desde el sábado 14-nov: **sábado Roma antigua, domingo Villa Borghese, lunes Vaticano, martes Basílicas** (lo comprueba la prueba nueva).

## 4. ¿Otros sitios como este?

He recorrido todo lo que los días escritos llevan «por fuera» por defecto: el único que cierra un día de la semana es el **Castillo de Sant'Angelo** (lunes), y es el que *debe* pesar poco. El Tempietto cierra los lunes pero va por dentro con su alternativa («El mirador»). Los demás por fuera (Altar de la Patria, Foro, Coliseo, Panteón…) no tienen cierre semanal. La **única excepción** a «cierre entero» es **Caracalla en el D5** (por decisión de Eric en el punto 8, porque el D5 tiene versión de lunes). Si Eric prefiere que Caracalla también cuente entera, se quita de `cierre_resuelto_por_version` y el D5 dejará de caer en lunes cuando haya otro orden.

## 5. «Qué ha cambiado» rehecho

Las dos páginas comparan ahora con la de **antes de la Tanda 11** (126: commit `b7b05999`; 210: `1d86c9fb`, el último antes de la Tanda 11) y no con la pasada anterior. El orden de los días se identifica por el nombre *escrito* del día (cambiar el título que ve el viajero no cuenta) y los avisos se comparan **por clase** (reserva, cierre, por fuera, abre más tarde, pago…): solo cuenta que un aviso salga o se vaya en una parada que está en las dos páginas. Resultado (126 rutas): otro orden de días 122, paradas que entran o salen 104, mismas paradas en otro orden 59, cambia la noche 42, cambian avisos 119 (210 rutas: 210, 198, 59, 102 y 203). Los avisos que cambian son reales, no de formato: se van 117 avisos de «Reserva» en paradas que ahora se ven por fuera, 60 «Por fuera:» repetidos y 15 de pago; salen 23 de cierre nuevos (los de «Hoy está cerrado: lo ves por fuera»).

## 6. Datos y notas

- **Santa Maria in Aracoeli:** puesto lo que cumplen las dos fuentes —**todos los días de 9:00 a 18:00**— con la nota «horario orientativo» en el dato (`horario_orientativo`). (El lugar del motor es el «Santo Bambino de Aracoeli», que solo sale del 24-dic al 6-ene.)
- **«¿Te lo organizamos? Roma desde arriba»: no se hace.** El día en blanco se queda con «Ya has visto lo mejor de Roma» y [Elegir mis sitios]. Quitada la propuesta de `NOTAS_REVISION_RUTAS.md` (C8) con la línea «Roma desde arriba no se ofrece en el día en blanco (Eric, 22-oct)» y actualizada la regla de `REGLAS_PARA_DESTINOS.md`.

## 7. Pruebas

- Prueba nueva en `pruebaTanda11.mjs` (apartado «11B»): en los viajes de 3 a 6 días que empiezan en sábado o domingo, la Galería nunca cae en lunes ni sale cerrada; el ejemplo de Eric sale en ese orden; Aracoeli 9:00-18:00; la propuesta de Roma desde arriba ya no está en las notas. **Con las páginas de la Tanda 11 fallaba (58 fallos) y con las nuevas pasa.** Total de la prueba: 27.625 comprobaciones, 0 fallos.
- Batería rápida: 71 pruebas, ninguna en MAL. Muestra de ~60 fechas: 132.613 viajes, 0 fallos.
- Las 365 fechas (`_correr6y5.mjs procesos=12`): **142.221 comprobaciones, 0 fallos** (el total baja respecto a la Tanda 11, 144.531, porque hay menos paradas cerradas que comprobar).
- Las dos páginas, de nuevo, con su JSON.

**Lo que aprendí (para no repetirlo):** tras cambiar un peso del orden, las páginas hay que sacarlas *después* del último cambio del motor; en la Tanda 11 las saqué y luego toqué el motor sin volver a sacarlas.
