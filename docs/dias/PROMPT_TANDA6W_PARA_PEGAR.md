Tanda 6w: lo que quedó abierto de la 6t, la 6v y la 6u. Va todo en este mensaje.

Antes de empezar: he copiado un DIAS_ROMA_PARADAS.md nuevo en docs\dias. Pásalo por el convertidor y no lo toques. Cambia dos cosas: el aviso «vas justo» (regla 17) y qué pasa con el Free Tour y los Museos reservados en días distintos (en el D3).

0. LAS RESERVAS MANDAN Y EL DÍA LO LLEVA TODO (regla 17 nueva, para todos los destinos)
Con una reserva, el día lleva todo lo que tiene escrito. La app solo lo ordena para que tenga sentido (qué va antes y qué después, por dónde se empieza: las dos partes de mañana y tarde, el Foro antes o después del Coliseo, la Basílica antes o después de los Museos).
- Nunca quita nada, nunca lo pasa a «Si te sobra tiempo» y nunca acorta la comida porque no dé tiempo. Hay quien sale a las 6:00 y vuelve a las 22:00; el viajero quita o añade lo que quiera.
- Quita lo que haga lo contrario en los días con reserva: acortar la comida (los 45 o 30 min de la 6u), mandar paradas a «Si te sobra tiempo» por una reserva, la regla 5 con reservas. La regla 5 se queda solo para los cierres.
- El documento ya está así: el Castillo y el Puente vuelven al D3 con el Free Tour de tarde, y se quitan los «a Si te sobra tiempo» de los días con reserva.
- Dime en el informe cuántos viajes tenían algo en «Si te sobra tiempo» por una reserva y ahora lo llevan en el día.

1. AVISO «VAS JUSTO» (regla 17)
- Si dos reservas no se pisan pero se va justo (da tiempo a llegar, pero sin los 30 min de margen o sin tiempo de comer), sale un aviso:
  «Es posible que no llegues a los Museos: el Free Tour dura 2 h 30 y vas justo.»
  Con los nombres de las dos reservas y la duración de la primera.
- Solo avisa: las dos reservas mandan y el día se queda como está, con todo (punto 0; respuesta a tu pregunta 1 de la 6u).
- Igual que el de «coinciden»: la hoja de abajo al guardar y la campana mientras siga así.

2. FREE TOUR Y MUSEOS EN DÍAS DISTINTOS (tu pregunta 3 de la 6u)
Como lo dice ahora el documento, en el D3:
- el día de los Museos lleva el D3 sin el Free Tour, con lo del guía por libre;
- el día del Free Tour lleva el D1-FT, con el Free Tour como «otra parte» (por la mañana o por la tarde, según su hora) y la Roma antigua en la otra mitad;
- el Gueto y Trastevere se quedan, al final de la tarde (punto 0).
Que el Free Tour no desaparezca nunca de un viaje en el que está reservado: a la prueba.

3. TUS OTRAS PREGUNTAS
- 6u, 2 (Free Tour a las 10:00 y Museos a las 14:00): la comida no se acorta (punto 0); la variante va con la comida entera y, si no da tiempo, sale el aviso «vas justo».
- 6u, 4 y 5: cambia. «Coinciden» solo cuando las horas de las dos reservas se cruzan de verdad (por ejemplo, el Free Tour de 10:00 a 12:30 y los Museos a las 11:45). Si no se cruzan pero no da tiempo a llegar de una a otra, es el aviso «vas justo» (punto 1), no «coinciden». A nosotros nos da igual si da tiempo o no: solo ordenamos la ruta y avisamos.
- 6u, 7: el orden del documento manda, pero el Foro y el Palatino nunca van «por fuera» por la hora. Si al salir del Coliseo el Foro ya no deja entrar, va antes del Coliseo, por dentro (regla del D1, «después si queda 1 h 30 hasta su última entrada; si no, antes»). Revisa los días con el Coliseo por la tarde, en invierno y en verano, y añádelo a la prueba.
- 6v, 1: quita del servidor lo que queda del «consejo» de la regla 17 (`consejoDeReserva`, `/api/reservation-advice` y lo que lo use en `/api/reservation-plan`). Cambia las pruebas que lo usen para que no dependan de él.
- 6v, 2 a 8: bien como lo decidiste.
- 6t, 2 a 6: bien.

4. TRASLADOS: ESCONDER LA PESTAÑA (tu pregunta 1 de la 6t)
- Las búsquedas no sirven: dan autobuses, salas VIP y cosas de otros sitios.
- Quita el campo `traslado` de Fiumicino, Ciampino y Civitavecchia en `_llegada.json`: la pestaña no sale hasta que el usuario pase los enlaces directos.
- Que la pestaña siga saliendo sola en cuanto un punto tenga `traslado: { url }`.

5. CAPTURAS QUE FALTABAN (tu pregunta 8 de la 6u)
- Crea tú un viaje nuevo de prueba, limpio, sin días tocados a mano.
- Haz a 375 px las capturas del D3 con el Free Tour a las 12:00, a las 15:00 y a las 17:00, y del D1 con el Free Tour de las 21:00.
- Añade también una del aviso «vas justo».

6. PRUEBAS
- Las de siempre a 0 fallos (con la 6r, 6s, 6t, 6v y 6u).
- La 6u, puesta al día: «vas justo», los días distintos y el Foro nunca por fuera.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6w en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
