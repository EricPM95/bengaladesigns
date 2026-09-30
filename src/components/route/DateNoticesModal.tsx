import { useEffect, useRef, useState } from 'react'
import type { DateNotice, Route, Season } from '../../lib/types'
import { MAX_DATE_NOTICE_CARDS, dateNoticesKey } from '../../lib/dateNotices'
import { useRouteStore } from '../../store/useRouteStore'
import { SEASON_FX } from '../trazo/trazoUi'
import { DateNoticeIllustration, DateNoticeSmallIcon } from './DateNoticeIcons'

/**
 * La ventana de fechas especiales (PROMPT_AVISO_FECHAS, Parte B). Sale sola la PRIMERA vez que el viajero abre su
 * ruta si hay algún aviso (una vez por ruta: la firma de los avisos se guarda con ella, `dateNoticesSeenKey`; si
 * regenera y cambian, vuelve a salir). También se abre con una sola tarjeta al tocar la etiqueta de un día
 * (`openDateNoticeId`, DayList.tsx).
 *
 * Móvil: hoja que sube desde abajo; ordenador: tarjeta centrada. Tarjetas deslizables con puntitos, como mucho 3:
 * con más, la tercera dice "y N más" y los lista. Con más de una, flechas ‹ › a los lados y "1 de 3"; el botón dice
 * "Siguiente" hasta la última y en la última "Entendido" (PROMPT_UI, Parte 2): así nadie cierra sin ver el resto.
 *
 * La tarjeta de temporada va antes y aparte (SeasonCard.tsx, PROMPT_TARJETA_TEMPORADA): esta ventana sale después de
 * su «Entendido», solo si hay avisos.
 */
export function DateNoticesModal({ route }: { route: Route }) {
  const markDateNoticesSeen = useRouteStore((state) => state.markDateNoticesSeen)
  const openDateNoticeId = useRouteStore((state) => state.openDateNoticeId)
  const setOpenDateNoticeId = useRouteStore((state) => state.setOpenDateNoticeId)
  const notices = route.dateNotices ?? []
  // (La tarjeta de temporada va antes, aparte: SeasonCard.tsx. Hasta que se cierra, los avisos esperan.)
  const cardPending = Boolean(route.seasonNote?.text) && !route.seasonNoteDismissed
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
          Hemos preparado tu viaje para estas fechas
        </p>
        <NoticeCarousel slides={slides} trackRef={trackRef} active={active} onActive={setActive} goTo={goTo} />
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            onClick={isLast ? close : () => goTo(active + 1)}
            className="h-12 w-full rounded-full bg-text font-sans text-[15px] font-medium text-bg transition-transform active:scale-[.98]"
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
      aria-label={direction === 'prev' ? 'Aviso anterior' : 'Aviso siguiente'}
      className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-text/[.12] bg-bg-card text-text/60 shadow-sm transition-opacity hover:text-text disabled:opacity-0 ${direction === 'prev' ? 'left-2' : 'right-2'}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d={direction === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  )
}

/** Las tarjetas, deslizables, con flechas a los lados, "1 de 3" y puntitos. */
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
          <div key={slide[0].id} className="w-full shrink-0 snap-center overflow-y-auto px-12 pb-3 pt-4">
            {slide.length === 1 ? <NoticeCard notice={slide[0]} /> : <MoreCard notices={slide} />}
            <span className="sr-only">{`Aviso ${index + 1} de ${slides.length}`}</span>
          </div>
        ))}
      </div>
      </div>
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2 pt-1">
          <span className="mr-1.5 font-mono text-[11px] font-medium text-text/50">{`${active + 1} de ${slides.length}`}</span>
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

/** Unas posiciones fijas para las partículas (como PARTS del formulario, pero estables entre renders). */
const BAND_PARTS = Array.from({ length: 22 }, (_, i) => [((i * 37) % 100) / 100, ((i * 53) % 97) / 97, ((i * 29) % 89) / 89, ((i * 71) % 83) / 83])

/**
 * La franja de la nota de temporada, en el sitio del dibujo de los demás avisos: el degradado de su época y el efecto
 * del formulario, suave y solo dentro de la franja, así que nunca tapa el texto (PROMPT_UI_REPASO_2, 2). Invierno, nieve
 * cayendo; verano, el sol poniéndose; primavera, pétalos; otoño, hojas. Con «reducir movimiento», quieta (index.css).
 */
function SeasonBand({ season }: { season: Season }) {
  const fall = (seconds: number, delay: number) => `trazo-fall-sm ${seconds}s linear ${-delay}s infinite`
  let kids: React.ReactNode[] = []
  if (season === 'winter')
    kids = BAND_PARTS.map((r, i) => (
      <div key={i} style={{ position: 'absolute', left: `${r[0] * 100}%`, top: 0, animation: fall(6 + r[1] * 5, r[2] * 11) }}>
        <div style={{ width: 2 + r[3] * 3, height: 2 + r[3] * 3, borderRadius: '50%', background: '#fff', opacity: 0.45 + r[3] * 0.4, animation: `trazo-sway ${3 + r[1] * 3}s ease-in-out infinite` }} />
      </div>
    ))
  if (season === 'spring')
    kids = BAND_PARTS.slice(0, 12).map((r, i) => (
      <div key={i} style={{ position: 'absolute', left: `${r[0] * 100}%`, top: 0, animation: fall(8 + r[1] * 5, r[2] * 13) }}>
        <div style={{ width: 6 + r[3] * 3, height: 8 + r[3] * 3, borderRadius: '60% 40% 60% 40%', background: i % 3 ? 'oklch(0.88 0.06 10)' : 'oklch(0.93 0.04 90)', opacity: 0.75, animation: `trazo-sway ${4 + r[1] * 3}s ease-in-out infinite` }} />
      </div>
    ))
  if (season === 'autumn')
    kids = BAND_PARTS.slice(0, 12).map((r, i) => (
      <div key={i} style={{ position: 'absolute', left: `${r[0] * 100}%`, top: 0, animation: fall(6 + r[1] * 5, r[2] * 11) }}>
        <div style={{ width: 10 + r[3] * 5, height: 7 + r[3] * 3, borderRadius: '0 100% 0 100%', background: ['oklch(0.7 0.15 50)', 'oklch(0.6 0.14 35)', 'oklch(0.78 0.13 80)'][i % 3], opacity: 0.85, animation: `trazo-sway ${2.5 + r[1] * 2.5}s ease-in-out infinite` }} />
      </div>
    ))
  if (season === 'summer')
    kids = [
      // El sol baja despacio hacia el horizonte (y vuelve, sin salto) con su halo.
      <div key="sun" style={{ position: 'absolute', left: '50%', top: 26, marginLeft: -60, width: 120, height: 120, animation: 'trazo-sunset 9s ease-in-out infinite alternate' }}>
        <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: 'radial-gradient(circle,oklch(0.92 0.12 85 / .55),transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: 'oklch(0.9 0.13 80)', opacity: 0.9 }} />
      </div>,
      // El horizonte tapa la mitad de abajo del sol.
      <div key="horizon" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, background: 'linear-gradient(180deg,oklch(0.5 0.13 38),oklch(0.42 0.11 35))' }} />,
    ]
  return (
    <div className="trazo-season-fx relative h-[118px] w-full overflow-hidden rounded-[20px]" style={{ background: SEASON_FX[season].gradient }} aria-hidden="true">
      {kids}
    </div>
  )
}

function NoticeCard({ notice, season }: { notice: DateNotice; season?: Season }) {
  return (
    <div className="flex flex-col items-center text-center">
      {season ? <SeasonBand season={season} /> : <DateNoticeIllustration icon={notice.icon} />}
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
