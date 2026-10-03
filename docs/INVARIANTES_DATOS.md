# Invariantes de los datos

Cómo es un destino: el kit de destino nuevo (sección I), horarios, «comprobado», fotos, textos, «nada inventado», todo lo que lee el viajero curado en el JSON.

Las reglas se copian **tal cual**, con su número de siempre (`docs/INVARIANTES_MOTOR.md` queda como estaba, en solo lectura, y sigue siendo la fuente).
Lo que manda sobre cómo se monta una ruta está en `docs/REGLAS_RUTAS.md`; si una regla de aquí choca con esa hoja, gana la hoja.

## J. Revisión de rutas (2026-09-24, PROMPT_REVISION_RUTAS_ROMA.md)

51. **Un horario puede tener varios tramos por día** ("07:30-12:30, 16:00-19:30" o con "/"). El motor
    los comprueba TODOS (`parseHoursSessions`). En pantalla se enseñan todos los tramos del día
    ("07:30–12:30 / 16:00–19:30", `formatDaySessions`), nunca solo el primero, y el "abierto /
    cerrado" de la ficha se calcula a la HORA DE LA VISITA, no a la del móvil. *Una iglesia visitada a
    las 17:45 salía "10:00–12:30": era la tarjeta enseñando el primer tramo y la ficha mirando la hora
    a la que se revisaba la ruta.*
92. **Sin fechas manda el horario de laborables** (`windows` = la entrada de `by_day` que cubre más días de
    lunes a viernes), con aviso en la parada de los días que a esa hora no se puede: "Domingos y
    festivos, solo de 16:30 a 18:00." (y "Cierra los lunes." si cierra algún día).

104. **Horario de un lugar un día concreto**, en este orden: cierres (`closed_on` por día de la semana
    y `closed_dates` MM-DD, este solo con fechas, en el reparto: un día curado cuyo imprescindible cierra
    esa fecha se cambia con otro) → `by_day` con fechas → `by_period` (la fecha real o el 15 del mes;
    `from`/`to` MM-DD incluidos, pueden cruzar el año; su `last_entry` manda, null = no hay) →
    `by_season` (reserva) → `by_day` de laborables sin fechas → `windows`. La palabra `sunset` en una
    franja ("07:00-sunset") es la puesta de sol de ese día (sin ella, las 17:00). `validar.mjs` avisa si
    los periodos dejan días sin cubrir o se solapan (366 días) y si la auditoría (`hours_audit.fecha`) es
    de un año anterior al del viaje (`--anio`). Import: `scripts/destino/importarPeriodos.mjs`.
    **Fechas móviles**: en `closed_dates` (y en cualquier lista de fechas) `easter`, `easter+N`,
    `easter-N`: Pascua se calcula cada año (algoritmo gregoriano), nunca se escribe con su día (el lunes
    de Pascua es `easter+1`). **Último domingo**: `last_sunday: { windows, last_entry, except }` abre el
    último domingo del mes un lugar que cierra los domingos (Museos Vaticanos: 09:00-14:00), salvo las
    fechas de `except`. Un día "cierra" lugar a lugar (`closedOnDay`), no con listas de la unidad.

## I. Kit de nuevo destino: cuándo un destino está listo


1. **Datos** — `node scripts/destino/validar.mjs <destino>`: referencias, grupos, nivel 1 (4-5
   joyas, 10-12 en total), visitas largas frente a `core_days`, horarios, pares a menos de 150 m
   decididos (y propuestas hasta 300 m), coordenadas contra Wikipedia (rojo a más de 200 m),
   restaurantes con `meal` y barrios de cena que salen (y a qué zonas les falta uno).
2. **Borradores de criterio** — `node scripts/destino/borradores.mjs <destino>`: joyas por
   popularidad, recorrido de tarde por zona y rutas de 1 y 1,5 días, probadas con el motor. Se
   revisan a mano y se copian al JSON; no se usan tal cual.
3. **Matriz** — `node scripts/buildTravelMatrix.mjs <destino>`.
4. **Semáforo** — `node server/engine/__tests__/medirDias.mjs --destino <destino> --motor v3
   --semaforo`: las 112 variantes contra límites que salen de estas reglas. Los días por encima de
   `core_days` (repaso, excursión de medio día) tienen sus propias reglas: no se les pide acabar
   después de las 16:00, sí como mucho 3 revisitas. **Destino listo = datos
   sin rojos + semáforo todo en verde.** Los límites no se aflojan para que un destino pase: si algo
   sale en rojo, o el dato está mal o el motor tiene un fallo.
5. **Estaciones** (PROMPT_ESTACIONES.md):
   - Horarios por periodo: rellenar `docs/kit/plantilla_horarios_por_periodo.json` (`by_period`,
     `closed_dates`, `confianza`, `fuente`, `_nota`, `fecha_auditoria`) e importarla con
     `node scripts/destino/importarPeriodos.mjs <destino> <fichero>`. `validar.mjs` avisa si los
     periodos no cubren los 366 días o se solapan, y (con `--anio`) si la auditoría es de otro año.
   - Puesta de sol: no se cura. Sale de `timezone` y del centro de la primera zona; `validar.mjs` marca
     en rojo un destino sin ellos.
   - Temporada: `available` en lugares, nocturnas y excursiones, y
     `destination_config.experience_availability` para experiencias (`docs/kit/plantilla_temporada.json`).
     Solo con fuente; `validar.mjs` marca en rojo una fecha mal escrita.
   - Semáforo por meses: `--mes 1`, `--mes 4`, `--mes 7`, `--mes 10`, y con `--fecha` en los dos
     cambios de hora del año.

---


## G. Contrato de aceptación

249. **Regla de oro de los avisos**: primero el dato y al final lo que hemos hecho ("Hemos puesto…", "Hemos movido…"),
    35 palabras como mucho, de tú a tú y sin precios. Vale para las plantillas del motor y para los textos curados.
251. **Horario especial** (`fechas_especiales[].horario_especial`): solo con `confirmado: true`; el cargador lo pone
    en el lugar (`special_hours`) y va por delante de `last_sunday`, `by_day` y `by_period`, por detrás de los cierres.
260. **`verificar: true` sale, con prudencia** (decisión del usuario, 2026-09-27): el dato exacto cambia cada año, pero
    avisar ya tiene valor. El texto lo dice con cuidado ("es posible que…", "suele…", "compruébalo en la web oficial");
    `validar.mjs` avisa si no. Sustituye a la regla 248 en esto: ya no se esconde ninguna fecha.
261. **Horario especial "probable"** (`horario_especial.confirmado: "probable"`, el 2 de junio): el horario NO se aplica,
    pero el reparto evita poner ese día lo que lleva esos lugares (coste 400: menos que un cierre, más que el orden).
    Con `confirmado: true`, además se aplica el horario (regla 251).
262. **"Gratis" sí, cifras y precios no** (decisión del usuario, 2026-09-27; sustituye a la regla 255): "gratis" se
    puede decir cuando suma, dentro de una frase con valor ("…y la entrada es gratis: una joya que mucha gente se
    salta"), también en la ficha de lugar y en su horario ("Entrada gratuita: …"). Lo prohibido fuera de la pestaña
    Tickets son las cifras y los precios (€, euros, importes): `validar.mjs` los marca en rojo, nunca la palabra
    "gratis". Los campos de precio estructurados (`ticket_info`, `price_range`, `avg_price_person`) son datos, no texto.
264. **Todo lo que lee el viajero va curado en el JSON del destino** (regla general, decisión del usuario 2026-09-27):
    nunca de una llamada a la API. Si un texto depende de la hora, va como `{ texto, temprano }`: `temprano` solo si la
    parada empieza antes de las 09:30 (`curatedWhyAt`, buildDayV3.js); si no, `texto`. `validar.mjs` avisa del texto
    sin `temprano` que habla de "primera hora", "a la apertura", "sin gente" o de una hora concreta. Plantilla en
    `docs/kit/plantilla_por_que.json`.
276. **Sin fechas = días normales, nunca festivos** (decisión del usuario, 2026-09-28). Sin fechas el motor usa el día
    15 del mes solo para el atardecer y el horario de temporada (`by_season`/`by_period`): ni `closed_dates`, ni
    cierres por día de la semana (`weekday` es null), ni `last_sunday`, ni `special_hours` de `fechas_especiales`, ni
    las reglas con fecha de los días curados (`no_en.fecha`, `cuando.fecha`, `si_fecha`). En curatedTrip todo pasa por
    `realDateIso(day)` (null sin fechas); en openingHours `specialHoursOn` recibe la fecha solo si hay `weekday`. Lo
    único del mes que sale sin fechas es la ventana de avisos "Si tu viaje coincide con…" (sin etiqueta en ningún día y sin
    la última frase "Hemos ajustado / puesto…" del texto curado, que sin fechas no es verdad).
    Al poner fechas desde el botón del mapa, la ruta se rehace como en el formulario y sale la ventana de avisos; si el
    viajero la había editado a mano, antes se pregunta ("Vamos a ajustar tu ruta a estas fechas y algunos días pueden
    cambiar. ¿Seguimos?"): con "Mejor no" (decisión del 2026-09-28) se guardan las fechas y la ruta se queda
    exactamente igual, sin ventana ni avisos ni etiquetas. Solo el dato de cada parada: las que cierran ese día (cierre
    semanal o festivo, /api/kept-route-closures) llevan "Hoy cierra" en rojo en su línea de horario.
280. **Datos que caducan llevan `comprobado: "AAAA-MM-DD"`** (decisión del usuario, 2026-09-28): las fechas especiales con
    `verificar`, todo objeto con `cifra_ok` (textos de los días, por_que_lugares, paseos, fichas), los lugares con
    horario por temporada (`by_season` / `by_period`) y los restaurantes curados. Roma: 2026-09-28 en todo (se revisó
    en septiembre); también en docs/roma_por_que.json y docs/roma_fechas_especiales.json, para que no se pierda al
    volver a aplicarlos. validar.mjs (sección 13) avisa en amarillo de lo que no tiene fecha o la tiene de hace más de
    11 meses; `node scripts/destino/comprobado.mjs` saca la lista por destino, y es lo que usa la revisión automática de
    cada 1 de diciembre. Las plantillas del kit piden el campo (`_comprobado`).
395. **Un horario de festivo no se da por abierto ni por cerrado sin la fuente oficial de ese año** (PROMPT_ROMA_NAVIDAD 1).
    - Cada cierre por fecha lleva su fuente y su fecha de comprobación (`closed_dates_audit`). Lo que no tenga fuente, fuera.
    - Si no hay fuente del año en curso, el dato va como `probable` y el texto es prudente («suele abrir con horario corto…
      compruébalo en su web»).
    - `horario_especial` con `confirmado: "probable"` + `aplicar: true`: el reparto evita ese día si puede; si no puede, la
      visita va dentro de ese horario (el prudente). Sin `aplicar`, como el 2 de junio: solo se evita el día.
    - Un lugar puede llevar sus tramos especiales en su ficha (`special_hours`, con `motivo`, `fuente` y `verificar`): la
      Basílica de San Pedro no cierra el día entero por una misa del Papa, solo el tramo de alrededor.
    - Ejemplo: el 1 de enero el Coliseo, el Foro (08:30-16:30), el Panteón (09:00-17:00) y las Termas de Caracalla
      (09:30-16:30) abren (colosseo.it y cultura.gov.it, 1 de enero de 2026); el Castillo, la Galería Borghese, el Doria
      Pamphilj y las catacumbas cierran (sus webs oficiales).

405. **Fechas especiales, sencillas** (PROMPT_FECHAS_SENCILLAS, 2026-10-01). En Navidad, en los festivos y en las fechas
    especiales, la app hace solo dos cosas: **adapta la ruta a los horarios** (cierres, horarios cortos, transporte) y lo
    cuenta en el aviso, y **cuenta en la ficha lo que ya está en la ruta** (un árbol, un belén, el mercadillo, las luces).
    - **Lo que se repite, sí; lo que pasa una vez al año, no.** Se cuentan las misas y audiencias del Papa, el Ángelus de
      los domingos y los mercadillos, que duran semanas. Fuegos artificiales, conciertos, desfiles y festivales no salen
      en ningún sitio, salvo lo que cambien en los horarios (el Coliseo el 2 de junio, abierto solo por la tarde).
    - **Los grandes días religiosos** (los que llenan la ciudad) se cuentan solo en el aviso de fechas del principio: qué
      pasa y qué hemos cambiado en la ruta. **Nunca son una parada ni una sugerencia con hora.** Las fechas especiales no
      llevan `sugerencia`.
    - **Un aviso dice qué cambia ese día y qué hemos hecho**, en 35 palabras como mucho y de tú: `contexto` + `hecho`. De
      cada grupo de `hecho` sale la primera opción que se cumple en ESE viaje (`hoy`, `antes_de`, `despues_de`, `otro_dia`,
      `en_viaje`, `empieza_tarde`); si el día no pasa por el sitio, lo dice («tu ruta de hoy no pasa por San Pedro: no te
      afecta»). Ningún aviso promete lo que la ruta no hace.
    - **Un aviso, un tema:** el día movido o el horario especial que el aviso de esa fecha ya cuenta (`cubre`) no sale
      aparte. El transporte recortado de ese festivo y el aviso de restaurantes van como frases aparte del mismo aviso.
    - **Lo semanal** vive en `destination_config.papa` y `lineas_semana`: el aviso de la audiencia de los miércoles y la
      línea de ficha del Ángelus (domingo, en la plaza, de 11:00 a 13:00) no salen en las fechas en que no los hay
      (`sin_audiencia`, `angelus_fuera`: el verano). La ruta no cambia: sigue siendo la prudente.
    - **Un horario especial que corta solo la tarde** (`horario_especial.sin_evitar`) no hace huir de ese día: el Viernes
      Santo el Coliseo va por la mañana. Un día escrito puede pedir otro día con una fecha (`no_en: { fecha, evitar }`).
    - **El día que empieza más tarde** (regla 404): a su hora (10:00); si no cabe, con la variante `empieza_tarde` del día
      escrito (lo que pasa a la tarde, nada se quita); si tampoco, a la segunda hora (`si_no_cabe`, 9:30). Si a ninguna
      hora se salva el atardecer, manda no madrugar. Sustituye a la parte de la 404 que quitaba opcionales.
    - **La nota navideña** (`temporada_navidad` + `nota_temporada.navidad*`): si algún día del viaje cae en la época de
      Navidad del destino, sale en lugar de la de invierno, con el icono de Navidad. Solo promete lo que hay en ese viaje:
      el mercadillo si está abierto y en la ruta; árboles y belenes desde `arboles_desde`; antes, solo las luces;
      «iluminado» si alguna noche sale a pasear. Un destino sin `temporada_navidad` lleva la nota de invierno de siempre.

410. **Fotos propias y textos de ficha** (PARA_CODE_FOTOS y PARA_CODE_TEXTOS_FICHAS, 2026-10-01).
    - **Una foto también es una promesa.** Las fotos propias de un destino (`data/dias/<destino>/_fotos.json`, ficheros en
      `public/fotos/<destino>/`) van antes que las de Unsplash y Wikipedia. Una foto de unas fechas (Navidad) solo sale con
      la fecha real de ese día dentro de su ventana; con `verificar`, no sale hasta confirmar que ese año hay lo que se ve.
      Una foto de día nunca va en una parada de noche.
    - **El crédito nunca se inventa:** sin autor, enlace y fuente, la foto va sin línea de crédito.
    - Los originales no entran en git: en la app van reducidas (1.600 px de ancho como máximo para la ficha, 640 px para
      la tarjeta).
    - **Un lugar sin ficha escrita a mano lleva nuestro texto** (`por_que_lugares`) y `sin_texto_ia`. En su ficha, ese
      texto va debajo del «por qué» de la ruta cuando no son el mismo.
    - **Una línea de ficha no repite lo que la parada ya cuenta**: `si_repite` (sale su texto corto) y `no_si_parada` (no
      sale el día que la ruta lleva la parada que ya lo cuenta).
    - **Después de tocar el servidor, una petición real a la API** antes de darlo por bueno: las pruebas del motor no pasan
      por ella (el 30 de septiembre se subió un servidor que arrancaba y respondía 500 a todo).

420. **Fotos: de noche solo en las experiencias nocturnas; nunca la misma foto dos veces en un día; sin foto antes que una
    mala** (PARA_CODE_TODO_2026-10-01, paso 5, puntos 2, 3 y 6; sustituye a la 411).
    - Todo lo que parezca de noche (noche, anochecer, amanecer con farolas) va solo en las experiencias nocturnas; una
      parada, un paseo antes de cenar y una comida llevan siempre foto de día. Única excepción: las de Navidad (el árbol
      de Plaza de España y el de San Pedro, el mercadillo de Navona), en sus fechas aunque la parada sea de día.
    - Nunca la misma foto en dos tarjetas del mismo día: si dos paradas compartirían una foto propia, la segunda
      (`no_own_photo`) pide la de siempre. Una parada puede pedir su foto con otro nombre (`foto` en lo escrito): el parque
      de camino a la Galería y el del lago y el templo. La prueba (`foto_repetida`) y `scripts/destino/fotosRepetidas.mjs`
      (todas las fuentes, contra la API).
    - `sin_foto` (en `_fotos.json`): lugares que van con el color neutro hasta que el usuario pase una buena; nunca una
      buscada sola. El degradado naranja y rosa no sale en ninguna tarjeta que no sea de atardecer.
    - La hoja de contactos `docs/revision_fotos_roma.html` (`scripts/destino/revisionFotos.mjs`) enseña todas las fotos,
      cuándo salen y de dónde vienen; arriba, las buscadas solas que nadie ha visto.

470. **Última entrada por día de la semana** (3-oct-2026): `last_entry_by_day` en la ficha del lugar (`{ "vie-dom": "19:00" }`). El Palazzo Doria Pamphilj abre de viernes a domingo de 10:00 a 20:00 con la última entrada a las 19:00 (el resto, 09:00-19:00 y 18:00):
    doriapamphilj.it, «La Visita (Roma)», comprobado el 3-oct-2026. Antes, los sábados a las 19:00 salía «fuera de horario».

