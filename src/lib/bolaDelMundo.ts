import { create } from 'zustand'
import type { DestinoDelMapa } from './primeraVez'
import type { ResumenViaje } from './viajesPerfil'

/**
 * (V39) LA BOLA DEL MUNDO «¿A DÓNDE TE APETECE IR?» PARA TODOS. Hasta la V38 solo salía en el Perfil del viajero nuevo; ahora sale en el de todos, con las mismas piezas de Design (la bola, la lista por continentes, la tarjeta
 * de destino). Cada destino dice lo suyo, SIN consultas nuevas: sale de lo que el Perfil ya tiene cargado (la respuesta de `GET /api/logros/perfil`, que ahora trae `destinos`, y los viajes de este móvil):
 *   · «Ya has estado»: el destino donde tiene un viaje hecho o algo ganado (el pin lleva un ✓ dorado);
 *   · «Tu viaje · 26–29 nov»: tiene un viaje próximo o en marcha (el pin, destacado);
 *   · los demás listos, como siempre; los «Próximamente», en gris con [Avísame].
 * Pura (sin pantalla) salvo el pequeño almacén que comparte esto con la tarjeta (que se pinta aparte, desde abajo).
 */
export interface NumeroDe {
  n: number
  total: number
}
export interface LoQueLlevas {
  medallas: NumeroDe
  colecciones: NumeroDe
  secretos: NumeroDe
}
/** Lo que manda el servidor de cada destino donde la persona ya ha estado (`GET /api/logros/perfil` › `destinos`). */
export interface DestinoDelPerfil extends LoQueLlevas {
  clave: string
}
export interface EstadoDeDestino {
  /** Ya ha estado (un viaje hecho, o algo ganado en él). */
  estuvo: boolean
  /** Lo que lleva, si el servidor lo sabe (con los logros apagados, no). */
  llevas: LoQueLlevas | null
  /** Su viaje próximo o en marcha a este destino. */
  viaje: { id: string; cuando: string } | null
}

const sinTildes = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** «26 – 29 nov 2026» → «26–29 nov» (sin el año y con el guion pegado, como en la lista de la bola). */
export const cuandoCorto = (cuando: string): string => cuando.replace(/\s+\d{4}$/, '').replace(/\s*[–-]\s*/g, '–').trim()

/** ¿Este viaje va a este destino? Por el nombre de su destino o de alguna de sus ciudades (sin tildes ni mayúsculas). */
export function viajeVaA(v: Pick<ResumenViaje, 'destino' | 'ciudades'>, d: Pick<DestinoDelMapa, 'nombre'>): boolean {
  const nd = sinTildes(d.nombre)
  if (nd.length < 3) return false
  return [v.destino, ...(v.ciudades ?? [])].filter(Boolean).some((n) => {
    const nn = sinTildes(n)
    return nn === nd || (nn.length >= 4 && (nn.startsWith(nd) || nd.startsWith(nn)))
  })
}

/** El estado de cada destino de la bola. Solo salen los que dicen algo (estuvo o tiene viaje). */
export function estadosDeLaBola(destinos: DestinoDelMapa[], viajes: ResumenViaje[], delPerfil: DestinoDelPerfil[] | null | undefined): Record<string, EstadoDeDestino> {
  const salida: Record<string, EstadoDeDestino> = {}
  for (const d of destinos) {
    if (!d.listo) continue
    const p = (delPerfil ?? []).find((x) => x.clave === d.clave) ?? null
    const suyos = viajes.filter((v) => viajeVaA(v, d))
    const hecho = suyos.some((v) => v.fase === 'hecho')
    const proximo = suyos.filter((v) => v.fase === 'proximo').sort((a, b) => (a.inicioIso ?? '').localeCompare(b.inicioIso ?? ''))[0] ?? null
    const estuvo = Boolean(p) || hecho
    if (!estuvo && !proximo) continue
    salida[d.clave] = { estuvo, llevas: p ? { medallas: p.medallas, colecciones: p.colecciones, secretos: p.secretos } : null, viaje: proximo ? { id: proximo.id, cuando: cuandoCorto(proximo.cuando) } : null }
  }
  return salida
}

/** «2 de 4» (lo que lleva) para los números de la tarjeta, con el mismo formato que «Lo que te puedes llevar». */
export const nDeTotal = (x: NumeroDe): string => `${x.n} de ${x.total}`

interface BolaUi {
  porDestino: Record<string, EstadoDeDestino>
  viajes: ResumenViaje[]
  /** Abre el viaje (lo registra la bola del Perfil, que es quien sabe abrirlo). */
  abrirViaje: ((v: ResumenViaje) => void) | null
  poner: (p: { porDestino: Record<string, EstadoDeDestino>; viajes: ResumenViaje[]; abrirViaje: ((v: ResumenViaje) => void) | null }) => void
}
export const useBola = create<BolaUi>((set) => ({ porDestino: {}, viajes: [], abrirViaje: null, poner: (p) => set(p) }))
