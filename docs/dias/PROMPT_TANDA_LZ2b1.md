Hola. TANDA LZ2b-1: LANZAROTE, LO QUE FALTA PARA USARLA EN EL VIAJE (4-nov). Va después de la LZ2a (ya subida). Eric se va el DOMINGO 8-nov: tiene que estar subida el SÁBADO 7 por la mañana como tarde. Si no llega todo, sube lo que funcione (en 0 fallos) en el orden de abajo y dime lo que falta. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Antes de empezar:** comprueba que Eric ha dejado `FICHAS_LANZAROTE.json` en `docs/destinos/lanzarote/`. Si no está, dímelo y para.
- **Como siempre:** Roma no cambia (muestra de 60 fechas idéntica y `pruebaJutrip` en 0) y Lanzarote sigue oculto, solo para el administrador.
- **Para no agotar el límite de uso:** 2 agentes como mucho, 1 Chrome y un servidor. Lee solo lo que necesites de cada documento.
- **Nota de estado** (`_estado_lz2b1.md`) a la rama `estado` cada 30 minutos y al acabar cada apartado. No apagues el PC.
- **Si Eric te pasa cosas que encuentre en el móvil durante la tanda,** van también en esta.
- **Design:** el zip más nuevo (`Trazo_App__diseño_de_rutas_personalizadas__8__1.zip`) en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` (sin `uploads/` ni `Archivo/`). De `Piezas/Coche Lanza` valen la **01** (Dónde aparcar), la **02** (trayecto en coche) y la **06a/06b** (el coche en RESERVAS). La 03, la 04a, la 04b y la 05 ya NO (Eric quitó la pregunta del coche). El diseño, exactamente igual; los textos y los datos, los nuestros. Los logros de Lanzarote van en otra tanda.

## 1. Las fichas de los sitios (lo primero)
- **Mete `FICHAS_LANZAROTE.json` en los datos, igual que en Roma** (34 sitios, con los ids de `lanzarote.json`):
  - `por_que_recomendamos` y `description` van en `lanzarote.json`;
  - `what_to_see` («Qué vas a ver») y `tips` van en el detalle (`data/pipeline_v2/detalle/lanzarote/`, como `detalle/roma/`).
  - No cambies los textos. Si alguno no cabe o no encaja, dímelo.
- **«Dónde aparcar» en lugar de «Cómo llegar»** en la ficha de Lanzarote:
  - el texto de `aparcar` y el botón [Abrir en Maps], que lleva a la coordenada de la parada (su aparcamiento);
  - como Design (`Coche Lanza` 01), sin líneas de transporte;
  - `aparcar_verificar: true` NO se enseña al viajero: es para que Eric lo compruebe en su viaje.
- **Las 12 historias de `HISTORIAS_LANZAROTE.md`, en el campo `historia` del detalle, como en Roma** (Timanfaya, Jameos, Cueva, Mirador del Río, Fundación, Cactus, La Geria, El Golfo, Teguise, Haría, Campesino y La Graciosa). Solo el texto de la historia: sin las líneas «> Comprobar:» ni la parte de dudas y fuentes del final. Los audios se crean después, con los de Roma, con `crearAudiosHistorias.mjs --destino=lanzarote`: ahora NO (gasta créditos). Pasa solo `--simular` y dime cuántos caracteres serían.

## 1b. Los aparcamientos de verdad
- En `FICHAS_LANZAROTE.json` hay 27 sitios con `aparcar_verificar: true`: su aparcamiento no está comprobado. Compruébalos con datos reales:
  - **Google Maps en Chrome** (solo mirar, sin entrar con ninguna cuenta): busca «aparcamiento <sitio>», mira la vista de satélite y apunta dónde está el aparcamiento de verdad, si es gratis o de pago y si es grande o pequeño;
  - **los 147 aparcamientos de OpenStreetMap** de la LZ1 (a menos de 300 m) y Mapbox, si te ayudan.
- Con eso:
  - pon la **coordenada de la parada en el aparcamiento real**;
  - **reescribe el texto de `aparcar`** con lo comprobado, corto y con el mismo estilo (por ejemplo: «Aparcamiento gratis junto a la entrada, grande»);
  - cambia `aparcar_verificar` a false;
  - **rehaz con Mapbox los tiempos en coche** de las paradas que cambien de sitio y mira que los días sigan cabiendo.
- Haz lo mismo con las **12 coordenadas aproximadas de la LZ1**.
- **Si no hay aparcamiento** (solo el arcén), dilo tal cual.
- **En el informe, una tabla:** sitio, aparcamiento encontrado, gratis o de pago, de dónde sale el dato y el texto nuevo. Yo reviso los textos.

## 1c. Dos cambios de Eric (4-nov)
- **Timanfaya abre a las 9:00 todos los días** (horario desde el 1-jul-2023, 9:00-16:00; lo confirma Eric). Quita la duda de las 9:30. Primer turno 9:00, último 15:45 (web oficial), cierre 16:00.
- **Fuera la pregunta «¿Vas a moverte en coche?» del formulario: en Lanzarote se da por hecho que hay coche.** La ruta, siempre la misma (paradas y trayectos «En coche · 22 min · 17 km» con [Abrir en Maps]). Fuera también el aviso «sin coche» y la línea «¿Sin coche?» de arriba de cada día.
  - **En RESERVAS, el bloque del coche, con un interruptor «Coche de alquiler | Mi coche»**, como Design (`Coche Lanza` 06a y 06b). Por defecto, «Coche de alquiler».
  - **«Mi coche»:** el bloque sale como «Listo», sin nada que rellenar. El día 1, el rato de recoger el coche baja a 20 min.
  - **«Coche de alquiler»:** el bloque se rellena como el vuelo o el alojamiento (empresa, recogida y devolución, precio, documento), con el botón para reservar con nuestro enlace de alquiler de coches (el que ya usa la app, `vehicleRentalLinks.ts`). El día 1, de 30 a 45 min para recogerlo.
  - **Dentro del bloque, una línea pequeña:** «¿No vas a conducir? Mira las excursiones con recogida en tu hotel», que abre EXPLORAR › Excursiones.
  - Lo que guardaste en `answers.coche` en la LZ2a pasa a salir de este interruptor.

## 2. HOY: NO se toca en esta tanda
- HOY se hará entero en otra tanda (Eric, 4-nov). Aquí, nada de HOY.
- **Gratis y pase en la ficha:** «Dónde aparcar» es gratis, como «Cómo llegar» en la ficha de Roma.

## 3. «Cerca de ti» en Lanzarote
- **Gasolineras y aparcamientos** en lugar de baños y fuentes, con los datos que ya montaste en la LZ1. «Dónde comer» sigue como en Roma.
- Siempre del pase. Con el aviso: «Pocas gasolineras en el norte (Haría y Arrieta): llena el depósito antes de subir».

## 4. EXPLORAR en Lanzarote
- **Las categorías de `LANZAROTE_EXPLORAR_Y_PASE.md`** (Volcanes, César Manrique, Playas y charcos, Miradores, Pueblos, Bodegas, Excursiones), con los sitios de cada una. Un sitio puede estar en dos categorías.
- **Desde aquí el viajero añade los opcionales que el motor quitó,** con el aviso de siempre («posiblemente ya esté cerrado»).
- **El Charco del Palo:** solo en EXPLORAR, con el aviso «Zona nudista».
- **El Museo Atlántico:** como actividad (se visita buceando), no como parada.

## 5. Lo que salía mal o con Roma
- **Las paradas con el mismo nombre** (Haría y su Casa-Museo, Playa Blanca y el Faro, Caleta de Famara):
  - dime qué pasa;
  - arréglalo para que cada parada tenga su nombre y, si comparten aparcamiento, «A pie · X min» entre ellas, sin coche.
- **Ningún texto de Roma en un viaje a Lanzarote:** el menú del día (DayMenu), los ejemplos en gris de los campos y HoySinPase.
- **La Lista del pase de Lanzarote:** la de `LANZAROTE_EXPLORAR_Y_PASE.md` («La lista del pase de Lanzarote»). Lo que aún no existe (el aviso de nubes y viento, los logros), fuera de la lista.
- **La hoja de llegada y vuelta por ACE con un vuelo puesto:** mírala en pantalla y arregla lo que no esté bien.

## 6. Lo que NO toca ahora
- Las variantes que dejaste sin aplicar en la LZ2a (día 4 en invierno, veranos, La Graciosa con Caletón Blanco): se quedan así hasta después del viaje.
- HOY entero (con «Hoy vuelves a casa»), los audios de las historias, fechas especiales, «el orden al revés» y el aviso de nubes y viento: más adelante.

## 7. La prueba
- Muestra de 60 fechas de Roma idéntica. `pruebaJutrip` y `pruebaTandaLZ2a` en 0, más las pruebas de lo tocado.
- **Prueba nueva `pruebaTandaLZ2b1`**, que compruebe:
  - los 34 sitios con su `por_que_recomendamos`, `description`, `what_to_see`, `tips` y `aparcar`, y ninguno con `aparcar_verificar: true` sin explicar;
  - las 12 historias en su ficha, sin líneas «Comprobar»;
  - «Dónde aparcar» en la ficha y nunca líneas de transporte;
  - «Cerca de ti» con gasolineras y aparcamientos;
  - EXPLORAR con las 7 categorías;
  - sin la pregunta del coche en el formulario; con «Coche de alquiler» y con «Mi coche», la misma ruta y los mismos trayectos;
  - ninguna parada repetida con el mismo nombre;
  - ningún texto con «Roma», «Pompeya», «Florencia», «Ciampino» ni «Vaticano» en un viaje a Lanzarote.
- **En el REPASO, capturas de móvil:** la ficha de Teguise, «Cerca de ti», EXPLORAR, el coche en RESERVAS y la hoja de llegada con un vuelo.
- **Tu lista de comprobación DE ESTA TANDA,** como siempre.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
