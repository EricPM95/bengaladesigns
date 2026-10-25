# La API de Civitatis (16-oct-2026)

Documentación: https://api.civitatis.com/docs/es/v2/consultive (versión 2.0.2). Contacto de producto: Magalí. Soporte técnico: apisupport@civitatis.com.
Las credenciales del sandbox NO van aquí: Eric las pone en Vercel y en el .env.local como secretos (por ejemplo `CIVITATIS_API_USER` y `CIVITATIS_API_PASSWORD`). Nunca en el código ni en el chat.

## Qué es
- Es la API **de consulta** («consultive»): catálogo, precios, disponibilidad por día y hora y plazas. **No tiene endpoints para reservar ni pagar.** La compra se hace en la web de Civitatis, desde el enlace (`url`) de cada actividad.
- Sandbox: `https://sandbox-api.civitatis.com/v2`, de 7:00 a 2:00 (hora de España). Sus datos son de prueba (hay una lista con disponibilidad infinita: `/activities/infinite-availability`).
- Producción: `https://api.civitatis.com/v2`. Para tenerla hay que pasar una **certificación técnica** al acabar el desarrollo (Civitatis manda el documento).
- Entrar: `POST /auth` con usuario y contraseña → un token con caducidad, que va en la cabecera `Authentication` del resto.
- Límite: 20 peticiones por segundo (1.200 por minuto). Si se pasa: error 429. Un 406 es el cortafuegos de Civitatis.
- Idiomas del contenido: es, en, it, fr, pt, br, mx, ar. Moneda: se pide con `currency` (EUR, etc.). Los precios de los filtros van en céntimos.

## Lo que se puede pedir
| Para qué | Endpoint |
|---|---|
| Pasar de un enlace de Civitatis a su número de actividad | `GET /activities/resolve?url=…` |
| Todo de una actividad | `GET /activities/{id}` |
| Actividades de un destino (con filtros, orden y páginas) | `GET /destinations/{id}/activities` |
| Actividades de una zona | `GET /zones/{zoneId}/activities` |
| Actividades de un sitio, por su Google Place ID | `GET /pois/{poiId}/activities` |
| Actividades cerca de unas coordenadas | `POST /findByCoord` (lat, long, distancia) |
| Buscador por texto | `POST /search` |
| Novedades de un destino | `GET /activities/new-activities` |
| Contadores para filtros (categorías, precios, duraciones, idiomas) | `GET /filters` |
| Disponibilidad y precios de una actividad por día y hora | `GET /calendar/activities/{activityId}?dateFrom&dateTo` |
| Disponibilidad de todo un destino, zona o coordenadas | `POST /calendar/activities` |
| Enlaces de traslados por destino | `GET /destinations/transfers` |
| Países, destinos, zonas, categorías, tipologías | `/countries`, `/destinations`, `/destinations/{id}`, `/destinations/{id}/zones`, `/zones`, `/categories`, `/typologies` |

## Qué trae cada actividad (`GET /activities/{id}`)
- Título, descripciones (con y sin formato), etiquetas destacadas, fotos (cabecera y galería en varios tamaños).
- **Valoración (`score`) y número de opiniones (`reviews`)**, si está entre las 15 más populares del país (`isTopActivity`), popularidad, Golden Tour.
- **Precio** «desde» (`minimumPrice`), precio original (para tachar), moneda, si es **Free Tour**, si el precio cambia según el día.
- Qué incluye y qué no, **política de cancelación** (horas y penalización), duración (mínima y máxima), **hasta cuándo se puede reservar** (`advance`), edad mínima, mínimo y máximo de personas, accesibilidad.
- **Punto de encuentro con coordenadas** (`address`: dirección, latitud, longitud).
- Idiomas del guía, tarifas y categorías (adulto, niño…).
- `url`: la página pública de la actividad en Civitatis.

## Qué trae el calendario (`/calendar/activities/{id}`)
- Por cada día: qué tarifas hay. Por cada tarifa: **las horas** (09:30, 11:00…), **las plazas que quedan** (`quota`; -1 = sin límite), y por tarifa y categoría: **el precio**, los suplementos y las edades.
- Zona horaria de la actividad y si tiene horas fijas.

## Lo que nos permite hacer en la app
1. **Entradas con datos reales:** Coliseo, Vaticanos y Panteón con su precio «desde», su valoración, sus fotos, qué incluye, la cancelación y «reserva hasta…». Fuera los precios provisionales.
2. **Horas de verdad para las reservas:** en «Hora de entrada · encaja con tu ruta», solo las horas que quedan libres ese día (lo que pedía la nota del 3-oct: «con la API, solo las horas libres de ese día»). Y aviso si no queda nada ese día.
3. **Excursiones reales:** las de Roma con su precio y su valoración de verdad (la «valoración media real» de la página de excursiones sale de aquí). Se acaba el `provisional_pricing`.
4. **El Free Tour con sus horas reales**, sacadas de su calendario.
5. **La pestaña Entradas de cada ficha, sola:** con el Google Place ID de cada sitio salen sus actividades.
6. **«Cerca de ti» en HOY:** actividades cerca de donde está el viajero o de su alojamiento.
7. **Traslados:** el enlace de traslados de cada destino (para la ficha de llegada).
8. **Destinos nuevos y Latinoamérica:** la lista de destinos con coordenadas y código de aeropuerto ayuda a curar los 19 destinos que faltan; y el contenido viene también en español de México y de Argentina.
9. **Punto de encuentro en el mapa:** con sus coordenadas, para que la ruta llegue al sitio exacto donde empieza la visita.

## Lo que hay que preguntar a Magalí antes de programar
1. **La comisión:** si al usar el `url` de la API basta con añadir nuestro `aid=5206` y la campaña (`cmp=app`) para que la venta cuente como nuestra, o si hay otra forma.
- **Reservar desde la app: decidido (Eric, 19:35): no nos interesa. Se compra en Civitatis, desde su enlace, y ya.** No se pregunta.
2. **Mostrar su contenido:** si podemos enseñar sus fotos, textos y valoraciones dentro de la app sin poner su nombre (nuestra regla es no nombrar a los proveedores), o si piden que se cite.
3. **Guardar datos:** cuánto tiempo podemos guardar en nuestra base de datos lo que nos da la API (para no pedirlo cada vez).
4. **Producción:** qué incluye la certificación y si el límite de peticiones es el mismo.
5. **Precios:** que `amountType` (PVP o neto) en nuestra cuenta es PVP, el precio final que paga el viajero.

## Cómo lo haría Code (cuando toque)
- Todo desde nuestro servidor, nunca desde el móvil: el usuario y la contraseña de la API no pueden llegar al móvil.
- Guardar las respuestas en Supabase un tiempo (como las fotos de Unsplash), para no pasar del límite y para que la app vaya rápida.
- Empezar por el sandbox; con la certificación, cambiar a producción.

## Las horas de las entradas (Eric, 16-oct, 21:57)
- Al elegir la hora de una entrada, solo salen las horas que quedan libres ese día.
- Con pocas plazas, se dice: «Últimas 3 plazas», «5 plazas disponibles». Siempre con el número real de la API, nunca inventado. Por encima de 10, no se dice nada.
- Al abrir el selector de hora, el calendario se pide de nuevo (sin caché larga), para que las plazas estén al día.
- Si el viajero ya tiene su entrada («Ya tengo mi entrada»), puede poner la hora que sea: la app avisa, no prohíbe.
- Design: dibujar el selector de hora con las plazas (va en el paso 3 o 4).

## Lo que encontró Code en el sandbox (parte 1, 16-oct, 22:24; commit dfa841d)
- Roma sí está (destino 19): 36 actividades y traslados.
- De nuestros 8 enlaces se resuelven 3: Free Tour (2671), Florencia y Pisa (142547), Ostia Antica (2283). No se resuelven: Pompeya y Sorrento, Nápoles y Pompeya en tren, Costa Amalfitana, Florencia en tren y Tívoli (siguen con precio y nota provisionales). Las entradas se emparejaron a mano con 9 sitios.
- Errores o dudas de la documentación, para decírselo a Civitatis (nos pidieron feedback):
  - la cabecera no es `Authentication` como dice la documentación: funciona `Authorization: Bearer <token>`;
  - el sandbox da enlaces a qa.civitatis.com (la app los cambia a www.civitatis.com);
  - la nota: ¿es de 0 a 10? Code la divide entre 2 para dejarla de 0 a 5 (suposición);
  - la nota y las opiniones de la lista no coinciden con las de la ficha (Code usa las de la ficha);
  - el precio de los Vaticanos sale 16.500 € en el sandbox (79 € en su calendario): Code descarta precios de más de 2.000 €.
- Pendiente: Eric abre un par de enlaces de «Reservar» con la API encendida y comprueba que abren la actividad en la web real.
- Migración 0022 (caché), sin aplicar: va después de la 0020 y la 0021, pero no depende de ellas.
- El punto de encuentro, de momento, es un enlace «Ver en el mapa», no una chincheta en nuestro mapa.

## Decisiones (Eric, 16-oct, 23:21)
- El «412 lo recomiendan» del Coliseo (`megusta_inicial`, aproximado a las redes de Eric) se queda como está.
- La contraseña del sandbox se queda como está.
- «Reservar» va directo a Civitatis (no pasa por el selector). Encima del botón, una etiqueta verde con la hora recomendada: «Te recomendamos reservar a las 11:00» (la hora libre que mejor encaja con su ruta), más «· Últimas 3 plazas» si quedan 10 o menos. Si ese día no queda nada: «Ese día no quedan plazas» y el otro día del viaje que sí tiene. Sin fechas o sin la API, no sale nada.

## Tanda 10O (25-oct): caché a 4 horas, encendida solo para admin, datos tal cual
- **Caché:** `catalogo`, `actividad`, `traslados`, `cerca` y `resolver` a 14400 s (4 h) en `data/civitatis/ajustes.json`; el calendario, 3600 s. El código recorta cualquier valor mayor a 14400 (`TTL_MAXIMO_SEGUNDOS` en `server/civitatis/cache.js`): lo pidió el proveedor el 19-oct.
- **Interruptor del servidor** `CIVITATIS_API_ACTIVA`: `true` = para todos; `admin` = solo para los emails de `LOGROS_ADMIN_EMAILS` (el servidor mira el token de la sesión en cada petición, `server/civitatis/permiso.js`); vacío o `false` = para nadie. El de la app (`VITE_CIVITATIS_ACTIVA=true`) solo hace que la app pregunte; la decisión es del servidor.
- **Tal como vienen:** la nota (0–10) y el nº de opiniones pasan sin redondear ni reescribir; la app no resume ninguna descripción de la API (las descripciones de las excursiones salen de roma.json).
