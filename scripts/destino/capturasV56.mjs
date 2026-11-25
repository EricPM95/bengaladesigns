// V56: SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV56.mjs [atardecer|ajustes|actividad|vuelves|pueblo|comovas|comovais]
// Guarda docs/dias/V56_capturas/<nombre>.jpg. Lanzarote (atardecer, pueblo) pide la API con DESTINOS_OCULTOS='-'.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V56_capturas')
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
const montarHoy = async ({ a, ev }, min, mut = '', iso = '2026-10-17', modo = 'today') => {
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy2:') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy1:juego:') || k.startsWith('trazo:hoy2b:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}
    st.getState().setDevSimulatedTodayIso('${iso}'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('${modo}')`)
  await a.esp(3500)
  for (let i = 0; i < 3; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Continuar$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const texto = (a, sel) => a.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 500)`)
const cuerpo = (a) => a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 900)")
const sacar = async (a, nombre) => {
  await a.esp(1200)
  await a.captura(png(nombre))
  console.log('captura', nombre)
}
const TODO_HECHO = 'r.days.forEach((d) => d.stops.forEach((s) => { s.checkedInAt = new Date().toISOString() })); window.__pos = null'

// 2. Atardecer en Lanzarote: todo hecho, sin GPS, a las 17:15 → salen los sitios de atardecer cerca de la última parada
if (toca('atardecer')) {
  const c = await abrir({ lanza: true })
  const { a } = c
  try {
    await montarHoy(c, 17 * 60 + 5, TODO_HECHO, '2026-11-09')
    await a.evaluar("(() => { const e = document.querySelector('[data-hoy-atardecer]'); e?.scrollIntoView({ block: 'center' }); return Boolean(e) })()")
    await a.esp(900)
    console.log('atardecer tarjeta', await texto(a, '[data-hoy-atardecer]'))
    console.log('paradas', await a.evaluar(`(async () => JSON.stringify(${R}.getState().route.days.slice(0, 2).map((d) => d.stops.map((s) => s.name + '@' + (s.coordinates ? s.coordinates.lat.toFixed(3) + ',' + s.coordinates.lng.toFixed(3) : '-') + (s.checkedInAt ? '*' : '')))))()`))
    console.log('atardecer sitios', await a.evaluar("document.querySelectorAll('[data-hoy-atardecer] a[href], [data-sitio-atardecer]').length"))
    await sacar(a, '2_atardecer_lanzarote')
  } finally {
    a.cerrar()
  }
}

// 4. País → moneda: Ajustes (México → pesos mexicanos) y una actividad con otra moneda
if (toca('ajustes') || toca('actividad')) {
  const c = await abrir()
  const { a } = c
  try {
    await a.evaluar("import('/src/store/useAjustesUi.ts').then((m) => m.useAjustesUi.getState().abrir('ajustes')).then(() => true)")
    for (let i = 0; i < 40 && !(await a.evaluar("Boolean(document.querySelector('[data-ajuste=\"pais-vive\"]'))")); i++) await a.esp(300)
    console.log('ajustes antes', await texto(a, '[data-ajuste="moneda"]'))
    await clic(a, '[data-ajuste="pais-vive"]')
    await a.esp(900)
    await clic(a, '[data-opcion-hoja="pais-MX"]')
    await a.esp(2500)
    console.log('ajustes pais', await texto(a, '[data-ajuste="pais-vive"]'), '| moneda', await texto(a, '[data-ajuste="moneda"]'))
    if (toca('ajustes')) await sacar(a, '4_ajustes_mexico_pesos')
    if (toca('actividad')) {
      await a.evaluar("import('/src/store/useAjustesUi.ts').then((m) => m.useAjustesUi.getState().cerrar?.()).then(() => true)")
      await a.esp(500)
      await a.evaluar(`(async () => { const st = ${R}; st.setState({ screen: 'route' }); st.getState().setMode('route'); return true })()`)
      await a.esp(2500)
      console.log('tarjeta ciudad', await clic(a, 'button.w-full.items-center.text-left'))
      for (let i = 0; i < 60 && !(await a.evaluar("Boolean(document.querySelector('[data-precio-actividad]'))")); i++) await a.esp(500)
      console.log('precios', await a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-precio-actividad]')).map((e) => e.innerText.replace(/\\s+/g, ' ')))"))
      await a.evaluar("(() => { const e = document.querySelector('[data-actividad]'); e?.scrollIntoView({ block: 'center', inline: 'center' }); return Boolean(e) })()")
      await sacar(a, '4_actividad_otra_moneda')
    }
  } finally {
    a.cerrar()
  }
}

// 6. «Hoy vuelves a casa»: viaje a mano con el último día en blanco (DÍAS)
if (toca('vuelves')) {
  const c = await abrir()
  const { a } = c
  try {
    await montarHoy(c, 10 * 60, "r.planMode = 'manual'; const U = r.days[r.days.length - 1]; U.stops = []; U.meals = []; delete U.isReturnLeg; delete U.curatedTitle; delete U.nameByUser; U.dayType = 'manual'; U.porOrganizar = true; U.userAdded = false", '2026-10-10', 'days')
    await a.esp(1500)
    console.log('dias', await cuerpo(a))
    await sacar(a, '6_hoy_vuelves_a_casa')
  } finally {
    a.cerrar()
  }
}

// 9. Un pueblo de Lanzarote (Teguise, domingo 8-nov a las 15:30): nada de «Cerrado» ni «Ya ha cerrado»
if (toca('pueblo')) {
  const c = await abrir({ lanza: true })
  const { a } = c
  try {
    await montarHoy(c, 15 * 60 + 30, "const k = r.days.findIndex((d) => d.stops.some((s) => /Teguise/i.test(s.name))); window.__kT = k; if (k >= 0) { const d = r.days[k]; d.stops.forEach((s) => { if (!/Teguise/i.test(s.name)) s.checkedInAt = new Date().toISOString() }) }; window.__pos = null", '2026-11-08')
    await clicTexto(a, /Dejarlo como está/)
    await a.esp(1500)
    console.log('dia con Teguise', await a.evaluar('window.__kT'), 'hoy', await a.evaluar(`${R}.getState().route.days.map((d) => d.stops.map((s) => s.name).join('/')).join(' || ').slice(0, 400)`).catch(() => ''))
    console.log('texto', await cuerpo(a))
    console.log('cerrado?', await a.evaluar("/cerrad|Ya ha cerrado/i.test(document.body.innerText)"))
    await sacar(a, '9_pueblo_lanzarote_hoy')
  } finally {
    a.cerrar()
  }
}

// 10. «¿Cómo vas?» (solo) y «¿Cómo vais?» (con más personas unidas)
if (toca('comovas') || toca('comovais')) {
  for (const grupo of [false, true]) {
    if (!toca(grupo ? 'comovais' : 'comovas')) continue
    const c = await abrir()
    const { a } = c
    try {
      if (grupo) await a.evaluar("(async () => { (await import('/src/store/useViajeCompartido.ts')).useViajeCompartido.getState().poner({ gente: [{ id: 'yo', nombre: 'Eric', foto: null, esAdmin: true, esYo: true, permiso: 'admin' }, { id: 'ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' }] }); return true })()")
      await montarHoy(c, 15 * 60 + 40, "const d0 = r.days.find((d) => !d.isReturnLeg); d0.stops.filter((s) => !s.isArrival).slice(0, 2).forEach((s) => { s.checkedInAt = new Date().toISOString() }); window.__pos = null")
      await clicTexto(a, /Dejarlo como está/)
      await a.esp(2000)
      console.log('hora de comer?', await a.evaluar("/Hora de comer|Es hora de comer/.test(document.body.innerText)"))
      console.log('comida', await a.evaluar(`(async () => JSON.stringify(${R}.getState().route.days[0].meals.map((m) => m.mealTime + '@' + m.time)))()`), 'avisos', await a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-aviso-hoy],[data-hoy-aviso]')).map((e) => e.innerText.slice(0, 40)))"))
      console.log(grupo ? 'vais' : 'vas', await texto(a, '[data-hoy-como-vais]'))
      await a.evaluar("(() => { const e = document.querySelector('[data-hoy-como-vais]'); e?.scrollIntoView({ block: 'center' }); return Boolean(e) })()")
      await sacar(a, grupo ? '10_como_vais_grupo' : '10_como_vas_solo')
    } finally {
      a.cerrar()
    }
  }
}
