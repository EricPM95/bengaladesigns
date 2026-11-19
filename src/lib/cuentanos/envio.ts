import { tokenDeLaCuenta } from '../servidor'
import { supabase } from '../supabaseClient'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { tacharLlaves } from '../errorDePantalla'
import { datosDelAviso, type Borrador, type Punto, type TipoAviso } from './tipos'

/**
 * (V20) «CUÉNTANOS»: lo que se manda solo, las fotos reducidas, la subida al almacén y la COLA SIN RED (se guarda en el móvil y se manda sola al volver la red).
 * Contrato con el servidor (server/avisosViajeros.js): POST /api/avisos/subida → URLs firmadas; POST /api/avisos-viajeros → el aviso.
 */

/* ───────── Los últimos errores de la app (para «Algo no funciona») ───────── */
const ERRORES: string[] = []
let instalado = false
/** Guarda los últimos 5 errores de la app (limpios con `tacharLlaves`: sin correos, tokens ni claves). Se llama una vez al arrancar. */
export function instalarRegistroDeErrores(): void {
  if (instalado || typeof window === 'undefined') return
  instalado = true
  const anotar = (texto: string) => {
    ERRORES.push(tacharLlaves(texto).slice(0, 300))
    if (ERRORES.length > 5) ERRORES.shift()
  }
  window.addEventListener('error', (e) => anotar(`${e.message ?? 'error'} (${(e.filename ?? '').split('/').pop() ?? ''}:${e.lineno ?? 0})`))
  window.addEventListener('unhandledrejection', (e) => anotar(`promesa sin atender: ${String((e.reason as { message?: unknown } | undefined)?.message ?? e.reason ?? '')}`))
}
export const erroresRecientes = (): string[] => [...ERRORES]

/* ───────── Lo que se manda solo ───────── */
export interface ContextoDelAviso {
  destino: string
  trip_id: string | null
  pantalla: string
  pestana: string
  parada: string | null
  dia: string | null
  version: string
  dispositivo: string
  navegador: string
  hora: string
}

/** Pura: el modelo del móvil y el navegador, a partir del texto del navegador (sin datos de la persona). */
export function dispositivoYNavegador(ua: string): { dispositivo: string; navegador: string } {
  const modelo = /\b(iPhone|iPad)\b/.exec(ua)?.[1] ?? /;\s*([^;)]*?)\s+Build\//.exec(ua)?.[1] ?? /Android[^;]*;\s*([^;)]+)\)/.exec(ua)?.[1] ?? (/Macintosh|Windows|Linux/.exec(ua)?.[0] ?? 'desconocido')
  const navegador = /EdgA?\/(\d+)/.exec(ua) ? `Edge ${/EdgA?\/(\d+)/.exec(ua)?.[1]}` : /CriOS\/(\d+)|Chrome\/(\d+)/.exec(ua) ? `Chrome ${/CriOS\/(\d+)|Chrome\/(\d+)/.exec(ua)?.slice(1).find(Boolean)}` : /FxiOS\/(\d+)|Firefox\/(\d+)/.exec(ua) ? 'Firefox' : /Version\/(\d+)[^]*Safari/.exec(ua) ? `Safari ${/Version\/(\d+)/.exec(ua)?.[1]}` : 'desconocido'
  return { dispositivo: modelo.slice(0, 60), navegador: navegador.slice(0, 40) }
}

export function contextoDelAviso(extra: { parada?: string | null; dia?: string | null } = {}): ContextoDelAviso {
  const ruta = useRouteStore.getState() as { route?: { destination?: string } | null; screen?: unknown; mode?: unknown; activeDayId?: string | null }
  const { dispositivo, navegador } = dispositivoYNavegador(typeof navigator !== 'undefined' ? navigator.userAgent : '')
  return {
    destino: ruta.route?.destination ?? '',
    trip_id: useSyncStore.getState().activeTripId ?? null,
    pantalla: typeof ruta.screen === 'string' ? ruta.screen : 'desconocida',
    pestana: typeof ruta.mode === 'string' ? ruta.mode : '',
    parada: extra.parada ?? null,
    dia: extra.dia ?? ruta.activeDayId ?? null,
    version: typeof __COMMIT_APP__ === 'string' ? __COMMIT_APP__ : 'local',
    dispositivo,
    navegador,
    hora: new Date().toISOString(),
  }
}

/* ───────── Fotos ───────── */
/** La foto REDUCIDA (como las del viaje): lado largo máximo 1280 px, JPEG. Nunca la original. Si el navegador no puede, se devuelve la misma. */
export async function reducirFoto(archivo: Blob, lado = 1280, calidad = 0.8): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(archivo)
    const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(bitmap.width * escala)
    lienzo.height = Math.round(bitmap.height * escala)
    lienzo.getContext('2d')?.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height)
    const sale = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', calidad))
    return sale ?? archivo
  } catch {
    return archivo
  }
}

/** Un color que html2canvas no entiende (oklch, color-mix…) → rgb(), con el propio lienzo del navegador. */
function aRgb(color: string): string {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    const g = c.getContext('2d')
    if (!g) return color
    g.clearRect(0, 0, 1, 1)
    g.fillStyle = '#000'
    g.fillStyle = color
    g.fillRect(0, 0, 1, 1)
    const [r, gr, b, a] = g.getImageData(0, 0, 1, 1).data
    return `rgba(${r},${gr},${b},${(a / 255).toFixed(3)})`
  } catch {
    return 'transparent'
  }
}
const COLOR_RARO = /(?:oklch|oklab|color-mix|lab|lch|color)\([^()]*(?:\([^()]*\)[^()]*)*\)/g
const TIENE_COLOR_RARO = /oklch|oklab|color-mix|\blab\(|\blch\(/
/** Cambia, en una regla de CSS (y las que lleva dentro), cada color moderno por su rgb. */
function limpiarRegla(regla: CSSRule): void {
  const r = regla as CSSRule & { style?: CSSStyleDeclaration; cssRules?: CSSRuleList }
  if (r.style) {
    for (let i = 0; i < r.style.length; i++) {
      const prop = r.style[i]
      const v = r.style.getPropertyValue(prop)
      if (v && TIENE_COLOR_RARO.test(v)) r.style.setProperty(prop, v.replace(COLOR_RARO, (m) => aRgb(m)), r.style.getPropertyPriority(prop))
    }
  }
  if (r.cssRules) for (const hija of Array.from(r.cssRules)) limpiarRegla(hija)
}

/** html2canvas 1.4 no sabe leer colores modernos (oklch…): en la COPIA que pinta se cambian por su rgb, en las hojas de estilo y en cada elemento. La app de verdad no se toca. */
function sinColoresRaros(doc: Document): void {
  for (const hoja of Array.from(doc.styleSheets)) {
    try {
      for (const regla of Array.from(hoja.cssRules)) limpiarRegla(regla)
    } catch {
      /* una hoja de otro origen: no se puede leer */
    }
  }
  const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'box-shadow', 'text-shadow', 'text-decoration-color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color', '-webkit-text-stroke-color']
  doc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cs = doc.defaultView?.getComputedStyle(el)
    if (!cs) return
    for (const prop of PROPS) {
      const v = cs.getPropertyValue(prop)
      if (v && TIENE_COLOR_RARO.test(v)) el.style.setProperty(prop, v.replace(COLOR_RARO, (m) => aRgb(m)), 'important')
    }
  })
}

/** La captura de la pantalla en la que estaba (reducida). Sin ella (el navegador no puede), null. */
export async function capturarPantalla(): Promise<Blob | null> {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const lienzo = await html2canvas(document.body, {
      scale: 0.5,
      logging: false,
      useCORS: true,
      ignoreElements: (e) => e instanceof HTMLElement && e.dataset.cuentanos !== undefined,
      onclone: (doc) => sinColoresRaros(doc),
    })
    return await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', 0.6))
  } catch (error) {
    console.warn('[cuentanos] no se pudo sacar la captura:', error)
    return null
  }
}

/* ───────── El envío ───────── */
export interface AvisoParaEnviar {
  tipo: TipoAviso
  datos: Record<string, unknown>
  contexto: ContextoDelAviso
  punto: Punto | null
  avisame: boolean
  errores?: string[]
}
export interface ArchivosDelAviso {
  fotos: Blob[]
  /** `true`: las fotos son las de «Comparte tu foto» (enteras, sin reducir). */
  fotosEnteras?: boolean
  captura: Blob | null
}

/** Pura: el cuerpo del aviso (sin los archivos). */
export function cuerpoDelAviso(a: AvisoParaEnviar, fotos: string[], captura: string | null): Record<string, unknown> {
  return {
    tipo: a.tipo,
    datos: a.datos,
    ...a.contexto,
    ...(a.punto ? { punto: a.punto } : {}),
    fotos,
    ...(captura ? { captura } : {}),
    ...(a.errores?.length ? { errores: a.errores } : {}),
    avisame: a.avisame,
  }
}

async function post<T>(ruta: string, cuerpo: unknown): Promise<{ estado: number; datos: T | null }> {
  try {
    const cab: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = await tokenDeLaCuenta()
    if (token) cab.Authorization = `Bearer ${token}`
    const r = await fetch(ruta, { method: 'POST', headers: cab, body: JSON.stringify(cuerpo) })
    return { estado: r.status, datos: (await r.json().catch(() => null)) as T | null }
  } catch {
    return { estado: 0, datos: null }
  }
}

/** Sube los archivos al almacén (URLs firmadas del servidor). Devuelve las rutas. Sin almacén (local), lista vacía; si falla la red, lanza. */
async function subir(archivos: Blob[], clase: 'foto' | 'captura' | 'foto_entera'): Promise<string[]> {
  if (archivos.length === 0) return []
  const r = await post<{ ok?: boolean; subidas?: { ruta: string; url: string }[]; sin_almacen?: boolean }>('/api/avisos/subida', { cuantas: archivos.length, clase })
  if (r.estado === 0) throw new Error('sin red')
  const subidas = r.datos?.subidas ?? []
  const rutas: string[] = []
  for (let i = 0; i < Math.min(subidas.length, archivos.length); i++) {
    const put = await fetch(subidas[i].url, { method: 'PUT', headers: { 'Content-Type': archivos[i].type || 'image/jpeg' }, body: archivos[i] })
    if (!put.ok) throw new Error('no se pudo subir un archivo')
    rutas.push(subidas[i].ruta)
  }
  return rutas
}

export type ResultadoDeEnvio = { estado: 'enviado'; id: string | null } | { estado: 'en_cola' } | { estado: 'rechazado'; error: string }

/** Manda el aviso. Sin red (o si el servidor no contesta), se guarda en el móvil y se manda solo al volver la red. */
export async function enviarAviso(aviso: AvisoParaEnviar, archivos: ArchivosDelAviso): Promise<ResultadoDeEnvio> {
  try {
    const fotos = await subir(archivos.fotos, archivos.fotosEnteras ? 'foto_entera' : 'foto')
    const capturas = archivos.captura ? await subir([archivos.captura], 'captura') : []
    const r = await post<{ ok?: boolean; id?: string; error?: string }>('/api/avisos-viajeros', cuerpoDelAviso(aviso, fotos, capturas[0] ?? null))
    if (r.estado === 0 || r.estado >= 500) throw new Error('el servidor no contesta')
    if (r.estado === 429) return { estado: 'rechazado', error: 'Has mandado muchos avisos seguidos. Inténtalo en un rato.' }
    if (!r.datos?.ok) return { estado: 'rechazado', error: r.datos?.error ?? 'No hemos podido guardarlo.' }
    return { estado: 'enviado', id: r.datos.id ?? null }
  } catch {
    await guardarEnCola(aviso, archivos)
    return { estado: 'en_cola' }
  }
}

/* ───────── La cola sin red (IndexedDB: guarda también las fotos) ───────── */
const BASE = 'cuentanos-cola'
const TABLA = 'avisos'
interface EnCola extends ArchivosDelAviso {
  id: string
  aviso: AvisoParaEnviar
  guardadoEn: number
}
function abrir(): Promise<IDBDatabase | null> {
  return new Promise((ok) => {
    if (typeof indexedDB === 'undefined') return ok(null)
    try {
      const p = indexedDB.open(BASE, 1)
      p.onupgradeneeded = () => p.result.createObjectStore(TABLA, { keyPath: 'id' })
      p.onsuccess = () => ok(p.result)
      p.onerror = () => ok(null)
    } catch {
      ok(null)
    }
  })
}
const pedir = <T>(r: IDBRequest<T>): Promise<T | null> => new Promise((ok) => { r.onsuccess = () => ok(r.result); r.onerror = () => ok(null) })

export async function guardarEnCola(aviso: AvisoParaEnviar, archivos: ArchivosDelAviso): Promise<void> {
  const db = await abrir()
  if (!db) return
  const item: EnCola = { id: `c${Date.now()}${Math.random().toString(36).slice(2, 7)}`, aviso, ...archivos, guardadoEn: Date.now() }
  await pedir(db.transaction(TABLA, 'readwrite').objectStore(TABLA).put(item))
  db.close()
}
export async function avisosEnCola(): Promise<number> {
  const db = await abrir()
  if (!db) return 0
  const n = (await pedir(db.transaction(TABLA).objectStore(TABLA).count())) ?? 0
  db.close()
  return n
}

let vaciando = false
/** Manda los avisos guardados sin red. Se llama al volver la red y al abrir la app. Los que el servidor rechaza (400/429) se quitan; los que no llegan, se quedan. */
export async function vaciarCola(): Promise<number> {
  if (vaciando) return 0
  vaciando = true
  let enviados = 0
  try {
    const db = await abrir()
    if (!db) return 0
    const todos = ((await pedir(db.transaction(TABLA).objectStore(TABLA).getAll())) ?? []) as EnCola[]
    for (const item of todos) {
      try {
        const fotos = await subir(item.fotos ?? [], item.fotosEnteras ? 'foto_entera' : 'foto')
        const capturas = item.captura ? await subir([item.captura], 'captura') : []
        const r = await post<{ ok?: boolean }>('/api/avisos-viajeros', cuerpoDelAviso(item.aviso, fotos, capturas[0] ?? null))
        if (r.estado === 0 || r.estado >= 500) continue
        await pedir(db.transaction(TABLA, 'readwrite').objectStore(TABLA).delete(item.id))
        if (r.datos?.ok) enviados++
      } catch {
        /* sin red: se queda para la próxima */
      }
    }
    db.close()
  } finally {
    vaciando = false
  }
  return enviados
}

let colaEncendida = false
/** Manda la cola al volver la red y una vez al arrancar. */
export function encenderLaCola(): void {
  if (colaEncendida || typeof window === 'undefined') return
  colaEncendida = true
  window.addEventListener('online', () => void vaciarCola())
  window.setTimeout(() => void vaciarCola(), 4000)
}

/** ¿Hay una cuenta de verdad (no anónima)? Para saber si «Avísame» puede avisar. */
export async function hayCuentaDeVerdad(): Promise<boolean> {
  try {
    const u = (await supabase?.auth.getSession())?.data.session?.user
    return Boolean(u) && u?.is_anonymous !== true
  } catch {
    return false
  }
}

export { datosDelAviso }
export type { Borrador }
