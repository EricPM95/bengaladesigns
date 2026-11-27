// V64 (agente de los apartados 1 a 3): SOLO capturas (no es una prueba) en modo iPhone (390x844) de «añadir un documento», «Revisa los datos», la línea naranja y las tarjetas del vuelo y del tren en RESERVAS. Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV64_a1.mjs roma|lanza|design [caso]
// Guarda docs/dias/catalogo/_tmp/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo de Design) y escribe docs/dias/catalogo/_tmp/log_doc_a1_<modo>.json con el texto de cada pantalla.
// Casos de Roma: D1_vuelo D1_tren D1_entrada D2 D3 D5 B1 B2 B3 hoy. De Lanzarote (la API normal): L_D1 L_B1.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null

if (MODO === 'design') {
  const aislar = (id) => `(() => {
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
  const hechos = [
    ['Añadir un documento.dc.html', 'D1', 'D1_vuelo'],
    ['Añadir un documento.dc.html', 'D4a', 'D1_tren'],
    ['Añadir un documento.dc.html', 'D4b', 'D1_entrada'],
    ['Añadir un documento.dc.html', 'D2', 'D2'],
    ['Añadir un documento.dc.html', 'D3', 'D3'],
    ['Billete Datos.dc.html', 'B1', 'B1'],
    ['Billete Datos.dc.html', 'B2', 'B2'],
    ['Billete Datos.dc.html', 'B3', 'B3'],
  ]
  for (const [pieza, id, nombre] of hechos) {
    if (SOLO && SOLO !== nombre) continue
    await capturarDesign(pieza, path.join(CAP, `${nombre}_design.jpg`), { despues: aislar(id), ancho: 390, alto: 900 })
    console.log('design', nombre)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const B = "(await import('/src/store/useBilleteStore.ts')).useBilleteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const lanza = MODO === 'lanza'
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

  /** Pone el viaje con el vuelo (o el tren), el billete guardado (o no) y abre RESERVAS con «Llegada y vuelta» desplegado. */
  const montar = async ({ medio = 'avion', billete = null, ruta = {}, entrada = false, hoy = false }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      const r = JSON.parse(window.__base)
      ${hoy ? "st.getState().setDevSimulatedTodayIso(r.answers.dateRange.start); window.__horaFalsa = 540; window.__pos = null; window.__perm = 'denied'" : ''}
      Object.assign(r, ${JSON.stringify(ruta)})
      r.transportContext = { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option || {}), id: ${JSON.stringify(medio === 'tren' ? 'train' : 'flight')} } }
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
      const b = ${B}
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
      try { localStorage.removeItem('trazo:billete:v1:' + (tid ?? 'local')); Object.keys(localStorage).filter((k) => k.startsWith('jutrip:aviso-documento:')).forEach((k) => localStorage.removeItem(k)) } catch {}
      b.setState({ datos: {}, tripId: tid ?? null })
      ${billete ? `b.getState().poner(tid ?? null, 'arrival', { horaRoma: r.arrivalFlightTime, localizador: ${JSON.stringify(billete.localizador ?? null)}, terminal: ${JSON.stringify(billete.terminal ?? null)}, asiento: ${JSON.stringify(billete.asiento ?? null)}, coche: ${JSON.stringify(billete.coche ?? null)}, codigo: ${billete.qr ? `{ texto: 'M1', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(QR)} }` : 'null'}, codigoFuera: ${JSON.stringify(billete.codigoFuera ?? null)}, dueno: null })` : ''}
      ${entrada ? `{
        const d = r.days.find((x) => !x.isReturnLeg && x.stops?.length) ?? r.days[0]
        const s = d.stops.find((p) => p.name && !p.isFreeTour && !p.isBreak) ?? d.stops[0]
        const B2 = await import('/src/lib/bookings.ts')
        st.getState().addReservation({ id: 'res-v64', kind: 'entrada', refId: s.name, name: s.name, placeNames: [s.name], dateIso: B2.dateOfDay(r, d), dayNumber: null, time: '09:15', precio: { amount: 25, currency: 'EUR' } }, null, null)
      }` : ''}
      st.getState().setActiveDayId(null); st.getState().setMode(${hoy ? "'explore'" : "'bookings'"})
      return true })()`)
    await a.esp(2500)
  }
  const abrirLlegada = async () => {
    await a.evaluar("(() => { if (!document.querySelector('[data-mitad]')) { const c = document.querySelector('[data-llegada-cabecera], [data-llegada-vacia]'); if (c) c.click() } return true })()")
    await a.esp(1500)
  }
  const irA = async (sel) => {
    await a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); return Boolean(e) })()`)
    await a.esp(900)
  }
  const sacar = async (id, sel = null) => {
    await a.esp(900)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector(${JSON.stringify(sel ?? '[role=dialog]')}) ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 1400)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 300))
  }
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const cerrarHoja = async () => {
    await a.evaluar("(() => { const b = document.querySelector('[role=dialog] button[aria-label=Cerrar]'); if (b) b.click(); return true })()")
    await a.esp(600)
  }
  const quiere = (id) => !SOLO || SOLO === id

  const VUELO = { arrivalFlightTime: '11:15', arrivalCodigo: 'VY 6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '08:35', arrivalPointId: 'fco', departureFlightTime: '19:40', departureCodigo: 'VY 6103', departureCompania: 'Vueling', departurePointId: 'fco', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '21:35' }
  const VUELO_SIN = { ...VUELO, arrivalCompania: '' }
  const TREN = { arrivalFlightTime: '11:15', arrivalCodigo: '6171', arrivalCompania: 'Iryo', arrivalOtroPunto: 'Barcelona Sants', arrivalOtraHora: '08:35', arrivalPointId: 'termini', departureFlightTime: '19:00', departurePointId: 'termini' }
  const COMPLETO = { terminal: '1', asiento: '14C', localizador: 'K7M2QX', qr: true, codigoFuera: 'BCN' }

  if (!lanza) {
    if (quiere('D1_vuelo') || quiere('D2')) {
      await montar({ medio: 'avion', ruta: VUELO_SIN })
      await abrirLlegada()
      await irA('[data-mitad="arrival"]')
      if (quiere('D1_vuelo')) {
        console.log('boton', await clic('[data-anadir-doc="vuelo-arrival"]'))
        await a.esp(900)
        await sacar('D1_vuelo')
        await cerrarHoja()
      }
      if (quiere('D2')) {
        console.log('boton', await clic('[data-anadir-doc="vuelo-arrival"]'))
        await a.esp(900)
        console.log('escribir', await clic('[data-anadir-doc-escribir]'))
        await a.esp(1200)
        await sacar('D2')
        await cerrarHoja()
      }
    }
    if (quiere('D3')) {
      await montar({ medio: 'avion', ruta: VUELO_SIN })
      await abrirLlegada()
      await irA('[data-mitad="arrival"]')
      // La lectura de mentira: se cambia `fetch` SOLO para /api/read-ticket (ningún servicio externo) y se «sube» una imagen en blanco.
      const fecha = await ev(`${R}.getState().route.answers.dateRange.start`)
      await a.evaluar(`(() => {
        const original = window.fetch
        window.fetch = (u, o) => String(u).includes('/api/read-ticket')
          ? Promise.resolve(new Response(JSON.stringify({ modo: 'avion', numero: 'VY 6102', compania: null, localizador: 'K7M2QX', fecha: ${JSON.stringify(fecha)}, fecha_llegada: null, hora_salida: '08:35', hora_llegada: '11:15', origen: { ciudad: 'Barcelona', codigo: 'BCN', nombre: 'Barcelona-El Prat', terminal: '1', puerta: null }, destino: { ciudad: 'Roma', codigo: 'FCO', nombre: 'Fiumicino', terminal: null, puerta: null }, asiento: '14C', coche: null, codigo_caja: null }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
          : original(u, o)
        return true
      })()`)
      console.log('boton', await clic('[data-anadir-doc="vuelo-arrival"]'))
      await a.esp(900)
      await cerrarHoja()
      // El botón [Subir] de la hoja no se toca: el archivo se pone directo en el selector (el selector del iPhone no se puede manejar desde aquí).
      await a.evaluar(`(async () => {
        const c = document.createElement('canvas'); c.width = 300; c.height = 200
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 300, 200)
        const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg'))
        const dt = new DataTransfer(); dt.items.add(new File([blob], 'tarjeta.jpg', { type: 'image/jpeg' }))
        const inp = document.querySelector('input[data-billete-archivo]'); inp.files = dt.files
        inp.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      })()`)
      for (let i = 0; i < 30 && !(await a.evaluar("Boolean(document.querySelector('[data-hoja-titulo=\"revisa-los-datos\"]'))")); i++) await a.esp(500)
      await a.esp(800)
      await sacar('D3')
      // Guardar: la tarjeta queda con el código y las cajas.
      console.log('guardar', await clic('[data-datos-billete-guardar]'))
      await a.esp(1500)
      await irA('[data-mitad="arrival"]')
      await a.captura(path.join(CAP, 'D3_despues_app.jpg'))
      log.D3_despues = await a.evaluar("(document.querySelector('[data-mitad=\"arrival\"]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 600)")
      console.log('D3 despues |', log.D3_despues)
    }
    if (quiere('B1') || quiere('B2') || quiere('D5')) {
      await montar({ medio: 'avion', ruta: VUELO, billete: COMPLETO })
      await abrirLlegada()
      await irA('[data-mitad="arrival"]')
      if (quiere('B1')) await sacar('B1', '[data-mitad="arrival"]')
      if (quiere('D5')) {
        const tid = await ev("(await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId")
        await a.evaluar(`(async () => { (await import('/src/lib/avisoDeDocumento.ts')).ponerAvisoDeDocumento(${JSON.stringify(tid ?? null)}, 'arrival', 'Esta tarjeta de embarque es del viernes 13 y tu vuelo es el martes 24. Revisa que sea la buena'); return true })()`)
        await a.esp(1000)
        await irA('[data-aviso-documento]')
        await sacar('D5', '[data-aviso-documento]')
        console.log('cambiar', await clic('[data-aviso-documento-cambiar]'))
        await a.esp(900)
        await sacar('D5_cambiar')
        await cerrarHoja()
      }
      if (quiere('B2')) {
        await montar({ medio: 'avion', ruta: VUELO, billete: { ...COMPLETO, terminal: null, asiento: null } })
        await abrirLlegada()
        await irA('[data-mitad="arrival"]')
        await sacar('B2', '[data-mitad="arrival"]')
      }
    }
    if (quiere('B3') || quiere('D1_tren')) {
      await montar({ medio: 'tren', ruta: TREN, billete: quiere('B3') ? { terminal: null, asiento: '12A', coche: '5', localizador: 'X7K2M', qr: true } : null })
      await abrirLlegada()
      await irA('[data-mitad="arrival"]')
      if (quiere('B3')) await sacar('B3', '[data-mitad="arrival"]')
      if (quiere('D1_tren')) {
        await montar({ medio: 'tren', ruta: TREN })
        await abrirLlegada()
        await irA('[data-mitad="arrival"]')
        console.log('boton', await clic('[data-anadir-doc="vuelo-arrival"]'))
        await a.esp(900)
        await sacar('D1_tren')
        await cerrarHoja()
      }
    }
    if (quiere('D1_entrada')) {
      await montar({ medio: 'avion', ruta: VUELO, entrada: true })
      await a.evaluar("(() => { const b = document.querySelector('[data-blk=\"entradas\"]'); if (b && b.querySelectorAll('[data-tarjeta-crema]').length === 0) (b.querySelector('[data-cabecera-clara]') ?? b.querySelector('button'))?.click(); return true })()")
      await a.esp(1500)
      console.log('bloques', await a.evaluar("JSON.stringify([...document.querySelectorAll('[data-blk]')].map((b) => [b.getAttribute('data-blk'), b.children.length, b.querySelectorAll('button').length]))"))
      console.log('botones', await a.evaluar("JSON.stringify([...document.querySelectorAll('[data-anadir-doc]')].map((b) => b.getAttribute('data-anadir-doc')))"), await a.evaluar("document.querySelectorAll('[data-tarjeta-crema]').length"))
      await irA('[data-anadir-doc="entrada-sin-codigo"]')
      console.log('boton', await clic('[data-anadir-doc="entrada-sin-codigo"]'))
      await a.esp(900)
      await sacar('D1_entrada')
      await cerrarHoja()
    }
    if (quiere('hoy')) {
      await montar({ medio: 'avion', ruta: VUELO, hoy: true })
      await a.esp(700)
      await ev(`${R}.getState().setMode('today')`)
      await a.esp(3500)
      console.log('modo', await ev(`${R}.getState().mode`))
      await a.evaluar("(() => { const c = document.querySelector('[data-hoy-llegada-tarjeta]'); if (c) c.scrollIntoView({ block: 'start' }); return Boolean(c) })()")
      await a.esp(800)
      console.log('qr gris', await clic('[data-icono-documento="falta"]'))
      await a.esp(1000)
      await sacar('HOY_qr_gris')
    }
  } else {
    const LANZA = { arrivalFlightTime: '09:30', arrivalCodigo: 'VY 3920', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '07:30', arrivalPointId: 'ace', departureFlightTime: '19:50', departureCodigo: 'VY 3921', departureCompania: 'Vueling', departurePointId: 'ace', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '22:00' }
    if (quiere('L_D1')) {
      await montar({ medio: 'avion', ruta: { ...LANZA, arrivalCompania: '' } })
      await abrirLlegada()
      await irA('[data-mitad="arrival"]')
      console.log('boton', await clic('[data-anadir-doc="vuelo-arrival"]'))
      await a.esp(900)
      await sacar('L_D1')
      await cerrarHoja()
    }
    if (quiere('L_B1')) {
      await montar({ medio: 'avion', ruta: LANZA, billete: { terminal: '1', asiento: '14C', localizador: 'K7M2QX', qr: true, codigoFuera: 'BCN' } })
      await abrirLlegada()
      await irA('[data-mitad="arrival"]')
      await sacar('L_B1', '[data-mitad="arrival"]')
    }
  }
  fs.writeFileSync(`docs/dias/catalogo/_tmp/log_doc_a1_${MODO}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
