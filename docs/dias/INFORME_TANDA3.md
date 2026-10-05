# Informe de la tanda 3: viajes de 3 a 6 días

Todo hecho de principio a fin, sin parar a preguntarte. **No he hecho push**: hay commits locales por bloques (`a387ed7` datos, `7f0093c` motor, `6b312de` pruebas y página de simulación, `ce45024` pantalla y fotos, `cf7624c` distancias y prueba final, y el último, con este informe y las preguntas). Lo que he tenido que decidir yo está marcado como provisional en [PREGUNTAS_TANDA3.md](PREGUNTAS_TANDA3.md), con el porqué y qué pasa si prefieres otra cosa.

## Qué he hecho

1. **El documento nuevo, tal cual, a `data/dias/roma/`.** Las 83 tablas se copian por número (si el documento cambia de orden, el convertidor lo dice en vez de copiar una tabla equivocada). Días nuevos: **D4** (Villa Borghese, el Popolo y la Plaza de España), **DA-medio** (mañana de vuelta del Aventino y Testaccio), **D5** (las basílicas y el Aventino), **D6** (Roma desde arriba) y **D7** (la Vía Appia y Trastevere tranquilo), cada uno con su mañana y sus tardes A, B, C y D. Y la tabla del **miércoles por la mañana** del medio día del Vaticano, que antes derivaba yo.
2. **Qué días lleva cada viaje.**

   | Viaje | Sin Free Tour | Con Free Tour de mañana |
   |---|---|---|
   | 3 días | D1 + D2 + D4 | D3 + D1-FT + D4 |
   | 3,5 días | + el Aventino y Testaccio por la mañana de vuelta | igual |
   | 4 días | + D5 (se puede cambiar por una excursión) | igual |
   | 5 días | los cuatro días + **excursión** | igual |
   | 6 días | + D6 y la **excursión** | igual |
   | 7 o más | del día 7 en adelante, en blanco | igual |

   La excursión nunca va el día de llegada ni el de vuelta, y en la pestaña RUTA ese día lleva la etiqueta **«Día de excursión»**.
3. **Orden de los días.** Si un día cae en una fecha que le va mal y se puede cambiar con otro del viaje, se cambian: el D4 en lunes (la Galería cierra), el D5 en lunes (Caracalla), el D6 en miércoles (la audiencia del Papa) y en lunes (el Castillo). Yo he añadido el D7 el domingo y el miércoles (pregunta 11).
4. **Lo que hace el motor en lunes, miércoles y domingo** (el documento lo dice con notas, no con tablas): la Galería cerrada alarga Villa Borghese; el Castillo cerrado va por fuera y el rato va a Borgo Pio; el D5 en lunes es la tarde sin Caracalla y en domingo reordena la mañana (San Clemente solo abre por la tarde); el D7 sin catacumbas o sin Villa Farnesina. Cada cambio lleva su causa en el registro.
5. **Dos reglas de todos los destinos.**
   - **Por dentro una sola vez (0bis):** lo que tiene visita por dentro va por dentro el primer día que sale y por fuera, más corto, las otras veces. La reserva manda; lo que solo tiene sentido por dentro se queda; la terraza del Altar de la Patria (con el ascensor) cuenta como otra visita.
   - **Pirámide (0):** lo mejor, primero (los imprescindibles en los primeros días y la tarde de llegada); lo de más abajo, al final (el Aventino y Testaccio, la mañana de vuelta de 3,5 días; la Vía Appia, el último día de 6).
6. **Nocturnas que no se repiten.** Si una ya salió en el viaje, la del día cambia por otra que no haya salido (la que prefiere ese día —Trevi en el D4, Trastevere en el D5— y, si no, la más cercana a la cena); si no queda ninguna, ese día sin nocturna. El 24 de diciembre manda tu regla (solo Trevi). También vale ya para los viajes de 1 a 2,5 días.
7. **Respuestas de la tanda 2, aplicadas.** (30) El medio día de llegada de 1,5 días acaba con **Trevi iluminada y 10 min después la Plaza de España de noche**, si el día entero no las llevó de noche. (24) La Galería Borghese en verano ya no deja un colchón de más de 2 horas: el turno se retrasa de 30 en 30 min. (2) El miércoles por la mañana usa la tabla escrita. (14) Con 0bis, la Galería ya no va por dentro dos veces en 2,5 días. (10, 27) «Llegada según la hora» y el día de crucero con Museos, **sin tocar**, como dijiste.
8. **Pantalla «Prefiero quedarme en Roma».** En el día de excursión de 5 y 6 días hay un botón que abre una pantalla con las **paradas emblemáticas del día** (sin horas, con su foto) y dos botones: **«Organízame este día»** (el servidor monta el día escrito: D6 en 5 días, D7 en 6, y **el resto del viaje no se mueve**) y **«Prefiero crear mi propio día»** (el día queda en blanco, con «Añadir parada»). El viaje se acuerda de que ya no lleva excursión. En 4 días, el D5 se puede cambiar por una excursión como antes (el aviso ahora cuelga del D5). Probada en el navegador: la pantalla sale con las fotos que hay y, donde no hay (la terraza del Altar), un recuadro neutro con el nombre.
9. **Fotos: huecos preparados.** Cada sitio de `FOTOS_PENDIENTES.md` tiene un archivo fijo en `public/fotos/roma/`. Se suelta la foto con ese nombre y **sale sola** (el servidor mira cada 5 segundos; probado con un archivo de prueba, ya borrado). Hasta que llegue, la foto de ahora; si no tiene, un recuadro neutro con el nombre del sitio. La lista, abajo.
10. **Distancias en todos los días escritos** (también los de la tanda 2). Con las coordenadas de `roma.json` y el mismo cálculo que la app, el hueco entre dos paradas tiene que dar para lo andado más el margen del documento. **506 tramos corregidos** (en 70 tablas), corriendo las horas solo hacia delante (no acorto ningún colchón ni comida; la cena puede retrasarse, hasta las 22:00), y **4 que no se pueden corregir** (la fila de llegada es una reserva). El detalle, tramo a tramo, en [DISTANCIAS_TANDA3.md](DISTANCIAS_TANDA3.md). Lo hace el convertidor, así que se repite solo. **Efecto:** muchas tardes empiezan 5 a 25 min más tarde que en el documento y en 36 tablas la cena sale hasta 45 min más tarde (casi todas, 5 a 30). El caso que me dijiste (Pincio → Trinità dei Monti en el medio día del Tridente): sale con 11 min andando y está corregido (Trinità sale 10 min más tarde en las tardes A y B y 25 min en C y D, porque ahí se acumula lo de antes). Pregunta 27: las dos alternativas (recortar colchones en vez de retrasar la cena; corregir solo de 5 min en adelante).
11. **Un fallo que encontré al probar y arreglé:** el extra «Cúpula de San Pedro» en la tabla de fiesta del D2 (25 de diciembre) se metía al principio del día (a la 1:25) porque esa tabla no tiene la Basílica; ahora un extra que no tiene dónde ir va a «No incluido».

## La prueba contra el documento

`node scripts/destino/pruebaEscritos.mjs dias=1,1.5,2,2.5,3,3.5,4,5,6,pool,ft` (parada a parada, las 365 fechas de 2027; cada diferencia necesita una causa apuntada por el motor, si no es un fallo). Resultado completo en [PRUEBA_ESCRITOS_TANDA3.md](PRUEBA_ESCRITOS_TANDA3.md).

| | Viajes | Días comparados | Filas del documento | Diferencias | **Sin explicar** |
|---|---|---|---|---|---|
| 1 a 2,5 días (los de antes) | 1, 1,5 (tarde y mañana), 2 y 2,5, con y sin Free Tour | 7.665 | 115.686 | 19.072 | **0** |
| 3 a 6 días (nuevos) | 3 (con y sin Free Tour), 3,5 (mañana y tarde, con y sin Free Tour), 4, 5 y 6 (con y sin Free Tour) y 5 y 6 con «Prefiero quedarme en Roma» | 20.075 | 318.435 | 63.454 | **0** |
| Todo, más el pool y los Free Tour de tarde y de noche | los anteriores + extras del pool (Galería, Letrán, Termas, Castillo, Cúpula, Capitolinos con el D6…) y los Free Tour de tarde y de noche | 57.670 | 908.234 | 183.163 | **0** |

Otras comprobaciones, en las 365 fechas:

- **Qué días lleva cada viaje y en qué orden:** 0 fallos (con empates entre órdenes igual de buenos: valen todos). Con «Prefiero quedarme en Roma», los demás días no se reordenan.
- **Por dentro una sola vez:** 0 sitios con visita por fuera posible que salgan por dentro dos veces. **Nocturnas repetidas:** 0.
- **Restaurantes:** de **108.770 comidas y cenas**, **0 en un restaurante cerrado** ese día o a esa hora y 0 sin restaurante (en 11.079 casos va la alternativa o, si no hay otra, uno de la zona, siempre con su causa en el registro). **Con una excepción que he sacado de la prueba:** los Museos Capitolinos marcados en el pool de 2 a 5 días empujan la comida a las 14:50 y los restaurantes cierran a las 15:00 (pregunta 31: ¿qué se quita de la mañana?).
- **Cenas después de las 22:00:** 0. **Colchones de más de 2 horas:** 0 (el único que puede pasar es el del Aventino en lunes con el sol muy tarde: ahí lo apunta el registro, como dice el documento; el orden de los días evita casi siempre ese lunes). **Avisos «Hemos puesto el Vaticano otro día» en un día del Vaticano:** 0.
- **Imprescindibles que no salen** en 3 a 6 días: solo los Museos Vaticanos y la Basílica de San Pedro, y solo en unas pocas fechas en que cierran o hay misa (el 26 de marzo, el 13 y el 14 de agosto y el 23, 24, 25 y 31 de diciembre); todos los demás salen siempre.

## Los viajes de la página de simulación

[VIAJES_3_6_MOTOR.html](VIAJES_3_6_MOTOR.html): **27 viajes** (uno de cada duración —3, 3,5, 4, 5 y 6 días— en invierno, primavera, verano, otoño y Navidad, con lunes, miércoles y domingo dentro, y dos con «Prefiero quedarme en Roma»), con la barra horaria, las paradas, el porqué y, en amarillo, lo que el motor cambia respecto a la tabla escrita. Para volver a generarla con otras fechas: `node scripts/destino/viajes36Motor.mjs`. Para mirar un viaje a mano: `node scripts/destino/verViaje.mjs dias=5 inicio=2027-07-14 sin_excursion=1 log=1`.

## Huecos para las fotos (lo que me tienes que pasar)

Soltando el archivo con ese nombre en `public/fotos/roma/` (mejor de 1600 px de ancho o más), la foto sale sola. De día vale para todos los días en que salga el sitio; la de noche, solo en su nocturna. ★ = sale en una pantalla de lista («Prefiero quedarme en Roma») o es de las grandes. La lista, con su ✓ cuando llegue, se regenera con `node scripts/destino/fotosHuecos.mjs` (queda en [FOTOS_HUECOS.md](FOTOS_HUECOS.md)). **La Pirámide Cestia y el Cementerio Protestante ya tenían foto propia: no llevan hueco.**

#### Día «Roma desde arriba» (5 y 6 días)

| Sitio | Archivo | ¿Hay ya? |
|---|---|---|
| ★ Terraza del Altar de la Patria (la del ascensor panorámico) — La del Altar que ya hay es la del edificio. | `public/fotos/roma/dia_terraza_altar_patria.jpg` | no |
| ★ Castillo de Sant'Angelo por dentro (la terraza del ángel) | `public/fotos/roma/dia_castillo_sant_angelo_dentro.jpg` | no |
| ★ Museos Capitolinos (el Marco Aurelio o la Loba) | `public/fotos/roma/dia_museos_capitolinos.jpg` | no |
| ★ Plaza del Campidoglio, de día | `public/fotos/roma/dia_plaza_campidoglio.jpg` | no |
| Piazza Venezia, de día | `public/fotos/roma/dia_piazza_venezia.jpg` | no |
| Santa Maria in Aracoeli y su escalinata | `public/fotos/roma/dia_santa_maria_aracoeli.jpg` | no |
| Foros de Trajano (la Columna y los Mercados) | `public/fotos/roma/dia_foros_de_trajano.jpg` | no |

#### Día de las basílicas y el Aventino (4 días)

| Sitio | Archivo | ¿Hay ya? |
|---|---|---|
| ★ Santa Maria Maggiore | `public/fotos/roma/dia_santa_maria_maggiore.jpg` | no |
| ★ San Pietro in Vincoli (el Moisés) | `public/fotos/roma/dia_san_pietro_in_vincoli.jpg` | no |
| ★ San Juan de Letrán | `public/fotos/roma/dia_san_juan_de_letran.jpg` | no |
| Escalera Santa | `public/fotos/roma/dia_escalera_santa.jpg` | no |
| San Clemente (si es posible, las excavaciones de abajo) | `public/fotos/roma/dia_san_clemente.jpg` | no |
| Monti (la Piazza Madonna dei Monti o Via Panisperna) | `public/fotos/roma/dia_monti.jpg` | no |
| ★ Termas de Caracalla | `public/fotos/roma/dia_termas_de_caracalla.jpg` | no |
| ★ Circo Máximo | `public/fotos/roma/dia_circo_maximo.jpg` | no |
| ★ Boca de la Verdad | `public/fotos/roma/dia_boca_de_la_verdad.jpg` | no |
| Paseo por el Aventino (Santa Sabina, el Parque Savello; la Rosaleda en mayo y junio) — La Rosaleda solo en mayo y junio: si es otra foto, se dice. | `public/fotos/roma/dia_paseo_aventino.jpg` | no |
| Paseo por Testaccio (la Piazza Testaccio, el Monte dei Cocci y el antiguo matadero) | `public/fotos/roma/dia_paseo_testaccio.jpg` | no |

#### Medio día del Aventino y Testaccio (3,5 días)

| Sitio | Archivo | ¿Hay ya? |
|---|---|---|
| Mercado de Testaccio | `public/fotos/roma/dia_mercado_de_testaccio.jpg` | no |

#### Día de Villa Borghese, el Popolo y la Plaza de España (3 días)

| Sitio | Archivo | ¿Hay ya? |
|---|---|---|
| ★ Fontana de Trevi de día, sin gente — Ahora solo hay la de noche (noche_fontana_trevi.jpg), que no se toca. | `public/fotos/roma/dia_fontana_de_trevi.jpg` | no |
| ★ Plaza de España de día — Ahora solo hay la de noche. | `public/fotos/roma/dia_plaza_de_espana.jpg` | no |
| ★ Galería Borghese | `public/fotos/roma/dia_galeria_borghese.jpg` | no |
| ★ Piazza del Popolo de día | `public/fotos/roma/dia_piazza_del_popolo.jpg` | no |
| Santa Maria del Popolo (los Caravaggio) | `public/fotos/roma/dia_santa_maria_del_popolo.jpg` | no |
| Ara Pacis | `public/fotos/roma/dia_ara_pacis.jpg` | no |
| Via Condotti | `public/fotos/roma/dia_via_condotti.jpg` | no |
| Fuente del Tritón | `public/fotos/roma/dia_fuente_del_triton.jpg` | no |
| Via Veneto | `public/fotos/roma/dia_via_veneto.jpg` | no |
| Porta Pinciana | `public/fotos/roma/dia_porta_pinciana.jpg` | no |
| El reloj de agua del Pincio | `public/fotos/roma/dia_reloj_de_agua_pincio.jpg` | no |

#### La Vía Appia y Trastevere tranquilo (6 días en Roma)

| Sitio | Archivo | ¿Hay ya? |
|---|---|---|
| ★ Villa Farnesina (los frescos de Rafael) | `public/fotos/roma/dia_villa_farnesina.jpg` | no |
| ★ Catacumbas de San Calixto | `public/fotos/roma/dia_catacumbas_san_calixto.jpg` | no |
| ★ Vía Appia Antica (los pinos y las tumbas) | `public/fotos/roma/dia_via_appia_antica.jpg` | no |
| Trastevere tranquilo (la Piazza in Piscinula) | `public/fotos/roma/dia_trastevere_tranquilo.jpg` | no |

#### Medios días de 2,5 días

| Sitio | Archivo | ¿Hay ya? |
|---|---|---|
| Plaza del Quirinal, con la vista de San Pedro | `public/fotos/roma/dia_plaza_del_quirinal.jpg` | no |

#### Para más adelante

| Sitio | Archivo | ¿Hay ya? |
|---|---|---|
| El Puente y el Castillo de Sant'Angelo iluminados (otra distinta de la del Puente) — Solo si quieres una distinta de la del Puente. | `public/fotos/roma/noche_puente_castillo_sant_angelo.jpg` | no |

## Lo que queda abierto

Está todo en [PREGUNTAS_TANDA3.md](PREGUNTAS_TANDA3.md); lo que más pesa:

- **1.** D4 en lunes: queda un hueco entre las 12:00 y las 14:00 (Villa Borghese acaba a las 12:00 y el Pincio sigue a las 14:00).
- **3.** D6 en miércoles: «la Cúpula pasa al final o sale»: he elegido que sale (hueco de una hora a media mañana).
- **9.** La Domus Aurea en el D5: el documento dice dónde iría, pero no trae la tabla.
- **17.** 3,5 días con llegada por la tarde: pongo el medio día del Tridente hasta que se escriba «Llegada según la hora».
- **13.** Colle Oppio: sitio nuevo, con coordenadas aproximadas y un texto mío. Revísalos.
- **31.** Museos Capitolinos marcados en el pool: la comida cae a las 14:50 (restaurantes cerrados) y no sé qué quitar de la mañana.
- **27.** Distancias: 506 tramos corregidos corriendo horas (las tardes empiezan 5 a 25 min más tarde y en 36 tablas la cena sale hasta 45 min más tarde); la alternativa es recortar colchones y dejar la cena en su hora.

## Cómo volver a generar todo

```
node scripts/destino/escritosConvertir.mjs            # el documento → data/dias/roma/ (y DISTANCIAS_TANDA3.md)
node scripts/destino/fotosHuecos.mjs                  # los huecos de las fotos → _fotos.json y FOTOS_HUECOS.md
node scripts/destino/pruebaEscritos.mjs dias=3,3.5,4,5,6,pool,ft   # la prueba (cada tanda de viajes se puede probar por separado)
node scripts/destino/viajes36Motor.mjs                # la página de simulación
```

Después de tocar datos o el servidor, hay que **reiniciar el api-server** (lo reinicié y probé con peticiones reales: `/api/rebuild-day` con y sin «quedarme en Roma» y `/api/place-photo` con un hueco que se llena y se vacía).
