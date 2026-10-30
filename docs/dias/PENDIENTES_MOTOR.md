# Pendientes del motor de rutas (apartados de las pruebas)

Casos concretos que hoy no encajan con lo que el motor hace (o no hace) y que **se miran en la próxima tanda del motor**. No cuentan como fallo en las pruebas, pero cada pasada los imprime en amarillo como `PENDIENTE DEL MOTOR [clave] N casos: motivo` y la última línea de cada prueba es `pendientes_motor: N` (lo recoge el runner de la batería; el módulo es `scripts/destino/_pendientesMotor.mjs`). Apuntado el 30-oct-2026 (tanda 10S, agente A2). No se ha tocado el motor.

Prioridad por el orden en que Eric pidió el diagnóstico.

## 1. Catacumbas de San Calixto cerradas en viajes sin fechas (prioridad 1)

**DECISIÓN DE ERIC (30-oct, 10S2): evitarlas** cuando el viaje —o su mes, si no hay fechas— cae en el cierre (del 13 de enero al 10 de febrero): que el motor no las ponga en D7 (ni en ningún día) esos días, y que la prueba lo exija. Se hace en la próxima tanda del motor; hasta entonces los 12 casos siguen apartados como «PENDIENTE DEL MOTOR» en amarillo.
- **Caso:** 6 casos en `pruebaTanda7_llegada` (matriz de 1500 viajes, solo los de «mes sin fechas», enero) y 2 en `pruebaTanda7_integracion`: viajes de 6 y 7 noches con D7 el «2027-01-15». Clave: `catacumbas_cerradas_viaje_sin_fechas`.
- **Evidencia:**
  - `data/pipeline_v2/roma.json`: Catacumbas tiene `closed_dates: ["01-01","easter","12-25","2027-01-13..2027-02-10"]` (desde el 8-oct, commit 3f84d938).
  - Un viaje solo con el mes no tiene fechas reales: `plan.calendar = { hasDates: false, month: 0, season: 'invierno', referenceIso: '2027-01-15' }` y todos los días llevan esa fecha de referencia (el día 15).
  - `shared/routeEngine/listasTrip.js` línea 171 llama a `closedOnDay(place, hours.weekday, calendar.hasDates ? hours.dateIso : null)`: sin fechas, el motor NO aplica los cierres por rango. La comprobación de la prueba (`comprobacionesListas.mjs`) sí lo aplicaba con la fecha de referencia.
  - Antes de la Tanda 11 no salía: la tabla de 6 y 7 noches llevaba D6 y no D7 (D7 lleva las Catacumbas). Desde la Tanda 11 (22-oct, Eric) lleva D7.
  - Con el motor sin tocar, `escritoRows` pone «Catacumbas de San Calixto» a las 14:00 con «abre a las 14:00: se espera 12 min» y `cerrado_este_dia: false`.
- **Pregunta para el motor:** ¿un viaje de solo-mes en enero debe evitar el D7 / avisar, sabiendo que el cierre cubre del 13-ene al 10-feb (casi todo el mes)? Hoy no hay ni aviso.
- **Mirar en la próxima tanda del motor.**

## 2. «Viaje 11 · día 1» no cabe por 105 minutos (prioridad 2)
- **Caso:** `pruebaTanda7_respuestas`, sección 7 «no cabe». Viaje 11 de la revisión (3 días, desde 2026-10-21, Free Tour a las 19:00). Clave: `viaje_11_no_cabe`.
- **Evidencia:**
  - Motor de antes (`git archive fe6c3d5a^`): D1 sin aviso; la «Iglesia del Gesù» pasaba a «Si te sobra tiempo» («no cabe en la tarde») y Piazza Navona iba antes del Free Tour.
  - Motor de ahora: el D1 mantiene el Gesù (17:23, nivel 2, `Iglesia del Gesù` al final del D1) y lleva Free Tour 18:45-19:00, Navona a las 21:30 y cena 22:19; `spareRows` vacío. El registro dice 5 veces `aviso | no cabe del todo (105 min de más) y no queda nada que quitar sin romper una comprobación`.
  - Causa probable: Tanda 11, «imprescindibles intocables» (commit fe6c3d5a): nada de la lista del día se manda a «Si te sobra tiempo». El aviso existe desde el 6-oct (commit 8943167f).
- **Dos cosas para el motor:** (a) si 105 min de más es aceptable con Free Tour a las 19:00 en D1, o hay que recortar algo; (b) el mismo aviso se apunta 5 veces en `escritoLog`.
- **Mirar en la próxima tanda del motor.**

## 3. Al llegar a las 16:30, el motor reordena la lista del D1 (prioridad 4)
- **Caso:** `pruebaTanda7_llegada`, sección 2 (lista exacta): «verano · centro · llega 16:30» y «invierno · centro · llega 16:30», lista `D1-centro-navona`. Clave: `orden_por_cierre_al_llegar`.
- **Evidencia:** la lista escrita es Navona > Panteón > Trevi > Via Condotti > Plaza de España > Trinità dei Monti; el motor da Navona > Panteón > Trevi > **Trinità dei Monti** > Via Condotti > Plaza de España, con la línea de registro `orden | Escalinata y Trinità dei Monti llegaría cuando ya ha cerrado: va antes de Via Condotti (un rodeo de 3 min): lo que cierra antes, primero`. Trinità cierra a las 19:45 (`windows: 10:15-19:45`). Es la regla de la Tanda 11 («rodeo para no llegar cerrado», punto 13); `comprobarViaje` ya la admite, la comprobación de la lista escrita aún no.
- **Probablemente solo falte actualizar la comprobación** (no el motor), pero Eric dijo que se mire con el motor.
- **Mirar en la próxima tanda del motor.**

## 4. D6 «Roma desde arriba» ya no sale en las tablas (prioridad 3) — confirmado, no es un pendiente
- `data/pipeline_v2/roma.json › curated_routes › _nota_tanda11`: «Tanda 11 (C8, Eric 22-oct-2026): Roma lleva 5 días curados (Roma antigua, Vaticano, Centro y Villa Borghese, Basílicas y el Aventino y la Vía Appia); desde el 6.º día de ciudad, día en blanco («Ya has visto lo mejor de Roma»). Roma desde arriba (D6) se queda en los datos, sin tabla: se ofrece en el día en blanco («¿Te lo organizamos?»).» Fue a propósito; por eso las pruebas de la 10S esperan D7 en lugar de D6.
