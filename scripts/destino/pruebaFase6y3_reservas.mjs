// La prueba de la Tanda 6y3, parte de RESERVAS (ruta a mano).
//   API_URL=http://localhost:8861 node scripts/destino/pruebaFase6y3_reservas.mjs     (con un servidor de la app con el código de esta tanda; por defecto http://localhost:8787)
// Pinta con el código de verdad de la app (react-dom/server, empaquetado con esbuild; ver _ssr.mjs). Da fallo si:
//   1. el orden de «Añadir parada» en la ruta a mano no es: más «me gusta» de verdad, luego el nivel 1, luego `pool_lista` en su orden SIN repetir lo que ya salió por nivel 1, luego el resto;
//      si los números de `?prueba=1` ordenan; o si el cliente no recibe el nivel y el puesto en `pool_lista` por separado;
//   2. quitar la reserva del Free Tour a mano NO quita también su parada del día, no deja el aviso con «Deshacer», o «Deshacer» no devuelve la reserva y la parada (o quitar otra reserva
//      / quitarla en la ruta nuestra cambia algo);
//   3. los botones del aviso de la reserva fuera de su día no son «Pasar al jue 11» / «Añadir al jue 11» (con y sin fechas, sitios masculinos y femeninos, Free Tour), o queda un
//      «Pasarlo» / «Añadirlo» en cualquier texto de src/, server/, shared/ o scripts/; o los textos de los avisos («Tu entrada al Coliseo es el…») cambian;
//   4. la parada del Free Tour añadida a mano no lleva la foto real de su lugar (Plaza de España, su punto de encuentro, pedida con la misma lógica que el resto, una sola vez), o sin foto (o con el servidor caído)
//      no se queda en el recuadro neutro sin romper nada.
import fs from 'node:fs'
import path from 'node:path'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}

const { M, ponerVersion } = await prepararSSR('scripts/destino/_6y3_reservas_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const {
  createElement, renderToStaticMarkup, DayList, stopFromPlace, useRouteStore, useAddFlowStore, removeReservationWithUndo, fetchDestinationPlaces, fetchDestinationExcursions, fetchArrivalInfo,
  compareManualExplorer, isManualFreeTourReservation, reservasFueraDeSuDia, aplicarAvisoFueraDeDia,
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
const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Las llamadas al motor y las fotos: la foto se cuenta (y se puede dejar vacía o caída).
const fetchReal = globalThis.fetch
let llamadasAlMotor = []
let pedidosDeFoto = []
let modoFoto = 'real' // 'real' | 'vacia' | 'cae'
globalThis.fetch = (url, opts) => {
  if (/rebuild-day|adjust-day|check-time|curated-day-inside|reservation-plan/.test(String(url))) llamadasAlMotor.push(String(url))
  if (/\/api\/place-photo/.test(String(url))) {
    pedidosDeFoto.push(JSON.parse(String(opts?.body ?? '{}')))
    if (modoFoto === 'vacia') return Promise.resolve({ ok: true, json: async () => ({ photo_source: null }) })
    if (modoFoto === 'cae') return Promise.reject(new Error('servidor caído'))
  }
  return fetchReal(url, opts)
}

const INICIO = '2027-03-10' // miércoles
// 10S5 (Eric, 30-oct): antes «lun 13» → ahora el día entero («lunes 13» en prosa) → las fechas van enteras en listas, tarjetas y frases; solo los cuadrados de elegir día quedan cortos.
const SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const sumaDias = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const corta = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${SEMANA[d.getUTCDay()]} ${d.getUTCDate()}` }

const estadoBase = { screen: 'route', mode: 'days', reservations: [], accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, n26Added: false, rentalVehicleBooking: null, esimSelections: {}, esimPrecios: {}, dev_simulated_today_iso: null, campaignCode: 'app-PRUEBA' }
let contadorRutas = 0
const rutaMano = (dias, { fechas, manual = true }) => ({
  id: `m6y3-${++contadorRutas}`, destination: 'Roma', country: 'Italia', origin: 'Madrid', createdAt: '2027-01-01', intensity: 1, budget: { items: [], total: 0 }, ...(manual ? { planMode: 'manual' } : {}),
  days: Array.from({ length: dias }, (_, i) => ({ id: `d${i + 1}`, dayNumber: i + 1, city: 'Roma', title: '', curatedTitle: '', stops: [], meals: [], excursions: [], dayType: manual ? 'manual' : 'normal', colorIndex: i })),
  answers: { dateRange: fechas ? { start: INICIO, end: sumaDias(INICIO, dias - 1) } : undefined, month: fechas ? undefined : 9, days: dias, companion: 'couple' },
  transportContext: { transport_option: { id: 'flight' }, archetype: null },
})
const lugar = (nombre) => catalogo.find((p) => p.name === nombre && p.kind === 'place')
const parada = (nombre) => stopFromPlace(lugar(nombre), 'foto')
const montar = (route, porDia = []) => {
  ponerVersion('completa')
  useRouteStore.setState({ ...estadoBase, route, reservations: [] })
  useAddFlowStore.setState({ toast: null })
  const st = useRouteStore.getState()
  route.days.forEach((day, i) => { for (const nombre of porDia[i] ?? []) st.addPlaceToDay(day.id, parada(nombre), null) })
  return useRouteStore.getState().route
}
const ahora = () => useRouteStore.getState().route
const nombresDe = (route) => route.days.map((d) => d.stops.map((s) => s.name))
const reserva = (id, refId, placeNames, dateIso, dayNumber, time, extra = {}) => ({ id, kind: 'entrada', refId, name: refId, placeNames, dateIso, dayNumber, time, ...extra })
const FT = 'Free Tour por Roma'

// ═══════════ 1. El orden de «Añadir parada» en la ruta a mano ═══════════
{
  const lugares = catalogo.filter((p) => p.kind === 'place' && !p.solo_entradas)
  const pool = D.pool_lista?.lugares ?? []
  const orden = (likes) => [...lugares].sort((a, b) => compareManualExplorer(a, b, likes)).map((p) => p.name)
  const nivel = (n) => lugares.find((p) => p.name === n)?.level
  const o = orden(new Map())
  // El cliente recibe el nivel y el puesto en pool_lista POR SEPARADO.
  const sanPedro = lugar('Plaza de San Pedro')
  const trastevere = lugar('Trastevere')
  const navona = lugar('Piazza Navona')
  debe(sanPedro && sanPedro.level === 1 && sanPedro.essential_rank == null, '1 datos', 'la Plaza de San Pedro (nivel 1, fuera de pool_lista) no llega con nivel 1 y sin puesto en pool_lista')
  debe(trastevere && trastevere.level !== 1 && trastevere.essential_rank === pool.indexOf('Trastevere') && pool.indexOf('Trastevere') >= 0, '1 datos', 'Trastevere (en pool_lista, no nivel 1) no llega con su puesto en pool_lista y su nivel aparte')
  debe(navona && navona.level === 1 && navona.essential_rank === pool.indexOf('Piazza Navona'), '1 datos', 'Piazza Navona (nivel 1 y en pool_lista) no llega con las dos cosas por separado')
  // Sin repetidos.
  debe(new Set(o).size === o.length && o.length === lugares.length, '1 orden', 'el orden repite o pierde lugares')
  // Los grupos, en este orden: nivel 1, pool_lista sin los de nivel 1, el resto.
  const nivel1 = lugares.filter((p) => p.level === 1).map((p) => p.name)
  const soloPool = pool.filter((n) => lugares.some((p) => p.name === n) && nivel(n) !== 1)
  const resto = lugares.filter((p) => p.level !== 1 && !pool.includes(p.name)).map((p) => p.name)
  debe(nivel1.length > 5 && soloPool.length > 5 && resto.length > 5, '1 orden', `los datos de Roma no tienen los tres grupos (${nivel1.length}/${soloPool.length}/${resto.length})`)
  debe(o.slice(0, nivel1.length).every((n) => nivel(n) === 1) && new Set(o.slice(0, nivel1.length)).size === nivel1.length, '1 orden', `no salen primero TODOS los de nivel 1: ${o.slice(0, nivel1.length + 2).join(', ')}`)
  debe(JSON.stringify(o.slice(nivel1.length, nivel1.length + soloPool.length)) === JSON.stringify(soloPool), '1 orden', `detrás del nivel 1 no sale pool_lista en su orden, sin repetir lo del nivel 1: ${o.slice(nivel1.length, nivel1.length + soloPool.length + 1).join(', ')}`)
  debe(o.slice(nivel1.length + soloPool.length).every((n) => resto.includes(n)) && o.slice(nivel1.length + soloPool.length).length === resto.length, '1 orden', 'el resto no va el último')
  // Casos concretos.
  debe(o.indexOf('Plaza de San Pedro') < o.indexOf('Trastevere') && o.indexOf('Plaza de San Pedro') < o.indexOf('Cúpula de San Pedro'), '1 orden', 'la Plaza de San Pedro (nivel 1) no va antes que Trastevere / la Cúpula (pool_lista)')
  debe(o.indexOf('Coliseo') < o.indexOf('Cúpula de San Pedro') && o.indexOf('Trastevere') < o.indexOf(resto[0]), '1 orden', 'un nivel 1 va detrás de uno de pool_lista, o pool_lista detrás del resto')
  debe(o.filter((n) => n === 'Piazza Navona').length === 1, '1 orden', 'Piazza Navona (nivel 1 y pool_lista) sale más de una vez')
  // «Me gusta» de verdad: primero, aunque sean del resto; y entre ellos, el que más tiene.
  const sinPool = resto[0]
  const conLikes = orden(new Map([[sinPool, 12], ['Trastevere', 50], ['Boca de la Verdad', 80]]))
  debe(conLikes.slice(0, 3).join('|') === `Boca de la Verdad|Trastevere|${sinPool}`, '1 orden', `los «me gusta» de verdad no mandan primero: ${conLikes.slice(0, 4).join(', ')}`)
  debe(conLikes[3] === o[0], '1 orden', 'con «me gusta», detrás de ellos no sigue el nivel 1 en su orden')
  // Empate de «me gusta»: manda el grupo.
  const empate = orden(new Map([['Trastevere', 5], ['Plaza de San Pedro', 5]]))
  debe(empate[0] === 'Plaza de San Pedro' && empate[1] === 'Trastevere', '1 orden', `con los mismos «me gusta», el nivel 1 no va antes que pool_lista: ${empate.slice(0, 2).join(', ')}`)
  // La regla no mira números de prueba (ya no los hay) y la pantalla le pasa la cuenta única.
  const reglaFuente = fs.readFileSync('src/lib/manualPlan.ts', 'utf8')
  const pantalla = fs.readFileSync('src/components/route/placeExplorer/PlaceExplorerScreen.tsx', 'utf8')
  debe(!/numeroDeRecomendaciones|prueba/.test(reglaFuente.replace(/\/\*\*[\s\S]*?\*\//g, '')), '1 prueba', 'la regla de orden mira los números de prueba')
  // (Tanda 6y10: la regla usa la CUENTA ÚNICA —los de partida más los de los viajeros—, no solo los de la nube.)
  debe(/compareManualExplorer\(a, b, likesTotales\)/.test(pantalla) && /likesTotales = useMemo\(\(\) => totalesDe\(/.test(pantalla) && !/compareManualExplorer\([^)]*numeroDeRecomendaciones/.test(pantalla), '1 prueba', 'la pantalla no pasa la cuenta única (partida + viajeros) a la regla')
  debe((pantalla.match(/compareManualExplorer\(/g) ?? []).length === 1 && !/essential_rank/.test(pantalla), '1 una regla', 'el orden de la ruta a mano no está en un solo sitio')
  const pantallaAnadir = fs.readFileSync('src/components/route/manualRoute/ManualAddStopsScreen.tsx', 'utf8')
  debe(!/\.sort\(/.test(pantallaAnadir) && /manualOrder|isManualRoute/.test(pantalla), '1 una regla', 'ManualAddStopsScreen ordena por su cuenta')
}

// ═══════════ 2. Quitar la reserva del Free Tour a mano quita también su parada ═══════════
modoFoto = 'vacia'
const entradaSinFoto = { ...freeTourEntry, photo_name: 'Lugar sin foto 6y3', wikipedia_title: null }
for (const fechas of [true, false]) {
  const nombre = fechas ? 'con fechas' : 'sin fechas'
  const base = montar(rutaMano(3, { fechas }), [['Fontana de Trevi', 'Panteón'], ['Piazza Navona', 'Trastevere'], ['Plaza de España']])
  const r1 = reserva('r-ft', 'Free Tour', [FT], fechas ? sumaDias(INICIO, 1) : null, fechas ? null : 2, '12:00', { precio: null })
  useRouteStore.getState().addReservation(r1, null, entradaSinFoto)
  await dormir(40)
  const conFT = JSON.parse(JSON.stringify(ahora()))
  const resConFT = JSON.parse(JSON.stringify(useRouteStore.getState().reservations))
  debe(conFT.days[1].stops.at(-1).isFreeTour && resConFT.length === 1, '2 quitar', `${nombre}: preparando la prueba, el Free Tour no está en el día`)
  debe(isManualFreeTourReservation(ahora(), r1), '2 quitar', `${nombre}: no reconoce la reserva del Free Tour a mano`)
  llamadasAlMotor = []
  removeReservationWithUndo('r-ft')
  await dormir(40)
  const sin = ahora()
  debe(useRouteStore.getState().reservations.length === 0, '2 quitar', `${nombre}: la reserva sigue después de quitarla`)
  debe(sin.days.every((d) => d.stops.every((s) => !s.isFreeTour)), '2 quitar', `${nombre}: quitar la reserva del Free Tour deja su parada en el día`)
  debe(JSON.stringify(nombresDe(sin)) === JSON.stringify(nombresDe(base)), '2 quitar', `${nombre}: quitar el Free Tour toca otras paradas (${JSON.stringify(nombresDe(sin))})`)
  debe(sin.days.every((d, i) => i === 1 || JSON.stringify(d) === JSON.stringify(conFT.days[i])), '2 quitar', `${nombre}: quitar el Free Tour cambia otro día`)
  debe(llamadasAlMotor.length === 0, '2 quitar', `${nombre}: quitar el Free Tour llama al motor`)
  const aviso = useAddFlowStore.getState().toast
  debe(aviso && /Free Tour/.test(aviso.message) && /quitado/.test(aviso.message), '2 aviso', `${nombre}: no queda el aviso corto al quitar el Free Tour (${aviso?.message})`)
  // [Deshacer]: devuelve la reserva y la parada, tal cual.
  useAddFlowStore.getState().undo()
  const vuelta = ahora()
  debe(JSON.stringify(vuelta) === JSON.stringify(conFT) && JSON.stringify(useRouteStore.getState().reservations) === JSON.stringify(resConFT), '2 deshacer', `${nombre}: «Deshacer» no devuelve la reserva y la parada tal cual estaban`)
  debe(useAddFlowStore.getState().toast === null, '2 deshacer', `${nombre}: el aviso se queda después de «Deshacer»`)
  // Quitar y volver a añadir: sin duplicar la parada.
  removeReservationWithUndo('r-ft')
  useRouteStore.getState().addReservation(r1, null, entradaSinFoto)
  debe(ahora().days.flatMap((d) => d.stops).filter((s) => s.isFreeTour).length === 1, '2 quitar', `${nombre}: quitar y volver a añadir deja el Free Tour repetido o perdido`)

  // Otra reserva (el Coliseo) se quita como siempre: sin aviso, y su parada se queda.
  montar(rutaMano(3, { fechas }), [['Coliseo'], [], []])
  useRouteStore.getState().addReservation(reserva('r-col', 'Coliseo', ['Coliseo'], fechas ? INICIO : null, fechas ? null : 1, '10:00'), null)
  removeReservationWithUndo('r-col')
  debe(useRouteStore.getState().reservations.length === 0 && ahora().days[0].stops.some((s) => s.name === 'Coliseo') && useAddFlowStore.getState().toast?.message === 'Entrada quitada del viaje', '2 otras', `${nombre}: quitar otra reserva quita su parada o no deja el aviso «Entrada quitada del viaje» (Tanda 6y4: ahora con Deshacer, ver 6y4)`)
}
// En la ruta nuestra no cambia nada: la parada que el motor puso no se quita con la reserva.
{
  const nuestra = rutaMano(2, { fechas: true, manual: false })
  nuestra.days[1].stops = [{ ...stopFromPlace(lugar('Panteón'), ''), id: 'ft-motor', name: FT, isFreeTour: true }]
  montar(nuestra, [])
  const r = reserva('r-ft', 'Free Tour', [FT], sumaDias(INICIO, 1), null, '12:00')
  useRouteStore.setState({ reservations: [r] })
  debe(!isManualFreeTourReservation(ahora(), r), '2 nuestra', 'en la ruta nuestra la reserva del Free Tour se trata como la de una ruta a mano')
  useRouteStore.getState().removeReservation('r-ft')
  debe(ahora().days[1].stops.some((s) => s.isFreeTour), '2 nuestra', 'en la ruta nuestra, quitar la reserva quita la parada del Free Tour')
}
// El cableado: los dos sitios donde el viajero quita la reserva de una parada usan el aviso con «Deshacer», y el aviso de «no cancela tu reserva» se mantiene.
{
  const menu = fs.readFileSync('src/components/route/dayDetail/StopMenu.tsx', 'utf8')
  const hoja = fs.readFileSync('src/components/route/reservas/AddReservationSheet.tsx', 'utf8')
  const marcas = fs.readFileSync('src/components/route/reservas/ReservedMarks.tsx', 'utf8')
  debe(/quitarParadaConEntrada\(dayId, stop, reserva, modo\)/.test(menu) && /<QuitarConEntradaDialog/.test(menu), '2 cableado', 'el menú de la parada no quita con el aviso (o perdió la ventana «no cancela tu reserva»)')
  debe(/removeReservationWithUndo\(existing\.id\)/.test(hoja) && /¿Quitamos tu reserva de /.test(hoja), '2 cableado', '«Eliminar reserva» no quita con el aviso (o perdió su confirmación)')
  debe(/Quitarla de tu viaje no cancela tu reserva/.test(marcas), '2 cableado', 'la ventana «no cancela tu reserva» ya no está')
}

// ═══════════ 3. Los botones del aviso: «Pasar al mié 15» / «Añadir al mié 15» ═══════════
{
  const palabras = ['Pasar' + 'lo', 'Añadir' + 'lo']
  const textoViejo = new RegExp(palabras.join('|'))
  const visitados = []
  const recorre = (dir) => {
    for (const nombre of fs.readdirSync(dir)) {
      if (nombre === 'node_modules' || nombre === 'dist') continue
      const ruta = path.join(dir, nombre)
      const st = fs.statSync(ruta)
      if (st.isDirectory()) recorre(ruta)
      else if (/\.(ts|tsx|js|mjs|jsx)$/.test(nombre) && nombre !== 'pruebaFase6y3_reservas.mjs') visitados.push(ruta)
    }
  }
  for (const dir of ['src', 'server', 'shared', 'scripts']) recorre(dir)
  const sucios = visitados.filter((f) => textoViejo.test(fs.readFileSync(f, 'utf8')))
  debe(visitados.length > 100 && sucios.length === 0, '3 textos', `quedan ${palabras.join('/')} en: ${sucios.join(', ')}`)

  for (const fechas of [true, false]) {
    const nombre = fechas ? 'con fechas' : 'sin fechas'
    const dia2 = fechas ? corta(sumaDias(INICIO, 1)) : 'día 2'
    const esperadoCorto = fechas ? `al ${dia2}` : 'al día 2'
    // El sitio está en otro día (masculino y femenino).
    for (const sitio of ['Coliseo', 'Galería Borghese']) {
      montar(rutaMano(3, { fechas }), [[sitio], [], []])
      const r = reserva(`r-${sitio}`, sitio, [sitio], fechas ? sumaDias(INICIO, 1) : null, fechas ? null : 2, '10:00')
      useRouteStore.getState().addReservation(r)
      const ruta = ahora()
      const avisos = reservasFueraDeSuDia(ruta, [r], info.nombresCortos)
      debe(avisos.length === 1 && avisos[0].kind === 'otro-dia' && avisos[0].actionLabel === `Pasar ${esperadoCorto}`, '3 botón', `${nombre}, ${sitio} en otro día: el botón no dice «Pasar ${esperadoCorto}» sino «${avisos[0]?.actionLabel}»`)
      debe(/^Tu entrada al? /.test(avisos[0]?.text ?? '') && / es (el )?/.test(avisos[0]?.text ?? '') && /, pero en tu ruta /.test(avisos[0]?.text ?? ''), '3 aviso', `${nombre}, ${sitio}: el texto del aviso cambió: ${avisos[0]?.text}`)
      debe(!/ lo /.test(avisos[0]?.actionLabel ?? ' lo '), '3 botón', `${nombre}, ${sitio}: el botón lleva «lo»`)
      // Y el botón sigue haciendo lo que dice.
      if (avisos[0]) {
        debe(await aplicarAvisoFueraDeDia(avisos[0]), '3 botón', `${nombre}, ${sitio}: el botón no pudo pasar la parada`)
        debe(ahora().days[1].stops.some((s) => s.name === sitio) && !ahora().days[0].stops.some((s) => s.name === sitio), '3 botón', `${nombre}, ${sitio}: «Pasar» no mueve la parada al día de la reserva`)
      }
    }
    // El sitio no está en la ruta.
    for (const sitio of ['Coliseo', 'Galería Borghese']) {
      montar(rutaMano(3, { fechas }), [['Trastevere'], [], []])
      const r = reserva(`r-${sitio}`, sitio, [sitio], fechas ? sumaDias(INICIO, 1) : null, fechas ? null : 2, '10:00')
      useRouteStore.getState().addReservation(r)
      const ruta = ahora()
      const avisos = reservasFueraDeSuDia(ruta, [r], info.nombresCortos)
      debe(avisos.length === 1 && avisos[0].kind === 'no-esta' && avisos[0].actionLabel === `Añadir ${esperadoCorto}`, '3 botón', `${nombre}, ${sitio} no está: el botón no dice «Añadir ${esperadoCorto}» sino «${avisos[0]?.actionLabel}»`)
      debe(/ y .* no está en tu ruta\.$/.test(avisos[0]?.text ?? ''), '3 aviso', `${nombre}, ${sitio}: el texto del aviso cambió: ${avisos[0]?.text}`)
    }
    // El Free Tour.
    {
      const ruta = montar(rutaMano(3, { fechas }), [['Trastevere'], [], []])
      const r = reserva('r-ft', 'Free Tour', [FT], fechas ? sumaDias(INICIO, 1) : null, fechas ? null : 2, '10:00')
      const avisos = reservasFueraDeSuDia(ruta, [r], info.nombresCortos)
      debe(avisos.length === 1 && avisos[0].actionLabel === `Añadir ${esperadoCorto}` && /^Tu Free Tour es /.test(avisos[0].text), '3 botón', `${nombre}, Free Tour: ${avisos[0]?.actionLabel} / ${avisos[0]?.text}`)
    }
  }
  // El texto exacto de los avisos que NO cambian.
  montar(rutaMano(3, { fechas: true }), [['Coliseo'], [], []])
  const rCol = reserva('r-col', 'Coliseo, Foro y Palatino', ['Coliseo', 'Foro Romano y Palatino'], sumaDias(INICIO, 1), null, '10:00')
  useRouteStore.getState().addReservation(rCol)
  const [aviso] = reservasFueraDeSuDia(ahora(), [rCol], info.nombresCortos)
  debe(aviso && aviso.text === `Tu entrada al Coliseo es el ${corta(sumaDias(INICIO, 1))}, pero en tu ruta el Coliseo está el ${corta(INICIO)}.` && aviso.actionLabel === `Pasar al ${corta(sumaDias(INICIO, 1))}`, '3 aviso', `el aviso no es el de siempre con el botón nuevo: ${aviso?.text} / ${aviso?.actionLabel}`)
  const fuenteAviso = fs.readFileSync('src/lib/reservaFueraDeDia.ts', 'utf8')
  debe(/Tu entrada al/.test(fuenteAviso) || /Tu entrada/.test(fuenteAviso), '3 aviso', 'el texto «Tu entrada al…» ya no está en un solo sitio')
}

// ═══════════ 4. La foto real de la parada del Free Tour ═══════════
{
  debe(freeTourEntry.photo_name === 'Plaza de España', '4 foto', `el servidor no manda el lugar de la foto del Free Tour (Plaza de España): ${freeTourEntry.photo_name}`)
  const directa = await (await fetchReal(`${process.env.API_URL ?? 'http://localhost:8787'}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Plaza de España', city: 'Roma', wikipedia_title: freeTourEntry.wikipedia_title ?? null }) })).json()
  console.log(`  (foto de Plaza de España según el servidor: ${directa.photo_source ?? 'ninguna'})`)
  debe(['unsplash', 'wikipedia', 'propia'].includes(directa.photo_source), '4 foto', 'el servidor no devuelve ninguna foto para Plaza de España')

  modoFoto = 'real'
  pedidosDeFoto = []
  montar(rutaMano(3, { fechas: true }), [['Fontana de Trevi'], [], []])
  const r1 = reserva('r-ft', 'Free Tour', [FT], sumaDias(INICIO, 1), null, '12:00', { precio: null })
  useRouteStore.getState().addReservation(r1, null, freeTourEntry)
  const sinFotoAun = ahora().days[1].stops.at(-1)
  debe(sinFotoAun.isFreeTour && sinFotoAun.photoName === 'Plaza de España' && !/picsum/.test(sinFotoAun.photoUrl ?? ''), '4 foto', `la parada nace con la foto de relleno de picsum o sin el lugar de su foto (${sinFotoAun.photoUrl}, ${sinFotoAun.photoName})`)
  let conFoto = null
  for (let i = 0; i < 100 && !conFoto; i++) {
    await dormir(100)
    conFoto = ahora().days[1].stops.at(-1).photoUrl || null
  }
  debe(Boolean(conFoto) && /^(https?:\/\/|\/fotos\/)/.test(conFoto) && !/picsum/.test(conFoto), '4 foto', `la parada del Free Tour no acaba con la foto real (${conFoto})`)
  debe(pedidosDeFoto.length === 1 && pedidosDeFoto[0].name === 'Plaza de España' && pedidosDeFoto[0].city === 'Roma', '4 foto', `se pidió la foto del punto de encuentro con la misma petición que el resto de paradas, y una sola vez (${JSON.stringify(pedidosDeFoto)})`)
  debe((pedidosDeFoto[0]?.wikipedia_title ?? null) === (freeTourEntry.wikipedia_title ?? null), '4 foto', 'la petición no lleva el wikipedia_title del lugar')
  // Cambiar la fecha (la misma parada) o guardar otra vez no pide nada más.
  useRouteStore.getState().addReservation(reserva('r-ft2', 'Free Tour', [FT], sumaDias(INICIO, 2), null, '15:00', { precio: null }), null, freeTourEntry)
  await dormir(150)
  debe(pedidosDeFoto.length === 1 && ahora().days[2].stops.at(-1).photoUrl === conFoto, '4 foto', `cambiar la fecha pide la foto otra vez o la pierde (${pedidosDeFoto.length} peticiones)`)
  // Que se vea: DÍAS pinta la parada con su foto.
  const html = renderToStaticMarkup(createElement(DayList, { route: ahora(), activeDayId: 'd3', onSelectDay() {}, showAllDaysOnMap: false }))
  debe(html.includes(FT) && !html.includes('picsum'), '4 foto', 'DÍAS no pinta la parada del Free Tour (o pinta una foto de relleno)')

  // Sin foto (el servidor no tiene ninguna) y con el servidor caído: recuadro neutro, sin romper.
  for (const modo of ['vacia', 'cae']) {
    modoFoto = modo
    pedidosDeFoto = []
    montar(rutaMano(3, { fechas: true }), [['Fontana de Trevi'], [], []])
    useRouteStore.getState().addReservation(reserva('r-ft', 'Free Tour', [FT], sumaDias(INICIO, 1), null, '12:00', { precio: null }), null, { ...freeTourEntry, photo_name: `Lugar ${modo} 6y3`, wikipedia_title: null })
    await dormir(150)
    const p = ahora().days[1].stops.at(-1)
    debe(p.isFreeTour && !p.photoUrl && p.time === '12:00', '4 neutro', `${modo}: la parada del Free Tour sin foto no se queda en el recuadro neutro (${p.photoUrl})`)
    let pintado = ''
    try {
      pintado = renderToStaticMarkup(createElement(DayList, { route: ahora(), activeDayId: 'd2', onSelectDay() {}, showAllDaysOnMap: false }))
    } catch (error) {
      pintado = `ERROR ${error.message}`
    }
    debe(pintado.includes(FT) && !pintado.startsWith('ERROR') && !pintado.includes('picsum'), '4 neutro', `${modo}: DÍAS se rompe o pinta una foto de relleno con la parada del Free Tour sin foto`)
    debe(pedidosDeFoto.length === 1, '4 neutro', `${modo}: se pidió la foto ${pedidosDeFoto.length} veces`)
  }
  // Sin datos del destino (sin entrada): ninguna petición (nunca se busca por el nombre «Free Tour»).
  modoFoto = 'real'
  pedidosDeFoto = []
  montar(rutaMano(3, { fechas: true }), [])
  useRouteStore.getState().addReservation(reserva('r-ft', 'Free Tour', [FT], sumaDias(INICIO, 1), null, '12:00', { precio: null }), null, null)
  await dormir(150)
  debe(pedidosDeFoto.length === 0 && ahora().days[1].stops.at(-1).isFreeTour && !ahora().days[1].stops.at(-1).photoUrl, '4 sin entrada', `sin datos del destino se pidió una foto (${JSON.stringify(pedidosDeFoto)})`)
  // El botón «Añadir al jue 11» del aviso (Free Tour que no está en la ruta) también trae la foto.
  modoFoto = 'real'
  pedidosDeFoto = []
  const ruta = montar(rutaMano(3, { fechas: true }), [['Trastevere'], [], []])
  const rr = reserva('r-ft', 'Free Tour', [FT], sumaDias(INICIO, 1), null, '12:00')
  useRouteStore.setState({ reservations: [rr] })
  const [av] = reservasFueraDeSuDia(ruta, [rr], info.nombresCortos)
  debe(av && (await aplicarAvisoFueraDeDia(av)), '4 botón', 'el botón del aviso no pudo añadir el Free Tour')
  let f2 = null
  for (let i = 0; i < 100 && !f2; i++) {
    await dormir(100)
    f2 = ahora().days[1].stops.find((s) => s.isFreeTour)?.photoUrl || null
  }
  debe(Boolean(f2) && !/picsum/.test(f2), '4 botón', `«Añadir al…» no deja la parada del Free Tour con su foto real (${f2})`)
}

console.log(`\n6y3 (reservas): ${comprobaciones} comprobaciones, ${fallos.length} fallos.`)
const vistos = new Set()
for (const f of fallos) {
  const clave = `${f.regla}|${f.texto}`
  if (vistos.has(clave) || vistos.size > 60) continue
  vistos.add(clave)
  console.log(`  ✗ [${f.regla}] ${f.texto}`)
}
process.exit(fallos.length === 0 ? 0 : 1)
