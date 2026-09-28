import { useEffect, useRef, useState } from 'react'
import type { DateNotice, Route } from '../../lib/types'
import { MAX_DATE_NOTICE_CARDS, dateNoticesKey } from '../../lib/dateNotices'
import { useRouteStore } from '../../store/useRouteStore'
import { DateNoticeIllustration, DateNoticeSmallIcon } from './DateNoticeIcons'

/**
 * La ventana de fechas especiales (PROMPT_AVISO_FECHAS, Parte B). Sale sola la PRIMERA vez que el viajero abre su
 * ruta si hay algún aviso (una vez por ruta: la firma de los avisos se guarda con ella, `dateNoticesSeenKey`; si
 * regenera y cambian, vuelve a salir). También se abre con una sola tarjeta al tocar la etiqueta de un día
 * (`openDateNoticeId`, DayList.tsx).
 *
 * Móvil: hoja que sube desde abajo; ordenador: tarjeta centrada. Tarjetas deslizables con puntitos, como mucho 3:
 * con más, la tercera dice "y N más" y los lista. Un solo botón, "¡Entendido!".
 */
export function DateNoticesModal({ route }: { route: Route }) {
  const markDateNoticesSeen = useRouteStore((state) => state.markDateNoticesSeen)
  const openDateNoticeId = useRouteStore((state) => state.openDateNoticeId)
  const setOpenDateNoticeId = useRouteStore((state) => state.setOpenDateNoticeId)
  const notices = route.dateNotices ?? []
  const key = dateNoticesKey(notices)
  const single = openDateNoticeId ? notices.find((notice) => notice.id === openDateNoticeId) ?? null : null
  const firstTime = notices.length > 0 && route.dateNoticesSeenKey !== key
  const open = Boolean(single) || firstTime
  const shown = single ? [single] : notices

  const close = () => {
    if (firstTime) markDateNoticesSeen(key)
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
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="date-notices-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={close} />
      <div className="trazo-notice-panel relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px] md:shadow-[0_24px_60px_-20px_rgba(28,34,48,.45)]">
        {/* Asa de la hoja (solo móvil). */}
        <div className="flex justify-center pt-2.5 md:hidden">
          <span className="h-1 w-10 rounded-full bg-text/15" />
        </div>
        <p id="date-notices-heading" className="px-6 pt-4 text-center font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent md:pt-6">
          {route.dateNoticesKept ? 'Lo que pasa en tus fechas' : 'Hemos preparado tu viaje para estas fechas'}
        </p>
        <NoticeCarousel notices={shown} />
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            onClick={close}
            className="h-12 w-full rounded-full bg-text font-sans text-[15px] font-medium text-bg transition-transform active:scale-[.98]"
            autoFocus
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  )
}

/** Las tarjetas, deslizables con puntitos. Con más de 3, la tercera lista el resto. */
function NoticeCarousel({ notices }: { notices: DateNotice[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const slides: DateNotice[][] =
    notices.length > MAX_DATE_NOTICE_CARDS
      ? [...notices.slice(0, MAX_DATE_NOTICE_CARDS - 1).map((notice) => [notice]), notices.slice(MAX_DATE_NOTICE_CARDS - 1)]
      : notices.map((notice) => [notice])

  const goTo = (index: number) => {
    const track = trackRef.current
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }

  return (
    <>
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget
          setActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))
        }}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div key={slide[0].id} className="w-full shrink-0 snap-center overflow-y-auto px-6 pb-3 pt-4">
            {slide.length === 1 ? <NoticeCard notice={slide[0]} /> : <MoreCard notices={slide} />}
            <span className="sr-only">{`Aviso ${index + 1} de ${slides.length}`}</span>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-2 pt-1">
          {slides.map((slide, index) => (
            <button
              key={slide[0].id}
              type="button"
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

function NoticeCard({ notice }: { notice: DateNotice }) {
  return (
    <div className="flex flex-col items-center text-center">
      <DateNoticeIllustration icon={notice.icon} />
      <h2 className="mt-3 font-display text-[28px] leading-[1.1] text-text">{notice.title}</h2>
      <div className="mt-3 space-y-2.5">
        {notice.texts.map((text) => (
          <p key={text} className="text-[14.5px] leading-relaxed text-text-soft">
            {text}
          </p>
        ))}
      </div>
    </div>
  )
}

/** La última tarjeta cuando hay más de 3: "y N más", cada uno con su icono, su título y su texto. */
function MoreCard({ notices }: { notices: DateNotice[] }) {
  return (
    <div className="flex flex-col">
      <h2 className="text-center font-display text-[28px] leading-[1.1] text-text">y {notices.length} más</h2>
      <div className="mt-4 space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <DateNoticeSmallIcon icon={notice.icon} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[19px] leading-tight text-text">{notice.title}</p>
              {notice.texts.map((text) => (
                <p key={text} className="mt-1 text-[13.5px] leading-relaxed text-text-soft">
                  {text}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** La etiqueta pequeña de la cabecera de un día ("Todos los Santos"): al tocarla vuelve a salir su tarjeta. */
export function DateNoticeTag({ notice }: { notice: DateNotice }) {
  const setOpenDateNoticeId = useRouteStore((state) => state.setOpenDateNoticeId)
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        setOpenDateNoticeId(notice.id)
      }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-text/[.12] px-2.5 py-[3px] text-[12px] font-medium text-text-soft transition-colors hover:bg-bg-hover"
    >
      <DateNoticeSmallIcon icon={notice.icon} />
      <span className="text-left">{notice.tag}</span>
    </button>
  )
}
