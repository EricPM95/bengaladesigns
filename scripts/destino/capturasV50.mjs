// V50: SOLO capturas (no es una prueba) en modo iPhone: el aviso «Hoy ya no puedes entrar» (A1) y su hoja (A2 y A3), «Llegada y vuelta» sin vuelos, el campo de dirección del alojamiento con sugerencias y la rueda de la hora sin X. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV50.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V50_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]

async function abrir(extra = {}) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844, ...extra })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  return { a, ev }
}
const montarHoy = async ({ a, ev }, min, mut = '') => {
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
    st.getState().setDevSimulatedTodayIso('2026-10-17'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3000)
}
const texto = (a, sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 420)`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)

// 1 · «Hoy ya no puedes entrar»: la segunda parada son los Museos (última entrada 18:00) y son las 18:20
const MUSEOS = "const d0 = r.days.find((d) => !d.isReturnLeg); const i = d0.stops.findIndex((s) => /Museos Vaticanos/.test(s.name)); const [m] = d0.stops.splice(i, 1); d0.stops.splice(1, 0, m); m.hoursData = { schedule: 'Lun-Dom 8:00-20:00', last_entry: '18:00' }; delete m.hours; delete m.scheduleText; const p0 = d0.stops[0]; p0.hoursData = { schedule: 'Lun-Dom 0:00-23:59' }; delete p0.hours; delete p0.scheduleText"
{
  const c = await abrir()
  const { a } = c
  try {
    await montarHoy(c, 18 * 60 + 20, MUSEOS)
    await clicTexto(a, '/Dejarlo como está/')
    await a.esp(1500)
    console.log('A1 aviso', await a.evaluar(`JSON.stringify({ titulo: document.querySelector('[data-hoy-horario-vivo-texto]')?.textContent ?? null, enlace: document.querySelector('[data-horario-ver-solucion]')?.textContent ?? null })`))
    await a.captura(png('v50_a1_aviso'))
    // A2 por Cambiar plan › Pasar a otro día (la MISMA hoja): el primer día de la lista que no esté cerrado
    await montarHoy(c, 10 * 60, '')
    await a.evaluar("document.querySelector('[data-hoy-cambiar-plan]')?.click(); true")
    await a.esp(800)
    await a.evaluar("document.querySelector('[data-cambiar-opcion=\"otro_dia\"]')?.click(); true")
    await a.esp(900)
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[data-dia-de-la-lista]')).find((x) => !x.hasAttribute('data-dia-cerrado') && !x.hasAttribute('data-excursion')); b?.click(); return Boolean(b) })()")
    await a.esp(1800)
    console.log('A2 hoja', await texto(a, '[data-cambiar-hoja]'), '| tarjeta:', await a.evaluar("Boolean(document.querySelector('[data-tarjeta-del-sitio]')) + ' ' + Boolean(document.querySelector('[data-franja-sigue-igual]'))"))
    await a.captura(png('v50_a2_hoja'))
  } finally {
    a.cerrar()
  }
}

// 2 · RESERVAS › Llegada y vuelta sin vuelos (plegado y abierto) y la hoja de la hora sin X
{
  const c = await abrir()
  const { a, ev } = c
  try {
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(2000)
    await a.captura(png('v50_llegada_vacia_plegada'))
    await a.evaluar(`document.querySelector('[data-llegada-vacia]')?.click(); true`)
    await a.esp(1200)
    console.log('llegada vacía abierta', await a.evaluar(`JSON.stringify({ anadir: Boolean(document.querySelector('[data-anadir-mi-vuelo]')), buscar: Boolean(document.querySelector('[data-buscar-vuelos]')) })`))
    await a.captura(png('v50_llegada_vacia_abierta'))
    await a.evaluar(`document.querySelector('[data-anadir-mi-vuelo]')?.click(); true`)
    await a.esp(1500)
    console.log('hoja del vuelo', await texto(a, '[role="dialog"]'))
    await a.captura(png('v50_hoja_tu_vuelo'))
  } finally {
    a.cerrar()
  }
}

// 3 · El alojamiento: «O escribe la dirección» busca y enseña sugerencias (consulta real y suelta a Photon)
{
  const c = await abrir()
  const { a, ev } = c
  try {
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(2000)
    await a.evaluar(`(() => { const b = document.querySelector('[data-blk="aloj"]'); b?.querySelector('[data-cabecera-clara], button')?.click(); return true })()`)
    await a.esp(1200)
    const abre = await a.evaluar(`(() => { const b = document.querySelector('[data-anadir-alojamiento]'); if (!b) return false; b.click(); return true })()`)
    console.log('abre hoja del alojamiento', abre)
    await a.esp(1800)
    await a.evaluar(`(() => { const i = Array.from(document.querySelectorAll('[role="dialog"] input')).find((x) => /dirección|direccion/i.test((x.placeholder || '') + (x.getAttribute('aria-label') || ''))) ?? Array.from(document.querySelectorAll('[role="dialog"] input[type="text"], [role="dialog"] input:not([type])')).pop(); if (!i) return false; i.scrollIntoView({ block: 'center' }); i.focus(); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, 'Via Nazionale'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    await a.esp(4500)
    console.log('sugerencias', await a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[data-sugerencia], [data-sugerencias] button')).map((e) => (e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60)))`))
    await a.captura(png('v50_buscador_campo'))
  } finally {
    a.cerrar()
  }
}
console.log('capturas hechas')
