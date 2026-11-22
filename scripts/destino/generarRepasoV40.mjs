// REPASO de la Tanda V40: los sonidos definitivos de Eric, en la app.
import fs from 'node:fs'
const json = JSON.parse(fs.readFileSync('data/sonidos/estudio.json', 'utf8'))
const est = fs.readFileSync('src/lib/sonidos/estudio.ts', 'utf8')
const nombreDe = (id) => (est.match(new RegExp(`\\{ id: '${id}', nombre: '([^']+)'`)) ?? [])[1] ?? id
const s = (x) => (Math.round(x * 100) / 100).toString().replace('.', ',')
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const dir = 'public/sonidos/estudio'
const peso = fs.readdirSync(dir).reduce((t, n) => t + fs.statSync(`${dir}/${n}`).size, 0)
const filas = Object.entries(json.animaciones).map(([id, a]) => {
  const code = a.sonidos_de_code
    .filter((c) => !c.silenciado)
    .map((c) => `${c.tipo === 'sint' ? `por código «${c.sonido}»` : `Code «${c.sonido}» candidato ${c.version}`} · ${Math.round(c.volumen * 100)} %${c.ms || c.empieza !== 'sitio' ? ` · ${c.ms > 0 ? '+' : ''}${c.ms} ms desde ${c.empieza === 'golpe' ? 'el golpe' : c.empieza === 'principio' ? 'el principio' : 'su sitio'}` : ' · donde suena de siempre'}`)
  const mudos = a.sonidos_de_code.filter((c) => c.silenciado).map((c) => `«${c.sonido}»`)
  const eric = a.capas.map((c) => {
    const t = (c.empieza === 'golpe' ? a.golpe : 0) + c.ms / 1000
    return c.origen === 'archivo'
      ? `<b>Eric:</b> ${c.nombre}${c.retoques ? ' (editado en el estudio)' : ''} · ${Math.round(c.volumen * 100)} % · en el segundo ${s(t)}`
      : `<b>Code añadido:</b> «${c.sonido}» candidato ${c.version} · ${Math.round(c.volumen * 100)} % · en el segundo ${s(t)}`
  })
  return `<tr><td><b>${nombreDe(id)}</b><br><code>${id}</code><br>dura ${s(a.duracion ?? 0)} s · golpe ${s(a.golpe)} s</td><td>${[...eric, ...code].join('<br>') || '—'}</td><td>${mudos.join(', ') || '—'}</td></tr>`
})
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V40</title><style>body{font:14px/1.45 system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:16px;color:#1C2230}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:5px 7px;text-align:left;vertical-align:top;font-size:13px}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}.eric{background:#FFF7DC;border:1px solid #D8BE84;border-radius:10px;padding:4px 16px}</style>
<h1>V40 · Los sonidos definitivos de Eric, en la app</h1>
<h2>Cómo ha ido</h2>
${li([
  '<b>El lector rechazaba el zip</b> por un solo motivo: en «Visto», el «brillo» pequeño y el «toque» van <b>hechos por código</b> (versión «null», sin candidatos) y el lector, al ver un nombre que también existe como grabado, les pedía una letra. <b>Arreglado en el lector</b> (<code>aplicarEstudio.mjs</code>): un sonido de Code de tipo «sint» (toque, brillo, tic, campanita) va sin versión aunque comparta nombre. No había ningún otro «null» (solo toque, tic, campanita y el brillo de «Visto»).',
  '<b>Aplicado con <code>--escribir</code></b> (todo el zip; el zip no trae nada de Lanzarote, así que Lanzarote no se ha tocado). Lo que dice el lector, animación por animación, está abajo y entero en <code>docs/dias/V40_EN_SECO.txt</code>.',
  '<b>La app NO leía ese json</b> (solo el estudio): ahora sí. <code>estudioDeEric.ts</code> convierte cada animación en el mismo estado que el estudio le da al motor al pulsar ▶ (sonidos de Eric con su momento y volumen, lo silenciado, lo movido, candidatos y volúmenes) y <code>sonar()</code> lo aplica al empezar la animación. Sin tocar las reglas de antes (V38B, V38C, V38D, V39B, apertura en silencio).',
  'Un sonido de Eric que cae <b>antes</b> del primer fotograma (la medalla de oro y la de plata, −470 ms) no se recorta: la pantalla espera ese rato, igual que en el estudio.',
])}
<h2>1 · Lo que suena, animación por animación</h2>
<table><tr><th>Animación</th><th>Qué suena (de dónde · volumen · cuándo)</th><th>Silenciado</th></tr>${filas.join('')}</table>
<h2>El peso</h2>
${li([
  `Antes: los sonidos de la app pesaban <b>1,13 MB</b> (los de Code de V30 y demás). Ahora hay además <b>${(peso / 1048576).toFixed(2)} MB</b> de sonidos de Eric (${fs.readdirSync(dir).length} archivos) → <b>${(1.13 + peso / 1048576).toFixed(2)} MB</b> en total.`,
  'No se baja nada al abrir la app: el json de Eric (40 KB, un trocito aparte) se pide al primer toque, y los archivos de una animación solo cuando va a sonar (o la pantalla anterior los prepara).',
  'Los <code>.wav</code> de tu zip (los ya hechos con [Editar] y los tuyos sin editar, 15,2 MB) están en la app como <b>.m4a</b> (1,88 MB); los <code>.mp3</code> van tal cual (mismos bytes). Los 12 originales (8,4 MB) no están en la app: siguen en tu zip.',
])}
<h2>Cuánto cambia el .wav al pasar a .m4a</h2>
${li([
  'AAC a 192 kbps, <b>misma tasa y mismos canales</b>; la duración es igual al milisegundo y el volumen cambia como mucho 0,05 dB.',
  'Muestra a muestra no es idéntico (AAC es un formato con pérdida): la relación señal/ruido va de 17 dB (los sonidos «de chispa», muy ruidosos: <code>coleccion_1</code>, <code>pedazo_1</code>…) a 54 dB (los limpios). Lo «sonoro» es lo mismo; si quieres idénticos al 100 %, la alternativa sin pérdida es FLAC (unos 8 MB en vez de 1,9).',
])}
<h2>3 · Licencias</h2>
${li([
  'La lista está en <code>docs/sonidos/LICENCIAS_SONIDOS.md</code>: cada archivo con su nombre original y en qué animación va. Pixabay (por el nombre «autor-título-número») y Mixkit permiten el uso comercial sin citar. <b>«¿?»: <code>FIRE.mp3</code>, <code>shine.mp3</code> y <code>dimante.mp3</code></b> (no se ve de dónde vienen): rellénalos tú.',
  'En «Créditos» de la app hay una entrada «Sonidos de las animaciones» (cortesía: ninguna de las dos licencias pide cita).',
])}
<h2>4 · La prueba</h2>
${li([
  '<code>pruebaV40</code>: por cada animación (menos Lanzarote) la app programa lo mismo que el estudio con el zip de Eric (mismos archivos, momentos ±20 ms, volúmenes); lo silenciado no suena; Lanzarote suena como antes; los archivos de la app suenan como los del zip (duración, volumen y señal/ruido medidos); apertura en silencio en la app.',
  'Regresiones: <code>pruebaV38B</code>, <code>V38C</code>, <code>V38D</code>, <code>V38E</code>, <code>V39B</code>, <code>V35B2_zip</code>, <code>V36C</code> y <code>pruebaJutrip</code>.',
])}
<h2>Tu lista de comprobación de esta tanda</h2>${li([
  'Gana una medalla de oro o de plata: la pantalla entra con un pequeñísimo retraso (0,47 s) porque tu sonido empieza antes que la animación.',
  'Un pedazo con 2 y con 3 colecciones a la vez: cada insignia empieza cuando acaba la anterior.',
  'Emblema de Roma, Coliseo (todo su recorrido, hasta el fuego del final), maravilla nueva (1.ª y 4.ª) y resumen del viaje.',
  'El «Visto» (toque + brillo) y la campanita del aviso siguen sonando como antes.',
])}
<div class="eric"><h2>PARA ERIC</h2>${li([
  '<b>Qué escuchar en el iPhone</b> (con el sonido puesto y sin el modo silencio): <b>las medallas</b> (bronce, plata, oro y diamante), <b>un pedazo con 2 colecciones</b> (el Coliseo suma a la vez en «Los imprescindibles» y «La Roma antigua»), <b>un emblema de Roma</b>, <b>el Coliseo</b> (el golpe a los 3,6 s, el redoble final a partir de los 24,9 s), <b>la maravilla nueva</b> y <b>el resumen del viaje</b>.',
  '<b>La apertura</b> sigue en silencio en la web (decisión de la V35B); tu sonido de la apertura queda guardado para la app de las tiendas.',
  '<b>Lanzarote</b> sigue con lo que tenía; cuando me pases el otro zip lo pongo igual.',
  '<b>Un límite que debes saber:</b> la app todavía no sabe poner un sonido de Code <i>retocado</i> con [Editar] (en este zip no había ninguno; si en el de Lanzarote hay alguno, lo añado entonces).',
  'Los tres «¿?» de licencias (<code>FIRE.mp3</code>, <code>shine.mp3</code>, <code>dimante.mp3</code>).',
  'Reiniciado el api-server al final de la tanda.',
])}</div></html>`
fs.writeFileSync('docs/dias/REPASO_V40.html', html)
console.log('ok')
