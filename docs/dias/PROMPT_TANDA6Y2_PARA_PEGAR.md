Tanda 6y2: las respuestas a tus preguntas de la 6y y de la 6z6f (decidido por Eric el 11-oct-2026). Va todo en este mensaje. Si te llega cortado, está entero en docs\dias\PROMPT_TANDA6Y2_PARA_PEGAR.md.

Antes de empezar: he copiado en docs\dias PENDIENTES_6K.md, BORRADOR_MULTIDESTINOS.md y este prompt, y en docs\diseno\multidestino\ una imagen (formulario_varias_ciudades.png). Mételos en un commit tal cual. El borrador de multidestinos NO se hace: es para cuando Roma esté entera lista.

IMPORTANTE: como siempre, solo Roma; nada de varios destinos.

1. «REORGANIZAR»: QUE NO HAGA ZIGZAG (preguntas 11, 12, 13 y 15 de la 6y)
- La cercanía pesa más que «mañana antes que tarde». Zigzag es justo lo que no queremos. El orden de prioridad queda así:
  1. lo reservado (como ahora: primero en su parte, por la hora entre reservas);
  2. los momentos fuertes: lo de primera hora sin gente al principio, el paseo de Trastevere al final de la tarde, las nocturnas de noche;
  3. dentro de cada grupo, el orden de nuestro día escrito;
  4. los grupos que van juntos en un día escrito, en ese orden;
  5. entre grupos, la cercanía, sin volver atrás;
  6. «mañana o tarde» del documento, solo para desempatar.
- La prueba de nuestros días escritos (D0 a D7 desordenados) tiene que seguir dando el orden escrito.
- Repite la prueba de los 200 días mezclados y dime cuántos zigzag quedan y por qué. Pon otra vez 5 ejemplos en palabras sencillas.
- Pregunta 12 (lo reservado no se compara con la hora de las paradas sin reserva): bien así.
- Pregunta 13 (Trastevere como el D7 si hay 3 o más paradas de su grupo; si no, al final): bien así.
- Pregunta 15 (el D3 con Free Tour no se usa si no lleva el Free Tour): bien así.

2. LA ZONA DEL ALOJAMIENTO (pregunta 14)
- Añade a los datos un punto (el centro de la zona) para cada zona de `zonas_alojamiento` que no lo tenga: centro, Prati, Monti, Termini y las que falten. Puedes sacarlo del mapa. Dime en el informe qué punto has puesto a cada una.

3. LA RUTA A MANO
- Pregunta 1 (el primer y el último día salen como «Madrid → Roma · Día de viaje», con la fecha en su cuadrito): bien así.
- Lo que sí hay que cambiar (lo he visto en tu captura): un día a mano sin nombre enseña la fecha dos veces (el cuadrito «MIÉ 14» y el título «mié 14 oct»). Que el título diga «Ponle nombre», en gris y en cursiva, y que al tocarlo se abra DayNameSheet. El cuadrito con la fecha se queda.
- Pregunta 2 (cambian las fechas a otra duración):
  - más días: se añaden días vacíos antes del día de la vuelta;
  - menos días: se quitan primero los días vacíos (los últimos antes de la vuelta);
  - si hay que quitar un día con paradas, se pregunta: «El jue 16 tiene 3 paradas. ¿Qué hago con ellas?» [Pasarlas a otro día] [Quitarlas] [Cancelar]. Nunca se borra nada sin preguntar.
- Pregunta 3 (el aviso «Creando tu itinerario…» de 0,7 s): bien.
- Pregunta 4 (la clasificación y las sugerencias de experiencias se lanzan antes de elegir camino): lánzalas solo con «¡Sí, hazla por mí!». Si eso hace notablemente más lenta nuestra ruta, déjalo como está y dímelo con los tiempos.
- Pregunta 5 (el mapa dibujado de la pantalla de elegir): bien que sea decorativo, pero en tu captura el pin 3 sale casi transparente y la línea del día 2 cortada. Que el dibujo se vea entero cuando acaba su animación.
- La barra de pasos de arriba: en «Quiero hacerla yo» hay menos pasos (sin experiencias ni pool). Que cuente solo los suyos.
- Pregunta 6 (el Free Tour en la ruta a mano): se añade como cualquier reserva, desde RESERVAS («Entradas y Free Tour») y desde EXPLORAR, con su hora, y va al día de su fecha como una parada más. Sin precio, como siempre.
- Pregunta 7 («Hoy es un día completo» cuenta comida y cena que el día a mano no tiene): en la ruta a mano, que cuente solo lo que el día tiene de verdad.
- Pregunta 8 (una reserva cuyo sitio no está en el día de su fecha): avisa, sin mover nada solo:
  - si el sitio está en otro día: «Tu entrada al Coliseo es el mié 15, pero en tu ruta el Coliseo está el mar 14.» [Pasarlo al mié 15];
  - si no está en ningún día: «Tu entrada al Coliseo es el mié 15 y el Coliseo no está en tu ruta.» [Añadirlo al mié 15];
  - en la campana y en la tarjeta de la reserva en RESERVAS.
- Pregunta 9 (la lista de «Añadir parada» trae restaurantes que no se pueden marcar): quítalos de esa lista. Los restaurantes siguen en EXPLORAR, como siempre.
- Pregunta 10 (qué es «imprescindible»): si `pool_lista` es la misma lista que marca los imprescindibles en EXPLORAR, sí. Si no es la misma, dímelo.

4. LAS FOTOS (preguntas de la 6z6f)
- Pregunta 1 (las fotos equivocadas de Wikipedia: la Cripta de los Capuchinos, Trastevere al atardecer, Via dei Coronari y Borgo Pio con la misma foto, y las 4 excursiones):
  - mientras no se cambien, que esas no salgan: mejor sin foto que con una foto equivocada (como los sitios que ya van sin foto);
  - haz una página como FOTOS_ROMA_CANDIDATAS.html con cada una y 3 fotos de Unsplash para elegir. Eric elige o pone una suya.
- Pregunta 2 (el crédito en las fotos que se enseñan sin ficha): en las fotos grandes (la cabecera de las excursiones), el crédito en pequeño sobre una esquina de la foto. En las pequeñas (tarjetas del explorador, selector, «Añadir al día»), sin línea: el crédito ya está en la ficha y en «Créditos».
- Pregunta 3 (AttractionsFinder dentro del panel): déjalo hasta que haya otros destinos.

5. LO QUE NO PUDISTE VER EN PANTALLA
- Si el navegador de pruebas ya va bien, haz las capturas que faltaron a 375 px: «Reorganizar» con su «Deshacer», una excursión añadida a un día con precio y la pastilla a la cartera, y marcar varias paradas en EXPLORAR.

6. PRUEBAS
- Las de siempre a 0 fallos (con la 6z6 a la 6z6f y la 6y).
- La de «Reorganizar», al día con el orden nuevo (punto 1).
- Una prueba 6y2:
  - un día a mano sin nombre dice «Ponle nombre» y no repite la fecha;
  - al alargar o acortar el viaje a mano, nunca se borra un día con paradas sin preguntar;
  - con «Quiero hacerla yo», no se lanza nada de experiencias;
  - el aviso de la reserva fuera de su día, con su botón, y sin mover nada solo;
  - 0 restaurantes en la lista de «Añadir parada»;
  - las fotos equivocadas no salen;
  - cada zona del alojamiento tiene su punto.
- A mano, a 375 px: lo del punto 5, un día a mano sin nombre, el aviso de la reserva fuera de su día y la cabecera de una excursión con su crédito. Capturas en el informe. Borra al acabar los viajes de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y2 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
