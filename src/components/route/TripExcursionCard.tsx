import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Excursion, Route } from '../../lib/types'
import { fetchPlacePhotoDetail } from '../../lib/placePhoto'
import { computeDayTravelInfo } from '../../lib/dayTravelInfo'
import { useRouteStore } from '../../store/useRouteStore'
import { withUndo } from '../../store/useAddFlowStore'

/** "Excursión a Pompeya y Sorrento" → "Pompeya y Sorrento": el sitio al que se va. */
function placeOf(excursion: Excursion): string {
  return excursion.title.replace(/^Excursión (a la|a los|a las|al|a)\s+/i, '')
}

/** Las excursiones del destino (las de cualquier día: el catálogo es el mismo). */
function catalogOf(route: Route): Excursion[] {
  return route.days.find((day) => (day.excursions ?? []).length > 0)?.excursions ?? []
}

/** El primer sitio de la excursión ("Pompeya" de "Pompeya y Sorrento"): con él se busca su foto. */
function mainPlaceOf(excursion: Excursion): string {
  if (excursion.photoName) return excursion.photoName
  return placeOf(excursion).split(/s+(?:y|en|con)s+/)[0]
}

/** Las palabras que dicen a dónde se va ("pompeya", "sorrento"): dos excursiones al mismo sitio no salen juntas. */
const placeWords = (excursion: Excursion) =>
  placeOf(excursion)
    .toLowerCase()
    .split(/[^a-záéíóúüñ]+/)
    .filter((word) => word.length > 3)

/** Las tres que se enseñan: las primeras del destino, de día completo y sin repetir sitio (en Roma, Pompeya, Florencia y la Costa Amalfitana). */
function highlightsOf(route: Route): Excursion[] {
  const chosen: Excursion[] = []
  const used = new Set<string>()
  for (const excursion of catalogOf(route)) {
    if (excursion.length !== 'full-day' || chosen.length >= 3) continue
    const words = placeWords(excursion)
    if (words.some((word) => used.has(word))) continue
    chosen.push(excursion)
    for (const word of words) used.add(word)
  }
  return chosen
}

function usePhoto(name: string, city: string): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    fetchPlacePhotoDetail(name, city).then((photo) => alive && setUrl(photo?.small ?? null))
    return () => {
      alive = false
    }
  }, [name, city])
  return url
}

const lengthLabel = (excursion: Excursion) => (excursion.length === 'full-day' ? 'Día completo' : 'Medio día')

function ExcursionTile({ excursion, country, onOpen }: { excursion: Excursion; country: string; onOpen: () => void }) {
  const photo = usePhoto(mainPlaceOf(excursion), country)
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-text/[.08] bg-bg-card text-left shadow-[0_1px_2px_rgba(28,34,48,.05)] transition-transform active:scale-[.98]">
      <span className="relative block aspect-[4/5] w-full overflow-hidden bg-bg-hover">
        {photo && <img src={photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        {/* La franja terracota en diagonal, como las tarjetas Trazo. */}
        <span className="absolute inset-y-0 left-0 w-[16px]" style={{ background: 'rgb(var(--accent))', clipPath: 'polygon(0 0, 12px 0, 5px 100%, 0 100%)' }} aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-0.5 px-2.5 pb-2.5 pt-2">
        <span className="font-display text-[15px] leading-[1.15] text-text [overflow-wrap:anywhere]">{placeOf(excursion)}</span>
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[.1em] text-text/50">{lengthLabel(excursion)}</span>
      </span>
    </button>
  )
}

/** La ficha de una excursión y, al elegirla, qué día se cambia (sin precios). */
function ExcursionSheet({ route, excursion, onClose }: { route: Route; excursion: Excursion; onClose: () => void }) {
  const convertDayType = useRouteStore((state) => state.convertDayType)
  const selectDayExcursion = useRouteStore((state) => state.selectDayExcursion)
  const photo = usePhoto(mainPlaceOf(excursion), route.country || route.destination)
  // Los días que se pueden cambiar: de ciudad, sin viaje ni vuelta.
  // (El de la oferta, sí, aunque sea el de la vuelta: en Roma en 4 días, el de D5C es el último.)
  const candidates = route.days.filter((day, index) => !day.isReturnLeg && (!computeDayTravelInfo(route, index) || Boolean(day.excursionOffer)) && (day.dayType ?? 'normal') !== 'excursion')
  // Propone el día de la oferta (Roma en 4 días: el de D5C); si no, el último.
  const proposed: DayPlan | undefined = candidates.find((day) => day.excursionOffer) ?? candidates.at(-1)
  const [step, setStep] = useState<'info' | 'day'>('info')
  const [dayId, setDayId] = useState<string | null>(proposed?.id ?? null)

  const confirm = () => {
    const day = route.days.find((candidate) => candidate.id === dayId)
    if (!day) return
    withUndo(`Día ${day.dayNumber}: ${placeOf(excursion)}`, () => {
      convertDayType(day.id, 'excursion')
      selectDayExcursion(day.id, excursion.id)
    })
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-bg-card pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        {step === 'info' ? (
          <>
            <div className="relative h-44 w-full overflow-hidden rounded-t-[28px] bg-bg-hover">
              {photo && <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            </div>
            <div className="px-6 pt-5">
              <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">{lengthLabel(excursion)}</p>
              <h2 className="mt-1.5 font-display text-[26px] leading-[1.12] text-text">{placeOf(excursion)}</h2>
              {excursion.description && <p className="mt-2 text-[14px] leading-[1.5] text-text/70">{excursion.description}</p>}
              {excursion.meetingPoint && <p className="mt-2 text-[12.5px] text-text/55">Salida: {excursion.meetingPoint}</p>}
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={onClose} className="h-12 flex-1 rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
                  Cerrar
                </button>
                <button type="button" disabled={candidates.length === 0} onClick={() => setStep('day')} className="h-12 flex-1 rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40">
                  Elegir esta excursión
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 pt-6">
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">{placeOf(excursion)}</p>
            <h2 className="mt-2 font-display text-[24px] leading-[1.15] text-text">¿Qué día la haces?</h2>
            <p className="mt-1 text-[13px] text-text/60">Ese día pasa a ser la excursión. El resto del viaje se queda como está.</p>
            <div className="mt-4 flex flex-col gap-2">
              {candidates.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setDayId(day.id)}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${dayId === day.id ? 'border-accent bg-accent-soft/60' : 'border-text/[.1] hover:bg-bg-hover'}`}
                >
                  <span className="font-display text-[20px] leading-none text-text">{day.dayNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-text">{day.curatedTitle ?? day.title ?? day.city}</span>
                  {day.id === proposed?.id && <span className="shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-[.1em] text-accent">Te proponemos este</span>}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setStep('info')} className="h-12 flex-1 rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
                Atrás
              </button>
              <button type="button" disabled={!dayId} onClick={confirm} className="h-12 flex-1 rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40">
                Cambiar el día
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** "Ver todas las excursiones": la lista entera, sin precios. */
function AllExcursionsSheet({ route, onPick, onClose }: { route: Route; onPick: (excursion: Excursion) => void; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] bg-bg-card px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Excursiones</p>
        <h2 className="mt-2 font-display text-[24px] leading-[1.15] text-text">Sal de {route.destination} un día</h2>
        <div className="mt-4 flex flex-col divide-y divide-text/[.08]">
          {catalogOf(route).map((excursion) => (
            <button key={excursion.id} type="button" onClick={() => onPick(excursion)} className="flex items-center gap-3 py-3 text-left">
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[17px] leading-[1.2] text-text">{placeOf(excursion)}</span>
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[.1em] text-text/50">{lengthLabel(excursion)}</span>
              </span>
              <span className="shrink-0 text-[12.5px] font-semibold text-accent">Ver ›</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 h-12 w-full rounded-full border border-text/15 text-[15px] font-medium text-text transition-colors hover:bg-bg-hover">
          Cerrar
        </button>
      </div>
    </div>,
    document.body,
  )
}

/**
 * "Un día fuera de Roma" (PROMPT_UI, Parte 2: "Excursión B · Tres destinos"): al final de la lista de días, solo si el
 * viaje no lleva ya un día de excursión. Tres escapadas con foto; tocar una abre su ficha y, al elegirla, se pregunta qué
 * día se cambia. Sin precios.
 */
export function TripExcursionCard({ route }: { route: Route }) {
  const [open, setOpen] = useState<Excursion | null>(null)
  const [all, setAll] = useState(false)
  const highlights = highlightsOf(route)
  if (highlights.length === 0 || route.days.some((day) => (day.dayType ?? 'normal') === 'excursion')) return null
  return (
    <section className="ml-2.5 rounded-3xl border border-text/[.06] bg-bg-card p-4 shadow-[0_1px_2px_rgba(28,34,48,.05),0_12px_30px_-20px_rgba(28,34,48,.3)]">
      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Un día fuera de {route.destination}</p>
      <h2 className="mt-1 font-display text-[24px] leading-[1.1] text-text">Sal de {route.destination} un día</h2>
      <p className="mt-1 text-[13px] leading-[1.45] text-text/65">Cambia uno de tus días por una de estas escapadas. El resto del viaje se queda como está.</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {highlights.map((excursion) => (
          <ExcursionTile key={excursion.id} excursion={excursion} country={route.country || route.destination} onOpen={() => setOpen(excursion)} />
        ))}
      </div>
      <button type="button" onClick={() => setAll(true)} className="mt-3 h-11 w-full rounded-full border-[1.5px] border-accent text-[14px] font-semibold text-accent transition-colors hover:bg-accent-soft">
        Ver todas las excursiones
      </button>
      {all && (
        <AllExcursionsSheet
          route={route}
          onClose={() => setAll(false)}
          onPick={(excursion) => {
            setAll(false)
            setOpen(excursion)
          }}
        />
      )}
      {open && <ExcursionSheet route={route} excursion={open} onClose={() => setOpen(null)} />}
    </section>
  )
}
