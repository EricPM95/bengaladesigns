# Petición `POST /search` que da el error 400 (sandbox de la API de Civitatis)

Preparada para enviársela al proveedor. NO lleva el token ni ninguna clave: donde iría el token se lee `<TOKEN>`. No se ha enviado nada ni se ha hecho ninguna petición con claves para escribir este documento: está sacada del código que ya llama a `/search` (`scripts/destino/civitatisBuscarCinco.mjs`, que usa el cliente `server/civitatis/cliente.js`).

## Entorno

- Sandbox: `https://sandbox-api.civitatis.com/v2` (el sandbox solo responde de 7:00 a 2:00, hora de España).
- Autenticación previa: `POST /auth` con `{ "username": "<USUARIO>", "password": "<CLAVE>" }` → `{ "token": "<TOKEN>", "expiresIn": "<fecha>" }`.
- Detalle que ya les consta: la documentación dice que el token va en una cabecera `Authentication`, pero el sandbox la rechaza («JWT Token not found»); la que funciona es `Authorization: Bearer <TOKEN>` (comprobado el 16-oct-2026). Con esa cabecera `/destinations` y `/destinations/{id}/activities` responden bien.

## La petición

```
POST https://sandbox-api.civitatis.com/v2/search?lang=es&currency=EUR
Authorization: Bearer <TOKEN>
Accept: application/json
Content-Type: application/json
```

Cuerpo (probamos cinco formas, todas con el mismo resultado; el texto cambia según lo que buscamos):

```json
{ "text": "Pompeya Sorrento desde Roma" }
```

```json
{ "query": "Pompeya Sorrento desde Roma" }
```

```json
{ "search": "Pompeya Sorrento desde Roma" }
```

```json
{ "q": "Pompeya Sorrento desde Roma" }
```

```json
{ "keyword": "Pompeya Sorrento desde Roma" }
```

Otros textos con los que lo probamos: «Nápoles Pompeya tren desde Roma», «Costa Amalfitana desde Roma», «Florencia tren alta velocidad desde Roma», «Tívoli Villa d'Este Villa Adriana desde Roma».

## La respuesta

- Estado: `400` (en las cinco formas de cuerpo).
- Cuerpo de la respuesta: **completar con la respuesta real.** Nuestro cliente (`pedir` en `server/civitatis/cliente.js`) solo guarda el estado (`{ ok: false, motivo: 'no_disponible', estado: 400 }`) y no el texto del error, así que en el repositorio no está. Para completarlo hay que repetir UNA petición desde `scripts/destino/civitatisBuscarCinco.mjs` (o con `curl`) dentro del horario del sandbox y copiar aquí las cabeceras y el cuerpo del 400, sin el token.
- Cabeceras de la respuesta: **completar con la respuesta real.**

## Lo que les preguntamos

¿Cuál es el cuerpo correcto de `POST /search` (nombres de los campos, obligatorios y opcionales, y si `lang` y `currency` van en la dirección o en el cuerpo)? Lo queremos para encontrar excursiones «desde Roma» (Pompeya, Costa Amalfitana, Florencia en tren, Tívoli) que no aparecen en las actividades de los destinos cercanos.
