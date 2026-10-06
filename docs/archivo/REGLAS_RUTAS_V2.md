# Reglas de las rutas (versión 2, tras el informe de Code)

**Esta hoja manda** sobre cómo se monta una ruta, en todos los destinos.

- Las reglas van **en orden de importancia**: si dos chocan, gana la de arriba.
- Cada regla es **OBLIGATORIA** (si no se cumple, la prueba falla) o **PREFERENCIA** (la prueba solo avisa).
- Una regla nueva entra **en su sitio y quitando la que contradiga**, y se apunta en `docs/reglas/CAMBIOS.md` con su fecha.
- Lo técnico, la pantalla y los datos van en sus propios ficheros (parte 9).
- Debajo de cada regla, **Comprueba** dice qué mira la prueba y **Sustituye** dice qué reglas de INVARIANTES deja sin efecto.

---

## 0. Palabras (para que todos digamos lo mismo)

- **Sitio:** un lugar real con su `id` fijo (`castillo_santangelo`, `puente_santangelo`). El nombre puede cambiar; el `id`, no.
- **Parada:** lo que sale en el día con hora. Puede ser una visita, un paseo, una nocturna, un «De camino» o el Free Tour.
- **Muestra:** la lista de sitios que enseña una parada. «El Puente y el Castillo de Sant'Angelo iluminados» muestra `puente_santangelo` y `castillo_santangelo`. Un paseo muestra su barrio y lo que nombra su texto. El Free Tour muestra sus `covers`.
- **Grupo:** sitios que **nunca se separan** y cuentan como una sola visita (el Coliseo con el Foro y el Arco; Piazza Venezia con el Altar; la Plaza con la Basílica de San Pedro).
- **Día:** lo que se recorre andando en una jornada. Puede llevar varios grupos seguidos (el día del Coliseo lleva su grupo y el del Altar).
- **Visita grande:** un grupo o un sitio con más de 90 min por dentro. El grupo entero cuenta como una.
- **Hora fija:** una hora que el viajero tiene comprometida. Hay cuatro: una entrada reservada, un turno con hora, el Free Tour y un vuelo, tren o barco.
  - Una misa o un cierre **no** es hora fija: es una ventana en la que el sitio está cerrado (regla 1).
  - Una hora escrita sin turno es **orientativa**.
- **Nocturna:** una parada después de la puesta de sol pensada para ver un sitio iluminado.
- **Paseo:** «Pasea y piérdete por {zona}».
- **De camino:** un sitio que se ve al pasar, sin parada larga.

---

## 1. Lo que nunca se rompe

**1. Nunca un sitio cerrado.** OBLIGATORIA
- Ninguna parada empieza antes de que abra ni después de su última entrada. Cuentan los horarios partidos, la última entrada por día, el horario por época, los cierres semanales, las misas, los festivos y los horarios especiales de ese año, sacados de la fuente oficial.
- **Sin fechas de viaje:** horario de laborable, y aviso en la parada si ese sitio cierra algún día de la semana.
- Comprueba: `fuera_de_horario`, `v4_fuera_de_horario`, `cerrada_a_su_hora`, `v4_cerrado_sin_solucion`. Falta probar viajes sin fechas.
- Sustituye: 2, 3, 51, 92 y 470, que pasan a ser el detalle de esta regla.

**2. Una hora fija no se mueve ni se quita.** OBLIGATORIA
- Si no cabe todo, se recorta lo de antes, en este orden:
  1. salen las opcionales;
  2. se encoge la parada elástica;
  3. se acorta la comida, hasta 30 min;
  4. se quita lo de menor nivel (primero el 3, luego el 2).
- Si aun así no cabe, sale un aviso en la campana.
- A una entrada reservada se llega **30 min antes**.
- **Vuelos, trenes y barcos:** pendiente del encargo de vuelos, porque hoy el motor no los recibe.
- Comprueba: `v4_llega_tarde`. Falta comprobar que la hora fija sigue ahí, que se cumple el orden de recorte y que sale el aviso.
- Sustituye: 427 (el «10 min antes»), 466 y 469.

**3. El viajero manda.**
- Lo que reserva, lo que marca en el pool y lo que cambia a mano entra siempre. El motor no rellena ni recoloca nada que haya tocado el viajero.
- Si su reserva coincide con un atardecer o una nocturna, ese día va sin ello, sin forzarlo y sin aviso.
- **Empate entre el pool y un imprescindible de pago,** cuando no caben los dos por dentro:
  - si el imprescindible **se ve bien por fuera** (el Coliseo), entra el extra del pool y el imprescindible va por fuera;
  - si **por fuera no vale** (los Museos Vaticanos), el imprescindible se queda por dentro y el extra va a «No incluido»;
  - las joyas nunca se pierden: como mínimo, se ven por fuera;
  - **sin avisos:** lo decidimos nosotros, y el viajero lo cambia si quiere desde la parada («Quiero entrar») o desde «No incluido».
- Comprueba: falta meter reservas en la prueba grande, con una entrada en cada franja.
- Sustituye: 285, 292, 305, 306, 345 y 457.

**4. Los imprescindibles salen siempre.** OBLIGATORIA
- Primero las joyas, luego los imprescindibles. Nunca se quitan sin decirlo.
- Si uno no cabe o cierra, se ve por fuera si desde la calle se ve algo. Si no, va un aviso.
- Comprueba: `pago_sin_dentro`, `pool_fuera`, `basilica_fuera`. Falta comprobar que todo nivel 1 sale en cada viaje, por dentro, por fuera o con aviso.
- Sustituye: 10, 11 y 31.

## 2. No repetir (lo que más se ve)

**5. Un sitio, una vez en el viaje y una vez al día.** OBLIGATORIA
- Se compara por **`id` de sitio y por lo que cada parada muestra**, nunca por el nombre. Cuentan también las nocturnas, los paseos, los «De camino» y el Free Tour.
- **Excepciones:**
  - la revisita de paso de un nivel 1, por fuera, corta y con su texto («Ya lo viste el día 1…»);
  - la nocturna de la regla 6.
- **Villa Borghese:** «el Parque» y «el lago y el Templo de Esculapio» son dos sitios, con dos `id`.
- Comprueba: `repetido_dia` y `repetido_viaje`, pasados a `id`. Hoy comparan por nombre y dejan fuera nocturnas, paseos y «De camino».
- Sustituye: 4 y la salvedad de la 467.

**6. Las nocturnas.** OBLIGATORIA
- Cada nocturna, **una vez por viaje**.
- Va el mismo día que la visita de día de esos sitios **solo si esa visita fue por la mañana**, antes de las 13:00. Si fue por la tarde, la nocturna va otro día.
- Si algún sitio que muestra la nocturna salió esa tarde, la nocturna no va ese día.
- De noche, varios sitios pegados pueden ser **una sola parada** (el Puente y el Castillo de Sant'Angelo iluminados). De día van por separado.
- **Una nocturna cada noche** mientras queden sitios que valgan la pena, aunque haya que cruzar la ciudad. Si el viajero no quiere, la quita.
- Comprueba: `nocturna_repite` (hoy está rota) y una nueva, «nocturna una vez por viaje».
- Sustituye: 83, 96, 100 (el «o no sale»), 170, 190, 192, 204, 300 y **416**. Se queda la 462.

**7. Un barrio, una vez al día.** PREFERENCIA
- Cada paseo, una vez por viaje **si queda otro paseo**. Si no queda, puede volver otro día, pero nunca el mismo.
- Comprueba: `barrio_dos_veces`, y una nueva para los paseos.
- Sustituye: 447, que pasa a valer para todos los paseos.

**8. El Free Tour sustituye la parte del día que enseña lo mismo.** OBLIGATORIA
- Según la hora a la que sale:
  - **de mañana** (antes de las 13:00): sustituye la mañana del centro. Antes del tour, **Trevi a las 8:00 y el Panteón por dentro están bien**;
  - **de tarde** (de 13:00 a 18:59): sustituye la tarde del centro, con el Panteón por dentro justo antes;
  - **de noche** (desde las 19:00): sustituye la nocturna de ese día.
- Lo que el tour recorre no sale **después** del tour ese día. El tour no entra en los sitios.
- Los días sin tour y las horas especiales de festivo salen del dato del tour.
- Comprueba: `tour_repite`, corregida para que no cuente lo de antes del tour.
- Sustituye: 195, 413 (lo del Free Tour), 465 y 473.

## 3. Qué se ve en el viaje

**9. Lo mejor, primero.** PREFERENCIA
- Las joyas, como tarde el día 3 (el día 2 en viajes de 2 días). Después, lo muy recomendable y lo distinto.
- Comprueba: una nueva, «primera aparición de cada joya».

**10. Cada día tiene un sentido.** OBLIGATORIA
- Cada día es una zona que se recorre andando, con **una sola visita grande**.
- Cada entrada va con su grupo, y ese grupo marca su día.
- Un grupo nunca se parte entre días.
- Comprueba: una nueva, «grupos partidos» y «dos visitas grandes en un día».
- Sustituye: 14 y 34.

**11. Según los días del viaje.** OBLIGATORIA
- **1 día:** todo por fuera, salvo lo marcado en el pool.
- **2 días:** por dentro solo lo que dice el destino o lo marcado. Si se marcan dos visitas grandes, un día cada una.
- **Medio día:** sigue la regla de 1 día. Pendiente del encargo de vuelos.
- **3 días o más:** el viaje completo.
- Las excursiones se **ofrecen** desde los días que marca el destino (`excursion_desde_dias`), y el botón del autobús sale desde otro dato (`excursiones_desde_dias`). Pasado el máximo de días del destino (`max_auto_days`), los días van en blanco para el viajero.
- Comprueba: falta meter el viaje de 1 día en la prueba grande.
- Sustituye: 338, 428 (la parte de los días), 449 y 450.

**12. El pool entra primero.** OBLIGATORIA
- En el orden en que el viajero lo eligió, con su grupo y en el sitio escrito de cada lugar.
- Los extras van según los días: 2 días, 2; 3 días, 3; 4 días, 4; 5 o más, 5.
- Nunca va en un día en que ese lugar cierra.
- Lo que no cabe sale en «No incluido», con su motivo.
- Comprueba: `pool_fuera`. Falta comprobar el orden y el aviso.

**13. Una experiencia elegida siempre añade algo que se nota.** PREFERENCIA
- Si no añade nada, no se ofrece.
- Comprueba: una nueva, que compare el mismo viaje con y sin la experiencia.

## 4. Las anclas del día: la comida y la cena

**14. La comida, siempre.** OBLIGATORIA
- **Sin hora fija detrás:** de 45 a 90 min, en la zona donde estás.
- **Con hora fija detrás:** se adapta. Puede ser algo rápido desde las 12:00 (unos 30 min) o una comida tranquila a las 14:30 o 15:00.
- El restaurante está a 15 min andando o menos y abierto ese día. Nunca el mismo restaurante dos veces en el viaje.
- Comprueba: `comida_menos_45`, `v4_comida_corta`, `restaurante_repetido`. Faltan el máximo de 90 min, el de 15 min andando y que esté abierto.
- Sustituye: 36, 63, 64, 135, 157, 171, 177, 179, 235, 365, 392 y 408. Se quedan 460, 469 y 475.

**15. La tarde acaba donde se cena.** OBLIGATORIA
- La cena, nunca antes de las 19:30 (20:30 en verano), y a 15 min andando o menos de lo último.
- El rato antes de cenar es «Pasea y piérdete por {zona}». No existe el «Tiempo libre».
- Comprueba: `cena_espera`, `hueco_cena`, `tiempo_libre_sigue`. Faltan los 15 min y la hora mínima.
- Sustituye: la familia del «Tiempo libre» y la «Tarde libre» (44, 102, 122, 129, 139, 156, 183, 194, 222, 240, 246, 263, 311, 317, 321, 328, 351, 370, 373, 375 y 384). Se quedan 341, 342, 352 y 419.

## 5. Cómo se ordena un día

**16. La tarde va según la luz.** OBLIGATORIA
- Cada día tiene cuatro tardes (A, B, C y D) según la hora de la puesta de sol, con una parada elástica de ±30 min.
- Al mirador del atardecer se llega entre 15 y 35 min antes de que se ponga el sol.
- Comprueba: lo de hoy (323, 327, 334, 336, 337, 343, 348).

**17. A primera hora, lo que luego se llena.** PREFERENCIA
- Madrugar está bien (Trevi a las 8:00).
- Comprueba: una nueva, «sitios que se llenan, antes de las 9:30».

**18. Primero el acceso, si se llega por su lado.** OBLIGATORIA
- La plaza, el puente o el parque van justo antes de su monumento **cuando se llega desde ese lado**. Si se llega desde el otro lado, manda no ir y volver.
- Cada acceso lleva en el dato el lado desde el que se llega. Ejemplos:
  - viniendo de San Pedro: Conciliazione, el Castillo y luego el Puente, que es el camino hacia el centro;
  - viniendo del centro: el Puente y luego el Castillo.
- Comprueba: `plaza_despues`, mirando el lado de llegada.
- Sustituye: 17b, 273 y la 416 (el orden).

**19. Sin ir y volver.** PREFERENCIA
- El recorrido no da vueltas ni zigzaguea.
- Un tramo de más de **25 min andando** va en bus o taxi si llega antes. Un traslado escrito no se usa si andando son 12 min o menos.
- Comprueba: `zigzag` y `tramo_largo`.
- Sustituye: 29 y 364, que quedan dentro de esta.

**20. Los huecos, según cuánto duran y qué viene después:**
- **Hasta 30 min:** se estira la parada de antes, **si es de las que se disfrutan con calma** (plaza, parque, mirador, barrio). Si es un sitio pequeño (una iglesia, una fuente), se hace lo de la línea siguiente.
- **Más de 30 min:** un sitio que pille de camino, que valga la pena, abierto, de esa zona y no visto antes. Si no lo hay, el paseo de la zona.
- **Antes de una entrada reservada** (hasta 60 min): nada, es margen para llegar con calma.
- **Antes del atardecer:** el paseo por la zona del mirador.
- **Antes de cenar:** «Pasea y piérdete» por la zona de la cena.
- Cada parada lleva en el dato si se puede estirar (`elastica`) y cuánto.
- Una parada opcional nunca crea una espera ni sale cerrada.
- Comprueba: `hueco` y `libre_largo`.
- Sustituye: 419 (es esta, con su orden) y 461.

**21. La época del año.** OBLIGATORIA
- **Julio y agosto:** de 14:00 a 16:30, solo sitios a cubierto o descanso. Lo que va al aire libre, después.
- **Invierno:** anochece pronto, pero las paradas siguen siendo paradas normales, con su foto de día. La cena no se adelanta por el sol.
- **Un mirador al que se llega de noche:** si el destino tiene una buena foto de noche de ese mirador, se llama «{lugar} iluminado», lleva esa foto y cuenta como la nocturna de ese sitio (regla 6). Si no la tiene, sigue como parada normal con su foto de día. Es la única parada que cambia por la luz.
- Comprueba: una nueva, «al aire libre de 14:00 a 16:30 en julio y agosto».
- Sustituye: 105, 186, 245, 290, 311, 315 y 328. De la 240 y la 246 se queda solo lo del mirador. Un solo camino para «iluminado», no dos.

**22. Horas de 10 en 10, a la más cercana.** PREFERENCIA
- Las duraciones, de 5 en 5.
- Las horas fijas y las paradas pegadas (a menos de 200 m) no se redondean.
- Comprueba: una nueva, «minuto múltiplo de 10 salvo fijas y pegadas».
- Sustituye: 38, 238, 349, 363, 374, 375 y la sección F. Se queda la 454.

**23. Mínimos y máximos.** OBLIGATORIA
- Un imprescindible, 20 min como mínimo.
- Un paseo, 90 min como máximo.
- Un «De camino», unos 10 min.
- Los minutos de «por fuera» no se recortan.
- La parada elástica no baja del 75 % de lo escrito.
- Comprueba: lo de hoy (284, 286, 329, 348).

## 6. Qué es una parada

**24. Es parada:** cada monumento o lugar de nivel 1 o 2, con su nombre, se vea por dentro o por fuera. OBLIGATORIA
- **No es parada:** una calle que no sea icónica (va en «Por el camino» o en el paseo de la zona). Tampoco los restaurantes y las tiendas, que van dentro de la ficha.
- Las relaciones entre lugares mandan cómo se colocan:
  - `contained_in`: lo de dentro solo sale con su contenedor;
  - `neighbor_of`: van el mismo día y seguidos;
  - `approach_to`: el acceso, con su lado (regla 18);
  - `related_to`: se ponen seguidos si caen el mismo día;
  - `group_order`: el orden dentro del grupo.
- Comprueba: `nivel_camino` y `nivel_idea`.

**25. Por fuera, solo donde se ve algo desde la calle.** OBLIGATORIA
- Va con su texto de `por_fuera`.
- Lo que solo vale por dentro, si cierra, se quita sin aviso.
- Lo que por fuera es un muro (los Museos Vaticanos) nunca va por fuera.
- Junto a un imprescindible, un sitio cerrado se ve por fuera.
- Lo que va por fuera a propósito (el Castillo de Sant'Angelo de día) no lleva «para llegar a todo» ni «Quiero entrar».
- Comprueba: `fuera_minutos` y `fuera_con_tiempo`. Falta «los Museos Vaticanos nunca por fuera».
- Sustituye: se quedan 421, 445, 452, 472 y 476.

**26. Las variantes por cierre y por fecha, en este orden:** primero el cierre, luego la fecha y luego lo que reparten dos días. OBLIGATORIA
- `si_cerrado` dice qué pasa: por fuera, quitar o cambiar.
- Los días que lo necesitan son el miércoles de audiencia, los domingos, el último domingo de los Vaticanos, Pascua, el 29 de junio y los festivos.
- **Navidad y fechas especiales:** la ruta se adapta a horarios, cierres y transporte, y lo dice en los avisos («un aviso, un tema»). Cuenta lo de temporada que ya está en la ruta (árbol, belenes, mercadillos y luces). Nada de eventos de una vez al año.
- Comprueba: lo de hoy (347, 397, 399, 404 y 408).

**27. Las excursiones.** OBLIGATORIA
- Nunca el día de llegada, el de vuelta ni el último día.
- Una excursión reservada fija su día.
- Los días sin excursión salen del dato (`excursion_fechas_no`).
- Comprueba: lo de hoy (121, 362, 429 y 436).

## 7. Llegada y vuelta (pendiente del encargo de vuelos)

**28. Al llegar, se cuenta lo que pasa de verdad.**
- Se cuenta salir del aeropuerto o la estación, el trayecto y dejar la maleta.
- El día de llegada no lleva nada con entrada.
- Si da para una parada antes de comer, **una sola**, cerca del alojamiento. Si no da, a comer directamente.
- Lo apuntado está en `docs/archivo/NOTAS_VUELOS_Y_HORAS_REALES.md`.

**29. Al irse:** se sale con el margen del destino. Esa mañana, el desayuno y una parada cerca.

## 8. Cómo se comprueba

**30. La prueba imprime una línea por regla:** «R-14: 0 fallos», «R-17: SIN COMPROBACIÓN».
- Una regla sin comprobación sale marcada.
- La prueba cubre también viajes sin fechas, de 1 día y con reservas.

**31. Antes de dar un destino por bueno, los datos se cruzan solos** (`validar.mjs`):
- cada `muestra` existe;
- ninguna nocturna deja de nombrar un sitio que enseña;
- ningún nombre está repetido entre paradas, nocturnas y paseos.

Al juntar o renombrar algo, se buscan todas sus referencias.

**32. La revisión como un local:** una lista fija de 20 viajes, guardada en un fichero (de 1 a 7 días, las cuatro estaciones, con y sin Free Tour, con y sin entradas, y Navidad). Claude la revisa parada a parada antes de que el usuario vea nada.

## 9. Dónde va lo demás

```
docs/REGLAS_RUTAS.md          ← esta hoja: manda
docs/reglas/CAMBIOS.md        ← el diario con fechas
docs/INVARIANTES_TECNICO.md   ← motor puro, un día por llamada, caché, API
docs/INVARIANTES_PANTALLA.md  ← la pantalla, al día con el rediseño
docs/INVARIANTES_DATOS.md     ← cómo es un destino: kit, validar.mjs, «comprobado», fotos, textos,
                                 «nada inventado» (lo no confirmado se dice con prudencia o no se dice),
                                 restaurantes sin foto, todo lo que lee el viajero curado en el JSON
docs/archivo/INVARIANTES_V3.md ← lo muerto (ritmos, bloques, días curados v3), con «no vigente» arriba
```

`INVARIANTES_MOTOR.md` queda en solo lectura, con un aviso arriba que apunta aquí. No se borra nada: lo vivo se mueve y lo muerto se archiva.

---

## Lo propio de Roma (datos, no reglas)

- **Joyas:** Coliseo, Museos Vaticanos con la Sixtina, Panteón y Trevi.
- **Imprescindibles:** Foro y Palatino, Arco de Constantino, Basílica y Plaza de San Pedro, Altar con Piazza Venezia, Castillo de Sant'Angelo, Navona, Plaza de España y Trastevere.
- **Castillo de Sant'Angelo:** de día, por fuera, 20 min. De noche, una parada con el Puente.
- **Museos Vaticanos:** el último turno online es a las 16:00. Cierran los domingos, salvo el último del mes (gratis, sin reserva y con cola).
- **Panteón:** misa a las 17:00 los sábados y vísperas, y a las 10:30 los domingos y festivos (son ventanas cerradas, regla 1).
- **El 29 de junio:** horario de domingo.
- **Viaje de 2 días sin nada marcado:** el Coliseo con el Foro y el Panteón por dentro.
