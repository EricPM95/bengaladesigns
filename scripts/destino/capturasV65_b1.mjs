// V65 (agente de los apartados 2 y 3): SOLO capturas (no es una prueba) en modo iPhone (390x844) de «Las entradas de cada uno» (en el móvil de Eric y en el de Alicia, de una entrada y de una excursión) y comprobaciones de lectura/reparto. Un solo Chrome, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV65_b1.mjs roma|lanza|design|logica [caso]
// Casos: hoja_vacia hoja_eric hoja_alicia hoja_comun hoja_excursion (Lanzarote: L_hoja; la API con DESTINOS_OCULTOS='-').
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V65_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null
const quiere = (id) => !SOLO || SOLO === id
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const lanza = MODO === 'lanza'
const svg = (extra) => `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path fill="#111" d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM3 3h3v3H3zM15 3h3v3h-3zM3 15h3v3H3z' + extra + '"/></svg>')}`
const QR = svg('M10 1h1v2h-1zM10 5h2v1h-2zM9 9h3v1H9zM13 10h2v2h-2zM17 12h3v1h-3zM10 14h2v3h-2zM14 15h3v1h-3zM18 17h2v3h-2zM13 18h3v2h-3z')
const QR2 = svg('M9 2h2v3H9zM9 7h1v3H9zM12 9h3v1h-3zM11 12h2v2h-2zM16 11h3v2h-3zM9 15h3v1H9zM14 14h2v3h-2zM17 16h3v1h-3zM12 18h2v2h-2z')
const cod = (d) => `{ texto: 'M1', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(d)} }`

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
   * Monta el caso. `yo`: 'eric' (administrador) o 'alicia' (invitada: la entrada es de Eric). `tipo`: 'entrada' | 'excursion'.
   * `docs`: 'ninguno' | 'uno' | 'uno_loc' | 'por' (un QR por persona) | 'comun'. `con`: con quién va (paraQuien).
   */
  const montar = async ({ tipo = 'entrada', yo = 'eric', docs = 'ninguno', con = ['p1', 'p2'], nombreSitio = 'coliseo(?!.*noche)', hora = '09:15', punto = null }) => {
    const J = JSON.stringify
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      ${yo === 'alicia' ? "sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'recomendar');" : ''}
      const r = JSON.parse(window.__base)
      const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
      st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${J(lanza ? 'The Colors House' : 'Hotel Quirinale')}, precio: null } } : {} })
      const V = await import('/src/store/useViajeCompartido.ts')
      const gente = [
        { id: 'p1', nombre: 'Eric', foto: null, esAdmin: true, esYo: ${yo === 'eric'} },
        { id: 'p2', nombre: 'Alicia', foto: null, esAdmin: false, permiso: 'recomendar', esYo: ${yo === 'alicia'} },
        { id: 'p3', nombre: 'Marta', foto: null, esAdmin: false, permiso: 'recomendar' },
        { id: 'p4', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' },
      ].slice(0, ${Math.max(2, con.length)})
      V.useViajeCompartido.getState().poner({ gente })
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId ?? null
      for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:billete:v1:') || k.startsWith('jutrip:aviso-documento:') || k.includes('documentos')) localStorage.removeItem(k)
      const B = (await import('/src/store/useBilleteStore.ts')).useBilleteStore
      B.setState({ datos: {}, tripId: tid })
      const D = (await import('/src/store/useDocumentosDeEntrada.ts')).useDocumentosDeEntrada
      D.setState({ tripId: tid, docs: [] })
      const B2 = await import('/src/lib/bookings.ts')
      const re = new RegExp(${J(nombreSitio)}, 'i')
      const d = r.days.find((x) => !x.isReturnLeg && x.stops?.some((p) => re.test(p.name))) ?? r.days.find((x) => !x.isReturnLeg && x.stops?.length) ?? r.days[0]
      const s = d.stops.find((p) => re.test(p.name)) ?? d.stops.find((p) => p.name && !p.isFreeTour && !p.isBreak) ?? d.stops[0]
      const refId = ${tipo === 'excursion' ? "'exc-v65'" : 's.name'}
      const res = { id: 'res-v65', kind: ${J(tipo)}, refId, name: ${tipo === 'excursion' ? J(lanza ? 'Excursión en barco a La Graciosa' : 'Excursión a Pompeya y el Vesubio') : 's.name'}, placeNames: [s.name], dateIso: B2.dateOfDay(r, d), dayNumber: null, time: ${J(hora)}, precio: { amount: 25, currency: 'EUR' }, paraQuien: ${J(con)}${punto ? `, meetingPoint: ${J(punto)}` : ''} }
      st.getState().addReservation(res, null, null)
      const docBase = { tipo: ${J(tipo)}, refId, subidoPor: 'p1', para: ${J(con)}, personas: ${con.length}, localizador: ${J(docs === 'uno' || docs === 'ninguno' ? null : 'X7K2M')} }
      const guardaMio = (codigo) => (${J(tipo)} === 'entrada' ? B.getState().ponerEntrada : B.getState().ponerExcursion)(tid, refId, { personas: ${con.length}, localizador: docBase.localizador, codigo, dueno: 'p1' })
      if (${J(docs)} === 'uno' || ${J(docs)} === 'uno_loc') guardaMio(${cod(QR)})
      if (${J(docs)} === 'por') {
        guardaMio(${cod(QR)})
        D.getState().poner(tid, { ...docBase, clave: 'p1', nombre: 'Eric', codigo: ${cod(QR)} })
        D.getState().poner(tid, { ...docBase, clave: 'p2', nombre: 'Alicia', codigo: ${cod(QR2)} })
      }
      if (${J(docs)} === 'comun') {
        guardaMio(${cod(QR)})
        D.getState().poner(tid, { ...docBase, clave: 'comun', nombre: null, codigo: ${cod(QR)} })
      }
      st.getState().setActiveDayId(null); st.getState().setMode('bookings')
      return true })()`)
    await a.esp(2500)
    // Abre el bloque (entradas o excursiones) si está cerrado.
    await a.evaluar(`(() => { const b = document.querySelector('[data-blk="${tipo === 'excursion' ? 'excursiones' : 'entradas'}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema]').length === 0) (b.querySelector('[data-cabecera-clara]') ?? b.querySelector('button'))?.click(); return true })()`)
    await a.esp(1500)
  }
  const sacar = async (id, sel) => {
    await a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e) e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return Boolean(e) })()`)
    await a.esp(1000)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector(${JSON.stringify(sel)}) ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 900)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 400))
  }
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const fotoHoja = async (id) => {
    await a.esp(900)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar("(document.querySelector('[data-hoja-entradas-de-cada-uno]') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 900)")
    console.log('captura', id, '|', String(log[id]).slice(0, 400))
  }
  const poner = (tipo, clave, nombre, qr) => a.evaluar(`(async () => {
    const D = (await import('/src/store/useDocumentosDeEntrada.ts')).useDocumentosDeEntrada
    const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId ?? null
    D.getState().poner(tid, { tipo: ${JSON.stringify(tipo)}, refId: window.__refId, clave: ${JSON.stringify(clave)}, subidoPor: 'p1', para: ${clave === 'comun' ? "['p1', 'p2', 'p3', 'p4']" : "['p1', 'p2']"}, nombre: ${JSON.stringify(nombre)}, localizador: 'X7K2M', personas: 1, codigo: ${cod(qr)} })
    return true })()`)
  const abrirHoja = async (tipo) => {
    const btn = tipo === 'excursion' ? '[data-anadir-doc="excursion-sin-codigo"]' : '[data-anadir-doc="entrada-sin-codigo"]'
    console.log('boton', await clic(btn))
    await a.esp(1000)
  }
  const refDeLaReserva = () => a.evaluar(`(async () => { window.__refId = ${R}.getState().reservations[0]?.refId; return window.__refId })()`)

  if (MODO === 'logica') {
    // Reparto por nombre y lectura de varios códigos de verdad (una imagen con DOS códigos dibujados). Sin pase en el navegador de prueba, el servidor no lee: los códigos salen sin nombre.
    log.reparto = await a.evaluar(`(async () => {
      const m = await import('/src/lib/entradasPorPersona.ts')
      const c = (nombre, t) => ({ nombre, codigo: { texto: t, formato: 'qr', imagen: null, dibujo: 'd' + t }, origen: t })
      const gente = [{ id: 'p1', nombre: 'Eric' }, { id: 'p2', nombre: 'Alicia' }, { id: 'p3', nombre: 'Marta' }]
      const r = (l, g = gente) => { const x = m.repartirPorNombre(l, g); return { porPersona: Object.fromEntries(Object.entries(x.porPersona).map(([k, v]) => [k, v.codigo.texto])), comun: x.comun?.codigo.texto ?? null, sinColocar: x.sinColocar.map((y) => y.codigo.texto) } }
      return {
        tresConNombre: r([c('ALICIA GARCÍA', 'q2'), c('Eric Peña', 'q1'), c('Marta Ruiz', 'q3')]),
        dosDeTres: r([c('Eric Peña', 'q1'), c('alicia garcia', 'q2')]),
        unoSinNombreVarios: r([c(null, 'q1')]),
        unoConNombreDeAlicia: r([c('Alicia García', 'q2')]),
        sinNombres: r([c(null, 'q1'), c(null, 'q2')]),
        nombreRepetido: r([c('Eric', 'q1'), c('Eric Peña', 'q9')], [{ id: 'p1', nombre: 'Eric' }, { id: 'p2', nombre: 'Alicia' }]),
        nombreDesconocido: r([c('Pedro Gómez', 'q1'), c('Eric', 'q2')]),
        permisos: { reco_de_la_entrada: m.puedeSubir({ paraQuien: ['p1', 'p2'] }, 'p2', 'p1', 'recomendar'), reco_ajena_sin_ser_de_ella: m.puedeSubir({ paraQuien: ['p1'] }, 'p2', 'p1', 'recomendar'), editar_ajena: m.puedeSubir({ paraQuien: ['p1'] }, 'p2', 'p1', 'editar'), suyo_siempre: m.puedeSubir({ paraQuien: ['p1'] }, 'p2', 'p2', 'recomendar'), comun_recomendar: m.queHagoConLoComun('recomendar'), comun_editar: m.queHagoConLoComun('editar') },
      }
    })()`)
    console.log(JSON.stringify(log.reparto, null, 1))
    log.lectura = await a.evaluar(`(async () => {
      const L = await import('/src/lib/billeteLeer.ts')
      const W = await import('/node_modules/zxing-wasm/dist/es/writer/index.js'); const wasm = { default: '/node_modules/zxing-wasm/dist/writer/zxing_writer.wasm' }
      W.prepareZXingModule({ overrides: { locateFile: (r, p) => (r.endsWith('.wasm') ? wasm.default : p + r) } })
      const svgA = async (t) => (await W.writeBarcode(t, { format: 'QRCode', withQuietZones: true, ecLevel: 'M' })).svg
      const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 520
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1000, 520)
      for (const [i, t] of ['ENTRADA-ERIC-001', 'ENTRADA-ALICIA-002'].entries()) {
        const img = new Image(); img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(await svgA(t)); await img.decode()
        ctx.drawImage(img, 30 + i * 490, 30, 440, 440)
      }
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png'))
      const f = new File([blob], 'dos-entradas.png', { type: 'image/png' })
      const res = await L.leerEntradasVarias(f, {})
      return { n: res.codigos.length, textos: res.codigos.map((c) => c.codigo.texto), nombres: res.codigos.map((c) => c.nombre), conDibujo: res.codigos.map((c) => Boolean(c.codigo.dibujo)), aviso: res.aviso }
    })()`)
    console.log(JSON.stringify(log.lectura))
  } else if (!lanza) {
    if (quiere('hoja_vacia')) { await montar({ docs: 'ninguno' }); await refDeLaReserva(); await abrirHoja('entrada'); await fotoHoja('hoja_vacia') }
    if (quiere('hoja_eric')) {
      await montar({ docs: 'ninguno' }); await refDeLaReserva(); await abrirHoja('entrada')
      await poner('entrada', 'p1', 'Eric Peña', QR)
      await fotoHoja('hoja_eric')
    }
    if (quiere('hoja_alicia')) {
      await montar({ docs: 'ninguno', yo: 'alicia' }); await refDeLaReserva(); await abrirHoja('entrada')
      await poner('entrada', 'p1', 'Eric Peña', QR)
      await fotoHoja('hoja_alicia')
    }
    if (quiere('hoja_comun')) {
      await montar({ docs: 'ninguno', con: ['p1', 'p2', 'p3', 'p4'] }); await refDeLaReserva(); await abrirHoja('entrada')
      await poner('entrada', 'comun', null, QR)
      await fotoHoja('hoja_comun')
    }
    if (quiere('hoja_excursion')) {
      await montar({ tipo: 'excursion', docs: 'ninguno', hora: '07:30' }); await refDeLaReserva(); await abrirHoja('excursion')
      await poner('excursion', 'p1', 'Eric Peña', QR)
      await fotoHoja('hoja_excursion')
    }
  } else if (quiere('L_hoja')) {
    await montar({ tipo: 'excursion', docs: 'ninguno', nombreSitio: '.', hora: '08:00' }); await refDeLaReserva(); await abrirHoja('excursion')
    await poner('excursion', 'p1', 'Eric Peña', QR)
    await fotoHoja('L_hoja')
  }
} finally {
  fs.writeFileSync(path.resolve(`docs/dias/V65_log_b1_${MODO}.json`), JSON.stringify(log, null, 2))
  await a.cerrar()
}
process.exit(0)
