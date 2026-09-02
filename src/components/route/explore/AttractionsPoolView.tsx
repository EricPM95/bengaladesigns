import { useState, type ReactNode } from 'react'
import type { Route, Stop } from '../../../lib/types'
import { buildPoolPlaceDetail, buildPoolStatusForCity, categoryLabel, type PoolPlace, type PoolPlaceStatus } from '../../../lib/explorePool'
import { useRouteStore } from '../../../store/useRouteStore'
import { DayPositionPicker } from '../dayDetail/DayPositionPicker'
import { Modal } from '../../ui/Modal'
import { TipBox } from '../dayDetail/TipBox'

interface AttractionsPoolViewProps {
  route: Route
  city: string
  onClose: () => void
}

function stopFromPoolPlace(place: PoolPlace): Stop {
  return {
    id: `stop-${place.id}`,
    time: '12:00',
    name: place.name,
    description: `Sugerencia de ${categoryLabel(place.category)}.`,
    durationMinutes: 60,
    coordinates: { lat: 0, lng: 0 },
    photoUrl: place.photoUrl,
    categoryLabel: categoryLabel(place.category),
  }
}

function AttractionCard({ place, action, onOpenDetail }: { place: PoolPlaceStatus; action: ReactNode; onOpenDetail: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <button type="button" onClick={onOpenDetail} className="block w-full text-left">
        <img src={place.photoUrl} alt="" className="h-24 w-full object-cover" />
        <div className="space-y-1 p-2">
          <p className="line-clamp-2 text-caption font-medium text-text">{place.name}</p>
          {place.reason && <p className="line-clamp-2 text-caption italic text-text-muted">{place.reason}</p>}
        </div>
      </button>
      <div className="px-2 pb-2">{action}</div>
    </div>
  )
}

/**
 * "Atracciones" de EXPLORAR — el Pool ya implementado (ver ExplorePanel.tsx/explorePool.ts),
 * filtrado a la categoría 🏛️ atracciones del banco de 18. Pulsar la tarjeta (foto/nombre) abre su
 * ficha de detalle completa (descripción + tips, mismo formato que StopAccordion.tsx en DIAS); el
 * botón de abajo es la acción de Añadir/Quitar, independiente del detalle.
 */
export function AttractionsPoolView({ route, city, onClose }: AttractionsPoolViewProps) {
  const removeStop = useRouteStore((state) => state.removeStop)
  const [pendingStop, setPendingStop] = useState<Stop | null>(null)
  const [detailPlace, setDetailPlace] = useState<PoolPlaceStatus | null>(null)

  const pool = buildPoolStatusForCity(route, city).filter((place) => place.category === 'atracciones')
  const inRoute = pool.filter((place) => place.location)
  const notInRoute = pool.filter((place) => !place.location)
  const detail = detailPlace ? buildPoolPlaceDetail(detailPlace) : null

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
        <button type="button" onClick={onClose} className="text-caption font-semibold text-accent hover:text-accent-hover">
          ← Volver
        </button>
        <h2 className="font-display text-h2 font-semibold text-text">🏛️ Atracciones en {city}</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {pool.length === 0 && <p className="py-6 text-center text-small text-text-soft">No hay atracciones catalogadas para {city} todavía.</p>}

        {inRoute.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">✓ Ya está en tu ruta</h3>
            <div className="grid grid-cols-2 gap-3">
              {inRoute.map((place) => (
                <AttractionCard
                  key={place.id}
                  place={place}
                  onOpenDetail={() => setDetailPlace(place)}
                  action={
                    <button
                      type="button"
                      onClick={() => place.location && removeStop(place.location.dayId, place.location.stopId)}
                      className="w-full rounded-lg bg-bg-hover px-2 py-1.5 text-caption font-semibold text-text-soft transition-colors hover:bg-border hover:text-accent-red"
                    >
                      Quitar
                    </button>
                  }
                />
              ))}
            </div>
          </div>
        )}

        {notInRoute.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-caption font-semibold uppercase tracking-wide text-text-muted">No están</h3>
            <div className="grid grid-cols-2 gap-3">
              {notInRoute.map((place) => (
                <AttractionCard
                  key={place.id}
                  place={place}
                  onOpenDetail={() => setDetailPlace(place)}
                  action={
                    <button
                      type="button"
                      onClick={() => setPendingStop(stopFromPoolPlace(place))}
                      className="w-full rounded-lg bg-accent-soft px-2 py-1.5 text-caption font-semibold text-accent-hover transition-colors hover:bg-border"
                    >
                      Añadir
                    </button>
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <DayPositionPicker route={route} stop={pendingStop} onClose={() => setPendingStop(null)} onInserted={() => setPendingStop(null)} />

      <Modal open={detail !== null} onClose={() => setDetailPlace(null)}>
        {detail && (
          <div className="space-y-3">
            <img src={detail.photoUrl} alt="" className="h-40 w-full rounded-xl object-cover" />
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">{detail.category}</p>
              <h2 className="font-display text-h2 font-semibold text-text">{detail.name}</h2>
            </div>
            <p className="text-small text-text-soft">{detail.description}</p>
            {detail.tips.map((tip) => (
              <TipBox key={tip}>{tip}</TipBox>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
