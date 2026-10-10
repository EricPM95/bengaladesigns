# Informe de la Tanda 6z6d

Cerrar lo de la 6z6c: tus respuestas, la caché del tiempo, «Créditos» y la lluvia de prueba.

## 0. Un error mío que he arreglado
En la 6z6c escribí mi prueba nueva con el nombre `pruebaTanda6z6c.mjs`, que ya existía (la parte C de la 6z6: HOY durante, «Escuchar», «Cerca de ti», EXPLORAR de pago). La **pisé** y esa parte dejó de correr desde entonces; el agregador de la 6z6 enseñaba «6z6c: 28» en vez de la suya. Lo he restaurado desde git (94 comprobaciones, 0 fallos) y mis pruebas de la 6z6c y la 6z6d tienen nombre propio: `pruebaFase6z6c.mjs` y `pruebaFase6z6d.mjs`. Con la `6z6c` restaurada todo sigue en 0 fallos.

## 1. Tus respuestas a la 6z6c
- **Proveedor del tiempo (plan de pago):** lo contratas tú antes de lanzar (está en PENDIENTES). Su licencia es CC BY 4.0 y **pide citar la fuente también con el plan de pago**. Más abajo, en «Créditos».
- **Caché del tiempo (sin Supabase):** hecho. Las respuestas buenas de `/api/tiempo/horas` y `/api/tiempo/dias` llevan `Cache-Control: public, max-age=0, s-maxage=10800, stale-while-revalidate=10800`: la caché de Vercel (la misma para todos, 3 horas) y, pasadas, se sirve la vieja mientras se renueva. La caché en memoria de antes se queda. Las respuestas malas (400 y 502) llevan `no-store`: un fallo nunca se guarda. La app ya pide las coordenadas redondeadas a 2 decimales, así que viajeros del mismo destino comparten la misma dirección y la caché de Vercel funciona. Comprobado en local con curl: `Cache-Control: public, max-age=0, s-maxage=10800, stale-while-revalidate=10800`. **No pude comprobar la caché de Vercel en sí** (solo se ve ya desplegado): la cabecera es la estándar que Vercel respeta, pero lo confirmaré mirando `x-vercel-cache: HIT` cuando se despliegue.
- **«Roma y Florencia quedan en tu mapa», el álbum de varios destinos:** no los toco (varios destinos, más adelante). La bombilla de 44 px, bien.
- **Roma sola:** no he tocado nada de varios destinos.

## 2. «Créditos» (qué sale y por qué)
Pequeño enlace «Créditos» al final del Perfil; abre una pantalla con [‹ Volver]. Una sola lista en `src/lib/creditos.ts`. Salen:
- **El tiempo — Open-Meteo.** Su licencia (CC BY 4.0) exige dar el crédito, enlazar la licencia e indicar si se cambió algo; no distingue entre gratis y de pago. Dice «Weather data by Open-Meteo.com» con su enlace, la licencia enlazada y que redondeamos las temperaturas (es el único cambio). **Ojo:** su página de licencia dice también que el enlace vaya «junto a cualquier lugar donde se muestren sus datos»; tú has decidido que no en las pantallas, así que cumplimos en una página aparte. Está en las preguntas.
- **Mapas y lugares — Mapbox y OpenStreetMap.** Los mapas ya llevan su aviso pequeño; queda también por escrito.
- **Fotos de los lugares — Wikimedia Commons y Unsplash.** Su autor y enlace ya salen bajo la foto en la ficha de la parada; aquí se dice dónde mirar.
- **No salen** las empresas de los enlaces de compra (no piden que se las cite) ni las fotos de los viajeros ni las propias (todavía sin crédito en los datos).

## 3. La lluvia de prueba
- El panel de pruebas lleva «Lluvia de prueba: Sí · No» (solo local y vistas previas; en producción ni la clave de la sesión la enciende).
- Con «Sí» la app se porta como si el servidor dijera que llueve: todo el día en el aviso de HOY, y en la previsión de RESERVAS llueve un día sí y otro no. En RESERVAS el tiempo sale entonces **en cualquier momento del viaje** (en la app de verdad solo desde 5 días antes). Con «No» o sin tocarla no hay lluvia inventada nunca. Un solo sitio (`rainForecast.ts` + `lluviaDePrueba.ts`); no cambia el servidor ni lo que ve un viajero.
- Visto a 375 px con el panel: HOY (de pago, durante) con «Hay previsión de lluvia esta mañana…» y [Ver alternativa]; RESERVAS con «El tiempo en Roma» (sáb: lluvia 80 %, dom: seco). Con «No», nada.
- **La campana no lleva hoy ningún aviso de lluvia:** `useAppNotices` no sabe nada del tiempo, así que no hay nada que probar ahí. Añadirlo sería una función nueva para el viajero de verdad. Está en las preguntas.
- Para ver el aviso de HOY hace falta un día con «Si llueve» (`rainPlan`) y una parada con hora; el viaje de prueba rápido no los trae, así que se los puse a mano en el navegador para comprobarlo. Los viajes reales de Roma sí los llevan.

## 4. Pruebas
- Nueva `pruebaFase6z6d.mjs` (21 comprobaciones, 0 fallos): la respuesta del tiempo lleva su Cache-Control (y las malas, `no-store`); en producción la clave «1» no inventa lluvia ni el panel se pinta; con «No» o sin tocarla no sale lluvia inventada nunca y con «Sí» en pruebas sí; «Créditos» lleva Open-Meteo con su licencia y los mapas, está al final del Perfil y no sale en otras pantallas.
- Las de siempre, a 0 fallos (con la 6z6, 6z6b y 6z6c, incluida la `6z6c` restaurada). Capturas: `docs/dias/img/6z6d-*.jpg`. Viaje de prueba borrado.
- Invariantes 551 corregida y 553 a 555 nuevas.

## 5. Lo que NO pude comprobar
- La caché de Vercel funcionando (solo se ve desplegado).
- Los enlaces de «Créditos» abriéndose en un móvil real.
