Hola. TANDA 10N6: MÁS ARREGLOS DEL REPASO DE ERIC (27-oct): el Free Tour, elegir y confirmar, quitar una parada con entrada, EXPLORAR, los recuerdos, el aviso del pase y la música de la película. Va después de la 10N5: si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N6.md e inclúyelo en tu commit.
- **Design, nuevo: «RETOQUES.zip»** en la carpeta del proyecto (el zip completo más nuevo; lleva todo lo anterior). Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`) e inclúyelo en tu commit. Lo de esta tanda: `Piezas/Recuerdos Ficha` (la A) y el aviso del pase de `Piezas/Pase Estilo`. `Piezas/Cuentas Modo` es de la 10N7: cópiala, pero no la hagas aquí.
- **La música** de la película (1i) la deja Eric en `public/sonidos/pelicula_pase.mp3`. Si no está, déjalo preparado y sigue.
- **Las reglas de siempre:** lo de Design, exactamente igual; los menús de opciones con el formato de tarjetas de la 10N4; los nombres con la primera letra en mayúscula; espacio entre bloques distintos (10N5).

## 0a. Tus dudas de la 10N5, respondidas
1. **D1-FT frente a D3:** bien como lo has hecho: el día elegido pasa a ser D3 (el que tiene el Free Tour de las 10:00), D1 pasa a D1-FT y el que estaba en el elegido va al sitio de D3. Lo que Eric quería es «nuestro día escrito con Free Tour», y ese es D3.
2. **El botón de DÍAS en azul oscuro con dorado cuando otros del grupo ya tienen la entrada:** déjalo así. Es la regla de los tres colores (azul con dorado: otro del grupo la tiene y te queda la tuya), que manda sobre la pieza.
3. **La escena del pasaporte:** Eric lo mira y te dice el segundo exacto. Mientras, como lo has dejado.
4. **El marco de la foto del perfil:** a 118 px, como en Design.
5. **El ✈ en «Lo de cada uno»:** se queda, como en Design.
6. **El aviso «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.»:** solo a quien tenía su propio vuelo (o su propio alojamiento). A los demás marcados, «Eric ha puesto el vuelo para todos.», sin «Se ha cambiado el tuyo».
7. **Las entradas que reserva Ana para varios:** va en el apartado 1l de esta tanda.
8. **El presupuesto de un invitado:** que enseñe lo suyo: su vuelo y su alojamiento si tiene los suyos, o los del administrador si está incluido en ellos. Nunca el del administrador si no va en él.
9. **Vuelo y alojamiento propios en viajes de varios destinos:** de momento, como está (en gris). Cuando hagamos los viajes de varios destinos, se mira.
10. **Varios cambios seguidos del vuelo del administrador:** que se junten en un solo aviso, como los cambios del viaje (en el mismo rato), con lo último que quedó.
11. **Sin D2/D3, el Free Tour no se añade y se dice por qué:** bien.
12. **Lo que no se ha visto con dos cuentas reales:** Eric lo prueba con sus dos móviles después de aplicar las migraciones.
13. **El sonido:** el que hay.

## 1. El Free Tour: fuera la hoja vieja «¿A qué hora lo quieres?»
- **Lo que ve Eric:** al añadir el Free Tour sigue saliendo la hoja vieja (`FreeTourSheet.tsx`, «¿A qué hora lo quieres?» con Mañana, Mediodía, Tarde…), y debajo, subrayado, «Quitar el Free Tour».
- **Lo que decidió Eric en la 10N5:** el Free Tour se añade eligiendo el día («¿A qué día lo añadimos?»), sin elegir la hora: queda en la hora y la franja de nuestro día escrito (el D3, como lo hiciste en la 10N5), y si alguien quiere otra hora, lo arrastra.
- **Que esa hoja vieja no salga nunca más**, desde ningún sitio: RESERVAS, «+ Añadir parada», EXPLORAR, la ficha… Todos llevan a «¿A qué día lo añadimos?» de la 10N5. Si en la 10N5 ya lo quitaste de algún sitio, dime de cuáles faltaba.
- **«Quitar el Free Tour», fuera de esa hoja.** El Free Tour se quita como cualquier parada: sus tres puntitos, «Quitar parada» (la última, en rojo, con [Deshacer]). Si en RESERVAS el Free Tour tiene su fila, que su menú sea con el formato de tarjetas de la 10N4 (y «Quitar el Free Tour» la última, en rojo).
- Las rutas a mano (sin días escritos) siguen como hoy: el Free Tour como una reserva más, con su día y su hora.

## 1b. Elegir y confirmar: cada formato para lo suyo (Eric, 27-oct)
- **Las tarjetas** (`HojaOpciones`, 10N4) son para **elegir qué hacer** entre varias opciones. **La confirmación** (la hoja con dos botones, como la de «¿Seguro que quieres eliminar…?») es para **confirmar una sola decisión**. Las dos se quedan, cada una para lo suyo.
- **La confirmación, solo cuando se pierde algo** que no se puede recuperar o importa: una parada con entrada o reserva (apartado 1c), eliminar un día entero, quitar a una persona del viaje, borrar un viaje. **Quitar una parada normal, sin pregunta y con [Deshacer]** (en su tarjeta: «Sale de tu ruta. Puedes deshacerlo»; hoy pone «Se confirma antes»).
- **La confirmación, más cercana y con el botón en rojo** (como la tarjeta de quitar): la pregunta con artículo («¿Quitamos el Arco de Constantino de tu ruta?»), una línea con lo que pasa si hace falta, y [Cancelar] [Sí, quitar] (el de quitar, en rojo). Fuera las comillas («"Arco de Constantino"»).
- **Ejemplo, «Personas del viaje»:** al tocar a una persona, sus tarjetas («Cambiar permiso», «Quitar del viaje»). «Cambiar permiso» abre la hoja del permiso (tarjetas). «Quitar del viaje» abre la confirmación: «¿Quitamos a Ana del viaje?» · «Dejará de verlo y su plaza del pase vuelve a ti.» · [Cancelar] [Sí, quitar].
- Repasa todas las confirmaciones de la app y ponlas así. Dime cuáles son, con su captura.

## 1c. Quitar una parada con entrada: que no se pierda la entrada
- **Hoy:** al tocar los tres puntitos del Coliseo con su entrada reservada, solo sale «Quitar del viaje · Reservada y fijada: se quita también la reserva». Y al quitarla, se borra también la entrada de RESERVAS. Es peligroso: la entrada está pagada y, desde la 10T, guardará el archivo con el QR.
- **Que salgan todas las opciones, como en cualquier parada**, y **las que no se pueden, en gris diciendo por qué** («Mover a otro día · Tienes entrada para el jueves 26 a las 8:00», «Cambiar parada · Tienes entrada para el Coliseo»…).
- **«Quitar parada», la última, en rojo,** con la línea: «Sale de tu ruta. Tienes su entrada: te preguntamos qué hacer con ella.»
- **Al tocarla, la confirmación:** «¿Quitamos el Coliseo de tu ruta?» · «Tienes su entrada para el jueves 26 a las 8:00.» · [Quitar solo de la ruta] (la entrada se queda en RESERVAS) · [Quitar también la entrada] (en rojo) · [Cancelar]. Por defecto, nunca se borra la entrada sin que lo elija.
- Si se quita solo de la ruta, la entrada sigue en RESERVAS, con la línea «Ya no está en tu ruta» y la opción de volver a ponerla en su día.
- Lo mismo con cualquier parada que tenga una reserva (Free Tour, excursión).

## 1d. «Cerca de ti» y «Recomendados» en EXPLORAR
- **«Cerca de ti»** es del pase: sin pase, en **azul oscuro con el candado dorado** (la regla de la 10N5). Con pase, como una opción más.
- **«Recomendados»** es gratis: **en claro, con el marfil, el blanco y el dorado** de la app.
- **La regla (Eric, 27-oct):** cuando en un grupo de opciones una es del pase (azul con candado), la elegida que es gratis va **en claro con dorado**, no en oscuro, para que no se confundan las dos. Si no hay ninguna del pase, el estilo de elegir de siempre (oscuro).

## 1e. «Cambiar parada»: EXPLORAR como siempre
- **Hoy:** «Cambiar parada» abre EXPLORAR, pero al tocar un sitio se abre su ficha con las pestañas (Resumen, Entradas, Tips).
- **Que sea EXPLORAR como siempre** (la lista con su mapa), con tres cambios:
  - **arriba, una franja:** «Elige el sitio que cambia por el Arco de Constantino», con la ✕ para cancelar;
  - **el + de cada sitio, con el icono de cambiar (⇄):** al tocarlo, se cambia la parada (con el aviso de siempre y [Deshacer]);
  - **el corazón**, igual que siempre (suma o quita el like).
- **Al tocar el resto de la fila**, se ve la información del sitio (como en EXPLORAR), con el botón «Cambiar por este».
- Los sitios que ya están en la ruta, con su «En ruta», como hoy.

## 1f. Tus recuerdos en la ficha de un sitio
- **Hoy:** en la ficha de un sitio, la cámara encima de la foto (`BotonFotoParada`) parece que sirve para cambiar la foto del sitio, y es para subir tus fotos.
- **Eric ha elegido la propuesta A de Design** (27-oct): el bloque «Tus recuerdos de aquí», entre la cabecera de la ficha y las pestañas. **Fuera la cámara de encima de la foto.** Hazlo **exactamente como en Design** (`Piezas/Recuerdos Ficha`, propuesta A, en `RETOQUES.zip`):
  - **los textos, estos (Eric, 27-oct), no los de Design:** sin fotos, «**Tus recuerdos**» y debajo «Guarda tus fotos. Las verás también en tu álbum.», con el botón dorado [+ Añadir]; con fotos, las miniaturas, «**Tus recuerdos**» y debajo «3 fotos · También en tu álbum», con [Ver];
  - **la propuesta B no se usa** (la barra oscura «Mis fotos» bajo la foto);
  - al tocarlo, la hoja «Tus recuerdos» con las tarjetas «Hacer una foto · Con la cámara de la app» y «Elegir de la galería · Solo fotos de tu viaje», y debajo «Tus fotos · 3».
- **Sale siempre, también antes del viaje** (Eric, 27-oct).
- **Las fotos van al mismo sitio que hoy:** a esa parada de ese día y al álbum del viaje (`fotosViaje.ts`). Nada cambia por dentro.
- **Sin pase, una foto por sitio** (como hoy): con una foto, su miniatura y «1 foto · También en tu álbum», con [Ver]; en la hoja, «Cambiar la foto» en lugar de «Hacer una foto». Con pase, todas las que quiera.
- **El aviso del pase, al intentar guardar más de una sin pase:** el aviso del pase del apartado 1g, con «Sin pase, guardas 1 foto por sitio.» y «Guarda todas las que quieras y crea tus recuerdos.» Al tocar [Ver], lo que enseña el pase, como en el resto de la app. Si no quiere el pase, puede cambiar su foto por la nueva.
- Si las fotos sirven para algún logro (como «Visto con fotos»), que siga funcionando igual. Dime para qué se usan hoy.

## 1g. El mismo aviso del pase, también en «Escuchar historia»
- **Hoy:** sin pase, se puede escuchar una historia de prueba (10P). Después, la barra «Escuchar historia» cambia y pone «Todas las historias, con el Pase de Roma» con el candado.
- **Al tocarla, el aviso del pase**, como en `Piezas/Pase Estilo` 04 (la tarjeta azul oscuro con dorado dentro de una hoja desde abajo; Eric, 27-oct): arriba, «Desbloquéalo con el *Pase Roma*» (con el destino); una línea pequeña en gris claro con lo que ya tiene o ha usado, «Ya has escuchado tu historia de prueba.»; una línea en negrita con lo que gana, «Escucha todas las historias de tu viaje.» (sin repetir «Con el Pase Roma», que ya está en el título); y el botón dorado **[Ver el Pase Roma]**.
- **Este es el aviso del pase para toda la app y para todos los destinos** (Eric, 27-oct): una sola pieza que se adapta a lo que ha tocado el viajero. Siempre igual:
  - título: «Desbloquéalo con el *Pase {destino}*» («Pase Roma», «Pase París»…);
  - línea 1, pequeña: lo que tiene gratis o lo que ya ha usado;
  - línea 2, en negrita: lo que gana con el pase (sin repetir «Pase {destino}»);
  - botón: [Ver el Pase {destino}], que lleva a la película del pase o a su final (si ya la vio).
- **Los dos textos ya aprobados por Eric:**
  - «Escuchar historia», después de la de prueba: «Ya has escuchado tu historia de prueba.» · «**Escucha todas las historias de tu viaje.**»
  - una segunda foto en un sitio (1f): «Sin pase, guardas 1 foto por sitio.» · «**Guarda todas las que quieras y crea tus recuerdos.**»
- **La caja pequeña que ya se explica sola** (la de la zona del alojamiento en RESERVAS, `Pase Estilo` 01 de la 10N5: «¿En qué zona te alojas? · Con el Pase Roma, adaptamos tu ruta a tu alojamiento.» con [🔒 Ver]) **no lleva este aviso**: ya lo dice en su sitio. Su [Ver] lleva directo a la película del pase (o a su final).
- **Para todo lo demás que esté bloqueado por el pase y no se explica en su sitio** («Cerca de ti», «Baños» y «Fuentes» en EXPLORAR, lo de HOY…): el mismo aviso, con sus dos líneas siguiendo esa regla, **siempre verdad** (nada que el pase no haga). Ponlos todos en el informe en una lista (dónde sale, línea 1 y línea 2) para que Eric los revise. Los textos van en un solo sitio (un archivo), para cambiarlos fácil y para cada destino.
- Si el viajero ya tiene el pase (comprado o con una plaza de un pase de grupo), este aviso no sale nunca.
- **La regla, para toda la app (Eric, 27-oct): dos cosas distintas, cada una para lo suyo.**
  - **El aviso pequeño** sale cuando alguien sin pase **toca algo bloqueado por el pase** (una segunda foto, «Escuchar historia» después de la de prueba, «Cerca de ti», «Baños» y «Fuentes» en EXPLORAR…). Lleva su frase: arriba, lo que tiene gratis o lo que ya ha usado; debajo, lo que gana con el pase. Nunca una pantalla grande de golpe.
  - **La película del pase** sale cuando toca algo que es **para ver el pase**: la pastilla «Pase Roma» de RUTA, el [Ver] del aviso pequeño, «Ver el Pase Roma»… Como hoy (10P): si aún no la ha visto, la película desde el principio; **si ya la vio, directo al final** (lo que incluye y comprar), con [Repetir] para verla otra vez.
  - Busca todos los sitios del pase y dime en el informe cuál lleva el aviso pequeño (con su texto) y cuál lleva a la película.

## 1h. La lista del pase, que diga lo de las fotos y las historias
- En la lista del pase (el final de la película, «Todo lo que incluye» y «Con el pase tendrás» de HOY), cambia estas líneas con los ajustes de `data/pase/lista_ajustes.json` (como se hizo con «Invita a un amigo»), para que coincidan con los avisos del pase (1f y 1g):
  - «Tus fotos de cada sitio · Guardadas en cada parada de tu viaje.» → «**Todas las fotos que quieras** · En cada sitio y en tu álbum.»
  - «La historia de cada sitio · Como una audioguía, en tu móvil.» → «**Todas las historias** · De cada sitio, como una audioguía en tu móvil.»
- **Comprueba que en la 10N5 ya cambiaste** «Empiezas cerca de donde duermes · Cada día sale desde tu zona.» (no es verdad). Si sigue, ponla así: «**Tu ruta, adaptada a tu alojamiento** · El primer día empieza cerca de donde duermes.»
- En `lista_ajustes.json`, «La puesta de sol y lo de mañana» sigue en `prometidas_sin_hacer`, pero ya se hizo en la 10P: quítala de ahí si ya funciona.

## 1i. Música en la película del pase
- **Eric quiere música de fondo** en la película del pase (27-oct): suave, de fondo.
- **El archivo lo pone Eric** en la carpeta del proyecto: `public/sonidos/pelicula_pase.mp3` (una pista libre de derechos con licencia; Eric guarda su certificado de descarga). Si al llegar aquí aún no está, déjalo todo preparado y dímelo en el informe. Nunca uses una música que no te haya dado Eric.
- **Cómo suena:**
  - empieza cuando empieza la película (en el iPhone solo puede sonar después de tocar la pantalla: la película empieza al tocar [Ver], así que vale); si no puede sonar, no falla nada;
  - **volumen bajo**, que entre y salga poco a poco (sin cortes de golpe), y que dure lo que la película (si la pista es más corta, que se repita sin que se note; si es más larga, que baje al final);
  - al saltar a otra escena (las rayitas) o al [Saltar], sigue sin cortarse; al cerrar la película, baja y se para;
  - si se sale de la app o se bloquea el móvil, se para.
- **El botón de silencio**, pequeño, arriba, en la misma línea que el título y [Saltar] (con el icono del altavoz). La app recuerda lo que eligió el viajero. Respeta el ajuste «Sonido de los momentos» (apagado: sin música).
- **Que pese poco:** comprímela (por ejemplo, mp3 a 96 kbps, menos de 1 MB) y que se baje sin retrasar el principio de la película.

## 1j. El presupuesto sin gastos: el bloque «Ruta» vacío
- **Hoy:** sin gastos, el presupuesto enseña un recuadro de rayas, «Todavía no hay gastos · Aparecerán aquí cuando añadas tus reservas con su precio. Y puedes apuntar tus extras.».
- **Que sea el mismo bloque «Ruta» que sale cuando ya hay gastos** (la tarjeta blanca con su icono y el título «Ruta»), pero vacío: sin importe a la derecha y, dentro, solo una línea pequeña en gris: «**Aquí se irán añadiendo todos los gastos de tu ruta.**» Fuera el recuadro de rayas.
- Debajo, «Extras» con [+ Añadir gasto], como hoy. Así la pantalla es igual con gastos y sin ellos.

## 1k. Lo que es solo para ti no es del grupo
- **Lo que ha visto Eric:** en RESERVAS añadió el Coliseo, Foro y Palatino a 100 €, con «¿Para quién es?» solo Eric (1 de 2). En el presupuesto sale «Del grupo · 100 €», y en «Cuentas del grupo», «Total del grupo 100 €» y «Eric · Ha pagado 100 € · Le toca 100 €». No se entiende: es un gasto suyo, no del grupo.
- **La regla (Eric, 27-oct):** una reserva o un gasto **solo para quien lo paga** es **personal**, como un gasto [Para mí]:
  - **no cuenta en «Del grupo»** del presupuesto **ni en «Cuentas del grupo»** (ni en el total, ni en lo que ha pagado ni en lo que le toca);
  - **sí sale en el presupuesto de esa persona**, en su bloque (Ruta, Extras…), con el candado y «Solo tú», como los [Para mí], y cuenta en «Tu parte»;
  - los demás del viaje no lo ven en sus cuentas.
- **Si es para otro, o para varios,** sí es del grupo: cuenta en «Del grupo» y en las cuentas (si Eric paga la entrada solo de Ana, Ana le debe esos 100 €).
- Lo mismo con el alojamiento, el coche y los vuelos de la 10N5: lo que es solo para quien lo pone, es personal.
- Revisa que nada se cuente dos veces y que las cuentas sigan cuadrando al céntimo.

## 1l. Las entradas para varios: que funcione igual lo compre quien lo compre
- **Lo de la 10N3 y la 10N4, comprobado en todas las direcciones:** cuando alguien reserva una entrada y marca a otros en «¿Para quién…?», a cada marcado le sale como suya (el aviso «Eric ha reservado el Coliseo para ti · jueves 12 · 9:15», el botón verde con ✓ en DÍAS, «Tu entrada» en verde en la ficha y la entrada en su RESERVAS); y a los no marcados, el aviso con [Reservar la mía a la misma hora] y [Ya la tengo], y en la ficha, en azul con dorado, quién la tiene.
- **Que funcione igual si la compra un invitado** (Ana compra para ella y para Eric: a Eric le sale como suya), no solo el administrador. Dime si hoy ya funcionaba.
- **Con varios, el texto en plural y con los nombres:** «**Eric y Ana la tienen** para el jueves 12 · 9:15», «Eric y Ana han reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?». Con más de dos: «Eric, Ana y Laura la tienen…».
- Si dos personas compran entradas distintas para el mismo sitio (cada uno a una hora), cada uno ve la suya y los demás ven las dos («Eric la tiene a las 9:15 · Ana a las 11:00»).

## 2. La prueba
- La batería rápida y `pruebaJutrip`. Si algo falla solo al correr con las demás y solo pasa, dilo y sigue (se arregla en la 10S).
- Prueba nueva o añade a `pruebaTanda10N`: desde RESERVAS, «+ Añadir parada», EXPLORAR y la ficha, el Free Tour abre «¿A qué día lo añadimos?» y nunca «¿A qué hora lo quieres?»; quitarlo con «Quitar parada» y [Deshacer]; la ruta a mano, como hoy. Las confirmaciones solo donde se pierde algo, con la pregunta con artículo y el botón rojo; quitar una parada normal con [Deshacer] sin pregunta; «Personas del viaje» con su confirmación. La parada con entrada: todas las opciones (las que no se pueden, en gris con el porqué) y la confirmación con [Quitar solo de la ruta] y [Quitar también la entrada]. «Cerca de ti» en azul con el candado y «Recomendados» en claro. «Cambiar parada» con EXPLORAR de siempre, la franja, el ⇄, el corazón y la información al tocar. Tus recuerdos en la ficha como la propuesta A (sin fotos, con una sin pase, con 3 con pase, la hoja), sin la cámara encima de la foto, y las fotos en la parada y en el álbum. El presupuesto sin gastos con el bloque «Ruta» vacío y su línea. Las entradas para varios, compradas por el administrador y por un invitado, con el plural («Eric y Ana la tienen…») y dos horas distintas. Una reserva o un gasto solo para quien lo paga no cuenta en «Del grupo» ni en «Cuentas del grupo», y sale en su presupuesto con «Solo tú»; para otro o para varios, sí. El aviso pequeño del pase al guardar una segunda foto sin pase, al tocar «Escuchar historia» después de la de prueba y en todo lo del pase.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N6.html`, a tamaño de móvil.

## 3. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N6».

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N6.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
