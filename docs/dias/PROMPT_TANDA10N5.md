Hola. TANDA 10N5: MÁS ARREGLOS DEL REPASO DE ERIC CON DOS TELÉFONOS (26-oct): el Free Tour, los avisos de cambios, unirse con el código, el perfil, la película del pase, lo que pide el pase, RESERVAS y el vuelo y el alojamiento de cada uno. Va después de la 10N4: si estás con otra tanda, acábala primero (con su push) y haz esta después. No hace falta la muestra de 60 fechas, salvo que toques el motor de rutas (entonces, dímelo antes). Es una tanda grande: si ves que es mejor partirla en dos, dímelo antes de empezar.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N5.md e inclúyelo en tu commit.
- Eric ha aplicado la 0046 (la de la 10N4). Si al probar ves que falta, dímelo.
- **Design, nuevo: «RETOQUES.zip»**, en la carpeta del proyecto. Es el zip completo de Design y lleva todo lo de «APP_RUTAS.zip». Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/` ni `screenshots/`) e inclúyelo en tu commit. Lo nuevo: `Piezas/Perfil Orden`, `Piezas/Mis Viajes Tarjeta`, `Piezas/Unirse Codigo`, `Piezas/Pase Estilo` (**solo su 01**, apartado 6b), `Piezas/Reservas Cada Uno` y los cambios de `Piezas/Pase Pelicula`. **`Piezas/Pase Premium` no se usa**, ni el resto de `Pase Estilo` (Eric, 26-oct: «se han hecho demasiados diseños»).
- **Lo de Design, exactamente igual (Eric, 26-oct: «nos gusta mucho»).** Cada pantalla de Design que nombra esta tanda se hace igual que en su pieza: medidas, márgenes, colores, letras, iconos, sombras, textos y animaciones. Nada «parecido» ni a tu manera. Solo cambian los datos de ejemplo (usa los de verdad) y lo que este prompt diga expresamente que cambia. Si algo no se puede hacer igual en la web o en el iPhone, dímelo antes y no lo cambies por tu cuenta. En el REPASO de esta tanda, cada captura al lado de la de Design, para compararlas. Y cualquier menú de opciones nuevo, con el formato de tarjetas de la 10N4 (apartado 3), para que la app sea siempre igual.

- **Tus dudas de la 10N4, respondidas:**
  1. **`PerfilSheet`:** déjala como cáscara; en esta tanda se rehace el perfil entero (apartado 4).
  2. **Los candados:** que no empiecen abiertos. Mientras no se sabe si hay pase, ni abiertos ni cerrados (sin pintar, como la pastilla de la 10N4), y que se repinten solos en cuanto llega la respuesta (que `pagoActivo()` avise al cambiar). Nunca un candado cerrado a quien tiene pase ni abierto a quien no lo tiene.
  3. **Los tres colores, también en RESERVAS, el Free Tour y las excursiones** (la regla es para toda la app): frambuesa, te falta; verde, ya lo tienes; azul oscuro con dorado, otro del grupo lo tiene y te queda elegir lo tuyo. Dime dónde lo has cambiado.
  4. **«Cambiar el nombre» y «Mover el día antes/después» en el menú del día:** se quedan, con el formato de tarjetas, antes de «Eliminar día».
  5. **El sonido:** de momento, el que has puesto. Eric lo prueba en su iPhone y, si no le gusta, te pasa otro.
- **Dos reglas nuevas para toda la app (Eric, 26-oct):**
  - **Los nombres de las personas, siempre con la primera letra en mayúscula y el resto en minúscula** («Viajes», no «VIAJES»; «José Luis», cada palabra con su mayúscula), en todos los sitios donde salgan: la campana, la franja, las personas del viaje, los gastos, las cuentas, RESERVAS, el perfil («Hola, Viajes»)… Solo al enseñarlos: el nombre se guarda tal como lo escribió la persona.
  - **Espacio entre bloques distintos:** cuando en una pantalla hay dos bloques diferentes (una pregunta con sus opciones y la siguiente, un título y su lista…), con espacio claro entre ellos, para que todo se vea limpio. Nada pegado. Repasa las pantallas que toques en esta tanda y las hojas de añadir (gasto, reserva, parada).

## 1. El Free Tour: se añade eligiendo el día, como cualquier sitio, y entra «nuestro día con Free Tour»
- **Lo que ha pasado:** la cuenta invitada (con «Editar») añadió el Free Tour desde EXPLORAR. El motor rehízo los días, el Free Tour quedó el primer día **después de la cena, bajo «Tarde» y justo antes de «Noche · Fin del día»** (mal colocado), y al administrador le llegó «VIAJES ha cambiado el viaje: ha añadido Coliseo al miércoles 11 y otros 5 sitios y ha quitado 6 sitios», que asusta y no se entiende.
- **Lo que decide Eric (26-oct):**
  - **Se añade como cualquier sitio:** desde EXPLORAR, su ficha **y también desde «+ Añadir parada» de un día en DÍAS** (hoy sale en esa lista pero no deja añadirlo: que deje). Sale la misma hoja «¿A qué día lo añadimos?», con los días del viaje; el primero que le encaje (el primer día, o el siguiente si ese día se llega tarde), ya marcado.
  - **El día elegido pasa a ser nuestro día escrito con Free Tour** (`D1-FT` en `roma.json`, que tiene el Free Tour en su sitio exacto, con su hora de salida y su franja). Hoy solo hay ese día con Free Tour: si el viaje tiene `D1`, se cambia por `D1-FT` y se coloca en el día elegido (el día que estaba ahí pasa al sitio que deja, como al cambiar el orden de los días con las rayitas). Dime qué haces si el viaje no tiene `D1`, o si el día elegido o el que se mueve tiene una reserva con hora o cosas puestas a mano: esos no se mueven sin avisar.
  - **Sin elegir hora:** el Free Tour queda en la hora y el sitio que tiene en nuestro día escrito. Si alguien quiere otra hora, lo arrastra dentro del día donde quiera, como cualquier parada (y su hora de salida se elige luego al reservarlo).
  - **El aviso al añadirlo:** el de siempre, «Añadido el Free Tour · jueves 12» con [Deshacer], que deja el viaje como estaba.
  - **Quién puede:** el administrador y quien puede editar, directo. **Quien solo recomienda:** va a su propuesta como **un solo cambio**, «Añadir el Free Tour al jueves 12», y al aceptarlo se hace lo de arriba.
- **Nunca después de la cena ni fuera de su franja** («Mañana», «Tarde» o «Noche»): con nuestro día escrito, ya no pasa.
- Si para esto hay que tocar el motor, dímelo antes y pasa la muestra de 60 fechas.

## 2. El aviso de los cambios del viaje, que se entienda
- Hoy, cuando el motor reorganiza los días, el aviso cuenta cada sitio que cambia de sitio como «quitado» y «añadido». Que el aviso diga **lo que de verdad ha pasado**, en una línea:
  - si alguien ha añadido un sitio y la app ha reorganizado los días para que encaje: «VIAJES ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.»;
  - si alguien ha movido sitios: «VIAJES ha movido el Coliseo al jueves 12.» (y «…y 2 sitios más» si son más);
  - si ha quitado: «VIAJES ha quitado la Iglesia del Gesù.»;
  - nunca «ha quitado 6 sitios» cuando solo se han movido de día.
  - **el interruptor [Roma | Excursión] de un día:** hoy, al cambiarlo, llega «VIAJES ha cambiado el viaje: ha añadido Basílica de Santa María la Mayor al sábado 14 y otros 5 sitios». Que diga lo que ha hecho: «VIAJES ha cambiado el sábado 14 a día de excursión (Pompeya y Sorrento).» o «VIAJES ha cambiado el sábado 14 a un día en Roma.»;
  - y lo mismo con cualquier cambio grande que hace la app de golpe (cambiar las fechas, rehacer la ruta…): una línea con lo que ha decidido la persona, no la lista de sitios que se han movido por ello.
- Al tocarlo, que lleve a los días que han cambiado, con lo nuevo marcado (como «Movida», «Nueva» de la propuesta).

## 2b. «Recuperar», con su aviso de una línea
- Eric, como administrador, recuperó la ruta y al otro le llegó: «Eric ha cambiado el viaje: ha quitado un día, ha añadido un día, ha añadido la Fontana di Trevi al miércoles 11 y otros 5 sitios y ha cambiado las fechas». No se entiende.
- Que diga lo que ha hecho, en una línea:
  - «Recuperar mi ruta»: «Eric ha vuelto a la ruta inicial.»;
  - «Recuperar este día»: «Eric ha recuperado el sábado 14 como estaba.».
- **«Ha cambiado las fechas»:** las fechas eran las mismas (del 11 al 15 de noviembre). Mira por qué lo dice: si las fechas no cambian, nunca «ha cambiado las fechas».

## 3. Unirse a un viaje con el código, y abrirlo
- **Al unirse a un viaje** (con el enlace, con el código o desde el aviso de la invitación), **la app abre ese viaje directamente**. El que tenía abierto sigue en «Mis viajes», para volver a él cuando quiera.
- **Un hueco para escribir el código** (Eric, 26-oct: «es fundamental»): hoy solo se entra con el enlace. El administrador tiene el código: se lo dice a su amigo, el amigo lo escribe y entra en el viaje, sin enlace ni correo.
  - **El diseño:** `Piezas/Unirse Codigo` (01 la hoja con el código, 02 el código no vale, 03 ya dentro, con la franja «Te has unido al viaje a Roma de Eric · Ahora lo ves igual que él», 04 la primera pantalla). Exactamente igual.
  - **Dónde, en dos sitios que abren la misma hoja:** en la primera pantalla (`PrimeraPantalla.tsx`, el mapa del mundo con ORIGEN y DESTINO), debajo de esa caja, en pequeño y siempre visible: «¿Te han invitado? Únete con un código» (es donde llega el amigo que abre la app por primera vez); y en el perfil, en la hoja del [+] (apartado 4): «Unirme con un código».
  - **Cómo:** una hoja desde abajo con el hueco del código (letras grandes, sin distinguir mayúsculas, que no se pueda equivocar con espacios) y [Unirme]. Al unirse, se abre el viaje (punto de arriba), con la franja «Te has unido al viaje a Roma de Eric».
  - **Sin cuenta:** unirse pide cuenta de verdad (la 10N3 vio que `canjear_invitacion` no deja a las anónimas). Si no tiene, primero «Entra o crea tu cuenta para unirte» y, al entrar, se une solo con el código que ya escribió, sin volver a pedírselo.
  - **Si el código no vale:** «Ese código no es de ningún viaje. Revísalo con quien te lo ha pasado.»; si ya está en ese viaje, lo abre y ya.
  - Que no se puedan probar códigos sin fin: un límite de intentos seguidos.

## 4. El perfil, con otro orden (`Piezas/Perfil Orden` y `Piezas/Mis Viajes Tarjeta`)
- **Por qué:** hoy, para llegar a «Mis viajes» hay que bajar muchísimo (EXP, sorteo, vitrina, pasaporte), y es lo que más se usa. Hazlo **exactamente como en Design** (01 al abrirlo, 02 entero, 03 la hoja del [+], 04 lleno, con nivel 3 y varios viajes, 05 «Ver todos»).
- **El orden, de arriba abajo:**
  1. **una sola cabecera:** la foto en su moneda con el marco de nivel (del mismo tamaño que hoy), «Hola, {nombre}», «Nivel 1 · Soñador» y, debajo, la EXP en pequeño (la barra y «0 / 500 · Te faltan 500 para el nivel 2»); los ajustes, arriba a la derecha;
  2. **«Mis viajes», en fila para deslizar de lado,** con la siguiente tarjeta asomando; el en curso o el próximo, primero; «Ver todos (N)» a la derecha del título; los de antes de la app («Antes de la app · 3 países»), como una tarjeta más, al final. Cada tarjeta como en `Mis Viajes Tarjeta`: la portada, la etiqueta («Próximo», «En curso», «Ya hecho»), el nombre, las fechas y los días, **solo el icono de la foto** para cambiar la portada (sin texto) y el botón **«Abrir este viaje»** bien visible. Fuera la pastilla «Sin fotos»;
  3. **«Mi vitrina» y «Mi pasaporte»: no se tocan** (Eric, 26-oct). Igual que hoy, solo que van después de los viajes;
  4. **el billete del sorteo, abajo del todo.**
- **Fuera la palabra «PERFIL»** de arriba a la izquierda (Eric, 26-oct: no sirve para nada), también aunque salga en `Perfil Orden`. Arriba quedan solo los ajustes y la ✕.
- **El [+], flotante** (Eric, 26-oct: «así es como lo quiero»), abajo en medio, como en Design. Sustituye al botón flotante «Nuevo viaje» y al botón «Añadir un viaje que ya hiciste» del final. Al tocarlo, la hoja «¿Qué quieres hacer?» con tres tarjetas: «Crear un viaje nuevo · Elige destino y fechas», «Unirme con un código · El que te ha pasado quien organiza el viaje» (apartado 3) y «Añadir un viaje que ya hiciste · De antes de usar la app, para tu pasaporte» (lo de hoy). Que no tape la última tarjeta (el hueco al final, como en la 10N).
- **«Ver todos» (05):** la lista de todos los viajes, por grupos: en curso, próximos, ya hechos y antes de la app.
- **Los 70 px** entre el pasaporte y «Mis viajes» de la 10N3 ya no hacen falta: manda el orden nuevo.
- **Los datos de Design son de ejemplo** («Nivel 3 · Soñador», «3 países» en un perfil con 0…): los de verdad.
- Con los logros apagados (10N4), el mismo perfil sin la EXP, la vitrina ni el sorteo.
- **Que se abra al momento** (Eric, 26-oct): hoy, al tocar el perfil, tarda 2 o 3 segundos. Mira por qué (¿el código del perfil se baja al abrirlo, como dice `CuerpoConLogros`?, ¿espera a los datos del servidor?) y arréglalo: el código del perfil, ya bajado en cuanto la app está quieta; lo último que se vio del perfil, guardado en el móvil y enseñado al instante; y los datos nuevos, por detrás, cambiando solo lo que cambie (sin parpadeo ni el perfil vacío). Dime cuánto tardaba antes y cuánto tarda ahora, en un iPhone con 4G.

## 5. La película del pase
- **Todas las escenas, a todo el ancho:** la primera ya está estirada, pero las demás siguen como antes (más estrechas, con más margen arriba y los títulos iguales). Que todas sean como la primera, en un móvil de 390 de ancho con la barra de Safari.
- **Un título pequeño, en todas las escenas,** para que nadie se pierda (si no se lee la película, empieza la escena y nadie sabe de qué va): «Todo lo que incluye tu Pase Roma» (con el destino del pase), con la letra de `Piezas/Pase Pelicula`, pero **en la misma línea que [Saltar], centrado en medio** (en Design sale encima de las rayitas: Eric lo quiere al lado de [Saltar]).
- **Adaptada de verdad al teléfono, escena por escena** (Eric, 26-oct): en la cuarta escena (la de jugar, ganar y participar en el sorteo) el texto se pisa con lo de encima. Repasa **todas** las escenas en un iPhone de 390 de ancho con la barra de Safari (y en uno pequeño, de 375 × 667): **los márgenes iguales en todas** (como la primera escena ya estirada: pequeños a los lados, sin el hueco grande de arriba, y los textos de abajo separados del borde para que la barra de Safari no los tape), que ningún texto se pise, se corte ni quede tapado, que todo se lea entero y que nada se salga de la pantalla. Si en un móvil pequeño no cabe, que se ajuste (letra un poco más pequeña o la escena más compacta), nunca encima de otra cosa. Una captura de cada escena en los dos tamaños, en el REPASO.
- **Las rayitas de arriba** (una por escena): al tocar una, la película va a esa escena y la vuelve a poner desde el principio, como en las historias de Instagram.
- **La escena del pasaporte:** cuando los países empiezan a dar la vuelta al mundo, la escena se queda unos 7 segundos parada. Quita ese rato: que siga en cuanto acaba la vuelta.

## 6. RESERVAS: el botón [Guardar], solo «Guardar»
- Al añadir una reserva, el botón dice «Guardar» y, al lado, la fecha elegida. Que diga solo «Guardar»: la fecha ya está justo encima.

## 6b. Lo que pide el pase, con un solo estilo (`Piezas/Pase Estilo` 01)
- **El modelo es solo `Pase Estilo` 01** («Dentro de Alojamiento, sin pase»): una caja pequeña, en azul oscuro con dorado, con el título («¿En qué zona te alojas?»), una línea («Con el **Pase Roma**, adaptamos tu ruta a tu alojamiento.») y el botón dorado pequeño [🔒 Ver]. Pequeña a propósito: no agobia ni ocupa la pantalla (Eric, 26-oct). Nada de cajas grandes como las de `Pase Premium`.
- **Dónde:** en todos los sitios de la app (menos HOY) donde algo pide el pase, como hoy la caja del alojamiento en RESERVAS: con este mismo estilo. Búscalos todos y dímelo en el informe, con su captura.
- **Lo pequeño que está bloqueado por el pase** (botones, pastillas o filtros, como «Baños» y «Fuentes» en EXPLORAR): hoy salen en gris. Que salgan **en azul oscuro con el candado dorado**, con los mismos colores que la caja (sin texto largo: el nombre y el candado). Al tocarlos, lo mismo que hoy (lo que enseña el pase). Búscalos todos y ponlos en el informe.
- **Lo que no se toca:** HOY (ya tiene su diseño: no hagas caso a la 03 de `Pase Estilo`), la pastilla «Pase Roma» de RUTA y la pantalla del pase.
- **Los textos, verdad:** con la zona del alojamiento adaptamos el primer día y, como mucho, el último, no cada día. Busca en toda la app (RESERVAS, la película, la lista de lo que incluye, los textos de `roma.json`) cualquier frase que prometa que cada día empieza cerca del alojamiento («Cada día empieza cerca de donde duermes»…) y cámbiala por «Con el Pase Roma, adaptamos tu ruta a tu alojamiento.» (con el destino del pase). Ponlas en el informe con el antes y el después.

## 6c. El vuelo y el alojamiento de cada uno, en un viaje compartido (`Piezas/Reservas Cada Uno`)
- **Lo que decide Eric (26-oct):** hoy el vuelo y el alojamiento solo los pone el administrador, y los demás los ven en gris. Cambia:
  1. **Cada uno puede poner su vuelo y su alojamiento** (también quien solo recomienda: es suyo, no cambia la ruta de nadie).
  2. **Si el administrador pone uno para todos (o para algunos, con «¿Para quién es?»),** se cambia el de esas personas por el suyo, y a cada una le llega: «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.» (05).
  3. **Cada uno puede volver a poner el suyo cuando quiera** («Tengo otro vuelo · Pon el tuyo», «Me alojo en otro sitio · Pon el tuyo»): sale solo del «¿Para quién es?» del administrador, y al administrador le llega «Ana ha puesto su propio vuelo.» (05). No tiene que pedírselo a nadie.
  4. **La ruta sigue al vuelo y al alojamiento del administrador** (el primer y el último día, y la zona), como hoy. Lo de cada uno es para él: lo ve en su RESERVAS.
  5. **Las cuentas del grupo:** el vuelo y el alojamiento que pone el administrador se reparten entre las personas para las que es (para todos, entre todos; para dos, entre esos dos). **Los vuelos ahora también entran** (cambia lo de la 10N3: «los billetes, no»). Lo que pone cada uno para sí, es suyo y no se reparte. Si alguien pone el suyo, sale del reparto del administrador y las cuentas se ajustan solas. Que nada se cuente dos veces.
- **Las entradas que reserva cualquiera, también en las cuentas** (Eric, 26-oct): hoy solo cuentan las del administrador (`cuentasGrupo.ts`: «las entradas del dueño reservadas para varios»). Si Ana reserva el Coliseo para los cuatro, que cuente igual: lo ha pagado Ana y se reparte entre los de su «¿Para quién es?». Las que son solo para ella, no cuentan. Que nada se cuente dos veces (si ya hay un gasto igual, avísalo, como en la 10N3).
- **Las pantallas, exactamente como en Design:** 01 Ana con el vuelo de Eric («Lo ha puesto Eric · para todos»), 02 con el alojamiento de Eric («Lo ha puesto Eric · para Eric y para ti»; en la 01 sale «Eric · para Eric y para ti»: usa siempre «Lo ha puesto Eric · …»), 03 Ana con lo suyo («Tuyo» y [Cambiar]), 04 Eric con quién va en su vuelo («Tú, Laura y Marcos») y quién tiene otro («Ana tiene su propio vuelo»), 05 los avisos.
- Esto cambia lo de la 10N3 («RESERVAS de llegada y vuelta y el alojamiento, en gris» para quien no es administrador): ahora, lo suyo lo pone él; lo del administrador lo ve, sin tocarlo.
- Si hace falta migración, escríbela y dime cuál aplicar.

## 6d. «Añadir gasto», más limpio
- **Las preguntas, con otras palabras:** «¿Quién lo ha pagado?» pasa a **«¿Quién ha pagado?»**, y «¿Entre quién?» pasa a **«¿Para quién es?»** (la misma pregunta que en RESERVAS). Cámbialo en todos los sitios donde salgan (añadir y editar un gasto, las cuentas del grupo…).
- **Quién ha pagado, por defecto: quien añade el gasto, el primero de la lista y ya marcado** (Eric, 26-oct; hoy salen marcados todos). Los demás, detrás y sin marcar; se pueden marcar tocándolos (si pagaron a medias). Lo mismo al editar un gasto: se queda lo que ya tenía.
- **La línea de abajo, como está** («12,50 € cada uno»).
- **Con espacio entre los bloques** (regla del apartado 0): «¿Quién ha pagado?» y sus nombres, separados de lo de arriba y de lo de abajo; lo mismo «¿Para quién es?» y sus nombres.

## 6e. Los avisos eliminados, borrados de verdad a los 30 días
- Hoy (0046), «Eliminar» oculta el aviso y lo guarda para siempre. Que **los avisos ocultos se borren del todo a los 30 días** de eliminarlos (Eric, 26-oct), y que **los de más de un año** (leídos o no) también se borren solos.
- Que lo haga el servidor solo, una vez al día (con `pg_cron` en Supabase o con el servidor de la app: dime cuál y por qué). Si hace falta migración, escríbela y dime cuál aplicar.
- **Ojo:** al borrarlos, que no vuelvan a salir. Si la app usa el aviso guardado para no repetirlo (la «clave»), comprueba que, pasados 30 días, ya no se puede crear otra vez el mismo aviso (por ejemplo, «Mañana empieza tu viaje» de un viaje que ya pasó).
- [Deshacer] sigue funcionando como hoy (unos segundos después de eliminar).

## 7. La prueba
- La batería completa y `pruebaJutrip` (y la muestra de 60 fechas si has tocado el motor).
- Prueba nueva o añade a `pruebaTanda10N`: el Free Tour se añade desde EXPLORAR, su ficha y «+ Añadir parada», eligiendo el día; el día elegido pasa a ser `D1-FT` (y el que estaba ahí, al sitio que deja), con el Free Tour en su hora y su franja; [Deshacer]; un día con reserva o cosas a mano no se mueve sin avisar; quien solo recomienda, un solo cambio en su propuesta; los avisos de cambios con «ha movido» y «se han reorganizado N días», nunca «ha quitado» lo que solo se ha movido; el interruptor de excursión con su aviso de una línea. «Recuperar mi ruta» y «Recuperar este día» con su línea, y nunca «ha cambiado las fechas» si no han cambiado. Unirse con el enlace, con el código (con cuenta, sin cuenta, código que no vale, ya dentro, límite de intentos) y que se abra ese viaje. El perfil con el orden nuevo (la cabecera con la EXP, «Mis viajes» de lado con «Ver todos», la vitrina y el pasaporte igual, el sorteo abajo), el [+] flotante con sus tres tarjetas, y con los logros apagados; el perfil se abre al momento (lo que tardaba antes y ahora). La caja pequeña del pase (`Pase Estilo` 01) en todos los sitios que lo piden (menos HOY), lo pequeño bloqueado (como «Baños» y «Fuentes» en EXPLORAR) en azul oscuro con el candado dorado, y ningún texto que diga que cada día empieza cerca del alojamiento. El vuelo y el alojamiento de cada uno: el del administrador para todos o para algunos cambia el de esos, cada uno puede volver a poner el suyo, los dos avisos, la ruta con el del administrador y las cuentas (también los vuelos, y las entradas que reserva un invitado para varios, sin contar nada dos veces). La película del pase: ningún texto pisado ni cortado en ninguna escena (390 y 375 × 667), todas las escenas a todo el ancho y con el título pequeño al lado de [Saltar], tocar cada rayita, el pasaporte sin el rato parado. [Guardar] solo con «Guardar». Los avisos ocultos de más de 30 días y los de más de un año se borran solos, sin que vuelvan a salir. Los candados sin pintar hasta saber si hay pase, y repintados solos. Los tres colores en RESERVAS, Free Tour y excursiones. Los nombres con la primera en mayúscula en todos los sitios («Viajes»). «Añadir gasto» con «¿Quién ha pagado?» y «¿Para quién es?», quien lo añade, primero y marcado por defecto en «¿Quién ha pagado?» (y los demás sin marcar), y espacio entre los bloques.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N5.html`, a tamaño de móvil.

## 8. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N5».

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N5.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
