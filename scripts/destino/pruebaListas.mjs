// La prueba del motor de listas: todos los viajes de 1 a 6 días, las 365 fechas de 2027, con y sin pool, Free Tour y reservas.
//   node scripts/destino/pruebaListas.mjs [desde=AAAA-MM-DD] [n=fechas seguidas] [paso=N] [dias=1,2,3…] [sinreservasdia=1] [antiguo=1: sin la regla de las reservas con día, para ver que la prueba la echa en falta] [fallos=ruta.txt] [out=docs/dias/PRUEBA_LISTAS.md]
// (`paso`: una de cada N fechas, para mirar rápido; sin él, las 365.)
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { comprobarViaje } from './comprobacionesListas.mjs'
import { RESERVAS_GRANDES } from '../../shared/routeEngine/listasReservas.js'
import { closedOnDay } from '../../shared/routeEngine/openingHours.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const paso = Number(args.paso ?? 1)
const SOLO = args.dias ? new Set(args.dias.split(',')) : null
const out = args.out ?? 'docs/dias/PRUEBA_LISTAS.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'

// Las formas de viaje (días de contenido; el viaje dura uno más: el último es la vuelta).
const FORMAS = [
  { g: '1', clave: '1 día', dias: 1 },
  { g: '1.5', clave: '1,5 días, medio día de tarde', dias: 2, medio: { franja: 'tarde' } },
  { g: '1.5', clave: '1,5 días, medio día de mañana', dias: 2, medio: { franja: 'manana', salida: '15:00' } },
  { g: '2', clave: '2 días', dias: 2 },
  { g: '2', clave: '2 días con Free Tour', dias: 2, ft: true },
  { g: '2.5', clave: '2,5 días, medio día de tarde', dias: 3, medio: { franja: 'tarde' } },
  { g: '2.5', clave: '2,5 días, medio día de mañana', dias: 3, medio: { franja: 'manana', salida: '15:00' } },
  { g: '2.5', clave: '2,5 días con Free Tour, medio día de tarde', dias: 3, ft: true, medio: { franja: 'tarde' } },
  { g: '2.5', clave: '2,5 días con Free Tour, medio día de mañana', dias: 3, ft: true, medio: { franja: 'manana', salida: '15:00' } },
  { g: '3', clave: '3 días', dias: 3 },
  { g: '3', clave: '3 días con Free Tour', dias: 3, ft: true },
  { g: '3.5', clave: '3,5 días, medio día de mañana', dias: 4, medio: { franja: 'manana', salida: '15:00' } },
  { g: '3.5', clave: '3,5 días con Free Tour, medio día de mañana', dias: 4, ft: true, medio: { franja: 'manana', salida: '15:00' } },
  { g: '3.5', clave: '3,5 días, medio día de tarde', dias: 4, medio: { franja: 'tarde' } },
  // El día 4 lleva el interruptor [Roma | Excursión] (Tanda 6g): por defecto Roma en 4 días y Excursión en 5 y 6; cada forma, con el interruptor en las dos posiciones.
  { g: '4', clave: '4 días', dias: 4, diaCuatro: 'roma' },
  { g: '4', clave: '4 días con Free Tour', dias: 4, ft: true, diaCuatro: 'roma' },
  { g: '4', clave: '4 días, interruptor en Excursión', dias: 4, diaCuatro: 'excursion' },
  { g: '4', clave: '4 días con Free Tour, interruptor en Excursión', dias: 4, ft: true, diaCuatro: 'excursion' },
  { g: '5', clave: '5 días', dias: 5, diaCuatro: 'excursion' },
  { g: '5', clave: '5 días con Free Tour', dias: 5, ft: true, diaCuatro: 'excursion' },
  { g: '5', clave: '5 días, interruptor en Roma', dias: 5, diaCuatro: 'roma' },
  { g: '5', clave: '5 días con Free Tour, interruptor en Roma', dias: 5, ft: true, diaCuatro: 'roma' },
  { g: '6', clave: '6 días', dias: 6, diaCuatro: 'excursion' },
  { g: '6', clave: '6 días con Free Tour', dias: 6, ft: true, diaCuatro: 'excursion' },
  { g: '6', clave: '6 días, interruptor en Roma', dias: 6, diaCuatro: 'roma' },
  { g: '6', clave: '6 días con Free Tour, interruptor en Roma', dias: 6, ft: true, diaCuatro: 'roma' },
]
// Lo que el viajero puede añadir a cada forma (cada uno es una variante del mismo viaje).
const EXTRAS = [
  { clave: '', pool: [], entradas: {}, exp: [] },
  { clave: 'pool Galería Borghese', pool: ['Galería Borghese'] },
  { clave: 'pool Coliseo', pool: ['Coliseo'] },
  { clave: 'pool Museos Vaticanos', pool: [MUSEOS] },
  { clave: 'pool Castillo y Cúpula', pool: ["Castillo de Sant'Angelo", 'Cúpula de San Pedro'] },
  { clave: 'pool Capitolinos y Letrán', pool: ['Museos Capitolinos', 'Basílica de San Juan de Letrán'] },
  { clave: 'pool Boca, Naranjos y Ojo', pool: ['Boca de la Verdad', 'Jardín de los Naranjos', 'Ojo de la Cerradura del Aventino'] },
  { clave: 'reserva Coliseo 9:30', entradas: { Coliseo: '09:30' } },
  { clave: 'reserva Coliseo 10:30', entradas: { Coliseo: '10:30' } },
  { clave: 'reserva Coliseo 12:30', entradas: { Coliseo: '12:30' } },
  { clave: 'reserva Coliseo 13:00', entradas: { Coliseo: '13:00' } },
  { clave: 'reserva Coliseo 13:30', entradas: { Coliseo: '13:30' } },
  { clave: 'reserva Coliseo 15:00', entradas: { Coliseo: '15:00' } },
  { clave: 'reserva Coliseo 11:00', entradas: { Coliseo: '11:00' } },
  { clave: 'reserva Coliseo 12:00', entradas: { Coliseo: '12:00' } },
  { clave: 'reserva Coliseo 14:00', entradas: { Coliseo: '14:00' } },
  { clave: 'reserva Coliseo 16:00', entradas: { Coliseo: '16:00' } },
  { clave: 'reserva Coliseo 18:00', entradas: { Coliseo: '18:00' } },
  { clave: 'reserva Galería 9:00', entradas: { 'Galería Borghese': '09:00' } },
  { clave: 'reserva Galería 11:00', entradas: { 'Galería Borghese': '11:00' } },
  { clave: 'reserva Galería 13:00', entradas: { 'Galería Borghese': '13:00' } },
  { clave: 'reserva Galería 15:00', entradas: { 'Galería Borghese': '15:00' } },
  { clave: 'reserva Galería 17:00', entradas: { 'Galería Borghese': '17:00' } },
  { clave: 'reserva Museos 9:00', entradas: { [MUSEOS]: '09:00' } },
  { clave: 'reserva Museos 10:00', entradas: { [MUSEOS]: '10:00' } },
  { clave: 'reserva Museos 11:00', entradas: { [MUSEOS]: '11:00' } },
  { clave: 'reserva Museos 13:30', entradas: { [MUSEOS]: '13:30' } },
  { clave: 'reserva Museos 14:00', entradas: { [MUSEOS]: '14:00' } },
  { clave: 'reserva Museos 16:00', entradas: { [MUSEOS]: '16:00' } },
  { clave: 'reserva Museos 17:30', entradas: { [MUSEOS]: '17:30' } },
  { clave: 'experiencias', exp: ['arte_museos', 'barrios_sabores', 'naturaleza_vistas', 'mercadillos_navidenos'] },
  { clave: 'Free Tour de tarde', ftDespues: { franja: 'tarde', hora: '17:00' } },
  { clave: 'Free Tour de noche', ftDespues: { franja: 'noche', hora: '18:30' } },
]
const fechas = []
const DESDE = args.desde ?? '2027-01-01' // (los próximos 12 meses: desde=AAAA-MM-DD)
const NFECHAS = Number(args.n ?? 365) // (n: cuántas fechas seguidas desde `desde`; así se reparten las 365 en varios procesos)
for (let d = 0; d < NFECHAS; d += paso) fechas.push(addDays(DESDE, d))

const todos = []
const resumen = { viajes: 0, dias: 0, fallos: 0 }
const porRegla = new Map()
const infoPorRegla = new Map()
const fallos = []
const vistoInfo = []
let nulos = 0
const t0 = Date.now()
for (const forma of FORMAS) {
  if (SOLO && !SOLO.has(forma.g)) continue
  for (const extra of EXTRAS) {
    // El Free Tour de después solo en viajes de 2 días o más sin Free Tour de mañana; las reservas y el pool, en todos.
    if (extra.ftDespues && (forma.ft || forma.dias < 2 || forma.medio)) continue
    for (const inicio of fechas) {
      const poolNames = extra.pool ?? []
      const entradas = extra.entradas ?? {}
      const exp = [...(forma.ft ? ['imprescindibles', 'free_tour'] : []), ...(extra.exp ?? [])]
      const plan = planListasTrip({ destData: D, written, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames, experiencesPositive: exp, dateRangeStartIso: inicio, travel, entradas, freeTourDespues: extra.ftDespues ?? null, mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null })
      resumen.viajes++
      if (!plan) { nulos++; fallos.push({ regla: 'sin_plan', texto: `${forma.clave}${extra.clave ? ` + ${extra.clave}` : ''} · ${inicio}: el motor no devuelve plan` }); porRegla.set('sin_plan', (porRegla.get('sin_plan') ?? 0) + 1); continue }
      const etiqueta = `${forma.clave}${extra.clave ? ` + ${extra.clave}` : ''} · inicio ${inicio}`
      const r = comprobarViaje({ D, plan, etiqueta, entradas, poolNames, hasFreeTour: Boolean(forma.ft), listas: written, franjas: written.destino?.franjas })
      resumen.dias += plan.days.filter((d) => d.curatedDay?.id).length
      for (const f of r.fallos) { fallos.push(f); porRegla.set(f.regla, (porRegla.get(f.regla) ?? 0) + 1) }
      for (const f of r.info) { infoPorRegla.set(f.regla, (infoPorRegla.get(f.regla) ?? 0) + 1); if (vistoInfo.length < 4000 && ['no_cabe_del_todo', 'comida_tarde', 'comida_tras_hora_fija', 'restaurante_repetido', 'reserva_tarde'].includes(f.regla)) vistoInfo.push(f) }
    }
  }
}
// ── Reservas con día (Tanda 6y4, punto 7): ni una parada menos ────────────────────────────────────────────────────────────────────────
// Lo que hace el viajero en la app: pone una reserva de un sitio, en la fecha de uno de los días del viaje. Si es de las grandes (el Coliseo, los Museos, la Galería) el día entero pasa a esa fecha;
// si no (el Altar de la Patria, el Panteón, un sitio sin tabla…) el sitio sale del día que lo llevaba y va al de su reserva. En los dos casos el viaje lleva EXACTAMENTE las mismas paradas que antes:
// ni una menos, ni una más. (Los sitios, no su modo: un sitio que pasa de «por fuera» a «por dentro» por la reserva sigue siendo el mismo.) Y la reserva sale en el día de su fecha, a la hora del viajero.
// Lo único que se admite que falte es lo que un cierre del propio sitio ese día quita y la ruta avisa («Cerrado hoy»): se cuenta aparte (`parada_cerrada_por_reserva`), no como fallo.
const RESERVAS_DIA = [
  { name: 'Coliseo', hora: '10:00' }, { name: 'Coliseo', hora: '15:00' }, { name: MUSEOS, hora: '10:00' }, { name: 'Galería Borghese', hora: '11:00' },
  { name: 'Altar de la Patria', hora: '10:00' }, { name: 'Altar de la Patria', hora: '16:00' }, { name: 'Panteón', hora: '11:00' },
  { name: "Castillo de Sant'Angelo", hora: '15:00' }, { name: 'Boca de la Verdad', hora: '11:00' },
]
// (Sin los rellenos: lo que el motor añade para llenar un hueco de tiempo no es una parada del viajero y cambia solo cuando un día gana o pierde una parada.)
const paradasDe = (plan) => new Set(plan.days.flatMap((day) => [
  ...(day.escritoRows ?? []).filter((r) => (r.tipo === 'parada' || r.tipo === 'tour') && !r.llegada && !r.relleno && r.lugar),
  ...(day.spareRows ?? []).filter((r) => r.lugar && !r.relleno),
].map((r) => r.lugar)))
// Las variantes del propio documento que quitan un sitio un día de cierre (domingo y miércoles del Vaticano, lunes de la Galería y de las Termas, domingo de la Farnesina y de San Clemente, sábado del Panteón): si la reserva deja ese día del viaje en un día así, quita el sitio el documento.
const VARIANTES_DE_CIERRE = new Set(['miercoles_audiencia', 'lunes_sin_caracalla', 'domingo_farnesina', 'domingo_san_clemente', 'sabado_panteon'])
const variantesDe = (plan) => new Set(plan.days.flatMap((day) => day.curatedDay?.variantes ?? []))
const cerradasPorCierre = (plan) => new Set(plan.days.flatMap((day) => (day.escritoLog ?? []).filter((l) => l.que === 'quitada' && /^cierre de /.test(l.causa ?? '')).map((l) => l.sitio ?? l.lugar)))
if (!args.sinreservasdia) {
  for (const forma of FORMAS) {
    if (SOLO && !SOLO.has(forma.g)) continue
    if (forma.ft && args.sinft) continue
    for (const inicio of fechas) {
      const exp = forma.ft ? ['imprescindibles', 'free_tour'] : []
      const comun = { destData: D, written, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: [], experiencesPositive: exp, dateRangeStartIso: inicio, travel, mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null }
      const base = planListasTrip({ ...comun, entradas: {} })
      if (!base) continue
      const antesBase = paradasDe(base)
      for (const R of RESERVAS_DIA) {
        const grande = RESERVAS_GRANDES.has(R.name)
        for (let k = 1; k <= forma.dias; k++) {
          const dateIso = addDays(inicio, k - 1)
          // Una reserva grande en un día de excursión o en una fecha en que el sitio cierra no puede ir allí (Tanda 6j): la app la guarda con su aviso y el viaje se queda como estaba. No se prueba.
          const diaK = base.days.find((d) => d.dayNumber === k)
          if (!diaK || diaK.isExcursion || diaK.isBlank || !diaK.curatedDay?.id || (grande && /medio|^D0$/.test(diaK.curatedDay.id))) { infoPorRegla.set('reserva_en_dia_sin_ciudad', (infoPorRegla.get('reserva_en_dia_sin_ciudad') ?? 0) + 1); continue }
          if (grande && closedOnDay(D.places.find((p) => p.name === R.name), diaK.hours?.weekday, diaK.hours?.dateIso)) { infoPorRegla.set('reserva_grande_en_dia_cerrado', (infoPorRegla.get('reserva_grande_en_dia_cerrado') ?? 0) + 1); continue }
          const etiqueta = `${forma.clave} + reserva ${R.name} ${R.hora} el día ${k} · inicio ${inicio}`
          const entradas = { [R.name]: R.hora, ...(R.name === 'Coliseo' ? { 'Foro Romano y Palatino': R.hora } : {}) }
          const plan = planListasTrip({ ...comun, entradas, reservasGrandes: grande ? [{ name: R.name, dateIso, dayNumber: k, time: R.hora }] : [], reservasViaje: grande || args.antiguo ? [] : [{ name: R.name, dateIso, dayNumber: k, time: R.hora }] })
          resumen.viajes++
          if (!plan) { fallos.push({ regla: 'sin_plan', texto: `${etiqueta}: el motor no devuelve plan` }); porRegla.set('sin_plan', (porRegla.get('sin_plan') ?? 0) + 1); continue }
          const r = comprobarViaje({ D, plan, etiqueta, entradas, poolNames: [], hasFreeTour: Boolean(forma.ft), listas: written, franjas: written.destino?.franjas, reservaConDia: true })
          resumen.dias += plan.days.filter((d) => d.curatedDay?.id).length
          // Lo que debe llevar el viaje: lo de antes. Con una reserva grande, lo que escribe la fila de SU tabla para esa hora (el mismo viaje con la reserva puesta en su sitio, sin mover el día): el documento manda en lo que lleva cada fila.
          // (Tanda 6y5, P4: se compara siempre con el viaje de antes, también con una reserva grande a la hora de otra fila de su tabla: lo que esa fila ya no lleva pasa a «Si te sobra tiempo», no desaparece.)
          const antes = antesBase
          for (const f of r.fallos) { fallos.push(f); porRegla.set(f.regla, (porRegla.get(f.regla) ?? 0) + 1) }
          for (const f of r.info) infoPorRegla.set(f.regla, (infoPorRegla.get(f.regla) ?? 0) + 1)
          // Ni una parada menos (ni una más). Se compara con lo que debe llevar el viaje (lo de antes; con una reserva grande, lo que escribe la fila de su tabla); si la reserva no se pudo poner
          // en su fecha (domingo del Vaticano con Free Tour…), el viaje se queda como estaba, y también vale. Lo que un cierre del propio sitio ese día quita y la ruta avisa no cuenta.
          const despues = paradasDe(plan)
          const cerradas = cerradasPorCierre(plan)
          const diferencias = (referencia) => ({
            faltan: [...referencia].filter((name) => !despues.has(name) && !cerradas.has(name)),
            sobran: [...despues].filter((name) => !referencia.has(name)),
          })
          const mejor = diferencias(antesBase)
          if ([...antes].some((name) => !despues.has(name) && cerradas.has(name))) infoPorRegla.set('parada_cerrada_por_reserva', (infoPorRegla.get('parada_cerrada_por_reserva') ?? 0) + 1)
          // Los Museos de un miércoles sin su reserva los quita el propio documento («el miércoles sin Museos», variante miercoles_audiencia): una reserva grande puede dejar el día del Vaticano en
          // miércoles (el Coliseo fijado el martes), y entonces el documento los quita. No es de esta tanda: se cuenta aparte y va a las preguntas del informe.
          // (Ahora vale para todas: el domingo y el miércoles del Vaticano, el lunes de la Galería y el de las Termas de Caracalla.)
          const antesVariantes = variantesDe(base)
          const variantesPlan = variantesDe(plan)
          const variantesBase = variantesDe(base)
          // (Cambian las variantes de cierre: o entra una —el Vaticano cae en domingo— o sale una —el miércoles sin Museos se evita—.)
          const nuevasDeCierre = [...new Set([...variantesPlan, ...antesVariantes, ...variantesBase])].filter((id) => VARIANTES_DE_CIERRE.has(id) && (variantesPlan.has(id) !== antesVariantes.has(id) || variantesPlan.has(id) !== variantesBase.has(id)))
          if (nuevasDeCierre.length > 0 && (mejor.faltan.length > 0 || mejor.sobran.length > 0)) { infoPorRegla.set('cambio_por_variante_de_cierre_del_documento', (infoPorRegla.get('cambio_por_variante_de_cierre_del_documento') ?? 0) + 1); mejor.faltan = []; mejor.sobran = [] }
          if (mejor.faltan.length > 0) { fallos.push({ regla: 'paradas_perdidas', texto: `${etiqueta}: faltan ${mejor.faltan.join(', ')}` }); porRegla.set('paradas_perdidas', (porRegla.get('paradas_perdidas') ?? 0) + 1) }
          // (Una parada de más no es una parada perdida: cuando un día gana o pierde una parada, su hueco de tiempo cambia y el motor puede añadir algo conocido —el Museo Capitolino—. Se cuenta, no es un fallo.)
          if (mejor.sobran.length > 0) infoPorRegla.set('paradas_de_mas_por_el_hueco', (infoPorRegla.get('paradas_de_mas_por_el_hueco') ?? 0) + 1)
          // La reserva de un sitio que no es de los grandes sale en el día de su fecha, a la hora del viajero (si el sitio está en el viaje).
          if (!grande && antes.has(R.name)) {
            const dia = plan.days.find((d) => d.dayNumber === k && d.curatedDay?.id)
            const fila = dia ? (dia.escritoRows ?? []).find((x) => x.lugar === R.name && !x.llegada && x.tipo === 'parada' && x.hora_tipo === 'reserva') : null
            if (dia && !fila && !(dia.escritoLog ?? []).some((l) => l.sitio === R.name && l.que === 'quitada')) { fallos.push({ regla: 'reserva_sin_su_dia', texto: `${etiqueta}: la reserva no sale en el día ${k}` }); porRegla.set('reserva_sin_su_dia', (porRegla.get('reserva_sin_su_dia') ?? 0) + 1) }
            else if (fila && fila.hora_fija !== R.hora) { fallos.push({ regla: 'reserva_sin_su_dia', texto: `${etiqueta}: sale a las ${fila.hora_fija}` }); porRegla.set('reserva_sin_su_dia', (porRegla.get('reserva_sin_su_dia') ?? 0) + 1) }
          }
        }
      }
    }
  }
}
// ── Dos reservas a la vez (Tanda 6y5, P1): el Altar de la Patria y el Ara Pacis, reservados los DOS en el mismo viaje ──────────────────────────────────────────────────────────────────
// Con cualquier combinación de las dos reservas (el mismo día o días distintos, varias horas, con fechas y sin fechas, en los dos órdenes de la petición) el viaje lleva las mismas paradas que sin
// reservas, y cada reserva sale en el día de su fecha, a su hora (si el sitio está en el viaje). Para no triplicar la prueba, cada fecha prueba una de las parejas de horas, rotando; y una de cada 7
// fechas se prueba sin fechas (solo con el número de día).
const HORAS_PAR = [['10:00', '10:00'], ['10:00', '16:00'], ['16:00', '11:00'], ['11:00', '11:00']]
if (!args.sinpares) {
  for (const forma of FORMAS) {
    if (SOLO && !SOLO.has(forma.g)) continue
    if (forma.ft && args.sinft) continue
    for (const [indice, inicio] of fechas.entries()) {
      const sinFechas = indice % 7 === 3
      const exp = forma.ft ? ['imprescindibles', 'free_tour'] : []
      // (Una de cada 5 fechas, con el Altar elegido en el pool del formulario: el sitio que el viajero marcó y además reservó.)
      const comun = { destData: D, written, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: indice % 5 === 1 ? ['Altar de la Patria'] : [], experiencesPositive: exp, dateRangeStartIso: sinFechas ? null : inicio, travel, mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null }
      const base = planListasTrip({ ...comun, entradas: {} })
      if (!base) continue
      const antes = paradasDe(base)
      if (!antes.has('Altar de la Patria') || !antes.has('Ara Pacis')) { infoPorRegla.set('par_sin_los_dos_en_el_viaje', (infoPorRegla.get('par_sin_los_dos_en_el_viaje') ?? 0) + 1); continue }
      for (let a = 1; a <= forma.dias; a++) for (let b = 1; b <= forma.dias; b++) {
        const diaA = base.days.find((d) => d.dayNumber === a)
        const diaB = base.days.find((d) => d.dayNumber === b)
        if ([diaA, diaB].some((d) => !d || d.isExcursion || d.isBlank || !d.curatedDay?.id)) { infoPorRegla.set('reserva_en_dia_sin_ciudad', (infoPorRegla.get('reserva_en_dia_sin_ciudad') ?? 0) + 1); continue }
        const [ha, hb] = HORAS_PAR[(indice + a + b) % HORAS_PAR.length]
        const altar = { name: 'Altar de la Patria', dateIso: sinFechas ? null : addDays(inicio, a - 1), dayNumber: a, time: ha }
        const ara = { name: 'Ara Pacis', dateIso: sinFechas ? null : addDays(inicio, b - 1), dayNumber: b, time: hb }
        for (const [orden, reservasViaje] of [['altar_primero', [altar, ara]], ['ara_primero', [ara, altar]]]) {
          const etiqueta = `${forma.clave} + Altar día ${a} ${ha} + Ara Pacis día ${b} ${hb} (${orden}${sinFechas ? ', sin fechas' : ''}) · inicio ${inicio}`
          const plan = planListasTrip({ ...comun, entradas: {}, reservasViaje })
          resumen.viajes++
          if (!plan) { fallos.push({ regla: 'sin_plan', texto: `${etiqueta}: el motor no devuelve plan` }); porRegla.set('sin_plan', (porRegla.get('sin_plan') ?? 0) + 1); continue }
          const despues = paradasDe(plan)
          const cerradas = cerradasPorCierre(plan)
          const faltan = [...antes].filter((name) => !despues.has(name) && !cerradas.has(name))
          if (faltan.length > 0) { fallos.push({ regla: 'paradas_perdidas', texto: `${etiqueta}: faltan ${faltan.join(', ')}` }); porRegla.set('paradas_perdidas', (porRegla.get('paradas_perdidas') ?? 0) + 1) }
          if ([...despues].some((name) => !antes.has(name))) infoPorRegla.set('paradas_de_mas_por_el_hueco', (infoPorRegla.get('paradas_de_mas_por_el_hueco') ?? 0) + 1)
          for (const [r, k, h] of [[altar, a, ha], [ara, b, hb]]) {
            const dia = plan.days.find((d) => d.dayNumber === k && d.curatedDay?.id)
            const fila = dia ? (dia.escritoRows ?? []).find((x) => x.lugar === r.name && !x.llegada && x.tipo === 'parada' && x.hora_tipo === 'reserva') : null
            if (dia && !fila && !(dia.escritoLog ?? []).some((l) => l.sitio === r.name && l.que === 'quitada')) { fallos.push({ regla: 'reserva_sin_su_dia', texto: `${etiqueta}: la reserva de ${r.name} no sale en el día ${k}` }); porRegla.set('reserva_sin_su_dia', (porRegla.get('reserva_sin_su_dia') ?? 0) + 1) }
            else if (fila && fila.hora_fija !== h) { fallos.push({ regla: 'reserva_sin_su_dia', texto: `${etiqueta}: ${r.name} sale a las ${fila.hora_fija}` }); porRegla.set('reserva_sin_su_dia', (porRegla.get('reserva_sin_su_dia') ?? 0) + 1) }
          }
        }
      }
    }
  }
}
resumen.fallos = fallos.length
const segundos = Math.round((Date.now() - t0) / 1000)
const lineas = [
  '# Prueba del motor de listas (Tanda 6)',
  '',
  `${resumen.viajes} viajes (${resumen.dias} días) en ${fechas.length} fechas desde el ${DESDE}, con y sin pool, Free Tour, reservas y experiencias. ${segundos} s.`,
  '',
  `**Fallos: ${resumen.fallos}.**`,
  '',
  '## Por regla',
  '',
  ...['orden', 'cerrado', 'zigzag', 'piramide', 'dentro_dos_veces', 'restaurante_repetido', 'noche_repetida', 'reserva', 'comida_tarde', 'comida_tras_hora_fija', 'dia_empieza_tarde', 'cerrado_a_la_llegada', 'camino_en_sobra', 'lluvia', 'sin_explicar', 'pool', 'paradas_perdidas', 'paradas_nuevas', 'reserva_sin_su_dia', 'sin_plan'].map((regla) => `- ${regla}: ${porRegla.get(regla) ?? 0}`),
  '',
  '## Lo que se apunta (no es un fallo)',
  '',
  ...[...infoPorRegla].map(([regla, n]) => `- ${regla}: ${n}`),
  '',
  '## Primeros fallos de cada regla',
  '',
  ...[...porRegla.keys()].flatMap((regla) => [`### ${regla} (${porRegla.get(regla)})`, '', ...fallos.filter((f) => f.regla === regla).slice(0, 12).map((f) => `- ${f.texto}`), '']),
]
fs.writeFileSync(out, lineas.join('\n'))
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
if (args.info) fs.writeFileSync(args.info, vistoInfo.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
if (args.json) fs.writeFileSync(args.json, JSON.stringify({ ...resumen, segundos, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries(infoPorRegla) }))
console.log(JSON.stringify({ ...resumen, segundos, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries(infoPorRegla) }))
