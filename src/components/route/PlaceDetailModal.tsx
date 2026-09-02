import type { Stop } from '../../lib/types'
import { Modal } from '../ui/Modal'
import { TourOptions } from './TourOptions'

interface PlaceDetailModalProps {
  stop: Stop | null
  onClose: () => void
}

export function PlaceDetailModal({ stop, onClose }: PlaceDetailModalProps) {
  const detail = stop?.detail

  return (
    <Modal open={Boolean(stop && detail)} onClose={onClose}>
      {stop && detail && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">📍 {stop.name}</p>
              {stop.fullName && <p className="text-small text-text-soft">{stop.fullName}</p>}
            </div>
            <button type="button" onClick={onClose} className="text-text-muted hover:text-text">
              ✕
            </button>
          </div>

          <img src={stop.photoUrl} alt={stop.name} className="h-48 w-full rounded-xl object-cover" />

          <section>
            <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">📝 Qué es</h3>
            <p className="mt-1 text-body text-text-soft">{detail.whatIsIt}</p>
          </section>

          <section>
            <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">⏰ Horario</h3>
            <p className="mt-1 text-body text-text-soft">{detail.hours}</p>
            {detail.closedDates && <p className="text-small text-text-muted">{detail.closedDates}</p>}
          </section>

          <section>
            <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">💰 Precios</h3>
            <ul className="mt-1 space-y-0.5 text-body text-text-soft">
              {detail.prices.map((price) => (
                <li key={price}>• {price}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">📍 Cómo llegar</h3>
            <ul className="mt-1 space-y-0.5 text-body text-text-soft">
              {detail.howToGetThere.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">⚡ Trucos locales</h3>
            <ul className="mt-1 space-y-0.5 text-body text-text-soft">
              {detail.insiderTips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </section>

          {detail.ticketsAndTours.length > 0 && (
            <section>
              <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">🎟 Entradas y tours</h3>
              <div className="mt-2">
                <TourOptions ticketOptions={detail.ticketsAndTours} contextLabel={stop.name} />
              </div>
            </section>
          )}

          {(detail.bestForPhotos.exterior || detail.bestForPhotos.interior) && (
            <section>
              <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">📸 Mejor para fotos</h3>
              <p className="mt-1 space-y-0.5 text-body text-text-soft">
                {detail.bestForPhotos.exterior && <span className="block">Exterior: {detail.bestForPhotos.exterior}</span>}
                {detail.bestForPhotos.interior && <span className="block">Interior: {detail.bestForPhotos.interior}</span>}
              </p>
            </section>
          )}
        </div>
      )}
    </Modal>
  )
}
