# Llegada y vuelta: los aeropuertos salen de Reservas

Decisión:
- La vuelta es en el mismo medio que la llegada. No se añade ninguna fila ni pregunta para elegir otro medio.
- Los datos reales de cada trayecto (aeropuerto o estación y hora) salen de lo que el viajero pone en **Reservas**. Allí se añaden los vuelos pegando el email de confirmación o subiendo la captura o el PDF, y la IA saca los datos.

Comprueba, y arregla si hace falta:

1. **Cada trayecto con lo suyo:** al guardar en Reservas un vuelo de ida y otro de vuelta, la barra de la llegada usa el aeropuerto y la hora del de ida, y la de la vuelta los del de vuelta, aunque los aeropuertos sean distintos (por ejemplo, llegar a Fiumicino y volver desde Ciampino).
2. **Todo al día:** con esos datos se actualizan el Resumen, los Traslados, los Tips y «Tu última tarde» de cada ventana, y el último día se recoloca con la hora de salida, como ya pasa hoy.
3. **«+ AÑADIR VUELO» de la barra:** lleva a Reservas para añadir ese vuelo; no a otro formulario distinto. Lo mismo con tren, autobús y ferry.
4. **Sin reserva:** la barra sale como hoy (por ejemplo, «AVIÓN DESDE BARCELONA», con el aeropuerto principal del destino).
5. **Si se borra o se cambia una reserva,** las barras y las ventanas vuelven a cambiar solas.
6. **Tren:** lo mismo con la estación (por ejemplo, llegar a Termini y salir de Tiburtina).

7. **Los textos, según el sitio de llegada y de salida.** Cada aeropuerto, estación, terminal de autobús o puerto tiene sus propios textos en las tres pestañas (Resumen, Traslados, Tips) y en «Tu última tarde». Llegar a Ciampino no es como llegar a Fiumicino: cambian el transporte al centro, el tiempo y lo que conviene saber.
   - **Qué hay hoy:** dime, para Roma, qué sitios de llegada y salida tienen ya sus textos en `_llegada.json` y cuáles no. Como mínimo: Fiumicino, Ciampino, Termini, Tiburtina, la terminal de autobuses de Tiburtina y el puerto de Civitavecchia (ferry).
   - **Lo que falte:** escribe un borrador con sus textos, en «tú» y con el tono de los que ya hay. Cada precio, horario y tiempo de trayecto, comprobado en la web oficial (la del aeropuerto, Trenitalia, ATAC, la naviera…), con su fuente y su fecha de «comprobado». En esta ventana sí van precios.
   - **Qué sitios salen:** solo los que existen de verdad desde el origen del viajero, con la misma lógica de las barras de hoy (la vía que no existe para ese trayecto no carga su barra). Por ejemplo, desde Barcelona: avión a Fiumicino o Ciampino, y ferry a Civitavecchia.
   - **La vuelta:** «Tu última tarde» y la hora límite cambian según el sitio de salida (a Ciampino se tarda distinto que a Fiumicino). Comprueba que se usan los tiempos de ese sitio y no los del principal.
   - **Para todos los destinos (a INVARIANTES y a METODO_DESTINOS):** al curar un destino, cada sitio de llegada y salida lleva sus propios textos, comprobados en la web oficial.
   - No subas los textos nuevos: déjalos en un borrador para revisarlos antes.

Commit y sin push. **Informe corto** con capturas de un viaje con reserva de ida a Fiumicino y de vuelta desde Ciampino: las dos barras y las dos ventanas. Y la lista del punto 7: qué sitios tenían textos, cuáles faltaban y el borrador de los nuevos.
