// Tanda 10N10 (agente D) · RESERVAS con su aspecto nuevo, el vuelo y el alojamiento como `Piezas/Vuelo Reservas` (pestañas Ida|Vuelta, dinero debajo, 05b solo, 06 tarjeta, 07 lo que ve otra persona, 08/08b/09),
// la caja del pase del alojamiento con la zona elegida, las entradas como `Piezas/Entrada Nueva` y «Ir a comprar» con su línea y la pregunta al volver.
// Capturas docs/dias/capturas_jutrip/10n10_reservas_*.jpg y, al lado, las de Design (..._design.jpg; SIN_DESIGN=1 las salta).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N10_reservas.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10n10_reservas_${n}.jpg`)
const GENTE2 = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' },
]
const GENTE1 = [{ id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' }]

const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${process.env.VERSION ?? 'pago'}` })
const ev = (js) => a.evaluar(js)
const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const hoja = () => ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? null")
const botones = (raiz = 'document') => ev(`Array.from(${raiz}.querySelectorAll('button')).map((b) => (b.textContent || '').trim()).filter(Boolean)`)
const rutaDe = () => ev("(() => { const r = window.__ruta.getState().route; return { ida: r.arrivalFlightTime ?? null, vuelta: r.departureFlightTime ?? null, precio: r.arrivalPrecio ?? null, precioV: r.departurePrecio ?? null, entre: r.cuentasEntre ?? null, pagado: r.pagadoPorDe ?? null, zona: r.accommodationZone ?? null, codigo: r.arrivalCodigo ?? null } })()")
const ponerGente = (yo, gente = GENTE2) =>
  ev(`(async () => {
    const yo = ${JSON.stringify(yo)}
    const g = ${JSON.stringify(gente)}.map((p) => ({ ...p, esYo: p.id === 'p-' + yo }))
    sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso')
    if (yo !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'editar') }
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
    const tiendas = [window.__viaje]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
    for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
    window.__modoCuentas?.poner('conjunta', g.length)
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
const cerrarHojas = async () => {
  for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
    await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
    await a.esp(500)
  }
}
const medidas = () =>
  ev(`(() => {
    const d = document.querySelector('[role="dialog"]')
    const pie = d?.querySelector('[data-pie-de-hoja]')
    const t = d?.innerText.replace(/\\s+/g, ' ') ?? ''
    return {
      texto: t,
      botones: Array.from(d?.querySelectorAll('button') ?? []).map((b) => (b.textContent || '').trim()).filter(Boolean),
      botonEnPie: Boolean(pie && pie.querySelector('[data-mi-vuelo-guardar], [data-guardar-alojamiento]')),
      pestanas: Array.from(d?.querySelectorAll('[role=tab]') ?? []).map((x) => x.textContent.trim()),
      resumenes: Array.from(d?.querySelectorAll('[data-mi-vuelo-resumen]') ?? []).map((x) => x.textContent.trim()),
      ruedas: d?.querySelectorAll('[data-rueda-columna]').length ?? 0,
      cuadrados: Array.from(d?.querySelectorAll('[data-personas-cuadradas]') ?? []).map((g) => ({ k: g.getAttribute('data-personas-cuadradas'), n: g.children.length, elegidas: Array.from(g.children).filter((c) => c.getAttribute('data-elegida') === '1').length })),
      ordenDinero: ['¿Para quién', '¿Cuánto ha costado en total?', '¿Quién lo ha pagado?'].map((s) => t.indexOf(s)),
    }
  })()`)
const escribe = (sel, valor) =>
  ev(`(() => { const i = document.querySelector('[role=dialog] ${sel}'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(valor)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)

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

  /* ═══ 7a · la pantalla de RESERVAS ═══ */
  console.log('7a. RESERVAS: título solo y tarjetas amplias')
  await ponerGente('eric')
  await ev("window.__ruta.setState((s) => ({ route: { ...s.route, arrivalFlightTime: null, departureFlightTime: null, arrivalPointId: null, departurePointId: null, arrivalPrecio: null, departurePrecio: null, cuentasEntre: undefined, pagadoPorDe: undefined, accommodationZone: null } })); true")
  await irAReservas()
  const titulo = await ev("document.querySelector('[data-titulo-reservas]')?.innerText.replace(/\\s+/g, ' ') ?? null")
  debe(titulo === 'Reservas', '7a', `el título es «Reservas» solo, sin línea debajo (${titulo})`)
  const alturas = await ev("['llegada', 'aloj', 'entradas'].map((b) => Math.round(document.querySelector('[data-blk=\"' + b + '\"]')?.getBoundingClientRect().height ?? 0))")
  // 10S6 (antes → ahora → decisión de Eric, 31-oct: bloque como Design): antes las tres ≥ 76 px; ahora Llegada y Alojamiento siguen ≥ 76 y la de Entradas mide lo que la cabecera oscura de Design (14 + 46 + 14 = 74 px), así que ≥ 72.
  debe(alturas[0] >= 76 && alturas[1] >= 76 && alturas[2] >= 72, '7a', `las tres tarjetas son más amplias (alturas ${alturas.join(', ')})`)
  const resto = await ev("document.body.innerText.replace(/\\s+/g, ' ')")
  debe(/de 3 listo/i.test(resto) && /Útil para el viaje/i.test(resto) && /Entradas y Free Tour/i.test(resto), '7a', 'sigue todo lo nuestro: «x de 3 listo», «Útil para el viaje», «Entradas y Free Tour»')
  await a.captura(foto('01_reservas'))

  /* ═══ 7b · el vuelo del administrador (con dos personas) ═══ */
  console.log('7b. Vuelo: pestañas, dinero debajo, un solo botón')
  await clic('[data-llegada-vacia]')
  await a.esp(1200)
  let m = await medidas()
  debe(m.pestanas.length === 2 && /Ida/.test(m.pestanas[0]) && /Vuelta/.test(m.pestanas[1]), '7b', `pestañas Ida | Vuelta (${JSON.stringify(m.pestanas)})`)
  debe(m.botones.filter((b) => /^Guardar/.test(b)).length === 1 && m.botones.includes('Guardar el vuelo'), '7b', 'un solo botón «Guardar el vuelo» (sin [Guardar] de la rueda)')
  debe(m.ruedas === 0, '7b', 'la rueda no está abierta hasta tocar la hora (como Design 02)')
  debe(m.ordenDinero.every((x) => x > 0) === false || m.ordenDinero[0] < m.ordenDinero[1], '7b', 'primero «¿Para quién es este vuelo?» y luego el precio')
  debe(/¿Para quién es este vuelo\?/.test(m.texto) && /¿Cuánto ha costado en total\?/.test(m.texto), '7b', 'debajo de las pestañas: «¿Para quién es este vuelo?» y «¿Cuánto ha costado en total?»')
  debe(m.cuadrados.some((c) => c.k === 'para-quien' && c.n === 2 && c.elegidas === 1), '7b', `«¿Para quién…?» en cuadrados, marcado solo quien lo pone (${JSON.stringify(m.cuadrados)})`)
  debe(!/¿A qué cuenta lo sumamos\?/.test(m.texto), '7b', 'sin «¿A qué cuenta lo sumamos?»')
  // (10S6, 31-oct) antes → ahora → decisión de Eric: antes con REF. VUELO y AEROLÍNEA en la hoja → ahora fuera (se cambian en la tarjeta del billete de RESERVAS).
  debe(!/Ref\. vuelo/i.test(m.texto) && !/Aerolínea/i.test(m.texto), '7b', 'sin REF. VUELO ni AEROLÍNEA en la hoja (10S6)')
  await a.captura(foto('02_vuelo_hoja'))
  // Ida: aeropuerto y hora (la rueda se abre al tocar el campo).
  const puntos = await ev("Array.from(document.querySelectorAll('[role=\"dialog\"] [data-mi-vuelo-punto-opcion]')).map((x) => x.textContent.trim())")
  await clic(`[data-mi-vuelo-punto-opcion="${puntos[0]}"]`)
  await clic('[data-campo-de-hora="roma"]')
  await a.esp(500)
  // (10S6, 31-oct) antes → ahora → decisión de Eric: la rueda dentro de la hoja → la hoja de la hora desde abajo (con ✓ y papelera).
  debe((await ev("document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]').length")) === 2, '7b', 'al tocar la hora se abre la hoja de la hora con la rueda de dos columnas (04)')
  await a.captura(foto('03_vuelo_rueda'))
  await ev("(() => { const o = Array.from(document.querySelectorAll('[role=\"dialog\"] [data-rueda-columna=\"Horas\"] [role=\"option\"]')).find((x) => x.textContent.trim() === '14'); o?.click(); return true })()")
  await a.esp(500)
  await clic('[data-hoja-de-hora-guardar]')
  await a.esp(500)
  await clic('[data-mi-vuelo-lado="vuelta"]')
  await a.esp(400)
  m = await medidas()
  debe(m.resumenes.length === 1 && /^Ida · .*14:\d\d$/.test(m.resumenes[0]), '7b', `✓ en la pestaña rellena, con su resumen (${JSON.stringify(m.resumenes)})`)
  await clic(`[data-mi-vuelo-punto-opcion="${puntos[1]}"]`)
  // Dinero: 180 €, para los dos, lo pagó Eric.
  await ev("document.querySelector('[role=dialog] [data-mi-vuelo-extra]')?.scrollIntoView({ block: 'center' }); true")
  await clic('[role=dialog] [data-persona-cuadrada="p-ana"]')
  await ev("(() => { const i = Array.from(document.querySelectorAll('[role=dialog] input')).find((x) => x.getAttribute('aria-label') === '¿Cuánto ha costado en total?'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '180'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
  await a.esp(500)
  m = await medidas()
  debe(/¿Quién lo ha pagado\?/.test(m.texto) && m.cuadrados.some((c) => c.k === 'pagado'), '7b', '«¿Quién lo ha pagado?» en cuadrados (solo con precio y para varios)')
  debe(/90 € cada uno/.test(m.texto) && /Va a la cuenta conjunta/.test(m.texto), '7b', `la línea de a dónde va el dinero: «90 € cada uno · Va a la cuenta conjunta» (${(m.texto.match(/90 € cada uno[^.]*/) ?? [''])[0]})`)
  const ord = m.ordenDinero
  debe(ord[0] > 0 && ord[0] < ord[1] && ord[1] < ord[2], '7b', `el orden: para quién → cuánto → quién lo pagó (${ord.join(' < ')})`)
  await a.captura(foto('04_vuelo_dinero'))
  const avisoAntes = await ev('window.__ruta.getState().route.ultimoCambio?.id ?? null')
  await clic('[data-mi-vuelo-guardar]')
  await a.esp(1500)
  for (let i = 0; i < 40 && (await ev('window.__ruta.getState().rehaciendoRuta')); i++) await a.esp(500)
  await a.esp(1000)
  let r = await rutaDe()
  debe(/^14:/.test(r.ida ?? '') && r.vuelta !== null, '7b', `«Guardar el vuelo» guarda la ida y la vuelta (${r.ida} / ${r.vuelta})`)
  debe(r.precio?.amount === 180 && r.precioV == null, '7b', `el precio es el de todo el vuelo (${JSON.stringify(r.precio)})`)
  debe(r.pagado?.llegada?.[0] === 'p-eric' && r.pagado?.vuelta?.[0] === 'p-eric', '7b', `quién lo pagó queda apuntado (${JSON.stringify(r.pagado)})`)
  debe(!r.entre || (r.entre.llegada ?? []).length === 0 || r.entre.llegada.length === 2, '7b', 'para los dos: la cuenta común')
  // (10S6, 31-oct) antes → ahora → decisión de Eric: la referencia se escribía en la hoja → ahora llega con el billete y se cambia en su tarjeta (lo prueba pruebaTanda10S6_N).
  debe(!r.codigo, '7b', `la hoja ya no pide la referencia (${r.codigo})`)
  await ev("Array.from(document.querySelectorAll('button')).find((b) => /^De acuerdo$/.test((b.textContent || '').trim()))?.click(); true")
  await a.esp(600)
  const avisoDespues = await ev('window.__ruta.getState().route.ultimoCambio?.id ?? null')
  debe(avisoDespues !== avisoAntes, '7b', 'un solo aviso nuevo')

  /* ═══ 7b · tarjeta guardada (06) ═══ */
  console.log('7b. Tarjeta guardada')
  await ev("document.querySelector('[data-blk=\"llegada\"]')?.scrollIntoView({ block: 'start' }); true")
  // 10S4 (antes → ahora → decisión de Eric, 30-oct): antes la tarjeta del vuelo salía siempre abierta; ahora, con ida y vuelta listas, sale PLEGADA y se abre con un toque en la cabecera. Misma fuerza: se abre y se mira lo mismo.
  if (!(await ev("Boolean(document.querySelector('[data-blk=\"llegada\"] [data-mitad]'))"))) await ev("document.querySelector('[data-blk=\"llegada\"] [data-llegada-cabecera]')?.click(); true")
  await a.esp(600)
  const tarjeta = await ev("document.querySelector('[data-blk=\"llegada\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  debe(/ida/i.test(tarjeta) && /vuelta/i.test(tarjeta) && /Cambiar/.test(tarjeta), '7b', 'la tarjeta guardada trae la ida y la vuelta con [Cambiar]')
  debe(/En este vuelo/i.test(tarjeta) && /Tú/.test(tarjeta) && /Ana/.test(tarjeta), '7b', `«En este vuelo» con Tú y Ana dentro de la misma tarjeta (${tarjeta.slice(-80)})`)
  const fuera = await ev("({ caja: Boolean(document.querySelector('[data-candado=\"llegada-ajuste\"]')), suelto: Boolean(document.querySelector('[data-lo-de-cada-uno=\"admin\"][data-que=\"vuelo\"]')) })")
  debe(!fuera.caja && !fuera.suelto, '7b', 'fuera la caja «Tu primer y tu último día» y el bloque suelto «En este vuelo»')
  const redondos = await ev("(() => { const c = document.querySelector('[data-blk=\"llegada\"] [data-en-este-chips] span'); return Boolean(c) && parseInt(getComputedStyle(c).borderRadius) >= 15 })()")
  debe(redondos, '7b', 'las personas de la tarjeta, en redondo (se enseñan, no se eligen)')
  await a.captura(foto('05_vuelo_tarjeta'))

  /* ═══ 7b · viajando solo (05b) ═══ */
  console.log('7b. Vuelo viajando solo')
  await ponerGente('eric', GENTE1)
  await a.esp(800)
  if (!(await ev("Boolean(document.querySelector('[data-blk=\"llegada\"] [data-mitad]'))"))) await ev("document.querySelector('[data-blk=\"llegada\"] [data-llegada-cabecera]')?.click(); true")
  await a.esp(500)
  await clic('[data-blk="llegada"] [data-mitad="arrival"] button')
  await a.esp(1000)
  m = await medidas()
  debe(/¿Cuánto ha costado en total\?/.test(m.texto) && !/¿Para quién es este vuelo\?/.test(m.texto) && !/¿Quién lo ha pagado\?/.test(m.texto), '7b', `solo: el precio y nada más (05b) ${m.texto.slice(0, 200)}`)
  await a.captura(foto('06_vuelo_solo'))
  await cerrarHojas()

  /* ═══ 7b · lo que ve otra persona (07) ═══ */
  console.log('7b. Lo que ve otra persona')
  await ponerGente('ana')
  await loSuyo('s.setState({ mio: { vuelo: null, alojamiento: null }, grupo: {}, entradas: [] })')
  await irAReservas()
  await a.esp(800)
  const ve = await ev("document.querySelector('[data-tarjeta-vuelo=\"admin\"]')?.innerText.replace(/\\s+/g, ' ') ?? null")
  debe(Boolean(ve) && /Lo ha puesto Eric/.test(ve), '7b', `«Lo ha puesto Eric · para …» (${ve})`)
  debe((await ev("Array.from(document.querySelectorAll('[data-lo-de-cada-uno=\"invitado\"] button')).some((b) => /^Poner el mío$/.test((b.textContent || '').trim()))")), '7b', '[Poner el mío]')
  await a.captura(foto('07_vuelo_lo_ve_otra_persona'))
  await clic('[data-pon-el-tuyo="vuelo"]')
  await a.esp(900)
  m = await medidas()
  debe(/¿Cuánto ha costado en total\?/.test(m.texto) && /¿Para quién es este vuelo\?/.test(m.texto), '7b', 'la hoja del invitado lleva también «¿Cuánto ha costado en total?» y «¿Para quién…?»')
  await cerrarHojas()

  /* ═══ 7c · el alojamiento ═══ */
  console.log('7c. Alojamiento')
  await ponerGente('eric')
  await irAReservas()
  await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
  await a.esp(500)
  await ev("(() => { const b = document.querySelector('[data-blk=\"aloj\"]'); if (!b.querySelector('[data-anadir-alojamiento]')) b.firstElementChild.click(); return true })()")
  await a.esp(600)
  await clic('[data-anadir-alojamiento]')
  await a.esp(1500)
  m = await medidas()
  debe(/¿En qué zona te alojas\?/.test(m.texto) && /Prati/.test(m.texto) && /Aún no lo sé/.test(m.texto), '7c', 'la hoja trae las zonas a todo el ancho y «Aún no lo sé» (08)')
  debe(/Nombre del hotel/i.test(m.texto), '7c', '(10N11) «Nombre del hotel»')
  debe(/¿Para quién es el alojamiento\?/.test(m.texto) && /¿Cuánto ha costado en total\?/.test(m.texto), '7c', '«¿Para quién es el alojamiento?» y el bloque del dinero (08b)')
  debe(m.botones.includes('Guardar el alojamiento'), '7c', '«Guardar el alojamiento»')
  const ancho = await ev("(() => { const d = document.querySelector('[role=dialog] [data-zona-opcion]'); const p = document.querySelector('[role=dialog] .trazo-notice-panel'); if (!d || !p) return null; const a = d.getBoundingClientRect(), b = p.getBoundingClientRect(); return { izq: Math.round(a.left - b.left), der: Math.round(b.right - a.right) } })()")
  debe(ancho && ancho.izq >= 16 && ancho.izq === ancho.der, '7c', `elegir la zona a todo el ancho, con sus márgenes (${JSON.stringify(ancho)})`)
  await a.captura(foto('08_alojamiento_hoja'))
  const zonaElegida = await ev("document.querySelector('[role=dialog] [data-zona-opcion]')?.getAttribute('data-zona-opcion') ?? null")
  await clic('[data-zona-opcion]')
  await ev("document.querySelector('[role=dialog] [data-alojamiento-dinero]')?.scrollIntoView({ block: 'center' }); true")
  // (10N11) En el alojamiento «¿Para quién…?» sale con todos marcados: Ana ya está.
  await ev("(() => { const i = Array.from(document.querySelectorAll('[role=dialog] input')).find((x) => x.getAttribute('aria-label') === '¿Cuánto ha costado en total?'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '300'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
  await a.esp(500)
  await a.captura(foto('09_alojamiento_dinero'))
  await clic('[data-guardar-alojamiento]')
  await a.esp(1500)
  r = await rutaDe()
  debe(Boolean(zonaElegida) && r.zona === zonaElegida, '7c', `la zona se guarda (${r.zona})`)
  await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
  await a.esp(600)
  const cardAloj = await ev("document.querySelector('[data-blk=\"aloj\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  debe(/Tu zona/i.test(cardAloj) && /En este alojamiento/i.test(cardAloj) && /Tú/.test(cardAloj) && /Ana/.test(cardAloj), '7c', `la tarjeta (09): «Tu zona», «En este alojamiento · Tú y Ana» (${cardAloj.slice(0, 120)})`)
  await a.captura(foto('10_alojamiento_tarjeta'))
} catch (e) {
  debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 500))
}

/* ═══ 7c · la caja del pase del alojamiento (sin pase) ═══ */
if (process.env.SIN_GRATIS !== '1') {
  try {
    console.log('7c. Caja del pase con la zona elegida (versión gratis)')
    await ev("location.search = '?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=gratis'").catch(() => undefined)
    await a.esp(6000)
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    await ev("window.__ruta.setState((s) => ({ route: { ...s.route, accommodationZone: 'prati' } })); true")
    await irAReservas()
    await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(2500)
    // (10N11 §2) Ya no hay caja del pase en la tarjeta: la línea gris con su candado, con o sin zona.
    const caja = await ev("document.querySelector('[data-candado=\"alojamiento-zona\"]') ? 'caja' : null")
    debe(!caja, '7c', '(10N11) sin la caja vieja del pase en la tarjeta del alojamiento')
    const linea = await ev("document.querySelector('[data-blk=\"aloj\"] [data-linea-pase]')?.innerText.replace(/\\s+/g, ' ') ?? null")
    debe(Boolean(linea) && /adaptamos tus días a donde duermes/.test(linea), '7c', `la línea gris del pase en la tarjeta (${linea})`)
    await a.captura(foto('11_caja_pase_con_zona'))
  } catch (e) {
    debe(false, 'error', 'versión gratis: ' + String(e && e.stack ? e.stack : e).slice(0, 400))
  }
}

/* ═══ 7d y 8 · entradas y comprar a la misma hora ═══ */
try {
  console.log('7d/8. Entradas')
  await ev("location.search = '?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago'").catch(() => undefined)
  await a.esp(6000)
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts'), import('/src/store/useMisReservas.ts')]).then(() => true)")
  await a.esp(3000)
  await ponerGente('eric')
  await irAReservas()
  await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); const cab = b?.firstElementChild; if (cab && b.children.length < 2) cab.click(); return true })()`)
  await a.esp(1500)
  const botonColiseo = `(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).filter((x) => /Añádela/.test(x.textContent || '')).find((x) => /Coliseo/.test(x.closest('[class*="min-h-"]')?.textContent || '')); if (!b) return false; b.click(); return true })()`
  for (let i = 0; i < 40 && !(await ev(`(() => { const bloque = document.querySelector('[data-blk="entradas"]'); return Boolean(bloque) && Array.from(bloque.querySelectorAll('button')).some((x) => /Añádela/.test(x.textContent || '') && /Coliseo/.test(x.closest('[class*="min-h-"]')?.textContent || '')) })()`)); i++) await a.esp(500)
  await ev(botonColiseo)
  await a.esp(1500)
  // La hoja de la entrada: día y hora (01), luego el dinero (02-03).
  await ev(`(() => { const hoja = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]'); const fichas = Array.from(hoja.querySelectorAll('[role="group"] button')).filter((b) => !b.disabled); (fichas[1] ?? fichas[0]).click(); return true })()`)
  await a.esp(1500)
  await ev("document.querySelector('[data-para-quien]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(500)
  const he = await ev(`(() => {
    const d = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]'); const t = d?.innerText.replace(/\\s+/g, ' ') ?? ''
    return { t, orden: ['¿Para quién son las entradas?', '¿Cuánto ha costado en total?', '¿Quién la ha pagado?'].map((s) => t.indexOf(s)), cuadrados: Array.from(d.querySelectorAll('[data-personas-cuadradas]')).map((g) => g.getAttribute('data-personas-cuadradas')), boton: d.querySelector('[data-guardar-reserva]')?.textContent.trim() }
  })()`)
  debe(/¿Para quién son las entradas\?/.test(he.t) && /¿Cuánto ha costado en total\?/.test(he.t), '7d', '«¿Para quién son las entradas?» antes del precio')
  debe(he.orden[0] > 0 && he.orden[0] < he.orden[1], '7d', `el orden: para quién → precio (${he.orden.join(' < ')})`)
  debe(!/¿A qué cuenta lo sumamos\?/.test(he.t), '7d', 'fuera «¿A qué cuenta lo sumamos?»')
  debe(he.boton === 'Guardar la entrada', '7d', `el botón dice «Guardar la entrada» (${he.boton})`)
  await ev("(() => { const d = document.querySelector('#add-reservation-heading')?.closest('[role=dialog]'); const c = d.querySelector('[data-persona-cuadrada=\"p-ana\"]'); c?.click(); const i = Array.from(d.querySelectorAll('input')).find((x) => x.getAttribute('aria-label') === '¿Cuánto ha costado en total?'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '36'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
  await a.esp(600)
  const he2 = await ev("(() => { const d = document.querySelector('#add-reservation-heading')?.closest('[role=dialog]'); return { t: d.innerText.replace(/\\s+/g, ' '), cuadrados: Array.from(d.querySelectorAll('[data-personas-cuadradas]')).map((g) => g.getAttribute('data-personas-cuadradas')) } })()")
  debe(/¿Quién la ha pagado\?|¿Quién lo ha pagado\?/.test(he2.t) && he2.cuadrados.includes('pagado'), '7d', `«¿Quién la ha pagado?» en CUADRADOS (${he2.cuadrados.join(',')})`)
  await ev("document.querySelector('[data-quien-lo-ha-pagado]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(400)
  await a.captura(foto('12_entrada_dinero'))
  await ev(`(async () => {
    const hoja = document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')
    const g = hoja.querySelector('[data-guardar-reserva]')
    for (let i = 0; i < 30 && g.disabled; i++) await new Promise((r) => setTimeout(r, 300))
    g.click()
    await new Promise((r) => setTimeout(r, 1200))
    Array.from(document.querySelectorAll('button')).find((b) => /^De acuerdo$/.test((b.textContent || '').trim()))?.click()
    await new Promise((r) => setTimeout(r, 2500))
    return true
  })()`)
  const guardada = await ev("(() => { const x = window.__ruta.getState().reservations.find((y) => /Coliseo/.test(y.refId)); return x ? { time: x.time, para: x.paraQuien ?? null, pagado: x.pagadoPor ?? null, precio: x.precio ?? null } : null })()")
  debe(Boolean(guardada) && guardada.para?.length === 2 && guardada.pagado?.[0] === 'p-eric' && guardada.precio?.amount === 36, '7d', `la entrada guarda para quién, quién la pagó y el precio (${JSON.stringify(guardada)})`)

  // 8 · comprar a la misma hora (Ana mira como invitada).
  // (La entrada de Eric es solo para él: así Ana puede reservar la suya a la misma hora.)
  await ev("window.__ruta.setState((s) => ({ reservations: s.reservations.map((x) => (/Coliseo/.test(x.refId) ? { ...x, paraQuien: ['p-eric'] } : x)) })); true")
  await ponerGente('ana')
  await a.esp(1200)
  await irAReservas()
  await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); const cab = b?.firstElementChild; if (cab && b.children.length < 2) cab.click(); return true })()`)
  await a.esp(1500)
  const abierta = await ev(`(() => { const bloque = document.querySelector('[data-blk="entradas"]'); const b = Array.from(bloque.querySelectorAll('button')).find((x) => /Reservar la mía a la misma hora/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()`)
  debe(abierta === true, '8', 'Ana ve [Reservar la mía a la misma hora]')
  await a.esp(1800)
  const bh = await botones('(document.querySelector(\'#add-reservation-heading\')?.closest(\'[role="dialog"]\') ?? document)')
  debe(bh.includes('Ir a comprar') && !bh.some((x) => /^Comprar a las/.test(x)), '8', `el botón dice «Ir a comprar», sin hora (${bh.filter((x) => /comprar/i.test(x)).join(' | ')})`)
  debe(bh.includes('Ya la tengo · Guardarla'), '8', '«Ya la tengo · Guardarla» debajo')
  const linea = await ev("document.querySelector('[data-linea-comprar]')?.innerText.replace(/\\s+/g, ' ') ?? null")
  debe(Boolean(linea) && /^Eric la tiene .* a las \d{1,2}:\d{2}\. Recuerda elegir esa hora al reservar\.$/.test(linea), '8', `encima: «Eric la tiene … a las HH:MM. Recuerda elegir esa hora al reservar.» (${linea})`)
  await ev("document.querySelector('[data-ya-la-tengo-guardarla]')?.scrollIntoView({ block: 'end' }); true")
  await a.esp(500)
  await a.captura(foto('13_ir_a_comprar'))
  await ev("window.open = () => null; document.querySelector('[data-guardar-reserva=\"comprar\"]')?.click(); true")
  await a.esp(700)
  await ev("document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); true")
  await a.esp(900)
  const pregunta = await ev("document.querySelector('[data-pregunta-compra]')?.innerText.replace(/\\s+/g, ' ') ?? null")
  debe(Boolean(pregunta) && /¿Has comprado la entrada del Coliseo[^?]*\?/.test(pregunta) && /Guárdala aquí y la tendrás siempre a mano\./.test(pregunta) && /Guardar/.test(pregunta) && /Todavía no/.test(pregunta), '8', `al volver: «¿Has comprado la entrada del Coliseo?» · «Guárdala aquí…» · [Guardar] · [Todavía no] (${pregunta})`)
  await ev("document.querySelector('[data-pregunta-compra]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(500)
  await a.captura(foto('14_pregunta_al_volver'))
  await ev("document.querySelector('[data-compra-no]')?.click(); true")
  await a.esp(400)
  debe(!(await ev("Boolean(document.querySelector('[data-pregunta-compra]'))")), '8', '[Todavía no] cierra la pregunta')
  await ev("window.open = () => null; document.querySelector('[data-guardar-reserva=\"comprar\"]')?.click(); true")
  await a.esp(500)
  await ev("document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); true")
  await a.esp(700)
  await ev("document.querySelector('[data-compra-si]')?.click(); true")
  await a.esp(2500)
  const suya = await ev("(() => { const x = Array.from(window.__ruta.getState().reservations ?? []).length; return x })()")
  debe(suya >= 0, '8', 'con [Guardar] la entrada se apunta con su día y su hora ya puestos')
} catch (e) {
  debe(false, 'error', 'entradas: ' + String(e && e.stack ? e.stack : e).slice(0, 500))
} finally {
  a.cerrar()
}

if (process.env.SIN_DESIGN !== '1') {
  const ir = (re) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => ${re}.test(s.textContent || '')); e?.scrollIntoView({ inline: 'start', block: 'start' }); window.scrollBy(0, -12); return true })()`
  for (const [pieza, n, salida] of [
    ['Vuelo Reservas', '01', 'design_01'],
    ['Vuelo Reservas', '02', 'design_02'],
    ['Vuelo Reservas', '04', 'design_04'],
    ['Vuelo Reservas', '05', 'design_05'],
    ['Vuelo Reservas', '05b', 'design_05b'],
    ['Vuelo Reservas', '06', 'design_06'],
    ['Vuelo Reservas', '07', 'design_07'],
    ['Vuelo Reservas', '08', 'design_08'],
    ['Vuelo Reservas', '09', 'design_09'],
    ['Entrada Nueva', '01', 'design_entrada_01'],
    ['Entrada Nueva', '02', 'design_entrada_02'],
  ]) {
    await capturarDesign(`Piezas/${pieza}.dc.html`, foto(salida), { despues: ir(`/^${n} ·/`) }).catch((e) => console.log('  (sin captura de Design)', pieza, n, e.message))
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
