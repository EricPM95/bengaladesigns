# Revisión de los viajes largos de Roma

Solo he sacado y enseñado: **no he tocado la app, el motor ni ningún dato.** La página es `docs/dias/RUTAS_REVISION_LARGOS.html` (se abre sola en el navegador, en el móvil y en el ordenador; 6,5 MB porque lleva las 210 rutas dentro) y los datos, una fila por parada, `docs/dias/RUTAS_REVISION_LARGOS.json` (14.743 filas).

## 1. Cómo lo he sacado

- **Mismo generador que `RUTAS_REVISION.html`** (`scripts/destino/rutasRevision.mjs --set=largos`): cada ruta se crea con la misma generación que hace la app (`runGeneration`: `generate-skeleton`, `generate-day-places` y `generate-day-block` al servidor de este PC, con el código de ahora), se crea otra vez dentro de la app, se abre cada día en DÍAS y se **lee lo que enseña la pantalla**. Sin vuelos ni alojamiento. Tardó unos 25 minutos (4 procesos).
- **Las 210 rutas:** 5 grupos × 6 combinaciones de experiencias (A a F, las mismas de siempre) × 7 días de inicio (del lunes 9 al domingo 15 de noviembre de 2026): **4 días con el día 4 de excursión; 5 días con el día 4 en Roma y con excursión; 6 días con el día 4 en Roma y con excursión.** El día 4 se pide con el interruptor de la app (`answers.diaCuatro`: `roma` o `excursion`).
- **Selectores:** días (4, 5, 6), **Día 4 (Roma / Excursión)** —con 4 días solo sale Excursión—, combinación y día de inicio, y el mismo «siguiente» por cada marca. El enlace con `#` abre justo una ruta (`#6-excursion-F-2026-11-15`).
- **Las marcas son las mismas, sin los dos falsos avisos:** el Reloj de agua del Pincio (parada del día escrito dentro de Villa Borghese) ya no sale como «nombre ≠ título» ni como Villa Borghese repetida, y Santa Maria Maggiore = Basílica de Santa María la Mayor tampoco. (En `RUTAS_REVISION.html` se quedan como estaban.) Al quitarlos, «Nombre ≠ título» queda en **0**: todos los que había eran esos dos.
- **Cómo cuento los días:** igual que en `RUTAS_REVISION.html`. «N días» son **N días con paradas, más el día de vuelta sin paradas** (la petición lleva `days: N+1`, con las fechas de N+1 días; el día de vuelta no sale en la página). Así, «5 días» = 5 días con paradas (+ el de vuelta). El día de excursión cuenta como uno de los N.

## 2. Cuántas marcas hay (210 rutas, 1.050 días)

| Marca | Cuántas | En cuántas rutas |
|---|---|---|
| Nombre ≠ título del día escrito (violeta) | 0 | 0 |
| Parada repetida (naranja) | 2.268 | 126 |
| Cerrada ese día (rojo) | 276 | 162 |
| Andando más de 20 min (azul) | 234 | 210 |
| Día que acaba muy tarde (marrón; 22:45 o más) | 16 | 16 |

Las repetidas salen solo en 5 días con Roma, 6 días con Roma y 6 días con excursión (756 en cada uno de los tres, las 42 rutas de cada uno): los de 4 y 5 días con excursión no repiten nada.

## 3. Las 10 cosas más raras

1. **Con 5 o 6 días y el día 4 en Roma, los días 4-6 repiten lo grande de los días 1 y 2** (18 marcas por ruta): Foro Romano y Palatino, Plaza Venecia, Altar de la Patria, Panteón, Plaza de San Pedro, Via della Conciliazione, Castillo y Puente Sant'Angelo, Piazza Navona y Teatro de Marcelo. El día 5 «Roma antigua y Vaticano» es, casi entero, el día 1 + el día 2 otra vez.
2. **Con 6 días y excursión, pasa exactamente lo mismo** (756 marcas): el día 4 se va de excursión, pero los días 5 y 6 siguen repitiendo. El de 5 días con excursión, no.
3. **Cuatro de seis días se llaman «Roma antigua…»** en 6 días (1: «Roma antigua y Centro histórico»; 4: «Basílicas y el Aventino y Roma antigua»; 5: «Roma antigua y Vaticano»; 6: «Roma antigua»).
4. **El día de excursión llega vacío:** «Excursión desde Roma» sin una sola parada en las 126 rutas que lo llevan (ni comida, ni cena). No dice qué excursión es; en la página solo se ve el título.
5. **«Se ve dentro del Free Tour» en rutas que no llevan Free Tour:** 651 veces en A, B y C (Panteón y Piazza Navona 168 cada uno; Trevi, Via Condotti y Plaza de España 105). El «por qué» nombra un Free Tour que no está en el viaje.
6. **San Pietro in Montorio y el Tempietto salen «A esta hora ya ha cerrado»** 67 veces (jueves, martes, sábado, viernes), En total son 122 paradas puestas a una hora a la que el sitio ya cerró (las otras 55, sobre todo la Terraza del Altar de la Patria y el Gesù).
7. **Santa Maria in Aracoeli sale «Cerrado este día»** martes, jueves, viernes, sábado y domingo (126 veces) y sin horario: parece un dato de cierre equivocado (una iglesia casi siempre abierta).
8. **El Castillo de Sant'Angelo, un lunes** (75 veces): «Cerrado este día», «Por fuera: hoy cierra» y «Reserva: recomendada», las tres cosas a la vez en la misma parada.
9. **Mirador del Janículo → siguiente: 21 min andando (1,8 km) en las 210 rutas;** es casi toda la marca azul (210 de 234; las otras 24, de San Pietro in Vincoli, con el mismo tiempo). Ningún trayecto pasa de 21 minutos.
10. **Demasiadas nocturnas:** de 5 a 8 paradas «de noche» por viaje (5 en los de 4 días; 6-7 con 5 días; 7-8 con 6), y el Coliseo sale de día y de noche en las 210 rutas. Además, 4,4 «Reserva: obligatoria» por ruta de media, y días de 15-17 paradas (el «Centro histórico y Villa Borghese» llega a 17).

Lo que salió limpio: **ninguna comida o cena sin restaurante** (966 días con paradas, todos con comida y cena), **ninguna parada sin minutos**, **ningún día con el mismo título ni el mismo día escrito dos veces**, **«No te dio tiempo» vacío** en todos y el Free Tour en todas las rutas D, E y F (casi siempre el día 1).

## 4. ¿Coincide la página con la app?

**Sí.** `pruebaRevisionLargos` abre **otra vez** 2 rutas en la app de este PC y las compara con lo que lleva la página dentro: **5 días con el día 4 en Roma, A, lunes 9, y 6 días con el día 4 de excursión, D, sábado 14.** 192 comprobaciones, 0 fallos (títulos, paradas y orden, minutos de visita, «de camino», trayectos, restaurantes y «Cerrado»). La página (`capturaRevisionLargos.mjs`) carga en escritorio y móvil sin desbordar, los selectores (también el del día 4) y «siguiente» funcionan y no da errores en la consola.

## 5. Para repetirlo

`API_URL=http://localhost:8787 node scripts/destino/rutasRevision.mjs --set=largos` (hace falta `npm run server` y `npm run dev`; ~25 min). Con `--reusar` rehace solo las marcas y la página con las rutas ya sacadas.

Pruebas: la batería rápida y `pruebaRevisionLargos` en 0 fallos. Riesgo: ninguno para la app (solo scripts y documentos nuevos).
