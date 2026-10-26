Hola. TANDA 10N3: LO QUE QUEDÓ A MEDIAS DE LA 10N, y las respuestas de Eric a tus dudas. La 10N2 ya está: esta va justo después. No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N3.md e inclúyelo en tu commit.
- Eric ha aplicado en Supabase la 0032 (otra vez) y de la 0033 a la 0040 (dime si alguna da error al probar). Con eso, comprueba de verdad, contra Supabase, lo que en la 10N solo se probó con PGlite: el código de invitación que se repite, los permisos, quitar y salir, los avisos de la campana (permiso, propuesta, gastos, «ya no formas parte»…) y el directo (Realtime).

## 1. «Puede editar», también en la pantalla
- Hoy `useModoInvitado.soloVer` sigue tratando a quien puede editar como invitado: en la pantalla no puede editar, aunque la base de datos ya le deja. Que, para él, la ruta funcione como para el administrador (DÍAS, EXPLORAR, añadir, mover, quitar, las rayitas de los días), sin lápiz ni propuesta; y que acepte o rechace propuestas y gastos desde la campana.
- Lo que no puede hacer, oculto o en gris en la pantalla: el botón de las fechas, RESERVAS de llegada y vuelta y el alojamiento (en gris, como el invitado), invitar, quitar, cambiar permisos y borrar el viaje.

## 2. Tus dudas, respondidas
1. **Los menús de tres puntitos:** la hoja clara está bien.
2. **Los nombres en los avisos:** con artículo cuando lo tengamos («ha añadido la Fontana di Trevi al sábado 28»): usa el `shortName` o un dato nuevo con el artículo de cada sitio en `roma.json` (rellénalo para los sitios de Roma). Si un sitio no lo tiene, sin artículo.
3. **Al quitar a alguien:** sus propuestas enviadas que nadie ha decidido todavía, se borran; las ya decididas, se quedan. Su propuesta sin enviar, que se borre de su móvil la próxima vez que abra la app (ya no ve el viaje).
4. **«Mover a» y el Arco de Constantino:** vale donde menos desvío haya, siempre que no quede en medio de una visita larga.
5. **El Free Tour del invitado:** Eric lo prueba con su viaje como invitado y te dice. Mientras tanto, déjalo como está.
6. **La ✕ para quitar un gasto:** sí, se queda.
7. **El alojamiento del invitado:** no hace falta que le mande la idea al dueño. Quita «mandarle la idea»: el invitado ve [Buscar alojamiento] para mirar, y ya.
8. **[Proponer el cambio]:** sí, en el aviso «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26»: un cambio más de su propuesta (mover el Coliseo al viernes 27). Para quien puede editar, [Moverlo al viernes 27] directo.

## 2b. Las dudas de la 10N2, respondidas
1. **El alojamiento y el coche entran solos en las cuentas:** el precio que el administrador pone en RESERVAS cuenta como pagado por él y repartido entre todos los del viaje (con «¿Entre quién?» para cambiarlo, como un gasto más). **Los billetes de avión, no** (cada uno paga el suyo). Que no se cuente nada dos veces: si ya hay un gasto [Para todos] igual, avísalo.
2. **«Deshacer» bajo «✓ Pagado»:** sí, se queda.
3. **El administrador lo puede tocar todo en las cuentas:** marcar un pago como hecho y deshacerlo, y editar cualquier gasto del grupo (quién lo pagó, entre quién y el importe), también los de quien ya salió del viaje.

## 3. Lo demás que quedó a medias
- **El «por persona» con «¿Para quién es?»:** una reserva para 2 de 4 cuenta solo entre esos 2 (no entre todo el grupo).
- **Los avisos de las entradas del dueño** («Eric ha reservado el Coliseo para ti…» y el de los no incluidos): que los cree el servidor y lleguen a la campana como los demás (también con la app cerrada), no solo calculados en el móvil.
- **Lo que compra el invitado**, guardado en su cuenta con la 0038 (que viaje entre sus móviles).
- **La línea «Eric ha cambiado el viaje.» y la propuesta a medias marcada** cuando el dueño quita lo que el invitado había propuesto: enchufado (dejaste el evento y el almacén listos).
- **El lápiz y la última parada:** comprueba en un móvil de 390 de ancho, con un día largo, que no tapa nada.

## 3b. Pequeños arreglos (Eric, 26-oct, en su iPhone)
1. **La película de la apertura** (la de «Tú decides el viaje. Nosotros lo ordenamos.», con el mapa de las paradas y [Saltar]):
   - **más grande:** el mapa y las tarjetas de las paradas, casi a todo el ancho de la pantalla, con un margen a los lados pequeño (hoy queda mucho hueco a cada lado); que se adapte al ancho de cada móvil, sin deformarse;
   - **los textos de abajo, un poco más arriba:** con una separación clara del último elemento de la película (la última tarjeta), pero sin pegarse al borde de abajo, que en el iPhone queda tapado por la barra del navegador y se corta. Que se vean enteros en un móvil de 390 de ancho con la barra de Safari;
   - lo mismo en todas las escenas de esa película.
2. **El perfil viejo se cuela al abrir el perfil.** Antes del nuevo (EXP, billete del sorteo, vitrina, pasaporte) sale un momento el de antes: el mapa grande con «1 país · 1 lugar · 3 días» y «Mis viajes» con «Abierto». Que no salga nunca: mientras llegan los datos, el perfil nuevo vacío (los huecos de cada tarjeta en gris claro, o nada), y luego el nuevo con sus datos. Quita el perfil viejo del código si ya no se usa en ningún sitio.
3. **La tarjeta de «Mi pasaporte»: la esquina de la hoja, a la derecha, sale en blanco.** Esa esquina simula la página del pasaporte asomando: que lleve **dos sellos estampados**, como en el diseño de Design (P1: los sellos redondo y cuadrado de Roma, en azul y verde), para que la tarjeta tenga su diseño desde el primer día. Si el viajero aún no tiene sellos, dos sellos de muestra (de decoración); cuando tenga los suyos, salen los dos últimos que ha ganado. El círculo del mapa se va pintando con lo que de verdad ha visitado, en cuanto lo visita.
4. **La foto del perfil dentro del emblema** (el círculo con el marco del nivel, arriba a la izquierda): hoy se ve cortada (la cara de Eric no cabe). Que, al tocarla, se pueda **ajustar la foto al círculo**: moverla con el dedo y acercarla o alejarla con dos dedos, con [Guardar]; y también cambiarla por otra. Lo ajustado se guarda en la cuenta y se ve igual en todos los sitios donde sale la foto (el emblema del perfil, la cabecera, «Personas del viaje»…).
5. **«Mis viajes», más separado de «Mi pasaporte»:** unos 70 px de margen entre la tarjeta del pasaporte y el título «Mis viajes», para que se vea bien que empieza otro bloque.
6. **La foto de portada de cada viaje en «Mis viajes»** (hoy, un degradado gris):
   - **por defecto, una foto bonita del destino** (Roma, una de Roma; París, una de París), de las que ya tenemos con licencia libre y su crédito; la misma del destino para todos los viajes a ese sitio;
   - **el viajero la puede cambiar:** al tocar la tarjeta, «Cambiar portada», con dos opciones: una de **sus fotos del viaje** (las de sus paradas) o una de su galería; y volver a la del destino;
   - **al acabar el viaje,** si tiene fotos suyas y no ha elegido portada, que salga sola la primera de sus fotos (y la puede cambiar).
7. **Fuera la etiqueta «Abierto»** de la tarjeta del viaje en «Mis viajes»: encima ya pone «Próximo», «En curso» o «Ya hechos», y no se entiende. Dime qué quería decir.

## 4. La prueba
- La batería rápida y `pruebaJutrip`. Si algo falla solo al correr con las demás y solo pasa, dilo y sigue.
- Añade a `pruebaTanda10N`: «Puede editar» edita en la pantalla y no ve fechas, vuelo, alojamiento ni personas; los avisos con artículo; quitar a alguien borra sus propuestas sin decidir; [Proponer el cambio] y [Moverlo al viernes 27]; el «por persona» con «¿Para quién es?»; los avisos de entradas desde el servidor.
- Y contra Supabase real, con dos cuentas: invitar, cambiar un permiso, quitar, un gasto [Para todos] aceptado y uno rechazado, una propuesta aceptada, y el directo con dos navegadores abiertos.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N3.html`, a tamaño de móvil (también cada escena de la película de la apertura, a 390 de ancho con la barra de Safari; el perfil al abrirse, sin el viejo; el pasaporte sin sellos con los dos de muestra; la foto ajustada en el emblema; y «Mis viajes» con la portada del destino y con una del viajero).

## 5. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N3».

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta: administrador, puede editar o solo recomendar) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N3.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
