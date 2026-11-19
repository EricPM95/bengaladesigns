import { useEffect, useState } from 'react'
import type { Excursion } from './types'

/**
 * (V27) LOS DATOS DE LAS EXCURSIONES, para completar las de los viajes YA guardados. Un viaje a Lanzarote guardado antes de que los datos trajeran la ficha de Civitatis lleva en cada excursión solo el nombre
 * (foto vacía, precio 0, sin nota): el bloque de «La Graciosa» salía con el degradado vacío. `public/datos/excursiones.json` (lo genera `scripts/destino/generarExcursionesPublicas.mjs` desde nuestros datos) tiene,
 * por id de excursión, la foto, el «desde», la nota, las opiniones y la cancelación REALES, más la foto propia de respaldo. Aquí se rellena SOLO lo que falte; nunca se pisa un dato que el viaje ya trae, y nunca se inventa.
 */
export interface DatosDeExcursion {
  price?: number | null
  rating?: number | null
  ratingMax?: 5 | 10
  reviewCount?: number | null
  cancellation?: 'gratuita' | 'no_reembolsable' | null
  durationText?: string | null
  bookUrl?: string | null
  photoUrl?: string | null
  photoUrlBig?: string | null
  incluye?: string | null
  recogida?: string | null
  /** Nuestra foto del sitio (`public/fotos/…`): la de respaldo si el operador no tiene. */
  fotoPropia?: string | null
}

let cache: Record<string, DatosDeExcursion> | null = null
let pidiendo: Promise<Record<string, DatosDeExcursion>> | null = null

export function cargarDatosDeExcursiones(): Promise<Record<string, DatosDeExcursion>> {
  if (cache) return Promise.resolve(cache)
  pidiendo ??= fetch('/datos/excursiones.json')
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, DatosDeExcursion>>) : {}))
    .catch(() => ({}))
    .then((d) => {
      cache = d
      return d
    })
  return pidiendo
}

/** Pura: la excursión con lo que le falte puesto desde los datos. La foto: la del viaje, la del operador, o la nuestra; nunca ninguna. */
export function completarExcursion(e: Excursion, datos: Record<string, DatosDeExcursion> | null): Excursion {
  const d = datos?.[e.id]
  if (!d) return e
  const foto = e.photoUrlBig || e.photoUrl || d.photoUrlBig || d.photoUrl || d.fotoPropia || null
  return {
    ...e,
    price: e.price > 0 ? e.price : (d.price ?? e.price),
    rating: e.rating ?? d.rating ?? undefined,
    ratingMax: e.rating != null ? e.ratingMax : (d.ratingMax ?? e.ratingMax),
    reviewCount: e.reviewCount ?? d.reviewCount ?? undefined,
    cancellation: e.cancellation ?? d.cancellation ?? null,
    durationText: e.durationText ?? d.durationText ?? null,
    bookUrl: e.bookUrl && !/\/buscar\?q=/.test(e.bookUrl) ? e.bookUrl : (d.bookUrl ?? e.bookUrl),
    incluye: e.incluye ?? d.incluye ?? null,
    recogida: e.recogida ?? d.recogida ?? null,
    photoUrl: e.photoUrl || foto,
    photoUrlBig: e.photoUrlBig || foto,
    // El «desde» de nuestros datos es orientativo: se dice.
    priceOrientativo: e.price > 0 ? e.priceOrientativo : (d.price ? true : e.priceOrientativo),
  }
}

/** Las excursiones completadas; mientras llegan los datos, tal cual. */
export function useExcursionesCompletas(lista: Excursion[]): Excursion[] {
  const [datos, setDatos] = useState<Record<string, DatosDeExcursion> | null>(cache)
  useEffect(() => {
    if (cache) return undefined
    let vivo = true
    void cargarDatosDeExcursiones().then((d) => vivo && setDatos(d))
    return () => {
      vivo = false
    }
  }, [])
  return lista.map((e) => completarExcursion(e, datos))
}
