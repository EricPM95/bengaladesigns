// La prueba de la Tanda 6s (PROMPT_TANDA6S_PARA_PEGAR.md): la pestaña RESERVAS nueva, en su versión gratis y en la de pago.
//   node scripts/destino/pruebaTanda6s.mjs [out=docs/dias/PRUEBA_TANDA6S.md] [fallos=ruta.txt]
// Hace falta el servidor de la app encendido (http://localhost:8787): de él salen los datos del destino que usa la pestaña, igual que en la app.
// Pinta el panel RESERVAS en el servidor (react-dom/server, con el código de verdad de la app, empaquetado con esbuild) y mira el texto. Da fallo si:
//   1. con ?version=gratis sale algo de pago (Llegada y vuelta, el resumen, la zona del alojamiento, los avisos de vuelo) en RESERVAS;
//   2. sale «null», «undefined» o «NaN» en RESERVAS, en cualquier estado (vacío, a medias, todo hecho) y con o sin fechas;
//   3. el orden de los bloques no es: resumen · Llegada y vuelta · Alojamiento · Entradas y Free Tour · Excursiones · Útil;
//   4. las entradas: «En tu ruta» no son justo las de las paradas por dentro (y el Free Tour si va), en el orden de los datos del destino; «Ver n más» no son justo las demás; el «x de n» (y «Entradas x/n» del resumen) no cuenta solo las de «En tu ruta»; en viajes de 1 a 6 días;
//   5. el bloque de excursiones sale (o no) según los días del viaje (`excursiones_desde_dias`) y el interruptor;
//   6. quitar una reserva mueve algún día;
//   7. sale el nombre de un proveedor en un texto del viajero, o «centro» suelto.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6S.md'
const API = process.env.API_URL ?? 'http://localhost:8787'
const fallos = []
const porRegla = new Map()
let comprobaciones = 0
const falla = (regla, texto) => {
  porRegla.set(regla, (porRegla.get(regla) ?? 0) + 1)
  if (fallos.length < 300) fallos.push({ regla, texto })
}
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) falla(regla, texto)
}

// ── El panel empaquetado con esbuild y los sitios del navegador que mira el código (scripts/destino/_ssr.mjs) ─────────────────────────────────
const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6s_entrada.tsx')
const { createElement, renderToStaticMarkup, ReservasPanel, useRouteStore, fetchDestinationExcursions, fetchArrivalInfo, buildEntradasBloque, hasEnoughDaysForExcursions } = M

const D = findPipelineV2Data('Roma')
const FT = D.default_free_tour.name
const info = await fetchDestinationExcursions('Roma')
await fetchArrivalInfo('Roma')
const orden = info.entradasOrden
const desde = info.fromDays ?? 4
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

// ── Un viaje a Roma de 1 a 6 días: los días de verdad del motor, vestidos como los del cliente (solo lo que mira RESERVAS) ────────────────────
async function viaje(dias, { fechas, ida = 'flight', vuelta = null, freeTour = true, interruptor = false }) {
  const inicio = fechas ? '2027-03-10' : null
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const d = await buildDayBlockV3(D, dias + 1, freeTour, n, null, inicio ?? undefined, [], freeTour ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: inicio ? null : 2, season: null, diaCuatro: dias >= 4 ? 'roma' : null, entradas: {}, reservasGrandes: [], forceOrder: null,
    })
    dayPlans.push({
      id: `d${n}`, dayNumber: n, city: 'Roma', title: d.title ?? `Día ${n}`, dayType: 'normal', colorIndex: n - 1, meals: [], excursions: [],
      stops: (d.stops ?? []).map((s, i) => ({ id: `d${n}s${i}`, time: s.suggested_time ?? '10:00', name: s.name, description: '', durationMinutes: s.duration_minutes ?? 60, coordinates: { lat: s.latitude ?? 0, lng: s.longitude ?? 0 }, photoUrl: '', isFreeTour: s.name === FT || Boolean(s.is_free_tour), passThrough: Boolean(s.pass_through), ...(s.visit_mode ? { visitMode: s.visit_mode } : {}) })),
    })
  }
  // El día 4 con excursión elegida (el interruptor puesto en «Excursión»), si el viaje lo pide.
  if (interruptor && dias >= 4) {
    const exc = info.excursions[0]
    if (exc) Object.assign(dayPlans[3], { dayType: 'excursion', selectedExcursionId: exc.id, excursions: [exc] })
  }
  return {
    id: `viaje-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: {},
    days: dayPlans,
    answers: { dateRange: fechas ? { start: inicio, end: addDays(inicio, dias - 1) } : undefined, days: dias },
    transportContext: { transport_option: { id: ida }, archetype: null },
    ...(vuelta ? { returnTransportOptionId: vuelta } : {}),
  }
}

const aTexto = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s*\n\s*/g, '\n')
const bloquesDe = (html) => [...html.matchAll(/data-blk="([a-z]+)"/g)].map((m) => m[1])

function pinta(route, { version, reservas = [] }) {
  ponerVersion(version)
  useRouteStore.setState({ route, screen: 'route', mode: 'bookings', reservations: reservas, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {} })
  const html = renderToStaticMarkup(createElement(ReservasPanel, { route, onClose: () => {} }))
  return { html, texto: aTexto(html), bloques: bloquesDe(html) }
}

const PAGO = [/Llegada y vuelta/, /Tu viaje a /, /listo\b/i, /Falta la (ida|vuelta)/, /Eliminar vuelo/, /Aún no lo sé/, /Centro \(Panteón/, /Plaza de España \(/, /¿Ajustamos tu ruta/, /AÑADIR VUELO/i]
const PROVEEDORES = /Civitatis|Stay22|Booking\.com|GetYourGuide|Viator|Skyscanner|Rentalcars|Holafly|Airalo|Heymondo|N26|Iati|Mapfre/i
const BANDERAS = /null|undefined|NaN/

// El punto de cada medio (ids de _llegada.json): el primero de los dos, y el otro para la vuelta.
const PUNTOS = { flight: ['fco', 'cia'], train: ['termini', 'tiburtina'], bus: ['tibus', 'termini'], ferry: ['civitavecchia', 'civitavecchia'], own_vehicle: [null, null] }
const ESTADOS = (route) => {
  const rango = route.answers.dateRange
  const idaId = route.transportContext.transport_option?.id ?? 'flight'
  const vueltaId = route.returnTransportOptionId ?? idaId
  const hecho = {
    ...route,
    arrivalFlightTime: '11:15', departureFlightTime: '18:05', arrivalPointId: PUNTOS[idaId][0], departurePointId: PUNTOS[vueltaId][1], accommodationZone: 'prati',
  }
  const aMedias = { ...route, arrivalFlightTime: '09:40', arrivalPointId: null, accommodationZone: 'nose' }
  const reservas = [
    { id: 'r1', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: rango?.start ?? null, dayNumber: rango ? null : 1, time: '10:00' },
    { id: 'r2', kind: 'entrada', refId: 'Free Tour', name: FT, placeNames: [FT], dateIso: rango?.start ?? null, dayNumber: rango ? null : 1, time: '12:00' },
  ]
  return [
    ['vacío', route, []],
    ['a medias', aMedias, [reservas[0]]],
    ['todo hecho', hecho, reservas],
  ]
}

const pila = (error) => String(error.stack).split('\n').slice(1, 6).map((x) => x.trim().slice(0, 70)).join(' | ')
const lineas = []
const nota = (t) => lineas.push(t)

// ── Los viajes de 1 a 6 días, con y sin fechas, gratis y de pago ──────────────────────────────────────────────────────────────────────────────
for (const dias of [1, 2, 3, 4, 5, 6]) {
  for (const fechas of [true, false]) {
    const base = await viaje(dias, { fechas })
    for (const [estado, route, reservas] of ESTADOS(base)) {
      for (const version of ['gratis', 'completa']) {
        const etiqueta = `${dias} días · ${fechas ? 'con' : 'sin'} fechas · ${estado} · ${version}`
        let r
        try {
          r = pinta(route, { version, reservas })
        } catch (error) {
          falla('2 pinta', `${etiqueta}: el panel no se pinta (${error.message}) ${pila(error)}`)
          continue
        }
        // 2. nada de null / undefined / NaN
        debe(!BANDERAS.test(r.texto), '2 null/undefined', `${etiqueta}: sale «${r.texto.match(BANDERAS)?.[0]}» en RESERVAS`)
        // 7. proveedores y «centro» suelto
        debe(!PROVEEDORES.test(r.texto), '7 proveedor', `${etiqueta}: sale un proveedor («${r.texto.match(PROVEEDORES)?.[0]}»)`)
        const centroSuelto = [...r.texto.matchAll(/(^|[^\wÀ-ÿ])centro(?![\wÀ-ÿ])/gi)].filter((m) => !/Centro \(/.test(r.texto.slice(m.index, m.index + 12)))
        debe(centroSuelto.length === 0, '7 centro suelto', `${etiqueta}: sale «centro» suelto`)
        // 3. el orden
        const orde = ['resumen', 'llegada', 'aloj', 'entradas', 'excursiones', 'util']
        const pos = r.bloques.map((b) => orde.indexOf(b)).filter((x) => x >= 0)
        debe(pos.every((x, i) => i === 0 || x > pos[i - 1]), '3 orden', `${etiqueta}: bloques en desorden (${r.bloques.join(' · ')})`)
        debe(r.bloques.includes('aloj') && r.bloques.includes('entradas'), '3 orden', `${etiqueta}: faltan Alojamiento o Entradas (${r.bloques.join(' · ')})`)
        // 1. la versión gratis, sin nada de pago
        if (version === 'gratis') {
          for (const re of PAGO) debe(!re.test(r.texto), '1 pago en gratis', `${etiqueta}: sale algo de pago (${re})`)
          debe(!r.bloques.includes('llegada') && !r.bloques.includes('resumen'), '1 pago en gratis', `${etiqueta}: salen los bloques de pago (${r.bloques.join(' · ')})`)
        } else {
          debe(r.bloques.includes('llegada'), '1 pago ausente', `${etiqueta}: en la versión de pago no sale «Llegada y vuelta»`)
          debe(r.bloques.includes('resumen') || /Tu viaje a Roma/.test(r.texto), '1 pago ausente', `${etiqueta}: en la versión de pago no sale el resumen`)
        }
        // 4. las entradas (Tanda 6v): «En tu ruta» (las de las paradas que se visitan por dentro y el Free Tour si va; son las que cuentan) y «Ver n más» (las demás de la lista, que no cuentan)
        const bloque = buildEntradasBloque(route, orden, info.entradas, reservas)
        const lista = [...orden.arriba, ...orden.mas]
        const m = r.texto.match(/(\d+) de (\d+) reservadas/)
        if (bloque.enRuta.length > 0) debe(m && Number(m[2]) === bloque.enRuta.length && Number(m[1]) === bloque.enRuta.filter((x) => x.reservation).length, '4 entradas', `${etiqueta}: el bloque dice «${m?.[0]}» y en la ruta hay ${bloque.enRuta.length} (${bloque.enRuta.filter((x) => x.reservation).length} reservadas)`)
        else if (bloque.masEntradas.length > 0) debe(/Ninguna en tu ruta/.test(r.texto), '4 entradas', `${etiqueta}: sin entradas en la ruta, el bloque no lo dice`)
        const nombres = [...bloque.enRuta, ...bloque.masEntradas].map((x) => x.name)
        debe(nombres.length === lista.length && lista.every((nombre) => nombres.includes(nombre)), '4 entradas', `${etiqueta}: las dos partes no suman la lista del destino (${nombres.length} de ${lista.length})`)
        const idx = (arr) => arr.map((x) => lista.indexOf(x.name))
        debe(idx(bloque.enRuta).every((x, i, a) => x >= 0 && (i === 0 || x > a[i - 1])), '4 entradas', `${etiqueta}: las de «En tu ruta» no siguen el orden de los datos`)
        debe(idx(bloque.masEntradas).every((x, i, a) => x >= 0 && (i === 0 || x > a[i - 1])), '4 entradas', `${etiqueta}: las de «Ver n más» no siguen el orden de los datos`)
        const dentro = new Set(route.days.flatMap((d) => d.stops.filter((s) => !s.passThrough && !s.isFreeTour && s.visitMode !== 'fuera').map((s) => s.name)))
        const hayFreeTour = route.days.some((d) => d.stops.some((s) => s.isFreeTour))
        for (const x of bloque.enRuta) debe(x.reservation || (x.isFreeTour ? hayFreeTour : x.placeNames.some((p) => dentro.has(p))), '4 entradas', `${etiqueta}: «${x.name}» sale en «En tu ruta» y no está por dentro en la ruta`)
        for (const x of bloque.masEntradas) debe(!x.reservation && !x.isFreeTour && !x.placeNames.some((p) => dentro.has(p)), '4 entradas', `${etiqueta}: «${x.name}» sale en «Ver más» y sí está en la ruta (o está reservada)`)
        for (const nombre of lista) {
          const grupo = info.entradas.find((e) => e.name === nombre)
          const lugares = grupo?.places ?? [nombre]
          const esta = lugares.some((p) => dentro.has(p)) || (nombre.startsWith('Free Tour') && hayFreeTour)
          const enParte = bloque.enRuta.some((x) => x.name === nombre)
          debe(!esta || enParte, '4 entradas', `${etiqueta}: «${nombre}» está por dentro en la ruta y no sale en «En tu ruta»`)
        }
        // El resumen de arriba (de pago) cuenta lo mismo: «Entradas x/n» con las de «En tu ruta».
        if (version === 'completa' && bloque.enRuta.length > 0) debe(new RegExp(`Entradas ${bloque.enRuta.filter((x) => x.reservation).length}/${bloque.enRuta.length}`).test(r.texto), '4 entradas', `${etiqueta}: la ficha del resumen no dice «Entradas ${bloque.enRuta.filter((x) => x.reservation).length}/${bloque.enRuta.length}»`)
        // 5. las excursiones: según los días del viaje
        const deberia = hasEnoughDaysForExcursions(route, desde) && info.excursions.length > 0
        debe(r.bloques.includes('excursiones') === deberia, '5 excursiones', `${etiqueta}: el bloque de excursiones ${r.bloques.includes('excursiones') ? 'sale' : 'no sale'} y con ${dias} días ${deberia ? 'debería' : 'no debería'} (desde ${desde})`)
        if (version === 'completa' && estado === 'todo hecho' && fechas && dias === 5) nota(`- ${etiqueta}: bloques ${r.bloques.join(' · ')}; entradas en la ruta ${bloque.enRuta.length}, de más ${bloque.masEntradas.length}`)
      }
    }
  }
}

// ── Las excursiones con el interruptor: el día 4 en «Excursión» enseña la tarjeta de esa excursión; sin él, la entrada general ──────────────
for (const dias of [4, 5, 6]) {
  const con = await viaje(dias, { fechas: true, interruptor: true })
  const sin = await viaje(dias, { fechas: true, interruptor: false })
  let a
  let b
  try {
    a = pinta(con, { version: 'completa' })
    b = pinta(sin, { version: 'completa' })
  } catch (error) {
    falla('5 excursiones', `${dias} días con y sin interruptor: el panel no se pinta (${error.message}) ${String(error.stack).split('\n').slice(1, 4).join(' | ')}`)
    continue
  }
  debe(/En tu ruta el/.test(a.texto.slice(a.texto.indexOf('XCURSI'))) || /Excursi/.test(a.texto), '5 excursiones', `${dias} días con interruptor: no sale la tarjeta de la excursión del día`)
  debe(/Excursiones desde Roma/.test(b.texto), '5 excursiones', `${dias} días sin interruptor: no sale «Excursiones desde Roma»`)
  debe(!/Excursiones desde Roma/.test(a.texto), '5 excursiones', `${dias} días con interruptor: sale también «Excursiones desde Roma»`)
  // Nunca dos «Añádela» en el bloque de excursiones.
  for (const [nombre, r] of [['con interruptor', a], ['sin interruptor', b]]) {
    const trozo = r.html.slice(r.html.indexOf('data-blk="excursiones"'))
    const fin = trozo.indexOf('data-blk="util"')
    const solo = aTexto(fin > 0 ? trozo.slice(0, fin) : trozo)
    debe((solo.match(/Añádela/g) ?? []).length <= 1, '5 excursiones', `${dias} días ${nombre}: sale más de un «Añádela» en Excursiones`)
  }
}

// ── Los medios de la ida y de la vuelta: tren, autobús, barco y coche, con y sin la hora y el punto ──────────────────────────────────────────
for (const [ida, vuelta] of [['flight', 'train'], ['train', 'bus'], ['ferry', 'own_vehicle'], ['bus', 'flight'], ['own_vehicle', 'ferry']]) {
  for (const fechas of [true, false]) {
    const base = { ...(await viaje(3, { fechas, ida, vuelta })) }
    for (const [estado, route, reservas] of ESTADOS(base)) {
      const etiqueta = `medios ${ida}→${vuelta} · ${fechas ? 'con' : 'sin'} fechas · ${estado}`
      let r
      try {
        r = pinta(route, { version: 'completa', reservas })
      } catch (error) {
        falla('2 pinta', `${etiqueta}: el panel no se pinta (${error.message}) ${pila(error)}`)
        continue
      }
      if (args.ver && etiqueta.includes(args.ver)) console.log(`--- ${etiqueta}\n${r.texto}`)
      debe(!BANDERAS.test(r.texto), '2 null/undefined', `${etiqueta}: sale «${r.texto.match(BANDERAS)?.[0]}»`)
      debe(!PROVEEDORES.test(r.texto), '7 proveedor', `${etiqueta}: sale un proveedor`)
      // (Con algo hecho, la ficha cerrada enseña las dos líneas, la de la ida y la de la vuelta; sin fechas, «Día 1» y «Día 3» en lugar del día de la semana.)
      if (estado === 'todo hecho') {
        const plano = r.texto.replace(/\n/g, ' ').replace(/\s+/g, ' ')
        debe(/Ida ·/.test(plano) && /Vuelta ·/.test(plano), '2 líneas', `${etiqueta}: faltan las líneas de la ida o la vuelta (${plano.slice(plano.indexOf('Llegada y vuelta'), plano.indexOf('Llegada y vuelta') + 200)})`)
        if (!fechas) debe(/Ida · Día 1/.test(plano) && /Vuelta · Día 3/.test(plano), '2 líneas', `${etiqueta}: sin fechas las líneas no dicen «Día 1» y «Día 3»`)
      }
    }
  }
}

// ── Quitar una reserva no mueve ningún día (6): el servidor rehace ese día en su sitio ─────────────────────────────────────────────────────────
for (const dias of [2, 3, 5]) {
  const route = await viaje(dias, { fechas: true })
  const reserva = { id: 'rq', kind: 'entrada', refId: 'Coliseo, Foro y Palatino', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: route.days.find((d) => d.stops.some((s) => s.name === 'Coliseo'))?.id ? addDays('2027-03-10', route.days.findIndex((d) => d.stops.some((s) => s.name === 'Coliseo'))) : '2027-03-10', dayNumber: null, time: '10:00' }
  useRouteStore.setState({ route, screen: 'route', reservations: [reserva] })
  const antes = useRouteStore.getState().route.days.map((d) => `${d.id}|${d.dayNumber}|${d.city}|${d.dayType}`)
  const diasConColiseo = useRouteStore.getState().route.days.filter((d) => d.stops.some((s) => s.name === 'Coliseo')).map((d) => d.id)
  useRouteStore.getState().removeReservation('rq')
  await new Promise((resolve) => setTimeout(resolve, 6000))
  const estado = useRouteStore.getState()
  const despues = estado.route.days.map((d) => `${d.id}|${d.dayNumber}|${d.city}|${d.dayType}`)
  debe(antes.length === despues.length && antes.every((x, i) => x === despues[i]), '6 quitar reserva', `${dias} días: quitar la reserva cambia los días (${antes.join(' ')} → ${despues.join(' ')})`)
  debe(estado.reservations.length === 0, '6 quitar reserva', `${dias} días: la reserva sigue después de quitarla`)
  const ahora = estado.route.days.filter((d) => d.stops.some((s) => s.name === 'Coliseo')).map((d) => d.id)
  debe(diasConColiseo.length === 0 || ahora.every((id) => diasConColiseo.includes(id)), '6 quitar reserva', `${dias} días: el Coliseo pasa de ${diasConColiseo} a ${ahora}`)
}

// ── El informe ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const resumen = [...porRegla.entries()].map(([r, n]) => `${r}: ${n}`).join(' · ')
const md = [
  '# Prueba de la Tanda 6s',
  '',
  `Comprobaciones: ${comprobaciones} · fallos: ${fallos.length}${resumen ? ` (${resumen})` : ''}`,
  '',
  ...(lineas.length ? ['## Muestras', ...lineas, ''] : []),
  ...(fallos.length ? ['## Fallos', ...fallos.slice(0, 200).map((f) => `- [${f.regla}] ${f.texto}`)] : ['Sin fallos.']),
  '',
].join('\n')
fs.writeFileSync(out, md)
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
console.log(`6s: ${comprobaciones} comprobaciones, ${fallos.length} fallos${resumen ? ` (${resumen})` : ''}`)
for (const f of fallos.slice(0, 15)) console.log(` - [${f.regla}] ${f.texto}`)
limpiar()
process.exit(fallos.length ? 1 : 0)
