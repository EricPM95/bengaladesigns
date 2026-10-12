// La prueba de la Tanda 6y9, parte de los AUDIOS de las historias:
//   SERVIDOR=http://localhost:8854 node scripts/destino/pruebaFase6y9_audios.mjs     (con un servidor de la app con el código de esta tanda)
// Da fallo si:
//   1. LA REGLA DE QUIÉN SUENA: con audio guardado la barra reproduce el audio (y no la voz del móvil); sin audio, la voz del móvil; si el audio falla al sonar, sigue con la voz del móvil;
//      con audio guardado la barra sale aunque el aparato no tenga voz; sin audio y sin voz, no sale;
//   2. EL ÍNDICE: un audio solo se ofrece si la huella de su texto es la del texto de ahora (un audio de un texto viejo no sale); y el servidor sin índice contesta «sin audio»;
//   3. SIN EMPRESA DE VOZ A LA VISTA: ningún texto de pantalla (JSX), ficha servida ni nombre de fichero público dice el nombre de la empresa de voz;
//   4. EL PROGRAMA: sin clave no llama a la red ni escribe nada; --simular cuenta 31 historias y los caracteres; --solo cuenta 1; la clave no está en ningún fichero del proyecto;
//   5. EL CANDADO: en la gratis, la barra de las demás historias sigue con candado (aunque tengan audio); la del Coliseo suena.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { audioVigente, huellaDelTexto, identificadorDeSitio, textoDelAudio, VOZ_HISTORIAS } from '../../shared/audio/historiasAudio.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const API = process.env.SERVIDOR ?? process.env.API_URL ?? 'http://localhost:8787'
process.env.API_URL = API

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6y9_audios_entrada.tsx')
const { createElement, renderToStaticMarkup, Escuchar, crearEscuchaSegunFuente, crearEscuchaAudio, pedirAudioDeHistoria } = M

// ═══════════ 1. Quién suena ═══════════
const nuevoAudio = ({ falla = false } = {}) => {
  const a = { jugadas: 0, pausas: 0, currentTime: 0, duration: 100, onended: null, onerror: null, ontimeupdate: null }
  a.play = () => {
    a.jugadas++
    return falla ? Promise.reject(new Error('no deja')) : Promise.resolve()
  }
  a.pause = () => {
    a.pausas++
  }
  return a
}
const nuevaSintesis = () => {
  const s = { hablado: [], cancelado: 0 }
  s.speak = (e) => s.hablado.push(e)
  s.cancel = () => s.cancelado++
  s.pause = () => {}
  s.resume = () => {}
  s.getVoices = () => [{ lang: 'es-ES' }]
  return s
}
const crear = (audioRuta, { audioFalla = false, sintesis = nuevaSintesis() } = {}) => {
  const audio = nuevoAudio({ falla: audioFalla })
  let creadoCon = null
  const estados = []
  const cambios = []
  const escucha = crearEscuchaSegunFuente({
    audio: audioRuta,
    crearAudio: (ruta) => {
      creadoCon = ruta
      return audio
    },
    sintesis,
    crearEnunciado: (texto) => ({ text: texto }),
    texto: 'Una historia corta. Y otra frase.',
    voz: { lang: 'es-ES' },
    alCambiar: (e) => estados.push(e),
    alCambiarDeFuente: (n) => cambios.push(n),
  })
  return { audio, sintesis, escucha, estados, cambios, creadoCon: () => creadoCon }
}
{
  const c = crear('/audios/roma/fontana_de_trevi.mp3')
  c.escucha.hablar('x', null)
  debe(c.creadoCon() === '/audios/roma/fontana_de_trevi.mp3', '1 quién suena', 'con audio guardado no se ha pedido su fichero')
  debe(c.audio.jugadas === 1 && c.sintesis.hablado.length === 0, '1 quién suena', 'con audio guardado debe sonar el audio y NO la voz del móvil')
  debe(c.escucha.estado() === 'hablando', '1 quién suena', 'el audio no pasa a «hablando»')
  c.escucha.pausar()
  debe(c.escucha.estado() === 'pausa' && c.audio.pausas === 1, '1 quién suena', 'pausar no pausa el audio')
  c.escucha.seguir()
  debe(c.escucha.estado() === 'hablando' && c.audio.jugadas === 2, '1 quién suena', 'seguir no sigue el audio')
  c.audio.currentTime = 25
  let visto = null
  const d = crearEscuchaAudio(c.audio, () => {}, (h, t) => (visto = h / t), () => {})
  d.hablar()
  c.audio.currentTime = 25
  c.audio.ontimeupdate()
  debe(visto === 0.25, '1 quién suena', `el progreso del audio no sale (esperado 0,25 y salió ${visto})`)
  c.escucha.parar()
  debe(c.escucha.estado() === 'parado', '1 quién suena', 'parar no para el audio')
}
{
  const c = crear(null)
  c.escucha.hablar('Una historia corta. Y otra frase.', { lang: 'es-ES' })
  debe(c.creadoCon() === null && c.audio.jugadas === 0 && c.sintesis.hablado.length >= 1, '1 quién suena', 'sin audio guardado debe sonar la voz del móvil')
}
{
  const c = crear('/audios/roma/x.mp3', { audioFalla: true })
  c.escucha.hablar('x', null)
  await new Promise((r) => setTimeout(r, 20))
  debe(c.sintesis.hablado.length >= 1 && c.cambios.length === 1, '1 quién suena', 'si el audio falla al sonar, debe seguir con la voz del móvil')
  debe(c.cambios[0] && c.cambios[0].estado() === 'hablando', '1 quién suena', 'tras el fallo, la voz del móvil no está hablando')
}
{
  const c = crear('/audios/roma/x.mp3')
  c.audio.onerror?.()
  c.escucha.hablar('x', null)
  c.audio.onerror()
  debe(c.sintesis.hablado.length >= 1, '1 quién suena', 'si el fichero del audio da error, debe seguir con la voz del móvil')
}
{
  const c = crear(null, { sintesis: null })
  debe(c.escucha === null, '1 quién suena', 'sin audio y sin voz no debe haber con qué leer')
}

// La barra (SSR): audio conocido de un sitio -> la barra sale aunque no haya voz en español en el aparato; sin audio y sin voz, no sale.
{
  const llamadas = []
  const fetchReal = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('/api/historia-audio')) {
      const { name } = JSON.parse(opts.body)
      llamadas.push(name)
      return { ok: true, json: async () => ({ audio: name === 'Con Audio' ? '/audios/roma/con_audio.mp3' : null }) }
    }
    return fetchReal(url, opts)
  }
  await pedirAudioDeHistoria('Roma', 'Con Audio')
  await pedirAudioDeHistoria('Roma', 'Sin Audio')
  await pedirAudioDeHistoria('Roma', 'Con Audio')
  debe(llamadas.length === 2, '1 quién suena', `el cliente repite la pregunta del mismo sitio (${llamadas.length} llamadas, esperadas 2)`)
  globalThis.fetch = fetchReal
  ponerVersion('completa')
  const html = (sitio) => renderToStaticMarkup(createElement(Escuchar, { barra: true, texto: 'Una historia.', clave: 'a', sitio }))
  const conAudio = html({ destino: 'Roma', nombre: 'Con Audio' })
  const sinAudio = html({ destino: 'Roma', nombre: 'Sin Audio' })
  debe(conAudio.includes('Escuchar historia') && conAudio.includes('data-escuchar-barra'), '1 quién suena', 'con audio guardado y sin voz en el aparato, la barra debe salir')
  debe(sinAudio === '', '1 quién suena', 'sin audio y sin voz en el aparato, la barra no debe salir')

  // 5. El candado: en la gratis, con audio, la barra sigue con candado; la libre (Coliseo) suena.
  ponerVersion('gratis')
  const gratisCandado = renderToStaticMarkup(createElement(Escuchar, { barra: true, texto: 'Una historia.', clave: 'a', sitio: { destino: 'Roma', nombre: 'Con Audio' } }))
  const gratisLibre = renderToStaticMarkup(createElement(Escuchar, { barra: true, libre: true, texto: 'Una historia.', clave: 'a', sitio: { destino: 'Roma', nombre: 'Con Audio' } }))
  debe(gratisCandado.includes('data-escuchar="candado"') && !gratisCandado.includes('<audio'), '5 candado', 'en la gratis, la historia con audio debe seguir con candado')
  debe(gratisLibre.includes('data-escuchar="parado"'), '5 candado', 'en la gratis, la historia marcada libre (Coliseo) debe sonar')
  ponerVersion('completa')
}

// ═══════════ 2. El índice ═══════════
{
  const porNombre = new Map()
  const DIR = 'data/pipeline_v2/detalle/roma/'
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) for (const p of JSON.parse(fs.readFileSync(DIR + f, 'utf8')).places) if (p.historia) porNombre.set(p.name, p.historia)
  debe(porNombre.size === 31, '2 índice', `hay ${porNombre.size} historias en los datos, no 31`)
  const ids = [...porNombre.keys()].map(identificadorDeSitio)
  debe(new Set(ids).size === 31 && ids.every((i) => /^[a-z0-9_]+$/.test(i)), '2 índice', 'los identificadores de sitio no son 31 distintos y limpios')
  const coliseo = porNombre.get('Coliseo')
  const trevi = porNombre.get('Fontana de Trevi')
  const indice = { voz: 'x', sitios: { coliseo: { fichero: 'coliseo.mp3', huella_texto: huellaDelTexto(coliseo) }, panteon: { fichero: 'panteon.mp3', huella_texto: huellaDelTexto('un texto viejo') } } }
  debe(audioVigente(indice, 'roma', 'Coliseo', coliseo) === '/audios/roma/coliseo.mp3', '2 índice', 'el audio de un texto sin cambios debe ofrecerse')
  debe(audioVigente(indice, 'roma', 'Fontana de Trevi', trevi) === null, '2 índice', 'un sitio sin audio en el índice no debe ofrecer ninguno')
  debe(audioVigente(indice, 'roma', 'Panteón', porNombre.get('Panteón')) === null, '2 índice', 'un audio de un texto que ha cambiado NO debe ofrecerse')
  debe(audioVigente(null, 'roma', 'Coliseo', coliseo) === null, '2 índice', 'sin índice no debe ofrecerse nada')
  debe(huellaDelTexto(`${coliseo}\n`) === huellaDelTexto(coliseo) && huellaDelTexto(`${coliseo}!`) !== huellaDelTexto(coliseo) && textoDelAudio(' a\n\nb ') === 'a b', '2 índice', 'la huella debe ignorar solo los espacios sobrantes')
  const r = await fetch(`${API}/api/historia-audio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', name: 'Coliseo' }) })
  const dato = await r.json()
  const hayIndice = fs.existsSync('data/audios/roma.json')
  debe(r.ok && (hayIndice || dato.audio === null), '2 índice', 'el servidor sin índice debe contestar «sin audio»')
  const r400 = await fetch(`${API}/api/historia-audio`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  debe(r400.status === 400, '2 índice', 'una petición sin datos debe dar 400')
}

// ═══════════ 3. Sin empresa de voz a la vista ═══════════
{
  const empresa = /eleven\s*labs|elevenlabs|11labs/i
  const sinEmpresa = (texto) => !empresa.test(texto)
  // Textos de pantalla: todo el JSX de src (texto entre etiquetas, aria-label, title, alt, placeholder).
  const archivos = []
  const recorrer = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) recorrer(p)
      else if (/\.(tsx|ts)$/.test(e.name)) archivos.push(p)
    }
  }
  recorrer('src')
  const conEmpresa = archivos.filter((f) => !sinEmpresa(fs.readFileSync(f, 'utf8')))
  debe(conEmpresa.length === 0, '3 sin empresa', `el nombre de la empresa de voz sale en el código de la app: ${conEmpresa.join(', ')}`)
  // Los datos que se sirven al viajero: las fichas y el índice de audios.
  const DIR = 'data/pipeline_v2/detalle/roma/'
  for (const f of fs.readdirSync(DIR)) debe(sinEmpresa(fs.readFileSync(DIR + f, 'utf8')), '3 sin empresa', `${f}: la ficha dice el nombre de la empresa de voz`)
  debe(!VOZ_HISTORIAS.id_voz || sinEmpresa(JSON.stringify(Object.entries(VOZ_HISTORIAS).filter(([k]) => k === 'nombre'))), '3 sin empresa', 'el nombre de la voz lleva el nombre de la empresa')
  // Nombres de fichero públicos.
  const publicos = fs.existsSync('public/audios') ? fs.readdirSync('public/audios', { recursive: true }).map(String) : []
  debe(publicos.every(sinEmpresa), '3 sin empresa', 'un fichero público de audio lleva el nombre de la empresa de voz')
  debe(/^[a-z0-9_]+$/.test(identificadorDeSitio('Fontana de Trevi')), '3 sin empresa', 'el nombre de fichero no sale limpio')
}

// ═══════════ 4. El programa ═══════════
{
  const programa = 'scripts/destino/crearAudiosHistorias.mjs'
  // Sin clave (entorno limpio y sin .env.local): para sin hacer nada; antes de la clave no hay ninguna llamada a la red en el programa.
  const entornoSinClave = { ...process.env, ELEVENLABS_API_KEY: '' }
  const existiaEnv = fs.existsSync('.env.local')
  const antes = fs.existsSync('public/audios') ? fs.readdirSync('public/audios', { recursive: true }).length : 0
  const sinClave = spawnSync('node', [programa], { encoding: 'utf8', env: entornoSinClave })
  debe(existiaEnv || /Falta la clave/.test(sinClave.stdout), '4 programa', `sin clave debe parar con un mensaje claro (salió: ${sinClave.stdout.slice(0, 120)})`)
  debe(existiaEnv || sinClave.status === 1, '4 programa', 'sin clave debe acabar con código de error')
  const despues = fs.existsSync('public/audios') ? fs.readdirSync('public/audios', { recursive: true }).length : 0
  debe(antes === despues && !fs.existsSync('data/audios/roma.json') || process.env.PRUEBA_CON_INDICE, '4 programa', 'sin clave se ha escrito algo')
  const sim = spawnSync('node', [programa, '--simular'], { encoding: 'utf8', env: entornoSinClave })
  debe(/Historias: 31\./.test(sim.stdout) && /Por crear: 31\./.test(sim.stdout), '4 programa', `--simular no cuenta 31 historias (salió: ${sim.stdout.slice(0, 160)})`)
  const caracteres = Number((/unos ([\d.]+) caracteres/.exec(sim.stdout)?.[1] ?? '0').replace(/\./g, ''))
  debe(caracteres > 70000 && caracteres < 80000, '4 programa', `--simular da ${caracteres} caracteres (esperados unos 74.000)`)
  debe(/no se ha llamado a nadie/.test(sim.stdout) && sim.status === 0, '4 programa', '--simular debe decir que no llama a nadie y acabar bien')
  const uno = spawnSync('node', [programa, '--simular', '--solo=fontana_de_trevi'], { encoding: 'utf8', env: entornoSinClave })
  debe(/Historias: 1\./.test(uno.stdout), '4 programa', '--solo no cuenta 1 historia')
  const malo = spawnSync('node', [programa, '--simular', '--solo=no_existe'], { encoding: 'utf8', env: entornoSinClave })
  debe(malo.status === 1 && /No hay ninguna historia/.test(malo.stdout), '4 programa', '--solo con un sitio que no existe debe parar con un mensaje')
  const codigo = fs.readFileSync(programa, 'utf8')
  debe(!/xi-api-key['"]?\s*:\s*['"`][A-Za-z0-9]/.test(codigo) && !/sk_[a-f0-9]{20,}/.test(codigo), '4 programa', 'el programa parece llevar una clave escrita')
  debe(/leerClave\(\)/.test(codigo) && !/console\.log\([^)]*clave/.test(codigo.replace(/Falta la clave[^`']*/g, '')), '4 programa', 'el programa muestra la clave en pantalla')
  // Ningún fichero del proyecto (versionable) lleva una clave de la voz.
  const rastreados = spawnSync('git', ['ls-files'], { encoding: 'utf8' }).stdout.split('\n').filter((f) => f && !/\.(jpg|png|mp3|webp|svg|woff2)$/.test(f) && fs.existsSync(f))
  const conClave = rastreados.filter((f) => /sk_[a-f0-9]{30,}/.test(fs.readFileSync(f, 'utf8')))
  debe(conClave.length === 0, '4 programa', `una clave de la voz está escrita en: ${conClave.join(', ')}`)
}

limpiar()
console.log(`Comprobaciones: ${comprobaciones}. Fallos: ${fallos.length}.`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
