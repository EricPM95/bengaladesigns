/**
 * LAS DIRECCIONES FIRMADAS DE LAS FOTOS, ESTABLES (V26, el gasto de Supabase). Las fotos del viaje viven en un almacén privado: para verlas se pide una dirección firmada. Antes se pedía OTRA cada vez que se listaban
 * las fotos (al abrir RUTA, DÍAS, HOY, el resumen, cada subida…) y, como la firma va dentro de la dirección, el móvil la tomaba por una foto nueva y la volvía a BAJAR entera: la misma foto, una y otra vez.
 * Ahora la dirección de cada foto se guarda (en memoria y en el móvil) y se REUTILIZA mientras sirva: la misma dirección → el móvil guarda la foto y no la baja de nuevo. Vale 6 días y se renueva cuando le queda menos de uno.
 * Pura salvo el almacén (inyectable): se prueba sin red.
 */
export const SEGUNDOS_FIRMA_LARGA = 6 * 24 * 3600
const RENOVAR_ANTES_MS = 24 * 3600 * 1000
const CLAVE_ALMACEN = 'jutrip.urls_firmadas.v1'
const MAXIMO_GUARDADAS = 600

interface Guardada {
  url: string
  /** Cuándo caduca la firma (milisegundos). */
  hasta: number
}

export interface Almacen {
  leer: () => Record<string, Guardada>
  guardar: (todo: Record<string, Guardada>) => void
}

const enMemoria = new Map<string, Guardada>()
let cargadoDelMovil = false

const almacenDelMovil: Almacen = {
  leer: () => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_ALMACEN) ?? '{}') as Record<string, Guardada>
    } catch {
      return {}
    }
  },
  guardar: (todo) => {
    try {
      localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(todo))
    } catch {
      /* sin sitio o sin almacén: se queda en memoria */
    }
  },
}

export type Firmador = (rutas: string[], segundos: number) => Promise<{ path?: string | null; signedUrl?: string | null }[] | null | undefined>

function cargarDelMovil(almacen: Almacen, ahora: number): void {
  if (cargadoDelMovil) return
  cargadoDelMovil = true
  for (const [clave, g] of Object.entries(almacen.leer())) if (g && typeof g.url === 'string' && g.hasta - RENOVAR_ANTES_MS > ahora) enMemoria.set(clave, g)
}

function guardarEnElMovil(almacen: Almacen): void {
  const todo = [...enMemoria.entries()].sort((a, b) => b[1].hasta - a[1].hasta).slice(0, MAXIMO_GUARDADAS)
  almacen.guardar(Object.fromEntries(todo))
}

/**
 * Las direcciones firmadas de estas rutas, reutilizando las que aún valen. Solo se pide al servidor de fotos lo que falta (o está a punto de caducar), de una vez. `firmador` es lo que firma de verdad
 * (`supabase.storage.from(bucket).createSignedUrls`). Devuelve ruta → dirección; una ruta que no se pudo firmar no sale.
 */
export async function firmarConCache(bucket: string, rutas: string[], firmador: Firmador, opciones: { ahora?: number; almacen?: Almacen } = {}): Promise<Map<string, string>> {
  const ahora = opciones.ahora ?? Date.now()
  const almacen = opciones.almacen ?? almacenDelMovil
  cargarDelMovil(almacen, ahora)
  const salida = new Map<string, string>()
  const faltan: string[] = []
  for (const ruta of [...new Set(rutas)]) {
    const g = enMemoria.get(`${bucket}/${ruta}`)
    if (g && g.hasta - RENOVAR_ANTES_MS > ahora) salida.set(ruta, g.url)
    else faltan.push(ruta)
  }
  if (faltan.length > 0) {
    const firmadas = await firmador(faltan, SEGUNDOS_FIRMA_LARGA)
    for (const f of firmadas ?? []) {
      if (f.path && f.signedUrl) {
        enMemoria.set(`${bucket}/${f.path}`, { url: f.signedUrl, hasta: ahora + SEGUNDOS_FIRMA_LARGA * 1000 })
        salida.set(f.path, f.signedUrl)
      }
    }
    guardarEnElMovil(almacen)
  }
  return salida
}

/** Una foto que se borra o cambia: su dirección guardada ya no vale. */
export function olvidarUrlFirmada(bucket: string, ruta: string, almacen: Almacen = almacenDelMovil): void {
  if (enMemoria.delete(`${bucket}/${ruta}`)) guardarEnElMovil(almacen)
}

/** Para las pruebas: vacía lo guardado. */
export function olvidarTodasLasUrlsFirmadas(): void {
  enMemoria.clear()
  cargadoDelMovil = false
}
