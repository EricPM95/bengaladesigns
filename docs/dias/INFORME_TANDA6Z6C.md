# Informe de la Tanda 6z6c

Lo que se cortó de la 6z6b, las respuestas a tus preguntas, el tiempo desde nuestro servidor y una prueba de verdad de las fotos.

## 0. Tus respuestas a mis preguntas de la 6z6b
- **Bombilla gris** (como la varita): hecha. El frambuesa queda solo para «falta».
- **Pastilla sin decimales** cuando es redonda («+100 €»), con dos cuando no («+103,13 €»). La pantalla del presupuesto ya usaba ese formateador (`formatoImporte`); solo la pastilla era distinta. Ahora las dos salen del mismo sitio.
- **Globo más grande:** ahora llena el ancho del mapa (94 %, constante `FRACCION_ANCHO_GLOBO`) y se corta un poco arriba y abajo; los lados siguen curvos. A 375 px la esfera mide unos 315 px en un mapa de 335×220.
- **Acordeón de varios destinos sin empresas:** pasado a las tarjetas de «Útil para el viaje». El acordeón de cada destino solo lleva llegada, vuelta y alojamiento. Seguro, tarjeta sin comisiones y coche salen una vez por viaje; la eSIM, una «eSIM de datos» por país distinto (la línea dice «Internet en el móvil en {país}»). Los enlaces de [Comprar] no cambian. Comprobado: 0 nombres de empresas en RESERVAS.
- **`TripReadinessQuickPanel.tsx` borrado**, y con él `ReadinessBreakdownRow`, `N26Row`, `EsimRow` y dos funciones de `readiness.ts` que solo usaba él.
- La 0018 está aplicada (lo compruebo en el punto 4).

## 1. Los tips, con una bombilla en la tarjeta de cada destino
- Quitada la bombilla del mapa de RUTA. En la tarjeta de cada destino, a la izquierda de la varita: círculo con borde, icono fino y gris, mismo tamaño que la varita.
- Abre la hoja de tips de ESE destino (`_tips.json` de su carpeta). Sin tips, sin bombilla; sale aunque no haya varita. Nombre largo: se corta con «…».
- Comprobado a mano con Roma + Florencia: Roma lleva bombilla (abre «8 cosas que un romano te diría») y Florencia no, porque no tiene tips.
- Los tips no salen en ningún otro sitio (solo el icono «tips» como adorno en algunas cajas del día y de restaurantes, que no abren la hoja).

## 2. «Guarda tus recuerdos», como el prototipo
- Tres cuadros: las tres últimas fotos en miniatura; los vacíos, con borde de rayas y la cámara (abren lo de subir). Línea del mapa con su icono, [Subir mis fotos], [Ver mis recuerdos] si hay fotos y «Una foto por parada» en la gratis.
- Con varios destinos la línea dice «Roma y Florencia quedan en tu mapa…» (lo vi mal a mano —salía «Roma → Florencia queda»— y lo arreglé).
- **Una sola tarjeta** para RUTA (gratis, después del viaje) y HOY después (de pago): HOY tenía su propia versión con la galería y ahora usa la misma.
- A mano con 0, 1 y 3 fotos: bien las tres.

## 3. El tiempo, desde nuestro servidor
- Nuevo `server/tiempo.js`: `/api/tiempo/horas` (lluvia por horas) y `/api/tiempo/dias` (previsión de los días). Caché compartida por coordenadas redondeadas a 2 decimales y fecha, con caducidad de **3 horas**, tope de 2000 entradas, peticiones iguales juntas en una, validación de parámetros (400 si son malos) y 502 sin guardar el fallo si el proveedor no responde.
- La app (`rainForecast.ts`) solo pide a nuestro servidor; si falla, devuelve «sin tiempo» y no rompe nada. La previsión sigue saliendo desde 5 días antes.
- **Cuántas peticiones al proveedor:** como mucho una cada 3 h por destino y fecha, es decir 8 al día por clave. Con 100 destinos distintos: horas 100 × 8 = 800 y días 100 × 8 = 800, **unas 1.600 al día en el peor caso** (el real es menor: solo se pide si alguien lo consulta). Antes, cada móvil pedía por su cuenta. En Vercel la caché vive en cada instancia y las instancias frías la rellenan otra vez, así que puede salir algo más. Open-Meteo gratis admite unas 10.000 al día pero **solo para uso no comercial**: con la app de pago hará falta su plan de pago.
- Comprobado: dos peticiones con las mismas coordenadas redondeadas, la segunda sale de caché (`X-Tiempo-Cache: HIT`); en el navegador la app pidió `/api/tiempo/...` (200) y 0 peticiones al proveedor.

## 4. Las fotos, probadas de verdad (Supabase real, en local)
- **Subir:** en el almacén aparecen la grande (40 756 bytes) y la `_min` (9 027 bytes), más su fila en `trip_photos`; se ve en el álbum y en «Guarda tus recuerdos» (miniatura de 400 px).
- **Gratis:** «Añadir foto» pasa a «Cambiar foto»; al cambiarla, queda una sola foto (la vieja y su `_min` se borran).
- **Eliminar:** se borran las dos del almacén y la fila (0 restantes).
- Ningún error. La 0018 funciona. No lo hice con el selector de archivos del móvil (el navegador de pruebas no lo permite): subí con el mismo código de la app (`subirFoto`) desde la consola. Viaje y fotos de prueba borrados.

## 5. Pruebas
- Nueva `pruebaTanda6z6c.mjs` (28 comprobaciones, 0 fallos): 0 bombillas en RUTA/mapa/Perfil y una por destino en su tarjeta; pastilla «+100 €» y «+103,13 €»; 0 nombres de empresas en RESERVAS; la app nunca llama al proveedor del tiempo y nuestro servidor responde (400 a lo malo, caché a la segunda); tarjeta de recuerdos; restos borrados y globo.
- Las de siempre (con 6z6 y 6z6b), a 0 fallos. Capturas: `docs/dias/img/6z6c-*.jpg`.
- Invariantes 547 a 550 corregidas y 551 y 552 nuevas.

## 6. Lo que NO pude comprobar
- El aviso de lluvia con lluvia de verdad: probé que el tiempo llega del servidor, pero no hay lluvia prevista que lo dispare hoy.
- Los gestos de dos dedos en un móvil real y el selector de archivos.
- «Guarda tus recuerdos» con el panel de pruebas en la versión de pago después del viaje (solo la gratis a ojo; HOY después usa el mismo componente y el tipo está comprobado).
