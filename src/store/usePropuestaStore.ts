import { create } from 'zustand'
import { ajustarPropuestaAlViaje, cambiosDeLaPropuesta, cambiosDeUnaPropuesta, construirPropuesta, deshacerCambio, esUnaPropuesta, type CambioPropuesto } from '../lib/propuesta'
import { mandarAvisosPendientes } from '../lib/permisoAvisos'
import { recomendar } from '../lib/recomendacionesViaje'
import type { Route } from '../lib/types'
import { alHidratarViaje, useRouteStore } from './useRouteStore'
import { useSyncStore } from './useSyncStore'
import { useViajeCompartido } from './useViajeCompartido'

/**
 * LA PROPUESTA DE QUIEN SOLO RECOMIENDA (Tanda 10N, apartado 6; rehecha: antes era el «modo recomendación» con su barra y su botón [Recomendar otra ruta]).
 *   · Quien solo recomienda cambia la ruta DIRECTAMENTE en DÍAS, EXPLORAR, las fichas y «+ Añadir parada», como si fuera suya. Eso cambia la ruta de SU teléfono (nunca se guarda en el viaje: la base de datos
 *     solo deja escribir al administrador y a quien puede editar) y cada cambio es un cambio de su propuesta.
 *   · `base` = la ruta del administrador tal como la tiene (no se toca). Los cambios NO se guardan paso a paso: se calculan comparando `base` con la ruta de ahora (`cambiosDeLaPropuesta`), y por eso la lista
 *     siempre enseña cómo QUEDAN las cosas al final.
 *   · Mientras no se envía, la propuesta se guarda en este teléfono (por viaje) para que no se pierda al cerrar la app.
 *   · Al enviar se manda UNA recomendación con todos los cambios; queda fija (el administrador decide uno por uno) y lo que cambie después empieza otra propuesta.
 *   · Cuando cambia la ruta del administrador (`alLlegarElViaje`, desde `hydrateTrip`), la propuesta se ajusta a la ruta nueva: lo que ya no tiene sentido sale marcado (`sinSentido`).
 * `activa` la pone el anfitrión: solo para quien solo recomienda, con las cuentas encendidas y antes de que empiece el viaje.
 */
export type HojaDePropuesta = { modo: 'mia' } | { modo: 'enviada'; recId: string } | null

interface PropuestaState {
  activa: boolean
  tripId: string | null
  base: Route | null
  /** Los cambios que ya no tienen sentido (el administrador cambió ese día): marcados, se pueden quitar. */
  sinSentido: CambioPropuesto[]
  /** La hoja de la propuesta abierta (la mía sin enviar, o una ya enviada). */
  verAbierto: boolean
  hoja: HojaDePropuesta
  /** El cambio abierto en el detalle (id) y de dónde sale. */
  detalle: { id: string; recId: string | null } | null
  /** RSent: «Se lo hemos mandado a …». */
  enviada: boolean
  enviando: boolean
  error: string | null
  activar: (tripId: string, rutaDelAdministrador: Route) => Promise<void>
  /** Sale del modo y, si `descartar`, devuelve la ruta del administrador (descarta los cambios que no se enviaron). */
  desactivar: (descartar?: boolean) => void
  /** Ha llegado la ruta nueva del administrador (está ya en el almacén de la ruta): la propuesta se ajusta a ella. */
  alLlegarElViaje: () => Promise<void>
  deshacer: (cambio: CambioPropuesto) => void
  quitarSinSentido: (id: string) => void
  verLista: (abierta: boolean) => void
  abrirHoja: (hoja: HojaDePropuesta) => void
  verDetalle: (id: string | null, recId?: string | null) => void
  enviar: () => Promise<boolean>
  cerrarEnviada: () => void
}

const copia = (route: Route): Route => JSON.parse(JSON.stringify(route)) as Route

/* ───────────── Lo guardado en este teléfono ───────────── */
const clave = (tripId: string) => `trazo:propuesta:${tripId}`
const claveProcesadas = (tripId: string) => `trazo:propuesta-procesada:${tripId}`

function leerGuardado(tripId: string): { cambios: CambioPropuesto[]; sinSentido: CambioPropuesto[] } | null {
  try {
    const t = window.localStorage.getItem(clave(tripId))
    return t ? (JSON.parse(t) as { cambios: CambioPropuesto[]; sinSentido: CambioPropuesto[] }) : null
  } catch {
    return null
  }
}
function escribirGuardado(tripId: string, cambios: CambioPropuesto[], sinSentido: CambioPropuesto[]) {
  try {
    if (cambios.length === 0 && sinSentido.length === 0) window.localStorage.removeItem(clave(tripId))
    else window.localStorage.setItem(clave(tripId), JSON.stringify({ cambios, sinSentido }))
  } catch {
    /* sin almacenamiento: la propuesta vive mientras la app esté abierta */
  }
}
function leerProcesadas(tripId: string): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(claveProcesadas(tripId)) ?? '[]') as string[]
  } catch {
    return []
  }
}
function escribirProcesadas(tripId: string, lista: string[]) {
  try {
    window.localStorage.setItem(claveProcesadas(tripId), JSON.stringify(lista.slice(-200)))
  } catch {
    /* sin almacenamiento */
  }
}

/** Quién soy (para saber cuáles de las propuestas enviadas son mías). */
const yoId = () => useSyncStore.getState().travelerId ?? null

/**
 * Las propuestas mías que el administrador ya ha decidido y esta app aún no ha tratado: lo ACEPTADO ya está (o estará) en la ruta del administrador y lo RECHAZADO se quita de mi ruta. Devuelve los ids
 * de los cambios decididos para sacarlos de la propuesta local, y marca como tratados esos (`recId:cambioId`).
 */
function decididasSinTratar(tripId: string): { aceptados: Set<string>; rechazados: Set<string> } {
  const aceptados = new Set<string>()
  const rechazados = new Set<string>()
  const procesadas = new Set(leerProcesadas(tripId))
  const yo = yoId()
  for (const rec of useViajeCompartido.getState().recomendaciones) {
    if (!esUnaPropuesta(rec.payload) || (yo != null && rec.authorId !== yo)) continue
    for (const c of cambiosDeUnaPropuesta(rec.payload)) {
      const d = rec.decisiones?.[c.id]
      if (!d || procesadas.has(`${rec.id}:${c.id}`)) continue
      if (d === 'aceptado') aceptados.add(c.id)
      else rechazados.add(c.id)
      procesadas.add(`${rec.id}:${c.id}`)
    }
  }
  escribirProcesadas(tripId, [...procesadas])
  return { aceptados, rechazados }
}

let temporizador: ReturnType<typeof setTimeout> | null = null
let aplicando = false
/** La ruta de este teléfono justo ANTES del último cambio de ruta que no hizo la propuesta (cuando llega la ruta nueva del administrador, es la que llevaba los cambios de quien propone). */
let rutaLocalPrevia: Route | null = null

export const usePropuestaStore = create<PropuestaState>((set, get) => ({
  activa: false,
  tripId: null,
  base: null,
  sinSentido: [],
  verAbierto: false,
  hoja: null,
  detalle: null,
  enviada: false,
  enviando: false,
  error: null,
  activar: async (tripId, rutaDelAdministrador) => {
    if (get().activa && get().tripId === tripId && get().base) return
    const base = copia(rutaDelAdministrador)
    set({ activa: true, tripId, base, sinSentido: [], verAbierto: false, hoja: null, detalle: null, enviada: false, error: null })
    const guardado = leerGuardado(tripId)
    if (!guardado || (guardado.cambios.length === 0 && guardado.sinSentido.length === 0)) return
    // Lo que el administrador ya decidió mientras tanto no se vuelve a poner.
    await useViajeCompartido.getState().cargar(tripId).catch(() => undefined)
    if (get().tripId !== tripId) return
    const { aceptados, rechazados } = decididasSinTratar(tripId)
    const cambios = guardado.cambios.filter((c) => !aceptados.has(c.id) && !rechazados.has(c.id))
    const r = ajustarPropuestaAlViaje({ cambios }, base)
    aplicando = true
    useRouteStore.setState({ route: r.ruta })
    aplicando = false
    set({ sinSentido: [...guardado.sinSentido, ...r.sinSentido] })
  },
  desactivar: (descartar = false) => {
    const { base, tripId } = get()
    if (descartar && base) {
      aplicando = true
      useRouteStore.setState({ route: copia(base) })
      aplicando = false
      if (tripId) escribirGuardado(tripId, [], [])
    }
    set({ activa: false, tripId: descartar ? null : get().tripId, base: descartar ? null : base, sinSentido: [], verAbierto: false, hoja: null, detalle: null, error: null })
  },
  alLlegarElViaje: async () => {
    const { activa, tripId, base } = get()
    const route = useRouteStore.getState().route
    if (!activa || !tripId || !route) return
    if (useSyncStore.getState().activeTripId && useSyncStore.getState().activeTripId !== tripId) {
      // Se ha abierto OTRO viaje: este modo se apaga (el anfitrión lo vuelve a encender para el nuevo).
      set({ activa: false, base: null, sinSentido: [], verAbierto: false, hoja: null, detalle: null })
      return
    }
    const rutaNueva = copia(route)
    // Lo que tenía puesto quien propone: la ruta de ANTES de que llegara la nueva (el almacén ya tiene la del administrador) comparada con la base de antes.
    const previos = base && rutaLocalPrevia ? cambiosDeLaPropuesta(base, rutaLocalPrevia) : (leerGuardado(tripId)?.cambios ?? [])
    await useViajeCompartido.getState().cargar(tripId).catch(() => undefined)
    const { aceptados, rechazados } = decididasSinTratar(tripId)
    const cambios = previos.filter((c) => !aceptados.has(c.id) && !rechazados.has(c.id))
    const r = ajustarPropuestaAlViaje({ cambios }, rutaNueva)
    aplicando = true
    useRouteStore.setState({ route: r.ruta })
    aplicando = false
    set({ base: rutaNueva, sinSentido: [...get().sinSentido.filter((s) => !cambios.some((c) => c.id === s.id)), ...r.sinSentido] })
    escribirGuardado(tripId, r.cambios, get().sinSentido)
  },
  deshacer: (cambio) => {
    const { base } = get()
    const route = useRouteStore.getState().route
    if (!base || !route) return
    const nueva = deshacerCambio(route, base, cambio)
    useRouteStore.setState({ route: nueva })
    // Las horas de los días tocados se vuelven a repartir por posición, como al mover una parada.
    const store = useRouteStore.getState()
    for (const d of nueva.days) if (d.id === cambio.dayId || d.id === cambio.desdeDayId) store.reorderStops(d.id, d.stops.map((s) => s.id))
  },
  quitarSinSentido: (id) => {
    const { sinSentido, tripId } = get()
    const resto = sinSentido.filter((c) => c.id !== id)
    set({ sinSentido: resto })
    const route = useRouteStore.getState().route
    const base = get().base
    if (tripId && base && route) escribirGuardado(tripId, cambiosDeLaPropuesta(base, route), resto)
  },
  verLista: (abierta) => set({ verAbierto: abierta, hoja: abierta ? get().hoja ?? { modo: 'mia' } : null, detalle: abierta ? get().detalle : null }),
  abrirHoja: (hoja) => set({ hoja, verAbierto: hoja != null, detalle: null }),
  verDetalle: (id, recId = null) => set({ detalle: id ? { id, recId } : null }),
  enviar: async () => {
    const { base } = get()
    const route = useRouteStore.getState().route
    const tripId = useSyncStore.getState().activeTripId
    if (!base || !route || !tripId) return false
    const sin = enviadosPendientesIds()
    const nuevos = cambiosDeLaPropuesta(base, route).filter((c) => !sin.has(`${c.id}|${c.texto}`))
    const paquete = construirPropuesta(base, route, nuevos)
    if (!paquete) {
      set({ error: 'Todavía no has cambiado nada.' })
      return false
    }
    set({ enviando: true, error: null })
    const error = await recomendar(tripId, paquete.tipo, paquete.payload)
    if (error) {
      set({ enviando: false, error })
      return false
    }
    // Mandada: el servidor avisa a la otra persona (campanita y móvil). Queda fija; lo siguiente es otra propuesta.
    mandarAvisosPendientes()
    await useViajeCompartido.getState().cargar(tripId).catch(() => undefined)
    set({ enviando: false, verAbierto: false, hoja: null, detalle: null, enviada: true, error: null })
    return true
  },
  cerrarEnviada: () => set({ enviada: false }),
}))

/** Las propuestas mías aún sin decidir: `id|texto` de cada cambio que sigue esperando respuesta (esos ya no cuentan como «sin enviar»). */
export function enviadosPendientesIds(): Set<string> {
  const salida = new Set<string>()
  const yo = yoId()
  for (const rec of useViajeCompartido.getState().recomendaciones) {
    if (rec.estado !== 'pendiente' || !esUnaPropuesta(rec.payload) || (yo != null && rec.authorId !== yo)) continue
    for (const c of cambiosDeUnaPropuesta(rec.payload)) if (!rec.decisiones?.[c.id]) salida.add(`${c.id}|${c.texto}`)
  }
  return salida
}

// Mientras la propuesta está activa, cada cambio de la ruta se guarda en este teléfono (con una pausa corta, para no guardar a cada pulsación).
useRouteStore.subscribe((estado, previo) => {
  if (aplicando || estado.route === previo.route) return
  rutaLocalPrevia = previo.route
  const { activa, tripId, base, sinSentido } = usePropuestaStore.getState()
  if (!activa || !tripId || !base || !estado.route) return
  if (temporizador != null) clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    temporizador = null
    const ahora = useRouteStore.getState().route
    const s = usePropuestaStore.getState()
    if (s.activa && s.tripId === tripId && s.base && ahora) escribirGuardado(tripId, cambiosDeLaPropuesta(s.base, ahora), s.sinSentido.length ? s.sinSentido : sinSentido)
  }, 300)
})

alHidratarViaje.fn = () => void usePropuestaStore.getState().alLlegarElViaje()

// Solo desarrollo: para ver o cambiar el estado desde la consola o las pruebas.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __propuesta: typeof usePropuestaStore }).__propuesta = usePropuestaStore
