# Respuesta de Civitatis sobre `POST /v2/search` (23-nov-2026) y cómo se usa ya

Qué estaba mal en nuestra petición (`peticion_search_400.md`): probábamos `text`, `query`, `search`, `q` y `keyword`, con `lang` y `currency` en la dirección y frases largas.

Cómo es:
- `POST /v2/search`, `Authorization: Bearer <token>`, cuerpo JSON.
- `searchText`: el único obligatorio, 3 letras como mínimo.
- `lang` (por defecto español), `currency` y los filtros (p. ej. `destinationId`) van EN EL CUERPO, no en la dirección.
- Excursiones desde Roma: `destinationId: 19` y palabras cortas («Pompeya», «Amalfi», «Tívoli»), no frases.
- Un 400 con el mensaje «Not Found» es una búsqueda sin resultados, no un error: lista vacía.
- El sandbox tiene menos actividades que producción.
- La nota y el nº de opiniones se piden a la ficha de la actividad (`GET /activities/{id}`), no al listado.

Comprobado el 25-nov en el sandbox: responde 200 con una lista de `{ id, title, ... }`. En el código: `buscar(texto, destinoId)` en `server/civitatis/servicio.js` (caché 1 h, `ttl_segundos.busqueda`); `cliente.pedir` guarda ahora un trozo del texto del error (`mensaje`) para reconocer el «Not Found». Prueba a mano: `scripts/destino/civitatisBuscarCinco.mjs`.
