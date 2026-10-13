import { create } from 'zustand'
import { fetchDestinationPlaces } from '../lib/destinationPlacesApi'
import { fetchPlaceLikes, togglePlaceLike } from '../lib/placeLikesApi'

/**
 * LA CUENTA ÚNICA DE «ME GUSTA» (Tanda 6y10). Cada sitio tiene UNA cuenta, la misma en toda la app: el corazón de EXPLORAR y el de la ficha leen y escriben aquí, así que enseñan el mismo
 * número y el mismo estado. Si el viajero lo da desde la ficha, sale marcado y sumado en EXPLORAR (y al revés).
 *
 * La cuenta de un sitio = los «me gusta» de PARTIDA (`likes_initial`, de los datos del destino: las redes de Eric, aproximado por debajo del real) + los de los viajeros.
 *   - Los de los viajeros se guardan en la nube con la sesión anónima de siempre (`place_likes`, ver placeLikesApi.ts): sin login, cada dispositivo es un viajero; con cuenta, la misma fila queda en la cuenta.
 *   - Además, lo que ESTE viajero ha marcado se guarda en el propio dispositivo (`trazo:megusta:<destino>`): sin nube (o con la migración sin aplicar) el corazón sigue funcionando y no se pierde.
 *     Al volver la nube, lo que quedó sin subir se sube.
 *   - El total NUNCA cuenta dos veces al mismo viajero: se quita lo que la nube cree de él y se pone lo que él tiene marcado ahora.
 */

export interface CuentaMeGusta {
  /** nombre del sitio → «me gusta» de partida. Los sitios del catálogo del destino salen todos (con 0 si no llevan). Un sitio que no sale no está en el catálogo. */
  inicial: Record<string, number>
  /** nombre → «me gusta» de todos los viajeros en la nube. */
  servidor: Record<string, number>
  /** Los sitios a los que ESTE viajero ya dio «me gusta» según la nube. */
  servidorMios: string[]
  /** Los sitios que ESTE viajero tiene marcados ahora (la verdad que ve la pantalla). */
  mios: string[]
  /** Ya han llegado los datos del destino (si no, el sitio todavía no tiene cuenta que enseñar). */
  cargada: boolean
}

const VACIA: CuentaMeGusta = { inicial: {}, servidor: {}, servidorMios: [], mios: [], cargada: false }

export const claveDeDestino = (destino: string) => destino.trim().toLowerCase()
const CLAVE_LOCAL = (destino: string) => `trazo:megusta:${claveDeDestino(destino)}`

function leerLocales(destino: string): string[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE_LOCAL(destino))
    const lista = crudo ? JSON.parse(crudo) : []
    return Array.isArray(lista) ? lista.filter((nombre): nombre is string => typeof nombre === 'string') : []
  } catch {
    return []
  }
}
function guardarLocales(destino: string, mios: string[]) {
  try {
    window.localStorage.setItem(CLAVE_LOCAL(destino), JSON.stringify(mios))
  } catch {
    /* sin almacenamiento: el «me gusta» vale mientras la pantalla esté abierta */
  }
}

/** La cuenta de un sitio: partida + viajeros (sin contar dos veces al viajero). 0 si el sitio no está. */
export function totalDe(cuenta: CuentaMeGusta | undefined, nombre: string): number {
  if (!cuenta) return 0
  const nube = cuenta.servidor[nombre] ?? 0
  const suyoEnLaNube = cuenta.servidorMios.includes(nombre) ? 1 : 0
  const suyoAhora = cuenta.mios.includes(nombre) ? 1 : 0
  return (cuenta.inicial[nombre] ?? 0) + Math.max(0, nube - suyoEnLaNube) + suyoAhora
}

/** Los totales de TODOS los sitios, para ordenar (EXPLORAR ordena por «me gusta» con la suma). */
export function totalesDe(cuenta: CuentaMeGusta | undefined): Map<string, number> {
  const out = new Map<string, number>()
  if (!cuenta) return out
  for (const nombre of new Set([...Object.keys(cuenta.inicial), ...Object.keys(cuenta.servidor), ...cuenta.mios])) out.set(nombre, totalDe(cuenta, nombre))
  return out
}

interface MeGustaState {
  cuentas: Record<string, CuentaMeGusta>
  cargar: (destino: string) => Promise<void>
  alternar: (destino: string, nombre: string) => Promise<void>
}

const cargando = new Map<string, Promise<void>>()

export const useMeGustaStore = create<MeGustaState>((set, get) => ({
  cuentas: {},

  /** Trae la cuenta del destino (los de partida del catálogo y los de los viajeros). Una vez por destino; pedirlo otra vez no hace nada. */
  cargar: (destino) => {
    const clave = claveDeDestino(destino)
    if (get().cuentas[clave]?.cargada) return Promise.resolve()
    const ya = cargando.get(clave)
    if (ya) return ya
    const peticion = (async () => {
      // 1. Lo de partida (el catálogo) y lo que este viajero tiene guardado en el dispositivo: el corazón ya sale y ya cuenta, sin esperar a la nube.
      const catalogo = await fetchDestinationPlaces(destino)
      const inicial: Record<string, number> = {}
      for (const sitio of catalogo.places) if (sitio.kind === 'place' || sitio.kind === 'restaurant') inicial[sitio.name] = sitio.likes_initial ?? 0
      // Si el catálogo no ha llegado (sin servidor), no se guarda nada: el corazón no sale hasta que haya datos y se vuelve a pedir.
      if (Object.keys(inicial).length === 0) return
      const previa = get().cuentas[clave]
      const mios = [...new Set([...leerLocales(destino), ...(previa?.mios ?? [])])]
      set((state) => ({ cuentas: { ...state.cuentas, [clave]: { inicial, servidor: previa?.servidor ?? {}, servidorMios: previa?.servidorMios ?? [], mios, cargada: true } } }))
      // 2. Los de los demás viajeros (la nube, que puede tardar o no estar): cuando llegan, se suman. Lo que se marcó sin nube y la nube aún no sabe, se sube.
      const likes = await fetchPlaceLikes(destino)
      const servidorMios = [...likes.mine]
      const ahora = get().cuentas[clave]
      set((state) => ({ cuentas: { ...state.cuentas, [clave]: { ...(ahora ?? state.cuentas[clave]), servidor: Object.fromEntries(likes.counts), servidorMios, mios: [...new Set([...(ahora?.mios ?? mios), ...servidorMios])] } } }))
      for (const nombre of get().cuentas[clave].mios) if (!servidorMios.includes(nombre)) void togglePlaceLike(destino, nombre, true)
    })().finally(() => cargando.delete(clave))
    cargando.set(clave, peticion)
    return peticion
  },

  /** Da o quita el «me gusta» de ESTE viajero. Al instante en pantalla; la nube se entera después y, si no puede, queda en el dispositivo. */
  alternar: async (destino, nombre) => {
    const clave = claveDeDestino(destino)
    const cuenta = get().cuentas[clave] ?? VACIA
    const ahora = !cuenta.mios.includes(nombre)
    const mios = ahora ? [...cuenta.mios, nombre] : cuenta.mios.filter((n) => n !== nombre)
    set((state) => ({ cuentas: { ...state.cuentas, [clave]: { ...cuenta, mios } } }))
    guardarLocales(destino, mios)
    const confirmado = await togglePlaceLike(destino, nombre, ahora)
    if (confirmado === null) return
    // La nube lo guardó: se apunta, para que el total siga cuadrando sin volver a pedirlo.
    set((state) => {
      const actual = state.cuentas[clave] ?? cuenta
      const servidorMios = confirmado ? [...new Set([...actual.servidorMios, nombre])] : actual.servidorMios.filter((n) => n !== nombre)
      const nube = Math.max(0, (actual.servidor[nombre] ?? 0) + (confirmado === actual.servidorMios.includes(nombre) ? 0 : confirmado ? 1 : -1))
      return { cuentas: { ...state.cuentas, [clave]: { ...actual, servidor: { ...actual.servidor, [nombre]: nube }, servidorMios } } }
    })
  },
}))
