# Dibujos de los logros (Tanda 8B)

Todo sale de «Logros · Modelos» (docs/diseno/proyecto) y se dibuja con código (SVG y CSS). Sin vídeos, sin GIF, sin librerías nuevas.

## Qué hay y dónde (`src/components/logros/dibujos/`)
- `index.tsx`: el contrato. Mismas firmas de siempre: `Sello`, `Insignia`, `Emblema`, `Chapa`, `MedallaMaravillas`. Solo se han añadido props opcionales: `Sello` (apagado, animado), `Insignia` (animada), `Chapa` (bloqueado, animada, progreso), `MedallaMaravillas` (animada). También sale `sitiosDeColeccion(id)`.
- `Sello.tsx`: Roma (bronce, plata, oro, diamante) y Vaticano (plata, oro, diamante, ovalado). Es la pieza «Sello Logro».
- `Insignia.tsx`: las 11 colecciones, cada una con su forma (octógono, llaves y tiara, rombo, chapa, escudo, hexágono, cinta, arco). Cada pedazo es su sitio, en el orden de `sitios` de roma.json. Pedazo ganado = color, pedazo que falta = gris. Los sitios de cada colección están copiados dentro del archivo (para no cargar el JSON entero): si cambian en roma.json, hay que cambiarlos aquí también.
- `Emblema.tsx`: los 12 emblemas, cada uno con su forma. Estático (icono de línea), con animación en bucle (`animado`) o silueta con «?». El del Coliseo es la moneda de oro en relieve (pieza «Emblema Oro»).
- `Chapa.tsx`: las 43 chapas de viajero (la página de prueba comprueba que no falta ninguna). Familias: con escalones que crecen (7 materiales, «Logro Viajero»), patrimonios (el templo), maravillas (la medalla), los de un solo paso con dibujo propio («Logro Único», dos países, continentes, pequeños gigantes, cuatro estaciones), chapa sencilla con icono, y exclusivos holográficos.
- `Medalla.tsx`: medalla de las 7 maravillas con las imágenes de `public/medalla/` (WebP): una capa gris por cada maravilla que falta y las estrellas de arriba encendidas según cuántas lleva.
- `piezas/`: las piezas del diseño pasadas a React con un conversor automático (el mismo dibujo, el mismo código de cálculo). Llevan `// @ts-nocheck` a propósito: es código del diseño, no se retoca a mano. `VueltaMundo` está pasada pero sin usar (es «Próximamente»).
- `iconos.ts`: los iconos de línea del diseño. `dibujos.css`: lo común.

## Página de prueba
`http://localhost:5173/?dibujos=1` (solo en desarrollo, carga perezosa): todos los dibujos en cuadrícula, con una casilla «animados». Está en `src/dev/DibujosPrueba.tsx`. Se cablea en `src/main.tsx` (junto a `?tarjeta=`) y no en `App.tsx`, para no pisar a los demás agentes.

## Reducir movimiento y peso
- Con «Reducir movimiento» las animaciones acaban en su estado final y se quedan quietas. Con `animado=false` (o `animada=false`) pasa lo mismo.
- Nada se carga al abrir la app: cada pieza es una importación perezosa dentro de `Chapa`/`Emblema`, y `index.tsx` solo lleva Sello, Insignia (pedazos) y el pegamento. Pesos (sin comprimir / gzip): Sello 12 KB / 5 KB; Insignia 18 KB / 6 KB (+ llaves 15 KB / 5 KB al usar «el país más pequeño»); Emblema 16 KB / 5 KB (+ moneda del Coliseo 36 KB / 11 KB); Chapa 8 KB / 3 KB y cada pieza que use entre 8 y 30 KB (gzip 3-8 KB); medalla 3 KB + 64 KB de imágenes (7 capas pequeñas de 2-4 KB y la base de 43 KB; antes eran 1,2 MB en PNG).

## Qué difiere del diseño y por qué
- Insignias: en el diseño, el pedazo que falta flota desplazado y se mece; aquí queda en su sitio, gris. Es más limpio en una cuadrícula pequeña. La animación de «completar» del diseño (teselas que llegan volando, giro) no está; solo las llaves y la tiara conservan su animación de ensamblado (`animada`).
- Emblemas estáticos: son el icono de línea en su forma; la animación de cada uno solo existe en `animado`.
- Medalla: base + capas apagadas; no están las monedas voladoras de la «medalla de las 7 monedas» ni la escena de cierre.
- La moneda del Coliseo no se inclina con el puntero.
- Tres chapas usan un icono elegido por mí porque el diseño no las dibuja: ciudad completa/Todos los secretos (icono propio), tres oro / tres diamante (corona y gema), diamante primera (diamante con marca).
- Las fuentes (Geist, Instrument Serif) ya están en `index.html`.
- Un archivo de imagen, `mm-off-tajmahal.webp`, no se llama `mm-off-taj` porque el servidor de desarrollo devolvía la página en lugar del archivo con ese nombre.

## Sin hacer
- Las escenas largas de `Logros Momentos` (llegada, Coliseo de cerca con los bloques cayendo, medalla de las 7 monedas, escena de cierre) no se han portado: son del agente de momentos. Hay piezas portadas reutilizables para ello (`piezas/*`).
- No he podido mirar la app en un teléfono real; solo en el navegador del panel.
