import { useEffect, useState } from 'react'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { Modal } from '../../ui/Modal'
import { TrazoCard } from './TrazoCards'

/** Una copa, en línea fina. */
const GLASS_ICON = 'M8 3h8l-.8 6.2a3.2 3.2 0 0 1-6.4 0zM12 12.5V20M8.5 21h7'

interface AperitivoCardProps {
  time?: string | null
  title: string
  minutes: number
  /** El barrio del aperitivo ("Trastevere"): de él es la foto al anochecer. */
  barrio?: string | null
  city: string
  suggestions?: { name: string; walkMinutes: number; requiresTicket: boolean }[]
  onPickSuggestion?: (name: string) => void
}

/**
 * El aperitivo antes de cenar, como una tarjeta más (PROMPT_UI_REPASO 13): su franja con la copa, una foto del barrio al
 * anochecer, la hora, el nombre, el tiempo y la etiqueta «Aperitivo». Sin número de orden, como la comida. Las ideas de
 * camino («Plaza Trilussa · 3 min») van dentro de su ficha.
 */
export function AperitivoCard({ time, title, minutes, barrio, city, suggestions = [], onPickSuggestion }: AperitivoCardProps) {
  const [photo, setPhoto] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!barrio) return
    let alive = true
    // (Al anochecer: la misma búsqueda "de noche" que las paradas nocturnas; si no hay, el barrio de día.)
    fetchPlacePhoto(`${barrio} (noche)`, city).then((url) => alive && setPhoto(url))
    return () => {
      alive = false
    }
  }, [barrio, city])

  return (
    <>
      <TrazoCard
        kind="comida"
        variant="sunset"
        time={time}
        name={title}
        meta={[{ icon: 'hour', text: `${minutes} min` }]}
        tags={[{ label: 'Aperitivo', kind: 'comida' }]}
        photoUrl={photo}
        iconPath={GLASS_ICON}
        onOpen={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-text/55">Aperitivo · {minutes} min</p>
          <h2 className="font-display text-[24px] leading-tight text-text">{title}</h2>
          <p className="text-[13.5px] leading-relaxed text-text/70">Antes de cenar: tómate algo y date una vuelta, sin prisa.</p>
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-text/55">De camino</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onPickSuggestion?.(item.name)
                    }}
                    className="rounded-full border border-text/[.12] bg-bg-card px-2.5 py-1 text-[12px] font-medium text-text transition-colors hover:bg-bg-hover"
                  >
                    {item.name} · {item.walkMinutes} min{item.requiresTicket ? ' · entrada' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
