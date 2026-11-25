// NOCHE (agente HOY): SOLO capturas (no es una prueba) de las pantallas de HOY en modo iPhone (375 x 812) con datos reales, para ponerlas al lado del dibujo de Design.
//   FASE=antes|despues APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/noche_hoy_app.mjs [escena,escena]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const FASE = process.env.FASE ?? 'despues'
const CAP = path.resolve('docs/dias/NOCHE_HOY_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}_${FASE}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const V48 = fs.readFileSync('scripts/destino/capturasV48.mjs', 'utf8')
const VUELO = V48.match(/const VUELO = "([\s\S]*?)"\r?\n/)[1]
const TARJETA = V48.match(/const TARJETA = `([\s\S]*?)`\r?\n/)[1]
const solo = process.argv[2] ? process.argv[2].split(',') : null
const quiero = (n) => !solo || solo.includes(n)

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 375, alto: 812 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const clic = async (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); b?.click(); return Boolean(b) })()`)
const clicTexto = (re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, a')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const texto = (sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 300)`)
const PLAZA = "const d0 = r.days.find((d) => !d.isReturnLeg); const s0 = d0.stops.find((s) => !s.isBreak && !s.isArrival); s0.name = 'Plaza del Campidoglio'; s0.fullName = 'Plaza del Campidoglio'; for (const k of ['photoUrl', 'fixedPhotoUrl', 'wikipediaTitle', 'hours', 'hours_data', 'hoursData', 'scheduleText', 'schedule']) delete s0[k]"
const montar = async (min, mut = '', demo = '', pos = null) => {
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    ${demo}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${pos ? "'granted'" : "'denied'"}
    st.getState().setDevSimulatedTodayIso('2026-10-17'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3200)
}
const hecho = (n) => console.log('captura', n)
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  // 1 · La tarjeta de la parada
  if (quiero('parada')) {
    await montar(7 * 60)
    await a.captura(png('parada_T1_cerrado_sin_ubicacion'))
    await montar(10 * 60, PLAZA)
    await a.captura(png('parada_T2_plaza'))
    await montar(10 * 60, PLAZA, "window.__pedazosDemo = { 'Plaza del Campidoglio': ['La Roma de Miguel Ángel'] }; window.__piezaDemo = { 'Plaza del Campidoglio': { coleccion: 'miguel_angel', sitio: 'plaza_del_campidoglio' } }")
    await clic('[data-hoy-ya-he-llegado]')
    await a.esp(2500)
    await a.captura(png('parada_T3_aqui'))
    hecho('parada')
  }
  // 2 · Cambiar plan › Pasar a otro día; 3 · retraso, comer, añadir
  if (quiero('cambiar')) {
    await montar(12 * 60)
    await clic('[data-hoy-cambiar-plan]')
    await a.esp(800)
    await a.captura(png('cambiar_menu'))
    await clic('[data-cambiar-opcion="otro_dia"]')
    await a.esp(1200)
    await a.captura(png('pasar_dia_26a_lista'))
    console.log('lista', await texto('[data-cambiar-hoja]'))
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[data-dia-de-la-lista]')).find((x) => !x.hasAttribute('data-dia-cerrado') && !x.hasAttribute('data-excursion')); b?.click(); return Boolean(b) })()")
    await a.esp(1800)
    await a.captura(png('pasar_dia_hoja_A2'))
    console.log('hoja', await texto('[data-cambiar-hoja]'))
    hecho('cambiar')
  }
  if (quiero('retraso')) {
    await montar(12 * 60 + 40)
    await clic('[data-hoy-cambiar-plan]')
    await a.esp(700)
    await clic('[data-cambiar-opcion="retraso"]')
    await a.esp(1800)
    await a.captura(png('retraso_23a'))
    console.log('retraso', await texto('[data-cambiar-hoja]'))
    hecho('retraso')
  }
  if (quiero('comer')) {
    await montar(13 * 60)
    await clic('[data-hoy-cambiar-plan]')
    await a.esp(700)
    await clic('[data-cambiar-opcion="comer"]')
    await a.esp(3000)
    await a.captura(png('comer_24_sin_ubicacion'))
    await montar(13 * 60, '', '', { lat: 41.8986, lng: 12.4769 })
    await clic('[data-hoy-cambiar-plan]')
    await a.esp(700)
    await clic('[data-cambiar-opcion="comer"]')
    await a.esp(3500)
    await a.captura(png('comer_24_con_ubicacion'))
    hecho('comer')
  }
  if (quiero('anadir')) {
    await montar(15 * 60)
    await clic('[data-hoy-cambiar-plan]')
    await a.esp(700)
    await clic('[data-cambiar-opcion="anadir"]')
    await a.esp(2500)
    await a.captura(png('anadir_27a_lista'))
    console.log('anadir', await texto('[data-cambiar-hoja]'))
    await clic('[data-anadir-candidato] [data-anadir-elegir]')
    await a.esp(1500)
    await a.captura(png('anadir_27c_elegido'))
    await clic('[data-propuesta-aplicar]')
    await a.esp(1500)
    await a.captura(png('aviso_abajo_deshacer'))
    hecho('anadir')
  }
  // 4 · Lugares pendientes
  if (quiero('pendientes')) {
    const SALTADAS = "const d = r.days[0]; const v = d.stops.filter((s) => !s.isBreak && !s.isArrival); for (const i of [1, 2, 3, 4, 5]) if (v[i]) v[i].saltada = true;"
    await montar(12 * 60, SALTADAS)
    await a.evaluar("document.querySelector('[data-hoy-pendientes]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(700)
    await a.captura(png('pendientes_L1_plegado'))
    await clic('[data-hoy-pendientes-cabecera]')
    await a.esp(800)
    await a.evaluar("document.querySelector('[data-hoy-pendientes]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(600)
    await a.captura(png('pendientes_L2_abierto'))
    await clic('[data-hoy-pendiente-mas]')
    await a.esp(900)
    await a.captura(png('pendientes_L3_menu'))
    await a.evaluar("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true")
    await a.esp(700)
    await clic('[data-hoy-pendientes-pasar-todos]')
    await a.esp(1800)
    await a.captura(png('pendientes_L4_resumen'))
    hecho('pendientes')
  }
  // 5 · Los avisos: el de arriba (Museos Vaticanos 18:20) y su hoja
  if (quiero('avisos')) {
    const MUSEOS = "const d0 = r.days.find((d) => !d.isReturnLeg); const i = d0.stops.findIndex((s) => /Museos Vaticanos/.test(s.name)); const [m] = d0.stops.splice(i, 1); d0.stops.splice(1, 0, m); m.hoursData = { schedule: 'Lun-Dom 8:00-20:00', last_entry: '18:00' }; delete m.hours; delete m.scheduleText; const p0 = d0.stops[0]; p0.hoursData = { schedule: 'Lun-Dom 0:00-23:59' }; delete p0.hours; delete p0.scheduleText"
    await montar(18 * 60 + 20, MUSEOS)
    await clicTexto(/Dejarlo como está/)
    await a.esp(1500)
    await a.captura(png('aviso_arriba_A1'))
    await clic('[data-horario-ver-solucion]')
    await a.esp(1800)
    await a.captura(png('aviso_arriba_A2_hoja'))
    hecho('avisos')
  }
  // 6 · El billete (día de llegada, con y sin tarjeta)
  if (quiero('billete')) {
    await a.evaluar(VUELO)
    await montar(10 * 60)
    await a.evaluar("document.querySelector('[data-billete=\"llegada\"]')?.scrollIntoView({ block: 'start' }); true")
    await a.esp(700)
    await a.captura(png('billete_Q_sin_tarjeta'))
    await ev(TARJETA)
    await a.esp(1500)
    await a.captura(png('billete_Q_con_tarjeta'))
    hecho('billete')
  }
} finally {
  a.cerrar()
}
console.log('capturas hechas', FASE)
