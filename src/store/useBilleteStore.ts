import { create } from 'zustand'

/**
 * EL BILLETE DE CADA PERSONA (Tanda 10S5 §4). El código de la tarjeta de embarque, el asiento, el localizador, la terminal y el coche son PRIVADOS: viven solo en el móvil de quien los pone
 * (`localStorage`, por viaje), nunca en la ruta compartida ni en el servidor. Así:
 *   - cada uno ve solo el suyo en un viaje compartido (nadie más recibe su código ni su PDF: ni siquiera se sube);
 *   - se ve SIN INTERNET (en el aeropuerto no hace falta cobertura: se lee del móvil, no de la nube).
 * La ruta guarda solo lo que ya guardaba (horas, aeropuertos, nº de vuelo, compañía): lo que ve todo el grupo. Si algún día hace falta llevarlo a otro móvil, la migración 0070 (privada por persona) queda para entonces.
 */
export type LegDelBillete = 'arrival' | 'departure'

export interface CodigoDelBillete {
  /** El texto que lleva el código (si la app lo ha podido leer), para volver a dibujarlo grande y nítido. */
  texto: string | null
  /** 'qr' | 'aztec' | 'pdf417' | 'datamatrix' | 'code128'... */
  formato: string | null
  /** La imagen del código recortada («data:image/...»), por si no se pudo leer; o la del propio código redibujado. */
  imagen: string | null
  /** El código redibujado por la app (SVG, nítido a cualquier tamaño y sin internet): es lo que se pinta si está; si no, el recorte. */
  dibujo?: string | null
}

export interface BilleteGuardado {
  /** La hora de Roma de esa mitad cuando se guardó: si el viajero quita el vuelo y pone otro, el billete viejo no sale. */
  horaRoma: string | null
  localizador: string | null
  terminal: string | null
  asiento: string | null
  /** Solo tren y autobús. */
  coche: string | null
  codigo: CodigoDelBillete | null
  /** El código IATA del aeropuerto de fuera (BCN), si el billete lo traía: sirve para la hora de ese país al calcular la duración. */
  codigoFuera?: string | null
  /** Quién lo guardó (su id en el viaje), si se sabía: en el mismo móvil con otra persona no se enseña. */
  dueno: string | null
  actualizado: string
}

const PREFIJO = 'trazo:billete:v1'
const MAX_IMAGEN = 900_000

const claveDe = (tripId: string | null) => `${PREFIJO}:${tripId ?? 'local'}`

type Datos = Partial<Record<LegDelBillete, BilleteGuardado>>

function leer(clave: string): Datos {
  try {
    const crudo = window.localStorage.getItem(clave)
    const datos = crudo ? JSON.parse(crudo) : {}
    return datos && typeof datos === 'object' ? (datos as Datos) : {}
  } catch {
    return {}
  }
}

function escribir(clave: string, datos: Datos): boolean {
  try {
    window.localStorage.setItem(clave, JSON.stringify(datos))
    return true
  } catch {
    return false
  }
}

interface BilleteState {
  tripId: string | null
  datos: Datos
  cargar: (tripId: string | null) => void
  poner: (tripId: string | null, kind: LegDelBillete, billete: Omit<BilleteGuardado, 'actualizado'>) => void
  quitar: (tripId: string | null, kind: LegDelBillete) => void
}

export const useBilleteStore = create<BilleteState>((set, get) => ({
  tripId: null,
  datos: leer(claveDe(null)),
  cargar: (tripId) => {
    if (get().tripId === tripId && Object.keys(get().datos).length > 0) return
    set({ tripId, datos: leer(claveDe(tripId)) })
  },
  poner: (tripId, kind, billete) => {
    const previo = get().tripId === tripId ? get().datos : leer(claveDe(tripId))
    const codigo = billete.codigo && billete.codigo.imagen && billete.codigo.imagen.length > MAX_IMAGEN ? { ...billete.codigo, imagen: null } : billete.codigo
    const datos: Datos = { ...previo, [kind]: { ...billete, codigo, actualizado: new Date().toISOString() } }
    set({ tripId, datos })
    escribir(claveDe(tripId), datos)
  },
  quitar: (tripId, kind) => {
    const previo = get().tripId === tripId ? get().datos : leer(claveDe(tripId))
    const datos: Datos = { ...previo }
    delete datos[kind]
    set({ tripId, datos })
    escribir(claveDe(tripId), datos)
  },
}))

/** ¿Hay algo que enseñar en este billete? (alguno de los datos privados o el código). */
export const billeteConAlgo = (b: BilleteGuardado | null | undefined): boolean => Boolean(b && (b.localizador || b.terminal || b.asiento || b.coche || b.codigo))

// Solo desarrollo y pruebas: window.__billete.getState().poner(...) para probar sin PDF.
if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'test')) (window as unknown as { __billete: typeof useBilleteStore }).__billete = useBilleteStore
