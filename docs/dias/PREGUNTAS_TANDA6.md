# Preguntas de la Tanda 6

Lo que he decidido yo mientras hacía el motor de listas, y lo que el documento `DIAS_ROMA_PARADAS.md` no dice del todo. Todo se cambia con un dato, no con código: lo que es de datos está en `data/dias/roma/_destino.json › franjas` y en `scripts/destino/listasVariantes.mjs` (cada variante cita la frase del documento de la que sale).

## A. Horas y límites (provisional)

El documento no escribe horas. Para sumar minutos contra algo, el motor usa estos números (de `_destino.json › franjas`):

1. **El día empieza a las 9:00.** El D0 a las 9:30 (como en la Tanda 5). El D3, el D4 y la mañana del Tridente (DT-medio) a las 8:00, porque su primera parada es «Fontana de Trevi sin gente». La tarde de un medio día (la de llegada) empieza a las 16:00, y la tarde de una excursión de medio día, también.
2. **La comida:** la hora orientativa no baja de las 12:30 (los restaurantes abren) y, como dice el documento, no debería empezar después de las 14:30. Dura 60 min.
3. **La cena:** no antes de las 19:30 (20:30 de mayo a septiembre) y dura 90 min. La tarde cabe hasta una hora después de la cena más temprana.
4. **«Llegada a…»:** 30 min antes de una reserva, 15 antes de un turno y del Free Tour.
5. **Taxi, bus y metro:** el documento no da minutos. Los calcula el motor por la distancia: taxi, distancia/350 m + 6 min (mínimo 8); bus y metro, distancia/250 m + 8 (mínimo 12). Un tramo de más de 25 min andando sale en taxi aunque el documento no diga nada.
6. **Una parada corta pegada al sitio** antes de una hora fija: el hueco tiene que ser de 20 min o más, el sitio a 450 m o menos y exterior. Si el hueco es mayor, lo que queda después de esa parada es el día que empieza más tarde (o antes, si la reserva es antes de que empiece el día).

## B. Cosas que el documento no dice y he elegido

7. **D0 con el Coliseo reservado por la mañana («el día va al revés»):** el documento nombra «Coliseo y Arco; Fori Imperiali; Piazza Venezia y el Altar» y no el Foro ni el Campidoglio, que son imprescindibles. Los he dejado entre los Fori y Piazza Venezia (en el mismo orden inverso). Si no los quieres, es una línea.
8. **D2 sin Museos («la Basílica y las Grutas»):** el documento no da minutos. 90 min, con el título «Basílica de San Pedro y las Grutas Vaticanas». **D2 en miércoles:** la Plaza y la Basílica van «desde las 12:30» y no pone Museos esa mañana (lo entiendo así por «si no se puede, sin Museos»); el día empieza más tarde, hasta que acaba la audiencia.
9. **D6 en miércoles («la mañana va al revés»):** el documento nombra Castillo, Plaza de San Pedro, Cúpula y comida en el Borgo. Lo que el documento deja sin decir (Navona, el Panteón, el Puente, los Coronari) lo he puesto antes del Castillo en el orden inverso de la lista normal. La Plaza de San Pedro y la Cúpula van «desde las 12:30».
10. **D4 en lunes sin Galería:** «el día empieza más tarde»: lo pongo a las 9:30 (la Cripta de los Capuchinos abre a las 9:00).
11. **D1-FT con la Galería o el Ojo en el pool:** «en lugar de la Isla Tiberina y Trastevere». He puesto el Ojo en lugar de la Isla Tiberina y la Galería en lugar de Santa Maria in Trastevere (con taxi y cena en el Tridente). Si querías otra cosa (todo el rato de Trastevere), dímelo.
12. **«El Janículo y la Isla Tiberina salen» (lluvia del D2 y del D1-FT):** he entendido «el Janículo» como las tres paradas de la colina (San Pietro in Montorio y el Tempietto, la Fontana dell'Acqua Paola y el Mirador). Si no, el plan de lluvia volvería sobre sus pasos.
13. **Domus Aurea en el D5:** «solo con reserva y de viernes a domingo»: va solo en esos días y con la tarjeta de reserva, sin hora (la pone el viajero). Si la marca en el pool y el viaje no tiene un día de viernes a domingo con D5, sale en «No incluido».
14. **Santa Maria in Aracoeli (D6):** en `roma.json` solo existe «Santo Bambino de Aracoeli», que es de Navidad. Para la parada de todo el año uso ese lugar sin mirar la temporada (marca `ignora_temporada` en `listasNombres.json`) con el título del documento. Lo ideal es un lugar «Santa Maria in Aracoeli» aparte en los datos.
15. **Pool sin sitio escrito:** lo que el viajero marca en el pool y el documento no coloca en ningún día del viaje (por ejemplo el Trastevere o la Basílica de San Pedro en un viaje sin su día) sale en «No incluido»: «No cabía en este viaje». Lista exacta, en el informe.
16. **Free Tour de tarde o de noche en el D1:** quita lo que el tour recorre (Panteón, Navona…) con «Lo ves en el Free Tour». El documento lo dice para «el centro»; uso la lista `covers` del tour.

## C. Reglas que he interpretado

17. **«Lo que cabe antes va antes y lo demás después»** (hora fija): pruebo con todo lo que cabe y, si colocarlo rompe una comprobación de siempre (por ejemplo un zigzag), lo que lo rompe y no es imprescindible la primera vez pasa a «Si te sobra tiempo». Si hay varias formas, gana la que menos deja fuera; cada parada que sale vale como 45 min de día que empieza más tarde.
18. **Zigzag:** solo cuenta volver para ver algo «que se podía ver al pasar»: de camino, por fuera o de 20 min o menos. Una visita con hora (una reserva, un turno) o larga no cuenta: se vuelve a ella a propósito.
19. **Pirámide:** pool y lo que añade una experiencia valen más que el nivel 2 (los puso el viajero) y menos que un imprescindible. Un imprescindible solo se quita si ya salió antes en el viaje.
20. **Nocturnas imprescindibles en los primeros días:** como en la Tanda 4, aunque el día escriba otra (el D3 acaba en Prati y cena allí; la nocturna es Trevi, con su taxi). Si prefieres que el D3 se quede con el Puente y el Castillo, dímelo.
21. **Comida después de las 14:30:** primero se acorta lo de menos de la mañana (por dentro → por fuera → de camino) y luego pasa a «Si te sobra tiempo». Si delante solo hay imprescindibles (o paradas con hora fija), no se puede quitar nada y la comida sale tarde: queda apuntado en el registro y en la prueba (no es un fallo).
22. **Voy con retraso:** pasa a «Si te sobra tiempo» **una** parada por pulsación (la de menos importancia de la franja en la que estás). **Estoy cansado:** pasan todas las de nivel 3 de lo que queda.

## D. Lo que no he hecho (según el documento de la tanda)

23. Las **llegadas y salidas** (la hora en el formulario, la tarde de llegada y la mañana de salida): no se tocan. El medio día de llegada empieza a las 16:00 (provisional, punto 1).
24. «Cerca de ti», compartir el viaje y el diario.
25. **Hojas de la pantalla probadas solo con el compilador** (`tsc` limpio): no he recorrido a mano HOY, la lluvia ni «Si te sobra tiempo» en el móvil.
