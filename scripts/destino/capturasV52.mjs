// V52: SOLO capturas (no es una prueba) en modo iPhone (390x844):
//   1 la parada que ya ha cerrado (tarjeta «YA HA CERRADO», [Pasar a otro día], [Guardar en pendientes] con su aviso y Deshacer) y los Museos Vaticanos cerrados
//   2 el aviso «Has visto …» · 3 «Guarda un recuerdo de …» · 4 el emblema oculto al pulsar [Ya he llegado]
//   5c «Lo que te llevas de hoy» · 5b la línea naranja del documento en entrada, excursión y alojamiento · 5 los sonidos pedidos (sin audio real)
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV52.mjs [seccion]
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V52_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const SOLO = process.argv[2] ?? null
const toca = (n) => !SOLO || SOLO === n

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
// Los Museos Vaticanos, los primeros del día: abren de 8:00 a 20:00 con última entrada a las 18:00 (a las 18:20 ya no se puede entrar); la segunda parada, abierta todo el día.
const MUSEOS_PRIMERO = "const d0 = r.days.find((d) => !d.isReturnLeg); const i = d0.stops.findIndex((s) => /Museos Vaticanos/.test(s.name)); const [m] = d0.stops.splice(i, 1); d0.stops.splice(0, 0, m); m.hoursData = { schedule: 'Lun-Dom 8:00-20:00', last_entry: '18:00' }; delete m.hours; delete m.scheduleText; const p1 = d0.stops[1]; p1.hoursData = { schedule: 'Lun-Dom 0:00-23:59' }; delete p1.hours; delete p1.scheduleText"

// 1 · la parada que ya ha cerrado
if (toca('1')) {
  const c = await abrir()
  const { a } = c
  try {
    await montarHoy(c, 18 * 60 + 20, MUSEOS_PRIMERO)
    await clicTexto(a, '/Dejarlo como está/')
    await a.esp(1200)
    console.log('1 tarjeta', await texto(a, '[data-hoy-siguiente]'))
    console.log('1 estado', await a.evaluar("document.querySelector('[data-hoy-siguiente]')?.getAttribute('data-hoy-estado')"))
    console.log('1 recuadro ubicacion', await a.evaluar("Boolean(document.querySelector('[data-hoy-sin-ubicacion],[data-hoy-lejos]'))"), '| ya he llegado:', await a.evaluar("Boolean(document.querySelector('[data-hoy-ya-he-llegado]'))"))
    console.log('1 pendientes', await a.evaluar("(document.querySelector('[data-lugares-pendientes]')?.innerText ?? 'sin bloque').replace(/\\s+/g,' ').slice(0,200)"))
    await ver(a)
    await a.captura(png('v52_1_museos_cerrados_tarjeta'))
    // [Pasar a otro día] → la hoja de siempre
    await clic(a, '[data-hoy-pasar-otro-dia]')
    await a.esp(1000)
    console.log('1 hoja dias', await texto(a, '[data-cambiar-hoja]'))
    await a.captura(png('v52_1_pasar_a_otro_dia_hoja'))
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[data-dia-de-la-lista]')).find((x) => !x.hasAttribute('data-dia-cerrado') && !x.hasAttribute('data-excursion')); b?.click(); return Boolean(b) })()")
    await a.esp(1800)
    console.log('1 propuesta', await texto(a, '[data-cambiar-hoja]'))
    await a.captura(png('v52_1_pasar_a_otro_dia_propuesta'))
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
    console.log('1 guardar en pendientes: aviso', await c2.a.evaluar("(document.querySelector('[data-aviso-sobre-la-barra]')?.innerText ?? document.body.innerText.match(/Parada saltada[^\\n]*/)?.[0] ?? 'sin aviso').replace(/\\s+/g,' ')"))
    await ver(c2.a)
    await c2.a.captura(png('v52_1_guardar_en_pendientes_aviso'))
    console.log('1 siguiente tarjeta tras guardar', await texto(c2.a, '[data-hoy-siguiente]'))
  } finally {
    c2.a.cerrar()
  }
}

// 2, 3 y 4 · el aviso «Has visto…», «Guarda un recuerdo de…» y el emblema oculto al llegar
if (toca('2')) {
  const c = await abrir()
  const { a } = c
  try {
    await montarHoy(c, 9 * 60 + 30, '')
    await clicTexto(a, '/Dejarlo como está/')
    await a.esp(800)
    await a.evaluar(`(async () => { const { useVistoStore } = await import('/src/components/logros/visto/vistoStore.ts'); const r = ${R}.getState().route; const d = r.days[0]; const s = d.stops.find((x) => /Conciliazione/.test(x.name)) ?? d.stops[1]; useVistoStore.getState().poner({ aviso: { id: 9001, parada: { tripId: r.id, dayId: d.id, dayNumber: d.dayNumber, stopId: s.id, nombre: s.name }, nombre: 'Via della Conciliazione' } }); return true })()`)
    await a.esp(800)
    console.log('2 aviso', await a.evaluar("(document.querySelector('[data-visto=\"aviso\"]')?.innerText ?? 'sin aviso').replace(/\\s+/g,' ')"))
    await a.captura(png('v52_2_has_visto_aviso'))
    await a.evaluar(`(async () => { const { useVistoStore } = await import('/src/components/logros/visto/vistoStore.ts'); useVistoStore.getState().poner({ aviso: null }); return true })()`)
    await a.esp(400)
    const abierta = await a.evaluar("(window.__demo?.abrirHojaDeVisto?.('recuerdo', 1) ?? 'no hay __demo')")
    await a.esp(900)
    console.log('3 hoja recuerdo', abierta, await texto(a, '[data-visto="hoja-recuerdo"]'))
    await a.captura(png('v52_3_guarda_un_recuerdo_hoja'))
  } finally {
    a.cerrar()
  }
}
if (toca('4')) {
  const c = await abrir()
  const { a } = c
  try {
    // El servidor de verdad no está en la demo: se simula lo que diría («aquí hay un emblema oculto») para la parada de ahora.
    await a.evaluar(`(async () => { const r = ${R}.getState().route; const s = r.days.find((d) => !d.isReturnLeg).stops.find((x) => !x.isBreak); window.__emblemaDemo = { [s.name]: { sitio: 'castillo_de_santangelo', nombre: s.name, en_sitio: 'en el Castillo', a_sitio: 'al Castillo', metros: 0, radio_m: 150, al_borde_m: 0, dentro: true, en_ruta_hoy: true, hay_emblema: true, emblema_nombre: 'El ángel', hay_pedazo: false, coleccion_nombre: null } }; return true })()`)
    await montarHoy(c, 9 * 60 + 30, '')
    await clicTexto(a, '/Dejarlo como está/')
    await a.esp(800)
    console.log('4 antes de llegar: hoja?', await a.evaluar("Boolean(document.querySelector('[data-juego=\"llegada\"]'))"))
    await ver(a)
    await a.captura(png('v52_4_antes_de_llegar'))
    await clic(a, '[data-hoy-ya-he-llegado]')
    await a.esp(1500)
    console.log('4 tras [Ya he llegado]: hoja?', await a.evaluar("Boolean(document.querySelector('[data-juego=\"llegada\"]'))"), '| «He terminado» visible:', await a.evaluar("Boolean(document.querySelector('[data-hoy-he-terminado]'))"))
    console.log('4 sonidos pedidos', await a.evaluar('JSON.stringify(window.__sonidosPedidos ?? [])'))
    await a.captura(png('v52_4_emblema_oculto_al_llegar'))
    // una vez por sitio y día: se cierra, se vuelve a pulsar y no sale otra vez
    await clic(a, '[data-juego-boton="ahora-no"]')
    await a.esp(600)
    console.log('4 tras cerrar: hoja?', await a.evaluar("Boolean(document.querySelector('[data-juego=\"llegada\"]'))"))
  } finally {
    a.cerrar()
  }
}
console.log('capturas hechas')

// 5c · «Lo que te llevas de hoy»: sin el texto vacío mientras carga, y luego lleno (la respuesta de la demo se retrasa 2,5 s, como en un móvil con poca cobertura)
if (toca('5c')) {
  const c = await abrir()
  const { a } = c
  try {
    await montarHoy(c, 9 * 60 + 30, '')
    await clicTexto(a, '/Dejarlo como está/')
    await a.evaluar("(async () => { (await import('/src/store/useSyncStore.ts')).useSyncStore.setState({ activeTripId: 'demo-v52' }); return true })()")
    await a.evaluar("window.__retrasoDemo = new Proxy({}, { get: (t, k) => (String(k).startsWith('/api/logros/resumen') ? 2500 : undefined) }); true")
    await a.evaluar("(async () => { (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI.getState().abrirResumenDia(); return true })()")
    const leer = () => a.evaluar("(document.querySelector('[aria-label=\"Resumen del día\"]')?.innerText ?? 'no abierto').split(String.fromCharCode(10)).join(' | ').slice(0, 300)")
    await a.esp(500)
    console.log('5c a los 0,5 s:', await leer())
    await a.captura(png('v52_5c_resumen_cargando'))
    await a.esp(1000)
    console.log('5c a 1,5 s:', await leer())
    await a.esp(4000)
    console.log('5c a 5,5 s:', await leer())
    await a.captura(png('v52_5c_resumen_listo'))
  } finally {
    a.cerrar()
  }
}

// 5b · la línea naranja en entrada, excursión y alojamiento (se pone el aviso como lo haría la lectura de un documento de otro día; la lectura real necesita el servidor de IA)
if (toca('5b')) {
  const c = await abrir()
  const { a, ev } = c
  const Rr = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  const abrirBloque = async (b) => {
    await Rr("st().setMode('bookings'); return true")
    await a.esp(1500)
    await ev(`(() => { const b = document.querySelector('[data-blk="${b}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema], [data-mitad]').length === 0) b.querySelector('[data-cabecera-clara], [data-llegada-cabecera]')?.click(); return true })()`)
    await a.esp(1200)
  }
  try {
    const base = await Rr("const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); return { dateIso: B.dateOfDay(r, d), nombre: s.name }")
    await Rr(`st().addReservation({ id: 'res-v52-e', kind: 'entrada', refId: ${JSON.stringify(base.nombre)}, name: ${JSON.stringify(base.nombre)}, placeNames: [${JSON.stringify(base.nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); return true`)
    await Rr("const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[0]; st().addReservation({ id: 'res-v52-x', kind: 'excursion', refId: 'excursion-v52', name: 'Excursión de prueba', placeNames: [], dateIso: B.dateOfDay(r, d), dayNumber: null, time: '08:00', precio: { amount: 60, currency: 'EUR' } }, null, null); return true")
    await Rr("const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); return true")
    await a.esp(800)
    // los avisos, como los dejaría la lectura de un documento de otro día
    const segmento = await Rr("return route().days[0].id")
    await a.evaluar(`(async () => { const { ponerAvisoDeDocumento } = await import('/src/lib/avisoDeDocumento.ts'); const { useSyncStore } = await import('/src/store/useSyncStore.ts'); const t = useSyncStore.getState().activeTripId
      ponerAvisoDeDocumento(t, 'res-v52-e', 'Esta entrada es del domingo 2 de mayo y tu viaje es del sábado 17 de octubre al domingo 25 de octubre. Revisa que sea la buena')
      ponerAvisoDeDocumento(t, 'res-v52-x', 'Esta reserva es del domingo 2 de mayo y tu viaje es del sábado 17 de octubre al domingo 25 de octubre. Revisa que sea la buena')
      ponerAvisoDeDocumento(t, 'aloj:${segmento}', 'Esta reserva es del 2 al 5 de mayo y tu viaje es del sábado 17 de octubre al domingo 25 de octubre. Revisa que sea la buena'); return true })()`)
    for (const [bloque, sel, nombre] of [['entradas', '[data-entrada-fila]', 'entrada'], ['excursiones', '[data-excursion-fila]', 'excursion'], ['aloj', '[data-blk="aloj"] [data-tarjeta-crema]', 'alojamiento']]) {
      await abrirBloque(bloque)
      const r = await a.evaluar(`(() => { const f = document.querySelector(${JSON.stringify(sel)}); const l = f?.querySelector('[data-aviso-documento="fecha"]'); f?.scrollIntoView({ block: 'center' }); return { fila: Boolean(f), linea: l ? l.innerText.split(String.fromCharCode(10)).join(' | ') : null } })()`)
      console.log('5b', nombre, JSON.stringify(r))
      await a.esp(400)
      await a.captura(png('v52_5b_linea_naranja_' + nombre))
    }
    // [Es correcta] la quita
    await a.evaluar("document.querySelector('[data-aviso-documento-correcta]')?.click(); true")
    await a.esp(500)
    console.log('5b tras [Es correcta], líneas que quedan en esta pantalla:', await a.evaluar("document.querySelectorAll('[data-aviso-documento=\"fecha\"]').length"))
  } finally {
    a.cerrar()
  }
}

// 5c (2) · con cosas ganadas: 1 destino nuevo y 2 países; los números suben y la etiqueta sigue al número (nunca «0 · Destino nuevo» ni «1 · Países nuevos»)
if (toca('5c2')) {
  const c = await abrir()
  const { a } = c
  try {
    await montarHoy(c, 9 * 60 + 30, '')
    await clicTexto(a, '/Dejarlo como está/')
    await a.evaluar("(async () => { (await import('/src/components/logros/momentos/api.ts')).datosDePrueba.resumen = { ok: true, ganado: [], por_categoria: { destino_nuevo: 1, pais: 2, pedazo: 3 }, pendiente: { texto: null }, texto_viaje: '', texto_viaje_tipo: 'con_ganas' }; return true })()")
    await a.evaluar("(async () => { (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI.getState().abrirResumenDia(); return true })()")
    const filas = () => a.evaluar("Array.from(document.querySelectorAll('[aria-label=\"Resumen del día\"] li')).map((l) => l.innerText.split(String.fromCharCode(10)).join(' ').trim()).join(' | ')")
    const t = []
    for (let k = 0; k < 8; k++) { t.push(await filas()); await a.esp(300) }
    console.log('5c2 filas durante la subida:', JSON.stringify(t))
    await a.esp(2500)
    console.log('5c2 filas al acabar:', await filas())
    await a.captura(png('v52_5c_resumen_con_filas'))
  } finally {
    a.cerrar()
  }
}

// 5 · ¿Se PIDE el sonido de «Y además…»? (no se oye nada: se mira la lista de sonidos que la app pide; la comprobación en el iPhone es de Eric)
if (toca('5s')) {
  const c = await abrir()
  const { a } = c
  try {
    await a.evaluar("window.__sonidosPedidos = []; true")
    await a.evaluar("window.__momentos.lanzar('ademas'); true")
    await a.esp(2500)
    console.log('5s «Y además…» en pantalla:', await a.evaluar("Boolean(document.querySelector('[aria-label=\"Y además\"], [data-pantalla=\"ademas\"]')) + ' | ' + (document.querySelector('[role=\"dialog\"]')?.innerText ?? '').split(String.fromCharCode(10)).join(' | ').slice(0, 200)"))
    console.log('5s sonidos pedidos tras salir:', await a.evaluar('JSON.stringify(window.__sonidosPedidos ?? [])'))
    await a.captura(png('v52_5_y_ademas'))
    for (let k = 0; k < 4; k++) {
      await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Seguir|Siguiente|Continuar)$/.test((x.textContent || '').trim())); b?.click(); return Boolean(b) })()")
      await a.esp(1500)
    }
    console.log('5s sonidos pedidos al seguir:', await a.evaluar('JSON.stringify(window.__sonidosPedidos ?? [])'))
  } finally {
    a.cerrar()
  }
}
