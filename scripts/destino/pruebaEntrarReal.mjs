// La prueba de verdad del arreglo de entrar: la app en un Chrome nuevo y sin datos (como una ventana de incógnito), con el Supabase de verdad.
//   node scripts/destino/pruebaEntrarReal.mjs [--url=http://localhost:5173] [--captura=docs/dias/capturas_entrar]
// Hace falta `npm run dev` y la clave de Supabase en .env.local. NO inicia sesión en Google (no se puede ni se debe desde aquí): se llega hasta el momento de salir hacia Google, se frena ahí,
// y se SIMULA lo que Supabase deja en la dirección cuando esa cuenta de Google ya existe (`identity_already_exists`). Se mira, en el navegador de verdad y con la sesión anónima de verdad:
//   1. (Tanda 10K) [Continuar con Google] va DIRECTO a Google (una sola salida, sin vincular antes).
//   2. Al volver con un error (aunque sea `identity_already_exists`), NO sale otra vez a Google.
//   3. Si vuelve con el mismo error otra vez, NO hace ninguna llamada más, NO recarga y enseña «No hemos podido entrar. Inténtalo de nuevo.» con su botón.
// (10S) NO da de alta una cuenta anonima nueva en cada pasada (Supabase limita las altas: «Request rate limit reached»). El Chrome nuevo arranca con la sesion de UNA cuenta anonima FIJA, la de
//   docs/dias/_cuentas_prueba_10n3_entrar.json (fuera de git: solo guarda su refresh token, que no se imprime nunca; se renueva en cada pasada). Es lo mismo que le pasa a quien ya abrio la app antes: la sesion
//   anonima ya existe. Solo si ese archivo no existe o la sesion ya no vale, la app da de alta una nueva (1 alta) y esa sesion se guarda para las siguientes pasadas. Usa el Supabase real: CORRER SOLA.
// No toca ningún navegador tuyo: lleva su propio Chrome, su propio perfil y su propio puerto, y los borra al acabar.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const opcion = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=') ?? def
const base = opcion('url', process.env.APP_URL || 'http://localhost:5173')
const salida = opcion('captura', null)
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((f) => fs.existsSync(f))
if (!CHROME) throw new Error('No encuentro Chrome ni Edge.')
if (salida) fs.mkdirSync(salida, { recursive: true })

let puerto = 0 // (10S) puerto 0: lo elige Chrome y lo escribe en <perfil>/DevToolsActivePort (como _enLaApp)
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pruebaEntrarReal-'))
const chrome = spawn(CHROME, [`--remote-debugging-port=0`, `--user-data-dir=${perfil}`, '--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' })
const parar = () => {
  try {
    chrome.kill()
  } catch {
    /* ya parado */
  }
  try {
    fs.rmSync(perfil, { recursive: true, force: true })
  } catch {
    /* en Windows puede tardar en soltarse */
  }
}
process.on('exit', parar)
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function conectar() {
  for (let i = 0; i < 80; i++) {
    try {
      if (!puerto) puerto = Number(fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]) || 0
      if (!puerto) throw new Error('arrancando')
      const pestanas = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()
      const p = pestanas.find((x) => x.type === 'page')
      if (p) return p.webSocketDebuggerUrl
    } catch {
      /* arrancando */
    }
    await espera(250)
  }
  throw new Error('Chrome no ha arrancado.')
}
const ws = new WebSocket(await conectar())
await new Promise((ok, no) => {
  ws.onopen = ok
  ws.onerror = no
})
let n = 0
const pendientes = new Map()
const peticiones = [] // {url, metodo, tipo}
const navegaciones = []
const consola = []
ws.onmessage = async (m) => {
  const d = JSON.parse(m.data)
  if (d.id && pendientes.has(d.id)) {
    const { ok, no } = pendientes.get(d.id)
    pendientes.delete(d.id)
    d.error ? no(new Error(d.error.message)) : ok(d.result)
  } else if (d.method === 'Fetch.requestPaused') {
    const { requestId, request, resourceType } = d.params
    // (Las comprobaciones previas de permisos del navegador —OPTIONS— no son llamadas de la app: no se cuentan.)
    if (request.method !== 'OPTIONS') peticiones.push({ url: request.url, metodo: request.method, tipo: resourceType })
    // Lo que sale hacia Google (o la página de autorizar de Supabase que lleva a Google): se frena aquí con una página en blanco; nada llega a Google.
    if (/accounts\.google\.com/.test(request.url) || (resourceType === 'Document' && /\/auth\/v1\/authorize\?/.test(request.url))) {
      navegaciones.push(request.url)
      await cdp('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'text/html' }], body: Buffer.from('<html><body>(frenado: aquí saldría hacia Google)</body></html>').toString('base64') })
    } else await cdp('Fetch.continueRequest', { requestId }).catch(() => undefined)
  } else if (d.method === 'Runtime.exceptionThrown') consola.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text)
  else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') consola.push(d.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
}
const cdp = (metodo, params = {}) =>
  new Promise((ok, no) => {
    const id = ++n
    pendientes.set(id, { ok, no })
    ws.send(JSON.stringify({ id, method: metodo, params }))
  })
const evaluar = async (js) => {
  const r = await cdp('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
  return r.result.value
}
const foto = async (nombre) => {
  if (!salida) return
  const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 78 })
  fs.writeFileSync(path.join(salida, `${nombre}.jpg`), Buffer.from(r.data, 'base64'))
  console.log(`   ✓ captura ${nombre}.jpg`)
}

let comprobaciones = 0
const fallos = []
const debe = (cond, texto, detalle = '') => {
  comprobaciones++
  console.log(`  ${cond ? '✓' : '✗'} ${texto}${cond ? '' : ' — ' + detalle}`)
  if (!cond) fallos.push(texto)
}
const cuantas = (re) => peticiones.filter((p) => re.test(p.url)).length
const esperarA = async (js, ms = 90000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try {
      if (await evaluar(js)) return true
    } catch {
      /* la página aún carga */
    }
    await espera(400)
  }
  return false
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Network.enable')
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await cdp('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] })
let marcos = 0
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data)
  if (d.method === 'Page.frameNavigated' && !d.params.frame.parentId) marcos++
})

// ── La sesion anonima fija (sin altas nuevas) ──
const ARCHIVO_SESION = 'docs/dias/_cuentas_prueba_10n3_entrar.json'
const entorno = { ...process.env }
try {
  for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l)
    if (m && entorno[m[1]] === undefined) entorno[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* sin .env.local */
}
const URL_SB = entorno.VITE_SUPABASE_URL
const CLAVE_SESION = URL_SB ? `sb-${new URL(URL_SB).hostname.split('.')[0]}-auth-token` : null
let sembrada = false
if (URL_SB && entorno.VITE_SUPABASE_ANON_KEY && fs.existsSync(ARCHIVO_SESION)) {
  try {
    const guardada = JSON.parse(fs.readFileSync(ARCHIVO_SESION, 'utf8'))
    const c = createClient(URL_SB, entorno.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await c.auth.refreshSession({ refresh_token: guardada.refresh_token })
    if (!error && data.session?.user?.is_anonymous) {
      const poner = `try { if (!localStorage.getItem(${JSON.stringify(CLAVE_SESION)})) localStorage.setItem(${JSON.stringify(CLAVE_SESION)}, ${JSON.stringify(JSON.stringify(data.session))}) } catch (e) {}`
      await cdp('Page.addScriptToEvaluateOnNewDocument', { source: poner })
      sembrada = true
    }
  } catch {
    /* sin sesion guardada que valga: la app dara de alta una nueva */
  }
}
console.log(sembrada ? '   (arranca con la sesion anonima fija: ninguna alta nueva)' : '   (no hay sesion anonima fija que valga: la app dara de alta UNA nueva y se guardara para las siguientes pasadas)')

const abrir = async (ruta) => {
  await cdp('Page.navigate', { url: `${base}${ruta}` })
}

console.log('1. Chrome nuevo y sin datos: la pantalla de entrar')
await abrir('/?cuentas=on')
const hayEntrar = await esperarA("Boolean(document.querySelector('[data-entrar]'))")
debe(hayEntrar, 'la app abre y pide entrar (pantalla de entrar a la vista)')
await foto('1-pide-entrar')
const antes1 = peticiones.length
const hayBoton = await evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Continuar con Google/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()")
debe(hayBoton, 'está el botón [Continuar con Google] y se toca')
await espera(6000)
const vinculos1 = cuantas(/\/auth\/v1\/user\/identities\/authorize/)
const sesiones = cuantas(/\/auth\/v1\/signup/)
console.log(`   (sesión anónima creada: ${sesiones} · llamadas a vincular: ${vinculos1} · salidas hacia Google: ${navegaciones.length})`)
debe(vinculos1 === 0 && navegaciones.filter((u) => /\/auth\/v1\/authorize\?/.test(u)).length === 1, 'con la sesión anónima, [Continuar con Google] NO vincula antes y sale hacia Google UNA sola vez (frenado aquí; Tanda 10K)', `vinculaciones ${vinculos1}, salidas ${navegaciones.length}`)

console.log('2. Vuelve de Google: «esa cuenta ya existe» (identity_already_exists)')
const err = '#error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user'
const vinculosAntes = cuantas(/\/auth\/v1\/user\/identities\/authorize/)
const salidasAntes = navegaciones.length
await abrir('/' + err)
await espera(9000)
const vinculosDespues = cuantas(/\/auth\/v1\/user\/identities\/authorize/)
debe(vinculosDespues === vinculosAntes, 'NO vuelve a intentar vincular', `vinculaciones: ${vinculosAntes} → ${vinculosDespues}`)
const salidasHacia = navegaciones.slice(salidasAntes).filter((u) => /\/auth\/v1\/authorize\?/.test(u))
debe(salidasHacia.length === 0, 'un error al volver NO manda a Google otra vez (Tanda 10K: ya no hay segundo viaje)', `salidas: ${salidasHacia.length}`)
await foto('2-sale-a-google-una-vez')

console.log('3. Vuelve con el mismo error otra vez: se para')
const marcosAntes = marcos
const peticionesAntes = peticiones.length
await abrir('/' + err)
await espera(9000)
const nuevas = peticiones.slice(peticionesAntes).filter((p) => /\/auth\/v1\/(authorize|user\/identities)/.test(p.url))
debe(nuevas.length === 0, 'no hace NINGUNA llamada más a Google ni a vincular', JSON.stringify(nuevas.map((p) => p.url.slice(0, 90))))
const texto = await evaluar("document.body.innerText")
debe(/No hemos podido entrar\. Inténtalo de nuevo\./.test(texto), 'sale «No hemos podido entrar. Inténtalo de nuevo.»')
debe(await evaluar("Array.from(document.querySelectorAll('button')).some((x) => /Continuar con Google/.test(x.textContent || ''))"), 'y el botón [Continuar con Google] sigue para volver a probar')
await espera(6000)
debe(marcos - marcosAntes <= 1, 'la página no se recarga sola (recargas desde entonces: ' + (marcos - marcosAntes - 1) + ')', `navegaciones: ${marcos - marcosAntes}`)
await foto('3-no-hemos-podido-entrar')
const guardada = JSON.parse((await evaluar("localStorage.getItem('trazo:cuenta:anonima')")) ?? 'null')
debe(Boolean(guardada?.uid && guardada?.refreshToken), 'la sesión anónima de este navegador sigue guardada (con su token) para pasar lo suyo a la cuenta cuando se entre')

// Guarda la sesion tal como la dejo el navegador (el refresh token se renueva) para la proxima pasada.
if (CLAVE_SESION) {
  try {
    const cruda = await evaluar(`localStorage.getItem(${JSON.stringify(CLAVE_SESION)})`)
    const rt = cruda ? JSON.parse(cruda).refresh_token : null
    if (rt) fs.writeFileSync(ARCHIVO_SESION, JSON.stringify({ refresh_token: rt }))
  } catch {
    /* no se pudo guardar: la proxima pasada dara de alta una nueva */
  }
}
const mios = consola.filter((c) => !/mapbox|404|Failed to load resource|net::ERR|api\/|favicon/i.test(c))
debe(mios.length === 0, 'sin errores en la consola', mios.slice(0, 3).join(' | '))
console.log(`\nPrueba de entrar de verdad: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
ws.close()
parar()
process.exit(fallos.length ? 1 : 0)
