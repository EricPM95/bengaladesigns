import { useEffect, useState } from 'react'
import { prepararTierra, type Tierra } from './proyeccion'
import { buscar } from '../../../../lib/busqueda'

/** Un país del catálogo (data/logros/paises_mundo.json): iso en minúsculas, nombre en español, continente, centro y si es tan pequeño que no sale en el mapa (p = 1). */
export interface Pais {
  i: string
  n: string
  c: string
  lat: number
  lng: number
  p: 0 | 1
}

export const sinTildes = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

let catalogo: Promise<Pais[]> | null = null
let tierra: Promise<Tierra> | null = null

/** El catálogo de países: se baja solo al abrir estas pantallas (va en su propio trozo, aparte del resto de la app). */
export function cargarPaises(): Promise<Pais[]> {
  catalogo ??= import('../../../../../data/logros/paises_mundo.json').then((m) => m.default as Pais[])
  return catalogo
}

/** Las costas del globo (84 KB aparte), ya preparadas para girar. */
export function cargarTierra(): Promise<Tierra> {
  tierra ??= import('./tierra110.json').then((m) => prepararTierra(m.default as unknown as Record<string, number[][]>))
  return tierra
}

export function usePaisesYTierra(): { paises: Pais[] | null; tierra: Tierra | null } {
  const [paises, setPaises] = useState<Pais[] | null>(null)
  const [t, setT] = useState<Tierra | null>(null)
  useEffect(() => {
    let vivo = true
    void cargarPaises().then((p) => vivo && setPaises(p))
    void cargarTierra().then((x) => vivo && setT(x))
    return () => {
      vivo = false
    }
  }, [])
  return { paises, tierra: t }
}

/** Buscar sin tildes ni mayúsculas. */
export const buscarPaises = (lista: Pais[], q: string): Pais[] => {
  const k = sinTildes(q)
  return k ? buscar(lista, q, (p) => [p.n], { max: lista.length, minimoDeLetras: 1 }) : lista
}

export const reducirMovimiento = (): boolean => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
