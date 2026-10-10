# Preguntas de la Tanda 6z6

1. **La ficha «Entradas 0/5» y «x de n listo»** en la gratis cuentan el alojamiento solo si el viajero puso su alojamiento («Tu alojamiento»). Con varios destinos la tarjeta lleva solo la cuenta atrás, sin resumen (como antes: el resumen era solo de un destino). ¿Está bien?
2. **«Antes del viaje» del panel de pruebas** simula 10 días antes. La previsión del tiempo solo sale a 5 días o menos: para verla hay que poner una fecha con «Probar otra fecha».
3. **«Cerca de ti» en la gratis:** la pantalla del explorador es la misma que usan el «+» de DÍAS y «Añadir al viaje», así que ahí tampoco hay «Cerca de ti» en la gratis. ¿Está bien, o solo se quita en EXPLORAR?
4. **La ubicación en la gratis:** quedan el botón de localizarte del mapa del explorador y las distancias del buscador de lugares (`PlaceFinderPanel`). ¿Las dejamos o también van de pago?
5. **Fotos en la gratis:** una foto «de todo el día» (sin parada) también cuenta como un sitio: una por día. ¿O las del día no llevan límite?
6. **Viajes sin fechas ni mes** van al final de «los que vienen» en el Perfil.
7. **Los avisos del día** dicen «Santa Maria del Popolo cierra hoy a las 18:00», sin artículo («el Panteón»): no hay una fuente de artículos para las paradas. Y a veces repiten lo que dice la tarjeta de la siguiente parada («Abre 8:30 – 17:00»). ¿Los dejamos así?
8. **El botón «Pruebas»** (solo en local y vistas previas) queda sobre el contenido abajo a la izquierda y tapa un trozo; es solo para ti. ¿Lo subo, lo hago más pequeño o lo muevo?
9. **El globo** del Perfil se ve entero con un viaje; con varios destinos muy separados se aleja hasta que caben todos. ¿Quieres que el primer viaje que vienen (o el último hecho) sea el centro?
10. **«Escuchar»** lee el «por qué» y la descripción en la tarjeta de HOY (HOY no carga la ficha entera) y el Resumen completo en la ficha. ¿Está bien que sea más corto en HOY?
11. **Día completo:** cuenta las paradas con su duración (30 min si no la traen), lo que se anda (como mucho 30 min entre dos) y la comida (60) y la cena (75). Si prefieres otras cifras, están en `src/lib/diaCompleto.ts`.
12. **Las miniaturas** se hacen con 400 px y calidad del 78 %: salen unos 35 KB de media. Si las quieres más ligeras (25 KB) o más nítidas (50 KB), es un número en `fotosViaje.ts` (`CALIDAD_MINIATURA`).
13. **«Tus fotos de hoy»:** al tocar una miniatura se abre la grande; no hay «Eliminar» ahí (se elimina desde el álbum del Perfil). ¿Lo quieres también en HOY?
