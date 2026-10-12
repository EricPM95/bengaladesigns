# Informe de la parte de la comida, Tanda 6y8

## Qué pasaba
Con los Museos reservados de 12:00 a 13:00 la fila salía 132 min tarde: la lista ponía una comida normal antes (el motor no empieza la comida antes de las 12:30 y la cuenta de 60 min) y `comida_rapida_*` estaba en la configuración pero ningún código la leía. En general, cualquier reserva con hora podía salir tarde (la prueba nueva dio ~1.300 casos tarde en una sola fecha antes del cambio).

## La regla y dónde vive
Una sola regla, en `shared/routeEngine/listasTrip.js` (paso 5.7b, `mesasYReservas`), para todos los destinos. No lee nombres: usa la hora de la reserva y `duration_minutes` del sitio (para el Free Tour, el del tour).
- Comida: si al salir de la reserva ya son más de las 14:30, va antes; si sale a las 14:30 o antes, después. Cena: igual con las 21:00; nunca empieza después de las 22:30.
- Solo se mueve la mesa, y solo si está del lado contrario.
- La entrada nunca sale tarde: (1) la mesa de antes se cuenta corta (45 min comida desde las 10:30; 60 min cena desde las 18:00); (2) si no basta, lo de justo antes pasa detrás de la reserva, en su orden (o a «Si te sobra tiempo» si detrás no hay tiempo hasta la cena); (3) si es la primera hora fija, el día empieza antes; (4) si ni así, la mesa va después y queda apuntado en el registro del día.
- Hasta 5 min de retraso cuentan como a su hora (`tolerancia_hora_min`, antes `tolerancia_tour_min`, que estaba muerta). Entre la «Llegada a…» y su parada ya no hay trayecto.
- El turno real de la Galería sin reserva no cuenta (sigue igual), salvo que el viajero tenga otra reserva ese día: entonces no se cruza con ella.
- Configuración: la comida rápida se usa de verdad. Quitadas por muertas: `comida_antes_mediodia`, `comida_rapida_hasta`, `comida_despues_de_fija_desde`, `cena_antes_de_hora_fija`, `cena_antes_desde`. Nuevas: `comida_antes_si_sale_despues_de`, `cena_antes_si_sale_despues_de`, `cena_hasta`, `cena_rapida_*`, `entre_reservas_min`.
- Sin ninguna reserva el motor da exactamente lo mismo que antes (636 viajes comparados con el motor anterior: 0 diferencias).

## Duración de los sitios con reserva
Todos los sitios de Roma con reserva obligatoria o recomendada traen `duration_minutes`: ninguno falta. Coliseo 90, Museos 180, Galería 120. Si a un sitio de otro destino le falta, el motor usa los minutos de su parada.

## Documento, guía, datos
- `DIAS_ROMA_PARADAS.md`: regla 4 (nuevo punto), regla 6, regla 17 (dos puntos), «Museos reservados a mediodía», comida de la Galería, nota de la tabla del Coliseo y la Galería a las 12:00. `listasConvertir.mjs`: 0 dudas.
- `listasVariantes.mjs`: Coliseo 12:30–13:00 llega hasta las 13:00 (de 13:01 en adelante, la de mediodía); Galería de las 12:00 hasta las 12:30; las dos filas de Museos de 12:00–13:00 eran iguales y son una (11:46–13:15) con Castillo y Puente después.
- `GUIA_NUEVOS_DESTINOS.md`: regla general. `INVARIANTES_PANTALLA.md`: 619, 620, 621 y notas en 529.

## Pruebas
- Nueva `pruebaFase6y8_comida.mjs` (sin servidor; cada reserva a cada hora, de 30 en 30 min y de 5 en 5 de 11:30 a 15:30, en viajes de 1, 3, 5 y 7 días; Free Tour de mañana, tarde y noche; sitio inventado con 5 duraciones; casos de Eric). Parte 1 en 15 tipos de día (lunes a domingo, Pascua, 2 de junio, Ferragosto, agosto, Navidad, Nochevieja, Año Nuevo, Reyes): 0 fallos (~23.000 casos). Partes 2, 3 y 4 en 10 días: 0 fallos (tras arreglar la prueba del Free Tour de noche).
- Batería rápida (`bateriaParalela.mjs`, 14 a la vez): todas las que dan número, 0 fallos, salvo `pruebaFase6y7_motor` (9 fallos viejos que pedían Castillo y Puente por la mañana con Museos a las 12:00: ajustada, 0) y `pruebaTanda6u` (ver abajo).
- Las que no dan «fallos» (6i, 6l, 6o, 6j, 6r, 6g, 6h, 6k, 6y4_listas) salieron con exit 0; 6y5_motor y la muestra de ~60 fechas de `pruebaListas` NO las he podido terminar (se quedaron sin pasar).

## No terminado / preguntas
1. **`pruebaTanda6u`: 61 fallos `sobra_con_reserva`.** Con Free Tour + Museos el mismo día, algunas paradas (Puente, Conciliazione, Castillo, a veces la Plaza) pasan a «Si te sobra tiempo» por la nueva regla de la cena (≤22:30) o por no caber detrás de la reserva. Es lo que choca con «con reserva no se quita nada»: ¿lo aceptas o prefieres que se pasen a la hora de cenar sin quitar (cena más tarde)?
2. Con los Museos a las 12:00 la Basílica pasa a después de los Museos si ni con la comida corta cabe.
3. En el día de la Galería (5/7 días), una reserva extra el mismo día deja la comida después en ~10 % de los casos (se apunta en el registro).
4. Reservas que acaban después de las 22:15 no dejan cenar antes de las 22:30 (cuenta aparte en la prueba).
5. Sin pasar: `pruebaFase6y5_motor`, la muestra de 60 fechas con `pruebaListas`, tsc (no se tocó `src/`). No se lanzaron las 365 fechas.
