# Informe de la Tanda 6m

Hechos los seis puntos. Las pruebas, a cero fallos. Lo que he decidido yo (y lo que no he visto con los ojos) está en `PREGUNTAS_TANDA6M.md`.

## Lo que cambia

- **La tarjeta de cada entrada** (Coliseo, Museos, Galería, Panteón, Free Tour…) es la del diseño. Sin reservar, en rosa: «ENTRADA · Día 1» (con fechas, «Mar 12 ene»), el nombre entero, el botón grande [Reservar entrada] (abre el enlace de compra y saca «Abriendo la tienda de entradas…»; en el Free Tour, [Reservar Free Tour]) y «¿Ya la tienes? Añádela». Reservada, en verde: «✓ Reservada · 14:00 · Cambiar». Fuera el «Añadir» gris y la mejor hora.
- **La hoja de la hora** («Añádela» y «Cambiar»): una sola rueda y [Guardar · 14:00]. Las horas son las de verdad de cada sitio ese día: el Coliseo, de 8:30 a 15:30 en enero, de 15 en 15; la Galería, solo sus turnos (cada hora y las 17:45); el Free Tour, sus cinco botones. Debajo: «¿Es para otro día? Cambiar el día» (la lista de la 6k; se cambian los dos días enteros) y «Rellenar desde el email o el PDF». Al guardar, lo de siempre: el día se ajusta a la hora y, si no hay día escrito para esa hora, la hoja de la regla 17 con dos horas propuestas.
- **«Eliminar reserva»**, abajo y en rojo dentro de «Cambiar», con la pregunta «¿Estás seguro de que quieres eliminar tu reserva?». La tarjeta vuelve a sin reservar, el día se queda donde está (probado: el día del Coliseo seguía en el día 1 tras eliminar) y la parada vuelve a su lista normal, sin hora fija.
- **Fuera «Mejor hora este día»** de toda la app (la hoja de la regla 17 se queda).
- **La Trinità dei Monti:** la regla 7 no cambia.

## Un fallo que salió al probar

Con el Free Tour, una reserva del Coliseo en otro día no cambiaba los dos días: la parada se iba sola. El día del Coliseo con Free Tour (D1-FT) hereda la mañana del D1 y el motor no lo reconocía. Arreglado; la prueba de la 6k ahora incluye viajes con Free Tour (4.483 viajes, 0 fallos). Y «Abriendo la tienda de entradas…» no salía en RESERVAS (es una pantalla aparte): ya sale.

## Las pruebas

- 6g, 6h, 6i, 6j, 6k, 6l y `pruebaListas` (una de cada 5 fechas, de 1 a 6 días): **0 fallos**.
- **A mano a 375 px, con y sin fechas:** las tarjetas sin reservar y reservada con nombres largos, [Reservar entrada], «Añádela» con la rueda, guardar, «Cambiar», «Cambiar el día», «Eliminar reserva», el Free Tour con sus cinco botones, la hoja de la regla 17 y 0 «Mejor hora este día». Sin ver: las tarjetas en el ordenador y la Galería en la rueda (sus turnos, comprobados en el servidor).
