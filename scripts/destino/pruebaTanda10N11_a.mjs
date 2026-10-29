// Tanda 10N11 (agente A) · el alojamiento gratis y con pase (hoja «Tu alojamiento» 08/08o/08p/08q), la tarjeta de RESERVAS (09/09p), la línea del pase en la hoja del vuelo (02/03) y «Tú» con su inicial.
// Capturas docs/dias/capturas_jutrip/10n11_aloj_*.jpg y, al lado, las de Design (..._design.jpg; SIN_DESIGN=1 las salta).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N11_a.mjs
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
const foto = (n) => path.join(SALIDA, `10n11_aloj_${n}.jpg`)
const GENTE2 = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-viajes', nombre: 'Viajes', foto: null, esAdmin: false, permiso: 'editar' },
]

const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${process.env.VERSION ?? 'pago'}` })
const ev = (js) => a.evaluar(js)
const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const rutaDe = () => ev("(() => { const r = window.__ruta.getState().route; return { zona: r.accommodationZone ?? null, direccion: r.accommodationAddress ?? null, entre: r.cuentasEntre ?? null, pagado: r.pagadoPorDe ?? null } })()")
const ponerGente = () =>
  ev(`(async () => {
    const g = ${JSON.stringify(GENTE2)}.map((p) => ({ ...p, esYo: p.id === 'p-eric' }))
    sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso')
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
    const tiendas = [window.__viaje]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
    for (const st of new Set(tiendas)) { st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
    window.__modoCuentas?.poner('conjunta', g.length)
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
    const t = (d?.innerText.replace(/\\s+/g, ' ') ?? '').replace('NOMBRE DEL HOTEL', 'Nombre del hotel').replace('DIRECCIÓN DEL HOTEL', 'Dirección del hotel').replace('TU ZONA', 'Tu zona').replace(/DIRECCIÓN(?! DEL)/, 'Dirección')
    return {
      texto: t,
      botones: Array.from(d?.querySelectorAll('button') ?? []).map((b) => (b.textContent || '').trim()).filter(Boolean),
      lista: Boolean(d?.querySelector('[data-zonas-lista]')),
      desplegable: Boolean(d?.querySelector('[data-zona-desplegable]')),
      abiertas: d?.querySelectorAll('[data-zonas-abiertas] [data-zona-opcion]').length ?? 0,
      bloquePase: Boolean(d?.querySelector('[data-alojamiento-bloque-pase]')),
      lineaPase: Boolean(d?.querySelector('[data-linea-pase]')),
      candadoRedondo: d?.querySelectorAll('[data-candado-redondo]').length ?? 0,
      comoLlegar: Boolean(d?.querySelector('[data-como-llegar-alojamiento]')),
      cajaVieja: Boolean(d?.querySelector('[data-candado]')),
      pagado: (() => { const g = d?.querySelector('[data-personas-cuadradas="pagado"]'); return g ? { n: g.children.length, elegidas: Array.from(g.children).filter((c) => c.getAttribute('data-elegida') === '1').length } : null })(),
      para: (() => { const g = d?.querySelector('[data-personas-cuadradas="para-quien"]'); return g ? { n: g.children.length, elegidas: Array.from(g.children).filter((c) => c.getAttribute('data-elegida') === '1').length } : null })(),
      pos: ['Nombre del hotel', 'Buscar alojamiento', '¿En qué zona', '¿Dónde te alojas?', 'Dirección', '¿Para quién', '¿Cuánto ha costado', '¿Quién lo ha pagado?'].map((s) => t.indexOf(s)),
    }
  })()`)
const escribe = (sel, valor) =>
  ev(`(() => { const i = document.querySelector('[role=dialog] ${sel}'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(valor)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
const abrirHojaAloj = async () => {
  await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
  await a.esp(400)
  await ev("(() => { const b = document.querySelector('[data-blk=\"aloj\"]'); if (!b.querySelector('[data-anadir-alojamiento]')) b.firstElementChild.click(); return true })()")
  await a.esp(500)
  await clic('[data-anadir-alojamiento]')
  await a.esp(1300)
}
const arrancar = async (version) => {
  if (version) {
    await ev(`location.search = '?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${version}'`).catch(() => undefined)
    await a.esp(6000)
  }
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
  await ponerGente()
  await ev("window.__ruta.setState((s) => ({ route: { ...s.route, accommodationZone: null, accommodationAddress: null, cuentasEntre: undefined, pagadoPorDe: undefined }, accommodationSelections: {} })); true")
  await irAReservas()
}
const resetAloj = () => ev("window.__ruta.setState((s) => ({ route: { ...s.route, accommodationZone: null, accommodationAddress: null, cuentasEntre: undefined, pagadoPorDe: undefined }, accommodationSelections: {} })); true")

try {
  /* ═══ CON PASE ═══ */
  console.log('A1. Alojamiento con pase')
  await arrancar(null)
  await abrirHojaAloj()
  let m = await medidas()
  debe(/Nombre del hotel/.test(m.texto) && m.botones.includes('Buscar alojamiento'), 'A1', 'nombre del hotel y [Buscar alojamiento]')
  debe(m.lista && !m.desplegable, 'A1', 'la primera vez, la lista de zonas a la vista (08o)')
  debe(/Prati/.test(m.texto) && /Trastevere/.test(m.texto) && /Termini/.test(m.texto) && /Aún no lo sé/.test(m.texto), 'A1', 'Prati, Trastevere, Termini y «Aún no lo sé»')
  debe(!m.bloquePase && !m.lineaPase && !m.cajaVieja, 'A1', 'con pase, ni bloque con candado ni frase del pase ni la caja vieja')
  debe(m.pos[0] < m.pos[1] && m.pos[1] < m.pos[2] && m.pos[2] < m.pos[4] && m.pos[4] < m.pos[5] && m.pos[5] < m.pos[6], 'A1', `orden: nombre, buscar, zona, dirección, para quién, precio (${m.pos})`)
  debe(!/Tu primer día, cerca de donde duermes/.test(m.texto), 'A1', 'fuera la caja «Tu primer día, cerca de donde duermes»')
  debe(m.para && m.para.n === 2 && m.para.elegidas === 2, 'A1', `«¿Para quién…?» con los dos marcados (${JSON.stringify(m.para)})`)
  await escribe('[data-alojamiento-nombre]', 'Hotel Aurora')
  await clic('[data-zona-opcion="prati"]')
  await escribe('[data-alojamiento-direccion]', 'Via Cola di Rienzo, 45')
  await ev("(() => { const i = Array.from(document.querySelectorAll('[role=dialog] input')).find((x) => x.getAttribute('aria-label') === '¿Cuánto ha costado en total?'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '180'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
  await a.esp(600)
  m = await medidas()
  debe(m.pagado && m.pagado.n === 2 && m.pagado.elegidas === 2, 'A1', `«¿Quién lo ha pagado?» con TODAS las personas marcadas (${JSON.stringify(m.pagado)})`)
  debe(/90 € cada uno · Va a la cuenta conjunta/.test(m.texto), 'A1', '«90 € cada uno · Va a la cuenta conjunta»')
  debe(m.comoLlegar, 'A1', 'con la dirección, [Cómo llegar a tu alojamiento]')
  await a.captura(foto('01_hoja_con_pase_zona_elegida'))
  await clic('[data-guardar-alojamiento]')
  await a.esp(1500)
  let r = await rutaDe()
  debe(r.zona === 'prati', 'A1', `la zona se guarda (${r.zona})`)
  debe(r.direccion === 'Via Cola di Rienzo, 45', 'A1', `la dirección se guarda en el viaje (${r.direccion})`)
  await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
  await a.esp(600)
  const tarjeta = await ev("document.querySelector('[data-blk=\"aloj\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  debe(/Hotel Aurora/.test(tarjeta) && /Tu zona/i.test(tarjeta) && /Prati/.test(tarjeta) && /Via Cola di Rienzo, 45/.test(tarjeta) && /Cambiar/.test(tarjeta) && /Cómo llegar a tu alojamiento/.test(tarjeta) && /En este alojamiento/i.test(tarjeta) && /Tú/.test(tarjeta), 'A1', `tarjeta 09p (${tarjeta.slice(0, 200)})`)
  debe(!/Con el Pase/.test(tarjeta), 'A1', 'con pase, la tarjeta sin frase del pase')
  const inicial = await ev("(() => { const c = document.querySelector('[data-blk=\"aloj\"] [data-en-este-chips] span span'); return c ? c.textContent.trim() : null })()")
  debe(inicial === 'E', 'A1', `«Tú» con su inicial «E», no «T» (${inicial})`)
  await a.captura(foto('02_tarjeta_con_pase'))
  // Cambiar: desplegable cerrado y, al tocarlo, las demás.
  await ev("(() => { const b = Array.from(document.querySelectorAll('[data-tu-zona] button')).find((x) => /Cambiar/.test(x.textContent || '')); b?.click(); return true })()")
  await a.esp(1200)
  m = await medidas()
  debe(m.desplegable && !m.lista && /Tu zona/i.test(m.texto) && /Prati/.test(m.texto), 'A2', 'con la zona elegida, el desplegable cerrado (08p)')
  debe(m.comoLlegar && /Via Cola di Rienzo, 45/.test(await ev("Array.from(document.querySelectorAll('[role=dialog] input')).map((i) => i.value).join('|')")), 'A2', 'debajo, la dirección y [Cómo llegar a tu alojamiento]')
  await a.captura(foto('03_hoja_desplegable_cerrado'))
  await clic('[data-zona-desplegable]')
  await a.esp(500)
  m = await medidas()
  debe(m.abiertas >= 5, 'A2', `al tocarlo se abren las demás (08q) (${m.abiertas})`)
  await a.captura(foto('04_hoja_desplegable_abierto'))
  await cerrarHojas()
  // Vuelo con pase: sin la línea.
  await clic('[data-blk="llegada"] [data-llegada-vacia]')
  await a.esp(1200)
  m = await medidas()
  debe(!m.lineaPase && !/adaptamos tu primer y tu último día/.test(m.texto), 'A3', 'hoja del vuelo con pase: sin la línea del pase')
  debe(/¿Para quién es este vuelo\?/.test(m.texto), 'A3', '«¿Para quién es este vuelo?»')
  const chipV = await ev("Array.from(document.querySelectorAll('[role=dialog] [data-persona-cuadrada]')).map((b) => b.textContent.trim())")
  debe(chipV.some((t) => /^E/.test(t)), 'A3', `las personas del vuelo con su inicial (${JSON.stringify(chipV)})`)
  await cerrarHojas()
} catch (e) {
  debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 500))
}

/* ═══ SIN PASE ═══ */
try {
  console.log('A4. Alojamiento sin pase')
  await arrancar('gratis')
  await abrirHojaAloj()
  let m = await medidas()
  debe(/Nombre del hotel/.test(m.texto) && m.botones.includes('Buscar alojamiento'), 'A4', 'nombre del hotel y [Buscar alojamiento]')
  debe(m.bloquePase && /¿Dónde te alojas\?/.test(m.texto) && /Dirección del hotel/.test(m.texto), 'A4', 'bloque pequeño «¿Dónde te alojas?» y «Dirección del hotel»')
  debe(!m.lista && !m.desplegable && !/Trastevere/.test(m.texto), 'A4', 'sin la lista de zonas')
  debe(m.lineaPase && /Con el Pase Roma, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés\./.test(m.texto), 'A4', 'la línea gris con el candado')
  debe(m.candadoRedondo >= 2, 'A4', `candado dorado sobre azul (${m.candadoRedondo})`)
  debe(!m.cajaVieja, 'A4', 'sin la caja vieja del pase')
  debe(/¿Para quién es el alojamiento\?/.test(m.texto) && /¿Cuánto ha costado en total\?/.test(m.texto), 'A4', 'el dinero, gratis')
  await a.captura(foto('05_hoja_sin_pase'))
  await clic('[data-alojamiento-bloque-pase]')
  await a.esp(900)
  const aviso = await ev("Boolean(document.querySelector('[data-aviso-pase=\"alojamiento\"]')) && !document.querySelector('[data-lista-del-pase]')")
  debe(aviso, 'A4', '(10N12) al tocar el bloque, sale el aviso pequeño (no la lista)')
  await clic('[data-aviso-pase-ver]')
  await a.esp(900)
  await clic('[data-pelicula-cerrar]')
  await a.esp(600)
  await cerrarHojas()
  // Rellenar solo con lo gratis y guardar.
  await resetAloj()
  await abrirHojaAloj()
  await escribe('[data-alojamiento-nombre]', 'Hotel Aurora')
  await ev("(() => { const i = Array.from(document.querySelectorAll('[role=dialog] input')).find((x) => x.getAttribute('aria-label') === '¿Cuánto ha costado en total?'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '180'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
  await a.esp(500)
  m = await medidas()
  debe(m.pagado && m.pagado.elegidas === 2, 'A4', `«¿Quién lo ha pagado?» con todos marcados también gratis (${JSON.stringify(m.pagado)})`)
  await clic('[data-guardar-alojamiento]')
  await a.esp(1500)
  const r = await rutaDe()
  debe(r.zona === null && r.direccion === null, 'A4', 'sin pase no se guarda zona ni dirección')
  await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
  await a.esp(600)
  const tarjeta = await ev("document.querySelector('[data-blk=\"aloj\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  debe(/Hotel Aurora/.test(tarjeta) && /Con el Pase Roma, adaptamos tus días a donde duermes/.test(tarjeta) && /En este alojamiento/i.test(tarjeta) && /Tú/.test(tarjeta), 'A4', `tarjeta 09 (${tarjeta.slice(0, 220)})`)
  debe(!(await ev("Boolean(document.querySelector('[data-candado=\"alojamiento-zona\"]'))")), 'A4', 'fuera la caja del pase de la tarjeta')
  const inicial = await ev("(() => { const c = document.querySelector('[data-blk=\"aloj\"] [data-en-este-chips] span span'); return c ? c.textContent.trim() : null })()")
  debe(inicial === 'E', 'A4', `«Tú» con la inicial «E» (${inicial})`)
  await a.captura(foto('06_tarjeta_sin_pase'))
  // Vuelo sin pase: línea gris.
  await clic('[data-blk="llegada"] [data-llegada-vacia]')
  await a.esp(1200)
  m = await medidas()
  debe(m.lineaPase && /Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos\./.test(m.texto), 'A5', 'hoja del vuelo sin pase: la línea gris con el candado')
  debe(m.candadoRedondo >= 1, 'A5', 'con el candado dorado sobre azul')
  await a.captura(foto('07_vuelo_sin_pase'))
  await cerrarHojas()
} catch (e) {
  debe(false, 'error', 'sin pase: ' + String(e && e.stack ? e.stack : e).slice(0, 500))
}

/* ═══ Design al lado ═══ */
if (process.env.SIN_DESIGN !== '1') {
  try {
    const dis = (n, salida) => capturarDesign('Piezas/Vuelo Reservas.dc.html', path.join(SALIDA, `10n11_aloj_${salida}_design.jpg`), { despues: `(() => { const t = Array.from(document.querySelectorAll('*')).find((e) => e.children.length < 3 && (e.textContent || '').trim().startsWith(${JSON.stringify(n)})); t?.scrollIntoView({ block: 'start' }); return true })()` })
    await dis('08o', '01_hoja_con_pase_zona_elegida')
    await dis('09p', '02_tarjeta_con_pase')
    await dis('08p', '03_hoja_desplegable_cerrado')
    await dis('08q', '04_hoja_desplegable_abierto')
    await dis('08 ·', '05_hoja_sin_pase')
    await dis('09 ·', '06_tarjeta_sin_pase')
    await dis('02 ·', '07_vuelo_sin_pase')
  } catch (e) {
    console.log('Design no capturado:', String(e).slice(0, 200))
  }
}

try {
  await a.cerrar?.()
} catch {
  /* nada */
}
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
