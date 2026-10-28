import { precioTiendaEnVista, useMonedaViajero } from '../../../lib/moneda'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Excursion, Route } from '../../../lib/types'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { fetchPlacePhotoDetail, type PlacePhoto } from '../../../lib/placePhoto'
import { FotoCredito, hayCreditoDeFoto } from '../../ui/FotoCredito'
import { formatReviewCount } from '../../../lib/format'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { WhereSheet } from './WhereSheet'
import { Icono } from '../../ui/Icono'

/** «Día entero · 13 h · recogida en Estación de Termini». */
function detailLine(excursion: Excursion): string {
  const length = excursion.length === 'half-day' ? 'Medio día' : 'Día entero'
  const hours = excursion.durationHours ? `${excursion.durationHours} h` : null
  const how = excursion.meetingPoint ? `recogida en ${excursion.meetingPoint}` : null
  return [length, hours, how].filter(Boolean).join(' · ')
}

function priceText(excursion: Excursion): string | null {
  if (excursion.priceLabel) return `desde ${excursion.priceLabel}`
  return excursion.price > 0 ? `desde ${precioTiendaEnVista(excursion.price)}` : null
}

/**
 * La cabecera de una excursión: su foto y, si la foto tiene crédito (Wikipedia con datos, Unsplash), una línea pequeña sobre la esquina de abajo
 * (Tanda 6y2; las fotos propias, nunca). Se pide la ficha de la foto —no solo la URL— con la misma petición y la misma memoria de siempre: nada extra.
 * Sin foto (o rechazada por el servidor), el recuadro neutro, sin crédito.
 */
function ExcursionPhoto({ excursion, destination }: { excursion: Excursion; destination: string }) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null)
  useEffect(() => {
    let alive = true
    void fetchPlacePhotoDetail(excursion.photoName ?? excursion.title, destination).then((found) => {
      if (alive && found) setPhoto(found)
    })
    return () => {
      alive = false
    }
  }, [excursion.photoName, excursion.title, destination])
  const url = photo?.small ?? null
  return (
    <div className="relative">
      <div className="h-40 w-full bg-bg-hover" style={url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} role="img" aria-label={excursion.title} />
      {hayCreditoDeFoto(photo) && (
        <FotoCredito
          photo={photo}
          className="absolute bottom-1.5 right-1.5 max-w-[80%] rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] leading-tight text-white/90"
          enlaceClassName="underline hover:text-white"
        />
      )}
    </div>
  )
}

/**
 * La página de excursiones (PARA_CODE_EXCURSIONES, 2): pantalla completa, el mismo formato en todos los destinos, sin mapa ni barra detrás
 * y con su cruz. Arriba la franja con la valoración media (calculada, nunca a mano; sin notas reales, solo el texto) y debajo todas las
 * excursiones, sin filtros. «Reservar» va fuera; «Añadir a mi viaje» abre «¿Dónde la ponemos?» (o, si se viene de «+ Añadir día», pone la
 * excursión directa en un día nuevo).
 */
export function ExcursionsPage({ route }: { route: Route }) {
  useMonedaViajero() // (10N7)
  const page = useExcursionsStore((state) => state.page)
  const picking = useExcursionsStore((state) => state.picking)
  const pick = useExcursionsStore((state) => state.pick)
  const closePage = useExcursionsStore((state) => state.closePage)
  const placeExcursion = useRouteStore((state) => state.placeExcursion)
  const info = useDestinationExcursions(page ? route.destination : null)

  useEffect(() => {
    if (!page) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !picking) closePage()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, picking, closePage])

  if (!page) return null
  const destination = route.destination

  const add = (excursion: Excursion) => {
    if (page.toNewDay) {
      placeExcursion(excursion, { newDay: true })
      closePage()
    } else if (page.toDayId) {
      // Ruta a mano (Tanda 6y): [Añadir excursión] de un día en blanco: va a ESE día, como día de excursión, sin preguntar dónde.
      placeExcursion(excursion, { dayId: page.toDayId })
      closePage()
    } else pick(excursion)
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-labelledby="excursions-heading" data-flotantes>
      <div className="relative shrink-0 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={closePage}
          aria-label="Cerrar"
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full border border-text/15 bg-bg-card text-text"
        >
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Un día fuera</p>
        <h1 id="excursions-heading" className="mt-1.5 max-w-[calc(100%-3.5rem)] font-display text-[28px] leading-[1.1] text-text">
          Excursiones desde {destination}
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="rounded-[22px] bg-[#1F1B16] px-5 py-5 text-[#F3EEE4]">
          <div className="flex items-center gap-4">
            {info.rating && (
              <div className="shrink-0 text-center">
                <p className="font-display text-[44px] leading-none text-accent-grande">{info.rating.percent} %</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#F3EEE4]/60">Valoración media</p>
              </div>
            )}
            <p className="text-[14.5px] leading-snug">Así valoran los viajeros las excursiones desde {destination}. Te recogen en la ciudad y vuelves para cenar.</p>
          </div>
          {info.rating && (
            <p className="mt-4 font-mono text-[9.5px] uppercase tracking-[.14em] text-[#F3EEE4]/60">
              Media de {info.rating.excursions} {info.rating.excursions === 1 ? 'excursión' : 'excursiones'} · {info.rating.reviews.toLocaleString('es-ES')} opiniones de viajeros
            </p>
          )}
        </div>

        <ul className="mt-5 flex flex-col gap-4">
          {info.excursions.map((excursion) => {
            const price = priceText(excursion)
            return (
              <li key={excursion.id} className="overflow-hidden rounded-[22px] border border-text/[.1] bg-bg-card shadow-[0_8px_24px_-16px_rgba(28,34,48,.35)]">
                <ExcursionPhoto excursion={excursion} destination={destination} />
                <div className="px-4 pb-4 pt-3">
                  {excursion.bestSeller && <p className="font-mono text-[9.5px] font-medium uppercase tracking-[.14em] text-accent">La más reservada desde {destination}</p>}
                  <h2 className="mt-0.5 font-display text-[21px] leading-[1.15] text-text">{excursion.title}</h2>
                  <p className="mt-1 text-[13px] leading-snug text-text-soft">{detailLine(excursion)}</p>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <p className="text-[13px] text-text-soft">{excursion.rating ? `${excursion.ratingMax === 10 ? `${excursion.rating.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/10` : `★ ${String(excursion.rating).replace('.', ',')}`} · ${formatReviewCount(excursion.reviewCount ?? 0)}` : ''}</p>
                    {price && <p className="font-display text-[19px] text-text">{price}</p>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {excursion.bookUrl && (
                      <a href={excursion.bookUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 flex-1 items-center justify-center rounded-full border border-text/15 text-[14.5px] font-medium text-text transition-colors hover:bg-bg-hover">
                        Reservar
                      </a>
                    )}
                    <button type="button" onClick={() => add(excursion)} className="h-11 flex-1 rounded-full btn-champan text-[14.5px] font-medium transition-transform active:scale-[.98]">
                      Añadir a mi viaje
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {picking && <WhereSheet route={route} excursion={picking} onClose={() => pick(null)} />}
    </div>,
    document.body,
  )
}
