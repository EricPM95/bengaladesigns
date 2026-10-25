Hola. TANDA 10M: LOS AVISOS DE LA RUTA (las tarjetas especiales, la ventana de avisos, un aviso por fecha, los cierres de cada semana y la campana). No cambies cómo se reparten los días: esta tanda cambia qué se le dice al viajero y dónde. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10M_AVISOS.md e inclúyelo en tu commit.
- Lo decidió Eric el 25-oct revisando `AVISOS_REVISION.html` (10L). La regla de todo: **la ruta, limpia; lo importante, al abrir la ruta; y luego, siempre a mano en la campana.**

## 1. El orden al abrir la ruta
1. **La tarjeta especial**, si el viaje cae en una (apartado 2).
2. **Después, los avisos**, en grande y con el mismo estilo que la tarjeta especial, cada uno con su icono (apartado 3). Sin tarjeta especial, los avisos directamente.
3. **Al cerrarlos, se quedan en la campana de arriba** (apartado 6), por si el viajero quiere añadir o cambiar algo de su ruta.

## 2. Las tarjetas especiales (`SeasonCard.tsx`)
Son solo para felicitar al viajero por la época en que va, con su dibujo. Una sola tarjeta por viaje, y un solo texto por tarjeta (sin variantes de luces, árboles, mercadillo, noche ni nada).
- **Navidad** (del 26 de noviembre al 6 de enero, la `temporada_navidad` de roma.json), con su dibujo de ahora: «¡Vas a vivir Roma en Navidad! Uno de los momentos más bonitos del año para recorrerla. Te hemos preparado la mejor ruta para que disfrutes cada rincón de la ciudad.»
- **Semana Santa y Pascua, nueva** (del Domingo de Ramos al Lunes de Pascua, calculado como ya se calcula para los avisos): «¡Vas a vivir Roma en Semana Santa! Uno de los momentos más especiales del año en la ciudad. Te hemos preparado la mejor ruta para que lo vivas todo.»
- **El cumpleaños de Roma, nueva** (21 de abril): «¡Estás en Roma el día de su cumpleaños! El 21 de abril la ciudad celebra su fundación, hace más de 2.700 años. Te hemos preparado la mejor ruta para que lo disfrutes.»
- **Las dos nuevas, con su propio dibujo, tan bonito como el de Navidad** (el cielo, la silueta de Roma y su detalle: la Semana Santa, por ejemplo, con la luz del amanecer y San Pedro; el cumpleaños, con algo de la Roma antigua). Que se vea que son de la misma familia que la de Navidad.
- Si un viaje cae en dos (Pascua cerca del 21 de abril), solo la de Semana Santa.
- Comprueba en las webs oficiales que se siguen celebrando (el Via Crucis del Papa en el Coliseo, la bendición en San Pedro, el desfile del Natale di Roma junto al Circo Máximo), y apunta la fuente y la fecha en que lo comprobaste. Los textos no dan horas ni detalles que cambien cada año.
- «Roma» sale del dato del destino: cada destino podrá tener las suyas.

## 3. La ventana de los avisos (`DateNoticesModal.tsx`)
- **Hoy, en el móvil, sube desde abajo como una hoja, y la tarjeta especial sale en el centro: no se parecen.** Que los avisos salgan **en el centro, del mismo tamaño y con el mismo estilo que la tarjeta de Navidad**, con el icono de cada aviso arriba, en lugar del dibujo.
- Se queda lo que ya hay: las flechas ‹ ›, los puntitos, «1 de 3», como mucho 3 tarjetas (la tercera con «y N más»), «Siguiente» hasta la última y «Entendido» en la última.

## 4. Un solo aviso por fecha (`fechas_especiales` y `closed_notices`)
Hoy cada fecha tiene variantes según lo que haya hecho la ruta (en la página de la 10L, 33 capturas para unas 20 fechas, casi iguales). Pasa a **un solo aviso por fecha**, en dos partes:
- **Qué pasa ese día, siempre igual:** todo lo que cierra o cambia ese día, esté o no en su ruta (es información por si quiere añadir algo). Solo cambia la fecha del viajero. Por ejemplo: «15 de agosto · Ferragosto: es festivo y cierran los Museos Vaticanos y muchos comercios.» o «Domingo 3 · La Galería Borghese es gratis el primer domingo de mes, con reserva: las entradas salen 10 días antes y se agotan enseguida.».
- **La frase de lo que hemos hecho, la misma para todos:** «Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.»
- **La única excepción**, porque ahí la frase sería mentira: si un sitio de `sitios_que_no_se_quitan` no se ha podido mover y se queda en un día que cierra: «En tu viaje no hay otro día para los Museos Vaticanos: se quedan en su día y decides tú.»; y si se enseña por fuera, la de ahora («…te lo enseñamos por fuera, merece la pena igual»).
- Sale si la fecha cae dentro del viaje, aunque nada de su ruta cierre.
- Lo que va aparte se queda (el transporte del 1 de enero, «muchos restaurantes cierran»…), en la misma tarjeta.
- 35 palabras como mucho cada aviso, como hasta ahora.

## 5. Los cierres de cada semana y el último domingo de mes
- **Hoy no se cuentan cuando la ruta los esquiva.** Viaje de Eric del jueves 5 al domingo 8 de noviembre de 2026: el domingo no salió nada de los Museos Vaticanos; y en la página de la 10L no hay ningún aviso de la Borghese en lunes. Dime qué pasó en ese viaje (si la ruta tuvo que mover algo o los Vaticanos cayeron solos en otro día).
- **Que salgan siempre que un cierre de la semana caiga dentro de las fechas del viaje y el sitio esté en su ruta**, con la forma del apartado 4: «Los domingos cierran los Museos Vaticanos. Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.» Nombrando el sitio, nunca «los museos» (en Roma, el domingo cierran los Vaticanos; la mayoría de los demás, el lunes).
- **El último domingo de mes** (el aviso de la 10L), con este texto: «Último domingo de mes: los Museos Vaticanos abren gratis por la mañana, hay mucha cola y puedes perder todo el día. Por eso te los hemos puesto el {día}.» ({día}: el día del viaje en que están, «el viernes 6»). Solo si el viaje incluye ese domingo y los Vaticanos están en su ruta otro día. Ese domingo, el aviso de «los domingos cierran» no sale. La ruta sigue sin ponerlos ese domingo, como ahora.

## 6. DÍAS limpio y todo a la campana
- **Fuera todas las pastillas de los avisos de la cabecera del día en DÍAS** («Panteón cerrado», «Foro Romano cerrado», «Coliseo cerrado», «Museos Vaticanos cerrados», «Horario especial», «Año Nuevo»…).
- **Fuera «Hoy el sol se pone a las…»** de la cabecera del día en DÍAS. La puesta de sol solo sale en HOY, cuando toca.
- **Cada fecha con avisos entra en la campana de notificaciones** (la que ya existe), con una frase corta: «Coliseo, Panteón y 2 lugares más cierran el 25 de diciembre.» (dos nombres y «N lugares más» si hay más; con un día especial, su nombre delante: «1 de enero · Año Nuevo: el Coliseo, el Foro y 2 lugares más cierran»). Sin nada que cierre, el título del aviso («Domingo 3 · La Galería Borghese, gratis»).
- **Al tocarlo,** se abre su tarjeta (la misma de la ventana de avisos, apartado 3), con todo lo de esa fecha.
- **Leído:** una vez abierto, deja de contar en el numerito de la campana, pero **se queda siempre en la lista**.
- **Lo que el viajero ve en la ventana al abrir la ruta entra en la campana ya como leído**, para que no le salga dos veces como nuevo.
- **Los nuevos, siempre arriba,** encima de los ya leídos (también los avisos de la campana que ya existían, como los de cambio de vuelo).
- Si el viajero cambia las fechas y salen avisos nuevos, entran como nuevos; los de fechas que ya no están en su viaje se quitan de la campana.

## 7. La página de avisos
- Vuelve a generar `docs/dias/AVISOS_REVISION.html` con todo esto:
  - las tres tarjetas especiales;
  - **un ejemplo por fecha** (un solo aviso por fecha) y los cierres de cada semana;
  - la excepción («se quedan en su día y decides tú», «te lo enseñamos por fuera») aparte;
  - **la ventana con varios avisos** (las flechas, «1 de 3» y la tercera con «y N más»), como lo verá el viajero;
  - la campana con avisos nuevos y leídos, y la tarjeta que abre;
  - una captura de DÍAS sin pastillas.
- En la de la 10L, en 3 tarjetas de Navidad el texto de debajo de la captura todavía ponía «como anochece sobre las {hora_atardecer}»: que no vuelva a pasar (el texto, leído de los datos de ahora).

## 8. Las pruebas que fallan al correr juntas
- En la 10L, las de 10B, 10G, 10H, 10I y `pruebaRevisionLargos` fallaron en la batería y solas pasaban (Vite abierto mucho rato y la carga de correr todo a la vez). Arréglalo para que la batería quede en 0 sin repetir nada a mano (por ejemplo, que reinicie Vite antes y que las que comparten algo no corran a la vez).

## 9. La prueba
- La batería rápida y `pruebaJutrip`.
- La muestra de 60 fechas, solo para comprobar que **las rutas salen exactamente iguales que antes** (esta tanda no cambia el reparto; los avisos salen del motor y hay que asegurarlo). No hace falta la de 365.
- Prueba nueva `pruebaTanda10M`:
  - Navidad, Semana Santa y el 21 de abril sacan su tarjeta (un solo texto); Pascua el 21 de abril, solo la de Semana Santa; otra fecha, ninguna;
  - un solo aviso por fecha, con la frase genérica; la excepción cuando un imprescindible se queda en un día que cierra;
  - un viaje con domingo y los Vaticanos en la ruta saca el de «los domingos cierran»; el último domingo de mes, el suyo y no el otro; un viaje con lunes y la Borghese, el de la Borghese;
  - DÍAS sin pastillas de avisos y sin «el sol se pone»;
  - la campana: los avisos entran, al abrirlos dejan de contar y se quedan; los nuevos arriba; los vistos en la ventana entran como leídos; al cambiar las fechas, los que ya no tocan se quitan.
- `pruebaFase6y5_motor`: si solo se queda sin tiempo, como antes, dilo y sigue. Se arregla en la Tanda 12.

## 10. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10M».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
