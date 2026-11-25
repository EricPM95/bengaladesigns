// V66 (apartados 1 y 2): SOLO capturas (no es una prueba) en modo iPhone (390x844) de la hoja del Emblema Oculto (E1) y de la tarjeta del atardecer (S1, S2, S3). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV66_a.mjs design|roma|lanza [caso]
// Guarda docs/dias/V66_capturas/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo). Casos de Roma: E1 aviso S1 S2 S3. De Lanzarote (la API con DESTINOS_OCULTOS='-'): E1_lanza S2_lanza.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V66_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null
const quiere = (id) => !SOLO || SOLO === id

if (MODO === 'design') {
  const por = { E1: 'Emblema Oculto Hoja.dc.html', S1: 'Atardecer Bloque.dc.html', S2: 'Atardecer Bloque.dc.html', S3: 'Atardecer Bloque.dc.html' }
  for (const [id, pieza] of Object.entries(por)) {
    if (!quiere(id)) continue
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
    await capturarDesign(pieza, path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'
const lanza = MODO === 'lanza'
const ISO = lanza ? '2026-11-09' : '2026-10-17'
const log = {}

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const montar = async (min, mut = '', pos = null) => {
    await a.evaluar(`(async () => {
      const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
      r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset }) })
      ${mut}
      st.setState({ route: r, screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy2:') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy1:juego:') || k.startsWith('trazo:hoy2b:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      window.__horaFalsa = ${min}; window.__pos = ${pos ? JSON.stringify(pos) : 'null'}; window.__perm = ${pos ? "'granted'" : "'denied'"}
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
  }
  const sacar = async (id, sel) => {
    await a.esp(1500)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector('${sel}') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 900)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 500))
  }
  const alCentro = (sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return Boolean(e) })()`)
  const sitio = lanza
    ? { sitio: 'mirador_del_rio', nombre: 'Mirador del Río', en_sitio: 'en el Mirador del Río', a_sitio: 'al Mirador del Río' }
    : { sitio: 'foro_romano', nombre: 'Foro Romano y Palatino', en_sitio: 'en el Foro Romano y Palatino', a_sitio: 'al Foro Romano y Palatino' }
  const llegada = { ok: true, cerca: [{ ...sitio, metros: 20, radio_m: 100, al_borde_m: 0, dentro: true, en_ruta_hoy: true, hay_emblema: true, emblema_nombre: 'Oculto', hay_pedazo: false, coleccion_nombre: null }], juego: 'llegada', juego_sitio: sitio.sitio, fuera_de_ruta: null, junto_a: null, reto: null }
  const sacarHoja = async () => {
    await a.evaluar(`window.__hoy1Cerca = ${JSON.stringify(llegada)}; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true`)
    for (let i = 0; i < 20 && !(await a.evaluar("Boolean(document.querySelector('[data-juego=llegada]'))")); i++) await a.esp(500)
  }
  const POS = lanza ? { lat: 29.0, lng: -13.5 } : { lat: 41.8902, lng: 12.4922 }
  const MANANA = 10 * 60

  if (quiere('E1') || quiere('E1_lanza')) {
    await montar(MANANA, '', POS)
    await sacarHoja()
    await sacar(lanza ? 'E1_lanza' : 'E1', '[data-juego=llegada]')
  }
  if (!lanza && quiere('aviso')) {
    // Hoja de arriba + un aviso de abajo con [Deshacer]: la hoja debe empezar ENCIMA del aviso y sus botones quedar a la vista.
    await montar(MANANA, '', POS)
    await a.evaluar(`(async () => { const m = await import('/src/store/useAvisoDeAbajo.ts'); m.avisarAbajo({ id: 'v66-aviso', texto: 'Piazza Navona, añadida a tu día', accion: { etiqueta: 'Deshacer', alTocar: () => {} }, ms: 60000 }); return true })()`)
    await a.esp(1200)
    await sacarHoja()
    await a.esp(1200)
    log.aviso_geometria = await a.evaluar(`(() => { const h = document.querySelector('[data-juego=llegada]'); const av = document.querySelector('[data-aviso-sobre-la-barra], [data-aviso-abajo-host], [role=status]'); const f = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) } }; const btn = [...document.querySelectorAll('[data-juego=llegada] button, [data-juego=llegada] label')].map((b) => ({ t: (b.textContent || '').trim().slice(0, 24), ...f(b) })); return JSON.stringify({ htmlAttr: document.documentElement.getAttribute('data-aviso-abajo'), alto: document.documentElement.style.getPropertyValue('--aviso-alto'), hoja: f(h), aviso: f(av), btn }) })()`)
    console.log('aviso geometria', log.aviso_geometria)
    await sacar('aviso', '[data-juego=llegada]')
  }
  // Atardecer. Roma 17-oct: el sol se pone hacia las 18:2x; se mira desde las 16:40.
  const NO_HECHAS = 'r.days.forEach((d) => d.stops.forEach((s) => { s.checkedInAt = new Date().toISOString() }));'
  if (!lanza && quiere('S2')) {
    await montar(16 * 60 + 40, NO_HECHAS, null)
    await alCentro('[data-hoy-atardecer]')
    await sacar('S2', '[data-hoy-atardecer]')
  }
  if (!lanza && quiere('S1')) {
    const SUNSET = `${NO_HECHAS}
      const dia = r.days.find((d) => d.stops.length) ; const ult = dia.stops[dia.stops.length - 1]
      delete ult.checkedInAt; ult.name = "Castillo de Sant'Angelo"; ult.isSunset = true; ult.coordinates = { lat: 41.9031, lng: 12.4663 }`
    await montar(16 * 60 + 40, SUNSET, null)
    await alCentro('[data-hoy-atardecer]')
    await sacar('S1', '[data-hoy-atardecer]')
  }
  if (!lanza && quiere('S3')) {
    // Sin ningún sitio de atardecer a mano: el viajero está lejos de todos (Fiumicino, ~15 km), sin coche.
    await montar(16 * 60 + 40, NO_HECHAS, { lat: 41.8003, lng: 12.2389 })
    await alCentro('[data-hoy-atardecer]')
    await sacar('S3', '[data-hoy-atardecer]')
  }
  if (lanza && quiere('S2_lanza')) {
    await montar(17 * 60 + 5, 'r.days.forEach((d) => d.stops.forEach((s) => { s.checkedInAt = new Date().toISOString() }));', null)
    await alCentro('[data-hoy-atardecer]')
    await sacar('S2_lanza', '[data-hoy-atardecer]')
  }
  fs.writeFileSync(`docs/dias/V66_log_${MODO}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
