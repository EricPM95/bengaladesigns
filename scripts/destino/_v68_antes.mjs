// V68: los casos 1-3 de _v68_puras.mjs contra el código VIEJO (bookings.ts de HEAD), para ver que ANTES fallaban.
import { build } from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v68a-'))
const salida = path.join(dir, 'old.mjs')
await build({ stdin: { contents: "export { placeReservedEntrance } from './src/lib/_bookings_old_v68'\nexport { sitiosRepetidos } from './src/lib/sinSitiosRepetidos'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'silent', define: { 'import.meta.env': '{}' } })
const P = await import(pathToFileURL(salida).href)
const parada = (id, name, time, durationMinutes = 45, extra = {}) => ({ id, name, time, durationMinutes, ...extra })
const dia = (n, stops, extra = {}) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', stops, meals: [], ...extra })
const ruta = (days) => ({ id: 'r', destination: 'Roma', days, answers: { dateRange: { start: '2027-07-13', end: '2027-07-15' } } })
const base = () => ruta([dia(1, [parada('a1', 'Museos Vaticanos y Capilla Sixtina', '09:15', 180), parada('a2', 'Plaza de San Pedro', '12:25'), parada('a4', 'Trastevere', '15:25')]), dia(2, [parada('b1', 'Coliseo', '09:15', 80), parada('b3', 'Foro Romano y Palatino', '10:45', 90), parada('b6', 'Panteón', '16:45')])])
const lista = (d) => d.stops.map((s) => `${s.time} ${s.name}`).join(' ; ')
const r1 = P.placeReservedEntrance(base(), { id: 'r1', kind: 'entrada', refId: 'C', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo', 'Foro Romano y Palatino'], dateIso: '2027-07-13', time: '13:00', dayNumber: null })
console.log('ANTES coliseo (dia 1):', lista(r1.days[0]), '\n        (dia 2):', lista(r1.days[1]))
const r2 = P.placeReservedEntrance(base(), { id: 'r2', kind: 'entrada', refId: 'M', name: 'Museos', placeNames: ['Museos Vaticanos y Capilla Sixtina'], dateIso: '2027-07-14', time: '15:00', dayNumber: null })
console.log('ANTES vaticanos (dia 2):', lista(r2.days[1]))
