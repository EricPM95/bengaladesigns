Hola. Nueva tanda: TANDA 8B2, LOS ARREGLOS DE LA 8B. Eric y Claude han revisado tus capturas: ha quedado muy bien, pero hay cosas que cambiar y cosas que faltan. Todo sigue detrás de los mismos interruptores. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8B.md y el apartado 37 de docs/dias/APUNTES_TRAS_TANDA7.md.
- Los diseños siguen en `docs/diseno/proyecto/`. Los dibujos, como en **Logros · Modelos**; cómo aparece cada cosa, como en **Logros · Momentos**.
- Claude ha actualizado APUNTES_TRAS_TANDA7.md y ORDEN_PARA_CODE.md y ha dejado este prompt. Inclúyelos en tu commit tal cual.

## 1. El orden de las sorpresas, siempre este (Eric)
1. **los pedazos nuevos, todos en una sola pantalla:** cada insignia con su pedazo encendiéndose;
2. **cada colección completada,** una pantalla por colección;
3. **el Emblema Oculto;**
4. **el sello, si sube;**
5. **«Y además…»:** país nuevo, destino nuevo, Patrimonio, logros de viajero…;
6. **el resumen del día.**

- **Excepción, las maravillas del mundo:** después de su emblema (en Roma, la película del Coliseo), una pantalla entera con **la medalla de las 7 maravillas encendiendo su pedazo**, «Tu primera maravilla · 1 de 7» y [Seguir]. Es la misma animación que ya hiciste para «La Gran Muralla · 2 de 7». No va como tarjetita dentro de «Y además…».
- **El orden, en un solo sitio:** en el servidor (`ajustes.json › orden_momentos`). Quita el reordenado del móvil (`plan.ts`), para que nunca se descuadren.
- **Fuera el texto «Una foto, 3 colecciones».**

## 2. Cada cosa con su dibujo de verdad
- **El pedazo nuevo** (ahora sale «Nuevo pedazo · Fontana de Trevi» con un hexágono dorado y un ✓, que parece un emblema): tiene que salir la insignia de su colección con el pedazo de ese sitio encendiéndose, como en Logros · Modelos y en la pantalla del pedazo de Logros · Momentos.
- **Lo mismo en las tarjetas pequeñas** («Y además…», los avisos de lo ganado y donde salga algo ganado en pequeño): siempre el dibujo de verdad de Modelos.
  - Un pedazo, con su insignia.
  - El Coliseo, con su emblema de maravilla, el que hicimos.
  - Una maravilla, con la medalla de las 7 maravillas.
  - Nunca un icono genérico.
- **Las 11 escenas de los emblemas** (Panteón, Trevi, Foro, Museos, Plaza de San Pedro, Basílica, Boca de la Verdad, Cerradura, Catacumbas, Madrugador y Nocturno): como las de Design en Logros · Momentos, no más sencillas. Si alguna no se puede hacer igual, dime cuál y por qué.

## 3. El Visto y las fotos, sobre HOY v2
- En tus capturas V2, V3 y V7, las hojas salen encima del HOY de antes (la tarjeta oscura con «Siguiente parada»). Tienen que salir sobre **HOY v2** (la foto grande, [Visto] en verde…) y sobre DÍAS. Si el HOY de antes sigue apareciendo con `?hoy2=on`, quítalo de ese camino.
- **La hoja del pedazo ganado con la ubicación (V2):** que diga claro que el pedazo ya es suyo: «Tu pedazo ya es tuyo. La foto es para tu álbum.»
- **V3 (sin ubicación):** la parada es el Panteón y el texto dice «Con la foto de hoy en Plaza Navona». Cada texto, con el nombre de su sitio. Revisa todos los textos que llevan nombre de sitio.

## 4. HOY v2: arreglos de Eric
- **Los avisos del día** («Castillo de Sant'Angelo cierra hoy a las 19:30»): con una cruz para cerrarlos. Cerrado, no vuelve a salir ese día.
- **Fuera «Tu ruta empieza en…».**
- **Fuera la etiqueta «Saltada»** al tocar [No me da tiempo]: la parada ya sale tachada y con [Recuperar].
- **El mapa pequeño dentro de la foto:** la chincheta está bien, pero está tan cerca que solo se ven calles sin nombre. Aléjalo un poco, para que se vea algo reconocible alrededor (un nombre, una plaza, el río). El aviso del mapa (© Mapbox © OpenStreetMap) tapa casi un tercio: ponlo en pequeño, con la «i» que deja Mapbox. Quitarlo no se puede.
- **El título del día de llegada:** el de la zona («Centro histórico»), como en el diseño, no «Madrid → Roma».
- **Desmarcar desde el menú «···»** de la parada en DÍAS (lo que dejaste sin hacer).
- **El HOY de después del viaje:** con la pieza del resumen del viaje de Logros · Momentos (la de ahora), no la de antes.

## 5. Fotos y fechas
- **La foto de Piazza Navona es la de la Fontana de Trevi** (se ve en las capturas 3 y 3b). Pon la suya. Mira en los datos qué foto tiene cada sitio y dime en el informe si hay más fotos repetidas o cambiadas, por ejemplo la misma foto en dos sitios distintos.
- **Las fechas del modo de pruebas:** en la 1a, arriba pone «17 – 20 oct» y en la tarjeta «17 – 19 oct». Que todo el modo de pruebas use las mismas fechas.

## 6. Lo que no va en esta tanda
- La película de «El final de las 7 maravillas»: para más adelante (solo sale con la séptima maravilla, y hoy nadie puede llegar). Déjala anotada.

## 7. La prueba
- No toca el motor: la batería rápida.
- Las pruebas de pantallas que hiciste en la 8b, ampliadas con lo de arriba (el orden nuevo, el pedazo con su insignia, la medalla 1 de 7 del Coliseo, los avisos con cruz).
- **Capturas nuevas** en `docs/dias/capturas_8b/`, sustituyendo las de antes:
  - las que faltaban: V4 (lejos) y V5 (la hoja del Emblema Oculto). Las de antes eran copias de la 8 y la 4;
  - todas las que cambien con esta tanda;
  - **las animaciones paso a paso:** de cada animación, varias capturas (el principio, la mitad y el final), con el nombre y el paso (por ejemplo `C0-coliseo-1.jpg`, `C0-coliseo-2.jpg`…).
  - **Eric quiere ver entera la serie del Coliseo:** desde que toca [Visto] y hace la foto hasta el resumen del día. La película paso a paso, la medalla de las 7 maravillas encendiendo el pedazo del Coliseo y lo que venga después, en orden.
  - Lo mismo para una serie con varios pedazos, una colección completada y el sello que sube.
- Comprueba que no hay errores en la consola.

## 8. El informe (docs/dias/INFORME_TANDA8B2.md)
En español sencillo:
- qué has cambiado;
- las fotos que estaban mal o repetidas;
- las escenas que no hayan podido quedar igual que en Design, y por qué;
- la lista de capturas nuevas;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
