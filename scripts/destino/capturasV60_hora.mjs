// V60 (apartado 2): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV60_hora.mjs roma|lanza|design [F1|F2|F3]
// Guarda docs/dias/V60_capturas/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo de Design) y escribe docs/dias/V60_log_<modo>.json.
// La API de Civitatis está apagada en el servidor: las capturas simulan en el navegador (solo aquí) `/api/civitatis/horas-rango` y ponen el id de Civitatis al Free Tour, con horas de ejemplo.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V60_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null

if (MODO === 'design') {
  for (const id of SOLO === 'F0' ? ['F0'] : ['F1', 'F2', 'F3']) {
    if (SOLO && SOLO !== id) continue
    // El tablero de cada caso: se dejan solo su móvil y se le baja el panel para ver la caja verde.
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
    await capturarDesign('Entrada Free Tour.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const lanza = MODO === 'lanza'
const SITIO = lanza ? 'Jameos del Agua' : 'Free Tour por Roma'
const dias = lanza ? ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11'] : ['2026-10-17', '2026-10-18', '2026-10-19']
// Horas de ejemplo. 1.er día: 10:00, 15:00 y 17:00 (con el vuelo a las 10:30 → 15:00; a las 13:30 → 17:00; a las 17:20 → ninguna). El 2.º día: 10:00 y 15:00.
const CASOS = {
  F1: { vuelo: '13:30', sinPlazas: false },
  F2: { vuelo: '17:20', sinPlazas: false },
  F3: { vuelo: '10:30', sinPlazas: true },
  F0: { vuelo: '10:30', sinPlazas: false },
}
const mock = (sinPlazas) => ({
  actividadId: 777,
  conHorasFijas: true,
  dias: Object.fromEntries(dias.map((d, i) => [d, i === 0 ? { sinPlazas, horas: sinPlazas ? [] : [{ hora: '10:00', plazas: null, aviso: null }, { hora: '15:00', plazas: null, aviso: null }, { hora: '17:00', plazas: null, aviso: null }] } : { sinPlazas: false, horas: [{ hora: '10:00', plazas: null, aviso: null }, { hora: '15:00', plazas: null, aviso: null }] }])),
})
const SITIO_CLAVE = lanza ? 'Jameos del Agua' : 'Free Tour'
const ANTES = `(() => {
  const real = window.fetch.bind(window)
  window.fetch = async (url, init) => {
    const u = String(url)
    if (u.includes('/api/civitatis/horas-rango')) return new Response(JSON.stringify({ ok: true, datos: window.__horasMock }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    const r = await real(url, init)
    if (u.includes('/api/destination-excursions')) {
      try {
        const j = await r.clone().json()
        const l = j.entradas_por_sitio && j.entradas_por_sitio['${SITIO_CLAVE}']
        if (l && l[0]) l[0].civitatis = { id: 777, nombre: l[0].nombre, gratis: true, desde: null, original: null, moneda: 'EUR', valoracion: 9.1, opiniones: 5230, fotos: { principal: null, galeria: [] }, incluye: ['Guía de habla española.'], idiomas: ['Español'], duracion: '2 h 30 min', cancelacion: 'No se puede cancelar sin coste.', reservarHasta: null, puntoDeEncuentro: { texto: 'Plaza de España, esquina Vicolo del Bottino.', lat: null, lng: null }, url: l[0].url }
        return new Response(JSON.stringify(j), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } catch (e) { return r }
    }
    return r
  }
})()`

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: `/?cuentas=off&logros=off&apertura=0&civitatis=on&version=pago`, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // El Free Tour: si el viaje no lo trae, se le pone una parada de Free Tour en el día 1 (solo la captura).
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, stops: d.stops.filter((s) => !s.isArrival).map((s) => (s.time || '?') + ' ' + s.name.slice(0, 22) + (s.isFreeTour ? ' [FT]' : '')) })))`))
  console.log('llegada', await ev(`JSON.stringify({ t: ${R}.getState().route.arrivalFlightTime, p: ${R}.getState().route.arrivalPointId, z: ${R}.getState().route.accommodationZone })`))
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)

  for (const id of SOLO === 'F0' ? ['F0'] : ['F1', 'F2', 'F3']) {
    if (SOLO && SOLO !== id) continue
    const c = CASOS[id]
    await a.evaluar(`(async () => {
      const st = ${R}
      window.__horasMock = ${JSON.stringify(mock(c.sinPlazas))}
      const r = JSON.parse(window.__base)
      r.arrivalFlightTime = '${c.vuelo}'
      if (!r.arrivalPointId) r.arrivalPointId = '${lanza ? 'ace' : 'fco'}'
      const d1 = r.days[0]
      if (!d1.stops.some((s) => s.isFreeTour || s.name === '${SITIO}')) { const m = d1.stops.find((s) => !s.isArrival); d1.stops.splice(d1.stops.indexOf(m) + 1, 0, { ...m, id: 'ft-v60', name: '${SITIO}', isFreeTour: ${!lanza}, time: '16:00', reservedId: null, checkedInAt: null }) }
      // El Free Tour va el 2.º día... y se mira la hora de la ruta de la parada: la que trae.
      st.setState({ route: r, reservations: [], screen: 'route' })
      st.getState().setMode('days')
      return true })()`)
    await a.esp(1500)
    // Abre la ficha del Free Tour: la parada del viaje, o la de la lista de sitios con entradas.
    console.log(id, 'dia', await ev(`(async () => { const st = ${R}; st.getState().setActiveDayId(st.getState().route.days[0].id); return 'ok' })()`))
    await a.esp(1200)
    console.log(id, 'abrir', await a.evaluar(`(() => { const el = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && new RegExp('^' + ${JSON.stringify(SITIO)}).test((x.textContent || '').trim())); if (!el) return 'sin Free Tour en pantalla'; el.click(); return 'click ' + el.textContent.slice(0, 30) })()`))
    await a.esp(2500)
    await a.evaluar(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Entradas/.test((x.textContent || '').trim())); if (b) b.click(); return true })()`)
    await a.esp(1500)
    await a.evaluar(`(() => { const t = document.querySelector('[data-entrada-tarjeta]'); if (t) t.click(); return true })()`)
    await a.esp(2500)
    await a.evaluar(`(() => { const e = document.querySelector('[data-hora-recomendada]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()`)
    await a.esp(800)
    log[id + '_caja'] = await a.evaluar(`(() => { const e = document.querySelector('[data-hora-recomendada]'); return e ? e.innerText.replace(/\s+/g, ' ') : 'SIN CAJA' })()`)
    console.log(id, 'caja:', log[id + '_caja'])
    await a.captura(path.join(CAP, id + '_app.jpg'))
    log[id] = await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 600)")
    console.log(id, String(log[id]).slice(0, 300))
    await a.captura(path.join(CAP, `${id}_app_previa.jpg`))
  }
} finally {
  fs.writeFileSync(`docs/dias/V60_log_${MODO}.json`, JSON.stringify(log, null, 2))
  a.cerrar()
}
