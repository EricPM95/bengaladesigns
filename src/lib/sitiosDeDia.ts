import { normalizaNombre, type HorarioDeParada } from './horarioDeParada'

/**
 * (V67, L6) LOS SITIOS QUE SOLO SE VEN DE DÍA (miradores, playas y naturaleza sin horario). Los datos de cada destino están en `data/dias/<destino>/_de_dia.json` (un destino nuevo solo añade su archivo; sin él nada cambia).
 * Pasada la puesta de sol, HOY no los propone como siguiente parada (salen como lo que ya no cabe hoy, con [Pasar a otro día] y [Guardar en pendientes]) y su caja HORARIO dice «De día» y debajo «Se ve hasta las 18:26»: NUNCA «Cerrado».
 * Lo que se ve de noche (la Fontana de Trevi iluminada, un castillo, una plaza) no va en esos archivos y sigue igual. Se lee del archivo en el propio móvil: no pregunta a Supabase.
 */
type Archivos = Record<string, { sitios?: string[] }>
// (V68) En la app, Vite resuelve el glob al compilar. Fuera de Vite (las pruebas que empaquetan con esbuild para Node) `import.meta.glob` no existe: se leen los mismos JSON con `fs`.
let ARCHIVOS: Archivos = {}
try {
  ARCHIVOS = import.meta.glob('../../data/dias/*/_de_dia.json', { eager: true, import: 'default' }) as Archivos
} catch {
  try {
    const nodo = (globalThis as { process?: { getBuiltinModule?: (n: string) => any; cwd?: () => string } }).process
    const fs = nodo?.getBuiltinModule?.('node:fs')
    const raiz = `${nodo?.cwd?.()}/data/dias`
    if (fs) for (const d of fs.readdirSync(raiz)) { const f = `${raiz}/${d}/_de_dia.json`; if (fs.existsSync(f)) ARCHIVOS[f] = JSON.parse(fs.readFileSync(f, 'utf8')) }
  } catch { /* sin archivos: ningún sitio es «solo de día» */ }
}
const SITIOS = new Set<string>()
for (const a of Object.values(ARCHIVOS)) for (const n of a.sitios ?? []) SITIOS.add(normalizaNombre(n))

/** ¿Es un sitio que solo se ve de día? (por el nombre de la parada). */
export const esSoloDeDia = (nombre: string | null | undefined): boolean => SITIOS.has(normalizaNombre(nombre ?? ''))

const aTexto = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

/** El «horario» de un sitio de día: de las 0:00 a la puesta de sol (`luz`). Solo para HOY: DÍAS y las fichas no lo usan (no tiene horario de verdad). */
export function horarioDeLuz(finMin: number): HorarioDeParada {
  const fin = aTexto(finMin)
  return { abre: '0:00', cierra: fin, ultimaEntrada: null, cerrado: false, tramos: [{ abre: '0:00', cierra: fin }], texto: `Se ve hasta las ${fin}`, luz: true }
}

/** «18:26» o «18:26 h» → minutos; null si no se lee. */
export function minutosDeLaHora(hora: string | null | undefined): number | null {
  const m = /(\d{1,2}):(\d{2})/.exec(hora ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
