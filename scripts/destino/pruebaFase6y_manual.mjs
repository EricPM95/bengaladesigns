// La prueba de la Tanda 6y, parte C: el interior de los días de una ruta a mano («Quiero hacerla yo»).
//   node scripts/destino/pruebaFase6y_manual.mjs        (con el servidor de la app encendido en http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs) rutas a mano de 2, 3, 4 y 5 días, con y sin fechas, en gratis y de pago, con y sin reservas.
// Las rutas se construyen con un objeto literal (`planMode: 'manual'`, días `dayType: 'manual'` sin paradas), y las paradas las pone «el viajero» con las acciones del almacén. Da fallo si:
//   1. un día en blanco no lleva [Añadir parada] y [Añadir excursión]; o un día con paradas lleva [Añadir excursión]; o sale «Te falta…», «Si te sobra tiempo», una sugerencia de parada o la hoja de «¿Tienes algo ya reservado?»;
//   2. la app mete una parada que el viajero no eligió, o cambia el orden o el nº de paradas al añadir o quitar una reserva (también una reserva grande, y una en un día que no lleva el sitio);
//   3. una reserva no se queda a la hora del viajero (y solo ella lleva hora); sale una hora calculada a la vista; la excursión reservada borra paradas del viajero;
//   4. los días no se llaman por su fecha (con fechas) o «Día n» (sin ellas), o no se pueden renombrar y volver al nombre por defecto;
//   5. los avisos de la ruta nuestra («coinciden», «vas justo») no salen igual; o falta «EN TU RUTA» con las entradas de su ruta; o los enlaces de afiliado no llevan los mismos códigos;
//   6. lo añadido con precio no suma al presupuesto (el Free Tour, sin precio);
//   7. algo del motor se pone a rehacer, ajustar o recortar la ruta (rehacer días, HOY, «Quiero entrar», llegada y vuelta);
//   8. EXPLORAR de un día en blanco no va ordenado (más «me gusta» de verdad, imprescindibles, nivel 1, resto) o las que están en otro día no llevan «En tu día n» («En tu lun 13» con fechas).
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y_manual_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, DayList, ReservasPanel, PlaceExplorerScreen, stopFromPlace, ManualDayFooter, useRouteStore, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo, compareManualExplorer,
  EntradasYFreeTour, withCampaign, reservationOverlaps, construirPresupuesto, rehacerDiasSinTocar, rehacerDiaConReservas, checkTime, adjustDay, placeExcursionIn, renameDay, manualDayTitle,
} = M
await fetchArrivalInfo('Roma')
const info = await fetchDestinationExcursions('Roma')
const catalogo = (await fetchDestinationPlaces('Roma')).places
const D = findPipelineV2Data('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

// Las llamadas al motor: ninguna prueba de una ruta a mano debe hacerlas.
const fetchReal = globalThis.fetch
let llamadasAlMotor = []
globalThis.fetch = (url, opts) => {
  if (/rebuild-day|adjust-day|check-time|curated-day-inside|reservation-plan/.test(String(url))) llamadasAlMotor.push(String(url))
  return fetchReal(url, opts)
}

const INICIO = '2027-03-10' // miércoles
const SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const nombreDeFecha = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${SEMANA[d.getUTCDay()]} ${d.getUTCDate()} ${MES[d.getUTCMonth()]}` }

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
const rutaMano = (dias, { fechas }) => ({
  id: `m6y-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, planMode: 'manual',
  days: Array.from({ length: dias }, (_, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: 'manual', colorIndex: i })),
  answers: { dateRange: fechas ? { start: INICIO, end: sumaDias(INICIO, dias - 1) } : undefined, month: fechas ? undefined : 9, days: dias, companion: 'couple' },
  transportContext: { transport_option: { id: 'flight' }, archetype: null },
})
const lugar = (nombre) => catalogo.find((p) => p.name === nombre)
// Lo que «pone el viajero» en cada día, en SU orden (no el de nuestros días escritos): a propósito mezclado.
const ELIGE = [
  ['Fontana de Trevi', 'Coliseo', 'Trastevere', 'Panteón'],
  ['Museos Vaticanos y Capilla Sixtina', 'Piazza Navona', 'Basílica de San Pedro'],
  ['Galería Borghese', 'Plaza de España', 'Foro Romano y Palatino', 'Altar de la Patria'],
  ['Castillo de Sant\'Angelo', 'Boca de la Verdad', 'Termas de Caracalla'],
  ['Parque de Villa Borghese', 'Museos Capitolinos', 'Basílica de San Juan de Letrán'],
]
const poner = (route, versionPago, { hasta = route.days.length } = {}) => {
  ponerVersion(versionPago)
  useRouteStore.setState({ ...estadoBase, route, reservations: [] })
  const st = useRouteStore.getState()
  route.days.slice(0, hasta).forEach((day, i) => {
    for (const nombre of ELIGE[i % ELIGE.length]) if (lugar(nombre)) st.addPlaceToDay(day.id, stopFromPlace(lugar(nombre), 'foto'), null)
  })
  return useRouteStore.getState().route
}
const pintaDias = (route, abierto) => aTexto(renderToStaticMarkup(createElement(DayList, { route, activeDayId: abierto, onSelectDay() {}, showAllDaysOnMap: false })))
const nombresDe = (route) => route.days.map((d) => d.stops.map((s) => s.name))
const MALOS = [/Te falta/i, /Si te sobra tiempo/i, /Segunda visita/i, /Buscar lugares/i, /Tienes algo ya reservado/i, /sugerencia para este hueco/i, /También te puede interesar/i]
const FRANJA_CON_HORA = /(Mañana|Tarde|Noche|Comida|Cena)\s*(?:[·\-–—:]|desde|a las|de)?\s*(?:desde\s*)?\d{1,2}[:.]\d{2}/i
const LINEA_DE_HORARIO = /Abre|Cierra|cierra|Última entrada|Cerrado|Solo|Gratis|Entrada|Acceso/
const reserva = (id, refId, placeNames, dateIso, dayNumber, time, extra = {}) => ({ id, kind: 'entrada', refId, name: refId, placeNames, dateIso, dayNumber, time, ...extra })
const COLISEO = ['Coliseo', 'Foro Romano y Palatino']

for (const dias of [2, 3, 4, 5]) {
  for (const fechas of [true, false]) {
    for (const version of ['gratis', 'completa']) {
      const nombre = `${dias} días · ${fechas ? 'con' : 'sin'} fechas · ${version}`
      const vacia = rutaMano(dias, { fechas })
      ponerVersion(version)
      useRouteStore.setState({ ...estadoBase, route: vacia, reservations: [] })

      // ── 1. Días en blanco ──
      for (const day of vacia.days) {
        const t = pintaDias(vacia, day.id)
        debe(/Añadir parada/.test(t) && /Añadir excursión/.test(t), '1 botones', `${nombre} día ${day.dayNumber} en blanco: faltan [Añadir parada] / [Añadir excursión] (${plano(t).slice(0, 300)})`)
        for (const malo of MALOS) debe(!malo.test(t), '1 sugerencias', `${nombre} día ${day.dayNumber} en blanco: sale ${malo}`)
        debe(!FRANJA_CON_HORA.test(t), '3 horas', `${nombre} día ${day.dayNumber} en blanco: franja con hora`)
      }
      // ── 4. Los nombres de los días ──
      {
        const t = pintaDias(vacia, null)
        for (const day of vacia.days) {
          const esperado = fechas ? nombreDeFecha(sumaDias(INICIO, day.dayNumber - 1)) : `Día ${day.dayNumber}`
          debe(manualDayTitle(vacia, day) === esperado, '4 nombres', `${nombre} día ${day.dayNumber}: el nombre es «${manualDayTitle(vacia, day)}» y debería ser «${esperado}»`)
          // (El primero y el último llevan además su trayecto de viaje, que manda en el título; los de en medio salen con el nombre del día.)
          // (6y2: el día sin nombre dice «Ponle nombre»; su fecha ya está en el cuadrito y no se repite en el título.)
          if (day.dayNumber > 1 && day.dayNumber < dias) {
            debe(t.includes('Ponle nombre'), '4 nombres', `${nombre} día ${day.dayNumber}: la tarjeta no dice «Ponle nombre»`)
            if (fechas) debe(!t.includes(esperado), '4 nombres', `${nombre} día ${day.dayNumber}: la tarjeta repite la fecha «${esperado}» en el título`)
          }
        }
        const renombrada = renameDay(vacia, 'd2', 'Día de compras')
        debe(manualDayTitle(renombrada, renombrada.days[1]) === 'Día de compras', '4 nombres', `${nombre}: renombrar no cambia el nombre`)
        const vuelta = renameDay(renombrada, 'd2', '  ')
        debe(manualDayTitle(vuelta, vuelta.days[1]) === (fechas ? nombreDeFecha(sumaDias(INICIO, 1)) : 'Día 2'), '4 nombres', `${nombre}: dejar el nombre vacío no vuelve al nombre por defecto`)
      }

      // ── 2. Paradas que pone el viajero ──
      const antes = poner(rutaMano(dias, { fechas }), version)
      const esperadas = antes.days.map((_, i) => ELIGE[i % ELIGE.length].filter(lugar))
      debe(JSON.stringify(nombresDe(antes)) === JSON.stringify(esperadas), '2 orden', `${nombre}: las paradas no quedan en el orden en que las puso el viajero (${JSON.stringify(nombresDe(antes))})`)
      debe(antes.days.every((d) => d.stops.every((s) => !s.time && s.addedByUser)), '3 horas', `${nombre}: alguna parada lleva una hora que no puso el viajero`)
      for (const day of antes.days) {
        const t = pintaDias(antes, day.id)
        debe(!/Añadir excursión/.test(t.slice(t.indexOf(manualDayTitle(antes, day)))) || day.stops.length === 0, '1 botones', `${nombre} día ${day.dayNumber} con paradas: sale [Añadir excursión]`)
        debe(/Añadir parada/.test(t), '1 botones', `${nombre} día ${day.dayNumber} con paradas: no sale [Añadir parada]`)
        for (const malo of MALOS) debe(!malo.test(t), '1 sugerencias', `${nombre} día ${day.dayNumber} con paradas: sale ${malo}`)
        debe(!FRANJA_CON_HORA.test(t), '3 horas', `${nombre} día ${day.dayNumber} con paradas: franja con hora`)
        // Las paradas en el orden del viajero, tal cual en la pantalla.
        const posiciones = day.stops.map((s) => t.indexOf(s.name))
        debe(posiciones.every((p, i) => p >= 0 && (i === 0 || p > posiciones[i - 1])), '2 orden', `${nombre} día ${day.dayNumber}: las paradas no salen en el orden del viajero`)
        const sueltas = plano(t).split(' | ').filter((l) => /\b\d{1,2}:\d{2}\b/.test(l) && !LINEA_DE_HORARIO.test(l) && !/^\d{1,2}:\d{2}$/.test(l.trim()))
        debe(sueltas.length === 0, '3 horas', `${nombre} día ${day.dayNumber}: horas a la vista que no son un horario: ${sueltas.join(' // ')}`)
        debe(!/(^|\n)\d{1,2}:\d{2}($|\n)/.test(t), '3 horas', `${nombre} día ${day.dayNumber}: hay una hora suelta a la vista sin reserva`)
      }

      // ── 2/3. Las reservas ──
      {
        const diaColiseo = antes.days.findIndex((d) => d.stops.some((s) => s.name === 'Coliseo'))
        const fecha = (n) => (fechas ? sumaDias(INICIO, n) : null)
        const r1 = reserva('r-coliseo', 'Coliseo, Foro y Palatino', COLISEO, fecha(diaColiseo), fechas ? null : diaColiseo + 1, '10:00', { precio: { amount: 36, currency: 'EUR' } })
        useRouteStore.setState({ ...estadoBase, route: antes, reservations: [] })
        llamadasAlMotor = []
        useRouteStore.getState().addReservation(r1)
        let despues = useRouteStore.getState().route
        debe(JSON.stringify(nombresDe(despues)) === JSON.stringify(nombresDe(antes)), '2 orden', `${nombre}: añadir una reserva cambia las paradas u su orden (${JSON.stringify(nombresDe(despues))})`)
        const coliseo = despues.days[diaColiseo].stops.find((s) => s.name === 'Coliseo')
        debe(coliseo.time === '10:00' && coliseo.reservedId === 'r-coliseo', '3 reservas', `${nombre}: el Coliseo no se queda a las 10:00 (${coliseo.time})`)
        debe(despues.days.every((d) => d.stops.every((s) => s === coliseo || s.name === 'Coliseo' || !s.time)), '3 reservas', `${nombre}: otra parada ha cogido hora`)
        const tReserva = pintaDias(despues, despues.days[diaColiseo].id)
        debe(/10:00/.test(tReserva), '3 reservas', `${nombre}: la hora de la reserva no se ve`)
        debe(!FRANJA_CON_HORA.test(tReserva), '3 horas', `${nombre}: con reserva sale una franja con hora`)
        // Una reserva en un día que no lleva el sitio: no se trae de otro día.
        const otro = (diaColiseo + 1) % dias
        const r2 = reserva('r-coliseo-otro', 'Coliseo, Foro y Palatino', COLISEO, fecha(otro), fechas ? null : otro + 1, '15:00')
        useRouteStore.setState({ reservations: [] })
        useRouteStore.setState({ route: antes })
        useRouteStore.getState().addReservation(r2)
        const mal = useRouteStore.getState().route
        debe(JSON.stringify(nombresDe(mal)) === JSON.stringify(nombresDe(antes)), '2 orden', `${nombre}: una reserva en otro día trae la parada de su día o mueve algo`)
        // Quitar la reserva: ni se mueve nada ni se queda la marca.
        useRouteStore.setState({ route: despues, reservations: [r1] })
        useRouteStore.getState().removeReservation('r-coliseo')
        const sin = useRouteStore.getState().route
        debe(JSON.stringify(nombresDe(sin)) === JSON.stringify(nombresDe(antes)) && sin.days.every((d) => d.stops.every((s) => !s.reservedId)), '2 orden', `${nombre}: quitar la reserva cambia las paradas o deja la marca`)
        debe(llamadasAlMotor.length === 0, '7 motor', `${nombre}: las reservas llaman al motor (${llamadasAlMotor.join(', ')})`)

        // Dos reservas del viajero el mismo día: «coinciden» y «vas justo» como en nuestra ruta.
        const dosDeUnDia = (diaConDos) => {
          const f = fecha(diaConDos)
          return [
            reserva('a', 'Coliseo, Foro y Palatino', COLISEO, f, fechas ? null : diaConDos + 1, '10:00'),
            reserva('b', 'Museos Vaticanos y Capilla Sixtina', ['Museos Vaticanos y Capilla Sixtina'], f, fechas ? null : diaConDos + 1, '10:30'),
          ]
        }
        const solapes = reservationOverlaps(antes, dosDeUnDia(0))
        debe(solapes.length === 1 && solapes[0].kind === 'coinciden' && /coinciden/.test(solapes[0].text), '5 avisos', `${nombre}: «coinciden» no sale con dos reservas que se pisan (${JSON.stringify(solapes.map((s) => s.kind))})`)
        const justas = reservationOverlaps(antes, [reserva('a', 'Coliseo, Foro y Palatino', COLISEO, fecha(0), fechas ? null : 1, '09:00'), reserva('b', 'Museos Vaticanos y Capilla Sixtina', ['Museos Vaticanos y Capilla Sixtina'], fecha(0), fechas ? null : 1, '12:00')])
        // Los avisos son los de nuestra ruta: mismas reservas en la misma ruta marcada como nuestra dan exactamente lo mismo.
        const nuestra = { ...antes, planMode: 'auto' }
        debe(JSON.stringify(justas) === JSON.stringify(reservationOverlaps(nuestra, [reserva('a', 'Coliseo, Foro y Palatino', COLISEO, fecha(0), fechas ? null : 1, '09:00'), reserva('b', 'Museos Vaticanos y Capilla Sixtina', ['Museos Vaticanos y Capilla Sixtina'], fecha(0), fechas ? null : 1, '12:00')])), '5 avisos', `${nombre}: «vas justo» no sale como en nuestra ruta`)
        debe(JSON.stringify(solapes) === JSON.stringify(reservationOverlaps(nuestra, dosDeUnDia(0))), '5 avisos', `${nombre}: «coinciden» no sale como en nuestra ruta`)
        // «Vas justo» no sale por nuestras paradas: una sola reserva y muchas paradas del viajero, ningún aviso.
        debe(reservationOverlaps(antes, [reserva('a', 'Coliseo, Foro y Palatino', COLISEO, fecha(0), fechas ? null : 1, '09:00')]).length === 0, '5 avisos', `${nombre}: sale un aviso con una sola reserva`)
      }

      // ── 5/6. RESERVAS y presupuesto ──
      {
        const diaColiseo = antes.days.findIndex((d) => d.stops.some((s) => s.name === 'Coliseo'))
        const fecha = (n) => (fechas ? sumaDias(INICIO, n) : null)
        const reservas = [
          reserva('r1', 'Coliseo, Foro y Palatino', COLISEO, fecha(diaColiseo), fechas ? null : diaColiseo + 1, '10:00', { precio: { amount: 36, currency: 'EUR' } }),
          { id: 'r2', kind: 'excursion', refId: info.excursions[0]?.id ?? 'x', name: info.excursions[0]?.title ?? 'Excursión', placeNames: [], dateIso: fecha(dias - 1), dayNumber: fechas ? null : dias, time: '08:00', precio: { amount: 90, currency: 'EUR' }, excursionId: info.excursions[0]?.id, excursionData: info.excursions[0] },
          { id: 'r3', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso: fecha(0), dayNumber: fechas ? null : 1, time: '10:00', precio: { amount: 20, currency: 'EUR' } },
        ]
        ponerVersion(version)
        useRouteStore.setState({ ...estadoBase, route: antes, reservations: reservas })
        const panelTodo = aTexto(renderToStaticMarkup(createElement(ReservasPanel, { route: antes, onClose() {} })))
        debe(/Entradas y Free Tour/.test(panelTodo) && /de \d+ reservadas/.test(panelTodo), '5 reservas', `${nombre}: RESERVAS no trae «Entradas y Free Tour» con su cuenta (${plano(panelTodo).slice(0, 200)})`)
        const panel = aTexto(renderToStaticMarkup(createElement(EntradasYFreeTour, { route: antes, info, abierto: true, onToggle() {} })))
        debe(/EN TU RUTA/i.test(panel), '5 reservas', `${nombre}: el bloque de entradas no dice «EN TU RUTA»`)
        const enRuta = panel.split(/EN TU RUTA/i)[1]?.split(/Ver \d+ más|MÁS ENTRADAS/i)[0] ?? ''
        debe(/Coliseo/.test(enRuta) && /Panteón|Museos Vaticanos|Galería Borghese/.test(enRuta + panel), '5 reservas', `${nombre}: «EN TU RUTA» no trae las entradas de su ruta (${plano(enRuta).slice(0, 200)})`)
        const presupuesto = construirPresupuesto({ route: antes, reservations: reservas, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: version === 'completa' })
        const ruta = presupuesto.bloques.find((b) => b.id === 'ruta')
        debe(presupuesto.total.amount === 126 && ruta.lineas.every((l) => l.id !== 'reserva-r3'), '6 presupuesto', `${nombre}: el presupuesto suma ${presupuesto.total.amount} y debería sumar 126 (36 + 90, sin Free Tour)`)
        // Afiliado: los enlaces de Civitatis/Stay22 de RESERVAS llevan los mismos parámetros que en nuestra ruta (withCampaign, un solo sitio).
        const civ = withCampaign('https://www.civitatis.com/es/roma/visita-guiada-coliseo/', 'app-PRUEBA')
        debe(/aid=5206/.test(civ) && /cmp=app-PRUEBA/.test(civ), '5 afiliados', `${nombre}: el enlace de Civitatis no lleva el afiliado y la campaña del viaje: ${civ}`)
        debe(Boolean(info.excursions[0]?.bookUrl) && /civitatis/.test(info.excursions[0].bookUrl), '5 afiliados', 'la excursión no trae su enlace de reserva')
      }
    }
  }
}

// ── 5. Afiliados: ningún código de afiliado o campaña distingue la ruta a mano ──
{
  const fs = await import('node:fs')
  for (const f of ['src/lib/affiliateLinks.ts', 'shared/affiliate/civitatis.js', 'src/components/sync/CampaignLinks.tsx', 'src/components/route/alojamiento/mapaAlojamientoUrl.ts', 'src/components/route/alojamiento/PantallaAlojamiento.tsx', 'src/components/route/reservas/EntradaCard.tsx', 'src/components/route/excursions/ExcursionsPage.tsx']) {
    debe(!/planMode|isManualRoute/.test(fs.readFileSync(f, 'utf8')), '5 afiliados', `${f} distingue la ruta a mano: los códigos tienen que ser los mismos`)
  }
  debe(/viajesbengala/.test(fs.readFileSync('src/components/route/alojamiento/mapaAlojamientoUrl.ts', 'utf8') + JSON.stringify(info.mapaAlojamiento ?? {})), '5 afiliados', 'el mapa de alojamiento (Stay22) ha perdido viajesbengala')
}

// ── 3. Excursión: [Añadir excursión] solo en días en blanco; reservarla no borra paradas ──
{
  const ruta = poner(rutaMano(3, { fechas: true }), 'completa', { hasta: 1 }) // solo el día 1 con paradas
  const excursion = info.excursions.find((e) => e.length === 'full-day') ?? info.excursions[0]
  const medio = info.excursions.find((e) => e.length === 'half-day')
  const colocada = placeExcursionIn(ruta, excursion, { dayId: 'd2' })
  debe(colocada && colocada.route.days[1].dayType === 'excursion' && colocada.route.days[1].selectedExcursionId === excursion.id, '1 excursión', 'la excursión no se pone en el día en blanco como día de excursión')
  debe(JSON.stringify(nombresDe(colocada.route)[0]) === JSON.stringify(nombresDe(ruta)[0]), '1 excursión', 'poner una excursión en un día toca las paradas de otro')
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route: colocada.route })
  const t = pintaDias(colocada.route, 'd2')
  debe(!/Añadir excursión/.test(t.slice(t.indexOf(excursion.title))), '1 excursión', 'un día con excursión todavía ofrece [Añadir excursión]')
  if (medio) {
    const conMedia = placeExcursionIn(ruta, medio, { dayId: 'd3' }).route
    const tm = pintaDias(conMedia, 'd3')
    debe(conMedia.days[2].dayType === 'manual', '1 excursión', 'una excursión de medio día cambia el día a otro tipo')
    debe((tm.match(/Añadir excursión/g) ?? []).length === 0, '1 excursión', 'un día con una excursión de medio día ofrece [Añadir excursión]')
  }
  // La excursión reservada para un día CON paradas no las borra.
  const res = { id: 'rx', kind: 'excursion', refId: excursion.id, name: excursion.title, placeNames: [], dateIso: INICIO, dayNumber: null, time: '08:00', excursionId: excursion.id, excursionData: excursion }
  useRouteStore.setState({ ...estadoBase, route: ruta, reservations: [] })
  useRouteStore.getState().addReservation(res, excursion)
  debe(useRouteStore.getState().route.days[0].stops.length === ruta.days[0].stops.length, '3 reservas', 'una excursión reservada borra las paradas del viajero')
  // y en un día en blanco, sí entra.
  const res2 = { ...res, id: 'rx2', dateIso: sumaDias(INICIO, 1) }
  useRouteStore.setState({ ...estadoBase, route: ruta, reservations: [] })
  useRouteStore.getState().addReservation(res2, excursion)
  debe(useRouteStore.getState().route.days[1].selectedExcursionId === excursion.id, '3 reservas', 'una excursión reservada para un día en blanco no entra en él')
}

// ── 7. El motor no toca una ruta a mano ──
{
  const ruta = poner(rutaMano(3, { fechas: true }), 'completa')
  useRouteStore.setState({ ...estadoBase, route: ruta, reservations: [] })
  llamadasAlMotor = []
  debe((await rehacerDiasSinTocar(null)) === true, '7 motor', 'rehacerDiasSinTocar falla en una ruta a mano')
  await rehacerDiaConReservas('d1')
  debe((await checkTime('d1', 600)) === null, '7 motor', 'HOY pregunta «vas bien/justo» al motor en una ruta a mano')
  debe((await adjustDay('d1', 'cansado', 600)).ok === false, '7 motor', 'HOY ajusta el día con el motor en una ruta a mano')
  await useRouteStore.getState().fitDayToTrip('d1', 'departure', 11 * 60)
  await useRouteStore.getState().fitDayToTrip('d1', 'arrival', 14 * 60)
  await useRouteStore.getState().optimizeDayWithRealTransport('d1', 'arrival', '10:00')
  const igual = useRouteStore.getState().route
  debe(JSON.stringify(nombresDe(igual)) === JSON.stringify(nombresDe(ruta)) && igual.days[0].stops.every((s) => !s.time), '7 motor', 'la llegada o la vuelta recortan o reordenan un día a mano')
  debe(llamadasAlMotor.length === 0, '7 motor', `se llama al motor: ${llamadasAlMotor.join(', ')}`)
  // «Quiero entrar»: ni el botón ni la petición.
  const fuente = (await import('node:fs')).readFileSync('src/components/route/dayDetail/WantInsideDialog.tsx', 'utf8')
  debe(/isManualRoute\(route\)\) return/.test(fuente), '7 motor', '«Quiero entrar» no está cerrado para la ruta a mano')
  const panelFuente = (await import('node:fs')).readFileSync('src/components/route/dayDetail/DayDetailPanel.tsx', 'utf8')
  debe(/onWantInside=\{!isManualRoute\(route\)/.test(panelFuente), '7 motor', 'el botón «Quiero entrar» sale en la ruta a mano')
}

// ── 8. EXPLORAR de un día en blanco ──
{
  const ranking = D.pool_lista?.lugares ?? []
  const lugares = catalogo.map((p) => ({ ...p, essential_rank: ranking.indexOf(p.name) >= 0 ? ranking.indexOf(p.name) : null }))
  const sinLikes = new Map()
  const orden = (likes) => lugares.filter((p) => p.kind === 'place').sort((a, b) => compareManualExplorer(a, b, likes)).map((p) => p.name)
  const o = orden(sinLikes)
  // (Tanda 6y3, pregunta 1: el orden pasó a «me gusta» de verdad, nivel 1, pool_lista sin repetir y el resto; el detalle está en pruebaFase6y3_reservas.mjs.)
  const nivel1 = lugares.filter((p) => p.kind === 'place' && p.level === 1).map((p) => p.name)
  debe(o.slice(0, nivel1.length).every((n) => nivel1.includes(n)), '8 orden', `sin «me gusta», los primeros no son los de nivel 1: ${o.slice(0, 6).join(', ')}`)
  const soloLista = ranking.filter((n) => !nivel1.includes(n) && o.includes(n))
  debe(JSON.stringify(o.slice(nivel1.length, nivel1.length + soloLista.length)) === JSON.stringify(soloLista), '8 orden', 'detrás del nivel 1 no sale pool_lista en su orden')
  const primerNivel2 = o.findIndex((n) => lugares.find((p) => p.name === n).level === 2 && lugares.find((p) => p.name === n).essential_rank == null)
  debe(soloLista.every((n) => o.indexOf(n) < primerNivel2), '8 orden', 'un imprescindible va detrás de uno de nivel 2 fuera de la lista')
  const conLikes = orden(new Map([['Trastevere', 50], ['Boca de la Verdad', 80]]))
  debe(conLikes[0] === 'Boca de la Verdad' && conLikes[1] === 'Trastevere' && conLikes[2] === o[0], '8 orden', `con «me gusta» de verdad no mandan primero: ${conLikes.slice(0, 3).join(', ')}`)
  // Pintado: «En tu día n» / «En tu lun 13».
  for (const fechas of [false, true]) {
    ponerVersion('completa')
    const ruta = poner(rutaMano(3, { fechas }), 'completa', { hasta: 2 })
    useRouteStore.setState({ ...estadoBase, route: ruta })
    const html = renderToStaticMarkup(createElement(PlaceExplorerScreen, { open: true, destination: 'Roma', places: lugares, excursions: [], title: 'Añadir parada', route: ruta, dayNumber: 3, pickMode: { confirmLabel: (n) => `Añadir (${n})`, selected: [], onToggle() {}, onConfirm() {} }, onClose() {} }))
    const t = plano(aTexto(html))
    const dia2 = fechas ? 'En tu jue 11' : 'En tu día 2'
    const dia1 = fechas ? 'En tu mié 10' : 'En tu día 1'
    debe(t.includes(dia2) && t.includes(dia1), '8 etiqueta', `${fechas ? 'con' : 'sin'} fechas: no sale «${dia1}» / «${dia2}»`)
    debe(!/✓ En ruta/.test(t), '8 etiqueta', 'sale «✓ En ruta» en vez del día')
  }
}

console.log(`\n6y (parte C): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
