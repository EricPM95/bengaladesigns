import { create } from 'zustand'
import { franjaDe, type AvisoDeCuenta, type DatosDeFranja } from '../lib/avisos'
import { sonar } from '../lib/sonidos'

/**
 * LA FRANJA DE AVISO NUEVO (Tanda 10N4 §4b, Design `Piezas/Avisos Franja`, la 11). La franja oscura que sale arriba un par de segundos y se va sola con CUALQUIER aviso nuevo que llegue
 * con la app abierta; además el aviso se queda siempre en la campana. Una sola pieza para todos: los avisos de la cuenta (permisos, propuestas, gastos, cambios del viaje, entradas, sorteo…) y
 * las líneas de la propia app («Ya no formas parte de este viaje»). Varios a la vez: una sola franja («3 avisos nuevos») y UN solo sonido (la campanita, con el ajuste «Sonido de los momentos»).
 */
export interface ItemDeFranja extends DatosDeFranja {
  id: string
  /** Su nombre de pila (para «Eric, Ana y Laura» y la inicial de la moneda); null si avisa la app. */
  quien: string | null
  /** El aviso de la campana al que lleva al tocar la franja; sin él, solo se cierra. */
  aviso?: AvisoDeCuenta
  /** Para quitar los duplicados con otras franjas (el gasto que ya anunció su propio sitio). */
  clave?: string
}

export interface FranjaActual {
  /** Cambia con cada cosa nueva: la pantalla reinicia el temporizador. */
  n: number
  items: ItemDeFranja[]
  /** Cuándo salió la franja (los avisos que llegan en el mismo momento se juntan en ella; los que llegan después la sustituyen). */
  desde: number
}

interface FranjaState {
  franja: FranjaActual | null
  mostrar: (items: ItemDeFranja[]) => void
  cerrar: () => void
}

/** Un aviso solo sale en la franja si se acaba de crear (no los de hace horas que aparecen al volver a la app). */
const MAX_EDAD_MS = 20 * 60 * 1000
/** Un solo sonido aunque lleguen varios avisos casi a la vez (la franja y la campana, o dos avisos seguidos). */
// (10N10) Antes 2,5 s: dos avisos distintos con segundos de diferencia (quitar el Free Tour y luego otro cambio) se quedaban sin sonido el segundo. Ahora solo se evita el doble sonido del MISMO momento.
const SEPARACION_SONIDO_MS = 900
const JUNTAR_MS = 1500
/** Los avisos que ya salieron en la franja: aunque la lista los pierda y los recupere (eliminar y deshacer), no vuelven a salir. */
const yaSalieron = new Set<string>()
let ultimoSonido = 0
let contador = 0
/** Cuántos avisos de la campana (no las líneas de la app) han salido en la franja desde que se abrió la app. */
let anunciadosEnTotal = 0
export const avisosAnunciados = (): number => anunciadosEnTotal

/** Pura: de la lista nueva, los avisos que no estaban en la anterior, sin leer y recientes. */
export function avisosNuevos(antes: AvisoDeCuenta[], despues: AvisoDeCuenta[], ahora: number = Date.now()): AvisoDeCuenta[] {
  const conocidos = new Set(antes.map((a) => a.id))
  return despues.filter((a) => !conocidos.has(a.id) && !a.leido && !a.etiqueta && ahora - Date.parse(a.creado_en) <= MAX_EDAD_MS)
}

/** Los avisos que la propia app también dice con una línea (ver CompartidoHost) llevan la misma clave, para que no salgan dos veces. */
const claveDe = (aviso: AvisoDeCuenta): string | undefined => (aviso.tipo === 'gasto_resuelto' && aviso.payload.gasto_id ? `gasto:${String(aviso.payload.gasto_id)}` : aviso.tipo === 'quitado' ? `quitado:${String(aviso.payload.trip_id ?? '')}` : undefined)

export const itemDeAviso = (aviso: AvisoDeCuenta): ItemDeFranja => ({ ...franjaDe(aviso), id: aviso.id, quien: aviso.quien, aviso, clave: claveDe(aviso) })

export const useFranjaStore = create<FranjaState>((set, get) => ({
  franja: null,
  mostrar: (items) => {
    const ahora = Date.now()
    // Los que llegan casi a la vez se juntan en una franja («3 avisos nuevos»); uno que llega cuando la anterior ya se estaba leyendo la sustituye.
    const actual = get().franja && ahora - get().franja!.desde < JUNTAR_MS ? get().franja : null
    const conocidos = new Set(actual?.items.map((i) => i.id) ?? [])
    const claves = new Set(actual?.items.map((i) => i.clave).filter(Boolean) ?? [])
    const nuevos = items.filter((i) => !conocidos.has(i.id) && !yaSalieron.has(i.id) && !(i.clave && claves.has(i.clave)))
    for (const i of nuevos) yaSalieron.add(i.id)
    anunciadosEnTotal += nuevos.filter((i) => i.aviso).length
    if (nuevos.length === 0) return
    set({ franja: { n: ++contador, items: [...(actual?.items ?? []), ...nuevos], desde: actual?.desde ?? ahora } })
    if (ahora - ultimoSonido > SEPARACION_SONIDO_MS) {
      ultimoSonido = ahora
      void sonar('aviso')
    }
  },
  cerrar: () => set({ franja: null }),
}))

/**
 * Lo llama el almacén de avisos cada vez que llega una lista: si hay avisos que no estaban (y la lista anterior ya era de verdad, no la primera carga), sale la franja.
 * `escondidos`: los que esta persona ha eliminado de su campana, que no salen.
 */
export function anunciarAvisosNuevos(antes: AvisoDeCuenta[], despues: AvisoDeCuenta[], escondidos: string[] = []) {
  const nuevos = avisosNuevos(antes, despues).filter((a) => !escondidos.includes(a.id))
  if (nuevos.length > 0) useFranjaStore.getState().mostrar(nuevos.map(itemDeAviso))
}

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __franja: typeof useFranjaStore }).__franja = useFranjaStore
