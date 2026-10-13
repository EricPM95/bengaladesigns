// La prueba de la Tanda 6y10, parte AUDIOS (nombres que no se pueden adivinar y ninguna lista pública):
//   SERVIDOR=http://localhost:8866 node scripts/destino/pruebaFase6y10_audios.mjs     (con un servidor de la app con el código de esta tanda)
// Da fallo si:
//   1. NOMBRES CON HUELLA: el fichero es <sitio>-<huella>.mp3 con ≥16 hex; mismo texto y voz = mismo nombre; otro texto, otra voz u otro modelo = otro nombre; 31 nombres distintos;
//   2. ÍNDICE NO SERVIDO: el índice no está en public/, el servidor no tiene express.static, vercel.json no lo publica, y pedirlo por dirección no lo da; public/audios no tiene más que .mp3 con huella;
//   3. EL ENDPOINT: contesta SOLO con la ruta del audio de ese sitio (nunca la lista ni otros sitios); texto cambiado -> null; sin audio -> null; otro método -> no responde;
//   4. SIN AUDIO -> VOZ DEL MÓVIL (la regla de quién suena sigue igual);
//   5. EL PROGRAMA: `--simular` usa los mismos nombres que la app; avisa de «hay que recrearlo» si el texto cambió; no toca nada.
// Para la parte 3 y 5 escribe un índice de prueba en data/audios/roma.json (y un .mp3 falso) y LOS BORRA al terminar; si ya existía un índice real, no lo toca y se salta esas partes.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { audioVigente, huellaDeLaVoz, huellaDelAudio, huellaDelTexto, identificadorDeSitio, nombreDelFichero, VOZ_HISTORIAS } from '../../shared/audio/historiasAudio.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const API = process.env.SERVIDOR ?? process.env.API_URL ?? 'http://localhost:8787'
process.env.API_URL = API

const DIR = 'data/pipeline_v2/detalle/roma/'
const porNombre = new Map()
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) for (const p of JSON.parse(fs.readFileSync(DIR + f, 'utf8')).places) if (p.historia) porNombre.set(p.name, p.historia)

// ═══════════ 1. Nombres con huella ═══════════
{
  debe(porNombre.size === 31, '1 nombres', `hay ${porNombre.size} historias, no 31`)
  const nombres = [...porNombre].map(([n, h]) => nombreDelFichero(identificadorDeSitio(n), h))
  debe(nombres.every((n) => /^[a-z0-9_]+-[0-9a-f]{16,}\.mp3$/.test(n)), '1 nombres', 'un nombre de fichero no es <sitio>-<huella de ≥16 hex>.mp3')
  debe(new Set(nombres).size === 31, '1 nombres', 'los 31 nombres no son distintos')
  const t = porNombre.get('Coliseo')
  const a = nombreDelFichero('coliseo', t)
  debe(a === nombreDelFichero('coliseo', t) && a === nombreDelFichero('coliseo', `  ${t}\n\n`), '1 nombres', 'el mismo texto no da el mismo nombre (o los espacios sobrantes lo cambian)')
  debe(a !== nombreDelFichero('coliseo', `${t}.`) && a !== nombreDelFichero('coliseo', t.replace('a', 'e')), '1 nombres', 'otro texto da el mismo nombre')
  debe(a !== nombreDelFichero('coliseo', t, { ...VOZ_HISTORIAS, id_voz: 'otra' }) && a !== nombreDelFichero('coliseo', t, { ...VOZ_HISTORIAS, modelo: 'otro' }), '1 nombres', 'otra voz u otro modelo da el mismo nombre')
  debe(a === nombreDelFichero('coliseo', t, { ...VOZ_HISTORIAS, nombre: 'otro nombre solo para el informe' }), '1 nombres', 'el nombre de la voz (solo informativo) no debería cambiar el fichero')
  debe(huellaDelAudio(t).length === 64, '1 nombres', 'la huella no es un sha-256 entero')
  // No se calcula con lo que se ve por fuera: ni el nombre del sitio solo, ni la huella del texto sin la voz.
  debe(!a.includes(huellaDelTexto(t).slice(0, 24)), '1 nombres', 'el nombre repite la huella del texto sin la voz')
}

// ═══════════ 2. Índice no servido ═══════════
{
  const lista = fs.existsSync('public/audios') ? fs.readdirSync('public/audios', { recursive: true, withFileTypes: true }) : []
  const ficheros = lista.filter((e) => e.isFile()).map((e) => e.name)
  debe(ficheros.every((n) => /^[a-z0-9_]+-[0-9a-f]{16,}\.mp3$/.test(n)), '2 índice', `public/audios tiene ficheros que no son <sitio>-<huella>.mp3: ${ficheros.filter((n) => !/^[a-z0-9_]+-[0-9a-f]{16,}\.mp3$/.test(n)).join(', ')}`)
  debe(!fs.existsSync('public/audios/roma.json') && !fs.existsSync('public/audios/roma/roma.json') && !fs.existsSync('public/data'), '2 índice', 'hay un índice o carpeta de datos dentro de public/')
  const todoPublic = fs.readdirSync('public', { recursive: true }).map(String)
  debe(!todoPublic.some((n) => /(^|[\\/])(roma|indice|index|lista)[^\\/]*\.(json|txt|csv|html)$/i.test(n) && /audio/i.test(n)), '2 índice', 'hay un listado de audios dentro de public/')
  const servidor = fs.readFileSync('server/index.js', 'utf8')
  debe(!/express\.static|serve-static|serveIndex|serve-index/.test(servidor), '2 índice', 'el servidor sirve carpetas enteras (express.static / serve-index)')
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
  debe((vercel.rewrites ?? []).every((r) => !/audios|data/.test(r.source) && !/audios|data/.test(r.destination)), '2 índice', 'vercel.json reescribe /audios o /data')
  const codigoApi = fs.readFileSync('server/index.js', 'utf8').match(/app\.(get|use|all)\(\s*['"`][^'"`]*audio[^'"`]*['"`]/g) ?? []
  debe(codigoApi.length === 0, '2 índice', `hay una ruta GET/USE de audios en el servidor: ${codigoApi.join(', ')}`)
  const cliente = fs.readFileSync('src/lib/escucharAudio.ts', 'utf8')
  debe(!/data\/audios|roma\.json/.test(cliente), '2 índice', 'la app pide el índice entero')
  debe(/'\/api\/historia-audio'/.test(cliente) && /method: 'POST'/.test(cliente), '2 índice', 'la app no pregunta por un solo sitio con POST')
  for (const ruta of ['/data/audios/roma.json', '/audios/roma.json', '/audios/roma/', '/audios/', '/api/historia-audio', '/api/historias-audio', '/api/audios']) {
    let ok = true
    try {
      const r = await fetch(`${API}${ruta}`)
      const texto = await r.text()
      ok = !(r.ok && /"sitios"|\.mp3/.test(texto))
    } catch {
      ok = true
    }
    debe(ok, '2 índice', `GET ${ruta} devuelve una lista de audios`)
  }
}

// ═══════════ 3 y 5. Con un índice de prueba ═══════════
const rutaIndice = 'data/audios/roma.json'
const carpeta = 'public/audios/roma'
const existiaIndice = fs.existsSync(rutaIndice)
const creados = []
if (existiaIndice) {
  console.log('Ya hay un índice real en data/audios/roma.json: se salta la parte con índice de prueba.')
} else {
  try {
    const coliseo = porNombre.get('Coliseo')
    const panteon = porNombre.get('Panteón')
    const viejoPanteon = nombreDelFichero('panteon', 'un texto viejo')
    const nColiseo = nombreDelFichero('coliseo', coliseo)
    fs.mkdirSync('data/audios', { recursive: true })
    fs.writeFileSync(rutaIndice, JSON.stringify({ voz: huellaDeLaVoz(), sitios: { coliseo: { fichero: nColiseo, huella_texto: huellaDelTexto(coliseo), caracteres: 1 }, panteon: { fichero: viejoPanteon, huella_texto: huellaDelTexto('un texto viejo'), caracteres: 1 } } }))
    creados.push(rutaIndice)
    const pedir = async (name, metodo = 'POST') => {
      const r = await fetch(`${API}/api/historia-audio`, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: metodo === 'POST' ? JSON.stringify({ destination: 'Roma', name }) : undefined })
      const texto = await r.text()
      let json = null
      try {
        json = JSON.parse(texto)
      } catch {
        // no es JSON
      }
      return { r, texto, json }
    }
    const c = await pedir('Coliseo')
    debe(c.json?.audio === `/audios/roma/${nColiseo}`, '3 endpoint', `Coliseo no devuelve su ruta con huella (devuelve ${c.texto.slice(0, 120)})`)
    debe(Object.keys(c.json ?? {}).join() === 'audio', '3 endpoint', 'el endpoint devuelve algo más que { audio }')
    debe(!/panteon|sitios|fichero|huella_texto/i.test(c.texto), '3 endpoint', 'la respuesta del Coliseo nombra otros sitios o campos del índice')
    const p = await pedir('Panteón')
    debe(p.json?.audio === null && !/coliseo/i.test(p.texto), '3 endpoint', 'un audio de un texto que ya cambió debe ser null (y no listar otros)')
    const f = await pedir('Fontana de Trevi')
    debe(f.json?.audio === null, '3 endpoint', 'un sitio sin audio debe dar null')
    const x = await pedir('Sitio que no existe')
    debe(x.json?.audio === null, '3 endpoint', 'un sitio que no existe debe dar null')
    const g = await pedir('Coliseo', 'GET')
    debe(!g.r.ok && !/coliseo/i.test(g.texto) || !/"audio"/.test(g.texto), '3 endpoint', 'un GET al endpoint responde con audios')
    debe(/no-store/.test(c.r.headers.get('cache-control') ?? ''), '3 endpoint', 'la respuesta del endpoint se puede guardar en caché')
    // Con el mismo texto actual, la regla de la función compartida da lo mismo que el servidor.
    const idx = JSON.parse(fs.readFileSync(rutaIndice, 'utf8'))
    debe(audioVigente(idx, 'roma', 'Coliseo', coliseo) === c.json?.audio && audioVigente(idx, 'roma', 'Panteón', panteon) === null, '3 endpoint', 'el servidor y la función compartida no coinciden')
    // Un fichero del índice con un nombre que no es el de la huella de AHORA no se ofrece (índice manipulado o voz cambiada).
    const raro = { sitios: { coliseo: { fichero: 'coliseo.mp3', huella_texto: huellaDelTexto(coliseo) } } }
    debe(audioVigente(raro, 'roma', 'Coliseo', coliseo) === null, '3 endpoint', 'se ofrece un fichero sin la huella actual en el nombre')

    // 5. El programa con el índice de prueba.
    const programa = 'scripts/destino/crearAudiosHistorias.mjs'
    const entorno = { ...process.env, ELEVENLABS_API_KEY: '' }
    const sim0 = spawnSync('node', [programa, '--simular'], { encoding: 'utf8', env: entorno })
    const todos = [...porNombre].map(([n, h]) => nombreDelFichero(identificadorDeSitio(n), h))
    debe(todos.every((n) => sim0.stdout.includes(n)) || sim0.stdout.split('\n').filter((l) => /crearía/.test(l)).length === 31, '5 programa', '--simular no usa los mismos nombres con huella que la app')
    debe(sim0.stdout.includes(`el fichero viejo ${viejoPanteon} dejará de usarse`) && /hay que recrearlo/.test(sim0.stdout), '5 programa', '--simular no avisa de que el Panteón (texto cambiado) hay que recrearlo')
    // Ya al día: el índice lo tiene Y el fichero existe en public/audios/roma.
    fs.mkdirSync(carpeta, { recursive: true })
    fs.writeFileSync(`${carpeta}/${nColiseo}`, 'falso')
    creados.push(`${carpeta}/${nColiseo}`)
    const sim1 = spawnSync('node', [programa, '--simular'], { encoding: 'utf8', env: entorno })
    debe(/Ya al día: 1\./.test(sim1.stdout) && /Por crear: 30\./.test(sim1.stdout) && !sim1.stdout.includes(`crearía ${nColiseo}`), '5 programa', `--simular no reconoce el Coliseo ya al día (salió: ${sim1.stdout.slice(0, 120)})`)
    fs.rmSync(`${carpeta}/${nColiseo}`)
    const sim2 = spawnSync('node', [programa, '--simular'], { encoding: 'utf8', env: entorno })
    debe(/Ya al día: 0\./.test(sim2.stdout), '5 programa', 'si falta el fichero, --simular no lo da por pendiente')
    debe(sim0.status === 0 && sim1.status === 0 && fs.readFileSync(rutaIndice, 'utf8').includes(`"voz":"${huellaDeLaVoz()}"`), '5 programa', '--simular ha tocado el índice o ha fallado')
  } finally {
    for (const f of creados) fs.rmSync(f, { force: true })
    try {
      fs.rmdirSync(carpeta)
      fs.rmdirSync('public/audios')
    } catch {
      // no estaban vacías o no existían
    }
    try {
      fs.rmdirSync('data/audios')
    } catch {
      // no vacía o no existía
    }
  }
}

// ═══════════ 4. Sin audio -> voz del móvil ═══════════
{
  const { M, limpiar } = await prepararSSR('scripts/destino/_6y9_audios_entrada.tsx')
  const s = { hablado: [] }
  s.speak = (e) => s.hablado.push(e)
  s.cancel = () => {}
  s.pause = () => {}
  s.resume = () => {}
  s.getVoices = () => [{ lang: 'es-ES' }]
  let creoAudio = false
  const escucha = M.crearEscuchaSegunFuente({
    audio: null,
    crearAudio: () => {
      creoAudio = true
      return {}
    },
    sintesis: s,
    crearEnunciado: (texto) => ({ text: texto }),
    texto: 'Una historia corta.',
    voz: { lang: 'es-ES' },
    alCambiar: () => {},
    alCambiarDeFuente: () => {},
  })
  escucha.hablar('x', null)
  debe(!creoAudio && s.hablado.length >= 1, '4 voz del móvil', 'sin audio (el texto cambió y la huella ya no coincide) no suena la voz del móvil')
  limpiar()
}

console.log(`Comprobaciones: ${comprobaciones}. Fallos: ${fallos.length}.`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
