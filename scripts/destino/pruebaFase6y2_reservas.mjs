// La prueba de la Tanda 6y2, parte de RESERVAS: el Free Tour, «día completo», la reserva fuera de su día y la lista de «Añadir parada» en una ruta a mano.
//   API_URL=http://localhost:8799 node scripts/destino/pruebaFase6y2_reservas.mjs     (con un servidor de la app con el código de esta tanda; por defecto http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. el Free Tour a mano (reserva con su hora, desde RESERVAS o desde EXPLORAR) no va al DÍA DE SU FECHA como una parada más, con su hora y la marca de reserva; si mete otra parada, reordena o toca otro día;
//      si al cambiar su fecha no pasa la misma parada al día nuevo; si lleva precio o suma al presupuesto; si en RESERVAS no sale para añadirlo («¿Ya la tienes? Añádela») o la ruta nuestra cambia;
//   2. «Hoy es un día completo» en una ruta a mano cuenta una comida o cena que el día no tiene (o no cuenta la que sí tiene); la ruta nuestra cambia;
//   3. una reserva cuyo sitio no está en el día de su fecha NO avisa (con y sin fechas), no dice los dos textos como son, no sale en la campana y en la tarjeta de RESERVAS, o MUEVE algo sola;
//      si el botón no hace lo que dice (pasar la parada al día de la reserva / añadirla a ese día, con su hora), no se puede deshacer, o el aviso no se va al arreglarse;
//   4. la lista de «Añadir parada» (elegir varios) trae algún restaurante (o su chip), o EXPLORAR normal deja de traerlos.
import fs from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y2_reservas_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, DayList, PlaceExplorerScreen, stopFromPlace, EntradasYFreeTour, useRouteStore, useAddFlowStore, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo,
  buildEntradasBloque, esDiaCompleto, minutosDelDia, freeTourAvailable, reservasFueraDeSuDia, aplicarAvisoFueraDeDia, construirPresupuesto, itemsDeLaCampana, ejecutarDeLaCampana,
} = M
await fetchArrivalInfo('Roma')
const info = await fetchDestinationExcursions('Roma')
const catalogoCompleto = await fetchDestinationPlaces('Roma')
const catalogo = catalogoCompleto.places
const freeTourEntry = catalogoCompleto.freeTourEntry
const D = findPipelineV2Data('Roma')
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

// Las llamadas al motor: ninguna de estas pruebas debe hacerlas.
const fetchReal = globalThis.fetch
let llamadasAlMotor = []
globalThis.fetch = (url, opts) => {
  if (/rebuild-day|adjust-day|check-time|curated-day-inside|reservation-plan/.test(String(url))) llamadasAlMotor.push(String(url))
  return fetchReal(url, opts)
}

const INICIO = '2027-03-10' // miércoles
const SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const corta = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${SEMANA[d.getUTCDay()]} ${d.getUTCDate()}` }

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
const rutaMano = (dias, { fechas, manual = true }) => ({
  id: `m6y2-${dias}-${fechas ? 'f' : 'n'}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, ...(manual ? { planMode: 'manual' } : {}),
  days: Array.from({ length: dias }, (_, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: manual ? 'manual' : 'normal', colorIndex: i })),
  answers: { dateRange: fechas ? { start: INICIO, end: sumaDias(INICIO, dias - 1) } : undefined, month: fechas ? undefined : 9, days: dias, companion: 'couple' },
  transportContext: { transport_option: { id: 'flight' }, archetype: null },
})
const lugar = (nombre) => catalogo.find((p) => p.name === nombre && p.kind === 'place')
const parada = (nombre) => stopFromPlace(lugar(nombre), 'foto')
/** Pone la ruta en el almacén y pone en cada día las paradas que se pidan, en ese orden (como el viajero). */
const montar = (route, porDia = []) => {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, reservations: [] })
  const st = useRouteStore.getState()
  route.days.forEach((day, i) => { for (const nombre of porDia[i] ?? []) st.addPlaceToDay(day.id, parada(nombre), null) })
  return useRouteStore.getState().route
}
const ahora = () => useRouteStore.getState().route
const nombresDe = (route) => route.days.map((d) => d.stops.map((s) => s.name))
const reserva = (id, refId, placeNames, dateIso, dayNumber, time, extra = {}) => ({ id, kind: 'entrada', refId, name: refId, placeNames, dateIso, dayNumber, time, ...extra })
const COLISEO = ['Coliseo', 'Foro Romano y Palatino']
const FT = 'Free Tour por Roma'

// ═══════════ 1. El Free Tour en la ruta a mano ═══════════
debe(Boolean(freeTourEntry) && freeTourEntry.name === FT && Boolean(freeTourEntry.meeting_point) && (freeTourEntry.covers ?? []).length > 0, '1 free tour', 'el servidor no manda el punto de encuentro y lo que recorre el Free Tour (¿servidor viejo? arranca el de esta tanda y pasa API_URL)')
for (const fechas of [true, false]) {
  const nombre = fechas ? 'con fechas' : 'sin fechas'
  const base = montar(rutaMano(3, { fechas }), [['Fontana de Trevi', 'Panteón'], ['Piazza Navona', 'Trastevere'], ['Plaza de España']])
  const antes = JSON.parse(JSON.stringify(base))
  debe(freeTourAvailable(base) === true, '1 free tour', `${nombre}: freeTourAvailable no da true en una ruta a mano`)
  debe(freeTourAvailable(rutaMano(3, { fechas, manual: false })) === false, '1 free tour', `${nombre}: freeTourAvailable cambia en una ruta nuestra sin días escritos`)

  // RESERVAS: antes de añadirlo, el Free Tour sale en «Ver más» y se puede añadir (EntradaCard con «Añádela»).
  const bloqueAntes = buildEntradasBloque(base, info.entradasOrden, info.entradas, [])
  const ftAntes = [...bloqueAntes.enRuta, ...bloqueAntes.masEntradas].find((item) => item.name === FT)
  debe(ftAntes && ftAntes.isFreeTour && !ftAntes.inRoute && bloqueAntes.masEntradas.includes(ftAntes), '1 reservas', `${nombre}: el Free Tour no sale en RESERVAS como Free Tour (fuera de la ruta) antes de añadirlo`)

  // Se añade como cualquier reserva: el viajero elige día (fecha) y hora; va a ese día como una parada más.
  llamadasAlMotor = []
  const r1 = reserva('r-ft', 'Free Tour', [FT], fechas ? sumaDias(INICIO, 1) : null, fechas ? null : 2, '12:00', { precio: null })
  useRouteStore.getState().addReservation(r1, null, freeTourEntry)
  const despues = ahora()
  const delFT = despues.days.map((d) => d.stops.filter((s) => s.isFreeTour))
  debe(delFT[0].length === 0 && delFT[1].length === 1 && delFT[2].length === 0, '1 free tour', `${nombre}: el Free Tour no está en el día de su fecha (día 2) y solo en él (${JSON.stringify(delFT.map((x) => x.length))})`)
  const ft = delFT[1][0]
  debe(ft && ft.time === '12:00' && ft.reservedId === 'r-ft', '1 free tour', `${nombre}: el Free Tour no lleva su hora (12:00) y la marca de la reserva (${ft?.time}, ${ft?.reservedId})`)
  debe(ft && ft.name === FT && ft.freeTourMeetingPoint === freeTourEntry.meeting_point && (ft.freeTourHighlights ?? []).length > 0 && (ft.freeTourTips ?? []).length >= 2, '1 free tour', `${nombre}: la parada del Free Tour no trae su punto de encuentro / lo que recorre / sus consejos`)
  debe(ft && ft.coordinates.lat !== 0 && ft.durationMinutes === 150, '1 free tour', `${nombre}: la parada no trae sus coordenadas ni su duración`)
  // Es una parada más al final: el resto de paradas, sin tocar y en su orden.
  debe(JSON.stringify(nombresDe(despues).map((l, i) => (i === 1 ? l.filter((n) => n !== FT) : l))) === JSON.stringify(nombresDe(antes)), '1 free tour', `${nombre}: el Free Tour toca otras paradas (${JSON.stringify(nombresDe(despues))})`)
  debe(despues.days[1].stops.at(-1).name === FT, '1 free tour', `${nombre}: el Free Tour no va como una parada más, al final del día`)
  debe(despues.days.every((d, i) => (i === 1 ? true : JSON.stringify(d) === JSON.stringify(antes.days[i]))), '1 free tour', `${nombre}: el Free Tour cambia otro día`)
  debe(llamadasAlMotor.length === 0, '1 free tour', `${nombre}: añadir el Free Tour llama al motor (${llamadasAlMotor.join(', ')})`)
  // Sale en DÍAS (con su nombre y su hora) y en RESERVAS como «En tu ruta», reservado.
  const diasHtml = plano(aTexto(renderToStaticMarkup(createElement(DayList, { route: despues, activeDayId: 'd2', onSelectDay() {}, showAllDaysOnMap: false }))))
  debe(diasHtml.includes(FT) && diasHtml.includes('12:00'), '1 free tour', `${nombre}: DÍAS no enseña el Free Tour con su hora`)
  const bloque = buildEntradasBloque(despues, info.entradasOrden, info.entradas, [r1])
  const ftDespues = bloque.enRuta.find((item) => item.name === FT)
  debe(ftDespues && ftDespues.inRoute && ftDespues.reservation?.id === 'r-ft' && ftDespues.day?.dayNumber === 2, '1 reservas', `${nombre}: en RESERVAS el Free Tour no sale «En tu ruta», reservado y en su día`)
  // Sin precio, como siempre: ni en la reserva ni en el presupuesto.
  const presupuesto = construirPresupuesto({ route: despues, reservations: [{ ...r1, precio: { amount: 20, currency: 'EUR' } }], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, moneda: 'EUR', cambio: null, pago: true })
  debe(presupuesto.total.amount === 0, '1 free tour', `${nombre}: el Free Tour suma al presupuesto (${presupuesto.total.amount})`)
  // Sin avisos de «fuera de su día» (está donde toca).
  debe(reservasFueraDeSuDia(despues, [r1], info.nombresCortos).length === 0, '1 free tour', `${nombre}: el Free Tour recién añadido avisa de que está fuera de su día`)

  // Cambiar su fecha: la MISMA parada pasa al día nuevo (no se duplica).
  const idFT = ft.id
  const r2 = reserva('r-ft2', 'Free Tour', [FT], fechas ? sumaDias(INICIO, 2) : null, fechas ? null : 3, '15:00', { precio: null })
  useRouteStore.getState().addReservation(r2, null, freeTourEntry)
  const movido = ahora()
  const enDias = movido.days.map((d) => d.stops.filter((s) => s.isFreeTour).length)
  debe(JSON.stringify(enDias) === '[0,0,1]' && movido.days[2].stops.at(-1).id === idFT && movido.days[2].stops.at(-1).time === '15:00', '1 free tour', `${nombre}: al cambiar la fecha el Free Tour no pasa (la misma parada) al día nuevo con su hora nueva (${JSON.stringify(enDias)})`)
  debe(JSON.stringify(nombresDe(movido).map((l) => l.filter((n) => n !== FT))) === JSON.stringify(nombresDe(antes)), '1 free tour', `${nombre}: cambiar la fecha del Free Tour toca otras paradas`)
  // Reservas de nuestra ruta: el Free Tour sigue como siempre (la reserva sola no crea ninguna parada).
  const nuestra = montar(rutaMano(3, { fechas, manual: false }), [])
  useRouteStore.getState().addReservation(r1, null, freeTourEntry)
  debe(ahora().days.every((d) => d.stops.every((s) => !s.isFreeTour)), '1 free tour', `${nombre}: en la ruta nuestra la reserva del Free Tour crea una parada`)
  void nuestra
}
// El camino de la pantalla: «Free Tour» abre la hoja de reserva (no el motor) en una ruta a mano. La hoja es de navegador (efectos): se comprueba el cableado en el código.
{
  const hoja = fs.readFileSync('src/components/route/reservas/FreeTourSheet.tsx', 'utf8')
  debe(/isManualRoute\(route\) \? <FreeTourComoReserva/.test(hoja) && /AddReservationSheet/.test(hoja), '1 free tour', 'FreeTourSheet no abre la hoja de reserva en una ruta a mano')
  const hojaReserva = fs.readFileSync('src/components/route/reservas/AddReservationSheet.tsx', 'utf8')
  debe(/addReservation\(reservation, target\.excursion \?\? null, freeTourEntry\)/.test(hojaReserva) && /precio: target\.refId === 'Free Tour' \? null/.test(hojaReserva), '1 free tour', 'la hoja de reserva no pasa los datos del Free Tour o le deja un precio')
  for (const f of ['src/components/route/ExplorePanel.tsx', 'src/components/route/freeDay/AddToTripScreen.tsx']) debe(/freeTourAvailable\(route\)/.test(fs.readFileSync(f, 'utf8')), '1 free tour', `${f} no ofrece el Free Tour con freeTourAvailable`)
  const reservas = fs.readFileSync('src/components/route/reservas/EntradasYFreeTour.tsx', 'utf8')
  debe(/isManualRoute\(route\) && item\.isFreeTour \? \(\) => setTarget\(targetOf\(item\)\)/.test(reservas), '1 reservas', 'RESERVAS no ofrece «Añádela» en el Free Tour de una ruta a mano')
}
// Ruta nuestra: el Free Tour sin parada sigue sin ser Free Tour en el bloque (nada cambia fuera de la ruta a mano).
{
  const nuestra = rutaMano(3, { fechas: true, manual: false })
  const bloque = buildEntradasBloque(nuestra, info.entradasOrden, info.entradas, [])
  const ft = [...bloque.enRuta, ...bloque.masEntradas].find((item) => item.name === FT)
  debe(ft && !ft.isFreeTour, '1 reservas', 'en una ruta nuestra el Free Tour sin parada cambia en RESERVAS')
}

// ═══════════ 2. «Hoy es un día completo» a mano ═══════════
{
  const rutaLarga = (manual, meals) => {
    const r = rutaMano(2, { fechas: true, manual })
    const mismo = { lat: 41.89, lng: 12.49 }
    r.days[0].stops = Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, time: manual ? '' : `${9 + i * 3}:00`, name: `Sitio ${i}`, description: '', durationMinutes: 175, coordinates: mismo, photoUrl: 'x', category: 'sight' }))
    r.days[0].meals = meals
    return r
  }
  const reservaDelDia = [reserva('r-d', 'Coliseo, Foro y Palatino', COLISEO, INICIO, null, '10:00')]
  const comida = (mealTime) => ({ id: mealTime, mealTime, time: mealTime === 'lunch' ? '14:00' : '21:00', zone: 'x' })
  const sinComidas = rutaLarga(true, [])
  debe(minutosDelDia(sinComidas.days[0], true) === 700, '2 completo', `a mano sin comida ni cena: ${minutosDelDia(sinComidas.days[0], true)} min y deberían ser 700`)
  debe(esDiaCompleto(sinComidas, sinComidas.days[0], reservaDelDia) === false, '2 completo', 'a mano sin comida ni cena, 700 min: sale «día completo» (cuenta una comida y una cena que no tiene)')
  const conComida = rutaLarga(true, [comida('lunch')])
  debe(esDiaCompleto(conComida, conComida.days[0], reservaDelDia) === false && minutosDelDia(conComida.days[0], true) === 760, '2 completo', 'a mano con comida: no suma solo su comida (760)')
  const conAmbas = rutaLarga(true, [comida('lunch'), comida('dinner')])
  debe(minutosDelDia(conAmbas.days[0], true) === 835 && esDiaCompleto(conAmbas, conAmbas.days[0], reservaDelDia) === true, '2 completo', 'a mano con comida y cena de verdad: no cuenta las dos (835 > 780)')
  const soloCena = rutaLarga(true, [comida('dinner')])
  debe(minutosDelDia(soloCena.days[0], true) === 775, '2 completo', `a mano solo con cena: ${minutosDelDia(soloCena.days[0], true)} y deberían ser 775`)
  // La ruta nuestra cambia nada: el día sin comidas anotadas cuenta las dos.
  const nuestra = rutaLarga(false, [])
  debe(minutosDelDia(nuestra.days[0]) === 835 && esDiaCompleto(nuestra, nuestra.days[0], reservaDelDia) === true, '2 completo', 'en la ruta nuestra cambia el cálculo del día completo (835 y completo)')
  // Sin reserva en el día, nunca avisa (como siempre).
  debe(esDiaCompleto(conAmbas, conAmbas.days[0], []) === false, '2 completo', 'avisa de día completo sin reserva ese día')
  // Pintado en DÍAS: el aviso sale / no sale según la regla.
  const pinta = (r, reservas) => { ponerVersion('completa'); useRouteStore.setState({ ...estadoBase, route: r, reservations: reservas }); return plano(aTexto(renderToStaticMarkup(createElement(DayList, { route: r, activeDayId: 'd1', onSelectDay() {}, showAllDaysOnMap: false })))) }
  debe(!pinta(sinComidas, reservaDelDia).includes('día completo'), '2 completo', 'DÍAS enseña «día completo» en un día a mano de 700 min sin comidas')
  debe(pinta(conAmbas, reservaDelDia).includes('día completo'), '2 completo', 'DÍAS no enseña «día completo» en un día a mano de 835 min')
}

// ═══════════ 3. Una reserva cuyo sitio no está en el día de su fecha ═══════════
for (const fechas of [true, false]) {
  const nombre = fechas ? 'con fechas' : 'sin fechas'
  const f = (n) => (fechas ? sumaDias(INICIO, n) : null)
  const dia = (n) => (fechas ? `el ${corta(sumaDias(INICIO, n - 1))}` : `el día ${n}`)
  const alDia = (n) => (fechas ? `al ${corta(sumaDias(INICIO, n - 1))}` : `al día ${n}`)
  const n = (k) => (fechas ? null : k)

  // 3a. El sitio está en OTRO día.
  const base = montar(rutaMano(3, { fechas }), [['Coliseo', 'Fontana de Trevi'], ['Piazza Navona', 'Trastevere'], ['Plaza de España']])
  const reservaColiseo = reserva('r-col', 'Coliseo, Foro y Palatino', COLISEO, f(1), n(2), '10:00')
  llamadasAlMotor = []
  useRouteStore.getState().addReservation(reservaColiseo)
  const despuesDeReservar = ahora()
  const comoEstaba = JSON.parse(JSON.stringify(base))
  debe(JSON.stringify(nombresDe(despuesDeReservar)) === JSON.stringify(nombresDe(comoEstaba)), '3 aviso', `${nombre}: al reservar el Coliseo para otro día, la app mueve paradas sola (${JSON.stringify(nombresDe(despuesDeReservar))})`)
  debe(despuesDeReservar.days.every((d) => d.stops.every((s) => !s.reservedId)), '3 aviso', `${nombre}: marca una parada de otro día como reservada`)
  const avisos = reservasFueraDeSuDia(despuesDeReservar, [reservaColiseo], info.nombresCortos)
  const esperado1 = `Tu entrada al Coliseo es ${dia(2)}, pero en tu ruta el Coliseo está ${dia(1)}.`
  debe(avisos.length === 1 && avisos[0].kind === 'otro-dia' && avisos[0].text === esperado1, '3 aviso', `${nombre}: el aviso «otro día» no dice «${esperado1}» sino «${avisos[0]?.text}»`)
  debe(avisos[0]?.actionLabel === `Pasar ${alDia(2)}`, '3 aviso', `${nombre}: el botón no dice «Pasar ${alDia(2)}» sino «${avisos[0]?.actionLabel}»`)
  // La campana.
  const campana = itemsDeLaCampana().filter((item) => item.id.startsWith('fuera-de-dia:'))
  debe(campana.length === 1 && campana[0].text === esperado1 && campana[0].actionLabel === `Pasar ${alDia(2)}` && campana[0].tieneRun && campana[0].kind === 'warning' && campana[0].id.includes('r-col'), '3 campana', `${nombre}: la campana no trae el aviso con su botón (${JSON.stringify(campana)})`)
  // La tarjeta de RESERVAS.
  const panel = plano(aTexto(renderToStaticMarkup(createElement(EntradasYFreeTour, { route: despuesDeReservar, info, abierto: true, onToggle() {} }))))
  debe(panel.includes(esperado1) && panel.includes(`Pasar ${alDia(2)}`), '3 tarjeta', `${nombre}: la tarjeta de la reserva en RESERVAS no trae el aviso y su botón (${panel.slice(0, 400)})`)
  // Mientras no se pulsa, no se mueve nada (se vuelve a calcular varias veces).
  for (let i = 0; i < 3; i++) itemsDeLaCampana()
  debe(JSON.stringify(ahora()) === JSON.stringify(despuesDeReservar), '3 aviso', `${nombre}: la app mueve algo sola al calcular el aviso`)
  // El botón (desde la campana) hace lo que dice: la parada pasa al día de la reserva, con su hora y su marca.
  llamadasAlMotor = []
  debe(ejecutarDeLaCampana(avisos[0].id), '3 botón', `${nombre}: el botón de la campana no se puede ejecutar`)
  await new Promise((r) => setTimeout(r, 50))
  const movida = ahora()
  const enDia1 = movida.days[0].stops.map((s) => s.name)
  const enDia2 = movida.days[1].stops
  debe(!enDia1.includes('Coliseo') && enDia1.join() === 'Fontana de Trevi', '3 botón', `${nombre}: el Coliseo sigue en el día 1 (${enDia1})`)
  debe(enDia2.map((s) => s.name).join() === 'Piazza Navona,Trastevere,Coliseo', '3 botón', `${nombre}: el Coliseo no llega al final del día 2 (${enDia2.map((s) => s.name)})`)
  const col = enDia2.find((s) => s.name === 'Coliseo')
  debe(col && col.time === '10:00' && col.reservedId === 'r-col', '3 botón', `${nombre}: el Coliseo pasado no coge la hora y la marca de la reserva (${col?.time}, ${col?.reservedId})`)
  debe(JSON.stringify(movida.days[2]) === JSON.stringify(despuesDeReservar.days[2]), '3 botón', `${nombre}: el botón toca el día 3`)
  debe(movida.days[1].stops.slice(0, 2).every((s, i) => s.name === ['Piazza Navona', 'Trastevere'][i] && !s.time), '3 botón', `${nombre}: el botón cambia las otras paradas del día 2 (su hora u orden)`)
  debe(llamadasAlMotor.length === 0, '3 botón', `${nombre}: pasar la parada llama al motor`)
  debe(reservasFueraDeSuDia(movida, [reservaColiseo], info.nombresCortos).length === 0 && itemsDeLaCampana().every((item) => !item.id.startsWith('fuera-de-dia:')), '3 aviso', `${nombre}: el aviso no se va al arreglarse`)
  // Deshacer.
  const toast = useAddFlowStore.getState().toast
  debe(Boolean(toast) && /^Pasado al/.test(toast.message), '3 deshacer', `${nombre}: no sale el aviso corto con «Deshacer» (${toast?.message})`)
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(ahora()) === JSON.stringify(despuesDeReservar), '3 deshacer', `${nombre}: «Deshacer» no devuelve la ruta tal cual estaba`)

  // 3b. El sitio NO está en ningún día.
  const sinColiseo = montar(rutaMano(3, { fechas }), [['Fontana de Trevi'], ['Piazza Navona', 'Trastevere'], ['Plaza de España']])
  const antes2 = JSON.parse(JSON.stringify(sinColiseo))
  useRouteStore.getState().addReservation(reservaColiseo)
  const tras = ahora()
  debe(JSON.stringify(nombresDe(tras)) === JSON.stringify(nombresDe(antes2)), '3 aviso', `${nombre}: reservar un sitio que no está en la ruta mete o mueve paradas solo (${JSON.stringify(nombresDe(tras))})`)
  const avisos2 = reservasFueraDeSuDia(tras, [reservaColiseo], info.nombresCortos)
  const esperado2 = `Tu entrada al Coliseo es ${dia(2)} y el Coliseo no está en tu ruta.`
  debe(avisos2.length === 1 && avisos2[0].kind === 'no-esta' && avisos2[0].text === esperado2, '3 aviso', `${nombre}: el aviso «no está» no dice «${esperado2}» sino «${avisos2[0]?.text}»`)
  debe(avisos2[0]?.actionLabel === `Añadir ${alDia(2)}`, '3 aviso', `${nombre}: el botón no dice «Añadir ${alDia(2)}» sino «${avisos2[0]?.actionLabel}»`)
  const campana2 = itemsDeLaCampana().filter((item) => item.id.startsWith('fuera-de-dia:'))
  debe(campana2.length === 1 && campana2[0].text === esperado2 && campana2[0].tieneRun, '3 campana', `${nombre}: la campana no trae el aviso «no está» con su botón`)
  const panel2 = plano(aTexto(renderToStaticMarkup(createElement(EntradasYFreeTour, { route: tras, info, abierto: true, onToggle() {} }))))
  debe(panel2.includes(esperado2) && panel2.includes(`Añadir ${alDia(2)}`), '3 tarjeta', `${nombre}: la tarjeta de RESERVAS no trae el aviso «no está» y su botón`)
  debe(await aplicarAvisoFueraDeDia(avisos2[0]), '3 botón', `${nombre}: el botón «Añadir» no pudo añadir el Coliseo`)
  const anadida = ahora()
  const col2 = anadida.days[1].stops.find((s) => s.name === 'Coliseo')
  debe(anadida.days[1].stops.map((s) => s.name).join() === 'Piazza Navona,Trastevere,Coliseo' && col2?.time === '10:00' && col2?.reservedId === 'r-col', '3 botón', `${nombre}: «Añadir» no pone el Coliseo al final del día 2 con su hora y su marca (${anadida.days[1].stops.map((s) => `${s.name}@${s.time}`)})`)
  debe(JSON.stringify(anadida.days[0]) === JSON.stringify(antes2.days[0]) && JSON.stringify(anadida.days[2]) === JSON.stringify(antes2.days[2]), '3 botón', `${nombre}: «Añadir» toca otros días`)
  debe(reservasFueraDeSuDia(anadida, [reservaColiseo], info.nombresCortos).length === 0, '3 aviso', `${nombre}: el aviso «no está» no se va al añadirlo`)
  useAddFlowStore.getState().undo()
  debe(JSON.stringify(ahora()) === JSON.stringify(tras), '3 deshacer', `${nombre}: «Deshacer» de «Añadir» no devuelve la ruta`)

  // 3c. El Free Tour (su parada no está o está en otro día).
  const rFT = reserva('r-ft', 'Free Tour', [FT], f(1), n(2), '10:00')
  montar(rutaMano(3, { fechas }), [['Fontana de Trevi'], ['Piazza Navona'], []])
  useRouteStore.setState({ reservations: [rFT] })
  const avFT = reservasFueraDeSuDia(ahora(), [rFT], info.nombresCortos)
  debe(avFT.length === 1 && avFT[0].kind === 'no-esta' && avFT[0].text === `Tu Free Tour es ${dia(2)} y el Free Tour no está en tu ruta.` && avFT[0].actionLabel === `Añadir ${alDia(2)}`, '3 aviso', `${nombre}: el aviso del Free Tour (no está) no cuadra: ${avFT[0]?.text} / ${avFT[0]?.actionLabel}`)
  debe(await aplicarAvisoFueraDeDia(avFT[0]), '3 botón', `${nombre}: «Añadir» no pudo añadir el Free Tour`)
  const conFT = ahora()
  debe(conFT.days[1].stops.at(-1).isFreeTour && conFT.days[1].stops.at(-1).time === '10:00' && conFT.days.filter((d) => d.stops.some((s) => s.isFreeTour)).length === 1, '3 botón', `${nombre}: «Añadir» no pone el Free Tour en el día 2 con su hora`)
  // El Free Tour en otro día (la parada se quedó en el día 3).
  montar(rutaMano(3, { fechas }), [[], [], []])
  useRouteStore.getState().addReservation(reserva('r-ft-a', 'Free Tour', [FT], f(2), n(3), '10:00'), null, freeTourEntry)
  useRouteStore.setState({ reservations: [rFT] })
  const avFT2 = reservasFueraDeSuDia(ahora(), [rFT], info.nombresCortos)
  debe(avFT2.length === 1 && avFT2[0].kind === 'otro-dia' && avFT2[0].text === `Tu Free Tour es ${dia(2)}, pero en tu ruta el Free Tour está ${dia(3)}.` && avFT2[0].actionLabel === `Pasar ${alDia(2)}`, '3 aviso', `${nombre}: el aviso del Free Tour (otro día) no cuadra: ${avFT2[0]?.text} / ${avFT2[0]?.actionLabel}`)
}
// La ruta nuestra: sin cambios (este aviso es solo de la ruta a mano).
{
  const nuestra = montar(rutaMano(3, { fechas: true, manual: false }), [])
  const r = reserva('r-col', 'Coliseo, Foro y Palatino', COLISEO, sumaDias(INICIO, 1), null, '10:00')
  debe(reservasFueraDeSuDia(nuestra, [r], info.nombresCortos).length === 0, '3 aviso', 'el aviso de la reserva fuera de su día sale en una ruta nuestra')
}
// Casos que no avisan: reserva fuera del viaje, de excursión o con el sitio en su día.
{
  const ruta = montar(rutaMano(2, { fechas: true }), [['Coliseo'], []])
  const fuera = reserva('r-fuera', 'Coliseo, Foro y Palatino', COLISEO, '2027-04-30', null, '10:00')
  debe(reservasFueraDeSuDia(ruta, [fuera], info.nombresCortos).length === 0, '3 aviso', 'avisa con una reserva fuera de las fechas del viaje')
  const buena = reserva('r-buena', 'Coliseo, Foro y Palatino', COLISEO, INICIO, null, '10:00')
  debe(reservasFueraDeSuDia(ruta, [buena], info.nombresCortos).length === 0, '3 aviso', 'avisa con el sitio en el día de su fecha')
  const exc = reserva('r-exc', 'pompeya', ['Pompeya'], INICIO, null, '08:00', { kind: 'excursion' })
  debe(reservasFueraDeSuDia(ruta, [exc], info.nombresCortos).length === 0, '3 aviso', 'avisa con una excursión')
}

// ═══════════ 4. La lista de «Añadir parada» sin restaurantes ═══════════
{
  const restaurantes = D.restaurants.map((r) => r.name)
  const hayRestaurantes = catalogo.some((p) => p.kind === 'restaurant')
  debe(hayRestaurantes && restaurantes.length >= 20, '4 restaurantes', 'el catálogo de la prueba no trae restaurantes (la prueba no prueba nada)')
  const ruta = montar(rutaMano(3, { fechas: true }), [[], [], []])
  const pinta = (extra) => plano(aTexto(renderToStaticMarkup(createElement(PlaceExplorerScreen, { open: true, destination: 'Roma', places: catalogo, excursions: [], title: 'Añadir parada', route: ruta, dayNumber: 1, onClose() {}, ...extra }))))
  const pick = { confirmLabel: (k) => `Añadir (${k})`, selected: [], onToggle() {}, onConfirm() {} }
  // Elegir varios, sin filtros y con cada filtro: ni un restaurante.
  for (const filtros of [[], ['atracciones'], ['miradores'], ['entradas'], ['restaurantes']]) {
    const t = pinta({ pickMode: pick, initialFilters: filtros })
    const vistos = restaurantes.filter((nombreRest) => t.includes(nombreRest))
    debe(vistos.length === 0, '4 restaurantes', `«Añadir parada» (filtros ${filtros.join('+') || 'ninguno'}) trae restaurantes: ${vistos.slice(0, 5).join(', ')}`)
  }
  const tChips = pinta({ pickMode: pick, initialFilters: [] })
  debe(!/Restaurantes/.test(tChips), '4 restaurantes', 'en «Añadir parada» sale el filtro «Restaurantes»')
  // Lo que sí: las atracciones se pueden marcar.
  debe(tChips.includes('Coliseo') && tChips.includes('Panteón'), '4 restaurantes', 'en «Añadir parada» faltan las atracciones')
  // EXPLORAR normal (sin elegir varios): los restaurantes siguen.
  const normal = pinta({ initialFilters: ['restaurantes'] })
  const vistosNormal = restaurantes.filter((nombreRest) => normal.includes(nombreRest))
  debe(vistosNormal.length >= 5, '4 restaurantes', `EXPLORAR normal con «Restaurantes» ya no trae restaurantes (${vistosNormal.length})`)
  debe(/Restaurantes/.test(pinta({ initialFilters: [] })), '4 restaurantes', 'EXPLORAR normal ya no tiene el filtro «Restaurantes»')
}

console.log(`\n6y2 (reservas): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
