// V44 (24-nov-2026): lo que Eric vio en el móvil tras la V43. Hace falta el Vite estable (5173) y la API (8787) YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV44.mjs
// Un solo Chrome, que se cierra al acabar. Capturas 390x844 en docs/dias/V44_capturas/.
//  1. Sin navegador: la zona de ubicación (en la ruta / en el destino pero lejos / fuera / sin), las frases «Del alojamiento al Coliseo», lo escrito (avisos con Deshacer, «Activa tu ubicación» sin pasos, textos nuevos).
//  2. En pantalla (viaje de pruebas de Roma, hora simulada): con la ubicación en Barcelona nada se va a pendientes, sale «—» y «Estás lejos» y ninguna cifra pasa de un día; en el aeropuerto, el tiempo del plan;
//     en la ruta, «Desde ti» y [Actualizar]; cada cambio de la ruta da [Deshacer] abajo; ninguna franja fuera de la tarjeta; el globo grande abre la página encima.
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'esbuild'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const CAP = path.resolve('docs/dias/V44_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}

/* ───────────── 1. Sin navegador ───────────── */
console.log('1. La zona de ubicación y lo escrito (sin navegador)')
{
  const U = await cargar('src/lib/ubicacionHoy.ts')
  const st = (id, lat, lng) => ({ id, name: id, time: '09:00', durationMinutes: 60, coordinates: { lat, lng }, description: '', photoUrl: '' })
  const coliseo = st('Coliseo', 41.8902, 12.4922)
  const route = { days: [{ id: 'd1', dayNumber: 1, stops: [coliseo, st('Panteon', 41.8986, 12.4769)] }] }
  const zona = (ubicacion) => U.zonaDeUbicacion({ ubicacion, route, referencia: coliseo, enCoche: false })
  debe(zona({ lat: 41.3874, lng: 2.1686 }) === 'fuera', 'zona', 'Barcelona con el viaje en Roma: fuera del destino (más de 50 km)')
  debe(zona({ lat: 41.8003, lng: 12.2389 }) === 'destino', 'zona', 'el aeropuerto de Fiumicino: en el destino pero lejos de la ruta')
  debe(zona({ lat: 41.8905, lng: 12.4925 }) === 'ruta', 'zona', 'junto al Coliseo: en la ruta')
  debe(zona(null) === 'sin', 'zona', 'sin ubicación: sin')
  debe(U.aDestino('Coliseo') === 'al Coliseo' && U.aDestino('Fontana de Trevi') === 'a la Fontana de Trevi' && U.aDestino('Museos Vaticanos') === 'a los Museos Vaticanos', 'frases', 'al Coliseo · a la Fontana de Trevi · a los Museos Vaticanos')
  debe(U.deDondeADonde(null, 'Coliseo') === 'Del alojamiento al Coliseo' && U.deDondeADonde('Panteón', 'Fontana de Trevi') === 'Del Panteón a la Fontana de Trevi', 'frases', '«Del alojamiento al Coliseo» y «Del Panteón a la Fontana de Trevi»')
}
{
  const ubi = leer('src/components/route/hoy/v2/HojaActivaUbicacion.tsx')
  debe(/Para ver lo que tienes cerca, Jutrip necesita tu ubicación\. Actívala en los ajustes de tu móvil o de tu navegador: solo se usa mientras usas la app\./.test(ubi) && /Entendido/.test(ubi) && !/«aA»|Ajustes del sitio web|Safari \(iPhone\)/.test(sinComentarios(ubi)), 'activa', '«Activa tu ubicación» sin pasos y con [Entendido]')
  const hoy = sinComentarios(leer('src/components/route/hoy/v2/HoyDuranteV2.tsx'))
  debe(/avisarAbajo\(\{ id: `saltada:\$\{stop\.id\}`, texto, accion: \{ etiqueta: 'Deshacer'/.test(hoy), 'avisos', 'saltar() da su aviso CON [Deshacer]')
  debe(/Han cerrado/.test(hoy), 'avisos', 'al saltar mira todo el día: «Han cerrado…» en plural, en un solo aviso')
  const pend = sinComentarios(leer('src/components/route/hoy/v2/LugaresPendientes.tsx'))
  debe((pend.match(/conDeshacer\(/g) ?? []).length >= 5 && /HojaDelMenu/.test(pend) && /OpcionTarjeta/.test(pend), 'avisos', 'recuperar, ya lo visité, quitar, pasar y pasar todos dan [Deshacer] (y el «···» usa la pieza de DÍAS)')
  const store = sinComentarios(leer('src/store/useAvisoDeAbajo.ts'))
  debe(/!actual\.accion && !a\.accion/.test(store), 'avisos', 'juntar es SOLO para los de arriba (los dos sin [Deshacer])')
  const extra = leer('src/components/route/freeDay/ExtraDaySheet.tsx')
  debe(/A partir de aquí, el viaje lo eliges tú: monta cada día a tu gusto\./.test(extra), 'dias', 'ExtraDaySheet: el texto nuevo')
  const dia = sinComentarios(leer('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(/const sinComidas = freeDay \|\| Boolean\(day\.beyondAutoDays \|\| day\.userAdded\)/.test(dia) && /lunchInsertionIndex === index && !sinComidas/.test(dia) && /dinnerInsertionIndex === index && !sinComidas/.test(dia), 'dias', 'un día montado por el viajero nunca lleva «Hora de comer» ni «Hora de cenar»')
  debe(/data-elegir-mis-sitios/.test(dia) && !/tú decides\. Añade las paradas/.test(dia), 'dias', 'el día en blanco más allá de los escritos: solo [Elegir mis sitios]')
  const globo = leer('src/components/primeraVez/GloboDeDestinos.tsx')
  debe(/zIndex: paginaAbierta \? 70 : 90/.test(globo), 'globo', 'el globo baja por debajo de la página (z-80) mientras está abierta')
  const conector = leer('src/components/route/dayDetail/StopConnector.tsx')
  debe(/max-\[430px\]:-ml-\[9px\]/.test(conector), 'franjas', 'la franja blanca mide 9 px en el móvil')
  const tit = leer('src/lib/tituloDelDia.ts')
  debe(/day\.beyondAutoDays === true\) return/.test(tit), 'dias', '«Día por organizar» también para el día en blanco más allá de los escritos')
  const comer = sinComentarios(leer('src/components/route/hoy/v2/ComerAhora.tsx'))
  debe(/Desayunar cerca de ti/.test(comer) && /Comer cerca de ti/.test(comer) && /Cenar cerca de ti/.test(comer) && /No tienes la ubicación activada/.test(comer) && /A esta hora aún no han abierto\. Los más cercanos:/.test(comer) && /Ver todos en Explorar/.test(comer), 'comer', 'los títulos por hora, «No tienes la ubicación activada», «A esta hora aún no han abierto» y [Ver todos en Explorar]')
  const menu = sinComentarios(leer('src/components/route/hoy/v2/CambiarPlan.tsx'))
  debe(/Quiero comer ahora/.test(menu), 'comer', 'en el menú de «Cambiar plan» sigue siendo «Quiero comer ahora»')
}

/* ───────────── 2. En pantalla ───────────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('2. (SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la V44: ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('2. En la app (Roma, hora simulada)')
const ANTES = leer('scripts/destino/pruebaV43.mjs').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho: 390, alto: 844 })
const ev = (expr) => a.evaluar('(async () => (' + expr + '))()')
const hay = (sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const txt = (sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const clic = (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const cerrarModales = async () => {
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Siguiente|Empezar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }
}
let nSec = 0
const sec = async (fn) => {
  nSec++
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `la prueba se ha parado en la parte ${nSec}: ${String(e?.message ?? e).slice(0, 400)}`)
  }
}
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  await cerrarModales()
  const BARCELONA = { lat: 41.3874, lng: 2.1686 }
  const AEROPUERTO = { lat: 41.8003, lng: 12.2389 }
  const montar = async (min, pos, mut = '') => {
    await a.evaluar(`(async () => {
      const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
      r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
      ${mut}
      st.setState({ route: r, screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); localStorage.setItem('jutrip:avisos-dichos:' + r.id + ':2026-10-17', JSON.stringify(['ya-no-da-tiempo'])) } catch {}
      try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
      try { (await import('/src/store/useAvisoDeAbajo.ts')).useAvisoDeAbajo.getState().vaciar() } catch {}
      window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${pos ? "'granted'" : "'denied'"}
      st.getState().setDevSimulatedTodayIso('2026-10-17'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3200)
    await cerrarModales()
  }

  await sec(async () => {
    // Barcelona: nada a pendientes, «—» y «Estás lejos», ninguna cifra de más de un día
    await montar(8 * 60 + 30, BARCELONA)
    debe(!(await hay('[data-hoy-pendientes]')), 'lejos', 'con la ubicación en Barcelona y el viaje en Roma, NADA se va a «Lugares pendientes» (a las 8:30)')
    const caja = await txt('[data-hoy-trayecto]')
    debe(/—/.test(caja ?? '') && /Estás lejos/.test(caja ?? ''), 'lejos', `la caja dice «—» y «Estás lejos» (${caja})`)
    const todo = (await a.evaluar('document.body.innerText')) ?? ''
    const cifras = [...todo.matchAll(/(\d[\d.]*)\s*min\b/g)].map((m) => Number(m[1].replace(/\./g, ''))).filter((n) => n > 1440)
    debe(cifras.length === 0, 'lejos', `ninguna cifra de más de un día en pantalla (${cifras.join(', ') || 'ninguna'})`)
    debe((await txt('[data-hoy-lejos]'))?.includes('Estás lejos de Roma. Cuando llegues, contaremos desde donde estés.') ?? false, 'lejos', 'el recuadro «Estás lejos de Roma. Cuando llegues, contaremos desde donde estés.»')
    debe(!(await hay('[data-hoy-ya-he-llegado]')) && !(await hay('[data-hoy-usar-ubicacion]')) && !(await hay('[data-hoy-actualizar-ubicacion]')), 'lejos', 'sin botones y sin [Ya he llegado]')
    await a.captura(png('v44_lejos'))
  })

  await sec(async () => {
    // El aeropuerto: el tiempo del plan, de dónde a dónde
    // (la 2.ª parada: con la 1.ª ya vista, el tiempo del plan es «De la 1.ª a la 2.ª»; la primera del día cuenta desde el alojamiento si se sabe dónde está)
    await montar(9 * 60, AEROPUERTO, "const v = r.days[0].stops.filter((s) => !s.isBreak && !s.isArrival); if (v[0]) v[0].checkedInAt = '2026-10-17T08:30:00Z';")
    const caja = (await txt('[data-hoy-trayecto]')) ?? ''
    debe(/\d+ min/.test(caja) && /Desde (el|la|los|las) /.test(caja) && !/Desde ti/.test(caja), 'aeropuerto', `en el aeropuerto, el tiempo del plan «Desde …» (${caja})`)
    debe(!(await hay('[data-hoy-pendientes]')), 'aeropuerto', 'y nada va a pendientes')
    const min = Number(/(\d+) min/.exec(caja)?.[1] ?? 99999)
    debe(min < 120, 'aeropuerto', `los minutos son los del plan, no los de la distancia (${min})`)
    await a.captura(png('v44_aeropuerto'))
  })

  await sec(async () => {
    // En la ruta: «Desde ti» y [Actualizar]
    const primera = await ev(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const r = ${R}.getState().route; const s = numberedStopsOf(r.days[0]).find((x) => x.coordinates && x.coordinates.lat); return { lat: s.coordinates.lat + 0.004, lng: s.coordinates.lng + 0.004 } })()`)
    await montar(9 * 60, primera)
    const caja = (await txt('[data-hoy-trayecto]')) ?? ''
    debe(/\d+ min/.test(caja) && /Desde ti/.test(caja), 'ruta', `en la ruta: «12 min · Desde ti» (${caja})`)
    debe((await hay('[data-hoy-actualizar-ubicacion]')) && (await hay('[data-hoy-ya-he-llegado]')), 'ruta', '[Actualizar] en la caja y «¿Ya estás aquí? [Ya he llegado]» abajo')
    const dos = await a.evaluar("(() => { const h = document.querySelector('[data-hoy-horario]'); const t = document.querySelector('[data-hoy-trayecto]'); if (!h || !t) return null; const a = h.getBoundingClientRect(); const b = t.getBoundingClientRect(); return Math.abs(a.top - b.top) < 4 && a.right <= b.left + 1 })()")
    debe(dos === true, 'tarjeta', 'las dos cajas, HORARIO y la de minutos, una al lado de otra')
    await a.captura(png('v44_en_la_ruta'))
  })

  await sec(async () => {
    // Sin ubicación: el tiempo del plan + el recuadro
    await montar(9 * 60, null)
    const caja = (await txt('[data-hoy-trayecto]')) ?? ''
    // (V46) El texto corto: «Desde el alojamiento» (primera parada) o «Desde el Panteón»; con los minutos del plan, nunca «—».
    debe(/\d+ min/.test(caja) && /Desde (el|la|los|las) /.test(caja) && !/—/.test(caja), 'sin', `sin ubicación, el tiempo del plan con «Desde …» (${caja})`)
    debe((await txt('[data-hoy-sin-ubicacion]'))?.includes('Sin tu ubicación no sabemos cuándo llegas') ?? false, 'sin', 'el recuadro «Sin tu ubicación no sabemos cuándo llegas»')
    // el reproductor, azul oscuro desde el principio
    const fondo = await a.evaluar("getComputedStyle(document.querySelector('[data-hoy-escuchar-camino]') ?? document.body).backgroundImage") // (V47) el fondo es el degradado #232A3C → #1C2230
    debe(/rgb\(28, 34, 48\)/.test(fondo ?? ''), 'reproductor', `«Escucha su historia por el camino» en azul oscuro desde el principio (${fondo})`)
    await a.captura(png('v44_sin_ubicacion'))
  })

  await sec(async () => {
    // Cada cambio de la ruta da [Deshacer] abajo
    await montar(9 * 60, null)
    const aviso = async () => ({ accion: await hay('[data-aviso-de-abajo-accion]'), sobreLaBarra: await hay('[data-aviso-sobre-barra]') })
    await clic('[data-hoy-cambiar-plan]')
    await a.esp(600)
    await clic('[data-cambiar-opcion="saltar"]')
    await a.esp(1200)
    let r = await aviso()
    debe(r.accion && r.sobreLaBarra, 'deshacer', 'saltar: [Deshacer] y abajo, sobre el menú')
    await a.captura(png('v44_saltar_con_deshacer'))
    await a.evaluar("(async () => { (await import('/src/store/useAvisoDeAbajo.ts')).useAvisoDeAbajo.getState().vaciar(); return true })()")
    // los de «Lugares pendientes»
    await montar(9 * 60, null, "const v = r.days[0].stops.filter((s) => !s.isBreak && !s.isArrival); [1, 2, 3, 4].forEach((i) => { if (v[i]) v[i].saltada = true })")
    await clic('[data-hoy-pendientes-cabecera]')
    await a.esp(600)
    const vaciar = () => a.evaluar("(async () => { (await import('/src/store/useAvisoDeAbajo.ts')).useAvisoDeAbajo.getState().vaciar(); return true })()")
    for (const [nombre, selector] of [['recuperar hoy', '[data-hoy-pendiente-recuperar]'], ['ya lo visité', '[data-hoy-pendiente-visitado]'], ['quitar', '[data-hoy-pendiente-quitar]']]) {
      await vaciar()
      await clic('[data-hoy-pendiente-mas]')
      await a.esp(500)
      if (nombre === 'recuperar hoy' && !(await hay(selector))) {
        // si ya no sigue abierto no se ofrece (regla): se prueba con el siguiente
        await a.evaluar("(() => { document.querySelector('[data-hoja-menu] [aria-label=\"Cerrar\"]')?.click(); return true })()")
        continue
      }
      if (nombre === 'quitar') await a.captura(png('v44_pendientes_menu'))
      await clic(selector)
      await a.esp(900)
      r = await aviso()
      debe(r.accion && r.sobreLaBarra, 'deshacer', `${nombre}: [Deshacer] y abajo`)
      if (!(await hay('[data-hoy-pendientes-lista]'))) await clic('[data-hoy-pendientes-cabecera]')
      await a.esp(400)
    }
    await vaciar()
    await clic('[data-hoy-pendiente-pasar]')
    await a.esp(700)
    await a.evaluar("(() => { const b = document.querySelector('[data-dia-de-la-lista]:not([disabled])'); if (b) b.click(); return true })()")
    await a.esp(900)
    r = await aviso()
    debe(r.accion && r.sobreLaBarra, 'deshacer', 'pasar a otro día: [Deshacer] y abajo')
    await vaciar()
    if (!(await hay('[data-hoy-pendientes-lista]'))) await clic('[data-hoy-pendientes-cabecera]')
    await clic('[data-hoy-pendientes-pasar-todos]')
    await a.esp(700)
    await clic('[data-hoy-pendientes-confirmar]')
    await a.esp(900)
    r = await aviso()
    debe(r.accion || !(await hay('[data-hoy-pendientes-confirmar]')), 'deshacer', 'pasar todos: [Deshacer] y abajo (o no hay nada que pasar)')
  })

  await sec(async () => {
    // DÍAS: ninguna franja blanca fuera de la tarjeta (todas las filas de un día)
    await montar(9 * 60, null)
    await ev(`${R}.getState().setMode('days')`)
    await a.esp(1500)
    await ev(`(async () => { const st = ${R}.getState(); st.setActiveDayId(st.route.days[0].id); return true })()`)
    await a.esp(2500)
    const r = await a.evaluar(`(() => { const out = { n: 0, fuera: [] }; for (const s of document.querySelectorAll('[data-hueco-solo-anadir]')) { const tarjeta = s.closest('[data-day-id]'); if (!tarjeta) continue; const b = s.getBoundingClientRect(); const t = tarjeta.getBoundingClientRect(); out.n++; if (b.left < t.left - 0.5 || b.right > t.right + 0.5) out.fuera.push([Math.round(b.left), Math.round(t.left)]) } return out })()`)
    debe(r.fuera.length === 0, 'franjas', `ninguna franja blanca se sale de la tarjeta (${r.n} comprobadas, fuera: ${JSON.stringify(r.fuera)})`)
    await a.captura(png('v44_dias_franjas'))
  })
} finally {
  a.cerrar()
}

/* ───────────── 3. El globo grande abre la página encima ───────────── */
console.log('3. El globo grande › [Ver destino]')
{
  const g = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa', ancho: 390, alto: 844 })
  const J = async (js) => JSON.parse(await g.evaluar(`JSON.stringify(${js})`))
  const esperar = async (js, n = 120) => {
    for (let i = 0; i < n; i++) {
      if (await g.evaluar(js).catch(() => false)) return true
      await g.esp(250)
    }
    return false
  }
  try {
    for (let i = 0; i < 6; i++) {
      const h = await g.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await g.esp(700)
    }
    await g.evaluar("import('/src/store/usePerfilUi.ts').then((m) => m.usePerfilUi.getState().abrir()); true")
    await esperar("Boolean(document.querySelector('[data-abrir-globo]'))", 120)
    await g.esp(1500)
    await g.evaluar("(() => { document.querySelector('[data-abrir-globo]')?.click(); return true })()")
    const abrio = await esperar("Boolean(document.querySelector('[data-globo-destinos]')) && window.__globoMapa && window.__globoMapa.loaded()", 200)
    debe(abrio, 'globo', 'el globo grande abre')
    await g.esp(1500)
    await g.evaluar("import('/src/lib/primeraVez.ts').then((m) => m.usePrimeraVezUi.getState().abrirTarjeta('roma')); true")
    await esperar("Boolean(document.querySelector('[data-ver-destino]'))", 40)
    await g.evaluar("document.querySelector('[data-ver-destino]')?.click(); true")
    await esperar("Boolean(document.querySelector('[data-pagina-destino]'))", 80)
    await g.esp(1200)
    const encima = await J("(() => { const e = document.elementFromPoint(195, 400); return { pagina: Boolean(e?.closest('[data-pagina-destino]')), globo: Boolean(e?.closest('[data-globo-destinos]')) } })()")
    debe(encima.pagina && !encima.globo, 'globo', `[Ver destino]: la página se abre ENCIMA del globo (${JSON.stringify(encima)})`)
    await g.captura(png('v44_globo_ver_destino'))
    await g.evaluar("document.querySelector('[data-cerrar-destino]')?.click(); true")
    await g.esp(1200)
    const vuelta = await J("(() => { const e = document.elementFromPoint(195, 400); return { globo: Boolean(e?.closest('[data-globo-destinos]')), pagina: Boolean(document.querySelector('[data-pagina-destino]')) } })()")
    debe(vuelta.globo && !vuelta.pagina, 'globo', `al cerrar la página, vuelve al globo (${JSON.stringify(vuelta)})`)
  } finally {
    g.cerrar()
  }
}

console.log(`\nPrueba de la V44: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
