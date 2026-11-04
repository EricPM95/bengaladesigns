Hola. TANDA LZ3: LOS LOGROS DE LANZAROTE Y EL BOTÓN «REORGANIZAR» (4-nov). Va DESPUÉS de la LZ2b-1: si estás con ella, acábala primero (con su push). Si te da tiempo antes del sábado 7, mejor (Eric los quiere probar en su viaje, que empieza el domingo 8); si no, después. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Como siempre:** Roma no cambia (sus logros, igual; muestra de 60 fechas idéntica y `pruebaJutrip` en 0) y Lanzarote sigue oculto, solo para el administrador.
- **Para no agotar el límite de uso:** 2 agentes como mucho, 1 Chrome y un servidor. Nota de estado (`_estado_lz3.md`) a la rama `estado` cada 30 minutos y al acabar cada apartado. No apagues el PC.
- **Design:** el mismo zip de la LZ2b-1 (`docs/diseno/proyecto/`, ya puesto al día). **Manda `Dashboard.dc.html` con Lanzarote elegido** (el sello, las 7 colecciones y los 11 emblemas) y `Piezas/Insignia Lanza Pro.dc.html` con `assets/lanza/col1.png` a `col7.png`. NO uses `Imprescindibles Lanza Pruebas` (las propuestas A, B y C): Eric se queda con lo del Dashboard. El diseño, exactamente igual; los textos y los datos, los de `docs/destinos/lanzarote/LANZAROTE_LOGROS.md`.

## 1. Los datos
- **`data/logros/lanzarote.json`**, con la misma forma que `data/logros/roma.json`, sacado de `LANZAROTE_LOGROS.md`:
  - **el sello de Lanzarote** sobre la colección de los imprescindibles (7 sitios): bronce desde 1 («Primeros pasos en Lanzarote»), plata desde 3 («Lanzarote te atrapa»), oro desde 5 («Tierra de volcanes») y diamante con los 7 («Lanzarote es tuya»), con sus líneas;
  - **las 7 colecciones** con sus grupos, sus sitios (con los ids de `lanzarote.json`) y su frase al completarlas;
  - **los 11 emblemas** (9 de sitio y 2 de momento) con su nombre y su línea, tal cual (los datos están comprobados);
  - **los textos con «Lanzarote»** («Lanzarote esconde {total} secretos», el resumen del viaje…);
  - **sin «patrimonios»:** Lanzarote no es Patrimonio de la Humanidad.
- **Los sitios que no son parada** (La Graciosa, por ejemplo): dime cómo se gana su emblema; como en Roma con los sitios que no son parada, si lo hay.
- `DESTINOS_CON_LOGROS` (`server/logros/datos.js`) con Lanzarote, solo para el administrador mientras Lanzarote esté oculto.

## 2. Los dibujos (como Design)
- **El sello:** la medalla de «Lanzarote» del Dashboard, con sus 5 estados (por conseguir en gris, bronce, plata, oro y diamante).
- **Las 7 colecciones:** la pieza `Insignia Lanza Pro`.
  - **Cada gajo de la imagen es un sitio:** gajo ganado en color, gajo que falta en gris, y completa toda en color, igual que en Roma.
  - **Asigna cada gajo al sitio que mejor encaja con su dibujo** (por ejemplo, el del cactus al Jardín de Cactus). Si no hay dibujo que encaje, sigue el orden de los sitios.
  - **En el informe, la tabla gajo → sitio** de cada colección, para que yo la revise.
  - **El mismo brillo y movimiento** que las insignias de Roma cuando van animadas.
  - **Hazla para cualquier destino, no solo para Lanzarote:** que valga para cualquier imagen partida en gajos. Eric cambiará después las insignias de Roma por imágenes pintadas como estas, y usarán la misma pieza.
- **Los 11 emblemas:** los del Dashboard de Lanzarote, **cada uno con su movimiento**, como los 14 de Roma (cómo se ven ganados, sin ganar con «?» y en pequeño).

## 3. Cómo se ganan: igual que en Roma
- **El mismo camino que en Roma:**
  - al estar en el sitio se gana su emblema y su gajo;
  - el dibujo vuela al botón de los logros;
  - la hoja de logros, la vitrina, el pasaporte, «Mis viajes» y el resumen del viaje.
  - Nada nuevo de pantallas: solo meter Lanzarote.
- **Madrugador:** con la misma regla de hora que en Roma.
- **Atardecer atlántico** (en lugar de «Nocturno», que en Lanzarote no hay):
  - en una parada de la costa oeste (El Golfo, Los Hervideros, Salinas de Janubio, Montaña Bermeja, Caleta de Famara o el Faro de Pechiguera);
  - desde una hora antes de la puesta de sol hasta un cuarto de hora después;
  - con la hora de Canarias y el atardecer de `sunset.js`.
- **Si un emblema de Roma tiene una escena propia al ganarlo,** en Lanzarote usa el emblema en grande con su movimiento (sin escena nueva) y dímelo.

## 3b. De toda la app (Eric, 4-nov): el botón «Reorganizar»
- **«Ahora no» ya NO esconde el botón redondo de Reorganizar:** se queda visible hasta que el viajero reorganice, o hasta que el día deje de necesitarlo (por ejemplo, si quita la parada que lo hizo salir). Así funciona igual que el aviso de los vuelos, donde «Ahora no» ya deja el botón.
- Es para todos los destinos. Pon al día `docs/REGLAS_DE_LA_APP.md` («antes → ahora → decisión de Eric») y las pruebas que miraban que se escondía.

## 4. La prueba
- Muestra de 60 fechas de Roma idéntica. `pruebaJutrip` y las pruebas de logros de Roma en 0, más las de lo tocado.
- **Prueba nueva `pruebaTandaLZ3`**, que compruebe:
  - el sello con sus grados;
  - las 7 colecciones con sus sitios (todos son ids de `lanzarote.json`);
  - los 11 emblemas con su movimiento;
  - ganar un sitio colorea su gajo y su emblema;
  - Atardecer atlántico solo en la costa oeste y a su hora;
  - ningún texto de Roma en los logros de Lanzarote;
  - Lanzarote oculto para quien no es administrador;
  - en Roma y en Lanzarote, después de «Ahora no» el botón de Reorganizar sigue visible.
- **En el REPASO, capturas de móvil:** la hoja de logros de Lanzarote (a medias y completa), una colección con 3 gajos, los emblemas ganados y sin ganar, y el sello en sus grados. Y tu lista de comprobación DE ESTA TANDA, como siempre.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
