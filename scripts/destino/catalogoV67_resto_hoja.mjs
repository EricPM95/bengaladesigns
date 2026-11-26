// V61 (hoja de Reorganizar, RO1 a RO3): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV61_hoja.mjs ro1|ro2|ro3|design [Roma|Lanzarote] [vuelo=17:00]
// Guarda docs/dias/catalogo/_tmp/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo de Design) y el texto de la hoja en la consola.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'ro1'
const DESTINO = process.argv[3] ?? 'Roma'
const VUELO = (process.argv.find((x) => x.startsWith('vuelo=')) ?? 'vuelo=17:00').slice(6)

if (MODO === 'design') {
  for (const id of ['RO1', 'RO2', 'RO3']) {
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
    await capturarDesign('Reorganizar Hoja.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const lanza = DESTINO === 'Lanzarote'
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-27' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // El viaje sale el viernes 27 de noviembre, con el vuelo de ida a la hora pedida (Roma: Ciampino).
  await a.evaluar(`(async () => {
    const st = ${R}
    const r = JSON.parse(JSON.stringify(st.getState().route))
    r.answers = { ...r.answers, dateRange: { start: '2026-11-27', end: '2026-11-30' } }
    r.arrivalFlightTime = '${VUELO}'
    ${lanza ? '' : "r.arrivalPointId = 'cia'"}
    st.setState({ route: r, reservations: [], screen: 'route' })
    st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true
  })()`)
  await a.esp(1500)
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, id: d.id, ret: !!d.isReturnLeg, stops: d.stops.filter((s) => !s.isArrival).map((s) => (s.time || '?') + ' ' + s.name.slice(0, 18)) })))`))
  const guardar = async (id) => {
    await a.esp(2500)
    console.log(id, 'texto:', await a.evaluar("(document.querySelector('[data-hoja=\"reorganizar\"], [data-hoja=\"adaptar-vuelos\"]')?.innerText ?? 'SIN HOJA').replace(/\\s+/g, ' ')"))
    await a.captura(path.join(CAP, `${id}_app.jpg`))
  }
  if (MODO === 'ro3') {
    await a.evaluar("(async () => { await (await import('/src/lib/adaptarVuelos.ts')).alCambiarElVuelo({ que: 'hora', mitad: 'arrival' }); return true })()")
    for (let i = 0; i < 60 && !(await a.evaluar("!!document.querySelector('[data-hoja=\"adaptar-vuelos\"]')").catch(() => false)); i++) await a.esp(1000)
    await guardar(`RO3${lanza ? '_lanzarote' : ''}`)
  } else {
    const todos = MODO === 'ro2'
    await a.evaluar(`(async () => {
      const r = ${R}.getState().route
      const ids = ${todos ? 'r.days.map((d) => d.id)' : 'r.days.slice(0, 1).map((d) => d.id)'}
      const c = await (await import('/src/lib/reorganizarDia.ts')).diasQueCambian(ids)
      const s = (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore.getState()
      s.reiniciar()
      s.poner(c.map((x) => x.dayId), ids, c)
      s.abrirAlerta()
      return c.length
    })()`)
    for (let i = 0; i < 40 && !(await a.evaluar("!!document.querySelector('[data-hoja=\"reorganizar\"]')").catch(() => false)); i++) await a.esp(1000)
    await guardar(`${todos ? 'RO2' : 'RO1'}${lanza ? '_lanzarote' : ''}`)
  }
} finally {
  a.cerrar()
}
