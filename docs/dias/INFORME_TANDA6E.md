# Informe de la Tanda 6e

Hecho y comprobado. Lo que he decidido yo está en `PREGUNTAS_TANDA6E.md` (23 puntos). La tabla de todas las reservas posibles (sitio × día × hora) está en `TABLA_RESERVAS.md`.

## Lo que ha cambiado

1. **Las listas nuevas del documento**, pasado otra vez por el convertidor sin tocarlo (0 dudas):
   - **Coliseo en el D1:** 5 tramos (10:30–11:00, 11:30–12:00, mediodía, tarde y el Foro después del Coliseo, con la misma entrada; en invierno, el Foro desde la terraza antes).
   - **Coliseo en el D0:** 3 tramos (por la mañana, 12:30–14:00 y 14:30–15:30).
   - **Museos en el D2:** media mañana (la Basílica y la Plaza antes de los Museos; el día empieza a las 8:00) y tarde.
   - **Free Tour y Museos de 13:30 a 14:30 en el D3.** Esta lista no está en el documento, solo en tu tanda: la he escrito con tus palabras y lo cuento en las preguntas.
   - **Galería Borghese en el D4:** a las 9:00, a las 15:00 y a las 17:00, y el día normal a las 11:00.
   - **La comida en Prati** vuelve a ser Il Sorpasso o Dal Toscano; Osteria dell'Angelo, solo a la cena.
2. **Una regla nueva:** una reserva nunca pasa un imprescindible por dentro (la Basílica, el Foro, el Panteón…) a «de camino» ni a «por fuera» la primera vez. Primero se mueve antes o después de la reserva, luego se acorta otra cosa y solo al final se quita lo de menos. El Altar de la Patria sigue acortándose, porque tus listas lo ponen «por fuera si va justo».
3. **Las reservas, solo lo escrito:** al meter una reserva grande, la hoja enseña «Para este día, mejor a las 9:00, 10:30…», avisa si la hora no tiene lista o la combinación no cabe (el Free Tour de mañana y los Museos antes de las 13:30; la excursión de medio día y el Coliseo a las 16:00: «¿Pasamos el Coliseo al día de la Roma antigua?») y deja elegir otra hora, otro día o «La quiero a esa hora». Si insiste, se aplica la regla 4 y queda apuntado en el registro y en la prueba como «sin lista». Quitado el aviso de la 6c de «Free Tour + Museos a las 14:00».
4. **La Fontana de Trevi cuesta 2 €:** el dato en `roma.json` y los avisos («Gratis y sin gente: antes de las 9:00 no se paga»; «Hasta las 22:00, acercarte a la fuente cuesta 2 € (solo con tarjeta)…»), de día y de noche.
5. **HOY:** el hueco antes de una parada que no abre hasta una hora escrita («Tienes 97 min antes de Plaza de San Pedro», con el Borgo Pio y los Coronari). Los miércoles del D2 sin Museos.

## Resultado de la prueba

- **271.925 viajes** (todas las duraciones, 365 fechas, Free Tour, medios días, pool, reservas, lluvia, y las horas nuevas: Coliseo 10:30, 13:00 y 15:00; Museos 10:00 y 13:30; Galería 9:00, 13:00, 15:00 y 17:00): **0 fallos**.
- **La regla nueva:** 0 casos de un imprescindible que pase de «por dentro» a «de camino» o «por fuera» por una reserva con lista. La prueba solo mira los días con hora fija y no cuenta los cierres ni lo ya visto por dentro otro día.
- **Prueba de las sugerencias:** 518 momentos, 1.480 sugerencias, 0 fallos.

## Lo que queda (apuntado, no son fallos)

- **Reservas sin lista escrita:** salen como «sin lista» en la tabla: la Galería entre las 11:31 y las 14:00; los Museos en el D2 de 12:01 a 14:59; el Coliseo en el D0 desde las 15:31 y en el D1-corto y el D1-FT a cualquier hora; los Museos con Free Tour antes de las 13:30 (esta combinación llega muy tarde, de 163 a 343 min, y la hoja avisa antes).
- **Listas escritas que, con nuestros tiempos de andar, no caben del todo** (las he dejado como están): D0 con el Coliseo de 12:30 a 15:30 (la comida cae tarde y se rellenan huecos); D1 a las 11:30 y a las 12:30 (comida tarde; a las 12:30 el Foro pasa después del Coliseo); D4 con la Galería a las 9:00 (Trevi «sin gente» y el desayuno salen después de la Galería); D3 con los Museos a las 13:30 (comida de 30 min y 1–3 min de retraso).
- **Coordenadas aproximadas:** Via di Ripetta y el Lungotevere (sitios nuevos) y el Foro por lados.

## Comprobaciones

`tsc` sin errores; servidor reiniciado; `/api/reservation-advice`, `/api/check-time`, `/api/rebuild-day` y `/api/adjust-day` responden bien. `VIAJES_LISTAS.html` regenerado con los viajes por hora de reserva, y además el Coliseo a las 10:30, el D0 con el Coliseo a las 13:00 y a las 15:00, los Museos a las 10:00 y la Galería a las 9:00 y a las 15:00. No he probado la pantalla a mano en el móvil.
