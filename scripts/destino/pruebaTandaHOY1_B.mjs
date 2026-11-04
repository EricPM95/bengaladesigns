// La prueba de la Tanda HOY1, agente B: la cámara de viaje (K1-K4), fuera de ruta (H8, H8b), «Cerca de ti» (K5-K8) y el juego (C16-C18).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY1_B.mjs
// Partes: 0 = datos y servidor (sin navegador), 1 = lo que se lee en el código, 2 = navegador (un Chrome por la cola, uno detrás de otro; el demo de los logros y datos de mentira del servidor).
//   Solo una parte: `parte=0`, `parte=1`, `parte=2` (o `solo=roma|lanzarote|sinpase|antes`). Con `capturas=0` no saca capturas.
// Formato del final: «N comprobaciones · M fallos».
import fs from 'node:fs'
import path from 'node:path'
import { cargarCatalogo, cargarDatos } from '../../server/logros/datos.js'
import { queEnsenar, retoDelDia, sitioDeFotoLibre, sitiosCerca, sitiosConLogro } from '../../server/logros/cerca.js'
import { clave } from '../../server/logros/motor.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'

const arg = (k, d) => process.argv.find((a) => a.startsWith(k + '='))?.slice(k.length + 1) ?? d
const PARTE = arg('parte', 'todas')
const SOLO = arg('solo', '')
const CAPTURAS = arg('capturas', '1') !== '0'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const quitaAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')

/* ───────────────────────── 0. Datos y servidor (puro, sin navegador) ───────────────────────── */
if (PARTE === 'todas' || PARTE === '0') {
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
  const sinGanar = new Map()
  const grados = (m) => m / 111320
  const coord = (destino, id) => {
    const c = catalogos[destino].places.find((p) => p.id === id).coordinates
    return { lat: c[0], lng: c[1] }
  }
  const desplazado = (c, metros) => ({ lat: c.lat + grados(metros), lng: c.lng })

  // La foto sin parada (K2/K3): el sitio con logro donde estás, esté o no en la ruta.
  const graciosa = coord('lanzarote', 'la_graciosa')
  debe(sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: graciosa, items: sinGanar }) === 'la_graciosa', 'una foto en La Graciosa (un `sitios_extra`, sin parada) cuenta para La Graciosa')
  debe(catalogos.lanzarote.places.some((p) => p.id === 'la_graciosa'), 'el catálogo de logros incluye los `sitios_extra` (La Graciosa)')
  const conEmblemaGanado = new Map([[clave('lanzarote', 'emblema', 'la_graciosa'), { logro: 'emblema' }]])
  const conTodoGanado = new Map(conEmblemaGanado)
  for (const c of datos.destinos.lanzarote.colecciones) if (c.sitios.includes('la_graciosa')) conTodoGanado.set(clave('lanzarote', 'pedazo', c.id + ':la_graciosa'), { logro: 'pedazo' })
  debe(sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: graciosa, items: conTodoGanado }) === null, 'con todo lo de La Graciosa ya ganado, la foto solo es un recuerdo (null)')
  debe(sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: { lat: 28.0, lng: -16.5 }, items: sinGanar }) === null, 'una foto lejos de todo sitio con logro solo es un recuerdo (null)')
  debe(sitioDeFotoLibre({ datos, catalogos, destino: 'lanzarote', ubicacion: null, items: sinGanar }) === null, 'una foto sin ubicación solo es un recuerdo (null)')
  const coliseo = coord('roma', 'coliseo')
  debe(sitioDeFotoLibre({ datos, catalogos, destino: 'roma', ubicacion: coliseo, items: sinGanar }) === 'coliseo', 'en Roma, una foto junto al Coliseo cuenta para el Coliseo (con emblema por ganar, primero)')

  // Cada sitio con logro tiene sus coordenadas en el catálogo (si no, nunca saldría cerca).
  for (const destino of ['roma', 'lanzarote']) {
    const sin = sitiosConLogro(datos.destinos[destino]).filter((id) => !catalogos[destino].places.find((p) => p.id === id)?.coordinates)
    debe(sin.length === 0, `${destino}: sitios con logro sin coordenadas en el catálogo: ${sin.join(', ')}`)
  }

  // Las distancias del juego se cuentan desde el BORDE del radio: «brilla» ≤500 m, «más cerca» ≤150 m, «llegada» dentro.
  const mirador = 'mirador_del_rio'
  const m0 = coord('lanzarote', mirador)
  const radio = datos.destinos.lanzarote.sitios[mirador].radio_m
  const en = (ubic, hoy = new Set()) => queEnsenar(sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: ubic, items: sinGanar, sitiosHoy: hoy }))
  debe(en(desplazado(m0, radio + 800)).juego === null, 'juego: a 800 m del borde, nada')
  debe(en(desplazado(m0, radio + 400)).juego === 'brilla' && en(desplazado(m0, radio + 400)).juego_sitio === mirador, 'juego: a ~400 m del borde, «Algo brilla cerca de aquí…»')
  debe(en(desplazado(m0, radio + 100)).juego === 'mas_cerca', 'juego: a ~100 m del borde, «Más cerca…»')
  debe(en(desplazado(m0, 20)).juego === 'llegada', 'juego: dentro del radio, la pantalla de siempre')
  const ganadoElEmblema = new Map([[clave('lanzarote', 'emblema', 'mirador_del_rio'), { logro: 'emblema' }]])
  debe(queEnsenar(sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: desplazado(m0, 20), items: ganadoElEmblema, sitiosHoy: new Set() })).juego === null, 'juego: con el emblema ya ganado, no brilla nada')
  const lista = sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: desplazado(m0, radio + 400), items: sinGanar })
  debe(!JSON.stringify(lista).includes('"emblema_id"') && lista.every((s) => !('emblema' in s)), 'el servidor no manda al móvil qué emblema se esconde en el juego (solo el nombre, que la tarjeta de fuera de ruta usa)')

  // Fuera de ruta (H8) y «junto a» (H8b).
  const fuera = queEnsenar(sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: graciosa, items: sinGanar, sitiosHoy: new Set(['montanas_del_fuego']) }))
  debe(fuera.fuera_de_ruta === 'la_graciosa', 'H8: en La Graciosa, que no está en la ruta de hoy → fuera_de_ruta')
  const enRuta = queEnsenar(sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: graciosa, items: sinGanar, sitiosHoy: new Set(['la_graciosa']) }))
  debe(enRuta.fuera_de_ruta === null, 'H8: si está en la ruta de hoy, no es fuera de ruta')
  const c = sitiosCerca({ datos, catalogos, destino: 'lanzarote', ubicacion: graciosa, items: sinGanar }).find((s) => s.sitio === 'la_graciosa')
  debe(c.en_sitio === 'en La Graciosa' && c.emblema_nombre === 'La octava isla', `H8: «Estás en La Graciosa · La octava isla» (sale «${c.en_sitio}» y «${c.emblema_nombre}»)`)
  // Roma: algo con pedazo y sin emblema (Boca de la Verdad), pasando al lado.
  const boca = datos.destinos.roma.colecciones.flatMap((x) => x.sitios).find((id) => id === 'bocca_della_verita' || id === 'boca_de_la_verdad') ?? datos.destinos.roma.colecciones.flatMap((x) => x.sitios).find((id) => !datos.destinos.roma.emblemas.some((e) => e.sitio === id))
  const cb = coord('roma', boca)
  const rb = datos.destinos.roma.sitios[boca]?.radio_m ?? 150
  const junto = queEnsenar(sitiosCerca({ datos, catalogos, destino: 'roma', ubicacion: desplazado(cb, rb + 90), items: sinGanar, sitiosHoy: new Set() }))
  debe(junto.junto_a != null, `H8b: pasando a 90 m del borde de un sitio con pedazo (${boca}) que no está en la ruta → junto_a (sale ${junto.junto_a})`)
  const enSitioRoma = sitiosCerca({ datos, catalogos, destino: 'roma', ubicacion: desplazado(cb, rb + 90), items: sinGanar }).find((s) => s.sitio === boca)
  debe(/^a(l)? /.test(enSitioRoma.a_sitio), `H8b: la frase lleva el artículo del sitio («${enSitioRoma.a_sitio}»)`)

  // El reto del día (C18).
  const col = datos.destinos.roma.colecciones.find((x) => x.sitios.length >= 4)
  const ganados = new Map()
  for (const s of col.sitios.slice(0, col.sitios.length - 2)) ganados.set(clave('roma', 'pedazo', col.id + ':' + s), { logro: 'pedazo' })
  const hoy = new Set(col.sitios.slice(col.sitios.length - 2))
  const reto = retoDelDia({ datos, catalogos, destino: 'roma', items: ganados, sitiosHoy: hoy })
  debe(reto && reto.faltan === 2 && reto.coleccion === col.id, `C18: una colección a la que le faltan 2 y están hoy en la ruta → «te faltan 2» (sale ${JSON.stringify(reto && { c: reto.coleccion, f: reto.faltan })}, esperaba ${col.id})`)
  debe(retoDelDia({ datos, catalogos, destino: 'roma', items: ganados, sitiosHoy: new Set([...hoy].slice(0, 1)) }) === null || retoDelDia({ datos, catalogos, destino: 'roma', items: ganados, sitiosHoy: new Set([...hoy].slice(0, 1)) })?.coleccion !== col.id, 'C18: si uno de los que faltan NO está hoy en la ruta, esa colección no es el reto')
  debe(retoDelDia({ datos, catalogos, destino: 'roma', items: sinGanar, sitiosHoy: new Set(col.sitios) })?.coleccion !== col.id || col.sitios.length <= 3, 'C18: una colección entera por ganar (más de 3) no es un reto del día')
  debe(retoDelDia({ datos, catalogos, destino: 'lanzarote', items: sinGanar, sitiosHoy: new Set() }) === null, 'C18: sin paradas hoy, sin reto')
  // El servicio entero (con un repositorio de memoria): la foto SIN parada gana el emblema de La Graciosa (no es parada de ninguna ruta) y una foto en medio de la nada solo es un recuerdo.
  {
    const viaje = { id: 'v1', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'solo' }, days: [{ dayNumber: 2, stops: [{ id: 's1', name: 'Mirador del Río' }] }] } }
    const guardados = []
    const repo = { hechosDe: async () => guardados, viajesDe: async () => [viaje], logrosDe: async () => [], cuentaDe: async () => ({}), ordenPionero: async () => null, probadorDe: async () => null, perfilDe: async () => ({}), guardarPerfil: async () => {}, referidosDe: async () => [], ultimaFrase: async () => null, insertarHecho: async (h) => { const fila = { id: 'h' + guardados.length, ...h }; guardados.push(fila); return fila }, insertarLogros: async (_u, filas) => filas, pruebaDe: async () => null, pasesDe: async () => [], guardarPrueba: async () => {}, sinPaseDe: async () => false }
    const log = console.log
    console.log = () => {}
    const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date('2026-11-09T10:00:00Z'), cobro: false })
    const g = catalogos.lanzarote.places.find((p) => p.id === 'la_graciosa').coordinates
    const ahora = '2026-11-09T10:00:00Z'
    const c = await servicio.cerca('u', { trip_id: 'v1', ubicacion: { lat: g[0], lng: g[1] }, sitios_hoy: ['Mirador del Río'] })
    const sinFoto = await servicio.foto('u', { trip_id: 'v1', libre: true, origen: 'app', tomada_en: ahora, ubicacion: { lat: 20, lng: -10 } })
    const sinUbic = await servicio.foto('u', { trip_id: 'v1', libre: true, origen: 'app', tomada_en: ahora, ubicacion: null })
    const hechosAntes = guardados.length
    const conFoto = await servicio.foto('u', { trip_id: 'v1', libre: true, origen: 'app', tomada_en: ahora, ubicacion: { lat: g[0], lng: g[1] } })
    console.log = log
    debe(c.ok && c.fuera_de_ruta === 'la_graciosa' && c.juego === 'llegada', 'servicio.cerca: en La Graciosa (no está en la ruta de hoy) → fuera_de_ruta y llegada')
    debe(sinFoto.ok && sinFoto.valida && sinFoto.cuenta === false && sinFoto.motivo === 'sin_logro_aqui' && sinFoto.nuevos.length === 0, 'servicio.foto libre en medio de la nada → válida, no gana nada («sin_logro_aqui»)')
    debe(sinUbic.ok && sinUbic.cuenta === false && sinUbic.motivo === 'sin_ubicacion' && sinUbic.nuevos.length === 0, 'servicio.foto libre sin ubicación → solo un recuerdo («sin_ubicacion»)')
    debe(hechosAntes === 0, 'servicio.foto libre sin sitio no guarda ningún hecho')
    debe(conFoto.ok && conFoto.valida && conFoto.nuevos.some((m) => m.tipo === 'emblema' && m.nombre === 'La octava isla'), 'servicio.foto libre en La Graciosa → gana «La octava isla» sin ninguna parada')
    debe(guardados.length === 1 && !JSON.stringify(guardados[0]).includes(String(g[0]).slice(0, 6)), 'el hecho guardado no lleva las coordenadas de la ubicación')
  }
}

/* ───────────────────────── 1. Lo que se lee en el código ───────────────────────── */
if (PARTE === 'todas' || PARTE === '1') {
  const f = (r) => leer(r)
  const cam = f('src/components/route/hoy/CamaraViaje.tsx')
  const lib = f('src/lib/camaraViaje.ts')
  const cerca = f('src/components/route/hoy/CercaDeTiFila.tsx')
  const fuera = f('src/components/route/hoy/FueraDeRuta.tsx')
  const juego = f('src/components/route/hoy/JuegoCerca.tsx')
  const avisos = f('src/components/route/hoy/AvisosDeCerca.tsx')
  const vista = f('src/components/route/hoy/HoyView.tsx')
  const durante = f('src/components/route/hoy/v2/HoyDuranteV2.tsx')
  const servicio = f('server/logros/servicio.js')
  const rutas = f('server/logros/rutas.js')

  // Los textos de Design (Hoy Estados y Companero), tal cual.
  for (const t of ['Tu cámara de viaje', 'Guarda tus recuerdos del viaje. Y si estás en un lugar especial, aunque no esté en tu ruta, haz tu foto: puede que te espere una recompensa.', 'Abrir cámara', 'Solo disponible con el', 'Ver el pase', 'Podrás usarla durante tu viaje', 'Entendido', '¡Eh! Aquí hay', 'Tu foto ha desbloqueado un logro de este sitio.', 'Descubrirlo', 'Guardada en los recuerdos de hoy', 'La comprobamos cuando vuelvas a tener conexión']) debe(cam.includes(t), `CamaraViaje.tsx: falta el texto de Design «${t}»`)
  for (const t of ['CERCA DE TI', 'Baños', 'Fuentes', 'Comer', 'Gasolineras', 'Aparcar', 'Baños cerca', 'Gasolineras cerca', 'a pie', 'en coche', 'Maps']) debe(cerca.includes(t), `CercaDeTiFila.tsx: falta el texto de Design «${t}»`)
  for (const t of ['CERCA DE TI', 'Estás junto', 'Estás ${sitio.en_sitio}', 'Haz tu foto para ganar «', '¿Lo añadimos?', 'Añadir a mi ruta', 'Ahora no', 'Hacer la foto', 'También puedes hacerla desde el botón de la cámara.']) debe(fuera.includes(t), `FueraDeRuta.tsx: falta el texto de Design «${t}»`)
  for (const t of ['Algo brilla cerca de aquí…', 'Hay un emblema secreto por esta zona.', 'Más cerca…', 'Sigue por aquí.', '¡Aquí se esconde un Emblema Oculto!', 'Reto del día', 'Hoy puedes completar']) debe(juego.includes(t), `JuegoCerca.tsx: falta el texto de Design «${t}»`)

  // Nada de Roma escrito a mano en lo que sirve a los dos destinos (el nombre del pase, los sitios y los textos salen de los datos).
  for (const [n, t] of Object.entries({ 'CamaraViaje.tsx': cam, 'camaraViaje.ts': lib, 'CercaDeTiFila.tsx': cerca, 'FueraDeRuta.tsx': fuera, 'JuegoCerca.tsx': juego, 'AvisosDeCerca.tsx': avisos })) {
    const codigo = quitaAcentos(sinComentarios(t))
    debe(!/\b(Roma|Panteon|Coliseo|Trevi|Trastevere|Vaticano|Nasoni)\b/.test(codigo), `${n}: lleva un nombre de Roma escrito a mano`)
  }
  debe(cam.includes('nombreDelPase(destino)'), 'CamaraViaje.tsx: «Pase {destino}» sale del destino (nombreDelPase), no escrito a mano')

  // La regla de los dos destinos del camino: a pie en Roma, en coche en Lanzarote.
  debe(/esDestinoDeCoche\(route\.destination\)/.test(cerca) && cerca.includes("'driving'") && cerca.includes("'walking'"), 'CercaDeTiFila.tsx: el camino a Maps es en coche en los destinos de coche y a pie en el resto')
  debe(/BOTONES_ROMA[\s\S]*banos[\s\S]*fuentes[\s\S]*comer/.test(cerca) && /BOTONES_COCHE[\s\S]*gasolineras[\s\S]*aparcar[\s\S]*comer/.test(cerca), 'CercaDeTiFila.tsx: Roma = Baños · Fuentes · Comer; Lanzarote = Gasolineras · Aparcar · Comer')
  debe(cerca.includes('data-cerca-fila') && /<a\s[\s\S]{0,80}href=\{urlDeCamino/.test(cerca), 'CercaDeTiFila.tsx: cada fila de la hoja es un enlace entero (toda la fila se toca)')
  debe(lib.includes('maps.apple.com') && lib.includes('google.com/maps/dir'), 'camaraViaje.ts: el camino abre Apple Maps (iPhone) o Google Maps')
  debe(cerca.includes('abrirAvisoPase') && /conPase \?/.test(cerca), 'CercaDeTiFila.tsx: sin pase, cada botón lleva su candado y abre el aviso del pase')

  // Reglas que no se discuten.
  debe(vista.includes('BotonCamaraViaje') && !/pagoActivo\(\)\s*&&[^\n]*BotonCamaraViaje/.test(vista), 'HoyView.tsx: la cámara se pinta SIEMPRE (con y sin pase)')
  debe((vista.match(/\{camara\}/g) ?? []).length >= 3, 'HoyView.tsx: la cámara está en los tres caminos de HOY (sin pase, HOY v2 y el de siempre)')
  debe(/if \(!p\.conAcceso\) return 'sin_pase'/.test(lib) && /fase === 'during'/.test(lib), 'camaraViaje.ts: sin pase = candado; durante = cámara; antes y después = hoja con las fechas')
  debe(lib.includes('marcarCamaraExplicada') && cam.includes('marcarCamaraExplicada()') && /explicada: camaraExplicada\(\)/.test(cam), 'CamaraViaje.tsx: la hoja de explicación solo sale la primera vez')
  debe(!/setStopVisto|addReservation|removeReservation|reservations/.test(sinComentarios(cam + fuera + juego + avisos + cerca)), 'las reservas y los vistos no se tocan desde la cámara, fuera de ruta, el juego ni Cerca de ti')
  debe(/withUndo\(/.test(fuera) && /insertStopAt/.test(fuera) && !/\.setState\(/.test(sinComentarios(fuera)), 'FueraDeRuta.tsx: [Añadir a mi ruta] es lo único que cambia el día, solo al pulsarlo y con [Deshacer] (withUndo)')
  debe(/yaSalio\(tripId, dateIso, sitio, juego\)/.test(avisos) && avisos.includes('anotarQueSalio'), 'AvisosDeCerca.tsx: el juego sale una vez por sitio y por día (se anota en el móvil)')
  debe(/sugerenciasDelCompanero\(\)/.test(avisos) && avisos.includes('pagoActivo() && sugerencias'), 'AvisosDeCerca.tsx: solo con pase y con «Sugerencias del compañero» encendido')
  debe(durante.includes('<AvisosDeCerca ') && durante.includes('<CercaDeTiFila '), 'HoyDuranteV2.tsx: enganchados AvisosDeCerca y CercaDeTiFila (una línea cada uno)')
  debe((durante.match(/<AvisosDeCerca /g) ?? []).length === 1 && (durante.match(/<CercaDeTiFila /g) ?? []).length === 1 && (durante.match(/^import .*(AvisosDeCerca|CercaDeTiFila)/gm) ?? []).length === 2, 'HoyDuranteV2.tsx: solo la importación y UNA línea de enganche por cada uno')
  // El servidor.
  debe(servicio.includes('sitioDeFotoLibre') && servicio.includes('sin_logro_aqui') && /libre = false/.test(servicio), 'servicio.js: la foto «libre» (sin parada) busca el sitio por la ubicación y, si no hay, es solo un recuerdo')
  debe(rutas.includes("'/api/logros/cerca'"), 'rutas.js: existe POST /api/logros/cerca')
  debe(servicio.includes('async function cerca(') && /cerca, deshacer/.test(servicio), 'servicio.js: `cerca` está en lo que devuelve el servicio')
  debe(!/insertarHecho\([\s\S]{0,200}ubicacion\s*[,}]/.test(servicio.slice(servicio.indexOf('async function cerca('), servicio.indexOf('async function cerca(') + 1500)), 'servicio.js › cerca: la ubicación no se guarda en ningún hecho')
}

/* ───────────────────────── 2. Navegador ───────────────────────── */
if (PARTE === 'todas' || PARTE === '2') {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const APP = process.env.APP_URL ?? 'http://localhost:5173'
  const RUTA = '/?cuentas=off&logrosDemo=1&apertura=0&version=completa&hoy2=on'
  const fotito = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='

  const abrir = async ({ destino, hoy, pase = 'con', limpiar = true }) => {
    const a = await abrirApp(APP, { ruta: pase === 'sin' ? RUTA.replace('version=completa', 'version=gratis') : RUTA, ancho: 390, alto: 844, antes: `try { sessionStorage.setItem('trazo:demo-pase', '${pase}'); } catch (e) {}` })
    const ev = (js) => a.evaluar(js)
    const fn = destino === 'lanzarote' ? '__rutaLanzarote' : '__rutaPrueba'
    await a.hasta(`typeof window.${fn} === 'function' && typeof window.__demo === 'object'`, { segundos: 240, lanzar: 'no está la ruta de prueba' })
    await ev('window.__hoy1SinAlbum = true; true')
    if (limpiar) await ev("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:hoy') || k.startsWith('trazo:logros')) localStorage.removeItem(k); return true })()")
    await ev(destino === 'lanzarote' ? `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '${hoy}' }).then(() => true)` : `Promise.resolve(window.__rutaPrueba()).then(() => true)`)
    await a.esp(2500)
    return { a, ev }
  }
  // Las hojas y escenas que no son de esta prueba (el aviso de «hemos preparado tu viaje», las sorpresas de lo ganado) se cierran para ver HOY.
  const cerrarAvisos = async ({ a, ev }) => {
    for (let i = 0; i < 8; i++) {
      const cerrada = await ev("(() => { const b = [...document.querySelectorAll('button')].find((x) => /^(Siguiente|Entendido|Vale|Saltar todo|Seguir|Continuar)$/.test((x.textContent || '').trim()) && !x.closest('[data-camara-viaje],[data-juego],[data-cerca-hoja]')); if (!b) return false; b.click(); return true })()")
      if (!cerrada) break
      await a.esp(700)
    }
  }
  const irAHoy = async ({ a, ev }, hoy) => {
    await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${hoy}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
    await a.hasta("Boolean(document.querySelector('[data-camara-viaje=boton]'))", { segundos: 40, lanzar: 'no sale el botón de la cámara de viaje en HOY' })
    await a.esp(1500)
    await cerrarAvisos({ a, ev })
  }
  const cap = async (a, nombre) => {
    if (CAPTURAS) await a.captura(path.join(SALIDA, `hoy1_${nombre}.jpg`))
  }
  const clic = (ev, sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
  const hay = (ev, sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const texto = (ev, sel) => ev(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '')`)
  const disparar = async ({ a, ev }) => {
    await a.hasta("Boolean(document.querySelector('[data-visto=camara]'))", { segundos: 15, lanzar: 'no se abre la cámara' })
    await a.esp(1600)
    await ev("(() => { document.querySelector('[data-visto=camara] button[aria-label=\"Hacer la foto\"]').click(); return true })()")
  }
  const tocarCamara = async ({ a, ev }) => {
    await clic(ev, '[data-camara-viaje=boton]')
    await a.esp(500)
  }
  // Un viaje de Roma y uno de Lanzarote: lo mismo, dos destinos.
  const escenario = async (destino, hoyFecha) => {
    const e = await abrir({ destino, hoy: hoyFecha })
    const { a, ev } = e
    // El servidor de mentira de fuera de ruta y del juego se pone ANTES de entrar en HOY.
    const sitioFuera = destino === 'lanzarote'
      ? { sitio: 'la_graciosa', nombre: 'La Graciosa', en_sitio: 'en La Graciosa', a_sitio: 'a La Graciosa', metros: 300, radio_m: 2500, al_borde_m: 0, dentro: true, en_ruta_hoy: false, hay_emblema: true, emblema_nombre: 'La octava isla', hay_pedazo: false, coleccion_nombre: null }
      : { sitio: 'boca', nombre: 'Bocca della Verità', en_sitio: 'en la Bocca della Verità', a_sitio: 'a la Bocca della Verità', metros: 230, radio_m: 100, al_borde_m: 130, dentro: false, en_ruta_hoy: false, hay_emblema: false, emblema_nombre: null, hay_pedazo: true, coleccion_nombre: 'La Roma antigua' }
    const vacia = { ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null }
    await ev(`window.__hoy1Cerca = ${JSON.stringify(vacia)}; window.__hoy1HoraLocal = 15; true`)
    await irAHoy(e, hoyFecha)
    const nombreDestino = destino === 'lanzarote' ? 'Lanzarote' : 'Roma'
    const NOMBRES_AJENOS = destino === 'lanzarote' ? /Roma|Fontana|Pante[oó]n|Trastevere|Vaticano|Nasoni/ : /Lanzarote|Timanfaya|Jameos|Gasolineras|Aparcar/

    // ── K1: el botón siempre; la hoja la primera vez
    debe(await hay(ev, '[data-camara-viaje=boton]'), `${destino}: la cámara de viaje está en HOY`)
    debe((await ev("document.querySelector('[data-camara-viaje=boton]').getAttribute('data-modo')")) === 'primera_vez', `${destino}: con pase y durante el viaje, la primera vez enseña la hoja «Tu cámara de viaje»`)
    debe(!(await hay(ev, '[data-camara-viaje=candado-boton]')), `${destino}: con pase, la cámara no lleva candado`)
    await cap(a, `${destino}_k1_boton`)
    await tocarCamara(e)
    debe(await hay(ev, '[data-camara-viaje=hoja]'), `${destino}: tocar la cámara la primera vez abre la hoja`)
    const hoja = await texto(ev, '[data-camara-viaje=hoja]')
    debe(/Tu cámara de viaje/.test(hoja) && /Abrir cámara/.test(hoja) && /haz tu foto: puede que te espere una recompensa/.test(hoja), `${destino}: la hoja K1 tiene el título, el texto de Design y [Abrir cámara]`)
    debe(!NOMBRES_AJENOS.test(hoja), `${destino}: la hoja de la cámara no lleva nombres del otro destino`)
    await cap(a, `${destino}_k1_hoja`)
    // ── K3: foto sin logro
    await clic(ev, '[data-camara-viaje=abrir]')
    await a.esp(500)
    debe(!(await hay(ev, '[data-camara-viaje=hoja]')), `${destino}: [Abrir cámara] cierra la hoja y abre la cámara`)
    debe((await ev("localStorage.getItem('trazo:hoy:camara-explicada')")) === '1', `${destino}: la hoja de explicación se apunta como vista`)
    await disparar(e)
    await a.hasta("Boolean(document.querySelector('[data-camara-viaje=recuerdo]'))", { segundos: 15, lanzar: 'no sale «Guardada en los recuerdos de hoy»' })
    debe(/Guardada en los recuerdos de hoy/.test(await texto(ev, '[data-camara-viaje=recuerdo]')), `${destino}: K3 foto sin logro → «Guardada en los recuerdos de hoy»`)
    await cap(a, `${destino}_k3_recuerdo`)
    await a.esp(5300)
    debe(!(await hay(ev, '[data-camara-viaje=recuerdo]')), `${destino}: el aviso de «Guardada…» se va solo`)
    // La segunda vez, directa a la cámara.
    await tocarCamara(e)
    debe(!(await hay(ev, '[data-camara-viaje=hoja]')) && (await hay(ev, '[data-visto=camara]')), `${destino}: la segunda vez va derecha a la cámara (la hoja solo sale una vez)`)
    // ── K2: foto en un sitio con logro (aunque no esté en tu ruta)
    await ev("window.__hoy1FotoDemo = 'logro'; true")
    await disparar(e)
    await a.hasta("Boolean(document.querySelector('[data-camara-viaje=algo]'))", { segundos: 15, lanzar: 'no sale «¡Eh! Aquí hay algo…»' })
    const algo = await texto(ev, '[data-camara-viaje=algo]')
    debe(/¡Eh! Aquí hay\s*algo…/.test(algo) && /Tu foto ha desbloqueado un logro de este sitio\./.test(algo) && /Descubrirlo/.test(algo), `${destino}: K2 foto con logro → «¡Eh! Aquí hay algo…» + [Descubrirlo]`)
    await cap(a, `${destino}_k2_algo`)
    debe((await ev("(async () => { const L = await import('/src/store/useLogrosStore.ts'); return L.useLogrosStore.getState().hojaAbierta })()")) === true, `${destino}: mientras sale «Aquí hay algo…», las sorpresas esperan`)
    await clic(ev, '[data-camara-viaje=descubrirlo]')
    await a.esp(800)
    debe(!(await hay(ev, '[data-camara-viaje=algo]')), `${destino}: [Descubrirlo] cierra la pantalla y deja pasar lo ganado`)
    await ev("window.__hoy1FotoDemo = null; true")
    await a.esp(1500)
    await cerrarAvisos(e)
    // ── K4: sin conexión
    await a.hasta("!document.querySelector('[role=dialog]')", { segundos: 25 })
    await ev("window.__demo.sinCobertura(true); true")
    // (las escenas de lo ganado pueden tapar HOY unos segundos: se cierran si salieron)
    await tocarCamara(e)
    await disparar(e)
    await a.hasta("Boolean(document.querySelector('[data-camara-viaje=sin-conexion]'))", { segundos: 20, lanzar: 'no sale «Guardada · La comprobamos…»' })
    const sinRed = await texto(ev, '[data-camara-viaje=sin-conexion]')
    debe(/Guardada/.test(sinRed) && /La comprobamos cuando vuelvas a tener conexión/.test(sinRed), `${destino}: K4 foto sin conexión → «Guardada · La comprobamos cuando vuelvas a tener conexión»`)
    await cap(a, `${destino}_k4_sin_conexion`)
    const cola = JSON.parse((await ev("localStorage.getItem('trazo:logros:cola') ?? '[]'")) || '[]')
    debe(cola.some((h) => h.tipo === 'foto' && h.cuerpo.libre === true && h.cuerpo.origen === 'app'), `${destino}: sin conexión, la foto queda en la cola para comprobarla al volver (con su hora)`)
    await a.esp(2500)
    const guardadas = await ev("new Promise((r) => { const p = indexedDB.open('trazo-camara-viaje', 1); p.onerror = () => r(-1); p.onsuccess = () => { const db = p.result; if (!db.objectStoreNames.contains('pendientes')) return r(-2); const q = db.transaction('pendientes').objectStore('pendientes').count(); q.onsuccess = () => r(q.result); q.onerror = () => r(-3) } })")
    debe(guardadas >= 1, `${destino}: sin conexión, la propia foto se guarda en el móvil (${guardadas}) para subirla al álbum al volver`)
    await ev("window.__demo.sinCobertura(false); true")
    await a.esp(5300)
    await cerrarAvisos(e)

    // ── K5 a K8: «Cerca de ti»
    const fila = '[data-cerca-de-ti]'
    debe(await hay(ev, fila), `${destino}: la fila «Cerca de ti» está debajo de la tarjeta`)
    const etiquetas = await ev("[...document.querySelectorAll('[data-cerca-boton]')].map((b) => b.innerText.trim())")
    const quieren = destino === 'lanzarote' ? ['Gasolineras', 'Aparcar', 'Comer'] : ['Baños', 'Fuentes', 'Comer']
    debe(JSON.stringify(etiquetas) === JSON.stringify(quieren), `${destino}: «Cerca de ti» = ${quieren.join(' · ')} (sale ${etiquetas.join(' · ')})`)
    debe((await ev("document.querySelector('[data-cerca-de-ti]').getAttribute('data-cerca-modo')")) === (destino === 'lanzarote' ? 'coche' : 'pie'), `${destino}: modo del camino (${destino === 'lanzarote' ? 'coche' : 'a pie'})`)
    debe(!NOMBRES_AJENOS.test(await texto(ev, fila)), `${destino}: «Cerca de ti» no lleva nombres del otro destino`)
    await ev("document.querySelector('[data-cerca-de-ti]').scrollIntoView({ block: 'center' }); true")
    await a.esp(400)
    await cap(a, `${destino}_k5_cerca`)
    const primero = destino === 'lanzarote' ? 'gasolineras' : 'banos'
    await ev("window.__hoy1Ubicacion = " + (destino === 'lanzarote' ? '{ lat: 29.0, lng: -13.5 }' : '{ lat: 41.9028, lng: 12.4534 }') + '; true')
    await clic(ev, `[data-cerca-boton=${primero}]`)
    await a.hasta(`Boolean(document.querySelector('[data-cerca-hoja=${primero}]'))`, { segundos: 10, lanzar: 'no se abre la hoja de Cerca de ti' })
    await a.hasta(`document.querySelectorAll('[data-cerca-fila]').length > 0 || Boolean(document.querySelector('[data-cerca-vacio]'))`, { segundos: 25 })
    const filas = await ev("[...document.querySelectorAll('[data-cerca-fila]')].map((x) => ({ href: x.href, t: x.innerText.replace(/\\s+/g, ' ').trim() }))")
    debe(filas.length >= 1 && filas.length <= 4, `${destino}: la hoja ${primero} enseña de 1 a 4 sitios (salen ${filas.length})`)
    debe(filas.every((x) => x.href.includes(destino === 'lanzarote' ? 'travelmode=driving' : 'travelmode=walking')), `${destino}: cada sitio abre Maps ${destino === 'lanzarote' ? 'en coche' : 'a pie'} (${filas[0]?.href})`)
    debe(filas.every((x) => new RegExp(destino === 'lanzarote' ? 'en coche' : 'a pie').test(x.t) && /Maps/.test(x.t)), `${destino}: cada sitio dice su distancia y minutos ${destino === 'lanzarote' ? 'en coche' : 'a pie'}`)
    const distancias = filas.map((x) => x.t)
    debe(!NOMBRES_AJENOS.test((await texto(ev, `[data-cerca-hoja=${primero}]`)) ), `${destino}: la hoja no lleva nombres del otro destino`)
    if (destino === 'lanzarote') debe(await hay(ev, '[data-aviso-gasolineras]'), 'lanzarote: la hoja de gasolineras lleva el aviso del norte')
    debe(distancias.length === filas.length, 'filas leídas')
    await cap(a, `${destino}_${destino === 'lanzarote' ? 'k8' : 'k7'}_hoja`)
    const toda = await ev("(() => { const f = document.querySelector('[data-cerca-fila]'); if (!f) return null; const r = f.getBoundingClientRect(); const p = f.parentElement.getBoundingClientRect(); return { ancho: Math.round(r.width), padre: Math.round(p.width) } })()")
    debe(toda && toda.ancho >= toda.padre - 2, `${destino}: la fila se toca entera (ocupa todo el ancho de la hoja)`)
    await ev("document.querySelector('[data-cerca-hoja] button[aria-label=Cerrar]').click(); true")
    await a.esp(400)
    // «Comer»
    await clic(ev, '[data-cerca-boton=comer]')
    await a.hasta("Boolean(document.querySelector('[data-cerca-hoja=comer]'))", { segundos: 10, lanzar: 'no se abre Comer cerca' })
    await a.hasta("document.querySelectorAll('[data-cerca-fila]').length > 0 || Boolean(document.querySelector('[data-cerca-vacio]'))", { segundos: 25 })
    const comer = await ev("[...document.querySelectorAll('[data-cerca-fila]')].map((x) => x.href)")
    debe(comer.length >= 1 && comer.every((h) => h.includes(destino === 'lanzarote' ? 'travelmode=driving' : 'travelmode=walking')), `${destino}: Comer cerca abre Maps ${destino === 'lanzarote' ? 'en coche' : 'a pie'} (${comer.length} sitios)`)
    await cap(a, `${destino}_comer_hoja`)
    await ev("document.querySelector('[data-cerca-hoja] button[aria-label=Cerrar]').click(); true")
    await a.esp(300)

    // ── H8 / H8b: fuera de ruta
    await ev(`window.__hoy1Cerca = ${JSON.stringify({ ok: true, cerca: [sitioFuera], juego: null, juego_sitio: null, fuera_de_ruta: destino === 'lanzarote' ? sitioFuera.sitio : null, junto_a: destino === 'lanzarote' ? null : sitioFuera.sitio, reto: null })}; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true`)
    await a.hasta("Boolean(document.querySelector('[data-fuera-de-ruta]'))", { segundos: 15, lanzar: 'no sale la tarjeta de fuera de ruta' })
    const tf = await texto(ev, '[data-fuera-de-ruta]')
    if (destino === 'lanzarote') {
      debe(/CERCA DE TI/.test(tf) && /Estás en La Graciosa/.test(tf) && /Haz tu foto para ganar «La octava isla»\./.test(tf) && /Hacer la foto/.test(tf), 'lanzarote: H8 «Estás en La Graciosa · Haz tu foto para ganar "La octava isla"» + [Hacer la foto]')
      debe(/También puedes hacerla desde el botón de la cámara\./.test(await ev('document.body.innerText')), 'lanzarote: H8 lleva «También puedes hacerla desde el botón de la cámara.»')
    } else {
      debe(/Estás junto a la Bocca della Verità/.test(tf) && /Es un pedazo de la colección La Roma antigua\. ¿Lo añadimos\?/.test(tf) && /Añadir a mi ruta/.test(tf) && /Ahora no/.test(tf), 'roma: H8b «Estás junto a… ¿Lo añadimos?» con [Añadir a mi ruta] y [Ahora no]')
    }
    await ev("document.querySelector('[data-fuera-de-ruta]').scrollIntoView({ block: 'center' }); true")
    await a.esp(500)
    await cap(a, `${destino}_${destino === 'lanzarote' ? 'h8' : 'h8b'}_fuera_de_ruta`)
    if (destino === 'lanzarote') {
      // [Hacer la foto] abre la misma cámara, con la etiqueta de Emblema Oculto, y una foto con logro da «Aquí hay algo…».
      await clic(ev, '[data-fuera-de-ruta-boton=foto]')
      await a.hasta("Boolean(document.querySelector('[data-visto=camara]'))", { segundos: 10, lanzar: '[Hacer la foto] de fuera de ruta no abre la cámara' })
      debe(/Emblema Oculto/.test(await texto(ev, '[data-visto=camara]')), 'lanzarote: la cámara de La Graciosa lleva la etiqueta «Emblema Oculto»')
      await ev("[...document.querySelectorAll('[data-visto=camara] button')].find((b) => b.getAttribute('aria-label') === 'Cerrar cámara').click(); true")
      await a.esp(500)
    } else {
      // [Ahora no]: se va y no vuelve en el día; el día no se movió.
      const antes = await ev("(async () => { const R = await import('/src/store/useRouteStore.ts'); return JSON.stringify(R.useRouteStore.getState().route.days.map((d) => d.stops.map((s) => s.id))) })()")
      await clic(ev, '[data-fuera-de-ruta-boton=ahora-no]')
      await a.esp(500)
      debe(!(await hay(ev, '[data-fuera-de-ruta]')), 'roma: [Ahora no] quita la tarjeta')
      await ev("window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true")
      await a.esp(800)
      debe(!(await hay(ev, '[data-fuera-de-ruta]')), 'roma: tras [Ahora no], no vuelve en el día')
      const despues = await ev("(async () => { const R = await import('/src/store/useRouteStore.ts'); return JSON.stringify(R.useRouteStore.getState().route.days.map((d) => d.stops.map((s) => s.id))) })()")
      debe(antes === despues, 'roma: nada se movió solo (las paradas son las mismas)')
    }
    // ── C18: el reto del día, solo por la mañana
    const reto = { coleccion: 'x', nombre: destino === 'lanzarote' ? 'Los imprescindibles de Lanzarote' : 'La Roma antigua', faltan: 2, total: 6, sitios: [{ sitio: 'a', nombre: 'Uno', ganado: true, hoy: false }, { sitio: 'b', nombre: 'Dos', ganado: false, hoy: true }, { sitio: 'c', nombre: 'Tres', ganado: false, hoy: true }] }
    await ev(`window.__hoy1Cerca = ${JSON.stringify({ ...vacia, reto })}; window.__hoy1HoraLocal = 15; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true`)
    await a.esp(1200)
    debe(!(await hay(ev, '[data-reto-del-dia]')), `${destino}: C18 por la tarde no sale el reto del día`)
    await ev("window.__hoy1HoraLocal = 9; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true")
    await a.esp(1500)
    // (el repintado por la hora pasa al llegar la siguiente respuesta)
    await a.hasta("Boolean(document.querySelector('[data-reto-del-dia]'))", { segundos: 10, lanzar: 'no sale el reto del día por la mañana' })
    const rt = await texto(ev, '[data-reto-del-dia]')
    debe(/Reto del día/i.test(rt) && /Hoy puedes completar/.test(rt) && /te faltan 2\./.test(rt), `${destino}: C18 por la mañana → «Hoy puedes completar … te faltan 2.»`)
    await ev("document.querySelector('[data-reto-del-dia]').scrollIntoView({ block: 'center' }); true")
    await a.esp(400)
    await cap(a, `${destino}_c18_reto`)
    // ── C16 / C17 / llegada: una vez por sitio y por día
    const sitioJuego = { ...sitioFuera, sitio: destino === 'lanzarote' ? 'mirador_del_rio' : 'coliseo', nombre: destino === 'lanzarote' ? 'Mirador del Río' : 'Coliseo', en_sitio: destino === 'lanzarote' ? 'en el Mirador del Río' : 'en el Coliseo', hay_emblema: true, en_ruta_hoy: true, dentro: false, al_borde_m: 400, hay_pedazo: false }
    const jugada = (nivel, borde) => ({ ok: true, cerca: [{ ...sitioJuego, al_borde_m: borde, dentro: nivel === 'llegada' }], juego: nivel, juego_sitio: sitioJuego.sitio, fuera_de_ruta: null, junto_a: null, reto: null })
    const poner = async (obj) => {
      await ev(`window.__hoy1Cerca = ${JSON.stringify(obj)}; window.dispatchEvent(new Event('trazo:hoy1-repreguntar')); true`)
      await a.esp(1200)
    }
    await poner(jugada('brilla', 400))
    debe(await hay(ev, '[data-juego=brilla]'), `${destino}: C16 a unos 500 m → tarjeta «Algo brilla cerca de aquí…»`)
    const tb = await texto(ev, '[data-juego=brilla]')
    debe(/Algo brilla cerca de aquí…/.test(tb) && /Hay un emblema secreto por esta zona\./.test(tb), `${destino}: C16 texto de Design`)
    debe(!tb.includes(sitioJuego.nombre) && !/emblema_nombre/.test(tb), `${destino}: C16 no dice qué emblema ni dónde (sin pistas)`)
    await ev("document.querySelector('[data-juego=brilla]').scrollIntoView({ block: 'center' }); true")
    await a.esp(500)
    await cap(a, `${destino}_c16_brilla`)
    await poner(jugada('mas_cerca', 120))
    debe(await hay(ev, '[data-juego=mas_cerca]') && !(await hay(ev, '[data-juego=brilla]')), `${destino}: C17 a unos 150 m → «Más cerca…» (sustituye a la anterior)`)
    debe(/Más cerca…/.test(await texto(ev, '[data-juego=mas_cerca]')) && /Sigue por aquí\./.test(await texto(ev, '[data-juego=mas_cerca]')), `${destino}: C17 texto de Design`)
    await cap(a, `${destino}_c17_mas_cerca`)
    await ev("document.querySelector('[data-juego-boton=ahora-no]').click(); true")
    await a.esp(400)
    await poner(jugada('mas_cerca', 120))
    debe(!(await hay(ev, '[data-juego=mas_cerca]')), `${destino}: una vez por sitio y por día: tras «Ahora no», «Más cerca…» no vuelve`)
    await poner(jugada('brilla', 400))
    debe(!(await hay(ev, '[data-juego=brilla]')), `${destino}: «Algo brilla…» tampoco vuelve (ya salió hoy en este sitio)`)
    await poner(jugada('llegada', 0))
    await a.hasta("Boolean(document.querySelector('[data-juego=llegada]'))", { segundos: 10, lanzar: 'no sale la pantalla de llegada' })
    const tl = await texto(ev, '[data-juego=llegada]')
    debe(/¡Aquí se esconde un Emblema Oculto!/.test(tl) && /Hacer la foto/.test(tl), `${destino}: al llegar, la pantalla de siempre «¡Aquí se esconde un Emblema Oculto!»`)
    await cap(a, `${destino}_c16_llegada`)
    await clic(ev, '[data-juego-boton=ahora-no]')
    await a.esp(400)
    await poner(jugada('llegada', 0))
    debe(!(await hay(ev, '[data-juego=llegada]')), `${destino}: la pantalla de llegada sale una vez por sitio y por día`)
    const marcas = await ev("Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy1:juego:')).length")
    debe(marcas >= 3, `${destino}: lo que ya salió se apunta en el móvil (${marcas} marcas)`)
    // «Sugerencias del compañero» apagado: no sale nada de esto.
    await ev("localStorage.setItem('trazo:ajuste:sugerencias-companero', '0'); window.dispatchEvent(new Event('trazo:ajuste-sugerencias')); true")
    await a.esp(800)
    debe(!(await hay(ev, '[data-reto-del-dia]')) && !(await hay(ev, '[data-fuera-de-ruta]')) && !(await hay(ev, '[data-juego]')), `${destino}: con «Sugerencias del compañero» apagado no sale el reto, ni fuera de ruta, ni el juego`)
    await ev("localStorage.removeItem('trazo:ajuste:sugerencias-companero'); true")
    const botonesQuedan = await hay(ev, '[data-camara-viaje=boton]')
    debe(botonesQuedan, `${destino}: la cámara y Cerca de ti no dependen de ese ajuste`)
    void nombreDestino
    await a.cerrar()
  }

  if (!SOLO || SOLO === 'roma') await escenario('roma', '2026-10-17')
  if (!SOLO || SOLO === 'lanzarote') {
    // El viaje de Eric en Lanzarote: lunes 9 de noviembre (y el domingo 8 se mira en las capturas).
    await escenario('lanzarote', '2026-11-09')
  }

  // ── Sin pase: la cámara con candado, la hoja y [Ver el pase]
  if (!SOLO || SOLO === 'sinpase') {
    const e = await abrir({ destino: 'lanzarote', hoy: '2026-11-09', pase: 'sin' })
    const { a, ev } = e
    await irAHoy(e, '2026-11-09')
    debe(await hay(ev, '[data-camara-viaje=boton]'), 'sin pase: la cámara se ve SIEMPRE en HOY (también sin pase)')
    debe(await hay(ev, '[data-camara-viaje=candado-boton]'), 'sin pase: la cámara lleva su candado')
    debe((await ev("document.querySelector('[data-camara-viaje=boton]').getAttribute('data-modo')")) === 'sin_pase', 'sin pase: modo sin_pase')
    await cap(a, 'lanzarote_k1b_boton_sin_pase')
    await tocarCamara(e)
    const h = await texto(ev, '[data-camara-viaje=hoja]')
    debe(/Solo disponible con el\s*Pase Lanzarote/.test(h) && /Ver el pase/.test(h) && !/Abrir cámara/.test(h), 'sin pase: K1b «Solo disponible con el Pase Lanzarote» + [Ver el pase], sin [Abrir cámara]')
    await cap(a, 'lanzarote_k1b_hoja_sin_pase')
    debe(!(await hay(ev, '[data-visto=camara]')), 'sin pase: la cámara no se abre')
    await a.cerrar()
  }

  // ── Con pase, antes del viaje y después
  if (!SOLO || SOLO === 'antes') {
    const e = await abrir({ destino: 'lanzarote', hoy: '2026-11-01' })
    const { a, ev } = e
    await irAHoy(e, '2026-11-01')
    debe((await ev("document.querySelector('[data-camara-viaje=boton]').getAttribute('data-modo')")) === 'antes', 'antes del viaje: modo «antes»')
    await tocarCamara(e)
    const h = await texto(ev, '[data-camara-viaje=hoja]')
    debe(/Podrás usarla durante tu viaje, del 8 al 13 de noviembre/.test(h) && /Entendido/.test(h) && !/Abrir cámara/.test(h), 'antes del viaje: K1c «Podrás usarla durante tu viaje, del 8 al 13 de noviembre» + [Entendido]')
    await cap(a, 'lanzarote_k1c_antes')
    await clic(ev, '[data-camara-viaje=entendido]')
    await a.esp(300)
    debe(!(await hay(ev, '[data-camara-viaje=hoja]')) && !(await hay(ev, '[data-visto=camara]')), 'antes del viaje: [Entendido] cierra y no abre la cámara')
    // Después del viaje.
    await ev("(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '2026-11-20' }); return true })()")
    await a.esp(2500)
    const modoDespues = await ev("document.querySelector('[data-camara-viaje=boton]')?.getAttribute('data-modo')")
    debe(modoDespues === 'despues', `después del viaje: la cámara sigue en HOY (modo «${modoDespues}»)`)
    await cap(a, 'lanzarote_k1c_despues')
    await a.cerrar()
  }
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) {
  for (const f of fallos) console.log(' -', f)
  process.exitCode = 1
}
