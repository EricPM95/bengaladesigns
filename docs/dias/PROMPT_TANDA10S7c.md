Hola. TANDA 10S7c, rápida: sí, añade al motor «adaptar solo el primer día» (y lo mismo para el último). Solo las pruebas de lo tocado, `pruebaJutrip` y la muestra de 60 fechas (tocas el motor). Sin migraciones. La nota de estado (`_estado_10s7c.md`) a la rama `estado` cada 30 minutos. No apagues el PC.
Qué hace:

* Usa las mismas paradas de ese día, ninguna de otros días. Nada pasa a otro día y no se toca ningún otro día.
* El día empieza a la hora de llegada más el tiempo hasta el alojamiento o el centro. Ordena y vuelve a poner las horas de esas paradas para que quepan las máximas, respetando sus horarios de ese día. Lo que empezaba a las 10:00 y cabe a las 17:00, se queda a las 17:00.
* Lo que no cabe pasa a «Si te sobra tiempo» (nunca se pierde).
* En el último día, igual con la hora de irse al aeropuerto. El día de vuelta, como lo dejaste.

Si lo que no cabe es un imprescindible (el Coliseo, el Vaticano…), que no se quede escondido. En la franja «Hemos adaptado tus días a tus vuelos», debajo: «El Coliseo no cabe el jueves.» [Pasarlo a otro día]. Ese botón abre la hoja de mover parada de siempre. La parada va la primera del día que elija.
Nada cambia sin preguntar: todo esto va con la alerta y el Deshacer de la 10S7b. Deshacer lo deja todo como estaba.
El plan de llegada dice lo que de verdad ha pasado: nunca «la Roma antigua pasa al día 2» si no ha pasado.
La ruta normal no cambia: el modo nuevo solo se usa para adaptar a los vuelos. La muestra de 60 fechas tiene que salir idéntica a la de antes.
La prueba: `pruebaTanda10S7c` con estos casos:

* llegada a las 16:30 → el día 1 con sus mismas paradas que caben, a partir de las 17:00 y pico, sin tocar el día 2;
* el Coliseo con su aviso y [Pasarlo a otro día];
* Deshacer;
* salida a las 15:00 el último día (sin día de vuelta) → acaba con tiempo para el aeropuerto;
* el texto del plan de llegada.

Añade el informe en «10S7c» de `INFORME_TANDA10B.md`. La lista de comprobación tiene que ser la de ESTE prompt: las de la 10S5, la 10S6, la 10S7 y la 10S7b son la de la 10S4 por error. Las rehaces en la tanda siguiente, pero esta ya tiene que salir bien. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Al final, reinicia el api-server.
Cuando acabe, le pegas la 10S8 actualizada.
