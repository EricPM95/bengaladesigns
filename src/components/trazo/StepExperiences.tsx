import { useEffect, useState } from 'react'
import type { DateRange, ExperienceCategoryId, QuestionnaireAnswers, Season } from '../../lib/types'
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
  /** Días de calendario del viaje (el último es el de la vuelta): con ellos se sabe si hay 1, 1,5, 2 o 2,5 días de ruta. */
  days?: number
  mediaJornada?: QuestionnaireAnswers['mediaJornada']
  onMediaJornada?: (value: QuestionnaireAnswers['mediaJornada']) => void
  onChange: (selected: ExperienceCategoryId[]) => void
  onNext: () => void
}

/** Pastillas de elección única (el medio día del viaje). */
function Pastillas<T extends string>({ opciones, valor, onChange }: { opciones: { id: T; label: string; note?: string }[]; valor: T; onChange: (id: T) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {opciones.map((opcion) => {
        const activa = opcion.id === valor
        return (
          <button
            key={opcion.id}
            type="button"
            className="trazo-press"
            aria-pressed={activa}
            onClick={() => onChange(opcion.id)}
            style={{ padding: '8px 12px', borderRadius: 999, border: `1px solid ${activa ? AMBER : 'rgba(28,34,48,.18)'}`, background: activa ? AMBER : 'rgba(255,255,255,0.85)', color: activa ? DARK : INK, font: "500 13px 'Geist'", cursor: 'pointer' }}
          >
            {opcion.label}
            {opcion.note ? <span style={{ opacity: 0.7, marginLeft: 6, font: `500 11px ${MONO}` }}>{opcion.note}</span> : null}
          </button>
        )
      })}
    </div>
  )
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
export function StepExperiences({ destinationName, season, month, dateRange, selected, days, mediaJornada, onMediaJornada, onChange, onNext }: StepExperiencesProps) {
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
  // Con 3 o 4 días de calendario (2 o 3 de ruta) el viaje puede tener un medio día: se pregunta aquí. Con 1 día o con 1,5, el Free Tour no se ofrece (desde 2 días, sí).
  const puedeTenerMedioDia = days === 3 || days === 4
  const medioDia = puedeTenerMedioDia ? mediaJornada : undefined
  // Tanda 6f, 5: el Free Tour ya no se pregunta aquí; se añade desde la app (RESERVAS o «+ Añadir parada»).
  const shown = EXPERIENCE_CATEGORY_BANK.filter((category) =>
    category.id === 'free_tour' ? false : windows[category.id] ? statusOf(category.id).status !== 'out' : isCategoryVisible(category, winter ? 'winter' : season),
  )
  const visible = shown

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
      {puedeTenerMedioDia && onMediaJornada && (
        <div style={{ margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: ACCENT }}>¿Cómo son tus días?</span>
          <Pastillas
            valor={medioDia ? medioDia.franja : 'enteros'}
            onChange={(id) => onMediaJornada(id === 'enteros' ? undefined : { franja: id, ...(id === 'manana' ? { salida: '15:00' } : {}) })}
            opciones={[
              { id: 'enteros', label: days === 3 ? 'Dos días enteros' : 'Tres días enteros' },
              { id: 'tarde', label: days === 3 ? 'Un día y medio: llego a mediodía' : 'Dos días y medio: llego a mediodía' },
              { id: 'manana', label: days === 3 ? 'Un día y medio: me voy a mediodía' : 'Dos días y medio: me voy a mediodía' },
            ]}
          />
        </div>
      )}
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
