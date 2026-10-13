// Explorador: dónde se diferencian dos planes (para depurar). Uso: node _t7v_dif.mjs <dias> <inicio> <hora>
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { argsDeViaje, planViajeVuelta } from './viajes20Lib.mjs'

const [dias, inicio, hora] = [Number(process.argv[2] ?? 3), process.argv[3] ?? '2027-07-13', process.argv[4] ?? '00:00']
const v = { n: 'x', dias, inicio, vuelo: hora }
const base = planListasTrip(argsDeViaje(v))
const con = planViajeVuelta(v)
const camino = (a, b, ruta, out) => {
  if (out.length > 8) return
  if (a === b) return
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') { out.push(`${ruta}: ${JSON.stringify(a)?.slice(0, 80)} ≠ ${JSON.stringify(b)?.slice(0, 80)}`); return }
  if (a instanceof Map || b instanceof Map) { camino([...(a instanceof Map ? a : [])], [...(b instanceof Map ? b : [])], `${ruta}(Map)`, out); return }
  const claves = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of claves) camino(a[k], b[k], `${ruta}.${k}`, out)
}
const out = []
camino(base, con, 'plan', out)
console.log(out.join('\n') || 'iguales')
