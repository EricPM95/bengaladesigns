// Corre varias pruebas en paralelo y cuenta los fallos de cada una:
//   node scripts/destino/bateriaParalela.mjs [conc=12] [filtro=regex] [salida=ruta.json] [extra="paso=37"] [navegador=2] [sinvite=1] [motor=1]
// Las pruebas con exit raro pero «0 fallos» en su salida cuentan como bien (el quirk conocido).
//
// Tanda 10M: para que la batería quede en 0 SIN repetir nada a mano (en la 10L fallaban a la vez 10B, 10G, 10H, 10I y pruebaRevisionLargos, y solas pasaban):
//   · Vite abierto mucho rato acumula módulos duplicados por el HMR (`useRouteStore.route` null en las pruebas de navegador). La batería arranca SU PROPIO Vite, recién nacido, en otro puerto
//     (APP_URL, que `abrirApp` de _enLaApp.mjs respeta) y lo cierra al acabar. `sinvite=1` usa el de siempre (5173).
//   · Las pruebas que abren Chrome (todas las que usan `abrirApp`) corren de `navegador=2` en `navegador=2` como mucho (por defecto 2), no todas a la vez con las demás: bajo carga se pasaban de tiempo.
//     Las demás (las de Node, sin Chrome) siguen con `conc` a la vez. Las dos tandas corren a la vez, cada una en su cola.
//   · `pruebaFase6y5_motor` (una prueba larguísima del motor que siempre agota su tiempo; se arregla en la Tanda 12) no entra salvo que se pida con `motor=1`.
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const conc = Number(args.conc ?? 12)
const concNavegador = Number(args.navegador ?? 2)
const filtro = new RegExp(args.filtro ?? '^prueba(Fase6|Corr6|Tanda6|Fotos6|Cuentas|Civitatis|PorQue|Logros|Pantallas8b|Visto8b3|Tanda10|Jutrip|RevisionLargos|Entrar|Fechas|Navidad)')
const sinMotorLargo = args.motor === '1' ? /./ : /pruebaFase6y5_motor/
const lista = fs
  .readdirSync('scripts/destino')
  .filter((f) => f.endsWith('.mjs') && filtro.test(f) && !/Wikimedia|pruebaFase6y8_comida/.test(f) && !(args.motor !== '1' && sinMotorLargo.test(f)))
  .sort()
const usaNavegador = (f) => /abrirApp|chrome\.exe|remote-debugging-port/.test(fs.readFileSync(`scripts/destino/${f}`, 'utf8'))
const deNavegador = lista.filter(usaNavegador)
const deNode = lista.filter((f) => !deNavegador.includes(f))

const API = process.env.API_URL ?? 'http://localhost:8841'
const env = { ...process.env, API_URL: API, SERVIDOR: process.env.SERVIDOR ?? API }

/**
 * Un Vite recién arrancado compila cada módulo la primera vez que se lo piden: con él «frío», las pruebas que esperan un tiempo fijo (el mapa, el cálculo de transportes…) se pasan de tiempo. Se calienta abriendo la app una vez
 * en un Chrome sin ventana, creando el viaje de pruebas y pasando por todas las pestañas (así se compilan también las pantallas que se bajan al abrirlas).
 */
async function calentar(url) {
  try {
    const { abrirApp } = await import('./_enLaApp.mjs')
    const a = await abrirApp(url, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0' })
    for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar('window.__rutaPrueba().then(() => true)').catch(() => undefined)
    const tienda = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
    for (const modo of ['route', 'days', 'today', 'explore', 'bookings', 'route']) {
      await a.evaluar(`${tienda}.then((s) => { s.setActiveDayId(null); s.setMode('${modo}'); return true })`).catch(() => undefined)
      await a.esp(2500)
    }
    await a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true").catch(() => undefined)
    await a.esp(4000)
    a.cerrar()
    // (y la pantalla de inicio de siempre, con el mapa)
    const b = await abrirApp(url, { ruta: '/?cuentas=off&apertura=0' })
    await b.esp(4000)
    b.cerrar()
    console.log('Vite calentado (la app abierta una vez, con todas sus pestañas)')
  } catch (e) {
    console.log(`(no se pudo calentar el Vite: ${e?.message ?? e})`)
  }
}

/** Un Vite recién arrancado en su propio puerto (sin los módulos duplicados que deja el HMR de uno abierto desde hace horas). */
async function arrancarVite() {
  if (args.sinvite === '1') return null
  const puerto = Number(args.puertovite ?? 5199)
  const p = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(puerto), '--strictPort'], { stdio: 'ignore' })
  const url = `http://localhost:${puerto}`
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) {
        // (Se calienta la entrada para que la primera prueba no pague la compilación.)
        await fetch(`${url}/src/main.tsx`).catch(() => undefined)
        env.APP_URL = url
        console.log(`Vite propio y recién arrancado en ${url}`)
        await calentar(url)
        return p
      }
    } catch {
      /* arrancando */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  p.kill()
  console.log('(no se pudo arrancar un Vite propio: se usa el de siempre)')
  return null
}

const resultados = []
const correr = (f) =>
  new Promise((resolve) => {
    const t0 = Date.now()
    const extra = args.extra ? args.extra.split(' ') : []
    const p = spawn(process.execPath, [`scripts/destino/${f}`, ...(/pruebaFase6y5_motor|pruebaFase6y7_motor/.test(f) ? extra : [])], { env })
    let out = ''
    p.stdout.on('data', (d) => {
      out += d
    })
    p.stderr.on('data', (d) => {
      out += d
    })
    const tope = setTimeout(() => p.kill(), Number(args.tope ?? 1500) * 1000)
    p.on('close', (code) => {
      clearTimeout(tope)
      const ultimas = out.trim().split('\n').slice(-6).join(' | ').slice(0, 500)
      const m = /(\d+)\s+fallos?/i.exec(out.split('\n').reverse().find((l) => /fallos?/i.test(l)) ?? '')
      const fallos = m ? Number(m[1]) : null
      resultados.push({ f, code, fallos, seg: Math.round((Date.now() - t0) / 1000), ultimas })
      console.log(`${fallos === 0 ? 'OK ' : code === 0 && fallos == null ? 'ok?' : 'MAL'} ${f} exit=${code} fallos=${fallos} ${Math.round((Date.now() - t0) / 1000)}s`)
      resolve()
    })
  })
const cola = (archivos, hilos) => {
  let siguiente = 0
  const trabajador = async () => {
    while (siguiente < archivos.length) await correr(archivos[siguiente++])
  }
  return Promise.all(Array.from({ length: Math.max(1, Math.min(hilos, archivos.length)) }, trabajador))
}

const vite = deNavegador.length ? await arrancarVite() : null
try {
  await Promise.all([cola(deNode, conc), cola(deNavegador, concNavegador)])
} finally {
  vite?.kill()
}
if (args.salida) fs.writeFileSync(args.salida, JSON.stringify(resultados, null, 1))
console.log(`\n${resultados.length} pruebas (${deNode.length} de Node y ${deNavegador.length} de navegador); MAL: ${resultados.filter((r) => r.fallos !== 0 && !(r.code === 0 && r.fallos == null)).map((r) => r.f).join(', ') || 'ninguna'}`)
process.exitCode = 0
setTimeout(() => process.exit(0), 300).unref()
