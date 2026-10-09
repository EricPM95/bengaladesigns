# Progreso de la Tanda 6r

0. **Documentos nuevos subidos** (`DIAS_ROMA_PARADAS.md` nuevo, los prompts 6r y 6s y el diseño `Reservas v4`). Convertido sin tocar el documento. Hecho.
1. **Lo de Via del Babuino:** encontrado y explicado (ver el informe). Era el motor, que llenaba el hueco antes de una hora fija con un sitio cercano que el documento no escribe ese día. Quitado; el mismo fallo salía también con el Coliseo a las 12:30 o a las 15:00 en el día corto de llegada (Mercados de Trajano). Hecho.
2. **La regla, para todos los destinos:** a `INVARIANTES_MOTOR.md` (477 y 478) y `INVARIANTES_PANTALLA.md` (479 y 480). Y la tarjeta ya nunca pinta un recuadro de foto vacío (una sola regla en `TrazoCard`). Hecho.
3. **«Free Tour por Roma»** en toda la app: datos, convertidor, scripts, la entrada de la ficha y los viajes ya guardados (se pasan al nombre nuevo al cargarse). El resto de «centro» que lee el viajero, apuntado en PREGUNTAS sin cambiar. Hecho.
4. **La prueba 6r** (`pruebaTanda6r.mjs`): recorre los viajes con cada reserva a cada hora y da fallo en los cuatro casos. Comprobado que con el motor de antes del arreglo da fallo. Hecho.

TERMINADO
