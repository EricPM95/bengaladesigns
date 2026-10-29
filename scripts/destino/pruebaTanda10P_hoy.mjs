// La prueba de la Tanda 10P (agente B): la historia de prueba (la que el viajero elija, una por destino, guardada en la cuenta) y HOY con la puesta de sol y lo de mañana.
// Hace falta un servidor y un Vite propios:  APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10P_hoy.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `10p_hoy_${n}.jpg`)
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const H = "(await import('/src/lib/historiaDePrueba.ts'))"

// Un `speechSynthesis` simulado: hay voz en español y la lectura no acaba sola (así el estado se queda en «hablando»).
const VOZ = "Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'es-ES',name:'x'}],speak(){},cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}},configurable:true});window.SpeechSynthesisUtterance=function(t){this.text=t};window.Audio=function(){return {play:()=>Promise.reject(new Error('sin audio')),pause(){},addEventListener(){},removeEventListener(){},set onended(v){},set onerror(v){}}};(function(){const RD=Date;const base=RD.now();function fijo(){if(window.__horaFalsa==null)return null;const d=new RD();d.setHours(Math.floor(window.__horaFalsa/60),window.__horaFalsa%60,0,0);return d.getTime()+(RD.now()-base)%60000}class FD extends RD{constructor(...a){if(a.length===0){const f=fijo();super(f==null?RD.now():f)}else super(...a)}static now(){const f=fijo();return f==null?RD.now():f}}window.Date=FD})();"

async function conViaje(version, antes = VOZ) {
  for (let intento = 0; intento < 3; intento++) {
    const a = await conViajeUnaVez(version, antes)
    if (await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))").catch(() => false)) return a
    a.cerrar()
  }
  throw new Error('No se pudo crear el viaje de pruebas')
}
async function conViajeUnaVez(version, antes) {
  const q = version ? `&version=${version}` : ''
  const a = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on${q}`, antes })
  for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
  return a
}
const quitarAvisos = async (a) => {
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(700)
  }
}
const modo = async (a, m, dia = null) => {
  await a.evaluar(`${store}.then((s) => { s.setActiveDayId(${dia === null ? 'null' : 's.route.days[' + dia + '].id'}); s.setMode('${m}'); return true })`)
  await a.esp(2500)
  await quitarAvisos(a)
}
const abrirParada = (a, k) => a.evaluar(`(() => { const p = document.querySelectorAll('[data-stop-id]')[${k}]; if (!p) return false; (p.querySelector('button') || p).click(); return true })()`)
const cerrarFicha = async (a) => {
  await a.evaluar("(() => { const b = document.querySelector('button[aria-label=\"Volver\"]'); if (b) b.click(); return true })()")
  await a.esp(900)
}
const barra = (a) => a.evaluar("(() => { const e = document.querySelector('[data-escuchar-barra]'); if (!e) return null; return { modo: e.getAttribute('data-escuchar'), texto: e.innerText.replace(/\\s+/g, ' ').trim(), prueba: Boolean(e.querySelector('[data-escuchar-prueba]')), todas: e.querySelector('[data-escuchar-todas]')?.innerText ?? null, candadoDentro: Boolean(e.querySelector('[data-candado-dentro]')), oroGratis: (() => { const s = e.querySelector('[data-escuchar-prueba] span'); return s ? getComputedStyle(s).color : null })() } })()")
const ORO = ['rgb(111, 78, 55)', 'rgb(166, 124, 82)', 'rgb(233, 199, 122)']

/* ───────────────────────── 1. La lógica pura y la nube (sin navegador) ───────────────────────── */
{
  const app0 = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0' })
  let r
  for (let i = 0; i < 4 && !r; i++) r = await app0.evaluar(`(async () => {
    const m = ${H}
    const out = {}
    out.a1 = m.accesoDePrueba({}, 'Roma', 'Galería Borghese')
    const mapa = { roma: { sitio: 'galería borghese', nombre: 'Galería Borghese' } }
    out.suya = m.accesoDePrueba(mapa, ' Roma ', 'galería borghese')
    out.cerrada = m.accesoDePrueba(mapa, 'Roma', 'Coliseo')
    out.otroDestino = m.accesoDePrueba(mapa, 'París', 'Louvre')
    // la tabla no existe (migración sin aplicar): nada lanza y se queda lo local
    const sinTabla = { auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } } }) }, from: () => ({ select: async () => ({ data: null, error: { message: 'relation does not exist' } }), upsert: async () => ({ error: { message: 'relation does not exist' } }) }) }
    out.sinTablaSync = await m.sincronizarHistorias(sinTabla, mapa)
    out.sinTablaSubir = await m.subirHistoria('roma', mapa.roma, sinTabla)
    out.sinCliente = await m.sincronizarHistorias(null, mapa)
    const quePeta = { auth: { getSession: async () => { throw new Error('red caída') } }, from: () => { throw new Error('x') } }
    out.petaSync = await m.sincronizarHistorias(quePeta, mapa)
    out.petaSubir = await m.subirHistoria('roma', mapa.roma, quePeta)
    // con la tabla: lo de la cuenta manda y lo local que falta se sube
    const subidas = []
    const buena = { auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } } }) }, from: () => ({ select: async () => ({ data: [{ destino: 'roma', sitio: 'coliseo', nombre: 'Coliseo' }], error: null }), upsert: async (f) => { subidas.push(f); return { error: null } } }) }
    out.conTabla = await m.sincronizarHistorias(buena, { roma: mapa.roma, 'parís': { sitio: 'louvre', nombre: 'Louvre' } })
    out.subidas = subidas
    return out
  })()`)
  debe(r.a1 === 'abierta', 'logica', 'sin gastar, la historia de cualquier sitio está abierta')
  debe(r.suya === 'suya', 'logica', 'la gastada es suya (sin importar mayúsculas ni espacios)')
  debe(r.cerrada === 'cerrada', 'logica', 'otra del mismo destino, cerrada')
  debe(r.otroDestino === 'abierta', 'logica', 'en otro destino hay otra de prueba (una por destino)')
  debe(JSON.stringify(r.sinTablaSync) === JSON.stringify({ roma: { sitio: 'galería borghese', nombre: 'Galería Borghese' } }), 'tabla', 'con la tabla inexistente la sincronización devuelve lo local sin lanzar')
  debe(r.sinTablaSubir === false, 'tabla', 'subir con la tabla inexistente devuelve false (no lanza)')
  debe(Object.keys(r.sinCliente).length === 1, 'tabla', 'sin Supabase se queda con lo local')
  debe(Object.keys(r.petaSync).length === 1 && r.petaSubir === false, 'tabla', 'con la red caída tampoco lanza')
  debe(r.conTabla.roma.sitio === 'coliseo' && r.conTabla['parís'].sitio === 'louvre', 'nube', 'con la tabla: lo de la cuenta manda (Roma = Coliseo) y se conserva lo local de otro destino')
  debe(r.subidas.length === 1 && r.subidas[0].destino === 'parís', 'nube', `y solo se sube lo que la cuenta no tenía (${JSON.stringify(r.subidas.map((x) => x.destino))})`)
  app0.cerrar()
}

/* ───────────────────────── 2. Sin pase: la historia de prueba, en la ficha ───────────────────────── */
{
  const a = await conViaje('gratis')
  await modo(a, 'days', 0)
  const total = await a.evaluar("document.querySelectorAll('[data-stop-id]').length")
  let primera = -1
  let b0 = null
  for (let k = 0; k < Math.min(total, 8) && primera < 0; k++) {
    await abrirParada(a, k)
    await a.esp(2500)
    b0 = await barra(a)
    if (b0) primera = k
    else await cerrarFicha(a)
  }
  debe(primera >= 0, 'prueba', 'hay una parada con historia donde probar')
  debe(Boolean(b0) && b0.prueba && /Gratis/.test(b0.texto) && /tu historia de prueba/.test(b0.texto) && /0\/1/.test(b0.texto), 'prueba', `antes de usarla: «Escuchar historia · Gratis, tu historia de prueba · 0/1» (${b0?.texto})`)
  debe(Boolean(b0) && b0.modo !== 'candado' && !b0.candadoDentro, 'prueba', 'y el botón sale abierto (sin candado)')
  debe(Boolean(b0) && ORO.includes(b0.oroGratis), 'prueba', `«Gratis» en oro (${b0?.oroGratis})`)
  await a.captura(png('historia_prueba'))
  const nombre = await a.evaluar("document.querySelector('h1,h2')?.innerText ?? ''")
  // tocar play
  await a.evaluar("(() => { document.querySelector('[data-escuchar-barra] button[aria-label=\"Escuchar historia\"]')?.click(); return true })()")
  await a.esp(1400)
  let mapa = await a.evaluar(`import('/src/lib/historiaDePrueba.ts').then((m) => m.useHistoriaDePrueba.getState().mapa)`)
  debe(Object.keys(mapa).length === 0, 'gasto', 'a los 1,4 s todavía no se ha gastado')
  await a.esp(2600)
  mapa = await a.evaluar(`import('/src/lib/historiaDePrueba.ts').then((m) => m.useHistoriaDePrueba.getState().mapa)`)
  debe(mapa.roma && typeof mapa.roma.sitio === 'string', 'gasto', `a los 4 s se ha gastado, en Roma (${JSON.stringify(mapa)})`)
  const guardado = await a.evaluar("window.localStorage.getItem('trazo:historia-prueba:v1')")
  debe(Boolean(guardado) && JSON.parse(guardado).roma, 'gasto', 'y queda guardada en el móvil (copia local)')
  const b1 = await barra(a)
  debe(Boolean(b1) && !b1.candadoDentro && !/0\/1/.test(b1.texto), 'gasto', 'la gastada se sigue pudiendo escuchar (sin candado)')
  await cerrarFicha(a)
  // otra parada con historia: cerrada, con su texto
  let segunda = -1
  let b2 = null
  for (let k = 0; k < Math.min(total, 10) && segunda < 0; k++) {
    if (k === primera) continue
    await abrirParada(a, k)
    await a.esp(2500)
    const b = await barra(a)
    if (b) {
      segunda = k
      b2 = b
    } else await cerrarFicha(a)
  }
  debe(segunda >= 0 && Boolean(b2), 'cerrada', 'hay otra parada con historia')
  debe(Boolean(b2) && b2.modo === 'candado' && b2.candadoDentro, 'cerrada', 'las demás, con el candado dorado dentro del botón')
  debe(Boolean(b2) && /Todas las historias, con el Pase Roma/.test(b2.todas ?? ''), 'cerrada', `con el texto «Todas las historias, con el Pase Roma» (${b2?.todas})`)
  const oro = await a.evaluar("(() => { const m = document.querySelector('[data-escuchar-todas] [data-marca]'); return m ? getComputedStyle(m).color : null })()")
  debe(ORO.includes(oro), 'cerrada', `«Pase Roma» en oro (${oro})`)
  await a.captura(png('historia_cerrada'))
  await cerrarFicha(a)
  // la suya sigue abierta
  await abrirParada(a, primera)
  await a.esp(2500)
  const b3 = await barra(a)
  debe(Boolean(b3) && b3.modo !== 'candado', 'gasto', 'volviendo a la primera, sigue abierta (esa historia se queda suya todo el viaje)')
  await cerrarFicha(a)
  // otro destino: otra de prueba
  const otro = await a.evaluar(`(async () => {
    const m = ${H}
    const antes = m.accesoDePrueba(m.useHistoriaDePrueba.getState().mapa, 'París', 'Louvre')
    m.useHistoriaDePrueba.getState().gastar('París', 'Louvre')
    const mapa = m.useHistoriaDePrueba.getState().mapa
    return { antes, destinos: Object.keys(mapa).sort(), roma: mapa.roma?.sitio, otraEnParis: m.accesoDePrueba(mapa, 'París', 'Orsay'), roma2: m.accesoDePrueba(mapa, 'Roma', 'Coliseo') }
  })()`)
  debe(otro.antes === 'abierta' && otro.destinos.length === 2 && otro.otraEnParis === 'cerrada', 'destino', `París tiene su propia historia de prueba (${JSON.stringify(otro.destinos)})`)
  a.cerrar()
}

/* ───────────────────────── 3. El día de prueba de HOY no la gasta ───────────────────────── */
{
  const a = await conViaje('gratis')
  await modo(a, 'days', 0)
  await a.evaluar("import('/src/lib/pago.ts').then((m) => { m.fijarDiaDePrueba(true); return true })")
  let b = null
  for (let k = 0; k < 8 && !b; k++) {
    await abrirParada(a, k)
    await a.esp(2500)
    b = await barra(a)
    if (!b) await cerrarFicha(a)
  }
  debe(Boolean(b) && !b.prueba && !b.candadoDentro, 'dia_de_prueba', 'en el día de prueba la historia sale abierta, sin «0/1»')
  await a.evaluar("(() => { document.querySelector('[data-escuchar-barra] button[aria-label=\"Escuchar historia\"]')?.click(); return true })()")
  await a.esp(4500)
  const mapa = await a.evaluar(`import('/src/lib/historiaDePrueba.ts').then((m) => m.useHistoriaDePrueba.getState().mapa)`)
  debe(Object.keys(mapa).length === 0, 'dia_de_prueba', `y escucharla 4 s NO gasta la historia de prueba (${JSON.stringify(mapa)})`)
  a.cerrar()
}

/* ───────────────────────── 4. HOY con pase: la puesta de sol y lo de mañana ───────────────────────── */
const PREPARAR = (hoy, extra = '') => `(async () => {
  const st = ${R}
  const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
  const r = structuredClone(st.getState().route)
  r.days.forEach((d) => { d.sunsetText = 'Hoy el sol se pone a las 17:02'; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset }) })
  ${extra}
  st.setState({ route: r })
  st.getState().setDevSimulatedTodayIso('${hoy}')
  st.getState().setActiveDayId(null)
  st.getState().setMode('today')
  return true
})()`
const textoDe = (a, sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
{
  const a = await conViaje(null)
  // (a) la siguiente parada es un mirador del atardecer
  await a.evaluar(PREPARAR('2026-10-17', "const sig = numberedStopsOf(r.days[0])[0]; sig.isSunset = true; sig.name = 'El Janículo'"))
  await a.esp(3500)
  debe(await a.evaluar("Boolean(document.querySelector('[data-hoy-siguiente]'))"), 'hoy', 'HOY enseña la siguiente parada')
  let t = await textoDe(a, '[data-hoy-atardecer="siguiente"]')
  if (!t) console.log('DEBUG', (await a.evaluar('document.body.innerText')).slice(0, 700))
  debe(t === 'Al Janículo para el atardecer: el sol se pone a las 17:02', 'atardecer', `con mirador del atardecer de siguiente: «${t}»`)
  debe(await a.evaluar("Boolean(document.querySelector('[data-hoy-atardecer] svg'))"), 'atardecer', 'con el icono del sol')
  await a.evaluar("(() => { document.querySelector('[data-hoy-atardecer]')?.scrollIntoView({ block: 'center' }); return true })()")
  await a.esp(500)
  await quitarAvisos(a)
  await a.captura(png('atardecer'))
  await a.evaluar('window.__horaFalsa = 15 * 60 + 30; true')
  // (b) sin mirador en lo que queda de hoy y uno cerca a media tarde (en otro día, a unos 6 min)
  await a.evaluar(PREPARAR('2026-10-17', "const sig = numberedStopsOf(r.days[0])[0]; sig.time = '15:00'; const m = numberedStopsOf(r.days[1])[0]; m.isSunset = true; m.name = 'El Janículo'; m.coordinates = { lat: sig.coordinates.lat + 0.004, lng: sig.coordinates.lng }"))
  await a.esp(3000)
  t = await textoDe(a, '[data-hoy-atardecer="cerca"]')
  debe(Boolean(t) && /^Hoy el sol se pone a las 17:02 · el Janículo está a \d+ min$/.test(t), 'atardecer', `sin mirador hoy y uno cerca: «${t}»`)
  // (c) sin mirador cerca: nada
  await a.evaluar(PREPARAR('2026-10-17', "const sig = numberedStopsOf(r.days[0])[0]; sig.time = '15:00'"))
  await a.esp(3000)
  debe((await textoDe(a, '[data-hoy-atardecer]')) === null, 'atardecer', 'sin ningún mirador del atardecer cerca, no dice nada')
  await a.evaluar('window.__horaFalsa = null; true')
  // (d) sin la hora del sol, no inventa
  await a.evaluar(PREPARAR('2026-10-17', "r.days.forEach((d) => { delete d.sunsetText }); const sig = numberedStopsOf(r.days[0])[0]; sig.isSunset = true"))
  await a.esp(3000)
  debe((await textoDe(a, '[data-hoy-atardecer]')) === null, 'atardecer', 'si el día no trae la hora del sol, no se dice ninguna')
  // (e) lo de mañana: todo visto, con reserva con hora
  await a.evaluar(PREPARAR('2026-10-17', "numberedStopsOf(r.days[0]).forEach((s) => { s.checkedInAt = new Date().toISOString() }); numberedStopsOf(r.days[1])[0].time = '09:00'; st.setState({ reservations: [{ id: 'r-vat', kind: 'entrada', refId: 'Museos Vaticanos', name: 'Museos Vaticanos', placeNames: ['Museos Vaticanos'], dateIso: '2026-10-18', dayNumber: 2, time: '10:00' }] })"))
  await a.esp(3500)
  t = await textoDe(a, '[data-hoy-manana]')
  debe(Boolean(t) && /^Mañana: .+ · empiezas a las 9:00/.test(t), 'manana', `al acabar el día: «${t}»`)
  debe(Boolean(t) && /Tienes entrada a Museos Vaticanos a las 10:00/.test(t), 'manana', 'con la reserva con hora del día siguiente')
  const tarjeta = t
  await modo(a, 'days', 0)
  const titulos = await a.evaluar("Array.from(document.querySelectorAll('[data-titulo-del-dia]')).map((e) => e.innerText.split(/[ \\n\\t]+/).join(' ').trim())")
  debe(titulos.length > 1 && (tarjeta ?? '').includes(titulos[1]), 'manana', `el nombre del día es el de DÍAS («${titulos[1]}»)`)
  await a.evaluar(PREPARAR('2026-10-17', "numberedStopsOf(r.days[0]).forEach((s) => { s.checkedInAt = new Date().toISOString() }); numberedStopsOf(r.days[1])[0].time = '09:00'; st.setState({ reservations: [{ id: 'r-vat', kind: 'entrada', refId: 'Museos Vaticanos', name: 'Museos Vaticanos', placeNames: ['Museos Vaticanos'], dateIso: '2026-10-18', dayNumber: 2, time: '10:00' }] })"))
  await a.esp(3000)
  await a.evaluar("(() => { document.querySelector('[data-hoy-manana]')?.scrollIntoView({ block: 'center' }); return true })()")
  await a.esp(500)
  await quitarAvisos(a)
  await a.captura(png('manana'))
  // (f) sin reserva: solo la frase
  await a.evaluar(PREPARAR('2026-10-17', "numberedStopsOf(r.days[0]).forEach((s) => { s.checkedInAt = new Date().toISOString() }); st.setState({ reservations: [] })"))
  await a.esp(3000)
  debe((await textoDe(a, '[data-hoy-manana-reserva]')) === null && Boolean(await textoDe(a, '[data-hoy-manana]')), 'manana', 'sin reserva mañana, solo la frase')
  await a.evaluar('window.__horaFalsa = 10 * 60; true')
  // (g) el día no se ha acabado: nada de mañana (si no es la hora de la cena)
  const horaCena = await a.evaluar(`${store}.then((s) => s.route.days[0].meals.find((m) => m.mealTime === 'dinner')?.time ?? null)`)
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes()
  const cenaMin = horaCena ? Number(horaCena.slice(0, 2)) * 60 + Number(horaCena.slice(3, 5)) : null
  await a.evaluar(PREPARAR('2026-10-17', ''))
  await a.esp(3000)
  if (cenaMin === null || ahoraMin < cenaMin) debe((await textoDe(a, '[data-hoy-manana]')) === null, 'manana', 'con paradas pendientes y antes de la cena, todavía no sale')
  await a.evaluar('window.__horaFalsa = null; true')
  // (h) el último día del viaje: nada
  await a.evaluar(PREPARAR('2026-10-20', "numberedStopsOf(r.days[3]).forEach((s) => { s.checkedInAt = new Date().toISOString() })"))
  await a.esp(3000)
  debe((await textoDe(a, '[data-hoy-manana]')) === null, 'manana', 'el último día del viaje, nada')
  a.cerrar()
}

/* ───────────────────────── 5. HOY sin pase: como antes ───────────────────────── */
{
  const a = await conViaje('gratis')
  await a.evaluar(PREPARAR('2026-10-17', "const sig = numberedStopsOf(r.days[0])[0]; sig.isSunset = true; numberedStopsOf(r.days[0]).forEach((s) => { s.checkedInAt = new Date().toISOString() })"))
  await a.esp(3500)
  debe((await textoDe(a, '[data-hoy-atardecer]')) === null && (await textoDe(a, '[data-hoy-manana]')) === null, 'sin_pase', 'sin pase, HOY no enseña ni la puesta de sol ni lo de mañana')
  a.cerrar()
}

try {
  fs.rmSync('/tmp/x', { force: true })
} catch {
  /* nada */
}
console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
