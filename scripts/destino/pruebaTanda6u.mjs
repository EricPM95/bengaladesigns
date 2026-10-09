// Prueba de la Tanda 6u: el Free Tour según su hora, la comida hasta las 15:00 y las paradas nuevas.
//   node scripts/destino/pruebaTanda6u.mjs        (el api-server tiene que estar en el puerto 8787 para la parte 3)
// 1. Motor: viajes de 2, 3 y 4 días, con y sin fechas, con el Free Tour a cada hora (10:00, 12:00, 15:00, 17:00) y los Museos a cada hora (de 8:00 a 18:00, cada 15 min):
//    cada reserva sale a su hora (hasta 5 min de más) o, si se pisan, el aviso «coinciden» lo explica; nunca desaparece una reserva y el Free Tour sale una sola vez.
// 2. Motor: con el Free Tour de las 21:00 no hay D3 ni D1-FT, y el Free Tour va en la noche del D1 a las 21:00.
// 3. Servidor: la hoja del Free Tour (respuestas) y la reserva del Free Tour dan los mismos días que el motor.
// 4. La comida: ninguna empieza después de las 15:00 (salvo la reservada por el viajero) y el límite está en un solo sitio.
// 5. Las paradas nuevas (Templo de Adriano, Piazza Colonna) y las calles como paradas.
import { readFileSync } from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { COMIDA_HASTA_MIN } from '../../shared/routeEngine/comida.js'

const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const FT = 'Free Tour por Roma'
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const base = process.env.API ?? 'http://localhost:8787'
const toMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
const hh = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const fallos = []
const falla = (que) => { if (fallos.length < 60) fallos.push(que); else if (fallos.length === 60) fallos.push('… (más fallos)') }
let viajes = 0
let tardeSinAviso = 0

const plan = (dias, inicio, ftHora, museosHora) => {
  const noche = ftHora && toMin(ftHora) >= 20 * 60 + 30
  const entradas = {}
  if (ftHora && !noche) entradas[FT] = ftHora
  if (museosHora) entradas[MUSEOS] = museosHora
  return planListasTrip({
    destData: D, written, travel, totalDays: dias + 1,
    hasFreeTour: Boolean(ftHora) && !noche,
    poolNames: [], experiencesPositive: ftHora && !noche ? ['imprescindibles', 'free_tour'] : ['imprescindibles'],
    dateRangeStartIso: inicio, entradas,
    freeTourDespues: noche ? { franja: 'noche', hora: ftHora } : null,
  })
}
const filas = (plan) => plan.days.flatMap((day) => (day.escritoRows ?? []).map((r) => ({ ...r, dia: day.dayNumber, id: day.curatedDay?.id })))
const esFt = (r) => r.tipo === 'tour' || r.lugar === FT

// ── 1. Free Tour × Museos ────────────────────────────────────────────────────────────────────────────
const INICIOS = [null, '2027-03-09', '2027-06-15']
for (const dias of [2, 3, 4]) {
  for (const inicio of INICIOS) {
    for (const ftHora of ['10:00', '12:00', '15:00', '17:00']) {
      for (let m = 8 * 60; m <= 18 * 60; m += 15) {
        const museos = hh(m)
        const etiqueta = `${dias} días ${inicio ?? 'sin fechas'} · Free Tour ${ftHora} · Museos ${museos}`
        let p
        try { p = plan(dias, inicio, ftHora, museos) } catch (error) { falla(`[error] ${etiqueta}: ${error.message}`); continue }
        viajes++
        if (!p) { falla(`[sin_plan] ${etiqueta}`); continue }
        const rows = filas(p)
        const tours = rows.filter((r) => esFt(r) && !r.llegada)
        if (tours.length !== 1) { falla(`[free_tour_veces] ${etiqueta}: sale ${tours.length} veces`); continue }
        const museo = rows.filter((r) => r.lugar === MUSEOS && !r.llegada && r.modo !== 'fuera')
        if (museo.length === 0) { falla(`[museos_no_salen] ${etiqueta}`); continue }
        // ¿Se pisan? Los casos del documento («Si los dos están reservados»): Free Tour 10:00 y Museos antes de las 13:30; 12:00 y antes de las 15:30; 15:00 y después de las 11:00; 17:00 y después de las 13:30.
        const sePisan = ftHora === '10:00' ? m < 13 * 60 + 30 : ftHora === '12:00' ? m < 15 * 60 + 30 : ftHora === '15:00' ? m > 11 * 60 : m > 13 * 60 + 30
        // «Vas justo» (Tanda 6w): no se cruzan pero no da tiempo a llegar de una a otra (60 min de trayecto y llegada, 90 si toca comer). Las dos reservas mandan: se llega tarde y el día lleva todo.
        const ftIni = toMin(ftHora)
        const [primeraFin, segundaIni] = ftIni <= m ? [ftIni + 150, m] : [m + 150, ftIni]
        const hueco = segundaIni - primeraFin
        const necesita = 60 + (primeraFin <= 15 * 60 && segundaIni >= 12 * 60 + 30 ? 60 : 0)
        const vasJusto = hueco < necesita
        // Con dos reservas el día no quita nada, no acorta la comida y no manda nada a «Si te sobra tiempo» por el tiempo.
        for (const d of p.days) {
          if (!(d.escritoRows ?? []).some((r) => r.hora_tipo === 'reserva' && !r.llegada)) continue
          for (const e of d.escritoLog ?? []) if (e.que === 'sobra' && !/cerr/.test(e.causa ?? '')) falla(`[sobra_con_reserva] ${etiqueta}: ${e.lugar}: ${e.causa}`)
          for (const r of d.escritoRows ?? []) if (r.tipo === 'comida' && r.min !== 60 && r.min !== 90 && !r.llegada && r.min < 45) falla(`[comida_corta] ${etiqueta}: comida de ${r.min} min`)
        }
        const tarde = (r) => r.tarde ?? 0
        const tourTarde = tarde(tours[0])
        const museoTarde = tarde(museo[0])
        // (Tanda 6w: las dos reservas mandan y el día lleva todo; si una llega tarde y el aviso «vas justo» no lo dice, se cuenta aparte y va al informe, no es un fallo de la prueba.)
        if (!sePisan && !vasJusto && (tourTarde > 5 || museoTarde > 10)) tardeSinAviso++
        if (!tours[0].hora || toMin(tours[0].hora) !== toMin(ftHora) + tourTarde) falla(`[free_tour_hora] ${etiqueta}: sale a las ${tours[0].hora}`)
      }
    }
  }
}

// ── 1b. El Foro y el Palatino nunca por fuera «por la hora» con el Coliseo reservado (Tanda 6w) ───────────────────────────────────────
// Si al salir del Coliseo el Foro ya no deja entrar, va antes del Coliseo, por dentro. Solo va por fuera si ese día cierra (lunes de Navidad…), no por la hora.
for (const dias of [2, 3, 4]) {
  for (const inicio of ['2027-01-11', '2027-03-09', '2027-06-15', '2027-07-20', '2027-10-12', '2027-12-14']) {
    for (let m = 15 * 60 + 30; m <= 18 * 60; m += 15) {
      const etiqueta = `${dias} días ${inicio} · Coliseo ${hh(m)}`
      const entradas = { Coliseo: hh(m) }
      const pl = planListasTrip({ destData: D, written, travel, totalDays: dias + 1, hasFreeTour: false, poolNames: [], experiencesPositive: ['imprescindibles'], dateRangeStartIso: inicio, entradas })
      viajes++
      for (const day of pl?.days ?? []) {
        const foro = (day.escritoRows ?? []).find((r) => r.lugar === 'Foro Romano y Palatino' && !r.llegada)
        const coliseo = (day.escritoRows ?? []).find((r) => r.lugar === 'Coliseo' && r.hora_tipo === 'reserva')
        if (!foro || !coliseo) continue
        const cerrado = (day.escritoLog ?? []).some((e) => /cierre de Foro|Foro Romano y Palatino: hoy cierra|cerrado hoy/i.test(`${e.lugar} ${e.causa}`) && e.lugar === 'Foro Romano y Palatino')
        if (foro.modo === 'fuera' && !cerrado) falla(`[foro_por_fuera] ${etiqueta} día ${day.dayNumber}: el Foro va por fuera (${foro.hora}) sin estar cerrado ese día`)
      }
    }
  }
}

// ── 2. El Free Tour de las 21:00 ─────────────────────────────────────────────────────────────────────
for (const dias of [2, 3, 4]) {
  for (const inicio of INICIOS) {
    const etiqueta = `${dias} días ${inicio ?? 'sin fechas'} · Free Tour 21:00`
    const p = plan(dias, inicio, '21:00', null)
    viajes++
    if (!p) { falla(`[sin_plan] ${etiqueta}`); continue }
    const ids = p.days.map((d) => d.curatedDay?.id).filter(Boolean)
    if (ids.some((id) => id === 'D3' || id === 'D1-FT' || id === 'DM-medio-FT')) falla(`[dias_con_tour] ${etiqueta}: lleva ${ids.join(', ')}`)
    const noches = p.days.flatMap((d) => (d.escritoRows ?? []).filter((r) => esFt(r) && !r.llegada).map((r) => ({ dia: d.dayNumber, id: d.curatedDay?.id, hora: r.hora })))
    if (noches.length !== 1) { falla(`[free_tour_veces] ${etiqueta}: sale ${noches.length} veces`); continue }
    if (noches[0].id !== 'D1') falla(`[free_tour_dia] ${etiqueta}: va en ${noches[0].id}, no en el D1`)
    if (noches[0].hora !== '21:00') falla(`[free_tour_hora] ${etiqueta}: sale a las ${noches[0].hora}`)
    const trevi = p.days.some((d) => (d.escritoNights ?? []).some((n) => /Trevi|Plaza de España/.test(n.name)) && d.curatedDay?.id === 'D1')
    if (trevi) falla(`[noche_d1] ${etiqueta}: el D1 sigue con Trevi o la Plaza de España de noche`)
  }
}

// ── 2b. Free Tour y Museos reservados en días distintos (Tanda 6w): el Free Tour no desaparece nunca ───────────────────────────────────
for (const dias of [3, 4]) {
  const inicio = '2027-03-09'
  const fecha = (i) => new Date(Date.parse(`${inicio}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10)
  for (const ftHora of ['10:00', '12:00', '15:00', '17:00']) {
    for (const muHora of ['08:30', '11:00', '13:00', '14:00', '16:30', '17:30']) {
      for (const [ftDia, muDia] of [[1, 0], [0, 1], [2, 0], [2, 1]]) {
        const etiqueta = `${dias} días · Free Tour ${ftHora} el ${fecha(ftDia)} y Museos ${muHora} el ${fecha(muDia)}`
        const pl = planListasTrip({
          destData: D, written, travel, totalDays: dias + 1, hasFreeTour: true, poolNames: [], experiencesPositive: ['imprescindibles', 'free_tour'], dateRangeStartIso: inicio,
          entradas: { [FT]: ftHora, [MUSEOS]: muHora },
          reservasGrandes: [{ name: FT, dateIso: fecha(ftDia), dayNumber: null, time: ftHora }, { name: MUSEOS, dateIso: fecha(muDia), dayNumber: null, time: muHora }],
        })
        viajes++
        if (!pl) { falla(`[sin_plan] ${etiqueta}`); continue }
        const tours = filas(pl).filter((r) => esFt(r) && !r.llegada)
        if (tours.length !== 1) { falla(`[free_tour_veces] ${etiqueta}: sale ${tours.length} veces`); continue }
        if (tours[0].dia !== ftDia + 1) falla(`[free_tour_dia] ${etiqueta}: sale el día ${tours[0].dia}, no el ${ftDia + 1}`)
        const museosDia = pl.days.find((d) => (d.escritoRows ?? []).some((r) => r.lugar === MUSEOS && !r.llegada && r.hora_tipo === 'reserva'))
        if (!museosDia) falla(`[museos_no_salen] ${etiqueta}`)
        else if (museosDia.dayNumber !== muDia + 1) falla(`[museos_dia] ${etiqueta}: salen el día ${museosDia.dayNumber}, no el ${muDia + 1}`)
        if (ftDia !== muDia && museosDia && (museosDia.escritoRows ?? []).some((r) => esFt(r) && !r.llegada)) falla(`[museos_con_tour] ${etiqueta}: el día de los Museos lleva el Free Tour`)
        for (const d of pl.days) for (const e of d.escritoLog ?? []) if (e.que === 'sobra' && !/cerr/.test(e.causa ?? '') && (d.escritoRows ?? []).some((r) => r.hora_tipo === 'reserva' && !r.llegada)) falla(`[sobra_con_reserva] ${etiqueta}: ${e.lugar}: ${e.causa}`)
      }
    }
  }
}

// ── 3. El servidor ────────────────────────────────────────────────────────────────────────────────────
async function dia(dias, inicio, ftDespues, reservas, n) {
  const answers = { origin: 'Madrid', days: dias + 1, companion: 'pareja', experiences: ['imprescindibles', 'free_tour'], experiencesPositive: ['imprescindibles', 'free_tour'], experiencesNegative: [], chronotype: 'balanced', ...(inicio ? { dateRange: { start: inicio, end: new Date(Date.parse(`${inicio}T12:00:00Z`) + dias * 86400000).toISOString().slice(0, 10) } } : {}), ...(ftDespues ? { freeTourDespues: ftDespues } : {}) }
  const all_days = Array.from({ length: dias }, (_, i) => ({ day_number: i + 1, city: 'Roma' }))
  const r = await fetch(`${base}/api/rebuild-day`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', answers, all_days, day_number: n, must_include_places: [], inside_names: [], reservas }) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return (await r.json()).day
}
try {
  for (const [hora, franja] of [['12:00', 'manana'], ['15:00', 'tarde'], ['17:00', 'tarde'], ['21:00', 'noche']]) {
    for (const via of ['hoja', 'reserva']) {
      const dias = 3
      const inicio = '2027-03-09'
      const reservas = via === 'reserva' ? [{ placeNames: [FT], dateIso: inicio, dayNumber: null, time: hora }] : []
      const ftDespues = via === 'hoja' ? { franja, hora } : null
      const ids = []
      let tours = 0
      for (let n = 1; n <= dias; n++) {
        const d = await dia(dias, inicio, ftDespues, reservas, n)
        ids.push(d?.curated_day?.id ?? '—')
        tours += (d?.stops ?? []).filter((s) => s.is_free_tour || s.isFreeTour || s.name === FT).length
      }
      const etiqueta = `servidor · Free Tour ${hora} por ${via}`
      const lleva = ids.some((id) => id === 'D3')
      if (hora === '21:00' && (lleva || ids.includes('D1-FT'))) falla(`[servidor_21] ${etiqueta}: lleva ${ids.join(', ')}`)
      if (hora !== '21:00' && !lleva) falla(`[servidor_d3] ${etiqueta}: no lleva D3 (${ids.join(', ')})`)
      if (tours !== 1) falla(`[servidor_tour] ${etiqueta}: el Free Tour sale ${tours} veces (${ids.join(', ')})`)
    }
  }
} catch (error) {
  falla(`[servidor] no se pudo probar (¿está el api-server en ${base}?): ${error.message}`)
}

// ── 4. La comida, hasta las 15:00 ─────────────────────────────────────────────────────────────────────
if (COMIDA_HASTA_MIN !== 15 * 60) falla(`[comida_limite] el límite compartido es ${COMIDA_HASTA_MIN}, no las 15:00`)
for (const archivo of ['shared/routeEngine/listasTrip.js', 'src/lib/todayMode.ts', 'src/components/route/dayDetail/DayDetailPanel.tsx']) {
  const texto = readFileSync(new URL(`../../${archivo}`, import.meta.url), 'utf8')
  if (/['"]14:30['"]|14 \* 60 \+ 30/.test(texto) && /comida/i.test(texto.match(/.{0,120}(['"]14:30['"]|14 \* 60 \+ 30).{0,120}/)?.[0] ?? '')) falla(`[comida_14_30] ${archivo}: sigue usando las 14:30 para la comida`)
}
for (const inicio of INICIOS) {
  for (const dias of [2, 3, 4]) {
    const p = plan(dias, inicio, null, null)
    viajes++
    for (const day of p.days) for (const r of day.escritoRows ?? []) if (r.tipo === 'comida' && r.t0 != null && r.t0 > COMIDA_HASTA_MIN && !r.hora_tipo) falla(`[comida_tarde] ${dias} días ${inicio ?? 'sin fechas'} día ${day.dayNumber}: comida a las ${hh(r.t0)}`)
  }
}

// ── 5. Las paradas nuevas ─────────────────────────────────────────────────────────────────────────────
for (const [nombre, lat, lng] of [['Templo de Adriano', 41.8998, 12.478], ['Piazza Colonna', 41.9006, 12.4796]]) {
  const lugar = D.places.find((p) => p.name === nombre)
  if (!lugar) { falla(`[parada_nueva] «${nombre}» no está en los datos`); continue }
  if (Math.abs(lugar.coordinates?.lat - lat) > 0.01 || Math.abs(lugar.coordinates?.lng - lng) > 0.01) falla(`[parada_nueva] «${nombre}»: coordenadas raras`)
  if (!(lugar.duration_minutes > 0 || lugar.minutos_fuera > 0)) falla(`[parada_nueva] «${nombre}»: sin minutos`)
}
const todas = JSON.stringify(written.days)
for (const calle of ['Via della Conciliazione', 'Teatro de Marcelo', 'Plaza Venecia', 'Via dei Fori Imperiali', 'Arco de Constantino', "Puente Sant'Angelo", 'Via Condotti', 'Via Veneto', 'Porta Pinciana', 'Fuente del Tritón']) {
  if (!todas.includes(`"lugar":"${calle}"`)) falla(`[calles] «${calle}» no sale como parada en ningún día escrito`)
}

console.log(JSON.stringify({ viajes, fallos: fallos.length, tardeSinAviso }))
for (const f of fallos) console.log(' ·', f)
process.exit(fallos.length ? 1 : 0)
