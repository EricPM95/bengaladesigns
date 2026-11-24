// V47: SOLO capturas (no es una prueba) de la tarjeta de la parada en modo iPhone: antes de llegar y al llegar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV47.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V47_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]

async function una({ ancho, nombre, min, mut, llegar = false, demo = '' }) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho, alto: 844 })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  try {
    for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 4; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    await a.evaluar(`(async () => {
      const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
      r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
      ${mut}
      st.setState({ route: r, screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      ${demo}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setDevSimulatedTodayIso('2026-10-17'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3000)
    if (llegar) {
      await a.evaluar("(() => { const b = document.querySelector('[data-hoy-ya-he-llegado]'); b?.click(); return Boolean(b) })()")
      await a.esp(2500)
    }
    const info = await a.evaluar(`(() => { const c = Array.from(document.querySelectorAll('[data-caja-parada]')).map((e) => ({ k: e.getAttribute('data-caja-parada'), g: e.querySelector('[data-caja-grande]')?.textContent, s: e.querySelector('[data-caja-sub]')?.textContent, ancho: Math.round(e.getBoundingClientRect().width), corta: e.scrollWidth > e.clientWidth + 1 })); return JSON.stringify({ c, titulo: document.querySelector('[data-hoy-titulo]')?.textContent, pedazo: document.querySelector('[data-hoy-pedazos]')?.innerText.replace(/\\s+/g, ' ') ?? null, botones: Array.from(document.querySelectorAll('[data-boton-nombre]')).map((b) => b.textContent) }) })()`)
    console.log(nombre, info)
    await a.captura(png(nombre))
  } finally {
    a.cerrar()
  }
}

// 1 · Antes de llegar, el caso más largo (cerrado ahora, sin ubicación) a 375 px: la primera parada (Museos Vaticanos, 8:00-20:00) a las 7:00
await una({ ancho: 375, nombre: 'v47_antes_375_cerrado_ahora', min: 7 * 60, mut: '' })
// 2 · Antes de llegar, un sitio sin horario (la Plaza del Campidoglio, que se trae al primer sitio con su propia foto)
// (la ruta de pruebas no lleva esa plaza: se vuelve la primera parada una plaza SIN horario y SIN la foto de lo que era, para que la foto se pida por su propio nombre)
const PLAZA = "const d0 = r.days.find((d) => !d.isReturnLeg); const s0 = d0.stops.find((s) => !s.isBreak && !s.isArrival); s0.name = 'Plaza del Campidoglio'; s0.fullName = 'Plaza del Campidoglio'; for (const k of ['photoUrl', 'fixedPhotoUrl', 'wikipediaTitle', 'hours', 'hours_data', 'hoursData', 'scheduleText', 'schedule']) delete s0[k]; s0.photoName = 'Piazza del Campidoglio'; s0.durationMinutes = 30; s0.coordinates = { lat: 41.8933, lng: 12.4829 }"
await una({ ancho: 390, nombre: 'v47_antes_plaza', min: 10 * 60, mut: PLAZA })
// 3 · Al llegar (Ya estás aquí), con su pedazo: «La Roma de Miguel Ángel» y el trozo de la plaza
await una({
  ancho: 390,
  nombre: 'v47_al_llegar',
  min: 10 * 60,
  mut: PLAZA,
  llegar: true,
  demo: "window.__pedazosDemo = { 'Plaza del Campidoglio': ['La Roma de Miguel Ángel'] }; window.__piezaDemo = { 'Plaza del Campidoglio': { coleccion: 'miguel_angel', sitio: 'plaza_del_campidoglio' } }",
})
console.log('capturas hechas')
