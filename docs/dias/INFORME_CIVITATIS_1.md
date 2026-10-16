# Informe: la API de consulta, parte 1 (sandbox)

16-oct-2026. Todo detrás de interruptores apagados: la app que ve la gente es la de hoy. No se ha tocado el motor de rutas (nada de `shared/routeEngine` ni de `server/engine`). La compra sigue siendo en la web de Civitatis, desde su enlace: no se reserva ni se cobra nada dentro de la app. Ninguna clave se ha enseñado: ni en este informe, ni en la consola, ni en las pruebas, ni en los ficheros guardados.

## En una frase
La conexión, la caché y todo lo que pedías (a–h) están montados y probados contra el sandbox de verdad. Con los interruptores encendidos, Roma sale con datos reales en las entradas, las horas libres, dos excursiones, el Free Tour, los traslados y las actividades de cada sitio. Con ellos apagados no cambia nada.

## 1. Qué hay en el sandbox

**Roma sí está** (destino número 19) y tiene actividades y traslados. El sandbox tiene 4.217 destinos (3.761 con actividades, 811 con traslados). En Roma salen **36 actividades**; las que nos importan:

| Qué | Número |
|---|---|
| Coliseo, Foro y Palatino + Arena de gladiadores | 3834 |
| Visita guiada por el Coliseo, Foro y Palatino | 83 |
| Coliseo subterráneo y Arena + Foro y Palatino | 47029 |
| Visita guiada por los Museos Vaticanos y Capilla Sixtina | 84 |
| Entrada al Panteón sin colas / Visita guiada por el Panteón | 170340 / 2023 |
| Visita guiada por la Basílica de San Pedro | 75875 |
| Free Tour por Roma (y otros cuatro free tours) | 2671 (y 6161, 28115, 120417, 125646) |
| Castillo de Sant'Angelo con audioguía · Museos Capitolinos · Catacumbas · Cripta de los Capuchinos | 175270 · 2026 · 185 · 33202 |
| Excursión a Florencia y Pisa · Excursión a Ostia Antica | 142547 · 2283 |
| Autobús aeropuerto Fiumicino–Roma · Ciampino–Roma | 79691 · 79757 |

El enlace de traslados de Roma también está (`/destinations/transfers`).

**Qué enlaces nuestros se resuelven** (`GET /activities/resolve`, 8 enlaces):
- **Sí (3):** el Free Tour (→ 2671), la excursión a Florencia y Pisa (→ 142547) y la de Ostia Antica (→ 2283).
- **No (5):** Pompeya y Sorrento, Nápoles y Pompeya en tren, Costa Amalfitana, Florencia en tren y Tívoli (Villa d'Este y Villa Adriana). Los enlaces los armamos nosotros a partir del `civitatis_slug` de `roma.json`; o esos nombres no son los de verdad, o esas excursiones no están en el catálogo de Roma del sandbox. Siguen con precio y nota provisionales, y con su búsqueda de siempre.
- **Las entradas** (Coliseo, Vaticanos, Panteón…) **no tenían enlace** en nuestros datos (`url: null`, iban a una búsqueda), así que no hay nada que resolver: las he emparejado a mano con las actividades de la tabla (`data/civitatis/roma.json`).

**¿Son los números del sandbox los de la web de verdad?** Parecen que sí: la API resuelve nuestros enlaces de la web de verdad (`www.civitatis.com/es/roma/free-tour-roma/`) al número 2671 y devuelve la actividad con su mismo nombre y su misma dirección. **Pero no lo puedo asegurar** (el sandbox es de pruebas y sus datos son de prueba). Para producción hay que repetir la comprobación: `node scripts/destino/civitatisExplorar.mjs` (con `CIVITATIS_API_ENV=production`) vuelve a resolver todos los enlaces y enseña si algún número cambia.

**Cosas raras que he encontrado** (importan para producción; hay que preguntarlas a Civitatis):
1. **La cabecera de entrada.** La documentación dice que el token va en una cabecera `Authentication`. En el sandbox eso da «JWT Token not found»; lo que funciona es `Authorization: Bearer <token>` (comprobado). Está en un solo sitio (`server/civitatis/cliente.js`).
2. **Los enlaces del sandbox son de un servidor de pruebas** (`qa.civitatis.com`). La app los cambia siempre a la web de verdad (`www.civitatis.com`) antes de enseñarlos. No he podido comprobar que la ruta de cada actividad (`/es/roma/tour-coliseo-arena-gladiadores`) exista igual en la web de verdad: **te pido que abras un par de los enlaces** (los de «Reservar» con la API encendida) y me digas si abren la actividad.
3. **El precio «desde» de los Museos Vaticanos sale como 16.500 €** en el sandbox (en su calendario cuesta 79 €). La app descarta cualquier precio por encima de 2.000 € y usa el más barato de adulto del calendario; si tampoco hay, el de nuestros datos (`precio_maximo_creible_eur`, en `data/civitatis/ajustes.json`).
4. **Las notas y las opiniones no coinciden entre la lista y la actividad** (el Coliseo 3834 sale con 8,8 y 2.068 opiniones en la lista, y con 9,3 y 16.210 en su ficha). La app usa siempre las de la ficha.
5. **La nota va de 0 a 10** (he visto 9,3, 10 y 5) y la app, de 0 a 5: se divide entre 2. Es una suposición; que Civitatis la confirme.
6. **Las horas del Free Tour en el sandbox son las 10:00 y las 17:00** (datos de prueba); las nuestras de verdad son seis. En producción saldrán las de su calendario.
7. **Aparece «Seguro de viaje» como si fuera una actividad** de Roma. No lo usamos.

## 2. Qué he montado y cómo se ve

Los interruptores (los tres, apagados por defecto):
- **Servidor:** `CIVITATIS_API_ACTIVA=true` enciende la API en el servidor; `CIVITATIS_API_ENV=sandbox|production` elige el entorno (sandbox si no se pone).
- **App:** `VITE_CIVITATIS_ACTIVA=true`; en desarrollo también vale `?civitatis=on` en la dirección (y `?civitatis=off`). Hacen falta **los dos** (servidor y app): la app pide los datos reales solo si lo ha encendido, así que aunque el servidor la tenga, quien no la ha encendido ve lo de hoy. Comprobado: las respuestas de `/api/destination-excursions` son idénticas con y sin la API en el servidor cuando la app no la pide.

**La conexión** (`server/civitatis/`): solo desde nuestro servidor; entra con `POST /auth`, guarda el token y lo renueva un minuto antes de que caduque (`expiresIn`); una sola entrada aunque lleguen muchas peticiones juntas; **ocho peticiones por segundo como mucho** (el límite es 20) y, si llega un 429, espera y reintenta hasta tres veces. El usuario, la contraseña y el token nunca llegan al móvil (ningún fichero de `src/` los nombra; la prueba lo comprueba). Si la API está apagada, caída, fuera de horario o no tiene el dato, devuelve `{ ok: false, motivo }` con un 200 y la app hace lo de hoy (nuestros datos y nuestros enlaces); la app avisa, no prohíbe.

**La caché** (`server/civitatis/cache.js`): primero memoria, luego Supabase, luego la API; si la API cae y hay algo guardado (aunque caducado), se usa eso. Cuánto vive cada cosa está en `data/civitatis/ajustes.json › ttl_segundos` (catálogo y actividad un día, calendario una hora, traslados un día, resolver una semana): **provisional, hasta que Civitatis diga cuánto se puede guardar**. Para guardar en Supabase hace falta la migración `0022_civitatis_cache.sql` (sin aplicar); sin ella la caché sigue en memoria.

**a) Las entradas con datos reales.** La pestaña «Entradas» de la ficha del Coliseo, el Foro, el Panteón, los Vaticanos, el Castillo, los Capitolinos, las Catacumbas, la Cripta de los Capuchinos y el Free Tour pasa a enseñar las actividades de verdad (hasta dos por sitio): foto, nota y opiniones, precio «desde» (y el original tachado si lo hay), qué incluye y qué no, la cancelación («Cancelación gratuita hasta 32 días antes»), hasta cuándo se puede reservar («Se puede reservar hasta 3 horas antes»), la duración y el punto de encuentro con su enlace al mapa. Lo que la API no da, no sale. El Free Tour dice «Gratis». Un sitio sin actividad (la Fontana de Trevi, el Altar de la Patria…) se queda con su entrada de siempre. **Las entradas de la API sustituyen a las nuestras** en esos sitios (no se suman), para no enseñar dos «Coliseo» seguidos.

**b) Las horas libres.** En «Hora de entrada», con fechas, la rueda enseña solo las horas que quedan libres ese día según el calendario del Coliseo (y el Foro, que es la misma entrada), los Vaticanos, el Panteón y el Free Tour. Si en una hora quedan **10 plazas o menos**, se dice con el número real de la API: «Última plaza», «Últimas 3 plazas» (hasta 3), «5 plazas disponibles» (de 4 a 10). Con más de 10, o sin límite, no se dice nada. **Nunca un número inventado.** Si ese día no queda ninguna hora: «Ese día no quedan horas libres. Prueba otro día.» (y la rueda sigue como antes). **Al abrir el selector se pide el calendario de nuevo, sin la caché de una hora**, para que las plazas estén al día. **«Ya tengo mi entrada»:** una casilla bajo la rueda deja poner cualquier hora; si no sale en el calendario, avisa («Esa hora no sale libre en el calendario. Como ya tienes tu entrada, la dejamos.»). El motor no cambia: solo cambian las horas que se pueden elegir. Una sola actividad por sitio da las horas (la principal), porque con dos no se sabría de cuál son las plazas.

**c) Las excursiones.** Florencia y Pisa y Ostia Antica pasan a tener su precio, su nota y sus opiniones reales (`provisional_pricing` pasa a falso) y su enlace directo; las otras cinco siguen provisionales hasta que se resuelvan. La «valoración media» de la página de excursiones se calcula con las que tienen datos reales (hoy, con el sandbox: 3 excursiones, 88 %).

**d) El Free Tour** con sus horas reales: salen del calendario (como en b: la hoja del Free Tour enseña las horas de ese día; en el sandbox, las 10:00 y las 17:00).

**e) La pestaña «Entradas» de cada ficha.** Nuestros sitios **no traen el número de lugar de Google** (ninguno en `roma.json`), así que la API los busca por **coordenadas con un radio de 300 metros** (`POST /findByCoord`). Un sitio sin entradas escritas a mano ni «No necesitas entrada» gana la pestaña si hay actividades cerca (ejemplo: junto al Coliseo salen seis).

**f) Los traslados.** El enlace de traslados de Roma (con nuestro `aid`) sale en la pestaña «Traslados» de la ficha de llegada y de vuelta; si la API no lo da, el de siempre.

**g) Los enlaces de compra.** Todos con `aid=5206` y la campaña de cada viaje, como hoy. El código está **en un solo sitio**: `shared/affiliate/civitatis.js › CIVITATIS_AID`. La app añade la campaña al pulsar (`openTicketShop`), como los demás enlaces. A la espera de que Civitatis confirme que así la venta cuenta como nuestra.

**h) Los textos.** Ningún texto de las pantallas nuevas nombra a la empresa. Las líneas que la API trae y la nombran se quitan, y la cancelación se escribe nuestra (no la de la API).

## 3. Lo que tienes que hacer tú, fuera del código
No me pegues ninguna clave en el chat.
1. **Comprobado:** `CIVITATIS_API_USER` y `CIVITATIS_API_PASSWORD` están en el `.env.local` (no he visto sus valores, solo que existen y su longitud). Tú has dicho que también están en Vercel como Secret.
2. **Para probarlo en tu ordenador:** en el `.env.local` pon `CIVITATIS_API_ACTIVA=true` y `VITE_CIVITATIS_ACTIVA=true` (o abre la app con `?civitatis=on`), reinicia el servidor y abre una ruta de Roma. Solo de 7:00 a 2:00 hora de España.
3. **En Vercel, de momento, no pongas ninguna de las dos** (`CIVITATIS_API_ACTIVA`, `VITE_CIVITATIS_ACTIVA`): la gente ve lo de hoy.
4. **La migración `0022_civitatis_cache.sql`** (sin aplicar). Va **después** de la 0020 y la 0021, pero **no depende de ellas**: se puede aplicar sola cuando vayas a encender la API. Sin ella todo funciona, solo que la caché vive únicamente en memoria (en Vercel se pierde al apagarse cada instancia, así que se pedirá más a la API).
5. **Abre un par de enlaces de «Reservar»** (punto 1.2) y dime si abren la actividad en la web de verdad.

## 4. Lo que depende de la respuesta de Civitatis
1. **La comisión:** si basta con `aid=5206` y la campaña (`cmp=…`) en el enlace de la API para que la venta cuente como nuestra. **Está en un solo sitio** (`shared/affiliate/civitatis.js`) para cambiarlo fácil.
2. **Cuánto tiempo podemos guardar** lo que da la API: hoy un día y una hora (`data/civitatis/ajustes.json`).
3. **Si hay que citar la fuente:** hoy la app no nombra a la empresa en ningún texto.
4. **Producción:** qué incluye la certificación y si el límite es el mismo (20 por segundo; la documentación dice también 1.200 por minuto, que no cuadra con 20 por segundo).
5. **Que el precio sea PVP** en nuestra cuenta (el sandbox lo dice: `amountType: PVP`).
6. **Las rarezas de arriba:** la cabecera `Authorization: Bearer`, los enlaces `qa.`, el 16.500 €, la nota de 0 a 10 y que los números de actividad sean los mismos en producción.

## 5. Para la certificación y para pasar a producción
Lo que sabemos: Civitatis manda un documento de certificación técnica al acabar el desarrollo; sin él no hay producción (`https://api.civitatis.com/v2`). Lo que ya cumplimos por diseño y se puede demostrar con la prueba: todo pasa por nuestro servidor; el token se renueva antes de caducar; muy por debajo del límite y con espera ante un 429; respuestas guardadas para no repetir peticiones; nada de la API en el móvil; los fallos no rompen la app; el precio que se enseña es el PVP. Lo que quedaría para pasar: pedir el documento; encender el entorno de producción con **credenciales de producción** (nuevas, en Vercel como Secret; `CIVITATIS_API_ENV=production`); **volver a resolver los enlaces** y ver si algún número cambia; volver a pasar `pruebaCivitatis1` y la batería; y comprobar con el equipo de Civitatis lo de la comisión y lo de guardar datos. Sugerencia: pedirles también un usuario de pruebas con disponibilidad fuera del horario del sandbox.

## 6. La prueba
`node scripts/destino/pruebaCivitatis1.mjs`: **133 comprobaciones, 0 fallos**, con respuestas del sandbox guardadas en `scripts/destino/fixtures/civitatis/` (sin ninguna clave): el token y su renovación, el 429, el ritmo, la caché (memoria y Supabase), la API caída (la app hace lo de hoy), el enlace con `aid=5206` y sin `qa.`, las horas libres y las plazas con su número real (y nunca otro), el día sin plazas, las entradas, las excursiones, el Free Tour, las actividades cerca, los traslados, el interruptor de la app y «Ya tengo mi entrada», y que ninguna clave ni dirección de la API esté en `src/`. Al final hay cuatro comprobaciones contra el sandbox de verdad (solo si estás dentro de su horario y están las claves; si no, se saltan sin contar como fallo). Está en la batería rápida.

**Batería rápida** (83 pruebas, sin `pruebaFase6y5_motor`, que no se toca: el motor no ha cambiado): todas en 0 fallos, incluidas `pruebaCivitatis1` (133) y `pruebaCuentas1`. Una, `pruebaTanda7_ficha`, falló la primera vez porque el código de la hoja de llegada nombraba a la empresa en una ruta de importación (esa prueba lo prohíbe); el enlace de traslados vive ahora en `src/lib/enlaceDeTraslados.ts` y vuelve a 0. `tsc -p tsconfig.app.json` sin errores. Con el servidor del sandbox de verdad encendido, la app pidiendo `civitatis: true` devuelve el Coliseo con 53 €, 4,7 y 16.210 opiniones, y sin pedirlo (o con el servidor apagado) devuelve exactamente lo de hoy (comparadas las respuestas byte a byte).

## Riesgos y lo que no he podido hacer
- **No lo he visto en pantalla.** Probé todo lo de dentro (servidor, datos, funciones de la hoja de la hora) y el servidor contra el sandbox de verdad, pero no he abierto la app en un navegador con el interruptor encendido. Las pantallas nuevas (datos de la entrada, plazas, «Ya tengo mi entrada», actividades del sitio) son provisionales y con el estilo de las de al lado.
- **El punto de encuentro en el mapa** es un enlace «Ver en el mapa» con sus coordenadas, no una chincheta dentro de la app (un mapa más dentro de cada ficha daría problemas de rendimiento, como ya pasó). Si lo quieres con chincheta en el mapa del día, va con Design.
- **El sandbox solo funciona de 7:00 a 2:00**, y sus datos son de prueba: lo que se vea con el interruptor encendido en desarrollo (horas del Free Tour, plazas, precios) no es lo de producción.
- **La nota (0–10 → 0–5)** y que **los números de actividad coincidan con producción** son suposiciones.
- **Las entradas de la API sustituyen a las nuestras** en 9 sitios. Si prefieres que se sumen, es cambiar una línea (`enriquecerEntradas` en `server/civitatis/servicio.js`).
- **Las cinco excursiones sin resolver** siguen provisionales. Hay que encontrar su actividad en el catálogo (con `POST /search` o en otros destinos) o corregir sus enlaces.
- **«Cerca de ti» en HOY, reservar o pagar dentro de la app y el paso a producción** no entran en esta tanda, como pediste.
