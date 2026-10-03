import { useEffect, useState } from 'react'
import type { DateRange, ExperienceCategoryId, Season } from '../../lib/types'
import { EXPERIENCE_CATEGORY_BANK, MAX_POSITIVE_CATEGORIES, isCategoryVisible } from '../../lib/experienceCategoryBank'
import { fetchSeasonalWindows, seasonStatus, type SeasonalWindow } from '../../lib/seasonalAvailability'
import { ACCENT, AMBER, Cta, DARK, Em, INK, MONO, SERIF, Title } from './trazoUi'

const LOCKED: ExperienceCategoryId = 'imprescindibles'

interface StepExperiencesProps {
  destinationName: string
  season: Season | undefined
  month: number | undefined
  dateRange: DateRange | undefined
  selected: ExperienceCategoryId[]
  onChange: (selected: ExperienceCategoryId[]) => void
  onNext: () => void
}

/** Mercadillos solo en invierno: con fechas manda el mes real (nov-dic); sin fechas, la estación. Solo para los destinos sin
 * ventana propia: con ventana (`experience_availability`), manda ella (Roma: del 16 de noviembre al 21 de enero, con aviso en los márgenes). */
function isWinterTrip(season: Season | undefined, dateRange: DateRange | undefined): boolean {
  if (dateRange?.start) {
    const month = Number(dateRange.start.slice(5, 7))
    return month === 11 || month === 12
  }
  return season === 'winter'
}

/**
 * 05 — Experiencias: nuestras categorías (sin números de lugares). "Imprescindibles" va siempre
 * marcada y bloqueada; se pueden añadir hasta 2 más, o ninguna. Las de temporada siguen las ventanas
 * del destino (seasonalAvailability) y, sin ventana, la regla de invierno de siempre.
 */
export function StepExperiences({ destinationName, season, month, dateRange, selected, onChange, onNext }: StepExperiencesProps) {
  const [windows, setWindows] = useState<Record<string, SeasonalWindow>>({})
  useEffect(() => {
    let alive = true
    fetchSeasonalWindows(destinationName).then((result) => {
      if (alive) setWindows(result)
    })
    return () => {
      alive = false
    }
  }, [destinationName])

  const winter = isWinterTrip(season, dateRange)
  const statusOf = (id: ExperienceCategoryId) => seasonStatus(windows[id], month, dateRange)
  const shown = EXPERIENCE_CATEGORY_BANK.filter((category) =>
    windows[category.id] ? statusOf(category.id).status !== 'out' : isCategoryVisible(category, winter ? 'winter' : season),
  )
  // El Free Tour, segundo, justo debajo de Imprescindibles y con la etiqueta «Recomendado» (solo cambia el orden en que se ven).
  const freeTour = shown.find((category) => category.id === 'free_tour')
  const rest = shown.filter((category) => category.id !== 'free_tour')
  const visible = freeTour ? [...rest.slice(0, 1), freeTour, ...rest.slice(1)] : shown

  // Imprescindibles siempre dentro, y fuera lo que ya no cabe en el mes elegido.
  useEffect(() => {
    const visibleIds = visible.map((category) => category.id)
    const next = [LOCKED, ...selected.filter((id) => id !== LOCKED && visibleIds.includes(id))].slice(0, MAX_POSITIVE_CATEGORIES)
    if (next.length !== selected.length || next.some((id, i) => id !== selected[i])) onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows, month, winter, dateRange?.start, dateRange?.end, selected.join(',')])

  const full = selected.length >= MAX_POSITIVE_CATEGORIES
  const toggle = (id: ExperienceCategoryId) => {
    if (id === LOCKED) return
    if (selected.includes(id)) onChange(selected.filter((existing) => existing !== id))
    else if (!full) onChange([...selected, id])
  }

  const descriptionOf = (id: ExperienceCategoryId, fallback: string) => {
    if (id === 'imprescindibles') return `Lo que no te puedes perder en ${destinationName}`
    if (id === 'free_tour') return `Ideal si es tu primera vez en ${destinationName}: un guía local te descubre la ciudad a pie.`
    // Lo que esa experiencia es en este destino, si el destino lo dice (los mercadillos de Roma: Navona, los belenes y las luces).
    return windows[id]?.descripcion ?? fallback
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: ACCENT, textTransform: 'uppercase' }}>05 — Experiencias</span>
        <span style={{ font: `500 11px ${MONO}`, letterSpacing: '.08em', color: 'rgba(28,34,48,.7)' }}>
          {selected.length}/{MAX_POSITIVE_CATEGORIES}
        </span>
      </div>
      <Title>
        Elige tus <Em>favoritas</Em>
      </Title>
      <p style={{ margin: '10px 0 0', font: "400 14px/1.4 'Geist'", color: 'rgba(28,34,48,.72)' }}>
        Imprescindibles ya va incluido. Añade hasta 2 más… o ninguna: tu viaje será igual de único, nosotros nos encargamos.
      </p>
      <div className="trazo-noscroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0 12px' }}>
        {visible.map((category, index) => {
          const active = selected.includes(category.id)
          const locked = category.id === LOCKED
          const dimmed = !active && full
          const notice = windows[category.id] ? statusOf(category.id).notice : null
          return (
            <button
              key={category.id}
              type="button"
              className="trazo-press"
              onClick={() => toggle(category.id)}
              aria-pressed={active}
              style={{
                opacity: dimmed ? 0.35 : 1,
                cursor: locked ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                flex: 1,
                minHeight: 64,
                maxHeight: 104,
                borderRadius: 20,
                border: `1px solid ${active ? AMBER : 'rgba(28,34,48,.1)'}`,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '10px 16px',
                textAlign: 'left',
                color: active ? DARK : INK,
                transition: 'color .45s,border-color .45s,opacity .4s',
              }}
            >
              <span style={{ position: 'absolute', inset: 0, background: AMBER, transformOrigin: 'left center', transform: active ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform .65s cubic-bezier(.2,.8,.2,1)' }} />
              <span style={{ position: 'relative', font: `500 11px ${MONO}`, opacity: 0.7, width: 20 }}>{String(index + 1).padStart(2, '0')}</span>
              <span style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ font: `400 25px/1 ${SERIF}` }}>{category.title}</span>
                  {category.id === 'free_tour' && (
                    <span
                      style={{
                        flex: 'none',
                        padding: '3px 8px',
                        borderRadius: 999,
                        font: `500 10px/1 ${MONO}`,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        background: active ? 'rgba(255,255,255,.2)' : 'rgba(255,190,30,.22)',
                        color: active ? DARK : INK,
                        transition: 'background .45s,color .45s',
                      }}
                    >
                      Recomendado
                    </span>
                  )}
                </span>
                <span style={{ font: "400 12.5px/1.3 'Geist'", opacity: 0.78 }}>{descriptionOf(category.id, category.description)}</span>
                {notice && <span style={{ font: "400 12px/1.3 'Geist'", opacity: 0.9 }}>{notice}</span>}
              </span>
              <span
                style={{
                  position: 'relative',
                  width: 28,
                  height: 28,
                  flex: 'none',
                  borderRadius: '50%',
                  border: '1.5px solid currentColor',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: "600 14px 'Geist'",
                  background: active ? DARK : 'transparent',
                  color: ACCENT,
                }}
              >
                {locked ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Siempre incluido">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                ) : active ? (
                  '✓'
                ) : (
                  ''
                )}
              </span>
            </button>
          )
        })}
      </div>
      <Cta onClick={onNext}>Continuar</Cta>
    </>
  )
}
