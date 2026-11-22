// REPASO de la Tanda V39B: el Coliseo con su suspense y «Una maravilla nueva».
import fs from 'node:fs'
const img = (f) => (fs.existsSync(`docs/dias/${f}`) ? `<img src="${f}" alt="${f}">` : '<i>(sin captura)</i>')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const capturas = fs.existsSync('docs/dias/V39B_capturas') ? fs.readdirSync('docs/dias/V39B_capturas').filter((f) => f.endsWith('.jpg')).map((f) => img(`V39B_capturas/${f}`)).join('') : ''
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V39B</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:900px;margin:0 auto;padding:16px;color:#1C2230}img{max-width:240px;border:1px solid #ddd;border-radius:10px;margin:6px 8px 6px 0}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V39B · El Coliseo con su suspense y «Una maravilla nueva»</h1>
<h2>1 · El suspense del Coliseo</h2>
${li([
  'El Coliseo, la <b>primera vez</b>, empieza ahora como los demás emblemas: la frase al azar, los aros que laten y el estallido (3,6 s), y <b>después</b> su película. Al verlo otra vez, directo a la película. «Reducir movimiento» no lleva espera, como los demás.',
  '<b>Qué había dentro de la película:</b> solo su guion («Casi 2.000 años esperándote…» y «El anfiteatro más grande jamás construido.»); no tenía ninguna espera propia que se viera (ni aros, ni frase de suspense), así que no hay dos esperas seguidas y no he quitado nada.',
  '<b>Sonidos:</b> los latidos (toque) y el «Estallido del suspense» (con lo que hayas guardado en esa fila) suenan en la espera; el sonido de la película entra cuando empieza la película.',
  '<b>Estudio, tarjeta «Coliseo»:</b> enseña la espera y luego la película; dura 29,2 s (3,6 + 25,6) y su línea de tiempo lo incluye (marcas desplazadas 3,6 s); tiene las filas «toque (latidos)» y «Estallido del suspense», como las de Roma.',
  '<b>Lo que ya tenías guardado en el Coliseo NO se mueve respecto a la película:</b> al abrir el estudio, <b>primero se guarda una copia de lo de antes</b> (intacta, bajo un id que no es una tarjeta: la página ni la enseña ni la borra) y después lo guardado que contaba «desde el principio» o «desde el golpe» se mueve +3,6 s (el redoble de los 12 s pasa a los 15,6 s: cae en el mismo fotograma de la película). Lo «donde suena de siempre» va con la película solo, y lo de la espera (latidos, estallido) se queda donde estaba. Se hace una sola vez. Comprobado con un guardado de ejemplo.',
  '<b>Zip:</b> el lector (<code>aplicarEstudio.mjs</code>) rechaza un zip del Coliseo de antes de este cambio (sin las partes de la animación) y dice que se baje otra vez del estudio; los zips nuevos llevan la película a los 3,6 s y sus sonidos van atados a ella. Un zip viejo que cargues en el estudio se mueve +3,6 s solo.',
])}
<h2>2 · «Una maravilla nueva» (1.ª a 6.ª)</h2>
${li([
  'Pantalla propia, de una en una y ya no dentro de «Y además…»: la medalla de las siete con las monedas ya conseguidas en oro y las demás en plata; la moneda nueva baja girando (a los 0,8 s), encaja (1,9 s) y se enciende, con la etiqueta de su nombre; el número del centro cuenta una más; debajo «El Coliseo · 1 de 7», su línea y [Seguir]. La 7.ª sigue con su final, intacto. Orden: emblema, medalla, «Una maravilla nueva», «Y además…» (el emblema del Coliseo va siempre antes que la maravilla).',
  '<b>Tiempos</b> en <code>tiempos.ts</code> (<code>TIEMPOS_DE_MARAVILLA_NUEVA</code>) y <b>partitura propia</b> «maravilla nueva» (vuuush justo antes de encajar, clic al encajar, brillo al encenderse; sin el redoble ni el golpe grande del final de las 7), con archivos que ya existían.',
  '<b>Líneas de los datos de la app.</b> Corregida la del <b>Cristo Redentor</b>: antes «30 metros de brazos abiertos sobre Río»; ahora «Una estatua de 30 metros con los brazos abiertos sobre Río.» (unos 30 m de alto sin pedestal y unos 28 m de brazo a brazo). Las otras seis las revisé y son verdad (Coliseo, Gran Muralla, Petra, Machu Picchu 2.430 m, Chichén Itzá, Taj Mahal).',
  '<b>Estudio:</b> dos tarjetas nuevas, «Maravilla nueva» (1 de 7) y «Maravilla nueva (4 de 7)», para que le pongas el sonido. Ahora son 29 tarjetas.',
])}
<p>${capturas}</p>
<h2>Tu lista de comprobación de esta tanda</h2>${li([
  'Estudio → «Coliseo» → ▶: la frase, los latidos, el estallido… y después la película. Mira la línea de tiempo: 29,2 s con la película a partir de los 3,6 s.',
  'Lo que tenías guardado en el Coliseo: cada sonido cae en el mismo fotograma de la película que antes.',
  'Estudio → «Maravilla nueva» (1 de 7 y 4 de 7): ▶ y mira cuándo encaja la moneda.',
  'En la app, al ganar la 1.ª a la 6.ª maravilla: «Una maravilla nueva», con el emblema primero si llega a la vez.',
])}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>Copia de seguridad de lo guardado del Coliseo:</b> se hace sola al abrir el estudio por primera vez con esta versión. Vive en el navegador que usas para el estudio; si abres el estudio en otro navegador, no hay nada que mover ahí.',
  'La moneda y el cartel de «Una maravilla nueva» copian el diseño; [Seguir] es el botón de la app (el de las demás pantallas), no el rectángulo dorado del dibujo. Con «Reducir movimiento» la moneda sale ya puesta y el sonido va a la mitad (como las demás); si quieres silencio total ahí, dímelo.',
  'En la app sale «El Cristo Redentor · 4 de 7» (con «El», porque así viene de los datos).',
  'Lo «En el golpe» del Coliseo se movió +3,6 s igual que lo «desde el principio» (la referencia del golpe es el estallido y no se mueve).',
  'Reiniciado el api-server al final de la tanda.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V39B.html', html)
console.log('ok')
