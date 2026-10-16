# Informe: «Por qué te lo recomendamos» en Roma

## Lo que hay hecho
- **94 textos metidos**, uno por sitio, en un campo nuevo `por_que_recomendamos` de `data/pipeline_v2/roma.json`. Son los del documento aprobado (`POR_QUE_RECOMENDAMOS_ROMA.md`), palabra por palabra. El documento tiene 95 nombres; son 94 sitios porque Plaza Colonna y Piazza Colonna eran el mismo (ver abajo).
- **Ningún sitio de Roma se queda sin texto.** Y ninguno habla de la ruta (la prueba lo vigila).
- **En la ficha**, «Por qué te lo recomendamos» sale de ese campo, sin IA. El servidor lo da con el catálogo del destino y la ficha lo pone tal cual.
- **Los sitios que no son nuestros** (otras ciudades, o cualquier sitio sin texto nuestro) siguen con la IA, pero con el pedido cambiado: dice por qué vale la pena el sitio (un icono, lo que lo hace único) y tiene prohibida la logística de la ruta («desde aquí está a cinco minutos…»).

## Plaza Colonna y Piazza Colonna
Eran **el mismo sitio dos veces** (la plaza de la Columna de Marco Aurelio, a unos 60 metros una de otra). Se ha dejado **Piazza Colonna**, que es la que sale en las rutas escritas y tiene su foto, con el texto de «Plaza Colonna». «Plaza Colonna» sigue sirviendo para buscarla (alias).
Para que nada se rompa, los sitios que apuntaban al nombre viejo ahora apuntan al nuevo: las listas de relleno de la zona, los días curados antiguos, la ficha ampliada y los datos de coordenadas y popularidad. Ninguna ruta usa ya «Plaza Colonna».

## Lo que no he podido hacer del todo
- **Borrar los textos viejos de la IA.** La clave que usa la app no puede borrar en esa tabla. Lo he resuelto sin borrar: los textos viejos se guardaban con la clave `describe:…` y ahora la app lee y guarda con `describe2:…`, así que los viejos **ya no se leen nunca** y todo se vuelve a escribir con el pedido nuevo. Quedaba 1 texto viejo guardado (visible desde la app); si quieres limpiarlo de la base, esta línea en el editor SQL de Supabase:
  `delete from place_content_cache where destination like 'describe:%';`
- **Una foto guardada de «Plaza Colonna»** (caché de fotos) se ha dejado «sin foto», como en la limpieza anterior (0019): ese nombre ya no es de ningún sitio nuestro y una prueba antigua lo vigila.
- **Ficha de los sitios sin ficha ampliada:** el texto nuestro sale igual (se pone encima del de la IA). Para esos sitios la IA aún se llama al abrir la ficha por la descripción y los consejos; solo el «por qué» ya no es suyo.

## Pruebas
- Nueva: `scripts/destino/pruebaPorQueRoma.mjs` (207 comprobaciones, 0 fallos): los 94 textos iguales al documento, Colonna, sin logística, rutas sin el nombre viejo, la ficha y el servidor.
- Batería rápida: 70 pruebas, ninguna mal (`pruebaFase6y5_pantallas` pedía la foto de «Plaza Colonna» y se arregló como se explica arriba). El motor de rutas no se ha tocado.
