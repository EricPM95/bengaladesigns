import type { Place, Route } from '../../lib/types'
import { EXPERIENCE_CATEGORY_BANK } from '../../lib/experienceCategoryBank'
import { useRouteStore } from '../../store/useRouteStore'
import type { GenerationResumeState } from '../../lib/routeGenerationOrchestrator'
import type { GenerationStatus } from '../../lib/useRouteGeneration'
import { cityCode } from './cityCode'
import { AMBER, Cta, GhostButton, INK, MONO, SEASON_FX, SERIF, Title } from './trazoUi'

const MS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const COMPANION: Record<string, string> = { solo: 'Solo', couple: 'En pareja', group: 'Con amigos', family: 'En familia' }

/** Las paradas "de verdad" de la ruta: sin las de paso, sin las nocturnas y sin las pausas. */
export function countRealStops(route: Route): number {
  return route.days.reduce((sum, day) => sum + day.stops.filter((stop) => !stop.passThrough && !stop.isNightExperience && !stop.isBreak).length, 0)
}

/** Progreso de 0 a 1 a partir de las fases reales de la generación. */
function progressOf(status: GenerationStatus, checkpoint: GenerationResumeState | null): number {
  if (status === 'done') return 1
  if (!checkpoint) return 0.06
  switch (checkpoint.phase) {
    case 'skeleton':
      return 0.15
    case 'places':
      return 0.35
    case 'blocks':
      return 0.35 + 0.55 * (checkpoint.totalBlocks ? checkpoint.completedBlocks / checkpoint.totalBlocks : 0)
    default:
      return 0.94
  }
}

function datesLabel(dateRange: { start: string; end: string } | undefined, month: number | undefined): string {
  if (dateRange) {
    const [, sm, sd] = dateRange.start.split('-').map(Number)
    const [, em, ed] = dateRange.end.split('-').map(Number)
    return `${sd} ${MS[sm - 1]} – ${ed} ${MS[em - 1]}`
  }
  return month !== undefined ? `${MONTHS[month]} · flexible` : '—'
}

interface StepSummaryProps {
  origin: Place | null
  destination: Place | null
  status: GenerationStatus
  checkpoint: GenerationResumeState | null
  route: Route | null
  errorMessage: string | undefined
  onRetry: () => void
  onOpen: () => void
}

/**
 * Tu viaje: el resumen con los datos reales mientras la ruta se genera (fases reales, no una animación
 * inventada). Al terminar, el número real de paradas de la ruta generada y "VER MI RUTA" para abrirla.
 */
export function StepSummary({ origin, destination, status, checkpoint, route, errorMessage, onRetry, onOpen }: StepSummaryProps) {
  const answers = useRouteStore((state) => state.answers)
  const transportOption = useRouteStore((state) => state.transport_option)
  const vehicleType = useRouteStore((state) => state.vehicle_type)
  const vehicleOwnership = useRouteStore((state) => state.vehicle_ownership)
  const curatedNames = useRouteStore((state) => state.selected_curated_place_names)
  const selectedIds = useRouteStore((state) => state.selected_place_ids)

  const progress = progressOf(status, checkpoint)
  const chosen = curatedNames.length + selectedIds.length
  const modeName = transportOption
    ? transportOption.id === 'own_vehicle' || transportOption.includes_vehicle
      ? vehicleType === 'camper'
        ? 'Camper'
        : 'Tu coche'
      : `${transportOption.title}${vehicleType === 'car' && vehicleOwnership === 'rental' ? ' + coche' : vehicleType === 'camper' ? ' + camper' : ''}`
    : '—'
  const experiences = EXPERIENCE_CATEGORY_BANK.filter((category) => (answers.experiencesPositive ?? []).includes(category.id)).map((category) => category.title)
  const days = answers.days ?? 0
  const stops = route ? countRealStops(route) : null

  const summary = [
    { k: 'Transporte', v: modeName },
    { k: 'Fechas', v: datesLabel(answers.dateRange, answers.month) },
    { k: 'Estación', v: answers.season ? SEASON_FX[answers.season].name : '—' },
    { k: 'Compañía', v: answers.companion ? COMPANION[answers.companion] : '—' },
    { k: 'Ritmo', v: answers.pace === 'zen' ? 'Tranquilo' : 'Completo' },
    { k: 'Duración', v: `${days} ${days === 1 ? 'día' : 'días'}` },
    { k: 'Lugares', v: chosen ? `${chosen} ${chosen === 1 ? 'lugar elegido' : 'lugares elegidos'}` : '—' },
    { k: 'Experiencias', v: experiences.join(' · ') || '—' },
  ]

  const statusText =
    status === 'error'
      ? errorMessage ?? 'No se pudo generar la ruta.'
      : status === 'done' && stops !== null
        ? `${days} ${days === 1 ? 'día' : 'días'} · ${stops} paradas a tu medida`
        : progress > 0.66
          ? 'Ajustando al ritmo elegido…'
          : progress > 0.3
            ? `Buscando planes para ${answers.companion ? COMPANION[answers.companion].toLowerCase() : 'ti'}…`
            : 'Cruzando fechas y estación…'

  return (
    <>
      <div style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.14em', color: AMBER, textTransform: 'uppercase' }}>Tu viaje</div>
      <Title>{status === 'done' ? 'Tu viaje está listo.' : status === 'error' ? 'Algo ha fallado.' : 'Trazando tu ruta…'}</Title>
      <div style={{ flex: 1, minHeight: 12 }} />
      <div style={{ background: 'rgba(12,16,26,.82)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(243,238,228,.1)', borderRadius: 26, overflow: 'hidden', color: INK }}>
        <div style={{ padding: '20px 20px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ font: `400 50px/1 ${SERIF}` }}>{cityCode(origin)}</div>
            <div style={{ marginTop: 4, font: "400 12px 'Geist'", color: 'rgba(243,238,228,.62)' }}>{origin?.name}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ font: `500 10px ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: AMBER }}>{transportOption?.title ?? ''}</span>
            <div style={{ width: '100%', borderTop: '1px dashed rgba(243,238,228,.35)' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: `400 50px/1 ${SERIF}`, color: AMBER }}>{cityCode(destination)}</div>
            <div style={{ marginTop: 4, font: "400 12px 'Geist'", color: 'rgba(243,238,228,.62)' }}>{destination?.name}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px dashed rgba(243,238,228,.16)', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
          {summary.map((field) => (
            <div key={field.k} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ font: `500 10px ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(243,238,228,.5)' }}>{field.k}</span>
              <span style={{ font: "400 15px 'Geist'" }}>{field.v}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 3, borderRadius: 3, background: 'rgba(243,238,228,.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: status === 'error' ? 'oklch(0.7 0.16 25)' : AMBER, transition: 'width .8s cubic-bezier(.2,.8,.2,1)' }} />
          </div>
          <span style={{ font: `500 11px ${MONO}`, letterSpacing: '.06em', color: 'rgba(243,238,228,.62)' }}>{statusText}</span>
        </div>
      </div>
      {status === 'error' ? (
        <GhostButton onClick={onRetry} style={{ marginTop: 12 }}>
          Reintentar
        </GhostButton>
      ) : (
        <Cta onClick={onOpen} enabled={status === 'done' && Boolean(route)} style={{ marginTop: 12, letterSpacing: '.08em' }}>
          VER MI RUTA
        </Cta>
      )}
    </>
  )
}
