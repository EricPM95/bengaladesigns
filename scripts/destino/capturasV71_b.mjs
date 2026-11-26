// V71 §1: SOLO capturas (no es una prueba) de las tarjetas «Algo brilla cerca de aquí…» (A1) y «Más cerca…» (A2) dentro de HOY (A4), en modo iPhone (390x844), junto a su dibujo de Design. Un solo Chrome por vez. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV71_b.mjs design|app
// Guarda docs/dias/V71_capturas/A1_app.jpg, A2_app.jpg (la app) y A1_design.jpg, A2_design.jpg, A4_design.jpg (su dibujo, «Emblema Oculto Acercarse.dc.html»).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V71_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'app'

if (MODO === 'design') {
  for (const id of ['A1', 'A2', 'A4']) {
    const js = `(() => {
      const tabl = [...document.querySelectorAll('div')].filter((d) => d.style && d.style.width === '390px' && d.firstElementChild && /^${id} · /.test((d.firstElementChild.textContent || '').trim()))[0]
      if (!tabl) return 'sin tablero'
      const grid = tabl.parentElement
      ;[...grid.children].forEach((c) => { if (c !== tabl) c.style.display = 'none' })
      let p = grid.parentElement; p.style.padding = '0'; p.style.minHeight = '0'
      ;[...p.children].forEach((c) => { if (c !== grid) c.style.display = 'none' })
      tabl.style.padding = '8px'
      document.documentElement.style.background = '#E7DCC6'
      window.scrollTo(0, 0)
      return 'ok'
    })()`
    await capturarDesign('Emblema Oculto Acercarse.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'
const ISO = '2026-10-17'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset }) })
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy2:') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy1:juego:') || k.startsWith('trazo:hoy2b:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    window.__horaFalsa = 600; window.__pos = { lat: 41.8902, lng: 12.4922 }; window.__perm = 'granted'
    st.getState().setDevSimulatedTodayIso('${ISO}'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3500)
  for (let i = 0; i < 3; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Continuar$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }
  const sitio = { sitio: 'foro_romano', nombre: 'Foro Romano y Palatino', en_sitio: 'en el Foro Romano y Palatino', a_sitio: 'al Foro Romano y Palatino' }
  for (const [id, juego, borde] of [['A1', 'brilla', 380], ['A2', 'mas_cerca', 90]]) {
    const resp = { ok: true, cerca: [{ ...sitio, metros: 600, radio_m: 100, al_borde_m: borde, dentro: false, en_ruta_hoy: true, hay_emblema: true, emblema_nombre: 'Oculto', hay_pedazo: false, coleccion_nombre: null }], juego, juego_sitio: sitio.sitio, fuera_de_ruta: null, junto_a: null, reto: null }
    // Cada nivel sale una vez por sitio y día: se borra la marca antes de enseñar el siguiente.
    await a.evaluar(`Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy1:juego:')).forEach((k) => localStorage.removeItem(k)); window.__hoy1Cerca = ${JSON.stringify(resp)}; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true`)
    for (let i = 0; i < 20 && !(await a.evaluar(`Boolean(document.querySelector('[data-juego=${juego}]'))`)); i++) await a.esp(500)
    await a.esp(1200)
    const alto = await a.evaluar(`Math.round(document.querySelector('[data-juego=${juego}]')?.getBoundingClientRect().height ?? -1)`)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    console.log('captura', id, 'alto de la tarjeta:', alto)
    await a.evaluar(`document.querySelector('[data-juego=${juego}] [data-juego-boton=ahora-no]')?.click(); true`)
    await a.esp(600)
  }
} finally {
  a.cerrar()
}
