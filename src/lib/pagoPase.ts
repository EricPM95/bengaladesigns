import { formatoImporte } from './dinero'
import { abrirEnlace, llamarServidor } from './servidor'

/**
 * EL PASE EN LA APP (cuentas parte 3, punto 2): la configuración del cobro, las filas de la hoja de compra, crear el pago, saber cuándo llegó el pase y «Mis pases».
 * EL PRECIO LO PONE SIEMPRE EL SERVIDOR: aquí solo se enseñan los precios que el servidor da (data/pase/precios.json) y al pagar solo se manda qué pase y cuántas personas.
 * Sin cobro (sin interruptor o sin claves de Stripe) `configDelPase().cobro` es false y no sale ninguna hoja de compra: todo abierto, como hoy.
 */

export type PlanId = 'uno' | 'duo' | 'grupo'

export interface PlanDePrecios {
  id: PlanId
  nombre: string
  personas?: number
  precio_total?: number
  precio_por_persona?: number
  precio_tachado?: number
  personas_desde?: number
  personas_hasta?: number
}

export interface ConfigPase {
  ok: boolean
  cobro: boolean
  modo: 'stripe' | 'mentira' | null
  moneda?: string
  precios?: { planes: PlanDePrecios[] }
  destinos?: string[]
}

export interface FilaDeCompra {
  plan: PlanId
  nombre: string
  /** «5,50 € cada uno» */
  sub: string
  /** «13,98 €» (tachado) o '' */
  tachado: string
  /** El precio que se enseña a la derecha: el total de ese pase. */
  precio: string
  total: number
}

/** 10,99 → «10,99 €» (con coma, como se escribe en español; el formato es el de siempre, el de dinero.ts). */
export const eur = (valor: number): string => formatoImporte({ amount: Math.round(valor * 100) / 100, currency: 'EUR' })

/** Los límites del Pase Grupo (de data/pase/precios.json: «3 o más», con su máximo de personas). */
export function limitesDelGrupo(planes: PlanDePrecios[]): { desde: number; hasta: number } {
  const g = planes.find((p) => p.id === 'grupo')
  return { desde: g?.personas_desde ?? 3, hasta: g?.personas_hasta ?? 50 }
}

/** El total de un plan (el mismo cálculo que el servidor, solo para enseñarlo: el cobro lo calcula siempre el servidor). Null si no vale. */
export function totalDe(planes: PlanDePrecios[], plan: PlanId, personas: number): number | null {
  const p = planes.find((x) => x.id === plan)
  if (!p) return null
  if (plan === 'uno') return p.precio_total ?? null
  if (plan === 'duo') return p.precio_total ?? null
  const { desde, hasta } = limitesDelGrupo(planes)
  if (!Number.isInteger(personas) || personas < desde || personas > hasta || p.precio_por_persona == null) return null
  return Math.round(p.precio_por_persona * 100 * personas) / 100
}

/** Las tres filas de la hoja de compra, con sus textos. `personasGrupo`: las que lleva el Grupo ahora. */
export function filasDeCompra(planes: PlanDePrecios[], personasGrupo: number): FilaDeCompra[] {
  const { desde } = limitesDelGrupo(planes)
  return planes.map((p) => {
    if (p.id === 'uno') return { plan: p.id, nombre: p.nombre, sub: '', tachado: '', precio: eur(p.precio_total ?? 0), total: p.precio_total ?? 0 }
    if (p.id === 'duo') {
      return { plan: p.id, nombre: `${p.nombre} · 2 personas`, sub: p.precio_por_persona != null ? `${eur(p.precio_por_persona)} cada uno` : '', tachado: p.precio_tachado != null ? eur(p.precio_tachado) : '', precio: eur(p.precio_total ?? 0), total: p.precio_total ?? 0 }
    }
    const total = totalDe(planes, 'grupo', Math.max(personasGrupo, desde)) ?? 0
    return { plan: p.id, nombre: `${p.nombre} · ${desde} o más`, sub: p.precio_por_persona != null ? `${eur(p.precio_por_persona)} cada uno` : '', tachado: '', precio: eur(total), total }
  })
}

/** «Únete a mi Pase de Roma» (lo que se manda al compartir). */
export const textoDeCompartirPase = (destino: string): string => `Únete a mi Pase de ${destino}`

/** «Pase Dúo», «Pase Grupo» o «Pase individual»: el nombre corto del tipo, para las etiquetas. */
export const nombreDelTipo = (tipo: string): string => (tipo === 'duo' ? 'Pase Dúo' : tipo === 'grupo' ? 'Pase Grupo' : 'Pase individual')

/* ------------------------------------------------------------------ */
/* La configuración                                                    */
/* ------------------------------------------------------------------ */

let cache: { en: number; config: ConfigPase } | null = null
const SIN_COBRO: ConfigPase = { ok: true, cobro: false, modo: null }

/** ¿Se cobra? Lo dice el servidor (público). Sin servidor o con un fallo, no: todo abierto. Se recuerda un minuto. */
export async function configDelPase(): Promise<ConfigPase> {
  if (cache && Date.now() - cache.en < 60_000) return cache.config
  const r = await llamarServidor<ConfigPase>('/api/pase/config', { sinCuenta: true })
  const config = r.datos?.ok ? r.datos : SIN_COBRO
  cache = { en: Date.now(), config }
  return config
}
export const olvidarConfigDelPase = (): void => {
  cache = null
}

/* ------------------------------------------------------------------ */
/* Comprar                                                             */
/* ------------------------------------------------------------------ */

export interface RespuestaDeCompra {
  ok?: boolean
  url?: string
  sesion?: string
  error?: string
  ya_tienes?: boolean
}

/** Crea el cobro y devuelve la dirección de la página de pago. Devuelve el error en palabras sencillas si algo falla. */
export async function crearPagoDelPase(p: { destino: string; plan: PlanId; personas?: number; tripId?: string | null }): Promise<{ url: string | null; sesion: string | null; yaTienes: boolean; error: string | null }> {
  const r = await llamarServidor<RespuestaDeCompra>('/api/pago/crear', { metodo: 'POST', cuerpo: { destino: p.destino, plan: p.plan, personas: p.plan === 'grupo' ? p.personas : undefined, trip_id: p.tripId ?? undefined } })
  if (r.datos?.ok && r.datos.url) return { url: r.datos.url, sesion: r.datos.sesion ?? null, yaTienes: false, error: null }
  if (r.datos?.ya_tienes) return { url: null, sesion: null, yaTienes: true, error: r.datos.error ?? 'Ya tienes este pase.' }
  const error = r.estado === 401 || r.estado === 403 ? 'Entra en tu cuenta para comprar el pase.' : r.estado === 0 ? 'No hemos podido conectar. Inténtalo de nuevo.' : (r.datos?.error ?? 'No se ha podido preparar el pago. Inténtalo de nuevo.')
  return { url: null, sesion: null, yaTienes: false, error }
}

export const irAPagar = (url: string): void => abrirEnlace(url)

/* ------------------------------------------------------------------ */
/* Mis pases                                                           */
/* ------------------------------------------------------------------ */

export interface PaseMio {
  id: string
  destino: string
  tipo: PlanId
  estado: 'activo' | 'anulado'
  creado_en: string
  usos_max: number
  usos_usados: number
  es_mio: boolean
  importe_cent?: number | null
  moneda?: string | null
  tiene_recibo: boolean
  viaje: { id: string; destino: string; inicio: string | null; fin: string | null } | null
  miembros: { nombre: string | null; es_yo: boolean; es_comprador: boolean }[]
  invitacion: { id: string; codigo: string; trip_id: string } | null
}

export async function misPases(): Promise<PaseMio[]> {
  const r = await llamarServidor<{ pases: PaseMio[] }>('/api/pases/mios')
  return r.datos?.pases ?? []
}

export async function estadoDelPago(sesion: string): Promise<{ listo: boolean; rechazado: boolean; devuelto: boolean; pase: PaseMio | null }> {
  const r = await llamarServidor<{ listo: boolean; rechazado?: boolean; devuelto?: boolean; pase: PaseMio | null }>(`/api/pago/estado?sesion=${encodeURIComponent(sesion)}`)
  return { listo: Boolean(r.datos?.listo), rechazado: Boolean(r.datos?.rechazado), devuelto: Boolean(r.datos?.devuelto), pase: r.datos?.pase ?? null }
}

/** [Ver recibo]: abre el recibo del servicio de pago en otra pestaña. Devuelve un aviso si no se pudo. */
export async function verRecibo(paseId: string): Promise<string | null> {
  const r = await llamarServidor<{ url?: string; error?: string }>(`/api/pases/recibo?pase=${encodeURIComponent(paseId)}`)
  if (r.datos?.url) {
    abrirEnlace(r.datos.url, { nuevaPestana: true })
    return null
  }
  return r.datos?.error ?? 'El recibo todavía no está disponible. Inténtalo en un momento.'
}

/** Pura: «el pase ya está» al volver del pago. La dirección trae `?pago=ok&sesion=…`. */
export function pagoDeLaDireccion(busqueda: string): { resultado: 'ok' | 'cancelado' | 'mentira'; sesion: string | null } | null {
  const p = new URLSearchParams(busqueda)
  const r = p.get('pago')
  if (r !== 'ok' && r !== 'cancelado' && r !== 'mentira') return null
  return { resultado: r, sesion: p.get('sesion') }
}
