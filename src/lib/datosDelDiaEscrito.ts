import { normalizar } from './avisosDelTiempo'

/**
 * (V73) Lo que dicen los datos de un día escrito (`data/dias/<destino>/listas.json`) de su excursión: el traslado con hora («Ferry de las 10:00 desde Órzola») y si hay tiempo de playa (el consejo «Lleva el bañador…»).
 * Se leen del archivo del destino en el propio móvil, cuando mañana es un día de excursión: el archivo es un trozo aparte (no entra en el peso de arranque) y no pregunta a Supabase (cero peticiones, cero KB).
 * Nada se inventa: si el día no trae el dato, la línea no sale. Vale para todos los destinos: cada uno trae su archivo.
 */
interface Paso { tipo?: string; como?: string; texto?: string; hora?: string; tiempo_de_playa?: boolean }
interface DiaEscrito { partes?: Record<string, { manana?: Paso[]; tarde?: Paso[] }> }
type Archivo = { dias?: Record<string, DiaEscrito> }

// En la app, Vite parte el glob en un trozo por destino que se pide al usarlo. Fuera de Vite (las pruebas que empaquetan para Node) `import.meta.glob` no existe: sin datos, sin líneas.
let CARGADORES: Record<string, () => Promise<Archivo>> = {}
try {
  CARGADORES = import.meta.glob('../../data/dias/*/listas.json', { import: 'default' }) as Record<string, () => Promise<Archivo>>
} catch {
  CARGADORES = {}
}

export interface DatosDeExcursion {
  /** «Ferry de las 10:00 desde Órzola» (el traslado con `hora` de los datos del día). */
  traslado: string | null
  /** Hay tiempo de playa en el día (`tiempo_de_playa`): «Lleva el bañador y protector solar: hay playa.». */
  playa: boolean
}

/** El traslado con hora y la playa del día escrito. Pura: se prueba sin leer archivos. */
export function datosDeExcursionDe(dia: DiaEscrito | null | undefined): DatosDeExcursion {
  const partes = dia?.partes ? (dia.partes.unica ?? Object.values(dia.partes)[0]) : null
  const manana = partes?.manana ?? []
  const i = manana.findIndex((r) => r.tipo === 'traslado' && /^\d{1,2}:\d{2}$/.test(r.hora ?? '') && r.texto)
  let traslado: string | null = null
  if (i >= 0) {
    const base = (manana[i].texto ?? '').split(' (')[0].trim()
    // «desde Órzola»: el traslado de antes dice «A Órzola (…)» (el sitio de donde sale el ferry).
    const antes = manana.slice(0, i).map((r) => /^A\s+([^(.,;]+?)\s*(?:\(|[.,;]|$)/.exec(r.texto ?? '')?.[1]).find(Boolean)
    traslado = base ? `${base}${antes && !/\bdesde\b/i.test(base) ? ` desde ${antes}` : ''}` : null
  }
  return { traslado, playa: (partes?.tarde ?? []).some((r) => r.tiempo_de_playa === true) }
}

/** Lee el día escrito (`DG`…) del archivo del destino; null si el destino o el día no están. */
export async function leerDatosDeExcursion(destino: string | null | undefined, diaEscritoId: string | null | undefined): Promise<DatosDeExcursion | null> {
  if (!destino || !diaEscritoId) return null
  const clave = Object.keys(CARGADORES).find((k) => k.split('/').at(-2) === normalizar(destino))
  if (!clave) return null
  try {
    const archivo = await CARGADORES[clave]()
    const dia = archivo.dias?.[diaEscritoId]
    return dia ? datosDeExcursionDe(dia) : null
  } catch {
    return null
  }
}
