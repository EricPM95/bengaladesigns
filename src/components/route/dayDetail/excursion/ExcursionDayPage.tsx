import { useEffect, useRef, useState } from 'react'
import type { Excursion } from '../../../../lib/types'
import { hoursLabel } from './hoursLabel'

/**
 * La página del día de excursión (Tanda 6g, diseño `docs/diseno/excursion/Excursion_Dia_4.dc.html` + prototipo).
 * De arriba abajo: porcentaje, foto, nombre, etiquetas, línea de horas, texto, «Ver disponibilidad», confirmación,
 * «Ver más excursiones», medio día y «O sin excursión». Solo lleva la excursión: ni comida, ni cena, ni noche.
 * No llama al store: todo sale por callbacks.
 */
interface ExcursionDayPageProps {
  destination: string
  tripDays: number
  options: Excursion[]
  viewed: Excursion
  percentPhrase: string | null
  reservation: { locator: string | null; excursionId: string } | null
  onSelect: (excursionId: string) => void
  onConfirm: (excursionId: string, code: string) => void
  onStayInRoma: () => void
  onOwnDay: () => void
  onAddPlaces: () => void
}

/** Lo que la página enseña de una excursión, con o sin `page`. */
interface View {
  id: string
  nameBefore: string
  nameDestination: string
  nameAfter: string
  fullName: string
  listName: string
  shortName: string
  duration: string | null
  returnTime: string | null
  halfDay: boolean
  priceLabel: string
  affiliateUrl: string | null
  tags: { kind: string; text: string }[]
  stops: { time: string; name: string }[]
  text: string
  photoUrl: string | null
  photoCredit: string
  color: string
  percentage: number | null
}

const FALLBACK_COLOR = '#B4704A'

function toView(excursion: Excursion): View {
  const page = excursion.page
  if (page) {
    return {
      id: excursion.id,
      nameBefore: page.nameBefore,
      nameDestination: page.nameDestination,
      nameAfter: page.nameAfter,
      fullName: excursion.title || `${page.nameBefore} ${page.nameDestination}${page.nameAfter}`,
      listName: page.nameDestination || excursion.title,
      shortName: page.shortName,
      duration: hoursLabel(page.durationHours) ?? excursion.durationLabel ?? null,
      returnTime: page.returnTime,
      halfDay: page.halfDay,
      priceLabel: page.priceLabel,
      affiliateUrl: page.affiliateUrl,
      tags: page.tags,
      stops: page.stops,
      text: page.text,
      photoUrl: page.photoUrl,
      photoCredit: page.photoCredit,
      color: page.color || FALLBACK_COLOR,
      percentage: typeof page.percentage === 'number' ? page.percentage : null,
    }
  }
  return {
    id: excursion.id,
    nameBefore: '',
    nameDestination: excursion.title,
    nameAfter: '',
    fullName: excursion.title,
    listName: excursion.title,
    shortName: excursion.title,
    duration: hoursLabel(excursion.durationHours) ?? excursion.durationLabel ?? null,
    returnTime: null,
    halfDay: excursion.length === 'half-day',
    priceLabel: excursion.priceLabel ?? (excursion.price ? `${excursion.price}€` : 'XX€'),
    affiliateUrl: excursion.bookUrl ?? null,
    tags: [],
    stops: [],
    text: excursion.description ?? '',
    photoUrl: null,
    photoCredit: '',
    color: FALLBACK_COLOR,
    percentage: null,
  }
}

/** Iconos de trazo fino, sin relleno. */
function Icon({ d, size = 13, stroke = 1.5 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const PATH = {
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  bus: 'M5 4h14v12H5zM5 11h14M8 19v-3M16 19v-3',
  train: 'M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 10h14M8 21l2-4M16 21l-2-4',
  guide: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  ticket: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
  house: 'M3 11l9-7 9 7M5 10v10h14V10',
  check: 'M5 12l5 5 9-10',
  chevron: 'M9 6l6 6-6 6',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
}

function tagIcon(tag: { kind: string; text: string }): string {
  if (tag.kind === 'guia') return PATH.guide
  if (tag.kind === 'entrada') return PATH.ticket
  return /tren/i.test(tag.text) ? PATH.train : PATH.bus
}

/** El recuadro de color con la foto encima (si la hay y carga). */
function Swatch({ view, className }: { view: View; className: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`} style={{ backgroundColor: view.color }} aria-hidden="true">
      {view.photoUrl && <img src={view.photoUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
    </span>
  )
}

/** El anillo del porcentaje: se rellena según el dato real. */
function PercentRing({ value }: { value: number }) {
  const radius = 19
  const length = 2 * Math.PI * radius
  const shown = Math.max(0, Math.min(100, value))
  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="3" className="stroke-bg-hover" />
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-accent" strokeDasharray={`${(length * shown) / 100} ${length}`} />
      </svg>
      <span className="relative font-mono text-[11px] font-semibold text-accent">{shown}%</span>
    </span>
  )
}

export function ExcursionDayPage({
  destination,
  tripDays,
  options,
  viewed,
  percentPhrase,
  reservation,
  onSelect,
  onConfirm,
  onStayInRoma,
  onOwnDay,
  onAddPlaces,
}: ExcursionDayPageProps) {
  const view = toView(viewed)
  const rootRef = useRef<HTMLDivElement>(null)
  const noticeTimer = useRef<number | undefined>(undefined)
  const [moreOpen, setMoreOpen] = useState(false)
  const [confOpen, setConfOpen] = useState(false)
  const [confId, setConfId] = useState(viewed.id)
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)

  const confirmed = !!reservation && reservation.excursionId === viewed.id
  const others = options.filter((option) => option.id !== viewed.id)
  const otherViews = others.map(toView)

  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  const phrase =
    percentPhrase && view.percentage !== null
      ? percentPhrase.replace('{dias}', String(tripDays)).replace('{porcentaje}', String(view.percentage)).replace('{corto}', view.shortName)
      : null

  const toggleConfirmation = () => {
    if (!confOpen) {
      setConfId(reservation?.excursionId ?? viewed.id)
      setCode(reservation?.locator ?? '')
    }
    setConfOpen((open) => !open)
  }

  const save = () => {
    const clean = code.trim()
    if (!clean) return
    onConfirm(confId, clean)
    setConfOpen(false)
  }

  const showPending = () => {
    setPending(true)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setPending(false), 3000)
  }

  const pick = (id: string) => {
    setMoreOpen(false)
    onSelect(id)
    rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const availabilityClass =
    'flex min-h-[54px] w-full items-center justify-center rounded-full bg-accent px-4 text-[16px] font-semibold text-white shadow-[0_12px_24px_-12px_rgba(182,78,16,.7)] transition-colors hover:bg-accent-hover'
  const tagList = [
    ...(view.duration ? [{ icon: PATH.clock, text: view.duration }] : []),
    ...view.tags.map((tag) => ({ icon: tagIcon(tag), text: tag.text })),
  ]
  const lastStop = view.stops.length - 1

  return (
    <div ref={rootRef} onClick={(e) => e.stopPropagation()} className="flex scroll-mt-4 flex-col gap-3">
      {phrase && (
        <div className="flex items-center gap-3 px-1 py-0.5">
          <PercentRing value={view.percentage ?? 0} />
          <span className="text-[13px] leading-[1.45] text-text/70">{phrase}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-[22px] border border-text/[.08] bg-bg-card shadow-[0_14px_30px_-24px_rgba(28,34,48,.45)]">
        <div className="relative h-44" style={{ backgroundColor: view.color }}>
          {view.photoUrl && <img src={view.photoUrl} alt={view.fullName} className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          <span className="absolute left-3 top-3 flex h-[30px] items-center gap-[7px] rounded-full bg-bg-card/90 px-3 font-mono text-[10.5px] font-semibold uppercase tracking-[.12em] text-text">
            <Icon d={PATH.house} />
            Excursión del día
          </span>
          <span className="absolute right-3 top-3 flex flex-col items-end gap-px rounded-[14px] bg-text px-3 pb-2 pt-[7px] text-bg-card">
            <span className="font-mono text-[9px] font-medium uppercase tracking-[.14em] opacity-75">Desde</span>
            <span className="font-display text-[26px] leading-none">{view.priceLabel}</span>
          </span>
          {!view.photoUrl && <span className="absolute bottom-3 left-3.5 font-mono text-[10px] font-medium uppercase tracking-[.14em] text-white/90">Foto · {view.shortName}</span>}
          {view.photoUrl && view.photoCredit && <span className="absolute bottom-3 left-3.5 max-w-[55%] font-mono text-[9px] text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">{view.photoCredit}</span>}
          {confirmed && (
            <span className="absolute bottom-3 right-3 flex h-[30px] items-center gap-1.5 rounded-full bg-accent-green px-3 text-[12px] font-semibold text-white">
              <Icon d={PATH.check} stroke={2.2} />
              {reservation?.locator ? `Reservada · ${reservation.locator}` : 'Reservada'}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3.5 px-4 pb-[18px] pt-4">
          <h3 className="m-0 font-display text-[27px] font-normal leading-[1.1] text-text">
            {view.nameBefore ? `${view.nameBefore} ` : ''}
            <em className="text-accent">{view.nameDestination}</em>
            {view.nameAfter}
          </h3>

          {tagList.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {tagList.map((tag, index) => (
                <span key={`${tag.text}-${index}`} className="flex h-7 items-center gap-1.5 rounded-full bg-bg-hover px-2.5 text-[12px] text-text/80">
                  <Icon d={tag.icon} />
                  {tag.text}
                </span>
              ))}
            </span>
          )}

          {view.stops.length > 0 && (
            <div className="relative rounded-2xl bg-bg px-3.5 pb-3 pt-4">
              <div className="absolute left-5 right-5 top-[21px] border-t-2 border-dashed border-accent/50" />
              <div className="relative flex justify-between gap-1.5">
                {view.stops.map((stop, index) => {
                  const edge = index === 0 ? 'items-start text-left' : index === lastStop ? 'items-end text-right' : 'items-center text-center'
                  const dark = index === 0 || index === lastStop
                  return (
                    <span key={`${stop.time}-${index}`} className={`flex min-w-0 flex-col gap-[5px] ${edge}`}>
                      <span className={`h-3 w-3 rounded-full border-2 border-bg ${dark ? 'bg-text' : 'bg-accent'}`} />
                      <span className="font-mono text-[11px] font-semibold text-accent">{stop.time}</span>
                      <span className="break-words font-display text-[15px] leading-[1.1] text-text">{stop.name}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {view.text && <p className="m-0 text-[13.5px] leading-[1.55] text-text/70">{view.text}</p>}

          {!confirmed &&
            (view.affiliateUrl ? (
              <a href={view.affiliateUrl} target="_blank" rel="noopener noreferrer" className={availabilityClass}>
                Ver disponibilidad
              </a>
            ) : (
              <>
                <button type="button" onClick={showPending} className={availabilityClass}>
                  Ver disponibilidad
                </button>
                {pending && (
                  <span role="status" className="-mt-1.5 text-center text-[12px] text-text/65">
                    Enlace pendiente
                  </span>
                )}
              </>
            ))}

          {confOpen && (
            <div className="flex flex-col gap-2.5 rounded-2xl bg-bg p-3">
              <label className="flex flex-col gap-1.5 text-[12px] font-medium text-text/75">
                ¿Qué excursión has reservado?
                <select value={confId} onChange={(e) => setConfId(e.target.value)} className="h-11 rounded-xl border border-text/[.18] bg-bg-card px-2.5 text-[14px] font-normal text-text">
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title || toView(option).fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] font-medium text-text/75">
                Código de reserva
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Por ejemplo, CIV-48213"
                  className="h-11 rounded-xl border border-text/[.18] bg-bg-card px-3 text-[14px] font-normal text-text placeholder:text-text/40"
                />
              </label>
              <button type="button" onClick={save} disabled={!code.trim()} className="min-h-[44px] rounded-full bg-text text-[14px] font-semibold text-bg-card disabled:opacity-50">
                Guardar
              </button>
            </div>
          )}

          <button type="button" onClick={toggleConfirmation} aria-expanded={confOpen} className="flex min-h-[44px] items-center gap-[7px] self-center text-[13px] text-text/70 underline underline-offset-[3px]">
            <Icon d={PATH.ticket} size={14} />
            {reservation ? 'Cambiar confirmación' : '¿Ya la has reservado? Añade tu confirmación'}
          </button>
        </div>
      </div>

      {view.halfDay && (
        <div className="flex flex-col gap-2">
          <span className="text-center text-[13px] text-text/70">Vuelves a Roma a las {view.returnTime ?? '14:00'}. La tarde es para ti.</span>
          <button
            type="button"
            onClick={onAddPlaces}
            className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-accent/70 bg-transparent px-4 py-3 text-accent transition-colors hover:bg-accent-soft/60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[22px] leading-none text-white" aria-hidden="true">
              +
            </span>
            <span className="font-display text-[20px] leading-none">Añadir lugares</span>
          </button>
        </div>
      )}

      {!confirmed && others.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className="flex min-h-[62px] items-center gap-3 rounded-[18px] border border-text/10 bg-bg-card px-3.5 text-text"
          >
            <span className="flex">
              {otherViews.slice(0, 4).map((other) => (
                <Swatch key={other.id} view={other} className="-mr-[9px] h-[30px] w-[30px] rounded-full border-2 border-bg-card" />
              ))}
            </span>
            <span className="flex-1 pl-3 text-left text-[14px] font-medium">Ver más excursiones ({others.length})</span>
            <span className={`text-text/60 transition-transform ${moreOpen ? 'rotate-90' : ''}`}>
              <Icon d={PATH.chevron} size={18} />
            </span>
          </button>
          {moreOpen && (
            <div className="flex flex-col gap-2">
              {otherViews.map((other) => (
                <button key={other.id} type="button" onClick={() => pick(other.id)} className="flex min-h-[66px] items-center gap-3 rounded-2xl border border-text/10 bg-bg-card px-3 py-2.5 text-left text-text">
                  <Swatch view={other} className="h-[46px] w-[46px] rounded-xl" />
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="font-display text-[17px] leading-[1.1]">{other.listName}</span>
                    <span className="font-mono text-[11px] font-medium text-text/60">{[other.duration, `desde ${other.priceLabel}`].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="text-text/50">
                    <Icon d={PATH.chevron} size={16} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-1.5 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-text/[.14]" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-text/60">O sin excursión</span>
        <span className="h-px flex-1 bg-text/[.14]" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onStayInRoma} className="flex min-h-[132px] flex-col items-start justify-between gap-3 rounded-[20px] border border-text/10 bg-bg-card p-3.5 text-left text-text">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-bg-hover">
            <Icon d={PATH.house} size={16} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-display text-[18px] leading-[1.12]">Prefiero quedarme en {destination}</span>
            <span className="text-[11.5px] leading-[1.35] text-text/65">Te preparamos un día por {destination}</span>
          </span>
        </button>
        <button type="button" onClick={onOwnDay} className="flex min-h-[132px] flex-col items-start justify-between gap-3 rounded-[20px] bg-text p-3.5 text-left text-bg-card">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-accent-gold text-text">
            <Icon d={PATH.compass} size={16} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-display text-[18px] leading-[1.12]">Crear mi propio día</span>
            <span className="text-[11.5px] leading-[1.35] text-bg-card/75">Elige tus sitios en el mapa</span>
          </span>
        </button>
      </div>
    </div>
  )
}
