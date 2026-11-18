// La prueba de la Tanda V11: ESTAMPAR EL PASAPORTE (el pasaporte abre con lo guardado y sin blanco, el sello del viaje terminado, «Por conseguir» que nunca crea un viaje, los días viajando bien contados).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV11.mjs
// 1. El servidor (servicio de logros de verdad con un repo en memoria): un viaje a Lanzarote terminado del 9 al 13 de nov.   2. En pantalla (demo de logros; ninguna llamada a producción).
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { viajesAcabados } from '../../server/logros/exp.js'
import { catalogoDePaises, paginasDelPasaporte, resumenDePasaporte, viajesPorHacer, viajesSinSello } from '../../server/logros/pantallas/previos.js'
import { abrirApp } from './_enLaApp.mjs'

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
const APP = process.env.APP_URL ?? 'http://localhost:5199'
const CAPTURAS = 'docs/dias/V11_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. El servidor ───────── */
console.log('1. El servidor: el sello de un viaje terminado y los días viajando')
{
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
  const hechos = []
  const logros = []
  const viajes = [{ id: 'lz1', traveler_id: 'U', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-09', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 's1', name: 'Timanfaya' }] }] } }]
  let n = 0
  const repo = {
    hechosDe: async () => hechos.filter((h) => !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h },
    deshacerHecho: async () => {},
    viajesDe: async () => viajes,
    logrosDe: async () => logros,
    insertarLogros: async (u, filas) => { const d = []; for (const f of filas) { if (logros.some((l) => l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue; const l = { user_id: u, ...f, escalon: String(f.escalon), animacion_vista: false }; logros.push(l); d.push(l) } return d },
    borrarLogros: async () => {},
    cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }),
    ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null, sinPaseDe: async () => false, pasesDe: async () => [{ id: 'p', tipo: 'solo', estado: 'activo' }], pruebaDe: async () => null, guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {},
    fotoUrl: async () => null,
  }
  const reloj = new Date('2026-11-18T12:00:00Z')
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  const catalogo = catalogoDePaises()
  const calcula = async () => {
    const c = await servicio.cargar('U')
    const base = await servicio.pasaporteDe('U')
    const acabados = viajesAcabados({ datos, hechos: c.hechos, viajes: c.viajes, ahora: reloj })
    const paginas = paginasDelPasaporte({ datos, base, previos: c.perfil.previos, catalogo, hechos: c.hechos, viajes: c.viajes, acabados })
    const numeros = resumenDePasaporte({ base, paginas })
    return { base, acabados, paginas, numeros, sin: viajesSinSello({ datos, hechos: c.hechos, viajes: c.viajes, acabados, ahora: reloj }) }
  }
  // (a) Sin nada que cuente (el caso de Alicia): sin sello, y el servidor DICE por qué.
  let r = await calcula()
  debe(r.acabados.length === 0 && !r.paginas.some((p) => p.sellos.some((s) => s.trip_id === 'lz1')), 'sello', 'sin ningún sitio visto, el viaje no da sello')
  const falta = r.sin.find((v) => v.trip_id === 'lz1')
  debe(falta && falta.vistas === 0 && falta.minimas === 3 && falta.plazo_abierto && falta.hasta === '2026-12-13', 'sello', `el servidor dice que faltan sitios (${JSON.stringify(falta)})`)
  // (b) Con 3 sitios vistos (fotos de la galería reclamadas, V5) en dos días: sello con la fecha del viaje.
  const ids = Object.keys(datos.destinos.lanzarote.sitios).filter((s) => coordenadasDeSitio(catalogos, 'lanzarote', s)).slice(0, 3)
  for (const [k, id] of ids.entries()) {
    const c = coordenadasDeSitio(catalogos, 'lanzarote', id)
    await servicio.foto('U', { trip_id: 'lz1', libre: true, origen: 'galeria', con_camara: true, tomada_en: k < 3 ? '2026-11-10T10:00:00' : '2026-11-11T10:00:00', ubicacion: { lat: c.lat + 5 / 111000, lng: c.lng } })
  }
  r = await calcula()
  const pag = r.paginas.find((p) => p.sellos.some((s) => s.trip_id === 'lz1'))
  const sello = pag?.sellos.find((s) => s.trip_id === 'lz1')
  debe(r.acabados.some((a) => a.trip_id === 'lz1') && sello && sello.fecha === '2026-11-09' && pag.pais === 'España', 'sello', `con 3 sitios vistos reclamados, el viaje da su sello de España con la fecha del PRIMER día del viaje (V14) (${sello?.fecha}; vistas: ${hechos.length})`)
  debe(!r.sin.some((v) => v.trip_id === 'lz1'), 'sello', 'ya no sale como viaje sin sello')
  // (c) Los días viajando: los DÍAS DEL VIAJE (5), no los 2 en que se tocó algo.
  // (d) Los puntos del globo: los viajes por hacer, aparte de los hechos.
  const porHacer = viajesPorHacer({ datos, viajes: { x: { destino: 'roma', inicio: '2026-12-01', fin: '2026-12-04' }, lz1: { destino: 'lanzarote', inicio: '2026-11-09', fin: '2026-11-13' } }, ahora: reloj })
  debe(porHacer.length === 1 && porHacer[0].trip_id === 'x', 'globo', 'solo los viajes aún por hacer van con punto hueco (el de Lanzarote, hecho, no)')
  debe(r.numeros.dias_viajando === 5, 'días', `«días viajando» cuenta los 5 días del viaje (9 al 13), no los ${2} con hechos: sale ${r.numeros.dias_viajando}`)
}

/* ───────── 2. En pantalla ───────── */
console.log('2. En pantalla (móvil de 390 px, demo de logros)')
const b = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
const ev = (js) => b.evaluar(js)
try {
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'")); i++) await b.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  const R = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
  for (let i = 0; i < 90 && !(await ev(R + '.then((S) => Boolean(S.getState().route))')); i++) await b.esp(1000)
  await b.esp(2500)
  for (let i = 0; i < 6; i++) {
    await ev("(() => { const e = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Empezar mi día|Vale)$/.test(x.textContent.trim())); e?.click(); return true })()")
    await b.esp(600)
  }
  const abrirPasaporte = (pagina) => ev(`import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); setTimeout(() => m.useLogrosPantallas.getState().abrir({ t: 'pasaporte'${pagina ? `, pagina: '${pagina}'` : ''} }), 80); return true })`)
  const viajes = () => ev("Promise.all([import('/src/store/useSyncStore.ts')]).then(([s]) => ({ n: (s.useSyncStore.getState().savedTrips ?? []).length, activo: s.useSyncStore.getState().activeTripId }))")
  const antes = await viajes()

  // 2a. Abre con lo guardado y sin blanco: la primera vez se baja; la segunda sale al instante.
  await abrirPasaporte()
  for (let i = 0; i < 60 && !(await ev("Boolean(document.querySelector('[data-mapa-grande]'))")); i++) await b.esp(250)
  await b.esp(3500)
  await ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")
  await b.esp(600)
  await abrirPasaporte('lista')
  const t0 = Date.now()
  let visto = false
  let esqueleto = false
  for (let i = 0; i < 40; i++) {
    const e = await ev("({ g: Boolean(document.querySelector('[data-mapa-grande] svg, [data-mapa-grande] canvas')), e: Boolean(document.querySelector('[data-globo-esqueleto]')), t: document.querySelector('[data-titulo-pasaporte]')?.innerText ?? '' })").catch(() => ({ g: false, e: false, t: '' }))
    if (e.e) esqueleto = true
    if (e.g) { visto = true; break }
    await b.esp(50)
  }
  const tarda = Date.now() - t0
  debe(visto && tarda < 2500, 'instante', `la segunda vez el globo sale enseguida (${tarda} ms), sin esperar al servidor`)
  const blanco = await ev("(() => { const g = document.querySelector('[data-mapa-grande]'); if (!g) return null; const hijo = g.firstElementChild; return { esqueleto: Boolean(g.querySelector('[data-globo-esqueleto]')), fondoBlanco: hijo && getComputedStyle(hijo).backgroundColor === 'rgb(247, 241, 228)' } })()")
  debe(blanco && !blanco.fondoBlanco, 'instante', 'nunca un círculo en blanco (si el globo tarda, un esqueleto suave)')
  await b.captura(`${CAPTURAS}/pasaporte.jpg`)

  // 2b. [Estampar mi sello] de un viaje terminado SIN sello: no se queda mudo; dice qué hace falta y ofrece reclamar con fotos. No crea ningún viaje.
  await ev("window.__demoMundo = { viajesSinSello: [{ trip_id: 'lz-alicia', destino: 'roma', ciudad: 'Lanzarote', inicio: '2026-11-09', fin: '2026-11-13', vistas: 2, minimas: 3, hasta: '2026-12-13', plazo_abierto: true }] }; import('/src/lib/logrosEnCache.ts').then((c) => c.olvidarCacheDeLogros()); true")
  await abrirPasaporte('sello:lz-alicia')
  for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-hoja-sin-sello]'))")); i++) await b.esp(300)
  const hs = await ev("document.querySelector('[data-hoja-sin-sello]')?.innerText.split(String.fromCharCode(10)).join(' | ') ?? null")
  debe(hs && /Tu sello de Lanzarote aún no está/.test(hs) && /al menos 3 sitios vistos/.test(hs) && /Te falta 1 sitio para tu sello/.test(hs) && /llevas 2/.test(hs) && /13 de diciembre/.test(hs) && /Reclamar con tus fotos/.test(hs), 'sello', `el pasaporte dice por qué el sello aún no está («${hs}»)`)
  await b.captura(`${CAPTURAS}/sello_aun_no.jpg`)
  const despues1 = await viajes()
  debe(despues1.n === antes.n && despues1.activo === antes.activo, 'sin crear', `[Estampar mi sello] no crea ningún viaje (${antes.n} → ${despues1.n})`)

  // 2c. «Por conseguir»: hoja pequeña «Aún no has estado en …» y [Planear un viaje] (abre el formulario, sin crear nada).
  await ev("window.__demoMundo = { viajesSinSello: [] }; import('/src/lib/logrosEnCache.ts').then((c) => c.olvidarCacheDeLogros()); true")
  await abrirPasaporte()
  for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-mapa-grande]'))")); i++) await b.esp(300)
  await b.esp(1500)
  // Se va a una página con sellos por conseguir (las flechas del pasaporte) hasta que haya uno.
  let hayVacio = false
  for (let i = 0; i < 12 && !hayVacio; i++) {
    hayVacio = await ev("Boolean(document.querySelector('[data-sello-por-conseguir]'))")
    if (!hayVacio) await ev("(() => { const b = document.querySelector('[aria-label=\"Página siguiente\"], [aria-label=\"Siguiente país\"], [data-pagina-siguiente]'); if (b) { b.click(); return true } return false })()")
    await b.esp(500)
  }
  if (hayVacio) {
    await ev("document.querySelector('[data-sello-por-conseguir]').click(); true")
    await b.esp(700)
    const h = await ev("document.querySelector('[data-hoja-por-conseguir]')?.innerText.split(String.fromCharCode(10)).join(' | ') ?? null")
    debe(h && /Aún no has estado en/.test(h) && /Planear un viaje/.test(h) && !/Crear viaje/.test(h), 'por conseguir', `«Por conseguir» abre «Aún no has estado en …» con [Planear un viaje] («${h}»)`)
    await b.captura(`${CAPTURAS}/por_conseguir.jpg`)
    const despues2 = await viajes()
    debe(despues2.n === antes.n, 'sin crear', `tocar «Por conseguir» no crea ningún viaje (${antes.n} → ${despues2.n})`)
    await ev("document.querySelector('[data-planear-un-viaje]').click(); true")
    await b.esp(1200)
    const despues3 = await viajes()
    debe(despues3.n === antes.n, 'sin crear', `[Planear un viaje] abre el formulario sin crear nada (${antes.n} → ${despues3.n})`)
  } else debe(false, 'por conseguir', 'no se ha encontrado ningún sello «Por conseguir» en el demo para tocarlo')
} finally {
  await b.cerrar()
}

// Código: ningún sitio crea un viaje solo por un toque en el pasaporte.
{
  const pas = leer('src/components/logros/pantallas/PasaporteScreen.tsx')
  debe(!/ya está en la app/.test(pas) && !/Crear viaje/.test(pas) && /Planear un viaje/.test(pas), 'sin crear', 'el pasaporte ya no dice «ya está en la app» ni ofrece [Crear viaje]')
}

{
  const pas = leer('src/components/logros/pantallas/PasaporteScreen.tsx')
  debe(/COORDENADAS_DE_DESTINO/.test(pas) && /tipo: 'gris'/.test(pas) && /tipo: 'oro'/.test(pas) && /lanzarote: \{ lat: 29/.test(pas), 'globo', 'un punto por viaje en su destino: lleno si está hecho (también Lanzarote, en Canarias) y hueco si está por hacer')
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
