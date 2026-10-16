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
