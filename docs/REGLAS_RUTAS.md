# Reglas de las rutas

**Esta hoja manda** sobre cómo se monta una ruta, en todos los destinos. Viene de `docs/archivo/REGLAS_RUTAS_V2.md` (aprobada el 4-oct-2026) y del informe `docs/INFORME_REGLAS_RUTAS.md`.

- Son **15 reglas**, en orden de importancia: si dos chocan, gana la de arriba. Antes eran 46: la tabla del final dice dónde fue cada una.
- Cada regla es **OBLIGATORIA** (si no se cumple, la prueba falla) o **PREFERENCIA** (la prueba solo avisa).
- Una regla nueva entra **en su sitio y quitando la que contradiga**, y se apunta en `docs/reglas/CAMBIOS.md` con su fecha.
- Cada regla lleva su **Texto**, sus **Datos** (dónde vive en el JSON) y su **Comprobación** (el nombre exacto de lo que cuenta la prueba).
- La prueba (`node scripts/destino/prueba365.mjs`) imprime **una línea por cada una de las 15 reglas**: «R-8: 0 fallos» o «SIN COMPROBACIÓN». Cómo se comprueba, al final.
- Dónde va lo demás: ver el final de esta hoja.
- **Alcance desde la tanda 1 (4-oct-2026):** en los seis días escritos de Roma (D0, D0-medio, D1, D2, D3, D1-FT: viajes de 1, 1,5 y 2 días) el motor ya no guía. Las horas son las de `docs/dias/DIAS_ESCRITOS_ROMA.md`; solo se ajusta lo que ese documento dice en «Lo que hará el motor» (cierres, misas, festivos, miércoles, domingo, reservas, pool, experiencias, Free Tour) con la regla de márgenes. Estas 15 reglas siguen valiendo para lo que el motor todavía hace: cierres (adelantar, acortar hasta 20 min, por fuera o quitar), márgenes, hora límite de la noche, no repetir sitios entre días, el pool y la prueba. En esos seis días no se estiran paradas, no se rellenan huecos, no se reordena ni se eligen nocturnas, y no hay cena con hora límite. Lo que un día escrito enseña se quita siempre del día de los de siempre que lo repita.

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

## Las 15 reglas

### 1. Nunca un sitio cerrado — OBLIGATORIA
- **Texto:** ninguna parada empieza antes de que abra ni después de su última entrada. Cuentan los horarios partidos, la última entrada por día, el horario por época, los cierres semanales, las misas, los festivos y los horarios especiales de ese año, sacados de la fuente oficial. **Sin fechas de viaje:** horario de laborable, y aviso en la parada si ese sitio cierra algún día de la semana. La víspera de un festivo con misa (el Panteón, 17:00) se lee como un sábado.
- **Si una parada choca con un cierre,** por este orden: 1) **adelantar** dentro del mismo día; 2) **acortar** para que termine antes del cierre, con un **mínimo de 20 min** (vale para toda visita por dentro); 3) **por fuera**, si desde la calle se ve algo; 4) **quitar**, si solo vale por dentro. **Un imprescindible, como mínimo, por fuera, si desde la calle se ve algo; si no (los Museos Vaticanos), va a «No incluido».** Primero las joyas, luego los imprescindibles.
- **Por fuera, solo donde se ve algo desde la calle:** va con su texto de `por_fuera`. Lo que por fuera es un muro (los Museos Vaticanos) nunca va por fuera: va a «No incluido». Si solo vale por dentro y cierra, se quita sin aviso. Junto a un imprescindible, un sitio cerrado se ve por fuera. Lo que va por fuera a propósito (el Castillo de Sant'Angelo de día) no lleva «para llegar a todo» ni «Quiero entrar». Por fuera no depende del horario del sitio, salvo que esté dentro de un recinto que cierra (`recinto_cierra`).
- **Ejemplo:** el Foro y Palatino a las 15:30 el 24 de diciembre (abre hasta las 16:30) es un fallo si la parada dura más.
- **Datos:** `places[].schedule`, `by_day`, `by_period`, `closed_on`, `closed_dates`, `special_hours`, `last_entry`, `level`, `joyas`, `por_fuera`, `minutos_fuera`, `pass_by`.
- **Comprobación:** `fuera_de_horario`, `v4_fuera_de_horario`, `cerrada_a_su_hora`, `v4_cerrado_sin_solucion`, `acaba_tras_cierre`, `acortada_menos_20`, `fuera_sin_vista`, `fuera_minutos`, `fuera_con_tiempo`, `pago_sin_dentro`, `basilica_fuera`, `vaticano_sin_castillo`, `vaticano_sin_puente`.

### 2. El viajero manda — OBLIGATORIA
- **Texto:** lo que reserva, lo que marca en el pool y lo que cambia a mano entra siempre. El motor no rellena ni recoloca nada que haya tocado el viajero. **Un solo aviso:** cuando el viajero reserva un día u hora en que el sitio está cerrado («Ese día {lugar} cierra a las {hora}»): es su reserva y tiene que saberlo. Nada más avisa: ni la campana ni lo que decide el motor.
- **Una hora fija no se mueve ni se quita, y lo de antes se ajusta a ella:** la comida va antes (desde las 11:30) o más corta, se encoge la parada elástica o sale un sitio menos de lo anterior, en este orden: opcionales, elástica, comida hasta su mínimo, nivel 3. A una entrada reservada se llega 30 min antes. Una hora **orientativa** no es fija. **Si antes de una entrada sobra tiempo, el día empieza más tarde.** La entrada nunca va a «No incluido» y un sitio no puede estar a la vez en el día y en «No incluido».
- **El pool entra primero,** en el orden en que el viajero lo eligió, con su grupo y en el sitio escrito de cada lugar; si no tiene sitio escrito (el viaje de 1 día), en el día de su zona. Cada extra va en el día más cercano a su zona (la distancia media a las tres paradas más cercanas; a igual distancia, el orden del fichero), nunca en un día en que ese lugar cierra. Extras según los días: 2 días, 2; 3 días, 3; 4 días, 4; 5 o más, 5. Va **por dentro** si se puede entrar (también el Castillo, 1 h), siempre antes de su última entrada. Lo que necesita entrada con hora (Museos Vaticanos, Galería Borghese) va como entrada reservada en su mejor franja real. **En 1 día, lo del pool entra siempre:** sustituye la mitad del día más cercana a su zona, con lo menos importante.
- **Antes de añadir (pool, experiencias o cualquier relleno) se mira si cabe,** recortando solo lo que se puede recortar. Lo protegido nunca se recorta: imprescindibles, lo del pool, horas fijas y lo que añade la experiencia. Alargar un paseo nunca quita una parada. Si no cabe, el siguiente de la lista o el siguiente día de su zona; si no, «No incluido» con su motivo.
- **Empate entre el pool y un imprescindible de pago:** si se ve bien por fuera (el Coliseo, el Panteón), entra el extra y el imprescindible va por fuera; si por fuera no vale (los Museos Vaticanos), el imprescindible se queda por dentro y el extra va a «No incluido». Las joyas nunca se pierden. Si su reserva coincide con un atardecer o una nocturna, ese día va sin ello.
- **Datos:** `pool_lista`, `pool` de cada día escrito, `entradas`, `hora`, `hora_tipo` (`reserva` | `turno` | `orientativa`), `llegar_antes`, `elastica`, `tipo`, `minutos_fuera`, `por_fuera`, `pass_by`.
- **Comprobación:** `v4_llega_tarde`, `hora_fija_movida`, `aviso_de_llegada`, `en_el_dia_y_no_incluido`, `pool_fuera`. (El empate sale como información: `pago_cedido_al_pool`.)

### 3. Un sitio, una vez en el viaje — OBLIGATORIA
- **Texto:** se compara por **`id` de sitio y por lo que cada parada muestra** (`muestra`), nunca por el nombre. Cuentan las nocturnas, los paseos, el «iluminado» y el Free Tour; un «De camino» no cuenta como visita (regla 11). **Si sale dos veces, se queda la visita por dentro;** si las dos son por fuera, la del día de su zona; nunca se quita una hora fija. Lo que enseña una nocturna cuenta como visto: esos sitios no pueden salir en «No incluido».
- **La nocturna puede repetir lo que se vio esa mañana** (antes de las 13:00), y solo eso; si la visita fue por la tarde, la nocturna va otro día. Cada nocturna, una vez por viaje; una nocturna cada noche mientras queden sitios que valgan la pena. **La fecha manda (regla 14):** si una fecha tiene su noche, esa nocturna es de ese día y cualquier otro día lleva otra. De noche, varios sitios pegados pueden ser una sola parada (el Puente y el Castillo iluminados); de día, por separado.
- **Un barrio, una vez al día:** un paseo no enseña lo que ese día ya es parada; cada paseo una vez por viaje si queda otro; si no queda, puede volver otro día, nunca el mismo. Excepción: la revisita de paso de un nivel 1, por fuera, corta y con su texto («Ya lo viste el día 1…»).
- **Un sitio va en el día de su zona.** Lo que no tiene sitio escrito se mete en el día cuya zona es la suya, nunca en uno que ya lo muestra.
- **Ejemplo:** el Castillo por fuera a las 19:50 y «El Puente y el Castillo iluminados» a las 20:15 repiten el Castillo: el motor los funde en una sola parada de noche. El parque de Villa Borghese y «el lago y el Templo de Esculapio» son dos sitios.
- **Datos:** `places[].id`, `night_experiences[].muestra`, `conflicts_with`, `si_no`, `destination_config.sitios_extra`, `sitios_por_titulo`, `paseo_muestras`, `night_view_overrides`, `paseo_libre.zonas`, `zone_walks`.
- **Comprobación:** `repetido_dia`, `repetido_viaje`, `sitio_dos_dias`, `nocturna_repite`, `nocturna_repite_viaje`, `foto_repetida`, `barrio_dos_veces`, `paseo_repite_viaje`, `paseo_misma_zona`, `no_incluido_pero_visto`.

### 4. Cada día, una zona y un sentido — OBLIGATORIA
- **Texto:** cada día es una zona que se recorre andando, con **una sola visita grande** (un grupo o un sitio con más de 90 min por dentro). Cada entrada va con su grupo y ese grupo marca su día. **Los grupos se mantienen y nunca se parten:** el Coliseo con el Foro y el Arco; la Plaza con la Basílica de San Pedro; Piazza Venecia con el Altar de la Patria. **El Castillo y el Puente no son grupo:** son dos sitios y pueden ir en días distintos. **Sin ir y volver:** el recorrido no da vueltas ni zigzaguea; un tramo de más de 25 min andando va en bus o taxi si llega antes; un traslado escrito no se usa si andando son 12 min o menos. **Primero el acceso, si se llega por su lado:** la plaza, el puente o el parque van justo antes de su monumento cuando se llega desde ese lado; si se llega desde el otro, manda no ir y volver (viniendo de San Pedro: Conciliazione, el Castillo por fuera y luego el Puente; viniendo del centro: el Puente y luego el Castillo).
- **Datos:** `groups` (`inseparable`, `breakable_if_short`, `combined_duration_minutes`), `places[].approach_to`, `approach_lado`, `contained_in`, `neighbor_of`, `related_to`, `group_order`, `joyas`.
- **Comprobación:** `zigzag`, `tramo_largo`, `dos_visitas_grandes`, `grupo_partido`, `plaza_despues`.

### 5. Coliseo y Museos Vaticanos a primera hora — PREFERENCIA
- **Texto:** el Coliseo y los Museos Vaticanos, a primera hora si se puede. Si solo cabe uno, uno. El viajero puede cambiar la hora. Madrugar está bien también para lo que luego se llena (Trevi a las 8:00, la Plaza de España).
- **Datos:** `destination_config.se_llenan` (Fontana de Trevi y Plaza de España), `entradas`.
- **Comprobación:** `primera_hora` (por dentro pasadas las 10:00 sin ser una reserva), `se_llena_tarde`. «Si solo cabe uno, uno» no se mira.

### 6. La tarde según la luz — OBLIGATORIA
- **Texto:** cada día tiene cuatro tardes (A, B, C y D) según la hora de la puesta de sol, con una parada elástica de ±30 min. **El mirador va a la hora del atardecer** (se llega entre 15 y 35 min antes de que se ponga el sol, ±30 min) y no se adelanta; el rato de antes lo llena el paseo de la zona del mirador (regla 9). **El atardecer se intenta, pero no se esperan más de 30 min sin nada:** si no hay nada que poner, se sigue la ruta y el mirador va cuando se llega. **Un mirador al que se llega de noche:** si el destino tiene una buena foto de noche de ese mirador, se llama «{lugar} iluminado», lleva esa foto y cuenta como la nocturna de ese sitio; si no, sigue como parada normal con su foto de día. Es la única parada que cambia por la luz. Un solo camino para «iluminado».
- **Datos:** `tarde.A..D` y `elastica` de los días escritos; cortes de luz 17:40 / 18:45 / 19:45; `destination_config.night_view_overrides` (`title`, `photo`, `muestra`, `nocturna`).
- **Comprobación:** `v4_elastica`, `atardecer_corto`, `atardecer_tarde`, `mirador_fuera_de_hora`.

### 7. La comida — OBLIGATORIA
- **Texto:** **sin hora fija detrás:** de 45 a 90 min, en la zona donde estás. **Con una entrada detrás:** a mediodía, comida antes y rápida (unos 30 min, desde las 11:30); por la tarde, comida tranquila antes, acabando con margen para llegar. **La comida no empieza después de las 15:00** (decidido el 9-oct-2026; antes, las 14:30), en todos los días y todos los destinos: el límite está en un solo sitio (`shared/routeEngine/comida.js`). Si la comida de antes de una hora fija no deja llegar a tiempo, se acorta (45 y luego 30 min). **Nunca se estira para llenar un hueco** (90 min como máximo). El restaurante está a 15 min andando o menos y abierto ese día. **Nunca el mismo restaurante dos veces en el viaje.** La zona escrita de cada restaurante es la de sus coordenadas.
- **Datos:** `restaurants`, `hora_tipo` de la parada de después.
- **Comprobación:** `comida_menos_45`, `comida_mas_90`, `v4_comida_corta`, `restaurante_repetido`. Faltan los 15 min andando y que esté abierto.

### 8. La noche — OBLIGATORIA
- **Texto:** el orden es siempre **última parada de la tarde → cena → nocturna**, también en invierno: ninguna nocturna antes de cenar. **La cena empieza entre las 19:30 y las 21:30; en las tardes largas (versión D), entre las 20:30 y las 22:00** (`destination_config.cena_horas`). Está a 15 min andando o menos de lo último de la tarde y a **unos 20 min andando o menos de la nocturna**, en la misma zona o en zonas vecinas; si no puede ser, la cena va junto a la nocturna y el tramo desde la tarde se hace en bus o taxi (o la nocturna lleva su taxi puesto). Si la cena se pasara de su hora límite, se recorta acortando y, si no, quitando lo menos importante (nunca un imprescindible, lo del pool ni una hora fija). **Si una nocturna acabaría después de la hora límite de la noche (`noche_limite`), se quita:** no se empuja ni se recorta otra cosa. Si sobra tiempo antes de cenar, va el paseo de la zona de la cena (regla 9); no existe el «Tiempo libre».
- **Datos:** `destination_config.noche_limite`, `cena_horas`, `night_experiences`, `night_walks`, `alcance`.
- **Comprobación:** `cena_espera`, `hueco_cena`, `cena_lejos_nocturna`, `nocturna_antes_de_cenar`, `noche_pasa_limite`, `cena_tarde`, `v4_antes_de_cenar`.

### 9. Los huecos — OBLIGATORIA
- **Texto:** cualquier espera de más de 20 min entre dos paradas sale como hueco (solo la entrada con hora tiene su margen de hasta 60). Se llena en este orden: 1) **se alarga la parada de antes hasta su máximo** (`min_max`), si es de las que se disfrutan con calma (plaza, parque, mirador, barrio, jardín); 2) si no basta, **un relleno de la zona** (`rellenos_zona`: el primero de la lista que no se haya visto en el viaje, a 15 min andando como mucho, abierto de verdad); 3) si no, **el paseo de la zona** (solo se descarta si todo lo que enseña ya se ha visto). Antes del atardecer, la zona del mirador; antes de cenar, la zona de la cena. **Nunca una espera escondida.** Una parada opcional nunca crea una espera ni sale cerrada. Cada parada tiene su máximo y estirarla nunca lo pasa. Mínimos: un imprescindible, 20 min; un «De camino», unos 10; los minutos de «por fuera» no se recortan; la elástica no baja del 75 %.
- **Datos:** `places[].min_max`, `elastica`, `destination_config.rellenos_zona`, `paseo_libre`, `zone_walks`.
- **Comprobación:** `hueco`, `libre_largo`, `libre_pisa_comida`, `espera_mas_90`, `min_max_pasado`, `paseo_largo`, `duracion_corta`, `v4_parada_corta`, `tiempo_libre_sigue`.

### 10. El Free Tour sustituye lo que enseña — OBLIGATORIA
- **Texto:** según la hora a la que sale: **de mañana** (antes de las 13:00) sustituye la mañana del centro; antes del tour, Trevi a las 8:00. **De tarde** (de 13:00 a 18:59) sustituye la tarde del centro. **De noche** (desde las 19:00) sustituye la nocturna de ese día. Lo que el tour recorre no se repite **por fuera, de día, ese mismo día**. Las visitas **por dentro** (el Panteón, las iglesias) pueden ir antes o después del tour, porque el tour no entra en los sitios. De noche puede volver a salir, como cualquier nocturna. Los días sin tour y las horas especiales de festivo salen del dato del tour.
- **Datos:** `default_free_tour` (`covers`, `default_time`, `disponibilidad`), variantes `con_free_tour`.
- **Comprobación:** `tour_repite` (solo paradas por fuera y de día que salen después del tour).

### 11. Qué es parada — OBLIGATORIA
- **Texto:** es parada cada monumento o lugar de nivel 1 o 2, con su nombre, se vea por dentro o por fuera. **Las calles no:** una calle va dentro de un paseo («Pasea y piérdete por el Tridente») o como «De camino», nunca como parada con su propio tiempo; tampoco los restaurantes y las tiendas, que van dentro de la ficha. **Un «De camino» no cuenta como visita:** si el sitio está en el pool o es imprescindible, sigue pendiente; lleva su propio nombre, «De camino: {sitio}» (`display_name`), nunca el de la visita. Las relaciones entre lugares mandan cómo se colocan: `contained_in`, `neighbor_of`, `approach_to`, `related_to`, `group_order`.
- **Comprobación:** `nivel_camino`, `nivel_idea`, `calle_parada`, `camino_sin_nombre`, `camino_cierra_pool`.

### 12. Según los días del viaje — OBLIGATORIA
- **Texto:** **1 día:** todo por fuera, salvo lo marcado en el pool. En Roma, sin Free Tour y sin pool, es un día escrito (`D0`): Roma Antigua y Centro por la mañana, Vaticano por fuera por la tarde y las fuentes iluminadas después de cenar; con Free Tour o con algo en el pool se queda el reparto de antes (`short_trips`). **2 días:** por dentro solo lo que dice el destino o lo marcado; si se marcan dos visitas grandes, un día cada una. **Medio día:** sigue la regla de 1 día. **3 días o más:** el viaje completo. Pasado el máximo de días del destino (`max_auto_days`), los días van en blanco. **Las joyas, como tarde el día 3** (el 2 en viajes de 2 días).
- **Datos:** `short_trips`, `core_days`, `max_auto_days`, `joyas`, `destination_config.excursion_desde_dias`, `excursions.excursiones_desde_dias`.
- **Comprobación:** `joya_tarde`. Lo demás, SIN COMPROBACIÓN propia.

### 13. Las experiencias — PREFERENCIA
- **Texto:** una experiencia elegida añade algo que se nota, en su zona; si no añade nada, no se ofrece. Cada destino tiene, para cada experiencia, una lista ordenada de lo que añade, con su zona y si va por dentro. El motor mete de esa lista lo que cabe según los días (1 día, 1; 2 o 3 días, 2 o 3; más de 3, 3 o 4), cada cosa en el día de su zona y a poca distancia de lo que ya lleva esa mitad (`alcance.experiencia_cerca_m`), con todas las reglas. **Si no cabe, no entra** (nunca se mete lejos con un taxi). Si para añadir hay que quitar algo, se quita un paseo, un «De camino» o algo de nivel 3: nunca una iglesia con arte ni un imprescindible.
- **Datos:** `destination_config.experiencias_lista`, `alcance`.
- **Comprobación:** `experiencia_sin_efecto`, `experiencia_fuera_de_zona`.

### 14. Las fechas especiales — OBLIGATORIA
- **Texto:** Nochebuena, el miércoles del Papa, los festivos, Pascua y las demás fechas van **en los datos del día** (variantes por cierre y por fecha), no en reglas ni en el código. Orden: primero el cierre, luego la fecha y luego lo que reparten dos días (`si_cerrado` dice qué pasa: por fuera, quitar o cambiar). **La fecha manda:** algunas fechas tienen su noche propia (Nochebuena: el 24 la noche es la Fontana de Trevi, una sola parada; si Trevi de noche salía otro día, ese otro día lleva otra nocturna, regla 3). **Navidad y fechas especiales:** la ruta se adapta a horarios, cierres y transporte y lo dice en los avisos («un aviso, un tema»). Cuenta lo de temporada que ya está en la ruta (árbol, belenes, mercadillos y luces). Nada de eventos de una vez al año.
- **Datos:** `variantes` de los días escritos, `fechas_especiales`, `navidad_lineas`, `destination_config.noche_especial`.
- **Comprobación:** `aviso_promete`, `aviso_lugar_ajeno`, `aviso_repetido`, `nota_promete`, `texto_condicion`, `v4_titulo`, y la sección «fechas clave» del informe de la prueba.

### 15. Excursiones, llegada y vuelta — OBLIGATORIA (pendiente del encargo de vuelos)
- **Texto:** las excursiones, nunca el día de llegada, el de vuelta ni el último día; una excursión reservada fija su día; los días sin excursión salen del dato (`excursion_fechas_no`). **Al llegar,** se cuenta lo que pasa de verdad (salir del aeropuerto o la estación, el trayecto, dejar la maleta); el día de llegada no lleva nada con entrada; si da para una parada antes de comer, una sola, cerca del alojamiento. **Al irse,** se sale con el margen del destino; esa mañana, el desayuno y una parada cerca. Vuelos, trenes y barcos: hoy el motor no los recibe.
- **Datos:** `data/dias/<destino>/_llegada.json`, `excursion_fechas_no`.
- **Comprobación:** SIN COMPROBACIÓN en esta prueba (la mira `scripts/destino/llegadas.mjs`).

---

## Cómo se comprueba (no cuenta como regla)

- **La prueba imprime una línea por cada una de las 15 reglas:** «R-8: 0 fallos» o «SIN COMPROBACIÓN». Una regla sin comprobación sale marcada. Cubre también viajes sin fechas, de 1 día y con reservas (una por franja). `node scripts/destino/prueba365.mjs`; qué línea mira cada regla: `scripts/destino/reglasPrueba.mjs`.
- **Antes de dar un destino por bueno, los datos se cruzan solos:** `node scripts/destino/validar.mjs <destino>` comprueba que cada `muestra` existe, que ninguna nocturna deja de nombrar un sitio que enseña, que ningún `id` está repetido y que cada título de paseo tiene su muestra. La zona escrita de cada restaurante se compara con sus coordenadas (`restaurante_zona`). Al juntar o renombrar algo se buscan todas sus referencias.
- **Formato (no es regla):** las horas de 10 en 10 y las duraciones de 5 en 5; las horas fijas y las paradas pegadas (a menos de 200 m) no se redondean. La prueba lo cuenta en una línea aparte (`hora_no_10`, `duracion_no_5`, `no_cuadra`).
- **La revisión como un local:** una lista fija de 20 viajes (`docs/reglas/VIAJES_EJEMPLO.md`, `node scripts/destino/viajesEjemplo.mjs`), de 1 a 7 días, las cuatro estaciones, con y sin Free Tour, con y sin entradas, y Navidad. Se revisa parada a parada antes de que el usuario vea nada. No es automática.
- **Los números del destino están en datos, no en el código:** `destination_config.alcance` (la nocturna a unos 20 min de la cena, a partir de qué distancia lleva taxi, lo cerca que tiene que estar una experiencia, el máximo del descanso después de comer), `noche_limite`, `cena_limite`.

---

## Tabla «R vieja → regla nueva»

| R vieja | Qué era | Regla nueva |
|---|---|---|
| R-1 | Nunca un sitio cerrado | **1** |
| R-2 | Una hora fija no se mueve ni se quita | **2** |
| R-3 | El viajero manda | **2** |
| R-4 | Los imprescindibles salen siempre | **1** (como mínimo, por fuera) |
| R-5 | Un sitio, una vez en el viaje y una vez al día | **3** |
| R-6 | Las nocturnas | **3** (una vez por viaje, la de la mañana) y **8** (la hora límite) |
| R-7 | Un barrio, una vez al día | **3** |
| R-8 | El Free Tour sustituye lo que enseña | **10** |
| R-9 | Lo mejor, primero (las joyas, como tarde el día 3) | **12** |
| R-10 | Cada día tiene un sentido | **4** |
| R-11 | Según los días del viaje | **12** |
| R-12 | El pool entra primero | **2** |
| R-13 | Una experiencia añade algo que se nota | **13** |
| R-14 | La comida, siempre | **7** |
| R-15 | La tarde acaba donde se cena | **8** (la parte de «Descanso a la sombra» se quita con el calor) |
| R-16 | La tarde va según la luz | **6** |
| R-17 | A primera hora, lo que luego se llena | **5** |
| R-18 | Primero el acceso, si se llega por su lado | **4** |
| R-19 | Sin ir y volver | **4** |
| R-20 | Los huecos | **9** |
| R-21 | La época del año | **Quitada** (el calor: julio y agosto, el descanso a la sombra y «primero lo de dentro»). Lo del «iluminado» pasa a **6**. |
| R-22 | Horas de 10 en 10 | **Cómo se comprueba** (formato) |
| R-23 | Mínimos y máximos | **9** |
| R-24 | Es parada | **11** |
| R-25 | Por fuera, solo donde se ve algo | **1** |
| R-26 | Variantes por cierre y por fecha | **14** (el orden «primero el cierre» también en **1**) |
| R-27 | Las excursiones | **15** |
| R-28 | Al llegar | **15** |
| R-29 | Al irse | **15** |
| R-30 | La prueba imprime una línea por regla | **Cómo se comprueba** |
| R-31 | Los datos se cruzan solos | **Cómo se comprueba** |
| R-32 | La revisión como un local | **Cómo se comprueba** |
| R-33 | Antes de añadir, se mira si cabe | **2** |
| R-34 | Lo del pool con entrada con hora va como entrada reservada | **2** |
| R-35 | En 1 día, lo del pool entra siempre | **2** |
| R-36 | La comida nunca se estira para llenar un hueco | **7** |
| R-37 | La noche (cena junto a la nocturna) | **8** |
| R-38 | Cada parada tiene un máximo | **9** |
| R-39 | Lo que enseña una nocturna cuenta como visto | **3** |
| R-40 | «De camino» no es una visita | **11** |
| R-41 | Las nocturnas no están protegidas (hora límite) | **8** |
| R-42 | La noche propia de una fecha | **14** |
| R-43 | Una calle no es parada; experiencias en su zona; zona de restaurantes | **11** (la calle), **13** (experiencias), **7** y **Cómo se comprueba** (restaurantes) |
| R-44 | La cena tiene hora límite | **8** |
| R-45 | Por dentro gana a por fuera | **3** |
| R-46 | Distancias y tiempos del destino, en datos | **Cómo se comprueba** |

---

## Dónde va lo demás

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
