Tanda 6y7 (después de la 6y6). Arreglos que Eric ha visto en su móvil, las historias nuevas, los títulos de los días y las respuestas a PREGUNTAS_TANDA6Y6.md. Va todo en este archivo.

OJO: los puntos 1 a 9 no tocan el motor (pantallas, textos y fichas). Solo el punto 10 toca el motor.

Antes de nada: Claude ha copiado en docs\dias estos documentos: HISTORIAS_ROMA.md (versión 4), PENDIENTES_ESCUCHAR.md y este prompt. Súbelos en el primer commit, sin tocarlos.

1. EL CALENDARIO, ARRIBA
- Cuando se eligen o se cambian las fechas dentro de la app (la pantalla «¿Cuándo estás en Roma?»), el calendario va justo debajo del título, arriba. Hoy queda abajo del todo, con un hueco vacío en medio. «Quitar fechas» va debajo del calendario.
- Igual en todos los sitios desde los que se abre el calendario a pantalla completa.

2. FUERA LA PANTALLA VIEJA «CREANDO TU RUTA»
- Al cambiar las fechas o rehacer la ruta sale la pantalla antigua «Creando tu ruta» (la del avión, «Ajustando según tu vehículo y compañía», «Organizando el mejor viaje de tu vida»…). Fuera.
- El cambio se hace en la misma pantalla en la que estaba el viajero. Si tarda, una barrita fina arriba o un «Actualizando tu ruta…» pequeño, sin tapar nada.
- Mira si esa pantalla sale en algún otro sitio y quítala también. Di en el informe dónde salía.

3. LA FICHA: EL HUECO DEBAJO DEL TIRADOR
- Entre el tirador del panel y el título de la ficha se ve el mapa, como un hueco. El fondo del panel tiene que llegar hasta el borde de arriba, con el tirador dentro. Míralo con el panel a media altura y entero.

4. «ESCUCHAR HISTORIA», SIN «VOZ DEL MÓVIL»
- Quita el texto «Voz del móvil» de la barra. Solo «Escuchar historia», el botón y la barra de lo que lleva. (Más adelante la voz será otra.)

5. EL MAPA DEL PERFIL SE VE ROTO
- En el Perfil, el mapa sale como una franja arriba y el resto gris. Tiene que llenar siempre su recuadro: al abrir el Perfil, al volver a él y al girar el móvil. Lo más probable es que el mapa se cree antes de que el recuadro tenga su tamaño: que se ajuste al abrirse.

6. LOS TÍTULOS DE LOS DÍAS (Eric)
- Hoy el día de llegada pone en grande «Barcelona → Roma». Ahora cada día, también el de llegada y el de vuelta, tiene su propio título según lo que se ve ese día. El «Barcelona → Roma» (o «Roma → Barcelona» en la vuelta) va pequeño, junto a la marca «Día de viaje», delante o detrás, donde quede mejor.
- Los nombres que se usan son estos, y solo estos: «Centro histórico», «Roma antigua», «Trastevere», «Plaza de España», «Vaticano», «Villa Borghese», «Popolo», «Basílicas y el Aventino», «Excursión desde Roma», «Roma desde las alturas» y «Free Tour».
- Cada parada de nuestros datos va en uno de esos grupos (por ejemplo: Trevi, Panteón y Navona en «Centro histórico»; Coliseo, Foro y Circo Máximo en «Roma antigua»; Via Condotti en «Plaza de España»; Santa María la Mayor, Santa Sabina y el Ojo de la cerradura en «Basílicas y el Aventino»; el Janículo y el Pincio en «Roma desde las alturas»). Pon en el informe la lista de qué parada va en qué grupo, para que Eric la revise.
- El título del día junta como mucho dos nombres, con «y»: si el día tiene Free Tour, va primero; luego, el grupo con más paradas del día. Ejemplos: «Free Tour y Centro histórico», «Vaticano y Trastevere», o solo «Centro histórico». Una parada suelta de otro grupo no cambia el título.
- El día de excursión: «Excursión desde Roma».
- En la ruta a mano, el mismo título según las paradas que ponga el viajero; un día vacío, «Día libre».
- El título sale igual en DÍAS, en HOY y en cualquier sitio donde hoy salga el nombre del día. Con y sin fechas, en la gratis y en la de pago. Sin horas calculadas.
- El título se calcula a partir de las paradas que ya tiene el día, al enseñarlo: no cambia qué paradas van en cada día.

7. LAS HISTORIAS, VERSIÓN 4
- Cambia en las fichas las 31 historias por las de docs\dias\HISTORIAS_ROMA.md (versión 4: más largas, contadas como un cuento). Como en la 6y5: solo el texto de cada historia, sin el título, sin las líneas «Comprobar» y sin las notas del final.
- Regla nueva (Eric): la historia puede contar lo importante aunque salga en la ficha, pero no copia sus frases. Cambia la prueba de la 6y5 (fallaba con 8 palabras seguidas iguales) por: ninguna historia comparte 15 palabras seguidas con su ficha.
- En GUIA_NUEVOS_DESTINOS.md, cambia «La historia nunca repite lo que dice la ficha» por: «Cada sitio importante lleva su historia, de unos 3 minutos, contada como un cuento. Puede contar lo importante aunque salga en la ficha, pero no copia sus frases.»

8. LOS SUPERLATIVOS DE LAS FICHAS
- La ficha de Trevi dice «La fuente más famosa del mundo»: cámbialo por «Una de las fuentes más famosas del mundo».
- Busca en todas las fichas de Roma frases así («el más… del mundo», «la mayor… del mundo», «la más famosa») y suavízalas igual, salvo que el dato sea seguro (como «la mayor cúpula de hormigón sin armar del mundo»). Pon la lista de cambios en el informe.

9. LOS DATOS DUDOSOS DE LAS FICHAS
- Al final de HISTORIAS_ROMA.md, en «Datos de las fichas que parecen equivocados», hay una lista. Corrige en las fichas solo los que puedas confirmar con una fuente fiable (di cuál en el informe). Los que no puedas confirmar, no los toques: apúntalos en PREGUNTAS.

10. RESPUESTAS A PREGUNTAS_TANDA6Y6.md (esto sí toca el motor)
- El Vaticano en miércoles:
  - Siempre que se pueda, el día del Vaticano entero se cambia con otro día del viaje, como antes. La preferencia «el Vaticano no en domingo ni en miércoles» se queda, en el documento y en el motor.
  - Solo si no se puede (no hay otro día que encaje, el cambio haría que cerraran otras cosas o se liaría el viaje, o los Museos están reservados ese miércoles), se usa el día del miércoles que escribiste en la 6y6.
  - En ese día del miércoles, la Plaza y la Basílica de San Pedro nunca van antes de comer, también con los Museos reservados por la mañana: Museos, comida en el Borgo, Plaza y Basílica, y luego lo demás de la tarde. Si no cabe todo, San Pietro in Montorio y la Fontana dell'Acqua Paola pasan a «Si te sobra tiempo».
  - Con los Museos reservados por la tarde un miércoles: la mañana sin Museos (Trevi, Plaza de España, Via dei Coronari, el Puente y el Castillo), comida en el Borgo, los Museos a su hora y, al salir, la Plaza y la Basílica.
  - Escríbelo así en DIAS_ROMA_PARADAS.md, y que el motor diga lo mismo.
- La línea de la última mañana «con su versión sin Museos (la del miércoles: el Castillo, el Puente y Trastevere)»: reescríbela para que hable de la versión sin Museos de los cierres (el domingo), no del miércoles.
- El pool con 1 día: no sale. El formulario salta ese paso y la barra de pasos cuenta uno menos. Con 2 días, hasta 3 sitios; con 3 o más, hasta 6.
- La frase de Cáritas en Trevi: se queda.

PRUEBAS
- El punto 10 toca el motor: pasa TODAS las pruebas, también la de las 365 fechas, a 0 fallos.
- Nuevas del punto 10: el día del Vaticano en miércoles se cambia siempre que haya otro día posible; con los Museos reservados un miércoles, la Plaza y la Basílica van después de comer; con 1 día no sale el pool.
- Nuevas: en 200 viajes de prueba, cada día tiene un título de la lista, con como mucho dos nombres y el Free Tour primero si lo hay; el día de llegada y el de vuelta tienen su título y su «Barcelona → Roma» pequeño; las 31 historias nuevas en sus fichas y ninguna comparte 15 palabras seguidas con su ficha.
- A mano, a 375 px: el calendario arriba; cambiar fechas sin la pantalla vieja; la ficha sin hueco a media altura y entera; la barra sin «Voz del móvil»; el mapa del Perfil lleno al abrirlo dos veces seguidas; los títulos en DÍAS y en HOY; el formulario con 1 día (sin pool) y con 2 días (con pool).
- Capturas en docs/dias/img/6y7-*.jpg.

Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6y7 en docs/dias, en palabras sencillas, y commits locales. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
