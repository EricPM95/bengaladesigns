// FINDE, Paso 4 (App rápida): mide en modo iPhone (390 px) con red 4G simulada cuánto tarda en abrirse la app, cada pestaña, el Perfil, los logros, Ajustes y las hojas más usadas,
// y comprueba que las hojas de invitar, pago, propuestas, Ajustes, la ficha en grande de logros y «+ Añadir una reserva» abren bien (con capturas).
//
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/medirFindePaso4.mjs fase=antes|despues [capturas=1] [solo=texto]
//
//   · Usa el Vite y la API que ya estén en marcha (NO abre otros). UN solo Chrome de prueba, que se cierra al acabar.
//   · Sin Supabase de producción (abrirApp lo bloquea) y con el modo demo de los logros (?logrosDemo=1: el servidor es de mentira).
//   · Red simulada: 9 Mb/s de bajada, 1,5 Mb/s de subida y 60 ms de latencia (el «Fast 4G» de Chrome). CPU sin frenar (el PC va cargado: se dice en el informe).
//   · Cada fila da: «marca» = ms hasta que sale lo que se espera ver; «quieto» = ms hasta que dejan de llegar peticiones y de cambiar el DOM; peticiones y KB bajados.
//     Se mide DOS veces cada cosa: la 1.ª vez (lo perezoso aún sin bajar) y la 2.ª (ya en el móvil). Lo que pesa es la 1.ª.
//   · Guarda docs/dias/_finde_paso4_<fase>.json; el informe (docs/dias/INFORME_FINDE_PASO4.md) sale de ahí.
//   · NOTA: en desarrollo el Vite sirve cada archivo suelto (cientos de peticiones): los tiempos son mayores que los de producción, pero la COMPARACIÓN antes/después es válida. El peso de arranque
//     de producción (tope 340 KB comprimido) lo mide pruebaPantallas8b con un build recién hecho.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const arg = (n, d) => (process.argv.find((a) => a.startsWith(n + '=')) ?? `${n}=${d}`).split('=')[1]
const FASE = arg('fase', 'antes')
// invitado=1: segunda pasada, solo la hoja de propuestas (hace falta ser «invitado que recomienda» desde que carga la página).
const INVITADO = arg('invitado', '0') === '1'
const CAPTURAS = arg('capturas', '0') === '1'
const SOLO = arg('solo', '')
const CAP = path.resolve('docs/dias/FINDE_capturas')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa'
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const RED = { offline: false, latency: 60, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 }

const filas = []
const comprobaciones = []
const a = await abrirApp(APP, { ruta: RUTA, antes: (INVITADO ? "try{sessionStorage.setItem('trazo:invitado','1');sessionStorage.setItem('trazo:permiso','recomendar')}catch(e){};" : '') + ANTES, ancho: 390, alto: 844 })

// Un Runtime.evaluate que coincide con una navegación no contesta nunca: se le pone un tope (las acciones largas, como abrir el Perfil, llevan su propia espera dentro, de hasta 20 s).
const evaluarOriginal = a.evaluar
a.evaluar = (js) => Promise.race([evaluarOriginal(js), new Promise((_, no) => setTimeout(() => no(new Error('evaluar: sin respuesta en 30 s')), 30000))])

/* ── Contadores de red (CDP) ── */
let enVuelo = 0
const tam0 = null
let ultimaRed = 0
let peticiones = 0
let bytes = 0
const tam = new Map()
let grandes = []
/** Peticiones en vuelo que llevan menos de 8 s (una que lleva más es una conexión larga, como un aviso en directo: no cuenta como «sin acabar»). */
const activas = () => Array.from(tam.values()).filter((x) => Date.now() - x.t < 8000).length
a.escuchar((d) => {
  if (d.method === 'Network.requestWillBeSent') {
    const u = d.params.request.url
    if (u.startsWith('data:') || u.startsWith('blob:')) return
    enVuelo++
    peticiones++
    ultimaRed = Date.now()
    tam.set(d.params.requestId, { u, t: Date.now() })
  } else if (d.method === 'Network.loadingFinished' || d.method === 'Network.loadingFailed') {
    if (!tam.has(d.params.requestId)) return
    const info = tam.get(d.params.requestId)
    if (d.method === 'Network.loadingFinished') grandes.push({ u: info.u.replace(new RegExp('^https?://[^/]+'), '').slice(0, 110), kb: Math.round((d.params.encodedDataLength ?? 0) / 1024) })
    tam.delete(d.params.requestId)
    enVuelo = Math.max(0, enVuelo - 1)
    ultimaRed = Date.now()
    if (d.method === 'Network.loadingFinished') bytes += d.params.encodedDataLength ?? 0
  }
})
const ev = (js) => a.evaluar(`(async () => (${js}))()`)

async function instalarObservador() {
  await a.evaluar(`(() => { if (window.__obsQ) return true; window.__ultCambio = Date.now(); new MutationObserver((ms) => { if (ms.some((m) => Array.from(m.addedNodes).some((n) => n.nodeType === 1))) window.__ultCambio = Date.now() }).observe(document.documentElement, { childList: true, subtree: true }); window.__obsQ = true; return true })()`)
}

/** Mide `accion` (JS que se evalúa en la página) hasta que `marca` (JS booleano) es verdad y hasta que todo queda quieto. */
async function medir(nombre, grupo, accion, marca, { tope = 25000, captura = null } = {}) {
  if (SOLO && !nombre.toLowerCase().includes(SOLO.toLowerCase())) return null
  await instalarObservador()
  peticiones = 0
  bytes = 0
  grandes = []
  const t0 = Date.now()
  ultimaRed = t0
  await a.evaluar(`window.__ultCambio = Date.now(); true`)
  try {
    await a.evaluar(`(async () => { ${accion} ; return true })()`)
  } catch (e) {
    filas.push({ grupo, nombre, error: String(e.message ?? e).slice(0, 160) })
    console.log(`  ERROR ${nombre}: ${String(e.message ?? e).slice(0, 120)}`)
    return null
  }
  let tMarca = null
  let quieto = null
  while (Date.now() - t0 < tope) {
    const ahora = Date.now()
    if (tMarca == null && (await a.evaluar(`Boolean(${marca})`).catch(() => false))) tMarca = Date.now() - t0
    const ultDom = await a.evaluar('window.__ultCambio').catch(() => ahora)
    const ultima = Math.max(ultimaRed, ultDom)
    if (tMarca != null && activas() === 0 && ahora - ultima > 700) {
      quieto = Math.max(tMarca, ultima - t0)
      break
    }
    await a.esp(100)
  }
  const fila = { grupo, nombre, marca_ms: tMarca, quieto_ms: quieto ?? (tMarca == null ? null : tope), peticiones, kb: Math.round(bytes / 1024), mayores: grandes.sort((x, y) => y.kb - x.kb).slice(0, 6) }
  filas.push(fila)
  console.log(`  ${nombre.padEnd(44)} marca ${String(tMarca ?? 'NO SALE').padStart(6)} ms · quieto ${String(fila.quieto_ms ?? '-').padStart(6)} ms · ${peticiones} peticiones · ${fila.kb} KB`)
  if (captura && CAPTURAS) await a.captura(`${CAP}/${captura}.jpg`, 70)
  return fila
}

const clic = (sel) => `{ const b = document.querySelector(${JSON.stringify(sel)}); if (!b) throw new Error('no está ${sel.replace(/'/g, '')}'); b.click() }`
const clicTexto = (re) => `{ const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || x.getAttribute('aria-label') || '').trim())); if (!b) throw new Error('no hay botón ${re}'); b.click() }`
const importar = (m) => `(await import('${m}'))`
const cerrarTodo = async () => {
  await a.evaluar(`(async () => {
    try { ${importar('/src/store/usePerfilUi.ts')}.usePerfilUi.getState().cerrar() } catch {}
    try { ${importar('/src/store/useAjustesUi.ts')}.useAjustesUi.getState().cerrar() } catch {}
    try { ${importar('/src/store/usePagoStore.ts')}.usePagoStore.getState().cerrar() } catch {}
    try { ${importar('/src/store/useAnadirReservaStore.ts')}.useAnadirReservaStore.getState().cerrar() } catch {}
    try { ${importar('/src/store/usePropuestaStore.ts')}.usePropuestaStore.getState().verLista(false) } catch {}
    try { const m = ${importar('/src/components/logros/momentos/useMomentosUI.ts')}.useMomentosUI.getState(); m.cerrarHojaLogros?.() } catch {}
    try { ${importar('/src/store/useAvisosStore.ts')}.useAvisosStore.getState().cerrar() } catch {}
    return true })()`).catch(() => undefined)
  await a.esp(900)
}
/** Cada cosa dos veces: 1.ª (perezoso sin bajar) y 2.ª (ya en el móvil). */
async function dosVeces(nombre, grupo, abrir, marca, cerrar, opciones = {}) {
  await medir(`${nombre} · 1.ª vez`, grupo, abrir, marca, { ...opciones, captura: opciones.captura ?? null })
  await cerrar()
  await medir(`${nombre} · 2.ª vez`, grupo, abrir, marca, {})
  await cerrar()
}

try {
  /* ── 1. La app: carga de arranque (sin caché, red 4G) ── */
  console.log('1. Arranque (sin caché, 4G)')
  await a.cdp('Network.setCacheDisabled', { cacheDisabled: true })
  await a.cdp('Network.emulateNetworkConditions', RED)
  peticiones = 0
  bytes = 0
  const t0 = Date.now()
  ultimaRed = t0
  await a.cdp('Page.navigate', { url: `${APP}${RUTA}` })
  let tPrimera = null
  let tApp = null
  while (Date.now() - t0 < 120000) {
    if (tPrimera == null && (await a.evaluar(`Boolean(document.querySelector('[data-primera-pantalla]'))`).catch(() => false))) tPrimera = Date.now() - t0
    if (tApp == null && (await a.evaluar(`typeof window.__rutaPrueba === 'function'`).catch(() => false))) tApp = Date.now() - t0
    if (tPrimera != null && tApp != null && activas() === 0 && Date.now() - ultimaRed > 800) break
    await a.esp(150)
  }
  filas.push({ grupo: 'Arranque', nombre: 'Abrir la app hasta la primera pantalla (sin caché)', marca_ms: tPrimera, quieto_ms: Math.max(tPrimera ?? 0, ultimaRed - t0), peticiones, kb: Math.round(bytes / 1024) })
  console.log(`  primera pantalla ${tPrimera} ms · quieto ${ultimaRed - t0} ms · ${peticiones} peticiones · ${Math.round(bytes / 1024)} KB`)
  if (CAPTURAS) await a.captura(`${CAP}/00_arranque.jpg`, 70)
  // Segunda apertura, con la caché del navegador (el viajero que vuelve).
  await a.cdp('Network.setCacheDisabled', { cacheDisabled: false })
  peticiones = 0
  bytes = 0
  const t1 = Date.now()
  ultimaRed = t1
  await a.cdp('Page.navigate', { url: `${APP}${RUTA}` })
  let tP2 = null
  while (Date.now() - t1 < 120000) {
    if (tP2 == null && (await a.evaluar(`Boolean(document.querySelector('[data-primera-pantalla]'))`).catch(() => false))) tP2 = Date.now() - t1
    if (tP2 != null && activas() === 0 && Date.now() - ultimaRed > 800) break
    await a.esp(150)
  }
  filas.push({ grupo: 'Arranque', nombre: 'Abrir la app hasta la primera pantalla (con caché)', marca_ms: tP2, quieto_ms: Math.max(tP2 ?? 0, ultimaRed - t1), peticiones, kb: Math.round(bytes / 1024) })
  console.log(`  con caché: primera pantalla ${tP2} ms · ${peticiones} peticiones · ${Math.round(bytes / 1024)} KB`)

  /* ── 2. El viaje de prueba (sin red frenada, como en las otras pruebas) ── */
  await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  for (let i = 0; i < 480 && !(await a.evaluar(`typeof window.__rutaPrueba === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Continuar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const info = await ev(`(async () => {
    const st = ${R}; const r = st.getState().route
    const d = r.days.find((x) => !x.isReturnLeg && x.dayType !== 'excursion' && x.dayNumber > 1 && x.stops.filter((s) => s.time && !s.isArrival && !s.isBreak).length >= 2)
    const iso = new Date(new Date((r.answers?.dateRange?.start ?? '2026-10-17') + 'T12:00:00Z').getTime() + (d.dayNumber - 1) * 86400000).toISOString().slice(0, 10)
    window.__horaFalsa = 10 * 60; window.__pos = null; window.__perm = 'denied'
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    st.getState().setDevSimulatedTodayIso(iso)
    st.getState().setActiveDayId(null); st.getState().setMode('route')
    return { dayId: d.id, dayNumber: d.dayNumber, iso, destino: r.destination }
  })()`)
  console.log(`2. Viaje de prueba listo (${info.destino}, día ${info.dayNumber})`)
  await a.esp(3000)
  await a.cdp('Network.setCacheDisabled', { cacheDisabled: false })
  await a.cdp('Network.emulateNetworkConditions', RED)

  if (!INVITADO) {
  /* ── 3. Pestañas ── */
  console.log('3. Pestañas (4G)')
  const pest = [['Hoy', 'HOY', '[data-hoy], [data-blk], main'], ['Ruta', 'RUTA', 'main'], ['Días', 'DÍAS', 'main'], ['Explorar', 'EXPLORAR', 'main'], ['Reservas', 'RESERVAS', '[data-blk="resumen"]']]
  const ir = (nombre) => `{ const b = document.querySelector('nav[aria-label="Barra del viaje"] button[aria-label^="${nombre}"]'); if (!b) throw new Error('sin pestaña ${nombre}'); b.click() }`
  // Cada pestaña se mide viniendo de otra distinta; el marcador es que su botón quede «activo» y que el contenido tenga texto propio.
  const marcas = {
    Hoy: `document.querySelector('nav[aria-label="Barra del viaje"] button[aria-label^="Hoy"]')?.getAttribute('aria-current') === 'page' && !document.querySelector('[aria-label="Cargando"]') && document.body.innerText.length > 300`,
    Ruta: `document.querySelector('nav[aria-label="Barra del viaje"] button[aria-label^="Ruta"]')?.getAttribute('aria-current') === 'page' && !document.querySelector('[aria-label="Cargando"]') && document.body.innerText.length > 200`,
    Días: `document.querySelector('nav[aria-label="Barra del viaje"] button[aria-label^="Días"]')?.getAttribute('aria-current') === 'page' && !document.querySelector('[aria-label="Cargando"]') && document.body.innerText.length > 300`,
        Explorar: `document.querySelector('nav[aria-label="Barra del viaje"] button[aria-label^="Explorar"]')?.getAttribute('aria-current') === 'page' && document.body.innerText.includes('Atracciones')`,
    Reservas: `document.querySelector('nav[aria-label="Barra del viaje"] button[aria-label^="Reservas"]')?.getAttribute('aria-current') === 'page' && document.querySelector('[data-blk="resumen"], [data-anadir-una-reserva]')`,
  }
  const base = 'Ruta'
  for (const [nombre, grupo] of pest) {
    if (nombre === base) continue
    await medir(`Pestaña ${grupo} · 1.ª vez`, 'Pestañas', ir(nombre), marcas[nombre], { captura: CAPTURAS ? `pestana_${nombre}` : null })
    await a.evaluar(`(async () => { ${ir(base)}; return true })()`)
    await a.esp(1500)
    await medir(`Pestaña ${grupo} · 2.ª vez`, 'Pestañas', ir(nombre), marcas[nombre])
    await a.evaluar(`(async () => { ${ir(base)}; return true })()`)
    await a.esp(1500)
  }
  // Ruta, viniendo de Reservas.
  await a.evaluar(`(async () => { ${ir('Reservas')}; return true })()`)
  await a.esp(2500)
  await medir('Pestaña RUTA · 2.ª vez (desde RESERVAS)', 'Pestañas', ir('Ruta'), marcas.Ruta)

  /* ── 4. Perfil, logros, Ajustes ── */
  console.log('4. Perfil, logros y Ajustes (4G)')
  await dosVeces('Perfil (Mis viajes)', 'Perfil, logros, Ajustes', clic('[data-boton-perfil]'), `document.querySelector('[role="dialog"], [data-perfil-hoja], [data-hoja]') && document.body.innerText.includes('viajes')`, cerrarTodo, { captura: 'perfil' })
  await dosVeces('Hoja de logros (botón flotante)', 'Perfil, logros, Ajustes', clic('[data-boton-logros]'), `document.querySelector('[data-hoja-logros]') && !document.querySelector('[data-logros-cargando]')`, cerrarTodo, { captura: 'logros' })
  await dosVeces('Ajustes', 'Perfil, logros, Ajustes', `(await import('/src/store/useAjustesUi.ts')).useAjustesUi.getState().abrir('ajustes')`, `document.querySelector('[data-borrar-cuenta]')`, cerrarTodo, { captura: 'ajustes' })
  await dosVeces('Campana de avisos', 'Perfil, logros, Ajustes', `document.querySelector('button[title="Avisos"]').click()`, `document.querySelector('[role="dialog"]') || document.body.innerText.includes('Avisos')`, cerrarTodo)

  /* ── 5. Hojas ── */
  console.log('5. Hojas (4G)')
  await a.evaluar(`(async () => { ${ir('Reservas')}; return true })()`)
  await a.esp(2500)
  await dosVeces('«+ Añadir una reserva»', 'Hojas', clic('[data-anadir-una-reserva]'), `document.querySelector('[data-hoja-anade-reserva]')`, cerrarTodo, { captura: 'anadir_reserva' })
  await dosVeces('Hoja de un ferry (formulario)', 'Hojas', `(await import('/src/store/useAnadirReservaStore.ts')).useAnadirReservaStore.getState().abrirFormulario('ferry')`, `document.querySelector('[role="dialog"], [data-hoja]') && document.body.innerText.length > 100`, cerrarTodo)
  await dosVeces('Hoja de invitar (viaje)', 'Hojas', `(await import('/src/store/usePagoStore.ts')).usePagoStore.getState().abrir({ tipo: 'invitar', modo: 'viaje', destino: 'Roma', tripId: 'trip-de-prueba', pase: null })`, `document.querySelector('[role="dialog"], [data-hoja-invitar], [data-hoja]')`, cerrarTodo, { captura: 'invitar' })
  await dosVeces('Hoja de pago (compra del pase)', 'Hojas', `(await import('/src/store/usePagoStore.ts')).usePagoStore.getState().abrir({ tipo: 'compra', destino: 'Roma', tripId: null })`, `document.querySelector('[role="dialog"], [data-hoja-compra], [data-hoja]')`, cerrarTodo, { captura: 'pago' })
  // La ficha de una parada en DÍAS (la hoja que más se abre).
  await a.evaluar(`(async () => { ${ir('Días')}; return true })()`)
  await a.esp(2500)
  await dosVeces('Día abierto en DÍAS', 'Hojas', `{ const st = ${R}; st.getState().setActiveDayId(${JSON.stringify(info.dayId)}) }`, `document.body.innerText.length > 500 && document.querySelector('[data-parada], [data-stop], [data-tarjeta-parada], button')`, async () => { await a.evaluar(`(async () => { ${R}.getState().setActiveDayId(null); return true })()`); await a.esp(800) })

  /* ── 6. La ficha en grande de los logros (Perfil → Todos mis logros → una ficha) ── */
  console.log('6. Ficha en grande de logros (4G)')
  await a.evaluar(`(async () => { ${ir('Ruta')}; return true })()`)
  await a.esp(1200)
  await dosVeces('Ficha grande de un logro (Todos mis logros → una ficha)', 'Perfil, logros, Ajustes', `{
    (await import('/src/components/logros/pantallas/useLogrosPantallas.ts')).useLogrosPantallas.getState().abrir({ t: 'todos', pestana: 'todos' })
    for (let i = 0; i < 100 && !document.querySelector('[data-fila] button, [data-tarjeta-de-viajero], [data-tarjeta-de-destino]'); i++) await new Promise((r) => setTimeout(r, 200))
    const t = document.querySelector('[data-tarjeta-de-viajero] , [data-fila]'); const b = t && (t.matches('button') ? t : t.querySelector('button') ?? t); b && b.click()
  }`, `document.querySelector('[data-ficha]')`, async () => { await a.evaluar(`(async () => { (await import('/src/components/logros/pantallas/useLogrosPantallas.ts')).useLogrosPantallas.getState().cerrarTodo(); return true })()`).catch(() => undefined); await a.esp(800) }, { captura: 'ficha_grande' })
  } // fin de !INVITADO
  /* ── 7. La hoja de propuestas de quien solo recomienda (invitado fingido, antes de empezar el viaje; segunda pasada: `invitado=1`) ── */
  if (INVITADO) {
  console.log('7. Hoja de propuestas (invitado, 4G)')
  await a.evaluar(`(async () => { ${R}.getState().setDevSimulatedTodayIso('2026-01-01'); return true })()`)
  await a.hasta("window.__propuesta && window.__propuesta.getState().activa", { segundos: 20 })
  // Una hoja de propuesta sin cambios se cierra sola (a propósito): se quita una parada del día 2 para que haya una propuesta que ver.
  await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === 2); const k = d.stops.findIndex((x) => !x.isArrival && !x.isBreak); st.getState().removeStop(d.id, d.stops[k].id); return true })()`)
  await a.esp(1500)
  await dosVeces('Hoja de propuestas (viajero)', 'Hojas', `(await import('/src/store/usePropuestaStore.ts')).usePropuestaStore.getState().verLista(true)`, `document.querySelector('[data-hoja="propuesta"]')`, async () => { await a.evaluar(`(async () => { (await import('/src/store/usePropuestaStore.ts')).usePropuestaStore.getState().verLista(false); return true })()`).catch(() => undefined); await a.esp(800) }, { captura: 'propuestas' })
  await cerrarTodo()
  }
} catch (e) {
  console.log('ERROR en la medición:', e?.message ?? e)
  filas.push({ grupo: 'ERROR', nombre: String(e?.message ?? e).slice(0, 200) })
} finally {
  a.cerrar()
}
fs.writeFileSync(`docs/dias/_finde_paso4_${FASE}${INVITADO ? '_invitado' : ''}.json`, JSON.stringify({ fase: FASE, fecha: new Date().toISOString(), red: RED, filas }, null, 2))
console.log(`\nGuardado docs/dias/_finde_paso4_${FASE}.json (${filas.length} filas)`)
process.exit(0)
