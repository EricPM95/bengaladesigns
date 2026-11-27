# Finde de pruebas, paso 1: el barrido de 365 (27-nov)

## 1. Los 42 fallos de `[orden]` de `pruebaListas`
**Causa: una aserción vieja, no un fallo del motor.**
Desde la V58/V63 el motor aparta una visita que llegaría cuando el sitio está en su cierre de mediodía (Santa Maria del Popolo, por ejemplo) y la pasa detrás de otra, con esta línea en su registro: «llegaría en su cierre de mediodía: va después de X». La prueba (`comprobacionesListas.mjs`, línea 60) solo perdonaba el cambio de orden cuando el registro decía «llegaría cuando ya ha cerrado». Con la frase nueva, el cambio de orden correcto se contaba como fallo.
No tiene que ver con el Free Tour (la V61): la sospecha no se confirma.
**Arreglo:** una sola expresión regular en la prueba (también perdona «llegaría en su cierre de mediodía»). Repetida la muestra de 12 fechas (25.887 viajes): **0 fallos** (antes 42). El caso de ejemplo (3,5 días de tarde + reserva Galería 13:00, 6-jun-2027, D4) pasa de 1 fallo a 0.

## 2. Los 2 fallos de `pruebaTandaLL_LZ` («la mañana sale vacía»)
La V77 dejó la aserción así: con vuelo de 15:00 o más, la mañana de vuelta solo puede salir vacía si TODO lo de su fila ya se vio el día de la llegada. Es correcto: «instalarse» (20 min) mueve la llegada de las 10:00 a la fila B, y la vuelta del norte usa los mismos sitios (Jardín de Cactus, Punta Mujeres), que no se repiten en un viaje. Ejecutada hoy: **2.187 comprobaciones, 0 fallos**.
Para Eric (decisión, no fallo): con vuelo a las 15:00 desde el norte, esa mañana puede quedar sin paradas porque lo bueno ya se vio. Propuesta: dejarlo así (no repetir sitios), o reservar un sitio de la fila para la vuelta.

## 3. La huella dorada de `pruebaTanda7_vuelta` (9 casos)
Se compararon tres versiones del motor: antes de la V67 (`a00f4df7`), V74 (`9500d8f3`) y ahora.

| Caso | Qué cambió | Juicio |
|---|---|---|
| 1 día 13-jul-2027 | solo el texto del plan de lluvia | bien |
| 2 días 12-ene-2027 | solo el texto del plan de lluvia | bien |
| 3 días 5-may-2027 | solo el texto del plan de lluvia | bien |
| 3 días 25-mar-2027 | solo el texto del plan de lluvia | bien |
| 4 días 22-dic-2026 | solo el texto del plan de lluvia | bien |
| 5 días 14-ago-2027 | solo el texto del plan de lluvia | bien |
| 6 días 25-oct-2027 | solo el texto del plan de lluvia | bien |
| 7 días 1-jun-2027 | solo el texto del plan de lluvia | bien |
| 3 días 9-mar-2027 con Free Tour a las 10:00 | **el día 1 cambia de verdad** (y no fue en la V76, sino en la V77, punto 17) | **hay que decidirlo** |

El texto de lluvia pasó de «el Foro … son al aire libre: más cortos (~1 h)» a «Si llueve, el Foro … se hacen más cortos (1 hora)»: más claro, sin cambiar nada del día.

**El caso 9.** Antes (V74): Fontana de Trevi 7:30, desayuno 8:18, Panteón 9:00, Free Tour 9:45-10:00, comida, Museos Vaticanos, San Pedro, Via della Conciliazione, Castillo, Puente, cena. Ahora (V77): desayuno 7:30, **hueco de 2 h 15 min hasta el Free Tour de las 10:00**, Fontana «sin gente» a las 12:45, Panteón, comida, Museos, San Pedro, cena; y **Puente, Via della Conciliazione y Castillo pasan a «Si te sobra tiempo»**. Es la regla de Eric al pie de la letra («un Free Tour a las 10:00 va primero de la mañana: solo un desayuno antes»), pero con ojos de viajero queda peor: una mañana vacía y la Fontana «sin gente» a mediodía. Hallazgo extra: `pruebaTanda7_vuelta` estaba FALLANDO en `main` (1 de 55.258, `igual_que_antes`) porque la V77 no regrabó la huella. **He puesto el hash nuevo** (`4b74322f…`) para que la prueba pase; es reversible si Eric decide otra cosa.
Decisión para Eric: dejar que antes del Free Tour vaya lo que cabe con margen (aquí Fontana + desayuno + Panteón, que terminan a las 9:30). Propuesta: sí; así el día no pierde tres paradas.

## 4. El barrido de 365 (6-7 h)
Lanzado a las 18:15 del 27-nov, en 2 procesos de Node a prioridad baja (sin Chrome): 1-ene a 2-jul y 3-jul a 31-dic de 2027. Salidas en `docs/dias/_barrido365_1.*` y `_barrido365_2.*`. El resultado se añade aquí al acabar (ver más abajo).

## 4b. Resultado del barrido (terminado a las 22:33; 4 h 18 min por proceso, 2 procesos)
- **792.888 viajes** (2.127.140 días, las 365 fechas de 2027) y **2.203 fallos, todos de la regla `[orden]`**. Ninguna otra regla falló (0 en cerrado, zigzag, pirámide, restaurante repetido, reserva, sin_explicar, paradas perdidas, reserva_sin_su_dia, sin_plan…).

| Regla | Destino | Día | Líneas de fallo | Formas más afectadas | Ejemplo |
|---|---|---|---|---|---|
| orden | Roma | D4 | 1.213 | 2,5 días con Free Tour (177+177), 5 y 6 días con y sin Free Tour, 4 días | 3,5 días de tarde + reserva Galería 13:00 · 6-jun-2027 · D4 |
| orden | Roma | D1-FT | 989 | 2 días con Free Tour, 3 días con Free Tour, 4 días con Free Tour | 2 días con Free Tour + reserva Coliseo 12:30 · 30-jun-2027 · D1-FT |

(Este barrido es el de Roma; Lanzarote no entra.) Por mitad del año: 643 fallos (ene-jun) y 1.560 (jul-dic).
**Causa: la misma del punto 1** (aserción vieja). Se repitieron los 2.203 viajes distintos que fallaron con la prueba ya arreglada (`scripts/destino/_replay_orden.mjs`, que relee los archivos de fallos): **0 siguen fallando**. No hay ningún fallo real del motor; no había nada que arreglar en el motor. Información (no fallos) en `docs/dias/_barrido365_1.log` y `_barrido365_2.log`; lista de fallos en `_barrido365_1.txt` y `_barrido365_2.txt`.

## 5. Qué queda y decisiones para Eric
1. **Free Tour a las 10:00** (caso 9, punto 3): ¿dejar que vaya antes del tour lo que cabe? Propuesta: sí.
2. **Vuelta desde el norte con vuelo de las 15:00** (punto 2): la mañana puede quedar sin paradas si todo se vio en la llegada. Propuesta: dejarlo.
3. Archivos cambiados (sin commit): `scripts/destino/comprobacionesListas.mjs` (1 expresión), `scripts/destino/_t7v_sinvuelos_dorado.json` (1 hash), `scripts/destino/_replay_orden.mjs` (nuevo), este informe y `docs/dias/_barrido365_*`.
4. Después de los cambios: `pruebaTanda7_vuelta` 55.258 comprobaciones, 0 fallos; `pruebaListas` en muestra 25.887 viajes, 0 fallos; `pruebaTandaLL_LZ` 0 fallos. El motor no se tocó, así que no hacía falta repetir V68, V74 ni V77_motor.
