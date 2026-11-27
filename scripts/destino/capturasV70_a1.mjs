// V70 (apartado 1): SOLO capturas (no es una prueba) en modo iPhone (390x844) de la tarjeta de la vuelta de HOY. Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV70_a1.mjs roma|lanza|design [caso]
// Guarda docs/dias/V70_capturas/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo de Design) y escribe docs/dias/V70_log_a1_<modo>.json con el texto de cada pantalla.
// Casos de Roma: VL1 VL1b VL1c VL2 VL3 VL3gps VL4b VL4 VL5. De Lanzarote (la API normal): LZ1 LZ5.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V70_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null

if (MODO === 'design') {
  for (const id of ['VL1', 'VL1b', 'VL1c', 'VL2', 'VL3', 'VL4', 'VL4b', 'VL5']) {
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
    await capturarDesign('La vuelta en HOY.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const B = "(await import('/src/store/useBilleteStore.ts')).useBilleteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const lanza = MODO === 'lanza'
const VUELTA = lanza ? '2026-11-13' : '2026-10-20'
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
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, stops: d.stops.length })))`))

  /** El vuelo de vuelta como lo guarda el viajero en RESERVAS (la ruta + el billete guardado) y el día simulado a esa hora. `pos`: GPS; `salio`: minutos a los que «ya salió». */
  const montar = async ({ hora = '19:30', min = 10 * 60, billete = { terminal: 'T3', asiento: '12A', localizador: 'K7M2QX', qr: true }, pos = null, salio = null, ruta = {}, coche = null, paradas = 0 }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${VUELTA}')
      const r = JSON.parse(window.__base)
      Object.assign(r, ${JSON.stringify(ruta)})
      Object.assign(r, { departureFlightTime: '${hora}', departureFechaVista: '${VUELTA}', departureRetraso: null, departureCodigo: 'VY6105', departureCompania: 'Vueling', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '${lanza ? '22:05' : '21:45'}', departurePointId: '${lanza ? 'ace' : 'fco'}', arrivalFlightTime: '${lanza ? '08:25' : '11:15'}' })
      const dc = r.days.filter((d) => !d.isReturnLeg).at(-1); const dv = r.days.find((d) => d.isReturnLeg)
      if (dv) dv.stops = ${paradas} > 0 ? dc.stops.slice(0, ${paradas}).map((s, i) => ({ ...JSON.parse(JSON.stringify(s)), id: 'v70-' + i, time: ['09:30', '11:15'][i], durationMinutes: 60, checkedInAt: null, saltada: false })) : []
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {}, rentalVehicleBooking: ${JSON.stringify(coche)} })
      const m = await import('/src/lib/adaptarVuelos.ts'); const s0 = st.getState()
      const p = await m.propuestaDeVuelos(s0.route, s0.reservations)
      if (p) s0.ponerPlanes(p.planes)
      const b = ${B}
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
      try { localStorage.removeItem('trazo:billete:v1:' + (tid ?? 'local')) } catch {}
      b.setState({ datos: {}, tripId: tid ?? null })
      ${billete ? `b.getState().poner(tid ?? null, 'departure', { horaRoma: '${hora}', localizador: ${JSON.stringify(billete.localizador ?? null)}, terminal: ${JSON.stringify(billete.terminal ?? null)}, asiento: ${JSON.stringify(billete.asiento ?? null)}, coche: null, codigo: ${billete.qr ? `{ texto: 'M1', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(QR)} }` : 'null'}, dueno: null })` : ''}
      window.__pruebaDelPase = undefined
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      ${salio != null ? `try { localStorage.setItem('trazo:hoy:salio:' + st.getState().route.id + ':${VUELTA}', '${salio}') } catch {}` : ''}
      window.__horaFalsa = ${min}; window.__pos = ${pos ? JSON.stringify(pos) : 'null'}; window.__perm = ${pos ? "'granted'" : "'denied'"}
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(4500)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  const sacar = async (id, { sel = '[data-hoy-vuelta-tarjeta]', abajo = false } = {}) => {
    await a.evaluar(`(() => { const c = document.querySelector('${sel}'); if (c) c.scrollIntoView({ block: '${abajo ? 'end' : 'start'}' }); return true })()`)
    await a.esp(1500)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector('${sel}') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 1400)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 380))
  }
  const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true })()`)
  const quiere = (id) => !SOLO || SOLO === id

  if (!lanza) {
    if (quiere('VL1') || quiere('VL1c')) {
      await montar({ hora: '19:30', min: 10 * 60 })
      if (quiere('VL1')) await sacar('VL1')
      if (quiere('VL1c')) await sacar('VL1c', { sel: '[data-hoy-tiempo-libre]', abajo: true })
    }
    if (SOLO === 'AC') {
      await montar({ hora: '19:30', min: 10 * 60 })
      console.log('anadir cerca', await clic('Añadir algo cerca'))
      await a.esp(2500)
      await sacar('AC', { sel: '[data-vuelta-anadir-lista]' })
      console.log('elegir', await a.evaluar("(() => { const b = document.querySelector('[data-vuelta-anadir-elegir]'); if (!b) return false; b.click(); return true })()"))
      await a.esp(2000)
      await a.captura(path.join(CAP, 'AC_propuesta_app.jpg'))
      log.AC_propuesta = await a.evaluar("(document.querySelector('[role=dialog]') ?? document.body).innerText.replace(/\s+/g, ' ').slice(0, 600)")
      console.log(log.AC_propuesta)
    }
    if (quiere('VL1b')) {
      await montar({ hora: '19:30', min: 10 * 60, billete: { terminal: 'T3', localizador: 'K7M2QX', qr: false } })
      await sacar('VL1b')
    }
    if (quiere('VL2')) {
      await montar({ hora: '10:00', min: 6 * 60 + 30 })
      await sacar('VL2')
    }
    if (quiere('VL3')) {
      await montar({ hora: '19:30', min: 16 * 60 + 50, salio: 15 * 60 + 30 })
      await sacar('VL3')
    }
    if (SOLO === 'VL3gps') {
      await montar({ hora: '19:30', min: 16 * 60 + 40, pos: { lat: 41.8003, lng: 12.2389 } })
      await sacar('VL3gps')
    }
    if (quiere('VL5')) {
      await montar({ hora: '19:30', min: 16 * 60 + 30 })
      console.log('Salgo', await clic('Salgo hacia el aeropuerto'))
      await a.esp(800)
      await sacar('VL5')
    }
    if (quiere('VL4b') || quiere('VL4')) {
      await montar({ hora: '19:30', min: 10 * 60 })
      console.log('Vuelo retrasado', await clic('Vuelo retrasado'))
      await a.esp(1500)
      if (quiere('VL4b')) await sacar('VL4b', { sel: '[data-hoja-de-hora]' })
      if (quiere('VL4')) {
        console.log('columnas', await a.evaluar(`(() => { const cols = [...document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]')]; return JSON.stringify(cols.map((c) => ({ n: c.children.length, st: c.scrollTop, h: c.children[0]?.getBoundingClientRect().height }))) })()`))
        await a.evaluar(`(() => { const cols = [...document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]')]; cols[0].scrollTop = 20 * 30; return 1 })()`)
        await a.esp(900)
        await a.evaluar(`(() => { const cols = [...document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]')]; const n = cols[1].children.length; cols[1].scrollTop = Math.round(15 / (60 / n)) * 30; return 1 })()`)
        await a.esp(900)
        console.log('hoja', await a.evaluar("(document.querySelector('[data-hoja-de-hora]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 200)"))
        await a.evaluar("window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(String(e.message))); window.addEventListener('unhandledrejection', (e) => window.__errs.push('rej ' + String(e.reason && e.reason.stack || e.reason))); window.__sinRecarga = 1; true")
        console.log('guardar', await a.evaluar("(() => { const b = document.querySelector('[data-hoja-de-hora-guardar]'); if (!b) return false; b.click(); return true })()"))
        await a.esp(3500)
        console.log('errs', await a.evaluar('JSON.stringify({ e: window.__errs, ok: window.__sinRecarga })'))
        await a.captura(path.join(CAP, 'VL4_hoja_reorganizar_app.jpg'))
        log.VL4_hoja = await a.evaluar("(document.querySelector('[role=dialog]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 600)")
        console.log('hoja tras guardar |', log.VL4_hoja)
        await clic('Dejarlo como está')
        await clic('Ahora no')
        await a.esp(800)
        await sacar('VL4')
        log.VL4_ruta = await ev(`JSON.stringify({ dep: ${R}.getState().route.departureFlightTime, retraso: ${R}.getState().route.departureRetraso })`)
        console.log('ruta', log.VL4_ruta)
      }
    }
  } else {
    const CICAR = { provider: 'Cicar', startDate: '2026-11-08', endDate: '2026-11-13', precio: null, codigo: 'CK-48213' }
    if (quiere('LZ1')) {
      await montar({ hora: '19:40', min: 10 * 60, coche: CICAR })
      await sacar('LZ1')
    }
    if (quiere('LZ5')) {
      await montar({ hora: '19:40', min: 16 * 60, coche: CICAR })
      await clic('Salgo hacia el aeropuerto')
      await a.esp(800)
      await sacar('LZ5')
    }
  }
  fs.writeFileSync(`docs/dias/V70_log_a1_${MODO}${SOLO ? '_' + SOLO : ''}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
