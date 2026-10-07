// La prueba de lo que SALE del servidor (Tanda 6f, 1 y 3): lo que llega a la pantalla, no lo que calcula el motor.
//   0 tarjetas «Llegada a…» ni paradas de llegada, 0 trayectos de «0 m» (dos paradas seguidas en el mismo punto), 0 nombres de parada con «iluminada / de noche / ya con las luces»,
//   node scripts/destino/pruebaSalida.mjs [base=http://localhost:8787] [paso=N]
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'
const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const base = args.base ?? 'http://localhost:8787'
const paso = Number(args.paso ?? 41)
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const FORMAS = [
  { clave: '1 día', dias: 1, exp: ['imprescindibles'] },
  { clave: '2 días', dias: 2, exp: ['imprescindibles'] },
  { clave: '3 días', dias: 3, exp: ['imprescindibles'] },
  { clave: '3 días con Free Tour', dias: 3, exp: ['imprescindibles', 'free_tour'] },
  { clave: '3 días con Free Tour de tarde', dias: 3, exp: ['imprescindibles', 'free_tour'], ftDespues: { franja: 'tarde', hora: '17:00' } },
  { clave: '4 días con Free Tour y Coliseo 12:00', dias: 4, exp: ['imprescindibles', 'free_tour'], entradas: { Coliseo: '12:00' } },
  { clave: '5 días', dias: 5, exp: ['imprescindibles'] },
  { clave: '6 días con Free Tour', dias: 6, exp: ['imprescindibles', 'free_tour'] },
]
const fallos = []
let dias = 0
for (const forma of FORMAS) {
  for (let d = 0; d < 365; d += paso) {
    const inicio = addDays('2027-01-01', d)
    const answers = { origin: 'Madrid', days: forma.dias + 1, companion: 'pareja', experiences: forma.exp, experiencesPositive: forma.exp, experiencesNegative: [], chronotype: 'balanced', dateRange: { start: inicio, end: addDays(inicio, forma.dias) }, ...(forma.entradas ? { entradas: forma.entradas } : {}), ...(forma.ftDespues ? { freeTourDespues: forma.ftDespues } : {}) }
    const all_days = Array.from({ length: forma.dias }, (_, i) => ({ day_number: i + 1, city: 'Roma' }))
    for (let n = 1; n <= forma.dias; n++) {
      const r = await fetch(`${base}/api/rebuild-day`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma', answers, all_days, day_number: n, must_include_places: [], inside_names: [] }) })
      if (!r.ok) { fallos.push(`[servidor] ${forma.clave} · ${inicio} día ${n}: ${r.status}`); continue }
      const { day } = await r.json()
      if (!day) continue
      dias++
      const etiqueta = `${forma.clave} · ${inicio} día ${n}`
      const stops = day.stops ?? []
      for (const s of stops) {
        if (s.is_arrival || /^Llegada a/i.test(s.name ?? '')) fallos.push(`[llegada] ${etiqueta}: tarjeta «${s.name}»`)
        if (!s.is_night_experience && /iluminad|de noche|ya con las luces/i.test(`${s.name ?? ''} ${s.display_title ?? ''}`)) fallos.push(`[nombre_de_noche] ${etiqueta}: «${s.name}»`)
      }
      const reales = stops.filter((s) => s.coordinates && s.coordinates.lat && s.coordinates.lng && !s.is_break)
      for (let i = 1; i < reales.length; i++) if (straightLineMeters([reales[i - 1].coordinates.lat, reales[i - 1].coordinates.lng], [reales[i].coordinates.lat, reales[i].coordinates.lng]) < 1) fallos.push(`[trayecto_0m] ${etiqueta}: «${reales[i - 1].name}» → «${reales[i].name}»`)
    }
  }
}
console.log(JSON.stringify({ dias, fallos: fallos.length }))
for (const f of fallos.slice(0, 40)) console.log(f)
process.exit(fallos.length ? 1 : 0)
