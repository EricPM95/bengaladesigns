Hola. TANDA V4: LAS COLECCIONES DE LANZAROTE, BIEN HECHAS (15-nov). Va después de la V2. Necesita la pieza nueva de Design (punto 3). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v4.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción.

Todo en `data/logros/lanzarote.json` (y lo que dependa). Las paradas de los días (`data/dias/lanzarote/_paradas.json`) no se separan: una parada puede llevar a dos sitios de logro.

## 1. «Entre viñas de ceniza»: de 1 a 3 sitios
- **Hoy solo tiene `la_geria_y_sus_bodegas`** y en el viaje salía «0 de 1». Design ya dibujó la insignia con 3 piezas.
- **Añade como sitios de logro** las dos bodegas que ya son paradas: `bodega_el_grifo` y `bodega_la_geria`, cada una con su radio pequeño (unos 200 m).
- **Ojo con el radio de La Geria (3.000 m):** Bodega La Geria cae dentro. Mira que una foto en una bodega no dé también La Geria sin querer; si hace falta, ajusta los radios y dime cómo quedan.
- **Cada pieza de la insignia,** con su sitio, como Design.

## 2. Un sitio es una sola cosa: separar los «dos en uno»
| Hoy (un sitio) | Separado | Colecciones |
|---|---|---|
| `caleta_de_famara_y_playa_de_famara` | Caleta de Famara · Playa de Famara | Pueblos con alma · Playas y charcos |
| `el_golfo_y_el_charco_de_los_clicos` | El Golfo (el pueblo) · Charco de los Clicos | Pueblos con alma · Playas y charcos (e Imprescindibles: el Charco) |
| `haria_y_la_casa_museo_cesar_manrique` | Haría (el pueblo) · Casa-Museo César Manrique | Pueblos con alma · La Lanzarote de Manrique |

- **Cada uno con sus coordenadas y su radio:** el pedazo del pueblo, en el pueblo; el de la playa o el charco, allí. Dime los radios.
- **El emblema «El charco verde»** va con el Charco de los Clicos.
- **Lo ya ganado no se pierde:** quien tenga el sitio viejo gana los dos nuevos (con la misma fecha). Dime cuántos pedazos se convierten en producción (solo leyendo; si hace falta SQL, listo para pegar con COMPROBAR).
- **Los nombres, las fotos y los textos** de los sitios nuevos, como los demás. Si falta foto, dímelo.

## 3. Puerto del Carmen en «Pueblos con alma» (de 5 a 6)
- **Nuevo sitio de logro** desde la parada `puerto_del_carmen_puerto_viejo` (el Puerto Viejo), con su radio.
- **La pieza nueva de la insignia** (la ventana blanca con las contraventanas verdes, arriba a la izquierda) y la insignia de 6 piezas: en el zip de Design `colecciones.zip` (Descargas). Pon al día `docs/diseno/proyecto/`, sin `uploads/` ni `Archivo/`.
  - **Cambian:** `Piezas/Insignia Lanza Pro.dc.html`, `Colecciones Lanza.dc.html` y `Dashboard.dc.html`.
  - **Nueva:** `screenshots/col6-new.png`.
  - La tarjeta, «6 sitios · La isla de verdad», como Design.
- **Su foto:** `puerto_del_carmen.webp` en Descargas (el paseo marítimo). Úsala para la parada y el sitio, como las demás fotos de Lanzarote, y apúntala en la lista de derechos de las fotos como foto propia de Eric (sin problema de derechos).

## 4. Repaso de las colecciones
- **Ninguna colección con menos de 3 sitios.**
- **Las paradas sin colección** (Castillo de Santa Bárbara, Mirador de los Helechos, LagOmar, Playa Blanca, Faro de Pechiguera, Marina Rubicón, Playa del Reducto, Playa de Mujeres y Mancha Blanca): no las metas. Solo pásame la lista, para que Eric decida.
- **Caldera Blanca** está en «Tierra de fuego», pero no es parada de ninguna ruta, solo su salida (Mancha Blanca). Dime cómo la consigue un viajero.

## 5. La prueba
- `pruebaJutrip` y las de logros de Roma y de Lanzarote en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV4`:**
  - las 7 colecciones con sus sitios (Entre viñas 3, Pueblos con alma 6);
  - una foto en Caleta de Famara da solo el pedazo del pueblo, y una en la playa solo el de la playa;
  - una foto en Bodega La Geria no da La Geria sin querer;
  - lo ganado antes se convierte en los dos sitios nuevos;
  - el emblema del charco sigue saliendo.
- **En el REPASO:**
  - capturas de las insignias de «Entre viñas» y «Pueblos con alma»;
  - la tabla de radios;
  - la lista del punto 4;
  - tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga y que «Colecciones» de Lanzarote se ve bien. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
