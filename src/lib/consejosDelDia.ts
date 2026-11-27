import { normalizar } from './avisosDelTiempo'

/**
 * (V77, 13) Los consejos de cada excursión o día especial (`data/dias/<destino>/_consejos.json`): 2 o 3 con su icono y su frase corta («Lleva agua: hay fuentes públicas dentro»).
 * Salen en MAÑANA («Consejos para mañana») y en la tarjeta de la excursión de HOY («Consejos para la excursión»). Solo lo que el dato trae, con su fuente en el propio archivo: nada se inventa.
 * Se leen del archivo del destino en el propio móvil, en un trozo aparte que NO entra en el peso de arranque; cero peticiones a Supabase, cero KB. Vale para todos los destinos: cada uno trae su archivo.
 */
export type IconoDeConsejo = 'agua' | 'calzado' | 'banador' | 'protector' | 'sombrero' | 'abrigo' | 'efectivo' | 'documento' | 'ropa' | 'coche'
export interface ConsejoDelDia {
  icono: IconoDeConsejo
  /** La palabra en negrita: «Lleva agua». */
  palabra: string
  /** La frase corta, en gris: «hay fuentes públicas dentro». */
  frase: string
}
interface GrupoDeConsejos {
  id: string
  ids?: string[]
  titulos?: string[]
  consejos: (ConsejoDelDia & { fuente?: string })[]
}
type Archivo = { grupos?: GrupoDeConsejos[] }

// En la app, Vite parte el glob en un trozo por destino que se pide al usarlo. Fuera de Vite (las pruebas que empaquetan para Node) `import.meta.glob` no existe: sin datos, sin consejos.
let CARGADORES: Record<string, () => Promise<Archivo>> = {}
try {
  CARGADORES = import.meta.glob('../../data/dias/*/_consejos.json', { import: 'default' }) as Record<string, () => Promise<Archivo>>
} catch {
  CARGADORES = {}
}

/** Qué consejos corresponden a un día. `ids`: la id del día escrito (`DG`, `D4`) y la de la excursión; `titulos`: el nombre del día y el de la excursión. Pura: se prueba sin leer archivos. */
export function consejosDe(archivo: Archivo | null | undefined, ids: (string | null | undefined)[], titulos: (string | null | undefined)[]): ConsejoDelDia[] {
  const misIds = ids.filter((x): x is string => Boolean(x))
  const misTitulos = titulos.filter((x): x is string => Boolean(x)).map((t) => normalizar(t))
  for (const g of archivo?.grupos ?? []) {
    const porId = (g.ids ?? []).some((i) => misIds.includes(i))
    const porTitulo = (g.titulos ?? []).some((t) => misTitulos.some((m) => m.includes(normalizar(t))))
    if ((porId || porTitulo) && g.consejos.length > 0) return g.consejos.slice(0, 3).map(({ icono, palabra, frase }) => ({ icono, palabra, frase }))
  }
  return []
}

/** Lee los consejos del día del archivo del destino; [] si el destino o el día no los traen. */
export async function leerConsejos(destino: string | null | undefined, ids: (string | null | undefined)[], titulos: (string | null | undefined)[]): Promise<ConsejoDelDia[]> {
  if (!destino) return []
  const clave = Object.keys(CARGADORES).find((k) => k.split('/').at(-2) === normalizar(destino))
  if (!clave) return []
  try {
    return consejosDe(await CARGADORES[clave](), ids, titulos)
  } catch {
    return []
  }
}
