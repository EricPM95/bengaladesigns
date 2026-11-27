// V76 (apartados 2 y 4): SOLO capturas (no es una prueba) en modo iPhone (390x844): vuelo con escala (RESERVAS, hoja y HOY) y tren unido a la llegada y a la vuelta (pregunta, RESERVAS y HOY). Un solo Chrome, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV76_b.mjs roma|lanza [caso]
// Guarda docs/dias/V76_capturas/<id>_<modo>_app.jpg y docs/dias/V76_log_b_<modo>.json. Casos: E1 (R8b) E2 (R8, la hoja) E3 E3b (HOY con escala) U1 (R11, la pregunta) U2 (R11c) U3 (R11a) U4 (R11b) U5 (la pregunta de la vuelta). Lanzarote (la API con DESTINOS_OCULTOS='-'): E1 E2 E3.
import fs from 'node:fs'
import path from 'node:path'
import { abrir, QR_AZUL, QR_NEGRO, QR_ROJO } from './_montajeV76_b.mjs'

const CAP = path.resolve('docs/dias/V76_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null
const lanza = MODO === 'lanza'
const quiere = (id) => !SOLO || SOLO === id
const { a, ev, clic, clicSel, poner, hora, montar, abrirLlegadaYVuelta, IDA, VUELTA } = await abrir(lanza)
const log = {}
const ESCALA_IDA = lanza
  ? { arrivalOtroPunto: 'Madrid (MAD)', arrivalOtraHora: '10:35', arrivalFlightTime: '13:05', arrivalEscalas: [{ compania: 'Iberia', codigo: 'IB 3921', salida: '07:50', llegada: '09:15', de: 'Barcelona (El Prat)', a: 'Madrid (MAD)' }] }
  : { arrivalOtroPunto: 'Madrid (MAD)', arrivalOtraHora: '11:00', arrivalFlightTime: '13:15', arrivalEscalas: [{ compania: 'Iberia', codigo: 'IB 3921', salida: '08:30', llegada: '09:45', de: 'Barcelona (El Prat)', a: 'Madrid (MAD)' }] }
const sacar = async (id, { sel, abajo = false } = {}) => {
  if (sel) await a.evaluar(`(() => { const c = document.querySelector(${JSON.stringify(sel)}); if (c) c.scrollIntoView({ block: '${abajo ? 'end' : 'start'}' }); return true })()`)
  await a.esp(1400)
  await a.captura(path.join(CAP, `${id}_${MODO}_app.jpg`))
  log[id] = await a.evaluar(`(document.querySelector(${JSON.stringify(sel ?? 'body')}) ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 1400)`)
  console.log('captura', id, '|', String(log[id]).slice(0, 420))
}
const TREN = (id, dateIso, time, llegada, desde, hasta, extra = {}) => ({ id, kind: 'tren', refId: id, name: `Tren a ${hasta}`, placeNames: [], dateIso, dayNumber: null, time, returnTime: llegada, meetingPoint: null, locator: null, precio: null, noMueve: true, compania: 'Leonardo Express', origen: desde, destinoDeViaje: hasta, coche: null, asiento: null, lugar: null, ...extra })

try {
  if (quiere('E1')) {
    await montar({ modo: 'bookings', ruta: ESCALA_IDA, billetes: [{ clave: 'escala:arrival:0', qr: QR_NEGRO }] })
    await abrirLlegadaYVuelta()
    await sacar('E1', { sel: '[data-blk="llegada"]' })
  }
  if (quiere('E2')) {
    await montar({ modo: 'bookings', ruta: ESCALA_IDA })
    await a.evaluar("(async () => { (await import('/src/store/useReservasFocusStore.ts')).useReservasFocusStore.getState().pedir('llegada', 'arrival'); return true })()")
    await a.esp(2000)
    await sacar('E2', { sel: '[data-escalas="ida"]' })
    await a.evaluar("(() => { const c = document.querySelector('[data-escalas=\"ida\"]'); c.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(600)
    await a.captura(path.join(CAP, `E2b_${MODO}_app.jpg`))
  }
  if (quiere('E3')) {
    await montar({ modo: 'today', dia: 'ida', min: 7 * 60 + 30, ruta: ESCALA_IDA, billetes: [{ clave: 'escala:arrival:0', qr: QR_AZUL }, { clave: 'arrival', qr: QR_ROJO }] })
    await sacar('E3', { sel: '[data-hoy-llegada-tarjeta]' })
  }
  if (quiere('E3b')) {
    await montar({ modo: 'today', dia: 'ida', min: 10 * 60, ruta: ESCALA_IDA, billetes: [{ clave: 'escala:arrival:0', qr: QR_AZUL }, { clave: 'arrival', qr: QR_ROJO }] })
    await sacar('E3b', { sel: '[data-hoy-llegada-tarjeta]' })
  }
  if (!lanza) {
    const T_IDA = TREN('res-tren-ida', IDA, '14:35', '15:10', 'Fiumicino', 'Roma Termini', { unidaALlegada: 'arrival' })
    const T_VUELTA = TREN('res-tren-vuelta', VUELTA, '14:35', '15:10', 'Roma Termini', 'Fiumicino', { unidaALlegada: 'departure' })
    if (quiere('U2')) {
      await montar({ modo: 'bookings', reservas: [T_IDA], billetes: [{ clave: 'res-tren-ida', qr: QR_NEGRO }] })
      await abrirLlegadaYVuelta()
      await sacar('U2', { sel: '[data-blk="llegada"]' })
    }
    if (quiere('U3')) {
      await montar({ modo: 'today', dia: 'ida', min: 9 * 60, reservas: [T_IDA], billetes: [{ clave: 'arrival', qr: QR_NEGRO }, { clave: 'res-tren-ida', qr: QR_AZUL }] })
      await sacar('U3', { sel: '[data-hoy-llegada-tarjeta]' })
    }
    if (quiere('U4')) {
      await montar({ modo: 'today', dia: 'vuelta', min: 10 * 60, reservas: [T_VUELTA], billetes: [{ clave: 'departure', qr: QR_NEGRO }, { clave: 'res-tren-vuelta', qr: QR_AZUL }] })
      await sacar('U4', { sel: '[data-hoy-vuelta-tarjeta]' })
    }
    for (const [id, dia] of [['U1', 'ida'], ['U5', 'vuelta']]) {
      if (!quiere(id)) continue
      await montar({ modo: 'bookings', dia })
      await a.evaluar("(async () => { (await import('/src/store/useAnadirReservaStore.ts')).useAnadirReservaStore.getState().abrirFormulario('tren'); return true })()")
      await a.esp(1300)
      await poner('[data-extra-campo="compania"]', 'Leonardo Express')
      await poner('[data-extra-campo="origen"]', dia === 'ida' ? 'Fiumicino' : 'Roma Termini')
      await poner('[data-extra-campo="destino"]', dia === 'ida' ? 'Roma Termini' : 'Fiumicino')
      const diaId = await ev(`(async () => { const r = ${'(await import(\'/src/store/useRouteStore.ts\')).useRouteStore'}.getState().route; return ${dia === 'ida' ? 'r.days[0].id' : "r.days.at(-1).id"} })()`)
      await clicSel(`[data-dia-cuadrado="${diaId}"]`)
      await a.esp(250)
      await hora('[data-campo-de-hora="extra-tren-hora"]')
      await clicSel('[data-guardar-extra="tren"]')
      await a.esp(1300)
      await sacar(id, { sel: '[data-hoja="unir-llegada"]' })
    }
  }
  fs.writeFileSync(`docs/dias/V76_log_b_${MODO}${SOLO ? '_' + SOLO : ''}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
