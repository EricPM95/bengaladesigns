# Informe de la tanda 2: cerrar los viajes de 1, 1,5, 2 y 2,5 días

Todo hecho de principio a fin, sin parar a preguntarte. **No he hecho push**: hay commits locales por bloques (`2a63cf1` datos, `945f6c3` motor, `4bcd4f6` atardecer y la página del motor, `01d517f` formulario y revisión, `6dfaf90` ajustes y preguntas, y el último, con este informe). Lo que he decidido yo, marcado como provisional, está en **[PREGUNTAS_TANDA2.md](PREGUNTAS_TANDA2.md)** (32 puntos, cada uno con el porqué y qué pasa si prefieres otra cosa).

## Qué he hecho

1. **El documento nuevo, tal cual, a `data/dias/roma/`.** Las 62 tablas se copian por número, y si el documento cambia de orden el convertidor lo dice en vez de copiar una tabla equivocada. Días nuevos: **D1-corto** (día entero de 1,5 días, todo por fuera), **DT-medio** (Tridente y Pincio, de mañana y de tarde A de invierno, A, B, C y D), **DM-medio** (Monti). El **D0-medio** ahora es por fuera y solo lleva los Museos con reserva o pool. Dos sitios nuevos en `roma.json`: la *Plaza del Quirinal* y *Via dei Coronari* (revisa sus textos).
2. **Qué sale en cada viaje.** 1 y 1,5 días: todo por fuera y lo del pool (o reservado) por dentro, y es la prioridad, hasta quitar un imprescindible si no cabe. 2 días: todos los imprescindibles. 2,5 días: los dos días enteros del de 2 días y un medio día (Tridente y Pincio; con Free Tour de mañana y salida por la mañana, Monti). **El Free Tour no se ofrece en 1 ni 1,5 días**: el formulario lo quita y el motor lo ignora aunque llegue marcado.
3. **Orden de los días.** Si un día cae en una fecha que le va mal y se puede cambiar con otro, se cambian: al Vaticano (D2, D3) el domingo, el miércoles (solo al D2) y cualquier cierre de los Museos; al Día de la Roma antigua (D1, D1-FT), el 2 de junio y el 25 de diciembre. El 25 de diciembre y el 1 de enero, el D1 pasa a D1-corto y el D2 usa la tabla de fiesta. Los avisos «Hemos puesto el Vaticano otro día» los he comprobado en las 365 fechas y los cinco tipos de viaje: **0 avisos falsos**.
4. **Pool** con las tablas escritas (Galería Borghese, Ojo de la Cerradura, San Juan de Letrán, Parque de Villa Borghese) en el D1, el D1-FT, el DT-medio y el DM-medio, y lo marcado que el día ya lleva por fuera pasa a ir por dentro.
5. **Restaurantes.** Cada comida y cena lleva su alternativa (y la tercera donde la hay) y se mira que el restaurante esté abierto **ese día y a esa hora**; si todavía no ha abierto, la cena se retrasa hasta 30 min; si no hay ninguno, otro de la zona, apuntado en el registro. Notas de reserva en Nochebuena, Navidad y Nochevieja.
6. **Reglas nuevas:** la hora límite de la noche (23:00; de mayo a septiembre y con el sol después de las 19:45, entra si empieza a las 23:45); la nocturna que se adapta a lo que ya ha salido (Trevi, Plaza de España, Coliseo, Trastevere de noche); el Panteón y las joyas que cierran antes (mejor por dentro con 20 min que por fuera, y se adelantan aunque se ande hasta 15 min de más); la cena como mucho a las 22:00; colchones con el texto de lo que hay dentro, y el motor avisa en su registro si uno pasa de 2 horas.
7. **Ajuste al atardecer** a la manera de la simulación: alarga el colchón de antes para llegar con el sol (o lo mete, en la tarde A de invierno del Tridente), y si el sol se pone antes, lo acorta; la cena y la noche siguen al mirador.
8. **«No incluido»:** el motivo solo sale si es un cierre o un festivo («Cerrado el lunes», «Cerrado el 25 de diciembre»). La pantalla ya no se rompe con un motivo vacío.
9. **Formulario** (punto 11): pregunta nueva «¿Cómo son tus días?» (con 3 o 4 días) para el medio día, y la franja del Free Tour (mañana 10:00, tarde 17:00, noche 18:30), conectadas a `mediaJornada` y `freeTourDespues`. **Probado en el navegador** (paso Experiencias con un viaje de 3 días: salen las pastillas; con «Un día y medio» el Free Tour desaparece de la lista y se desmarca; con el Free Tour marcado salen sus tres franjas). **`/api/rebuild-day` va**: lo probé con `curl` y desde el navegador (la app, a través de su proxy) con una reserva del Coliseo a las 10:30 y con el medio día; responde 200 y rehace el día en torno a esa hora.
10. **Un fallo mío de la tanda 1, arreglado:** el D3 «C y D» salía sin mañana (la tabla del documento empieza en el bus al Vaticano y yo la copié sola). Ahora lleva la mañana de A y B hasta la comida.

## La prueba contra el documento

`node scripts/destino/pruebaEscritos.mjs` (parada a parada, las 365 fechas de 2027; cada diferencia necesita una causa apuntada por el motor, si no es un fallo). Resultados completos en [PRUEBA_ESCRITOS.md](PRUEBA_ESCRITOS.md) y [PRUEBA_ESCRITOS_POOL.md](PRUEBA_ESCRITOS_POOL.md).

| | Viajes | Días comparados | Filas del documento | Diferencias | **Sin explicar** |
|---|---|---|---|---|---|
| Sin pool | 1 día, 1,5 (tarde y mañana), 2 y 2,5 días (con y sin Free Tour) | 7.613 | 115.218 | 15.991 | **0** |
| Con pool y con Free Tour de tarde y de noche | 2, 2 con Free Tour y 2,5 días con cada extra con tabla; 1 y 1,5 con Coliseo o Museos | 13.503 | 200.743 | 53.154 | **0** |

Las diferencias explicadas son casi todas el ajuste al atardecer (el sol no se pone igual todo el año), los cierres (la regla de cierres), las nocturnas que cambian por lo ya visto y, con un extra del pool, las horas que salen de los márgenes (el documento lo dice: «Pool y experiencias: cómo se calculan las horas»).

Otras comprobaciones, en las 365 fechas:

- **Qué días lleva cada viaje y en qué orden:** 0 fallos (con empates entre dos órdenes igual de malos: valen los dos).
- **Restaurantes:** de **12.775 comidas y cenas** (sin pool) y **24.090** (con pool), **0 caen en un restaurante cerrado** ese día o a esa hora y 0 se quedan sin restaurante. En 1.255 y 2.092 casos va la alternativa (o, si no hay otra, uno de la zona), siempre con la causa en el registro.
- **Cenas después de las 22:00:** 0.
- **Colchones de más de 2 horas:** 0 sin pool. **79 con la Galería Borghese en el medio día de tarde (C y D)**: del 11 de mayo al 10 de agosto, hasta 155 min en Villa Borghese (pregunta 24).
- **Avisos «Hemos puesto el Vaticano otro día»** en un día del Vaticano: 0.

### Qué lista uso para «imprescindible», y cuáles no salen

La lista es el **nivel 1 de `roma.json`**: Coliseo, Foro Romano y Palatino, Arco de Constantino, Fontana de Trevi, Panteón, Piazza Navona, Plaza de España, Plaza de San Pedro, Basílica de San Pedro, Museos Vaticanos y Altar de la Patria. (El documento cita también Trastevere —nivel 2— y el Castillo, por fuera; salen siempre.) **Lo que no sale en ningún viaje de 1, 1,5 o 2 días:**

- **1 día:** la Plaza de España (365 fechas: el documento dice que no cabe con los márgenes) y los Museos (por diseño: todo por fuera).
- **1,5 días:** los Museos (por diseño) y, **con la llegada por la tarde, la Plaza de España en 194 fechas**: del 27 de marzo al 4 de octubre de 2027 y el 23 y el 30 de diciembre. Con la llegada por la tarde y el D1-corto tarde D, el día entero no lleva nocturna y la nocturna del medio día es Trevi, así que no queda sitio. **Es tu pregunta 7 del encargo: la Plaza de España no sale ese día**; opciones en la pregunta 30.
- **2 días:** los Museos en 8 fechas (cierres: domingos y festivos sin otro día que valga), la Basílica los días 24 y 25 de diciembre y la Plaza de España el 24 de diciembre (Nochebuena: solo Trevi de noche). Con Free Tour de mañana, los Museos en 8 fechas y la Basílica el 26 de marzo y el 31 de diciembre.
- **2,5 días:** igual que el de 2 días (los Museos 8 o 9 fechas y la Basílica en 2 o 3).
- **Cena después de un Free Tour tardío (a las 17:00 y a las 18:30):** ninguna pasa de las 22:00 (pregunta 8 del encargo).
- Con el pool, además: el Foro en el viaje de 1 día con el Coliseo marcado (la ruta del revés no lo lleva) y la Plaza de España en el D1 tarde D con la Galería (la tabla lo quita: pasaría de las 23:00).

## Los cinco viajes de 2,5 días de la simulación (viajes 19 a 23)

El motor los saca en [VIAJES_2_5_MOTOR.html](VIAJES_2_5_MOTOR.html), la misma página que la simulación (barra horaria, paradas, el porqué y, en amarillo, lo que el motor cambia con su causa). Para volver a generarla con otras fechas:

```
node scripts/destino/viajes25Motor.mjs
node scripts/destino/viajes25Motor.mjs viaje="verano|Verano|2027-07-15|tarde|0||"
```

Comparados parada a parada con la simulación ([VIAJES_2_5_DIFERENCIAS.md](VIAJES_2_5_DIFERENCIAS.md)): **32 diferencias en 5 viajes, 31 con causa apuntada y 1 sin ella**. En palabras:

- **Otoño:** igual que la simulación, parada a parada (los tres días).
- **Primavera, con Free Tour de mañana:** el D3 y el DM-medio, iguales. En el Día de la Roma antigua y Trastevere (tarde D) el motor deja el Tempietto **por fuera** (el Tempietto ya está cerrado a las 18:20: la simulación lo tenía por dentro a esa hora, que no se puede) y el Mirador, la cena y Trevi salen 5-10 min más tarde que en la simulación.
- **Invierno, verano y Navidad:** las diferencias son de 5 a 10 min por los márgenes (el motor calcula el andar con la matriz real) y por el atardecer (en el verano el colchón de Villa Borghese llega a 110 min, la simulación 115). La nocturna del Coliseo del jueves de julio **sí entra** (a las 23:50: 5 min de margen sobre las 23:45). En Navidad, Mercadillos mueve 5 min lo que viene detrás.
- **La única sin causa apuntada:** el verano, Campo de' Fiori. La simulación lo alarga 5 min (20 → 25) para llegar al sol; el motor espera 5 min antes del Ponte Sisto. En pantalla es lo mismo; en la tabla, no.

## Revisión

[REVISION_TANDA1.md](REVISION_TANDA1.md) regenerada: los **10 viajes de la tanda 1** y los **13 nuevos** (11 a 23), con la columna «Cambio» sacada del registro del motor. 0 filas sin causa apuntada. **Dos avisos sobre los viajes que pediste:** el viaje 14 («martes 24 y miércoles 25-12-2027»): el 24 de diciembre de 2027 es **viernes** y el 25 **sábado**; los he sacado con las fechas reales. Y el viaje 13 («medio día de tarde el miércoles 13-10»): el medio día de tarde era siempre el de llegada; he añadido la opción de un medio día de tarde **al final** (`mediaJornada.posicion`), que el formulario no ofrece.

## Lo que queda abierto

Está todo en [PREGUNTAS_TANDA2.md](PREGUNTAS_TANDA2.md); lo que más pesa:

- **30.** Plaza de España en el 1,5 días con llegada por la tarde: 194 fechas sin ella.
- **24.** Colchón de Villa Borghese de más de 2 horas con la Galería en el medio día de tarde (79 fechas).
- **2.** Medio día de mañana del miércoles: lo derivo yo, el documento ya no trae tabla.
- **10.** El día de crucero con los Museos marcados: no hay tabla escrita.
- **4.** Textos de la Plaza del Quirinal y de Via dei Coronari: escritos por mí, a revisar.

## Cómo volver a generar todo

```
node scripts/destino/escritosConvertir.mjs        # el documento → data/dias/roma/
node scripts/destino/pruebaEscritos.mjs            # sin pool, 365 fechas (dias=pool,ft para el pool y el Free Tour de tarde y de noche)
node scripts/destino/revisionTanda1.mjs            # REVISION_TANDA1.md (23 viajes)
node scripts/destino/viajes25Motor.mjs             # VIAJES_2_5_MOTOR.html y VIAJES_2_5_DIFERENCIAS.md
```

Recuerda **reiniciar el `api-server`** si cambias `roma.json`, `data/dias` o `server/`.
