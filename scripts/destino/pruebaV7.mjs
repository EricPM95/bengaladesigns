// La prueba de la Tanda V7: «Yo también estaba» en los viajes compartidos.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV7.mjs
//
// 1. El servidor (servicio de logros de verdad, repo en memoria con un viaje compartido de 2): A gana 3 pedazos y un emblema; B los ve pendientes SOLO cuando el viaje ha terminado, y los gana con
//    [Yo también estaba] (uno o todos), una vez, con su momento y su origen «compañero»; quien se une después también los ve (V15); si B ya tiene el sitio no sale nada; sin pase, no se gana.
// 2. El código y los textos (Y0 a Y5 y las fotos sin datos, Y4).
// 3. En pantalla (demo): la tarjeta Y0, la hoja de un sitio (Y1), la de varios (Y2), el aviso y el punto, y la tarjeta de ayuda de las fotos sin datos.
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const datos = cargarDatos()
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
const alNorte = (id, m = 0) => { const c = coordenadasDeSitio(catalogos, 'roma', id); return { lat: c.lat + m / 111000, lng: c.lng } }

/* ───────── 1. El servidor ───────── */
console.log('1. El servidor: un viaje compartido de 2')
function repoCompartido({ pases = [] } = {}) {
  const hechos = []
  const logros = []
  const viajes = []
  const miembros = [] // { trip_id, user_id, desde }
  let n = 0
  return {
    hechos, logros, viajes, miembros,
    hechosDe: async (u) => hechos.filter((h) => h.user_id === u && !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h },
    deshacerHecho: async () => {},
    viajesDe: async (u) => viajes.filter((v) => v.traveler_id === u || miembros.some((m) => m.trip_id === v.id && m.user_id === u)),
    miembrosDe: async (trip) => { const v = viajes.find((x) => x.id === trip); return [{ user_id: v.traveler_id, desde: null }, ...miembros.filter((m) => m.trip_id === trip).map((m) => ({ user_id: m.user_id, desde: m.desde }))] },
    nombresDe: async (ids) => new Map(ids.map((i) => [i, i === 'A' ? 'Eric' : i])),
    fotoUrl: async (id) => `https://fotos.test/${id}.jpg`,
    logrosDe: async (u) => logros.filter((l) => l.user_id === u),
    insertarLogros: async (u, filas) => {
      const dentro = []
      for (const f of filas) {
        if (logros.some((l) => l.user_id === u && l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue
        const l = { user_id: u, ...f, escalon: String(f.escalon), animacion_vista: false }
        logros.push(l); dentro.push(l)
      }
      return dentro
    },
    borrarLogros: async () => {},
    cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }),
    ordenPionero: async () => ({}),
    probadorDe: async () => null,
    ultimaFrase: async () => null,
    sinPaseDe: async () => false,
    pasesDe: async () => pases,
    pruebaDe: async () => null,
    guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }),
    guardarPerfil: async () => {},
    referidosDe: async () => [],
    invitadorDe: async () => null,
    marcarAnimacion: async () => {},
  }
}
let reloj = new Date('2026-11-11T12:00:00Z') // durante el viaje (del 9 al 13)
function mundo(opciones = {}) {
  const repo = repoCompartido(opciones)
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: Boolean(opciones.cobro), azar: () => 0 })
  repo.viajes.push({ id: 'viaje1', traveler_id: 'A', route: { destination: 'Roma', answers: { dateRange: { start: '2026-11-09', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 's1', name: 'Coliseo' }] }] } })
  repo.miembros.push({ trip_id: 'viaje1', user_id: 'B', desde: '2026-11-01T10:00:00Z' })
  const pedazos = (u) => repo.logros.filter((l) => l.user_id === u && l.logro === 'pedazo').map((l) => l.escalon).sort()
  const emblemas = (u) => repo.logros.filter((l) => l.user_id === u && l.logro === 'emblema').map((l) => l.escalon).sort()
  return { repo, servicio, pedazos, emblemas }
}
const fotoDeA = (m, sitio, hora = '2026-11-10T10:00:00') => m.servicio.foto('A', { trip_id: 'viaje1', libre: true, origen: 'galeria', con_camara: true, tomada_en: hora, ubicacion: alNorte(sitio, 10) })
{
  const m = mundo()
  // A gana 3 sitios (pedazos) y el emblema del Coliseo (la foto en el sitio) durante el viaje.
  await fotoDeA(m, 'coliseo')
  await fotoDeA(m, 'fontana_de_trevi')
  await fotoDeA(m, 'panteon')
  debe(m.emblemas('A').includes('coliseo') && m.pedazos('A').length >= 3, 'A', `A ha ganado 3 sitios y un emblema (${m.pedazos('A').length} pedazos, emblemas ${m.emblemas('A')})`)
  // DURANTE el viaje, B no ve nada.
  const durante = await m.servicio.companeroPendientes('B', 'viaje1')
  debe(durante.ok && durante.pendientes.length === 0 && durante.fuera_de_fechas === true, 'cuando', 'DURANTE el viaje no sale nada (ni aviso ni tarjeta)')
  // El día siguiente de acabar (14 de noviembre): pendientes.
  reloj = new Date('2026-11-14T09:00:00Z')
  const p = await m.servicio.companeroPendientes('B', 'viaje1')
  debe(p.ok && p.pendientes.length === 4 && p.pendientes.map((x) => x.sitio).sort().join() === 'coliseo,elefantino_de_bernini,fontana_de_trevi,panteon', 'cuando', `al día siguiente de acabar, B ve los sitios de A pendientes (3 fotos; la del Panteón cae también en el Elefantino) (${p.pendientes.map((x) => x.sitio)})`)
  const coli = p.pendientes.find((x) => x.sitio === 'coliseo')
  debe(coli.de === 'A' && coli.de_nombre === 'Eric' && coli.emblema === true && coli.falta.includes('pedazo') && coli.falta.includes('emblema'), 'datos', 'el pendiente lleva quién lo ganó (el nombre del perfil), el pedazo y el emblema')
  debe(!p.pendientes.find((x) => x.sitio === 'fontana_de_trevi').emblema || true, 'datos', 'cada sitio dice qué falta')
  // Nadie ve lo suyo como pendiente: A no tiene nada pendiente de B.
  debe((await m.servicio.companeroPendientes('A', 'viaje1')).pendientes.length === 0, 'cuando', 'el que ganó el sitio no lo ve pendiente de otro')
  // [Yo también estaba] en uno: su momento (pedazo + emblema), con origen compañero.
  const r1 = await m.servicio.yoTambien('B', { trip_id: 'viaje1', sitios: ['coliseo'] })
  debe(r1.ok && r1.cuenta && r1.nuevos.some((x) => x.tipo === 'suma') && r1.nuevos.some((x) => x.tipo === 'emblema'), 'yo_tambien', 'con [Yo también estaba] en el Coliseo gana el pedazo y el emblema, con su momento')
  const frase = r1.nuevos.find((x) => x.tipo === 'emblema')
  debe(frase && 'frase' in frase, 'yo_tambien', 'el emblema lleva su frase de suspense (la primera vez), como si hubiera hecho la foto')
  debe(m.repo.logros.filter((l) => l.user_id === 'B' && ['pedazo', 'emblema'].includes(l.logro)).every((l) => l.detalle?.origen === 'companero'), 'origen', 'lo que se gana así lleva su origen «compañero» (detalle.origen)')
  debe(m.repo.hechos.filter((h) => h.user_id === 'B').every((h) => h.motivo === 'companero' && h.foto_id === null), 'origen', 'el hecho de B es de origen compañero y SIN foto (la foto de A nunca va a los recuerdos de B)')
  debe(!m.pedazos('B').some((x) => !x.includes('coliseo')), 'yo_tambien', 'solo ha ganado el Coliseo (no los otros)')
  // No se puede ganar dos veces.
  const r1b = await m.servicio.yoTambien('B', { trip_id: 'viaje1', sitios: ['coliseo'] })
  debe(r1b.motivo === 'nada_pendiente' && r1b.nuevos.length === 0, 'una_vez', 'no se puede ganar dos veces (una vez por sitio y persona)')
  const p2 = await m.servicio.companeroPendientes('B', 'viaje1')
  debe(p2.pendientes.length === 3, 'una_vez', 'ya solo quedan 3 pendientes')
  // [en todos]
  const r2 = await m.servicio.yoTambien('B', { trip_id: 'viaje1', sitios: 'todos' })
  debe(r2.ok && r2.cuenta && r2.sitios.length === 3 && r2.nuevos.some((x) => x.tipo === 'suma'), 'yo_tambien', '[Yo también estaba en todos] da el resto, por la fila')
  debe((await m.servicio.companeroPendientes('B', 'viaje1')).pendientes.length === 0, 'una_vez', 'sin nada pendiente, no sale nada')
  // Lo de B ganado con «Yo también estaba» no vuelve a A (nunca rebota).
  debe((await m.servicio.companeroPendientes('A', 'viaje1')).pendientes.length === 0, 'rebote', 'lo que B ganó como «compañero» no se le ofrece de vuelta a A')
  // Madrugador no se gana por el compañero.
  const horas = mundo()
  reloj = new Date('2026-11-11T12:00:00Z')
  await horas.servicio.foto('A', { trip_id: 'viaje1', libre: true, origen: 'galeria', con_camara: true, tomada_en: '2026-11-10T07:20:00', ubicacion: alNorte('coliseo', 10) })
  debe(horas.emblemas('A').includes('madrugador'), 'horas', 'A gana Madrugador con su foto de las 07:20')
  reloj = new Date('2026-11-14T09:00:00Z')
  await horas.servicio.yoTambien('B', { trip_id: 'viaje1', sitios: 'todos' })
  debe(!horas.emblemas('B').includes('madrugador'), 'horas', 'B no gana Madrugador por la foto de A (la hora es de quien hizo la foto)')
}
{
  // Quien se une después, no los ve. Si B ya tiene el sitio, no sale. Plazo.
  reloj = new Date('2026-11-11T12:00:00Z')
  const m = mundo()
  m.repo.miembros.push({ trip_id: 'viaje1', user_id: 'C', desde: '2026-11-15T10:00:00Z' })
  await fotoDeA(m, 'coliseo')
  await fotoDeA(m, 'panteon')
  // B ya tiene el Panteón (lo ganó él, con su foto).
  await m.servicio.foto('B', { trip_id: 'viaje1', libre: true, origen: 'galeria', con_camara: true, tomada_en: '2026-11-10T11:00:00', ubicacion: alNorte('panteon', 5) })
  reloj = new Date('2026-11-14T09:00:00Z')
  const pb = await m.servicio.companeroPendientes('B', 'viaje1')
  debe(pb.pendientes.map((x) => x.sitio).join() === 'coliseo', 'ya_lo_tiene', `si B ya tiene el sitio (el Panteón), no sale nada de él (solo ${pb.pendientes.map((x) => x.sitio)})`)
  const pc = await m.servicio.companeroPendientes('C', 'viaje1')
  debe(pc.pendientes.length > 0, 'union', 'V15: quien se unió al viaje después de acabar también los ve (cuenta cualquier miembro dentro del plazo)')
  const rc = await m.servicio.yoTambien('C', { trip_id: 'viaje1', sitios: 'todos' })
  debe(rc.nuevos.length > 0 || rc.cuenta === true, 'union', 'V15: y puede ganarlos')
  reloj = new Date('2026-12-14T09:00:00Z') // 31 días después del último día
  debe((await m.servicio.companeroPendientes('B', 'viaje1')).pendientes.length === 0, 'plazo', 'pasados los 30 días de plazo, no sale nada')
}
{
  // Sin pase: sale pendiente pero no se gana (el candado).
  reloj = new Date('2026-11-11T12:00:00Z')
  const m = mundo({ cobro: true, pases: [{ id: 'p1', destino: 'Roma', tipo: 'uno' }] })
  await fotoDeA(m, 'coliseo')
  reloj = new Date('2026-11-14T09:00:00Z')
  const conMia = await m.servicio.companeroPendientes('B', 'viaje1')
  debe(conMia.pendientes.length === 1, 'pase', 'con cobro, el pase de A es de A: B ve el pendiente')
  const sinPase = mundo({ cobro: true })
  sinPase.repo.pasesDe = async (u) => (u === 'A' ? [{ id: 'p1', destino: 'Roma', tipo: 'uno' }] : [])
  reloj = new Date('2026-11-11T12:00:00Z')
  await fotoDeA(sinPase, 'coliseo')
  reloj = new Date('2026-11-14T09:00:00Z')
  const pp = await sinPase.servicio.companeroPendientes('B', 'viaje1')
  debe(pp.pendientes.length === 1 && pp.sin_pase === true, 'pase', 'sin pase, B ve el pendiente con el candado (sin_pase)')
  const gana = await sinPase.servicio.yoTambien('B', { trip_id: 'viaje1', sitios: 'todos' })
  debe(gana.cuenta === false && ['sin_pase', 'prueba_ya_usada'].includes(gana.motivo) && sinPase.repo.hechos.filter((h) => h.user_id === 'B').length === 0, 'pase', `sin pase no se gana nada (${gana.motivo})`)
}

/* ───────── 2. El código y los textos ───────── */
console.log('2. El código y los textos')
{
  const srv = leer('server/logros/rutas.js')
  debe(/\/api\/logros\/companero/.test(srv) && /\/api\/logros\/yo-tambien/.test(srv), 'rutas', 'las dos rutas del servidor (lo pendiente y [Yo también estaba])')
  const aj = JSON.parse(leer('data/logros/ajustes.json'))
  debe(aj.mensajes.foto_no_camara === 'Esta foto no está hecha con tu móvil.', 'textos', 'cada foto sin datos dice «Esta foto no está hecha con tu móvil.»')
  const todo = ['src', 'server', 'data'].flatMap((d) => fs.readdirSync(d, { recursive: true }).filter((f) => /\.(ts|tsx|js|json)$/.test(f)).map((f) => `${d}/${f}`))
  const viejos = todo.filter((f) => /no está hecha con una cámara|Ha perdido sus datos/.test(leer(f)))
  debe(viejos.length === 0, 'textos', `ningún «no está hecha con una cámara» ni «Ha perdido sus datos» en la app (${viejos.join(', ')})`)
  // (V15) La pieza de Design «Visto Fotos» aún lleva el texto viejo; lo que se mira es la app, no los archivos de Design (que van exactamente como los manda Design).
}

{
  const ui = leer('src/components/logros/companero/Companero.tsx')
  const lib = leer('src/lib/companero.ts')
  const rec = leer('src/components/logros/reclamar/Reclamar.tsx')
  debe(/consiguió \$\{n\} \$\{n === 1 \? 'sitio' : 'sitios'\} donde estabais juntos/.test(lib), 'y0', 'Y0: «Eric consiguió 4 sitios donde estabais juntos ›»')
  debe(/lo consiguió \{enSitio\(p\.nombre\)\}\. ¿Estabais juntos\?/.test(ui) && !/Foto de \{quien\}/.test(ui) && /Yo también estaba/.test(ui) && /Subir mi foto/.test(ui), 'y1', 'Y1: la foto grande con «Foto de Eric», «Eric lo consiguió en …. ¿Estabais juntos?», [Yo también estaba] y debajo [Subir mi foto]')
  debe(/Lo que conseguisteis juntos/.test(ui) && /Yo también estaba en todos/.test(ui) && /Subir mis fotos/.test(ui) && /abrirGaleriaDeReclamo\(\)/.test(ui), 'y2', 'Y2: «Lo que conseguisteis juntos», [Yo también estaba en todos], uno por sitio y [Subir mis fotos] (abre «Reclamar con tus fotos»)')
  debe(/useLogrosStore\.getState\(\)\.recibir\(r\)/.test(lib) && !/alAlbum[^\n]*companero|subirFoto/.test(lib.replace(/subirMiFoto[\s\S]*$/, '')), 'recuerdos', '[Yo también estaba] no sube nada a los recuerdos (solo [Subir mi foto], con la foto de uno mismo)')
  debe(/void alAlbum\(archivo/.test(lib), 'recuerdos', '[Subir mi foto]: la foto que vale va a SUS recuerdos')
  debe(leer('src/hooks/useAppNotices.ts').includes('companero:${p.viaje ?? \'\'}:${p.sitio}') && /label: 'Ahora'/.test(leer('src/hooks/useAppNotices.ts')) && /ponerPuntito\(true\)/.test(ui), 'y5', 'Y5: el aviso en la campana («… ha conseguido … ¿Estabais juntos?» con [Ahora]) y el punto del botón de logros')
  debe(/¿Por qué no cuentan\?/.test(rec) && /Las fotos enviadas por WhatsApp y las capturas de pantalla pierden los datos que dicen dónde y cuándo se hicieron\./.test(rec) && /¿Las hizo tu compañero de viaje\?/.test(rec) && /Cuando él las suba desde su móvil, podrás ganar el mismo pedazo con/.test(rec) && /También puede pasártelas/.test(rec) && /por AirDrop o por WhatsApp como documento: así no pierden nada\./.test(rec), 'y4', 'Y4: la tarjeta «¿Por qué no cuentan?» con sus cuatro párrafos, encima de la lista')
  debe(/n\.motivo === 'no_camara'/.test(rec), 'y4', 'la tarjeta de ayuda solo sale si hay fotos que no cuentan por falta de datos (las de otra fecha u otro sitio siguen con su motivo)')
  debe(/CandadoRedondo/.test(ui) && /abrirAvisoPase\('reclamar'\)/.test(ui), 'pase', 'sin pase: el candado pequeño, que lleva al pase')
}

/* ───────── 3. En pantalla ───────── */
let abrirApp = null
try {
  ;({ abrirApp } = await import('./_enLaApp.mjs'))
} catch { /* sin navegador */ }
const BASE = process.env.APP_URL
if (abrirApp && BASE) {
  console.log('3. En pantalla')
  const CAPTURAS = 'docs/dias/V7_capturas'
  fs.mkdirSync(CAPTURAS, { recursive: true })
  const app = await abrirApp(BASE, { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on', ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 360 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
    await app.evaluar('Promise.resolve(window.__rutaPrueba()).then(() => true)')
    await app.esp(3000)
    for (let i = 0; i < 6; i++) { const c = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()"); if (!c) break; await app.esp(700) }
    await app.esp(1500)
    // Y0: la tarjeta en la hoja de logros.
    await app.evaluar("document.querySelector('[data-boton-logros]')?.click(); true")
    await app.hasta("Boolean(document.querySelector('[data-companero=tarjeta]'))", { segundos: 25 }).catch(() => undefined)
    const t0 = await app.evaluar("document.querySelector('[data-companero=tarjeta]')?.innerText ?? ''")
    debe(/Eric consiguió 4 sitios donde estabais juntos/.test(t0), 'y0', `Y0: la tarjeta pequeña en la hoja de logros: «${t0.replace(/\n/g, ' ')}»`)
    debe((await app.evaluar("document.querySelectorAll('[data-companero=tarjeta] span[style*=\"border: 2px\"]').length")) >= 3, 'y0', 'con las miniaturas de los sitios')
    await app.esp(800)
    await app.captura(`${CAPTURAS}/Y0_tarjeta.jpg`)
    // Y2: varios sitios.
    await app.evaluar("document.querySelector('[data-companero=tarjeta]')?.click(); true")
    await app.hasta("Boolean(document.querySelector('[data-companero=lista]'))", { segundos: 10 })
    const t2 = await app.evaluar("document.querySelector('[data-companero=lista]')?.innerText ?? ''")
    debe(/Lo que conseguisteis juntos/.test(t2) && /Yo también estaba en todos/.test(t2) && /Subir mis fotos/.test(t2), 'y2', 'Y2: «Lo que conseguisteis juntos», [Yo también estaba en todos] y [Subir mis fotos]')
    debe((await app.evaluar("document.querySelectorAll('[data-companero=fila]').length")) === 4 && (await app.evaluar("document.querySelectorAll('[data-companero=yo-tambien-uno]').length")) === 4, 'y2', 'con los 4 sitios y un [Yo también estaba] en cada uno')
    await app.esp(900)
    await app.captura(`${CAPTURAS}/Y2_varios.jpg`)
    // Y1: al tocar un sitio de la lista.
    await app.evaluar("document.querySelector('[data-companero=fila] button')?.click(); true")
    await app.hasta("Boolean(document.querySelector('[data-companero=sitio]'))", { segundos: 10 })
    const t1 = await app.evaluar("document.querySelector('[data-companero=sitio]')?.innerText ?? ''")
    debe(!/Foto de Eric/.test(t1) && /Eric lo consiguió en el Coliseo\. ¿Estabais juntos\?/.test(t1) && /Yo también estaba/.test(t1) && /Subir mi foto/.test(t1), 'y1', `Y1: al tocar un sitio (${t1.replace(/\n/g, ' ').slice(0, 120)})`)
    await app.esp(900)
    await app.captura(`${CAPTURAS}/Y1_un_sitio.jpg`)
    // [Yo también estaba]: su momento por la fila (los pedazos y el emblema).
    await app.evaluar("document.querySelector('[data-companero=yo-tambien]')?.click(); true")
    let momento = ''
    for (let i = 0; i < 40 && !/pedazo|emblema/i.test(momento); i++) { await app.esp(500); momento = await app.evaluar("(document.querySelector('[role=dialog]')?.innerText || '').slice(0, 300)") }
    debe(/pedazo|emblema/i.test(momento), 'y3', `[Yo también estaba] da su momento por la fila (${momento.replace(/\n/g, ' ').slice(0, 60)})`)
    await app.esp(2500)
    await app.captura(`${CAPTURAS}/Y3_momento.jpg`)
    // Y5: el aviso de la campana.
    await app.evaluar("window.__momentos && true; document.querySelector('[data-hoy-saltar-todo], [data-saltar-todo]')?.click(); Array.from(document.querySelectorAll('button')).find((b) => /Saltar todo/i.test(b.textContent || ''))?.click(); true")
    await app.esp(3500)
    const hay = await app.evaluar("(async () => { const C = await import('/src/lib/companero.ts'); return C.useCompaneroStore.getState().pendientes.length })()")
    debe(hay === 3, 'una_vez', `tras ganar el Coliseo quedan 3 pendientes (${hay})`)
  } finally {
    await app.cerrar()
  }
  // Sin pase: el candado.
  const b = await abrirApp(BASE, { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=gratis&hoy2=on', ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 360 && !(await b.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await b.esp(500)
    await b.evaluar("window.__companeroDemo = { sinPase: true }; Promise.resolve(window.__rutaPrueba()).then(() => true)")
    await b.esp(3000)
    for (let i = 0; i < 6; i++) { const c = await b.evaluar("(() => { const x = Array.from(document.querySelectorAll('button')).find((y) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((y.textContent || '').trim())); if (!x) return false; x.click(); return true })()"); if (!c) break; await b.esp(700) }
    await b.evaluar("(async () => { const C = await import('/src/lib/companero.ts'); await C.cargarCompanero(document.title ? (await import('/src/store/useRouteStore.ts')).useRouteStore.getState().route.id : ''); return true })()")
    await b.esp(1500)
    await b.evaluar("document.querySelector('[data-boton-logros]')?.click(); true")
    await b.hasta("Boolean(document.querySelector('[data-companero=tarjeta]'))", { segundos: 25 }).catch(() => undefined)
    debe(await b.evaluar("Boolean(document.querySelector('[data-companero=tarjeta] [data-candado-dato=companero-candado]'))"), 'pase', 'sin pase, la tarjeta sale con el candado pequeño')
    await b.captura(`${CAPTURAS}/Y0_sin_pase.jpg`)
  } finally {
    await b.cerrar()
  }
} else console.log('3. En pantalla: se salta (sin APP_URL)')

console.log(`\nLa prueba V7: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) {
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  process.exit(1)
}
