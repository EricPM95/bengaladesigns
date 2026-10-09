// La prueba de la Tanda 6v (PROMPT_TANDA6V_PARA_PEGAR.md): RESERVAS, segunda vuelta.
//   node scripts/destino/pruebaTanda6v.mjs [out=docs/dias/PRUEBA_TANDA6V.md]
// Hace falta el servidor de la app encendido (http://localhost:8787). Pinta RESERVAS con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. [Reservar entrada] / [Reservar Free Tour] no abren la ficha en su pestaña «Entradas» (o abren la tienda), o las de «Ver n más» llevan «Añádela»; «Ver n más» sale sin haber más; el bloque abierto no tiene «EN TU RUTA»;
//   2. la zona del alojamiento sigue siendo una fila de fichas en vez del campo «Elige tu zona» (+ [Buscar alojamiento] a la vista; con zona elegida, «Te alojas en … · Cambiar»; gratis, solo [Buscar alojamiento]);
//   3. «¿Ya tienes una? Añádela» no va dentro de la tarjeta de «Excursiones desde …», debajo de [Ver excursiones]; o con día de excursión sale más de un «Añádela»;
//   4. queda en la app la hoja de «no encaja bien en el día» (regla 17) en cualquier sitio;
//   5. dos reservas que se pisan no avisan (hoja y campana) con los nombres de las dos reservas, o avisan sin pisarse, o el aviso no se va al arreglarlas;
//   6. en la versión gratis sale «¿Ajustamos tu ruta a tu vuelo?» o sus avisos.
import fs from 'node:fs'
import path from 'node:path'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const out = args.out ?? 'docs/dias/PRUEBA_TANDA6V.md'
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

const { M, ponerVersion, limpiar } = await prepararSSR('scripts/destino/_6v_entrada.tsx')
const { createElement, renderToStaticMarkup, ReservasPanel, EntradasYFreeTour, useRouteStore, fetchDestinationExcursions, fetchArrivalInfo, reservationOverlaps, useAppNotices } = M
const D = findPipelineV2Data('Roma')
const FT = D.default_free_tour.name
const info = await fetchDestinationExcursions('Roma')
await fetchArrivalInfo('Roma')
const aTexto = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

async function viaje(dias, { fechas = true, interruptor = false } = {}) {
  const inicio = fechas ? '2027-03-10' : null
  const dayPlans = []
  for (let n = 1; n <= dias; n++) {
    const d = await buildDayBlockV3(D, dias + 1, true, n, null, inicio ?? undefined, [], ['imprescindibles', 'free_tour'], {
      city: 'Roma', scheduler: 'v3', engine: 'v4', mediaJornada: null, month: inicio ? null : 2, season: null, diaCuatro: dias >= 4 ? 'roma' : null, entradas: {}, reservasGrandes: [], forceOrder: null,
    })
    dayPlans.push({
      id: `d${n}`, dayNumber: n, city: 'Roma', title: d.title ?? `Día ${n}`, dayType: 'normal', colorIndex: n - 1, meals: [], excursions: [],
      stops: (d.stops ?? []).map((s, i) => ({ id: `d${n}s${i}`, time: s.suggested_time ?? '10:00', name: s.name, description: '', durationMinutes: s.duration_minutes ?? 60, coordinates: { lat: s.latitude ?? 0, lng: s.longitude ?? 0 }, photoUrl: '', isFreeTour: s.name === FT || Boolean(s.is_free_tour), passThrough: Boolean(s.pass_through), ...(s.visit_mode ? { visitMode: s.visit_mode } : {}) })),
    })
  }
  if (interruptor && dias >= 4 && info.excursions[0]) Object.assign(dayPlans[3], { dayType: 'excursion', selectedExcursionId: info.excursions[0].id, excursions: [info.excursions[0]] })
  return {
    id: `v6v-${dias}-${fechas ? 'f' : 'n'}${interruptor ? 'i' : ''}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: {},
    days: dayPlans,
    answers: { dateRange: fechas ? { start: inicio, end: new Date(Date.parse(`${inicio}T12:00:00Z`) + (dias - 1) * 86400000).toISOString().slice(0, 10) } : undefined, days: dias },
    transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
}

const estadoBase = { screen: 'route', mode: 'bookings', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {} }
function pinta(route, version, reservas = []) {
  ponerVersion(version)
  useRouteStore.setState({ ...estadoBase, route, reservations: reservas })
  const html = renderToStaticMarkup(createElement(ReservasPanel, { route, onClose() {} }))
  return { html, texto: aTexto(html) }
}
const bloqueDe = (html, id) => {
  const a = html.indexOf(`data-blk="${id}"`)
  if (a < 0) return ''
  const siguientes = ['llegada', 'aloj', 'entradas', 'excursiones', 'util', 'resumen'].filter((x) => x !== id).map((x) => html.indexOf(`data-blk="${x}"`)).filter((i) => i > a)
  return html.slice(a, siguientes.length > 0 ? Math.min(...siguientes) : undefined)
}

const route5 = await viaje(5)
const route3 = await viaje(3)

// ── 1. Las entradas: el bloque abierto, la ficha en vez de la tienda, «Ver más» sin «Añádela» ────────────────────────────────────────────────────
{
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route: route3 })
  const html = renderToStaticMarkup(createElement(EntradasYFreeTour, { route: route3, info, abierto: true, onToggle() {} }))
  const t = aTexto(html)
  debe(/EN TU RUTA|En tu ruta/i.test(t.split('\n').slice(0, 12).join('\n')), '1 entradas', `el bloque abierto no tiene el título «EN TU RUTA» (${plano(t).slice(0, 200)})`)
  const masM = t.match(/Ver (\d+) más/)
  debe(Boolean(masM) && Number(masM[1]) >= 1, '1 entradas', `no sale «Ver n más» en un viaje de 3 días (le faltan entradas de la lista) (${plano(t).slice(-200)})`)
  debe(!/href=/.test(html), '1 entradas', 'el bloque de entradas lleva enlaces a una tienda (href)')
}
{
  // Sin entradas de más (todas las de la lista en la ruta): la línea «Ver n más» no sale. Se simula con una lista de datos de dos nombres.
  ponerVersion('completa')
  const pocos = { ...info, entradasOrden: { arriba: [info.entradasOrden.arriba[0]], mas: [] } }
  useRouteStore.setState({ ...estadoBase, route: route5 })
  const t = aTexto(renderToStaticMarkup(createElement(EntradasYFreeTour, { route: route5, info: pocos, abierto: true, onToggle() {} })))
  debe(!/Ver \d+ más/.test(t), '1 entradas', 'sale «Ver n más» sin haber más entradas')
}
const codigoEntradas = fs.readFileSync('src/components/route/reservas/EntradasYFreeTour.tsx', 'utf8')
debe(/onBuy=\{\(\) => setFicha\(item\)\}/.test(codigoEntradas) && !/openTicketShop|buyHref/.test(codigoEntradas), '1 entradas', 'EntradasYFreeTour.tsx no abre la ficha con [Reservar] (o todavía abre la tienda)')
{
  const dentroMas = codigoEntradas.slice(codigoEntradas.indexOf('masEntradas.map('))
  debe(!/onAdd=/.test(dentroMas.slice(0, dentroMas.indexOf('))}'))), '1 entradas', 'las de «Ver n más» llevan «Añádela» (onAdd)')
}
const codigoFicha = fs.readFileSync('src/components/route/reservas/FichaEntrada.tsx', 'utf8')
debe(/initialTab="tickets"/.test(codigoFicha) && /StopDetailSheet/.test(codigoFicha), '1 entradas', 'FichaEntrada.tsx no abre la ficha en su pestaña «Entradas»')

// ── 2. La zona del alojamiento ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const zonas = info.zonasAlojamiento
  const sinZona = bloqueDe(pinta(route5, 'completa').html, 'aloj')
  const t = aTexto(sinZona)
  debe(/¿En qué zona te alojas\?/.test(t) && /Elige tu zona/.test(t) && /Buscar alojamiento/.test(t), '2 zona', `sin zona: falta la línea, el campo o [Buscar alojamiento] (${plano(t)})`)
  for (const zona of zonas) debe(!t.includes(zona.nombre), '2 zona', `sin zona: salen las fichas de las zonas («${zona.nombre}»)`)
  const prati = pinta({ ...route5, accommodationZone: 'prati' }, 'completa')
  const tp = aTexto(bloqueDe(prati.html, 'aloj'))
  debe(/Te alojas en Prati/.test(tp) && /Cambiar/.test(tp) && !/Buscar alojamiento/.test(tp) && !/Elige tu zona/.test(tp), '2 zona', `con zona: no es «Te alojas en Prati · Cambiar» (${plano(tp)})`)
  const nose = pinta({ ...route5, accommodationZone: 'nose' }, 'completa')
  const tn = aTexto(bloqueDe(nose.html, 'aloj'))
  debe(/Aún no lo sé/.test(tn) && /Buscar alojamiento/.test(tn) && !/Te alojas en/.test(tn), '2 zona', `«Aún no lo sé»: faltan el campo o [Buscar alojamiento] (${plano(tn)})`)
  const gratis = pinta(route5, 'gratis')
  const tg = aTexto(bloqueDe(gratis.html, 'aloj'))
  debe(/Buscar alojamiento/.test(tg) && !/¿En qué zona/.test(tg) && !/Elige tu zona/.test(tg), '2 zona', `gratis: debe tener solo [Buscar alojamiento] (${plano(tg)})`)
  debe(!/<h2[^>]*>[^<]*zona/.test(gratis.html), '2 zona', 'gratis: sale la hoja de zona')
}
const codigoAloj = fs.readFileSync('src/components/route/reservas/AlojamientoReservas.tsx', 'utf8')
debe(/tipo="lista"/.test(codigoAloj) && /Guardar/.test(codigoAloj) && /TimeListWheel/.test(codigoAloj), '2 zona', 'la hoja de la zona no es una rueda con [Guardar]')

// ── 3. Excursiones ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
for (const dias of [4, 5]) {
  const sin = pinta(await viaje(dias), 'completa')
  const bloque = bloqueDe(sin.html, 'excursiones')
  const t = aTexto(bloque)
  const iVer = t.indexOf('Ver excursiones')
  const iAn = t.indexOf('Añádela')
  debe(iVer >= 0 && iAn > iVer, '3 excursiones', `${dias} días sin día de excursión: «Añádela» no va debajo de [Ver excursiones] (${plano(t)})`)
  debe((t.match(/Añádela/g) ?? []).length === 1, '3 excursiones', `${dias} días sin día de excursión: sale más de un «Añádela»`)
  // Dentro de la misma tarjeta: el HTML entre [Ver excursiones] y «Añádela» no cierra la tarjeta (sin salir de su contenedor de 88 px de alto mínimo).
  const iHtmlVer = bloque.indexOf('Ver excursiones')
  const iHtmlAn = bloque.indexOf('Añádela')
  debe(iHtmlAn > iHtmlVer && !/min-h-\[88px\]/.test(bloque.slice(iHtmlVer, iHtmlAn)) && /<\/button><button[^>]*>¿Ya tienes una\?/.test(bloque), '3 excursiones', `${dias} días: «Añádela» no está dentro de la tarjeta, junto al botón`)
  const con = pinta(await viaje(dias, { interruptor: true }), 'completa')
  const tc = aTexto(bloqueDe(con.html, 'excursiones'))
  debe((tc.match(/Añádela/g) ?? []).length === 1 && /¿Ya la tienes\?/.test(tc) && /Ver otras excursiones/.test(tc), '3 excursiones', `${dias} días con día de excursión: ${plano(tc)}`)
}

// ── 4. Fuera la hoja de «no encaja bien» ─────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const encontrados = []
  const recorre = (dir) => {
    for (const nombre of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = path.join(dir, nombre.name)
      if (nombre.isDirectory()) recorre(ruta)
      else if (/\.(tsx?|js)$/.test(nombre.name)) {
        const t = fs.readFileSync(ruta, 'utf8')
        if (/no encaja bien|Dejar las \{|rule17|setRule17|Te proponemos las/.test(t)) encontrados.push(ruta)
      }
    }
  }
  recorre('src')
  debe(encontrados.length === 0, '4 regla 17', `queda la hoja de «no encaja bien» en: ${encontrados.join(', ')}`)
  debe(!/ReservationAdvice|plan\??\.consejo|\.consejo\b/.test(fs.readFileSync('src/components/route/reservas/AddReservationSheet.tsx', 'utf8')), '4 regla 17', 'AddReservationSheet.tsx todavía lee el consejo de la regla 17')
}

// ── 5. Dos reservas que se pisan ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const res = (id, refId, name, placeNames, dia, time) => ({ id, kind: 'entrada', refId, name, placeNames, dateIso: dia, dayNumber: null, time })
const diaDe = (route, nombre) => {
  const i = route.days.findIndex((d) => d.stops.some((s) => s.name === nombre && !s.passThrough))
  return i >= 0 ? new Date(Date.parse(`${route.answers.dateRange.start}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10) : null
}
{
  const dia = diaDe(route5, FT)
  const museos = 'Museos Vaticanos y Capilla Sixtina'
  const v = (time) => [res('r-ft', 'Free Tour', FT, [FT], dia, '10:00'), res('r-mu', museos, museos, [museos], dia, time)]
  const casos = [
    ['10:00 y 11:45 el mismo día', v('11:45'), 1],
    ['10:00 y 14:00 el mismo día', v('14:00'), 0],
    ['10:00 y 10:00 el mismo día', v('10:00'), 1],
    ['10:00 y 12:30 (justo cuando acaba)', v('12:30'), 0],
  ]
  for (const [nombre, reservas, esperadas] of casos) {
    const f = reservationOverlaps(route5, reservas)
    debe(f.length === esperadas, '5 solape', `${nombre}: ${f.length} avisos y deberían ser ${esperadas}`)
    if (esperadas === 1) {
      debe(f[0].text === `Tu Free Tour y tu entrada a ${museos} coinciden. Revisa una de las dos reservas.`, '5 solape', `${nombre}: el texto no es el del encargo («${f[0].text}»)`)
      debe(/^solape:/.test(f[0].id), '5 solape', `${nombre}: el aviso no tiene un id estable`)
    }
  }
  // Otro día: no se pisan. Dos entradas: los dos nombres. Una excursión: no cuenta.
  const otroDia = new Date(Date.parse(`${dia}T12:00:00Z`) + 86400000).toISOString().slice(0, 10)
  debe(reservationOverlaps(route5, [res('a', 'Free Tour', FT, [FT], dia, '10:00'), res('b', museos, museos, [museos], otroDia, '10:30')]).length === 0, '5 solape', 'dos reservas de días distintos avisan')
  const dos = reservationOverlaps(route5, [res('a', 'Panteón', 'Panteón', ['Panteón'], dia, '10:00'), res('b', museos, museos, [museos], dia, '10:15')])
  debe(dos.length === 1 && dos[0].text === `Tu entrada a Panteón y tu entrada a ${museos} coinciden. Revisa una de las dos reservas.`, '5 solape', `dos entradas: ${dos[0]?.text}`)
  debe(reservationOverlaps(route5, [{ ...res('e', 'x', 'Excursión a Pompeya', [], dia, '10:00'), kind: 'excursion' }, res('b', museos, museos, [museos], dia, '10:30')]).length === 0, '5 solape', 'una excursión cuenta como solape')
  debe(reservationOverlaps(route5, [res('a', 'Free Tour', FT, [FT], '2030-01-01', '10:00'), res('b', museos, museos, [museos], '2030-01-01', '10:30')]).length === 0, '5 solape', 'dos reservas fuera del viaje avisan')
  // La campana: el aviso sale mientras se pisen y se va solo al arreglarlas.
  const avisos = (reservas) => {
    ponerVersion('completa')
    useRouteStore.setState({ ...estadoBase, route: route5, reservations: reservas })
    let items = []
    renderToStaticMarkup(createElement(() => { items = useAppNotices().items; return null }))
    return items.filter((item) => /^solape:/.test(item.id))
  }
  const pisadas = avisos(v('11:45'))
  debe(pisadas.length === 1 && pisadas[0].kind === 'warning' && pisadas[0].action === 'open-reservas' && pisadas[0].actionLabel === 'Ver mis reservas' && /coinciden/.test(pisadas[0].text), '5 solape', `la campana no avisa bien (${JSON.stringify(pisadas)})`)
  debe(avisos(v('14:00')).length === 0, '5 solape', 'la campana sigue avisando al arreglarlo')
  const codigoAviso = fs.readFileSync('src/components/route/reservas/AvisoSolape.tsx', 'utf8')
  debe(/Ver mis reservas/.test(codigoAviso) && /setMode\('bookings'\)/.test(codigoAviso), '5 solape', 'la hoja del aviso no lleva [Ver mis reservas]')
  debe(/<AvisoSolape \/>/.test(fs.readFileSync('src/App.tsx', 'utf8')), '5 solape', 'la hoja del aviso no está montada en la app')
}

// ── 6. La versión gratis nunca enseña «¿Ajustamos tu ruta a tu vuelo?» ───────────────────────────────────────────────────────────────────────
for (const [nombre, route] of [['sin horas', route5], ['con horas', { ...route5, arrivalFlightTime: '11:20', arrivalPointId: 'fco', departureFlightTime: '18:05', departurePointId: 'cia' }]]) {
  const t = pinta(route, 'gratis').texto
  debe(!/¿Ajustamos tu ruta|Ajustamos|Adaptar tu ruta|vuelo llega a las/.test(t), '6 gratis', `gratis ${nombre}: sale algo de «¿Ajustamos tu ruta a tu vuelo?» (${plano(t).slice(0, 160)})`)
}
debe(/\{pago && adjustSheetOpen && <FlightAdjustSheet/.test(fs.readFileSync('src/components/route/ReservasPanel.tsx', 'utf8')), '6 gratis', 'la ventana del vuelo no está protegida por el interruptor de pago')

const resumen = [...porRegla.entries()].map(([r, n]) => `${r}: ${n}`).join(' · ')
const md = [
  '# Prueba de la Tanda 6v',
  '',
  `Comprobaciones: ${comprobaciones} · fallos: ${fallos.length}${resumen ? ` (${resumen})` : ''}`,
  '',
  ...(fallos.length ? ['## Fallos', ...fallos.slice(0, 200).map((f) => `- [${f.regla}] ${f.texto}`)] : ['Sin fallos.']),
  '',
].join('\n')
fs.writeFileSync(out, md)
console.log(`6v: ${comprobaciones} comprobaciones, ${fallos.length} fallos${resumen ? ` (${resumen})` : ''}`)
for (const f of fallos.slice(0, 20)) console.log(` - [${f.regla}] ${f.texto}`)
limpiar()
process.exit(fallos.length ? 1 : 0)
