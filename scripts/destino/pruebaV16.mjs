// La prueba de la Tanda V16: LAS FOTOS DE LOS LOGROS (cada hecho con foto unido a su foto), «Yo también estaba» con la foto del sitio de la app, el panel solo para administradores y El Golfo y Famara, un solo sitio cada uno.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV16.mjs
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { esAdmin } from '../../server/logros/rutas.js'
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
const CAPTURAS = 'docs/dias/V16_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

const GOLFO = 'el_golfo_y_el_charco_de_los_clicos'
const FAMARA = 'caleta_de_famara_y_playa_de_famara'
const datos = cargarDatos()
const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }

/* ───────── 1. Unir cada hecho con su foto ───────── */
console.log('1. El servidor: cada hecho con foto, unido a su foto')
{
  const hechos = []
  const meta = [] // { user_id, photo_id, taken_at }
  const logros = []
  const viaje = { id: 'lz1', traveler_id: 'E', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 's1', name: 'Timanfaya' }] }] } }
  let n = 0
  let pidioFotoDeOtro = 0
  const repo = {
    hechosDe: async (u) => hechos.filter((h) => h.user_id === u && !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null, foto_id: f.foto_id ?? null }; hechos.push(h); return h },
    deshacerHecho: async () => {}, viajesDe: async () => [viaje], logrosDe: async (u) => logros.filter((l) => l.user_id === u),
    insertarLogros: async (u, filas) => { const d = []; for (const f of filas) { if (logros.some((l) => l.user_id === u && l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue; const l = { user_id: u, ...f, escalon: String(f.escalon ?? ''), ganado_en: f.ganado_en ?? '2026-11-10T10:00:00.000Z' }; logros.push(l); d.push(l) } return d },
    borrarLogros: async () => {}, cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }), ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null,
    sinPaseDe: async () => false, pasesDe: async () => [], pruebaDe: async () => null, guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {},
    fotoUrl: async (id) => { if (String(id).startsWith('foto-de-A')) pidioFotoDeOtro++; return `https://fotos.test/${id}.jpg` },
    miembrosDe: async () => [{ user_id: 'E', desde: null }, { user_id: 'A', desde: '2026-11-07T10:00:00Z' }],
    nombresDe: async (ids) => new Map(ids.map((i) => [i, i === 'E' ? 'Eric' : 'Alicia'])),
    hechosConFotoSinUnir: async (u) => hechos.filter((h) => h.user_id === u && h.tipo === 'foto' && !h.foto_id && !h.deshecho_en).map((h) => ({ id: h.id, instante: h.instante })),
    fotosConFecha: async (u) => meta.filter((m) => m.user_id === u),
    unirFoto: async (u, ids, fotoId) => { let k = 0; for (const h of hechos) if (h.user_id === u && ids.includes(h.id) && !h.foto_id) { h.foto_id = fotoId; k++ } return k },
  }
  const reloj = new Date('2026-11-18T12:00:00Z')
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  const foto = (u, id, k, extra = {}) => {
    const c = coordenadasDeSitio(catalogos, 'lanzarote', id)
    return servicio.foto(u, { trip_id: 'lz1', libre: true, origen: 'galeria', con_camara: true, tomada_en: `2026-11-10T1${k}:00:00`, ubicacion: { lat: c.lat + 5 / 111000, lng: c.lng, precision: 10 }, ...extra })
  }
  // Eric gana 3 sitios con fotos de la galería (la app NO manda foto_id: queda vacío) y sube las fotos al álbum después.
  await foto('E', 'montanas_del_fuego', 0)
  await foto('E', 'jameos_del_agua', 1)
  await foto('E', 'cueva_de_los_verdes', 2)
  const instantes = hechos.filter((h) => h.user_id === 'E').map((h) => h.instante)
  debe(hechos.filter((h) => h.user_id === 'E').every((h) => !h.foto_id), 'foto_id', 'al ganar con la foto de la galería, el hecho se guarda sin foto_id (la foto llega al álbum después): lo que había que arreglar')
  // Las fotos llegan al álbum: dos con su fecha de cámara; de la tercera hay DOS fotos con la misma hora (dudas).
  meta.push({ user_id: 'E', photo_id: 'foto-1', taken_at: instantes[0] }, { user_id: 'E', photo_id: 'foto-2', taken_at: instantes[1] }, { user_id: 'E', photo_id: 'foto-3a', taken_at: instantes[2] }, { user_id: 'E', photo_id: 'foto-3b', taken_at: instantes[2] })
  const r1 = await servicio.unirFotos('E')
  const porSitio = Object.fromEntries(hechos.filter((h) => h.user_id === 'E').map((h) => [h.sitio, h.foto_id]))
  debe(r1.unidos === 2 && r1.sin_unir === 1 && porSitio.montanas_del_fuego === 'foto-1' && porSitio.jameos_del_agua === 'foto-2' && !porSitio.cueva_de_los_verdes, 'unir', `se unen los hechos con UNA sola foto que cuadre (misma persona, misma fecha y hora de cámara); el que tiene dudas se queda sin unir (${JSON.stringify(r1)})`)
  const r2 = await servicio.unirFotos('E')
  debe(r2.unidos === 0 && r2.sin_unir === 1, 'unir', 'otra vez no cambia nada ni duplica (los ya unidos no se tocan)')
  // La misma foto da DOS sitios (cae en dos radios): los dos hechos la comparten.
  const dos = hechos.filter((h) => h.user_id === 'E' && h.tipo === 'foto')
  meta.push({ user_id: 'E', photo_id: 'foto-3a', taken_at: instantes[2] })
  void dos
  // Con la foto unida, la foto de cada sitio sale con la tuya.
  const c = await servicio.cargar('E')
  const fotos = await servicio.fotosDeSitios(c, ['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes'], 'E')
  debe(fotos.montanas_del_fuego === 'https://fotos.test/foto-1.jpg' && fotos.jameos_del_agua === 'https://fotos.test/foto-2.jpg' && !fotos.cueva_de_los_verdes, 'tu foto', 'la colección por dentro / la pestaña «Logros» enseñan tu foto en los sitios ganados con foto (y la de los datos donde no hay)')
  // Otra persona nunca se une a la foto de Eric.
  await foto('A', 'mirador_del_rio', 4)
  meta.push({ user_id: 'E', photo_id: 'foto-de-Eric-misma-hora', taken_at: hechos.find((h) => h.user_id === 'A').instante })
  const rA = await servicio.unirFotos('A')
  debe(rA.unidos === 0, 'unir', 'una foto de OTRA cuenta con la misma hora no se une (solo fotos de la misma persona)')
  // «Yo también estaba»: ya no pide ninguna foto de otra cuenta.
  pidioFotoDeOtro = 0
  hechos.find((h) => h.user_id === 'A').foto_id = 'foto-de-A-1'
  const pend = await servicio.companeroPendientes('E', 'lz1')
  debe(pend.ok && pend.pendientes.length > 0 && pend.pendientes.every((p) => p.foto_url === null) && pidioFotoDeOtro === 0 && pend.ciudad === 'Lanzarote', 'yo tambien', `el servidor no pide ni manda la foto del compañero (foto_url null; pidió ${pidioFotoDeOtro}) y manda la ciudad para buscar la foto del sitio`)
}

/* ───────── 2. El Golfo y Famara, un solo sitio cada uno ───────── */
console.log('2. El Golfo y Famara, un solo sitio cada uno')
{
  const lz = datos.destinos.lanzarote
  debe(lz.sitios[GOLFO] && lz.sitios[FAMARA] && ['el_golfo_pueblo', 'charco_de_los_clicos', 'caleta_de_famara', 'playa_de_famara'].every((v) => !lz.sitios[v]), 'sitios', 'existen los dos sitios nuevos y ya no los cuatro viejos')
  const cuantas = (id) => lz.colecciones.filter((c) => c.sitios.includes(id)).map((c) => `${c.id}:${c.sitios.length}`)
  debe(JSON.stringify(cuantas(GOLFO)) === JSON.stringify(['lz_imprescindibles:7', 'playas_y_charcos:7', 'pueblos_con_alma:6']), 'colecciones', `El Golfo sigue en las 3 colecciones donde estaban sus dos partes (${cuantas(GOLFO)})`)
  debe(JSON.stringify(cuantas(FAMARA)) === JSON.stringify(['playas_y_charcos:7', 'pueblos_con_alma:6']), 'colecciones', `Famara sigue en sus 2 colecciones (${cuantas(FAMARA)})`)
  const medida = Object.fromEntries(lz.colecciones.map((c) => [c.id, c.sitios.length]))
  debe(medida.lz_imprescindibles === 7 && medida.playas_y_charcos === 7 && medida.pueblos_con_alma === 6 && medida.cesar_manrique === 7 && medida.tierra_de_fuego === 7 && medida.isla_a_tus_pies === 6 && medida.entre_vinas_de_ceniza === 3, 'insignias', `ninguna insignia cambia de número de trozos (${JSON.stringify(medida)})`)
  const partes = leer('src/components/logros/dibujos/partes.ts')
  debe(partes.includes(GOLFO) && partes.includes(FAMARA) && !/"el_golfo_pueblo"|"charco_de_los_clicos"|"caleta_de_famara"|"playa_de_famara"/.test(partes), 'insignias', 'las insignias por partes de la V13 siguen cuadrando (partes.ts regenerado con los sitios nuevos)')
  debe(lz.emblemas.find((e) => e.id === 'el_golfo')?.sitio === GOLFO, 'emblema', 'el emblema «El charco verde» sigue en El Golfo')
  debe(!lz.sitios_de_parada?.[GOLFO] && !lz.sitios_de_parada?.[FAMARA], 'dos en uno', 'ya no son «dos en uno» (fuera de sitios_de_parada)')
  // Se gana con una foto en el pueblo, en el charco, en la caleta o en la playa; un Visto en la parada da el sitio entero.
  const viaje = { id: 'lz1', traveler_id: 'U', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 'p1', name: 'El Golfo y el Charco de los Clicos' }] }] } }
  const puntos = { pueblo: [28.982748, -13.830632], charco: [28.977147, -13.827658], caleta: [29.115758, -13.563593], playa: [29.115813, -13.553589] }
  for (const [donde, sitio] of [['pueblo', GOLFO], ['charco', GOLFO], ['caleta', FAMARA], ['playa', FAMARA]]) {
    const hechos = []
    const logros = []
    let n = 0
    const repo = {
      hechosDe: async () => hechos, insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h }, deshacerHecho: async () => {}, viajesDe: async () => [viaje], logrosDe: async () => logros,
      insertarLogros: async (u, filas) => { const d = []; for (const f of filas) { if (logros.some((l) => l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue; const l = { user_id: u, ...f, escalon: String(f.escalon ?? ''), ganado_en: '2026-11-10T10:00:00.000Z' }; logros.push(l); d.push(l) } return d },
      borrarLogros: async () => {}, cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }), ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null, sinPaseDe: async () => false, pasesDe: async () => [], pruebaDe: async () => null, guardarPrueba: async () => {},
      perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {}, fotoUrl: async () => null,
    }
    const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date('2026-11-18T12:00:00Z'), cobro: false, azar: () => 0 })
    const [lat, lng] = puntos[donde]
    const r = await servicio.foto('U', { trip_id: 'lz1', libre: true, origen: 'galeria', con_camara: true, tomada_en: '2026-11-10T11:00:00', ubicacion: { lat, lng, precision: 10 } })
    debe(r.ok && r.valida && (r.sitios ?? []).some((s) => s.sitio === sitio) && !(r.sitios ?? []).some((s) => s.sitio !== sitio && /golfo|charco|famara/.test(s.sitio)), 'radio', `una foto hecha en ${donde} gana el sitio entero «${sitio}» (${JSON.stringify((r.sitios ?? []).map((s) => s.sitio))})`)
    const pedazos = logros.filter((l) => l.logro === 'pedazo').map((l) => l.escalon)
    debe(pedazos.some((p) => p.endsWith(':' + sitio)) && !pedazos.some((p) => /:(el_golfo_pueblo|charco_de_los_clicos|caleta_de_famara|playa_de_famara)$/.test(p)), 'radio', `y suma su pedazo en sus colecciones (${pedazos.filter((p) => p.endsWith(':' + sitio)).length})`)
  }
  // Un Visto en la parada da el sitio entero.
  {
    const hechos = []
    const logros = []
    let n = 0
    const repo = {
      hechosDe: async () => hechos, insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h }, deshacerHecho: async () => {}, viajesDe: async () => [viaje], logrosDe: async () => logros,
      insertarLogros: async (u, filas) => { const d = []; for (const f of filas) { if (logros.some((l) => l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue; const l = { user_id: u, ...f, escalon: String(f.escalon ?? ''), ganado_en: '2026-11-10T10:00:00.000Z' }; logros.push(l); d.push(l) } return d },
      borrarLogros: async () => {}, cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }), ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null, sinPaseDe: async () => false, pasesDe: async () => [], pruebaDe: async () => null, guardarPrueba: async () => {},
      perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {}, fotoUrl: async () => null,
    }
    const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date('2026-11-10T12:00:00Z'), cobro: false, azar: () => 0 })
    const r = await servicio.visto('U', { trip_id: 'lz1', stop_id: 'p1', nombre: 'El Golfo y el Charco de los Clicos', instante: '2026-11-10T11:00:00Z', ubicacion: { lat: 28.977147, lng: -13.827658, precision: 10 } })
    const pedazos = logros.filter((l) => l.logro === 'pedazo').map((l) => l.escalon)
    debe(r.ok !== false && pedazos.filter((p) => p.endsWith(':' + GOLFO)).length === 3, 'visto', `un Visto en la parada da el sitio entero, en sus 3 colecciones (${pedazos.filter((p) => p.endsWith(':' + GOLFO)).length}; ${JSON.stringify(Object.keys(r))})`)
  }
  const mig = leer('supabase/migrations/0082_golfo_y_famara_un_sitio.sql')
  debe(/el_golfo_pueblo/.test(mig) && /on conflict \(user_id, destino, logro, escalon\) do nothing/.test(mig) && fs.existsSync('docs/dias/COMPROBAR_0082.sql'), 'migracion', 'la migración 0082 pasa lo que ya se tenía de los ids viejos al sitio nuevo sin duplicar, con su COMPROBAR')
}

/* ───────── 3. El panel, solo para administradores ───────── */
console.log('3. El panel, solo para administradores')
{
  const env = { LOGROS_ADMIN_EMAILS: 'eric@ejemplo.com' }
  debe(esAdmin({ email: 'eric@ejemplo.com', id: 'u1' }, env) && !esAdmin({ email: 'alicia@ejemplo.com', id: 'u2' }, env), 'panel', 'el servidor distingue al administrador de cualquier otra cuenta')
  const rutas = leer('server/logros/rutas.js')
  debe(/req\.query\.pasos && esAdmin\(u, env\)/.test(rutas) && /app\.get\('\/api\/logros\/version', conAdmin/.test(rutas), 'panel', '`?pasos=1` y `/api/logros/version` solo para administradores (a cualquier otra cuenta, el parámetro no existe)')
  const admin = leer('src/components/logros/AdminLogros.tsx')
  debe(/window\.location\.replace\('\/'\)/.test(admin) && !/<DiagnosticoCompanero \/><p/.test(admin), 'panel', '`?admin=logros` con una cuenta que no es de administrador no enseña nada: vuelve a la app, como si no existiera')
}

/* ───────── 4. «Yo también estaba» con la foto del sitio de la app ───────── */
console.log('4. En pantalla: Y0, Y1 e Y2 con la foto del sitio')
const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0' })
const ev = (js) => app.evaluar(js)
const esperar = async (js, intentos = 40, ms = 400) => {
  for (let i = 0; i < intentos; i++) {
    if (await ev(js).catch(() => false)) return true
    await app.esp(ms)
  }
  return false
}
try {
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await ev("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; true")
  await ev('window.__rutaPrueba().then(() => true)')
  await esperar("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))", 90, 1000)
  await app.esp(3000)
  for (let i = 0; i < 6; i++) {
    const hecho = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Empezar mi día)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await app.esp(700)
  }
  // Dos pendientes del compañero; el servidor viejo mandaba `foto_url` (la foto del compañero): ahora la app nunca la usa.
  await ev(`__imp('/src/lib/companero.ts').then((m) => { const p = (sitio, nombre) => ({ sitio, nombre, de: 'u2', de_nombre: 'Alice', falta: ['pedazo'], colecciones: [], emblema: false, foto_url: '/fotos/roma/FOTO_DEL_COMPANERO.jpg', instante: null, viaje: 'v1', ciudad: 'Lanzarote' }); const l = [p('montanas_del_fuego', 'Montañas del Fuego'), p('cueva_de_los_verdes', 'Cueva de los Verdes')]; m.useCompaneroStore.setState({ pendientes: l, porViaje: { v1: l }, sinPase: false, cargado: true, fallo: false }); return true })`)
  await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().abrirHojaLogros(); return true })")
  await esperar("Boolean(document.querySelector('[data-companero=\"tarjeta\"]'))", 40, 250)
  const y0 = await ev("({ fotos: document.querySelectorAll('[data-companero=\"tarjeta\"] [data-foto-del-sitio]').length, html: document.querySelector('[data-companero=\"tarjeta\"]').outerHTML })")
  debe(y0.fotos === 2 && !/FOTO_DEL_COMPANERO/.test(y0.html), 'Y0', `la tarjeta Y0 enseña la foto del sitio (2 cuadros del sitio; nunca la foto del compañero)`)
  await app.captura(`${CAPTURAS}/y0_tarjeta.jpg`)
  await ev("document.querySelector('[data-companero=\"tarjeta\"]').click(); true")
  await esperar("Boolean(document.querySelector('[data-companero=\"lista\"]'))", 30, 250)
  const y2 = await ev("({ filas: document.querySelectorAll('[data-companero=\"lista\"] [data-companero=\"fila\"] [data-foto-del-sitio]').length, html: document.querySelector('[data-companero=\"lista\"]').outerHTML })")
  debe(y2.filas === 2 && !/FOTO_DEL_COMPANERO/.test(y2.html), 'Y2', 'la lista Y2 enseña la foto del sitio en cada fila, nunca la del compañero')
  await app.captura(`${CAPTURAS}/y2_lista.jpg`)
  await ev("document.querySelector('[data-companero=\"fila\"] button').click(); true")
  await esperar("Boolean(document.querySelector('[data-companero=\"sitio\"]'))", 30, 250)
  const y1 = await ev("(() => { const d = document.querySelector('[data-companero=\"sitio\"]'); return { foto: Boolean(d.querySelector('[data-companero=\"foto\"] [data-foto-del-sitio]')), texto: d.innerText, html: d.outerHTML } })()")
  debe(y1.foto && !/Foto de /.test(y1.texto) && !/FOTO_DEL_COMPANERO/.test(y1.html), 'Y1', `Y1: la foto grande es la del sitio y ya no dice «Foto de Alice» (${y1.texto.split('\n')[0]})`)
  await app.captura(`${CAPTURAS}/y1_sitio.jpg`)
} finally {
  await app.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
