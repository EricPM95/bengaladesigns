// V61: COMPROBACIÓN de desarrollo (no es una prueba de la batería): reorganizar dos veces seguidas da lo mismo.
// Con los tres vuelos de Eric (10:30, 13:30 y 17:00 a Ciampino/Fiumicino), viaje de Roma, ida el viernes 27-nov-2026, Free Tour SIN hora: se genera el viaje sin vuelos, se aplica «Reorganizar»
// (`propuestaDeVuelos`, la misma función del botón) y se vuelve a pedir sobre el resultado: no puede proponer NINGÚN día. Además, ninguna parada de ese día queda con el horario cerrado
// (Panteón después de las 19:00…). Usa el servidor de la API en 8787 (no abre Vite ni navegador). Uso:
//   node scripts/destino/comprobarReorganizarIdempotente.mjs [destino=Roma] [inicio=2026-11-27] [dias=4]
// Sale con código 1 si algún caso falla. Lanzarote: `node … Lanzarote 2027-03-07 6` (con la API normal).
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const destino = process.argv[2] ?? 'Roma'
const inicio = process.argv[3] ?? '2026-11-27'
const dias = Number(process.argv[4] ?? 4)
const salida = path.join(os.tmpdir(), 'v61_idempotente.mjs')
await build({
  stdin: {
    contents: `export { probar, casoPorDefecto } from './src/components/panel/reorganizar/motorDelProbador.ts'\nexport { propuestaDeVuelos } from './src/lib/adaptarVuelos.ts'`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'error',
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

const VUELOS = (process.env.VUELOS ?? '10:30,13:30,17:00').split(',')
let fallos = 0
const fila = (d) => d.stops.map((s) => `${s.time ?? ''} ${s.name}`).join(' | ')
for (const llegada of VUELOS) {
  const caso = { ...m.casoPorDefecto(destino), inicio, dias, llegada, salida: '', punto: '', freeTour: 'sin_hora' }
  const r = await m.probar(caso)
  // Segunda pasada: el mismo botón sobre el viaje YA reorganizado.
  const segunda = await m.propuestaDeVuelos(r.despues, [], { pase: true, coche: null })
  const cambiaOtraVez = (segunda?.dias ?? []).map((d) => `día ${d.dayNumber}`)
  const ok = cambiaOtraVez.length === 0
  if (!ok) fallos++
  console.log(`\n=== ${destino}, vuelo ${llegada}: ${ok ? 'OK (la segunda vez no propone nada)' : `FALLA: la segunda vez cambia ${cambiaOtraVez.join(', ')}`}`)
  const d1 = r.despues.days[0]
  console.log('  Antes  día 1:', fila(r.antes.days[0]))
  console.log('  Después día 1:', fila(d1), '|| a pendientes:', (d1.spareStops ?? []).map((s) => s.name).join(', ') || '—')
  if (!ok) for (const d of segunda.dias) console.log(`  Segunda pasada, día ${d.dayNumber}:`, fila(d.next))
}
console.log(fallos === 0 ? '\nTODO OK' : `\n${fallos} caso(s) FALLAN`)
process.exit(fallos === 0 ? 0 : 1)
