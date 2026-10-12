# Preguntas abiertas de la Tanda 6y5

## Motor
1. **El «Ara Pacis delante de todo»:** con las dos reservas a la vez (Altar y Ara Pacis) no hay ninguna pérdida de paradas. Lo único que pasa: dos reservas a la misma hora y el mismo día salen seguidas, y una reserva de las 10:00 sale antes del Coliseo, que es lo que dice la hora. ¿Era eso lo que veías? Si no, necesito tu viaje (fechas, horas y días).
2. **El miércoles de los Museos:** el documento del día del Vaticano mezcla dos cosas: la audiencia del Papa (que solo cambia la Plaza y la Basílica por la mañana) y los días que cierran los Museos. Tiene una variante «el miércoles sin Museos» que quita los Museos aunque abren los miércoles (en los datos solo cierran el domingo). Hoy el orden de los días evita poner el Vaticano en miércoles; solo si no hay más remedio se activa y quita los Museos (330 casos de 58.035 viajes). No he tocado el documento. ¿Dejamos los Museos en miércoles y cambiamos solo la Plaza y la Basílica?
3. **Tope del pool con 1 día:** con tope 3, el 51,7 % de lo elegido no cabe (837 de 1.620); con 2 días el 12,5 %; con 3 días (tope 6) el 8,1 %; con 4 días el 0,1 % y con 5 o 6 días, ninguno. ¿Bajamos a 2 el tope de 1 día o se queda?
4. Las calles «de camino» que la ruta deja de pasar con una reserva grande siguen desapareciendo, no pasan a «Si te sobra tiempo». ¿Vale?

## Historias, fichas y pantallas
5. **«Lleva a pagar»:** la app no tiene pantalla de pago. El candado lanza el evento `trazo:pagar` desde un solo sitio y la barra dice «Es de la versión completa». ¿Vale hasta que exista la pantalla de pago?
6. `GUIA_NUEVOS_DESTINOS.md` dice «Lo de pago no se enseña con candados»; la barra de «Escuchar historia» con candado es la excepción que pediste. ¿Ajusto esa frase?
7. Fontana de Trevi, secretos: sigue la frase «La tradición original no era una moneda, sino beber agua» junto a «echar monedas al agua es mucho más antiguo»; se contradicen un poco. No estaba en tu lista, no la toqué.
8. Baldaquino: se queda el dicho «Lo que no hicieron los bárbaros, lo hicieron los Barberini», que tampoco estaba en tu lista.
9. Tras guardar la hora de la ida o la vuelta, el tramo se cierra, como antes. Para rellenar la referencia y la compañía hay que reabrirlo con «Cambiar». ¿Lo dejamos abierto?
10. Con lugar de compra y precio juntos, la palabra «Cambiar» no cabe en la tarjeta de 220 px: se quita y la tarjeta entera sigue siendo el botón.
11. Nombres ajenos en la caché de fotos (sitios que el viajero añade desde Mapbox): hoy se buscan sin guardarse. Dar «sin foto» directamente es más seguro contra fotos equivocadas, pero esos sitios saldrían sin foto. ¿Cuál prefieres?

## Cosas que tienes que hacer tú
12. **Migración 0019 sin aplicar:** `supabase/migrations/0019_place_photo_cache_limpieza.sql` borra de verdad las 127 filas de la caché de fotos con nombres que no son nuestros (la clave pública no puede borrar). Mientras tanto esas filas están «sin foto» y la foto equivocada ya no sale. Ejecútala a mano en el editor SQL de Supabase. No toqué Barcelona (20 filas) ni «italia» (3).
13. **Viajes de prueba en la nube:** al hacer las comprobaciones a 375 px con un navegador automático quedaron unos 4 viajes de prueba (Roma, 15-17 oct y 22-24 oct, y dos de 20-25 oct) bajo usuarios anónimos que ya no puedo reabrir (la sesión caducó) y sin clave de servicio para borrarlos. Son inofensivos; si quieres, bórralos con SQL en el editor de Supabase (tabla `trips`, los más recientes con destino Roma creados el 12-oct-2026).
