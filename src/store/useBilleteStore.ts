import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

/**
 * EL BILLETE DE CADA PERSONA (Tanda 10S5 §4). El código de la tarjeta de embarque, el asiento, el localizador, la terminal y el coche son PRIVADOS: viven solo en el móvil de quien los pone
 * (`localStorage`, por viaje), nunca en la ruta compartida ni en el servidor. Así:
 *   - cada uno ve solo el suyo en un viaje compartido (nadie más recibe su código ni su PDF: ni siquiera se sube);
 *   - se ve SIN INTERNET (en el aeropuerto no hace falta cobertura: se lee del móvil, no de la nube).
 * La ruta guarda solo lo que ya guardaba (horas, aeropuertos, nº de vuelo, compañía): lo que ve todo el grupo.
 * VARIOS MÓVILES DE LA MISMA PERSONA (migración 0070, `billetes_personales`): además del móvil, se guarda una copia en una fila PRIVADA de esa persona (RLS: solo ella la lee; ni el administrador ni otro viajero). El móvil manda
 * mientras no haya conexión y se sincroniza al volver (gana lo último que se cambió, sobre el documento entero). Si la 0070 no está aplicada, el error de la nube se ignora y todo sigue solo en el móvil.
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
/** Cuándo se cambió por última vez el billete de este viaje en este móvil (ms), y si falta subirlo a la nube. */
const claveT = (tripId: string | null) => `${claveDe(tripId)}:t`
const clavePend = (tripId: string | null) => `${claveDe(tripId)}:pend`
const leerNum = (k: string): number => {
  try {
    return Number(window.localStorage.getItem(k)) || 0
  } catch {
    return 0
  }
}
const poner1 = (k: string, v: string | null) => {
  try {
    if (v === null) window.localStorage.removeItem(k)
    else window.localStorage.setItem(k, v)
  } catch {
    // sin almacenamiento
  }
}

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
  /** Lleva la copia de la nube (0070) a este móvil y sube lo que falte. Nunca lanza; sin la 0070 o sin conexión, no hace nada. */
  sincronizar: (tripId: string | null) => Promise<void>
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
    void tocado(tripId, datos)
  },
  quitar: (tripId, kind) => {
    const previo = get().tripId === tripId ? get().datos : leer(claveDe(tripId))
    const datos: Datos = { ...previo }
    delete datos[kind]
    set({ tripId, datos })
    escribir(claveDe(tripId), datos)
    void tocado(tripId, datos)
  },
  sincronizar: async (tripId) => {
    try {
      if (!supabase || !tripId) return
      const { data: u } = await supabase.auth.getUser()
      const uid = u.user?.id
      if (!uid) return
      const { data, error } = await supabase.from('billetes_personales').select('datos, actualizado_en').eq('trip_id', tripId).eq('user_id', uid).maybeSingle()
      if (error) return // sin la 0070 (o sin conexión): se sigue solo con el móvil
      if (useBilleteStore.getState().tripId !== tripId) useBilleteStore.setState({ tripId, datos: leer(claveDe(tripId)) })
      // Solo lo de esta persona: lo que otra persona dejó en este móvil nunca sube a su cuenta.
      const local = delDueno(useBilleteStore.getState().datos, uid)
      const tLocal = leerNum(claveT(tripId))
      const pendiente = (() => {
        try {
          return window.localStorage.getItem(clavePend(tripId)) === '1'
        } catch {
          return false
        }
      })()
      const tNube = data?.actualizado_en ? Date.parse(data.actualizado_en) : 0
      if (data && tNube > tLocal && !pendiente) {
        // La nube es más nueva: se queda lo de la nube (también si ya no hay billete: se quitó en otro móvil).
        const datos = (data.datos && typeof data.datos === 'object' ? data.datos : {}) as Datos
        useBilleteStore.setState({ tripId, datos })
        escribir(claveDe(tripId), datos)
        poner1(claveT(tripId), String(tNube))
      } else if ((!data && Object.keys(local).length > 0) || pendiente || tLocal > tNube) {
        await subir(tripId, local)
      }
    } catch {
      // La nube es un extra: nunca tumba nada.
    }
  },
}))

/** Las entradas de esta persona (las sin dueño se le apuntan); las de otra persona no. */
function delDueno(datos: Datos, uid: string): Datos {
  const salida: Datos = {}
  for (const k of ['arrival', 'departure'] as const) {
    const b = datos[k]
    if (b && (!b.dueno || b.dueno === uid)) salida[k] = { ...b, dueno: uid }
  }
  return salida
}

/** Se apunta el cambio (para saber qué móvil lo tiene más nuevo) y se sube a la nube sin esperar. */
async function tocado(tripId: string | null, datos: Datos) {
  poner1(claveT(tripId), String(Date.now()))
  poner1(clavePend(tripId), '1')
  await subir(tripId, datos)
}

/** Sube el billete a la fila privada de esta persona (0070). Con error (sin la 0070, sin conexión, viaje sin nube) queda pendiente y se reintenta al volver la conexión. */
async function subir(tripId: string | null, datos: Datos) {
  try {
    if (!supabase || !tripId) return
    const { data: u } = await supabase.auth.getUser()
    const uid = u.user?.id
    if (!uid) return
    // Lo guardado sin saber quién era (la lista de gente aún no había cargado) se apunta ahora a esta persona.
    const propios = delDueno(datos, uid)
    if (JSON.stringify(propios) !== JSON.stringify(useBilleteStore.getState().datos) && useBilleteStore.getState().tripId === tripId) {
      useBilleteStore.setState({ datos: propios })
      escribir(claveDe(tripId), propios)
    }
    const t = leerNum(claveT(tripId)) || Date.now()
    const { error } = await supabase.from('billetes_personales').upsert({ trip_id: tripId, user_id: uid, datos: propios, actualizado_en: new Date(t).toISOString() })
    if (error) return
    poner1(clavePend(tripId), null)
  } catch {
    // Pendiente: se sube cuando vuelva la conexión.
  }
}

// Al volver la conexión, lo pendiente sube y se trae lo que haya cambiado en otro móvil.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const t = useBilleteStore.getState().tripId
    if (t) void useBilleteStore.getState().sincronizar(t)
  })
}

/** ¿Hay algo que enseñar en este billete? (alguno de los datos privados o el código). */
export const billeteConAlgo = (b: BilleteGuardado | null | undefined): boolean => Boolean(b && (b.localizador || b.terminal || b.asiento || b.coche || b.codigo))

// Solo desarrollo y pruebas: window.__billete.getState().poner(...) para probar sin PDF.
if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'test')) (window as unknown as { __billete: typeof useBilleteStore }).__billete = useBilleteStore
