// Ayudante de pruebaRevisionRutas.mjs: abre la app (npm run dev) en un Chrome sin ventana, crea el viaje con la generación de la app, lo abre en DÍAS y lee lo que enseña la pantalla.
//
// Tanda 10S (A1) — por qué fallaban las pruebas «por la carga» y qué se hizo aquí:
//   · `window.__rutaPrueba` NO existe al cargar la página: main.tsx la trae con un `import()` dinámico y, con un Vite recién arrancado o con la CPU ocupada, compilar esa cadena de módulos tarda más
//     que los bucles de 60 x 500 ms (30 s) que tenían las pruebas → «__rutaPrueba is not a function» y «Cannot read properties of null (reading 'days')». Ahora `abrirApp` NO devuelve la app hasta que
//     `__rutaPrueba` existe (tope de 3 minutos y mensaje claro); los bucles viejos de las pruebas pasan a la primera.
//   · El puerto de depuración era un número al azar entre 600: dos Chrome a la vez podían chocar. Ahora lo elige Chrome (puerto 0) y se lee de `DevToolsActivePort` de SU carpeta de perfil.
//   · `escribir` con `focus()` sobre un campo que aún no existe daba «Cannot read properties of null (reading 'focus')»: ahora espera al campo (hasta 20 s) y, si no sale, dice cuál.
//   · El cierre raro de node (código 3221226505 / 0xC0000409 tras dar 0 fallos): es el fallo de libuv en Windows al llamar a `process.exit()` con un WebSocket y un Chrome aún cerrándose.
//     `cerrar()` ahora cierra el WebSocket y espera; y `process.exit` se retrasa unos 400 ms mientras haya una app abierta o recién cerrada.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const esperaGlobal = (ms) => new Promise((r) => setTimeout(r, ms))

// --- El cierre limpio de node (libuv en Windows se cae si se sale con un WebSocket y un hijo cerrándose) ---------------------------------------------------------------------------------------------
const abiertas = new Set()
let usada = false
const salirDeVerdad = process.exit.bind(process)
process.exit = (codigo) => {
  if (!usada) return salirDeVerdad(codigo)
  if (codigo !== undefined) process.exitCode = codigo
  for (const cerrarUna of [...abiertas]) {
    try {
      cerrarUna()
    } catch {
      /* ya cerrada */
    }
  }
  setTimeout(() => salirDeVerdad(process.exitCode ?? 0), 400)
}

// Si el proceso acaba por un error (o sin cerrar), ningún Chrome de prueba se queda vivo.
process.on('exit', () => {
  for (const cerrarUna of [...abiertas]) {
    try {
      cerrarUna()
    } catch {
      /* ya cerrada */
    }
  }
})

/** `opciones`: `ancho`/`alto` (por defecto 390 x 844), `ruta` (lo que va tras el origen, por defecto `/?cuentas=off`), `oscuro` (modo noche del sistema), `antes` (un texto de JavaScript que se pone antes de que cargue la página),
 *  `sinEsperarRuta` (no esperar a `window.__rutaPrueba`: para páginas que no son la app de desarrollo) y `topeRuta` (segundos de espera de `__rutaPrueba`, por defecto 300; un Vite frío con la CPU ocupada llegó a tardar 200 s). */
export async function abrirApp(baseIn = 'http://localhost:5173', opciones = {}) {
  usada = true
  // (Tanda 10M: la batería arranca su propio Vite y lo dice en APP_URL; así ninguna prueba depende de un Vite abierto desde hace horas.)
  const base = opciones.baseFija ? baseIn : process.env.APP_URL || baseIn
  const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((f) => fs.existsSync(f))
  if (!CHROME) throw new Error('No encuentro Chrome.')
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'enLaApp-'))
  // Puerto 0: lo elige Chrome (nunca choca con otro Chrome de prueba) y lo escribe en <perfil>/DevToolsActivePort.
  const chrome = spawn(CHROME, ['--remote-debugging-port=0', `--user-data-dir=${perfil}`, '--headless=new', '--mute-audio', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' })
  const esp = esperaGlobal
  let puerto
  for (let i = 0; i < 240 && !puerto; i++) {
    try {
      puerto = Number(fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]) || undefined
    } catch {
      /* arrancando */
    }
    if (!puerto) await esp(250)
  }
  if (!puerto) {
    try {
      chrome.kill()
    } catch {
      /* ya parado */
    }
    throw new Error('Chrome de prueba no ha arrancado en 60 s (¿el PC va muy cargado?).')
  }
  let url
  for (let i = 0; i < 240 && !url; i++) {
    try {
      url = (await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()).find((x) => x.type === 'page')?.webSocketDebuggerUrl
    } catch {
      /* arrancando */
    }
    if (!url) await esp(250)
  }
  if (!url) {
    try {
      chrome.kill()
    } catch {
      /* ya parado */
    }
    throw new Error('Chrome de prueba arrancó pero no abrió ninguna pestaña en 60 s.')
  }
  const ws = new WebSocket(url)
  await new Promise((o, no) => {
    ws.onopen = o
    ws.onerror = () => no(new Error('No se pudo conectar al Chrome de prueba.'))
  })
  let n = 0
  const pend = new Map()
  /** Las direcciones que ha pedido la página (para ver que el mapa no sale a internet). */
  const peticiones = []
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.method === 'Network.requestWillBeSent') peticiones.push(d.params.request.url)
    if (d.id && pend.has(d.id)) {
      pend.get(d.id)(d)
      pend.delete(d.id)
    }
  }
  const cdp = (method, params = {}) => new Promise((o) => {
    const id = ++n
    pend.set(id, o)
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluar = async (js) => {
    const r = await cdp('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text)
    return r.result?.result?.value
  }
  await cdp('Page.enable')
  await cdp('Network.enable')
  await cdp('Emulation.setFocusEmulationEnabled', { enabled: true })
  await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: opciones.ancho ?? 390, height: opciones.alto ?? 844, deviceScaleFactor: opciones.escala ?? 1, mobile: (opciones.ancho ?? 390) < 700 })
  if (opciones.oscuro) await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
  if (opciones.antes) await cdp('Page.addScriptToEvaluateOnNewDocument', { source: opciones.antes })
  let cerrada = false
  const cerrar = () => {
    if (cerrada) return
    cerrada = true
    abiertas.delete(cerrar)
    try {
      ws.onmessage = null
      ws.onerror = null
      ws.close()
    } catch {
      /* ya cerrado */
    }
    try {
      chrome.kill()
    } catch {
      /* ya parado */
    }
    // (Windows tarda en soltar la carpeta: se reintenta un par de veces sin bloquear a quien llamó.)
    let intentos = 0
    const borrar = () => {
      try {
        fs.rmSync(perfil, { recursive: true, force: true })
      } catch {
        if (++intentos < 8) setTimeout(borrar, 500).unref()
      }
    }
    borrar()
  }
  abiertas.add(cerrar)
  await cdp('Page.navigate', { url: `${base}${opciones.ruta ?? '/?cuentas=off'}` })
  for (let i = 0; i < 240; i++) {
    await esp(500)
    // (Tanda 10N4: una página que no es la app —una pieza de Design servida aparte— no tiene #root: se espera un rato fijo y se sigue.)
    if (opciones.sinEsperarRoot) {
      if (i >= (opciones.esperaFija ?? 8)) break
      continue
    }
    try {
      if (await evaluar("Boolean(document.getElementById('root') && document.getElementById('root').children.length > 0)")) break
    } catch {
      /* cargando */
    }
  }
  // Tanda 10S: en desarrollo (Vite), la app aún no ha terminado de cargar `window.__rutaPrueba` (import dinámico en main.tsx): se espera de verdad, no un rato fijo.
  if (!opciones.sinEsperarRoot && !opciones.sinEsperarRuta) {
    const esDev = await evaluar("Boolean(document.querySelector('script[src*=\"/@vite/client\"], script[src*=\"/src/main.tsx\"]'))").catch(() => false)
    if (esDev) {
      const limite = Date.now() + (opciones.topeRuta ?? 300) * 1000
      let lista = false
      while (!lista && Date.now() < limite) {
        lista = await evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)
        if (!lista) await esp(250)
      }
      if (!lista) console.log(`(aviso: window.__rutaPrueba no existe tras ${opciones.topeRuta ?? 300} s en ${base}: el Vite va muy lento o hay un error de compilación en src/dev/rutaDePrueba.ts)`)
    }
  }
  /** Una captura (JPG) del estado de ahora. */
  const captura = async (archivo, calidad = 80) => {
    const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: calidad })
    fs.mkdirSync(path.dirname(archivo), { recursive: true })
    // (Tanda 10S: Windows a veces bloquea un momento el .jpg —antivirus, indexador, otro proceso— y da EBUSY/EPERM/UNKNOWN (-4094)/EMFILE: se reintenta con una espera corta antes de fallar.)
    const datos = Buffer.from(r.result.data, 'base64')
    for (let intento = 0; ; intento++) {
      try {
        fs.writeFileSync(archivo, datos)
        break
      } catch (e) {
        if (intento >= 8 || !/EBUSY|EPERM|UNKNOWN|EMFILE|EACCES|ENFILE/.test(`${e?.code} ${e?.message}`)) throw e
        await esp(150 * (intento + 1))
      }
    }
  }
  /** Escribe en el campo que cumple el selector (con el teclado de verdad, para que React se entere). Espera a que el campo exista (hasta 20 s). */
  const escribir = async (selector, texto) => {
    let hay = false
    for (let i = 0; i < 80 && !hay; i++) {
      hay = await evaluar(`Boolean(document.querySelector(${JSON.stringify(selector)}))`).catch(() => false)
      if (!hay) await esp(250)
    }
    if (!hay) throw new Error(`escribir: el campo «${selector}» no ha salido en 20 s.`)
    await evaluar(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.focus(); e.select?.(); return true })()`)
    await cdp('Input.insertText', { text: texto })
  }
  /** Espera (con tope y mensaje claro) a que `js` sea verdadero. Devuelve true/false; con `lanzar` lanza un error en vez de devolver false. */
  const hasta = async (js, { segundos = 30, lanzar = null } = {}) => {
    const limite = Date.now() + segundos * 1000
    while (Date.now() < limite) {
      if (await evaluar(js).catch(() => false)) return true
      await esp(250)
    }
    if (lanzar) throw new Error(`${lanzar} (esperé ${segundos} s)`)
    return false
  }
  return { evaluar, esp, cerrar, cdp, captura, escribir, peticiones, hasta }
}
