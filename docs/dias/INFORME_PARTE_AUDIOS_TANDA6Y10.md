# Informe, parte AUDIOS (Tanda 6y10, agente F): nombres que no se pueden adivinar

Respuesta a tu P5: «vale al lanzar, pero con nombres de archivo que no se puedan adivinar y sin ninguna lista pública. Los enlaces que caducan, más adelante». No se ha creado ningún audio ni se ha llamado a la empresa de voz. Sin push.

## 1. Qué ha cambiado
- **El nombre del fichero lleva la huella:** `public/audios/roma/<sitio>-<huella>.mp3`, por ejemplo `fontana_de_trevi-2c203eb7773bc02f6bceee9d.mp3`. Ya no existe `/audios/roma/panteon.mp3`.
- **La huella:** SHA-256 de (texto de la historia con espacios normalizados + voz y todos sus ajustes: id de voz, modelo, estabilidad, similitud, formato, idioma). Se usan los primeros 24 caracteres hexadecimales (96 bits). Sin saber el texto exacto y la voz no se puede calcular, y 96 bits no se adivinan probando. El nombre de la voz (solo informativo) no entra. Está en un solo sitio: `nombreDelFichero` / `huellaDelAudio` en `shared/audio/historiasAudio.js`.
- **Ninguna lista pública:** el índice `data/audios/roma.json` sigue en `data/` (fuera de `public/`) y no se envía ni se sirve. `POST /api/historia-audio` recibe destino + sitio y devuelve **solo** `{ "audio": "/audios/roma/<fichero con huella>" }` de ese sitio, o `{ "audio": null }`. Ahora además contesta con `Cache-Control: no-store`.
- **Texto cambiado = audio viejo fuera:** el servidor solo ofrece el audio si el nombre del índice es exactamente el que sale del texto y la voz de AHORA. Si no, `null` y la app cae a la voz del móvil. El programa lo detecta como «hay que recrearlo» (también en `--simular`, que además dice qué fichero viejo dejará de usarse); al recrearlo avisa de los ficheros viejos que se pueden borrar (no los borra él).
- **El servidor relee el índice** si el fichero ha cambiado (por su fecha): al crear audios no hace falta reiniciarlo (antes recordaba para siempre el «no hay índice»).
- `vercel.json`: los `/audios/*` llevan `Cache-Control` largo (el nombre cambia si cambia el audio, así que es seguro) y `X-Robots-Tag: noindex, nofollow` (que los buscadores no los indexen).
- Guía (`GUIA_NUEVOS_DESTINOS.md`, apartado de historias): refleja la regla.

## 2. Qué queda accesible por URL directa y cómo se evita listar
- **Se publica `public/` tal cual** (Vercel sirve los estáticos de `public/` en la raíz; en `vercel.json` solo se reescribe `/api/*` hacia la función). Por tanto, **un `.mp3` es accesible si conoces su dirección exacta** (`/audios/roma/<sitio>-<huella>.mp3`). Esa dirección solo la da `/api/historia-audio`, sitio a sitio, y solo la de los sitios que existen con el texto vigente.
- **Listar no se puede:** Vercel no genera listados de carpetas (pedir `/audios/roma/` no da índice); `vercel.json` no reescribe `/audios` ni `/data`; el servidor Express no tiene `express.static` ni `serve-index`, ni ninguna ruta GET de audios; `data/` no se publica (solo está dentro del paquete de la función, para que el servidor lo lea). El índice no está en `public/`.
- **Lo que NO impide:** quien tenga una dirección (la haya oído el reproductor, la vea en las herramientas del navegador) puede compartirla y el audio sonará sin el candado. Eso solo lo cierran los enlaces que caducan (más adelante, como dijiste). Tampoco impide que quien ya ve el texto de una historia (ficha de pago) calcule el nombre: hace falta además conocer la voz y los ajustes, que no salen en la app, pero no es un secreto criptográfico (ver pregunta 1).
- Sin servidor, la app no obtiene ninguna dirección y suena la voz del móvil.

## 3. Pruebas
- Nueva `scripts/destino/pruebaFase6y10_audios.mjs`: **40 comprobaciones, 0 fallos**. Nombres con huella (≥16 hex, 31 distintos, mismo texto = mismo nombre, otro texto/voz/modelo = otro), índice no servido (nada en `public/`, sin `express.static`, `vercel.json` limpio, GET a `/data/audios/roma.json`, `/audios/roma/`, etc. no lista), endpoint (solo `{audio}`, no nombra otros sitios, texto viejo = null, sitio sin audio = null, GET no responde, `no-store`), sin audio = voz del móvil, y `--simular` coherente (mismos nombres que la app, avisa de «hay que recrearlo», reconoce lo ya al día, no toca el índice). Escribe un índice y un .mp3 falso temporales y los borra al terminar.
- Ajustada `pruebaFase6y9_audios.mjs` a los nombres con huella: 48 comprobaciones, 0 fallos. También 0 fallos: `pruebaFase6y7_historias` (554), `pruebaFase6y9_fichas` (145), `pruebaFase6y9_pantallas` (92). Todas en serie. Typecheck `npx tsc --noEmit -p tsconfig.app.json` limpio.
- Servidor propio en el puerto 8866 parado; sin `.env.local` ni procesos.

## 4. Textos propuestos para las invariantes (los numeras tú desde la 632)
1. «Un audio de una historia se guarda como `<sitio>-<huella>.mp3`, donde la huella es el SHA-256 del texto de la historia más la voz y sus ajustes (al menos 16 caracteres hexadecimales; hoy 24). Mismo texto y voz = mismo nombre; otro texto, otra voz u otro modelo = otro nombre.»
2. «Ninguna lista de audios es pública: el índice de audios vive en `data/` (nunca en `public/`), no se sirve ni se envía entero, no hay carpeta con listado ni ruta del servidor que enumere audios.»
3. «`POST /api/historia-audio` devuelve solo la dirección del audio del sitio pedido, y solo si el texto de la historia de ahora coincide con el del audio (misma huella); en cualquier otro caso `null` y la barra lee con la voz del móvil.»
4. «Si el texto de una historia (o la voz) cambia, su audio viejo deja de usarse y la orden de crear audios lo marca como «hay que recrearlo»; `--simular` lo dice sin llamar a nadie.»

## Decidido por Code
- 24 caracteres hexadecimales de huella (96 bits) en el nombre; la huella incluye la voz, así que cambiar de voz renombra todos los audios.
- El nombre del sitio sigue en el fichero (legible para quien los gestiona); lo que no se puede adivinar es la huella.
- El programa no borra ficheros viejos; solo avisa de cuáles sobran.
- El servidor relee el índice por fecha de modificación en lugar de recordarlo para siempre.
- Cabecera `X-Robots-Tag: noindex` y caché larga en `/audios/*`.
- La respuesta del endpoint lleva `no-store`.

## Preguntas abiertas
1. ¿Añadimos un «secreto» de la casa (una cadena en una variable de entorno que entra en la huella) para que ni conociendo el texto exacto y la voz se pueda calcular el nombre? Hoy es difícil de adivinar pero no es secreto. Cuesta poco, pero el programa y el servidor deberían tener el mismo secreto en Vercel.
2. Al lanzar, ¿los audios de pago pueden seguir teniendo dirección directa válida para siempre, o pones ya una fecha para los enlaces que caducan?
3. ¿Quieres que el programa borre solo los ficheros viejos que sobran (hoy solo avisa)?

## Ficheros tocados
`shared/audio/historiasAudio.js`, `scripts/destino/crearAudiosHistorias.mjs`, `scripts/destino/pruebaFase6y10_audios.mjs` (nuevo), `scripts/destino/pruebaFase6y9_audios.mjs`, `server/index.js` (solo `/api/historia-audio` y su lectura del índice), `vercel.json`, `docs/dias/GUIA_NUEVOS_DESTINOS.md`, este informe.
