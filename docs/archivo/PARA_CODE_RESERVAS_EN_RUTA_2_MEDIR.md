# Reservas dentro de la ruta · 2 · Medir si cabe

Va **después** de tu respuesta a la consulta (PARA_CODE_RESERVAS_EN_RUTA_1_CONSULTA). **Solo medir:** no cambies nada de lo que ve el viajero. El script de la medida y su informe sí van en un commit, sin push.

## Lo que cambia tras tu respuesta

- **«0 fallos», como propones:**
  - ninguna hora fija rota;
  - nada con el sitio cerrado;
  - nada quitado sin aviso;
  - el atardecer intacto.

  Un imprescindible que de verdad no cabe (viaje de 1 o 2 días, llegada a las 21:00) **no se quita en silencio**: sale el aviso en la campana y decide el viajero. Eso cuenta como «no cabe», no como fallo.
- **Panteón** (comprobado hoy en cultura.gov.it/luogo/pantheon). Las dos cosas son ciertas:
  - la reserva es **opcional**;
  - el acceso va **por franjas horarias**, con 1.200 personas como máximo en cada una.

  Así que:
  - **si el viajero reserva**, es una hora fija como las demás;
  - **si no**, el Panteón sigue como hoy, sin hora fija;
  - **misas:** sábados y vísperas de festivo a las 17:00, domingos y festivos a las 10:30. La venta de entradas se corta una hora antes. Comprueba que el motor ya lo respeta.
- **Galería Borghese:** aunque la web no lo pida, se llega 30 min antes (regla del usuario para todos los sitios). La parada empieza 30 min antes de la hora de la reserva.

## Qué hay que saber

Para cada sitio con entrada y cada hora real de entrada, queremos saber si el día sale bien usando solo lo que permite la propuesta:
1. encoger paseos cercanos;
2. quitar paradas opcionales o «si entran»;
3. elegir uno de los dos órdenes del grupo;
4. si la reserva es de otro día, pasar el grupo entero a ese día, solo cuando el otro día abre en la nueva fecha y conserva sus imprescindibles.

Ten en cuenta los choques que viste:
- un grupo no puede ir a un día en que **su sitio con entrada** (el Coliseo, los Vaticanos…) cierra;
  - **pero si lo que cierra es otra parada del grupo que no es joya, el grupo sí puede ir, y esa parada se ve por fuera.** Por ejemplo, el Castillo de Sant'Angelo cierra los lunes, pero en el día de los Vaticanos siempre va por fuera, así que no bloquea nada;
- Coliseo y Vaticanos no caben el mismo día;
- el día de la excursión, el del Free Tour, Nochebuena y Navidad, y los días de llegada y de vuelta.

## Las horas de entrada

Sácalas de las webs oficiales y apunta la fuente y la fecha en que lo comprobaste:
- **Coliseo:** los turnos que ya tenemos. Compruébalos en colosseo.it.
- **Museos Vaticanos:** si la web no publica los turnos, mira en su página oficial de venta (tickets.museivaticani.va) qué horas salen para varias fechas de temporada alta y baja, y apúntalas con la fecha en que las viste.
- **Panteón:** sus franjas, en la web de venta oficial.
- **Galería Borghese:** a las horas en punto; visita de 2 h (1 h 15 en el turno de las 17:45).
- **Free Tour:** comprueba en la web del proveedor las horas reales, que hoy son 10:00 y 16:00 sin comprobar.

Si una web no da los turnos, dímelo y no te los inventes.

## Cómo medir

- Las 365 fechas del año y los 56 viajes de prueba, con viajes de 3, 4 y 5 días.
- En cada viaje, una reserva en cada hora de entrada, en cada día de la semana, en el día donde ya está la parada y en otro día del viaje.
- Incluye el **Free Tour** como una reserva más.
- Incluye los **vuelos**: llegadas y salidas a las 9, 12, 15, 18 y 21 h. Hoy no pasan por el motor, así que mide cómo quedaría si pasaran.
- Siempre con **30 min antes** de cada entrada.
- **Horas redondas.** El usuario no quiere ver horas como 12:05 o 13:35. Quiere horas **de 10 en 10**: 13:10, 15:20, 17:30, 19:40, 20:50.
  - Las horas fijas (una entrada a las 11:15, el atardecer, una recogida) mantienen su hora real.
  - Las paradas pegadas, a menos de 200 m, siguen seguidas sin redondear.

  Mide estas dos variantes y dime, para cada una, cuántos minutos se pierden al día y cuántos casos dejan de caber:
  1. **De 10 en 10, siempre hacia arriba** (11:38 → 11:40, 11:32 → 11:40). Da minutos de respiro, pero cuesta tiempo.
  2. **De 10 en 10, a la más cercana** (11:38 → 11:40, 11:32 → 11:30). De media no se pierde tiempo, pero a veces una visita o un paseo quedan unos minutos más cortos.

  Si alguna sale mejor combinada con tu idea (redondear más solo donde sobra tiempo), dímelo.
- Para cada caso, el resultado es uno de cuatro:
  - **cabe sin tocar nada;**
  - **cabe** encogiendo o quitando algo (di qué);
  - **cabe cambiando el orden** o el día del grupo;
  - **no cabe** (aviso en la campana).

## Qué quiero en el informe

1. **Arriba del todo, en rojo, cualquier fallo** según la definición de arriba. Con uno solo, no se sigue.
2. Una tabla por sitio: cada hora de entrada y el % de casos en cada uno de los cuatro resultados.
3. Lo mismo para los vuelos, por hora de llegada y de salida.
4. Los casos que no caben, agrupados por motivo: un cierre, el atardecer, la llegada o la vuelta, falta de paseos cerca, viaje corto…
5. Cuántos minutos de paseo hay hoy alrededor de cada sitio con entrada, antes y después, de media y en el peor día.
6. Las horas de 10 en 10: minutos perdidos al día y casos que dejan de caber, con cada variante. Añade un ejemplo de un día entero con cada una.
7. Qué días de Roma habría que reescribir, o dónde habría que poner un paseo, para que no quede ningún caso en «no cabe» en viajes de 3 días o más.

Explícalo en español sencillo, sin jerga.
