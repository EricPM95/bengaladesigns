import { normalizaNombre } from './horarioDeParada'

/**
 * (V54 §2) LA PUNTUALIDAD DE CADA ENTRADA. No todas las entradas tienen hora estricta: al Foro y al Palatino se entra a cualquier hora (la entrada vale 24 h); al Coliseo, solo a la hora.
 * Los datos de cada destino están en `data/dias/<destino>/_puntualidad.json` (comprobados en la web oficial de cada sitio, con su URL): un destino nuevo solo añade su archivo.
 *  · estricta: si llegas tarde, no entras · margen: se admite un retraso de `margen_min` · libre: cualquier hora del día (o de 24 h).
 * Lo que no está en los datos, o no se pudo confirmar, va CON MARGEN de 15 min (V67; antes era estricta): no se sacan avisos rojos de urgencia donde no hace falta. Se lee del archivo en el propio móvil: no pregunta a Supabase (cero peticiones, cero KB).
 */
export type Puntualidad = { tipo: 'estricta' | 'margen' | 'libre'; margenMin: number }

interface Ficha { tipo?: string; margen_min?: number }
const ARCHIVOS = import.meta.glob('../../data/dias/*/_puntualidad.json', { eager: true, import: 'default' }) as Record<string, { sitios?: Record<string, Ficha> }>

const TABLA: { clave: string; f: Ficha }[] = []
for (const a of Object.values(ARCHIVOS)) for (const [k, f] of Object.entries(a.sitios ?? {})) TABLA.push({ clave: normalizaNombre(k), f })

const ESTRICTA: Puntualidad = { tipo: 'estricta', margenMin: 0 }
const POR_DEFECTO: Puntualidad = { tipo: 'margen', margenMin: 15 }

/** La puntualidad de un sitio por su nombre (o el de una reserva). Sin dato: con margen de 15 min. */
export function puntualidadDe(nombre: string | null | undefined): Puntualidad {
  const n = normalizaNombre(nombre ?? '')
  if (!n) return POR_DEFECTO
  const hit = TABLA.find((t) => t.clave === n) ?? TABLA.find((t) => n.length >= 5 && (t.clave.includes(n) || n.includes(t.clave)))
  if (!hit) return POR_DEFECTO
  if (hit.f.tipo === 'libre') return { tipo: 'libre', margenMin: 0 }
  if (hit.f.tipo === 'margen' && (hit.f.margen_min ?? 0) > 0) return { tipo: 'margen', margenMin: hit.f.margen_min as number }
  if (hit.f.tipo === 'estricta') return ESTRICTA
  return POR_DEFECTO
}
