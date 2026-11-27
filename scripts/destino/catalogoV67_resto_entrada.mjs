// V65 (agente del apartado 1 y la parte visual del 2): SOLO capturas (no es una prueba) en modo iPhone (390x844) de la tarjeta guardada de la entrada y de la excursión. Un solo Chrome, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV65_a1.mjs roma|lanza [caso]
// Casos: D7a D7b D7c D7d D7d2 D7d_alicia comun solo libre excursion excursion_sin (Lanzarote: L_entrada L_excursion; la API normal).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/catalogo/_tmp')
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
      if (${J(docs)} === 'eric') {
        guardaMio(${cod(QR)})
        D.getState().poner(tid, { ...docBase, clave: 'p1', nombre: 'Eric', codigo: ${cod(QR)} })
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
  const E = '[data-tarjeta-crema="entrada"]'
  const X = '[data-tarjeta-crema="excursion"]'
  if (!lanza) {
    if (quiere('D7a')) { await montar({ docs: 'ninguno' }); await sacar('D7a', E) }
    if (quiere('D7b')) { await montar({ docs: 'uno' }); await sacar('D7b', E) }
    if (quiere('D7c')) { await montar({ docs: 'uno_loc' }); await sacar('D7c', E) }
    if (quiere('D7d') || quiere('D7d2')) {
      await montar({ docs: 'por' })
      if (quiere('D7d')) await sacar('D7d', E)
      if (quiere('D7d2')) {
        await a.evaluar("(() => { const p = document.querySelector('[data-codigo-pista]'); if (p) p.scrollTo({ left: p.scrollWidth, behavior: 'instant' }); return Boolean(p) })()")
        await a.esp(900)
        await sacar('D7d2', E)
      }
    }
    if (quiere('D7d_alicia')) { await montar({ docs: 'por', yo: 'alicia' }); await sacar('D7d_alicia', E) }
    if (quiere('alicia_falta')) { await montar({ docs: 'eric', yo: 'alicia' }); await sacar('alicia_falta', E) }
    if (quiere('eric_falta')) { await montar({ docs: 'eric' }); await sacar('eric_falta', E) }
    if (quiere('comun')) { await montar({ docs: 'comun', con: ['p1', 'p2', 'p3', 'p4'] }); await sacar('comun', E) }
    if (quiere('solo')) { await montar({ docs: 'uno_loc', con: ['p1'] }); await sacar('solo', E) }
    if (quiere('libre')) { await montar({ docs: 'uno_loc', nombreSitio: 'foro romano(?!.*noche)', hora: '10:00' }); await sacar('libre', E) }
    if (quiere('excursion')) { await montar({ tipo: 'excursion', docs: 'por', hora: '07:30', punto: 'Piazza della Repubblica' }); await sacar('excursion', X) }
    if (quiere('excursion_sin')) { await montar({ tipo: 'excursion', docs: 'ninguno', hora: '07:30' }); await sacar('excursion_sin', X) }
  } else {
    if (quiere('L_entrada')) { await montar({ docs: 'por', nombreSitio: '.', hora: '10:30' }); await sacar('L_entrada', E) }
    if (quiere('L_excursion')) { await montar({ tipo: 'excursion', docs: 'por', nombreSitio: '.', hora: '08:00' }); await sacar('L_excursion', X) }
  }
} finally {
  fs.writeFileSync(path.resolve(`docs/dias/catalogo/_tmp/log_entrada_a1_${MODO}.json`), JSON.stringify(log, null, 2))
  await a.cerrar()
}
process.exit(0)
