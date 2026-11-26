# Decisiones pendientes de Eric (V60 a V65)

## Cosas que hay que hacer tú
1. **Aplicar la migración 0095** (tabla `documentos_de_entrada`, V65) en Supabase, con su `COMPROBAR_0095.sql`: ¿la aplicas tú? Hasta entonces, el QR de una persona no llega a las demás del grupo. Las migraciones que ya estaban sin aplicar (0065, 0067, 0068, 0073 a 0076) siguen igual.
2. **Los ~1.200 archivos viejos de `docs/dias`** siguen sin subir: ¿ejecutas tú `git restore docs`?

## V60 · Civitatis y hora recomendada
3. Excursiones de Roma: ¿qué id de Civitatis ponemos? Candidatas del sandbox: Pompeya y Sorrento 149 (o 365 si es solo Pompeya); Nápoles y Pompeya «en tren»: ninguna dice tren (365); Costa Amalfitana: no hay excursión de un día desde Roma (solo 604, de 3 días); Florencia en tren 3742; Tívoli 146.
4. Al pasar a producción de Civitatis, ¿repetimos la búsqueda (el sandbox tiene menos actividades)?
5. El día de llegada, ¿la hora recomendada parte de la hora útil del vuelo aunque sea anterior a la hora de la ruta, o de la mayor de las dos?
6. En un día normal sin hora libre, la franja ámbar «no llegas a ninguna hora libre» la escribí yo por analogía: ¿te vale? Y sin otro día con hueco, ¿solo la franja, sin caja verde?

## V61 · Reorganizar
7. Con el vuelo de 17:00, lo que no cabe el viernes (el Vaticano y otros, ~17 sitios) sale como «Se quita de tu viaje» en vez de «Al sábado 28» o «A Lugares pendientes»: ¿lo pasamos a otro día o a pendientes?
8. «Antes lo que cierra pronto» solo se aplica cuando si no llegaría cerrado: ¿quieres que el motor adelante siempre lo que cierra pronto (el Panteón a las 17:35 con el vuelo de 10:30)?
9. El Panteón con el vuelo de 17:00 sigue «por fuera» (venía así del documento de llegada tardía): ¿se queda?
10. «Has añadido la Galería Borghese el sábado…» no sale porque no existe el dato de lo que se añadió: ¿lo guardamos?
11. El barrido de 365 no se pasó tras tocar el motor del día de llegada: ¿lo pasamos en la próxima tanda de pruebas?

## V62 · La llegada en HOY
12. La tarjeta de llegada sale hasta la primera parada hecha (antes, el billete se quedaba todo el día): ¿bien?
13. Con coche propio, [He salido tarde] solo guarda la hora como recuerdo y no adapta los días: ¿quieres que cuente para el motor?
14. La hoja de [Vuelo retrasado] usa la rueda de siempre (✓ arriba, regla V55) y no el botón [Guardar] del dibujo: ¿bien?
15. El QR de HOY es la pieza pequeña de RESERVAS (no el círculo de 52 px del dibujo): ¿lo agrandamos?
16. Coche de alquiler sin reserva: la caja dice «COCHE · Alquiler»: ¿bien?

## V63 · Arreglos de HOY y DÍAS
17. «Parada saltada» más abajo en el iPhone: mi arreglo es una hipótesis (en Chrome ya salía bien): ¿me mandas una captura si sigue pasando?
18. ¿La regla de «la hoja empieza encima del aviso» vale también para las pantallas completas, o solo para las hojas de abajo?
19. ¿Cortamos el emblema de la parada saltada también en el servidor (`server/logros/cerca.js`)?
20. El resumen al eliminar un viaje: arreglo por la causa más probable, sin reproducir: ¿lo miras tú al eliminar un viaje?
21. La ficha de la parada puede seguir diciendo «A esta hora ya ha cerrado»: ¿la quitamos también?
22. Plan de lluvia: los textos de Roma están a media frase en `listas.json` y ahora les pongo «Si llueve, este es el plan: » delante: ¿prefieres frases escritas a mano?
23. Haría sale con horario aunque es un pueblo (V56): ¿separamos el pueblo de la Casa-Museo?
24. El motor de coche (Lanzarote) con cierre de mediodía no se ejercitó (ningún sitio tiene dos tramos): ¿lo damos por bueno?

## V64 · RESERVAS
25. Si el documento trae otra hora que el vuelo, «Revisa los datos» la enseña cambiada y al pulsar [Guardar] se cambia la hora y se adaptan los días (antes preguntaba «¿Actualizamos la hora?»): ¿bien?
26. Entrada y excursión siguen corrigiendo la reserva al leer (V50) antes de «Revisa los datos»: ¿lo cambiamos para que solo corrija al pulsar [Guardar]?
27. En la tarjeta del alojamiento, [+ Añade tu reserva] es crema con borde dorado, no blanco puro, y «Desde las 15:00» ocupa dos líneas en 390 px: ¿bien?
28. Los `radio_km` que añadí a las 6 zonas de Lanzarote (4, 4, 3,5, 4, 10 y 9 km) son estimaciones mías: ¿los ajustas?
29. La hoja de la zona solo pregunta con pase y con una zona ya elegida: ¿bien?
30. No se vio en pantalla el aviso con [Deshacer] tras cambiar de zona: ¿lo compruebas?

## V65 · Entradas y excursiones
31. Para las entradas con margen puse «Con margen · Hasta N min tarde» (texto mío): ¿cuál es el texto bueno?
32. El servidor ahora pide el nombre del titular de cada código solo para repartir las entradas; cada archivo gasta una de las 10 lecturas del día: ¿bien, o subimos el límite para esto?
33. Si dos personas del viaje tienen el mismo nombre, el código queda en «Falta» y no se adivina: ¿bien?
34. Si [Subir todas] saca un único código y su nombre no es de nadie, se pone a todos: ¿bien?

## Lo que no se ha podido comprobar (todo en modo rápido, sin pruebas)
35. Leer un documento de verdad (vuelo, tren, entrada, alojamiento, PDF de varias páginas), el selector de archivos del iPhone y la sincronización real con Supabase.
36. Pruebas viejas que ya no encajan: las que buscan `HoyYaNoDaTiempo` (`pruebaV43`), «Empiezas hacia las…», el billete en HOY el día de llegada, la casilla «Noches» y «o escribe los datos a mano».
