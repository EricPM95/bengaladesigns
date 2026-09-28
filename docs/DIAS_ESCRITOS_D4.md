# D4 escrito: borrador para revisar (28 de septiembre de 2026)

El dato está en `data/dias/roma/D4.json` y el formato en `docs/DIAS_ESCRITOS_FORMATO.md`.

- **De dónde sale:** de D4 tal como lo monta hoy el motor en viajes de 4 días (enero, marzo, mayo y septiembre, entre semana y en domingo, completo y tranquilo). He cogido lo que funciona y lo he ordenado para que no dependa del sol ni del día de la semana.
- **Cómo he calculado las horas:** con la matriz de tiempos andando de la app. Son aproximadas: en la app las pondrá el motor.

## Qué cambia respecto a hoy

- **La Galería va siempre a las 11:00 por la mañana**, en las cuatro versiones y en los dos ritmos. Hoy va a las 11:00 en invierno, a las 15:00 en verano y a las 14:00 los domingos. Así las cuatro tardes quedan libres para el sol.
- **Santa Maria del Popolo va siempre por la tarde, a partir de las 16:30.** Así entra abierta entre semana (16:00-18:00) y en domingo (16:30-18:00) sin variante. Hoy, en septiembre, sale «Todavía no ha abierto» a las 12:45.
- **El Ara Pacis va en todas las versiones, con su entrada.** Hoy entra solo como relleno.
- **La tarde empieza siempre a las 14:45.** La comida llega hasta ahí: unos 80 min en el Tridente, en los dos ritmos.

## La mañana

| Completo | Tranquilo | Parada | Tipo |
|---|---|---|---|
| 08:30 | 09:30 | Fontana de Trevi, 25 min | **fija** (dos horas) |
| 09:00 | — | Desayuno romano, 20 min | opcional |
| 09:25 | — | Iglesia de San Ignacio, 15 min por dentro | opcional |
| 09:50 | 10:05 | Via Condotti (por el camino) | normal |
| 10:00 | 10:10 | Plaza de España, 15 min | normal |
| 10:15 | — | Trinità dei Monti, 10 min por dentro | opcional (el miércoles abre a las 12:00: por fuera) |
| 10:50 | 10:50 | llegar a recoger la entrada | |
| 11:00 | 11:00 | **Galería Borghese**, 120 min, entrada | **fija** |
| 13:20-14:45 | 13:20-14:45 | Comida: Edy (alternativa: Poldo e Gianna) | |

- **Títulos:** en completo, «Trevi sin gente, la Borghese y el Popolo»; en tranquilo, «Trevi, la Borghese y el Popolo».
- **Sugerencia en tranquilo:** en la Fontana de Trevi sale «¿Te animas a madrugar un día? A las 8:30 la tienes casi para ti».

## Las cuatro tardes (completo y tranquilo, iguales)

Horas para el sol del **centro** de cada versión. La **elástica** está en negrita.

| A · sol 17:10 | B · sol 18:12 | C · sol 19:15 | D · sol 20:17 |
|---|---|---|---|
| 14:50 Ara Pacis, 45 min | 14:50 Ara Pacis, 45 | 14:50 Ara Pacis, 45 | 14:50 Ara Pacis, 45 |
| 15:45 **Via Margutta y Via del Babuino, 40** | 15:45 **Via Margutta y Via del Babuino, 45** | 15:45 Via Margutta y Via del Babuino, 30 | 15:45 Via Margutta y Via del Babuino, 30 |
| 16:30 Piazza del Popolo, 10 | 16:35 Piazza del Popolo, 10 | 16:20 Piazza del Popolo, 10 | 16:20 Piazza del Popolo, 10 |
| 16:45 **Terraza del Pincio** 🌅 | 16:50 Santa Maria del Popolo, 30 | 16:35 Santa Maria del Popolo, 30 | 16:35 Santa Maria del Popolo, 30 |
| 17:25 Santa Maria del Popolo, 25 (bajando) | 17:25 Jardines del Pincio, 20 | 17:15 **El lago de Villa Borghese, 80** | 17:15 **El lago de Villa Borghese y un rato a la sombra, 110** |
| | 17:47 **Terraza del Pincio** 🌅 | 18:50 **Terraza del Pincio** 🌅 | 19:20 Jardines del Pincio, 30 |
| | | | 19:52 **Terraza del Pincio** 🌅 |

- **Cena en todas:** Il Gabriello (alternativa: Sgarro Bistrot).
- **Noche:** la escalinata iluminada, como hoy.

**Los bordes de cada versión.** He simulado el sol más temprano y el más tardío de cada versión:
- La elástica se queda entre −30 y +30 en todos los bordes.
- En los extremos de B y D se llega a la Terraza 4 min antes de la hora ideal, y en el de A, 1 min. Es margen de sobra, porque se puede llegar hasta 45 min antes.
- Ninguna versión deja un hueco.

## Variantes

- **Domingo:** Santa Maria del Popolo ya va a partir de las 16:30 en las cuatro tardes, así que no cambia el orden. Solo cambian los restaurantes: Edy e Il Gabriello cierran, así que se come en Poldo e Gianna y se cena en Sgarro.
- **Lunes:**
  - La Galería y la GNAM cierran, y el orden de los días ya evita D4 en lunes. Esto es por si no hay otro día.
  - La Galería se cambia por «El parque de Villa Borghese: Piazza di Siena y el lago» (120 min).
  - En las tardes C y D, el lago se cambia por los Jardines del Pincio como elástica.
- **Con Free Tour:** cambia solo la mañana, porque Trevi y la Plaza de España las enseña el tour. Queda Santa Maria della Vittoria, la Fuente del Tritón, Via Veneto, la Porta Pinciana (opcional) y la Galería a las 11:00. Las tardes, las mismas.

## Pool

- **Galería Borghese:**
  - Ya está: mañana, a las 11:00.
  - Si el viaje no tiene D4, va a D1 por la tarde a las 15:00 (como hoy, `pool_borghese`): el Panteón y Navona pasan a la noche.
  - Segundo sitio: D4M, mañana, a las 11:00, en lugar del Popolo (**por decidir**: ver pregunta 4).
- **Parque de Villa Borghese:**
  - En las tardes C y D ya está, como elástica. En A y B sustituye a Via Margutta como elástica, subiendo al Pincio.
  - Si el viaje no tiene D4, va a D4M, después de la Terraza del Pincio de la mañana (45 min).
  - Segundo sitio: D1 por la tarde, detrás de la Galería (solo si también va la Galería).

## Lo que hay que decidir o comprobar

1. **Santa Maria del Popolo en la versión A, del 5 al 12 de febrero** (sol 17:30-17:39). Bajando del Pincio se llega a las 17:56, y cierra a las 18:00. Opciones:
   - a) por fuera esos días, con su texto: lo pone `si_cerrado`;
   - b) mover el corte A/B a las 17:30, y B se queda en 75 min.

   **Recomiendo a.**
2. **La ficha del Parque de Villa Borghese dice 08:30-17:00.** El parque está abierto hasta el anochecer (ese horario parece de otra cosa: el Bioparco o la Piazza di Siena). Con la ficha como está, la prueba marcaría las tardes C y D. Hay que corregir la ficha antes de la prueba.
3. **Via Margutta como elástica en A y B:** en B llega a 75 min, y la auditoría actual pone 45 como máximo para una calle. En los días escritos, lo que manda es la elástica (±30).
   - ¿Te vale un paseo de hasta 75 min por Via Margutta, Via del Babuino y sus tiendas y galerías?
   - Si no, la elástica de A y B serían los Jardines del Pincio.
4. **Segundo sitio de la Galería en D4M:** D4M ya lleva el Pincio por la mañana. La Galería a las 11:00 obliga a pasar el Popolo y el Pincio a la tarde, y eso choca con Monti. Otra opción: segundo sitio en D1 por la mañana, en lugar del Foro. **Recomiendo** decidirlo con D4M escrito.
5. **Tranquilo:** con la Galería fija a las 11:00, la mañana tranquila acaba a la misma hora que la completa. La comida es igual de larga en los dos ritmos (unos 80 min). Tranquilo empieza una hora más tarde y quita tres paradas, pero no alarga más la comida. ¿Te vale así?
6. **El atardecer en la Terraza del Pincio** dura unos 40 min (llegar 25 min antes del sol y quedarse 15 min después), como hoy.
