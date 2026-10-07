# Informe de la Tanda 6f

Hecho y comprobado. Lo que he decidido yo está en `PREGUNTAS_TANDA6F.md` (22 puntos). Los datos de este informe (fotos, días que no caben, orden de los días, trayectos) están completos en `INFORME_TANDA6F_DATOS.md`.

## Lo que ha cambiado

1. **Fuera la tarjeta «Llegada a…»** y la de descanso («Un respiro antes de cenar»). Arriba de la parada va una línea de reserva («🕘 Entrada a las 9:00 · llega a las 8:30…») solo si hay reserva puesta o el Free Tour añadido. La cuenta atrás de HOY sale solo en esos casos y cuenta desde la hora de llegada.
2. **Sin recuadro de foto vacío:** si una parada no tiene foto propia usa la de su zona; si tampoco hay, la tarjeta va sin recuadro. Fotos nuevas puestas (8) y el campo `credito` en todas, vacío hasta que me pases autor y licencia.
3. **Sin «iluminada», «de noche» ni «ya con las luces»** en los nombres de parada. La etiqueta azul ahora dice «Experiencia nocturna».
4. **Noches:** por parejas a menos de 15 min andando (regla 13) y, en viajes de 2,5 días o más, nunca de un sitio visto ese día (11c). El D3 con Free Tour ya no lleva Trevi ni Puente y Castillo de noche.
5. **«De camino»:** tarjeta plegada, nunca repite una parada del día, nunca abre el día, su título dice «De camino a…» (también la comida y la cena) y lo ya visto otro día dice «Ya lo visitaste el día n». Villa Borghese es parada (45 min, foto del lago); Paseo por Trastevere, con su foto. Once sitios pasan de «de camino» a parada (4j).
6. **Trayectos:** andando si son 25 min o menos; si son más, transporte público solo si hay una línea real (con su nombre); si no, taxi. El taxi siempre está en las opciones. Se quita la estimación de bus y metro.
7. **D5 y DA-medio** con la Pirámide Cestia y el Cementerio Protestante; el viaje de 3,5 días lleva siempre el DA-medio.
8. **«+ Añadir parada»:** el mapa enseña las líneas de la ruta con las paradas numeradas y el hueco marcado (tramo grueso y un «+»).
9. **Free Tour fuera del formulario:** se añade (o se quita) desde RESERVAS y desde «+ Añadir parada», con hora de mañana, tarde o noche; los días que el viajero no ha tocado se rehacen.
10. **Lo que quedaba de la 6e:** listas de los Museos, la Galería y el Coliseo del documento nuevo, la variante tuya del D3 quitada, la comida hasta las 15:00 con reserva. `TABLA_RESERVAS.md` regenerada: «sin lista» solo en la Galería a las 13:00 (la Galería solo tiene turnos de verdad cada 2 horas).
11. **Dos arreglos de causa que destapó la prueba:** esperar a que abra un sitio ya no hace llegar tarde a una reserva (se ve por fuera con su aviso), y quitar un «de camino» rehace las horas de lo que viene detrás.

## Resultado de la prueba

- **271.925 viajes** (todas las duraciones, 365 fechas, Free Tour, medios días, pool, reservas, experiencias): **0 fallos**, con las comprobaciones nuevas (nombres, «de camino», noches, orden de los días).
- **Lo que sale del servidor** (324 días): 0 tarjetas «Llegada a…», 0 trayectos de «0 m», 0 nombres con las palabras prohibidas.
- **Sugerencias:** 182 casos, 452 sugerencias, 0 fallos. `tsc` limpio.

## Para ti (no he cambiado nada)

- **Días que ya no caben enteros con las paradas nuevas:** solo el D1-corto por la tarde: Ponte Sisto pasa a «Si te sobra tiempo».
- **Orden de los días:** el D1 y el D2 (o D3 y D1-FT) no caen en los dos primeros días completos en muchas fechas, siempre por un cierre o una mala fecha del documento (el Vaticano cerrado domingo y miércoles, la Galería el lunes, las Termas, el Castillo, Semana Santa…); los 0 casos sin motivo. La lista por motivo está en el informe de datos.
- **Fotos propias que faltan:** sin ninguna foto, ni de la zona: Basílica de San Juan de Letrán, Santa Maria Maggiore, Catacumbas de San Calixto, Via Appia Antica y Via di Ripetta. El resto de paradas sin foto propia usa la de su zona o su foto de siempre (lista completa en el informe de datos).
- **Trayectos:** en el viaje de ejemplo solo Puente Sant'Angelo → Isla Tiberina sale en transporte (Bus 23); ninguno queda en taxi por defecto.
- **Líneas de transporte:** la sección del documento no existe; sembré Metro A y B, Tranvía 8, Bus 40 y 23 con coordenadas aproximadas. De Trastevere al Coliseo no hay línea con la regla de 8 min (ver preguntas).
- **Museos a las 12:30 y a las 13:00:** la comida no cabe antes (hay que llegar 30 min antes) y sale después de los Museos, pasadas las 15:00; queda apuntado, no como fallo.
- **Pantalla:** no he podido probar a mano las pantallas nuevas (hoja del Free Tour, mapa con el hueco) en una ruta real de Roma; solo `tsc` y el servidor.

## Comprobaciones

`VIAJES_LISTAS.html` regenerado (36 viajes). api-server reiniciado y comprobado.
