// V64 (apartados 4-7): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV64_b.mjs roma|lanza|design [caso]
// Casos de Roma: LV (Llegada y vuelta), LV2 (con la vuelta sin poner), D5a (alojamiento con 3 noches), D6 (hoja de zona), PAP (la papelera). De Lanzarote (API con DESTINOS_OCULTOS='-'): LZ (alojamiento y zona).
// Guarda docs/dias/catalogo/_tmp/<id>_app.jpg y <id>_design.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null
const quiere = (id) => !SOLO || SOLO === id

if (MODO === 'design') {
  // Cada dibujo, el trozo que toca: se esconde lo demás y se deja la página a un ancho de móvil.
  const dibujos = {
    LV: ['Reservas Billete.dc.html', 'window.scrollTo(0, 0)'],
    D5a: ['Añadir un documento.dc.html', `(() => { const t = [...document.querySelectorAll('span')].find((s) => (s.textContent || '').trim() === 'DATOS DEL ALOJAMIENTO'); if (t) t.scrollIntoView({ block: 'center' }); return !!t })()`],
    D6: ['Añadir un documento.dc.html', `(() => { const t = [...document.querySelectorAll('span')].find((s) => (s.textContent || '').trim() === 'Tu alojamiento está en Monti'); if (t) t.scrollIntoView({ block: 'center' }); return !!t })()`],
  }
  for (const [id, [pieza, js]] of Object.entries(dibujos)) {
    if (!quiere(id)) continue
    await capturarDesign(pieza, path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 1500, alto: 1100 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const B = "(await import('/src/store/useBilleteStore.ts')).useBilleteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const lanza = MODO === 'lanza'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)

  /** Monta RESERVAS con lo que se pide: la ruta (campos de vuelo), el alojamiento (con su reserva) y la zona; abre el modo RESERVAS. */
  const montar = async ({ ruta = {}, aloj = null, zona = null, punto = null }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      const r = JSON.parse(window.__base)
      Object.assign(r, ${JSON.stringify(ruta)})
      if (${JSON.stringify(zona)}) r.accommodationZone = ${JSON.stringify(zona)}
      if (${JSON.stringify(punto)}) { r.accommodationPoint = ${JSON.stringify(punto)}; r.accommodationAddress = ${JSON.stringify(punto?.direccion ?? null)} }
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg && ${JSON.stringify(aloj)} ? { [seg.segmentDayId]: ${JSON.stringify(aloj)} } : {} })
      const b = ${B}
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
      try { localStorage.removeItem('trazo:billete:v1:' + (tid ?? 'local')) } catch {}
      b.setState({ datos: {}, tripId: tid ?? null })
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(3500)
  }
  const abrirBloque = (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; (e.querySelector('button, [role=button]') ?? e.firstElementChild ?? e).click(); return true })()`)
  const sacar = async (id, sel) => {
    await a.evaluar(`(() => { const c = document.querySelector(${JSON.stringify(sel)}); if (c) c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`)
    await a.esp(1500)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector(${JSON.stringify(sel)}) ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 900)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 500))
  }

  const VUELO_IDA = { arrivalFlightTime: '11:15', arrivalCodigo: 'VY6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '08:35', arrivalPointId: 'fco' }
  const VUELO_VUELTA = { departureFlightTime: '19:40', departureCodigo: 'VY6103', departureCompania: 'Vueling', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '22:05', departurePointId: 'fco' }
  const PRECIO = { arrivalPrecio: { amount: 180, currency: 'EUR' } }

  if (!lanza) {
    if (quiere('LV')) {
      // Los dos vuelos, el precio y [Buscar vuelos] no sale (no falta ninguno).
      await montar({ ruta: { ...VUELO_IDA, ...VUELO_VUELTA, ...PRECIO } })
      console.log('abrir llegada', await abrirBloque('[data-llegada-cabecera]'))
      await a.esp(900)
      await sacar('LV', '[data-blk="llegada"]')
    }
    if (quiere('LV2')) {
      // Solo la ida: «+ Falta añadir la vuelta», el precio y, abajo del todo, [Buscar vuelos].
      await montar({ ruta: { ...VUELO_IDA, departureFlightTime: null, departureCodigo: null, departureCompania: null, departureOtroPunto: null, departureOtraHora: null, departurePointId: null, ...PRECIO } })
      console.log('abrir llegada', await abrirBloque('[data-llegada-cabecera]'))
      await a.esp(900)
      await sacar('LV2', '[data-blk="llegada"]')
      log.LV2_orden = await a.evaluar(`(() => { const b = document.querySelector('[data-blk="llegada"]'); const q = (s) => b.querySelector(s)?.getBoundingClientRect().top ?? null; return JSON.stringify({ ida: q('[data-mitad="arrival"]'), vuelta: q('[data-mitad="departure"]'), precio: q('[data-precio-vuelo]'), buscar: q('[data-buscar-vuelos]'), anadirDerecha: [...b.querySelectorAll('button')].some((x) => (x.textContent || '').trim() === 'Añadir') }) })()`)
      console.log('orden', log.LV2_orden)
    }
    const ALOJ = { name: 'Hotel Quirinale', precio: { amount: 250, currency: 'EUR' }, reserva: { direccion: 'Via Nazionale 20, 00184 Roma', entrada: '2026-11-24', salida: '2026-11-27', noches: 2, horaEntrada: '15:00', horaSalida: '11:00', telefono: '+39 06 1234 5678', localizador: null } }
    const PUNTO = { lat: 41.9006, lng: 12.4934, direccion: 'Via Nazionale, 20, 00184 Roma' }
    if (quiere('D5a')) {
      await montar({ aloj: ALOJ, zona: 'plaza_de_espana', punto: PUNTO })
      console.log('abrir aloj', await abrirBloque('[data-aloj-cabecera]'))
      await a.esp(1200)
      await sacar('D5a', '[data-blk="aloj"]')
      log.D5a_noches = await a.evaluar(`document.querySelector('[data-caja-noches]')?.innerText.replace(/\\s+/g, ' ') ?? null`)
      console.log('noches', log.D5a_noches)
      // Sin reserva ni precio: las cajas que faltan no salen.
      await montar({ aloj: { name: 'Hotel Quirinale', precio: null }, zona: 'plaza_de_espana', punto: PUNTO })
      await abrirBloque('[data-aloj-cabecera]')
      await a.esp(1200)
      await sacar('D5a_sin', '[data-blk="aloj"]')
    }
    if (quiere('D6')) {
      await montar({ aloj: ALOJ, zona: 'plaza_de_espana', punto: PUNTO })
      await abrirBloque('[data-aloj-cabecera]')
      await a.esp(1500)
      // Se guarda una dirección de Monti: la hoja pregunta.
      log.D6_a = await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); await m.revisarLaZonaDelAlojamiento({ direccion: 'Via Nazionale, 20, 00184 Roma', punto: { lat: 41.8954, lng: 12.4931 } }); return JSON.stringify(m.useZonaDelAlojamientoUi.getState().pregunta?.zonaNueva?.id ?? null) })()`)
      await a.esp(1200)
      await a.captura(path.join(CAP, 'D6_app.jpg'))
      log.D6_texto = await a.evaluar("(document.querySelector('[role=dialog]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 500)")
      console.log('D6', log.D6_a, '|', log.D6_texto)
      // [Dejarlo como está]: se cierra y no vuelve a preguntar lo mismo.
      await a.evaluar("(() => { const b = document.querySelector('[data-boton-hoja=\"zona-dejar\"]'); if (b) b.click(); return !!b })()")
      await a.esp(600)
      log.D6_otra_vez = await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); await m.revisarLaZonaDelAlojamiento({ direccion: 'Via Nazionale, 20, 00184 Roma', punto: { lat: 41.8954, lng: 12.4931 } }); return JSON.stringify(m.useZonaDelAlojamientoUi.getState().pregunta?.zonaNueva?.id ?? null) })()`)
      console.log('tras Dejarlo, de nuevo:', log.D6_otra_vez)
      // Una dirección que cae en la zona elegida, y una lejos de todo (el aeropuerto): no preguntan.
      log.D6_misma = await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); await m.revisarLaZonaDelAlojamiento({ direccion: 'Piazza di Spagna, Roma', punto: { lat: 41.9058, lng: 12.4823 } }); return JSON.stringify(m.useZonaDelAlojamientoUi.getState().pregunta?.zonaNueva?.id ?? null) })()`)
      log.D6_lejos = await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); await m.revisarLaZonaDelAlojamiento({ direccion: 'Fiumicino', punto: { lat: 41.8003, lng: 12.2389 } }); return JSON.stringify(m.useZonaDelAlojamientoUi.getState().pregunta?.zonaNueva?.id ?? null) })()`)
      console.log('misma zona:', log.D6_misma, '| lejos de todo:', log.D6_lejos)
      // Sin punto: se busca la dirección escrita (una búsqueda de Photon al guardar).
      log.D6_sin_punto = await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); await m.revisarLaZonaDelAlojamiento({ direccion: 'Via Cavour 100, Roma' }); return JSON.stringify(m.useZonaDelAlojamientoUi.getState().pregunta?.zonaNueva?.id ?? null) })()`)
      console.log('sin punto (Via Cavour 100):', log.D6_sin_punto)
      // [Cambiar a Monti]: la zona pasa a Monti.
      await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); m.useZonaDelAlojamientoUi.getState().poner(null); await m.revisarLaZonaDelAlojamiento({ direccion: 'Via del Colosseo 2, Roma', punto: { lat: 41.8954, lng: 12.4931 } }); return true })()`)
      await a.esp(800)
      await a.evaluar("(() => { const b = document.querySelector('[data-boton-hoja=\"zona-cambiar\"]'); if (b) b.click(); return !!b })()")
      await a.esp(2500)
      log.D6_zona = await ev(`${R}.getState().route.accommodationZone`)
      console.log('zona tras Cambiar:', log.D6_zona, '| toast:', await a.evaluar("(document.querySelector('[data-aviso-sobre-la-barra]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 200)"))
    }
    if (quiere('PAP')) {
      await montar({ aloj: ALOJ, zona: 'plaza_de_espana', punto: PUNTO, ruta: { ...VUELO_IDA, ...VUELO_VUELTA, ...PRECIO } })
      await abrirBloque('[data-aloj-cabecera]')
      await a.esp(1200)
      log.PAP = await a.evaluar(`JSON.stringify([...document.querySelectorAll('[data-papelera]')].map((p) => { const t = p.closest('[data-tarjeta-crema], [data-mitad]'); const r = p.getBoundingClientRect(); const c = t?.getBoundingClientRect(); return { papelera: p.getAttribute('data-papelera'), alto: Math.round(r.height), abajo: c ? Math.round(c.bottom - r.bottom) : null, derecha: c ? Math.round(c.right - r.right) : null } }))`)
      console.log('papeleras', log.PAP)
      await sacar('PAP', '[data-blk="aloj"]')
      await a.evaluar("(() => { const p = document.querySelector('[data-papelera=alojamiento]'); if (p) p.scrollIntoView({ block: 'center' }); return Boolean(p) })()")
      await a.esp(1200)
      await a.captura(path.join(CAP, 'PAP_papelera_app.jpg'))
      console.log('papelera', await a.evaluar("(() => { const p = document.querySelector('[data-papelera=alojamiento]'); if (!p) return false; p.click(); return true })()"))
      await a.esp(1200)
      await a.captura(path.join(CAP, 'PAP_aviso_app.jpg'))
    }
  } else {
    // Lanzarote: el alojamiento en coche, con su zona y la hoja de zona.
    const ALOJ = { name: 'The Colors House', precio: { amount: 480, currency: 'EUR' }, reserva: { direccion: 'Calle Las Palmeras 4, Costa Teguise', entrada: '2026-11-08', salida: '2026-11-11', noches: 2, horaEntrada: '16:00', horaSalida: '11:00', telefono: '+34 928 123 456', localizador: null } }
    const PUNTO = { lat: 28.9985, lng: -13.4952, direccion: 'Avenida Islas Canarias, Costa Teguise' }
    await montar({ aloj: ALOJ, zona: 'arrecife', punto: PUNTO })
    await abrirBloque('[data-aloj-cabecera]')
    await a.esp(1500)
    await sacar('LZ', '[data-blk="aloj"]')
    log.LZ_a = await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); await m.revisarLaZonaDelAlojamiento({ direccion: ${JSON.stringify(PUNTO.direccion)}, punto: ${JSON.stringify(PUNTO)} }); return JSON.stringify(m.useZonaDelAlojamientoUi.getState().pregunta?.zonaNueva ?? null) })()`)
    await a.esp(1200)
    await a.captura(path.join(CAP, 'LZ_hoja_app.jpg'))
    console.log('Lanzarote (elegida Arrecife, dirección en Costa Teguise):', log.LZ_a, '|', await a.evaluar("(document.querySelector('[role=dialog]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 400)"))
    log.LZ_lejos = await a.evaluar(`(async () => { const m = await import('/src/lib/zonaDelAlojamiento.ts'); m.useZonaDelAlojamientoUi.getState().poner(null); await m.revisarLaZonaDelAlojamiento({ direccion: 'Mar', punto: { lat: 28.5, lng: -14.2 } }); return JSON.stringify(m.useZonaDelAlojamientoUi.getState().pregunta?.zonaNueva?.id ?? null) })()`)
    console.log('Lanzarote, punto lejos de todo:', log.LZ_lejos)
  }
} finally {
  fs.writeFileSync(path.resolve(`docs/dias/catalogo/_tmp/log_alojpap_b_${MODO}.json`), JSON.stringify(log, null, 1))
  a.cerrar()
}
