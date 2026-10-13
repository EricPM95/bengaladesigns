# Tanda 7 · Matriz de filas por hora y punto

**De dónde salen los márgenes:** de `_llegada.json` y `DIAS_ROMA_PARADAS.md` («Las horas: libre y salir»).
- **Libre** = la llegada + `al_centro_min` + 30 min.
- **Salir** = la salida − `salir_antes_min`. En el barco, − (120 + 110).

**Cómo está hecha:**
- Las franjas las ha calculado un programa, minuto a minuto (`tools/matriz.py`, en el espacio de trabajo), y luego las he comprobado con la rejilla de 15 min.
- **No queda ningún minuto sin fila**, pero sí hay celdas con fila equivocada o sin regla, marcadas con *.
- La frontera es la que dice el documento: «cada tramo empieza en su hora». La he aplicado también a las tablas que no lo dicen (ver HUECOS 19).

## 1. Las filas

### La llegada (el día 1)
| Fila | Libre a las… | Qué ve el día 1 (`DIAS` 989–998) |
|---|---|---|
| R0 | llegada de 0:00 a 4:59 | día entero normal, desde las 9:00 (madrugada) |
| R1 | antes de las 13:00 | toda la ruta, con comida, cena y nocturna (si está libre antes de las 9:00, empieza a las 9:00) |
| R2 | 13:00 – 14:29 | comida nada más llegar e imprescindibles; cena y nocturna |
| R3 | 14:30 – 16:59 | imprescindibles sin comida; cena y nocturna (*la regla 6 ya dice 15:00, HUECOS 12a*) |
| R4 | 17:00 – 20:29 | desde Navona: Navona y el Panteón, cena, y de noche Trevi y la Plaza de España. Desde la Plaza de España: la Plaza de España y la Trinità, el Panteón, Navona y la cena, y de noche Trevi |
| R5 | 20:30 – 22:59 | Trevi de noche y su texto (*sin cena, HUECOS 12b*) |
| R6 | 23:00 – 23:59 | nada, con su texto |
| R6* | libre pasada la medianoche | **debería ser R6**; si el motor no corta en las 24:00, sale R1 (HUECOS 5) |

### El Free Tour sin reservar (`DIAS` 1017–1023)
| Fila | Libre a las… | Free Tour |
|---|---|---|
| FT10 | antes de las 9:30 | 10:00 |
| FT12 | 9:30 – 11:29 | 12:00 |
| FT15 | 11:30 – 14:29 | 15:00 |
| FT17 | 14:30 – 16:29 | 17:00 |
| FT-d2 | 16:30 o más tarde | el día 2 a las 10:00 (el día 2 es el D3 y el día 3 el D1-FT) |

**Avisos de esta tabla:**
- El margen es de 30 min, y la regla 4 dice 15 (HUECOS 9a).
- El 24, el 25 y el 31 de diciembre y el 1 y el 6 de enero solo hay a las 12:00 (HUECOS 9c).

### La vuelta (el último día; `DIAS` 921–947)
| Fila | Hora del vuelo, tren o barco / hora de salir | El último día | El día de antes |
|---|---|---|---|
| S0 | sale de 0:00 a 4:59 | solo el traslado («la noche anterior») | normal, **sin nocturna** (*¿la cena?*, HUECOS 6c) |
| S1 | sale de 5:00 a 8:59 | solo el traslado | normal, con nocturna |
| S2 | sale a las 9:00 o más tarde, y salir − 1:00 queda a menos de 3 h de las 9:00 (salir antes de las 13:00) | solo el traslado (salvo reserva grande: su bloque) | normal |
| S3 | salir de 13:00 a 14:29 | última mañana, **sin comida** | normal |
| S4 | salir a las 14:30 o más tarde | última mañana **con comida** | normal |
| S4* | salidas de tarde y noche (dentro de S4) | igual que S4: **la tarde y la cena sin regla** (HUECOS 4) | normal |

**Avisos de esta tabla:**
- S0 y S1 están escritas para los «vuelos». Aquí las aplico a todos los medios (HUECOS 6d).
- Lo que entra en S3 y S4 hoy se calcula con minutos. Hace falta escribirlo como tabla (HUECOS 3).

## 2. La llegada por punto (la hora de llegada que pone el viajero)

| Punto | Margen hasta estar libre | Franjas de llegada → fila |
|---|---|---|
| Fiumicino (avión) | +01:30 | 00:00–04:59 **R0** · 05:00–11:29 **R1** · 11:30–12:59 **R2** · 13:00–15:29 **R3** · 15:30–18:59 **R4** · 19:00–21:29 **R5** · 21:30–22:29 **R6** · 22:30–23:59 **R6*** |
| Ciampino (avión) | +01:20 | 00:00–04:59 **R0** · 05:00–11:39 **R1** · 11:40–13:09 **R2** · 13:10–15:39 **R3** · 15:40–19:09 **R4** · 19:10–21:39 **R5** · 21:40–22:39 **R6** · 22:40–23:59 **R6*** |
| Termini (tren) | +00:45 | 00:00–04:59 **R0** · 05:00–12:14 **R1** · 12:15–13:44 **R2** · 13:45–16:14 **R3** · 16:15–19:44 **R4** · 19:45–22:14 **R5** · 22:15–23:14 **R6** · 23:15–23:59 **R6*** |
| Tiburtina (tren) | +00:55 | 00:00–04:59 **R0** · 05:00–12:04 **R1** · 12:05–13:34 **R2** · 13:35–16:04 **R3** · 16:05–19:34 **R4** · 19:35–22:04 **R5** · 22:05–23:04 **R6** · 23:05–23:59 **R6*** |
| Tiburtina · Tibus (autobús) | +00:55 | igual que Tiburtina en tren |
| Civitavecchia (barco) | +02:30 | 00:00–04:59 **R0** · 05:00–10:29 **R1** · 10:30–11:59 **R2** · 12:00–14:29 **R3** · 14:30–17:59 **R4** · 18:00–20:29 **R5** · 20:30–21:29 **R6** · 21:30–23:59 **R6*** |
| Coche | sin hora | días enteros: el día 1 es el Centro entero, desde las 9:00 |

**Comprobado con la rejilla de 15 min:** 96 celdas por punto, 0 sin fila. Celdas R6*: Fiumicino 6, Ciampino 5, Termini 3, Tiburtina 3, Tibus 3 y Civitavecchia 10.

**Con una hora y sin punto elegido** no hay margen (HUECOS 16). La propuesta es la fila de Fiumicino en avión y la de Tiburtina en tren.

## 3. El Free Tour sin reservar, por punto (la hora de llegada)

| Punto | Franjas de llegada → hora del Free Tour |
|---|---|
| Fiumicino | 00:00–07:59 **10:00** · 08:00–09:59 **12:00** · 10:00–12:59 **15:00** · 13:00–14:59 **17:00** · 15:00–23:59 **día 2** |
| Ciampino | 00:00–08:09 **10:00** · 08:10–10:09 **12:00** · 10:10–13:09 **15:00** · 13:10–15:09 **17:00** · 15:10–23:59 **día 2** |
| Termini | 00:00–08:44 **10:00** · 08:45–10:44 **12:00** · 10:45–13:44 **15:00** · 13:45–15:44 **17:00** · 15:45–23:59 **día 2** |
| Tiburtina y Tibus | 00:00–08:34 **10:00** · 08:35–10:34 **12:00** · 10:35–13:34 **15:00** · 13:35–15:34 **17:00** · 15:35–23:59 **día 2** |
| Civitavecchia | 00:00–06:59 **10:00** · 07:00–08:59 **12:00** · 09:00–11:59 **15:00** · 12:00–13:59 **17:00** · 14:00–23:59 **día 2** |

**Cruces con la tabla de la llegada que no tienen regla:**
- **R2 con el tour de las 15:00** (Fiumicino 11:30–12:59, Termini 12:15–13:44…): la comida «nada más llegar» no cabe antes del tour (HUECOS 9e).
- **R1 con el tour de las 15:00** (Fiumicino 10:00–11:29): toda la ruta y el tour. No dice nada del orden del Pincio y el Popolo (HUECOS 9f).
- **El tour pasa al día 2** con una reserva grande el día 2 o el 3: el cambio movería un día reservado (HUECOS 9g).

## 4. La vuelta por punto (la hora de salida que pone el viajero)

| Punto | Margen | Franjas de salida → fila |
|---|---|---|
| Fiumicino | −03:00 | 00:00–04:59 **S0** · 05:00–08:59 **S1** · 09:00–15:59 **S2** · 16:00–17:29 **S3** · 17:30–23:59 **S4** |
| Ciampino | −02:50 | 00:00–04:59 **S0** · 05:00–08:59 **S1** · 09:00–15:49 **S2** · 15:50–17:19 **S3** · 17:20–23:59 **S4** |
| Termini | −00:45 | 00:00–04:59 **S0** · 05:00–08:59 **S1** · 09:00–13:44 **S2** · 13:45–15:14 **S3** · 15:15–23:59 **S4** |
| Tiburtina (tren y Tibus) | −00:55 | 00:00–04:59 **S0** · 05:00–08:59 **S1** · 09:00–13:54 **S2** · 13:55–15:24 **S3** · 15:25–23:59 **S4** |
| Civitavecchia | −03:50 | 00:00–04:59 **S0** · 05:00–08:59 **S1** · 09:00–16:49 **S2** · 16:50–18:19 **S3** · 18:20–23:59 **S4** |
| Coche | sin hora | el último día, como sin vuelos |

**Comprobado con la rejilla de 15 min:** 96 celdas por punto, 0 sin fila. Pero en S4, desde media tarde, el día queda vacío después de la comida y sin cena (HUECOS 4).

**Otras fronteras del día de vuelta**, con el mismo margen:
- **Ostia o Tívoli** el día de vuelta, «vuelo a las 18:00 o más tarde» (es decir, salir a las 15:00 o más tarde): Fiumicino desde las 18:00, Ciampino desde las 17:50, Termini desde las 15:45, Tiburtina desde las 15:55 y Civitavecchia desde las 18:50 (HUECOS 15b).
- **El último Leonardo Express** desde Termini es a las 23:05 y el primero a las 4:50. Con Fiumicino, salir antes de las 4:50 (vuelos hasta las 7:49) quiere decir que no hay tren (HUECOS 18c).

## 5. Qué día es cada uno, por duración del viaje

Con vuelos y con la vuelta en S3 o S4. «N días» quiere decir N días de ruta, como en el documento. La columna de la derecha es lo que pasa si se sigue la cuenta de la app (el último día de las fechas es el de vuelta que ella crea, `isReturnLeg`, ver HUECOS 1).

| Viaje | Según el documento | Según la app |
|---|---|---|
| 1 día (la misma fecha) | D0 entero con las dos barras, sin recorte (HUECOS 8a) | igual: con `answers.days = 1` la app no crea día de vuelta. Ojo: con «2 días» en el formulario la app da 1 día de ruta (D0) y 1 de vuelta |
| 2 días | día 1 llegada (el Centro por su fila) · día 2 D0-medio. Sin el Coliseo ni el Vaticano (HUECOS 8b) | día 1 D1, recortado por la llegada (*sin regla: la tabla es la del Centro*) · día 2 D2 entero · día 3 la vuelta (vacío; ahí iría la última mañana) |
| 3 días | día 1 llegada · día 2 D1 (con S0–S2, D0: HUECOS 8c) · día 3 D0-medio | día 1 llegada · días 2 y 3, D1 y D2 enteros · día 4 la vuelta (última mañana) |
| 4 días | llegada · D1 · D2 · día 4 = vuelta, DT-medio (sin interruptor) | llegada · D1 · D2 · interruptor (Roma = D4) · día 5 la vuelta (última mañana) |
| 5 días | llegada · D1 · D2 · interruptor (excursión por defecto) · día 5 DT-medio (con Roma: D4 el día 4, y el día 5 DA-medio) | llegada · D1 · D2 · interruptor (excursión) · D4 · día 6 la vuelta |
| 6 días | … · día 6 DA-medio (con excursión) o mañana del D6 (con Roma) | … · día 7 la vuelta |
| 7 o más | … · el último día, la mañana del D6, o la hoja «Ya has visto lo mejor de Roma» | … |

**En todos:** en la última mañana, la media mañana que toque, con lo visto el día 1 «de camino» (el DT-medio repite el Centro: HUECOS 13a). Con S2, solo el traslado. Con S0, el día de antes sin nocturna.

## 6. Reservas grandes en el día de llegada y en el de vuelta, por hora

| Dónde | Hora de la reserva | Qué dice el documento | Estado |
|---|---|---|---|
| Llegada | antes de estar libre | aviso «no llegas a tiempo» | ok, pero sin decir qué enseña el día (HUECOS 11f) ni con qué margen se compara (11e) |
| Llegada, libre en R0 o R1 | cualquiera | ese día pasa a ser el día escrito del sitio, con la lista de su hora, y se cambia con el Centro | sin regla para la Galería en 3 días (11a); repeticiones con el Centro (11c) |
| Llegada, libre en R2–R6 | después de estar libre | su bloque y el resto por la fila | sin orden escrito (11b) |
| Vuelta, S2–S4 | antes de salir | su bloque «si cabe» (cuenta al minuto) | va contra «sin cuentas» (HUECOS 3) |
| Vuelta | empieza antes de salir y acaba después | nada | hueco (11g) |
| Vuelta | después de salir | aviso, con la hora de salir calculada a la vista | texto que hay que cambiar (HUECOS 7) |
| Vuelta, S0 | cualquiera | el aviso miraría el día equivocado | hueco (6c) |
| Llegada o vuelta | dos reservas grandes | nada | hueco (11d) |
| Vuelta, miércoles | los Museos | bloque «Museos, Plaza y Basílica» contra «el miércoles, nunca antes de comer» | contradicción (11i) |

## 7. Cierres que caen en el día de llegada o en el de vuelta (con fechas)

| Fecha | Día de llegada (el Centro, todo por fuera) | Última mañana |
|---|---|---|
| Domingo | sin efecto | D0-medio ok; los Museos marcados: «Cerrado hoy» o al otro día (HUECOS 13d) |
| Lunes | sin efecto | DA-medio con su versión del lunes; la mañana del D6, el Castillo por fuera; la Galería reservada: aviso |
| Miércoles | sin efecto | D0-medio con su versión del miércoles; la mañana del D6, la Cúpula casi nunca entra (13e); bloque de Museos (11i) |
| 25-dic / Pascua | sin efecto (el Panteón ya va por fuera) | D0-medio en San Pedro con la plaza llena: sin versión (13c). El Free Tour solo a las 12:00 el 25 (9c) |
| 1-ene | sin efecto | Caracalla, el Castillo y el Cementerio Protestante cierran: «Cerrado hoy». El Free Tour solo a las 12:00 |
| Jueves y Viernes Santo | sin efecto | el D0-medio de mañana va por fuera: ok |
| Ferragosto (15-ago) | el Panteón cierra (ya va por fuera) | los Museos marcados cierran: «Cerrado hoy» |
| Días 2 y 3 cerrados los dos (25 y 26 de diciembre) | — | el cambio «con el día siguiente» puede caer en el día de vuelta (HUECOS 14) |
| Sin fechas | sin cierres de días ni de fechas | igual |
