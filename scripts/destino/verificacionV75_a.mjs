// V75 (apartados 1 a 4): comprobación rápida de lo que se guarda y se borra (NO es la prueba `pruebaV75`; la escribe otro agente). Un Chrome, por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/verificacionV75_a.mjs roma|lanza
// Imprime «OK …» / «FALLO …» por cada comprobación y acaba con código 1 si hay algún FALLO.
import path from 'node:path'
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const MODO = process.argv[2] ?? 'roma'
const lanza = MODO === 'lanza'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 844 })
let fallos = 0
const ok = (cond, texto) => {
  console.log(`${cond ? 'OK   ' : 'FALLO'} ${texto}`)
  if (!cond) fallos++
}
const ev = (e) => a.evaluar(`(async () => (${e}))()`)
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
  const clic = (sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const poner = (sel, valor) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  const hora = async (sel) => {
    await clic(sel)
    await a.esp(600)
    await clic('[data-hoja-de-hora-guardar]')
    await a.esp(400)
  }
  const contador = () => a.evaluar("(document.body.innerText.match(/(\\d+) de (\\d+) reservas listas/) || [''])[0]")

  await a.evaluar(`(async () => { const st = ${R}; st.setState({ reservations: [], screen: 'route' }); st.getState().setActiveDayId(null); st.getState().setMode('bookings'); return true })()`)
  await a.esp(2500)
  const antes = await contador()
  ok(Boolean(antes), `el contador sale («${antes}»)`)

  // 1. Cada tipo, por la hoja (la del lápiz de siempre del botón), y su bloque.
  const guardar = async (tipo, campos, extra = async () => {}) => {
    await clic('[data-anadir-una-reserva]')
    await a.esp(600)
    await clic(`[data-casilla-anadir="${tipo}"]`)
    await a.esp(1100)
    for (const [campo, valor] of Object.entries(campos)) await poner(`[data-extra-campo="${campo}"]`, valor)
    await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
    await a.esp(250)
    await hora(`[data-campo-de-hora="extra-${tipo}-hora"]`)
    await extra()
    ok(!(await ev("document.querySelector('[data-guardar-extra]')?.disabled ?? true")), `${tipo}: [Guardar] se activa con lo obligatorio`)
    await clic(`[data-guardar-extra="${tipo}"]`)
    await a.esp(1300)
  }
  await guardar('ferry', lanza ? { compania: 'Fred. Olsen', origen: 'Órzola', destino: 'La Graciosa' } : { compania: 'Caremar', origen: 'Nápoles', destino: 'Capri' }, async () => {
    await hora('[data-campo-de-hora="extra-ferry-llegada"]')
    await poner('[data-extra-campo="localizador"]', 'K7M2QX')
    await poner('input[aria-label="Precio"], input[aria-label="¿Cuánto ha costado en total?"]', '50')
    await a.esp(300)
  })
  await guardar('tren', { compania: 'Italo', origen: 'Roma Termini', destino: 'Florencia', coche: '5', asiento: '12a' })
  await guardar('otra', { nombre: 'Tour en kayak', lugar: 'Playa de Famara' })
  await guardar('bus', { compania: 'Alsa', origen: 'Sur', destino: 'Aeropuerto' })
  const lista = await ev(`${R}.getState().reservations.map((r) => ({ id: r.id, kind: r.kind, refId: r.refId, name: r.name, time: r.time, returnTime: r.returnTime ?? null, dateIso: r.dateIso, precio: r.precio ?? null, locator: r.locator ?? null, asiento: r.asiento ?? null, coche: r.coche ?? null, origen: r.origen ?? null, destinoDeViaje: r.destinoDeViaje ?? null }))`)
  ok(lista.length === 4 && ['ferry', 'tren', 'otra', 'bus'].every((k) => lista.some((r) => r.kind === k)), `4 reservas guardadas, una de cada tipo (${lista.map((r) => r.kind).join(', ')})`)
  const ferry = lista.find((r) => r.kind === 'ferry')
  ok(ferry && ferry.time === '10:00' && ferry.returnTime === '10:45' && ferry.locator === 'K7M2QX' && ferry.precio?.amount === 50, `el ferry lleva salida 10:00, llegada 10:45, localizador y precio 50 (${JSON.stringify(ferry)})`)
  ok(lista.find((r) => r.kind === 'tren')?.asiento === '12a' && lista.find((r) => r.kind === 'tren')?.coche === '5', 'el tren lleva coche y asiento')
  ok(lista.find((r) => r.kind === 'otra')?.name === 'Tour en kayak', 'la otra lleva su nombre')
  ok(ferry && ferry.dateIso && (await ev(`${R}.getState().route.days.length`)) > 1 && (await ev(`!!${R}.getState().route.answers.dateRange`)), 'el día elegido (un día del viaje) queda guardado con su fecha')

  // 2. Sus bloques, en orden, al final antes de «Útil para el viaje».
  const bloques = await ev("[...document.querySelectorAll('[data-blk^=\"extra-\"]')].map((e) => e.getAttribute('data-blk'))")
  ok(JSON.stringify(bloques) === JSON.stringify(['extra-ferry', 'extra-tren', 'extra-bus', 'extra-otra']), `los bloques salen en orden Ferry, Tren, Autobús, Otras (${bloques})`)
  const antesDeUtil = await ev("(() => { const u = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Útil para el viaje/i.test(e.textContent || '')); const b = document.querySelector('[data-blk=\"extra-otra\"]'); return Boolean(u && b && (b.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_FOLLOWING)) })()")
  ok(antesDeUtil, 'los bloques van antes de «Útil para el viaje»')
  const estados = await ev("[...document.querySelectorAll('[data-blk^=\"extra-\"] [data-estado]')].map((e) => e.textContent)")
  ok(estados.every((t) => t === '1 guardado'), `cada bloque dice «1 guardado» (${estados})`)
  ok((await contador()) === antes, `el contador «X de N reservas listas» no cambia con las extras (${antes} → ${await contador()})`)

  // 3. El precio entra en el presupuesto (la línea de la reserva, con su día).
  const lineas = await ev(`(async () => { const P = await import('/src/lib/presupuesto.ts'); const s = ${R}.getState(); const p = P.construirPresupuesto({ route: s.route, reservations: s.reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true }); return p.bloques.flatMap((b) => b.lineas.map((l) => l.id + '|' + l.nombre)) })()`)
  ok(lineas.some((l) => l.startsWith(`reserva-${ferry.id}|`)), `el ferry (50 €) entra en el presupuesto (${lineas.filter((l) => l.startsWith('reserva-')).length} líneas de reserva)`)

  // 4. El billete se guarda donde los de las excursiones y se ve en la tarjeta.
  await a.evaluar(`(async () => { const B = (await import('/src/store/useBilleteStore.ts')).useBilleteStore; const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId ?? null; B.getState().cargar(tid); B.getState().ponerExcursion(tid, ${JSON.stringify(ferry.id)}, { personas: null, localizador: 'K7M2QX', codigo: { texto: 'X', formato: 'qr', imagen: null, dibujo: 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 4%22%3E%3Crect width=%224%22 height=%224%22 fill=%22%23000%22/%3E%3C/svg%3E' }, dueno: null }); return true })()`)
  await a.esp(900)
  ok(await ev(`document.querySelector('[data-extra-id="${ferry.id}"] [data-extra-codigo]') !== null && document.querySelector('[data-extra-id="${ferry.id}"] [data-icono-documento="si"]') !== null`), 'con el billete guardado, el QR de arriba sale dorado y el bloque oscuro del código')

  // 5. Borrar con la hoja: lo mismo que la papelera de siempre (la reserva, su línea del presupuesto y su billete).
  await clic(`[data-extra-id="${ferry.id}"] [data-papelera]`)
  await a.esp(700)
  const hojaTexto = await ev("document.querySelector('[data-hoja^=\"eliminar-\"]')?.innerText ?? ''")
  ok(/eliminar tu ferry a/.test(hojaTexto) && /no se puede deshacer/.test(hojaTexto), `la hoja de borrar dice «${hojaTexto.replace(/\s+/g, ' ').slice(0, 90)}»`)
  await clic('[data-boton-hoja="eliminar-cancelar"]')
  await a.esp(500)
  ok((await ev(`${R}.getState().reservations.length`)) === 4, '[Cancelar] no borra nada')
  await clic(`[data-extra-id="${ferry.id}"] [data-papelera]`)
  await a.esp(600)
  await clic('[data-eliminar-confirmar]')
  await a.esp(900)
  ok((await ev(`${R}.getState().reservations.length`)) === 3 && !(await ev(`${R}.getState().reservations.some((r) => r.id === ${JSON.stringify(ferry.id)})`)), '[Sí, eliminar] borra la reserva')
  ok(!(await ev(`document.querySelector('[data-blk="extra-ferry"]') !== null`)), 'sin ferry guardado, el bloque Ferry ya no sale')
  const sinBillete = await ev(`(async () => { const B = (await import('/src/store/useBilleteStore.ts')).useBilleteStore; return !B.getState().datos.excursiones?.[${JSON.stringify(ferry.id)}] })()`)
  ok(sinBillete, 'su billete también se borra')
  const lineas2 = await ev(`(async () => { const P = await import('/src/lib/presupuesto.ts'); const s = ${R}.getState(); const p = P.construirPresupuesto({ route: s.route, reservations: s.reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true }); return p.bloques.flatMap((b) => b.lineas.map((l) => l.id)) })()`)
  ok(!lineas2.some((l) => l === `reserva-${ferry.id}`), 'y su gasto sale del presupuesto')
  ok((await contador()) === antes, 'el contador sigue igual tras borrar')

  // 6. El lápiz abre la misma hoja con lo guardado.
  const otra = lista.find((r) => r.kind === 'otra')
  await clic(`[data-extra-id="${otra.id}"] [data-lapiz]`)
  await a.esp(1100)
  ok((await ev("document.querySelector('[data-extra-campo=\"nombre\"]')?.value")) === 'Tour en kayak', 'el lápiz abre la hoja con lo guardado')
  await a.evaluar("document.querySelector('[role=dialog] button[aria-label=Cerrar]')?.click(); true")
  await a.esp(400)
  // 7. Las casillas de siempre abren SU hoja (la hoja solo reparte).
  const abre = async (casilla, patron, nombre) => {
    await a.evaluar("document.querySelectorAll('[role=dialog] button[aria-label=Cerrar]').forEach((b) => b.click()); true")
    await a.esp(500)
    await clic('[data-anadir-una-reserva]')
    await a.esp(600)
    await clic(`[data-casilla-anadir="${casilla}"]`)
    await a.esp(1800)
    const t = await ev("[...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' | ')")
    ok(patron.test(t), `«${nombre}» abre su hoja de siempre (${t.replace(/s+/g, ' ').slice(0, 110)})`)
    await a.evaluar("document.querySelectorAll('[role=dialog] button[aria-label=Cerrar]').forEach((b) => b.click()); true")
    await a.esp(500)
  }
  await abre('entrada', /Añadir otra reserva|reserva|entrada/i, 'Entrada')
  await abre('excursion', /excursi[oó]n/i, 'Excursión o tour')
  await abre('coche', /coche|alquiler/i, 'Coche de alquiler')
  await abre('aloj', /alojamiento/i, 'Alojamiento')
  // 8. En un viaje con más gente: dos pasos, «Casi lista», y el gasto se reparte entre los marcados con quien lo ha pagado.
  await a.evaluar(`(async () => { const V = await import('/src/store/useViajeCompartido.ts'); V.useViajeCompartido.getState().poner({ gente: [{ id: 'p1', nombre: 'Eric', foto: null, esAdmin: true, esYo: true }, { id: 'p2', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' }, { id: 'p3', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' }] }); ${R}.setState({ reservations: [] }); return true })()`)
  await a.esp(800)
  await a.evaluar("window.__anadirReserva.getState().abrirFormulario('ferry'); true")
  await a.esp(1100)
  await poner('[data-extra-campo="origen"]', 'Órzola')
  await poner('[data-extra-campo="destino"]', 'La Graciosa')
  await clic('[data-dia-cuadrado]:not([data-elegida="1"])')
  await hora('[data-campo-de-hora="extra-ferry-hora"]')
  ok(await ev("document.querySelector('[data-siguiente-paso]') !== null && document.querySelector('[data-guardar-extra]') === null"), 'en grupo, el botón del primer paso es [Siguiente]')
  await clic('[data-siguiente-paso]')
  await a.esp(700)
  ok(/Casi lista/.test(await ev("document.querySelector('[data-hoja-reserva-extra]').innerText")) && /¿A qué cuenta lo sumamos?/.test(await ev("document.querySelector('[data-hoja-reserva-extra]').innerText")), 'el segundo paso es «Casi lista» con «¿A qué cuenta lo sumamos?»')
  await clic('[data-cuenta-opcion="comun"]')
  await a.esp(300)
  await poner('input[aria-label="Precio"], input[aria-label="¿Cuánto ha costado en total?"]', '90')
  await a.esp(300)
  ok(/¿Para quién es el ferry?/.test(await ev("document.body.innerText")) && /¿Quién la ha pagado?/.test(await ev("document.body.innerText")), 'salen «¿Para quién es?» y «¿Quién la ha pagado?»')
  await clic('[data-guardar-extra="ferry"]')
  await a.esp(1200)
  const g = await ev(`${R}.getState().reservations.find((r) => r.kind === 'ferry')`)
  ok(g && g.precio?.amount === 90 && JSON.stringify(g.paraQuien) === JSON.stringify(['p1', 'p2', 'p3']) && JSON.stringify(g.pagadoPor) === JSON.stringify(['p1']), `el ferry de grupo guarda precio 90, para los 3 y pagado por Eric (${JSON.stringify({ p: g?.precio, q: g?.paraQuien, pg: g?.pagadoPor })})`)
  const reparto = await ev(`(async () => { const P = await import('/src/lib/presupuesto.ts'); const s = ${R}.getState(); const gente = ['p1','p2','p3']; const p = P.construirPresupuesto({ route: s.route, reservations: s.reservations, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true, compartido: { gastos: [], extrasDeLaRutaMios: true, reparto: { yoId: 'p1', adminId: 'p1', modo: 'conjunta', esInvitado: false, todos: gente, porDefecto: gente, entreDe: null, conVueloPropio: [], conAlojamientoPropio: [], reservasPropias: [], entradasDeInvitados: [], loSuyo: null } } }); const l = p.bloques.flatMap((b) => b.lineas).find((x) => x.id === 'reserva-' + s.reservations[0].id); return l ? { entre: l.entre ?? null, pago: l.precio?.amount } : null })()`)
  ok(reparto && reparto.pago === 90 && JSON.stringify(reparto.entre) === JSON.stringify(['p1', 'p2', 'p3']), `el gasto del ferry de grupo va entre los 3 (${JSON.stringify(reparto)})`)
} finally {
  a.cerrar()
}
console.log(fallos === 0 ? 'TODO OK' : `${fallos} FALLOS`)
process.exit(fallos === 0 ? 0 : 1)
void path
