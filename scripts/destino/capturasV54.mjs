// V54: SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar cada parte. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV54.mjs [parte]
// Partes: uno (1 aviso y 2 del mismo tipo) · tres (3 de tipos distintos, plegados y desplegados, sube el siguiente) · peligro (Coliseo y su hoja) · margen (Foro, los dos casos) · pasada · grupo (3 sitios) · lanza
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V54_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const SOLO = process.argv[2] ?? null
const toca = (n) => !SOLO || SOLO === n
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'

async function abrir(extra = {}) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844, ...extra })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  const lanza = extra.lanza
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  return { a, ev }
}
// `mut`: JavaScript que prepara `r` (el viaje). `pos`: 'lejos' pone la ubicación a ~3 km de la 2.ª parada (ruta), si no, sin ubicación.
const montarHoy = async ({ a, ev }, min, mut = '', iso = '2026-10-17') => {
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy2:') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy1:juego:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}
    st.getState().setDevSimulatedTodayIso('${iso}'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3500)
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const avisos = (a) =>
  a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[data-hoy-aviso-fila]')).map((e) => ({ tono: e.getAttribute('data-hoy-aviso-fila'), titulo: e.querySelector('[data-hoy-aviso-titulo]')?.textContent, sub: e.querySelector('[data-hoy-aviso-sub]')?.textContent, boton: e.querySelector('button')?.textContent })).concat([{ mas: document.querySelector('[data-hoy-aviso-mas]')?.textContent ?? null, desplegado: Boolean(document.querySelector('[data-hoy-avisos-desplegados]')) }]))`)
const arriba = async (a) => {
  await a.evaluar('window.scrollTo(0, 0); document.querySelectorAll("*").forEach((e) => { if (e.scrollTop > 0 && e.scrollHeight > e.clientHeight + 40) e.scrollTop = 0 }); true')
  await a.esp(500)
}
const deslizar = (a, sel) =>
  a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; const t = (y) => new Touch({ identifier: 1, target: e, clientX: 100, clientY: y }); e.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t(300)], changedTouches: [t(300)] })); e.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t(200)] })); return true })()`)

// Día de prueba: la 2.ª parada pasa a ser una entrada con hora (nombre y hora a elegir); la ubicación, a ~3 km de ella (en la ruta). La 1.ª, 60 min de duración a las 8:30.
const ENTRADA = (nombre, hora, extra = '') => `const d0 = r.days.find((d) => !d.isReturnLeg); const S = d0.stops; const todas = r.days.flatMap((d) => d.stops); const real = todas.find((x) => /Arco de Constantino/.test(x.name)) ?? todas.find((x) => /Pante|Navona|Trevi/.test(x.name)); if (real) { S[0] = { ...JSON.parse(JSON.stringify(real)), id: 'v54-antes' }; delete S[0].checkedInAt; delete S[0].saltada; delete S[0].reservationTime; delete S[0].reservedId } S[0].time = '08:30'; S[0].durationMinutes = 60; S[0].hoursData = null; const E = S[1]; E.name = ${JSON.stringify(nombre)}; E.reservationTime = ${JSON.stringify(hora)}; E.time = ${JSON.stringify(hora)}; E.durationMinutes = 90; E.hoursData = null; window.__pos = { lat: E.coordinates.lat + 0.03, lng: E.coordinates.lng }; window.__perm = 'granted'; ${extra}`
const SEGUNDA = (nombre, hora) => `{ const E2 = S[2]; E2.name = ${JSON.stringify(nombre)}; E2.reservationTime = ${JSON.stringify(hora)}; E2.time = ${JSON.stringify(hora)}; E2.durationMinutes = 90; E2.hoursData = null }`
// Visitas con horario que cierra a las 18:00 (dentro): para «Hoy ya no llegas a N sitios»
const CIERRAN = (idx) => idx.map((i) => `{ const q = S[${i}]; q.reservationTime = undefined; q.reservedId = undefined; q.hoursData = { schedule: 'Lun-Dom 8:00-18:00', last_entry: '17:30', ver_por: 'solo_dentro' }; delete q.hours; delete q.scheduleText }`).join(';')

if (toca('uno')) {
  const c = await abrir()
  try {
    await montarHoy(c, 8 * 60 + 55, ENTRADA('Coliseo', '09:15'))
    await arriba(c.a)
    console.log('uno', await avisos(c.a))
    await c.a.captura(png('v54_1_un_aviso'))
    // No se va solo: pasan 8 s y sigue
    await c.a.esp(8000)
    console.log('uno tras 8 s', await avisos(c.a))
  } finally {
    c.a.cerrar()
  }
  const c2 = await abrir()
  try {
    await montarHoy(c2, 8 * 60 + 55, ENTRADA('Coliseo', '09:15', SEGUNDA('Museos Vaticanos', '09:45')))
    await arriba(c2.a)
    console.log('dos del mismo tipo', await avisos(c2.a))
    await c2.a.captura(png('v54_1_dos_del_mismo_tipo'))
  } finally {
    c2.a.cerrar()
  }
}

if (toca('tres')) {
  const c = await abrir()
  try {
    // rojo (Coliseo 9:15 sin llegar) + amarillo «ya ha pasado» (Museos 8:00 ya pasada) + amarillo «ya no llegas» (una visita que cierra)
    await montarHoy(c, 8 * 60 + 55, ENTRADA('Coliseo', '09:15', `${SEGUNDA('Galería Borghese', '08:00')}; { const F = S[3]; F.name = 'Foro Romano y Palatino'; F.reservationTime = '09:40'; F.time = '09:40'; F.durationMinutes = 90; F.hoursData = null; S.forEach((q, i) => { if (i > 3) q.durationMinutes = 300 }) }`))
    await arriba(c.a)
    console.log('tres plegados', await avisos(c.a))
    await c.a.captura(png('v54_1_tres_plegados'))
    await clic(c.a, '[data-hoy-aviso-mas]')
    await c.a.esp(900)
    await arriba(c.a)
    console.log('tres desplegados', await avisos(c.a))
    await c.a.captura(png('v54_1_tres_desplegados'))
    await clic(c.a, '[data-hoy-aviso-menos]')
    await c.a.esp(600)
    // sube el siguiente: el de arriba se va deslizándolo
    await deslizar(c.a, '[data-hoy-aviso-fila="rojo"]')
    await c.a.esp(1200)
    await arriba(c.a)
    console.log('tras deslizar el rojo', await avisos(c.a))
    await c.a.captura(png('v54_1_sube_el_siguiente'))
  } finally {
    c.a.cerrar()
  }
}

const LIBRE_EL_SIGUIENTE = "const dd = r.days.filter((d) => !d.isReturnLeg); if (dd[1]) dd[1].stops = dd[1].stops.slice(0, 2)"

if (toca('peligro')) {
  const c = await abrir()
  try {
    // El Coliseo en peligro: lo de antes (la 1.ª parada, a las 8:30) no deja llegar; la solución la pasa a otro día
    await montarHoy(c, 8 * 60 + 40, ENTRADA('Coliseo', '09:15', LIBRE_EL_SIGUIENTE))
    await arriba(c.a)
    console.log('peligro', await avisos(c.a))
    await clic(c.a, '[data-peligro-ver-solucion]')
    await c.a.esp(1800)
    console.log('hoja', await c.a.evaluar("(document.querySelector('[data-cambiar-hoja]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 600)"))
    await c.a.captura(png('v54_3_hoja_coliseo'))
    console.log('botones', await c.a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-cambiar-hoja] button')).map((b) => b.textContent.trim()))"))
    await clic(c.a, '[data-propuesta-elegir-dia]')
    await c.a.esp(1200)
    await c.a.captura(png('v54_3_elegir_otro_dia'))
  } finally {
    c.a.cerrar()
  }
  // Si no cabe en ningún día (los demás días llenos): a Lugares pendientes
  const c2 = await abrir()
  try {
    await montarHoy(c2, 8 * 60 + 40, ENTRADA('Coliseo', '09:15'))
    await arriba(c2.a)
    await clic(c2.a, '[data-peligro-ver-solucion]')
    await c2.a.esp(1800)
    await c2.a.captura(png('v54_3_hoja_no_cabe'))
  } finally {
    c2.a.cerrar()
  }
}

if (toca('margen')) {
  const c = await abrir()
  try {
    // Foro Romano y Palatino (libre) con retraso que CABE en el día: aviso verde que se va solo
    await montarHoy(c, 8 * 60 + 55, ENTRADA('Foro Romano y Palatino', '09:15', 'S.splice(3)'))
    await arriba(c.a)
    console.log('margen cabe', await avisos(c.a))
    await c.a.captura(png('v54_2_foro_cabe'))
    await c.a.esp(6500)
    console.log('margen cabe a los 6 s', await avisos(c.a))
  } finally {
    c.a.cerrar()
  }
  const c2 = await abrir()
  try {
    // ...y con un día que ya no cabe: aviso amarillo «Vas con retraso» + [Ver cómo queda el día]
    await montarHoy(c2, 8 * 60 + 55, ENTRADA('Foro Romano y Palatino', '09:15', 'S.forEach((s, i) => { if (i > 1) s.durationMinutes = 300 })'))
    await arriba(c2.a)
    console.log('margen no cabe', await avisos(c2.a))
    await c2.a.captura(png('v54_2_foro_no_cabe'))
    await clic(c2.a, '[data-margen-ver-dia]')
    await c2.a.esp(1500)
    await c2.a.captura(png('v54_2_foro_no_cabe_hoja'))
  } finally {
    c2.a.cerrar()
  }
}

if (toca('pasada')) {
  const c = await abrir()
  try {
    await montarHoy(c, 9 * 60 + 30, ENTRADA('Coliseo', '09:15'))
    await arriba(c.a)
    console.log('pasada', await avisos(c.a))
    await c.a.captura(png('v54_2_coliseo_ya_paso'))
  } finally {
    c.a.cerrar()
  }
}

if (toca('grupo')) {
  const c = await abrir()
  try {
    // Tres sitios que ya han cerrado (19:45)
    await montarHoy(c, 19 * 60 + 45, `const d0 = r.days.find((d) => !d.isReturnLeg); const S = d0.stops; ['Museos Capitolinos', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese'].forEach((n, i) => { const q = S[i]; q.name = n; q.fullName = n; q.reservationTime = undefined; q.reservedId = undefined; q.hoursData = null; q.time = ['19:00', '19:20', '19:40'][i]; q.durationMinutes = 40 }); window.__pos = null; window.__perm = 'denied'`)
    await arriba(c.a)
    console.log('grupo', await avisos(c.a))
    await c.a.captura(png('v54_1_grupo_3_sitios'))
    await clic(c.a, '[data-horario-ver-grupo]')
    await c.a.esp(1800)
    console.log('hoja grupo', await c.a.evaluar("(document.querySelector('[data-cambiar-hoja]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 500)"))
    await c.a.captura(png('v54_1_grupo_hoja'))
  } finally {
    c.a.cerrar()
  }
}

if (toca('lanza')) {
  const c = await abrir({ lanza: true })
  try {
    // Cueva de los Verdes (estricta, comprobada en la web de los Centros de Arte) en peligro
    await montarHoy(c, 8 * 60 + 40, ENTRADA('Cueva de los Verdes', '09:15'), '2026-11-08')
    await arriba(c.a)
    console.log('lanza peligro', await avisos(c.a))
    await c.a.captura(png('v54_4_lanzarote_peligro'))
    await clic(c.a, '[data-peligro-ver-solucion]')
    await c.a.esp(1800)
    await c.a.captura(png('v54_4_lanzarote_hoja'))
  } finally {
    c.a.cerrar()
  }
  const c2 = await abrir({ lanza: true })
  try {
    // Jameos del Agua (libre: «sin hora, vale 3 meses»): nunca «peligro»
    await montarHoy(c2, 8 * 60 + 55, ENTRADA('Jameos del Agua', '09:15'), '2026-11-08')
    await arriba(c2.a)
    console.log('lanza libre', await avisos(c2.a))
    await c2.a.captura(png('v54_4_lanzarote_libre'))
  } finally {
    c2.a.cerrar()
  }
}
