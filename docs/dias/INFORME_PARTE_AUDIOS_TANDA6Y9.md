# Informe, parte AUDIOS Y GUÍA (Tanda 6y9, agente D)

Puntos 5 y 4 del prompt. No se ha creado ningún audio ni se ha llamado a la empresa de voz. Sin push.

## 1. Dónde se guardan los audios y por qué
- **Los ficheros:** `public/audios/roma/<sitio>.mp3`, un fichero por historia (ej. `fontana_de_trevi.mp3`). Es lo mismo que hacen las fotos propias (`public/fotos/roma`): los sirve la propia web, sin servicio nuevo y sin coste extra. Cada uno pesa ~1 MB.
- **El índice:** `data/audios/roma.json`. Por sitio guarda el nombre del fichero, la «huella» del texto con el que se creó, los caracteres y la fecha; y, arriba, la huella de la voz y sus ajustes. Está en `data/` (y no en `public/`) porque el servidor ya lee de ahí en Vercel (`includeFiles: data/**`). Todavía no existe: lo crea el programa la primera vez.
- **El nombre del fichero** sale del nombre del sitio sin tildes y en minúsculas (`shared/audio/historiasAudio.js`), así que no depende de ningún id nuevo en las fichas. Los 31 salen distintos.
- **Ni el nombre de fichero ni ningún texto de la app dicen el nombre de la empresa de voz.** En el código solo aparece el que hace falta para llamar a su API, dentro del programa (`scripts/`), no en `src/`.

## 2. Cómo decide la barra (un solo sitio)
- `crearEscuchaSegunFuente` (en `src/lib/useEscuchar.ts`) es LA regla: **con audio guardado, suena ese audio; sin audio, la voz del móvil como hasta ahora; si el audio falla al sonar (fichero que falta, red caída), sigue con la voz del móvil** y esa lectura empieza ya. La usan por igual la barra de la ficha y el botón «Historia» de HOY (los dos pasan por `Escuchar`, que recibe el sitio).
- El control del audio (`src/lib/escucharAudio.ts`) tiene la misma forma que el de la voz del móvil: tocar, pausar, seguir, parar y barra de progreso real.
- El cliente le pregunta al servidor (`POST /api/historia-audio`) si ese sitio tiene audio. Se pregunta aparte de la ficha para no guardar en el móvil una ficha vieja «sin audio» cuando los audios existan después. El servidor solo ofrece el audio si **la huella del texto de la historia de ahora coincide con la del audio**: si Eric cambia una letra de una historia, ese audio deja de ofrecerse (suena la voz del móvil) hasta que se rehaga.
- Con audio guardado, la barra sale aunque el aparato no tenga voz en español.
- **El candado no cambia:** lo decide la misma regla de siempre (`Escuchar`, `libre` o de pago). En la gratis, las demás historias siguen con candado aunque tengan audio; el Coliseo suena.

## 3. El programa y cómo se lanza
`scripts/destino/crearAudiosHistorias.mjs`. **Una sola orden**, justo antes de abrir la app, con la clave en `.env.local` (línea `ELEVENLABS_API_KEY=...`):

    node scripts/destino/crearAudiosHistorias.mjs

Qué hace, en sencillo: lee las 31 historias de las fichas; mira en el índice cuáles ya tienen su audio al día; para las que no, pide a la voz el audio (una llamada por historia), lo guarda y apunta la huella. Si la historia cambia, o cambia la voz o sus ajustes, la próxima vez solo rehace lo que cambió; lo que ya está al día no se toca ni gasta créditos. Si se corta a medias, se vuelve a lanzar y sigue por donde iba.

Opciones: `--simular` (no llama a nadie, dice qué crearía y cuánto gastaría; no necesita clave), `--solo=fontana_de_trevi` (uno solo), `--destino=<otro>`.
- Sin clave: para con un mensaje en español y no hace nada (probado). La clave se lee del archivo en el momento de usarla y no se imprime ni se guarda en ningún sitio.
- **Coste estimado:** `--simular` da 31 historias y unos **73.572 caracteres** (en torno a 74.000 créditos de la voz). La más larga tiene 2.512 caracteres; el límite por llamada (puesto en 4.500) no obliga a trocear, pero el programa parte por frases y une si alguna lo pasara.
- Tras lanzarlo: hay que subir (commit) `public/audios/roma/*.mp3` y `data/audios/roma.json`.

Voz y ajustes (en UNA constante, `VOZ_HISTORIAS`, en `shared/audio/historiasAudio.js`): «Javier Rojas - Calm & Friendly», id `RxPoOxDaJiOdJGnMMaql`, estabilidad 0,75, similitud 0,75, sin control de estilo, mp3 44,1 kHz 128 kbps, idioma español.

## 4. Limitaciones
- **Los mp3 son públicos:** cualquiera que conozca la dirección (`/audios/roma/panteon.mp3`) podría oír una historia de pago sin pasar por la barra. La barra respeta el candado; el fichero no. Alternativa (no implementada, es grande): guardar los mp3 en un almacenamiento privado (Supabase Storage con carpeta no pública) y que el servidor entregue un **enlace firmado que caduca** solo si la versión es de pago; encajaría en el mismo `/api/historia-audio`, que ya es el único sitio que da la ruta. Para empezar (31 audios, mercado pequeño) el riesgo es bajo, pero es una decisión de Eric.
- Los mp3 no se guardan sin conexión: sin red, el audio falla y suena la voz del móvil.

## 5. La guía (`GUIA_NUEVOS_DESTINOS.md`)
- Apartado 2: nuevo párrafo de los **sitios grandes** (cada destino los marca en sus datos; reserva de sitio grande en otro día mueve el día entero; un cierre cambia el día con otro; reserva de sitio pequeño solo mueve esa parada a su día, más o menos a su hora, sin quitar nada del día al que llega; los días cambiados a mano no se tocan). La frase antigua se ha integrado ahí.
- **La cena** (la frase de «21:00» de la 6y8): ahora va ANTES solo si al salir son más de las 22:00; si sale a las 22:00 o antes, DESPUÉS; nunca después de las 22:30 salvo que la reserva acabe después de las 22:15. La comida sigue igual. Y el valor de `cena_antes_si_sale_despues_de` pasa de 21:00 a 22:00 en la lista de ajustes.
- Apartado 7: añadidos sitios grandes, turnos reales con «Recuerda revisar la disponibilidad antes de añadirlo a tu ruta», horarios por tramos de fechas con fuente y fecha de comprobación («el último domingo de marzo»), y el audio de las historias.

## 6. Hallazgo sobre los «sitios grandes»
**El motor NO los lee de los datos del destino: es una lista fija de Roma.** `RESERVAS_GRANDES` en `shared/routeEngine/listasReservas.js` es un `Set` escrito a mano con 4 nombres: Coliseo, Museos Vaticanos y Capilla Sixtina, Galería Borghese **y Free Tour por Roma** (el prompt habla de tres; el Free Tour también cuenta como «grande» para el motor). El cliente la copia (`BIG_RESERVATION_PLACES` en `src/lib/bookings.ts`, que hace `[...RESERVAS_GRANDES]`). Por tanto la guía describe lo que debe pasar en un destino nuevo, pero hoy el motor no lo cumpliría solo: habría que mover esa lista a los datos de cada destino. No lo he tocado (es del motor). Es la pregunta 1.

## 7. Pruebas
- Nueva: `scripts/destino/pruebaFase6y9_audios.mjs`, 48 comprobaciones, **0 fallos** (quién suena con audio / sin audio / audio que falla / sin voz; candado; índice con audio falso para un sitio, ninguno para otro y uno con texto viejo; sin nombre de la empresa de voz en `src/`, fichas ni ficheros públicos; el programa sin clave no hace nada, `--simular` cuenta 31, `--solo`; ninguna clave en ficheros).
- Afectadas, 0 fallos: pruebaFase6y7_historias (554), pruebaFase6y4_ficha, pruebaFase6y5_pantallas, pruebaFase6y7_pantallas (la regla «sin voz del móvil» me obligó a no escribir esa expresión ni en comentarios de `src/`), pruebaTanda6z3, pruebaTanda6z6c, pruebaCorr6z6 (y sus tres partes), pruebaFase6z6e, pruebaFase6z6f, pruebaFase6y6_cierre.
- **pruebaFase6z6fWikimedia: 1 fallo, ajeno a mi parte** («lugares del JSON que ya no se sirven desde Wikipedia con ese archivo», 13 sitios). Es de fotos servidas por el servidor; mi servidor de pruebas no tenía claves ni caché. No toqué nada de fotos. A mirar en la copia principal.
- Typecheck `npx tsc --noEmit -p tsconfig.app.json`: limpio. Servidor de prueba (puerto 8854) parado; no queda `.env.local` ni procesos.

## Decidido por Code
- Índice en `data/audios/roma.json` (no en `public/`) y mp3 en `public/audios/roma/`.
- El identificador del fichero sale del nombre del sitio (las fichas no tienen id).
- El audio se pide al servidor aparte de la ficha (para no cachear mal); en memoria de la sesión, sin localStorage.
- `--simular` no necesita clave.
- Con la voz cambiada, `--solo` se niega a rehacer uno solo (dejaría mezcla de voces).
- El id de modelo está en una sola constante: `eleven_v4`. **A confirmar al lanzar:** es el valor más probable, pero no he podido comprobar en la documentación de la empresa cuál es el id exacto de «Eleven v4»; si la primera llamada da error de modelo, se cambia solo `modelo` en `VOZ_HISTORIAS` y se relanza (el programa para en el primer fallo sin gastar el resto).

## Preguntas abiertas
1. **Sitios grandes:** hoy son una lista fija de Roma en el motor (incluye el Free Tour). ¿Quieres que en la próxima tanda se muevan a los datos de cada destino, como dice la guía?
2. **Audios públicos:** ¿te vale que los mp3 sean accesibles por dirección directa al lanzar, o quieres los enlaces firmados antes de abrir la app?

## Ficheros tocados
`shared/audio/historiasAudio.js` (nuevo), `scripts/destino/crearAudiosHistorias.mjs` (nuevo), `scripts/destino/pruebaFase6y9_audios.mjs` y `_6y9_audios_entrada.tsx` (nuevos), `src/lib/escucharAudio.ts` (nuevo), `src/lib/useEscuchar.ts`, `src/components/route/hoy/Escuchar.tsx`, `src/components/route/hoy/HoyDurante.tsx`, `src/components/route/dayDetail/StopDetailSheet.tsx`, `server/index.js` (`/api/historia-audio`), `docs/dias/GUIA_NUEVOS_DESTINOS.md`, este informe.
