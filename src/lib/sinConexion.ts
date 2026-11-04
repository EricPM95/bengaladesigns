import { fetchPlaceDetail } from './placeDetailApi'
import { numberedStopsOf } from './stopKind'
import type { TripPayload } from './tripPersistence'
import type { DayPlan, Route } from './types'

/**
 * SIN INTERNET (HOY1, apartado 9; H15 de Design). Lo de hoy queda guardado en el móvil para ver HOY sin cobertura:
 *  - la ruta (el viaje entero, con las reservas y lo ya visto) en IndexedDB, por viaje; al abrir la app sin red, `TripSync` la lee y abre HOY con ella;
 *  - las fichas de las paradas de hoy (con el texto de sus historias, que va dentro de la ficha): las guarda `fetchPlaceDetail` en el móvil, sin caducidad; aquí solo se piden por adelantado;
 *  - los billetes: ya viven en el móvil (`useBilleteStore`, localStorage), no hace falta nada más;
 *  - la propia web (HTML, código, fuentes e iconos): el service worker (`public/sw.js`) la guarda al abrirla con red. Nunca guarda respuestas de `/api/` ni de la nube.
 * Lo que NO funciona sin red (y se dice): mapas, fotos que nunca se vieron, audio de las historias en voz de servidor, avisos del tiempo y cualquier cambio en la nube hasta que vuelva la conexión.
 */
const BASE = 'trazo-hoy-offline'
const TABLA = 'viajes'
/** El tiempo máximo que se guarda un viaje que ya acabó (días desde el último día del viaje). */
export const DIAS_DE_GRACIA = 2

export interface LoDeHoyGuardado {
  /** El viaje (tripId). */
  id: string
  payload: TripPayload
  guardadoEn: string
  /** Primer y último día del viaje (AAAA-MM-DD), para saber si hoy cae dentro. */
  desde: string | null
  hasta: string | null
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

/** Pura: ¿hoy cae dentro del viaje (con unos días de gracia por detrás)? */
export function hoyCaeEnElViaje(desde: string | null, hasta: string | null, hoyIso: string): boolean {
  if (!desde || !hasta) return false
  const mas = (iso: string, dias: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + dias * 86400000).toISOString().slice(0, 10)
  return hoyIso >= desde && hoyIso <= mas(hasta, DIAS_DE_GRACIA)
}

/** Guarda (o actualiza) la ruta del viaje en el móvil. Devuelve false si el móvil no deja. */
export async function guardarLoDeHoy(g: LoDeHoyGuardado): Promise<boolean> {
  const bd = await abrirBase()
  if (!bd) return false
  try {
    return await new Promise<boolean>((resolver) => {
      const tx = bd.transaction(TABLA, 'readwrite')
      tx.objectStore(TABLA).put(g)
      tx.oncomplete = () => resolver(true)
      tx.onerror = () => resolver(false)
      tx.onabort = () => resolver(false)
    })
  } finally {
    bd.close()
  }
}

/** Lo guardado del viaje que contiene hoy (si hay varios, el guardado más reciente). null si no hay. */
export async function leerLoDeHoy(hoyIso: string): Promise<LoDeHoyGuardado | null> {
  const bd = await abrirBase()
  if (!bd) return null
  try {
    const todos = (await envolver(bd.transaction(TABLA, 'readonly').objectStore(TABLA).getAll())) as LoDeHoyGuardado[] | null
    const buenos = (todos ?? []).filter((g) => g?.payload?.route && hoyCaeEnElViaje(g.desde, g.hasta, hoyIso))
    buenos.sort((a, b) => b.guardadoEn.localeCompare(a.guardadoEn))
    return buenos[0] ?? null
  } finally {
    bd.close()
  }
}

/** ¿Hay guardado este viaje (para decir «está guardado en tu móvil» solo cuando es verdad)? */
export async function hayLoDeHoyGuardado(tripId: string): Promise<boolean> {
  const bd = await abrirBase()
  if (!bd) return false
  try {
    return Boolean(await envolver(bd.transaction(TABLA, 'readonly').objectStore(TABLA).get(tripId)))
  } finally {
    bd.close()
  }
}

/** Pide por adelantado las fichas de las paradas del día (cada una queda guardada en el móvil, con su historia). Devuelve cuántas se pudieron guardar. */
export async function guardarFichasDelDia(route: Route, day: DayPlan): Promise<number> {
  let ok = 0
  for (const parada of numberedStopsOf(day)) {
    try {
      const ficha = await fetchPlaceDetail(route.destination, parada.name)
      if (ficha) ok += 1
    } catch {
      /* sin red: se queda lo que ya estuviera */
    }
  }
  return ok
}
