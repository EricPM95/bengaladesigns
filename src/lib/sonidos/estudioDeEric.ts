import { cargarPremio, LETRAS, ponerEstudio, type AjusteDeCode, type EstudioDelMotor, type Letra, type SonidoPropio } from './motor'

/**
 * (V40) LOS SONIDOS DEFINITIVOS DE ERIC, EN LA APP. `data/sonidos/estudio.json` es lo que dejó el estudio de sonidos (lo escribe `scripts/sonidos/aplicarEstudio.mjs --escribir`); sus archivos están en `public/sonidos/estudio/`
 * (ya en .m4a: `scripts/sonidos/comprimirEstudio.mjs`). Aquí se convierte cada animación en EXACTAMENTE el estado que el estudio le da al motor al pulsar ▶: los sonidos de Eric (cada uno con su momento y su volumen),
 * los de Code silenciados, movidos o con su candidato, y el volumen de cada uno. Nada se iguala ni se recorta por cuenta de la app: eso ya lo hizo Eric con [Editar].
 *   · Se carga SOLO al hacer falta: el json (un import dinámico, trocito aparte) la primera vez que suena un momento, y los archivos de una animación solo cuando va a sonar (o la siguiente pantalla los prepara).
 *   · Una animación que Eric no ha tocado (o que no está en el json: Lanzarote, hasta el siguiente zip) se queda con el sonido de Code de siempre.
 * Cada petición de archivo: una por sonido de Eric de la animación que va a sonar (de 5 a 200 KB, caché larga de Vercel), una sola vez por sesión. Sin consultas a Supabase.
 */
interface CodigoJson {
  clave: string
  tipo: 'archivo' | 'sint'
  sonido: string
  version: string | null
  silenciado: boolean
  volumen: number
  ms: number
  empieza: 'sitio' | 'principio' | 'golpe'
}
interface CapaJson {
  origen: 'archivo' | 'code'
  archivo?: string
  nombre?: string
  sonido?: string
  version?: string
  volumen: number
  ms: number
  empieza: 'principio' | 'golpe'
}
export interface AnimacionDeEric {
  duracion?: number
  golpe: number
  tramos?: { partitura: string; empieza: number }[]
  sonidos_de_code: CodigoJson[]
  capas: CapaJson[]
}
export interface EstudioJson {
  version: number
  volumen_general?: number
  animaciones: Record<string, AnimacionDeEric>
}

let json: Promise<EstudioJson | null> | null = null

/** El json del estudio (un trocito aparte, solo la primera vez que hace falta). */
export function cargarEstudioDeEric(): Promise<EstudioJson | null> {
  json ??= import('../../../data/sonidos/estudio.json')
    .then((m) => (m.default ?? m) as unknown as EstudioJson)
    .catch(() => null)
  return json
}

/** La URL del archivo de una capa en la app: lo ya hecho viaja como .m4a (el .wav del estudio se convierte y se quita). */
export const urlDeCapa = (archivo: string): string => `/sonidos/estudio/${archivo.replace(/\.wav$/i, '.m4a')}`

/** PURA: de lo que dice el json de una animación (y sus archivos ya decodificados) al estado del motor. */
export function estadoDelMotor(a: AnimacionDeEric, buffers: { propios: SonidoPropio[] }): EstudioDelMotor {
  const silenciados: string[] = []
  const letras: Record<string, Letra> = {}
  const volumenes: Record<string, number> = {}
  const ajustes: Record<string, AjusteDeCode> = {}
  for (const c of a.sonidos_de_code) {
    if (c.silenciado) silenciados.push(c.clave)
    if (c.version && (LETRAS as string[]).includes(c.version)) letras[c.sonido] = c.version as Letra
    volumenes[c.tipo === 'sint' ? `s:${c.sonido}` : c.sonido] = Math.min(2, Math.max(0, Number.isFinite(c.volumen) ? c.volumen : 1))
    if (c.ms !== 0 || c.empieza !== 'sitio') ajustes[c.clave] = { ms: Math.round(c.ms), empieza: c.empieza }
  }
  const inicios: Record<string, number> = {}
  for (const t of a.tramos ?? []) inicios[t.partitura] = t.empieza
  return { propios: buffers.propios, silenciados, golpe: a.golpe, ajustes, letras, volumenes, editados: {}, inicios }
}

const preparadas = new Map<string, Promise<EstudioDelMotor | null>>()
const listas = new Map<string, EstudioDelMotor>()
const aDecodificar = async (ctx: BaseAudioContext, url: string): Promise<AudioBuffer | null> => {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return await ctx.decodeAudioData(await r.arrayBuffer())
  } catch {
    return null
  }
}

/** Deja listo (archivos bajados y decodificados) lo de Eric para esta animación; `null` si Eric no la ha tocado. Una sola vez por animación. */
export function prepararEstudioDeEric(ctx: BaseAudioContext, id: string): Promise<EstudioDelMotor | null> {
  let p = preparadas.get(id)
  if (!p) {
    p = (async () => {
      const j = await cargarEstudioDeEric()
      const a = j?.animaciones?.[id]
      if (!a) return null
      const propios: SonidoPropio[] = []
      await Promise.all(
        a.capas.map(async (c, i) => {
          const buffer = c.origen === 'archivo' && c.archivo ? await aDecodificar(ctx, urlDeCapa(c.archivo)) : c.sonido && c.version && (LETRAS as string[]).includes(c.version) ? await cargarPremio(ctx, c.sonido, c.version as Letra) : null
          if (!buffer) return
          propios[i] = { id: `z${i + 1}`, nombre: c.nombre ?? `${c.sonido} · ${c.version}`, buffer, ms: Math.round(c.ms), vol: Math.min(2, Math.max(0, c.volumen)), empieza: c.empieza === 'golpe' ? 'golpe' : 'principio' }
        }),
      )
      // Los candidatos de Code que sí suenan en esta animación, descargados antes (así caen en su instante).
      await Promise.all(a.sonidos_de_code.filter((c) => !c.silenciado && c.tipo === 'archivo' && c.version && (LETRAS as string[]).includes(c.version)).map((c) => cargarPremio(ctx, c.sonido, c.version as Letra)))
      const e = estadoDelMotor(a, { propios: propios.filter(Boolean) })
      listas.set(id, e)
      return e
    })()
    preparadas.set(id, p)
  }
  return p
}

/** Lo que ya está preparado (sin esperar nada), o null. */
export const estudioPreparado = (id: string): EstudioDelMotor | null => listas.get(id) ?? null
/** Cuánto hay que retrasar el primer fotograma para que un sonido de Eric que cae antes (ms negativos) se oiga entero: como el estudio, que retrasa la animación y no recorta el sonido. */
export const esperaDe = (id: string): number => {
  const e = listas.get(id)
  return e ? Math.max(0, ...e.propios.map((p) => -((p.empieza === 'golpe' ? e.golpe : 0) + p.ms / 1000))) : 0
}
/** Pone ya (sin esperar) el estudio de esta animación, si está preparado; si no, el de siempre. Para pantallas que lo leen al pintarse (el hueco entre pedazos). */
export function aplicarYa(id: string | null): boolean {
  if (!id) return false
  const e = listas.get(id)
  if (!e) return false
  ponerEstudio(e)
  return true
}
