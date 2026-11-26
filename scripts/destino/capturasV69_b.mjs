// V69 (agente de los apartados 2, 3, 4 y 6): SOLO capturas (no es una prueba) en modo iPhone (390x844) de las hojas «Tu entrada del Coliseo, el martes 13» (E1/E2), «Revisa las horas» (A1a/A1b), «Elige día y hora» con las horas en botones (H1/H2/H3) y [Ver entrada].
// Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV69_b.mjs design|roma|lanza [caso]
// Guarda docs/dias/V69_capturas/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo de Design) y escribe docs/dias/V69_log_b_<modo>.json con el texto de cada pantalla.
// Casos de Roma: E1 E2 A1a A1b A1c H1 H2 H3 V1 V2 (y V3 con varias personas). Lanzarote (la API con DESTINOS_OCULTOS='-'): L_E2 L_H1 L_V2.
// La API de Civitatis está apagada en el servidor: aquí se simula en el navegador `/api/civitatis/horas-rango` (como la V60) y se enciende el interruptor con `?civitatis=on`.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V69_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null
const quiere = (id) => !SOLO || SOLO === id

if (MODO === 'design') {
  const aislar = (id) => `(() => {
    const tabl = [...document.querySelectorAll('div')].filter((d) => d.style && d.style.width === '390px' && d.firstElementChild && /^${id} · /.test((d.firstElementChild.textContent || '').trim()))[0]
    if (!tabl) return 'sin tablero'
    const grid = tabl.parentElement
    ;[...grid.children].forEach((c) => { if (c !== tabl) c.style.display = 'none' })
    grid.style.gridTemplateColumns = '390px'
    let p = grid.parentElement; p.style.padding = '0'; p.style.minHeight = '0'
    ;[...p.children].forEach((c) => { if (c !== grid) c.style.display = 'none' })
    tabl.style.padding = '8px'
    document.documentElement.style.background = '#E7DCC6'
    window.scrollTo(0, 0)
    return 'ok'
  })()`
  const hechos = [
    ['Entrada Mueve Dias.dc.html', 'E1'],
    ['Entrada Mueve Dias.dc.html', 'E2'],
    ['Entrada Mueve Dias.dc.html', 'A1a'],
    ['Entrada Mueve Dias.dc.html', 'A1b'],
    ['Free Tour Hora.dc.html', 'H1'],
    ['Free Tour Hora.dc.html', 'H1b'],
    ['Free Tour Hora.dc.html', 'H2'],
    ['Free Tour Hora.dc.html', 'H3'],
  ]
  for (const [pieza, id] of hechos) {
    if (SOLO && SOLO !== id) continue
    await capturarDesign(pieza, path.join(CAP, `${id}_design.jpg`), { despues: aislar(id), ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const lanza = MODO === 'lanza'
const FT = 'Free Tour por Roma'

// Horas de ejemplo de Civitatis (solo estas capturas): por día del viaje. `nada` = día sin ninguna hora libre; `pocas` = con «Quedan 3».
const mockHoras = (dias, { agotadoElPrimero = false } = {}) => ({
  actividadId: 777,
  conHorasFijas: true,
  dias: Object.fromEntries(
    dias.map((d, i) => [
      d,
      agotadoElPrimero && i === 0
        ? { sinPlazas: true, horas: [] }
        : { sinPlazas: false, horas: [{ hora: '10:00', plazas: 24, aviso: null }, { hora: '12:00', plazas: 3, aviso: 'Últimas 3 plazas' }, { hora: '15:00', plazas: null, aviso: null }, { hora: '19:00', plazas: null, aviso: null }] },
    ]),
  ),
})
const ANTES = `(() => {
  const real = window.fetch.bind(window)
  window.fetch = async (url, init) => {
    const u = String(url)
    if (u.includes('/api/civitatis/horas-rango')) return new Response(JSON.stringify({ ok: true, datos: window.__horasMock ?? null }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    const r = await real(url, init)
    if (u.includes('/api/reservation-plan')) { try { window.__plan = await r.clone().json() } catch {} }
    return r
  }
})()`

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: `/?cuentas=off&logros=off&apertura=0&hoy2=on&civitatis=on&version=pago`, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const clicTexto = (rx, ambito = 'button') => a.evaluar(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(ambito)})].find((x) => new RegExp(${JSON.stringify(rx)}, 'i').test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const sacar = async (id, sel = null) => {
  await a.esp(900)
  await a.captura(path.join(CAP, `${id}_app.jpg`))
  log[id] = await a.evaluar(`(document.querySelector(${JSON.stringify(sel ?? '[role=dialog]')}) ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 1400)`)
  console.log('captura', id, '|', String(log[id]).slice(0, 400))
}
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
  // GENERADO=1: el viaje de Roma del 13 al 15 de julio de 2027 creado DE CERO por el motor (como la V68), no el de __rutaPrueba.
  if (process.env.GENERADO) {
  await a.evaluar(`(async () => {
    const st = ${R}
    const base = st.getState().route
    const { runGeneration } = await import('/src/lib/routeGenerationOrchestrator.ts')
    const { mapGeneratedRouteToRoute } = await import('/src/lib/mapGeneratedRoute.ts')
    const respuestas = { ...base.answers, origin: 'Madrid', days: 3, dateRange: { start: '2027-07-13', end: '2027-07-15' }, month: 6, companion: 'couple', experiences: [], experiencesPositive: ['imprescindibles'], experiencesNegative: [], chronotype: 'normal', budgetLevel: 'comfortable' }
    let final = null
    await runGeneration({ destination: 'Roma', answers: respuestas, transportContext: base.transportContext, mustIncludePlaces: [] }, null, async (cp) => { if (cp.phase === 'done') final = cp })
    const ruta = mapGeneratedRouteToRoute(final.generated, 'Roma', respuestas, base.transportContext)
    ruta.id = base.id; ruta.createdAt = base.createdAt
    for (const d of ruta.days) if (!d.countryCode) d.countryCode = 'it'
    st.setState({ route: ruta, reservations: [], dev_simulated_today_iso: '2027-07-01' })
    window.__base = JSON.stringify(ruta)
    await (await import('/src/lib/destinationExcursions.ts')).fetchDestinationExcursions('Roma')
    return true })()`)
    await a.esp(1500)
  }
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)
  console.log('viaje', await ev(`JSON.stringify({ r: ${R}.getState().route.answers.dateRange, d: ${R}.getState().route.days.map((d) => ({ n: d.dayNumber, id: d.id, ret: !!d.isReturnLeg, t: d.dayType, cur: d.curatedId, stops: d.stops.filter((s) => !s.isArrival).map((s) => (s.time || '?') + ' ' + s.name.slice(0, 22) + (s.isFreeTour ? ' [FT]' : '')) })) })`))

  /** Pone el viaje base con lo que se pida (vuelo, reservas…) y abre RESERVAS. */
  const montar = async ({ ruta = {}, reservas = [], horas = null }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      const r = JSON.parse(window.__base)
      Object.assign(r, ${JSON.stringify(ruta)})
      window.__horasMock = ${JSON.stringify(horas)}
      st.setState({ route: r, reservations: ${JSON.stringify(reservas)}, screen: 'route' })
      st.getState().setActiveDayId(null); st.getState().setMode('bookings')
      return true })()`)
    await a.esp(2500)
    await ev("(await import('/src/store/useReservasFocusStore.ts')).useReservasFocusStore.getState().pedir('entradas')")
    await a.esp(1800)
  }
  /** Abre la hoja «Elige día y hora» de una entrada por reservar (por su nombre) con «Añádela». */
  const abrirAnadir = async (nombre) => {
    const ok = await a.evaluar(`(() => {
      const t = [...document.querySelectorAll('[data-tarjeta-por-reservar]')].find((x) => new RegExp(${JSON.stringify(nombre)}, 'i').test(x.textContent || ''))
      if (!t) return 'sin tarjeta: ' + [...document.querySelectorAll('[data-tarjeta-por-reservar]')].map((x) => (x.querySelector('[data-entrada-nombre]')?.textContent || '').slice(0, 24)).join(' | ')
      t.scrollIntoView({ block: 'center' })
      const b = [...t.querySelectorAll('button')].find((x) => /^A[ñn]ádela$/.test((x.textContent || '').trim()))
      if (!b) return 'sin Añádela'
      b.click(); return 'ok' })()`)
    console.log('añadir', nombre, ok)
    await a.esp(1500)
    return ok === 'ok'
  }
  const elegirDia = async (iso) => {
    const r = await a.evaluar(`(() => { const day = ${JSON.stringify(iso)}; const chips = [...document.querySelectorAll('[data-dia-cuadrado]')]; const i = chips.findIndex((x) => x.getAttribute('data-dia-cuadrado') === day); if (i < 0) return 'no hay ' + day + ' en ' + chips.map((x) => x.getAttribute('data-dia-cuadrado')).join(','); chips[i].click(); return 'ok' })()`)
    await a.esp(700)
    return r
  }
  const elegirDiaPorFecha = async (iso) => {
    const id = await ev(`(async () => { const r = ${R}.getState().route; const B = null; const i0 = r.answers.dateRange.start; const n = Math.round((new Date(${JSON.stringify(iso)} + 'T12:00:00Z') - new Date(i0 + 'T12:00:00Z')) / 86400000) + 1; return r.days.find((d) => d.dayNumber === n)?.id ?? null })()`)
    return elegirDia(id)
  }
  const ponerHora = async (hhmm) => {
    await clic('[data-campo-de-hora="anadir"]')
    await a.esp(900)
    // La rueda: se elige con el teclado/clic sobre el elemento de esa hora y se pulsa ✓.
    const ok = await a.evaluar(`(() => { const it = [...document.querySelectorAll('[data-hoja-de-hora-rueda] [role="option"], [data-hoja-de-hora-rueda] li, [data-hoja-de-hora-rueda] button')].find((x) => (x.textContent || '').trim() === ${JSON.stringify(hhmm)}); if (it) { it.click(); return 'clic' } return 'sin ' + ${JSON.stringify(hhmm)} })()`)
    await a.esp(500)
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(700)
    return ok
  }
  const cerrarHojas = async () => {
    for (let i = 0; i < 3; i++) {
      await a.evaluar("(() => { const b = document.querySelector('[role=dialog] button[aria-label=Cerrar]'); if (b) b.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return true })()")
      await a.esp(500)
    }
  }
  globalThis.__v69 = { montar, abrirAnadir, elegirDia, elegirDiaPorFecha, ponerHora, cerrarHojas, sacar, clic, clicTexto }

  const { casos } = await import('./capturasV69_casos.mjs')
  await casos({ a, ev, R, lanza, quiere, montar, abrirAnadir, elegirDia, elegirDiaPorFecha, ponerHora, cerrarHojas, sacar, clic, clicTexto, mockHoras, FT, CAP, log, path, fs })
} finally {
  fs.writeFileSync(`docs/dias/V69_log_b_${MODO}.json`, JSON.stringify(log, null, 2))
  a.cerrar()
}
