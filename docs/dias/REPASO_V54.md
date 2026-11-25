# REPASO V54: los avisos de arriba y las entradas en peligro

## Qué he cambiado (palabras sencillas)
- **Avisos de arriba:** ahora son una sola fila (icono, título, sitio en gris, botón). Rojo = urgente, amarillo = informativo, azul = el tiempo, verde = «Tranquilo…». Los del mismo tipo se juntan en una frase; si hay de tipos distintos, se ve el más urgente con «+x» y al tocarlo salen todos, con «Ocultar avisos» abajo. Ninguno con botón se va solo (se va al resolverse o deslizándolo hacia arriba); solo el verde, a los 5 s. Los avisos de abajo sin [Deshacer] ya no se juntan en un texto largo: van de uno en uno.
- **Puntualidad de las entradas:** cada destino tiene `data/dias/<destino>/_puntualidad.json` y `src/lib/puntualidadEntradas.ts`. Solo una entrada **estricta** da el aviso rojo («Si no sales ya, no llegas a tu entrada de las 9:15 en el Coliseo»). Una libre (Foro y Palatino) da el verde si el retraso cabe o el amarillo «Vas con retraso» si no. Una estricta que ya pasó sale amarilla («ya ha pasado») y no se protege.
- **Fuera «Una solución»:** eran tres hojas: `PeligroHoy.tsx` (entrada en peligro), `MasTiempo.tsx` («Necesito más tiempo») y `HorarioHoy.tsx` («A este ritmo llegarías…»). Las tres usan ahora `HojaSolucion.tsx` (la pieza A2 de la V50, «Pasar a otro día»): tarjeta con la foto real, franja verde, botón dorado con la acción y [Elegir otro día]. Primero propone pasarlo al mejor día; solo si no cabe, a Lugares pendientes. El motor (`hoyPeligro.ts`, `hoyHorarios.ts`) ya no manda nada «a la tarde» ni usa «dejar».
- **Pieza copiada:** las filas copian el dibujo «Avisos Hoy Compactos»; la hoja copia la de «Pasar a otro día» (V50).

## Puntualidades y su web (comprobado 25-nov)
### roma
- Coliseo · estricta · confirmado · https://colosseo.it/biglietti/24h-colosseo-foro-romano-palatino/
- Foro Romano y Palatino · libre · confirmado · https://colosseo.it/biglietti/24h-colosseo-foro-romano-palatino/
- Fontana de Trevi · libre · confirmado · https://fontanaditrevi.roma.it/
- Panteón · estricta · confirmado · https://cultura.gov.it/luogo/pantheon
- Museos Vaticanos y Capilla Sixtina · estricta · NO confirmado (estricta por defecto) · https://www.museivaticani.va/content/museivaticani/it/organizza-visita/tariffe-e-biglietti.html
- Castillo de Sant'Angelo · libre · confirmado · https://cultura.gov.it/luogo/castel-santangelo
- Galería Borghese · estricta · NO confirmado (estricta por defecto) · https://galleriaborghese.cultura.gov.it/en/visita/
- Bioparque de Roma · libre · confirmado · https://www.bioparco.it/en/tickets/
- Galería Nacional de Arte Moderno · estricta · NO confirmado (estricta por defecto) · https://gnamc.cultura.gov.it/en/informazioni-per-la-visita/
- Altar de la Patria · libre · confirmado · https://vive.cultura.gov.it/_cms/sites/default/files/determina/Allegato_1_Regolamento%20biglietteria-signed.pdf
- Mercados de Trajano · estricta · NO confirmado (estricta por defecto) · https://www.mercatiditraiano.it/it/infopage/acquista
- Cúpula de San Pedro · estricta · NO confirmado (estricta por defecto) · https://www.basilicasanpietro.va/en/products/the-dome
- Ara Pacis · estricta · NO confirmado (estricta por defecto) · https://www.arapacis.it/en/node/516
- Museos Capitolinos · estricta · NO confirmado (estricta por defecto) · https://www.museicapitolini.org/en/node/2017
- Domus Aurea · estricta · NO confirmado (estricta por defecto) · https://colosseo.it/biglietti/domus-aurea/
- Termas de Caracalla · estricta · NO confirmado (estricta por defecto) · https://cultura.gov.it/luogo/terme-di-caracalla
- Villa Farnesina · estricta · NO confirmado (estricta por defecto) · https://www.villafarnesina.it/en/opening-hours-and-info/
- Palazzo Doria Pamphilj · estricta · NO confirmado (estricta por defecto) · https://www.doriapamphilj.it/en/visit/
- Catacumbas de San Calixto · estricta · NO confirmado (estricta por defecto) · https://www.catacombesancallisto.it/en/biglietti.php
- Cripta de los Capuchinos · estricta · NO confirmado (estricta por defecto) · https://museoecriptacappuccini.it/
- Basílica de San Clemente · estricta · NO confirmado (estricta por defecto) · https://www.basilicasanclemente.com/eng/opening-hours-and-info/
- Free Tour · estricta · NO confirmado (estricta por defecto) · sin web
### lanzarote
- Montañas del Fuego (Timanfaya) · estricta · confirmado · https://ventaonline.cactlanzarote.com/en/product/17
- Jameos del Agua · libre · confirmado · https://ventaonline.cactlanzarote.com/en/tickets/jameos-del-agua-ticket
- Cueva de los Verdes · estricta · confirmado · https://ventaonline.cactlanzarote.com/en/tickets/cueva-de-los-verdes-ticket
- Mirador del Río · libre · confirmado · https://ventaonline.cactlanzarote.com/en/tickets/mirador-del-rio-ticket
- Jardín de Cactus · libre · confirmado · https://ventaonline.cactlanzarote.com/en/tickets/jardin-de-cactus-ticket
- Castillo de San José (MIAC) · libre · confirmado · https://ventaonline.cactlanzarote.com/en/tickets/international-museum-contemporary-art-castillo-de-san-jose-ticket
- Fundación César Manrique · estricta · NO confirmado (estricta por defecto) · https://fcmanrique.org
- Haría y la Casa-Museo César Manrique · estricta · NO confirmado (estricta por defecto) · https://fcmanrique.org
- La Geria y sus bodegas · estricta · NO confirmado (estricta por defecto) · https://stratvs.com/en/visitas-agenda/
- Playas de Papagayo · estricta · NO confirmado (estricta por defecto) · sin web

Ninguna web oficial da un margen en minutos, así que no hay ningún «margen».

## Lanzarote
Es lo mismo en el código; solo cambian los datos. La Cueva de los Verdes (estricta) da el aviso rojo; los Jameos del Agua (libres, entrada «sin hora») dan el verde. Capturas `v54_4_lanzarote_*.jpg`. La API se reinició con DESTINOS_OCULTOS='-' solo para esto y se ha dejado normal.

## Qué no he podido comprobar
- Los sitios marcados «NO confirmado» van como estrictos (ver DECISIONES_V54.md).
- Panteón: la web oficial no carga desde esta red; se leyó a través de cultura.gov.it. Altar de la Patria: leído en un resumen de búsqueda, no en el PDF. Las franjas de Roma pueden haber cambiado desde el 1 de julio de 2026.
- La fila azul de lluvia está hecha pero no la he visto en captura (necesita el tiempo real).
- Las hojas de «Más tiempo» y «llegarías tarde» comparten pieza con la de peligro, pero no las he capturado.
- Otros avisos de HOY (los cierres de la mañana, «¿Cómo vais?», cerca de ti, instalar avisos, los carteles de viento/nubes) siguen con su tarjeta de antes y participan en el orden y en el «+x»; no los he convertido a la fila nueva.
- Sin pruebas por orden de Eric (solo tsc y build). No hecho: commit ni push.
