import { create } from 'zustand'
import { subirFoto } from './fotosViaje'

/**
 * LA CÁMARA DE VIAJE DE HOY (Tanda HOY1, K1 a K4). Piezas sin pantalla: qué enseña el botón según el momento, el almacén del «pedido de foto» (para que el botón de la cabecera, la tarjeta
 * «Estás en La Graciosa» y la pantalla del juego abran la MISMA cámara) y la cola de fotos sin conexión (la foto se guarda en el móvil y se sube al volver la señal).
 */

export type FaseDelViaje = 'before' | 'during' | 'after' | null

/**
 * Qué hace el botón de la cámara al tocarlo. Se ve SIEMPRE en HOY (antes, durante y después, con y sin pase):
 *   - `sin_pase`: candado y «Solo disponible con el Pase {destino}» + [Ver el pase];
 *   - `antes`: «Podrás usarla durante tu viaje, del … al …» + [Entendido];
 *   - `despues`: lo mismo en pasado, [Entendido] (la cámara de la app solo vale durante el viaje: «desde casa» no cuenta);
 *   - `primera_vez`: la hoja «Tu cámara de viaje» con [Abrir cámara] (solo la primera vez);
 *   - `abrir`: directa a la cámara.
 */
export type ModoDeCamara = 'sin_pase' | 'antes' | 'despues' | 'primera_vez' | 'abrir'

const CLAVE_EXPLICADA = 'trazo:hoy:camara-explicada'

export function camaraExplicada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_EXPLICADA) === '1'
  } catch {
    return true
  }
}
export function marcarCamaraExplicada(): void {
  try {
    window.localStorage.setItem(CLAVE_EXPLICADA, '1')
  } catch {
    /* sin almacenamiento: la hoja saldrá otra vez */
  }
}

export function modoDeCamara(p: { conAcceso: boolean; fase: FaseDelViaje; explicada: boolean }): ModoDeCamara {
  if (!p.conAcceso) return 'sin_pase'
  if (p.fase === 'during') return p.explicada ? 'abrir' : 'primera_vez'
  return p.fase === 'after' ? 'despues' : 'antes'
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const partes = (iso: string) => ({ d: Number(iso.slice(8, 10)), m: Number(iso.slice(5, 7)) - 1 })

/** «del 8 al 13 de noviembre» / «del 30 de octubre al 2 de noviembre» / «el 8 de noviembre» (un solo día). */
export function rangoDelViaje(inicioIso: string | null | undefined, finIso: string | null | undefined): string | null {
  if (!inicioIso || !finIso) return null
  const a = partes(inicioIso)
  const b = partes(finIso)
  if (inicioIso === finIso) return `el ${a.d} de ${MESES[a.m]}`
  return a.m === b.m ? `del ${a.d} al ${b.d} de ${MESES[b.m]}` : `del ${a.d} de ${MESES[a.m]} al ${b.d} de ${MESES[b.m]}`
}

/* ------------------------------------------------------------------ */
/* El pedido de foto                                                   */
/* ------------------------------------------------------------------ */

/** Lo que pide quien abre la cámara: sin sitio (el botón de la cabecera: el servidor mira la ubicación) o con el sitio del que se trata. */
export interface PedidoDeFoto {
  sitio: string | null
  nombre: string | null
  /** La cámara enseña la etiqueta «Emblema Oculto». */
  oculto: boolean
}

interface CamaraViajeState {
  pedido: PedidoDeFoto | null
  /** Abre directamente la cámara (la tarjeta de fuera de ruta y la del juego). */
  abrir: (p?: Partial<PedidoDeFoto>) => void
  limpiar: () => void
}

export const useCamaraViajeStore = create<CamaraViajeState>((set) => ({
  pedido: null,
  abrir: (p = {}) => set({ pedido: { sitio: p.sitio ?? null, nombre: p.nombre ?? null, oculto: p.oculto ?? false } }),
  limpiar: () => set({ pedido: null }),
}))

/* ------------------------------------------------------------------ */
/* Las fotos sin conexión                                              */
/* ------------------------------------------------------------------ */

const BASE = 'trazo-camara-viaje'
const TABLA = 'pendientes'

export interface FotoSinSubir {
  id: string
  tripId: string
  dayId: string
  dayNumber: number
  stopName: string | null
  blob: Blob
}

function abrirBase(): Promise<IDBDatabase | null> {
  return new Promise((resolver) => {
    if (typeof indexedDB === 'undefined') return resolver(null)
    try {
      const pet = indexedDB.open(BASE, 1)
      pet.onupgradeneeded = () => pet.result.createObjectStore(TABLA, { keyPath: 'id' })
      pet.onsuccess = () => resolver(pet.result)
      pet.onerror = () => resolver(null)
    } catch {
      resolver(null)
    }
  })
}

const envolver = <T,>(pet: IDBRequest<T>): Promise<T | null> =>
  new Promise((resolver) => {
    pet.onsuccess = () => resolver(pet.result)
    pet.onerror = () => resolver(null)
  })

/** Guarda la foto en el móvil hasta que se pueda subir al álbum. Devuelve false si el móvil no deja guardarla. */
export async function guardarFotoSinSubir(foto: FotoSinSubir): Promise<boolean> {
  const bd = await abrirBase()
  if (!bd) return false
  try {
    const ok = await new Promise<boolean>((resolver) => {
      const tx = bd.transaction(TABLA, 'readwrite')
      tx.objectStore(TABLA).put(foto)
      tx.oncomplete = () => resolver(true)
      tx.onerror = () => resolver(false)
      tx.onabort = () => resolver(false)
    })
    return ok
  } finally {
    bd.close()
  }
}

export async function fotosSinSubir(): Promise<FotoSinSubir[]> {
  const bd = await abrirBase()
  if (!bd) return []
  try {
    return (await envolver(bd.transaction(TABLA, 'readonly').objectStore(TABLA).getAll())) ?? []
  } finally {
    bd.close()
  }
}

async function quitarFotoSinSubir(id: string): Promise<void> {
  const bd = await abrirBase()
  if (!bd) return
  try {
    await envolver(bd.transaction(TABLA, 'readwrite').objectStore(TABLA).delete(id))
  } finally {
    bd.close()
  }
}

let subiendo = false
let otraVuelta = false
const esperarComo = <T,>(p: Promise<T>, ms: number): Promise<T | 'tarde'> => Promise.race([p, new Promise<'tarde'>((r) => setTimeout(() => r('tarde'), ms))])

/**
 * Sube al álbum las fotos que esperaban (la foto se guarda SIEMPRE primero en el móvil y se quita cuando ya está arriba: si se cierra la app a medias, no se pierde).
 * Las que no salgan (sin conexión, sin cuenta, tarda más de un minuto) se quedan para la próxima. Si alguien pide subir mientras ya se está subiendo, se da otra vuelta al acabar.
 * Devuelve cuántas se subieron.
 */
export async function subirFotosPendientes(): Promise<number> {
  if (subiendo) {
    otraVuelta = true
    return 0
  }
  // Solo desarrollo: `window.__hoy1SinAlbum = true` deja las fotos en el móvil sin subirlas (las pruebas no ensucian el álbum de verdad).
  if (import.meta.env.DEV && (window as unknown as { __hoy1SinAlbum?: boolean }).__hoy1SinAlbum) return 0
  subiendo = true
  let subidas = 0
  try {
    do {
      otraVuelta = false
      for (const f of await fotosSinSubir()) {
        const r = await esperarComo(subirFoto({ tripId: f.tripId, dayId: f.dayId, dayNumber: f.dayNumber, stopName: f.stopName, file: f.blob }).catch(() => ({ foto: null, error: 'sin red' })), 60000)
        if (r !== 'tarde' && r.foto) {
          await quitarFotoSinSubir(f.id)
          subidas++
        }
      }
    } while (otraVuelta)
  } catch {
    /* sin red otra vez: se queda */
  } finally {
    subiendo = false
  }
  return subidas
}

/* ------------------------------------------------------------------ */
/* El camino a Maps                                                    */
/* ------------------------------------------------------------------ */

const esDeApple = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

/** El camino desde donde esté el viajero (sin origen: ambas apps usan su ubicación) hasta un sitio: a pie en Roma, en coche en Lanzarote. Apple Maps en iPhone, Google Maps en el resto. */
export function urlDeCamino(p: { lat: number; lng: number; consulta?: string | null; modo: 'walking' | 'driving' }): string {
  const destino = p.consulta?.trim() ? p.consulta.trim() : `${p.lat},${p.lng}`
  if (esDeApple()) return `https://maps.apple.com/?${new URLSearchParams({ daddr: destino, dirflg: p.modo === 'walking' ? 'w' : 'd' }).toString()}`
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination: destino, travelmode: p.modo }).toString()}`
}
