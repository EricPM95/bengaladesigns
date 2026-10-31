// Tanda 10N9 §2 y §3a · «Guardar el vuelo» también para el administrador, y la hoja del vuelo como `Piezas/Reservas Cada Uno` (rueda hora : minutos, sin precio, botón fijo abajo, resumen «✓ Ida…» en las pestañas).
// Capturas docs/dias/capturas_jutrip/10n9_hoja_vuelo*.jpg y, al lado, la de Design (10n9_hoja_vuelo_design*.jpg; SIN_DESIGN=1 las salta).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N9_vuelo.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'
import { queCambioEnElViaje } from '../../shared/avisos/textos.js'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10n9_hoja_vuelo${n}.jpg`)
const GENTE = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' },
]

const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
const ev = (js) => a.evaluar(js)
const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const hoja = () => ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? null")
const botones = () => ev("Array.from(document.querySelectorAll('[role=\"dialog\"] button')).map((b) => (b.textContent || '').trim()).filter(Boolean)")
const rutaDe = () => ev("(() => { const r = window.__ruta.getState().route; return { ida: r.arrivalFlightTime ?? null, vuelta: r.departureFlightTime ?? null, pIda: r.arrivalPointId ?? null, pVuelta: r.departurePointId ?? null, cambio: r.ultimoCambio ?? null } })()")
const ponerGente = (yo) =>
  ev(`(async () => {
    const yo = ${JSON.stringify(yo)}
    const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-' + yo }))
    sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso')
    if (yo !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'editar') }
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
    const tiendas = [window.__viaje]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
    for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
    window.__modoCuentas?.poner('cada_uno', 2)
    return true
  })()`)
const loSuyo = (js) =>
  ev(`(async () => {
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useLoSuyo.ts')))]
    const tiendas = [window.__loSuyo]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useLoSuyo)
    for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); await (async (s) => { ${js} })(st) }
    return true
  })()`)
const irAReservas = async () => {
  await ev("window.__ruta.getState().setMode('bookings'); true")
  await a.esp(1800)
}
/** Toca una opción de una columna de la rueda (hora o minutos). */
const rueda = (columna, texto) => ev(`(() => { const o = Array.from(document.querySelectorAll('[role="dialog"] [data-rueda-columna="${columna}"] [role="option"]')).find((x) => x.textContent.trim() === ${JSON.stringify(texto)}); if (!o) return false; o.click(); return true })()`)
const cerrarHoja = async () => {
  await ev("document.querySelector('[role=\"dialog\"] button[aria-label=\"Cerrar\"]')?.click(); true")
  await a.esp(600)
}
/** Lo que mide la hoja abierta: botón fijo abajo, ruedas, precio, resumen. */
const medidas = () =>
  ev(`(() => {
    const d = document.querySelector('[role="dialog"]')
    const panel = d?.querySelector('.trazo-notice-panel')
    const pie = d?.querySelector('[data-pie-de-hoja]')
    const boton = d?.querySelector('[data-mi-vuelo-guardar]')
    const cuerpo = pie?.previousElementSibling
    const pr = panel?.getBoundingClientRect(), br = boton?.getBoundingClientRect()
    return {
      botones: Array.from(d?.querySelectorAll('button') ?? []).map((b) => (b.textContent || '').trim()).filter(Boolean),
      botonEnPie: Boolean(boton && pie && pie.contains(boton)),
      botonFueraDelScroll: Boolean(boton && cuerpo && !cuerpo.contains(boton)),
      pegadoAbajo: Boolean(pr && br && pr.bottom - br.bottom < 40 && pr.bottom - br.bottom >= 0),
      // (10S6, 31-oct) antes → ahora → decisión de Eric: la rueda dentro de la hoja del vuelo → la hoja de la hora desde abajo, con ✓ (se cuenta en ella).
      columnas: document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]').length,
      listboxHoras: document.querySelectorAll('[data-hoja-de-hora] [role="listbox"]').length,
      precio: /Cuánto ha costado/i.test(d?.innerText ?? ""),
      resumenes: Array.from(d?.querySelectorAll('[data-mi-vuelo-resumen]') ?? []).map((x) => x.textContent.trim()),
      pestanas: Array.from(d?.querySelectorAll('[role=tab]') ?? []).map((x) => x.textContent.trim()),
      horaMostrada: d?.querySelector('[data-campo-de-hora="roma"] [data-campo-de-hora-texto]')?.textContent.trim() ?? null,
    }
  })()`)

try {
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await ev('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts'), import('/src/store/useMisReservas.ts')]).then(() => true)")
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }

  /* ═══ A · el administrador: sin nada puesto, abre la hoja, rellena ida y vuelta, y nada se guarda hasta el botón ═══ */
  console.log('A. Administrador: Guardar el vuelo')
  await ponerGente('eric')
  await ev("window.__ruta.setState((s) => ({ route: { ...s.route, arrivalFlightTime: null, departureFlightTime: null, arrivalPointId: null, departurePointId: null, ultimoCambio: null } })); true")
  await irAReservas()
  const abre = await clic('[data-blk="llegada"] [class*="cursor-pointer"]')
  debe(abre, 'A', 'el bloque «Llegada y vuelta» del administrador se abre al tocarlo')
  await a.esp(1000)
  let m = await medidas()
  debe(m.botones.includes('Guardar el vuelo'), '2', `la hoja del administrador trae «Guardar el vuelo» (${m.botones.join(' | ').slice(0, 140)})`)
  debe(!m.botones.some((b) => /^Guardar$/.test(b)), '2', 'y ningún [Guardar] suelto en la rueda de la hora')
  debe(m.botones.filter((b) => /^Guardar/.test(b)).length === 1, '2', 'un solo botón de guardar')
  await clic('[data-campo-de-hora="roma"]')
  await a.esp(500)
  m = await medidas()
  debe(m.columnas === 2 && m.listboxHoras === 2, '3a', `(10N10) al tocar la hora, la rueda es de dos columnas (${m.columnas})`)
  debe(m.precio, '3a', '(10N10) la hoja del vuelo lleva «¿Cuánto ha costado en total?» debajo de las pestañas')
  debe(m.botonEnPie && m.botonFueraDelScroll && m.pegadoAbajo, '3a', `el botón va fijo, pegado al pie de la hoja y fuera del scroll (${JSON.stringify({ e: m.botonEnPie, f: m.botonFueraDelScroll, p: m.pegadoAbajo })})`)
  debe(m.resumenes.length === 0, '3a', 'sin resumen en las pestañas mientras no se haya tocado nada')
  debe((await rutaDe()).ida === null, '2', 'abrir la hoja no guarda nada')
  const puntos = await ev("Array.from(document.querySelectorAll('[role=\"dialog\"] [data-mi-vuelo-punto-opcion]')).map((x) => x.textContent.trim())")
  debe(puntos.length >= 2, '2', `salen los aeropuertos para elegir (${JSON.stringify(puntos)})`)
  const antesDelBoton = await ev("document.querySelector('[data-mi-vuelo-guardar]')?.disabled")
  debe(antesDelBoton === true, '2', 'sin tocar nada, el botón está apagado (no hay nada que guardar)')
  await a.captura(foto('_00_admin_vacia'))

  // Ida: aeropuerto y hora 14:25.
  await clic(`[data-mi-vuelo-punto-opcion="${puntos[0]}"]`)
  await clic('[data-campo-de-hora="roma"]')
  await a.esp(500)
  await rueda('Horas', '14')
  await a.esp(300)
  await rueda('Minutos', '25')
  await a.esp(500)
  await ev("document.querySelector('[data-hoja-de-hora-guardar]')?.click(); true")
  await a.esp(500)
  m = await medidas()
  debe(m.horaMostrada === '14:25', '3a', `la hora de la cabecera sigue a la rueda (${m.horaMostrada})`)
  let r = await rutaDe()
  debe(r.ida === null && r.pIda === null, '2', 'tocar la rueda y el aeropuerto de la ida no guarda nada todavía')
  // Vuelta.
  await clic('[data-mi-vuelo-lado="vuelta"]')
  await a.esp(500)
  m = await medidas()
  debe(m.resumenes.length === 1 && /^Ida · .*14:25$/.test(m.resumenes[0]), '3a', `la pestaña de la ida dice su resumen «✓ Ida · día · 14:25» (${JSON.stringify(m.resumenes)})`)
  const hojaVuelta = (await hoja()) ?? ''
  // (10S3) Antes: «Día de salida» → ahora «Día de vuelta» (Vuelo Reservas 03) → decisión de Eric (10S3, 30-oct). «Hora de salida» sigue en la rueda.
  // (10S6, 31-oct) antes «Hora de salida» (cabecera de la rueda dentro de la hoja) → ahora la casilla dice «Sale a las» (la rueda tiene su propia hoja) → decisión de Eric.
  debe(/Día de vuelta/i.test(hojaVuelta) && /Sale a las/i.test(hojaVuelta), '3a', 'en la vuelta, «Día de vuelta» y «Sale a las»')
  await clic(`[data-mi-vuelo-punto-opcion="${puntos[1]}"]`)
  await clic('[data-campo-de-hora="roma"]')
  await a.esp(500)
  await rueda('Horas', '19')
  await a.esp(300)
  await rueda('Minutos', '40')
  await a.esp(500)
  await ev("document.querySelector('[data-hoja-de-hora-guardar]')?.click(); true")
  await a.esp(500)
  r = await rutaDe()
  debe(r.ida === null && r.vuelta === null, '2', 'con la ida y la vuelta rellenas, la ruta sigue sin tocar hasta pulsar el botón')
  const botonActivo = await ev("document.querySelector('[data-mi-vuelo-guardar]')?.disabled === false")
  debe(botonActivo, '2', 'con la ida y la vuelta puestas, el botón se enciende')
  await a.captura(foto(''))
  await ev("window.__antes = { id: window.__ruta.getState().route.ultimoCambio?.id ?? null, ruta: JSON.parse(JSON.stringify(window.__ruta.getState().route)) }; true")
  await clic('[data-mi-vuelo-guardar]')
  await a.esp(1500)
  r = await rutaDe()
  debe(r.ida === '14:25' && r.vuelta === '19:40', '2', `al pulsar «Guardar el vuelo» se guardan la ida y la vuelta (${r.ida} / ${r.vuelta})`)
  debe(Boolean(r.pIda) && Boolean(r.pVuelta), '2', 'con sus aeropuertos')
  debe(!(await ev("Boolean(document.querySelector('[data-mi-vuelo-guardar]'))")), '2', 'y la hoja se cierra')
  // (Los días se rehacen en segundo plano: se espera a que acabe, y a que el rehacer NO cambie el aviso por otro.)
  for (let i = 0; i < 40 && (await ev('window.__ruta.getState().rehaciendoRuta')); i++) await a.esp(500)
  await a.esp(1500)
  r = await rutaDe()
  // UN solo cambio, con la ida y la vuelta juntas.
  const c = r.cambio
  debe(Boolean(c) && c.accion?.tipo === 'vuelo' && c.accion.ida?.hora === '14:25' && c.accion.vuelta?.hora === '19:40', '2', `se apunta UN solo cambio «vuelo» con la ida y la vuelta (${JSON.stringify(c?.accion ?? null).slice(0, 160)})`)
  const idAntes = await ev('window.__antes.id')
  debe(Boolean(c?.id) && c.id !== idAntes, '2', 'con un id nuevo (un aviso nuevo para los demás)')
  const frase = c ? queCambioEnElViaje({ cambio: c }) : ''
  debe(/ida/.test(frase) && /vuelta/.test(frase) && /14:25/.test(frase) && /19:40/.test(frase), '2', `el aviso dice las dos cosas en una frase: «${frase}»`)
  // El sellado que hace el móvil antes de guardar en la nube deja ese mismo cambio (no uno por mitad).
  const sellado = await ev(`(async () => {
    const m = await import('/src/lib/sellarCambio.ts')
    m.olvidarBases()
    const antes = window.__antes.ruta
    m.recordarBase('t10n9', antes, Date.now() - 60000)
    const despues = window.__ruta.getState().route
    const s = m.sellarRuta('t10n9', despues)
    return { tipo: s.ultimoCambio?.accion?.tipo ?? null, id: s.ultimoCambio?.id ?? null, mismo: s.ultimoCambio?.id === despues.ultimoCambio?.id }
  })()`)
  debe(sellado.tipo === 'vuelo' && sellado.mismo, '2', `al guardar el viaje se manda ese único cambio (${JSON.stringify(sellado)})`)
  // Un segundo guardado sin tocar nada no vuelve a avisar.
  await a.captura(foto('_01_admin_guardado'))

  await a.captura(foto('_01b_admin_guardado_y_resumen'))
  // Cambiar solo la vuelta: otro guardado, con solo la vuelta en el aviso.
  await ev("document.querySelector('[data-blk=\"llegada\"]')?.scrollIntoView({block:'center'}); true")
  await a.esp(500)
  // antes: el bloque salía abierto → ahora (10S4): con la ida y la vuelta listas sale plegado; se abre tocando la cabecera.
  await ev("if (!document.querySelector('[data-blk=\"llegada\"] [data-mitad]')) document.querySelector('[data-blk=\"llegada\"] [data-llegada-cabecera]')?.click(); true")
  await a.esp(400)
  const lineas = await ev("Array.from(document.querySelectorAll('[data-blk=\"llegada\"] *')).filter((e) => e.children.length === 0 && /Cambiar/.test(e.textContent || '')).length")
  debe(lineas >= 1, 'A', 'con el vuelo guardado, el bloque ofrece «Cambiar»')
  await ev("window.__ruta.getState().guardarVueloDelAdmin && true")

  /* ═══ B · el invitado: la misma hoja ═══ */
  console.log('B. Invitado: la misma hoja')
  for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
    await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
    await a.esp(500)
  }
  await ponerGente('ana')
  await loSuyo('s.setState({ mio: { vuelo: null, alojamiento: null }, grupo: {}, entradas: [] })')
  await irAReservas()
  await clic('[data-pon-el-tuyo="vuelo"], [data-falta-tarjeta="vuelo"]')
  await a.esp(1000)
  m = await medidas()
  debe(m.botones.includes('Guardar el vuelo') && !m.botones.includes('Guardar'), '3a', 'la hoja del invitado: un solo «Guardar el vuelo»')
  debe(m.precio, '3a', '(10N10) y con precio también en la del invitado')
  debe(m.botonEnPie && m.pegadoAbajo, '3a', 'y con el botón pegado al pie')
  await clic('[data-mi-vuelo-lado="ida"]')
  await clic('[data-campo-de-hora="roma"]')
  await a.esp(400)
  await rueda('Horas', '09')
  await a.esp(400)
  await ev("document.querySelector('[data-hoja-de-hora-guardar]')?.click(); true")
  await a.esp(500)
  await clic('[data-mi-vuelo-lado="vuelta"]')
  await a.esp(400)
  m = await medidas()
  debe(m.resumenes.length === 1 && /09:\d\d$/.test(m.resumenes[0]), '3a', `el resumen de la ida en su pestaña (${JSON.stringify(m.resumenes)})`)
  await a.captura(foto('_02_invitado'))
  await cerrarHoja()
} catch (e) {
  debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 500))
} finally {
  a.cerrar()
}

if (process.env.SIN_DESIGN !== '1') {
  const ir = (re) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => ${re}.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
  for (const [n, salida] of [['02', '_design'], ['02b', '_design_vuelta']]) {
    await capturarDesign('Piezas/Reservas Cada Uno.dc.html', foto(salida), { despues: ir(`/^${n} ·/`) }).catch((e) => console.log('  (sin captura de Design)', n, e.message))
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
