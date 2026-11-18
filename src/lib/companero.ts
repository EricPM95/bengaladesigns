import { create } from 'zustand'
import { datosDeFotoDeLaGaleria, enviarFotoDeGaleria, llamar, llamarCrudo, type RespuestaDeHecho } from './logros'
import { useSyncStore } from '../store/useSyncStore'
import { useRouteStore } from '../store/useRouteStore'
import { alAlbum } from './reclamar'
import { useLogrosStore } from '../store/useLogrosStore'
import { useMomentosUI } from '../components/logros/momentos/useMomentosUI'

/**
 * «YO TAMBIÉN ESTABA» (Tanda V7). En un viaje compartido, lo que un compañero ganó (pedazos y emblemas ocultos de sitios) y yo no, sale como PENDIENTE solo cuando el viaje ya ha terminado
 * (y dentro del plazo de 30 días): durante el viaje, nada. Lo decide el servidor (`GET /api/logros/companero`); aquí solo se pide, se enseña (Y0 a Y5) y se manda [Yo también estaba]
 * (`POST /api/logros/yo-tambien`) o [Subir mi foto] (la galería para ese sitio, con la foto de uno mismo). La foto del compañero NUNCA va a mis recuerdos.
 */
export interface PendienteDeCompanero {
  sitio: string
  nombre: string
  de: string
  de_nombre: string | null
  falta: ('pedazo' | 'emblema')[]
  colecciones: string[]
  emblema: boolean
  foto_url: string | null
  instante: string | null
}

type Abierta = { tipo: 'sitio'; sitio: string } | { tipo: 'lista' } | null

interface Estado {
  tripId: string | null
  pendientes: PendienteDeCompanero[]
  sinPase: boolean
  cargado: boolean
  abierta: Abierta
  error: string | null
  ocupado: boolean
  abrirSitio: (sitio: string) => void
  abrirLista: () => void
  cerrar: () => void
}

export const useCompaneroStore = create<Estado>((set) => ({
  tripId: null,
  pendientes: [],
  sinPase: false,
  cargado: false,
  abierta: null,
  error: null,
  ocupado: false,
  abrirSitio: (sitio) => set({ abierta: { tipo: 'sitio', sitio }, error: null }),
  abrirLista: () => set({ abierta: { tipo: 'lista' }, error: null }),
  cerrar: () => set({ abierta: null, error: null }),
}))

/** El nombre de quien lo ganó: el del perfil; con varios compañeros distintos, «Tus compañeros»; sin nombre, «Tu compañero». */
export function quienEs(p: PendienteDeCompanero[]): string {
  const nombres = [...new Set(p.map((x) => x.de_nombre ?? x.de))]
  if (nombres.length > 1) return 'Tus compañeros'
  return p[0]?.de_nombre ?? 'Tu compañero'
}

/** «Eric consiguió 4 sitios donde estabais juntos» (Y0). */
export function lineaDeLaTarjeta(p: PendienteDeCompanero[]): string {
  const n = p.length
  return `${quienEs(p)} consiguió ${n} ${n === 1 ? 'sitio' : 'sitios'} donde estabais juntos`
}

/** Pide al servidor lo que el compañero ganó y yo no (vacío durante el viaje y fuera del plazo). Con la señal del punto del botón de logros si hay algo. */
/** (V15b) Lo último que mandó la app a `/api/logros/companero` y lo que contestó, tal cual (el panel `?admin=logros` lo enseña): qué viaje mandó (el de la nube y el de la ruta) y qué estado y cuerpo volvieron. */
export const CLAVE_ULTIMO_COMPANERO = 'jutrip.ultimo_companero'

export async function cargarCompanero(tripId: string): Promise<PendienteDeCompanero[]> {
  const cruda = await llamarCrudo(`/api/logros/companero?trip_id=${encodeURIComponent(tripId)}`)
  let r: { ok: boolean; pendientes?: PendienteDeCompanero[]; sin_pase?: boolean } | null = null
  try {
    r = cruda.estado === 200 ? (JSON.parse(cruda.cuerpo) as typeof r) : null
  } catch {
    r = null
  }
  try {
    localStorage.setItem(
      CLAVE_ULTIMO_COMPANERO,
      JSON.stringify({ en: new Date().toISOString(), enviado: tripId, viaje_de_la_nube: useSyncStore.getState().activeTripId, id_de_la_ruta: useRouteStore.getState().route?.id ?? null, estado: cruda.estado, error: cruda.error ?? null, cuerpo: cruda.cuerpo.slice(0, 1500) }),
    )
  } catch {
    /* sin almacenamiento */
  }
  const lista = r?.ok ? (r.pendientes ?? []) : []
  useCompaneroStore.setState({ tripId, pendientes: lista, sinPase: Boolean(r?.sin_pase), cargado: true })
  return lista
}

/** [Yo también estaba] (en un sitio o en todos): gana lo del compañero, con su momento por la fila. */
export async function yoTambienEstaba(tripId: string, sitios: string[] | 'todos'): Promise<void> {
  if (useCompaneroStore.getState().ocupado) return
  useCompaneroStore.setState({ ocupado: true, error: null })
  const r = await llamar<RespuestaDeHecho>('/api/logros/yo-tambien', { cuerpo: { trip_id: tripId, sitios } })
  useCompaneroStore.setState({ ocupado: false })
  if (!r) {
    useCompaneroStore.setState({ error: 'No hemos podido ganarlo ahora. Inténtalo de nuevo en un momento.' })
    return
  }
  if (r.cuenta === false) {
    useCompaneroStore.setState({ error: r.motivo === 'nada_pendiente' ? null : 'Sin el pase no se gana.' })
    if (r.motivo === 'nada_pendiente') await cargarCompanero(tripId)
    return
  }
  useCompaneroStore.getState().cerrar()
  // La hoja de logros se cierra para que los momentos salgan (ocupa su turno de la fila) y se vuelve a abrir al acabar la última animación.
  useMomentosUI.getState().cerrarHojaLogros()
  useMomentosUI.getState().pedirHojaAlFinal()
  useLogrosStore.getState().recibir(r)
  useLogrosStore.getState().ponerPuntito(true)
  await cargarCompanero(tripId)
}

/** [Subir mi foto]: la galería para ese sitio. Si la foto vale, gana el sitio con SU foto (que va a sus recuerdos); si no, el motivo, y puede seguir con [Yo también estaba]. */
export async function subirMiFoto(tripId: string, sitio: string, archivo: File): Promise<void> {
  useCompaneroStore.setState({ ocupado: true, error: null })
  const datos = await datosDeFotoDeLaGaleria(archivo)
  const r = await enviarFotoDeGaleria({ tripId, nombre: '', archivo, sitio })
  useCompaneroStore.setState({ ocupado: false })
  if (!r) {
    useCompaneroStore.setState({ error: 'No hemos podido comprobar la foto ahora. Inténtalo de nuevo o usa [Yo también estaba].' })
    return
  }
  if (r.valida === false) {
    useCompaneroStore.setState({ error: r.mensaje ?? 'Esta foto no vale. Elige otra o usa [Yo también estaba].' })
    return
  }
  void alAlbum(archivo, datos.tomadaEn ? datos.tomadaEn.slice(0, 10) : null)
  useCompaneroStore.getState().cerrar()
  // La hoja de logros se cierra para que los momentos salgan (ocupa su turno de la fila) y se vuelve a abrir al acabar la última animación.
  useMomentosUI.getState().cerrarHojaLogros()
  useMomentosUI.getState().pedirHojaAlFinal()
  useLogrosStore.getState().recibir(r)
  await cargarCompanero(tripId)
}

