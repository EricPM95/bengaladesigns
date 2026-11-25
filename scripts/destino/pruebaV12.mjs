// La prueba de la Tanda V12: ARREGLOS QUE HA VISTO ERIC (abrir viajes del Perfil, recuerdos, días bien contados, foto repetida, portadas grandes, el «+» de la vitrina, el sello con 3 sitios,
// la X en todas las hojas, las hojas de logros con aire y botones de Design, los logros de viajero del mismo tamaño y las dos-en-uno de las sorpresas).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV12.mjs
// 1. El servidor (servicio de logros de verdad con un repo en memoria)   2. El código   3. En pantalla (demo de logros; ninguna llamada a producción). Capturas en docs/dias/V12_capturas/.
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio, nombreDeSitio } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { viajesAcabados } from '../../server/logros/exp.js'
import { viajesSinSello } from '../../server/logros/pantallas/previos.js'
import { pendientes, estadoDestino, resumen } from '../../server/logros/vistas.js'
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
const json = (f) => JSON.parse(leer(f))
const APP = process.env.APP_URL ?? 'http://localhost:5199'
const CAPTURAS = 'docs/dias/V12_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })
const hayLlaves = (v) => {
  const malas = []
  const ir = (x, ruta) => {
    if (typeof x === 'string') {
      if (/\{[a-zA-Z_]+\}/.test(x)) malas.push(`${ruta}: ${x.slice(0, 60)}`)
    } else if (Array.isArray(x)) x.forEach((y, i) => ir(y, `${ruta}[${i}]`))
    else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) ir(y, `${ruta}.${k}`)
  }
  ir(v, '')
  return malas
}

/* ───────── 1. El servidor ───────── */
console.log('1. El servidor: el sello con 3 sitios, las dos-en-uno y los textos sin llaves')
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
  const calcula = async () => {
    const c = await servicio.cargar('U')
    const acabados = viajesAcabados({ datos, hechos: c.hechos, viajes: c.viajes, ahora: reloj })
    return { acabados, sin: viajesSinSello({ datos, hechos: c.hechos, viajes: c.viajes, acabados, ahora: reloj }) }
  }
  const ids = Object.keys(datos.destinos.lanzarote.sitios).filter((s) => coordenadasDeSitio(catalogos, 'lanzarote', s))
  const datosFoto = (id, k) => {
    const c = coordenadasDeSitio(catalogos, 'lanzarote', id)
    return { trip_id: 'lz1', libre: true, origen: 'galeria', con_camara: true, tomada_en: `2026-11-10T1${k}:00:00`, ubicacion: { lat: c.lat + 5 / 111000, lng: c.lng, precision: 10 } }
  }
  // (a) Con 2 sitios vistos: aún sin sello (les falta 1); con 3: sello listo.
  for (const [k, id] of ids.slice(0, 2).entries()) await servicio.foto('U', datosFoto(id, k))
  let r = await calcula()
  const falta = r.sin.find((v) => v.trip_id === 'lz1')
  debe(r.acabados.length === 0 && falta && falta.minimas === 3 && falta.vistas === 2, 'sello', `con 2 sitios vistos aún no hay sello y falta 1 (${JSON.stringify(falta)})`)
  await servicio.foto('U', datosFoto(ids[2], 2))
  r = await calcula()
  debe(r.acabados.some((a) => a.trip_id === 'lz1') && !r.sin.some((v) => v.trip_id === 'lz1'), 'sello', 'con 3 sitios vistos el sello del viaje terminado queda listo para estampar')
  // (b) Una parada de dos en uno sale en DOS filas, cada una con el nombre de su sitio y su colección.
  const nombreDe = (s) => nombreDeSitio(catalogos, 'lanzarote', s)
  const viajeDosEnUno = { id: 'v2', destino: 'lanzarote', inicio: '2026-11-09', fin: '2026-11-13', dias: [{ fecha: '2026-11-11', numero: 3, paradas: [{ nombre: 'Haría y la Casa-Museo César Manrique', stop_id: 's1', sitios: ['haria_pueblo', 'casa_museo_cesar_manrique'] }, { nombre: 'El Golfo y el Charco de los Clicos', stop_id: 's2', sitios: ['el_golfo_y_el_charco_de_los_clicos'] }] }] }
  const pend = pendientes({ datos, destino: 'lanzarote', viaje: viajeDosEnUno, items: new Map(), hoy: '2026-11-18', nombreDe })
  const filas = pend.pendientes.filter((p) => p.falta.includes('pedazo'))
  debe(filas.length === 3, 'dos en uno', `Haría y la Casa-Museo (dos en uno) dan 2 filas y El Golfo y el Charco (V16: un solo sitio) da 1: 3 filas (${filas.map((f) => f.nombre).join(' / ')})`)
  debe(filas.every((f) => f.nombre === 'El Golfo y el Charco de los Clicos' || !/ y (la|el) /.test(f.nombre ?? '')) && filas.every((f) => f.colecciones.length > 0), 'dos en uno', 'cada fila lleva el nombre de SU sitio (no el de la parada de dos en uno) y su colección')
  debe(['Haría', 'Casa-Museo César Manrique', 'El Golfo y el Charco de los Clicos'].every((nom) => filas.some((f) => f.nombre === nom)), 'dos en uno', `los nombres son «Haría», «Casa-Museo César Manrique» y «El Golfo y el Charco de los Clicos» (${filas.map((f) => f.nombre)})`)
  // (c) Ningún texto del servidor lleva un hueco {…} sin rellenar.
  const estado = estadoDestino({ datos, destino: 'lanzarote', items: new Map(), viaje: viajeDosEnUno, hoy: '2026-11-18' })
  const res = resumen({ datos, destino: 'lanzarote', items: new Map(), viaje: viajeDosEnUno, hoy: '2026-11-18', nombreDe })
  const estadoRoma = estadoDestino({ datos, destino: 'roma', items: new Map(), viaje: null, hoy: '2026-11-18' })
  const llaves = [...hayLlaves(estado), ...hayLlaves(res), ...hayLlaves(pend), ...hayLlaves(estadoRoma)]
  debe(llaves.length === 0, 'llaves', `ningún texto del servidor con {…} (${llaves.slice(0, 3).join(' | ')})`)
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const exp = json('data/logros/exp.json')
  debe(exp.viaje_acabado.paradas_minimas === 3, 'sello', 'el sello pide 3 sitios vistos (era 5), para todos los destinos')
  const hoja = leer('src/components/logros/momentos/HojaLogros.tsx')
  debe(/SECRETOS ENCONTRADOS|secretos encontrados/.test(hoja) && /data-ver-resumen-del-viaje/.test(hoja) && /height: 52, minHeight: 52/.test(hoja), 'hoja', 'la hoja lleva los secretos (V25: «N de M secretos encontrados») y el botón del resumen de 52 px que no se aplasta')
  const fotos = leer('src/lib/fotosViaje.ts')
  debe(/urlGrande/.test(fotos) && /MENSAJE_FOTO_REPETIDA/.test(fotos), 'fotos', 'la foto grande y el aviso de foto repetida existen')
  const guardado = leer('src/components/logros/pantallas/ViajeGuardado.tsx')
  debe(/usePortadaDeViaje\(/.test(guardado) && !/urlParaMostrar\(fotos\[0\]\)/.test(guardado), 'portada', 'la portada de los recuerdos sigue la regla única de portada (V15), no la miniatura de la primera foto')
  const conX = [
    'src/components/layout/NewTripSheet.tsx', 'src/components/route/dayDetail/WantInsideDialog.tsx', 'src/components/route/freeDay/DayNameSheet.tsx', 'src/components/route/DatesChangeDialog.tsx',
    'src/components/route/reservas/ReservedMarks.tsx', 'src/components/route/DateNoticesModal.tsx', 'src/components/route/SeasonCard.tsx',
    'src/components/propuesta/PropuestaEnviada.tsx', 'src/components/logros/momentos/ResumenDia.tsx', 'src/components/logros/momentos/PrimerDia.tsx', 'src/components/logros/pantallas/PasaporteScreen.tsx',
    'src/components/logros/momentos/ResumenViaje.tsx',
  ]
  // (V50, 24-nov) La hoja de la hora (`HojaDeHora.tsx`) ya NO lleva X: se cierra tocando fuera o deslizando, sin guardar; solo la papelera y el ✓ cambian la hora.
  debe(!/<CruzDeHoja /.test(leer('src/components/ui/HojaDeHora.tsx')), 'X', 'HojaDeHora.tsx no lleva X (V50)')
  for (const f of conX) debe(/<CruzDeHoja /.test(leer(f)), 'X', `${f.split('/').pop()} lleva su X`)
  const pas = leer('src/components/logros/pantallas/PasaporteScreen.tsx')
  debe((pas.match(/<CruzDeHoja /g) ?? []).length === 3, 'X', 'las 3 hojas del pasaporte (países, «Aún no has estado», «Tu sello aún no está») llevan X')
  debe(/Te \$\{sinSello\.minimas - sinSello\.vistas === 1/.test(pas), 'textos', 'el texto del sello dice cuántos sitios faltan («Te faltan 2 sitios para tu sello»)')
  debe(/puntoDeLaPagina/.test(pas) && /distanciaKm\(c, d\) > 1000/.test(pas), 'globo', 'el globo se acerca a la ciudad del viaje si está lejos del centro del país (Lanzarote: Canarias)')
}

/* ───────── 3. En pantalla ───────── */
console.log('3. En pantalla (móvil de 390 px, demo de logros)')
const preparar = async () => {
  const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0' })
  const ev = (js) => app.evaluar(js)
  const esperar = async (js, intentos = 40, ms = 400) => {
    for (let i = 0; i < intentos; i++) {
      if (await ev(js).catch(() => false)) return true
      await app.esp(ms)
    }
    return false
  }
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
  await ev("window.__miPerfil.getState().poner({ nombre: 'ALICE' }); true")
  // Tres viajes: uno terminado (Lanzarote, del 8 al 13 de noviembre de 2026), uno en curso y uno que empieza en 7 días.
  await ev(`Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/store/useSyncStore.ts'), __imp('/src/components/sync/TripSync.tsx')]).then(([r, s, t]) => {
    const base = t.buildTripPayload()
    const hoy = new Date()
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    const mas = (n) => new Date(hoy.getTime() + n * 86400000)
    const crear = (id, destino, ini, fin) => ({ ...base, id, route: { ...base.route, id, destination: destino, answers: { ...base.route.answers, dateRange: { start: ini, end: fin } } }, generationState: null })
    s.useSyncStore.getState().setSavedTrips([crear('t-curso', 'Florencia', iso(mas(-1)), iso(mas(2))), crear('t-prox', 'Roma', iso(mas(7)), iso(mas(11))), crear('t-hecho', 'Lanzarote', '2026-11-08', '2026-11-13')])
    return true
  })`)
  await app.esp(1500)
  return { app, ev, esperar }
}
const abrirPerfil = async ({ ev, esperar, app }) => {
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
  await esperar("Boolean(document.querySelector('[data-fila-de-viajes]'))", 60, 300)
  await app.esp(1200)
}
const estadoRuta = (ev) => ev("__imp('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); return { id: s.route?.id, modo: s.mode, dia: s.activeDayId } })")
const perfilAbierto = (ev) => ev('Boolean(document.querySelector(\'[role="dialog"][aria-label="Perfil"]\'))')
const quitarPantallas = (ev) => ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")
// Cuánto llena cada dibujo `[data-chapa-igual]` de su caja (la unión de sus trazos visibles) y qué tamaño tiene la caja.
const medirChapas = (raiz) => `(() => {
  return Array.from(document.querySelectorAll(${JSON.stringify(raiz)} + ' [data-chapa-igual]')).map((c) => {
    const b = c.getBoundingClientRect()
    let l = 1e9, t = 1e9, r = -1e9, bo = -1e9
    c.querySelectorAll('path,circle,rect,ellipse,polygon,line,polyline,image').forEach((e) => {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return
      const fill = e.getAttribute('fill') ?? cs.fill, stroke = e.getAttribute('stroke') ?? cs.stroke
      if ((fill === 'none' || fill === 'rgba(0, 0, 0, 0)') && (!stroke || stroke === 'none')) return
      const q = e.getBoundingClientRect(); if (q.width < 0.5 || q.height < 0.5) return
      l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); bo = Math.max(bo, q.bottom)
    })
    // Los exclusivos (capas de CSS en 3D) no se miden por trazos: su marco llena la caja y se escala a mano.
    return { w: Math.round(b.width), h: Math.round(b.height), llena: c.dataset.llenadoFijo ? +(0.9 / Number(c.dataset.llenadoFijo)).toFixed(2) * Number(c.dataset.llenadoFijo) : r > l ? +(Math.max(r - l, bo - t) / b.width).toFixed(2) : null, fijo: Boolean(c.dataset.llenadoFijo), medido: c.dataset.llenado ?? null }
  })
})()`

{
  const P = await preparar()
  const { app, ev, esperar } = P
  try {
    /* 3a. «Mis viajes»: la tarjeta abre el viaje; el botón de álbum abre los recuerdos. */
    await abrirPerfil(P)
    const o = await ev(`(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      const r = (e) => e ? (({ left, right, top, bottom, width, height }) => ({ l: Math.round(left), r: Math.round(right), t: Math.round(top), b: Math.round(bottom), w: Math.round(width), h: Math.round(height) }))(e.getBoundingClientRect()) : null
      return Array.from(d.querySelectorAll('[data-tarjeta-de-viaje]')).map((c) => ({
        id: c.dataset.tarjetaDeViaje, texto: c.innerText.split(String.fromCharCode(10)).join(' | '), etiqueta: c.querySelector('[data-etiqueta-texto]')?.innerText ?? null,
        recuerdos: r(c.querySelector('[data-recuerdos-del-viaje]')), flecha: Boolean(c.querySelector('[data-flecha-del-viaje]')), camara: Boolean(c.querySelector('[data-cambiar-portada]')),
        chips: Array.from(c.querySelectorAll('[data-chip-del-viaje]')).map((x) => x.textContent).join(''), fechas: r(c.querySelector('[data-fechas-del-viaje]')), credito: r(c.querySelector('[data-credito-portada]')), tarjeta: r(c),
      }))
    })()`)
    debe(o.length >= 3 && ['t-curso', 't-prox', 't-hecho'].every((id) => o.some((t) => t.id === id)) && o.every((t) => t.recuerdos && t.recuerdos.w === 38 && t.camara && !t.flecha), 'tarjeta', `las 3 tarjetas llevan el botón de recuerdos de 38 px (donde estaba la flecha) y la cámara, sin flecha (${o.map((t) => t.id)})`)
    const lz = o.find((t) => t.id === 't-hecho')
    const prox = o.find((t) => t.id === 't-prox')
    debe(/^6 días · \d+ paradas?$/.test(lz?.chips ?? '') && !/noche|foto/.test(lz?.chips ?? ''), 'días', `Lanzarote, del 8 al 13: «${lz?.chips}» (6 días, una sola línea; sin noches ni fotos)`)
    debe(prox?.etiqueta === 'En 7 días', 'tarjeta', `la etiqueta del que empieza en 7 días: «${prox?.etiqueta}»`)
    debe(prox?.credito && prox.credito.t - prox.tarjeta.t < 60 && prox.credito.b < prox.fechas.t, 'tarjeta', `el crédito de la foto va arriba, pequeño, sin tapar las fechas (${JSON.stringify(prox?.credito)} frente a fechas ${JSON.stringify(prox?.fechas)})`)
    await app.captura?.(`${CAPTURAS}/perfil_tarjetas.jpg`)

    for (const id of ['t-hecho', 't-curso', 't-prox']) {
      if (!(await perfilAbierto(ev))) await abrirPerfil(P)
      await ev(`document.querySelector('[data-viaje-del-perfil="${id}"]').click(); true`)
      await app.esp(1800)
      const e = await estadoRuta(ev)
      const cerrado = !(await perfilAbierto(ev))
      debe(e.id === id && e.modo === 'route' && cerrado, 'abrir', `tocar la tarjeta de «${id}» abre ese viaje en RUTA y cierra el Perfil (viaje ${e.id}, modo ${e.modo}, perfil cerrado ${cerrado})`)
    }
    await ev("__imp('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('days'); return true })")
    for (const id of ['t-hecho', 't-curso', 't-prox']) {
      if (!(await perfilAbierto(ev))) await abrirPerfil(P)
      await quitarPantallas(ev)
      await ev(`document.querySelector('[data-recuerdos-del-viaje="${id}"]').click(); true`)
      const hay = await esperar(`Boolean(document.querySelector('[data-viaje-guardado="${id}"]'))`, 30, 300)
      debe(hay, 'recuerdos', `el botón de recuerdos de «${id}» abre su página de recuerdos`)
      if (id !== 't-prox') {
        await ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().volver(); return true })")
        await app.esp(500)
      }
    }
    await quitarPantallas(ev)

    /* 3b. La página de recuerdos de Lanzarote: títulos, días, portada grande, [Abrir el viaje] y tocar un día. */
    await ev(`window.__fotosDePrueba = { 't-hecho': [0, 1, 2, 3].map((i) => ({ id: 'f' + i, tripId: 't-hecho', dayId: 'd1', dayNumber: 1 + (i % 2), stopName: null, storagePath: '', width: 1600, height: 1000, bytes: 1, createdAt: '2026-11-1' + i + 'T10:00:00Z', url: '/fotos/roma/dia_coliseo.jpg', urlMin: '/fotos/roma/dia_coliseo_p.jpg' })) }; true`)
    if (!(await perfilAbierto(ev))) await abrirPerfil(P)
    await ev('document.querySelector(\'[data-recuerdos-del-viaje="t-hecho"]\').click(); true')
    await esperar("Boolean(document.querySelector('[data-viaje-guardado=\"t-hecho\"] [data-tus-fotos]'))", 30, 300)
    await app.esp(1200)
    const g = await ev(`(() => {
      const d = document.querySelector('[data-viaje-guardado="t-hecho"]')
      const p = d.querySelector('[data-portada-grande]')
      return { fechas: d.querySelector('[data-fechas-y-dias]')?.innerText, dias: d.querySelector('[data-titulo-tus-dias]')?.innerText, fotos: d.querySelector('[data-titulo-tus-fotos]')?.innerText, sus: /\\bSus (días|fotos)\\b/.test(d.innerText),
        portada: p ? p.getAttribute('src') : null, miniaturaEnCuadricula: Array.from(d.querySelectorAll('[data-tus-fotos] img')).every((i) => /_p\\.jpg$/.test(i.getAttribute('src') ?? '')),
        boton: (() => { const b = d.querySelector('[data-abrir-el-viaje]'); const r = b?.getBoundingClientRect(); const portada = d.firstElementChild.getBoundingClientRect(); return b ? { h: Math.round(r.height), w: Math.round(r.width), debajo: r.top >= portada.bottom - 1, oscuro: getComputedStyle(b).backgroundColor } : null })(),
        llaves: /\\{[a-z_]+\\}/i.test(d.innerText) }
    })()`)
    debe(/6 días/.test(g.fechas ?? '') && !/7 días/.test(g.fechas ?? '') && /8 – 13 nov/.test(g.fechas ?? ''), 'días', `la portada dice «${g.fechas}» (del 8 al 13 = 6 días)`)
    debe(g.dias === 'Tus días' && g.fotos === 'Tus fotos' && !g.sus, 'recuerdos', `«${g.dias}» y «${g.fotos}» (ya no «Sus»)`)
    debe(g.portada === '/fotos/lanzarote/playas_de_papagayo_p.jpg', 'portada', `V15: sin fotos hechas en el destino con ubicación, la portada es la del destino (${g.portada})`)
    debe(g.miniaturaEnCuadricula, 'portada', 'la cuadrícula de «Tus fotos» sigue con las miniaturas')
    debe(g.boton && g.boton.h === 54 && g.boton.debajo && /28, 34, 48/.test(g.boton.oscuro), 'abrir', `[Abrir el viaje ›] oscuro, de 54 px y debajo de la portada (${JSON.stringify(g.boton)})`)
    debe(!g.llaves, 'llaves', 'ningún texto con {…} en los recuerdos')
    await app.captura?.(`${CAPTURAS}/recuerdos.jpg`)
    await ev("document.querySelector('[data-abrir-el-viaje]').click(); true")
    await app.esp(1800)
    let e = await estadoRuta(ev)
    debe(e.id === 't-hecho' && e.modo === 'route' && !(await perfilAbierto(ev)) && !(await ev("Boolean(document.querySelector('[data-viaje-guardado]'))")), 'abrir', `[Abrir el viaje] lleva a RUTA con ese viaje (viaje ${e.id}, modo ${e.modo})`)
    await abrirPerfil(P)
    await ev('document.querySelector(\'[data-recuerdos-del-viaje="t-hecho"]\').click(); true')
    await esperar("Boolean(document.querySelector('[data-dia-del-viaje]'))", 30, 300)
    await ev("document.querySelector('[data-dia-del-viaje=\"2\"]')?.click() ?? document.querySelector('[data-dia-del-viaje]').click(); true")
    await app.esp(2000)
    e = await estadoRuta(ev)
    debe(e.id === 't-hecho' && e.modo === 'days' && e.dia, 'abrir', `al tocar un día se abre ese día del viaje (modo ${e.modo}, día ${e.dia})`)

    /* 3c. La foto repetida: misma fecha y hora de cámara y mismo tamaño. */
    const rep = await ev(`__imp('/src/lib/fotosViaje.ts').then((m) => ({
      igual: m.esLaMismaFoto([{ tomadaEn: '2026-11-10T10:00:00Z' }], '2026-11-10T10:00:00Z'),
      otraHora: m.esLaMismaFoto([{ tomadaEn: '2026-11-10T10:00:00Z' }], '2026-11-10T11:30:00Z'),
      sinCandidatas: m.esLaMismaFoto([], '2026-11-10T10:00:00Z'),
      sinFechaDeCamara: m.esLaMismaFoto([{ tomadaEn: null }], null),
      msg: m.MENSAJE_FOTO_REPETIDA,
    }))`)
    debe(rep.igual && !rep.otraHora && !rep.sinCandidatas && rep.sinFechaDeCamara && rep.msg === 'Esta foto ya está en tu viaje.', 'foto repetida', `misma hora y tamaño = repetida; otra hora o sin parecida = nueva (${JSON.stringify(rep)})`)
    await quitarPantallas(ev)

    /* 3d. La vitrina con los 3 huecos llenos: el «+» no tapa nada. */
    if (!(await perfilAbierto(ev))) await abrirPerfil(P)
    await ev("document.querySelector('[data-perfil-scroll]').scrollTop = 99999; true")
    await app.esp(600)
    const v = await ev(`(() => {
      const d = document.querySelector('[data-vitrina-del-perfil]')
      const r = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom } }
      const huecos = Array.from(d.querySelectorAll('[data-hueco-de-vitrina]'))
      const mas = d.querySelector('[data-mas-de-vitrina-cabecera]')
      const m = mas ? r(mas) : null
      const cruza = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t
      return { tipos: huecos.map((h) => h.dataset.huecoDeVitrina), masEnHueco: Boolean(d.querySelector('[data-mas-de-vitrina]')), cabecera: Boolean(m), tapa: m ? huecos.some((h) => cruza(m, r(h.querySelector('span.relative') ?? h))) : null, tam: m ? Math.round(m.r - m.l) : null, cab: d.firstElementChild?.innerText.split(String.fromCharCode(10)).join(' | ') }
    })()`)
    debe(v.tipos.length === 3 && v.tipos.every((t) => t === 'pieza') && !v.masEnHueco && v.cabecera && v.tapa === false && v.tam === 28, 'vitrina', `con los 3 huecos llenos, el «+» pequeño (28 px) va en la cabecera y no tapa ninguno (${JSON.stringify(v)})`)
    await app.captura?.(`${CAPTURAS}/vitrina.jpg`)
    await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar(); return true })")
    await app.esp(500)

    /* 3e. La hoja «Tus logros en Lanzarote»: aire entre bloques, emblemas ocultos y el botón del resumen (como Design). */
    await ev("__imp('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ destination: 'Lanzarote', screen: 'route', mode: 'days' }); return true })")
    const estado = json('src/dev/escaparates/datos/hoja_lz_completa.json')
    estado.secretos = { ...estado.secretos, total: 11, encontrados: 3, encontrados_lista: estado.secretos.encontrados_lista.slice(0, 3) }
    estado.viaje = { ...estado.viaje, hoy: '2026-11-18' }
    await ev("window.__demoHoy = '2026-11-18'; __imp('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ dev_simulated_today_iso: '2026-11-18' }); return true })")
    await ev(`Promise.all([__imp('/src/components/logros/momentos/api.ts'), __imp('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 50); return true })`)
    // (V25) Si «Tu primer día» (Lanzarote, día 1) aún está en pantalla, tiene el turno de la fila: se cierra antes de pedir la hoja.
    await ev("Array.from(document.querySelectorAll('button')).find((b) => /Empezar mi día/.test(b.textContent || ''))?.click(); true")
    await app.esp(1500)
    await esperar("Boolean(document.querySelector('[data-hoja-logros]'))", 40, 250)
    await app.esp(1800)
    console.log('   diag ruta:', JSON.stringify(await ev(`Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/lib/reclamar.ts')]).then(([s, m]) => { const route = s.useRouteStore.getState().route; return { id: route?.id, rango: route?.answers?.dateRange, fase: m.faseDeReclamo(route), hay: m.hayBotonDeReclamar(route) } })`)))
    const h = await ev(`(() => {
      const d = document.querySelector('[data-hoja-logros]')
      const r = (e) => e ? (({ top, bottom, height, width }) => ({ t: Math.round(top), b: Math.round(bottom), h: Math.round(height), w: Math.round(width) }))(e.getBoundingClientRect()) : null
      const et = d.querySelector('[data-etiqueta-de-fase]')
      const titulo = et?.nextElementSibling
      const sc = d.querySelector('[data-hoja-logros] > div:last-child') ? null : null
      void sc
      const boton = d.querySelector('[data-reclamar="boton"]')
      const plazo = d.querySelector('[data-reclamar="plazo"]')
      const sello = d.querySelector('[data-sello]')
      const ver = d.querySelector('[data-ver-resumen-del-viaje]')
      const desborda = ver ? ver.scrollHeight > ver.clientHeight + 1 : null
      const tit = d.querySelector('[data-titulo-secretos]')
      return { et: r(et), titulo: r(titulo), boton: r(boton), plazo: r(plazo), sello: r(sello), ver: r(ver), desborda, secretos: tit?.innerText, ocultos: /EMBLEMAS OCULTOS/.test(d.innerText), llaves: /\\{[a-z_]+\\}/i.test(d.innerText), fase: d.dataset.hojaLogros }
    })()`)
    // (V14) La cabecera ya no es un bloque grande fijo: solo una barra fina con el título y la X; la etiqueta de fase y el botón de reclamar van dentro del scroll (lo mira pruebaV14).
    debe(h.et && h.boton && h.boton.t - h.et.b >= 10, 'aire', `entre la etiqueta de fase y [Reclamar con tus fotos] hay ${h.boton && h.et ? h.boton.t - h.et.b : '?'} px`)
    debe(h.plazo && h.sello && h.sello.t - h.plazo.b >= 22, 'aire', `entre «Puedes reclamar hasta…» y la tarjeta de la medalla hay ${h.plazo && h.sello ? h.sello.t - h.plazo.b : '?'} px (≈24)`)
    debe(/3 de 11 secretos encontrados/i.test(h.secretos ?? ''), 'emblemas', `(V25) el bloque de secretos dice «${h.secretos}»`)
    debe(!h.llaves, 'llaves', 'ningún texto con {…} en la hoja de logros')
    await app.captura?.(`${CAPTURAS}/hoja_arriba.jpg`)
    await ev("(() => { const e = document.querySelector('[data-hoja-logros] [style*=\"overflow-y: auto\"]'); if (e) e.scrollTop = 99999; return true })()")
    await app.esp(500)
    const h2 = await ev(`(() => { const ver = document.querySelector('[data-ver-resumen-del-viaje]'); const b = ver?.getBoundingClientRect(); return ver ? { h: Math.round(b.height), w: Math.round(b.width), desborda: ver.scrollHeight > ver.clientHeight + 1, texto: ver.innerText, oscuro: getComputedStyle(ver).backgroundColor, icono: Boolean(ver.querySelector('span[aria-hidden] svg')), flecha: ver.querySelectorAll('svg').length >= 2 } : null })()`)
    debe(h2 && h2.h === 52 && !h2.desborda && /Ver el resumen del viaje/.test(h2.texto) && /28, 34, 48/.test(h2.oscuro) && h2.icono && h2.flecha && h2.w >= 300, 'botón', `[Ver el resumen del viaje]: oscuro, de 52 px de alto, con el icono dorado y la flecha, sin aplastar (${JSON.stringify(h2)})`)
    await app.captura?.(`${CAPTURAS}/hoja_resumen_boton.jpg`)
    await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarHojaLogros(); return true })")

    /* 3f. El resumen del viaje: los logros de viajero, todos del mismo tamaño, y la hoja de sorpresas con X y sus dos-en-uno. */
    const ganado = [
      { clave: 'a', logro: 'pedazo', escalon: estado.colecciones[0].id + ':' + estado.colecciones[0].sitios[0].sitio, destino: 'lanzarote', en: '2026-11-10T10:00:00Z' },
      ...['viajes:1', 'paises:1', 'fundador:', 'edicion_anio:2026', 'dia_perfecto:', 'el_fotografo:'].map((x, i) => ({ clave: 'v' + i, logro: 'viajero:' + x.split(':')[0], escalon: x.split(':')[1], destino: 'lanzarote', en: '2026-11-13T10:00:00Z' })),
    ]
    const defs = ['viajes', 'paises', 'fundador', 'edicion_anio', 'dia_perfecto', 'el_fotografo'].map((id, i) => ({ id, grupo: 'x', nombre: ['Primera parada', 'Dos billetes', 'Viajero fundador', '{ciudad} {anio}', 'Día perfecto', 'El fotógrafo'][i], linea: '', escalones: id === 'viajes' || id === 'paises' ? [{ n: 1, nombre: id === 'viajes' ? 'Primera parada' : 'Dos billetes' }] : [] }))
    const resumenDemo = { ok: true, ganado, por_categoria: {}, pendiente: { sorpresas: 4, pedazos: 4, dias_para_reclamar: 20, texto: null, pendientes: [
      { fecha: '2026-11-11', dia: 3, sitio: 'haria_pueblo', nombre: 'Haría', falta: ['pedazo'], colecciones: ['Los pueblos con alma'] },
      { fecha: '2026-11-11', dia: 3, sitio: 'casa_museo_cesar_manrique', nombre: 'Casa-Museo César Manrique', falta: ['pedazo'], colecciones: ['Manrique'] },
      { fecha: '2026-11-12', dia: 4, sitio: 'el_golfo_pueblo', nombre: 'El Golfo', falta: ['pedazo'], colecciones: ['Fuego y mar'] },
      { fecha: '2026-11-12', dia: 4, sitio: 'charco_de_los_clicos', nombre: 'Charco de los Clicos', falta: ['pedazo'], colecciones: ['Fuego y mar'] },
    ] }, texto_viaje: 'Un viaje', texto_viaje_tipo: 'wow' }
    await ev(`Promise.all([__imp('/src/components/logros/momentos/api.ts'), __imp('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; api.datosDePrueba.resumen = ${JSON.stringify(resumenDemo)}; api.datosDePruebaViajero.v = ${JSON.stringify({ ok: true, logros: defs })}; ui.useMomentosUI.getState().abrirResumenViaje(); return true })`)
    await esperar("Boolean(document.querySelector('[data-resumen-viajero] [data-chapa-igual]'))", 60, 400)
    await app.esp(3500)
    const ch = await ev(medirChapas('[data-resumen-del-viaje] [data-resumen-viajero]'))
    debe(ch.length >= 5, 'viajero', `salen ${ch.length} logros de viajero en el resumen`)
    debe(ch.length > 0 && ch.every((c) => c.w === ch[0].w && c.h === ch[0].h), 'viajero', `todos en una caja del mismo tamaño (${ch.map((c) => c.w + 'x' + c.h).join(', ')})`)
    const llenas = ch.map((c) => c.llena).filter((x) => x != null)
    debe(llenas.length >= 4 && Math.max(...llenas) - Math.min(...llenas) <= 0.09 && Math.min(...llenas) >= 0.8 && Math.max(...llenas) <= 1.0, 'viajero', `el dibujo de cada uno llena su caja igual (${llenas.join(', ')}), sin que el marco de los exclusivos los agrande`)
    await ev("document.querySelector('[data-resumen-viajero]').scrollIntoView({ block: 'center' }); true")
    await app.esp(600)
    await app.captura?.(`${CAPTURAS}/resumen_viajero.jpg`)
    await ev("document.querySelector('[data-sorpresas-por-reclamar]').click(); true")
    await esperar("Boolean(document.querySelector('[data-hoja-sorpresas]'))", 30, 300)
    await app.esp(900)
    const s = await ev(`(() => { const d = document.querySelector('[data-hoja-sorpresas]'); const x = d?.querySelector('[data-cruz-de-hoja]'); const r = x?.getBoundingClientRect(); return { filas: Array.from(d.querySelectorAll('[data-sorpresa]')).map((e) => e.innerText.split(String.fromCharCode(10)).join(' | ')), x: x ? { w: Math.round(r.width), h: Math.round(r.height) } : null, texto: d.innerText } })()`)
    debe(s.x && s.x.w === 48 && s.x.h === 48, 'X', `la hoja «Te quedan N sorpresas por reclamar» tiene su X (${JSON.stringify(s.x)})`)
    debe(s.filas.length === 4 && ['Haría', 'Casa-Museo César Manrique', 'El Golfo', 'Charco de los Clicos'].every((nom) => s.filas.some((f) => f.startsWith(nom + ' |'))) && !/ y la Casa-Museo| y el Charco/.test(s.texto), 'dos en uno', `cada sitio en su fila con su colección (${s.filas.join(' // ')})`)
    await app.captura?.(`${CAPTURAS}/sorpresas.jpg`)
    await ev("document.querySelector('[data-hoja-sorpresas] [data-cruz-de-hoja]').click(); true")
    await app.esp(500)
    debe(!(await ev("Boolean(document.querySelector('[data-hoja-sorpresas]'))")), 'X', 'tocar la X cierra la hoja de sorpresas')
    await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarResumenViaje(); return true })")

    /* 3g. «Todos mis logros»: los logros de viajero, del mismo tamaño; sin textos con {…}. */
    await ev("__imp('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = null; api.datosDePrueba.resumen = null; return true })")
    await ev("window.__demoGanados.poner('lleno'); __imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); setTimeout(() => m.useLogrosPantallas.getState().abrir({ t: 'todos', pestana: 'todos' }), 100); return true })")
    await esperar("Boolean(document.querySelector('[data-todos] [data-tarjeta-de-viajero] [data-chapa-igual]'))", 60, 400)
    await app.esp(2500)
    const t = await ev(medirChapas('[data-todos] [data-tarjeta-de-viajero]'))
    debe(t.length >= 4 && t.every((c) => c.w === t[0].w && c.h === t[0].h), 'viajero', `en «Todos mis logros», todos los de viajero en una caja del mismo tamaño (${[...new Set(t.map((c) => c.w + 'x' + c.h))]}; ${t.length} logros)`)
    const llenasT = t.map((c) => c.llena).filter((x) => x != null)
    debe(llenasT.length >= 4 && Math.max(...llenasT) - Math.min(...llenasT) <= 0.09, 'viajero', `y el dibujo llena su caja igual (${[...new Set(llenasT)].join(', ')})`)
    const llavesT = await ev('/\\{[a-z_]+\\}/i.test(document.body.innerText)')
    debe(!llavesT, 'llaves', 'ningún texto con {…} en «Todos mis logros»')
    await app.captura?.(`${CAPTURAS}/todos_viajero.jpg`)
    await quitarPantallas(ev)
  } finally {
    await app.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
