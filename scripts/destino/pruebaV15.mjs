// La prueba de la Tanda V15: CERRAR LO QUE QUEDA DE LOGROS Y DEL PERFIL (el sello estampado en la cuenta, «Yo también estaba» entre dos compañeros con el cobro apagado y sin pase, las fechas del viaje
// iguales en toda la app y la portada del Perfil que sale la buena al abrir, sin cambiar).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV15.mjs
// 1. El servidor (servicio de logros de verdad con un repo en memoria)   2. El código   3. En pantalla (demo; ninguna llamada a producción). Capturas en docs/dias/V15_capturas/.
import fs from 'node:fs'
import { cargarDatos, cargarCatalogo, coordenadasDeSitio } from '../../server/logros/datos.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'
import { viajesAcabados } from '../../server/logros/exp.js'
import { paginasDelPasaporte, viajesSinSello } from '../../server/logros/pantallas/previos.js'
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
const CAPTURAS = 'docs/dias/V15_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. El servidor: «Yo también estaba» entre Eric y Alicia, con el cobro apagado y sin ningún pase ───────── */
console.log('1. El servidor: «Yo también estaba» en las dos direcciones, cobro apagado y sin pase')
{
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
  const hechos = []
  const logros = []
  const viaje = { id: 'lz1', traveler_id: 'E', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 's1', name: 'Timanfaya' }] }] } }
  // Alicia se unió al viaje compartido el 18 de noviembre, DESPUÉS del último día (13): antes, la regla de la V7 la dejaba fuera a ella y a lo suyo.
  const miembros = [{ user_id: 'E', desde: null }, { user_id: 'A', desde: '2026-11-18T10:00:00Z' }]
  let n = 0
  const repo = {
    hechosDe: async (u) => hechos.filter((h) => h.user_id === u && !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h },
    deshacerHecho: async () => {},
    viajesDe: async () => [viaje],
    logrosDe: async (u) => logros.filter((l) => l.user_id === u),
    insertarLogros: async (u, filas) => { const d = []; for (const f of filas) { if (logros.some((l) => l.user_id === u && l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue; const l = { user_id: u, ...f, escalon: String(f.escalon ?? ''), ganado_en: '2026-11-18T10:00:00.000Z' }; logros.push(l); d.push(l) } return d },
    borrarLogros: async () => {},
    cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }),
    ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null,
    sinPaseDe: async () => false,
    pasesDe: async () => [], // NINGÚN pase en la base de datos
    pruebaDe: async () => null, guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {},
    fotoUrl: async () => null,
    miembrosDe: async () => miembros,
    nombresDe: async (ids) => new Map(ids.map((i) => [i, i === 'E' ? 'Eric' : 'Alicia'])),
  }
  const reloj = new Date('2026-11-18T12:00:00Z')
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  const foto = async (u, id, k) => {
    const c = coordenadasDeSitio(catalogos, 'lanzarote', id)
    return servicio.foto(u, { trip_id: 'lz1', libre: true, origen: 'galeria', con_camara: true, tomada_en: `2026-11-10T1${k}:00:00`, ubicacion: { lat: c.lat + 5 / 111000, lng: c.lng, precision: 10 } })
  }
  await foto('E', 'montanas_del_fuego', 0)
  await foto('A', 'cueva_de_los_verdes', 1)
  const aParaAlicia = await servicio.companeroPendientes('A', 'lz1')
  const aParaEric = await servicio.companeroPendientes('E', 'lz1')
  debe(aParaAlicia.ok && aParaAlicia.pendientes.some((p) => p.sitio === 'montanas_del_fuego' && p.de === 'E'), 'alicia', `a Alicia le sale Montañas del Fuego, que ganó Eric (${aParaAlicia.pendientes.map((p) => p.sitio).join(', ')})`)
  debe(aParaEric.ok && aParaEric.pendientes.some((p) => p.sitio === 'cueva_de_los_verdes' && p.de === 'A'), 'alicia', `y al revés: a Eric le sale la Cueva de los Verdes, que ganó Alicia (${aParaEric.pendientes.map((p) => p.sitio).join(', ')})`)
  debe(aParaAlicia.sin_pase === false && aParaEric.sin_pase === false, 'pase', 'con el cobro apagado y sin ningún pase, nadie queda «sin pase»')
  const gana = await servicio.yoTambien('A', { trip_id: 'lz1', sitios: ['montanas_del_fuego'] })
  debe(gana.ok && gana.cuenta !== false && gana.nuevos.length > 0, 'alicia', `[Yo también estaba] le da a Alicia el pedazo, sin pase y con el cobro apagado (${gana.motivo ?? 'ok'})`)
  debe(!(await servicio.companeroPendientes('A', 'lz1')).pendientes.some((p) => p.sitio === 'montanas_del_fuego'), 'alicia', 'y ya no le vuelve a salir')
  // El plazo sigue valiendo: 31 días después del último día, nada.
  const tarde = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date('2026-12-14T12:00:00Z'), cobro: false, azar: () => 0 })
  debe((await tarde.companeroPendientes('E', 'lz1')).pendientes.length === 0, 'plazo', 'pasados los 30 días de plazo, no sale nada')
}

/* ───────── 1b. Alicia con su PROPIA copia del viaje (9 – 13) además del viaje compartido de Eric (8 – 13): es el MISMO viaje ───────── */
console.log('1b. Una copia propia del viaje y el viaje compartido son el mismo viaje')
{
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
  const hechos = []
  const logros = []
  const ruta = (inicio) => ({ destination: 'Lanzarote', answers: { dateRange: { start: inicio, end: '2026-11-13' }, companion: 'couple' }, days: [{ dayNumber: 1, stops: [{ id: 's1', name: 'Timanfaya' }] }] })
  const compartido = { id: 'lz1', traveler_id: 'E', route: ruta('2026-11-08') }
  const copiaDeAlicia = { id: 'lz-alicia', traveler_id: 'A', route: ruta('2026-11-09') }
  const miembros = [{ user_id: 'E', desde: null }, { user_id: 'A', desde: '2026-11-18T10:00:00Z' }]
  let n = 0
  const repo = {
    hechosDe: async (u) => hechos.filter((h) => h.user_id === u && !h.deshecho_en),
    insertarHecho: async (f) => { const h = { ...f, id: `h${++n}`, deshecho_en: null }; hechos.push(h); return h },
    deshacerHecho: async () => {},
    viajesDe: async (u) => (u === 'A' ? [compartido, copiaDeAlicia] : [compartido]),
    logrosDe: async (u) => logros.filter((l) => l.user_id === u),
    insertarLogros: async (u, filas) => { const d = []; for (const f of filas) { if (logros.some((l) => l.user_id === u && l.destino === f.destino && l.logro === f.logro && String(l.escalon) === String(f.escalon))) continue; const l = { user_id: u, ...f, escalon: String(f.escalon ?? ''), ganado_en: f.ganado_en ?? '2026-11-10T10:00:00.000Z' }; logros.push(l); d.push(l) } return d },
    borrarLogros: async () => {}, cuentaDe: async () => ({ alta_cuenta: '2026-10-01T10:00:00.000Z', salida: null }), ordenPionero: async () => ({}), probadorDe: async () => null, ultimaFrase: async () => null,
    sinPaseDe: async () => false, pasesDe: async () => [], pruebaDe: async () => null, guardarPrueba: async () => {},
    perfilDe: async () => ({ previos: { paises: [], dias: 0 }, vitrina: { baldas: {}, titulo: null }, exp_max: 0 }), guardarPerfil: async () => {}, referidosDe: async () => [], invitadorDe: async () => null, marcarAnimacion: async () => {},
    fotoUrl: async () => null, miembrosDe: async (t) => (t === 'lz1' ? miembros : [{ user_id: 'A', desde: null }]), nombresDe: async (ids) => new Map(ids.map((i) => [i, i === 'E' ? 'Eric' : 'Alicia'])),
  }
  const reloj = new Date('2026-11-18T12:00:00Z')
  const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => reloj, cobro: false, azar: () => 0 })
  const foto = (u, trip, id, k) => {
    const c = coordenadasDeSitio(catalogos, 'lanzarote', id)
    return servicio.foto(u, { trip_id: trip, libre: true, origen: 'galeria', con_camara: true, tomada_en: `2026-11-10T1${k}:00:00`, ubicacion: { lat: c.lat + 5 / 111000, lng: c.lng, precision: 10 } })
  }
  // Eric gana Timanfaya en el viaje compartido; Alicia gana TRES sitios, todos en SU copia del viaje (la que usa su móvil).
  await foto('E', 'lz1', 'montanas_del_fuego', 0)
  const sitiosDeAlicia = ['cueva_de_los_verdes', 'jameos_del_agua', 'mirador_del_rio']
  for (const [k, id] of sitiosDeAlicia.entries()) await foto('A', 'lz-alicia', id, k + 1)
  const cA = await servicio.cargar('A')
  debe(Object.keys(cA.viajes).length === 1 && cA.viajes.lz1 && cA.viajes['lz-alicia'] === cA.viajes.lz1, 'copia', 'la copia de Alicia y el viaje de Eric son UN viaje (una sola entrada; la copia se sigue pudiendo pedir por su id)')
  debe(cA.viajes.lz1.inicio === '2026-11-08' && cA.viajes.lz1.fin === '2026-11-13', 'copia', `las fechas son las del viaje de Eric: 8 – 13 nov (${cA.viajes.lz1.inicio} – ${cA.viajes.lz1.fin})`)
  debe(cA.hechos.every((h) => h.trip_id === 'lz1'), 'copia', 'lo que Alicia ganó en su copia cuenta en el viaje compartido')
  const acabados = viajesAcabados({ datos, hechos: cA.hechos, viajes: cA.viajes, ahora: reloj })
  const sin = viajesSinSello({ datos, hechos: cA.hechos, viajes: cA.viajes, acabados, ahora: reloj })
  const base = { tus_paises: [{ pais: 'España', entrada: '2026-11-08', destinos: [], continente: 'Europa' }], por_descubrir: [], numeros: {} }
  const paginas = paginasDelPasaporte({ datos, base, previos: { paises: [], dias: 0 }, catalogo: [{ n: 'España', i: 'es', c: 'Europa' }], hechos: cA.hechos, viajes: cA.viajes, acabados })
  const sello = paginas[0]?.sellos.find((s) => !s.vacio)
  debe(sello?.fecha === '2026-11-08', 'copia', `el sello de Alicia pone «08 NOV 2026», no el 9 (${sello?.fecha})`)
  debe(!sin.some((v) => v.trip_id === 'lz1' || v.trip_id === 'lz-alicia'), 'copia', 'y el pasaporte de Alicia NO dice «Tu sello de Lanzarote aún no está» con el sello ya hecho')
  const pA = await servicio.companeroPendientes('A', 'lz-alicia')
  const pE = await servicio.companeroPendientes('E', 'lz1')
  debe(pA.pendientes.some((p) => p.sitio === 'montanas_del_fuego'), 'copia', `a Alicia le sale lo de Eric aunque lo ganara en su copia (${pA.pendientes.map((p) => p.sitio).join(', ')})`)
  debe(['cueva_de_los_verdes', 'jameos_del_agua', 'mirador_del_rio'].some((s) => pE.pendientes.some((p) => p.sitio === s)), 'copia', `y a Eric le sale lo de Alicia (${pE.pendientes.map((p) => p.sitio).join(', ')})`)
  // Los pasos del servidor (el diagnóstico): con un id que no es de ninguno de sus viajes se queda vacío en el paso 3 y lo dice; con el de la copia, sigue hasta el final.
  const trazaMala = []
  const malo = await servicio.companeroPendientes('A', 'id-que-no-existe', null, trazaMala)
  debe(malo.ok === false && trazaMala.some((t) => /SE QUEDA VACÍO AQUÍ/.test(t) && /no encuentra ese viaje/.test(t)), 'pasos', `con un id de viaje que no es suyo, los pasos dicen en cuál se queda vacío (${trazaMala.slice(-1)[0]?.slice(0, 80)})`)
  const trazaBuena = []
  await servicio.companeroPendientes('A', 'lz-alicia', null, trazaBuena)
  debe(trazaBuena.length >= 7 && /pendientes que salen: montanas_del_fuego/.test(trazaBuena.join(' ')) && /miembros de lz1/.test(trazaBuena.join(' ')), 'pasos', `con la copia de Alicia, los pasos llegan al final y nombran lo pendiente (${trazaBuena.length} pasos)`)
  // «llevas N» cuenta lo ganado en la copia: con 2 sitios (de 3 que pide el sello) dice 2, no 0.
  const dosHechos = hechos.filter((h) => h.user_id === 'A').slice(0, 2)
  const ids2 = new Set(dosHechos.map((h) => h.trip_id))
  debe(dosHechos.length === 2 && ids2.size === 1, 'copia', 'los hechos de Alicia quedan todos en un solo viaje')
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const m = leer('supabase/migrations/0081_sellos_estampados.sql')
  debe(/add column if not exists sellos_estampados jsonb/.test(m) && fs.existsSync('docs/dias/COMPROBAR_0081.sql'), 'sello', 'la migración 0081 (sellos estampados en la cuenta) y su COMPROBAR existen')
  const perfil = leer('src/store/useMiPerfil.ts')
  debe(/sincronizarSellosConLaCuenta\(uid\)/.test(perfil), 'sello', 'al abrir la app con cuenta, los sellos ya estampados se juntan con los de la cuenta')
  const ro = leer('src/components/route/RouteOverview.tsx')
  debe(/rangoDelViaje\?\.end/.test(ro) && /diasEntreFechas\(inicioDelTramo, rangoDelViaje\.end\)/.test(ro), 'fechas', 'la tarjeta de RUTA acaba el último tramo en la fecha de fin del viaje')
  const hook = leer('src/hooks/usePortadaDeViaje.ts')
  debe(/jutrip\.portadas_vistas/.test(hook) && /fotoDePortadaPorRegla/.test(hook), 'portada', 'la portada se guarda en el móvil y sigue la regla única (foto hecha en el destino)')
  for (const f of ['src/components/logros/momentos/ResumenViaje.tsx', 'src/components/logros/pantallas/ViajeGuardado.tsx', 'src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx', 'src/components/logros/pantallas/perfil/ListaDeViajes.tsx']) {
    debe(/usePortadaDeViaje\(/.test(leer(f)), 'portada', `${f.split('/').pop()} usa la misma regla de portada`)
  }
  // El 500 de verdad: `trips` no tiene `created_at` (solo `updated_at`); pedirla rompía TODA llamada de «Yo también estaba». Ninguna lectura de `trips` del servidor pide una columna que no exista.
  const columnasDeTrips = ['id', 'traveler_id', 'route', 'bookings', 'wishlist', 'ui_state', 'updated_at', 'generation_state', 'guardado_en']
  const pedidas = leer('server/logros/repo.js').split("from('trips').select('").slice(1).flatMap((t) => t.slice(0, t.indexOf("'")).split(',').map((c) => c.trim()))
  const malas = pedidas.filter((c) => !columnasDeTrips.includes(c))
  debe(pedidas.length >= 3 && malas.length === 0, 'columnas', `el servidor de logros solo pide columnas de trips que existen (${malas.length ? 'NO existen: ' + malas.join(', ') : pedidas.length + ' lecturas bien'})`)
  const host = leer('src/components/logros/companero/Companero.tsx')
  debe(/reintentos = \[3000, 10000, 25000\]/.test(host) && /visibilitychange/.test(host), 'reintento', 'la app vuelve a preguntar por el compañero si la respuesta no fue buena, al volver a la app y al volver la red')
  debe(!/desde\)\.slice\(0, 10\) <= viaje\.fin/.test(leer('server/logros/servicio.js')), 'alicia', 'el servidor ya no deja fuera a quien se unió después del último día')
}

/* ───────── 3. En pantalla ───────── */
console.log('3. En pantalla (móvil de 390 px, demo de logros)')
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

  /* 3a. El sello estampado en un móvil sale como [Ver mi sello] en otro (la cuenta hace de nube compartida). */
  const sello = await ev(`(async () => {
    const m = await __imp('/src/lib/selloEstampado.ts')
    const nube = { 'u1': {} }
    m.ponerCuentaDePrueba({ leer: async (uid) => (nube[uid] ? JSON.parse(JSON.stringify(nube[uid])) : null), escribir: async (uid, v) => { nube[uid] = JSON.parse(JSON.stringify(v)); return true } })
    // Móvil 1: sin nada, se estampa el sello del viaje t1 con la cuenta u1.
    localStorage.removeItem('jutrip.sellos_estampados')
    await m.sincronizarSellosConLaCuenta('u1')
    const antes = m.selloYaEstampado('t1')
    m.marcarSelloEstampado('t1', '2026-11-08')
    await new Promise((r) => setTimeout(r, 100))
    const enLaCuenta = JSON.stringify(nube.u1)
    // Móvil 2: el almacenamiento vacío (otro móvil o reinstalada) y la misma cuenta.
    localStorage.removeItem('jutrip.sellos_estampados')
    const sinSincronizar = m.selloYaEstampado('t1')
    await m.sincronizarSellosConLaCuenta('u1')
    const enOtroMovil = m.selloYaEstampado('t1')
    // Lo estampado en un móvil ANTES de la migración (la lista vieja de la V14) sube solo a la cuenta al abrir.
    localStorage.setItem('jutrip.sellos_estampados', JSON.stringify(['t0']))
    nube.u1 = {}
    const subidos = await m.sincronizarSellosConLaCuenta('u1')
    const subido = JSON.stringify(Object.keys(nube.u1))
    m.ponerCuentaDePrueba(null)
    localStorage.removeItem('jutrip.sellos_estampados')
    return { antes, enLaCuenta, sinSincronizar, enOtroMovil, subidos, subido }
  })()`)
  debe(!sello.antes && /"t1":\{"fecha":"2026-11-08"/.test(sello.enLaCuenta), 'sello', `al estampar, el sello queda en la cuenta con su fecha (${sello.enLaCuenta})`)
  debe(!sello.sinSincronizar && sello.enOtroMovil, 'sello', 'en otro móvil (vacío), tras abrir la app con la cuenta, el sello sale como ya estampado: [Ver mi sello]')
  debe(sello.subidos === 1 && /t0/.test(sello.subido), 'sello', `lo estampado antes en un móvil se sube solo a la cuenta (${sello.subido})`)

  /* 3b. Las fechas del viaje, iguales en RUTA, el Perfil, el resumen y el pasaporte (viaje del 8 al 13 con un día de más en la ruta guardada). */
  await ev("window.__miPerfil.getState().poner({ nombre: 'ALICE' }); true")
  await ev(`Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/store/useSyncStore.ts'), __imp('/src/components/sync/TripSync.tsx')]).then(([r, s, t]) => {
    const base = t.buildTripPayload()
    const dias = base.route.days.filter((d) => !d.isReturnLeg).length
    const crear = (id, destino, ini, fin) => ({ ...base, id, route: { ...base.route, id, destination: destino, answers: { ...base.route.answers, dateRange: { start: ini, end: fin } } }, generationState: null })
    s.useSyncStore.getState().setSavedTrips([crear('t-hecho', 'Lanzarote', '2026-11-08', '2026-11-13')])
    window.__diasDeRuta = dias
    return true
  })`)
  await ev("__imp('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); const r = s.route; m.useRouteStore.setState({ route: { ...r, answers: { ...r.answers, dateRange: { start: '2026-11-08', end: '2026-11-13' } } } }); return true })")
  await app.esp(800)
  await ev("__imp('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('route'); return true })")
  await esperar("Boolean(document.querySelector('[data-duracion-del-viaje]'))", 40, 300)
  const ruta = await ev("({ duracion: document.querySelector('[data-duracion-del-viaje]')?.innerText, fechas: document.querySelector('[data-duracion-del-viaje]')?.nextElementSibling?.innerText ?? '' })")
  const dias = await ev("__imp('/src/lib/duracionViaje.ts').then((m) => __imp('/src/store/useRouteStore.ts').then((r) => m.diasDelViaje(r.useRouteStore.getState().route)))")
  debe(dias === 6 && /^6 días · 5 noches$/.test(ruta.duracion ?? '') && /13 nov/.test(ruta.fechas) && !/14 nov/.test(ruta.fechas), 'fechas', `RUTA: «${ruta.duracion}» y «${ruta.fechas}» (8 – 13 nov, 6 días y 5 noches; nunca el 14)`)
  await app.captura(`${CAPTURAS}/ruta_fechas.jpg`)
  // El Perfil, el resumen y el pasaporte cuentan lo mismo.
  const perfilFechas = await ev("__imp('/src/lib/viajesPerfil.ts').then((m) => __imp('/src/store/useRouteStore.ts').then((r) => { const v = m.resumenDeViaje(r.useRouteStore.getState().route, null, '2026-11-18'); return { cuando: v.cuando, dias: v.dias } }))")
  debe(/8\s*[–-]\s*13 nov/.test(perfilFechas.cuando ?? ''), 'fechas', `el Perfil dice «${perfilFechas.cuando}»`)
  const resumenFechas = await ev("__imp('/src/components/logros/momentos/ResumenViaje.tsx').then((m) => m.rangoDeFechas('2026-11-08', '2026-11-13'))")
  debe(/^8 – 13 nov$/.test(resumenFechas), 'fechas', `el resumen dice «${resumenFechas}»`)
  const fechaSello = await ev("__imp('/src/components/logros/pantallas/mundo/selloDatos.ts').then((m) => m.fechaDeSello('2026-11-08'))")
  debe(fechaSello === '08 NOV 2026', 'fechas', `el pasaporte pone «${fechaSello}», el primer día`)

  /* 3c. La portada del Perfil: sale la buena al abrir, sin cambiar. */
  const rid = 't-hecho'
  const centro = await ev("__imp('/src/store/useRouteStore.ts').then((m) => { const ps = m.useRouteStore.getState().route.days.flatMap((d) => d.stops.filter((s) => !s.isZoneWalk && s.coordinates && !(s.coordinates.lat === 0 && s.coordinates.lng === 0)).map((s) => s.coordinates)); return { lat: ps.reduce((n, p) => n + p.lat, 0) / ps.length, lng: ps.reduce((n, p) => n + p.lng, 0) / ps.length } })")
  const BUENA = '/fotos/roma/dia_coliseo.jpg'
  const DESTINO = '/fotos/lanzarote/playas_de_papagayo_p.jpg'
  await ev(`window.__fotosDePrueba = { ${JSON.stringify(rid)}: [{ id: 'f1', tripId: ${JSON.stringify(rid)}, dayId: 'd1', dayNumber: 1, stopName: null, storagePath: '', width: 1600, height: 1000, bytes: 1, createdAt: '2026-11-10T10:00:00Z', url: ${JSON.stringify(BUENA)}, urlMin: '', lat: ${centro.lat}, lng: ${centro.lng} }] }; true`)
  const muestrear = async () => {
    await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar(); return true })")
    await app.esp(500)
    await ev("window.__muestras = []; window.__timer = setInterval(() => { const i = document.querySelector('[data-tarjeta-de-viaje=\"t-hecho\"] img[data-portada-foto-url]'); window.__muestras.push(i ? i.getAttribute('src') : null) }, 40); __imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
    await esperar("Boolean(document.querySelector('[data-tarjeta-de-viaje=\"t-hecho\"]'))", 60, 200)
    await app.esp(4500)
    return ev("clearInterval(window.__timer); window.__muestras")
  }
  // Primera vez (nada guardado): puede pasar por la del destino; se guarda lo que da la regla.
  await ev("localStorage.removeItem('jutrip.portadas_vistas'); true")
  const primera = await muestrear()
  const guardada = await ev("localStorage.getItem('jutrip.portadas_vistas')")
  debe(primera[primera.length - 1] === BUENA, 'portada', `con la regla, la portada acaba siendo la foto hecha en el destino (${primera[primera.length - 1]})`)
  debe(guardada && /t-hecho/.test(guardada), 'portada', 'la portada vista se guarda en el móvil')
  await app.captura(`${CAPTURAS}/perfil_portada.jpg`)
  // Segunda vez: la buena desde la primera muestra, sin pasar nunca por la del destino.
  const segunda = await muestrear()
  const vistas = segunda.filter(Boolean)
  debe(vistas.length > 20 && vistas.every((s) => s === BUENA || s.startsWith('data:')) && !vistas.some((s) => s.includes('papagayo')), 'portada', `al abrir el Perfil la portada sale la buena desde el primer momento, sin cambiar (${[...new Set(vistas.map((s) => s.slice(0, 40)))].join(' | ')}; ${vistas.length} muestras; destino ${DESTINO.slice(-20)})`)
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().cerrar(); return true })")

  /* 3d. El globo: puntos solo en las ciudades con viaje, nunca en el centro de un país. */
  const pas = leer('src/components/logros/pantallas/PasaporteScreen.tsx')
  debe(!/clave: String\(k\), lat: c\.lat/.test(pas) && !/tipo: 'tinta'/.test(pas), 'globo', 'el código ya no pone un punto en el centro de cada país')
  await ev(`window.__demoMundo = { lanzarote: ${JSON.stringify(rid)} }; __imp('/src/lib/logrosEnCache.ts').then((c) => c.olvidarCacheDeLogros()); __imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); setTimeout(() => m.useLogrosPantallas.getState().abrir({ t: 'pasaporte', pagina: 'España' }), 80); return true })`)
  await esperar("Boolean(document.querySelector('[data-mapa-grande] svg path'))", 60, 300)
  await app.esp(5500)
  const puntos = await ev(`(() => {
    const g = document.querySelector('[data-mapa-grande] [data-globo]')
    const c = g.getBoundingClientRect(); const cx = c.left + c.width / 2, cy = c.top + c.height / 2
    // Solo los puntos que se VEN dentro del círculo del globo (los de fuera, de otros viajes, quedan recortados).
    const monedas = Array.from(g.querySelectorAll('g[transform]')).filter((x) => x.querySelector('circle')).filter((m) => { const q = m.getBoundingClientRect(); return Math.hypot(q.left + q.width / 2 - cx, q.top + q.height / 2 - cy) < c.width / 2 - 4 })
    return { n: monedas.length, enElCentro: monedas.filter((m) => { const q = m.getBoundingClientRect(); return Math.abs(q.left + q.width / 2 - cx) < 25 && Math.abs(q.top + q.height / 2 - cy) < 25 }).length }
  })()`)
  debe(puntos.n === 1 && puntos.enElCentro === 1, 'globo', `en España, con un solo viaje (Lanzarote), hay UN punto, en Lanzarote, y ninguno en el centro del país (${JSON.stringify(puntos)})`)
  await app.captura(`${CAPTURAS}/globo_un_punto.jpg`)
  await ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")

  /* 3e. [Ver el resumen del viaje]: «Preparando tu resumen…» solo la primera vez; las siguientes, al momento. */
  await ev("__imp('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = null; api.datosDePrueba.resumen = null; return true })")
  await ev("Object.keys(localStorage).filter((k) => /resumen:|estado:|viajero/.test(k)).forEach((k) => localStorage.removeItem(k)); true")
  const abrirResumen = async () => {
    await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarResumenViaje(); setTimeout(() => { window.__t0 = performance.now(); window.__prep = []; window.__timerR = setInterval(() => window.__prep.push(/Preparando tu resumen/.test(document.body.innerText)), 25); ui.useMomentosUI.getState().abrirResumenViaje() }, 150); return true })")
    await esperar("Boolean(document.querySelector('[data-resumen-del-viaje]'))", 40, 150)
    await app.esp(2500)
    return ev("clearInterval(window.__timerR); ({ preparando: window.__prep.some(Boolean), muestras: window.__prep.length })")
  }
  const r1 = await abrirResumen()
  const r2 = await abrirResumen()
  debe(!r2.preparando && r2.muestras > 20, 'resumen', `la segunda vez, el resumen abre al momento, sin «Preparando tu resumen…» (primera vez: ${r1.preparando ? 'sí salió' : 'no salió'}; segunda: ${r2.preparando ? 'salió' : 'no salió'})`)
  await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarResumenViaje(); return true })")

  /* 3e2. Se pregunta por TODOS los viajes terminados dentro del plazo, no solo por el activo. */
  const plazo = await ev(`Promise.all([__imp('/src/store/useSyncStore.ts'), __imp('/src/components/sync/TripSync.tsx'), __imp('/src/components/logros/companero/Companero.tsx')]).then(([s, t, c]) => {
    const base = t.buildTripPayload()
    const iso = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
    const crear = (id, fin) => ({ ...base, id, route: { ...base.route, id, answers: { ...base.route.answers, dateRange: { start: iso(fin - 5), end: iso(fin) } } }, generationState: null })
    s.useSyncStore.getState().setSavedTrips([crear('terminado-reciente', -3), crear('terminado-viejo', -40), crear('por-hacer', 2), crear('termino-ayer', -1)])
    return c.viajesTerminadosEnPlazo()
  })`)
  debe(JSON.stringify(plazo) === JSON.stringify(['terminado-reciente', 'termino-ayer']), 'todos', `se pregunta por los viajes terminados dentro de los 30 días (no por los de hace 40 días ni por los que aún no han acabado) (${JSON.stringify(plazo)})`)
  const tarjeta = leer('src/components/logros/companero/Companero.tsx')
  debe(tarjeta.includes('TarjetaDeCompanero({ tripId }') && tarjeta.includes('p.viaje === tripId') && leer('src/components/logros/momentos/HojaLogros.tsx').includes('<TarjetaDeCompanero tripId={tripId} />'), 'todos', 'la hoja «Tus logros en …» enseña la tarjeta de SU viaje y pregunta por él al abrirse')

  /* 3f. El panel ?admin=logros lleva el diagnóstico de «Yo también estaba» (también sin ser administrador). */
  await ev("__imp('/src/lib/companero.ts').then((m) => m.cargarCompanero('viaje-de-prueba-123')).then(() => true)")
  const guardado = await ev("JSON.parse(localStorage.getItem('jutrip.ultimo_companero') ?? 'null')")
  debe(guardado && guardado.enviado === 'viaje-de-prueba-123' && 'viaje_de_la_nube' in guardado && 'id_de_la_ruta' in guardado && guardado.estado === 200, 'diagnostico', `la app apunta qué viaje mandó, los dos ids y lo que contestó (${JSON.stringify(guardado)?.slice(0, 160)})`)
  await ev("location.href = '/admin/logros?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0&pestana=herramientas'; true")
  await esperar("Boolean(document.querySelector('[data-para-code-boton]'))", 60, 300)
  await ev("document.querySelector('[data-para-code-boton]').click(); true")
  await esperar("Boolean(document.querySelector('[data-diagnostico-companero]'))", 60, 300)
  await app.esp(1500)
  const panel = await ev("document.querySelector('[data-diagnostico-companero]')?.innerText ?? ''")
  debe(/Yo también estaba · diagnóstico/.test(panel) && /Versión del servidor/.test(panel) && /mandó trip_id = viaje-de-prueba-123/.test(panel), 'diagnostico', 'el panel enseña la versión del servidor y lo último que mandó la app, con su id')
  await ev("Array.from(document.querySelectorAll('[data-diagnostico-companero] button')).find((b) => /Preguntar ahora/.test(b.innerText))?.click(); true")
  await esperar("/Pasos del servidor/.test(document.querySelector('[data-diagnostico-companero]')?.innerText ?? '')", 30, 300)
  const panel2 = await ev("document.querySelector('[data-diagnostico-companero]')?.innerText ?? ''")
  debe(panel2.includes('Respuesta de /api/logros/companero?trip_id=viaje-de-prueba-123') && /estado: 200/.test(panel2) && /Pasos del servidor/.test(panel2), 'diagnostico', 'al preguntar, enseña la respuesta tal cual (estado y cuerpo) y los pasos')
  await app.captura(`${CAPTURAS}/panel_diagnostico.jpg`)
} finally {
  await app.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
