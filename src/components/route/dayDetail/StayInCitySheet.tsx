import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StayInCity } from '../../../lib/types'
import { fetchPlacePhotoDetail } from '../../../lib/placePhoto'

/**
 * «Prefiero quedarme en Roma» (Tanda 3, días de excursión de 5 y 6 días): una pantalla como una alerta, pero bonita. Enseña las paradas emblemáticas del día que se pondría en
 * lugar de la excursión —solo las conocidas, sin horas, con su foto; lo de camino o lo menos famoso saldrá luego en la ruta, con sus horas— y debajo dos botones:
 *   · «Organízame este día»: el día se rellena solo con la ruta escrita (D6 en 5 días, D7 en 6).
 *   · «Prefiero crear mi propio día»: el día se queda en blanco, con «Añadir parada».
 * Sin foto del sitio, un recuadro neutro con su nombre: nunca una foto que no sea del sitio.
 */

/** La foto pequeña de un sitio (la propia del destino si la hay), o null: entonces, el recuadro neutro. */
function usePlacePhoto(name: string, city: string): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    fetchPlacePhotoDetail(name, city)
      .then((photo) => {
        if (alive) setUrl(photo?.small ?? null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [name, city])
  return url
}

function StopRow({ name, photoName, city }: { name: string; photoName: string; city: string }) {
  const photo = usePlacePhoto(photoName, city)
  return (
    <li className="flex items-center gap-3.5">
      <span className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-bg-hover">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          // Sin foto de verdad: el recuadro neutro con el nombre del sitio.
          <span className="px-1.5 text-center font-display text-[11.5px] leading-[1.15] text-text/55 [overflow-wrap:anywhere]">{name}</span>
        )}
      </span>
      <span className="min-w-0 flex-1 font-display text-[19px] leading-[1.15] text-text [overflow-wrap:anywhere]">{name}</span>
    </li>
  )
}

export function StayInCitySheet({
  city,
  stay,
  onOrganize,
  onOwnDay,
  onClose,
}: {
  city: string
  stay: StayInCity
  /** Devuelve false si no se pudo montar el día (sin conexión, sin respuesta). */
  onOrganize: () => Promise<boolean>
  onOwnDay: () => void
  onClose: () => void
}) {
  const [phase, setPhase] = useState<'ready' | 'loading' | 'error'>('ready')

  const organize = async () => {
    setPhase('loading')
    const ok = await onOrganize()
    if (ok) onClose()
    else setPhase('error')
  }

  // En el body: el panel del día lleva una animación con transform, que encerraría el "fixed" dentro de él.
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="stay-in-city-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={phase === 'loading' ? undefined : onClose} />
      <div className="trazo-notice-panel relative max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Prefiero quedarme en {city}</p>
        <h2 id="stay-in-city-heading" className="mt-2 font-display text-[28px] leading-[1.08] text-text">
          {stay.title}
        </h2>
        {stay.text && <p className="mt-2 text-[14.5px] leading-relaxed text-text-soft">{stay.text}</p>}

        <ul className="mt-5 flex flex-col gap-3.5">
          {stay.stops.map((stop) => (
            <StopRow key={stop.name} name={stop.name} photoName={stop.photoName} city={city} />
          ))}
        </ul>
        <p className="mt-4 text-[12.5px] leading-relaxed text-text/55">Las horas y lo que va de camino salen luego en la ruta.</p>

        {phase === 'error' && <p className="mt-3 text-[13px] text-accent-red">No hemos podido montar el día. Prueba otra vez o crea el tuyo.</p>}

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={organize}
            disabled={phase === 'loading'}
            className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-60"
          >
            {phase === 'loading' ? 'Montando tu día…' : 'Organízame este día'}
          </button>
          <button
            type="button"
            onClick={() => {
              onOwnDay()
              onClose()
            }}
            disabled={phase === 'loading'}
            className="h-12 w-full rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover disabled:opacity-60"
          >
            Prefiero crear mi propio día
          </button>
          <button type="button" onClick={onClose} disabled={phase === 'loading'} className="pt-1 text-center text-caption text-text-muted underline transition-colors hover:text-text-soft">
            Mejor me quedo con la excursión
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
