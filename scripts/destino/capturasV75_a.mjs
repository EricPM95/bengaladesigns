// V75 (agente de los apartados 1 a 4): SOLO capturas (no es una prueba) en modo iPhone (390x844) de «+ Añadir una reserva», la hoja de las nueve casillas, el ferry/tren/otra, el bloque, borrar y «Vuelo» con la ida y con las dos.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV75_a.mjs roma|lanza [caso]
// Guarda docs/dias/V75_capturas/<id>_app.jpg (la app) y escribe docs/dias/V75_log_a_<modo>.json con el texto de cada pantalla.
// Casos de Roma: R1a R2 R3 R3b R3h R4 R6 R7a R7b D1. De Lanzarote (la API con DESTINOS_OCULTOS='-'): L_R2 L_R3 L_R6.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V75_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null
const lanza = MODO === 'lanza'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const log = {}
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await a.evaluar(`(async () => ${R}.getState().route ? true : false)()`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)

  const VUELOS = { arrivalFlightTime: '11:15', arrivalCodigo: 'VY 6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '08:35', arrivalPointId: lanza ? 'ace' : 'fco', departureFlightTime: '19:40', departureCodigo: 'VY 6103', departureCompania: 'Vueling', departurePointId: lanza ? 'ace' : 'fco', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '21:35' }
  const SOLO_IDA = Object.fromEntries(Object.entries(VUELOS).filter(([k]) => !k.startsWith('departure')))
  /** Pone el viaje (con las dos mitades del vuelo, solo la ida o ninguna), sin reservas, en RESERVAS; `gente`: viaje con más personas. */
  const montar = async ({ ruta = VUELOS, gente = false } = {}) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      const r = JSON.parse(window.__base)
      for (const k of ['arrivalFlightTime', 'arrivalCodigo', 'arrivalCompania', 'arrivalOtroPunto', 'arrivalOtraHora', 'departureFlightTime', 'departureCodigo', 'departureCompania', 'departureOtroPunto', 'departureOtraHora']) delete r[k]
      Object.assign(r, ${JSON.stringify(ruta)})
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
      const V = await import('/src/store/useViajeCompartido.ts')
      V.useViajeCompartido.getState().poner({ gente: ${gente ? "[{ id: 'p1', nombre: 'Eric', foto: null, esAdmin: true, esYo: true }, { id: 'p2', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' }, { id: 'p3', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' }]" : '[]'} })
      st.getState().setActiveDayId(null); st.getState().setMode('bookings')
      return true })()`)
    await a.esp(2500)
  }
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const poner = (sel, valor) =>
    a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  const hora = async (sel) => {
    await clic(sel)
    await a.esp(700)
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(500)
  }
  const sacar = async (id, sel = null) => {
    await a.esp(900)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector(${JSON.stringify(sel ?? '[role=dialog]')}) ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 1400)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 260))
  }
  const cerrarHoja = async () => {
    await a.evaluar("(() => { const b = document.querySelector('[role=dialog] button[aria-label=Cerrar]'); if (b) b.click(); return true })()")
    await a.esp(600)
  }
  const irA = async (sel) => {
    await a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: 'start' }); return Boolean(e) })()`)
    await a.esp(900)
  }
  const quiere = (id) => !SOLO || SOLO === id
  const p = lanza ? 'L_' : ''

  // Un ferry (Roma: «Napoli → Capri»; Lanzarote: «Órzola → La Graciosa»), un tren y una «otra».
  const ferry = lanza ? { compania: 'Fred. Olsen', origen: 'Órzola', destino: 'La Graciosa', hora: '10:00' } : { compania: 'Caremar', origen: 'Nápoles', destino: 'Capri', hora: '10:00' }

  await montar()
  if (!lanza && quiere('R1a')) {
    await sacar('R1a', 'body')
  }
  if (quiere('R2') || quiere(`${p}R2`)) {
    console.log('boton', await clic('[data-anadir-una-reserva]'))
    await a.esp(900)
    await sacar(`${p}R2`)
    await cerrarHoja()
  }
  // El ferry, hecho paso a paso (como lo haría el viajero).
  if (quiere('R3') || quiere('R3b') || quiere('R6') || quiere('D1') || quiere('L_R3') || quiere('L_R6') || quiere('R12')) {
    await clic('[data-anadir-una-reserva]')
    await a.esp(700)
    await clic('[data-casilla-anadir="ferry"]')
    await a.esp(1200)
    await poner('[data-extra-campo="compania"]', ferry.compania)
    await poner('[data-extra-campo="origen"]', ferry.origen)
    await poner('[data-extra-campo="destino"]', ferry.destino)
    await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
    await a.esp(300)
    await hora('[data-campo-de-hora="extra-ferry-hora"]')
    await hora('[data-campo-de-hora="extra-ferry-llegada"]')
    await poner('[data-extra-campo="localizador"]', 'K7M2QX')
    await poner('input[aria-label="Precio"], input[aria-label="¿Cuánto ha costado en total?"]', '50')
    await a.esp(500)
    if (quiere('R3') || quiere('L_R3')) await sacar(`${p}R3`)
    await a.evaluar("(() => { const e = document.querySelector('[data-hoja-reserva-extra]'); if (e) e.parentElement.scrollTop = 9999; return true })()")
    await sacar(`${p}R3_abajo`)
    console.log('guardar', await clic('[data-guardar-extra="ferry"]'))
    await a.esp(1500)
    await irA('[data-blk="extra-ferry"]')
    if (quiere('R6') || quiere('L_R6')) await sacar(`${p}R6`, 'body')
    if (!lanza && quiere('D1')) {
      await clic('[data-extra-tarjeta="ferry"] [data-papelera]')
      await a.esp(900)
      await sacar('D1')
      await clic('[data-boton-hoja="eliminar-cancelar"]')
      await a.esp(500)
    }
  }
  if (!lanza && (quiere('R3b') || quiere('R12'))) {
    // Un tren, en la misma lista (otro bloque debajo).
    await a.evaluar("window.__anadirReserva.getState().cerrar(); window.__anadirReserva.getState().abrirFormulario('tren'); true")
    await a.esp(1200)
    await poner('[data-extra-campo="compania"]', 'Italo')
    await poner('[data-extra-campo="origen"]', 'Roma Termini')
    await poner('[data-extra-campo="destino"]', 'Florencia')
    await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
    await hora('[data-campo-de-hora="extra-tren-hora"]')
    await poner('[data-extra-campo="coche"]', '5')
    await poner('[data-extra-campo="asiento"]', '12a')
    await sacar('R3b')
    await clic('[data-guardar-extra="tren"]')
    await a.esp(1200)
    // Otra.
    await a.evaluar("window.__anadirReserva.getState().abrirFormulario('otra'); true")
    await a.esp(1200)
    await poner('[data-extra-campo="nombre"]', 'Tour en kayak')
    await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
    await hora('[data-campo-de-hora="extra-otra-hora"]')
    await poner('[data-extra-campo="lugar"]', 'Playa de Famara')
    await sacar('R4')
    await clic('[data-guardar-extra="otra"]')
    await a.esp(1200)
    await irA('[data-otras-reservas]')
    await sacar('R12', 'body')
  }
  // R3h: el segundo paso en un viaje con más gente.
  if (!lanza && quiere('R3h')) {
    await montar({ gente: true })
    await a.evaluar("window.__anadirReserva.getState().abrirFormulario('ferry'); true")
    await a.esp(1200)
    await poner('[data-extra-campo="compania"]', 'Caremar')
    await poner('[data-extra-campo="origen"]', 'Nápoles')
    await poner('[data-extra-campo="destino"]', 'Capri')
    await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
    await hora('[data-campo-de-hora="extra-ferry-hora"]')
    await sacar('R3g')
    await clic('[data-siguiente-paso]')
    await a.esp(900)
    await clic('[data-cuenta-opcion="comun"]')
    await a.esp(500)
    await sacar('R3h')
    await cerrarHoja()
  }
  // R7: el vuelo con las dos mitades y con solo la ida.
  if (!lanza && quiere('R7a')) {
    await montar({ ruta: VUELOS })
    await clic('[data-anadir-una-reserva]')
    await a.esp(700)
    await clic('[data-casilla-anadir="vuelo"]')
    await a.esp(1000)
    await sacar('R7a')
    await cerrarHoja()
  }
  if (!lanza && quiere('R7b')) {
    await montar({ ruta: SOLO_IDA })
    await clic('[data-anadir-una-reserva]')
    await a.esp(700)
    await clic('[data-casilla-anadir="vuelo"]')
    await a.esp(1800)
    await sacar('R7b')
  }
  fs.writeFileSync(path.resolve(`docs/dias/V75_log_a_${MODO}.json`), JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
