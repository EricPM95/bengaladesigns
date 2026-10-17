# Informe: Tanda 8B, HOY v2 y los momentos de los logros

17-oct-2026. Primera tanda con las pantallas de Design para los logros. **El motor de rutas no se ha tocado** (`shared/routeEngine` y `server/engine` sin ningún cambio). Todo lo nuevo va detrás de interruptores apagados en producción: HOY v2 con `VITE_HOY_V2` (en local, `?hoy2=on`) y los logros con los suyos de siempre (`VITE_LOGROS_ACTIVOS` y las cuentas). Con todo apagado, la app es la de hoy. No hay migraciones nuevas.

Trabajé con cuatro ayudantes en paralelo (dibujos, HOY v2, Visto y fotos, momentos) y yo me quedé con la base, la espera de carga, el modo de pruebas, la revisión y las pruebas. Sus notas, más largas, están en `docs/dias/notas_8b/`.

## Qué pantallas hay y dónde están

### Los dibujos (`src/components/logros/dibujos/`)
Todo sale de «Logros · Modelos» y se dibuja con código (sin vídeos ni GIF): los sellos de Roma (bronce, plata, oro, diamante) y del Vaticano; las 11 insignias con sus pedazos (un pedazo por sitio, en el orden de `sitios`); los 12 emblemas (estáticos, con silueta «?» y con su animación en bucle); las 43 chapas de viajero y la medalla de las 7 maravillas (la única excepción: usa las imágenes de Eric, convertidas a WebP, **76 KB en total** frente a 1,2 MB en PNG). Cada pieza pesada se carga solo cuando se dibuja. Hay una página de comparación solo para desarrollo: `?dibujos=1`.

### HOY v2 (`src/components/route/hoy/v2/`)
- Antes del viaje: **1a** (con fechas) y **1b** (sin fechas), con la tarjeta del Pase de Roma.
- Un día normal: **2** (la siguiente parada en grande, [Visto], [No me da tiempo], [Cómo llegar], [Escuchar historia] solo donde hay historia, [Sobre este lugar], avisos y lluvia con [Ver alternativa]).
- El día de llegada: **3**, **3b** y **3c** (el bloque de comer solo si queda libre de 12:00 a 14:59; si no, «Restaurantes cerca de tu alojamiento»; la llegada tarde; «Tu ruta empieza en…» con la primera parada real).
- El día de vuelta: **4** y **5**.
- Las hojas: **7** «¿Qué hacemos con esta parada?», **8** «Más para tu día» (solo en días recortados) y **11** «Sobre este lugar» (con `por_que_recomendamos`).
- La lista de paradas con la pieza «Parada con foto» (miniaturas WebP de la 8a2: color y ✓ si está vista, más apagada si está por ver).
- El pase (`TarjetasPase.tsx`, `src/lib/paseEstado.ts`): con el cobro apagado, todo abierto. Con el cobro encendido, **P3** (día de llegada sin pase), la tarjeta de la **pantalla 12** (al acabar el día de prueba sin pase) y **P10** (la pregunta de las 12:00, que usa `responderPregunta`).
- Para verlos sin servidor: `?pase=sin|prueba|con|pregunta` (solo en desarrollo).

### El Visto y las fotos (`src/components/logros/visto/`)
**A1** (permisos: nuestra pantalla y después las ventanas del móvil, una sola vez), **A2** (la franja «Sin conexión…»), **V1** («… marcada como visto · [Deshacer]», 5 segundos), las hojas **V2** (pedazo ganado con ubicación), **V3** (sin ubicación), **V4** (lejos), **V5** (Emblema Oculto) y «Guarda un recuerdo», todas desde abajo con su cruz y «¿No estás aquí? Desmarcar visto»; **V6** (la parada con lo que le falta, en HOY y en DÍAS, con su cámara); la cámara de la app (**9b**) y la galería (**9c**, con «Elige una foto del 17 al 20 de octubre» con las fechas de verdad del viaje); **V7** (fotos que no valen, con el mensaje del servidor y [Elegir otra foto]); **V8** («Lo de ayer también cuenta»); la línea de «foto dentro» antes de abrir la cámara; y el plazo («Te quedan N días para reclamar tu premio» solo después del viaje).

### Los momentos (`src/components/logros/momentos/`)
«Hoy empiezas a ganar logros» con [Empezar mi día]; las sorpresas una a una (sellos que nacen o suben, colecciones juntas, países, destinos, maravillas, Patrimonios, logros de viajero y «Y además…»), con tocar = siguiente y [Saltar todo]; los emblemas en cine (la **película del Coliseo**, ~28 s, con «Casi 2.000 años esperándote…» siempre y fuegos solo ahí, y **11 escenas más**, una por emblema, cada una en su archivo); la frase de suspense solo con `primera_vez`; el dibujo que vuela al botón de logros o al Perfil; el **botón flotante** (aro de avance y puntito, en RUTA, DÍAS y HOY; late si se vio la animación, puntito si se saltó, guardado con `animacion-vista`) con una hoja sencilla; el **resumen del día**, el **resumen del viaje** con sus dos textos (y lo pendiente con su cuenta atrás) y **Compartir** (C1 un logro, C2 el viaje: imagen 1080×1920 con [Guardar imagen] y [Compartir]). Suenan con `sonar()` y vibran con `vibrar()`; con «Reducir movimiento» salen quietas. `EscenaDeEmblema` queda lista para que la 8c repita la escena de un emblema guardado, sin frase ni suspense.

### Lo de la 8a3 que quedaba (4b)
Mientras llega una pantalla partida se ve el mismo fondo con la cabecera de la app (el destino) y barras suaves. Si la red falla justo al cargarla: «No se ha podido cargar. [Reintentar]», que la vuelve a pedir (`PantallaPerezosa.tsx`; un fallo de dibujado sigue yendo al `ErrorBoundary` de siempre).

## Lo que añadí yo para poder probar
- **Modo de pruebas de los logros** (`src/lib/logrosDemo.ts`, solo desarrollo, no entra en producción: comprobado en el build): con `?logrosDemo=1` la app trata la sesión como una cuenta y las respuestas del servidor salen de un guion con la forma real (Trevi = pedazo, Navona = sin ubicación, Panteón = lejos, San Pedro = emblema que pide foto, Coliseo = emblema + maravilla, Foro = colección completada + sello que sube, Museos = «foto dentro»). Atajos en `window.__demo` (`ayuda()` los lista) y `window.__momentos`. Sustituye al «servidor de prueba» porque el real necesita Supabase.
- Cambios al servidor (solo campos nuevos, nada de lo que devolvía cambia): `visto` devuelve `sitio_nombre`, `hay_pedazo`, `hay_emblema` y `foto_dentro` (sin eso el móvil no puede saber si un sitio esconde un emblema) y `pendientes` añade `stop_id`, `nombre` y `foto_dentro`. `pruebaLogros1` (354 comprobaciones) sigue en 0 fallos.

## Lo que no ha quedado igual que el diseño, y por qué
- **El orden de las sorpresas.** El servidor manda el emblema primero; el diseño de «Logros · Momentos» (J) pide sello → colecciones → emblema → «Y además…». Manda el diseño y se reordena en el móvil (`plan.ts`); `ajustes.json` no se ha tocado. Si prefieres el del servidor, es cambiar ese archivo. **Es la cosa que más conviene que mires.**
- **La galería (9c) no es una parrilla de fotos:** una web no puede leer la galería del móvil. Sale la hoja con las fechas del viaje y [Abrir la galería], que abre el selector del móvil.
- **«El final de las 7 maravillas»:** no está hecho como película (solo la pantalla de maravilla con la medalla y fuegos). Hoy solo se puede conseguir el Coliseo; la secuencia de las 7 monedas queda para cuando se sumen las demás.
- **La maravilla del Coliseo** va dentro de su película («Tu primera maravilla · 1/7»), no sale otra vez aparte.
- **Las 11 escenas de los demás emblemas** son mías: más simples que las de «Emblemas Cine» (siguen su descripción y su color). La película del Coliseo es casi copia literal del diseño.
- **Insignias:** no llevan la animación de «completar» (teselas volando) ni el pedazo que flota desplazado; solo un pequeño rebote al entrar. Las llaves de «el país más pequeño» conservan su ensamblado.
- **Sellos que suben:** esperan ~3,5 s (el diseño pone ~10 s) para que no se haga largo.
- **En el cine, tocar salta al emblema** y [Seguir] sigue (no pasa de pantalla de golpe).
- **HOY v2:** sin el chip del tiempo ni la campanita dentro de HOY (la cabecera es de toda la app); sin el asa de arrastrar para ordenar la lista (en DÍAS sí se reordena); la hoja 11 no tiene la sección «Por qué» (ese dato no existe: salen «Qué es», «Qué vas a ver» y «Por qué te lo recomendamos»); en la hoja 8, [Deshacer] es el aviso de la app de siempre, no uno dentro de la fila.
- **«Después del viaje» de HOY** sigue siendo el de antes (no se ha tocado): el resumen del viaje se abre desde los momentos.
- **Compartir un logro** no lleva la foto del viajero ni el logo; el texto de dentro del dibujo usa una letra de repuesto (el navegador no carga fuentes web dentro de la imagen).
- **Desmarcar desde el menú «···» de DÍAS** mientras no haya foto: no hecho (sí se desmarca desde la tarjeta y con [Deshacer]).
- Si el servidor no contesta al Visto, la tarjeta sale como «Guarda un recuerdo» (sin respuesta no se sabe si el sitio esconde un emblema).

## Los textos que he tenido que poner yo (el diseño y los apuntes no los traían)
- HOY: «De este sitio todavía no tenemos más que contarte.», «Tienes la entrada reservada a las {hora}.», «Hoy · {día}» (etiqueta de P3).
- Visto y fotos: «Una foto para tu álbum.», «Foto guardada», «Foto guardada. Tus sorpresas saldrán al volver la señal.», «No hemos podido saber dónde estás. Actívala en los ajustes del móvil o haz una foto.», «Abrir la cámara / Abrir la galería / Comprobando la foto…», «Antes de la foto · {sitio}», «Hoy es el último día para reclamar tu premio» / «Te queda 1 día…», «Elige la foto de cada sitio:».
- Momentos: resumen del día («Tu día en {ciudad}», «Esto es lo que has ganado hoy», «Aún no has ganado nada hoy» y las líneas «1 sello subido de grado», «4 pedazos de colecciones»…), hoja del botón («Tus logros en {ciudad}», «Por conseguir», «En tu ruta», «Todavía no hay logros que enseñar»), «Ver el resumen del viaje», «Ver mi viaje», «Preparando la imagen…», «No hemos podido preparar la imagen.», «Toca para ir al emblema».
- La lista completa está en las notas de cada ayudante (`docs/dias/notas_8b/`).

## Dos cosas que arreglé al revisar (no las había hecho ningún ayudante)
- **La moneda del Coliseo decía «Encontrado el 11 de octubre de 2026»** (la fecha de ejemplo del diseño, fija en la pieza). Ahora lleva la fecha de verdad en que se encuentra (la de hoy si no se indica; la 8c podrá pasarle la fecha guardada). Es lo que dice la regla «ningún número inventado».
- **El resumen del día «al acabar la ruta»** no se abría nunca (estaba la llamada, pero sin nadie que la hiciera). Ahora sale una vez por día cuando la última parada del día de hoy pasa a vista o saltada; si hay sorpresas, salen antes, y si hay una hoja del Visto abierta, espera.
- Además: una colección repetida en la misma ronda de sorpresas (dos fotos seguidas) provocaba un aviso de React por clave duplicada y una fila doble; ahora sale una fila con la cuenta más alta. Y el modo de pruebas tenía mal tres ids (`joyas`, `antigua`, `capilla_sixtina`), con lo que la insignia de las 4 joyas salía vacía en las pruebas.

## El peso
Medido con `vite build` sobre lo que carga `index.html` (KB de 1.024 bytes; el comprimido es lo que se descarga):

| Al abrir la app | Antes (8A3) | Después (8B) |
|---|---|---|
| JavaScript que lee el móvil | 697,0 KB | **707,6 KB** (+10,6) |
| JavaScript comprimido | 212,4 KB | 217,1 KB |
| CSS | 485,5 KB (95,8 comprimido) | 489,5 KB (97,7 comprimido) |
| **Descarga total al abrir** | **308,2 KB** | **314,8 KB** (+6,6) |
| Archivos al abrir | 3 JS + 1 CSS | 3 JS + 1 CSS |

Lo único que entra al abrir es el anfitrión de los momentos (pequeño) y los dibujos que se usan ya. Todo lo demás se baja al hacer falta: el reproductor de sorpresas 18 KB (7 comprimidos), la película del Coliseo 13,4 KB, cada escena de emblema entre 1,6 y 2,8 KB, los resúmenes 4,5 y 6,6 KB, compartir 7,5 KB, la hoja 4,1 KB, la medalla 61,6 KB + 76 KB de imágenes WebP, el emblema de oro 34 KB y las chapas 15 KB. El JavaScript total de la app pasa de 3.395,6 KB (14 archivos) a 3.704,4 KB (49 archivos): crece lo nuevo, pero no pesa al abrir. `pruebaPantallas8b` vigila que al abrir no entren ni la película, ni los resúmenes, ni el modo de pruebas, y que el JavaScript de la primera carga siga por debajo de 1 MB.

## Lo que he mirado en el navegador (tamaño móvil, modo de pruebas, `?logrosDemo=1&hoy2=on`)
Un día entero de Roma (ruta rápida con 5 paradas en el día 1 y 2 en el día 2), con todos sus casos: A1 (permisos), V1 (aviso de 5 s), V2 (pedazo con ubicación: Fontana de Trevi) y su sorpresa de 4 joyas; V3 (Plaza Navona, sin ubicación), V4 (Panteón, lejos), V5 (Basílica de San Pedro, emblema oculto) con su cámara, la **foto que no vale** (V7: «Esta foto no es de Fontana de Trevi.» + [Elegir otra foto]) y la foto buena con la escena del emblema; el Coliseo (emblema + pedazo + maravilla, con «Casi 2.000 años esperándote…» y «Tu primera maravilla»); la serie completa de sorpresas con **[Saltar todo]** hasta el resumen del día (con las cuentas reales de lo ganado); el **resumen del viaje** (su texto «¡Wow!») y **Compartir el viaje** (imagen 1080×1920 con [Guardar imagen] y [Compartir]); **P10** (pregunta de las 12:00: [Hoy] manda el Visto en espera y la cola queda vacía); **A2** (la franja aparece al caer la señal y desaparece al volver, y el Visto de sin señal se manda al volver); **V8** («Lo de ayer también cuenta»); y el resumen del día al marcar la última parada. La consola sale sin errores propios: lo que queda son avisos de `vibrate` (el panel no deja vibrar sin un toque de verdad) y un 400 de Supabase por `guardado_en` (ver riesgos). Hay **79 capturas** a tamaño móvil en `docs/dias/capturas_8b/` (en JPG, porque el panel no guarda PNG), con el nombre de su pantalla en el diseño: 1a, 1b, 2, 3, 3b, 3c, 4, 5, 7, 8, 11, lista, P3, P10, 12, A1, A2, V1–V8, 9b, 9c, y las de los momentos con la letra del diseño (A, B, C0, C1, C2, D, E1–E11, F1, H, J4, K, L0, R0–R2…).
**Lo que no he podido mirar:** «Reducir movimiento» (el panel no deja emularlo; revisado leyendo el código), un móvil de verdad (cámara, permisos del sistema, `navigator.share`, vibración, sonido y el modo silencio) y la pantalla de «No se ha podido cargar» forzando un fallo de red (solo la comprobación del código).

## Pruebas
- `pruebaPantallas8b` (nueva, ya en la batería): **45 comprobaciones, 0 fallos** (el interruptor de HOY v2, el reconocimiento de un fallo de carga frente a uno de dibujado, que apagado no se monta nada, ningún nombre de empresa en los textos nuevos, ni un emblema en HOY, DÍAS o la hoja del botón, ninguna hora de Madrugador o Nocturno, la frase del Coliseo, el plazo, la franja de sin conexión, [Deshacer], «Reducir movimiento», `sonar()` y `vibrar()`, 44 px en las hojas, y en la versión de producción que no entra el modo de pruebas, que cada escena va en su archivo y el peso al abrir).
- `pruebaLogros1`: 354/0. `pruebaLogros2`: 54/0 (actualizada: ahora comprueba `pantallaPerezosa` en vez de `lazy`).
- Batería rápida (73 pruebas, sin `pruebaFase6y5_motor`, que no se toca): ver el final de este informe. `tsc -p tsconfig.app.json` limpio.
- Cuatro pruebas antiguas hubo que ajustarlas porque miraban cosas que esta tanda cambia a propósito (cada una con su motivo en el código): `pruebaFase6y4_perfil` (ahora hay una segunda forma de subir fotos, la hoja del Visto, que usa la misma `subirFoto`), `pruebaFase6z6f` («Durante el viaje, Hoy te dará» es el título del diseño de HOY, no una etiqueta de momento), `pruebaTanda6z3` (los dibujos de los logros y los dorados del Pase y la cámara son de Design: se les deja fuera de «no copiar trazos» y «sin terracota a mano», pero los iconos de la interfaz del Visto sí usan ya `src/lib/iconos.ts`) y `pruebaFase6y4_formulario` (el calendario de fechas pasa a z 9500 para seguir por encima de todo, también de las sorpresas, que van en 9000).
- Borré `dibujos/piezas/VueltaMundo.tsx` (pasada del diseño pero sin usar).

## Lo que queda para la 8c y para las cuentas, parte 3
- **8c:** la hoja del botón flotante completa (las 11 colecciones con su pantalla propia 5A, «En tu ruta», lo nuevo de hoy, los emblemas guardados con su animación y repetir la escena con `EscenaDeEmblema`, «3 de 12 secretos»), la pestaña LOGROS de la ficha, el pasaporte, la vitrina, el Perfil con las chapas de viajero, «¿Dónde has estado ya?», los resúmenes con el pasaporte, la animación de «completar» de las insignias, «El final de las 7 maravillas» y las 7 monedas, la foto del viajero en Compartir y el HOY «Después del viaje» con sello y recuerdos.
- **Cuentas, parte 3:** el aviso de los 10 días, la campanita con la lista de avisos (leídos y sin leer), la pantalla del permiso de avisos y los avisos de recomendación; la pantalla de compra del pase (los botones [Ver el pase] y [Seguir con HOY] lanzan hoy el evento de pago pero nadie lo escucha).

## Riesgos
- **No lo he visto en un móvil real:** la cámara, los permisos de ubicación y cámara, la galería con datos de cámara (EXIF), `navigator.share` con archivo, la vibración, el audio y el modo silencio (y «Reducir movimiento») no están probados. Es la prueba que te toca con el iPhone y un Android.
- **El orden de las sorpresas** sigue el diseño y no el servidor (arriba). Si el servidor se ordena de otra forma en otro sitio (la 8c, el resumen), habrá que decidir cuál manda.
- **No lo he probado con Supabase de verdad** (ni el servidor del pase real con cobro encendido): todo salió del modo de pruebas con la forma real de las respuestas.
- **En desarrollo contra Supabase real sale un 400** al leer los viajes, por la columna `guardado_en` de la migración 0024 (8a2), que sigue sin aplicar. No es de esta tanda, pero hay que aplicarla (0020 y 0021 → 0022 → 0023 → 0024) antes de encender nada.
- **Las 11 escenas de emblemas** son más simples que las de Design; conviene que Eric las mire una a una (las capturas E1–E11 están en `capturas_8b/`).
- **Los sitios de cada colección están copiados dentro de `Insignia.tsx`** (para no cargar el JSON entero): si cambian en `roma.json`, hay que cambiarlos allí también.
- **El resumen del día «al acabar la ruta»** se dispara al marcar la última parada de hoy (vista o saltada) con el viaje abierto; si la persona acaba el día sin marcar todo, no sale solo (sí al final de las sorpresas y desde el botón). Un viaje cuyo día no esté en las fechas (sin `dateRange` exacto) no lo dispara.
- Si dos viajes comparten pantalla, el anfitrión de los momentos usa el viaje activo (`useSyncStore.activeTripId`).
- El HMR de Vite recarga la página cuando se edita código con la app abierta y se pierde la ruta rápida (solo desarrollo).

## Batería final
Última pasada de la batería rápida (con todo lo de esta tanda, el servidor de la API reiniciado y `vite build` hecho): **73 pruebas, «MAL: ninguna»** (incluidas `pruebaLogros1` 354/0, `pruebaLogros2` 54/0 y `pruebaPantallas8b` 45/0). Primera pasada, antes de revisar: 5 pruebas viejas en rojo por lo que cambia esta tanda (arriba, «Pruebas»), ya ajustadas.
