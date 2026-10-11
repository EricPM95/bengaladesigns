# Informe de la Tanda 6y2

Las respuestas a tus preguntas de la 6y y de la 6z6f. Se hizo en cuatro partes que luego se juntaron; cada una tiene su informe con el detalle:
- `INFORME_PARTE_REORGANIZAR_TANDA6Y2.md` (puntos 1 y 2)
- `INFORME_PARTE_FORMULARIO_TANDA6Y2.md` («Ponle nombre», fechas, experiencias, dibujo y barra de pasos)
- `INFORME_PARTE_RESERVAS_TANDA6Y2.md` (Free Tour, día completo, reserva fuera de su día, «Añadir parada», `pool_lista`)
- `INFORME_PARTE_FOTOS_TANDA6Y2.md` (fotos equivocadas, crédito y la página de candidatas)

## 1. «Reorganizar» sin zigzag
- Prioridad nueva, tal como la pediste: 1) lo reservado, 2) los momentos fuertes, 3) el orden del día escrito dentro del grupo, 4) los grupos que van juntos en un día escrito, 5) la cercanía sin volver atrás, 6) «mañana o tarde» solo para desempatar. «Crear mi propio día» usa lo mismo.
- Nuestros días escritos (D0 a D7 desordenados) siguen dando el orden escrito: 160/160 sin reservas y 200/200 con reservas.
- **200 días mezclados: el zigzag baja de 75 a 23.** Por qué quedan: 14 por un momento fuerte (Trevi de primera hora abre el día aunque esté lejos, o el paseo de Trastevere cierra la tarde) y 9 por el orden del propio día escrito (un grupo cruza la ciudad en su orden). Ninguno por «mañana o tarde». Nocturnas de día, comidas al principio o al final, cenas mal puestas, Trastevere antes de comer y grupos partidos: 0. Los 5 ejemplos en palabras sencillas están en el informe de esa parte.
- Decisión mía, para que la mires: con una reserva de tarde, lo libre de la mañana va antes que ella y lo libre de la tarde después, sin mezclar (si no, una entrada de las 16:00 podría quedar la primera del día).

## 2. La zona del alojamiento
Cada zona tiene ya su punto (`data/pipeline_v2/roma.json`, `zonas_alojamiento`): centro 41.8990, 12.4755 · Plaza de España 41.9060, 12.4823 · Prati 41.9072, 12.4637 · Trastevere 41.8896, 12.4698 · Termini 41.9009, 12.5017 · Monti 41.8954, 12.4931. «No sé» no lleva punto, a propósito. **Los puse de mi conocimiento de Roma y no los pude contrastar con el mapa** (la prueba comprueba que están dentro de Roma y a menos de 1,2 km, 1,8 km Prati, de su sitio de referencia). El servidor ya los usa (antes esperaba un array y nunca encontraba nada): con Prati el día empieza por la Plaza de San Pedro; con Monti o Termini, por la Boca de la Verdad.

## 3. La ruta a mano
- **«Ponle nombre»** en gris y cursiva, sin repetir la fecha; al tocarlo, DayNameSheet. Visto a 375 px.
- **Cambiar las fechas:** más días → se añaden vacíos antes de la vuelta; menos → se quitan primero los vacíos; con paradas, se pregunta («El sáb 13 tiene 3 paradas. ¿Qué hago con ellas?» [Pasarlas a otro día] [Quitarlas] [Cancelar]). «Pasarlas a otro día» va al día anterior más cercano que se queda (decisión mía, avisada en la pregunta). Nunca se borra nada sin preguntar.
- **Sugerencias de experiencias solo con «¡Sí, hazla por mí!».** La clasificación del destino no se ha movido: el paso de Transporte la necesita en los dos caminos. Tiempos en Roma: clasificar 2-18 ms, sugerir experiencias 2 ms, pool de lugares 2-4 ms (en Roma no hay llamadas a Claude), así que no hace más lenta nuestra ruta. Sin medir en destinos sin curar (la clave de Anthropic devuelve «crédito demasiado bajo»).
- **El dibujo de elegir** se ve entero (12 pines y 3 líneas) al acabar la animación: eran tres causas (encuadre recortado, atenuado al pasar el ratón que se queda «pegado» en el móvil, y animaciones con relleno). Visto en pantalla.
- **La barra de pasos:** «5/5» hasta la pantalla de elegir; con «hazla por mí» llega a 7/7; con «Quiero hacerla yo» nunca salen Experiencias ni Lugares. Visto en pantalla.
- **El Free Tour a mano:** se añade como cualquier reserva desde RESERVAS y desde EXPLORAR, con su hora, y va al día de su fecha como una parada más (con punto de encuentro, lo que recorre y consejos); sin precio.
- **«Hoy es un día completo»** a mano cuenta solo lo que el día tiene (700 min sin comidas ya no es completo; con comida y cena, 835, sí).
- **Reserva fuera de su día:** avisa sin mover nada, con los dos textos y sus botones ([Pasarlo al mié 15] / [Añadirlo al mié 15]) en la campana y en la tarjeta de la reserva en RESERVAS, con Deshacer. Solo en la ruta a mano (en la nuestra el motor ya coloca cada entrada).
- **«Añadir parada»** ya no trae restaurantes (ni baños, fuentes ni la tarjeta del Free Tour, que tampoco se pueden marcar). EXPLORAR normal no cambia.
- **`pool_lista` NO es la lista de imprescindibles de EXPLORAR** (tu pregunta 10). EXPLORAR no tiene lista de imprescindibles: ordena por «me gusta», luego por `level` (1 = imprescindible) y luego por orden editorial. `pool_lista` son los 20 lugares a mano del formulario «Elige lo que siempre soñaste ver». El nivel 1 en Roma son 11 lugares y comparten 10 con `pool_lista`; la Plaza de San Pedro es nivel 1 y no está en `pool_lista`; diez de `pool_lista` no son nivel 1 (la Cúpula de San Pedro, Trastevere, la Galería Borghese, el Castillo de Sant'Angelo, la Boca de la Verdad, Villa Borghese, el Ojo de la Cerradura, los Museos Capitolinos, las Termas de Caracalla y San Juan de Letrán). No lo he cambiado: la ruta a mano ordena hoy por `pool_lista` y, detrás, nivel 1. En las preguntas.

## 4. Las fotos
- **Las 8 fotos equivocadas ya no salen** (Cripta de los Capuchinos, Trastevere al atardecer, Via dei Coronari, Borgo Pio y las 4 excursiones; tu mensaje decía «9 entradas» pero nombraba 8: dime si falta una). Una lista `fotos_rechazadas` (con el motivo de cada una) en `_fotos.json`, que respeta el servidor en todos sus caminos y no cae en Unsplash. Un sitio sin foto sale como recuadro neutro; antes, en el explorador y «Añadir al día», salía una foto de stock al azar (picsum): también cambia para otros sitios sin foto.
- **Página de candidatas:** `docs/dias/FOTOS_ROMA_CANDIDATAS.html` (ábrela con doble clic; necesita internet). Cada sitio con 3 de Unsplash, autor y enlace. Las 4 excursiones: 3 buenas cada una (confirmadas por su descripción). Trastevere al atardecer: 3 que salen al buscar ese nombre pero ninguna lo dice en su descripción (marcado). Via dei Coronari y Borgo Pio: aviso «sin candidatas buenas» y 3 de calles parecidas, no confirmadas. **Cripta de los Capuchinos: ninguna, pon una tuya.** Otras que deberías revisar y no he tocado: «Excursión a Tívoli» (sale una gruta de Nápoles de Wikipedia) y «Excursión a Pompeya y Sorrento» (Unsplash, sin confirmar a ojo).
- **Crédito:** en la cabecera de excursiones sale sobre la esquina de la foto («Foto de Andy Holmes en Unsplash»; visto en pantalla); las propias nunca; las fotos pequeñas, sin línea.
- `AttractionsFinder`: no se ha tocado.

## 5. Capturas que faltaron (a 375 px)
Vistas ahora: **«Reorganizar este día»** y el aviso **«Día reorganizado · Deshacer»** (con Trevi sin gente primero y Trastevere al final), **marcar varias paradas en EXPLORAR** («Añadir a mi día (2)») con el aviso «Añadido al jueves 15 · Deshacer», **una excursión añadida a un día con precio** (la hoja con el día, la hora y el precio, la excursión «Reservada» y el presupuesto con 130 €). Capturas en `docs/dias/img/6y2-*.jpg`.
**No pude ver:** la pastilla volando a la cartera (dura 0,8 s y la captura llega tarde; ya la vi en la 6z6b), «Deshacer» pulsado en pantalla (el aviso se me fue antes de pulsarlo; lo cubre la prueba), y el aviso de la reserva fuera de su día (necesita un viaje con dos días normales y hacerlo a mano me llevaba mucho; lo cubren 128 comprobaciones con la campana, la tarjeta y los botones).

## 6. Pruebas
Nuevas: `pruebaFase6y2_reorganizar` (782), `pruebaFase6y2_formulario` (136), `pruebaFase6y2_reservas` (128), `pruebaFase6y2_fotos` (92), todas a 0 fallos; la de «Reorganizar» de la 6y, al día (1.166). Las de siempre, a 0 fallos. Invariantes: 565 retocada y 567 a 573 nuevas.
