// Tanda 10N7 (M2) · las cuentas según cómo viajáis: el presupuesto de la cuenta conjunta (1b), «Cada uno lo suyo» sin [Para todos]/[Para mí] y las preguntas de cada reserva (1c), lo «Solo para mí» (2b-1),
// quien solo recomienda (2b-3) y «Extras» a mano (2b-4). No toca el motor de rutas.
//   API_URL=http://localhost:8892 APP_URL=http://localhost:5222 node scripts/destino/pruebaTanda10N7_presupuesto.mjs     (SIN_APP=1 salta la pantalla)
// 1. Lo puro (esbuild + Node). 2. Lo que hay en el código. 3. La pantalla de verdad: capturas docs/dias/capturas_jutrip/10n7_*.jpg y, al lado, la de Design (10n7_design_cuentas_*.jpg).
import fs from 'node:fs'
import path from 'node:path'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (process.env.DEBUG) console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 80))
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const eur = (amount) => ({ amount, currency: 'EUR' })

const { M } = await prepararSSR('scripts/destino/_10n7_m2_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { construirPresupuesto, esSoloDe, reservaEsPersonal, reservaEsPersonalSegunModo, lineaParaQuien, preguntaDeReserva, resolverModo } = M

/* ═══════════════ 1. Lo puro ═══════════════ */
console.log('1. Lo puro')
const TODOS = ['eric', 'ana']
const ruta = { id: 'r1', destination: 'Roma', origin: 'Madrid', answers: { dateRange: { start: '2026-11-10', end: '2026-11-14' } }, arrivalPrecio: null, departurePrecio: null, days: [{ id: 'd1', dayNumber: 1, city: 'Roma', stops: [] }, { id: 'd2', dayNumber: 2, city: 'Roma', stops: [] }] }
const reserva = (id, nombre, precio, paraQuien, extra = {}) => ({ id, kind: 'entrada', refId: nombre, name: nombre, placeNames: [nombre], dateIso: '2026-11-12', dayNumber: null, time: '09:15', precio: eur(precio), ...(paraQuien ? { paraQuien } : {}), ...extra })
const gasto = (id, autorId, amount, o = {}) => ({ id, tripId: 't', autorId, nombre: id, precio: eur(amount), ambito: 'grupo', estado: 'aceptado', pagadoPor: [autorId], entre: [], decididoPor: null, creadoEn: '', ...o })
const base = (reservations, modo, yoId, extra = {}, gastos = [], todos = TODOS, cuentasEntre) => ({
  route: { ...ruta, cuentasEntre, gastosExtras: [] },
  reservations,
  accommodationSelections: {},
  transportBookings: {},
  insuranceBooking: null,
  rentalVehicleBooking: null,
  esimPrecios: {},
  moneda: 'EUR',
  cambio: null,
  pago: true,
  compartido: { gastos, extrasDeLaRutaMios: yoId === 'eric', reparto: { yoId, adminId: 'eric', modo, esInvitado: yoId !== 'eric', todos, entreDe: cuentasEntre ?? null, ...extra } },
})
const lineasDe = (p) => p.bloques.flatMap((b) => b.lineas)
const ids = (p) => lineasDe(p).map((l) => l.id).join()
{
  // 1b · Eric, cuenta conjunta: Coliseo 100 para los dos, antes de compartir (sin lista) 20, Regalo 40 solo para él, Cena 80 del grupo, Regalo gasto 15 solo para él.
  const rs = [reserva('r1', 'Coliseo', 100, ['eric', 'ana']), reserva('r2', 'Panteón', 20, null), reserva('r3', 'Regalo', 40, ['eric'], { dateIso: '2026-11-13' })]
  const gs = [gasto('cena', 'eric', 80), gasto('flores', 'eric', 15, { ambito: 'mio', pagadoPor: [] })]
  const p = construirPresupuesto(base(rs, 'conjunta', 'eric', {}, gs))
  debe(p.total.amount === 200, '1b', `lo común suma 100 + 20 + 80 = 200 € (lo de antes de compartir, sin «¿Para quién?», también es de los dos): ${p.total.amount}`)
  debe(p.loTuyo.map((l) => l.id).sort().join() === 'gasto-flores,reserva-r3', '1b', `«Lo tuyo»: la reserva y el gasto «Solo para mí»: ${p.loTuyo.map((l) => l.id)}`)
  debe(p.sumaLoTuyo.amount === 55 && p.totalConLoTuyo.amount === 255, '1b', `Lo tuyo 55 € y Total 255 € (${p.sumaLoTuyo.amount} / ${p.totalConLoTuyo.amount})`)
  debe(!ids(p).includes('reserva-r3') && !ids(p).includes('gasto-flores'), '1b', 'lo «Solo para mí» no está dentro de «Ruta» ni de «Extras»')
  debe(p.bloques.find((b) => b.id === 'ruta').suma.amount === 120 && p.bloques.find((b) => b.id === 'extras').suma.amount === 80, '1b', '«Ruta» (120 €) y «Extras» (80 €) son de la cuenta conjunta y suman en el importe de arriba')
  debe(lineasDe(p).every((l) => l.personal !== true), '1b', 'ninguna línea de los bloques comunes es personal')
  debe(p.loTuyo.every((l) => l.compartido?.vista === 'mio'), '1b', 'lo tuyo se pinta como «Solo tú»')
  // Ana (invitada): no ve nada de lo «Solo para mí» de Eric, y no tiene «Lo tuyo»
  const pa = construirPresupuesto(base(rs, 'conjunta', 'ana', {}, [gasto('cena', 'eric', 80)]))
  debe(pa.loTuyo.length === 0 && !ids(pa).includes('reserva-r3'), '2b-1', 'Ana no ve el regalo de Eric ni tiene «Lo tuyo» si no tiene nada suyo')
  debe(pa.total.amount === 200 && pa.totalConLoTuyo.amount === 200, '2b-1', 'y su total es solo lo común (200 €)')
  debe(pa.ocultas.some((l) => l.id === 'reserva-r3'), '2b-1', '…lo oculto va a «ocultas», nunca a Lo tuyo de ella')
  // Ana con algo suyo
  const pa2 = construirPresupuesto(base(rs, 'conjunta', 'ana', {}, [gasto('cena', 'eric', 80), gasto('perfume', 'ana', 30, { ambito: 'mio', pagadoPor: [] })]))
  debe(pa2.loTuyo.length === 1 && pa2.loTuyo[0].id === 'gasto-perfume' && pa2.sumaLoTuyo.amount === 30 && pa2.totalConLoTuyo.amount === 230, '1b', 'cada uno tiene el suyo: Ana ve su perfume (30 €) y su total (230 €), no el regalo de Eric')
  // El administrador no ve lo de Ana (nunca llega: la base de datos lo corta); aunque llegara, el filtro de gastos no lo enseña
  const pe3 = construirPresupuesto(base(rs, 'conjunta', 'eric', {}, [gasto('cena', 'eric', 80)]))
  debe(!ids(pe3).includes('perfume'), '2b-1', 'el administrador no ve el perfume de Ana')
  // Una reserva de Ana (invitada) solo para ella: personal de ella; para los dos, común
  const pa3 = construirPresupuesto(base([], 'conjunta', 'ana', { reservasPropias: [reserva('a1', 'Villa', 50, ['ana']), reserva('a2', 'Trevi', 10, ['eric', 'ana'])] }))
  debe(pa3.loTuyo.map((l) => l.id).join() === 'reserva-a1' && ids(pa3).includes('reserva-a2'), '1b', 'la entrada de Ana solo para ella va a su «Lo tuyo»; la de los dos, al común')
  // Solo para mí del vuelo, del alojamiento y del coche del administrador
  const entreDe = { llegada: ['eric'], vuelta: ['eric', 'ana'], 'aloj-d1': ['eric'], coche: ['eric'] }
  const rutaV = { ...ruta, arrivalPrecio: eur(300), departurePrecio: eur(200) }
  const eV = base([], 'conjunta', 'eric', { entreDe }, [], TODOS, entreDe)
  eV.route = { ...rutaV, cuentasEntre: entreDe, gastosExtras: [] }
  eV.accommodationSelections = { d1: { name: 'Hotel Roma', precio: eur(400) } }
  eV.rentalVehicleBooking = { provider: 'Hertz', precio: eur(150) }
  const pv = construirPresupuesto(eV)
  debe(pv.loTuyo.map((l) => l.id).sort().join() === 'aloj-d1,coche,llegada', '1b', `el vuelo de ida, el alojamiento y el coche «Solo para mí» van a «Lo tuyo» (la vuelta, para los dos, no): ${pv.loTuyo.map((l) => l.id)}`)
  debe(pv.total.amount === 200 && pv.sumaLoTuyo.amount === 850, '1b', `y no suman en lo común (${pv.total.amount} / ${pv.sumaLoTuyo.amount})`)
  const pvAna = construirPresupuesto({ ...eV, compartido: { gastos: [], extrasDeLaRutaMios: false, reparto: { yoId: 'ana', adminId: 'eric', modo: 'conjunta', esInvitado: true, todos: TODOS, entreDe } } })
  debe(pvAna.loTuyo.length === 0 && !ids(pvAna).includes('llegada') && !ids(pvAna).includes('coche') && !ids(pvAna).includes('aloj-d1'), '2b-1', 'Ana no ve el vuelo, el alojamiento ni el coche «Solo para mí» del administrador')
  // Extras anteriores a compartir (apuntados cuando viajaba solo): de la cuenta conjunta
  const eX = base([], 'conjunta', 'eric', {}, [])
  eX.route = { ...ruta, gastosExtras: [{ id: 'antes', nombre: 'Propina', precio: eur(10) }] }
  const pX = construirPresupuesto(eX)
  debe(pX.total.amount === 10 && pX.loTuyo.length === 0, '2b-4', 'un extra de antes de compartir es de la cuenta conjunta (no «Solo para mí»)')
  // 2b-3 · quien solo recomienda: su gasto «Para los dos» queda pendiente y no suma; el «Solo para mí» suyo, directo
  const pr = construirPresupuesto(base([], 'conjunta', 'ana', {}, [gasto('pend', 'ana', 70, { estado: 'pendiente' }), gasto('mio', 'ana', 12, { ambito: 'mio', pagadoPor: [] })]))
  const pend = lineasDe(pr).find((l) => l.id === 'gasto-pend')
  debe(pend && pend.compartido.vista === 'pendiente' && pr.total.amount === 0, '2b-3', 'el gasto «Para los dos» de quien solo recomienda sale pendiente y no suma hasta que lo acepten')
  debe(pr.loTuyo.length === 1 && pr.loTuyo[0].id === 'gasto-mio' && pr.sumaLoTuyo.amount === 12, '2b-3', '…y su «Solo para mí» no espera a nadie: es suyo')
  // 1c · «Cada uno lo suyo»: todo sigue como en la 10N6 (lo personal dentro de sus bloques, con «Solo tú»)
  const pc = construirPresupuesto(base(rs, 'cada_uno', 'eric', {}, gs))
  debe(pc.loTuyo.length === 0 && pc.sumaLoTuyo.amount === 0 && pc.totalConLoTuyo.amount === pc.total.amount, '1c', 'en «Cada uno lo suyo» no hay bloque «Lo tuyo»')
  debe(lineasDe(pc).filter((l) => l.personal).map((l) => l.id).includes('reserva-r2') && lineasDe(pc).filter((l) => l.personal).map((l) => l.id).includes('reserva-r3'), '1c', 'lo personal (también lo de antes de compartir) sigue en su bloque con el candado, como en la 10N6')
  // El modo manda en quién es personal
  debe(reservaEsPersonalSegunModo('conjunta', undefined, 'eric') === false && reservaEsPersonalSegunModo('conjunta', ['eric'], 'eric') === true && reservaEsPersonalSegunModo('conjunta', ['eric', 'ana'], 'eric') === false, '1b', 'reservaEsPersonalSegunModo (conjunta): sin lista es común; solo quien paga es personal')
  debe(reservaEsPersonalSegunModo('cada_uno', undefined, 'eric') === true && reservaEsPersonalSegunModo(undefined, ['ana'], 'eric') === false, '1c', 'reservaEsPersonalSegunModo (cada uno): como siempre')
  // Viajar solo: sin compartido, nada de lo de grupo
  const ps = construirPresupuesto({ route: { ...ruta, gastosExtras: [{ id: 'a', nombre: 'Cena', precio: eur(30) }] }, reservations: [reserva('s1', 'Coliseo', 100, null)], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true })
  debe(ps.total.amount === 130 && ps.loTuyo.length === 0 && ps.totalConLoTuyo.amount === 130 && lineasDe(ps).every((l) => !l.personal && !l.compartido), '1a', 'viajando solo, el presupuesto de siempre: 130 €, sin candados, sin nombres, sin «Lo tuyo»')
}

console.log('1b. Las preguntas y la línea pequeña')
{
  debe(preguntaDeReserva('entrada') === '¿Para quién has comprado la entrada?', '1c', preguntaDeReserva('entrada'))
  debe(preguntaDeReserva('vuelo') === '¿Para quién has comprado el vuelo?', '1c', preguntaDeReserva('vuelo'))
  debe(preguntaDeReserva('alojamiento') === '¿Para quién has reservado el alojamiento?', '1c', preguntaDeReserva('alojamiento'))
  debe(preguntaDeReserva('excursion') === '¿Para quién has reservado la excursión?', '1c', preguntaDeReserva('excursion'))
  debe(preguntaDeReserva('coche') === '¿Para quién has reservado el coche?', '1c', preguntaDeReserva('coche'))
  const nombre = (id) => ({ eric: 'Eric', ana: 'Ana', luis: 'Luis' })[id]
  const l1 = lineaParaQuien(['eric'], 'eric', nombre)
  debe(l1.fuerte + l1.resto === 'Solo para ti: es un gasto tuyo y nadie más lo ve.', '1c', `solo tú: «${l1.fuerte}${l1.resto}»`)
  const l2 = lineaParaQuien(['eric', 'ana'], 'eric', nombre)
  debe(l2.fuerte + l2.resto === 'Para 2 personas: entra en las cuentas del grupo.', '1c', `con más personas: «${l2.fuerte}${l2.resto}»`)
  const l3 = lineaParaQuien(['eric', 'ana', 'luis'], 'eric', nombre)
  debe(l3.fuerte === 'Para 3 personas:', '1c', 'con el número que toque (3)')
  const l4 = lineaParaQuien(['ana'], 'eric', nombre)
  debe(l4.fuerte + l4.resto === 'Para Ana: entra en las cuentas del grupo.', '1c', `solo para otro: «${l4.fuerte}${l4.resto}»`)
  const l5 = lineaParaQuien(['ana', 'luis'], 'eric', nombre)
  debe(l5.fuerte === 'Para Ana y Luis:', '1c', `para otros, sin ti: «${l5.fuerte}»`)
}

console.log('1c. El modo por defecto y cuando entra alguien (la API de M1)')
{
  const r = (companion, extra = {}) => ({ answers: { companion }, ...extra })
  debe(resolverModo(r('solo'), 1).modo === 'solo' && resolverModo(r('couple'), 1).modo === 'solo', '1a', 'una persona sola: «solo»')
  debe(resolverModo(r('couple'), 2).modo === 'conjunta' && resolverModo(r('family', { }), 2).modo === 'conjunta', '1b', 'pareja y familia: cuenta conjunta por defecto')
  debe(resolverModo(r('group'), 4).modo === 'cada_uno' && !resolverModo(r('group'), 4).pendiente, '1c', 'amigos: cada uno lo suyo por defecto')
  const unidoAUnoSolo = resolverModo(r('solo'), 2)
  debe(unidoAUnoSolo.modo === 'cada_uno' && unidoAUnoSolo.pendiente, '2', 'un viaje solo al que se une alguien: «cada uno lo suyo» y pendiente de elegir')
  debe(resolverModo(r('couple'), 3).pendiente && resolverModo(r('couple'), 3).modo === 'conjunta', '2b-2', 'una cuenta conjunta con un tercero: sigue como estaba y vuelve a preguntar')
  debe(resolverModo(r('couple', { modoCuentas: 'conjunta', modoElegidoCon: 3 }), 3).pendiente === false, '2b-2', 'ya elegido con tres, no vuelve a preguntar')
}

/* ═══════════════ 2. Lo que hay en el código ═══════════════ */
console.log('2. El código')
{
  const gasto_ = sinComentarios(leer('src/components/route/presupuesto/HojaAnadirGasto.tsx'))
  debe(!/Para mí|InterruptorElegir|Para todos'/.test(gasto_.replace(/ParaQuienConjunta/g, '')), '1c', '«Añadir gasto» ya no lleva [Para todos] / [Para mí] (los dice ParaQuien: conjunta o los nombres)')
  debe(/ParaQuienConjunta/.test(gasto_) && /ParaQuienConNombres/.test(gasto_), '1b', '«Añadir gasto» usa «Para los dos / Solo para mí» en la conjunta y los nombres en «Cada uno lo suyo»')
  const reserva_ = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/ParaQuienConjunta/.test(reserva_) && /preguntaDeReserva/.test(reserva_), '1c', 'la hoja de reserva pregunta según lo que se añade')
  const lo = sinComentarios(leer('src/components/route/reservas/LoDeCadaUno.tsx'))
  debe(/preguntaDeReserva/.test(lo) && /ParaQuienConjunta/.test(lo), '1b', 'el vuelo, el alojamiento y el coche del administrador usan las mismas preguntas')
  const pp = sinComentarios(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx'))
  debe(/modoCuentas\.modo !== 'conjunta' && <TarjetaCuentas/.test(pp) || /gv\.compartido && modoCuentas\.modo !== 'conjunta'/.test(pp), '1b', '«Cuentas del grupo» no sale en la cuenta conjunta (sin deudas)')
  debe(/<LoTuyo/.test(pp), '1b', 'el bloque «Lo tuyo» está en el presupuesto')
  debe(fs.existsSync('supabase/migrations/0055_solo_para_mi_privado.sql'), '2b-1', 'migración 0055 escrita')
}

/* ═══════════════ 3. La pantalla de verdad ═══════════════ */
console.log('3. La pantalla de verdad')
if (process.env.SIN_APP === '1') console.log('   (saltada: SIN_APP=1)')
else {
  const { abrir, foto } = await import('./_10n7_m2_comun.mjs')
  const { capturarDesign } = await import('./capturaDesign.mjs')
  const { a, ev, preparar, abrirPresupuesto, cerrarPresupuesto, texto, clic, gasto: anadirGasto, RESERVAS } = await abrir()
  const regalo = { id: 'r2', kind: 'entrada', refId: 'Regalo', name: 'Regalo para Ana', placeNames: ['Regalo'], dateIso: '2026-11-13', dayNumber: null, time: '10:00', precio: { amount: 40, currency: 'EUR' }, paraQuien: ['eric'] }
  const hoja = '[role="dialog"][aria-labelledby="hoja-anadir-gasto"]'
  const cerrarHoja = () => ev("(() => { const b = Array.from(document.querySelectorAll('[aria-labelledby=\"hoja-anadir-gasto\"] button')).find((x) => /Cerrar/.test(x.getAttribute('aria-label') || '')); b?.click(); return true })()")
  const escribir = async (sel, valor) => {
    await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    await a.esp(250)
  }
  try {
    /* 1a · viajas solo */
    await preparar({ yo: null, modo: null, reservas: RESERVAS().map((r) => ({ ...r, paraQuien: undefined })) })
    await abrirPresupuesto()
    const solo = await texto()
    debe(!/Cuentas del grupo|Cuenta conjunta|Del grupo|Para quién|Lo tuyo/i.test(solo) && /Total del viaje/i.test(solo), '1a', `viajando solo, el presupuesto de siempre (sin nombres, sin cuentas del grupo) (${solo.slice(0, 160)})`)
    await ev("(() => document.querySelector('[data-blk=\"extras\"]')?.scrollIntoView({ block: 'center' }))()")
    debe(!(await ev("Boolean(document.querySelector('[data-anadir-gasto]'))")) && (await ev("Boolean(document.querySelector('[aria-label=\"Nombre del gasto\"]'))")), '2b-4', 'viajando solo, los Extras no preguntan nada: nombre, importe y Añadir')
    await a.captura(foto('m2_01_solo'))
    await cerrarPresupuesto()

    /* 1b · cuenta conjunta, Eric: sin nada «Solo para mí» (02a) */
    await preparar({ yo: 'eric', modo: 'conjunta' })
    await anadirGasto({ nombre: 'Cena en Trastevere', precio: eur(80), ambito: 'grupo', estado: 'aceptado', pagadoPor: ['eric'], entre: [] })
    await abrirPresupuesto()
    const c1 = await texto()
    debe(/CUENTA CONJUNTA · ERIC Y ANA/i.test(c1) && /180 €/.test(c1), '1b', `la tarjeta oscura dice «Cuenta conjunta · Eric y Ana» con 180 € (${c1.slice(0, 140)})`)
    debe(!/por persona|Cuentas del grupo|Del grupo|Lo tuyo|De los dos/.test(c1), '1b', 'sin «por persona», sin «Cuentas del grupo» y, sin nada suyo, sin «Lo tuyo»')
    debe(await ev("Boolean(document.querySelector('[data-lapiz-cuenta] svg'))"), '1b', 'con el lápiz para cambiarle el nombre')
    debe(/Cena en Trastevere Para los dos 80 €/.test(c1), '1b', 'la cena, en «Extras», dice «Para los dos» (sin «Pagó Eric»)')
    debe(/Total 180 €/i.test(c1.replace(/\s+/g, ' ')) && !/Total 18\d € ·/.test(c1), '1b', 'el total de abajo: solo lo común')
    await a.captura(foto('m2_02a_conjunta_eric_sin_lo_suyo'))

    /* 1b · añadir un gasto «Solo para mí» (04b) */
    debe(await clic('/Añadir gasto/', "document.querySelector('[data-blk=\"extras\"]')"), '1b', 'se puede abrir «Añadir gasto»')
    await a.esp(1000)
    const g1 = await texto(hoja)
    debe(/Para los dos/.test(g1) && /Solo para mí/.test(g1) && !/Quién ha pagado|Para quién es\? \d/.test(g1), '1b', `«Añadir gasto» en la cuenta conjunta: «Para los dos» y «Solo para mí», sin nombres (${g1.replace(/Moneda del gasto.*?(?=¿|Para)/, '').slice(0, 120)})`)
    debe((await ev("document.querySelector('[data-elegir=\"gasto-ambito\"] [data-opcion=\"todos\"]')?.getAttribute('data-elegida')")) === '1', '1b', '«Para los dos» sale marcada')
    await clic('/Solo para mí/', `document.querySelector('${hoja}')`)
    await a.esp(400)
    debe(/Solo lo ves tú\./.test(await texto(hoja)), '1b', 'al marcar «Solo para mí»: la línea «Solo lo ves tú.»')
    await escribir('[data-gasto-nombre]', 'Regalo para Ana')
    await escribir('[data-gasto-importe]', '40')
    await a.captura(foto('m2_04b_gasto_solo_para_mi'))
    await ev("document.querySelector('[data-gasto-enviar]').click(); true")
    await a.esp(1500)
    const c2 = await texto()
    debe(/Lo tuyo Solo lo ves tú 40 € Regalo para Ana/.test(c2), '1b', `sale «Lo tuyo · Solo lo ves tú» con el regalo (${c2.slice(c2.indexOf('Lo tuyo') - 10, c2.indexOf('Lo tuyo') + 90)})`)
    debe(/De los dos 180 € · Lo tuyo 40 € · Total 220 €/.test(c2), '1b', 'el total explicado: «De los dos 180 € · Lo tuyo 40 € · Total 220 €»')
    debe(!/CUENTA CONJUNTA · ERIC Y ANA 220/i.test(c2) && /CUENTA CONJUNTA · ERIC Y ANA 180/i.test(c2), '1b', 'lo «Solo para mí» no cuenta en el importe de arriba (180 €)')
    debe(await ev("Boolean(document.querySelector('[data-blk=\"lo-tuyo\"] svg'))"), '1b', 'el bloque lleva el candado')
    const orden = await ev("(() => { const e = document.querySelector('[data-blk=\"extras\"]'); const l = document.querySelector('[data-blk=\"lo-tuyo\"]'); return e && l ? [e.getBoundingClientRect().bottom <= l.getBoundingClientRect().top, Math.round(l.getBoundingClientRect().top - e.getBoundingClientRect().bottom)] : null })()")
    debe(orden && orden[0] && orden[1] >= 8, '1b', `«Lo tuyo» abajo, después de «Extras», con aire entre bloques (${JSON.stringify(orden)})`)
    await ev("document.querySelector('[data-blk=\"lo-tuyo\"]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(400)
    await a.captura(foto('m2_02b_conjunta_eric_con_lo_suyo'))
    await cerrarPresupuesto()

    /* 2b-1 · Ana ve lo común y no lo de Eric; el administrador no ve lo de Ana */
    await ev("window.__gastosFalsos.usar('ana', ['eric', 'ana']).then(() => true)")
    await a.esp(1500)
    await abrirPresupuesto()
    const ana = await texto()
    debe(!/Regalo para Ana|Lo tuyo|De los dos/.test(ana) && /CUENTA CONJUNTA/i.test(ana) && /Cena en Trastevere/.test(ana), '2b-1', `Ana ve lo común (la cena) y nada del regalo de Eric (${ana.slice(0, 200)})`)
    await a.captura(foto('m2_02c_conjunta_ana'))
    // Ana apunta un «Solo para mí»: lo ve ella, no Eric
    await anadirGasto({ nombre: 'Perfume', precio: eur(30), ambito: 'mio', estado: 'aceptado', pagadoPor: [], entre: [] })
    await a.esp(800)
    const ana2 = await texto()
    debe(/Lo tuyo Solo lo ves tú 30 € Perfume/.test(ana2) && /De los dos 180 € · Lo tuyo 30 € · Total 210 €/.test(ana2) && !/Regalo para Ana/.test(ana2), '1b', `cada uno tiene el suyo: Ana ve su perfume y «De los dos 180 € · Lo tuyo 30 € · Total 210 €» (${ana2.slice(ana2.indexOf('Lo tuyo') - 5, ana2.indexOf('Lo tuyo') + 40)})`)
    await cerrarPresupuesto()
    await ev("window.__gastosFalsos.usar('eric', ['eric', 'ana']).then(() => true)")
    await a.esp(1500)
    await abrirPresupuesto()
    const eric2 = await texto()
    debe(!/Perfume/.test(eric2) && /Regalo para Ana/.test(eric2), '2b-1', 'el administrador no ve el perfume de Ana (y sí lo suyo)')
    await cerrarPresupuesto()

    /* 2b-3 · quien solo recomienda: «Para los dos» queda pendiente; «Solo para mí», directo */
    await ev("window.__gastosFalsos.usar('ana', ['eric', 'ana']).then(() => true)")
    await a.esp(1200)
    await abrirPresupuesto()
    await clic('/Añadir gasto/', "document.querySelector('[data-blk=\"extras\"]')")
    await a.esp(900)
    debe(/Para los dos/.test(await texto(hoja)) && /Enviar a Eric/.test(await texto(hoja)), '2b-3', 'quien solo recomienda, con «Para los dos»: el botón dice «Enviar a Eric»')
    await escribir('[data-gasto-nombre]', 'Taxi')
    await escribir('[data-gasto-importe]', '25')
    await ev("document.querySelector('[data-gasto-enviar]').click(); true")
    await a.esp(1500)
    const rec = await texto()
    debe(/Taxi Pendiente de Eric/.test(rec) && /CUENTA CONJUNTA · ERIC Y ANA 180/i.test(rec), '2b-3', `el gasto de Ana queda «Pendiente de Eric» y no suma (${rec.slice(rec.indexOf('Taxi') - 5, rec.indexOf('Taxi') + 40)})`)
    await a.captura(foto('m2_recomienda_pendiente'))
    await cerrarPresupuesto()

    /* 1c · cada uno lo suyo: «Añadir gasto» con nombres, sin [Para todos] / [Para mí] (05, 08) */
    await preparar({ yo: 'eric', modo: 'cada_uno', gente: ['eric', 'ana', 'luis', 'marta'] })
    await abrirPresupuesto()
    const cc = await texto()
    debe(/Del grupo/i.test(cc) && /Cuentas del grupo/.test(cc) && !/CUENTA CONJUNTA|Lo tuyo/i.test(cc), '1c', `«Cada uno lo suyo»: «Del grupo» arriba y «Cuentas del grupo» (con quién le debe a quién), sin cuenta conjunta (${cc.slice(0, 200)})`)
    await clic('/Añadir gasto/', "document.querySelector('[data-blk=\"extras\"]')")
    await a.esp(1000)
    const g2 = await texto(hoja)
    debe(!/Para todos|Para mí|Solo para mí/.test(g2.replace('Solo para ti:', '')) && /¿Quién ha pagado\?/.test(g2) && /¿Para quién es\?/.test(g2), '1c', 'sin [Para todos] / [Para mí]: «¿Quién ha pagado?» y «¿Para quién es?» con los nombres')
    const marcados = await ev("Array.from(document.querySelectorAll('[data-gasto-entre-quien] [data-elegir-pastilla][data-elegida=\"1\"]')).map((b) => b.textContent.trim())")
    debe(marcados.length === 1 && /Eric/.test(marcados[0]), '1c', `en «¿Para quién es?» sale marcado solo quien lo añade (${JSON.stringify(marcados)})`)
    debe(/Solo para ti: es un gasto tuyo y nadie más lo ve\./.test(g2), '1c', 'y la línea «Solo para ti: es un gasto tuyo y nadie más lo ve.»')
    await a.captura(foto('m2_05_gasto_cada_uno_solo_tu'))
    await clic('/Ana/', "document.querySelector('[data-gasto-entre-quien]')")
    await a.esp(300)
    debe(/Para 2 personas: entra en las cuentas del grupo\./.test(await texto(hoja)), '1c', 'marcando a Ana: «Para 2 personas: entra en las cuentas del grupo.»')
    await a.captura(foto('m2_05b_gasto_cada_uno_dos'))
    await clic('/Eric/', "document.querySelector('[data-gasto-entre-quien]')")
    await a.esp(300)
    debe(/Para Ana: entra en las cuentas del grupo\./.test(await texto(hoja)), '1c', 'quitándote tú: «Para Ana: entra en las cuentas del grupo.»')
    await a.captura(foto('m2_05c_gasto_cada_uno_otra'))
    // Un gasto solo para él (1 de 4) → personal; uno para dos → del grupo
    await clic('/Eric/', "document.querySelector('[data-gasto-entre-quien]')")
    await clic('/Ana/', "document.querySelector('[data-gasto-entre-quien]')")
    await escribir('[data-gasto-nombre]', 'Cena')
    await escribir('[data-gasto-importe]', '84')
    await ev("document.querySelector('[data-gasto-enviar]').click(); true")
    await a.esp(1500)
    const cc2 = await texto()
    debe(/Cena Solo para ti/.test(cc2) || /Cena.*Solo tú/.test(cc2), '1c', `un gasto solo para quien lo paga sale con el candado («Solo para ti») y no es del grupo (${cc2.slice(cc2.indexOf('Cena') - 5, cc2.indexOf('Cena') + 50)})`)
    // Ahora uno para Eric y Ana, pagado por Eric: del grupo
    await clic('/Añadir gasto/', "document.querySelector('[data-blk=\"extras\"]')")
    await a.esp(900)
    await clic('/Ana/', "document.querySelector('[data-gasto-entre-quien]')")
    await escribir('[data-gasto-nombre]', 'Taxi')
    await escribir('[data-gasto-importe]', '20')
    await ev("document.querySelector('[data-gasto-enviar]').click(); true")
    await a.esp(1500)
    const cc3 = await texto()
    debe(/Taxi\s+E?\s*Pagó Eric/.test(cc3), '1c', `y uno para dos entra en las cuentas del grupo («Pagó Eric»): (${cc3.slice(cc3.indexOf('Taxi') - 5, cc3.indexOf('Taxi') + 50)})`)
    await cerrarPresupuesto()

    /* 1c · la reserva pregunta según lo que se añade (05, 05b) */
    await abrirPresupuesto()
    await clic('/Coliseo, Foro y Palatino/', "document.querySelector('[aria-labelledby=\"titulo-presupuesto\"]')")
    await a.esp(1800)
    await ev("document.querySelector('[data-para-quien]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(500)
    const r1 = await ev("document.querySelector('[data-para-quien]')?.innerText.replace(/\\s+/g, ' ') ?? 'SIN'")
    debe(/¿Para quién has comprado la entrada\?/.test(r1) && /Para 2 personas: entra en las cuentas del grupo\./.test(r1), '1c', `en la entrada: «¿Para quién has comprado la entrada?» y la línea (${r1})`)
    debe(!/Para mí|Para todos/.test(r1), '1c', 'sin [Para todos] / [Para mí]')
    await a.captura(foto('m2_05b_reserva_cada_uno'))
    await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Cerrar/.test(x.getAttribute('aria-label') || '')); b?.click(); return true })()")
    await a.esp(500)
    await cerrarPresupuesto()

    /* 1b · la reserva en la cuenta conjunta (04, 04b) */
    await preparar({ yo: 'eric', modo: 'conjunta' })
    await abrirPresupuesto()
    await clic('/Coliseo, Foro y Palatino/', "document.querySelector('[aria-labelledby=\"titulo-presupuesto\"]')")
    await a.esp(1800)
    await ev("document.querySelector('[data-para-quien]')?.scrollIntoView({ block: 'center' }); true")
    await a.esp(500)
    const r2 = await ev("document.querySelector('[data-para-quien]')?.innerText.replace(/\\s+/g, ' ') ?? 'SIN'")
    debe(/Para los dos/.test(r2) && /Solo para mí/.test(r2) && !/Eric|Ana/.test(r2), '1b', `en la reserva de la cuenta conjunta: «Para los dos» y «Solo para mí», sin nombres (${r2})`)
    debe((await ev("document.querySelector('[data-para-quien] [data-opcion=\"todos\"]')?.getAttribute('data-elegida')")) === '1', '1b', '«Para los dos» sale marcada')
    await a.captura(foto('m2_04_reserva_para_los_dos'))
    await clic('/Solo para mí/', "document.querySelector('[data-para-quien]')")
    await a.esp(400)
    debe(/Solo lo ves tú\./.test(await ev("document.querySelector('[data-para-quien]')?.innerText ?? ''")), '1b', '«Solo para mí» enseña «Solo lo ves tú.»')
    await a.captura(foto('m2_04b_reserva_solo_para_mi'))
    await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Cerrar/.test(x.getAttribute('aria-label') || '')); b?.click(); return true })()")
    await cerrarPresupuesto()
  } finally {
    a.cerrar()
  }
  // Design al lado: se hacen con _10n7_m2_design.mjs (10n7_design_cuentas_*.jpg)
  debe(['02a', '02b', '04b', '05', '08'].every((n) => fs.existsSync(path.resolve(`docs/dias/capturas_jutrip/10n7_design_cuentas_${n}.jpg`))), 'capturas', 'las capturas de Design de «Cuentas Modo» están al lado')
  void capturarDesign
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
