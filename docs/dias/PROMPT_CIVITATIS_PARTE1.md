Hola. Nueva tanda: LA API DE CIVITATIS, PARTE 1 (sandbox). Todo detrás de un interruptor apagado: la app que ve la gente sigue igual hasta que tengamos producción. No toques el motor de rutas.

## 0. Antes de empezar
- Lee docs/dias/API_CIVITATIS.md: es el resumen de la documentación (https://api.civitatis.com/docs/es/v2/consultive) y de lo que queremos hacer. Claude ha actualizado también docs/dias/ORDEN_PARA_CODE.md y ha dejado este prompt: inclúyelos en tu commit tal cual.
- Es la API de consulta: catálogo, precios, disponibilidad por día y hora y plazas. No reservamos ni cobramos nada: la compra se hace en la web de Civitatis, desde su enlace. Decidido así.
- Eric ha puesto el usuario y la contraseña del sandbox en Vercel (Secret) como `CIVITATIS_API_USER` y `CIVITATIS_API_PASSWORD`, y en el `.env.local`. Comprueba que están, sin enseñar nunca sus valores (ni en el informe, ni en la consola, ni en las pruebas). Si faltan en el `.env.local`, dímelo y para.
- El sandbox solo funciona de 7:00 a 2:00, hora de España. Fuera de esas horas, que nada falle por eso.

## 1. La conexión, solo desde nuestro servidor
- Todo pasa por nuestro servidor: el usuario, la contraseña y el token nunca llegan al móvil.
- Entrar con `POST /auth`, guardar el token y renovarlo antes de que caduque (`expiresIn`).
- Un interruptor para elegir sandbox o producción (por ejemplo `CIVITATIS_API_ENV=sandbox|production`), y otro para encender la API en la app, apagado en producción.
- No pasar del límite (20 peticiones por segundo): quedarnos muy por debajo y, si llega un 429, esperar y reintentar.
- Guardar las respuestas en Supabase un tiempo (como las fotos de Unsplash), para no pedirlas cada vez y que la app vaya rápida. El tiempo, en un dato fácil de cambiar (por ejemplo, el catálogo un día y el calendario una hora), porque estamos esperando a que Civitatis nos diga cuánto podemos guardar. Si hace falta tabla nueva, escribe la migración pero no la apliques.
- Si la API falla o está apagada, la app hace lo de hoy (nuestros datos y nuestros enlaces). La app avisa, no prohíbe.

## 2. Mirar qué hay en el sandbox
- Saca la lista de destinos y dime si está Roma, y qué hay en ella.
- Con `GET /activities/resolve`, pasa a número de actividad los enlaces de Civitatis que ya tenemos en los datos de Roma (entradas, excursiones, Free Tour). Dime cuáles se resuelven y cuáles no.
- Apunta si los números de actividad del sandbox son los mismos que los de la web de verdad, o si cambian (importa para producción).

## 3. Lo que hay que montar (con el interruptor encendido)
a) **Las entradas con datos reales** (las 3 de Roma: Coliseo, Vaticanos y Panteón, y las demás de la ruta): precio «desde» (y el original tachado si lo hay), valoración y número de opiniones, fotos, qué incluye y qué no, la cancelación, hasta cuándo se puede reservar, la duración y el punto de encuentro (con sus coordenadas, en el mapa).
b) **Las horas libres:** en «Hora de entrada · encaja con tu ruta», con fechas, solo las horas que quedan libres ese día según el calendario, con las plazas si quedan pocas. Si no queda nada ese día, un aviso. El motor sigue igual: esto solo cambia las horas que se pueden elegir.
c) **Las excursiones** de Roma con su precio y su valoración reales; la «valoración media» de la página de excursiones, calculada con ellas. Fuera `provisional_pricing` cuando haya datos.
d) **El Free Tour** con sus horas reales, sacadas de su calendario.
e) **La pestaña Entradas de cada ficha:** las actividades de cada sitio. La API las busca por el Google Place ID; si nuestros sitios no lo tienen, usa las coordenadas del sitio con un radio pequeño (`POST /findByCoord`). Dime qué has usado.
f) **Los traslados:** el enlace de traslados de Roma, en la ficha de llegada.
g) **Los enlaces de compra:** todos con `aid=5206` y la campaña (la de cada viaje, como hoy). Estamos esperando a que Civitatis confirme que así la venta cuenta como nuestra: déjalo en un solo sitio del código, fácil de cambiar.
h) **Los textos:** como siempre, sin nombrar a la empresa en la app.

## 4. Lo que NO va en esta tanda
- «Cerca de ti» en HOY (irá con la Tanda 8).
- Reservar o pagar dentro de la app.
- Cambiar a producción: eso, cuando pasemos la certificación.

## 5. La prueba
- No toca el motor: la batería rápida.
- Una prueba nueva de la API con respuestas del sandbox guardadas en archivos, para que no dependa de la hora ni de la red: el token y su renovación, el 429, la caché, la API caída (la app hace lo de hoy), el enlace con `aid=5206`, las horas libres y el día sin plazas.
- Y, si estás dentro del horario del sandbox, una prueba corta contra el sandbox de verdad.

## 6. El informe (docs/dias/INFORME_CIVITATIS_1.md)
En español sencillo:
- qué hay en el sandbox (Roma sí o no) y qué enlaces nuestros se han resuelto;
- qué has montado y cómo se ve (con el interruptor encendido);
- lo que tiene que hacer Eric fuera del código y las migraciones nuevas (sin aplicar);
- lo que depende de la respuesta de Civitatis (el `aid`, cuánto tiempo guardar, si hay que citar la fuente);
- qué hace falta para la certificación y para pasar a producción;
- los riesgos y lo que no has podido hacer.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
