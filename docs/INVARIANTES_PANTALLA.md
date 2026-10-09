# Invariantes de la pantalla

Lo que se ve y cómo. **Ojo:** algunas (378, 386, 412, 417, 428, 430) describen la pantalla de antes del último rediseño (barra flotante de cinco iconos, aviso bajo «+ Añadir día»…); están por poner al día.

Las reglas se copian **tal cual**, con su número de siempre (`docs/INVARIANTES_MOTOR.md` queda como estaba, en solo lectura, y sigue siendo la fuente).
Lo que manda sobre cómo se monta una ruta está en `docs/REGLAS_RUTAS.md`; si una regla de aquí choca con esa hoja, gana la hoja.

## G. Contrato de aceptación

354. **UI · Pestaña Días** (2026-09-29, PROMPT_UI Parte 1):
    - **Color del día.** Cada día tiene su color (`colorIndex`), fijado al crear el viaje. Va con el día, no con su
      posición: si se mueve, su franja y sus pines se mueven con él.
    - **Dónde se ve.** Una franja diagonal fina a la izquierda del acordeón, el número del día y los pines y la línea
      del mapa. Sin ningún día abierto, el mapa enseña todos los días, cada uno con su línea; con uno abierto, solo ese.
      Sin leyenda.
    - **Asa de arrastre.** A la izquierda del todo, asomando por el borde, con 44 × 44 px de toque; solo en los días que
      se pueden mover.
    - **Menú de cada día.** «Volver al día original» (la varita), solo si el día tiene cambios, y «Eliminar día» en todos
      los días (también llegada y vuelta), con ventana de la app y «Día eliminado · Deshacer».
    - **«Volver a mi ruta original».** La varita del mapa, solo si hay cambios. Recupera la copia guardada al crear el
      viaje (`originalRoute`: días, orden, paradas, horas, restaurantes y fechas), sin recalcular.
    - **Confirmaciones.** Siempre en ventanas de la app, nunca alertas del navegador.

355. **UI · Interior de cada día** (2026-09-29, PROMPT_UI Parte 2):
    - **Color del día dentro.** El número del día y los números de las paradas van en el color del día, como sus pines:
      relleno claro, número fuerte y borde blanco. Con el día abierto, pines y línea también.
    - **Tramos.** Solo tres con cabecera, Mañana, Tarde y Noche: lo de antes de comer es la mañana. La comida y la cena
      van entre tramos, como bloques propios; si la cena va después de las nocturnas, dentro de la Noche. Hay 50 px
      encima de cada bloque, y el mismo espacio de la cabecera al primer «+ Añadir parada» que entre parada y parada.
    - **Comida, cena y desayuno.** Formato «Mesa»: terracota suave, sin foto ni número y «Cambiar»; el desayuno, igual
      en pequeño.
    - **«De camino».** Mini-tarjeta con borde discontinuo, sin número ni hora.
    - **Botones fuera del día.** «Volver al día original» va en el menú; no hay «Montar día manualmente».
    - **Excursión.** Una tarjeta al final de la lista si el viaje no lleva excursión: tres escapadas sin repetir sitio,
      con foto (`photo_name`) y sin precios. Al elegir una, se pregunta qué día y se propone el de la oferta.
    - **Fotos.** La de cada parada es siempre de ese lugar. De noche, ese lugar de noche (Unsplash con «night»…) o, si
      no hay, el mismo lugar de día; nunca otro. La revisión está en `docs/FOTOS_ROMA.html`
      (`scripts/destino/fotosRoma.mjs`).
    - **Avisos de fechas.** Flechas ‹ ›, «1 de 3» y «Siguiente» hasta el último, que dice «Entendido».

356. **El desayuno** (2026-09-29): solo en ritmo completo (en tranquilo el día empieza a las 10:00 y no lleva), y solo
    después de una visita temprana con hora (Trevi a las 8:30) o para llenar el rato hasta algo con hora fija (el Free
    Tour de las 10:00). Nunca como bloque de todas las mañanas. Se ve con la tarjeta de siempre (franja y diagonal), sin
    número, y en la diagonal la misma foto en todos los destinos: un café (`BREAKFAST_PHOTO_URL`, enlazada de Unsplash).

357. **Un extra del pool nunca va a un sitio en un día en que ese lugar cierra** (2026-09-29): pasa a su siguiente
    sitio (Caracalla el lunes, por fuera, en D5C).

358. **La llegada y la vuelta** (2026-09-29, PROMPT_UI Parte 3). Vale para avión, tren, autobús, ferry, crucero y coche, y
    para todos los destinos: los datos de cada uno en `data/dias/<destino>/_llegada.json` (`/api/arrival-info`), las
    reglas en `shared/arrival/arrivalRules.js` (la app y la página de revisión usan las mismas).
    - **Van con la posición.** La llegada, en el primer día, después del bloque de alojamiento y antes del primer
      tramo; la vuelta, en el último, al final del todo, con «Fin del viaje. {despedida en el idioma del destino}»
      debajo. Si se borra o se mueve el primer o el último día, el nuevo primero hereda la llegada y el alojamiento y
      el nuevo último, la vuelta.
    - **La barra cerrada.** Tipo billete: 52 px (48 en móvil), bloque petróleo #1F5F78 con el icono del medio y una
      diagonal clara, datos en mono mayúsculas (se cortan con «…»), la hora clave en terracota (nunca se corta) y la
      línea de puntos con dos muescas y «›». Sin número y sin hora en la columna de paradas. Sin reserva, «+ AÑADIR
      VUELO» en azul, que lleva a Reservas con la casilla de esa hora enfocada.
    - **Las horas.** En el centro = llegada + traslado del punto, de 5 en 5. Salir = avión − 3 h, tren y autobús
      − 45 min, ferry − embarque (2 h) − trayecto al puerto, crucero = a bordo − trayecto − 30 min; de 5 en 5 hacia
      abajo. Coche: sin hora clave, el aviso de la ZTL. Un ferry de un solo día es un crucero. La vuelta puede ir en
      otro medio (`returnTransportOptionId`).
    - **Las marcas.** «Llegas después» en lo que empieza antes de la hora en el centro; «Ya te has ido» en lo que acaba
      después de la hora de salir. Nada se mueve solo: «Ajustar este día a tu llegada / vuelta» lo hace al tocarlo.
      La llegada reprograma desde la hora en el centro; la vuelta no rehace el día, quita lo que acaba después de salir.
      Las comidas siguen a las paradas (se corren o se quitan). Cuenta como cambio: la varita lo devuelve todo.
    - **La ventana.** Foto fija del punto (comprobada a mano: es ese sitio), «LLEGADA · MAR 29 SEP», el título y la
      reserva con «Editar». Resumen: todas las formas de ir (la más cómoda primero, «EL MÁS CÓMODO»), cada una con
      tiempo, frecuencia y precio; a la llegada, la estación, la consigna y la primera parada; a la vuelta, «Tu última
      tarde, sin prisas», la maleta y «Tu última hora». Traslados solo si hay traslado privado (nunca en coche). Tips
      con título corto en negrita. Cada precio con su fuente oficial y la fecha en que se comprobó; sin web oficial, sin
      precio. Revisión: `docs/LLEGADAS_<DESTINO>.html` (`scripts/destino/llegadas.mjs`).

359. **Las fichas a pantalla completa del día van en el body** (2026-09-29): parada, comida, llegada y vuelta se pintan
    con un portal. Dentro del panel del día quedaban encerradas en la tarjeta (la animación de entrada dejaba un
    `transform`) o debajo de la cabecera de la app. La animación de entrada del día es `backwards`, no `both`.

360. **Una fecha especial va con su fecha, no con el número del día** (2026-09-29): si se borra el día 1, la audiencia
    del miércoles sigue en el miércoles.

361. **Una visita por dentro cabe entera en un tramo abierto** (2026-09-29, `nextOpenSlotMinutes`): San Clemente
    (09:00–12:30 / 14:00–18:00) a las 12:30 con 45 min dentro pasa a las 14:00.

362. **Retoques de la UI** (2026-09-29):
    - **Excursiones.** Una excursión de día entero nunca va el día de llegada ni el de vuelta (ni en la lista ni en el
      enlace del día). Si el día de la oferta es uno de ellos, se propone el día completo más cercano
      (`excursionOffer.ts`).
    - **Botones flotantes.** Nunca tapan el «···» del último día (espacio debajo de la lista) y llevan iconos de línea.
    - **Mapa.** En el idioma de la app. La línea de todos los días va gruesa y con borde blanco.
    - **Móvil (<480 px).** Escala compacta, con títulos de dos líneas como mucho y la tarjeta del mapa en una línea.
    - **Día abierto y cerrado.** Abierto, sin línea de color; cerrado, con su franja y el número neutro.
    - **Horas de los tramos.** Van de 5 en 5, como las de las paradas.

369. **Cada tramo hacia delante, también entre basílicas** (2026-09-29, PROMPT_ROMA_V4_REPASO 7): D4M con Letrán va en
    metro A de Spagna a San Giovanni y sigue Letrán → Santa María la Mayor → San Pietro in Vincoli → Mercados de Trajano
    → Monti (la comida queda cerca de Spagna). San Clemente sale del D4M, porque ahí sería de ida y vuelta; va en D5C.

371. **La comida cerca de la Galería Borghese** (2026-09-29, PROMPT_ROMA_V4_REPASO 9): la regla de siempre (la comida y su
    alternativa a 15 min andando como mucho de la parada de antes) no se cumplía porque no había ningún restaurante cerca.
    Nuevo en los datos, con dirección y coordenada comprobadas (turismoroma.it y OSM): Girarrosto Fiorentino, Via
    Sicilia 46, arriba de Via Veneto, a unos 10 min por Porta Pinciana. Descartados: Molto de la Galería (ya no aparece
    en su web), Al Ceppo (Via Panama, 17 min) y Caffè delle Arti (16 min).

372. **La cena, también a 15 min andando como mucho de lo último** (2026-09-29, PROMPT_ROMA_V4_REPASO 10): la escrita o
    su alternativa si están a 15 min. Si no, la más cercana, y solo si ninguna está a 15 min, la escrita. En D4M, desde
    los Foros: La Boccaccia (8 min) o Trattoria Valentino (10), en Monti, en vez de Trattoria Monti (20).

376. **Un aviso, un tema** (2026-09-29, PROMPT_UI_REPASO 1):
    - **Cada aviso habla de una sola cosa y su título dice exactamente esa cosa.**
    - **Cada cierre en su tarjeta**, con sus días y lo cerrado en el título: «Domingo 6 y martes 8 · Museos Vaticanos
      cerrados». Con un festivo, «… el martes 8, la Inmaculada».
    - **Cada fecha curada en la suya.** Las que se repiten llevan el día real delante (`titulo_con_fecha`): «Domingo 6 ·
      El Coliseo y los museos del Estado, gratis». Nunca «museos» a secas.
    - **Primero lo que cambia la ruta** (cierres), después lo informativo.
    - **Iconos:** confeti solo para fiestas y eventos; calendario tachado para los cierres; entrada para los días gratis.

377. **Sin tarjeta «Sal de Roma un día» ni banner de excursión** (2026-09-29, PROMPT_UI_REPASO 2): de la excursión solo
    queda el enlace pequeño «¿Prefieres una excursión este día?», al final del día de la oferta (o del día completo más
    cercano, nunca el de llegada ni el de vuelta). Ningún otro día habla de excursiones.

379. **El aire del día** (2026-09-29, PROMPT_UI_REPASO 4-8):
    - **Cabeceras de tramo:** 50 px encima de cada una y 12 px debajo, hasta el primer «+ Añadir parada».
    - **Comida y cena:** 50 px encima y 50 debajo, como la noche.
    - **Barra de llegada:** 50 px hasta «MAÑANA».
    - **Las cifras del día:** tres en fila, separadas por una línea fina; el número en Instrument Serif (18 px) y la
      palabra en mono y en mayúsculas («13 PARADAS | 10,6 KM A PIE | 7 H 30 DE ACTIVIDAD»). Sin iconos ni caja, centradas.
    - **«De camino»:** del mismo ancho que las paradas, con 16 px arriba y abajo.

380. **La ventana de llegada y vuelta, con el mapa del viaje** (2026-09-29, PROMPT_UI_REPASO 9): arriba ya no va una foto,
    sino el mapa de la pestaña Ruta, con el viaje entero (los días con sus líneas y el punto de llegada). Las fotos
    comprobadas de `_llegada.json` quedan para la página de revisión.

381. **Todos los días se pueden mover** (2026-09-29, PROMPT_UI_REPASO 10), también el de llegada y el de vuelta, y todos
    llevan el asa.
    - **Qué va con la posición:** el que queda primero hereda el alojamiento y la llegada, el último la vuelta, y cada
      uno toma la fecha de su puesto.
    - **Qué no se mueve:** el día sintético de vuelta y un cambio de ciudad a mitad de un viaje con varios destinos.
    - **La marca roja:** si un día movido (respecto a la ruta original) cae en una fecha en la que una parada cierra o
      está cerrada a esa hora, sale la marca de siempre («Hoy cierra», «Cerrado a esa hora»).

382. **La tarjeta de parada, más limpia** (2026-09-29, PROMPT_UI_REPASO 11).
    - **En la tarjeta solo va:** la hora, el nombre, una línea con el horario (reloj) y el tiempo de visita (reloj de
      arena), y las etiquetas.
    - **Va a la ficha:** «Reserva obligatoria / recomendada» a Entradas; «Por dentro / Por fuera» a Resumen.
    - **Fuera de la tarjeta:** «Añadida por ti», «Revisita», «Por tu experiencia», el paseo nocturno y el final del
      Free Tour.
    - **Solo se queda lo rojo** cuando hay un problema: «Hoy cierra», «Cerrado a esa hora», «Llegas después», «Ya te
      has ido», el motivo de un «por fuera» por cierre.

383. **El bus y el metro, como la fila de andar** (2026-09-29, PROMPT_UI_REPASO 12): el tramo en transporte escrito sale
    con su icono y el número de línea («Bus 115 · 20 min», «Metro B · 20 min», «Taxi · 20 min»), el enlace «Rutas», que
    abre Maps en transporte público hasta la parada para ver dónde se coge, y «+ Añadir parada» a la derecha. Las
    alternativas («o el 870», «o un taxi») siguen en la ficha.

385. **Desde el bloque de justo antes** (2026-09-29, PROMPT_UI_REPASO 14): la comida y la cena dicen los minutos andando
    desde lo de justo antes (con aperitivo antes de cenar, «desde el aperitivo», no desde la última parada), y a menos
    de 1 min, «Justo al lado de…», nunca «0 min andando».

386. **Cabecera y barra de abajo** (2026-09-29, PROMPT_UI_REPASO_2 1; sustituye a la columna de botones de la regla 378 y a
    la pestaña Reservas de arriba):
    - **Cabecera:** junto al «● %», la bombilla (los tips del viaje) y la varita («Volver a mi ruta original»; sin
      cambios, «Tu ruta está tal como te la preparamos»). La varita va siempre visible y siempre igual. La maleta y el
      modo noche salen de aquí.
    - **La barra de abajo:** una píldora oscura (#1F1B16) de 64 px, a 24 px de los lados y 26 del borde de abajo, flotando
      sobre la lista (en escritorio, con el ancho de la lista), con sombra suave. Cinco sitios sin texto, iconos de línea
      en crema, 44 × 44 px de toque y su `aria-label`: maleta (nuevo viaje), presupuesto (la bolsa, abre el panel del
      presupuesto), perfil en el centro (círculo terracota de 50 px: «Hola, viajero» y MIS VIAJES, con el abierto
      marcado), mapa (abre el mapa; sustituye a «Mostrar mapa») y reservas (con su «!» naranja mientras falte algo).
    - **Arriba quedan cuatro pestañas:** Hoy, Ruta, Días y Explorar. No queda ningún botón flotante suelto, y las listas
      dejan 144 px abajo para que la barra no tape nunca la última tarjeta.

387. **La nota de temporada vive en la ventana de los avisos de fechas** (PROMPT_UI_REPASO_2, 2), no en la pestaña Días.
    - Es la **primera tarjeta**, siempre; los festivos y días especiales van detrás. Si no hay ningún aviso de fechas, la
      ventana sale igual, solo con ella (una vez por ruta: su texto entra en la firma de lo ya visto).
    - Título: la temporada y el destino («Invierno en Roma»); su texto, el de siempre.
    - En el sitio del dibujo, una franja con el degradado y el efecto de su época, como en el formulario: invierno, nieve
      cayendo; verano, el sol poniéndose; primavera, pétalos; otoño, hojas. Suave y solo dentro de la franja: nunca tapa
      el texto. Con «reducir movimiento», quieta.

388. **Los tips del viaje** (PROMPT_UI_REPASO_2, 3): la bombilla de la cabecera abre una ventana a pantalla completa con
    los de su destino, en `data/dias/<destino>/_tips.json` (servidos por `/api/destination-tips`).
    - **Pocos y buenos: de 5 a 8.** Solo los que ahorran dinero, tiempo o un mal rato, o que el viajero no sabía; nada que
      ya diga una parada.
    - Cada uno con su orden, su etiqueta (`dinero` verde «Ahorras dinero», `tiempo` azul «Ahorras tiempo», `mal_rato`
      terracota «Te evitas un mal rato»), su título, dos o tres líneas de tú a tú, su fuente y su fecha de comprobación.
    - Cabecera oscura con la bombilla, «N COSAS QUE <gentilicio> TE DIRÍA» (`local`, «un romano») y «Lo que ojalá te
      hubieran contado». Si el tip tiene que ver con algo que se reserva (`enlace: "entradas"`), lleva «Ver entradas de
      tu viaje ›», que abre Reservas.
    - **Aquí sí pueden ir precios**, como en Entradas, siempre comprobados en la web oficial y con la fecha.
    - Un destino sin tips: la ventana lo dice («Aún no tenemos los tips de X»), sin inventarlos.

389. **Un texto curado que depende del día dice la hora de ESE día** (PROMPT_UI_REPASO_2, 4). El `por_que` puede llevar
    `variables` ({nombre: {siempre, <día de la semana>, <AAAA-MM-DD>, sin_fecha}}) y usarlas en su texto como `{nombre}`;
    `temprano_antes` también puede ser una variable. Con fechas manda el día exacto, luego el día de la semana, luego
    `siempre`; sin fechas, `sin_fecha`, que cuenta las excepciones. Ejemplo: la tasa de la Fontana de Trevi (2 €, de 9:00
    a 22:00; lunes y viernes desde las 11:30; algunos lunes desde las 14:00; fontanaditrevi.roma.it, 2026-09-29): el
    lunes a las 9:30 la parada ya dice que bajas sin pagar, porque la tasa empieza a las 11:30.

390. **Lo que vuelve a la tarjeta de parada, y lo que va a la ficha** (PROMPT_UI_REPASO_2, 5; retoca la regla 382):
    «Revisita» y «Por tu experiencia · <experiencia>» son etiquetas, con el mismo estilo que las demás (útiles de un
    vistazo). El nombre del paseo nocturno y dónde acaba el Free Tour («El tour acaba en Piazza Navona…») van dentro de
    la ficha, arriba del Resumen. «Añadida por ti» no sale.

409. **Lo que se ve de una parada** (PARA_CODE_NAVONA, 2026-10-01).
    - **Un nombre interno nunca se ve en pantalla**: ninguna etiqueta ni título con guion bajo («mercadillo_navideno» es
      «Mercadillo de Navidad»). La prueba de Navidad lo cuenta.
    - **Las etiquetas solo dicen qué es el sitio** (Plaza, Iglesia, Mercadillo de Navidad…). «Revisita» y «Opcional» se
      quedan; «Por tu experiencia» no sale en ninguna parada.
    - **El nombre de una parada es el mismo en la tarjeta y en la ficha.** Y va **primero el lugar y luego lo que tiene
      que ver con la fecha**: «Piazza Navona y su mercadillo navideño», «Plaza de San Pedro y los 100 Presepi».
    - **`sin_texto_ia`** en un lugar: su ficha lleva solo nuestro texto, sin el que escribe la IA bajo demanda.
    - **Un texto que dice «antes de cenar» va en una parada que acaba antes de la cena**, en todos los viajes.
    - **La pestaña «Entradas» nunca sale en un sitio de acceso libre**, salvo que esté incluido en un Free Tour, una visita
      guiada o una actividad: entonces sí, y en ella va ese tour o esa visita. Un sitio libre con una parte de pago (la
      cúpula, la cripta, las excavaciones) la mantiene, y en ella dice claro que la entrada al sitio es libre y que solo
      se paga esa parte. Las nocturnas no la llevan.
    - Las paradas de Navidad llevan el aspecto normal (el aspecto propio se diseñará más adelante; decisión del usuario,
      2026-10-01). Un lugar sin ficha escrita a mano lleva `sin_texto_ia` hasta que tenga su texto.

412. **El día, bien alineado** (PROMPT_UI_REPASO_3, 2026-10-01).
    - Todas las tarjetas del día van alineadas entre sí, dentro de la línea del día, y con el mismo hueco entre ellas:
      paradas, comidas, cenas, aperitivos, desayuno y «De camino». La comida y la cena llevan su hueco encima, como una
      parada.
    - Cada cabecera de franja lleva 40 px de margen arriba (también la primera, debajo de la llegada) y 12 abajo (antes
      28; PROMPT_UI_REPASO_4).
    - Un tipo de transporte, un icono lineal, sin emojis: bus, metro, tranvía y taxi.
    - La comida y la cena se arrastran con la misma asa que las paradas. La comida no acaba en la noche ni la cena en la
      mañana: fuera de su parte, vuelven a su sitio. Las horas se recolocan por posición, como al mover una parada; un
      restaurante sigue sin ser una parada del motor (`DayPlan.mealAfter`).
    - En la pestaña Ruta, una tarjeta por destino: bandera, nombre del destino y sus días y fechas. Tocarla abre su
      ventana de hoteles y actividades.

417. **Días, repaso 4** (PROMPT_UI_REPASO_4, 2026-10-01): las cifras del día con 20 px debajo; la zona de la foto de las
    tarjetas, el doble de ancha (208 px; 168 en el móvil), con el nombre en las líneas que haga falta y la hora sin
    partir; el asa de arrastrar, centrada en la tarjeta y nunca al lado de un hueco vacío.

423. **Las ventanas van por encima de todo y llevan su cruz; abrir un día sube a su principio** (PARA_CODE_TODO_2026-10-01,
    paso 6). Las ventanas (fichas, «Añadir parada», «Abrir ruta en…», alojamientos y actividades del destino) se pintan
    en el body, por encima de los menús y de la barra flotante, con su cruz visible; la del destino, a pantalla completa
    sin el mapa de debajo, con «Excursiones desde {destino}» solo si hay excursiones. Al tocar un día, los demás se cierran
    y la pantalla sube sola hasta su primera parada.

424. **El pool del formulario, guardado y listo desde el principio** (PARA_CODE_TODO_2026-10-01, paso 7). La lista del pool
    se guarda en el navegador con la versión de los datos del servidor (`data_version`, que cambia sola al cambiar
    roma.json o sus fotos) y se revalida en segundo plano; las fotos ligeras (640 px) llegan en una petición
    (`/api/pool-photos`) en cuanto se sabe el destino, y las propias llevan `?v=` y caché larga en Vercel. Una foto ya
    resuelta se guarda 24 h para el pool, Explorar y Añadir parada.

425. **La varita, en cada día** (PARA_CODE_TODO_2026-10-01, paso 8). Entre los tres puntos y la flecha de cada día: «Recuperar
    este día» (la copia de cuando se creó el viaje) y «Recuperar toda mi ruta» (también los días borrados y la llegada y la
    vuelta), cada una con su pregunta y su «Deshacer»; la que no tiene nada que recuperar, en gris con «Está tal como te lo
    preparamos». En un día que crea el viajero, solo la de la ruta. Ni en la cabecera ni en los tres puntos.


426. **Una parada opcional nunca crea una espera ni sale cerrada: si no está abierta a su hora, no entra**
    (PARA_CODE_TODO_2026-10-01, ajuste final). Santa Cecilia in Trastevere es opcional en todos los días escritos: si a su
    hora está cerrada o habría que esperar a que abra, se quita, y su tiempo lo recoge la parada que se estira.

429. **«¿Dónde la ponemos?»: el viajero decide, sin avisos** (PARA_CODE_EXCURSIONES, 3).
    - «Sustituye uno de tus días» (nunca el de llegada ni el de vuelta; un día que ya es una excursión se puede cambiar por otra) u «O en un día
      nuevo» (al final de la lista, con el nombre de la excursión). El día sustituido pasa a ser la excursión y se llama como ella; sus paradas se
      quitan y el resto del viaje no cambia; con la varita de ese día («Recuperar este día») vuelve tal como estaba. Una de medio día solo ocupa la
      mañana (hasta las 14:00): la tarde sigue en el destino. En los dos casos, la app vuelve a Días con ese día abierto.
    - Un día que crea el viajero se llama siempre como lo llamó, aunque quede el último de la lista.

430. **Más días en la lista que en el viaje** (PARA_CODE_EXCURSIONES, 4). Añadir un día (o una excursión en un día nuevo) ya no alarga el viaje: la
    duración (`answers.days` y sus fechas) es la que eligió el viajero y solo se acorta si quedan menos días que ella. Con más días que viaje,
    debajo de «+ Añadir día» sale una sola línea con un aviso terracota: «Tu viaje es de {n} días y ahora tienes {m}. **Añade un día más a tu
    viaje** (enlace: abre el calendario de fechas) o elimina el que menos te convenga». Desaparece en cuanto cuadran. Nada más.

431. **«+ Añadir día»: primero qué quieres hacer** (PARA_CODE_EXCURSIONES, 5). Con excursiones en el destino, sube una ventana («DÍA {n} · NUEVO» /
    «¿Qué quieres hacer este día?») con «Añadir lugares» (la de siempre: nombre del día y Explorar) y «Añadir una excursión» (con los sitios de
    excursión del destino en una línea, dato `ejemplos_linea`); esta abre la página y la excursión va directa al día nuevo, sin «¿Dónde la
    ponemos?». Sin excursiones en el destino, la ventana no sale.

432. **Los textos que lee el viajero nunca nombran a las empresas con las que trabajamos** (proveedor de excursiones, de alojamiento, de vuelos…).
    Se dice «Reservar», «tu reserva», «Ver más alojamientos». Cambiados al aplicarla: la etiqueta de las entradas («Civitatis» / «GetYourGuide» →
    «Reserva»), «Ver más en Booking.com» (→ «Ver más alojamientos»), «se buscan en Booking» (→ «se reservan aparte»), «Ver en Civitatis»
    (→ «Reservar»), «Reservado vía Stay22» y «Reservado vía Skyscanner» (→ «Tu reserva»), el proveedor que salía junto al hotel, y el consejo de
    Roma «Reserva con antelación en Civitatis». Los enlaces y los datos internos sí pueden llevar el nombre; los nombres de trenes y autobuses
    (Leonardo, Airlink…) son información, no proveedores.

433. **Reservas se calcula siempre desde la ruta: nunca puede decir un día, una parada o una excursión distintos de los que hay en la pestaña Días**
    (PARA_CODE_RESERVAS, 1 y 2). `src/lib/bookings.ts` (funciones puras). Debajo de lo de siempre, dos secciones con el mismo formato de filas:
    - **«ENTRADAS»**: las tres entradas imprescindibles del destino (dato `entradas_reservas`: nombre y lugares de la ruta que cubre; en Roma, Coliseo + Foro y
      Palatino, Museos Vaticanos y Capilla Sixtina, Panteón) que están en la ruta, cada una con su día («Día 2 · jue 15 oct»); y «Ver {n} entradas más de
      tu ruta ›» con las demás paradas con entrada (de pago, con reserva obligatoria o con precio de entrada). Si no hay más, la línea no sale.
    - **«EXCURSIÓN»**: una sola fila. Con un día de excursión en el viaje, esa excursión con su día; sin ninguno, «Excursiones desde {destino}» con «{n}
      excursiones · {%} de valoración media» (solo «{n} excursiones» sin nota real) y «Ver excursiones», que abre la misma página del botón del autobús.
      Sin excursiones en el destino, o con menos días que `excursiones_desde_dias`, la sección no sale.
    - Si se mueven los días, la línea de cada fila cambia sola; si se quita una parada con entrada, su fila desaparece (con la imprescindible que cubre varias,
      cuando se quitan todas); si se añade, aparece; si se añade, cambia o quita la excursión, cambia la fila.

434. **El % de la cabecera suma lo de Reservas** (PARA_CODE_RESERVAS, 3). `buildReadinessItems(route, resolved, extras)`: cuentan las filas que se ven sin desplegar
    (vuelos o transporte de ida y vuelta, alojamiento, seguro, eSIM, N26, vehículo si lo hay) más las entradas imprescindibles que están en la ruta y la excursión
    solo si el viaje tiene un día de excursión (peso 1 cada una). No cuentan las de «Ver más» ni la fila «Excursiones desde {destino}» sin excursión: un viaje sin
    excursión llega al 100 %. Como Reservas sigue a la ruta, el total cambia solo (se quita el Panteón y deja de contar).

435. **«Añade tu reserva»: una sola ventana para todo, y el día lo pone la fecha de la reserva** (PARA_CODE_RESERVAS, 4). Desde «Añadir» de cada fila y desde «¿Ya la has
    reservado? Añade tu confirmación» (tarjeta de la excursión y pestaña Entradas de una parada con entrada). Tres pestañas: «Pegar email», «Captura o PDF» (se leen
    con IA, `/api/read-booking`; sale «Lo hemos leído así» para corregirlo) y «A mano» (día y hora, lo demás opcional). Nunca la app elige el día: busca el día del
    viaje que cae en esa fecha; si es otro del que tenía, la pasa a él y lo dice («Tu reserva es del viernes 16: la pasamos a tu Día 3»); fuera del viaje, no se guarda
    hasta que cuadre; sin fechas en el viaje, se elige el día. Lo que se lee del email no se guarda en ningún sitio (ni caché ni registro): se devuelve y ya.

436. **Lo reservado tiene fecha y hora fijas: nada del motor ni del viajero lo mueve. Para cambiarlo, se quita y se vuelve a crear** (PARA_CODE_RESERVAS, 6).
    - Una entrada reservada pone la parada a la hora de la entrada y en el día de su fecha (`Stop.reservedId`); una excursión reservada fija ese día (`isDayPinned`).
      Tarjeta: «Reservada ✓» (verde) y un candado con «Fijada», sus datos (hora, punto de encuentro, n.º de reserva), sin «Reservar» ni «¿Ya la has reservado?»; en la
      pestaña Entradas, «Ya tienes entrada · {hora}» en lugar de los enlaces para comprar.
    - No se puede: mover ese día (arrastrar, «mover el día»), sustituirlo por otra excursión («¿Dónde la ponemos?» no lo ofrece), eliminarlo, ni cambiar la hora, mover
      o quitar la parada reservada. La varita no quita lo reservado (la de un día de excursión reservada no tiene nada que recuperar; al recuperar un día o toda la ruta,
      `reapplyReservations` deja lo reservado en su sitio y a su hora). Al mover los demás días, las entradas reservadas siguen a su fecha.
    - «Quitar del viaje» (única salida): «¿Quitar {nombre} de tu viaje?» con el aviso amarillo «Quitarla de tu viaje no cancela tu reserva. **Cancela primero tu reserva** y
      después quítala aquí.» y «Cancelar» / «Quitar del viaje».
    - Pendiente (no hecho): que el motor, al rehacer la ruta con otras fechas, coloque lo reservado con `compressToFixedHours` (regla 427); hoy se recoloca después, con
      `reapplyReservations`.

437. **Saber solo que alguien ha reservado: el código de campaña de cada viaje** (PARA_CODE_RESERVAS, 5). Cada viaje lleva un código al azar (`app-8F3K2`: nada del viajero ni del
    viaje dentro, `newCampaignCode`) y todos los enlaces de «Reservar» a Civitatis lo llevan (`CampaignLinks` lo pone al seguir el enlace). El nombre del campo sale de
    `VITE_AFFILIATE_CAMPAIGN_PARAM` (por defecto `cmp`) y el número de afiliado de `VITE_CIVITATIS_AID` (por defecto el nuestro, 5206; los enlaces salen `…?aid=5206&cmp=app-8F3K2`; el servidor acepta también los `v-` de los viajes guardados antes): la documentación pública de Civitatis solo explica `?aid=XXX`.
    Las ventas llegan de la API o del informe de ventas del afiliado a `/api/sales/ingest` (cabecera `x-ingest-secret`; tabla en la migración 0017, sin aplicar; en memoria
    mientras no esté `SUPABASE_SERVICE_ROLE_KEY`), **nunca de los correos de nadie**. Al abrir el viaje, arriba de Días: «Hemos visto que has reservado {x} el {día} a las
    {hora}. ¿La ponemos en tu Día {n}?» con «Sí, ponla» (pasa a reservada y fijada) y «Ahora no»; si se cancela una ya unida, «Tu reserva de {x} se ha cancelado» con
    «Quitar del viaje».

438. **Todo lo que se ve lleva foto; sin foto antes que una mala** (PARA_CODE_UI_DIAS, 1; completa la 420). El Coliseo y el Puente Sant'Angelo salen de `sin_foto`: llevan la foto de día
    (`dia_coliseo.jpg`, de las candidatas, con su crédito; `dia_puente_sant_angelo.jpg`, del usuario, sin crédito). `scripts/destino/auditarFotos.mjs` pide a la API la foto de
    todo lo que el viajero puede ver (paradas de los días escritos, paseos, nocturnas, pool, excursiones) y lista lo que se queda sin ella: hoy solo Via Margutta, Via del
    Babuino, Via Veneto, Santo Bambino de Aracoeli y «Pasear por San Giovanni» (sin foto buena en Unsplash: las pasa el usuario). Un «Pasea y piérdete por…» cuya foto de zona
    ya lleva otra tarjeta del día (Campo de' Fiori) no se queda en blanco: prueba con `foto_alternativas` de su zona (`destination_config.paseo_libre.zonas`; en Roma, Piazza
    Farnese para el Centro Histórico).

439. **El viajero nunca ve los niveles ni las marcas internas del motor** (PARA_CODE_UI_DIAS, 2). Fuera de tarjetas y fichas: «Opcional», «Imprescindible» (en el pool
    del formulario) y las etiquetas de datos (`paseo`, `secreto`, `local`, `tranquilo`, `foto`…, `visibleTags` en `tagColors.ts`). Solo salen etiquetas que dicen qué es el sitio (Plaza,
    Iglesia, Museo…) o algo útil al viajero (Revisita, Por fuera, Paseo libre, Reservada ✓, Fijada).

440. **El mapa recogido deja una franja** (PARA_CODE_UI_DIAS, 3). Con la flecha del mapa pulsada en Días o Explorar queda arriba una franja con una flecha hacia abajo («Mostrar mapa»); al
    tocarla el mapa vuelve como estaba.

441. **Añadir lugares** (PARA_CODE_UI_DIAS, 4 y 5). El ejemplo del nombre del día sale de los datos del destino (`destination_config.ejemplo_nombre_dia`; Roma: «Recorrido por el Centro
    Histórico»). El pool de «Añadir lugares» se abre con «Atracciones» marcado. La ventana de «+ Añadir» sube con su tirador y su cruz: el nombre del lugar en letra pequeña,
    «¿A qué día lo añades?», los días con su fecha y su título (el marcado en terracota suave; el que ya lo tiene, apagado con «Ya está en este día») y «Minutos / ¿Cuánto tiempo
    quieres visitarlo?» con el tiempo recomendado del lugar. Al añadir, la pantalla se queda en el pool y sale «Añadido al Día {n} ✓» unos segundos (sin «Deshacer»).

442. **Recuperar** (PARA_CODE_UI_DIAS, 6; cambia la varita de cada día de la 1-oct). «Recuperar este día» va en los tres puntos del día, solo si ese día tiene cambios; nunca en un día del
    viajero (libre o creado con «+ Añadir día») ni en uno fijado por una excursión reservada. «Recuperar mi ruta» va con una varita en la tarjeta del destino, en Ruta (solo con un
    destino: la ruta original es la del viaje entero), con la ventana «¿Recuperar tu ruta de {destino}?». En los dos, lo reservado se queda en su día y a su hora.

443. **Lo reservado se marca en el día** (PARA_CODE_UI_DIAS, 7). Día cerrado: bajo el título, «🔒 Coliseo · 11:00» en el verde de Reservas (con dos o más, «🔒 2 reservas»). Parada con el día
    abierto: la franja de la tarjeta en verde y arriba «Reservada ✓» y el candado con «Fijada». Lo añadido sin reservar no se marca.


479. **Nunca una tarjeta de parada con el recuadro de la foto vacío** (9-oct-2026, Tanda 6r; ya lo pedía la 6f, pero solo se había quitado el texto de dentro y el recuadro de color seguía saliendo). Sin foto (la del sitio no existe, está en `sin_foto` de `_fotos.json` o no ha llegado), la tarjeta sale sin el paralelogramo de la foto: solo la franja de color con su icono, y el texto ocupa el resto. Una sola regla, en `TrazoCard` (`hasPhoto`).

480. **El nombre del Free Tour es «Free Tour por Roma»** en toda la app (9-oct-2026, Tanda 6r): DÍAS, RESERVAS, HOY, fichas, «Añadir parada», hojas y avisos. Sale de `default_free_tour.name` de los datos del destino; el convertidor lo reconoce como el mismo sitio (misma foto: «foto desde Piazza Navona»; mismo enlace). Fuera «Free Tour Centro Histórico»: la prueba 6r da fallo si sale en cualquier sitio.

481. **Todo lo de pago va detrás del mismo interruptor** (9-oct-2026, Tanda 6s): `pagoActivo()` en `src/lib/pago.ts`, un solo sitio para toda la app (`?version=gratis` y `?version=completa` lo cambian en la dirección). De pago: el bloque «Llegada y vuelta», la pregunta de la zona del alojamiento, el resumen de arriba de RESERVAS y, en la barra de llegada y de vuelta de DÍAS, el «+ AÑADIR VUELO» y el punto elegido en la ventana. Con el interruptor apagado no sale ni rastro (ni candados ni avisos), y el % de «viaje listo» no cuenta el transporte ni el alojamiento.

482. **Orden de RESERVAS** (Tanda 6s): resumen (de pago) · Llegada y vuelta (de pago) · Alojamiento · Entradas y Free Tour · Excursiones · Útil para el viaje. Sin banner amarillo, sin la tarjeta oscura del primer y último día y sin filas sueltas de transporte. Las excursiones solo salen en los viajes de los días que marca el destino (`excursiones_desde_dias`; Roma, 4) y, si no salen, tampoco su hueco.

483. **Todo lo que se reserva se puede eliminar** (Tanda 6s): entradas, Free Tour, excursiones y vuelos. «Eliminar reserva» va en rojo dentro de «Cambiar», con su confirmación en la misma ventana. Quitar una reserva no mueve ningún día: ese día se rehace en su sitio y la excursión no cambia de día ni mueve el interruptor.

484. **La ida y la vuelta se guardan en lo que ya existía** (Tanda 6s): `arrivalFlightTime`, `departureFlightTime`, `arrivalPointId` y `departurePointId`; ningún punto viene elegido de serie (solo el puerto de Civitavecchia, que no tiene más). Con puntos de un medio con uno solo (autobús de Roma) se completan con los del tren. En coche no hay hora. Quitar el vuelo borra la hora y el punto y no toca los días.

485. **Entradas y Free Tour sigue el orden de los datos del destino** (Tanda 6s, `entradas_reservas_orden` de `roma.json`): solo las que están en la ruta del viajero, las de siempre arriba y el resto en «Ver n más». Las reservadas son una línea verde «✓ …» con «Cambiar». La hoja de la hora lleva las fichas de los días del viaje («En tu ruta», «Cerrado» en gris) y la rueda con las horas reales de ese día.

486. **Nunca el nombre de un proveedor en un texto del viajero, ni «centro» suelto** (Tanda 6s). La zona del alojamiento se llama «Centro (Panteón, Trevi, Navona)». Comprobado en la prueba `pruebaTanda6s.mjs` (RESERVAS pintada con el código de la app, gratis y de pago, con y sin fechas, 1 a 6 días, todos los medios y estados).

487. **Ninguna hora que ponga la app** (9-oct-2026, Tanda 6t, todos los destinos). La app no promete nada que no dependa de ella: si el vuelo se retrasa, esa hora es mentira. Nunca se enseñan las horas que calcula la app a partir del vuelo, el tren o el barco: «En el centro {hora}», «libre hacia las {hora}» (tampoco en la línea cerrada de llegada y vuelta de RESERVAS), «Sal a las {hora}», ni la tabla «Libre hasta / Maleta a las / Sal a las» de la última tarde (queda solo su texto general). Sí se enseñan las horas que pone el viajero (su vuelo, su reserva) y los datos reales y comprobados (lo que se tarda, la frecuencia, el precio, los horarios, la distancia). Por dentro la app puede seguir usando esas horas para montar el día (`centerMinutesOf`, `leaveMinutesOf`); solo dejan de enseñarse. «Centro» vale cuando es un sitio real (los datos de cómo llegar, «al centro de la ciudad» del traslado).

488. **La ventana de llegada y de vuelta, sin fuentes y sin «Tu primera parada»** (Tanda 6t). Ningún «Fuente» ni enlace a la fuente (ni en las formas de llegar, ni en los bloques, ni en los Tips); los datos siguen en `_llegada.json` para la página de revisión. Sin los botones del punto dentro de la ventana: el punto se elige en RESERVAS; con el punto elegido, solo ese punto y «¿Llegas por otro sitio? Ver Ciampino».

489. **La pestaña «Traslados»** (Tanda 6t): solo en aeropuerto y puerto (Fiumicino, Ciampino, Civitavecchia; avión y barco), a la llegada y a la vuelta; nunca en tren, autobús ni coche; solo si el punto tiene `traslado: { url }` en `_llegada.json` (campo que sustituye a `privado`). Con el punto elegido, el de ese punto; sin elegir, los de todos. El texto del traslado y los nombres salen de los datos (`{destino}`, `{punto}`). Tarjeta «TRASLADO PRIVADO» + «Puerta a puerta · sin trasbordos» + [Reservar traslado] (otra pestaña, aviso «Abriendo la tienda de traslados…», código de afiliado y campaña del viaje). Sin precio y nunca el nombre del proveedor.

490. **La barra de llegada y de vuelta de DÍAS** (Tanda 6t, diseño «1b · Línea y pase azul»): arriba en pequeño «LLEGADA · DESDE BARCELONA» y debajo «Añade tu vuelo y ajustamos tu día» con [+ Vuelo] (de pago, sin hora); con la hora del viajero, «LLEGADA · FIUMICINO», «Cómo llegar desde Fiumicino» y la pastilla verde «✓ 11:20»; gratis, «Cómo llegar a Roma» y solo la flecha «›»; coche, «LLEGADA · EN COCHE» y «La ZTL y dónde aparcar». La fila del alojamiento del día 1 es una fila sin caja (círculo con la cama, texto en cursiva, «+» redondo, ✓ verde).

491. **Entradas y Free Tour: «En tu ruta» y «Ver n más»** (9-oct-2026, Tanda 6v). «EN TU RUTA»: las entradas de las paradas que el viajero visita **por dentro** (una parada por fuera, como el Castillo de Sant'Angelo solo mirado, no lleva entrada) y el Free Tour si va en la ruta, en el orden de `entradas_reservas_orden` de los datos del destino. Son las únicas que cuentan: «1 de 4 reservadas» en el bloque y «Entradas 1/4» en el resumen de arriba (y en el % de viaje listo). Debajo, «Ver n más»: las demás de la lista del destino, que no están en la ruta; no cuentan, no llevan «Añádela» (para meter una en el viaje, «+ Añadir parada» de DÍAS) y la línea no sale si no hay más. Si el viajero añade o quita una parada con entrada, pasa sola de una parte a la otra. Una ya reservada se queda en «En tu ruta» aunque su parada ya no esté.

492. **[Reservar entrada] y [Reservar Free Tour] abren la ficha, no la tienda** (Tanda 6v). Abren la ficha del sitio en su pestaña «Entradas» (Resumen · Entradas · Tips), donde están todas sus entradas con su [Reservar]; es lo mismo que la pestañita naranja de la tarjeta en DÍAS. Vale también para las de «Ver más». «¿Ya la tienes? Añádela» abre la hoja de la hora, como siempre.

493. **La app nunca propone otra hora** (decidido el 9-oct-2026, Tanda 6v, todos los destinos). El viajero compra la entrada cuando le va bien y la app se adapta: al guardar una hora, se queda. No existe la hoja «A las 11:45 la visita no encaja bien en el día. Te proponemos las 13:30 o las 14:00» (regla 17 del 6k, quitada de RESERVAS, DÍAS y la ficha). El día usa la lista escrita de esa hora y, si no la hay, la reserva manda (regla 4), sin preguntar y sin inventar paradas (6r). Lo único que avisa: si dos reservas de entrada del mismo día se pisan (de su hora a su hora más lo que dura la visita): la hoja de abajo y la campana, «Tu Free Tour y tu entrada a Museos Vaticanos y Capilla Sixtina coinciden. Revisa una de las dos reservas.» con [Ver mis reservas], con los nombres de las dos reservas. Se calcula del estado del viaje (`reservationOverlaps`), así que se va solo al arreglarlo. Las excursiones no cuentan.

494. **La zona del alojamiento, con un desplegable** (Tanda 6v, de pago). Una línea «¿En qué zona te alojas?» con un campo «Elige tu zona ⌄» que abre una hoja con las zonas en una rueda y [Guardar]; debajo del campo, [Buscar alojamiento] como botón principal (abre el mapa). Con una zona elegida el bloque se cierra («Te alojas en Prati · Cambiar»); con «Aún no lo sé» o sin elegir, el campo y el botón siguen a la vista. Gratis: sin el campo, solo [Buscar alojamiento].

495. **Excursiones: «¿Ya tienes una? Añádela» dentro de la tarjeta** (Tanda 6v): sin día de excursión, dentro de la tarjeta «Excursiones desde Roma», debajo de [Ver excursiones], en pequeño; con día de excursión, dentro de su tarjeta. Nunca dos «Añádela».

496. **El Free Tour según su hora** (Tanda 6u, Roma). Sin reservar, el de las 10:00. A las 12:00, a las 15:00 y a las 17:00 el viaje lleva el D3 de esa hora (escrito en el documento: «El Free Tour a otra hora»); a las 21:00 no hay D3 ni D1-FT: el viaje lleva los días de «Sin Free Tour» y el Free Tour va en la noche del D1, en lugar de Trevi y la Plaza de España. La hora llega al motor por UN solo camino: el servidor la pone en las respuestas del viaje (la reserva con hora manda sobre la hoja del Free Tour; `respuestasConFreeTour`) y nadie más mira las reservas para saber si hay Free Tour. La hoja del Free Tour ofrece 10:00, 12:00, 15:00, 17:00 y 21:00.
497. **Las horas de los Museos y del Free Tour, a la vez** (Tanda 6u). La reservada manda y la otra se va a la otra mitad del día (tabla «Las horas de los Museos»); la comida se acorta (45 o 30 min) si no, no se llegaría a tiempo a la reserva. Se pisan —y sale el aviso «coinciden»— cuando no da tiempo a llegar de una a otra: 30 min de trayecto y 30 de llegada a la entrada (60 en total) y, si en medio toca comer, 30 más. Ejemplos del documento: Free Tour 10:00 y Museos antes de las 13:30; 12:00 y antes de las 15:30; 15:00 y después de las 11:00; 17:00 y después de las 13:30.
498. **La comida, hasta las 15:00** (Tanda 6u). Ver la regla 7 de REGLAS_RUTAS: una sola constante compartida por el motor, HOY (todayMode) y el panel del día.
499. **Las calles con fama, como paradas** (Tanda 6u, regla 9 de los días escritos): Via della Conciliazione, Teatro de Marcelo, Piazza Venezia, Via dei Fori Imperiali, Arco de Constantino, Puente Sant'Angelo, Via Condotti, Via Veneto, Porta Pinciana y Fuente del Tritón van como paradas con sus minutos; si ya se visitaron otro día pasan a «de camino» («Ya lo visitaste el día n»). El Templo de Adriano (solo por fuera) y la Piazza Colonna son paradas nuevas, sin foto de momento (sin recuadro).
500. **Ningún aviso de «centro a tu aire»** (Tanda 6u): el Free Tour de las 12:00 tiene su día; el aviso de «hemos dejado el día sin él, con el centro a tu aire» ya no existe. Los demás «centro» que sean sitios reales («centro histórico», «ZTL del centro histórico»…) se quedan.

501. **Las reservas mandan y el día lo lleva todo** (decidido el 9-oct-2026, regla 17, todos los destinos). Con una reserva del viajero el día lleva todo lo que tiene escrito; la app solo lo ordena (qué va antes y qué después, por dónde se empieza). Nunca quita nada, nunca lo pasa a «Si te sobra tiempo» por falta de tiempo y nunca acorta la comida. Lo que no cabe antes de la hora fija va detrás de ella, empezando por lo más cercano a ella y sin mandar detrás lo que ya habrá cerrado. Si aun así no se llega, el día empieza antes (hasta las 6:00) o se llega justo, con el aviso. La regla 5 («Si te sobra tiempo») queda solo para los cierres. Está en un solo sitio del motor (`colocarFija`, `conReservaDelViajero`).
502. **El Foro y el Palatino nunca por fuera por la hora** (Tanda 6w). Con el Coliseo reservado por la tarde, el Foro va después del Coliseo solo si quedan 1 h 30 hasta su última entrada contando lo que se tarda; si no, antes, por dentro. Solo va por fuera si ese día cierra.
503. **«Coinciden» y «vas justo»** (Tanda 6w, regla 17). «Coinciden» solo cuando las horas de las dos reservas se cruzan de verdad. «Vas justo» cuando no se cruzan pero no da tiempo a llegar de una a otra (30 min de trayecto, 30 de llegada y 1 h de comida si toca comer entre las dos): «Es posible que no llegues a {la segunda}: {la primera} dura {duración} y vas justo.» Los dos con la hoja de abajo al guardar y la campana mientras siga así. Solo avisan: las dos reservas mandan y el día se queda como está.
504. **Free Tour y Museos en días distintos** (Tanda 6w). El día de los Museos lleva el D3 sin el Free Tour (lo del guía, por libre); el del Free Tour lleva el D1-FT (o el D1) con el tour como «otra parte» (tour por la mañana → la Roma antigua por la tarde; por la tarde, al revés; el Gueto y Trastevere, al final). El Free Tour no desaparece nunca de un viaje en el que está reservado. Cada día ve las reservas grandes de SU fecha (el servidor las manda todas con su hora).
505. **Traslados escondidos** (Tanda 6w): la pestaña «Traslado» solo sale si algún punto de llegada tiene `traslado: { url }`; en Roma no lo tiene ninguno hasta que se pasen los enlaces directos.
