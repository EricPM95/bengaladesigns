// V48: SOLO capturas (no es una prueba) en modo iPhone de: el billete con QR en DÍAS y en HOY (con y sin tarjeta), el aviso de «ya no puedes entrar», «Hoy ya no da tiempo a todo» y la ficha de EXPLORAR. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV48.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V48_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const VUELO = "(() => { const st = window.__ruta.getState(); const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:15', departureFlightTime: '19:05', arrivalPointId: 'fco', departurePointId: 'fco', arrivalOtroPunto: 'BCN', departureOtroPunto: 'BCN', arrivalOtraHora: '08:30', departureOtraHora: '21:10', arrivalCodigo: 'VY6102', departureCodigo: 'VY6105' } }); return true })()"
const TARJETA = `(async () => { const B = await import('/src/store/useBilleteStore.ts'); const S = await import('/src/store/useSyncStore.ts'); const tripId = S.useSyncStore.getState().activeTripId; const ahora = new Date().toISOString(); const dibujo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM10 10h2v2h-2zM14 14h5v2h-5zM10 16h3v3h-3z" fill="#111"/></svg>'; const g = (h) => ({ horaRoma: h, localizador: 'XK29PQ', terminal: null, asiento: '12A', coche: null, codigo: { texto: 'M1TEST', formato: 'qr', imagen: null, dibujo }, dueno: null, actualizado: ahora }); B.useBilleteStore.setState({ tripId, datos: { arrival: g('11:15'), departure: g('19:05') } }); return true })()`

async function abrir(ancho, extra = {}) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho, alto: 844, ...extra })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
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

// 1 · DÍAS (primer día): el billete, sin tarjeta y con tarjeta
{
  const c = await abrir(390)
  const { a, ev } = c
  try {
    await a.evaluar(VUELO)
    await ev(`${R}.getState().setMode('days')`)
    await a.esp(2500)
    const info = async () => a.evaluar(`(() => { const e = document.querySelector('[data-billete="llegada"]'); return JSON.stringify({ hay: Boolean(e), qr: e?.getAttribute('data-billete-qr'), cab: e?.innerText.replace(/\\s+/g, ' ').slice(0, 120) }) })()`)
    console.log('DÍAS sin tarjeta', await info())
    await a.evaluar(`document.querySelector('[data-billete="llegada"]')?.scrollIntoView({ block: 'center' }); true`)
    await a.esp(700)
    await a.captura(png('v48_dias_sin_tarjeta'))
    await ev(TARJETA)
    await a.esp(1200)
    console.log('DÍAS con tarjeta', await info())
    await a.captura(png('v48_dias_con_tarjeta'))
    // 2 · HOY, día de llegada, con tarjeta y sin ella
    await montarHoy(c, 10 * 60, '')
    console.log('HOY dom', await a.evaluar(`(() => { const e = document.querySelector('[data-billete="llegada"]'); if (!e) return 'no'; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); let p = e.parentElement; const cadena = []; for (let i = 0; i < 4 && p; i++, p = p.parentElement) { const b = p.getBoundingClientRect(); cadena.push(p.tagName + '.' + String(p.className).slice(0, 50) + ' h' + Math.round(b.height) + ' ov:' + getComputedStyle(p).overflow); } return JSON.stringify({ h: Math.round(r.height), w: Math.round(r.width), disp: cs.display, vis: cs.visibility, op: cs.opacity, cadena }) })()`))
    console.log('HOY posiciones', await a.evaluar(`JSON.stringify({ billete: document.querySelector('[data-billete="llegada"]')?.getBoundingClientRect().top, cabecera: document.querySelector('h1, [data-hoy-cabecera]')?.getBoundingClientRect().top, bienvenida: Array.from(document.querySelectorAll('span,div')).find((e) => e.children.length === 0 && /Aterrizas/.test(e.textContent || ''))?.getBoundingClientRect().top })`))
    await a.evaluar(`document.querySelector('[data-billete="llegada"]')?.scrollIntoView({ block: 'start' }); true`)
    console.log('HOY con tarjeta', await a.evaluar(`JSON.stringify({ hay: Boolean(document.querySelector('[data-billete="llegada"]')), qr: document.querySelector('[data-billete="llegada"]')?.getAttribute('data-billete-qr') })`))
    await a.captura(png('v48_hoy_con_tarjeta'))
    await a.evaluar(`(async () => { const B = await import('/src/store/useBilleteStore.ts'); B.useBilleteStore.setState({ datos: {} }); return true })()`)
    await a.esp(1200)
    console.log('HOY sin tarjeta', await a.evaluar(`JSON.stringify({ hay: Boolean(document.querySelector('[data-billete="llegada"]')), qr: document.querySelector('[data-billete="llegada"]')?.getAttribute('data-billete-qr') })`))
    await a.captura(png('v48_hoy_sin_tarjeta'))
  } finally {
    a.cerrar()
  }
}

// 3 · Los avisos de HOY: Museos Vaticanos a las 18:20 (sin llevar nada hecho) y «Hoy ya no da tiempo a todo» a mediodía (la primera parada era de mañana)
{
  const c = await abrir(390)
  const { a } = c
  try {
    await a.evaluar(VUELO.replace("arrivalFlightTime: '11:15'", "arrivalFlightTime: null").replace("arrivalOtraHora: '08:30'", "arrivalOtraHora: null"))
    await montarHoy(c, 18 * 60 + 20, "const s0 = r.days.find((d) => !d.isReturnLeg).stops.find((s) => !s.isBreak && !s.isArrival); s0.hoursData = { schedule: 'Lun-Dom 8:00-20:00', last_entry: '18:00' }; delete s0.hours; delete s0.scheduleText")
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Dejarlo como está/.test(x.textContent || '')); b?.click(); return true })()")
    await a.esp(1500)
    console.log('aviso 18:20', await a.evaluar(`JSON.stringify({ titulo: document.querySelector('[data-hoy-horario-vivo-texto]')?.textContent ?? null, ver: Boolean(document.querySelector('[data-horario-ver-solucion]')) })`))
    await a.captura(png('v48_aviso_museos_1820'))
    await a.evaluar("document.querySelector('[data-horario-ver-solucion]')?.click(); true")
    await a.esp(1500)
    console.log('solución', await a.evaluar(`(document.querySelector('[role=\"dialog\"]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 260)`))
    await a.captura(png('v48_aviso_museos_solucion'))
    await montarHoy(c, 12 * 60, '')
    console.log('ya no da tiempo', await a.evaluar(`JSON.stringify({ hoja: Boolean(document.querySelector('[data-hoy-ya-no-da-tiempo]')), texto: (document.querySelector('[data-hoy-ya-no-da-tiempo]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 200) })`))
    await a.captura(png('v48_ya_no_da_tiempo'))
  } finally {
    a.cerrar()
  }
}

// 4 · EXPLORAR: la ficha de un lugar, con la barra «Escuchar historia» y el botón de añadir
{
  const c = await abrir(375)
  const { a, ev } = c
  try {
    await ev(`${R}.getState().setMode('explore')`)
    await a.esp(3000)
    await a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Atraccion/.test((x.textContent || '').trim())); b?.click(); return Boolean(b) })()`)
    await a.esp(3500)
    const abre = await a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, [role="button"], div[data-lugar], li')).find((x) => /Campidoglio/i.test(x.textContent || '') && x.getBoundingClientRect().height > 30 && x.getBoundingClientRect().height < 260); if (!b) return false; b.click(); return true })()`)
    console.log('abre ficha', abre)
    if (!abre) console.log('lista', await a.evaluar(`Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean).slice(0, 40).join(' | ')`))
    await a.esp(2500)
    console.log('ficha', await a.evaluar(`JSON.stringify({ barra: Boolean(document.querySelector('[data-escuchar-barra]')), añadir: Array.from(document.querySelectorAll('button')).filter((b) => /^(\\+ Añadir|Añadir )/.test((b.textContent || '').trim())).map((b) => { const r = b.getBoundingClientRect(); const barra = document.querySelector('[data-escuchar-barra]')?.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), barraBottom: barra ? Math.round(barra.bottom) : null, barraTop: barra ? Math.round(barra.top) : null } }) })`))
    await a.captura(png('v48_explorar_ficha'))
  } finally {
    a.cerrar()
  }
}
console.log('capturas hechas')
