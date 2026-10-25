import { useEffect, useRef, useState } from 'react'
import type { DateNotice, Route } from '../../lib/types'
import { MAX_DATE_NOTICE_CARDS, dateNoticesKey } from '../../lib/dateNotices'
import { seasonCardPending } from '../../lib/seasonCard'
import { useRouteStore } from '../../store/useRouteStore'
import { AvisoDeFechaTarjeta, AvisosMasTarjeta } from './AvisoDeFechaTarjeta'
import { Icono } from '../ui/Icono'

/**
 * La ventana de fechas especiales (PROMPT_AVISO_FECHAS, Parte B; Tanda 10M). Sale sola la PRIMERA vez que el viajero abre su ruta si hay algún
 * aviso (una vez por ruta: la firma de los avisos se guarda con ella, `dateNoticesSeenKey`), y lo que ve aquí entra en la campana ya como leído
 * (`markDateNoticesSeen`). También se abre con una sola tarjeta (`openDateNoticeId`) cuando el viajero toca un aviso en la campana.
 *
 * En el centro, del mismo tamaño y estilo que la tarjeta especial (SeasonCard.tsx), con el icono del aviso arriba en lugar del dibujo
 * (AvisoDeFechaTarjeta.tsx). Tarjetas deslizables con puntitos, como mucho 3: con más, la tercera dice «y N más» y los lista. Con más de una,
 * flechas ‹ › a los lados y «1 de 3»; el botón dice «Siguiente» hasta la última y en la última «Entendido»: así nadie cierra sin ver el resto.
 *
 * La tarjeta especial (Navidad, Semana Santa, el cumpleaños) va antes y aparte (SeasonCard.tsx): esta ventana sale después de su «Entendido»,
 * solo si hay avisos.
 */
export function DateNoticesModal({ route }: { route: Route }) {
  const markDateNoticesSeen = useRouteStore((state) => state.markDateNoticesSeen)
  const markDateNoticeRead = useRouteStore((state) => state.markDateNoticeRead)
  const openDateNoticeId = useRouteStore((state) => state.openDateNoticeId)
  const setOpenDateNoticeId = useRouteStore((state) => state.setOpenDateNoticeId)
  const notices = route.dateNotices ?? []
  // (La tarjeta especial va antes, aparte: SeasonCard.tsx. Hasta que se cierra, los avisos esperan.)
  const cardPending = seasonCardPending(route)
  const all = notices
  const key = dateNoticesKey(all)
  const single = openDateNoticeId ? notices.find((notice) => notice.id === openDateNoticeId) ?? null : null
  const firstTime = !cardPending && all.length > 0 && route.dateNoticesSeenKey !== key
  const open = Boolean(single) || firstTime
  const shown = single ? [single] : all
  const slides = slidesOf(shown)
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const goTo = (index: number) => {
    const track = trackRef.current
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
    setActive(index)
  }
  const isLast = active >= slides.length - 1
  // (Cada vez que se abre, desde el primero.)
  useEffect(() => setActive(0), [open, openDateNoticeId])

  const close = () => {
    if (firstTime) markDateNoticesSeen(key)
    if (single) markDateNoticeRead(single.id)
    setOpenDateNoticeId(null)
  }

  // Escape cierra, como el botón.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Avisos de tus fechas" data-ventana-avisos={single ? 'uno' : 'todos'}>
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={close} />
      <div className="trazo-notice-panel relative flex max-h-[94dvh] w-full max-w-[390px] flex-col overflow-hidden rounded-[30px] bg-[#FFFDF8] shadow-[0_30px_70px_-30px_rgba(40,25,5,.45)]">
        <NoticeCarousel slides={slides} trackRef={trackRef} active={active} onActive={setActive} goTo={goTo} />
        <div className="px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            data-aviso-boton={isLast ? 'entendido' : 'siguiente'}
            onClick={isLast ? close : () => goTo(active + 1)}
            className="h-14 w-full rounded-full btn-champan text-[16px] font-semibold transition-transform active:scale-[.98]"
            autoFocus
          >
            {isLast ? 'Entendido' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Las tarjetas: como mucho 3; con más, la tercera lista el resto. */
function slidesOf(notices: DateNotice[]): DateNotice[][] {
  return notices.length > MAX_DATE_NOTICE_CARDS
    ? [...notices.slice(0, MAX_DATE_NOTICE_CARDS - 1).map((notice) => [notice]), notices.slice(MAX_DATE_NOTICE_CARDS - 1)]
    : notices.map((notice) => [notice])
}

function ArrowButton({ direction, disabled, onClick }: { direction: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-aviso-flecha={direction}
      aria-label={direction === 'prev' ? 'Aviso anterior' : 'Aviso siguiente'}
      className={`absolute top-[150px] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-text/[.12] bg-[#FFFDF8] text-text/60 shadow-sm transition-opacity hover:text-text disabled:opacity-0 [@media(max-height:760px)]:top-[105px] ${direction === 'prev' ? 'left-2' : 'right-2'}`}
    >
      <Icono nombre={direction === 'prev' ? 'atras' : 'adelante'} className="h-4 w-4" />
    </button>
  )
}

/** Las tarjetas, deslizables, con flechas a los lados, «1 de 3» y puntitos. */
function NoticeCarousel({ slides, trackRef, active, onActive, goTo }: { slides: DateNotice[][]; trackRef: React.RefObject<HTMLDivElement | null>; active: number; onActive: (index: number) => void; goTo: (index: number) => void }) {
  return (
    <>
      <div className="relative flex min-h-0 flex-1">
        {slides.length > 1 && <ArrowButton direction="prev" disabled={active === 0} onClick={() => goTo(active - 1)} />}
        {slides.length > 1 && <ArrowButton direction="next" disabled={active >= slides.length - 1} onClick={() => goTo(active + 1)} />}
        <div
          ref={trackRef}
          onScroll={(event) => {
            const track = event.currentTarget
            onActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))
          }}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, index) => (
            <div key={slide[0].id} className="w-full shrink-0 snap-center overflow-y-auto">
              {slide.length === 1 ? <AvisoDeFechaTarjeta notice={slide[0]} /> : <AvisosMasTarjeta notices={slide} />}
              <span className="sr-only">{`Aviso ${index + 1} de ${slides.length}`}</span>
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2 pt-1">
          <span data-aviso-contador className="mr-1.5 font-mono text-[11px] font-medium text-text/50">{`${active + 1} de ${slides.length}`}</span>
          {slides.map((slide, index) => (
            <button
              key={slide[0].id}
              type="button"
              data-aviso-punto={index === active ? 'activo' : 'inactivo'}
              aria-label={`Ver aviso ${index + 1}`}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? 'w-5 bg-text' : 'w-1.5 bg-text/20'}`}
            />
          ))}
        </div>
      )}
    </>
  )
}
