// V62: SOLO capturas (no es una prueba) en modo iPhone (390x844) de la tarjeta de llegada de HOY. Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV62_llegada.mjs roma|lanza|design [caso]
// Guarda docs/dias/catalogo/_tmp/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo de Design) y escribe docs/dias/catalogo/_tmp/log_llegada_<modo>.json con el texto de cada pantalla.
// Casos de Roma: L1 L1b L2 L3a L3 L4 L4b L5 L5b datos. De Lanzarote (la API normal): L6 L7.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null

if (MODO === 'design') {
  for (const id of ['L1', 'L1b', 'L2', 'L3', 'L3a', 'L4', 'L4b', 'L5', 'L5b', 'L6', 'L7']) {
    if (SOLO && SOLO !== id) continue
    const js = `(() => {
      const tabl = [...document.querySelectorAll('div')].filter((d) => d.style && d.style.width === '390px' && d.firstElementChild && /^${id} · /.test((d.firstElementChild.textContent || '').trim()))[0]
      if (!tabl) return 'sin tablero'
      const grid = tabl.parentElement
      ;[...grid.children].forEach((c) => { if (c !== tabl) c.style.display = 'none' })
      grid.style.gridTemplateColumns = '390px'
      let p = grid.parentElement; p.style.padding = '0'; p.style.minHeight = '0'
      ;[...p.children].forEach((c) => { if (c !== grid) c.style.display = 'none' })
      tabl.style.padding = '8px'
      document.documentElement.style.background = '#E7DCC6'
      window.scrollTo(0, 0)
      return 'ok'
    })()`
    await capturarDesign('La llegada en HOY.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const B = "(await import('/src/store/useBilleteStore.ts')).useBilleteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const lanza = MODO === 'lanza'
const IDA = lanza ? '2026-11-08' : '2026-10-17'
// Un QR de mentira (un cuadro de módulos) como «código guardado»: solo para la captura.
const QR = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path fill="#111" d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM3 3h3v3H3zM15 3h3v3h-3zM3 15h3v3H3zM10 1h1v2h-1zM10 5h2v1h-2zM9 9h3v1H9zM13 10h2v2h-2zM17 12h3v1h-3zM10 14h2v3h-2zM14 15h3v1h-3zM18 17h2v3h-2zM13 18h3v2h-3z"/></svg>')}`

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

  /**
   * Pone el viaje con el vuelo de HOY (la misma reserva que RESERVAS: la ruta y el billete guardado), el día simulado y la hora, y abre HOY.
   * `medio`: 'avion' | 'tren' | 'coche'. `billete`: lo que hay guardado (terminal, asiento, localizador, código) o null.
   */
  const montar = async ({ min = 9 * 60, medio = 'avion', billete = null, pos = null, ruta = {}, coche = null }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${IDA}')
      const r = JSON.parse(window.__base)
      const ro = ${JSON.stringify(ruta)}
      Object.assign(r, ro)
      r.transportContext = { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option || {}), id: ${JSON.stringify(medio === 'tren' ? 'train' : medio === 'coche' ? 'car' : 'flight')} } }
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {}, rentalVehicleBooking: ${JSON.stringify(coche)} })
      const b = ${B}
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
      try { localStorage.removeItem('trazo:billete:v1:' + (tid ?? 'local')) } catch {}
      b.setState({ datos: {}, tripId: tid ?? null })
      ${billete ? `b.getState().poner(tid ?? null, 'arrival', { horaRoma: r.arrivalFlightTime, localizador: ${JSON.stringify(billete.localizador ?? null)}, terminal: ${JSON.stringify(billete.terminal ?? null)}, asiento: ${JSON.stringify(billete.asiento ?? null)}, coche: ${JSON.stringify(billete.coche ?? null)}, codigo: ${billete.qr ? `{ texto: 'M1', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(QR)} }` : 'null'}, dueno: null })` : ''}
      window.__pruebaDelPase = undefined
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      window.__horaFalsa = ${min}; window.__pos = ${pos ? JSON.stringify(pos) : 'null'}; window.__perm = ${pos ? "'granted'" : "'denied'"}
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3500)
  }
  const sacar = async (id, sel = null) => {
    if (!sel) await a.evaluar("(() => { const c = document.querySelector('[data-hoy-llegada-tarjeta]'); if (c) c.scrollIntoView({ block: 'start' }); return true })()");
    await a.esp(1500)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector('${sel ?? '[data-hoy-llegada-tarjeta]'}') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 1200)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 400))
  }
  const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true })()`)

  const VUELO = { arrivalFlightTime: '11:15', arrivalCodigo: 'VY6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '08:35', arrivalPointId: 'fco', accommodationAddress: 'Via del Quirinale 7, Roma' }
  const TREN = { arrivalFlightTime: '11:15', arrivalCodigo: '', arrivalCompania: 'Iryo', arrivalOtroPunto: 'Barcelona Sants', arrivalOtraHora: '08:35', arrivalPointId: 'termini', accommodationAddress: 'Via del Quirinale 7, Roma' }
  const BILLETE = { terminal: 'T1', asiento: '14C', localizador: 'K7M2QX', qr: true }
  const quiere = (id) => !SOLO || SOLO === id

  if (!lanza) {
    if (quiere('L1')) {
      await montar({ medio: 'avion', ruta: VUELO, billete: BILLETE })
      await sacar('L1')
    }
    if (quiere('L1b')) {
      await montar({ medio: 'avion', ruta: VUELO, billete: { terminal: 'T1', localizador: 'K7M2QX', qr: false } })
      await sacar('L1b')
    }
    if (quiere('L2')) {
      await montar({ medio: 'avion', ruta: VUELO, billete: BILLETE })
      console.log('He aterrizado', await clic('He aterrizado'))
      await sacar('L2')
    }
    if (quiere('L3a') || quiere('L3') || quiere('datos')) {
      await montar({ medio: 'avion', ruta: VUELO, billete: BILLETE })
      console.log('Vuelo retrasado', await clic('Vuelo retrasado'))
      await a.esp(1200)
      if (quiere('L3a')) await sacar('L3a', '[data-hoja-de-hora]')
      // La rueda: la hora a 12:00 (hora 12, minutos 00) y el ✓.
      await a.evaluar(`(() => { const cols = [...document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]')]; cols[0].scrollTop = 12 * 30; return cols.length })()`)
      await a.esp(900)
      await a.evaluar(`(() => { const cols = [...document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]')]; cols[1].scrollTop = 0; return 1 })()`)
      await a.esp(900)
      console.log('guardar', await a.evaluar("(() => { const b = document.querySelector('[data-hoja-de-hora-guardar]'); if (!b) return false; b.click(); return true })()"))
      await a.esp(3500)
      await a.captura(path.join(CAP, 'L3_hoja_reorganizar_app.jpg'))
      await clic('Dejarlo como está')
      await a.esp(800)
      if (quiere('L3')) await sacar('L3')
      log.L3_hoja = await a.evaluar("(document.querySelector('[role=dialog]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 600)")
      console.log('hoja tras guardar |', log.L3_hoja)
      if (quiere('datos')) {
        // Lo que dice RESERVAS: el mismo vuelo (la hora nueva, la compañía, la terminal…), y un cambio hecho allí (la terminal) que HOY recoge.
        await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Dejarlo como está|Ahora no/.test(x.textContent || '')); if (b) b.click(); return true })()")
        await a.esp(800)
        await ev(`${R}.getState().setMode('bookings')`)
        await a.esp(2500)
        await a.evaluar(`(() => { const e = [...document.querySelectorAll('*')].find((n) => n.children.length === 0 && (n.textContent || '').trim() === 'Falta la vuelta'); if (e) { e.click(); e.scrollIntoView({ block: 'start' }) } return Boolean(e) })()`)
        await a.esp(1500)
        await a.captura(path.join(CAP, 'datos_1_reservas_app.jpg'))
        log.datos_reservas = await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 1500)")
        await a.evaluar(`(async () => { const b = ${B}.getState(); const tid = b.tripId; const p = b.datos.arrival; b.poner(tid, 'arrival', { ...p, terminal: 'T2', asiento: '22F' }); return true })()`)
        await ev(`${R}.getState().setMode('today')`)
        await a.esp(3000)
        await a.captura(path.join(CAP, 'datos_2_hoy_app.jpg'))
        log.datos_hoy = await a.evaluar("(document.querySelector('[data-hoy-llegada-tarjeta]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 800)")
        console.log('datos hoy |', log.datos_hoy)
      }
    }
    if (quiere('L4') || quiere('L4b')) {
      await montar({ medio: 'tren', ruta: TREN, billete: { terminal: 'Sants', asiento: '12A', coche: '5', localizador: 'X7K2M', qr: true } })
      if (quiere('L4')) await sacar('L4')
      if (quiere('L4b')) {
        await clic('He llegado')
        await sacar('L4b')
      }
    }
    if (quiere('L5') || quiere('L5b')) {
      await montar({ medio: 'coche', ruta: { arrivalFlightTime: null, arrivalCodigo: null, arrivalCompania: null, arrivalOtroPunto: null, arrivalOtraHora: null, arrivalPointId: null, accommodationAddress: 'Via del Quirinale 7, Roma' } })
      if (quiere('L5')) await sacar('L5')
      if (quiere('L5b')) {
        await clic('He llegado')
        await sacar('L5b')
      }
    }
  } else {
    const LANZA = { arrivalFlightTime: '09:30', arrivalCodigo: 'VY3920', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '07:30', arrivalPointId: 'ace', accommodationAddress: 'Calle Las Palmeras 4, Costa Teguise' }
    const CICAR = { provider: 'Cicar', startDate: '2026-11-08', endDate: '2026-11-13', precio: null, codigo: 'CK-48213' }
    if (quiere('L6')) {
      await montar({ medio: 'avion', ruta: LANZA, billete: { terminal: 'T1', asiento: '14C', localizador: 'K7M2QX', qr: true }, coche: CICAR })
      await sacar('L6')
    }
    if (quiere('L7')) {
      await montar({ medio: 'avion', ruta: LANZA, billete: { terminal: 'T1', asiento: '14C', localizador: 'K7M2QX', qr: true }, coche: CICAR })
      await clic('He aterrizado')
      await sacar('L7')
    }
  }
  fs.writeFileSync(`docs/dias/catalogo/_tmp/log_llegada_${MODO}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
