/**
 * Compara motor viejo y motor nuevo sobre LA MISMA ruta, día a día, contra el servidor que esté
 * corriendo. Es la herramienta para validar antes de tocar el interruptor.
 *
 *   node server/engine/__tests__/compararMotores.mjs                 # Roma 4 días, ritmo completo
 *   node server/engine/__tests__/compararMotores.mjs 6 tranquilo     # 6 días, ritmo tranquilo
 *   node server/engine/__tests__/compararMotores.mjs 4 nonstop "Galería Borghese"
 *
 * El tercer argumento y siguientes son la selección del pool, para ver si el motor la respeta.
 */

const API = process.env.API ?? 'http://localhost:8787'
const [, , daysArg, paceArg, ...pool] = process.argv
const days = Number(daysArg) || 4
const pace = paceArg ?? 'nonstop'

const answers = {
  origin: 'Madrid',
  days,
  companion: 'pareja',
  experiences: [],
  pace,
  chronotype: 'early',
  budgetLevel: 'medio',
}

async function dayFrom(engine, dayNumber) {
  const response = await fetch(`${API}/api/generate-day-block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination: 'Roma',
      block_days: [{ day_number: dayNumber, type: 'city', city: 'Roma' }],
      all_days: Array.from({ length: days }, (_, i) => ({ day_number: i + 1 })),
      answers,
      must_include_places: pool,
      engine,
    }),
  })
  const data = await response.json()
  return data?.days?.[0] ?? null
}

const line = (stop) =>
  `${stop.suggested_time} ${String(stop.duration_minutes).padStart(3)}' ${stop.name}${stop.is_night_experience ? ' 🌙' : ''}`

const resumen = (day) => {
  if (!day) return { paradas: 0, lineas: ['(sin día)'], raras: 0 }
  const lineas = []
  const meals = day.meals ?? []
  const lunch = meals.find((m) => m.time === 'lunch')
  const dinner = meals.find((m) => m.time === 'dinner')
  let lunchDone = false
  let dinnerDone = false
  for (const stop of day.stops ?? []) {
    if (lunch?.suggested_time && !lunchDone && stop.suggested_time > lunch.suggested_time) {
      lineas.push(`${lunch.suggested_time}      🍽 comida ${lunch.zone_display ?? ''}`)
      lunchDone = true
    }
    if (dinner?.suggested_time && !dinnerDone && stop.suggested_time > dinner.suggested_time) {
      lineas.push(`${dinner.suggested_time}      🍽 cena ${dinner.zone_display ?? ''}`)
      dinnerDone = true
    }
    lineas.push(line(stop))
  }
  if (dinner?.suggested_time && !dinnerDone) lineas.push(`${dinner.suggested_time}      🍽 cena ${dinner.zone_display ?? ''}`)
  // Una hora fuera de :00/:30 solo es rara si NO es una parada encadenada: las encadenadas entran
  // a la hora a la que se llega, que es justo la gracia (llegas a la plaza y entras al monumento).
  let raras = 0
  let prevEnd = null
  for (const stop of day.stops ?? []) {
    const [h, m] = stop.suggested_time.split(':').map(Number)
    const start = h * 60 + m
    const encadenada = prevEnd !== null && start - prevEnd <= 3
    if (m !== 0 && m !== 30 && !encadenada) raras++
    prevEnd = start + stop.duration_minutes
  }
  return { paradas: (day.stops ?? []).length, lineas, raras }
}

console.log(`Roma · ${days} días · ritmo ${pace}${pool.length ? ` · pool: ${pool.join(', ')}` : ''}\n`)

let totalViejo = 0
let totalNuevo = 0
let rarasViejo = 0
let rarasNuevo = 0

for (let dayNumber = 1; dayNumber <= days - 1; dayNumber++) {
  const [viejo, nuevo] = await Promise.all([dayFrom('viejo', dayNumber), dayFrom('nuevo', dayNumber)])
  const a = resumen(viejo)
  const b = resumen(nuevo)
  totalViejo += a.paradas
  totalNuevo += b.paradas
  rarasViejo += a.raras
  rarasNuevo += b.raras

  console.log(`━━ DÍA ${dayNumber} ${'━'.repeat(60)}`)
  console.log(`   ${'MOTOR VIEJO'.padEnd(46)}MOTOR NUEVO`)
  const filas = Math.max(a.lineas.length, b.lineas.length)
  for (let i = 0; i < filas; i++) {
    console.log(`   ${(a.lineas[i] ?? '').padEnd(46)}${b.lineas[i] ?? ''}`)
  }
  console.log()
}

console.log('─'.repeat(74))
console.log(`paradas:            viejo ${totalViejo}   ·   nuevo ${totalNuevo}`)
console.log(`horas sueltas:       viejo ${rarasViejo}   ·   nuevo ${rarasNuevo}`)
if (pool.length > 0) {
  console.log('\n(para comprobar el pool, busca sus nombres en la columna de cada motor)')
}
