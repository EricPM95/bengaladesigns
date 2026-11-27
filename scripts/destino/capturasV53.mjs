// V53: SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar cada parte. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV53.mjs [parte]
// Partes: hoy (6, 3, 2) · reservas (4, 7a) · reorganizar (7b, 3, 2, 1) · dias (5, Roma) · lanza (5 y 6 en Lanzarote; necesita la API normal)
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V53_capturas')
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
const montarHoy = async ({ a, ev }, min, mut = '') => {
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy1:juego:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
    st.getState().setDevSimulatedTodayIso('2026-10-17'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3000)
}
const texto = (a, sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 500)`)
const ver = async (a, sel = '[data-hoy-siguiente]') => { await a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e?.scrollIntoView({ block: 'start' }); return Boolean(e) })()`); await a.esp(500) }
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const MUSEOS_PRIMERO = "const d0 = r.days.find((d) => !d.isReturnLeg); const i = d0.stops.findIndex((s) => /Museos Vaticanos/.test(s.name)); const [m] = d0.stops.splice(i, 1); d0.stops.splice(0, 0, m); m.hoursData = { schedule: 'Lun-Dom 8:00-20:00', last_entry: '18:00' }; delete m.hours; delete m.scheduleText; const p1 = d0.stops[1]; p1.hoursData = { schedule: 'Lun-Dom 0:00-23:59' }; delete p1.hours; delete p1.scheduleText"

// Cierra las hojas de permisos y el día que se abre solo al entrar, para ver la lista de DÍAS entera.
const limpiarDias = async (a) => {
  for (let i = 0; i < 3; i++) { await clicTexto(a, '/^(Continuar|Entendido|Vale|Ahora no)$/'); await a.esp(500) }
  await a.evaluar(`(async () => { ${R}.getState().setActiveDayId(null); return true })()`)
  await a.esp(1200)
  await a.evaluar("(() => { const e = document.querySelector('[data-dia-pasado]'); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -140); return Boolean(e) })()")
  await a.esp(6500)
}

// HOY: el icono de pendientes (6), los dos botones (3) y la sombra (2)
if (toca('hoy')) {
  const c = await abrir()
  const { a } = c
  try {
    await montarHoy(c, 18 * 60 + 20, MUSEOS_PRIMERO)
    await clicTexto(a, '/Dejarlo como está/')
    await a.esp(1200)
    await ver(a)
    await a.captura(png('v53_6_boton_guardar_pendientes'))
    // [Pasar a otro día] › un día: la propuesta con DOS opciones (dorado + «Dejarlo como está» lado a lado) sobre la sombra nueva
    await clic(a, '[data-hoy-pasar-otro-dia]')
    await a.esp(1000)
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[data-dia-de-la-lista]')).find((x) => !x.hasAttribute('data-dia-cerrado') && !x.hasAttribute('data-excursion')); b?.click(); return Boolean(b) })()")
    await a.esp(1800)
    console.log('3 dos botones', await a.evaluar("JSON.stringify({ dos: Boolean(document.querySelector('[data-dos-botones]')), oro: Boolean(document.querySelector('[data-propuesta-aplicar]')), dejar: Boolean(document.querySelector('[data-propuesta-dejar]')) })"))
    await a.captura(png('v53_3_dos_opciones_hoy'))
  } finally {
    a.cerrar()
  }
  const c2 = await abrir()
  try {
    await montarHoy(c2, 18 * 60 + 20, MUSEOS_PRIMERO)
    await clicTexto(c2.a, '/Dejarlo como está/')
    await c2.a.esp(1200)
    await clic(c2.a, '[data-hoy-guardar-pendientes]')
    await c2.a.esp(1500)
    await c2.a.captura(png('v53_6_aviso_pendientes'))
    await c2.a.evaluar("(() => { const e = document.querySelector('[data-hoy-pendientes]'); e?.scrollIntoView({ block: 'center' }); return Boolean(e) })()")
    await c2.a.esp(900)
    await c2.a.captura(png('v53_6_cabecera_pendientes'))
  } finally {
    c2.a.cerrar()
  }
  // 3 o más opciones: «Voy con retraso» a media mañana (dorado, blanco con borde y la salida pequeña) y la tarjeta con el cuadrado del pin con reloj (I3)
  const c3 = await abrir()
  try {
    await montarHoy(c3, 12 * 60 + 20, '')
    await clicTexto(c3.a, '/Dejarlo como está/')
    await c3.a.esp(800)
    await clic(c3.a, '[data-hoy-cambiar-plan]')
    await c3.a.esp(800)
    await clic(c3.a, '[data-cambiar-opcion="retraso"]')
    await c3.a.esp(1800)
    console.log('3 tres opciones', await c3.a.evaluar("JSON.stringify({ dos: Boolean(document.querySelector('[data-dos-botones]')), otra: Boolean(document.querySelector('[data-propuesta-otra]')), dejar: Boolean(document.querySelector('[data-propuesta-dejar]')) })"))
    await c3.a.captura(png('v53_3_tres_opciones_hoy'))
    // la tarjeta del sitio con el pin con reloj (la pieza de la hoja «Pasar a otro día» cuando va a pendientes), montada con la pieza real
    await c3.a.evaluar(`(async () => {
      const reactM = await import('/node_modules/.vite/deps/react.js'); const React = reactM.default ?? reactM
      const rdc = await import('/node_modules/.vite/deps/react-dom_client.js'); const createRoot = rdc.createRoot ?? rdc.default?.createRoot
      const { TarjetaDelSitio } = await import('/src/components/route/hoy/v2/CambiarPlan.tsx')
      const cont = document.createElement('div'); cont.id = 'v53-montaje'; cont.style.cssText = 'position:fixed;inset:0;z-index:999;background:#FBF3E2;padding:90px 18px;display:flex;flex-direction:column;gap:12px'
      document.body.appendChild(cont)
      createRoot(cont).render(React.createElement(TarjetaDelSitio, { t: { nombre: 'Arco de Constantino', fotoUrl: '', cuando: 'A Lugares pendientes', semanaCorta: '', numero: '', destino: '', diaDeHoy: '', aPendientes: true } }))
      return true })()`)
    await c3.a.esp(900)
    await c3.a.captura(png('v53_6_tarjeta_pendientes'))
  } finally {
    c3.a.cerrar()
  }
}

// RESERVAS: «Llegada y vuelta» plegado (7a) y la papelera del vuelo abajo a la derecha (4)
if (toca('reservas')) {
  const c = await abrir()
  const { a, ev } = c
  try {
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(2200)
    console.log('7a márgenes', await a.evaluar(`JSON.stringify(['llegada-vacia','alojamiento','entradas'].map((k) => { const e = k === 'llegada-vacia' ? document.querySelector('[data-llegada-vacia] [data-icono-bloque], [data-llegada-vacia]') : document.querySelector('[data-cabecera-clara="' + k + '"]'); const i = e?.querySelector('svg, [data-icono-bloque]') ?? e; return [k, i ? Math.round(i.getBoundingClientRect().left) : null] }))`))
    await a.captura(png('v53_7a_llegada_plegada'))
    // un vuelo guardado en las dos mitades, sin tarjeta de embarque
    await ev("(() => { const st = window.__ruta.getState(); const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, answers: { ...r.answers, origin: 'Barcelona', originPlace: undefined, transportContext: undefined }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:25', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia', arrivalOtroPunto: 'El Prat', departureOtroPunto: 'El Prat', arrivalOtraHora: '08:30', departureOtraHora: '20:35', arrivalCodigo: 'VY 6102', departureCodigo: 'VY 6105' } }); return true })()")
    await a.esp(1500)
    await ev("(() => { const b = document.querySelector('[data-llegada-cabecera]'); const abierta = document.querySelector('[data-mitad]'); if (!abierta) b?.click(); return true })()")
    await a.esp(1500)
    console.log('4 papelera vuelo', await a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[data-mitad]')).map((m) => { const p = m.querySelector('[data-papelera]'); const b = m.querySelector('[data-boton-anadir-documento], [data-anadir-documento]'); const r = p?.getBoundingClientRect(); const mr = m.getBoundingClientRect(); return { mitad: m.getAttribute('data-mitad'), papelera: Boolean(p), derecha: r ? Math.round(mr.right - r.right) : null, abajo: r ? Math.round(mr.bottom - r.bottom) : null, enFilaDelBoton: Boolean(p && b && Math.abs(p.getBoundingClientRect().top - b.getBoundingClientRect().top) < 20) } }))`))
    await a.evaluar("(() => { const e = document.querySelector('[data-mitad=\"arrival\"]'); e?.scrollIntoView({ block: 'start' }); return true })()")
    await a.esp(700)
    await a.captura(png('v53_4_vuelo_papelera'))
  } finally {
    a.cerrar()
  }
}

// REORGANIZAR: «¿Adaptamos tu primer y tu último día a tus vuelos?» y «¿Reorganizamos tu día?» (7b, 3, 2, 1)
if (toca('reorganizar')) {
  const c = await abrir()
  const { a, ev } = c
  try {
    await ev(`${R}.getState().setMode('route')`)
    await a.esp(1500)
    await a.evaluar(`(async () => { const { useReorganizarStore } = await import('/src/store/useReorganizarStore.ts'); const r = ${R}.getState().route; useReorganizarStore.getState().poner([r.days[0].id], [r.days[0].id]); useReorganizarStore.getState().abrirAlerta(); return true })()`)
    await a.esp(1200)
    console.log('7b reorganizar', await a.evaluar("JSON.stringify({ icono: Boolean(document.querySelector('[data-alerta-reorganizar] [data-icono-reorganizar]')), dos: Boolean(document.querySelector('[data-alerta-reorganizar] [data-dos-botones]')) })"))
    await a.captura(png('v53_7b_reorganizar_alerta'))
    await a.evaluar(`(async () => { const { useReorganizarStore } = await import('/src/store/useReorganizarStore.ts'); useReorganizarStore.getState().cerrarAlerta(); const r = ${R}.getState().route; useReorganizarStore.getState().proponerVuelos({ dias: [{ dayId: r.days[0].id, dayNumber: 1 }, { dayId: r.days.at(-1).id, dayNumber: r.days.length }] }); return true })()`)
    await a.esp(1500)
    console.log('7b adaptar', await a.evaluar("JSON.stringify({ hoja: Boolean(document.querySelector('[data-alerta-adaptar]')), icono: Boolean(document.querySelector('[data-alerta-adaptar] [data-icono-reorganizar]')) })"))
    await a.captura(png('v53_7b_adaptar_vuelos'))
    await clic(a, '[data-adaptar-no]')
    await a.esp(1200)
    await a.captura(png('v53_7b_boton_flotante_queda'))
  } finally {
    a.cerrar()
  }
}

// DÍAS: los días que ya pasaron (5), en Roma
if (toca('dias')) {
  const c = await abrir()
  const { a, ev } = c
  try {
    await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); r.days.forEach((d) => d.stops.forEach((s) => { delete s.checkedInAt })); r.days[0].stops[1].checkedInAt = new Date().toISOString(); st.setState({ route: r }); st.getState().setDevSimulatedTodayIso(r.days[2].dayNumber ? '${'2026-10-19'}' : '2026-10-19'); st.getState().setMode('days'); st.getState().setActiveDayId(null); return true })()`)
    await a.esp(2500)
    await limpiarDias(a)
    console.log('5 roma', await a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[data-dia-pasado]')).map((e) => (e.innerText || '').replace(/\\s+/g, ' ').slice(0, 90)))`))
    await a.captura(png('v53_5_dias_roma'))
  } finally {
    a.cerrar()
  }
}

// LANZAROTE: DÍAS con un día con foto y otro sin nada (5) y comprobaciones de 3, 6 en el mismo viaje
if (toca('lanza')) {
  const c = await abrir({ lanza: true })
  const { a, ev } = c
  try {
    await a.evaluar(`(async () => {
      const st = ${R}; const r = st.getState().route
      const sync = (await import('/src/store/useSyncStore.ts')).useSyncStore
      sync.setState({ activeTripId: 'lz-v53' })
      const d1 = r.days[0]
      window.__fotosDePrueba = { 'lz-v53': [{ id: 'f1', dayNumber: d1.dayNumber, createdAt: new Date().toISOString(), tripId: 'lz-v53', stopId: d1.stops[0]?.id ?? null, ruta: 'x', url: '' }] }
      const copia = JSON.parse(JSON.stringify(r)); copia.days.forEach((d) => d.stops.forEach((s) => { delete s.checkedInAt })); st.setState({ route: copia })
      st.getState().setDevSimulatedTodayIso('2026-11-13'); st.getState().setMode('days'); st.getState().setActiveDayId(null); return true })()`)
    await a.esp(3500)
    await limpiarDias(a)
    console.log('5 lanzarote', await a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[data-dia-pasado]')).map((e) => (e.innerText || '').replace(/\\s+/g, ' ').slice(0, 90)))`))
    await a.captura(png('v53_5_dias_lanzarote'))
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(2200)
    await a.captura(png('v53_7a_llegada_plegada_lanzarote'))
  } finally {
    a.cerrar()
  }
  // HOY en Lanzarote (en coche): una parada guardada en pendientes con su aviso y su cabecera
  const c2 = await abrir({ lanza: true })
  try {
    await montarHoy(c2, 10 * 60, "const d0 = r.days.find((d) => !d.isReturnLeg); d0.stops.filter((s) => !s.isArrival).slice(1, 3).forEach((s) => { s.saltada = true })")
    await c2.a.evaluar("(async () => { const st = (await import('/src/store/useRouteStore.ts')).useRouteStore; const r = st.getState().route; const d = r.days.find((x) => !x.isReturnLeg); st.getState().setDevSimulatedTodayIso(r.answers.dateRange.start); return true })()")
    await c2.a.esp(2500)
    await c2.a.evaluar("(() => { const e = document.querySelector('[data-hoy-pendientes]'); e?.scrollIntoView({ block: 'center' }); return Boolean(e) })()")
    await c2.a.esp(900)
    console.log('6 lanzarote pendientes', await c2.a.evaluar("JSON.stringify({ bloque: Boolean(document.querySelector('[data-hoy-pendientes]')), icono: Boolean(document.querySelector('[data-hoy-pendientes] [data-icono-pendientes]')) })"))
    await c2.a.captura(png('v53_6_cabecera_pendientes_lanzarote'))
  } finally {
    c2.a.cerrar()
  }
}
// CUENTA: una hoja de cuenta («¿Cómo te llamas?», por el escaparate de desarrollo): el dorado único, dos botones lado a lado y la sombra sin desenfoque (1, 2, 3)
if (toca('cuenta')) {
  const c = await abrir()
  const { a } = c
  try {
    await a.evaluar("window.__escaparate.abrir('c3-Como-te-llamas').then(() => true)")
    await a.esp(1500)
    console.log('1 cuenta', await a.evaluar("JSON.stringify({ dos: Boolean(document.querySelector('[data-dos-botones]')), boton: getComputedStyle(document.querySelector('[data-boton-hoja=\"nombre-seguir\"]') ?? document.body).backgroundImage.slice(0, 70), fondo: getComputedStyle(document.querySelector('[data-hoja] .hoja-fondo')).backgroundColor, blur: getComputedStyle(document.querySelector('[data-hoja] .hoja-fondo')).backdropFilter })"))
    await a.captura(png('v53_1_cuenta_dorado_y_dos_botones'))
  } finally {
    a.cerrar()
  }
}
console.log('capturas hechas')
