Hola. TANDA HOY2b: EL COMPAÑERO, EL RETO DEL DÍA Y LOS RETOQUES (5-nov). Va justo después de la HOY2 (con su push). Eric la usa en Lanzarote desde el domingo 8: subida el VIERNES 6 por la noche como tarde. Si no llega todo, sube lo que funcione (0 fallos) en el orden de abajo y dime lo que falta. Este prompt acaba con «reinicia el api-server»: si no te llega, dímelo antes de empezar.

- **Design:** el mismo zip de la HOY2, `HOY_COMPLETO.zip`. Páginas: `Piezas/Hoy Completa.dc.html` y `Piezas/Hoy Recorrido.dc.html` (pantallas 5, 15 a 17, 20 a 21 y 33). El diseño, igual; los textos y los datos, los nuestros. Mismas reglas que la HOY2 (propuestas como la 23, nada se mueve solo, la prioridad de las paradas, «Tu día» sin horas). Nota `_estado_hoy2b.md` a la rama `estado`.

## 1. «¿Qué hago ahora?» (17 y Completa 1 a 6)
- **El botón:** siempre a la vista, en su sitio de la Completa. Se ilumina (el punto dorado de la Completa 4, sin parpadeo) solo si hay algo nuevo:
  - **30 min libres o más** antes de lo siguiente con hora: lo más cercano no visto, primero lo que da pedazo de colección. «Tienes media hora libre: el Mirador de Haría está a 8 minutos. ¿Vamos?» [Cómo llegar] [Añadir];
  - **hora de comer sin restaurante:** lleva a «Quiero comer ahora»;
  - **día acabado y con luz:** el atardecer cercano y la cena.
- **Sin iluminar, si lo tocas:** «Vas clavando la ruta: si sigues así, hoy lo ves todo. Ahora mismo no hay nada mejor que hacer. Ahora toca la Plaza de España, a 9 minutos.» [Cómo llegar].
- No repite un sitio ya ofrecido por el aviso de fuera de ruta (H8b).

## 2. «¿Cómo vais?» (16) y Cansados (16b)
- **Cuándo sale:** una vez al día, después de comer, si quedan 2 paradas o más: [Con fuerzas] / [Cansados]. Se apaga con «Sugerencias del compañero».
- **Cansados nunca se queda sin respuesta.** Sale la primera que se pueda:
  1. **«Vamos con calma»:** quitar algo flexible u opcional y una pausa cerca, abierta ahora (bar o café de «Cerca de ti › Comer», un mirador o una playa de nuestros datos). Si no hay pausa, solo lo de quitar.
  2. **Nada que quitar:** «Tomaos un respiro» con +15 / +30 min (apartado 3).
  3. **Una reserva cerca:** «Aguantad un poco: a las 15:00 tenéis la Cueva de los Verdes. Lo que queda después, ¿lo dejamos para otro día?» [Pasar a otro día].
  4. **Solo queda lo opcional:** «¿Y si por hoy lo dejáis aquí? Lo que queda no es imprescindible» [Terminar el día] (pasa a «Si te sobra tiempo») / [Seguimos].

## 3. +15 / +30 min NO mueve la ruta (Eric, 5-nov)
Vale para Cansados y para el [Necesito más tiempo] de la HOY1 (cambia lo que hace ahora).
- **La ruta no cambia.** La app solo mira si, con ese tiempo de más, llegas a algo cerrado o tarde a una reserva.
- **Algo cerrado:** solo un aviso, sin botones, por ejemplo: «Tómate 30 min más sin prisa, pero llegarías a la Iglesia de San Miguel ya cerrada: podrás verla por fuera».
  - «Podrás verla por fuera», solo en iglesias, castillos y sitios que se ven desde fuera.
  - En los demás: «…llegarías a la Cueva de los Verdes ya cerrada».
  - Sin «lo pasamos a otro día».
- **Reserva o turno en peligro:** esa opción no se ofrece. Sale «Con 30 min más no llegas a tu entrada de las 15:00» y [Ver solución].
- **Reorganizar de verdad** es «Voy con retraso».

## 4. El reto del día (5), mejorado (Eric, 5-nov)
- **Qué colecciones salen:**
  - **todas** las que puedes completar hoy con las paradas del día;
  - y también las que tienen un pedazo que no está en ningún día de tu ruta, pero cerca de la zona de hoy (hasta 20 min en coche o 15 a pie): «Te falta Los Hervideros y no está en tu ruta».
- **Cómo se ven:**
  - debajo de la tarjeta principal, como en la 5;
  - **si hay más de una, en fila con scroll horizontal**, como los viajes del Perfil (`Piezas/Mis Viajes Tarjeta`);
  - cada tarjeta: el nombre, «3 de 5 · te faltan 2» y su barra.
- **Al tocar una, el álbum de cromos** de esa colección: la pantalla A de `Piezas/Mi Vitrina` (`ColeccionPorDentro`), pero **con la foto de cada sitio en vez del icono**. Cada cromo con su estado:
  - «Visto» y la fecha;
  - «Hoy en tu ruta»;
  - «En tu ruta el jueves»;
  - «No está en tu ruta», con [Añadir] (la hoja de días de siempre).
- **Cuándo se ve:** todo el día, mientras quede algo por completar. Se apaga con «Sugerencias del compañero».

## 5. A tu aire (33)
- En días o tardes sin ruta: «Hoy libre», la lista para marcar Visto en cualquier sitio y la pregunta «¿Te avisamos si pasas cerca de algo que da recompensa?».
- Abajo, [Volver a mi ruta].

## 6. El atardecer sin parada (20b)
- **El texto:** «Hoy el sol se pone a las 18:04». Debajo, «Aquí el sol se esconde en el mar. Si te apetece verlo, te recomendamos estos sitios:».
  - La frase del mar, solo en Lanzarote.
  - Hoy esa línea sale después de los dos puntos: corrígelo.
- **Los sitios:** cada uno en su fila, con **su foto**, su tiempo y su [Cómo llegar].

## 7. [Guardar en mi galería] (Eric, 5-nov)
- Hoy las fotos de la cámara de viaje solo van al álbum.
- **Dónde sale el botón:** junto a «Guardada en los recuerdos de hoy» y en cada foto en grande del álbum.
- **Qué hace:** en iPhone, abre la hoja de compartir con «Guardar imagen»; en Android, descarga la foto. La foto, a su calidad original.

## 8. Los textos de HOY
- **El tono:** frases completas y cercanas, como alguien que te acompaña; nunca a trozos («Si te apetece verlo: A · B · C»).
- **El archivo:** haz `docs/hoy/TEXTOS_HOY.md` con TODOS los textos de HOY (HOY1, HOY2 y HOY2b): el texto, dónde sale y cuándo. Lo repasamos y te pasamos los cambios.

## 8b. Los avisos de horario: fuera de DÍAS, a HOY (Eric, 5-nov)
Hoy sale en las tarjetas «A esta hora, posiblemente … ya esté cerrada, pero puedes verla por fuera» (`avisoDeHorario.ts`). En la ruta no hay horas y en el acordeón no cabe. Cambia así, en Roma y en Lanzarote:
- **DÍAS:** quita esa línea gris de todas las tarjetas. Se queda solo lo seguro en rojo (cerrado todo ese día).
- **Si un sitio no se ve desde fuera** (el Tempietto, en un patio):
  - primero, el rodeo pequeño de siempre: ponerlo antes dentro de su zona;
  - si aun así llega cerrado, la parada pasa a su `si_cerrado` («El mirador de San Pietro in Montorio»), con su nombre, su texto y su foto;
  - revisa todos los sitios con `si_cerrado` y dime cuáles cambian.
- **HOY, por la mañana** (en los avisos, sobre «Sal de casa…»): si alguna parada de hoy va justa de horario (llegada prevista a menos de 30 min del cierre o de la última entrada, o antes de abrir), sale una tarjeta tranquila, con 2 sitios como mucho, que se cierra con la X. Por ejemplo: «Para hoy: la Cueva de los Verdes cierra a las 18:00. Vamos con margen; si os retrasáis, os avisamos a tiempo.» Según el sitio, se añade:
  - si se ve por fuera: «Y si llegáis tarde, se ve igual por fuera.»;
  - si tiene `si_cerrado`: «Y si llegáis tarde, desde el mirador de al lado se ve igual de bonito.».
- **HOY, durante el día, en directo:** con la hora real, si a tu ritmo llegarías cerrado a algo que se visita por dentro (o a menos de 20 min de la última entrada), sale arriba «A este ritmo llegarías a la Cueva de los Verdes cuando ya ha cerrado» con [Ver solución]. Lleva a una propuesta como la 23: adelantarla quitando antes algo flexible. Una vez por sitio y día. Si se ve por fuera, no avisa.
- **Nunca «a esta hora»:** siempre la hora de cierre o de apertura a la vista.

## 8c. La pestaña «Logros» de la ficha (LG1)
Al abrirla, TODAS las colecciones salen CERRADAS (hoy la primera sale abierta). Se abren al tocarlas. Roma y Lanzarote.

## 9. La prueba
- `pruebaJutrip`, `pruebaTandaHOY1`, `pruebaTandaHOY2` y `pruebaTandaLG1` en 0; las que cambien, con «antes → ahora → decisión de Eric».
- **Nueva `pruebaTandaHOY2b`:**
  - el botón iluminado y sin iluminar;
  - «¿Cómo vais?» una vez al día y apagado;
  - Cansados en sus 4 casos (también en Lanzarote sin café);
  - +15 / +30 sin mover la ruta, con el aviso de cerrado sin botones y sin ofrecerse si peligra una reserva;
  - el reto con 0, 1 y 3 colecciones y con un pedazo fuera de la ruta;
  - el álbum con fotos y sus 4 estados;
  - el atardecer con fotos;
  - la galería;
  - sin aviso de horario en DÍAS; la tarjeta de la mañana y el aviso en directo; el Tempietto que pasa al mirador;
  - la pestaña Logros con todo cerrado al abrir;
  - sin textos de Roma en Lanzarote.
- **En el REPASO,** capturas de móvil de la pantalla entera, en el viaje de Eric en Lanzarote (martes 10), y `TEXTOS_HOY.md`. Y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
