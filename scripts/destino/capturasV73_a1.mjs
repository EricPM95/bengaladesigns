// V73 (apartados 1, 2 y 3): SOLO capturas (no es una prueba) en modo iPhone (390x844) de HOY con el día acabado. Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV73_a1.mjs roma|lanza|design [caso]
// Guarda docs/dias/V73_capturas/<id>_app.jpg (+ _app_abajo.jpg: la misma pantalla bajada) y <id>_design.jpg (AC1, AC2, AC3) y escribe docs/dias/V73_log_a1_<modo>.json con el texto de cada pantalla.
// Casos: AC1 (sin atardecer, sin alojamiento, con reto), AC2 (con atardecer, con alojamiento, sin reto), AC3 (día normal; en Roma). Lanzarote: la API normal.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V73_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null

if (MODO === 'design') {
  for (const id of ['AC1', 'AC2', 'AC3']) {
    if (SOLO && SOLO !== id) continue
    const js = `(() => {
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
    await capturarDesign('Hoy Al Acabar.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 1500 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'
const lanza = MODO === 'lanza'
const IDA = lanza ? '2026-11-08' : '2026-10-17'
const DIA = Number(process.env.DIA ?? 2)
const hoy = (() => { const d = new Date(IDA + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + DIA - 1); return d.toISOString().slice(0, 10) })()

// El reto del día de ejemplo (lo que mandaría el servidor): una colección con el sitio ya visto (sin foto: no hay pedazo) y los de fuera de la ruta cerca de la zona.
const RETOS = lanza
  ? [
      { coleccion: 'entre_vinas_de_ceniza', nombre: 'Entre viñas de ceniza', faltan: 3, total: 3, completable_hoy: false, faltan_fuera: ['Bodega La Geria'], sitios: [
        { sitio: 'la_geria_y_sus_bodegas', nombre: 'La Geria y sus bodegas', ganado: false, hoy: true, estado: 'hoy', fecha: null, dia_fecha: null, cerca_de_hoy: false },
        { sitio: 'bodega_la_geria', nombre: 'Bodega La Geria', ganado: false, hoy: false, estado: 'fuera', fecha: null, dia_fecha: null, cerca_de_hoy: true },
        { sitio: 'bodega_el_grifo', nombre: 'Bodega El Grifo', ganado: false, hoy: false, estado: 'fuera', fecha: null, dia_fecha: null, cerca_de_hoy: false } ] },
      { coleccion: 'lz_imprescindibles', nombre: 'Los imprescindibles de Lanzarote', faltan: 2, total: 4, completable_hoy: true, faltan_fuera: [], sitios: [
        { sitio: 'montanas_del_fuego', nombre: 'Montañas del Fuego', ganado: false, hoy: true, estado: 'hoy', fecha: null, dia_fecha: null, cerca_de_hoy: false } ] },
      { coleccion: 'cesar_manrique', nombre: 'César Manrique', faltan: 1, total: 3, completable_hoy: true, faltan_fuera: [], sitios: [
        { sitio: 'jameos_del_agua', nombre: 'Jameos del Agua', ganado: false, hoy: true, estado: 'hoy', fecha: null, dia_fecha: null, cerca_de_hoy: false } ] },
    ]
  : []

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
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
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, tipo: d.dayType ?? null, stops: d.stops.filter((s) => !s.isArrival).map((s) => (s.time || '?') + ' ' + s.name.slice(0, 22)) })))`))

  /** Día DIA con todas las paradas hechas, a las `min` minutos; `atardecer` marca la última como el atardecer; `aloj` pone el hotel; `retos` mete el reto de ejemplo. */
  const montar = async ({ min = 12 * 60 + 30, atardecer = false, aloj = false, retos = false }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI.getState().cerrarResumenDia(); sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${hoy}')
      const r = JSON.parse(window.__base)
      const d = r.days.find((x) => x.dayNumber === ${DIA}); let ult = null
      for (const s of d.stops) { if (s.isArrival) continue; s.checkedInAt = '${hoy}T09:30:00.000Z'; ult = s }
      if (${atardecer} && ult) ult.isSunset = true
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: ${aloj} && seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:logros:resumendia')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(2500)
    for (let i = 0; i < 12; i++) {
      const hay = await a.evaluar(`(async () => {
        const lg = (await import('/src/store/useLogrosStore.ts')).useLogrosStore; lg.setState({ momentos: [], exp: null })
        const ui = (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI; ui.setState({ ronda: null, rondaExp: null, fila: { mostrando: null, esperan: [] }, resumenDia: false })
        const d = [...document.querySelectorAll('[data-visto=capa]')][0]
        const c = d && d.querySelector('[aria-label=Cerrar]'); if (c) c.click()
        return Boolean(d) })()`)
      await a.esp(700)
      if (!hay && i > 3) break
    }
    // Los permisos de logros y la hoja del emblema oculto (se abren al marcar paradas desde fuera) se cierran para ver solo HOY.
    for (let i = 0; i < 6; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar)$/.test((x.textContent || '').trim()) || /^(Cerrar|Ahora no|Cerrar hoja)$/.test(x.getAttribute('aria-label') || '')); if (!b) return false; b.click(); return true })()")
      console.log('cerrar overlay', h)
      if (!h) break
      await a.esp(800)
    }
    console.log('botones', await a.evaluar("JSON.stringify([...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || (b.innerText || '').slice(0, 20)).filter(Boolean).slice(0, 40))"))
    // El reto de ejemplo se pone al final y se vuelve a poner si el sondeo del servidor lo pisa.
    const poner = `(async () => { (await import('/src/lib/hoyCompanero.ts')).useCompaneroStore.setState({ cerca: ${retos ? `{ ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null, retos: ${JSON.stringify(RETOS)} }` : 'null'} }); return true })()`
    await a.evaluar(poner)
    await a.esp(1200)
    await a.evaluar(poner)
    await a.esp(800)
  }
  // El primer montaje tras cargar a veces no llega a HOY (la app aún arranca): se repite hasta que sale «Al acabar el día» (3 veces como mucho).
  const montarSeguro = async (o) => {
    for (let i = 0; i < 3; i++) {
      await montar(o)
      if (await a.evaluar("/AL ACABAR EL DÍA/i.test(document.body.innerText)")) return
      console.log('reintento del montaje')
    }
  }
  const sacar = async (id) => {
    await a.esp(1200)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar("(document.querySelector('main') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 2200)")
    console.log('captura', id, '|', String(log[id]).slice(0, 600))
    await a.evaluar("(() => { const c = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); c.forEach((e) => { e.scrollTop = e.scrollHeight }); window.scrollTo(0, document.body.scrollHeight); return c.length })()")
    await a.esp(900)
    await a.captura(path.join(CAP, `${id}_app_abajo.jpg`))
  }
  const quien = (c) => !SOLO || SOLO === c
  const pre = lanza ? 'L' : 'R'
  if (lanza) {
    if (quien('AC1')) { await montarSeguro({ atardecer: false, aloj: false, retos: true }); await sacar(`${pre}AC1`) }
    if (quien('AC2')) { await montarSeguro({ atardecer: true, aloj: true, retos: false }); await sacar(`${pre}AC2`) }
  } else {
    if (quien('AC2')) { await montarSeguro({ atardecer: true, aloj: true, retos: false, min: 20 * 60 }); await sacar(`${pre}AC2`) }
    if (quien('AC3')) { await montarSeguro({ atardecer: false, aloj: true, retos: false, min: 20 * 60 }); await sacar(`${pre}AC3`) }
  }
  fs.writeFileSync(`docs/dias/V73_log_a1_${MODO}.json`, JSON.stringify(log, null, 1))
} finally {
  a.cerrar()
}
