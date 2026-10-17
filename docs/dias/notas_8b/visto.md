# Tanda 8b · El Visto y las fotos (y el modo demo)

## Qué hay y dónde

Todo en `src/components/logros/visto/` (solo se ve con los logros encendidos; apagados, la app es la de hoy):

- `VistoFlujo.tsx`: el cerebro de las pantallas. Se monta una vez desde `LogrosPorVisto`. Decide qué tarjeta toca según lo que contesta el servidor, pide los permisos la primera vez, manda las fotos y las pendientes.
- `Hojas.tsx`: lo que se dibuja. A1 permisos, A2 franja «Sin conexión», V1 aviso de 5 s con Deshacer, hojas V2 (pedazo ganado), V3 (sin ubicación), V4 (lejos), V5 (Emblema Oculto), «Guarda un recuerdo», la línea de «foto dentro», la galería con las fechas (9c) y las fotos que no valen (V7), «Lo de ayer también cuenta» (V8, con su lista «Subir mis fotos»).
- `CamaraApp.tsx`: la cámara de la app (9b). Visor real con `getUserMedia`; si el móvil no deja, abre la cámara normal del móvil y la foto cuenta igual.
- `PendienteDeParada.tsx`: V6, la tira bajo la parada («Te espera una sorpresa: sube tu foto», «Haz una foto y gana tu pedazo», «Guarda un recuerdo») con su botón de cámara y, después del viaje, «Te quedan N días para reclamar tu premio».
- `vistoStore.ts`: el estado. Mantiene `useLogrosStore.hojaAbierta` en `true` mientras haya cualquier cosa abierta (aviso, hoja, cámara, galería, permisos, V8), así las sorpresas esperan. Guarda en el móvil qué paradas esperan foto.
- `fechas.ts`: las fechas del viaje («Elige una foto del 10 al 14 de octubre», con las fechas REALES) y el plazo de 30 días. Durante el viaje no hay cuenta atrás.
- `trazos.tsx`: los iconos de trazo fino.

Cómo se gana cada cosa (apartado 29): el pedazo con ubicación cerca se gana al tocar Visto (V2, la foto es para el álbum); sin ubicación, V3; lejos, V4 (el Visto queda marcado); Emblema Oculto, V5, siempre con foto; sitios sin nada, «Guarda un recuerdo». «¿No estás aquí? Desmarcar visto» abajo de todas. Deshacer del aviso de 5 s quita también lo que había llegado de ese Visto.

La primera vez que se toca Visto sale nuestra pantalla de permisos (A1) y, al continuar, las ventanas del móvil (ubicación y cámara). Se recuerda en el móvil (`trazo:logros:permisos-vistos`).

## El modo demo (solo desarrollo)

`src/lib/logrosDemo.ts`, cargado con `import()` solo si `import.meta.env.DEV` (comprobado: el build de producción no lo incluye). Se enciende con `?logrosDemo=1` (queda en la pestaña; `?logrosDemo=0` lo apaga). Fuerza los logros, las cuentas y una cuenta de mentira; `llamar()` deja de ir al servidor y devuelve respuestas con la forma real.

Guion por nombre de parada (ruta rápida de Roma): Fontana de Trevi = pedazo con ubicación; Plaza Navona = sin ubicación; Panteón = lejos; Basílica de San Pedro = Emblema Oculto (al subir la foto llega el emblema `basilica_san_pedro` con frase de suspense); Coliseo = Emblema + maravilla al subir la foto; Foro Romano = colección completada + sello que sube; Museos Vaticanos / Capilla Sixtina = Emblema Oculto con la línea de «foto dentro»; cualquier otra = «Guarda un recuerdo».

Atajos en la consola del navegador (`__demo.ayuda()` los lista):
- `__demo.lanzar('serieCompleta')`: mete un momento de cada tipo (emblema, suma, suma_sello, coleccion, sello, pais, destino_nuevo, maravilla, patrimonio, viajero) en el almacén. `lanzar('emblema')` etc. para uno solo.
- `__demo.estadoPase('sin'|'prueba'|'con')` y `__demo.hora('13:00')`: con `prueba` y hora desde las 12:00, el primer Visto devuelve la pregunta de las 12:00 (queda en `useLogrosStore.pregunta`). `responderPregunta` funciona contra el demo.
- `__demo.siguienteFoto('no_camara'|'otra_fecha'|'otro_sitio'|'sin_cobertura')`: fuerza el resultado de la próxima foto (los mensajes son los del servidor).
- `__demo.sinCobertura(true|false)`: el servidor «no contesta»; el Visto va a la cola y sale al volver.
- `__demo.dia(2)` y `__demo.loDeAyer()`: fingen que ya es el día 2 y abren V8. `__demo.hoy('2026-11-10')`: finge otro día de hoy para ver el plazo de 30 días.
- `__demo.abrirHojaDeVisto('oculto'|'ganado'|'sin_ubicacion'|'lejos'|'recuerdo', indiceDeParada)`: abre una hoja suelta.
- `__demo.reiniciar()`: borra lo ganado y lo visto del demo y las marcas del móvil. `__demo.camaraFalsa(false)`: usa la cámara de verdad.
- Sin cámara en el ordenador, el demo da un vídeo de mentira para poder hacer la foto con el disparador.

## Ediciones en archivos compartidos (todas pequeñas)

- `src/lib/logros.ts` (solo yo): `demoActivo()`, la desviación al demo en `llamar()`, los campos nuevos de `RespuestaDeHecho` (`sitio_nombre`, `hay_pedazo`, `hay_emblema`, `foto_dentro`, `repetido`, `sitio`).
- `src/components/logros/LogrosPorVisto.tsx`: el Visto ahora llama a `procesarVisto`; el deshacer avisa a `alQuitarVisto`; monta `<VistoFlujo>`; en el demo el viaje es el de la ruta abierta.
- `src/lib/cuentas.ts` y `src/components/cuenta/useCuenta.ts`: el demo fuerza las cuentas y la cuenta de mentira (solo desarrollo).
- `src/components/route/hoy/v2/ExtraDeParada.tsx`: ahora pinta V6 en el contexto `fila` (el `tarjeta` sigue sin nada).
- `src/components/route/hoy/HoyDurante.tsx` (HOY actual) y `HoyDuranteV2.tsx`: la fila «Visto: … Añadir foto» vieja se oculta con los logros encendidos (`!logrosActivos()`); en el HOY actual se añadió V6 bajo el nombre de cada parada.
- `src/components/route/dayDetail/DayDetailPanel.tsx` (DÍAS): V6 bajo la tarjeta de cada parada.
- Servidor, solo campos nuevos (no cambia nada de lo que ya devolvía): `server/logros/servicio.js` (`visto` devuelve `sitio_nombre`, `hay_pedazo`, `hay_emblema`, `foto_dentro`; función `queHayEn`) y `server/logros/vistas.js` (`pendientes` añade `stop_id`, `nombre`, `foto_dentro`). `node --check` pasa. No he vuelto a pasar `pruebaLogros1.mjs` (necesita PGlite): conviene pasarla, y reiniciar el servidor de la API.

## Lo que no está igual que el diseño, y por qué

- Galería (9c): el diseño dibuja una parrilla con las fotos del móvil. Una web no puede leer la galería, así que sale la hoja con «Elige una foto del 17 al 20 de octubre» (fechas reales) y [Abrir la galería], que abre el selector del móvil. Si la foto no vale, V7 con el mensaje del servidor y [Elegir otra foto].
- V6 en el HOY actual va dentro de la columna del nombre (no a todo el ancho de la fila), porque la fila es de Eric/otro agente; en HOY v2 manda el agente de HOY desde `ExtraDeParada`.
- V8: las miniaturas son las fotos del álbum de esa parada si existen; si no, colores. [Subir mis fotos] pasa a una lista con un botón de galería por parada (la web no puede saber de qué sitio es cada foto).
- El icono del hexágono dorado de V2 lleva un tic, no el icono del sitio (no hay iconos de sitio en la app).
- Los capturas están en `.jpg` (el panel del navegador no guarda PNG). `A2.jpg` es de antes de bajar la franja bajo la cabecera.

## Textos que he puesto yo

«Una foto para tu álbum.» (recuerdo sin nada que ganar), «Foto guardada», «Foto guardada. Tus sorpresas saldrán al volver la señal.», «No hemos podido saber dónde estás. Actívala en los ajustes del móvil o haz una foto.», «Abrir la cámara» / «Abrir la galería» / «Comprobando la foto…», «Antes de la foto · {sitio}», «Hoy es el último día para reclamar tu premio» / «Te queda 1 día…», «Elige la foto de cada sitio:», «USA LA CÁMARA DEL MÓVIL» (visor sin cámara).

## Pendiente / sin hacer

- «Desmarcar desde el menú ··· de la parada» mientras no haya foto (apartado 25): el Visto sí se desmarca desde la tarjeta y desde [Deshacer], pero no he tocado el menú ··· de DÍAS.
- Si el Visto llega con el servidor caído, la tarjeta sale como «Guarda un recuerdo»: sin respuesta no se sabe si el sitio esconde un emblema (se verá en V6 al volver la señal si es de un día anterior).
- Aviso de móvil 3 días antes del plazo: es del servidor (8A), aquí solo se pinta el texto.
- Probado en el navegador del panel con el demo (móvil 375x812): A1, A2, V1-V8, 9b, 9c, «foto dentro», plazo, deshacer, desmarcar, sin cobertura con cola. No probado: móvil real (permisos de verdad, cámara real, fotos con EXIF), ni iPhone/Android. Consola sin errores míos (los 404 y el aviso de `vibrate` son de otras piezas y de pulsar por programa).
- El HMR de Vite recarga la página cuando otros agentes editan: al probar, la ruta rápida se pierde (hay que volver a crearla).

## 8B2 (arreglos de la 8B)

- **Por qué mis capturas salieron sobre el HOY de antes:** las hice sin `?hoy2=on` en la dirección (solo `?logrosDemo=1`). Con `?hoy2=on` HoyView pinta HOY v2 y el HOY viejo no aparece por ningún camino. Todas las capturas están rehechas con `?logrosDemo=1&hoy2=on` (móvil 375x812): A1, A2, V1 a V8, V8b, 9b, 9c, recuerdo, foto_dentro, V6 y plazo, más `DIAS-desmarcar` (DÍAS con la tira V6 y el menú «···»). V4 y V5 son ahora las suyas de verdad (V4 «lejos» con el Panteón; V5 la hoja oscura del Emblema Oculto con la Basílica de San Pedro). Las hojas salen sobre HOY v2 (foto grande, [Visto] en verde). En DÍAS se ve V6 y el menú.
- **V2:** el hexágono con tic se ha quitado. Lleva la INSIGNIA de su colección (`Insignia` de `dibujos`, con el pedazo de ese sitio encendido y animada) y el texto dice «Tu pedazo ya es tuyo. La foto es para tu álbum.».
- **Nombres de sitio:** todos los textos de las hojas (V2 a V5, «Guarda un recuerdo», cámara, galería, «foto dentro», V7) usan SIEMPRE el nombre de la parada que se acaba de marcar (`displayStopName(parada.nombre)`), no el que devuelve el servidor, y el texto de «lejos» y de «Esta foto no es de …» se arma en el móvil con ese nombre. (El «Con la foto de hoy en Plaza Navona» del Panteón era una lectura de la captura: la hoja era de la Plaza Navona y detrás estaba la tarjeta de la siguiente parada, el Panteón. Lo he comprobado con Navona, Panteón, San Pedro, Coliseo, Museos Vaticanos y Plaza de España.)
- **Desmarcar desde «···» en DÍAS:** `visto/DesmarcarDelMenu.tsx`, enganchado en `StopMenu.tsx` (una línea). Sale «Desmarcar visto» solo si la parada está vista, no saltada, con los logros encendidos y sin foto para los logros. Con la foto subida (`vistoStore.conFoto`, guardado en el móvil) ya no sale. Probado: quita la marca y su tira V6.
- **Franja «Sin conexión» (A2):** pasa abajo, encima de la barra de pestañas, para no tapar el título del día en HOY v2.
- **Modo demo al día con el orden del servidor** (pedazo, coleccion, emblema, sello, pais, destino_nuevo, continente, maravilla, patrimonio, viajero; la maravilla pegada tras su emblema): `serieCompleta` y las respuestas del Foro y el Coliseo respetan el orden; el emblema del Coliseo trae `maravilla: 'coliseo'`; ids de sitio y colección ya como los del catálogo (`cuatro_joyas`, `roma_antigua`, `museos_vaticanos_y_capilla_sixtina`…); se añade un `continente`. `abrirHojaDeVisto` acepta un tercer argumento con la línea de «foto dentro».
- **Capturas:** son `.jpg` en `docs/dias/capturas_8b/`. Las demás piezas (HOY v2, momentos) las hacen sus agentes.
- **Riesgo:** el servidor ya devuelve `sitio_nombre`; el móvil lo ignora a propósito para los textos. En el demo, la lista de «Lo de ayer» muestra todas las paradas del día anterior aunque ya estén vistas.
