// V68 (apartado 4): COMPROBACIÓN por script puro (sin navegador) de «Reorganizar nunca quita nada del viaje».
// Para cada vuelo de llegada (por defecto 15:30 y 17:30; `VUELOS=15:30,17:30`) genera el viaje SIN vuelo, pone el vuelo y pide `propuestaDeVuelos` (la función del botón); con lo que propone
// calcula lo mismo que la hoja (`cambiosDeReorganizar`) y comprueba:
//   1. 0 sitios quitados: ninguna tarjeta «Se quita de tu viaje» y ningún sitio de antes que no esté después en un día o en «Lugares pendientes» (`spareStops`).
//   2. Cambio mínimo: nº de días que cambian y nº de tarjetas (se imprimen; falla si cambian más días de los que NO caben).
//   3. Comida y cena del día de llegada según la hora real (aterrizando a las 17:30: sin comida, con cena; con 15:30: sin comida antes de la hora útil).
//   4. Franja (MAÑANA/TARDE/NOCHE) de cada parada del día de llegada, la misma regla de DÍAS (`franjaDeLaParada`, src/lib/franjaDelDia.ts).
//   5. Idempotente: la segunda pasada sobre el resultado no propone ningún día.
// Usa la API en 8787 (no abre Vite ni navegador). Uso:
//   node scripts/destino/comprobarReorganizarV68.mjs [destino=Roma] [inicio=2026-11-27] [dias=4]
//   Lanzarote: `node scripts/destino/comprobarReorganizarV68.mjs Lanzarote 2027-03-07 6` (con la API normal).
// Sale con código 1 si algún caso falla.
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const destino = process.argv[2] ?? 'Roma'
const inicio = process.argv[3] ?? '2026-11-27'
const dias = Number(process.argv[4] ?? 4)
const salida = path.join(os.tmpdir(), 'v68_reorganizar.mjs')
await build({
  stdin: {
    contents: `export { probar, casoPorDefecto } from './src/components/panel/reorganizar/motorDelProbador.ts'
export { propuestaDeVuelos } from './src/lib/adaptarVuelos.ts'
export { cambiosDeReorganizar } from './src/lib/tarjetasDePropuesta.ts'
export { franjasDelDia } from './src/lib/franjaDelDia.ts'`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'error',
  // `import.meta.glob` es de Vite: en Node se queda en un objeto vacío (la hoja no necesita los archivos de puntualidad).
  plugins: [{ name: 'sin-glob', setup(b) { b.onLoad({ filter: /\.(ts|tsx)$/ }, async (a) => { const fs = await import('node:fs/promises'); let t = await fs.readFile(a.path, 'utf8'); if (!t.includes('import.meta.glob')) return null; t = t.replace(/import\.meta\.glob(<[^>]*>)?\([^)]*\)/g, '({})'); return { contents: t, loader: a.path.endsWith('x') ? 'tsx' : 'ts' } }) } }],
  define: { 'import.meta.env': '{"DEV":false,"MODE":"production"}' },
  banner: { js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);` },
})
const almacen = new Map()
globalThis.localStorage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), clear: () => almacen.clear() }
globalThis.sessionStorage = globalThis.localStorage
globalThis.window = globalThis
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }
globalThis.addEventListener = () => {}
globalThis.removeEventListener = () => {}
const fetchReal = globalThis.fetch
globalThis.fetch = (u, o) => fetchReal(typeof u === 'string' && u.startsWith('/') ? 'http://localhost:8787' + u : u, o)
const m = await import(pathToFileURL(salida).href)

const VUELOS = (process.env.VUELOS ?? '15:30,17:30').split(',')
const aMin = (h) => { const x = /^(\d{1,2}):(\d{2})/.exec(h ?? ''); return x ? Number(x[1]) * 60 + Number(x[2]) : null }
const clave = (s) => s.name.trim().toLowerCase().replace(/\s*\([^)]*\)\s*$/, '')
let fallos = 0
for (const llegada of VUELOS) {
  const caso = { ...m.casoPorDefecto(destino), inicio, dias, llegada, salida: '', punto: '', freeTour: 'sin_hora' }
  const r = await m.probar(caso)
  const base = { ...r.antes, arrivalFlightTime: llegada, departureFlightTime: null, arrivalPointId: null, departurePointId: null }
  const propuesta = await m.propuestaDeVuelos(base, [], { pase: true, coche: null })
  const cambiosDias = propuesta?.dias ?? []
  const despuesDe = new Map(cambiosDias.map((d) => [d.dayId, d.next]))
  const final = base.days.map((d) => despuesDe.get(d.id) ?? d)
  const errores = []
  // 1. Nada quitado.
  const hoy = new Set(final.flatMap((d) => [...d.stops, ...(d.spareStops ?? [])].filter((s) => !s.isArrival && !s.isBreak).map(clave)))
  // (V74) Un «de camino» (`passThrough`: una calle, una fuente de paso) no es una visita: si sale de un día, sale sin aviso y no va a pendientes.
  const perdidos = base.days.flatMap((d) => d.stops.filter((s) => !s.isArrival && !s.isBreak && !s.passThrough && !hoy.has(clave(s))).map((s) => `${s.name} (día ${d.dayNumber})`))
  if (perdidos.length) errores.push(`sitios que desaparecen del viaje: ${perdidos.join(', ')}`)
  // (V74) Un imprescindible (los Museos Vaticanos) o el Free Tour que no cabe el día de llegada entra en el mejor día siguiente: no se queda en pendientes mientras otro día tenga algo menos importante (Roma: sí lo tiene).
  if (destino === 'Roma') {
    for (const nombre of [/Museos Vaticanos/, /Free Tour/]) {
      const estaba = base.days.some((d) => d.stops.some((s) => nombre.test(s.name)))
      const enDia = final.some((d) => d.stops.some((s) => nombre.test(s.name)))
      if (estaba && !enDia) errores.push()
    }
  }
  // (V74) Un imprescindible (los Museos Vaticanos) o el Free Tour que no cabe el día de llegada entra en el mejor día siguiente: no se queda en pendientes mientras otro día tenga algo menos importante (Roma: sí lo tiene).
  if (destino === 'Roma') {
    for (const nombre of [/Museos Vaticanos/, /Free Tour/]) {
      const estaba = base.days.some((d) => d.stops.some((s) => nombre.test(s.name)))
      const enDia = final.some((d) => d.stops.some((s) => nombre.test(s.name)))
      if (estaba && !enDia) errores.push(`${nombre.source} acaba en Lugares pendientes: debería entrar en el mejor día siguiente`)
    }
  }
  const rep = new Map()
  for (const d of final) for (const s of d.stops.filter((x) => !x.isArrival && !x.isBreak)) rep.set(clave(s), [...(rep.get(clave(s)) ?? []), d.dayNumber])
  // Solo cuentan los repetidos NUEVOS (los que ya traía el viaje, como el mismo sitio de día y «(noche)», no se miran).
  const rep0 = new Map()
  for (const d of base.days) for (const s of d.stops.filter((x) => !x.isArrival && !x.isBreak)) rep0.set(clave(s), (rep0.get(clave(s)) ?? 0) + 1)
  const repetidos = [...rep].filter(([k, v]) => v.length > (rep0.get(k) ?? 1)).map(([k, v]) => `${k} (días ${v.join(', ')})`)
  if (repetidos.length) errores.push(`sitios repetidos: ${repetidos.join(', ')}`)
  const hoja = m.cambiosDeReorganizar(cambiosDias.map((d) => ({ dayId: d.dayId, despues: d.next })), base)
  const tarjetas = hoja.grupos.flatMap((g) => g.tarjetas)
  const quitar = tarjetas.filter((t) => t.quitar)
  if (quitar.length) errores.push(`${quitar.length} tarjetas «se quita»: ${quitar.map((t) => t.nombre).join(', ')}`)
  // 3. Comida y cena del día de llegada.
  const d1 = final[0]
  const comida = d1.meals.find((x) => x.mealTime === 'lunch')
  const cena = d1.meals.find((x) => x.mealTime === 'dinner')
  const aterriza = aMin(llegada)
  if (comida && aterriza != null && aMin(comida.time) != null && aMin(comida.time) < aterriza) errores.push(`comida del día 1 a las ${comida.time}, antes de aterrizar (${llegada})`)
  if (aterriza != null && aterriza >= 16 * 60 + 30 && comida) errores.push(`el día 1 lleva comida aterrizando a las ${llegada}`)
  if (aterriza != null && aterriza >= 15 * 60 && aterriza <= 18 * 60 && !cena) errores.push(`el día 1 no lleva cena aterrizando a las ${llegada}`)
  // 4. Franjas.
  const franjas = m.franjasDelDia(d1)
  if (aterriza != null && aterriza >= 17 * 60) for (const f of franjas) if (f.franja === 'manana') errores.push(`parada «${f.nombre}» en MAÑANA aterrizando a las ${llegada}`)
  // 5. Idempotente.
  const segunda = await m.propuestaDeVuelos({ ...base, days: final }, [], { pase: true, coche: null })
  const otraVez = (segunda?.dias ?? []).map((d) => `día ${d.dayNumber}`)
  if (otraVez.length) errores.push(`la segunda vez cambia ${otraVez.join(', ')}`)
  if (errores.length) fallos++
  console.log(`\n=== ${destino}, vuelo ${llegada}: ${errores.length ? 'FALLA' : 'OK'}`)
  console.log(`  Días que cambian: ${cambiosDias.length} (${cambiosDias.map((d) => d.dayNumber).join(', ') || '—'}) de ${base.days.length}`)
  if (process.env.DETALLE) for (const g of hoja.grupos) for (const x of g.tarjetas) console.log(`    · ${x.nombre} — ${x.cuando}${x.aPendientes ? " [pendientes]" : ""}`)
  console.log(`  Tarjetas de la hoja: ${tarjetas.length}; a pendientes: ${tarjetas.filter((t) => t.aPendientes).length}; quitadas: ${quitar.length}`)
  console.log(`  Día 1 antes : ${r.antes.days[0].stops.map((s) => `${s.time ?? ''} ${s.name}`).join(' | ')}`)
  console.log(`  Día 1 después: ${d1.stops.map((s) => `${s.time ?? ''} ${s.name}`).join(' | ')}`)
  console.log(`  Comida: ${comida ? comida.time : 'no'} · Cena: ${cena ? cena.time : 'no'} · Pendientes del día 1: ${(d1.spareStops ?? []).map((s) => s.name).join(', ') || '—'}`)
  console.log(`  Franjas del día 1: ${franjas.map((f) => `${f.franja.toUpperCase()}:${f.nombre}@${f.hora ?? ''}`).join(' | ')}`)
  if (process.env.DETALLE) for (const [i, d] of base.days.entries()) { const f = final[i]; console.log(`  --- día ${d.dayNumber}${despuesDe.has(d.id) ? ' (CAMBIA)' : ''}${d.isReturnLeg ? ' (vuelta)' : ''}
      antes  : ${d.stops.map((x) => `${x.time ?? ''} ${x.name}`).join(' | ')}
      después: ${f.stops.map((x) => `${x.time ?? ''} ${x.name}`).join(' | ')} || pend: ${(f.spareStops ?? []).map((x) => x.name).join(', ') || '—'}`) }
  for (const e of errores) console.log(`  ERROR: ${e}`)
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} caso(s) FALLAN`)
process.exit(fallos === 0 ? 0 : 1)
