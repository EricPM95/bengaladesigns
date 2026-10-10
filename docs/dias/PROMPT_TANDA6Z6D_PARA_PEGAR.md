Tanda 6z6d: cerrar lo de la 6z6c (tus preguntas, la caché del tiempo, «Créditos» y la lluvia de prueba). Va todo en este mensaje. Es corta.

Antes de empezar: he copiado en docs\dias PENDIENTES_6K.md, BORRADOR_MULTIDESTINOS.md, PROMPT_TANDA6Y_PARA_PEGAR.md (al día) y este prompt (PROMPT_TANDA6Z6D_PARA_PEGAR.md). Mételos en un commit tal cual. El borrador de multidestinos y la 6y NO se hacen ahora: la 6y, cuando Eric lo diga; los multidestinos, mucho más adelante.

IMPORTANTE (Eric, 10-oct): nada de viajes de varios destinos hasta que Roma esté entera curada y lista para lanzar (la ruta, RESERVAS, las llegadas, todo). Hasta entonces, trata Roma como si no hubiera nada más. No toques lo de varios destinos que ya hay.

1. LAS RESPUESTAS A TUS PREGUNTAS DE LA 6Z6C
- Pregunta 1 (el plan de pago del proveedor del tiempo): lo contrataremos antes de lanzar, no ahora (está en PENDIENTES). Mira si su licencia pide citar la fuente aunque se pague (y lo mismo con las demás fuentes de datos y mapas que usamos). Si alguna lo pide, no la pongas en las pantallas: haz una página «Créditos» al final del Perfil, en pequeño (como el aviso del mapa), con lo que haya que citar. Dime en el informe qué fuentes salen ahí y por qué.
- Pregunta 2 (la caché del tiempo, compartida entre las instancias de Vercel): no la pases a Supabase. Haz que la respuesta de nuestro servidor la guarde la caché de Vercel (Cache-Control con s-maxage de 3 horas y stale-while-revalidate), que es la misma para todos. Deja también la caché en memoria de ahora. Si no se puede, déjalo como está y dímelo.
- Pregunta 3 («Roma y Florencia quedan en tu mapa»): déjalo como está. Es de varios destinos: va más adelante.
- Pregunta 4 (la bombilla de 44 px, como la varita): bien.
- Pregunta 5 (el álbum de varios destinos): no ahora. Es de varios destinos: va más adelante (está en PENDIENTES).

2. LA LLUVIA DE PRUEBA, EN EL PANEL DE PRUEBAS
- No pudiste ver el aviso de lluvia porque no hay lluvia prevista. Añade al panel de pruebas (solo en local y en las vistas previas, nunca en producción) una línea más: «Lluvia de prueba: sí · no».
- Con «sí», la app hace como si el servidor dijera que llueve en uno de los días del viaje (el de hoy, si el momento es «Durante»), para que Eric vea:
  - el aviso de lluvia en HOY (de pago) y en la campana;
  - el tiempo en pequeño en la tarjeta oscura de RESERVAS.
- No cambia nada más: ni el servidor ni lo que ve un viajero de verdad. Se acuerda mientras dure la sesión, como lo demás del panel.

3. PRUEBAS
- Las de siempre a 0 fallos (con la 6z6, 6z6b y 6z6c).
- Una prueba 6z6d:
  - la respuesta del tiempo de nuestro servidor lleva su Cache-Control (si se pudo);
  - «Lluvia de prueba» no existe en producción;
  - con «Lluvia de prueba: no», la app no enseña lluvia inventada nunca.
- A mano, a 375 px, con el panel de pruebas: la lluvia de prueba en HOY (durante, de pago), en la campana y en RESERVAS; y la página «Créditos», si la hay. Capturas en el informe.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z6d en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
