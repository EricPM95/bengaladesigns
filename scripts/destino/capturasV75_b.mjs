// V75 (apartado 5, agente B): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/capturasV75_b.mjs roma|lanza
// Guarda docs/dias/V75_capturas/B_<modo>_<id>_app.jpg: los tres iconos (QR, lápiz, papelera) arriba a la derecha de cada tarjeta y la hoja de confirmar (D1). Al lado, R12_design.jpg y D1_design.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V75_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const lanza = MODO === 'lanza'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
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
  const ini = await ev(`${R}.getState().route.answers.dateRange.start`)
  const dia = (n) => {
    const d = new Date(ini + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + n)
    return d.toISOString().slice(0, 10)
  }
  const ALOJ = lanza
    ? { name: 'The Colors House', precio: { amount: 480, currency: 'EUR' }, reserva: { direccion: 'Calle Las Palmeras 4, Costa Teguise', entrada: dia(0), salida: dia(3), noches: 3, horaEntrada: '16:00', horaSalida: '11:00', telefono: '+34 928 000 000', localizador: 'COL-4821' } }
    : { name: 'Hotel Quirinale', precio: { amount: 250, currency: 'EUR' }, reserva: { direccion: 'Via Nazionale 20, 00184 Roma', entrada: dia(0), salida: dia(3), noches: 3, horaEntrada: '15:00', horaSalida: '11:00', localizador: 'HQ-3391' } }
  const VUELOS = lanza
    ? {}
    : { arrivalFlightTime: '11:15', arrivalCodigo: 'VY6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '08:35', arrivalPointId: 'fco', departureFlightTime: '19:40', departureCodigo: 'VY6103', departureCompania: 'Vueling', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '22:05', departurePointId: 'fco' }
  const RES_LANZA = `st.getState().setRentalVehicleBooking({ provider: 'Cicar', startDate: ${JSON.stringify(dia(0))}, endDate: ${JSON.stringify(dia(3))}, precio: { amount: 212, currency: 'EUR' }, coche: 'Fiat 500 o similar', lugarRecogida: 'Aeropuerto de Lanzarote', horaRecogida: '10:00', lugarDevolucion: 'Aeropuerto de Lanzarote', horaDevolucion: '15:30', codigo: 'CIC-48213' })
    st.getState().addReservation({ id: 'res-v75-ex', kind: 'excursion', refId: 'la_graciosa', name: 'La Graciosa', placeNames: [], dateIso: ${JSON.stringify(dia(2))}, dayNumber: null, time: '08:15', locator: 'GRC-4K7QX', excursionId: 'la_graciosa' }, null, null)
    st.getState().addReservation({ id: 'res-v75-en', kind: 'entrada', refId: 'Timanfaya', name: 'Timanfaya', placeNames: ['Timanfaya'], dateIso: ${JSON.stringify(dia(1))}, dayNumber: null, time: '10:00', precio: { amount: 18, currency: 'EUR' } }, null, null)`
  const RES_ROMA = `st.getState().addReservation({ id: 'res-v75-en', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo', placeNames: ['Coliseo'], dateIso: ${JSON.stringify(dia(1))}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null)
    st.getState().addReservation({ id: 'res-v75-ex', kind: 'excursion', refId: 'pompeya_sorrento', name: 'Excursión a Pompeya y Sorrento', placeNames: [], dateIso: ${JSON.stringify(dia(2))}, dayNumber: null, time: '07:30', excursionId: 'pompeya_sorrento', excursionData: null, precio: { amount: 98.26, currency: 'EUR' } }, null, null)`
  await a.evaluar(`(async () => {
    const st = ${R}
    const r = JSON.parse(JSON.stringify(st.getState().route))
    Object.assign(r, ${JSON.stringify(VUELOS)})
    const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
    st.setState({ route: r, screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: ${JSON.stringify(ALOJ)} } : {} })
    ${lanza ? RES_LANZA : RES_ROMA}
    st.getState().setActiveDayId(null)
    st.getState().setMode('bookings')
    return true })()`)
  await a.esp(3500)
  const abrir = (b) => a.evaluar(`(() => { const e = document.querySelector('[data-blk="${b}"]'); if (!e) return false; if (e.querySelectorAll('[data-tarjeta-crema],[data-mitad]').length === 0) (e.querySelector('[data-cabecera-clara],[data-llegada-cabecera]') ?? e.querySelector('button'))?.click(); return true })()`)
  const sacar = async (id, b) => {
    console.log('abrir', b, await abrir(b))
    await a.esp(1300)
    await a.evaluar(`(() => { const c = document.querySelector('[data-blk="${b}"]'); if (c) c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`)
    await a.esp(1200)
    await a.captura(path.join(CAP, `B_${MODO}_${id}_app.jpg`))
    log[id] = await a.evaluar(`JSON.stringify([...document.querySelectorAll('[data-blk="${b}"] [data-icono-documento], [data-blk="${b}"] [data-lapiz], [data-blk="${b}"] [data-papelera]')].map((x) => { const r = x.getBoundingClientRect(); return [x.dataset.iconoDocumento ? 'qr:' + x.dataset.iconoDocumento : x.dataset.lapiz ? 'lapiz:' + x.dataset.lapiz : 'papelera:' + x.dataset.papelera, Math.round(r.left), Math.round(r.top)] }))`)
    console.log(id, log[id])
  }
  const confirmar = async (id, sel) => {
    await a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); b?.scrollIntoView({ block: 'center' }); b?.click(); return !!b })()`)
    await a.esp(900)
    await a.captura(path.join(CAP, `B_${MODO}_${id}_app.jpg`))
    log[id] = await a.evaluar("(document.querySelector('[role=dialog]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 300)")
    console.log(id, log[id])
    await a.evaluar("(() => { document.querySelector('[data-boton-hoja=\"eliminar-cancelar\"]')?.click(); return true })()")
    await a.esp(500)
  }
  if (!lanza) {
    await sacar('vuelo', 'llegada')
    await confirmar('D1_vuelo', '[data-mitad="arrival"] [data-papelera]')
  }
  await sacar('aloj', 'aloj')
  await confirmar('D1_aloj', '[data-blk="aloj"] [data-papelera="alojamiento"]')
  await sacar('entradas', 'entradas')
  await confirmar('D1_entrada', '[data-blk="entradas"] [data-papelera="entrada"]')
  await sacar('excursiones', 'excursiones')
  await confirmar('D1_excursion', '[data-blk="excursiones"] [data-papelera="excursion"]')
  if (lanza) {
    await sacar('coche', 'coche')
    await confirmar('D1_coche', '[data-blk="coche"] [data-papelera="coche"]')
  }
} finally {
  fs.writeFileSync(path.resolve(`docs/dias/V75_log_b_${MODO}.json`), JSON.stringify(log, null, 1))
  a.cerrar()
}
