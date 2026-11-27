// Repite SOLO los viajes que fallaron en un barrido (lee los archivos fallos= de pruebaListas) con las comprobaciones de ahora.
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { sitiosGrandesDe } from '../../shared/routeEngine/listasReservas.js'
import { comprobarViaje } from './comprobacionesListas.mjs'
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const src = fs.readFileSync('scripts/destino/pruebaListas.mjs', 'utf8')
const trozo = src.slice(src.indexOf('const FORMAS = ['), src.indexOf('const fechas = []'))
const { FORMAS, EXTRAS } = new Function('MUSEOS', `${trozo}; return { FORMAS, EXTRAS }`)(MUSEOS)
const D = findPipelineV2Data('Roma'), written = writtenDaysFor('roma'), travel = travelTimesFor('roma')
const lineas = process.argv.slice(2).flatMap((f) => fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean))
const vistos = new Map()
let n = 0, aun = 0
const quedan = []
for (const l of lineas) {
  const m = l.match(/^\[(\w+)\] (.*?) · inicio (\d{4}-\d\d-\d\d) · (\d{4}-\d\d-\d\d) (D[\w-]+):/)
  if (!m) { console.log('sin entender:', l.slice(0, 120)); continue }
  vistos.set(`${m[2]}|${m[3]}`, { clave: m[2], inicio: m[3] })
}
for (const { clave, inicio } of vistos.values()) {
  const forma = FORMAS.find((f) => clave === f.clave || clave.startsWith(`${f.clave} + `) && EXTRAS.some((e) => e.clave && clave === `${f.clave} + ${e.clave}`))
  const mr = clave.match(/^(.*) \+ reserva (.+) (\d\d:\d\d) el día (\d+)$/)
  if (mr) {
    const f2 = FORMAS.find((f) => f.clave === mr[1])
    const R = { name: mr[2], hora: mr[3] }, k = Number(mr[4])
    const grande = sitiosGrandesDe(D).has(R.name)
    const dateIso = new Date(Date.parse(`${inicio}T12:00:00Z`) + (k - 1) * 86400000).toISOString().slice(0, 10)
    const comun = { destData: D, written, totalDays: f2.dias + 1, hasFreeTour: Boolean(f2.ft), poolNames: [], experiencesPositive: f2.ft ? ['imprescindibles', 'free_tour'] : [], dateRangeStartIso: inicio, travel, mediaJornada: f2.medio ?? null, diaCuatro: f2.diaCuatro ?? null }
    const entradas = { [R.name]: R.hora, ...(R.name === 'Coliseo' ? { 'Foro Romano y Palatino': R.hora } : {}) }
    const plan = planListasTrip({ ...comun, entradas, reservasGrandes: grande ? [{ name: R.name, dateIso, dayNumber: k, time: R.hora }] : [], reservasViaje: grande ? [] : [{ name: R.name, dateIso, dayNumber: k, time: R.hora }] })
    const r = comprobarViaje({ D, plan, etiqueta: `${clave} · inicio ${inicio}`, entradas, poolNames: [], hasFreeTour: Boolean(f2.ft), listas: written, franjas: written.destino?.franjas, reservaConDia: true })
    n++
    if (r.fallos.length) { aun++; quedan.push(...r.fallos.map((f) => `[${f.regla}] ${f.texto}`)) }
    continue
  }
  if (!forma) { console.log("forma no hallada:", clave); continue }
  const extra = EXTRAS.find((e) => clave === (e.clave ? `${forma.clave} + ${e.clave}` : forma.clave))
  const entradas = extra.entradas ?? {}, poolNames = extra.pool ?? []
  const exp = [...(forma.ft ? ['imprescindibles', 'free_tour'] : []), ...(extra.exp ?? [])]
  const plan = planListasTrip({ destData: D, written, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames, experiencesPositive: exp, dateRangeStartIso: inicio, travel, entradas, freeTourDespues: extra.ftDespues ?? null, mediaJornada: forma.medio ?? null, diaCuatro: forma.diaCuatro ?? null })
  const r = comprobarViaje({ D, plan, etiqueta: `${clave} · inicio ${inicio}`, entradas, poolNames, hasFreeTour: Boolean(forma.ft), listas: written, franjas: written.destino?.franjas })
  n++
  if (r.fallos.length) { aun++; quedan.push(...r.fallos.map((f) => `[${f.regla}] ${f.texto}`)) }
}
fs.writeFileSync(process.env.SALIDA ?? 'docs/dias/_barrido365_quedan.txt', quedan.join('\n'))
console.log(`${n} viajes repetidos; siguen fallando ${aun} (${quedan.length} líneas)`)
