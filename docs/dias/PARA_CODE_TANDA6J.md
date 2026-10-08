# Para Code · Tanda 6j: lo último para cerrar Roma (antes de las llegadas)

**Antes de empezar:**
- **`docs\dias\DIAS_ROMA_PARADAS.md` ha cambiado.** Pásalo por el convertidor y no lo toques. Lo que ha cambiado:
  - el D4 (la Galería antes que el parque);
  - el D1 (el Gesù al final de la tarde);
  - las horas de la Galería Borghese;
  - el precio y las misas del Panteón;
  - la hora de la Basílica;
  - la hora de los Capuchinos.
- **La sección final «Llegadas y vueltas» del documento es de la Tanda 7:** en esta tanda, no la uses. Si el convertidor la lee, que la guarde sin aplicarla.
- **El repaso de horarios y precios está en `docs\dias\AUDITORIA_HORARIOS_ROMA_2026-10.md`.** Cada dato lleva su fuente y su fiabilidad: ✅ oficial · 🟡 sacado de guías o páginas de turismo · ❓ las fuentes no coinciden.
- **Las fotos nuevas ya están en `public\fotos\roma\`,** cada una con su `_p`.

## Cómo trabajar

- **Nada de parches:** cada regla, en un sitio y para todos los destinos.
- **`PROGRESO_TANDA6J.md`,** con una línea por bloque y TERMINADO al final.
- **Lo que decidas tú,** en `PREGUNTAS_TANDA6J.md`.
- **Al acabar,** `INFORME_TANDA6J.md` en palabras sencillas.
- **Commits locales por bloques.**
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. Villa Borghese: primero la Galería, después el parque

Tenías razón con el orden. Mirado en el mapa, de este a oeste van:

Porta Pinciana → Galería Borghese → Piazza di Siena → el lago (Templo de Esculapio) → Reloj de agua → Terraza del Pincio

Con el parque primero había zigzag.
- **El D4 normal (y con la Galería a las 11:00), y también la versión con Free Tour:**
  - primero la Galería;
  - después el parque (la Piazza di Siena y el lago), de camino al Pincio;
  - el Reloj de agua;
  - la Terraza del Pincio.

  La Fuente del Tritón, Via Veneto y Porta Pinciana siguen siendo paradas.
- **Si se llega antes de la hora de la Galería,** se espera en el parque, hasta 40 min (regla 7). En HOY: «Tu entrada a la Galería Borghese es dentro de {n} min. Mientras, da una vuelta por la Piazza di Siena».
- **Las entradas de la Galería ahora empiezan cada hora** (de 9:00 a 17:00, y una a las 17:45). Qué lista usa cada hora:

  | Hora de la entrada | Lista |
  |---|---|
  | 9:00 y 10:00 | la de las 9:00 |
  | 11:00 | el día normal |
  | 12:00 y 13:00 | sin lista: la app propone las 11:00 o las 15:00 |
  | 14:00, 15:00, 16:00, 17:00 y 17:45 | el día al revés; con la entrada a las 14:00, la comida antes, entre las 12:00 y las 12:30 |

  Ponlo también en `TABLA_RESERVAS.md`.
- **El lunes (la Galería cierra):** sin cambios. Pero la Cripta de los Capuchinos abre a las **10:00**, no a las 9:00: si se llega antes, que espere en Via Veneto (regla 7), o que vaya después del parque si así no hay espera.

## 2. El D1: el Gesù va al final de la tarde

El Gesù abre por la tarde a las **16:30** (de octubre a junio) y a las **17:00** (de julio a septiembre), no a las 16:00. Antes se llegaba hacia las 15:30 y había una hora de espera. La tarde del D1 queda así:

Barrio Judío · Largo di Torre Argentina · de camino el Elefantino y Santa Maria sopra Minerva · San Luigi dei Francesi · Panteón por dentro (el sábado, antes de las 17:00) · Piazza Navona · **el Gesù** · cena en Armando al Pantheon

- La lista lo escribe así a propósito: de Navona al Gesù hay ~12 min, y del Gesù a la cena ~5. Esa vuelta no cuenta como zigzag.
- **Lo mismo en la lista del Coliseo a mediodía:** el Gesù va al final de la tarde.

## 3. Los horarios y precios nuevos (todos los sitios)

Mete en los datos de los sitios lo del archivo de la auditoría:
- **lo marcado con ✅ y con 🟡:** horario, horario partido, horario por temporada, última entrada, días de cierre, festivos y precio;
- **lo marcado con ❓:** no lo toques, y apúntalo en el informe.

**Lo que más cambia la ruta:**
- **Basílica de San Pedro:** de 7:00 a 20:00 todo el año (desde junio de 2026).
- **Coliseo y Foro:** del 25 de octubre al 28 de febrero, de 8:30 a 16:30, con la última entrada a las 15:30.
  - En esas fechas, la app no ofrece una entrada al Coliseo más tarde de las 15:30.
  - Con la lista de la tarde, avisa.
- **Panteón:**
  - 7 €;
  - sin visitas el sábado y la víspera de festivo desde las 17:00;
  - sin visitas el domingo y los festivos durante la misa de las 10:30.
- **San Clemente:** las excavaciones necesitan reserva en línea. En la tarjeta: «Reserva las excavaciones en línea: las plazas son limitadas».
- **Catacumbas de San Calixto:**
  - cierran el miércoles;
  - cierran del 13 de enero al 10 de febrero de 2027;
  - la última visita sale a las 12:00 y a las 17:00.
- **Cementerio Protestante:** cierra los días de la lista (dos semanas en agosto y varios de diciembre).
- **Villa Farnesina:** el 2.º domingo de cada mes abre de 9:00 a 17:00.
- **Domus Aurea:**
  - de viernes a domingo;
  - cierra el 1.er domingo del mes;
  - 26 € con guía;
  - reserva obligatoria.
- **Caracalla:** horario por temporada (del 26 de octubre al 28 de febrero, de 9:00 a 16:30).

**En el informe:** los sitios que cambian, con el dato de antes y el de ahora, y las fechas en las que una parada pasa a «Cerrado hoy» por estos datos nuevos.

## 4. El formulario: Experiencias

1. **Vuelve el Free Tour a Experiencias.** Se fue en la 6f (commit `6acb982`, bloque 3) por un error mío al escribir aquella tanda: solo había que quitar la pregunta de la hora, no el Free Tour entero. Déjalo como estaba antes de ese commit:
   - en su sitio: el segundo, justo debajo de Imprescindibles, con la etiqueta «Recomendado»;
   - con su texto: «Ideal si es tu primera vez en {destino}: un guía local te descubre la ciudad a pie.»;
   - con sus reglas de cuándo sale: no sale en los viajes de 1 y 1,5 días;
   - **sin la pregunta de la hora:** por defecto es de mañana (10:00). La hora se cambia después desde RESERVAS;
   - **se queda también** lo de añadirlo o cambiarlo desde RESERVAS y desde «+ Añadir parada», que ya funciona.
2. **Fuera la pregunta «¿Cómo son tus días?»** de Experiencias (la de «Dos días enteros / llego a mediodía / me voy a mediodía»). Los medios días se sabrán por el vuelo, que se pone dentro de la app (Tanda 7). Hasta entonces, los viajes salen con días enteros.
3. **El texto de los Mercadillos navideños no cabe.** Cámbialo por **«Disfruta de la verdadera Navidad de Roma»**. Sale de la descripción de la ventana de temporada del destino.

## 5. La pestaña DÍAS: fuera los puntitos de las tarjetas cerradas

En cada tarjeta de día plegada, debajo del título, salen unos puntitos de colores delante de «12 paradas». **Quita los puntitos.** El texto «12 paradas» se queda.

## 6. Fotos nuevas (son mías)

| Sitio | Archivo |
|---|---|
| Iglesia del Gesù | `dia_iglesia_del_gesu.jpg` (y `_p`): la cúpula y el techo, por dentro |
| Santa Maria in Trastevere | `dia_santa_maria_in_trastevere.jpg` (y `_p`): la fachada y la plaza |

- Ya están en `public\fotos\roma\`: ponlas como fotos de esos dos sitios.
- **La del Gesù es de dentro:** que salga cuando se visita por dentro (como en el D1). Si en algún día va de camino, por fuera, que no use esta.

## 7. Los tres puntos del mapa que pediste confirmar

| Sitio | Lat | Lon |
|---|---|---|
| Reloj de agua del Pincio | 41.91177 | 12.48073 |
| Museos Capitolinos | 41.89310 | 12.48280 |
| El Foro desde la terraza del Campidoglio | 41.89280 | 12.48450 |

El tercero es aproximado (el mirador de detrás del Palazzo Senatorio, a ~150 m de la plaza).

## 8. La varita de la pestaña RUTA («Recuperar mi ruta»)

**El texto del aviso:** debajo del título («¿Recuperar tu ruta de Roma?») va solo esto: **«Volverás a la ruta inicial y se perderá todo lo modificado, únicamente mantendremos tus reservas.»**

**Lo que hace:** los días de ese destino vuelven tal como salieron al crear el viaje, todos:
- las paradas;
- el orden;
- las comidas;
- el interruptor del día 4, en su posición por defecto;
- los días creados con «Crear mi propio día», fuera.

Lo reservado sigue en su día y a su hora, como ahora.

**Con varios destinos** (por ejemplo, Roma y Florencia):
- **Ahora** la varita no sale. Tiene que salir en cada destino.
- **Al usarla en Florencia,** solo vuelven los días de Florencia. Los de Roma no se tocan.
- Para eso, la copia de la ruta inicial tiene que poder recuperarse **por destino**, no solo entera.

**Prueba:**
- un viaje de Roma con cambios: la varita lo deja igual que al crearlo;
- un viaje de Roma y Florencia con cambios en los dos: la varita de Florencia deja Florencia como al principio y Roma con sus cambios.

## 9. Reservas: si la fecha cae en otro día, se mueve el día entero

**Lo que ha pasado (probado en el móvil):** un viaje con el Coliseo en el día 1. Al meter la reserva del Coliseo para el jueves 15 (el día 3, el del Vaticano), pasó esto:
- **En «Añade tu reserva»** salió «A las 13:30 no tenemos escrito cómo hacer este día», con [Pasarla al Día 1] y [La quiero a esa hora]. Y en rojo: «Tu reserva es del jueves 15: la pasamos a tu Día 3».
- **Solo se movió la tarjeta del Coliseo** al día 3: quedó entre la Basílica de San Pedro y el resto del Vaticano, con «20 min en taxi». El Foro, el Palatino y el resto de su día se quedaron en el día 1.
- **En la tarjeta del Coliseo** salen «✓ Reservada» y «🔒 Fijada», pero **no sale la hora de la reserva**.

**Lo que tiene que pasar:**
1. **Si la reserva es de un sitio que tiene su día escrito** (el Coliseo → el día de la Roma antigua, los Museos → el del Vaticano, la Galería → el de Villa Borghese…) **y su fecha cae en otro día del viaje, se mueve el día entero** a esa fecha. Es como si el viajero hubiera movido él el día 1 al día 3, y después la reserva se pone a su hora.
   - **Antes, una hoja desde abajo:** «Para que tengas una buena experiencia en {destino}, vamos a mover el día del {sitio} al día {n} ({fecha}), con tu reserva.», con el botón [De acuerdo]. Sin fechas en el viaje, sin la parte de la fecha.
   - **El orden de los demás días** se rehace con las reglas de siempre, con ese día fijo en su fecha:
     - los cierres (el Vaticano, ni domingo ni miércoles);
     - las otras reservas, cada una en su fecha;
     - las nocturnas, con la regla 13.
     No es un simple cambio de dos días si eso deja otro día en una fecha en la que no puede ir.
   - **Si además se mueven otros días por un cierre, la hoja lo explica siempre.** Ejemplo: «La Galería Borghese cierra el lunes y el miércoles por la mañana hay audiencia del Papa en el Vaticano: te hemos puesto la Galería Borghese el martes, el Vaticano el lunes y el Coliseo el miércoles.». Cada motivo, el cierre real de ese sitio y ese día.
   - **Ese día se rehace con la lista escrita de esa hora** (por ejemplo, la del Coliseo a mediodía).
   - **Los únicos casos en que no se mueve el día entero:**
     - **dos reservas grandes el mismo día** (el Coliseo por la mañana y los Museos por la tarde, o al revés). De momento, cada una a su hora en ese día, como ahora, y apúntalo en el registro. Los días combinados los escribiremos aparte;
     - **la fecha es la del día de llegada o la de vuelta** (eso va con la Tanda 7);
     - **ese día ya tiene una excursión reservada:** aviso «El día {n} ({fecha}) tienes la excursión a {excursión}: no da tiempo a visitar también el {sitio}.». La ruta no cambia; la reserva se guarda en RESERVAS con ese aviso.
   - **Si el sitio no tiene día escrito en ese viaje,** va como ahora: a su fecha y a su hora.
2. **Fuera el aviso «A las {hora} no tenemos escrito cómo hacer este día»** y sus dos botones. Si el viajero pone una hora, es porque ya ha reservado a esa hora: la app la acepta y adapta el día. Si esa hora no tiene lista escrita, aplica la regla 4 en silencio y lo apunta en el registro, sin decírselo al viajero.
3. **El texto «Tu reserva es del jueves 15: la pasamos a tu Día 3»** no va en rojo: es información, no un error. Va en el color normal del texto.
4. **En la tarjeta, una sola etiqueta con la hora:** «✓ Reservada · 13:30» (sin la de «Fijada»; el candado puede ir dentro de la misma etiqueta). **Fuera la línea de arriba «🕘 Entrada a las… · llega a las…»** (también la del Free Tour): basta con la hora en la etiqueta. Lo de llegar antes, el control y el punto de encuentro va dentro de la ficha del sitio, como toda la información práctica.

**Prueba:**
- en viajes de 2 a 6 días, una reserva del Coliseo, una de los Museos y una de la Galería en cada día posible del viaje;
- su día entero va a la fecha de la reserva (o se queda como ahora, con su aviso, si no se puede);
- 0 días con el Coliseo y el Vaticano mezclados;
- nada cerrado;
- 0 nocturnas repetidas;
- la tarjeta siempre con la hora de la reserva.

## 9b. El Free Tour en RESERVAS y el Coliseo en invierno

1. **El Free Tour en RESERVAS solo sale si está en el viaje:**
   - si el viajero lo marcó en Experiencias;
   - o si lo añadió desde la app (desde «+ Añadir parada» y, más adelante, desde EXPLORAR).

   Si no, en RESERVAS no sale nada del Free Tour.
   - **Cuando sale, va como las demás entradas:** su línea con el botón para añadir la reserva (y la hora). Al añadirla, «✓ Reservada · 10:00» en RESERVAS y en su tarjeta del día. Sin reservar, la tarjeta del día va como cualquier parada sin reservar.
   - El Free Tour sigue pudiéndose quitar del viaje desde su tarjeta («···»).
2. **El Coliseo del 25 de octubre al 28 de febrero:** en esas fechas hay que reservar para entrar en todas las zonas. Si el viaje cae ahí y el Coliseo no está reservado, su tarjeta y su línea de RESERVAS dicen **«Reserva obligatoria en estas fechas»**. Con la reserva puesta, «✓ Reservada · {hora}», como siempre.
3. **La mejor hora para reservar** (Coliseo, Museos Vaticanos, Galería Borghese), solo mientras no estén reservados:
   - en su línea de RESERVAS: «Mejor hora este día: 9:00 o 16:00», junto al botón para añadir;
   - en la ficha del sitio, junto al botón de reservar, la misma línea.

   Las horas salen de las listas escritas de ese día (las de TABLA_RESERVAS) y nunca de una hora sin lista. Con la reserva puesta, no sale.

## 10. Pruebas

En los viajes de 1 a 6 días, con y sin Free Tour, en las 365 fechas de 2027:

1. **En todos los D4 con la Galería por la mañana,** la Galería va antes que el parque, sin zigzag y a su hora.
2. **En el D1,** el Gesù va después de Navona y nunca hay que esperar a que abra más de 15 min.
3. **Nada cerrado,** ya con los horarios nuevos.
4. **0 entradas al Coliseo** después de la última hora de entrada de esa fecha.
5. **0 trayectos de «0 m»** y 0 sitios con el mismo punto que su vecino.
6. **El Free Tour sale en Experiencias** en los viajes de 2 días o más, segundo y con «Recomendado», y no sale en los de 1 y 1,5. Marcado, el viaje sale con los días con Free Tour (D3 y D1-FT).
7. **En el informe:** si la comida de los D4 con Naturaleza y Vistas sigue cayendo después de las 15:00.

**Comprobación a mano a 375 px:**
- la pantalla de Experiencias (el Free Tour, sin «¿Cómo son tus días?», el texto de los mercadillos);
- las tarjetas de día cerradas, sin puntitos;
- las dos fotos nuevas.

Al final, **reinicia el api-server.**
