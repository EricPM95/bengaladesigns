# Informe: Tanda 8B4, las fotos de Unsplash y los últimos arreglos de la 8B

17-oct-2026. Todo sigue detrás de los mismos interruptores. **El motor de rutas no se ha tocado** (solo se ha usado: el viaje de pruebas lo genera él). No hay migraciones nuevas. Incluyo, tal cual, `docs/dias/PROMPT_TANDA8B4.md` y `docs/dias/MENSAJE_DESIGN_MARAVILLAS_17OCT.md`.

## Qué he cambiado

### 1. El Patrimonio del Coliseo
**Por qué no salía:** no era el servidor, eran mis datos de prueba. Al rehacer la serie del Coliseo en la 8B3 (cuando quité el «país número 2: Vaticano» que sobraba) el modo de pruebas se quedó **sin el Patrimonio y sin la maravilla** en el primer Visto del Coliseo. El servidor los da bien desde siempre: ahora lo comprueba `pruebaLogros1` (el primer Visto en el Coliseo da «Centro histórico de Roma», una sola vez, y la maravilla va con «Y además…», antes del Patrimonio). El Patrimonio **no** estaba ya ganado en el viaje de pruebas (el viaje es nuevo cada vez). Arreglado: el modo de pruebas (serie del Coliseo y primer Visto en el Coliseo) lleva el Patrimonio y la maravilla igual que el servidor.

### 2. Los artículos delante del nombre del sitio
- Los artículos están **en los datos**: `data/logros/articulos.json` (el artículo de cada uno de los 94 sitios de Roma: `el`, `la`, `los`, `las` o vacío). Una función pura (`shared/logros/articulos.js`) pone «en el Coliseo», «del Coliseo», «en la Basílica de San Pedro», «en los Museos Vaticanos…», pero «en Trastevere», «en Piazza Navona» (sin artículo). Un nombre que no está en la tabla sale **sin** artículo (es mejor «en Foo» que «en el Foo» mal puesto). Sirve igual en el móvil y en el servidor.
- Revisados todos los textos de logros que llevan nombre de sitio: las hojas del Visto («Parece que no estás en el Panteón», «Sube una foto en el Coliseo y descúbrelo», «Con la foto de hoy en Piazza Navona…», «Guarda un recuerdo de la Fontana de Trevi»), la foto de otro sitio («Esta foto no es del Panteón»), las etiquetas de la cámara y la galería, y los dos mensajes del servidor (`ajustes.json`: `{en_sitio}` y `{de_sitio}`).
- No toca otros textos de la app que no son de logros.
- Prueba nueva: todos los sitios de Roma tienen su artículo en los datos (si se añade un sitio nuevo y se olvida, falla), y los ejemplos de arriba.

### 3. Sin cuenta atrás durante el viaje
La causa: el plazo («Te quedan N días…») leía la **fecha real del aparato** (o la que dejó una prueba anterior con `__demo.hoy`), no el «hoy» simulado del viaje de pruebas. En A2, con el aparato en otra fecha, salía «Te quedan 9 días» en pleno viaje. Ahora vale el «hoy» simulado de la app (`dev_simulated_today_iso`) y `__rutaPrueba()` borra cualquier «hoy» fingido que quedara. Prueba nueva: durante el viaje (17 y 20 de octubre) no hay cuenta atrás; después sí («Te quedan 9 días para reclamar tu premio» el 10 de noviembre).

### 4. El viaje de pruebas, con la ruta del motor
`window.__rutaPrueba()` ahora llama a la misma generación que hace la app al terminar el formulario (`runGeneration` → el motor) para **Roma, del 17 al 20 de octubre de 2026**, y **no pone ninguna parada a mano**. El día 1 sale «Roma antigua y Centro histórico» con Coliseo, Arco de Constantino, Foro, Panteón, Piazza Navona… y **la Basílica de San Pedro cae el día 3** (por eso ya no mezcla su aviso con el del Centro histórico). Salen también las tarjetas reales del motor (Otoño en Roma, «Domingo 18 · Museos Vaticanos cerrados»). Si una serie necesita un caso especial hay una función aparte y a la vista: `__rutaPrueba.conParada('Nombre', día, lat, lng)` (solo añade la parada si el motor no la ha puesto).

### 5. El sello que nace
En el resumen del día: **«sello nuevo»** cuando nace ese día (bronce; el Vaticano nace en plata) y **«sello subido de grado»** cuando solo sube. Un sello que nace y sube el mismo día cuenta una vez, como nuevo. (El modo demo daba al servidor un dato distinto del real —`roma` en vez de `roma:bronce`—; también arreglado.)

### 6. Las maravillas: fuera la medalla de cada maravilla
- **Fuera** la pantalla entera de la medalla («Tu primera maravilla · 1 de 7» + [Seguir]) y fuera lo del servidor que pegaba la maravilla a su emblema: la maravilla vuelve a su sitio en `orden_momentos`.
- Lo que queda al conseguir el Coliseo: **sus pedazos → su película (con el emblema «Una maravilla del mundo») → el sello → «Y además…»**, que lleva el país, el destino, la **tarjeta pequeña «Maravilla del mundo · Tu primera maravilla · El Coliseo · 1 de 7»** (con la medalla quieta, sin animación) y el Patrimonio. Después, el resumen. La barra de arriba pasa de 5 pasos a 4.
- **«El final de las 7 maravillas»** hecho ahora (`FinalSieteMaravillas.tsx`, pantalla `final7`): sale **solo** con la séptima maravilla. Las 7 monedas, ya encendidas en círculo con sus emblemas, se quedan un momento quietas y se juntan en el centro; un núcleo late cada vez más rápido; fogonazo de luz; la medalla entra girando; el barrido de luz y los fuegos artificiales; al final «¡Las has visto todas!» y [Seguir]. Sin movimiento (si el móvil lo pide) sale la medalla entera quieta.
- **¿Igual que en Design?** Es la misma secuencia de «Medalla Siete» (Piezas, Momentos Grandes 02): las mismas claves de animación, medidas y tiempos (lienzo de 340 × 400), y las monedas llevan los mismos emblemas de oro. **Tres diferencias:** (1) en Design, la animación completa empieza con las monedas encendiéndose **una a una** (de 0 a 7, unos 16 segundos); aquí solo se hace el final, que es lo que pasa con la séptima, porque las otras seis ya se han visto en sus momentos; (2) la medalla final es la de la app (`MedallaMaravillas` con las 7 encendidas, de `public/medalla/`), no el componente «Medalla Maravillas n=7» de Design; se ve igual de forma y color, pero no la he comparado píxel a píxel; (3) he añadido el texto «Las 7 maravillas del mundo · ¡Las has visto todas!» (Design no pone texto en esa pieza).
- **Modo de pruebas:** `window.__momentos.serieFinal7()` (y `lanzar('final7')`). Para capturar un instante exacto hay `window.__finalSiete = { espera: 99 }` (deja las monedas quietas).
- Si Design sigue enseñando la medalla en cada maravilla («Después, Tu primera maravilla…» en Logros · Momentos y «Cada maravilla nueva: destello…» en la pieza «Medalla 7 Maravillas»), no la seguí: Design la va a quitar. La medalla quieta de Logros, con las monedas ganadas en oro, se queda como estaba.

## Las fotos de Unsplash
- **Página para elegir: `docs/dias/FOTOS_CANDIDATAS_8B4.html`** (cada sitio con sus 3 fotos grandes y numeradas, y cómo se ven recortadas en HOY v2 y como miniatura). **No he puesto ninguna en la app.** Dime «sitio: opción» y la pongo (con su miniatura WebP y su autor en `_fotos.json`).
- **3 candidatas** (de día, del sitio, apaisadas, sin gente en primer plano, sin marcas de agua; las miré una a una) para: **Foro Romano y Palatino, Arco de Constantino, Panteón, Piazza Navona (de día), Museos Vaticanos (cartel de la entrada, puerta y patio de la Piña; nada de dentro de la Capilla Sixtina) y Columna de Trajano.** De cada una guardo autor, enlace y licencia en `docs/dias/notas_8b/candidatas_8b4.json`.
- **Sin ninguna candidata buena (se quedan sin foto): Via del Babuino, Terraza de Largo Gaetana Agnesi, Colle Oppio y Mirador de San Pietro in Montorio.** Ninguna foto de Unsplash dice el nombre de esos sitios en su descripción o sus etiquetas; las que salen son del Coliseo, del Foro de Trajano o de vistas de Roma, y no puedo asegurar que sean el sitio. Prefiero dejarlas sin foto antes que poner una equivocada.
- Dos candidatas son flojas y están avisadas en la página: la opción 3 del Arco (el arco sale a medias) y la opción 3 de la Columna (un tramo de relieves).
- Reproducible: `node scripts/destino/candidatasFotos8b4.mjs salida.json` (busca) y `node scripts/destino/paginaCandidatas8b4.mjs` (hace la página). La clave de Unsplash no se imprime.

## Las capturas nuevas (`docs/dias/capturas_8b/`, 112 en total)
Todas del viaje de pruebas del motor (17-20 oct), JPG, y la prueba falla si dos son idénticas (hoy ninguna lo es).
- **Serie entera del Coliseo, sin la medalla** (`CS-coliseo-00` … `17`, con `06b`): HOY v2 → [Visto] → aviso → hoja del Emblema Oculto («Sube una foto en el Coliseo…») → cámara → pedazos → la película paso a paso → el sello nace → sello en bronce → «Y además…» (con la tarjeta de la maravilla y el Patrimonio) → resumen con «sello nuevo». Se borraron `13a`–`13e` (la medalla) y `hoy-coliseo.jpg` (la hacía `CS-coliseo-00`).
- **Nueva serie «El final de las 7 maravillas»** (`F7-01` … `F7-11`): las 7 monedas quietas → brillan → se juntan → núcleo y fogonazo → luz blanca → la medalla entra girando → aparece → con sus estrellas → fuegos (2) → final con texto y [Seguir].
- **El Visto y HOY:** `V2` (con la Fontana de Trevi), `V3` («en Piazza Navona»), `V4` («en el Panteón»), `V5` («en el Coliseo»), `recuerdo` («de la Plaza del Campidoglio»), `A2` (sin cuenta atrás), `V8` («Te quedan 9 días…» ya pasado el viaje) y `lista` (HOY con las fotos de las paradas).
- **No rehechas** (su texto no cambia): A1, V1, V6, V7, 9b, 9c, foto_dentro, DIAS-desmarcar, despues, E1-E11 y la serie S2.

## Pruebas
- `pruebaPantallas8b`: **96 comprobaciones, 0 fallos** (nuevo: sección 7: Patrimonio del Coliseo, artículos, sin cuenta atrás en el viaje, sello nuevo, el Coliseo sin la pantalla de la medalla, la séptima con «El final», que el viaje de pruebas lo genera el motor).
- `pruebaLogros1`: **363/0** (nuevo: el Patrimonio del primer Visto en el Coliseo y el orden de su «Y además…»; los mensajes con artículo). `pruebaVisto8b3`: 0 fallos.
- Batería rápida (74 pruebas, sin `pruebaFase6y5_motor`, con el servidor reiniciado): al principio falló `pruebaFase6y_formulario` por una lista de auditoría («sitios que leen las experiencias»: añadí `src/dev/rutaDePrueba.ts`, que solo las escribe); ahora **«MAL: ninguna»**. `tsc -p tsconfig.app.json` limpio. Las pruebas del motor reescriben sus `docs/dias/PRUEBA_TANDA6*.md` con números de hoy: los dejé como estaban.
- **El peso al abrir no cambia: 708,4 KB de JavaScript, 315,1 KB de descarga** (`FinalSieteMaravillas` y las monedas van en el trozo de los momentos, que se baja al abrirlos).
- Consola: sin errores míos. Solo salen los avisos ajenos de siempre (Supabase 400 de la caché en la nube sin claves en local y recursos del mapa).

## Riesgos
- **Sigue sin probarse en un móvil real** (cámara, permisos, galería, vibración, audio) ni con Supabase real.
- **«El final de las 7»** solo se ve hoy con el modo de pruebas (nadie puede conseguir la séptima todavía). Lo revisé en tiempo real y parando la animación en 8 instantes; no he comparado la medalla final píxel a píxel con la de Design.
- Las capturas de la película del Coliseo y las de «El final de las 7» las hice a mano en el panel: la animación depende del tiempo y no se repite al milímetro (en las de F7 paré la animación en el instante exacto para no perder ninguno).
- **Los artículos son una tabla fija**: si se añade un sitio nuevo a Roma, hay que añadirle su artículo (la prueba avisa). Para otro destino habrá que hacer la suya.
- **4 sitios siguen sin foto** (Via del Babuino, Terraza de Largo Gaetana Agnesi, Colle Oppio, Mirador de San Pietro in Montorio) y los 6 con candidatas, hasta que elijas.
- Las fotos de la página de candidatas se cargan desde Unsplash: hace falta internet para verla.

## Lo que sigue anotado
- Elegir las fotos (tú) y ponerlas con su miniatura y su autor.
- Lo de la 8c y las cuentas, parte 3, como en el informe de la 8B.
