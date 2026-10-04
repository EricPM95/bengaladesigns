# Reglas de las rutas

**Esta hoja manda** sobre cómo se monta una ruta, en todos los destinos. Viene de `docs/archivo/REGLAS_RUTAS_V2.md` (aprobada el 4-oct-2026) y del informe `docs/INFORME_REGLAS_RUTAS.md`.

- Las reglas van **en orden de importancia**: si dos chocan, gana la de arriba.
- Cada regla es **OBLIGATORIA** (si no se cumple, la prueba falla) o **PREFERENCIA** (la prueba solo avisa).
- Una regla nueva entra **en su sitio y quitando la que contradiga**, y se apunta en `docs/reglas/CAMBIOS.md` con su fecha.
- Cada regla lleva su ficha: **Texto**, **Ejemplo**, **Datos** (dónde vive en el JSON), **Comprobación** (el nombre exacto de la línea de la prueba) y **Sustituye a** (qué reglas de `INVARIANTES_MOTOR.md` deja sin efecto).
- La prueba (`node scripts/destino/prueba365.mjs`) imprime **una línea por regla**: «R-14: 0 fallos» o «SIN COMPROBACIÓN».
- Dónde va lo demás: ver el final de esta hoja.

---

## 0. Palabras (para que todos digamos lo mismo)

- **Sitio:** un lugar real con su `id` fijo en el JSON (`castillo_de_santangelo`, `puente_santangelo`). El nombre puede cambiar; el `id`, no. Dos sitios distintos tienen dos `id` aunque compartan ficha (el parque de Villa Borghese y su lago: `destination_config.sitios_extra`).
- **Parada:** lo que sale en el día con hora. Puede ser una visita, un paseo, una nocturna, un «De camino» o el Free Tour. El motor escribe en cada una su `site_id` y su `muestra`.
- **Muestra:** la lista de `id` de sitios que enseña una parada. «El Puente y el Castillo de Sant'Angelo iluminados» muestra `puente_santangelo` y `castillo_de_santangelo`. «Trastevere de noche» muestra `trastevere` y `plaza_trilussa`. Un paseo muestra lo que nombra su título (`destination_config.paseo_muestras`). El Free Tour muestra sus `covers`.
- **Grupo:** sitios que **nunca se separan** y cuentan como una sola visita (el Coliseo con el Foro y el Arco; Piazza Venezia con el Altar; la Plaza con la Basílica de San Pedro). En el JSON, `groups`.
- **Día:** lo que se recorre andando en una jornada. Puede llevar varios grupos seguidos.
- **Visita grande:** un grupo o un sitio con más de 90 min por dentro. El grupo entero cuenta como una.
- **Hora fija:** una hora que el viajero tiene comprometida. Hay tres clases en el dato (`hora_tipo` en los días escritos): **`reserva`** (una entrada con hora), **`turno`** (un turno con hora: Galería Borghese, Coliseo, Museos Vaticanos; y el Free Tour, que sale a una hora) y **`orientativa`** (una hora escrita sin compromiso: Trevi a las 8:30). Solo las dos primeras son fijas de verdad. Un vuelo, tren o barco también lo sería (pendiente, regla 28).
  - Una misa o un cierre **no** es hora fija: es una ventana en la que el sitio está cerrado (regla 1).
- **Nocturna:** una parada después de la puesta de sol pensada para ver un sitio iluminado (`night_experiences`).
- **Paseo:** «Pasea y piérdete por {zona}» (`destination_config.paseo_libre`).
- **De camino:** un sitio que se ve al pasar, sin parada larga (`modo: camino`, `pass_through`).

---

## 1. Lo que nunca se rompe

### R-1 · Nunca un sitio cerrado — OBLIGATORIA
- **Texto:** ninguna parada empieza antes de que abra ni después de su última entrada. Cuentan los horarios partidos, la última entrada por día, el horario por época, los cierres semanales, las misas, los festivos y los horarios especiales de ese año, sacados de la fuente oficial. **Sin fechas de viaje:** horario de laborable, y aviso en la parada si ese sitio cierra algún día de la semana.
- **Ejemplo:** el Foro y Palatino a las 15:30 el 24 de diciembre (abre hasta las 16:30) es un fallo si la parada dura más.
- **Datos:** `places[].schedule`, `by_day`, `by_period`, `closed_on`, `closed_dates`, `special_hours`, `last_entry`.
- **Comprobación:** `fuera_de_horario`, `v4_fuera_de_horario`, `cerrada_a_su_hora`, `v4_cerrado_sin_solucion`. La prueba incluye ya los viajes sin fechas.
- **Sustituye a:** 2, 3, 51, 92 y 470, que pasan a ser el detalle de esta regla.

### R-2 · Una hora fija no se mueve ni se quita — OBLIGATORIA
- **Texto:** si no cabe todo, se recorta lo de antes, en este orden: 1) salen las opcionales; 2) se encoge la parada elástica; 3) se acorta la comida, hasta 30 min; 4) se quita lo de menor nivel (primero el 3, luego el 2). Si aun así no cabe, sale un aviso en la campana. A una entrada reservada se llega **30 min antes**. Una hora **orientativa** no es fija: llegar unos minutos tarde no es llegar tarde.
- **Ejemplo:** Museos Vaticanos reservados a las 14:45: la comida de antes se acorta, la parada de la mañana se encoge, y la entrada sale a las 14:45.
- **Datos:** `hora`, `hora_tipo` (`reserva` | `turno` | `orientativa`), `llegar_antes`, `elastica`, `tipo` (`fija` | `normal` | `opcional`) en `data/dias/<destino>/D*.json`.
- **Comprobación:** `v4_llega_tarde`, `hora_fija_movida`. Falta comprobar el orden de recorte y que sale el aviso. **Vuelos, trenes y barcos:** pendiente del encargo de vuelos (hoy el motor no los recibe).
- **Sustituye a:** 427 (el «10 min antes»), 466 y 469.

### R-3 · El viajero manda
- **Texto:** lo que reserva, lo que marca en el pool y lo que cambia a mano entra siempre. El motor no rellena ni recoloca nada que haya tocado el viajero. Si su reserva coincide con un atardecer o una nocturna, ese día va sin ello, sin forzarlo y sin aviso.
  - **Empate entre el pool y un imprescindible de pago,** cuando no caben los dos por dentro: si el imprescindible **se ve bien por fuera** (el Coliseo, el Panteón), entra el extra del pool y el imprescindible va por fuera; si **por fuera no vale** (los Museos Vaticanos), el imprescindible se queda por dentro y el extra va a «No incluido». Las joyas nunca se pierden: como mínimo, se ven por fuera. **Sin avisos:** lo decidimos nosotros, y el viajero lo cambia desde la parada («Quiero entrar») o desde «No incluido».
- **Ejemplo:** el viajero marca las Termas de Caracalla y un día no cabe todo: el Panteón pasa a verse por fuera y las Termas entran.
- **Datos:** `pool_lista`, `minutos_fuera`, `por_fuera`, `pass_by` de cada lugar (lo que dice si «se ve bien por fuera»).
- **Comprobación:** `hora_fija_movida` (una reserva por franja en la prueba). El empate sale como información: `pago_cedido_al_pool`.
- **Sustituye a:** 285, 292, 305, 306, 345 y 457.

### R-4 · Los imprescindibles salen siempre — OBLIGATORIA
- **Texto:** primero las joyas, luego los imprescindibles. Nunca se quitan sin decirlo. Si uno no cabe o cierra, se ve por fuera si desde la calle se ve algo. Si no, va un aviso.
- **Datos:** `places[].level` (1 = imprescindible), `joyas`.
- **Comprobación:** `pago_sin_dentro`, `basilica_fuera`, `vaticano_sin_castillo`, `vaticano_sin_puente`. Falta comprobar que todo nivel 1 sale en cada viaje, por dentro, por fuera o con aviso.
- **Sustituye a:** 10, 11 y 31.

---

## 2. No repetir (lo que más se ve)

### R-5 · Un sitio, una vez en el viaje y una vez al día — OBLIGATORIA
- **Texto:** se compara por **`id` de sitio y por lo que cada parada muestra**, nunca por el nombre. Cuentan también las nocturnas, los paseos, los «De camino», el «iluminado» y el Free Tour. **Excepciones:** la revisita de paso de un nivel 1, por fuera, corta y con su texto («Ya lo viste el día 1…»); y la nocturna de la regla 6.
- **Ejemplo:** el Castillo por fuera a las 19:50 y «El Puente y el Castillo iluminados» a las 20:15 repiten el Castillo: el motor los funde en una sola parada de noche. El parque de Villa Borghese y «el lago y el Templo de Esculapio» son dos sitios.
- **Datos:** `places[].id`, `night_experiences[].muestra`, `destination_config.sitios_extra`, `sitios_por_titulo`, `paseo_muestras`, `night_view_overrides[].muestra`.
- **Comprobación:** `repetido_dia`, `repetido_viaje` (por `id`; cuentan nocturnas, paseos, «De camino» y «iluminado»).
- **Sustituye a:** 4 y la salvedad de la 467.

### R-6 · Las nocturnas — OBLIGATORIA
- **Texto:** cada nocturna, **una vez por viaje**. Va el mismo día que la visita de día de esos sitios **solo si esa visita fue por la mañana**, antes de las 13:00. Si fue por la tarde, la nocturna va otro día. Si algún sitio que muestra la nocturna salió esa tarde, la nocturna no va ese día. De noche, varios sitios pegados pueden ser **una sola parada** (el Puente y el Castillo iluminados). De día van por separado. **Una nocturna cada noche** mientras queden sitios que valgan la pena, aunque haya que cruzar la ciudad; si el viajero no quiere, la quita. El relevo de lo que solo vale antes de cenar (Trastevere de noche, tras el Janículo) es otra nocturna: no vuelve si ya salió.
- **Ejemplo:** Trevi a las 8:00 y su nocturna a las 22:00, el mismo día: bien. Trastevere a las 17:50 y «Trastevere de noche» a las 21:00: la nocturna va otro día.
- **Datos:** `night_experiences[].muestra`, `conflicts_with`, `si_no` (el relevo), `night_view_overrides[].nocturna`.
- **Comprobación:** `nocturna_repite`, `nocturna_repite_viaje`. «Una nocturna cada noche» no se comprueba.
- **Sustituye a:** 83, 96, 100 (el «o no sale»), 170, 190, 192, 204, 300 y **416**. Se queda la 462.

### R-7 · Un barrio, una vez al día — PREFERENCIA
- **Texto:** un paseo no enseña lo que ese día ya es parada (se compara por `muestra`, sea cual sea el paseo). Cada paseo, una vez por viaje **si queda otro paseo**. Si no queda, puede volver otro día, pero nunca el mismo. Si la parada de antes admite más tiempo, el rato va a esa parada en vez de repetir el paseo.
- **Datos:** `destination_config.paseo_libre.zonas`, `zone_walks`.
- **Comprobación:** `barrio_dos_veces`, `paseo_repite_viaje`, `paseo_misma_zona`.
- **Sustituye a:** 447, que pasa a valer para todos los paseos.

### R-8 · El Free Tour sustituye la parte del día que enseña lo mismo — OBLIGATORIA
- **Texto:** según la hora a la que sale: **de mañana** (antes de las 13:00) sustituye la mañana del centro; antes del tour, **Trevi a las 8:00 y el Panteón por dentro están bien**. **De tarde** (de 13:00 a 18:59) sustituye la tarde del centro, con el Panteón por dentro justo antes. **De noche** (desde las 19:00) sustituye la nocturna de ese día. Lo que el tour recorre no sale **después** del tour ese día. El tour no entra en los sitios. Los días sin tour y las horas especiales de festivo salen del dato del tour.
- **Datos:** `default_free_tour` (`covers`, `default_time`, `disponibilidad`), variantes `con_free_tour`.
- **Comprobación:** `tour_repite` (solo cuenta lo que sale después del tour).
- **Sustituye a:** 195, 413 (lo del Free Tour), 465 y 473.

---

## 3. Qué se ve en el viaje

### R-9 · Lo mejor, primero — PREFERENCIA
- **Texto:** las joyas, como tarde el día 3 (el día 2 en viajes de 2 días). Después, lo muy recomendable y lo distinto.
- **Datos:** `joyas`.
- **Comprobación:** `joya_tarde`.

### R-10 · Cada día tiene un sentido — OBLIGATORIA
- **Texto:** cada día es una zona que se recorre andando, con **una sola visita grande**. Cada entrada va con su grupo, y ese grupo marca su día. Un grupo nunca se parte entre días.
- **Datos:** `groups` (`inseparable`, `breakable_if_short`, `combined_duration_minutes`).
- **Comprobación:** `dos_visitas_grandes`, `grupo_partido`.
- **Sustituye a:** 14 y 34.

### R-11 · Según los días del viaje — OBLIGATORIA
- **Texto:** **1 día:** todo por fuera, salvo lo marcado en el pool. En Roma, sin Free Tour y sin pool, es un día escrito (`D0`): Roma Antigua y Centro por la mañana, Vaticano por fuera por la tarde y las fuentes iluminadas después de cenar; con Free Tour o con algo marcado en el pool se queda el reparto de antes (`short_trips`). **2 días:** por dentro solo lo que dice el destino o lo marcado; si se marcan dos visitas grandes, un día cada una. **Medio día:** sigue la regla de 1 día (pendiente del encargo de vuelos). **3 días o más:** el viaje completo. Las excursiones se **ofrecen** desde los días que marca el destino (`excursion_desde_dias`), y el botón del autobús sale desde otro dato (`excursiones_desde_dias`). Pasado el máximo de días del destino (`max_auto_days`), los días van en blanco.
- **Datos:** `short_trips`, `core_days`, `max_auto_days`, `destination_config.excursion_desde_dias`, `excursions.excursiones_desde_dias`.
- **Comprobación:** SIN COMPROBACIÓN propia. Los viajes de 1 día y sin fechas ya están en la prueba, pero ninguna línea mira «1 día, todo por fuera».
- **Sustituye a:** 338, 428 (la parte de los días), 449 y 450.

### R-12 · El pool entra primero — OBLIGATORIA
- **Texto:** en el orden en que el viajero lo eligió, con su grupo y en el sitio escrito de cada lugar. Cada extra va en **el día más cercano a su zona** (la distancia media a las tres paradas más cercanas de cada día; a igual distancia, el orden del fichero). Los extras van según los días: 2 días, 2; 3 días, 3; 4 días, 4; 5 o más, 5. Nunca va en un día en que ese lugar cierra. Lo que no cabe sale en «No incluido», con su motivo.
- **Datos:** `pool_lista`, `pool` de cada día escrito.
- **Comprobación:** `pool_fuera`. Falta comprobar el orden y el aviso.

### R-13 · Una experiencia elegida siempre añade algo que se nota — PREFERENCIA
- **Texto:** si no añade nada, no se ofrece.
- **Comprobación:** `experiencia_sin_efecto` (el mismo viaje con y sin la experiencia).

---

## 4. Las anclas del día: la comida y la cena

### R-14 · La comida, siempre — OBLIGATORIA
- **Texto:** **sin hora fija detrás:** de 45 a 90 min, en la zona donde estás. **Con hora fija detrás** (reserva o turno): se adapta, unos 30 min (algo rápido desde las 12:00) o una comida tranquila a las 14:30 o 15:00. El restaurante está a 15 min andando o menos y abierto ese día. Nunca el mismo restaurante dos veces en el viaje.
- **Datos:** `restaurants`, `hora_tipo` de la parada de después.
- **Comprobación:** `comida_menos_45`, `comida_mas_90`, `v4_comida_corta`, `restaurante_repetido`. Faltan el de 15 min andando y que esté abierto.
- **Sustituye a:** 36, 63, 64, 135, 157, 171, 177, 179, 235, 365, 392 y 408. Se quedan 460, 469 y 475.

### R-15 · La tarde acaba donde se cena — OBLIGATORIA
- **Texto:** la cena, nunca antes de las 19:30 (20:30 en verano), y a 15 min andando o menos de lo último. El rato antes de cenar es «Pasea y piérdete por {zona}». No existe el «Tiempo libre».
- **Comprobación:** `cena_espera`, `hueco_cena`, `tiempo_libre_sigue`. Faltan los 15 min y la hora mínima.
- **Sustituye a:** la familia del «Tiempo libre» y la «Tarde libre» (44, 102, 122, 129, 139, 156, 183, 194, 222, 240, 246, 263, 311, 317, 321, 328, 351, 370, 373, 375 y 384). Se quedan 341, 342, 352 y 419.

---

## 5. Cómo se ordena un día

### R-16 · La tarde va según la luz — OBLIGATORIA
- **Texto:** cada día tiene cuatro tardes (A, B, C y D) según la hora de la puesta de sol, con una parada elástica de ±30 min. Al mirador del atardecer se llega entre 15 y 35 min antes de que se ponga el sol.
- **Datos:** `tarde.A..D` y `elastica` de los días escritos; cortes de luz 17:40 / 18:45 / 19:45.
- **Comprobación:** `v4_elastica`, `atardecer_corto`, `atardecer_tarde`.

### R-17 · A primera hora, lo que luego se llena — PREFERENCIA
- **Texto:** madrugar está bien (Trevi a las 8:00).
- **Datos:** `destination_config.se_llenan` (Fontana de Trevi y Plaza de España).
- **Comprobación:** `se_llena_tarde`.

### R-18 · Primero el acceso, si se llega por su lado — OBLIGATORIA
- **Texto:** la plaza, el puente o el parque van justo antes de su monumento **cuando se llega desde ese lado**. Si se llega desde el otro lado, manda no ir y volver. Cada acceso lleva en el dato el lado desde el que se llega. Viniendo de San Pedro: Conciliazione, el Castillo (por fuera) y luego el Puente, que es el camino hacia el centro. Viniendo del centro: el Puente y luego el Castillo.
- **Datos:** `places[].approach_to` y `approach_lado` (`se_llega_por`, `monumento_antes_si_viene_de`).
- **Comprobación:** `plaza_despues` (mira el lado de llegada, en los dos sentidos).
- **Sustituye a:** 17b, 273 y la 416 (el orden).

### R-19 · Sin ir y volver — PREFERENCIA
- **Texto:** el recorrido no da vueltas ni zigzaguea. Un tramo de más de **25 min andando** va en bus o taxi si llega antes. Un traslado escrito no se usa si andando son 12 min o menos.
- **Comprobación:** `zigzag`, `tramo_largo`.
- **Sustituye a:** 29 y 364, que quedan dentro de esta.

### R-20 · Los huecos, según cuánto duran y qué viene después
- **Texto:** **hasta 30 min:** se estira la parada de antes, **si es de las que se disfrutan con calma** (plaza, parque, mirador, barrio, jardín); si es un sitio pequeño (una iglesia, una fuente), se hace lo de la línea siguiente. **Más de 30 min:** un sitio que pille de camino, que valga la pena, abierto, de esa zona y no visto antes; si no lo hay, el paseo de la zona. **Antes de una entrada reservada** (hasta 60 min): nada, es margen para llegar con calma. **Antes del atardecer:** el paseo por la zona del mirador. **Antes de cenar:** «Pasea y piérdete» por la zona de la cena. Una parada opcional nunca crea una espera ni sale cerrada.
- **Datos:** `elastica` de cada parada; `paseo_libre`; `zone_walks`.
- **Comprobación:** `hueco`, `libre_largo`, `libre_pisa_comida`.
- **Sustituye a:** 419 (es esta, con su orden) y 461.

### R-21 · La época del año — OBLIGATORIA
- **Texto:** **julio y agosto:** de 14:00 a 16:30, solo sitios a cubierto o descanso; lo que va al aire libre, después. **Invierno:** anochece pronto, pero las paradas siguen siendo paradas normales, con su foto de día; la cena no se adelanta por el sol. **Un mirador al que se llega de noche:** si el destino tiene una buena foto de noche de ese mirador, se llama «{lugar} iluminado», lleva esa foto y cuenta como la nocturna de ese sitio (regla 6); si no la tiene, sigue como parada normal con su foto de día. Es la única parada que cambia por la luz. Un solo camino para «iluminado», no dos.
- **Datos:** `destination_config.night_view_overrides` (`title`, `photo`, `muestra`, `nocturna`); en `writtenTrip.js`, `SUMMER_MONTHS = [7, 8]`.
- **Comprobación:** `verano_al_sol`; el «iluminado» se mira con `repetido_dia` y `nocturna_repite_viaje`.
- **Sustituye a:** 105, 186, 245, 290, 311, 315 y 328. De la 240 y la 246 se queda solo lo del mirador.

### R-22 · Horas de 10 en 10, a la más cercana — PREFERENCIA
- **Texto:** las duraciones, de 5 en 5. Las horas fijas y las paradas pegadas (a menos de 200 m) no se redondean.
- **Comprobación:** `hora_no_10`, `duracion_no_5`, `no_cuadra`.
- **Sustituye a:** 38, 238, 349, 363, 374, 375 y la sección F. Se queda la 454.

### R-23 · Mínimos y máximos — OBLIGATORIA
- **Texto:** un imprescindible, 20 min como mínimo. Un paseo, 90 min como máximo. Un «De camino», unos 10 min. Los minutos de «por fuera» no se recortan. La parada elástica no baja del 75 % de lo escrito.
- **Comprobación:** `duracion_corta`, `paseo_largo`, `fuera_minutos`, `v4_parada_corta`. (Ahora mismo, 284, 286, 329 y 348.)

---

## 6. Qué es una parada

### R-24 · Es parada: cada monumento o lugar de nivel 1 o 2, con su nombre — OBLIGATORIA
- **Texto:** se vea por dentro o por fuera. **No es parada:** una calle que no sea icónica (va en «Por el camino» o en el paseo de la zona); tampoco los restaurantes y las tiendas, que van dentro de la ficha. Las relaciones entre lugares mandan cómo se colocan: `contained_in` (lo de dentro solo sale con su contenedor), `neighbor_of` (el mismo día y seguidos), `approach_to` (el acceso, con su lado, regla 18), `related_to` (seguidos si caen el mismo día), `group_order` (el orden dentro del grupo).
- **Comprobación:** `nivel_camino`, `nivel_idea`.

### R-25 · Por fuera, solo donde se ve algo desde la calle — OBLIGATORIA
- **Texto:** va con su texto de `por_fuera`. Lo que solo vale por dentro, si cierra, se quita sin aviso. Lo que por fuera es un muro (los Museos Vaticanos) nunca va por fuera. Junto a un imprescindible, un sitio cerrado se ve por fuera. Lo que va por fuera a propósito (el Castillo de Sant'Angelo de día) no lleva «para llegar a todo» ni «Quiero entrar».
- **Datos:** `por_fuera`, `minutos_fuera`, `pass_by`.
- **Comprobación:** `fuera_sin_vista`, `fuera_minutos`, `fuera_con_tiempo`.
- **Sustituye a:** se quedan 421, 445, 452, 472 y 476.

### R-26 · Las variantes por cierre y por fecha, en este orden: primero el cierre, luego la fecha y luego lo que reparten dos días — OBLIGATORIA
- **Texto:** `si_cerrado` dice qué pasa: por fuera, quitar o cambiar. Los días que lo necesitan son el miércoles de audiencia, los domingos, el último domingo de los Vaticanos, Pascua, el 29 de junio y los festivos. **Navidad y fechas especiales:** la ruta se adapta a horarios, cierres y transporte, y lo dice en los avisos («un aviso, un tema»). Cuenta lo de temporada que ya está en la ruta (árbol, belenes, mercadillos y luces). Nada de eventos de una vez al año.
- **Datos:** `variantes` de los días escritos, `fechas_especiales`, `navidad_lineas`.
- **Comprobación:** `aviso_promete`, `aviso_lugar_ajeno`, `aviso_repetido`, `nota_promete`, y la sección «fechas clave» del informe de la prueba.
- **Sustituye a:** se quedan 347, 397, 399, 404 y 408.

### R-27 · Las excursiones — OBLIGATORIA
- **Texto:** nunca el día de llegada, el de vuelta ni el último día. Una excursión reservada fija su día. Los días sin excursión salen del dato (`excursion_fechas_no`).
- **Comprobación:** SIN COMPROBACIÓN en la prueba. (Hoy: 121, 362, 429 y 436.)

---

## 7. Llegada y vuelta (pendiente del encargo de vuelos)

### R-28 · Al llegar, se cuenta lo que pasa de verdad
- **Texto:** se cuenta salir del aeropuerto o la estación, el trayecto y dejar la maleta. El día de llegada no lleva nada con entrada. Si da para una parada antes de comer, **una sola**, cerca del alojamiento. Si no da, a comer directamente. Lo apuntado está en `docs/archivo/NOTAS_VUELOS_Y_HORAS_REALES.md`.
- **Datos:** `data/dias/<destino>/_llegada.json`.
- **Comprobación:** SIN COMPROBACIÓN en esta prueba (la mira `scripts/destino/llegadas.mjs`).

### R-29 · Al irse
- **Texto:** se sale con el margen del destino. Esa mañana, el desayuno y una parada cerca.
- **Comprobación:** SIN COMPROBACIÓN en esta prueba (la mira `scripts/destino/llegadas.mjs`).

---

## 8. Cómo se comprueba

### R-30 · La prueba imprime una línea por regla
- **Texto:** «R-14: 0 fallos», «R-17: SIN COMPROBACIÓN». Una regla sin comprobación sale marcada. La prueba cubre también viajes sin fechas, de 1 día y con reservas (una por franja).
- **Comprobación:** `scripts/destino/prueba365.mjs` y `scripts/destino/reglasPrueba.mjs` (qué línea mira cada regla).

### R-31 · Antes de dar un destino por bueno, los datos se cruzan solos
- **Texto:** `validar.mjs` comprueba que cada `muestra` existe, que ninguna nocturna deja de nombrar un sitio que enseña (aviso amarillo), que ningún `id` está repetido, y que cada título de paseo tiene su muestra. Al juntar o renombrar algo, se buscan todas sus referencias.
- **Comprobación:** `node scripts/destino/validar.mjs <destino>`, sección «Ids de sitio y muestras (regla 31)».

### R-32 · La revisión como un local
- **Texto:** una lista fija de 20 viajes, guardada en un fichero (de 1 a 7 días, las cuatro estaciones, con y sin Free Tour, con y sin entradas, y Navidad). Claude la revisa parada a parada antes de que el usuario vea nada.
- **Comprobación:** SIN COMPROBACIÓN automática (es una revisión a mano).

---

## 9. Dónde va lo demás

```
docs/REGLAS_RUTAS.md          ← esta hoja: manda
docs/reglas/CAMBIOS.md        ← el diario con fechas
docs/INVARIANTES_TECNICO.md   ← motor puro, un día por llamada, caché, API
docs/INVARIANTES_PANTALLA.md  ← la pantalla (por poner al día con el rediseño)
docs/INVARIANTES_DATOS.md     ← cómo es un destino: kit, validar.mjs, «comprobado», fotos, textos,
                                «nada inventado», restaurantes sin foto, todo lo que lee el viajero curado en el JSON
docs/historico/INVARIANTES_V3.md ← lo muerto (ritmos, bloques, días curados v3), «no vigente»
```

`INVARIANTES_MOTOR.md` queda en solo lectura, con un aviso arriba que apunta aquí. No se borra nada: lo vivo se mueve y lo muerto se archiva. Las reglas que esta hoja «sustituye» ya no están en los ficheros vivos: van a `docs/historico/INVARIANTES_V3.md` (que sí entra en git), con su número de siempre.

---

## Lo propio de Roma (datos, no reglas)

- **Joyas:** Coliseo, Museos Vaticanos con la Sixtina, Panteón y Trevi.
- **Imprescindibles:** Foro y Palatino, Arco de Constantino, Basílica y Plaza de San Pedro, Altar con Piazza Venezia, Castillo de Sant'Angelo, Navona, Plaza de España y Trastevere.
- **Castillo de Sant'Angelo:** de día, por fuera, 20 min. De noche, una parada con el Puente («El Puente y el Castillo de Sant'Angelo iluminados»).
- **Museos Vaticanos:** el último turno online es a las 16:00. Cierran los domingos, salvo el último del mes (gratis, sin reserva y con cola).
- **Panteón:** misa a las 17:00 los sábados y vísperas, y a las 10:30 los domingos y festivos (son ventanas cerradas, regla 1).
- **El 29 de junio:** horario de domingo.
- **Viaje de 2 días sin nada marcado:** el Coliseo con el Foro y el Panteón por dentro.
