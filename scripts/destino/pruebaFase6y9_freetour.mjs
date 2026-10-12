// Prueba de la Tanda 6y9, parte del motor (el Free Tour de las 19:00, la regla nueva de la cena, el turno real de la Galería y el último cambio de fechas):
//   node scripts/destino/pruebaFase6y9_freetour.mjs [parte=1,2] [fechas=lun,mie,...] [ver=25]
//   Parte 2 (el último cambio de fechas gana) pinta con el código de la app y necesita el servidor encendido: API_URL=http://localhost:8852 node scripts/destino/pruebaFase6y9_freetour.mjs parte=2
//
// Da fallo si:
//   1. la lista de horas del Free Tour (shared/routeEngine/freeTourHoras.js) no es 10:00, 12:00, 15:00, 17:00, 19:00 y 21:00 con sus franjas y nombres, o las pantallas/servidor vuelven a escribir su propia lista;
//   2. el Free Tour de las 19:00 no lleva la cena DESPUÉS (cerca de Navona, donde acaba) o el de las 21:00 no la lleva ANTES; o, en general, la cena no va antes solo si al salir de la reserva son MÁS de las 22:00
//      (un tour de 19:30 sale a las 22:00 → después; uno de 19:35 → antes);
//   3. el Free Tour de la noche (19:00 o 21:00) no va EN LUGAR de Trevi y la Plaza de España, o el viaje con el de las 19:00 no lleva los mismos días, en el mismo orden, que con el de las 21:00
//      (los días «Sin Free Tour»: ni D3, ni tour de mañana), o el de las 17:00 deja de llevar su D3;
//   4. el turno real de la Galería Borghese (sin reserva puesta) no entra SIEMPRE en la regla de la comida —con o sin otra reserva el mismo día—: sale a las 13:00 (turno de 11:00) → comida después; a las 15:00
//      (turno de 13:00) → comida antes; ni con ni sin otra reserva;
//   5. ninguna reserva sale tarde (la fila del tour y su «Llegada a…»);
//   6. (parte 2) si llega un SEGUNDO cambio de fechas con un rehacer en marcha, no gana el último (contador de generación, `key` en RehacerRuta, resultado del primero descartado).
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { FREE_TOUR_HORAS, franjaDelFreeTour } from '../../shared/routeEngine/freeTourHoras.js'
import { freeTourDeNoche, hasFreeTourFromAnswers, respuestasConFreeTour, findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const PARTES = new Set((args.parte ?? '1,2').split(','))
const VER = Number(args.ver ?? 25)
const toMin = (h) => Number(String(h).split(':')[0]) * 60 + Number(String(h).split(':')[1])
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const DIAS_TIPO = {
  lun: '2027-03-01', mar: '2027-03-02', mie: '2027-03-03', jue: '2027-03-04', vie: '2027-03-05', sab: '2027-03-06', dom: '2027-03-07',
  pascua: '2027-03-28', festivo: '2027-06-02', ferragosto: '2027-08-15', agosto: '2027-08-10', navidad: '2027-12-25', nochevieja: '2027-12-31', anonuevo: '2027-01-01', reyes: '2027-01-06',
}
const FECHAS = (args.fechas ? args.fechas.split(',') : Object.keys(DIAS_TIPO)).filter((k) => DIAS_TIPO[k])
const fallos = []
let comprobaciones = 0
const porRegla = {}
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    porRegla[regla] = (porRegla[regla] ?? 0) + 1
    fallos.push({ regla, texto })
  }
}
const cuenta = { cenaDespues: 0, cenaAntes: 0, distanciaMax: 0, viajes: 0 }

// ═══ 1. La lista de horas, en un solo sitio ═══
if (PARTES.has('1')) {
  console.log('1. La lista de horas del Free Tour')
  const horas = FREE_TOUR_HORAS.map((x) => x.hora).join(',')
  debe(horas === '10:00,12:00,15:00,17:00,19:00,21:00', 'lista', `las horas del Free Tour son ${horas}`)
  const franjas = FREE_TOUR_HORAS.map((x) => x.franja).join(',')
  debe(franjas === 'manana,manana,tarde,tarde,noche,noche', 'lista', `las franjas son ${franjas}`)
  for (const x of FREE_TOUR_HORAS) debe(franjaDelFreeTour(x.hora) === x.franja, 'lista', `${x.hora}: franjaDelFreeTour da ${franjaDelFreeTour(x.hora)} y la lista dice ${x.franja}`)
  const nombre = (h) => FREE_TOUR_HORAS.find((x) => x.hora === h)?.nombre
  debe(nombre('15:00') === 'Después de comer' && nombre('17:00') === 'Por la tarde', 'lista', 'los nombres de las 15:00 y las 17:00 no son «Después de comer» y «Por la tarde»')
  debe(freeTourDeNoche({ freeTourDespues: { hora: '19:00' } }) && freeTourDeNoche({ freeTourDespues: { hora: '21:00' } }) && !freeTourDeNoche({ freeTourDespues: { hora: '17:00' } }) && !freeTourDeNoche({ freeTourDespues: { hora: '10:00' } }), 'lista', 'freeTourDeNoche no separa las 19:00 y las 21:00 de las demás')
  debe(!hasFreeTourFromAnswers({ experiencesPositive: ['free_tour'], freeTourDespues: { hora: '19:00' } }) && hasFreeTourFromAnswers({ experiencesPositive: ['free_tour'], freeTourDespues: { hora: '17:00' } }), 'lista', 'el Free Tour de las 19:00 cuenta como tour de mañana')
  const r19 = respuestasConFreeTour({ experiencesPositive: [] }, [{ placeNames: ['Free Tour por Roma'], time: '19:00', dateIso: '2027-03-02', dayNumber: 2 }])
  debe(r19.freeTourDespues?.franja === 'noche', 'lista', `una reserva del Free Tour a las 19:00 sale con la franja «${r19.freeTourDespues?.franja}»`)
  // Nadie más escribe las horas: ni el servidor ni el motor tienen su propia lista del tour (las pantallas las lee C de la misma lista).
  for (const f of ['server/routeAlgorithm.js', 'shared/routeEngine/listasTrip.js']) {
    const codigo = fs.readFileSync(f, 'utf8')
    debe(!/< ?19 \* 60|< ?13 \* 60 \? 'manana'/.test(codigo), 'lista', `${f} vuelve a escribir sus propios cortes del Free Tour`)
  }
}

// ═══ 2 a 5. El motor ═══
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const tour = D.default_free_tour
const restauranteDe = (nombre) => D.restaurants.find((r) => r.name === nombre)
const coordsDe = (r) => (Array.isArray(r?.coordinates) ? r.coordinates : r?.coordinates ? [r.coordinates.lat, r.coordinates.lng] : null)
const FORMAS = [{ dias: 3 }, { dias: 5, diaCuatro: 'roma' }, { dias: 7, diaCuatro: 'roma' }]
const planFT = (iso, forma, hora, extra = {}) => planListasTrip({ destData: D, written, hasFreeTour: false, poolNames: [], experiencesPositive: [], travel, totalDays: forma.dias, dateRangeStartIso: iso, diaCuatro: forma.diaCuatro ?? null, freeTourDespues: { franja: franjaDelFreeTour(hora), hora }, ...extra })
const diaDelTour = (p) => (p?.days ?? []).find((d) => (d.escritoRows ?? []).some((r) => r.tipo === 'tour' && !r.llegada))

if (PARTES.has('1')) {
  console.log('2 a 5. El Free Tour de la noche, la cena y los días')
  const HORAS_NOCHE = ['19:00', '19:30', '19:35', '20:00', '21:00', '21:30']
  for (const clave of FECHAS) {
    const iso = DIAS_TIPO[clave]
    for (const forma of FORMAS) {
      const planes = {}
      for (const hora of HORAS_NOCHE) {
        let p
        try { p = planFT(iso, forma, hora) } catch (e) { debe(false, 'error', `${clave} ${forma.dias} d ${hora}: ${e.message}`); continue }
        planes[hora] = p
        cuenta.viajes++
        const d = diaDelTour(p)
        const etiqueta = `${clave} ${iso} (${forma.dias} d) Free Tour ${hora}`
        if (!d) continue // (un día de «Sin Free Tour»: no se pone; se compara más abajo con el de las 21:00)
        const filas = d.escritoRows
        const iT = filas.findIndex((r) => r.tipo === 'tour' && !r.llegada)
        const iLleg = filas.findIndex((r) => r.tipo === 'tour' && r.llegada)
        const iCena = filas.findIndex((r) => r.tipo === 'cena')
        // 5. Nada sale tarde.
        debe(!(filas[iT].tarde > 0) && !(filas[iLleg]?.tarde > 0), 'tarde', `${etiqueta}: el tour sale tarde (${filas[iT].tarde} min)`)
        debe(filas[iT].hora_fija === hora, 'hora', `${etiqueta}: el tour no se queda a su hora (${filas[iT].hora_fija})`)
        // 3. En lugar de Trevi y la Plaza de España.
        for (const lugar of ['Fontana de Trevi', 'Plaza de España']) debe(!filas.some((r) => r.lugar === lugar && !r.llegada && r.tipo !== 'tour'), 'sustituye', `${etiqueta}: el día del tour lleva «${lugar}», que el tour ya recorre`)
        // 2. La cena según a qué hora sale el tour.
        if (iCena < 0) { debe(false, 'cena', `${etiqueta}: el día no lleva cena`); continue }
        const sale = toMin(hora) + (tour.duration_minutes ?? 150)
        const llegadaMin = toMin((filas[iLleg] ?? filas[iT]).hora)
        const cabeAntes = llegadaMin >= toMin('18:00') + 60 + 12
        if (sale > toMin('22:00')) {
          if (cabeAntes) { cuenta.cenaAntes++; debe(iCena < (iLleg >= 0 ? iLleg : iT), 'cena', `${etiqueta}: sale a las ${toHHMM(sale)} (más de las 22:00): la cena tiene que ir ANTES y va después`) }
        } else {
          cuenta.cenaDespues++
          debe(iCena > iT, 'cena', `${etiqueta}: sale a las ${toHHMM(sale)} (las 22:00 o antes): la cena tiene que ir DESPUÉS y va antes`)
          if (hora === '19:00' || hora === '19:30') {
            const rest = restauranteDe(filas[iCena].restaurante)
            const m = Math.round(straightLineMeters(coordsDe(rest), tour.ends_at.coordinates))
            cuenta.distanciaMax = Math.max(cuenta.distanciaMax, m)
            debe(m <= 1000, 'navona', `${etiqueta}: la cena (${filas[iCena].restaurante}) está a ${m} m de Navona (donde acaba el tour)`)
          }
        }
      }
      // 3. Los mismos días, en el mismo orden, con el de las 19:00 que con el de las 21:00; y el tour en el mismo día.
      if (planes['19:00'] && planes['21:00']) {
        const ids = (p) => p.days.map((d) => d.written?.id ?? d.curatedDay?.id ?? d.id ?? d.dayNumber).join(',')
        debe(ids(planes['19:00']) === ids(planes['21:00']), 'dias', `${clave} ${iso} (${forma.dias} d): con las 19:00 los días son ${ids(planes['19:00'])} y con las 21:00, ${ids(planes['21:00'])}`)
        debe(planes['19:00'].days.findIndex((d) => diaDelTour({ days: [d] })) === planes['21:00'].days.findIndex((d) => diaDelTour({ days: [d] })), 'dias', `${clave} ${iso} (${forma.dias} d): el tour de las 19:00 y el de las 21:00 no caen el mismo día`)
        // (Como lo manda el servidor: el de las 17:00 es una reserva más —entradas— y lleva el D3; el de la noche, no.)
        const de17 = planListasTrip({ destData: D, written, hasFreeTour: true, poolNames: [], experiencesPositive: [], travel, totalDays: forma.dias, dateRangeStartIso: iso, diaCuatro: forma.diaCuatro ?? null, entradas: { 'Free Tour por Roma': '17:00' } })
        debe(de17 && ids(de17).includes('D3') && !ids(planes['19:00']).includes('D3') && !ids(planes['21:00']).includes('D3'), 'dias', `${clave} (${forma.dias} d): con las 17:00 los días son ${de17 && ids(de17)} (debe llevar D3) y con la noche, ${ids(planes['19:00'])} (sin D3)`)
      }
    }
  }
}

// ═══ 4. El turno real de la Galería entra siempre en la regla de la comida ═══
if (PARTES.has('1')) {
  console.log('4. El turno real de la Galería Borghese')
  const GAL = 'Galería Borghese'
  const INVENTADO = 'Museo Inventado'
  const clonar = (turno, conOtra) => {
    let dest = JSON.parse(JSON.stringify(D))
    let wr = JSON.parse(JSON.stringify(written))
    dest.places.find((p) => p.name === GAL).turnos = { ...dest.places.find((p) => p.name === GAL).turnos, desde: turno, hasta: turno }
    if (conOtra) {
      dest = JSON.parse(JSON.stringify(dest).replaceAll('Ara Pacis', INVENTADO))
      wr = JSON.parse(JSON.stringify(wr).replaceAll('Ara Pacis', INVENTADO))
      const place = dest.places.find((p) => p.name === INVENTADO)
      place.duration_minutes = 60
      delete place.schedule; delete place.closed_on; delete place.by_day; delete place.last_entry
    }
    return { dest, wr }
  }
  const dur = D.places.find((p) => p.name === GAL).duration_minutes ?? 120
  const iso = DIAS_TIPO.mie // el día de la Galería: 5 y 7 días, el día 2
  for (const turno of ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']) {
    for (const conOtra of [false, true]) {
      const { dest, wr } = clonar(turno, conOtra)
      for (const forma of [{ dias: 5, diaCuatro: 'roma' }, { dias: 7, diaCuatro: 'roma' }]) {
        const dayIso = '2027-03-03'
        const base = { destData: dest, written: wr, hasFreeTour: false, poolNames: [], experiencesPositive: [], travel, totalDays: forma.dias, dateRangeStartIso: '2027-03-02', diaCuatro: forma.diaCuatro }
        const p = planListasTrip(conOtra ? { ...base, reservasViaje: [{ name: INVENTADO, dateIso: dayIso, dayNumber: 2, time: '17:30' }] } : base)
        const d = (p?.days ?? []).find((x) => x.hours?.dateIso === dayIso && (x.escritoRows ?? []).some((r) => r.lugar === GAL))
        const etiqueta = `Galería turno ${turno}${conOtra ? ' + otra reserva a las 17:30' : ''} (${forma.dias} d)`
        if (!d) { debe(false, 'galeria', `${etiqueta}: el día de la Galería no sale`); continue }
        const filas = d.escritoRows
        const iG = filas.findIndex((r) => r.lugar === GAL && !r.llegada)
        const iL = filas.findIndex((r) => r.lugar === GAL && r.llegada)
        const iC = filas.findIndex((r) => r.tipo === 'comida')
        if (iG < 0 || iC < 0) { debe(false, 'galeria', `${etiqueta}: falta la Galería o la comida`); continue }
        const horaG = filas[iG].hora
        const sale = toMin(horaG) + dur
        const cabeAntes = toMin((filas[iL] ?? filas[iG]).hora) >= toMin('10:30') + 45 + 12
        const forzado = (d.escritoLog ?? []).some((l) => /no puede ir antes de la reserva/.test(l.causa ?? ''))
        debe(!(filas[iG].tarde > 0) && !(filas[iL]?.tarde > 0), 'tarde', `${etiqueta}: la Galería sale tarde`)
        if (sale > toMin('14:30') && cabeAntes) debe(iC < (iL >= 0 ? iL : iG) || forzado, 'galeria', `${etiqueta}: la visita es a las ${horaG} y sale a las ${toHHMM(sale)} (más de las 14:30): la comida tiene que ir ANTES y va después`)
        else if (sale <= toMin('14:30')) debe(iC > iG, 'galeria', `${etiqueta}: la visita es a las ${horaG} y sale a las ${toHHMM(sale)} (las 14:30 o antes): la comida tiene que ir DESPUÉS y va antes`)
        if (!conOtra) cuenta.viajes++
      }
    }
  }
}

// ═══ 6. El último cambio de fechas gana ═══
if (PARTES.has('2')) {
  console.log('6. El último cambio de fechas gana (almacén y rehacer de la ruta)')
  const { prepararSSR } = await import('./_ssr.mjs')
  const { M } = await prepararSSR('scripts/destino/_6y7_pantallas_entrada.tsx')
  const { useRouteStore } = M
  const ruta = {
    id: 'p6y9', destination: 'Roma', days: [{ id: 'd1', dayNumber: 1, stops: [], curatedId: 'D1' }, { id: 'd2', dayNumber: 2, stops: [], curatedId: 'D2' }, { id: 'd3', dayNumber: 3, stops: [], curatedId: 'D3' }],
    answers: { dateRange: { start: '2027-08-10', end: '2027-08-12' }, days: 3, companion: 'solo' }, transportContext: { transport_option: { id: 'flight' }, archetype: null },
  }
  useRouteStore.setState({ screen: 'route', mode: 'days', route: ruta, rehaciendoRuta: false, keepBookingsOnNextRoute: false })
  const g0 = useRouteStore.getState().rehacerGeneracion
  useRouteStore.getState().regenerateRouteForDates({ start: '2027-09-14', end: '2027-09-16' })
  const g1 = useRouteStore.getState().rehacerGeneracion
  useRouteStore.getState().regenerateRouteForDates({ start: '2027-10-01', end: '2027-10-03' })
  const s = useRouteStore.getState()
  debe(g1 === g0 + 1 && s.rehacerGeneracion === g0 + 2, 'ultimo', `el contador de generación no sube con cada cambio de fechas (${g0} → ${g1} → ${s.rehacerGeneracion})`)
  debe(s.answers.dateRange?.start === '2027-10-01' && s.answers.dateRange?.end === '2027-10-03', 'ultimo', 'con dos cambios de fechas seguidos no se rehace con las del último')
  debe(s.rehaciendoRuta === true && s.screen === 'route', 'ultimo', 'el segundo cambio de fechas no deja el rehacer en marcha en la misma pantalla')
  // Un rehacer cancelado no puede pisar al último: el rehacer se vuelve a montar con la `key` de la generación y la generación descarta su resultado al desmontarse.
  const rehacer = fs.readFileSync('src/components/route/RehacerRuta.tsx', 'utf8')
  const gen = fs.readFileSync('src/lib/useRouteGeneration.ts', 'utf8')
  debe(/<RehacerRutaEnMarcha key=\{generacion\}/.test(rehacer) && /rehacerGeneracion/.test(rehacer), 'ultimo', 'RehacerRuta no se vuelve a montar con la generación nueva (el primer rehacer seguiría vivo)')
  debe(/let cancelled = false/.test(gen) && /cancelled = true/.test(gen) && (gen.match(/if \(cancelled\)/g) ?? []).length >= 2, 'ultimo', 'la generación ya no descarta el resultado de un rehacer cancelado')
  const store = fs.readFileSync('src/store/useRouteStore.ts', 'utf8')
  debe(!/isManualRoute\(state\.route\) \|\| state\.rehaciendoRuta\) return state/.test(store), 'ultimo', 'el almacén sigue ignorando el segundo cambio de fechas mientras hay un rehacer en marcha')
}

console.log(`\n${comprobaciones} comprobaciones (${cuenta.viajes} viajes; cena después ${cuenta.cenaDespues}, cena antes ${cuenta.cenaAntes}; la cena más lejos de Navona con las 19:00: ${cuenta.distanciaMax} m), ${fallos.length} fallos`)
for (const [r, n] of Object.entries(porRegla)) console.log(`  regla «${r}»: ${n} fallos`)
for (const f of fallos.slice(0, VER)) console.log(`  ✗ [${f.regla}] ${f.texto}`)
if (args.json) fs.writeFileSync(args.json, JSON.stringify({ comprobaciones, porRegla, fallos }, null, 1))
process.exitCode = fallos.length === 0 ? 0 : 1
setTimeout(() => process.exit(process.exitCode), 300).unref()
