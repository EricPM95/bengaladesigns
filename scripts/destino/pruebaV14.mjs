// La prueba de la Tanda V14: MÁS ARREGLOS QUE HA VISTO ERIC (la lista de la colección que se queda y [Ver la colección ›], la cabecera de la hoja que no tapa, las fotos y lo instantáneo de la pestaña «Logros»
// de la ficha, las fotos y la portada del resumen, el pasaporte con isla, 3 sellos por página, la fecha del primer día, [Ver mi sello], la vitrina grande, el globo de la tarjeta que se mueve y «Mi vitrina» del mismo tamaño).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV14.mjs
// 1. El servidor y el código   2. En pantalla (demo de logros; ninguna llamada a producción). Capturas en docs/dias/V14_capturas/.
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo } from '../../server/logros/datos.js'
import { viajesAcabados } from '../../server/logros/exp.js'
import { paginasDelPasaporte } from '../../server/logros/pantallas/previos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { coordenadasDeSitio } from '../../server/logros/datos.js'
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
const CAPTURAS = 'docs/dias/V14_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. El servidor: la fecha del sello es la del PRIMER día ───────── */
console.log('1. El servidor: la fecha del sello es la del primer día del viaje')
{
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
  const hechos = []
  const viajes = [{ id: 'lz1', traveler_id: 'U', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 's1', name: 'Timanfaya' }] }] } }]
  let n = 0
  const logros = []
  const repo = {
    hechosDe: async () => hechos.filter((h) => !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h },
    deshacerHecho: async () => {}, viajesDe: async () => viajes, logrosDe: async () => logros,
    insertarLogros: async (u, filas) => { const d = []; for (const f of filas) { if (logros.some((l) => l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue; const l = { user_id: u, ...f, escalon: String(f.escalon ?? ''), ganado_en: '2026-11-10T10:00:00.000Z' }; logros.push(l); d.push(l) } return d },
    borrarLogros: async () => {}, cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }), ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null,
    sinPaseDe: async () => false, pasesDe: async () => [{ id: 'p', tipo: 'solo', estado: 'activo' }], pruebaDe: async () => null, guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {}, fotoUrl: async () => null,
  }
  const reloj = new Date('2026-11-18T12:00:00Z')
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  const ids = Object.keys(datos.destinos.lanzarote.sitios).filter((s) => coordenadasDeSitio(catalogos, 'lanzarote', s)).slice(0, 3)
  for (const [k, id] of ids.entries()) {
    const c = coordenadasDeSitio(catalogos, 'lanzarote', id)
    await servicio.foto('U', { trip_id: 'lz1', libre: true, origen: 'galeria', con_camara: true, tomada_en: `2026-11-10T1${k}:00:00`, ubicacion: { lat: c.lat + 5 / 111000, lng: c.lng, precision: 10 } })
  }
  const c = await servicio.cargar('U')
  const acabados = viajesAcabados({ datos, hechos: c.hechos, viajes: c.viajes, ahora: reloj })
  debe(acabados.length === 1 && acabados[0].inicio === '2026-11-08' && acabados[0].fin === '2026-11-13', 'fecha', `el viaje acabado lleva su primer día (${JSON.stringify(acabados[0])})`)
  const base = { tus_paises: [{ pais: 'España', entrada: '2026-11-08', destinos: [], continente: 'Europa' }], por_descubrir: [], numeros: {} }
  const paginas = paginasDelPasaporte({ datos, base, previos: { paises: [], dias: 0 }, catalogo: [{ n: 'España', i: 'es', c: 'Europa' }], hechos: c.hechos, viajes: c.viajes, acabados })
  const sello = paginas[0]?.sellos.find((s) => s.trip_id === 'lz1')
  debe(sello?.fecha === '2026-11-08', 'fecha', `el sello de Lanzarote, del 8 al 13, lleva el 8 («${sello?.fecha}»), no el 13`)
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const sd = leer('src/components/logros/pantallas/mundo/selloDatos.ts')
  debe(/f\.slice\(8, 10\)/.test(sd) && !/Number\(f\.slice\(8, 10\)\)/.test(sd), 'fecha', 'el día del sello siempre con dos cifras')
  debe(/MON\.lanzarote/.test(sd) && /'oval'/.test(sd) && /TINTA_LAVA/.test(sd), 'sello', 'el sello de Lanzarote es el de Design (ovalado, tinta de lava, el volcán)')
  const pas = leer('src/components/logros/pantallas/PasaporteScreen.tsx')
  debe(/SELLOS_POR_PAGINA = 3/.test(pas) && !/sub \* 4/.test(pas), 'sellos', 'cada página del pasaporte lleva 3 sellos')
  debe(/usePaisesYTierra\(true\)/.test(pas), 'mapa', 'el pasaporte pide el mapa con islas')
  const tarjeta = leer('src/components/logros/pantallas/perfil/TarjetaPasaporte.tsx')
  debe(!/SELLOS_DE_MUESTRA/.test(tarjeta) && !/muestra/.test(tarjeta.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'tarjeta', 'la tarjeta ya no lleva sellos de muestra')
  const lista = leer('src/components/logros/ficha/ListaDeColeccion.tsx')
  debe(/fetchPlacePhoto\(nombre, ciudad, null, 'small'\)/.test(lista) && /foto_url/.test(lista) && /Ver la colección/.test(lista), 'fotos', 'la lista usa la foto con la que se ganó y, si no, la de nuestros datos (misma regla que la colección); y el enlace «Ver la colección ›»')
  const ficha = leer('src/components/logros/ficha/PestanaLogros.tsx')
  debe(/estadoGuardado\(tripId\)/.test(ficha) && /ListaDeColeccion/.test(ficha), 'instante', 'la pestaña «Logros» de la ficha sale con lo guardado y usa la misma lista que la hoja')
  debe(fs.existsSync('supabase/migrations/0080_globo_del_pasaporte.sql') && fs.existsSync('docs/dias/COMPROBAR_0080.sql'), 'globo', 'la migración 0080 (posición del globo en la cuenta) y su COMPROBAR existen')
  const tierra = json('src/components/logros/pantallas/mundo/tierra50.json')
  const lanzarote = (tierra.t.es ?? []).filter((a) => { const x = a[0] / tierra.k; const y = a[1] / tierra.k; return x > -14 && x < -13 && y > 28.9 && y < 29.3 })
  debe(lanzarote.length >= 1, 'mapa', `el mapa con detalle trae la isla de Lanzarote (${lanzarote.length} anillos en su sitio)`)
  const tierraAntes = json('src/components/logros/pantallas/mundo/tierra110.json')
  const enLz = (tierraAntes.es ?? []).filter((a) => { const x = a[0] / 10; const y = a[1] / 10; return x > -14 && x < -13 && y > 28.9 && y < 29.3 })
  debe(enLz.length === 0, 'mapa', 'el mapa de siempre (110m) NO tenía Lanzarote: por eso el punto salía en el mar')
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
  return { app, ev, esperar }
}
const quitarPantallas = (ev) => ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")
const abrirPantalla = (ev, p) => ev(`__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); setTimeout(() => m.useLogrosPantallas.getState().abrir(${JSON.stringify(p)}), 80); return true })`)
// El tamaño de lo que se ve de un dibujo: la unión de sus trazos visibles.
const medirDibujo = `(caja) => {
  const b = caja.getBoundingClientRect()
  let l = 1e9, t = 1e9, r = -1e9, bo = -1e9
  caja.querySelectorAll('path,circle,rect,ellipse,polygon,line,polyline,image').forEach((e) => {
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return
    const fill = e.getAttribute('fill') ?? cs.fill, stroke = e.getAttribute('stroke') ?? cs.stroke
    if ((fill === 'none' || fill === 'rgba(0, 0, 0, 0)') && (!stroke || stroke === 'none')) return
    const q = e.getBoundingClientRect(); if (q.width < 0.5 || q.height < 0.5) return
    l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); bo = Math.max(bo, q.bottom)
  })
  return { caja: Math.round(b.width), visible: r > l ? Math.round(Math.max(r - l, bo - t)) : null }
}`

const P = await preparar()
const { app, ev, esperar } = P
try {
  const rid = await ev("__imp('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.id)")
  const estado = json('src/dev/escaparates/datos/hoja_lz_completa.json')
  estado.viaje = { ...estado.viaje, hoy: '2026-11-18' }
  // La primera colección, a medias (1 visto y el resto por ver), para ver los dos estados en la lista.
  estado.colecciones[0] = { ...estado.colecciones[0], n: 1, completa: false, sitios: estado.colecciones[0].sitios.map((x, i) => ({ ...x, visto: i === 0 })) }
  await ev("window.__demoHoy = '2026-11-18'; __imp('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ destination: 'Lanzarote', screen: 'route', mode: 'days', dev_simulated_today_iso: '2026-11-18' }); return true })")

  /* 3a. La hoja «Tus logros en …»: la lista se queda, con fotos y [Ver la colección ›]; la cabecera no tapa. */
  // Las fotos de la colección: la de la cuenta con la que se ganó el primer sitio (el servidor la manda en /api/logros/coleccion).
  const primera = estado.colecciones[0]
  await ev(`window.__demoColeccion = { [${JSON.stringify(primera.id)}]: { ok: true, destino: 'lanzarote', ciudad: 'Lanzarote', coleccion: { id: ${JSON.stringify(primera.id)}, nombre: 'x', n: 1, total: ${primera.sitios.length}, completa: false, fecha: null, al_completar: null }, sitios: ${JSON.stringify(primera.sitios.map((x, i) => ({ sitio: x.sitio, nombre: x.nombre ?? x.sitio, visto: x.visto, fecha: null, en_ruta: false, dia: null, foto_url: i === 0 ? '/fotos/roma/dia_coliseo.jpg' : null })))}, con_ruta: false, viaje: null } }; true`)
  await ev(`Promise.all([__imp('/src/components/logros/momentos/api.ts'), __imp('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 100); return true })`)
  await esperar("Boolean(document.querySelector('[data-hoja-logros]'))", 40, 250)
  await app.esp(1800)
  const antes = await ev(`(() => {
    const d = document.querySelector('[data-hoja-logros]')
    const r = (e) => e ? (({ top, bottom, height }) => ({ t: Math.round(top), b: Math.round(bottom), h: Math.round(height) }))(e.getBoundingClientRect()) : null
    return { barra: r(d.querySelector('[data-barra-de-logros]')), titulo: d.querySelector('[data-titulo-de-logros]')?.innerText, reclamar: r(d.querySelector('[data-reclamar="boton"]')), sello: r(d.querySelector('[data-sello]')), etiqueta: r(d.querySelector('[data-etiqueta-de-fase]')) }
  })()`)
  debe(antes.barra && antes.barra.h <= 56 && /Tus logros en/.test(antes.titulo ?? ''), 'cabecera', `lo único fijo es una barra fina con el título y la X (${JSON.stringify(antes.barra)}; «${antes.titulo}»)`)
  await app.captura(`${CAPTURAS}/hoja_arriba.jpg`)
  await ev("document.querySelector('[data-cuerpo-de-logros]').scrollTop = 320; true")
  await app.esp(500)
  const despues = await ev(`(() => { const d = document.querySelector('[data-hoja-logros]'); const r = (e) => e ? Math.round(e.getBoundingClientRect().top) : null; return { barra: r(d.querySelector('[data-barra-de-logros]')), sello: r(d.querySelector('[data-sello]')), reclamar: r(d.querySelector('[data-reclamar="boton"]')), etiqueta: r(d.querySelector('[data-etiqueta-de-fase]')) } })()`)
  debe(despues.barra === antes.barra.t && despues.sello < antes.sello.t - 100, 'cabecera', `al bajar, la barra se queda y la tarjeta de la medalla sube con el resto (barra ${antes.barra.t}→${despues.barra}; medalla ${antes.sello.t}→${despues.sello})`)
  debe(antes.reclamar == null || despues.reclamar < antes.reclamar.t - 100, 'cabecera', `[Reclamar con tus fotos] no se queda quieto tapando: se mueve con el scroll (${antes.reclamar?.t}→${despues.reclamar})`)
  await ev("document.querySelector('[data-cuerpo-de-logros]').scrollTop = 0; true")
  await app.esp(300)
  // Tocar una colección: se abre su lista (✓ / ○) y SE QUEDA; al final, [Ver la colección ›].
  const idFila = primera.id
  await ev(`document.querySelector('[data-coleccion="${idFila}"]').scrollIntoView({ block: 'center' }); document.querySelector('[data-coleccion="${idFila}"] > div').click(); true`)
  await esperar(`Boolean(document.querySelector('[data-lista-de-coleccion="${idFila}"]'))`, 30, 200)
  await app.esp(1200)
  const li = await ev(`(() => {
    const d = document.querySelector('[data-lista-de-coleccion="${idFila}"]')
    const filas = Array.from(d.querySelectorAll('[data-sitio-de-lista]'))
    return { n: filas.length, vistos: filas.filter((f) => f.dataset.estado === 'visto').length, porVer: filas.filter((f) => f.dataset.estado === 'pendiente').length, textos: filas.map((f) => f.innerText.split(String.fromCharCode(10)).join('|')),
      marcas: filas.map((f) => f.querySelector('[data-marca-de-sitio]')?.innerText ?? ''), fotos: filas.map((f) => f.querySelector('[data-foto-de-sitio-lista]')?.dataset.fotoDeSitioLista), primeraFoto: filas[0]?.querySelector('[data-foto-de-sitio-lista]')?.style.background ?? '',
      enlace: d.querySelector('[data-ver-la-coleccion]')?.innerText.trim() ?? null, enlaceAlFinal: d.lastElementChild === d.querySelector('[data-ver-la-coleccion]') }
  })()`)
  debe(li.n === primera.sitios.length && li.vistos === primera.sitios.filter((s) => s.visto).length && li.porVer === primera.sitios.filter((s) => !s.visto).length, 'lista', `la lista tiene un sitio por fila, con lo visto y lo por ver (${li.n}: ${li.vistos} vistos, ${li.porVer} por ver)`)
  debe(li.textos.every((t) => /\|(Visto|Por ver)/.test(t)) && li.marcas.some((m) => m === '✓') && li.marcas.some((m) => m === ''), 'lista', `cada fila dice «Visto» o «Por ver» y lleva su marca ✓ / ○ (${li.textos.slice(0, 2).join(' // ')})`)
  debe(li.enlace === 'Ver la colección' && li.enlaceAlFinal, 'lista', `al final de la lista, «Ver la colección ›» (${li.enlace})`)
  debe(/dia_coliseo/.test(li.primeraFoto) && li.fotos[0] === '1', 'fotos', `la foto con la que se ganó el sitio sale en su fila (${li.primeraFoto.slice(0, 60)})`)
  debe(li.fotos.every((x) => x === '0' || x === '1'), 'fotos', 'cada fila tiene su cuadrado de foto (la de los datos mientras llega)')
  await app.captura(`${CAPTURAS}/hoja_lista.jpg`)
  // La lista SE QUEDA: tocar otra vez la colección la cierra (desplegable), pero abierta se queda abierta aunque se toque dentro.
  await ev(`document.querySelector('[data-lista-de-coleccion="${idFila}"] [data-sitio-de-lista]').click(); true`)
  await app.esp(300)
  debe(await ev(`Boolean(document.querySelector('[data-lista-de-coleccion="${idFila}"]'))`), 'lista', 'tocar un sitio de la lista no la cierra: SE QUEDA')
  // [Ver la colección ›] abre la pantalla de la colección (V9).
  await ev(`document.querySelector('[data-lista-de-coleccion="${idFila}"] [data-ver-la-coleccion]').click(); true`)
  const pantalla = await esperar("document.body.innerText.length > 0 && Boolean(document.querySelector('[data-foto-de-sitio], .dst'))", 30, 300)
  const pila = await ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => m.useLogrosPantallas.getState().pila.map((p) => p.t + ':' + (p.coleccion ?? '')))")
  debe(pantalla && pila.includes(`coleccion:${idFila}`), 'lista', `[Ver la colección ›] abre la pantalla de esa colección (pila: ${pila})`)
  await app.captura(`${CAPTURAS}/coleccion_de_la_v9.jpg`)
  await quitarPantallas(ev)
  await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarHojaLogros(); return true })")

  /* 3b. El resumen del viaje: las colecciones se abren, las fotos cuentan lo mismo que el Perfil y la portada es del destino. */
  const ruta = await ev("__imp('/src/store/useRouteStore.ts').then((m) => { const r = m.useRouteStore.getState().route; return { id: r.id, paradas: r.days.flatMap((d) => d.stops.filter((s) => !s.isZoneWalk && s.coordinates).map((s) => ({ lat: s.coordinates.lat, lng: s.coordinates.lng, nombre: s.name }))) } })")
  const validas = ruta.paradas.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))
  const centro = { lat: validas.reduce((n, p) => n + p.lat, 0) / validas.length, lng: validas.reduce((n, p) => n + p.lng, 0) / validas.length }
  const sitioVisto = primera.sitios.find((s) => s.visto) ?? primera.sitios[0]
  const foto = (id, ex) => ({ id, tripId: ruta.id, dayId: 'd1', dayNumber: 1, stopName: null, storagePath: '', width: 1600, height: 1000, bytes: 1, createdAt: '2026-11-10T10:00:00Z', url: '/fotos/roma/dia_coliseo.jpg', urlMin: '', ...ex })
  await ev(`window.__fotosDePrueba = { ${JSON.stringify(ruta.id)}: ${JSON.stringify([
    foto('casa', { createdAt: '2026-11-08T07:00:00Z', url: '/fotos/roma/casa_maleta.jpg', lat: 40.4, lng: -3.7 }),
    foto('sin_sitio', { createdAt: '2026-11-09T07:00:00Z', url: '/fotos/roma/sin_sitio.jpg', lat: null, lng: null }),
    foto('en_destino', { createdAt: '2026-11-10T07:00:00Z', url: '/fotos/roma/en_destino.jpg', lat: centro.lat, lng: centro.lng }),
    foto('con_logro', { createdAt: '2026-11-11T07:00:00Z', url: '/fotos/roma/con_logro.jpg', lat: centro.lat, lng: centro.lng, stopName: sitioVisto.nombre ?? sitioVisto.sitio }),
  ])} }; window.__fotosPrueba = { ${JSON.stringify(ruta.id)}: 6 }; true`)
  // El id del viaje en la nube NO es el de la ruta: antes el resumen contaba con él y salía 0 / 2 en vez de las 6 fotos del Perfil.
  await ev("__imp('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.setState({ activeTripId: 'otro-id-de-la-nube' }); return true })")
  const ganado = [{ clave: 'a', logro: 'pedazo', escalon: primera.id + ':' + primera.sitios[0].sitio, destino: 'lanzarote', en: '2026-11-10T10:00:00Z' }]
  const resumenDemo = { ok: true, ganado, por_categoria: {}, pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: 0, texto: null, pendientes: [] }, texto_viaje: 'Un viaje', texto_viaje_tipo: 'wow' }
  await ev(`Promise.all([__imp('/src/components/logros/momentos/api.ts'), __imp('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; api.datosDePrueba.resumen = ${JSON.stringify(resumenDemo)}; ui.useMomentosUI.getState().abrirResumenViaje(); return true })`)
  await esperar("Boolean(document.querySelector('[data-coleccion-del-resumen]'))", 60, 300)
  await app.esp(2500)
  const rv = await ev(`(() => {
    const d = document.querySelector('[data-resumen-del-viaje]')
    const cifras = Array.from(d.querySelectorAll('[data-cifras-del-viaje] > span')).map((s) => s.innerText.split(String.fromCharCode(10)).join(' '))
    const por = d.querySelector('[data-resumen-portada]')
    return { cifras, portada: por ? por.style.background : '', colecciones: Array.from(d.querySelectorAll('[data-coleccion-del-resumen]')).map((c) => c.dataset.coleccionDelResumen) }
  })()`)
  debe(rv.cifras.some((c) => /^6 FOTOS$/.test(c)), 'fotos', `el resumen cuenta las mismas fotos que el Perfil, las 6 del viaje (${rv.cifras.join(' | ')})`)
  debe(/con_logro/.test(rv.portada) && !/casa_maleta|sin_sitio/.test(rv.portada), 'portada', `la portada es una foto hecha en el destino, la de un sitio con logro (no la de casa ni la sin ubicación) (${rv.portada.slice(0, 120)})`)
  await app.captura(`${CAPTURAS}/resumen_arriba.jpg`)
  // Sin ninguna foto dentro del destino: la del destino de nuestros datos (nunca la de casa).
  await ev(`window.__fotosDePrueba = { ${JSON.stringify(ruta.id)}: [${JSON.stringify(foto('casa', { url: '/fotos/roma/casa_maleta.jpg', lat: 40.4, lng: -3.7 }))}] }; __imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarResumenViaje(); setTimeout(() => ui.useMomentosUI.getState().abrirResumenViaje(), 200); return true })`)
  await esperar("Boolean(document.querySelector('[data-coleccion-del-resumen]'))", 60, 300)
  await app.esp(2500)
  const rv2 = await ev("document.querySelector('[data-resumen-portada]')?.style.background ?? ''")
  debe(!/casa_maleta/.test(rv2), 'portada', `con solo una foto de casa, la portada NO es la de casa (${rv2.slice(0, 100)})`)
  // Tocar una colección del resumen: su lista ✓/○ y el enlace.
  const idRes = rv.colecciones[0]
  await ev(`document.querySelector('[data-coleccion-del-resumen="${idRes}"] > button').scrollIntoView({ block: 'center' }); document.querySelector('[data-coleccion-del-resumen="${idRes}"] > button').click(); true`)
  await esperar(`Boolean(document.querySelector('[data-coleccion-del-resumen="${idRes}"] [data-lista-de-coleccion]'))`, 30, 200)
  await app.esp(1000)
  const lr = await ev(`(() => { const d = document.querySelector('[data-coleccion-del-resumen="${idRes}"] [data-lista-de-coleccion]'); return d ? { filas: d.querySelectorAll('[data-sitio-de-lista]').length, enlace: d.querySelector('[data-ver-la-coleccion]')?.innerText.trim() ?? null, marcas: Array.from(d.querySelectorAll('[data-marca-de-sitio]')).map((m) => m.dataset.marcaDeSitio) } : null })()`)
  debe(lr && lr.filas >= 2 && lr.enlace === 'Ver la colección' && lr.marcas.includes('visto') && lr.marcas.includes('pendiente'), 'resumen', `en el resumen, tocar la colección abre la lista ✓/○ con su enlace (${JSON.stringify(lr)})`)
  await app.captura(`${CAPTURAS}/resumen_lista.jpg`)

  /* 3c. [Estampar mi sello] → [Ver mi sello]: solo se estampa una vez. */
  await ev(`window.__demoMundo = { lanzarote: ${JSON.stringify(ruta.id)} }; __imp('/src/lib/logrosEnCache.ts').then((c) => c.olvidarCacheDeLogros()); localStorage.removeItem('jutrip.sellos_estampados'); true`)
  await ev(`__imp('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.setState({ activeTripId: ${JSON.stringify(ruta.id)} }); return true })`)
  await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarResumenViaje(); setTimeout(() => ui.useMomentosUI.getState().abrirResumenViaje(), 200); return true })")
  await esperar("Boolean(document.querySelector('[data-estampar-sello]'))", 60, 300)
  const b1 = await ev("document.querySelector('[data-estampar-sello]').innerText.trim()")
  debe(b1 === 'Estampar mi sello', 'sello', `antes de estampar, el botón dice «${b1}»`)
  await ev("document.querySelector('[data-estampar-sello]').click(); true")
  await esperar("Boolean(document.querySelector('[data-mundo]'))", 40, 300)
  await app.esp(3600)
  const est1 = await ev("({ pestampa: Boolean(Array.from(document.querySelectorAll('span')).find((s) => /te deja su sello$/.test(s.innerText.trim()))), repetir: Boolean(Array.from(document.querySelectorAll('button')).find((b) => /Repetir el golpe/.test(b.innerText))), marcado: (JSON.parse(localStorage.getItem('jutrip.sellos_estampados') ?? '[]')).length })")
  debe(est1.pestampa && est1.marcado === 1, 'sello', `la primera vez se estampa y se apunta (${JSON.stringify(est1)})`)
  await app.captura(`${CAPTURAS}/sello_estampando.jpg`)
  await quitarPantallas(ev)
  await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().abrirResumenViaje(); return true })")
  await esperar("Boolean(document.querySelector('[data-estampar-sello]'))", 60, 300)
  await app.esp(1500)
  const b2 = await ev("document.querySelector('[data-estampar-sello]').innerText.trim()")
  debe(b2 === 'Ver mi sello', 'sello', `con el sello ya estampado, el botón dice «${b2}»`)
  await ev("document.querySelector('[data-estampar-sello]').click(); true")
  await esperar("Boolean(document.querySelector('[data-mundo]'))", 40, 300)
  await app.esp(3600)
  const est2 = await ev("({ pestampa: Boolean(Array.from(document.querySelectorAll('span')).find((s) => /te deja su sello$/.test(s.innerText.trim()))), repetir: Boolean(Array.from(document.querySelectorAll('button')).find((b) => /Repetir el golpe/.test(b.innerText))), sello: Boolean(document.querySelector('svg[aria-label^=\"Sello de Lanzarote\"]')), marcado: (JSON.parse(localStorage.getItem('jutrip.sellos_estampados') ?? '[]')).length })")
  debe(!est2.pestampa && !est2.repetir && est2.sello && est2.marcado === 1, 'sello', `[Ver mi sello] abre el pasaporte en su página SIN estampar otra vez (${JSON.stringify(est2)})`)
  // La fecha del sello: el primer día del viaje.
  const fechaSello = await ev("document.querySelector('svg[aria-label^=\"Sello de Lanzarote\"]')?.getAttribute('aria-label') ?? null")
  debe(/08 NOV 2026/.test(fechaSello ?? ''), 'fecha', `el sello de Lanzarote lleva «08 NOV 2026» (${fechaSello})`)
  const forma = await ev("(() => { const s = document.querySelector('svg[aria-label^=\"Sello de Lanzarote\"]'); return { oval: Boolean(s?.querySelector('ellipse')), volcan: /M3 38H57/.test(s?.innerHTML ?? '') } })()")
  debe(forma.oval && forma.volcan, 'sello', 'el sello de Lanzarote es ovalado y lleva el volcán de Design')
  await app.captura(`${CAPTURAS}/sello_ver.jpg`)

  /* 3d. El mapa con isla: al acercarse a Lanzarote, el punto cae sobre tierra. */
  await abrirPantalla(ev, { t: 'pasaporte', pagina: 'España' })
  await esperar("Boolean(document.querySelector('[data-mapa-grande] svg path'))", 60, 300)
  await app.esp(5500)
  const isla = await ev(`(() => {
    const g = document.querySelector('[data-mapa-grande] [data-globo]'); if (!g) return null
    const monedas = Array.from(g.querySelectorAll('g[transform]')).filter((x) => x.querySelector('circle'))
    const res = monedas.map((m) => { const q = m.getBoundingClientRect(); const x = q.left + q.width / 2, y = q.top + q.height / 2; const pts = document.elementsFromPoint(x, y); return { x: Math.round(x), y: Math.round(y), sobreTierra: pts.some((e) => e.tagName === 'path' && g.contains(e) && e.getAttribute('fill') && e.getAttribute('fill') !== 'none') } })
    const c = g.getBoundingClientRect()
    return { centro: { x: Math.round(c.left + c.width / 2), y: Math.round(c.top + c.height / 2) }, monedas: res }
  })()`)
  const cerca = isla ? isla.monedas.filter((m) => Math.abs(m.x - isla.centro.x) < 25 && Math.abs(m.y - isla.centro.y) < 25) : []
  debe(cerca.length >= 1 && cerca.some((m) => m.sobreTierra), 'mapa', `al abrir España con el viaje a Lanzarote, el punto de Lanzarote está en el centro y SOBRE LA ISLA (${JSON.stringify(cerca)})`)
  await app.captura(`${CAPTURAS}/pasaporte_lanzarote.jpg`)

  /* 3e. Tres sellos por página: arriba a la izquierda, arriba a la derecha y abajo en el centro. */
  await abrirPantalla(ev, { t: 'pasaporte', pagina: 'Italia' })
  await esperar("Boolean(document.querySelector('[data-mapa-grande]'))", 60, 300)
  await app.esp(3500)
  const pos = await ev(`(() => {
    const sellos = Array.from(document.querySelectorAll('svg[aria-label^="Sello de"]')).filter((s) => !/por conseguir/.test(s.getAttribute('aria-label')))
    const pagina = sellos[0]?.closest('div[style*="muSwap"]')
    const pr = pagina?.getBoundingClientRect()
    return { n: sellos.length, centros: sellos.map((s) => { const q = s.getBoundingClientRect(); return { x: Math.round(q.left + q.width / 2 - pr.left), y: Math.round(q.top + q.height / 2 - pr.top) } }), ancho: Math.round(pr.width), alto: Math.round(pr.height) }
  })()`)
  const med = await ev(`(() => {
    const sellos = Array.from(document.querySelectorAll('svg[aria-label^="Sello de"]')).slice(0, 3)
    const pr = sellos[0].closest('div[style*="muSwap"]').getBoundingClientRect()
    return { ancho: pr.width, alto: window.innerHeight, sellos: sellos.map((x) => { const q = x.getBoundingClientRect(); return { w: Math.round(Number(x.getAttribute('width'))), dentro: q.left >= pr.left - 6 && q.right <= pr.right + 6, abajo: Math.round(q.bottom) } }) }
  })()`)
  debe(med.sellos.every((x) => Math.abs(x.w / med.ancho - 0.45) < 0.03 && x.dentro), 'sellos', `cada sello mide ~45 % del ancho de la página y no se sale por los bordes (${JSON.stringify(med)})`)
  debe(med.sellos[2].abajo <= med.alto, 'sellos', `el sello de abajo se ve entero sin bajar (termina en ${med.sellos[2].abajo} de ${med.alto})`)
  const [a, b, c] = pos.centros ?? []
  debe(pos.n === 3, 'sellos', `la página lleva 3 sellos (${pos.n})`)
  debe(a && b && c && a.x < pos.ancho / 2 && b.x > pos.ancho / 2 && a.y < c.y - 60 && b.y < c.y - 40 && Math.abs(c.x - pos.ancho / 2) < 25, 'sellos', `1.º arriba a la izquierda, 2.º arriba a la derecha y 3.º abajo en el centro (${JSON.stringify(pos.centros)} en ${pos.ancho}x${pos.alto})`)
  debe(await ev("Boolean(Array.from(document.querySelectorAll('span')).find((s) => /^1 \\/ [2-9]$/.test(s.innerText.trim())))"), 'sellos', 'cuando se llena la página, hay otra (el contador «1 / N» y las flechas)')
  const girados = await ev("Array.from(document.querySelectorAll('svg[aria-label^=\"Sello de\"]')).slice(0, 3).map((s) => s.parentElement.parentElement.style.transform)")
  debe(girados.every((t) => /rotate\(/.test(t) && !/rotate\(0deg\)/.test(t)), 'sellos', `cada sello un poco girado (${girados.join(' ')})`)
  const fechas = await ev("Array.from(document.querySelectorAll('svg[aria-label^=\"Sello de\"]')).map((s) => s.getAttribute('aria-label'))")
  debe(fechas.every((t) => !/ \\d \\w{3} \\d{4}$/.test(t) || /, \\d{2} /.test(t)), 'fecha', `los sellos ya estampados también con el día de dos cifras (${fechas.slice(0, 3).join(' / ')})`)
  await app.captura(`${CAPTURAS}/pasaporte_3_sellos.jpg`)
  await quitarPantallas(ev)

  /* 3f. El Perfil: la vitrina con los 3 logros grandes y la tarjeta del pasaporte (globo que se mueve, sellos de verdad). */
  await ev("window.__miPerfil.getState().poner({ nombre: 'ALICE' }); __imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
  await esperar("Boolean(document.querySelector('[data-vitrina-del-perfil]'))", 60, 300)
  await app.esp(1500)
  await ev("document.querySelector('[data-perfil-scroll]').scrollTop = 99999; true")
  await app.esp(900)
  const vit = await ev(`(() => {
    const d = document.querySelector('[data-vitrina-del-perfil]')
    const medir = ${medirDibujo}
    const huecos = Array.from(d.querySelectorAll('[data-hueco-de-vitrina="pieza"]'))
    return { n: huecos.length, w: Math.round(d.getBoundingClientRect().width), h: Math.round(d.getBoundingClientRect().height), piezas: huecos.map((h) => ({ visible: Math.round(h.querySelector('[data-pieza-de-vitrina-caja] svg')?.getBoundingClientRect().width ?? 0) })), celda: huecos.map((h) => Math.round(h.getBoundingClientRect().width)) }
  })()`)
  debe(vit.n === 3 && vit.piezas.every((p) => p.visible >= 84) && Math.max(...vit.piezas.map((p) => p.visible)) - Math.min(...vit.piezas.map((p) => p.visible)) <= 14, 'vitrina', `los 3 logros de la vitrina, grandes y casi iguales entre sí (visible ${vit.piezas.map((p) => p.visible).join(', ')} de celdas de ${vit.celda.join(', ')})`)
  await app.captura(`${CAPTURAS}/perfil_vitrina.jpg`)
  // La tarjeta del pasaporte.
  await ev("document.querySelector('[data-abrir-pasaporte]').scrollIntoView({ block: 'center' }); true")
  await app.esp(600)
  const tj = await ev(`(() => {
    const t = document.querySelector('[data-abrir-pasaporte]')
    const g = t.querySelector('[data-mapa-pasaporte] [data-globo]')
    const q = g.getBoundingClientRect()
    return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2), sellos: Array.from(t.querySelectorAll('[data-sello-asomando]')).map((s) => s.dataset.selloAsomando), etiquetas: Array.from(t.querySelectorAll('svg[aria-label^="Sello de"]')).map((s) => s.getAttribute('aria-label')), d0: g.querySelector('svg path[fill]:not([fill="none"])')?.getAttribute('d')?.slice(0, 80) ?? '' }
  })()`)
  debe(tj.sellos.length >= 1 && tj.sellos.every((s) => s === 'suyo'), 'tarjeta', `en la tarjeta solo salen sellos de verdad (${tj.sellos.join(', ')}: ${tj.etiquetas.join(' / ')})`)
  const sellosPuro = await ev(`__imp('/src/components/logros/pantallas/perfil/TarjetaPasaporte.tsx').then((m) => ({ ninguno: m.sellosDeLaEsquina([]).length, uno: m.sellosDeLaEsquina([{ ciudad: 'Lanzarote', fecha: '2026-11-08' }]).map((s) => s.ciudad + ':' + s.forma), tres: m.sellosDeLaEsquina([{ ciudad: 'A', fecha: '2026-11-08' }, { ciudad: 'B', fecha: '2026-11-07' }, { ciudad: 'C', fecha: '2026-11-06' }]).length }))`)
  debe(sellosPuro.ninguno === 0 && sellosPuro.uno.length === 1 && sellosPuro.uno[0] === 'Lanzarote:oval' && sellosPuro.tres === 2, 'tarjeta', `sin sellos, la página vacía; con uno, ese (el de Lanzarote, ovalado); como mucho 2 (${JSON.stringify(sellosPuro)})`)
  await ev("localStorage.removeItem('jutrip.globo_pasaporte'); true")
  // Arrastrar el globo: se mueve, NO abre el pasaporte y guarda su posición.
  const cdp = app.cdp
  const raton = (type, x, y, extra = {}) => cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...extra })
  await raton('mousePressed', tj.x, tj.y)
  for (let k = 1; k <= 8; k++) await raton('mouseMoved', tj.x + k * 9, tj.y + k * 2)
  await raton('mouseReleased', tj.x + 72, tj.y + 16)
  await app.esp(900)
  const trasArrastrar = await ev("({ abierto: Boolean(document.querySelector('[data-mundo]')), guardado: localStorage.getItem('jutrip.globo_pasaporte'), d0: document.querySelector('[data-abrir-pasaporte] [data-mapa-pasaporte] svg path[fill]:not([fill=\"none\"])')?.getAttribute('d')?.slice(0, 80) ?? '' })")
  debe(!trasArrastrar.abierto, 'tarjeta', 'arrastrar el globo NO abre el pasaporte')
  debe(trasArrastrar.d0 !== tj.d0 && trasArrastrar.d0 !== '', 'tarjeta', 'el globo gira con el dedo')
  const pos1 = trasArrastrar.guardado ? JSON.parse(trasArrastrar.guardado) : null
  debe(pos1 && Number.isFinite(pos1.lat) && Number.isFinite(pos1.lng), 'tarjeta', `se guarda la última posición (${trasArrastrar.guardado})`)
  // Al volver al Perfil, el globo sale como se dejó.
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar(); setTimeout(() => m.usePerfilUi.getState().abrir(), 400); return true })")
  await esperar("Boolean(document.querySelector('[data-abrir-pasaporte]'))", 60, 300)
  await app.esp(1500)
  await ev("document.querySelector('[data-perfil-scroll]').scrollTop = 99999; true")
  await app.esp(600)
  const alVolver = await ev("document.querySelector('[data-abrir-pasaporte] [data-mapa-pasaporte] svg path[fill]:not([fill=\"none\"])')?.getAttribute('d')?.slice(0, 80) ?? ''")
  debe(alVolver === trasArrastrar.d0, 'tarjeta', 'al volver al Perfil, el globo sale tal como se dejó')
  await app.captura(`${CAPTURAS}/perfil_tarjeta.jpg`)
  // Tocar la tarjeta (sin arrastrar) abre el pasaporte.
  const t2 = await ev("(() => { const q = document.querySelector('[data-abrir-pasaporte] [data-mapa-pasaporte]').getBoundingClientRect(); return { x: Math.round(q.left + q.width / 2), y: Math.round(q.top + q.height / 2) } })()")
  await raton('mousePressed', t2.x, t2.y)
  await raton('mouseReleased', t2.x, t2.y)
  const abre = await esperar("Boolean(document.querySelector('[data-mundo]'))", 20, 250)
  debe(abre, 'tarjeta', 'tocar la tarjeta (sin arrastrar) abre el pasaporte')
  await quitarPantallas(ev)
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar(); return true })")

  /* 3g. «Mi vitrina» (la de dentro): lo mismo que los sellos de ciudad y con aire arriba. */
  await ev("window.__demoGanados.poner('lleno'); true")
  await abrirPantalla(ev, { t: 'todos', pestana: 'vitrina' })
  await esperar("Boolean(document.querySelector('[data-vitrina] [data-balda]'))", 60, 300)
  await app.esp(2500)
  const bv = await ev(`(() => {
    const porBalda = {}
    document.querySelectorAll('[data-vitrina] [data-balda]').forEach((b) => { porBalda[b.dataset.balda] = Array.from(b.querySelectorAll('button[aria-label]')).map((x) => Math.round(x.querySelector('svg')?.getBoundingClientRect().width ?? 0)) })
    const huecos = Array.from(document.querySelectorAll('[data-hueco-vacio-de-balda]')).map((h) => Math.round(h.getBoundingClientRect().width))
    const cab = document.querySelector('[data-cabecera-de-logros]'); const cr = cab.getBoundingClientRect(); const flecha = cab.querySelector('button').getBoundingClientRect(); const tabs = cab.querySelector('[role=tablist]').getBoundingClientRect()
    const prim = document.querySelector('[data-vitrina]').getBoundingClientRect()
    const cs = getComputedStyle(cab)
    return { porBalda, huecos, aire: { izq: Math.round(flecha.left - cr.left), der: Math.round(cr.right - tabs.right), abajo: parseFloat(cs.paddingBottom), arriba: parseFloat(cs.paddingTop), hasta: Math.round(prim.top - cr.bottom) } }
  })()`)
  const tamCodigo = await ev("__imp('/src/components/logros/pantallas/todos/Vitrina.tsx').then((m) => ({ ...m.TAM_POR_BALDA, vacio: m.HUECO_VACIO }))")
  console.log('   vitrina por balda:', JSON.stringify(bv.porBalda), JSON.stringify(tamCodigo))
  debe(/tam=\{TAM_POR_BALDA\[balda\]\}/.test(leer('src/components/logros/pantallas/todos/Vitrina.tsx')) && Object.values(bv.porBalda).every((v) => v.length > 0), 'vitrina', `cada balda dibuja sus piezas con el tamaño que compensa el aire de su dibujo (${JSON.stringify(tamCodigo)})`)
  debe(bv.huecos.length >= 2 && bv.huecos.every((w) => w === tamCodigo.vacio) && tamCodigo.vacio >= 66, 'vitrina', `los huecos vacíos miden lo mismo que un sello de ciudad (${bv.huecos.join(', ')})`)
  debe(tamCodigo.viajero > tamCodigo.sellos && tamCodigo.emblemas > tamCodigo.viajero && tamCodigo.colecciones > tamCodigo.sellos, 'vitrina', 'logros de viajero, emblemas y colecciones salen más grandes que antes para llenar su hueco como los sellos de ciudad')
  debe(bv.aire.izq >= 14 && bv.aire.der >= 14 && bv.aire.abajo >= 20 && bv.aire.arriba >= 12, 'aire', `la cabecera de «Mi vitrina» con margen: ${JSON.stringify(bv.aire)}`)
  await app.captura(`${CAPTURAS}/mi_vitrina.jpg`)
  await ev("document.querySelector('[role=tab]:nth-child(2)').click(); true")
  await app.esp(1200)
  const aireT = await ev("(() => { const cab = document.querySelector('[data-cabecera-de-logros]'); const cs = getComputedStyle(cab); return { abajo: parseFloat(cs.paddingBottom), lados: parseFloat(cs.paddingLeft) } })()")
  debe(aireT.abajo >= 20 && aireT.lados >= 14, 'aire', `y en «Todos mis logros» igual (${JSON.stringify(aireT)})`)
  await app.captura(`${CAPTURAS}/todos_mis_logros.jpg`)

  /* 3h. «Todos mis logros» → un destino: tocar una colección abre su lista con [Ver la colección ›]. */
  await abrirPantalla(ev, { t: 'destino', destino: 'roma' })
  await esperar("Boolean(document.querySelector('[data-foto-de-destino]'))", 60, 300)
  await app.esp(1500)
  const botonColeccion = await ev("(() => { const b = Array.from(document.querySelectorAll('main button')).find((x) => /Los imprescindibles|imprescindibles/i.test(x.innerText)); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()")
  await esperar("Boolean(document.querySelector('[data-coleccion-abierta] [data-ver-la-coleccion]'))", 40, 250)
  const dest = await ev("({ lista: Boolean(document.querySelector('[data-coleccion-abierta] [data-lista-de-coleccion]')), enlace: document.querySelector('[data-coleccion-abierta] [data-ver-la-coleccion]')?.innerText.trim() ?? null, pantalla: document.querySelectorAll('[data-sitio-de-lista]').length })")
  debe(botonColeccion && dest.lista && dest.enlace === 'Ver la colección' && dest.pantalla > 0, 'todos', `en la página de un destino de «Todos mis logros», tocar una colección abre la lista con su enlace (${JSON.stringify(dest)})`)
  await app.captura(`${CAPTURAS}/destino_lista.jpg`)
  await quitarPantallas(ev)
} finally {
  await app.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
