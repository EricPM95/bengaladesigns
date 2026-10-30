// LA BATERÍA: corre TODAS las pruebas que valen (scripts/destino/prueba*.mjs), de varias en varias, y cuenta los fallos de cada una.
//   node scripts/destino/bateriaParalela.mjs [conc=3] [navegador=2] [filtro=regex] [solo=nombre1,nombre2] [salida=ruta.json] [tope=1500] [motor=1] [sinvite=1] [puertovite=5199] [extra="paso=37"]
// (Comando de siempre para la batería entera, con prioridad baja:  node scripts/destino/bateriaParalela.mjs navegador=2 conc=3 salida=docs/dias/_bateria.json )
//
// TANDA 10S (A1) — la batería en 0 fallos de UNA pasada, y más rápida. Lo que hace ahora, y por qué (ver docs/dias/COMO_CORRER_LAS_PRUEBAS.md):
//   1. TODAS las pruebas: se enumeran todos los `prueba*.mjs` (antes un filtro por nombre dejaba fuera pruebaTanda7_*, pruebaListas, pruebaSalida…). Solo se excluyen
//        · los ENVOLTORIOS (los que no comprueban nada propio: solo corren otras pruebas que ya están sueltas en la batería; se detectan por su CONTENIDO: un spawnSync/execFileSync de `scripts/destino/prueba…`);
//          si un envoltorio tuviera alguna parte que NO está suelta, no se excluye (la comprobación sale en el aviso);
//        · las que ya estaban fuera por decisión vieja: pruebaFase6y5_motor (solo con motor=1), Wikimedia y pruebaFase6y8_comida.
//   2. Quién usa Chrome se mira siguiendo los `import` (antes solo miraba el texto de la propia prueba: las que abren Chrome por _10n5_comun, _ayuda10F… contaban como «de Node» y corrían sin límite, DUPLICANDO Chromes).
//      Hasta `navegador=2` pruebas de Chrome a la vez; las de Node (sin Chrome), `conc` a la vez.
//   3. Las que comparten algo (el Supabase real y sus cuentas de prueba, un puerto…: `*_real`, `pruebaEntrarReal`, o que crean un cliente de Supabase / cuentas) NO corren a la vez con nada: van AL FINAL, una a una, solas.
//   4. Cada prueba tiene SU carpeta de temporales (TEMP/TMP propios): su perfil de Chrome y sus ficheros no se mezclan con los de otra; al acabar se borra, y si quedó un Chrome vivo de esa prueba se mata.
//      Al pasarse de tiempo, se mata el árbol entero de procesos (antes quedaban Chrome huérfanos).
//   5. El Vite de la batería es el ESTABLE (_vite_estable.config.mjs: sin vigilar archivos ni HMR), recién arrancado en su puerto y CALENTADO antes de la primera prueba (la entrada, el viaje de pruebas y todas las pestañas).
//      Se cierra al acabar. La API por defecto es la de siempre (8787).
//   6. La batería coge la cola de Chrome (%TEMP%\trazo_chrome_prueba.lock) mientras corre: los agentes que usan _conCola esperan a que acabe. (Si la lanza _conCola, no la vuelve a coger.)
//   7. Las más largas, primero: el orden sale de los tiempos de la última pasada (docs/dias/_tiempos_bateria.json) y así dos Chrome acaban a la vez, no uno esperando solo al final.
//   8. NADA de repetir pruebas a mano ni «reintentos» automáticos: una prueba MAL es MAL; su salida entera se guarda y se enseña la cola.
// Las pruebas con exit raro pero «0 fallos» en su salida cuentan como bien, pero salen marcadas «OK*» (con el cierre arreglado ya no debería haber ninguna).
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const conc = Number(args.conc ?? 3)
const concNavegador = Math.min(Number(args.navegador ?? 2), 2)
const DIR = 'scripts/destino'
const API = process.env.API_URL ?? 'http://localhost:8787'
const env0 = { ...process.env, API_URL: API, SERVIDOR: process.env.SERVIDOR ?? API, TRAZO_BATERIA: '1' }
const esp = (ms) => new Promise((r) => setTimeout(r, ms))
const leer = (f) => fs.readFileSync(path.join(DIR, f), 'utf8')

// --- 1. Qué pruebas ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const todas = fs.readdirSync(DIR).filter((f) => /^prueba.*\.mjs$/.test(f)).sort()
const filtro = args.filtro ? new RegExp(args.filtro) : null
const solo = args.solo ? args.solo.split(',').map((s) => s.trim().replace(/\.mjs$/, '')) : null
// `sin=a,b` (a la vista, en el comando): deja fuera esas pruebas SOLO en esta pasada; sale en el informe. Nunca es un «saltable» escondido.
const sin = args.sin ? args.sin.split(',').map((x) => x.trim().replace(/.mjs$/, '')) : []
const fueraPorDecision = (f) => sin.includes(f.replace(/.mjs$/, '')) || /Wikimedia|pruebaFase6y8_comida/.test(f) || (args.motor !== '1' && /pruebaFase6y5_motor/.test(f))

/** Un envoltorio: corre otras pruebas (`scripts/destino/prueba…` o `scripts/destino/${f}`) y suma sus resultados, sin comprobar nada propio. */
const esEnvoltorio = (f) => /(spawnSync|execFileSync|spawn)\(\s*process\.execPath\s*,\s*\[\s*`scripts\/destino\/(\$\{|prueba)/.test(leer(f))
function partesDeEnvoltorio(f) {
  if (!esEnvoltorio(f)) return null
  const txt = leer(f)
  const base = f.replace(/\.mjs$/, '')
  const nombradas = [...txt.matchAll(/prueba\w*\.mjs/g)].map((m) => m[0]).filter((x) => x !== f && todas.includes(x) && !esEnvoltorio(x))
  if (nombradas.length) return [...new Set(nombradas)]
  // (pruebaCorr6z6 → pruebaCorr6z6_reservas… ; pruebaTanda6z6 → pruebaTanda6z6a…: partes que el envoltorio arma con una plantilla)
  return todas.filter((x) => x !== f && !esEnvoltorio(x) && x.startsWith(base) && /^_?[a-z0-9_]*\.mjs$/.test(x.slice(base.length)))
}
const envoltorios = new Map()
for (const f of todas) {
  const partes = partesDeEnvoltorio(f)
  if (partes?.length) envoltorios.set(f, partes)
}
const lista = todas.filter((f) => !envoltorios.has(f) && !fueraPorDecision(f) && (!filtro || filtro.test(f)) && (!solo || solo.some((s) => f === `${s}.mjs`)))
// (con `solo=`: nombres exactos; con `filtro=`: expresión regular; sin nada: todas.)
if (solo) {
  const sinEncontrar = solo.filter((s) => !todas.includes(`${s}.mjs`))
  if (sinEncontrar.length) console.log(`(aviso: no existe ${sinEncontrar.join(', ')})`)
}
// Un envoltorio solo se deja fuera si TODAS sus partes están en la batería completa (o fuera por decisión vieja); si no, se corre él.
const rescatados = []
if (!filtro && !solo) {
  for (const [w, partes] of envoltorios) {
    const faltan = partes.filter((p) => !lista.includes(p) && !fueraPorDecision(p))
    if (faltan.length) {
      lista.push(w)
      rescatados.push(`${w} (le faltan sueltas: ${faltan.join(', ')})`)
    }
  }
  lista.sort()
}

// --- 2. Quién usa Chrome (siguiendo los imports) y quién comparte algo ---------------------------------------------------------------------------------------------------------------------------------
const memoChrome = new Map()
function usaChrome(f, visitando = new Set()) {
  if (memoChrome.has(f)) return memoChrome.get(f)
  if (visitando.has(f) || !fs.existsSync(path.join(DIR, f))) return false
  visitando.add(f)
  const txt = leer(f)
  let r = f === '_enLaApp.mjs' || /abrirApp|chrome\.exe|remote-debugging-port/.test(txt)
  if (!r) {
    for (const m of txt.matchAll(/(?:from\s+|import\(\s*)['"`]\.\/([\w.-]+\.mjs)['"`]/g)) if (usaChrome(m[1], visitando)) r = true
  }
  memoChrome.set(f, r)
  return r
}
/** Comparten el Supabase real (altas anónimas, cuentas de prueba, filas de verdad): van solas y al final. */
// (Una prueba con Chrome que use el Supabase real —altas anónimas por cada Chrome nuevo, subida de fotos…— lo dice con la marca «USA EL SUPABASE REAL» en su cabecera: mirando solo el texto no se puede saber de otro modo.)
const comparteAlgo = (f) => /(_real|Real)\.mjs$/.test(f) || /USA EL SUPABASE REAL|createClient\(|admin\.createUser|signInAnonymously\(|storage\.from\(/.test(leer(f))
const compartidas = lista.filter(comparteAlgo)
const normales = lista.filter((f) => !comparteAlgo(f))
const deNavegador = normales.filter((f) => usaChrome(f))
const deNode = normales.filter((f) => !deNavegador.includes(f))

// --- 3. Tiempos de la última pasada (para empezar por las más largas) ---------------------------------------------------------------------------------------------------------------------------------------
const ARCHIVO_TIEMPOS = 'docs/dias/_tiempos_bateria.json'
let tiempos = {}
try {
  tiempos = JSON.parse(fs.readFileSync(ARCHIVO_TIEMPOS, 'utf8'))
} catch {
  /* primera vez */
}
const porLargas = (a) => [...a].sort((x, y) => (tiempos[y] ?? 60) - (tiempos[x] ?? 60) || x.localeCompare(y))

// --- 4. La cola de Chrome y los procesos -----------------------------------------------------------------------------------------------------------------------------------------------------------------
const CANDADO = path.join(os.tmpdir(), 'trazo_chrome_prueba.lock')
let tengoCandado = false
async function cogerCandado() {
  let avisos = 0
  if (process.env.TRAZO_EN_COLA === '1') return
  const limite = Date.now() + 40 * 60 * 1000
  while (Date.now() < limite) {
    try {
      fs.mkdirSync(CANDADO)
      fs.writeFileSync(path.join(CANDADO, 'quien'), `${process.pid} ${new Date().toISOString()} bateriaParalela`)
      tengoCandado = true
      // (La batería es larga: el candado se «renueva» para que _conCola no lo dé por muerto a los 25 minutos.)
      setInterval(() => {
        try {
          const t = new Date()
          fs.utimesSync(CANDADO, t, t)
        } catch {
          /* suelto */
        }
      }, 60000).unref()
      return
    } catch {
      try {
        if (Date.now() - fs.statSync(CANDADO).mtimeMs > 25 * 60 * 1000) fs.rmSync(CANDADO, { recursive: true, force: true })
      } catch {
        /* otro lo ha soltado */
      }
      if (++avisos % 12 === 1) console.log('(esperando la cola de Chrome: otra prueba tiene el candado…)')
      await esp(5000)
    }
  }
  throw new Error('No he podido coger la cola de Chrome en 40 minutos.')
}
const soltarCandado = () => {
  if (!tengoCandado) return
  tengoCandado = false
  try {
    fs.rmSync(CANDADO, { recursive: true, force: true })
  } catch {
    /* ya suelto */
  }
}
const matarArbol = (pid) => {
  try {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' })
  } catch {
    /* ya muerto */
  }
}
/** Mata los Chrome que sigan vivos con un perfil dentro de la carpeta de temporales de UNA prueba (los de las demás no se tocan: la ruta lleva el nombre único de la carpeta). */
function matarChromesDe(nombreCarpeta) {
  try {
    spawnSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${nombreCarpeta}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' })
  } catch {
    /* sin permiso */
  }
}
const bajaPrioridad = (pid) => {
  try {
    os.setPriority(pid, os.constants.priority.PRIORITY_BELOW_NORMAL)
  } catch {
    /* sin permiso */
  }
}
try {
  os.setPriority(process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL)
} catch {
  /* sin permiso */
}

// --- 5. El Vite estable, recién arrancado y calentado -----------------------------------------------------------------------------------------------------------------------------------------------------
async function responde(url) {
  try {
    await fetch(url)
    return true
  } catch {
    return false
  }
}
async function calentar(url) {
  try {
    const { abrirApp } = await import('./_enLaApp.mjs')
    const a = await abrirApp(url, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0', baseFija: true, topeRuta: 900 })
    await a.hasta("Boolean(document.querySelector('[data-primera-pantalla]'))", { segundos: 120 })
    let creado
    for (let i = 0; i < 3 && creado !== true; i++) creado = await a.evaluar('window.__rutaPrueba().then(() => true, (e) => String((e && e.message) || e))').catch((e) => String(e))
    if (creado !== true) console.log(`(calentando: __rutaPrueba dio ${creado})`)
    const tienda = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
    for (const modo of ['route', 'days', 'today', 'explore', 'bookings', 'route']) {
      await a.evaluar(`${tienda}.then((s) => { s.setActiveDayId(null); s.setMode('${modo}'); return true })`).catch(() => undefined)
      await a.esp(2500)
    }
    await a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true").catch(() => undefined)
    await a.esp(4000)
    a.cerrar()
    // (y la pantalla de inicio de siempre, con el mapa)
    const b = await abrirApp(url, { ruta: '/?cuentas=off&apertura=0', baseFija: true })
    await b.esp(4000)
    b.cerrar()
    console.log('Vite calentado (la app abierta una vez, con todas sus pestañas)')
  } catch (e) {
    console.log(`(no se pudo calentar el Vite: ${e?.message ?? e})`)
  }
}
let viteProc = null
async function arrancarVite() {
  const puerto = Number(args.puertovite ?? 5199)
  const url = `http://localhost:${puerto}`
  if (args.sinvite === '1') {
    env0.APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
    console.log(`Sin Vite propio: se usa ${env0.APP_URL}`)
    return
  }
  if (await responde(url)) throw new Error(`Ya hay algo funcionando en ${url} (¿un Vite de otra batería?). Ciérralo o usa puertovite=<otro>.`)
  viteProc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(puerto), '--strictPort', '--config', `${DIR}/_vite_estable.config.mjs`], { stdio: 'ignore', env: { ...process.env, API_TARGET: API } })
  bajaPrioridad(viteProc.pid)
  let listo = false
  for (let i = 0; i < 240 && !listo; i++) {
    listo = await responde(url)
    if (!listo) await esp(500)
  }
  if (!listo) throw new Error('El Vite de la batería no arrancó en 2 minutos.')
  // Se compila lo primero que pide siempre la app (así la primera prueba no paga el Vite frío), y luego se abre la app entera una vez.
  for (const ruta of ['/', '/src/main.tsx', '/src/App.tsx', '/src/dev/rutaDePrueba.ts', '/src/store/useRouteStore.ts']) await fetch(`${url}${ruta}`).catch(() => undefined)
  env0.APP_URL = url
  console.log(`Vite estable propio y recién arrancado en ${url}`)
  await calentar(url)
}

// --- 6. Correr una prueba ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const RUN = fs.mkdtempSync(path.join(os.tmpdir(), 'trazo_bateria_'))
// En la batería, algunas pruebas corren en su versión de MUESTREO (el barrido completo se corre aparte y NO queda cubierto por la batería):
const ARGS_BATERIA = { 'pruebaListas.mjs': ['muestra=1'] }
const MUESTREOS = { 'pruebaListas.mjs': 'pruebaListas: muestreo de 12 fechas fijas (el barrido completo de 365 se corre aparte: ver COMO_CORRER_LAS_PRUEBAS.md)' }
const sinAnsi = (t) => t.replace(/\x1b\[[0-9;]*m/g, '')
const AMARILLO = '\x1b[33m'
const RESET = '\x1b[0m'
// El tope contra cuelgues es POR PRUEBA: 2 veces su tiempo histórico (docs/dias/_tiempos_bateria.json), como mínimo `tope` (25 min) y como máximo 3 horas; las que se saben larguísimas llevan el suyo (60 min).
const TOPE_BASE = Number(args.tope ?? 1500)
const TOPES_PROPIOS = { 'pruebaTanda7_reparto.mjs': 3600 }
const topeDe = (f) => Math.min(10800, Math.max(TOPES_PROPIOS[f] ?? 0, TOPE_BASE, 2 * (tiempos[f] ?? 0)))
const resultados = []
let contador = 0
let t0Bateria = Date.now()
const correr = (f) =>
  new Promise((resolve) => {
    const t0 = Date.now()
    const nombreCarpeta = `bat${process.pid}_${++contador}`
    const tmp = path.join(RUN, nombreCarpeta)
    fs.mkdirSync(tmp, { recursive: true })
    const extra = args.extra ? args.extra.split(' ') : []
    const env = { ...env0, TEMP: tmp, TMP: tmp, TMPDIR: tmp }
    const p = spawn(process.execPath, [`${DIR}/${f}`, ...(ARGS_BATERIA[f] ?? []), ...(/pruebaFase6y5_motor|pruebaFase6y7_motor/.test(f) ? extra : [])], { env, stdio: ['ignore', 'pipe', 'pipe'] })
    bajaPrioridad(p.pid)
    let out = ''
    // Si la prueba YA dio su resultado final y no sale sola en 90 s (algo suyo deja un temporizador vivo: pasó con pruebaTanda7_reparto, que acaba en 20 s y se quedaba colgada una hora), se corta y
    // se apunta como «OK*» (cerró mal) en vez de gastar el tope entero. Si lo último que dijo no es un resultado limpio, no se toca: sigue el tope de siempre.
    let colgadaTrasAcabar = false
    let vigilante = null
    const rearmar = () => {
      clearTimeout(vigilante)
      vigilante = setTimeout(() => {
        const ultimas = sinAnsi(out).trim().split(/\r?\n/).slice(-4).join('\n')
        if (/(^|\s)0 fallos?\b|TODO BIEN/i.test(ultimas) && !/[1-9]\d*\s+fallos?\b/i.test(ultimas)) {
          colgadaTrasAcabar = true
          matarArbol(p.pid)
        }
      }, 90000)
    }
    p.stdout.on('data', (d) => {
      out += d
      rearmar()
    })
    p.stderr.on('data', (d) => {
      out += d
      rearmar()
    })
    let porTiempo = false
    const tope = setTimeout(() => {
      porTiempo = true
      matarArbol(p.pid)
    }, topeDe(f) * 1000)
    p.on('close', (code) => {
      clearTimeout(tope)
      clearTimeout(vigilante)
      // Nada de Chrome vivo de esta prueba, y su carpeta fuera.
      if (fs.existsSync(tmp) && fs.readdirSync(tmp).length) matarChromesDe(nombreCarpeta)
      const seg = Math.round((Date.now() - t0) / 1000)
      const lineaFallos = out.split('\n').reverse().find((l) => /fallos?/i.test(l)) ?? ''
      const m = /(\d+)\s+fallos?/i.exec(lineaFallos)
      const fallos = m ? Number(m[1]) : null
      const mal = (porTiempo && !colgadaTrasAcabar) || !(fallos === 0 || (code === 0 && fallos == null) || colgadaTrasAcabar)
      const raro = !mal && (code !== 0 || colgadaTrasAcabar)
      // Casos que la prueba aparta como «PENDIENTE DEL MOTOR» (decisión de Eric): no son OK ni fallo; se listan aparte.
      const limpia = sinAnsi(out)
      const nPend = [...limpia.matchAll(/pendientes_motor:\s*(\d+)/g)].map((x) => Number(x[1])).pop() ?? 0
      const motivos = limpia.split(/\r?\n/).filter((l) => /PENDIENTE DEL MOTOR/.test(l)).map((l) => l.trim().slice(0, 260))
      const pendientes = Math.max(nPend, motivos.length)
      const ultimas = out.trim().split('\n').slice(-6).join(' | ').slice(0, 500)
      resultados.push({ f, code, fallos, seg, mal, raro, porTiempo, ultimas, pendientes, motivos: motivos.slice(0, 40) })
      if (!porTiempo) tiempos[f] = seg // (una prueba cortada por el tope no dice cuánto tarda de verdad)
      console.log(`${mal ? 'MAL' : raro ? (fallos === 0 ? 'OK*' : 'ok?') : 'OK '} ${f} exit=${code}${porTiempo && !colgadaTrasAcabar ? ' (PASADO DE TIEMPO)' : ''}${colgadaTrasAcabar ? ' (acabó bien pero NO SALÍA SOLA: cortada a los 90 s de su resultado)' : ''} fallos=${fallos} ${seg}s`)
      if (pendientes) console.log(`${AMARILLO}    ${pendientes} pendientes del motor en ${f}${RESET}`)
      if (mal) {
        const salida = path.join(os.tmpdir(), `trazo_bateria_MAL_${f}.txt`)
        try {
          fs.writeFileSync(salida, out)
          console.log(`    (salida entera en ${salida})`)
        } catch {
          /* sin permiso */
        }
        console.log(out.trim().split('\n').slice(-14).map((l) => `    | ${l.slice(0, 220)}`).join('\n'))
      }
      setTimeout(() => {
        try {
          fs.rmSync(tmp, { recursive: true, force: true })
        } catch {
          /* Windows tarda en soltarlo */
        }
      }, 1500).unref()
      resolve()
    })
  })
const cola = (archivos, hilos) => {
  const pendientes = [...archivos]
  const trabajador = async () => {
    while (pendientes.length) await correr(pendientes.shift())
  }
  return Promise.all(Array.from({ length: Math.max(1, Math.min(hilos, archivos.length)) }, trabajador))
}

// --- 7. Todo junto -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
console.log(`Batería: ${lista.length} pruebas (${deNode.length} de Node, ${deNavegador.length} de Chrome a ${concNavegador} a la vez, ${compartidas.length} que comparten algo y van solas al final).`)
if (sin.length) console.log(`AVISO: fuera SOLO en esta pasada, por sin=: ${sin.join(', ')}`)
if (envoltorios.size) console.log(`Envoltorios que no se corren (sus partes ya están sueltas): ${[...envoltorios.keys()].join(', ')}`)
if (rescatados.length) console.log(`AVISO envoltorios que SÍ se corren porque les faltan partes sueltas: ${rescatados.join('; ')}`)
if (compartidas.length) console.log(`Van solas al final: ${compartidas.join(', ')}`)

if (args.listar === '1') {
  // (Solo enseña cómo repartiría la batería, sin correr nada.)
  console.log(`\nDE CHROME (${deNavegador.length}):\n  ${porLargas(deNavegador).join('\n  ')}\n\nDE NODE (${deNode.length}):\n  ${deNode.join('\n  ')}\n\nSOLAS (${compartidas.length}):\n  ${compartidas.join('\n  ')}`)
  fs.rmSync(RUN, { recursive: true, force: true })
  process.exit(0)
}

const limpiar = () => {
  soltarCandado()
  if (viteProc?.pid) matarArbol(viteProc.pid)
}
process.on('SIGINT', () => {
  limpiar()
  process.exit(130)
})
try {
  if (deNavegador.length || compartidas.length) {
    if (!(await responde(API))) throw new Error(`La API no responde en ${API} (arráncala: node server/index.js).`)
    await cogerCandado()
    await arrancarVite()
  }
  t0Bateria = Date.now()
  await Promise.all([cola(porLargas(deNode), conc), cola(porLargas(deNavegador), concNavegador)])
  // Las que comparten algo: solas, una a una, sin nada más corriendo.
  await cola(porLargas(compartidas), 1)
} finally {
  limpiar()
}
try {
  fs.writeFileSync(ARCHIVO_TIEMPOS, JSON.stringify(Object.fromEntries(Object.entries(tiempos).sort()), null, 1))
} catch {
  /* sin permiso */
}
if (args.salida) fs.writeFileSync(args.salida, JSON.stringify(resultados, null, 1))
const malas = resultados.filter((r) => r.mal)
const raras = resultados.filter((r) => r.raro)
const total = Math.round((Date.now() - t0Bateria) / 60000 * 10) / 10
console.log('\nLas 12 más lentas:')
for (const r of [...resultados].sort((a, b) => b.seg - a.seg).slice(0, 12)) console.log(`  ${String(r.seg).padStart(5)} s  ${r.f}`)
// Carpetas enLaApp-* viejas (perfiles de Chrome que no se borraron): deberían ser 0.
try {
  const viejas = fs.readdirSync(os.tmpdir()).filter((n) => /^enLaApp-/.test(n)).filter((n) => {
    try {
      return Date.now() - fs.statSync(path.join(os.tmpdir(), n)).mtimeMs > 24 * 3600 * 1000
    } catch {
      return false
    }
  })
  if (viejas.length) console.log(`${AMARILLO}AVISO: quedan ${viejas.length} carpetas enLaApp-* de más de un día en ${os.tmpdir()} (perfiles de Chrome sin borrar de pruebas antiguas): bórralas a mano.${RESET}`)
  else console.log('Carpetas enLaApp-* viejas en %TEMP%: 0')
} catch {
  /* sin permiso */
}
const conPendientes = resultados.filter((r) => r.pendientes)
const totalPend = conPendientes.reduce((n, r) => n + r.pendientes, 0)
const muestreadas = resultados.filter((r) => MUESTREOS[r.f])
if (muestreadas.length) {
  console.log('\nMUESTREOS (NO cuentan como pruebas completas):')
  for (const r of muestreadas) console.log(`  ${MUESTREOS[r.f]}`)
}
if (totalPend) {
  console.log(`\n${AMARILLO}${totalPend} PENDIENTES DEL MOTOR (no son OK ni fallos; decisión de Eric, no se cuentan arriba):`)
  for (const r of conPendientes) {
    console.log(`  ${r.f}: ${r.pendientes}`)
    for (const m of r.motivos.slice(0, 12)) console.log(`      ${m}`)
  }
  console.log(RESET)
}
if (raras.length) console.log(`\nSalida rara con 0 fallos (OK*): ${raras.map((r) => `${r.f} (exit ${r.code})`).join(', ')}`)
console.log(`\n${resultados.length} pruebas (${deNode.length} de Node, ${deNavegador.length} de Chrome, ${compartidas.length} solas) en ${total} min; MAL: ${malas.map((r) => r.f).join(', ') || 'ninguna'}`)
if (totalPend) console.log(`${AMARILLO}${totalPend} pendientes del motor (en ${conPendientes.length} pruebas)${RESET}`)
process.exitCode = malas.length ? 1 : 0
try {
  fs.rmSync(RUN, { recursive: true, force: true })
} catch {
  /* quedan carpetas vacías de pruebas: da igual */
}
setTimeout(() => process.exit(malas.length ? 1 : 0), 300).unref()
