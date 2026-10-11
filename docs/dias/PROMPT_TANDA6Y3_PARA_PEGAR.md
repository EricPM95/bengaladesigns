Tanda 6y3: las respuestas a tus 14 preguntas de la 6y2 (decidido por Eric el 11-oct-2026). Va todo en este mensaje. Es corta. Si te llega cortado, está entero en docs\dias\PROMPT_TANDA6Y3_PARA_PEGAR.md.

Antes de empezar: he copiado en docs\dias BORRADOR_MULTIDESTINOS.md (al día) y este prompt, y en docs\diseno\multidestino\ el diseño «Varias Ciudades.dc.html» (con su support.js e image-slot.js). Mételos en un commit tal cual. NO se hacen: son para cuando Roma esté entera lista.

IMPORTANTE: como siempre, solo Roma; nada de varios destinos.

1. LAS RESPUESTAS
- Pregunta 1 (qué lista usa «Añadir parada»): las dos, en este orden: más «me gusta» de verdad, luego el nivel 1, luego `pool_lista` (sin repetir), luego el resto.
- Pregunta 2 (las fotos de la página de candidatas): las elige Eric más adelante, antes de dar Roma por acabada (está en PENDIENTES). No cambies nada; mientras, esas siguen sin salir.
- Pregunta 3 (Tívoli y Pompeya y Sorrento): sí, añádelas a las rechazadas y a la página de candidatas, con 3 candidatas cada una.
- Pregunta 4 (las 6 fotos equivocadas de `_fotos_wikimedia.json`): quítalas del fichero.
- Pregunta 5 (el recuadro neutro para los sitios sin foto): bien.
- Pregunta 6 (la barra de pasos): hasta elegir, que cuente los 7 del camino largo («5/7» en la pantalla de elegir). Con «Quiero hacerla yo» pasa a ser el último paso («5/5»).
- Preguntas 7, 8 y 9 (al cambiar las fechas a menos días): fuera la pregunta «¿Qué hago con ellas?» y fuera el selector. Al acortar el viaje, la app avisa con el «¿Estás seguro?» de siempre al eliminar, diciendo qué días se quitan («Se quitarán el jue 16 y el vie 17, con sus paradas»). Si dice que sí, esos días se quitan con todo lo que tienen, y punto. Si dice que no, las fechas no cambian.
- Pregunta 10 (quitar la reserva del Free Tour a mano): se quita también su parada del día, con el aviso de siempre y [Deshacer].
- Pregunta 11 (el aviso de la reserva fuera de su día en nuestra ruta): no hace falta; solo en la ruta a mano, como está.
- Pregunta 12 (Reorganizar con una reserva de tarde, sin mezclar lo libre de mañana y de tarde): bien así.
- Pregunta 13 (dónde va la comida al reorganizar): bien así.
- Pregunta 14 (los puntos de las zonas del alojamiento): revisados, están bien. Se quedan.

2. LO QUE DEJASTE PARA MIRAR
- «Pasarlo» y «Añadirlo» con sitios femeninos («la Galería Borghese»): usa una forma que valga para todos: [Pasar al mié 15] y [Añadir al mié 15].
- La parada del Free Tour añadida a mano: con la foto real de su punto de encuentro (Piazza Navona), no con la de relleno.
- `LandingScreen.tsx`, que ya no se monta y sigue lanzando las sugerencias: bórralo, y lo que solo usaba él. Dime en el informe qué has borrado.

3. PRUEBAS
- Las de siempre a 0 fallos (con la 6y y la 6y2).
- Una prueba 6y3: el orden de «Añadir parada» (me gusta, nivel 1, `pool_lista`, resto, sin repetir); la barra de pasos en los dos caminos; al acortar el viaje, un solo «¿Estás seguro?» que dice qué días se quitan, y con «no» nada cambia; la parada del Free Tour que se va con su reserva; 0 «Pasarlo» o «Añadirlo» en los textos.
- A mano, a 375 px: la pantalla de elegir con su «5/7», el «¿Estás seguro?» al acortar el viaje y la parada del Free Tour con su foto. Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y3 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
