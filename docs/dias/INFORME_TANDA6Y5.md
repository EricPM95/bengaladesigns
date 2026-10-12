# Informe de la Tanda 6y5

Hecha en tres partes en paralelo (motor, historias y datos, pantallas), cada una con su informe: `INFORME_PARTE_MOTOR_TANDA6Y5.md`, `INFORME_PARTE_HISTORIAS_TANDA6Y5.md` e `INFORME_PARTE_PANTALLAS_TANDA6Y5.md`. Todo está en `main` en commits locales. **Falta el push:** lo haré cuando se pasen las 365 fechas sobre `main` con todo junto (Eric pidió hacerlo mañana).

## Las capturas (punto 5)
Sí se pueden guardar en disco: Playwright manejando el Chrome del equipo. Están en `docs/dias/img/6y5-*.jpg` (27 imágenes a 375 px): la ida y la vuelta abiertas con avión, tren, autobús y barco (con y sin fechas), las fichas del Coliseo, la Fontana y un sitio sin historia (gratis y de pago), HOY con «Historia», el Perfil con [Abrir este viaje], «Ver más excursiones» y el calendario antes y después del segundo toque.

## Punto 0 · Respuestas a la 6y4
- **P1, Altar + Ara Pacis:** probado con 19.000 viajes (mismo día y días distintos, varias horas, con y sin fechas, en los dos órdenes) y con el almacén y el servidor de verdad (6.483 comprobaciones): no se pierde ninguna parada. Lo único: dos reservas a la misma hora y el mismo día salen seguidas, y una reserva de las 10:00 sale antes del Coliseo. Queda añadido a la prueba de listas. Si no era eso lo que viste, necesito tu viaje.
- **P2 y P3, cierres:** el Vaticano y la Galería nunca se quitan. Se busca otro día del viaje donde no cierren y se cambian los dos días enteros (como la 6k); si no hay ninguno, el sitio se queda con el aviso y decide el viajero (en la parada, en los avisos del día y en la hoja de reservas).
- **El miércoles de los Museos:** el documento mezcla la audiencia del Papa (que solo cambia la Plaza y la Basílica por la mañana) con los cierres. Su variante «el miércoles sin Museos» quita los Museos aunque abren los miércoles. El orden de los días evita poner el Vaticano en miércoles; si no puede, la variante se activa (330 casos de 58.035 viajes). No toqué el documento.
- **P4:** lo que una reserva grande a otra hora deja sin sitio pasa a «Si te sobra tiempo» de ese día.
- **Tope del pool 3/6** y lo que queda en «No incluido» (540 viajes por forma): 1 día, 837 de 1.620 (51,7 %); 2 días, 203 de 1.620 (12,5 %); 3 días, 262 de 3.240 (8,1 %); 4 días, 2 de 3.240 (0,1 %); 5 y 6 días, ninguno. Nada elegido desaparece sin decirlo.
- **P8 a P19:** calendario sin botón (se guarda al segundo toque; comprobado: 15-17 pasó a 19-22), «Lo tienes · Mi banco · 30 €», [Abrir este viaje] pequeño en el Perfil, «Lugares» cuenta ciudades, «Roma» sin «×1» y «×2» desde el segundo, aviso de la Fontana con lunes y viernes, el paseo por Trastevere con la etiqueta lila.
- **P23:** borrada la rama de HOY gratis (y las dos piezas que solo ella usaba).
- **P28:** la caché de fotos vive en la tabla `place_photo_cache` de Supabase. Había 127 filas de Roma con nombres que no son de ningún sitio nuestro (restaurantes, textos de búsqueda, y «Plaza de Espa?a» con la foto del cantante). Quedaron «sin foto» y ya no se enseñan; la regla nueva (`esNombreNuestro`) hace que la caché solo guarde nombres de nuestros datos. **Hay que ejecutar a mano `supabase/migrations/0019_place_photo_cache_limpieza.sql` en Supabase** para borrarlas de verdad.

## 1 · Escuchar historia
Las 31 historias de `HISTORIAS_ROMA.md` están en el campo `historia` de la ficha de su sitio (los 31 encontraron ficha; Via Appia, solo «Via Appia Antica»). La barra de la ficha dice «Escuchar historia» y lee la historia; solo sale en los sitios con historia. Gratis: suena solo la del Coliseo; en los demás sitios con historia sale el candado («Es de la versión completa»). En HOY de pago, «Escuchar» sigue leyendo el Resumen y al lado sale «Historia» si la parada la tiene. Ninguna historia comparte 8 palabras seguidas con su ficha.

## 2 · La ida y la vuelta abiertas
Con el diseño nuevo: tarjeta blanca con «IDA · JUE 15 OCT», el trayecto con el arco de puntos y el icono del medio, los botones de punto y las cuatro casillas (hora, precio, referencia y compañía; «Naviera» en barco). Visto a 375 px con avión, tren, autobús y barco, con fechas y sin fechas. La compañía es un campo nuevo que se guarda con el viaje.

## 3, 4 y 6
«Ver más excursiones» donde sale. Las 6 frases dudosas de las fichas cambiadas con tus textos (Fontana: Océano y la moneda; Panteón: 21 de abril y la cúpula; Navona; San Pedro). La línea de la guía añadida.

## Pruebas
- Pasadas hoy: las tres pruebas nuevas (`pruebaFase6y5_motor`, `_historias` 479, `_pantallas` 247) y las de la 6y4; tipos limpios.
- **Las 365 fechas:** el agente del motor las pasó en su copia con su código final: 815.301 viajes, 2.220.356 días, **0 fallos**; sus pruebas de cierres y de «Si te sobra tiempo» en las 365 fechas también a 0. Falta repetirlas sobre `main` con las tres partes juntas: pendiente para mañana.
- Ajustes mínimos a pruebas anteriores por los cambios de esta tanda están en los informes de cada parte.

## Lo que no he podido ver
- El aviso nuevo de los cierres y la línea nueva de la hoja de reservas en pantalla.
- La voz real de «Escuchar historia» (la prueba la simula).
- Los viajes de prueba que dejé en la nube (ver `PREGUNTAS_TANDA6Y5.md`, punto 13).
