import { useEffect, useState } from 'react'

/**
 * Los tips del viaje (la bombilla de la cabecera, PROMPT_UI_REPASO_2 3): los de cada destino, de
 * data/dias/<destino>/_tips.json, servidos por /api/destination-tips. De 5 a 8, en su orden.
 */

export type TipLabel = 'dinero' | 'tiempo' | 'mal_rato'

export interface DestinationTip {
  orden: number
  etiqueta: TipLabel
  titulo: string
  texto: string
  /** 'entradas': lleva el enlace «Ver entradas de tu viaje ›». */
  enlace?: 'entradas'
  fuente?: string
  comprobado?: string
}

export interface DestinationTips {
  /** El gentilicio de la cabecera: «8 cosas que un romano te diría». */
  local: string | null
  tips: DestinationTip[]
}

/** La etiqueta de cada tip: su texto y su color (verde, azul o terracota). */
export const TIP_LABELS: Record<TipLabel, { text: string; color: string; soft: string }> = {
  dinero: { text: 'Ahorras dinero', color: '#3E7A4F', soft: 'rgba(62,122,79,.12)' },
  tiempo: { text: 'Ahorras tiempo', color: '#3B6A9E', soft: 'rgba(59,106,158,.12)' },
  mal_rato: { text: 'Te evitas un mal rato', color: '#C0573A', soft: 'rgba(192,87,58,.12)' },
}

const cache = new Map<string, DestinationTips | null>()

/** Los tips del destino; `undefined` mientras cargan, `null` si el destino no tiene. */
export function useDestinationTips(destination: string | null | undefined, enabled: boolean): DestinationTips | null | undefined {
  const key = (destination ?? '').trim().toLowerCase()
  const [tips, setTips] = useState<DestinationTips | null | undefined>(() => (cache.has(key) ? cache.get(key) : undefined))
  useEffect(() => {
    if (!enabled || !key) return
    if (cache.has(key)) {
      setTips(cache.get(key))
      return
    }
    let alive = true
    fetch('/api/destination-tips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination }) })
      .then((response) => (response.ok ? response.json() : { tips: null }))
      .then((body: { tips: DestinationTips | null }) => body.tips ?? null)
      .catch(() => null)
      .then((value) => {
        cache.set(key, value)
        if (alive) setTips(value)
      })
    return () => {
      alive = false
    }
  }, [key, enabled, destination])
  return tips
}
